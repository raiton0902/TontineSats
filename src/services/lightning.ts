import { createHash, randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { sandboxSecrets } from '../db/schema.js'

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'

export function sha256Hex(hex: string): string {
  return createHash('sha256').update(Buffer.from(hex, 'hex')).digest('hex')
}

export function verifyPreimage(paymentHash: string | null | undefined, preimage: string | null | undefined): boolean {
  if (!paymentHash || !preimage) return false
  const cleanHash = paymentHash.trim().toLowerCase()
  const cleanPreimage = preimage.trim().toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(cleanHash) || !/^[0-9a-f]{64}$/.test(cleanPreimage)) return false
  return sha256Hex(cleanPreimage) === cleanHash
}

function encodeFakeBech32Body(seedHex: string, length = 72): string {
  let out = ''
  for (let i = 0; i < length; i += 1) {
    const byte = parseInt(seedHex.slice((i * 2) % seedHex.length, ((i * 2) % seedHex.length) + 2), 16) || i
    out += BECH32_CHARSET[byte % BECH32_CHARSET.length]
  }
  return out
}

export function buildSandboxBolt11(amountSats: number, paymentHash: string): string {
  const nanoBtc = Math.max(1, Math.round(amountSats * 10))
  const timestampPart = encodeFakeBech32Body(paymentHash, 7)
  const tagPart = encodeFakeBech32Body(paymentHash.slice(8) + paymentHash, 64)
  return `lntbs${nanoBtc}n1p${timestampPart}pp5${tagPart}`
}

export async function storeSandboxPreimage(paymentHash: string, preimage: string): Promise<void> {
  await db
    .insert(sandboxSecrets)
    .values({ key: `preimage:${paymentHash}`, value: preimage })
    .onConflictDoUpdate({
      target: sandboxSecrets.key,
      set: { value: preimage },
    })
}

export async function lookupSandboxPreimage(paymentHash: string): Promise<string | null> {
  const row = await db.query.sandboxSecrets?.findFirst?.({
    where: eq(sandboxSecrets.key, `preimage:${paymentHash}`),
  })
  if (row) return row.value
  const rows = await db
    .select()
    .from(sandboxSecrets)
    .where(eq(sandboxSecrets.key, `preimage:${paymentHash}`))
    .limit(1)
  return rows[0]?.value ?? null
}

async function tryLnurlPay(
  lightningAddress: string,
  amountSats: number,
  memo: string,
): Promise<{ bolt11: string; paymentHash: string } | null> {
  const match = /^([^@\s]+)@([^@\s]+)$/.exec(lightningAddress.trim())
  if (!match) return null
  const [, user, domain] = match
  if (domain.endsWith('.local') || domain.endsWith('.example') || domain === 'localhost') {
    return null
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 4500)
  try {
    const metaRes = await fetch(`https://${domain}/.well-known/lnurlp/${encodeURIComponent(user)}`, {
      signal: controller.signal,
    })
    if (!metaRes.ok) return null
    const meta = (await metaRes.json()) as {
      callback?: string
      minSendable?: number
      maxSendable?: number
      commentAllowed?: number
    }
    if (!meta.callback) return null
    const amountMsat = amountSats * 1000
    if (meta.minSendable && amountMsat < meta.minSendable) return null
    if (meta.maxSendable && amountMsat > meta.maxSendable) return null

    const callbackUrl = new URL(meta.callback)
    callbackUrl.searchParams.set('amount', String(amountMsat))
    if (meta.commentAllowed && meta.commentAllowed > 0) {
      callbackUrl.searchParams.set('comment', memo.slice(0, meta.commentAllowed))
    }

    const invRes = await fetch(callbackUrl.toString(), { signal: controller.signal })
    if (!invRes.ok) return null
    const invData = (await invRes.json()) as { pr?: string }
    if (!invData.pr) return null

    const paymentHash = createHash('sha256').update(invData.pr).digest('hex')
    return { bolt11: invData.pr, paymentHash }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function tryLnbitsInvoice(
  amountSats: number,
  memo: string,
  apiKeyOverride?: string | null,
): Promise<{ bolt11: string; paymentHash: string } | null> {
  const lnbitsUrl = process.env.LNBITS_URL?.trim()
  const apiKey = apiKeyOverride?.trim() || process.env.LNBITS_API_KEY?.trim()
  if (!lnbitsUrl || !apiKey) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 4500)
  try {
    const res = await fetch(`${lnbitsUrl.replace(/\/+$/, '')}/api/v1/payments`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        out: false,
        amount: amountSats,
        memo,
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { payment_request?: string; payment_hash?: string }
    if (!data.payment_request || !data.payment_hash) return null
    return {
      bolt11: data.payment_request,
      paymentHash: data.payment_hash,
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export interface CreatedDirectInvoice {
  bolt11: string
  paymentHash: string
  isSandbox: boolean
}

export async function createDirectInvoice({
  beneficiaryLightningAddress,
  amountSats,
  memo,
}: {
  beneficiaryLightningAddress?: string | null
  amountSats: number
  memo: string
}): Promise<CreatedDirectInvoice> {
  if (beneficiaryLightningAddress && process.env.ENABLE_LIVE_LNURL !== 'false') {
    const lnurl = await tryLnurlPay(beneficiaryLightningAddress, amountSats, memo)
    if (lnurl) {
      return { ...lnurl, isSandbox: false }
    }
  }

  const lnbits = await tryLnbitsInvoice(amountSats, memo)
  if (lnbits) {
    return { ...lnbits, isSandbox: false }
  }

  // Deterministic verifiable sandbox fallback: real SHA-256 preimage/hash pair
  const preimage = randomBytes(32).toString('hex')
  const paymentHash = sha256Hex(preimage)
  const bolt11 = buildSandboxBolt11(amountSats, paymentHash)
  await storeSandboxPreimage(paymentHash, preimage)

  return {
    bolt11,
    paymentHash,
    isSandbox: true,
  }
}

export async function checkLnbitsSettlement(paymentHash: string): Promise<{ paid: boolean; preimage?: string }> {
  const lnbitsUrl = process.env.LNBITS_URL?.trim()
  const apiKey = process.env.LNBITS_API_KEY?.trim()
  if (!lnbitsUrl || !apiKey) return { paid: false }

  try {
    const res = await fetch(`${lnbitsUrl.replace(/\/+$/, '')}/api/v1/payments/${encodeURIComponent(paymentHash)}`, {
      headers: { 'X-Api-Key': apiKey },
    })
    if (!res.ok) return { paid: false }
    const data = (await res.json()) as { paid?: boolean; preimage?: string }
    return { paid: Boolean(data.paid), preimage: data.preimage }
  } catch {
    return { paid: false }
  }
}

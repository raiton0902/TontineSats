import * as nip19 from 'nostr-tools/nip19'
import { SimplePool } from 'nostr-tools/pool'
import { finalizeEvent, verifyEvent, type Event, type EventTemplate, type VerifiedEvent } from 'nostr-tools/pure'

export const RECEIPT_KIND = 30078

export const DEFAULT_NOSTR_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
]

export interface ReceiptPayload {
  circleId: string
  circleName: string
  roundNumber: number
  payerNpub: string
  beneficiaryNpub: string
  amountXof: number
  amountSats: number
  paymentHash: string
  paymentPreimage: string
  paidAt: number
}

export function npubToHex(npub: string): string {
  const trimmed = npub.trim()
  if (/^[0-9a-f]{64}$/i.test(trimmed)) return trimmed.toLowerCase()
  const decoded = nip19.decode(trimmed)
  if (decoded.type !== 'npub') throw new Error('Invalid npub')
  return decoded.data
}

export function nsecToBytes(nsec: string): Uint8Array {
  const trimmed = nsec.trim()
  if (/^[0-9a-f]{64}$/i.test(trimmed)) {
    const out = new Uint8Array(32)
    for (let i = 0; i < 32; i += 1) {
      out[i] = parseInt(trimmed.slice(i * 2, i * 2 + 2), 16)
    }
    return out
  }
  const decoded = nip19.decode(trimmed)
  if (decoded.type !== 'nsec') throw new Error('Invalid nsec')
  return decoded.data
}

export function buildReceiptTemplate(payload: ReceiptPayload): EventTemplate {
  const payerHex = npubToHex(payload.payerNpub)
  const beneficiaryHex = npubToHex(payload.beneficiaryNpub)
  return {
    kind: RECEIPT_KIND,
    created_at: Math.floor(payload.paidAt / 1000),
    tags: [
      ['d', `tontinesats:${payload.circleId}:r${payload.roundNumber}:${payload.payerNpub}`],
      ['t', 'tontinesats-receipt'],
      ['p', payerHex],
      ['beneficiary', beneficiaryHex],
      ['circle', payload.circleId],
      ['round', String(payload.roundNumber)],
      ['payment_hash', payload.paymentHash],
      ['amount_xof', String(payload.amountXof)],
      ['amount_sats', String(payload.amountSats)],
    ],
    content: JSON.stringify({
      protocol: 'tontinesats/v1',
      circleId: payload.circleId,
      circleName: payload.circleName,
      roundNumber: payload.roundNumber,
      payerNpub: payload.payerNpub,
      beneficiaryNpub: payload.beneficiaryNpub,
      amountXof: payload.amountXof,
      amountSats: payload.amountSats,
      paymentHash: payload.paymentHash,
      paymentPreimage: payload.paymentPreimage,
      paidAt: payload.paidAt,
    }),
  }
}

export function signReceiptEvent(payload: ReceiptPayload, signerSecret: Uint8Array): VerifiedEvent {
  const template = buildReceiptTemplate(payload)
  return finalizeEvent(template, signerSecret)
}

export function verifyReceiptEvent(raw: Event | null | undefined): boolean {
  if (!raw || typeof raw !== 'object') return false
  try {
    const clean: Event = {
      id: String(raw.id),
      pubkey: String(raw.pubkey),
      created_at: Number(raw.created_at),
      kind: Number(raw.kind),
      tags: Array.isArray(raw.tags) ? raw.tags.map((tag) => tag.map(String)) : [],
      content: String(raw.content),
      sig: String(raw.sig),
    }
    if (clean.kind !== RECEIPT_KIND) return false
    return verifyEvent(clean)
  } catch {
    return false
  }
}

export async function publishReceiptToRelays(
  event: Event,
  options?: { relays?: string[]; skipPublish?: boolean; timeoutMs?: number },
): Promise<{ published: string[] }> {
  if (options?.skipPublish) return { published: [] }
  const relays = options?.relays?.length ? options.relays : DEFAULT_NOSTR_RELAYS
  const timeoutMs = options?.timeoutMs ?? 2500
  const pool = new SimplePool()
  try {
    const settled = await Promise.race([
      Promise.allSettled(pool.publish(relays, event)),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ])
    if (!settled) return { published: [] }
    const published = settled
      .map((item, idx) => (item.status === 'fulfilled' ? relays[idx] : null))
      .filter((url): url is string => Boolean(url))
    return { published }
  } catch {
    return { published: [] }
  } finally {
    try {
      pool.close(relays)
    } catch {
      // Ignore relay close errors
    }
  }
}

export interface ReputationRecordInput {
  id: string
  circleId: string
  circleName: string
  roundNumber: number
  beneficiaryNpub: string
  beneficiaryName: string
  payerNpub: string
  amountXof: number
  amountSats: number
  paymentHash: string | null
  paymentPreimage: string | null
  status: string
  dueAt: number
  paidAt: number | null
  nostrReceiptEventId: string | null
  nostrReceiptJson: string | null
}

export interface PortableReceiptSummary {
  id: string
  circleId: string
  circleName: string
  roundNumber: number
  beneficiaryNpub: string
  beneficiaryName: string
  payerNpub: string
  amountXof: number
  amountSats: number
  paymentHash: string
  paymentPreimage: string
  paidAt: number
  onTime: boolean
  nostrReceiptEventId: string
  nostrEvent: Event | null
  verified: boolean
}

export function computeReputationStats(rows: ReputationRecordInput[]) {
  const paidRows = rows.filter((row) => row.status === 'paid' && row.paidAt !== null)
  const lateRows = rows.filter((row) => row.status === 'late')

  let onTimeCount = 0
  const receipts: PortableReceiptSummary[] = paidRows
    .map((row) => {
      const paidAt = row.paidAt ?? Date.now()
      // Paid before or on dueAt counts as on-time
      const onTime = paidAt <= row.dueAt + 60_000
      if (onTime) onTimeCount += 1
      let nostrEvent: Event | null = null
      if (row.nostrReceiptJson) {
        try {
          nostrEvent = JSON.parse(row.nostrReceiptJson) as Event
        } catch {
          nostrEvent = null
        }
      }
      return {
        id: row.id,
        circleId: row.circleId,
        circleName: row.circleName,
        roundNumber: row.roundNumber,
        beneficiaryNpub: row.beneficiaryNpub,
        beneficiaryName: row.beneficiaryName,
        payerNpub: row.payerNpub,
        amountXof: row.amountXof,
        amountSats: row.amountSats,
        paymentHash: row.paymentHash ?? '',
        paymentPreimage: row.paymentPreimage ?? '',
        paidAt,
        onTime,
        nostrReceiptEventId: row.nostrReceiptEventId ?? nostrEvent?.id ?? '',
        nostrEvent,
        verified: verifyReceiptEvent(nostrEvent),
      }
    })
    .sort((a, b) => b.paidAt - a.paidAt)

  const denominator = paidRows.length + lateRows.length
  const onTimeRate = denominator === 0 ? 100 : Math.round((onTimeCount / denominator) * 100)
  const circleIds = new Set(rows.map((r) => r.circleId))

  return {
    totalPaidRounds: paidRows.length,
    onTimeRate,
    circlesCount: circleIds.size,
    receipts,
  }
}

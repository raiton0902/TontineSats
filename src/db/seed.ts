import { randomBytes, randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { eq } from 'drizzle-orm'
import * as nip19 from 'nostr-tools/nip19'
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import { db, initDb } from './index.js'
import { circles, contributions, memberships, rounds, sandboxSecrets, users } from './schema.js'
import { encryptSecret } from '../services/crypto-vault.js'
import { buildSandboxBolt11, sha256Hex } from '../services/lightning.js'
import { FALLBACK_SATS_PER_XOF, xofToSats } from '../services/rates.js'
import { nsecToBytes, signReceiptEvent } from '../lib/nostr.js'

export interface SeededPersona {
  id: 'awa' | 'moussa' | 'fatou'
  name: string
  initials: string
  city: string
  role: string
  npub: string
  nsec: string
  locale: 'fr' | 'en' | 'wo'
  lightningAddress: string
  paymentMethod: 'nwc_auto' | 'manual_qr'
  currency: 'xof' | 'eur'
}

export interface SeedDemoResult {
  circleId: string
  inviteCode: string
  personas: SeededPersona[]
}

const DEMO_CIRCLE_ID = 'demo-circle-sandaga-001'
const DEMO_INVITE_CODE = 'SNDG24'

function makePersonaKeypair() {
  const sk = generateSecretKey()
  const pk = getPublicKey(sk)
  return {
    nsec: nip19.nsecEncode(sk),
    npub: nip19.npubEncode(pk),
    secretBytes: sk,
  }
}

export async function getSandboxSignerForNpub(npub: string): Promise<Uint8Array | null> {
  const rows = await db
    .select()
    .from(sandboxSecrets)
    .where(eq(sandboxSecrets.key, `signer:${npub}`))
    .limit(1)
  const nsec = rows[0]?.value
  if (!nsec) return null
  return nsecToBytes(nsec)
}

export async function seedDemoCircle(options: { reset?: boolean } = {}): Promise<SeedDemoResult> {
  await initDb()
  const reset = options.reset ?? false

  const existing = await db
    .select()
    .from(circles)
    .where(eq(circles.id, DEMO_CIRCLE_ID))
    .limit(1)

  if (existing.length > 0 && !reset) {
    const existingMembers = await db
      .select({
        npub: users.npub,
        displayName: users.displayName,
        locale: users.locale,
        lightningAddress: users.lightningAddress,
        paymentMethod: memberships.paymentMethod,
        payoutOrder: memberships.payoutOrder,
      })
      .from(memberships)
      .innerJoin(users, eq(memberships.memberNpub, users.npub))
      .where(eq(memberships.circleId, DEMO_CIRCLE_ID))

    const sorted = [...existingMembers].sort((a, b) => a.payoutOrder - b.payoutOrder)
    const personas: SeededPersona[] = []
    const meta: Array<{
      id: 'awa' | 'moussa' | 'fatou'
      initials: string
      city: string
      role: string
      currency: 'xof' | 'eur'
    }> = [
      { id: 'awa', initials: 'AD', city: 'Dakar', role: 'Organisatrice', currency: 'xof' },
      { id: 'moussa', initials: 'MD', city: 'Paris', role: 'Diaspora', currency: 'eur' },
      { id: 'fatou', initials: 'FN', city: 'Thiès', role: 'Membre', currency: 'xof' },
    ]
    for (let idx = 0; idx < sorted.length && idx < meta.length; idx += 1) {
      const m = sorted[idx]
      const info = meta[idx]
      const secretRow = await db
        .select()
        .from(sandboxSecrets)
        .where(eq(sandboxSecrets.key, `signer:${m.npub}`))
        .limit(1)
      personas.push({
        id: info.id,
        name: m.displayName,
        initials: info.initials,
        city: info.city,
        role: info.role,
        npub: m.npub,
        nsec: secretRow[0]?.value ?? '',
        locale: (m.locale as 'fr' | 'en' | 'wo') || 'fr',
        lightningAddress: m.lightningAddress ?? `${info.id}@sandbox.tontinesats.local`,
        paymentMethod: m.paymentMethod as 'nwc_auto' | 'manual_qr',
        currency: info.currency,
      })
    }
    if (personas.length === 3) {
      return {
        circleId: DEMO_CIRCLE_ID,
        inviteCode: existing[0].inviteCode,
        personas,
      }
    }
  }

  // Clean previous demo circle & related rows if resetting or incomplete
  await db.delete(circles).where(eq(circles.id, DEMO_CIRCLE_ID))
  await db.delete(circles).where(eq(circles.inviteCode, DEMO_INVITE_CODE))

  const now = Date.now()
  const amountXof = 24_000
  const amountSats = xofToSats(amountXof, FALLBACK_SATS_PER_XOF)

  const awaKeys = makePersonaKeypair()
  const moussaKeys = makePersonaKeypair()
  const fatouKeys = makePersonaKeypair()

  const personas: SeededPersona[] = [
    {
      id: 'awa',
      name: 'Awa Diop',
      initials: 'AD',
      city: 'Dakar',
      role: 'Organisatrice',
      npub: awaKeys.npub,
      nsec: awaKeys.nsec,
      locale: 'fr',
      lightningAddress: 'awa@sandbox.tontinesats.local',
      paymentMethod: 'nwc_auto',
      currency: 'xof',
    },
    {
      id: 'moussa',
      name: 'Moussa Diallo',
      initials: 'MD',
      city: 'Paris',
      role: 'Diaspora',
      npub: moussaKeys.npub,
      nsec: moussaKeys.nsec,
      locale: 'fr',
      lightningAddress: 'moussa@sandbox.tontinesats.local',
      paymentMethod: 'nwc_auto',
      currency: 'eur',
    },
    {
      id: 'fatou',
      name: 'Fatou Ndiaye',
      initials: 'FN',
      city: 'Thiès',
      role: 'Membre',
      npub: fatouKeys.npub,
      nsec: fatouKeys.nsec,
      locale: 'fr',
      lightningAddress: 'fatou@sandbox.tontinesats.local',
      paymentMethod: 'manual_qr',
      currency: 'xof',
    },
  ]

  for (const persona of personas) {
    await db
      .insert(users)
      .values({
        npub: persona.npub,
        displayName: persona.name,
        locale: persona.locale,
        lightningAddress: persona.lightningAddress,
        nwcUriEncrypted:
          persona.paymentMethod === 'nwc_auto'
            ? encryptSecret(`sandbox://nwc/${persona.id}`)
            : null,
        createdAt: now - 30 * 24 * 60 * 60 * 1000,
      })
      .onConflictDoUpdate({
        target: users.npub,
        set: {
          displayName: persona.name,
          lightningAddress: persona.lightningAddress,
          nwcUriEncrypted:
            persona.paymentMethod === 'nwc_auto'
              ? encryptSecret(`sandbox://nwc/${persona.id}`)
              : null,
        },
      })

    await db
      .insert(sandboxSecrets)
      .values({ key: `signer:${persona.npub}`, value: persona.nsec })
      .onConflictDoUpdate({
        target: sandboxSecrets.key,
        set: { value: persona.nsec },
      })
  }

  const circleName = 'Tontine Marché Sandaga'
  await db.insert(circles).values({
    id: DEMO_CIRCLE_ID,
    name: circleName,
    organizerNpub: awaKeys.npub,
    amountXof,
    frequency: 'monthly',
    status: 'active',
    inviteCode: DEMO_INVITE_CODE,
    createdAt: now - 30 * 24 * 60 * 60 * 1000,
  })

  for (let i = 0; i < personas.length; i += 1) {
    const persona = personas[i]
    await db.insert(memberships).values({
      id: randomUUID(),
      circleId: DEMO_CIRCLE_ID,
      memberNpub: persona.npub,
      payoutOrder: i + 1,
      paymentMethod: persona.paymentMethod,
      joinedAt: now - (30 - i) * 24 * 60 * 60 * 1000,
    })
  }

  // Round 1: completed (Awa Diop received pot; Moussa & Fatou paid with real SHA-256 preimages + signed kind 30078 receipts)
  const round1Id = `${DEMO_CIRCLE_ID}-round-1`
  const round1DueAt = now - 20 * 24 * 60 * 60 * 1000
  await db.insert(rounds).values({
    id: round1Id,
    circleId: DEMO_CIRCLE_ID,
    roundNumber: 1,
    beneficiaryNpub: awaKeys.npub,
    dueAt: round1DueAt,
    exchangeRateSatsPerXof: FALLBACK_SATS_PER_XOF,
    status: 'completed',
  })

  for (const payer of [moussaKeys, fatouKeys]) {
    const preimage = randomBytes(32).toString('hex')
    const paymentHash = sha256Hex(preimage)
    const bolt11 = buildSandboxBolt11(amountSats, paymentHash)
    const paidAt = round1DueAt - 2 * 60 * 60 * 1000
    const receiptEvent = signReceiptEvent(
      {
        circleId: DEMO_CIRCLE_ID,
        circleName,
        roundNumber: 1,
        payerNpub: payer.npub,
        beneficiaryNpub: awaKeys.npub,
        amountXof,
        amountSats,
        paymentHash,
        paymentPreimage: preimage,
        paidAt,
      },
      awaKeys.secretBytes,
    )

    await db.insert(contributions).values({
      id: randomUUID(),
      roundId: round1Id,
      payerNpub: payer.npub,
      amountXof,
      amountSats,
      bolt11Invoice: bolt11,
      paymentHash,
      paymentPreimage: preimage,
      status: 'paid',
      nostrReceiptEventId: receiptEvent.id,
      nostrReceiptJson: JSON.stringify(receiptEvent),
      paidAt,
    })
  }

  // Round 2: open (Moussa Diallo is beneficiary; Awa [NWC] & Fatou [QR] ready to contribute)
  const round2Id = `${DEMO_CIRCLE_ID}-round-2`
  const round2DueAt = now + 24 * 60 * 60 * 1000
  await db.insert(rounds).values({
    id: round2Id,
    circleId: DEMO_CIRCLE_ID,
    roundNumber: 2,
    beneficiaryNpub: moussaKeys.npub,
    dueAt: round2DueAt,
    exchangeRateSatsPerXof: FALLBACK_SATS_PER_XOF,
    status: 'open',
  })

  for (const payer of [awaKeys, fatouKeys]) {
    await db.insert(contributions).values({
      id: randomUUID(),
      roundId: round2Id,
      payerNpub: payer.npub,
      amountXof,
      amountSats,
      status: 'pending',
    })
  }

  return {
    circleId: DEMO_CIRCLE_ID,
    inviteCode: DEMO_INVITE_CODE,
    personas,
  }
}

const isCli = process.argv[1] && pathResolveMatches(process.argv[1])
function pathResolveMatches(argPath: string): boolean {
  try {
    return fileURLToPath(import.meta.url) === argPath || argPath.endsWith('seed.ts')
  } catch {
    return false
  }
}

if (isCli) {
  seedDemoCircle({ reset: true })
    .then((res) => {
      console.log(`Seeded demo circle ${res.circleId} (${res.inviteCode}) with ${res.personas.length} personas.`)
      process.exit(0)
    })
    .catch((err) => {
      console.error('Seed failed:', err)
      process.exit(1)
    })
}

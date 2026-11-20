import { createHash, randomUUID } from 'node:crypto'
import { asc, eq, and } from 'drizzle-orm'
import type { Event } from 'nostr-tools/pure'
import { db } from '../db/index.js'
import { circles, contributions, memberships, rounds, users } from '../db/schema.js'
import { getSandboxSignerForNpub } from '../db/seed.js'
import {
  computeReputationStats,
  nsecToBytes,
  publishReceiptToRelays,
  signReceiptEvent,
  verifyReceiptEvent,
} from '../lib/nostr.js'
import {
  checkLnbitsSettlement,
  createDirectInvoice,
  lookupSandboxPreimage,
  verifyPreimage,
} from '../services/lightning.js'
import { payInvoiceViaNwc } from '../services/nwc.js'
import { getExchangeRates, xofToSats } from '../services/rates.js'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function computeDueAt(frequency: string, fromMs = Date.now()): number {
  if (frequency === 'demo_5min') return fromMs + 5 * 60 * 1000
  if (frequency === 'weekly') return fromMs + 7 * 24 * 60 * 60 * 1000
  return fromMs + 30 * 24 * 60 * 60 * 1000
}

function getFallbackAttestationSecret(): Uint8Array {
  const configured = process.env.NOSTR_ATTESTATION_NSEC?.trim()
  if (configured) {
    try {
      return nsecToBytes(configured)
    } catch {
      // Fall back to deterministic secret if env var is malformed
    }
  }
  const seed = process.env.NWC_ENCRYPTION_KEY?.trim() || 'tontinesats-attestation-seed-v1'
  return new Uint8Array(createHash('sha256').update(`attestation:${seed}`).digest())
}

async function resolveSignerSecret(beneficiaryNpub: string): Promise<Uint8Array> {
  const sandboxKey = await getSandboxSignerForNpub(beneficiaryNpub)
  if (sandboxKey) return sandboxKey
  return getFallbackAttestationSecret()
}

export async function ensureUserExists(npub: string, displayName?: string) {
  const existing = await db.select().from(users).where(eq(users.npub, npub)).limit(1)
  if (existing[0]) return existing[0]
  const row = {
    npub,
    displayName: displayName?.trim() || `Membre ${npub.slice(0, 8)}`,
    locale: 'fr',
    lightningAddress: null,
    nwcUriEncrypted: null,
    createdAt: Date.now(),
  }
  await db.insert(users).values(row)
  return row
}

export async function ensureRoundInvoice(roundId: string, payerNpub: string) {
  const roundRows = await db.select().from(rounds).where(eq(rounds.id, roundId)).limit(1)
  const round = roundRows[0]
  if (!round) throw new ApiError(404, 'Tour introuvable')
  if (round.status === 'completed') throw new ApiError(400, 'Ce tour est déjà terminé')

  const circleRows = await db.select().from(circles).where(eq(circles.id, round.circleId)).limit(1)
  const circle = circleRows[0]
  if (!circle) throw new ApiError(404, 'Cercle introuvable')

  if (payerNpub === round.beneficiaryNpub) {
    throw new ApiError(400, 'Le bénéficiaire ne cotise pas pour son propre tour')
  }

  const memberRows = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.circleId, circle.id), eq(memberships.memberNpub, payerNpub)))
    .limit(1)
  if (!memberRows[0]) {
    throw new ApiError(403, 'Ce membre ne fait pas partie du cercle')
  }

  const beneficiaryRows = await db
    .select()
    .from(users)
    .where(eq(users.npub, round.beneficiaryNpub))
    .limit(1)
  const beneficiary = beneficiaryRows[0]

  const existingRows = await db
    .select()
    .from(contributions)
    .where(and(eq(contributions.roundId, roundId), eq(contributions.payerNpub, payerNpub)))
    .limit(1)
  let contribution = existingRows[0]

  if (contribution?.status === 'paid') {
    throw new ApiError(400, 'Cette cotisation est déjà payée')
  }

  if (
    contribution &&
    contribution.bolt11Invoice &&
    contribution.paymentHash &&
    (contribution.status === 'invoiced' || contribution.status === 'late')
  ) {
    const isSandbox = Boolean(await lookupSandboxPreimage(contribution.paymentHash))
    return {
      contributionId: contribution.id,
      amountXof: contribution.amountXof,
      amountSats: contribution.amountSats,
      bolt11: contribution.bolt11Invoice,
      paymentHash: contribution.paymentHash,
      isSandbox,
    }
  }

  const amountXof = circle.amountXof
  const amountSats =
    contribution?.amountSats ?? xofToSats(amountXof, round.exchangeRateSatsPerXof)

  const invoice = await createDirectInvoice({
    beneficiaryLightningAddress: beneficiary?.lightningAddress,
    amountSats,
    memo: `${circle.name} · Tour ${round.roundNumber}`,
  })

  if (contribution) {
    await db
      .update(contributions)
      .set({
        amountXof,
        amountSats,
        bolt11Invoice: invoice.bolt11,
        paymentHash: invoice.paymentHash,
        status: contribution.status === 'late' ? 'late' : 'invoiced',
      })
      .where(eq(contributions.id, contribution.id))
  } else {
    const newId = randomUUID()
    await db.insert(contributions).values({
      id: newId,
      roundId,
      payerNpub,
      amountXof,
      amountSats,
      bolt11Invoice: invoice.bolt11,
      paymentHash: invoice.paymentHash,
      status: round.status === 'overdue' ? 'late' : 'invoiced',
    })
    contribution = {
      id: newId,
      roundId,
      payerNpub,
      amountXof,
      amountSats,
      bolt11Invoice: invoice.bolt11,
      paymentHash: invoice.paymentHash,
      paymentPreimage: null,
      status: round.status === 'overdue' ? 'late' : 'invoiced',
      nostrReceiptEventId: null,
      nostrReceiptJson: null,
      paidAt: null,
    }
  }

  return {
    contributionId: contribution.id,
    amountXof,
    amountSats,
    bolt11: invoice.bolt11,
    paymentHash: invoice.paymentHash,
    isSandbox: invoice.isSandbox,
  }
}

export async function checkAndAdvanceRound(roundId: string) {
  const roundRows = await db.select().from(rounds).where(eq(rounds.id, roundId)).limit(1)
  const round = roundRows[0]
  if (!round) return { roundCompleted: false, nextRound: null }

  const roundContributions = await db
    .select()
    .from(contributions)
    .where(eq(contributions.roundId, roundId))

  if (roundContributions.length === 0) return { roundCompleted: false, nextRound: null }
  const allPaid = roundContributions.every((c) => c.status === 'paid')
  if (!allPaid) return { roundCompleted: false, nextRound: null }

  await db.update(rounds).set({ status: 'completed' }).where(eq(rounds.id, roundId))

  const circleRows = await db.select().from(circles).where(eq(circles.id, round.circleId)).limit(1)
  const circle = circleRows[0]
  if (!circle) return { roundCompleted: true, nextRound: null }

  const orderedMembers = await db
    .select()
    .from(memberships)
    .where(eq(memberships.circleId, circle.id))
    .orderBy(asc(memberships.payoutOrder))

  const nextIndex = round.roundNumber // 1-based roundNumber -> next 0-based index
  if (nextIndex >= orderedMembers.length) {
    await db.update(circles).set({ status: 'completed' }).where(eq(circles.id, circle.id))
    return { roundCompleted: true, nextRound: null }
  }

  // Ensure next round isn't already created
  const nextRoundNumber = round.roundNumber + 1
  const existingNext = await db
    .select()
    .from(rounds)
    .where(and(eq(rounds.circleId, circle.id), eq(rounds.roundNumber, nextRoundNumber)))
    .limit(1)

  if (existingNext[0]) {
    return { roundCompleted: true, nextRound: existingNext[0] }
  }

  const rates = await getExchangeRates()
  const nextBeneficiary = orderedMembers[nextIndex].memberNpub
  const nextRoundId = randomUUID()
  const nextRound = {
    id: nextRoundId,
    circleId: circle.id,
    roundNumber: nextRoundNumber,
    beneficiaryNpub: nextBeneficiary,
    dueAt: computeDueAt(circle.frequency),
    exchangeRateSatsPerXof: rates.satsPerXof,
    status: 'open',
  }
  await db.insert(rounds).values(nextRound)

  const amountSats = xofToSats(circle.amountXof, rates.satsPerXof)
  for (const member of orderedMembers) {
    if (member.memberNpub === nextBeneficiary) continue
    await db.insert(contributions).values({
      id: randomUUID(),
      roundId: nextRoundId,
      payerNpub: member.memberNpub,
      amountXof: circle.amountXof,
      amountSats,
      status: 'pending',
    })
  }

  return { roundCompleted: true, nextRound }
}

export async function settleContribution({
  contributionId,
  paymentPreimage,
  signedNostrEvent,
  simulateSandbox,
}: {
  contributionId: string
  paymentPreimage?: string
  signedNostrEvent?: Event
  simulateSandbox?: boolean
}) {
  const rows = await db
    .select()
    .from(contributions)
    .where(eq(contributions.id, contributionId))
    .limit(1)
  const contribution = rows[0]
  if (!contribution) throw new ApiError(404, 'Cotisation introuvable')

  if (contribution.status === 'paid' && contribution.nostrReceiptJson) {
    const existingEvent = JSON.parse(contribution.nostrReceiptJson) as Event
    return {
      contribution,
      receiptEventId: contribution.nostrReceiptEventId ?? existingEvent.id,
      receiptEvent: existingEvent,
      roundCompleted: false,
      nextRound: null,
    }
  }

  if (!contribution.paymentHash) {
    throw new ApiError(400, 'Aucune facture BOLT11 générée pour cette cotisation')
  }

  let resolvedPreimage = paymentPreimage?.trim()
  if (!resolvedPreimage) {
    const lnbits = await checkLnbitsSettlement(contribution.paymentHash)
    if (lnbits.paid && lnbits.preimage) {
      resolvedPreimage = lnbits.preimage
    }
  }
  if (!resolvedPreimage && simulateSandbox) {
    const sandboxPreimage = await lookupSandboxPreimage(contribution.paymentHash)
    if (sandboxPreimage) resolvedPreimage = sandboxPreimage
  }

  if (!verifyPreimage(contribution.paymentHash, resolvedPreimage)) {
    throw new ApiError(400, 'Préimage Lightning invalide ou manquante')
  }

  const roundRows = await db.select().from(rounds).where(eq(rounds.id, contribution.roundId)).limit(1)
  const round = roundRows[0]
  if (!round) throw new ApiError(404, 'Tour introuvable')

  const circleRows = await db.select().from(circles).where(eq(circles.id, round.circleId)).limit(1)
  const circle = circleRows[0]
  if (!circle) throw new ApiError(404, 'Cercle introuvable')

  const paidAt = Date.now()
  let receiptEvent: Event
  if (signedNostrEvent) {
    if (!verifyReceiptEvent(signedNostrEvent)) {
      throw new ApiError(400, 'Signature Nostr kind:30078 invalide')
    }
    receiptEvent = signedNostrEvent
  } else {
    const signerSecret = await resolveSignerSecret(round.beneficiaryNpub)
    receiptEvent = signReceiptEvent(
      {
        circleId: circle.id,
        circleName: circle.name,
        roundNumber: round.roundNumber,
        payerNpub: contribution.payerNpub,
        beneficiaryNpub: round.beneficiaryNpub,
        amountXof: contribution.amountXof,
        amountSats: contribution.amountSats,
        paymentHash: contribution.paymentHash,
        paymentPreimage: resolvedPreimage!,
        paidAt,
      },
      signerSecret,
    )
  }

  await db
    .update(contributions)
    .set({
      paymentPreimage: resolvedPreimage,
      status: 'paid',
      nostrReceiptEventId: receiptEvent.id,
      nostrReceiptJson: JSON.stringify(receiptEvent),
      paidAt,
    })
    .where(eq(contributions.id, contribution.id))

  // Non-blocking best-effort relay publish
  const skipPublish = process.env.DISABLE_NOSTR_PUBLISH === '1'
  const relays = process.env.NOSTR_RELAYS
    ? process.env.NOSTR_RELAYS.split(',').map((s) => s.trim()).filter(Boolean)
    : undefined
  void publishReceiptToRelays(receiptEvent, { skipPublish, relays })

  const updatedRows = await db
    .select()
    .from(contributions)
    .where(eq(contributions.id, contribution.id))
    .limit(1)

  const advancement = await checkAndAdvanceRound(round.id)

  return {
    contribution: updatedRows[0],
    receiptEventId: receiptEvent.id,
    receiptEvent,
    roundCompleted: advancement.roundCompleted,
    nextRound: advancement.nextRound,
  }
}

export async function triggerNwcForRound(
  roundId: string,
  options?: { organizerNpub?: string; payerNpub?: string },
) {
  const roundRows = await db.select().from(rounds).where(eq(rounds.id, roundId)).limit(1)
  const round = roundRows[0]
  if (!round) throw new ApiError(404, 'Tour introuvable')

  const circleRows = await db.select().from(circles).where(eq(circles.id, round.circleId)).limit(1)
  const circle = circleRows[0]
  if (!circle) throw new ApiError(404, 'Cercle introuvable')

  if (options?.organizerNpub && !options?.payerNpub && options.organizerNpub !== circle.organizerNpub) {
    throw new ApiError(403, 'Seul l’organisateur peut déclencher le paiement NWC groupé')
  }

  const circleMembers = await db
    .select({
      memberNpub: memberships.memberNpub,
      paymentMethod: memberships.paymentMethod,
      nwcUriEncrypted: users.nwcUriEncrypted,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.memberNpub, users.npub))
    .where(eq(memberships.circleId, circle.id))

  const targets = circleMembers.filter((m) => {
    if (m.memberNpub === round.beneficiaryNpub) return false
    if (options?.payerNpub) return m.memberNpub === options.payerNpub
    return m.paymentMethod === 'nwc_auto' || Boolean(m.nwcUriEncrypted)
  })

  const results: Array<{
    payerNpub: string
    status: 'paid' | 'failed' | 'already_paid'
    preimage?: string
    receiptEventId?: string
    error?: string
  }> = []

  let roundCompleted = false
  let nextRound: unknown = null

  for (const target of targets) {
    const existingRows = await db
      .select()
      .from(contributions)
      .where(and(eq(contributions.roundId, roundId), eq(contributions.payerNpub, target.memberNpub)))
      .limit(1)

    if (existingRows[0]?.status === 'paid') {
      results.push({
        payerNpub: target.memberNpub,
        status: 'already_paid',
        preimage: existingRows[0].paymentPreimage ?? undefined,
        receiptEventId: existingRows[0].nostrReceiptEventId ?? undefined,
      })
      continue
    }

    try {
      const invoice = await ensureRoundInvoice(roundId, target.memberNpub)
      const nwcRes = await payInvoiceViaNwc({
        nwcUriEncrypted: target.nwcUriEncrypted,
        bolt11: invoice.bolt11,
        paymentHash: invoice.paymentHash,
      })
      if (!nwcRes.ok || !nwcRes.preimage) {
        results.push({
          payerNpub: target.memberNpub,
          status: 'failed',
          error: nwcRes.error ?? 'Paiement NWC refusé',
        })
        continue
      }
      const settled = await settleContribution({
        contributionId: invoice.contributionId,
        paymentPreimage: nwcRes.preimage,
      })
      if (settled.roundCompleted) {
        roundCompleted = true
        nextRound = settled.nextRound
      }
      results.push({
        payerNpub: target.memberNpub,
        status: 'paid',
        preimage: nwcRes.preimage,
        receiptEventId: settled.receiptEventId,
      })
    } catch (err) {
      results.push({
        payerNpub: target.memberNpub,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Erreur NWC',
      })
    }
  }

  return { results, roundCompleted, nextRound }
}

export async function getUserReputation(npub: string) {
  const userRows = await db.select().from(users).where(eq(users.npub, npub)).limit(1)
  const user = userRows[0] ?? null

  const rows = await db
    .select({
      id: contributions.id,
      circleId: circles.id,
      circleName: circles.name,
      roundNumber: rounds.roundNumber,
      beneficiaryNpub: rounds.beneficiaryNpub,
      beneficiaryName: users.displayName,
      payerNpub: contributions.payerNpub,
      amountXof: contributions.amountXof,
      amountSats: contributions.amountSats,
      paymentHash: contributions.paymentHash,
      paymentPreimage: contributions.paymentPreimage,
      status: contributions.status,
      dueAt: rounds.dueAt,
      paidAt: contributions.paidAt,
      nostrReceiptEventId: contributions.nostrReceiptEventId,
      nostrReceiptJson: contributions.nostrReceiptJson,
    })
    .from(contributions)
    .innerJoin(rounds, eq(contributions.roundId, rounds.id))
    .innerJoin(circles, eq(rounds.circleId, circles.id))
    .innerJoin(users, eq(rounds.beneficiaryNpub, users.npub))
    .where(eq(contributions.payerNpub, npub))

  const stats = computeReputationStats(rows)
  const memberCircles = await db
    .select({ circleId: memberships.circleId })
    .from(memberships)
    .where(eq(memberships.memberNpub, npub))

  return {
    npub,
    user: user
      ? {
          npub: user.npub,
          displayName: user.displayName,
          locale: user.locale,
          lightningAddress: user.lightningAddress,
          hasNwc: Boolean(user.nwcUriEncrypted),
          createdAt: user.createdAt,
        }
      : null,
    totalPaidRounds: stats.totalPaidRounds,
    onTimeRate: stats.onTimeRate,
    circlesCount: Math.max(stats.circlesCount, memberCircles.length),
    receipts: stats.receipts,
  }
}

export async function runScheduledCycle(nowMs = Date.now()) {
  const openRounds = await db
    .select({
      id: rounds.id,
      dueAt: rounds.dueAt,
      frequency: circles.frequency,
    })
    .from(rounds)
    .innerJoin(circles, eq(rounds.circleId, circles.id))
    .where(eq(rounds.status, 'open'))

  for (const r of openRounds) {
    if (r.dueAt > nowMs) continue

    if (r.frequency === 'demo_5min') {
      try {
        await triggerNwcForRound(r.id)
      } catch {
        // Best-effort auto-pay
      }
    }

    const remaining = await db
      .select()
      .from(contributions)
      .where(eq(contributions.roundId, r.id))

    const hasUnpaid = remaining.some((c) => c.status !== 'paid')
    if (hasUnpaid) {
      await db.update(rounds).set({ status: 'overdue' }).where(eq(rounds.id, r.id))
      for (const c of remaining) {
        if (c.status !== 'paid' && c.status !== 'late') {
          await db.update(contributions).set({ status: 'late' }).where(eq(contributions.id, c.id))
        }
      }
    }
  }
}

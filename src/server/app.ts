import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { asc, desc, eq, and } from 'drizzle-orm'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Event } from 'nostr-tools/pure'
import { db, initDb } from '../db/index.js'
import { circles, contributions, memberships, rounds, users } from '../db/schema.js'
import { seedDemoCircle } from '../db/seed.js'
import { encryptSecret } from '../services/crypto-vault.js'
import { getExchangeRates, xofToSats } from '../services/rates.js'
import {
  ApiError,
  computeDueAt,
  ensureRoundInvoice,
  ensureUserExists,
  getUserReputation,
  runScheduledCycle,
  settleContribution,
  triggerNwcForRound,
} from './engine.js'

function secretMatches(provided: string, expected: string): boolean {
  const given = Buffer.from(provided)
  const wanted = Buffer.from(expected)
  return given.length === wanted.length && timingSafeEqual(given, wanted)
}

function redactUser(user: typeof users.$inferSelect) {
  return {
    npub: user.npub,
    displayName: user.displayName,
    locale: user.locale,
    lightningAddress: user.lightningAddress,
    hasNwc: Boolean(user.nwcUriEncrypted),
    createdAt: user.createdAt,
  }
}

function makeInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(6)
  let out = ''
  for (let i = 0; i < 6; i += 1) {
    out += chars[bytes[i] % chars.length]
  }
  return out
}

async function getCircleDetailPayload(circleId: string) {
  const circleRows = await db.select().from(circles).where(eq(circles.id, circleId)).limit(1)
  const circle = circleRows[0]
  if (!circle) throw new ApiError(404, 'Cercle introuvable')

  const memberRows = await db
    .select({
      id: memberships.id,
      circleId: memberships.circleId,
      memberNpub: memberships.memberNpub,
      payoutOrder: memberships.payoutOrder,
      paymentMethod: memberships.paymentMethod,
      joinedAt: memberships.joinedAt,
      displayName: users.displayName,
      locale: users.locale,
      lightningAddress: users.lightningAddress,
      nwcUriEncrypted: users.nwcUriEncrypted,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.memberNpub, users.npub))
    .where(eq(memberships.circleId, circle.id))
    .orderBy(asc(memberships.payoutOrder))

  const roundRows = await db
    .select()
    .from(rounds)
    .where(eq(rounds.circleId, circle.id))
    .orderBy(asc(rounds.roundNumber))

  const roundIds = roundRows.map((r) => r.id)
  const allContributions: Array<typeof contributions.$inferSelect> = []
  for (const rId of roundIds) {
    const rows = await db.select().from(contributions).where(eq(contributions.roundId, rId))
    allContributions.push(...rows)
  }

  const currentRound =
    roundRows.find((r) => r.status !== 'completed') ??
    roundRows[roundRows.length - 1] ??
    null

  const members = memberRows.map((m) => ({
    id: m.id,
    npub: m.memberNpub,
    displayName: m.displayName,
    locale: m.locale,
    lightningAddress: m.lightningAddress,
    hasNwc: Boolean(m.nwcUriEncrypted),
    payoutOrder: m.payoutOrder,
    paymentMethod: m.paymentMethod as 'nwc_auto' | 'manual_qr',
    joinedAt: m.joinedAt,
  }))

  return {
    circle,
    members,
    rounds: roundRows,
    currentRound,
    contributions: allContributions.map((c) => ({
      ...c,
      nostrEvent: c.nostrReceiptJson ? (JSON.parse(c.nostrReceiptJson) as Event) : null,
    })),
  }
}

export function createApiApp() {
  const app = new Hono()

  app.use('/api/*', cors())
  app.use('/api/*', async (_c, next) => {
    await initDb()
    await next()
  })

  app.onError((err, c) => {
    if (err instanceof ApiError) {
      return c.json({ error: err.message }, err.status as 400 | 401 | 403 | 404 | 409 | 500)
    }
    console.error('[API Error]', err)
    return c.json({ error: err.message || 'Internal Server Error' }, 500)
  })

  app.get('/api/v1/health', (c) => c.json({ ok: true }))

  // Scheduler entrypoint for stateless hosts (Vercel, etc.) where node-cron
  // cannot run. A free external pinger calls this every minute with the shared
  // secret. It is a no-op unless CRON_SECRET is configured.
  app.all('/api/v1/cron/run', async (c) => {
    const expected = process.env.CRON_SECRET?.trim()
    if (!expected) {
      return c.json({ error: 'Cron disabled: CRON_SECRET is not set' }, 503)
    }
    const provided =
      c.req.header('x-cron-secret')?.trim() ||
      c.req.header('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
      ''
    if (!secretMatches(provided, expected)) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    await runScheduledCycle()
    return c.json({ ok: true, ranAt: Date.now() })
  })

  app.get('/api/v1/rates', async (c) => {
    const rates = await getExchangeRates()
    return c.json(rates)
  })

  // 1. POST /api/v1/users/profile
  app.post('/api/v1/users/profile', async (c) => {
    const body = await c.req.json<{
      npub?: string
      displayName?: string
      locale?: string
      lightningAddress?: string
      nwcUri?: string
    }>()

    const npub = body.npub?.trim()
    const displayName = body.displayName?.trim()
    if (!npub || !displayName) {
      throw new ApiError(400, 'npub et displayName requis')
    }

    const locale = body.locale === 'en' || body.locale === 'wo' ? body.locale : 'fr'
    const lightningAddress = body.lightningAddress?.trim() || null
    const nwcUriEncrypted = body.nwcUri?.trim() ? encryptSecret(body.nwcUri.trim()) : undefined

    const existing = await db.select().from(users).where(eq(users.npub, npub)).limit(1)
    if (existing[0]) {
      await db
        .update(users)
        .set({
          displayName,
          locale,
          lightningAddress: lightningAddress ?? existing[0].lightningAddress,
          ...(nwcUriEncrypted !== undefined ? { nwcUriEncrypted } : {}),
        })
        .where(eq(users.npub, npub))
    } else {
      await db.insert(users).values({
        npub,
        displayName,
        locale,
        lightningAddress,
        nwcUriEncrypted: nwcUriEncrypted ?? null,
        createdAt: Date.now(),
      })
    }

    const updated = await db.select().from(users).where(eq(users.npub, npub)).limit(1)
    return c.json({ user: redactUser(updated[0]) })
  })

  // 2. POST /api/v1/circles
  app.post('/api/v1/circles', async (c) => {
    const body = await c.req.json<{
      name?: string
      organizerNpub?: string
      organizerName?: string
      amountXof?: number
      frequency?: string
    }>()

    const name = body.name?.trim()
    const organizerNpub = body.organizerNpub?.trim()
    const amountXof = Number(body.amountXof)
    const frequency =
      body.frequency === 'weekly' || body.frequency === 'demo_5min' ? body.frequency : 'monthly'

    if (!name || !organizerNpub || !Number.isFinite(amountXof) || amountXof < 100) {
      throw new ApiError(400, 'Nom du cercle, organisateur et montant (>= 100 FCFA) requis')
    }

    const organizer = await ensureUserExists(organizerNpub, body.organizerName)

    const id = randomUUID()
    let inviteCode = makeInviteCode()
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const clash = await db
        .select({ id: circles.id })
        .from(circles)
        .where(eq(circles.inviteCode, inviteCode))
        .limit(1)
      if (!clash[0]) break
      inviteCode = makeInviteCode()
    }

    const circle = {
      id,
      name,
      organizerNpub,
      amountXof: Math.round(amountXof),
      frequency,
      status: 'recruiting',
      inviteCode,
      createdAt: Date.now(),
    }

    await db.insert(circles).values(circle)
    await db.insert(memberships).values({
      id: randomUUID(),
      circleId: id,
      memberNpub: organizerNpub,
      payoutOrder: 1,
      paymentMethod: organizer.nwcUriEncrypted ? 'nwc_auto' : 'manual_qr',
      joinedAt: Date.now(),
    })

    return c.json({
      circle,
      inviteUrl: `/join/${inviteCode}`,
    })
  })

  // List circles (optionally filtered by ?npub=...)
  app.get('/api/v1/circles', async (c) => {
    const npub = c.req.query('npub')?.trim()
    let circleRows: Array<typeof circles.$inferSelect>

    if (npub) {
      const joined = await db
        .select({ circle: circles })
        .from(memberships)
        .innerJoin(circles, eq(memberships.circleId, circles.id))
        .where(eq(memberships.memberNpub, npub))
        .orderBy(desc(circles.createdAt))
      circleRows = joined.map((j) => j.circle)
    } else {
      circleRows = await db.select().from(circles).orderBy(desc(circles.createdAt))
    }

    const summaries = await Promise.all(
      circleRows.map(async (circle) => {
        const mems = await db
          .select({ id: memberships.id })
          .from(memberships)
          .where(eq(memberships.circleId, circle.id))
        const rnds = await db
          .select()
          .from(rounds)
          .where(eq(rounds.circleId, circle.id))
          .orderBy(asc(rounds.roundNumber))
        const currentRound =
          rnds.find((r) => r.status !== 'completed') ?? rnds[rnds.length - 1] ?? null
        return {
          ...circle,
          memberCount: mems.length,
          currentRoundNumber: currentRound?.roundNumber ?? 0,
        }
      }),
    )

    return c.json({ circles: summaries })
  })

  // Preview circle by invite code (registered before :id!)
  app.get('/api/v1/circles/invite/:inviteCode', async (c) => {
    const code = c.req.param('inviteCode').trim().toUpperCase()
    const found = await db.select().from(circles).where(eq(circles.inviteCode, code)).limit(1)
    if (!found[0]) throw new ApiError(404, 'Invitation introuvable')
    return c.json(await getCircleDetailPayload(found[0].id))
  })

  // 3. GET /api/v1/circles/:id
  app.get('/api/v1/circles/:id', async (c) => {
    const id = c.req.param('id').trim()
    return c.json(await getCircleDetailPayload(id))
  })

  // 4. POST /api/v1/circles/:inviteCode/join
  app.post('/api/v1/circles/:inviteCode/join', async (c) => {
    const code = c.req.param('inviteCode').trim().toUpperCase()
    const body = await c.req.json<{
      memberNpub?: string
      displayName?: string
      lightningAddress?: string
      nwcUri?: string
    }>()

    const memberNpub = body.memberNpub?.trim()
    const displayName = body.displayName?.trim()
    if (!memberNpub) throw new ApiError(400, 'memberNpub requis')

    const circleRows = await db.select().from(circles).where(eq(circles.inviteCode, code)).limit(1)
    const circle = circleRows[0]
    if (!circle) throw new ApiError(404, 'Code d’invitation invalide')
    if (circle.status === 'completed') throw new ApiError(400, 'Cette tontine est déjà terminée')

    const nwcEncrypted = body.nwcUri?.trim() ? encryptSecret(body.nwcUri.trim()) : undefined
    const existingUser = await db.select().from(users).where(eq(users.npub, memberNpub)).limit(1)
    if (existingUser[0]) {
      await db
        .update(users)
        .set({
          ...(displayName ? { displayName } : {}),
          ...(body.lightningAddress !== undefined
            ? { lightningAddress: body.lightningAddress.trim() || null }
            : {}),
          ...(nwcEncrypted !== undefined ? { nwcUriEncrypted: nwcEncrypted } : {}),
        })
        .where(eq(users.npub, memberNpub))
    } else {
      await db.insert(users).values({
        npub: memberNpub,
        displayName: displayName || `Membre ${memberNpub.slice(0, 8)}`,
        locale: 'fr',
        lightningAddress: body.lightningAddress?.trim() || null,
        nwcUriEncrypted: nwcEncrypted ?? null,
        createdAt: Date.now(),
      })
    }

    const existingMembership = await db
      .select()
      .from(memberships)
      .where(and(eq(memberships.circleId, circle.id), eq(memberships.memberNpub, memberNpub)))
      .limit(1)

    if (existingMembership[0]) {
      return c.json({ membership: existingMembership[0], circle })
    }

    const currentMembers = await db
      .select()
      .from(memberships)
      .where(eq(memberships.circleId, circle.id))
    const maxOrder = currentMembers.reduce((max, m) => Math.max(max, m.payoutOrder), 0)
    const userRow = await db.select().from(users).where(eq(users.npub, memberNpub)).limit(1)

    const membership = {
      id: randomUUID(),
      circleId: circle.id,
      memberNpub,
      payoutOrder: maxOrder + 1,
      paymentMethod: userRow[0]?.nwcUriEncrypted ? 'nwc_auto' : 'manual_qr',
      joinedAt: Date.now(),
    }
    await db.insert(memberships).values(membership)

    // If circle already has an open round, create a pending contribution for the newcomer unless they are beneficiary
    const openRound = await db
      .select()
      .from(rounds)
      .where(and(eq(rounds.circleId, circle.id), eq(rounds.status, 'open')))
      .limit(1)

    if (openRound[0] && openRound[0].beneficiaryNpub !== memberNpub) {
      await db
        .insert(contributions)
        .values({
          id: randomUUID(),
          roundId: openRound[0].id,
          payerNpub: memberNpub,
          amountXof: circle.amountXof,
          amountSats: xofToSats(circle.amountXof, openRound[0].exchangeRateSatsPerXof),
          status: 'pending',
        })
        .onConflictDoNothing()
    }

    return c.json({ membership, circle })
  })

  // 5. POST /api/v1/circles/:id/start
  app.post('/api/v1/circles/:id/start', async (c) => {
    const circleId = c.req.param('id').trim()
    const body = await c.req.json<{
      organizerNpub?: string
      orderedNpubs?: string[]
    }>()

    const circleRows = await db.select().from(circles).where(eq(circles.id, circleId)).limit(1)
    const circle = circleRows[0]
    if (!circle) throw new ApiError(404, 'Cercle introuvable')

    if (!body.organizerNpub || body.organizerNpub.trim() !== circle.organizerNpub) {
      throw new ApiError(403, 'Seul l’organisateur peut démarrer le cercle')
    }
    if (circle.status !== 'recruiting') {
      throw new ApiError(400, 'Ce cercle a déjà démarré')
    }

    const memberRows = await db
      .select()
      .from(memberships)
      .where(eq(memberships.circleId, circleId))
      .orderBy(asc(memberships.payoutOrder))

    if (memberRows.length < 2) {
      throw new ApiError(400, 'Il faut au moins 2 membres pour démarrer la tontine')
    }

    const existingSet = new Set(memberRows.map((m) => m.memberNpub))
    const orderedNpubs =
      body.orderedNpubs && body.orderedNpubs.length === memberRows.length
        ? body.orderedNpubs
        : memberRows.map((m) => m.memberNpub)

    if (
      orderedNpubs.length !== memberRows.length ||
      new Set(orderedNpubs).size !== memberRows.length ||
      !orderedNpubs.every((npub) => existingSet.has(npub))
    ) {
      throw new ApiError(400, 'orderedNpubs doit contenir exactement tous les membres du cercle')
    }

    for (let i = 0; i < orderedNpubs.length; i += 1) {
      await db
        .update(memberships)
        .set({ payoutOrder: i + 1 })
        .where(and(eq(memberships.circleId, circleId), eq(memberships.memberNpub, orderedNpubs[i])))
    }

    const rates = await getExchangeRates()
    const activeRoundId = randomUUID()
    const beneficiaryNpub = orderedNpubs[0]
    const activeRound = {
      id: activeRoundId,
      circleId,
      roundNumber: 1,
      beneficiaryNpub,
      dueAt: computeDueAt(circle.frequency),
      exchangeRateSatsPerXof: rates.satsPerXof,
      status: 'open',
    }

    await db.update(circles).set({ status: 'active' }).where(eq(circles.id, circleId))
    await db.insert(rounds).values(activeRound)

    const amountSats = xofToSats(circle.amountXof, rates.satsPerXof)
    const createdContributions = []
    for (const payerNpub of orderedNpubs) {
      if (payerNpub === beneficiaryNpub) continue
      const row = {
        id: randomUUID(),
        roundId: activeRoundId,
        payerNpub,
        amountXof: circle.amountXof,
        amountSats,
        status: 'pending',
      }
      await db.insert(contributions).values(row)
      createdContributions.push(row)
    }

    const updatedCircle = await db.select().from(circles).where(eq(circles.id, circleId)).limit(1)
    return c.json({
      circle: updatedCircle[0],
      activeRound,
      contributions: createdContributions,
    })
  })

  // 6. POST /api/v1/rounds/:roundId/invoice
  app.post('/api/v1/rounds/:roundId/invoice', async (c) => {
    const roundId = c.req.param('roundId').trim()
    const body = await c.req.json<{ payerNpub?: string }>()
    const payerNpub = body.payerNpub?.trim()
    if (!payerNpub) throw new ApiError(400, 'payerNpub requis')
    const invoice = await ensureRoundInvoice(roundId, payerNpub)
    return c.json(invoice)
  })

  // 7. POST /api/v1/rounds/:roundId/trigger-nwc
  app.post('/api/v1/rounds/:roundId/trigger-nwc', async (c) => {
    const roundId = c.req.param('roundId').trim()
    const body = await c.req.json<{ organizerNpub?: string; payerNpub?: string }>().catch(() => ({}))
    const result = await triggerNwcForRound(roundId, body)
    return c.json(result)
  })

  // 8. POST /api/v1/contributions/:id/verify
  app.post('/api/v1/contributions/:id/verify', async (c) => {
    const contributionId = c.req.param('id').trim()
    type VerifyBody = {
      paymentPreimage?: string
      signedNostrEvent?: Event
      simulateSandbox?: boolean
    }
    const body: VerifyBody = await c.req.json<VerifyBody>().catch(() => ({}) as VerifyBody)

    const result = await settleContribution({
      contributionId,
      paymentPreimage: body.paymentPreimage,
      signedNostrEvent: body.signedNostrEvent,
      simulateSandbox: body.simulateSandbox,
    })
    return c.json(result)
  })

  // 9. GET /api/v1/users/:npub/reputation
  app.get('/api/v1/users/:npub/reputation', async (c) => {
    const npub = c.req.param('npub').trim()
    return c.json(await getUserReputation(npub))
  })

  // 10. POST /api/v1/demo/seed
  app.post('/api/v1/demo/seed', async (c) => {
    const body = await c.req.json<{ reset?: boolean }>().catch(() => ({ reset: false }))
    const result = await seedDemoCircle({ reset: Boolean(body.reset) })
    return c.json(result)
  })

  // Judge helper: simulate overdue round / late status
  app.post('/api/v1/rounds/:roundId/mark-overdue', async (c) => {
    const roundId = c.req.param('roundId').trim()
    const roundRows = await db.select().from(rounds).where(eq(rounds.id, roundId)).limit(1)
    const round = roundRows[0]
    if (!round) throw new ApiError(404, 'Tour introuvable')
    if (round.status === 'completed') throw new ApiError(400, 'Tour déjà terminé')

    await db
      .update(rounds)
      .set({ status: 'overdue', dueAt: Date.now() - 3600_000 })
      .where(eq(rounds.id, roundId))

    const rows = await db.select().from(contributions).where(eq(contributions.roundId, roundId))
    let marked = 0
    for (const row of rows) {
      if (row.status !== 'paid') {
        await db.update(contributions).set({ status: 'late' }).where(eq(contributions.id, row.id))
        marked += 1
      }
    }
    return c.json({ ok: true, markedLate: marked })
  })

  return app
}

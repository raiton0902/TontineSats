import { createHash } from 'node:crypto'
import { rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import * as nip19 from 'nostr-tools/nip19'
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure'

const tmpDbPath = path.join(os.tmpdir(), `tontinesats-api-test-${process.pid}.db`)
process.env.DATABASE_URL = `file:${tmpDbPath.replace(/\\/g, '/')}`
process.env.DISABLE_NOSTR_PUBLISH = '1'
process.env.DISABLE_EXTERNAL_RATES = '1'
process.env.ENABLE_LIVE_LNURL = 'false'

const { initDb, client } = await import('../src/db/index.js')
const { createApiApp } = await import('../src/server/app.js')
const { verifyReceiptEvent } = await import('../src/lib/nostr.js')

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`)
}

async function req(
  app: ReturnType<typeof createApiApp>,
  method: string,
  urlPath: string,
  body?: unknown,
) {
  const res = await app.request(urlPath, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = (await res.json()) as Record<string, any>
  return { status: res.status, data }
}

async function main() {
  await initDb()
  const app = createApiApp()

  // 1. Health & Rates
  const health = await req(app, 'GET', '/api/v1/health')
  assert(health.status === 200 && health.data.ok === true, 'health check failed')

  const rates = await req(app, 'GET', '/api/v1/rates')
  assert(rates.status === 200 && rates.data.satsPerXof > 0, 'rates endpoint failed')

  // 2. Demo Seed
  const seed = await req(app, 'POST', '/api/v1/demo/seed', { reset: true })
  assert(seed.status === 200, `demo/seed status ${seed.status}`)
  assert(seed.data.personas.length === 3, 'demo seed should return 3 personas')
  const [awa, moussa, fatou] = seed.data.personas

  // Verify demo circle details & Round 1 signed Nostr receipts
  const demoCircle = await req(app, 'GET', `/api/v1/circles/${seed.data.circleId}`)
  assert(demoCircle.status === 200, 'get demo circle failed')
  assert(demoCircle.data.members.length === 3, 'demo circle should have 3 members')
  assert(demoCircle.data.rounds.length === 2, 'demo circle should have 2 rounds')
  const r1Paid = demoCircle.data.contributions.filter(
    (c: any) => c.status === 'paid' && c.nostrEvent,
  )
  assert(r1Paid.length === 2, 'round 1 should have 2 paid contributions')
  for (const c of r1Paid) {
    assert(verifyReceiptEvent(c.nostrEvent), 'round 1 Nostr kind:30078 signature invalid')
  }

  // Check demo reputation
  const moussaRep = await req(app, 'GET', `/api/v1/users/${moussa.npub}/reputation`)
  assert(moussaRep.status === 200, 'reputation fetch failed')
  assert(moussaRep.data.totalPaidRounds === 1, 'moussa should have 1 paid round from R1')
  assert(moussaRep.data.onTimeRate === 100, 'moussa onTimeRate should be 100%')
  assert(moussaRep.data.receipts[0].verified === true, 'moussa receipt should verify')

  // 3. Test full custom circle lifecycle: Profile -> Create -> Join -> Start -> Invoice -> Verify -> NWC -> Reputation
  const makeNpub = () => nip19.npubEncode(getPublicKey(generateSecretKey()))
  const aliceNpub = makeNpub()
  const bobNpub = makeNpub()
  const carolNpub = makeNpub()

  const profAlice = await req(app, 'POST', '/api/v1/users/profile', {
    npub: aliceNpub,
    displayName: 'Alice Dakar',
    locale: 'fr',
    lightningAddress: 'alice@sandbox.tontinesats.local',
    nwcUri: 'sandbox://nwc/alice',
  })
  assert(profAlice.status === 200, 'profile upsert failed')
  assert(profAlice.data.user.hasNwc === true, 'hasNwc should be true')
  assert(profAlice.data.user.nwcUriEncrypted === undefined, 'nwcUriEncrypted must never leak')

  // Create circle
  const created = await req(app, 'POST', '/api/v1/circles', {
    name: 'Tontine Plateau Test',
    organizerNpub: aliceNpub,
    amountXof: 10000,
    frequency: 'weekly',
  })
  assert(created.status === 200, 'create circle failed')
  const circleId = created.data.circle.id
  const inviteCode = created.data.circle.inviteCode
  assert(created.data.circle.status === 'recruiting', 'new circle should be recruiting')

  // Invite preview
  const preview = await req(app, 'GET', `/api/v1/circles/invite/${inviteCode}`)
  assert(preview.status === 200 && preview.data.circle.id === circleId, 'invite preview failed')

  // Join Bob (NWC) and Carol (manual QR)
  const joinBob = await req(app, 'POST', `/api/v1/circles/${inviteCode}/join`, {
    memberNpub: bobNpub,
    displayName: 'Bob Paris',
    lightningAddress: 'bob@sandbox.tontinesats.local',
    nwcUri: 'sandbox://nwc/bob',
  })
  assert(joinBob.status === 200 && joinBob.data.membership.paymentMethod === 'nwc_auto', 'bob join failed')

  const joinCarol = await req(app, 'POST', `/api/v1/circles/${inviteCode}/join`, {
    memberNpub: carolNpub,
    displayName: 'Carol Thiès',
    lightningAddress: 'carol@sandbox.tontinesats.local',
  })
  assert(joinCarol.status === 200 && joinCarol.data.membership.paymentMethod === 'manual_qr', 'carol join failed')

  // Start circle (ordered: Alice -> Bob -> Carol)
  const started = await req(app, 'POST', `/api/v1/circles/${circleId}/start`, {
    organizerNpub: aliceNpub,
    orderedNpubs: [aliceNpub, bobNpub, carolNpub],
  })
  assert(started.status === 200, 'start circle failed')
  assert(started.data.circle.status === 'active', 'circle should be active')
  const round1Id = started.data.activeRound.id
  assert(started.data.contributions.length === 2, 'round 1 should have 2 payer contributions')

  // Generate invoice for Carol
  const carolInv = await req(app, 'POST', `/api/v1/rounds/${round1Id}/invoice`, {
    payerNpub: carolNpub,
  })
  assert(carolInv.status === 200 && carolInv.data.bolt11.startsWith('lntbs'), 'carol invoice failed')

  // Reject invalid preimage
  const badVerify = await req(
    app,
    'POST',
    `/api/v1/contributions/${carolInv.data.contributionId}/verify`,
    { paymentPreimage: '0'.repeat(64) },
  )
  assert(badVerify.status === 400, 'invalid preimage must be rejected with 400')

  // Accept valid sandbox verification (looks up real preimage & checks sha256)
  const goodVerify = await req(
    app,
    'POST',
    `/api/v1/contributions/${carolInv.data.contributionId}/verify`,
    { simulateSandbox: true },
  )
  assert(goodVerify.status === 200, `valid verify failed: ${JSON.stringify(goodVerify.data)}`)
  assert(goodVerify.data.contribution.status === 'paid', 'carol should be paid')
  const computedHash = createHash('sha256')
    .update(Buffer.from(goodVerify.data.contribution.paymentPreimage, 'hex'))
    .digest('hex')
  assert(computedHash === carolInv.data.paymentHash, 'preimage sha256 mismatch')
  assert(verifyReceiptEvent(goodVerify.data.receiptEvent), 'verified receipt Nostr sig invalid')
  assert(goodVerify.data.roundCompleted === false, 'round should not be completed until Bob pays')

  // Trigger NWC for Bob (last unpaid member -> completes Round 1 & opens Round 2!)
  const nwcRes = await req(app, 'POST', `/api/v1/rounds/${round1Id}/trigger-nwc`, {
    organizerNpub: aliceNpub,
  })
  assert(nwcRes.status === 200, 'trigger-nwc failed')
  assert(nwcRes.data.results[0].status === 'paid', 'bob NWC payment should succeed')
  assert(nwcRes.data.roundCompleted === true, 'round 1 should now complete')
  assert(nwcRes.data.nextRound?.roundNumber === 2, 'round 2 should auto-open')
  assert(nwcRes.data.nextRound?.beneficiaryNpub === bobNpub, 'round 2 beneficiary should be Bob')

  // Test overdue simulation on demo Round 2 (Fatou unpaid -> late)
  const demoR2 = demoCircle.data.rounds.find((r: any) => r.roundNumber === 2)
  const overdue = await req(app, 'POST', `/api/v1/rounds/${demoR2.id}/mark-overdue`)
  assert(overdue.status === 200 && overdue.data.markedLate >= 1, 'mark-overdue failed')

  // Test Fatou verify & Awa NWC on demo Round 2
  const fatouInv = await req(app, 'POST', `/api/v1/rounds/${demoR2.id}/invoice`, {
    payerNpub: fatou.npub,
  })
  assert(fatouInv.status === 200, 'fatou invoice failed')
  const fatouPaid = await req(
    app,
    'POST',
    `/api/v1/contributions/${fatouInv.data.contributionId}/verify`,
    { simulateSandbox: true },
  )
  assert(fatouPaid.status === 200, 'fatou verify failed')
  const awaNwc = await req(app, 'POST', `/api/v1/rounds/${demoR2.id}/trigger-nwc`, {
    payerNpub: awa.npub,
  })
  assert(awaNwc.status === 200 && awaNwc.data.roundCompleted === true, 'demo round 2 should advance')

  console.log('ALL API TESTS PASSED (10/10 PRD endpoints + Nostr kind:30078 + SHA-256 preimage verification)')
}

try {
  await main()
} finally {
  client.close()
  await rm(tmpDbPath, { force: true }).catch(() => undefined)
}

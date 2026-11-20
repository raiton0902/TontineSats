# Deploying TontineSats for free (no credit card)

The app is one Node process today: Hono API, SQLite file, and a `node-cron`
scheduler. Free container hosts either sleep or demand a card, so the deploy
target here is **serverless**: the API becomes one Vercel Function, SQLite
becomes a free Turso database, and the every-minute scheduler is driven by a
free external pinger. No feature is dropped — invoices, NWC auto-pay, sandbox
settlement, receipts, and the round scheduler all still run.

| Piece | Service | Free tier used | Card? |
| :--- | :--- | :--- | :--- |
| Web + API | Vercel Hobby | 1 function, 100 GB bandwidth | No |
| Database | Turso | 1 DB, 5 GB, 500M row reads/mo | No |
| Scheduler | cron-job.org | 1 job, every minute | No |

Nothing below needs a payment method. Vercel Hobby is for non-commercial use,
which a hackathon demo is.

---

## 1. Push the repo to GitHub

```bash
git init
git add -A
git commit -m "TontineSats: deployed build"
git branch -M main
git remote add origin https://github.com/raiton0902/TontineSats.git
git push -u origin main
```

`.gitignore` already excludes `node_modules/`, `dist/`, `data/`, `.env*`, and
`.vercel/`. Only `.env.example` is committed.

## 2. Create the Turso database

1. Sign up at <https://turso.tech> (GitHub login works, no card).
2. Create a database, e.g. `tontinesats`. Pick the region closest to your Vercel
   region (`iad1` / Washington is the default).
3. Copy the **Database URL**, it looks like
   `libsql://tontinesats-<org>.turso.io`.
4. Create a **token** for it (dashboard → the database → Create Token), or with
   the CLI:

   ```bash
   turso db tokens create tontinesats
   ```

Keep the URL and token; they are `DATABASE_URL` and `DATABASE_AUTH_TOKEN`.

The tables are created by the app on first request (`initDb`), so there is no
migration step.

## 3. Deploy to Vercel

### Option A — dashboard import

1. Sign up at <https://vercel.com> with GitHub (no card).
2. **Add New → Project → Import** `raiton0902/TontineSats`.
3. **Important:** set **Framework Preset** to **Other**. The repo ships
   `vercel.json` plus a Vercel Build Output API directory, and the "Other"
   preset guarantees Vercel uses it instead of guessing Vite's `dist/`.
4. Add the environment variables below, then **Deploy**.

If the deployment comes up but `/api/v1/health` returns 404, Vercel ignored the
Build Output API. Use Option B, which uploads the built output directly.

### Option B — CLI, prebuilt (most reliable)

`--prebuilt` skips framework detection on Vercel entirely: you build locally,
upload `.vercel/output`, and Vercel cannot reinterpret the output.

```bash
npx vercel login
npx vercel link          # create/link the project (accept the defaults)

# optional: set env vars from the vercel.json project settings
npx vercel env add DATABASE_URL production
npx vercel env add DATABASE_AUTH_TOKEN production
npx vercel env add NWC_ENCRYPTION_KEY production
npx vercel env add NOSTR_ATTESTATION_NSEC production
npx vercel env add CRON_SECRET production

npx vercel build --prod
npx vercel deploy --prebuilt --prod
```

### Environment variables

| Variable | Value |
| :--- | :--- |
| `DATABASE_URL` | `libsql://tontinesats-<org>.turso.io` |
| `DATABASE_AUTH_TOKEN` | the Turso token from step 2 |
| `NWC_ENCRYPTION_KEY` | long random string, see below |
| `NOSTR_ATTESTATION_NSEC` | a Nostr `nsec`, see below |
| `CRON_SECRET` | random string, shared with the pinger |
| `DISABLE_NOSTR_PUBLISH` | `1` for the demo (keeps test receipts off public relays) |

Generate the two secrets locally:

```bash
# NWC_ENCRYPTION_KEY and CRON_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# NOSTR_ATTESTATION_NSEC
npx tsx -e "import { generateSecretKey } from 'nostr-tools/pure'; import { nsecEncode } from 'nostr-tools/nip19'; console.log(nsecEncode(generateSecretKey()))"
```

Do not skip `NOSTR_ATTESTATION_NSEC` in production: without it, receipts are
signed with a deterministic fallback key derived from `NWC_ENCRYPTION_KEY`, so
anyone with the source can forge a "paid" receipt.

### Verify the deploy

```bash
curl https://<your-app>.vercel.app/api/v1/health
# {"ok":true}

curl -X POST https://<your-app>.vercel.app/api/v1/demo/seed \
  -H 'content-type: application/json' -d '{"reset":true}'
```

Then open the app, sign in with the demo session, and the seeded circle (Awa,
Moussa, Fatou) is there. If `/api/v1/health` returns 404, the functions were not
picked up: check that the Framework Preset is **Other** and redeploy with the
build cache cleared.

## 4. Drive the scheduler

`node-cron` cannot run on serverless, so `/api/v1/cron/run` exposes the same
`runScheduledCycle` behind a shared secret. The route returns `503` until
`CRON_SECRET` is set.

1. Sign up at <https://cron-job.org> (free, no card).
2. Create a cron job:
   - URL: `https://<your-app>.vercel.app/api/v1/cron/run`
   - Schedule: every **1 minute**
   - Method: `POST`
   - Header: `x-cron-secret: <CRON_SECRET>`
3. Save. The job now marks overdue rounds and auto-pays `demo_5min` rounds.

Vercel's own Cron Jobs on Hobby only run once per day, which is too coarse for
the 5-minute demo rounds, hence the external pinger. A daily Vercel cron is
still declared in `config.json` as a safety net if the pinger ever stops.

## What changes on Vercel, and what does not

- **Does not change:** the API surface in `docs/PRD.md` §4, the Drizzle schema,
  invoice creation, preimage verification, NWC auto-pay, receipt signing, the
  React app. Local `npm run dev`, `npm start`, and `docker build` still work.
- **Changes:** the database must be remote (Turso) because there is no disk;
  `node-cron` is replaced by the guarded endpoint; static files are served by
  Vercel's CDN instead of the Node file handler.
- **Limits:** Hobby functions have a 60 second ceiling (`maxDuration` in
  `.vc-config.json`), so "auto-pay every NWC member at once" on a large circle
  could time out. Per-member payment is unaffected.
- **Not used:** the `data/` directory, the Dockerfile, and the in-process
  scheduler remain for local use only.

## If you would rather keep the container

A container that never sleeps cannot be free and card-free. The only zero-code
alternative is reusing a Hugging Face Docker Space you created before HF started
requiring a paid plan to *create* compute Spaces — push to that existing Space
and it builds the current `Dockerfile` unchanged (ephemeral disk, sleeps after
48 h idle, wakes on visit).

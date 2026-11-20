// Emits a Vercel Build Output API v3 directory:
//
//   .vercel/output/static/               -> the Vite build (dist/)
//   .vercel/output/functions/api.func/   -> one bundled Node function
//   .vercel/output/config.json           -> routes
//
// Bundling the server ourselves keeps Vercel out of our TypeScript module
// resolution: the `.js` import specifiers that point at `.ts` files only work
// for bundlers, so the function ships as one file with no imports left.
import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { build } from 'esbuild'

const root = process.cwd()
const outputDir = path.join(root, '.vercel', 'output')
const functionDir = path.join(outputDir, 'functions', 'api.func')
const staticDir = path.join(outputDir, 'static')
const distDir = path.join(root, 'dist')

await rm(outputDir, { recursive: true, force: true })
await mkdir(functionDir, { recursive: true })
await cp(distDir, staticDir, { recursive: true })

await build({
  entryPoints: [path.join(root, 'scripts', 'vercel-handler.ts')],
  outfile: path.join(functionDir, 'serve.js'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  // The Node build of @libsql/client pulls in the native `libsql` binding for
  // file: URLs. On Vercel the database is remote (Turso), so the fetch-only
  // entry point is the correct one to bundle.
  alias: { '@libsql/client': '@libsql/client/web' },
  logLevel: 'info',
})

await writeFile(
  path.join(functionDir, '.vc-config.json'),
  JSON.stringify(
    {
      runtime: 'nodejs22.x',
      handler: 'serve.js',
      launcherType: 'Nodejs',
      shouldAddHelpers: false,
      supportsResponseStreaming: true,
      maxDuration: 60,
    },
    null,
    2,
  ) + '\n',
)

// Force CommonJS semantics for the function file regardless of project settings.
await writeFile(
  path.join(functionDir, 'package.json'),
  JSON.stringify({ type: 'commonjs' }, null, 2) + '\n',
)

await writeFile(
  path.join(outputDir, 'config.json'),
  JSON.stringify(
    {
      version: 3,
      routes: [
        { src: '/api/(.*)', dest: '/api' },
        { handle: 'filesystem' },
        { src: '/(.*)', dest: '/index.html' },
      ],
      // Hobby only allows daily schedules, so this is a safety net; the
      // every-minute sweep comes from the external pinger in DEPLOY.md.
      crons: [{ path: '/api/v1/cron/run', schedule: '0 0 * * *' }],
    },
    null,
    2,
  ) + '\n',
)

console.log('[build-vercel] .vercel/output ready')

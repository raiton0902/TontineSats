// Build entry for the Vercel Node function.
//
// scripts/build-vercel.mjs bundles this file with esbuild into a single
// CommonJS file, so Vercel never has to resolve the `.js` specifiers that point
// at TypeScript sources. `module.exports` is the handler shape Vercel's Node
// launcher requires.
import { getRequestListener } from '@hono/node-server'
import { createApiApp } from '../src/server/app.js'

const app = createApiApp()

module.exports = getRequestListener((request) => app.fetch(request))

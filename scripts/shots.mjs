import { mkdir, writeFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PROFILE = path.join(os.tmpdir(), 'tontinesats-chrome-' + process.pid)
const ORIGIN = process.env.ORIGIN ?? 'http://localhost:5174'
const OUT = 'shots-web/legal-theme'

await rm(PROFILE, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--remote-debugging-port=9333',
    `--user-data-dir=${PROFILE}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    'about:blank',
  ],
  { stdio: 'ignore', detached: false },
)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let version
for (let attempt = 0; attempt < 60; attempt += 1) {
  try {
    const response = await fetch('http://127.0.0.1:9333/json/version')
    version = await response.json()
    break
  } catch {
    await sleep(250)
  }
}
if (!version) throw new Error('chrome did not expose CDP')

const targets = await (await fetch('http://127.0.0.1:9333/json/list')).json()
const page = targets.find((target) => target.type === 'page')
if (!page) throw new Error('no page target')

const socket = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})

let nextId = 0
const pending = new Map()
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (!message.id) return
  const entry = pending.get(message.id)
  if (!entry) return
  pending.delete(message.id)
  if (message.error) entry.reject(new Error(`${entry.method}: ${message.error.message}`))
  else entry.resolve(message.result)
})

function send(method, params = {}) {
  const id = (nextId += 1)
  socket.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject, method }))
}

const evaluate = async (expression, awaitPromise = false) => {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? 'evaluate failed')
  }
  return result.result?.value
}

const navigate = async (url) => {
  await send('Page.navigate', { url })
  await sleep(700)
}

async function shot({ name, path, theme, locale = 'fr', width = 1440, height = 900, session = null }) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 640,
  })
  await navigate(`${ORIGIN}/`)
  await evaluate(
    `localStorage.setItem('tontinesats.settings.v1', ${JSON.stringify(
      JSON.stringify({ theme, reduceMotion: true, demoMode: false, locale }),
    )}); localStorage.removeItem('tontinesats.session.v1');`,
  )
  if (session) {
    await evaluate(`localStorage.setItem('tontinesats.session.v1', ${JSON.stringify(JSON.stringify(session))});`)
  }
  await navigate(`${ORIGIN}${path}`)
  await sleep(900)
  const { data } = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
  })
  await writeFile(`${OUT}/${name}.png`, Buffer.from(data, 'base64'))
  console.log(`${name}.png ${width}x${height}`)
}

const session = {
  mode: 'demo',
  npub: 'npub1demo',
  name: 'Awa Diop',
  locale: 'fr',
  legalConsent: { terms: '1.0', privacy: '1.0', acceptedAt: Date.now(), locale: 'fr' },
  createdAt: Date.now(),
}

await shot({ name: 'landing-light-1440', path: '/', theme: 'light' })
await shot({ name: 'landing-dark-1440', path: '/', theme: 'dark' })
await shot({ name: 'landing-light-375', path: '/', theme: 'light', width: 375, height: 812 })
await shot({ name: 'landing-dark-375', path: '/', theme: 'dark', width: 375, height: 812 })
await shot({ name: 'entry-light-1440', path: '/auth', theme: 'light' })
await shot({ name: 'entry-dark-1440', path: '/auth', theme: 'dark' })
await shot({ name: 'entry-light-375', path: '/auth', theme: 'light', width: 375, height: 812 })
await shot({ name: 'legal-terms-light', path: '/legal/terms', theme: 'light' })
await shot({ name: 'legal-privacy-dark', path: '/legal/privacy', theme: 'dark' })
await shot({ name: 'legal-terms-375', path: '/legal/terms', theme: 'light', width: 375, height: 812 })
await shot({ name: 'dashboard-light', path: '/app', theme: 'light', session })
await shot({ name: 'dashboard-dark', path: '/app', theme: 'dark', session })
await shot({ name: 'auth-profile-light', path: '/auth?mode=import', theme: 'light' })

socket.close()
chrome.kill()
console.log('done')


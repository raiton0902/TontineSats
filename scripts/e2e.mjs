import { spawn } from 'node:child_process'
import { rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PROFILE = path.join(os.tmpdir(), `tontinesats-chrome-${process.pid}`)
const ORIGIN = process.env.ORIGIN ?? 'http://localhost:5174'
const PORT = 9400 + Math.floor(Math.random() * 400)
const CDP = `http://127.0.0.1:${PORT}`

await rm(PROFILE, { recursive: true, force: true })

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    'about:blank',
  ],
  { stdio: 'ignore' },
)
process.on('exit', () => {
  try {
    chrome.kill()
  } catch {}
})

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

for (let attempt = 0; attempt < 60; attempt += 1) {
  try {
    await fetch(`${CDP}/json/version`)
    break
  } catch {
    await sleep(250)
  }
}

const targets = await (await fetch(`${CDP}/json/list`)).json()
const page = targets.find((target) => target.type === 'page')
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
  if (message.error) entry.reject(new Error(message.error.message))
  else entry.resolve(message.result)
})

const send = (method, params = {}) => {
  const id = (nextId += 1)
  socket.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}

const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? 'failed')
  return result.result?.value
}

const viewport = (width, height) =>
  send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 640 })

const waitFor = async (expression, timeout = 15000) => {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return true
    await sleep(200)
  }
  return false
}

let seedId = null
// Without Page.enable the seeding script below is accepted but never runs.
await send('Page.enable')
const go = async (target, theme = 'light', locale = 'fr') => {
  if (seedId) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: seedId })
  const seeded = await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `window.__seeded = true
    try {
      localStorage.setItem('tontinesats.settings.v1', ${JSON.stringify(
        JSON.stringify({ theme, reduceMotion: true, demoMode: false, locale }),
      )});
      localStorage.removeItem('tontinesats.session.v1');
    } catch (error) {}`,
  })
  seedId = seeded.identifier
  await send('Page.navigate', { url: `${ORIGIN}${target}` })
  const ready = await waitFor(
    `document.readyState === 'complete' && document.querySelector('#root')?.children.length > 0 && window.__seeded === true`,
  )
  if (!ready) console.log(`WARN  page did not settle or was not seeded: ${target}`)
  await sleep(500)
}

const results = []
const check = (name, value, expected) => {
  const ok = JSON.stringify(value) === JSON.stringify(expected)
  const line = `${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  got=${JSON.stringify(value)} want=${JSON.stringify(expected)}`}`
  results.push(line)
  console.log(line)
}

await viewport(375, 812)
await go('/')
check('landing 375 no horizontal scroll', await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true)
check(
  'landing 375 header auth links hidden',
  await evaluate(
    `['/auth?mode=create', '/auth?mode=import'].map(href => document.querySelector('header a[href="' + href + '"]')).every(a => a && getComputedStyle(a).display === 'none')`,
  ),
  true,
)
check(
  'landing 375 hero log in present',
  await evaluate(`[...document.querySelectorAll('button')].some(b => /connecter/.test(b.textContent))`),
  true,
)
check(
  'landing 375 has demo button',
  await evaluate(`[...document.querySelectorAll('main button')].some((b) => b.textContent.trim() === 'Démo')`),
  true,
)
check(
  'landing 375 header has theme toggle',
  await evaluate(`[...document.querySelectorAll('header button')].some(b => (b.getAttribute('aria-label') || '').startsWith('Passer'))`),
  true,
)

await viewport(1440, 900)
await go('/')
check(
  'demo button sits right of join on landing',
  await evaluate(`(() => {
    const demo = [...document.querySelectorAll('main button')].find((b) => b.textContent.trim() === 'Démo')
    const join = [...document.querySelectorAll('main a')].find((a) => (a.getAttribute('href') || '').startsWith('/join/'))
    if (!demo || !join) return 'missing'
    const d = demo.getBoundingClientRect()
    const j = join.getBoundingClientRect()
    return {
      rightOfJoin: d.left >= j.right - 1,
      sameRow: Math.abs(d.top - j.top) < 10,
      height: Math.round(d.height),
    }
  })()`),
  { rightOfJoin: true, sameRow: true, height: 48 },
)
check(
  'demo disclosure is on the landing page',
  await evaluate(`document.querySelector('main').textContent.includes('portefeuilles de test')`),
  true,
)
check(
  'landing 1440 header shows both auth actions',
  await evaluate(
    `['/auth?mode=create', '/auth?mode=import'].map(href => document.querySelector('header a[href="' + href + '"]')).every(a => a && getComputedStyle(a).display !== 'none')`,
  ),
  true,
)
check('landing 1440 no horizontal scroll', await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true)
check(
  'landing footer links both legal docs',
  await evaluate(`[...document.querySelectorAll('footer a, main a')].filter(a => /^\\/legal\\/(terms|privacy)$/.test(a.getAttribute('href') || '')).length`),
  2,
)
check(
  'theme toggle switches to dark',
  await evaluate(`(async () => {
    const btn = [...document.querySelectorAll('header button')].find(b => (b.getAttribute('aria-label') || '').startsWith('Passer'))
    if (!btn) return 'missing'
    btn.click()
    await new Promise((resolve) => setTimeout(resolve, 150))
    return document.documentElement.dataset.theme
  })()`),
  'dark',
)
check(
  'theme choice persisted',
  await evaluate(`JSON.parse(localStorage.getItem('tontinesats.settings.v1')).theme`),
  'dark',
)
check(
  'landing dark keeps contrast class on hero',
  await evaluate(`getComputedStyle(document.querySelector('.landing-canvas')).backgroundImage.includes('gradient')`),
  true,
)
check(
  'demo button opens a sandbox session',
  await evaluate(`(async () => {
    const btn = [...document.querySelectorAll('main button')].find((b) => b.textContent.trim() === 'Démo')
    if (!btn) return 'missing'
    btn.click()
    await new Promise((resolve) => setTimeout(resolve, 800))
    const raw = localStorage.getItem('tontinesats.session.v1')
    return [location.pathname, raw ? JSON.parse(raw).mode : 'none']
  })()`),
  ['/app', 'demo'],
)

await go('/auth')
check('entry renders two consent checkboxes', await evaluate('document.querySelectorAll("input[type=checkbox]").length'), 2)
check(
  'consent boxes start unchecked',
  await evaluate('[...document.querySelectorAll("input[type=checkbox]")].every(c => !c.checked)'),
  true,
)
check(
  'identity buttons disabled before consent',
  await evaluate(`[...document.querySelectorAll('button')].filter(b => b.disabled).length >= 3`),
  true,
)
check(
  'demo stays enabled',
  await evaluate(`[...document.querySelectorAll('button')].filter(b => /Ouvrir/.test(b.textContent)).every(b => !b.disabled)`),
  true,
)
check(
  'consent gates the identity buttons',
  await evaluate(`(async () => {
    const before = [...document.querySelectorAll('button')].filter(b => b.disabled).length
    const boxes = [...document.querySelectorAll('input[type=checkbox]')]
    boxes[0].click()
    await new Promise((resolve) => setTimeout(resolve, 80))
    const one = [...document.querySelectorAll('button')].filter(b => b.disabled).length
    boxes[1].click()
    await new Promise((resolve) => setTimeout(resolve, 80))
    const two = [...document.querySelectorAll('button')].filter(b => b.disabled).length
    return [before, one, two]
  })()`),
  [3, 3, 0],
)
check(
  'consent links open a new tab',
  await evaluate(`[...document.querySelectorAll('label a[href^="/legal/"]')].length === 2 && [...document.querySelectorAll('label a[href^="/legal/"]')].every(a => a.target === '_blank' && a.rel.includes('noopener'))`),
  true,
)
check(
  'no dash punctuation on entry',
  await evaluate(`/[\\u2013\\u2014]/.test(document.body.textContent)`),
  false,
)

await go('/legal/terms')
check('terms renders 18 sections', await evaluate('document.querySelectorAll("main section").length'), 18)
check(
  'terms shows version and date',
  await evaluate(`document.querySelector('main').textContent.includes('Version 1.0') && document.querySelector('main').textContent.includes('2026')`),
  true,
)
check(
  'terms switches to English',
  await evaluate(`(async () => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'EN')
    btn.click()
    await new Promise((resolve) => setTimeout(resolve, 150))
    return document.querySelector('h1').textContent
  })()`),
  'Terms and Conditions',
)
check(
  'terms has no dash punctuation',
  await evaluate(`/[\\u2013\\u2014]/.test(document.querySelector('main').textContent)`),
  false,
)
await viewport(375, 812)
await sleep(300)
check('terms 375 no horizontal scroll', await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true)

await go('/legal/privacy', 'dark')
check('privacy renders 13 sections', await evaluate('document.querySelectorAll("main section").length'), 13)
check(
  'privacy page follows dark theme',
  await evaluate(`document.documentElement.dataset.theme === 'dark'`),
  true,
)
check(
  'unknown legal doc redirects home',
  await (async () => {
    await send('Page.navigate', { url: `${ORIGIN}/legal/nope` })
    await sleep(900)
    return evaluate('location.pathname')
  })(),
  '/',
)

await go('/auth?mode=import')
check('import step shows no gate before profile', await evaluate('document.querySelectorAll("input[type=checkbox]").length'), 0)

await viewport(1440, 900)
await go('/')
check(
  'back from log in returns to landing',
  await evaluate(`(async () => {
    document.querySelector('header a[href="/auth?mode=import"]').click()
    await new Promise((resolve) => setTimeout(resolve, 220))
    const entered = location.pathname + location.search
    document.querySelector('header button').click()
    await new Promise((resolve) => setTimeout(resolve, 220))
    return [entered, location.pathname]
  })()`),
  ['/auth?mode=import', '/'],
)

await go('/')
check(
  'back from create returns to landing',
  await evaluate(`(async () => {
    document.querySelector('header a[href="/auth?mode=create"]').click()
    await new Promise((resolve) => setTimeout(resolve, 220))
    document.querySelector('header button').click()
    await new Promise((resolve) => setTimeout(resolve, 220))
    return location.pathname
  })()`),
  '/',
)

await go('/')
check(
  'browser back from wizard returns to landing',
  await evaluate(`(async () => {
    document.querySelector('header a[href="/auth?mode=import"]').click()
    await new Promise((resolve) => setTimeout(resolve, 220))
    history.back()
    await new Promise((resolve) => setTimeout(resolve, 350))
    return location.pathname
  })()`),
  '/',
)

await go('/auth?mode=create')
check(
  'direct wizard link back falls back to landing',
  await evaluate(`(async () => {
    document.querySelector('header button').click()
    await new Promise((resolve) => setTimeout(resolve, 220))
    return location.pathname
  })()`),
  '/',
)
check(
  'wizard back control is a 44px target',
  await evaluate(`(() => {
    const box = document.querySelector('header button').getBoundingClientRect()
    return box.height >= 44
  })()`),
  true,
)

socket.close()
chrome.kill()
console.log(`\n${results.filter((line) => line.startsWith('PASS')).length} passed, ${results.filter((line) => line.startsWith('FAIL')).length} failed`)
if (results.some((line) => line.startsWith('FAIL'))) process.exitCode = 1

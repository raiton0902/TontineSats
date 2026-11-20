import { spawn } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ROOT = path.resolve('d:\\aku ngoding\\dakarbitcoin')
const TMP_DIR = path.join(ROOT, 'video', 'tmp')
const ORIGIN = process.env.DEMO_ORIGIN ?? 'http://127.0.0.1:5175'
const API_ORIGIN = process.env.API_ORIGIN ?? 'http://127.0.0.1:3001'
const FPS = 30
const VIEW_W = 1440
const VIEW_H = 810
const SCALE_FACTOR = 1.5

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function launchChrome(port, profileDir) {
  await rm(profileDir, { recursive: true, force: true })
  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profileDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--hide-scrollbars',
      `--window-size=${VIEW_W},${VIEW_H}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  )

  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`)
      if (r.ok) break
    } catch {}
    await sleep(250)
  }

  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  const page = targets.find((t) => t.type === 'page')
  if (!page) throw new Error('No Chrome page target found')

  const socket = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })

  let nextId = 0
  const pending = new Map()
  socket.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data)
    if (!msg.id) return
    const entry = pending.get(msg.id)
    if (!entry) return
    pending.delete(msg.id)
    if (msg.error) entry.reject(new Error(`${entry.method}: ${msg.error.message}`))
    else entry.resolve(msg.result)
  })

  const send = (method, params = {}) => {
    const id = (nextId += 1)
    socket.send(JSON.stringify({ id, method, params }))
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject, method }))
  }

  const evaluate = async (expression) => {
    const res = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    })
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description ?? 'evaluate failed')
    }
    return res.result?.value
  }

  await send('Page.enable')
  await send('Network.enable')
  await send('Emulation.setDeviceMetricsOverride', {
    width: VIEW_W,
    height: VIEW_H,
    deviceScaleFactor: SCALE_FACTOR,
    mobile: false,
  })

  // Inject visible desktop arrow pointer across all documents
  const cursorInjection = `(() => {
    const install = () => {
      if (document.getElementById('__demo_cursor')) return;
      const root = document.documentElement || document.body;
      if (!root) return;
      const el = document.createElement('div');
      el.id = '__demo_cursor';
      el.style.cssText = 'position:fixed;left:0;top:0;width:28px;height:28px;z-index:2147483647;pointer-events:none;transform:translate3d(-100px,-100px,0);transform-origin:3px 2px;will-change:transform;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.34));transition:none;';
      el.innerHTML = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 2.5L4 22.5L9.4 17.3L13.3 25L16.4 23.4L12.5 15.8L20 15.4L4 2.5Z" fill="#0F172A" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/></svg>';
      root.appendChild(el);
      window.__cursorState = { x: 720, y: 405, pressing: false };
      window.__setCursor = (x, y, pressing = false) => {
        window.__cursorState = { x, y, pressing };
        const node = document.getElementById('__demo_cursor') || (() => { install(); return document.getElementById('__demo_cursor'); })();
        if (!node) return;
        const s = pressing ? 0.88 : 1;
        node.style.transform = 'translate3d(' + (x - 3) + 'px,' + (y - 2) + 'px,0) scale(' + s + ')';
      };
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', install, { once: true });
    }
    install();
    new MutationObserver(() => {
      if (!document.getElementById('__demo_cursor')) install();
    }).observe(document.documentElement, { childList: true });
  })();`

  await send('Page.addScriptToEvaluateOnNewDocument', { source: cursorInjection })

  return {
    chrome,
    socket,
    send,
    evaluate,
    cursorInjection,
    close: async () => {
      try { socket.close() } catch {}
      try { chrome.kill() } catch {}
      await rm(profileDir, { recursive: true, force: true }).catch(() => {})
    },
  }
}

function createRecorderSession(browser, outMp4Path, durationSec) {
  const cameraEvents = [{ t: 0, zoom: 1, x: VIEW_W / 2, y: VIEW_H / 2 }]
  let cursorX = 760
  let cursorY = 440
  let startMs = 0
  let stopped = false
  let frameIndex = 0
  let lastJpeg = null

  const ff = spawn(
    'ffmpeg',
    [
      '-y',
      '-f', 'image2pipe',
      '-vcodec', 'mjpeg',
      '-r', String(FPS),
      '-i', '-',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '14',
      '-pix_fmt', 'yuv420p',
      outMp4Path,
    ],
    { stdio: ['pipe', 'ignore', 'pipe'] },
  )

  let ffErr = ''
  ff.stderr.on('data', (d) => { ffErr += d.toString() })

  const totalFrames = Math.round(durationSec * FPS)

  const writeFrame = (buf) =>
    new Promise((resolve, reject) => {
      const ok = ff.stdin.write(buf, (err) => (err ? reject(err) : null))
      if (ok) resolve()
      else ff.stdin.once('drain', resolve)
    })

  const captureLoopPromise = (async () => {
    startMs = Date.now()
    // Ensure initial cursor position is drawn
    await browser.evaluate(`window.__setCursor && window.__setCursor(${cursorX}, ${cursorY}, false)`).catch(() => {})

    while (!stopped && frameIndex < totalFrames) {
      const targetFrame = Math.min(totalFrames, Math.floor(((Date.now() - startMs) * FPS) / 1000) + 1)
      if (frameIndex >= targetFrame) {
        await sleep(8)
        continue
      }
      try {
        const { data } = await browser.send('Page.captureScreenshot', {
          format: 'jpeg',
          quality: 94,
        })
        lastJpeg = Buffer.from(data, 'base64')
      } catch (err) {
        if (!lastJpeg) throw err
      }
      const nowFrame = Math.min(totalFrames, Math.max(frameIndex + 1, Math.floor(((Date.now() - startMs) * FPS) / 1000) + 1))
      while (frameIndex < nowFrame && frameIndex < totalFrames) {
        await writeFrame(lastJpeg)
        frameIndex += 1
      }
    }
    ff.stdin.end()
    await new Promise((resolve, reject) => {
      ff.on('exit', (code) => {
        if (code === 0) resolve()
        else reject(new Error(`ffmpeg exited ${code}: ${ffErr.slice(-500)}`))
      })
    })
  })()

  const nowSec = () => (Date.now() - startMs) / 1000

  const waitUntil = async (targetSec) => {
    while (nowSec() < targetSec) {
      const rem = (targetSec - nowSec()) * 1000
      await sleep(Math.min(40, Math.max(5, rem)))
    }
  }

  const moveCursorTo = async (tx, ty, durationMs = 520) => {
    const sx = cursorX
    const sy = cursorY
    const dx = tx - sx
    const dy = ty - sy
    const dist = Math.hypot(dx, dy)
    // Gentle perpendicular arc like a real human hand
    const perpX = dist > 20 ? (-dy / dist) * Math.min(18, dist * 0.045) : 0
    const perpY = dist > 20 ? (dx / dist) * Math.min(18, dist * 0.045) : 0
    const steps = Math.max(8, Math.round(durationMs / 24))
    const t0 = Date.now()

    for (let i = 1; i <= steps; i += 1) {
      const u = i / steps
      const ease = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2
      const arc = Math.sin(u * Math.PI)
      const x = sx + dx * ease + perpX * arc
      const y = sy + dy * ease + perpY * arc
      cursorX = x
      cursorY = y
      await browser.evaluate(`window.__setCursor && window.__setCursor(${x.toFixed(1)}, ${y.toFixed(1)}, false)`).catch(() => {})
      await browser.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(x), y: Math.round(y) }).catch(() => {})
      const expected = t0 + (durationMs * i) / steps
      const wait = expected - Date.now()
      if (wait > 2) await sleep(wait)
    }
    cursorX = tx
    cursorY = ty
  }

  const resolveRect = async (finderJs) => {
    const rect = await browser.evaluate(finderJs)
    if (!rect || !rect.w || !rect.h) {
      throw new Error(`Target element not found or zero-sized: ${finderJs}`)
    }
    return rect
  }

  const clickAt = async (x, y) => {
    const rx = Math.round(x)
    const ry = Math.round(y)
    await browser.evaluate(`window.__setCursor && window.__setCursor(${x.toFixed(1)}, ${y.toFixed(1)}, true)`).catch(() => {})
    await browser.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: rx, y: ry, button: 'left', clickCount: 1 })
    await sleep(95)
    await browser.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: rx, y: ry, button: 'left', clickCount: 1 })
    await browser.evaluate(`window.__setCursor && window.__setCursor(${x.toFixed(1)}, ${y.toFixed(1)}, false)`).catch(() => {})
  }

  const typeHuman = async (text, charDelayMs = 72) => {
    for (const ch of text) {
      await browser.send('Input.insertText', { text: ch })
      await sleep(charDelayMs)
    }
  }

  const pushZoomIn = (fx, fy, zoomFactor, zoomInMs) => {
    const t0 = nowSec()
    const t1 = t0 + zoomInMs / 1000
    cameraEvents.push({ t: t0, zoom: 1, x: fx, y: fy })
    cameraEvents.push({ t: t1, zoom: zoomFactor, x: fx, y: fy })
  }

  const pushZoomOut = (fx, fy, zoomFactor, zoomOutMs) => {
    const t0 = nowSec()
    const t1 = t0 + zoomOutMs / 1000
    cameraEvents.push({ t: t0, zoom: zoomFactor, x: fx, y: fy })
    cameraEvents.push({ t: t1, zoom: 1, x: VIEW_W / 2, y: VIEW_H / 2 })
  }

  const zoomAction = async ({
    finderJs,
    actionType = 'click',
    text = '',
    clearExisting = false,
    moveMs = 520,
    pauseBeforeMs = 300,
    zoomInMs = 520,
    zoomFactor = 1.78,
    holdAfterMs = 450,
    zoomOutMs = 520,
    focusOffsetY = 0,
    charDelayMs = 75,
  }) => {
    const rect = await resolveRect(finderJs)
    const tx = rect.cx
    const ty = rect.cy
    const fx = rect.cx
    const fy = rect.cy + focusOffsetY

    await moveCursorTo(tx, ty, moveMs)
    await sleep(pauseBeforeMs)

    pushZoomIn(fx, fy, zoomFactor, zoomInMs)
    await sleep(zoomInMs)

    if (actionType === 'click') {
      await clickAt(tx, ty)
    } else if (actionType === 'type') {
      await clickAt(tx, ty)
      await sleep(110)
      if (clearExisting) {
        await browser.evaluate(`(() => {
          const el = document.activeElement;
          if (el && ('value' in el)) {
            const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
            proto.set.call(el, '');
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
        })()`)
        await sleep(90)
      }
      await typeHuman(text, charDelayMs)
    } else if (actionType === 'hold') {
      // Just hold zoomed for viewer comprehension
    }

    await sleep(holdAfterMs)
    pushZoomOut(fx, fy, zoomFactor, zoomOutMs)
    await sleep(zoomOutMs)
  }

  return {
    start: () => captureLoopPromise,
    waitUntil,
    moveCursorTo,
    clickAt,
    zoomAction,
    finish: async () => {
      await waitUntil(durationSec)
      stopped = true
      await captureLoopPromise
      return cameraEvents
    },
  }
}

async function runPartA() {
  console.log('--- Recording Part A (21.15s -> 114.90s, 93.75s) ---')
  const browser = await launchChrome(9451, path.join(os.tmpdir(), `demo-part-a-${process.pid}`))
  try {
    // Force offline demo mode so English stays selected and 8-member 192,000 FCFA Round 3 Mariama Sow data shows
    await browser.send('Network.setBlockedURLs', { urls: ['*/api/*'] })
    await browser.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        localStorage.setItem('tontinesats.settings.v1', JSON.stringify({ theme: 'light', reduceMotion: false, demoMode: true, locale: 'fr' }));
        localStorage.removeItem('tontinesats.session.v1');
      `,
    })
    await browser.send('Page.navigate', { url: `${ORIGIN}/` })
    await sleep(1100)
    await browser.evaluate(browser.cursorInjection)

    const rec = createRecorderSession(browser, path.join(TMP_DIR, 'raw-part-a.mp4'), 93.75)
    const loop = rec.start()

    // 2.0s (VO 23.15s): Hover landing preview card (192,000 FCFA)
    await rec.waitUntil(2.0)
    const previewPos = await browser.evaluate(`(() => {
      const el = document.querySelector('aside[aria-label]');
      if (!el) return { cx: 1020, cy: 370 };
      const r = el.getBoundingClientRect();
      return { cx: r.left + r.width * 0.45, cy: r.top + r.height * 0.34 };
    })()`)
    await rec.moveCursorTo(previewPos.cx, previewPos.cy, 700)

    // 8.8s (VO 29.95s): Zoom to EN button -> click English (right at ~31.8s)
    await rec.waitUntil(8.8)
    await rec.zoomAction({
      finderJs: `(() => {
        const b = document.querySelector('button[aria-label="English"]');
        if (!b) return null;
        const r = b.getBoundingClientRect();
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height };
      })()`,
      actionType: 'click',
      moveMs: 520,
      pauseBeforeMs: 280,
      zoomInMs: 480,
      zoomFactor: 1.9,
      holdAfterMs: 420,
      zoomOutMs: 480,
    })

    // 12.6s (VO 33.75s): Zoom to Demo button -> click Demo into /app (~35.0s)
    await rec.waitUntil(12.6)
    await rec.zoomAction({
      finderJs: `(() => {
        const b = [...document.querySelectorAll('main button')].find(el => el.textContent.trim() === 'Demo' || el.textContent.trim() === 'Démo');
        if (!b) return null;
        const r = b.getBoundingClientRect();
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height };
      })()`,
      actionType: 'click',
      moveMs: 480,
      pauseBeforeMs: 260,
      zoomInMs: 480,
      zoomFactor: 1.85,
      holdAfterMs: 480,
      zoomOutMs: 520,
    })

    // 23.0s (VO 44.15s): Glide gently near PotRing & Mariama beneficiary badge while full screen
    await rec.waitUntil(22.8)
    const ringPos = await browser.evaluate(`(() => {
      const p = [...document.querySelectorAll('p')].find(el => el.textContent.includes('192') || el.textContent.includes('Mariama'));
      if (!p) return { cx: 610, cy: 420 };
      const r = p.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    })()`)
    await rec.moveCursorTo(ringPos.cx + 12, ringPos.cy + 8, 700)

    await rec.waitUntil(28.8)
    const mariamaPos = await browser.evaluate(`(() => {
      const p = [...document.querySelectorAll('p')].find(el => el.textContent.includes('Mariama Sow receives'));
      if (!p) return { cx: 610, cy: 480 };
      const r = p.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    })()`)
    await rec.moveCursorTo(mariamaPos.cx, mariamaPos.cy, 620)

    // 33.0s (VO 54.15s): Zoom to Moussa · Paris persona switcher -> click (~56.3s)
    await rec.waitUntil(33.0)
    await rec.zoomAction({
      finderJs: `(() => {
        const b = [...document.querySelectorAll('button')].find(el => el.textContent.includes('Moussa'));
        if (!b) return null;
        const r = b.getBoundingClientRect();
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height };
      })()`,
      actionType: 'click',
      moveMs: 520,
      pauseBeforeMs: 300,
      zoomInMs: 500,
      zoomFactor: 1.85,
      holdAfterMs: 650,
      zoomOutMs: 500,
    })

    // 42.5s (VO 63.65s): Zoom to Pay contribution button -> click (~65.3s)
    await rec.waitUntil(42.5)
    await rec.zoomAction({
      finderJs: `(() => {
        const b = [...document.querySelectorAll('button')].find(el => /Pay\\s/.test(el.textContent) && !el.closest('[role="dialog"]'));
        if (!b) return null;
        const r = b.getBoundingClientRect();
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height };
      })()`,
      actionType: 'click',
      moveMs: 520,
      pauseBeforeMs: 280,
      zoomInMs: 480,
      zoomFactor: 1.75,
      holdAfterMs: 450,
      zoomOutMs: 480,
    })

    // 56.5s - 64.5s (VO 77.65s - 85.65s): Hover direct-to-Mariama trust text, NWC option, then Lightning QR option
    await rec.waitUntil(56.5)
    const trustPos = await browser.evaluate(`(() => {
      const d = document.querySelector('[role="dialog"]');
      if (!d) return { cx: 720, cy: 580 };
      const p = [...d.querySelectorAll('p')].find(el => el.textContent.includes('Mariama'));
      const r = (p || d).getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    })()`)
    await rec.moveCursorTo(trustPos.cx, trustPos.cy, 620)

    await rec.waitUntil(60.5)
    const nwcPos = await browser.evaluate(`(() => {
      const d = document.querySelector('[role="dialog"]');
      if (!d) return { cx: 720, cy: 400 };
      const l = [...d.querySelectorAll('label')].find(el => el.textContent.includes('Automatic'));
      const r = (l || d).getBoundingClientRect();
      return { cx: r.left + r.width * 0.45, cy: r.top + r.height / 2 };
    })()`)
    await rec.moveCursorTo(nwcPos.cx, nwcPos.cy, 500)

    await rec.waitUntil(63.4)
    const qrPos = await browser.evaluate(`(() => {
      const d = document.querySelector('[role="dialog"]');
      if (!d) return { cx: 720, cy: 470 };
      const l = [...d.querySelectorAll('label')].find(el => el.textContent.includes('Lightning QR'));
      const r = (l || d).getBoundingClientRect();
      return { cx: r.left + r.width * 0.45, cy: r.top + r.height / 2 };
    })()`)
    await rec.moveCursorTo(qrPos.cx, qrPos.cy, 500)

    // 65.8s (VO 86.95s): Zoom to Pay button inside dialog -> click (~88.2s) -> zoom out quickly for settlement animation
    await rec.waitUntil(65.8)
    await rec.zoomAction({
      finderJs: `(() => {
        const d = document.querySelector('[role="dialog"]');
        if (!d) return null;
        const b = [...d.querySelectorAll('button')].find(el => /Pay\\s/.test(el.textContent));
        if (!b) return null;
        const r = b.getBoundingClientRect();
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height };
      })()`,
      actionType: 'click',
      moveMs: 420,
      pauseBeforeMs: 260,
      zoomInMs: 440,
      zoomFactor: 1.75,
      holdAfterMs: 320,
      zoomOutMs: 440,
    })

    // 71.0s (VO 92.15s): Wait for "See receipt" button after settlement, zoom in -> click -> /app/receipt/3
    await rec.waitUntil(71.0)
    await rec.zoomAction({
      finderJs: `(() => {
        const d = document.querySelector('[role="dialog"]');
        if (!d) return null;
        const b = [...d.querySelectorAll('button')].find(el => el.textContent.includes('receipt'));
        if (!b) return null;
        const r = b.getBoundingClientRect();
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height };
      })()`,
      actionType: 'click',
      moveMs: 420,
      pauseBeforeMs: 250,
      zoomInMs: 440,
      zoomFactor: 1.75,
      holdAfterMs: 300,
      zoomOutMs: 440,
    })

    // 74.3s (VO 95.45s): Zoom in & hold on Payment Proof (preimage + Nostr kind 30078)
    await rec.waitUntil(74.3)
    await rec.zoomAction({
      finderJs: `(() => {
        const ol = document.querySelector('main ol');
        if (!ol) return null;
        const r = ol.getBoundingClientRect();
        return { cx: r.left + r.width * 0.45, cy: r.top + r.height * 0.62, w: r.width, h: r.height };
      })()`,
      actionType: 'hold',
      moveMs: 520,
      pauseBeforeMs: 240,
      zoomInMs: 520,
      zoomFactor: 1.65,
      holdAfterMs: 3000,
      zoomOutMs: 500,
    })

    // 79.9s (VO 101.05s): Zoom to Passport nav link -> click -> /app/passport
    await rec.waitUntil(79.9)
    await rec.zoomAction({
      finderJs: `(() => {
        const a = document.querySelector('aside a[href="/app/passport"]');
        if (!a) return null;
        const r = a.getBoundingClientRect();
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height };
      })()`,
      actionType: 'click',
      moveMs: 480,
      pauseBeforeMs: 260,
      zoomInMs: 460,
      zoomFactor: 1.85,
      holdAfterMs: 380,
      zoomOutMs: 480,
    })

    // 86.0s (VO 107.15s): Glide gently across the 100% On-Time ring & Portable badge
    await rec.waitUntil(85.5)
    await rec.moveCursorTo(520, 340, 750)
    await rec.waitUntil(89.5)
    await rec.moveCursorTo(980, 290, 750)

    const cameraEvents = await rec.finish()
    await loop
    await writeFile(path.join(TMP_DIR, 'camera-part-a.json'), JSON.stringify({ width: VIEW_W, height: VIEW_H, fps: FPS, events: cameraEvents }, null, 2))
    console.log('Part A complete.')
  } finally {
    await browser.close()
  }
}

async function runPartB() {
  console.log('--- Recording Part B (114.90s -> 142.00s, 27.10s) ---')
  // Seed live backend and get Awa's seeded session
  const seedRes = await fetch(`${API_ORIGIN}/api/demo/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reset: true }),
  })
  if (!seedRes.ok) throw new Error(`Seed failed: ${seedRes.status}`)
  const seeded = await seedRes.json()
  const awa = seeded.personas[0]

  const sessionPayload = {
    mode: 'demo',
    npub: awa.npub,
    nsec: awa.nsec,
    name: awa.name,
    locale: 'en',
    lightningAddress: awa.lightningAddress,
    createdAt: Date.now(),
  }
  const settingsPayload = {
    theme: 'light',
    reduceMotion: false,
    demoMode: true,
    locale: 'en',
  }

  const browser = await launchChrome(9452, path.join(os.tmpdir(), `demo-part-b-${process.pid}`))
  try {
    await browser.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        localStorage.setItem('tontinesats.settings.v1', ${JSON.stringify(JSON.stringify(settingsPayload))});
        localStorage.setItem('tontinesats.session.v1', ${JSON.stringify(JSON.stringify(sessionPayload))});
        localStorage.setItem('tontinesats.circle.v1', ${JSON.stringify(seeded.circleId)});
        localStorage.setItem('tontinesats.personas.v1', ${JSON.stringify(JSON.stringify(seeded.personas))});
      `,
    })

    await browser.send('Page.navigate', { url: `${ORIGIN}/app` })
    await sleep(1600)
    await browser.evaluate(browser.cursorInjection)

    // Verify New circle button is present (proves backendOnline === true)
    const hasNewCircle = await browser.evaluate(`Boolean([...document.querySelectorAll('button')].find(b => b.textContent.includes('New circle')))`)
    if (!hasNewCircle) throw new Error('Live backend not active in Part B (New circle button missing)')

    const rec = createRecorderSession(browser, path.join(TMP_DIR, 'raw-part-b.mp4'), 27.10)
    const loop = rec.start()

    // 2.6s (VO 117.50s): Zoom to "New circle" button -> click
    await rec.waitUntil(2.6)
    await rec.zoomAction({
      finderJs: `(() => {
        const b = [...document.querySelectorAll('button')].find(el => el.textContent.includes('New circle'));
        if (!b) return null;
        const r = b.getBoundingClientRect();
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height };
      })()`,
      actionType: 'click',
      moveMs: 480,
      pauseBeforeMs: 260,
      zoomInMs: 460,
      zoomFactor: 1.85,
      holdAfterMs: 360,
      zoomOutMs: 440,
    })

    // 5.2s (VO 120.10s): Zoom to Circle name input -> type "Dakar Builders"
    await rec.waitUntil(5.2)
    await rec.zoomAction({
      finderJs: `(() => {
        const d = document.querySelector('[role="dialog"]');
        if (!d) return null;
        const inp = d.querySelector('input[type="text"], input:not([type])');
        if (!inp) return null;
        const r = inp.getBoundingClientRect();
        return { cx: r.left + r.width * 0.35, cy: r.top + r.height / 2, w: r.width, h: r.height };
      })()`,
      actionType: 'type',
      text: 'Dakar Builders',
      clearExisting: true,
      moveMs: 380,
      pauseBeforeMs: 220,
      zoomInMs: 420,
      zoomFactor: 1.75,
      charDelayMs: 68,
      holdAfterMs: 340,
      zoomOutMs: 420,
    })

    // 8.3s (VO 123.20s): Zoom to Contribution FCFA input -> type "24000" -> hold to show live EUR + sats conversion
    await rec.waitUntil(8.3)
    await rec.zoomAction({
      finderJs: `(() => {
        const d = document.querySelector('[role="dialog"]');
        if (!d) return null;
        const inp = d.querySelector('input[type="number"]');
        if (!inp) return null;
        const r = inp.getBoundingClientRect();
        return { cx: r.left + r.width * 0.32, cy: r.top + r.height / 2, w: r.width, h: r.height };
      })()`,
      actionType: 'type',
      text: '24000',
      clearExisting: true,
      focusOffsetY: 24,
      moveMs: 360,
      pauseBeforeMs: 220,
      zoomInMs: 420,
      zoomFactor: 1.78,
      charDelayMs: 80,
      holdAfterMs: 2800,
      zoomOutMs: 420,
    })

    // 13.7s (VO 128.60s): Zoom to "Create and get invite code" submit button -> click
    await rec.waitUntil(13.7)
    await rec.zoomAction({
      finderJs: `(() => {
        const d = document.querySelector('[role="dialog"]');
        if (!d) return null;
        const b = d.querySelector('button[type="submit"]');
        if (!b) return null;
        const r = b.getBoundingClientRect();
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height };
      })()`,
      actionType: 'click',
      moveMs: 360,
      pauseBeforeMs: 220,
      zoomInMs: 420,
      zoomFactor: 1.75,
      holdAfterMs: 380,
      zoomOutMs: 440,
    })

    // 16.5s - 20.3s: Let live Invite sheet display the newly generated backend invite code, then close cleanly for outro
    await rec.waitUntil(16.8)
    const codePos = await browser.evaluate(`(() => {
      const d = document.querySelector('[role="dialog"]');
      if (!d) return { cx: 720, cy: 405 };
      const r = d.getBoundingClientRect();
      return { cx: r.left + r.width * 0.5, cy: r.top + r.height * 0.45 };
    })()`)
    await rec.moveCursorTo(codePos.cx, codePos.cy, 650)

    await rec.waitUntil(20.1)
    const closePos = await browser.evaluate(`(() => {
      const d = document.querySelector('[role="dialog"]');
      if (!d) return null;
      const b = d.querySelector('button[aria-label="Close"]');
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    })()`)
    if (closePos) {
      await rec.moveCursorTo(closePos.cx, closePos.cy, 480)
      await sleep(160)
      await rec.clickAt(closePos.cx, closePos.cy)
    }

    await rec.waitUntil(21.6)
    await rec.moveCursorTo(1180, 620, 750)

    const cameraEvents = await rec.finish()
    await loop
    await writeFile(path.join(TMP_DIR, 'camera-part-b.json'), JSON.stringify({ width: VIEW_W, height: VIEW_H, fps: FPS, events: cameraEvents }, null, 2))
    console.log('Part B complete.')
  } finally {
    await browser.close()
  }
}

await mkdir(TMP_DIR, { recursive: true })
await runPartA()
await runPartB()
console.log('ALL RECORDINGS COMPLETE')

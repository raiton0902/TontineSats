import json
import math
import os
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
TMP_DIR = ROOT / "video" / "tmp"
TMP_DIR.mkdir(parents=True, exist_ok=True)

FPS = 30
VIEW_W = 1440
VIEW_H = 810
ORIGIN = os.environ.get("DEMO_ORIGIN", "http://127.0.0.1:5175")
API_ORIGIN = os.environ.get("API_ORIGIN", "http://127.0.0.1:3001")

CURSOR_SVG = """
<div id="__demo_cursor" style="position:fixed;left:0;top:0;width:28px;height:28px;z-index:2147483647;pointer-events:none;transform:translate3d(-100px,-100px,0);transform-origin:3px 2px;will-change:transform;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.34));">
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 2.5L4 22.5L9.4 17.3L13.3 25L16.4 23.4L12.5 15.8L20 15.4L4 2.5Z" fill="#0F172A" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>
  </svg>
</div>
"""

CURSOR_SCRIPT = f"""
(() => {{
  const install = () => {{
    if (document.getElementById('__demo_cursor')) return;
    const div = document.createElement('div');
    div.innerHTML = `{CURSOR_SVG.strip()}`;
    (document.body || document.documentElement).appendChild(div.firstElementChild);
    window.__setCursor = (x, y, pressing) => {{
      const el = document.getElementById('__demo_cursor');
      if (!el) return;
      const s = pressing ? 0.88 : 1;
      el.style.transform = `translate3d(${{x - 3}}px, ${{y - 2}}px, 0) scale(${{s}})`;
    }};
  }};
  if (document.readyState === 'loading') {{
    document.addEventListener('DOMContentLoaded', install, {{ once: true }});
  }} else {{
    install();
  }}
  new MutationObserver(() => {{
    if (!document.getElementById('__demo_cursor')) install();
  }}).observe(document.documentElement, {{ childList: true }});
}})();
"""


class HumanRecorder:
    def __init__(self, page, duration_sec):
        self.page = page
        self.duration_sec = duration_sec
        self.camera_events = [{"t": 0.0, "zoom": 1.0, "x": VIEW_W / 2.0, "y": VIEW_H / 2.0}]
        self.cursor_x = 760.0
        self.cursor_y = 440.0
        self.start_time = None

    def start(self):
        self.start_time = time.time()
        self.page.evaluate(f"window.__setCursor && window.__setCursor({self.cursor_x}, {self.cursor_y}, false)")

    def now(self):
        return time.time() - self.start_time

    def wait_until(self, target_sec):
        rem = target_sec - self.now()
        if rem > 0:
            time.sleep(rem)

    def move_mouse(self, tx, ty, duration_sec=0.5):
        sx, sy = self.cursor_x, self.cursor_y
        dx, dy = tx - sx, ty - sy
        dist = math.hypot(dx, dy)
        perp_x = (-dy / dist) * min(16, dist * 0.04) if dist > 20 else 0
        perp_y = (dx / dist) * min(16, dist * 0.04) if dist > 20 else 0

        steps = max(8, int(duration_sec * 30))
        t0 = time.time()
        for i in range(1, steps + 1):
            u = i / steps
            ease = 4 * u * u * u if u < 0.5 else 1 - math.pow(-2 * u + 2, 3) / 2
            arc = math.sin(u * math.pi)
            cx = sx + dx * ease + perp_x * arc
            cy = sy + dy * ease + perp_y * arc
            self.cursor_x, self.cursor_y = cx, cy

            self.page.evaluate(f"window.__setCursor && window.__setCursor({cx:.1f}, {cy:.1f}, false)")
            self.page.mouse.move(cx, cy)
            expected = t0 + (duration_sec * i) / steps
            rem = expected - time.time()
            if rem > 0.002:
                time.sleep(rem)
        self.cursor_x, self.cursor_y = tx, ty

    def click(self, x, y):
        self.page.evaluate(f"window.__setCursor && window.__setCursor({x:.1f}, {y:.1f}, true)")
        self.page.mouse.down()
        time.sleep(0.09)
        self.page.mouse.up()
        self.page.evaluate(f"window.__setCursor && window.__setCursor({x:.1f}, {y:.1f}, false)")

    def zoom_action(
        self,
        finder_js,
        action="click",
        text="",
        clear=False,
        move_sec=0.5,
        pause_before=0.28,
        zoom_in_sec=0.48,
        zoom_factor=1.8,
        hold_sec=0.45,
        zoom_out_sec=0.48,
        offset_y=0,
    ):
        rect = self.page.evaluate(finder_js)
        if not rect:
            print(f"Warning: element not found: {finder_js}")
            return
        cx = rect["cx"]
        cy = rect["cy"]

        self.move_mouse(cx, cy, move_sec)
        time.sleep(pause_before)

        # Zoom In ramp
        t_in_start = self.now()
        t_in_end = t_in_start + zoom_in_sec
        fx = cx
        fy = cy + offset_y
        self.camera_events.append({"t": t_in_start, "zoom": 1.0, "x": fx, "y": fy})
        self.camera_events.append({"t": t_in_end, "zoom": zoom_factor, "x": fx, "y": fy})
        time.sleep(zoom_in_sec)

        # Action execution
        if action == "click":
            self.click(cx, cy)
        elif action == "type":
            self.click(cx, cy)
            time.sleep(0.1)
            if clear:
                self.page.keyboard.press("Control+A")
                self.page.keyboard.press("Backspace")
                time.sleep(0.08)
            for ch in text:
                self.page.keyboard.type(ch)
                time.sleep(0.075)

        time.sleep(hold_sec)

        # Zoom Out ramp
        t_out_start = self.now()
        t_out_end = t_out_start + zoom_out_sec
        self.camera_events.append({"t": t_out_start, "zoom": zoom_factor, "x": fx, "y": fy})
        self.camera_events.append({"t": t_out_end, "zoom": 1.0, "x": VIEW_W / 2.0, "y": VIEW_H / 2.0})
        time.sleep(zoom_out_sec)

    def finish(self, camera_json_path):
        self.wait_until(self.duration_sec)
        data = {
            "width": VIEW_W,
            "height": VIEW_H,
            "fps": FPS,
            "events": self.camera_events,
        }
        Path(camera_json_path).write_text(json.dumps(data, indent=2), encoding="utf-8")


def record_part_a(playwright):
    print("\n=== Recording Part A (Landing -> Circle Demo -> Passport: 93.75s) ===")
    rec_dir = TMP_DIR / "rec_a"
    rec_dir.mkdir(parents=True, exist_ok=True)

    browser = playwright.chromium.launch(
        headless=True,
        args=["--hide-scrollbars", "--no-sandbox", "--disable-setuid-sandbox"],
    )
    context = browser.new_context(
        viewport={"width": VIEW_W, "height": VIEW_H},
        device_scale_factor=1.5,
        record_video_dir=str(rec_dir),
        record_video_size={"width": VIEW_W, "height": VIEW_H},
    )

    # Block API so it stays in offline demo mode with 8-member 192,000 FCFA Round 3 data
    context.route("**/api/**", lambda route: route.abort())

    page = context.new_page()
    page.add_init_script(CURSOR_SCRIPT)
    page.add_init_script(
        """
        localStorage.setItem('tontinesats.settings.v1', JSON.stringify({ theme: 'light', reduceMotion: false, demoMode: true, locale: 'fr' }));
        localStorage.removeItem('tontinesats.session.v1');
        """
    )

    page.goto(f"{ORIGIN}/")
    page.wait_for_load_state("networkidle")
    time.sleep(1.0)

    rec = HumanRecorder(page, duration_sec=93.75)
    rec.start()

    # 2.0s: Hover landing preview card (voice: "Here on the landing page" @ 21.65s abs / 0.48s rel)
    rec.wait_until(2.0)
    card_pos = page.evaluate(
        """(() => {
        const el = document.querySelector('aside[aria-label]');
        if (!el) return { cx: 1020, cy: 370 };
        const r = el.getBoundingClientRect();
        return { cx: r.left + r.width * 0.45, cy: r.top + r.height * 0.35 };
    })()"""
    )
    rec.move_mouse(card_pos["cx"], card_pos["cy"], 0.7)

    # 11.0s: Zoom to EN button -> click English
    # Voice: "Let's switch to English" @ audio 32.63s -> rel 11.46s (was 8.8 — was 2.66s too early)
    rec.wait_until(11.0)
    rec.zoom_action(
        finder_js="""(() => {
            const b = document.querySelector('button[aria-label="English"]');
            if (!b) return null;
            const r = b.getBoundingClientRect();
            return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
        })()""",
        action="click",
        zoom_factor=1.9,
    )

    # 12.5s: Zoom to Demo button -> click Demo
    # Voice: "jump straight into a live demo circle" @ audio 33.96s -> rel 12.79s (was 12.6 — ✓ close)
    rec.wait_until(12.5)
    rec.zoom_action(
        finder_js="""(() => {
            const b = [...document.querySelectorAll('main button')].find(el => el.textContent.trim() === 'Demo' || el.textContent.trim() === 'Démo');
            if (!b) return null;
            const r = b.getBoundingClientRect();
            return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
        })()""",
        action="click",
        zoom_factor=1.85,
    )

    # 19.5s: Hover PotRing
    # Voice: "Eight members each contribute 24,000 CFA" @ audio 40.98s -> rel 19.81s (was 23.0 — was 3.2s late)
    rec.wait_until(19.5)
    rec.move_mouse(610, 420, 0.7)

    # 30.0s: Hover Mariama badge
    # Voice: "round three goes to Mariama" @ audio 51.48s -> rel 30.31s (was 28.8 — was 1.5s early)
    rec.wait_until(30.0)
    rec.move_mouse(610, 490, 0.6)

    # 33.6s: Zoom to Moussa · Paris persona button -> click
    # Voice: "like Moussa in Paris" @ audio 55.06s -> rel 33.89s (was 33.0 — +0.89s)
    rec.wait_until(33.6)
    rec.zoom_action(
        finder_js="""(() => {
            const b = [...document.querySelectorAll('button')].find(el => el.textContent.includes('Moussa'));
            if (!b) return null;
            const r = b.getBoundingClientRect();
            return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
        })()""",
        action="click",
        zoom_factor=1.85,
        hold_sec=0.7,
    )

    # 42.8s: Zoom to Pay contribution button -> click
    # Voice: "Now let's contribute to round three" @ audio 64.17s -> rel 43.00s (was 42.5 — +0.5s)
    rec.wait_until(42.8)
    rec.zoom_action(
        finder_js="""(() => {
            const b = [...document.querySelectorAll('button')].find(el => /Pay\\s/.test(el.textContent) && !el.closest('[role="dialog"]'));
            if (!b) return null;
            const r = b.getBoundingClientRect();
            return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
        })()""",
        action="click",
        zoom_factor=1.75,
    )

    # 56.0s: Hover trust note — "switching your view automatically shows EUR" @ audio 56.56s -> rel 35.39s
    # NOTE: This hover sequence is inside the payment modal; timing is relative to after Pay click.
    # After Pay click zoom at ~42.8s, modal opens. Hover modal contents:
    rec.wait_until(50.0)
    rec.move_mouse(720, 580, 0.6)
    rec.wait_until(54.0)
    rec.move_mouse(720, 400, 0.5)
    rec.wait_until(57.0)
    rec.move_mouse(720, 470, 0.5)

    # 60.0s: Zoom to Pay in modal -> click
    # Voice: "One click and the contribution settles peer-to-peer" @ audio 87.99s -> rel 66.82s
    # But we need to click Pay first at ~43.46s rel to trigger payment flow. Keep close to voice.
    rec.wait_until(60.0)
    rec.zoom_action(
        finder_js="""(() => {
            const d = document.querySelector('[role="dialog"]');
            if (!d) return null;
            const b = [...d.querySelectorAll('button')].find(el => /Pay\\s/.test(el.textContent));
            if (!b) return null;
            const r = b.getBoundingClientRect();
            return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
        })()""",
        action="click",
        zoom_factor=1.75,
        hold_sec=0.3,
    )

    # 71.3s: Zoom in on the payment success amount in the dialog -> hold
    # Voice: "Every payment produces a cryptographic receipt" @ audio 92.81s -> rel 71.64s
    rec.wait_until(71.3)
    rec.zoom_action(
        finder_js="""(() => {
            const d = document.querySelector('[role="dialog"]');
            if (!d) return null;
            const p = d.querySelector('p.tabular');
            if (!p) return null;
            const r = p.getBoundingClientRect();
            return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
        })()""",
        action="hold",
        zoom_factor=1.65,
        hold_sec=3.0,
    )

    # 73.4s: Zoom to "See receipt" button -> click
    # Voice: "cryptographic receipt" @ audio 94.90s -> rel 73.73s (was 71.0 — was 2.73s early)
    rec.wait_until(73.4)
    rec.zoom_action(
        finder_js="""(() => {
            const d = document.querySelector('[role="dialog"]');
            if (!d) return null;
            const b = [...d.querySelectorAll('button')].find(el => el.textContent.includes('receipt'));
            if (!b) return null;
            const r = b.getBoundingClientRect();
            return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
        })()""",
        action="click",
        zoom_factor=1.75,
    )

    # 80.3s: Zoom to Passport link in sidebar -> click
    # Voice: "Over in the trust passport" @ audio 101.77s -> rel 80.60s (was 79.9 — close, +0.70s)
    rec.wait_until(80.3)
    rec.zoom_action(
        finder_js="""(() => {
            const a = document.querySelector('aside a[href="/app/passport"]');
            if (!a) return null;
            const r = a.getBoundingClientRect();
            return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
        })()""",
        action="click",
        zoom_factor=1.85,
    )

    # 89.3s: Calm mouse glide over passport
    # Voice: "something you truly own" @ audio 110.81s -> rel 89.64s (was 86.0 — 3.64s early)
    rec.wait_until(89.3)
    rec.move_mouse(520, 340, 0.7)
    rec.wait_until(92.0)
    rec.move_mouse(980, 290, 0.7)

    rec.finish(TMP_DIR / "camera-part-a.json")
    video_path = page.video.path()
    context.close()
    browser.close()

    # Move raw recorded webm to standard location
    raw_a_dest = TMP_DIR / "raw-part-a.webm"
    if raw_a_dest.exists():
        raw_a_dest.unlink()
    Path(video_path).rename(raw_a_dest)
    print(f"Part A recorded: {raw_a_dest}")


def record_part_b(playwright):
    print("\n=== Recording Part B (Live Create Circle: 27.10s) ===")
    rec_dir = TMP_DIR / "rec_b"
    rec_dir.mkdir(parents=True, exist_ok=True)

    # Seed backend via curl/fetch
    import urllib.request

    seed_req = urllib.request.Request(
        f"{API_ORIGIN}/api/v1/demo/seed",
        data=b'{"reset":true}',
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(seed_req) as resp:
        seeded = json.loads(resp.read().decode("utf-8"))
    awa = seeded["personas"][0]

    session_payload = {
        "mode": "demo",
        "npub": awa["npub"],
        "nsec": awa["nsec"],
        "name": awa["name"],
        "locale": "en",
        "lightningAddress": awa["lightningAddress"],
        "createdAt": int(time.time() * 1000),
    }
    settings_payload = {
        "theme": "light",
        "reduceMotion": False,
        "demoMode": True,
        "locale": "en",
    }

    browser = playwright.chromium.launch(
        headless=True,
        args=["--hide-scrollbars", "--no-sandbox", "--disable-setuid-sandbox"],
    )
    context = browser.new_context(
        viewport={"width": VIEW_W, "height": VIEW_H},
        device_scale_factor=1.5,
        record_video_dir=str(rec_dir),
        record_video_size={"width": VIEW_W, "height": VIEW_H},
    )

    page = context.new_page()
    page.add_init_script(CURSOR_SCRIPT)
    page.add_init_script(
        f"""
        localStorage.setItem('tontinesats.settings.v1', JSON.stringify({json.dumps(settings_payload)}));
        localStorage.setItem('tontinesats.session.v1', JSON.stringify({json.dumps(session_payload)}));
        localStorage.setItem('tontinesats.circle.v1', JSON.stringify('{seeded["circleId"]}'));
        localStorage.setItem('tontinesats.personas.v1', JSON.stringify({json.dumps(seeded["personas"])}));
        """
    )

    # Navigate to landing first (eliminates white-flash on cut-in)
    page.goto(f"{ORIGIN}/")
    page.wait_for_load_state("networkidle")
    time.sleep(0.6)

    # Then go to app — smooth transition instead of white blank
    page.goto(f"{ORIGIN}/app")
    page.wait_for_load_state("networkidle")
    time.sleep(1.5)

    rec = HumanRecorder(page, duration_sec=27.10)
    rec.start()

    # 3.3s: Zoom to "New circle" button -> click
    # Voice: "Just click New Circle" @ audio 118.45s -> rel Part B: 3.53s (was 2.6 — 0.93s early)
    rec.wait_until(3.3)
    rec.zoom_action(
        finder_js="""(() => {
            const b = [...document.querySelectorAll('button')].find(el => el.textContent.includes('New circle'));
            if (!b) return null;
            const r = b.getBoundingClientRect();
            return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
        })()""",
        action="click",
        zoom_factor=1.85,
    )

    # 5.4s: Zoom to Circle name input -> type "Dakar Builders"
    # Voice: "enter a name like Dakar Builders" @ audio 120.51s -> rel: 5.59s (was 5.2 — +0.39s)
    rec.wait_until(5.4)
    rec.zoom_action(
        finder_js="""(() => {
            const d = document.querySelector('[role="dialog"]');
            if (!d) return null;
            const inp = d.querySelector('input[type="text"], input:not([type])');
            if (!inp) return null;
            const r = inp.getBoundingClientRect();
            return { cx: r.left + r.width * 0.35, cy: r.top + r.height / 2 };
        })()""",
        action="type",
        text="Dakar Builders",
        clear=True,
        zoom_factor=1.75,
    )

    # 8.2s: Zoom to Amount input -> type "24000" -> hold to observe live EUR/sats
    # Voice: "set the monthly contribution in CFA" @ audio 123.30s -> rel: 8.38s (was 8.3 — ✓ close)
    rec.wait_until(8.2)
    rec.zoom_action(
        finder_js="""(() => {
            const d = document.querySelector('[role="dialog"]');
            if (!d) return null;
            const inp = d.querySelector('input[type="number"]');
            if (!inp) return null;
            const r = inp.getBoundingClientRect();
            return { cx: r.left + r.width * 0.32, cy: r.top + r.height / 2 };
        })()""",
        action="type",
        text="24000",
        clear=True,
        offset_y=24,
        zoom_factor=1.78,
        hold_sec=2.8,
    )

    # 14.5s: Zoom to Create submit button -> click
    # Voice: "hit Create" @ audio 129.64s -> rel: 14.72s (was 13.7 — 1.02s early)
    rec.wait_until(14.5)
    rec.zoom_action(
        finder_js="""(() => {
            const d = document.querySelector('[role="dialog"]');
            if (!d) return null;
            const b = d.querySelector('button[type="submit"]');
            if (!b) return null;
            const r = b.getBoundingClientRect();
            return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
        })()""",
        action="click",
        zoom_factor=1.75,
    )

    # 15.9s: View generated invite code dialog
    # Voice: "You immediately get a live invite code" @ audio 131.07s -> rel: 16.15s (was 16.8 — close)
    rec.wait_until(15.9)
    rec.move_mouse(720, 405, 0.6)

    # 18.6s: Close dialog
    # Voice: "to share with your group" @ audio 133.78s -> rel: 18.86s (was 20.1 — 1.24s late)
    rec.wait_until(18.6)
    close_btn = page.evaluate(
        """(() => {
        const d = document.querySelector('[role="dialog"]');
        if (!d) return null;
        const b = d.querySelector('button[aria-label="Close"]');
        if (!b) return null;
        const r = b.getBoundingClientRect();
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    })()"""
    )
    if close_btn:
        rec.move_mouse(close_btn["cx"], close_btn["cy"], 0.4)
        rec.click(close_btn["cx"], close_btn["cy"])

    rec.wait_until(21.6)
    rec.move_mouse(1180, 620, 0.7)

    rec.finish(TMP_DIR / "camera-part-b.json")
    video_path = page.video.path()
    context.close()
    browser.close()

    raw_b_dest = TMP_DIR / "raw-part-b.webm"
    if raw_b_dest.exists():
        raw_b_dest.unlink()
    Path(video_path).rename(raw_b_dest)
    print(f"Part B recorded: {raw_b_dest}")


def main():
    with sync_playwright() as p:
        record_part_a(p)
        record_part_b(p)
    print("\nAll browser recordings done successfully!")


if __name__ == "__main__":
    main()

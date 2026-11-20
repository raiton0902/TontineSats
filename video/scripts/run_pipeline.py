import os
import signal
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LOG_DIR = ROOT / "video" / "tmp"
LOG_DIR.mkdir(parents=True, exist_ok=True)

FRONTEND_ORIGIN = "http://127.0.0.1:5175/"

REQUIRED_FILES = [
    ROOT / "index.html",
    ROOT / "vite.config.ts",
    ROOT / "package.json",
    ROOT / "video" / "scene1-tontine-intro.mp4",
    ROOT / "tontinesats_demo_vo.mp3",
]


def preflight() -> None:
    missing = [str(path) for path in REQUIRED_FILES if not path.exists()]
    if missing:
        raise SystemExit(
            "Incomplete project package. Missing:\n  - "
            + "\n  - ".join(missing)
            + "\nUse the complete tontinesats_colab_package.zip "
            "(it must include index.html, vite.config.ts, the intro MP4 and the voiceover MP3)."
        )


def assert_frontend_html() -> None:
    with urllib.request.urlopen(FRONTEND_ORIGIN, timeout=5) as resp:
        html = resp.read().decode("utf-8", errors="replace")
    if 'id="root"' not in html:
        raise RuntimeError(
            "Vite is responding, but it is not serving the app: index.html is missing or unreadable. "
            "The browser recording would have captured a blank page."
        )


def wait_service(name, proc, log_file, urls, timeout=30):
    start = time.time()
    while time.time() - start < timeout:
        # Check if process crashed
        exit_code = proc.poll()
        if exit_code is not None:
            err_log = log_file.read_text(encoding="utf-8", errors="replace") if log_file.exists() else "No logs"
            raise RuntimeError(f"{name} exited prematurely with code {exit_code}.\n--- LOGS ---\n{err_log[-1200:]}")

        for u in urls:
            try:
                with urllib.request.urlopen(u, timeout=1.5) as resp:
                    if resp.status in (200, 204, 301, 302, 304):
                        return True
            except urllib.error.HTTPError:
                # An HTTP response (even 404/401) proves the server is online and listening!
                return True
            except Exception:
                pass
        time.sleep(0.4)

    err_log = log_file.read_text(encoding="utf-8", errors="replace") if log_file.exists() else "No logs"
    raise RuntimeError(f"{name} failed to respond within {timeout}s.\n--- LOGS ---\n{err_log[-1200:]}")


def main():
    print("=" * 60)
    print("  TontineSats Demo Video Automated Pipeline")
    print("=" * 60)

    preflight()

    server_log = LOG_DIR / "server.log"
    client_log = LOG_DIR / "client.log"

    # 1. Start backend server
    print("\n[1/4] Starting Hono + LibSQL backend (port 3001)...")
    server_f = open(server_log, "w", encoding="utf-8")
    server_proc = subprocess.Popen(
        "npm run start",
        shell=True,
        cwd=str(ROOT),
        stdout=server_f,
        stderr=subprocess.STDOUT,
    )

    # 2. Start Vite frontend
    print("[2/4] Starting Vite frontend (port 5175)...")
    client_f = open(client_log, "w", encoding="utf-8")
    client_proc = subprocess.Popen(
        "npx vite --port 5175 --strictPort --host 0.0.0.0",
        shell=True,
        cwd=str(ROOT),
        stdout=client_f,
        stderr=subprocess.STDOUT,
    )

    try:
        print("Waiting for servers to become ready...")
        wait_service(
            "Backend server",
            server_proc,
            server_log,
            ["http://127.0.0.1:3001/api/v1/health", "http://localhost:3001/api/v1/health"],
            timeout=35,
        )
        print("Backend server is ONLINE on port 3001!")

        wait_service(
            "Vite frontend",
            client_proc,
            client_log,
            ["http://127.0.0.1:5175/", "http://localhost:5175/"],
            timeout=35,
        )
        print("Vite frontend is ONLINE on port 5175!")
        assert_frontend_html()
        print("Vite is serving the app (index.html OK).")

        # 3. Run browser recording
        print("\n[3/4] Running Playwright browser recording...")
        subprocess.run([sys.executable, str(ROOT / "video" / "scripts" / "record_playwright.py")], check=True)

        # 4. Run compositor
        print("\n[4/4] Compositing zoom transitions and assembling video...")
        subprocess.run([sys.executable, str(ROOT / "video" / "scripts" / "compose_final.py")], check=True)

        print("\n" + "=" * 60)
        print("  DEMO VIDEO RENDERED SUCCESSFULLY!")
        print("=" * 60)
    finally:
        print("\nShutting down dev servers...")
        server_f.close()
        client_f.close()
        for proc in [server_proc, client_proc]:
            try:
                proc.terminate()
                proc.wait(timeout=3)
            except Exception:
                try:
                    proc.kill()
                except Exception:
                    pass
        print("Done.")


if __name__ == "__main__":
    main()

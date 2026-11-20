import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

OUT_W = 1920
OUT_H = 1080


def ease_in_out_cubic(u: float) -> float:
    u = max(0.0, min(1.0, u))
    if u < 0.5:
        return 4.0 * u * u * u
    return 1.0 - ((-2.0 * u + 2.0) ** 3) / 2.0


def eval_camera(t: float, events: list[dict], base_w: float, base_h: float) -> tuple[float, float, float]:
    if not events:
        return 1.0, base_w / 2.0, base_h / 2.0
    if t <= events[0]["t"]:
        e = events[0]
        return float(e["zoom"]), float(e["x"]), float(e["y"])
    if t >= events[-1]["t"]:
        e = events[-1]
        return float(e["zoom"]), float(e["x"]), float(e["y"])

    for i in range(len(events) - 1):
        a = events[i]
        b = events[i + 1]
        if a["t"] <= t <= b["t"]:
            dt = b["t"] - a["t"]
            if dt <= 1e-6:
                return float(b["zoom"]), float(b["x"]), float(b["y"])
            u = ease_in_out_cubic((t - a["t"]) / dt)
            z = a["zoom"] + (b["zoom"] - a["zoom"]) * u
            fx = a["x"] + (b["x"] - a["x"]) * u
            fy = a["y"] + (b["y"] - a["y"]) * u
            return float(z), float(fx), float(fy)
    return 1.0, base_w / 2.0, base_h / 2.0


def process_part(raw_mp4: Path, cam_json: Path, out_mp4: Path) -> None:
    cam = json.loads(cam_json.read_text(encoding="utf-8"))
    base_w = float(cam["width"])
    base_h = float(cam["height"])
    fps = float(cam["fps"])
    events = cam["events"]

    cap = cv2.VideoCapture(str(raw_mp4))
    if not cap.isOpened():
        raise RuntimeError(f"Could not open {raw_mp4}")

    cap_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    cap_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    scale_x = cap_w / base_w
    scale_y = cap_h / base_h

    ff = subprocess.Popen(
        [
            "ffmpeg",
            "-y",
            "-f", "rawvideo",
            "-vcodec", "rawvideo",
            "-pix_fmt", "bgr24",
            "-s", f"{OUT_W}x{OUT_H}",
            "-r", str(int(fps)),
            "-i", "-",
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "17",
            "-pix_fmt", "yuv420p",
            str(out_mp4),
        ],
        stdin=subprocess.PIPE,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
    )

    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        t = frame_idx / fps
        zoom, fx_css, fy_css = eval_camera(t, events, base_w, base_h)
        zoom = max(1.0, zoom)

        fx = fx_css * scale_x
        fy = fy_css * scale_y

        crop_w = cap_w / zoom
        crop_h = cap_h / zoom

        x0 = fx - crop_w / 2.0
        y0 = fy - crop_h / 2.0

        # Clamp strictly inside native frame bounds so no black border ever appears
        x0 = max(0.0, min(cap_w - crop_w, x0))
        y0 = max(0.0, min(cap_h - crop_h, y0))

        ix0 = int(round(x0))
        iy0 = int(round(y0))
        ix1 = min(cap_w, max(ix0 + 2, int(round(x0 + crop_w))))
        iy1 = min(cap_h, max(iy0 + 2, int(round(y0 + crop_h))))

        cropped = frame[iy0:iy1, ix0:ix1]
        resized = cv2.resize(cropped, (OUT_W, OUT_H), interpolation=cv2.INTER_LANCZOS4)
        ff.stdin.write(resized.tobytes())
        frame_idx += 1

    cap.release()
    ff.stdin.close()
    stderr = ff.stderr.read().decode("utf-8", errors="replace")
    rc = ff.wait()
    if rc != 0:
        raise RuntimeError(f"ffmpeg failed ({rc}): {stderr[-600:]}")
    print(f"Composed {out_mp4.name}: {frame_idx} frames ({frame_idx / fps:.2f}s)")


def main() -> None:
    tmp = Path(r"d:\aku ngoding\dakarbitcoin\video\tmp")
    process_part(tmp / "raw-part-a.mp4", tmp / "camera-part-a.json", tmp / "zoomed-part-a.mp4")
    process_part(tmp / "raw-part-b.mp4", tmp / "camera-part-b.json", tmp / "zoomed-part-b.mp4")


if __name__ == "__main__":
    main()

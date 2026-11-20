import json
import subprocess
import sys
from pathlib import Path
import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
VIDEO_DIR = ROOT / "video"
TMP_DIR = VIDEO_DIR / "tmp"

OUT_W = 1920
OUT_H = 1080
FPS = 30.0


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


def apply_zoom_to_video(raw_video_path: Path, camera_json_path: Path, out_mp4_path: Path, target_duration_sec: float) -> None:
    print(f"\n--- Processing camera zooms for {raw_video_path.name} -> {out_mp4_path.name} ---")
    cam = json.loads(camera_json_path.read_text(encoding="utf-8"))
    base_w = float(cam["width"])
    base_h = float(cam["height"])
    events = cam["events"]

    cap = cv2.VideoCapture(str(raw_video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {raw_video_path}")

    cap_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    cap_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    scale_x = cap_w / base_w
    scale_y = cap_h / base_h

    total_frames = int(round(target_duration_sec * FPS))

    ff = subprocess.Popen(
        [
            "ffmpeg",
            "-y",
            "-f", "rawvideo",
            "-vcodec", "rawvideo",
            "-pix_fmt", "bgr24",
            "-s", f"{OUT_W}x{OUT_H}",
            "-r", str(int(FPS)),
            "-i", "-",
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "17",
            "-pix_fmt", "yuv420p",
            str(out_mp4_path),
        ],
        stdin=subprocess.PIPE,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    frame_idx = 0
    last_frame = None

    while frame_idx < total_frames:
        ret, frame = cap.read()
        if ret:
            last_frame = frame
        elif last_frame is not None:
            frame = last_frame
        else:
            frame = np.zeros((cap_h, cap_w, 3), dtype=np.uint8)

        t = frame_idx / FPS
        zoom, fx_css, fy_css = eval_camera(t, events, base_w, base_h)
        zoom = max(1.0, zoom)

        fx = fx_css * scale_x
        fy = fy_css * scale_y

        crop_w = cap_w / zoom
        crop_h = cap_h / zoom

        x0 = fx - crop_w / 2.0
        y0 = fy - crop_h / 2.0

        # Boundary clamping to prevent black edges
        x0 = max(0.0, min(cap_w - crop_w, x0))
        y0 = max(0.0, min(cap_h - crop_h, y0))

        ix0 = int(round(x0))
        iy0 = int(round(y0))
        ix1 = min(cap_w, max(ix0 + 2, int(round(x0 + crop_w))))
        iy1 = min(cap_h, max(iy0 + 2, int(round(y0 + crop_h))))

        cropped = frame[iy0:iy1, ix0:ix1]
        resized = cv2.resize(cropped, (OUT_W, OUT_H), interpolation=cv2.INTER_LINEAR)
        ff.stdin.write(resized.tobytes())
        if frame_idx % 300 == 0:
            print(f"  -> {frame_idx}/{total_frames} frames ({frame_idx/FPS:.1f}s)...")
        frame_idx += 1

    cap.release()
    ff.stdin.close()
    ff.wait()
    print(f"Rendered {out_mp4_path.name} ({frame_idx} frames, {frame_idx / FPS:.2f}s)")


def assemble_final_demo() -> None:
    intro_mp4 = VIDEO_DIR / "scene1-tontine-intro.mp4"
    part_a_mp4 = TMP_DIR / "zoomed-part-a.mp4"
    part_b_mp4 = TMP_DIR / "zoomed-part-b.mp4"
    audio_path = ROOT / "tontinesats_demo_vo.mp3"
    final_output = ROOT / "tontinesats-demo.mp4"

    concat_list = TMP_DIR / "concat.txt"
    concat_list.write_text(
        f"file '{intro_mp4.as_posix()}'\n"
        f"file '{part_a_mp4.as_posix()}'\n"
        f"file '{part_b_mp4.as_posix()}'\n",
        encoding="utf-8",
    )

    merged_no_audio = TMP_DIR / "video_merged.mp4"
    print("\n--- Merging video segments ---")
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(concat_list),
            "-c", "copy",
            str(merged_no_audio),
        ],
        check=True,
    )

    print(f"\n--- Muxing audio ({audio_path.name}) into final video ---")
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i", str(merged_no_audio),
            "-i", str(audio_path),
            "-c:v", "copy",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            "-movflags", "+faststart",
            str(final_output),
        ],
        check=True,
    )

    # Also copy to video/ folder
    video_folder_output = VIDEO_DIR / "tontinesats-demo.mp4"
    if final_output != video_folder_output:
        import shutil
        shutil.copy2(final_output, video_folder_output)

    print(f"\n SUCCESS! Final demo video created at:\n  -> {final_output}\n")


def main() -> None:
    part_a_webm = TMP_DIR / "raw-part-a.webm"
    part_b_webm = TMP_DIR / "raw-part-b.webm"

    apply_zoom_to_video(part_a_webm, TMP_DIR / "camera-part-a.json", TMP_DIR / "zoomed-part-a.mp4", 93.75)
    apply_zoom_to_video(part_b_webm, TMP_DIR / "camera-part-b.json", TMP_DIR / "zoomed-part-b.mp4", 27.10)
    assemble_final_demo()


if __name__ == "__main__":
    main()

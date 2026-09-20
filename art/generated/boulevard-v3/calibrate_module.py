"""Calibrate a Boulevard v3 building module master into its runtime PNG.

Rebuilt 2026-09-19 (the original script was not committed, only its numbers in
runtime/calibration.json). Validated by reproducing the existing
runtime/monarch-gate.png from modules/monarch-gate-master.png with a door
height of 284 master px.

Steps, per art/prompts/boulevard-entrances-v3.md section 8:
  1. Trim the master to its content (alpha >= ALPHA_TRIM).
  2. Extrude each column's last fully opaque pixel down to the ground row, so
     every column stands on the same line and no ragged, semi-transparent
     master edge is left above it. To drop a ragged edge, pass a trim box that
     ends above it (its last row becomes the ground row).
  3. Scale so the reference door leaf is exactly DOOR_DISPLAY_PX display px,
     resampled premultiplied (no edge bleed) at RUNTIME_PER_DISPLAY (1.5x).
  4. Add a hidden overlap strip of OVERLAP_DISPLAY_PX display px below the
     ground row by repeating the ground row's pixels.
  5. Alpha-normalize: >= 250 -> 255, <= 3 -> 0.

Usage:
  python calibrate_module.py <master.png> <door_master_px> <out.png> [x0 y0 x1 y1]
Pass the base module's trim_box_master_px as the last four arguments when
calibrating its active-state variant, so both get the identical transform.
Prints a JSON record for runtime/calibration.json.
"""
import json
import sys

from PIL import Image

DOOR_DISPLAY_PX = 190
RUNTIME_PER_DISPLAY = 1.5
OVERLAP_DISPLAY_PX = 40
ALPHA_TRIM = 8
GAP_LIMIT_MASTER_PX = 60
SOLID_ALPHA = 250


def calibrate(master_path, door_master_px, out_path, box=None):
    im = Image.open(master_path).convert("RGBA")
    if box is None:
        alpha = im.split()[3].point(lambda v: 255 if v >= ALPHA_TRIM else 0)
        box = alpha.getbbox()
    im = im.crop(box)
    w, h = im.size
    px = im.load()

    # Bottom edge of the content in every column: the last *fully opaque*
    # pixel, not the last visible one. A generated master's bottom edge is
    # often a ragged, semi-transparent fade several px tall; extruding from a
    # semi-transparent pixel would copy that transparency downward and leave a
    # see-through band above the ground line (seen on the Monarch gate).
    bottoms = []
    for x in range(w):
        last = -1
        for y in range(h - 1, -1, -1):
            if px[x, y][3] >= SOLID_ALPHA:
                last = y
                break
        bottoms.append(last)
    ground_row = h - 1

    extruded = 0
    for x in range(w):
        b = bottoms[x]
        if b < 0 or ground_row - b > GAP_LIMIT_MASTER_PX:
            continue
        r, g, bl, _ = px[x, b]
        for y in range(b + 1, h):
            px[x, y] = (r, g, bl, 255)
        if b < ground_row:
            extruded += 1

    scale = DOOR_DISPLAY_PX / door_master_px
    overlap_master = OVERLAP_DISPLAY_PX / scale
    overlap_rows = int(round(overlap_master))
    tall = Image.new("RGBA", (w, h + overlap_rows), (0, 0, 0, 0))
    tall.paste(im, (0, 0))
    tp = tall.load()
    for x in range(w):
        src = px[x, ground_row]
        if src[3] == 0:
            continue
        for y in range(h, h + overlap_rows):
            tp[x, y] = src

    run_scale = scale * RUNTIME_PER_DISPLAY
    out_w = int(round(w * run_scale))
    ground_row_runtime = int(round((ground_row + 1) * run_scale))
    overlap_runtime = int(round(OVERLAP_DISPLAY_PX * RUNTIME_PER_DISPLAY))
    out_h = ground_row_runtime + overlap_runtime
    premult = tall.convert("RGBa").resize((out_w, out_h), Image.LANCZOS)
    out = premult.convert("RGBA")
    out.putalpha(out.split()[3].point(lambda v: 255 if v >= 250 else (0 if v <= 3 else v)))
    out.save(out_path)

    return {
        "master_content_px": [w, h],
        "display_scale_per_master_px": round(scale, 4),
        "runtime_size_px": [out_w, out_h],
        "display_size_px": [round(out_w / RUNTIME_PER_DISPLAY), round(out_h / RUNTIME_PER_DISPLAY)],
        "ground_row_runtime_px": ground_row_runtime,
        "overlap_runtime_px": overlap_runtime,
        "columns_extruded": extruded,
        "trim_box_master_px": list(box),
    }


if __name__ == "__main__":
    trim = tuple(int(v) for v in sys.argv[4:8]) if len(sys.argv) >= 8 else None
    record = calibrate(sys.argv[1], float(sys.argv[2]), sys.argv[3], trim)
    print(json.dumps(record))

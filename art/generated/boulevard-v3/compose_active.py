"""Composite a module's active-state edit over its base master.

Keeps only the pixels the edit actually changed (the gate leaves, the barrier
arm and the opening behind them, for the Monarch gate) and leaves every other
pixel identical to the base, so registration is exact and nothing else is
re-painted (art/prompts/boulevard-entrances-v3.md sections 10 and 17).

The first version of this script kept a feathered rectangle around the
entrance instead. That fades out anything the edit draws across the
rectangle's edge (the raised barrier arm rose through its top and right edge
and dissolved into the wall) and swaps in re-rendered texture across the whole
arch. A mask built from the per-pixel difference does neither.

Usage:
  python compose_active.py <base.png> <edit.png> <out.png> x0 y0 x1 y1 [threshold] [grow] [feather] [mask_out.png]

  x0 y0 x1 y1  search region (master px): changes outside it are ignored
  threshold    minimum premultiplied per-channel difference to count as changed (default 48)
  grow         px the changed area is grown by, after closing small holes (default 8)
  feather      px of blur on the mask edge (default 3)
"""
import sys

from PIL import Image, ImageChops, ImageFilter


def build_mask(base, edit, region, threshold=48, grow=8, feather=3):
    x0, y0, x1, y1 = region
    diff = ImageChops.difference(base.convert("RGBa"), edit.convert("RGBa"))
    r, g, b, a = diff.split()
    mx = ImageChops.lighter(ImageChops.lighter(r, g), ImageChops.lighter(b, a))
    changed = mx.point(lambda v: 255 if v >= threshold else 0)
    # Limit to the search region.
    window = Image.new("L", base.size, 0)
    window.paste(255, (x0, y0, x1, y1))
    changed = ImageChops.multiply(changed, window)
    # Close small holes (places where the edit happens to match the base),
    # then grow, then feather.
    size = 2 * grow + 1
    closed = changed.filter(ImageFilter.MaxFilter(size)).filter(ImageFilter.MinFilter(size))
    grown = closed.filter(ImageFilter.MaxFilter(size))
    grown = ImageChops.multiply(grown, window)
    return grown.filter(ImageFilter.GaussianBlur(feather)) if feather > 0 else grown


def compose(base_path, edit_path, out_path, region, threshold=48, grow=8, feather=3, mask_path=None):
    base = Image.open(base_path).convert("RGBA")
    edit = Image.open(edit_path).convert("RGBA")
    if edit.size != base.size:
        raise SystemExit(f"size mismatch: base {base.size} vs edit {edit.size}")
    mask = build_mask(base, edit, region, threshold, grow, feather)
    if mask_path:
        mask.save(mask_path)
    # Premultiplied blend so transparent pixels carry no stray color.
    out = Image.composite(edit.convert("RGBa"), base.convert("RGBa"), mask).convert("RGBA")
    out.save(out_path)
    outside = ImageChops.difference(base, out).point(lambda v: 255 if v else 0).getbbox()
    print("mask bounding box:", mask.point(lambda v: 255 if v > 8 else 0).getbbox(), "| changed-pixel bbox:", outside)


if __name__ == "__main__":
    a = sys.argv
    compose(
        a[1], a[2], a[3], tuple(int(v) for v in a[4:8]),
        int(a[8]) if len(a) > 8 else 48,
        int(a[9]) if len(a) > 9 else 8,
        int(a[10]) if len(a) > 10 else 3,
        a[11] if len(a) > 11 else None,
    )

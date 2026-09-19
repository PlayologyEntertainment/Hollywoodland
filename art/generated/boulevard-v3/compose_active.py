"""Composite a module's active-state edit over its base master.

Keeps only a feathered rectangle around the entrance from the edited image and
leaves every pixel outside it identical to the base, so registration is exact
(art/prompts/boulevard-entrances-v3.md section 10).

Usage:
  python compose_active.py <base_master.png> <edit_master.png> <out.png> x0 y0 x1 y1 [feather_px]
"""
import sys

from PIL import Image, ImageChops, ImageFilter


def compose(base_path, edit_path, out_path, box, feather=24):
    base = Image.open(base_path).convert("RGBA")
    edit = Image.open(edit_path).convert("RGBA")
    if edit.size != base.size:
        raise SystemExit(f"size mismatch: base {base.size} vs edit {edit.size}")
    x0, y0, x1, y1 = box
    mask = Image.new("L", base.size, 0)
    mask.paste(255, (x0 + feather, y0 + feather, x1 - feather, y1 - feather))
    mask = mask.filter(ImageFilter.GaussianBlur(feather / 2.0))
    # Premultiplied blend so transparent pixels carry no stray color.
    b = base.convert("RGBa")
    e = edit.convert("RGBa")
    out = Image.composite(e, b, mask).convert("RGBA")
    out.save(out_path)
    outside = ImageChops.difference(base, out).point(lambda v: 255 if v else 0)
    px = outside.crop((0, 0, base.width, y0 - feather)).getbbox()
    print("changed pixels above the mask:", px)


if __name__ == "__main__":
    a = sys.argv
    compose(a[1], a[2], a[3], tuple(int(v) for v in a[4:8]), int(a[8]) if len(a) > 8 else 24)

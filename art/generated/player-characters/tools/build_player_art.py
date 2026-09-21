"""Build the runtime headshots and portraits for the six ready-made player characters from the chosen generated takes.

  python build_player_art.py white-male=1 asian-male=2 ...     (id=take; a character left out defaults to take 1)

Reads  art/generated/player-characters/<id>-take<N>.png   (1024 x 1536 RGBA, transparent background)
Writes public/assets/characters/player/<id>-portrait.webp (the full-size, head-to-toe portrait, aligned as described below)
       public/assets/characters/player/<id>-reflection.webp (the floor reflection of the feet, 1024 x 520; see 3 below)
       public/assets/characters/player/<id>-headshot.webp (a square head-and-shoulders crop of the same drawing, 384 x 384)

Each figure is aligned on the canvas in two ways, moving only transparent margins (the drawing itself is not touched):

1. Sideways: the middle of its silhouette (halfway between its leftmost and rightmost opaque pixels) sits on the canvas centre.
   The model draws every figure a little off-centre (silhouette centres range from 480 to 577 of 1024), and the Character
   Creator centres the image between its two side panes, so without this the six characters would each sit a different distance
   from the panes. Centring on the silhouette gives equal space to the left and right pane for every character (measured within
   1 px at 1920 x 1080). Centring on the centre of mass instead was tried and left up to 38 px more space on one side for the
   wide-stance figures, whose feet are not under their torso.
2. Vertically: the lowest opaque pixel (the sole of the lowest shoe) sits exactly FEET_MARGIN pixels above the canvas bottom. The
   model leaves 9 to 15 px under the feet, and the Character Creator draws a reflection on the floor by mirroring the portrait
   about the feet, so every figure needs its feet at the same known height for the mirror line to land on the sole. Figures
   only move down, so the head room gets a little larger and nothing is cut off.

3. Reflection: <id>-reflection.webp is the floor reflection of the feet, which the Character Creator lays under the figure. Each
   foot is mirrored about ITS OWN sole, not about one common line: the model draws the figure with one foot further back (its sole
   is up to 58 px higher on the canvas), and a single mirror line would leave that foot's reflection floating below it. Each foot
   (found as a connected shape in the bottom REACH rows) is flipped about the bottom edge of its lowest pixel, so the reflection
   touches the real sole (tucked OVERLAP px behind it, so the softening blur applied by the page cannot open a gap), and it fades out linearly with distance from the sole. The file is a strip of the canvas's width, from
   STRIP_TOP_ABOVE px above the canvas bottom to STRIP_BELOW px below it (styles.css .creator-reflection uses the same numbers).

The headshot is cropped from the aligned portrait, so it is always the same face and clothes. Alpha is cleaned like the other
promoted art (>= 250 becomes 255, <= 3 becomes 0).
Needs numpy and pillow.
"""
import os
import sys

import numpy as np
from PIL import Image

ROOT = 'C:/Hollywoodland/'
SRC = ROOT + 'art/generated/player-characters/'
OUT = ROOT + 'public/assets/characters/player/'
IDS = ['white-male', 'asian-male', 'black-male', 'white-female', 'asian-female', 'black-female']
HEAD_BAND = 260        # rows from the top of the figure used to find the head's centre
SIDE = 440             # headshot crop side in source pixels: head, neck and shoulders
TOP_MARGIN = 28        # source pixels of space above the hair (may reach past the canvas; the crop pads with transparency)
SIZE = 384             # headshot output size
REACH = 230            # rows above the lowest sole searched for the feet and hems that get reflected
OVERLAP = 5            # source px the reflection tucks up behind the shoe, so the blur CSS adds still leaves the two touching
FADE = 200             # reflection distance (source px below the sole) at which it has faded to nothing
STRIP_TOP_ABOVE = 300  # the reflection strip starts this many rows above the canvas bottom ...
STRIP_BELOW = 220      # ... and ends this many rows below it (300 + 220 = 520 rows in all)
FEET_MARGIN = 3        # pixels between the soles and the canvas bottom; the reflection in styles.css (.creator-reflection) assumes this


def clean(arr):
    alpha = arr[..., 3]
    alpha[alpha >= 250] = 255
    alpha[alpha <= 3] = 0
    return arr


def align(image):
    """Shifts the figure so the middle of its silhouette is on the canvas centre and its soles are FEET_MARGIN px above the
    bottom. Returns the new image and the (sideways, downward) shift in pixels."""
    arr = np.array(image)
    ys, xs = np.where(arr[..., 3] > 24)
    dx = int(round(image.width / 2 - (xs.min() + xs.max()) / 2))
    dy = int(image.height - FEET_MARGIN - 1 - ys.max())
    assert xs.min() + dx > 8 and xs.max() + dx < image.width - 8, 'the figure would touch a side edge'
    assert dy >= 0 and ys.min() + dy > 8 and ys.max() + dy < image.height, 'the figure would touch the top or bottom edge'
    out = Image.new('RGBA', image.size, (0, 0, 0, 0))
    out.paste(image, (dx, dy))
    return out, dx, dy


def reflection(image):
    """The strip of floor reflection for an aligned portrait: each foot mirrored about the bottom edge of its own lowest pixel."""
    from scipy import ndimage
    arr = np.array(image)
    strip_top = image.height - STRIP_TOP_ABOVE
    strip = Image.new('RGBA', (image.width, STRIP_TOP_ABOVE + STRIP_BELOW), (0, 0, 0, 0))
    opaque = arr[..., 3] > 24
    lowest = int(np.where(opaque)[0].max())
    top = lowest - REACH
    labels, count = ndimage.label(opaque[top:lowest + 1], structure=np.ones((3, 3)))
    feet = 0
    for label in range(1, count + 1):
        rows, cols = np.where(labels == label)
        rows = rows + top
        if rows.size < 300:
            continue
        feet += 1
        sole = int(rows.max())                             # the foot's lowest opaque row
        assert sole >= strip_top, 'a sole above the reflection strip'
        for row in range(sole, top - 1, -1):
            distance = sole - row                          # 0 for the sole row, which lands on the row just below it
            target = sole + 1 + distance - OVERLAP
            if distance >= FADE or target - strip_top >= strip.height:
                break
            here = cols[rows == row]
            if here.size == 0:
                continue
            line = np.zeros((1, image.width, 4), dtype=np.uint8)
            line[0, here] = arr[row, here]
            line[0, here, 3] = (line[0, here, 3] * (1 - distance / FADE)).astype(np.uint8)
            strip.alpha_composite(Image.fromarray(line, 'RGBA'), (0, target - strip_top))
    assert feet == 2, f'expected two feet, found {feet}'
    return strip


def main():
    picks = {i: 1 for i in IDS}
    for arg in sys.argv[1:]:
        key, _, take = arg.partition('=')
        assert key in IDS, key
        picks[key] = int(take)
    os.makedirs(OUT, exist_ok=True)
    for cid in IDS:
        image = Image.open(f'{SRC}{cid}-take{picks[cid]}.png').convert('RGBA')
        image = Image.fromarray(clean(np.array(image)), 'RGBA')
        image, dx, dy = align(image)
        arr = np.array(image)
        image.save(f'{OUT}{cid}-portrait.webp', quality=90, alpha_quality=100, method=6)

        reflection(image).save(f'{OUT}{cid}-reflection.webp', quality=85, alpha_quality=100, method=6)

        ys, xs = np.where(arr[..., 3] > 24)
        top = int(ys.min())
        band = arr[top:top + HEAD_BAND, :, 3] > 24
        head_x = int(np.where(band)[1].mean())
        left = min(max(head_x - SIDE // 2, 0), image.width - SIDE)
        upper = top - TOP_MARGIN
        crop = image.crop((left, upper, left + SIDE, upper + SIDE)).resize((SIZE, SIZE), Image.LANCZOS)
        crop_arr = clean(np.array(crop))
        Image.fromarray(crop_arr, 'RGBA').save(f'{OUT}{cid}-headshot.webp', quality=90, alpha_quality=100, method=6)
        print(f'{cid}: take {picks[cid]}, shifted {dx:+d} px sideways and {dy} px down, silhouette centre x={(xs.min() + xs.max()) / 2:.0f}, '
              f'soles {image.height - 1 - ys.max()} px above the bottom, head centre x={head_x}, portrait '
              f'{os.path.getsize(OUT + cid + "-portrait.webp") // 1024} KB, headshot {os.path.getsize(OUT + cid + "-headshot.webp") // 1024} KB')


if __name__ == '__main__':
    main()

"""Smooth the upper body's path through the walk cycle.

Reads  aspiring-actor-walk-v2-master-unsmoothed.png  (output of build_sheet.py)
Writes aspiring-actor-walk-v2-master.png

Every loop frame is warped so the shoulder line follows a gentle two-bobs-per-loop curve (highest at the
passing frames, lowest at heel contact) and the torso sits at the cell's horizontal centre, instead of
jumping with however tall or far forward the generator drew that frame. The head and shoulders move
rigidly; the shift fades out (smoothstep) down the torso and into the thighs, so the shins and planted
feet, and therefore the foot-planting and the footprint data, are untouched. The idle frame is unchanged.

Needs numpy, pillow, scipy.  Run:  python smooth_upper_body.py
"""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

D = 'C:/Hollywoodland/art/generated/walk-cycle-v2/'
CW, CH = 448, 480
BASE_Y, BODY_X = 464, 224
LOOP = 16
BOB_HALF_SHEET_PX = 4.3     # half of the bob's peak-to-peak: 4.3 sheet px = about 2 display px each way (4 px peak to peak)
HEAD_RIGID = 15             # rows below the shirt line that still move rigidly (collar, neck)
BLEND = 220                 # rows over which the shift fades to zero (torso, then upper thigh)


def cell(sheet, n):
    return sheet[(n // 4) * CH:(n // 4 + 1) * CH, (n % 4) * CW:(n % 4 + 1) * CW]


def measure(c):
    """Shirt line y, and the torso's median x just below it."""
    c = c.astype(int)
    al = c[..., 3] > 24
    rows = np.where(al.any(axis=1))[0]
    h = rows.max() - rows.min() + 1
    cream = (c[..., 3] > 200) & (c[..., 0] > 205) & (c[..., 1] > 180) & (c[..., 2] > 140) & (c[..., 0] - c[..., 2] < 90)
    ys = int(np.where(cream.sum(axis=1) > 0.057 * h)[0].min())
    xs = np.where(cream[ys:ys + 80])[1]
    return ys, float(np.median(xs))


def weight(ys):
    """Per-row weight: 1 down to the collar, smoothstep to 0 over BLEND rows, 0 below."""
    y = np.arange(CH, dtype=float)
    t = np.clip((y - (ys + HEAD_RIGID)) / BLEND, 0, 1)
    return 1 - t * t * (3 - 2 * t)


def warp(c, dy_up, dx_right, ys):
    """Move the upper body up by dy_up rows and right by dx_right columns, fading to zero down the legs."""
    w = weight(ys)
    yy, xx = np.mgrid[0:CH, 0:CW].astype(float)
    src_y = yy + dy_up * w[:, None]
    src_x = xx - dx_right * w[:, None]
    a = c[..., 3:4].astype(float) / 255.0
    pre = np.concatenate([c[..., :3].astype(float) * a, a * 255.0], axis=2)      # premultiplied, so edges do not bleed
    out = np.empty_like(pre)
    for ch in range(4):
        out[..., ch] = ndi.map_coordinates(pre[..., ch], [src_y, src_x], order=3, mode='constant', cval=0.0)
    alpha = np.clip(out[..., 3], 0, 255)
    rgb = np.where(alpha[..., None] > 0.5, out[..., :3] / np.maximum(alpha[..., None] / 255.0, 1e-3), 0)
    res = np.concatenate([np.clip(rgb, 0, 255), alpha[..., None]], axis=2)
    return np.rint(res).astype(np.uint8)


def main():
    sheet = np.array(Image.open(D + 'aspiring-actor-walk-v2-master-unsmoothed.png').convert('RGBA'))
    meas = [measure(cell(sheet, n)) for n in range(LOOP)]
    height = np.array([BASE_Y - ys for ys, _ in meas], float)              # shoulder line above the ground
    k = np.arange(LOOP)
    target = height.mean() - BOB_HALF_SHEET_PX * np.cos(np.pi * k / 4)    # lowest at contact (k = 0, 8), highest at passing (k = 4, 12)
    dy = np.rint(target - height).astype(int)
    dx = np.rint(BODY_X - np.array([x for _, x in meas])).astype(int)
    print('vertical shifts (up +):', dy.tolist(), 'max', np.abs(dy).max())
    print('horizontal shifts     :', dx.tolist(), 'max', np.abs(dx).max())
    out = sheet.copy()
    for n in range(LOOP):
        cy, cx = (n // 4) * CH, (n % 4) * CW
        out[cy:cy + CH, cx:cx + CW] = warp(cell(sheet, n), int(dy[n]), int(dx[n]), meas[n][0])
    Image.fromarray(out, 'RGBA').save(D + 'aspiring-actor-walk-v2-master.png')
    after = [measure(cell(out, n)) for n in range(LOOP)]
    h2 = np.array([BASE_Y - ys for ys, _ in after], float)
    for name, a in (('before', height), ('after ', h2)):
        d = np.abs(np.diff(np.append(a, a[0])))
        print(f'shoulder height {name}: range {a.max() - a.min():.0f} px, frame-to-frame max {d.max():.0f} mean {d.mean():.1f} (x0.461 for display px)')
    print('torso x after:', [int(round(x)) for _, x in after])


if __name__ == '__main__':
    main()

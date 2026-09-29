"""Rebuild the walk cycle's upper body from ONE canonical torso, so the shirt, suspenders and belt cannot morph.

Reads  aspiring-actor-walk-v2-master-smoothed.png   (build_sheet.py -> smooth_upper_body.py)
Writes aspiring-actor-walk-v2-master.png            (replaces rig_arms.py's per-frame torso repaint)

Why: every loop frame is a separately AI-drawn pose, so the shirt hem, sleeve, tuck line and belt differ from frame to
frame (the belt line varied by ~20 px, and blousing hid it altogether in several frames). rig_arms.py repainted the belt
and shirt per frame from each drawn pose, which kept that inconsistency. Here instead:

  1. the canonical body (head, collar, shirt, suspenders, belt, top of the trousers) is cut ONCE from the idle pose, with
     its arms removed and the hidden shirt back/front repainted by rig_arms.rebuild_torso;
  2. each frame's legs are kept from the smoothed master (arms erased, everything above the seam removed);
  3. the same body is placed on the legs with a smooth two-bobs-per-loop rise and fall and a small sway, crossfaded over the
     seam;
  4. the standing-pose pendulum arms from rig_arms.py are drawn on top.

Needs numpy, pillow, scipy.  Run from tools/:  python rig_torso.py
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, '.')
import rig_arms as R  # noqa: E402
from arm_parts import CW, CH, split  # noqa: E402

D = R.D
LOOP = 16
BASE_Y, BODY_X = 464, 224
SEAM_BELOW_BELT = 34        # idle rows below the belt's top edge where the canonical body hands over to the drawn legs
FADE = 14                   # rows over which body and legs crossfade
BOB_HALF = 3.5              # half of the body's peak-to-peak vertical bob (sheet px): lowest at contact, highest at passing
SWAY_PX = 1.0               # half-amplitude of the once-per-loop horizontal sway
LEAN_DEG = 0.0              # constant forward lean of the body about the seam (0 = as standing)


def cell(sheet, n):
    return sheet[(n // 4) * CH:(n // 4 + 1) * CH, (n % 4) * CW:(n % 4 + 1) * CW]


def canonical_body(idle):
    """The idle pose with its arms removed and the hidden torso repainted, cut off at the seam. Returns (rgba, info)."""
    yy, xx = np.mgrid[0:CH, 0:CW]
    sprites = R.ArmSprites(idle)
    y_s = R.shirt_row(idle)
    y_w = R.waist_row(idle, y_s)
    tx = R.torso_x(idle, y_s)
    pivot = sprites.shoulder
    parts = split(idle, y_s)
    cap = parts['near'] & (np.hypot(xx - pivot[0], yy - pivot[1]) <= R.CAP_RADIUS)
    removed = (parts['near'] & ~cap) | parts['far']
    body = R.erase(idle, removed, grow=3)
    erased = ndi.binary_dilation(removed, iterations=3)
    body = R.rebuild_torso(body, idle, erased, removed, parts['far'], y_s, y_w, tx, pivot)
    seam = y_w + SEAM_BELOW_BELT
    return body, {'y_s': y_s, 'y_w': y_w, 'tx': tx, 'seam': seam, 'sprites': sprites}


def row_weight(seam):
    """Weight of the body layer per row: 1 above the seam-fade, 0 below."""
    y = np.arange(CH, dtype=float)
    t = np.clip((y - (seam - FADE / 2.0)) / FADE, 0, 1)
    return 1 - t * t * (3 - 2 * t)


def legs_layer(c, seam, y_s):
    """The frame with its drawn arms erased (leaving only trousers, shoes and whatever was under the hands)."""
    parts = split(c, y_s)
    removed = parts['near'] | parts['far']
    out = R.erase(c, removed, grow=3)
    # holes the hands left in the thighs: fill inside the closed trouser silhouette from the nearest drawn colour
    solid = out[..., 3] > 128
    yy = np.arange(CH)[:, None]
    zone = (yy >= seam - 4) & (yy <= seam + 70)
    closed = ndi.binary_closing(solid, structure=np.ones((13, 13), bool))
    hole = closed & ~solid & zone
    if hole.any():
        _, (iy, ix) = ndi.distance_transform_edt(~solid, return_indices=True)
        out[hole, :3] = out[iy[hole], ix[hole], :3]
        out[hole, 3] = 255
    return out


def trouser_centre(c, y0, y1):
    c = c.astype(int)
    m = (c[..., 3] > 200) & (c[..., 0] < 105) & (c[..., 1] < 95) & (c[..., 2] < 90) & (abs(c[..., 0] - c[..., 1]) < 14)
    ys, xs = np.where(m[y0:y1])
    return float(np.median(xs)) if len(xs) else float(BODY_X)


def extents(img, y0, y1):
    """Median left/right edge of the solid pixels over rows y0..y1 (the trousers at the seam)."""
    L, Rr = [], []
    for y in range(int(y0), int(y1) + 1):
        xs = np.where(img[y, :, 3] > 128)[0]
        if len(xs):
            L.append(xs.min())
            Rr.append(xs.max())
    return float(np.median(L)), float(np.median(Rr))


def match_legs(legs, seam, body_edges, reach=70):
    """Stretch the legs' top horizontally so their edges at the seam land exactly on the body's, fading to nothing by
    `reach` rows down, so the hips join without a step and the shins and feet are untouched."""
    ll, lr = extents(legs, seam + 1, seam + 6)
    bl, br = body_edges
    y = np.arange(CH, dtype=float)
    t = np.clip((y - seam) / reach, 0, 1)
    w = np.where(y < seam, 1.0, 1 - t * t * (3 - 2 * t))[:, None]
    yy, xx = np.mgrid[0:CH, 0:CW].astype(float)
    full = ll + (xx - bl) * (lr - ll) / max(br - bl, 1.0)
    src_x = xx + w * (full - xx)
    a = legs[..., 3:4].astype(float) / 255.0
    pre = np.concatenate([legs[..., :3].astype(float) * a, a * 255.0], axis=2)
    out = np.stack([ndi.map_coordinates(pre[..., k], [yy, src_x], order=3, mode='constant') for k in range(4)], axis=2)
    alpha = np.clip(out[..., 3], 0, 255)
    rgb = np.where(alpha[..., None] > 0.5, out[..., :3] / np.maximum(alpha[..., None] / 255.0, 1e-3), 0)
    return np.rint(np.concatenate([np.clip(rgb, 0, 255), alpha[..., None]], axis=2)).astype(np.uint8)


def blend(body, legs, wb):
    """Premultiplied crossfade: body*wb + legs*(1-wb), so the union of the two silhouettes stays opaque."""
    def pre(a):
        al = a[..., 3:4].astype(float) / 255.0
        return np.concatenate([a[..., :3].astype(float) * al, al * 255.0], axis=2)
    w = wb[:, None, None]
    p = pre(body) * w + pre(legs) * (1 - w)
    alpha = np.clip(p[..., 3], 0, 255)
    rgb = np.where(alpha[..., None] > 0.5, p[..., :3] / np.maximum(alpha[..., None] / 255.0, 1e-3), 0)
    return np.rint(np.concatenate([np.clip(rgb, 0, 255), alpha[..., None]], axis=2)).astype(np.uint8)


def main(frames_only=None, arms=True):
    sheet = np.array(Image.open(D + 'aspiring-actor-walk-v2-master-smoothed.png').convert('RGBA'))
    idle = cell(sheet, 16)
    body0, info = canonical_body(idle)
    sprites, seam0 = info['sprites'], info['seam']
    wb0 = row_weight(seam0)
    # hip height of the frames is whatever the drawn legs give; the body rides a smooth curve about the mean of it
    legs = []
    for n in range(LOOP):
        c = cell(sheet, n)
        legs.append(legs_layer(c, seam0, R.shirt_row(c)))
    # reference vertical: keep the idle's own belt-to-ground height, and bob about it
    idle_hip_h = BASE_Y - seam0                      # idle sits on BASE_Y as well
    # horizontal: follow the drawn hips at the seam, smoothed cyclically so the body doesn't chase pose noise
    hips = np.array([trouser_centre(legs[n], seam0, seam0 + 12) for n in range(LOOP)])
    k = np.arange(LOOP)
    body_ref_x = trouser_centre(body0, seam0 - 12, seam0)
    print('hip centre x per frame:', np.round(hips, 1).tolist(), ' body trouser x', round(body_ref_x, 1))
    out = sheet.copy()
    for n in range(LOOP) if frames_only is None else frames_only:
        dy = -BOB_HALF * (-np.cos(np.pi * n / 4.0))          # up (negative y) at passing frames k=4,12, down at contact
        dy = BOB_HALF * np.cos(np.pi * n / 4.0)
        dx = (BODY_X - body_ref_x) + SWAY_PX * np.sin(2 * np.pi * n / LOOP)
        body = R.affine(body0, LEAN_DEG, (body_ref_x, seam0), (dx, dy))
        wb = row_weight(seam0 + dy)
        sm = int(round(seam0 + dy))
        lg = match_legs(legs[n], sm, extents(body, sm - 8, sm - 3))
        frame = blend(body, lg, wb)
        ref = (info['tx'] + dx, info['y_s'] + dy)
        th_n, th_f = R.swing(n)
        s = 1.0
        far = R.place_arm(sprites, th_f, ref, s, R.FAR_ARM_SHADE)
        near = R.place_arm(sprites, th_n, ref, s)
        if arms:
            frame = R.over(R.over(far, frame), near)
        out[(n // 4) * CH:(n // 4 + 1) * CH, (n % 4) * CW:(n % 4 + 1) * CW] = frame
    return out


if __name__ == '__main__':
    result = main()
    Image.fromarray(result, 'RGBA').save(D + 'aspiring-actor-walk-v2-master.png')
    print('written')

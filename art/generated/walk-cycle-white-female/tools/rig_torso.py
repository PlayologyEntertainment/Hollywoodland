"""Rebuild the walk cycle's upper body from ONE canonical torso, plus rigged pendulum arms (white-female).

Ported from art/generated/walk-cycle-v2/tools/rig_torso.py (the male fix; see art/prompts/character-white-male-walk-
cycle-fix.md, "Round 3"). Reads white-female-walk-master-smoothed.png, writes white-female-walk-master.png.

  1. the canonical body (head, blouse, belt, top of the trousers) is cut ONCE from the idle pose, its arm removed and
     the hidden blouse repainted by rig_arms.rebuild_torso;
  2. each frame's legs are kept from the smoothed master (arms erased, everything above the seam removed);
  3. the legs' top is stretched horizontally so its edges meet the body's at the seam, then the two are crossfaded;
  4. the same body rides a smooth two-bobs-per-loop curve (lowest at contact) with a tiny sway;
  5. the standing-pose pendulum arms from rig_arms.py are drawn on top, so her arms swing the same way every step
     instead of wandering with each drawn pose.

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
SEAM_BELOW_BELT = 30
FADE = 14
BOB_HALF = 3.5
SWAY_PX = 1.0
LEAN_DEG = 0.0


def cell(sheet, n):
    return sheet[(n // 4) * CH:(n // 4 + 1) * CH, (n % 4) * CW:(n % 4 + 1) * CW]


def is_trouser(c):
    """Her navy trousers: dark, blue-leaning (not the brown belt/shoes, not skin, not chestnut hair)."""
    c = c.astype(int)
    return (c[..., 3] > 200) & (c[..., 0] < 90) & (c[..., 1] < 100) & (c[..., 2] < 150) & (c[..., 2] > c[..., 0] + 8)


def belt_top(c, y_s):
    """First row of her brown belt. rig_arms.waist_row looks for the navy trousers instead, but in the idle pose her arm
    hides the top of them, so it lands ~23 px too low; the belt itself is never covered."""
    c = c.astype(int)
    belt = (c[..., 3] > 200) & (c[..., 0] > c[..., 1] + 15) & (c[..., 0] > 55) & (c[..., 0] < 150) & (c[..., 2] < 75) & (c[..., 1] < 95)
    rows = np.where(belt.sum(axis=1)[y_s + 40:] >= 12)[0]
    return int(y_s + 40 + rows.min())


# Her sleeve is a short rolled one entirely within ~30 px of the shoulder pivot, so the male rig's "fade the sleeve in
# from under a kept drawn cap" leaves it see-through. Instead the whole drawn sleeve is lifted out of the body and the
# rigged sleeve is fully opaque.
R.CAP_RADIUS = 6
R.FEATHER_INNER, R.FEATHER_OUTER = 0.0, 1.0
R.waist_row = belt_top      # ArmSprites and rebuild_torso call it through the module, so they now see the real belt


def canonical_body(idle):
    yy, xx = np.mgrid[0:CH, 0:CW]
    sprites = R.ArmSprites(idle)
    # the arm's outline colour is sampled from the skin edge (brown); on the blue sleeve it should be a dark slate
    up = sprites.upper
    brown = (np.abs(up[..., :3].astype(int) - np.asarray(sprites.edge, int)).sum(axis=2) < 70) & (up[..., 3] > 0)
    up[brown, :3] = (78, 92, 122)
    # dark blotches inside the hand (finger-line pixels the sprite cut turned into holes): repaint from nearest skin
    fo = sprites.fore
    solid = fo[..., 3] > 128
    inner = ndi.binary_erosion(solid, iterations=3)
    lum = 0.30 * fo[..., 0] + 0.59 * fo[..., 1] + 0.11 * fo[..., 2]
    dark = inner & (lum < 125)
    if dark.any():
        _, (iy, ix) = ndi.distance_transform_edt(~(inner & ~dark), return_indices=True)
        fo[dark, :3] = fo[iy[dark], ix[dark], :3]
    y_s = R.shirt_row(idle)
    y_w = R.waist_row(idle, y_s)
    tx = R.torso_x(idle, y_s)
    pivot = sprites.shoulder
    parts = split(idle, y_s)
    cap = parts['near'] & (np.hypot(xx - pivot[0], yy - pivot[1]) <= R.CAP_RADIUS) & (yy < y_w - 20)
    removed = (parts['near'] & ~cap) | parts['far']
    body = R.erase(idle, removed, grow=5)
    erased = ndi.binary_dilation(removed, iterations=5)
    body = R.rebuild_torso(body, idle, erased, removed, parts['far'], y_s, y_w, tx, pivot)
    body = repair_hips(body, y_s, y_w)
    return body, {'y_s': y_s, 'y_w': y_w, 'tx': tx, 'seam': y_w + SEAM_BELOW_BELT, 'sprites': sprites}


def repair_hips(body, y_s, y_w):
    """Her idle arm hangs in front of the hip, so removing it leaves holes and stray fragments in the blouse back and
    trousers. The torso's back edge is really a plain vertical line there, so: drop leftover skin, take the true back edge
    from the clean rows lower down, and repaint everything between that edge and the first surviving pixel of each row
    from the nearest drawn colour, with a short darker outline on the edge."""
    from arm_parts import colour_masks
    body = body.copy()
    sk = colour_masks(body)[1]
    sk[:y_s + 40] = False
    body[ndi.binary_dilation(sk, iterations=2)] = 0
    top, bot = y_w - 22, y_w + SEAM_BELOW_BELT + 6
    solid = body[..., 3] > 128
    ref = []
    for y in range(y_w + 45, y_w + 95):
        xs = np.where(solid[y])[0]
        if len(xs):
            ref.append(xs.min())
    x_b = int(np.median(ref))
    print('hip back edge x', x_b)
    for y in range(top, bot + 1):
        row = np.where(solid[y, x_b - 6:])[0]
        if not len(row):
            continue
        first = x_b - 6 + row.min()
        # a run of at least 6 solid pixels marks real fabric; ignore isolated specks left of it
        run = [x for x in range(x_b - 6, x_b + 60) if solid[y, x:x + 6].all()]
        first = min(run) if run else first
        if first > x_b:
            src = body[y, first + 3, :3].astype(float)
            body[y, x_b:first, :3] = np.rint(src)
            body[y, x_b:first, 3] = 255
        body[y, :x_b] = 0
        gap = body[y, x_b:, 3] < 128                     # interior holes: transparent pixels left of the row's last solid one
        last = np.where(~gap)[0].max() if (~gap).any() else 0
        gap[last:] = False
        idx = x_b + np.where(gap)[0]
        if len(idx):
            _, (iy, ix) = ndi.distance_transform_edt(body[y:y + 1, :, 3] < 128, return_indices=True)
            body[y, idx, :3] = body[y, ix[0, idx], :3]
            body[y, idx, 3] = 255
        body[y, x_b:x_b + 2, :3] = np.rint(body[y, x_b + 2, :3].astype(float) * 0.62)
        body[y, x_b:x_b + 2, 3] = 255
    return body


def row_weight(seam):
    y = np.arange(CH, dtype=float)
    t = np.clip((y - (seam - FADE / 2.0)) / FADE, 0, 1)
    return 1 - t * t * (3 - 2 * t)


def legs_layer(c, seam, y_s):
    parts = split(c, y_s)
    gone = ndi.binary_dilation(parts['near'] | parts['far'], iterations=4)
    out = R.erase(c, parts['near'] | parts['far'], grow=4)
    solid = out[..., 3] > 128
    yy = np.arange(CH)[:, None]
    zone = (yy >= seam - 4) & (yy <= seam + 110)
    # Fabric that hid behind the hand: fill where navy trouser survives on both sides of the removed arm, vertically or
    # horizontally (so open background beside the hip is left open), then let the nearest drawn colour fill it.
    nav = is_trouser(out)
    def seen(axis, size=46):
        f = lambda m, o: ndi.maximum_filter1d(m.astype(np.uint8), size=size, axis=axis, origin=o, mode='constant') > 0
        # windows strictly before / after each pixel
        return f(nav, size // 2 - 1 + (size % 2 == 0) * 0) & True, f(nav, -(size // 2))
    up_a, dn_a = seen(0, 26)
    lf_a, rt_a = seen(1, 26)
    hole = gone & ~solid & zone & ((up_a & dn_a) | (lf_a & rt_a))
    # just under the seam the fabric above the hand is hidden by the body layer's fade, so fill the hip's own width there
    # (never beyond its back and front edges, so no navy is painted out into the open air)
    xs = np.arange(CW)[None, :]
    near_seam = (yy >= seam - 4) & (yy <= seam + 30)
    back, front = extents(out, seam + 8, seam + 14)
    hole |= gone & ~solid & near_seam & (xs >= back - 1) & (xs <= front + 1)
    if hole.any():
        # flat navy: the nearest drawn colour would drag the dark trouser outline into the patch as black streaks
        core = ndi.binary_erosion(nav, iterations=3)
        navy = np.median(out[core][:, :3], axis=0) if core.any() else np.array([44, 51, 79.0])
        out[hole, :3] = np.rint(navy).astype(np.uint8)
        out[hole, 3] = 255
    return out


def extents(img, y0, y1):
    L, Rr = [], []
    for y in range(int(y0), int(y1) + 1):
        xs = np.where(img[y, :, 3] > 128)[0]
        if len(xs):
            L.append(xs.min())
            Rr.append(xs.max())
    return float(np.median(L)), float(np.median(Rr))


def match_legs(legs, seam, body_edges, reach=70):
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
    def pre(a):
        al = a[..., 3:4].astype(float) / 255.0
        return np.concatenate([a[..., :3].astype(float) * al, al * 255.0], axis=2)
    w = wb[:, None, None]
    p = pre(body) * w + pre(legs) * (1 - w)
    alpha = np.clip(p[..., 3], 0, 255)
    rgb = np.where(alpha[..., None] > 0.5, p[..., :3] / np.maximum(alpha[..., None] / 255.0, 1e-3), 0)
    return np.rint(np.concatenate([np.clip(rgb, 0, 255), alpha[..., None]], axis=2)).astype(np.uint8)


def trouser_x(img, y0, y1):
    ys, xs = np.where(is_trouser(img)[y0:y1])
    return float(np.median(xs)) if len(xs) else float(BODY_X)


def main(frames_only=None, arms=True):
    sheet = np.array(Image.open(D + 'white-female-walk-master-smoothed.png').convert('RGBA'))
    idle = cell(sheet, 16)
    body0, info = canonical_body(idle)
    sprites, seam0 = info['sprites'], info['seam']
    print('idle: shirt row', info['y_s'], 'waist row', info['y_w'], 'seam', seam0)
    legs = [legs_layer(cell(sheet, n), seam0, R.shirt_row(cell(sheet, n))) for n in range(LOOP)]
    body_ref_x = trouser_x(body0, seam0 - 12, seam0)
    out = sheet.copy()
    for n in range(LOOP) if frames_only is None else frames_only:
        dy = BOB_HALF * np.cos(np.pi * n / 4.0)
        dx = (BODY_X - body_ref_x) + SWAY_PX * np.sin(2 * np.pi * n / LOOP)
        body = R.affine(body0, LEAN_DEG, (body_ref_x, seam0), (dx, dy))
        sm = int(round(seam0 + dy))
        lg = match_legs(legs[n], sm, extents(body, sm - 8, sm - 3))
        frame = blend(body, lg, row_weight(seam0 + dy))
        ref = (info['tx'] + dx, info['y_s'] + dy)
        th_n, th_f = R.swing(n)
        if arms:
            far = R.place_arm(sprites, th_f, ref, 1.0, R.FAR_ARM_SHADE)
            near = R.place_arm(sprites, th_n, ref, 1.0)
            frame = R.over(R.over(far, frame), near)
        out[(n // 4) * CH:(n // 4 + 1) * CH, (n % 4) * CW:(n % 4 + 1) * CW] = frame
    return out


if __name__ == '__main__':
    Image.fromarray(main(), 'RGBA').save(D + 'white-female-walk-master.png')
    print('written')

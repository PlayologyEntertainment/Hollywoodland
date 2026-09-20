"""Replace the drawn arms of the walk cycle with a rigged pair of arms on a smooth pendulum.

Reads  aspiring-actor-walk-v2-master-smoothed.png  (output of smooth_upper_body.py)
Writes aspiring-actor-walk-v2-master.png

The generator drew the same scissor in every frame (one hand back, one forward, never crossing), with the hands wandering
by up to ~50 px between frames. Here each loop frame is rebuilt as: far arm (behind) + torso layer (arms removed, shirt
back repainted) + near arm (in front). Both arms are cut from the standing pose, where they hang straight, and swung on
a pendulum: the near arm goes back while the far arm goes forward, they pass beside the body at the passing frames, then
swap. The forearm folds forward as the arm swings forward.

Needs numpy, pillow, scipy.
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, '.')
from arm_parts import CW, CH, colour_masks, split  # noqa: E402

D = 'C:/Hollywoodland/art/generated/walk-cycle-v2/'
LOOP = 16

# ---- swing parameters (degrees; 0 = hanging straight down, + = swung forward) -------------------------------------
MEAN_DEG = 5.0             # slight forward bias, as in a real walk
SWING_DEG = 28.0           # natural swing: about +33 forward / -23 back
ELBOW_REST_DEG = 12.0      # relaxed elbow
ELBOW_FORWARD_DEG = 0.55   # extra flexion per degree of forward swing (33 deg forward -> about 30 deg of bend)
FAR_ARM_SHADE = 0.90       # the arm behind the body is drawn a little darker


def cell(sheet, n):
    return sheet[(n // 4) * CH:(n // 4 + 1) * CH, (n % 4) * CW:(n % 4 + 1) * CW]


def shirt_row(c):
    a, skin, cream = colour_masks(c)
    return int(np.where(cream.sum(axis=1) > 0.057 * 440)[0].min())


def waist_row(c, y_s):
    """First row below the shoulders where the dark trousers are wide."""
    c = c.astype(int)
    a = c[..., 3] > 200
    trouser = a & (c[..., 0] < 105) & (c[..., 1] < 95) & (c[..., 2] < 90) & (abs(c[..., 0] - c[..., 1]) < 14)
    rows = np.where(trouser.sum(axis=1)[y_s + 50:] > 30)[0]
    return int(y_s + 50 + rows.min())


def torso_x(c, y_s):
    cm = colour_masks(c)[2]
    xs = np.where(cm[y_s:y_s + 80])[1]
    return float(np.median(xs))


def erase(c, mask, grow=3):
    """Remove the old arms (mask grown by `grow` px so no anti-aliased fringe stays) and sweep away leftover specks."""
    out = c.copy()
    out[ndi.binary_dilation(mask, iterations=grow)] = 0
    lab, n = ndi.label(ndi.binary_dilation(out[..., 3] > 8, iterations=2), structure=np.ones((3, 3)))
    sizes = ndi.sum(np.ones_like(lab), lab, range(1, n + 1))
    for i, sz in enumerate(sizes, start=1):
        if sz < 900:
            out[(lab == i)] = 0
    return out


def affine(img, angle_deg, pivot, shift):
    """Rotate an RGBA image about `pivot` (x, y) by angle_deg (+ = swing forward, i.e. a hanging limb moves toward +x),
    then translate by `shift` (dx, dy). Premultiplied so the edges do not darken."""
    t = np.radians(angle_deg)
    # forward map: v' = R v with R = [[cos, sin], [-sin, cos]] on (dx, dy) from the pivot
    R = np.array([[np.cos(t), np.sin(t)], [-np.sin(t), np.cos(t)]])
    Rinv = R.T
    px, py = pivot
    yy, xx = np.mgrid[0:CH, 0:CW].astype(float)
    ox, oy = xx - (px + shift[0]), yy - (py + shift[1])           # output coords relative to the moved pivot
    sx = Rinv[0, 0] * ox + Rinv[0, 1] * oy + px
    sy = Rinv[1, 0] * ox + Rinv[1, 1] * oy + py
    a = img[..., 3:4].astype(float) / 255.0
    pre = np.concatenate([img[..., :3].astype(float) * a, a * 255.0], axis=2)
    out = np.stack([ndi.map_coordinates(pre[..., k], [sy, sx], order=3, mode='constant', cval=0.0) for k in range(4)], axis=2)
    alpha = np.clip(out[..., 3], 0, 255)
    rgb = np.where(alpha[..., None] > 0.5, out[..., :3] / np.maximum(alpha[..., None] / 255.0, 1e-3), 0)
    return np.rint(np.concatenate([np.clip(rgb, 0, 255), alpha[..., None]], axis=2)).astype(np.uint8)


def over(base, top):
    """Alpha-composite `top` over `base` (both RGBA uint8)."""
    return np.array(Image.alpha_composite(Image.fromarray(base, 'RGBA'), Image.fromarray(top, 'RGBA')))


def scale_about(img, s, point):
    """Uniformly scale an RGBA cell image by s about `point` (keeps the cell size)."""
    if abs(s - 1) < 0.005:
        return img
    px, py = point
    yy, xx = np.mgrid[0:CH, 0:CW].astype(float)
    sx, sy = (xx - px) / s + px, (yy - py) / s + py
    a = img[..., 3:4].astype(float) / 255.0
    pre = np.concatenate([img[..., :3].astype(float) * a, a * 255.0], axis=2)
    out = np.stack([ndi.map_coordinates(pre[..., k], [sy, sx], order=3, mode='constant') for k in range(4)], axis=2)
    alpha = np.clip(out[..., 3], 0, 255)
    rgb = np.where(alpha[..., None] > 0.5, out[..., :3] / np.maximum(alpha[..., None] / 255.0, 1e-3), 0)
    return np.rint(np.concatenate([np.clip(rgb, 0, 255), alpha[..., None]], axis=2)).astype(np.uint8)


def luma(c):
    c = c.astype(float)
    return 0.30 * c[..., 0] + 0.59 * c[..., 1] + 0.11 * c[..., 2]


def clean_sprite(img, core, outline_rgb, ss=4):
    """Rebuild a limb piece from its colour core: a smooth silhouette (traced at ss x resolution), flat interior colours
    sampled from well inside the piece, and a continuous ~2 px drawn outline. The generator's own outline is broken into
    dots once the piece is rotated, and its edge pixels carry outline fragments, so neither is reused."""
    core = ndi.binary_fill_holes(ndi.binary_closing(core, iterations=3))
    # smooth silhouette at ss x, ring = 2 px outline, then average back down for anti-aliased edges
    big = ndi.zoom(core.astype(float), ss, order=1)
    big = ndi.gaussian_filter(big, 1.6 * ss / 2) > 0.5
    yy, xx = np.mgrid[-2 * ss:2 * ss + 1, -2 * ss:2 * ss + 1]
    ring_big = ndi.binary_dilation(big, structure=(xx ** 2 + yy ** 2 <= (2 * ss) ** 2))
    def down(m):
        return m.reshape(CH, ss, CW, ss).mean(axis=(1, 3))
    a_all, a_core = down(ring_big), down(big)
    # interior colours: nearest colour from the piece shrunk by 3 px (its flat interior), so no old outline fragments leak in
    inner = ndi.binary_erosion(core & (img[..., 3] > 200), iterations=3)
    if not inner.any():
        inner = core & (img[..., 3] > 200)
    _, (iy, ix) = ndi.distance_transform_edt(~inner, return_indices=True)
    interior = img[iy, ix, :3].astype(float)
    frac = np.divide(a_core, a_all, out=np.zeros_like(a_all), where=a_all > 1e-3)
    rgb = interior * frac[..., None] + np.asarray(outline_rgb, float) * (1 - frac[..., None])
    out = np.zeros(img.shape, float)
    out[..., :3] = rgb
    out[..., 3] = a_all * 255
    return np.rint(out).astype(np.uint8)


class ArmSprites:
    """The arm cut from the standing pose, in two rigid pieces (upper arm with cuff, forearm with fist)."""

    def __init__(self, idle):
        self.y_s = shirt_row(idle)
        self.ref = (torso_x(idle, self.y_s), self.y_s)
        self.y_w = waist_row(idle, self.y_s)
        p = split(idle, self.y_s)
        skin, cream = p['near_skin'], p['near_cream']
        lu = luma(idle)
        upper_core = ndi.binary_dilation(cream, iterations=1) & (idle[..., 3] > 200) & (lu >= 125)
        fore_core = ndi.binary_dilation(skin, iterations=1) & (idle[..., 3] > 200) & (lu >= 105) & ~upper_core
        ys, xs = np.where(cream)
        top = ys.min()
        band = xs[ys < top + 25]
        self.shoulder = (float(band.mean()), float(top + 22))
        cuff = cream & (np.arange(CH)[:, None] > top + 0.55 * (ys.max() - top))
        cy, cx = np.where(cuff)
        self.elbow = (float(cx.mean()), float(cy.mean()))
        edge = np.rint(np.median(idle[ndi.binary_dilation(skin, iterations=2) & ~ndi.binary_dilation(skin, iterations=1) & (lu < 115) & (idle[..., 3] > 200)][:, :3], axis=0))             if ((ndi.binary_dilation(skin, iterations=2) & (lu < 115)).any()) else np.array([110, 62, 42])
        edge = np.clip(edge, 40, 140)
        self.upper = clean_sprite(idle, upper_core, edge)
        fore = clean_sprite(idle, fore_core, edge)
        # extend the forearm's top up under the cuff so the elbow can bend without opening a gap
        self.fore = self._extrude_up(fore, fore_core, 30)
        self.torso_len = self.y_w - self.y_s
        self.edge = edge

    @staticmethod
    def _extrude_up(img, mask, rows):
        out = img.copy()
        ys, xs = np.where(mask)
        top = ys.min() + 4
        srcrow = out[top].copy()
        for dy in range(1, rows + 1):
            dst = out[top - dy]
            fill = srcrow[:, 3] > 200
            dst[fill] = srcrow[fill]
        return out


def torso_back_profile(idle, y_s, y_w):
    """The idle pose's back edge of the shirt (the sleeve hangs at the torso's side, so its outer edge is the back)."""
    a = idle[..., 3] > 128
    prof = {}
    for y in range(y_s + 6, y_w + 1):
        xs = np.where(a[y])[0]
        prof[y] = float(xs.min()) + 6.0
    return prof


def rebuild_shirt_back(body, idle_profile, idle_ref, idle_rows, y_s, y_w, tx):
    """Repaint the shirt's back where the sleeve used to hide it: this frame's own shirt tone, a slanted shoulder line,
    a darker band along the back edge and a drawn outline."""
    a = body[..., 3] > 128
    cm = colour_masks(body)[2]
    band = cm[y_s + 10:y_w - 6, int(tx) - 45:int(tx) + 45]
    tone = np.median(body[y_s + 10:y_w - 6, int(tx) - 45:int(tx) + 45][band][:, :3], axis=0) if band.any() else np.array([236, 205, 170])
    base = np.append(np.rint(tone), 255).astype(np.uint8)
    shade = np.append(np.rint(tone * 0.90), 255).astype(np.uint8)
    line = np.array([72, 52, 44, 255], np.uint8)
    shift = tx - idle_ref[0]
    fill = np.zeros((CH, CW), bool)
    yi0, yi1 = idle_rows
    rows = list(range(y_s - 3, y_w + 1))
    # chest front: a smooth envelope of each row's rightmost torso pixel, so the notch left where the far arm's cuff
    # overlapped the front edge is filled back to the line the neighbouring rows follow
    last = {}
    for y in rows:
        xs = np.where(a[y, int(tx) - 20:int(tx) + 70])[0]
        last[y] = int(tx) - 20 + int(xs.max()) if len(xs) else None
    ys_ok = [y for y in rows if last[y] is not None and y >= y_s + 4]
    env = {}
    if ys_ok:
        vals = np.array([last[y] for y in ys_ok], float)
        med = ndi.median_filter(vals, size=41, mode='nearest')
        for y, m in zip(ys_ok, med):
            env[y] = int(max(m, last[y]))
    for y in rows:
        f = (y - y_s) / max(y_w - y_s, 1)
        yi = int(round(yi0 + f * (yi1 - yi0)))
        yi = min(max(yi, min(idle_profile)), max(idle_profile))
        xb = idle_profile[yi] + shift
        if y < y_s + 6:                                  # shoulder slope: the back edge slants toward the neck
            xb += (y_s + 6 - y) * 3.5
        xb = int(round(xb))
        span = np.where(a[y, max(xb, 0):int(tx) + 70])[0]
        if len(span) == 0:
            continue
        x_last = max(xb, 0) + int(span.max())
        x_end = max(x_last, env.get(y, x_last))
        row = ~a[y, xb:x_end + 1]                        # every empty pixel between the back edge and the chest front
        if y < y_s + 2 and x_end - xb > 90:
            row[:] = False                               # never bridge the collar/neck gap
        fill[y, xb:x_end + 1] = row
    fill = ndi.binary_opening(fill, iterations=1) | (fill & ndi.binary_dilation(a, iterations=1))
    # smooth the repainted region's outline so the slanted shoulder line and the back edge do not stair-step
    fill = (ndi.gaussian_filter(fill.astype(float), 1.3) > 0.5) & ~a | (fill & ndi.binary_dilation(a, iterations=1))
    out = body.copy()
    outside = ~(a | fill)
    border = fill & ndi.binary_dilation(outside, iterations=2)
    dist_border = ndi.distance_transform_edt(~border)
    ys, xs = np.where(fill)
    for y, x in zip(ys, xs):
        t = min(dist_border[y, x] / 12.0, 1.0)
        out[y, x] = np.rint(shade * (1 - t) + base * t).astype(np.uint8)
    out[border] = line
    return out


def swing(k):
    """Near and far shoulder angles (deg) for loop frame k: contact (k = 0, 8) is the extreme, the passing frames the middle."""
    c = np.cos(np.pi * k / 8.0)
    return MEAN_DEG - SWING_DEG * c, MEAN_DEG + SWING_DEG * c


def elbow(theta):
    return ELBOW_REST_DEG + ELBOW_FORWARD_DEG * max(theta, 0.0)


def place_arm(sprites, theta, ref, scale, shade=1.0):
    """The rigged arm for a frame, as one RGBA cell layer."""
    sh = sprites.shoulder
    el = sprites.elbow
    shift = (ref[0] - sprites.ref[0], ref[1] - sprites.ref[1])
    up = affine(sprites.upper, theta, sh, shift)
    # elbow after rotating the upper arm about the shoulder
    t = np.radians(theta)
    ex, ey = el[0] - sh[0], el[1] - sh[1]
    e2 = (sh[0] + shift[0] + ex * np.cos(t) + ey * np.sin(t), sh[1] + shift[1] - ex * np.sin(t) + ey * np.cos(t))
    fo = affine(sprites.fore, theta + elbow(theta), el, (e2[0] - el[0], e2[1] - el[1]))
    arm = over(fo, up)                    # sleeve and cuff end over the forearm's top
    if shade != 1.0:
        arm[..., :3] = np.rint(arm[..., :3].astype(float) * shade).astype(np.uint8)
    return arm


def main(preview=None):
    sheet = np.array(Image.open(D + 'aspiring-actor-walk-v2-master-smoothed.png').convert('RGBA'))
    idle = cell(sheet, 16)
    sprites = ArmSprites(idle)
    prof = torso_back_profile(idle, sprites.y_s, sprites.y_w)
    print('idle: shoulder', np.round(sprites.shoulder, 1), 'elbow', np.round(sprites.elbow, 1), 'torso length', sprites.torso_len)
    out = sheet.copy()
    frames = range(LOOP) if preview is None else preview
    for n in frames:
        c = cell(sheet, n)
        y_s = shirt_row(c)
        y_w = waist_row(c, y_s)
        tx = torso_x(c, y_s)
        parts = split(c, y_s)
        body = erase(c, parts['near'] | parts['far'], grow=3)
        body = rebuild_shirt_back(body, prof, sprites.ref, (sprites.y_s, sprites.y_w), y_s, y_w, tx)
        th_n, th_f = swing(n % LOOP)
        ref = (tx, y_s)
        s = (y_w - y_s) / sprites.torso_len
        far = place_arm(sprites, th_f, ref, s, FAR_ARM_SHADE)
        near = place_arm(sprites, th_n, ref, s)
        frame = over(over(far, body), near)
        out[(n // 4) * CH:(n // 4 + 1) * CH, (n % 4) * CW:(n % 4 + 1) * CW] = frame
    return out


if __name__ == '__main__':
    result = main()
    Image.fromarray(result, 'RGBA').save(D + 'aspiring-actor-walk-v2-master.png')
    print('written')

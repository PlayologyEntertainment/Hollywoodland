"""Replace the drawn arms of the walk cycle with a rigged pair of arms on a smooth pendulum.

Reads  aspiring-actor-walk-v2-master-smoothed.png  (output of smooth_upper_body.py)
Writes aspiring-actor-walk-v2-master.png

The generator drew the same scissor in every frame (one hand back, one forward, never crossing), with the hands wandering
by up to ~50 px between frames. Here each loop frame is rebuilt as: far arm (behind) + torso layer + near arm (in front).
Both arms are cut from the standing pose, where they hang straight, and swung on a pendulum: the near arm goes back while
the far arm goes forward, they pass beside the body at the passing frames, then swap. The forearm folds forward as the arm
swings forward.

Torso layer: the drawn shoulder cap of the near sleeve is kept (its own outline and the suspender strap over it stay
intact) and the rigged upper arm fades in from under it, so the arm grows out of the shoulder. Everything else the old
arms covered is rebuilt: belt and trouser pixels caught only in the erase margin are restored, and the exposed shirt back,
chest front and belt ends are repainted inside the cleared area only, with edges anchored to the visible belt ends.

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
MEAN_DEG = 0.0             # centred: the first version (+33 forward / -23 back) was too far forward
SWING_DEG = 30.0           # about +30 forward / -30 back
ELBOW_REST_DEG = 12.0      # relaxed elbow
ELBOW_FORWARD_DEG = 0.55   # extra flexion per degree of forward swing (30 deg forward -> about 28 deg of bend)
CAP_RADIUS = 40            # px around the shoulder pivot where the drawn sleeve cap stays in the torso layer
FEATHER_INNER, FEATHER_OUTER = 8.0, 30.0   # the rigged upper arm fades in between these distances from the pivot
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


def poly_coverage(polys, ss=4):
    """Anti-aliased coverage (0..1) of polygons given as lists of (x, y), drawn at ss x resolution."""
    from PIL import ImageDraw
    im = Image.new('L', (CW * ss, CH * ss), 0)
    d = ImageDraw.Draw(im)
    for poly in polys:
        d.polygon([(x * ss, y * ss) for x, y in poly], fill=255)
    return np.asarray(im, float).reshape(CH, ss, CW, ss).mean(axis=(1, 3)) / 255.0


def line_coverage(pts, width, ss=4):
    from PIL import ImageDraw
    im = Image.new('L', (CW * ss, CH * ss), 0)
    ImageDraw.Draw(im).line([(x * ss, y * ss) for x, y in pts], fill=255, width=int(width * ss), joint='curve')
    return np.asarray(im, float).reshape(CH, ss, CW, ss).mean(axis=(1, 3)) / 255.0


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
        # fade the sleeve in with distance from the shoulder pivot, so it grows out from the drawn shoulder cap
        yy, xx = np.mgrid[0:CH, 0:CW]
        d = np.hypot(xx - self.shoulder[0], yy - self.shoulder[1])
        ramp = np.clip((d - FEATHER_INNER) / (FEATHER_OUTER - FEATHER_INNER), 0, 1)
        self.upper[..., 3] = np.rint(self.upper[..., 3] * ramp).astype(np.uint8)
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


def rebuild_torso(body, orig, erased, removed, far, y_s, y_w, tx, pivot):
    """Repaint only what the old arms truly hid: the exposed shirt back below the shoulder cap, the chest front and the
    ends of the belt. Belt and trouser pixels that were only caught in the erase margin are restored from the original
    first. Silhouette edges are anchored to the visible belt ends and drawn as smooth anti-aliased lines; the shirt gets
    its own tone plus grain (one shared noise for all channels, so no colour speckle)."""
    o = orig.astype(int)
    yy, xx = np.mgrid[0:CH, 0:CW]
    dark_o = (o[..., 3] > 200) & (o[..., 0] < 105) & (o[..., 1] < 95) & (o[..., 2] < 90) & (abs(o[..., 0] - o[..., 1]) < 14)
    # 1. restore belt/trouser pixels the erase margin took (grey-dark pixels are never arm pixels)
    restore = (erased & ~removed) & dark_o & (yy >= y_w - 8) & (body[..., 3] == 0)
    body = body.copy()
    body[restore] = orig[restore]
    a = body[..., 3] > 128
    dark_body = dark_o & a

    # 2. where the belt ends now (visible), and where the trouser edges say it should end
    x0 = max(int(tx) - 120, 0)
    ends_l, ends_r = [], []
    for y in range(y_w + 3, y_w + 10):
        xs = np.where(dark_body[y, x0:int(tx) + 130])[0]
        if len(xs):
            ends_l.append(x0 + xs.min())
            ends_r.append(x0 + xs.max())
    if not ends_l:
        return body
    x_bl, x_br = float(np.median(ends_l)), float(np.median(ends_r))

    def edge_fit(side):
        ys_, xs_ = [], []
        for y in range(y_w + 26, y_w + 70):
            xs = np.where(dark_body[y, x0:int(tx) + 130])[0]
            if len(xs):
                ys_.append(y)
                xs_.append(x0 + (xs.min() if side == 'l' else xs.max()))
        return np.polyfit(ys_, xs_, 1) if len(ys_) >= 8 else None

    fl, fr = edge_fit('l'), edge_fit('r')
    # extend a belt end that is short of the trouser edge, but only by a little: the hips curve in near the belt
    if fr is not None and np.polyval(fr, y_w + 6) > x_br + 5:
        x_br += min(np.polyval(fr, y_w + 6) - x_br, 12)
    if fl is not None and np.polyval(fl, y_w + 6) < x_bl - 5:
        x_bl -= min(x_bl - np.polyval(fl, y_w + 6), 12)

    # 3. chest front: from the last unaffected rows under the collar down to the belt's front end
    far_rows = np.where(far[:, int(tx) - 10:].any(axis=1))[0]
    far_rows = far_rows[far_rows > y_s + 20]
    y_up = int(far_rows.min()) - 8 if len(far_rows) else y_s + 30
    y_up = max(y_up, y_s + 14)
    xs_up = []
    for y in range(y_up - 6, y_up + 1):
        row = np.where(a[y, int(tx) - 20:int(tx) + 90])[0]
        if len(row):
            xs_up.append(int(tx) - 20 + row.max())
    x_up = float(np.median(xs_up)) if xs_up else tx + 40
    # cream just above the belt, if visible, fixes the bottom of the front edge better than the belt end alone
    cm_o = colour_masks(orig)[2] & a
    xs_hem = [int(tx) - 20 + np.where(cm_o[y, int(tx) - 20:int(tx) + 90])[0].max() for y in range(y_w - 14, y_w - 2)
              if cm_o[y, int(tx) - 20:int(tx) + 90].any()]
    x_hem = max(x_br, float(np.median(xs_hem))) if xs_hem else x_br
    x_hem = max(x_hem, x_up - 6)

    # 4. back edge: from the bottom of the kept shoulder cap to the belt's back end
    cap_bottom = int(pivot[1] + CAP_RADIUS - 6)
    xs_back = np.where(a[cap_bottom - 6:cap_bottom + 2, :int(tx)])[1]
    x_capb = float(xs_back.min()) if len(xs_back) else tx - 45

    shirt_poly = [(x_capb - 2, cap_bottom - 12), (x_bl - 1, y_w), (x_hem + 1, y_w), (x_up + 1, y_up),
                  (tx - 10, y_up), (tx - 10, cap_bottom - 12)]
    belt_poly = [(x_bl - 0.5, y_w - 1), (x_br + 0.5, y_w - 1), (x_br + 0.5, y_w + 13), (x_bl - 0.5, y_w + 13)]
    # paint only inside the area the erase cleared, so no belt or shirt is drawn where an arm never hid it
    zone = ndi.gaussian_filter(ndi.binary_dilation(erased, iterations=1).astype(float), 0.8)
    cov_shirt = poly_coverage([shirt_poly]) * zone
    cov_belt = poly_coverage([belt_poly]) * zone

    # colours: this frame's own shirt tone, darker toward the back edge, plus a soft grain from the drawn shirt
    ch = cm_o[y_s + 10:y_w - 6, int(tx) - 45:int(tx) + 45]
    chest = body[y_s + 10:y_w - 6, int(tx) - 45:int(tx) + 45][ch][:, :3].astype(float)
    tone = np.median(chest, axis=0) if len(chest) else np.array([236.0, 205.0, 170.0])
    lum_sd = float(np.std(chest.mean(axis=1))) if len(chest) else 3.0
    rng = np.random.default_rng(7)
    noise = ndi.gaussian_filter(rng.standard_normal((CH, CW)), 1.4)
    noise *= min(lum_sd, 5.0) * 0.6 / max(noise.std(), 1e-6)
    back_x = x_capb + (x_bl - x_capb) * np.clip((yy - cap_bottom) / max(y_w - cap_bottom, 1), 0, 1)
    d_back = np.clip((xx - back_x) / 16.0, 0, 1)
    d_belt = np.clip((y_w - yy) / 12.0, 0, 1)
    shade = (0.88 + 0.12 * d_back) * (0.94 + 0.06 * d_belt)
    tone_rgb = np.clip(tone * shade[..., None] + noise[..., None], 0, 255)
    cream_present = cm_o & (yy < y_w + 2)
    dist_c, (iy, ix) = ndi.distance_transform_edt(~cream_present, return_indices=True)
    nearest = body[iy, ix, :3].astype(float)
    w = np.clip(dist_c / 10.0, 0, 1)[..., None]
    shirt_rgb = nearest * (1 - w) + tone_rgb * w
    rows = dark_o[y_w + 2:y_w + 10]
    belt_med = np.median(o[y_w + 2:y_w + 10][rows][:, :3], axis=0) if rows.any() else np.array([58.0, 50.0, 44.0])
    belt_rgb = np.clip(np.broadcast_to(belt_med, (CH, CW, 3)) + noise[..., None] * 0.4, 0, 255)

    fill = np.zeros((CH, CW, 4), float)
    for cov, rgb in ((cov_shirt, shirt_rgb), (cov_belt, belt_rgb)):
        m = cov > 0
        fill[m, :3] = fill[m, :3] * (1 - cov[m, None]) + rgb[m] * cov[m, None]
        fill[m, 3] = np.maximum(fill[m, 3], cov[m] * 255)

    # outline along the freshly drawn back and front edges
    line_col = np.array([72.0, 52.0, 44.0])
    cov_line = np.maximum(line_coverage([(x_capb, cap_bottom - 8), (x_bl, y_w)], 2.4),
                          line_coverage([(x_up, y_up), (x_hem, y_w)], 2.4)) * zone
    fill[..., :3] = fill[..., :3] * (1 - cov_line[..., None]) + line_col * cov_line[..., None]
    fill[..., 3] = np.maximum(fill[..., 3], cov_line * 255)
    layer = np.rint(fill).astype(np.uint8)
    result = over(layer, body)                              # the surviving drawn pixels stay on top
    return patch_pinholes(result, y_s, y_w, tx)


def patch_pinholes(img, y_s, y_w, tx):
    """Fill small transparent notches enclosed by the torso (chest front beside the suspender, hem, belt ends) with the
    nearest drawn colour. Only rows from the collar to just below the belt, and only within the torso's width."""
    yy, xx = np.mgrid[0:CH, 0:CW]
    solid = img[..., 3] > 128
    zone = (yy >= y_s + 4) & (yy <= y_w + 16) & (xx >= tx - 75) & (xx <= tx + 75)
    closed = ndi.binary_closing(solid, structure=np.ones((11, 11), bool))
    hole = closed & ~solid & zone
    if not hole.any():
        return img
    _, (iy, ix) = ndi.distance_transform_edt(~solid, return_indices=True)
    out = img.copy()
    out[hole, :3] = img[iy[hole], ix[hole], :3]
    out[hole, 3] = 255
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
    print('idle: shoulder', np.round(sprites.shoulder, 1), 'elbow', np.round(sprites.elbow, 1), 'torso length', sprites.torso_len)
    out = sheet.copy()
    frames = range(LOOP) if preview is None else preview
    yy, xx = np.mgrid[0:CH, 0:CW]
    for n in frames:
        c = cell(sheet, n)
        y_s = shirt_row(c)
        y_w = waist_row(c, y_s)
        tx = torso_x(c, y_s)
        ref = (tx, y_s)
        pivot = (sprites.shoulder[0] + ref[0] - sprites.ref[0], sprites.shoulder[1] + ref[1] - sprites.ref[1])
        parts = split(c, y_s)
        cap = parts['near'] & (np.hypot(xx - pivot[0], yy - pivot[1]) <= CAP_RADIUS)     # the drawn shoulder cap stays
        removed = (parts['near'] & ~cap) | parts['far']
        body = erase(c, removed, grow=3)
        erased = ndi.binary_dilation(removed, iterations=3)
        body = rebuild_torso(body, c, erased, ndi.binary_dilation(removed, iterations=0) | removed, parts['far'], y_s, y_w, tx, pivot)
        th_n, th_f = swing(n % LOOP)
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

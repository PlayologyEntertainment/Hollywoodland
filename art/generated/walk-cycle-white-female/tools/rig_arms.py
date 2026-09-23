"""Replace the drawn arms of the walk cycle with a rigged pair of arms on a smooth pendulum.

STATUS (2026-09-23): no longer run as part of the build. Even after the two hole-detection
fixes below (bounding the patch to the erase margin, and donor-copying real texture instead of
a flat fill), the erase-and-repaint approach kept producing visible per-frame torso artifacts in
review -- the owner's "missing shirt" / "lack of continuity" feedback on a round that used this
step. The AI-drawn arms this was built to replace turned out not to need it: checked directly
against `white-female-walk-master-smoothed.png` (this file's own input, i.e. before this script
ever touches it), her raw arms swing naturally frame to frame with no torso damage at all, unlike
the male character's original art (see the paragraph below) which motivated writing this in the
first place. The current build copies the smoothed master straight through as the final master,
skipping this file. Kept for reference and in case a future take-sheet regeneration reintroduces
genuinely jittery arms that need rigging.

Reads  white-female-walk-master-smoothed.png  (output of smooth_upper_body.py)
Writes white-female-walk-master.png

The generator drew the same scissor in every frame (one hand back, one forward, never crossing), with the hands wandering
by up to ~50 px between frames. Here each loop frame is rebuilt as: far arm (behind) + torso layer + near arm (in front).
Both arms are cut from the standing pose, where they hang straight, and swung on a pendulum: the near arm goes back while
the far arm goes forward, they pass beside the body at the passing frames, then swap. The forearm folds forward as the arm
swings forward.

Torso layer: the drawn shoulder cap of the near sleeve is kept (its own outline stays intact) and the rigged upper
arm fades in from under it, so the arm grows out of the shoulder. Everything else the old arms covered is rebuilt:
belt and trouser pixels caught only in the erase margin are restored, and whatever hole remains is filled with the
nearest surviving drawn colour (see rebuild_torso for why this is a simpler repaint than the male pipeline's own
version needed: no suspender strap crosses this character's shoulder, so there is no large torn hole to redraw).

Needs numpy, pillow, scipy.
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, '.')
from arm_parts import CW, CH, colour_masks, split  # noqa: E402

D = 'C:/Hollywoodland/art/generated/walk-cycle-white-female/'
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
    # 374: this character's own mean walk-frame height (build_sheet.py's build record), the equivalent of the
    # male pipeline's fixed 440 (his own mean walk-frame height) -- both just a minimum-row-width heuristic
    # scaled to roughly how tall this character is drawn in the cell.
    return int(np.where(cream.sum(axis=1) > 0.057 * 374)[0].min())


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
        # A ring just outside the skin, dark enough to be an outline pixel rather than fill. On this character's
        # idle pose the near hand rests close to the hip, so that ring can also catch her (cool, blue-toned) navy
        # trouser pixels rather than her (warm, red-toned) true outline -- `r_gt_b` keeps only the warm ones.
        ring = ndi.binary_dilation(skin, iterations=2) & ~ndi.binary_dilation(skin, iterations=1) & (lu < 115) & (idle[..., 3] > 200)
        r_gt_b = idle[..., 0].astype(int) > idle[..., 2].astype(int)
        edge = np.rint(np.median(idle[ring & r_gt_b][:, :3], axis=0)) if (ring & r_gt_b).any() else np.array([110, 62, 42])
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


def rebuild_torso(body, orig, erased, removed, far, y_s, y_w, tx, pivot, donor=None, donor_ref=None, donor_bad=None):
    """Repaint what the old arms hid. Simplified from the male pipeline's version: that one fit polygons to a
    suspender strap crossing the whole torso diagonally, because erasing his arms tore a large hole through it.
    This character wears a plain blouse and a thin belt with no strap crossing the shoulder, so the erased-arm
    hole rarely reaches the belt line at all -- restoring the belt/trouser pixels caught only in the erase
    margin (same idea as the male version's step 1, plus her belt's own brown, which is a different colour
    from her trousers) leaves, in practice, only small gaps near the shoulder and sleeve, which nearest-colour
    infill (from this frame's own surviving torso pixels) closes cleanly. See the build log for the visual
    check that motivated this simplification instead of porting the male version's polygon fit unchanged.

    `donor`/`donor_ref` (an RGBA cell and its own (tx, y_s), typically the idle frame) are an unobstructed torso
    to copy real pixels -- belt buckle, fold shading -- from for whatever hole is left, instead of only ever
    falling back to a flat median colour (see the two fixes below for why the flat fill alone read as an "art
    issue": a visibly flat, texture-less belt/shirt patch)."""
    o = orig.astype(int)
    yy, xx = np.mgrid[0:CH, 0:CW]
    dark_trouser = (o[..., 3] > 200) & (o[..., 0] < 105) & (o[..., 1] < 95) & (o[..., 2] < 90) & (abs(o[..., 0] - o[..., 1]) < 14)
    # Her belt (a thin brown band, not the same colour as her trousers): measured on the accepted idle frame at
    # about (230, 140, 80). On colour alone this is not reliably distinct from her skin's own shadowed/blended
    # edge pixels (measured as low as (181, 104, 64) -- well inside the "belt" colour range) -- unlike the male
    # pipeline's belt/trouser being the same dark colour, so restricting to *right at the waist line* (the belt
    # is always there; skin generally is not) is what actually keeps this mask to the belt. An unrestricted
    # version of this mask matched skin pixels from y 105 to 450 (near head to near feet) and produced a
    # skin-coloured "belt" and a dark tail pulled from skin-shadow pixels far from the true belt -- see the
    # build log for the visual that caught this.
    belt = (o[..., 3] > 200) & (o[..., 0] > 180) & (o[..., 0] < 245) & (o[..., 1] > 100) & (o[..., 1] < 180) \
        & (o[..., 2] < 130) & (o[..., 0] - o[..., 2] > 60) & (o[..., 0] - o[..., 1] > 40) \
        & (yy >= y_w - 15) & (yy <= y_w + 15)
    # Restore belt/trouser pixels the erase margin took: this only ever restores this frame's own original
    # pixels (never invents new ones), so over-including a stray non-belt pixel in the mask is harmless.
    restore = (erased & ~removed) & (dark_trouser | belt) & (yy >= y_w - 12) & (body[..., 3] == 0)
    body = body.copy()
    body[restore] = orig[restore]

    # Whatever hole is left immediately next to the torso itself (genuinely erased torso pixels, not just erase
    # margin) needs filling. FIX 1 (phantom flap): the hole is now bounded to the erase MARGIN only (`erased &
    # ~removed`, the same ring `restore` above already searches) that also had real garment content in the
    # ORIGINAL, undamaged drawing (`orig[..., 3] > 200`) -- not "near some surviving solid pixel" (a dilation of
    # what's left standing, which is what the old `near_torso` mask was). Two failure modes that combination
    # fixes: (a) the old dilation could not tell "a notch cut into real fabric" from "erased background next to
    # the fabric the swung-away arm used to cover" (a hand resting beside, not on, the leg erases a patch of
    # open air next to the trouser silhouette, which the dilation still counted as "near torso" and painted a
    # trouser-coloured flap into; `orig[..., 3] > 200` excludes it, since that patch was never part of the
    # drawn character); (b) without `~removed`, the hole also covered the erased arm's own bulk (obviously
    # "real content" in `orig`, since it's a drawn arm) rather than just the thin margin around it, so the
    # donor-copy fix below pasted the idle's own torso across the whole former-sleeve shape instead of just
    # patching the true gap.
    hole = (body[..., 3] == 0) & erased & ~removed & (orig[..., 3] > 200)
    if hole.any():
        # FIX 2 (flat, texture-less patch): before falling back to a flat median colour, try copying real
        # pixels -- belt buckle, fold shading, collar stitching -- from `donor` (the idle frame, whose arm never
        # covers the belt), positionally aligned by each frame's own torso reference (tx, y_s) so the donor's
        # collar/belt/hem lines up with this frame's. This is what actually fixes the "flat, texture-less belt
        # patch" complaint; the flat per-zone median fill below is now only the last-resort fallback for
        # whatever the donor itself has no pixels for (e.g. a hole that reaches outside the donor's own crop).
        if donor is not None and hole.any():
            dtx, dy_s = donor_ref
            dyy = np.clip(np.rint(yy - y_s + dy_s).astype(int), 0, CH - 1)
            dxx = np.clip(np.rint(xx - tx + dtx).astype(int), 0, CW - 1)
            donor_px = donor[dyy, dxx]
            donor_ok = hole & (donor_px[..., 3] > 200)
            if donor_bad is not None:
                donor_ok &= ~donor_bad[dyy, dxx]
            body[donor_ok] = donor_px[donor_ok]
            body[donor_ok, 3] = 255
            hole &= ~donor_ok

    if hole.any():
        # Last-resort fallback: a nearest-*surviving*-pixel search, whether over the whole torso or split by
        # garment zone, kept landing on something darker than the garment's own typical fill: an outline
        # fragment, a shaded fold, or (once those were excluded) a stray dark cranny -- because a hole's nearest
        # surviving neighbour is, almost by definition, right at a silhouette edge, exactly where the art's own
        # shading and outline pixels concentrate. The owner read the result as "a black scarf or belt hanging".
        # Each of the three bands a hole can fall in (blouse above the belt, the belt band itself, trousers
        # below it) is instead filled with that garment's own colour measured as one flat median over this
        # whole frame -- not searched for spatially at all -- which sidesteps the problem entirely: holes here
        # are small enough that a flat fill reads fine, and a frame-wide median colour is dominated by each
        # garment's ordinary fill, not the comparatively rare edge/fold/outline pixels.
        belt_band = (yy >= y_w - 6) & (yy <= y_w + 10)
        blouse_zone = ~belt_band & (yy < y_w)
        trouser_zone = ~belt_band & (yy >= y_w)

        def band_rgb(mask, fallback):
            px = orig[mask].reshape(-1, 4)[:, :3] if mask.any() else None
            return np.median(px, axis=0) if px is not None and len(px) else np.array(fallback)

        blouse_rgb = band_rgb(colour_masks(orig)[2], [180.0, 195.0, 215.0])
        belt_rgb = band_rgb(belt, [180.0, 110.0, 60.0])
        trouser_rgb = band_rgb(dark_trouser & (o[..., 2] > 45), [45.0, 50.0, 78.0])
        for zone_mask, rgb in ((blouse_zone, blouse_rgb), (belt_band, belt_rgb), (trouser_zone, trouser_rgb)):
            zone_hole = hole & zone_mask
            body[zone_hole, :3] = rgb
            body[zone_hole, 3] = 255
    return patch_pinholes(body, y_s, y_w, tx)


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
    sheet = np.array(Image.open(D + 'white-female-walk-master-smoothed.png').convert('RGBA'))
    idle = cell(sheet, 16)
    sprites = ArmSprites(idle)
    print('idle: shoulder', np.round(sprites.shoulder, 1), 'elbow', np.round(sprites.elbow, 1), 'torso length', sprites.torso_len)
    # The idle frame's own torso is the donor for rebuild_torso's texture patch (see FIX 2 there): her idle
    # pose's arm hangs at her side and never covers the belt or shirt front. `donor_bad` is the idle frame's
    # OWN arm silhouette (skin and sleeve), excluded from what can be copied -- without this, a hole that maps
    # into where the idle's own hand rests near her hip pastes skin-tone pixels into the belt/blouse instead of
    # fabric (seen on frame 5 of this build: a band of idle-hand skin tone across the waist).
    donor_y_s = shirt_row(idle)
    donor_tx = torso_x(idle, donor_y_s)
    donor_ref = (donor_tx, donor_y_s)
    donor_bad = ndi.binary_dilation(split(idle, donor_y_s)['near'] | split(idle, donor_y_s)['far'], iterations=4)
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
        # The drawn shoulder cap stays -- but only if it is actually near the shoulder: in some poses the near
        # sleeve's own silhouette (cuff, forearm) swings close enough to the pivot's CAP_RADIUS circle, this far
        # down the torso, to register as "cap" too, protecting a fold-shadow-dark fragment of the original
        # sleeve from erasure right around the belt. Since a real shoulder cap has no business reaching within
        # 20 px of the belt line on this character, that band is excluded regardless of distance from the pivot.
        cap = parts['near'] & (np.hypot(xx - pivot[0], yy - pivot[1]) <= CAP_RADIUS) & (yy < y_w - 20)
        removed = (parts['near'] & ~cap) | parts['far']
        body = erase(c, removed, grow=5)
        erased = ndi.binary_dilation(removed, iterations=5)  # matches erase()'s own grow=5 above, so the restore/infill zone covers everywhere erase() actually cleared
        body = rebuild_torso(body, c, erased, removed, parts['far'], y_s, y_w, tx, pivot, donor=idle, donor_ref=donor_ref, donor_bad=donor_bad)
        th_n, th_f = swing(n % LOOP)
        s = (y_w - y_s) / sprites.torso_len
        far = place_arm(sprites, th_f, ref, s, FAR_ARM_SHADE)
        near = place_arm(sprites, th_n, ref, s)
        frame = over(over(far, body), near)
        out[(n // 4) * CH:(n // 4 + 1) * CH, (n % 4) * CW:(n % 4 + 1) * CW] = frame
    return out


if __name__ == '__main__':
    result = main()
    Image.fromarray(result, 'RGBA').save(D + 'white-female-walk-master.png')
    print('written')

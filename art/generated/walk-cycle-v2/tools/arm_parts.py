"""Split a walk frame into torso layer, near arm and far arm, by colour and connectivity.

The near arm is the big-sleeved arm on the back of the torso; the far arm is the one whose sleeve is hidden behind the
chest and shows only a cuff, forearm and hand. Colours: shirt (236,205,170), skin (236,152,102), everything else dark.
"""
import numpy as np
from scipy import ndimage as ndi

CW, CH = 448, 480


def colour_masks(c):
    c = c.astype(int)
    a = c[..., 3] > 96
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    skin = a & (r > 195) & (g > 110) & (g < 180) & (b < 135) & (r - g > 45)
    cream = a & (r > 205) & (g > 180) & (b > 135) & ~skin
    return a, skin, cream


def shirt_line(cream):
    """Row where the shirt starts (same rule as the smoothing tool)."""
    rows = np.where(cream.any(axis=1))[0]
    h = rows.max() - rows.min() + 1
    return int(np.where(cream.sum(axis=1) > 0.057 * 480 * 0.9)[0].min()) if h else 0


def split(c, y_s):
    """Return dict with boolean masks: near_arm, far_arm (full-cell) and helper info."""
    a, skin, cream = colour_masks(c)
    skin_low = skin.copy()
    skin_low[:y_s + 45] = False                      # face and neck are above this
    lab_s, ns = ndi.label(ndi.binary_dilation(skin_low, iterations=2))
    comps = []
    for i in range(1, ns + 1):
        m = (lab_s == i) & skin_low
        if m.sum() < 250:
            continue
        ys, xs = np.where(m)
        comps.append({'mask': m, 'cx': xs.mean(), 'cy': ys.mean(), 'n': int(m.sum())})
    comps.sort(key=lambda d: d['cx'])
    near_skin = comps[0]['mask'] if comps else np.zeros_like(a)
    far_skin = comps[-1]['mask'] if len(comps) > 1 else np.zeros_like(a)

    core = ndi.binary_erosion(cream, iterations=2)
    lab_c, nc = ndi.label(core)
    # grow each core back over the cream pixels it owns (nearest core wins)
    dist, (iy, ix) = ndi.distance_transform_edt(lab_c == 0, return_indices=True)
    owner = np.where(cream, lab_c[iy, ix], 0)
    sizes = ndi.sum(core, lab_c, range(1, nc + 1))
    order = list(np.argsort(-np.array(sizes)) + 1)
    sleeve_id = order[0]
    near_dil = ndi.binary_dilation(near_skin, iterations=8)
    far_dil = ndi.binary_dilation(far_skin, iterations=8)
    near_cream = owner == sleeve_id
    far_cream = np.zeros_like(a)
    for cid in order[1:]:
        m = owner == cid
        if m.sum() < 40:
            continue
        if (m & near_dil).any():
            near_cream |= m
        elif (m & far_dil).any():
            far_cream |= m
    near_core = near_skin | near_cream
    far_core = far_skin | far_cream
    # the outline ring (2 px) around each arm belongs to it; where the two rings meet, the nearer core wins
    ring_n = ndi.binary_dilation(near_core, iterations=2) & (c[..., 3] > 0)
    ring_f = ndi.binary_dilation(far_core, iterations=2) & (c[..., 3] > 0)
    near = ring_n & ~(ring_f & ~ring_n)
    far = ring_f & ~ring_n
    far |= far_core
    near |= near_core
    return {'near': near, 'far': far, 'near_skin': near_skin, 'far_skin': far_skin, 'near_cream': near_cream, 'far_cream': far_cream}

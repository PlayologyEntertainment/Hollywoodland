"""Helpers for slicing and measuring a walk-cycle sprite sheet."""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi


def load_rgba(path):
    return Image.open(path).convert('RGBA')


def find_figures(im, cols, rows, thresh=24, dilate=9, min_area=4000):
    """Detect one connected figure per frame. Returns a list (row-major) of dicts
    with bbox (x0,y0,x1,y1 inclusive-exclusive) and a full-size boolean mask."""
    a = np.array(im)[:, :, 3]
    solid = a > thresh
    grown = ndi.binary_dilation(solid, iterations=dilate)
    lab, n = ndi.label(grown)
    comps = []
    for i in range(1, n + 1):
        m = (lab == i) & solid
        area = int(m.sum())
        if area < min_area:
            continue
        ys, xs = np.where(m)
        comps.append({'bbox': (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1),
                      'area': area, 'mask': m})
    if len(comps) != cols * rows:
        return comps, False
    # row-major ordering: cluster by y-centre into rows, then sort by x
    comps.sort(key=lambda c: (c['bbox'][1] + c['bbox'][3]) / 2)
    ordered = []
    per = cols
    for r in range(rows):
        row = comps[r * per:(r + 1) * per]
        row.sort(key=lambda c: (c['bbox'][0] + c['bbox'][2]) / 2)
        ordered.extend(row)
    return ordered, True


def foot_info(mask_or_alpha, sole_band=10):
    """Return sole-line y and the x-extents of the bottom band (ground contact)."""
    m = mask_or_alpha
    ys, xs = np.where(m)
    bottom = ys.max()
    band = m[max(bottom - sole_band, 0):bottom + 1]
    bx = np.where(band.any(axis=0))[0]
    return bottom, bx.min(), bx.max()


def split_half(im, cols=4, rows=2, thresh=24, dilate=3, min_area=6000):
    """Detect figures with a light dilation (figures in a half sheet are well separated)."""
    return find_figures(im, cols, rows, thresh=thresh, dilate=dilate, min_area=min_area)


def shoe_mask(arr, y0, y1, x0, x1):
    """Brown leather shoe pixels (warm hue, dark-mid value) in a crop of an RGBA array."""
    c = arr[y0:y1, x0:x1].astype(int)
    r, g, b, a = c[..., 0], c[..., 1], c[..., 2], c[..., 3]
    return (a > 200) & (r - b > 28) & (r < 190) & (r > g + 8) & (r + g + b < 420)


def split_grid(im, cols, rows, thresh=24):
    """Split by an equal grid; return per-cell dicts with a cell-local mask and bbox.
    Reports whether any figure touches its cell edge (a sign of bleed between cells)."""
    a = np.array(im)[:, :, 3] > thresh
    H, W = a.shape
    cw, ch = W / cols, H / rows
    out = []
    for r in range(rows):
        for c in range(cols):
            x0, x1 = int(round(c * cw)), int(round((c + 1) * cw))
            y0, y1 = int(round(r * ch)), int(round((r + 1) * ch))
            m = a[y0:y1, x0:x1]
            ys, xs = np.where(m)
            bb = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
            edge = bb[0] == 0 or bb[1] == 0 or bb[2] == m.shape[1] or bb[3] == m.shape[0]
            out.append({'cell': (x0, y0, x1, y1), 'bbox': bb, 'mask': m, 'touches_edge': bool(edge)})
    return out


def cream_mask(sub):
    """Cream shirt pixels (used as the torso reference)."""
    c = sub.astype(int)
    r, g, b, a = c[..., 0], c[..., 1], c[..., 2], c[..., 3]
    return (a > 200) & (r > 205) & (g > 180) & (b > 140) & (r - b < 90)


def measure_frame(cell, arr):
    """cell: one dict from split_grid; arr: full RGBA array of the sheet. All x in figure-bbox-independent
    cell-local coordinates. Returns dict with body_x, sole_y, shoes[(cx, x0, x1, soleY, area)], planted flags."""
    cx0, cy0, cx1, cy1 = cell['cell']
    sub = arr[cy0:cy1, cx0:cx1]
    x0, y0, x1, y1 = [int(v) for v in cell['bbox']]
    h = y1 - y0
    # torso reference: cream pixels between 12% and 50% of the figure's height
    cm = cream_mask(sub)
    band = cm[y0 + int(h * 0.12): y0 + int(h * 0.50)]
    ys, xs = np.where(band)
    body_x = float(np.median(xs)) if len(xs) else (x0 + x1) / 2
    ys0 = y0 + int(h * 0.68)
    sm = shoe_mask(sub, ys0, y1, x0, x1)
    lab, n = ndi.label(ndi.binary_dilation(sm, iterations=2))
    shoes = []
    for k in range(1, n + 1):
        yy, xx = np.where((lab == k) & sm)
        if len(xx) < 250:
            continue
        shoes.append({'x0': int(xx.min() + x0), 'x1': int(xx.max() + x0),
                      'cx': float(xx.mean() + x0), 'sole': int(yy.max() + ys0), 'area': int(len(xx))})
    shoes.sort(key=lambda s: s['cx'])
    sole_y = max(s['sole'] for s in shoes) if shoes else y1
    for s in shoes:
        s['planted'] = s['sole'] >= sole_y - 8
    return {'bbox': (x0, y0, x1, y1), 'h': h, 'body_x': body_x, 'sole_y': sole_y, 'shoes': shoes}


def ideal_spread(k, n=8):
    """Ideal foot spread (0..1) for step frame k (0-based) of n: a V shape, 1 at contact, 0 at passing."""
    half = n / 2
    return abs(k - half) / half if k >= half - 0 else (half - k) / half

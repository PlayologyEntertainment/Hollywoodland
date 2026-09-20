"""Build the 17-frame walk sheet (16 loop frames + idle) from generated half-sheets.

  python build_sheet.py half-v3-A-take1 half-v3-B-take1 ...
"""
import sys, json
sys.path.insert(0, '.')
from walktools import *
from PIL import Image
from scipy.optimize import linear_sum_assignment

D = 'C:/Hollywoodland/art/generated/walk-cycle-v2/'
CELL_W, CELL_H = 448, 480
BODY_X, BASE_Y = 224, 464
TARGET_HEAD = 0.2075 * 440.0      # head+neck px: the original character is 20.7% head, drawn ~440 px tall
S_UNIT = 115.0 / 50.0             # px per pose-table unit (contact: feet at +-50 units)
CLAMP = 24
SHEETS = sys.argv[1:]


def head_px(arr):
    al = arr[:, :, 3] > 24
    ys, xs = np.where(al)
    top = ys.min()
    cream = cream_mask(arr)
    shirt_top = np.where(cream.sum(axis=1) > 0.057 * (ys.max() - top + 1))[0].min()
    return float(shirt_top - top)


def clean_figure(crop):
    """Keep the figure, drop fragments of neighbouring figures cut off by the cell's top/bottom edge."""
    a = np.array(crop)[:, :, 3]
    lab, n = ndi.label(ndi.binary_dilation(a > 24, iterations=1), structure=np.ones((3, 3)))
    keep = np.zeros(a.shape, bool)
    for k in range(1, n + 1):
        yy, xx = np.where(lab == k)
        hh = yy.max() - yy.min() + 1
        touches = yy.min() == 0 or yy.max() == a.shape[0] - 1
        if (touches and hh < 60) or len(yy) < 200:
            continue
        keep |= (lab == k)
    keep = ndi.binary_dilation(keep, iterations=2)
    arr = np.array(crop)
    arr[~keep] = 0
    return Image.fromarray(arr, 'RGBA')


def load_pool():
    pool = []
    for name in SHEETS:
        im = load_rgba(D + name + '.png')
        cells = split_grid(im, 4, 2)
        for i, c in enumerate(cells):
            cx0, cy0, cx1, cy1 = c['cell']
            crop = clean_figure(im.crop((cx0, cy0, cx1, cy1)))
            arr = np.array(crop)
            hp = head_px(arr)
            f = TARGET_HEAD / hp
            if abs(f - 1) > 0.01:
                crop = crop.resize((int(round(crop.width * f)), int(round(crop.height * f))), Image.LANCZOS)
                arr = np.array(crop)
            al = arr[:, :, 3] > 24
            ys, xs = np.where(al)
            cellinfo = {'cell': (0, 0, crop.width, crop.height), 'bbox': (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)}
            m = measure_frame(cellinfo, arr)
            m['alpha_bottom'] = int(ys.max())
            m['scale'] = f
            pool.append({'sheet': name, 'idx': i, 'img': crop, 'm': m})
    return pool


def lead_x(m, k):
    sh = [s for s in m['shoes'] if s['area'] > 900]
    rel = [(s['cx'] - m['body_x'], not s['planted']) for s in sh]
    if len(rel) == 1:
        return rel[0][0]
    rel.sort()
    planted = [r for r in rel if not r[1]]
    if k <= 1:
        return rel[-1][0]
    if k <= 3:
        return planted[0][0] if planted else rel[-1][0]
    if k == 4:
        return planted[0][0] if planted else rel[0][0]
    return rel[0][0]


def features(p):
    m = p['m']
    sh = [s for s in m['shoes'] if s['area'] > 900]
    if not sh:
        return None
    rel = [(s['cx'] - m['body_x'], not s['planted']) for s in sh]
    if len(rel) == 1:
        rel = [rel[0], rel[0]]
    rel.sort(key=lambda t: t[0])
    return {'rear': rel[0][0], 'front': rel[1][0], 'rear_lift': rel[0][1], 'front_lift': rel[1][1]}


def pick(pool):
    lead = [50, 38, 25, 12, 0, -12, -25, -38]
    swing = [-50, -50, -45, -25, 0, 18, 35, 47]
    lifted_expect = ['none', 'none', 'rear', 'rear', 'any', 'front', 'front', 'front']
    pairs = []
    for k in range(8):
        r, f = sorted((lead[k] * S_UNIT, swing[k] * S_UNIT))
        pairs.append((r, f))
    cand = []
    for i, p in enumerate(pool):
        ft = features(p)
        if ft is None:
            continue
        cand.append((i, ft))

    def cost(ft, k):
        wr, wf = (1, 3) if k <= 3 else (3, 1)
        c = wr * abs(ft['rear'] - pairs[k][0]) + wf * abs(ft['front'] - pairs[k][1])
        lifted = ('both' if ft['rear_lift'] and ft['front_lift'] else 'rear' if ft['rear_lift']
                  else 'front' if ft['front_lift'] else 'none')
        e = lifted_expect[k]
        if e == 'none' and lifted != 'none':
            c += 80
        if e in ('rear', 'front') and lifted != e:
            c += 80
        return c

    slots = list(range(8)) * 2
    C = np.array([[cost(ft, k) for (_, ft) in cand] for k in slots])
    rows, cols = linear_sum_assignment(C)
    order = sorted(zip(rows, cols))
    chosen = []
    for s, c in order:
        chosen.append(cand[c][0])
        ft = cand[c][1]
        p = pool[cand[c][0]]
        print(f"slot {s + 1:2d} <- {p['sheet']} f{p['idx'] + 1} rear={ft['rear']:.0f} front={ft['front']:.0f} "
              f"lift={ft['rear_lift']:d}/{ft['front_lift']:d} ideal=({pairs[slots[s]][0]:.0f},{pairs[slots[s]][1]:.0f}) cost={C[s, c]:.0f}")
    print('total cost', C[rows, cols].sum())
    return chosen


def place(p, dx):
    m = p['m']
    out = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
    ox = int(round(BODY_X + dx - m['body_x']))
    oy = int(BASE_Y - m['alpha_bottom'])
    layer = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
    layer.paste(p['img'], (ox, oy))
    out.alpha_composite(layer)
    return out


def main():
    pool = load_pool()
    print('pool', len(pool), 'frames; mean scale factor %.3f' % np.mean([p['m']['scale'] for p in pool]))
    chosen = pick(pool)
    xs = np.array([lead_x(pool[i]['m'], n % 8) for n, i in enumerate(chosen)], float)
    k = np.arange(8)
    slope = sum(-np.polyfit(k, xs[s * 8:(s + 1) * 8], 1)[0] for s in range(2)) / 2
    res = []
    for s in range(2):
        y = xs[s * 8:(s + 1) * 8]
        c = np.mean(y + slope * k)
        res += list(y - (c - slope * k))
    res = np.array(res)
    # Shift each frame so the stance foot stays on the street, but share the error with the torso: an exact
    # foot lock would lurch the body from frame to frame, so minimise foot slide plus MU x (body jump)^2.
    MU = 0.75
    n = len(res)
    Dm = np.zeros((n, n))
    for i in range(n):
        Dm[i, i], Dm[i, (i + 1) % n] = -1, 1
    dxs = (-np.linalg.solve(np.eye(n) + MU * Dm.T @ Dm, res)).clip(-CLAMP, CLAMP)
    print('body jump max %.1f px between frames' % np.abs(dxs - np.roll(dxs, 1)).max())
    print('stride slope %.2f src px/frame -> %.1f px/cycle' % (slope, 16 * slope))
    print('lead-foot residual (px):', np.round(res).astype(int).tolist(), 'max', np.abs(res).max().round(1))
    print('foot slide after correction: max %.1f rms %.1f (sheet px; x display scale ~0.46)' % (np.abs(res + dxs).max(), np.sqrt(((res + dxs) ** 2).mean())))

    frames = [place(pool[i], float(dxs[n])) for n, i in enumerate(chosen)]
    feet = []
    for n, i in enumerate(chosen):
        m = pool[i]['m']
        sh = [s for s in m['shoes'] if s['area'] > 900]
        fs = [{'x': round(s['cx'] - m['body_x'] + float(dxs[n]), 1), 'lift': int(max(0, m['sole_y'] - s['sole']))} for s in sh]
        if len(fs) == 1:
            fs = [fs[0], dict(fs[0])]
        fs.sort(key=lambda f: f['x'])
        feet.append(fs[:2])

    # idle frame: same head size as the walk frames, torso centred, soles on the ground line
    idle = load_rgba(D + 'idle-take1.png')
    ia = np.array(idle)[:, :, 3] > 24
    ys, xs2 = np.where(ia)
    idle = idle.crop((xs2.min(), ys.min(), xs2.max() + 1, ys.max() + 1))
    # a standing pose is a little taller than a mid-stride one: 3% over the walk frames' mean height, so stopping doesn't pop
    f = (np.mean([pool[i]['m']['h'] for i in chosen]) * 1.03) / idle.height
    idle = idle.resize((int(round(idle.width * f)), int(round(idle.height * f))), Image.LANCZOS)
    iarr = np.array(idle)
    h = iarr.shape[0]
    cm = cream_mask(iarr)[int(h * 0.12):int(h * 0.50)]
    yy, xx = np.where(cm)
    ibody = float(np.median(xx))
    idle_cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
    layer = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
    layer.paste(idle, (int(round(BODY_X - ibody)), BASE_Y - (h - 1)))
    idle_cell.alpha_composite(layer)
    oarr = np.array(idle_cell)
    sm = shoe_mask(oarr, BASE_Y - int(h * 0.32), BASE_Y + 1, 0, CELL_W)
    lab, n = ndi.label(ndi.binary_dilation(sm, iterations=2))
    ifeet = []
    for kk in range(1, n + 1):
        yy, xx = np.where((lab == kk) & sm)
        if len(xx) >= 250:
            ifeet.append({'x': round(float(xx.mean()) - BODY_X, 1), 'lift': 0})
    ifeet.sort(key=lambda t: t['x'])
    if len(ifeet) == 1:
        ifeet = [ifeet[0], dict(ifeet[0])]
    print('idle: scale %.3f height %d feet %s' % (f, h, ifeet))

    sheet = Image.new('RGBA', (CELL_W * 4, CELL_H * 5), (0, 0, 0, 0))
    for n, fr in enumerate(frames + [idle_cell]):
        sheet.paste(fr, ((n % 4) * CELL_W, (n // 4) * CELL_H))
    sheet.save(D + 'aspiring-actor-walk-v2-master-unsmoothed.png')
    heights = [int(pool[i]['m']['h']) for i in chosen]
    meta = {'cellW': CELL_W, 'cellH': CELL_H, 'baseY': BASE_Y, 'strideSource': round(16 * slope, 1),
            'feet': feet, 'idleFeet': ifeet[:2], 'dx': [round(float(d), 1) for d in dxs],
            'picks': [{'sheet': pool[i]['sheet'], 'idx': pool[i]['idx']} for i in chosen], 'heights': heights,
            'idleHeight': int(h)}
    json.dump(meta, open('walk-meta-v3.json', 'w'), indent=1)
    bg = Image.new('RGBA', sheet.size, (200, 200, 200, 255))
    bg.alpha_composite(sheet)
    bg.convert('RGB').resize((sheet.width // 2, sheet.height // 2), Image.LANCZOS).save(D + 'preview-walk-sheet-v3.png')
    print('heights', heights, 'mean %.0f' % np.mean(heights), '| sheet', sheet.size)


main()

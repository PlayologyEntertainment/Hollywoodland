"""Objective check for the walk cycle's upper body: head and belt path over the 16 loop frames.

A clean cycle has head top / belt row following a smooth two-bob curve (a cosine at 2x the loop frequency) with
sub-pixel residual, and identical belt/head pixels frame to frame.  Run: python measure_torso.py [master.png]
"""
import sys
import numpy as np
from PIL import Image
D = 'C:/Hollywoodland/art/generated/walk-cycle-v2/'
CW, CH = 448, 480
path = sys.argv[1] if len(sys.argv) > 1 else D + 'aspiring-actor-walk-v2-master.png'
sheet = np.array(Image.open(path).convert('RGBA')).astype(int)


def cell(n):
    return sheet[(n // 4) * CH:(n // 4 + 1) * CH, (n % 4) * CW:(n % 4 + 1) * CW]


head_top, head_x, belt_y = [], [], []
for n in range(16):
    c = cell(n)
    a = c[..., 3] > 128
    ys, xs = np.where(a)
    head_top.append(ys.min())
    hair = a & (c[..., 0] < 110) & (c[..., 0] > 40) & (c[..., 2] < 70) & (c[..., 0] - c[..., 2] > 15)
    hy, hx = np.where(hair[:120])
    head_x.append(hx.mean() if len(hx) else np.nan)
    trouser = a & (c[..., 0] < 105) & (c[..., 1] < 95) & (c[..., 2] < 90) & (abs(c[..., 0] - c[..., 1]) < 14)
    rows = trouser[:, 190:300].sum(axis=1)
    rows[:150] = 0
    belt_y.append(int(np.argmax(rows >= 24)))


def fit(series, name, unit='px'):
    s = np.array(series, float)
    k = np.arange(16)
    A = np.stack([np.ones(16), np.cos(np.pi * k / 4), np.sin(np.pi * k / 4), np.cos(np.pi * k / 8), np.sin(np.pi * k / 8)], 1)
    coef, *_ = np.linalg.lstsq(A, s, rcond=None)
    res = s - A @ coef
    d = np.abs(np.diff(np.append(s, s[0])))
    print(f'{name:9s} range {s.max() - s.min():5.1f}  frame-to-frame max {d.max():4.1f}  residual from smooth curve: max {np.abs(res).max():4.1f} rms {np.sqrt((res ** 2).mean()):4.1f}')
    return res


fit(head_top, 'head top')
fit(head_x, 'head x')
fit(belt_y, 'belt row')
print('head top', head_top)
print('belt row', belt_y)

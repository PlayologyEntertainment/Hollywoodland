"""Composite the ornate Monarch sign into the closed and open Monarch gate modules.

Inputs (this folder):  ref-crop.png / ref-crop.json (the arch crop that was sent for editing), edit-take<TAKE>.png (the edit),
                       panel-mask-module.png (the curved panel's silhouette in module pixels), originals/*.webp
Outputs:               public/assets/environments/boulevard-v3/buildings/monarch-gate.webp and monarch-gate-active.webp

Only the panel's own silhouette (shrunk 1 px, feathered 1.2 px, and limited to where the edit itself has panel) is replaced, so the stucco arch, pylons, ornaments and keystone
stay pixel-identical. The edit registers with the original exactly (0 px shift; the panel bounding boxes match), so no
alignment is needed. Needs numpy, pillow, scipy.
"""
import json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

TAKE = 1        # which generated take to composite (1 or 2); the owner chose take 1
D = 'C:/Hollywoodland/art/generated/monarch-sign/'
B = 'C:/Hollywoodland/public/assets/environments/boulevard-v3/buildings/'
box = json.load(open(D + 'ref-crop.json'))['box']
mask = np.array(Image.open(D + 'panel-mask-module.png')) > 127
cw, ch = box[2] - box[0], box[3] - box[1]
edit = np.array(Image.open(D + f'edit-take{TAKE}.png').convert('RGB').resize((cw, ch), Image.LANCZOS)).astype(float)
pm = mask[box[1]:box[3], box[0]:box[2]]
# The edit re-draws the panel border slightly differently (take 1's is up to ~3% smaller), so where the original panel has
# border that the edit does not, keep the original: composite only inside the edit's own panel silhouette, else its light
# stucco would show as a pale line under the border.
lum = 0.3 * edit[..., 0] + 0.59 * edit[..., 1] + 0.11 * edit[..., 2]
edit_panel = ndi.binary_fill_holes(ndi.binary_closing((lum < 125) & ndi.binary_dilation(pm, iterations=3), iterations=2))
use = pm & ndi.binary_dilation(edit_panel, iterations=1)
soft = ndi.gaussian_filter(ndi.binary_erosion(use, iterations=1).astype(float), 1.2)
for name in ('monarch-gate.webp', 'monarch-gate-active.webp'):
    arr = np.array(Image.open(D + 'originals/' + name).convert('RGBA')).astype(float)
    region = arr[box[1]:box[3], box[0]:box[2], :3]
    arr[box[1]:box[3], box[0]:box[2], :3] = region * (1 - soft[..., None]) + edit * soft[..., None]
    Image.fromarray(np.rint(arr).astype(np.uint8), 'RGBA').save(B + name, quality=90, alpha_quality=100, method=6)
    print('wrote', name)

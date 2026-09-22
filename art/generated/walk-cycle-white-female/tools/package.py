"""Encode the master sheet to WebP and write walk-cycle.json, the contact sheet and the preview GIF."""
import sys; sys.path.insert(0, '.')
from PIL import Image, ImageDraw
import json, os, numpy as np
D = 'C:/Hollywoodland/art/generated/walk-cycle-white-female/'
meta = json.load(open(D + 'walk-meta.json'))
sheet = Image.open(D + 'white-female-walk-master.png').convert('RGBA')
a = np.array(sheet); al = a[..., 3]; al[al >= 250] = 255; al[al <= 3] = 0; a[..., 3] = al
Image.fromarray(a, 'RGBA').save(D + 'white-female-walk.webp', quality=90, alpha_quality=100, method=6)
heights = meta['heights']
# 202.4 (482 source px x 0.42 display scale): the same on-screen figure height the male character targets, so
# every character stands the same height in the world regardless of their own source art's scale.
scale = round(202.4 / (sum(heights) / len(heights)), 3)
cfg = {'sheet': 'assets/characters/player/white-female-walk.webp', 'columns': 4, 'frameWidth': meta['cellW'], 'frameHeight': meta['cellH'],
       'frameCount': 16, 'idleFrame': 16, 'displayScale': scale, 'soleY': meta['baseY'] + 1,
       'strideWorld': round(meta['strideSource'] * scale, 1), 'feet': meta['feet'], 'idleFeet': meta['idleFeet']}
json.dump(cfg, open(D + 'walk-cycle-white-female.json', 'w'), indent=2)
json.dump(meta, open(D + 'walk-meta.json', 'w'), indent=1)
CW, CH = cfg['frameWidth'], cfg['frameHeight']
def cell(n): return sheet.crop(((n % 4) * CW, (n // 4) * CH, (n % 4 + 1) * CW, (n // 4 + 1) * CH))
bg = Image.new('RGBA', sheet.size, (200, 200, 200, 255)); bg.alpha_composite(sheet)
d = ImageDraw.Draw(bg)
for n in range(17): d.text(((n % 4) * CW + 8, (n // 4) * CH + 6), str(n + 1) + (' idle' if n == 16 else ''), fill=(60, 60, 60, 255))
bg.convert('RGB').resize((sheet.width // 2, sheet.height // 2), Image.LANCZOS).save(D + 'review-contact-sheet.png')
slope = meta['strideSource'] / 16; S = 0.6; W, H = 640, 300
frames = []
for t in range(32):
    im = Image.new('RGB', (W, H), (226, 204, 164)); dr = ImageDraw.Draw(im)
    dr.rectangle((0, int(H * .86), W, H), fill=(190, 160, 118))
    off = (t * slope * S) % 60
    for x in range(-60, W + 60, 60): dr.line((x - off, int(H * .86), x - off - 14, H), fill=(120, 96, 66), width=2)
    c = cell(t % 16).resize((int(CW * S), int(CH * S)), Image.LANCZOS)
    im.paste(c, (W // 2 - c.width // 2, int(H * .86) - int(cfg['soleY'] * S) + 2), c)
    frames.append(im.convert('P', palette=Image.ADAPTIVE, colors=128))
frames[0].save(D + 'review-walk-preview.gif', save_all=True, append_images=frames[1:], duration=36, loop=0, disposal=2)
print('webp %d bytes; scale %s; strideWorld %s; %.2f cycles/s and %.1f frame changes/s at 390 px/s' % (
    os.path.getsize(D + 'white-female-walk.webp'), scale, cfg['strideWorld'], 390 / cfg['strideWorld'], 16 * 390 / cfg['strideWorld']))

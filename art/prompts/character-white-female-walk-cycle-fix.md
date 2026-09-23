# White-female walk cycle: pipeline bug fix (2026-09-23)

Status: **fixed locally in `art/generated/walk-cycle-white-female/`, not yet promoted to `public/`.**

## The complaint

The owner flagged two visible problems with the committed white-female walk cycle
(`public/assets/characters/player/white-female-walk.webp` + `public/data/walk-cycle-white-female.json`):

1. Head size shifts between frames.
2. Art/texture issues with her clothing.

## What was actually wrong

Before regenerating any new AI art, the raw generated take sheets
(`half-A-take1-clean.png` etc.) were checked and are clean -- consistent head size, a
crisp thin belt, no texture noise. Both defects turned out to be bugs in the local
Python compositing pipeline (`tools/build_sheet.py`, `tools/rig_arms.py`), not the
generation:

1. **Idle-frame scale.** `build_sheet.py` scaled the idle frame to match the walk
   frames' *head pixel size* rather than their *total figure height*. Her walk
   half-sheets and her idle reference were drawn with different head-to-height ratios
   (22-23% vs 19.3%), so matching head size alone left the idle figure's whole body
   about 13% taller than every walk frame (432px vs 374-384px, measured on the
   committed sheet). Since the sprite is anchored at the soles, that stretch reads as
   the head popping bigger and higher every time she starts or stops walking -- the
   "head size shifts" complaint. Fixed by matching total height instead (see the
   comment in `build_sheet.py`); the idle frame now measures 374px, in range with the
   walk frames.
2. **Torso repaint (the belt).** `rig_arms.py` erases the AI-drawn arm in every loop
   frame and repaints a rigged pendulum arm on top; whatever the erase exposed under
   the old arm gets patched back in. Its patch logic had two bugs: the "is this a
   real hole in the clothes" test only checked whether the target pixel was *near*
   surviving body pixels, not whether the original drawing actually had cloth there,
   so it painted a trouser-coloured flap into open air next to her leg on some
   frames; and the same check didn't exclude the erased arm's own bulk, so a later
   texture patch (see next point) could paint clean fabric across the whole
   former-sleeve shape instead of just the small real gap. Fixed by bounding the
   patchable hole to the erase margin (`erased & ~removed`, matching the belt/trouser
   *restore* step already next to it) intersected with where the original,
   undamaged frame had solid content (`orig[..., 3] > 200`).
3. **Flat, texture-less patch fill.** Where a real gap remains, the code fell back to
   one flat median colour per garment zone (blouse/belt/trousers), which read as an
   undifferentiated smear with no buckle or fold shading. Added a texture-donor step
   before that fallback: real pixels are copied from the idle frame's own torso
   (whose arm never covers the belt), aligned by each frame's own torso reference, so
   a genuine hole gets the belt buckle and fold shading back instead of a flat patch.
   The donor's own arm/hand pixels are excluded from what can be copied (an earlier
   version of this fix pasted a band of skin tone across the waist by accident).

## What changed

- `art/generated/walk-cycle-white-female/tools/build_sheet.py` -- idle scaled to the
  walk frames' mean total height instead of matching head pixel size.
- `art/generated/walk-cycle-white-female/tools/rig_arms.py` -- `rebuild_torso`'s hole
  detection tightened to erase-margin-with-real-content only, plus a donor-copy pass
  from the idle frame before the flat-fill fallback.
- Re-ran the existing pipeline (`build_sheet.py` -> `smooth_upper_body.py` ->
  `rig_arms.py` -> `package.py`) on the *same* already-generated take sheets and the
  *same* frame picks (verified identical in `walk-meta.json`'s `picks`/`feet`/`dx` --
  only the idle foot position shifted slightly, from the idle rescale). No new AI
  generation was used; `strideWorld` and `displayScale` are unchanged, so gameplay
  timing is unaffected.
- Regenerated `white-female-walk-master.png`, `white-female-walk.webp`,
  `walk-cycle-white-female.json`, `walk-meta.json`, `review-contact-sheet.png`,
  `review-walk-preview.gif` in `art/generated/walk-cycle-white-female/` (not yet
  copied over `public/`).

## Known remaining minor issues

- A handful of single-pixel dark specks remain floating near a few frames' hands
  (pre-existing, not introduced by this fix; sub-pixel at gameplay scale).
- One frame (loop frame 4) still shows a faint, slightly-flatter patch above the belt
  on her far side; far smaller and less visible than the original defect, not chased
  further.

## Promotion

Not yet done. Review `art/generated/walk-cycle-white-female/review-contact-sheet.png`
and `review-walk-preview.gif`, then copy
`white-female-walk.webp` -> `public/assets/characters/player/white-female-walk.webp`
and `walk-cycle-white-female.json` -> `public/data/walk-cycle-white-female.json`.

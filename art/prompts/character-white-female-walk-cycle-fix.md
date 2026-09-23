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

## Round 2 (2026-09-23): head still popped, shirt still had gaps

After round 1 was promoted and checked in the running game, the owner reported it was
better but still not right: the head still grows going from standing to walking, parts
of the shirt were still missing, and frame-to-frame continuity still looked off.

Two further root causes, both requiring a bigger change than another patch:

1. **The idle/walk head-size trade-off was never actually solvable by choosing one
   matching strategy.** Round 1 matched idle to the walk frames' *total height*, which
   fixed the body-size pop but left idle's head about 13-16% *smaller* than the walk
   frames' (their head-to-height ratios genuinely differ in the source art -- 22-23%
   walk vs 19.3% idle). A single uniform scale factor cannot satisfy both constraints
   on two images with different proportions. Fixed with `rescale_head()` in
   `build_sheet.py`: after scaling idle to match total height (body correct), a
   *second*, local, anchored-at-the-collar warp grows just the head+neck region by the
   remaining factor needed to also match the walk frames' head pixel size -- the same
   per-row weighted-warp technique `smooth_upper_body.py` already uses for the
   shoulder bob, applied to a local scale instead of a shift. Verified: every one of
   the 17 frames (16 loop + idle) now measures 83-86px head height and 374-386px total
   height, both within the walk loop's own natural frame-to-frame bob range.
2. **`rig_arms.py`'s erase-and-repaint approach was the source of the missing shirt and
   continuity complaints, even after round 1's fixes to it.** Checked directly:
   `white-female-walk-master-smoothed.png` (the file this script reads, i.e. the AI's
   own arms, before any erasing) has no torso damage in any frame and the arms swing
   naturally pose to pose -- unlike the male character's original art, which is what
   motivated writing an arm-rigging step in the first place (see
   `docs/dev/...aspiring-actor...` / the male pipeline's own `rig_arms.py`). Her
   drawn arms simply didn't need replacing. The build no longer runs `rig_arms.py`;
   `white-female-walk-master-smoothed.png` is copied straight through as the final
   master. The script is kept in `tools/` for reference (see the status note at its
   top) in case a future take-sheet regeneration reintroduces jittery arms.

Result verified on the contact sheet: belt and blouse intact and consistent on every
frame, head and body size both steady across the whole sheet including idle.

## Known remaining minor issues

- A handful of single-pixel dark specks remain floating near a few frames' hands
  (pre-existing in the source art, not introduced by either round of fixes; sub-pixel
  at gameplay scale).

## Promotion

Done (both rounds) -- copied over
`public/assets/characters/player/white-female-walk.webp` and
`public/data/walk-cycle-white-female.json`.

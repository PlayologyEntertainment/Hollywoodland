# Character brief: Aspiring Actor (male), walk cycle v2

Status: **approved and promoted by the owner 2026-09-20.** `public/assets/characters/aspiring-actor-walk.webp` and `public/data/walk-cycle.json` are the v2 files. The original 8-frame sheet is in git history (commit before this branch).

## Why a re-render

Three problems with the original sheet (`public/assets/characters/aspiring-actor-walk.webp`, 8 frames, 1536x1024, 384x512 cells, played at 11 fps):

1. **Choppy and lopsided.** Only 8 frames, and 6 of the 8 show the same leg in front, so the loop had no left/right alternation.
2. **Slid across the street.** Measured from the sheet: the feet are at most about 150 px apart, so about 63 display px at scale 0.42, and the body covered 283 px per loop (390 px/s over 8 frames at 11 fps). The feet covered a fraction of that.
3. **The shadow was a flat 112x22 ellipse** that ignored the animation.

## What v2 is

- **16 loop frames** (8 per step, left and right) plus **1 dedicated idle frame**, laid out 4 columns x 5 rows, 448x480 px cells, 1792x2400 px sheet. Figure about 440 px tall (old: 482 px), so about 2.2x oversampled at the on-screen size.
- Frames are ordered as a cycle: contact, recoil, low point, mid-stance, passing, rising, high point, reach; then the same eight for the other leg. Frame 16 flows into frame 1.
- **Distance-driven**: the frame shown depends only on how far the character has walked. `strideWorld` in the config (223.5 world px per loop) is the ground the feet cover in one loop, so the planted foot stays on the street at any walk speed.
- **Footprint shadow**: two shoe prints follow each drawn foot through the cycle (a lifted foot's print shrinks and fades), plus a faint torso contact shadow. Foot positions are measured from the finished frames and stored in the config.
- Data ships beside the sheet in `data/walk-cycle.json` (validated in `src/game/WalkCycle.ts`), so promoting the art is a two-file swap with no code change.

## Character brief (unchanged design)

Same character as the original sheet: young man, dark wavy hair, friendly smile, cream rolled-sleeve shirt, brown suspenders, grey pinstripe cuffed trousers, brown leather shoes. Style match: bold clean outlines, flat cel color with soft painted shading, 1930s hand-drawn animation look. Transparent background, no outer glow, no ground shadow (see the standing rules).

**Proportions, measured on the original sheet:** head plus neck about 20.7% of figure height, head width about 16.6%. Early rounds drifted to 23-25% and 21-22%; the accepted frames measure 20-21% and 17%.

## Prompts

Round 3 (the one used). The full text is in `art/generated/walk-cycle-v2/prompt-half-v3-A.txt` and `prompt-half-v3-B.txt` (they share `prompt-half-v3-common.txt`), and `prompt-idle.txt`. Key points of the common prompt:

- A 4-column x 2-row sheet of one full step (8 frames), one figure per cell, same scale and ground line in every cell, hips fixed at the cell centre (walk in place), strict side profile facing right.
- A pose table giving each frame's foot positions in units from the hips (0 under the hips, +50 far ahead, -50 far behind), for the lead foot and the swing foot, with the swing foot moving steadily forward and never backward. Step B repeats it with the legs and arms exchanged.
- An explicit proportions paragraph (tall and lean, about 7.5 heads, head plus neck about 20% of height, compact hair, long legs) and a reference image with the correct proportions.
- Fully transparent background, crisp outline, no glow, no halo, no drop or ground shadow.

Generated with `--size 1536x1024 --quality high --background transparent`. References: `ref-character.png` (two frames of the original sheet on white) and `idle-take1.png` (proportion and scale reference).

## Production record

Rounds, in order (files for rounds 1-2 were discarded; they were not used):

| Round | What | Result |
|---|---|---|
| 1 | One 4x4 sheet of 16 frames, 2 takes | Poses and layout good, but the backend caps output near 1.57 MP, so figures came out only about 290 px tall. One take had whole rows facing left |
| 2 | Two half-sheets (4x2) using round 1 as a pose guide, then a v2 prompt with the foot-position table, 2 takes each | Right resolution, but the character's head and hair drifted about 15% too large (head plus neck 23-25% of height) and the swing foot was unevenly timed |
| 3 | Same prompt plus the proportions paragraph and the correctly proportioned idle as reference, 2 takes each of step A and B | Proportions match the original. Used |

Also: one standing idle frame (`idle-take1.png`, 1 take).

Frame selection: the four round-3 half-sheets give 32 candidate frames. `tools/build_sheet.py` measures each frame (shoe positions and lifts, head size), scales every frame so head size is identical, then picks the 16 that best fit an even foot-position table with an assignment solver. Which source frame is in each slot is in `walk-cycle-build-record.json` (`picks`, 1-based slot order).

Foot planting: the stance foot's position is fitted to a straight line at the common stride. Each frame is shifted horizontally to sit on that line, with the correction shared with the torso so the body does not lurch. Result after correction: the planted foot slips at most 14.8 sheet px (6.8 display px, 2.6 display px rms); the body moves at most 12.8 sheet px (5.9 display px) between adjacent frames.

```text
asset_id: aspiring_actor_walk_v2
asset_type: character walk-cycle sprite sheet, 16 loop frames plus idle, transparent background
prompt_or_brief: this file; art/generated/walk-cycle-v2/prompt-half-v3-*.txt and prompt-idle.txt
reference_asset_ids: aspiring_actor_walk (original sheet, frames 1 and 4), aspiring_actor_idle_take1 (proportion reference)
generation_tool_and_version: gpt-image-2 via gg-image (Codex ChatGPT backend), --background transparent, --quality high; local selection, scale normalisation and packing with art/generated/walk-cycle-v2/tools/
generation_date: 2026-09-20
raw_source_location: art/generated/walk-cycle-v2/half-v3-{A,B}-take{1,2}.png and idle-take1.png
human_edits: none to the drawings. Deterministic processing only: frame selection, uniform scaling of each frame so head size matches, horizontal shifts for foot planting, idle frame scaled to 103% of the walk frames' mean height, alpha >= 250 set to 255 and alpha <= 3 set to 0
master_file: art/generated/walk-cycle-v2/aspiring-actor-walk-v2-master.png (lossless)
review_status: approved by the owner 2026-09-20
rights_or_license_notes: project-owned development generation; human rights/provenance review required
runtime_files: public/assets/characters/aspiring-actor-walk.webp (1792x2400 RGBA, lossy quality 90, alpha_quality 100) and public/data/walk-cycle.json
```

## Review files

- `art/generated/walk-cycle-v2/review-contact-sheet.png`: all 17 frames on grey, numbered.
- `art/generated/walk-cycle-v2/review-walk-preview.gif`: two loops of the cycle at the in-game rate, over a street scrolling at the walking speed.

## Known issues for the reviewer

- **The two steps are near-duplicates in silhouette.** In a side view a left step and a right step look almost identical, so frames 9-16 are 8 distinct drawings, but they read as the same poses. Which leg is nearer the camera cannot be told apart at game size.
- **Swing-leg timing is only approximately even.** The candidate pool did not contain a clean frame for every slot, so in steps 6 and 7 of each half the swinging foot gets ahead of an ideal even progression. The planted foot, which is what causes visible sliding, is fitted closely.
- **The body wobbles slightly** (up to about 6 display px between frames) because foot planting was shared with the torso.
- **28 frame changes per second at 390 px/s** (about 1.74 loops per second). On a 60 Hz display each frame is held 2 or 3 refreshes, so the frame rhythm is uneven. Lowering `WALK_SPEED` slows the cadence without reintroducing sliding, because the animation follows distance.
- **Stopping snaps to the idle frame** (as the old code did); there is no ease-out.
- The idle frame's shoes are a single merged print (the near foot covers the far one), so the standing shadow is one print, not two.

## Promotion (2026-09-20)

The two staged files were copied over `public/assets/characters/aspiring-actor-walk.webp` and `public/data/walk-cycle.json`. The character-creator portrait reads the same config and shows the idle frame.

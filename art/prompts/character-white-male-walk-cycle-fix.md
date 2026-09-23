# White-male (shared placeholder) walk cycle: same pipeline fixes (2026-09-23)

Status: **fixed locally in `art/generated/walk-cycle-v2/`, promoted to `public/`.**

Companion to `character-white-female-walk-cycle-fix.md` -- same class of fixes, applied to
`art/generated/walk-cycle-v2/` (the shared placeholder cycle used by `white-male`, and by
`asian-male`/`black-male`/`asian-female`/`black-female` until they get their own dedicated
cycles; only `white-male` currently has `hasInGameArt: true`, so he's the only one of the five
actually selectable in-game today).

The owner had not flagged specific defects on this character the way they had on white-female,
but asked for the same round-2 fixes to be applied here too. Findings:

1. **Idle/walk head-size mismatch, smaller than white-female's but present.** This pipeline's
   `build_sheet.py` already matched idle to the walk frames by *total height* (with a deliberate
   +3% "a standing pose reads a little taller" factor) rather than by head pixel size -- the
   correct strategy, already in place here. But idle's own head-to-height ratio still isn't
   exactly the walk frames', leaving idle's head about 88px vs the walk frames' target 91.3px (a
   ~4% mismatch, well under white-female's original ~13-16%). Ported the same `rescale_head()`
   local, collar-anchored warp from the female pipeline to close this too, for consistency.
2. **Arm rigging: checked, not clearly needed either.** This character's `rig_arms.py` exists for
   a real, documented reason (the round-1/2 take sheets had the same arm pose repeated every
   frame with the hand wandering up to ~50px) -- unlike white-female, where no such problem was
   ever recorded. Checked the *current* take sheets' raw arms directly (in
   `aspiring-actor-walk-v2-master-smoothed.png`, i.e. before `rig_arms.py` ever touches them):
   they vary naturally frame to frame with no torso damage, and reviewing the full contact sheet
   shows no visible head or arm popping anywhere in the 17 frames, idle included. The round-3
   pose-table prompt this character's take sheets were generated from (see
   `character-aspiring-actor-walk-cycle-v2.md`) appears to have already fixed the jitter problem
   upstream of `rig_arms.py`, the same way it turned out to be unnecessary for white-female. The
   build now skips it here too, copying the smoothed master straight through.

**Lower confidence than the female round**: the female fixes were driven by a specific, verified
owner complaint (head pop, missing shirt, bad continuity) checked before and after. This male
round is inferring "same class of defect, smaller in degree" from measurement and a visual
contact-sheet review only, since the owner hadn't flagged concrete symptoms here. If dropping
`rig_arms.py` turns out to look worse in motion (mechanical arms were the reason it was written
in the first place), reverting is a one-line pipeline change: run `rig_arms.py` and copy its
output over the smoothed master instead. The script itself is untouched other than a status note
at its top.

## What changed

- `art/generated/walk-cycle-v2/tools/build_sheet.py` -- added `rescale_head()`, applied to the
  idle frame after its existing total-height match.
- `art/generated/walk-cycle-v2/tools/rig_arms.py` -- marked unused at the top (kept for
  reference); no longer run.
- Reran the pipeline (`build_sheet.py` -> `smooth_upper_body.py` -> skip `rig_arms.py` ->
  `package.py`) on the same take sheets and same frame picks (verified identical against the
  previously committed `walk-cycle-build-record.json`) -- no new AI generation, `strideWorld`/
  `displayScale`/`feet` all unchanged, only pixel content and the idle scale changed.
- Verified all 17 frames on `review-contact-sheet.png`: no head/body size pop, suspenders and
  shirt intact and consistent throughout.
- Promoted `public/assets/characters/aspiring-actor-walk.webp`; `public/data/walk-cycle.json` was
  byte-identical to the regenerated one, so it didn't need re-copying.

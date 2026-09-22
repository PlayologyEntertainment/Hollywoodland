# The Walk-Cycle Director tool (planned)

> **Status: design plan only, nothing built yet.** This doc is the spec that
> implementation will follow, written up before any tool code so the shape
> of the thing can be reviewed first. It replaces one-prompt-at-a-time JSON
> edits with a visual tool for building and fixing a character's walk cycle.
> See the bottom of this doc for the phased build plan; treat everything
> above that as the target shape, not a changelog of what exists.

## Why this exists

The player's walk cycle is the most important animation in the game, and the
current workflow doesn't give enough control to fix it: alignment/jitter
problems in the committed `white-female` cycle (`public/data/walk-cycle-white-female.json` +
`public/assets/characters/player/white-female-walk.webp`) have to be chased
by re-running the offline Python pipeline and hand-editing numbers in JSON,
one guess at a time. This tool is meant to make every frame visible, playable
at true gameplay speed, and directly draggable into alignment — the same
"see it, drag it, save it" workflow `public/tools/art-director/index.html`
already gives the Boulevard scene's art and layout (see
`docs/dev/boulevard-art-director-tool.md`), applied to walk-cycle timing and
per-frame placement instead.

It is a **new, standalone** tool (`public/tools/walk-cycle-director/index.html`),
not a mode bolted onto the existing Art Director tool — walk-cycle editing
(a frame filmstrip, onion-skinning, foot rigs, full-speed playback) is a
different enough interaction model that sharing one page would mean sharing
little beyond folder-picker/save plumbing.

## What already exists that this tool builds on

- **Runtime schema + math** — `src/game/WalkCycle.ts` (pure TS, no Phaser):
  the `WalkCycle`/`WalkFoot` types, the `isWalkCycle` structural validator,
  `walkFrameAt`/`distanceForFrame` (the cycle is **distance-driven, not
  time-driven** — the frame shown is a function of ground covered, which is
  what keeps a planted foot fixed to the street at any walk speed),
  `footprintsForFrame`, and `frameBackground`. `tests/walk-cycle.test.ts`
  keeps `DEFAULT_WALK_CYCLE` identical to the committed JSON.
- **Runtime rendering** — `src/game/scenes/BoulevardSpikeScene.ts`: loads the
  sheet as a Phaser spritesheet, anchors the sprite at
  `(0.5, cycle.soleY / cycle.frameHeight)`, walks at `WALK_SPEED = 390` px/s
  (× `0.78` for reduced motion), and draws footprint decals from
  `footprintsForFrame` with its own fixed length/depth/color/alpha falloffs.
- **Character roster** — `src/domain/PlayerCharacters.ts`: 6
  `PlayerCharacterId`s. 5 of them (`white-male`, `asian-male`, `black-male`,
  `asian-female`, `black-female`) still share the original placeholder
  `data/walk-cycle.json`; only `white-female` has her own
  `data/walk-cycle-white-female.json`.
- **The existing offline pipeline** — per character, under
  `art/generated/walk-cycle-<name>/tools/` (`walktools.py`, `build_sheet.py`,
  `arm_parts.py`, `rig_arms.py`, `smooth_upper_body.py`, `package.py`): raw
  AI-generated multi-pose "take" sheets (e.g. `half-A-take1.png`, each a 4×2
  grid of candidate poses) are measured (torso/shoe detection via color
  masks), automatically best-fit assigned to the 16 walk slots
  (`scipy.optimize.linear_sum_assignment` against an ideal foot-spread
  curve), corrected with a solved per-frame `dx` that locks the stance foot
  to the street while sharing residual error with torso movement, composited
  onto a master sheet, arm-rigged and upper-body smoothed, then WebP-encoded
  and written out by `package.py`. This tool does **not** replace that whole
  pipeline (see *What stays out of scope*) — it replaces the manual,
  imprecise part of it: picking which pose goes where, and fine-tuning how
  it sits.
- **Tool conventions** — `public/tools/art-director/index.html`: a single
  vanilla-JS file, no build step, the File System Access API
  (`showDirectoryPicker({mode:'readwrite'})` — Chromium-only, needs the Vite
  dev server; `file://` mostly doesn't support it), the folder handle
  remembered in IndexedDB, mode-switch header buttons, a sidebar list +
  detail-panel layout, an explicit **Save to project** button (nothing
  touches disk before it), and a resizable iframe preview pane. Saves take
  effect on next load/refresh, not a hot reload — this tool follows the same
  rule.

## What stays out of scope

Arm-rigging and upper-body smoothing (`rig_arms.py`/`smooth_upper_body.py`)
stay separate, optional, offline pre-processing steps. They operate on
source pixels before a pose ever reaches this tool; the tool's own bake step
(below) only recomposites whichever pixels are assigned to each slot, so it
can't undo smoothing already baked into a take sheet. If a character's poses
still look rough after this tool's manual alignment, that's a sign to run
(or re-run) the Python smoothing step upstream, not something the tool
itself tries to fix.

## 1. Opening the tool

Same shape as Art Director: `npm run dev`, then visit
`http://localhost:5173/hollywoodland/tools/walk-cycle-director/index.html` in
a Chromium browser, click **Open Project Folder…**, and pick the repository
root. From there, a project picker lists the 6 characters with their current
`walkCycle` path:

- **Edit existing** (e.g. `white-female`) — loads her committed cycle.
- **Edit shared placeholder** — the 5 characters still on `data/walk-cycle.json`
  show a warning that saving here changes all 5 at once.
- **Branch a new cycle for `<character>`** — copies the shared placeholder as
  a starting point and will save to a new `data/walk-cycle-<id>.json` +
  webp of its own. This still needs a one-line manual follow-up in
  `src/domain/PlayerCharacters.ts` (pointing that character's `walkCycle`
  field at the new file) — the tool doesn't edit `.ts` source itself.
- **New cycle from scratch** — prompts for a name/slug and sheet geometry
  (prefilled with the shared 448×480 px / 4-column / 16-loop-frame + idle
  convention), and starts with every frame slot empty.

## 2. Loading an existing cycle

Opening a character with no prior tool session prefers, in order:
1. `art/generated/walk-cycle-<name>/walk-director-project.json` — the tool's
   own workbench file (see §7), if a previous session already created one.
2. `art/generated/walk-cycle-<name>/walk-meta.json` — the Python pipeline's
   bookkeeping (`picks`/`dx`/`feet`/`idleFeet`), imported once to prefill
   exactly which pose and offset produced each committed frame, rather than
   starting blind.
3. Just the committed `<name>-walk-master.png`, re-sliced by the current
   grid, with `feet` copied straight from the committed JSON and zero
   offsets.

Loading never blocks on missing bookkeeping — worst case, you're starting
from the plain committed sheet with no history.

## 3. The frame filmstrip and single-frame editor

The sidebar is a **filmstrip**: 17 thumbnails (the 16 loop frames plus the
idle frame), each live-cropped from the current in-memory composite, with a
status pill (empty / filled from the candidate pool / filled by direct
upload / locked). Frames can be drag-reordered within the loop (idle stays
pinned at the end), duplicated, or cleared.

Selecting a frame opens the **single-frame editor**:

- A zoomed canvas (fit / 100% / 200% / 400%).
- **Drag-to-nudge** — dragging the pose sets its `offset.dx`/`offset.dy`,
  mirrored by numeric X/Y fields (arrow keys move 1px, Shift+arrow 5px).
  This is the tool's answer to "move each frame around to align" — see §6
  for how the nudge gets baked into the exported sheet.
- **Onion-skinning** — a ghost overlay of the previous and/or next loop
  frame at adjustable opacity, for eyeballing stride spacing and vertical
  bob against its neighbors without leaving the frame.
- A **ground-line reference** drawn at the cycle's `soleY`/`baseY`.
- **Foot markers** — two draggable handles (rear, front, color-coded) bound
  to that frame's `feet[].x`/`.lift`, plus numeric fields for exact values.
  Dragging horizontally sets `x`; dragging vertically sets `lift` (0 =
  planted on the ground line).
- **Single-frame replacement** — drop one pose PNG directly onto the slot to
  swap its source image outright.

## 4. The candidate pool (uploading new poses)

A separate panel handles bringing in new art at scale, not just one frame at
a time:

- Upload one or more raw take sheets (multi-pose grids, matching the
  existing `half-A-take1.png`-style format; grid size is configurable,
  default 4×2). Each cell is sliced out and auto-measured (torso/shoe
  detection), with a live overlay marking what was detected so a bad read
  can be spotted and corrected by hand rather than trusted blindly.
- Every sliced pose becomes a reusable **candidate**: drag a candidate
  thumbnail onto any filmstrip slot to assign it there. The same candidate
  can fill more than one slot.
- This is the tool's interactive replacement for `build_sheet.py`'s
  automatic `linear_sum_assignment` step — you place poses by eye and by
  hand instead of trusting a cost function. An automatic "suggest an
  assignment" pass is possible later (see Phase 4) but isn't required.

## 5. Full-speed preview

A persistent preview pane plays the cycle using the game's own math
**ported verbatim** — `walkFrameAt`, `distanceForFrame`, `footprintsForFrame`,
`frameBackground`, and `BoulevardSpikeScene`'s exact footprint-decal
constants and falloffs — not a simplified stand-in, so what you see here is
what the game will actually show:

- A `requestAnimationFrame` loop accumulates `distance += speed * dt`, the
  same distance-driven model the scene itself uses.
- Speed presets tied to the real constants: **390 px/s** ("Real speed"),
  `× 0.78` (reduced motion), plus 0.25×/0.5×/2× and a free slider for
  slow-motion inspection.
- Play/Pause, frame-step forward/back (landing exactly on a frame boundary
  via `distanceForFrame`), a scrub timeline, a Walk↔Idle toggle that
  reproduces the real idle-entry behavior, a facing-flip toggle, and a
  footprint-decal overlay toggle. The loop always loops.
- Edits made in the single-frame editor apply live: a playing loop shows the
  change the next time it cycles past that frame, so you can nudge a frame
  while watching the walk run continuously — the core loop the tool exists
  for.

An embedded "open the real game" iframe sanity-check (like Art Director's
preview pane) is a later nice-to-have, not required for fidelity, since the
preview already runs the exact runtime math and constants.

## 6. Saving — the bake/export step

Nothing touches disk until **Save to project**. Saving:

1. **Validates** — warns (doesn't block) on incomplete slots; a genuinely
   empty `feet` array is valid per `isWalkCycle`, but a missing pose image
   in a loop slot prompts a confirmation listing the gaps.
2. **Composites** an offscreen canvas sized to the cycle's grid (the same
   row/column math `frameBackground` uses). Each slot's pose is drawn at
   `(bodyX + offset.dx − measuredBodyX, baseY − offset.dy − alphaBottom)`,
   rounded to whole pixels — this is where a drag nudge actually becomes a
   pixel position, matching how the existing Python pipeline's `dx`
   correction already works.
3. **Snaps alpha** the same way the Python pipeline's `package.py` does
   (fully opaque above 250, fully transparent at or below 3) before
   encoding, so edge pixels don't go semi-transparent and fuzzy.
4. **Encodes** the public sheet as WebP (`canvas.toBlob('image/webp', ~0.9)`)
   and also writes an uncompressed PNG master to `art/generated/` as a
   lossless backup to re-edit from later (re-opening a lossy WebP for
   further edits would compound alpha loss).
5. Offers a **Suggest** button for each cycle-level field (`soleY`,
   `displayScale`, `strideWorld`) computed from the measured data, but
   leaves them hand-editable rather than silently overwriting them — the
   committed white-female values show tuning beyond the raw formulas, and
   saving shouldn't quietly discard that.
6. Runs the ported `isWalkCycle` check on the assembled JSON before writing
   anything, and refuses to save with a clear error if it fails — the same
   "fall back safely rather than crash" property the game itself has for a
   bad walk-cycle file.

Save order is: the tool's own workbench JSON, then the master PNG, then the
WebP, then the runtime JSON — the binary before the file that references it.

## 7. What gets written, and where

| Path | What |
|---|---|
| `art/generated/walk-cycle-<name>/walk-director-project.json` | **New.** The tool's own workbench/source of truth: candidate pool references, per-slot assignment + offset + feet, and cycle geometry. Committed to git like everything else under `art/generated/`. |
| `art/generated/walk-cycle-<name>/<name>-walk-master-director.png` | The tool's composited master. Named distinctly from the Python pipeline's `<name>-walk-master.png` on purpose, so a `git diff` never silently swaps a hand-smoothed PNG for a browser-composited one under the same filename. |
| `public/assets/characters/player/<id>-walk.webp` | The exported sheet the game actually loads — unchanged path convention. |
| `public/data/walk-cycle[-<id>].json` | The exported cycle JSON — unchanged schema, validated with the same `isWalkCycle` the game uses. |

No changes to `src/game/WalkCycle.ts`, `src/game/scenes/BoulevardSpikeScene.ts`,
or the JSON schema — a frame nudge is a baked pixel offset, not a new
runtime concept.

## 8. Undo, backups, and git

- In-session **undo/redo** is a capped snapshot stack, pushed on every
  discrete edit (drag release, field blur, pool assignment, delete,
  reorder) — image data is referenced by id across snapshots, not
  duplicated.
- Each save writes a timestamped backup of the previous webp/JSON under
  `art/generated/walk-cycle-<name>/backups/` before overwriting, as cheap
  extra insurance.
- Durable history is still git's job, the same convention the Art Director
  tool relies on: commit before a big edit session, and `git diff`/
  `git checkout --` to back out a bad save.

## Known limitations

- **Chromium only** — the File System Access API isn't available in Firefox
  or Safari, and needs a secure context (`localhost` counts, `file://`
  mostly doesn't).
- **WebP encoding isn't pixel-identical to the Python pipeline's.**
  `canvas.toBlob('image/webp', quality)` exposes one quality knob; Pillow's
  `alpha_quality`/`method` settings have no browser equivalent. The alpha
  hard-threshold snap (§6.3) is fully portable and done ourselves; the rest
  isn't controllable from the Canvas API. If output quality ever regresses
  visibly, the escape hatch is exporting the master PNG from the tool and
  hand-running `package.py` for the final encode.
- **Auto-measurement is a hand-tuned heuristic, not a universal one.** The
  torso/shoe color detection (`cream_mask`/`shoe_mask` in the Python
  pipeline — note `cream_mask` is actually tuned to white-female's sky-blue
  blouse, not cream, under a name kept for pipeline-code continuity) is
  tuned per character's palette and won't generalize automatically to a new
  one. The candidate-pool browser exposes its detection thresholds as
  sliders with a live overlay for quick recalibration, and every measured
  value can be manually overridden, so a bad auto-read never blocks
  progress.
- **The character roster is duplicated, not imported.** With no build step,
  the tool can't `import` `PlayerCharacters.ts` directly, so its roster
  table and ported math (`walkFrameAt` etc.) are hand-copied and can drift
  from the real source files over time. A Vitest guard test is planned
  (Phase 5) to catch that drift.

## Phased build plan

Nothing below is built yet; phases are meant to ship independently, each one
usable on its own.

1. **Phase 0 — Foundations.** Port the pure math verbatim from
   `src/game/WalkCycle.ts` (with a comment pointing back at it); copy the
   File-System-Access/IndexedDB read-write helpers from
   `art-director/index.html`; build the roster table and page shell.
2. **Phase 1 — MVP.** Load an existing committed cycle (via `walk-meta.json`
   import or a master-PNG re-slice — no candidate pool yet); the filmstrip
   and single-frame editor (drag-nudge, numeric fields, zoom, ground-line);
   foot-marker handles; the full-speed preview pane (real-speed presets,
   loop, flip, footprint overlay); Save (bake, export, validate); basic
   undo/redo. This phase alone directly targets fixing the white-female
   jitter and proves out the whole bake pipeline before anything else is
   layered on.
3. **Phase 2 — Single-frame replacement & polish.** Upload-one-PNG-to-a-slot
   with auto-measurement; onion-skinning; duplicate/delete/reorder.
4. **Phase 3 — Candidate-pool workflow.** Take-sheet upload and slicing, the
   pool browser, drag-to-assign onto slots — this is what fully unlocks
   building a brand-new character's cycle from scratch, with no prior master
   sheet required.
5. **Phase 4 — Auto-suggest (nice-to-have).** Port the cost-based automatic
   slot assignment and the per-frame `dx` least-squares solve as optional
   one-click accelerators, distinct from (and never replacing) manual
   placement.
6. **Phase 5 — Polish.** An optional embedded "real game" preview iframe;
   in-tool regeneration of the review contact-sheet/preview-GIF the Python
   pipeline currently produces; the roster/math drift guard test.

Implementation starts at Phase 0 only once explicitly requested — this doc
is the plan, not a build in progress.

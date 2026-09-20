# Art brief: ornate Monarch Pictures arch sign

Status: **built and in the working tree for owner review; not committed.** Replaces the plain text that was drawn over the gate's blank arch panel.

## What it is

The Monarch Pictures gate module (`monarch-gate.webp` closed, `monarch-gate-active.webp` open) had a blank cream curved panel across its arch, with the words MONARCH PICTURES drawn over it in code as plain green text (`textOnly`). The panel is now a finished sign, painted into both modules: a deep emerald enamel field, raised gold-leaf Art Deco capitals reading MONARCH PICTURES on one line and following the panel's curve, gold filigree fans and scrolls at both ends, a fine gold double trim inside the original teal border, and small gold rivets at the ends.

## Method

- The curved panel's silhouette was traced in module pixels (498 x 145 px at `(561, 382)`), and a 545 x 192 crop of the arch around it was sent to gg-image as an **edit** with the panel's shape, position and border to be kept and everything outside it unchanged.
- Two takes; take 2 chosen (more level lettering, richer green). The edit registers with the original exactly: 0 px shift, panel bounding boxes identical, so no alignment was needed.
- Only the panel's own silhouette (shrunk 1 px, feathered 1.2 px) was composited back into the modules, so the stucco arch, pylons, ornaments and keystone are pixel-identical to the approved modules. The open-gate module's panel outline overlaps the closed one by 99.4%, and the same edit was composited into both, so the sign never changes when the gate opens.
- The lettering is now art, so the scene no longer draws it: `sign.painted: true` on the `backlot-gate` location in `data/boulevard-manifest.json` (an optional flag in `BoulevardSign`; `text` stays as the sign's name for the tools and tests). The art-director mockup skips the overlay for painted signs too.

## Prompt

`art/generated/monarch-sign/prompt-edit-r1.txt`. Key points: replace only the blank cream area inside the curved panel; keep its outer shape, position, size, curvature and teal border; emerald enamel field, raised gold Art Deco lettering reading exactly MONARCH PICTURES on one line, curving with the band and filling most of its height and width, filigree at the ends, gold double-line trim and rivets; everything outside the panel unchanged; no other text.

## Provenance record

```text
asset_id: boulevard_v3_monarch_gate_ornate_sign
asset_type: edit of two approved Plane 4 building modules (closed and open Monarch gate), sign panel only
prompt_or_brief: this file; art/generated/monarch-sign/prompt-edit-r1.txt
reference_asset_ids: boulevard_v3_monarch_gate_wide, boulevard_v3_monarch_gate_wide_active
generation_tool_and_version: gpt-image-2 via gg-image edit (Codex ChatGPT backend), --quality high; local mask tracing and compositing with art/generated/monarch-sign/tools/composite_sign.py
generation_date: 2026-09-20
raw_source_location: art/generated/monarch-sign/edit-take1.png and edit-take2.png (edits of ref-crop.png)
human_edits: none to the drawing. Deterministic processing only: crop, downscale of the edit from 2112 to 545 px wide, panel-silhouette composite with a 1 px inset and 1.2 px feather
originals: art/generated/monarch-sign/originals/monarch-gate.webp and monarch-gate-active.webp (the modules before this change)
review_status: pending owner review
rights_or_license_notes: project-owned development generation; human rights/provenance review required. The lettering is the studio name only.
runtime_files: public/assets/environments/boulevard-v3/buildings/monarch-gate.webp and monarch-gate-active.webp (2271 x 1113 RGBA, lossy quality 90, alpha_quality 100, same size and transform as before)
```

## Known issues for the reviewer

- The sign's lettering was drawn by the model, not typeset. It reads correctly and follows the curve, but its letter shapes are its own; a different take can be composited in with the same script.
- The new sign is much brighter and more detailed than the rest of the arch, by design, since it is the gate's headline; if it competes with the gate for attention it can be toned down.
- Because the text is now art, changing the sign's `text` in the art-director tool no longer changes what shows in the game.

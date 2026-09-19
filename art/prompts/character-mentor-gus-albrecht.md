# Character brief: Gus Albrecht (experienced extra / mentor)

Status: **Brief and round 2 source approved by the owner 2026-09-19; runtime portrait in place**

## Role in the game

- Slice-spec role: "Experienced extra/mentor" (`docs/VERTICAL_SLICE_SPEC.md` §2). Code id: `mentor-extra` (`src/domain/RelationshipDefinitions.ts`).
- Canon (`docs/DRAFT_TRACK_B_CANON_PROPOSAL.md` §2, still a draft): grizzled, twenty years of background work, knows every trick for surviving a set. Warm, funny, protective of newcomers who remind him of himself. Mentor/friendship only, the "found an ally on day one" relationship. Starting contact for the Small-Town Hopeful origin.

## Visual brief

- **Silhouette:** stocky, barrel-chested, low center of gravity. It must read as different from the lean, clipboard-holding coordinator and casting-manager references.
- **Face:** weathered and kind. Huge drooping salt-and-pepper walrus mustache, bushy eyebrows, big round nose, deep laugh lines, mid-chuckle.
- **Costume:** dented newsboy cap, patched tweed vest, collarless work shirt with rolled sleeves, faded costume-department neckerchief, baggy high-waisted wool trousers, mismatched suspenders, scuffed work boots. The costume-scrap neckerchief signals two decades of extra work.
- **Props:** dented tin lunch pail, blank folded call sheet in a back pocket (no writing).
- **Pose/expression:** relaxed hip lean, friendly "come on over, kid" beckon, warm knowing grin.
- **Palette:** warm olive, mustard, faded rust, worn brown, cream shirt.
- **Style:** match the existing `art/Hollywoodland_Character_*.png` sheets: 2:3 full-body figure, bold clean outlines, cel color with soft painted shading, exaggerated retro-cartoon anatomy. Round 1 sheets used a near-black background with an amber rim glow; from round 2 the character is a transparent-background cutout with no outer glow (see the round 2 prompt).
- **Constraints:** no baked text, no real-person likeness, single character only.

## Prompt

```text
Full-body character design illustration of Gus Albrecht, a veteran background extra and mentor character for a romanticized 1935 Hollywood storybook adventure game. Match the two reference images exactly in rendering style, line weight, framing and background treatment: bold clean dark outlines, flat cel colors with soft painted shading, exaggerated retro-cartoon anatomy and expression in the manner of 1930s hand-drawn animation, a single full-length figure centered on a near-black warm-brown background with a soft warm amber glow rim-lighting the silhouette, 2:3 portrait framing, head to shoes fully visible with a small margin all around. Character: a stocky, barrel-chested man in his mid-fifties with a low center of gravity, oversized weathered hands, a big round nose, a huge drooping salt-and-pepper walrus mustache, bushy expressive eyebrows and deep laugh lines. His rumpled, kind face is mid-chuckle with one eyebrow raised, warm and knowing. A dented, sweat-stained newsboy cap is pushed back on thinning grey hair. Outfit: an over-washed patched tweed vest over a collarless cream work shirt with the sleeves rolled, a faded costume-department neckerchief knotted at his throat, baggy high-waisted wool trousers held up by mismatched suspenders, and scuffed lace-up work boots with one lace undone. Props: a dented tin lunch pail hanging from one hand; the other hand raised in a friendly come-on-over-kid beckoning wave; a folded call sheet of blank paper tucked in his back pocket with no writing on it. Pose: relaxed, leaning slightly with his weight on one hip, generous and protective body language, a clearly different silhouette from the thin clipboard-holding figures in the references. Palette: warm olive, mustard, faded rust and worn brown with a cream shirt, no saturated modern colors. Constraints: no text, letters, numbers, logos, captions or signatures anywhere; no likeness of any real person; no other characters, scenery, floor, or props beyond those described; no white or checkerboard background; one character only.
```

## Prompt, round 2 (use for all future generations)

Owner-requested changes after round 1 review (2026-09-18): (1) output with an alpha channel and a transparent background; (2) no outer glow around the character. Nothing else about the design changed.

Generate with `--background transparent` (a real request parameter, not just prompt text), PNG output, then verify the file is RGBA with alpha 0 corners and alpha 255 inside the figure, and check for glow or halo pixels at 100% over black, white and saturated green. If the backend does not return true alpha, fall back to the Boulevard workflow in `art/prompts/boulevard-five-plane-v2.md`: render against flat `#ff00ff`, then remove it with `remove_chroma_key.py`, keeping the chroma master unchanged.

```text
Full-body character design illustration of Gus Albrecht, a veteran background extra and mentor character for a romanticized 1935 Hollywood storybook adventure game. Match the two reference images in rendering style, line weight and framing only: bold clean dark outlines, flat cel colors with soft painted shading, exaggerated retro-cartoon anatomy and expression in the manner of 1930s hand-drawn animation, a single full-length figure centered on a fully transparent background with true alpha transparency, 2:3 portrait framing, head to shoes fully visible with a small margin all around. The character is a clean isolated cutout: a crisp dark outline sits directly against transparency, with no outer glow, no halo, no aura, no rim-light bloom, no drop shadow, no ground shadow, no vignette and no background of any kind. Do not copy the dark background or the amber glow seen in the references. Character: a stocky, barrel-chested man in his mid-fifties with a low center of gravity, oversized weathered hands, a big round nose, a huge drooping salt-and-pepper walrus mustache, bushy expressive eyebrows and deep laugh lines. His rumpled, kind face is mid-chuckle with one eyebrow raised, warm and knowing. A dented, sweat-stained newsboy cap is pushed back on thinning grey hair. Outfit: an over-washed patched tweed vest over a collarless cream work shirt with the sleeves rolled, a faded costume-department neckerchief knotted at his throat, baggy high-waisted wool trousers held up by mismatched suspenders, and scuffed lace-up work boots with one lace undone. Props: a dented tin lunch pail hanging from one hand; the other hand raised in a friendly come-on-over-kid beckoning wave; a folded call sheet of blank paper tucked in his back pocket with no writing on it. Pose: relaxed, leaning slightly with his weight on one hip, generous and protective body language, a clearly different silhouette from the thin clipboard-holding figures in the references. Palette: warm olive, mustard, faded rust and worn brown with a cream shirt, no saturated modern colors. Constraints: no text, letters, numbers, logos, captions or signatures anywhere; no likeness of any real person; no other characters, scenery, floor, or props beyond those described; no painted background, no black, white or colored fill behind the figure, and no painted checkerboard; one character only.
```

The round 1 prompt above produced `art/generated/*.png` as they exist now (opaque near-black background with amber glow) and is kept so those files stay reproducible.

## Provenance record

```text
asset_id: character_mentor_gus_albrecht
asset_type: character full-body concept/source art
prompt_or_brief: this file (see Prompt above)
reference_asset_ids: Hollywoodland_Character_Production_Coordinator, Hollywoodland_Character_Casting_Manager
generation_tool_and_version: gpt-image-2 via gg-image (Codex ChatGPT backend)
generation_date: 2026-09-18
raw_source_location: art/generated/character-mentor-gus-albrecht.png
human_edits: none yet
review_status: superseded by round 2 (kept for reference)
rights_or_license_notes: project-owned development generation; human rights/provenance review required. Name and design match the canon approved 2026-09-18.
runtime_files: not yet promoted
```

## Generation notes (2026-09-18, first pass, single take)

Matches the brief: house style and framing, patched tweed vest, costume-scrap neckerchief, pushed-back newsboy cap, tin lunch pail, blank call sheet in the back pocket, one trailing bootlace, warm beckoning gesture, no baked text.

Flags for the reviewer:

- The build reads taller and lankier than "stocky, barrel-chested, low center of gravity". The wide-legged stance resembles the coordinator reference. Regenerate with an explicit shorter, wider build if the silhouette should contrast more.
- The walrus mustache is moderate rather than "huge, drooping".
- The lunch pail reads slightly like a small metal bucket.

## Round 2 generation (2026-09-18, single take)

```text
asset_id: character_mentor_gus_albrecht_r2
asset_type: character full-body source art, transparent-background cutout
prompt_or_brief: "Prompt, round 2" section of this file
reference_asset_ids: Hollywoodland_Character_Production_Coordinator, Hollywoodland_Character_Casting_Manager (style only)
generation_tool_and_version: gpt-image-2 via gg-image (Codex ChatGPT backend), --background transparent, --quality high, --size 1024x1536
generation_date: 2026-09-18
raw_source_location: art/generated/character-mentor-gus-albrecht-r2.png
human_edits: none yet
review_status: approved by the owner 2026-09-19
rights_or_license_notes: project-owned development generation; human rights/provenance review required. Name and design match the canon approved 2026-09-18.
runtime_files: public/assets/characters/mentor-extra.webp (see the cleanup and staging record below)
```

Verified after generation: RGBA PNG, 1024x1536, all four corners alpha 0, no glow or halo (pixels farther than ~7px from the figure have alpha <= 2 of 255), checked over saturated green. Owner viewed the files and approved the look (round 2 supersedes round 1 for these fixes; round 1 file kept for reference).

Technical notes for cleanup:

- Interior alpha is 253-254, not 255 (about 1% see-through). Normalize to 255 during cleanup if it shows over dark backgrounds.
- The figure sits within about 10-20px of the top and bottom edges, so crop or pad at promotion rather than assuming a wide margin.
- Design unchanged from round 1, so the round 1 flags for this character still apply: Gus's silhouette reads lankier than the intended stocky build.

## Cleanup and staging (2026-09-18)

```text
asset_id: mentor-extra_portrait
source_asset: art/generated/character-mentor-gus-albrecht-r2.png (raw, unchanged)
human_edits: deterministic alpha normalization only, done with a script and no repainting. Alpha >= 250 set to 255 (fully opaque interior); alpha <= 3 set to 0 (invisible stray specks); antialiased edge alpha 4-249 and all RGB left untouched.
cleaned_source: art/generated/character-mentor-gus-albrecht-r2-clean.png (lossless PNG)
runtime_files: public/assets/characters/mentor-extra.webp (1024x1536 RGBA, lossy quality 90, alpha_quality 100, same format and size as the other character portraits)
review_status: approved by the owner 2026-09-19; runtime file in place, not yet referenced by any scene
```

Verified from the encoded WebP: corners alpha 0, no glow or halo over black, white or saturated green, roughly 1.5% partial-alpha edge pixels.

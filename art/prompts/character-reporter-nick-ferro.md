# Character brief: Nick Ferro (reporter / gossip-adjacent)

Status: **Brief and round 2 source approved by the owner 2026-09-19; runtime portrait in place**

## Role in the game

- Slice-spec role: "Reporter, photographer, or gossip-adjacent character" (`docs/VERTICAL_SLICE_SPEC.md` §2). Code id: `reporter` (`src/domain/RelationshipDefinitions.ts`).
- Canon (`docs/DRAFT_TRACK_B_CANON_PROPOSAL.md` §2, still a draft): fast-talking stringer for the fictional tabloid *The Klieg Light*, always looking for a scoop, not malicious but transactional. Obligation/favor track: he trades information and exposure for tips. Mishandling him is the fastest way to a reputation hit. Starting contact for the Runaway Society Name origin.

## Visual brief

- **Silhouette:** tall, lean and angular, leaning forward mid-question. It must read as different from Gus Albrecht's stocky build and from the reference sheets' clipboard poses.
- **Face:** long and sharp. Pointed nose, quick sidelong smirk, one raised eyebrow, pencil-thin mustache, bright watchful eyes.
- **Costume:** battered fedora pushed back with a blank press card in the hatband, slightly rumpled slate-blue pinstripe suit, loosened rust-colored tie, shirt collar unbuttoned, a pencil behind one ear, scuffed two-tone shoes.
- **Props:** a small reporter's notebook held up and ready, and a period press camera (Speed Graphic style) slung on a strap at his hip. The press card and notebook are blank (no writing).
- **Pose/expression:** leaning in, notebook raised, "so what's the real story?" energy. Charming, transactional, and a little too curious.
- **Palette:** slate blue, charcoal, rust and mustard accents, cream shirt.
- **Style:** match the existing `art/Hollywoodland_Character_*.png` sheets: 2:3 full-body figure, bold clean outlines, cel color with soft painted shading, exaggerated retro-cartoon anatomy. Round 1 sheets used a near-black background with an amber rim glow; from round 2 the character is a transparent-background cutout with no outer glow (see the round 2 prompt).
- **Constraints:** no baked text (the tabloid name must not appear on the card or camera), no real-person likeness, single character only.

## Prompt

```text
Full-body character design illustration of Nick Ferro, a fast-talking newspaper stringer for a gossip tabloid, for a romanticized 1935 Hollywood storybook adventure game. Match the two reference images exactly in rendering style, line weight, framing and background treatment: bold clean dark outlines, flat cel colors with soft painted shading, exaggerated retro-cartoon anatomy and expression in the manner of 1930s hand-drawn animation, a single full-length figure centered on a near-black warm-brown background with a soft warm amber glow rim-lighting the silhouette, 2:3 portrait framing, head to shoes fully visible with a small margin all around. Character: a tall, lean, angular man in his early thirties with a long sharp face, a pointed nose, a quick sidelong smirk, one eyebrow arched, bright watchful eyes and a pencil-thin mustache. He is leaning forward mid-question, charming, transactional and a little too curious. Outfit: a battered fedora pushed back on his head with a blank press card tucked in the hatband, a slightly rumpled slate-blue pinstripe suit, a loosened rust-colored tie with the collar unbuttoned, a pencil behind one ear, and scuffed two-tone shoes. Props: a small reporter's notebook held up in one hand with a pencil ready in the other, and a period press camera in the style of a Speed Graphic slung on a strap at his hip. The notebook pages, press card and camera carry no writing of any kind. Pose: leaning in toward the viewer with the notebook raised, long limbs, a clearly different silhouette from the stocky and clipboard-holding figures in the references. Palette: slate blue, charcoal, rust and mustard accents with a cream shirt, no saturated modern colors. Constraints: no text, letters, numbers, logos, captions or signatures anywhere; no likeness of any real person; no other characters, scenery, floor, or props beyond those described; no white or checkerboard background; one character only.
```

## Prompt, round 2 (use for all future generations)

Owner-requested changes after round 1 review (2026-09-18): (1) output with an alpha channel and a transparent background; (2) no outer glow around the character. Nothing else about the design changed.

Generate with `--background transparent` (a real request parameter, not just prompt text), PNG output, then verify the file is RGBA with alpha 0 corners and alpha 255 inside the figure, and check for glow or halo pixels at 100% over black, white and saturated green. If the backend does not return true alpha, fall back to the Boulevard workflow in `art/prompts/boulevard-five-plane-v2.md`: render against flat `#ff00ff`, then remove it with `remove_chroma_key.py`, keeping the chroma master unchanged.

```text
Full-body character design illustration of Nick Ferro, a fast-talking newspaper stringer for a gossip tabloid, for a romanticized 1935 Hollywood storybook adventure game. Match the two reference images in rendering style, line weight and framing only: bold clean dark outlines, flat cel colors with soft painted shading, exaggerated retro-cartoon anatomy and expression in the manner of 1930s hand-drawn animation, a single full-length figure centered on a fully transparent background with true alpha transparency, 2:3 portrait framing, head to shoes fully visible with a small margin all around. The character is a clean isolated cutout: a crisp dark outline sits directly against transparency, with no outer glow, no halo, no aura, no rim-light bloom, no drop shadow, no ground shadow, no vignette and no background of any kind. Do not copy the dark background or the amber glow seen in the references. Character: a tall, lean, angular man in his early thirties with a long sharp face, a pointed nose, a quick sidelong smirk, one eyebrow arched, bright watchful eyes and a pencil-thin mustache. He is leaning forward mid-question, charming, transactional and a little too curious. Outfit: a battered fedora pushed back on his head with a blank press card tucked in the hatband, a slightly rumpled slate-blue pinstripe suit, a loosened rust-colored tie with the collar unbuttoned, a pencil behind one ear, and scuffed two-tone shoes. Props: a small reporter's notebook held up in one hand with a pencil ready in the other, and a period press camera in the style of a Speed Graphic slung on a strap at his hip. The notebook pages, press card and camera carry no writing of any kind. Pose: leaning in toward the viewer with the notebook raised, long limbs, a clearly different silhouette from the stocky and clipboard-holding figures in the references. Palette: slate blue, charcoal, rust and mustard accents with a cream shirt, no saturated modern colors. Constraints: no text, letters, numbers, logos, captions or signatures anywhere; no likeness of any real person; no other characters, scenery, floor, or props beyond those described; no painted background, no black, white or colored fill behind the figure, and no painted checkerboard; one character only.
```

The round 1 prompt above produced `art/generated/*.png` as they exist now (opaque near-black background with amber glow) and is kept so those files stay reproducible.

## Provenance record

```text
asset_id: character_reporter_nick_ferro
asset_type: character full-body concept/source art
prompt_or_brief: this file (see Prompt above)
reference_asset_ids: Hollywoodland_Character_Production_Coordinator, Hollywoodland_Character_Casting_Manager
generation_tool_and_version: gpt-image-2 via gg-image (Codex ChatGPT backend)
generation_date: 2026-09-18
raw_source_location: art/generated/character-reporter-nick-ferro.png
human_edits: none yet
review_status: superseded by round 2 (kept for reference)
rights_or_license_notes: project-owned development generation; human rights/provenance review required. Name and design match the canon approved 2026-09-18.
runtime_files: not yet promoted
```

## Generation notes (2026-09-18, first pass, single take)

Matches the brief: house style and framing, slate-blue pinstripe, rust tie, fedora with a blank press card, Speed Graphic-style camera, pencil behind ear, leaning-in pose, no baked text.

Flags for the reviewer:

- The notebook is top-spiral bound. The brief did not specify binding; check it is acceptable for 1935.
- He holds a second pencil in his raised hand in addition to the one behind his ear.
- The mustache is faint and the "early thirties" read is loose.
- The pose is a wide stance similar to the coordinator reference. If a more distinct silhouette is wanted, regenerate with a different stance.

## Round 2 generation (2026-09-18, single take)

```text
asset_id: character_reporter_nick_ferro_r2
asset_type: character full-body source art, transparent-background cutout
prompt_or_brief: "Prompt, round 2" section of this file
reference_asset_ids: Hollywoodland_Character_Production_Coordinator, Hollywoodland_Character_Casting_Manager (style only)
generation_tool_and_version: gpt-image-2 via gg-image (Codex ChatGPT backend), --background transparent, --quality high, --size 1024x1536
generation_date: 2026-09-18
raw_source_location: art/generated/character-reporter-nick-ferro-r2.png
human_edits: none yet
review_status: approved by the owner 2026-09-19
rights_or_license_notes: project-owned development generation; human rights/provenance review required. Name and design match the canon approved 2026-09-18.
runtime_files: public/assets/characters/reporter.webp (see the cleanup and staging record below)
```

Verified after generation: RGBA PNG, 1024x1536, all four corners alpha 0, no glow or halo (pixels farther than ~7px from the figure have alpha <= 2 of 255), checked over saturated green. Owner viewed the files and approved the look (round 2 supersedes round 1 for these fixes; round 1 file kept for reference).

Technical notes for cleanup:

- Interior alpha is 253-254, not 255 (about 1% see-through). Normalize to 255 during cleanup if it shows over dark backgrounds.
- The figure sits within about 10-20px of the top and bottom edges, so crop or pad at promotion rather than assuming a wide margin.
- Design unchanged from round 1, so the round 1 flags for this character still apply: Nick's silhouette is close to the coordinator's wide stance and he still holds a second pencil in hand as well as behind the ear.

## Cleanup and staging (2026-09-18)

```text
asset_id: reporter_portrait
source_asset: art/generated/character-reporter-nick-ferro-r2.png (raw, unchanged)
human_edits: deterministic alpha normalization only, done with a script and no repainting. Alpha >= 250 set to 255 (fully opaque interior); alpha <= 3 set to 0 (invisible stray specks); antialiased edge alpha 4-249 and all RGB left untouched.
cleaned_source: art/generated/character-reporter-nick-ferro-r2-clean.png (lossless PNG)
runtime_files: public/assets/characters/reporter.webp (1024x1536 RGBA, lossy quality 90, alpha_quality 100, same format and size as the other character portraits)
review_status: approved by the owner 2026-09-19; runtime file in place, not yet referenced by any scene
```

Verified from the encoded WebP: corners alpha 0, no glow or halo over black, white or saturated green, roughly 1.5% partial-alpha edge pixels.

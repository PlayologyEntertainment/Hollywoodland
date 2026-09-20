# Character brief: Lucian Vale (house manager of The Celestial Palace)

Status: **Proposed by Claude at the owner's request 2026-09-19; name, design and portrait approved by the owner 2026-09-19. Wired into the game.**

## Role in the game

- Fills the last free slot of the slice cast (8-10 characters, `docs/VERTICAL_SLICE_SPEC.md` §2) and gives The Celestial Palace lobby a face. Before this, the lobby scene used an unnamed usher with no portrait. Code id: `house-manager` (`src/domain/RelationshipDefinitions.ts`, no attraction).
- Canon (`docs/DRAFT_TRACK_B_CANON_PROPOSAL.md` §2, entry 10, approved 2026-09-19): fifties, upright and ceremonial, treats the Palace as a cathedral and every moviegoer as a congregation. Proud and a little theatrical, and fair to anyone who respects the craft of going to the pictures. Trades favors in seats (the Tuesday matinee pass for crew and extras, a word at the rope). Trust/obligation track only; no romance.
- Deliberately unlike the rest of the cast: the tallest, most formal figure, and the only one in a uniform. Not stocky (Gus Albrecht), not leaning (Nick Ferro), no mustache (Nick, Gus), not harried (Ray Kessler).

## Visual brief

- **Silhouette:** a tall, straight vertical column. Chest out, chin lifted, heels together, weight even. The flashlight is held low at his side, so nothing extends outward the way Ray Kessler's outstretched arm or Nick Ferro's raised notebook do.
- **Face:** fifties, high cheekbones, expressive arched eyebrows, a serene and slightly theatrical benevolent smile, dark slicked-back hair silvering at the temples, clean-shaven.
- **Costume:** deep maroon double-breasted usher's uniform tailcoat with black satin lapels, gold braid epaulettes and gold frogging, a small gold star-and-crescent lapel pin (the Palace's ornament), a gold pocket-watch chain, white gloves, black trousers with a thin gold side stripe, black patent shoes with white spats.
- **Props:** a maroon pillbox cap with a plain gold band in the crook of one arm, and a brass usher's flashlight angled downward in the other hand. Nothing carries writing.
- **Palette:** maroon, black, gold, cream gloves and white spats. Echoes the Palace's crimson, gold and midnight blue.
- **Skin tone and ethnicity:** deliberately not specified in the prompt, so the generator's default applies. Flag for the reviewer.
- **Style:** the round 2 treatment used for the other portraits: 2:3 full-body figure, bold clean outlines, cel color with soft painted shading, retro-cartoon anatomy, transparent background, no glow.
- **Constraints:** no baked text, no real-person likeness, single character only.

## Prompt (round 2 format)

Generated with `--background transparent`, PNG output, `--quality high --size 1024x1536`, and two references used for **rendering style, line weight and framing only**: the cleaned round 2 portraits of Nick Ferro and Gus Albrecht (`art/generated/character-reporter-nick-ferro-r2-clean.png`, `character-mentor-gus-albrecht-r2-clean.png`). The prompt says not to copy any background or glow.

```text
Full-body character design illustration of Lucian Vale, the proud house manager and head usher of a grand 1935 movie palace, for a romanticized 1935 Hollywood storybook adventure game. Match the two reference images in rendering style, line weight and framing only: bold clean dark outlines, flat cel colors with soft painted shading, exaggerated retro-cartoon anatomy and expression in the manner of 1930s hand-drawn animation, a single full-length figure centered on a fully transparent background with true alpha transparency, 2:3 portrait framing, head to shoes fully visible with a small margin all around. The character is a clean isolated cutout: a crisp dark outline sits directly against transparency, with no outer glow, no halo, no aura, no rim-light bloom, no drop shadow, no ground shadow, no vignette and no background of any kind. Do not copy any background or glow from the references. Character: a tall, trim, upright man in his fifties with a ceremonial, dignified bearing: chest out, chin lifted, heels together, a serene and slightly theatrical benevolent smile, high cheekbones, expressive arched eyebrows, dark slicked-back hair silvering at the temples, clean-shaven with no mustache and no beard. He looks like a man who thinks of his theater as a cathedral. Outfit: a deep maroon double-breasted usher's uniform tailcoat with black satin lapels, gold braid epaulettes and gold frogging across the chest, a small gold star-and-crescent-moon lapel pin, a gold pocket-watch chain looped across the waistcoat, spotless white gloves, black trousers with a thin gold side stripe, and polished black patent shoes with white spats. Props: a maroon pillbox cap with a plain gold band tucked in the crook of one arm, and a brass usher's flashlight held in the other white-gloved hand, angled downward as if lighting an aisle. The cap band, pin and any badge carry no writing of any kind. Pose: standing very upright and formal, weight even on both feet, a clearly different silhouette from the leaning, stocky and arm-outstretched figures of the other characters: a tall straight vertical column with the flashlight held low at his side. Palette: maroon, black, gold and cream gloves with white spats, no saturated modern colors. Constraints: no text, letters, numbers, logos, captions or signatures anywhere; no likeness of any real person; no other characters, scenery, floor, or props beyond those described; no painted background, no black, white or colored fill behind the figure, and no painted checkerboard; one character only.
```

## Provenance record

```text
asset_id: character_house_manager_lucian_vale
asset_type: character full-body source art, transparent-background cutout
prompt_or_brief: "Prompt (round 2 format)" section of this file
reference_asset_ids: character_reporter_nick_ferro_r2_clean, character_mentor_gus_albrecht_r2_clean (style only)
generation_tool_and_version: gpt-image-2 via gg-image (Codex ChatGPT backend), --background transparent, --quality high, --size 1024x1536
generation_date: 2026-09-19
raw_source_location: art/generated/character-house-manager-lucian-vale.png
human_edits: none to the raw file
review_status: approved by the owner 2026-09-19 (single take)
rights_or_license_notes: project-owned development generation; human rights/provenance review required. The name and design were approved by the owner 2026-09-19.
runtime_files: see the cleanup record below
```

Verified after generation: RGBA PNG, 1024x1536, all four corners alpha 0, no glow or halo (pixels farther than 7 px from the figure have alpha <= 1 of 255), checked over saturated green and white. About 27% of pixels sit at alpha 250-254 (a slightly see-through interior), normalized in the cleanup below. The figure sits within 10-20 px of the top and bottom edges, the same as the other portraits.

## Cleanup and staging (2026-09-19)

```text
asset_id: house_manager_portrait
source_asset: art/generated/character-house-manager-lucian-vale.png (raw, unchanged)
human_edits: deterministic alpha normalization only, done with a script and no repainting. Alpha >= 250 set to 255 (fully opaque interior); alpha <= 3 set to 0; antialiased edge alpha 4-249 and all RGB left untouched.
cleaned_source: art/generated/character-house-manager-lucian-vale-clean.png (lossless PNG)
runtime_files: public/assets/characters/house-manager.webp (1024x1536 RGBA, lossy quality 90, alpha_quality 100, same format and size as the other character portraits)
review_status: approved by the owner 2026-09-19
```

Verified from the encoded WebP: corners alpha 0, about 0.9% partial-alpha edge pixels.

## Wiring

- `RelationshipDefinitions.ts`: `HOUSE_MANAGER` (`house-manager`, "Movie-palace house manager", no attraction), added to the roster.
- `DialogueGraphs.ts`: `CELESTIAL_PALACE_DIALOGUE` now speaks as the House Manager. Admiring the ceiling earns trust once; the voucher matinee pass earns trust and puts the player slightly in his debt, once.
- `AppShell.ts`: the `celestial-palace` scene art now includes his portrait.
- Docs: `DRAFT_TRACK_B_CANON_PROPOSAL.md` (cast entry 10), `VERTICAL_SLICE_SPEC.md` (roster table) and `DECISION_LOG.md` (slice cast, open decisions).

# Location interiors, round 1: The Silver Thimble, The Klieg Light, The Celestial Palace

Status: **Approved by the owner 2026-09-19, converted to runtime WebP and wired into the game (see "Promotion and wiring")**

## Role in the game

These are the interiors for the three Boulevard entrances that show a sign but have no scene yet (`enterable: false` in `public/data/boulevard-manifest.json`). Each follows the existing visual-novel pattern in `src/app/AppShell.ts` (`LOCATION_SCENE_ART`): a location background with a character portrait overlaid.

| Location | Manifest id | Canon | Planned portrait (proposal, not yet decided) |
|---|---|---|---|
| The Silver Thimble | `costume-shop` | Costume shop, owner-approved 2026-09-18 | Ola Whitfield (`wardrobe-mentor`), confirmed by the owner 2026-09-19 |
| The Klieg Light | `klieg-light-office` | Tabloid, approved canon 2026-09-18 | Nick Ferro (`reporter`), confirmed by the owner 2026-09-19 |
| The Celestial Palace | `celestial-palace` | Grand theater, approved canon 2026-09-18 | Lucian Vale (`house-manager`), added and approved 2026-09-19 (`character-house-manager-lucian-vale.md`); the first pass used an unnamed usher with no portrait |

The alley is intentionally not in this round.

## Shared visual brief

- **Format:** full-frame opaque painted room, 4:3, no people. Existing interiors (`art/Hollywoodland_Location_*.png`, `public/assets/locations/*.webp`) are 1448x1086 opaque images. Requested at 1536x1152 (4:3); the backend returned 1448x1086, so no resize is needed at promotion.
- **Style:** match `art/Hollywoodland_Location_Diner.png`: rich hand-painted storybook illustration, bold clean outlines, warm cel color with soft painted shading, golden interior glow.
- **Exterior continuity:** each interior takes palette and motifs from its calibrated exterior module in `art/generated/boulevard-v3/runtime/` and does not draw the exterior.
- **Blank-signage policy:** no baked text anywhere (papers, posters, labels, clock faces). Any words are drawn by code.
- **Transparency and glow rule:** the standing rule for generated art (true alpha, no outer glow) is written for cutouts. A full-frame room has no background to make transparent, so these are opaque like the existing interiors; the no-glow, no-vignette, no-border half of the rule is applied in every prompt.
- **Generation settings:** `--quality high --size 1536x1152`, two `--reference` images (the diner interior for style and the matching exterior module for palette and motifs).

## Prompt: The Silver Thimble

```text
Interior scene illustration of The Silver Thimble, a costume and tailor shop on a 1935 Hollywood boulevard, for a romanticized Golden Age storybook adventure game. This is a full-frame painted room interior in the same rendering style, lighting, level of detail and 4:3 framing as the first reference image (a diner interior from the same game): rich hand-painted storybook illustration with bold clean outlines, warm cel color with soft painted shading, glossy highlights and an inviting golden glow inside the room. The second reference image is the shop's street exterior; carry over its palette and motifs only: deep teal, cream stucco, brass and gold trim, red-and-teal stripes, crimson velvet curtains, a golden scissors motif. Do not draw the exterior; show the room inside. Composition: a long, narrow, cozy shop viewed from just inside the front door toward the back. On the left, a large display window with crimson curtains looking out onto a dusk boulevard with palm trees and a warm streetlamp, and dress forms in period gowns. In the foreground and middle ground, a wide wooden cutting table strewn with fabric, pins, chalk, scissors and a tape measure, and a black cast-iron treadle sewing machine with spools of thread. Along the walls, floor-to-ceiling shelves of fabric bolts in rich jewel colors, hat forms with feathered hats, and racks of finished costumes including a swashbuckler's cape, a plumed captain's hat, a sash and a billowing white pirate shirt. A three-panel fitting mirror with a small carpeted fitting platform in the back right, and a rose-pink silk drape hanging from a brass rail. Brass pendant lamps and a stained-glass shaded lamp give warm light. A teal-and-cream checkerboard floor with a worn crimson runner. Include tiny details: a silver thimble on a velvet cushion, a pincushion, a brass cash register, a hand-cranked ticket spike, buttons in glass jars. No people, no characters, no figures, no faces, no animals. Every surface that could carry writing is blank or shows only abstract pattern: no text, letters, numbers, logos, captions, signage or signatures anywhere, and no readable labels on boxes, tags or paper. No glow, halo or aura around the frame, no vignette, no border, no frame, no watermark. The image fills the entire canvas edge to edge with painted scenery.
```

## Prompt: The Klieg Light

```text
Interior scene illustration of the newsroom of The Klieg Light, a scrappy gossip tabloid on a 1935 Hollywood boulevard, for a romanticized Golden Age storybook adventure game. This is a full-frame painted room interior in the same rendering style, lighting, level of detail and 4:3 framing as the first reference image (a diner interior from the same game): rich hand-painted storybook illustration with bold clean outlines, warm cel color with soft painted shading, glossy highlights and a lively golden glow inside the room. The second reference image is the newsroom's street exterior; carry over its palette and motifs only: red brick, cream stone, dark steel-framed windows, brass, amber lamplight, a studio klieg lamp on a bracket. Do not draw the exterior; show the room inside. Composition: a busy, cluttered, characterful newsroom at dusk, viewed from just inside the frosted-glass front door toward the back. Rows of scarred wooden desks piled with black typewriters, telephones with candlestick and rotary styles, stacks of newspapers, glue pots, paper spikes and coffee cups. A brick wall on one side hung with a large corkboard of pinned blank photographs and clippings, and a tall bank of wooden filing cabinets. In the middle distance, a chattering wire-service teletype machine with a curl of paper tape spilling to the floor, and a glass-partitioned editor's office at the back with a green-shaded banker's lamp and an empty leather chair. A period press camera with a flashbulb reflector sits on a desk beside a small studio klieg lamp used as a desk light. Tall steel-framed windows show the blue dusk boulevard with palm trees and a warm streetlamp. Green-shaded pendant lamps and gooseneck lamps cast pools of amber light; a ceiling fan turns; a pneumatic message tube runs along the ceiling; a wall clock shows a late hour. Include tiny details: a pencil behind a phone, crumpled paper balls, a half-eaten sandwich, a fedora on a coat rack, a folded blank newspaper. No people, no characters, no figures, no faces, no animals. Every sheet of paper, photograph, newspaper, folder, drawer label and wall clock face is blank or shows only abstract gray column texture and plain marks: no text, letters, numbers, headlines, mastheads, logos, captions, signage or signatures anywhere, and no readable writing on any surface. No glow, halo or aura around the frame, no vignette, no border, no frame, no watermark. The image fills the entire canvas edge to edge with painted scenery.
```

## Prompt: The Celestial Palace

```text
Interior scene illustration of the grand lobby of The Celestial Palace, a pagoda-roofed movie palace on a 1935 Hollywood boulevard, for a romanticized Golden Age storybook adventure game. This is a full-frame painted room interior in the same rendering style, lighting, level of detail and 4:3 framing as the first reference image (a diner interior from the same game): rich hand-painted storybook illustration with bold clean outlines, warm cel color with soft painted shading, glossy highlights and a glamorous golden glow inside the room. The second reference image is the theater's street exterior; carry over its palette and motifs only: crimson red, deep teal and jade green, cream marble, brass and gold, star, crescent-moon and sunburst ornaments, a red carpet, golden Art Deco fan motifs, gently upswept pagoda-style trim. Do not draw the exterior; show the lobby inside. Composition: a soaring, opulent, empty movie-palace lobby viewed from just inside the gilded front doors looking toward the auditorium. A wide red carpet runs down the center over a polished cream-and-teal marble floor with an inlaid gold star. A sweeping double staircase with a gold balustrade curves up to a mezzanine on both sides. A coffered ceiling is painted deep midnight blue with gilded stars, a crescent moon and a golden sunburst, with a huge tiered Art Deco chandelier and smaller globe lights. Tall red-and-gold auditorium doors stand slightly ajar at the back, spilling warm light and a hint of a red velvet curtain. A brass-and-mahogany ticket booth with a small arched window sits on one side, and a candy and popcorn counter with a glowing glass case, striped bags and a popcorn machine on the other. Velvet ropes on brass stanchions, tall potted palms, red velvet benches, standing brass ashtray-urns, gilded wall sconces, and empty ornate poster frames on the walls. Include tiny details: torn ticket stubs on the carpet, a dropped glove, a stack of paper cups. No people, no characters, no figures, no faces, no statues of people, no animals. Every poster frame, ticket, sign and panel is blank or shows only abstract ornament: no text, letters, numbers, titles, logos, captions, signage or signatures anywhere, and no readable writing on any surface. No glow, halo or aura around the frame, no vignette, no border, no frame, no watermark. The image fills the entire canvas edge to edge with painted scenery.
```

## Provenance records

```text
asset_id: location_interior_silver_thimble
asset_type: location interior background, full-frame opaque source art
prompt_or_brief: "Prompt: The Silver Thimble" section of this file
reference_asset_ids: Hollywoodland_Location_Diner (interior style and framing), art/generated/boulevard-v3/runtime/costume-tailor-shop.png (exterior palette and motifs only)
generation_tool_and_version: gpt-image-2 via gg-image (Codex ChatGPT backend), --quality high, --size 1536x1152 requested
generation_date: 2026-09-19
raw_source_location: art/generated/location-interior-silver-thimble.png
human_edits: none
review_status: approved by the owner 2026-09-19
rights_or_license_notes: project-owned development generation; human rights/provenance review required. Place name matches the canon approved 2026-09-18.
runtime_files: see "Promotion and wiring" below
```

```text
asset_id: location_interior_klieg_light
asset_type: location interior background, full-frame opaque source art
prompt_or_brief: "Prompt: The Klieg Light" section of this file
reference_asset_ids: Hollywoodland_Location_Diner (interior style and framing), art/generated/boulevard-v3/runtime/klieg-light-office.png (exterior palette and motifs only)
generation_tool_and_version: gpt-image-2 via gg-image (Codex ChatGPT backend), --quality high, --size 1536x1152 requested
generation_date: 2026-09-19
raw_source_location: art/generated/location-interior-klieg-light.png
human_edits: none
review_status: approved by the owner 2026-09-19
rights_or_license_notes: project-owned development generation; human rights/provenance review required. Place name matches the canon approved 2026-09-18.
runtime_files: see "Promotion and wiring" below
```

```text
asset_id: location_interior_celestial_palace
asset_type: location interior background, full-frame opaque source art
prompt_or_brief: "Prompt: The Celestial Palace" section of this file
reference_asset_ids: Hollywoodland_Location_Diner (interior style and framing), art/generated/boulevard-v3/runtime/celestial-palace.png (exterior palette and motifs only)
generation_tool_and_version: gpt-image-2 via gg-image (Codex ChatGPT backend), --quality high, --size 1536x1152 requested
generation_date: 2026-09-19
raw_source_location: art/generated/location-interior-celestial-palace.png
human_edits: none
review_status: approved by the owner 2026-09-19
rights_or_license_notes: project-owned development generation; human rights/provenance review required. Place name matches the canon approved 2026-09-18.
runtime_files: see "Promotion and wiring" below
```

## Generation notes (2026-09-19, first pass, single take each)

Verified from the files: all three are RGB PNGs at **1448x1086** (the backend snapped the requested 1536x1152 to the exact size of the existing interiors, so no resize is needed at promotion). Viewed at full size: no people, no baked text or numerals, no border, halo or vignette; each fills the frame edge to edge and reads clearly as the matching exterior.

- **The Silver Thimble:** teal-and-cream shop with the exterior's crimson curtains and dress forms in the window, a cutting table, a treadle sewing machine, fabric-bolt shelves, a three-panel fitting mirror on a platform, and a costume rack that includes a swashbuckler's cape, plumed hat and sash for *The Corsair's Daughter*.
- **The Klieg Light:** red-brick newsroom with green banker's lamps, typewriters and telephones, a teletype spilling paper tape, a corkboard of blank pinned photographs, a klieg lamp and a press camera, and a glass-partitioned editor's office.
- **The Celestial Palace:** cream, teal and crimson lobby with a gold star inlaid in the red carpet, a curved double staircase, a midnight-blue ceiling with gilded stars, moon and sunburst, a ticket booth, a popcorn counter, and the auditorium doors ajar.

Flags for the reviewer:

- The Silver Thimble costume rack shows a prop sword hilt hanging with the pirate costume. It is a costume prop, but it is the only weapon in the set, so say so if the tone ceiling should exclude it.
- The Celestial Palace lobby has two brass ashtray stands (empty). Easy to drop in a regeneration if you would rather not show them.
- Tiny surfaces (ticket stubs, tape-measure markings, clock face) read as abstract marks at full size. Check them at 100% before promotion.
- Round 1 only, approved as is. Nothing is cleaned, converted to WebP, or referenced by any code or scene.

## Promotion and wiring (2026-09-19)

Converted with Pillow (`quality=90, method=6`, RGB, lossy VP8, the same encoding as the existing interiors) from the unedited raw PNGs. No cleanup or repainting.

```text
asset_id: location_interior_silver_thimble, location_interior_klieg_light, location_interior_celestial_palace
source_asset: art/generated/location-interior-*.png (raw, unchanged)
human_edits: format conversion only
runtime_files: public/assets/locations/costume-shop.webp, public/assets/locations/klieg-light-office.webp, public/assets/locations/celestial-palace.webp (each 1448x1086)
review_status: approved by the owner 2026-09-19
```

Wired in this pass:

- `public/data/boulevard-manifest.json` and the built-in default: `costume-shop`, `klieg-light-office` and `celestial-palace` are `enterable: true` with "Enter ..." prompts. The alley is the only entrance left without a scene.
- `BoulevardSpikeScene.enterLocation` emits `costume-shop-entered`, `klieg-light-entered` and `celestial-palace-entered` (declared in `DomainEventBus.ts`).
- `AppShell.ts`: `LOCATION_SCENE_ART` entries for the three locations (the Palace has a background and no character, so `character` is now optional) and an event handler for each that opens the dialogue.
- `DialogueGraphs.ts`: `COSTUME_SHOP_DIALOGUE` (Ola, `wardrobe-mentor`), `KLIEG_LIGHT_DIALOGUE` (Nick, `reporter`) and `CELESTIAL_PALACE_DIALOGUE` (an usher in the first pass; the House Manager, Lucian Vale, from 2026-09-19). Every gain is one-time, gated on a fact the same choice sets. No new quests. Draft copy for the owner to revise.
- `tests/location-dialogues.test.ts` (10 tests) covers registration, the promoted backgrounds, the one-time gains, the favor ledger signs, the reporter's tension cost and the voucher gate.

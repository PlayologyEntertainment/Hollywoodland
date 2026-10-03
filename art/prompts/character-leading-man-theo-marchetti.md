# Character brief: Theo Marchetti (the leading man of *The Corsair's Daughter*)

Status: **Proposed by Claude 2026-10-03 for Chapter 2 (`docs/DRAFT_CHAPTERS_2_10_CANON_PROPOSAL.md` §3); name, design and portrait await owner approval. Not generated yet. In the game he speaks as "Leading Man" with no portrait until this is approved.**

## Role in the game

- A Monarch contract player, the corsair opposite Corinne Lake, and the new male romance-capable lead. Code id: `leading-man` (`src/domain/RelationshipDefinitions.ts`, attraction supported, like every romance-capable character attraction-flexible and reading the player's chosen portrait).
- Chapter 2 scenes: an evening in the wings of the soundstage (`c2-evening-theo`), the wrap-party dance (`c2-dance-theo`) and the set day. Chapters 4 to 10 follow him; see the Story Planner.
- Canon: late twenties, a former stunt rider who talked his way into the leading-man line. Self-deprecating, physically fearless, privately afraid of being found out as not a real actor.
- Deliberately unlike the rest of the cast: the only athletic, rider-built figure, and the only one dressed in a swashbuckler's costume. Not formal (Lucian Vale), not stocky (Gus Albrecht), not glossy (the publicity chief).

## Visual brief

- **Silhouette:** a loose, balanced, slightly forward stance, weight on the balls of the feet like a rider about to mount. Shoulders broad, waist narrow. One hand tucked into a sash, the other holding a cap, so nothing extends the way Ray Kessler's arm or the publicity chief's card does.
- **Face:** late twenties, an open, boyish face with a crooked half-smile that has not quite decided whether to be confident, a strong jaw, dark tousled hair, a small scar through one eyebrow, clean-shaven.
- **Costume:** the corsair, worn a little untidily: a white billowing pirate shirt open at the throat, a wide crimson sash, a short dark waistcoat, tight dark trousers and cuffed riding boots, a tarnished-gold earring. Knuckles taped with white strips.
- **Props:** a plumed corsair's hat tucked under one arm. Nothing carries writing.
- **Palette:** cream, crimson, dark brown and tarnished gold. Echoes the harbor-market set.
- **Skin tone and ethnicity:** deliberately not specified in the prompt, so the generator's default applies. Flag for the reviewer.
- **Style:** the round 2 treatment used for the other portraits: 2:3 full-body figure, bold clean outlines, cel color with soft painted shading, retro-cartoon anatomy, transparent background, no glow.
- **Constraints:** no baked text, no real-person likeness, single character only.

## Prompt (round 2 format, not yet run)

Use `--background transparent`, PNG output, `--quality high --size 1024x1536`, and the cleaned round 2 portraits of Nick Ferro and Gus Albrecht (`art/generated/character-reporter-nick-ferro-r2-clean.png`, `character-mentor-gus-albrecht-r2-clean.png`) as references for **rendering style, line weight and framing only**.

```text
Full-body character design illustration of Theo Marchetti, the young swashbuckling leading man of a 1935 Hollywood pirate picture, for a romanticized 1935 Hollywood storybook adventure game. Match the two reference images in rendering style, line weight and framing only: bold clean dark outlines, flat cel colors with soft painted shading, exaggerated retro-cartoon anatomy and expression in the manner of 1930s hand-drawn animation, a single full-length figure centered on a fully transparent background with true alpha transparency, 2:3 portrait framing, head to boots fully visible with a small margin all around. The character is a clean isolated cutout: a crisp dark outline sits directly against transparency, with no outer glow, no halo, no aura, no rim-light bloom, no drop shadow, no ground shadow, no vignette and no background of any kind. Do not copy any background or glow from the references. Character: an athletic man in his late twenties with a rider's build, broad shoulders and a narrow waist, standing in a loose, balanced, slightly forward stance with his weight on the balls of his feet. An open, boyish face with a crooked half-smile that has not quite decided whether to be confident, a strong jaw, dark tousled hair, a small scar through one eyebrow, clean-shaven with no mustache and no beard. Outfit: a billowing white pirate shirt open at the throat, a wide crimson sash, a short dark waistcoat, tight dark trousers and cuffed brown riding boots, a tarnished-gold earring, white tape wrapped around his knuckles. A plumed corsair's hat is tucked under one arm and the other hand rests in the sash. He wears the costume a little untidily, like a man who is more at home on a horse than on a stage. No weapons, no text, letters, numbers, logos or signage anywhere. No glow, halo or aura around the figure, no vignette, no border, no frame, no watermark.
```

## Provenance record

```text
asset_id: character_leading_man_theo_marchetti
asset_type: character full-body source art, transparent-background cutout
prompt_or_brief: "Prompt (round 2 format, not yet run)" section of this file
reference_asset_ids: character_reporter_nick_ferro_r2_clean, character_mentor_gus_albrecht_r2_clean (style only)
generation_tool_and_version: not generated yet (planned: gpt-image-2 via gg-image, --background transparent, --quality high, --size 1024x1536)
generation_date: not generated yet
raw_source_location: art/generated/character-leading-man-theo-marchetti.png (planned)
human_edits: none yet
review_status: awaiting owner approval of the name, design and brief
rights_or_license_notes: project-owned development generation once run; human rights/provenance review required. The name is a proposal.
runtime_files: none yet; planned public/assets/characters/leading-man.webp
```

## Wiring once approved

- `AppShell.ts`: `LOCATION_SCENE_ART` has one portrait per location, so the soundstage scene would need a second, per-node portrait (the soundstage shows the scene partner's portrait today). Decide whether the leading man's nodes switch the portrait or share the scene.
- Run the cleanup and WebP conversion the other portraits used, and add the alt text to `SCENE_ART_ALT`.

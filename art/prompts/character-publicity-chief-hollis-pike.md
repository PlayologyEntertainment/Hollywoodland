# Character brief: Hollis Pike (Monarch's publicity chief)

Status: **Proposed by Claude 2026-10-03 for Chapter 2 (`docs/DRAFT_CHAPTERS_2_10_CANON_PROPOSAL.md` §3); name, design and portrait await owner approval. Not generated yet. In the game he speaks as "Publicity Chief" with no portrait until this is approved.**

## Role in the game

- Monarch's publicity chief and fixer, and the keeper of Leopold Maddox's private ledger. Offers the player help from the first week; each offer is a small hook. The culprit of the Observatory mystery in the draft. Code id: `publicity-chief` (`src/domain/RelationshipDefinitions.ts`, no attraction).
- Chapter 2 scenes: the offer on the soundstage (`c2-pike-offer`), where accepting puts a `ledger:pike-help` fact in the career and a publicity card in the inventory, and the wrap of the set day, where he is seen watching. Declining costs nothing now.
- Canon: forties, glossy, relentlessly helpful, remembers every name and every debt. Never raises his voice. The studio's owner is glimpsed in the window above the soundstage, never named in Chapter 2.
- Deliberately unlike the rest of the cast: the only figure in a tailored gray suit and the only one who is always smiling. Not ceremonial (Lucian Vale), not rumpled (Nick Ferro, Gus Albrecht), not harried (Ray Kessler).

## Visual brief

- **Silhouette:** a slim, narrow vertical figure with a slight, courteous forward lean, as though about to take your elbow. One hand holds a cream card between two fingers at chest height; the other is tucked behind his back.
- **Face:** forties, a smooth, symmetrical face with a wide, warm smile that shows every tooth and does not reach the eyes, which are watchful and a little too still. Dark hair pomaded flat, a precisely trimmed side parting, clean-shaven. No mustache.
- **Costume:** a tailored dove-gray double-breasted suit with a soft white pocket square, a pale silk tie with a gold tie bar, a gold studio-crest lapel pin, polished two-tone oxford shoes, a gold wristwatch.
- **Props:** a cream calling card held between two fingers, and a small leather notebook in the breast pocket. The card carries no writing, only a gold crest.
- **Palette:** dove gray, cream and gold. Echoes the studio's crest and gives him the coolest palette in the cast.
- **Skin tone and ethnicity:** deliberately not specified in the prompt, so the generator's default applies. Flag for the reviewer.
- **Style:** the round 2 treatment used for the other portraits: 2:3 full-body figure, bold clean outlines, cel color with soft painted shading, retro-cartoon anatomy, transparent background, no glow.
- **Constraints:** no baked text, no real-person likeness, single character only.

## Prompt (round 2 format, not yet run)

Use `--background transparent`, PNG output, `--quality high --size 1024x1536`, and the cleaned round 2 portraits of Nick Ferro and Gus Albrecht as references for **rendering style, line weight and framing only**.

```text
Full-body character design illustration of Hollis Pike, the glossy, relentlessly helpful publicity chief of a 1935 Hollywood movie studio, for a romanticized 1935 Hollywood storybook adventure game. Match the two reference images in rendering style, line weight and framing only: bold clean dark outlines, flat cel colors with soft painted shading, exaggerated retro-cartoon anatomy and expression in the manner of 1930s hand-drawn animation, a single full-length figure centered on a fully transparent background with true alpha transparency, 2:3 portrait framing, head to shoes fully visible with a small margin all around. The character is a clean isolated cutout: a crisp dark outline sits directly against transparency, with no outer glow, no halo, no aura, no rim-light bloom, no drop shadow, no ground shadow, no vignette and no background of any kind. Do not copy any background or glow from the references. Character: a slim man in his forties standing in a narrow vertical stance with a slight, courteous forward lean, as though about to take your elbow. A smooth, symmetrical face with a wide, warm smile showing every tooth that does not quite reach his watchful, very still eyes, dark hair pomaded flat with a precise side parting, clean-shaven with no mustache and no beard. Outfit: a tailored dove-gray double-breasted suit, a soft white pocket square, a pale silk tie with a gold tie bar, a small gold crest lapel pin, polished two-tone oxford shoes and a gold wristwatch. One hand holds a blank cream calling card with a small gold crest between two fingers at chest height, and the other hand is tucked behind his back. A small leather notebook peeks from his breast pocket. No text, letters, numbers, logos or signage anywhere, and the card is blank apart from the crest. No glow, halo or aura around the figure, no vignette, no border, no frame, no watermark.
```

## Provenance record

```text
asset_id: character_publicity_chief_hollis_pike
asset_type: character full-body source art, transparent-background cutout
prompt_or_brief: "Prompt (round 2 format, not yet run)" section of this file
reference_asset_ids: character_reporter_nick_ferro_r2_clean, character_mentor_gus_albrecht_r2_clean (style only)
generation_tool_and_version: not generated yet (planned: gpt-image-2 via gg-image, --background transparent, --quality high, --size 1024x1536)
generation_date: not generated yet
raw_source_location: art/generated/character-publicity-chief-hollis-pike.png (planned)
human_edits: none yet
review_status: awaiting owner approval of the name, design and brief
rights_or_license_notes: project-owned development generation once run; human rights/provenance review required. The name is a proposal.
runtime_files: none yet; planned public/assets/characters/publicity-chief.webp
```

## Wiring once approved

- As for the leading man: the soundstage scene shows one portrait today (the scene partner), so both new characters need a per-node portrait choice in `AppShell.ts` before their art can appear.
- Leopold Maddox has no brief yet: Chapter 2 only glimpses him through a window, so no art is needed until Chapter 7.

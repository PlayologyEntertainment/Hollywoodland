# Character brief: the six player characters

Status: **built for owner review on 2026-09-20; not committed.** Phase 1 of 2: the Character Creator, the six designs, headshots and portraits are in. **Phase 2, a walk cycle for each new character, is not started.**

## What changed

The Character Creator no longer customises a character. The left pane keeps the **Name** field and replaces everything below it (skin tone, face, hair, eyes, outfit, hat, accessory, voice, Randomize) with a selector of **six ready-made characters** shown as headshots: White Male, Asian Male, Black Male, White Female, Asian Female, Black Female (three men, then three women). The chosen one shows head-to-toe, with no box, standing on the floor of the creator's background image, in the centre. The origin picker and attributes on the right, and the Back and Start Career buttons, are unchanged. The screen is now built on `art/Hollywoodland_Creator_Background.png` (`public/assets/ui/creator-background.webp`), with semi-transparent panels left and right.

Tweaks after the first review (2026-09-20):

- **Centring.** The figure is centred between the two side panes: the image sits on the exact midpoint of the gap at every screen size (measured to 0.00 px from 1920 x 1080 down to 1024 x 768), and each character's silhouette is centred within the image, so the space from the figure to the left pane and to the right pane matches within 0.6 px for all six at 1920 x 1080. The model draws each figure off-centre (silhouette centres 480 to 577 of 1024), so `tools/build_player_art.py` shifts each figure sideways by 20 to 65 px; only transparent margins change. Centring on the body's centre of mass was tried first and left up to 38 px more room on one side for wide-stance figures (feet not under the torso), so the silhouette's middle is used.
- **Header.** The "Hollywoodland" line and the old "Character Creator" heading are gone from the top (a hidden heading keeps the screen's accessible name). The three-word line under the figure is removed.
- **Column titles.** "Character" is centred over the left pane and "Origin" over the right, both in Limelight at one shared size and colour (`.creator-title`). The panes' own labels ("Character", "Choose an Origin") are unchanged. On narrow screens each title stays directly above its pane.
- **Centre stage fix.** The centre column can now shrink below the figure's natural width, so the figure scales down and stays centred on small laptop screens instead of overflowing to the right.
- **Splash button.** The splash screen's button now says "Play" (was "Enter"), in Limelight at 1.9rem (was 1.15rem): the word fills 41% of the button's width and 71% of its height, centred, and the button is 192 x 52 px (was 46 px tall).

Further tweaks (2026-09-20):

- **Full height.** The figure fills all the room between the column titles and the footer buttons (100% of it at every window size tested, 1024 x 768 to 1920 x 1080). The creator is a CSS size container, and the centre column claims the width of a full-height 2:3 figure first (`--stage-h` in `styles.css`); the side panes then shrink from their full widths (26 and 30 rem) as far as 14 and 16 rem to make room. Stacked phone layout is unchanged (figure 15 rem tall).
- **Right-pane sub-titles.** "Choose an Origin" and "Attributes" now share one rule with "Name" and "Character" (`.creator-field span, .creator-origin h3`): same Arial caps, size, colour and letter-spacing.
- **Attribute dividers.** The divider lines between the five attributes are gone. They came from the general `dl div` rule; the rows are now `display: contents`, so nothing draws them.
- **Attribute rows.** The five bars now share one three-column grid (label, bar, value): every bar starts at the same x, ends at the same x and is the same length as the Presence bar (measured identical at four window sizes and three origins), and the rows are closer together (23.8 px apart, was about 34 px). Two general rules had been distorting the old bars: `dl div` (padding and a bottom border, which also hit the bar itself) and the default indent on `dd`.
- **Floor reflection.** Each character has a reflection strip, `public/assets/characters/player/<id>-reflection.webp` (1024 x 520 RGBA), laid on the floor under the figure at the portrait's scale: 65% opacity, a light blur (`.12rem`), and a fade to nothing with depth (`.creator-reflection` in `styles.css`; the fade is baked into the strip). It sits behind the figure and the contact shadow, ignores the pointer and is hidden from screen readers. **Each foot is mirrored about its own sole**, not about one common floor line: the model draws every figure with one foot further back (its sole is up to 58 px higher on the canvas), and a single mirror line left that foot's reflection floating below it. `tools/build_player_art.py` finds the two feet (connected shapes in the bottom 230 rows), flips each about the bottom edge of its lowest pixel, and tucks the copy 5 source px behind the shoe so the page's blur cannot open a gap. Checked on all six characters at 1920 x 1080 and zoomed on both feet of the White Male: both reflections meet their shoes. The soles of all six portraits are also at a fixed 3 px above the canvas bottom (the model left 9 to 15 px, different for each), so the strip's position is the same for every character. **Depth is limited**: the figure uses the full height, so the reflection only has the floor strip under the stage (about 88 px at 1920 x 1080, enough for the shoes and hems) and never makes the creator scroll. To show more of it, the figure would have to be a little smaller. Opacity and blur are two numbers in that rule.

The choice is cosmetic: it decides the headshot, the portrait and, in phase 2, the walk cycle. It is stored as `identity.characterId` in the career and its saves, an optional field, so saves from before this change stay valid with no schema bump and load as the default character.

## Choices made with the owner

- The current actor (cream shirt, suspenders, grey trousers) **is the White Male**, so his approved 16-frame walk cycle is reused as is; five more walk cycles are needed.
- A matching everyday-clothes family: all six are young aspiring actors in period everyday clothes, in distinct colours, in the style of the existing NPC portraits.
- The three women wear a blouse and high-waisted wide-leg trousers, as in the owner's concept sheet, so legs and shoes stay visible for the walk cycles and footprint shadows.
- The Asian characters are drawn as East Asian young people with no heritage stated anywhere in the game, and drawn respectfully and without stereotype. No real-person likenesses.
- No names or captions on the selector: the player's typed name is the only name. Each headshot has a screen-reader description instead.
- Phased: designs and creator first, then walk cycles (one male and one female first, then the rest).

## The six designs

| Id | Look | Outfit |
|---|---|---|
| `white-male` | dark brown wavy hair swept to the side, fair skin (the existing actor, redrawn from his idle frame) | cream shirt, brown suspenders, grey pinstripe cuffed trousers, brown oxfords |
| `asian-male` | short glossy black hair in a neat side part, light golden skin | sage-green shirt, tan suspenders, navy cuffed trousers, brown oxfords |
| `black-male` | short tapered black hair, deep brown skin | terracotta shirt, dark brown suspenders, charcoal cuffed trousers, dark brown oxfords |
| `white-female` | chestnut-auburn finger waves, fair skin | sky-blue blouse, navy wide-leg trousers, thin brown belt, brown low heels |
| `asian-female` | glossy black chin-length bob with pin curls, light golden skin | dusty-rose blouse, forest-green wide-leg trousers, black belt, black Mary Janes |
| `black-female` | short natural curls in soft waves, deep brown skin | mustard-yellow blouse, plum wide-leg trousers, brown belt, brown low heels |

## Prompts

`art/generated/player-characters/prompts/<id>.txt` (one per character; a shared body with the look and outfit filled in). Key points, following the standing rules for generated art:

- Full-body character illustration in the style of the NPC portraits: bold clean outlines, flat cel colour with soft painted shading, warm palette, 1930s hand-drawn animation look; one figure, 2:3, head to shoes visible with a small margin.
- **Fully transparent background with true alpha, no outer glow, no halo, no drop or ground shadow.** Generated with `--background transparent --size 1024x1536 --quality high`; verified RGBA with alpha 0 at the corners for all six.
- A neutral, friendly three-quarter pose with a hand on the hip and both feet flat and fully visible, so the same pose can seed walk cycles. No hat, bag or props.
- Proportions stated numerically (about 7.5 heads tall, head plus neck about 20% of height), as learned on the walk-cycle work.
- Style references: for the men the reporter and production-coordinator portraits, for the women the scene-partner and wardrobe-mentor portraits (style only, not pose, face or outfit). For the White Male, also the existing actor's idle frame as the character to redraw.

Two takes were generated for each character. Take 1 was used for `white-male`, `white-female`, `asian-female` and `black-female`; take 2 for `asian-male` and `black-male`. The other takes were discarded, and only the chosen takes are kept in `art/generated/player-characters/`.

## Runtime files

`tools/build_player_art.py` builds them from the chosen takes (`python build_player_art.py asian-male=2 black-male=2`):

- `public/assets/characters/player/<id>-portrait.webp`: the full-size portrait, 1024 x 1536 RGBA, WebP quality 90.
- `public/assets/characters/player/<id>-headshot.webp`: a 384 x 384 head-and-shoulders crop of the same drawing (so it is always the same face and clothes), with clear space above the hair.
- Alpha is normalised like the other promoted art (>= 250 to 255, <= 3 to 0); the drawings are not otherwise touched.
- `public/assets/characters/player/<id>-reflection.webp`: the floor reflection of the feet, 1024 x 520 (see the tweaks above).
- `public/assets/ui/creator-background.webp`: `art/Hollywoodland_Creator_Background.png` converted to WebP, unchanged in size (1672 x 941).

## How it is wired

- `src/domain/PlayerCharacters.ts`: the roster (ids, order, screen-reader descriptions, art paths and each character's walk-cycle config path). Tested.
- `src/app/CharacterCreator.ts`: the selector is a radio group (arrow keys move and select; only the chosen headshot is in the tab order), and the portraits are preloaded so switching is instant.
- `BoulevardBootScene` reads `identity.characterId` from the career it is starting, loads that character's walk-cycle config, and `BoulevardSpikeScene` gives the sprite a per-character texture key (`player:<id>`), so choosing a different character on a later career loads the right sheet instead of finding the previous one in Phaser's cache.
- **Until phase 2, all six characters use the current actor's walk cycle.** Each character's `walkCycle` entry in `PlayerCharacters.ts` points at `data/walk-cycle.json`; phase 2 changes those six paths (and adds a sheet per character), with no code change.
- On narrow screens the panes stack, the headshots sit in one row of six, and the body scrolls.

## Provenance record

```text
asset_id: player_character_{white_male, asian_male, black_male, white_female, asian_female, black_female}
asset_type: character full-body source art and derived headshot, transparent-background cutout
prompt_or_brief: this file; art/generated/player-characters/prompts/<id>.txt
reference_asset_ids: NPC portraits reporter, production-coordinator, scene-partner, wardrobe-mentor (style only); aspiring_actor_idle_take1 (the White Male's character)
generation_tool_and_version: gpt-image-2 via gg-image (Codex ChatGPT backend), --background transparent, --quality high, --size 1024x1536; local crop, alpha clean-up and WebP encoding with art/generated/player-characters/tools/build_player_art.py
generation_date: 2026-09-20
raw_source_location: art/generated/player-characters/<id>-take<N>.png (chosen takes)
human_edits: none to the drawings. Deterministic processing only: alpha clean-up, headshot crop and resize, WebP encoding
review_status: pending owner review
rights_or_license_notes: project-owned development generation; human rights/provenance review required. Fictional characters; no real-person likeness.
runtime_files: public/assets/characters/player/<id>-portrait.webp and <id>-headshot.webp; public/assets/ui/creator-background.webp
```

## Known issues for the reviewer

- **The walk cycle is not done for five of the six.** On the Boulevard every character currently walks as the White Male. That is the agreed phase 1.
- The Asian Male and Black Male came from take 2; in take 1 the Asian Male's pose was more stiff and the Black Male's smile less warm. The choice is easy to revisit.
- The characters are new drawings by the model, so faces and clothes will not match the existing NPCs' exactly; the White Male is a redraw of the existing actor and differs slightly from his walk-cycle sprite.
- `frameBackground` in `src/game/WalkCycle.ts`, which the creator used to show the walk sheet's idle frame as a portrait, is no longer used by the app (its tests remain).
- The creator's background image is fixed art, so the high-contrast setting affects the panels' text but not the scene.

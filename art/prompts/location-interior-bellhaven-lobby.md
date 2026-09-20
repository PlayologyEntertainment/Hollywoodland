# Location interior: the Bellhaven Rooms lobby

Status: **Generated at the owner's request 2026-09-19 and wired into the game for review (single take).**

## Role in the game

- The landlady's scene. Before this, the landlady conversation was shown over the rented-room image (`boarding-house.webp`). It now uses this lobby, and the rented room became the background of the Bellhaven Rooms **Home Menu** (see "Wiring").
- Code id: `boarding-house` in `LOCATION_SCENE_ART` (`src/app/AppShell.ts`); runtime file `public/assets/locations/boarding-house-lobby.webp`.

## Owner decisions (2026-09-19)

- **Look:** a cozy, slightly worn front hall (the recommended option over "faded glamour" and "bare and practical").
- **Light:** warm sunny afternoon, matching the room image.
- **Home Menu:** same layout as the landlady scene, with the room image filling the frame and the menu in a panel on the right.

## Visual brief

- Full-frame opaque painted room, 4:3, no people. Same rendering style as `art/Hollywoodland_Location_Boarding_House.png` and the other interiors: rich hand-painted storybook illustration, bold clean outlines, warm cel color with soft painted shading, golden interior glow.
- A narrow front hall seen from just inside the front door: a reception desk (brass bell, guest ledger, green-shaded lamp, candlestick telephone, mail) at the centre; behind it a wall of pigeonhole mailboxes and brass key hooks; a wooden staircase with a red runner at the centre-right; the front door and a lace-curtained window with a glimpse of a palm-lined boulevard on the left; umbrella stand, coat rack, silhouette portraits, a bulletin board, a potted palm, a suitcase and hatbox on a shelf, black-and-cream tile floor and a braided rug.
- Composition note: the landlady portrait covers the left third of the frame and the dialogue panel the right third, so the desk and staircase are toward the centre.
- Blank-signage policy: mailbox plates, key tags, ledger pages, notices and the telephone dial carry no text.
- The standing transparency rule (true alpha, no outer glow) is written for cutouts; a full-frame room is opaque like the existing interiors, and the no-glow, no-vignette half is applied in the prompt.

## Prompt

References (both used for style and palette only): 1 `art/Hollywoodland_Location_Boarding_House.png` (the room in the same building), 2 `art/generated/boulevard-v3/runtime/bellhaven-rooms.png` (the exterior). Generated with `--quality high --size 1536x1152`; the backend returned 1448x1086, the exact size of the other interiors.

```text
Interior scene illustration of the front hall of Bellhaven Rooms, a cozy, slightly worn 1935 Hollywood boarding house, for a romanticized Golden Age storybook adventure game. This is a full-frame painted room interior in the same rendering style, lighting, level of detail and 4:3 framing as the first reference image (a rented room in the same building, with an iron bed, a typewriter, a gramophone and framed pictures): rich hand-painted storybook illustration with bold clean outlines, warm cel color with soft painted shading, glossy highlights and an inviting golden glow inside the room. The second reference image is the building's street exterior; carry over its palette and motifs only: warm cream stucco, teal trim, terracotta, brass fittings, flower boxes. Do not draw the exterior; show the hall inside. Composition: viewed from just inside the front door, looking into a narrow, cozy front hall, lit by warm sunny afternoon light. At the centre, a small dark-wood reception desk with a brass call bell, an open guest ledger, a green-shaded desk lamp, a candlestick telephone and a small stack of mail. Behind and beside the desk, a wall of small wooden pigeonhole mailboxes and brass key hooks with a few brass keys hanging from them. At the centre-right, a straight wooden staircase with a worn red runner and a turned banister rising to an upper landing with a warm lamp. On the left, the front door with a frosted glass panel and a glimpse of a palm-lined boulevard through the lace-curtained front window beside it, with sunlight falling in a warm beam across the worn black-and-cream tile floor and a braided rug; an umbrella stand and a coat rack with a couple of hats and coats beside the door. Faded floral wallpaper above dark wainscoting, with several small framed cut-paper silhouette portraits, a potted palm in a brass pot, a small bulletin board with blank pinned notices, a shelf with a worn suitcase and a hatbox, and a vase of fresh flowers on the desk. Keep the reception desk and the staircase toward the centre and centre-right, with a little more open floor and wall at the far left and far right edges. Include tiny details: a brass floor lamp, a folded newspaper, worn spots on the runner, a dented brass bell. No people, no characters, no figures, no faces, no animals. Every surface that could carry writing is blank: mailbox plates, key tags, ledger pages, notices, book spines and the telephone dial carry no text, letters, numbers, names, logos, captions, signage or signatures anywhere, and no readable writing on any surface. No glow, halo or aura around the frame, no vignette, no border, no frame, no watermark. The image fills the entire canvas edge to edge with painted scenery.
```

## Provenance record

```text
asset_id: location_interior_bellhaven_lobby
asset_type: location interior background, full-frame opaque source art
prompt_or_brief: "Prompt" section of this file
reference_asset_ids: Hollywoodland_Location_Boarding_House (interior style), boulevard_v3_plane4_modules bellhaven-rooms (exterior palette and motifs only)
generation_tool_and_version: gpt-image-2 via gg-image (Codex ChatGPT backend), --quality high, --size 1536x1152 requested
generation_date: 2026-09-19
raw_source_location: art/generated/location-interior-bellhaven-lobby.png
human_edits: none
review_status: pending owner review (single take; wired into the game for review)
rights_or_license_notes: project-owned development generation; human rights/provenance review required
runtime_files: public/assets/locations/boarding-house-lobby.webp (1448x1086, converted with Pillow, quality 90, method 6, RGB, no cleanup or repainting)
```

Verified from the file: RGB PNG, 1448x1086. Viewed at full size: no people or animals, no legible text or numerals (mailbox plates, key tags, notices, ledger pages and the telephone dial are blank), no border, halo or vignette.

Flag for the reviewer: the folded newspaper on the bench at the bottom left reads as grey column texture, not words. The landlady's portrait covers most of that corner in the game.

## Wiring

- `src/app/AppShell.ts`: `LOCATION_SCENE_ART['boarding-house'].background` is now `boarding-house-lobby.webp` (the landlady scene). A new `HOME_HUB_BACKGROUND` constant points the Home Menu at the existing `boarding-house.webp` room.
- `index.html`: the Home Menu dialog now uses the same scene structure as the dialogue dialog (`has-scene-art`, a `.scene` with a `#home-hub-background` element and the card as a `.scene-panel`). Every Home Menu control, id and text is unchanged.
- `src/styles.css`: the Home Menu panel reads left to right and is a little wider than a dialogue panel (`min(54%, 34rem)`), with extra left padding so text stays on the panel's solid part.
- `tests/bellhaven-landlady.test.ts` and `tests/home-hub-markup.test.ts` cover both backgrounds and the new markup.

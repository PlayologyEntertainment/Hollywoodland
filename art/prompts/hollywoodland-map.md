# Art brief: the map of Hollywoodland (Union Bus Depot)

Status: **approved by the owner and merged, 2026-09-30** (one take, accepted as generated when the owner asked for the map screen to be committed and merged). The second-round ideas under "Notes for the reviewer" remain open if the owner wants them.

## What it is

The illustrated map the Union Bus Depot opens: a stylized 1930s pictorial map in a 3/4 aerial perspective (a high oblique bird's-eye view looking north) that blends the game's five places into one continuous landscape, with loosely real compass sense compressed into a single scene:

| Region | Where on the picture | What is painted |
|---|---|---|
| Santa Monica Pier | lower left, on the coast | A long wooden pier into the Pacific with a Ferris wheel, a carousel hippodrome, a dance pavilion and rides; beach with striped umbrellas |
| Hollywood Bowl | upper left, in the hills | The white band-shell amphitheater with its seating, lantern-lit picnic boxes and a crowd arriving |
| Hollywood Boulevard | centre | A palm-lined avenue with a streetcar and period cars, the pagoda-roofed movie palace with its marquee, the Art Deco diner, shops, the boarding house, and the Art Deco bus depot with a bus at the avenue's left end |
| Griffith Observatory | upper right, on a hilltop | The pale Art Deco observatory with its copper domes above the city lights |
| Monarch Pictures studio lot | lower right | The walled studio compound with its wrought-iron gate, soundstage hangars, water tower and backlot |

There is **no text, lettering or label anywhere in the picture**: the game draws the region names and status tags over it.

## How the game uses it

- `public/assets/ui/hollywoodland-map.webp` (1536 x 1024, lossy quality 88, 718 KB) is shown twice in `src/app/BusMap.ts`: dimmed and drained of colour as the base, and in full colour clipped to each lit region on top. The player's own region is always lit; a hovered or focused one lights part-way; a selected one is lit with a gold outline.
- The five region outlines are hand-drawn polygons over the art in `src/game/WorldMap.ts`, edge to edge with no gaps (`tests/world-map.test.ts` checks they tile the picture). They are not derived from the art, so if the picture is regenerated or swapped, redraw them (draw the polygons over the new art and check it the way the test does).
- The artwork was chosen so each region has strong colours and reads well when its neighbours are dimmed.

## Prompt

`art/generated/hollywoodland-map/prompt-r1.txt`. Key points: a stylized, illustrated 1930s pictorial map in a 3/4 aerial perspective, golden-hour gouache with fine linework; full-bleed landscape 3:2 with no frame, border, vignette, glow or drop shadow; five distinct, roughly equal districts separated by natural boundaries (a boulevard, a belt of palms, a ridge, the shoreline); the ocean down the left edge and hills along the top; each district's landmarks listed; slightly exaggerated landmark sizes and a clear, map-like layout; **no text, labels, numbers, legend, compass rose, title banner or logos**. Style reference: `art/Hollywoodland_Concept_Map_Landscape.png`, for rendering style, palette and lighting only, not composition.

## Provenance record

```text
asset_id: ui_map_hollywoodland_v1
asset_type: UI illustration (full-bleed, opaque), the Union Bus Depot map
prompt_or_brief: this file; art/generated/hollywoodland-map/prompt-r1.txt
reference_asset_ids: art/Hollywoodland_Concept_Map_Landscape.png (style only)
generation_tool_and_version: gpt-image-2 via gg-image (Codex ChatGPT backend), --size 1536x1024 --quality high
generation_date: 2026-09-30
raw_source_location: art/generated/hollywoodland-map/map-take1.png (1536 x 1024 PNG, 3.9 MB; take1.log has the request record)
human_edits: none to the drawing. Deterministic processing only: PNG to WebP (Pillow, quality 88, method 6), no resizing
originals: none (new asset)
review_status: approved by the owner (2026-09-30, take 1)
rights_or_license_notes: project-owned development generation; human rights/provenance review required
runtime_files: public/assets/ui/hollywoodland-map.webp
```

## Notes for the reviewer

- **Exception to the standing "transparent background" rule**: this is a full-bleed scene, not a character or prop, so it is opaque by design. The "no outer glow, no vignette, no drop shadow" rule still applies and was in the prompt.
- **Overall**: the layout follows the brief. The Pier, Bowl, Observatory, Boulevard and studio lot are each clearly their own district; the depot with a bus is visible at the Boulevard's left end, which is where the player starts.
- **Places to look at closely**: whether the Boulevard and Pier regions should be separated more clearly on the coast road (their shared edge runs along the beachfront); whether the studio lot reads as walled off from the Boulevard (there is a low wall and the gate, but the palace and the soundstage roofs sit close); how busy the picture is at the size it shows in the dialog (it is dense by design, with hundreds of tiny people).
- **Possible second round**: a version with the same layout but more breathing room between districts, or with the depot made larger, if you want the player to find it on the map at a glance.

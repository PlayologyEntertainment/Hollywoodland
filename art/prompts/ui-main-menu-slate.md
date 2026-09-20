# UI art brief: Main Menu film slate

Status: **built and wired into the Main Menu in the working tree for owner review; not committed.** Runtime files are in `public/assets/ui/`.

## What it is

The Main Menu panel is now a 1930s film slate: a black-and-white striped clapper stick propped open on top of a chalk slate with a worn wooden frame. The top of the board carries hand-written chalk fields and doodles; the lower part is a clear board that holds the live menu text (logo, four buttons, build label). The panel is about 860 x 583 px at 1920 x 1080 (the old dark panel was 704 x 500).

## Choices made with the owner

- Look: classic chalk slate (black board, worn wooden frame, white painted grid lines, hand chalk lettering).
- Footprint: the wider slate, about 860 x 600. Buttons sit in a 2 x 2 grid to save height.
- Details: filled-in slate fields, doodles, crew scribbles, wear and tear.
- Static image (no separate clapper stick or clap animation).
- Owner feedback on the text, after the first take: remove the CAMERA field, extend DIRECTOR across its space, and replace "MAX MARQUEE" with "PLAYOLOGY ENTERTAINMENT".
- Owner request: replace the "Hollywoodland" heading text on the menu with the logo `art/Hollywoodland_Logo.png`.
- Owner request: remove the "Playology Entertainment presents" and "Everybody comes here to be somebody" lines from the menu and enlarge the logo to fill more of the board (now 58% of the slate width, about 500 px at 860 wide).

## Prompt

Round 2, used for the source image: `art/generated/main-menu-slate/prompt-slate-r2.txt`. Key points: a straight-on 3:2 slate with a slim striped clapper and brass hinge; only the upper 30 percent of the board carries writing, in exactly two rows of fields (PROD. HOLLYWOODLAND / DIRECTOR / CAMERA, then SCENE 1 / TAKE 47 with 44, 45, 46 crossed out / ROLL A / DATE 1935); doodles (stars, film reel, palm tree, tiny Hollywood sign, paw print) and the scribbles QUIET ON THE SET!, PRINT IT! and STARRING: SOMEBODY at the ends of that band; a coffee ring on the frame, masking tape, scratches and a chipped corner; the lower 70 percent of the board left completely clear; fully transparent background, no glow, no drop shadow (the standing rules). Generated with `--size 1536x1024 --quality high --background transparent`; reference `public/assets/ui/hollywoodland-splash.webp` for rendering style only.

Round 1 (two takes) had the fields taking too much of the board, leaving only about 200 px of clear board at 860 px wide against the roughly 330 px the menu text needs, so it was regenerated with a compact two-row top and a larger clear area. Round 1 files were discarded.

Edit round: `art/generated/main-menu-slate/prompt-edit-r1.txt`, applied with gg-image edit to the cropped round 2 image (two takes; take 2 chosen, take 1 had the DIRECTOR text running almost to the divider). The edit re-renders the whole image, so the final slate differs slightly in texture from the round 2 source.

## Provenance record

```text
asset_id: ui_main_menu_slate
asset_type: UI panel art, transparent-background cutout (nine-slice)
prompt_or_brief: this file; art/generated/main-menu-slate/prompt-slate-r2.txt and prompt-edit-r1.txt
reference_asset_ids: hollywoodland_splash (style only)
generation_tool_and_version: gpt-image-2 via gg-image (Codex ChatGPT backend), --background transparent, --quality high
generation_date: 2026-09-20
raw_source_location: art/generated/main-menu-slate/slate-source.png (round 2 take 1) and slate-source-edit.png (after the Camera/Director edit)
human_edits: none to the drawing. Deterministic processing only: crop to the silhouette plus 4 px, alpha >= 250 set to 255 and alpha <= 3 set to 0
master_file: art/generated/main-menu-slate/main-menu-slate-master.png (1516 x 1027, lossless)
review_status: pending owner review
rights_or_license_notes: project-owned development generation; human rights/provenance review required. The names on the slate are the studio name and invented crew names; no real-person likeness.
runtime_files: public/assets/ui/main-menu-slate.webp (1516 x 1027 RGBA, lossy quality 90, alpha_quality 100) and public/assets/ui/hollywoodland-logo.webp
```

Logo: `public/assets/ui/hollywoodland-logo.webp` is `art/Hollywoodland_Logo.png` (2172 x 724, already transparent) cropped to its silhouette plus 6 px and resized to 1300 x 321, WebP quality 90, alpha_quality 100. The drawing is unchanged.

## How it is built in the game

- `src/styles.css`, `.title-panel`: the slate is a CSS nine-slice `border-image` (slice 493 66 83 68 of the 1516 x 1027 image). The border widths are the slice sizes scaled to the panel width (`--slate-w`), so the clapper and fields keep their proportions and the clear board stretches when the text needs more room (small screens, larger text scale). The old dark panel, border and box shadow are gone; a `drop-shadow` filter shades the slate's silhouette.
- `.title-panel[hidden] { display: none; }` is required: the panel now sets an explicit `display`, which otherwise overrides the browser's rule for the `hidden` attribute and leaves the slate showing on the Boulevard and creator screens (this bug was found in review and fixed).
- `index.html`: the heading is `<h1 id="game-title"><img class="title-logo" ... alt="Hollywoodland"></h1>`, so the panel keeps its accessible name.
- On screens 780 px wide or narrower (or 620 px tall or shorter) the buttons stack in one column, the logo takes 80% of the panel width, and the build label is hidden, as before.

## Known issues for the reviewer

- The clear board is about 256 px tall at 860 px wide, so the layout is tight; text scale above 100% makes the slate grow taller rather than the text shrink.
- The slate uses fixed art, so the high-contrast setting changes only the live text, not the board.

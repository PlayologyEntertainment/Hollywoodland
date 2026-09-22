# UI art brief: Header icon buttons (Film Look, Fullscreen)

Status: **approved by the owner, promoted to `public/assets/ui/`, and wired into the header.** Owner follow-up after approval: match the icon buttons' size to the footer's Menu button (2rem tall) and add a tooltip to both — both done, see "How it is built in the game" below.

## What it is

Two small icon glyphs to replace the text labels on two of the three header buttons (`#film-mode`, `#fullscreen`), per the owner's request. The third header button, Career (`#status-button`), is a separate change — it keeps its text label but is to be restyled to match the rounded-rectangle buttons in the footer (`#advance-time`, `#return-menu`); no new art needed for that one.

- **Film Look** (`icon-film-look-clean.png`): a classic circular film reel, gold line-art.
- **Fullscreen** (`icon-fullscreen-v2-clean.png`): four L-shaped corner brackets forming one shared square (a standard "expand" glyph), gold line-art.

Both: monochrome gold (#d8ad58) flat linework, transparent background, no shading/glow/drop-shadow, 1254x1254 source canvas with generous padding, generated at `--size 1024x1024 --quality high --background transparent` (the tool pads to 1254x1254). Checked at actual production size (40x40, composited on black) — both read clearly.

## Choices made with the owner (via clarifying questions before generating)

- Icon style: gold linework matching the app's existing deco accents, not richer/shaded illustration.
- Film Look's on/off state: one icon, highlighted (not swapped for a second icon) when active — the accessible name still changes via `aria-label`/`aria-pressed`, same mechanism as today's text swap.
- Icon-only square buttons, no visible label alongside the icon.
- Stage in `art/generated/` for review before promoting to `public/assets/` or touching `index.html`/`AppShell.ts`.

## Prompt and generation notes

Both generated via `gg-image` (gpt-image-2, Codex/ChatGPT backend), `--background transparent --quality high --size 1024x1024`.

- **Film reel**, first take (`icon-film-look.png`): visually fine at full size, but a close pixel check found the "transparent" regions carried scattered near-invisible noise pixels (mostly solid yellow or pink at alpha 1-3 out of 255) — about 270,000 of them in the sampled areas. Individually near-zero opacity, but dense enough that they visibly fringe/speckle when the image is downsampled (exactly what a 40px button render would do). Cleaned with the same deterministic alpha-threshold pass used on earlier assets in this project (alpha <= 3 -> 0, alpha >= 250 -> 255); saved as `icon-film-look-clean.png`. The uncleaned original is kept alongside for reference.
- **Fullscreen**, second take (`icon-fullscreen-v2.png`; a first take `icon-fullscreen.png` looked near-identical and was superseded): same alpha-cleanup pass applied defensively, saved as `icon-fullscreen-v2-clean.png`. This one's transparency was already clean (no meaningful noise found on inspection) — the cleanup is a no-op safeguard here, not a fix.

## Files in `art/generated/header-icons/`

- `icon-film-look.png` — raw first take (has the noise described above; kept for reference, not for use)
- `icon-film-look-clean.png` — **use this one**
- `icon-fullscreen.png` — raw first take (superseded, kept for reference)
- `icon-fullscreen-v2.png` — raw second take
- `icon-fullscreen-v2-clean.png` — **use this one**
- `preview-film-40.png`, `preview-fullscreen-40.png` — 40x40 legibility check, composited on black and upscaled with nearest-neighbor for inspection (not runtime art)

## Provenance record

```text
asset_id: ui_header_icon_film_look
asset_type: UI icon, transparent-background line-art glyph
prompt_or_brief: this file
generation_tool_and_version: gpt-image-2 via gg-image (Codex ChatGPT backend), --background transparent, --quality high, --size 1024x1024
generation_date: 2026-09-21
raw_source_location: art/generated/header-icons/icon-film-look.png
human_edits: deterministic alpha-threshold cleanup only (alpha <= 3 -> 0, alpha >= 250 -> 255); no drawing edits
master_file: art/generated/header-icons/icon-film-look-clean.png (1254 x 1254 RGBA)
review_status: pending owner review
rights_or_license_notes: project-owned development generation; no real-person likeness

asset_id: ui_header_icon_fullscreen
asset_type: UI icon, transparent-background line-art glyph
prompt_or_brief: this file
generation_tool_and_version: gpt-image-2 via gg-image (Codex ChatGPT backend), --background transparent, --quality high, --size 1024x1024
generation_date: 2026-09-21
raw_source_location: art/generated/header-icons/icon-fullscreen-v2.png
human_edits: deterministic alpha-threshold cleanup only (no-op safeguard; source was already clean); no drawing edits
master_file: art/generated/header-icons/icon-fullscreen-v2-clean.png (1254 x 1254 RGBA)
review_status: pending owner review
rights_or_license_notes: project-owned development generation; no real-person likeness
```

## How it is built in the game

- **Promotion**: both master PNGs were cropped to their silhouette plus 8% padding, padded square, resized to 256x256, and saved as WebP (quality 90, alpha_quality 100, method 6 — the same settings `art/generated/player-characters/tools/build_player_art.py` uses) to `public/assets/ui/icon-film-look.webp` and `public/assets/ui/icon-fullscreen.webp`.
- **Markup** (`index.html`): `#film-mode` and `#fullscreen` are `class="chrome-button icon-button"`, each holding one `<img alt="">` (decorative; the accessible name is the button's own `aria-label`). No `title` attribute: an earlier pass added one alongside `aria-label` as a fallback, but that draws the browser's own plain tooltip on top of the on-theme CSS one below, so it was removed. `#status-button` (Career), and the footer's `#advance-time`/`#return-menu`, are also `class="chrome-button deco-label"` — one shared class for "the small rounded-rectangle button," so all five (Career, Film Look, Fullscreen, Wait, Menu) look alike. An earlier pass gave Film Look/Fullscreen a separate `.text-button` square/hairline look instead; the owner asked for them to match Career's rounded rectangle, so `.text-button` was retired entirely (nothing used it once these two moved off it) and folded into `.chrome-button`.
- **Styling** (`src/styles.css`):
  - `.chrome-button` carries the shared size (2rem tall) that used to live on `.game-footer button`; `.chrome-button[aria-pressed="true"], .chrome-button[aria-expanded="true"]` gives both Career (panel open) and Film Look (active) the same gold highlight.
  - `.chrome-button.icon-button` (a combined selector, so it wins on specificity regardless of source order) overrides the auto-width padding with a fixed 2rem square for just Film Look and Fullscreen; `.icon-button` alone centers the icon image and tooltip positioning.
  - `.icon-button::after` draws the on-theme dark/gold tooltip below the button on hover or keyboard focus, reading its text straight from `attr(aria-label)` — one source of truth, no separate tooltip copy to keep in sync.
- **Behavior** (`src/app/AppShell.ts`): `toggleFilmMode` used to swap the button's visible `textContent` between "Film Look" and "Return to Color"; it now updates `aria-label` instead (there is no visible text left to swap), which also updates the CSS tooltip automatically.
- **Tests**: `tests/hud-stats.test.ts` covers the icon buttons' markup/CSS, and that all five buttons share one `.chrome-button` style with no `.text-button` left over.

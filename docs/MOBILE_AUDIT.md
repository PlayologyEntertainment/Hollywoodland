# Mobile audit

Result of Phase 5 of [MOBILE_PLAN.md](MOBILE_PLAN.md), run on 2026-10-01 against `main` (after the Phase 4 fixes). It records what was checked, how, and what was not.

## How it was checked

Playwright (a dev dependency) drives headless Chromium with touch and a mobile viewport against `npm run dev`, starting a new career and taking screenshots of each screen. Two scripts did the work: one that walks the street and opens every location dialog, and one that visits the title, creator, HUD and Career panel at each size below and measures the page (page errors, horizontal or vertical page scroll, and every visible button, select and input under 44px tall). The scripts are throwaway and are not in the repo. `?touch=1` forces touch mode in a desktop browser.

## Sizes

| Size | What it stands for | Result |
| --- | --- | --- |
| 568×320 | smallest landscape phone | works; the creator stacks into one scrolling column |
| 667×375 | iPhone SE / 8, landscape | works; creator keeps three panes |
| 844×390 | typical phone, landscape | works; picture is pillarboxed (see below) |
| 932×430 | large phone, landscape | works |
| 390×844 | phone upright | rotate prompt covers the screen |
| 1024×768 touch | tablet | works; touch controls sit inside the picture, above the footer |
| 700×1000, no touch | narrow, tall desktop window | works; Quest Helper drops to a strip under the footer |
| 1280×720, no touch | desktop | unchanged |

On every touch size: no page errors, no page scroll in either direction, and no control under 44px tall.

## What each phase delivered, as seen

- **Safe areas, touch mode, rotate prompt (1):** the rotate prompt shows upright on touch devices; touch mode follows `(pointer: coarse)`.
- **Floating header (2):** the picture fills the screen height; Menu and Wait sit in the header; the Terms and Privacy links are at the bottom of Settings and open the pages.
- **Touch controls (3):** walking pad bottom left, Interact button bottom right naming what is in reach; both hide for dialogs and the Career panel. A very quick tap used to be missed; a press now counts for 150ms after release.
- **Dialogs and menus (4):** the eight location dialogs, Home Hub, Settings, Save Options, Terms and the map are full-screen on phones and scroll inside. The map lays out beside its info column, and travel takes a second tap. The title slate fits a short screen (its logo was previously cut off by the slate), the splash is two-column, and the Career panel is a full window over the HUD.

## Not checked

- **The audition dialog.** The script never reached one. It uses the same full-screen dialog rules as the others.
- **Real devices.** Everything above is emulation. Safe-area insets (notch, home indicator), the on-screen keyboard, iOS zoom-on-focus and real finger feel on the walking pad have not been tried on a phone.
- **Other languages.** Longer German, French and Portuguese text was not screenshotted in the phone layouts. The two-tap map hint and the rotate prompt are translated.
- **The Chapter title page, the level-up banner, the toast, and the Film Look filter** on a phone.
- **Phones in portrait.** Not supported by design (landscape only).
- **Performance** on low-end phones.

## Known limits

- **Pillarboxing.** The game is a fixed 16:9 picture. A phone wider than that (844×390 is about 2.2:1) shows black bars at the sides. The touch controls sit on those bars. Filling the width would crop the top and bottom of the street.
- **The creator** stacks into one scrolling column under 640px wide, so on the smallest phones the portrait and origin are below the fold.
- **Hover tooltips** are off on touch; icon buttons rely on their icons.
- **PWA, offline and native wrapping** are not started (see the plan's "Later").

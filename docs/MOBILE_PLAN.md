# Mobile usability plan

Decisions (2026-10-01): on-screen joystick + action button; **landscape only** (portrait shows a rotate prompt); **mobile browser first** (PWA install and native wrapping come later).

The pain points this answers: HUD and text too small; no way to walk or interact by touch; dialogs and menus overflow or clip; the canvas is small and letterboxed.

## Where we started

- The Phaser canvas is fixed at 1920×1080 with `Scale.FIT`, between a header and footer sized for desktop. On a landscape phone, the bars and letterboxing eat most of the height.
- Input is keyboard only (`src/input/InputController.ts`).
- Controls are desktop-sized: `.chrome-button` is 2rem tall, menu buttons about 2.2rem, HUD text `.6–1.15rem`. Comfortable touch targets are about 44px.
- No `viewport-fit=cover` and no `env(safe-area-inset-*)`, so notches and home indicators clip UI.
- Few breakpoints, mostly for the title screen and creator. The dialogs have no small-screen pass.

## What we borrow from Otaku Palace (`C:\OtakuPalace`)

- `viewport-fit=cover` plus `env(safe-area-inset-top/bottom)` padding on the shell.
- A 44px minimum height on interactive controls.
- Fluid `clamp()` sizing, with breakpoints at 640 / 480 / 360px.
- The lesson of its mobile audit (`docs/design/11-mobile-audit.md`, inherited from Fibs & Flannel): test at real device widths. One action bar silently dropped a button below about 390px.

## Status

Phases 1–5 are done. What was checked, and what was not, is in [MOBILE_AUDIT.md](MOBILE_AUDIT.md).

Changes after the plan, at the owner's request (2026-10-01; details under "Later changes" in the audit): a tighter phone header and overlays, with 24px header buttons chosen over keeping the 44px touch minimum; half-width touch controls with an Enter/Go label; desktop keeps the film-strip notices; and the Playology logo link.

## Phases

### Phase 1: Foundation
1. Viewport meta with `viewport-fit=cover`; `100dvh` and safe-area padding on the app shell.
2. A `touch` class on `<html>`, set from `matchMedia('(pointer: coarse)')`, so mobile rules key off input type rather than width alone.
3. `touch-action: manipulation` on the page (no double-tap zoom) and `touch-action: none` on the game canvas (no pinch/pan over the game). Pinch-zoom is kept over menus and dialogs, for accessibility.
4. A "Rotate your phone" overlay in portrait on touch devices.

### Phase 2: Canvas and scale
1. On touch devices, make the header a slim overlay and collapse the footer so the canvas fills nearly the whole landscape screen.
2. Compact HUD strip (place, cash, time, menu button); secondary buttons move into a menu sheet.
3. Check scene framing (`PictureCover`, camera) so the character and street stay large.

### Phase 3: Touch controls
1. Extend `InputController` with virtual input that sets pressed state for `moveLeft`, `moveRight` and `interact`, leaving the scene code untouched.
2. A left/right drag zone (or simple stick) at bottom-left; an Interact button at bottom-right, shown when an interaction is available.
3. Small Journal and Pause buttons clear of the thumbs.
4. Touch UI only in `touch` mode, hidden while a dialog is open. Multi-touch: move and interact at once.

### Phase 4: Dialogs and menus
1. Every dialog: `max-height: 100dvh`, internal scrolling, sticky button footer; full-screen sheets on phones, centred cards from tablet width up.
2. 44px minimum on every button and list row in touch mode; 16px font on inputs (stops iOS zoom-on-focus).
3. Per-screen pass: title, splash, creator, interaction, audition, home hub, save options, settings, legal, quest log, map. On the map, tap selects and a second tap confirms (no hover on touch).

### Phase 5: Verify
1. Browser checks at 844×390, 667×375, 932×430, 390×844 (portrait prompt) and 320px minimum.
2. Vitest for the input mapping and touch-mode class; screenshot checks of the dialogs.
3. Record what was and was not verified in a short audit note.

## Later
PWA manifest and install, service worker, native wrapper.

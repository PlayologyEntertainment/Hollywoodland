# Hollywoodland

Hollywoodland is a free, single-player, side-scrolling web RPG about arriving in 1935 Hollywood with almost nothing and building a career as a film star. The player creates an original performer, navigates a romanticized Golden Age dream factory, takes survival jobs, builds relationships, auditions for roles, manages money and energy, and shapes a branching career with multiple endings.

The design package was approved by the owner on September 12, 2026. The current build is a **Phase 1 spike with Phase 2 systems already running**: the player picks a portrait and origin, walks a layered Hollywood Boulevard, enters buildings, talks through branching dialogue, takes quests and scheduled assignments, auditions, manages money, energy and reputation, and can switch into the living-film treatment. Saves are local, with export/import. The interface is available in English, plus Spanish, French, German and Brazilian Portuguese drafts marked Beta.

## Approval package

1. [`GAME_DESIGN_DOCUMENT.md`](docs/GAME_DESIGN_DOCUMENT.md) — product vision and systems.
2. [`VERTICAL_SLICE_SPEC.md`](docs/VERTICAL_SLICE_SPEC.md) — the first polished 45–90 minute playable milestone.
3. [`TECHNICAL_IMPLEMENTATION_PLAN.md`](docs/TECHNICAL_IMPLEMENTATION_PLAN.md) — architecture, browser, save, analytics, performance, and testing plan.
4. [`CONTENT_AND_ASSET_PIPELINE.md`](docs/CONTENT_AND_ASSET_PIPELINE.md) — authored-content and generated-art pipeline.
5. [`PRODUCTION_ROADMAP.md`](docs/PRODUCTION_ROADMAP.md) — gated delivery sequence.
6. [`PHASE_1_VISUAL_SPIKE.md`](docs/PHASE_1_VISUAL_SPIKE.md) — the original visual spike proof and review checklist.
7. [`DECISION_LOG.md`](docs/DECISION_LOG.md) — approved decisions and open questions; the source of truth when documents disagree.
8. [`LOCALIZATION_PLAN.md`](docs/LOCALIZATION_PLAN.md), [`AUDIO_PROVENANCE.md`](docs/AUDIO_PROVENANCE.md) and [`deploy.md`](docs/deploy.md) — localization, audio licensing, and Hostinger deployment.
9. [`MOBILE_PLAN.md`](docs/MOBILE_PLAN.md) and [`MOBILE_AUDIT.md`](docs/MOBILE_AUDIT.md) — the landscape-only phone pass, and what was and was not checked.

## Development gate

Phase 1 is not closed: it still needs the measured feasibility report and final asset and frame budgets (`docs/PRODUCTION_ROADMAP.md`). Bulk art production stays gated on that. Scope must not expand beyond the approved vertical slice without explicit owner approval.

## Local development

Requires Node.js 24 or newer.

```bash
npm install
npm start
```

`npm start` launches the Vite development server and opens the game in the default browser. Do not open the repository's root `index.html` directly: it contains TypeScript module entry points that Vite must compile and serve. For a production-style local check, run `npm run build` followed by `npm run preview`.

Quality checks:

```bash
npm run typecheck
npm test
npm run build
```

CSS changes: run `npm run build` too, not just the tests. The production minifier rejects some rules that browsers silently ignore (for example a comma in an `@container` condition; use `or`), and CI fails on them.

Visual checks: `playwright` is a dev dependency (browsers install with `npx playwright install chromium`). Write a throwaway script that drives the dev server with a phone-sized viewport (`hasTouch` and `isMobile`) and takes screenshots; `?touch=1` forces touch mode in any browser.

Content and planning tools (stand-alone pages; see `docs/dev/`):

- **Story Planner** (`docs/dev/story-planner-tool.md`): see everything the game has written, edit it, and plan chapters, storylines and beats. After changing game text, quests, assignments or translations, run `npm run narrative:export` to refresh its snapshot (`tools/story-planner/data/narrative-snapshot.json`); `npm test` fails when it is stale. It lives in `tools/`, outside `public/`, so it and the story plan are never part of the production build.
- **Boulevard Art Director** (`docs/dev/boulevard-art-director-tool.md`) and **Walk-Cycle Director** (`docs/dev/walk-cycle-director-tool.md`).

## Controls

- `A`/`D` or Left/Right Arrow — walk
- `E` or Enter — interact
- Touch (a phone held sideways) — slide the pad at the bottom left to walk; the button at the bottom right says Enter or Go when something is in reach; Career, Menu and Wait are in the header
- `Esc` — close an open dialog
- On-screen controls — Film Look, Fullscreen, Career, Wait and Menu; Save Options (save slots, export, import) and Settings are on the Main Menu

## Product constraints

- Desktop Chrome and Safari; keyboard and mouse. Phones held sideways in a mobile browser are also supported, with on-screen controls (upright, a rotate prompt is shown). Add `?touch=1` to the address to see the phone layout in a desktop browser.
- Hosted as a fullscreen-capable app at `playologyentertainment.com/hollywoodland`.
- Responsive 16:9 baseline at 1920×1080, with ultrawide scenery extension.
- Target 60 FPS at 1080p on a midrange desktop.
- Accountless, browser-local saves with export/import.
- No runtime generative AI, advertisements, or purchases.
- Traditional frame-by-frame sprite animation.
- All dialogue is authored and text-based; music and sound carry the audio presentation.

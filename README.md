# Hollywoodland

Hollywoodland is a free, single-player, side-scrolling web RPG about arriving in 1935 Hollywood with almost nothing and building a career as a film star. The player creates an original performer, navigates a romanticized Golden Age dream factory, takes survival jobs, builds relationships, auditions for roles, manages money and energy, and shapes a branching career with multiple endings.

This repository is currently in **design approval**. The files under [`docs/`](docs/) define the approved product direction and the proposed implementation. They do not authorize game implementation.

## Approval package

1. [`GAME_DESIGN_DOCUMENT.md`](docs/GAME_DESIGN_DOCUMENT.md) — product vision, core loop, world, systems, progression, narrative, presentation, and accessibility.
2. [`VERTICAL_SLICE_SPEC.md`](docs/VERTICAL_SLICE_SPEC.md) — the first polished 45–90 minute playable milestone and its acceptance criteria.
3. [`TECHNICAL_IMPLEMENTATION_PLAN.md`](docs/TECHNICAL_IMPLEMENTATION_PLAN.md) — proposed architecture, data boundaries, browser targets, saving, analytics, performance, deployment, and testing.
4. [`CONTENT_AND_ASSET_PIPELINE.md`](docs/CONTENT_AND_ASSET_PIPELINE.md) — authored-content workflow plus ChatGPT Images 2.5 sprite, environment, UI, and audio pipeline.
5. [`PRODUCTION_ROADMAP.md`](docs/PRODUCTION_ROADMAP.md) — gated delivery sequence, review checkpoints, risks, and definition of done.
6. [`DECISION_LOG.md`](docs/DECISION_LOG.md) — concise record of interview decisions and working assumptions.

## Approval gate

Implementation must not begin until the owner approves this package. Approval should explicitly resolve every item marked **Owner approval required** in the documents. Once approved, the first implementation change should establish the project skeleton and automated checks only; it should not silently expand the vertical-slice scope.

## Product constraints

- Desktop Chrome and Safari; keyboard and mouse.
- Hosted as a fullscreen-capable app at `playologyentertainment.com/hollywoodland`.
- Responsive 16:9 baseline at 1920×1080, with ultrawide scenery extension.
- Target 60 FPS at 1080p on a midrange desktop.
- Accountless, browser-local saves with export/import.
- No runtime generative AI, advertisements, or purchases.
- Traditional frame-by-frame sprite animation.
- All dialogue is authored and text-based; music and sound carry the audio presentation.


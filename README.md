# Hollywoodland

Hollywoodland is a free, single-player, side-scrolling web RPG about arriving in 1935 Hollywood with almost nothing and building a career as a film star. The player creates an original performer, navigates a romanticized Golden Age dream factory, takes survival jobs, builds relationships, auditions for roles, manages money and energy, and shapes a branching career with multiple endings.

The design package was approved by the owner on September 12, 2026. The current build is the **Phase 1 visual gameplay spike**: an animated protagonist can explore a layered Hollywood Boulevard, discover the casting office, trigger a semantic story encounter, switch into the living-film treatment, and save/export/import progress.

## Approval package

1. [`GAME_DESIGN_DOCUMENT.md`](docs/GAME_DESIGN_DOCUMENT.md) — product vision and systems.
2. [`VERTICAL_SLICE_SPEC.md`](docs/VERTICAL_SLICE_SPEC.md) — the first polished 45–90 minute playable milestone.
3. [`TECHNICAL_IMPLEMENTATION_PLAN.md`](docs/TECHNICAL_IMPLEMENTATION_PLAN.md) — architecture, browser, save, analytics, performance, and testing plan.
4. [`CONTENT_AND_ASSET_PIPELINE.md`](docs/CONTENT_AND_ASSET_PIPELINE.md) — authored-content and generated-art pipeline.
5. [`PRODUCTION_ROADMAP.md`](docs/PRODUCTION_ROADMAP.md) — gated delivery sequence.
6. [`PHASE_1_VISUAL_SPIKE.md`](docs/PHASE_1_VISUAL_SPIKE.md) — current implementation proof and review checklist.

## Development gate

The current build is for Phase 1 technical and visual approval. Story production and bulk asset creation remain blocked until this spike is reviewed. Scope must not expand beyond the approved vertical slice without explicit owner approval.

## Local development

Requires Node.js 24 or newer.

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run typecheck
npm test
npm run build
```

## Controls

- `A`/`D` or Left/Right Arrow — walk
- `E` or Enter — interact
- On-screen controls — film look, fullscreen, status, save, export, and settings

## Product constraints

- Desktop Chrome and Safari; keyboard and mouse.
- Hosted as a fullscreen-capable app at `playologyentertainment.com/hollywoodland`.
- Responsive 16:9 baseline at 1920×1080, with ultrawide scenery extension.
- Target 60 FPS at 1080p on a midrange desktop.
- Accountless, browser-local saves with export/import.
- No runtime generative AI, advertisements, or purchases.
- Traditional frame-by-frame sprite animation.
- All dialogue is authored and text-based; music and sound carry the audio presentation.

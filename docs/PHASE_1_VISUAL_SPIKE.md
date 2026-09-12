# Phase 1 Visual Gameplay Spike

Status: **Implementation review build**

This milestone turns the foundation scene into a reviewable Hollywood Boulevard experience while remaining inside the approved Phase 1 gate.

## Included proof

- 5,600-pixel-wide layered Boulevard with seven distinctive period storefronts, distant Hollywood hills, traffic, street lighting, palms, and depth staging.
- Generated eight-frame traditional walk-cycle reference, loaded as a Phaser sprite sheet.
- Camera follow, movement, interaction proximity, and one semantic DOM story encounter at the casting office.
- Switchable black-and-white living-film treatment with grain, exposure movement, and reduced-motion/effects alternatives.
- Fullscreen control, responsive 1920×1080 scaling, and an on-screen FPS diagnostic.
- IndexedDB manual save/continue plus validated JSON export/import.

## Review boundaries

The protagonist sprite is a pipeline-feasibility reference, not an approved final hero or Character Creator option. Storefront names and the casting-office dialogue are working review copy. Bulk character, environment, and narrative production remain blocked until owner visual approval.

## Asset record

`public/assets/characters/aspiring-actor-walk.webp`

- Source: ChatGPT built-in image generation workflow.
- Purpose: eight-frame side-view traversal feasibility test.
- Layout: 4 columns × 2 rows; 384 × 512 pixels per source cell.
- Prompt intent: consistent original 1935 aspiring actor, retro hand-painted cel animation, transparent background, no text or scenery.
- Cleanup status: losslessly dimensioned WebP delivery conversion; in-engine frame alignment and alpha behavior require owner review before final cleanup.

## Review checklist

- [ ] Character silhouette, scale, and movement cadence feel appropriate.
- [ ] Boulevard camera height and environmental density match the desired side-scrolling presentation.
- [ ] Color palette feels vivid while remaining period-romanticized.
- [ ] Living-film mode feels cinematic without obscuring gameplay.
- [ ] Chrome sustains the 60 FPS target on the named test machine.
- [ ] Safari scaling, fullscreen, storage, and import/export smoke test passes.

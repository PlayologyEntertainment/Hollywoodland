# Phase 1 Visual Gameplay Spike

Status: **Implementation review build**

This milestone turns the foundation scene into a reviewable Hollywood Boulevard experience while remaining inside the approved Phase 1 gate.

## Included proof

- High-fidelity 2,592-pixel-wide Boulevard review level built from the approved ChatGPT Images concept, with richly rendered period architecture, Hollywood hills, traffic, street lighting, palms, and cinematic depth.
- True-alpha foreground palm, streetlamp, and period sedan assets generated as independently placeable depth layers.
- Generated eight-frame traditional walk-cycle reference, loaded as a Phaser sprite sheet.
- Camera follow, movement, interaction proximity, and one semantic DOM story encounter at the casting office.
- Switchable black-and-white living-film treatment with grain, exposure movement, and reduced-motion/effects alternatives.
- Fullscreen control, responsive 1920×1080 scaling, and an on-screen FPS diagnostic.
- IndexedDB manual save/continue plus validated JSON export/import.

## Review boundaries

The protagonist sprite is a pipeline-feasibility reference, not an approved final hero or Character Creator option. Storefront names and the casting-office dialogue are working review copy. Bulk character, environment, and narrative production remain blocked until owner visual approval.

## Asset record

`public/assets/environments/hollywood-boulevard-concept-v1.webp`

- Source: owner-supplied Hollywoodland concept created with ChatGPT Images.
- Purpose: authoritative high-fidelity Hollywood Boulevard environment layer.
- Source dimensions: 1,942 × 809 pixels; displayed at 2,592 × 1,080 for the 1920 × 1080 game canvas.
- Integration: WebP delivery conversion, aligned sidewalk baseline, casting-office hotspot, subtle entrance glow, atmospheric motes, vignette, and living-film compatibility.
- Visual invariants: original composition, palette, period detail, and authored `HOLLYWOODLAND` hillside sign preserved.

`public/assets/characters/aspiring-actor-walk.webp`

- Source: ChatGPT built-in image generation workflow.
- Purpose: eight-frame side-view traversal feasibility test.
- Layout: 4 columns × 2 rows; 384 × 512 pixels per source cell.
- Prompt intent: consistent original 1935 aspiring actor, retro hand-painted cel animation, transparent background, no text or scenery.
- Cleanup status: losslessly dimensioned WebP delivery conversion; in-engine frame alignment and alpha behavior require owner review before final cleanup.

`public/assets/environments/foreground/hollywood-palm-v1.png`

- Source: ChatGPT built-in image generation workflow.
- Purpose: independently placeable ornamental palm foreground layer.
- Delivery: 640 × 960-pixel RGBA PNG with genuine transparent pixels outside the silhouette, downsampled from the 1,024 × 1,536 generated master.
- Prompt requirement: single complete period boulevard palm, no scenery or simulated transparency; every empty pixel and canvas corner encoded at alpha 0.

`public/assets/environments/foreground/hollywood-streetlamp-v1.png`

- Source: ChatGPT built-in image generation workflow.
- Purpose: independently placeable black-and-brass Art Deco streetlight layer.
- Delivery: 512 × 768-pixel RGBA PNG with genuine transparent pixels outside the silhouette and ironwork, downsampled from the 1,024 × 1,536 generated master.
- Prompt requirement: one complete uncropped streetlamp, no backdrop or checkerboard; every empty pixel and canvas corner encoded at alpha 0.

`public/assets/environments/foreground/hollywood-sedan-v1.png`

- Source: ChatGPT built-in image generation workflow.
- Purpose: independently placeable navy 1930s sedan foreground layer.
- Delivery: 768 × 512-pixel RGBA PNG with genuine transparent pixels around and beneath the vehicle, downsampled from the 1,536 × 1,024 generated master.
- Prompt requirement: one complete uncropped period automobile, no road or scenery; every empty pixel and canvas corner encoded at alpha 0.

All three foreground PNGs were inspected after generation: each reports an `sRGBA` channel set, an alpha minimum of `0`, and a fully transparent top-left corner pixel. Opaque RGB/checkerboard attempts were rejected and are not included in the build.

## Review checklist

- [ ] Character silhouette, scale, and movement cadence feel appropriate.
- [ ] Boulevard camera height and environmental density match the desired side-scrolling presentation.
- [ ] Color palette feels vivid while remaining period-romanticized.
- [ ] Living-film mode feels cinematic without obscuring gameplay.
- [ ] Chrome sustains the 60 FPS target on the named test machine.
- [ ] Safari scaling, fullscreen, storage, and import/export smoke test passes.

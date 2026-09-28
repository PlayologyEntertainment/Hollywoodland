# Favicon: gold statuette

Status: **pending review** (round 3, hero pose). The favicon set is wired into `index.html` at the owner's request.

## Brief

Gold Academy Award style statuette (art deco knight on a film-reel base) on a transparent background, no outer glow. Owner asked for "a gold Academy Award against a black or transparent background" (2026-09-28).

## Prompt

```text
A single polished gold Academy Award style Oscar statuette icon: a stylized art deco golden knight figure standing upright on a small round film reel base, arms crossed holding a sword, front view, centered, filling most of the square frame with a small margin, bold clean dark-brown outlines, flat cel gold colors with simple warm highlights and soft painted shading, 1930s retro-cartoon storybook style, must stay readable as a tiny favicon. Fully transparent background with true alpha transparency. Crisp outline directly against transparency: no outer glow, no halo, no aura, no rim-light bloom, no drop shadow, no ground shadow, no vignette, no background of any kind. No text, letters, numbers, or logos.
```

## Provenance record

- tool: gg-image (gpt-image-2 via Codex backend), `--background transparent --size 1024x1024`, no references
- source: `art/generated/favicon-gold-statuette.png` (1254x1254 RGBA, corners alpha 0)
- runtime files: `public/favicon.ico` (16/32/48), `public/favicon-32.png`, `public/apple-touch-icon.png` (180, on #11100f). All cropped to the figure and downscaled from the source.
- likeness note: the statuette design resembles a trademarked award; review before public launch.

## Open Graph image

`public/og-image.jpg` (1200x630) is composed from `public/assets/ui/hollywoodland-concept-boulevard.webp` (cropped, darkened toward the bottom), `hollywoodland-logo.webp`, and a Limelight tagline "From Rags to Riches in 1930s Hollywood". No new generation.

## Round 2: top hat (2026-09-28)

Owner asked for a slightly oversized top hat so the design stays clear of the trademarked statuette. Generated as an edit of the round 1 source (`--edit-target`, `--background transparent`); output `art/generated/favicon-gold-statuette-tophat.png` (1254x1254 RGBA, corners alpha 0). The runtime favicon files now come from this version. Round 1 is kept for reproducibility.

```text
Same golden statuette on the film reel base, but wearing a slightly oversized, jaunty gold top hat (tall crown with a flat brim and a band) that sits on its head and is noticeably too big, in the same polished gold cel style with bold dark-brown outlines. Make the whole figure a little more compact and cartoonish, with a bigger head and hat, so it reads well as a tiny favicon. Keep the film reel base. Fully transparent background with true alpha transparency. Crisp outline directly against transparency: no outer glow, no halo, no aura, no rim-light bloom, no drop shadow, no ground shadow, no vignette, no background of any kind. No text, letters, numbers, or logos.
```

The body pose and physique are still close to the original statuette, so the likeness caveat above stands. The hat helps but does not fully remove it.

## Round 3: hero pose (2026-09-28)

Owner asked for hands on the hips, a classic Superman power pose. Edited from round 2 (`--edit-target art/generated/favicon-gold-statuette-tophat.png`, `--background transparent`); output `art/generated/favicon-gold-statuette-hero-pose.png` (1254x1254 RGBA, corners alpha 0). Sword removed, arms out, legs apart, so the silhouette is much further from the trademarked statuette than rounds 1 and 2. The runtime favicon files now come from this version.

```text
Same golden statuette with the oversized gold top hat and film reel base, same polished gold cel style and bold dark-brown outlines, but change the pose: remove the sword, and have the figure stand tall in a classic heroic Superman power pose with both fists planted on the hips, elbows out, chest proud, legs planted slightly apart, chin up. Keep the compact cartoonish proportions with a big head and hat so it reads well as a tiny favicon. Fully transparent background with true alpha transparency. Crisp outline directly against transparency: no outer glow, no halo, no aura, no rim-light bloom, no drop shadow, no ground shadow, no vignette, no background of any kind. No text, letters, numbers, or logos.
```

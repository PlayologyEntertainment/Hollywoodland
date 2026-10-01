# Boulevard skies for morning and evening

Status: **Generated 2026-10-01; converted and promoted to runtime 2026-10-01 at the owner's request (visual review of the in-game result still pending).**

## Role in the game

The Boulevard scene's sky (`public/assets/environments/boulevard-v3/sky.webp`) is the Afternoon sky. These two add Morning and Evening. The scene crossfades between the three over about 1.5 seconds when the time slot changes, and grades the rest of the scene to match (see `src/game/TimeOfDay.ts`). The sky is the bottom layer, so unlike characters and props it is a full-frame opaque image: the "transparent background, no glow" rule for cutouts does not apply to it.

## Visual brief

- **Morning:** a little less bright and less saturated than Afternoon, much less cloudy, with only thin high cirrus. Pale cool blue easing to soft peach and cream at the bottom edge.
- **Evening:** golden-hour sunset. Gold and amber at the bottom rising through orange and rose to dusky blue-violet. Clouds in the same soft puffy style as Afternoon but fewer and more widely spaced, undersides lit gold, orange and pink.
- **Both:** same painterly style and brush texture as Afternoon; no sun disc (the sky tiles mirrored side to side, so a sun would double); no ground, buildings, birds, text or vignette.

## Prompts

Both used `--reference` with the existing `sky.webp` (converted to PNG) as style reference, `--size 1920x1080 --quality high`. The backend returned 1672x941 (16:9), below the 1920x1080 of the Afternoon sky; both were upscaled to 1920x1080 on promotion.

### Morning

```text
Wide 16:9 painted sky illustration for a romanticized 1935 Hollywood storybook adventure game, to be the distant sky layer behind a street scene. Match the reference image exactly in painterly rendering style, brush texture, softness and overall composition, but make it an early-morning sky: noticeably less bright and less saturated than the reference, a calm pale cool blue at the top easing into a soft pale peach and cream haze toward the bottom edge. Almost cloudless: only a few thin, wispy, high-altitude cirrus streaks and faint mares-tail strands drifting across the upper two thirds, no puffy cumulus clouds at all. Gentle, even lighting with no sun disc and no visible sun. Full-frame sky only: no ground, no horizon line, no hills, no buildings, no trees, no birds, no text, letters, numbers, logos or signatures, no vignette, no border.
```

### Evening

```text
Wide 16:9 painted sky illustration for a romanticized 1935 Hollywood storybook adventure game, to be the distant sky layer behind a street scene. Match the reference image exactly in painterly rendering style, brush texture, softness and cloud shapes, but make it a golden-hour sunset sky: warm glowing amber and gold near the bottom edge rising through rich orange and rose-pink into a deeper dusky blue-violet at the top. Clouds are the same soft puffy cumulus style as the reference but noticeably fewer and more widely spaced, with generous clear sky between them, their undersides lit in glowing gold, orange and pink and their tops catching a warmer light. The sun is already below the bottom edge: no sun disc and no visible sun, just its glow. Full-frame sky only: no ground, no horizon line, no hills, no buildings, no trees, no birds, no text, letters, numbers, logos or signatures, no vignette, no border.
```

## Provenance records

```text
asset_id: boulevard_sky_morning
asset_type: environment sky layer, full-frame opaque
prompt_or_brief: this file (Morning)
reference_asset_ids: boulevard_v3_sky (public/assets/environments/boulevard-v3/sky.webp), style only
generation_tool_and_version: gpt-image-2 via gg-image (Codex ChatGPT backend), --quality high
generation_date: 2026-10-01
raw_source_location: art/generated/sky-morning.png
human_edits: resized 1672x941 -> 1920x1080 (Lanczos), converted to WebP quality 88
review_status: promoted at the owner's request; in-game review pending
rights_or_license_notes: project-owned development generation; human rights/provenance review required.
runtime_files: public/assets/environments/boulevard-v3/sky-morning.webp
```

```text
asset_id: boulevard_sky_evening
asset_type: environment sky layer, full-frame opaque
prompt_or_brief: this file (Evening)
reference_asset_ids: boulevard_v3_sky, style only
generation_tool_and_version: gpt-image-2 via gg-image (Codex ChatGPT backend), --quality high
generation_date: 2026-10-01
raw_source_location: art/generated/sky-evening.png
human_edits: resized 1672x941 -> 1920x1080 (Lanczos), converted to WebP quality 88
review_status: promoted at the owner's request; in-game review pending
rights_or_license_notes: project-owned development generation; human rights/provenance review required.
runtime_files: public/assets/environments/boulevard-v3/sky-evening.webp
```

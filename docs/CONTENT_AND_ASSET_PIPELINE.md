# Hollywoodland — Content and Asset Pipeline

Status: **Proposed for owner approval**

## 1. Pipeline principles

- GPT-5.6 Sol may author code and structured draft content; ChatGPT Images 2.5 may generate visual source assets.
- Generative tools are development tools only. No generation occurs in the released game.
- Human approval, cleanup, consistency checks, rights review, and technical validation remain mandatory.
- Existing `art/` files are concept references, not optimized runtime assets.
- Every production asset has a stable ID, source record, prompt/brief, generation date/version, edits, reviewer, license/provenance status, and runtime destination.

## 2. Visual bible

The art bible must lock:

- Romanticized 1935 Hollywood shapes, architecture, vehicles, signage, props, fashion, and technology.
- Exaggerated retro-cartoon anatomy and expression rules.
- Vivid storybook color palette for the city and menus.
- Black-and-white living-film palette, contrast, grain, and flicker limits.
- Restrained gold UI materials and period geometric typography.
- Side-view scale, perspective, horizon, parallax depths, and approved subtle fisheye ranges.
- Character silhouette diversity without direct likenesses of real stars.
- Text policy: gameplay-critical text is rendered by code, not baked into generated images.

## 3. Traditional sprite workflow

The chosen animation method is traditional frame-by-frame sprite sheets.

1. Approve a character turnaround, silhouette, palette, scale, and expression sheet.
2. Define an animation contract: frame canvas, anchor point, facing, frame count range, timing, loop rule, collision/interaction marker, and naming.
3. Generate or draw source poses in small coherent batches using the approved reference sheet.
4. Clean anatomy, costume continuity, line weight, palette, transparency, and edge halos by hand.
5. Register frames to a fixed ground/hip anchor; never compensate for drift at runtime.
6. Pack losslessly into source atlases, then produce optimized runtime atlases and metadata.
7. Review loops at game scale, not only as enlarged art.
8. Test color and black-and-white variants through the actual rendering pipeline.

### Vertical-slice animation minimum

- Player: idle, walk, run, turn, interact, stairs, contextual ladder, sit, surprised, pleased, discouraged, basic acting beats, and arrival/cinematic poses.
- Recurring NPCs: idle, walk, talk set, two signature reactions, and role-specific action.
- Crowd: a small reusable library of low-cost loops with palette/wardrobe variants.
- Performance: dedicated blocking, delivery, reaction, and improvisation sequences for the screen test.

Frame counts must be established through a representative animation spike before bulk generation. Creator combinations require a production feasibility test; if fully interchangeable visual parts cannot remain consistent in traditional sheets, the creator must use curated whole-character output combinations rather than runtime body-part compositing.

## 4. Environments

Each district scene is delivered as registered layers:

1. Sky/distant skyline.
2. Far architecture.
3. Midground façades and signage.
4. Walk plane and collision reference.
5. Interactive props/doors.
6. Foreground occlusion.
7. Lighting, weather, smoke, crowds, and optional effects masks.

Create clean plates without characters, baked UI, or gameplay text. Doors, breakable/altered props, signs with quest states, and time-of-day changes must be separate assets. Generated perspective is corrected to the shared district guide before approval.

## 5. UI assets

Use code-rendered semantic text over scalable nine-slice frames and tokenized CSS. Required source categories:

- Window corners/edges/fills.
- Buttons and states without baked labels.
- Icons with text alternatives.
- Portrait frames, meters, tabs, choice markers, map pins, and achievement plaques.
- Film-strip, ticket, marquee, scrapbook, and studio-paper motifs.

All interactive states need normal, hover, focus, active, selected, disabled, and high-contrast treatments. Gold is an accent, not a substitute for readable contrast.

## 6. Content authoring

Writers work from templates for character, dialogue, quest, audition, item, location, and achievement data. Each content change passes automated reference validation and an editorial pass for:

- Character voice and period flavor without unreadable pastiche.
- Choice clarity and meaningful differentiation.
- Fail-forward coverage.
- Relationship and reputation consequences.
- Historical-tone boundary and fictional-name policy.
- Accessibility, including reading load and timing independence.
- No direct reuse of copyrighted dialogue, lyrics, or protected character likenesses.

## 7. Audio pipeline

The game uses text-only dialogue. Audio deliverables include adaptive jazz/orchestral music stems, ambience, Foley, UI sounds, and performance stingers.

- Compose original music or use explicitly licensed material.
- Separate stems by intensity/location so the runtime can transition without restarting tracks.
- Avoid imitating a specific living artist or copying a recognizable recording.
- Normalize loudness consistently and preserve headroom for layered scenes.
- Export browser-compatible formats with tested Safari fallbacks.
- Provide independent music, effects, and ambience controls.

## 8. Prompt and provenance record

For every generated source asset, record:

```text
asset_id
asset_type
prompt_or_brief
reference_asset_ids
generation_tool_and_version
generation_date
raw_source_location
human_edits
review_status
rights_or_license_notes
runtime_files
```

Never rely on chat history as the sole record of an asset’s origin.

## 9. Approval gates

Before bulk production, approve:

1. One complete player animation set.
2. One recurring NPC animation set.
3. One crowd loop set.
4. One Boulevard parallax scene and one interior.
5. One living-film performance treatment.
6. One complete HUD/dialogue/settings accessibility pass.
7. One adaptive music scene and one dense ambient mix.

Bulk asset generation begins only after these representative assets work at target resolution and performance.


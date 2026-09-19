# Hollywoodland — Production Roadmap

Status: **Owner approved September 12, 2026; Phase 1 foundation in progress**

## 1. Delivery strategy

Build Hollywoodland through approval gates. Each phase must produce evidence that reduces the next phase’s largest risk. High production value comes from finishing a narrow slice, not building many unfinished systems.

## 2. Phases

### Phase 0 — Design approval

Deliverables:

- Approve the documentation package.
- Resolve all **Owner approval required** items.
- Approve the fictional naming slate and vertical-slice cast (approved September 18, 2026).
- Define the exact target test machines and hosting provider.
- Confirm analytics provider or choose a first-party endpoint/no-op adapter.

Exit: Written owner approval and an immutable design baseline tag.

### Phase 1 — Technical and art spikes

Deliverables:

- Phaser/TypeScript/Vite skeleton at `/hollywoodland/` base path.
- Input abstraction, DOM overlay proof, scaling/fullscreen proof, and Chrome/Safari smoke test.
- IndexedDB save/export/import proof.
- Representative traditional sprite animation test.
- One layered Boulevard scene at 60 FPS target.
- Living-film filter/treatment test with reduced-motion alternative.

Exit: Measured feasibility report, final asset/frame budgets, and owner visual approval.

### Phase 2 — Core systems foundation

Deliverables:

- Domain state/events, content validation, save migrations, settings, controls, analytics boundary.
- Movement/interactions, time slots, money/energy/reputation, dialogue, quest graph, relationships, XP/talents, inventory/rewards.
- Automated unit and content tests.

Exit: Systems operate with debug content and no critical architectural exceptions.

### Phase 3 — Gray-box slice

Deliverables:

- Complete critical path from creator through screen-test result.
- All route and fail-forward branches represented with placeholder assets.
- Save/load throughout; keyboard-only completion.
- Instrumented playtest build.

Exit: No dead ends, target playtime achievable, scope locked.

### Phase 4 — Production content and art

Deliverables:

- Final 8–10 character content and sprite sheets.
- Boulevard/studio scenes, interiors, UI, music, ambience, Foley, effects.
- Final dialogue, quest, audition, achievements, and scrapbook content.

Exit: Feature/content complete; no placeholder critical-path assets.

### Phase 5 — Alpha and accessibility

Deliverables:

- Full internal playthrough matrix.
- Robust accessibility baseline verified end to end.
- Performance, memory, loading, save corruption, and offline-assignment tests.
- Privacy/analytics payload audit.

Exit: All severity-1/2 defects closed; known lower-severity issues triaged.

### Phase 6 — Beta and release candidate

Deliverables:

- External playtests across target browsers/machines.
- Balance and comprehension iteration.
- Deployment artifact, cache/version behavior, recovery procedures, privacy copy, and credits.

Exit: Vertical-slice acceptance criteria met and signed off.

### Phase 7 — Free release and learning

Deliverables:

- Publish at `playologyentertainment.com/hollywoodland`.
- Monitor anonymous performance/crash data and voluntary feedback.
- Publish a post-slice decision: iterate, expand, pause, or revise.

No full-game production is implied by slice release.

## 3. Workstreams

| Workstream | Primary responsibilities |
|---|---|
| Product/design | Scope, economy, progression, encounters, acceptance decisions |
| Narrative | Characters, dialogue, quests, branches, fail-forward outcomes |
| Engineering | Runtime, systems, tools, saves, analytics, build, deployment |
| Art/animation | Visual bible, concepts, sprites, environments, UI, effects |
| Audio | Adaptive score, ambience, Foley, UI feedback, mastering |
| QA/accessibility | Test matrices, regression, performance, assist modes, compliance evidence |

GPT-5.6 Sol may perform implementation tasks and ChatGPT Images 2.5 may generate source artwork, but each workstream retains explicit review gates.

## 4. Scope-control rules

- A feature enters the slice only if it supports the arrival-to-screen-test promise or validates a full-game risk.
- New systems require removal or deferral of comparable effort unless the owner expands scope explicitly.
- Repeatable content must use the same underlying systems as authored quests.
- Placeholder breadth does not count as production value.
- No mobile, multiplayer, cloud account, runtime AI, monetization, full voiceover, or conventional combat work during the slice.

## 5. Major risks and mitigations

| Risk | Early mitigation |
|---|---|
| Traditional sprites multiply across creator options | Complete a creator/animation feasibility spike before bulk art; use curated whole-character combinations if necessary |
| Generated art lacks frame/perspective continuity | Lock turnarounds, anchors, palettes, and environment guides; require cleanup and in-engine review |
| Branching content becomes untestable | Typed data, stable IDs, graph validation, deterministic conditions, route matrix |
| Dense scenes miss 60 FPS | Establish measured budgets on one representative Boulevard scene before expansion |
| Canvas limits accessibility | Put dialogue/menus/settings in semantic DOM and abstract every action |
| Local saves are lost or corrupted | Rotating autosaves, manual slots, export/import, validation, migrations, recovery UX |
| Scope grows from “RPG completeness” | Use the explicit slice system-depth table and owner change control |
| Romanticized history becomes careless | Fictionalize industry figures, use a sensitivity/editorial pass, and document tone boundaries |

## 6. Approval checklist

The owner should approve or revise:

- [ ] Core vision and design pillars.
- [ ] Character Creator scope and attribute/talent model.
- [ ] Time, economy, reputation, jobs, idle, save, and achievement rules.
- [ ] Relationship, romance, dialogue, audition, and fail-forward approach.
- [ ] 1935 romanticized fictional-Hollywood policy.
- [ ] Vertical-slice critical path, cast size, locations, and outcome matrix.
- [ ] Layered 2.5D presentation, traditional sprites, text-only dialogue, and audio direction.
- [ ] Phaser 4/TypeScript/Vite/DOM-overlay architecture.
- [ ] Accessibility, privacy, analytics, performance, and browser targets.
- [ ] Free/no-ads/no-purchases business model and no-runtime-AI boundary.
- [ ] Direct implementation only after a separate explicit approval.

## 7. Definition of vertical-slice done

“Done” means a player can create a character and complete a polished, coherent, accessible, replayable arrival-to-screen-test story in current Chrome and Safari; every result preserves agency; the build meets its performance, save, privacy, and presentation acceptance criteria; and the repository contains the source, tests, provenance records, deployment artifact recipe, and known-issues report.

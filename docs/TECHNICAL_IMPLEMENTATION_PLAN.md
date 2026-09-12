# Hollywoodland — Technical Implementation Plan

Status: **Owner approved September 12, 2026; Phase 1 foundation authorized**  
Baseline verified: September 2026

## 1. Proposed stack

- **Language:** TypeScript with strict compiler settings.
- **Game framework:** Phaser 4, pinned to a reviewed stable release at implementation start.
- **Build tool:** Vite, configured with the production base path `/hollywoodland/`.
- **UI:** Semantic HTML/CSS overlays for menus, dialogue, journal, settings, and accessibility-critical controls; Phaser renders the game world.
- **Content:** Versioned JSON validated against TypeScript-derived schemas during development and CI.
- **Persistence:** IndexedDB behind a repository-owned save adapter; downloadable JSON backup with integrity metadata.
- **Testing:** Unit tests for deterministic systems, browser integration tests, visual regression snapshots, and manual accessibility/performance passes.
- **Delivery:** Static production bundle deployable beneath `playologyentertainment.com/hollywoodland`.

This is an app/game hybrid at the rendering boundary but not a heavyweight UI-framework application. Avoid React/Vue/Svelte unless implementation proves that semantic DOM screens cannot remain maintainable without one.

### Rationale

Phaser provides maintained browser-game primitives for scenes, cameras, spritesheets, input, audio, loaders, scale management, and WebGL/Canvas rendering. Its official project templates support TypeScript and Vite. Vite provides a static production build and configurable public base path. Keeping menus/dialogue in the DOM improves keyboard focus, text scaling, and semantic accessibility while the world remains optimized in Phaser.

## 2. Repository shape

Proposed first implementation layout:

```text
/
├── art/                       # Existing concept art; never used as raw production assets
├── docs/                      # Approved design and production documents
├── public/
│   └── assets/                # Optimized runtime assets and manifests
├── src/
│   ├── app/                   # Boot, routing, DOM screens, settings
│   ├── game/                  # Phaser config, scenes, camera, world objects
│   ├── systems/               # Time, economy, quests, relationships, progression
│   ├── content/               # Typed content access and validation
│   ├── save/                  # Schema, migration, IndexedDB, import/export
│   ├── analytics/             # Consent/opt-out and event boundary
│   ├── accessibility/         # Remapping, motion/timing/contrast policies
│   └── shared/                # Events, types, utilities
├── content/                   # Authored JSON/YAML source data
├── tools/                     # Asset validation/packing and content checks
├── tests/                     # Unit, integration, visual, accessibility
└── .github/workflows/         # CI checks and deploy artifact build
```

## 3. Architectural rules

1. The game world emits typed domain events; UI, saves, analytics, and audio subscribe through narrow interfaces.
2. Narrative content never imports Phaser. Dialogue and quest logic are engine-independent data plus deterministic evaluators.
3. Save data contains domain state, never live scene objects or framework internals.
4. All random decisions use named seeded streams so tests and bug reports can reproduce outcomes.
5. Input actions (`moveLeft`, `interact`, `journal`, etc.) are abstracted from physical keys and mouse buttons.
6. Timing pressure uses a central accessibility-aware clock multiplier and supports an untimed mode.
7. Content IDs are stable, namespaced, and never derived from display text.
8. No external secret, AI API key, or privileged service is shipped to the browser.

## 4. Runtime composition

### Scene layers

- Boot/preload and compatibility check.
- Title/profile/save selection.
- Character Creator.
- District world scene with background, midground, walk plane, foreground, lighting/effects, and interaction layers.
- Cinematic/performance scene for living-film sequences.
- Persistent DOM shell for dialogue, HUD, journal, settings, and accessibility.

### State domains

- Player identity and creator selections.
- Attributes, skills, talents, XP, levels, credits, and achievements.
- Money, energy, reputation, inventory, wardrobe, housing, and scrapbook.
- Calendar/day/time slot and scheduled idle assignments.
- Quest nodes, world flags, discoveries, and district variations.
- Per-character relationship state and remembered dialogue facts.
- Settings, control map, analytics preference, and accessibility profile.

## 5. Content model

Use declarative nodes with explicit conditions and effects:

- Dialogue node: speaker, text key, presentation cue, choices, conditions, effects, next node.
- Quest node: activation, objectives, state transitions, outcomes, rewards, world mutations.
- Audition beat: prompt/cue, available approaches, timing rule, checks, modifiers, feedback, outcome contribution.
- NPC schedule: time slot, location, animation/activity, availability, interruption rules.
- Item/reward: stable ID, category, display metadata, unlock source, scrapbook/home representation.

A build-time validator must detect missing IDs, unreachable nodes, invalid transitions, circular blocking dependencies, absent localization text, and references to missing assets.

## 6. Saving and idle time

Use autosave rotation plus named manual slots. Each save envelope includes:

- Schema version and game content version.
- Save ID, display label, timestamps, playtime, and last safe location.
- Domain-state payload.
- Integrity checksum for accidental corruption detection, not security.

Imports are parsed in isolation, validated, size-limited, migrated, and only then offered as a new slot. Never execute imported content. Keep at least one previous autosave generation.

Offline assignments store start time, planned duration, capped outcome rules, and a monotonic last-processed marker. Clamp elapsed time, handle clock reversal, and calculate results once. Major quests cannot complete offline.

## 7. Analytics and privacy boundary

Display a concise first-run disclosure with a link to details and an immediately available opt-out. Suggested events:

- Session start/end and browser/performance class.
- Scene load timing, FPS bands, memory warnings where safely observable, and crashes.
- Quest/audition result family, accessibility feature activation, and aggregate progression milestone.

Prohibited fields include player-entered names, full save data, dialogue text, free-form data, IP-derived location stored by the game, or cross-site advertising identifiers. Analytics failures must never block play.

## 8. Performance and asset budgets

Performance target: 60 FPS at 1920×1080 on a documented midrange desktop in current Chrome and Safari.

Initial budgets to validate during the art spike:

- One render resolution policy with device-pixel-ratio cap.
- Texture atlases sized to tested WebGL limits; avoid assuming a maximum without runtime detection.
- Lazy-load studio content after the Boulevard boot path.
- Compress full-color artwork to AVIF/WebP with PNG fallback only where transparency/quality requires it.
- Pack sprite frames into atlases; remove transparent padding; share immutable frames where possible.
- Pool common effects and cap particles, dynamic lights, and simultaneous animated background actors.
- Decode audio in bounded groups after user interaction; provide fallbacks for Safari behavior.

CI should track bundle size and asset-manifest deltas. The final numerical budgets are set after the representative sprite/environment spike.

## 9. Browser and input support

Required release matrix:

- Latest stable Chrome on Windows and macOS.
- Latest stable Safari on macOS.
- Keyboard-only and keyboard-plus-mouse play.

Use feature detection rather than user-agent branching. Provide a readable unsupported-mode screen when a required capability fails. Pointer lock is unnecessary. Fullscreen is optional and must never be required to access controls or exit.

## 10. Accessibility implementation

- DOM controls use correct semantic elements, programmatic names, logical focus order, visible focus, and escape routes from every modal.
- Canvas interactions have keyboard action equivalents and DOM status announcements where needed.
- Text scale cannot clip or hide required choices at the supported maximum.
- High-contrast/color-independent modes swap tokens and assets through centralized presentation settings.
- Reduced motion disables camera shake, aggressive parallax, flashes, and nonessential transitions.
- Timing assists affect only player-facing deadlines, never physics stability.
- Remapping detects conflicts, provides restore defaults, and saves independently of career slots.

Target WCAG 2.2 AA for DOM-based screens and equivalent functional access for canvas gameplay, documented through an accessibility conformance checklist.

## 11. Security and resilience

- Apply a restrictive Content Security Policy compatible with the static bundle and analytics provider.
- No inline secrets, `eval`, runtime code generation, or remote content execution.
- Validate all imported saves and authored content.
- Pin dependencies and use automated dependency/security review.
- Escape all content rendered into HTML; treat player-entered names as untrusted text.
- Supply clear recovery for storage quota, private-browsing persistence limitations, corrupt saves, audio autoplay restrictions, and lost WebGL context.

## 12. CI and release gates

Every change must pass formatting, linting, type checking, unit tests, content validation, production build, bundle-budget check, and browser smoke tests. Release candidates additionally require:

- Chrome/Safari manual pass.
- Save migration and import corruption tests.
- Keyboard-only and accessibility-settings playthrough.
- Performance capture on the named target machine.
- Analytics payload inspection with opt-out verification.
- Asset provenance and license audit.

## 13. Deployment

Build with `/hollywoodland/` as the base path. The deployment artifact contains immutable hashed assets plus an entry HTML file and suitable cache headers. Do not cache the entry HTML indefinitely. Provide a version file and a friendly refresh prompt when a new build is available; never update in the middle of a session.

The exact playologyentertainment.com hosting provider and deployment credentials remain **Owner approval required** before deployment automation is added.

## 14. Technical sources

- Phaser project templates: <https://docs.phaser.io/phaser/getting-started/project-templates>
- Phaser 4 API: <https://docs.phaser.io/api-documentation/4.0.0/api-documentation>
- Phaser 4.1 release notes: <https://phaser.io/news/2026/04/phaser-4-1-0-salusa-release>
- Vite documentation: <https://vite.dev/>
- IndexedDB overview: <https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API>
- WCAG 2.2: <https://www.w3.org/TR/WCAG22/>

Versions must be rechecked and pinned when implementation begins; this document does not authorize unattended major-version upgrades.

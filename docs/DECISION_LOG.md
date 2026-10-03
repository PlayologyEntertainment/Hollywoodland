# Hollywoodland — Decision Log

Status: Owner approved September 12, 2026. Track B canon (naming slate, cast, origins, screen-test premise, tone boundary) approved September 18, 2026. Phase 1 visual spike and the staged Boulevard v3 and portrait art approved September 19, 2026.

| Area | Decision |
|---|---|
| Product | Free, single-player, web-based side-scrolling RPG about becoming a film star |
| Setting | Romanticized Golden Age Hollywood beginning in 1935 |
| Fiction policy | Original studios, stars, moguls, unions, and tabloids; real landmarks/broad texture allowed |
| Player | Chosen from individual portraits (no free-form customization), with a meaningful origin |
| Career | Acting-led; other film crafts support skills, contacts, and side jobs |
| Narrative | Branching career, meaningful consequences, multiple endings |
| Tone | Teen historical dramedy; glamour, humor, romance, peril, softened darker history |
| World | Connected, dense handcrafted side-scrolling districts |
| Movement | Grounded walking/running, stairs, doors, contextual ladders, crowds, interaction |
| Conflict | Auditions, persuasion, performance, chases, slapstick, dance, publicity, stealth, investigation, set crises; no core combat |
| Failure | Fail forward into altered scenes, rumors, debts, relationships, or new opportunities |
| Creator | Individual portrait selector: name, portrait, origin. Each portrait has its own walk cycle; no modular parts, no outfit changes in the slice. See the 2026-09-29 entry |
| Attributes | Presence, Craft, Wit, Nerve, Grit |
| Skills | Branching talent trees including Drama, Comedy, Dance, Charm, Hustle, Observation, Stagecraft |
| Leveling | XP grants attribute/perk choices; career milestones unlock signature perks/opportunities |
| Time | Flexible morning/afternoon/evening slots; few permanently missable main-story deadlines |
| Economy | Money, energy, one industry-reputation meter |
| Jobs | Authored career arcs plus repeatable gigs for income, training, and idle use |
| Idle | Bounded classes, rehearsals, side jobs, networking, or recovery while away |
| Dialogue | Classic branching dialogue trees |
| Relationships | Full web of friendship, rivalry, romance, loyalty, favors, and grudges |
| Auditions | Read the Room: study, intention, delivery, emotion, blocking, improvisation, adaptation |
| Rewards | Credits, roles, headshots, costumes, props, contacts, perks, memorabilia, home upgrades |
| Wardrobe | Cosmetic collection; no equipment-stat optimization |
| Achievements | Cosmetics, titles, posters, trophies, scrapbook, NPC recognition; no power |
| Housing | Rented room → apartment → bungalow → mansion; customizable hubs |
| Saves | Autosave plus named manual slots; local browser persistence and export/import |
| Replay | Origins, builds, relationships, missed roles, scandals, branches, endings |
| Visuals | Vivid storybook city/menus, black-and-white living-film sequences, restrained gold UI |
| Camera | Layered 2.5D side view, parallax, cinematic close-ups/angles, subtle fisheye |
| Animation | Traditional frame-by-frame sprite sheets |
| Audio | Adaptive period-inspired music/soundscape; text-only dialogue |
| HUD | Minimal contextual HUD with expandable panels |
| Display | Responsive 1920×1080/16:9 baseline; extend scenery for ultrawide |
| Performance | 60 FPS at 1080p on documented midrange PCs; scalable effects |
| Input | Desktop Chrome/Safari, keyboard and mouse; keyboard-only completion supported. Phones held sideways also work through on-screen controls (2026-10-01) |
| Accessibility | Robust launch baseline including remap, scaling, contrast, reduced motion, pause, timing assists |
| Runtime AI | None; GPT-5.6 Sol and ChatGPT Images 2.5 are development tools only |
| Monetization | Entire game free; no ads or purchases; sponsorship/voluntary support may be considered later |
| Analytics | Standard anonymous analytics, disclosed, enabled by default, opt-out available |
| Hosting | Standalone fullscreen-capable app at `playologyentertainment.com/hollywoodland` |
| Architecture | Modular TypeScript using an established game framework; proposed Phaser 4 + Vite + semantic DOM overlay |
| First milestone | Polished 45–90 minute vertical slice |
| Slice location | Hollywood Boulevard plus compact studio transition/zone |
| Slice job | Background-extra chain leading to first major screen test |
| Slice cast | 8–10 focused recurring characters |
| Opening | Bus/train arrival with suitcase, little money, temporary lodging, fragile studio lead |
| Rival | Charismatic aspiring actor who may become friend, romance, enemy, or ally |
| Repository | `PlayologyEntertainment/Hollywoodland`; documentation committed directly to `main` |

## Canon approved September 18, 2026

Detail and rationale live in `DRAFT_TRACK_B_CANON_PROPOSAL.md` (approved as drafted; the filename is kept so links stay valid).

| Area | Decision |
|---|---|
| Studio | Monarch Pictures |
| Casting office | Sunset Casting Exchange |
| Grand theater | The Celestial Palace |
| Diner | The Gilded Spoon |
| Boarding house | Bellhaven Rooms |
| Tabloid | The Klieg Light |
| Costume shop | The Silver Thimble (approved September 18, 2026 during Boulevard entrance work) |
| Slice cast (10) | Delphine Voss (rival/foil), Odalys Bellhaven (boarding-house proprietor), Frankie Dolan (diner confidant), Selma Pruitt (casting-office gatekeeper), Ray Kessler (assistant director / production coordinator), Gus Albrecht (experienced extra / mentor), Corinne Lake (scene partner), Nick Ferro (reporter), Ola Whitfield (wardrobe mistress, origin-linked specialist), Lucian Vale (house manager of The Celestial Palace, added and approved 2026-09-19) |
| Romance | Romance-capable in the slice: Delphine Voss, Frankie Dolan, Corinne Lake, all attraction-flexible and reactive to the player's creator choices. Everyone else uses trust, obligation, or mentor tracks |
| Origins (5) | Small-Town Hopeful, Vaudeville Trouper, Runaway Society Name, Immigrant Striver, Studio-Lot Hand-Me-Down. Each trades a +3 for a -3 (widened from ±1 on 2026-09-21; Runaway Society Name's second cost changed from a nonexistent "starting money" field to -3 Wit) and grants one starting contact |
| Screen test | *The Corsair's Daughter*, Monarch's swashbuckling adventure-romance. The player is a background extra in its harbor-market crowd scene; the screen test is a small speaking role opposite Corinne Lake in a rescue/banter scene |
| Tone ceiling | Longing looks, hand-holding, one tasteful kiss that may cut away, spoken declarations. No depicted sex or nudity, no shock innuendo, no modern profanity or slurs, no gore, no real-weapon threat played straight, no glorified drunkenness, period prejudice softened per the GDD |
| Boulevard entrances | Eight street entrances (Bellhaven Rooms, The Silver Thimble, The Gilded Spoon, an alley, The Celestial Palace, Sunset Casting Exchange, The Klieg Light, the Monarch Pictures gate) plus a depot landmark. The extras corral, soundstage, wardrobe department, and screen-test space sit behind the Monarch gate. The street is built from per-building modules at a shared door scale, about 7,450 px long (full buildings, approved September 18, 2026); about 7,960 px after the Monarch gate rework of September 19, 2026, which added a full-height sound stage on the street, then about 7,850 px after the gap between The Klieg Light and the Monarch gate was closed. See `art/prompts/boulevard-entrances-v3.md` |
| Art status | Cast appearances are approved as written briefs only. Each portrait still passes visual review under `CONTENT_AND_ASSET_PIPELINE.md` section 9 |

## Approved 2026-09-19

| Area | Decision |
|---|---|
| Phase 1 visual spike | Approved by the owner, with minor tweaks to be outlined. Phase 1 exit still needs the measured feasibility report and final asset/frame budgets (`PRODUCTION_ROADMAP.md`) |
| Boulevard v3 art | Nine building modules, four active-state variants, ground tile, and planes 1-3 approved and promoted as runtime WebP in `public/assets/environments/boulevard-v3/` |
| Cast name revisions | The casting-gatekeeper portrait is a woman and the production-coordinator portrait is a man, so the canon names were changed to match the approved art: Selwyn Pruitt is now **Selma Pruitt** and Ruth Kessler is now **Ray Kessler**. Roles, surnames, personalities and relationship tracks are unchanged. Code dialogue already used "she" for the gatekeeper and "he" for the coordinator |
| Monarch gate rework | Owner chose take b of the studio-lot gate and a wider module with the sound stage standing on the street. Now in the game (`art/prompts/boulevard-entrances-v3.md` section 15); a "SOUND STAGE" sign was added, and the hills and distant-buildings parallax factors were lowered slightly for the longer street |
| Celestial Palace character | The lobby has its own character: **Lucian Vale**, house manager and head usher (`house-manager`), a proposal by Claude that the owner approved on 2026-09-19. He is the tenth and last slot of the 8-10 slice cast. Portrait `public/assets/characters/house-manager.webp`; brief `art/prompts/character-house-manager-lucian-vale.md` |
| Bellhaven Rooms flow | Owner tweak: entering Bellhaven Rooms now opens the landlady conversation first, and her closing choices ("Just nod and head upstairs." and the two reassurance choices) open the Home Menu. A new opening choice, "Nothing to settle today.", lets a player skip the rent talk without paying or asking for an extension. The Home Menu controls are unchanged; the assignment Start buttons are left-justified ahead of their descriptions. Escape on the landlady card leaves without opening the menu |
| Monarch gate bottom and open state | Owner report: a 10-15 px see-through gap at the bottom of the Monarch gate and the sound stage, and the gate up and down looked like it faded out. Cause: the master's ragged bottom edge and a soft-edged rectangle composite. Fixed in calibration (the module now stands 12 px lower with a solid bottom, and both signs moved with it) and in the open-gate composite (built from the changed pixels only). See `art/prompts/boulevard-entrances-v3.md` section 17 |
| Bellhaven lobby and Home Menu background | Owner request: the landlady scene now uses a new Bellhaven Rooms lobby image (cozy, slightly worn front hall in warm afternoon light), and the Home Menu now uses the previous rented-room image as its background, in the same scene layout with the menu in a panel on the right. Menu controls unchanged. The lobby is a single take pending owner review (`art/prompts/location-interior-bellhaven-lobby.md`) |
| Black header and scrolling Status panel | Owner request: the status header is now always solid black (no gradient over the game), in windowed and fullscreen mode, and it gets its own row: the game view scales to fit below it (owner chose this over overlaying the top of the game). The Status ("Your Career") panel starts below the header, its title and close button stay pinned while the body scrolls with a thin gold scroll bar, and the Status button now toggles it |
| Walk cycle v2 | Owner approved and promoted the re-rendered male walk cycle: 16 loop frames plus an idle frame, distance-driven so the feet stay planted at any walk speed, and a footprint shadow that follows the feet. Sheet `public/assets/characters/aspiring-actor-walk.webp`, timing and foot data `public/data/walk-cycle.json`; brief `art/prompts/character-aspiring-actor-walk-cycle-v2.md` |
| Character portraits | Gus Albrecht, Nick Ferro, and Ola Whitfield approved as runtime WebP in `public/assets/characters/`; not yet referenced by any scene |
| Main Menu film slate | Owner approved and merged (PR #55): a 1930s film slate replaces the dark Main Menu panel, `art/Hollywoodland_Logo.png` replaces the title text, and the eyebrow and tagline lines are gone. Brief `art/prompts/ui-main-menu-slate.md` |
| Monarch arch sign | Owner approved and merged (PRs #56 and #57): an ornate Monarch Pictures sign, take 1 of two, is painted into the gate's curved arch panel in both the closed and open gate art, replacing the plain drawn text (`painted` flag on the sign). Brief `art/prompts/boulevard-monarch-sign.md` |
| Limelight button font | Owner approved and merged (PR #58): Limelight (SIL OFL 1.1, Sorkin Type) on the splash Play button (first "Enter"), the Main Menu buttons, the creator's Back and Start Career, the header links and the footer buttons. Text unchanged, no faux bold; dialogue choices, origin cards and other buttons keep the current font |
| Game music and ambience | Owner approved and merged (PRs #59 and #60): Studio music from the splash Play button through the Main Menu and Character Creator, Boulevard music with street ambience while walking, random Building A or B music inside buildings, Studio music at the Extras Corral, Monarch gate and Soundstage, 1.0 s equal-power cross-fades, and Music and Ambience volume and mute in Settings. The tracks are free AI-generated MP3s from Pixabay (owner, 2026-09-20); loop points checked by the owner. Notes `docs/dev/game-audio.md`, provenance `docs/AUDIO_PROVENANCE.md` |

## Approved 2026-09-20 to 2026-09-21

| Area | Decision |
|---|---|
| Six player characters | Owner approved and merged (PR #62, 2026-09-20): a six-character selector (White, Asian, and Black man and woman) replaces free-form customization, on the creator background image, with the full-size character centred. Designs, headshots, and portraits are in for all six; the walk cycles for the five newly added characters remain phase 2 (all six still walk with the original male cycle for now). Thumbnails were later scaled to fill the pane, picking whichever of 1/2/3/6 columns makes them largest (PR #69, 2026-09-21). `art/prompts/character-player-roster.md` |
| Header icon buttons | Owner approved and merged (PRs #75-#77): Film Look and Fullscreen are now square gold line-art icon buttons (2rem, generated via gg-image, brief `art/prompts/ui-header-icons.md`) with an on-theme dark/gold hover/focus tooltip reading their `aria-label` (no native browser tooltip). Career, and the footer's Wait/Menu, now share the same rounded-rectangle `.chrome-button` style as Film Look/Fullscreen, retiring the old square hairline `.text-button` look entirely |
| Settings dialog redesign | Owner approved and merged (PRs #70-#74): compacted into two columns with no Close button (the backdrop and Escape both close it, discarding previewed changes); the four checkboxes (High contrast, Reduce motion, Film grain, Analytics) sit two-by-two below the sliders, and Save just says "Save". Follow-up fixes keep the dialog's inner frame line and its own border in sync as it shrinks, stop a double scrollbar caused by a 2px height mismatch, and give `.settings-form` a real 4-sided margin plus a themed thin scrollbar so neither scrolled content nor the scrollbar itself crosses the frame line |
| Objective card and Status panel | Owner approved and merged (PR #68): the header's Status button is renamed **Career** (matching the panel's "Your Career" title). The Objective card now follows the first in-progress quest (or the top open one), shows its current goal, and plays a green tick-and-advance beat when that goal completes — held until any covering UI closes, and reset when a whole career is loaded so an already-advanced save doesn't replay it. The Status panel's inner frame no longer cuts across its scrolling content, its Close button matches the other header buttons, and completed quests are listed (green, ticked) below the open ones. Pure/tested in `src/app/Objective.ts` and `src/app/QuestLog.ts` |
| Boulevard header and footer rework | Owner approved and merged (PR #66): header is place name left, logo centred, Film Look/Fullscreen/Career right — the FPS readout is gone and Reputation moved to the Status panel. Footer is a permanent bar below the picture (Wait / Playology logo / Menu); Save and Export are gone, Menu autosaves instead. Day/Time/Money/Energy moved to a plaque beside the Objective card (`src/app/HudStats.ts`). Both bars, the Objective card, and floating notices (entrance prompt, toast) share a new fine deco outline (`src/ui/DecoBorder.ts`), and notices now fade out over 0.6s instead of blinking away (`src/app/FadingNotice.ts`) |
| Playology logo and Main Menu button renames | Owner approved and merged (PR #67): the splash screen and Boulevard footer use the approved Playology_Entertainment_Logo (source kept in `art/`, shipped as `public/assets/ui/playology-logo.webp`), with the splash logo's outer glow removed. Main Menu: "Settings & Accessibility" is now "Settings", "Import Save" is now "Save Options" (ids and the pages behind them unchanged) |
| Home assignments' wait times shortened | Owner approved and merged (PR #78): real-world wait times cut to one of the owner's requested lengths (5/15/60/120/240 minutes) — Run Lines Together 120→5m, Diner Counter Shift 180→15m, Scene Study Class 240→60m, Early Night In 360→120m, Advanced Scene Workshop 480→240m. Reward amounts and relative order unchanged. `src/domain/AssignmentDefinitions.ts` |
| Origin attribute swing widened to ±3 | Owner approved and merged (PR #79): each origin's attribute trade widened from ±1 to ±3 (base 5, 0-10 scale) — the original ±1 left every origin's final attributes within 4-6 of each other, too close to read as distinct builds. Same attribute pairs and direction as before; Runaway Society Name's second cost changed from "-1 starting money" (a field `Origin.deltas` has never had) to -3 Wit, matching every other origin's one-strength-for-one-weakness shape. `src/domain/Origins.ts`, `docs/DRAFT_TRACK_B_CANON_PROPOSAL.md` §3 |

## Working assumptions requiring explicit approval

Several choices began as recommended defaults after a blank selection and were subsequently carried forward when the user continued: attributes plus skills, hybrid stat/player-skill challenge resolution, scheduled career assignments while away, the full origin-based creator, acting-led career focus, teen dramedy boundaries, the arrival premise, the rival, and the screen-test climax. They are treated as accepted working direction in this package but remain easy to revise during document approval.

The exact Phaser/Vite versions, analytics provider, deployment provider, animation frame counts, and asset budgets remain intentionally unresolved until their named gates. Cast identities, fictional proper nouns, the origin list, the screen-test genre, and the tone boundary were resolved on September 18, 2026 (see Canon above). The full creator appearance matrix is still open.

## Character creation direction (2026-09-29)

| Area | Decision |
|---|---|
| Portraits, not modular parts | The Character Creator is a portrait selector. Each portrait is a complete character with its own headshot, full-size portrait, reflection, and walk cycle. The earlier modular plan (head and body presets, skin tones, hair, facial hair, makeup, eyewear, accessories) is dropped. This formalises PR #62 (2026-09-20) |
| Roster | Six portraits for the full game (White, Asian, and Black man and woman). The vertical slice ships fewer: only those with a finished walk cycle are selectable (currently the White man and the White woman). Final slice count is an owner decision |
| Pronouns | Fixed per portrait; no separate pronoun, age-range, or hometown choice |
| Romance | Delphine Voss, Frankie Dolan, and Corinne Lake stay attraction-flexible and react to the chosen portrait's identity rather than to creator settings |
| Wardrobe | No visual outfit changes in the slice. Wardrobe stays a collection and quest-requirement item; outfit variants (extra sheets per portrait) are deferred to the full game. "Change appearance" is removed from the home loop |
| Art risk | The roadmap's "sprites multiply across creator options" risk is replaced by a bounded per-portrait cost: one walk cycle, plus the rest of the player animation set, per selectable portrait |

## Slice content expansion (2026-09-29)

| Area | Decision |
|---|---|
| Goal | Lengthen the slice's narrative by about 50 percent: one more experience-earning dialogue option per NPC, and three more quests (ten in total) |
| Follow-up XP options | Casting office (15 XP), Diner, Bellhaven Rooms, Backlot Gate, Extras Corral and Soundstage (10 XP each): one-time choices, each unlocked by finishing that NPC's first quest and costing 10 energy |
| New quests | The Perfect Fit (The Silver Thimble), On the Record (The Klieg Light) and Tuesday Matinee (The Celestial Palace): two stages each, 15 XP at the last stage. They give the three NPCs without a quest their XP option. Gus Albrecht is left out until he has a location |
| Localization | New English text is in the catalog, with AI first drafts for es, fr, de and pt-BR, still Beta and awaiting native review |
| Balance | About 110 XP added in total. Level pacing and the Screen Test's level-2 gate have not been playtested against it |

## Spec reconciliation (2026-09-29)

Audit of the design documents against the build. Items the docs promised but the build lacks were ruled on one by one.

| Area | Decision |
|---|---|
| Remappable controls | Deferred to the full game. The slice ships fixed keys (A/D or arrows, E or Enter, Esc) |
| Timing assists / untimed mode | Deferred to the full game. The slice keeps its timing light and fixed |
| Analytics | The boundary and Settings opt-out stay; no provider in the slice, so nothing is transmitted. The payload audit applies once a provider is chosen |
| CI gates | A bundle-size and asset-budget check is added after the Phase 1 budgets; formatting, linting, and browser smoke tests are Phase 5 release-candidate gates |
| Arrival sequence | Deferred to the full game. The slice opens on the chapter title page, then player control on the Boulevard |
| Stairs, ladders, chase/slapstick | Deferred to the full game. The slice's conflict content is the one on-set crisis |
| Achievements and scrapbook | Kept for the slice (5-8 achievements; scrapbook of the career chronology). Not yet built; tracked in the roadmap |
| Version file and refresh prompt | Deferred to Phase 6 release work |
| Seeded random streams | Rule dropped for the slice, which uses no randomness. Required if a random system is ever added |

## Approved 2026-09-30

| Area | Decision |
|---|---|
| Nine Home assignments, unlocked by level | Owner approved. Four assignments are open from the start (Scene Study Class, Diner Counter Shift, Run Lines Together, Early Night In), Advanced Scene Workshop stays apartment-gated, and one more unlocks at each of levels 2 to 5: Extra on a Backlot (90 min, $60, 12 XP), Cold Reading Clinic (150 min, 35 XP), Premiere After-Party (45 min, 10 XP, +8 trust with the scene partner) and Day Trip to the Coast (180 min, $75, 45 XP). `AssignmentDefinition.requiredLevel` is new (1 when omitted); `assignmentLock` names what still blocks one, a level first, then a housing tier. `src/domain/Assignments.ts`, `AssignmentDefinitions.ts` |
| Assignments no longer award Energy | Owner ruling: Wait already restores Energy, and Money is scarcer, so the two Recovery assignments pay Money instead (Early Night In 40 Energy → $50, Day Trip to the Coast $75). No assignment awards Energy. Reward numbers no longer appear in the descriptions; each Home card shows its rewards as their own line |
| Home screen assignment list | Owner approved. All nine always show. A locked one fades and names its requirement ("Level 3", or the housing tier) in place of its Start button. While one runs, the others stay in view but fade and cannot be started, the running one is picked out, and the header above the list carries a live countdown and progress bar. The list is rebuilt only when its shape changes (level, housing tier, which assignment runs, language), not on the 250 ms state heartbeat, so a Start button is never replaced under a click. `AppShell.renderHomeHubAssignments` |
| Chapter 1 quests and Conclusion screen | Owner approved. Every current quest is a Chapter 1 quest and sits in a collapsible "Chapter 1 Quests" group in the Career panel. When all ten are completed, and any conversation and the quest helper's 3-second green beat are done, the game fades to a Chapter 1 Conclusion title card: the Chapter 1 card's layout with "Conclusion" under "One Suitcase", a green border (the completed-quest green) and a three-line story recap whose first line names the player. Leaving it returns to the Boulevard, where the quest helper reads "Chapter 2" / "Coming Soon". Shown once per career, remembered as the saved fact `chapter:1:concluded` and recorded only after the card is dismissed; a finished save shows it on its next Boulevard entry. Music and keyboard controls are off while it is up. `src/domain/Chapters.ts`, `AppShell.concludeChapter` |
| Film-strip HUD strips | Owner approved after a screenshot review. The dark bands behind the quest helper, the Day/Time/Money/Energy bar, the assignment countdown and the notices have a 0.75rem margin top and bottom that text never enters, holding an evenly spaced row of see-through rounded squares like film sprocket holes. The fades at the ends and the completed-quest green are kept. The strip is one unbroken mask with the two hole rows subtracted (`mask-composite: exclude`), after a first version built from separate body and rail layers showed a hairline gap between a rail and the body on the owner's display. `src/styles.css` |
| Ambient birds | Owner approved. Every 15 to 30 seconds a flock of two or three dark silhouette birds, drawn in code with an eight-pose flap cycle, crosses the top third of the screen right to left. They are fixed to the screen, vary in height, size, speed and flap timing, stand still (and their timer stops) while a dialog, title card or menu covers the picture, and are off with Reduce Motion. No art asset. `src/game/BirdFlight.ts`, `PictureCover.ts` |
| Story Planner tool | Owner requested; built. A stand-alone page (`tools/story-planner/index.html`, kept outside `public/` by owner decision so the tool and the unreleased story plan never ship in the production build) for seeing everything the game has written and planning the story above it: a Chapters > Storylines > Beats plan with status, cast, places and links to quests, dialogue and assignments; every authored text editable; coverage, translation-staleness and Markdown export views. Edits to existing text are recorded in `tools/story-planner/data/story-edits.json` and applied to the game's source on request, not written into it by the tool. See `docs/dev/story-planner-tool.md` |
| Chapters 2-10 canon drafted | Owner requested an outline of the rest of the story; drafted for review in `docs/DRAFT_CHAPTERS_2_10_CANON_PROPOSAL.md` and loaded into the Story Planner (9 chapters, 57 beats, 12 new characters, 4 new places). Owner direction that shaped it: each place covers about two chapters (Boulevard 1-2, Hollywood Bowl 3-4, Santa Monica Pier 5-6, Griffith Observatory 7-8, Monarch lot 9-10); Chapter 2 is a small part and choosing a love interest; the four required set pieces (the Bowl concert with a close friend and a chance meeting with a VIP director, the Pier sunset romance with inside information and publicity, the Observatory murder mystery, the Monarch role of a lifetime); the victim is a new rival, the grand-story engine is Leopold Maddox's favor, the close friend is Gus Albrecht, the love interests are the existing cast plus one new man, the map stays open with characters moving to the latest place, three distinct endings, numeric carry-forward targets with attribute/talent routes, and mixed depth. **Not approved**: the draft is awaiting owner review |
| Union Bus Depot and the map of Hollywoodland | Owner requested; built. The left-most Boulevard building is the Union Bus Depot, where a career begins. It gets a header sign (UNION BUS DEPOT) and a wall plaque (TO ALL POINTS), both lettered in code on the module's blank panels, and works like every other entrance ("Board the bus"), but opens a map of Hollywoodland: a stylized 1930s illustrated map in 3/4 perspective that blends the five places into one picture, generated with gg-image (brief and provenance in `art/prompts/hollywoodland-map.md`). The five regions are Hollywood Boulevard (current), Hollywood Bowl, Santa Monica Pier, Griffith Observatory and the Monarch lot. The player's region is lit and colourised, the others dim and desaturated; hover or focus lights a region part-way, and selecting one lights it with a gold outline and says what a trip costs or why it cannot be taken. The four unbuilt regions show "Coming soon". The map art (one take) was accepted by the owner and merged on 2026-09-30. See `docs/dev/world-map.md` |
| Bus travel | Owner approved: choosing a built, affordable region takes the bus at once. $2 and one time slot within the city and hills, $5 and two slots to or from the Santa Monica Pier (money is in whole dollars, so period cents are scaled up). Energy is untouched. `CareerState.region` is optional (absent means the Boulevard), so no save migration. Gameplay keys are off while the map is open. `src/domain/Travel.ts` |
| Welcome signs | Owner approved: a classic roadside "Welcome to ..." sign with a 1930s population shows on every map trip, at the start of a new career (after the Chapter 1 card) and when a saved career is loaded; a click or Enter skips it, and Reduce Motion shows it whole. Real names and 1930 census figures (Los Angeles County Almanac): Los Angeles 1,238,048, Santa Monica 37,146, Culver City 5,669. Hollywood and its hills are districts of the City of Los Angeles and have no separate census figure, so their signs name the city and use its figure. The Hollywood Bowl and Griffith Park signs do the same; the studio lot's sign names Culver City ("Heart of Screenland"). The owner may want to check these names and figures |
| Localization of this round | New English text is in the catalog with AI first drafts for es, fr, de and pt-BR (the four new assignments, the Conclusion, the Chapter 1 group label, the Chapter 2 objective, and the new Home-screen strings), still Beta and awaiting native review |

## Approved 2026-10-01

| Area | Decision |
|---|---|
| Map look | Region borders are gone. A soft elliptical spotlight lights the hovered (55%), selected (85%) or current (100%) region; Hollywood Boulevard's ellipse is 20% smaller. The title is centred and Close is at the bottom right |
| Mobile scope | Mobile browser first, landscape only; upright shows a rotate prompt. PWA install, offline and native packaging are later (`MOBILE_PLAN.md`) |
| Mobile controls | A walking pad (slide left or right) at the bottom left and an Interact button at the bottom right that says Enter for doors and Go for anything else, both half as wide as first built so they sit in the black margins; Career, Menu and Wait live in the header. The map needs a second tap to travel. Terms, Privacy and the Playology logo link move into Settings on phones |
| Mobile sizes | Phone header 28px with 24px buttons and tap areas. The owner chose this over keeping the 44px touch minimum. Film sprockets are dropped on phones and the HUD overlays are kept short |
| Notices | Desktop keeps the film-strip entry tips and toasts at the top right (scaled down only if they would touch the stats bar). Plain, smaller notices apply to touch devices only |
| Footer | Terms and Privacy shrink with the window so they never touch Menu or Wait. The Playology logo links to `https://www.playologyentertainment.com/index.html` in a new tab, releasing focus after a click so Enter cannot reopen it. Held keys are dropped when the page loses focus |
| Time of day | Three skies (Afternoon is the existing sky; Morning and Evening generated with GG). A colour grade matches each (Evening is tint `#ffe6c8`, glow `#ffb454` at 5%, after the first version proved too red). Sky, grade and lights change together over 3 seconds |
| Building lights | They keep following each building's opening hours (not evening only) and switch on or off instantly, staggered around the midpoint of the blend, never fading |
| Sky art | Skies tile mirrored side to side, so Evening has clouds only in the middle 60% and a clean gradient at both edges; Morning has an edge dissolve; all share the Afternoon's 3px blur look. The game's Afternoon sky is `sky-blur.webp` |
| Dev tooling | `playwright` is a dev dependency for phone-size screenshots; CSS changes need `npm run build` as well as the tests |

## Chapter 2 built (2026-10-03)

Owner approved the Chapter 2 plan in `DRAFT_CHAPTERS_2_10_CANON_PROPOSAL.md` as written ("A Small Part") and asked for everything to be built, with art prompts only for the new characters. The rest of the Chapters 2-10 draft (Chapters 3-10, the ledger payoff, the culprit, the endings) is still awaiting review.

| Area | Decision |
|---|---|
| Chapter 2 quests | Eight quests, all `chapter: 2`: The Lookout, Harbor-Market Wardrobe, First Day on Set, A Week of Rehearsals, The Wrap Party, Delphine's Warning, The Helpful Man and Under the Stars. All wait on the Chapter 2 title page (`chapter:2:started`). The first-day scene is a Read the Room audition (`lookout-first-day`, five categories, all four result families reachable); every result leaves `first-day:done`, so a bad take never blocks the credit. `src/domain/QuestDefinitions.ts`, `PerformanceDefinitions.ts` |
| Chapter cards | Owner redesigned the hand-off. The Chapter 1 Conclusion now ends back on the Boulevard. The Quest Helper then shows "Chapter 2 / A Small Part" with a Start button, and Chapter 2's opening page plays only when the player presses it. Until then Chapter 2's quests, Career group and place conversations stay hidden, and the player roams with Chapter 1 content as usual. The prompt is derived from the saved facts (`chapter:1:concluded` set, `chapter:2:started` not), so it survives save and load and returns on Continue until used. After the opening the Boulevard returns with the first Chapter 2 goal showing. The Chapter 2 Conclusion follows the last quest, then "Chapter 3 / Coming Soon". `nextChapterCard`, `isChapterTwoPending` in `Chapters.ts`; `AppShell.startChapterTwo` |
| Chapter quest groups | `QuestDef.chapter` (default 1). The Career panel has a collapsible "Chapter 2 Quests" group under Chapter 1's, hidden until a Chapter 2 quest is open |
| Place dialogue | Every Boulevard place keeps its Chapter 1 conversation and gains a Chapter 2 hub (`c2-root`) via the new `DialogueGraph.entryVariants`; "Talk about something else" returns to the Chapter 1 conversation. The new dialogue is `src/domain/Chapter2Dialogue.ts`. Speakers stay roles ("Leading Man", "Publicity Chief"), as in Chapter 1; names appear only in the planner |
| New cast | Roster entries `leading-man` (Theo Marchetti, attraction supported) and `publicity-chief` (Hollis Pike, none). Leopold Maddox is only seen through a window and has no roster entry. Art briefs are in `art/prompts/`; neither has a portrait, so they speak with the scene partner's or the place's portrait behind them until approved |
| The love interest | Chosen at the wrap party and remembered as `love-interest:corinne|frankie|delphine|theo|none` and a `love-interest` pivotal flag on the person. Nobody is locked out, and "everyone" is a full path. A dance only; no kiss |
| The ledger | Accepting Hollis Pike's help sets `ledger:pike-help`, grants the Publicity Card and puts the player in his debt (obligation -3). Declining, or sending him to the newsman, costs nothing now. The newsman's answers (`nick:exclusive-given`) are favors the player gives, not takes. Later chapters count these facts |
| Delphine's path | `delphine-path:truce|test|rivalry` (and `delphine:insight` for a player with Observation I) record how the player answered her. Her later arc reads them |
| Origin and attribute conditions | Owner asked for them in the same round. Dialogue and quests can now check `origin-is` and `attribute-at-least` (with `equals: false` for "below"). Used twice: the Studio-Lot Hand-Me-Down picks the Lookout's costume themselves (no energy cost, camera-ready), and a player with Presence below 5 has one extra nervous beat before the wrap-party dance (same result). The evening money for the Bowl is a $10 chip-in or a favor owed to the landlady rather than a new assignment, so assignment balance is unchanged |
| Localization of this round | New English text is in the catalog with AI first drafts for es, fr, de and pt-BR, still Beta and awaiting native review |

## Open decisions

| Area | Question | Raised |
|---|---|---|
| Chapters 3-10 canon | Chapter 2 is approved and built (see above). Review the rest of `DRAFT_CHAPTERS_2_10_CANON_PROPOSAL.md`: the new names, the Maddox and ledger through-line, Hollis Pike as the Observatory culprit, Theo Marchetti as the new male love interest, the three endings and their gates, the five signature talents, and the favors / evidence / allies counters. Accepted parts are then folded into the design docs as the Track B canon was | 2026-09-30 |
| Phase 1 visual tweaks | Owner will outline minor tweaks to the approved Phase 1 visual spike | 2026-09-19 |
| Phase 1 exit | Measured feasibility report and final asset/frame budgets are still needed (`PRODUCTION_ROADMAP.md`) | 2026-09-19 |
| The alley | The only Boulevard entrance without a scene | 2026-09-19 |
| Slice portrait count | How many portraits ship in the slice, and when the remaining walk cycles are made | 2026-09-29 |
| Per-portrait animation set | The slice player animation minimum (idle, run, interact, stairs, sit, reactions) is needed per portrait; frame counts and budget are not yet set | 2026-09-29 |
| Mobile on real devices | Safe areas, the on-screen keyboard, finger feel on the walking pad and the 24px header buttons have only been checked in emulation (`MOBILE_AUDIT.md`) | 2026-10-01 |
| Audition dialog on phones | Not reached in the emulated pass | 2026-10-01 |

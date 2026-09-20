# Hollywoodland — Decision Log

Status: Owner approved September 12, 2026. Track B canon (naming slate, cast, origins, screen-test premise, tone boundary) approved September 18, 2026. Phase 1 visual spike and the staged Boulevard v3 and portrait art approved September 19, 2026.

| Area | Decision |
|---|---|
| Product | Free, single-player, web-based side-scrolling RPG about becoming a film star |
| Setting | Romanticized Golden Age Hollywood beginning in 1935 |
| Fiction policy | Original studios, stars, moguls, unions, and tabloids; real landmarks/broad texture allowed |
| Player | Fully customizable blank slate with meaningful origin |
| Career | Acting-led; other film crafts support skills, contacts, and side jobs |
| Narrative | Branching career, meaningful consequences, multiple endings |
| Tone | Teen historical dramedy; glamour, humor, romance, peril, softened darker history |
| World | Connected, dense handcrafted side-scrolling districts |
| Movement | Grounded walking/running, stairs, doors, contextual ladders, crowds, interaction |
| Conflict | Auditions, persuasion, performance, chases, slapstick, dance, publicity, stealth, investigation, set crises; no core combat |
| Failure | Fail forward into altered scenes, rumors, debts, relationships, or new opportunities |
| Creator | Curated modular art direction; origin, identity, appearance, traits, aspiration, connection |
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
| Input | Desktop Chrome/Safari, keyboard and mouse; keyboard-only completion supported |
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
| Origins (5) | Small-Town Hopeful, Vaudeville Trouper, Runaway Society Name, Immigrant Striver, Studio-Lot Hand-Me-Down. Each trades a +1 for a -1 and grants one starting contact |
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
| Character portraits | Gus Albrecht, Nick Ferro, and Ola Whitfield approved as runtime WebP in `public/assets/characters/`; not yet referenced by any scene |

## Working assumptions requiring explicit approval

Several choices began as recommended defaults after a blank selection and were subsequently carried forward when the user continued: attributes plus skills, hybrid stat/player-skill challenge resolution, scheduled career assignments while away, the full origin-based creator, acting-led career focus, teen dramedy boundaries, the arrival premise, the rival, and the screen-test climax. They are treated as accepted working direction in this package but remain easy to revise during document approval.

The exact Phaser/Vite versions, analytics provider, deployment provider, animation frame counts, and asset budgets remain intentionally unresolved until their named gates. Cast identities, fictional proper nouns, the origin list, the screen-test genre, and the tone boundary were resolved on September 18, 2026 (see Canon above). The full creator appearance matrix is still open.

## Open decisions

| Area | Question | Raised |
|---|---|---|
| Phase 1 visual tweaks | Owner will outline minor tweaks to the approved Phase 1 visual spike | 2026-09-19 |
| Phase 1 exit | Measured feasibility report and final asset/frame budgets are still needed (`PRODUCTION_ROADMAP.md`) | 2026-09-19 |
| The alley | The only Boulevard entrance without a scene | 2026-09-19 |

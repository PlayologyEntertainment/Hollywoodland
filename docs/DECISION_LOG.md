# Hollywoodland — Decision Log

Status: Owner approved September 12, 2026.

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

## Working assumptions requiring explicit approval

Several choices began as recommended defaults after a blank selection and were subsequently carried forward when the user continued: attributes plus skills, hybrid stat/player-skill challenge resolution, scheduled career assignments while away, the full origin-based creator, acting-led career focus, teen dramedy boundaries, the arrival premise, the rival, and the screen-test climax. They are treated as accepted working direction in this package but remain easy to revise during document approval.

The exact Phaser/Vite versions, analytics provider, deployment provider, cast identities, fictional proper nouns, origin list, screen-test genre, animation frame counts, and asset budgets remain intentionally unresolved until their named gates.

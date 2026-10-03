# Hollywoodland — Game Design Document

Status: **Owner approved September 12, 2026**  
Setting: Hollywood, California, 1935  
Genre: Single-player side-scrolling career RPG  
Platform: Desktop web browser  
Target session: 20–45 minutes  
Initial milestone: Polished 45–90 minute vertical slice

## 1. Vision

Hollywoodland is a rags-to-riches role-playing game about the human machinery behind the dream factory. The player arrives with one suitcase, a few dollars, temporary lodging, and a fragile lead. They are not a prewritten hero: the player chooses who they are from a cast of individual portraits, then shapes their background, strengths, and starting connections through an origin.

The fantasy is not merely becoming famous. It is learning how Hollywood works, deciding who to trust, choosing what kind of performer to become, surviving setbacks, and watching a personalized career become visible through roles, relationships, homes, memorabilia, and public reputation.

### Design pillars

1. **Become the star you choose.** A cast of individually drawn, fully animated portraits and meaningful origin choices support distinct builds and stories.
2. **Hollywood is a relationship web.** Friends, rivals, romances, loyalties, favors, and grudges materially alter access, quests, auditions, scandals, and endings.
3. **Performance replaces combat.** Auditions, persuasion, chases, investigations, publicity battles, dance-offs, slapstick crises, and stealth provide varied conflict.
4. **Failure writes the next scene.** A failed roll or audition creates a setback, debt, rumor, altered relationship, or unexpected opportunity rather than a reload wall.
5. **Every success leaves a souvenir.** Credits, headshots, costumes, props, contacts, posters, trophies, scrapbook entries, and better homes make progress tangible.

## 2. Audience, tone, and boundaries

The target is players who enjoy narrative RPGs, life/career simulation, character creation, relationship stories, and richly detailed exploration. The intended rating is a teen historical dramedy: witty, glamorous, romantic, and occasionally perilous, with alcohol, corruption, scandal, and softened period inequities. There is no graphic sex, gore, or relentlessly bleak treatment.

The world uses fictional studios, stars, moguls, unions, tabloids, and productions. Real landmarks and broad historical texture may appear. The tone is a romanticized Golden Age rather than a documentary or historical indictment.

Writer guardrails (approved September 18, 2026):

- **Romance ceiling:** longing looks, hand-holding, one tasteful kiss that may cut away, and spoken declarations of feeling. No depicted sex or nudity and no innuendo written for shock.
- **Language:** period interjections only ("swell", "for Pete's sake"). No modern profanity and no slurs, even as period authenticity.
- **Vice and scandal:** speakeasy and cocktail-party texture is atmosphere. Drunkenness is never a goal or a joke at a character's expense. Scandal (affairs, blacklisting threats, payola) is handled through implication and gossip-column text.
- **Peril:** chases, pratfalls, mock swordplay, and on-set crises stay slapstick or adventure-choreography. No gore and no real-weapon threat played straight.
- **Historical inequities:** softened. A character can meet a closed door or a backhanded comment that signals period prejudice without the game dwelling on or explaining away real atrocity.

## 3. Player experience loop

### Minute-to-minute loop

1. Move through a dense side-scrolling scene.
2. Observe NPC routines, signs, conversations, entrances, and environmental clues.
3. Talk, investigate, interact, accept work, or spend a resource.
4. Resolve a dialogue choice, contextual showdown, or performance beat.
5. Receive a consequence: progress, money, energy change, reputation change, relationship state, item, clue, or complication.

### Daily loop

1. Start at home; review schedule, money, energy, reputation, leads, and assignments.
2. Choose activities for morning, afternoon, and evening.
3. Travel through connected districts and pursue a career chain, repeatable gig, training, networking, recovery, or exploration.
4. Return home to save, display rewards, schedule idle assignments, and advance the day.

The calendar is flexible. Activities consume time slots, but the main story rarely uses permanently missable deadlines. Time creates tradeoffs and atmosphere without punishing curiosity.

### Long-term loop

Train abilities, build contacts, accumulate credits, improve housing, shape relationships and reputation, secure better auditions, specialize through talents, and reach a career ending. Replay value comes from different origins, builds, relationships, missed roles, scandals, quest branches, and endings.

## 4. Character Creator

**Direction changed (September 2026).** The creator does not assemble a character from modular parts. The player picks one of a set of individual, fully drawn portraits, and each portrait has its own dedicated walk cycle and animation set. This replaces the earlier plan for head and body presets, skin tones, hair, facial hair, makeup, eyewear, accessories, and a per-player starting wardrobe. It keeps every portrait cohesive in the retro-cartoon style and means art cost grows with the number of portraits, not with the number of option combinations.

The creator collects:

- **Name**, typed by the player.
- **Portrait**, chosen from the roster. Each portrait is a complete character: headshot, full-size portrait, floor reflection, and a walk cycle drawn to match. A portrait carries its own pronouns, so the pronoun field is gone. Age range, hometown, and voice/mannerism identity are no longer separate choices.
- **Origin** (below), which supplies the mechanical and narrative build, including one starting contact.
- A summary of the origin's narrative and mechanical effects.

**Roster.** The full game targets six portraits: a man and a woman each in White, Asian, and Black designs (`art/prompts/character-player-roster.md`, `src/domain/PlayerCharacters.ts`). The vertical slice ships fewer: only portraits with their own finished walk cycle are selectable, and a portrait without one stays visible but disabled (`hasInGameArt`) rather than putting an unmatched body on the Boulevard. As of this writing two portraits have a walk cycle (the White man and the White woman); the final slice count is an owner decision. The portrait choice is cosmetic. It does not change attributes, talents, or quest access, and no portrait is strictly superior. It is also the identity the relationship system reads (see Romance).

Aspiration, strength, and flaw are not collected in the slice; the origin carries the equivalent trade-off and the starting connection.

The origin is mechanically meaningful. It modifies initial attributes, starting skill access, dialogue tags, one contact, early money or energy conditions, and portions of the opening. No origin is strictly superior.

Approved origins (September 18, 2026). Each trades a benefit for a cost and connects to one cast member:

Widened from an original ±1 to ±3 (September 21, 2026) once that subtler
swing left every origin's final attributes too close to read as distinct
builds; see `docs/DRAFT_TRACK_B_CANON_PROPOSAL.md` §3 and `src/domain/Origins.ts`.

| Origin | Trade | Starting contact |
|---|---|---|
| Small-Town Hopeful | +3 Grit, -3 Wit | Gus Albrecht (a family friend wrote ahead) |
| Vaudeville Trouper | +3 Craft, -3 Grit | Corinne Lake (crossed paths on a bill) |
| Runaway Society Name | +3 Presence, -3 Wit | Nick Ferro (recognizes the name and offers an uneasy trade of discretion for a future story) |
| Immigrant Striver | +3 Grit, -3 Presence | Odalys Bellhaven (shared home community; discounted first week's rent) |
| Studio-Lot Hand-Me-Down | +3 Wit, -3 Nerve | Ola Whitfield (unlocks the wardrobe-department route past the casting-office gatekeeper) |

Wardrobe is a collection rather than numerical armor. Clothing expresses films completed, achievements, and housing displays; quest requirements may ask for a costume or dress code, but items do not carry rarity tiers or general stat bonuses. Because each portrait has one fixed walk cycle, the vertical slice has no visual outfit changes: owning a costume can satisfy a requirement, but the on-screen character does not change. Outfit variants would need extra animation sheets per portrait and are deferred to the full game.

## 5. Attributes, skills, and progression

### Cinematic attributes

| Attribute | Meaning | Typical applications |
|---|---|---|
| Presence | Magnetism and command of attention | First impressions, star quality, publicity, romance |
| Craft | Technical performance discipline | Acting choices, continuity, rehearsal, script work |
| Wit | Verbal agility and perception | Comedy, dialogue, improvisation, investigation |
| Nerve | Composure under pressure | Auditions, scandal, risk, intimidation, live crises |
| Grit | Stamina and persistence | Long days, movement, recovery, hustle, repeated setbacks |

### Skills and talent trees

Branching talent trees sit beneath the five attributes. Initial branches include Drama, Comedy, Dance, Charm, Hustle, Observation, and Stagecraft. XP levels grant a controlled attribute improvement and a perk/talent choice. Major career milestones unlock stronger signature perks and new opportunities.

XP comes from meaningful completion, discovery, brave or character-defining choices, training firsts, and fail-forward outcomes—not repetitive grinding. Balance must allow several viable builds to clear the same career chain through different preparation and choices.

### Core resources

- **Money:** Rent, food abstraction, transport, training, grooming, social opportunities, and selected quest costs.
- **Energy:** Daily capacity. Rest, meals, and recovery restore it; overextension creates situational penalties rather than hard failure.
- **Reputation:** One clear industry-standing meter. It gates trust and opportunity and reacts to jobs, public behavior, reliability, and scandals.

## 6. Jobs, quests, and idle play

Hollywoodland uses a balanced job structure:

- **Authored career chains** deliver relationships, dilemmas, set pieces, role opportunities, and lasting consequences.
- **Repeatable gigs** supply money, practice, modest XP, and idle assignments without replacing authored content.

Quest states must support success, partial success, failure, refusal, delay, and alternate completion. The player should understand immediate consequences while some downstream effects remain discoverable.

When away, the player may schedule bounded career assignments such as classes, rehearsals, side jobs, networking, or recovery. On return, the game summarizes elapsed time and the result. Offline progress never bypasses major story scenes, creates unlimited wealth, or punishes a long absence. Assignments unlock with housing and with character level, so the list grows as the career does, and they do not award Energy (resting already restores it); Money, XP and relationship gains are the rewards.

## 7. Dialogue, relationships, and reputation

Important conversations use classic, readable branching dialogue trees. Choices may depend on known facts, origin tags, talents, current reputation, favors, or relationship state. The UI distinguishes unavailable choices without revealing every hidden consequence.

The recurring cast participates in a full relationship web. Each key character tracks a small authored set of states rather than a single universal affection score: trust, tension, attraction where applicable, obligation/favors, and pivotal flags. Relationships can become friendship, rivalry, romance, alliance, estrangement, or combinations that change over time.

The charismatic aspiring rival, Delphine Voss, is the player’s narrative foil. They compete for rooms and roles but can become a friend, romance, enemy, or ally. Romance is optional and never required for optimal progression. In the slice, the romance-capable characters are Delphine Voss, Frankie Dolan, and Corinne Lake, each attraction-flexible and reactive to the identity of the portrait the player chose. Every other recurring character uses trust, obligation, or mentor tracks. The full slice roster and its relationship boundaries are in the Vertical Slice Specification.

## 8. Auditions and conflict resolution

### Read the Room

The signature audition system asks the player to prepare and interpret rather than merely pass a dice roll:

1. **Study:** Gather script, genre, director, role, and scene-partner information.
2. **Commit:** Select a performance intention and relevant learned technique.
3. **Perform:** Choose delivery, emotion, blocking, and optional improvisation across a short staged sequence.
4. **Adapt:** React to one or more cues under light timing pressure.
5. **Result:** Attributes, skills, preparation, relationships, reputation, and player input produce success, partial success, or a fail-forward outcome.

Accessibility settings can lengthen or remove timing pressure. Outcomes must never be reduced to unexplained randomness; the debrief communicates the most important contributing factors.

### Contextual showdowns

Outside auditions and dialogue, conflict uses bespoke lightweight encounters (the vertical slice has one on-set crisis; chases and slapstick scrambles are full-game): chases, slapstick scrambles, dance-offs, publicity battles, stealth, investigations, crowd navigation, and on-set crises. These reuse a shared vocabulary of movement, observation, choice, timing, and resource expenditure. Conventional combat is not a core system.

## 9. World and exploration

Hollywood is organized into connected side-scrolling districts, reached by bus from the Union Bus Depot on the Boulevard. The depot opens an illustrated 3/4-perspective map of Hollywoodland: the player's own region is lit and the others dim, a trip costs a small fare and some time, and arriving shows a roadside "Welcome to ..." sign with a period population. Places not yet built show on the map as coming soon. Each district is a dense handcrafted sequence of exteriors and selected interiors with layered parallax, recurring NPC routines, secrets, environmental storytelling, shortcuts, and events that change by time or quest state.

Movement is grounded and responsive: walk, run, use stairs, enter doors, climb contextual ladders, navigate crowds, and interact. The vertical slice covers walking, doors, and interaction; stairs, ladders, and other vertical traversal are full-game features. Precision platforming is not required. Traversal exists to reveal people, place, humor, and opportunity.

Housing charts the career: rented room, apartment, bungalow, then mansion. Each is a customizable hub for saving, rest, wardrobe, achievements, memorabilia, schedule planning, and idle assignments.

## 10. Rewards and achievements

Primary rewards are career artifacts: film credits, roles, headshots, costumes, props, contacts, perks, memorabilia, and visible home upgrades. A scrapbook records the personalized career chronology.

Achievements provide titles, posters, outfits, trophies, scrapbook entries, and occasional NPC recognition. They do not grant power. This keeps completion goals celebratory rather than compulsory.

## 11. Narrative structure

The story begins in 1935 with the player arriving by bus or train with one suitcase, little money, temporary lodging, and a fragile studio lead. The slice opens on a chapter title page and then hands over control on the Boulevard; a full arrival sequence is a full-game feature. The career branches through choices, relationships, job outcomes, scandals, and roles toward multiple endings. Quests are grouped by chapter. Finishing every quest of a chapter closes it with a conclusion card, a short story recap in the same title-card style as the chapter opening, before the next chapter begins. Chapter 2, "A Small Part" (the first credit, the choice of a love interest, and the first favor from the studio's publicity chief), is built on the Boulevard; the later chapters are in `DRAFT_CHAPTERS_2_10_CANON_PROPOSAL.md`.

The first slice introduces a background-extra job on Monarch Pictures' swashbuckler *The Corsair's Daughter* that grows into a possible screen test opposite Corinne Lake. The full game should escalate from survival and access, through supporting work and public identity, to starring opportunities and the question of what the player is willing to trade for fame.

## 12. Presentation

Exploration uses a layered 2.5D side view with parallax. Key interactions may shift into cinematic close-ups, staged angles, and subtle fisheye compositions. Menus, landmarks, and connective scenes use vivid storybook color; selected “living film” performance sequences use expressive black and white. UI accents use restrained gold and period geometry.

The HUD is minimal and contextual. Its dark bands (the quest helper, the stats, the assignment countdown, the notices) are drawn as strips of film, with rows of sprocket holes along the top and bottom. Small ambient touches, such as a flock of birds crossing the sky now and then, add life without asking for attention; they stop for Reduce Motion. On phones the sprocket holes are dropped and the bands are kept as short as their text allows. The Boulevard changes with the time slot: the sky is Morning (pale, a little muted, only thin cirrus), Afternoon (the base sky) or Evening (golden-hour clouds), a colour grade is laid over the whole scene, and sky, grade and building lights blend together over three seconds when time advances. A building's lit windows follow its opening hours, and a light switches on or off at once, never by fading. Immediate prompts and essential state appear during play; money, energy, reputation, time, quests, relationships, inventory, scrapbook, and settings live in elegant expandable panels.

Audio emphasizes an adaptive period-inspired jazz/orchestral score, environmental sound, Foley, and responsive stingers. Dialogue is text-only. The plan does not require voiceover.

## 13. Accessibility

The first playable release requires:

- Complete keyboard navigation. Remappable gameplay controls are a full-game feature; the slice uses fixed keys (A/D or arrows, E or Enter, Esc).
- Mouse alternatives for all required actions.
- Text scaling, readable line lengths, strong focus states, and high-contrast mode.
- Information never communicated by color alone.
- Reduced-motion mode and control over camera shake, flashes, film grain, and fisheye intensity.
- Pause at any time outside explicitly noninteractive transitions.
- Adjustable or removable timing pressure (a full-game feature; the slice keeps its timing light and fixed).
- Separate music, effects, and ambient volume controls.
- Plain-language descriptions of settings and consequences.

## 14. Save, privacy, and business model

The game supports autosaves plus several named manual slots. Saves live locally in the browser and may be exported/imported as versioned portable backups. No account is required.

Standard anonymous analytics are enabled by default, clearly disclosed, and may be disabled. Only non-identifying progression, usage, performance, and crash events are permitted. Save content, free-form player names, and dialogue selections tied to a persistent personal identifier must not be transmitted. Until a provider is approved, the analytics client transmits nothing; the opt-out setting and the privacy boundary are built ahead of it.

Hollywoodland is free, with no advertisements or purchases. Sponsorship or voluntary support may be considered later, but monetization must not shape progression. Generative AI is used only during development; the released game makes no generative-AI calls.

## 15. Out of scope for the vertical slice

- Full career, all districts, later homes, and final endings.
- Multiplayer, leaderboards, user accounts, cloud saves, or social feeds.
- Runtime AI, procedural dialogue, or generated quests.
- Full voice acting.
- Conventional combat system.
- Native app-store packaging, and a touch-first design (the game is built for mouse and keyboard). A landscape-only mobile browser pass was added on 2026-10-01: see `MOBILE_PLAN.md` and `MOBILE_AUDIT.md`.
- Monetization, ads, purchases, or live-service events.

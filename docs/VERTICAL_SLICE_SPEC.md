# Hollywoodland — Vertical Slice Specification

Status: **Owner approved September 12, 2026**  
Target playtime: **45–90 minutes**  
Purpose: Prove the fantasy, presentation, core loop, and production pipeline at shippable quality before expanding content.

## 1. Slice promise

The player creates an aspiring performer, arrives on Hollywood Boulevard in 1935, secures temporary lodging, follows a fragile studio lead, works one chaotic day as a background extra, forms or strains several relationships, and earns a first major screen test. The conclusion reflects preparation and choices rather than producing a single binary win.

## 2. Playable content

### Opening

- Splash/title and settings-first launch.
- New Career, Continue, Load, Import Save, Accessibility, and Credits.
- Curated modular Character Creator with a representative—not exhaustive—selection from every planned category.
- Origin summary and initial allocation across Presence, Craft, Wit, Nerve, and Grit.
- Short color arrival sequence by bus or train, followed by player control.

### Hollywood Boulevard district

A continuous 2.5D district connects:

1. Transit arrival point.
2. Boarding house and rented room hub.
3. Diner/social anchor.
4. Theater frontage and lobby.
5. Casting office.
6. Shops or service interiors needed by the quest.
7. Alleys/shortcuts with secrets and one optional encounter.
8. Transit/studio gate transition.
9. A compact studio zone containing exterior gate, holding area, soundstage, and screen-test space.

The Boulevard should feel dense rather than long. At least three locations change between time slots or quest states.

### Recurring cast

Introduce 8–10 named characters. Required roles:

- Aspiring rival/foil with friend, romance, enemy, and ally potential.
- Boarding-house proprietor or roommate contact.
- Diner worker or neighborhood confidant.
- Casting-office gatekeeper.
- Assistant director or production coordinator.
- Experienced extra/mentor.
- Scene partner.
- Reporter, photographer, or gossip-adjacent character.
- Optional specialist tied to an origin or alternate route.

Approved roster (September 18, 2026; backgrounds and relationship boundaries in `DRAFT_TRACK_B_CANON_PROPOSAL.md` §2):

| Required role | Character | Relationship track |
|---|---|---|
| Aspiring rival/foil | Delphine Voss | Friend, romance, enemy, or ally |
| Boarding-house proprietor | Odalys Bellhaven | Trust/obligation; no romance |
| Diner worker / neighborhood confidant | Frankie Dolan | Friendship or slow-burn romance; never rivalry |
| Casting-office gatekeeper | Selma Pruitt | Trust/obligation; no romance |
| Assistant director / production coordinator | Ray Kessler | Trust and professional reputation; no romance |
| Experienced extra / mentor | Gus Albrecht | Mentor/friendship only |
| Scene partner | Corinne Lake | Friend, romance, or professional rivalry |
| Reporter / gossip-adjacent | Nick Ferro | Obligation/favor; mishandling him costs reputation |
| Optional origin-linked specialist | Ola Whitfield (wardrobe mistress) | Mentor/obligation; no romance |

Appearances are approved as written briefs only; each portrait still passes visual review before it is treated as final.

### Screen-test premise

The background-extra job is the harbor-market crowd scene of Monarch Pictures' prestige swashbuckler *The Corsair's Daughter*. The screen test is for a small speaking role opposite Corinne Lake in a rescue/banter scene on the same set, which lets Read the Room exercise blocking, verbal sparring, and a timed emotional turn.

## 3. Critical path

1. **Arrival:** Learn movement and contextual interaction; reach temporary lodging.
2. **The lead:** Discover that the studio contact is incomplete, late, or unreliable.
3. **Get through the door:** Use conversation, observation, a favor, or a small paid expense to secure extra work.
4. **Prepare:** Obtain required wardrobe, learn set etiquette, manage energy, and gather one useful production detail.
5. **Background action:** Navigate the set and follow blocking in a black-and-white living-film sequence.
6. **Crisis:** A contextual on-set problem invites a safe, bold, clever, or self-serving response.
7. **Consequence:** Reputation and relationships update; failure still produces a route forward.
8. **Opportunity:** The player learns of an urgent screen test and chooses how to prepare within remaining time.
9. **Read the Room:** Perform the screen test through study, commitment, performance, adaptation, and debrief.
10. **Cliffhanger:** Receive a result that opens the broader career—role interest, callback, alternate job, rival complication, or memorable rejection with a new lead.

## 4. Optional content

- One repeatable gig that can also be scheduled as an idle assignment.
- One training activity.
- One relationship scene at the diner or boarding house.
- One investigation/eavesdropping secret.
- One short chase or slapstick scramble.
- Three environmental collectibles or scrapbook discoveries.
- At least two origin-specific dialogue or route variations.

Optional content must reinforce the core loop and not turn the slice into a content-count demo.

## 5. Systems represented

| System | Slice depth |
|---|---|
| Character Creator | Polished representative subset |
| Movement/exploration | Production-quality core controls and interactions |
| Time | Morning, afternoon, evening; flexible advancement |
| Economy | Money, energy, reputation with visible tradeoffs |
| Dialogue | Branching tree, conditions, remembered flags |
| Relationships | Several state changes across 8–10 characters |
| Questing | One authored chain, one repeatable gig, optional scenes |
| Performance | Background blocking plus full Read-the-Room screen test |
| Conflict | One contextual crisis and one optional varied showdown |
| Progression | XP, at least one level choice, starter talent branches |
| Rewards | First credit, headshot/costume/prop or home display |
| Achievements | 5–8 cosmetic/world-recognition examples |
| Idle | One bounded assignment with return summary |
| Save | Autosave, manual slots, export/import, version migration hook |
| Analytics | Disclosed anonymous events and opt-out |
| Accessibility | Complete robust baseline for included content |

## 6. Outcome matrix

The screen test must support at least four authored result families:

1. **Breakthrough:** Strong preparation and performance produce a clear callback or offer.
2. **Promising complication:** The studio is interested, but a relationship, reputation, or contract issue creates a new problem.
3. **Wrong role, right notice:** The player loses the part but attracts a different opportunity suited to their build.
4. **Memorable setback:** The audition fails, yet the response preserves agency through a mentor, rival, small job, or new lead.

No result labels the character permanently ruined or asks the player to reload.

## 7. Presentation budget

- 1920×1080 design canvas with responsive scaling and ultrawide scenery extension.
- Layered parallax for major exteriors; selected explorable interiors.
- Traditional frame-by-frame sprite sheets for traversal, interaction, acting, and expressions.
- Vivid color for the city and menus; black-and-white treatment for selected film/performance sequences.
- Minimal contextual HUD and text-only dialogue.
- Adaptive music layers and polished environmental/Foley mix.

## 8. Acceptance criteria

The slice is approval-ready when:

- A new player can complete it in current Chrome and Safari using only keyboard, or keyboard plus mouse.
- The median guided playthrough lands between 45 and 90 minutes.
- The critical path has no dead ends across tested dialogue, relationship, and audition outcomes.
- At least three meaningfully different approaches reach the screen test.
- At least four screen-test result families are reachable and understandable.
- Save/load/export/import preserve all included state and reject corrupt data safely.
- A 1080p midrange target machine sustains 60 FPS during normal play, with documented budgets and scalable effects.
- Text scaling, high contrast, reduced motion, remapping, and timing assists work through the entire slice.
- Analytics disclose collection, respect opt-out, and contain no player-entered name or save payload.
- All final assets have provenance, generation prompt/version notes, cleanup status, and usage approval.
- No runtime AI, account dependency, advertisements, purchases, or game implementation beyond the approved slice appears.

## 9. Owner approval

Resolved September 18, 2026 (see `DECISION_LOG.md` and `DRAFT_TRACK_B_CANON_PROPOSAL.md`):

- Origin list: five origins, each with a +1/-1 trade and one starting contact.
- Names, visual briefs, and relationship boundaries for the nine recurring characters.
- Fictional studio, film, theater, diner, casting office, boarding house, and tabloid names.
- Screen-test genre and scene premise.
- Dialogue tone and romance boundaries.

Still **Owner approval required**:

- Final protagonist creator matrix (appearance categories and option counts beyond the origin list).
- Representative art-size and animation-frame budgets after a pipeline test.

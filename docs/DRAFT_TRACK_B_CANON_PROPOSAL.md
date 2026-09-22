# Hollywoodland — Track B Canon (Approved)

Status: **Approved by the owner September 18, 2026, as drafted.** The filename keeps `DRAFT` so existing links stay valid.

## Approval record

The owner approved every section as drafted: the naming slate (§1), the nine-character cast and relationship boundaries (§2), the five origins (§3), *The Corsair's Daughter* as the first screen test (§4), and the tone and romance guardrails (§5). The four open questions at the end are resolved by keeping the proposal's answers: none of the six names changes, the genre stays swashbuckling adventure-romance, the origin starting contacts stay as listed, and every romanceable character stays attraction-flexible.

Accepted parts are folded into `DECISION_LOG.md`, `VERTICAL_SLICE_SPEC.md` (§2, §9), and `GAME_DESIGN_DOCUMENT.md` (§2, §4, §7, §11). This file remains the detailed source. Cast appearances are approved as written briefs only; each portrait still passes visual review under `CONTENT_AND_ASSET_PIPELINE.md` §9. Still open: the full creator appearance matrix and the art-size and frame budgets.

The text below is the original proposal, unchanged.

This document proposes first drafts for every item the approval package marks
"Owner approval required" ahead of Phase 3/4 content work: the fictional
naming slate, the 8–10 recurring cast, the protagonist creator/origin list,
the screen-test genre and premise, and the dialogue/romance tone boundary.
Edit, cut, or replace anything — this is a starting point, not a
recommendation to lock in as-is. Once you mark it up, I'll fold the accepted
parts into the approved docs and start wiring them into content data.

One constraint that shaped these choices: every marquee, storefront, and sign
panel in the current Boulevard art is deliberately baked blank (see
`art/prompts/boulevard-five-plane-v2.md`) specifically so names could be
decided later without new art. The only proper noun already live in code is
the casting office, **Sunset Casting Exchange** (`BoulevardSpikeScene.ts`),
so I built the rest of the slate to sit comfortably next to it rather than
compete with it.

## 1. Fictional proper-noun slate

| Role | Proposed name | Notes |
|---|---|---|
| Studio | **Monarch Pictures** | The studio behind the fall production the player background-extras into. Mid-tier, ambitious, prestige-hungry — believable stakes for a first screen test without needing MGM-scale grandeur. |
| Casting office | **Sunset Casting Exchange** | Already built. An independent hiring hall serving multiple studios' day-player and extra calls — explains why it's on the Boulevard rather than on a studio lot, and why a newcomer can walk in without a contract. |
| Grand theater | **The Celestial Palace** | The pagoda-roofed movie palace already painted into Plane 4. "Celestial" keeps the stars/fame motif explicit and sidesteps borrowing a specific real theater's name or ethnic-revival branding directly. |
| Diner | **The Gilded Spoon** | Modest, warm, a little ironic given the "gilded" aspiration vs. a plain spoon — fits a survival-job hangout that's proud without being fancy. |
| Boarding house | **Bellhaven Rooms** | Named for its proprietor (below); "haven" signals safety/first home away from home. |
| Tabloid/gossip rag | **The Klieg Light** | Klieg lights are the harsh studio lighting rigs of the era — the pun (exposure, being "under the lights") fits a gossip sheet without inventing a fake real-paper knockoff. |

## 2. Recurring cast (10 characters, the top of the required 8–10)

Each entry: role, one-line visual brief, personality, and relationship
boundaries (what states apply and how far they can go). All romance-capable
characters are written attraction-flexible — reactive to whatever the player
sets in the Creator — rather than hard-coded straight/gay, matching the GDD's
"no origin/build is strictly superior" spirit extended to romance access.

1. **Delphine Voss — the Rival/Foil.** Sleek, expensive-looking clothes worn
   a little defiantly; sharp bob, sharper eyes. Grew up dirt-poor near the
   studios and has been clawing toward a contract for three years; reads as
   cold until you see how hard she's working. Can become friend, rival,
   romance, or enemy; her arc is driven by whether the player treats her as
   competition to crush or competition to respect.
2. **Odalys Bellhaven — Boarding-house proprietor.** Fifties, sharp-postured,
   reading glasses on a chain. Runs Bellhaven Rooms like a tight ship because
   she's seen a hundred dreamers arrive and half of them get taken advantage
   of. Trust/obligation track only — no romance — gates rent flexibility,
   gossip about other tenants, and a "found family" late-game beat.
3. **Frankie Dolan — Diner worker/confidant.** Wiry, ink-stained fingers from
   scribbling screenplay ideas between orders at the Gilded Spoon. Player's
   easiest early friend; low-stakes venting outlet. Friendship or a gentle
   slow-burn romance track; never rivalry.
4. **Selma Pruitt — Casting-office gatekeeper.** Prim, exacting, clipboard
   welded to her hand at Sunset Casting Exchange. Not a villain — a
   bureaucrat who respects reliability over charm. Obligation/trust only;
   softens through competence, not flattery.
5. **Ray Kessler — Assistant director / production coordinator.** Perpetually
   moving, perpetually behind schedule, runs the extras corral on the Monarch
   lot. Brusque but fair; the character who actually hands the player their
   shot. Trust and professional-reputation track; no romance (power-dynamic
   boundary — he's the player's direct work supervisor).
6. **Gus Albrecht — Experienced extra/mentor.** Grizzled, twenty years of
   background work, knows every trick for surviving a set. Warm, funny,
   protective of newcomers who remind him of himself. Mentor/friendship only;
   this is the "found an ally on day one" relationship.
7. **Corinne Lake — Scene partner.** Monarch's rising contract ingénue,
   already cast in the production the player is extra-ing on; plays opposite
   the player in the screen test. Can read as generous or subtly competitive
   depending on player choices — friend, romance, or professional rivalry
   are all reachable.
8. **Nick Ferro — Reporter/gossip-adjacent.** Fast-talking stringer for The
   Klieg Light, always looking for a scoop, not malicious but transactional.
   Obligation/favor track (he trades information and exposure for tips);
   mishandling him is the fastest way to a reputation hit.
9. **Ola Whitfield — Specialist (origin-linked).** Wardrobe mistress at
   Monarch; the alternate-route character from the Vertical Slice Spec, tied
   specifically to the Studio-Lot Hand-Me-Down origin below (she already
   knows that character, unlocking a wardrobe-department shortcut past
   Pruitt's front desk). Mentor/obligation track; no romance (mentor
   boundary).
10. **Lucian Vale — House manager of The Celestial Palace.** *(Added and
   approved September 19, 2026.)* Fifties, tall and ceremonial in a maroon
   usher's uniform with gold braid; he treats the Palace as a cathedral and
   every moviegoer as a congregation. Proud and a little theatrical, and fair
   to anyone who respects the craft of going to the pictures. He trades
   favors in seats: the Tuesday matinee pass for crew and extras, a word at
   the rope. Trust/obligation track only; no romance.

## 3. Protagonist creator: origins (proposed list of five)

Each origin nudges two attributes (+3/−3 on a base of 5, 0–10 scale — widened
from an original +1/−1 once the owner found that swing too subtle to read as
distinct builds; never a flat bonus with no tradeoff), grants one starting
contact from the cast above, flavors the arrival sequence, and unlocks a
small amount of unique dialogue.

1. **Small-Town Hopeful** — left a Midwest county for the first time. +3
   Grit, −3 Wit (less street-smart, more stubborn). Starting contact: Gus
   Albrecht (a family friend wrote ahead). Arrival flavor: homesickness beats,
   wide-eyed reaction dialogue to the city.
2. **Vaudeville Trouper** — grew up in a touring stage family, act folded
   when the circuit dried up. +3 Craft, −3 Grit (trained performer, worn
   thin from the road). Starting contact: Corinne Lake (crossed paths on a
   bill years ago). Arrival flavor: knows stage terms, unfazed by
   backstage chaos.
3. **Runaway Society Name** — walked out on a wealthy, controlling family.
   +3 Presence, −3 Wit (raised in a bubble with people to handle everything,
   no street-smarts of her own). Starting contact: Nick Ferro (recognizes her
   name, offers an uneasy trade of discretion for a future story). Arrival
   flavor: table manners and diction that read as out of place among extras.
   (The original draft's second cost was "−1 starting money"; the origin
   system has no money field, so this was changed to an attribute cost like
   every other origin's, rather than left as the only one-attribute origin.)
4. **Immigrant Striver** — arrived by ship and rail from overseas, several
   months before the story opens, still finding footing. +3 Grit, −3
   Presence (guarded, translating internally before speaking). Starting
   contact: Odalys Bellhaven (shares a home community; discounted first
   week's rent). Arrival flavor: unique dialogue tag threading language and
   distance from family throughout.
5. **Studio-Lot Hand-Me-Down** — has been ushering and mending costumes on
   the Monarch lot for a year, finally working up the nerve to audition
   in front of a camera instead of behind one. +3 Wit, −3 Nerve (knows the
   machine, still scared to be looked at). Starting contact: Ola Whitfield
   (unlocks the wardrobe-department alternate route into extra work,
   bypassing part of Pruitt's gatekeeping).

No origin is a strict upgrade — each trades a social/economic advantage for a
mechanical or narrative cost, per the GDD's balance rule.

## 4. Screen-test genre and premise

**Working title: *The Corsair's Daughter*** — a swashbuckling adventure-
romance, Monarch's big prestige production for the season. A costume
harbor-market crowd scene is where the player background-extras; the
screen test is for a small speaking role opposite Corinne Lake in a
rescue/banter scene on the same set.

Reasoning: the genre gives "Read the Room" real range to showcase —
physical blocking (harbor bustle, a mock swordfight beat), verbal
sparring (banter with the love interest), and a timed emotional turn (the
rescue) — which a straight drawing-room drama wouldn't exercise as fully,
and which suits the living-film black-and-white treatment's silent-era
adjacent physicality without requiring stunt-level animation work.

## 5. Dialogue tone and romance boundary

Concrete guardrails for writers, derived from the GDD's "teen historical
dramedy" line:

- **Romance ceiling:** longing looks, hand-holding, one tasteful kiss (may
  cut away rather than linger), spoken declarations of feeling. No
  depicted sex or nudity, no innuendo written for shock value.
- **Language:** period interjections only ("swell," "for Pete's sake," "the
  nerve of him") — no modern profanity, no slurs even as "period
  authenticity."
- **Vice/scandal:** speakeasy and cocktail-party texture is fine as
  atmosphere; drunkenness is never played as a goal or a joke at a
  character's expense. Scandal beats (affairs, blacklisting threats,
  payola) are handled through implication and gossip-column text, never
  graphic depiction.
- **Peril/violence:** chases, pratfalls, mock swordplay, and on-set crises
  stay slapstick-adjacent or adventure-choreography; no gore, no
  real-world-weapon threat played straight.
- **Historical inequities:** softened per the GDD — a character can face a
  closed door or a backhanded comment that signals period prejudice
  without the game dwelling on or explaining away real historical
  atrocity.

## Open questions for you (resolved: approved as drafted)

- Any of the six proper nouns clash with something you already have in mind?
- Is *The Corsair's Daughter* the right genre, or would you rather the first
  screen test be a comedy, drama, or musical number instead?
- Should any origin's starting contact be reshuffled once you've seen the
  full cast list (e.g., do you want every origin to connect to a different
  character rather than reusing Gus/Corinne/etc. as I did)?
- Delphine's and Corinne's romance-flexibility: comfortable keeping every
  romanceable character orientation-flexible, or do you want at least one
  with a fixed orientation for narrative specificity?

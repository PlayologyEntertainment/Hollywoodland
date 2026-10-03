import { validateQuestGraph } from '../content/QuestValidator';
import { CHAPTER_TWO_STARTED_FACT } from './Chapters';
import { ALL_ITEMS } from './InventoryDefinitions';
import { ALL_RELATIONSHIP_CHARACTERS, CASTING_GATEKEEPER } from './RelationshipDefinitions';
import { ALL_TALENTS } from './TalentDefinitions';
import { stageCompleteFact, type QuestDef, type QuestCondition } from './Quests';

/** The Silver Thimble's quest: the wardrobe mistress promises a proper fitting once the player has a callback (her
 * `fitting-reply` line says as much), so `fitted` waits on the callback slip from First Audition. */
export const COSTUME_FITTING_QUEST: QuestDef = {
  id: 'costume-fitting',
  title: 'The Perfect Fit',
  summary: 'Earn a proper fitting from the wardrobe mistress at The Silver Thimble.',
  stages: [
    { id: 'sized-up', description: 'Ask the wardrobe mistress for a fitting.' },
    {
      id: 'fitted',
      description: 'Come back with a callback and get properly fitted.',
      rewards: [
        { kind: 'resource-delta', delta: { reputation: 2 } },
        { kind: 'xp-grant', amount: 15 },
      ],
    },
  ],
};

/** The Klieg Light's quest: the newsman trades in favors, so `see-it-in-print` waits on real news (the player being
 * cleared for the extras call) and can be finished by feeding him the story or by asking him to hold it. */
export const ON_THE_RECORD_QUEST: QuestDef = {
  id: 'on-the-record',
  title: 'On the Record',
  summary: 'Trade a story with the newsman at The Klieg Light, and decide how much of it he prints.',
  stages: [
    { id: 'gave-him-something', description: 'Give the newsman something to work with.' },
    {
      id: 'see-it-in-print',
      description: 'Come back with news worth printing.',
      rewards: [
        { kind: 'resource-delta', delta: { reputation: 3 } },
        { kind: 'xp-grant', amount: 15 },
      ],
    },
  ],
};

/** The Celestial Palace's quest: the house manager's matinee offer is the first stage (see the `accept-the-matinee-
 * pass` choice), and taking him up on it is the second. */
export const PALACE_MATINEE_QUEST: QuestDef = {
  id: 'palace-matinee',
  title: 'Tuesday Matinee',
  summary: 'Take the house manager up on a free seat at the Celestial Palace.',
  stages: [
    { id: 'matinee-promised', description: 'Get the house manager\'s offer of a matinee seat.' },
    {
      id: 'matinee-attended',
      description: 'Take your seat at the Tuesday matinee.',
      rewards: [{ kind: 'xp-grant', amount: 15 }],
    },
  ],
};

/** Debug content for round 18's sixth Boulevard location (see
 * DialogueGraphs.ts's `SCENE_PARTNER_DIALOGUE`) — the `scene-partner` roster
 * entry's first content, past the extras corral at the soundstage. Unlike
 * the other social hubs, both root choices complete `first-run-through`
 * regardless of branch (the same "either way advances the stage" shape
 * `BACKLOT_RIVALRY_QUEST`'s `first-encounter` uses), and `found-the-rhythm`
 * can be reached through the ungated quest-status path or a `drama-1`-gated
 * one, mirroring `BACKLOT_RIVALRY_QUEST`/`RIVAL_DIALOGUE`'s ungated-path/
 * talent-gated-path split but on the opposite axis: here the talent gates a
 * deeper *trust* choice while the romance-capable `attraction` choice stays
 * ungated, rather than the other way around. */
export const SCENE_REHEARSAL_QUEST: QuestDef = {
  id: 'scene-rehearsal',
  title: 'Scene Rehearsal',
  summary: 'Find your footing with your scene partner before the cameras roll.',
  stages: [
    { id: 'first-run-through', description: 'Run the scene together for the first time.' },
    {
      id: 'found-the-rhythm',
      description: 'Find your rhythm together.',
      rewards: [{ kind: 'xp-grant', amount: 10 }],
    },
  ],
};

/** Debug content for round 17's fifth Boulevard location (see
 * DialogueGraphs.ts's `PRODUCTION_COORDINATOR_DIALOGUE`) — the
 * `production-coordinator` roster entry's first content. `cleared-for-call`
 * is this codebase's first stage completed by a choice that also grants an
 * item directly through the dialogue effect itself (see
 * `background-extra-voucher` in InventoryDefinitions.ts) rather than
 * through a `QuestStageReward` — the voucher represents being cleared, not
 * a bonus for clearing, so it belongs to the choice rather than the stage. */
export const EXTRAS_CALL_QUEST: QuestDef = {
  id: 'extras-call',
  title: 'Extras Call',
  summary: 'Check in at the extras corral and get cleared for a paid day of background work.',
  stages: [
    { id: 'checked-in', description: 'Check in with the production coordinator.' },
    {
      id: 'cleared-for-call',
      description: 'Get cleared for the call.',
      rewards: [{ kind: 'xp-grant', amount: 10 }],
    },
  ],
};

/** Debug content for round 16's fourth Boulevard location (see
 * DialogueGraphs.ts's `RIVAL_DIALOGUE`) — the `rival` roster entry's first
 * content. Unlike the other three social hubs, `earned-respect` never
 * lowers tension no matter which branch is taken: the rivalry is meant to
 * persist as a rivalry (see `deriveRelationshipLabel`'s tension-based
 * label), not resolve into friendship the first time the two characters
 * talk. */
export const BACKLOT_RIVALRY_QUEST: QuestDef = {
  id: 'backlot-rivalry',
  title: 'Backlot Rivalry',
  summary: 'Figure out where you stand with the other hopeful at the Monarch Pictures gate.',
  stages: [
    { id: 'first-encounter', description: 'Cross paths at the Monarch Pictures gate.' },
    {
      id: 'earned-respect',
      description: 'Settle where you stand with her.',
      rewards: [{ kind: 'xp-grant', amount: 10 }],
    },
  ],
};

/** Debug content for round 15's third Boulevard location (see
 * DialogueGraphs.ts's `LANDLADY_DIALOGUE`) — the `landlady` roster entry's
 * first content. The `settled-in` stage is completable two ways: a generic
 * reassurance always available while the quest is active, or (if already
 * earned) showing the callback slip from First Audition — the same
 * "narrative path OR content-gated path" branching round 9's
 * `cite-experience`/`show-studio-headshot` choices used. */
export const MAKING_RENT_QUEST: QuestDef = {
  id: 'making-rent',
  title: 'Making Rent',
  summary: 'Keep a roof over your head at Bellhaven Rooms.',
  stages: [
    { id: 'first-payment', description: 'Settle up with the landlady.' },
    {
      id: 'settled-in',
      description: 'Earn the landlady\'s trust.',
      rewards: [{ kind: 'resource-delta', delta: { energy: 20 } }],
    },
  ],
};

/** Debug content for round 14's second social hub (see DialogueGraphs.ts's
 * `DINER_DIALOGUE`) — the diner-confidant roster entry's first content,
 * eight rounds after RelationshipDefinitions.ts introduced the full nine-
 * character debug roster. A deliberately low-stakes, no-resource-cost
 * counterpart to First Audition's professional stakes. */
export const DINER_INTRODUCTIONS_QUEST: QuestDef = {
  id: 'diner-introductions',
  title: 'Diner Introductions',
  summary: 'Get to know the counter girl at The Gilded Spoon.',
  stages: [
    { id: 'introduced', description: 'Introduce yourself at the counter.' },
    {
      id: 'earned-trust',
      description: 'Get her to open up.',
      rewards: [
        { kind: 'resource-delta', delta: { reputation: 3 } },
        { kind: 'xp-grant', amount: 15 },
      ],
    },
  ],
};

/** Debug content for the Phase 2 quest-graph spike, wired entirely through
 * the casting-office dialogue (see DialogueGraphs.ts) rather than any new
 * UI or domain event. Character names remain Owner-approval-required per
 * docs/DRAFT_TRACK_B_CANON_PROPOSAL.md — this content exercises the quest
 * engine, not a locked-in narrative. */
export const FIRST_AUDITION_QUEST: QuestDef = {
  id: 'first-audition',
  title: 'First Audition',
  summary: 'Book an audition at the Sunset Casting Exchange and follow up on it.',
  stages: [
    { id: 'booked', description: 'Book an audition at the casting office.' },
    {
      id: 'callback',
      description: 'Follow up on the audition.',
      /** 45 xp crosses `xpRequiredForNextLevel(1)` (40) in one grant — the
       * same round-9 wiring that exercises `applyXpGain`'s multi-level-up
       * loop in real play, not just a unit test, and reaches the level 2
       * gate on SCREEN_TEST_QUEST below without any other XP source. */
      rewards: [
        { kind: 'resource-delta', delta: { money: 25, reputation: 5 } },
        { kind: 'xp-grant', amount: 45 },
        { kind: 'item-grant', itemId: 'first-callback-slip' },
        { kind: 'item-grant', itemId: 'studio-headshot' },
      ],
    },
  ],
};

/** Requires the prerequisite quest, the casting gatekeeper's trust, and
 * having leveled up from completing it — completing "First Audition" alone
 * isn't enough if you got there by name-dropping or stalling rather than
 * earning her confidence and some real experience. This exercises round
 * 6's relationship-gated quest prerequisite and round 9's level-gated one
 * together (all three must hold), the same way round 2 left some dialogue
 * branches unexercised to demonstrate a locked -> available transition. */
export const SCREEN_TEST_QUEST: QuestDef = {
  id: 'screen-test',
  title: 'Screen Test',
  summary: 'A follow-up opportunity that opens up once you land your first callback, gain some experience, and earn the gatekeeper\'s trust.',
  prerequisites: [
    { kind: 'quest-status', questId: 'first-audition', status: 'completed' },
    { kind: 'relationship-at-least', characterId: CASTING_GATEKEEPER.id, axis: 'trust', minimum: 10 },
    { kind: 'level-at-least', minimum: 2 },
  ],
  stages: [
    {
      id: 'attend',
      description: 'Attend the screen test.',
      rewards: [
        { kind: 'item-grant', itemId: 'audition-dress' },
        { kind: 'item-grant', itemId: 'lucky-lipstick' },
        { kind: 'item-grant', itemId: 'boarding-house-photo-frame' },
      ],
    },
  ],
};

/* ---------------------------------------------------------------------------------------------------------------------
 * Chapter 2: A Small Part (docs/DRAFT_CHAPTERS_2_10_CANON_PROPOSAL.md). Every quest below waits on the Chapter 2 title page,
 * so none opens before the chapter that introduces it. Quests are tied together through the facts their stages leave behind
 * (see `stageCompleteFact`), so a later quest can wait on an early stage without waiting on the whole earlier quest.
 * ------------------------------------------------------------------------------------------------------------------ */

const CHAPTER_TWO_OPEN: QuestCondition = { kind: 'fact', fact: CHAPTER_TWO_STARTED_FACT };

/** The test lands: the casting office gives the verdict on the screen test (its result decides the wording, and a strong one
 * earns a fourth line), then the extras corral gives the call time. Finishing it is the player's way onto the call sheet. */
export const THE_LOOKOUT_QUEST: QuestDef = {
  id: 'the-lookout',
  chapter: 2,
  title: 'The Lookout',
  summary: 'Hear what Monarch made of your screen test, and get your call time for The Corsair\'s Daughter.',
  prerequisites: [CHAPTER_TWO_OPEN],
  stages: [
    {
      id: 'hear-the-verdict',
      description: 'Hear the verdict on your screen test at Sunset Casting.',
      rewards: [{ kind: 'resource-delta', delta: { reputation: 3 } }],
    },
    {
      id: 'sign-the-call-sheet',
      description: 'Get your call time from the production coordinator at the extras corral.',
      rewards: [
        { kind: 'resource-delta', delta: { money: 25 } },
        { kind: 'xp-grant', amount: 10 },
      ],
    },
  ],
};

/** The Silver Thimble fits the Lookout's costume once the part is confirmed. How it is worn is the player's choice. */
export const HARBOR_MARKET_WARDROBE_QUEST: QuestDef = {
  id: 'harbor-market-wardrobe',
  chapter: 2,
  title: 'Harbor-Market Wardrobe',
  summary: 'Get fitted for the Lookout at The Silver Thimble.',
  prerequisites: [CHAPTER_TWO_OPEN, { kind: 'fact', fact: stageCompleteFact('the-lookout', 'hear-the-verdict') }],
  stages: [
    {
      id: 'fitted',
      description: 'Get fitted for the Lookout\'s costume at The Silver Thimble.',
      rewards: [
        { kind: 'item-grant', itemId: 'lookout-costume' },
        { kind: 'resource-delta', delta: { reputation: 2 } },
        { kind: 'xp-grant', amount: 15 },
      ],
    },
  ],
};

/** The first day on the soundstage. `report-to-set` hands off to the Read the Room scene (`lookout-first-day`); every result,
 * even a poor one, leaves the `first-day:done` fact behind, so the second stage can always be completed: a bad day writes the
 * next scene rather than a dead end. */
export const FIRST_DAY_ON_SET_QUEST: QuestDef = {
  id: 'first-day-on-set',
  chapter: 2,
  title: 'First Day on Set',
  summary: 'Shoot your one scene as the Lookout on The Corsair\'s Daughter.',
  prerequisites: [
    CHAPTER_TWO_OPEN,
    { kind: 'quest-status', questId: 'the-lookout', status: 'completed' },
    { kind: 'quest-status', questId: 'harbor-market-wardrobe', status: 'completed' },
  ],
  stages: [
    { id: 'report-to-set', description: 'Report to the soundstage and shoot your scene.' },
    {
      id: 'earn-your-credit',
      description: 'See the day out on the soundstage.',
      rewards: [
        { kind: 'item-grant', itemId: 'first-screen-credit' },
        { kind: 'resource-delta', delta: { reputation: 6 } },
        { kind: 'xp-grant', amount: 30 },
      ],
    },
  ],
};

/** The Heart's Choice, part one: two free evenings with two different people from among the four the story lets the player
 * choose between. Nobody is locked out; the choice itself is made at the wrap party. */
export const A_WEEK_OF_REHEARSALS_QUEST: QuestDef = {
  id: 'a-week-of-rehearsals',
  chapter: 2,
  title: 'A Week of Rehearsals',
  summary: 'Spend your free evenings between shoots getting to know the company.',
  prerequisites: [CHAPTER_TWO_OPEN, { kind: 'quest-status', questId: 'first-day-on-set', status: 'completed' }],
  stages: [
    { id: 'first-evening', description: 'Spend a free evening with someone from the company.' },
    {
      id: 'second-evening',
      description: 'Spend another evening with someone different.',
      rewards: [{ kind: 'xp-grant', amount: 15 }],
    },
  ],
};

/** The Heart's Choice, part two: the dance at the Celestial Palace, where the player chooses a love interest, or chooses no one. */
export const THE_WRAP_PARTY_QUEST: QuestDef = {
  id: 'the-wrap-party',
  chapter: 2,
  title: 'The Wrap Party',
  summary: 'Save a dance at The Celestial Palace, and decide who gets it.',
  prerequisites: [CHAPTER_TWO_OPEN, { kind: 'quest-status', questId: 'a-week-of-rehearsals', status: 'completed' }],
  stages: [
    {
      id: 'the-dance',
      description: 'Give your dance at the wrap party at The Celestial Palace.',
      rewards: [
        { kind: 'item-grant', itemId: 'wrap-party-ribbon' },
        { kind: 'resource-delta', delta: { reputation: 3 } },
        { kind: 'xp-grant', amount: 20 },
      ],
    },
  ],
};

/** Whispers, one: the rival's warning at the Monarch gate. How the player answers sets the rest of her story. */
export const DELPHINES_WARNING_QUEST: QuestDef = {
  id: 'delphines-warning',
  chapter: 2,
  title: 'The Rival\'s Warning',
  summary: 'The other hopeful at the Monarch gate has something to say about your first credit.',
  prerequisites: [CHAPTER_TWO_OPEN, { kind: 'quest-status', questId: 'first-day-on-set', status: 'completed' }],
  stages: [
    {
      id: 'face-her',
      description: 'Hear her out at the Monarch Pictures gate.',
      rewards: [{ kind: 'xp-grant', amount: 15 }],
    },
  ],
};

/** Whispers, two: Monarch's publicity chief offers to "look after" the player, and the newsman offers a trade of his own.
 * Accepting a favor is remembered as a `ledger:` fact, which later chapters will count. Declining costs nothing now. */
export const THE_HELPFUL_MAN_QUEST: QuestDef = {
  id: 'the-helpful-man',
  chapter: 2,
  title: 'The Helpful Man',
  summary: 'A very helpful man from Monarch\'s publicity department has taken an interest in you.',
  prerequisites: [CHAPTER_TWO_OPEN, { kind: 'quest-status', questId: 'first-day-on-set', status: 'completed' }],
  stages: [
    { id: 'hear-the-offer', description: 'Hear what the publicity man is offering on the soundstage.' },
    {
      id: 'answer-the-newsman',
      description: 'Settle things with the newsman at The Klieg Light.',
      rewards: [
        { kind: 'resource-delta', delta: { reputation: 3 } },
        { kind: 'xp-grant', amount: 15 },
      ],
    },
  ],
};

/** Whispers, three: the invitation to the Hollywood Bowl, which opens Chapter 3. Both stages can always be completed: the
 * second is paid for in cash or in a favor owed to the landlady. */
export const UNDER_THE_STARS_QUEST: QuestDef = {
  id: 'under-the-stars',
  chapter: 2,
  title: 'Under the Stars',
  summary: 'A friend has a pair of tickets to the Hollywood Bowl, and someone he wants you to see.',
  prerequisites: [CHAPTER_TWO_OPEN, { kind: 'quest-status', questId: 'the-wrap-party', status: 'completed' }],
  stages: [
    { id: 'get-the-invitation', description: 'Hear the invitation from the veteran extra at the extras corral.' },
    {
      id: 'dress-for-the-evening',
      description: 'Borrow something fit for an evening out from Bellhaven Rooms.',
      rewards: [{ kind: 'xp-grant', amount: 10 }],
    },
  ],
};

export const ALL_QUESTS: readonly QuestDef[] = [
  FIRST_AUDITION_QUEST,
  SCREEN_TEST_QUEST,
  DINER_INTRODUCTIONS_QUEST,
  MAKING_RENT_QUEST,
  BACKLOT_RIVALRY_QUEST,
  EXTRAS_CALL_QUEST,
  SCENE_REHEARSAL_QUEST,
  COSTUME_FITTING_QUEST,
  ON_THE_RECORD_QUEST,
  PALACE_MATINEE_QUEST,
  THE_LOOKOUT_QUEST,
  HARBOR_MARKET_WARDROBE_QUEST,
  FIRST_DAY_ON_SET_QUEST,
  A_WEEK_OF_REHEARSALS_QUEST,
  THE_WRAP_PARTY_QUEST,
  DELPHINES_WARNING_QUEST,
  THE_HELPFUL_MAN_QUEST,
  UNDER_THE_STARS_QUEST,
];

validateQuestGraph(ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_TALENTS, ALL_ITEMS);

import { validateQuestGraph } from '../content/QuestValidator';
import { ALL_ITEMS } from './InventoryDefinitions';
import { ALL_RELATIONSHIP_CHARACTERS, CASTING_GATEKEEPER } from './RelationshipDefinitions';
import { ALL_TALENTS } from './TalentDefinitions';
import type { QuestDef } from './Quests';

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
  summary: 'Figure out where you stand with the other hopeful at the backlot gate.',
  stages: [
    { id: 'first-encounter', description: 'Cross paths at the backlot gate.' },
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
  summary: 'Keep a roof over your head at the boarding house.',
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
  summary: 'Get to know the counter girl at the Sunset Diner.',
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

export const ALL_QUESTS: readonly QuestDef[] = [
  FIRST_AUDITION_QUEST,
  SCREEN_TEST_QUEST,
  DINER_INTRODUCTIONS_QUEST,
  MAKING_RENT_QUEST,
  BACKLOT_RIVALRY_QUEST,
  EXTRAS_CALL_QUEST,
  SCENE_REHEARSAL_QUEST,
];

validateQuestGraph(ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_TALENTS, ALL_ITEMS);

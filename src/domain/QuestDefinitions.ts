import { validateQuestGraph } from '../content/QuestValidator';
import { ALL_ITEMS } from './InventoryDefinitions';
import { ALL_RELATIONSHIP_CHARACTERS, CASTING_GATEKEEPER } from './RelationshipDefinitions';
import { ALL_TALENTS } from './TalentDefinitions';
import type { QuestDef } from './Quests';

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

export const ALL_QUESTS: readonly QuestDef[] = [FIRST_AUDITION_QUEST, SCREEN_TEST_QUEST];

validateQuestGraph(ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_TALENTS, ALL_ITEMS);

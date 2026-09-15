import { validateQuestGraph } from '../content/QuestValidator';
import { ALL_RELATIONSHIP_CHARACTERS, CASTING_GATEKEEPER } from './RelationshipDefinitions';
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
      rewards: [{ kind: 'resource-delta', delta: { money: 25, reputation: 5 } }],
    },
  ],
};

/** Requires both the prerequisite quest and the casting gatekeeper's trust
 * (see CASTING_OFFICE_DIALOGUE) — completing "First Audition" alone isn't
 * enough if you got there by name-dropping or stalling rather than earning
 * her confidence. This exercises round 6's relationship-gated quest
 * prerequisite alongside the existing quest-status one (both must hold),
 * the same way round 2 left some dialogue branches unexercised to
 * demonstrate a locked -> available transition. */
export const SCREEN_TEST_QUEST: QuestDef = {
  id: 'screen-test',
  title: 'Screen Test',
  summary: 'A follow-up opportunity that opens up once you land your first callback and earn the gatekeeper\'s trust.',
  prerequisites: [
    { kind: 'quest-status', questId: 'first-audition', status: 'completed' },
    { kind: 'relationship-at-least', characterId: CASTING_GATEKEEPER.id, axis: 'trust', minimum: 10 },
  ],
  stages: [{ id: 'attend', description: 'Attend the screen test.' }],
};

export const ALL_QUESTS: readonly QuestDef[] = [FIRST_AUDITION_QUEST, SCREEN_TEST_QUEST];

validateQuestGraph(ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS);

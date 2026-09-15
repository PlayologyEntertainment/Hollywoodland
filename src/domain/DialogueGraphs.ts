import { validateDialogueGraph } from '../content/DialogueGraphValidator';
import { ALL_ITEMS } from './InventoryDefinitions';
import { ALL_QUESTS } from './QuestDefinitions';
import { ALL_RELATIONSHIP_CHARACTERS, CASTING_GATEKEEPER } from './RelationshipDefinitions';
import { ALL_TALENTS } from './TalentDefinitions';
import type { DialogueGraph } from './Dialogue';

/** Debug content for the Phase 2 dialogue-tree spike: an unnamed casting-
 * office clerk, standing in for the `casting-gatekeeper` relationship
 * roster entry (see RelationshipDefinitions.ts). Character names/
 * relationships remain Owner approval required per
 * docs/DRAFT_TRACK_B_CANON_PROPOSAL.md — this content exists to exercise
 * the dialogue and relationship engines, not to lock in narrative. */
export const CASTING_OFFICE_DIALOGUE: DialogueGraph = {
  id: 'casting-office-intro',
  rootNodeId: 'root',
  nodes: [
    {
      id: 'root',
      speaker: 'Clerk',
      text: '"Appointment, photograph, or miracle?" she asks, barely glancing up.',
      choices: [
        {
          id: 'offer-photo',
          label: 'Here is my photograph.',
          next: 'photo-reviewed',
          effects: [
            { kind: 'set-fact', fact: 'showedHeadshot' },
            { kind: 'relationship-delta', characterId: CASTING_GATEKEEPER.id, delta: { trust: 2 } },
          ],
        },
        {
          id: 'ask-miracle',
          label: 'I’ll start with a miracle.',
          next: 'miracle-reply',
          effects: [{ kind: 'relationship-delta', characterId: CASTING_GATEKEEPER.id, delta: { tension: 3 } }],
        },
      ],
    },
    {
      id: 'photo-reviewed',
      speaker: 'Clerk',
      text: '"Not bad. Can you read for us Tuesday?"',
      choices: [
        {
          id: 'accept-audition',
          label: 'I’ll be there.',
          next: 'farewell-optimistic',
          effects: [
            { kind: 'resource-delta', delta: { reputation: 3 } },
            { kind: 'quest-action', action: 'start', questId: 'first-audition' },
            { kind: 'quest-action', action: 'complete-stage', questId: 'first-audition', stageId: 'booked' },
            { kind: 'relationship-delta', characterId: CASTING_GATEKEEPER.id, delta: { trust: 5 } },
          ],
        },
        {
          id: 'name-drop',
          label: 'Mention a contact on the lot.',
          next: 'farewell-impressed',
          conditions: [{ kind: 'resource-at-least', resource: 'reputation', minimum: 8 }],
          effects: [
            { kind: 'resource-delta', delta: { reputation: 2 } },
            { kind: 'relationship-delta', characterId: CASTING_GATEKEEPER.id, delta: { tension: 4 } },
          ],
        },
        {
          id: 'ask-about-audition',
          label: 'Any word on the audition?',
          next: 'farewell-landed',
          conditions: [{ kind: 'quest-status', questId: 'first-audition', status: 'active' }],
          effects: [
            { kind: 'quest-action', action: 'complete-stage', questId: 'first-audition', stageId: 'callback' },
            { kind: 'relationship-delta', characterId: CASTING_GATEKEEPER.id, delta: { trust: 3 } },
          ],
        },
        {
          id: 'decline-audition',
          label: 'Not this week.',
          next: 'farewell-neutral',
          effects: [{ kind: 'relationship-delta', characterId: CASTING_GATEKEEPER.id, delta: { tension: 2 } }],
        },
        {
          id: 'ask-for-early-slot',
          label: 'Ask if she can slot you in earlier.',
          next: 'farewell-favor',
          conditions: [{ kind: 'relationship-at-least', characterId: CASTING_GATEKEEPER.id, axis: 'trust', minimum: 8 }],
          effects: [
            { kind: 'relationship-delta', characterId: CASTING_GATEKEEPER.id, delta: { obligation: -5 } },
            { kind: 'relationship-pivotal-flag', characterId: CASTING_GATEKEEPER.id, flag: 'calledInFavor' },
          ],
        },
        {
          id: 'cite-experience',
          label: 'Mention you have already been through one callback.',
          next: 'farewell-impressed',
          conditions: [{ kind: 'level-at-least', minimum: 2 }],
          effects: [{ kind: 'relationship-delta', characterId: CASTING_GATEKEEPER.id, delta: { trust: 2 } }],
        },
        {
          id: 'show-studio-headshot',
          label: 'Show her the studio headshot from your last callback.',
          next: 'farewell-impressed',
          conditions: [{ kind: 'item-owned', itemId: 'studio-headshot' }],
          effects: [{ kind: 'relationship-delta', characterId: CASTING_GATEKEEPER.id, delta: { trust: 2 } }],
        },
      ],
    },
    {
      id: 'miracle-reply',
      speaker: 'Clerk',
      text: '"Everyone wants a miracle. Come back with a photograph."',
      choices: [
        {
          id: 'press-your-luck',
          label: 'Remind her you already showed one.',
          next: 'photo-reviewed',
          conditions: [{ kind: 'fact', fact: 'showedHeadshot' }],
          effects: [{ kind: 'relationship-delta', characterId: CASTING_GATEKEEPER.id, delta: { tension: 2 } }],
        },
        { id: 'leave-empty-handed', label: 'Step back outside.', next: null },
      ],
    },
    {
      id: 'farewell-optimistic',
      speaker: 'Clerk',
      text: '"Tuesday, then. Don’t be late."',
      choices: [{ id: 'leave', label: 'Step outside.', next: null }],
    },
    {
      id: 'farewell-impressed',
      speaker: 'Clerk',
      text: '"Oh — well, that changes things. Tuesday, front of the line."',
      choices: [{ id: 'leave', label: 'Step outside.', next: null }],
    },
    {
      id: 'farewell-neutral',
      speaker: 'Clerk',
      text: '"Suit yourself. The door’s always open."',
      choices: [{ id: 'leave', label: 'Step outside.', next: null }],
    },
    {
      id: 'farewell-landed',
      speaker: 'Clerk',
      text: '"You landed it? Good. Keep that up and we’ll talk about the next one."',
      choices: [{ id: 'leave', label: 'Step outside.', next: null }],
    },
    {
      id: 'farewell-favor',
      speaker: 'Clerk',
      text: '"Don’t make me regret this. Monday, then — first thing."',
      choices: [{ id: 'leave', label: 'Step outside.', next: null }],
    },
  ],
};

validateDialogueGraph(CASTING_OFFICE_DIALOGUE, ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_TALENTS, ALL_ITEMS);

const DIALOGUE_GRAPHS: Readonly<Record<string, DialogueGraph>> = Object.freeze({
  [CASTING_OFFICE_DIALOGUE.id]: CASTING_OFFICE_DIALOGUE,
});

export function getDialogueGraphById(id: string): DialogueGraph | undefined {
  return DIALOGUE_GRAPHS[id];
}

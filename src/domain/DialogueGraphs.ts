import { validateDialogueGraph } from '../content/DialogueGraphValidator';
import type { DialogueGraph } from './Dialogue';

/** Debug content for the Phase 2 dialogue-tree spike: an unnamed casting-
 * office clerk. Character names/relationships remain Owner approval
 * required per docs/DRAFT_TRACK_B_CANON_PROPOSAL.md — this content exists
 * to exercise the dialogue engine, not to lock in narrative. */
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
          effects: [{ kind: 'set-fact', fact: 'showedHeadshot' }],
        },
        { id: 'ask-miracle', label: 'I’ll start with a miracle.', next: 'miracle-reply' },
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
          effects: [{ kind: 'resource-delta', delta: { reputation: 3 } }],
        },
        {
          id: 'name-drop',
          label: 'Mention a contact on the lot.',
          next: 'farewell-impressed',
          conditions: [{ kind: 'resource-at-least', resource: 'reputation', minimum: 8 }],
          effects: [{ kind: 'resource-delta', delta: { reputation: 2 } }],
        },
        { id: 'decline-audition', label: 'Not this week.', next: 'farewell-neutral' },
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
  ],
};

validateDialogueGraph(CASTING_OFFICE_DIALOGUE);

const DIALOGUE_GRAPHS: Readonly<Record<string, DialogueGraph>> = Object.freeze({
  [CASTING_OFFICE_DIALOGUE.id]: CASTING_OFFICE_DIALOGUE,
});

export function getDialogueGraphById(id: string): DialogueGraph | undefined {
  return DIALOGUE_GRAPHS[id];
}

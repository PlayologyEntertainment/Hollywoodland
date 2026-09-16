import { validateDialogueGraph } from '../content/DialogueGraphValidator';
import { ALL_ITEMS } from './InventoryDefinitions';
import { ALL_QUESTS } from './QuestDefinitions';
import { ALL_RELATIONSHIP_CHARACTERS, CASTING_GATEKEEPER, DINER_CONFIDANT, LANDLADY } from './RelationshipDefinitions';
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

/** Round 14's second social hub: the `diner-confidant` roster entry's first
 * content, eight rounds after RelationshipDefinitions.ts introduced the
 * full nine-character debug roster with none of the other eight wired to
 * anything yet. A deliberately lower-stakes counterpart to the casting
 * office — no resource cost to enter (see BoulevardSpikeScene's
 * `diner-entered` handling), and its `ask-about-gossip-column` choice is
 * this codebase's first `talent-unlocked` condition in real content,
 * giving the talent tree's "spend a point" action a narrative payoff the
 * same way round 9's `cite-experience`/`show-studio-headshot` choices did
 * for `level-at-least`/`item-owned`. */
export const DINER_DIALOGUE: DialogueGraph = {
  id: 'sunset-diner-intro',
  rootNodeId: 'root',
  nodes: [
    {
      id: 'root',
      speaker: 'Counter Girl',
      text: '"Coffee, doll? You look like you could use it," she says, already reaching for the pot.',
      choices: [
        {
          id: 'take-coffee',
          label: 'Thanks — I could use it.',
          next: 'settled-in',
          effects: [
            { kind: 'relationship-delta', characterId: DINER_CONFIDANT.id, delta: { trust: 2 } },
            { kind: 'quest-action', action: 'start', questId: 'diner-introductions' },
            { kind: 'quest-action', action: 'complete-stage', questId: 'diner-introductions', stageId: 'introduced' },
          ],
        },
        {
          id: 'decline-coffee',
          label: 'Just passing through.',
          next: 'settled-in',
          effects: [{ kind: 'relationship-delta', characterId: DINER_CONFIDANT.id, delta: { tension: 1 } }],
        },
      ],
    },
    {
      id: 'settled-in',
      speaker: 'Counter Girl',
      text: '"So, what brings a face like yours to this end of the Boulevard?"',
      choices: [
        {
          id: 'ask-about-town',
          label: 'What is the real story on this town?',
          next: 'gossip-reply',
          conditions: [{ kind: 'quest-status', questId: 'diner-introductions', status: 'active' }],
          effects: [
            { kind: 'quest-action', action: 'complete-stage', questId: 'diner-introductions', stageId: 'earned-trust' },
            { kind: 'relationship-delta', characterId: DINER_CONFIDANT.id, delta: { trust: 3 } },
          ],
        },
        {
          id: 'ask-about-gossip-column',
          label: 'Read the room, then ask about the gossip column.',
          next: 'gossip-reply',
          conditions: [{ kind: 'talent-unlocked', talentId: 'observation-1' }],
          effects: [
            { kind: 'relationship-delta', characterId: DINER_CONFIDANT.id, delta: { trust: 2 } },
            { kind: 'relationship-pivotal-flag', characterId: DINER_CONFIDANT.id, flag: 'sharedColumnTip' },
          ],
        },
        { id: 'stay-quiet', label: 'Just finish your coffee.', next: null },
      ],
    },
    {
      id: 'gossip-reply',
      speaker: 'Counter Girl',
      text: '"Ask around enough and you will hear it all — who is bankable, who is trouble, and who is both."',
      choices: [{ id: 'leave', label: 'Thanks for the coffee.', next: null }],
    },
  ],
};

validateDialogueGraph(DINER_DIALOGUE, ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_TALENTS, ALL_ITEMS);

/** Round 15's third Boulevard location: the `landlady` roster entry's first
 * content. `ask-for-extension` exercises the `obligation` favor-ledger axis
 * for a second character (only `casting-gatekeeper`'s `ask-for-early-slot`
 * used it before), and `show-callback-slip` is this codebase's second
 * `item-owned` condition (against `first-callback-slip` rather than
 * `studio-headshot`, and reachable the same way — First Audition's
 * callback stage grants both). */
export const LANDLADY_DIALOGUE: DialogueGraph = {
  id: 'boarding-house-intro',
  rootNodeId: 'root',
  nodes: [
    {
      id: 'root',
      speaker: 'Landlady',
      text: '"Rent\'s due Friday, same as always," she says, not looking up from her ledger.',
      choices: [
        {
          id: 'pay-rent-full',
          label: 'Here — this week, paid in full.',
          next: 'settled-in',
          effects: [
            { kind: 'resource-delta', delta: { money: -6 } },
            { kind: 'relationship-delta', characterId: LANDLADY.id, delta: { trust: 3 } },
            { kind: 'quest-action', action: 'start', questId: 'making-rent' },
            { kind: 'quest-action', action: 'complete-stage', questId: 'making-rent', stageId: 'first-payment' },
          ],
        },
        {
          id: 'ask-for-extension',
          label: 'Could I get a few more days?',
          next: 'settled-in',
          effects: [
            { kind: 'relationship-delta', characterId: LANDLADY.id, delta: { obligation: -5, tension: 2 } },
            { kind: 'quest-action', action: 'start', questId: 'making-rent' },
            { kind: 'quest-action', action: 'complete-stage', questId: 'making-rent', stageId: 'first-payment' },
          ],
        },
      ],
    },
    {
      id: 'settled-in',
      speaker: 'Landlady',
      text: '"Just so we are clear where we stand," she says, setting down her pen.',
      choices: [
        {
          id: 'reassure-generic',
          label: 'I am good for it — steady work is coming.',
          next: null,
          conditions: [{ kind: 'quest-status', questId: 'making-rent', status: 'active' }],
          effects: [
            { kind: 'quest-action', action: 'complete-stage', questId: 'making-rent', stageId: 'settled-in' },
            { kind: 'relationship-delta', characterId: LANDLADY.id, delta: { trust: 2 } },
          ],
        },
        {
          id: 'show-callback-slip',
          label: 'Show her the callback slip from your last audition.',
          next: null,
          conditions: [{ kind: 'item-owned', itemId: 'first-callback-slip' }],
          effects: [
            { kind: 'quest-action', action: 'complete-stage', questId: 'making-rent', stageId: 'settled-in' },
            { kind: 'relationship-delta', characterId: LANDLADY.id, delta: { trust: 4 } },
          ],
        },
        { id: 'say-nothing', label: 'Just nod and head upstairs.', next: null },
      ],
    },
  ],
};

validateDialogueGraph(LANDLADY_DIALOGUE, ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_TALENTS, ALL_ITEMS);

const DIALOGUE_GRAPHS: Readonly<Record<string, DialogueGraph>> = Object.freeze({
  [CASTING_OFFICE_DIALOGUE.id]: CASTING_OFFICE_DIALOGUE,
  [DINER_DIALOGUE.id]: DINER_DIALOGUE,
  [LANDLADY_DIALOGUE.id]: LANDLADY_DIALOGUE,
});

export function getDialogueGraphById(id: string): DialogueGraph | undefined {
  return DIALOGUE_GRAPHS[id];
}

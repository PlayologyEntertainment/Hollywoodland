import { validateDialogueGraph } from '../content/DialogueGraphValidator';
import { ALL_ITEMS } from './InventoryDefinitions';
import { ALL_QUESTS } from './QuestDefinitions';
import { ALL_RELATIONSHIP_CHARACTERS, CASTING_GATEKEEPER, DINER_CONFIDANT, LANDLADY, PRODUCTION_COORDINATOR, RIVAL, SCENE_PARTNER } from './RelationshipDefinitions';
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

/** Round 16's fourth Boulevard location: the `rival` roster entry's first
 * content — the only one of the four so far where `supportsAttraction` is
 * true, giving `flirt-back` this codebase's first content use of the
 * `attraction` axis, and its condition on `charm-1` is the second
 * `talent-unlocked` check in content after round 14's `observation-1`
 * (see DINER_DIALOGUE above). `wish-her-luck` mirrors LANDLADY_DIALOGUE's
 * `reassure-generic` narrative path, branching against the content-gated
 * `flirt-back` the same "narrative OR content-gated" way round 9 and round
 * 15 split their own second-stage choices. */
export const RIVAL_DIALOGUE: DialogueGraph = {
  id: 'backlot-gate-intro',
  rootNodeId: 'root',
  nodes: [
    {
      id: 'root',
      speaker: 'Rival',
      text: '"Well, look who else got called back," she says, looking you up and down.',
      choices: [
        {
          id: 'match-her-look',
          label: 'Look her up and down right back.',
          next: 'sizing-up',
          effects: [
            { kind: 'relationship-delta', characterId: RIVAL.id, delta: { tension: 3 } },
            { kind: 'quest-action', action: 'start', questId: 'backlot-rivalry' },
            { kind: 'quest-action', action: 'complete-stage', questId: 'backlot-rivalry', stageId: 'first-encounter' },
          ],
        },
        {
          id: 'offer-common-ground',
          label: 'Same casting call, huh? Small town.',
          next: 'sizing-up',
          effects: [
            { kind: 'relationship-delta', characterId: RIVAL.id, delta: { trust: 2 } },
            { kind: 'quest-action', action: 'start', questId: 'backlot-rivalry' },
            { kind: 'quest-action', action: 'complete-stage', questId: 'backlot-rivalry', stageId: 'first-encounter' },
          ],
        },
      ],
    },
    {
      id: 'sizing-up',
      speaker: 'Rival',
      text: '"Let\'s see who\'s still standing after the next round of cuts," she says, but it sounds almost like a dare.',
      choices: [
        {
          id: 'wish-her-luck',
          label: 'May the best actress win.',
          next: null,
          conditions: [{ kind: 'quest-status', questId: 'backlot-rivalry', status: 'active' }],
          effects: [
            { kind: 'quest-action', action: 'complete-stage', questId: 'backlot-rivalry', stageId: 'earned-respect' },
            { kind: 'relationship-delta', characterId: RIVAL.id, delta: { trust: 3 } },
          ],
        },
        {
          id: 'flirt-back',
          label: 'Careful — I don\'t lose easily.',
          next: null,
          conditions: [{ kind: 'talent-unlocked', talentId: 'charm-1' }],
          effects: [
            { kind: 'quest-action', action: 'complete-stage', questId: 'backlot-rivalry', stageId: 'earned-respect' },
            { kind: 'relationship-delta', characterId: RIVAL.id, delta: { attraction: 4, tension: 1 } },
          ],
        },
        { id: 'stay-cold', label: 'Say nothing and walk away.', next: null },
      ],
    },
  ],
};

validateDialogueGraph(RIVAL_DIALOGUE, ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_TALENTS, ALL_ITEMS);

/** Round 17's fifth Boulevard location: the `production-coordinator` roster
 * entry's first content, past the Backlot Gate at the extras corral. The
 * `ask-about-the-shot` and `show-callback-slip` choices are this codebase's
 * first dialogue effects to grant an item directly (`item-grant` on
 * `background-extra-voucher`) rather than through a quest stage reward —
 * the engine has supported this since round 12, but no content used it
 * until now. `show-callback-slip` reuses `first-callback-slip` the same way
 * LANDLADY_DIALOGUE's choice of the same name did, rewarding continuity
 * from First Audition with a larger trust gain than the generic path.
 * `wait-for-the-wave` mirrors the other three locations' walk-away choice:
 * no condition, no effects, `cleared-for-call` stays incomplete. */
export const PRODUCTION_COORDINATOR_DIALOGUE: DialogueGraph = {
  id: 'extras-corral-intro',
  rootNodeId: 'root',
  nodes: [
    {
      id: 'root',
      speaker: 'Production Coordinator',
      text: '"Name?" she snaps, pen already hovering over the sign-in sheet. "Corral fills up fast — I do not have all morning."',
      choices: [
        {
          id: 'give-name-crisply',
          label: 'Give your name and step back to wait.',
          next: 'checked-in-reply',
          effects: [
            { kind: 'relationship-delta', characterId: PRODUCTION_COORDINATOR.id, delta: { trust: 2 } },
            { kind: 'quest-action', action: 'start', questId: 'extras-call' },
            { kind: 'quest-action', action: 'complete-stage', questId: 'extras-call', stageId: 'checked-in' },
          ],
        },
        {
          id: 'apologize-for-cutting-it-close',
          label: 'Apologize — traffic on the Boulevard held you up.',
          next: 'checked-in-reply',
          effects: [
            { kind: 'relationship-delta', characterId: PRODUCTION_COORDINATOR.id, delta: { tension: 2 } },
            { kind: 'quest-action', action: 'start', questId: 'extras-call' },
            { kind: 'quest-action', action: 'complete-stage', questId: 'extras-call', stageId: 'checked-in' },
          ],
        },
      ],
    },
    {
      id: 'checked-in-reply',
      speaker: 'Production Coordinator',
      text: '"You\'re on the list," she says, already scanning past you toward the corral. "Stay behind the rope until someone waves you onto the set."',
      choices: [
        {
          id: 'ask-about-the-shot',
          label: 'Ask what today\'s call actually needs from the extras.',
          next: null,
          conditions: [{ kind: 'quest-status', questId: 'extras-call', status: 'active' }],
          effects: [
            { kind: 'quest-action', action: 'complete-stage', questId: 'extras-call', stageId: 'cleared-for-call' },
            { kind: 'relationship-delta', characterId: PRODUCTION_COORDINATOR.id, delta: { trust: 3 } },
            { kind: 'item-grant', itemId: 'background-extra-voucher' },
          ],
        },
        {
          id: 'show-callback-slip',
          label: 'Mention the callback slip from the casting office.',
          next: null,
          conditions: [{ kind: 'item-owned', itemId: 'first-callback-slip' }],
          effects: [
            { kind: 'quest-action', action: 'complete-stage', questId: 'extras-call', stageId: 'cleared-for-call' },
            { kind: 'relationship-delta', characterId: PRODUCTION_COORDINATOR.id, delta: { trust: 4 } },
            { kind: 'item-grant', itemId: 'background-extra-voucher' },
          ],
        },
        { id: 'wait-for-the-wave', label: 'Say nothing and wait for the wave-in.', next: null },
      ],
    },
  ],
};

validateDialogueGraph(PRODUCTION_COORDINATOR_DIALOGUE, ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_TALENTS, ALL_ITEMS);

/** Round 18's sixth Boulevard location: the `scene-partner` roster entry's
 * first content, past the extras corral at the soundstage. Both root
 * choices complete `first-run-through` regardless of branch, the same
 * "either way advances the stage" shape `RIVAL_DIALOGUE`'s root uses.
 * `dig-into-motivation` is this codebase's first content use of `drama-1`
 * (see TalentDefinitions.ts), and — unlike `RIVAL_DIALOGUE`, where the
 * talent gate sits on the `attraction` choice — it gates a deeper *trust*
 * path instead, leaving `lean-into-the-chemistry`'s `attraction` branch
 * ungated: `scene-partner` is a collaborator first, so the game doesn't
 * require a spent talent point before romance is even on the table,
 * matching docs/DRAFT_TRACK_B_CANON_PROPOSAL.md's read on Corinne Lake as
 * reachable for friendship, romance, or rivalry from the start. */
export const SCENE_PARTNER_DIALOGUE: DialogueGraph = {
  id: 'soundstage-intro',
  rootNodeId: 'root',
  nodes: [
    {
      id: 'root',
      speaker: 'Scene Partner',
      text: '"You\'re covering my mark today?" she asks, flipping through her sides. "Let\'s at least get through it once before they roll film."',
      choices: [
        {
          id: 'run-lines-eagerly',
          label: 'Offer to run the scene twice before the crew is ready.',
          next: 'settled-in',
          effects: [
            { kind: 'relationship-delta', characterId: SCENE_PARTNER.id, delta: { trust: 2 } },
            { kind: 'quest-action', action: 'start', questId: 'scene-rehearsal' },
            { kind: 'quest-action', action: 'complete-stage', questId: 'scene-rehearsal', stageId: 'first-run-through' },
          ],
        },
        {
          id: 'match-her-energy',
          label: 'Play it too big, daring her to match you.',
          next: 'settled-in',
          effects: [
            { kind: 'relationship-delta', characterId: SCENE_PARTNER.id, delta: { tension: 2 } },
            { kind: 'quest-action', action: 'start', questId: 'scene-rehearsal' },
            { kind: 'quest-action', action: 'complete-stage', questId: 'scene-rehearsal', stageId: 'first-run-through' },
          ],
        },
      ],
    },
    {
      id: 'settled-in',
      speaker: 'Scene Partner',
      text: '"Places in five," the assistant director calls from off camera. "You\'ve got until then to find it," she says, script still in hand.',
      choices: [
        {
          id: 'commit-to-the-scene',
          label: 'Play it exactly as blocked — no surprises.',
          next: null,
          conditions: [{ kind: 'quest-status', questId: 'scene-rehearsal', status: 'active' }],
          effects: [
            { kind: 'quest-action', action: 'complete-stage', questId: 'scene-rehearsal', stageId: 'found-the-rhythm' },
            { kind: 'relationship-delta', characterId: SCENE_PARTNER.id, delta: { trust: 3 } },
          ],
        },
        {
          id: 'dig-into-motivation',
          label: 'Dig into what your characters actually want from each other.',
          next: null,
          conditions: [{ kind: 'talent-unlocked', talentId: 'drama-1' }],
          effects: [
            { kind: 'quest-action', action: 'complete-stage', questId: 'scene-rehearsal', stageId: 'found-the-rhythm' },
            { kind: 'relationship-delta', characterId: SCENE_PARTNER.id, delta: { trust: 5 } },
          ],
        },
        {
          id: 'lean-into-the-chemistry',
          label: 'Tell her you could get used to rehearsing with her.',
          next: null,
          effects: [
            { kind: 'quest-action', action: 'complete-stage', questId: 'scene-rehearsal', stageId: 'found-the-rhythm' },
            { kind: 'relationship-delta', characterId: SCENE_PARTNER.id, delta: { attraction: 4, trust: 1 } },
          ],
        },
      ],
    },
  ],
};

validateDialogueGraph(SCENE_PARTNER_DIALOGUE, ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_TALENTS, ALL_ITEMS);

const DIALOGUE_GRAPHS: Readonly<Record<string, DialogueGraph>> = Object.freeze({
  [CASTING_OFFICE_DIALOGUE.id]: CASTING_OFFICE_DIALOGUE,
  [DINER_DIALOGUE.id]: DINER_DIALOGUE,
  [LANDLADY_DIALOGUE.id]: LANDLADY_DIALOGUE,
  [RIVAL_DIALOGUE.id]: RIVAL_DIALOGUE,
  [PRODUCTION_COORDINATOR_DIALOGUE.id]: PRODUCTION_COORDINATOR_DIALOGUE,
  [SCENE_PARTNER_DIALOGUE.id]: SCENE_PARTNER_DIALOGUE,
});

export function getDialogueGraphById(id: string): DialogueGraph | undefined {
  return DIALOGUE_GRAPHS[id];
}

import { describe, expect, it } from 'vitest';

import { createDefaultCareerState, type CareerState } from '../src/domain/CareerState';
import { applyDialogueChoiceById, getDialogueNode, isChoiceAvailable, type DialogueChoice, type DialogueGraph } from '../src/domain/Dialogue';
import {
  CASTING_OFFICE_DIALOGUE,
  DINER_DIALOGUE,
  LANDLADY_DIALOGUE,
  PRODUCTION_COORDINATOR_DIALOGUE,
  RIVAL_DIALOGUE,
  SCENE_PARTNER_DIALOGUE,
} from '../src/domain/DialogueGraphs';
import { ALL_ITEMS } from '../src/domain/InventoryDefinitions';
import { ALL_QUESTS } from '../src/domain/QuestDefinitions';
import { ALL_RELATIONSHIP_CHARACTERS } from '../src/domain/RelationshipDefinitions';

/** Every dialogue choice that completes a quest's final stage — the "gate progress" moments — across all seven
 * quests, paired with the node it lives on. One entry per choice id from DialogueGraphs.ts. */
const QUEST_COMPLETING_CHOICES: ReadonlyArray<{ graph: DialogueGraph; nodeId: string; choiceId: string }> = [
  { graph: CASTING_OFFICE_DIALOGUE, nodeId: 'root', choiceId: 'ask-for-screen-test' },
  { graph: CASTING_OFFICE_DIALOGUE, nodeId: 'photo-reviewed', choiceId: 'ask-about-audition' },
  { graph: DINER_DIALOGUE, nodeId: 'settled-in', choiceId: 'ask-about-town' },
  { graph: LANDLADY_DIALOGUE, nodeId: 'settled-in', choiceId: 'reassure-generic' },
  { graph: LANDLADY_DIALOGUE, nodeId: 'settled-in', choiceId: 'show-callback-slip' },
  { graph: RIVAL_DIALOGUE, nodeId: 'sizing-up', choiceId: 'wish-her-luck' },
  { graph: RIVAL_DIALOGUE, nodeId: 'sizing-up', choiceId: 'flirt-back' },
  { graph: PRODUCTION_COORDINATOR_DIALOGUE, nodeId: 'checked-in-reply', choiceId: 'ask-about-the-shot' },
  { graph: PRODUCTION_COORDINATOR_DIALOGUE, nodeId: 'checked-in-reply', choiceId: 'show-callback-slip' },
  { graph: SCENE_PARTNER_DIALOGUE, nodeId: 'settled-in', choiceId: 'commit-to-the-scene' },
  { graph: SCENE_PARTNER_DIALOGUE, nodeId: 'settled-in', choiceId: 'dig-into-motivation' },
  { graph: SCENE_PARTNER_DIALOGUE, nodeId: 'settled-in', choiceId: 'lean-into-the-chemistry' },
];

function getChoice(graph: DialogueGraph, nodeId: string, choiceId: string): DialogueChoice {
  const choice = getDialogueNode(graph, nodeId)?.choices.find((candidate) => candidate.id === choiceId);
  if (choice === undefined) throw new Error(`No choice ${graph.id}/${nodeId}/${choiceId}`);
  return choice;
}

describe('energy costs on quest-completing dialogue choices', () => {
  it('spends 10 energy, and says so right in the label, on every quest-completing choice', () => {
    for (const { graph, nodeId, choiceId } of QUEST_COMPLETING_CHOICES) {
      const choice = getChoice(graph, nodeId, choiceId);
      expect(choice.label, `${graph.id}/${choiceId}`).toContain('(-10 Energy)');
      expect(choice.effects, `${graph.id}/${choiceId}`).toContainEqual({ kind: 'resource-delta', delta: { energy: -10 } });
      expect(choice.conditions, `${graph.id}/${choiceId}`).toContainEqual({
        kind: 'resource-at-least',
        resource: 'energy',
        minimum: 10,
      });
    }
  });

  it('disables a quest-completing choice once energy drops below its cost', () => {
    const spent: CareerState = { ...createDefaultCareerState(), resources: { ...createDefaultCareerState().resources, energy: 5 } };
    for (const { graph, nodeId, choiceId } of QUEST_COMPLETING_CHOICES) {
      const choice = getChoice(graph, nodeId, choiceId);
      expect(isChoiceAvailable(spent, choice, ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_ITEMS), `${graph.id}/${choiceId}`).toBe(
        false,
      );
    }
  });

  it('actually deducts 10 energy when a quest-completing choice is picked (screen test, from a fresh state made eligible)', () => {
    // ask-for-screen-test also requires the screen-test quest to be 'available' (first-audition completed, level 2,
    // gatekeeper trust >= 10) — out of scope here. Exercise the simpler diner-introductions path instead, which only
    // needs the quest active.
    const started = applyDialogueChoiceById(
      createDefaultCareerState(),
      DINER_DIALOGUE,
      'root',
      'take-coffee',
      ALL_QUESTS,
      ALL_RELATIONSHIP_CHARACTERS,
      ALL_ITEMS,
    );
    expect(started.resources.energy).toBe(createDefaultCareerState().resources.energy);
    const completed = applyDialogueChoiceById(
      started,
      DINER_DIALOGUE,
      'settled-in',
      'ask-about-town',
      ALL_QUESTS,
      ALL_RELATIONSHIP_CHARACTERS,
      ALL_ITEMS,
    );
    expect(completed.resources.energy).toBe(started.resources.energy - 10);
  });
});

import { describe, expect, it } from 'vitest';

import { createDefaultCareerState } from '../src/domain/CareerState';
import {
  applyDialogueChoiceById,
  getDialogueNode,
  isChoiceAvailable,
  type DialogueChoice,
  type DialogueGraph,
} from '../src/domain/Dialogue';
import {
  CASTING_OFFICE_DIALOGUE,
  CELESTIAL_PALACE_DIALOGUE,
  COSTUME_SHOP_DIALOGUE,
  DIALOGUE_GRAPHS,
  DINER_DIALOGUE,
  KLIEG_LIGHT_DIALOGUE,
  LANDLADY_DIALOGUE,
  PRODUCTION_COORDINATOR_DIALOGUE,
  RIVAL_DIALOGUE,
  SCENE_PARTNER_DIALOGUE,
} from '../src/domain/DialogueGraphs';
import { ALL_ITEMS } from '../src/domain/InventoryDefinitions';
import { ALL_QUESTS } from '../src/domain/QuestDefinitions';
import { ALL_RELATIONSHIP_CHARACTERS } from '../src/domain/RelationshipDefinitions';

/** The expansion adds one experience-earning option to each NPC: a one-time, follow-up dialogue choice for the six NPCs
 * whose first quest already existed, and a second quest stage for the three NPCs who had none. */
const XP_OPTIONS: ReadonlyArray<{ graph: DialogueGraph; nodeId: string; choiceId: string; xp: number; fact: string }> = [
  { graph: CASTING_OFFICE_DIALOGUE, nodeId: 'root', choiceId: 'ask-for-pointers', xp: 15, fact: 'casting-pointers-asked' },
  { graph: DINER_DIALOGUE, nodeId: 'settled-in', choiceId: 'ask-about-her-story', xp: 10, fact: 'diner-story-asked' },
  { graph: LANDLADY_DIALOGUE, nodeId: 'settled-in', choiceId: 'ask-about-the-photographs', xp: 10, fact: 'boarding-house-photographs-asked' },
  { graph: RIVAL_DIALOGUE, nodeId: 'sizing-up', choiceId: 'ask-about-her-audition', xp: 10, fact: 'rival-audition-asked' },
  { graph: PRODUCTION_COORDINATOR_DIALOGUE, nodeId: 'checked-in-reply', choiceId: 'ask-how-to-get-noticed', xp: 10, fact: 'coordinator-noticed-asked' },
  { graph: SCENE_PARTNER_DIALOGUE, nodeId: 'settled-in', choiceId: 'ask-about-her-first-role', xp: 10, fact: 'scene-partner-first-role-asked' },
];

const NEW_QUESTS = ['costume-fitting', 'on-the-record', 'palace-matinee'] as const;

function getChoice(graph: DialogueGraph, nodeId: string, choiceId: string): DialogueChoice {
  const choice = getDialogueNode(graph, nodeId)?.choices.find((candidate) => candidate.id === choiceId);
  if (choice === undefined) throw new Error(`No choice ${graph.id}/${nodeId}/${choiceId}`);
  return choice;
}

describe('the slice content expansion', () => {
  it('has ten Chapter 1 quests', () => {
    expect(ALL_QUESTS.filter((quest) => (quest.chapter ?? 1) === 1)).toHaveLength(10);
    for (const id of NEW_QUESTS) expect(ALL_QUESTS.some((quest) => quest.id === id), id).toBe(true);
  });

  it('gives every NPC without a quest one, and each new quest a final stage that pays XP', () => {
    for (const id of NEW_QUESTS) {
      const quest = ALL_QUESTS.find((candidate) => candidate.id === id);
      const last = quest?.stages[quest.stages.length - 1];
      expect(last?.rewards, id).toContainEqual({ kind: 'xp-grant', amount: 15 });
    }
    // Each is started and progressed from its own NPC's dialogue graph.
    const startedIn = (graph: DialogueGraph, questId: string): boolean =>
      JSON.stringify(graph).includes(`"action":"start","questId":"${questId}"`);
    expect(startedIn(COSTUME_SHOP_DIALOGUE, 'costume-fitting')).toBe(true);
    expect(startedIn(KLIEG_LIGHT_DIALOGUE, 'on-the-record')).toBe(true);
    expect(startedIn(CELESTIAL_PALACE_DIALOGUE, 'palace-matinee')).toBe(true);
  });

  it('makes each follow-up XP option one-time, worth 10-15 XP, and 10 energy', () => {
    for (const { graph, nodeId, choiceId, xp, fact } of XP_OPTIONS) {
      const choice = getChoice(graph, nodeId, choiceId);
      const label = `${graph.id}/${choiceId}`;
      expect(choice.label, label).toContain('(-10 Energy)');
      expect(choice.effects, label).toContainEqual({ kind: 'xp-grant', amount: xp });
      expect(choice.effects, label).toContainEqual({ kind: 'resource-delta', delta: { energy: -10 } });
      expect(choice.effects, label).toContainEqual({ kind: 'set-fact', fact });
      expect(choice.conditions, label).toContainEqual({ kind: 'fact', fact, equals: false });
      expect(choice.conditions, label).toContainEqual({ kind: 'resource-at-least', resource: 'energy', minimum: 10 });
    }
  });

  it('keeps the follow-up options behind the NPC\'s first quest, so they cannot be reached before it', () => {
    for (const { graph, nodeId, choiceId } of XP_OPTIONS) {
      const choice = getChoice(graph, nodeId, choiceId);
      const fresh = createDefaultCareerState();
      expect(isChoiceAvailable(fresh, choice, ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_ITEMS), `${graph.id}/${choiceId}`).toBe(false);
    }
  });

  it('grants the diner follow-up XP once, after Diner Introductions is finished', () => {
    const run = (state: ReturnType<typeof createDefaultCareerState>, nodeId: string, choiceId: string) =>
      applyDialogueChoiceById(state, DINER_DIALOGUE, nodeId, choiceId, ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_ITEMS);
    let state = run(createDefaultCareerState(), 'root', 'take-coffee');
    state = run(state, 'settled-in', 'ask-about-town');
    const before = state.progression.xp + state.progression.level * 1000;
    const after = run(state, 'settled-in', 'ask-about-her-story');
    expect(after.progression.xp + after.progression.level * 1000).toBeGreaterThan(before);
    expect(after.facts['diner-story-asked']).toBe(true);
    const choice = getChoice(DINER_DIALOGUE, 'settled-in', 'ask-about-her-story');
    expect(isChoiceAvailable(after, choice, ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_ITEMS)).toBe(false);
  });

  it('registers every graph, so nothing new is unreachable', () => {
    expect(Object.keys(DIALOGUE_GRAPHS)).toHaveLength(9);
  });
});

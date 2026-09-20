import { describe, expect, it } from 'vitest';

import { createDefaultCareerState, type CareerState } from '../src/domain/CareerState';
import { applyDialogueChoiceById, getDialogueNode, isChoiceAvailable } from '../src/domain/Dialogue';
import { LANDLADY_DIALOGUE } from '../src/domain/DialogueGraphs';
import { ALL_ITEMS } from '../src/domain/InventoryDefinitions';
import { ALL_QUESTS } from '../src/domain/QuestDefinitions';
import { ALL_RELATIONSHIP_CHARACTERS, LANDLADY } from '../src/domain/RelationshipDefinitions';
import { getRelationshipAxes } from '../src/domain/Relationships';

function pick(state: CareerState, nodeId: string, choiceId: string): CareerState {
  return applyDialogueChoiceById(state, LANDLADY_DIALOGUE, nodeId, choiceId, ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_ITEMS);
}

describe('the landlady conversation that opens Bellhaven Rooms', () => {
  it('lets a player who has already settled up skip the rent talk for free', () => {
    const state = createDefaultCareerState();
    const root = getDialogueNode(LANDLADY_DIALOGUE, 'root');
    const skip = root?.choices.find((choice) => choice.id === 'nothing-to-settle');
    expect(skip?.next).toBe('settled-in');
    if (skip === undefined) throw new Error('no skip choice');
    expect(isChoiceAvailable(state, skip, ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_ITEMS)).toBe(true);

    const after = pick(state, 'root', 'nothing-to-settle');
    // No effects: no rent paid, no extension asked for, no relationship change.
    expect(after).toBe(state);
    expect(after.resources.money).toBe(state.resources.money);
    expect(getRelationshipAxes(after.relationships, LANDLADY).tension).toBe(0);
  });

  it('still charges rent or costs goodwill for the two original opening choices', () => {
    const state = createDefaultCareerState();
    const paid = pick(state, 'root', 'pay-rent-full');
    expect(paid.resources.money).toBe(state.resources.money - 6);
    const extended = pick(state, 'root', 'ask-for-extension');
    expect(getRelationshipAxes(extended.relationships, LANDLADY).tension).toBe(2);
  });

  it('hands off to the Home Menu from every choice that ends the conversation', () => {
    const closing = getDialogueNode(LANDLADY_DIALOGUE, 'settled-in');
    expect(closing).toBeDefined();
    const enders = (closing?.choices ?? []).filter((choice) => choice.next === null);
    expect(enders.map((choice) => choice.id).sort()).toEqual(['reassure-generic', 'say-nothing', 'show-callback-slip']);
    for (const choice of enders) {
      expect(choice.opensHomeHub, choice.id).toBe(true);
    }
  });

  it('keeps "Just nod and head upstairs" free of effects', () => {
    const nod = getDialogueNode(LANDLADY_DIALOGUE, 'settled-in')?.choices.find((choice) => choice.id === 'say-nothing');
    expect(nod?.label).toBe('Just nod and head upstairs.');
    expect(nod?.effects).toBeUndefined();
    expect(nod?.opensHomeHub).toBe(true);
  });

  it('never hands off to the Home Menu from the opening node, where the player has not yet settled up', () => {
    const root = getDialogueNode(LANDLADY_DIALOGUE, 'root');
    for (const choice of root?.choices ?? []) {
      expect(choice.opensHomeHub, choice.id).toBeUndefined();
    }
  });
});

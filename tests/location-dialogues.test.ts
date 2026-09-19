// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { existsSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { createDefaultCareerState, type CareerState } from '../src/domain/CareerState';
import { applyDialogueChoiceById, isChoiceAvailable, getDialogueNode, type DialogueGraph } from '../src/domain/Dialogue';
import {
  CELESTIAL_PALACE_DIALOGUE,
  COSTUME_SHOP_DIALOGUE,
  KLIEG_LIGHT_DIALOGUE,
  getDialogueGraphById,
} from '../src/domain/DialogueGraphs';
import { grantItem } from '../src/domain/Inventory';
import { ALL_ITEMS } from '../src/domain/InventoryDefinitions';
import { ALL_QUESTS } from '../src/domain/QuestDefinitions';
import { ALL_RELATIONSHIP_CHARACTERS, REPORTER, WARDROBE_MENTOR } from '../src/domain/RelationshipDefinitions';
import { getRelationshipAxes } from '../src/domain/Relationships';

function pick(state: CareerState, graph: DialogueGraph, nodeId: string, choiceId: string): CareerState {
  return applyDialogueChoiceById(state, graph, nodeId, choiceId, ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_ITEMS);
}

function available(state: CareerState, graph: DialogueGraph, nodeId: string, choiceId: string): boolean {
  const choice = getDialogueNode(graph, nodeId)?.choices.find((candidate) => candidate.id === choiceId);
  if (choice === undefined) throw new Error(`No choice ${nodeId}/${choiceId}`);
  return isChoiceAvailable(state, choice, ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_ITEMS);
}

describe('the three new Boulevard interiors', () => {
  it('are registered by graph id', () => {
    for (const graph of [COSTUME_SHOP_DIALOGUE, KLIEG_LIGHT_DIALOGUE, CELESTIAL_PALACE_DIALOGUE]) {
      expect(getDialogueGraphById(graph.id)).toBe(graph);
    }
  });

  it('each have a promoted interior background', () => {
    for (const file of ['costume-shop', 'klieg-light-office', 'celestial-palace']) {
      expect(existsSync(new URL(`../public/assets/locations/${file}.webp`, import.meta.url)), file).toBe(true);
    }
  });
});

describe('The Silver Thimble', () => {
  it('earns trust once for admiring the coat', () => {
    const state = createDefaultCareerState();
    const after = pick(state, COSTUME_SHOP_DIALOGUE, 'root', 'admire-the-coat');
    expect(getRelationshipAxes(after.relationships, WARDROBE_MENTOR).trust).toBe(2);
    expect(available(after, COSTUME_SHOP_DIALOGUE, 'root', 'admire-the-coat')).toBe(false);
    // A second attempt is a no-op, so revisiting cannot farm trust.
    expect(pick(after, COSTUME_SHOP_DIALOGUE, 'root', 'admire-the-coat')).toBe(after);
  });

  it('spends a favor on the fitting, once, from either node', () => {
    const state = createDefaultCareerState();
    const viaCoat = pick(pick(state, COSTUME_SHOP_DIALOGUE, 'root', 'admire-the-coat'), COSTUME_SHOP_DIALOGUE, 'coat-reply', 'ask-about-a-fitting');
    const axes = getRelationshipAxes(viaCoat.relationships, WARDROBE_MENTOR);
    expect(axes.obligation).toBe(-2);
    expect(axes.trust).toBe(3);
    expect(axes.pivotalFlags.offeredFitting).toBe(true);
    expect(available(viaCoat, COSTUME_SHOP_DIALOGUE, 'root', 'ask-for-a-fitting')).toBe(false);
    expect(available(viaCoat, COSTUME_SHOP_DIALOGUE, 'coat-reply', 'ask-about-a-fitting')).toBe(false);
  });

  it('is not a romance track', () => {
    const after = pick(createDefaultCareerState(), COSTUME_SHOP_DIALOGUE, 'root', 'ask-for-a-fitting');
    expect(getRelationshipAxes(after.relationships, WARDROBE_MENTOR).attraction).toBeNull();
  });
});

describe('The Klieg Light', () => {
  it('makes the reporter owe the player for a tip, and the player owe him for gossip', () => {
    let state = createDefaultCareerState();
    state = pick(state, KLIEG_LIGHT_DIALOGUE, 'root', 'give-a-harmless-tip');
    expect(getRelationshipAxes(state.relationships, REPORTER).obligation).toBe(2);
    state = pick(state, KLIEG_LIGHT_DIALOGUE, 'root', 'ask-what-he-knows');
    const axes = getRelationshipAxes(state.relationships, REPORTER);
    expect(axes.obligation).toBe(0);
    expect(axes.trust).toBe(2);
    expect(axes.pivotalFlags.sharedCastingTip).toBe(true);
  });

  it('lets each favor be traded only once', () => {
    let state = pick(createDefaultCareerState(), KLIEG_LIGHT_DIALOGUE, 'root', 'give-a-harmless-tip');
    expect(available(state, KLIEG_LIGHT_DIALOGUE, 'root', 'give-a-harmless-tip')).toBe(false);
    state = pick(state, KLIEG_LIGHT_DIALOGUE, 'root', 'ask-what-he-knows');
    expect(available(state, KLIEG_LIGHT_DIALOGUE, 'root', 'ask-what-he-knows')).toBe(false);
  });

  it('costs a little tension to brush him off', () => {
    const after = pick(createDefaultCareerState(), KLIEG_LIGHT_DIALOGUE, 'root', 'dodge-the-question');
    expect(getRelationshipAxes(after.relationships, REPORTER).tension).toBe(1);
  });
});

describe('The Celestial Palace', () => {
  it('remembers a visit as a fact', () => {
    const after = pick(createDefaultCareerState(), CELESTIAL_PALACE_DIALOGUE, 'root', 'admire-the-ceiling');
    expect(after.facts['celestial-palace-visited']).toBe(true);
  });

  it('offers the matinee pass only to a player who owns the extra voucher', () => {
    const state = createDefaultCareerState();
    expect(available(state, CELESTIAL_PALACE_DIALOGUE, 'picture-reply', 'show-extra-voucher')).toBe(false);

    const voucher = ALL_ITEMS.find((item) => item.id === 'background-extra-voucher');
    if (voucher === undefined) throw new Error('background-extra-voucher missing from the item catalog');
    const holder: CareerState = { ...state, inventory: grantItem(state.inventory, voucher) };
    expect(available(holder, CELESTIAL_PALACE_DIALOGUE, 'picture-reply', 'show-extra-voucher')).toBe(true);

    const passed = pick(holder, CELESTIAL_PALACE_DIALOGUE, 'voucher-reply', 'accept-the-matinee-pass');
    expect(passed.facts['celestial-palace-matinee-pass']).toBe(true);
  });
});

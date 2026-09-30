// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { choiceUsesEnergy, describeDialogueChoice } from '../src/app/DialogueChoiceState';
import { CHOICE_ENERGY_SFX_FILE, CHOICE_PLAIN_SFX_FILE } from '../src/audio/AudioCues';
import { createDefaultCareerState, type CareerState } from '../src/domain/CareerState';
import { applyDialogueChoiceById, getDialogueNode, type DialogueChoice, type DialogueGraph } from '../src/domain/Dialogue';
import { CASTING_OFFICE_DIALOGUE, DINER_DIALOGUE, RIVAL_DIALOGUE } from '../src/domain/DialogueGraphs';
import { ALL_ITEMS } from '../src/domain/InventoryDefinitions';
import { ALL_QUESTS } from '../src/domain/QuestDefinitions';
import { ALL_RELATIONSHIP_CHARACTERS } from '../src/domain/RelationshipDefinitions';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8') as string;

function choiceOf(graph: DialogueGraph, nodeId: string, choiceId: string): DialogueChoice {
  const choice = getDialogueNode(graph, nodeId)?.choices.find((candidate) => candidate.id === choiceId);
  if (choice === undefined) throw new Error(`No choice ${graph.id}/${nodeId}/${choiceId}`);
  return choice;
}

const describe_ = (state: CareerState, choice: DialogueChoice) =>
  describeDialogueChoice(state, choice, ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_ITEMS);

const pick = (state: CareerState, graph: DialogueGraph, nodeId: string, choiceId: string): CareerState =>
  applyDialogueChoiceById(state, graph, nodeId, choiceId, ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_ITEMS);

describe('choiceUsesEnergy', () => {
  it('is true for a choice that spends energy and false for one that does not', () => {
    expect(choiceUsesEnergy(choiceOf(DINER_DIALOGUE, 'settled-in', 'ask-about-town'))).toBe(true);
    expect(choiceUsesEnergy(choiceOf(DINER_DIALOGUE, 'settled-in', 'stay-quiet'))).toBe(false);
    expect(choiceUsesEnergy(choiceOf(DINER_DIALOGUE, 'root', 'take-coffee'))).toBe(false);
  });
});

describe('describeDialogueChoice', () => {
  it('locks (blurs) a choice whose story prerequisite is not met yet', () => {
    // ask-about-town needs Diner Introductions to be active, which it is not on a fresh career.
    const state = describe_(createDefaultCareerState(), choiceOf(DINER_DIALOGUE, 'settled-in', 'ask-about-town'));
    expect(state).toEqual({ available: false, locked: true, usesEnergy: true });
  });

  it('does not lock a choice that only lacks energy', () => {
    let state = pick(createDefaultCareerState(), DINER_DIALOGUE, 'root', 'take-coffee');
    state = { ...state, resources: { ...state.resources, energy: 5 } };
    const described = describe_(state, choiceOf(DINER_DIALOGUE, 'settled-in', 'ask-about-town'));
    expect(described.available).toBe(false);
    expect(described.locked).toBe(false);
  });

  it('is available, and not locked, once the prerequisite is met', () => {
    const state = pick(createDefaultCareerState(), DINER_DIALOGUE, 'root', 'take-coffee');
    expect(describe_(state, choiceOf(DINER_DIALOGUE, 'settled-in', 'ask-about-town'))).toEqual({
      available: true,
      locked: false,
      usesEnergy: true,
    });
  });

  it('does not lock a quest choice after its quest is finished, since the player has already seen it', () => {
    let state = pick(createDefaultCareerState(), DINER_DIALOGUE, 'root', 'take-coffee');
    state = pick(state, DINER_DIALOGUE, 'settled-in', 'ask-about-town');
    const described = describe_(state, choiceOf(DINER_DIALOGUE, 'settled-in', 'ask-about-town'));
    expect(described.available).toBe(false);
    expect(described.locked).toBe(false);
  });

  it('does not lock a one-time follow-up once it has been taken', () => {
    let state = pick(createDefaultCareerState(), DINER_DIALOGUE, 'root', 'take-coffee');
    state = pick(state, DINER_DIALOGUE, 'settled-in', 'ask-about-town');
    const followUp = choiceOf(DINER_DIALOGUE, 'settled-in', 'ask-about-her-story');
    expect(describe_(state, followUp)).toEqual({ available: true, locked: false, usesEnergy: true });
    state = pick(state, DINER_DIALOGUE, 'settled-in', 'ask-about-her-story');
    expect(describe_(state, followUp)).toEqual({ available: false, locked: false, usesEnergy: true });
  });

  it('locks a follow-up option before its first quest is finished, and never blurs an always-open choice', () => {
    const fresh = createDefaultCareerState();
    expect(describe_(fresh, choiceOf(CASTING_OFFICE_DIALOGUE, 'root', 'ask-for-pointers')).locked).toBe(true);
    expect(describe_(fresh, choiceOf(RIVAL_DIALOGUE, 'sizing-up', 'ask-about-her-audition')).locked).toBe(true);
    expect(describe_(fresh, choiceOf(CASTING_OFFICE_DIALOGUE, 'root', 'offer-photo')).locked).toBe(false);
    expect(describe_(fresh, choiceOf(RIVAL_DIALOGUE, 'sizing-up', 'stay-cold')).locked).toBe(false);
  });
});

describe('the choice sounds and styling', () => {
  it('point at the two delivered sound files, which exist', () => {
    expect(CHOICE_ENERGY_SFX_FILE).toBe('assets/audio/ChoiceExp.mp3');
    expect(CHOICE_PLAIN_SFX_FILE).toBe('assets/audio/ChoiceNoExp.mp3');
    expect(() => read('../public/' + CHOICE_ENERGY_SFX_FILE)).not.toThrow();
    expect(() => read('../public/' + CHOICE_PLAIN_SFX_FILE)).not.toThrow();
  });

  it('outline energy-spending choices in the completed-quest green and blur locked ones', () => {
    const css = read('../src/styles.css');
    expect(css).toMatch(/\.dialogue-choice\.uses-energy:not\(:disabled\) \{[^}]*rgb\(var\(--complete-rgb\)/);
    expect(css).toMatch(/\.dialogue-choice\.is-locked \.dialogue-choice-text \{[^}]*filter: blur\(/);
  });

  it('plays the energy sound for energy-spending choices and the plain one for the rest', () => {
    const shell = read('../src/app/AppShell.ts');
    expect(shell).toContain('playSfx(choiceUsesEnergy(choice) ? CHOICE_ENERGY_SFX_FILE : CHOICE_PLAIN_SFX_FILE)');
  });
});

import { describe, expect, it } from 'vitest';

import {
  applyDialogueChoice,
  applyDialogueChoiceById,
  applyDialogueEffect,
  evaluateCondition,
  isChoiceAvailable,
  type DialogueChoice,
  type DialogueGraph,
} from '../src/domain/Dialogue';
import { createDefaultCareerState } from '../src/domain/CareerState';
import { startQuest } from '../src/domain/Quests';
import type { QuestDef } from '../src/domain/Quests';
import { getRelationshipAxes, type RelationshipCharacter } from '../src/domain/Relationships';

const NO_QUESTS: QuestDef[] = [];
const NO_RELATIONSHIPS: RelationshipCharacter[] = [];

const TEST_QUEST: QuestDef = {
  id: 'quest-a',
  title: 'Quest A',
  summary: '',
  stages: [{ id: 'only', description: '' }],
};

const ROMANCE_CAPABLE: RelationshipCharacter = { id: 'romance-capable', supportsAttraction: true };
const ROMANCE_INCAPABLE: RelationshipCharacter = { id: 'romance-incapable', supportsAttraction: false };
const ROSTER: RelationshipCharacter[] = [ROMANCE_CAPABLE, ROMANCE_INCAPABLE];

describe('dialogue conditions', () => {
  it('evaluates a fact condition against an absent fact as false by default', () => {
    const state = createDefaultCareerState();
    expect(evaluateCondition(state, { kind: 'fact', fact: 'metClerk' }, NO_QUESTS, NO_RELATIONSHIPS)).toBe(false);
  });

  it('evaluates a fact condition as true once the fact is set', () => {
    const state = { ...createDefaultCareerState(), facts: { metClerk: true } };
    expect(evaluateCondition(state, { kind: 'fact', fact: 'metClerk' }, NO_QUESTS, NO_RELATIONSHIPS)).toBe(true);
  });

  it('supports checking a fact equals false', () => {
    const state = { ...createDefaultCareerState(), facts: { metClerk: false } };
    expect(evaluateCondition(state, { kind: 'fact', fact: 'metClerk', equals: false }, NO_QUESTS, NO_RELATIONSHIPS)).toBe(true);
  });

  it('evaluates a resource-at-least condition', () => {
    const state = { ...createDefaultCareerState(), resources: { money: 12, energy: 100, reputation: 5 } };
    expect(
      evaluateCondition(state, { kind: 'resource-at-least', resource: 'reputation', minimum: 5 }, NO_QUESTS, NO_RELATIONSHIPS),
    ).toBe(true);
    expect(
      evaluateCondition(state, { kind: 'resource-at-least', resource: 'reputation', minimum: 6 }, NO_QUESTS, NO_RELATIONSHIPS),
    ).toBe(false);
  });

  it('evaluates a quest-status condition', () => {
    const started = startQuest(createDefaultCareerState(), TEST_QUEST, [TEST_QUEST]);
    expect(
      evaluateCondition(started, { kind: 'quest-status', questId: 'quest-a', status: 'active' }, [TEST_QUEST], NO_RELATIONSHIPS),
    ).toBe(true);
    expect(
      evaluateCondition(started, { kind: 'quest-status', questId: 'quest-a', status: 'completed' }, [TEST_QUEST], NO_RELATIONSHIPS),
    ).toBe(false);
  });

  it('treats a quest-status condition referencing an unknown quest as false', () => {
    const state = createDefaultCareerState();
    expect(
      evaluateCondition(state, { kind: 'quest-status', questId: 'missing', status: 'locked' }, NO_QUESTS, NO_RELATIONSHIPS),
    ).toBe(false);
  });

  it('evaluates a relationship-at-least condition', () => {
    const state = { ...createDefaultCareerState(), relationships: { 'romance-capable': { trust: 40, tension: 0, attraction: 0, obligation: 0, pivotalFlags: {} } } };
    expect(
      evaluateCondition(state, { kind: 'relationship-at-least', characterId: 'romance-capable', axis: 'trust', minimum: 40 }, NO_QUESTS, ROSTER),
    ).toBe(true);
    expect(
      evaluateCondition(state, { kind: 'relationship-at-least', characterId: 'romance-capable', axis: 'trust', minimum: 41 }, NO_QUESTS, ROSTER),
    ).toBe(false);
  });

  it('treats an attraction check against a non-romance-capable character as never satisfied', () => {
    const state = createDefaultCareerState();
    expect(
      evaluateCondition(
        state,
        { kind: 'relationship-at-least', characterId: 'romance-incapable', axis: 'attraction', minimum: 0 },
        NO_QUESTS,
        ROSTER,
      ),
    ).toBe(false);
  });

  it('treats a relationship condition referencing an unknown character as false', () => {
    const state = createDefaultCareerState();
    expect(
      evaluateCondition(state, { kind: 'relationship-at-least', characterId: 'missing', axis: 'trust', minimum: 0 }, NO_QUESTS, ROSTER),
    ).toBe(false);
  });

  it('evaluates a relationship-label condition against the derived composite label', () => {
    const state = { ...createDefaultCareerState(), relationships: { 'romance-capable': { trust: 75, tension: 0, attraction: 0, obligation: 0, pivotalFlags: {} } } };
    expect(
      evaluateCondition(state, { kind: 'relationship-label', characterId: 'romance-capable', label: 'friendship' }, NO_QUESTS, ROSTER),
    ).toBe(true);
    expect(
      evaluateCondition(state, { kind: 'relationship-label', characterId: 'romance-capable', label: 'rivalry' }, NO_QUESTS, ROSTER),
    ).toBe(false);
  });

  it('requires every condition on a choice to pass (AND)', () => {
    const state = { ...createDefaultCareerState(), facts: { metClerk: true }, resources: { money: 12, energy: 100, reputation: 0 } };
    const choice: DialogueChoice = {
      id: 'c',
      label: 'Choice',
      next: null,
      conditions: [
        { kind: 'fact', fact: 'metClerk' },
        { kind: 'resource-at-least', resource: 'reputation', minimum: 5 },
      ],
    };
    expect(isChoiceAvailable(state, choice, NO_QUESTS, NO_RELATIONSHIPS)).toBe(false);
  });

  it('treats a choice with no conditions as always available', () => {
    const choice: DialogueChoice = { id: 'c', label: 'Choice', next: null };
    expect(isChoiceAvailable(createDefaultCareerState(), choice, NO_QUESTS, NO_RELATIONSHIPS)).toBe(true);
  });
});

describe('dialogue effects', () => {
  it('sets a fact', () => {
    const next = applyDialogueEffect(createDefaultCareerState(), { kind: 'set-fact', fact: 'metClerk' }, NO_QUESTS, NO_RELATIONSHIPS);
    expect(next.facts.metClerk).toBe(true);
  });

  it('applies a resource delta through the economy system, including clamping', () => {
    const next = applyDialogueEffect(
      createDefaultCareerState(),
      { kind: 'resource-delta', delta: { reputation: 500 } },
      NO_QUESTS,
      NO_RELATIONSHIPS,
    );
    expect(next.resources.reputation).toBe(100);
  });

  it('applies a quest-action effect by delegating to the quest engine', () => {
    const next = applyDialogueEffect(
      createDefaultCareerState(),
      { kind: 'quest-action', action: 'start', questId: 'quest-a' },
      [TEST_QUEST],
      NO_RELATIONSHIPS,
    );
    expect(next.facts['quest:quest-a:started']).toBe(true);
  });

  it('applies a relationship-delta effect by delegating to the relationship engine', () => {
    const next = applyDialogueEffect(
      createDefaultCareerState(),
      { kind: 'relationship-delta', characterId: 'romance-capable', delta: { trust: 10 } },
      NO_QUESTS,
      ROSTER,
    );
    expect(getRelationshipAxes(next.relationships, ROMANCE_CAPABLE).trust).toBe(10);
  });

  it('applies a relationship-pivotal-flag effect', () => {
    const next = applyDialogueEffect(
      createDefaultCareerState(),
      { kind: 'relationship-pivotal-flag', characterId: 'romance-capable', flag: 'metAtDiner' },
      NO_QUESTS,
      ROSTER,
    );
    expect(getRelationshipAxes(next.relationships, ROMANCE_CAPABLE).pivotalFlags).toEqual({ metAtDiner: true });
  });

  it('no-ops a relationship effect referencing an unknown character', () => {
    const state = createDefaultCareerState();
    const next = applyDialogueEffect(
      state,
      { kind: 'relationship-delta', characterId: 'missing', delta: { trust: 10 } },
      NO_QUESTS,
      ROSTER,
    );
    expect(next).toBe(state);
  });

  it('folds multiple effects on a choice in order', () => {
    const choice: DialogueChoice = {
      id: 'c',
      label: 'Choice',
      next: null,
      effects: [
        { kind: 'set-fact', fact: 'metClerk' },
        { kind: 'resource-delta', delta: { reputation: 3 } },
      ],
    };
    const next = applyDialogueChoice(createDefaultCareerState(), choice, NO_QUESTS, NO_RELATIONSHIPS);
    expect(next.facts.metClerk).toBe(true);
    expect(next.resources.reputation).toBe(3);
  });
});

describe('applyDialogueChoiceById', () => {
  const graph: DialogueGraph = {
    id: 'test-graph',
    rootNodeId: 'root',
    nodes: [
      {
        id: 'root',
        speaker: 'Clerk',
        text: 'Hello.',
        choices: [
          { id: 'greet', label: 'Say hello.', next: 'end', effects: [{ kind: 'set-fact', fact: 'greeted' }] },
          {
            id: 'locked',
            label: 'Locked choice.',
            next: 'end',
            conditions: [{ kind: 'resource-at-least', resource: 'reputation', minimum: 999 }],
          },
        ],
      },
      { id: 'end', speaker: 'Clerk', text: 'Goodbye.', choices: [] },
    ],
  };

  it('applies the chosen effects', () => {
    const next = applyDialogueChoiceById(createDefaultCareerState(), graph, 'root', 'greet', NO_QUESTS, NO_RELATIONSHIPS);
    expect(next.facts.greeted).toBe(true);
  });

  it('no-ops on a missing node id', () => {
    const state = createDefaultCareerState();
    expect(applyDialogueChoiceById(state, graph, 'missing', 'greet', NO_QUESTS, NO_RELATIONSHIPS)).toBe(state);
  });

  it('no-ops on a missing choice id', () => {
    const state = createDefaultCareerState();
    expect(applyDialogueChoiceById(state, graph, 'root', 'missing', NO_QUESTS, NO_RELATIONSHIPS)).toBe(state);
  });

  it('no-ops on an unavailable choice', () => {
    const state = createDefaultCareerState();
    expect(applyDialogueChoiceById(state, graph, 'root', 'locked', NO_QUESTS, NO_RELATIONSHIPS)).toBe(state);
  });
});

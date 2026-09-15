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

describe('dialogue conditions', () => {
  it('evaluates a fact condition against an absent fact as false by default', () => {
    const state = createDefaultCareerState();
    expect(evaluateCondition(state, { kind: 'fact', fact: 'metClerk' })).toBe(false);
  });

  it('evaluates a fact condition as true once the fact is set', () => {
    const state = { ...createDefaultCareerState(), facts: { metClerk: true } };
    expect(evaluateCondition(state, { kind: 'fact', fact: 'metClerk' })).toBe(true);
  });

  it('supports checking a fact equals false', () => {
    const state = { ...createDefaultCareerState(), facts: { metClerk: false } };
    expect(evaluateCondition(state, { kind: 'fact', fact: 'metClerk', equals: false })).toBe(true);
  });

  it('evaluates a resource-at-least condition', () => {
    const state = { ...createDefaultCareerState(), resources: { money: 12, energy: 100, reputation: 5 } };
    expect(evaluateCondition(state, { kind: 'resource-at-least', resource: 'reputation', minimum: 5 })).toBe(true);
    expect(evaluateCondition(state, { kind: 'resource-at-least', resource: 'reputation', minimum: 6 })).toBe(false);
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
    expect(isChoiceAvailable(state, choice)).toBe(false);
  });

  it('treats a choice with no conditions as always available', () => {
    const choice: DialogueChoice = { id: 'c', label: 'Choice', next: null };
    expect(isChoiceAvailable(createDefaultCareerState(), choice)).toBe(true);
  });
});

describe('dialogue effects', () => {
  it('sets a fact', () => {
    const next = applyDialogueEffect(createDefaultCareerState(), { kind: 'set-fact', fact: 'metClerk' });
    expect(next.facts.metClerk).toBe(true);
  });

  it('applies a resource delta through the economy system, including clamping', () => {
    const next = applyDialogueEffect(createDefaultCareerState(), {
      kind: 'resource-delta',
      delta: { reputation: 500 },
    });
    expect(next.resources.reputation).toBe(100);
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
    const next = applyDialogueChoice(createDefaultCareerState(), choice);
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
    const next = applyDialogueChoiceById(createDefaultCareerState(), graph, 'root', 'greet');
    expect(next.facts.greeted).toBe(true);
  });

  it('no-ops on a missing node id', () => {
    const state = createDefaultCareerState();
    expect(applyDialogueChoiceById(state, graph, 'missing', 'greet')).toBe(state);
  });

  it('no-ops on a missing choice id', () => {
    const state = createDefaultCareerState();
    expect(applyDialogueChoiceById(state, graph, 'root', 'missing')).toBe(state);
  });

  it('no-ops on an unavailable choice', () => {
    const state = createDefaultCareerState();
    expect(applyDialogueChoiceById(state, graph, 'root', 'locked')).toBe(state);
  });
});

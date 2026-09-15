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

const NO_QUESTS: QuestDef[] = [];

const TEST_QUEST: QuestDef = {
  id: 'quest-a',
  title: 'Quest A',
  summary: '',
  stages: [{ id: 'only', description: '' }],
};

describe('dialogue conditions', () => {
  it('evaluates a fact condition against an absent fact as false by default', () => {
    const state = createDefaultCareerState();
    expect(evaluateCondition(state, { kind: 'fact', fact: 'metClerk' }, NO_QUESTS)).toBe(false);
  });

  it('evaluates a fact condition as true once the fact is set', () => {
    const state = { ...createDefaultCareerState(), facts: { metClerk: true } };
    expect(evaluateCondition(state, { kind: 'fact', fact: 'metClerk' }, NO_QUESTS)).toBe(true);
  });

  it('supports checking a fact equals false', () => {
    const state = { ...createDefaultCareerState(), facts: { metClerk: false } };
    expect(evaluateCondition(state, { kind: 'fact', fact: 'metClerk', equals: false }, NO_QUESTS)).toBe(true);
  });

  it('evaluates a resource-at-least condition', () => {
    const state = { ...createDefaultCareerState(), resources: { money: 12, energy: 100, reputation: 5 } };
    expect(evaluateCondition(state, { kind: 'resource-at-least', resource: 'reputation', minimum: 5 }, NO_QUESTS)).toBe(true);
    expect(evaluateCondition(state, { kind: 'resource-at-least', resource: 'reputation', minimum: 6 }, NO_QUESTS)).toBe(false);
  });

  it('evaluates a quest-status condition', () => {
    const started = startQuest(createDefaultCareerState(), TEST_QUEST, [TEST_QUEST]);
    expect(evaluateCondition(started, { kind: 'quest-status', questId: 'quest-a', status: 'active' }, [TEST_QUEST])).toBe(true);
    expect(evaluateCondition(started, { kind: 'quest-status', questId: 'quest-a', status: 'completed' }, [TEST_QUEST])).toBe(false);
  });

  it('treats a quest-status condition referencing an unknown quest as false', () => {
    const state = createDefaultCareerState();
    expect(evaluateCondition(state, { kind: 'quest-status', questId: 'missing', status: 'locked' }, NO_QUESTS)).toBe(false);
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
    expect(isChoiceAvailable(state, choice, NO_QUESTS)).toBe(false);
  });

  it('treats a choice with no conditions as always available', () => {
    const choice: DialogueChoice = { id: 'c', label: 'Choice', next: null };
    expect(isChoiceAvailable(createDefaultCareerState(), choice, NO_QUESTS)).toBe(true);
  });
});

describe('dialogue effects', () => {
  it('sets a fact', () => {
    const next = applyDialogueEffect(createDefaultCareerState(), { kind: 'set-fact', fact: 'metClerk' }, NO_QUESTS);
    expect(next.facts.metClerk).toBe(true);
  });

  it('applies a resource delta through the economy system, including clamping', () => {
    const next = applyDialogueEffect(
      createDefaultCareerState(),
      { kind: 'resource-delta', delta: { reputation: 500 } },
      NO_QUESTS,
    );
    expect(next.resources.reputation).toBe(100);
  });

  it('applies a quest-action effect by delegating to the quest engine', () => {
    const next = applyDialogueEffect(
      createDefaultCareerState(),
      { kind: 'quest-action', action: 'start', questId: 'quest-a' },
      [TEST_QUEST],
    );
    expect(next.facts['quest:quest-a:started']).toBe(true);
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
    const next = applyDialogueChoice(createDefaultCareerState(), choice, NO_QUESTS);
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
    const next = applyDialogueChoiceById(createDefaultCareerState(), graph, 'root', 'greet', NO_QUESTS);
    expect(next.facts.greeted).toBe(true);
  });

  it('no-ops on a missing node id', () => {
    const state = createDefaultCareerState();
    expect(applyDialogueChoiceById(state, graph, 'missing', 'greet', NO_QUESTS)).toBe(state);
  });

  it('no-ops on a missing choice id', () => {
    const state = createDefaultCareerState();
    expect(applyDialogueChoiceById(state, graph, 'root', 'missing', NO_QUESTS)).toBe(state);
  });

  it('no-ops on an unavailable choice', () => {
    const state = createDefaultCareerState();
    expect(applyDialogueChoiceById(state, graph, 'root', 'locked', NO_QUESTS)).toBe(state);
  });
});

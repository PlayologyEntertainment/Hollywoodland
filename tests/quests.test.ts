import { describe, expect, it } from 'vitest';

import { createDefaultCareerState } from '../src/domain/CareerState';
import {
  applyQuestActionById,
  completeQuestStage,
  evaluateQuestCondition,
  getActiveStage,
  getActiveStageIndex,
  getQuestStatus,
  startQuest,
  type QuestDef,
} from '../src/domain/Quests';
import { applyRelationshipDelta, DEFAULT_RELATIONSHIPS, type RelationshipCharacter } from '../src/domain/Relationships';

const NO_RELATIONSHIPS: RelationshipCharacter[] = [];
const CASTING_GATEKEEPER: RelationshipCharacter = { id: 'casting-gatekeeper', supportsAttraction: false };
const ROMANCE_INCAPABLE: RelationshipCharacter = { id: 'romance-incapable', supportsAttraction: false };
const ROSTER: RelationshipCharacter[] = [CASTING_GATEKEEPER, ROMANCE_INCAPABLE];

const SIMPLE_QUEST: QuestDef = {
  id: 'simple',
  title: 'Simple Quest',
  summary: 'A quest with two stages.',
  stages: [
    { id: 'first', description: 'Do the first thing.' },
    { id: 'second', description: 'Do the second thing.', rewards: [{ kind: 'resource-delta', delta: { money: 10 } }] },
  ],
};

const GATED_QUEST: QuestDef = {
  id: 'gated',
  title: 'Gated Quest',
  summary: 'Requires the simple quest to be completed first.',
  prerequisites: [{ kind: 'quest-status', questId: 'simple', status: 'completed' }],
  stages: [{ id: 'only', description: 'The only stage.' }],
};

const RELATIONSHIP_GATED_QUEST: QuestDef = {
  id: 'relationship-gated',
  title: 'Relationship Gated Quest',
  summary: 'Requires the casting gatekeeper to trust the player.',
  prerequisites: [{ kind: 'relationship-at-least', characterId: 'casting-gatekeeper', axis: 'trust', minimum: 10 }],
  stages: [{ id: 'only', description: 'The only stage.' }],
};

const ALL: QuestDef[] = [SIMPLE_QUEST, GATED_QUEST, RELATIONSHIP_GATED_QUEST];

describe('evaluateQuestCondition', () => {
  it('delegates fact/resource conditions to the shared evaluator', () => {
    const state = { ...createDefaultCareerState(), resources: { money: 50, energy: 100, reputation: 0 } };
    expect(
      evaluateQuestCondition(state, { kind: 'resource-at-least', resource: 'money', minimum: 50 }, ALL, NO_RELATIONSHIPS),
    ).toBe(true);
  });

  it('evaluates a quest-status condition against another quest', () => {
    const state = createDefaultCareerState();
    expect(
      evaluateQuestCondition(state, { kind: 'quest-status', questId: 'simple', status: 'available' }, ALL, NO_RELATIONSHIPS),
    ).toBe(true);
    expect(
      evaluateQuestCondition(state, { kind: 'quest-status', questId: 'simple', status: 'completed' }, ALL, NO_RELATIONSHIPS),
    ).toBe(false);
  });

  it('treats a dangling quest-status target as non-matching rather than throwing', () => {
    const state = createDefaultCareerState();
    expect(
      evaluateQuestCondition(state, { kind: 'quest-status', questId: 'missing', status: 'locked' }, ALL, NO_RELATIONSHIPS),
    ).toBe(false);
  });

  it('delegates a relationship condition to the relationship evaluator', () => {
    const state = {
      ...createDefaultCareerState(),
      relationships: applyRelationshipDelta(DEFAULT_RELATIONSHIPS, CASTING_GATEKEEPER, { trust: 10 }),
    };
    expect(
      evaluateQuestCondition(
        state,
        { kind: 'relationship-at-least', characterId: 'casting-gatekeeper', axis: 'trust', minimum: 10 },
        ALL,
        ROSTER,
      ),
    ).toBe(true);
    expect(
      evaluateQuestCondition(
        createDefaultCareerState(),
        { kind: 'relationship-at-least', characterId: 'casting-gatekeeper', axis: 'trust', minimum: 10 },
        ALL,
        ROSTER,
      ),
    ).toBe(false);
  });
});

describe('getQuestStatus', () => {
  it('is locked when prerequisites are unmet', () => {
    expect(getQuestStatus(createDefaultCareerState(), GATED_QUEST, ALL, NO_RELATIONSHIPS)).toBe('locked');
  });

  it('is available with no prerequisites and not yet started', () => {
    expect(getQuestStatus(createDefaultCareerState(), SIMPLE_QUEST, ALL, NO_RELATIONSHIPS)).toBe('available');
  });

  it('is active once started but before the final stage completes', () => {
    const started = startQuest(createDefaultCareerState(), SIMPLE_QUEST, ALL, NO_RELATIONSHIPS);
    expect(getQuestStatus(started, SIMPLE_QUEST, ALL, NO_RELATIONSHIPS)).toBe('active');
  });

  it('is completed once every stage is complete', () => {
    let state = startQuest(createDefaultCareerState(), SIMPLE_QUEST, ALL, NO_RELATIONSHIPS);
    state = completeQuestStage(state, SIMPLE_QUEST, 'first');
    state = completeQuestStage(state, SIMPLE_QUEST, 'second');
    expect(getQuestStatus(state, SIMPLE_QUEST, ALL, NO_RELATIONSHIPS)).toBe('completed');
  });

  it('unlocks a gated quest once its prerequisite quest is completed', () => {
    let state = startQuest(createDefaultCareerState(), SIMPLE_QUEST, ALL, NO_RELATIONSHIPS);
    state = completeQuestStage(state, SIMPLE_QUEST, 'first');
    state = completeQuestStage(state, SIMPLE_QUEST, 'second');
    expect(getQuestStatus(state, GATED_QUEST, ALL, NO_RELATIONSHIPS)).toBe('available');
  });

  it('is locked until a relationship prerequisite is met, then available', () => {
    expect(getQuestStatus(createDefaultCareerState(), RELATIONSHIP_GATED_QUEST, ALL, ROSTER)).toBe('locked');
    const trusted = {
      ...createDefaultCareerState(),
      relationships: applyRelationshipDelta(DEFAULT_RELATIONSHIPS, CASTING_GATEKEEPER, { trust: 10 }),
    };
    expect(getQuestStatus(trusted, RELATIONSHIP_GATED_QUEST, ALL, ROSTER)).toBe('available');
  });
});

describe('getActiveStageIndex / getActiveStage', () => {
  it('is -1 before the quest starts', () => {
    expect(getActiveStageIndex(createDefaultCareerState(), SIMPLE_QUEST)).toBe(-1);
    expect(getActiveStage(createDefaultCareerState(), SIMPLE_QUEST)).toBeUndefined();
  });

  it('points at the first incomplete stage once started', () => {
    const state = startQuest(createDefaultCareerState(), SIMPLE_QUEST, ALL, NO_RELATIONSHIPS);
    expect(getActiveStageIndex(state, SIMPLE_QUEST)).toBe(0);
    expect(getActiveStage(state, SIMPLE_QUEST)?.id).toBe('first');
  });

  it('equals stages.length once every stage is complete, with no active stage', () => {
    let state = startQuest(createDefaultCareerState(), SIMPLE_QUEST, ALL, NO_RELATIONSHIPS);
    state = completeQuestStage(state, SIMPLE_QUEST, 'first');
    state = completeQuestStage(state, SIMPLE_QUEST, 'second');
    expect(getActiveStageIndex(state, SIMPLE_QUEST)).toBe(2);
    expect(getActiveStage(state, SIMPLE_QUEST)).toBeUndefined();
  });
});

describe('startQuest', () => {
  it('no-ops when the quest is locked', () => {
    const state = createDefaultCareerState();
    expect(startQuest(state, GATED_QUEST, ALL, NO_RELATIONSHIPS)).toBe(state);
  });

  it('is idempotent once already started', () => {
    const started = startQuest(createDefaultCareerState(), SIMPLE_QUEST, ALL, NO_RELATIONSHIPS);
    expect(startQuest(started, SIMPLE_QUEST, ALL, NO_RELATIONSHIPS)).toBe(started);
  });

  it('no-ops when a relationship prerequisite is unmet', () => {
    const state = createDefaultCareerState();
    expect(startQuest(state, RELATIONSHIP_GATED_QUEST, ALL, ROSTER)).toBe(state);
  });

  it('starts once a relationship prerequisite is met', () => {
    const trusted = {
      ...createDefaultCareerState(),
      relationships: applyRelationshipDelta(DEFAULT_RELATIONSHIPS, CASTING_GATEKEEPER, { trust: 10 }),
    };
    const started = startQuest(trusted, RELATIONSHIP_GATED_QUEST, ALL, ROSTER);
    expect(getQuestStatus(started, RELATIONSHIP_GATED_QUEST, ALL, ROSTER)).toBe('active');
  });
});

describe('completeQuestStage', () => {
  it('no-ops when the quest has not been started', () => {
    const state = createDefaultCareerState();
    expect(completeQuestStage(state, SIMPLE_QUEST, 'first')).toBe(state);
  });

  it('no-ops on a stale or out-of-order stage id', () => {
    const started = startQuest(createDefaultCareerState(), SIMPLE_QUEST, ALL, NO_RELATIONSHIPS);
    expect(completeQuestStage(started, SIMPLE_QUEST, 'second')).toBe(started);
  });

  it('applies stage rewards on completion', () => {
    let state = startQuest(createDefaultCareerState(), SIMPLE_QUEST, ALL, NO_RELATIONSHIPS);
    state = completeQuestStage(state, SIMPLE_QUEST, 'first');
    state = completeQuestStage(state, SIMPLE_QUEST, 'second');
    expect(state.resources.money).toBe(22);
  });
});

describe('applyQuestActionById', () => {
  it('no-ops on an unknown quest id', () => {
    const state = createDefaultCareerState();
    expect(applyQuestActionById(state, ALL, 'missing', 'start', undefined, NO_RELATIONSHIPS)).toBe(state);
  });

  it('starts a quest by id', () => {
    const state = applyQuestActionById(createDefaultCareerState(), ALL, 'simple', 'start', undefined, NO_RELATIONSHIPS);
    expect(getQuestStatus(state, SIMPLE_QUEST, ALL, NO_RELATIONSHIPS)).toBe('active');
  });

  it('completes a stage by id', () => {
    let state = applyQuestActionById(createDefaultCareerState(), ALL, 'simple', 'start', undefined, NO_RELATIONSHIPS);
    state = applyQuestActionById(state, ALL, 'simple', 'complete-stage', 'first', NO_RELATIONSHIPS);
    expect(getActiveStage(state, SIMPLE_QUEST)?.id).toBe('second');
  });

  it('no-ops a complete-stage action with no stageId', () => {
    const started = applyQuestActionById(createDefaultCareerState(), ALL, 'simple', 'start', undefined, NO_RELATIONSHIPS);
    expect(applyQuestActionById(started, ALL, 'simple', 'complete-stage', undefined, NO_RELATIONSHIPS)).toBe(started);
  });

  it('no-ops a start action when a relationship prerequisite is unmet', () => {
    const state = createDefaultCareerState();
    expect(applyQuestActionById(state, ALL, 'relationship-gated', 'start', undefined, ROSTER)).toBe(state);
  });
});

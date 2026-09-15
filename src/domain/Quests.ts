import { applySharedEffect, evaluateSharedCondition, type SharedCondition, type SharedEffect } from './Conditions';
import { applyProgressionEffect, evaluateProgressionCondition, type ProgressionCondition, type ProgressionEffect } from './Progression';
import { evaluateRelationshipCondition, type RelationshipCharacter, type RelationshipCondition } from './Relationships';
import type { CareerState } from './CareerState';

export type QuestStatus = 'locked' | 'available' | 'active' | 'completed';

export interface QuestStatusCondition {
  readonly kind: 'quest-status';
  readonly questId: string;
  readonly status: QuestStatus;
}

export type QuestCondition = SharedCondition | QuestStatusCondition | RelationshipCondition | ProgressionCondition;

export interface QuestActionEffect {
  readonly kind: 'quest-action';
  readonly questId: string;
  readonly action: 'start' | 'complete-stage';
  readonly stageId?: string;
}

export type QuestEffect = SharedEffect | QuestActionEffect;

/** A stage reward may grant XP alongside (or instead of) a fact/resource
 * delta — but deliberately never `quest-action`, to avoid a stage reward
 * cascading into another quest's state in this round's scope. */
export type QuestStageReward = SharedEffect | ProgressionEffect;

export interface QuestStage {
  readonly id: string;
  readonly description: string;
  readonly rewards?: readonly QuestStageReward[];
}

export interface QuestDef {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly prerequisites?: readonly QuestCondition[];
  readonly stages: readonly QuestStage[];
}

function startedFact(questId: string): string {
  return `quest:${questId}:started`;
}

function stageCompleteFact(questId: string, stageId: string): string {
  return `quest:${questId}:stage:${stageId}:complete`;
}

function getQuestById(quests: readonly QuestDef[], questId: string): QuestDef | undefined {
  return quests.find((candidate) => candidate.id === questId);
}

/** Progress is tracked entirely through `CareerState.facts` (see
 * startedFact/stageCompleteFact above) rather than a dedicated CareerState
 * field — this needs no save-schema migration and matches the facts
 * comment in CareerState.ts anticipating quest content. "Completed" is
 * derived structurally (every stage's complete-fact set) rather than its
 * own fact, so the two can never drift apart. */
export function evaluateQuestCondition(
  state: CareerState,
  condition: QuestCondition,
  quests: readonly QuestDef[],
  roster: readonly RelationshipCharacter[],
): boolean {
  if (condition.kind === 'quest-status') {
    const quest = getQuestById(quests, condition.questId);
    if (quest === undefined) return false;
    return getQuestStatus(state, quest, quests, roster) === condition.status;
  }
  if (condition.kind === 'relationship-at-least' || condition.kind === 'relationship-label') {
    return evaluateRelationshipCondition(state, condition, roster);
  }
  if (condition.kind === 'level-at-least' || condition.kind === 'talent-unlocked') {
    return evaluateProgressionCondition(state, condition);
  }
  return evaluateSharedCondition(state, condition);
}

/** -1 if the quest has not been started; `quest.stages.length` once every
 * stage is complete. */
export function getActiveStageIndex(state: CareerState, quest: QuestDef): number {
  if ((state.facts[startedFact(quest.id)] ?? false) !== true) return -1;
  const firstIncomplete = quest.stages.findIndex(
    (stage) => (state.facts[stageCompleteFact(quest.id, stage.id)] ?? false) !== true,
  );
  return firstIncomplete === -1 ? quest.stages.length : firstIncomplete;
}

export function getActiveStage(state: CareerState, quest: QuestDef): QuestStage | undefined {
  const index = getActiveStageIndex(state, quest);
  return quest.stages[index];
}

export function getQuestStatus(
  state: CareerState,
  quest: QuestDef,
  quests: readonly QuestDef[],
  roster: readonly RelationshipCharacter[],
): QuestStatus {
  const stageIndex = getActiveStageIndex(state, quest);
  if (stageIndex === quest.stages.length) return 'completed';
  if (stageIndex >= 0) return 'active';
  const unlocked = (quest.prerequisites ?? []).every((condition) =>
    evaluateQuestCondition(state, condition, quests, roster),
  );
  return unlocked ? 'available' : 'locked';
}

/** Idempotent: no-ops unless the quest is currently 'available'. */
export function startQuest(
  state: CareerState,
  quest: QuestDef,
  quests: readonly QuestDef[],
  roster: readonly RelationshipCharacter[],
): CareerState {
  if (getQuestStatus(state, quest, quests, roster) !== 'available') return state;
  return { ...state, facts: { ...state.facts, [startedFact(quest.id)]: true } };
}

/** No-ops unless the quest is active and `stageId` is exactly the current
 * active stage — a stale or out-of-order call (e.g. a replayed dialogue
 * node) is a legitimate runtime scenario, not a content bug, so this
 * defends rather than throws (content-authoring mistakes are instead
 * caught at load time by quest/dialogue validation). */
export function completeQuestStage(state: CareerState, quest: QuestDef, stageId: string): CareerState {
  const activeStage = getActiveStage(state, quest);
  if (activeStage === undefined || activeStage.id !== stageId) return state;
  const withFact: CareerState = {
    ...state,
    facts: { ...state.facts, [stageCompleteFact(quest.id, stageId)]: true },
  };
  return (activeStage.rewards ?? []).reduce((current, effect) => applyQuestStageReward(current, effect), withFact);
}

function applyQuestStageReward(state: CareerState, effect: QuestStageReward): CareerState {
  if (effect.kind === 'xp-grant') return applyProgressionEffect(state, effect);
  return applySharedEffect(state, effect);
}

/** The single defensive entry point the dialogue effect dispatcher calls —
 * no-ops on an unknown quest id, mirroring applyDialogueChoiceById's style. */
export function applyQuestActionById(
  state: CareerState,
  quests: readonly QuestDef[],
  questId: string,
  action: 'start' | 'complete-stage',
  stageId: string | undefined,
  roster: readonly RelationshipCharacter[],
): CareerState {
  const quest = getQuestById(quests, questId);
  if (quest === undefined) return state;
  if (action === 'start') return startQuest(state, quest, quests, roster);
  if (stageId === undefined) return state;
  return completeQuestStage(state, quest, stageId);
}

import {
  applySharedEffect,
  evaluateSharedCondition,
  type FactCondition,
  type ResourceAtLeastCondition,
  type ResourceDeltaEffect,
  type SetFactEffect,
  type SharedCondition,
  type SharedEffect,
} from './Conditions';
import {
  applyQuestActionById,
  getQuestStatus,
  type QuestActionEffect,
  type QuestDef,
  type QuestStatusCondition,
} from './Quests';
import {
  applyInventoryEffect,
  evaluateInventoryCondition,
  type InventoryCondition,
  type InventoryEffect,
  type InventoryItemDefinition,
} from './Inventory';
import {
  applyProgressionEffect,
  evaluateProgressionCondition,
  type ProgressionCondition,
  type ProgressionEffect,
} from './Progression';
import {
  applyRelationshipEffect,
  evaluateRelationshipCondition,
  type RelationshipCharacter,
  type RelationshipCondition,
  type RelationshipEffect,
} from './Relationships';
import type { CareerState } from './CareerState';

export type { FactCondition, ResourceAtLeastCondition, SetFactEffect, ResourceDeltaEffect };

export type DialogueCondition =
  | SharedCondition
  | QuestStatusCondition
  | RelationshipCondition
  | ProgressionCondition
  | InventoryCondition;

export type DialogueEffect =
  | SharedEffect
  | QuestActionEffect
  | RelationshipEffect
  | ProgressionEffect
  | InventoryEffect;

export interface DialogueChoice {
  readonly id: string;
  readonly label: string;
  readonly conditions?: readonly DialogueCondition[];
  readonly effects?: readonly DialogueEffect[];
  /** The node id to advance to, or null to end the conversation. */
  readonly next: string | null;
}

export interface DialogueNode {
  readonly id: string;
  readonly speaker: string;
  readonly text: string;
  readonly choices: readonly DialogueChoice[];
}

export interface DialogueGraph {
  readonly id: string;
  readonly rootNodeId: string;
  readonly nodes: readonly DialogueNode[];
}

export interface DialogueChoiceSelectedPayload {
  readonly graphId: string;
  readonly nodeId: string;
  readonly choiceId: string;
}

export function evaluateCondition(
  state: CareerState,
  condition: DialogueCondition,
  quests: readonly QuestDef[],
  roster: readonly RelationshipCharacter[],
  items: readonly InventoryItemDefinition[] = [],
): boolean {
  if (condition.kind === 'quest-status') {
    const quest = quests.find((candidate) => candidate.id === condition.questId);
    if (quest === undefined) return false;
    return getQuestStatus(state, quest, quests, roster, items) === condition.status;
  }
  if (condition.kind === 'relationship-at-least' || condition.kind === 'relationship-label') {
    return evaluateRelationshipCondition(state, condition, roster);
  }
  if (condition.kind === 'level-at-least' || condition.kind === 'talent-unlocked') {
    return evaluateProgressionCondition(state, condition);
  }
  if (condition.kind === 'item-owned') {
    return evaluateInventoryCondition(state, condition, items);
  }
  return evaluateSharedCondition(state, condition);
}

export function isChoiceAvailable(
  state: CareerState,
  choice: DialogueChoice,
  quests: readonly QuestDef[],
  roster: readonly RelationshipCharacter[],
  items: readonly InventoryItemDefinition[] = [],
): boolean {
  return (choice.conditions ?? []).every((condition) => evaluateCondition(state, condition, quests, roster, items));
}

export function applyDialogueEffect(
  state: CareerState,
  effect: DialogueEffect,
  quests: readonly QuestDef[],
  roster: readonly RelationshipCharacter[],
  items: readonly InventoryItemDefinition[] = [],
): CareerState {
  if (effect.kind === 'quest-action') {
    return applyQuestActionById(state, quests, effect.questId, effect.action, effect.stageId, roster, items);
  }
  if (effect.kind === 'relationship-delta' || effect.kind === 'relationship-pivotal-flag') {
    return applyRelationshipEffect(state, effect, roster);
  }
  if (effect.kind === 'xp-grant') {
    return applyProgressionEffect(state, effect);
  }
  if (effect.kind === 'item-grant') {
    return applyInventoryEffect(state, effect, items);
  }
  return applySharedEffect(state, effect);
}

export function applyDialogueChoice(
  state: CareerState,
  choice: DialogueChoice,
  quests: readonly QuestDef[],
  roster: readonly RelationshipCharacter[],
  items: readonly InventoryItemDefinition[] = [],
): CareerState {
  return (choice.effects ?? []).reduce(
    (current, effect) => applyDialogueEffect(current, effect, quests, roster, items),
    state,
  );
}

export function getDialogueNode(graph: DialogueGraph, nodeId: string): DialogueNode | undefined {
  return graph.nodes.find((node) => node.id === nodeId);
}

/** The sole entry point the scene calls in response to a
 * 'dialogue-choice-selected' domain event. Defensively no-ops (returns
 * state unchanged) on a missing node/choice id or a choice that is not
 * currently available, since the payload crosses a domain-event boundary
 * and content/UI could in principle fall out of sync. */
export function applyDialogueChoiceById(
  state: CareerState,
  graph: DialogueGraph,
  nodeId: string,
  choiceId: string,
  quests: readonly QuestDef[],
  roster: readonly RelationshipCharacter[],
  items: readonly InventoryItemDefinition[] = [],
): CareerState {
  const node = getDialogueNode(graph, nodeId);
  const choice = node?.choices.find((candidate) => candidate.id === choiceId);
  if (choice === undefined || !isChoiceAvailable(state, choice, quests, roster, items)) return state;
  return applyDialogueChoice(state, choice, quests, roster, items);
}

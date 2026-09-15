import { applyResourceDelta, type ResourceDelta, type ResourcesState } from './EconomySystem';
import type { CareerState } from './CareerState';

export interface FactCondition {
  readonly kind: 'fact';
  readonly fact: string;
  readonly equals?: boolean;
}

export interface ResourceAtLeastCondition {
  readonly kind: 'resource-at-least';
  readonly resource: keyof ResourcesState;
  readonly minimum: number;
}

export type DialogueCondition = FactCondition | ResourceAtLeastCondition;

export interface SetFactEffect {
  readonly kind: 'set-fact';
  readonly fact: string;
  readonly value?: boolean;
}

export interface ResourceDeltaEffect {
  readonly kind: 'resource-delta';
  readonly delta: ResourceDelta;
}

export type DialogueEffect = SetFactEffect | ResourceDeltaEffect;

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

export function evaluateCondition(state: CareerState, condition: DialogueCondition): boolean {
  if (condition.kind === 'fact') {
    return (state.facts[condition.fact] ?? false) === (condition.equals ?? true);
  }
  return state.resources[condition.resource] >= condition.minimum;
}

export function isChoiceAvailable(state: CareerState, choice: DialogueChoice): boolean {
  return (choice.conditions ?? []).every((condition) => evaluateCondition(state, condition));
}

export function applyDialogueEffect(state: CareerState, effect: DialogueEffect): CareerState {
  if (effect.kind === 'set-fact') {
    return { ...state, facts: { ...state.facts, [effect.fact]: effect.value ?? true } };
  }
  return { ...state, resources: applyResourceDelta(state.resources, effect.delta) };
}

export function applyDialogueChoice(state: CareerState, choice: DialogueChoice): CareerState {
  return (choice.effects ?? []).reduce((current, effect) => applyDialogueEffect(current, effect), state);
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
): CareerState {
  const node = getDialogueNode(graph, nodeId);
  const choice = node?.choices.find((candidate) => candidate.id === choiceId);
  if (choice === undefined || !isChoiceAvailable(state, choice)) return state;
  return applyDialogueChoice(state, choice);
}

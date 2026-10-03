import { applyResourceDelta, type ResourceDelta, type ResourcesState } from './EconomySystem';
import type { CareerState } from './CareerState';
import type { AttributeKey } from './Origins';

/** Fact/resource primitives shared by dialogue and quest content. Lives
 * below both `Dialogue.ts` and `Quests.ts` so quest prerequisites can use
 * fact/resource conditions and dialogue conditions can reference quest
 * status without the two modules importing each other. */

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

/** The player's attribute (see Origins.ts) is at least `minimum`; with `equals: false`, it is below it. */
export interface AttributeAtLeastCondition {
  readonly kind: 'attribute-at-least';
  readonly attribute: AttributeKey;
  readonly minimum: number;
  readonly equals?: boolean;
}

/** The player chose this origin (see Origins.ts); with `equals: false`, they did not. */
export interface OriginCondition {
  readonly kind: 'origin-is';
  readonly originId: string;
  readonly equals?: boolean;
}

export type SharedCondition = FactCondition | ResourceAtLeastCondition | AttributeAtLeastCondition | OriginCondition;

export interface SetFactEffect {
  readonly kind: 'set-fact';
  readonly fact: string;
  readonly value?: boolean;
}

export interface ResourceDeltaEffect {
  readonly kind: 'resource-delta';
  readonly delta: ResourceDelta;
}

export type SharedEffect = SetFactEffect | ResourceDeltaEffect;

export function evaluateSharedCondition(state: CareerState, condition: SharedCondition): boolean {
  if (condition.kind === 'fact') {
    return (state.facts[condition.fact] ?? false) === (condition.equals ?? true);
  }
  if (condition.kind === 'attribute-at-least') {
    return (state.attributes[condition.attribute] >= condition.minimum) === (condition.equals ?? true);
  }
  if (condition.kind === 'origin-is') return (state.identity.originId === condition.originId) === (condition.equals ?? true);
  return state.resources[condition.resource] >= condition.minimum;
}

export function applySharedEffect(state: CareerState, effect: SharedEffect): CareerState {
  if (effect.kind === 'set-fact') {
    return { ...state, facts: { ...state.facts, [effect.fact]: effect.value ?? true } };
  }
  return { ...state, resources: applyResourceDelta(state.resources, effect.delta) };
}

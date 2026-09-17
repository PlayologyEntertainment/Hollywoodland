import { applySharedEffect, type SharedEffect } from './Conditions';
import { meetsHousingTier, type HousingState, type HousingTier } from './Housing';
import { applyProgressionEffect, type ProgressionEffect } from './Progression';
import { applyRelationshipEffect, type RelationshipCharacter, type RelationshipEffect } from './Relationships';
import type { CareerState } from './CareerState';

/** The GDD's idle/offline career-assignment categories (§ "when away, the
 * player may schedule bounded career assignments"): classes/rehearsals,
 * side jobs, networking, and recovery. */
export type AssignmentCategory = 'class' | 'side-job' | 'networking' | 'recovery';

/** An assignment's reward may adjust resources or facts, grant XP, or move
 * a relationship — the same reward vocabulary `QuestStageReward` draws from,
 * minus `item-grant` (assignments don't hand out inventory) and plus
 * `RelationshipEffect` (an assignment can be a networking session with a
 * specific character). */
export type AssignmentReward = SharedEffect | ProgressionEffect | RelationshipEffect;

export interface AssignmentDefinition {
  readonly id: string;
  readonly category: AssignmentCategory;
  readonly title: string;
  readonly description: string;
  readonly requiredHousingTier: HousingTier;
  /** Real minutes the assignment takes to fully resolve while the player is
   * away. Elapsed real time beyond this is reported (see
   * `AssignmentResolution.awayMinutes`) but never grows the reward — per the
   * GDD, a long absence is never punished, but it also never pays more than
   * the assignment's designed length. */
  readonly durationMinutes: number;
  readonly rewards: readonly AssignmentReward[];
}

export interface ActiveAssignmentState {
  readonly assignmentId: string;
  readonly startedAtMs: number;
}

/** One assignment at a time for now (round N) — a later housing tier could
 * raise this to multiple concurrent slots without changing this shape, the
 * same way `RelationshipState`'s per-character keying already anticipates
 * more entries than any one round populates. */
export interface AssignmentsState {
  readonly active: ActiveAssignmentState | null;
}

export const DEFAULT_ASSIGNMENTS: AssignmentsState = Object.freeze({ active: null });

export function getAssignmentById(
  definitions: readonly AssignmentDefinition[],
  assignmentId: string,
): AssignmentDefinition | undefined {
  return definitions.find((candidate) => candidate.id === assignmentId);
}

export function isAssignmentUnlocked(definition: AssignmentDefinition, housing: HousingState): boolean {
  return meetsHousingTier(housing, definition.requiredHousingTier);
}

export function canStartAssignment(state: CareerState, definition: AssignmentDefinition): boolean {
  return state.assignments.active === null && isAssignmentUnlocked(definition, state.housing);
}

/** No-ops unless `definition` is currently startable (see
 * `canStartAssignment`) — the same defensive posture `startQuest` takes
 * toward an unavailable quest. `nowMs` is threaded in rather than read from
 * `Date.now()` here so the pure resolution logic stays trivially testable. */
export function startAssignment(state: CareerState, definition: AssignmentDefinition, nowMs: number): CareerState {
  if (!canStartAssignment(state, definition)) return state;
  return { ...state, assignments: { active: { assignmentId: definition.id, startedAtMs: nowMs } } };
}

function isAssignmentDue(active: ActiveAssignmentState, definition: AssignmentDefinition, nowMs: number): boolean {
  return nowMs - active.startedAtMs >= definition.durationMinutes * 60_000;
}

export interface AssignmentResolution {
  readonly definition: AssignmentDefinition;
  /** Real minutes elapsed since the assignment was started, for the "while
   * you were away" summary — capped at nothing (it's purely informational);
   * the reward itself never scales past `definition.durationMinutes`. */
  readonly awayMinutes: number;
}

/** Resolves the active assignment once real elapsed time reaches its
 * designed duration: applies its rewards exactly once and clears the slot.
 * A no-op while still in progress, and safe to call unconditionally (e.g.
 * on every load and every Home Hub visit) — a dangling assignment id from
 * stale content clears the slot defensively rather than leaving the player
 * stuck forever, the same posture `completeQuestStage` takes toward a
 * stale stage reference. */
export function resolveActiveAssignment(
  state: CareerState,
  definitions: readonly AssignmentDefinition[],
  roster: readonly RelationshipCharacter[],
  nowMs: number,
): { readonly state: CareerState; readonly resolution: AssignmentResolution | undefined } {
  const active = state.assignments.active;
  if (active === null) return { state, resolution: undefined };
  const definition = getAssignmentById(definitions, active.assignmentId);
  if (definition === undefined) {
    return { state: { ...state, assignments: { active: null } }, resolution: undefined };
  }
  if (!isAssignmentDue(active, definition, nowMs)) return { state, resolution: undefined };
  const awayMinutes = Math.floor((nowMs - active.startedAtMs) / 60_000);
  const rewarded = definition.rewards.reduce((current, reward) => applyAssignmentReward(current, reward, roster), state);
  return { state: { ...rewarded, assignments: { active: null } }, resolution: { definition, awayMinutes } };
}

function applyAssignmentReward(
  state: CareerState,
  reward: AssignmentReward,
  roster: readonly RelationshipCharacter[],
): CareerState {
  if (reward.kind === 'xp-grant') return applyProgressionEffect(state, reward);
  if (reward.kind === 'relationship-delta' || reward.kind === 'relationship-pivotal-flag') {
    return applyRelationshipEffect(state, reward, roster);
  }
  return applySharedEffect(state, reward);
}

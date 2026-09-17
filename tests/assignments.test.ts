import { describe, expect, it } from 'vitest';

import {
  canStartAssignment,
  isAssignmentUnlocked,
  resolveActiveAssignment,
  startAssignment,
  type AssignmentDefinition,
} from '../src/domain/Assignments';
import { createDefaultCareerState, type CareerState } from '../src/domain/CareerState';
import type { RelationshipCharacter } from '../src/domain/Relationships';

const ROOM_CLASS: AssignmentDefinition = {
  id: 'room-class',
  category: 'class',
  title: 'Room Class',
  description: '',
  requiredHousingTier: 'room',
  durationMinutes: 60,
  rewards: [{ kind: 'xp-grant', amount: 10 }],
};

const APARTMENT_CLASS: AssignmentDefinition = {
  id: 'apartment-class',
  category: 'class',
  title: 'Apartment Class',
  description: '',
  requiredHousingTier: 'apartment',
  durationMinutes: 60,
  rewards: [{ kind: 'xp-grant', amount: 10 }],
};

const NETWORKING: AssignmentDefinition = {
  id: 'coffee',
  category: 'networking',
  title: 'Coffee',
  description: '',
  requiredHousingTier: 'room',
  durationMinutes: 60,
  rewards: [{ kind: 'relationship-delta', characterId: 'friend', delta: { trust: 5 } }],
};

const ROSTER: readonly RelationshipCharacter[] = [{ id: 'friend', supportsAttraction: false }];

const START_MS = 1_000_000;

describe('assignments', () => {
  it('locks an assignment above the current housing tier', () => {
    const state = createDefaultCareerState();
    expect(isAssignmentUnlocked(ROOM_CLASS, state.housing)).toBe(true);
    expect(isAssignmentUnlocked(APARTMENT_CLASS, state.housing)).toBe(false);
    expect(canStartAssignment(state, APARTMENT_CLASS)).toBe(false);
  });

  it('starts an unlocked assignment', () => {
    const state = createDefaultCareerState();
    const next = startAssignment(state, ROOM_CLASS, START_MS);
    expect(next.assignments.active).toEqual({ assignmentId: 'room-class', startedAtMs: START_MS });
  });

  it('does not start a second assignment while one is active', () => {
    const state = startAssignment(createDefaultCareerState(), ROOM_CLASS, START_MS);
    const next = startAssignment(state, ROOM_CLASS, START_MS + 1);
    expect(next).toBe(state);
  });

  it('does not resolve before the assignment is due', () => {
    const state = startAssignment(createDefaultCareerState(), ROOM_CLASS, START_MS);
    const { state: resolvedState, resolution } = resolveActiveAssignment(state, [ROOM_CLASS], ROSTER, START_MS + 30 * 60_000);
    expect(resolution).toBeUndefined();
    expect(resolvedState).toBe(state);
  });

  it('resolves and grants the reward exactly once it is due', () => {
    const started = startAssignment(createDefaultCareerState(), ROOM_CLASS, START_MS);
    const { state: resolved, resolution } = resolveActiveAssignment(started, [ROOM_CLASS], ROSTER, START_MS + 60 * 60_000);
    expect(resolution?.definition.id).toBe('room-class');
    expect(resolution?.awayMinutes).toBe(60);
    expect(resolved.assignments.active).toBeNull();
    expect(resolved.progression.xp).toBe(started.progression.xp + 10);
  });

  it('caps the reward regardless of how much real time has actually passed', () => {
    const started = startAssignment(createDefaultCareerState(), ROOM_CLASS, START_MS);
    const threeDaysLater = START_MS + 3 * 24 * 60 * 60_000;
    const { state: resolved, resolution } = resolveActiveAssignment(started, [ROOM_CLASS], ROSTER, threeDaysLater);
    expect(resolution?.awayMinutes).toBe(3 * 24 * 60);
    expect(resolved.progression.xp).toBe(started.progression.xp + 10);
  });

  it('applies a relationship-delta reward against the given roster', () => {
    const started = startAssignment(createDefaultCareerState(), NETWORKING, START_MS);
    const { state: resolved } = resolveActiveAssignment(started, [NETWORKING], ROSTER, START_MS + 60 * 60_000);
    expect(resolved.relationships.friend?.trust).toBe(5);
  });

  it('clears a dangling active assignment id rather than getting stuck', () => {
    const state: CareerState = {
      ...createDefaultCareerState(),
      assignments: { active: { assignmentId: 'missing', startedAtMs: START_MS } },
    };
    const { state: resolved, resolution } = resolveActiveAssignment(state, [ROOM_CLASS], ROSTER, START_MS + 60 * 60_000);
    expect(resolution).toBeUndefined();
    expect(resolved.assignments.active).toBeNull();
  });

  it('is a no-op when no assignment is active', () => {
    const state = createDefaultCareerState();
    const { state: resolved, resolution } = resolveActiveAssignment(state, [ROOM_CLASS], ROSTER, START_MS);
    expect(resolution).toBeUndefined();
    expect(resolved).toBe(state);
  });
});

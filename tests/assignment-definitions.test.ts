import { describe, expect, it } from 'vitest';

import {
  ADVANCED_SCENE_WORKSHOP,
  ALL_ASSIGNMENTS,
  COLD_READING_CLINIC,
  DAY_TRIP_TO_THE_COAST,
  DINER_COUNTER_SHIFT,
  EARLY_NIGHT_IN,
  EXTRA_ON_A_BACKLOT,
  PREMIERE_AFTER_PARTY,
  RUN_LINES_WITH_SCENE_PARTNER,
  SCENE_STUDY_CLASS,
} from '../src/domain/AssignmentDefinitions';
import { assignmentRequiredLevel } from '../src/domain/Assignments';

/** Owner request: nine assignments. Four are open from the start, the apartment workshop waits on housing, and one more
 * unlocks at each of levels 2 to 5. None of them pays Energy (Wait already gives that); Money stands in for it. */
describe('the Home assignments\' lengths', () => {
  it('run from 5 minutes up to 4 hours', () => {
    expect(RUN_LINES_WITH_SCENE_PARTNER.durationMinutes).toBe(5);
    expect(DINER_COUNTER_SHIFT.durationMinutes).toBe(15);
    expect(PREMIERE_AFTER_PARTY.durationMinutes).toBe(45);
    expect(SCENE_STUDY_CLASS.durationMinutes).toBe(60);
    expect(EXTRA_ON_A_BACKLOT.durationMinutes).toBe(90);
    expect(EARLY_NIGHT_IN.durationMinutes).toBe(120);
    expect(COLD_READING_CLINIC.durationMinutes).toBe(150);
    expect(DAY_TRIP_TO_THE_COAST.durationMinutes).toBe(180);
    expect(ADVANCED_SCENE_WORKSHOP.durationMinutes).toBe(240);
  });

  it('pay the agreed rewards', () => {
    expect(RUN_LINES_WITH_SCENE_PARTNER.rewards).toEqual([
      { kind: 'relationship-delta', characterId: expect.any(String), delta: { trust: 5 } },
      { kind: 'xp-grant', amount: 2 },
    ]);
    expect(DINER_COUNTER_SHIFT.rewards).toEqual([{ kind: 'resource-delta', delta: { money: 25 } }, { kind: 'xp-grant', amount: 5 }]);
    expect(SCENE_STUDY_CLASS.rewards).toEqual([{ kind: 'xp-grant', amount: 15 }]);
    expect(EARLY_NIGHT_IN.rewards).toEqual([{ kind: 'resource-delta', delta: { money: 50 } }, { kind: 'xp-grant', amount: 25 }]);
    expect(ADVANCED_SCENE_WORKSHOP.rewards).toEqual([{ kind: 'xp-grant', amount: 40 }]);
    expect(EXTRA_ON_A_BACKLOT.rewards).toEqual([{ kind: 'resource-delta', delta: { money: 60 } }, { kind: 'xp-grant', amount: 12 }]);
    expect(COLD_READING_CLINIC.rewards).toEqual([{ kind: 'xp-grant', amount: 35 }]);
    expect(PREMIERE_AFTER_PARTY.rewards).toEqual([
      { kind: 'relationship-delta', characterId: expect.any(String), delta: { trust: 8 } },
      { kind: 'xp-grant', amount: 10 },
    ]);
    expect(DAY_TRIP_TO_THE_COAST.rewards).toEqual([{ kind: 'resource-delta', delta: { money: 75 } }, { kind: 'xp-grant', amount: 45 }]);
  });

  it('never award Energy', () => {
    for (const assignment of ALL_ASSIGNMENTS) {
      for (const reward of assignment.rewards) {
        if (reward.kind === 'resource-delta') expect(reward.delta.energy, assignment.id).toBeUndefined();
      }
    }
  });

  it('keep the reward numbers out of the copy, which the Home screen shows beside it', () => {
    for (const assignment of ALL_ASSIGNMENTS) expect(assignment.description, assignment.id).not.toMatch(/\d/);
  });
});

describe('what unlocks each assignment', () => {
  it('opens the first four at level 1, and one more at each of levels 2 to 5', () => {
    const levels = [
      SCENE_STUDY_CLASS,
      DINER_COUNTER_SHIFT,
      RUN_LINES_WITH_SCENE_PARTNER,
      EARLY_NIGHT_IN,
      EXTRA_ON_A_BACKLOT,
      COLD_READING_CLINIC,
      PREMIERE_AFTER_PARTY,
      DAY_TRIP_TO_THE_COAST,
    ].map(assignmentRequiredLevel);
    expect(levels).toEqual([1, 1, 1, 1, 2, 3, 4, 5]);
    expect(ALL_ASSIGNMENTS).toHaveLength(9);
  });

  it('keeps the workshop waiting on the apartment, and every other assignment open to the starting room', () => {
    expect(ADVANCED_SCENE_WORKSHOP.requiredHousingTier).toBe('apartment');
    for (const assignment of ALL_ASSIGNMENTS.filter((candidate) => candidate !== ADVANCED_SCENE_WORKSHOP)) {
      expect(assignment.requiredHousingTier, assignment.id).toBe('room');
    }
  });
});

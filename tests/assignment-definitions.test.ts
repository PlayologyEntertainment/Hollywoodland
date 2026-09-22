import { describe, expect, it } from 'vitest';

import {
  ADVANCED_SCENE_WORKSHOP,
  DINER_COUNTER_SHIFT,
  EARLY_NIGHT_IN,
  RUN_LINES_WITH_SCENE_PARTNER,
  SCENE_STUDY_CLASS,
} from '../src/domain/AssignmentDefinitions';

/** Owner request: shorten the real-world wait for every Home assignment, to 5/15/60/120/240 minutes, one length per
 * assignment, keeping the assignments' relative order (and their reward amounts, unchanged) from before the shorten. */
describe('the Home assignments\' lengths', () => {
  it('run from 5 minutes up to 4 hours, shortest to longest in the same order as before', () => {
    expect(RUN_LINES_WITH_SCENE_PARTNER.durationMinutes).toBe(5);
    expect(DINER_COUNTER_SHIFT.durationMinutes).toBe(15);
    expect(SCENE_STUDY_CLASS.durationMinutes).toBe(60);
    expect(EARLY_NIGHT_IN.durationMinutes).toBe(120);
    expect(ADVANCED_SCENE_WORKSHOP.durationMinutes).toBe(240);
  });

  it('kept every reward amount unchanged from before the shorten', () => {
    expect(RUN_LINES_WITH_SCENE_PARTNER.rewards).toEqual([
      { kind: 'relationship-delta', characterId: expect.any(String), delta: { trust: 5 } },
    ]);
    expect(DINER_COUNTER_SHIFT.rewards).toEqual([{ kind: 'resource-delta', delta: { money: 25 } }]);
    expect(SCENE_STUDY_CLASS.rewards).toEqual([{ kind: 'xp-grant', amount: 15 }]);
    expect(EARLY_NIGHT_IN.rewards).toEqual([{ kind: 'resource-delta', delta: { energy: 40 } }]);
    expect(ADVANCED_SCENE_WORKSHOP.rewards).toEqual([{ kind: 'xp-grant', amount: 40 }]);
  });
});

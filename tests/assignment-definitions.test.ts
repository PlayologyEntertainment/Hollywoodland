import { describe, expect, it } from 'vitest';

import {
  ADVANCED_SCENE_WORKSHOP,
  DINER_COUNTER_SHIFT,
  EARLY_NIGHT_IN,
  RUN_LINES_WITH_SCENE_PARTNER,
  SCENE_STUDY_CLASS,
} from '../src/domain/AssignmentDefinitions';

/** Owner request: shorten the real-world wait for every Home assignment, to 5/15/60/120/240 minutes, one length per
 * assignment, keeping the assignments' relative order from before the shorten. */
describe('the Home assignments\' lengths', () => {
  it('run from 5 minutes up to 4 hours, shortest to longest in the same order as before', () => {
    expect(RUN_LINES_WITH_SCENE_PARTNER.durationMinutes).toBe(5);
    expect(DINER_COUNTER_SHIFT.durationMinutes).toBe(15);
    expect(SCENE_STUDY_CLASS.durationMinutes).toBe(60);
    expect(EARLY_NIGHT_IN.durationMinutes).toBe(120);
    expect(ADVANCED_SCENE_WORKSHOP.durationMinutes).toBe(240);
  });

  it('kept every original reward unchanged, alongside its XP grant', () => {
    expect(RUN_LINES_WITH_SCENE_PARTNER.rewards).toEqual([
      { kind: 'relationship-delta', characterId: expect.any(String), delta: { trust: 5 } },
      { kind: 'xp-grant', amount: 2 },
    ]);
    expect(DINER_COUNTER_SHIFT.rewards).toEqual([
      { kind: 'resource-delta', delta: { money: 25 } },
      { kind: 'xp-grant', amount: 5 },
    ]);
    expect(SCENE_STUDY_CLASS.rewards).toEqual([{ kind: 'xp-grant', amount: 15 }]);
    expect(EARLY_NIGHT_IN.rewards).toEqual([
      { kind: 'resource-delta', delta: { energy: 40 } },
      { kind: 'xp-grant', amount: 25 },
    ]);
    expect(ADVANCED_SCENE_WORKSHOP.rewards).toEqual([{ kind: 'xp-grant', amount: 40 }]);
  });

  it('gives every assignment a growing XP grant as duration increases (2/5/15/25/40)', () => {
    expect(RUN_LINES_WITH_SCENE_PARTNER.rewards).toContainEqual({ kind: 'xp-grant', amount: 2 });
    expect(DINER_COUNTER_SHIFT.rewards).toContainEqual({ kind: 'xp-grant', amount: 5 });
    expect(SCENE_STUDY_CLASS.rewards).toContainEqual({ kind: 'xp-grant', amount: 15 });
    expect(EARLY_NIGHT_IN.rewards).toContainEqual({ kind: 'xp-grant', amount: 25 });
    expect(ADVANCED_SCENE_WORKSHOP.rewards).toContainEqual({ kind: 'xp-grant', amount: 40 });
  });

  it('mentions each assignment\'s reward numbers in its description', () => {
    expect(RUN_LINES_WITH_SCENE_PARTNER.description).toMatch(/2 XP/);
    expect(DINER_COUNTER_SHIFT.description).toMatch(/\$25/);
    expect(DINER_COUNTER_SHIFT.description).toMatch(/5 XP/);
    expect(SCENE_STUDY_CLASS.description).toMatch(/15 XP/);
    expect(EARLY_NIGHT_IN.description).toMatch(/40 energy/);
    expect(EARLY_NIGHT_IN.description).toMatch(/25 XP/);
    expect(ADVANCED_SCENE_WORKSHOP.description).toMatch(/40 XP/);
  });
});

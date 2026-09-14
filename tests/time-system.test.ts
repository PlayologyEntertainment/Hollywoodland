import { describe, expect, it } from 'vitest';

import { advanceTimeSlot, DEFAULT_TIME } from '../src/domain/TimeSystem';

describe('time system', () => {
  it('advances morning to afternoon within the same day', () => {
    expect(advanceTimeSlot(DEFAULT_TIME)).toEqual({ day: 1, slot: 'afternoon' });
  });

  it('advances afternoon to evening within the same day', () => {
    expect(advanceTimeSlot({ day: 1, slot: 'afternoon' })).toEqual({ day: 1, slot: 'evening' });
  });

  it('rolls evening over into the next day’s morning', () => {
    expect(advanceTimeSlot({ day: 1, slot: 'evening' })).toEqual({ day: 2, slot: 'morning' });
  });

  it('is pure: the same input always produces the same output', () => {
    const time = { day: 3, slot: 'afternoon' as const };
    expect(advanceTimeSlot(time)).toEqual(advanceTimeSlot(time));
    expect(time).toEqual({ day: 3, slot: 'afternoon' });
  });
});

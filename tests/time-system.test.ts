import { describe, expect, it } from 'vitest';

import { advanceTimeSlot, DEFAULT_TIME, weekdayForDay } from '../src/domain/TimeSystem';

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

describe('weekdayForDay', () => {
  it('starts the game on a Monday', () => {
    expect(weekdayForDay(1)).toBe('Monday');
  });

  it('walks through a full week in order', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(weekdayForDay)).toEqual([
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ]);
  });

  it('wraps around into the next week', () => {
    expect(weekdayForDay(8)).toBe('Monday');
    expect(weekdayForDay(9)).toBe('Tuesday');
  });
});

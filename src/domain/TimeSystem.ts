export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface TimeState {
  readonly day: number;
  readonly slot: TimeSlot;
}

export const DEFAULT_TIME: TimeState = Object.freeze({ day: 1, slot: 'morning' });

const SLOT_ORDER: readonly TimeSlot[] = ['morning', 'afternoon', 'evening'];

// Day 1 is a Monday, so weekday-referencing dialogue (e.g. "come back Tuesday")
// lines up with a real day of the week instead of an opaque day count.
const WEEKDAYS: readonly string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function weekdayForDay(day: number): string {
  return WEEKDAYS[(day - 1) % WEEKDAYS.length] as string;
}

/** Flexible time advancement per the GDD: no permanently missable deadlines,
 * just morning/afternoon/evening slots that roll into the next day. */
export function advanceTimeSlot(time: TimeState): TimeState {
  const currentIndex = SLOT_ORDER.indexOf(time.slot);
  const nextIndex = (currentIndex + 1) % SLOT_ORDER.length;
  const nextSlot = SLOT_ORDER[nextIndex] as TimeSlot;
  return nextIndex === 0 ? { day: time.day + 1, slot: nextSlot } : { day: time.day, slot: nextSlot };
}

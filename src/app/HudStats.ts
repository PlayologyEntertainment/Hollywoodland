import type { CareerState } from '../domain/CareerState';
import { MAX_ENERGY } from '../domain/EconomySystem';
import { weekdayForDay, type TimeSlot } from '../domain/TimeSystem';

export const TIME_SLOT_LABELS: Readonly<Record<TimeSlot, string>> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

/** Energy at or below this reads as low in the header, so the player notices before they run dry. */
export const LOW_ENERGY_AT = 25;

/** What the stats panel shows for a career: the day, the time of day, money and energy, as words and numbers. (Reputation is on
 * the Status panel, not here.) Pure, so the wording is tested without a browser. */
export interface HudStats {
  /** "Day 3", the count of days played. */
  readonly dayNumber: string;
  readonly weekday: string;
  readonly slotLabel: string;
  readonly money: string;
  readonly energy: number;
  readonly energyLow: boolean;
  /** Reputation is not in the header, but the Status panel shows it from here. */
  readonly reputation: number;
  /** The whole readout as one line, for screen readers, which are told when it changes. */
  readonly spoken: string;
}

export function describeHud(state: CareerState): HudStats {
  const { day, slot } = state.time;
  const { money, energy, reputation } = state.resources;
  const weekday = weekdayForDay(day);
  const slotLabel = TIME_SLOT_LABELS[slot];
  return {
    dayNumber: `Day ${day}`,
    weekday,
    slotLabel,
    money: `$${money}`,
    energy,
    energyLow: energy <= LOW_ENERGY_AT,
    reputation,
    spoken: `Day ${day}, ${weekday} · ${slotLabel} · $${money} · Energy ${energy}/${MAX_ENERGY}`,
  };
}

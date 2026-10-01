import { applyResourceDelta } from './EconomySystem';
import { advanceTimeSlot } from './TimeSystem';
import type { CareerState } from './CareerState';

/** The five regions on the Union Bus Depot's map. Each is a place the story takes the player to; only built ones can be travelled to. */
export type RegionId = 'hollywood-boulevard' | 'hollywood-bowl' | 'santa-monica-pier' | 'griffith-observatory' | 'monarch-lot';

export const DEFAULT_REGION: RegionId = 'hollywood-boulevard';

/** What the classic "Welcome to ..." sign on arrival says. The city and subtitle are catalog text (`content.region.<id>.*`); the
 * population is a number, formatted for the active language, so the sign reads right everywhere. */
export interface RegionDefinition {
  readonly id: RegionId;
  /** English fallbacks for the catalog entries; see contentStrings.ts. */
  readonly name: string;
  readonly city: string;
  readonly subtitle: string;
  /** The 1930 census figure for the municipality the sign names (Hollywood and the hills are districts of the City of Los Angeles). */
  readonly population: number;
  /** False until the region's place is built; an unbuilt region shows on the map but cannot be travelled to yet. */
  readonly playable: boolean;
}

export const REGIONS: readonly RegionDefinition[] = Object.freeze([
  { id: 'hollywood-boulevard', name: 'Hollywood Boulevard', city: 'HOLLYWOOD', subtitle: 'City of Los Angeles', population: 1_238_048, playable: true },
  { id: 'hollywood-bowl', name: 'Hollywood Bowl', city: 'HOLLYWOOD HILLS', subtitle: 'City of Los Angeles', population: 1_238_048, playable: false },
  { id: 'santa-monica-pier', name: 'Santa Monica Pier', city: 'SANTA MONICA', subtitle: 'By the Sea', population: 37_146, playable: false },
  { id: 'griffith-observatory', name: 'Griffith Observatory', city: 'GRIFFITH PARK', subtitle: 'City of Los Angeles', population: 1_238_048, playable: false },
  { id: 'monarch-lot', name: 'Monarch Pictures Studio Lot', city: 'CULVER CITY', subtitle: 'Heart of Screenland', population: 5_669, playable: false },
]);

export function getRegionById(id: string): RegionDefinition | undefined {
  return REGIONS.find((region) => region.id === id);
}

export function isRegionId(value: unknown): value is RegionId {
  return typeof value === 'string' && REGIONS.some((region) => region.id === value);
}

/** Where the player is. Older saves, and every career until it first travels, have no region and are on the Boulevard. */
export function currentRegion(state: Pick<CareerState, 'region'>): RegionId {
  return isRegionId(state.region) ? state.region : DEFAULT_REGION;
}

export interface TravelQuote {
  readonly fare: number;
  readonly slots: number;
}

/** A trip within the hills and the city is $2 and one time slot (morning to afternoon, and so on); a trip to or from the coast is
 * $5 and two. Money is in whole dollars, so period bus fares in cents are scaled up to be worth noticing early on. */
export const NEAR_TRIP: TravelQuote = Object.freeze({ fare: 2, slots: 1 });
export const FAR_TRIP: TravelQuote = Object.freeze({ fare: 5, slots: 2 });

/** What a trip between two regions costs, or `undefined` when they are the same place. */
export function travelQuote(from: RegionId, to: RegionId): TravelQuote | undefined {
  if (from === to) return undefined;
  return from === 'santa-monica-pier' || to === 'santa-monica-pier' ? FAR_TRIP : NEAR_TRIP;
}

export type TravelStatus = 'here' | 'coming-soon' | 'cannot-afford' | 'ready';

/** Whether the player can take the bus to `to` right now, and if not, why. Checked in this order, so the message names the first thing
 * in the way: already there, not built yet, not enough money. */
export function travelStatus(state: CareerState, to: RegionId): TravelStatus {
  const from = currentRegion(state);
  if (from === to) return 'here';
  if (getRegionById(to)?.playable !== true) return 'coming-soon';
  const quote = travelQuote(from, to);
  if (quote === undefined || state.resources.money < quote.fare) return 'cannot-afford';
  return 'ready';
}

/** Takes the bus: pays the fare, moves the clock on, and records the new region. A no-op unless `travelStatus` says ready, the same
 * defensive posture the other career actions take toward a request that is no longer valid. Time moves on but Energy is untouched
 * (unlike Wait, which rests). */
export function travelTo(state: CareerState, to: RegionId): CareerState {
  if (travelStatus(state, to) !== 'ready') return state;
  const quote = travelQuote(currentRegion(state), to);
  if (quote === undefined) return state;
  let time = state.time;
  for (let slot = 0; slot < quote.slots; slot += 1) time = advanceTimeSlot(time);
  return { ...state, region: to, time, resources: applyResourceDelta(state.resources, { money: -quote.fare }) };
}

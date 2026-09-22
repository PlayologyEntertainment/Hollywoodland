import { validateContent } from '../content/ContentValidator';

export type AttributeKey = 'presence' | 'craft' | 'wit' | 'nerve' | 'grit';
export type AttributesState = Readonly<Record<AttributeKey, number>>;

export interface Origin {
  readonly id: string;
  readonly name: string;
  readonly blurb: string;
  readonly deltas: Partial<Record<AttributeKey, number>>;
}

export const BASE_ATTRIBUTE_VALUE = 5;
export const MAX_ATTRIBUTE_VALUE = 10;

export const DEFAULT_ATTRIBUTES: AttributesState = Object.freeze({
  presence: BASE_ATTRIBUTE_VALUE,
  craft: BASE_ATTRIBUTE_VALUE,
  wit: BASE_ATTRIBUTE_VALUE,
  nerve: BASE_ATTRIBUTE_VALUE,
  grit: BASE_ATTRIBUTE_VALUE,
});

/** Deltas sourced from docs/DRAFT_TRACK_B_CANON_PROPOSAL.md §3 — keep in
 * sync if that document's origin list changes. Debug/placeholder content:
 * final names and blurbs remain Owner approval required.
 *
 * Owner request: the original ±1 swing (base 5, on a 0–10 scale) left every
 * origin's final attributes within 4–6 of each other — too close to read as
 * distinct builds. Widened to ±3 (values now land between 2 and 8), still one
 * strength traded for one weakness each (zero-sum, no origin a strict
 * upgrade), same attribute pairs and direction as before, just a bolder
 * swing. Runaway Society Name is the one exception: the doc's second cost for
 * it was "−1 starting money," a resource this list has never had a field for
 * (`Origin.deltas` is attribute-only) — rather than leave it the only origin
 * touching just one attribute, it now trades −3 Wit (a sheltered upbringing,
 * no street-smarts) for its +3 Presence, matching every other origin's shape.
 * The doc below is updated to match. */
export const ORIGINS: readonly Origin[] = [
  { id: 'small-town-hopeful', name: 'Small-Town Hopeful', blurb: 'Left a Midwest county for the first time.', deltas: { grit: 3, wit: -3 } },
  { id: 'vaudeville-trouper', name: 'Vaudeville Trouper', blurb: 'Grew up in a touring stage family.', deltas: { craft: 3, grit: -3 } },
  { id: 'runaway-society-name', name: 'Runaway Society Name', blurb: 'Walked out on a wealthy, controlling family.', deltas: { presence: 3, wit: -3 } },
  { id: 'immigrant-striver', name: 'Immigrant Striver', blurb: 'Arrived by ship and rail, still finding footing.', deltas: { grit: 3, presence: -3 } },
  { id: 'studio-lot-hand-me-down', name: 'Studio-Lot Hand-Me-Down', blurb: 'Mending costumes on the lot, finally auditioning.', deltas: { wit: 3, nerve: -3 } },
];

validateContent(ORIGINS, 'Origins');

export function getOrigin(originId: string): Origin | undefined {
  return ORIGINS.find((origin) => origin.id === originId);
}

export function deriveAttributes(originId: string): AttributesState {
  const origin = getOrigin(originId);
  if (origin === undefined) return DEFAULT_ATTRIBUTES;
  const attributes = { ...DEFAULT_ATTRIBUTES };
  for (const key of Object.keys(origin.deltas) as AttributeKey[]) {
    attributes[key] = BASE_ATTRIBUTE_VALUE + (origin.deltas[key] ?? 0);
  }
  return attributes;
}

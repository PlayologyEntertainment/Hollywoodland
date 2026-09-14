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
 * final names and blurbs remain Owner approval required. */
export const ORIGINS: readonly Origin[] = [
  { id: 'small-town-hopeful', name: 'Small-Town Hopeful', blurb: 'Left a Midwest county for the first time.', deltas: { grit: 1, wit: -1 } },
  { id: 'vaudeville-trouper', name: 'Vaudeville Trouper', blurb: 'Grew up in a touring stage family.', deltas: { craft: 1, grit: -1 } },
  { id: 'runaway-society-name', name: 'Runaway Society Name', blurb: 'Walked out on a wealthy, controlling family.', deltas: { presence: 1 } },
  { id: 'immigrant-striver', name: 'Immigrant Striver', blurb: 'Arrived by ship and rail, still finding footing.', deltas: { grit: 1, presence: -1 } },
  { id: 'studio-lot-hand-me-down', name: 'Studio-Lot Hand-Me-Down', blurb: 'Mending costumes on the lot, finally auditioning.', deltas: { wit: 1, nerve: -1 } },
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

import type { CareerState } from './CareerState';

/** The Vertical Slice Spec's (§5) Rewards row — "First credit, headshot/
 * costume/prop or home display" — and the Decision Log's broader reward
 * list, scoped down to the categories not already covered by another
 * system: contacts are the relationship roster (RelationshipDefinitions.ts)
 * and perks are talents (Progression.ts), so neither gets a duplicate here. */
export type InventoryItemCategory = 'credit' | 'headshot' | 'costume' | 'prop' | 'home-display';

/** A collectible reward, per the Technical Implementation Plan's (§5) item/
 * reward content-model entry: "stable ID, category, display metadata,
 * unlock source, scrapbook/home representation." `unlockSource` is that
 * display metadata — a human-readable note on what's expected to grant the
 * item — not a validated reference to a quest or dialogue id: wiring a
 * grant effect into quest/dialogue content, the way round 9 wired
 * `xp-grant`, is next round's job, not this foundation round's. */
export interface InventoryItemDefinition {
  readonly id: string;
  readonly category: InventoryItemCategory;
  readonly name: string;
  readonly description: string;
  readonly unlockSource: string;
}

/** Owned item ids, lazily populated the same way `RelationshipState` is: an
 * id absent from the record simply hasn't been earned yet, rather than
 * every authored item getting a default "not owned" entry up front. */
export interface InventoryState {
  readonly ownedItemIds: Readonly<Record<string, boolean>>;
}

export const DEFAULT_INVENTORY: InventoryState = Object.freeze({ ownedItemIds: Object.freeze({}) });

export function hasItem(inventory: InventoryState, item: InventoryItemDefinition): boolean {
  return inventory.ownedItemIds[item.id] ?? false;
}

/** Granting an already-owned item is a no-op — per the Decision Log,
 * wardrobe/rewards are "a cosmetic collection; no equipment-stat
 * optimization," so items are unique keepsakes rather than a stackable
 * resource with anything for a repeat grant to add to. */
export function grantItem(inventory: InventoryState, item: InventoryItemDefinition): InventoryState {
  if (hasItem(inventory, item)) return inventory;
  return { ownedItemIds: { ...inventory.ownedItemIds, [item.id]: true } };
}

export interface ItemOwnedCondition {
  readonly kind: 'item-owned';
  readonly itemId: string;
}

export type InventoryCondition = ItemOwnedCondition;

export interface ItemGrantEffect {
  readonly kind: 'item-grant';
  readonly itemId: string;
}

export type InventoryEffect = ItemGrantEffect;

function findInventoryItem(
  items: readonly InventoryItemDefinition[],
  itemId: string,
): InventoryItemDefinition | undefined {
  return items.find((item) => item.id === itemId);
}

/** A dangling `itemId` (content authored against a catalog this call wasn't
 * given, or a stale reference) resolves to `false` rather than throwing —
 * the same defensive posture `evaluateRelationshipCondition` takes toward a
 * dangling `characterId`. */
export function evaluateInventoryCondition(
  state: CareerState,
  condition: InventoryCondition,
  items: readonly InventoryItemDefinition[],
): boolean {
  const item = findInventoryItem(items, condition.itemId);
  if (item === undefined) return false;
  return hasItem(state.inventory, item);
}

/** No-ops on a dangling `itemId`, mirroring `applyRelationshipEffect`'s
 * style — the payload crosses content-authoring/dialogue-effect boundaries
 * where a stale reference is a legitimate defensive case, not a crash. */
export function applyInventoryEffect(
  state: CareerState,
  effect: InventoryEffect,
  items: readonly InventoryItemDefinition[],
): CareerState {
  const item = findInventoryItem(items, effect.itemId);
  if (item === undefined) return state;
  return { ...state, inventory: grantItem(state.inventory, item) };
}

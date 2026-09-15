import type { InventoryItemDefinition } from '../domain/Inventory';
import { validateContent } from './ContentValidator';

/** Checks the authored item set's structural integrity: unique ids (via
 * `validateContent`, the same helper `TalentValidator` and `QuestValidator`
 * use) plus non-empty display metadata for every field a reward's scrapbook/
 * home representation depends on. There's no prerequisite or cycle check
 * here the way `validateTalentTree` has — items don't reference each other,
 * only (loosely, via the free-text `unlockSource`) whatever grants them. */
export function validateInventoryItems(items: readonly InventoryItemDefinition[]): void {
  validateContent(items, 'Inventory items');

  for (const item of items) {
    if (item.name.trim().length === 0) {
      throw new Error(`Inventory item "${item.id}" is missing a display name.`);
    }
    if (item.description.trim().length === 0) {
      throw new Error(`Inventory item "${item.id}" is missing a description.`);
    }
    if (item.unlockSource.trim().length === 0) {
      throw new Error(`Inventory item "${item.id}" is missing an unlock source.`);
    }
  }
}

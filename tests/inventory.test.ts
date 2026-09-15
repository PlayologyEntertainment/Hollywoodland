import { describe, expect, it } from 'vitest';

import { DEFAULT_INVENTORY, grantItem, hasItem, type InventoryItemDefinition, type InventoryState } from '../src/domain/Inventory';

const HEADSHOT: InventoryItemDefinition = {
  id: 'studio-headshot',
  category: 'headshot',
  name: 'Studio Headshot',
  description: '',
  unlockSource: 'debug',
};

describe('hasItem', () => {
  it('reflects the ownedItemIds record', () => {
    expect(hasItem(DEFAULT_INVENTORY, HEADSHOT)).toBe(false);
    expect(hasItem({ ownedItemIds: { 'studio-headshot': true } }, HEADSHOT)).toBe(true);
  });
});

describe('grantItem', () => {
  it('adds the item to an inventory that does not have it yet', () => {
    const next = grantItem(DEFAULT_INVENTORY, HEADSHOT);
    expect(hasItem(next, HEADSHOT)).toBe(true);
  });

  it('is a no-op when the item is already owned', () => {
    const owned: InventoryState = { ownedItemIds: { 'studio-headshot': true } };
    expect(grantItem(owned, HEADSHOT)).toBe(owned);
  });
});

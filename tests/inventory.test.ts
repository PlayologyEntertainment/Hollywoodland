import { describe, expect, it } from 'vitest';

import { createDefaultCareerState } from '../src/domain/CareerState';
import {
  applyInventoryEffect,
  DEFAULT_INVENTORY,
  evaluateInventoryCondition,
  grantItem,
  hasItem,
  type InventoryItemDefinition,
  type InventoryState,
} from '../src/domain/Inventory';

const HEADSHOT: InventoryItemDefinition = {
  id: 'studio-headshot',
  category: 'headshot',
  name: 'Studio Headshot',
  description: '',
  unlockSource: 'debug',
};

const NO_ITEMS: InventoryItemDefinition[] = [];
const CATALOG: InventoryItemDefinition[] = [HEADSHOT];

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

describe('evaluateInventoryCondition', () => {
  it('evaluates an item-owned condition against the inventory', () => {
    const state = createDefaultCareerState();
    expect(evaluateInventoryCondition(state, { kind: 'item-owned', itemId: 'studio-headshot' }, CATALOG)).toBe(false);
    const owned = { ...state, inventory: { ownedItemIds: { 'studio-headshot': true } } };
    expect(evaluateInventoryCondition(owned, { kind: 'item-owned', itemId: 'studio-headshot' }, CATALOG)).toBe(true);
  });

  it('treats an item-owned condition referencing an unknown item as false', () => {
    const state = createDefaultCareerState();
    expect(evaluateInventoryCondition(state, { kind: 'item-owned', itemId: 'missing' }, NO_ITEMS)).toBe(false);
  });
});

describe('applyInventoryEffect', () => {
  it('applies an item-grant effect by granting the referenced item', () => {
    const state = createDefaultCareerState();
    const next = applyInventoryEffect(state, { kind: 'item-grant', itemId: 'studio-headshot' }, CATALOG);
    expect(hasItem(next.inventory, HEADSHOT)).toBe(true);
  });

  it('no-ops an item-grant effect referencing an unknown item', () => {
    const state = createDefaultCareerState();
    expect(applyInventoryEffect(state, { kind: 'item-grant', itemId: 'missing' }, NO_ITEMS)).toBe(state);
  });
});

import { describe, expect, it } from 'vitest';

import { validateInventoryItems } from '../src/content/InventoryValidator';
import { ALL_ITEMS } from '../src/domain/InventoryDefinitions';
import type { InventoryItemDefinition } from '../src/domain/Inventory';

function item(overrides: Partial<InventoryItemDefinition> & Pick<InventoryItemDefinition, 'id'>): InventoryItemDefinition {
  return {
    category: 'prop',
    name: overrides.id,
    description: 'A keepsake.',
    unlockSource: 'debug',
    ...overrides,
  };
}

describe('validateInventoryItems', () => {
  it('accepts a valid item set', () => {
    expect(() => validateInventoryItems([item({ id: 'a' }), item({ id: 'b' })])).not.toThrow();
  });

  it('rejects a duplicate item id', () => {
    const a = item({ id: 'dup' });
    expect(() => validateInventoryItems([a, a])).toThrow('duplicate id');
  });

  it('rejects a missing display name', () => {
    const a = item({ id: 'a', name: '  ' });
    expect(() => validateInventoryItems([a])).toThrow('missing a display name');
  });

  it('rejects a missing description', () => {
    const a = item({ id: 'a', description: '' });
    expect(() => validateInventoryItems([a])).toThrow('missing a description');
  });

  it('rejects a missing unlock source', () => {
    const a = item({ id: 'a', unlockSource: '' });
    expect(() => validateInventoryItems([a])).toThrow('missing an unlock source');
  });

  it('validates the real inventory content', () => {
    expect(() => validateInventoryItems(ALL_ITEMS)).not.toThrow();
  });
});

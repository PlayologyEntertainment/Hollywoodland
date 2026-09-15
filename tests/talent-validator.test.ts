import { describe, expect, it } from 'vitest';

import { validateTalentTree } from '../src/content/TalentValidator';
import { ALL_TALENTS } from '../src/domain/TalentDefinitions';
import type { TalentDefinition } from '../src/domain/Progression';

function talent(overrides: Partial<TalentDefinition> & Pick<TalentDefinition, 'id'>): TalentDefinition {
  return {
    branch: 'drama',
    name: overrides.id,
    description: '',
    attribute: 'craft',
    attributeBonus: 1,
    cost: 1,
    prerequisiteId: null,
    ...overrides,
  };
}

describe('validateTalentTree', () => {
  it('accepts a valid two-tier tree', () => {
    const root = talent({ id: 'root' });
    const child = talent({ id: 'child', cost: 2, prerequisiteId: 'root' });
    expect(() => validateTalentTree([root, child])).not.toThrow();
  });

  it('rejects a duplicate talent id', () => {
    const root = talent({ id: 'dup' });
    expect(() => validateTalentTree([root, root])).toThrow('duplicate id');
  });

  it('rejects a non-positive cost', () => {
    const root = talent({ id: 'free', cost: 0 });
    expect(() => validateTalentTree([root])).toThrow('non-positive cost');
  });

  it('rejects a dangling prerequisite reference', () => {
    const child = talent({ id: 'child', prerequisiteId: 'missing' });
    expect(() => validateTalentTree([child])).toThrow('references missing talent "missing"');
  });

  it('rejects a prerequisite in a different branch', () => {
    const root = talent({ id: 'root', branch: 'drama' });
    const child = talent({ id: 'child', branch: 'comedy', prerequisiteId: 'root' });
    expect(() => validateTalentTree([root, child])).toThrow('different branch');
  });

  it('rejects a dependency cycle', () => {
    const a = talent({ id: 'a', prerequisiteId: 'b' });
    const b = talent({ id: 'b', prerequisiteId: 'a' });
    expect(() => validateTalentTree([a, b])).toThrow('dependency cycle');
  });

  it('validates the real talent content, including its authored branch fork', () => {
    expect(() => validateTalentTree(ALL_TALENTS)).not.toThrow();
    const drama2Options = ALL_TALENTS.filter((t) => t.prerequisiteId === 'drama-1');
    expect(drama2Options).toHaveLength(2);
  });
});

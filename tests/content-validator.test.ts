import { describe, expect, it } from 'vitest';

import { validateContent } from '../src/content/ContentValidator';
import { ORIGINS } from '../src/domain/Origins';

describe('content validator', () => {
  it('accepts a list of uniquely identified content', () => {
    expect(() => validateContent([{ id: 'a' }, { id: 'b' }], 'Test content')).not.toThrow();
  });

  it('rejects a duplicate id', () => {
    expect(() => validateContent([{ id: 'a' }, { id: 'a' }], 'Test content')).toThrow('duplicate id: "a"');
  });

  it('rejects a missing or empty id', () => {
    expect(() => validateContent([{ id: '' }], 'Test content')).toThrow('missing or empty id');
  });

  it('validates the real origins table', () => {
    expect(() => validateContent(ORIGINS, 'Origins')).not.toThrow();
  });
});

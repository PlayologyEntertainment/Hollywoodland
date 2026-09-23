import { describe, expect, it } from 'vitest';

import { buildAssetUrl } from '../src/shared/assetUrl';

describe('buildAssetUrl', () => {
  it('joins the base, path and build id', () => {
    expect(buildAssetUrl('/Hollywoodland/', 'assets/locations/diner.webp', 'abc123')).toBe(
      '/Hollywoodland/assets/locations/diner.webp?v=abc123',
    );
  });

  it('encodes an unusual build id', () => {
    expect(buildAssetUrl('/', 'data/x.json', 'a b')).toBe('/data/x.json?v=a%20b');
  });
});

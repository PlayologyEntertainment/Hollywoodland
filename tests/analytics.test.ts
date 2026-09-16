import { describe, expect, it } from 'vitest';

import { NoOpAnalyticsClient } from '../src/analytics/Analytics';

describe('analytics', () => {
  it('accepts every event name without transmitting anything', () => {
    const client = new NoOpAnalyticsClient();
    expect(() => client.track({ name: 'session_started' })).not.toThrow();
    expect(() => client.track({ name: 'foundation_entered' })).not.toThrow();
    expect(() => client.track({ name: 'settings_changed', properties: { textScale: 1.5 } })).not.toThrow();
  });
});

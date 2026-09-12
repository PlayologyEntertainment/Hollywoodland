export interface AnalyticsEvent {
  readonly name: 'session_started' | 'foundation_entered' | 'settings_changed';
  readonly properties?: Readonly<Record<string, string | number | boolean>>;
}

export interface AnalyticsClient {
  track(event: AnalyticsEvent): void;
}

export class NoOpAnalyticsClient implements AnalyticsClient {
  public track(_event: AnalyticsEvent): void {
    // The approved provider is unresolved. The boundary intentionally transmits nothing.
  }
}

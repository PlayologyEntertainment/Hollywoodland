export interface IdentifiedContent {
  readonly id: string;
}

export function validateContent<T extends IdentifiedContent>(items: readonly T[], label: string): void {
  const seenIds = new Set<string>();
  for (const item of items) {
    if (typeof item.id !== 'string' || item.id.length === 0) {
      throw new Error(`${label} contains an entry with a missing or empty id.`);
    }
    if (seenIds.has(item.id)) {
      throw new Error(`${label} contains a duplicate id: "${item.id}".`);
    }
    seenIds.add(item.id);
  }
}

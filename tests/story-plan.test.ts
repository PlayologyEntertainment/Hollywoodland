// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

interface Beat { id: string; title: string; status: string; cast: string[]; locations: string[]; links: { quests: string[]; dialogue: string[]; assignments: string[] } }
interface Arc { id: string; title: string; status: string; beats: Beat[] }
interface Chapter { id: string; title: string; status: string; arcs: Arc[]; targets?: Record<string, string> }
interface Plan { chapters: Chapter[]; planned: { cast: Array<{ id: string; name: string; debut: string }>; locations: Array<{ id: string; name: string }> } }
interface Snapshot {
  quests: Array<{ id: string }>;
  dialogue: Array<{ id: string }>;
  cast: { characters: Array<{ id: string }>; locations: Array<{ id: string }> };
  other: { assignments: Array<{ id: string }> };
}

const dir = new URL('../tools/story-planner/data/', import.meta.url);
const readJson = <T,>(name: string): T => JSON.parse(readFileSync(new URL(name, dir), 'utf8') as string) as T;
const plan = readJson<Plan>('story-plan.json');
const snapshot = readJson<Snapshot>('narrative-snapshot.json');

const STATUSES = ['idea', 'outlined', 'drafted', 'in-game'];
const beats = plan.chapters.flatMap((chapter) => chapter.arcs.flatMap((arc) => arc.beats));

/** The story plan (tools/story-planner) is hand-edited in the tool, so nothing else guards it: these catch a typo in an id. */
describe('the story plan', () => {
  it('has ten chapters in order, each with storylines', () => {
    expect(plan.chapters).toHaveLength(10);
    plan.chapters.forEach((chapter, index) => {
      expect(chapter.title, chapter.id).toMatch(new RegExp(`^Chapter ${index + 1} - `));
      expect(chapter.arcs.length, chapter.id).toBeGreaterThan(0);
    });
  });

  it('uses unique ids and known statuses throughout', () => {
    const ids = [...plan.chapters.map((c) => c.id), ...plan.chapters.flatMap((c) => c.arcs.map((a) => a.id)), ...beats.map((b) => b.id)];
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of [...plan.chapters, ...plan.chapters.flatMap((c) => c.arcs), ...beats]) expect(STATUSES, item.id).toContain(item.status);
  });

  it('points every beat only at cast, places, quests, dialogue and assignments that exist in the game or are planned', () => {
    const cast = new Set([...snapshot.cast.characters.map((c) => c.id), ...plan.planned.cast.map((c) => c.id)]);
    const places = new Set([...snapshot.cast.locations.map((l) => l.id), ...plan.planned.locations.map((l) => l.id)]);
    const quests = new Set(snapshot.quests.map((q) => q.id));
    const dialogue = new Set(snapshot.dialogue.map((g) => g.id));
    const assignments = new Set(snapshot.other.assignments.map((a) => a.id));
    for (const beat of beats) {
      for (const id of beat.cast) expect(cast.has(id), `${beat.id} cast ${id}`).toBe(true);
      for (const id of beat.locations) expect(places.has(id), `${beat.id} place ${id}`).toBe(true);
      for (const id of beat.links.quests) expect(quests.has(id), `${beat.id} quest ${id}`).toBe(true);
      for (const id of beat.links.dialogue) expect(dialogue.has(id), `${beat.id} dialogue ${id}`).toBe(true);
      for (const id of beat.links.assignments) expect(assignments.has(id), `${beat.id} assignment ${id}`).toBe(true);
    }
  });

  it('uses every planned character and place in at least one beat, and introduces none before its debut chapter', () => {
    for (const planned of plan.planned.cast) {
      const uses = plan.chapters.flatMap((chapter, index) => chapter.arcs.flatMap((arc) => arc.beats.filter((b) => b.cast.includes(planned.id)).map(() => index + 1)));
      expect(uses.length, planned.name).toBeGreaterThan(0);
      expect(Math.min(...uses), `${planned.name} appears before debut ${planned.debut}`).toBeGreaterThanOrEqual(Number(planned.debut));
    }
    for (const place of plan.planned.locations) expect(beats.some((b) => b.locations.includes(place.id)), place.name).toBe(true);
  });

  it('gives every new chapter a level and reputation target at its start', () => {
    for (const chapter of plan.chapters) {
      expect(chapter.targets?.['level'], chapter.id).toBeTruthy();
      expect(chapter.targets?.['reputation'], chapter.id).toBeTruthy();
    }
  });

  it('keeps every Chapter 2 beat tied to real content and every later beat as a plan only', () => {
    plan.chapters.forEach((chapter, index) => {
      for (const beat of chapter.arcs.flatMap((arc) => arc.beats)) {
        if (index === 0) continue;
        if (index === 1) {
          expect(beat.status, beat.id).toBe('in-game');
          expect(beat.links.quests.length, beat.id).toBeGreaterThan(0);
          expect(beat.links.dialogue.length, beat.id).toBeGreaterThan(0);
          continue;
        }
        expect(beat.status, beat.id).toBe('idea');
        expect(beat.links.quests.length + beat.links.dialogue.length, beat.id).toBe(0);
      }
    });
  });
});

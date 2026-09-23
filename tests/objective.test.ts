// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  chooseObjective,
  IDLE_OBJECTIVE,
  isObjectiveAccomplished,
  OBJECTIVE_COMPLETE_MS,
  ObjectiveTracker,
  type Objective,
} from '../src/app/Objective';
import { createDefaultCareerState, type CareerState } from '../src/domain/CareerState';
import { ALL_ITEMS } from '../src/domain/InventoryDefinitions';
import { ALL_QUESTS } from '../src/domain/QuestDefinitions';
import { completeQuestStage, startQuest, type QuestDef } from '../src/domain/Quests';
import { ALL_RELATIONSHIP_CHARACTERS } from '../src/domain/RelationshipDefinitions';

const read = (path: string): string => (readFileSync(new URL(path, import.meta.url), 'utf8') as string).replace(/\r\n/g, '\n');
const css = read('../src/styles.css');
const indexHtml = read('../index.html');
const appShell = read('../src/app/AppShell.ts');

const quest = (id: string) => ALL_QUESTS.find((candidate) => candidate.id === id) as QuestDef;
const choose = (state: CareerState): Objective => chooseObjective(state, ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_ITEMS);
const start = (state: CareerState, id: string): CareerState => startQuest(state, quest(id), ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_ITEMS);
const complete = (state: CareerState, id: string, stageId: string): CareerState => completeQuestStage(state, quest(id), stageId, ALL_ITEMS);
const accomplished = (objective: Objective, state: CareerState): boolean => isObjectiveAccomplished(objective, state, ALL_QUESTS);

describe('chooseObjective', () => {
  it('starts a new career on the top open quest: First Audition, with its first goal', () => {
    expect(choose(createDefaultCareerState())).toEqual({
      kind: 'quest',
      questId: 'first-audition',
      stageId: 'booked',
      title: 'First Audition',
      goal: 'Book an audition at the casting office.',
    });
  });

  it('follows a quest that is in progress, showing its current goal', () => {
    let state = start(createDefaultCareerState(), 'first-audition');
    state = complete(state, 'first-audition', 'booked');
    expect(choose(state)).toMatchObject({ questId: 'first-audition', stageId: 'callback', goal: 'Follow up on the audition.' });
  });

  it('prefers a quest in progress over an unstarted quest above it', () => {
    // First Audition is the top open quest, but Diner Introductions is the one under way.
    let state = start(createDefaultCareerState(), 'diner-introductions');
    state = complete(state, 'diner-introductions', 'introduced');
    expect(choose(state)).toMatchObject({ questId: 'diner-introductions', title: 'Diner Introductions' });
  });

  it('takes the first in-progress quest in the game\'s quest order when several are under way', () => {
    let state = start(createDefaultCareerState(), 'making-rent');
    state = complete(state, 'making-rent', 'first-payment');
    state = start(state, 'diner-introductions');
    state = complete(state, 'diner-introductions', 'introduced');
    // Diner Introductions comes before Making Rent in ALL_QUESTS.
    expect(choose(state).questId).toBe('diner-introductions');
  });

  it('moves on to the next open quest when the one it follows is completed', () => {
    let state = start(createDefaultCareerState(), 'first-audition');
    state = complete(state, 'first-audition', 'booked');
    state = complete(state, 'first-audition', 'callback');
    // Nothing is in progress now, so it is the top open quest: Screen Test is locked, so Diner Introductions.
    expect(choose(state)).toMatchObject({ questId: 'diner-introductions', goal: 'Introduce yourself at the counter.' });
  });

  it('says all caught up when nothing is open', () => {
    const only: QuestDef = { id: 'only', title: 'Only', summary: '', stages: [{ id: 'a', description: 'Do it.' }] };
    let state = startQuest(createDefaultCareerState(), only, [only], []);
    state = completeQuestStage(state, only, 'a');
    expect(chooseObjective(state, [only], [], [])).toEqual(IDLE_OBJECTIVE);
    expect(IDLE_OBJECTIVE).toMatchObject({ kind: 'idle', title: 'All caught up', goal: 'Explore the Boulevard' });
  });

  it('says all caught up when there are no quests at all', () => {
    expect(chooseObjective(createDefaultCareerState(), [], [], [])).toEqual(IDLE_OBJECTIVE);
  });
});

describe('isObjectiveAccomplished', () => {
  const booked = (): Objective => choose(createDefaultCareerState());

  it('is not accomplished before anything happens, or by merely starting the quest', () => {
    expect(accomplished(booked(), createDefaultCareerState())).toBe(false);
    expect(accomplished(booked(), start(createDefaultCareerState(), 'first-audition'))).toBe(false);
  });

  it('is accomplished when the stage it showed is completed, even though the quest goes on', () => {
    let state = start(createDefaultCareerState(), 'first-audition');
    state = complete(state, 'first-audition', 'booked');
    expect(accomplished(booked(), state)).toBe(true);
  });

  it('is accomplished when the last stage completes the whole quest', () => {
    let state = start(createDefaultCareerState(), 'first-audition');
    state = complete(state, 'first-audition', 'booked');
    const callback = choose(state);
    state = complete(state, 'first-audition', 'callback');
    expect(accomplished(callback, state)).toBe(true);
  });

  it('is not accomplished for the idle message, or for a quest that is not there', () => {
    expect(accomplished(IDLE_OBJECTIVE, createDefaultCareerState())).toBe(false);
    expect(accomplished({ ...booked(), questId: 'no-such-quest' }, createDefaultCareerState())).toBe(false);
    expect(accomplished({ ...booked(), stageId: 'no-such-stage' }, createDefaultCareerState())).toBe(false);
  });
});

describe('ObjectiveTracker', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function make() {
    const shown: string[] = [];
    const said: string[] = [];
    const tracker = new ObjectiveTracker(
      { show: (objective, done) => shown.push(`${done ? 'DONE ' : ''}${objective.title}: ${objective.goal}`) },
      choose,
      accomplished,
      (message) => said.push(message),
    );
    return { tracker, shown, said };
  }

  const afterBooking = (): CareerState => complete(start(createDefaultCareerState(), 'first-audition'), 'first-audition', 'booked');

  it('shows the current objective the first time, and does not redraw while it is unchanged', () => {
    const { tracker, shown } = make();
    const state = createDefaultCareerState();
    tracker.update(state);
    tracker.update(state);
    tracker.update({ ...state });
    expect(shown).toEqual(['First Audition: Book an audition at the casting office.']);
  });

  it('holds the finished goal in green when it is accomplished, then moves to the next goal', () => {
    const { tracker, shown, said } = make();
    tracker.update(createDefaultCareerState());
    tracker.update(afterBooking());
    expect(shown.at(-1)).toBe('DONE First Audition: Book an audition at the casting office.');
    expect(said.at(-1)).toBe('Objective complete: Book an audition at the casting office.');
    // Still holding it just before the beat is over...
    vi.advanceTimersByTime(OBJECTIVE_COMPLETE_MS - 1);
    expect(shown.at(-1)).toContain('DONE');
    // ...and on to the next goal when it ends.
    vi.advanceTimersByTime(1);
    expect(shown.at(-1)).toBe('First Audition: Follow up on the audition.');
    expect(said.at(-1)).toBe('New objective: Follow up on the audition.');
  });

  it('keeps the card steady during the beat, then applies the latest state, not a queue of beats', () => {
    const { tracker, shown } = make();
    tracker.update(createDefaultCareerState());
    tracker.update(afterBooking());
    // While the green beat is showing, the rest of the quest is finished too.
    tracker.update(complete(afterBooking(), 'first-audition', 'callback'));
    expect(shown.filter((line) => line.startsWith('DONE'))).toHaveLength(1);
    vi.advanceTimersByTime(OBJECTIVE_COMPLETE_MS);
    // Straight to what is open now (First Audition is complete), with no second beat.
    expect(shown.at(-1)).toBe('Diner Introductions: Introduce yourself at the counter.');
    expect(shown.filter((line) => line.startsWith('DONE'))).toHaveLength(1);
  });

  it('plays another beat for the next goal when it is accomplished later', () => {
    const { tracker, shown } = make();
    tracker.update(createDefaultCareerState());
    tracker.update(afterBooking());
    vi.advanceTimersByTime(OBJECTIVE_COMPLETE_MS);
    tracker.update(complete(afterBooking(), 'first-audition', 'callback'));
    expect(shown.at(-1)).toBe('DONE First Audition: Follow up on the audition.');
  });

  it('ends on the all-caught-up message when the last quest is finished, and says so', () => {
    const only: QuestDef = { id: 'only', title: 'Only', summary: '', stages: [{ id: 'a', description: 'Do it.' }] };
    const shown: string[] = [];
    const said: string[] = [];
    const tracker = new ObjectiveTracker(
      { show: (objective, done) => shown.push(`${done ? 'DONE ' : ''}${objective.title}: ${objective.goal}`) },
      (state) => chooseObjective(state, [only], [], []),
      (objective, state) => isObjectiveAccomplished(objective, state, [only]),
      (message) => said.push(message),
    );
    const begun = startQuest(createDefaultCareerState(), only, [only], []);
    tracker.update(begun);
    tracker.update(completeQuestStage(begun, only, 'a'));
    vi.advanceTimersByTime(OBJECTIVE_COMPLETE_MS);
    expect(shown).toEqual(['Only: Do it.', 'DONE Only: Do it.', 'All caught up: Explore the Boulevard']);
    expect(said.at(-1)).toBe('All caught up. Explore the Boulevard');
  });

  it('switches at once, with no beat, when the objective changes for a reason other than finishing its goal', () => {
    const { tracker, shown } = make();
    tracker.update(createDefaultCareerState());
    // Another quest is started and moves ahead: it becomes the one in progress, and First Audition (unstarted) is not "done".
    let state = start(createDefaultCareerState(), 'diner-introductions');
    state = complete(state, 'diner-introductions', 'introduced');
    tracker.update(state);
    expect(shown.at(-1)).toBe(`Diner Introductions: ${choose(state).goal}`);
    expect(shown.some((line) => line.startsWith('DONE'))).toBe(false);
  });

  it('forgets everything on reset, so a save further along than the last game plays no beat', () => {
    const { tracker, shown } = make();
    tracker.update(createDefaultCareerState());
    tracker.reset();
    tracker.update(afterBooking());
    expect(shown.at(-1)).toBe('First Audition: Follow up on the audition.');
    expect(shown.some((line) => line.startsWith('DONE'))).toBe(false);
  });

  describe('while a conversation covers the card', () => {
    function makeCovered() {
      const shown: string[] = [];
      let covered = false;
      const tracker = new ObjectiveTracker(
        { show: (objective, done) => shown.push(`${done ? 'DONE ' : ''}${objective.title}: ${objective.goal}`) },
        choose,
        accomplished,
        undefined,
        OBJECTIVE_COMPLETE_MS,
        () => covered,
      );
      return { tracker, shown, cover: (value: boolean) => { covered = value; } };
    }

    it('goes green at once, but does not start the beat until the conversation closes', () => {
      const { tracker, shown, cover } = makeCovered();
      tracker.update(createDefaultCareerState());
      cover(true);
      tracker.update(afterBooking());
      expect(shown.at(-1)).toBe('DONE First Audition: Book an audition at the casting office.');
      // A long farewell: the card stays green however long it takes, with updates arriving all the while.
      for (let i = 0; i < 40; i += 1) {
        vi.advanceTimersByTime(250);
        tracker.update(afterBooking());
      }
      expect(shown.at(-1)).toContain('DONE');
      expect(vi.getTimerCount()).toBe(0);
    });

    it('plays the whole beat from the moment the conversation closes, then moves on', () => {
      const { tracker, shown, cover } = makeCovered();
      tracker.update(createDefaultCareerState());
      cover(true);
      tracker.update(afterBooking());
      vi.advanceTimersByTime(10_000);
      cover(false);
      // The next update after it closes starts the clock.
      tracker.update(afterBooking());
      vi.advanceTimersByTime(OBJECTIVE_COMPLETE_MS - 1);
      expect(shown.at(-1)).toContain('DONE');
      vi.advanceTimersByTime(1);
      expect(shown.at(-1)).toBe('First Audition: Follow up on the audition.');
    });

    it('starts the beat straight away when nothing covers the card', () => {
      const { tracker } = makeCovered();
      tracker.update(createDefaultCareerState());
      tracker.update(afterBooking());
      expect(vi.getTimerCount()).toBe(1);
    });
  });

  it('cancels a beat that is in progress when reset', () => {
    const { tracker, shown } = make();
    tracker.update(createDefaultCareerState());
    tracker.update(afterBooking());
    tracker.reset();
    vi.advanceTimersByTime(OBJECTIVE_COMPLETE_MS * 2);
    expect(shown.at(-1)).toContain('DONE');
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('the Objective card in the app', () => {
  it('has a title line and a goal headline the tracker fills, above the unchanged controls line', () => {
    const card = indexHtml.match(/<div id="objective-card"[\s\S]*?<\/div>/)?.[0] ?? '';
    expect(card).toContain('id="objective-title"');
    expect(card).toContain('id="objective-goal"');
    expect(card).toContain('<kbd>A</kbd>/<kbd>D</kbd> Move · <kbd>E</kbd> Interact');
    expect(card.indexOf('objective-title')).toBeLessThan(card.indexOf('objective-goal'));
    expect(card.indexOf('objective-goal')).toBeLessThan(card.indexOf('<small>'));
  });

  it('starts with the right words for a new career, before the tracker has run', () => {
    expect(indexHtml).toMatch(/id="objective-title" class="eyebrow">First Audition</);
    expect(indexHtml).toContain('id="objective-goal">Book an audition at the casting office.</strong>');
  });

  it('is updated whenever the career changes, and forgets the last game when a whole career is loaded', () => {
    expect(appShell).toMatch(/private renderCareerState\(state: CareerState\): void \{\s*this\.objectives\.update\(state\);/);
    expect(appShell).toMatch(/private loadCareerState\(state: CareerState\): void \{\s*this\.objectives\.reset\(\);\s*this\.renderCareerState\(state\);/);
    // Every way of loading a whole career goes through it: Start, and resumeCareer (shared by Continue and a
    // Save Options slot's Load button — Import itself only stores a new slot now, it doesn't load one).
    expect(appShell.match(/this\.loadCareerState\(state\)/g)).toHaveLength(2);
    expect(appShell).not.toMatch(/if \(state !== undefined\) this\.renderCareerState\(state\)/);
  });

  it('tells screen readers about a completed goal and the next one, through the existing live region', () => {
    expect(appShell).toContain('(message) => this.announce(message)');
  });

  it('waits for a conversation, an audition or the Home Menu to close before it starts the green beat', () => {
    expect(appShell).toMatch(/\['#interaction-dialog', '#home-hub-dialog', '#audition-dialog'\]\.some\(\(selector\) => assertElement\(selector, HTMLDialogElement\)\.open\)/);
  });

  it('turns green for a completed goal, with a tick that has empty alt text, and eases the edge colour', () => {
    const block = css.match(/\n\.objective-card\.objective-complete \{([^}]*)\}/)?.[1] ?? '';
    expect(block).toContain('border-left-color: rgb(var(--complete-rgb))');
    expect(block).toContain('linear-gradient(90deg, rgb(10 24 15 / 90%)');
    expect(css).toMatch(/\.objective-card\.objective-complete strong, \.objective-card\.objective-complete \.eyebrow \{[^}]*color: rgb\(var\(--complete-rgb\)\)/);
    expect(css).toMatch(/\.objective-card\.objective-complete strong::before \{[^}]*content: '\\2713' \/ '';/);
    expect(css).toContain('.objective-card { transition: border-color .4s ease; }');
  });
});

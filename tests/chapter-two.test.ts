import { describe, expect, it } from 'vitest';

import { createDefaultCareerState, type CareerState } from '../src/domain/CareerState';
import {
  CHAPTER_ONE_CONCLUDED_FACT,
  CHAPTER_TWO_CONCLUDED_FACT,
  CHAPTER_TWO_STARTED_FACT,
  chapterCardFact,
  isChapterComplete,
  nextChapterCard,
} from '../src/domain/Chapters';
import {
  applyDialogueChoiceById,
  getDialogueEntryNodeId,
  getDialogueNode,
  isChoiceAvailable,
  type DialogueChoice,
  type DialogueGraph,
} from '../src/domain/Dialogue';
import {
  CASTING_OFFICE_DIALOGUE,
  CELESTIAL_PALACE_DIALOGUE,
  COSTUME_SHOP_DIALOGUE,
  DIALOGUE_GRAPHS,
  DINER_DIALOGUE,
  KLIEG_LIGHT_DIALOGUE,
  LANDLADY_DIALOGUE,
  PRODUCTION_COORDINATOR_DIALOGUE,
  RIVAL_DIALOGUE,
  SCENE_PARTNER_DIALOGUE,
} from '../src/domain/DialogueGraphs';
import { ALL_ITEMS } from '../src/domain/InventoryDefinitions';
import { ALL_AUDITION_OUTCOMES, applyAuditionOutcome, resolveAudition, type AuditionChoices, type AuditionOutcome } from '../src/domain/Performance';
import { LOOKOUT_FIRST_DAY_AUDITION } from '../src/domain/PerformanceDefinitions';
import { ALL_QUESTS } from '../src/domain/QuestDefinitions';
import { getQuestStatus, questChapter } from '../src/domain/Quests';
import { ALL_RELATIONSHIP_CHARACTERS } from '../src/domain/RelationshipDefinitions';

const roster = ALL_RELATIONSHIP_CHARACTERS;
const questById = (id: string) => ALL_QUESTS.find((quest) => quest.id === id)!;
const status = (state: CareerState, id: string) => getQuestStatus(state, questById(id), ALL_QUESTS, roster, ALL_ITEMS);

/** A career that has read the Chapter 1 Conclusion and the Chapter 2 title page, with a given screen-test result. */
function chapterTwoCareer(screenTest: AuditionOutcome = 'breakthrough'): CareerState {
  const base = createDefaultCareerState();
  return {
    ...base,
    facts: { ...base.facts, [CHAPTER_ONE_CONCLUDED_FACT]: true, [CHAPTER_TWO_STARTED_FACT]: true, [`screen-test:outcome:${screenTest}`]: true },
  };
}

function pick(state: CareerState, graph: DialogueGraph, nodeId: string, choiceId: string): CareerState {
  const choice = getDialogueNode(graph, nodeId)?.choices.find((candidate) => candidate.id === choiceId);
  expect(choice, `${graph.id}/${nodeId}/${choiceId} exists`).toBeDefined();
  expect(isChoiceAvailable(state, choice as DialogueChoice, ALL_QUESTS, roster, ALL_ITEMS), `${graph.id}/${nodeId}/${choiceId} is available`).toBe(true);
  return applyDialogueChoiceById(state, graph, nodeId, choiceId, ALL_QUESTS, roster, ALL_ITEMS);
}

function available(state: CareerState, graph: DialogueGraph, nodeId: string, choiceId: string): boolean {
  const choice = getDialogueNode(graph, nodeId)?.choices.find((candidate) => candidate.id === choiceId);
  return choice !== undefined && isChoiceAvailable(state, choice, ALL_QUESTS, roster, ALL_ITEMS);
}

/** Plays Read the Room's first-day scene with the given answers and applies the result, as the audition dialog does. */
function playFirstDay(state: CareerState, choices: AuditionChoices): { state: CareerState; outcome: AuditionOutcome } {
  const result = resolveAudition(state, LOOKOUT_FIRST_DAY_AUDITION, choices, roster, ALL_ITEMS);
  return { state: applyAuditionOutcome(state, LOOKOUT_FIRST_DAY_AUDITION, result, roster), outcome: result.outcome };
}

const BEST_TAKE: AuditionChoices = {
  intention: 'intention-genuine-warning',
  delivery: 'delivery-low-and-quick',
  blocking: 'blocking-trust-the-mark',
  improvisation: 'improv-cover-the-flub',
  adaptation: 'adapt-take-the-blame',
};
const WORST_TAKE: AuditionChoices = {
  intention: 'intention-steal-the-scene',
  delivery: 'delivery-to-the-back-row',
  blocking: 'blocking-play-it-safe',
  improvisation: 'improv-overreach',
  adaptation: 'adapt-freeze',
};

describe('Chapter 2 quests', () => {
  const chapterTwo = ALL_QUESTS.filter((quest) => questChapter(quest) === 2);

  it('are eight quests, and every one waits on the Chapter 2 title page', () => {
    expect(chapterTwo.map((quest) => quest.id)).toEqual([
      'the-lookout',
      'harbor-market-wardrobe',
      'first-day-on-set',
      'a-week-of-rehearsals',
      'the-wrap-party',
      'delphines-warning',
      'the-helpful-man',
      'under-the-stars',
    ]);
    const beforeTheTitlePage: CareerState = { ...chapterTwoCareer(), facts: { [CHAPTER_ONE_CONCLUDED_FACT]: true } };
    for (const quest of chapterTwo) expect(status(beforeTheTitlePage, quest.id), quest.id).toBe('locked');
    expect(status(chapterTwoCareer(), 'the-lookout')).toBe('available');
  });

  it('keep every Chapter 1 quest in Chapter 1', () => {
    expect(ALL_QUESTS.filter((quest) => questChapter(quest) === 1)).toHaveLength(10);
  });
});

describe('the chapter cards', () => {
  const allOne = (state: CareerState): CareerState => {
    let current = state;
    for (const quest of ALL_QUESTS.filter((candidate) => questChapter(candidate) === 1)) {
      current = {
        ...current,
        facts: {
          ...current.facts,
          [`quest:${quest.id}:started`]: true,
          ...Object.fromEntries(quest.stages.map((stage) => [`quest:${quest.id}:stage:${stage.id}:complete`, true])),
        },
      };
    }
    return current;
  };

  it('follow the Chapter 1 Conclusion with the Chapter 2 opening, then wait for Chapter 2 to be done', () => {
    let state = allOne(createDefaultCareerState());
    expect(nextChapterCard(state, ALL_QUESTS, roster, ALL_ITEMS)).toEqual({ kind: 'conclusion', chapter: 1 });
    state = { ...state, facts: { ...state.facts, [chapterCardFact({ kind: 'conclusion', chapter: 1 }) as string]: true } };
    expect(nextChapterCard(state, ALL_QUESTS, roster, ALL_ITEMS)).toEqual({ kind: 'opening', chapter: 2 });
    state = { ...state, facts: { ...state.facts, [chapterCardFact({ kind: 'opening', chapter: 2 }) as string]: true } };
    expect(nextChapterCard(state, ALL_QUESTS, roster, ALL_ITEMS)).toBeUndefined();
  });

  it('owe nothing to a new career, and open Chapter 2 for a Chapter 1 career saved before it existed', () => {
    expect(nextChapterCard(createDefaultCareerState(), ALL_QUESTS, roster, ALL_ITEMS)).toBeUndefined();
    const saved = { ...createDefaultCareerState(), facts: { [CHAPTER_ONE_CONCLUDED_FACT]: true } };
    expect(nextChapterCard(saved, ALL_QUESTS, roster, ALL_ITEMS)).toEqual({ kind: 'opening', chapter: 2 });
  });

  it('are remembered as facts, and a chapter with no card leaves none', () => {
    expect(chapterCardFact({ kind: 'conclusion', chapter: 2 })).toBe(CHAPTER_TWO_CONCLUDED_FACT);
    expect(chapterCardFact({ kind: 'opening', chapter: 2 })).toBe(CHAPTER_TWO_STARTED_FACT);
    expect(chapterCardFact({ kind: 'opening', chapter: 3 })).toBeUndefined();
  });
});

describe('Chapter 2 dialogue entry', () => {
  it('opens every place on its Chapter 1 root until the Chapter 2 title page has been read, then on its Chapter 2 hub', () => {
    const before = createDefaultCareerState();
    const after = chapterTwoCareer();
    for (const graph of Object.values(DIALOGUE_GRAPHS)) {
      expect(getDialogueEntryNodeId(before, graph, ALL_QUESTS, roster, ALL_ITEMS), graph.id).toBe('root');
      expect(getDialogueEntryNodeId(after, graph, ALL_QUESTS, roster, ALL_ITEMS), graph.id).toBe('c2-root');
    }
  });

  it('gives every hub a way back to the Chapter 1 conversation and a way out', () => {
    for (const graph of Object.values(DIALOGUE_GRAPHS)) {
      const hub = getDialogueNode(graph, 'c2-root');
      expect(hub?.choices.find((choice) => choice.next === 'root'), graph.id).toBeDefined();
      expect(hub?.choices.find((choice) => choice.next === null), graph.id).toBeDefined();
    }
  });
});

describe('Chapter 2 from start to finish', () => {
  it('can be played through every quest, in order, to a Conclusion', () => {
    let state = chapterTwoCareer('breakthrough');

    // The Lookout: the verdict, then the call time.
    state = pick(state, CASTING_OFFICE_DIALOGUE, 'c2-verdict-breakthrough', 'take-the-part');
    expect(state.facts['lookout:fourth-line']).toBe(true);
    expect(state.inventory.ownedItemIds['lookout-sides']).toBe(true);
    state = pick(state, PRODUCTION_COORDINATOR_DIALOGUE, 'c2-root', 'get-your-call-time');
    expect(status(state, 'the-lookout')).toBe('completed');

    // The wardrobe.
    state = pick(state, COSTUME_SHOP_DIALOGUE, 'c2-fitting', 'wear-it-practical');
    expect(status(state, 'harbor-market-wardrobe')).toBe('completed');
    expect(state.inventory.ownedItemIds['lookout-costume']).toBe(true);

    // The first day: report, shoot, see it out.
    state = pick(state, SCENE_PARTNER_DIALOGUE, 'c2-root', 'report-for-the-shot');
    expect(available(state, SCENE_PARTNER_DIALOGUE, 'c2-root', 'run-the-scene-again')).toBe(true);
    const day = playFirstDay(state, BEST_TAKE);
    state = day.state;
    expect(state.facts['first-day:done']).toBe(true);
    expect(available(state, SCENE_PARTNER_DIALOGUE, 'c2-root', 'run-the-scene-again')).toBe(false);
    state = pick(state, SCENE_PARTNER_DIALOGUE, 'c2-root', `see-the-day-out-${day.outcome}`);
    expect(status(state, 'first-day-on-set')).toBe('completed');
    expect(state.inventory.ownedItemIds['first-screen-credit']).toBe(true);

    // Whispers open and the rehearsals begin.
    for (const id of ['delphines-warning', 'the-helpful-man', 'a-week-of-rehearsals']) expect(status(state, id), id).toBe('available');
    expect(status(state, 'the-wrap-party')).toBe('locked');
    expect(status(state, 'under-the-stars')).toBe('locked');

    // Two evenings, with two different people.
    state = pick(state, SCENE_PARTNER_DIALOGUE, 'c2-evening-corinne', 'corinne-be-candid');
    expect(status(state, 'a-week-of-rehearsals')).toBe('active');
    expect(available(state, SCENE_PARTNER_DIALOGUE, 'c2-root', 'another-evening-corinne')).toBe(false);
    state = pick(state, DINER_DIALOGUE, 'c2-evening-frankie', 'frankie-keep-it-light');
    expect(status(state, 'a-week-of-rehearsals')).toBe('completed');
    expect(available(state, SCENE_PARTNER_DIALOGUE, 'c2-root', 'another-evening-theo')).toBe(false);

    // The wrap party.
    expect(status(state, 'the-wrap-party')).toBe('available');
    state = pick(state, CELESTIAL_PALACE_DIALOGUE, 'c2-wrap-party', 'dance-with-theo');
    expect(state.facts['love-interest:theo']).toBe(true);
    expect(status(state, 'the-wrap-party')).toBe('completed');
    expect(state.inventory.ownedItemIds['wrap-party-ribbon']).toBe(true);

    // Delphine's warning.
    state = pick(state, RIVAL_DIALOGUE, 'c2-delphine-warning', 'offer-a-truce');
    expect(state.facts['delphine-path:truce']).toBe(true);
    expect(status(state, 'delphines-warning')).toBe('completed');

    // The helpful man, then the newsman.
    state = pick(state, SCENE_PARTNER_DIALOGUE, 'c2-pike-offer', 'accept-his-help');
    expect(state.facts['ledger:pike-help']).toBe(true);
    expect(state.inventory.ownedItemIds['publicity-card']).toBe(true);
    expect(available(state, KLIEG_LIGHT_DIALOGUE, 'c2-root', 'trade-with-the-newsman-knowing')).toBe(true);
    expect(available(state, KLIEG_LIGHT_DIALOGUE, 'c2-root', 'trade-with-the-newsman')).toBe(false);
    state = pick(state, KLIEG_LIGHT_DIALOGUE, 'c2-nick-trade-knowing', 'keep-it-off-the-record');
    expect(status(state, 'the-helpful-man')).toBe('completed');

    // Under the stars: the invitation, then something to wear.
    expect(status(state, 'under-the-stars')).toBe('available');
    state = pick(state, PRODUCTION_COORDINATOR_DIALOGUE, 'c2-veteran-invitation', 'accept-the-tickets');
    state = pick(state, LANDLADY_DIALOGUE, 'c2-outfit', 'owe-her-one');
    expect(status(state, 'under-the-stars')).toBe('completed');

    // All eight are done: the Conclusion is owed, and the chapter after it is not built.
    expect(isChapterComplete(2, state, ALL_QUESTS, roster, ALL_ITEMS)).toBe(true);
    expect(nextChapterCard(state, ALL_QUESTS, roster, ALL_ITEMS)).toEqual({ kind: 'conclusion', chapter: 2 });
  });

  it('lets a player refuse every favor and choose no one, and still finish', () => {
    let state = chapterTwoCareer('memorable-setback');
    state = pick(state, CASTING_OFFICE_DIALOGUE, 'c2-verdict-setback', 'push-anyway');
    state = pick(state, PRODUCTION_COORDINATOR_DIALOGUE, 'c2-root', 'get-your-call-time');
    state = pick(state, COSTUME_SHOP_DIALOGUE, 'c2-fitting', 'wear-it-borrowed');
    state = pick(state, SCENE_PARTNER_DIALOGUE, 'c2-root', 'report-for-the-shot');
    const day = playFirstDay(state, WORST_TAKE);
    expect(day.outcome).toBe('memorable-setback');
    state = pick(day.state, SCENE_PARTNER_DIALOGUE, 'c2-root', 'see-the-day-out-memorable-setback');
    expect(status(state, 'first-day-on-set')).toBe('completed');
    state = pick(state, SCENE_PARTNER_DIALOGUE, 'c2-evening-theo', 'theo-keep-it-light');
    state = pick(state, RIVAL_DIALOGUE, 'c2-evening-delphine', 'delphine-keep-it-light');
    state = pick(state, CELESTIAL_PALACE_DIALOGUE, 'c2-wrap-party', 'dance-with-everyone');
    expect(state.facts['love-interest:none']).toBe(true);
    state = pick(state, RIVAL_DIALOGUE, 'c2-delphine-warning', 'match-her-edge');
    state = pick(state, SCENE_PARTNER_DIALOGUE, 'c2-pike-offer', 'refuse-politely');
    expect(state.facts['ledger:pike-help']).toBeUndefined();
    state = pick(state, KLIEG_LIGHT_DIALOGUE, 'c2-nick-trade', 'keep-it-off-the-record');
    state = pick(state, PRODUCTION_COORDINATOR_DIALOGUE, 'c2-veteran-invitation', 'accept-the-tickets');
    state = pick(state, LANDLADY_DIALOGUE, 'c2-outfit', 'owe-her-one');
    expect(isChapterComplete(2, state, ALL_QUESTS, roster, ALL_ITEMS)).toBe(true);
  });

  it('lets the same person be spent only one evening, and only while the rehearsals are open', () => {
    let state = chapterTwoCareer();
    state = { ...state, facts: { ...state.facts, 'quest:first-day-on-set:started': true, 'quest:first-day-on-set:stage:report-to-set:complete': true, 'quest:first-day-on-set:stage:earn-your-credit:complete': true, 'quest:the-lookout:started': true, 'quest:the-lookout:stage:hear-the-verdict:complete': true, 'quest:the-lookout:stage:sign-the-call-sheet:complete': true, 'quest:harbor-market-wardrobe:started': true, 'quest:harbor-market-wardrobe:stage:fitted:complete': true } };
    expect(status(state, 'a-week-of-rehearsals')).toBe('available');
    expect(available(state, SCENE_PARTNER_DIALOGUE, 'c2-root', 'first-evening-corinne')).toBe(true);
    state = pick(state, SCENE_PARTNER_DIALOGUE, 'c2-evening-corinne', 'corinne-be-candid');
    expect(available(state, SCENE_PARTNER_DIALOGUE, 'c2-root', 'first-evening-corinne')).toBe(false);
    expect(available(state, SCENE_PARTNER_DIALOGUE, 'c2-root', 'another-evening-corinne')).toBe(false);
    expect(available(state, SCENE_PARTNER_DIALOGUE, 'c2-root', 'another-evening-theo')).toBe(true);
    state = pick(state, SCENE_PARTNER_DIALOGUE, 'c2-evening-theo', 'theo-be-candid');
    expect(status(state, 'a-week-of-rehearsals')).toBe('completed');
    expect(available(state, SCENE_PARTNER_DIALOGUE, 'c2-root', 'another-evening-theo')).toBe(false);
  });

  it('lets the verdict wording follow the screen test, and a talent earn a fourth line', () => {
    for (const outcome of ALL_AUDITION_OUTCOMES) {
      const state = chapterTwoCareer(outcome);
      const visible = getDialogueNode(CASTING_OFFICE_DIALOGUE, 'c2-root')?.choices.filter((choice) => choice.id.startsWith('ask-about-the-test') && isChoiceAvailable(state, choice, ALL_QUESTS, roster, ALL_ITEMS));
      expect(visible, outcome).toHaveLength(1);
    }
    const talented: CareerState = { ...chapterTwoCareer('promising-complication'), progression: { ...createDefaultCareerState().progression, unlockedTalentIds: { 'charm-1': true } } };
    const taken = pick(talented, CASTING_OFFICE_DIALOGUE, 'c2-verdict-promising', 'push-with-charm');
    expect(taken.facts['lookout:fourth-line']).toBe(true);
    const refused = pick(chapterTwoCareer('promising-complication'), CASTING_OFFICE_DIALOGUE, 'c2-verdict-promising', 'push-anyway');
    expect(refused.facts['lookout:fourth-line']).toBeUndefined();
    expect(status(refused, 'the-lookout')).toBe('active');
  });
});

describe('the first-day scene', () => {
  const states: CareerState[] = (() => {
    const base = chapterTwoCareer();
    const withItems: CareerState = { ...base, inventory: { ownedItemIds: { 'lookout-costume': true, 'lookout-sides': true } }, facts: { ...base.facts, 'lookout:fourth-line': true, 'lookout:costume:practical': true } };
    const trained: CareerState = { ...withItems, progression: { ...withItems.progression, unlockedTalentIds: { 'comedy-1': true, 'stagecraft-1': true, 'hustle-2': true, 'stagecraft-2': true } } };
    return [base, withItems, trained];
  })();

  it('can end in each of the four result families, so a bad day is never the only one on offer', () => {
    const reached = new Set<AuditionOutcome>();
    const categories = LOOKOUT_FIRST_DAY_AUDITION.categories;
    const walk = (index: number, chosen: Record<string, string>, state: CareerState): void => {
      if (index === categories.length) {
        reached.add(resolveAudition(state, LOOKOUT_FIRST_DAY_AUDITION, chosen, roster, ALL_ITEMS).outcome);
        return;
      }
      const category = categories[index]!;
      for (const option of category.options) walk(index + 1, { ...chosen, [category.kind]: option.id }, state);
    };
    for (const state of states) walk(0, {}, state);
    expect([...reached].sort()).toEqual([...ALL_AUDITION_OUTCOMES].sort());
  });

  it('leaves the credit stage reachable after every result family', () => {
    for (const outcome of ALL_AUDITION_OUTCOMES) {
      const effects = LOOKOUT_FIRST_DAY_AUDITION.outcomeEffects[outcome];
      expect(effects, outcome).toContainEqual({ kind: 'set-fact', fact: 'first-day:done' });
      expect(effects, outcome).toContainEqual({ kind: 'set-fact', fact: `first-day:outcome:${outcome}` });
    }
  });
});

describe('energy costs in Chapter 2 dialogue', () => {
  it('say so in the label, check for it and spend it, on every choice that names a cost', () => {
    const costed: string[] = [];
    for (const graph of Object.values(DIALOGUE_GRAPHS)) {
      for (const node of graph.nodes.filter((candidate) => candidate.id.startsWith('c2-'))) {
        for (const choice of node.choices) {
          const named = choice.label.includes('(-10 Energy)');
          const checks = (choice.conditions ?? []).some((condition) => condition.kind === 'resource-at-least' && condition.resource === 'energy' && condition.minimum === 10);
          const spends = (choice.effects ?? []).some((effect) => effect.kind === 'resource-delta' && effect.delta.energy === -10);
          expect(named, `${graph.id}/${node.id}/${choice.id} label`).toBe(spends);
          if (named) {
            costed.push(`${graph.id}/${choice.id}`);
            expect(checks, `${graph.id}/${node.id}/${choice.id} condition`).toBe(true);
          }
        }
      }
    }
    expect(costed.length).toBeGreaterThan(10);
  });

  it('turn a costed choice off for a player with no energy, and back on once they have rested', () => {
    const tired: CareerState = { ...chapterTwoCareer(), resources: { ...chapterTwoCareer().resources, energy: 0 } };
    expect(available(tired, CELESTIAL_PALACE_DIALOGUE, 'c2-wrap-party', 'dance-with-theo')).toBe(false);
    const rested: CareerState = { ...tired, resources: { ...tired.resources, energy: 100 } };
    expect(available(rested, CELESTIAL_PALACE_DIALOGUE, 'c2-wrap-party', 'dance-with-theo')).toBe(true);
  });
});

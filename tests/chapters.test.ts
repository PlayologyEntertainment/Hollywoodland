// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { createDefaultCareerState } from '../src/domain/CareerState';
import { CHAPTER_ONE_CONCLUDED_FACT, hasConcludedChapterOne, isChapterOneComplete } from '../src/domain/Chapters';
import { ALL_ITEMS } from '../src/domain/InventoryDefinitions';
import { ALL_QUESTS } from '../src/domain/QuestDefinitions';
import { completeQuestStage, startQuest, type QuestDef } from '../src/domain/Quests';
import { ALL_RELATIONSHIP_CHARACTERS } from '../src/domain/RelationshipDefinitions';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8') as string;
const indexHtml = read('../index.html');
const css = read('../src/styles.css');

describe('isChapterOneComplete', () => {
  const only: QuestDef = { id: 'only', title: 'Only', summary: '', stages: [{ id: 'a', description: 'Do it.' }] };
  const other: QuestDef = { id: 'other', title: 'Other', summary: '', stages: [{ id: 'b', description: 'Do that.' }] };

  it('is false until every quest is completed, and true after', () => {
    let state = createDefaultCareerState();
    expect(isChapterOneComplete(state, [only, other], [], [])).toBe(false);
    state = completeQuestStage(startQuest(state, only, [only, other], []), only, 'a');
    expect(isChapterOneComplete(state, [only, other], [], [])).toBe(false);
    state = completeQuestStage(startQuest(state, other, [only, other], []), other, 'b');
    expect(isChapterOneComplete(state, [only, other], [], [])).toBe(true);
  });

  it('is false for a new career with the real quests, and with no quests at all', () => {
    expect(isChapterOneComplete(createDefaultCareerState(), ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_ITEMS)).toBe(false);
    expect(isChapterOneComplete(createDefaultCareerState(), [], [], [])).toBe(false);
  });
});

describe('the Chapter 1 Conclusion being remembered', () => {
  it('is a saved fact that starts unset', () => {
    const state = createDefaultCareerState();
    expect(hasConcludedChapterOne(state)).toBe(false);
    expect(hasConcludedChapterOne({ ...state, facts: { ...state.facts, [CHAPTER_ONE_CONCLUDED_FACT]: true } })).toBe(true);
  });
});

describe('the Chapter 1 Conclusion screen and the quest group', () => {
  it('is a title card laid out like the Chapter 1 page, with a recap the game fills in', () => {
    const card = indexHtml.match(/<section id="chapter-conclusion"[\s\S]*?<\/section>/)?.[0] ?? '';
    expect(card).toContain('class="chapter-title chapter-conclusion"');
    expect(card).toContain('id="chapter-conclusion-recap"');
    expect(card).toContain('data-i18n="chapterConclusion.conclusion"');
  });

  it('draws its ornate border in the green a completed quest uses', () => {
    expect(css).toMatch(/\.chapter-conclusion \.deco-border \{ color: rgb\(var\(--complete-rgb\)\); \}/);
    expect(css).toMatch(/\.status-quests li\.quest-complete \{[^}]*color: rgb\(var\(--complete-rgb\)\)/);
  });

  it('lists the quests under a collapsible Chapter 1 group in the Career Menu', () => {
    const group = indexHtml.match(/<details class="quest-chapter" open>[\s\S]*?<\/details>/)?.[0] ?? '';
    expect(group).toContain('data-i18n="statusPanel.chapter1Quests"');
    expect(group).toContain('id="status-quests-list"');
  });
});

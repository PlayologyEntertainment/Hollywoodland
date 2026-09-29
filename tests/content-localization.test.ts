// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ALL_QUESTS } from '../src/domain/QuestDefinitions';
import { ALL_TALENTS } from '../src/domain/TalentDefinitions';
import { chooseObjective } from '../src/app/Objective';
import { buildQuestLog } from '../src/app/QuestLog';
import { createDefaultCareerState } from '../src/domain/CareerState';
import { i18n } from '../src/i18n';
import { contentKeys } from '../src/i18n/contentKeys';
import { dialogueChoiceLabel, dialogueSpeaker, dialogueText, questTitle, talentName } from '../src/i18n/content';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8') as string;

afterEach(() => vi.restoreAllMocks());

describe('content accessors', () => {
  const quest = ALL_QUESTS[0]!;
  const talent = ALL_TALENTS[0]!;

  it('read as authored while English is active or a translation is missing', () => {
    expect(questTitle(quest)).toBe(quest.title);
    expect(talentName(talent)).toBe(talent.name);
    expect(dialogueChoiceLabel('g', { id: 'n' }, { id: 'c', label: 'Written label' })).toBe('Written label');
  });

  it('prefer the active language when the catalog has the key, without touching braces or hashes in the writing', () => {
    vi.spyOn(i18n, 'raw').mockImplementation((key, fallback) => {
      if (key === contentKeys.questTitle(quest.id)) return 'Título traducido';
      if (key === contentKeys.dialogueText('g', 'n')) return 'Cost {1} # of it';
      return fallback;
    });
    expect(questTitle(quest)).toBe('Título traducido');
    expect(dialogueText('g', { id: 'n', text: 'English' })).toBe('Cost {1} # of it');
    expect(dialogueSpeaker('g', { id: 'n', speaker: 'Clerk' })).toBe('Clerk');
  });

  it('turn the objective card and quest log into the active language', () => {
    vi.spyOn(i18n, 'raw').mockImplementation((key, fallback) =>
      key === contentKeys.questTitle(quest.id) ? 'Ensayo de escena' : fallback,
    );
    const state = createDefaultCareerState();
    expect(chooseObjective(state, [quest], [], []).title).toBe('Ensayo de escena');
    expect(buildQuestLog(state, [quest], [], []).map((entry) => entry.title)).toContain('Ensayo de escena');
  });

  it('give the idle objective its interface strings', () => {
    const state = createDefaultCareerState();
    expect(chooseObjective(state, [], [], [])).toMatchObject({ kind: 'idle', title: 'All caught up', goal: 'Explore the Boulevard' });
  });
});

describe('display code reads content through the accessors', () => {
  const appShell = read('../src/app/AppShell.ts');

  it('no longer prints a dialogue speaker, line, choice, quest or item straight from its definition', () => {
    for (const forbidden of [
      'textContent = node.speaker',
      'textContent = node.text',
      'textContent = choice.label',
      'textContent = item.description',
      'textContent = definition.description',
      'textContent = definition.title',
      'talent.description }',
      'category.prompt;',
      'createTextNode(option.label)',
    ]) {
      expect(appShell, forbidden).not.toContain(forbidden);
    }
  });

  it('re-draws the open dialogue when the language changes', () => {
    expect(appShell).toMatch(/domainEvents\.on\('locale-changed'[\s\S]*?this\.renderDialogueNode\(\);/);
  });

  it('redraws the Character Creator when the language changes, since it is built before a chosen language has loaded', () => {
    expect(appShell).toContain('private readonly creatorScreen = new CharacterCreator();');
    expect(appShell).toContain('this.creatorScreen.mount(');
    expect(appShell).toMatch(/domainEvents\.on\('locale-changed'[\s\S]*?this\.creatorScreen\.refreshText\(\);/);
    const creator = read('../src/app/CharacterCreator.ts');
    const refresh = creator.match(/public refreshText\(\): void \{[\s\S]*?\r?\n  \}\r?\n/)?.[0] ?? '';
    for (const call of ['originName(origin)', 'originBlurb(origin)', 'playerCharacterLabel(character)', 'this.renderAttributes(attributeList)']) {
      expect(refresh, call).toContain(call);
    }
  });

  it('localizes the entrance prompt and the character creator', () => {
    expect(read('../src/game/scenes/BoulevardSpikeScene.ts')).toContain('label: locationPrompt(location),');
    const creator = read('../src/app/CharacterCreator.ts');
    for (const call of ['originName(origin)', 'originBlurb(origin)', 'playerCharacterLabel(chosen)']) expect(creator).toContain(call);
  });
});

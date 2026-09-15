import { describe, expect, it } from 'vitest';

import { validateQuestGraph } from '../src/content/QuestValidator';
import { ALL_QUESTS } from '../src/domain/QuestDefinitions';
import type { QuestDef } from '../src/domain/Quests';

describe('validateQuestGraph', () => {
  it('accepts a valid quest set with a diamond dependency', () => {
    const a: QuestDef = { id: 'a', title: 'A', summary: '', stages: [{ id: 's', description: '' }] };
    const b: QuestDef = {
      id: 'b',
      title: 'B',
      summary: '',
      prerequisites: [{ kind: 'quest-status', questId: 'a', status: 'completed' }],
      stages: [{ id: 's', description: '' }],
    };
    const c: QuestDef = {
      id: 'c',
      title: 'C',
      summary: '',
      prerequisites: [{ kind: 'quest-status', questId: 'a', status: 'completed' }],
      stages: [{ id: 's', description: '' }],
    };
    expect(() => validateQuestGraph([a, b, c])).not.toThrow();
  });

  it('rejects a duplicate quest id', () => {
    const quest: QuestDef = { id: 'dup', title: 'X', summary: '', stages: [{ id: 's', description: '' }] };
    expect(() => validateQuestGraph([quest, quest])).toThrow('duplicate id');
  });

  it('rejects a quest with no stages', () => {
    const quest: QuestDef = { id: 'empty', title: 'X', summary: '', stages: [] };
    expect(() => validateQuestGraph([quest])).toThrow('has no stages');
  });

  it('rejects a dangling quest-status prerequisite', () => {
    const quest: QuestDef = {
      id: 'q',
      title: 'X',
      summary: '',
      prerequisites: [{ kind: 'quest-status', questId: 'missing', status: 'completed' }],
      stages: [{ id: 's', description: '' }],
    };
    expect(() => validateQuestGraph([quest])).toThrow('references missing quest "missing"');
  });

  it('rejects a dependency cycle', () => {
    const a: QuestDef = {
      id: 'a',
      title: 'A',
      summary: '',
      prerequisites: [{ kind: 'quest-status', questId: 'b', status: 'completed' }],
      stages: [{ id: 's', description: '' }],
    };
    const b: QuestDef = {
      id: 'b',
      title: 'B',
      summary: '',
      prerequisites: [{ kind: 'quest-status', questId: 'a', status: 'completed' }],
      stages: [{ id: 's', description: '' }],
    };
    expect(() => validateQuestGraph([a, b])).toThrow('dependency cycle');
  });

  it('validates the real quest content', () => {
    expect(() => validateQuestGraph(ALL_QUESTS)).not.toThrow();
  });
});

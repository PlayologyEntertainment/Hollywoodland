import { describe, expect, it } from 'vitest';

import { validateQuestGraph } from '../src/content/QuestValidator';
import type { InventoryItemDefinition } from '../src/domain/Inventory';
import { ALL_ITEMS } from '../src/domain/InventoryDefinitions';
import type { TalentDefinition } from '../src/domain/Progression';
import { ALL_QUESTS } from '../src/domain/QuestDefinitions';
import type { QuestDef } from '../src/domain/Quests';
import { ALL_RELATIONSHIP_CHARACTERS } from '../src/domain/RelationshipDefinitions';
import type { RelationshipCharacter } from '../src/domain/Relationships';
import { ALL_TALENTS } from '../src/domain/TalentDefinitions';

const ROMANCE_CAPABLE: RelationshipCharacter = { id: 'romance-capable', supportsAttraction: true };
const ROMANCE_INCAPABLE: RelationshipCharacter = { id: 'romance-incapable', supportsAttraction: false };
const ROSTER: RelationshipCharacter[] = [ROMANCE_CAPABLE, ROMANCE_INCAPABLE];

const TEST_TALENT: TalentDefinition = {
  id: 'talent-a',
  branch: 'drama',
  name: 'Talent A',
  description: '',
  attribute: 'craft',
  attributeBonus: 1,
  cost: 1,
  prerequisiteId: null,
};

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

  it('validates the real quest content against the real relationship roster, talent, and item content', () => {
    expect(() => validateQuestGraph(ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_TALENTS, ALL_ITEMS)).not.toThrow();
  });

  it('rejects a relationship prerequisite referencing an unknown character', () => {
    const quest: QuestDef = {
      id: 'q',
      title: 'X',
      summary: '',
      prerequisites: [{ kind: 'relationship-at-least', characterId: 'missing', axis: 'trust', minimum: 10 }],
      stages: [{ id: 's', description: '' }],
    };
    expect(() => validateQuestGraph([quest], ROSTER)).toThrow('references missing relationship character "missing"');
  });

  it('rejects an attraction prerequisite against a character that does not support it', () => {
    const quest: QuestDef = {
      id: 'q',
      title: 'X',
      summary: '',
      prerequisites: [{ kind: 'relationship-at-least', characterId: 'romance-incapable', axis: 'attraction', minimum: 0 }],
      stages: [{ id: 's', description: '' }],
    };
    expect(() => validateQuestGraph([quest], ROSTER)).toThrow('does not support it');
  });

  it('accepts a relationship-label prerequisite against a known character', () => {
    const quest: QuestDef = {
      id: 'q',
      title: 'X',
      summary: '',
      prerequisites: [{ kind: 'relationship-label', characterId: 'romance-capable', label: 'friendship' }],
      stages: [{ id: 's', description: '' }],
    };
    expect(() => validateQuestGraph([quest], ROSTER)).not.toThrow();
  });

  it('does not require a roster when no quest has relationship prerequisites', () => {
    const quest: QuestDef = { id: 'q', title: 'X', summary: '', stages: [{ id: 's', description: '' }] };
    expect(() => validateQuestGraph([quest])).not.toThrow();
  });

  it('rejects a talent-unlocked prerequisite referencing an unknown talent', () => {
    const quest: QuestDef = {
      id: 'q',
      title: 'X',
      summary: '',
      prerequisites: [{ kind: 'talent-unlocked', talentId: 'missing' }],
      stages: [{ id: 's', description: '' }],
    };
    expect(() => validateQuestGraph([quest], [], [TEST_TALENT])).toThrow('references missing talent "missing"');
  });

  it('accepts a talent-unlocked prerequisite against a known talent', () => {
    const quest: QuestDef = {
      id: 'q',
      title: 'X',
      summary: '',
      prerequisites: [{ kind: 'talent-unlocked', talentId: 'talent-a' }],
      stages: [{ id: 's', description: '' }],
    };
    expect(() => validateQuestGraph([quest], [], [TEST_TALENT])).not.toThrow();
  });

  it('accepts a level-at-least prerequisite without needing a talents list', () => {
    const quest: QuestDef = {
      id: 'q',
      title: 'X',
      summary: '',
      prerequisites: [{ kind: 'level-at-least', minimum: 2 }],
      stages: [{ id: 's', description: '' }],
    };
    expect(() => validateQuestGraph([quest])).not.toThrow();
  });

  it('rejects an item-owned prerequisite referencing an unknown item', () => {
    const quest: QuestDef = {
      id: 'q',
      title: 'X',
      summary: '',
      prerequisites: [{ kind: 'item-owned', itemId: 'missing' }],
      stages: [{ id: 's', description: '' }],
    };
    expect(() => validateQuestGraph([quest])).toThrow('references missing item "missing"');
  });

  it('rejects a stage reward referencing an unknown item', () => {
    const quest: QuestDef = {
      id: 'q',
      title: 'X',
      summary: '',
      stages: [{ id: 's', description: '', rewards: [{ kind: 'item-grant', itemId: 'missing' }] }],
    };
    expect(() => validateQuestGraph([quest])).toThrow('stage "s" reward references missing item "missing"');
  });

  it('accepts an item-owned prerequisite and a stage reward against a known item', () => {
    const item: InventoryItemDefinition = {
      id: 'item-a',
      category: 'prop',
      name: 'Item A',
      description: '',
      unlockSource: 'debug',
    };
    const quest: QuestDef = {
      id: 'q',
      title: 'X',
      summary: '',
      prerequisites: [{ kind: 'item-owned', itemId: 'item-a' }],
      stages: [{ id: 's', description: '', rewards: [{ kind: 'item-grant', itemId: 'item-a' }] }],
    };
    expect(() => validateQuestGraph([quest], [], [], [item])).not.toThrow();
  });
});

import { describe, expect, it } from 'vitest';

import { validateDialogueGraph } from '../src/content/DialogueGraphValidator';
import { CASTING_OFFICE_DIALOGUE } from '../src/domain/DialogueGraphs';
import type { TalentDefinition } from '../src/domain/Progression';
import { ALL_QUESTS } from '../src/domain/QuestDefinitions';
import { ALL_RELATIONSHIP_CHARACTERS } from '../src/domain/RelationshipDefinitions';
import { ALL_TALENTS } from '../src/domain/TalentDefinitions';
import type { DialogueGraph } from '../src/domain/Dialogue';
import type { QuestDef } from '../src/domain/Quests';
import type { RelationshipCharacter } from '../src/domain/Relationships';

const TEST_QUEST: QuestDef = {
  id: 'quest-a',
  title: 'Quest A',
  summary: '',
  stages: [{ id: 'only', description: '' }],
};

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

describe('validateDialogueGraph', () => {
  it('accepts a small valid graph', () => {
    const graph: DialogueGraph = {
      id: 'valid',
      rootNodeId: 'a',
      nodes: [
        { id: 'a', speaker: 'X', text: '...', choices: [{ id: 'go', label: 'Go', next: 'b' }] },
        { id: 'b', speaker: 'X', text: '...', choices: [] },
      ],
    };
    expect(() => validateDialogueGraph(graph)).not.toThrow();
  });

  it('rejects a dangling next reference', () => {
    const graph: DialogueGraph = {
      id: 'dangling',
      rootNodeId: 'a',
      nodes: [{ id: 'a', speaker: 'X', text: '...', choices: [{ id: 'go', label: 'Go', next: 'missing' }] }],
    };
    expect(() => validateDialogueGraph(graph)).toThrow('references missing node "missing"');
  });

  it('rejects a node that is unreachable from the root', () => {
    const graph: DialogueGraph = {
      id: 'orphan',
      rootNodeId: 'a',
      nodes: [
        { id: 'a', speaker: 'X', text: '...', choices: [] },
        { id: 'b', speaker: 'X', text: '...', choices: [] },
      ],
    };
    expect(() => validateDialogueGraph(graph)).toThrow('node "b" is unreachable from root "a"');
  });

  it('rejects duplicate choice ids within one node', () => {
    const graph: DialogueGraph = {
      id: 'dup-choices',
      rootNodeId: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'X',
          text: '...',
          choices: [
            { id: 'go', label: 'Go', next: null },
            { id: 'go', label: 'Go again', next: null },
          ],
        },
      ],
    };
    expect(() => validateDialogueGraph(graph)).toThrow('duplicate id');
  });

  it('rejects an unknown root node id', () => {
    const graph: DialogueGraph = {
      id: 'bad-root',
      rootNodeId: 'missing',
      nodes: [{ id: 'a', speaker: 'X', text: '...', choices: [] }],
    };
    expect(() => validateDialogueGraph(graph)).toThrow('root node "missing" does not exist');
  });

  it('validates the real casting-office dialogue graph against the real quest, relationship, and talent content', () => {
    expect(() =>
      validateDialogueGraph(CASTING_OFFICE_DIALOGUE, ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_TALENTS),
    ).not.toThrow();
  });

  it('rejects a quest-status condition referencing an unknown quest', () => {
    const graph: DialogueGraph = {
      id: 'bad-quest-condition',
      rootNodeId: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'X',
          text: '...',
          choices: [{ id: 'go', label: 'Go', next: null, conditions: [{ kind: 'quest-status', questId: 'missing', status: 'active' }] }],
        },
      ],
    };
    expect(() => validateDialogueGraph(graph, [TEST_QUEST])).toThrow('references missing quest "missing"');
  });

  it('rejects a quest-action effect referencing an unknown quest', () => {
    const graph: DialogueGraph = {
      id: 'bad-quest-effect',
      rootNodeId: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'X',
          text: '...',
          choices: [{ id: 'go', label: 'Go', next: null, effects: [{ kind: 'quest-action', action: 'start', questId: 'missing' }] }],
        },
      ],
    };
    expect(() => validateDialogueGraph(graph, [TEST_QUEST])).toThrow('references missing quest "missing"');
  });

  it('rejects a complete-stage effect referencing an unknown stage on a real quest', () => {
    const graph: DialogueGraph = {
      id: 'bad-stage',
      rootNodeId: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'X',
          text: '...',
          choices: [
            {
              id: 'go',
              label: 'Go',
              next: null,
              effects: [{ kind: 'quest-action', action: 'complete-stage', questId: 'quest-a', stageId: 'missing' }],
            },
          ],
        },
      ],
    };
    expect(() => validateDialogueGraph(graph, [TEST_QUEST])).toThrow('references missing stage "missing" on quest "quest-a"');
  });

  it('does not require a quests list when the graph has no quest wiring', () => {
    const graph: DialogueGraph = {
      id: 'no-quests',
      rootNodeId: 'a',
      nodes: [{ id: 'a', speaker: 'X', text: '...', choices: [] }],
    };
    expect(() => validateDialogueGraph(graph)).not.toThrow();
  });

  it('rejects a relationship-at-least condition referencing an unknown character', () => {
    const graph: DialogueGraph = {
      id: 'bad-relationship-condition',
      rootNodeId: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'X',
          text: '...',
          choices: [
            {
              id: 'go',
              label: 'Go',
              next: null,
              conditions: [{ kind: 'relationship-at-least', characterId: 'missing', axis: 'trust', minimum: 10 }],
            },
          ],
        },
      ],
    };
    expect(() => validateDialogueGraph(graph, [], ROSTER)).toThrow('references missing relationship character "missing"');
  });

  it('rejects a relationship-delta effect referencing an unknown character', () => {
    const graph: DialogueGraph = {
      id: 'bad-relationship-effect',
      rootNodeId: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'X',
          text: '...',
          choices: [
            {
              id: 'go',
              label: 'Go',
              next: null,
              effects: [{ kind: 'relationship-delta', characterId: 'missing', delta: { trust: 5 } }],
            },
          ],
        },
      ],
    };
    expect(() => validateDialogueGraph(graph, [], ROSTER)).toThrow('references missing relationship character "missing"');
  });

  it('rejects an attraction condition against a character that does not support it', () => {
    const graph: DialogueGraph = {
      id: 'bad-attraction-condition',
      rootNodeId: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'X',
          text: '...',
          choices: [
            {
              id: 'go',
              label: 'Go',
              next: null,
              conditions: [
                { kind: 'relationship-at-least', characterId: 'romance-incapable', axis: 'attraction', minimum: 0 },
              ],
            },
          ],
        },
      ],
    };
    expect(() => validateDialogueGraph(graph, [], ROSTER)).toThrow('does not support it');
  });

  it('rejects an attraction delta against a character that does not support it', () => {
    const graph: DialogueGraph = {
      id: 'bad-attraction-effect',
      rootNodeId: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'X',
          text: '...',
          choices: [
            {
              id: 'go',
              label: 'Go',
              next: null,
              effects: [{ kind: 'relationship-delta', characterId: 'romance-incapable', delta: { attraction: 5 } }],
            },
          ],
        },
      ],
    };
    expect(() => validateDialogueGraph(graph, [], ROSTER)).toThrow('does not support it');
  });

  it('accepts a relationship-label condition and a pivotal-flag effect against a known character', () => {
    const graph: DialogueGraph = {
      id: 'good-relationship-wiring',
      rootNodeId: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'X',
          text: '...',
          choices: [
            {
              id: 'go',
              label: 'Go',
              next: null,
              conditions: [{ kind: 'relationship-label', characterId: 'romance-capable', label: 'friendship' }],
              effects: [{ kind: 'relationship-pivotal-flag', characterId: 'romance-capable', flag: 'metAtDiner' }],
            },
          ],
        },
      ],
    };
    expect(() => validateDialogueGraph(graph, [], ROSTER)).not.toThrow();
  });

  it('does not require a roster when the graph has no relationship wiring', () => {
    const graph: DialogueGraph = {
      id: 'no-relationships',
      rootNodeId: 'a',
      nodes: [{ id: 'a', speaker: 'X', text: '...', choices: [] }],
    };
    expect(() => validateDialogueGraph(graph)).not.toThrow();
  });

  it('rejects a talent-unlocked condition referencing an unknown talent', () => {
    const graph: DialogueGraph = {
      id: 'bad-talent-condition',
      rootNodeId: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'X',
          text: '...',
          choices: [{ id: 'go', label: 'Go', next: null, conditions: [{ kind: 'talent-unlocked', talentId: 'missing' }] }],
        },
      ],
    };
    expect(() => validateDialogueGraph(graph, [], [], [TEST_TALENT])).toThrow('references missing talent "missing"');
  });

  it('accepts a talent-unlocked condition against a known talent', () => {
    const graph: DialogueGraph = {
      id: 'good-talent-condition',
      rootNodeId: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'X',
          text: '...',
          choices: [{ id: 'go', label: 'Go', next: null, conditions: [{ kind: 'talent-unlocked', talentId: 'talent-a' }] }],
        },
      ],
    };
    expect(() => validateDialogueGraph(graph, [], [], [TEST_TALENT])).not.toThrow();
  });

  it('accepts a level-at-least condition without needing a talents list', () => {
    const graph: DialogueGraph = {
      id: 'level-condition',
      rootNodeId: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'X',
          text: '...',
          choices: [{ id: 'go', label: 'Go', next: null, conditions: [{ kind: 'level-at-least', minimum: 2 }] }],
        },
      ],
    };
    expect(() => validateDialogueGraph(graph)).not.toThrow();
  });

  it('does not require a talents list when the graph has no talent wiring', () => {
    const graph: DialogueGraph = {
      id: 'no-talents',
      rootNodeId: 'a',
      nodes: [{ id: 'a', speaker: 'X', text: '...', choices: [] }],
    };
    expect(() => validateDialogueGraph(graph)).not.toThrow();
  });
});

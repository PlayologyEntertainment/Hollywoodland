import { describe, expect, it } from 'vitest';

import { validateDialogueGraph } from '../src/content/DialogueGraphValidator';
import { CASTING_OFFICE_DIALOGUE } from '../src/domain/DialogueGraphs';
import { ALL_QUESTS } from '../src/domain/QuestDefinitions';
import type { DialogueGraph } from '../src/domain/Dialogue';
import type { QuestDef } from '../src/domain/Quests';

const TEST_QUEST: QuestDef = {
  id: 'quest-a',
  title: 'Quest A',
  summary: '',
  stages: [{ id: 'only', description: '' }],
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

  it('validates the real casting-office dialogue graph against the real quest content', () => {
    expect(() => validateDialogueGraph(CASTING_OFFICE_DIALOGUE, ALL_QUESTS)).not.toThrow();
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
});

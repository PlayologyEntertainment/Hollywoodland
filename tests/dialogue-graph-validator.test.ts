import { describe, expect, it } from 'vitest';

import { validateDialogueGraph } from '../src/content/DialogueGraphValidator';
import { CASTING_OFFICE_DIALOGUE } from '../src/domain/DialogueGraphs';
import type { DialogueGraph } from '../src/domain/Dialogue';

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

  it('validates the real casting-office dialogue graph', () => {
    expect(() => validateDialogueGraph(CASTING_OFFICE_DIALOGUE)).not.toThrow();
  });
});

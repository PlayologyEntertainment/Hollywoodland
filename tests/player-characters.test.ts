// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PLAYER_CHARACTER_ID,
  getPlayerCharacter,
  PLAYER_CHARACTERS,
  type PlayerCharacterId,
} from '../src/domain/PlayerCharacters';
import { createDefaultCareerState, createInitialCareerState, isCareerStateShape, type IdentityState } from '../src/domain/CareerState';
import { deriveAttributes } from '../src/domain/Origins';
import { isWalkCycle, type WalkCycle } from '../src/game/WalkCycle';
import { migrateSaveEnvelope, SAVE_SCHEMA_VERSION, serializeSave, parseSave } from '../src/save/SaveEnvelope';

const publicFile = (path: string): URL => new URL(`../public/${path}`, import.meta.url);
const read = (path: string): string => (readFileSync(new URL(path, import.meta.url), 'utf8') as string).replace(/\r\n/g, '\n');

/** The declarations of every rule whose selector is exactly `selector`, joined (a selector can appear more than once). */
function rules(css: string, selector: string): string {
  const blocks: string[] = [];
  const pattern = new RegExp(`(?:^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'g');
  for (const match of css.matchAll(pattern)) blocks.push(match[1] ?? '');
  return blocks.join('\n');
}

const EXPECTED: readonly PlayerCharacterId[] = ['white-male', 'white-female', 'asian-male', 'black-male', 'asian-female', 'black-female'];

describe('the six player characters', () => {
  it('put the characters with their own in-game art first, in the agreed order', () => {
    expect(PLAYER_CHARACTERS.map((c) => c.id)).toEqual(EXPECTED);
    expect(PLAYER_CHARACTERS.filter((c) => c.hasInGameArt).map((c) => c.id)).toEqual(['white-male', 'white-female']);
  });

  it('give every character a unique id and a unique screen-reader description', () => {
    expect(new Set(PLAYER_CHARACTERS.map((c) => c.id)).size).toBe(6);
    expect(new Set(PLAYER_CHARACTERS.map((c) => c.label)).size).toBe(6);
    for (const character of PLAYER_CHARACTERS) expect(character.label.length, character.id).toBeGreaterThan(10);
  });

  it('have a headshot and a full-size portrait on disk for every character', () => {
    for (const character of PLAYER_CHARACTERS) {
      expect(existsSync(publicFile(character.headshot)), character.headshot).toBe(true);
      expect(existsSync(publicFile(character.portrait)), character.portrait).toBe(true);
    }
  });

  it('point every character at a valid walk cycle whose sheet exists', () => {
    for (const character of PLAYER_CHARACTERS) {
      const cycle = JSON.parse(readFileSync(publicFile(character.walkCycle), 'utf8')) as WalkCycle;
      expect(isWalkCycle(cycle), character.walkCycle).toBe(true);
      expect(existsSync(publicFile(cycle.sheet)), `${character.id}: ${cycle.sheet}`).toBe(true);
    }
  });

  it('default to the original actor, and fall back to him for a missing or unknown id', () => {
    expect(DEFAULT_PLAYER_CHARACTER_ID).toBe('white-male');
    expect(getPlayerCharacter('black-female').id).toBe('black-female');
    expect(getPlayerCharacter(undefined).id).toBe('white-male');
    expect(getPlayerCharacter('not-a-character').id).toBe('white-male');
    expect(getPlayerCharacter('').id).toBe('white-male');
  });
});

describe('the chosen character in the career and its saves', () => {
  const identity = (characterId?: string): IdentityState => ({
    name: 'Test',
    originId: 'small-town-hopeful',
    skinToneIndex: 0,
    appearance: {},
    ...(characterId === undefined ? {} : { characterId }),
  });

  it('is stored in the identity a new career starts with', () => {
    const state = createInitialCareerState(identity('asian-female'), deriveAttributes('small-town-hopeful'));
    expect(state.identity.characterId).toBe('asian-female');
    expect(isCareerStateShape(state)).toBe(true);
  });

  it('is optional, so saves and default states from before characters existed stay valid', () => {
    const state = createInitialCareerState(identity(), deriveAttributes('small-town-hopeful'));
    expect(state.identity.characterId).toBeUndefined();
    expect(isCareerStateShape(state)).toBe(true);
    expect(isCareerStateShape(createDefaultCareerState())).toBe(true);
  });

  it('rejects an identity whose character id is not a string', () => {
    const state = createInitialCareerState(identity(), deriveAttributes('small-town-hopeful'));
    expect(isCareerStateShape({ ...state, identity: { ...state.identity, characterId: 7 } })).toBe(false);
  });

  it('survives a save and load, with no schema bump needed', () => {
    const state = createInitialCareerState(identity('black-male'), deriveAttributes('small-town-hopeful'));
    const envelope = {
      schemaVersion: SAVE_SCHEMA_VERSION,
      contentVersion: 'test',
      saveId: 'test',
      label: 'Test',
      savedAt: new Date().toISOString(),
      playtimeSeconds: 0,
      state,
    };
    const loaded = parseSave(serializeSave(envelope));
    expect(loaded.state.identity.characterId).toBe('black-male');
    expect(migrateSaveEnvelope(loaded).state.identity.characterId).toBe('black-male');
  });
});

describe('the Character Creator screen', () => {
  const html = read('../index.html');

  it('keeps the name field and swaps the customisation controls for the six-character selector', () => {
    expect(html).toContain('id="creator-name"');
    expect(html).toContain('id="creator-characters"');
    for (const removed of ['creator-skin-tones', 'data-cycler', 'creator-randomize']) expect(html, removed).not.toContain(removed);
  });

  it('keeps the origin picker, the attributes, and the Back and Start buttons', () => {
    for (const id of ['creator-origins', 'creator-attributes', 'creator-back', 'creator-start']) expect(html, id).toContain(`id="${id}"`);
    expect(html).toMatch(/id="creator-start"[^>]*>Start<\/button>/);
  });

  it('shows the full-size portrait in the centre without a box, on the background image', () => {
    const css = read('../src/styles.css');
    expect(html).toContain('id="creator-portrait"');
    expect(html).toContain('class="creator-stage"');
    expect(html).not.toContain('creator-pedestal');
    expect(css).toContain('creator-background.webp');
    expect(existsSync(publicFile('assets/ui/creator-background.webp'))).toBe(true);
    const block = rules(css, '.creator-preview');
    expect(block).toMatch(/border:\s*0/);
    expect(block).toMatch(/background:\s*none/);
  });

  it('sizes the headshots to the room under the Name field, in whichever of 1, 2, 3 or 6 columns makes them largest', () => {
    const css = read('../src/styles.css');
    expect(html).toMatch(/class="character-picker">\s*<div id="creator-characters" class="character-grid"/);
    expect(rules(css, '.character-picker')).toContain('container-type: size');
    const grid = rules(css, '.character-grid');
    expect(grid).toContain('grid-template-columns: repeat(auto-fill, var(--tile))');
    expect(grid).toMatch(/--tile:[^;]*\bmax\(/);
  });

  it('has no "Hollywoodland" line or three-word subtitle, and keeps a hidden heading so the screen still has a name', () => {
    const section = html.slice(html.indexOf('id="character-creator"'), html.indexOf('</section>', html.indexOf('id="character-creator"')));
    expect(section).not.toContain('Hollywoodland');
    expect(section).not.toContain('creator-header');
    expect(section).not.toContain('class="eyebrow"');
    expect(section).not.toContain('creator-plaque');
    expect(section).not.toContain('Dream');
    expect(section).toContain('aria-labelledby="creator-title"');
    expect(section).toMatch(/<h2 id="creator-title" class="sr-only">Character Creator<\/h2>/);
  });

  it('titles the left pane "Character" and the right pane "Origin", centred over their panes', () => {
    const css = read('../src/styles.css');
    expect(html).toMatch(/<h3 class="creator-title creator-title-left">Character<\/h3>/);
    expect(html).toMatch(/<h3 class="creator-title creator-title-right">Origin<\/h3>/);
    // Each title shares a grid column with its pane, and is centred within it.
    expect(rules(css, '.creator-title-left')).toContain('grid-column: 1');
    expect(rules(css, '.creator-title-right')).toContain('grid-column: 3');
    expect(rules(css, '.creator-form')).toContain('grid-column: 1');
    expect(rules(css, '.creator-origin')).toContain('grid-column: 3');
    expect(rules(css, '.creator-title')).toMatch(/text-align:\s*center/);
  });

  it('sets both titles in Limelight at one shared size and colour', () => {
    const css = read('../src/styles.css');
    const shared = rules(css, '.creator-title');
    expect(shared).toContain('var(--deco-font)');
    // The size is one variable, which the stage-height calculation also uses, so the two cannot drift apart either.
    expect(shared).toContain('font-size: var(--title-size)');
    expect(rules(css, '.creator')).toMatch(/--title-size:\s*clamp\(/);
    expect(shared).toContain('color: var(--gold-bright)');
    // Neither side title overrides the shared type, so the two can never drift apart.
    for (const side of ['.creator-title-left', '.creator-title-right']) {
      expect(rules(css, side), side).not.toMatch(/font-|color/);
    }
  });
});

describe('the floor reflection under the full-size character', () => {
  const html = read('../index.html');
  const css = read('../src/styles.css');

  it('is a decorative image inside the stage, hidden from screen readers, that changes with the chosen character', () => {
    const stage = html.slice(html.indexOf('class="creator-stage"'), html.indexOf('</section>', html.indexOf('class="creator-stage"')));
    expect(stage).toMatch(/<div class="creator-reflection" aria-hidden="true"><img id="creator-reflection" alt="" \/><\/div>/);
    expect(read('../src/app/CharacterCreator.ts')).toMatch(/#creator-reflection[\s\S]*chosen\.reflection/);
  });

  it('has a reflection strip on disk for every character', () => {
    for (const character of PLAYER_CHARACTERS) {
      expect(character.reflection, character.id).toBe(`assets/characters/player/${character.id}-reflection.webp`);
      expect(existsSync(publicFile(character.reflection)), character.reflection).toBe(true);
    }
  });

  it('is faint, blurred and clipped, and never takes the pointer', () => {
    const image = rules(css, '.creator-reflection img');
    expect(image).toMatch(/opacity:\s*0?\.\d+/);
    expect(image).toMatch(/filter:\s*blur\(/);
    const box = rules(css, '.creator-reflection');
    expect(box).toContain('overflow: hidden');
    expect(box).toContain('pointer-events: none');
  });

  it('is laid over the portrait at the same scale: a 520-row strip starting 300 rows above the canvas bottom, as the art script builds it', () => {
    const box = rules(css, '.creator-reflection');
    expect(box).toContain('top: calc(100% - var(--fig-h) * 300 / 1536)');
    expect(rules(css, '.creator-reflection img')).toContain('height: calc(var(--fig-h) * 520 / 1536)');
    const script = read('../art/generated/player-characters/tools/build_player_art.py');
    expect(script).toMatch(/STRIP_TOP_ABOVE = 300/);
    expect(script).toMatch(/STRIP_BELOW = 220/);
    // Each foot is mirrored about its own sole, so a foot drawn further back still touches its reflection.
    expect(script).toContain('assert feet == 2');
  });
});

describe('the sub-titles and attribute rows inside the side panes', () => {
  const css = read('../src/styles.css');

  it('set "Name" and "Character" on the left and "Choose an Origin" and "Attributes" on the right in one shared rule', () => {
    const shared = rules(css, '.creator-field span, .creator-origin h3');
    expect(shared).toContain('font-family: Arial, sans-serif');
    expect(shared).toContain('text-transform: uppercase');
  });

  it('draw no divider lines between the attributes', () => {
    expect(rules(css, '.attribute-list > div')).toContain('display: contents');
    expect(rules(css, '.attribute-bar')).toMatch(/border:\s*0/);
  });

  it('share one set of columns, so every bar starts and ends at the same place, and keep the rows close together', () => {
    const list = rules(css, '.attribute-list');
    expect(list).toMatch(/grid-template-columns:\s*auto minmax\(0, 1fr\) auto/);
    expect(rules(css, '.attribute-list > div')).toContain('display: contents');
    expect(list).toMatch(/row-gap:\s*\.3rem/);
    // A bar has no margin or padding of its own that could shift it from the one above.
    expect(rules(css, '.attribute-bar')).not.toMatch(/margin/);
    expect(rules(css, '.attribute-bar')).toMatch(/padding:\s*0/);
  });
});

describe('the splash screen button', () => {
  it('says Play, in Limelight, at a size larger than the other primary buttons', () => {
    const html = read('../index.html');
    const css = read('../src/styles.css');
    expect(html).toMatch(/<button id="splash-enter" class="[^"]*deco-label[^"]*" type="button">Play<\/button>/);
    expect(html).not.toMatch(/id="splash-enter"[^>]*>Enter</);
    expect(rules(css, '.splash-enter.deco-label')).toMatch(/font-size:\s*1\.9rem/);
  });
});

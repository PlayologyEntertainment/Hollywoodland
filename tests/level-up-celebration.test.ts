// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const appShell = readFileSync(new URL('../src/app/AppShell.ts', import.meta.url), 'utf8') as string;
const scene = readFileSync(new URL('../src/game/scenes/BoulevardSpikeScene.ts', import.meta.url), 'utf8') as string;
const domainEventBus = readFileSync(new URL('../src/domain/DomainEventBus.ts', import.meta.url), 'utf8') as string;

describe('the level-up banner', () => {
  const playHud = indexHtml.match(/<section id="play-hud"[\s\S]*?<\/section>/)?.[0] ?? '';

  it('is a hidden, decorative image inside the play HUD, pointing at the converted art', () => {
    expect(playHud).toMatch(/<img id="level-up-banner" class="level-up-banner" src="\/assets\/ui\/level-up-banner\.webp" alt="" hidden \/>/);
  });

  it('points at art that actually exists', () => {
    expect(existsSync(new URL('../public/assets/ui/level-up-banner.webp', import.meta.url))).toBe(true);
  });

  it('is sized modestly (not full-screen) and fades via an opacity transition', () => {
    const rule = css.slice(css.indexOf('.level-up-banner {'), css.indexOf('}', css.indexOf('.level-up-banner {')));
    expect(rule).toMatch(/width:\s*min\(/);
    expect(rule).toContain('opacity: 0');
    expect(rule).toMatch(/transition:\s*opacity/);
    expect(css).toContain('.level-up-banner.level-up-banner--visible { opacity: 1; }');
  });
});

describe('level-up domain events', () => {
  it('has a raw fact event and a separate "safe to celebrate" signal', () => {
    expect(domainEventBus).toContain("readonly 'level-up': LevelUpPayload;");
    expect(domainEventBus).toContain("readonly 'level-up-celebration': undefined;");
  });
});

describe('level-up detection in the scene', () => {
  it('diffs against the level last reported, not just against the previous career state', () => {
    expect(scene).toContain('private lastEmittedLevel = 1;');
    expect(scene).toMatch(/if \(level > this\.lastEmittedLevel\) this\.domainEvents\.emit\('level-up', \{ level \}\);/);
  });

  it('re-syncs the last-reported level on every fresh career state, so loading a save never falsely celebrates', () => {
    expect(scene).toMatch(/this\.careerState = createDefaultCareerState\(\);\s*this\.lastEmittedLevel = this\.careerState\.progression\.level;/);
    expect(scene).toMatch(/this\.careerState = state;\s*this\.lastEmittedLevel = state\.progression\.level;/);
  });

  it('bursts confetti only on the celebration signal, and skips it under reduced motion', () => {
    expect(scene).toContain("this.domainEvents.on('level-up-celebration', this.onLevelUpCelebration)");
    expect(scene).toMatch(/onLevelUpCelebration = \(\): void => \{\s*if \(this\.settings\.reducedMotion\) return;\s*this\.burstConfetti\(\);/);
  });
});

describe('AppShell defers the celebration until the Boulevard is clear', () => {
  it('queues a level-up rather than celebrating immediately, and re-checks after every dialog-close settle', () => {
    expect(appShell).toContain('private pendingLevelUp = false;');
    expect(appShell).toContain("this.options.domainEvents.on('level-up', () => {");
    expect(appShell).toContain('this.maybeCelebrateLevelUp();');
  });

  it('only celebrates in game, out on the open Boulevard, with no dialog open and no chapter page showing', () => {
    expect(appShell).toMatch(
      /if \(!this\.pendingLevelUp \|\| !this\.inGame \|\| this\.place !== undefined \|\| this\.onChapterPage\) return;/,
    );
  });

  it('plays the SFX and emits the celebration signal for the scene, alongside the banner', () => {
    expect(appShell).toContain('this.options.audio.playSfx(LEVEL_UP_SFX_FILE);');
    expect(appShell).toContain("this.options.domainEvents.emit('level-up-celebration', undefined);");
  });
});

describe('the one-shot SFX capability', () => {
  const audioDirector = readFileSync(new URL('../src/audio/AudioDirector.ts', import.meta.url), 'utf8') as string;
  const webAudioEngine = readFileSync(new URL('../src/audio/WebAudioEngine.ts', import.meta.url), 'utf8') as string;
  const audioCues = readFileSync(new URL('../src/audio/AudioCues.ts', import.meta.url), 'utf8') as string;

  it('is on both the engine and controller interfaces, and passed straight through by the director', () => {
    expect(audioDirector).toMatch(/playSfx\(path: string\): void;/);
    expect(audioDirector).toContain('public playSfx(path: string): void {\n    this.engine.playSfx(path);\n  }');
  });

  it('plays a fresh, independent element outside the music/ambience gain graph', () => {
    expect(webAudioEngine).toContain('public playSfx(path: string): void {');
    expect(webAudioEngine).toMatch(/new Audio\(`\$\{this\.baseUrl\}\$\{path\}`\)/);
  });

  it('names the not-yet-delivered file at the same path convention as the music/ambience files', () => {
    expect(audioCues).toContain("export const LEVEL_UP_SFX_FILE = 'assets/audio/Hollywoodland_LevelUp_SFX.mp3';");
  });
});

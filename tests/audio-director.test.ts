import { describe, expect, it } from 'vitest';

import { CROSSFADE_SECONDS, type MusicTrackId } from '../src/audio/AudioCues';
import { AudioDirector, type AudioEngine } from '../src/audio/AudioDirector';

/** Records what the director asks the engine to do, in order. */
class FakeEngine implements AudioEngine {
  public readonly log: string[] = [];
  public readonly seconds: number[] = [];

  public unlock(): void {
    this.log.push('unlock');
  }
  public crossfadeMusic(next: MusicTrackId | null, seconds: number): void {
    this.log.push(`music:${next ?? 'none'}`);
    this.seconds.push(seconds);
  }
  public fadeAmbience(on: boolean, seconds: number): void {
    this.log.push(on ? 'ambience:on' : 'ambience:off');
    this.seconds.push(seconds);
  }
  public setVolumes(): void {
    this.log.push('volumes');
  }
}

function setup(random = 0.1): { engine: FakeEngine; director: AudioDirector } {
  const engine = new FakeEngine();
  return { engine, director: new AudioDirector(engine, () => random) };
}

/** A director already playing the Main Menu music, with the log cleared. */
function inMenu(random?: number): { engine: FakeEngine; director: AudioDirector } {
  const parts = setup(random);
  parts.director.unlock();
  parts.director.setMood('menu');
  parts.engine.log.length = 0;
  parts.engine.seconds.length = 0;
  return parts;
}

/** A director out on the Boulevard, with the log cleared. */
function onBoulevard(random?: number): { engine: FakeEngine; director: AudioDirector } {
  const parts = inMenu(random);
  parts.director.setMood('boulevard');
  parts.engine.log.length = 0;
  parts.engine.seconds.length = 0;
  return parts;
}

describe('AudioDirector', () => {
  it('starts the Main Menu music as soon as sound is allowed', () => {
    const { engine, director } = setup();
    director.unlock();
    director.setMood('menu');
    expect(engine.log).toEqual(['unlock', 'music:studio']);
  });

  it('holds a mood requested before sound is allowed and applies it on unlock', () => {
    const { engine, director } = setup();
    director.setMood('menu');
    expect(engine.log).toEqual([]);
    director.unlock();
    expect(engine.log).toEqual(['unlock', 'music:studio']);
  });

  it('cross-fades from the menu music to the Boulevard music and brings the street ambience in, all at once', () => {
    const { engine, director } = inMenu();
    director.setMood('boulevard');
    expect(engine.log).toEqual(['music:boulevard', 'ambience:on']);
  });

  it('runs the music and the ambience over the same cross-fade length', () => {
    const { engine, director } = inMenu();
    director.setMood('boulevard');
    expect(engine.seconds).toEqual([CROSSFADE_SECONDS, CROSSFADE_SECONDS]);
  });

  it('cross-fades to a building track chosen at random and takes the ambience out', () => {
    for (const [random, expected] of [
      [0.1, 'music:building-a'],
      [0.9, 'music:building-b'],
    ] as const) {
      const { engine, director } = onBoulevard(random);
      director.setMood('building');
      expect(engine.log).toEqual([expected, 'ambience:off']);
    }
  });

  it('cross-fades back to the Boulevard music and ambience on leaving a building', () => {
    const { engine, director } = onBoulevard();
    director.setMood('building');
    engine.log.length = 0;
    director.setMood('boulevard');
    expect(engine.log).toEqual(['music:boulevard', 'ambience:on']);
  });

  it('plays the Studio music without the street ambience at the extras corral, Monarch gate and soundstage', () => {
    const { engine, director } = onBoulevard();
    director.setMood('studio');
    expect(engine.log).toEqual(['music:studio', 'ambience:off']);
  });

  it('keeps the music playing between the menu and the studio moods, which share a track', () => {
    const { engine, director } = inMenu();
    director.setMood('studio');
    director.setMood('menu');
    expect(engine.log).toEqual([]);
  });

  it('does nothing when the mood has not changed', () => {
    const { engine, director } = onBoulevard();
    director.setMood('boulevard');
    director.setMood('boulevard');
    expect(engine.log).toEqual([]);
  });

  it('starts a fresh cross-fade for every change, so a quick trip in and out always ends on the street music', () => {
    const { engine, director } = onBoulevard();
    director.setMood('building');
    director.setMood('boulevard'); // changed their mind straight away
    expect(engine.log).toEqual(['music:building-a', 'ambience:off', 'music:boulevard', 'ambience:on']);
  });

  it('ends on the latest place when the player moves on before the last cross-fade has finished', () => {
    const { engine, director } = onBoulevard();
    director.setMood('building');
    director.setMood('studio');
    expect(engine.log.filter((entry) => entry.startsWith('music:')).at(-1)).toBe('music:studio');
    expect(engine.log.filter((entry) => entry.startsWith('ambience:')).at(-1)).toBe('ambience:off');
  });

  it('returns to the menu music from the Boulevard', () => {
    const { engine, director } = onBoulevard();
    director.setMood('menu');
    expect(engine.log).toEqual(['music:studio', 'ambience:off']);
  });

  it('fades everything out for silence', () => {
    const { engine, director } = onBoulevard();
    director.setMood('silent');
    expect(engine.log).toEqual(['music:none', 'ambience:off']);
  });

  it('fades the menu music out to nothing over the usual cross-fade, as the chapter title page does', () => {
    const { engine, director } = inMenu();
    director.setMood('silent');
    // There is no street ambience in the menus, so only the music fades.
    expect(engine.log).toEqual(['music:none']);
    expect(engine.seconds).toEqual([CROSSFADE_SECONDS]);
  });

  it('brings the Boulevard music up from silence when the chapter title page hands over to the game', () => {
    const { engine, director } = inMenu();
    director.setMood('silent');
    engine.log.length = 0;
    director.setMood('boulevard');
    expect(engine.log).toEqual(['music:boulevard', 'ambience:on']);
  });

  it('passes volume settings straight to the engine, before or after unlocking', () => {
    const { engine, director } = setup();
    director.setSettings({
      textScale: 1,
      highContrast: false,
      reducedMotion: false,
      analyticsEnabled: true,
      filmEffects: true,
      musicVolume: 0.3,
      musicMuted: false,
      ambienceVolume: 0.2,
      ambienceMuted: true,
    });
    expect(engine.log).toEqual(['volumes']);
  });
});

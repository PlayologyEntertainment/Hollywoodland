// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  AMBIENCE_FILE,
  ambienceFor,
  BUILDING_TRACKS,
  CROSSFADE_SECONDS,
  moodForPlace,
  MUSIC_FILES,
  musicFor,
  placeForLocation,
  sliderToGain,
  type AudioMood,
} from '../src/audio/AudioCues';
import type { BoulevardManifest } from '../src/game/BoulevardManifest';
import { DEFAULT_SETTINGS, normalizeSettings } from '../src/settings/Settings';

const publicFile = (path: string): URL => new URL(`../public/${path}`, import.meta.url);
const read = (path: string): string => (readFileSync(new URL(path, import.meta.url), 'utf8') as string).replace(/\r\n/g, '\n');
const manifest = JSON.parse(readFileSync(publicFile('data/boulevard-manifest.json'), 'utf8')) as BoulevardManifest;

describe('which music plays where', () => {
  it('uses the Studio music for the Main Menu, the Character Creator and the studio places', () => {
    expect(musicFor('menu', () => 0)).toBe('studio');
    expect(musicFor('studio', () => 0)).toBe('studio');
  });

  it('uses the Boulevard music out on the street', () => {
    expect(musicFor('boulevard', () => 0)).toBe('boulevard');
  });

  it('chooses between the two building tracks at random, covering both', () => {
    expect(BUILDING_TRACKS).toEqual(['building-a', 'building-b']);
    expect(musicFor('building', () => 0)).toBe('building-a');
    expect(musicFor('building', () => 0.4999)).toBe('building-a');
    expect(musicFor('building', () => 0.5)).toBe('building-b');
    expect(musicFor('building', () => 0.9999)).toBe('building-b');
    expect(musicFor('building', () => 1)).toBe('building-b'); // out of range still lands on a track
  });

  it('plays nothing before the player has entered', () => {
    expect(musicFor('silent', () => 0)).toBeNull();
  });

  it('plays the street ambience only out on the Boulevard', () => {
    const moods: AudioMood[] = ['silent', 'menu', 'boulevard', 'building', 'studio'];
    expect(moods.filter(ambienceFor)).toEqual(['boulevard']);
  });

  it('cross-fades over one second, with the old and new music overlapping', () => {
    expect(CROSSFADE_SECONDS).toBe(1);
  });
});

describe('which places are buildings and which are studio', () => {
  it('puts the six buildings on the building tracks', () => {
    for (const id of ['boarding-house', 'casting-office', 'diner', 'costume-shop', 'klieg-light-office', 'celestial-palace']) {
      expect(moodForPlace(placeForLocation(id) ?? 'studio'), id).toBe('building');
    }
  });

  it('puts the extras corral, Monarch Pictures gate and soundstage on the Studio music', () => {
    for (const id of ['extras-corral', 'backlot-gate', 'soundstage']) {
      expect(placeForLocation(id), id).toBe('studio');
    }
  });

  it('knows every location the player can enter, so a new location cannot be silently left without music', () => {
    for (const location of manifest.locations.filter((l) => l.enterable)) {
      expect(placeForLocation(location.id), `${location.id} has a place kind`).toBeDefined();
    }
  });

  it('has nothing to say about a location with nothing to enter', () => {
    expect(placeForLocation('alley')).toBeUndefined();
  });
});

describe('the audio files', () => {
  it('exist where the game serves them', () => {
    for (const path of [...Object.values(MUSIC_FILES), AMBIENCE_FILE]) {
      expect(existsSync(publicFile(path)), path).toBe(true);
    }
  });
});

describe('volume', () => {
  it('shapes the slider so the lower half is gentle, and mute is silent', () => {
    expect(sliderToGain(0, false)).toBe(0);
    expect(sliderToGain(1, false)).toBe(1);
    expect(sliderToGain(0.5, false)).toBeCloseTo(0.25);
    expect(sliderToGain(0.8, true)).toBe(0);
    expect(sliderToGain(7, false)).toBe(1);
    expect(sliderToGain(-1, false)).toBe(0);
    expect(sliderToGain(Number.NaN, false)).toBe(0);
  });

  it('defaults to a comfortable level with nothing muted', () => {
    expect(DEFAULT_SETTINGS.musicVolume).toBe(0.6);
    expect(DEFAULT_SETTINGS.ambienceVolume).toBe(0.5);
    expect(DEFAULT_SETTINGS.musicMuted).toBe(false);
    expect(DEFAULT_SETTINGS.ambienceMuted).toBe(false);
  });

  it('clamps saved volumes and falls back for junk, including settings saved before audio existed', () => {
    expect(normalizeSettings({ musicVolume: 3, ambienceVolume: -2 })).toEqual({ ...DEFAULT_SETTINGS, musicVolume: 1, ambienceVolume: 0 });
    expect(normalizeSettings({ musicVolume: 'loud', musicMuted: 'yes' })).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings({ textScale: 1.2, filmEffects: false })).toEqual({ ...DEFAULT_SETTINGS, textScale: 1.2, filmEffects: false });
  });
});

describe('the settings dialog', () => {
  it('has every audio control the shell reads', () => {
    const html = read('../index.html');
    const shell = read('../src/app/AppShell.ts');
    for (const id of ['music-volume', 'music-volume-output', 'music-muted', 'ambience-volume', 'ambience-volume-output', 'ambience-muted']) {
      expect(html, `index.html has #${id}`).toContain(`id="${id}"`);
    }
    expect(shell).toContain("'#music-volume'");
    expect(shell).toContain("'#ambience-muted'");
  });
});

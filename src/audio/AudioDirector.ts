import type { GameSettings } from '../settings/Settings';
import { ambienceFor, CROSSFADE_SECONDS, musicFor, type AudioMood, type MusicTrackId } from './AudioCues';

/** What the director needs from the browser. Kept this small so the transition rules can be tested with a fake. */
export interface AudioEngine {
  /** Allows sound. Must run inside a user gesture; safe to call again. */
  unlock(): void;
  /** Cross-fades to `next` (or to silence when null): everything audible fades down while `next` fades up, over `seconds`.
   * A track that comes back after being stopped starts from the beginning. */
  crossfadeMusic(next: MusicTrackId | null, seconds: number): void;
  /** Fades the street ambience up (starting it) or down (stopping it) over `seconds`. */
  fadeAmbience(on: boolean, seconds: number): void;
  setVolumes(settings: Pick<GameSettings, 'musicVolume' | 'musicMuted' | 'ambienceVolume' | 'ambienceMuted'>): void;
  /** Plays a one-shot sound effect once, independent of the looping music/ambience voices — fire and forget. */
  playSfx(path: string): void;
}

/** The part of the director the rest of the app talks to. */
export interface AudioController {
  setMood(mood: AudioMood): void;
  setSettings(settings: GameSettings): void;
  playSfx(path: string): void;
}

/** Chooses what plays and cross-fades between tracks.
 *
 * The app only ever states the mood it wants (`setMood`); the director works out the change. Every change is a cross-fade,
 * with the old music fading down while the new music fades up and the street ambience fading in or out alongside. Nothing
 * waits on anything, so changing your mind mid-fade just starts the next cross-fade from wherever the sound is now. A mood
 * requested before sound is allowed is remembered and applied on `unlock`. */
export class AudioDirector implements AudioController {
  private target: AudioMood = 'silent';
  private applied: AudioMood = 'silent';
  private track: MusicTrackId | null = null;
  private ambience = false;
  private unlocked = false;

  public constructor(
    private readonly engine: AudioEngine,
    private readonly random: () => number = Math.random,
  ) {}

  public unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    this.engine.unlock();
    this.apply();
  }

  public setMood(mood: AudioMood): void {
    this.target = mood;
    if (this.unlocked) this.apply();
  }

  public setSettings(settings: GameSettings): void {
    this.engine.setVolumes(settings);
  }

  public playSfx(path: string): void {
    this.engine.playSfx(path);
  }

  private apply(): void {
    const goal = this.target;
    if (goal === this.applied) return;
    this.applied = goal;

    // Menu and studio share a track, so moving between them keeps the music playing. A building picks at random each
    // time it is entered, so it never "keeps" a track.
    const fixedTrack = goal === 'building' ? null : musicFor(goal, this.random);
    const keepMusic = fixedTrack !== null && this.track === fixedTrack;
    if (!keepMusic) {
      const next = musicFor(goal, this.random);
      this.engine.crossfadeMusic(next, CROSSFADE_SECONDS);
      this.track = next;
    }

    const wantAmbience = ambienceFor(goal);
    if (wantAmbience !== this.ambience) {
      this.engine.fadeAmbience(wantAmbience, CROSSFADE_SECONDS);
      this.ambience = wantAmbience;
    }
  }
}

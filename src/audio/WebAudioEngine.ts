import type { GameSettings } from '../settings/Settings';
import { AMBIENCE_FILE, MUSIC_FILES, sliderToGain, type MusicTrackId } from './AudioCues';
import type { AudioEngine } from './AudioDirector';

/** How many short linear ramps make up one fade curve. */
const FADE_STEPS = 16;

/** One looping sound: the streaming element, and the gain node its fades run on. */
interface Voice {
  readonly element: HTMLAudioElement;
  readonly fade: GainNode;
  /** Bumped every time the voice is faded up or down, so a fade-down's delayed stop never cuts a voice that has since been brought back. */
  generation: number;
}

/** Plays the tracks through the Web Audio API: each is a streaming <audio> element (an MP3 is never decoded whole into
 * memory) routed through a fade gain, then a per-channel volume gain, then the speakers. Gain nodes are used instead of
 * `element.volume` because fades stay smooth and iOS Safari ignores `element.volume`.
 *
 * Browsers only allow sound after a user gesture, so nothing is created until `unlock` runs inside one. A file that
 * fails to load or play is logged once and skipped; the game carries on silently. */
export class WebAudioEngine implements AudioEngine {
  private context: AudioContext | undefined;
  private musicLevel: GainNode | undefined;
  private ambienceLevel: GainNode | undefined;
  private readonly music = new Map<MusicTrackId, Voice>();
  /** Streaming elements by path. They exist before sound is unlocked so the first track can buffer during the splash. */
  private readonly elements = new Map<string, HTMLAudioElement>();
  private ambience: Voice | undefined;
  private volumes: Pick<GameSettings, 'musicVolume' | 'musicMuted' | 'ambienceVolume' | 'ambienceMuted'> | undefined;
  private warned = false;

  public constructor(private readonly baseUrl: string) {
    // The Main Menu music starts the instant the player clicks Enter, so it is fetched while the splash is showing.
    this.element(MUSIC_FILES.studio, 'auto');
  }

  public unlock(): void {
    if (this.context !== undefined) {
      void this.context.resume();
      return;
    }
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Context === undefined) return;
    const context = new Context();
    this.context = context;
    this.musicLevel = context.createGain();
    this.ambienceLevel = context.createGain();
    this.musicLevel.connect(context.destination);
    this.ambienceLevel.connect(context.destination);
    if (this.volumes !== undefined) this.applyVolumes(this.volumes, true);
    void context.resume();
    // Stop making sound while the tab is in the background, and carry on when it returns.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) void context.suspend();
      else void context.resume();
    });
    // Start fetching the street tracks while the player is still in the menus.
    this.voiceFor('boulevard', 'auto');
    this.ambienceVoice('auto');
  }

  public setVolumes(settings: Pick<GameSettings, 'musicVolume' | 'musicMuted' | 'ambienceVolume' | 'ambienceMuted'>): void {
    this.volumes = settings;
    if (this.context !== undefined) this.applyVolumes(settings, false);
  }

  public crossfadeMusic(next: MusicTrackId | null, seconds: number): void {
    // Everything audible except the incoming track fades down and is stopped when it is silent. A voice that is already
    // fading down counts as audible, so several tracks can briefly overlap if the player changes places quickly.
    for (const [track, voice] of this.music) {
      if (track === next || voice.element.paused) continue;
      voice.generation += 1;
      const generation = voice.generation;
      this.ramp(voice.fade, 'down', seconds);
      window.setTimeout(() => {
        if (voice.generation === generation) voice.element.pause();
      }, seconds * 1000);
    }
    if (next === null) return;
    const voice = this.voiceFor(next, 'auto');
    if (voice === undefined) return;
    voice.generation += 1;
    // A track that has stopped comes back from the beginning. One that is still audible (a quick trip out and back while
    // it was fading down) just fades back up from where it is, rather than jumping.
    if (voice.element.paused) {
      voice.element.currentTime = 0;
      this.play(voice);
    }
    this.ramp(voice.fade, 'up', seconds);
  }

  public fadeAmbience(on: boolean, seconds: number): void {
    const voice = this.ambienceVoice('auto');
    if (voice === undefined) return;
    voice.generation += 1;
    const generation = voice.generation;
    if (on) {
      this.play(voice);
      this.ramp(voice.fade, 'up', seconds);
      return;
    }
    this.ramp(voice.fade, 'down', seconds);
    window.setTimeout(() => {
      if (voice.generation === generation) voice.element.pause();
    }, seconds * 1000);
  }

  private voiceFor(track: MusicTrackId, preload: 'auto' | 'none'): Voice | undefined {
    const existing = this.music.get(track);
    if (existing !== undefined) return existing;
    const voice = this.createVoice(MUSIC_FILES[track], this.musicLevel, preload);
    if (voice !== undefined) this.music.set(track, voice);
    return voice;
  }

  private ambienceVoice(preload: 'auto' | 'none'): Voice | undefined {
    this.ambience ??= this.createVoice(AMBIENCE_FILE, this.ambienceLevel, preload);
    return this.ambience;
  }

  private element(path: string, preload: 'auto' | 'none'): HTMLAudioElement {
    let element = this.elements.get(path);
    if (element === undefined) {
      element = new Audio(`${this.baseUrl}${path}`);
      element.loop = true;
      element.preload = preload;
      element.addEventListener('error', () => this.warn(`could not load ${path}`));
      this.elements.set(path, element);
    }
    return element;
  }

  private createVoice(path: string, destination: GainNode | undefined, preload: 'auto' | 'none'): Voice | undefined {
    if (this.context === undefined || destination === undefined) return undefined;
    const element = this.element(path, preload);
    const fade = this.context.createGain();
    fade.gain.value = 0;
    this.context.createMediaElementSource(element).connect(fade);
    fade.connect(destination);
    return { element, fade, generation: 0 };
  }

  private play(voice: Voice): void {
    void voice.element.play().catch((error: unknown) => {
      this.warn(error instanceof Error ? error.message : 'playback was blocked');
    });
  }

  /** Fades a gain node up to full or down to silence over `seconds`, starting from wherever it is now so an interrupted fade
   * carries on smoothly. The path follows a quarter sine/cosine (built from short linear ramps), which makes a matching
   * pair of fades keep a steady combined loudness instead of dipping in the middle like a straight-line cross-fade. */
  private ramp(node: GainNode, direction: 'up' | 'down', seconds: number): void {
    const context = this.context;
    if (context === undefined) return;
    const now = context.currentTime;
    const from = node.gain.value;
    node.gain.cancelScheduledValues(now);
    node.gain.setValueAtTime(from, now);
    for (let step = 1; step <= FADE_STEPS; step += 1) {
      const progress = step / FADE_STEPS;
      const angle = progress * (Math.PI / 2);
      const value = direction === 'up' ? from + (1 - from) * Math.sin(angle) : from * Math.cos(angle);
      node.gain.linearRampToValueAtTime(value, now + seconds * progress);
    }
  }

  private applyVolumes(
    volumes: Pick<GameSettings, 'musicVolume' | 'musicMuted' | 'ambienceVolume' | 'ambienceMuted'>,
    immediate: boolean,
  ): void {
    const context = this.context;
    if (context === undefined || this.musicLevel === undefined || this.ambienceLevel === undefined) return;
    const set = (node: GainNode, value: number): void => {
      if (immediate) node.gain.value = value;
      else node.gain.setTargetAtTime(value, context.currentTime, 0.03);
    };
    set(this.musicLevel, sliderToGain(volumes.musicVolume, volumes.musicMuted));
    set(this.ambienceLevel, sliderToGain(volumes.ambienceVolume, volumes.ambienceMuted));
  }

  private warn(message: string): void {
    if (this.warned) return;
    this.warned = true;
    console.warn(`[Audio] ${message}; carrying on without it.`);
  }
}

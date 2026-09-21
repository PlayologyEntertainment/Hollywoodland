/** What should be playing for each part of the game. Pure data and lookups (no browser audio), so the rules are
 * unit-tested and the director and engine stay simple.
 *
 * Moods: the Main Menu and Character Creator use the Studio music; walking the Boulevard uses the Boulevard music with the
 * street ambience underneath; a building plays one of two building tracks at random; the Extras Corral, Monarch Pictures
 * gate and Soundstage play the Studio music. Ambience only plays out on the street. */

export type AudioMood = 'silent' | 'menu' | 'boulevard' | 'building' | 'studio';

export type MusicTrackId = 'studio' | 'boulevard' | 'building-a' | 'building-b';

/** Paths under public/, in the order the tracks would be prefetched. */
export const MUSIC_FILES: Readonly<Record<MusicTrackId, string>> = {
  studio: 'assets/audio/Hollywoodland_Studio_Music.mp3',
  boulevard: 'assets/audio/Hollywoodland_Main_Boulevard_Music.mp3',
  'building-a': 'assets/audio/Hollywoodland_Building_A_Music.mp3',
  'building-b': 'assets/audio/Hollywoodland_Building_B_Music.mp3',
};

export const AMBIENCE_FILE = 'assets/audio/Hollywoodland_Outdoor_Background_SFX.mp3';

/** Every change of music is a cross-fade: the old track fades down while the new one fades up over this long, on an
 * equal-power curve so the loudness does not dip in the middle. The street ambience fades in or out alongside. */
export const CROSSFADE_SECONDS = 1.0;

/** The two tracks a building chooses between at random. */
export const BUILDING_TRACKS: readonly MusicTrackId[] = ['building-a', 'building-b'];

/** The music for a mood, or null for silence. `random` (0 up to but not including 1) picks between the building tracks. */
export function musicFor(mood: AudioMood, random: () => number): MusicTrackId | null {
  switch (mood) {
    case 'silent':
      return null;
    case 'menu':
    case 'studio':
      return 'studio';
    case 'boulevard':
      return 'boulevard';
    case 'building': {
      const index = Math.min(BUILDING_TRACKS.length - 1, Math.floor(random() * BUILDING_TRACKS.length));
      return BUILDING_TRACKS[Math.max(0, index)] ?? 'building-a';
    }
  }
}

/** Street ambience plays only while the player is out on the Boulevard. */
export function ambienceFor(mood: AudioMood): boolean {
  return mood === 'boulevard';
}

export type PlaceKind = 'building' | 'studio';

const PLACES: Readonly<Record<string, PlaceKind>> = {
  'boarding-house': 'building',
  'casting-office': 'building',
  diner: 'building',
  'costume-shop': 'building',
  'klieg-light-office': 'building',
  'celestial-palace': 'building',
  'backlot-gate': 'studio',
  'extras-corral': 'studio',
  soundstage: 'studio',
};

/** Which kind of place a location id is, or undefined for a location with nothing to enter (the alley). */
export function placeForLocation(locationId: string): PlaceKind | undefined {
  return PLACES[locationId];
}

/** The mood for being inside a place. */
export function moodForPlace(place: PlaceKind): AudioMood {
  return place;
}

/** Slider position (0 to 1) to gain. Squared, so the lower half of the slider is gentle instead of nearly all the change
 * happening in the top few percent. */
export function sliderToGain(level: number, muted: boolean): number {
  if (muted) return 0;
  const clamped = Math.min(1, Math.max(0, Number.isFinite(level) ? level : 0));
  return clamped * clamped;
}

# Game audio

Music and ambience are played by a small system in `src/audio/`, separate from Phaser (the menus are DOM, not canvas). The app only says **where the player is**; the audio system works out what plays and fades between tracks.

## What plays where

| Where the player is | Music | Street ambience |
|---|---|---|
| Splash screen (before Play) | nothing | no |
| Main Menu, Character Creator | `Hollywoodland_Studio_Music` | no |
| Walking the Boulevard | `Hollywoodland_Main_Boulevard_Music` | **yes** (`Hollywoodland_Outdoor_Background_SFX`) |
| Inside a building (Bellhaven Rooms, Sunset Casting Exchange, The Gilded Spoon, The Silver Thimble, The Klieg Light, The Celestial Palace) | `Hollywoodland_Building_A_Music` or `_B_`, chosen at random each time | no |
| Inside a studio place (Monarch Pictures gate, Extras Corral, Soundstage) | `Hollywoodland_Studio_Music` | no |
| In-game Menu button (back to the Main Menu) | `Hollywoodland_Studio_Music` | no |

The files are in `public/assets/audio/`. Every change of music is a **1.0 s cross-fade** (`CROSSFADE_SECONDS` in `AudioCues.ts`): the old track fades down while the new one fades up at the same time, on an equal-power curve so the combined loudness stays steady instead of dipping in the middle. The street ambience fades in or out alongside. A track that comes back after being stopped **restarts from the beginning**; one caught still fading down by a quick trip out and back simply fades back up from where it is, rather than jumping. Moving between two moods that share a track (Main Menu to a studio place) keeps it playing. The street ambience resumes where it left off, since it is a continuous loop.

## Pieces

- `AudioCues.ts`: the rules as pure data: moods, tracks, which locations are buildings or studio places (`placeForLocation`), the fade lengths, and the slider-to-gain curve. Unit-tested, including a check that **every enterable location in the Boulevard manifest has a place kind**, so a new location cannot be left without music.
- `AudioDirector.ts`: `setMood(mood)` states the wanted mood and the director starts the cross-fade straight away; nothing waits on anything. Changing your mind mid-fade just starts the next cross-fade from wherever the sound is now, so quick trips in and out of buildings cannot stack tracks or leave silence. A mood requested before sound is allowed is remembered and applied on unlock.
- `WebAudioEngine.ts`: the browser side. Each track is a streaming `<audio>` element routed through Web Audio gain nodes (fade gain, then a per-channel volume gain). `crossfadeMusic` fades down everything audible except the incoming track while the new one fades up, and stops a track once it is silent. Gain nodes are used so fades are smooth and volume works on iOS Safari, which ignores `element.volume`. MP3s are streamed, not decoded whole into memory.
- `src/app/AppShell.ts` sets the mood: `startGame` (Boulevard), the Menu button (menu), and each building or studio entry (`openDialogue`). The player counts as inside a place until every dialog belonging to it (interaction, Home Menu, audition) has closed, checked 60 ms later so a hand-over between dialogs does not flick back to street music.
- `src/main.ts` creates the director, unlocks sound on the player's first click or key press, and starts the Main Menu music from the splash screen's Play click.

## Volume settings

Settings & Accessibility has **Music volume** and **Ambience volume** sliders, each with a mute checkbox, saved with the other settings (`musicVolume`, `musicMuted`, `ambienceVolume`, `ambienceMuted`; defaults 60% and 50%). Dragging a slider previews live, and cancelling the dialog reverts it. The slider is squared to a gain (`sliderToGain`), so the lower half is gentle. Building and studio music follow the Music slider.

## Browser rules

Browsers only allow sound after the player interacts with the page. Nothing plays before the first click or key press; the splash screen's Play button is normally that. The Studio track's element is created at page load so it buffers during the splash, and the street tracks are fetched once sound is unlocked. A file that fails to load or play is logged once and skipped; the game carries on silently. Sound is suspended while the tab is in the background.

## Adding to it

- **A new location:** add it to `PLACES` in `AudioCues.ts` as `building` or `studio` (a test fails until you do), and make sure its entry goes through `openDialogue`.
- **A new track or mood:** add the file to `public/assets/audio/`, then extend `MusicTrackId`, `MUSIC_FILES`, `musicFor` and `ambienceFor`.

## Known limits

- The tracks loop as raw MP3 files. The owner checked the loop points by ear on 2026-09-20 and they are clean.
- The tracks are free AI-generated MP3s from Pixabay (per the owner). What is recorded, and what still needs saving before release (track page URLs, the license terms that applied, a loudness check), is in `docs/AUDIO_PROVENANCE.md`.
- Phaser creates its own unused audio context; this system deliberately does not use Phaser's sound manager.

# The map of Hollywoodland and the Union Bus Depot

The left-most building on the Boulevard is the **Union Bus Depot**, where a career begins. Using its entrance ("Board the bus") opens a map of Hollywoodland with five regions. Choosing a region the player can reach takes the bus there: it costs a fare, moves the clock on, and shows the classic "Welcome to ..." sign for the place.

## The pieces

| Piece | Where |
|---|---|
| The entrance and its signs | `bus-depot` in `public/data/boulevard-manifest.json` and `DEFAULT_BOULEVARD_MANIFEST` (`src/game/BoulevardManifest.ts`), the first location, on the `depot-canopy` module. Its header sign (`UNION BUS DEPOT`) and wall plaque (`TO ALL POINTS`, an `extraSigns` entry) are drawn in code on the module's two blank panels. The Boulevard Art Director edits the entrance and header sign; it does not show the plaque. |
| The regions, fares and rules | `src/domain/Travel.ts`: `REGIONS` (name, welcome-sign city and subtitle, population, and `playable`), `travelQuote`, `travelStatus`, `travelTo`. Pure, with tests in `tests/travel.test.ts`. |
| Where the player is | `CareerState.region` (optional; absent means the Boulevard, so no save migration was needed). |
| The picture and the outlines | `public/assets/ui/hollywoodland-map.webp` (1536 x 1024) and `src/game/WorldMap.ts`: one hand-drawn polygon per region, plus where its name tag sits. `tests/world-map.test.ts` checks they tile the picture. |
| The map screen | `src/app/BusMap.ts`, with the `#bus-map-dialog` markup in `index.html` and its styles at the end of `src/styles.css`. |
| The welcome sign | `src/app/WelcomeSign.ts`, with the `#welcome-sign` markup and styles. |
| Wiring | `AppShell.ts` (`bus-depot-entered`, `travelFromMap`, `showWelcomeSign`) and `BoulevardSpikeScene.ts` (`travel-requested`). |

## How it behaves

- **States.** The player's own region is lit and colourised ("You are here", green outline). Every other region is dim and desaturated. Hover or keyboard focus lights a region part-way with a gold outline; selecting one lights it fully with a dashed gold outline and says in the info line what a trip costs or why it cannot be taken. A region is a keyboard-focusable button; Enter or Space chooses it. Escape or the Close button closes the map.
- **Choosing.** A region the player can reach (built, and the fare affordable) sets off at once. Any other just selects it: "Coming soon" for a region that is not built, "Needs $N" when the fare is too much, "You are here" for the current one.
- **Fares and time.** $2 and one time slot within the city and hills; $5 and two slots to or from the Santa Monica Pier. Money is in whole dollars, so period cents are scaled up. Energy is untouched. Time that rolls past evening goes into the next day.
- **Gameplay keys are switched off while the map is open** (`setGameplayActive`), so Enter on a region cannot also work the depot behind it.
- **The welcome sign** shows at the start of a new career (after the Chapter 1 card), when a saved career is loaded (for the region it resumes in), and after a bus trip. The lines fade in one after another, hold, and move on by themselves; a click or Enter skips it; Reduce Motion shows it whole and shorter. The music is faded out while it shows, as for the chapter cards.

## The welcome signs' figures

Real names and 1930 census populations (Los Angeles County Almanac, "Population by City, 1910-1950"). Hollywood and its hills have not been a city of their own since the 1910 annexation, so their signs name the **City of Los Angeles** and use its 1930 figure, 1,238,048. Santa Monica was 37,146 and Culver City 5,669. A different figure or name is one edit in `REGIONS`.

| Region | Sign | Subtitle | Population |
|---|---|---|---|
| Hollywood Boulevard | HOLLYWOOD | City of Los Angeles | 1,238,048 |
| Hollywood Bowl | HOLLYWOOD HILLS | City of Los Angeles | 1,238,048 |
| Griffith Observatory | GRIFFITH PARK | City of Los Angeles | 1,238,048 |
| Santa Monica Pier | SANTA MONICA | By the Sea | 37,146 |
| Monarch Pictures studio lot | CULVER CITY | Heart of Screenland | 5,669 |

## Building a new region

1. Build the place (its scene, art and entrance), and give it the first-arrival story content.
2. In `REGIONS`, set `playable: true`. From then on the map lets the player travel there (`travelStatus` returns `ready` when the fare can be paid).
3. In `AppShell.travelFromMap`, load the region's scene under the second screen fade (today it only shows the sign, since the Boulevard is the only scene). Make the region's own depot (or stop) the way back.
4. Add the region's welcome-sign wording to the catalog if it changes (`content.region.<id>.name / city / subtitle`).

## The art

See `art/prompts/hollywoodland-map.md` (brief, prompt and provenance). The picture has no text; names and status are drawn by the game. If the picture is regenerated or replaced, redraw the polygons in `WorldMap.ts` over the new art.

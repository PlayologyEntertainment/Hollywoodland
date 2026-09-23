# The Boulevard Art Director tool

How to move, restyle, and re-art the Hollywood Boulevard scene — its four
parallax planes (sky, hills, distant buildings, ground), the row of street
building modules that forms the street wall, its foreground props (palms,
streetlamps, the sedan), and the interactable locations along it (position,
interaction radius, prompt text, and sign wording/style) — and see the
change land in the running game, with no prompting and no code change.

> **v3 layout (September 2026).** The street wall is no longer one stretched
> plane: it is nine separately generated building modules (`buildings` in the
> manifest), the ground is a repeating tile, and every plane is drawn at a
> uniform `scale` rather than stretched to the world width. Four buildings
> also carry an active-state texture that the scene swaps in by time slot or
> world flag (`activePath` + `activeWhen`). The art itself is finished WebP
> made outside this tool, so the tool edits **positions and scale only** for
> the planes and buildings. See `art/prompts/boulevard-entrances-v3.md`.

Saved edits take effect the next time you (re-)start or continue a career
from the main menu — the game re-fetches the manifest at that point, even
in a tab that's been open the whole time. It does *not* hot-reload while
you're already mid-play; back out to the menu first.

Modeled on Otaku Palace's Art Director tool, adapted for the fact that
Hollywoodland's Boulevard is a Phaser canvas scene, not a DOM/React screen:
instead of Otaku Palace's Layout mode (which drags real DOM boxes over an
embedded live copy of the actual screen), this tool's **Layout** mode drags
elements over a self-contained canvas mockup it draws itself — good enough
to place things by eye, but not a pixel-exact stand-in for the real Phaser
render (blend modes, glow, and the sign's vector trim are simplified). It
has three modes, switched with the **Art** / **Locations** / **Layout**
buttons in the header.

## Why this exists

Before this tool, every plane offset, prop position, sign position, and
sign label lived as a hardcoded constant inside
`src/game/scenes/BoulevardSpikeScene.ts` — moving a streetlamp or
relettering a sign meant a code change. All of that now lives in
[`public/data/boulevard-manifest.json`](../../public/data/boulevard-manifest.json),
loaded at runtime by `BoulevardBootScene` before the Boulevard scene starts
(see `src/game/BoulevardManifest.ts` for the schema and validation, and
`docs/PHASE_1_VISUAL_SPIKE.md`/`art/prompts/boulevard-five-plane-v2.md` for
how the plane art itself was produced). The tool is the only thing meant to
edit that file by hand.

## 1. Start the dev server

```
npm run dev
```

## 2. Open the tool

Visit **http://localhost:5173/Hollywoodland/tools/art-director/index.html**
in Chrome, Edge, or another Chromium browser (it uses the File System
Access API, which needs a secure context — `localhost` counts, `file://`
mostly doesn't, and Firefox/Safari don't support it yet).

Click **Open Project Folder…** and pick the repository root (the folder
containing `public/`, `art/`, `src/`). Grant read/write access. The tool
remembers the folder for next time (you may need to re-approve the
permission prompt each session — that's the browser's security model, not
a bug).

## 3. Art mode — planes and props

The sidebar lists the **4 parallax planes** (sky, hills, distant buildings,
sidewalk/street — fixed, can't be added or removed), the **street
buildings** (the nine modules of the street wall — fixed, position and scale
only), and **foreground props** (palms, streetlamps, the sedan — a free-form
list you can add to, remove from, or duplicate by hand-editing the fields
after adding).

Selecting a slot shows:

- **Position & rendering fields** — for a plane: X/Y offset, scale, scroll
  factor (parallax speed — 0 never scrolls, 1 scrolls at the same rate as
  the player), and depth (draw order; higher draws on top). For a building:
  X (left edge), Y (bottom edge, a few pixels below the ground line so the
  sidewalk covers the overlap), scale, and depth. For a prop: X/Y position,
  scale, flip, and depth. These are plain numbers here — drag
  them into place instead from **Layout** mode (§5), which edits the same
  underlying fields.
- **Position-only art.** Anything whose art is a finished `.webp` (every
  v3 plane and every building) hides the crop and upload controls below and
  the **Remove art** button, because that workflow writes PNG bytes to the
  slot's path and can delete the file. Only the position fields and **Save
  to project** are shown. A building with an active-state texture also
  shows its rule; edit `activeWhen` in the manifest JSON (see *Manifest
  shape*).
- **Crop from reference sheet** — pick a sheet (the sidebar's **Reference
  sheet** dropdown lists every sheet the manifest knows about, plus any you
  upload this session) and drag/resize a box over it, the same crop-box
  interaction as Otaku Palace's tool. Useful once you're painting several
  props on one canvas and want to cut them apart here instead of exporting
  each one separately.
- **Upload a PNG** — drag-and-drop or browse to a standalone file, for art
  painted separately.

Unlike Otaku Palace's tool, there's no resize-to-target-dimensions step:
every plane and prop is displayed by Phaser at a size computed from its own
offset/scale fields, not a fixed pixel output, so whatever you crop or
upload is saved as-is.

### Adding or removing a prop

**➕ Add prop** creates a new entry with placeholder position/path values —
give it real art (crop or upload) and adjust its position fields before
saving, or the game will fail to load a texture for it. **Delete this
prop** (in a prop's own detail view, not available for the fixed planes or buildings)
removes its manifest entry; it doesn't delete the art file already on disk
for it.

### Save

**Save to project** writes:

- the crop/upload straight to the path the game already loads it from
  (`public/<path>`, e.g. `public/assets/environments/foreground/hollywood-palm-v1.png`),
  and
- the edited position/rendering fields, plus the source (which sheet/rect,
  or "uploaded"), back into `public/data/boulevard-manifest.json`.

**Remove art** deletes that slot's output file and clears its captured
state back to "original" — for one of the fixed planes this leaves the
scene with a missing texture until you save new art, since (unlike Otaku
Palace's optional UI chrome) every plane is required for the scene to
render.

## 4. Locations mode — the interactable points

The sidebar lists the Boulevard's fixed interactable locations: the eight
street entrances (Bellhaven Rooms, The Silver Thimble, The Gilded Spoon,
the alley, The Celestial Palace, Sunset Casting Exchange, The Klieg Light,
the Monarch Pictures gate) plus two lot-access points (the extras corral and
the soundstage) that sit inside the Monarch gate module until the studio-lot
map exists. Their ids are `boarding-house`, `costume-shop`, `diner`,
`alley`, `celestial-palace`, `casting-office`, `klieg-light-office`,
`backlot-gate`, `extras-corral`, and `soundstage`. This tool only lets you edit the ones that already
exist — adding a new one that does something new still needs a domain
event wired into `BoulevardSpikeScene.ts`'s `enterLocation()` switch (and
its id added to `BoulevardLocationId`/`LOCATION_IDS` in
`BoulevardManifest.ts`), the same "wired vs reserved" honesty Otaku
Palace's tool uses for slots that aren't rendered by any component yet.

Selecting one shows:

- **Position & prompt** — its X position along the Boulevard, the
  proximity radius that triggers the "Press E" prompt, the prompt label
  text itself, and **Enterable**. Four entrances (The Silver Thimble, the
  alley, The Celestial Palace, The Klieg Light) are not enterable yet: their
  sign shows but there is no prompt and nothing to press E on, until their
  scene is written. Where two trigger zones overlap, the nearer door wins.
- **Sign** — the sign's wording (use `\n` for a line break, matching
  how "SUNSET CASTING / EXCHANGE" stacks onto two lines), its X/Y position,
  font size, panel width/height, and text/board color. **Text only**
  (the setting for all v3 signs) draws just the lettering on the blank
  panel already painted into the building art; turned off, the scene draws
  the original hanging board with rivets and a glow. The alley and the two
  lot-access points have no sign of their own.

Display label and the location's identity itself (which domain event it
fires) aren't editable — same reasoning as above.

### Save

**Save to project** writes the location's fields straight into
`public/data/boulevard-manifest.json`. Back out to the main menu and
start/continue a career in the game to see the change.

## 5. Layout mode — live drag

Click **🖱️ Layout** in the header. This is the same position data as Art
mode's fields and Locations mode's X/prompt/sign fields, but placed by
dragging on a canvas instead of typing numbers.

The canvas is a from-scratch composite the tool draws itself from the
manifest's current planes, props, signs, and location markers — not the
real Phaser scene — so it's faithful for placement but not for final visual
judgment (check the preview pane or your own game tab for that). It's
scrollable at 1:1 pixel scale, the same drag-to-scroll-via-scrollbar
interaction as Art mode's crop canvas, since the Boulevard is far wider
than any screen.

A dashed green line marks **y = 1080**, where the real camera's viewport
actually ends — the camera's vertical bounds never scroll, so anything
below that line is off-screen in the running game no matter how the player
moves. The canvas itself is drawn taller than that when a prop's position
needs the room (the sedan, for one), purely so it stays visible and
draggable here; that extra canvas height is a tool convenience, not
something the game ever shows.

- **Buildings, props, signs, and location markers** are directly clickable and
  draggable — click one on the canvas (or in the sidebar) and drag. A
  location marker only moves horizontally (locations live on the ground
  line, not at an arbitrary height), so its Y field is disabled.
- Every location marker is ringed by a translucent, true-to-scale circle
  showing its **interaction radius** — the field is still a typed number
  (not draggable itself), but the circle updates the moment you move the
  marker or edit the radius field elsewhere, so you can see at a glance
  whether an edit actually changed anything instead of only being able to
  confirm it by walking up to it in the game.
- **Planes** cover the entire canvas, so clicking one on the canvas would
  always just select whichever plane happens to be on top — pick a plane
  from the sidebar first, then drag anywhere on the canvas to nudge its
  offset. The mockup draws each plane at its uniform scale as it appears
  with the camera at the far left; in the game the sky, hills and distant
  buildings scroll slower than the street, so their on-screen position
  shifts as the player walks.
- The panel below the canvas shows the selected element's X/Y as live,
  editable numbers (typing works too, not just dragging), plus an **Edit
  full details →** button that jumps to that element's full field editor in
  Art or Locations mode.

### Save

Dragging only updates positions in memory — nothing touches disk until you
click **Save to project**, which writes the whole manifest in one shot
(Layout mode never touches art files, only position numbers). Back out to
the main menu and start/continue a career in the game to see the change.

## 6. The preview pane

The right-hand pane is a plain iframe pointed at your local dev server
(defaults to `http://127.0.0.1:5173/Hollywoodland/`) with **Load** and a
refresh button — not a live drag surface, just a fast way to flip over and
check a save without alt-tabbing. Drag the divider to resize it.

## Manifest shape

See `src/game/BoulevardManifest.ts` for the authoritative TypeScript types
and validation (`isBoulevardManifest`) — the scene falls back to
`DEFAULT_BOULEVARD_MANIFEST` (the same v3 street, kept identical to the
committed JSON by `tests/boulevard-manifest.test.ts`) if the file is
missing or fails validation, so a bad hand-edit degrades safely instead of
crashing the scene.

A building's active state is `activePath` (the alternate texture) plus
`activeWhen`, `{ "timeSlots": [...], "flag": null | "discoveredCastingOffice" }`:
the alternate art shows while the current time slot is listed **or** the
flag is set. Both must be set together or both null. Currently: The Gilded
Spoon is open in the morning and evening, The Celestial Palace is lit in the
evening, Sunset Casting Exchange is open in the morning and afternoon, and
the Monarch gate opens once the casting office has been discovered.

## Interim: the studio lot

The slice design puts the extras corral, soundstage, wardrobe department and
screen-test space **behind the Monarch gate**, on a small second map that
does not exist yet. Until it does, the extras corral and soundstage stay
playable as two extra trigger zones inside the gate module (the guard booth
and the right-hand wing), so the existing critical path is not broken. They
have no signs; when the lot map exists, move them there and drop the two
`locations` entries.

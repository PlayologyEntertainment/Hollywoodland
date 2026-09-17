# The Boulevard Art Director tool

How to move, restyle, and re-art the Hollywood Boulevard scene — its five
parallax planes, its foreground props (palms, streetlamps, the sedan), and
the interactable locations along it (position, interaction radius, prompt
text, and hanging-sign wording/style) — and see the change land in the
running game, with no prompting and no code change.

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

Visit **http://localhost:5173/hollywoodland/tools/art-director/index.html**
in Chrome, Edge, or another Chromium browser (it uses the File System
Access API, which needs a secure context — `localhost` counts, `file://`
mostly doesn't, and Firefox/Safari don't support it yet).

Click **Open Project Folder…** and pick the repository root (the folder
containing `public/`, `art/`, `src/`). Grant read/write access. The tool
remembers the folder for next time (you may need to re-approve the
permission prompt each session — that's the browser's security model, not
a bug).

## 3. Art mode — planes and props

The sidebar lists the **5 parallax planes** (sky, hills, distant buildings,
main architecture, sidewalk/street — fixed, can't be added or removed) and
**foreground props** (palms, streetlamps, the sedan — a free-form list you
can add to, remove from, or duplicate by hand-editing the fields after
adding).

Selecting a slot shows:

- **Position & rendering fields** — for a plane: X/Y offset, scroll factor
  (parallax speed — 0 never scrolls, 1 scrolls at the same rate as the
  player), and depth (draw order; higher draws on top). For a prop: X/Y
  position, scale, flip, and depth. These are plain numbers here — drag
  them into place instead from **Layout** mode (§5), which edits the same
  underlying fields.
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
prop** (in a prop's own detail view, not available for the 5 fixed planes)
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
state back to "original" — for one of the 5 fixed planes this leaves the
scene with a missing texture until you save new art, since (unlike Otaku
Palace's optional UI chrome) every plane is required for the scene to
render.

## 4. Locations mode — the interactable points

The sidebar lists the Boulevard's fixed interactable locations (boarding
house, casting office, diner, backlot gate, extras corral, soundstage, and
any added since). This tool only lets you edit the ones that already
exist — adding a new one that does something new still needs a domain
event wired into `BoulevardSpikeScene.ts`'s `enterLocation()` switch (and
its id added to `BoulevardLocationId`/`LOCATION_IDS` in
`BoulevardManifest.ts`), the same "wired vs reserved" honesty Otaku
Palace's tool uses for slots that aren't rendered by any component yet.

Selecting one shows:

- **Position & prompt** — its X position along the Boulevard, the
  proximity radius that triggers the "Press E" prompt, and the prompt
  label text itself.
- **Hanging sign** — the sign's wording (use `\n` for a line break, matching
  how the existing signs stack "SUNSET / CASTING / EXCHANGE" onto three
  lines), its X/Y position, font size, board width/height, and text/board
  color. The sign's frame trim, rivets, and glow are still fixed Phaser
  vector drawing, not exposed here — this is "text + basic style", not a
  full re-skin.

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

- **Props, signs, and location markers** are directly clickable and
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
  offset.
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
(defaults to `http://127.0.0.1:5173/hollywoodland/`) with **Load** and a
refresh button — not a live drag surface, just a fast way to flip over and
check a save without alt-tabbing. Drag the divider to resize it.

## Manifest shape

See `src/game/BoulevardManifest.ts` for the authoritative TypeScript types
and validation (`isBoulevardManifest`) — the scene falls back to
`DEFAULT_BOULEVARD_MANIFEST` (the exact pre-tool hardcoded layout) if the
file is missing or fails validation, so a bad hand-edit degrades safely
instead of crashing the scene.

# The Story Planner

A stand-alone page for seeing everything the game has written and for planning the story above it. It lives at
`tools/story-planner/index.html`, deliberately **outside `public/`** so that neither the tool nor your unreleased story plan is
copied into the production build or uploaded to the live site. Open it from the dev server
(`http://127.0.0.1:5173/Hollywoodland/tools/story-planner/index.html`) or as a file, then point it at the project folder with
**Open Project Folder…** (Chrome or Edge; it uses the File System Access API). Without a folder it still reads from the dev
server, and Save downloads the files instead.

## The three files it works with (all in `tools/story-planner/data/`, also not shipped)

| File | Who writes it | What it holds |
|---|---|---|
| `narrative-snapshot.json` | `npm run narrative:export` (never by hand) | Everything the game has written: dialogue trees, quests, cast, locations, origins, housing, assignments, talents, items, auditions. Every piece of text is addressed by its catalog key (the same `content.*` keys as `src/locales/en.json`), with its English and whether each translation is current, stale or missing. |
| `story-plan.json` | The tool | The plan: **Chapters > Storylines (arcs) > Beats**. A beat has a summary, a status (idea, outlined, drafted, in-game), cast, locations, notes, and links to quests, dialogue and assignments. |
| `story-edits.json` | The tool | Pending edits to existing game text, as `{ key, before, after, note }`. |

## Editing existing text

Edits are **not** written into the game's source. The tool records them in `story-edits.json`; nothing changes in the game
until they are applied. To apply: save in the tool, then ask Claude to apply the pending story edits. That step changes the
authored text, runs `npm run i18n:sync`, re-translates and re-stamps the changed strings (they show as stale in every
language until then), runs `npm run narrative:export`, and runs the tests. The **Edits** tab's "Copy apply instructions"
button writes that request out. An edit whose new text is already the game's text is cleared automatically on the next load.

## Keeping the snapshot current

`tests/narrative-snapshot.test.ts` fails when the committed snapshot no longer matches the content or the translations. After
changing game text, dialogue, quests, assignments and so on, or re-stamping translations, run `npm run narrative:export`.

## The tabs

Story Plan (the outline and beat editor), Dialogue (every conversation in reading order, with conditions and effects),
Quests, Cast & World, Other Content, Edits (pending changes, with a word diff), Coverage (status per chapter and storyline,
beats with nothing written, content the plan does not mention, broken links, translation freshness), Export (Markdown of the
plan and content, including pending edits). The search box finds text anywhere in the game's content.

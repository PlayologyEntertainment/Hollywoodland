---
name: scan-assets
description: Find visual assets Hollywoodland's code/data already references but that don't exist on disk yet, then generate reviewable source art for them via the gg-image bridge. Use when asked to find/generate missing art, or after adding a character, location, or UI element that will need one.
---

# scan-assets

Detects missing art for this repo and produces *reviewable source assets*
for it -- it never writes directly into `public/assets/`. This repo's own
`docs/CONTENT_AND_ASSET_PIPELINE.md` requires human approval, cleanup, and
a provenance record for every generated asset before it becomes a runtime
file; this skill's job ends at "here's a candidate and its prompt record,"
not "here's what's live in the game."

## Prerequisite

This drives the `gg-image` skill (from the separate `GG` bridge repo) to
actually generate images. If asking for an image fails because no such
skill is available, tell the user to install it (`GG/skills/gg-image/install.sh`,
requires a one-time `codex login`) rather than trying to call any image API
yourself.

## Step 1 -- scan

```bash
node <skill-dir>/scripts/scan-assets.mjs --cwd "/absolute/path/to/hollywoodland" --json
```

Same `<skill-dir>` rule as any other skill: the absolute directory
containing *this* `SKILL.md`, taken from the path your tool used to load
it -- never guessed. This is a pure detector: it regex-scans `src/**/*.ts`,
`public/data/**/*.json`, and `index.html` for `assets/...` path literals
and reports which ones have no matching file under `public/`. It writes
nothing and calls no network. If it reports nothing missing, stop here.

## Step 2 -- for each missing asset, write a prompt

Read `docs/CONTENT_AND_ASSET_PIPELINE.md` first (visual bible in §2, the
category conventions in §3-5) -- every prompt must follow it: romanticized
1935 Hollywood, exaggerated retro-cartoon anatomy, the established palette
rules, side-view parallax scale where relevant, no baked gameplay text, no
likenesses of real people.

Open the referencing file/line the scan reported to recover context (a
character's name/role, an `alt` string, a location's id) and write one
self-contained prompt from it, the same way the `gg-image` skill's own
prompt-writing rules require -- don't reuse one generic prompt across
several missing assets.

For style consistency, pass `--reference` at an existing on-style asset of
the same category when one exists -- e.g. another `public/assets/characters/*.webp`
portrait for a new character, or `art/Hollywoodland_Concept_*.png` /
`public/assets/environments/*.webp` for a new environment. `gg-image`
accepts `.webp`/`.png`/`.jpg` references directly.

## Step 3 -- generate to a review location, never straight to public/assets

```bash
node <path-to-GG-repo>/skills/gg-image/scripts/gg-image.mjs generate --prompt "..." --reference "public/assets/characters/existing-example.webp" --out "art/generated/<slug>.png" --cwd "/absolute/path/to/hollywoodland" --json
```

`art/generated/` (create it if missing) is this repo's staging area for
unreviewed sources, parallel to the existing `art/` concept boards and
`art/prompts/` briefs -- never the pipeline doc's approved-and-optimized
`public/assets/`. Runtime assets in this repo are `.webp`; `gg-image` only
emits `.png`. Converting, optimizing, and promoting into `public/assets/`
is a manual step for a human to do after review -- this skill does not do
it and does not touch existing files.

Use `gg-image`'s `batch` mode (concurrency capped at 4) when the scan found
more than 2-3 missing assets, instead of looping `generate` calls.

## Step 4 -- record provenance

For every asset generated, write `art/prompts/<slug>.md` capturing the
fields `docs/CONTENT_AND_ASSET_PIPELINE.md` §8 requires: `asset_id`,
`asset_type`, `prompt_or_brief`, `reference_asset_ids`, `generation_tool_and_version`
(`gpt-image-2` via `gg-image`), `generation_date`, `raw_source_location`
(the `art/generated/...` path), `human_edits` (`none yet`), `review_status`
(`pending review`), `rights_or_license_notes`, `runtime_files` (`not yet
promoted`). `art/prompts/boulevard-five-plane-v2.md` is this repo's
existing example of the format. Never set `review_status` to anything but
pending, and never edit an existing asset's record -- that's the human
reviewer's call.

## Reporting back

Summarize what's missing, what was generated, and where -- and be explicit
that everything under `art/generated/` is an unreviewed draft awaiting the
cleanup/approval steps in `docs/CONTENT_AND_ASSET_PIPELINE.md` §1 and §9,
not something already wired into the game.

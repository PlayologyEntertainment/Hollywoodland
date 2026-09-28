# Localization plan

Status: **Open questions resolved 2026-09-28; awaiting owner approval to build. No code has been written.**

## Owner decisions (2026-09-28)

| Question | Decision |
| --- | --- |
| Launch languages | Spanish (`es`), French (`fr`), German (`de`), Brazilian Portuguese (`pt-BR`) |
| CJK | The engine must fully support multi-byte Asian text now, but no Asian language ships in the first release. CJK is proven with a pseudo-locale and a test-only sample locale. Japanese, Simplified Chinese and Korean later need only translation files. |
| Translation source | AI first draft, then native-speaker review. Every locale file carries a review status, and unreviewed languages are labelled in the picker or held back from release. |
| Scope | All game text in one release: UI, HUD, settings, toasts, quests, talents, items, assignments, performances, relationships and dialogue graphs. |
| CJK fonts | System font fallback (no font download). |
| Plan location | This file. Add a `docs/DECISION_LOG.md` entry when the plan is approved. |
| Legal text | Translate the Terms of Service and Privacy Policy like everything else. |
| Proper names | Keep character, business and place names (Bellhaven, Sunset Casting Exchange, the cast) identical in every language. |
| Unreviewed languages | Selectable in the picker, labelled "Beta" until a native reviewer marks them `reviewed`. |
| i18n library | None. Hand-written `t()` on the built-in `Intl` APIs. |
| Out of scope | Right-to-left languages (Arabic, Hebrew); voice-over (the game has none); translating player-typed text (character and save names). |

## What has to be translated

Measured from the repository:

- **Authored content, about 150 KB across `src/domain/`:** `DialogueGraphs.ts` (39 KB), `QuestDefinitions.ts`, `TalentDefinitions.ts`, `PerformanceDefinitions.ts`, `AssignmentDefinitions.ts`, `InventoryDefinitions.ts`, `RelationshipDefinitions.ts`, `PlayerCharacters.ts`. Each holds English strings next to stable ids (`id: 'drama-1'`, `speaker`, `text`, `label`, `title`, `description`, `name`).
- **UI chrome:** `index.html` (about 32 KB, including the long Terms of Service and Privacy Policy dialogs) plus about 20 places in `src/app/AppShell.ts` that assign `textContent` or call `toast(...)`, including template strings such as `possessiveTitle(name, 'Career')`, "Delete "<name>"? This can't be undone.", "In progress: <title> — m:ss left".
- **Phaser scene:** `BoulevardSpikeScene.ts` draws no Phaser text objects, so scene text is DOM-only. That is a big simplification.
- **Images with baked text:** the Hollywoodland logo and splash art. These are brand art, so keep them in English. Any future baked text needs per-locale art.

Content already separates ids from text, and the validators (`src/content/*Validator.ts`) already check ids and references. The Technical Implementation Plan (line 90) even lists "absent localization text" as a validator responsibility that does not exist yet.

## Design

### 1. String catalogs

- One JSON catalog per locale under `src/locales/<locale>.json`, plus `en.json` as the source of truth.
- Two kinds of keys:
  - **UI keys**, hand-named: `settings.language`, `save.deleteConfirm`, `hud.day`.
  - **Content keys**, derived from ids, so authors never invent them: `dialogue.casting-office-intro.root.text`, `dialogue.<graph>.<node>.choice.<choice>.label`, `talent.drama-1.name`, `quest.<id>.stage.<stage>.description`.
- **Content definitions keep English inline as the fallback.** A resolver `t(key, params)` looks up the active locale, then English, then falls back to the inline text. Nothing breaks if a translation is missing.
- Lazy-load catalogs: only English is bundled. A chosen locale is fetched as a JSON chunk on demand, so the bundle stays small.

### 2. i18n runtime (`src/i18n/`)

- `I18n` service with `locale`, `t(key, params)`, `setLocale(locale)`, and a `locale-changed` event on the existing `DomainEventBus`.
- ICU-style placeholders (`{name}`, `{count}`) and plural rules through the built-in `Intl.PluralRules`. No new dependency is needed. Add `{name}` interpolation and `plural` selection myself, or take a small library if you prefer.
- Formatting through `Intl`: `NumberFormat` for money and percentages, `DateTimeFormat` for save timestamps (currently `toLocaleString(undefined, …)`, which already follows the browser and must follow the chosen locale instead), `ListFormat` for reward lists, and `Intl.Segmenter` where text has to be split (CJK line-breaking and truncation).
- Possessives such as `possessiveTitle(name, 'Career')` become whole-sentence keys ("Career de {name}" and so on), because English `'s` does not transfer.

### 3. Settings row

- New `language` field in `GameSettings` (`src/settings/Settings.ts`), stored and normalized like the others, default `"auto"`.
- A `Language` `<select>` row in `#settings-dialog`, with each language named in its own script ("Español", "Français", "Deutsch", "Português (Brasil)"), never translated, so a player who cannot read the current language can still find their own.
- `auto` picks the browser's `navigator.languages` match at first run and otherwise English. The choice persists in settings.
- **Applying live:** on change, load the catalog, then re-render every text-bearing surface. The shell already re-renders from `career-state-changed` and has `renderCareerState`, so add one `locale-changed` handler that re-runs the static-markup pass and the state render. An open dialogue or dialog re-renders in place.

### 4. Static markup in `index.html`

- Tag translatable elements with `data-i18n="key"` (and `data-i18n-attr="aria-label:key"` for attributes), and apply them in one pass at startup and on `locale-changed`.
- Keep English in the HTML as the no-JS fallback and as the source for the extractor.
- Set `<html lang>` to the active locale so screen readers, hyphenation and font selection behave.

### 5. CJK and multi-byte readiness (built now, shipped later)

- **Fonts:** extend the `--deco-font` and body stacks with per-language `:lang()` fallbacks, for example `:lang(ja)` → `'Yu Gothic', 'Hiragino Sans', 'Noto Sans CJK JP', sans-serif`, with the equivalents for `zh-Hans` and `ko`. Limelight and Playfair have no CJK glyphs, so headings in a CJK locale fall to the system face. The deco look will not match there, which was your accepted trade-off.
- **CSS that assumes Latin:** audit `text-transform: uppercase` (harmless), `letter-spacing` on labels (`.hud-label` uses `.22em`, which looks wrong for CJK, so zero it under `:lang(ja|zh|ko)`), `white-space: nowrap` on HUD values, `font-style: italic` and `font-synthesis: none`.
- **Wrapping:** `line-break: strict` / `word-break: keep-all` for Korean, and let Japanese and Chinese wrap between characters.
- **Text size setting:** applies as it does now, and should still work at 150%.
- **Proof without shipping a language:** a `pseudo` locale (accented, ~40% longer strings, for layout stress) plus a **test-only `ja` sample** (a few dozen real strings) to verify glyph rendering, wrapping and the settings dropdown end to end. Neither appears in the player-facing list.

### 6. Content pipeline and validation

- **Extractor script** (`tools/extract-strings`): walks the definitions and `index.html` and writes/updates `en.json`, with a source hash per string so stale translations are detected when the English changes.
- **Validator:** extend `ContentValidator.ts` so the build fails on missing keys in a *release-ready* locale, placeholder mismatches (`{name}` present in English but not in the translation), plural-form gaps, and unused keys. Unreviewed locales warn instead of failing.
- **AI drafting workflow:** a script prompts the Claude API per string with context (speaker, scene, 1935 Hollywood tone, the glossary), writing `review_status: "ai-draft"` into the catalog. A short **glossary** (`docs/localization/glossary.md`) locks names and recurring terms; character and place names stay untranslated unless you decide otherwise.
- **Review:** native reviewers edit the JSON, flip the status to `reviewed`, and 

### 7. Saves and analytics

- Saves store ids and state, not display strings, so switching language mid-career works for existing saves. Confirm this with a save round-trip test. Any English text stored in saves (default save labels such as "Autosave", if they are persisted) need a stable key rather than a stored string.
- Player-typed names stay as typed.
- Analytics never sends text; nothing to change beyond noting the locale is not collected.

### 8. Legal text

The Terms of Service and Privacy Policy dialogs are translated with the rest of the game. Because they are legal documents, the plan adds three safeguards:

- Each translated legal dialog shows a short notice at the top, in the reader's language, saying the English version is the one that governs if there is any difference.
- Legal strings carry their own review status. AI drafts of them stay marked Beta like the rest, and it is worth having a qualified reviewer (ideally with legal knowledge) sign off before a language leaves Beta.
- The glossary locks legal terms such as "Playology Entertainment", data-related phrases and the contact details, and the extractor flags any change to the English legal text so translations are re-reviewed.

## Work breakdown

The scope is "all at once", so this is ordered by dependency, not by release:

1. **Foundation:** `I18n` service, catalog loader, `Intl` helpers, `language` setting and dropdown, `locale-changed` event, `<html lang>`. Tests for lookup, fallback, plurals and interpolation.
2. **UI chrome extraction:** `index.html` `data-i18n` pass and the `AppShell.ts` strings, with tests updated (see risks).
3. **Content extraction:** key derivation and the extractor for all `*Definitions.ts` and `DialogueGraphs.ts`; render code reads through `t(...)`.
4. **Validation:** the missing-key, placeholder and staleness checks in the content validator and CI.
5. **CJK readiness:** `:lang()` font stacks, CSS audit, pseudo-locale, test-only `ja` sample, a layout check at 100% and 150% text scale.
6. **AI drafts and glossary:** generate es, fr, de and pt-BR catalogs as `ai-draft`.
7. **Review and release:** native review per language, then flip to `reviewed`. Each language ships out of Beta when its review is done, even though the code lands all at once.

## Risks and open questions

- **About 25 of the 55 test files assert on source-code text** (`toContain("…")` against `AppShell.ts`, `index.html`, `styles.css`). Moving strings into catalogs will break many of them. Plan a mechanical rewrite that asserts on keys and `en.json` values instead, and do it in the same change as each extraction step.
- **Text expansion:** German and French run 20–40% longer than English. HUD, buttons and the notice bands (recently restyled) need layout checks, and the pseudo-locale is how we catch them.
- **Live switching in the middle of a dialogue** needs the current node re-rendered with the same choices selected. Test it.
- **Voice and tone:** the 1935 idiom ("swell", "for Pete's sake") has no clean equivalents. The glossary and native review matter more here than for ordinary UI copy.
- **AI translation cost and quality:** about 150 KB × 4 languages. It is a one-time cost, but the dialogue needs the most review time.
- **Bundle size:** lazy-loaded catalogs keep this small, but the total catalog size per language is roughly the size of the source text.

## Decisions log

All four earlier open questions are answered (see the table at the top). One caution remains from the legal decision: machine-translated legal text can misstate rights or obligations, so the "English governs" notice and a qualified review before leaving Beta are part of the plan.

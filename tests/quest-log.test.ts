// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { buildQuestLog } from '../src/app/QuestLog';
import { createDefaultCareerState, type CareerState } from '../src/domain/CareerState';
import { completeQuestStage, startQuest, type QuestDef } from '../src/domain/Quests';

const read = (path: string): string => (readFileSync(new URL(path, import.meta.url), 'utf8') as string).replace(/\r\n/g, '\n');
const css = read('../src/styles.css');
const indexHtml = read('../index.html');
const appShell = read('../src/app/AppShell.ts');

const quest = (id: string, title: string, stages = 1, prerequisites?: QuestDef['prerequisites']): QuestDef => ({
  id,
  title,
  summary: '',
  ...(prerequisites !== undefined ? { prerequisites } : {}),
  stages: Array.from({ length: stages }, (_, index) => ({ id: `s${index + 1}`, description: `Stage ${index + 1} of ${title}` })),
});

const QUESTS: QuestDef[] = [quest('a', 'Alpha'), quest('b', 'Bravo', 2), quest('c', 'Charlie'), quest('d', 'Delta')];

/** Starts a quest and finishes every stage of it. */
function finish(state: CareerState, target: QuestDef): CareerState {
  let next = startQuest(state, target, QUESTS, []);
  for (const stage of target.stages) next = completeQuestStage(next, target, stage.id);
  return next;
}

const start = (state: CareerState, target: QuestDef): CareerState => startQuest(state, target, QUESTS, []);
const titles = (state: CareerState): string[] => buildQuestLog(state, QUESTS, []).map((entry) => entry.title);

describe('buildQuestLog', () => {
  it('lists every available quest in the game\'s order when none are completed', () => {
    expect(titles(createDefaultCareerState())).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta']);
  });

  it('moves a completed quest below the open ones, and drops it to the bottom of the list', () => {
    const state = finish(createDefaultCareerState(), QUESTS[0] as QuestDef);
    expect(titles(state)).toEqual(['Bravo', 'Charlie', 'Delta', 'Alpha']);
    expect(buildQuestLog(state, QUESTS, []).map((entry) => entry.completed)).toEqual([false, false, false, true]);
  });

  it('keeps each group in the game\'s own quest order, however the quests were finished', () => {
    let state = createDefaultCareerState();
    // Finished in the order Delta, then Bravo (out of quest order).
    state = finish(state, QUESTS[3] as QuestDef);
    state = finish(state, QUESTS[1] as QuestDef);
    expect(titles(state)).toEqual(['Alpha', 'Charlie', 'Bravo', 'Delta']);
  });

  it('keeps a quest that is in progress among the open ones, and shows its current stage', () => {
    let state = start(createDefaultCareerState(), QUESTS[1] as QuestDef);
    state = finish(state, QUESTS[0] as QuestDef);
    const entries = buildQuestLog(state, QUESTS, []);
    expect(entries.map((entry) => entry.title)).toEqual(['Bravo', 'Charlie', 'Delta', 'Alpha']);
    expect(entries[0]).toMatchObject({ label: 'Stage 1 of Bravo', completed: false });
    expect(entries[3]).toMatchObject({ label: 'Completed', completed: true });
  });

  it('says Available for a quest not yet started', () => {
    expect(buildQuestLog(createDefaultCareerState(), QUESTS, [])[0]).toMatchObject({ label: 'Available', completed: false });
  });

  it('still hides locked quests', () => {
    const locked = quest('e', 'Echo', 1, [{ kind: 'quest-status', questId: 'a', status: 'completed' }]);
    const all = [...QUESTS, locked];
    expect(buildQuestLog(createDefaultCareerState(), all, []).map((entry) => entry.title)).not.toContain('Echo');
    let state = startQuest(createDefaultCareerState(), all[0] as QuestDef, all, []);
    state = completeQuestStage(state, all[0] as QuestDef, "s1");
    // Once Alpha is completed, Echo unlocks: it is open, so it comes before the completed Alpha.
    expect(buildQuestLog(state, all, []).map((entry) => entry.title)).toEqual(['Bravo', 'Charlie', 'Delta', 'Echo', 'Alpha']);
  });
});

describe('the Status panel redesign, first pass', () => {
  it('has no inner frame: the frame rule belongs to dialogs only, and the panel keeps its one edge line', () => {
    expect(css).not.toMatch(/\.drawer::before/);
    expect(css).toMatch(/\ndialog::before \{[^}]*inset: \.5rem;[^}]*border: 1px solid/);
    expect(css).toMatch(/\n\.drawer \{[^}]*border-left: 1px solid var\(--gold\)/);
  });

  it('has a small square Close button in the header buttons\' outline style, not the big rounded one', () => {
    const block = css.match(/\n#close-status \{([^}]*)\}/)?.[1] ?? '';
    expect(block).toContain('width: 2rem');
    expect(block).toContain('height: 2rem');
    expect(block).toContain('border-radius: 0');
    expect(block).toContain('border: 1px solid rgb(216 173 88 / 55%)');
    expect(block).toMatch(/font-size: 1\.15rem/);
    expect(indexHtml).toContain('id="close-status"');
    expect(indexHtml).toContain('aria-label="Close career status"');
  });

  it('titles the Settings dialog just "Settings", with no Close button (the backdrop click closes it instead)', () => {
    expect(indexHtml).toMatch(/<div class="drawer-heading"><h2 id="settings-title">Settings<\/h2><\/div>/);
    const section = indexHtml.slice(indexHtml.indexOf('id="settings-dialog"'), indexHtml.indexOf('</dialog>', indexHtml.indexOf('id="settings-dialog"')));
    expect(section).not.toContain('<button value="cancel"');
    expect(appShell).toMatch(/settingsDialog\.addEventListener\('click', \(event\) => \{\s*if \(event\.target === settingsDialog\) settingsDialog\.close\(\);/);
  });

  it('scrolls .settings-form, not the <dialog> itself, so the inner frame line never drifts from the outer border', () => {
    // dialog::before draws the inner frame line, absolutely positioned within <dialog>. If <dialog> were the element that
    // scrolled, that line would scroll away with the content once the window got too short for it. Scrolling .settings-form
    // instead, capped at the same height as <dialog> (one shared variable, so the two can't drift apart), keeps <dialog>
    // itself static, so both lines always resize and move together.
    const dialogBlock = css.match(/\ndialog \{([^}]*)\}/)?.[1] ?? '';
    expect(dialogBlock).toMatch(/--dialog-max-h:\s*90vh/);
    expect(dialogBlock).toMatch(/--dialog-border:\s*1px/);
    expect(dialogBlock).toMatch(/max-height:\s*var\(--dialog-max-h\)/);
    const formBlock = css.match(/\n\.settings-form \{([^}]*)\}/s)?.[1] ?? '';
    // .settings-form fills <dialog>'s content box, less its own margin (--settings-gap, see the next test), so its own cap
    // has to stop short of --dialog-max-h by both <dialog>'s top+bottom border and .settings-form's own top+bottom margin —
    // otherwise it is that much taller than the room <dialog> actually has for it, and <dialog> grows a second, all-but-empty
    // scrollbar of its own alongside the form's real one.
    expect(formBlock).toMatch(/max-height:\s*calc\(var\(--dialog-max-h\)\s*-\s*2\s*\*\s*var\(--dialog-border\)\s*-\s*2\s*\*\s*var\(--settings-gap\)\)/);
    // overflow-y alone would silently promote overflow-x to auto too (CSS's visible/non-visible axis rule), a second, latent
    // scrollbar waiting for anything to overflow sideways.
    expect(formBlock).toMatch(/overflow:\s*hidden auto/);
  });

  it('keeps .settings-form\'s scrollbar and its scrolled content off the inner frame line, alike on all 4 sides', () => {
    // A scrollbar only ever occupies space inside its own element's box, and overflow clipping only ever happens at that
    // element's own edge — so .settings-form (not just its scrollbar) needs a real MARGIN pulling its own box clear of
    // dialog::before's .5rem line, on every side alike, or a checkbox row straddling that edge mid-scroll looks like it
    // crosses the line just as much as an unstyled scrollbar would. An earlier attempt only widened the line's right inset
    // (for the scrollbar alone) and left the other 3 sides unfixed and asymmetric; this margin fixes all 4 sides the same way.
    const formBlock = css.match(/\n\.settings-form \{([^}]*)\}/s)?.[1] ?? '';
    expect(formBlock).toMatch(/--settings-gap:\s*\.75rem/);
    expect(formBlock).toMatch(/margin:\s*var\(--settings-gap\)/);
    expect(formBlock).toMatch(/scrollbar-width:\s*thin/);
    expect(formBlock).toMatch(/scrollbar-color:\s*rgb\(216 173 88 \/ 55%\) transparent/);
    expect(css).toMatch(/\n\.settings-form::-webkit-scrollbar \{ width: \.55rem; \}/);
    expect(css).toMatch(/\n\.settings-form::-webkit-scrollbar-thumb \{[^}]*background: rgb\(216 173 88 \/ 55%\);/);
    // The generic frame line itself is untouched (uniform .5rem, same as the other 3 dialogs) — no #settings-dialog::before
    // override left over from the asymmetric attempt.
    expect(css).not.toContain('#settings-dialog::before');
  });

  it('scrolls .audition-dialog\'s .story-card, not the <dialog> itself, so the Screen Test dialog gets the same fix as Settings', () => {
    // The Screen Test (Read the Room audition) dialog had the same inner-frame-line drift bug as Settings: its
    // .story-card has no .scene-panel wrapper already handling the scroll (unlike the interaction and Home Hub
    // dialogs), so it fell back to the base `dialog` rule's own overflow: auto, and dialog::before's frame line
    // scrolled away with a long category list or debrief instead of staying put on the dialog's own fixed border.
    const dialogBlock = css.match(/\n\.audition-dialog \{([^}]*)\}/)?.[1] ?? '';
    expect(dialogBlock).toContain('overflow: hidden');
    expect(css).toMatch(/\n\.audition-dialog\[open\] \{ display: flex; flex-direction: column; \}/);
    const cardBlock = css.match(/\n\.audition-dialog \.story-card \{([^}]*)\}/s)?.[1] ?? '';
    expect(cardBlock).toMatch(/overflow-y:\s*auto/);
    expect(cardBlock).toMatch(/min-height:\s*0/);
    expect(cardBlock).toMatch(/scrollbar-width:\s*thin/);
  });

  it('draws a completed quest green, with a tick, and takes a brighter green in high contrast', () => {
    expect(css).toMatch(/:root \{[^}]*--complete-rgb: 143 209 158;/);
    expect(css).toMatch(/body\.high-contrast \{[^}]*--complete-rgb: 96 255 140;/);
    const block = css.match(/\n\.status-quests li\.quest-complete \{([^}]*)\}/)?.[1] ?? '';
    expect(block).toContain('color: rgb(var(--complete-rgb))');
    expect(block).toContain('border-color: rgb(var(--complete-rgb) / 55%)');
    expect(block).toContain('background: rgb(var(--complete-rgb) / 12%)');
    // The tick is decoration: given empty alt text so a screen reader does not read "check mark" before every title.
    expect(css).toMatch(/\.status-quests li\.quest-complete::before \{[^}]*content: '\\2713' \/ '';/);
  });

  it('renders the quest log from the pure builder, marking completed rows', () => {
    expect(appShell).toContain('buildQuestLog(state, ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_ITEMS)');
    expect(appShell).toContain("item.classList.toggle('quest-complete', entry.completed)");
    expect(appShell).toContain('${entry.title} — ${entry.label}');
  });

  it('gives an unlocked talent the same green/tick treatment as a completed quest', () => {
    const block = css.match(/\n\.talent-list li\.talent-unlocked \{([^}]*)\}/)?.[1] ?? '';
    expect(block).toContain('color: rgb(var(--complete-rgb))');
    expect(block).toContain('border-color: rgb(var(--complete-rgb) / 55%)');
    expect(block).toContain('background: rgb(var(--complete-rgb) / 12%)');
    expect(css).toMatch(/\.talent-list li\.talent-unlocked::before \{[^}]*content: '\\2713' \/ '';/);
    expect(appShell).toContain("if (unlocked) item.classList.add('talent-unlocked');");
  });
});

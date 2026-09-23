// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const appShell = readFileSync(new URL('../src/app/AppShell.ts', import.meta.url), 'utf8') as string;

describe('the Save Options dialog', () => {
  const dialog = indexHtml.match(/<dialog id="save-options-dialog"[\s\S]*?<\/dialog>/)?.[0] ?? '';

  it('provides a JS-populated skeleton: a close button, a New Save form, an Import button, and the slot list', () => {
    expect(dialog).toContain('id="save-options-close"');
    expect(dialog).toContain('id="save-new-form"');
    expect(dialog).toContain('id="save-new-label"');
    expect(dialog).toContain('id="save-import-button"');
    expect(dialog).toContain('id="save-slot-empty"');
    expect(dialog).toContain('id="save-slot-list"');
  });

  it('uses the same drawer-heading/legal-dialog shell as the legal pages, so it gets a real close button', () => {
    expect(dialog).toContain('class="legal-dialog save-options-dialog"');
    expect(dialog).toMatch(/<div class="drawer-heading">\s*<h2 id="save-options-title">Save Options<\/h2>/);
  });
});

describe('Save Options wiring', () => {
  it('lists every save slot, newest first, instead of hardcoding one manual/autosave pair', () => {
    expect(appShell).toContain('private async renderSaveSlots(screens: MenuScreens): Promise<void>');
    expect(appShell).toContain('this.options.onListSaves()');
    expect(appShell).toMatch(/\.sort\(\(a, b\) => Date\.parse\(b\.savedAt\) - Date\.parse\(a\.savedAt\)\)/);
  });

  it('gives every slot Load, Export and Delete actions, and a rename field', () => {
    expect(appShell).toContain("private buildSaveSlotRow(save: SaveEnvelope<CareerState>, screens: MenuScreens): HTMLLIElement");
    expect(appShell).toContain('this.options.onRenameSave(');
    expect(appShell).toContain('this.options.onLoadSave(');
    expect(appShell).toContain('this.options.onExportSave(');
    expect(appShell).toContain('this.options.onDeleteSave(');
  });

  it('imports a file as a brand new slot rather than loading it directly', () => {
    expect(appShell).toMatch(/private async importSave\(fileInput: HTMLInputElement, screens: MenuScreens\): Promise<void> \{/);
    expect(appShell).not.toMatch(/importSave[\s\S]{0,400}this\.enterGame/);
  });
});

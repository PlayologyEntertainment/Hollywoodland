// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { SCREEN_TEST_COMPLETE_SFX_FILE } from '../src/audio/AudioCues';
import { SCREEN_TEST_AUDITION } from '../src/domain/PerformanceDefinitions';
import { ALL_AUDITION_OUTCOMES } from '../src/domain/Performance';
import { LOCALES } from '../src/i18n/locales';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8') as string;
const html = read('../index.html');
const css = read('../src/styles.css');
const shell = read('../src/app/AppShell.ts');

describe('the Screen Test dialog', () => {
  it('has one Perform button on the questions, disabled until answered, and Continue only on the results', () => {
    const form = html.match(/<form id="audition-form">[\s\S]*?<\/form>/)?.[0] ?? '';
    expect(form.match(/<button/g)).toHaveLength(1);
    expect(form).toMatch(/id="audition-submit"[^>]*disabled/);
    expect(form).toContain('>Perform<');
    const debrief = html.match(/<div id="audition-debrief"[\s\S]*?<\/div>\s*<\/div>\s*<\/dialog>/)?.[0] ?? '';
    expect(debrief).toContain('id="audition-continue"');
    expect(debrief).toContain('hidden');
    expect(html.match(/id="audition-continue"/g)).toHaveLength(1);
  });

  it('really hides the results until the test is performed, despite display: grid', () => {
    expect(css).toMatch(/\.audition-debrief\[hidden\] \{ display: none; \}/);
  });

  it('cancels when the backdrop is clicked, but not when the click lands inside the dialog box', () => {
    expect(shell).toContain("auditionDialog.addEventListener('click'");
    expect(shell).toMatch(/if \(event\.target !== auditionDialog\) return;/);
    expect(shell).toContain('getBoundingClientRect()');
    expect(shell).toContain('if (outside) auditionDialog.close();');
  });

  it('plays the completion sound when the results appear', () => {
    expect(SCREEN_TEST_COMPLETE_SFX_FILE).toBe('assets/audio/ScreenTestComplete.mp3');
    expect(() => read('../public/' + SCREEN_TEST_COMPLETE_SFX_FILE)).not.toThrow();
    expect(shell).toContain('playSfx(SCREEN_TEST_COMPLETE_SFX_FILE)');
  });

  it('awards 50 percent more XP than before, rounding half up', () => {
    const xp = (outcome: (typeof ALL_AUDITION_OUTCOMES)[number]): number => {
      const grant = SCREEN_TEST_AUDITION.outcomeEffects[outcome].find((effect) => effect.kind === 'xp-grant');
      return grant?.kind === 'xp-grant' ? grant.amount : 0;
    };
    expect(xp('breakthrough')).toBe(60); // was 40
    expect(xp('promising-complication')).toBe(38); // was 25; 37.5 rounded half up
    expect(xp('wrong-role-right-notice')).toBe(30); // was 20
    expect(xp('memorable-setback')).toBe(15); // was 10
  });

  it('explains the results: each line names what it is for, with a score total and the rewards', () => {
    expect(shell).toContain("t(`audition.source.${factor.source}`)");
    expect(shell).toContain("t('audition.scoreNote')");
    expect(shell).toContain("t('audition.scoreTotal'");
    expect(shell).toContain("t('audition.rewards'");
  });

  it('has the new result wording in every language', () => {
    for (const locale of LOCALES) {
      const catalog = JSON.parse(read(`../src/locales/${locale.code}.json`)) as Record<string, string>;
      for (const key of ['audition.scoreNote', 'audition.scoreTotal', 'audition.rewards', 'audition.source.delivery']) {
        expect(catalog[key], `${locale.code} ${key}`).toBeTruthy();
      }
    }
  });
});

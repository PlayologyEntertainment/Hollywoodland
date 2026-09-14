import { assertElement } from '../shared/assert';

type AttributeKey = 'presence' | 'craft' | 'wit' | 'nerve' | 'grit';

interface Origin {
  readonly id: string;
  readonly name: string;
  readonly blurb: string;
  readonly deltas: Partial<Record<AttributeKey, number>>;
}

export interface CharacterChoices {
  readonly name: string;
  readonly originId: string;
  readonly skinToneIndex: number;
  readonly appearance: Readonly<Record<string, number>>;
}

const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  presence: 'Presence',
  craft: 'Craft',
  wit: 'Wit',
  nerve: 'Nerve',
  grit: 'Grit',
};
const BASE_ATTRIBUTE_VALUE = 5;
const MAX_ATTRIBUTE_VALUE = 10;

/** Deltas sourced from docs/DRAFT_TRACK_B_CANON_PROPOSAL.md §3 — keep in
 * sync if that document's origin list changes. */
const ORIGINS: readonly Origin[] = [
  { id: 'small-town-hopeful', name: 'Small-Town Hopeful', blurb: 'Left a Midwest county for the first time.', deltas: { grit: 1, wit: -1 } },
  { id: 'vaudeville-trouper', name: 'Vaudeville Trouper', blurb: 'Grew up in a touring stage family.', deltas: { craft: 1, grit: -1 } },
  { id: 'runaway-society-name', name: 'Runaway Society Name', blurb: 'Walked out on a wealthy, controlling family.', deltas: { presence: 1 } },
  { id: 'immigrant-striver', name: 'Immigrant Striver', blurb: 'Arrived by ship and rail, still finding footing.', deltas: { grit: 1, presence: -1 } },
  { id: 'studio-lot-hand-me-down', name: 'Studio-Lot Hand-Me-Down', blurb: 'Mending costumes on the lot, finally auditioning.', deltas: { wit: 1, nerve: -1 } },
];

const SKIN_TONES: readonly string[] = ['#f5d3ab', '#e0b28c', '#c48a5e', '#8f5a34', '#5b3a22'];

const CYCLER_OPTIONS: Readonly<Record<string, readonly string[]>> = {
  face: ['Face 1', 'Face 2', 'Face 3'],
  hair: ['Hair 1', 'Hair 2', 'Hair 3'],
  eyes: ['Eyes 1', 'Eyes 2', 'Eyes 3'],
  outfit: ['Outfit 1', 'Outfit 2', 'Outfit 3'],
  hat: ['None', 'Fedora', 'Newsboy Cap'],
  accessory: ['None', 'Pocket Watch', 'Scarf'],
  voice: ['Voice 1', 'Voice 2', 'Voice 3'],
};

interface CyclerBinding {
  readonly valueOutput: HTMLOutputElement;
  readonly prevButton: HTMLButtonElement;
  readonly nextButton: HTMLButtonElement;
}

/**
 * The Character Creator screen shown after "Enter Hollywood" and before the
 * Boulevard scene. Visual-only for this pass (per owner direction): choices
 * are collected and handed to onStartCareer, not yet persisted to a save
 * schema. Appearance cyclers (face/hair/eyes/outfit/hat/accessory/voice) are
 * fully interactive but don't yet change the live preview — there's only one
 * character sprite so far; the UI is ready for when more art arrives.
 */
export class CharacterCreator {
  private skinToneIndex = 0;
  private originIndex = 0;
  private readonly cyclerIndices: Record<string, number> = Object.fromEntries(
    Object.keys(CYCLER_OPTIONS).map((key) => [key, 0]),
  );

  public mount(onStartCareer: (choices: CharacterChoices) => void, onBack: () => void): void {
    const nameInput = assertElement('#creator-name', HTMLInputElement);
    const skinRow = assertElement('#creator-skin-tones', HTMLElement);
    const originGrid = assertElement('#creator-origins', HTMLElement);
    const attributeList = assertElement('#creator-attributes', HTMLElement);
    const portrait = assertElement('#creator-portrait', HTMLElement);
    portrait.style.setProperty(
      '--creator-portrait-src',
      `url(${import.meta.env.BASE_URL}assets/characters/aspiring-actor-walk.webp)`,
    );

    this.buildSkinTones(skinRow);
    this.buildOrigins(originGrid, attributeList);
    this.renderAttributes(attributeList);
    const cyclers = this.buildCyclers();

    assertElement('#creator-randomize', HTMLButtonElement).addEventListener('click', () => {
      (skinRow.children[Math.floor(Math.random() * SKIN_TONES.length)] as HTMLButtonElement).click();
      (originGrid.children[Math.floor(Math.random() * ORIGINS.length)] as HTMLButtonElement).click();
      for (const [key, binding] of Object.entries(cyclers)) {
        const optionCount = CYCLER_OPTIONS[key]?.length ?? 0;
        const steps = Math.floor(Math.random() * optionCount);
        for (let i = 0; i < steps; i += 1) binding.nextButton.click();
      }
    });

    assertElement('#creator-back', HTMLButtonElement).addEventListener('click', onBack);
    assertElement('#creator-start', HTMLButtonElement).addEventListener('click', () => {
      onStartCareer({
        name: nameInput.value.trim(),
        originId: this.getCurrentOrigin().id,
        skinToneIndex: this.skinToneIndex,
        appearance: { ...this.cyclerIndices },
      });
    });
  }

  private buildSkinTones(skinRow: HTMLElement): void {
    SKIN_TONES.forEach((color, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'swatch';
      button.style.background = color;
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', String(index === this.skinToneIndex));
      button.setAttribute('aria-label', `Skin tone ${index + 1}`);
      button.addEventListener('click', () => {
        this.skinToneIndex = index;
        for (const child of Array.from(skinRow.children)) child.setAttribute('aria-checked', 'false');
        button.setAttribute('aria-checked', 'true');
      });
      skinRow.appendChild(button);
    });
  }

  private buildOrigins(originGrid: HTMLElement, attributeList: HTMLElement): void {
    ORIGINS.forEach((origin, index) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'origin-card';
      card.setAttribute('role', 'radio');
      card.setAttribute('aria-checked', String(index === this.originIndex));
      const name = document.createElement('strong');
      name.textContent = origin.name;
      const blurb = document.createElement('span');
      blurb.textContent = origin.blurb;
      card.append(name, blurb);
      card.addEventListener('click', () => {
        this.originIndex = index;
        for (const child of Array.from(originGrid.children)) child.setAttribute('aria-checked', 'false');
        card.setAttribute('aria-checked', 'true');
        this.renderAttributes(attributeList);
      });
      originGrid.appendChild(card);
    });
  }

  private buildCyclers(): Record<string, CyclerBinding> {
    const bindings: Record<string, CyclerBinding> = {};
    for (const [key, options] of Object.entries(CYCLER_OPTIONS)) {
      const row = document.querySelector(`[data-cycler="${key}"]`);
      if (row === null) continue;
      const valueOutput = row.querySelector('.cycler-value') as HTMLOutputElement;
      const prevButton = row.querySelector('.cycler-prev') as HTMLButtonElement;
      const nextButton = row.querySelector('.cycler-next') as HTMLButtonElement;
      const setIndex = (index: number): void => {
        const normalized = (index + options.length) % options.length;
        this.cyclerIndices[key] = normalized;
        valueOutput.value = options[normalized] ?? '';
      };
      prevButton.addEventListener('click', () => setIndex((this.cyclerIndices[key] ?? 0) - 1));
      nextButton.addEventListener('click', () => setIndex((this.cyclerIndices[key] ?? 0) + 1));
      bindings[key] = { valueOutput, prevButton, nextButton };
    }
    return bindings;
  }

  private getCurrentOrigin(): Origin {
    const origin = ORIGINS[this.originIndex];
    if (origin === undefined) throw new Error(`Invalid origin index: ${this.originIndex}`);
    return origin;
  }

  private renderAttributes(container: HTMLElement): void {
    const origin = this.getCurrentOrigin();
    container.replaceChildren();
    for (const key of Object.keys(ATTRIBUTE_LABELS) as AttributeKey[]) {
      const value = BASE_ATTRIBUTE_VALUE + (origin.deltas[key] ?? 0);
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      dt.textContent = ATTRIBUTE_LABELS[key];
      const bar = document.createElement('div');
      bar.className = 'attribute-bar';
      const fill = document.createElement('span');
      fill.style.width = `${(value / MAX_ATTRIBUTE_VALUE) * 100}%`;
      bar.appendChild(fill);
      const dd = document.createElement('dd');
      dd.textContent = String(value);
      row.append(dt, bar, dd);
      container.appendChild(row);
    }
  }
}

import { ORIGINS, BASE_ATTRIBUTE_VALUE, MAX_ATTRIBUTE_VALUE, type AttributeKey, type Origin } from '../domain/Origins';
import { PLAYER_CHARACTERS, type PlayerCharacter, type PlayerCharacterId } from '../domain/PlayerCharacters';
import { assertElement } from '../shared/assert';
import { assetUrl } from '../shared/assetUrl';

export interface CharacterChoices {
  readonly name: string;
  readonly originId: string;
  /** Which ready-made character the player picked. */
  readonly characterId: PlayerCharacterId;
}

const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  presence: 'Presence',
  craft: 'Craft',
  wit: 'Wit',
  nerve: 'Nerve',
  grit: 'Grit',
};

/**
 * The Character Creator screen shown after "Enter Hollywood" and before the
 * Boulevard scene. The player types a name, picks one of six ready-made
 * characters from the headshots on the left (the full-size portrait of the
 * chosen one shows in the centre), and picks an origin on the right. The
 * character decides the headshot, portrait and walk cycle only; the choices
 * are collected and handed to onStartCareer.
 */
export class CharacterCreator {
  private characterIndex = 0;
  private originIndex = 0;

  public mount(onStartCareer: (choices: CharacterChoices) => void, onBack: () => void): void {
    const nameInput = assertElement('#creator-name', HTMLInputElement);
    const characterGrid = assertElement('#creator-characters', HTMLElement);
    const originGrid = assertElement('#creator-origins', HTMLElement);
    const attributeList = assertElement('#creator-attributes', HTMLElement);
    const portrait = assertElement('#creator-portrait', HTMLImageElement);

    this.buildCharacters(characterGrid, portrait);
    this.showCharacter(characterGrid, portrait);
    this.buildOrigins(originGrid, attributeList);
    this.renderAttributes(attributeList);

    // Fetch the other portraits now, so switching characters does not wait on the network.
    for (const character of PLAYER_CHARACTERS) {
      new Image().src = assetUrl(character.portrait);
      new Image().src = assetUrl(character.reflection);
    }

    assertElement('#creator-back', HTMLButtonElement).addEventListener('click', onBack);
    assertElement('#creator-start', HTMLButtonElement).addEventListener('click', () => {
      onStartCareer({
        name: nameInput.value.trim(),
        originId: this.getCurrentOrigin().id,
        characterId: this.getCurrentCharacter().id,
      });
    });
  }

  /** The six headshots, as a radio group: click or press an arrow key to choose. Characters without a walk cycle drawn to
   * match their own portrait are disabled, since picking one would put an unmatched body on the Boulevard; arrow-key
   * navigation skips over them. */
  private buildCharacters(characterGrid: HTMLElement, portrait: HTMLImageElement): void {
    const choose = (index: number, focus: boolean): void => {
      this.characterIndex = index;
      this.showCharacter(characterGrid, portrait);
      if (focus) (characterGrid.children[index] as HTMLElement | undefined)?.focus();
    };
    /** The next available (hasInGameArt) index at or beyond `index` in the given direction, or `index` itself if none is. */
    const nextAvailable = (index: number, step: 1 | -1): number => {
      for (let candidate = index; candidate >= 0 && candidate < PLAYER_CHARACTERS.length; candidate += step) {
        if (PLAYER_CHARACTERS[candidate]?.hasInGameArt === true) return candidate;
      }
      return index;
    };
    PLAYER_CHARACTERS.forEach((character, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'character-choice';
      button.disabled = !character.hasInGameArt;
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-label', character.label);
      const image = document.createElement('img');
      image.src = assetUrl(character.headshot);
      image.alt = '';
      image.draggable = false;
      button.appendChild(image);
      button.addEventListener('click', () => choose(index, false));
      button.addEventListener('keydown', (event) => {
        const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
        if (step === 0) return;
        event.preventDefault();
        const next = nextAvailable(index + step, step);
        if (PLAYER_CHARACTERS[next]?.hasInGameArt === true) choose(next, true);
      });
      characterGrid.appendChild(button);
    });
  }

  /** Marks the chosen headshot and shows that character's full-size portrait. Only the chosen headshot is in the tab order,
   * as in any radio group; disabled headshots are never focusable. */
  private showCharacter(characterGrid: HTMLElement, portrait: HTMLImageElement): void {
    const chosen = this.getCurrentCharacter();
    Array.from(characterGrid.children).forEach((child, index) => {
      const selected = index === this.characterIndex;
      child.setAttribute('aria-checked', String(selected));
      child.setAttribute('tabindex', selected && PLAYER_CHARACTERS[index]?.hasInGameArt === true ? '0' : '-1');
    });
    portrait.src = assetUrl(chosen.portrait);
    portrait.alt = chosen.label;
    assertElement('#creator-reflection', HTMLImageElement).src = assetUrl(chosen.reflection);
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

  private getCurrentCharacter(): PlayerCharacter {
    const character = PLAYER_CHARACTERS[this.characterIndex];
    if (character === undefined) throw new Error(`Invalid character index: ${this.characterIndex}`);
    return character;
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

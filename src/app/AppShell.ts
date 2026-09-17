import type Phaser from 'phaser';

import { CharacterCreator, type CharacterChoices } from './CharacterCreator';
import { createDefaultCareerState, createInitialCareerState, type CareerState, type IdentityState } from '../domain/CareerState';
import { isChoiceAvailable, type DialogueChoice, type DialogueGraph, type DialogueNode } from '../domain/Dialogue';
import { CASTING_OFFICE_DIALOGUE, DINER_DIALOGUE, LANDLADY_DIALOGUE, PRODUCTION_COORDINATOR_DIALOGUE, RIVAL_DIALOGUE, SCENE_PARTNER_DIALOGUE } from '../domain/DialogueGraphs';
import type { AuditionResolvedPayload, DomainEventBus } from '../domain/DomainEventBus';
import { hasItem, type InventoryItemDefinition } from '../domain/Inventory';
import { ALL_ITEMS } from '../domain/InventoryDefinitions';
import { deriveAttributes } from '../domain/Origins';
import type { AuditionCategory, AuditionChoices, AuditionDefinition, AuditionFactor, AuditionOutcome } from '../domain/Performance';
import { getAuditionById } from '../domain/PerformanceDefinitions';
import { ALL_QUESTS } from '../domain/QuestDefinitions';
import { canUnlockTalent, isTalentUnlocked, xpRequiredForNextLevel, type ProgressionState, type TalentDefinition } from '../domain/Progression';
import { getActiveStage, getQuestStatus } from '../domain/Quests';
import { deriveRelationshipLabel, type RelationshipAxes, type RelationshipLabel } from '../domain/Relationships';
import { ALL_RELATIONSHIP_CHARACTERS, type RelationshipCharacterDef } from '../domain/RelationshipDefinitions';
import { ALL_TALENTS, getTalentById } from '../domain/TalentDefinitions';
import { weekdayForDay } from '../domain/TimeSystem';
import type { GameSettings } from '../settings/Settings';
import { assertElement } from '../shared/assert';

function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

interface LocationSceneArt {
  readonly background: string;
  readonly character: { readonly src: string; readonly alt: string };
}

/** Visual-novel-style scene art for a location's dialogue: a location
 * background with a character portrait overlaid on top, composited in
 * openDialogue()/applySceneArt(). Only populated for locations with
 * approved runtime art (see docs/CONTENT_AND_ASSET_PIPELINE.md's approval
 * gates). */
const LOCATION_SCENE_ART: Partial<Record<string, LocationSceneArt>> = {
  'casting-office': {
    background: assetUrl('assets/locations/casting-office.webp'),
    character: { src: assetUrl('assets/characters/casting-gatekeeper.webp'), alt: 'The casting-office clerk' },
  },
  'boarding-house': {
    background: assetUrl('assets/locations/boarding-house.webp'),
    character: { src: assetUrl('assets/characters/landlady.webp'), alt: 'The boarding-house landlady' },
  },
  diner: {
    background: assetUrl('assets/locations/diner.webp'),
    character: { src: assetUrl('assets/characters/diner-confidant.webp'), alt: 'The counter girl at the Sunset Diner' },
  },
  'backlot-gate': {
    background: assetUrl('assets/locations/backlot-gate.webp'),
    character: { src: assetUrl('assets/characters/rival.webp'), alt: 'The rival at the backlot gate' },
  },
  'extras-corral': {
    background: assetUrl('assets/locations/extras-corral.webp'),
    character: { src: assetUrl('assets/characters/production-coordinator.webp'), alt: 'The production coordinator' },
  },
  soundstage: {
    background: assetUrl('assets/locations/soundstage.webp'),
    character: { src: assetUrl('assets/characters/scene-partner.webp'), alt: 'The scene partner' },
  },
};

interface MenuScreens {
  readonly titlePanel: HTMLElement;
  readonly playHud: HTMLElement;
  readonly menuBackdrop: HTMLElement;
  readonly statusBar: HTMLElement;
}

interface AppShellOptions {
  readonly settings: GameSettings;
  readonly domainEvents: DomainEventBus;
  readonly onSettingsChanged: (settings: GameSettings) => void;
  /** Creates the Phaser game on first call (deferred until the player
   * actually enters play) and reuses it on subsequent calls. */
  readonly onStart: (state?: CareerState) => Phaser.Game;
  readonly onStop: () => void;
  readonly onSave: () => Promise<void>;
  readonly onLoad: () => Promise<CareerState | undefined>;
  readonly onExport: () => string;
  readonly onImport: (raw: string) => Promise<CareerState>;
}

const TIME_SLOT_LABELS: Record<CareerState['time']['slot'], string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

const AUDITION_OUTCOME_LABELS: Record<AuditionOutcome, string> = {
  breakthrough: 'Breakthrough',
  'promising-complication': 'Promising Complication',
  'wrong-role-right-notice': 'Wrong Role, Right Notice',
  'memorable-setback': 'Memorable Setback',
};

function capitalizeRelationshipLabel(label: RelationshipLabel): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatRelationshipAxes(axes: RelationshipAxes): string {
  const parts = [`Trust ${axes.trust}`, `Tension ${axes.tension}`];
  if (axes.attraction !== null) parts.push(`Attraction ${axes.attraction}`);
  if (axes.obligation !== 0) parts.push(`Obligation ${axes.obligation > 0 ? '+' : ''}${axes.obligation}`);
  return parts.join(' · ');
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatItemCategory(category: InventoryItemDefinition['category']): string {
  return category.split('-').map(capitalize).join(' ');
}

/** A locked talent names its blocker — a same-branch prerequisite, or
 * otherwise its point cost — rather than being omitted from the list the
 * way a locked quest is: a talent tree is the player's own plan for their
 * character, not narrative content that would spoil by being previewed. */
function formatTalentRequirement(talent: TalentDefinition): string {
  if (talent.prerequisiteId !== null) {
    const prerequisite = getTalentById(talent.prerequisiteId);
    return `Requires ${prerequisite?.name ?? talent.prerequisiteId}`;
  }
  return `${talent.cost} point${talent.cost === 1 ? '' : 's'}`;
}

export class AppShell {
  private settings: GameSettings;
  private fpsTimer = 0;
  private game: Phaser.Game | undefined;
  private careerState: CareerState = createDefaultCareerState();
  private activeDialogueGraph: DialogueGraph | undefined;
  private activeDialogueNodeId: string | undefined;
  private activeAudition: AuditionDefinition | undefined;
  private auditionChoices: AuditionChoices = {};

  public constructor(private readonly options: AppShellOptions) {
    this.settings = options.settings;
  }

  public mount(): void {
    this.applySettings(this.settings);
    const screens: MenuScreens = {
      titlePanel: assertElement('#title-panel', HTMLElement),
      playHud: assertElement('#play-hud', HTMLElement),
      menuBackdrop: assertElement('#menu-backdrop', HTMLElement),
      statusBar: assertElement('#status-bar', HTMLElement),
    };
    const characterCreator = assertElement('#character-creator', HTMLElement);
    const newCareer = assertElement('#new-career', HTMLButtonElement);
    const continueCareer = assertElement('#continue-career', HTMLButtonElement);
    const settingsDialog = assertElement('#settings-dialog', HTMLDialogElement);
    const statusButton = assertElement('#status-button', HTMLButtonElement);
    const statusPanel = assertElement('#status-panel', HTMLElement);
    const fileInput = assertElement('#save-file-input', HTMLInputElement);

    this.options.domainEvents.on('interaction-proximity-changed', ({ visible, label }) => {
      assertElement('#interaction-prompt', HTMLElement).hidden = !visible;
      assertElement('#interaction-prompt-label', HTMLElement).textContent = label;
    });
    this.options.domainEvents.on('casting-office-entered', () => {
      this.openDialogue(CASTING_OFFICE_DIALOGUE, 'Sunset Casting Exchange', 'casting-office');
      this.announce('You entered the Sunset Casting Exchange.');
    });
    this.options.domainEvents.on('diner-entered', () => {
      this.openDialogue(DINER_DIALOGUE, 'Sunset Diner', 'diner');
      this.announce('You entered the Sunset Diner.');
    });
    this.options.domainEvents.on('boarding-house-entered', () => {
      this.openDialogue(LANDLADY_DIALOGUE, 'The Boarding House', 'boarding-house');
      this.announce('You entered the boarding house.');
    });
    this.options.domainEvents.on('backlot-gate-entered', () => {
      this.openDialogue(RIVAL_DIALOGUE, 'The Backlot Gate', 'backlot-gate');
      this.announce('You reached the backlot gate.');
    });
    this.options.domainEvents.on('extras-corral-entered', () => {
      this.openDialogue(PRODUCTION_COORDINATOR_DIALOGUE, 'The Extras Corral', 'extras-corral');
      this.announce('You checked in at the extras corral.');
    });
    this.options.domainEvents.on('soundstage-entered', () => {
      this.openDialogue(SCENE_PARTNER_DIALOGUE, 'The Soundstage', 'soundstage');
      this.announce('You stepped onto the soundstage.');
    });
    this.options.domainEvents.on('career-state-changed', (state) => {
      this.careerState = state;
      this.renderCareerState(state);
    });
    this.options.domainEvents.on('audition-resolved', (payload) => this.renderAuditionDebrief(payload));
    assertElement('#interaction-dialog', HTMLDialogElement).addEventListener('close', () => {
      this.activeDialogueGraph = undefined;
      this.activeDialogueNodeId = undefined;
    });
    assertElement('#audition-dialog', HTMLDialogElement).addEventListener('close', () => {
      this.activeAudition = undefined;
      this.auditionChoices = {};
    });
    assertElement('#audition-form', HTMLFormElement).addEventListener('submit', (event) => this.submitAudition(event));
    assertElement('#audition-continue', HTMLButtonElement).addEventListener('click', () => {
      assertElement('#audition-dialog', HTMLDialogElement).close();
    });

    newCareer.addEventListener('click', () => {
      screens.titlePanel.hidden = true;
      screens.menuBackdrop.hidden = true;
      characterCreator.hidden = false;
    });
    new CharacterCreator().mount(
      (choices) => {
        characterCreator.hidden = true;
        const state = this.buildInitialState(choices);
        this.renderCareerState(state);
        this.startGame(screens, state);
      },
      () => {
        characterCreator.hidden = true;
        screens.titlePanel.hidden = false;
        screens.menuBackdrop.hidden = false;
      },
    );
    continueCareer.addEventListener('click', async () => {
      const state = await this.options.onLoad();
      if (state !== undefined) this.renderCareerState(state);
      this.startGame(screens, state);
      this.toast('Career restored');
    });
    assertElement('#return-menu', HTMLButtonElement).addEventListener('click', () => {
      screens.playHud.hidden = true;
      screens.titlePanel.hidden = false;
      screens.menuBackdrop.hidden = false;
      screens.statusBar.hidden = true;
      this.options.onStop();
      newCareer.focus();
    });

    assertElement('#open-settings', HTMLButtonElement).addEventListener('click', () => {
      this.populateSettingsForm();
      settingsDialog.showModal();
    });
    settingsDialog.addEventListener('close', () => {
      if (settingsDialog.returnValue !== 'confirm') return;
      this.settings = this.readSettingsForm();
      this.applySettings(this.settings);
      this.options.onSettingsChanged(this.settings);
      this.toast('Settings saved');
    });
    assertElement('#text-scale', HTMLInputElement).addEventListener('input', (event) => {
      const input = event.currentTarget as HTMLInputElement;
      assertElement('#text-scale-output', HTMLOutputElement).value = `${input.value}%`;
    });

    statusButton.addEventListener('click', () => this.openStatus(statusPanel, statusButton));
    assertElement('#close-status', HTMLButtonElement).addEventListener('click', () => this.closeStatus(statusPanel, statusButton));
    assertElement('#film-mode', HTMLButtonElement).addEventListener('click', (event) => this.toggleFilmMode(event.currentTarget as HTMLButtonElement));
    assertElement('#fullscreen', HTMLButtonElement).addEventListener('click', () => void this.toggleFullscreen());
    assertElement('#advance-time', HTMLButtonElement).addEventListener('click', () => this.options.domainEvents.emit('advance-time-requested', undefined));
    assertElement('#manual-save', HTMLButtonElement).addEventListener('click', () => void this.save());
    assertElement('#export-save', HTMLButtonElement).addEventListener('click', () => this.exportSave());
    assertElement('#import-save', HTMLButtonElement).addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => void this.importSave(fileInput, screens));
  }

  public async refreshContinue(): Promise<void> {
    try {
      assertElement('#continue-career', HTMLButtonElement).disabled = (await this.options.onLoad()) === undefined;
    } catch {
      assertElement('#continue-career', HTMLButtonElement).disabled = true;
    }
  }

  private startGame(screens: MenuScreens, state?: CareerState): void {
    screens.titlePanel.hidden = true;
    screens.playHud.hidden = false;
    screens.menuBackdrop.hidden = true;
    screens.statusBar.hidden = false;
    const isFirstStart = this.game === undefined;
    this.game = this.options.onStart(state);
    if (isFirstStart) this.startFpsMeter(this.game);
    this.announce('Hollywood Boulevard. Use A and D or arrow keys to move. Press E near the casting office.');
  }

  private buildInitialState(choices: CharacterChoices): CareerState {
    const identity: IdentityState = {
      name: choices.name,
      originId: choices.originId,
      skinToneIndex: choices.skinToneIndex,
      appearance: choices.appearance,
    };
    return createInitialCareerState(identity, deriveAttributes(choices.originId));
  }

  private openDialogue(graph: DialogueGraph, location: string, locationId: string): void {
    this.activeDialogueGraph = graph;
    this.activeDialogueNodeId = graph.rootNodeId;
    assertElement('#dialogue-location', HTMLElement).textContent = location;
    this.applySceneArt(locationId);
    this.renderDialogueNode();
    assertElement('#interaction-dialog', HTMLDialogElement).showModal();
  }

  /** Toggles the visual-novel scene layout (background + overlaid character
   * to its left, dialogue panel to the right) for locations with approved
   * runtime art; other locations keep the plain text-only dialogue card. */
  private applySceneArt(locationId: string): void {
    const art = LOCATION_SCENE_ART[locationId];
    assertElement('#interaction-dialog', HTMLDialogElement).classList.toggle('has-scene-art', art !== undefined);
    assertElement('#scene-background', HTMLElement).style.backgroundImage = art !== undefined ? `url(${art.background})` : '';
    const character = assertElement('#scene-character', HTMLImageElement);
    character.src = art?.character.src ?? '';
    character.alt = art?.character.alt ?? '';
    character.hidden = art === undefined;
  }

  private renderDialogueNode(): void {
    if (this.activeDialogueGraph === undefined || this.activeDialogueNodeId === undefined) return;
    const node = this.activeDialogueGraph.nodes.find((candidate) => candidate.id === this.activeDialogueNodeId);
    if (node === undefined) return;
    assertElement('#interaction-title', HTMLElement).textContent = node.speaker;
    assertElement('#dialogue-line', HTMLElement).textContent = node.text;
    const list = assertElement('#dialogue-choices', HTMLUListElement);
    list.replaceChildren(...node.choices.map((choice) => this.buildDialogueChoiceElement(node, choice)));
  }

  private buildDialogueChoiceElement(node: DialogueNode, choice: DialogueChoice): HTMLLIElement {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dialogue-choice';
    button.textContent = choice.label;
    const available = isChoiceAvailable(this.careerState, choice, ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_ITEMS);
    button.disabled = !available;
    button.setAttribute('aria-disabled', String(!available));
    if (available) button.addEventListener('click', () => this.selectDialogueChoice(node, choice));
    item.appendChild(button);
    return item;
  }

  private selectDialogueChoice(node: DialogueNode, choice: DialogueChoice): void {
    const graph = this.activeDialogueGraph;
    if (graph === undefined) return;
    // The event bus is synchronous, so this.careerState is already updated
    // (via the career-state-changed subscription above) by the time emit()
    // returns — safe today, but a real coupling to synchronous dispatch.
    this.options.domainEvents.emit('dialogue-choice-selected', { graphId: graph.id, nodeId: node.id, choiceId: choice.id });
    if (choice.startsAudition !== undefined) {
      assertElement('#interaction-dialog', HTMLDialogElement).close();
      this.openAudition(choice.startsAudition);
      return;
    }
    if (choice.next === null) {
      assertElement('#interaction-dialog', HTMLDialogElement).close();
      return;
    }
    this.activeDialogueNodeId = choice.next;
    this.renderDialogueNode();
  }

  /** Opens the Read the Room audition UI in place of the plain dialogue
   * card — a fixed set of categories the player answers one option each
   * before submitting, rather than a linear branching tree (see
   * Performance.ts's `AuditionDefinition`). Silently no-ops on an unknown
   * audition id, the same defensive posture `openDialogue` callers get from
   * `getDialogueGraphById`. */
  private openAudition(auditionId: string): void {
    const definition = getAuditionById(auditionId);
    if (definition === undefined) return;
    this.activeAudition = definition;
    this.auditionChoices = {};
    assertElement('#audition-title', HTMLElement).textContent = definition.title;
    this.renderAuditionCategories(definition);
    assertElement('#audition-form', HTMLFormElement).hidden = false;
    assertElement('#audition-debrief', HTMLElement).hidden = true;
    assertElement('#audition-dialog', HTMLDialogElement).showModal();
  }

  private renderAuditionCategories(definition: AuditionDefinition): void {
    const container = assertElement('#audition-categories', HTMLElement);
    container.replaceChildren(...definition.categories.map((category) => this.buildAuditionCategoryElement(category)));
    this.updateAuditionSubmitEnabled(definition);
  }

  private buildAuditionCategoryElement(category: AuditionCategory): HTMLFieldSetElement {
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'audition-category';
    const legend = document.createElement('legend');
    legend.textContent = category.prompt;
    fieldset.appendChild(legend);
    for (const option of category.options) {
      const label = document.createElement('label');
      label.className = 'audition-option';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = category.kind;
      input.value = option.id;
      input.addEventListener('change', () => {
        this.auditionChoices = { ...this.auditionChoices, [category.kind]: option.id };
        if (this.activeAudition !== undefined) this.updateAuditionSubmitEnabled(this.activeAudition);
      });
      label.append(input, document.createTextNode(option.label));
      fieldset.appendChild(label);
    }
    return fieldset;
  }

  /** Every category needs an answer before the player can perform — per
   * Performance.ts's design note, skipping a category (including
   * `improvisation`) isn't a mechanic; content instead authors a no-risk
   * baseline option for it. */
  private updateAuditionSubmitEnabled(definition: AuditionDefinition): void {
    const allAnswered = definition.categories.every((category) => this.auditionChoices[category.kind] !== undefined);
    assertElement('#audition-submit', HTMLButtonElement).disabled = !allAnswered;
  }

  private submitAudition(event: SubmitEvent): void {
    event.preventDefault();
    if (this.activeAudition === undefined) return;
    this.options.domainEvents.emit('audition-submitted', { auditionId: this.activeAudition.id, choices: this.auditionChoices });
  }

  private renderAuditionDebrief(payload: AuditionResolvedPayload): void {
    if (this.activeAudition === undefined || this.activeAudition.id !== payload.auditionId) return;
    assertElement('#audition-form', HTMLFormElement).hidden = true;
    assertElement('#audition-outcome', HTMLElement).textContent = AUDITION_OUTCOME_LABELS[payload.result.outcome];
    const list = assertElement('#audition-factors', HTMLUListElement);
    list.replaceChildren(...payload.result.factors.map((factor) => this.buildAuditionFactorElement(factor)));
    assertElement('#audition-debrief', HTMLElement).hidden = false;
  }

  private buildAuditionFactorElement(factor: AuditionFactor): HTMLLIElement {
    const item = document.createElement('li');
    const sign = factor.points > 0 ? '+' : '';
    item.textContent = `${factor.label} (${sign}${factor.points})`;
    return item;
  }

  private renderCareerState(state: CareerState): void {
    assertElement('#status-name', HTMLElement).textContent = state.identity.name.length > 0 ? state.identity.name : 'Nobody — yet';
    const timeLabel = `${weekdayForDay(state.time.day)} · ${TIME_SLOT_LABELS[state.time.slot]}`;
    assertElement('#status-time', HTMLElement).textContent = timeLabel;
    assertElement('#status-money', HTMLElement).textContent = `$${state.resources.money}`;
    assertElement('#status-energy', HTMLElement).textContent = `${state.resources.energy}/100`;
    assertElement('#status-reputation', HTMLElement).textContent = `${state.resources.reputation}/100`;
    assertElement('#hud-quickstats', HTMLOutputElement).value =
      `${timeLabel} · $${state.resources.money} · Energy ${state.resources.energy}/100 · Rep ${state.resources.reputation}/100`;
    this.renderQuests(state);
    this.renderRelationships(state);
    this.renderProgression(state);
    this.renderInventory(state);
  }

  /** Locked quests are omitted entirely rather than shown as "???" —
   * consistent with round 2's principle of distinguishing unavailable
   * choices without revealing every hidden consequence. */
  private renderQuests(state: CareerState): void {
    const list = assertElement('#status-quests-list', HTMLUListElement);
    const items = ALL_QUESTS.map((quest) => {
      const status = getQuestStatus(state, quest, ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_ITEMS);
      if (status === 'locked') return undefined;
      const item = document.createElement('li');
      const stage = status === 'active' ? getActiveStage(state, quest) : undefined;
      const statusLabel = status === 'completed' ? 'Completed' : (stage?.description ?? 'Available');
      item.textContent = `${quest.title} — ${statusLabel}`;
      return item;
    }).filter((item): item is HTMLLIElement => item !== undefined);
    list.replaceChildren(...items);
  }

  /** A character with no relationship-state entry yet is omitted rather
   * than shown at a default "neutral" — the same lazy-population reasoning
   * `Relationships.ts` already applies to state, extended to the panel: a
   * character the player hasn't affected yet isn't a relationship worth
   * reporting on. */
  private renderRelationships(state: CareerState): void {
    const list = assertElement('#status-relationships-list', HTMLUListElement);
    const items = ALL_RELATIONSHIP_CHARACTERS.map((character) =>
      this.buildRelationshipListItem(character, state.relationships[character.id]),
    ).filter((item): item is HTMLLIElement => item !== undefined);
    list.replaceChildren(...items);
  }

  private buildRelationshipListItem(
    character: RelationshipCharacterDef,
    axes: RelationshipAxes | undefined,
  ): HTMLLIElement | undefined {
    if (axes === undefined) return undefined;
    const item = document.createElement('li');
    const summary = document.createElement('span');
    summary.textContent = `${character.role} — ${capitalizeRelationshipLabel(deriveRelationshipLabel(axes))}`;
    const detail = document.createElement('small');
    detail.textContent = formatRelationshipAxes(axes);
    item.append(summary, detail);
    return item;
  }

  /** Every talent is listed regardless of unlock status (see
   * `formatTalentRequirement`) — unlike `renderQuests`/`renderRelationships`,
   * there is nothing here to omit. */
  private renderProgression(state: CareerState): void {
    const { progression } = state;
    const required = xpRequiredForNextLevel(progression.level);
    const levelLabel =
      progression.unspentTalentPoints > 0
        ? `Level ${progression.level} — ${progression.unspentTalentPoints} talent point${progression.unspentTalentPoints === 1 ? '' : 's'} available`
        : `Level ${progression.level}`;
    assertElement('#status-level', HTMLElement).textContent = levelLabel;
    const bar = assertElement('#status-xp-bar', HTMLElement);
    const percent = Math.min(100, Math.round((progression.xp / required) * 100));
    bar.setAttribute('aria-valuenow', String(percent));
    assertElement('#status-xp-fill', HTMLElement).style.width = `${percent}%`;
    assertElement('#status-xp-label', HTMLElement).textContent = `${progression.xp} / ${required} XP`;
    const list = assertElement('#status-talents-list', HTMLUListElement);
    list.replaceChildren(...ALL_TALENTS.map((talent) => this.buildTalentListItem(talent, progression)));
  }

  private buildTalentListItem(talent: TalentDefinition, progression: ProgressionState): HTMLLIElement {
    const unlocked = isTalentUnlocked(progression, talent);
    const item = document.createElement('li');
    if (unlocked) item.classList.add('talent-unlocked');
    const summary = document.createElement('div');
    summary.className = 'talent-summary';
    const name = document.createElement('span');
    name.textContent = `${talent.name} (${capitalize(talent.branch)})`;
    const detail = document.createElement('small');
    detail.textContent = unlocked ? talent.description : `${talent.description} — ${formatTalentRequirement(talent)}`;
    summary.append(name, detail);
    item.appendChild(summary);
    if (unlocked) return item;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'talent-unlock-button';
    button.textContent = `Unlock (${talent.cost})`;
    const available = canUnlockTalent(progression, talent);
    button.disabled = !available;
    button.setAttribute('aria-disabled', String(!available));
    if (available) {
      button.addEventListener('click', () =>
        this.options.domainEvents.emit('talent-unlock-requested', { talentId: talent.id }),
      );
    }
    item.appendChild(button);
    return item;
  }

  /** An unowned item is omitted entirely, the same lazy-population
   * reasoning `renderRelationships` applies: there's no purchase or unlock
   * action for the player to take on an item the way there is for a
   * talent, so a reward not yet earned isn't a panel entry worth showing
   * (let alone one worth spoiling in advance). */
  private renderInventory(state: CareerState): void {
    const list = assertElement('#status-inventory-list', HTMLUListElement);
    const items = ALL_ITEMS.filter((item) => hasItem(state.inventory, item)).map((item) =>
      this.buildInventoryListItem(item),
    );
    list.replaceChildren(...items);
  }

  private buildInventoryListItem(item: InventoryItemDefinition): HTMLLIElement {
    const listItem = document.createElement('li');
    const summary = document.createElement('span');
    summary.textContent = `${item.name} (${formatItemCategory(item.category)})`;
    const detail = document.createElement('small');
    detail.textContent = item.description;
    listItem.append(summary, detail);
    return listItem;
  }

  private async save(): Promise<void> {
    try {
      await this.options.onSave();
      await this.refreshContinue();
      this.toast('Career saved locally');
    } catch {
      this.toast('Save unavailable — export a copy instead');
    }
  }

  private exportSave(): void {
    const blob = new Blob([this.options.onExport()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'hollywoodland-phase-2-save.json';
    anchor.click();
    URL.revokeObjectURL(url);
    this.toast('Save exported');
  }

  private async importSave(fileInput: HTMLInputElement, screens: MenuScreens): Promise<void> {
    const file = fileInput.files?.[0];
    if (file === undefined) return;
    try {
      const state = await this.options.onImport(await file.text());
      await this.refreshContinue();
      this.renderCareerState(state);
      this.startGame(screens, state);
      this.toast('Save imported and verified');
    } catch (error) {
      this.toast(error instanceof Error ? error.message : 'Save import failed');
    } finally {
      fileInput.value = '';
    }
  }

  private toggleFilmMode(button: HTMLButtonElement): void {
    const active = !document.body.classList.contains('film-mode');
    document.body.classList.toggle('film-mode', active);
    button.setAttribute('aria-pressed', String(active));
    button.textContent = active ? 'Return to Color' : 'Film Look';
    this.toast(active ? 'Black-and-white living-film treatment' : 'Hollywood color restored');
  }

  private async toggleFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement === null) await assertElement('#game-frame', HTMLElement).requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      this.toast('Fullscreen is unavailable in this browser');
    }
  }

  private startFpsMeter(game: Phaser.Game): void {
    window.setInterval(() => {
      const fps = Math.round(game.loop.actualFps);
      assertElement('#fps-output', HTMLOutputElement).value = `${Number.isFinite(fps) ? fps : '--'} FPS`;
    }, 500);
  }

  private openStatus(panel: HTMLElement, button: HTMLButtonElement): void {
    panel.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    assertElement('#close-status', HTMLButtonElement).focus();
  }

  private closeStatus(panel: HTMLElement, button: HTMLButtonElement): void {
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    button.focus();
  }

  private populateSettingsForm(): void {
    assertElement('#text-scale', HTMLInputElement).value = String(this.settings.textScale * 100);
    assertElement('#text-scale-output', HTMLOutputElement).value = `${this.settings.textScale * 100}%`;
    assertElement('#high-contrast', HTMLInputElement).checked = this.settings.highContrast;
    assertElement('#reduced-motion', HTMLInputElement).checked = this.settings.reducedMotion;
    assertElement('#film-effects', HTMLInputElement).checked = this.settings.filmEffects;
    assertElement('#analytics-enabled', HTMLInputElement).checked = this.settings.analyticsEnabled;
  }

  private readSettingsForm(): GameSettings {
    return {
      textScale: Number(assertElement('#text-scale', HTMLInputElement).value) / 100,
      highContrast: assertElement('#high-contrast', HTMLInputElement).checked,
      reducedMotion: assertElement('#reduced-motion', HTMLInputElement).checked,
      filmEffects: assertElement('#film-effects', HTMLInputElement).checked,
      analyticsEnabled: assertElement('#analytics-enabled', HTMLInputElement).checked,
    };
  }

  private applySettings(settings: GameSettings): void {
    document.documentElement.style.setProperty('--text-scale', String(settings.textScale));
    document.body.classList.toggle('high-contrast', settings.highContrast);
    document.body.classList.toggle('reduced-motion', settings.reducedMotion);
    document.body.classList.toggle('film-effects-off', !settings.filmEffects);
  }

  private toast(message: string): void {
    const toast = assertElement('#toast', HTMLElement);
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(this.fpsTimer);
    this.fpsTimer = window.setTimeout(() => { toast.hidden = true; }, 2400);
  }

  private announce(message: string): void {
    assertElement('#announcer', HTMLElement).textContent = message;
  }
}

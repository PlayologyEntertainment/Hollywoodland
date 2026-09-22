import type Phaser from 'phaser';

import { ChapterTitlePage } from './ChapterTitlePage';
import { FadingNotice } from './FadingNotice';
import { describeHud } from './HudStats';
import { chooseObjective, isObjectiveAccomplished, ObjectiveTracker, type Objective } from './Objective';
import { buildQuestLog } from './QuestLog';
import { mountDecoOutline } from '../ui/DecoBorder';
import { CharacterCreator, type CharacterChoices } from './CharacterCreator';
import { FADE_MS, ScreenTransition } from './ScreenTransition';
import { moodForPlace, placeForLocation, type AudioMood, type PlaceKind } from '../audio/AudioCues';
import type { AudioController } from '../audio/AudioDirector';
import { isAssignmentUnlocked, type AssignmentDefinition, type AssignmentReward, type AssignmentResolution } from '../domain/Assignments';
import { ALL_ASSIGNMENTS } from '../domain/AssignmentDefinitions';
import { createDefaultCareerState, createInitialCareerState, type CareerState, type IdentityState } from '../domain/CareerState';
import { isChoiceAvailable, type DialogueChoice, type DialogueGraph, type DialogueNode } from '../domain/Dialogue';
import {
  CASTING_OFFICE_DIALOGUE,
  CELESTIAL_PALACE_DIALOGUE,
  COSTUME_SHOP_DIALOGUE,
  DINER_DIALOGUE,
  KLIEG_LIGHT_DIALOGUE,
  LANDLADY_DIALOGUE,
  PRODUCTION_COORDINATOR_DIALOGUE,
  RIVAL_DIALOGUE,
  SCENE_PARTNER_DIALOGUE,
} from '../domain/DialogueGraphs';
import type { AuditionResolvedPayload, DomainEventBus } from '../domain/DomainEventBus';
import { canAffordHousingUpgrade, HOUSING_TIERS, nextHousingTierDefinition } from '../domain/Housing';
import { hasItem, type InventoryItemDefinition } from '../domain/Inventory';
import { ALL_ITEMS } from '../domain/InventoryDefinitions';
import { deriveAttributes } from '../domain/Origins';
import type { AuditionCategory, AuditionChoices, AuditionDefinition, AuditionFactor, AuditionOutcome } from '../domain/Performance';
import { getAuditionById } from '../domain/PerformanceDefinitions';
import { ALL_QUESTS } from '../domain/QuestDefinitions';
import { canUnlockTalent, isTalentUnlocked, xpRequiredForNextLevel, type ProgressionState, type TalentDefinition } from '../domain/Progression';
import { deriveRelationshipLabel, type RelationshipAxes, type RelationshipDelta, type RelationshipLabel } from '../domain/Relationships';
import { ALL_RELATIONSHIP_CHARACTERS, type RelationshipCharacterDef } from '../domain/RelationshipDefinitions';
import { ALL_TALENTS, getTalentById } from '../domain/TalentDefinitions';
import type { GameSettings } from '../settings/Settings';
import { assertElement } from '../shared/assert';

function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

interface LocationSceneArt {
  readonly background: string;
  /** Optional so a location can show its background before a character is assigned. */
  readonly character?: { readonly src: string; readonly alt: string };
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
    background: assetUrl('assets/locations/boarding-house-lobby.webp'),
    character: { src: assetUrl('assets/characters/landlady.webp'), alt: 'The Bellhaven Rooms landlady' },
  },
  diner: {
    background: assetUrl('assets/locations/diner.webp'),
    character: { src: assetUrl('assets/characters/diner-confidant.webp'), alt: 'The counter girl at The Gilded Spoon' },
  },
  'backlot-gate': {
    background: assetUrl('assets/locations/backlot-gate.webp'),
    character: { src: assetUrl('assets/characters/rival.webp'), alt: 'The rival at the Monarch Pictures gate' },
  },
  'extras-corral': {
    background: assetUrl('assets/locations/extras-corral.webp'),
    character: { src: assetUrl('assets/characters/production-coordinator.webp'), alt: 'The production coordinator' },
  },
  soundstage: {
    background: assetUrl('assets/locations/soundstage.webp'),
    character: { src: assetUrl('assets/characters/scene-partner.webp'), alt: 'The scene partner' },
  },
  'costume-shop': {
    background: assetUrl('assets/locations/costume-shop.webp'),
    character: { src: assetUrl('assets/characters/wardrobe-mentor.webp'), alt: 'The wardrobe mistress at The Silver Thimble' },
  },
  'klieg-light-office': {
    background: assetUrl('assets/locations/klieg-light-office.webp'),
    character: { src: assetUrl('assets/characters/reporter.webp'), alt: 'The newspaper stringer at The Klieg Light' },
  },
  'celestial-palace': {
    background: assetUrl('assets/locations/celestial-palace.webp'),
    character: { src: assetUrl('assets/characters/house-manager.webp'), alt: 'The house manager of The Celestial Palace' },
  },
};

/** The Bellhaven Rooms Home Menu is shown over the player's rented room (the
 * lobby is the landlady's scene, above). */
const HOME_HUB_BACKGROUND = assetUrl('assets/locations/boarding-house.webp');

/** The most a fade will stay black waiting for the Boulevard to report it has started, so a scene that never does cannot
 * strand the player on a black screen. */
const BOULEVARD_READY_TIMEOUT_MS = 8000;

/** The reveal of the Boulevard after the chapter title page lingers: twice as long as the usual fade in. */
const BOULEVARD_REVEAL_FADE_IN_MS = FADE_MS * 2;

interface MenuScreens {
  readonly titlePanel: HTMLElement;
  readonly playHud: HTMLElement;
  readonly menuBackdrop: HTMLElement;
  readonly statusBar: HTMLElement;
  readonly footer: HTMLElement;
}

interface AppShellOptions {
  readonly settings: GameSettings;
  /** Sets what music and ambience should be playing; the shell only says where the player is. */
  readonly audio: AudioController;
  readonly domainEvents: DomainEventBus;
  readonly onSettingsChanged: (settings: GameSettings) => void;
  /** Creates the Phaser game on first call (deferred until the player
   * actually enters play) and reuses it on subsequent calls. */
  readonly onStart: (state?: CareerState) => Phaser.Game;
  readonly onStop: () => void;
  /** Saves the career to its own slot; called as the player leaves the game for the Main Menu. */
  readonly onAutosave: () => Promise<void>;
  readonly onLoad: () => Promise<CareerState | undefined>;
  readonly onImport: (raw: string) => Promise<CareerState>;
}

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

function formatAssignmentDuration(minutes: number): string {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${minutes}m`;
}

function formatRelationshipDelta(delta: RelationshipDelta): string {
  const parts: string[] = [];
  if (delta.trust) parts.push(`${delta.trust > 0 ? '+' : ''}${delta.trust} trust`);
  if (delta.tension) parts.push(`${delta.tension > 0 ? '+' : ''}${delta.tension} tension`);
  if (delta.attraction) parts.push(`${delta.attraction > 0 ? '+' : ''}${delta.attraction} attraction`);
  if (delta.obligation) parts.push(`${delta.obligation > 0 ? '+' : ''}${delta.obligation} obligation`);
  return parts.join(', ');
}

/** Renders one assignment reward line for the "while you were away" summary
 * card. `set-fact` has no player-facing text (it never appears in authored
 * assignment content today, but the function stays total over
 * `AssignmentReward` rather than assuming that). */
function describeAssignmentReward(reward: AssignmentReward): string {
  if (reward.kind === 'xp-grant') return `+${reward.amount} XP`;
  if (reward.kind === 'resource-delta') {
    const parts: string[] = [];
    if (reward.delta.money) parts.push(`${reward.delta.money > 0 ? '+' : ''}$${reward.delta.money}`);
    if (reward.delta.energy) parts.push(`${reward.delta.energy > 0 ? '+' : ''}${reward.delta.energy} energy`);
    if (reward.delta.reputation) parts.push(`${reward.delta.reputation > 0 ? '+' : ''}${reward.delta.reputation} reputation`);
    return parts.join(', ');
  }
  if (reward.kind === 'relationship-delta') {
    const character = ALL_RELATIONSHIP_CHARACTERS.find((candidate) => candidate.id === reward.characterId);
    return `${formatRelationshipDelta(reward.delta)} with ${character?.role ?? reward.characterId}`;
  }
  if (reward.kind === 'relationship-pivotal-flag') return 'A memory worth keeping.';
  return '';
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
  private toastTimer = 0;
  private promptNotice!: FadingNotice;
  private objectives!: ObjectiveTracker;
  private toastNotice!: FadingNotice;
  private game: Phaser.Game | undefined;
  private syncBarHeights: () => void = () => undefined;
  private transition!: ScreenTransition;
  private chapterPage!: ChapterTitlePage;
  private careerState: CareerState = createDefaultCareerState();
  private activeDialogueGraph: DialogueGraph | undefined;
  private activeDialogueNodeId: string | undefined;
  /** What happened while the player was away, held from the moment they walk
   * into Bellhaven Rooms until the landlady conversation hands off to the
   * Home Menu, which is where the "While You Were Away" summary is shown. */
  private pendingAwayResolution: AssignmentResolution | undefined;
  private activeAudition: AuditionDefinition | undefined;
  private auditionChoices: AuditionChoices = {};
  /** Whether the player is in the menus or in the game, and which building or studio place they are inside, if any. */
  private inGame = false;
  /** The chapter title page is up: the menu music fades out for it, and stays out until the Boulevard takes over. */
  private onChapterPage = false;
  private place: PlaceKind | undefined;
  private audioSyncTimer = 0;

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
      footer: assertElement('#game-footer', HTMLElement),
    };
    this.trackBarHeights(screens.statusBar, screens.footer);
    // A fine outline round each bar.
    mountDecoOutline(screens.statusBar);
    mountDecoOutline(screens.footer);
    this.transition = new ScreenTransition(assertElement('#screen-fade', HTMLElement));
    this.objectives = new ObjectiveTracker(
      this.objectiveView(),
      (state) => chooseObjective(state, ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_ITEMS),
      (objective, state) => isObjectiveAccomplished(objective, state, ALL_QUESTS),
      (message) => this.announce(message),
      undefined,
      // A conversation covers the whole picture, so the green "complete" beat waits until it is closed.
      () => ['#interaction-dialog', '#home-hub-dialog', '#audition-dialog'].some((selector) => assertElement(selector, HTMLDialogElement).open),
    );
    this.promptNotice = new FadingNotice(assertElement('#interaction-prompt', HTMLElement));
    this.toastNotice = new FadingNotice(assertElement('#toast', HTMLElement));
    this.chapterPage = new ChapterTitlePage(assertElement('#chapter-title', HTMLElement));
    const characterCreator = assertElement('#character-creator', HTMLElement);
    const newCareer = assertElement('#new-career', HTMLButtonElement);
    const continueCareer = assertElement('#continue-career', HTMLButtonElement);
    const settingsDialog = assertElement('#settings-dialog', HTMLDialogElement);
    const statusButton = assertElement('#status-button', HTMLButtonElement);
    const statusPanel = assertElement('#status-panel', HTMLElement);
    const fileInput = assertElement('#save-file-input', HTMLInputElement);

    this.options.domainEvents.on('interaction-proximity-changed', ({ visible, label }) => {
      this.setInteractionPrompt(visible, label);
    });
    this.options.domainEvents.on('casting-office-entered', () => {
      this.openDialogue(CASTING_OFFICE_DIALOGUE, 'Sunset Casting Exchange', 'casting-office');
      this.announce('You entered the Sunset Casting Exchange.');
    });
    this.options.domainEvents.on('diner-entered', () => {
      this.openDialogue(DINER_DIALOGUE, 'The Gilded Spoon', 'diner');
      this.announce('You entered The Gilded Spoon.');
    });
    this.options.domainEvents.on('home-hub-entered', ({ resolution }) => {
      // Walking in starts with the landlady; her closing choices open the Home Menu.
      this.pendingAwayResolution = resolution;
      this.openDialogue(LANDLADY_DIALOGUE, 'Bellhaven Rooms', 'boarding-house');
      this.announce('You entered Bellhaven Rooms.');
    });
    this.options.domainEvents.on('backlot-gate-entered', () => {
      this.openDialogue(RIVAL_DIALOGUE, 'Monarch Pictures Gate', 'backlot-gate');
      this.announce('You reached the Monarch Pictures gate.');
    });
    this.options.domainEvents.on('extras-corral-entered', () => {
      this.openDialogue(PRODUCTION_COORDINATOR_DIALOGUE, 'The Extras Corral', 'extras-corral');
      this.announce('You checked in at the extras corral.');
    });
    this.options.domainEvents.on('soundstage-entered', () => {
      this.openDialogue(SCENE_PARTNER_DIALOGUE, 'The Soundstage', 'soundstage');
      this.announce('You stepped onto the soundstage.');
    });
    this.options.domainEvents.on('costume-shop-entered', () => {
      this.openDialogue(COSTUME_SHOP_DIALOGUE, 'The Silver Thimble', 'costume-shop');
      this.announce('You entered The Silver Thimble.');
    });
    this.options.domainEvents.on('klieg-light-entered', () => {
      this.openDialogue(KLIEG_LIGHT_DIALOGUE, 'The Klieg Light', 'klieg-light-office');
      this.announce('You entered The Klieg Light.');
    });
    this.options.domainEvents.on('celestial-palace-entered', () => {
      this.openDialogue(CELESTIAL_PALACE_DIALOGUE, 'The Celestial Palace', 'celestial-palace');
      this.announce('You entered The Celestial Palace.');
    });
    this.options.domainEvents.on('career-state-changed', (state) => {
      this.careerState = state;
      this.renderCareerState(state);
    });
    this.options.domainEvents.on('audition-resolved', (payload) => this.renderAuditionDebrief(payload));
    assertElement('#interaction-dialog', HTMLDialogElement).addEventListener('close', () => {
      this.activeDialogueGraph = undefined;
      this.activeDialogueNodeId = undefined;
      this.syncAudio();
    });
    assertElement('#audition-dialog', HTMLDialogElement).addEventListener('close', () => {
      this.activeAudition = undefined;
      this.auditionChoices = {};
      this.syncAudio();
    });
    assertElement('#audition-form', HTMLFormElement).addEventListener('submit', (event) => this.submitAudition(event));
    assertElement('#audition-continue', HTMLButtonElement).addEventListener('click', () => {
      assertElement('#audition-dialog', HTMLDialogElement).close();
    });
    assertElement('#home-hub-talk-landlady', HTMLButtonElement).addEventListener('click', () => {
      assertElement('#home-hub-dialog', HTMLDialogElement).close();
      this.openDialogue(LANDLADY_DIALOGUE, 'Bellhaven Rooms', 'boarding-house');
    });
    assertElement('#home-hub-close', HTMLButtonElement).addEventListener('click', () => {
      assertElement('#home-hub-dialog', HTMLDialogElement).close();
      this.syncAudio();
    });
    assertElement('#home-hub-upgrade-housing', HTMLButtonElement).addEventListener('click', () => {
      this.options.domainEvents.emit('housing-upgrade-requested', undefined);
    });

    newCareer.addEventListener('click', () => {
      void this.transition.run(() => {
        screens.titlePanel.hidden = true;
        screens.menuBackdrop.hidden = true;
        characterCreator.hidden = false;
      });
    });
    new CharacterCreator().mount(
      (choices) => void this.startNewCareer(choices, screens, characterCreator),
      () => {
        void this.transition.run(() => {
          characterCreator.hidden = true;
          screens.titlePanel.hidden = false;
          screens.menuBackdrop.hidden = false;
          newCareer.focus();
        });
      },
    );
    continueCareer.addEventListener('click', async () => {
      if (this.transition.isRunning) return;
      const state = await this.options.onLoad();
      await this.transition.run(async () => {
        if (state !== undefined) this.loadCareerState(state);
        await this.enterGame(screens, state);
      });
      this.toast('Career restored');
    });
    assertElement('#return-menu', HTMLButtonElement).addEventListener('click', () => {
      void this.transition.run(async () => {
        await this.autosave();
        // The Boulevard only reports when the prompt changes, so nothing else would take it down once the player has left.
        this.promptNotice.hideNow();
        screens.playHud.hidden = true;
        screens.footer.hidden = true;
        screens.titlePanel.hidden = false;
        screens.menuBackdrop.hidden = false;
        screens.statusBar.hidden = true;
        this.options.onStop();
        this.inGame = false;
        this.place = undefined;
        this.syncAudio();
        newCareer.focus();
      });
    });

    assertElement('#open-settings', HTMLButtonElement).addEventListener('click', () => {
      this.populateSettingsForm();
      settingsDialog.showModal();
    });
    // The dialog has no Close button: clicking its backdrop (the only way a click event's target can be the <dialog> itself,
    // since the frame's own padding is 0 and its form fills it) closes it, same as Escape — unsaved changes are discarded.
    settingsDialog.addEventListener('click', (event) => {
      if (event.target === settingsDialog) settingsDialog.close();
    });
    settingsDialog.addEventListener('close', () => {
      if (settingsDialog.returnValue !== 'confirm') {
        this.options.audio.setSettings(this.settings); // undo any volume previewed while the dialog was open
        return;
      }
      this.settings = this.readSettingsForm();
      this.applySettings(this.settings);
      this.options.onSettingsChanged(this.settings);
      this.toast('Settings saved');
    });
    for (const id of ['music-volume', 'ambience-volume'] as const) {
      assertElement(`#${id}`, HTMLInputElement).addEventListener('input', (event) => {
        const input = event.currentTarget as HTMLInputElement;
        assertElement(`#${id}-output`, HTMLOutputElement).value = `${input.value}%`;
        this.options.audio.setSettings(this.readSettingsForm());
      });
    }
    for (const id of ['music-muted', 'ambience-muted'] as const) {
      assertElement(`#${id}`, HTMLInputElement).addEventListener('change', () => this.options.audio.setSettings(this.readSettingsForm()));
    }
    assertElement('#text-scale', HTMLInputElement).addEventListener('input', (event) => {
      const input = event.currentTarget as HTMLInputElement;
      assertElement('#text-scale-output', HTMLOutputElement).value = `${input.value}%`;
    });

    statusButton.addEventListener('click', () =>
      statusPanel.hidden ? this.openStatus(statusPanel, statusButton) : this.closeStatus(statusPanel, statusButton),
    );
    assertElement('#close-status', HTMLButtonElement).addEventListener('click', () => this.closeStatus(statusPanel, statusButton));
    assertElement('#film-mode', HTMLButtonElement).addEventListener('click', (event) => this.toggleFilmMode(event.currentTarget as HTMLButtonElement));
    assertElement('#fullscreen', HTMLButtonElement).addEventListener('click', () => void this.toggleFullscreen());
    assertElement('#advance-time', HTMLButtonElement).addEventListener('click', () => this.options.domainEvents.emit('advance-time-requested', undefined));
    assertElement('#import-save', HTMLButtonElement).addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => void this.importSave(fileInput, screens));
    this.mountLegalDialog('#footer-tos', '#legal-terms-dialog', '#legal-terms-close');
    this.mountLegalDialog('#footer-privacy', '#legal-privacy-dialog', '#legal-privacy-close');
  }

  public async refreshContinue(): Promise<void> {
    try {
      assertElement('#continue-career', HTMLButtonElement).disabled = (await this.options.onLoad()) === undefined;
    } catch {
      assertElement('#continue-career', HTMLButtonElement).disabled = true;
    }
  }

  /** Publishes the heights of the black header and footer as `--header-h` and `--footer-h` on the game frame (0 while a bar is
   * hidden), so the game view fits between them and the Status panel can start below the header. A ResizeObserver keeps
   * them right when the header wraps or the text scale changes. */
  private trackBarHeights(header: HTMLElement, footer: HTMLElement): void {
    const frame = assertElement('#game-frame', HTMLElement);
    const sync = (): void => {
      let changed = false;
      for (const [name, bar] of [['--header-h', header], ['--footer-h', footer]] as const) {
        const value = `${bar.hidden ? 0 : Math.round(bar.getBoundingClientRect().height)}px`;
        if (frame.style.getPropertyValue(name) === value) continue;
        frame.style.setProperty(name, value);
        changed = true;
      }
      // Phaser fits its canvas to its parent when it boots and on window resize,
      // not when the parent changes size on its own, so re-fit it here.
      if (changed) this.game?.scale.refresh();
    };
    const observer = new ResizeObserver(sync);
    observer.observe(header);
    observer.observe(footer);
    this.syncBarHeights = sync;
    sync();
  }

  /** Start (on the Character Creator): dips through black to the Chapter 1 title page, plays its reveal once the fade-in has uncovered it,
   * waits for the player to leave it, then dips through black again into the Boulevard. The Boulevard is only started
   * under that second black screen, so its input and music stay off while the page is up. */
  private async startNewCareer(choices: CharacterChoices, screens: MenuScreens, characterCreator: HTMLElement): Promise<void> {
    if (this.transition.isRunning) return;
    const state = this.buildInitialState(choices);
    // The music starts fading out the moment the page is asked for, so it is dying away as the screen dips to black.
    this.onChapterPage = true;
    this.syncAudio();
    try {
      const shown = await this.transition.run(() => {
        characterCreator.hidden = true;
        this.chapterPage.prepare();
      });
      if (!shown) return;
      await this.chapterPage.play();
      await this.transition.run(async () => {
        this.chapterPage.hide();
        // Before the game starts, so that its own audio sync picks the Boulevard's music.
        this.onChapterPage = false;
        this.loadCareerState(state);
        await this.enterGame(screens, state);
      }, { fadeInMs: BOULEVARD_REVEAL_FADE_IN_MS });
    } finally {
      // Should anything have gone wrong on the way, do not leave the game silent.
      if (this.onChapterPage) {
        this.onChapterPage = false;
        this.syncAudio();
      }
    }
  }

  /** Starts the game and resolves once the Boulevard has created its first frame, so a fade-in never shows a blank canvas.
   * The scene announces itself by publishing the career state as it starts. */
  private async enterGame(screens: MenuScreens, state?: CareerState): Promise<void> {
    const ready = new Promise<void>((resolve) => {
      const timeout = window.setTimeout(done, BOULEVARD_READY_TIMEOUT_MS);
      const unsubscribe = this.options.domainEvents.on('career-state-changed', done);
      function done(): void {
        window.clearTimeout(timeout);
        unsubscribe();
        resolve();
      }
    });
    this.startGame(screens, state);
    await ready;
    // The scene draws its first frame right after create(), so wait one frame for it to be on the canvas.
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  }

  private startGame(screens: MenuScreens, state?: CareerState): void {
    screens.titlePanel.hidden = true;
    screens.playHud.hidden = false;
    screens.menuBackdrop.hidden = true;
    screens.statusBar.hidden = false;
    screens.footer.hidden = false;
    // Publish the bars' heights before the game boots, so Phaser measures the shorter game area.
    this.syncBarHeights();
    this.game = this.options.onStart(state);
    this.inGame = true;
    this.place = undefined;
    this.syncAudio();
    this.announce('Hollywood Boulevard. Use A and D or arrow keys to move. Press E near the casting office.');
  }

  private buildInitialState(choices: CharacterChoices): CareerState {
    const identity: IdentityState = {
      name: choices.name,
      originId: choices.originId,
      // The customisable-creator fields are gone; the chosen ready-made character replaces them.
      skinToneIndex: 0,
      appearance: {},
      characterId: choices.characterId,
    };
    return createInitialCareerState(identity, deriveAttributes(choices.originId));
  }

  private openDialogue(graph: DialogueGraph, location: string, locationId: string): void {
    this.place = placeForLocation(locationId) ?? this.place;
    this.activeDialogueGraph = graph;
    this.activeDialogueNodeId = graph.rootNodeId;
    assertElement('#dialogue-location', HTMLElement).textContent = location;
    this.applySceneArt(locationId);
    this.renderDialogueNode();
    assertElement('#interaction-dialog', HTMLDialogElement).showModal();
    this.syncAudio();
  }

  /** Where the player is, for the music: the menus, out on the Boulevard, or inside a building or studio place. The player
   * is inside from the moment they enter until every dialog belonging to that place has closed. That check runs a moment
   * later, so a place that hands over to another dialog (the landlady's chat to the Home Menu, a dialogue to an audition)
   * does not flicker back to the street music in between. */
  private syncAudio(): void {
    window.clearTimeout(this.audioSyncTimer);
    this.audioSyncTimer = window.setTimeout(() => this.options.audio.setMood(this.currentMood()), 60);
  }

  private currentMood(): AudioMood {
    if (this.onChapterPage) return 'silent';
    if (!this.inGame) return 'menu';
    const inside = ['#interaction-dialog', '#home-hub-dialog', '#audition-dialog'].some(
      (selector) => assertElement(selector, HTMLDialogElement).open,
    );
    if (!inside) this.place = undefined;
    return this.place === undefined ? 'boulevard' : moodForPlace(this.place);
  }

  /** Toggles the visual-novel scene layout (background + overlaid character
   * to its left, dialogue panel to the right) for locations with approved
   * runtime art; other locations keep the plain text-only dialogue card. */
  private applySceneArt(locationId: string): void {
    const art = LOCATION_SCENE_ART[locationId];
    assertElement('#interaction-dialog', HTMLDialogElement).classList.toggle('has-scene-art', art !== undefined);
    assertElement('#scene-background', HTMLElement).style.backgroundImage = art !== undefined ? `url(${art.background})` : '';
    const character = assertElement('#scene-character', HTMLImageElement);
    character.src = art?.character?.src ?? '';
    character.alt = art?.character?.alt ?? '';
    character.hidden = art?.character === undefined;
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
    if (choice.opensHomeHub === true) {
      assertElement('#interaction-dialog', HTMLDialogElement).close();
      const resolution = this.pendingAwayResolution;
      this.pendingAwayResolution = undefined;
      this.openHomeHub(resolution);
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

  /** Draws the Objective card: the quest's name above, its current goal as the headline, and the green look for a goal just done. */
  private objectiveView(): { show(objective: Objective, complete: boolean): void } {
    const card = assertElement('#objective-card', HTMLElement);
    const title = assertElement('#objective-title', HTMLElement);
    const goal = assertElement('#objective-goal', HTMLElement);
    return {
      show: (objective, complete) => {
        title.textContent = objective.title;
        goal.textContent = objective.goal;
        card.classList.toggle('objective-complete', complete);
      },
    };
  }

  /** Puts a whole career on screen, having forgotten the one before it: the Objective card must not "complete" goals that a
   * newly loaded save is simply further along than the previous game was. */
  private loadCareerState(state: CareerState): void {
    this.objectives.reset();
    this.renderCareerState(state);
  }

  private renderCareerState(state: CareerState): void {
    this.objectives.update(state);
    assertElement('#status-name', HTMLElement).textContent = state.identity.name.length > 0 ? state.identity.name : 'Nobody — yet';
    const hud = describeHud(state);
    // The Status panel.
    assertElement('#status-time', HTMLElement).textContent = `${hud.weekday} · ${hud.slotLabel}`;
    assertElement('#status-money', HTMLElement).textContent = hud.money;
    assertElement('#status-energy', HTMLElement).textContent = `${hud.energy}/100`;
    assertElement('#status-reputation', HTMLElement).textContent = `${hud.reputation}/100`;
    // The header.
    assertElement('#hud-day-number', HTMLElement).textContent = hud.dayNumber;
    assertElement('#hud-weekday', HTMLElement).textContent = hud.weekday;
    assertElement('#hud-time', HTMLElement).textContent = hud.slotLabel;
    assertElement('#hud-money', HTMLElement).textContent = hud.money;
    assertElement('#hud-energy', HTMLElement).textContent = String(hud.energy);
    assertElement('#hud-energy-stat', HTMLElement).dataset.low = String(hud.energyLow);
    assertElement('#hud-quickstats', HTMLOutputElement).value = hud.spoken;
    this.renderQuests(state);
    this.renderRelationships(state);
    this.renderProgression(state);
    this.renderInventory(state);
    this.renderHomeHubHousing(state);
    this.renderHomeHubAssignments(state);
  }

  /** Locked quests are omitted entirely rather than shown as "???" —
   * consistent with round 2's principle of distinguishing unavailable
   * choices without revealing every hidden consequence. */
  private renderQuests(state: CareerState): void {
    const list = assertElement('#status-quests-list', HTMLUListElement);
    // Open quests first, then completed ones under them, which are drawn green (see .quest-complete).
    const items = buildQuestLog(state, ALL_QUESTS, ALL_RELATIONSHIP_CHARACTERS, ALL_ITEMS).map((entry) => {
      const item = document.createElement('li');
      item.textContent = `${entry.title} — ${entry.label}`;
      item.classList.toggle('quest-complete', entry.completed);
      return item;
    });
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

  /** Opens the Home Hub screen — the boarding house's "return home" screen
   * (GDD: "schedule idle assignments, and advance the day") — separate from
   * the landlady's own conversation, which stays reachable from inside it.
   * `resolution` is `undefined` unless an idle assignment finished while the
   * player was away, in which case it's shown once as a summary card. */
  private openHomeHub(resolution: AssignmentResolution | undefined): void {
    this.renderHomeHubAwaySummary(resolution);
    assertElement('#home-hub-background', HTMLElement).style.backgroundImage = `url(${HOME_HUB_BACKGROUND})`;
    assertElement('#home-hub-dialog', HTMLDialogElement).showModal();
  }

  private renderHomeHubAwaySummary(resolution: AssignmentResolution | undefined): void {
    const section = assertElement('#home-hub-away-summary', HTMLElement);
    if (resolution === undefined) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    assertElement('#home-hub-away-headline', HTMLElement).textContent =
      `${resolution.definition.title} finished while you were away (${formatAssignmentDuration(resolution.awayMinutes)}).`;
    const list = assertElement('#home-hub-away-rewards', HTMLUListElement);
    list.replaceChildren(
      ...resolution.definition.rewards.map((reward) => {
        const item = document.createElement('li');
        item.textContent = describeAssignmentReward(reward);
        return item;
      }),
    );
  }

  private renderHomeHubHousing(state: CareerState): void {
    const tierLabel = HOUSING_TIERS.find((definition) => definition.tier === state.housing.tier)?.label ?? state.housing.tier;
    assertElement('#home-hub-housing-tier', HTMLElement).textContent = `Currently: ${tierLabel}`;
    const next = nextHousingTierDefinition(state.housing.tier);
    const upgradeButton = assertElement('#home-hub-upgrade-housing', HTMLButtonElement);
    if (next === undefined || next.upgradeCost === null) {
      upgradeButton.hidden = true;
      return;
    }
    upgradeButton.hidden = false;
    upgradeButton.textContent = `Move to ${next.label} ($${next.upgradeCost})`;
    const affordable = canAffordHousingUpgrade(state.housing, state.resources);
    upgradeButton.disabled = !affordable;
    upgradeButton.setAttribute('aria-disabled', String(!affordable));
  }

  /** Locked assignments (housing tier too low) are omitted entirely, the
   * same posture `renderQuests` takes toward a locked quest. */
  private renderHomeHubAssignments(state: CareerState): void {
    const activeContainer = assertElement('#home-hub-active-assignment', HTMLElement);
    const list = assertElement('#home-hub-assignment-list', HTMLUListElement);
    const active = state.assignments.active;
    if (active !== null) {
      const definition = ALL_ASSIGNMENTS.find((candidate) => candidate.id === active.assignmentId);
      activeContainer.hidden = false;
      assertElement('#home-hub-active-assignment-label', HTMLElement).textContent =
        definition !== undefined ? `In progress: ${definition.title} — check back later.` : 'In progress — check back later.';
      list.replaceChildren();
      return;
    }
    activeContainer.hidden = true;
    const available = ALL_ASSIGNMENTS.filter((definition) => isAssignmentUnlocked(definition, state.housing));
    list.replaceChildren(...available.map((definition) => this.buildAssignmentListItem(definition)));
  }

  private buildAssignmentListItem(definition: AssignmentDefinition): HTMLLIElement {
    const item = document.createElement('li');
    const summary = document.createElement('span');
    summary.textContent = `${definition.title} (${formatAssignmentDuration(definition.durationMinutes)})`;
    const detail = document.createElement('small');
    detail.textContent = definition.description;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Start';
    // The button sits left of its text, so several identical "Start" buttons need a name.
    button.setAttribute('aria-label', `Start ${definition.title}`);
    button.addEventListener('click', () =>
      this.options.domainEvents.emit('assignment-start-requested', { assignmentId: definition.id }),
    );
    item.append(summary, detail, button);
    return item;
  }

  /** The entrance prompt appears at once and fades away gently. Its words stay while it fades (the game reports an empty label
   * when there is nothing to enter, and clearing the words would make them blink out before the rest). */
  private setInteractionPrompt(visible: boolean, label: string): void {
    if (!visible) {
      this.promptNotice.hide();
      return;
    }
    assertElement('#interaction-prompt-label', HTMLElement).textContent = label;
    this.promptNotice.show();
  }

  /** Saves where the player is as they head back to the Main Menu, and switches Continue on so it can resume there. */
  private async autosave(): Promise<void> {
    try {
      await this.options.onAutosave();
      await this.refreshContinue();
    } catch {
      this.toast('Autosave unavailable — this browser is not letting the game save');
    }
  }

  private async importSave(fileInput: HTMLInputElement, screens: MenuScreens): Promise<void> {
    const file = fileInput.files?.[0];
    if (file === undefined) return;
    try {
      const state = await this.options.onImport(await file.text());
      await this.refreshContinue();
      await this.transition.run(async () => {
        this.loadCareerState(state);
        await this.enterGame(screens, state);
      });
      this.toast('Save imported and verified');
    } catch (error) {
      this.toast(error instanceof Error ? error.message : 'Save import failed');
    } finally {
      fileInput.value = '';
    }
  }

  /** Wires a footer link (Terms of Service / Privacy Policy) to open its dialog, and the dialog's own Close button and
   * backdrop click (same "click outside closes it" pattern as the Settings dialog) to close it again. */
  private mountLegalDialog(linkSelector: string, dialogSelector: string, closeSelector: string): void {
    const dialog = assertElement(dialogSelector, HTMLDialogElement);
    assertElement(linkSelector, HTMLButtonElement).addEventListener('click', () => dialog.showModal());
    assertElement(closeSelector, HTMLButtonElement).addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  private toggleFilmMode(button: HTMLButtonElement): void {
    const active = !document.body.classList.contains('film-mode');
    document.body.classList.toggle('film-mode', active);
    button.setAttribute('aria-pressed', String(active));
    // The button is icon-only now: aria-label is both its accessible name and (via the CSS tooltip's attr(aria-label)) its
    // on-screen tooltip text, so updating just this one attribute keeps both in sync. No `title` here: that would draw the
    // browser's own plain tooltip on top of the on-theme CSS one below the button, showing both at once.
    button.setAttribute('aria-label', active ? 'Return to Color' : 'Film Look');
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
    const music = Math.round(this.settings.musicVolume * 100);
    const ambience = Math.round(this.settings.ambienceVolume * 100);
    assertElement('#music-volume', HTMLInputElement).value = String(music);
    assertElement('#music-volume-output', HTMLOutputElement).value = `${music}%`;
    assertElement('#music-muted', HTMLInputElement).checked = this.settings.musicMuted;
    assertElement('#ambience-volume', HTMLInputElement).value = String(ambience);
    assertElement('#ambience-volume-output', HTMLOutputElement).value = `${ambience}%`;
    assertElement('#ambience-muted', HTMLInputElement).checked = this.settings.ambienceMuted;
  }

  private readSettingsForm(): GameSettings {
    return {
      textScale: Number(assertElement('#text-scale', HTMLInputElement).value) / 100,
      highContrast: assertElement('#high-contrast', HTMLInputElement).checked,
      reducedMotion: assertElement('#reduced-motion', HTMLInputElement).checked,
      filmEffects: assertElement('#film-effects', HTMLInputElement).checked,
      analyticsEnabled: assertElement('#analytics-enabled', HTMLInputElement).checked,
      musicVolume: Number(assertElement('#music-volume', HTMLInputElement).value) / 100,
      musicMuted: assertElement('#music-muted', HTMLInputElement).checked,
      ambienceVolume: Number(assertElement('#ambience-volume', HTMLInputElement).value) / 100,
      ambienceMuted: assertElement('#ambience-muted', HTMLInputElement).checked,
    };
  }

  private applySettings(settings: GameSettings): void {
    document.documentElement.style.setProperty('--text-scale', String(settings.textScale));
    document.body.classList.toggle('high-contrast', settings.highContrast);
    document.body.classList.toggle('reduced-motion', settings.reducedMotion);
    document.body.classList.toggle('film-effects-off', !settings.filmEffects);
  }

  private toast(message: string): void {
    assertElement('#toast', HTMLElement).textContent = message;
    this.toastNotice.show();
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastNotice.hide(), 2400);
  }

  private announce(message: string): void {
    assertElement('#announcer', HTMLElement).textContent = message;
  }
}

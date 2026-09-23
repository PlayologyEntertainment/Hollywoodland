import type { AssignmentResolution } from './Assignments';
import type { CareerState } from './CareerState';
import type { DialogueChoiceSelectedPayload } from './Dialogue';
import type { AuditionChoices, AuditionResult } from './Performance';
import type { TalentUnlockRequestedPayload } from './Progression';
import type { GameSettings } from '../settings/Settings';

export interface InteractionProximityChangedPayload {
  readonly visible: boolean;
  /** Empty when `visible` is false — the label of whichever interactable
   * the player is nearest to, now that the Boulevard has more than one
   * (see BoulevardSpikeScene's casting-office/diner interaction points). */
  readonly label: string;
}

export interface AuditionSubmittedPayload {
  readonly auditionId: string;
  readonly choices: AuditionChoices;
}

export interface AuditionResolvedPayload {
  readonly auditionId: string;
  readonly result: AuditionResult;
}

/** Fired instead of `boarding-house-entered` (which it replaces): opening
 * the Home Hub screen needs to know whether an idle assignment finished
 * while the player was away, so the scene resolves it and reports the
 * outcome (`undefined` when nothing was pending or nothing was due yet)
 * rather than the shell re-deriving it from state. */
export interface HomeHubEnteredPayload {
  readonly resolution: AssignmentResolution | undefined;
}

export interface AssignmentStartRequestedPayload {
  readonly assignmentId: string;
}

export interface LevelUpPayload {
  readonly level: number;
}

export interface StatusPanelVisibilityChangedPayload {
  readonly open: boolean;
}

export interface DomainEventMap {
  readonly 'career-state-changed': CareerState;
  readonly 'restore-career-state': CareerState;
  readonly 'settings-changed': GameSettings;
  readonly 'interaction-proximity-changed': InteractionProximityChangedPayload;
  readonly 'casting-office-entered': undefined;
  readonly 'diner-entered': undefined;
  readonly 'home-hub-entered': HomeHubEnteredPayload;
  readonly 'backlot-gate-entered': undefined;
  readonly 'extras-corral-entered': undefined;
  readonly 'soundstage-entered': undefined;
  readonly 'costume-shop-entered': undefined;
  readonly 'klieg-light-entered': undefined;
  readonly 'celestial-palace-entered': undefined;
  readonly 'advance-time-requested': undefined;
  readonly 'dialogue-choice-selected': DialogueChoiceSelectedPayload;
  readonly 'talent-unlock-requested': TalentUnlockRequestedPayload;
  readonly 'audition-submitted': AuditionSubmittedPayload;
  readonly 'audition-resolved': AuditionResolvedPayload;
  readonly 'assignment-start-requested': AssignmentStartRequestedPayload;
  /** Fired when an idle assignment resolves outside the Home Hub door flow
   * (a periodic check, or on load) rather than via `home-hub-entered` —
   * the player needs to be told the reward landed even though they aren't
   * looking at the Home Hub screen right now. See BoulevardSpikeScene's
   * `resolvePendingAssignment`. */
  readonly 'assignment-resolved-away': AssignmentResolution;
  readonly 'housing-upgrade-requested': undefined;
  /** Fired once from BoulevardSpikeScene.emitState when progression.level rises — the raw fact of a level-up,
   * which may happen mid-dialogue. See 'level-up-celebration' for the moment it's actually safe to show it. */
  readonly 'level-up': LevelUpPayload;
  /** AppShell's "go" signal once a pending level-up can actually be celebrated: the player is in game, out on the
   * open Boulevard, and no dialog is covering the screen. The scene's confetti burst listens for this (not
   * 'level-up'), so the VFX, the overlay and the SFX all land at the same moment. */
  readonly 'level-up-celebration': undefined;
  /** The Career panel opening/closing. Unlike the interaction/audition/Home Hub/Settings dialogs (native <dialog>
   * elements, already modal to pointer events over the whole page per the HTML spec), the status panel is a plain
   * <aside> covering only part of the screen — the Boulevard scene needs telling explicitly so a click on the
   * still-visible street doesn't move the player while it's open. */
  readonly 'status-panel-visibility-changed': StatusPanelVisibilityChangedPayload;
}

type DomainEventListener<K extends keyof DomainEventMap> = (payload: DomainEventMap[K]) => void;
type ErasedListener = (payload: unknown) => void;

/** A type-safe, engine-independent pub/sub bus. Replaces Phaser's untyped
 * `game.events` emitter so domain state can flow through UI, saves, and
 * analytics without any of them importing Phaser. The public API is fully
 * typed by DomainEventMap; the erased internal storage is a standard
 * workaround for TypeScript's inability to relate a generic key to a
 * mapped-type lookup. */
export class DomainEventBus {
  private readonly listeners = new Map<keyof DomainEventMap, Set<ErasedListener>>();

  public on<K extends keyof DomainEventMap>(event: K, listener: DomainEventListener<K>): () => void {
    const set = this.listeners.get(event) ?? new Set<ErasedListener>();
    set.add(listener as ErasedListener);
    this.listeners.set(event, set);
    return () => this.off(event, listener);
  }

  public off<K extends keyof DomainEventMap>(event: K, listener: DomainEventListener<K>): void {
    this.listeners.get(event)?.delete(listener as ErasedListener);
  }

  public emit<K extends keyof DomainEventMap>(event: K, payload: DomainEventMap[K]): void {
    const set = this.listeners.get(event);
    if (set === undefined) return;
    for (const listener of set) listener(payload);
  }
}

import type { CareerState } from './CareerState';
import type { DialogueChoiceSelectedPayload } from './Dialogue';
import type { TalentUnlockRequestedPayload } from './Progression';
import type { GameSettings } from '../settings/Settings';

export interface InteractionProximityChangedPayload {
  readonly visible: boolean;
  /** Empty when `visible` is false — the label of whichever interactable
   * the player is nearest to, now that the Boulevard has more than one
   * (see BoulevardSpikeScene's casting-office/diner interaction points). */
  readonly label: string;
}

export interface DomainEventMap {
  readonly 'career-state-changed': CareerState;
  readonly 'restore-career-state': CareerState;
  readonly 'settings-changed': GameSettings;
  readonly 'interaction-proximity-changed': InteractionProximityChangedPayload;
  readonly 'casting-office-entered': undefined;
  readonly 'diner-entered': undefined;
  readonly 'boarding-house-entered': undefined;
  readonly 'backlot-gate-entered': undefined;
  readonly 'extras-corral-entered': undefined;
  readonly 'soundstage-entered': undefined;
  readonly 'advance-time-requested': undefined;
  readonly 'dialogue-choice-selected': DialogueChoiceSelectedPayload;
  readonly 'talent-unlock-requested': TalentUnlockRequestedPayload;
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

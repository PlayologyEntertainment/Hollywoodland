import type { CareerState } from '../domain/CareerState';
import type { InventoryItemDefinition } from '../domain/Inventory';
import { getActiveStage, getActiveStageIndex, getQuestStatus, type QuestDef } from '../domain/Quests';
import type { RelationshipCharacter } from '../domain/Relationships';

/** What the Objective card is telling the player to do. */
export interface Objective {
  /** `quest` for a real goal, `idle` when there is nothing open. */
  readonly kind: 'quest' | 'idle';
  readonly questId: string | undefined;
  readonly stageId: string | undefined;
  /** The small line above the goal: the quest's name. */
  readonly title: string;
  /** The goal itself, in the words of the quest's current stage. */
  readonly goal: string;
}

export const IDLE_OBJECTIVE: Objective = Object.freeze({
  kind: 'idle',
  questId: undefined,
  stageId: undefined,
  title: 'All caught up',
  goal: 'Explore the Boulevard',
});

/**
 * The objective to show: the first quest that is in progress (in the quests' own order), or, when none has been started, the
 * top open quest in the quest log. A quest that is open but not started shows its first stage's goal. When nothing is open, the
 * idle "all caught up" message. Pure, so the choice is tested without a browser.
 */
export function chooseObjective(
  state: CareerState,
  quests: readonly QuestDef[],
  roster: readonly RelationshipCharacter[],
  items: readonly InventoryItemDefinition[] = [],
): Objective {
  const open = quests
    .map((quest) => ({ quest, status: getQuestStatus(state, quest, quests, roster, items) }))
    .filter(({ status }) => status === 'active' || status === 'available');
  const chosen = open.find(({ status }) => status === 'active') ?? open[0];
  if (chosen === undefined) return IDLE_OBJECTIVE;
  const stage = (chosen.status === 'active' ? getActiveStage(state, chosen.quest) : undefined) ?? chosen.quest.stages[0];
  if (stage === undefined) return IDLE_OBJECTIVE;
  return { kind: 'quest', questId: chosen.quest.id, stageId: stage.id, title: chosen.quest.title, goal: stage.description };
}

/** Whether the goal `objective` described has been accomplished: its stage is now complete, whether or not the quest goes on. */
export function isObjectiveAccomplished(objective: Objective, state: CareerState, quests: readonly QuestDef[]): boolean {
  if (objective.kind !== 'quest') return false;
  const quest = quests.find((candidate) => candidate.id === objective.questId);
  if (quest === undefined) return false;
  const stageIndex = quest.stages.findIndex((stage) => stage.id === objective.stageId);
  if (stageIndex < 0) return false;
  // -1 means not started, and a quest's index reaches `stages.length` once every stage is done.
  return getActiveStageIndex(state, quest) > stageIndex;
}

function sameObjective(a: Objective, b: Objective): boolean {
  return a.kind === b.kind && a.questId === b.questId && a.stageId === b.stageId && a.title === b.title && a.goal === b.goal;
}

/** Draws an objective; the tracker does not care how. `complete` is the green "goal accomplished" look. */
export interface ObjectiveView {
  show(objective: Objective, complete: boolean): void;
}

/** How long the green "complete" beat stays before the card moves on to the next goal. */
export const OBJECTIVE_COMPLETE_MS = 3000;

/**
 * Keeps the Objective card up to date as the career changes. It shows the chosen objective; when the goal it was showing is
 * accomplished it holds that goal, in the green "complete" look, for a few seconds, then moves to whatever is next. Career state
 * arrives many times a second, so nothing is redrawn unless the objective actually changes, and updates that arrive during the
 * beat are held and applied when it ends (one beat, not a queue of them).
 *
 * Goals are usually accomplished inside a conversation, which covers the card. While `isCovered` says so, the card goes green but
 * the beat's clock does not start; it starts on the first update after the conversation closes, so the player sees the whole beat.
 *
 * `reset` forgets everything, for when a different career is loaded, so that a save that is further along than the one before
 * it does not play a beat for progress the player never saw.
 */
export class ObjectiveTracker {
  private current: Objective | undefined;
  private latest: CareerState | undefined;
  /** A goal has been accomplished and the green look is showing, until the beat ends. */
  private holding = false;
  private beat: ReturnType<typeof setTimeout> | undefined;

  public constructor(
    private readonly view: ObjectiveView,
    private readonly choose: (state: CareerState) => Objective,
    private readonly accomplished: (objective: Objective, state: CareerState) => boolean,
    /** Says a change out loud for screen readers. */
    private readonly announce: (message: string) => void = () => undefined,
    private readonly beatMs: number = OBJECTIVE_COMPLETE_MS,
    /** True while something covers the card (a conversation), so a beat is not played out of sight. */
    private readonly isCovered: () => boolean = () => false,
  ) {}

  public update(state: CareerState): void {
    this.latest = state;
    if (this.holding) {
      if (this.beat === undefined && !this.isCovered()) this.startBeat();
      return;
    }
    const next = this.choose(state);
    if (this.current === undefined) {
      this.current = next;
      this.view.show(next, false);
      return;
    }
    if (this.accomplished(this.current, state)) {
      this.view.show(this.current, true);
      this.announce(`Objective complete: ${this.current.goal}`);
      this.holding = true;
      if (!this.isCovered()) this.startBeat();
      return;
    }
    if (!sameObjective(this.current, next)) {
      this.current = next;
      this.view.show(next, false);
    }
  }

  public reset(): void {
    if (this.beat !== undefined) clearTimeout(this.beat);
    this.beat = undefined;
    this.holding = false;
    this.current = undefined;
    this.latest = undefined;
  }

  private startBeat(): void {
    this.beat = setTimeout(() => this.finishBeat(), this.beatMs);
  }

  private finishBeat(): void {
    this.beat = undefined;
    this.holding = false;
    if (this.latest === undefined) return;
    const next = this.choose(this.latest);
    this.current = next;
    this.view.show(next, false);
    this.announce(next.kind === 'idle' ? `${next.title}. ${next.goal}` : `New objective: ${next.goal}`);
  }
}

import { ALL_ASSIGNMENTS } from '../domain/AssignmentDefinitions';
import type { DialogueCondition, DialogueEffect } from '../domain/Dialogue';
import { DIALOGUE_GRAPHS } from '../domain/DialogueGraphs';
import { HOUSING_TIERS } from '../domain/Housing';
import { ALL_ITEMS } from '../domain/InventoryDefinitions';
import { ORIGINS } from '../domain/Origins';
import { ALL_AUDITIONS } from '../domain/PerformanceDefinitions';
import { PLAYER_CHARACTERS } from '../domain/PlayerCharacters';
import type { QuestCondition, QuestStageReward } from '../domain/Quests';
import { ALL_QUESTS } from '../domain/QuestDefinitions';
import { ALL_RELATIONSHIP_CHARACTERS } from '../domain/RelationshipDefinitions';
import { ALL_TALENTS } from '../domain/TalentDefinitions';
import { DEFAULT_BOULEVARD_MANIFEST } from '../game/BoulevardManifest';
import { SCENE_ART_ALT } from '../game/SceneArtText';
import { contentKeys } from '../i18n/contentKeys';
import { collectContentStrings } from '../i18n/contentStrings';
import { hashText } from '../i18n/hash';
import { LOCALES, SOURCE_LOCALE } from '../i18n/locales';

/** Bump when the shape changes, so the Story Planner can tell it is reading a file it does not understand. */
export const NARRATIVE_SNAPSHOT_VERSION = 1;

/** How a translation stands against the current English: written from it, written from older English, or not written. */
export type TranslationStatus = 'ok' | 'stale' | 'missing';

export interface SnapshotString {
  readonly en: string;
  /** Status per language code (every language but English). */
  readonly tr: Readonly<Record<string, TranslationStatus>>;
}

export interface LocaleInputs {
  readonly catalogs: Readonly<Record<string, Readonly<Record<string, string>>>>;
  /** Per language, the fingerprint of the English each translation was made from (src/locales/meta/<code>.json). */
  readonly hashes: Readonly<Record<string, Readonly<Record<string, string>>>>;
}

type Summarizable = DialogueCondition | DialogueEffect | QuestCondition | QuestStageReward;

const signed = (value: number): string => `${value > 0 ? '+' : ''}${value}`;

/** One plain-English line for a condition or effect, for the content browser. Total over every kind the game has; anything it
 * does not know is shown as its JSON, so nothing is ever silently hidden. */
export function summarize(item: Summarizable): string {
  const any = item as unknown as Record<string, unknown> & { kind: string };
  switch (any.kind) {
    case 'fact':
      return `fact "${String(any.fact)}" is ${any.equals === false ? 'not set' : 'set'}`;
    case 'resource-at-least':
      return `${String(any.resource)} is at least ${String(any.minimum)}`;
    case 'quest-status':
      return `quest "${String(any.questId)}" is ${String(any.status)}`;
    case 'relationship-at-least':
      return `${String(any.characterId)} ${String(any.axis)} is at least ${String(any.minimum)}`;
    case 'relationship-label':
      return `relationship with ${String(any.characterId)} is ${String(any.label)}`;
    case 'level-at-least':
      return `level is at least ${String(any.minimum)}`;
    case 'talent-unlocked':
      return `talent "${String(any.talentId)}" is unlocked`;
    case 'item-owned':
      return `owns item "${String(any.itemId)}"`;
    case 'set-fact':
      return `sets fact "${String(any.fact)}"${any.value === false ? ' to false' : ''}`;
    case 'resource-delta': {
      const delta = any.delta as Record<string, number>;
      return Object.entries(delta).map(([name, amount]) => `${name} ${signed(amount)}`).join(', ');
    }
    case 'quest-action':
      return `${String(any.action)} quest "${String(any.questId)}"${typeof any.stageId === 'string' ? ` (stage "${any.stageId}")` : ''}`;
    case 'relationship-delta': {
      const delta = any.delta as Record<string, number>;
      return `${String(any.characterId)}: ${Object.entries(delta).map(([axis, amount]) => `${axis} ${signed(amount)}`).join(', ')}`;
    }
    case 'relationship-pivotal-flag':
      return `${String(any.characterId)}: memory "${String(any.flag)}"`;
    case 'xp-grant':
      return `${String(any.amount)} XP`;
    case 'item-grant':
      return `grants item "${String(any.itemId)}"`;
    default:
      return JSON.stringify(item);
  }
}

function conditionsOf(list: readonly Summarizable[] | undefined): string[] {
  return (list ?? []).map(summarize);
}

/** Who and what a piece of dialogue touches, so a plan beat can be tied to real content. */
function touched(items: readonly Summarizable[]): { quests: string[]; characters: string[] } {
  const quests = new Set<string>();
  const characters = new Set<string>();
  for (const item of items) {
    const any = item as unknown as Record<string, unknown>;
    if (typeof any.questId === 'string') quests.add(any.questId);
    if (typeof any.characterId === 'string') characters.add(any.characterId);
  }
  return { quests: [...quests].sort(), characters: [...characters].sort() };
}

/** Everything the game has written, in one structure the Story Planner reads. Text is addressed by its catalog key (the same
 * `content.*` keys as src/locales/en.json), and each key's entry in `strings` carries the English and how each translation
 * stands, so an edit to a key is unambiguous and its knock-on effect on the translations is visible. */
export function buildNarrativeSnapshot(locales: LocaleInputs): Record<string, unknown> {
  const english = collectContentStrings();
  const codes = LOCALES.filter((info) => info.code !== SOURCE_LOCALE).map((info) => info.code);

  const strings: Record<string, SnapshotString> = {};
  for (const [key, en] of Object.entries(english)) {
    const tr: Record<string, TranslationStatus> = {};
    for (const code of codes) {
      const translated = locales.catalogs[code]?.[key];
      if (translated === undefined) tr[code] = 'missing';
      else tr[code] = locales.hashes[code]?.[key] === hashText(en) ? 'ok' : 'stale';
    }
    strings[key] = { en, tr };
  }

  const dialogue = Object.values(DIALOGUE_GRAPHS).map((graph) => {
    const nodes = graph.nodes.map((node) => ({
      id: node.id,
      speaker: contentKeys.dialogueSpeaker(graph.id, node.id),
      text: contentKeys.dialogueText(graph.id, node.id),
      choices: node.choices.map((choice) => ({
        id: choice.id,
        label: contentKeys.dialogueChoice(graph.id, node.id, choice.id),
        next: choice.next,
        conditions: conditionsOf(choice.conditions),
        effects: conditionsOf(choice.effects),
        opensHomeHub: choice.opensHomeHub === true,
        startsAudition: choice.startsAudition ?? null,
      })),
    }));
    const all = graph.nodes.flatMap((node) => node.choices.flatMap((choice) => [...(choice.conditions ?? []), ...(choice.effects ?? [])]));
    return { id: graph.id, root: graph.rootNodeId, nodes, touches: touched(all) };
  });

  const quests = ALL_QUESTS.map((quest) => ({
    id: quest.id,
    title: contentKeys.questTitle(quest.id),
    summary: contentKeys.questSummary(quest.id),
    prerequisites: conditionsOf(quest.prerequisites),
    stages: quest.stages.map((stage) => ({
      id: stage.id,
      text: contentKeys.questStage(quest.id, stage.id),
      rewards: conditionsOf(stage.rewards),
    })),
  }));

  const cast = {
    characters: ALL_RELATIONSHIP_CHARACTERS.map((character) => ({
      id: character.id,
      role: contentKeys.characterRole(character.id),
      supportsAttraction: character.supportsAttraction,
    })),
    origins: ORIGINS.map((origin) => ({ id: origin.id, name: contentKeys.originName(origin.id), blurb: contentKeys.originBlurb(origin.id) })),
    players: PLAYER_CHARACTERS.map((player) => ({ id: player.id, label: contentKeys.playerCharacter(player.id) })),
    housing: HOUSING_TIERS.map((tier) => ({ id: tier.tier, label: contentKeys.housingTier(tier.tier), upgradeCost: tier.upgradeCost })),
    locations: DEFAULT_BOULEVARD_MANIFEST.locations.map((location) => ({
      id: location.id,
      label: location.label,
      prompt: location.promptLabel !== '' ? contentKeys.locationPrompt(location.id) : null,
      enterable: location.enterable,
    })),
    sceneArt: Object.keys(SCENE_ART_ALT).map((key) => ({ id: key, alt: contentKeys.sceneArtAlt(key) })),
  };

  const other = {
    assignments: ALL_ASSIGNMENTS.map((assignment) => ({
      id: assignment.id,
      category: assignment.category,
      title: contentKeys.assignmentTitle(assignment.id),
      description: contentKeys.assignmentDescription(assignment.id),
      housing: assignment.requiredHousingTier,
      level: assignment.requiredLevel ?? 1,
      durationMinutes: assignment.durationMinutes,
      rewards: conditionsOf(assignment.rewards),
    })),
    talents: ALL_TALENTS.map((talent) => ({
      id: talent.id,
      branch: talent.branch,
      name: contentKeys.talentName(talent.id),
      description: contentKeys.talentDescription(talent.id),
    })),
    items: ALL_ITEMS.map((item) => ({
      id: item.id,
      category: item.category,
      name: contentKeys.itemName(item.id),
      description: contentKeys.itemDescription(item.id),
      unlockSource: item.unlockSource,
    })),
    auditions: ALL_AUDITIONS.map((audition) => ({
      id: audition.id,
      title: contentKeys.auditionTitle(audition.id),
      scenePartnerId: audition.scenePartnerId,
      checks: audition.preparationChecks.map((_, index) => contentKeys.auditionCheck(audition.id, index)),
      categories: audition.categories.map((category) => ({
        kind: category.kind,
        prompt: contentKeys.auditionPrompt(audition.id, category.kind),
        options: category.options.map((option) => ({ id: option.id, label: contentKeys.auditionOption(audition.id, option.id) })),
      })),
    })),
  };

  return {
    version: NARRATIVE_SNAPSHOT_VERSION,
    note: 'Generated by `npm run narrative:export`. Do not edit by hand; the Story Planner reads it.',
    locales: LOCALES.filter((info) => info.code !== SOURCE_LOCALE).map((info) => ({ code: info.code, name: info.nativeName })),
    strings,
    dialogue,
    quests,
    cast,
    other,
  };
}

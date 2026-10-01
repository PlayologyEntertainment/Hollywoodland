import { ALL_ASSIGNMENTS } from '../domain/AssignmentDefinitions';
import { DIALOGUE_GRAPHS } from '../domain/DialogueGraphs';
import { HOUSING_TIERS } from '../domain/Housing';
import { ALL_ITEMS } from '../domain/InventoryDefinitions';
import { ORIGINS } from '../domain/Origins';
import { REGIONS } from '../domain/Travel';
import { ALL_AUDITIONS } from '../domain/PerformanceDefinitions';
import { PLAYER_CHARACTERS } from '../domain/PlayerCharacters';
import { ALL_QUESTS } from '../domain/QuestDefinitions';
import { ALL_RELATIONSHIP_CHARACTERS } from '../domain/RelationshipDefinitions';
import { ALL_TALENTS } from '../domain/TalentDefinitions';
import { DEFAULT_BOULEVARD_MANIFEST } from '../game/BoulevardManifest';
import { SCENE_ART_ALT } from '../game/SceneArtText';
import { contentKeys } from './contentKeys';

/** Every translatable string in the authored content, by catalog key, in English. This is the source of truth for the
 * `content.*` half of `src/locales/en.json`: `npm run i18n:sync` writes it there, and tests/content-catalog.test.ts fails when
 * the two drift apart. */
export function collectContentStrings(): Record<string, string> {
  const out: Record<string, string> = {};

  for (const quest of ALL_QUESTS) {
    out[contentKeys.questTitle(quest.id)] = quest.title;
    out[contentKeys.questSummary(quest.id)] = quest.summary;
    for (const stage of quest.stages) out[contentKeys.questStage(quest.id, stage.id)] = stage.description;
  }
  for (const talent of ALL_TALENTS) {
    out[contentKeys.talentName(talent.id)] = talent.name;
    out[contentKeys.talentDescription(talent.id)] = talent.description;
  }
  for (const item of ALL_ITEMS) {
    out[contentKeys.itemName(item.id)] = item.name;
    out[contentKeys.itemDescription(item.id)] = item.description;
  }
  for (const assignment of ALL_ASSIGNMENTS) {
    out[contentKeys.assignmentTitle(assignment.id)] = assignment.title;
    out[contentKeys.assignmentDescription(assignment.id)] = assignment.description;
  }
  for (const character of ALL_RELATIONSHIP_CHARACTERS) out[contentKeys.characterRole(character.id)] = character.role;
  for (const tier of HOUSING_TIERS) out[contentKeys.housingTier(tier.tier)] = tier.label;
  for (const origin of ORIGINS) {
    out[contentKeys.originName(origin.id)] = origin.name;
    out[contentKeys.originBlurb(origin.id)] = origin.blurb;
  }
  for (const character of PLAYER_CHARACTERS) out[contentKeys.playerCharacter(character.id)] = character.label;

  for (const audition of ALL_AUDITIONS) {
    out[contentKeys.auditionTitle(audition.id)] = audition.title;
    audition.preparationChecks.forEach((check, index) => {
      out[contentKeys.auditionCheck(audition.id, index)] = check.label;
    });
    for (const category of audition.categories) {
      out[contentKeys.auditionPrompt(audition.id, category.kind)] = category.prompt;
      for (const option of category.options) out[contentKeys.auditionOption(audition.id, option.id)] = option.label;
    }
  }

  for (const graph of Object.values(DIALOGUE_GRAPHS)) {
    for (const node of graph.nodes) {
      out[contentKeys.dialogueSpeaker(graph.id, node.id)] = node.speaker;
      out[contentKeys.dialogueText(graph.id, node.id)] = node.text;
      for (const choice of node.choices) out[contentKeys.dialogueChoice(graph.id, node.id, choice.id)] = choice.label;
    }
  }

  for (const region of REGIONS) {
    out[contentKeys.regionName(region.id)] = region.name;
    out[contentKeys.regionCity(region.id)] = region.city;
    out[contentKeys.regionSubtitle(region.id)] = region.subtitle;
  }
  for (const location of DEFAULT_BOULEVARD_MANIFEST.locations) {
    if (location.promptLabel !== '') out[contentKeys.locationPrompt(location.id)] = location.promptLabel;
  }
  for (const [key, alt] of Object.entries(SCENE_ART_ALT)) out[contentKeys.sceneArtAlt(key)] = alt;

  return out;
}

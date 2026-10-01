import { contentKeys } from './contentKeys';
import { i18n } from './index';

/** The player-facing words of authored content, in the active language. Every accessor is given the definition itself: its ids
 * make the catalog key, and its own inline English is the fallback, so content that has no translation yet (or a language that
 * has not loaded) reads exactly as it was written. Display code calls these instead of reading `.title`, `.text` and so on. */
const text = (key: string, fallback: string): string => i18n.raw(key, fallback);

export const questTitle = (quest: { id: string; title: string }): string => text(contentKeys.questTitle(quest.id), quest.title);
export const questSummary = (quest: { id: string; summary: string }): string => text(contentKeys.questSummary(quest.id), quest.summary);
export const questStageDescription = (quest: { id: string }, stage: { id: string; description: string }): string =>
  text(contentKeys.questStage(quest.id, stage.id), stage.description);

export const talentName = (talent: { id: string; name: string }): string => text(contentKeys.talentName(talent.id), talent.name);
export const talentDescription = (talent: { id: string; description: string }): string =>
  text(contentKeys.talentDescription(talent.id), talent.description);

export const itemName = (item: { id: string; name: string }): string => text(contentKeys.itemName(item.id), item.name);
export const itemDescription = (item: { id: string; description: string }): string => text(contentKeys.itemDescription(item.id), item.description);

export const assignmentTitle = (assignment: { id: string; title: string }): string => text(contentKeys.assignmentTitle(assignment.id), assignment.title);
export const assignmentDescription = (assignment: { id: string; description: string }): string =>
  text(contentKeys.assignmentDescription(assignment.id), assignment.description);

export const characterRole = (character: { id: string; role: string }): string => text(contentKeys.characterRole(character.id), character.role);
export const regionName = (region: { id: string; name: string }): string => text(contentKeys.regionName(region.id), region.name);
export const regionCity = (region: { id: string; city: string }): string => text(contentKeys.regionCity(region.id), region.city);
export const regionSubtitle = (region: { id: string; subtitle: string }): string => text(contentKeys.regionSubtitle(region.id), region.subtitle);
export const housingTierLabel = (tier: { tier: string; label: string }): string => text(contentKeys.housingTier(tier.tier), tier.label);
export const originName = (origin: { id: string; name: string }): string => text(contentKeys.originName(origin.id), origin.name);
export const originBlurb = (origin: { id: string; blurb: string }): string => text(contentKeys.originBlurb(origin.id), origin.blurb);
export const playerCharacterLabel = (character: { id: string; label: string }): string => text(contentKeys.playerCharacter(character.id), character.label);

export const auditionTitle = (audition: { id: string; title: string }): string => text(contentKeys.auditionTitle(audition.id), audition.title);
export const auditionCheckLabel = (audition: { id: string }, index: number, label: string): string =>
  text(contentKeys.auditionCheck(audition.id, index), label);
export const auditionPrompt = (audition: { id: string }, category: { kind: string; prompt: string }): string =>
  text(contentKeys.auditionPrompt(audition.id, category.kind), category.prompt);
export const auditionOptionLabel = (audition: { id: string }, option: { id: string; label: string }): string =>
  text(contentKeys.auditionOption(audition.id, option.id), option.label);

export const dialogueSpeaker = (graphId: string, node: { id: string; speaker: string }): string =>
  text(contentKeys.dialogueSpeaker(graphId, node.id), node.speaker);
export const dialogueText = (graphId: string, node: { id: string; text: string }): string => text(contentKeys.dialogueText(graphId, node.id), node.text);
export const dialogueChoiceLabel = (graphId: string, node: { id: string }, choice: { id: string; label: string }): string =>
  text(contentKeys.dialogueChoice(graphId, node.id, choice.id), choice.label);

export const locationPrompt = (location: { id: string; promptLabel: string }): string => text(contentKeys.locationPrompt(location.id), location.promptLabel);
export const sceneArtAlt = (locationKey: string, fallback: string): string => text(contentKeys.sceneArtAlt(locationKey), fallback);

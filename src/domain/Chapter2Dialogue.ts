import { CHAPTER_TWO_STARTED_FACT } from './Chapters';
import type { DialogueChoice, DialogueCondition, DialogueEffect, DialogueEntryVariant, DialogueNode } from './Dialogue';
import { stageCompleteFact, type QuestStatus } from './Quests';
import {
  CASTING_GATEKEEPER,
  DINER_CONFIDANT,
  HOUSE_MANAGER,
  LANDLADY,
  LEADING_MAN,
  MENTOR_EXTRA,
  PRODUCTION_COORDINATOR,
  PUBLICITY_CHIEF,
  REPORTER,
  RIVAL,
  SCENE_PARTNER,
  WARDROBE_MENTOR,
} from './RelationshipDefinitions';

/**
 * Chapter 2, "A Small Part" (docs/DRAFT_CHAPTERS_2_10_CANON_PROPOSAL.md): the dialogue for each Boulevard place. Every place
 * keeps its Chapter 1 conversation untouched and gains a Chapter 2 hub (`c2-root`) that the place opens on once the Chapter 2
 * title page has been read (see `DialogueGraph.entryVariants`). The hub offers whatever Chapter 2 has for that place right now,
 * and "something else" goes back to the Chapter 1 conversation, so nothing the player could do before is lost.
 *
 * Like the rest of the content, speakers are roles rather than names. Every node id here starts with `c2-` so it can never
 * collide with a Chapter 1 node of the same graph.
 *
 * Quest-completing choices cost 10 Energy, with the cost written in the label, as in Chapter 1 (tests/dialogue-energy-cost.test.ts).
 */

export interface ChapterTwoPlace {
  readonly entry: DialogueEntryVariant;
  readonly nodes: readonly DialogueNode[];
}

const ENERGY_COST_LABEL = ' (-10 Energy)';
const ENERGY_CONDITION: DialogueCondition = { kind: 'resource-at-least', resource: 'energy', minimum: 10 };
const ENERGY_EFFECT: DialogueEffect = { kind: 'resource-delta', delta: { energy: -10 } };

const CHAPTER_TWO_OPEN: DialogueCondition = { kind: 'fact', fact: CHAPTER_TWO_STARTED_FACT };
const entry = (): DialogueEntryVariant => ({ conditions: [CHAPTER_TWO_OPEN], rootNodeId: 'c2-root' });

const quest = (questId: string, status: QuestStatus): DialogueCondition => ({ kind: 'quest-status', questId, status });
const fact = (name: string, equals = true): DialogueCondition => ({ kind: 'fact', fact: name, equals });
const stageDone = (questId: string, stageId: string, equals = true): DialogueCondition => fact(stageCompleteFact(questId, stageId), equals);

const setFact = (name: string): DialogueEffect => ({ kind: 'set-fact', fact: name });
const startQuest = (questId: string): DialogueEffect => ({ kind: 'quest-action', action: 'start', questId });
const completeStage = (questId: string, stageId: string): DialogueEffect => ({ kind: 'quest-action', action: 'complete-stage', questId, stageId });
/** Starts a quest and completes its first stage: the pattern a quest's opening conversation uses. */
const beginQuest = (questId: string, firstStageId: string): DialogueEffect[] => [startQuest(questId), completeStage(questId, firstStageId)];
const rel = (characterId: string, delta: { trust?: number; tension?: number; attraction?: number; obligation?: number }): DialogueEffect => ({
  kind: 'relationship-delta',
  characterId,
  delta,
});

const leave = (id = 'c2-leave', label = 'Step back outside.'): DialogueChoice => ({ id, label, next: null });
/** Back to the place's Chapter 1 conversation. */
const somethingElse = (): DialogueChoice => ({ id: 'c2-something-else', label: 'Talk about something else.', next: 'root' });

// ---------------------------------------------------------------------------------------------------------------------
// Sunset Casting Exchange: the verdict on the screen test (the-lookout, stage 1)
// ---------------------------------------------------------------------------------------------------------------------

type ScreenTestOutcome = 'breakthrough' | 'promising-complication' | 'wrong-role-right-notice' | 'memorable-setback';

const VERDICTS: ReadonlyArray<{ outcome: ScreenTestOutcome; id: string; text: string; fourthLine: boolean; trust: number }> = [
  {
    outcome: 'breakthrough',
    id: 'breakthrough',
    text: '"The assistant director watched your test twice," the clerk says, and something that is almost a smile crosses her face. "The Lookout, harbor market, three lines, and a fourth they wrote in after the dailies. Monarch wants you."',
    fourthLine: true,
    trust: 4,
  },
  {
    outcome: 'promising-complication',
    id: 'promising',
    text: '"They liked it. They also had questions," the clerk says, in the voice of someone who has learned not to say more. "The Lookout, three lines. The part is yours; the questions can wait."',
    fourthLine: false,
    trust: 2,
  },
  {
    outcome: 'wrong-role-right-notice',
    id: 'wrong-role',
    text: '"You weren\'t what they were testing for," the clerk says. "But the casting director saw something, and there is a small part going: the Lookout, harbor market, three lines and a pickpocket\'s cap. Take it before somebody else sees what he saw."',
    fourthLine: false,
    trust: 2,
  },
  {
    outcome: 'memorable-setback',
    id: 'setback',
    text: '"It wasn\'t your best day," the clerk says, not unkindly. "But the assistant director argued for you, and the Lookout is still unfilled. Three lines. Don\'t make me regret this."',
    fourthLine: false,
    trust: 1,
  },
];

const verdictNode = (verdict: (typeof VERDICTS)[number]): DialogueNode => {
  const takeIt: DialogueChoice = {
    id: 'take-the-part',
    label: verdict.fourthLine ? 'Take the part, and the fourth line.' : 'Take the part as offered.',
    next: 'c2-verdict-taken',
    effects: [
      ...beginQuest('the-lookout', 'hear-the-verdict'),
      { kind: 'item-grant', itemId: 'lookout-sides' },
      rel(CASTING_GATEKEEPER.id, { trust: verdict.trust }),
      ...(verdict.fourthLine ? [setFact('lookout:fourth-line')] : []),
    ],
  };
  const pushes: DialogueChoice[] = verdict.fourthLine
    ? []
    : [
        {
          id: 'push-with-charm',
          label: 'Charm her into one more line.',
          next: 'c2-verdict-pushed',
          conditions: [{ kind: 'talent-unlocked', talentId: 'charm-1' }],
          effects: [
            ...beginQuest('the-lookout', 'hear-the-verdict'),
            { kind: 'item-grant', itemId: 'lookout-sides' },
            rel(CASTING_GATEKEEPER.id, { trust: verdict.trust + 1 }),
            setFact('lookout:fourth-line'),
          ],
        },
        {
          id: 'push-with-wit',
          label: 'Joke your way to one more line.',
          next: 'c2-verdict-pushed',
          conditions: [{ kind: 'talent-unlocked', talentId: 'comedy-1' }],
          effects: [
            ...beginQuest('the-lookout', 'hear-the-verdict'),
            { kind: 'item-grant', itemId: 'lookout-sides' },
            rel(CASTING_GATEKEEPER.id, { trust: verdict.trust + 1 }),
            setFact('lookout:fourth-line'),
          ],
        },
        {
          id: 'push-anyway',
          label: 'Ask for one more line anyway.',
          next: 'c2-verdict-refused',
          effects: [
            ...beginQuest('the-lookout', 'hear-the-verdict'),
            { kind: 'item-grant', itemId: 'lookout-sides' },
            rel(CASTING_GATEKEEPER.id, { tension: 3 }),
          ],
        },
      ];
  return { id: `c2-verdict-${verdict.id}`, speaker: 'Clerk', text: verdict.text, choices: [takeIt, ...pushes] };
};

const CASTING_OFFICE_NODES: DialogueNode[] = [
  {
    id: 'c2-root',
    speaker: 'Clerk',
    text: 'For the first time since you walked in, the clerk looks up from her folder. "Monarch has been ringing this desk all morning," she says. "Sit. Don\'t touch anything."',
    choices: [
      ...VERDICTS.map<DialogueChoice>((verdict) => ({
        id: `ask-about-the-test-${verdict.id}`,
        label: 'Ask what Monarch made of your screen test.',
        next: `c2-verdict-${verdict.id}`,
        conditions: [quest('the-lookout', 'available'), fact(`screen-test:outcome:${verdict.outcome}`)],
      })),
      somethingElse(),
      leave(),
    ],
  },
  ...VERDICTS.map(verdictNode),
  {
    id: 'c2-verdict-taken',
    speaker: 'Clerk',
    text: 'She slides three pencilled pages across the counter. "Your sides. The Lookout warns the heroine in the harbor market, and then she runs. Take them to the wardrobe mistress at The Silver Thimble, and the extras corral will give you a call time."',
    choices: [{ id: 'take-the-sides', label: 'Take the pages and thank her.', next: null }],
  },
  {
    id: 'c2-verdict-pushed',
    speaker: 'Clerk',
    text: 'She looks at you for a long moment, then pulls a pencil from her hair and scrawls a line at the bottom of the last page. "A fourth line. Don\'t let it go to your head." She slides the pages across. "Wardrobe at The Silver Thimble, then the extras corral for a call time."',
    choices: [{ id: 'take-the-sides-pushed', label: 'Take the pages, and the extra line.', next: null }],
  },
  {
    id: 'c2-verdict-refused',
    speaker: 'Clerk',
    text: '"No," she says, flatly, and the pencil goes back in her hair. "Three lines is three lines." She slides the pages across anyway. "Wardrobe at The Silver Thimble, then the extras corral for a call time. Next time ask nicer, or ask later."',
    choices: [{ id: 'take-the-sides-refused', label: 'Take the pages and let it go.', next: null }],
  },
];

export const CASTING_OFFICE_CHAPTER_TWO: ChapterTwoPlace = { entry: entry(), nodes: CASTING_OFFICE_NODES };

// ---------------------------------------------------------------------------------------------------------------------
// The extras corral: the call time (the-lookout, stage 2) and the invitation to the Bowl (under-the-stars, stage 1)
// ---------------------------------------------------------------------------------------------------------------------

export const EXTRAS_CORRAL_CHAPTER_TWO: ChapterTwoPlace = {
  entry: entry(),
  nodes: [
    {
      id: 'c2-root',
      speaker: 'Production Coordinator',
      text: 'The assistant director is pinning call sheets to the corral board with a thumbtack in his teeth. "The Lookout," he says around it. "Good. I was hoping it would be someone who shows up."',
      choices: [
        {
          id: 'get-your-call-time',
          label: `Ask for your call time.${ENERGY_COST_LABEL}`,
          next: 'c2-call-sheet',
          conditions: [quest('the-lookout', 'active'), stageDone('the-lookout', 'hear-the-verdict'), ENERGY_CONDITION],
          effects: [completeStage('the-lookout', 'sign-the-call-sheet'), rel(PRODUCTION_COORDINATOR.id, { trust: 3 }), ENERGY_EFFECT],
        },
        {
          id: 'meet-the-veteran-extra',
          label: 'Join the veteran extra at the end of the bench.',
          next: 'c2-veteran-invitation',
          conditions: [quest('under-the-stars', 'available')],
        },
        somethingElse(),
        leave(),
      ],
    },
    {
      id: 'c2-call-sheet',
      speaker: 'Production Coordinator',
      text: '"Soundstage, seven sharp, harbor-market set," he says, tearing a sheet off the board and pressing a day-rate advance into your hand. "Costume on, lines in your head, and don\'t talk to the camera operator. He bites." He pauses. "Good luck. The Lookout is a small part. Small parts are how I got started."',
      choices: [{ id: 'pocket-the-call-sheet', label: 'Pocket the call sheet.', next: null }],
    },
    {
      id: 'c2-veteran-invitation',
      speaker: 'Veteran Extra',
      text: 'The old hand who taught you which end of a crowd scene to stand in is leaning on a barrel, working a crossword in pencil. "Kid," he says, without looking up, "I\'ve got two tickets to the Hollywood Bowl and a friend who plays there summers. Somebody I want you to see. A good suit, a free evening, and nobody\'s business but ours."',
      choices: [
        {
          id: 'accept-the-tickets',
          label: 'I\'ll be there.',
          next: 'c2-veteran-glad',
          effects: [...beginQuest('under-the-stars', 'get-the-invitation'), rel(MENTOR_EXTRA.id, { trust: 4 }), setFact('stars:invited')],
        },
        { id: 'go-later', label: 'Let me see how the week goes.', next: 'c2-veteran-later' },
      ],
    },
    {
      id: 'c2-veteran-glad',
      speaker: 'Veteran Extra',
      text: '"Good." He tucks the pencil behind his ear and, for once, the crossword stays unfilled. "Ask the landlady for something that fits. Wear shoes you can stand in. And if I get a little sentimental, humor an old man."',
      choices: [{ id: 'grin-and-go', label: 'Grin and promise to.', next: null }],
    },
    {
      id: 'c2-veteran-later',
      speaker: 'Veteran Extra',
      text: '"Tickets keep," he says, and goes back to his crossword. "People don\'t. Don\'t take too long."',
      choices: [{ id: 'leave-the-bench', label: 'Leave him to it.', next: null }],
    },
  ],
};

// ---------------------------------------------------------------------------------------------------------------------
// The Silver Thimble: the fitting (harbor-market-wardrobe)
// ---------------------------------------------------------------------------------------------------------------------

const fittedChoice = (id: string, label: string, costume: 'bold' | 'practical' | 'borrowed', extra: DialogueEffect[]): DialogueChoice => ({
  id,
  label: `${label}${ENERGY_COST_LABEL}`,
  next: `c2-fitted-${costume}`,
  conditions: [ENERGY_CONDITION],
  effects: [...beginQuest('harbor-market-wardrobe', 'fitted'), setFact(`lookout:costume:${costume}`), ...extra, ENERGY_EFFECT],
});

export const COSTUME_SHOP_CHAPTER_TWO: ChapterTwoPlace = {
  entry: entry(),
  nodes: [
    {
      id: 'c2-root',
      speaker: 'Wardrobe Mistress',
      text: 'The wardrobe mistress peers at you over a pincushion strapped to her wrist. "Monarch sent your measurements ahead. Stand on the box. And stop looking at the door; the harbor market isn\'t going anywhere."',
      choices: [
        {
          id: 'get-fitted',
          label: 'Step onto the fitting box.',
          next: 'c2-fitting',
          conditions: [quest('harbor-market-wardrobe', 'available')],
        },
        somethingElse(),
        leave(),
      ],
    },
    {
      id: 'c2-fitting',
      speaker: 'Wardrobe Mistress',
      text: '"Black photographs gray, white blooms, and a stripe will crawl on film if you let it," she mutters through a mouthful of pins. "So. The Lookout. A pickpocket in a harbor market. Do you want to be seen, to move, or to blend in?"',
      choices: [
        fittedChoice('wear-it-bold', 'Be seen: a bright sash and a cap with a feather.', 'bold', [rel(WARDROBE_MENTOR.id, { tension: 1, trust: 1 })]),
        fittedChoice('wear-it-practical', 'Move: nothing that will snag or crawl on film.', 'practical', [rel(WARDROBE_MENTOR.id, { trust: 2 })]),
        {
          ...fittedChoice('wear-it-camera-ready', 'Ask how each layer will photograph, and plan the costume around the lens.', 'practical', [
            rel(WARDROBE_MENTOR.id, { trust: 4 }),
            { kind: 'xp-grant', amount: 5 },
          ]),
          conditions: [{ kind: 'talent-unlocked', talentId: 'stagecraft-1' }, ENERGY_CONDITION],
        },
        {
          id: 'pick-it-yourself',
          label: 'Tell her you grew up mending costumes on a lot, and pick the right pieces yourself.',
          next: 'c2-fitted-practical',
          conditions: [{ kind: 'origin-is', originId: 'studio-lot-hand-me-down' }],
          effects: [
            ...beginQuest('harbor-market-wardrobe', 'fitted'),
            setFact('lookout:costume:practical'),
            rel(WARDROBE_MENTOR.id, { trust: 4 }),
          ],
        },
        fittedChoice('wear-it-borrowed', 'Blend in: something off the rack that has been on a hundred extras.', 'borrowed', [rel(WARDROBE_MENTOR.id, { obligation: -2 })]),
      ],
    },
    {
      id: 'c2-fitted-bold',
      speaker: 'Wardrobe Mistress',
      text: 'She stabs a last pin into the sash and steps back, squinting. "The camera will find you in that, for better or worse. Mostly better. Don\'t blame me if the director tells you to tone it down."',
      choices: [{ id: 'bold-leave', label: 'Take the costume and go.', next: null }],
    },
    {
      id: 'c2-fitted-practical',
      speaker: 'Wardrobe Mistress',
      text: 'She nods slowly, the way someone does when a customer says the right thing without being told. "Good. Nothing to snag, nothing to crawl. You\'ll look like you grew up in that waistcoat." She starts pulling the pins. "Hold still."',
      choices: [{ id: 'practical-leave', label: 'Take the costume and go.', next: null }],
    },
    {
      id: 'c2-fitted-borrowed',
      speaker: 'Wardrobe Mistress',
      text: '"Third pickpocket this month," she sighs, taking in the seams the previous wearers let out. "It\'ll do. But you owe me one, and I don\'t mean the rental fee."',
      choices: [{ id: 'borrowed-leave', label: 'Take the costume and go.', next: null }],
    },
  ],
};

// ---------------------------------------------------------------------------------------------------------------------
// The soundstage: the first day (first-day-on-set), the helpful man (the-helpful-man, stage 1) and two of the evenings
// ---------------------------------------------------------------------------------------------------------------------

/** What it costs to spend an evening with someone, and what it does to the quest: the second evening is written first so
 * that, on a single choice, a first evening completes only the first stage and a second evening only the second. */
const rehearsalEveningEffects = (personFact: string, effects: DialogueEffect[]): DialogueEffect[] => [
  completeStage('a-week-of-rehearsals', 'second-evening'),
  startQuest('a-week-of-rehearsals'),
  completeStage('a-week-of-rehearsals', 'first-evening'),
  setFact(personFact),
  ...effects,
  ENERGY_EFFECT,
];

/** Hub entries for an evening with one person: one while the quest is open, a second once the first evening is done. Each
 * evening can be had with a person only once. */
const eveningEntries = (person: string, label: string, next: string): DialogueChoice[] => [
  {
    id: `first-evening-${person}`,
    label,
    next,
    conditions: [quest('a-week-of-rehearsals', 'available'), fact(`rehearsal:${person}`, false)],
  },
  {
    id: `another-evening-${person}`,
    label,
    next,
    conditions: [quest('a-week-of-rehearsals', 'active'), fact(`rehearsal:${person}`, false)],
  },
];

/** An evening's two endings: candid, which is warm, or light, which leaves an awkward moment behind it. Either spends the
 * evening's energy; a player without it can still walk away and come back rested. */
const eveningChoices = (
  person: string,
  characterId: string,
  candidLabel: string,
  lightLabel: string,
  warm: { trust: number; attraction: number },
  awkward: { trust: number; attraction: number; tension: number },
): DialogueChoice[] => [
  {
    id: `${person}-be-candid`,
    label: `${candidLabel}${ENERGY_COST_LABEL}`,
    next: `c2-evening-${person}-warm`,
    conditions: [ENERGY_CONDITION],
    effects: rehearsalEveningEffects(`rehearsal:${person}`, [rel(characterId, warm)]),
  },
  {
    id: `${person}-keep-it-light`,
    label: `${lightLabel}${ENERGY_COST_LABEL}`,
    next: `c2-evening-${person}-awkward`,
    conditions: [ENERGY_CONDITION],
    effects: rehearsalEveningEffects(`rehearsal:${person}`, [rel(characterId, awkward)]),
  },
  { id: `${person}-not-tonight`, label: 'Say you are too tired tonight, and come back another evening.', next: null },
];

const pikeAccept = (id: string, label: string, next: string, extra: DialogueEffect[]): DialogueChoice => ({
  id,
  label,
  next,
  effects: [
    ...beginQuest('the-helpful-man', 'hear-the-offer'),
    setFact('ledger:pike-help'),
    { kind: 'item-grant', itemId: 'publicity-card' },
    rel(PUBLICITY_CHIEF.id, { trust: 3, obligation: -3 }),
    ...extra,
  ],
});

const dayWrapChoice = (outcome: ScreenTestOutcome, next: 'c2-day-wrap-clean' | 'c2-day-wrap-rough'): DialogueChoice => ({
  id: `see-the-day-out-${outcome}`,
  label: 'See the day out.',
  next,
  conditions: [quest('first-day-on-set', 'active'), fact('first-day:done'), fact(`first-day:outcome:${outcome}`)],
  effects: [completeStage('first-day-on-set', 'earn-your-credit')],
});

export const SOUNDSTAGE_CHAPTER_TWO: ChapterTwoPlace = {
  entry: entry(),
  nodes: [
    {
      id: 'c2-root',
      speaker: 'Production Coordinator',
      text: 'The soundstage is a cathedral of cables, canvas and painted harbor. Somewhere above the rigging, the assistant director is calling names through a megaphone, and yours is on the list.',
      choices: [
        {
          id: 'report-for-the-shot',
          label: 'Report for the harbor-market scene.',
          next: 'c2-set-briefing',
          conditions: [quest('first-day-on-set', 'available')],
          effects: beginQuest('first-day-on-set', 'report-to-set'),
        },
        {
          id: 'run-the-scene-again',
          label: 'Ask for another go at the scene.',
          next: 'c2-set-briefing',
          conditions: [quest('first-day-on-set', 'active'), stageDone('first-day-on-set', 'report-to-set'), fact('first-day:done', false)],
        },
        dayWrapChoice('breakthrough', 'c2-day-wrap-clean'),
        dayWrapChoice('promising-complication', 'c2-day-wrap-clean'),
        dayWrapChoice('wrong-role-right-notice', 'c2-day-wrap-rough'),
        dayWrapChoice('memorable-setback', 'c2-day-wrap-rough'),
        {
          id: 'meet-the-glossy-man',
          label: 'Return the wave of the glossy man by the cable trunks.',
          next: 'c2-pike-offer',
          conditions: [quest('the-helpful-man', 'available')],
        },
        ...eveningEntries('corinne', 'Spend an evening with the scene partner, running lines.', 'c2-evening-corinne'),
        ...eveningEntries('theo', 'Spend an evening with the leading man.', 'c2-evening-theo'),
        somethingElse(),
        leave(),
      ],
    },
    {
      id: 'c2-set-briefing',
      speaker: 'Production Coordinator',
      text: '"You\'re the Lookout," the assistant director says, steering you onto a chalk mark by the elbow. "Three lines. Then the heroine runs, the leading man chases, and you flatten yourself against that crate. Don\'t look at the lens. Don\'t look at me. Places!" The crate, you notice, has been nailed down by someone in a great hurry.',
      choices: [
        {
          id: 'take-your-place',
          label: 'Take your place on the mark.',
          next: null,
          startsAudition: 'lookout-first-day',
        },
      ],
    },
    {
      id: 'c2-day-wrap-clean',
      speaker: 'Production Coordinator',
      text: '"That\'s a wrap on the harbor market!" The assistant director claps his clipboard shut. "Your name is on the call sheet, which in this business is what we call a credit." The leading man gives you a two-fingered salute across the set, and a glossy man in a gray suit scribbles something in a notebook, smiling at you with every tooth.',
      choices: [{ id: 'clean-leave', label: 'Walk off the set with your head high.', next: null }],
    },
    {
      id: 'c2-day-wrap-rough',
      speaker: 'Production Coordinator',
      text: '"That\'s a wrap, and it could have been worse," the assistant director says, and thumps your shoulder. "Everyone has a first day. Mine involved a horse." Your name is on the call sheet all the same, and a glossy man in a gray suit is watching you from the cable trunks as though you were more interesting than you feel.',
      choices: [{ id: 'rough-leave', label: 'Walk off the set, a little wiser.', next: null }],
    },
    {
      id: 'c2-pike-offer',
      speaker: 'Publicity Chief',
      text: '"A new face on my set should never have to worry about their image," the glossy man says, producing a cream card from nowhere. "Newcomers worry about the wrong things: the lighting, the lines. I worry about the right ones, which is what people say about you before you open your mouth." Behind him, in the window above the stage, a silver-haired man stands very still, watching the floor. "The studio\'s owner likes to know who\'s new," he adds. "I like to make that easy for him."',
      choices: [
        pikeAccept('accept-his-help', 'Accept: let him look after your image.', 'c2-pike-accepted', []),
        {
          ...pikeAccept('use-his-help', 'Accept, and ask for the photographer\'s fee up front.', 'c2-pike-accepted', [{ kind: 'resource-delta', delta: { money: 15 } }]),
          conditions: [{ kind: 'talent-unlocked', talentId: 'hustle-1' }],
        },
        {
          id: 'spot-the-hook',
          label: 'Ask what it will cost.',
          next: 'c2-pike-hook',
          conditions: [{ kind: 'talent-unlocked', talentId: 'observation-1' }],
        },
        {
          id: 'refuse-politely',
          label: 'Refuse, politely.',
          next: 'c2-pike-refused',
          effects: [...beginQuest('the-helpful-man', 'hear-the-offer'), rel(PUBLICITY_CHIEF.id, { trust: 1 })],
        },
        {
          id: 'send-him-to-the-newsman',
          label: 'Say you would rather do business with the newsman at The Klieg Light.',
          next: 'c2-pike-deflected',
          effects: [...beginQuest('the-helpful-man', 'hear-the-offer'), setFact('pike:deflected'), rel(PUBLICITY_CHIEF.id, { tension: 2 })],
        },
      ],
    },
    {
      id: 'c2-pike-hook',
      speaker: 'Publicity Chief',
      text: '"Cost?" He laughs, and it is the first thing about him that looks entirely real. "Nothing at all. Today." He lets that sit between you. "You\'re sharp. I like sharp. Sharp people remember a favor, and the people who remember them are the ones who get on in this town."',
      choices: [
        {
          ...pikeAccept('accept-knowing', 'Accept, with your eyes open.', 'c2-pike-accepted', [{ kind: 'xp-grant', amount: 5 }]),
        },
        {
          id: 'refuse-knowing',
          label: 'Refuse, and say that you will remember he offered.',
          next: 'c2-pike-refused',
          effects: [...beginQuest('the-helpful-man', 'hear-the-offer'), rel(PUBLICITY_CHIEF.id, { trust: 2 }), { kind: 'xp-grant', amount: 5 }],
        },
      ],
    },
    {
      id: 'c2-pike-accepted',
      speaker: 'Publicity Chief',
      text: '"Splendid." The card changes hands, and the glossy man\'s smile never quite changes with it. "Anything you need, just say. A photographer, a column inch, a quiet word with the right person. It\'s all small, and it\'s all on the house." He is already walking away. "Nothing in this town is free, of course, but I\'m so very flexible about when it\'s due."',
      choices: [{ id: 'pocket-the-card', label: 'Pocket the card.', next: null }],
    },
    {
      id: 'c2-pike-refused',
      speaker: 'Publicity Chief',
      text: '"A pity, and a wise one," he says, with exactly the same smile. "Keep the card, if you like. People change their minds. I do so enjoy being there when they do."',
      choices: [{ id: 'decline-the-card', label: 'Leave the card where it is.', next: null }],
    },
    {
      id: 'c2-pike-deflected',
      speaker: 'Publicity Chief',
      text: 'For half a second the glossy man stops smiling. Then he finds it again. "The Klieg Light. Of course. They do so love a trade." He tips an imaginary hat. "Do mention me to him. He\'ll know who you mean."',
      choices: [{ id: 'let-him-go', label: 'Watch him go.', next: null }],
    },
    {
      id: 'c2-evening-corinne',
      speaker: 'Scene Partner',
      text: 'The harbor set is dark, and she is in a canvas chair in a pool of work light, mending the sleeve of her heroine\'s blouse with a very small needle. "Sit," she says, patting the next chair. "I\'ve been told we\'re friends now. I\'d like to find out if that is true, preferably without a script."',
      choices: eveningChoices(
        'corinne',
        SCENE_PARTNER.id,
        'Admit that the part scared you more than you let anyone see.',
        'Keep it light, and do your best impression of the director.',
        { trust: 4, attraction: 4 },
        { trust: 1, attraction: 2, tension: 2 },
      ),
    },
    {
      id: 'c2-evening-corinne-warm',
      speaker: 'Scene Partner',
      text: '"Everyone is scared," she says, quietly. "The ones who say they aren\'t are lying, or they\'re the director." She smiles at you, and for a minute there is no set, no studio, no schedule, only the two of you and a very small needle. "Thank you for telling me. I don\'t get told things."',
      choices: [{ id: 'corinne-warm-leave', label: 'Say goodnight.', next: null }],
    },
    {
      id: 'c2-evening-corinne-awkward',
      speaker: 'Scene Partner',
      text: 'Your impression is, you are told, uncannily accurate, and she laughs until she has to put the needle down. But somewhere in the laughing, she goes quiet, and looks at you as though she had expected something else. "You do that very well," she says. "Making a joke. I wonder what you\'d say if you didn\'t."',
      choices: [{ id: 'corinne-awkward-leave', label: 'Say goodnight, a little thoughtfully.', next: null }],
    },
    {
      id: 'c2-evening-theo',
      speaker: 'Leading Man',
      text: 'The leading man is sitting on an apple box in the wings, taping his knuckles out of habit and gazing at nothing. "Stunt rider, before this," he says, when he notices you. "Nobody ever told me you had to talk and fall off a horse at the same time. I keep waiting for someone to notice I\'m not a real actor." He looks up. "You did well today. How\'d you do it?"',
      choices: eveningChoices(
        'theo',
        LEADING_MAN.id,
        'Tell him the truth: nobody feels like a real actor, not for years.',
        'Tell him it is easy: you just pretend to be someone who isn\'t scared.',
        { trust: 4, attraction: 4 },
        { trust: 1, attraction: 2, tension: 2 },
      ),
    },
    {
      id: 'c2-evening-theo-warm',
      speaker: 'Leading Man',
      text: 'He laughs, a real, startled laugh, and the tape stops mid-wrap. "Years. Good grief. I\'d have signed for months." He studies you a moment, and then lets out a long breath. "Thank you. That helped more than a pat on the back would have. Will you do me the favor of running a scene with me tomorrow? Just so I\'m not on my own."',
      choices: [{ id: 'theo-warm-leave', label: 'Say you will.', next: null }],
    },
    {
      id: 'c2-evening-theo-awkward',
      speaker: 'Leading Man',
      text: '"Pretend not to be scared," he repeats, slowly, and the smile he gives you is a polite one. "I\'ve tried that. It works until someone says action." He stands, brushing off his knees, and the moment closes like a stage door. "Well. Goodnight. See you on the lot."',
      choices: [{ id: 'theo-awkward-leave', label: 'Wish him goodnight.', next: null }],
    },
  ],
};

// ---------------------------------------------------------------------------------------------------------------------
// The Klieg Light: the newsman's trade (the-helpful-man, stage 2)
// ---------------------------------------------------------------------------------------------------------------------

const newsmanAnswer = (id: string, label: string, next: string, effects: DialogueEffect[]): DialogueChoice => ({
  id,
  label: `${label}${ENERGY_COST_LABEL}`,
  next,
  conditions: [ENERGY_CONDITION],
  effects: [completeStage('the-helpful-man', 'answer-the-newsman'), ...effects, ENERGY_EFFECT],
});

export const KLIEG_LIGHT_CHAPTER_TWO: ChapterTwoPlace = {
  entry: entry(),
  nodes: [
    {
      id: 'c2-root',
      speaker: 'Newspaper Stringer',
      text: 'The newsman peers over a half-typed column, sleeves rolled, ink on his chin. "The gossip says you\'re in pictures now," he says. "Gossip is usually late. I\'d like to be early."',
      choices: [
        {
          id: 'trade-with-the-newsman',
          label: 'Hear what he is offering.',
          next: 'c2-nick-trade',
          conditions: [quest('the-helpful-man', 'active'), stageDone('the-helpful-man', 'hear-the-offer'), fact('ledger:pike-help', false)],
        },
        {
          id: 'trade-with-the-newsman-knowing',
          label: 'Hear what he is offering.',
          next: 'c2-nick-trade-knowing',
          conditions: [quest('the-helpful-man', 'active'), stageDone('the-helpful-man', 'hear-the-offer'), fact('ledger:pike-help')],
        },
        somethingElse(),
        leave(),
      ],
    },
    {
      id: 'c2-nick-trade',
      speaker: 'Newspaper Stringer',
      text: '"A first credit is a story," he says, rolling a sheet of copy paper out of his machine. "Not a big one. But I run small ones next to ads for toothpaste, and nobody reads the toothpaste. What I\'d like is the first word, in your own words, in exchange for a column inch you can use." He eyes you. "Everyone in this business trades. I just prefer to be honest about the price."',
      choices: newsmanChoices(),
    },
    {
      id: 'c2-nick-trade-knowing',
      speaker: 'Newspaper Stringer',
      text: 'The newsman stops typing. "I hear Monarch\'s publicity man has taken a shine to you," he says carefully. "Be careful whose favors you collect, friend. Not because anything is wrong with them. Because, in this town, the ones who give them have a very long memory." He rolls out his copy paper. "I\'d still like the first word, if you\'re offering. Mine is cheaper, and it comes with fewer strings."',
      choices: newsmanChoices(),
    },
    {
      id: 'c2-nick-fed',
      speaker: 'Newspaper Stringer',
      text: 'He types for a full minute without looking up, then tears the sheet free with a flourish. "\'Newcomer wins the Lookout,\' with your name spelled correctly, which I assure you is a courtesy." He pins it to the board behind his desk. "You gave me something. I won\'t forget it."',
      choices: [{ id: 'fed-leave', label: 'Shake his hand and go.', next: null }],
    },
    {
      id: 'c2-nick-held',
      speaker: 'Newspaper Stringer',
      text: '"Off the record." He lowers his pencil with visible reluctance, then smiles. "I admire that, even if my editor won\'t. I\'ll hold it. Come back when you have something you want printed."',
      choices: [{ id: 'held-leave', label: 'Thank him and go.', next: null }],
    },
    {
      id: 'c2-nick-bargained',
      speaker: 'Newspaper Stringer',
      text: '"A fee, for a first word." He laughs, and then counts out three bills and some change anyway. "You\'ve got the instincts of a publicist, and I mean that as a compliment, mostly. Here. Don\'t spend it all on hats."',
      choices: [{ id: 'bargained-leave', label: 'Pocket the money and go.', next: null }],
    },
  ],
};

function newsmanChoices(): DialogueChoice[] {
  return [
    newsmanAnswer('feed-him-the-first-word', 'Give him the first word on your Lookout.', 'c2-nick-fed', [
      { kind: 'resource-delta', delta: { reputation: 2 } },
      rel(REPORTER.id, { obligation: 3, trust: 2 }),
      setFact('nick:exclusive-given'),
    ]),
    newsmanAnswer('keep-it-off-the-record', 'Ask him to hold it for now.', 'c2-nick-held', [rel(REPORTER.id, { trust: 3 })]),
    {
      ...newsmanAnswer('bargain-hard', 'Bargain him up to a fee for the first word.', 'c2-nick-bargained', [
        { kind: 'resource-delta', delta: { money: 15 } },
        rel(REPORTER.id, { obligation: 1 }),
      ]),
      conditions: [{ kind: 'talent-unlocked', talentId: 'hustle-1' }, ENERGY_CONDITION],
    },
  ];
}

// ---------------------------------------------------------------------------------------------------------------------
// The Monarch gate: the rival's warning (delphines-warning) and an evening (a-week-of-rehearsals)
// ---------------------------------------------------------------------------------------------------------------------

const faceHer = (id: string, label: string, next: string, path: 'test' | 'rivalry' | 'truce', effects: DialogueEffect[]): DialogueChoice => ({
  id,
  label: `${label}${ENERGY_COST_LABEL}`,
  next,
  conditions: [ENERGY_CONDITION],
  effects: [...beginQuest('delphines-warning', 'face-her'), setFact(`delphine-path:${path}`), ...effects, ENERGY_EFFECT],
});

export const BACKLOT_GATE_CHAPTER_TWO: ChapterTwoPlace = {
  entry: entry(),
  nodes: [
    {
      id: 'c2-root',
      speaker: 'Rival',
      text: 'The rival is perched on the low wall by the gate, swinging one foot, a copy of the call sheet folded small in her fist. "So you\'re the new name on the Lookout," she says. "I\'m not sorry to see a rival. I\'m just not sure you are one."',
      choices: [
        {
          id: 'hear-her-warning',
          label: 'Ask what she means.',
          next: 'c2-delphine-warning',
          conditions: [quest('delphines-warning', 'available')],
        },
        ...eveningEntries('delphine', 'Spend an evening on the lot with the rival.', 'c2-evening-delphine'),
        somethingElse(),
        leave(),
      ],
    },
    {
      id: 'c2-delphine-warning',
      speaker: 'Rival',
      text: '"Small parts open big doors in this town," she says, "and then they close them behind you. Everyone on that lot is going to be very kind to you this month. I\'d think about why." She slides off the wall. "I\'m not telling you for your sake. I\'d like you to be good, so that when I beat you, it counts."',
      choices: [
        faceHer('stand-your-ground', 'Tell her you earned that call sheet, and you will keep it.', 'c2-delphine-ground', 'test', [
          rel(RIVAL.id, { tension: 3, trust: 2 }),
        ]),
        faceHer('match-her-edge', 'Tell her you were just about to say the same.', 'c2-delphine-edge', 'rivalry', [
          rel(RIVAL.id, { tension: 5 }),
        ]),
        faceHer('offer-a-truce', 'Offer her half your sandwich, and a truce.', 'c2-delphine-truce', 'truce', [
          rel(RIVAL.id, { trust: 5, tension: -3 }),
        ]),
        {
          ...faceHer('read-what-she-wants', 'Notice that she has not once looked at the call sheet. She is looking at the gate.', 'c2-delphine-read', 'truce', [
            rel(RIVAL.id, { trust: 4, tension: -2 }),
            { kind: 'xp-grant', amount: 5 },
            setFact('delphine:insight'),
          ]),
          conditions: [{ kind: 'talent-unlocked', talentId: 'observation-1' }, ENERGY_CONDITION],
        },
      ],
    },
    {
      id: 'c2-delphine-ground',
      speaker: 'Rival',
      text: 'She studies you for a long moment, the way a card player studies a hand, and her mouth twitches. "All right," she says. "We\'ll see how long you hold it." She hops down from the wall. "I\'m going to be watching, you know. Closely."',
      choices: [{ id: 'ground-leave', label: 'Let her watch.', next: null }],
    },
    {
      id: 'c2-delphine-edge',
      speaker: 'Rival',
      text: '"Oh, I like you," she says, and it is not entirely a compliment. "That makes it so much more fun when I win." She salutes with the call sheet. "May the best name on the marquee win."',
      choices: [{ id: 'edge-leave', label: 'Salute her back.', next: null }],
    },
    {
      id: 'c2-delphine-truce',
      speaker: 'Rival',
      text: 'She looks at the sandwich, and then at you, and a laugh escapes her before she can stop it. "Half?" She takes it, and the bite is considered. "A truce. Fine. But it\'s only until one of us is on a marquee, and then I\'m afraid it\'s every woman for herself." She looks briefly, startlingly shy. "Thank you. Nobody shares anything on this lot."',
      choices: [{ id: 'truce-leave', label: 'Finish your half of the sandwich.', next: null }],
    },
    {
      id: 'c2-delphine-read',
      speaker: 'Rival',
      text: 'She goes very still. "You noticed that," she says, softly. "I\'ve been through that gate eleven times, and every time, somebody at the booth tells me it\'s the wrong day. I don\'t want your part. I want the other side of that gate." She exhales. "Nobody\'s ever noticed. Don\'t tell anyone."',
      choices: [{ id: 'read-leave', label: 'Promise you will not.', next: null }],
    },
    {
      id: 'c2-evening-delphine',
      speaker: 'Rival',
      text: 'The lot is empty at dusk, and she is rehearsing a speech to the painted wall of a soundstage, hands pressed flat to the plaster. She stops when she hears you. "Don\'t laugh," she says. "Everyone laughs. The voice in my head is much meaner than you could be." She steps aside. "Take the other half. Give me something to push against."',
      choices: eveningChoices(
        'delphine',
        RIVAL.id,
        'Read the other half honestly, and tell her what moved you.',
        'Play it for laughs, and see if she can stay in character.',
        { trust: 4, attraction: 4 },
        { trust: 1, attraction: 2, tension: 2 },
      ),
    },
    {
      id: 'c2-evening-delphine-warm',
      speaker: 'Rival',
      text: 'She does not laugh. She goes through the speech from the top, and this time her voice does not shake, and when it ends there is a silence that does not need filling. "That\'s the first time that\'s worked," she says, at last. "I hate that it was you." But she is smiling. "Come back tomorrow, and I\'ll hate it again."',
      choices: [{ id: 'delphine-warm-leave', label: 'Promise to come back.', next: null }],
    },
    {
      id: 'c2-evening-delphine-awkward',
      speaker: 'Rival',
      text: 'She plays along for nearly a minute, and then her face closes. "I wasn\'t asking for a joke," she says. "I was asking for a scene partner." She smooths her skirt and turns her face to the wall. "Another time. Perhaps."',
      choices: [{ id: 'delphine-awkward-leave', label: 'Apologize and go.', next: null }],
    },
  ],
};

// ---------------------------------------------------------------------------------------------------------------------
// The diner: an evening (a-week-of-rehearsals)
// ---------------------------------------------------------------------------------------------------------------------

export const DINER_CHAPTER_TWO: ChapterTwoPlace = {
  entry: entry(),
  nodes: [
    {
      id: 'c2-root',
      speaker: 'Counter Girl',
      text: '"Well, if it isn\'t the picture person," the counter girl says, already sliding over a slice of pie nobody ordered. "Sit. Eat. The pie is on the house until the day you\'re famous enough to pay for it twice."',
      choices: [
        ...eveningEntries('frankie', 'Stay after close and help count the tips.', 'c2-evening-frankie'),
        somethingElse(),
        leave(),
      ],
    },
    {
      id: 'c2-evening-frankie',
      speaker: 'Counter Girl',
      text: 'The last customer is gone and the chairs are up on the tables, and she is sitting on the counter with her shoes off, counting a coffee can of coins into piles. "Tips," she says. "Half of it is from people who\'ll be on a poster by Christmas, and the other half is from people who want to be." She nudges a pile toward you. "Do you ever wonder which you are?"',
      choices: eveningChoices(
        'frankie',
        DINER_CONFIDANT.id,
        'Say that you wonder every single day, and that you are glad of the pie.',
        'Say you intend to be on the poster, and tip accordingly.',
        { trust: 4, attraction: 4 },
        { trust: 1, attraction: 2, tension: 2 },
      ),
    },
    {
      id: 'c2-evening-frankie-warm',
      speaker: 'Counter Girl',
      text: 'She stops counting. "Well," she says, and for once there is no joke after it. "The pie is a good thing to be glad of." She scoops the coins into the can and swings her feet. "Whatever you are, you\'ll always have a stool here. I mean that. It\'s the only promise I make."',
      choices: [{ id: 'frankie-warm-leave', label: 'Take the stool, and the promise.', next: null }],
    },
    {
      id: 'c2-evening-frankie-awkward',
      speaker: 'Counter Girl',
      text: 'She laughs and pockets the coin you tip, but the laugh is a beat late. "Sure. Poster. Don\'t forget the diner." She starts stacking the cups, faster than she needs to. "I mean it as a joke. Mostly."',
      choices: [{ id: 'frankie-awkward-leave', label: 'Help her stack the cups.', next: null }],
    },
  ],
};

// ---------------------------------------------------------------------------------------------------------------------
// The Celestial Palace: the wrap party and the dance (the-wrap-party)
// ---------------------------------------------------------------------------------------------------------------------

type LoveInterest = 'corinne' | 'frankie' | 'delphine' | 'theo';
type Dancer = LoveInterest | 'none';

const LOW_PRESENCE: DialogueCondition = { kind: 'attribute-at-least', attribute: 'presence', minimum: 5, equals: false };
const PRESENCE_OK: DialogueCondition = { kind: 'attribute-at-least', attribute: 'presence', minimum: 5 };

/** The dance choice for one person. A player with low Presence goes through one extra nervous beat before the dance itself;
 * the dance, and what it does, are the same. */
const danceChoices = (who: LoveInterest, label: string, characterId: string): DialogueChoice[] => {
  const base: DialogueChoice = {
    id: `dance-with-${who}`,
    label: `${label}${ENERGY_COST_LABEL}`,
    next: `c2-dance-${who}`,
    conditions: [ENERGY_CONDITION, PRESENCE_OK],
    effects: [
      ...beginQuest('the-wrap-party', 'the-dance'),
      setFact(`love-interest:${who}`),
      { kind: 'relationship-pivotal-flag', characterId, flag: 'love-interest' },
      rel(characterId, { attraction: 6, trust: 3 }),
      ENERGY_EFFECT,
    ],
  };
  return [base, { ...base, id: `dance-with-${who}-nervous`, next: `c2-dance-${who}-nervous`, conditions: [ENERGY_CONDITION, LOW_PRESENCE] }];
};

const nervousNode = (who: LoveInterest, speaker: string, text: string): DialogueNode => ({
  id: `c2-dance-${who}-nervous`,
  speaker,
  text,
  choices: [{ id: `${who}-dance-on`, label: 'Take a breath and go on with the dance.', next: `c2-dance-${who}` }],
});

const danceNode = (who: Dancer, speaker: string, text: string): DialogueNode => ({
  id: `c2-dance-${who}`,
  speaker,
  text,
  choices: [{ id: `${who}-leave-the-ballroom`, label: 'Leave the ballroom, a little dazed.', next: null }],
});

export const CELESTIAL_PALACE_CHAPTER_TWO: ChapterTwoPlace = {
  entry: entry(),
  nodes: [
    {
      id: 'c2-root',
      speaker: 'House Manager',
      text: 'The house manager has thrown the ballroom doors open, and somewhere behind him a trio is warming up. "The company of The Corsair\'s Daughter has the Palace tonight," he says, "and I have the honor of keeping order in it. I do hope you\'ve brought your dancing shoes."',
      choices: [
        {
          id: 'go-to-the-wrap-party',
          label: 'Step into the ballroom.',
          next: 'c2-wrap-party',
          conditions: [quest('the-wrap-party', 'available')],
        },
        somethingElse(),
        leave(),
      ],
    },
    {
      id: 'c2-wrap-party',
      speaker: 'House Manager',
      text: 'The ballroom is gold and low light and the bright chatter of a company at the end of a picture. The scene partner stands by the punch bowl in a silver dress, the leading man is trying not to look as though he is waiting for someone, the counter girl has come straight from her shift with a flower pinned to her apron, and the rival leans in the doorway with the air of someone who does not intend to dance. "There is time for exactly one dance before the band takes its break," the house manager murmurs at your shoulder. "Who is it to be?"',
      choices: [
        ...danceChoices('corinne', 'Ask the scene partner to dance.', SCENE_PARTNER.id),
        ...danceChoices('frankie', 'Ask the counter girl to dance.', DINER_CONFIDANT.id),
        ...danceChoices('delphine', 'Ask the rival to dance.', RIVAL.id),
        ...danceChoices('theo', 'Ask the leading man to dance.', LEADING_MAN.id),
        {
          id: 'dance-with-everyone',
          label: `Dance with no one in particular, and with everyone in turn.${ENERGY_COST_LABEL}`,
          next: 'c2-dance-none',
          conditions: [ENERGY_CONDITION],
          effects: [
            ...beginQuest('the-wrap-party', 'the-dance'),
            setFact('love-interest:none'),
            rel(SCENE_PARTNER.id, { trust: 2 }),
            rel(DINER_CONFIDANT.id, { trust: 2 }),
            rel(RIVAL.id, { trust: 2 }),
            rel(LEADING_MAN.id, { trust: 2 }),
            rel(HOUSE_MANAGER.id, { trust: 1 }),
            ENERGY_EFFECT,
          ],
        },
      ],
    },
    nervousNode('corinne', 'Scene Partner', 'Your mouth has gone dry and your feet have forgotten everything they ever knew. You open your mouth to ask, and what comes out is half a sentence and a cough. She waits, with great kindness, for the rest. "Take your time," she murmurs. "I\'m not going anywhere."'),
    nervousNode('frankie', 'Counter Girl', 'Your voice cracks on the first word, and the counter girl\'s eyebrows climb. "Breathe, honey," she whispers, squeezing your hand. "It\'s just a dance. I\'ve seen you handle a lunch rush."'),
    nervousNode('delphine', 'Rival', 'You stand in front of her for a long, silent moment, and she lets you, one eyebrow slowly rising. "Well?" she says at last, but not unkindly. "I\'m not going to bite. Much."'),
    nervousNode('theo', 'Leading Man', 'You get as far as holding out your hand before your nerve goes. The leading man looks at it, and then at you, and grins, because he knows exactly how this feels. "Me too," he says, very low. "Come on. We\'ll be nervous together."'),
    danceNode(
      'corinne',
      'Scene Partner',
      'She takes your hand without a word, and the band, as if it had been waiting, slips into something slow. You dance with the careful, startled grace of two people who have rehearsed every beat of a scene and have just been told to forget it. "I hoped you\'d ask," she says, very low. Her hand stays in yours a moment longer than the music needs.',
    ),
    danceNode(
      'frankie',
      'Counter Girl',
      '"Me?" she says, flushing to her hairline, and then, in a rush: "Well, I should hope so, I came all the way over here." The flower on her apron is slightly crushed, and she smells of coffee and lilac. She dances badly, and cheerfully, and without any of her usual jokes, and when the song ends she keeps hold of your sleeve. "That was swell," she says. "That was really swell."',
    ),
    danceNode(
      'delphine',
      'Rival',
      '"You\'re joking," she says, and when you aren\'t, she lifts her chin. "I\'m leading." She does. She dances the way she does everything, as if the floor were a stage and every other couple a rival, and halfway through, the stiffness goes out of her shoulders, and for four bars she simply dances. "Don\'t tell anyone," she mutters. "It\'s a truce. Not a surrender."',
    ),
    danceNode(
      'theo',
      'Leading Man',
      '"Oh, I should warn you," the leading man says, as he takes your hand, "I fall off things." He does not; he dances with a rider\'s balance, steady and careful and unexpectedly light, and when you tell him so, he flushes. "That\'s the nicest thing anyone\'s said to me this year." The music lingers, and so does he.',
    ),
    danceNode(
      'none',
      'House Manager',
      'You spend the evening wherever the music carries you: a waltz with the scene partner, a lindy hop with the counter girl, a tango with the rival that turns into a competition, and a clumsy turn about the floor with the leading man, who steps on your foot and apologizes four times. By the end, everyone is laughing. "A wise choice," the house manager says, passing you a glass of lemonade. "The evening is long, and the studio is longer."',
    ),
  ],
};

// ---------------------------------------------------------------------------------------------------------------------
// Bellhaven Rooms: something to wear to the Bowl (under-the-stars, stage 2)
// ---------------------------------------------------------------------------------------------------------------------

export const BOARDING_HOUSE_CHAPTER_TWO: ChapterTwoPlace = {
  entry: entry(),
  nodes: [
    {
      id: 'c2-root',
      speaker: 'Landlady',
      text: 'The landlady looks up from her ledger, and then, very deliberately, at the call sheet sticking out of your pocket. "Well," she says. "Look at that. Rent\'s still due Friday, but I\'ll allow myself to be proud for ten minutes."',
      choices: [
        {
          id: 'ask-for-an-evening-outfit',
          label: 'Ask whether she has anything fit for an evening out.',
          next: 'c2-outfit',
          conditions: [quest('under-the-stars', 'active'), stageDone('under-the-stars', 'get-the-invitation')],
        },
        { id: 'c2-head-upstairs', label: 'Head upstairs.', next: null, opensHomeHub: true },
        somethingElse(),
        leave(),
      ],
    },
    {
      id: 'c2-outfit',
      speaker: 'Landlady',
      text: '"The Hollywood Bowl?" She puts down her pen, which she does for nothing. "Well. There\'s a good wool jacket in the hall trunk that belonged to a boarder who left in the middle of the night, owing me. And a hamper in the pantry, if someone were to chip in for a chicken." She raises an eyebrow. "Hold still. I\'ll need to take in the shoulders."',
      choices: [
        {
          id: 'chip-in-for-the-hamper',
          label: `Chip in $10 for the chicken.${ENERGY_COST_LABEL}`,
          next: 'c2-outfit-paid',
          conditions: [{ kind: 'resource-at-least', resource: 'money', minimum: 10 }, ENERGY_CONDITION],
          effects: [completeStage('under-the-stars', 'dress-for-the-evening'), { kind: 'resource-delta', delta: { money: -10 } }, rel(LANDLADY.id, { trust: 3 }), ENERGY_EFFECT],
        },
        {
          id: 'owe-her-one',
          label: `Tell her you\'ll owe her one.${ENERGY_COST_LABEL}`,
          next: 'c2-outfit-owed',
          conditions: [ENERGY_CONDITION],
          effects: [completeStage('under-the-stars', 'dress-for-the-evening'), rel(LANDLADY.id, { obligation: -2, trust: 1 }), ENERGY_EFFECT],
        },
      ],
    },
    {
      id: 'c2-outfit-paid',
      speaker: 'Landlady',
      text: 'She pins the shoulders with a brisk, practiced hand and, when she is done, steps back and does something she does not do: she smooths your lapel. "There. Take the hamper. Eat the chicken while it\'s warm, and for pity\'s sake, enjoy yourself."',
      choices: [{ id: 'paid-leave', label: 'Thank her, and take the hamper.', next: null }],
    },
    {
      id: 'c2-outfit-owed',
      speaker: 'Landlady',
      text: '"You owe me one," she agrees, and writes something in her ledger that is probably not rent. The jacket is a little large and a great deal better than anything you have, and when she takes in the shoulders, her hands are surprisingly gentle. "Go. Enjoy yourself. And come back and tell me every word."',
      choices: [{ id: 'owed-leave', label: 'Promise to tell her every word.', next: null }],
    },
  ],
};

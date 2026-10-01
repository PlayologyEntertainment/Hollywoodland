# Localization glossary and style guide

Used for the AI first drafts (step 6 of `docs/LOCALIZATION_PLAN.md`) and by native reviewers. Where this file and a draft disagree, this file wins. Languages: Spanish (`es`, neutral Latin American with no regional slang), French (`fr`), German (`de`), Brazilian Portuguese (`pt-BR`).

## Never translate

Proper names stay exactly as written in every language, including inside longer sentences (owner decision, 2026-09-28):

Hollywoodland, Playology Entertainment, Hollywood Boulevard (the street name in `statusBar.hollywoodBoulevard`; the word "Boulevard" alone is translated), Bellhaven Rooms, Bellhaven, Sunset Casting Exchange, Sunset Casting, The Gilded Spoon, The Silver Thimble, The Klieg Light, The Celestial Palace, Monarch Pictures, Monarch, *The Corsair's Daughter*, and the contact address serdar@playologyentertainment.com.

The map regions' names and the welcome signs' city names stay as written (Hollywood Bowl, Griffith Observatory, HOLLYWOOD, HOLLYWOOD HILLS, SANTA MONICA, GRIFFITH PARK, CULVER CITY); the signs' subtitles ("City of Los Angeles", "By the Sea", "Heart of Screenland") and the "WELCOME TO" and "POP." lines are translated. The Santa Monica Pier's name takes the language's own word for pier with the proper name kept (Muelle de Santa Monica, Jetée de Santa Monica, Santa-Monica-Pier, Píer de Santa Monica). "Union Bus Depot" is the depot's proper name and is never translated.

The characters have no personal names; they are identified by role ("the clerk", "the landlady") and those roles are translated.

## Never change

- Placeholders: `{name}`, `{count}`, `{cost}` and the rest are copied exactly, and the same set must appear as in English.
- Plural syntax: `{n, plural, one {# apple} other {# apples}}` keeps its structure. Write every plural form the language needs: `one` and `other` always; for Spanish, French and Portuguese also `many` (used for millions, "1 000 000 de points"); German needs only `one` and `other`.
- `#` inside a plural branch is the number.
- The currency symbol `$` and numbers such as `+20`.
- `XP`, `A`, `D`, `E` as key names.
- A trailing energy cost in a choice, e.g. `... (-10 Energy)`: keep the cost in parentheses at the very end of the line, with the number first and a translated word after it (`(-10 Energía)`). The game highlights it by that shape.

## Voice

A romanticized, warm 1935 Hollywood storybook: light, period-flavoured, never modern slang, no profanity. Keep idioms of the era where the target language has a natural equivalent ("swell", "doll", "for Pete's sake" become the local period-appropriate warmth, not literal translations). Register, as drafted: the interface and friendly characters address the player informally in Spanish (tú), German (du) and Portuguese (você). French interface text uses the standard software register (vous). Characters who are officials or strangers to the player (the clerk, the production coordinator, the house manager) may use the formal register (usted, vous, Sie) in their lines. The legal text uses the formal register everywhere. Reviewers should confirm this mix reads naturally and make each language consistent.

The clerk, the landlady, the counter girl, the rival, the scene partner and the wardrobe mistress are women; the production coordinator, the newspaper stringer and the house manager are men. Use the matching gender in every language that marks it.

Keep sentences about as long as the English. The interface has little room: buttons and HUD labels must stay short.

## Fixed terms

| English | Spanish | French | German | Portuguese (BR) |
| --- | --- | --- | --- | --- |
| Career | Carrera | Carrière | Karriere | Carreira |
| Assignment | Encargo | Mission | Aufgabe | Tarefa |
| Quest | Misión | Quête | Auftrag | Missão |
| Bus depot | estación de autobuses | gare routière | Busbahnhof | rodoviária |
| Chapter | Capítulo | Chapitre | Kapitel | Capítulo |
| Level (character) | Nivel | Niveau | Stufe | Nível |
| Conclusion (of a chapter) | Conclusión | Conclusion | Abschluss | Conclusão |
| Coming soon | Próximamente | Bientôt disponible | Demnächst verfügbar | Em breve |
| Talent point | punto de talento | point de talent | Talentpunkt | ponto de talento |
| Energy | Energía | Énergie | Energie | Energia |
| Reputation | Reputación | Réputation | Ruf | Reputação |
| Money | Dinero | Argent | Geld | Dinheiro |
| Inventory | Inventario | Inventaire | Inventar | Inventário |
| Audition | Audición | Audition | Vorsprechen | Teste |
| Callback | Segunda convocatoria | Rappel | Zweites Vorsprechen | Retorno |
| Screen test | Prueba de cámara | Bout d'essai | Probeaufnahme | Teste de câmera |
| Extra (background actor) | extra | figurant | Statist | figurante |
| Soundstage | plató de sonido | plateau de tournage | Tonstudio-Halle | estúdio de som |
| Backlot | backlot | backlot | Backlot | backlot |
| Boulevard | Bulevar | Boulevard | Boulevard | Boulevard |
| Headshot | foto de presentación | photo de casting | Bewerbungsfoto | foto de divulgação |
| Save (noun) | partida guardada | sauvegarde | Spielstand | jogo salvo |
| Origin | Origen | Origine | Herkunft | Origem |

## Review checklist for native reviewers

1. Read the game aloud in your language from the menu through a full dialogue; note anything stiff, too modern, or too long for its button.
2. Check the gender and register rules above.
3. Check the legal text (`legal.*`) with a qualified reviewer: it stays "unreviewed" (and the language stays Beta) until that is done, whatever the rest of the review says.
4. When a language is complete and current, set its `status` to `reviewed` in `src/i18n/locales.ts` and, only after the legal sign-off, `legalReviewed` to `true`. `npm run i18n:check` then holds it to the strict rules.

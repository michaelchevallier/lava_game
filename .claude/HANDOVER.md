# Handover — Milan Lava Park (2026-04-21 fin session créative)

## État live

- URL : https://michaelchevallier.github.io/lava_game/
- Branche `main` : commit `c2cff3d` pushé, CI auto-deploy
- Bundle : ~77 KB gz game + 67 KB kaplay = ~144 KB total (user a libéré la cible)
- 30+ commits session précédente (refonte v2 complète), + 4 docs créatifs ce tour-ci

## Contexte (pour la prochaine session)

La **refonte v2** (campagne 38 niveaux + run arcade + sandbox) est livrée et stable. Voir `.claude/plans/ne-me-mets-pas-keen-kahn.md` (plan précédent, archivé).

Une **session créative** a été menée :
- 3 agents opus en parallèle (puzzles / carte blanche / progression)
- 3 rounds de Q&A AskUserQuestion avec le user (12 questions)
- Plan final validé dans `/Users/mike/.claude/plans/ne-me-mets-pas-keen-kahn.md`

## ➡️ PROCHAINE SESSION = IMPLÉMENTATION SPRINTS 0-4

Le plan approuvé est dans `/Users/mike/.claude/plans/ne-me-mets-pas-keen-kahn.md`. Consulte-le EN PREMIER. Résumé :

### Sprint 0 — Cleanup 4P (1-2h)
Vire la notion 4 joueurs, garde 1-2 max partout. Fichiers : splash, settings-modal, main, players, constants, index.html, CLAUDE.md.

### Sprint 1 — Quick wins puzzles (4h)
- Wire 4 hooks combo orphelins (geyser, constellation, metronome, magnetField)
- +5 niveaux Monde 6 en pure data (6-1 pont chancelant, 6-2 tunnel maléfique, 6-10 cascade fatale, 6-14 yin yang infini, 6-15 métronome)

### Sprint 2 — Métagame étendu (12-14h)
- Médailles Platine pré-écrites (38 prédicats custom dans levels.js)
- Speedrun Records foyer (top 3 par niveau cross-avatar)
- 🏆 Musée / Trophy Room (nouveau module src/museum.js, 5 onglets)
- Refonte spectres 24 → 6 catégories × 4 avec titres débloqués

### Sprint 3 — VIP narratif + persistance (14-16h)
- Parc sandbox persistant (save.sandboxLayout)
- Pool 40 VIP nommés dans src/vips.js
- Seed journalière → 3 contrats/jour
- Écran "Aujourd'hui au parc" sur splash
- Tickets d'Or monnaie (débloque tuiles avancées + skins)
- Almanach témoignages post-victoire (src/almanac.js)

### Sprint 4 — Nouvelles mécaniques (8h)
Dans l'ordre : Visitor (faire monter passagers) → Bomb (lava s'étend) → Alarm (flood/freeze/wind).

**Total estimé : 39-44h dev, ~30-40 commits atomiques, 4-6 sessions d'impl.**

## Décisions tranchées avec l'user (Q&A validé)

| Sujet | Décision |
|---|---|
| Ordre sprints | 0 → 1 → 2 → 3 → 4 (séquentiel) |
| Scope | Skip Sprint 5 (éditeur/share) |
| Audience | Milan + père/adulte, **max 2 joueurs** |
| Device | PC + tablet (pas de focus mobile) |
| Narration VIP | OK témoignages post-victoire, pas auto |
| Platine | Pré-écrites par niveau (premium) |
| Parc persistant | Oui, localStorage |
| Spectres | Refonte 6×4 catégories avec titres |
| Pool VIP | 40 personas au launch |
| Tickets | Débloquent tuiles + skins (les deux) |

## Docs de référence

- `/Users/mike/.claude/plans/ne-me-mets-pas-keen-kahn.md` — **PLAN OFFICIEL approuvé** (à exécuter)
- `.claude/CREATIVE_NEXT.md` — synthèse unifiée (300L)
- `.claude/creative-puzzles.md` — détails puzzles Sprint 1 + 4 (780L)
- `.claude/creative-carteblanche.md` — détails VIP Sprint 3 (437L)
- `.claude/creative-progression.md` — détails métagame Sprint 2 (612L)

## Conventions rappel

- 1 commit atomique par feature + push immédiat
- Build systématique avant commit (`npm run build`)
- Bundle libéré de contrainte stricte
- Agent models : qa-tester haiku, feature-dev sonnet, spec-writer opus
- Pas de commentaires superflus, pas de console.log prod

## Fichiers cibles par sprint

**Nouveaux à créer** :
- `src/museum.js` (Sprint 2)
- `src/vips.js` (Sprint 3)
- `src/contracts.js` (Sprint 3)
- `src/almanac.js` (Sprint 3)
- `src/tickets.js` (Sprint 3)

**Fortement modifiés** :
- `src/splash.js` (Sprint 0, 2, 3)
- `src/main.js` (Sprint 0, 1, 3)
- `src/levels.js` (Sprint 1, 2, 4)
- `src/campaign.js` (Sprint 2, 4)
- `src/serializer.js` (migrations Sprint 2, 3)
- `src/spectres.js` (Sprint 2 refonte)

## État tasks

- Task #45 créée "Sprint 0: cleanup 4P" — in_progress mais AUCUN changement de code encore (user a stoppé à temps)
- Toutes les tasks précédentes complétées

## Pour démarrer la prochaine session

1. Lire `.claude/HANDOVER.md` (ce fichier)
2. Lire `/Users/mike/.claude/plans/ne-me-mets-pas-keen-kahn.md` (plan complet)
3. Démarrer Sprint 0 (commit `chore(cleanup): vire 4 joueurs, garde 1-2 max`)
4. Continuer dans l'ordre Sprint 1, 2, 3, 4

Auto mode recommandé pour les sprints mécaniques (Sprint 0, 1). Plan mode recommandé si on veut re-débattre avant Sprint 3 (VIP) qui est le plus ambitieux.

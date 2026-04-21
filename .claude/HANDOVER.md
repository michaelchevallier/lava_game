# Handover — Milan Lava Park (2026-04-21 fin session A / début session B)

## État live

- URL : https://michaelchevallier.github.io/lava_game/
- Branche `main` : commit `8fe062a` pushé, CI auto-deploy en cours
- Bundle : 77.75 KB gz game + 67 KB kaplay (user a libéré la cible)
- **33 niveaux** campagne (5⭐/niveau max = 99 total avec Monde 6 ouvert)

## ✅ Session A terminée (Sprint 0 + Sprint 1, ~6h estimées)

3 commits poussés :

1. **`7eb66a8` — Sprint 0 : cleanup 4P → 1-2P max**
   - `constants.js` : `MODE_CONFIG.sandbox.numPlayers 4 → 2`
   - `players.js` : `PLAYER_CONFIGS` réduit à Mario+Pika (Luigi/Toad restent via avatar picker)
   - `settings-modal.js` : CHAR_* arrays limités à 2 slots
   - `main.js` : supprime `spectres.unlock(21)` unreachable (4P achievement)
   - `CLAUDE.md` : rappel 1-2P + pièges touches D/L
   - **Note** : spectre id 21 "Le Sociable — 4 joueurs simultanés" laissé dans `spectres.js` (sera refondu au Sprint 2 dans la nouvelle catégorisation 6×4)

2. **`acfc188` — Sprint 1.1 : wire hooks combo orphelins**
   - `levels.js` : `OBJECTIVE_TYPES` étendu avec `metronome` + `magnetField`
   - `constellation.js` : `progress("constellation")` au moment d'activation
   - `wagons.js` : `progress("geyser" / "metronome" / "magnetField")` avec cooldowns per-wagon (1s / event-based / 1.5s) pour éviter spam

3. **`8fe062a` — Sprint 1.2 : +5 niveaux Monde 6**
   - 6-1 Le pont chancelant (bridge fragile 2 passages, 3 skel)
   - 6-2 Tunnel maléfique (tunnel pré-placé, pas besoin de lave)
   - 6-3 Cascade fatale (3 eaux vertical → bridge temp 8s sur lave, **failOn skeleton**)
   - 6-4 Yin Yang infini (portail+aimant vortex, 3 transforms en 1 wagon)
   - 6-5 Métronome infernal (2 boosts verticaux + lava, catapulte)
   - `campaign-menu.js` : Monde 6 débloqué à 35⭐

### ⚠️ À valider en QA live (Session B première tâche)

Certains niveaux Monde 6 ont des hypothèses de physique non-vérifiées en production :
- **6-3** : la cascade pose-t-elle vraiment un bridge temporaire que les wagons peuvent traverser sans se skelettiser ? Le `failOn skeleton: 1` est strict.
- **6-4** : 1 wagon dans vortex fait-il 3 cycles lava→water→lava atteignables en 150s ? Peut-être trop dur, abaisser target ou allonger timeLimit si bloqué.
- **6-5** : metronome déclenché par wagon catapulté qui retombe col 10 → confirmation que la détection `wRow === topRow puis bottomRow` se trigger bien.

Agent qa-tester (haiku) peut tester ces 3 niveaux en live sur la prod une fois CI déployé.

## ➡️ PROCHAINE SESSION = SPRINT 2 (Métagame étendu)

Plan officiel intact : `/Users/mike/.claude/plans/ne-me-mets-pas-keen-kahn.md`. Le Sprint 2 est le + gros (12-14h, 4 commits atomiques).

### 2.1 Médailles Platine pré-écrites (4h)
Dans `src/levels.js`, ajouter `platinum: { label, check }` sur les 33 niveaux (1-1 à 6-5). Chaque platine = une contrainte premium unique. Le `check(result)` reçoit `{ time, tiles, skeletons, tools, ... }`.

Exemples plan :
- 1-1 : "En moins de 12s" → `(r) => r.time < 12`
- 3-8 : "APOCALYPSE sans aucun boost posé" → `(r) => !r.tools.includes("boost")`
- 4-3 : "10 squelettes avant 90s" → `(r) => r.skeletons >= 10 && r.time < 90`

Sur `campaign-result.js` : si niveau fini 3⭐ mais pas platine, révéler le label doré flou "Platine : ???". Si 3⭐ + platine → animation supplémentaire.

### 2.2 Speedrun Records foyer (3h)
`save.campaign.records[levelId] = [{ avatar, time, tiles, date }]` top 3 cross-avatar.
- `campaign-menu.js` : afficher "🥇 Milan 00:23 · 🥈 Papa 00:31" à côté de chaque niveau.
- `campaign-result.js` : "Nouveau record !" si rentre dans top 3.

### 2.3 Musée / Trophy Room (3h)
Nouveau `src/museum.js`. Bouton "🏆 Musée" sur `splash.js`. Overlay HTML plein écran avec 5 onglets :
1. Médailles campagne (grille 33 niveaux bronze/argent/or/platine)
2. Records speedrun (leaderboard par monde)
3. Spectres (voir 2.4)
4. Runs top 5 par avatar (depuis `save.runs`)
5. Contrats VIP honorés (réservé Sprint 3, onglet vide au 2.3)

### 2.4 Refonte spectres 24 → 6×4 catégories (3-4h)
Refondre `src/spectres.js` + migration `src/serializer.js`. 6 catégories × 4 spectres :
- **Maîtres du Feu** : combos lave (1er skel, 10 skel, 100 skel, apocalypse)
- **Virtuoses** : combos spectaculaires (chaîne or, triple loop, constellation, platine 3⭐)
- **Sprinters** : vitesse (Monde 1 en <5min, 5 platine temps, speedrun battu, run 3000pts)
- **Trésoriers** : pièces (10, 50, 200, 1000 cumul)
- **Architectes** : constructions (premier parc sauvegardé, 50 tuiles dans parc, parc 5⭐ VIP, partager code)
- **Explorateurs** : méta (tous mondes finis, 1 VIP gagné, 10 VIP, 30j streak)

Compléter 1 catégorie = débloquer un **titre** (string sur splash + écran résultat).

Migration save : convertir bitmask actuel vers nouveau schéma `save.spectres = { maitres_feu: 0b1100, virtuoses: 0, ... }`. Garder l'ancien en fallback pendant 1 release.

### Commits Sprint 2 (atomiques)
1. `feat(campaign): médailles platine pré-écrites par niveau (33 prédicats)`
2. `feat(campaign): speedrun records foyer top 3 cross-avatar`
3. `feat(museum): trophy room sur splash avec 5 onglets`
4. `refactor(spectres): 24 → 6 catégories × 4 avec titres débloqués`

## Décisions validées (rappel)

| Sujet | Décision |
|---|---|
| Ordre sprints | 0 → 1 → 2 → 3 → 4 (séquentiel) ✅ |
| Audience | Milan + père/adulte, max 2 joueurs ✅ |
| Platine | Pré-écrites par niveau (premium) |
| Parc persistant | Oui, localStorage (Sprint 3) |
| Spectres | Refonte 6×4 catégories (Sprint 2) |
| Pool VIP | 40 personas (Sprint 3) |
| Tickets | Débloquent tuiles + skins (Sprint 3) |

## Conventions rappel

- 1 commit atomique par feature + push immédiat (push main autorisé via bypass)
- Build systématique avant commit (`npm run build`)
- Agent models : qa-tester haiku, feature-dev sonnet, spec-writer opus
- Pas de commentaires superflus, pas de `console.log` prod

## Docs de référence

- `/Users/mike/.claude/plans/ne-me-mets-pas-keen-kahn.md` — **PLAN OFFICIEL** (5 sprints)
- `.claude/CREATIVE_NEXT.md` — synthèse unifiée (300L)
- `.claude/creative-puzzles.md` — détails puzzles Sprint 1 + 4 (780L)
- `.claude/creative-carteblanche.md` — détails VIP Sprint 3 (437L)
- `.claude/creative-progression.md` — détails métagame Sprint 2 (612L)

## Fichiers cibles Sprint 2

**Nouveaux** :
- `src/museum.js`

**Fortement modifiés** :
- `src/levels.js` (platinum predicates × 33)
- `src/campaign-result.js` (révélation platine)
- `src/campaign-menu.js` (records display)
- `src/splash.js` (bouton Musée)
- `src/serializer.js` (migration spectres)
- `src/spectres.js` (refonte catégories)

## Pour démarrer la prochaine session

1. Lire `.claude/HANDOVER.md` (ce fichier)
2. Lire `/Users/mike/.claude/plans/ne-me-mets-pas-keen-kahn.md` sections Sprint 2.1 → 2.4
3. Décider de l'ordre : je recommande **2.1 platine → 2.2 records → 2.3 musée → 2.4 spectres** (chaque étape est testable en live isolément).
4. Commencer par 2.1 : écrire les 33 platinum predicates — c'est l'étape la + chirurgicale, 1 seul fichier touché.

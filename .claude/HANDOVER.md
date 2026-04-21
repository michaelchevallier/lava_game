# Handover — Milan Lava Park (2026-04-21 fin de session — refonte game design)

## État live

- URL : https://michaelchevallier.github.io/lava_game/
- Branche `main` : commit `500b718` pushé, CI auto-deploy GitHub Pages
- Bundle game : ~71 KB gz (+ kaplay 67 KB = ~138 KB total — dépassement cible 100 KB accepté par le user pour prioriser le gameplay)
- Plus de crash connu
- Pas de QA live confirmée (les qa-tester n'ont pas accès à Chrome MCP dans cette config) — **à valider manuellement**

## Ce qu'a fait cette session (refonte game design v2)

### Contexte
User a rejeté le Sprint 1 précédent (combo juice + avis écrits) comme "fluff inutile". Demande reformulée : vraie feature de gameplay, niveaux, objectifs, engagement. Pas d'animation automatisée.

3 agents Explore ont diagnostiqué : le jeu avait une excellente sandbox mais aucune conséquence au score, tiers fermés après 7, 5-6 surprises auto/min vs 2-3 objectifs visibles.

### 4 votes stratégiques
1. **Architecture** : B2 — campagne SÉPARÉE du sandbox
2. **Modes** : Campagne + Run arcade chronométré + Sandbox conservé (bouton discret)
3. **Scoring campagne** : étoiles 3/3 par niveau
4. **Multijoueur** : solo v1 (4P reste uniquement en sandbox)

### Commits livrés (18 depuis début session)

**Phase A — Foundations**
- `417dcf7` feat(router) — state machine 3 modes
- `2a777a7` feat(config) — MODE_CONFIG feature flags par mode
- `3e99e84` refactor(main) — scene game lit MODE_CONFIG
- `10dad0a` feat(hud) — polymorphe par mode

**Phase B — Splash**
- `62af1bb` feat(splash) — 3 cartes mode (Campagne / Run / Bac à sable discret)

**Phase C — Campagne (15 niveaux)**
- `e5b0a02` feat(campaign) — levels.js monde 1 (5 niveaux tuto)
- `232e544` feat(campaign) — createCampaignSystem loader + state
- `f76f668` feat(hud) — renderCampaign (titre + timer + objectifs + budget)
- `1b959bc` feat(campaign) — hooks progress wrapping (skeleton/coin/catapult/loop/revive)
- `17f8640` feat(campaign) — playerSpawn + wagon auto-spawn par level
- `ea94de7` feat(campaign) — écran résultat HTML (étoiles, retry/next/menu)
- `c98c2fd` feat(campaign) — menu campagne grille niveaux + déverrouillage
- `e295feb` feat(campaign) — 10 niveaux mondes 2-3 + score/apocalypse hooks

**Phase D — Run arcade**
- `500b718` feat(run) — timer 180s + HUD + podium top 5

## Architecture technique en place

```
router.get() → { mode: "campaign"|"run"|"sandbox", levelId?, runDuration?, ... }

src/router.js          — state machine simple (enter/onEnter/onExit)
src/constants.js       — MODE_CONFIG.{campaign, run, sandbox} feature flags
src/splash.js          — 3 cartes mode, avatar contextuel, onStart(info)
src/hud.js             — HUD polymorphe (sandbox / campaign / run)
src/campaign.js        — loader level, state, progress, stars, persistance
src/campaign-menu.js   — grille niveaux + déverrouillage par étoiles
src/campaign-result.js — overlay résultat (étoiles animées, 3 boutons)
src/levels.js          — 15 niveaux data (v2 layout réutilise serializer)
src/run.js             — timer 180s, spawn wagons auto, finish auto
src/run-result.js      — podium top 5 local par avatar
```

## Ce qui marche (à confirmer user / manuel)

**Sandbox** : comportement inchangé, MODE_CONFIG.sandbox = tous les systèmes ON (tiers, quests, weather, minigames, race F2, ghost train, inverse train, balloons, coin-thief, visitor-quests).

**Campagne** : click Campagne sur splash → menu grille → click niveau → layout chargé + player spawn + wagon auto-spawn → objectifs trackés (skeleton/revive/coin/catapult/loop/apocalypse/score) → win/lose → overlay résultat avec étoiles (⭐ finir / ⭐⭐ temps / ⭐⭐⭐ tuiles) → REJOUER/SUIVANT/MENU.

**15 niveaux livrés** :
- Monde 1 (tuto) : 1-1 à 1-5 — Premier wagon, Sauveur, Collecte, Catapulte, Boucle
- Monde 2 (combos, 7⭐ requises) : 2-1 à 2-5 — Triple incinération, Cycle vie, Acrobate, Grand angle, Apocalypse
- Monde 3 (challenges, 15⭐ requises) : 3-1 à 3-5 — Minimaliste, Time trial, Le magot, Le cirque, Maître forain

**Run arcade** : click Run sur splash → scene démarre → timer 180s + HUD timer fixed top-center → spawn wagons auto 5s/cap 3 → podium top 5 local par avatar.

## Ce qui n'est PAS encore fait (backlog)

### Phase F — Retirements fluff (optionnel, user a assoupli la règle)
User a dit "tout ce qui clarifie l'interaction tile×combo reste". On retire seulement le pur décoratif :
- `main.js:439-530` lava triangle ghosts (~90L obscur)
- `main.js:825-862` flags waving (~40L)
- `crowd.js:82-92` BRAVO text (~10L)
- `main.js:757-810` season cosmetics animations (~55L)
- GARDÉS : clouds, geyser particles, magnet/ice auras, lava bubbles (visualisent des interactions)

### Phase G — Polish
- Supprimer `tutorial.js` (remplacé par niveaux 1-5)
- Mettre à jour `CLAUDE.md` avec les modes
- 15 niveaux restants (monde 2-10, 3-6 à 3-10, monde 4) si volonté d'étendre
- Bouton mode libre mieux positionné si jugé insuffisant
- Spectres liés à 3⭐ par monde (v1.1)

### Points à vérifier manuellement (user-test)
- Niveau 1-1 jouable et gagnable par un enfant de 8 ans (Milan) ? Trop dur / trop facile ?
- Le menu campagne est-il clair ? Les étoiles lisibles ?
- Le timer du run arcade crée-t-il une tension sans stress ?
- Les hi-scores run s'enregistrent-ils correctement par avatar ?
- La régression sandbox est-elle à zéro ?

## Conventions rappel

- **Pas de commentaires superflus** (sauf WHY non-obvious)
- **1 commit atomique par feature** + push immédiat
- **Build systématique** (`npm run build`) avant commit
- **Pas de console.log** en prod
- **Bundle** : pas de contrainte stricte (user a libéré)
- **Agent models** : bug-fixer/qa-tester en haiku, quality-maintainer/feature-dev/perf-auditor en sonnet, spec-writer en opus

## Pitfalls KAPLAY rencontrés cette session

Rien de nouveau. Les pitfalls connus (CLAUDE.md) suffisent. Le pattern mode-gating via MODE_CONFIG marche bien — chaque système (`tiers`, `quests`, `weather`, `minigames`, `race`, `balloons`, etc.) ne s'instancie que si son flag est ON pour le mode courant.

## Nouveaux fichiers

- `src/router.js` (33L)
- `src/levels.js` (251L, 15 niveaux)
- `src/campaign.js` (154L)
- `src/campaign-menu.js` (113L)
- `src/campaign-result.js` (98L)
- `src/run.js` (73L)
- `src/run-result.js` (89L)

## État tasks

Tasks #16-29 complétées. Backlog : Phase F retirements, Phase G polish. À prioriser selon feedback user.

## Plan de référence

`/Users/mike/.claude/plans/ne-me-mets-pas-keen-kahn.md` — plan game design complet approuvé, implémenté aux phases A/B/C/D. Seules F/G restent.

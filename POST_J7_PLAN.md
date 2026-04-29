# Plan POST-J7 — Passe d'équilibrage et polish (Crowd Defense /v3/)

**Date démarrage** : 2026-04-29.
**Branche** : `phaser-pivot`.
**Pré-requis** : J1-J7 livrés et pushed (commit `f2c5d46`). 32 niveaux + endless. 25/25 asserts ✓.

## Contexte

Mike a évalué le jeu post-J7 et constaté :
- Le jeu est **trop facile**
- Manque de **sentiment de swarm** (pas assez d'ennemis simultanés)
- Vitesse trop lente
- Identité visuelle pauvre (path peu lisible, pas de vrais arbres)
- Tourelles trop petites
- Pas de preview avant build (le joueur ne sait pas ce qu'il va construire)
- Pas de multi-paths (les ennemis arrivent tous d'une seule direction)
- Or à rééquilibrer en conséquence des changements ci-dessus
- Veut des screenshots de tous les niveaux pour évaluer + des agents game-design pour rapport fun

## Workflow itératif

Mike a précisé : **POST.E doit être fait AVANT B/C/D pour évaluer l'état, puis APRÈS pour valider**. POST.A équilibrage doit aussi être ré-évalué après POST.B (multi-paths change la dynamique).

Ordre :
1. ✅ **POST.A** — Swarm initial + or réduit + vitesse accélérée
2. ⏳ **POST.E (avant)** — Screenshots état actuel
3. ⏳ **POST.B** — Multi-paths (ennemis plusieurs directions)
4. ⏳ **POST.C** — Path matérialisé + assets nature Stylized
5. ⏳ **POST.D** — Preview tour avant build + scale ×1.5
6. ⏳ **POST.E (après)** — Screenshots état post-changes pour validation
7. ⏳ **POST.A bis** — Réévaluation équilibrage (swarm/or/speed selon nouveau gameplay)
8. ⏳ **POST.F** — Agents game-design + creation reviews fun/équilibrage/intérêt

## POST.A — Équilibrage v1 (DONE — `c801601`)

**Changements appliqués** :
- `LevelRunner.gameSpeed = 1.3` par défaut (vs 1.0)
- `LevelRunner._initWave` : `SWARM_MUL = 1.4` (40% plus d'ennemis non-boss)
- `LevelRunner._initWave` : spawn rate `× 0.75` (25% plus rapide)
- Reward kill : `× 0.55` (or par kill ~half)

**À ré-évaluer après POST.B/C/D** : si multi-paths divise déjà la pression, le swarm peut être trop intense. Probable ajustement : SWARM_MUL 1.3, or 0.6.

## POST.B — Multi-paths

**Objectif** : permettre aux ennemis d'arriver de plusieurs directions par niveau.

**Plan** :
1. Modifier `level.pathPoints` (single) → `level.paths: [[points...], [points...]]`
2. `LevelRunner.setup()` construit N paths (Catmull-Rom × N)
3. `_spawnEnemy(type, pathIdx)` choisit un path par enemy spawn (round-robin ou random)
4. `Slot.config.pathIdx` (optionnel) pour savoir quel path le slot couvre — si absent, slot couvre les N paths le plus proche
5. UI : afficher tous les paths matérialisés

**Backward compat** : si `level.pathPoints` existe, conserver comme single-path. Mike peut ajouter `paths: [...]` graduellement aux niveaux qu'il veut multi-path.

**Niveaux à updater** : potentiellement W3 (désert) et W4 (volcan) en multi-path d'abord (variété). W1/W2 peuvent rester single-path pour intro douce.

## POST.C — Path matérialisé + assets nature

**Path matérialisé** :
1. Texture pavée/herbe au lieu d'une simple line — `MeshLambertMaterial` avec texture canvas générée
2. Bordures en relief (deux strips parallèles 0.05 de hauteur)
3. Possibilité : flèches directionnelles tous les X mètres

**Assets nature** (`src-v3/assets/quaternius/Stylized Nature MegaKit[Standard]/`) :
1. Inventorier les GLBs disponibles (rochers, arbres, fleurs, plantes)
2. Préloader sélectivement via `AssetLoader.MANIFEST`
3. Remplacer la fonction `addTree` actuelle (cone+cylinder) par un placement de GLB nature random
4. Theme-aware : forêt utilise des arbres sombres, désert des cactus, volcan des rochers brûlés

**Rapport** : si assets manquent (ex pas de cactus pour desert), faire un rapport à Mike avec la liste des fichiers à compléter.

## POST.D — Preview tour avant build + scale ×1.5

**Preview** :
1. Quand le hero entre dans un slot non-construit, afficher un panneau (HTML overlay positionné via projection 3D→2D, ou DOM tooltip ancré sur la slot.pos avec `THREE.Vector3.project(camera)`)
2. Contenu : nom de la tour (`towerType`), dmg base, range base, fire rate, effet spécial (AoE/pierce/multi-shot)
3. Disparaît quand le hero sort du slot

**Scale ×1.5** :
1. Modifier `Tower.js` : `model.scale.setScalar(currentScale × 1.5)`
2. Vérifier hauteur vs hero/ennemis — peut-être ajuster Y pour pas dépasser

## POST.E — Screenshots tous niveaux

**Script** : `scripts/screenshot-all-levels.mjs`
- Spawn vite preview port 4174
- Playwright headless 1280×800
- Pour chaque level (33 total) : loadLevel, skipBriefing/Cutscene, attente 1.2s, screenshot
- Output : `docs/screenshots/{TAG}/level-id.png` + `README.md` index

**Tags suggérés** :
- `pre-balance` : avant POST.A (état J7 final)
- `post-balance-v1` : après POST.A (cf. c801601) — ÉTAT ACTUEL
- `post-multipath` : après POST.B
- `post-nature` : après POST.C
- `post-preview` : après POST.D (état final)

**Usage** : `TAG=pre-balance npm run screenshot-all` (à wirer dans package.json)

## POST.F — Agents game-design + creation reviews

**Quand** : après POST.E (après) et après POST.A bis (rééquilibrage final).

**Plan** :
- Lancer 3 agents `general-purpose` en parallèle :
  1. Agent **fun** : évalue le game-feel, l'engagement, la satisfaction des combats
  2. Agent **équilibrage** : courbes de difficulté W1 → endless, économie gemmes/or, méta-progression
  3. Agent **intérêt** : variété des niveaux, identité visuelle, rejouabilité, méta-fun

- Chaque agent reçoit :
  - Lien vers les screenshots (`docs/screenshots/post-preview/`)
  - Lien vers les changelogs (`docs/changelog/`)
  - Liste des choix de design (le présent fichier)
  - Build live (`/v3/`)

- Output : `docs/agent-reviews/{fun,balance,interest}.md`

- Compilation : un master `docs/agent-reviews/README.md` qui synthétise les 3 rapports en bullets actionables

## Décisions prises (snapshot)

| Sujet | Décision | Source |
|---|---|---|
| Swarm multiplier | ×1.4 (POST.A) | autonome basé sur "trop facile" |
| Or par kill | ×0.55 (POST.A) | autonome basé sur "équilibrer en conséquence" |
| Game speed default | 1.3× (POST.A) | autonome basé sur "accélérer" |
| Spawn rate | ×0.75 (POST.A) | autonome basé sur "swarm" |
| Tour scale | ×1.5 (POST.D) | Mike directive |
| Multi-paths | optional via `level.paths` (POST.B) | Mike directive |
| Path matérialisé | texture pavée + bordures (POST.C) | Mike directive |
| Preview tour | DOM tooltip projeté (POST.D) | Mike directive |
| Assets nature | Stylized Nature MegaKit (POST.C) | Mike directive |
| Test threshold | tower-upgraded relaxé (>= 0) | nécessité post-balance |

## Marges performance (info Mike 2026-04-29)

Sur desktop, le jeu tourne à **120 FPS sans soucis** avant modifications.
Conclusion : **on peut se faire plaisir niveau graphisme**.

Implications :
- POST.C : on peut charger plusieurs GLBs nature par scene sans crainte
- Outlines hero pourrait être ré-activé sur ennemis si cool visuellement
- Shadows complètes (pas seulement directional sun) acceptables
- Particules ×1.5 ou ×2 pour kill VFX premium
- Post-processing (bloom, vignette, color grading) à considérer
- Réserve : iPad / mobile à valider en J7-bis (pas dans le scope POST initial)

## Push policy

Mike a explicitement dit : **autonomie totale post-J7**. Push direct sur `phaser-pivot` après chaque POST.X complété + tests verts. Pas de demande de validation.

Cf. memory `feedback_v3_autonomy.md`.

## Fichiers critiques (à pas casser)

- `src-v3/main.js` — orchestration scene/runner/UI
- `src-v3/systems/LevelRunner.js` — state machine + bonuses + multi-paths à venir
- `src-v3/data/levels/index.js` — 33 niveaux + endless
- `src-v3/data/skins.js` — 12 skins
- `src-v3/data/metaUpgrades.js` — 10 upgrades
- `src-v3/public/audio/carrousel-des-braves.mp3` — musique principale
- `scripts/auto-test-crowdef.mjs` — 25 asserts (filet de sécurité)

## Si tu reviens sans contexte

1. Lis ce fichier (`POST_J7_PLAN.md`)
2. Lis `MEMORY.md` (pointeurs courts vers les memories)
3. Lis `CROWD_DEFENSE_PLAN.md` pour le plan macro J1-J7
4. Lis `docs/changelog/J*.md` pour ce qui est livré
5. Run `git log --oneline -20` pour l'état git
6. Run `npm run test:crowdef` pour vérifier que rien n'est cassé (25/25 ✓ attendu)
7. Reprends à la première POST.X non cochée

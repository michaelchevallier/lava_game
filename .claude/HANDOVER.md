# Handover — Milan Lava Park (2026-04-23 fin session G / début session H)

## ✅ Session G (6 commits : 3 features round 3 + 2 style + 1 docs)

Round 3 backlog créatif **4/5 fini** en une session. Reste uniquement
Labyrinthe (qui est un niveau scénaristique distinct des mini-jeux récurrents).

### `cd59add` feat(reparation): mini-jeu QTE rail cassée

Toutes les 60s ±10, une rail à l'écran passe rouge, compteur 10s décompte
au-dessus. Wagons qui passent dessus **tombent** (getRailSlopeYAt ignore
rt.broken). Joueur doit marcher sur la tile et presser `E`/`O` (board key).
Succès : +50pts + flash vert. **Streak 5** = popup `MAINTENANCE PRO !`,
+500pts, wagons +20% vitesse 90s (`gameState.maintenanceBonusUntil`). Timeout
= tile grise 20s supplémentaires puis auto-réparation silencieuse. Désactivé
en campaign.

Nouveau : `src/reparation-express.js` (186 L). Patchs `wagons.js` (getRailSlopeYAt
+ speedMult), `players.js` (p.repairKey + handler board), `main.js`
(instanciation gated). Bundle 100.27 KB gz.

Spec : `.claude/specs/reparation-express.md`.

### `afc4d36` feat(skull-stand): aire tir mobile

Extension du skull-stand existant avec cycle `k.loop(30s)` alterné crânes ↔
canards. Phase canards : 7 canards défilent droite→gauche, 12% gold.
Fléchette parabolique (v0=400, grav=200) avec auto-aim sur la touche board
quand le joueur est à <150px du stand. Hit = +50/+150. Combo 3 canards en 5s
= `JACKPOT ! +300` + 24 particules + achievement `jackpot_canards`. Cooldown
0.4s/joueur. Ordre priorité board : **reparation → tir → board wagon**.

`src/skull-stand.js` 151 → 413 L. Patchs `main.js`, `players.js`. Bundle
101.63 KB gz.

Spec : `.claude/specs/aire-tir-mobile.md`.

### `5ae35ea` + `bf5b8a1` feat(boss): Boss Goret

Nouveau mini-boss cochon rose 20×14 (`SPR_BOSS_GORET_A/B` dans sprites.js,
animation walk 2 frames). Spawn toutes 240s ±20, warm-up 60s, suspendu
pendant train events. Cible le wagon le plus chargé au spawn (score =
passagers×2 + skeletons + gold×5). Fonce horizontalement à 180 px/s.

**Mécanique poche pièces** : chaque joueur peut stocker jusqu'à 3 pièces en
poche (`p._coinsPocket`, collectées au contact). Affichées en 3 cercles
jaunes au-dessus de la tête. Appuyer sur board quand Boss actif = lance une
pièce parabolique auto-aimée. 3 hits = Boss vaincu → +250pts tueur, +50pts
bonus à tous à l'écran, drop `portal` + `trampoline` au sol près de la dépouille,
audio apocalypse, 30 particules roses.

Si Boss touche le wagon avant 3 hits : wagon `frozenUntil = t+3` (stun ×0.2
vitesse), -50pts score, popup `BOSS GORET !`, puis Boss fuit vers le bord
opposé. Sortie sans drop = cooldown réduit à 2min pour revenge round.

`src/boss-goret.js` (255 L) + `sprites.js` +36L + `audio.js` +1L (`boss()`
grognement sawtooth) + `main.js` + `players.js` (gate `tryThrowCoin` en tête
handler board). Bundle 103.43 KB gz (cap atteint à 103.5).

Spec : `.claude/specs/boss-goret.md`.

### `82234a9` + `d9b9ea9` style: restore UTF-8 accents

Le feature-dev avait retiré les accents ("RAIL BRISE !"). Le reste du
codebase (98 accents sur 23 fichiers) les utilise. Normalisation cosmétique.

## ➡️ Session H = CHOIX OUVERT

### Options fonctionnelles

- **Labyrinthe** (round 3 restant) — niveau scénaristique maze avec visibilité
  limitée, dernière idée créative du round 3.
- **Skeleton variants par avatar** (18 sprites à dessiner) — seul item coché [ ]
  dans la section "Sprites personnages" du CLAUDE.md. Mechanical mais ne
  demande pas de spec.
- **Labyrinthe + Skeleton variants** en parallèle via 2 agents (1 spec-writer +
  1 feature-dev sprites directement).

### Options qualité / perf

- **qa-tester live Chrome MCP** : valider les 4 nouvelles features round 3
  (reparation, aire tir, boss goret) en vrai navigateur sur le live. Utiliser
  `window.__reparation.__debug()`, `window.__skullStand.__debug()`,
  `window.__bossGoret.__forceSpawn()`. Bug → bug-fixer → commit/push.
- **perf-auditor** : bundle a pris +4 KB cette session (99.05 → 103.43). Vérifier
  FPS avec toutes les features actives (parade + reparation + skull-stand double
  phase + boss goret + weather + ghost train).
- **quality-maintainer** : 4 nouveaux `window.__X` exposés (parade, reparation,
  skullStand, bossGoret) — factoriser en `window.__systems = { parade, reparation, ... }` ?
  Également chasser dead code si certaines features ont des paths inutilisés
  (ex : `stop()` API exposée mais non appelée).

### Option doc

- Refactor `HANDOVER.md` qui commence à accumuler l'historique session E/F/G.
  Archiver E dans `.claude/HISTORY/` si le fichier devient lourd.

## État fichiers (post session G)

| Fichier | Lignes | Seuil | Statut |
|---|---|---|---|
| `src/main.js` | 1126 | 1500 | ✅ OK |
| `src/sprites.js` | ~1217 | 1500 | ✅ OK (+36L boss) |
| `src/skull-stand.js` | 413 | 1500 | ✅ OK (était 151) |
| `src/boss-goret.js` | 255 | 1500 | ✅ OK (new) |
| `src/reparation-express.js` | 186 | 1500 | ✅ OK (new) |
| `src/wagons.js` | 1083 | 1500 | ✅ OK |

Bundle prod : **103.43 KB gz** (passé au-dessus de la cible initiale 100 — à
surveiller, mais cap strict 150 KB respecté largement). +4.4 KB session G.

# Handover — Milan Lava Park (2026-04-23 fin session E / début session F)

## État live

- URL : https://michaelchevallier.github.io/lava_game/
- Branche `main` : commit `94b1f1c` pushé, CI auto-deploy en cours
- Bundle : ~97.7 KB gz game + 67 KB kaplay (toujours sous 100 KB)
- **49 niveaux** campagne sur 7 mondes (5⭐/niveau = 147 total possible)
- **24 spectres** en 6 catégories × 4
- **40 VIP** avec contrats quotidiens, seed déterministe
- **Musée** 6 onglets : Médailles, Records, Spectres, Runs, Almanach, Boutique

## ✅ PLAN OFFICIEL 100% TERMINÉ (5 sprints)

Voir session D pour détail. Session E = cleanup/refactor post-plan.

## ✅ Session E (2 commits refactor)

### `e1c820d` refactor(wagons): extract wagon-collisions.js (1437 → 1079 L)

Les 11 `wagon.onCollide()` handlers (lava, water, coin, ghost, bridge, ice,
portal, trampoline, boost, rail_loop, tunnel) extraits dans
`src/wagon-collisions.js` via `attachWagonCollisions({k, wagon, tileMap,
gameState, audio, showPopup, placeTile, catapultWagon, transformToSkeleton,
reviveFromSkeleton, collectCoin, triggerCarillon})`.

Zero logic change, closures préservées. Bundle +0.12 KB gz (import overhead).
wagons.js maintenant très en-dessous du seuil 1500 L.

### `94b1f1c` refactor(main): extract particle-systems.js (1245 → 1090 L)

15 `k.onUpdate`/`k.loop` handlers (particle, steam, lava/water anim, coin,
boost, ghost, fan-puff, particle-grav/x/debris/firework + lava-water steam
spawn + particle cap loop) extraits dans `src/particle-systems.js` via
`attachParticleAndTileUpdates({k, tileMap})`.

main.js sous cible 1200 L pour la première fois. Bundle stable.

### QA Sprint 4 (code review)

Agent qa-tester a fait une code review exhaustive (pas de live Chrome, cf.
limitation MCP) — verdict **PASS** avec 1 point de clarification sur
`wagons.js:348` `if (windy) speedMult += 1.2;` qui est **intentionnel**
(matche description handover D "+1.2 speedMult").

Checklist tests live complète dispo dans le transcript, à re-jouer session F
si besoin d'une vraie validation en navigateur.

## ➡️ PROCHAINE SESSION (F) = CHOIX OUVERT

Backlog CLAUDE.md tous les items polish structurels sont cochés. Reste :

### Option A : QA live réelle (Chrome)

Relancer qa-tester avec instructions explicites de scripter via
`javascript_tool` (Chrome MCP). Valider les 6 niveaux Sprint 4 + sérialisation
sandbox en vrai, pas code review.

### Option B : Skeleton variants par avatar

Actuellement tous les avatars (Mario, Luigi, Toad, Pika, Sonic, Link, etc.)
utilisent le même sprite `skeleton_generic` quand transformés. Idée : 18
skeletons distincts par avatar, à dessiner dans `sprites.js` style aux
squelettes existants.

### Option C : Features créatives round 3 (5 backlogs ouverts)

- Boss Goret (mini-boss visuel qui traverse le niveau)
- Réparation Express (mini-jeu QTE timing)
- Parade Lave QTE (vague de lave montante, esquive)
- Aire Tir Mobile (cible mouvante à toucher avec wagon projeté)
- Labyrinthe (niveau scénaristique maze)

### Option D : Audit perf/quality post-refactor

- `perf-auditor` — mesurer FPS live sur laptop 2015/Mac Retina avec alarm+bomb actifs
- `quality-maintainer` — chasser dead code, patterns dupliqués

### Option E : Mode parent dédié (Sprint 5 skip réhabilité)

Interface dédiée aux parents pour superviser les runs des enfants
(stats temps de jeu, modes plus calmes, etc.). Question laissée ouverte par le plan.

## État fichiers (post session E)

| Fichier | Lignes | Seuil | Statut |
|---|---|---|---|
| `src/main.js` | 1090 | 1500 | ✅ OK (sous cible 1200) |
| `src/wagons.js` | 1079 | 1500 | ✅ OK |
| `src/sprites.js` | 1181 | 1500 | ✅ OK |
| `src/tiles.js` | 966 | 1500 | ✅ OK |
| `src/levels.js` | 935 | 1500 | ✅ OK |
| `src/vips.js` | 824 | 1500 | ✅ OK |

Nouveaux fichiers : `src/wagon-collisions.js` (370 L), `src/particle-systems.js` (161 L).

## Conventions rappel (inchangées)

- 1 commit atomique par feature + push immédiat (push main autorisé)
- Build systématique avant commit (`npm run build`)
- Agent models : qa-tester haiku, feature-dev sonnet, spec-writer opus
- Pas de `console.log` prod, pas de commentaires superflus
- **Si fichier > 1500 lignes, refactorer avant d'ajouter**

## Pour démarrer la prochaine session (F)

1. Lire ce fichier (`.claude/HANDOVER.md`)
2. Choisir une direction (A/B/C/D/E ci-dessus)
3. Si Chrome MCP fonctionne : option A pour confirmer Sprint 4 en vrai
4. Sinon : option B (skeleton variants) ou C (feature créative)

Prompt suggéré pour session F (QA live vraie) :
```
Session F — QA live vraie Sprint 4 via Chrome MCP.
Auto mode full.

Lis .claude/HANDOVER.md. Lance qa-tester avec instructions explicites :
  - navigate https://michaelchevallier.github.io/lava_game/
  - javascript_tool : window.__campaign.startLevel('6-6') etc.
  - Joue chaque niveau 15s, lis console, rapporte par level.

Sur bug : lance bug-fixer + commit + push.
en autonomie totale
```

Prompt suggéré pour session F (feature créative) :
```
Session F — Feature créative round 3.
Auto mode full.

Lis .claude/HANDOVER.md. Choisir l'une de : Boss Goret, Réparation Express,
Parade Lave QTE, Aire Tir Mobile, Labyrinthe.

Spec-writer opus écrit spec → feature-dev sonnet exécute →
1 commit atomique + push. npm run build avant commit.
en autonomie totale
```

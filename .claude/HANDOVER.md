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

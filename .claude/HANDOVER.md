# Handover — Milan Lava Park (2026-04-23 fin session D / début session E)

## État live

- URL : https://michaelchevallier.github.io/lava_game/
- Branche `main` : commit `f6d38e7` pushé, CI auto-deploy en cours
- Bundle : ~97 KB gz game + 67 KB kaplay (toujours sous 100 KB)
- **49 niveaux** campagne sur 7 mondes (5⭐/niveau = 147 total possible)
- **24 spectres** en 6 catégories × 4
- **40 VIP** avec contrats quotidiens, seed déterministe
- **Musée** 6 onglets : Médailles, Records, Spectres, Runs, Almanach, Boutique

## ✅ PLAN OFFICIEL 100% TERMINÉ

Les 5 sprints du plan `/Users/mike/.claude/plans/ne-me-mets-pas-keen-kahn.md` :
- Sprint 0 (cleanup 4P → 1-2P) ✅
- Sprint 1 (quick wins puzzle) ✅
- Sprint 2 (métagame étendu) ✅
- Sprint 3 (VIP narratif + persistance) ✅
- Sprint 4 (nouvelles mécaniques puzzle) ✅
- Sprint 5 (éditeur) **skippé par design** (décision initiale du plan)

## ✅ Session D (Sprint 4, 4 commits) — cette session

- `1da23a5` **Sprint 4.0** : refactor main.js 1721 → 1245 L
  - `src/scene-overlays.js` (243 L) — geyser particles + icerink crystals + magnet/portal/ice-crown/lava-triangle draws + lava-ghost loop
  - `src/scene-decor.js` (154 L) — clouds + hills + flags + seasonal décor (halloween/christmas/carnival)
  - `src/sandbox-setup.js` (105 L) — buildDemoCircuit + loadParkFromCode + exportAction + resetPark + sandbox layout auto-save + contract runner
- `4ee538b` **Sprint 4.1** : objectif `visitor`
  - `OBJECTIVE_TYPES.visitor = { hookName: "onVisitorBoard" }`
  - `def.visitors = [{col, row, isVIP?}]` field supporté dans `loadLevel`
  - `visitor.spawnAt(col, row, opts)` crée visiteur statique (walkSpeed=0, anti-stuck désactivé dans ce cas)
  - `tryAutoBoardVisitor` dispatche `window.__campaign?.progress?.("visitor")` + contract
  - `MODE_CONFIG.enableAmbientVisitors=false` en campaign (prévisibilité)
  - Nouveau monde 7 "Contrats VIP" (seuil 45⭐) avec 6-6 Ramassage + 7-1 VIP transport
- `1fabdc3` **Sprint 4.2** : tuile `bomb` (code E)
  - `makeBombSpriteUrl()` (32×32 sphère noire + mèche)
  - `k.onUpdate("bomb")` AABB vs wagons → explodeBomb → placeTile(lava) pour bomb + 4 voisines cardinales
  - Bombes adjacentes détonent en cascade (+0.15s)
  - Fuse ember particle périodique (0.25s cd)
  - `TOOLBAR_ORDER` + HUD icons + Tier 7 unlock
  - Niveaux 6-7 Champ de mines + 7-2 Cascade explosive
- `f6d38e7` **Sprint 4.3** : tuile `alarm` (flood/freeze/wind)
  - 3 tool names distincts : `alarm_flood` (A), `alarm_freeze` (G), `alarm_wind` (V)
  - Countdown 10s fixe rendu via `k.onDraw` (icône + timer rouge sous 3s)
  - Détonation par variant :
    - flood : toutes les lava → water 5s puis retour
    - freeze : wagons x0.35 vitesse pendant 3s via `wagon.frozenUntil`
    - wind : wagons +1.2 speedMult pendant 2s via `wagon.windUntil`
  - `wagons.js` : 2 états ajoutés dans le speedMult existant (pas de refactor profond)
  - Niveaux 6-8 Alarme ! + 7-3 Compte à rebours

## ➡️ PROCHAINE SESSION = QA LIVE + POLISH / CHOIX OUVERT

Le plan officiel est épuisé. La session E peut aller dans plusieurs directions :

### Option A : QA live des nouvelles mécaniques (2-3h)

Agent `qa-tester` sur https://michaelchevallier.github.io/lava_game/ :
- **6-6 Ramassage** : 3 visiteurs statiques embarquent-ils correctement ? Progress visitor compte bien ?
- **7-1 VIP transport** : failOn skeleton bloque-t-il si un wagon brûle ?
- **6-7 Champ de mines** : AABB bomb vs wagon correct ? Explosion crée bien lava + 4 voisines ?
- **7-2 Cascade explosive** : bombes adjacentes détonent-elles en chaîne ? APOCALYPSE déclenchée ?
- **6-8 Alarme !** : countdown visible ? Flood convertit lava → water 5s puis retour ?
- **7-3 Compte à rebours** : freeze applique bien x0.35 speed aux wagons ?
- Vérifier la sérialisation : save/load d'un parc sandbox avec bombs+alarms round-trip
- Vérifier monde 7 bien affiché dans campaign-menu (seuil 45⭐ respecté)

### Option B : Polish restant du backlog CLAUDE.md

Cocher les items encore ouverts :
- [ ] **main.js < 1200 lignes** (actuel 1245 — marge négligeable, extraire sky/* possible)
- [ ] **Skeleton variants par avatar** (actuellement unifié sur skeleton_generic)
- [ ] **Boss Goret, Réparation Express, Parade Lave QTE, Aire Tir Mobile, Labyrinthe** (backlog créatif round 3)

### Option C : Audit performance / quality maintenance

Les 3 agents spécialisés :
- `perf-auditor` — mesurer FPS live sur laptop 2015/Mac Retina avec alarm+bomb actifs
- `quality-maintainer` — chasser dead code, patterns dupliqués, wagon.js à 1437L proche du seuil 1500
- `qa-tester` — voir Option A

### Option D : Mode parent dédié ou nouvelles directions

Question du plan laissée ouverte : "Mode parent dédié (Sprint 5 skip)". Pourrait faire session dédiée.

## ⚠️ Dette technique actuelle

| Fichier | Lignes | Seuil | Statut |
|---|---|---|---|
| `src/main.js` | 1245 | 1500 | ✅ OK |
| `src/wagons.js` | 1437 | 1500 | ⚠️ Proche seuil |
| `src/sprites.js` | 1177 | 1500 | ✅ OK |
| `src/vips.js` | 824 | 1500 | ✅ OK |
| `src/levels.js` | 849 | 1500 | ✅ OK |
| `src/tiles.js` | 884 | 1500 | ✅ OK |

`wagons.js` devrait être refactoré AVANT d'y ajouter quoi que ce soit (wagon-vfx.js existe déjà, on peut extraire plus).

## Conventions rappel (inchangées)

- 1 commit atomique par feature + push immédiat (push main autorisé)
- Build systématique avant commit (`npm run build`)
- Agent models : qa-tester haiku, feature-dev sonnet, spec-writer opus
- Pas de `console.log` prod, pas de commentaires superflus
- **Si fichier > 1500 lignes, refactorer avant d'ajouter**

## Fichiers Sprint 4 créés/modifiés

**Nouveaux** :
- `src/scene-overlays.js` (243 L)
- `src/scene-decor.js` (154 L)
- `src/sandbox-setup.js` (105 L)

**Modifiés** :
- `src/main.js` (1721 → 1245 L) — imports + 3 extractions
- `src/visitor.js` (297 → 304 L) — opts params + spawnAt export
- `src/wagons.js` (1431 → 1437 L) — frozenUntil/windUntil + progress visitor dispatch
- `src/campaign.js` (+visitor dans counts, +def.visitors spawn, +visitors dans payload)
- `src/campaign-menu.js` (+monde 7)
- `src/constants.js` (+TILE_CODE bomb/alarm + toolbar entries + MODE_CONFIG enableAmbientVisitors)
- `src/tiles.js` (+placeTile bomb/alarm + detonate + k.onUpdate + k.onDraw)
- `src/sprites.js` (+makeBombSpriteUrl + bomb_visual load)
- `src/hud.js` (+TOOL_ICONS + TOOL_DESCRIPTIONS + COLORS pour bomb/alarm)
- `src/tiers.js` (Tier 7 unlocks : bomb + 3 alarms)
- `src/levels.js` (+6 niveaux : 6-6, 6-7, 6-8, 7-1, 7-2, 7-3)

## Pour démarrer la prochaine session (E)

1. Lire ce fichier (`.claude/HANDOVER.md`)
2. Choisir une direction (A/B/C/D ci-dessus)
3. Si option A : lancer agent `qa-tester` directement sur URL live
4. Si option B/C : prévoir refactor `wagons.js` d'abord si > 1500

Prompt suggéré pour session E (QA live) :
```
Session E — QA live Sprint 4 (6 nouveaux niveaux + 3 mécaniques).
Auto mode full, aucune validation intermédiaire.

Lis .claude/HANDOVER.md puis lance agent qa-tester sur
https://michaelchevallier.github.io/lava_game/ pour valider :
  - 6-6 Ramassage, 7-1 VIP transport (objectif visitor)
  - 6-7 Champ de mines, 7-2 Cascade explosive (tuile bomb)
  - 6-8 Alarme !, 7-3 Compte à rebours (tuile alarm)
  - Sérialisation save/load avec bombs+alarms

Si QA trouve des bugs : lance bug-fixer sur chacun.
Sinon, passer à audit perf/quality (wagons.js à 1437L proche seuil).

en autonomie totale
```

Prompt suggéré pour session E (polish/refactor) :
```
Session E — Polish post-Sprint 4.
Auto mode full.

Lis .claude/HANDOVER.md. Objectif : refactor wagons.js < 1300 L (actuel 1437).
Extraire wagon-collision.js (interactions tile/wagon) ou wagon-boarding.js
(passengers + visitor boarding) selon ce qui ressort le plus lisible.

Puis cocher backlog CLAUDE.md polish : skeleton variants par avatar,
ou main.js < 1200 L.

1 commit atomique par refactor + push immédiat. npm run build avant chaque commit.
en autonomie totale
```

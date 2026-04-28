# J3 — Monde 1 : Plaine du Royaume (Crowd Defense /v3/)

**Date** : 2026-04-28.
**Branche** : `phaser-pivot`.
**Commits** : `f0161da` → `e24386d` (5 feat + 1 docs).

## Résumé

Le J2 livrait le combat (6 ennemis × 4 tours × roguelite light) sur un seul niveau infini.
Le J3 transforme la boucle en **campagne** : 8 niveaux distincts, briefings,
écran de résultat avec étoiles, carte des mondes débloquable, et **boss final**
avec mécanique de charge propre. Première vraie progression jouable
de bout en bout.

## Livré (par commit)

| Commit | Sujet | Détail |
|---|---|---|
| `f0161da` | feat(v3): briefing 3s + résultat + level-switching | Overlay countdown 3-2-1, écran fin avec castle/wave/coins, `loadLevel()` API + emit `:level-loaded`. |
| `e321ba9` | feat(v3): SaveSystem stars/progression + autopilot | Schéma `levels[id] = { wins, bestStars, bestCastleHP, lastWave }`. Helpers `getStars`, `isLevelUnlocked`, `totalStars`. |
| `1eba5ea` | feat(v3): carte des mondes + bouton 🗺️ HUD + raccourci M | Grille tuiles avec étoiles + verrouillage progressif. Click → `loadLevel()`. |
| `d2dced0` | feat(v3): 8 niveaux Plaine du Royaume équilibrés | world1-1 (tutoriel) → world1-8 (boss). Difficulté graduée : nombre slots, types ennemis, vagues, castle HP. |
| `e24386d` | feat(v3): Boss Brigand world1-8 — charge ×4 + bannière | Type ennemi `brigand_boss` (HP 80, dmg 40). Charge speed×4 pendant 1.5s tous les 6s. Particules rouges + bannière HP top-center pulsant pendant la charge. |

## 8 niveaux Plaine du Royaume

| ID | Nom | Slots | Vagues | Castle HP | Coins | Specials |
|---|---|---|---|---|---|---|
| world1-1 | Tutoriel | 3 | 4 | 120 | 100 | basics-only intro |
| world1-2 | Plaine — 2 | 3 | 4 | 130 | 110 | intro runners |
| world1-3 | Plaine — 3 | 4 | 5 | 130 | 120 | intro brutes |
| world1-4 | Plaine — 4 | 4 | 5 | 140 | 130 | intro shielded |
| world1-5 | Plaine — 5 | 4 | 5 | 140 | 130 | mid-boss vague 5 |
| world1-6 | Plaine — 6 | 5 | 5 | 140 | 140 | 5e emplacement |
| world1-7 | Plaine — 7 | 5 | 5 | 150 | 150 | pré-boss (2 mid-bosses) |
| world1-8 | **Plaine — Brigand** | 5 | 6 | 160 | 180 | **BOSS** (Brigand) |

## Boss Brigand de la Plaine

- HP 80 (vs boss générique 60)
- Asset : Pirate_Male scale 1.1, bodyColor `0x8a1a0a` (rouge sang)
- Speed base 0.6, dmg 40
- **Mécanique charge** : tous les 6s, accélère ×4 pendant 1.5s
- Émet 12 particules rouges au début de charge + 1 particule/frame pendant
- Émet `crowdef:boss-spawned` once + `crowdef:boss-charge` à chaque charge
- Bannière HP top-center :
  - Apparaît au spawn avec nom centré (💀 Brigand de la Plaine 💀)
  - Bar dégradé rouge → orange
  - Animation pulse `box-shadow + border-color` quand `charging`
  - Disparaît si `dead || _dying`

## Système d'étoiles

Calcul `computeStars(castleHP, castleHPMax)` :
- ⭐⭐⭐ ≥ 95% castle HP restant
- ⭐⭐ ≥ 50%
- ⭐ < 50%
- 0 si castle tombé (defeat)

Persisté dans `crowdef:save` : `levels[id].bestStars` (max). Total affiché sur la carte des mondes.

## Carte des mondes

Overlay `#worldmap`, raccourci **M** ou bouton 🗺️ HUD :
- Grille 4 colonnes
- Tuile par niveau : nom, étoiles ⭐ (filled/empty), state classes
- `locked` : opacity 0.45, 🔒 prefix, no click handler
- `completed` : border `#5fe079`
- Hover : translateY(-3px) + border `#ffd23f`
- Déblocage progressif : world1-N+1 unlocked si world1-N gagné

## Briefing pré-niveau

Overlay `#briefing` countdown 3-2-1 (800ms par tic) :
- Titre = `level.name`
- Texte = `level.briefing`
- Pause runner pendant le countdown
- Skippable via `__cd.skipBriefing()` (mode test Playwright)

## Level-switching API

`runner.loadLevel(newLevel)` :
- Dispose path mesh + castle + ennemis + tours + slots + hero
- Reconstruit Catmull-Rom path à partir de `pathPoints`
- Reset coins / castleHP / wave / state
- Émet `crowdef:level-loaded` pour que main.js reconstruise le décor

`runner.restart()` délègue à `loadLevel(this.level)`.

## Tests étendus

`scripts/auto-test-crowdef.mjs` v2 — 11 asserts (vs 9 en J2) :

Phase 1 (world1-1 autopilot, 120s max @ speed=4) :
1. ✓ page errors = 0
2. ✓ console errors = 0
3. ✓ runner reached terminal state
4. ✓ enemies killed >= 5
5. ✓ towers built >= 1
6. ✓ hero level-ups >= 1
7. ✓ perks picked >= 1
8. ✓ tower upgrades >= 1
9. ✓ fps avg >= 15

Phase 2 (boss smoke world1-8, force-spawn `brigand_boss`) :
10. ✓ `crowdef:boss-spawned` event fired (name="Brigand de la Plaine")
11. ✓ `crowdef:boss-charge` event fired within 9s (got 6 charges)

Run final : 11/11 ✓, FPS avg 19.0.

## Découvert / Pivots

- **Briefing bloque le test Playwright** → ajouté `__cd.skipBriefing()` qui désactive
  les briefings ultérieurs durant la session (autopilot reste réactif).
- **Boss spawn event sans HUD était silencieux** → ajout bannière dédiée pour
  ne pas réutiliser `#castle-hp` (le château doit rester visible séparément).
- **Stats persistées par niveau** : choix de stocker `bestStars` au max (pas de regression
  même si le joueur perd à un retry après 3⭐).

## Fichiers touchés J3

**Nouveaux** :
- `src-v3/data/levels/world1-2.js` à `world1-8.js`
- `src-v3/data/levels/index.js` (LEVELS_BY_ID, LEVEL_ORDER, getLevel, getNextLevelId)
- `docs/changelog/J3-monde-1.md` (ce fichier)

**Modifiés** :
- `src-v3/main.js` (briefing, résultat, worldmap, boss banner ; ~600 LOC)
- `src-v3/index.html` (overlays briefing/result/worldmap, boss banner, FPS meter)
- `src-v3/systems/SaveSystem.js` (extensions levels[id], helpers stars/unlocked)
- `src-v3/systems/LevelRunner.js` (loadLevel, level-loaded event)
- `src-v3/entities/Enemy.js` (type `brigand_boss`, charge state, boss-spawned/charge events)
- `scripts/auto-test-crowdef.mjs` (phase 2 boss smoke)

**Intouchables** :
- `src-v2/`, `src/`, `main` branch — Park Defense intact
- Quaternius assets : pas de DL nouveau (Pirate_Male réutilisé pour Brigand)

## Pour la suite (J4)

- **J4.A** : Boutique méta + 10 upgrades persistants (HP castle base, hero respawn, coins start, etc.)
- **J4.B** : Skins équipables + tours déblocables individuellement
- Décisions de game-feel à demander :
  - Coût upgrade méta (échelle exponentielle ? bornes ?)
  - Skins purement cosmétiques ou bonus stats ?
  - Tours déblocables → cost initial puis re-disponibles infini, ou stock par run ?

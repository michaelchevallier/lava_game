# J4.A — Boutique méta + 10 upgrades persistants (Crowd Defense /v3/)

**Date** : 2026-04-29.
**Branche** : `phaser-pivot`.
**Commits** : `01299e6` → `2f5c335` (4 feat).

## Résumé

J3 livrait la campagne (8 niveaux + boss). J4.A ajoute la **méta-progression** :
les boss droppent des gemmes 💎 persistantes qui financent une boutique
de 10 upgrades répartis en 3 tiers déblocables progressivement. Première vraie
boucle de retention « rejouer pour upgrader ».

## Livré (par commit)

| Commit | Sujet | Détail |
|---|---|---|
| `01299e6` | feat(v3): économie gemmes — drops boss + persistance + HUD popup | SaveSystem v2 : `gems`, `upgrades`. Mid-boss drop 5💎, boss world drop 20💎. Compteur HUD top-right + popup violet centré. |
| `925598f` | feat(v3): boutique méta — 10 upgrades 3 tiers + UI overlay 🛒 | `data/metaUpgrades.js` (10 upgrades, 3 tiers, courbe 5/15/40). Overlay `#shop` accessible via bouton 🛒 + raccourci U. Cards triées par tier avec lock CSS. |
| `63edf6a` | feat(v3): application des bonus méta en run | `LevelRunner.metaBonuses` recomputed sur setup et loadLevel. Hero.applyMetaBonuses(). Tower upgrade discount via Slot.tick. perkChoiceCount au level-up. |
| `2f5c335` | feat(v3): bouton 🛒 Boutique sur écran victoire après boss | Bouton conditionnel sur résultat win + niveau ayant boss/midboss. UX : invite Milan à dépenser ses gemmes fraîchement gagnées. |

## 10 upgrades

### Tier 1 (disponible dès le départ)

| ID | Icône | Nom | Effet (Lv1/Lv2/Lv3) |
|---|---|---|---|
| `castle_hp` | 🏰 | Forteresse | +10/+20/+30% PV château |
| `hero_dmg` | ⚔️ | Lame affûtée | +10/+20/+30% dégâts hero |
| `coins_start` | 💰 | Bourse pleine | +50/+100/+200 or de départ |
| `xp_boost` | ✨ | Expérience accrue | +10/+20/+30% XP par kill |

### Tier 2 (déblocable après World 1)

| ID | Icône | Nom | Effet |
|---|---|---|---|
| `hero_range` | 🎯 | Œil de faucon | +10/+20/+30% portée hero |
| `coin_multi` | 🪙 | Marchand prospère | +15/+30/+50% or par kill |
| `perk_reroll` | 🎲 | Re-roll des perks | +1/+2/+3 perks proposés au level-up |

### Tier 3 (déblocable après World 2)

| ID | Icône | Nom | Effet |
|---|---|---|---|
| `hero_fire_rate` | 💨 | Cadence d'enfer | +10/+20/+30% cadence hero |
| `gem_multi` | 💎 | Aimant à gemmes | +25/+50/+100% gemmes par boss |
| `tower_discount` | 🛠️ | Architecte malin | -10/-20/-30% coût upgrades tours |

## Économie

- **Drops boss** : mid-boss (`isMidBoss`) = 5💎, boss world (`isBoss`) = 20💎
- **Run W1 max** : 5+5+20 = 30💎 (mid-boss W1.5/W1.7 + boss W1.8)
- **Coût upgrade** : exponentiel `5 / 15 / 40` = **60💎 pour maxer une upgrade**
- **Reset** : 10💎 forfait → rembourse les gemmes dépensées (sum 0/5/20/60 selon lvl)
- **Total fin de jeu** : 10 upgrades × 60💎 = 600💎 = ~20 runs boss

## Boutique UI

Overlay `#shop` (raccourci **U** ou bouton 🛒 HUD) :

- 3 sections par tier avec titre `Tier X` + hint déblocage si verrouillé
- Cards par upgrade : icône, nom, pips colorés (filled = lvl acquis), description, **Actuel → Prochain**
- Bouton `5💎/15💎/40💎` pour acheter le palier suivant (disabled si pas assez ou tier locked)
- Bouton `↺` reset (10💎, disabled si lvl=0 ou pas assez de gemmes)
- Pause auto du runner quand le shop est ouvert
- Disponible aussi depuis l'écran victoire après un boss (bouton conditionnel)

## Application en run

`computeActiveBonuses(SaveSystem)` est appelé sur :
- `LevelRunner.constructor` (premier setup)
- `LevelRunner.loadLevel` (chaque level switch)

Bonuses appliqués :

| Bonus | Cible | Méthode |
|---|---|---|
| `castleHPMul` | castleHP/Max | `Math.round(level.castleHP × mul)` |
| `startCoinsBonus` | coins | `level.startCoins + bonus` |
| `heroDamageMul` | Hero.damageMul | `applyMetaBonuses` |
| `heroRangeMul` | Hero.rangeMul | idem |
| `heroFireRateMul` | Hero.fireRateMul | inverse (×↓ time) |
| `coinGainMul` | Hero.coinGainMul | idem |
| `xpMul` | Hero.gainXp | applique au moment du gain |
| `perkChoiceCount` | rollPerkChoices | dans showNextPerkChoice |
| `gemGainMul` | LevelRunner.dropGems | round(gems × mul) |
| `towerUpgradeDiscount` | Slot.tick | `targetCost × (1 - discount)` à partir Lv2+ |

## Tests étendus

`scripts/auto-test-crowdef.mjs` v3 — **15 asserts** (vs 11 en J3) :

Phase 1 (world1-1 autopilot) : 9 asserts inchangés.
Phase 2 (boss smoke world1-8) : 2 asserts (spawn + charge).
Phase 3 (meta-shop end-to-end, **nouveau**) :

10. ✓ shop ouvert via `__cd.shop.open()`
11. ✓ upgrade `castle_hp` achetée (lvl 1)
12. ✓ 5💎 dépensées
13. ✓ +10% castle HP appliqué dans le run suivant (132 vs 120 base)

Phase 3 inclut :
- `cd.save.reset()` pour repartir clean
- `addGems(50)` pour avoir de quoi acheter
- `cd.shop.buy("castle_hp")` exposé via `__cd.shop` API
- `cd.loadLevel("world1-1")` puis lecture de `runner.castleHPMax`

Run final : 15/15 ✓, FPS avg 19.8.

## Découvert / Pivots

- **Save migration v1 → v2** : tolérante (spread + fallback). Aucun reset pour les saves existantes.
- **Reset arithmétique** : volontairement permet net +50💎 au lvl 3 (le coût est déjà assumé,
  le fee de 10💎 est juste la friction). Évite le piège classique « j'ai mis 60💎 dans la
  mauvaise stat, je perds tout ».
- **Boutique en pause forcée** : empêche d'optimiser pendant un combat (et empêche les bugs).
- **`__cd.shop` API** : permet aux tests Playwright de scripter l'achat sans cliquer dans le DOM.

## Fichiers touchés J4.A

**Nouveaux** :
- `src-v3/data/metaUpgrades.js` (143 LOC)
- `docs/changelog/J4A-boutique.md` (ce fichier)

**Modifiés** :
- `src-v3/index.html` (overlay shop, gems counter, bouton 🛒, ~80 LOC CSS+HTML)
- `src-v3/main.js` (renderShop, buildShopCard, showShop/closeShop, ~120 LOC)
- `src-v3/systems/SaveSystem.js` (v2 schema, gems API, upgrades API)
- `src-v3/systems/LevelRunner.js` (metaBonuses init + reapply on loadLevel)
- `src-v3/entities/Hero.js` (applyMetaBonuses, xpMul)
- `src-v3/entities/Slot.js` (tower discount on Lv2+)
- `scripts/auto-test-crowdef.mjs` (phase 3 meta-shop)

## Pour la suite

- **J4.B** : Skins équipables + tours déblocables individuellement
- Décisions de game-feel à demander :
  - Skins purement cosmétiques ou stats légères ?
  - Tours déblocables : par achat 💎, ou via achievements ?
  - Combien de skins par categories (hero, tour, château) ?

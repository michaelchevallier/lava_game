# J4.B — 12 skins multi-économie + équipement (Crowd Defense /v3/)

**Date** : 2026-04-29.
**Branche** : `phaser-pivot`.
**Commits** : `9aed297` → `abcf2dd` (4 feat).

## Résumé

J4.A livrait la méta-progression (gemmes + 10 upgrades). J4.B ajoute **12 skins**
en mix de 3 modèles économiques (achat / drops / achievements), avec stats
légères (+3-5%) et application visuelle complète : GLB swap hero, château recoloré,
particules de kill custom.

## Livré (par commit)

| Commit | Sujet | Détail |
|---|---|---|
| `9aed297` | feat(v3): catalogue 12 skins + SaveSystem v3 | `data/skins.js` avec catalog + 4 hero achat / 4 hero drop boss / 2 château / 2 vfx. Save schema v3 avec skinsOwned/Equipped/achievements/totalKills, migration tolérante. |
| `7702b40` | feat(v3): UI onglets skins + équipement live | 4 onglets dans #shop (Améliorations / Hero / Château / Effets). Cards avec preview couleur, états locked/unlocked/equipped. Click équipe instantanément. |
| `6e7f674` | feat(v3): application skins en run | Hero swap GLB selon skin (wizard/soldier/pirate/knightgolden). Castle base+roof recoloré. Particules kill override (or/foudre). +5% stat appliqué via Hero.applySkinBonuses. |
| `abcf2dd` | feat(v3): drops boss + achievements + toasts | Boss kill = drop skin spécifique au type (one-shot). 100 ennemis tués cumul = unlock vfx_lightning. W1.8 sans perdre PV château = unlock castle_royal. Toasts violet en bas centré. |

## 12 skins

### Hero — 4 achats + 4 drops boss

| ID | Modèle économique | Coût/Source | Stat |
|---|---|---|---|
| `hero_default` | Default | gratuit | aucune |
| `hero_soldier` | Achat | 50💎 | +5% dégâts |
| `hero_wizard` | Achat | 80💎 | +5% portée |
| `hero_knight_gold` | Achat | 120💎 | +5% cadence |
| `hero_pirate` | Achat | 200💎 | +5% vitesse |
| `skin_brigand_slayer` | Drop | Brigand W1 | +5% or |
| `skin_warlord` | Drop | Boss W2 | +5% gemmes |
| `skin_corsair` | Drop | Boss W3 | +5% XP |
| `skin_dragonslayer` | Drop | Boss W4 | +5% PV château |

### Château — 1 achat + 1 achievement

| ID | Source | Stat |
|---|---|---|
| `castle_default` | gratuit | aucune |
| `castle_royal` | Achievement `perfect_world1` | +3% PV château |
| `castle_obsidian` | Achat 150💎 | +3% PV château |

### Effets particules — 1 achat + 1 achievement

| ID | Source | Stat |
|---|---|---|
| `vfx_default` | gratuit | aucune |
| `vfx_golden` | Achat 100💎 | +3% or |
| `vfx_lightning` | Achievement `kills_100` | +3% cadence |

## Économie totale

- Skins payants : 50+80+120+200+150+100 = **700💎** = ~24 boss runs
- Drops : guarantés au 1er kill de chaque boss type → 4 skins gratuits
- Achievements : 2 skins via gameplay objectifs
- **Total accessibles** : 12 skins en mix achat/drop/achievement

## SaveSystem v3

```js
{
  version: 3,
  // v2 fields...
  skinsOwned: ["hero_default", "castle_default", "vfx_default", ...],
  skinsEquipped: { hero: "hero_default", castle: "castle_default", vfx: "vfx_default" },
  achievements: ["perfect_world1", "kills_100"],
  totalKills: 0,
}
```

API ajoutée :
- `isSkinOwned(id)` / `ownSkin(id)`
- `getEquippedSkin(category)` / `equipSkin(category, id)`
- `getOwnedSkins()`
- `hasAchievement(id)` / `unlockAchievement(id)`
- `getTotalKills()` / `addKills(n)`

Migration v2→v3 : tolérante (spread default + parsed). Aucun reset pour les saves J4.A.

## UI Boutique étendue

Onglets : `Améliorations` | `🤴 Hero` | `🏰 Château` | `✨ Effets`

Cards skin :
- Preview : icône emoji sur fond `skin.color`
- État `equipped` : border vert + badge "✓ Équipé"
- État `locked` : opacity 0.55 + greyscale + hint custom
- Hint dynamique selon unlock type : "30💎 — clic pour acheter", "Tombe du boss X", "Termine W1 sans perdre PV", `${kills}/100 ennemis tués`

## Application en run

`computeSkinBonuses(SaveSystem)` parcourt les 3 catégories équipées :

| Stat skin | Appliqué via |
|---|---|
| `castleHPMul` | `LevelRunner.castleHP = round(level.castleHP × castleMul × skinCastleMul)` |
| `damageMul` | `Hero.applySkinBonuses` |
| `rangeMul` | idem |
| `fireRateMul` | inverse (×↓ time) |
| `moveSpeedMul` | idem |
| `coinGainMul` | idem |
| `xpMul` | idem |
| `gemBonusMul` | `LevelRunner` au boss kill |
| `killColor` (vfx) | `Particles.emit` au death |
| `color`/`roofColor` (castle) | `rebuildLevelDecor` mesh material |

## Drops boss

Au death d'un ennemi avec `cfg.isBoss === true`, on cherche un skin avec
`unlock.type === "drop"` && `unlock.boss === e.type`. Si trouvé et pas owned →
`SaveSystem.ownSkin()` + emit `crowdef:skin-dropped`. Toast affiché.

Pour J4.B, seul le `brigand_boss` existe → seul `skin_brigand_slayer` est
droppable. Les 3 autres skins drop attendent les boss W2/W3/W4 (J6).

## Achievements

| ID | Trigger | Reward skin |
|---|---|---|
| `perfect_world1` | win world1-8 avec castleHP === castleHPMax | castle_royal |
| `kills_100` | totalKills cumul ≥ 100 | vfx_lightning |

Le check est synchrone (LevelRunner._winLevel + after enemy death). Toast affiché
quand débloqué. Persisté en save.

## Tests étendus

`scripts/auto-test-crowdef.mjs` v4 — **17 asserts** (vs 15 en J4.A) :

Phases 1-3 : 15 asserts inchangés.
Phase 3.5 (skin equip GLB swap, **nouveau**) :

16. ✓ skin hero équipé via `__cd.shop.equipSkin("hero_wizard")`
17. ✓ Hero GLB swap : `runner.hero.skinAsset === "wizard"` après restart auto

Mécanique testée : equip skin → emit `crowdef:skin-equipped` → listener appelle
`runner.restart()` → `loadLevel` → nouveau Hero avec asset wizard → vérification
de la propriété en lecture brute.

Run final : 17/17 ✓, FPS avg 20.5.

## Découvert / Pivots

- **Hero animation tolérante** : ajout fallback `Walk`/`Idle` sur tous les hero skins
  (assets différents = noms d'anim différents). Avant : "Idle" hardcoded → planté
  silencieusement sur soldier/wizard.
- **Restart auto sur equip hero** : forcé pour swap GLB visible immédiatement.
  Sinon le swap ne prendrait effet qu'au prochain niveau.
- **`castle` event handler** : `rebuildLevelDecor()` seulement (pas de runner restart).
  Le château est juste un mesh visuel, recoloré sans toucher l'état.
- **Save migration tolérante** : `[...new Set([...def.skinsOwned, ...parsed.skinsOwned])]`
  pour ne jamais perdre les skins défaut même si la save est trafiquée.

## Fichiers touchés J4.B

**Nouveaux** :
- `src-v3/data/skins.js` (165 LOC)
- `docs/changelog/J4B-skins.md` (ce fichier)

**Modifiés** :
- `src-v3/index.html` (onglets shop, skin grid CSS, toast CSS, ~80 LOC)
- `src-v3/main.js` (renderSkins, onSkinCardClick, setShopTab, listeners, ~120 LOC)
- `src-v3/systems/SaveSystem.js` (v3 schema + 8 helpers skins/achievements)
- `src-v3/systems/LevelRunner.js` (skinBonuses + drop logic + achievements)
- `src-v3/entities/Hero.js` (skinAsset option + applySkinBonuses + anim fallback)
- `scripts/auto-test-crowdef.mjs` (phase 3.5 skin equip)

## Pour la suite (J5)

- **J5** : Audio complet — Suno musique 4 tracks (menu/calm/intense/boss) + intégration MusicManager
- Demander à Mike : il génère ses 4 tracks Suno, je code l'intégration ?

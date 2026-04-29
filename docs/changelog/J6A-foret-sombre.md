# J6.A — Forêt Sombre (World 2) (Crowd Defense /v3/)

**Date** : 2026-04-29.
**Branche** : `phaser-pivot`.
**Commits** : 1 commit feat (theme + 8 niveaux + boss).

## Résumé

J5 ajoutait l'audio. J6.A livre le **Monde 2 — Forêt Sombre** avec :
- Theme system dynamique (background, fog, ground, trees colors par monde)
- 8 niveaux W2 progressifs
- Nouvel ennemi **Assassin** (stealth toggling 50/50)
- Nouveau boss **Sorcier de la Forêt** (`warlord_boss`) qui invoque des minions toutes les 5s

## Theme system

Nouveau module `data/themes.js` avec 4 thèmes : `plaine`, `foret`, `desert`, `volcan`.

| Theme | Bg | Fog | Ground | Trees |
|---|---|---|---|---|
| plaine | vert clair | vert clair | vert | vert |
| **foret** | vert sombre | vert moyen | vert sombre | tronc sombre + feuilles vert très sombre |
| desert | sable | sable clair | sable | tronc sable + feuilles olives |
| volcan | rouge sombre | rouge orangé | rouge brun | tronc noir + feuilles rouge sang |

`applyTheme(themeId)` recolore scene.background, scene.fog, ground material, dirt material, et reconstruit les arbres décoratifs avec les couleurs du theme. Appelé sur level-loaded.

## Nouveau ennemi : Assassin

```js
assassin: {
  hp: 2, speed: 2.0, damage: 6, reward: 4,
  asset: "goblin", scale: 0.50, walkAnim: "Run",
  bodyColor: 0x222244, isStealth: true,
  stealthCycleMs: 2200, stealthOpacity: 0.25,
}
```

Mécanique stealth : toggle visible (op 1.0) / invisible (op 0.25) toutes les 1.1s sur un cycle de 2.2s. Forces le joueur à lire le pattern pour timing les tirs.

## Nouveau boss : Sorcier de la Forêt

```js
warlord_boss: {
  hp: 100, speed: 0.55, damage: 35, reward: 120,
  asset: "soldier", scale: 1.2, walkAnim: "Walk",
  bodyColor: 0xff7a00, isBoss: true,
  summonsMinions: true, summonCooldownMs: 5000, summonType: "runner",
  bossName: "Sorcier de la Forêt",
}
```

Mécanique : toutes les 5s, émet `crowdef:boss-summon` avec `{ type: "runner", x, z, t }`. LevelRunner écoute et instancie un nouveau Enemy à la position `t` du path. Crée une pression continue sur les tours.

## 8 niveaux W2

| ID | Nom | Slots | Vagues | Castle HP | Coins | Specials |
|---|---|---|---|---|---|---|
| world2-1 | Lisière | 4 | 5 | 130 | 130 | intro assassin |
| world2-2 | Sentier | 4 | 5 | 135 | 135 | + assassin density |
| world2-3 | Clairière | 5 | 5 | 140 | 140 | mid-boss vague 5 |
| world2-4 | Marécage | 5 | 5 | 145 | 145 | mid-boss + shielded |
| world2-5 | Cirque | 5 | 5 | 150 | 150 | 2 mid-bosses |
| world2-6 | Sanctuaire | 5 | 5 | 155 | 160 | mid-bosses + brutes denses |
| world2-7 | Couronne | 5 | 5 | 160 | 165 | pré-boss |
| world2-8 | **Sorcier** | 5 | 6 | 180 | 200 | **BOSS warlord** |

## Tests

22/22 ✓ asserts (inchangé). Le test couvre toujours W1 ; smoke test boss `brigand_boss`. W2 testé manuellement via `__cd.loadLevel("world2-1")` à `world2-8`.

## Fichiers touchés J6.A

**Nouveaux** :
- `src-v3/data/themes.js`
- `src-v3/data/levels/world2-1.js` à `world2-8.js` (8 niveaux)
- `docs/changelog/J6A-foret-sombre.md`

**Modifiés** :
- `src-v3/main.js` (applyTheme + clearTrees + listener level-loaded)
- `src-v3/entities/Enemy.js` (assassin + warlord_boss configs + stealth/summon mechanics)
- `src-v3/systems/LevelRunner.js` (listener boss-summon + dispose cleanup)
- `src-v3/data/levels/index.js` (16 niveaux total)

## Pour la suite

J6.B : Désert Brûlant (W3) avec ennemi volant + boss Corsaire.

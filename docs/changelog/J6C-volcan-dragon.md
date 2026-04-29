# J6.C — Volcan du Dragon (World 4) (Crowd Defense /v3/)

**Date** : 2026-04-29.
**Branche** : `phaser-pivot`.

## Résumé

J6.B livrait W3 Désert. J6.C livre **W4 Volcan du Dragon** — le monde final
avec :
- 8 niveaux W4 (theme `volcan`)
- Nouvel ennemi **Imp** (rapide + flammes)
- Boss final **Dragon de Lave** (`dragon_boss`) qui combine **3 mécaniques** :
  vol (flyHeight 2.0) + invocation imps (4.5s) + AOE feu (6s)

## Nouvel ennemi : Imp

```js
imp: {
  hp: 4, speed: 1.5, damage: 8, reward: 5,
  asset: "goblin", scale: 0.55,
  bodyColor: 0xff3a10, isFiery: true,
}
```

Plus tanky qu'un runner classique mais plus rapide qu'un brute. Couleur lave.

## Boss final : Dragon de Lave

```js
dragon_boss: {
  hp: 180, speed: 0.5, damage: 50, reward: 200,
  asset: "wizard", scale: 1.5,
  isBoss: true, isFlyer: true, flyHeight: 2.0,
  aoeBlastMs: 6000, aoeBlastRadius: 5.0, aoeBlastDamage: 35,
  summonsMinions: true, summonCooldownMs: 4500, summonType: "imp",
  bossName: "Dragon de Lave",
}
```

Cumul de toutes les mécaniques boss :
- **Vol** comme le flyer (impossible à atteindre par tower archer/mage qui visent au sol)
- **Summon** comme le warlord (nouvel imp toutes 4.5s, plus dur que runner)
- **AOE** comme le corsaire (5.0 radius, 35 dmg, toutes 6s)

→ Force le joueur à investir dans baliste pour les flyers, mage AOE pour les imps,
et placer son hero loin pour éviter l'AOE.

## 8 niveaux W4

| ID | Nom | Castle HP | Coins | Specials |
|---|---|---|---|---|
| world4-1 | Caldera | 180 | 180 | intro imp |
| world4-2 | Falaise | 185 | 185 | imps + flyers |
| world4-3 | Grotte | 190 | 200 | mid-boss |
| world4-4 | Coulée | 195 | 210 | 2 mid-bosses |
| world4-5 | Geyser | 205 | 220 | tous types mélangés |
| world4-6 | Forge | 215 | 230 | swarm imps |
| world4-7 | Antre | 225 | 240 | pré-boss |
| world4-8 | **Dragon** | 250 | 280 | **BOSS FINAL** |

## Tests

22/22 ✓ asserts inchangés. W4 testé manuellement.

## Fichiers touchés J6.C

**Nouveaux** :
- `src-v3/data/levels/world4-1.js` à `world4-8.js`
- `docs/changelog/J6C-volcan-dragon.md`

**Modifiés** :
- `src-v3/entities/Enemy.js` (imp + dragon_boss configs)
- `src-v3/data/levels/index.js` (32 niveaux total — campagne complète)

## Pour la suite

J7 : Polish & mobile + cinématiques. Puis grosse passe d'équilibrage post-J7
(swarm, multi-paths, preview tour, screenshots, agents review).

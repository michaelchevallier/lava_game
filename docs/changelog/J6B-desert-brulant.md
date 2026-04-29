# J6.B — Désert Brûlant (World 3) (Crowd Defense /v3/)

**Date** : 2026-04-29.
**Branche** : `phaser-pivot`.

## Résumé

J6.A livrait W2 Forêt. J6.B livre **W3 Désert Brûlant** avec :
- 8 niveaux W3 progressifs (theme `desert`)
- Nouvel ennemi **Flyer** (volant, ignore les obstacles au sol, suit le path en hauteur)
- Nouveau boss **Capitaine Corsaire** (`corsair_boss`) avec **AOE explosion** toutes 8s

## Nouvel ennemi : Flyer

```js
flyer: {
  hp: 3, speed: 1.6, damage: 5, reward: 4,
  asset: "wizard", scale: 0.45,
  isFlyer: true, flyHeight: 1.4,
}
```

Mécanique : `group.position.y = flyHeight + sin(t × 20) × 0.15` pour bobbing aérien. Le flyer ignore visuellement les obstacles ; les tours archer/mage doivent les prendre. Baliste recommandée pour pierce.

## Nouveau boss : Capitaine Corsaire

```js
corsair_boss: {
  hp: 130, speed: 0.5, damage: 40, reward: 150,
  asset: "pirate", isBoss: true, isCorsair: true,
  aoeBlastMs: 8000, aoeBlastRadius: 4.5, aoeBlastDamage: 30,
  bossName: "Capitaine Corsaire",
}
```

Mécanique AOE : toutes les 8s, émet `crowdef:boss-aoe` avec `{ x, z, radius, damage }`.
LevelRunner écoute et :
- Si le hero est dans le rayon → onCastleHit(damage) (le hero est immortel mais le château prend les dégâts)
- Shake JuiceFX 0.5/400ms
- 24 particules cyan emit

Forces le joueur à rester loin du boss pendant ses charges.

## 8 niveaux W3

Progression similaire à W2 mais avec assets `desert` + flyers à toutes vagues.
Castle HP 150-200, coins 150-220, mid-bosses W3.3+.

| ID | Nom | Slots | Castle HP | Specials |
|---|---|---|---|---|
| world3-1 | Dunes | 4 | 150 | intro flyer |
| world3-2 | Oasis | 4 | 155 | flyers ↑ |
| world3-3 | Cratère | 5 | 160 | mid-boss |
| world3-4 | Tempête | 5 | 165 | 2 mid-bosses |
| world3-5 | Mirage | 5 | 170 | flyers + assassins |
| world3-6 | Caravane | 5 | 175 | swarm flyers |
| world3-7 | Pyramide | 5 | 180 | pré-boss |
| world3-8 | **Corsaire** | 5 | 200 | **BOSS aoe** |

## Tests

22/22 ✓ asserts inchangés (test couvre toujours W1).
W3 testé manuellement via `__cd.loadLevel("world3-N")`.

## Fichiers touchés J6.B

**Nouveaux** :
- `src-v3/data/levels/world3-1.js` à `world3-8.js`
- `docs/changelog/J6B-desert-brulant.md`

**Modifiés** :
- `src-v3/entities/Enemy.js` (flyer + corsair_boss + flyHeight + aoeBlast mechanics)
- `src-v3/systems/LevelRunner.js` (handler boss-aoe + dispose cleanup)
- `src-v3/data/levels/index.js` (24 niveaux total)

## Pour la suite

J6.C : Volcan du Dragon (W4) avec boss Dragon volant + souffle de feu.

# Agent reviews — Synthèse master (POST.F)

**Date** : 2026-04-29.
**Branche** : `phaser-pivot`, commit `d74a2e5`.
**État** : J1-J7 livrés + POST.A-E (équilibrage v1, multi-paths, path matérialisé, nature decor, preview tour).

3 agents experts ont évalué le jeu en parallèle :
1. [`fun.md`](fun.md) — game-feel & satisfaction (Note **6/10**)
2. [`balance.md`](balance.md) — équilibrage & progression (Note **6.5/10**)
3. [`interest.md`](interest.md) — identité visuelle & rejouabilité (Note **6.5/10**)

**Note globale convergente** : ~6.3/10. Squelette solide, polish à faire sur les 3 axes.

## Top 10 actions priorisées (cross-review)

### Tier 1 — Bugs visibles à fixer maintenant

1. **[INTEREST]** `nature_twisted1` foret 5× trop grand → écrase W2.1-2.8. **Fix** : clamp scale 0.3-0.5 dans palette `foret` (`main.js` THEME_PALETTE).
2. **[INTEREST]** Aucun exclusion zone autour des slots → arbres en plein milieu du combat. **Fix** : étendre `isOnPath` à 3u radius autour des `slot.pos`.
3. **[BALANCE]** `xp_boost` perk +10/20/30% inutile (hero stagne lvl 3-4). **Fix** : passer +25/50/100% (`metaUpgrades.js`).
4. **[BALANCE]** Endless wave 18-20 = soft cap réel (vs 30 conçues). **Fix** : ratio 0.18→0.14, spawn min 220→280ms (`endless.js`).
5. **[FUN]** Tir hero invisible. **Fix** : flash blanc 0.05s + 6 particules + light recoil (Hero `_fire`).

### Tier 2 — Game-feel

6. **[FUN]** Hit feedback : ennemis se font « chatouiller ». **Fix** : flash rouge 0.08s sur Enemy material + popup `-X` + 1px knockback frame + JuiceFX shake 0.02.
7. **[FUN]** Coin flying absent au kill. **Fix** : sprite `🪙` qui s'envole vers le compteur HUD à chaque kill (DOM ou Three.js sprite).
8. **[INTEREST]** Outline héros/boss manque (les autres ennemis ont un outline blanc, pas le Brigand). **Fix** : `addOutlineToScene` sur tous les `isBoss === true` à scale 1.06.

### Tier 3 — Variété et économie méta

9. **[BALANCE]** Or W2+ insuffisant (-60 à -310¢ vs coût total slots). **Fix** : `startCoins +20/+25/+30` sur W2.4/W3.4/W4.4 + revoir coin_gain mul.
10. **[INTEREST]** Variété intra-monde nulle (8 niveaux d'un monde se ressemblent). **Fix** : ajouter 1 prop « vedette » par level (mushroom géant W2.5, oasis cactus W3.6, fissure de lave W4.6).

## Actions report-only (pas de fix immédiat)

- **[FUN]** Skins drop boss = même asset + tint → motivation à collect faible. Plan déjà prévu : nouveaux GLBs (Mike). Document.
- **[INTEREST]** Identité boss faible (Dragon = wizard doré scaled). Idem : nouveaux GLBs ou particle systems custom par boss.
- **[FUN]** Perks « transform » (boule de feu, foudre, ricochet) absents — actuellement tous +X% stats. Nouveau game design pass.
- **[BALANCE]** Exploits :
  - Shielded bypass-able par tir latéral (lateralOffset slot → shield frontal-only failure)
  - Combo `coin_gain` + `perk_reroll` casse l'économie
  - Path random spawning crée streaks de leak sur W4.8 path 3
  → fixer en POST.A bis

## Workflow recommandé

1. **POST.G** (nouveau) : Tier 1 fixes critiques (5 actions, ~2-3h)
   - Clamp twisted forêt
   - Exclusion slots
   - xp_boost rebalance
   - Endless tuning
   - Tir hero flash
   - Re-screenshot + tests

2. **POST.H** (nouveau) : Tier 2 game-feel (3 actions, ~2h)
   - Hit feedback (flash + popup + knockback)
   - Coin flying
   - Outline boss

3. **POST.I** (nouveau) : Tier 3 variété (2 actions, ~3h)
   - Or W2+ tuning
   - 1 prop vedette par level

4. **Validation Mike** : test live, ajustement valeurs si besoin.

5. **Backlog** post-validation Mike :
   - Nouveaux GLBs boss (si Mike veut investir dans des assets premium)
   - Perks « transform » game design pass
   - Fix exploits shielded/combo/path streaks
   - Mobile/iPad polish (J7 originelle)

## Convergences fortes (3 agents d'accord)

- Le **path matérialisé** (POST.C) est unanimement loué : énorme gain.
- Les **mécaniques de boss** sont louées (variées, propres).
- Le **proximity-build** (Slot drain) est jugé original et bien pensé.
- Les **3 agents convergent sur ~6.5/10** — solide squelette, polish à faire.

Les 3 agents s'accordent : **gros potentiel, polish manquant**, pas de bug architectural.

## Décision

Ces 3 reviews sont la base pour la prochaine session. À Mike de décider l'ordre/priorité.

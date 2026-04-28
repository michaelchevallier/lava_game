# J2 — Combat vivant (Crowd Defense /v3/)

**Date** : 2026-04-29.
**Branche** : `phaser-pivot`.
**Commits** : `96381b7` → `0424b2c` (5 commits feat + 1 final tests).

## Résumé

Le J1 livrait un seul ennemi (Zombie) et une seule tour générique.
J2 transforme le combat en système de jeu profond : 6 types d'ennemis
distincts, 4 archétypes de tours, roguelite light avec perks, upgrades
3 paliers.

## Livré (par commit)

| Commit | Sujet | Détail |
|---|---|---|
| `96381b7` | feat(v3): 6 types d'ennemis + waves data-driven | Zombie / Goblin / Soldier / Knight_Golden / Wizard / Pirate. Waves `list[]` mix de types, shielded back-only damage. |
| `5b771a1` | feat(v3): 4 types de tours + AoE/pierce/aim | Archer / Mage AoE 1.5 / Tank cadence rapide / Baliste pierce 2. GLBs Quaternius RTS pack. |
| `dfa2da4` | feat(v3): hero XP + level-up trigger + perk multipliers | XP par kill, courbe linéaire+ (30/50/75/100/130), 9 multipliers/flags Hero, HUD bar level. |
| `b8b6ae7` | feat(v3): 10 perks pool + UI 3-cartes au level-up | 6 offensifs / 3 économie / 1 mobilité, overlay cards colorés par catégorie. |
| `0424b2c` | feat(v3): upgrades tours 3 paliers + swap GLB | Lv1→Lv2 ×2 cost +50% dmg +20% range, Lv2→Lv3 ×4 cost +100% dmg + effet spécial type. |

## 6 types d'ennemis

| Type | HP | Speed | Dmg | Reward | Asset | Spécificité |
|---|---|---|---|---|---|---|
| basic | 3 | 1.2 | 5 | 2 | Zombie_Male | rien |
| runner | 1 | 2.4 | 4 | 2 | Goblin_Male | rapide/fragile |
| brute | 12 | 0.8 | 12 | 8 | Soldier_Male | tank lent |
| shielded | 2 + shield 4 | 1.0 | 8 | 5 | Knight_Golden_Male | back-only damage |
| midboss | 30 | 0.7 | 20 | 15 | Wizard | mid-wave threat |
| boss | 60 | 0.6 | 30 | 50 | Pirate_Male | finale |

## 4 archétypes de tours

| Type | Range | CD | Dmg | Asset | Lv1 | Lv2 (×2 cost) | Lv3 (×4 cost) |
|---|---|---|---|---|---|---|---|
| archer | 8 | 700ms | 1 | Archery | base | dmg×1.5 range×1.2 | + multiShot 2 projos |
| mage | 7 | 1200ms | 2 | TowerHouse | AoE 1.5 | dmg×1.5 range×1.2 | AoE 2.5 |
| tank | 5 | 220ms | 0.5 | Barracks | base | dmg×1.5 range×1.2 | + pierce 1 |
| ballista | 14 | 1500ms | 4 | WatchTower | pierce 2 | dmg×1.5 range×1.2 | pierce 4 |

## 10 perks roguelite

| Perk | Catégorie | Effet | Stack |
|---|---|---|---|
| Œil de l'aigle | offensif | Range +30% | oui |
| Doigts vifs | offensif | Fire rate +25% | oui |
| Frappe puissante | offensif | Damage +50% | oui |
| Tir double | offensif | Multi-shot 2 projectiles | non |
| Coup critique | offensif | +20% chance ×2 dmg | oui |
| Flèche perçante | offensif | Pierce +1 | oui |
| Pillage royal | économie | Coin +50% | oui |
| Pacte du sang | économie | Lifesteal +1 HP/kill | oui |
| Bénédiction royale | économie | +5 HP château fin de wave | oui |
| Pieds rapides | mobilité | Move speed +20% | oui |

XP curve : 30 → 50 → 75 → 100 → 130 (5 paliers max, level 1→6, ~150 kills).

## Découvert / Pivots

- **Stats `cfg.aoe` / `cfg.pierce` partagés entre instances** : chaque
  upgrade modifiait `TOWER_TYPES.archer` lui-même → bug pour les autres
  archers. **Pivot** : stats stockées sur l'instance (`this.aoe`,
  `this.pierce`, `this.multiShot`).
- **Mage n'a que 2 niveaux d'asset** (TowerHouse_FirstAge / SecondAge).
  Pour Lv3, on réutilise SecondAge avec scale boost.
- **Pause au level-up** doit aussi reset `_perkQueue` au `:level-restart`
  pour ne pas laisser un overlay zombie après un restart.
- **Autopilot test** : si target premier slot puis next quand built,
  on n'upgrade jamais. Refactor : le robot pick le 1er slot avec
  `currentLevel < maxLevel`, donc reste sur le même tant que possible
  → les upgrades se déclenchent.

## Tests automatisés (état)

`npm run test:crowdef` — **9/9 asserts verts** :
- Page errors = 0
- Console errors = 0
- Runner state ∈ { won, lost } (terminal)
- Enemies killed ≥ 5
- Towers built ≥ 1
- **Hero level-ups ≥ 1** (nouveau)
- **Perks picked ≥ 1** (nouveau)
- **Tower upgrades ≥ 1** (nouveau)
- FPS avg ≥ 15 (Chromium headless)

## Tâches Mike avant J3

- [ ] Playtest live des 6 types d'ennemis (chaque type bien lisible ?)
- [ ] Playtest les 4 tours (équilibrage : trop OP / trop faible ?)
- [ ] Playtest les 10 perks (un perk OP qui domine ? un perk inutile ?)
- [ ] Playtest les upgrades 3 paliers (cost ratio ×2/×4 OK ?)
- [ ] Sentir si le combat est "vivant" comme prévu
- [ ] Donner retour de game-feel sur Discord/conversation

## Pour la suite — J3 (Monde 1 complet)

Pré-requis avant de démarrer J3 :
- Mike a playtest J2 et donné retour
- Décisions à confirmer : layout des 8 niveaux du monde 1, mécaniques
  des bosses (Brigand mid-boss au niveau 5, Brigand final au niveau 8),
  système d'étoiles (1 = finir, 2 = château ≥ 50%, 3 = château ≥ 95%)

Périmètre J3 (1-2 sessions) :
- 8 niveaux Plaine du Royaume (`world1-1.js` → `world1-8.js`)
- Mid-boss vague 5 + boss final au 8 (Brigand : charge + knockback)
- Briefings 3s avant chaque niveau
- Écran récap fin de niveau (étoiles + or)
- Carte des mondes avec niveaux verrouillés/débloqués
- Sauvegarde de la progression

## Lien plan

Voir `CROWD_DEFENSE_PLAN.md` pour la roadmap complète J1-J7 et les 17
décisions consolidées.

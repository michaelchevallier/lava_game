# J1 — Foundation (Crowd Defense /v3/)

**Date** : 2026-04-28.
**Branche** : `phaser-pivot`.
**Commits** : `1a9b308` → `0e69c80` (8 commits + 1 plan-consolidation).

## Résumé

Le MVP statique Three.js du commit `13d89ac` est devenu une foundation complète et architecturée pour les 7 jalons à venir. Le jeu a maintenant :

- **Architecture data-driven** (LevelRunner + level JSON) prête pour les 32 niveaux.
- **Vrai look pub mobile** : Quaternius rigged (Knight + Zombie) + toon shader + outlines + AnimationMixer.
- **Combat satisfaisant** : pool de particules 100, camera shake multi-source, popup damage, audio procédural 9 SFX.
- **État de jeu sain** : château HP avec barre, overlays game-over/victoire, restart propre, sauvegarde locale.
- **Tests automatisés** : Playwright headless valide gameplay+kills+towers+FPS+0 errors en ~30s.

## Livré (par commit)

| Commit | Sujet | Détail |
|---|---|---|
| `1a9b308` | docs(v3): plan complet | (commité par Ultraplan, 17 décisions présupposées) |
| `24340b2` | docs(v3): consolide les 17 décisions | Réécriture du tableau avec les vraies réponses Mike (interview locale) |
| `f975f36` | refactor(v3): LevelRunner + level data | main.js 425 LOC → 180 LOC. CustomEvents foundation. Slot.js extracted. |
| `f98d103` | feat(v3): château HP + overlays | Barre HP, flash sur hit, overlays game-over/victoire avec restart |
| `5eb6a43` | feat(v3): particules + camera shake | Pool 100, JuiceFX, popup damage, VFX kill/build/shoot/castle-hit |
| `a93bd12` | feat(v3): audio procédural + 9 SFX + mute | Web Audio port from `/v2/`, 9 SFX, bouton mute persistance pas encore |
| `0db8f7b` | feat(v3): SaveSystem | `crowdef:save`, persiste mute + bestWave + lastLevel |
| `895d940` | test(v3): Playwright harness | `auto-test-crowdef.mjs`, autopilot 6 asserts, `test:crowdef` script |
| `0e69c80` | feat(v3): Quaternius rigged + toon + outlines + Anim | Hero Knight + Enemy Zombie + AssetLoader + ToonMaterial + Outline |

## Découvert / Pivots

- **Top-level await en es2020** non supporté → bumped target à es2022 (cohérent avec le profil moderne ciblé).
- **Outline sur 50+ SkinnedMesh = 17 FPS** en headless. **Pivot** : outline + shadows désactivés sur les ennemis pour J1, gardés sur le hero. À optimiser en J2 via InstancedSkinnedMesh.
- **`SkeletonUtils` n'est pas un namespace** dans Three 0.180 : import nominatif `clone as cloneSkinned` requis.
- **Bundle gz** : 124 KB → 158 KB (+34 KB) avec GLTFLoader + SkeletonUtils + nouveaux systems. Pas de cap (décision #13).
- **Pack Quaternius** : 336 MB de fichiers source drop par Mike. Seuls 2 GLBs utilisés (Knight + Zombie, ~3.6 MB total). Le pack source est gitignored, les autres modèles seront copiés dans `public/quaternius/` au cas par cas en J2-J6.

## Tests automatisés (état)

`npm run test:crowdef` — 6/6 asserts verts :
- Page errors = 0
- Console errors = 0
- Runner state ∈ { won, lost } (terminal)
- Enemies killed >= 5 (typiquement 50-200)
- Towers built >= 1 (typiquement 3)
- FPS avg >= 15 (Chromium headless throttle ; prod desktop attendu 50+)

Test passe en ~25s avec speed=4. Résultats détaillés dans `test-results/crowdef-summary.json` (gitignored).

## Tâches Mike avant playtest

- [ ] Tester sur desktop Chrome live (prod GitHub Pages après push)
- [ ] Tester sur iPad Safari (parité décision #4)
- [ ] Confirmer game-feel : drain rate, coût tours, dmg château, HP bars
- [ ] Confirmer le look toon + Quaternius (esthétique pub mobile vs réalité)

## Pour la suite — J2 (Combat vivant)

Pré-requis avant de démarrer J2 (cf. `CROWD_DEFENSE_PLAN.md`) :
- Mike a joué J1 et donné un retour sur le game-feel (équilibrage, ressenti).
- Décision posée sur la stratégie InstancedSkinnedMesh ou pool dynamique pour optimiser le rendu de 50+ ennemis (objectif : retrouver outlines + shadows sans tomber sous 30 FPS).
- DL des autres GLBs Quaternius si besoin (Goblin, Wizard, Witch pour boss + Skeleton ou autres pour types ennemis).

Périmètre J2 (1-2 sessions) :
- 6 types d'ennemis non-volants (basic, runner, brute, shielded, mid-boss, boss-placeholder).
- 4 types de tours (Archer, Mage AoE, Tank rapide, Baliste sniper).
- Roguelite light : XP + level-up + 3 perks au choix (~10 perks pool, 3-5 max par run).
- Upgrades tours 3 paliers (re-entrée dans le cercle, ×2 puis ×4 coût).
- Affinage animations Quaternius (attack/death/recieveHit).

## Ce qui n'est PAS dans J1 (rappel)

- Multi-types ennemis et tours
- Perks roguelite
- Upgrades tours 3 paliers
- Mondes 2-4 + bosses uniques
- Boutique + skins + achievements (méta J4)
- Endless mode (J7)
- Cinématiques d'intro (J7)
- Polish iPad spécifique (J7)

## Lien plan

Voir `CROWD_DEFENSE_PLAN.md` pour la roadmap complète J1-J7 et les 17 décisions consolidées.

# Plan — Milan Crowd Defense (J1 livré + roadmap J2–J7)

## Contexte

Le draft CDC initial est un brief client. Ce document est le plan d'exécution. Il intègre les 17 décisions tranchées en interview et propose un découpage en 7 jalons + une livraison J1 en première session.

État de départ : MVP Three.js commit `13d89ac`, 6 fichiers, ~850 LOC dans `src-v3/`, déployé en `/v3/` via `deploy.yml` qui build `dist-kingshot/`. Le `main.js` actuel (425 LOC) hardcode path/vagues/slots/lights inline — pas de game state, pas de château HP, pas d'audio, pas de test harness, pas de notion de niveau.

## Décisions tranchées en interview

| # | Sujet | Décision |
|---|---|---|
| 1 | Nom du jeu | « Milan Crowd Defense » placeholder ; rename en J7 |
| 2 | Ton | Cartoon-épique fun (couleurs saturées, kills explosifs colorés, musique légère) |
| 3 | Scope | 4 mondes × 8 niveaux = 32 niveaux + endless |
| 4 | Plateforme | iPad et desktop à parité |
| 5 | Mort hero | Immortel — c'est le château qui a une barre de vie (PvZ-style) |
| 6 | Perks in-run | Full roguelite : 3 perks au choix à chaque level-up du hero pendant la partie |
| 7 | Upgrade tours | 3 paliers : build → upgrade1 (×2 coût, +50% dmg, +20% range) → upgrade2 (×4 coût, +100% dmg, effet spécial) |
| 8 | Endless | Oui, débloqué après avoir fini le monde 1 |
| 9 | Coop | Différé en post-v1 (si Milan demande) |
| 10 | Assets | Quaternius CC0 rigged animés (walk, attack, death) |
| 11 | Audio | SFX Kenney CC0 + musiques Suno (Mike génère les 4 tracks, je les intègre) |
| 12 | Méta | Ambitieuse : 10+ upgrades, 5+ skins, 4 tours déblocables individuellement |
| 13 | Bundle | Pas de cap (Mike n'en a rien à faire) |
| 14 | Tests auto | Playwright headless adapté de `scripts/auto-test-levels.mjs` (/v2/) |
| 15 | Cadence push | Groupée par feature complète (3-5 commits / push) |
| 16 | Reporting | Changelog markdown détaillé à la fin de chaque cycle |
| 17 | Cette session | Écriture de `CROWD_DEFENSE_PLAN.md` + livraison J1 complet |

## Architecture cible (après J1)

```
                  ┌─────────────────────────────┐
                  │ data/levels/world1-1.js     │  path, slots, waves,
                  │ (et 31 autres niveaux)      │  theme, castleHP, briefing
                  └──────────────┬──────────────┘
                                 │ chargé par
                                 ▼
   index.html ──── main.js ──► LevelRunner (systems/LevelRunner.js)
   (overlay HUD)    (boot)     │   state = play|won|lost|paused
                               │   castleHP, coins, wave, gameTime
                               │   dispose() = cleanup complet
                               │
        ┌──────────┬───────────┼────────────┬────────────┬──────────┐
        ▼          ▼           ▼            ▼            ▼          ▼
      Hero      Enemy[]     Tower[]      VFX           Audio      HUD (DOM)
                               │
                               │ CustomEvents sur document
                               ▼
   crowdef:wave-start  crowdef:enemy-killed  crowdef:tower-built
   crowdef:castle-hit  crowdef:level-won     crowdef:level-lost
   crowdef:hero-levelup  crowdef:perk-picked  crowdef:tower-upgraded
                               │
                               ▼
                  scripts/auto-test-crowdef.mjs (Playwright)
```

`main.js` ne fait plus que : booter renderer, charger un level, instancier le runner, faire la rAF, exposer `window.__cd`. Tout l'état vit dans le runner → restart trivial.

## Roadmap des 7 jalons

### J1 — Look pub mobile + foundation (1 session)
Refactor archi (LevelRunner, level data, dispose-clean), château HP + game-over/victoire, toon shading + outlines + camera shake + particules, audio procédural Web Audio + 9 SFX + mute, SaveSystem, Playwright harness, 1 niveau jouable. **Détails plus bas.**

### J2 — Combat vivant (1-2 sessions)
- 7 types d'ennemis : basic, runner, brute (12 HP), shielded, flyer, gros mid-boss (30 HP), boss placeholder.
- 4 types de tours : Archer, Mage (AoE 1.5), Tank (cadence rapide), Baliste (sniper perçant 2).
- Système de perks roguelite : XP par kill, level-up = pause + UI 3 cartes, ~12 perks.
- Upgrades tours 3 paliers (re-entrée dans cercle, coûts ×2 et ×4).
- Bascule assets : Quaternius rigged animés avec `THREE.AnimationMixer`.

### J3 — Monde 1 complet (1-2 sessions)
- 8 niveaux Plaine du Royaume (`world1-1.js` à `world1-8.js`).
- Mid-boss vague 5, boss du Brigand niveau 8 (charge + knockback).
- Briefings 3s, écran récap (étoiles + or).
- Étoiles : 1 = finir, 2 = château ≥ 50% HP, 3 = château ≥ 95% HP.
- Carte des mondes avec niveaux verrouillés.
- Sauvegarde progression.

### J4 — Boutique & progression méta (2 sessions, scope ambitieux)
**S4.A** : or persistant + boutique + 10+ upgrades permanentes (HP, dmg, vitesse, cadence, range hero, gain or/XP, +20¢ start, +1 perk slot, regen château, slot tour gratuit).
**S4.B** : 5+ skins Roi (textures différentes sur modèle Quaternius), 4 tours déblocables individuellement (Archer gratuit, Mage/Tank/Baliste à débloquer), achievements.

### J5 — Audio complet (1 session)
- Intégration 4 musiques Suno (lazy-loaded par monde).
- 9 SFX Kenney CC0 compressés OGG.
- Crossfade musique menu/niveau/boss.
- Mute persistant + slider volume.

### J6 — Mondes 2-3-4 + bosses (3 sessions)
**S6.A** Forêt Sombre : ennemis latéraux, chemin étroit, brume + boss Sorcier (invoque + téléporte).
**S6.B** Désert Brûlant : vagues plus grosses, plus de runners + boss Reine Scorpion (projectiles AoE + carapace + phases).
**S6.C** Volcan du Dragon : ennemis volants, sol qui chauffe + boss Dragon 3 phases (sol, vol, sol enragé, souffle de feu en cône).

### J7 — Polish & mobile (1 session)
- Endless mode (vague infinie + leaderboard local).
- Cinématiques d'intro courtes par monde.
- Polish iPad : HUD scalable, joystick généreux, perf appareil réel, InstancedMesh 200+ ennemis.
- Pause auto sur perte de focus.
- Tutoriel intégré niveau 1-1.
- Rename final.

## Détails J1 — première session

### Périmètre J1

**Livré :**
1. `CROWD_DEFENSE_PLAN.md` (ce doc).
2. Refactor archi : `LevelRunner` + level data + dispose-clean restart.
3. Château HP + écrans game-over / victoire (HTML overlay).
4. Toon shading + outlines (inverted-hull) + camera shake + pool de particules.
5. Audio procédural Web Audio + 9 SFX + bouton mute persisté.
6. `SaveSystem` minimal (`crowdef:save`) — mute pref + bestWave + lastLevel.
7. Test harness Playwright `scripts/auto-test-crowdef.mjs`.
8. 1 niveau jouable (`data/levels/world1-1.js`) — gameplay équivalent au MVP + château HP + tutorial overlay.

**Pas dans J1 :** multi-types ennemis/tours, perks, upgrades tours, Quaternius assets, mondes 2-4, bosses, boutique, skins, étoiles, endless. Le code J1 expose les points d'extension.

### Fichiers nouveaux

- `CROWD_DEFENSE_PLAN.md` (racine)
- `src-v3/data/levels/world1-1.js` — exporte `{ id, name, theme, pathPoints, slots, waves, castleHP, briefing, tutorial }`.
- `src-v3/systems/LevelRunner.js` — classe owning state, entities, listeners. `tick(dt)`, `dispose()`, `pause()`, `resume()`, `restart()`, `setSpeed(n)`. Émet CustomEvents.
- `src-v3/systems/Audio.js` — port verbatim de `src-v2/systems/Audio.js` + 9 SFX procéduraux (`sfxHeroShoot`, `sfxTowerShoot`, `sfxEnemyHit`, `sfxEnemyDie`, `sfxTowerBuilt`, `sfxWaveStart`, `sfxCastleHit`, `sfxLevelWon`, `sfxLevelLost`).
- `src-v3/systems/SaveSystem.js` — load/save sur `localStorage["crowdef:save"]`, schéma `{ version, muted, bestWave, lastLevel }`, tolérant aux JSON parse failures.
- `src-v3/systems/Particles.js` — pool de 100 sprites (texture canvas radial gradient cachée), `emit(pos, color, count)`, recyclage du plus vieux.
- `src-v3/systems/JuiceFX.js` — `cameraShake(intensity, durationMs)` qui ajoute un offset décroissant au `CAM_TARGET`.
- `src-v3/systems/ToonMaterial.js` — factory `makeToonMaterial({ color })` retournant `MeshToonMaterial` avec gradient texture 3-step cachée.
- `src-v3/systems/Outline.js` — `addOutline(mesh, scale=1.04)` qui clone la geometry, applique material noir `BackSide`.
- `src-v3/entities/Slot.js` — extrait de `main.js::updateBuilds`. Encapsule ring/fill/glow/label, `tick(dt, hero, runner)`, `dispose()`.
- `scripts/auto-test-crowdef.mjs` — Playwright harness, port 4174, asserte zéro console error, FPS ≥ 50, `enemy-killed` ≥ 5, `tower-built` ≥ 1, `level-won` dans 60s réels (240s game à 4× speed).

### Fichiers modifiés

- `src-v3/main.js` — rewrite (~150 LOC vs 425). Boote renderer/scene/camera/lights, charge `world1-1`, instancie `LevelRunner`, rAF loop avec `runner.tick(dt)` + `Particles.tick(dt)` + `JuiceFX.tick(dt)`, applique caméra follow sur `runner.hero`, expose `window.__cd = { runner, scene, camera, audio, save, setSpeed, version }`.
- `src-v3/systems/Path.js` — `buildPath(points)` accepte les points en argument (default = current 8 pour back-compat).
- `src-v3/entities/Hero.js` — swap `MeshLambertMaterial` → `makeToonMaterial`, `addOutline()` sur les meshes du body, `audio.sfxHeroShoot()` dans `_fire`, particle puff sur hit.
- `src-v3/entities/Enemy.js` — toon swap + outline. `takeDamage` → spark + `audio.sfxEnemyHit`. Death → `Particles.emit(pos, 0xc63a10, 8)` + `audio.sfxEnemyDie` + camera shake léger. Champ `damage` (default 5). `reachedEnd` → callback `runner.onCastleHit(damage)`.
- `src-v3/entities/Tower.js` — toon swap + outline. Build complete → `audio.sfxTowerBuilt` + 12-particle yellow burst.
- `src-v3/index.html` — ajoute : barre HP château (DOM, top-center), badge wave-countdown, bouton mute (top-right, persisté), overlay `#gameover`, overlay `#victory`, overlay `#tutorial`.
- `vite.kingshot.config.js` — `preview: { port: 4174, strictPort: true }` pour Playwright.
- `package.json` — script `"test:crowdef": "node scripts/auto-test-crowdef.mjs"`.
- `CROWD_DEFENSE_DESIGN.md` — append « État au commit X ».

### Patterns réutilisés (NE PAS dupliquer)

- `src-v2/systems/Audio.js` (`tone()`/`noise()` Web Audio) → port verbatim.
- `src-v2/systems/SaveSystem.js` (load/save try/catch JSON) → même approche, key `crowdef:save`.
- `scripts/auto-test-levels.mjs` (vite preview spawn, page.evaluate solver, custom events) → squelette identique.
- HUD overlay HTML pattern dans `src-v3/index.html` actuel → on étend.
- Conventions repo `CLAUDE.md` : commits atomiques en français, footer `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`, pas de console.log prod, pas de commentaires sauf non-obvious, ne pas casser `/v2/`.

### Plan de commits J1

1. `docs(v3): plan complet CROWD_DEFENSE_PLAN.md`
2. `refactor(v3): extract LevelRunner + level data structure (world1-1)` — gameplay identique au MVP
3. `feat(v3): château HP + overlays game-over/victoire`
4. `feat(v3): toon shader + inverted-hull outlines + camera shake`
5. `feat(v3): pool de particules + VFX kill/build/shoot`
6. `feat(v3): audio procédural Web Audio + 9 SFX + bouton mute persisté`
7. `feat(v3): SaveSystem (crowdef:save) + bestWave + lastLevel`
8. `test(v3): harness Playwright auto-test-crowdef.mjs`

Push groupé après chaque feature complète (3-5 commits / push).

### Défauts game-feel J1 (à ajuster après playtest)

- Château : 100 HP, 5 dmg par ennemi qui touche → ~20 ennemis non défendus = game over.
- Étoiles : 1 = finir, 2 = château ≥ 50% HP, 3 = château ≥ 95% HP.
- Camera shake : ennemi tué = 0.05 / 80ms, tour built = 0.15 / 200ms, château touché = 0.4 / 350ms.
- Pool particules : 100 sprites, recycle plus vieux. Couleurs : rouge sur kill ennemi, jaune sur build, blanc sur tir hero.
- Toon shader : gradient 3-step (sombre / mid / clair).
- Outline : scale 1.04, BackSide noir.
- Tutorial 1-line niveau 1-1 : « WASD / joystick pour bouger · entre dans un cercle jaune pour construire une tour. »

### Vérification J1

- `npm run build:kingshot` exit 0
- `npm run test:crowdef` exit 0 (zéro console error, level-won, FPS ≥ 50)
- Playtest desktop Chrome sur la GitHub Pages live
- Playtest iPad Safari (parité décision #4)
- Pas de régression sur `/v2/`

## Workflow multi-sessions (J2 → J7)

### Pourquoi pas tout en une session

Scope J2-J7 = ~9-12 sessions Claude. Impossible en une mega-session, et même si possible :
- **Dépendances externes série** : Quaternius à télécharger, Suno à générer (Mike), playtest iPad réel par jalon.
- **Feedback loop** : Mike doit jouer J1, sentir le ton, ajuster avant J2.
- **Dégradation contexte** : Opus 4.7 1M chute après ~200K tokens. 7 sessions fraîches > 1 épuisée.
- **Granularité reverts** : si J4 part en vrille, on revert 1 jalon, pas 6.

### Le contrat persistant : ce fichier

- Les 17 décisions tranchées (figées).
- La roadmap J1-J7 avec checkboxes (`- [x]` une fois livré).
- Pour chaque jalon livré : commit/PR + lien changelog.

### Rituel début de session J2+

```
cat CROWD_DEFENSE_PLAN.md
git log --oneline -30
ls src-v3/ src-v3/systems/
```

Trigger côté user : « on enchaîne J2 du plan `CROWD_DEFENSE_PLAN.md` ». Pas de re-interview — décisions figées.

### Rituel fin de session

1. `npm run test:crowdef` doit passer.
2. Nouveau `docs/changelog/J{N}-{slug}.md` : `Livré`, `Découvert`, `Pivots`, `Pour la suite`.
3. Cocher `- [x]` du jalon dans `CROWD_DEFENSE_PLAN.md` + lien changelog.

### Découpage S2-S10

| Session | Jalon | Périmètre | Bloqué par |
|---|---|---|---|
| S2 | J2 | Quaternius + 7 ennemis + 4 tours + perks + upgrades | Mike a joué J1 |
| S3 | J3 | 8 niveaux monde 1 + bosses + carte + étoiles | S2 mergée |
| S4 | J4.A | Boutique + or persistant + 10 upgrades méta | S3 mergée |
| S5 | J4.B | 5 skins + 4 tours déblocables + achievements | S4.A |
| S6 | J5 | 4 musiques Suno + 9 SFX Kenney + crossfade | Mike a livré OGG Suno |
| S7 | J6.A | Monde 2 Forêt + boss Sorcier | S5 + S6 |
| S8 | J6.B | Monde 3 Désert + boss Reine Scorpion | S7 |
| S9 | J6.C | Monde 4 Volcan + volants + boss Dragon 3 phases | S8 |
| S10 | J7 | Endless + cinématiques + polish iPad + tuto + rename | S9 |

### Garde-fous inter-sessions

- Pas de drift : revenir sur une décision = explicit dans changelog + valider avec Mike.
- Pas de régression `/v2/` : tag `pre-v3` figé sur master pour rollback.
- Tests cumulatifs : `auto-test-crowdef.mjs` reste vert sur tous les niveaux livrés à date.
- Pas de branche orpheline > 1 session.

## État des jalons

- [ ] J1 — Foundation
- [ ] J2 — Combat vivant
- [ ] J3 — Monde 1
- [ ] J4.A — Boutique + upgrades
- [ ] J4.B — Skins + tours déblocables
- [ ] J5 — Audio complet
- [ ] J6.A — Forêt Sombre
- [ ] J6.B — Désert Brûlant
- [ ] J6.C — Volcan du Dragon
- [ ] J7 — Polish & mobile
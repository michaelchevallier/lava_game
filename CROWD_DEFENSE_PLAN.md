# Plan — Milan Crowd Defense (J1 livré + roadmap J2–J7)

## Contexte

Le draft CDC initial est un brief client. Ce document est le plan d'exécution. Il intègre les 17 décisions tranchées en interview et propose un découpage en 7 jalons + une livraison J1 en première session.

État de départ : MVP Three.js commit `13d89ac`, 6 fichiers, ~850 LOC dans `src-v3/`, déployé en `/v3/` via `deploy.yml` qui build `dist-kingshot/`. Le `main.js` actuel (425 LOC) hardcode path/vagues/slots/lights inline — pas de game state, pas de château HP, pas d'audio, pas de test harness, pas de notion de niveau.

## Décisions tranchées en interview locale (2026-04-28)

| # | Sujet | Décision |
|---|---|---|
| 1 | Nom du jeu | « Milan Crowd Defense » placeholder ; rename en J7 |
| 2 | Ton | Cartoon-épique fun (couleurs saturées, kills explosifs colorés, musique légère) |
| 3 | Scope | 4 mondes × 8 niveaux = 32 niveaux + endless |
| 4 | Plateforme | iPad et desktop à **parité** |
| 5 | Mort hero | Immortel — c'est le **château qui a une barre de vie** (PvZ-style) |
| 6 | Perks in-run | **Light** — 3-5 perks max par run, level-up tous ~30 kills, 1 choix sur 3 cartes |
| 7 | Upgrade tours | **3 paliers** via re-entrée dans cercle (build → ×2 coût, +50% dmg, +20% range → ×4 coût, +100% dmg, effet spécial) |
| 8 | Endless | **Vague infinie unique + best-wave persistant**, débloqué après monde 1 |
| 9 | Coop | Différé en post-v1 (si Milan demande) |
| 10 | Assets | **Quaternius CC0 rigged dès J1** (SkinnedMesh + AnimationMixer). Mike DL depuis Patreon tier gratuit. Tour reste placeholder box-stack tonné en J1, vraie tour Quaternius/Kenney en J2. |
| 11 | Audio | **SFX procéduraux Web Audio dès J1** (port `src-v2/Audio.js`). Musique Suno en J5 (Mike génère 4 tracks). Évaluation Kenney CC0 vs Web Audio en J5. |
| 12 | Méta | **Ambitieuse** : 10+ upgrades permanents, 5+ skins, 4 tours déblocables individuellement, achievements |
| 13 | Bundle | **Pas de cap** |
| 14 | Tests auto | Playwright headless `scripts/auto-test-crowdef.mjs` (pattern adapté de `auto-test-levels.mjs` /v2/) |
| 15 | Cadence push | Push **direct sur `phaser-pivot`** (pas de PR). **Demande validation Mike avant chaque push.** |
| 16 | Reporting | Changelog markdown détaillé `docs/changelog/J{N}-slug.md` à la fin de chaque jalon |
| 17 | Boss / Volants / Cinématiques | 4 boss uniques mécaniques propres (Brigand charge, Sorcier invoque/téléporte, Reine Scorpion AoE/phases, Dragon 3 phases sol/vol/enragé). Volants → auto-aim 3D, hero les vise. Cinématiques d'intro = écran texte stylé + 1 illustration Three.js fixe (pas ASCII). |

**Autonomie Mike-validée** :
- Équilibre château HP (default 100 HP / 5 dmg) — ajustable par niveau dans JSON, rebalance après playtest.
- Choix SFX procéduraux (timbre, durée, pitch).
- Choix techniques implémentation (toon material, outline scale, perlin shake, etc.).

**À demander avant** : tout choix de game-feel non-trivial (perk effects, courbes XP, ratio coût upgrade, durée respawn boss, mécaniques précises des boss).

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
Refactor archi (LevelRunner, level data, dispose-clean), château HP + game-over/victoire, **Quaternius rigged hero/enemy** + toon shader (skinning) + outlines + AnimationMixer, camera shake + pool particules, audio procédural Web Audio + 9 SFX + mute, SaveSystem, Playwright harness, 1 niveau jouable. **Détails plus bas.**

### J2 — Combat vivant (1-2 sessions)
- **6 types d'ennemis non-volants** : basic, runner (rapide/fragile), brute (12 HP, lent), shielded (à attaquer dans le dos), gros mid-boss (30 HP), boss placeholder. **Flyer = J6.C uniquement** (Volcan).
- 4 types de tours : Archer, Mage (AoE 1.5), Tank (cadence rapide), Baliste (sniper perçant 2). Vraie tour Quaternius/Kenney remplace le placeholder J1.
- **Roguelite light** : XP par kill, level-up tous ~30 kills, pause + UI 3 cartes, **3-5 perks max par run** (~10 perks dans le pool).
- Upgrades tours 3 paliers (re-entrée dans cercle, coûts ×2 et ×4).
- Affinage assets Quaternius (animations attack/death sur tous les ennemis).

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

**Pas dans J1 :** multi-types ennemis/tours, perks, upgrades tours, mondes 2-4, bosses, boutique, skins, étoiles, endless. Le code J1 expose les points d'extension.

### Fichiers nouveaux

- `CROWD_DEFENSE_PLAN.md` (racine, déjà commité `1a9b308` — réécrit avec décisions consolidées)
- `src-v3/data/levels/world1-1.js` — exporte `{ id, name, theme, pathPoints, slots, waves, castleHP, briefing, tutorial }`.
- `src-v3/systems/LevelRunner.js` — classe owning state, entities, listeners. `tick(dt)`, `dispose()`, `pause()`, `resume()`, `restart()`, `setSpeed(n)`. Émet CustomEvents.
- `src-v3/systems/AssetLoader.js` — preload async des GLBs Quaternius via `GLTFLoader`, retourne `{ knight, skeleton, ... }`. Émet `crowdef:assets-ready`.
- `src-v3/systems/AnimationController.js` — wraps `THREE.AnimationMixer`, gère états `idle`/`walk`/`attack`/`death` avec crossfade 0.2s.
- `src-v3/systems/ToonMaterial.js` — factory `makeToonMaterial({ color, skinning })` retournant `MeshToonMaterial` (skinning OK natif) avec gradient texture 3-step cachée.
- `src-v3/systems/Outline.js` — `addOutline(skinnedMesh, scale=1.04)` clone geometry + skeleton, material noir `BackSide`. Adapté SkinnedMesh.
- `src-v3/systems/Audio.js` — port verbatim de `src-v2/systems/Audio.js` + 9 SFX procéduraux (`sfxHeroShoot`, `sfxTowerShoot`, `sfxEnemyHit`, `sfxEnemyDie`, `sfxTowerBuilt`, `sfxWaveStart`, `sfxCastleHit`, `sfxLevelWon`, `sfxLevelLost`).
- `src-v3/systems/SaveSystem.js` — load/save sur `localStorage["crowdef:save"]`, schéma `{ version, muted, bestWave, lastLevel }`, tolérant aux JSON parse failures.
- `src-v3/systems/Particles.js` — pool de 100 sprites (texture canvas radial gradient cachée), `emit(pos, color, count)`, recyclage du plus vieux.
- `src-v3/systems/JuiceFX.js` — `cameraShake(intensity, durationMs)` qui ajoute un offset décroissant au `CAM_TARGET`.
- `src-v3/entities/Slot.js` — extrait de `main.js::updateBuilds`. Encapsule ring/fill/glow/label, `tick(dt, hero, runner)`, `dispose()`.
- `src-v3/assets/quaternius/Knight.glb` — Quaternius CC0 (Mike DL Patreon).
- `src-v3/assets/quaternius/Skeleton_Minion.glb` — Quaternius CC0 (Mike DL Patreon).
- `scripts/auto-test-crowdef.mjs` — Playwright harness, port 4174, asserte zéro console error, FPS ≥ 50, `enemy-killed` ≥ 5, `tower-built` ≥ 1, `level-won` dans 60s réels (240s game à 4× speed).
- `docs/changelog/J1-foundation.md` — récap fin de jalon.

### Fichiers modifiés

- `src-v3/main.js` — rewrite (~150 LOC vs 425). Boote renderer/scene/camera/lights, charge `world1-1`, instancie `LevelRunner`, rAF loop avec `runner.tick(dt)` + `Particles.tick(dt)` + `JuiceFX.tick(dt)`, applique caméra follow sur `runner.hero`, expose `window.__cd = { runner, scene, camera, audio, save, setSpeed, version }`.
- `src-v3/systems/Path.js` — `buildPath(points)` accepte les points en argument (default = current 8 pour back-compat).
- `src-v3/entities/Hero.js` — rewrite : box-stack remplacé par GLB Knight + `AnimationController` (idle/walk/attack). Toon material + outline sur SkinnedMesh. `audio.sfxHeroShoot()` dans `_fire`. Pas de death (immortel).
- `src-v3/entities/Enemy.js` — rewrite : box-stack remplacé par GLB Skeleton + AnimationController. `takeDamage` → spark + `audio.sfxEnemyHit`. Death → anim death 0.5s + `Particles.emit(pos, 0xc63a10, 8)` + `audio.sfxEnemyDie` + shake léger. Champ `damage` (default 5). `reachedEnd` → callback `runner.onCastleHit(damage)`.
- `src-v3/entities/Tower.js` — placeholder J1 : box-stack tonné stylé (toon + outline sur le head pivotant). Pas de Quaternius en J1, vraie tour en J2. Build complete → `audio.sfxTowerBuilt` + 12-particle yellow burst.
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

1. `docs(v3): plan complet CROWD_DEFENSE_PLAN.md` ✅ déjà commité (`1a9b308`)
1.5. `docs(v3): consolide les 17 décisions validées en interview locale`
2. `refactor(v3): extract LevelRunner + level data structure (world1-1)` — gameplay identique au MVP
3. `feat(v3): château HP + overlays game-over/victoire`
4. `feat(v3): Quaternius rigged hero/enemy + toon material + outlines + AnimationMixer`
5. `feat(v3): pool de particules + camera shake + VFX kill/build/shoot/castle-hit`
6. `feat(v3): audio procédural Web Audio + 9 SFX + bouton mute persisté`
7. `feat(v3): SaveSystem (crowdef:save) + bestWave + lastLevel`
8. `test(v3): harness Playwright auto-test-crowdef.mjs`
9. `docs(v3): changelog J1-foundation + check jalon`

Push **direct sur `phaser-pivot`** après validation Mike. Pas de PR.

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

- [x] J1 — Foundation ([changelog](docs/changelog/J1-foundation.md))
- [x] J2 — Combat vivant ([changelog](docs/changelog/J2-combat-vivant.md))
- [x] J3 — Monde 1 ([changelog](docs/changelog/J3-monde-1.md))
- [x] J4.A — Boutique + upgrades ([changelog](docs/changelog/J4A-boutique.md))
- [ ] J4.B — Skins + tours déblocables
- [ ] J5 — Audio complet
- [ ] J6.A — Forêt Sombre
- [ ] J6.B — Désert Brûlant
- [ ] J6.C — Volcan du Dragon
- [ ] J7 — Polish & mobile
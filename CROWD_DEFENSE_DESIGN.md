# Crowd Defense — Design Reference

Titre projet : **Milan Crowd Defense** (working title, à renommer)
Localisation code : `src-v3/`
Build : `npm run build:kingshot` → `dist-kingshot/` → déployé en `/v3/`
Live : https://michaelchevallier.github.io/lava_game/v3/

---

## 1. Genre & inspiration

**Crowd Defense top-down 3D**, dans la lignée des **fake-game ads mobiles** :
- **Kingshot** (référence directe — pubs YouTube/Reels)
- Top War, Hero Wars, Castle Crush, Whiteout Survival (toutes les pubs MMO mobile qui ne ressemblent pas au vrai jeu)
- Cousin lointain : **Plants vs Zombies** (logique tower defense, économie, vagues), mais avec :
  - Vue top-down 3/4 au lieu de side-scroll
  - **Un seul chemin sinueux** au lieu de 5 lanes
  - **Héros contrôlable** au centre (vs PvZ qui est statique)
  - **Tours construites par proximité** (vs grid placement par clic)

**Cible** : Milan (~8 ans). Doit être lisible, satisfaisant, avec hooks visuels (crowd density, kills explosifs).

---

## 2. Core loop (60 secondes)

```
Spawn ennemis rouges en file sur le chemin
   ↓
Hero auto-tire + tu déplaces le hero pour bonus angle
   ↓
Kills → +or
   ↓
Hero rentre dans un cercle jaune → l'or coule → tour se construit
   ↓
Tours auto-tirent → plus de DPS → plus de kills
   ↓
Vague suivante (+25% ennemis, +vitesse)
   ↓
Loop, escalade jusqu'à mini-boss / fin de niveau
```

---

## 3. Player verbs

| Verbe | Comment | Pourquoi |
|---|---|---|
| **Bouger** | WASD / flèches / joystick virtuel mobile | Repositionner le hero pour mieux tirer / entrer dans un cercle |
| **Auto-attack** | Pas d'input (auto-aim) | Garder la mécanique simple PvZ-faithful |
| **Construire** | Rester dans un cercle jaune | L'or coule pendant que tu restes → la tour se monte |
| **Upgrade** *(à venir)* | Re-rentrer dans un cercle de tour déjà built | Cost ×2, dmg +50%, range +20% |
| **Roi déplacement stratégique** | Trade-off : si tu construis, tu ne tires pas où tu serais utile | Tension qui rend le mouvement intéressant |

---

## 4. Mécaniques détaillées

### 4.1 Hero (le « Roi »)

| Param | Valeur | Note |
|---|---|---|
| HP | ∞ (immortel pour MVP) | Plus tard : peut prendre damage si ennemi le touche |
| Move speed | 6 unit/s | Joystick + clavier merge-additif |
| Range | 12 unit | Auto-aim sur ennemi le plus proche |
| Fire rate | 350 ms | Projectile sphère blanche |
| Damage | 1 | One-shot un basic |
| Bounds | ±14 X, ±9 Z | Clamp pour pas sortir du terrain |
| Walk-bob | sin(t × 12) × 0.08 | Subtle ; arrête quand idle |

**Visuel** : box body bleu + box head + cape rouge + ring cyan au sol (locator).

### 4.2 Tower slots (proximity-build)

| Param | Valeur | Note |
|---|---|---|
| Radius | 1.6 unit | Hero distance au centre du slot |
| Drain rate | 30¢/sec | Quand hero est dedans |
| Costs | 30 / 50 / 75 ¢ | 3 slots disponibles MVP |
| Position | t = 0.28 / 0.50 / 0.72 sur path | + offset latéral 2.4 |
| Visual | Ring jaune + arc fill vert + glow pulse | Label coût restant en sprite |

**Comportement** :
- Hero entre dans cercle → coins drainés (min(coins, 30 × dt))
- `slot.paid` accumule, fill arc grandit (CircleGeometry partiel)
- Quand `paid >= cost` → spawn `Tower` à la position du slot, dispose du ring/fill/label
- Si hero sort avant fin → `paid` reste figé (pas de decay MVP)

**Decay (différé)** : si hero pas dans cercle 5s → `paid -= 5/sec`.

### 4.3 Tours

| Type | Range | Fire rate | Damage | Coût | Note |
|---|---|---|---|---|---|
| Archer (default MVP) | 8 | 700 ms | 1 | 30 / 50 / 75 | Box pivot tête, projectile flèche |
| Mage *(à venir)* | 6 | 1200 ms | 3 | 60 | AOE 1.5 radius |
| Tank *(à venir)* | 4 | 200 ms | 0.5 | 40 | Slow attack rapide |
| Ballista *(à venir)* | 14 | 1500 ms | 5 | 100 | Sniper, perce 2 ennemis |

### 4.4 Ennemis

| Type | HP | Speed | Reward | Note |
|---|---|---|---|---|
| Basic (rouge) | 3 | 1.2 unit/s | +2¢ | MVP only |
| Brawler *(à venir)* | 6 | 1.0 | +3¢ | Plus tank |
| Runner *(à venir)* | 1 | 2.4 | +2¢ | Rush sprint |
| Shielded *(à venir)* | 2 + 4 shield front | 1.0 | +5¢ | Doit être attaqué de derrière |
| Brute *(à venir)* | 12 | 0.8 | +10¢ | Mid-boss en fin de wave |
| Boss *(à venir)* | 50+ | 0.6 | +50¢ | Vague finale |

**Behavior MVP** : suit le path Catmull-Rom à `t += SPEED × dt / pathLength`, walk-bob, HP bar visible après 1er hit.

### 4.5 Path

Catmull-Rom 8 waypoints, sinueux, du spawn (gauche) au château (droite).
Rendu en **ribbon de terre marron** (2 triangles par segment, 120 samples).
**Différé** : multi-paths, embranchements, paths qui se détruisent.

### 4.6 Économie

- **Start coins** : 100¢
- **Kill basic** : +2¢
- **Income passif** *(à venir)* : +1¢/sec (production de base)
- **Bonus de fin de wave** *(à venir)* : +20¢ × wave#
- **Tower drain** : 30¢/sec quand hero dans slot

### 4.7 Vagues

| Param | MVP | Note |
|---|---|---|
| Vague 1 | 25 ennemis basic | spawn rate 600ms |
| Wave-up | +25% ennemis, -40ms spawn rate | Min spawn rate 200ms |
| Break | 4s entre vagues | UI visible |
| Final boss *(à venir)* | Vague 10 — 1 boss + 30 brawlers | |

---

## 5. Maps / niveaux (à designer)

**MVP** : 1 map (forêt verte, château bleu).

**Niveaux à designer** :
1. Plaine verte (tutoriel)
2. Forêt sombre (path serré entre arbres)
3. Désert (aucun arbre, dunes)
4. Crypte (sols dalles, plus de basics + premiers shielded)
5. Volcan (lave + flying enemies)
6. Glacier (slow ennemis, hero glisse)
7. Cité fortifiée (multi-paths)
8. Boss final : siège dragon

**Progression par map** :
- 8-12 vagues
- 1 mini-boss vague 5
- 1 boss vague finale
- 3 étoiles : finir, perdre 0 château HP, finir <X minutes

---

## 6. Visual style cible

**Inspirations directes** : screenshots Kingshot, Top War, Hero Wars
- **Low-poly stylisé** pas pixel art
- **Toon shading** soft (key light + fill HemisphereLight, pas de PBR lourd)
- **Couleurs saturées** (vert herbe vif, rouge ennemis, bleu héros, jaune slots)
- **Outlines** doux (post-process EdgeDetect ou rim light)
- **Ombres douces** PCFSoftShadowMap
- **Camera shake** sur hits / morts / boss spawn
- **Particles** : sparks au hit, dust à la mort, smoke quand tour tire

**Assets recommandés** *(CC0, free)* :
- **Quaternius Ultimate Modular Characters** — humans, zombies, knights animés rigged (https://quaternius.com)
- **Quaternius Ultimate Stylized Nature** — trees, rocks, terrain props
- **Kenney Tower Defense Kit** (déjà dans le repo) — tours, decorations
- **Synty Polygon Adventure** *(payant ~$30)* — qualité publicité mobile

**Bundle target** : <500 KB gz total (Three.js + assets + code).

---

## 7. Audio

**Tout différé pour MVP** mais à prévoir :
- Musique : 1 track par map, 60-90s loop, style médiéval épique léger
- SFX :
  - Tir hero (whoosh court)
  - Tir tour (twang archer)
  - Hit ennemi (thud doux)
  - Mort ennemi (poof)
  - Tour built (chime montant)
  - Wave start (drum hit)
  - Mort hero (game over sting)
  - Coin pickup (ding)

Source : générer procéduralement (Web Audio comme `src-v2/systems/Audio.js`) OU Kenney UI Audio + Game Audio packs (CC0).

---

## 8. Progression / meta

**Différé pour MVP** :
- **Gold persistant** entre niveaux (boutique upgrades hero permanents)
- **Hero levels** : XP par kill, niveau hero permanent (HP, dmg, speed)
- **Tower upgrades permanents** dans une boutique meta
- **Skins** hero (3-5 cosmétiques)
- **Achievement** (10 niveaux finis, 1000 kills, etc.)

**Save** : réutiliser `src-v2/systems/SaveSystem.js` ou créer `localStorage["crowdef:save"]`.

---

## 9. PvZ-derived patterns (à garder ou adapter)

Le repo a déjà fait pivoter de KAPLAY → Phaser PvZ-like dans `src-v2/`. Patterns qui transfèrent :

| Pattern PvZ | Transfert Crowd Defense |
|---|---|
| **Lawnmower 1-shot/lane** | → Hero immortel (équivalent : un filet de sécurité) |
| **Wave gating** (alive ≤ 2 + 6s gap) | → Identique : pause entre vagues, force advance après 25s |
| **First wave ≤ 12s** | → Idem (pas trop d'attente initiale) |
| **Eating mechanic** (zombies bouffent les tiles) | → Adapté : ennemis attaquent les tours en passant ? À designer |
| **3⭐ = 0 escape** | → 3⭐ = château HP intact, 2⭐ = ≤20% HP perdu |
| **Sun economy progressive** | → Tower-built slots qui revealed progressivement par wave |
| **Particle pool 200 cap** | → InstancedMesh pour ennemis, max 300 actifs |

---

## 10. Tech stack

```
src-v3/
├── index.html              HUD overlay HTML + canvas + joystick
├── main.js                 Scene setup, lights, camera, loop, builds
├── systems/
│   └── Path.js             Catmull-Rom + ribbon mesh
└── entities/
    ├── Hero.js             Movement, auto-aim, projectiles
    ├── Enemy.js            Path-following, HP bar
    └── Tower.js            Auto-aim, projectiles

vite.kingshot.config.js     root: src-v3/, outDir: dist-kingshot/
package.json scripts:
  dev:kingshot      vite --config vite.kingshot.config.js
  build:kingshot    vite build --config vite.kingshot.config.js
  preview:kingshot
```

**Three.js** ^0.180, **Vite** ^6, JS vanilla ESM.

**Bundle actuel** : 119 KB gz Three.js + 5 KB game.

---

## 11. État au commit `13d89ac` (2026-04-28)

✅ Implementé :
- Caméra top-down 3/4 fixe avec lerp-follow du hero
- Hero box-stack + cape + WASD/joystick + auto-aim + projectiles
- Path Catmull-Rom + ribbon terre + château bleu
- Ennemis rouges box-stack avec HP bar
- 3 slots de tour avec proximity-build (drain 30¢/sec)
- Vagues exponentielles (25 → +25%/wave)
- HUD HTML overlay (titre + wave + coins + footer)
- Lights, shadows, fog, trees déco
- Deploy CI → `/v3/`

❌ Pas implémenté (= roadmap pour next Claude) :
- Vrais assets 3D (Quaternius / Synty)
- Animations (walk, attack, idle, death)
- Multi-types ennemis et tours
- Multi-niveaux / maps
- Boss
- Audio
- Camera shake / particles / VFX
- Économie passive + bonus wave
- Hero peut mourir + château HP
- Save / progression meta
- Toon shader / outlines
- Crowd density (InstancedMesh pour 200+ ennemis)
- Decay des slots non-finis
- Upgrade tours

---

## 12. Constraints / non-goals

- **Pas de Phaser** dans v3 — c'est du pur Three.js, mental model différent
- **Pas de TypeScript** — JS vanilla pour cohérence avec le repo
- **Pas de backend** — 100% client, save en localStorage
- **Pas de monétisation** — c'est un cadeau pour Milan
- **Bundle <800 KB gz** — on veut que ça load en <2s sur 4G
- **60 FPS** sur desktop et mobile mid-range
- **Mobile-first** — les contrôles tactiles doivent être lisibles
- **CC0 / Apache assets uniquement** sauf si Mike achète Synty

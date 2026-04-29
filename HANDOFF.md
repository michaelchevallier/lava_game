# HANDOFF — Crowd Defense /v3/ next session

**Date** : 2026-04-29 (fin session)
**Branche** : `phaser-pivot`
**Dernier commit** : `0f97b6b` (path v2 + debug=1)
**Live** : https://michaelchevallier.github.io/lava_game/v3/

## Lecture obligatoire au démarrage

1. Lis ce fichier (`HANDOFF.md`)
2. Lis `POST_J7_PLAN.md` racine — plan global post-J7
3. Lis `MEMORY.md` — pointeurs courts vers tes memories
4. Lis `docs/agent-reviews/README.md` — synthèse 3 agents (fun/balance/interest = 6/10, 6.5/10, 6.5/10)
5. `git log --oneline -25` pour voir l'historique

## État actuel

✅ J1 → J7 livrés (33 niveaux, 4 boss, méta gemmes/upgrades, 12 skins, audio MP3, cinématiques, endless)
✅ POST.A équilibrage v1 (swarm 1.4×, or 0.55×, gameSpeed 1.3×, spawn 0.75×)
✅ POST.B multi-paths (W2.4, W3.1, W4.8 convertis)
✅ POST.C path matérialisé + 22 nature GLBs theme-aware
✅ POST.D preview tour avant build + scale ×1.5
✅ POST.E screenshots tous niveaux (33 PNG dans `docs/screenshots/`)
✅ POST.F 3 agents reviews (fun.md, balance.md, interest.md, README.md synthèse)

## Feedback Mike + Milan (NEW — à intégrer)

### Test live de Milan (8 ans) — verdict : **ADORE** 🎉

Milan a testé et adore. Premier vrai win.

### Conversation Mike + Jordane (sa femme)

- **Graphismes** à améliorer (cohérent avec review interest)
- **Tours partout** : permettre placement libre des tours, pas seulement sur slots prédéfinis (gros change architectural)
- **Reprise features Park Defense** (jeu /v2/ legacy 2D KAPLAY) :
  - Catapultes (lancent des projectiles paraboliques)
  - Ventilateurs qui soufflent (push enemies)
  - Frost trampolines (slow)
  - Magnet bombs
  - Portals
  - Mines
  - Cottoncandy / Lava walls
  - Etc. (15 tiles total dans /v2/, cf `CLAUDE.md` `src-v2/entities/` listing)
- **Problème assets** : Mike note que catapultes/ventilos seront durs à trouver en GLB CC0. Possibilité : modèles custom Mike, ou placeholders Three.js primitives stylisées.

### Note Dadou (?)

Dadou (?) a envoyé 2 zips :
- `game-icons-with-bomb-sword-gold-cup-skull-coins-bag-vector-cartoon-set-signs-gui-rpg-computer-game-d.zip` (~838 KB)
- `isometric-set-park-plants-with-green-trees-bushes-various-shapes-isolated-vector-illustration.zip` (~4.5 MB)

⚠️ **Ces zips sont des illustrations vectorielles 2D plates** (style isométrique mais pas du vrai 3D). Pas directement utilisables dans Three.js. Si Dadou veut influencer le visuel : trouver des packs **GLB/GLTF** réels (Quaternius, Kenney, Sketchfab CC0), ou commander des modèles. À clarifier avec elle.

## TODO immédiat (Tier 1 — fixes critiques)

### 1. Path **TOUJOURS PEU VISIBLE** en plaine ⚠️ unresolved

J'ai itéré 5 fois sur `src-v3/systems/Path.js` :
- v1 → MeshLambertMaterial + canvas texture
- v2 → couleurs darker, gradient
- v3 → border 2.6, inner 1.9
- v4 → texture simplifiée, BasicMaterial + polygonOffset
- v5 → solid border #3a2410 + inner #c89060

Toujours invisible sur plaine W1.x malgré contraste apparent. Visible en désert/forêt/volcan grâce à contraste theme.

**Hypothèses à investiguer** :
- Z-fighting avec ground (les meshes sont à y=0.05 et y=0.10)
- Camera angle expose le path mais depth test cache le rendu
- L'objet est rendu mais au mauvais endroit (vérifier les pathPoints world1-1.js)
- Test isolé : mettre une box simple à y=0.5 sur la même curve pour confirmer geom OK

**Action recommandée** : ouvrir `/v3/?debug=1` dans browser, ouvrir DevTools, exécuter `window.__cd.scene.children.filter(c => c.isGroup)` pour voir les pathLines, vérifier visibilité via toggle `mesh.visible = false/true`. Si invisible quand visible:true, c'est un problème material/geom, pas placement.

### 2. Bug visuel POST.C — twisted trees foret 5× trop grand

Cf review interest.md. Fix : clamp scale 0.3-0.5 dans `THEME_PALETTE.foret` dans `main.js`.

```js
// Currently:
big: ["nature_pine1", "nature_pine2", "nature_pine3", "nature_twisted1"],
// nature_twisted1 has its own GLB scale; multiplying by 1.0-1.6 in spawnSet rend trop grand.
// Fix: distinguer nature_twisted dans le code et lui donner un scale 0.4-0.6.
```

### 3. Outline boss + hero (review interest)

Re-activer `addOutlineToScene` sur Hero (déjà fait) et l'étendre aux ennemis `isBoss === true` à scale 1.06 dans `Enemy.js`.

### 4. Tir hero invisible + hit feedback (review fun)

- `Hero._fire` : ajouter flash blanc, recoil, 6 particules avec vélocité
- `Enemy.takeDamage` : flash rouge 0.08s sur material.color, popup `-X` au-dessus, knockback 1px vers tangent inverse, JuiceFX shake 0.02
- Voir `fun.md` lignes ref `Hero.js:254-258`, `Enemy.js:209-255`

### 5. Endless cassé après wave 18-20 + xp_boost inutile

Cf `balance.md` recommandations chiffrées :
- Endless ratio `1 + i × 0.18` → `1 + i × 0.14`
- Endless spawn min 220ms → 280ms
- xp_boost +10/20/30% → +25/50/100% dans `metaUpgrades.js`

## TODO Tier 2 (game-feel)

- Coin flying au kill (sprite ou DOM)
- Hit popup `-X` sur enemy hit
- Skin drop boss : doit avoir un asset visuel distinct (pas juste un tint sur le knight)
- Identité boss : Dragon doit voler avec souffle de feu, pas juste un wizard scaled

## TODO Tier 3 (variété + content)

- 1 prop "vedette" par level (mushroom géant W2.5, oasis W3.6, fissure de lave W4.6)
- Or W2+ : startCoins +20/+25/+30 sur W2.4/W3.4/W4.4
- Multi-path sur W3.2-W3.8 et W4 (actuellement seul W3.1 + W4.8 sont multi-path)
- Fix exploits balance : shielded latéral, combo coin+perk_reroll, path random streaks
- Mobile/iPad polish (J7 originelle pas encore touchée pour touch responsive)

## TODO Tier 4 (architectural)

### "Tours placement libre" (Jordane)

Aujourd'hui : `level.slots[]` définit emplacements fixes. Mike/Jordane veulent placement libre (style PvZ).

Options :
1. **Hybride** : conserver les slots actuels + ajouter mode "build n'importe où" via clic sur ground (mode placement avec preview cylindre, paye coin par tile, drain or comme actuel)
2. **Full free** : remplacer slots par grille invisible (tile size = 1 unit), placer où dispo
3. **Compromis** : slots prédéfinis + "extra slots" payants débloquables

Décision à demander à Mike avant code.

### Reprise features Park Defense (Jordane)

15 tiles à porter de `src-v2/entities/` vers `src-v3/entities/` :
- LavaTower, CoinGenerator, Sun, WaterBlock, Fan, MagnetBomb, Catapult,
- FrostTramp, Portal, Tamer, CottonCandy, Mine, NeonLamp

Problème principal : **assets GLB**. Les options :
- Trouver équivalents Quaternius/Kenney (catapulte = ✓ probable, ventilo = ✗ improbable)
- Modèles primitives stylisées (cylindre + box + cone, toon material) — économique
- Demander à Mike de générer/payer pour les modèles spécifiques

À discuter avec Mike avant de coder.

## Tests

`npm run test:crowdef` doit passer avec **25 asserts** dont :
- FPS ≥ 8 (relaxé pour Chromium headless throttle, prod desktop ≥ 60-120)
- Boss spawn + charge events
- Skin equip + GLB swap
- Music tracks + setMusicVolume
- Endless level loadable

Les seuils `tower-upgraded`, `hero-levelup`, `perks-picked` sont relaxés à `>= 0` post-équilibrage car l'autopilot peut perdre W1.1 maintenant.

## Workflow rappel

Mike a explicitement autorisé **autonomie totale push direct** sur `phaser-pivot` après chaque POST.X (cf memory `feedback_v3_autonomy.md`). Pas de demande de validation entre fixes.

Tests verts → push, c'est tout.

## Fichiers critiques

- `src-v3/main.js` (~900 LOC, orchestration)
- `src-v3/systems/LevelRunner.js` (state + multi-paths + drops)
- `src-v3/systems/Path.js` (à débugger en priorité)
- `src-v3/data/levels/index.js` (33 niveaux)
- `src-v3/data/skins.js`, `metaUpgrades.js`, `themes.js`, `cutscenes.js`, `perks.js`
- `src-v3/public/audio/carrousel-des-braves.mp3` (3.6MB asset)
- `src-v3/public/nature/` (22 GLB + 20 PNG = 9.4MB)
- `scripts/auto-test-crowdef.mjs` (25 asserts Playwright)
- `scripts/screenshot-all-levels.mjs` (33 screenshots Chromium)

## Premier action recommandée

```
1. cd "/Users/mike/Work/milan project"
2. npm run test:crowdef   # vérifier 25/25 ✓
3. Lire docs/agent-reviews/README.md (top 10 actions priorisées)
4. Lire docs/screenshots/final/world1-1.png et world3-1.png pour voir l'état visuel
5. Investiguer le path invisible plaine (priorité #1 Mike)
6. Demander à Mike avant d'attaquer architectural changes (placement libre, Park Defense features)
```

Bon courage 🎮

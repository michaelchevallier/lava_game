# Milan Lava Park — Instructions Claude

## Projet

Jeu 2D "Fête Foraine en Lave" pour Milan. KAPLAY + Vite + JS vanilla, 100% client-side.
Live : https://michaelchevallier.github.io/lava_game/
Repo : https://github.com/michaelchevallier/lava_game

**Stack immuable** — ne pas migrer vers Godot ou autre moteur. Question posée 3 fois, refusée 3 fois (Godot bundle = 100× plus gros).

## Architecture

```
src/
  main.js         (~1700 lignes) — scene setup, game loop, players, HUD draw
  constants.js    (~70 lignes)   — TILE, WIDTH, WAGON_THEMES, TOOLBAR_ORDER
  audio.js        (~85 lignes)   — Web Audio procedural (jump/coin/transform...)
  sprites.js      (~410 lignes)  — PALETTE + SPR_* + loadAllSprites(k)
  serializer.js   (~95 lignes)   — loadSave/persistSave + export/import code btoa
  tiles.js        (~410 lignes)  — createTileSystem({k,...}) → placeTile, checkCoinResonance
  wagons.js       (~770 lignes)  — createWagonSystem({k,...}) → spawnWagon, transform, revive, board
public/
  sw.js           — Service Worker network-first
  manifest.json   — PWA
.github/workflows/deploy.yml — CI auto-deploy to GitHub Pages
```

**Règle taille** : `> 1500 lignes` dans un fichier = bloquant, refactorer avant feature.

## Conventions

- **Commits atomiques** : `feat:` `fix:` `refactor:` `chore:` `build:` `perf:` `style:` `docs:`. Un commit = une chose.
- **Pas de commentaires** sauf si WHY non-obvious (KAPLAY workaround, invariant subtil).
- **Pas de `console.log`** en prod. Debug exposés via `window.__k` et `window.__getStats()`.
- **Performance** : MAX_WAGONS=3, particules capées 300, dedupé via `k.onUpdate(tag)` global.

## ⚠️ Pièges KAPLAY (catalogue de douleurs)

- **`frame`/`animFrame`** propriétés custom = collision avec sprite component → `Duplicate component property` error
- **`obj.use(k.sprite("name"))`** crash → utiliser `obj.sprite = "name"` directement
- **`[...]` ou `\`** dans `drawText` = parse error styled tags → utiliser `(...)` et éviter backslash
- **`k.fixed()`** sur overlay fullscreen = WebGL feedback loop → ne pas faire
- **`const WAGON_THEMES`** dans scene callback = TDZ si lu par fonction appelée tôt → mettre au module level
- **Touches D et L** = conflit Mario right + Pika right → INTERDITES comme shortcuts globaux
- **`letterbox: true`** + viewport != ratio jeu = canvas redimensionné au viewport, perf killer
- **160 static bodies** (ground tiles individuels) = collision O(N×M) à 60fps = 4 FPS. **TOUJOURS** un seul gros collider invisible pour le sol, visuels séparés
- **`k.get("*")`** = full scene tree iteration, à utiliser parcimonieusement (pas par frame)

## Performance cibles

- Bundle prod : < 100 KB gzippé (actuel ~85 KB)
- 60 FPS sur laptop 2015 / Mac Retina (rendu 1280×576 interne, CSS upscale)
- < 5 MB RAM client
- Loading < 1s sur 4G
- Zéro requête runtime (tout inline / data URL)

## Workflow session

1. Lire ce fichier
2. `git log --oneline | head -10` pour voir l'état
3. `wc -l src/*.js` — si main.js > 1500 lignes, refactorer
4. **Déléguer aux agents** : `.claude/agents/*.md` définit `spec-writer` (opus) + `feature-dev` / `perf-auditor` / `qa-tester` (sonnet)
5. Pattern : opus écrit le spec → sonnet exécutent en parallèle → on commit/push → CI redeploy automatique

## Tester perf en live

```js
// Via Chrome MCP ou DevTools console sur https://michaelchevallier.github.io/lava_game/
window.__getStats()  // entity counts par tag
window.__k.get("*").length  // total entities
```

Profile FPS :
```js
let f=0, s=performance.now();
const tick = () => { f++; if(performance.now()-s<2000) requestAnimationFrame(tick); else console.log('FPS', Math.round(f/2)); };
requestAnimationFrame(tick);
```

## Backlog (cocher quand fait)

### Polish
- [x] Physique transition rail horizontal ↔ diagonal (lissage Y, rotation visuelle)
- [x] Règles de passage tile/entité
- [x] Lisibilité textes (drawTextOutlined 8 offsets)
- [x] Players.js extraction
- [x] Hud.js extraction
- [x] main.js < 1200 lignes (actuel 1090 — particle-systems.js extrait, 94b1f1c)
- [x] wagons.js < 1300 lignes (actuel 1079 — wagon-collisions.js extrait, e1c820d)

### Bugs perf / GC (à fix)
- [x] **GC trop agressif côté gauche** (fix fb64c4a) — left cull at -0.3×WIDTH
- [x] **Wagons despawn prématuré** (fix fb64c4a) — 30% viewport buffer

### Features parc d'attractions
- [x] Grande Roue 3x3
- [x] Pêche aux Canards
- [x] Bullet-Time Combo
- [x] Manège Magnétique (Téléport Magnétique combo)
- [x] Carnet des Spectres (24 collectibles bitmask, all unlocks wired)
- [x] Roue de fortune (combo c821926)
- [x] Pluie de pièces aléatoire (weather.js)
- [x] Mini-jeu chamboule-tout (combo c821926)
- [x] Maison Hantée (combo 0a82c1c)
- [x] Tunnel de l'Amour Maudit (5028227)
- [x] Course de Wagons 2P (F2)

### Tiles → sprites pré-rendus (perf)
- [x] Rail Loop (1 sprite au lieu de 90 entités)
- [x] Magnet, Trampoline (964f472)
- [x] Bridge, Wheel (9e7b890)
- [x] Ice, Portal, Tunnel (09f9ffb)
- [x] Fan (déjà 1 sprite)

### Sprites personnages (20×30) — tous upgradés
- [x] Mario, Luigi, Toad (vue de profil — e31cf54)
- [x] Pika (fe4f4e7)
- [x] Sonic, Link, Pacman, Kirby (1cea9db)
- [x] Yoshi, Bowser, Pokeball, Tetris, Invader (e9a9eac)
- [x] DK, Mega, Samus, Crash, Steve, Chief, Astro via substituteSprite (02b131d)
- [x] Skeleton variants par avatar (16 sprites 20×30 via substituteSprite, cb2f07b)

### Ambient / Décor
- [x] Gares ENTREE/SORTIE aux bords du monde (9bca3ca/47c3e2e)
- [x] Diversité visiteurs (scale variation 0.85-1.15 — c84d89c)
- [x] Ballons flottants ambient toutes 45-70s (f1cc008)
- [x] Parade Lave QTE (combo Surfeur 5x = +200pts, 8acc407)
- [x] Réparation Express (rail cassée, streak 5 = MAINTENANCE PRO bonus vitesse 90s, cd59add)
- [x] Aire Tir Mobile (extension skull-stand, cycle 30s crânes/canards, JACKPOT +300, afc4d36)
- [x] Boss Goret (spawn 4min, 3 pièces pour vaincre, drop portal+trampoline, 5ae35ea/bf5b8a1)
- [x] Labyrinthe (2 niveaux campagne 7-4 + 7-5 Dédale final, f68c206)

### Round 4 (en cours)
- [x] Tempête Magnétique (weather.js 4e type, x2 score + overlay violet + aimants flottants, 8ede731)
- [x] **Camera follow** — le monde est désormais 2× plus large visible (befa2eb, sandbox/run)
- [x] **Combo system data-driven** — 14 combos registre + Codex Alchimie Musée + bitmask persist (P1.1, 9e4a10b/2bd62df/359aa3f)
- [ ] Saison hiver (neige, ice partout, visuel hiver permanent optionnel)
- [ ] Course de visiteurs bonus event (visiteurs racing droite→gauche, catchable)
- [ ] Mode coopératif objectifs 2P (points communs, no-skele zone)
- [x] Mini-map HUD (overview monde position player + wagons + stations + viewport, restaurée après rollback MCP-artifact)
- [ ] Zones thématiques (col -40..0 = glacier, 0..40 = normal, 40..80 = volcan) via skin tiles par range

### UX
- [x] Volume slider + vitesse wagons slider dans settings
- [x] Splash screen sélection nb joueurs avec preview persos
- [x] Tutoriel interactif (flèches animées)
- [x] Achievements visuels (badges popup zoom-bounce)
- [x] Tips rotation HUD bottom
- [x] Score ticker animé
- [x] Progress bar palier suivant

## Done (référence)

- ✅ 1-2 joueurs sur 1 clavier (Mario QSDE/AZ/Space/E, Pika JLI/O). Luigi/Toad dispos comme avatars via picker.
- ✅ Mobile touch controls (4 boutons overlay, ?mobile=1 override)
- ✅ Tiles : lava, water, rail, rail_up/down, coin, boost, trampoline, fan, portal, ice, magnet, bridge, erase
- ✅ Mécaniques émergentes : auto-tamponneuses, Dette Fantôme, Chaîne d'Or 3 pièces diag, vapeur eau+lave, Téléport Magnétique, Pluie d'Or
- ✅ APOCALYPSE combo x5 cascade transforms + Crowd cheer "BRAVO!"
- ✅ Train Fantôme noir +100pts toutes 45s
- ✅ Inverse Apocalypse Train anti-AFK 20s, +500pts kill
- ✅ Wagon doré 7% spawn, 2x points
- ✅ Cog settings + Mode Démo récursif (portails fin → début airborne)
- ✅ Export/Import parc par code (modal HTML)
- ✅ Service Worker v4 network-first + auto-update reload
- ✅ Fix perf monumentale : 160 ground bodies → 1 collider unique (4 → 71 FPS)
- ✅ Ambiance jour : soleil souriant, nuages parallax
- ✅ Ambiance nuit : lune, étoiles, lucioles, étoiles filantes
- ✅ Visuels tile : trampoline pulse, bridge danger, lava bubbles, coin spin/bob/sparkle

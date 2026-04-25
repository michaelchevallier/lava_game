# Park Defense — Instructions Claude

## Projet

Jeu 2D Tower Defense « Park Defense — Foire en Lave » pour Milan. **Phaser 4 + Vite + JS vanilla**, 100% client-side, inspiré Plants vs Zombies.
Live legacy KAPLAY (archivé) : https://michaelchevallier.github.io/lava_game/ (branche `main` jusqu'à Sprint 12)
Live nouveau (à venir) : URL Pages après bascule prod
Repo : https://github.com/michaelchevallier/lava_game
Branche dev active : `phaser-pivot`

## Pivot du 2026-04-26

L'ancien jeu KAPLAY (sandbox tile-placement + 14 combos cachés + 5 weather + course visiteurs) a été remplacé par un vrai Tower Defense campagne-driven. Le pivot a été décidé après diagnostic (« le jeu manque plus d'objectifs que de mécaniques », sprites pas beaux, libs présentation OK à changer).

- **Snapshot KAPLAY pré-pivot** : tag `v1.0-kaplay-final` (commit `9ea6db3`). Restaurer via `git checkout v1.0-kaplay-final`.
- **Plan complet du pivot** : `/Users/mike/.claude/plans/travaille-sur-va-dans-radiant-spindle.md`
- **Branche actuelle** : `phaser-pivot`. À mergrer dans `main` au Sprint 12.

## Le jeu

5 lanes horizontales, visiteurs (= zombies PvZ) entrent par la droite et marchent vers la gauche pour atteindre la sortie. Le joueur place des **tiles défensives** (= plants) dans les cellules vides pour les transformer en squelettes / ralentir / repousser. Économie en pièces. Niveau gagné si tous les visiteurs sont éliminés ; perdu si trop atteignent la sortie.

**30 niveaux campagne** prévus (5 mondes × 6 niveaux). Loop 3-5 min par niveau, 3 étoiles selon perf.

### Mapping tiles (8 prévus, 1 livré)

| Tile | Coût | Rôle | Status |
|---|---|---|---|
| **Lava Tower** (Peashooter) | 100 | tire 1 dmg / 1.5s | ✅ Sprint 1b |
| **Coin Generator** (Sunflower) | 50 | génère 25 coins / 8s | Sprint 3 |
| **Water Block** (Wall-nut) | 50 | tank 8 HP, bloque | Sprint 4 |
| **Magnet Bomb** (Cherry-bomb) | 150 | AOE 3×3 explosion 1.5s | Sprint 4 |
| **Fan** (Blover) | 100 | push-back lane | Sprint 4 |
| **Frost Trampoline** (Snow Pea) | 175 | slow + dmg | Sprint 4 |
| **Portal** (Squash) | 175 | téléporte 3 cases derrière | Sprint 4 |
| **Catapult** (Cabbage-pult) | 125 | ballistique, ignore obstacles | Sprint 4 |

### Visiteurs (7 prévus, 1 livré)

Basique 1HP, VIP Casque 3HP, Coin Thief, Skeleton (immune Lava), Volant, Pousseur, Boss Goret.

## Architecture

```
src-v2/
  main.js                  Phaser game config + scenes register
  scenes/
    BootScene.js           splash 2s puis scene.start("LevelScene")
    LevelScene.js          gameplay : grille, lanes, spawn, placement
  systems/
    Grid.js                grille 5×12 cellSize 90, cellToPixel/pixelToCell/state/isEmpty/setCell
  entities/
    Visitor.js             Container HP/speed, marche →gauche, takeDamage, kill, events
    LavaTower.js           Container, ciblage nearest in lane, fireRate, fire()
    Projectile.js          Container boule lave, vélocité X+, hit() applique damage
  ui/
    Toolbar.js             bottom 100px, boutons tile, sélection visible (border or)
public/
  sw.js                    kill-switch SW (unregister + clear caches), legacy purge
index.html                 désinstalle SW + caches AVANT charger /src-v2/main.js
```

**Legacy KAPLAY** (`src/`, 65 fichiers, 17 800 lignes) reste dans le repo pour référence jusqu'au Sprint 12, mais n'est plus chargé. Sera supprimé à la bascule prod.

## Conventions

- **Commits atomiques** : `feat(pivot):`, `feat(combo/...)`, `fix(pivot):`, `refactor:`, `chore:`. Préfixe `pivot` pour les commits de la migration tant qu'on est sur la branche `phaser-pivot`. Co-Authored-By Claude Opus 4.7 toujours en footer.
- **Pas de commentaires** sauf si WHY non-obvious (workaround Phaser, invariant subtil).
- **Pas de `console.log`** en prod. Debug exposé via `window.__game = scene` au besoin.
- **Pas de TypeScript** — JS vanilla, ESM imports.
- **Performance** : viser 60 FPS, ≤ 1 MB bundle gzippé (actuel ~360 KB Phaser + code), entités pooled si > 50 actives.

## Pièges Phaser 4 (rencontrés, à éviter)

- **Pas de `import Phaser from "phaser"`** — Phaser 4 exporte en named only. Toujours `import * as Phaser from "phaser"`.
- **`Container` n'a PAS de `preUpdate` auto-call** — il faut écouter `scene.events.on("update", tick)` manuellement et le `off()` au destroy. (Sprite a preUpdate auto, lui.)
- **`tick()` peut tourner après `destroy()`** — toujours guard `if (!this.scene || this._dying) return;` au début. (cf fix Sprint 2.)
- **`area`/`setInteractive` sur Container** — Phaser ne calcule pas la hitbox tout seul, passer `new Phaser.Geom.Rectangle(...)` + `Phaser.Geom.Rectangle.Contains` explicitement.
- **`drawText` style** — Phaser utilise `add.text(x, y, str, { fontFamily, fontSize, color, stroke, strokeThickness })`, pas la signature KAPLAY.
- **Service Worker legacy** — l'ancien KAPLAY SW (`lava-park-v6`) cache agressivement. Le `public/sw.js` actuel est un kill-switch qui se désinstalle à l'activate. NE PAS le réactiver tant que l'audience legacy n'est pas complètement migrée.
- **Bundle Phaser 4 = 1.6 MB minifié** (357 KB gz). Pas dramatique mais ne pas ajouter d'autres deps lourdes sans réfléchir.

## Performance cibles

- Bundle prod : < 1 MB gzippé (actuel ~360 KB)
- 60 FPS sur laptop 2018 / Mac Retina
- < 10 MB RAM client
- Loading < 2s sur 4G
- 0 requête runtime hors le bundle initial (sprites Kenney en atlas local)

## Workflow session

1. Lire ce fichier
2. `git log --oneline | head -10` pour voir l'état (commits Sprint 0 → en cours)
3. `git branch --show-current` doit retourner `phaser-pivot`
4. Sprint courant indiqué dans le plan markdown `/Users/mike/.claude/plans/travaille-sur-va-dans-radiant-spindle.md`
5. **Déléguer aux agents** quand le scope dépasse 1h de boulot : `feature-dev` pour exécuter un sprint spécifié, `Explore` pour audit ciblé, `spec-writer` (opus) pour designs en amont
6. Pattern : 1 sprint = 1 ou 2 commits cohérents qui buildent et tournent. Push après chaque sprint pour CI redeploy auto sur la branche.

## Tester en local

```bash
npm run dev              # Vite dev server
# ouvrir http://localhost:5173
# DevTools : Application > Service Workers > Unregister si l'ancien SW colle
```

```bash
npm run build            # build production
ls -la dist/             # vérifier taille bundle
```

Debug runtime :
```js
// dans la console DevTools
const scene = window.game?.scene?.scenes?.find(s => s.scene.key === "LevelScene");
scene?.visitors    // liste visiteurs actifs
scene?.towers      // liste tours posées
scene?.gridState   // état grille [row][col]
```
*(Note: `window.game` n'est pas exposé par défaut, à ajouter dans main.js si besoin debug.)*

## Backlog Park Defense (sprints incrémentaux)

- [x] Sprint -1 — tag `v1.0-kaplay-final`
- [x] Sprint 0 — Phaser boot scene "PARK DEFENSE"
- [x] Sprint 1a — Visitor entity + LevelScene 1 lane
- [x] Sprint 1b — LavaTower + Projectile + collision kill
- [x] Sprint 2 — Grille 5×12 + Toolbar + placement-mode
- [ ] Sprint 3 — Économie pièces (Coin Generator + HUD coins + coût tiles)
- [ ] Sprint 4 — 7 autres tile types (Water/Magnet/Fan/Frost/Portal/Catapult)
- [ ] Sprint 5 — Wave system + JSON niveau + écran résultat stars
- [ ] Sprint 6 — Campaign Menu grille 30 + save progress + 6 niveaux World 1
- [ ] Sprint 7 — 5 visiteur types + 6 niveaux World 2
- [ ] Sprint 8 — Boss Goret + 12 niveaux Worlds 3-4
- [ ] Sprint 9 — 6 niveaux World 5 boss-rush final
- [ ] Sprint 10 — Polish UI + tutoriel + audio + sprites Kenney intégrés
- [ ] Sprint 11 — 2P coop split-screen (optionnel)
- [ ] Sprint 12 — Bascule prod : `main` ← `phaser-pivot`, archive legacy

## Références techniques

- Phaser 4 docs : https://phaser.io/docs (l'API 3 → 4 est rétro-compatible large majorité)
- Kenney assets CC0 (à intégrer Sprint 10) :
  - Tower Defense Kit https://kenney.nl/assets/tower-defense-kit (160 sprites)
  - Tower Defense Top-Down https://kenney.nl/assets/tower-defense-top-down (300 sprites)
  - UI Pack https://kenney.nl/assets/ui-pack
- Tutorial PvZ-like Phaser 3 : https://phaser.io/news/2018/12/tower-defense-tutorial

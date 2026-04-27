# Park Defense — Instructions Claude

## Projet

Jeu 2D Tower Defense « Milan Park Defense — Foire en Lave » pour Milan. **Phaser 4 + Vite + JS vanilla**, 100% client-side, inspiré Plants vs Zombies. Bundle ~395 KB gz.

Live actuel :
- `/` = legacy KAPLAY archivé (branche `main`)
- `/v2/` = Park Defense (branche `phaser-pivot`, encore active dev)

Repo : https://github.com/michaelchevallier/lava_game

## État du jeu

Le pivot Phaser de 2026-04-26 est devenu un jeu complet. Roadmap initiale 100% bouclée + extras.

### Contenu

- **42+ niveaux** : 36 campagne (6 mondes × 6) + 5 carnaval + arène boss + endless + daily
- **6 mondes** : Plein Été, Crépuscule, Tempête, Volcan, Apocalypse, Foire Magique
- **13 tiles** : coin, water, cottoncandy, lava, fan, catapult, frost, magnet, portal, tamer, mine, neon, shovel
- **17+ types de visiteurs** dont 3 vrais boss multi-phases (magicboss summon, lavaqueen lava-trail, carnivalboss 3-phases)
- **17 trophées** + galerie + bonus +5¢ start permanent par trophée
- **Stats screen** complet (kills, étoiles, tickets, streak daily, record endless, etc.)
- **Mode Carnaval** (5 niveaux conveyor belt sans économie)
- **Mode Arène des Boss** (3 vagues, 3 boss back-to-back)
- **Défi du Jour** (seed-by-date, streak, 1 essai/jour)
- **Cutscenes ASCII** narratives avant chaque monde
- **5 mini-jeux Foire** : chamboule-tout, tir au pigeon, roue de la fortune, course de crêpes, bumper cars
- **Coop 2P split-clavier** : curseur P2 cyan aux flèches + Enter
- **Treasure chests** : apparaissent aléatoirement pendant le gameplay (+75¢)

### UX / contrôles

- **Souris + clavier** : 1-9 / 0 / Q / W / E pour sélectionner les tiles
- **Coop P2** : flèches pour curseur + Enter pour poser
- **Pause** : P (et ESC si pas de tile sélectionnée)
- **Restart rapide** : Shift+R
- **Mute** : bouton 🔊 HUD top-right (persisté en save)
- **Auto-pause** quand l'onglet perd le focus

### Visuel

- **Web fonts** : Bangers (titres) + Fredoka (corps) via Google Fonts
- **Composant Clickable** unifié (ui/Clickable.js) pour tous les boutons
- **Particle pool** avec cap 200 actifs (perf stable sur kill burst massif)
- **Theme par monde** (sky/ground/lane gradients + weather + sky decor)
- **Kill VFX premium** : burst coloré par type, ring or pour boss, popup +1/BOSS DOWN
- **Range indicator** au survol pendant placement (lane / cercle / 3×3 selon tile)
- **Tooltip** au survol des tours posées (nom + HP + remboursement pelle)
- **Briefing niveau** au démarrage (sauf 1.1 qui a son tutoriel)
- **Wave banner** avec stripe noire qui se déploie + 20 particules

### Architecture

```
src-v2/
  main.js                       Phaser game config + scenes register + debug helpers
  scenes/
    BootScene.js                Splash + play button
    CampaignMenuScene.js        Menu campagne (worlds, modes, daily, foire)
    LevelScene.js               Gameplay principal
    LevelResultScene.js         Écran résultat + stars
    TrophyScene.js              Galerie trophées
    StatsScene.js               Stats globales
    CutsceneScene.js            Intros narratives ASCII
    FairgroundHubScene.js       Hub mini-jeux foire
    FairgroundScene.js          5 mini-jeux (single file, switch sur gameType)
  systems/
    Grid.js                     Grille 5×12, conversion px↔cell
    WaveManager.js              Spawn waves + endless exponentiel
    Audio.js                    Web Audio SFX procéduraux
    MusicManager.js             3 tracks loopées (menu/calm/intense)
    SaveSystem.js               localStorage parkdef:save
    Theme.js                    6 thèmes mondes
    LavaMeter.js                Barre lave gauche
    Trophies.js                 17 trophées + checkTrophies
    Daily.js                    Défi du Jour seed-by-date
    Particles.js                Pool avec cap 200 (perf)
    JuiceFX.js                  Hitstop + screen shake
    Flash.js                    Color flash universel
  entities/
    Visitor.js                  17 types, behaviors, anims, kill VFX
    LavaTower.js / LavaProjectile.js
    CoinGenerator.js / Sun.js
    WaterBlock.js / Fan.js / MagnetBomb.js / Catapult.js
    FrostTramp.js / Portal.js / Tamer.js / CottonCandy.js
    Mine.js / NeonLamp.js
    LawnMower.js                Filet de sécurité PvZ
    Projectile.js
    TreasureChest.js
  ui/
    Toolbar.js                  Bottom toolbar (13 tiles + makeIcon helper)
    ConveyorBelt.js             Tapis carnaval
    Clickable.js                Composant unifié makeClickable
    Player2Cursor.js            Curseur P2 coop
    Tutorial.js                 Tuto niveau 1.1
  data/
    levels/                     ~44 JSONs (world1-1 à world6-6, carnival1-5, bossarena, endless, index)
    cutscenes.js                6 cutscenes (1 par monde)
```

## Conventions

- **Commits atomiques** : `feat(...)`, `fix(...)`, `refactor:`, `chore:`. Footer Co-Authored-By Claude Opus 4.7.
- **Pas de commentaires** sauf si WHY non-obvious.
- **Pas de console.log** en prod.
- **Pas de TypeScript** — JS vanilla, ESM imports.
- **Performance** : 60 FPS, ≤ 1 MB bundle gz, particle pool cap.

## Pièges Phaser 4 (à se rappeler)

- `import * as Phaser from "phaser"` (named only, pas default).
- `Container` n'a PAS de `preUpdate` auto — écouter `scene.events.on("update", tick)` + off au destroy.
- `tick()` peut tourner après `destroy()` — guard `if (!this.scene || this._dying) return;`.
- `setInteractive` sur Container : passer Rectangle hitArea + Contains explicitement.
- Service Worker legacy : `public/sw.js` est un kill-switch qui se désinstalle, NE PAS le réactiver.

## Workflow session

1. Lire ce fichier
2. `git log --oneline | head -10` pour voir l'état
3. `git branch --show-current` doit retourner `phaser-pivot`
4. Pour une feature non-triviale : 1 sprint = 1-2 commits qui buildent et tournent. Push après.
5. Test live via Chrome MCP : `https://michaelchevallier.github.io/lava_game/v2/`

## Tester en local

```bash
npm run dev              # http://localhost:5173
npm run build            # vérifier dist/
```

Debug runtime via console DevTools :
- `window.__pd_unlock_all()` débloque tout (36 niveaux + carnaval + arena + 17 trophées + cutscenes vues + 5000 kills)
- `window.__pd_reset()` wipe la save
- `window.__pd_scene()` retourne la LevelScene active
- `window.__pd_place(toolId, col, row)` pose une tile
- `window.__pd_stats()` dump l'état
- `window.__pd_goto(levelId)` switch de niveau

## Backlog actuel

✅ Tout le roadmap initial M1.V*/M2.G*/M3.G* livré.

🚧 En cours :
- Worlds 7-10 (Espace, Sous-Marin, Médiéval, Cyberpunk)
- Mode Histoire branchée (choix narratifs entre les mondes)
- Skins/cosmétiques shop avec tickets
- Mobile / touch responsive
- Tower idle animations (proxy Kenney)
- Bascule prod : merger `phaser-pivot` → `main`, archiver legacy

## Références

- Phaser 4 docs : https://phaser.io/docs
- Snapshot KAPLAY pré-pivot : tag `v1.0-kaplay-final` (commit `9ea6db3`)

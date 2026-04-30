# Park Defense — Instructions Claude

## Projet

Jeu 2D Tower Defense « Milan Park Defense — Foire en Lave » pour Milan. **Phaser 4 + Vite + JS vanilla**, 100% client-side, inspiré Plants vs Zombies. Bundle ~395 KB gz.

Live actuel :
- `/` = Park Defense (branche `phaser-pivot`)
- `/v2/` = Park Defense (alias historique)
- `/v1/` = legacy KAPLAY archivé (branche `main`)

Repo : https://github.com/michaelchevallier/lava_game

## État du jeu

Le pivot Phaser de 2026-04-26 est devenu un jeu complet. Roadmap initiale 100% bouclée + extras.

### Contenu

- **66+ niveaux** : 60 campagne (10 mondes × 6) + 5 carnaval + arène boss + endless + daily
- **10 mondes** : Plein Été, Crépuscule, Tempête, Volcan, Apocalypse, Foire Magique, Espace, Sous-Marin, Médiéval, Cyberpunk
- **15 tiles** : coin, water, cottoncandy, lava, fan, catapult, frost, magnet, portal, tamer, mine, neon, laser, bulle, shovel
- **Skins shop** : 12 skins achetables avec tickets (5-10 🎫), équipables par tile via SkinsScene
- **Narrative branchée** : choix dans cutscenes 4/7/10 sauvegardés (startCoins bonus, kill bonus, cooldown reduction)
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

## Workflow blocs lourds (POST.X) — tickets parallèles Sonnet

Pour tout bloc qui touche plusieurs systèmes ou dépasse ~5 commits, on découpe en **tickets atomiques** que des Sonnet `feature-dev` exécutent en parallèle.

### Étapes

1. **Plan opus** : Mike valide le scope global via `/plan` puis ExitPlanMode. Plan saved dans `/Users/mike/.claude/plans/`.
2. **Découpe en tickets** dans le plan file, format :
   - `TICKET-XX` titre court + brief auto-suffisant (fichiers cibles, fonctions, comportement attendu, build+commit+push)
   - Chaque ticket = 1 track séquentiel de N commits atomiques (1 Sonnet le prend en charge entier).
   - Identifier les dépendances entre tickets (ex: TICKET-CB1 bloqué par TICKET-SE).
3. **Sprints parallélisés** :
   - **Sprint 1** : tous les tickets sans dépendances mutuelles lancés en parallèle.
     - 1 message avec N appels `Agent` simultanés, `subagent_type: feature-dev`, `isolation: "worktree"`.
     - Chaque Sonnet bosse dans sa worktree, push après chaque commit sur sa branche dédiée.
   - **Sprint 2+** : tickets bloqués lancés après merge du sprint précédent.
4. **Merge** : opus orchestre les merges des branches worktree dans `phaser-pivot`, résout les conflits manuels prévus dans la section "Conflits prévisibles" du plan.
5. **Validation** : `npm run build:kingshot` + `npm run test:crowdef` après chaque merge. Live test Chrome MCP par opus.

### Brief pour ticket Sonnet

Doit contenir, minimum :
- **Type** (feature-dev / bug-fixer / quality-maintainer)
- **Estimé** (en commits + jours)
- **Bloqué par** (autres tickets) si applicable
- **Brief** : contexte 1-2 phrases + état actuel à refactorer
- **Commits à livrer** : liste séquentielle, chacun avec titre `<type>(v3): <quoi>` + détails par fichier (chemin absolu, lignes ciblées, comportement attendu)
- **Verification** : commandes build/test + live test scenarios
- **Files critiques** : liste paths absolus modifiés/créés

### Pourquoi worktree

`isolation: "worktree"` crée une copie isolée du repo pour chaque agent. Évite les conflits sur fichiers communs (`Tower.js`, `LevelRunner.js`) quand 2 Sonnet bossent sur des refactors qui touchent les mêmes fichiers. Le merge final est manuel mais prévisible (la section "Conflits prévisibles" du plan liste les zones de friction connues).

### Pièges identifiés

- **Tower.js + LevelRunner.js conflits** : les 2 fichiers les plus touchés. Toujours lister explicitement les zones modifiées dans chaque ticket pour anticiper.
- **Imports dupliqués** : 2 Sonnet peuvent ajouter la même import au top du fichier. Merge prend les 2 → dedup manuel.
- **Test:crowdef baseline** : actuellement 23/25 (2 fails préexistants : `towers built >= 1`, `endless has 30 waves`). Tout ticket doit maintenir 23/25, pas régresser.

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

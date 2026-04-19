# Milan Lava Park — Instructions Claude

## Projet

Jeu 2D "Fête Foraine en Lave" pour Milan. KAPLAY + Vite + JS vanilla, 100% client-side. Stack immuable — ne pas migrer vers Godot ou autre moteur.

## Architecture des fichiers

### Règle de taille

| Seuil | Action |
|-------|--------|
| < 800 lignes | Monofichier OK |
| 800–1200 lignes | Surveiller, prévoir le découpage |
| > 1200 lignes | **Découper immédiatement avant d'ajouter du code** |
| > 1500 lignes | Bloquant — refactorer avant toute feature |

### Plan de découpage quand nécessaire

Ordre de priorité pour extraire depuis `main.js` :

```
src/
  main.js          — scene setup, game loop, glue code uniquement
  constants.js     — CONFIG, TILE_TYPES, WAGON_THEMES, COMBO_MULTIPLIERS
  tiles.js         — définitions tiles, rendu tiles, interactions tiles
  wagons.js        — spawn wagon, physics, trail, effets tuiles
  players.js       — input clavier, mouvement joueurs, collisions
  particles.js     — toutes les fonctions spawnParticles*
  hud.js           — drawHUD, drawTextOutlined, score, combo affichage
  serializer.js    — export/import parc (btoa/atob)
  audio.js         — sons, musique, toggles
```

Chaque module exporte ses fonctions/constantes, importe depuis les autres via ES modules. Pas de bundler magique — les imports directs Vite suffisent.

### Règle du découpage

- Couper sur des **frontières fonctionnelles claires**, jamais au milieu d'une feature.
- Chaque extraction = 1 commit `refactor: extract <module>` avant de continuer.
- Après extraction : vérifier que le jeu tourne encore (`npm run dev`) avant le commit suivant.

## Conventions de code

- **Pas de commentaires** sauf si le WHY est non-obvious (contournement bug KAPLAY, invariant subtil).
- **Commits atomiques** : `feat:` / `fix:` / `refactor:` / `chore:` / `build:`. Un commit = une chose.
- **Pas de `console.log`** en prod — utiliser des flags debug locaux si besoin.
- **Performance** : MAX_WAGONS=3, particules capées à 30 par burst, pool entités, 60 FPS garanti.
- **Pas d'abstractions prématurées** : 3 lignes similaires < abstraction hypothétique.
- Toujours valider avec `preview_console_logs level=error` après chaque feature — doit être vide.

## Pièges KAPLAY (ne pas répéter)

- Ne pas utiliser `frame` / `animFrame` comme props custom (collision sprite component)
- `obj.sprite = "name"` au lieu de `obj.use(k.sprite("name"))`
- Pas de `[...]` ni `\` dans `drawText` (parse error styled tags)
- Pas de `k.fixed()` sur overlays fullscreen (WebGL feedback loop)
- `const WAGON_THEMES` au module level, jamais dans scene callback (TDZ)
- Touches D et T = conflit Mario/Toad — interdites comme raccourcis

## Backlog features (par priorité)

### Gameplay
- [ ] Trampoline tile (9) — rebondit wagon/joueur
- [ ] Mode nuit/jour (N) — cycle + étoiles
- [ ] Wagons multicolores — couleur random au spawn
- [ ] Feux d'artifice sur paliers 50/100/250/500/1000 pts
- [ ] Combo multiplicateur x2 si 3 transforms en <2s

### Décor / ambiance
- [ ] Stations de départ/arrivée (portiques aux bords)
- [ ] Visiteurs colorés (tint random sur sprite humain)

### Multiplayer
- [ ] Joueur 3 (Bowser) — numpad
- [ ] Joueur 4 (Yoshi) — flèches + Shift droit
- [ ] Splash screen sélection nb joueurs

### Persistance / deploy
- [ ] localStorage best score all-time + nb squelettes totaux
- [ ] Écran titre avec meilleur score
- [ ] Vite config `base: './'` pour deploy subpath
- [ ] GitHub Actions auto-deploy `dist/` sur Pages

## Workflow de session

1. Lire ce fichier + vérifier `wc -l src/main.js` — si > 1200 lignes, découper avant tout
2. Choisir 2-3 features du backlog ci-dessus
3. Implémenter → `preview_console_logs` → screenshot → commit
4. Mettre à jour le backlog dans ce fichier (cocher les cases)
5. Si session interrompue : git est propre = safe. Reprendre au backlog.

## Performance cibles

- Bundle prod : < 300 KB gzippé
- 60 FPS sur laptop 2015
- < 5 MB RAM client
- Loading < 1s sur 4G
- Zéro requête runtime (tout inline / data URL)

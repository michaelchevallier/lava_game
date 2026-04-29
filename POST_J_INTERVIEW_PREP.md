# POST.J — Préparation interview dédiée

**Date du document** : 2026-04-29 (fin POST.I)
**Branche** : `phaser-pivot` (commit 35edc2d)
**Live** : https://michaelchevallier.github.io/lava_game/v3/?debug=1

## Contexte

POST.G + POST.H + POST.I sont pushés. Reste les 2 chantiers architecturaux que Mike veut traiter avec une session interview dédiée :

1. **Placement libre des tours** (adjacent au path, grid invisible, drain or conservé)
2. **Port des features Park Defense** (legacy /v2/ : catapulte, ventilo, frost trampoline, mine, magnet, portal, etc.)

Mike veut être interrogé en mode interview avant que je code. Cette doc liste les questions à creuser pendant la session.

## État actuel — rappel rapide

- 33 niveaux dont 17 multi-path (W2.4 + W3.1 + W3.2-3.8 + W4.1-4.8 = 17)
- 4 thèmes (plaine/forêt/désert/volcan) × 8 niveaux + endless + 4 boss
- 5 types de tours actuels (archer/tank/mage/ballista + un futur 6e)
- 14 perks dont 4 perks "transform" (fireball/ricochet/lightning/pierce_explode)
- Économie : startCoins par level, or par kill, drain coin pendant build (30¢/sec)
- Système actuel : `slots[]` prédéfinis dans data, hero entre dedans pour build, type tour hardcodé par slot

## Audit codebase rappel (Phase 1 du plan)

- `src-v3/data/levels/world1-1.js:9-13` : structure slot `{ t, cost, lateralOffset, towerType, pathIdx }`
- `src-v3/systems/LevelRunner.js:117-121` : instanciation slots
- `src-v3/entities/Slot.js:52-57` : calcul position 3D via `path.getPointAt(t)` + tangent × lateralOffset
- `src-v3/entities/Slot.js:107-162` : tick proximité hero, drain auto à 30¢/s
- `src-v3/entities/Tower.js:56-73` : load GLB via AssetLoader
- **Pas de démolition existante** (Tower.destroy n'est appelée que cleanup level)
- **Pas de raycaster sur towers** (aucun click handler 3D)
- **Joystick mobile EXISTS** : `src-v3/main.js:349-391` (multi-touch)

## Reco research (agents Phase 2 du plan POST.G)

### Pattern de placement (gameplay agent)
- **Reco forte** : grid invisible, snap fort, **adjacent au path uniquement** (cases bordant le chemin, lateralOffset 1.5-3u)
- Restriction : pas sur le path lui-même (sacré)
- Preview : halo vert pulsant + cercle de range fantôme + barre drain or au-dessus du héros
- Mike a confirmé cette direction

### Sous-menu RTS (gameplay agent)
- **Reco forte** : radial 4 boutons façon Kingdom Rush (pas side panel)
  ```
              [⬆ UPGRADE]
                250 or
                  |
      [📊 INFO]──[🗼]──[🎯 CIBLE]
                  |     premier/dernier
                [💥 SELL]
                +90 or
  ```
- Boutons gros 60-80px (doigt 8 ans)
- Tap hors radial = ferme

### Démolition (gameplay agent)
- **Reco forte** : sell 80% flat refund + **undo 3s** via toast
- Pas de confirmation (friction inutile)
- Refund value visible en hover/long-press sur la tour

### Économie (gamedesign agent — MAIS Mike a dit non aux anti-spam !)
- L'agent recommandait combo segments cap 3/sec + upkeep 0.4¢/s + escalade locale +30%/+60%
- **Décision Mike** : on garde `startCoins + or kill` actuel sans rien ajouter, on observe en test live et on ajuste empiriquement
- **À reposer pendant l'interview** : si test live montre que 12 archers spamés trivialisent, accepter l'ajout d'une mécanique anti-spam ?

## Questions à creuser pendant l'interview

### A. Placement libre — règles spatiales détaillées

1. **Largeur du couloir constructible** ?
   - 1.5u de chaque côté du path = strict, 1 file de cases
   - 2.0u = case + demi-case (intermédiaire)
   - 2.5u = 2 files de cases possibles (plus de choix)

2. **Snap-to-grid visible** ?
   - Cases vert/rouge au survol héros (PvZ-style)
   - Halo doux suivant le héros (Kingdom Rush)
   - Rien (juste tower preview qui apparaît si validation)

3. **Conflit 2 tours sur même case** ?
   - Interdit (case rouge)
   - 2ème tour build by-pass et retombe sur case adjacente libre

4. **Cooldown global de construction** ?
   - Mike a dit non aux anti-spam, mais à valider après test
   - 0s (free-spam) / 3s / 8s (PvZ pelle = 0s mais soleil cap)

5. **Drain coin pendant build** : conserve 30¢/sec ou ajustable selon type tour ?
   - Constant (simple, présent)
   - Type-specific : archer 30¢/s, tank 50¢/s, AoE 80¢/s (variétal)

### B. Sous-menu tour — détails contenu

1. **Tiers d'upgrade** : 3 actuels (slots l'ont déjà), à conserver ou changer ?

2. **Que fait chaque bouton du radial** ?
   - UPGRADE : montre coût next tier, applique direct ?
   - INFO : popup stats (dmg, range, fire rate, special) ?
   - CIBLE : cycle entre `first/last/strong/closest` ? Affichage de la cible courante ?
   - SELL : tap → confettis + refund + toast undo

2. **Où afficher le tier actuel de la tour** ?
   - Pips sur le sol (1-3 étoiles)
   - Label flottant (Lv 1/3)
   - Couleur du modèle (dorée pour Lv 3)

3. **Mobile** : tap simple ou hold long press pour ouvrir radial ?
   - Tap simple : risque de fausse manip
   - Long press 0.4s : friction mais sécurise
   - Tap puis confirm dans radial : 2 étapes

### C. Park Defense features — sélection et adaptation 3D

Liste legacy /v2/ (cf `CLAUDE.md`) :
- Catapult, Fan, FrostTramp, MagnetBomb, Mine, Portal, Tamer, CottonCandy, NeonLamp, Laser, Bulle, Shovel

1. **Lesquelles porter en V3** ?
   - Mike a dit "max" → cible 5-7 features
   - Reco priorité : **catapulte** (asset facile KayKit), **ventilo** (mécanique unique push), **frost trampoline** (slow), **mine** (one-shot tactique), **magnet** (pull centripète)
   - Skip probables : Tamer (creature spawn complexe), CottonCandy (rare en TD), NeonLamp/Laser (déjà mage existe)

2. **Adapter mécaniques 2D→3D** :
   - Fan : push enemies = velocityImpulse sur leur curve.t (recule t de 0.05 = ~10% du path)
   - Frost : zone d'effet 3u radius, slow 50% pendant 4s
   - Mine : explosion AoE 3u au passage du 1er ennemi, one-shot
   - Magnet : pull les ennemis non-shielded vers son centre (modify position en frame, pas la curve.t)
   - Catapult : projectile parabolique (calcul gravité + apex), AoE à l'impact

3. **Économie** : ces tours coûtent quoi vs archer (35-50¢) ?
   - Mine : 60¢ (one-shot puissant)
   - Frost : 90¢ (utility CC)
   - Fan : 110¢ (utility unique)
   - Magnet : 140¢ (rare, anti-rush)
   - Catapult : 130¢ (AoE puissante)

4. **Unlock progression** :
   - Disponibles dès W1 (riche, mais paralyse-choice pour 8 ans)
   - Unlock par world (W1=archer/tank/mage, W2 ajoute frost+mine, W3 catapult, W4 fan/magnet)
   - Reco : par world, simplifie progression

### D. Workflow

1. **Sessions allouées à POST.J** :
   - Session 1 : interview + plan détaillé écrit
   - Session 2-3 : refacto Slot.js → free placement + radial menu + démolition
   - Session 4-5 : port 5-7 Park Defense features (1 par commit ?)

2. **Critères de done** :
   - Tous les 4 worlds + 33 niveaux jouables avec free placement
   - 5 nouvelles tours fonctionnelles + intégrées dans toolbar
   - test:crowdef adapté (slots → free placement) reste à 25/25

3. **Rétro-compat** : on garde le `slots[]` legacy pour les niveaux non touchés ou on convertit tout ?
   - Conversion totale → cohérence
   - Hybride → moins de risque de régressions

## Assets — ✅ déjà en place (commit 49d8d5d)

Les 6 GLBs Park Defense sont téléchargés, déplacés dans `src-v3/public/towers/`, ajoutés à `AssetLoader.MANIFEST` et déclarés dans `Tower.TOWER_TYPES` :

| Tour | GLB | Mécanique | État infra |
|---|---|---|---|
| Catapulte (`cannon`) | cannon_quaternius.glb | parabolic AoE 2.2u | ✅ Fonctionnel (prêt à poser) |
| Baliste géante (`crossbow`) | giant_crossbow.glb | pierce 4 dmg 5 | ✅ Fonctionnel (prêt à poser) |
| Soufflerie (`fan`) | tower_windmill.glb | push enemies | ⏳ pendingMechanic — interview |
| Mine (`mine`) | spike_mine.glb | one-shot AoE 2.5u | ⏳ pendingMechanic — interview |
| Aimant (`magnet`) | magnet_polygoogle.glb | pull centripète | ⏳ pendingMechanic — interview |
| Portail (`portal`) | teleporter_base.glb | teleport (concept TBD) | ⏳ pendingMechanic — interview |

`ASSETS_LICENSES.md` créé pour le tracking (CC0 vs CC-BY).

**Test live** : `__cd.runner.towers` peut désormais accueillir des Tower de ces 6 types. Cannon + crossbow tirent normalement. Les 4 autres affichent leur model mais leur tick() return early (pas de comportement).

**À déterminer pendant l'interview** :
- Mécaniques exactes 3D pour fan / mine / magnet / portal (cf section C)
- Économie : coûts initiaux + upgrade tiers
- Unlock : par world ou tout dispo dès W1 ?
- Affichage HUD toolbar : 9 types tours = trop pour un toolbar mobile ?

## Points de vigilance

- **Performance** : 14 niveaux multi-path tournent OK (FPS 9.8 en headless), mais avec free placement + 12 tours possibles + 5 nouveaux types = check FPS
- **Mobile** : le free placement par hover/click ne fonctionne pas direct sur touch — refacto navigation requis (tap sur case = walk + build chain)
- **Sauvegarde** : la save format actuel n'a pas de notion de tour custom-placed. Refacto save format à anticiper
- **Compatibilité saves existantes** : prévoir migration ou flag `version: 2` qui invalide saves anciennes

## Rappel push policy

Autonomie totale post-J7, push direct. Pas de validation entre commits. Tests verts → push. Cf memory `feedback_v3_autonomy.md`.

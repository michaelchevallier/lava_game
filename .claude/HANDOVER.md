# Handover — Milan Lava Park (2026-04-20 fin de session)

## État live

- URL : https://michaelchevallier.github.io/lava_game/
- Branche `main` : commit `e06bc53` pushé, CI auto-deploy GitHub Pages
- Bundle : 62.13 KB gz game + 67.11 KB kaplay = ~129 KB
- main.js : 1458 lignes (sous limite 1500)
- Plus de crash écran bleu (3 bugs fixés ce soir)

## Fixes de la session (référence commits)

| Commit | Fix |
|---|---|
| `eb8cce4` | crash balloon `popBalloon` — passait Color obj à `k.color()` |
| `5917de9` | crash portal collision — `p.color` undefined depuis refactor sprite 09f9ffb |
| `d9b7fd3` | bridge pulse danger — overlay rouge restauré (silently no-op après refactor) |
| `e06bc53` | race rider control + mode curseur + tutoriel cog position |

## Priorités pour la prochaine session (ordre strict)

### 1. Sprites persos vue de côté (P0 user)
Mario/Luigi/Toad sont déjà en profil 20×30 (commit `e31cf54`). Il faut convertir les autres avatars en profil aussi pour cohérence visuelle.

**À faire** : éditer `src/sprites.js` blocs suivants pour passer de vue de face à profil side-view (silhouette tournée vers droite, un œil visible, arm forward si approprié) :
- `SPR_PIKA` (14×22 actuel → 20×30 profil)
- `SPR_SONIC` (20×30 vue de face actuellement)
- `SPR_LINK`, `SPR_KIRBY`, `SPR_PACMAN`, `SPR_YOSHI`, `SPR_BOWSER`, `SPR_POKEBALL`, `SPR_TETRIS`, `SPR_INVADER`

Note : DK, Mega, Samus, Crash, Steve, Chief, Astro dérivent déjà via `substituteSprite(SPR_PLAYER, ...)` donc héritent automatiquement du Mario profil. Rien à faire pour eux.

Règles :
- Garder la grille 20 colonnes × 30 rangées (hitbox calibré dessus)
- Silhouette tournée vers la droite (flipX gère le retour gauche)
- Utiliser la palette existante (voir début de `sprites.js`)
- Build + vérifier chaque sprite fait bien 20 chars de large avec :
  ```bash
  awk '/const SPR_XXX = \[/,/^\];/' src/sprites.js | grep -oE '"[^"]*"' | awk '{print length($0)-2}' | sort -u
  ```

### 2. 3 agents créatifs — débat gameplay (P1 user)
User : *"aujourd'hui le jeu est creux comme pas permis"*

Spawn en **parallèle** (1 seul message, 3 `Agent` tool calls) :
- **creative-opus #1** : Perspective "simulation parc" — le joueur construit, les visiteurs ont des désirs/émotions, économie, progression long-terme
- **creative-opus #2** : Perspective "action arcade" — combos serrés, time pressure, score hunt, chain/combo meter, power moves
- **creative-opus #3** : Perspective "sandbox créatif" — outils de construction à la Mario Maker, partage de circuits, challenges communauté, physics puzzles

Chaque agent doit produire :
- Diagnostic "pourquoi le jeu est creux"
- 5 propositions concrètes qui comblent le vide
- Une recommandation de **core loop** qui tient la rétention

Puis tu synthétises les 3 retours en un **plan gameplay unifié** (1 doc markdown) et le présentes au user AVANT d'implémenter quoi que ce soit.

### 3. Items secondaires (à traiter si temps)
- **Mobile toolbar** : menu tuiles trop petit sur mobile, ajouter bouton rentrer/sortir le menu
- **Pose tuiles en hauteur** : quand user dezoom, row < 0 ou row >= GROUND_ROW est bloqué → permettre placement partout dans le viewport visible
- **Splash typo** : "Engrenage en haut à droite" → "en bas à droite" (le cog est déplacé)

## Conventions importantes (rappel)

- **Pas de commentaires superflus** (sauf WHY non-obvious)
- **1 commit atomique par feature** + push immédiat
- **Build systématique** après chaque changement (`npm run build`)
- **Agent models** : bug-fixer/qa-tester en haiku, quality-maintainer/feature-dev/perf-auditor en sonnet, spec-writer en opus
- **Pas de console.log** en prod (terser les strippe via drop_console)
- **Tests** : user teste lui-même ou via agent qa-tester, PAS de Chrome MCP direct (trop lent, user l'a dit explicitement)
- **Structure agents** (quatuor) : créatif → spec-writer → feature-dev → qa-tester + quality-maintainer en appui

## Pitfalls KAPLAY rencontrés (éviter)

- `k.color(colorObj)` crash "Invalid color arguments" dans certains contextes → utiliser `k.color(r, g, b)` en 3 args explicites
- Refactor tile en sprite unique casse silently tous les accès `t.color.r/g/b` et `t.extras[N]` → auditer avant de refactor
- `wagon.rider.pos = ...` chaque frame annule un parking off-screen → ne jamais repositionner un entity body avec `k.body` qui pilote une hitbox physique

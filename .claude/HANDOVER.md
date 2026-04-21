# Handover — Milan Lava Park (2026-04-21 fin session refonte gameplay)

## État live

- URL : https://michaelchevallier.github.io/lava_game/
- Branche `main` : commit `70b2b01` pushé, CI auto-deploy
- Bundle : ~77 KB gz game + 67 KB kaplay = **~144 KB total** (user a abandonné la cible 100 KB)
- 29 commits cette session, refonte game design complète livrée
- Pas de QA live confirmée (qa-tester haiku n'a pas Chrome MCP dans cette config)

## Ce qui a été fait

### Refonte game design B2 (campagne + run + sandbox)

**3 modes jouables**, écran d'accueil avec sélection :
- **Campagne** : 38 niveaux solo répartis sur 5 mondes (Premiers pas / Combos / Challenges / Experts / Énigmes)
- **Run arcade** : session 180s chronométrée, podium top 5 local par avatar
- **Bac à sable** (discret) : le jeu actuel intact, 4P clavier préservé, race F2, tous systèmes ON

### Architecture technique

```
src/router.js         — state machine mode
src/constants.js       — MODE_CONFIG { campaign, run, sandbox } feature flags
src/main.js            — scene game lit MODE_CONFIG, wire hooks campaign/run
src/splash.js          — 3 cartes mode, avatar contextuel
src/hud.js             — HUD polymorphe (sandbox / campaign / run)
src/campaign.js        — loadLevel, progress, tick, failOn, stars, persistance
src/campaign-menu.js   — grille niveaux + déverrouillage par étoiles cumulées
src/campaign-result.js — overlay fin de niveau avec raisons d'échec nommées
src/levels.js          — 38 niveaux avec helpers railRow() et tile()
src/run.js             — timer 180s, spawn auto wagons 5s/cap 3
src/run-result.js      — podium top 5 local par avatar
src/pause-menu.js      — Escape en campagne/run = Retry/Menu/Accueil
src/settings-modal.js  — mode-aware (cache sandbox-only sections en campagne)
```

### Gameplay campagne

**Wagons manuels** : plus de spawn automatique, X lance un wagon, compteur visible HUD 🚃 N (X).  
**WagonLimit par niveau** : si tous wagons utilisés sans objectif atteint → lost.  
**Tile budget** : max tuiles plaçables, lost si dépassé.  
**Objectives** : skeleton / revive / coin / catapult / loop / apocalypse / score.  
**FailOn** : niveau perdu si condition interdite atteinte (ex 5-5 forbid skeleton=1).  
**Étoiles 3/3** : ⭐ finir / ⭐⭐ temps / ⭐⭐⭐ budget.  
**Hint par niveau** + **overlay intro 3.5s** + **tooltips toolbar enrichis**.  
**Coins respawn 2.5s en campagne** (sinon niveaux 5+ pièces impossibles).  
**Pass-through skeleton count** : wagon déjà squelette passant lave compte quand même en campagne (cooldown 1s).

### Niveaux (38 au total)

| Monde | Seuil | Titres |
|---|---|---|
| 1 Premiers pas | 0⭐ | Premier wagon · Le sauveur · La collecte · Catapulte · La boucle |
| 2 Combos | 5⭐ | Triple incinération · Cycle parfait · Chaîne d'or · Acrobate · Yin Yang · Escalier d'or · Grand saut · Looper pro · Lave et glace · APOCALYPSE |
| 3 Challenges | 12⭐ | Minimaliste · Time trial · Le magot · Portail maître · Double sommet · Vide-caisse · Patinoire mortelle · Grand frisson · Geyser Express · Maître forain |
| 4 Experts | 20⭐ | Symphonie · Ultra minimaliste · Boucle infinie (puzzle rampe!) · Le gardien · Maître absolu |
| 5 Énigmes | 28⭐ | Les cimes · L'abîme · Le vortex · Le pont suspendu · Le plongeur · Patinoire infernale · Énigme du forain · La dernière énigme |

### Fixes notables livrés cette session

- Player spawn en l'air → tombe naturellement sur sol (avant traversée horizontale)
- Portail au sol n'éjecte plus le wagon (clamp Y + reset vel.y)
- Drag-to-paint désactivé en campagne (préserve budget)
- Toolbar grisée pour tuiles non-autorisées en campagne + cursor/erase toujours dispo
- Placement de tuiles dans le sol creusé (isDug)
- humansCount skeletons (passager multiple = multi-count)
- Escape en campagne = pause menu (Retry / Menu / Accueil)
- Settings modal cache sections sandbox-only en campagne/run
- Trampoline fallback grid-based (résout collision borderline)
- Rail_loop progress tracking (360° complétion hook)
- Spawn hint "Appuie sur X" si idle 3s en campagne
- Level intro ferme sur Escape
- HUD campagne caché pendant pause

## Ce qui n'est PAS fait (backlog)

### Phase F — Retirements fluff
User a assoupli la règle : on garde les cosmétiques qui **clarifient les interactions tile×combo** (clouds, geyser particles, magnet/ice auras, lava bubbles).  
À retirer encore (non commencé) :
- Lava triangle ghosts (~90L) — obscur
- Flags waving (~40L)
- Crowd BRAVO text (~10L)
- Season cosmetics animations (~55L)

### Polish restant
- Tutorial.js (145L) pas supprimé, il tourne en sandbox mais remplacé par niveaux 1-5 de campagne
- Mode libre picker 4P (bouton discret) OK mais expansion 3-4P pas intégrée dans le picker splash
- CLAUDE.md pas à jour sur les modes
- Achievements/spectres pas encore liés aux étoiles campagne (v1.1 future)
- Pas de skeleton variants par avatar (unifié sur skeleton_generic)
- Sons dédiés fin campagne/run manquants (utilise audio.combo générique)

### Points à tester côté user

1. Les 38 niveaux sont-ils jouables et finissables pour Milan 8 ans ?
2. La rampe 4-3 "Boucle infinie" fonctionne-t-elle comme prévu ?
3. Le mode run 180s est-il équilibré (score atteignable, tension sans stress) ?
4. Aucune régression sandbox ?
5. Settings modal clean en campagne ?
6. Trampoline + fan catapulte fiable ?

## Conventions rappel

- **1 commit atomique par feature** + push immédiat ✓
- **Build systématique** avant commit ✓
- Bundle : pas de contrainte stricte (user a libéré)
- Agent models : qa-tester haiku, feature-dev sonnet, spec-writer opus
- Pas de commentaires superflus, pas de console.log en prod

## Plan de référence

`/Users/mike/.claude/plans/ne-me-mets-pas-keen-kahn.md` — plan game design complet approuvé, phases A+B+C+D+E implémentées. Seules F (retirements) et G (polish final) restent partiellement.

## État tasks

Tasks #16-43 complétées. Backlog en notes ci-dessus.

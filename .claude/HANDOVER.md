# Handover — Milan Lava Park (2026-04-21 fin session C / début session D)

## État live

- URL : https://michaelchevallier.github.io/lava_game/
- Branche `main` : commit `80e7454` pushé, CI auto-deploy en cours
- Bundle : ~95 KB gz game + 67 KB kaplay
- **43 niveaux** campagne (5⭐/niveau = 129 total possible)
- **24 spectres** en 6 catégories × 4
- **40 VIP** avec contrats quotidiens, seed déterministe
- **Musée** 6 onglets : Médailles, Records, Spectres, Runs, Almanach, Boutique

## ✅ Sessions précédentes — récap

### Session A (Sprint 0 + 1, 3 commits)
- `7eb66a8` Sprint 0 : cleanup 4P → 1-2P max
- `acfc188` Sprint 1.1 : wire hooks geyser/constellation/metronome/magnetField
- `8fe062a` Sprint 1.2 : +5 niveaux Monde 6

### Session B (Sprint 2, 4 commits)
- `276a633` Sprint 2.1 : 43 prédicats platine
- `71d426c` Sprint 2.2 : speedrun records top 3 foyer
- `fded35d` Sprint 2.3 : Musée 5 onglets sur splash
- `6d0ab7c` Sprint 2.4 : refonte spectres 6×4 catégories

### Session C (Sprint 3, 6 commits) — cette session
- `ce70578` **Sprint 3.1** : parc sandbox persistant
  - `save.sandboxLayout` auto-save chaque 10s en mode sandbox
  - Chargé au `k.scene("game")` sandbox (k.wait 0.1)
  - Bouton "Parc vierge" dans settings (double-clic confirm)
- `ed41498` **Sprint 3.2** : pool 40 VIP
  - `src/vips.js` (824 L) — 20 archetypes × 2 moods, 1-2 contrats chacun
  - Schéma contract : `{summary, objectives[], failOn?, forbidTools?,
    wagonLimit?, tileBudget?, timeLimit?, reward, testimonial}`
  - Utilise les 13 types campaign (skeleton, coin, catapult, loop, apocalypse,
    chain, constellation, metronome, magnetField, geyser, portalUse, wagon, score)
- `e9aa131` **Sprint 3.3** : seed journalière
  - `src/contracts.js` (187 L) — `todayKey()`, `mulberry32()` seedé,
    `pickDailyVips()` filtre pool vu <7j, `ensureVipToday()` init boot
  - `createContractRunner({k,save,showPopup,...})` : start/progress/
    onToolPlaced/onWagonSpawned/tick, fail sur forbid/forbidTools/budget/
    timeLimit/wagonLimit, win → +tickets + almanac + vipHistory
  - `save.vipToday = {date, vips: [{vipId, contractIdx, honored, failed}]}`
- `cb5b7d9` **Sprint 3.4** : écran "Aujourd'hui au parc"
  - Bandeau splash cliquable en haut (sous le titre)
  - `src/vip-screen.js` overlay 3 cartes contrat → bouton "Honorer"
  - Propagation `router.enter({...,contractEntry})` → scene sandbox crée
    `window.__contract = contractRunner`
  - **15 call sites progress() doublés** via sed regex :
    `window.__campaign?.progress?.("X")` → `...; window.__contract?.progress?.("X")`
  - wagon-vfx humans>1 + onTileEvent + onWagonSpawned hooks ajoutés
- `10d74a5` **Sprint 3.5** : tickets + boutique
  - `src/shop.js` : TILE_PRICES (9 tuiles), SKINS (4 : golden/obsidian/neon/spectre),
    buyTile/buySkin/setActiveSkin/getSkinTheme
  - tiers.js `isUnlocked()` respecte `save.ticketUnlocks`
  - wagons.js applique `getSkinTheme(save)` si activeSkin
  - museum.js nouvel onglet 🎫 Boutique + onglet renommé 📜 Almanach
- `80e7454` **Sprint 3.6** : almanach
  - `src/almanac.js` (34 L) — pushAlmanacEntry, getUnreadCount, markAllRead,
    listByVip, totalTicketsEarned
  - `save.almanacUnread` counter
  - Badges rouges sur onglet Almanach musée + bouton 🏆 Musée splash
  - Auto-read à l'ouverture de l'onglet

## ➡️ PROCHAINE SESSION = SPRINT 4 (nouvelles mécaniques puzzle)

Plan officiel intact : `/Users/mike/.claude/plans/ne-me-mets-pas-keen-kahn.md` sections Sprint 4.

**Estimation** : 8h, 3 commits atomiques. Ordre : **visitor → bomb → alarm**.

### 4.1 Objectif `visitor` (2h)
Dans campaign `OBJECTIVE_TYPES`, ajouter `visitor: { hookName: "onVisitorBoard" }`.
Dans `levels.js`, field `visitors: [{col, row}]`. Spawn à `loadLevel`.
Collision wagon < 24px + `wagon.passengers.length < 4` → visitor boards,
`progress("visitor")`.

**Niveaux exemples** : 6-3 Ramassage (3 visiteurs à embarquer), 7-2 VIP transport (failOn skeleton).

**Fichiers** :
- `src/campaign.js` : ajouter "visitor" dans counts + objective matching
- `src/levels.js` : field `visitors` dans loadLevel, 2 niveaux
- `src/wagons.js` : collision check wagon+visitor dédiée

### 4.2 Tuile `bomb` (3h)
Nouveau TILE_CODE (ex `E` pour "explosive"). Lava qui s'étend au contact d'un
wagon : au touch, la tuile bomb + ses 4 voisines deviennent lava permanente.
Sprite anim timer (mèche).

**Niveaux exemples** : 6-8 Champ de mines (bombs pré-placées à éviter), 7-5 Cascade explosive.

**Fichiers** :
- `src/constants.js` : TILE_CODE ajouter "bomb" → "E"
- `src/sprites.js` : SPR_BOMB + anim mèche
- `src/tiles.js` : handler placement + collision expand
- `src/levels.js` : 2 niveaux

### 4.3 Tuile `alarm` (3h)
Nouveau tile avec variant (flood/freeze/wind). Après N secondes (configurable
dans level def), déclenche événement global :
- `flood` : toutes les lave deviennent eau pendant 5s
- `freeze` : tous les wagons ralentis 3s
- `wind` : push tous wagons vers la droite 2s

**Niveaux exemples** : 6-9 Alarme ! (flood après 30s), 7-6 Compte à rebours (freeze après 15s).

**Fichiers** :
- `src/tiles.js` : tile alarm + countdown timer + event dispatch
- `src/wagons.js` : appliquer freeze/wind sur wagons
- `src/levels.js` : 2 niveaux

### Commits Sprint 4 (atomiques)
1. `feat(tiles): objectif visitor + niveau 6-3 Ramassage`
2. `feat(tiles): tuile bomb explosive + niveaux 6-8, 7-5`
3. `feat(tiles): tuile alarm flood/freeze/wind + niveaux 6-9, 7-6`

## ⚠️ Dette technique à traiter AVANT Sprint 4

**`src/main.js` = 1721 lignes** (seuil CLAUDE.md = 1500, bloquant).
Refactor suggéré :
- Extraire `src/contract-setup.js` (bloc contractRunner creation dans scene game, ~30 L)
- Extraire `src/sandbox-init.js` (layout persist + buildDemoCircuit + loadParkFromCode, ~50 L)
- Extraire `src/sky-setup.js` (déjà flagué dans backlog polish existant)

Cible : `main.js < 1500 lignes` avant d'ajouter 3 nouvelles tuiles + niveaux.

## Décisions validées (rappel)

| Sujet | Décision |
|---|---|
| Ordre sprints | 0 → 1 → 2 → 3 → 4 (séquentiel) ✅ 0/1/2/3 done |
| Audience | Milan + père/adulte, max 2 joueurs ✅ |
| Platine | Pré-écrites par niveau (43 prédicats) ✅ |
| Parc persistant | Oui, localStorage ✅ |
| Spectres | Refonte 6×4 catégories ✅ |
| Pool VIP | 40 personas ✅ |
| Tickets | Débloquent tuiles + skins ✅ |
| Seed VIP | Déterministe par date, rotation 7j ✅ |
| Sprint 4 ordre | Visitor → Bomb → Alarm |

## ⚠️ À valider en QA live

Sprint 3 en prod jamais testé foyer :
- **Flow splash → bandeau VIP → pick contrat** : cliquable, 3 cartes visibles, Honorer lance sandbox avec contrat
- **Runner événements** : faire un `skeleton` en sandbox contractée → progress compte, win déclenche popup + +tickets
- **Seed déterministe** : même date = mêmes 3 VIPs (vérifier avec `localStorage.clear()` + reload → 3 VIP nouveaux, puis reload sans clear → mêmes 3)
- **Boutique** : +8 tickets (via un honored contract) → Skin dispo à l'achat → équiper → wagon change de couleur
- **Parc persistant** : placer 10 tuiles → rouvrir tab/reload → tuiles reviennent
- **Parc vierge bouton** : double-clic confirm, clear complet

Sprint 2 niveaux Monde 6 toujours non testés :
- **6-3 Cascade fatale**, **6-4 Yin Yang infini**, **6-5 Métronome infernal**

Agent `qa-tester` peut tester en live.

## Conventions rappel

- 1 commit atomique par feature + push immédiat (push main autorisé)
- Build systématique avant commit (`npm run build`)
- Agent models : qa-tester haiku, feature-dev sonnet, spec-writer opus
- Pas de `console.log` prod, pas de commentaires superflus
- **Si `main.js > 1500 lignes`, refactorer avant d'ajouter** (⚠️ on est à 1721)

## Docs de référence

- `/Users/mike/.claude/plans/ne-me-mets-pas-keen-kahn.md` — PLAN OFFICIEL (5 sprints)
- `.claude/CREATIVE_NEXT.md` — synthèse unifiée
- `.claude/creative-puzzles.md` — détails puzzles (Sprint 4)
- `.claude/creative-carteblanche.md` — détails VIP (Sprint 3 fait)
- `.claude/creative-progression.md` — détails métagame (Sprint 2 fait)

## Fichiers Sprint 3 créés/modifiés

**Nouveaux** :
- `src/vips.js` (824 L, 40 personas)
- `src/contracts.js` (187 L, runner + seed)
- `src/vip-screen.js` (129 L, overlay 3 cartes)
- `src/shop.js` (110 L, prices + skins)
- `src/almanac.js` (34 L, helpers unread)

**Modifiés** :
- `src/splash.js` (bandeau VIP + badge unread Musée)
- `src/main.js` (load/persist sandbox, ensureVipToday, contractRunner hook, 15 progress dispatches, reset contract au scene start) — **1721 L**
- `src/settings-modal.js` (bouton "Parc vierge")
- `src/serializer.js` (save.sandboxLayout, tickets, almanac, vipToday, vipHistory, ownedSkins, activeSkin, ticketUnlocks migration)
- `src/museum.js` (onglet Boutique, onglet Almanach reworké, unread badge)
- `src/tiers.js` (isUnlocked respecte ticketUnlocks)
- `src/wagons.js` (apply skin theme)
- `src/wagons.js` + `src/tiles.js` + `src/constellation.js` + `src/wagon-vfx.js` (15 call sites doublés pour dispatcher contract)

## Pour démarrer la prochaine session (D)

1. Lire ce fichier (`.claude/HANDOVER.md`)
2. Lire plan officiel sections Sprint 4
3. **Refactorer main.js d'abord** → viser <1500 L avant d'ajouter bomb/alarm
4. Puis 4.1 → 4.2 → 4.3 avec commits atomiques
5. Push immédiat après chaque commit pour CI

Prompt suggéré pour session D :
```
Session D — Sprint 4 (nouvelles mécaniques puzzle : visitor → bomb → alarm).
Auto mode full, aucune validation intermédiaire, pousse sur main à chaque commit.

Lis .claude/HANDOVER.md puis /Users/mike/.claude/plans/ne-me-mets-pas-keen-kahn.md
sections Sprint 4.

Ordre d'exécution strict :
  4.0 → refactor main.js < 1500 L (extraire contract-setup, sandbox-init,
        sky-setup ou autre) — commit dédié avant tout ajout
  4.1 → objectif visitor + 2 niveaux (6-3 Ramassage, 7-2 VIP transport)
  4.2 → tuile bomb + 2 niveaux (6-8 Champ de mines, 7-5 Cascade explosive)
  4.3 → tuile alarm flood/freeze/wind + 2 niveaux (6-9, 7-6)

1 commit atomique par step + push immédiat. npm run build avant chaque commit.
Décide seul sur la sensibilité des objectifs (combien de visiteurs, rayon
d'explosion, durée des alarmes). Vise "lisible pour Milan 8 ans" ET "cohérent
avec l'esthétique/physique existante".

Si tu rencontres une décision ambiguë : tranche dans le sens de l'existant
(patterns levels.js, TILE_CODE convention, collision wagon 24px) et note
le choix dans le message de commit.

en autonomie totale
```

# Handover — Milan Lava Park (2026-04-21 fin session B / début session C)

## État live

- URL : https://michaelchevallier.github.io/lava_game/
- Branche `main` : commit `6d0ab7c` pushé, CI auto-deploy en cours
- Bundle : ~84 KB gz game + 67 KB kaplay
- **43 niveaux** campagne (5⭐/niveau = 129 total possible)
- **24 spectres** en 6 catégories × 4 (refonte Sprint 2.4)
- **Musée** accessible depuis splash (bouton 🏆)

## ✅ Sessions précédentes — récap

### Session A (Sprint 0 + 1, 3 commits)
- `7eb66a8` Sprint 0 : cleanup 4P → 1-2P max
- `acfc188` Sprint 1.1 : wire hooks geyser/constellation/metronome/magnetField
- `8fe062a` Sprint 1.2 : +5 niveaux Monde 6

### Session B (Sprint 2, 4 commits)
- `276a633` Sprint 2.1 : **43 prédicats platine** (contraintes premium par niveau)
  - `levels.js` : chaque niveau a `platinum: { label, check(r) }`
  - `campaign.js` : tracke `counts` (skeleton, coin, catapult, loop, apo, chain, geyser, metronome...) + `toolsUsed` via `onTileEvent(tool)`
  - `campaign-result.js` : révélation dorée animée si 3⭐ + platine, label visible si 3⭐ sans platine, blurry "???" sinon
- `71d426c` Sprint 2.2 : **speedrun records top 3 foyer**
  - `save.campaign.records[levelId]` = `[{ avatar, time, tiles, date }]` trié par temps
  - Bannière "🥇 NOUVEAU RECORD" sur écran résultat
  - 3 lignes médaillées avec avatar coloré par carte niveau dans le menu campagne
- `fded35d` Sprint 2.3 : **Musée** (`src/museum.js`)
  - Bouton 🏆 sur splash
  - 5 onglets : Médailles (grille 43 niveaux par palier bronze/argent/or/platine), Records (leaderboard par monde), Spectres (réplique carnet), Runs (top 5 par avatar), VIP (placeholder Sprint 3)
- `6d0ab7c` Sprint 2.4 : **refonte spectres 6×4 catégories**
  - `spectres.js` rebuild : `SPECTRE_CATEGORIES` × 6, `ALL_SPECTRES` flat lookup, titres auto-débloqués par catégorie complète (Pyromancien, Virtuose, Sprinter, Trésorier, Architecte, Explorateur)
  - `migrateSpectres(save)` convertit ancien bitmask numérique en `{ cat: { spectreId: true } }`
  - `unlock(idOrNum)` accepte string OU numéro legacy
  - 18 call sites refactorés (wagons, tiles, main, campaign, run, etc.)

## ➡️ PROCHAINE SESSION = SPRINT 3 (VIP narratif + persistance)

Plan officiel intact : `/Users/mike/.claude/plans/ne-me-mets-pas-keen-kahn.md` sections Sprint 3.

**Estimation** : 14-16h, 6 commits atomiques. C'est le plus gros sprint. Beaucoup d'écriture (40 personas VIP).

### 3.1 Parc sandbox persistant (2h)
`save.sandboxLayout` sauvegardé auto chaque 10s en sandbox. Chargé au prochain lancement sandbox. Bouton "Parc vierge" dans settings pour reset.

**Fichiers** :
- `src/main.js` : hook dans sandbox mode setup, `k.loop(10, () => { save.sandboxLayout = serializeTiles(tileMap, ...); persistSave(save); })`
- `src/settings-modal.js` : bouton "Parc vierge"
- `src/serializer.js` : init `save.sandboxLayout = null`

### 3.2 Pool 40 VIP (4-5h)
Nouveau `src/vips.js` avec 40 personas. Schéma :
```js
{
  id: "ginette",
  name: "Mémé Ginette",
  age: 63,
  personality: "aventurière mais pudique",
  likes: ["squelettes"],
  dislikes: ["loopings"],
  contracts: [
    {
      objectives: [{ type: "skeleton", target: 3 }],
      failOn: { loop: 1 },
      reward: 2,
      testimonial: "Trois frissons, aucune voltige : parfait !"
    },
  ],
}
```

Cible : 20 personnalités × 2 moods = 40. Chaque VIP a 1-3 contrats.

**Astuce** : pour aller vite, utiliser agent `spec-writer` (opus) pour générer les 40 personas en batch, puis `feature-dev` (sonnet) pour wire l'intégration.

### 3.3 Seed journalière (2h)
- `new Date().toISOString().slice(0, 10)` → seed
- Pool VIP non-vus dans les 7 derniers jours
- Shuffle déterministe (mulberry32 ou similar)
- 3 tirés stockés dans `save.vipToday = { date, vips: [...] }`

**Fichiers** :
- `src/contracts.js` (nouveau) : logique évaluation contrat
- `src/main.js` : init pool au boot

### 3.4 Écran "Aujourd'hui au parc" (3h)
Sur splash, carte en-dessous des modes : "📅 Aujourd'hui au parc — 3 VIP t'attendent". Clic → écran dédié avec 3 cartes contrats.

**Fichiers** :
- `src/splash.js` : nouvelle carte mode
- `src/vip-screen.js` (nouveau) : rendu 3 contrats
- Entrée en sandbox avec contrat actif

### 3.5 Tickets d'or économie (2h)
- `save.tickets = 0` au départ
- VIP honoré → +1 à +3 tickets
- Tickets débloquent **tuiles avancées** (au départ seul lava/water/rail/coin/erase en sandbox) :
  - rail_loop : 5 tickets
  - portal : 8 tickets
  - magnet : 10 tickets
  - bridge : 6 tickets
  - tunnel : 12 tickets
- **Skins** : 3-4 skins wagon à 8 tickets (golden, obsidienne, néon, spectre)

**Fichiers** :
- `src/tickets.js` (nouveau) : économie
- `src/tiers.js` : refondu pour prendre tickets en compte ou désactivé
- `src/museum.js` : nouvel onglet "Boutique"

### 3.6 Almanach témoignages (2h)
- `src/almanac.js` (nouveau)
- À chaque VIP contrat gagné : `save.almanac.push({ vipId, date, testimonial, stars })`
- Nouvel onglet Musée "Almanach" avec cartes visage + phrase + date

### Commits Sprint 3 (atomiques)
1. `feat(sandbox): parc persistant entre sessions`
2. `feat(vips): pool 40 VIP avec personas + contrats`
3. `feat(vips): seed journalière 3 contrats/jour`
4. `feat(vips): écran "Aujourd'hui au parc" sur splash`
5. `feat(tickets): économie + boutique tuiles & skins`
6. `feat(almanac): témoignages post-victoire`

## Décisions validées (rappel)

| Sujet | Décision |
|---|---|
| Ordre sprints | 0 → 1 → 2 → 3 → 4 (séquentiel) ✅ 0/1/2 done |
| Audience | Milan + père/adulte, max 2 joueurs ✅ |
| Platine | Pré-écrites par niveau (43 prédicats) ✅ |
| Parc persistant | Oui, localStorage (Sprint 3) |
| Spectres | Refonte 6×4 catégories ✅ |
| Pool VIP | 40 personas (Sprint 3) |
| Tickets | Débloquent tuiles + skins (Sprint 3) |

## ⚠️ À valider en QA live (reporté Sprint 3)

Niveaux Monde 6 n'ont jamais été testés en prod :
- **6-3 Cascade fatale** : la cascade pose-t-elle vraiment un bridge temporaire traversable sans skeletiser ? `failOn skeleton: 1` est strict.
- **6-4 Yin Yang infini** : 1 wagon fait-il 3 cycles atteignables en 150s ?
- **6-5 Métronome infernal** : metronome trigger bien détecté sur wagon catapulté ?

Agent `qa-tester` (haiku) peut tester en live.

## Conventions rappel

- 1 commit atomique par feature + push immédiat (push main autorisé)
- Build systématique avant commit (`npm run build`)
- Agent models : qa-tester haiku, feature-dev sonnet, spec-writer opus
- Pas de `console.log` prod, pas de commentaires superflus
- Si `main.js > 1500 lignes`, refactorer avant d'ajouter

## Docs de référence

- `/Users/mike/.claude/plans/ne-me-mets-pas-keen-kahn.md` — **PLAN OFFICIEL** (5 sprints)
- `.claude/CREATIVE_NEXT.md` — synthèse unifiée
- `.claude/creative-puzzles.md` — détails puzzles (Sprint 1+4)
- `.claude/creative-carteblanche.md` — détails VIP (Sprint 3, 437L)
- `.claude/creative-progression.md` — détails métagame (Sprint 2, déjà implémenté)

## Fichiers cibles Sprint 3

**Nouveaux** :
- `src/vips.js` (40 personas)
- `src/contracts.js` (logique évaluation)
- `src/almanac.js` (témoignages)
- `src/tickets.js` (économie)
- `src/vip-screen.js` (écran "Aujourd'hui")

**Modifiés** :
- `src/splash.js` (carte "Aujourd'hui au parc")
- `src/main.js` (init pool VIP, hook sandbox persistence)
- `src/serializer.js` (save.sandboxLayout, save.vipToday, save.tickets, save.almanac)
- `src/settings-modal.js` (bouton "Parc vierge")
- `src/museum.js` (onglet Almanach + onglet Boutique, remplacer placeholder VIP)
- `src/tiers.js` (interaction avec tickets)

## Pour démarrer la prochaine session (C)

1. Lire ce fichier (`.claude/HANDOVER.md`)
2. Lire plan officiel sections Sprint 3
3. **Commencer par 3.1** (parc persistant, le + chirurgical)
4. **Déléguer 3.2** (40 personas VIP) à spec-writer opus → feature-dev sonnet pour l'intégration
5. Enchaîner 3.3 → 3.4 → 3.5 → 3.6 avec commits atomiques
6. Push immédiat après chaque commit pour CI

Prompt suggéré pour session C :
```
Session C — Sprint 3 (VIP narratif + persistance). Auto mode full, aucune
validation intermédiaire, pousse sur main à chaque commit.

Lis .claude/HANDOVER.md puis /Users/mike/.claude/plans/ne-me-mets-pas-keen-kahn.md
sections Sprint 3.

Ordre d'exécution strict :
  3.1 → parc sandbox persistant
  3.2 → pool 40 VIP (déléguer à spec-writer + feature-dev)
  3.3 → seed journalière 3 contrats/jour
  3.4 → écran "Aujourd'hui au parc"
  3.5 → tickets + boutique
  3.6 → almanach témoignages

1 commit atomique par step + push immédiat. npm run build avant chaque commit.
Décide seul sur les personas VIP, les contrats, les récompenses, les témoignages.
Vise "fun et varié" (20 personnalités × 2 moods).

Si tu rencontres une décision ambiguë : tranche dans le sens de l'existant
(style code, patterns déjà utilisés dans splash/campaign-menu/museum) et note
le choix dans le message de commit.

en autonomie totale
```

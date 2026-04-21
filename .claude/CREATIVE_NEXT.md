# CREATIVE_NEXT — Plan unifié post-refonte (2026-04-21)

Synthèse de 3 agents opus lancés en parallèle :
- `.claude/creative-puzzles.md` (780L) — audit mécaniques + 15 niveaux + 5 puzzles génie
- `.claude/creative-carteblanche.md` (437L) — vision "LE PARC PARLE" + éditeur + règles Baba-lite
- `.claude/creative-progression.md` (612L) — métagame 4 couches + spectres refondus + daily

## Diagnostic convergent des 3 agents

Les 3 docs pointent le MÊME problème sous 3 angles :
- Agent 1 : *"Plus de 60% du moteur sandbox n'entre jamais dans un puzzle"* (mécaniques gaspillées)
- Agent 2 : *"Le joueur résout les 38 niveaux une fois puis plus rien n'a de texture. Pas d'auteur, pas d'écho, Milan ne peut rien raconter à son père"*
- Agent 3 : *"La campagne est un tunnel linéaire fermé. Session 10 = <5% retour"*

**Le vrai manquant** : pas du contenu de plus, mais **une raison de revenir**. Les 3 solutions proposées attaquent ça différemment :
- Agent 1 : plus de puzzles avec mécaniques variées (scope vertical, 14h dev)
- Agent 2 : une boucle narrative (VIP contrats tickets) (scope horizontal, 10-14h dev)
- Agent 3 : une couche méta au-dessus du contenu existant (scope externe, 8-12h dev)

**Observation clé** : Agent 3 (métagame) est le **multiplicateur** des deux autres. Sans fierté visible (Musée), ni contrats (Agent 2), ni nouveaux niveaux (Agent 1) n'ont d'écho. Avec Musée + Records, **chaque ajout de contenu produit un nouveau point de fierté à conquérir**.

## Plan unifié proposé — 5 sprints

### SPRINT 1 — Quick wins puzzles (4h)
*Agent 1 Priorité 1. ROI max absolu.*

Items :
1. **Wire hooks combos manquants** (~15L) — `progress("geyser")`, `progress("constellation")`, `progress("metronome")`, `progress("magnetField")`. Les détecteurs tournent à vide depuis toujours.
2. **+5 niveaux Monde 6** (pure data, 0 nouveau code) :
   - 6-1 Le pont chancelant (force bridge)
   - 6-2 Tunnel maléfique (force tunnel)
   - 6-10 Cascade fatale (force cascade)
   - 6-14 Yin Yang infini (vortex magnet+portal)
   - 6-15 Métronome (x2 score 3s)

**Livre** : 5 niveaux de qualité sans refacto. Exploite 60% du moteur qui dormait.

---

### SPRINT 2 — Métagame socle (6-8h)
*Agent 3 Couches 1 + 3 + 4. Le multiplicateur.*

Items :
1. **Médailles Platine** (S, ~2h) — prédicat caché par niveau (ex: 1-1 en <12s, 3-8 APOCALYPSE sans boost). +38 objectifs cachés sans écrire un seul nouveau niveau. Affiché en contour doré flou sur résultat + grid.
2. **Speedrun Records foyer** (M, ~3h) — top 3 par niveau cross-avatar (pas par avatar). Compétition familiale naturelle. Affichage sur campaign-menu à côté de chaque niveau : "Papa 00:23 · Milan 00:31 · ?".
3. **Musée / Trophy Room** (M, ~3h) — écran splash bouton "🏆 Musée". Affiche :
   - Médailles (bronze/argent/or/platine par niveau, total)
   - Records speedrun (top 3 par niveau)
   - Meilleurs runs arcade par avatar
   - Spectres collectés
   - Défis journaliers validés (streak)
   **Fierté visible centralisée** — l'antidote au terminal state.

**Livre** : +3-6h engagement pur sur le contenu existant. Rétention session 10 : 5% → 25% estimé.

---

### SPRINT 3 — Contrats VIP narratif (10-14h)
*Agent 2 Direction A (LA recommandation centrale de l'agent 2).*

Items :
1. **Pool 40 VIP nommés** en data JS (`src/vips.js`) — nom, âge, caractère, pref/aversion tuiles, 2-3 lignes de témoignage.
2. **Seed journalière** → 3 contrats tirés par jour (cooldown 7 jours sans répéter).
3. **Écran "Aujourd'hui au parc"** sur splash — 3 cartes contrats avec VIP + objectif + contrainte + récompense Tickets.
4. **Contrat = mini-niveau** : layout perso du joueur + objectif imposé + failOn contrainte. Résout dans le sandbox (= sandbox-avec-missions).
5. **Tickets d'Or** (monnaie) — débloquent tuiles avancées (rail_loop coûte 5, portal 8, magnet 10).
6. **Almanach témoignages** (HTML overlay) — 1 témoignage = 1 VIP satisfait. **Pas de fluff** : chaque ligne est le RÉSULTAT d'une victoire joueur, pas auto-généré. Stocké dans localStorage.
7. **Parc persistant** : `save.sandboxLayout` conservé entre sessions.

**Livre** : réponse claire à "pourquoi revenir demain" → voir les VIP du jour + finir l'almanach. Fusion naturelle des 3 modes.

---

### SPRINT 4 — Nouvelles mécaniques puzzle (8h)
*Agent 1 Priorité 2. Enrichissement contenu.*

Items :
1. **Objectif `visitor`** (M, ~50L) — faire monter N visiteurs à bord. Utilisation dans 3 niveaux (6-3 Ramassage, 6-7 Exigeante, 7-2 VIP transport).
2. **Tuile `bomb`** (M, ~60L) — lava qui s'étend au contact. 3 niveaux (6-8, 7-5, 7-9).
3. **Tuile `alarm`** (M, ~70L) — événement temporel (flood/freeze/wind après N secondes). 3 niveaux (6-9, 7-6, 7-10).

**Livre** : +10 niveaux qui exploitent des mécaniques fraîches. Monde 6 complet, Monde 7 amorcé.

---

### SPRINT 5 — Éditeur + partage (6-8h)
*Agent 2 Direction B. Le "jeu social".*

Items :
1. **Écran éditeur** (recyclé de campaign-menu + toolbar + écran paramètres défi).
2. **Serializer v3:** extension header `v3:skel3|t5|w2||<layout>` avec objectif + budget.
3. **URL param `?park=<btoa>`** → ouvre directement le défi, skip splash.
4. **12 défis baked-in** signés "Milan Lava Park Team".
5. **Galerie locale** défis reçus avec statut résolu/en cours.

**Livre** : le parc devient objet social. Milan construit "un parc pour Papa" → SMS avec URL → papa joue sans install.

---

## Priorisation recommandée

**Si ressources limitées** : **Sprint 1 + Sprint 2 = 10-12h** livre **5 niveaux + métagame complet + Musée**. C'est la transformation la plus rentable.

**Si ambition moyenne** : **Sprint 1 + 2 + 3 = 20-26h** livre aussi **la boucle VIP narrative**. Le jeu passe de "bon jeu fini" à "jeu vivant qu'on ouvre chaque jour".

**Si ambition max** : les 5 sprints = **34-42h** livre un jeu complet avec éditeur social + mécaniques riches.

## Mes recommandations opinionated

### Ordre non négociable
Sprint 1 AVANT tout autre. Coût 4h, débloque 5 niveaux gratuitement. Ne pas remettre à plus tard.

### Trade-off Sprint 2 vs Sprint 3
**Sprint 2 (métagame) d'abord** pour 2 raisons :
1. Le Musée amplifie TOUT ce qu'on ajoute ensuite (y compris les VIP du Sprint 3).
2. Les médailles platine ré-activent la campagne existante INSTANTANÉMENT (38 niveaux × re-tentative = 3h d'engagement sans rien produire).

Sprint 3 (VIP contrats) est plus **spectaculaire** mais plus coûteux et risqué (écrire 40 personas, équilibrer contrats, gérer persistance).

### Ce qu'on écarte volontairement
- **NG+ Mode Héroïque** (Agent 3 Couche 2) — reporté en Sprint 6+. Pas prioritaire tant que la base métagame n'est pas là.
- **Refonte spectres en 6×4 catégories** (Agent 3 Couche 3) — reporté. Les spectres actuels sont du noise, mais les remplacer demande UI nouvelle + migration save.
- **Règles Baba-Is-You lite** (Agent 2 Direction C) — reporté en Sprint 7+. Trop ambitieux comme first-of-its-kind dans ce projet.
- **Multijoueur relais** (Agent 3 Multi) — reporté. Le 4P cosmétique actuel n'est pas un problème vital.

## Pitfalls rappelés par les agents

- `k.color(colorObj)` crash → toujours `k.color(r, g, b)` 3 args (déjà connu CLAUDE.md)
- `obj.use(k.sprite())` crash → `obj.sprite = "name"` direct
- Les contrats VIP ne doivent PAS générer de texte auto sans victoire (user a rejeté les avis auto)
- L'éditeur de niveau doit rester minimaliste (pas une UI Mario Maker complète)

## Livrables par sprint

| Sprint | Fichiers créés | Fichiers modifiés | Commits |
|---|---|---|---|
| 1 | — | `main.js` (hooks), `levels.js` (+5 niveaux), `campaign.js` | 2-3 |
| 2 | `src/museum.js`, `src/speedrun.js` | `splash.js`, `levels.js`, `serializer.js`, `hud.js` | 3-5 |
| 3 | `src/vips.js`, `src/contracts.js`, `src/almanac.js` | `splash.js`, `main.js`, `serializer.js` | 6-8 |
| 4 | — | `campaign.js`, `wagons.js`, `tiles.js`, `levels.js` | 3-4 |
| 5 | `src/editor.js`, `src/share.js` | `serializer.js`, `splash.js` | 4-5 |

## À valider avec le user avant implémentation

1. **OK pour commencer par Sprint 1 + 2** (quick wins + métagame) ? Ou tu préfères attaquer direct Sprint 3 VIP (narratif plus sexy mais plus coûteux) ?
** Go pour faire dans l'ordre
2. **Scope final** : 2 sprints / 3 sprints / 5 sprints — où on s'arrête ?
** on fait tout
3. **Platine** : garde-t-on le concept "contrainte secrète révélée après 3⭐" ou c'est trop complexe pour Milan 8 ans ?
** vasy c'est rigolo
4. **Éditeur** (Sprint 5) : priorité haute (c'est ce qui rend le jeu social) ou basse (on s'en fout pour v1) ?
** je me rends pas compte de la complexité qui est a évaluer. Ça reste un petit jeu pour le fils de mon pote. on est pas en train de chercher a faire un jeu viral.

---

*Les 3 docs source restent disponibles pour plonger dans les détails :*
- `.claude/creative-puzzles.md` — design de tous les niveaux + spec nouvelles mécaniques
- `.claude/creative-carteblanche.md` — pitch complet "LE PARC PARLE" + éditeur + Baba-lite
- `.claude/creative-progression.md` — détails métagame + spectres + daily + multi

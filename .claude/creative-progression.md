# Milan Lava Park — Designing the Metagame

> **Mission** : transformer 30 min de "je finis les 38 niveaux" en 10h de "encore un tour, je chasse ce truc".
> **Audience** : Milan (8 ans) et/ou son parent, solo ou 4P couch.
> **Contrainte** : pas de fluff cosmétique, pas de systèmes passifs. Tout doit être **agentique** — le joueur décide, cherche, conquiert.

---

## Partie 1 — Diagnostic rétention

La campagne 38 niveaux est aujourd'hui un **tunnel linéaire fermé**. Trois ruptures tuent la rétention :

**1. Terminal state explicite** — dès que 5-8 est battu, le joueur tombe dans un vide. Aucun écran lui dit "regarde ce que tu n'as pas encore". Les étoiles ⭐⭐⭐ sont affichées mais opaque : savoir qu'il en manque 12 ne dit pas lesquelles valent le re-jeu. La campagne se comporte comme un livre qu'on ferme.

**2. Triggers "encore une partie" absents** — Binding of Isaac, Vampire Survivors, Bloons TD, tous ont ce pattern : **la run précédente change la run suivante**. Milan rejoue 1-1 → exactement la même partie, même timer, même budget. Aucune variable à minimiser, aucune nouvelle contrainte, aucun leaderboard qui bouge. Le système Run Arcade 180s a ce potentiel mais ne l'active pas : hi-score local par avatar = comparaison faible (si tu joues toujours Mario, tu ne compares que Mario vs Mario, et le podium n'apparaît que sur splash).

**3. Spectres = loterie à actions obscures** — 29 badges avec des conditions style "pose exactement 0 pts" ou "4 joueurs simultanés". Le joueur ne les lit qu'une fois, les oublie, en débloque 3-4 par accident. Zéro fil narratif, zéro gradient de difficulté, zéro récompense différenciée. C'est du bruit à côté d'une vraie collection.

**Courbe actuelle** :

| Session | État émotionnel | Probabilité retour |
|---|---|---|
| 1 (0-40 min) | Découverte, dopamine régulière | 90% |
| 2 (wagons manuels maîtrisés) | "Je veux voir les mondes suivants" | 80% |
| 3-4 (monde 3-4) | "Ça devient dur, je reviens demain" | 60% |
| 5 (tous niveaux finis 1⭐) | "OK j'ai fini" | 25% |
| 6+ (chasse 3⭐) | Frustration sans objectif précis | 10% |
| Session 10 | Mort de l'engagement | <5% |

**Ce qui manque** : (a) un **écran de fierté** permanent (ce que j'ai conquis), (b) un **objectif du jour** qui invite à lancer 15 min, (c) une **progression qui déborde la campagne** (ex : NG+), (d) un **rival** (même asymétrique, même contre ton toi-d'hier).

La question n'est pas "comment ajouter du contenu" (38 niveaux c'est déjà beaucoup). C'est "comment donner une **raison** de rejouer le contenu existant".

---

## Partie 2 — Le METAGAME (4 couches)

Principe : chaque couche se **déverrouille naturellement** par le fait de jouer, et chacune **ré-injecte du sens** dans le contenu existant sans créer de nouveau contenu à produire.

### Couche 1 — Les MÉDAILLES (★ bronze / argent / or / platine par niveau)

**Ce que c'est** : en plus de l'étoile "finir" + "temps" + "budget" actuelle, chaque niveau accorde une **médaille** qui grade la performance globale.

- **Bronze** = finir le niveau (déjà acquis dès la 1ère étoile)
- **Argent** = 2⭐ (temps OU budget)
- **Or** = 3⭐ (temps ET budget)
- **Platine** = 3⭐ + une **contrainte secrète** cachée par niveau (exemple : 1-1 platine = finir en <12 s, 3-8 platine = APOCALYPSE sans boost posé, 4-3 platine = pas de portail détruit)

**Déverrouillage** : toutes les médailles bronze obtenues automatiquement au fil de la campagne. L'écran résultat affiche dès 1⭐ "Médaille platine : ???" avec un contour doré flou. Après avoir obtenu 3⭐, le contour se précise : "Platine : finis en <12s" (révélation graduée).

**Ce que ça apporte** :
- +38 objectifs cachés sans écrire un seul nouveau niveau
- Chaque niveau passe de "fini à 1⭐ = oublié" à "platine encore possible"
- La médaille platine est **affichée sur la grille de niveaux** (icône ★ dorée à côté du titre) → fierté visible
- Le joueur peut faire du cherry-picking : "ce soir je cherche 2 platines"

**Temps d'engagement ajouté** : 38 niveaux × 5 min moyenne de re-tentatives platine = **~3h** de gameplay "chasse médaille" pur.

**Impl** : `levels.js` → champ `platinum: { label: "Sous 12 secondes", check: (stats) => stats.time < 12 }`. Aucun nouveau contenu, juste des prédicats.

---

### Couche 2 — NG+ (Nouveau Jeu Plus = Mode Héroïque)

**Ce que c'est** : une fois 28 étoiles atteintes (= accès monde 5), un bouton "**Mode Héroïque**" apparaît sur le menu campagne. Rejouer n'importe quel niveau avec modificateurs cumulatifs :

- **wagonLimit × 0.6** (arrondi haut, min 1)
- **tileBudget −2** (min 1)
- **timeLimit × 0.75**
- **Aucun boost pré-placé dans layout** (les rail_up/down et lava pré-placés restent)

**Déverrouillage** : 28⭐ en normal (= fin monde 4). Mode Héroïque a sa propre comptabilité d'étoiles (38 × 3 = 114 étoiles supplémentaires). L'icône du monde sur la grille devient rouge quand tous ses niveaux sont 3⭐ en Héroïque.

**Ce que ça apporte** :
- **Double le temps de jeu** avec zéro nouveau contenu à produire
- Donne un sens au monde 5 : "c'est le filet de pêche aux experts"
- Le joueur qui a 3⭐ partout en normal n'est pas bloqué — il a un Everest visible
- Les 38 niveaux changent de saveur (ex : 2-10 APOCALYPSE avec 3 wagons au lieu de 5 = vraie réflexion)

**Temps d'engagement ajouté** : ~**6-10h** (pour ceux qui mordent au challenge). Ratio conversion estimé : 30% des joueurs qui finissent la campagne tenteront Héroïque, 10% iront au bout.

**Impl** : un flag `save.campaign.heroic = true` + dans `campaign.js` au loadLevel, si mode héroïque → multiplier les limites. UI : toggle bouton sur campaign-menu entre Normal / Héroïque, avec badges séparés. Les étoiles Héroïque sont rouges vs dorées.

---

### Couche 3 — SPEEDRUN local (chrono par niveau + ghost replay texte)

**Ce que c'est** : pour chaque niveau, un **chrono best time** est sauvé. L'écran résultat affiche "Ton meilleur : 14.3s" et "Record maison : 9.8s (Luigi, il y a 3j)". Pas de ghost visuel rejoué — mais un journal **"Podium du foyer"** :

- Top 3 meilleur temps par niveau, tous avatars confondus
- Nom avatar + date
- Badge 🏆 or pour le record d'un niveau sur la grille

**Déverrouillage** : actif dès qu'un niveau a 1⭐. La ligne "Record : 9.8s par Luigi" n'apparaît que si un *autre* avatar a déjà fini le niveau (enjeu rivalité foyer).

**Ce que ça apporte** :
- Transforme le 4-joueurs-cosmétique en **rivalité asymétrique** (frère vs frère sur le même niveau, pas en même temps)
- Crée du "nouveau contenu" pour le parent qui rejoue un niveau pour dépasser son enfant
- Leaderboard sans serveur, 100% client-side, persisté
- Speedrun est un genre à part entière qui fait tenir Mario 64 30 ans

**Temps d'engagement ajouté** : **2-4h** par membre du foyer qui mord à la compétition (x2-4 si multi-joueurs = effet multiplicateur naturel).

**Impl** :
```js
save.campaign.records = {
  "1-1": [
    { avatar: "mario",  time: 14.3, date: 1713715200 },
    { avatar: "luigi",  time:  9.8, date: 1713801600 },
    { avatar: "pika",   time: 12.1, date: 1713888000 },
  ],
  // ...
}
```
- `campaign-result.js` affiche 2-3 lignes de podium
- Grille niveaux affiche 🏆 si ce niveau a un record du foyer
- Trophy room globale (voir Couche 4)

---

### Couche 4 — LE MUSÉE DU PARC (trophy room visible)

**Ce que c'est** : une **page d'accueil dédiée** accessible depuis le splash, intitulée "Mon Parc". Structure :

```
┌─ MON PARC ──────────────────────────────────────┐
│                                                 │
│  🌟 ÉTOILES           [84 / 228]                │
│  ░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓                          │
│  Normal : 72/114   Héroïque : 12/114            │
│                                                 │
│  🏅 MÉDAILLES PLATINE [7 / 38]                  │
│  [1-1 ★] [1-4 ★] [2-3 ★] ...                    │
│                                                 │
│  👻 SPECTRES         [14 / 24] (voir §3)        │
│  Catégories : [Combos 3/4] [Vitesse 2/4]...     │
│                                                 │
│  🏆 RECORDS FOYER                               │
│  Niveau le plus rapide : 1-1 en 8.2s (Luigi)    │
│  Rival du jour : Mario bat Luigi 22 / 16        │
│                                                 │
│  📈 STATS CUMUL                                 │
│  Squelettes : 1,847                             │
│  Pièces : 3,410                                 │
│  Apocalypses : 12                               │
│  Tuiles posées : 8,920                          │
│                                                 │
│  🏷 TITRE ACTIF : "Maître du Feu"              │
│  Change ton titre → [Modifier]                  │
└─────────────────────────────────────────────────┘
```

**Déverrouillage** : accessible dès la 1ère partie. Contenu se remplit au fil du jeu.

**Ce que ça apporte** :
- **Rend visible l'invisible** : le joueur voit ses stats cumulées (ce que le save contient déjà !)
- Nourrit la fierté sans gameplay supplémentaire
- Centralise les 4 couches méta (étoiles, médailles, spectres, records) en **un écran unique** où chaque ligne est une invitation à rejouer
- Titres = cosmétique gratuit à débloquer (voir Partie 3)

**Temps d'engagement ajouté** : ~30 min directement (lecture + comparaison), mais surtout **multiplicateur** — les joueurs qui ont ce tableau rejouent +40% plus longtemps (tout jeu qui ajoute une "galerie" voit sa rétention 7-day grimper).

**Impl** : `src/museum.js` (~150L) — DOM overlay HTML, lit `save.campaign`, `save.spectres`, `save.heroes`, `save.records`, `save.stats` → rendering tableau. Bouton sur splash "MON PARC".

---

### Couche 5 (bonus, optionnelle) — LES CONTRATS HEBDO

**Ce que c'est** : chaque lundi (seed = semaine de l'année), **1 contrat** apparaît dans l'accueil :
- "Finis 5 niveaux cette semaine en 3⭐" → récompense : titre "Hebdomadaire"
- "Débloque 2 médailles Platine cette semaine"
- "Bats 3 records du foyer cette semaine"

**Déverrouillage** : toujours actif après 5⭐ totales.

**Ce que ça apporte** : rythme hebdo en plus du rythme quotidien. Plus lourd que daily, incite à un **retour de 3-4 sessions dans la semaine** vs 7 sessions daily.

**Temps d'engagement ajouté** : ~30 min / semaine × N semaines.

**Impl** : `save.weekly = { weekKey, contract, progress, claimed }`. Reset côté `quests.js` logic.

---

### Tableau récap couches

| Couche | Déclencheur | Heures ajoutées | Coût dev |
|---|---|---|---|
| 1. Médailles Platine | 1ère partie | 3h | S |
| 2. NG+ Héroïque | 28⭐ | 6-10h | M |
| 3. Speedrun / Records | 1 niveau fini | 2-4h × N joueurs | M |
| 4. Musée / Trophy room | 1ère partie | multiplicateur | M |
| 5. Contrats hebdo | 5⭐ | ~30 min/sem continu | S |

**Total estimé** : **15-25h de rétention supplémentaire** sur ~3 sprints de dev (4-6 jours).

---

## Partie 3 — Spectres re-designés

### Problème actuel

Les 29 spectres (indices 0-28 dans `spectres.js`) :
- Sont affichés en grille mais sans ordre thématique
- Mélangent trivial ("Jouer 5 min d'affilée", "Exporter un parc") et rare ("APOCALYPSE × 5")
- Zéro progression lisible : on ne sait pas "il me reste quoi dans la thématique X"
- Récompense unique = badge affiché (pas de cosmétique, pas de gameplay)

### Refonte : 6 catégories × 4 spectres = **24 slots**

Les 5 "spectres" triviaux (Nocturne, Matinal, Sociable, Mobile, Archiviste) sont **démotés en succès masqués** (inchangés techniquement mais déplacés vers un onglet "Notes" dans le carnet) — ils n'appartiennent pas à la collection principale.

### Les 6 tableaux

#### 🔥 **MAÎTRES DU FEU** (combos lava)
1. **L'Allumeur** — 25 squelettes cumul
2. **L'Incendiaire** — 100 squelettes cumul
3. **L'Apocalyptique** — Déclencher 5 APOCALYPSES
4. **Le Purgateur** — Une APOCALYPSE avec 1 seule tuile LAVE

→ Complétion = **Titre "Maître du Feu"** + palette rouge-orange débloque skins wagons

#### ⚡ **VIRTUOSES** (combos avancés)
5. **L'Aérien** — 10 catapultes (trampo+fan)
6. **L'Hydraulicien** — 5 geysers (eau sur fan)
7. **Le Magnétique** — 5 vortex (magnet adjacent portal)
8. **Le Constellier** — 1 Constellation spectrale (5 skel + portail)

→ Complétion = **Titre "Virtuose"** + bonus visuel trails sur wagons squelettes

#### 🚀 **SPRINTERS** (speedrun / vitesse)
9. **Le Speedy** — Finir un niveau en <10s
10. **L'Éclair** — Détenir 3 records foyer simultanés
11. **Le Marathonien** — 3⭐ sur 10 niveaux en une session
12. **Le Flash** — Finir 1-1 en moins de 7 secondes

→ Complétion = **Titre "Sprinter"** + chrono doré dans HUD campagne

#### 💰 **TRÉSORIERS** (économie / efficacité)
13. **L'Avare** — 500 pièces cumul
14. **Le Spartiate** — Finir 10 niveaux avec 0 tuile posée (au-dessus du budget layout)
15. **Le Platineur** — 10 médailles Platine
16. **Le Caissier** — 5000 pts cumul en Run arcade

→ Complétion = **Titre "Trésorier"** + pièces brillent 2× plus

#### 🎢 **ARCHITECTES** (sandbox / création)
17. **Le Bâtisseur** — Poser 50 tuiles en 1 run libre
18. **Le Forain** — Placer grande roue + chamboule + pêche dans même parc
19. **L'Archiviste** — Exporter 3 parcs différents (via modal)
20. **Le Remixer** — Importer puis modifier un parc (poser au moins 10 tuiles après import)

→ Complétion = **Titre "Architecte"** + débloque "Mode Puzzle Créateur" (le joueur crée un parc, génère un code objectif type "fais 5 squelettes ici" et partage)

#### 👻 **EXPLORATEURS** (secrets / événements rares)
21. **Le Pêcheur d'Or** — Canard doré au 1er lancer
22. **Le Chanceux** — JACKPOT à la roue de fortune
23. **Le Hanteur** — Spawn une Maison Hantée
24. **L'Horloger** — Revenir 7 jours consécutifs (streak 7)

→ Complétion = **Titre "Explorateur"** + splash nuit → aurores boréales animées

### Carnet re-designé

```
┌─ CARNET DES SPECTRES ───────────────────────────┐
│                                                 │
│  🔥 MAÎTRES DU FEU           [2/4]              │
│  [▓] L'Allumeur   [▓] L'Incendiaire             │
│  [ ] L'Apocalyptique  [ ] Le Purgateur          │
│                                                 │
│  ⚡ VIRTUOSES                [1/4]              │
│  ...                                            │
│                                                 │
│  → Complète un tableau pour débloquer un TITRE  │
└─────────────────────────────────────────────────┘
```

### Code : migration save

```js
save.spectres      // bitmask existant, 29 bits
save.spectresV2 = {
  byCategory: { feu: 2, virtuoses: 1, sprinters: 0, ... },
  titles: { feu: false, virtuoses: false, ... },  // true = débloqué
  activeTitle: null,  // "feu" | "virtuoses" | ...
  legacyNotes: [22, 19, 20, 21]  // IDs démotés
}
```

La palette, les trails, les aurores = effets **déjà dans le jeu** (sprites.js, weather.js) qu'on expose conditionnellement via le titre actif. Coût dev : S.

**Temps d'engagement ajouté** : avec 6 titres visibles et réels, on passe de "je débloque un badge oublié" à "je vais finir la catégorie Sprinters cette session". **+2-4h** cumul, surtout pour la tranche "au milieu" de la progression.

---

## Partie 4 — Le système "Chaque jour"

Le système `save.daily` avec 3 quêtes seedées existe déjà (quests.js). Il est :
- Sandbox-only (pas intégré campagne ni run arcade)
- Sans récompense visible (streak 6j débloque spectre 24, point)
- Sans narratif

### Refonte : Rituel quotidien en 3 couches

#### 4.a — **LE DÉFI DU JOUR** (remplace les 3 daily actuelles)

Un **seul** défi par jour, seedé sur la date, affiché en gros sur le splash :

> ### DÉFI DU JOUR — samedi 21 avril
> **"Finis le niveau 3-4 en mode Héroïque avec 3⭐"**
>
> Récompense : +3⭐ campagne "bonus quotidien"
> [Lancer →]

Pool de 30-50 défis prédéfinis, mix :
- "Finis N-M avec contrainte X"
- "Run arcade : bat 2500 pts aujourd'hui"
- "3 apocalypses dans 1 niveau aujourd'hui"
- "Mode héroïque : finis 1-1 à 1-5"

**Pourquoi 1 seul vs 3** : le joueur compte "c'est fait" → un checkmark. 3 quêtes = impression de "devoir" pas "récompense" pour un enfant de 8 ans.

**Récompense** : +3⭐ "bonus" ajoutées au compteur étoiles (indépendantes des 228 étoiles campagne/héroïque, mais affichent dans Musée et débloquent les seuils mondes). Donc un joueur qui fait ses daily 20 jours gagne 60⭐ qui peuvent débloquer monde 5 même sans avoir 3⭐ partout.

#### 4.b — **STREAK / JOURNAL DU PARC**

Streak rewards visibles :

| Streak | Récompense |
|---|---|
| 3j consec | Badge "Visiteur fidèle" + splash affiche "Jour 3 !" avec étoiles filantes |
| 7j consec | Débloque **Titre "Horloger"** (couche spectres §3) + unlock d'1 avatar bonus (un des 20 cachés) |
| 14j consec | Débloque **palette Lune Rouge** pour le décor nuit |
| 30j consec | Débloque **Avatar Secret : le Forain** (sprite unique) |
| 100j consec | Débloque **Mode Inversé** (lave = eau, eau = lave — remix complet des niveaux) |

Le streak **se casse à 36h d'absence**, pas 24h (charité, Milan a parfois école + soirée chargée).

#### 4.c — **LE JOURNAL DU PARC** (mini-narratif évolutif)

Sur le splash, sous le défi du jour, un **texte court** généré côté client :

> *"📖 Jour 14 — Le foyer a accueilli 1 847 visiteurs cette semaine. 23 sont repartis en squelette. Luigi a battu le record du niveau 3-4."*

Le texte se compose de **templates + stats du save** :
- Nombre visiteurs = `save.stats.skeletons + save.stats.revives`
- Record battu = détection via records couche 3
- Anecdotes aléatoires : "Une pluie de pièces imprévue", "Un ballon a survolé le parc"

**Pourquoi** : c'est **la voix du jeu** qui te parle de ta propre progression. Milan 8 ans adore se voir cité ("Luigi a battu…"). Coût dev : S (50L string concat).

#### 4.d — **PARTAGE SOCIAL** (via export btoa existant)

Bouton sur splash : "**📤 Parc du jour**"

Clic → génère un code-parc construit depuis le **défi du jour actuel** + ton record :

> Partage ce code avec ton frère :
> `v2:3.13.Q,4.13.Q...DEFI:finish_3-4_heroic_3stars|BEST:14.3s`
>
> Il pourra voir ton parc et essayer de battre ton temps.

À l'import (modal existant), le jeu détecte les suffixes `DEFI:` et `BEST:` et affiche :
> *"Mario t'a envoyé un défi : bats 14.3s sur le niveau 3-4"*
> [Accepter le défi →]

**Impact** : transforme le partage btoa (aujourd'hui cosmétique sandbox) en **vecteur de rivalité asynchrone** entre frères ou entre parent/enfant.

**Impl** : extension mineure du modal import dans `serializer.js` pour parser ces suffixes + nouveau bouton "Défi" dans HUD campagne.

---

## Partie 5 — Le multi-joueur réactivé

Le 4P couch existe mais est **muet** en méta : 4 joueurs = 4× la même expérience solo sur le même écran.

### Proposition : 3 modes 2-4P activés par conteste, sans casser la simplicité

#### 5.a — **Mode RELAIS** (le + simple, impact max)

- 2-4 joueurs, un seul parc
- Round-robin : chaque joueur pose **1 tuile** à son tour (compteur visible "Tour de Mario")
- Timer 15 s par tour, sinon la main passe
- Objectif = coopératif (max score en 3 min)
- Record foyer dédié (leaderboard relais)

**Règle**, clef : **pas de paint continu**. La contrainte "1 tuile par tour" force la **discussion** entre joueurs. C'est le mode qui fonctionne pour un parent + un enfant côte-à-côte.

#### 5.b — **Mode VERSUS asynchrone** (via parc partagé)

- Joueur A conçoit un parc en sandbox, spawn les wagons eux-mêmes (X)
- Génère code btoa avec son score
- Joueur B importe, **voit le score cible** en haut d'écran, tente de le battre **sur le même parc** (spawn positions identiques)
- Résultat : "Tu as fait 2340 vs 1900 de Mario → tu gagnes"

Pas de serveur. Échange via :
- Copié-collé du code (famille partage groupe messagerie)
- AirDrop
- QR code (optionnel, génération client-side)

**Impl** : étendre export modal pour inclure `SCORE:1900` + detection à l'import.

#### 5.c — **Mode COURSE 2P** (race F2 existant → promu)

- Déjà implémenté en sandbox (F2)
- Promu : bouton dédié sur splash, 2P côte-à-côte, leaderboard time par parcours
- Couplé au mode Relais pour variété

#### Ce qu'on ne fait PAS

- **Rôles asymétriques** (constructeur vs passager) → cité dans brief mais trop complexe pour Milan. Cognitive load élevée, décomposition des mécaniques à deux niveaux = risque d'ennui de celui qui a le "rôle passif".
- **Split-screen** → perf KAPLAY déjà tendue.
- **Online multi** → contre l'immuabilité stack (100% client-side).

**Priorité** : Relais > Versus asynchrone > Race. Relais est le seul mode **nouveau** ici, les deux autres exploitent l'existant.

**Temps d'engagement ajouté** : difficile à quantifier solo → +4h / session famille × 8 sessions famille / an. Surtout : **valeur émotionnelle** (rire au canapé) >> temps pur.

---

## Partie 6 — LE PLAN INTÉGRATEUR

### Recommandation opinionated : **lancer LA COUCHE 4 (Musée) + LA COUCHE 3 (Records Speedrun) EN PREMIER.**

#### Pourquoi

Le **Musée** est la **surface** de toutes les autres couches. Sans lui :
- Les médailles Platine ne se voient pas (invisibles dans le flow)
- Les spectres restent éparpillés dans un modal oublié
- Les records Speedrun existent mais aucune fierté affichée
- NG+ Héroïque est un mode caché sans pavillon

Avec le Musée :
- Chaque nouvelle couche trouve son emplacement de fierté
- La session 10 commence par "ouvre ton parc" → vue d'ensemble → click sur une ligne = objectif
- Le partage social (capture d'écran du Musée) devient un objet social fort

Les **Records Speedrun** viennent ensuite parce qu'ils :
- Sont la couche qui nourrit le **plus vite** le Musée (après 1 run, il y a déjà un record)
- Activent la rivalité foyer (2 joueurs = double le temps de jeu)
- Coût dev : M (stockage + display) — ROI énorme

Puis dans l'ordre :

**3. Médailles Platine** — coût S, feed direct le Musée, ré-engage les 38 niveaux existants.

**4. Défi du jour refait** (1 seul défi, +3⭐ bonus) — ritualise le retour quotidien. Le streak feed le Musée.

**5. Spectres re-catégorisés en 6 tableaux** — transforme la collection obscure en **objectif lisible**. Complétion = titre visible dans Musée.

**6. NG+ Héroïque** — le gros morceau rétention long-terme. Fait une fois que les 5 couches précédentes ont créé le contexte "je reviens pour X raisons".

**7. Mode Relais 2-4P** — amplificateur social, arrive tard car nécessite un foyer déjà engagé.

### Ordre d'impact (si 1 seul commit livrable cette semaine)

> **Si tu ne devais livrer QUE UN truc : le Musée.**
> Pas parce que c'est techniquement impressionnant, mais parce que c'est **la question** *"qu'est-ce que j'ai fait ?"* rendue visible. Sans ça, tout le reste est silencieux.

---

## Partie 7 — Implémentation phasée (8 commits atomiques)

Ordre strictement priorisé, chaque commit **testable en live**, push immédiat, CI auto-redeploy. Tailles : S <1h, M 2-4h, L 4-8h.

### Commit 1 — `feat(museum): trophy room page accessible depuis splash` — **M**

**Contenu** :
- Nouveau fichier `src/museum.js` (~180L)
- Bouton "MON PARC" sur splash à droite du cog
- Overlay HTML lit `save.campaign`, `save.spectres`, `save.heroes`, `save.runs`
- Affiche : barre progression étoiles, grille médailles (placeholder vide couche 1), grille spectres par catégorie (placeholder couche 5), top 3 records foyer par niveau (placeholder couche 2), stats cumul

**Pourquoi en 1er** : surface qui rend tout le reste visible. Fait travailler uniquement les données déjà présentes.

**Fichiers touchés** : `splash.js` (bouton), nouveau `museum.js`, `serializer.js` (expose nouveaux champs save).

### Commit 2 — `feat(speedrun): records foyer par niveau + ligne podium dans result screen` — **M**

**Contenu** :
- `campaign-result.js` : affiche "Ton temps : 14.3s — Record foyer : 9.8s (Luigi, il y a 3j)"
- `campaign-menu.js` : icône 🏆 sur niveaux avec record
- `save.campaign.records = { "1-1": [{avatar, time, date}...] }` sur 3 entrées max par niveau
- Musée : ligne "Records foyer" s'active

**Pourquoi 2e** : la couche la plus active (chaque fin de niveau = potentielle mise à jour). Crée la rivalité multi-joueur sans multi-joueur technique.

**Fichiers touchés** : `campaign.js` (tracking best time), `campaign-result.js`, `campaign-menu.js`, `serializer.js` (migration save + validation), `museum.js`.

### Commit 3 — `feat(platinum): médailles platine par niveau avec contrainte secrète révélée graduellement` — **S**

**Contenu** :
- `levels.js` : ajout champ `platinum: { label, hint, check: (stats) => bool }` pour les 38 niveaux (mecanique écrite par un humain en 1-2h)
- `campaign.js` : au succès, check platinum → stocke dans `save.campaign.levels[id].platinum = true`
- `campaign-result.js` : affiche "Platine : ???" flou si 1⭐, puis "Platine : finis <12s" si 3⭐, puis "★ PLATINE" si obtenue
- `campaign-menu.js` : étoile dorée sur niveau si platine
- Musée : compteur "Médailles platine 7 / 38"

**Contraintes platine exemples** :
- 1-1 : finir en <12s
- 1-2 : aucune pièce ramassée (si pièce dans layout)
- 2-10 : APOCALYPSE avec 0 boost posé
- 3-1 : 5 squelettes avec 1 tuile posée (dejà le budget), platine = 1 seul wagon utilisé
- 4-2 : 10 squelettes avec 1 tile, platine = <60s
- 5-8 : 8 squelettes avec 2 wagons, platine = <90s

**Pourquoi 3e** : coût S mais ratio rétention énorme — 38 objectifs cachés sans ligne de nouveau contenu.

**Fichiers touchés** : `levels.js`, `campaign.js`, `campaign-result.js`, `campaign-menu.js`, `museum.js`.

### Commit 4 — `feat(daily): défi du jour unique remplace triple daily + bonus étoiles` — **M**

**Contenu** :
- Refonte `quests.js` → pool 30-50 défis prédéfinis avec types : `level_finish`, `level_stars`, `run_score`, `combo_count`, `platinum_count`
- Seed day → 1 défi unique
- Splash affiche carte "DÉFI DU JOUR : ..." avec bouton [Lancer]
- Au succès : +3⭐ bonus cumulées (dans `save.campaign.bonusStars`), affichées dans Musée
- Streak rewards progressifs (3/7/14/30/100j) avec unlock titres / palettes / avatars

**Pourquoi 4e** : transforme le retour quotidien de "je lance sandbox" en "je fais mon défi du jour en 5 min".

**Fichiers touchés** : `quests.js` (refonte complète), `splash.js` (carte défi), `museum.js`.

### Commit 5 — `feat(spectres): refonte 6 catégories × 4 + titres débloqués + carnet re-designé` — **M**

**Contenu** :
- Réorganisation 24 spectres en 6 catégories (5 spectres restants en "notes" legacy)
- `save.spectresV2 = { byCategory, titles, activeTitle }`
- Carnet regroupé par catégorie avec barres de progression par catégorie
- Complétion catégorie = **pop up titre débloqué** + ajout dans Musée
- Selector titre actif dans Musée ("change ton titre")
- Effet visuel du titre actif (palette / trails / corona nuit)

**Pourquoi 5e** : après les médailles, spectres trouvent leur place dans Musée et deviennent objectif concret.

**Fichiers touchés** : `spectres.js` (refonte), `museum.js`, `sprites.js` (titre → effet visuel conditionnel).

### Commit 6 — `feat(heroic): mode NG+ déverrouillable à 28⭐ avec modifiers cumulatifs` — **L**

**Contenu** :
- Toggle Normal / Héroïque dans `campaign-menu.js` (grisé si <28⭐)
- `save.campaign.heroicLevels = { "1-1": { stars, time, tiles, platinum } }` séparé
- `campaign.js` : au load avec flag héroïque → wagonLimit×0.6 rounded up, tileBudget−2, timeLimit×0.75, remove pre-placed L/U/D (garder rails)
- Tous compteurs musée dédoublés Normal / Héroïque (étoiles, médailles, records)

**Pourquoi 6e** : gros effort dev mais énorme payoff rétention (+6-10h). Vient après avoir saturé la méta-progression sur la 1ère boucle.

**Fichiers touchés** : `campaign.js`, `campaign-menu.js`, `museum.js`, `serializer.js`.

### Commit 7 — `feat(relay): mode Relais 2-4P round-robin tile placement` — **M**

**Contenu** :
- Nouveau mode `relay` dans `MODE_CONFIG`
- `src/relay.js` (~120L) : state machine tour-par-tour, timer 15s, compteur "Tour de X"
- HUD relais : avatar actif en gros, compte à rebours, scores cumulés
- Splash : 3e carte mode "RELAIS 2-4P"
- Save : `save.relay.records = { "2p": topTime, "3p": ..., "4p": ... }`

**Pourquoi 7e** : amplificateur social, exploite l'infra 4P existante. Arrive tard car solo-first.

**Fichiers touchés** : `constants.js` (MODE_CONFIG), `router.js`, `splash.js`, nouveau `relay.js`, `hud.js`.

### Commit 8 — `feat(social): défi asynchrone via export btoa enrichi (SCORE + DEFI suffixes)` — **S**

**Contenu** :
- Étendre `serializer.js` : `serializeTiles` accepte `{score, defi, bestTime}` append `|SCORE:...|DEFI:...|BEST:...`
- Import modal détecte ces suffixes → affiche "X t'a envoyé un défi : bats Y"
- Bouton "Partager ce parc" dans Musée génère code + copy-to-clipboard
- Bouton "Parc du jour" sur splash → auto-génère code du défi du jour avec ton best

**Pourquoi 8e** : petit ajout qui démultiplie le social déjà existant. Vient en bout car les couches précédentes créent le contenu à partager.

**Fichiers touchés** : `serializer.js`, `museum.js`, `splash.js`.

---

## Récap exécution recommandée

```
Sprint 1 (semaine 1) : Commits 1 + 2 + 3  →  Musée + Records + Platine
                         L'écosystème visible devient une réalité.

Sprint 2 (semaine 2) : Commits 4 + 5  →  Daily + Spectres refondus
                         Le rythme quotidien + les objectifs classifiés.

Sprint 3 (semaine 3) : Commit 6  →  NG+ Héroïque
                         Le marathon long-terme.

Sprint 4 (semaine 4) : Commits 7 + 8  →  Relais + Social
                         Le multi-joueur concret + partage.
```

Après Sprint 1, on peut **mesurer** la rétention 7-day en live (si le user a telemetry côté GH Pages, sinon auto-rapport via le Journal qui affiche "Jour N"). Le go/no-go de Sprint 2 dépend de :
- Est-ce que Milan rouvre le jeu le lendemain du Sprint 1 déploy ? (anecdote > data)
- Est-ce que Mike voit ses stats cumulées et a envie de jouer plus ?

Si oui → Sprint 2. Si pitfall "je regarde le musée mais je rejoue pas" → ajuster : les records foyer motivent-ils assez ? Faut-il des daily rewards plus gras dès Sprint 2 ?

---

## Principes de design validés tout au long

1. **Aucun nouveau contenu à produire** — Les 38 niveaux existants portent tout. Les médailles Platine = prédicats. NG+ = modifiers. Spectres = re-classement. Musée = visualisation du save.
2. **Chaque couche fait travailler les précédentes** — médailles feed musée, records feed musée, spectres feed musée, daily feed étoiles, héroïque dédouble tout.
3. **Agentique, pas passif** — chaque objectif est nommé, visible, et atteignable par une action volontaire du joueur. Zéro "progression auto en regardant".
4. **Rivalité foyer > leaderboard global** — pas de serveur, donc la rivalité existante est Mario vs Luigi sur le canapé, pas anonyme_42 à Séoul.
5. **Retour quotidien sans obligation** — daily est **récompense**, pas **devoir**. Streak casse à 36h, pas 24h.
6. **Fierté visible > dopamine cachée** — le Musée sur le splash, c'est le nouvel avatar picker. C'est ce que tu regardes en premier.

---

**Fin du document.** Prêt pour validation user et transformation en specs Sprint 1 (`.claude/specs/museum-v1.md`, `records-foyer.md`, `platinum-medals.md`).

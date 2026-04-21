# Milan Lava Park — Catalogue de Puzzles Créatifs

> Document de design puzzle (game designer senior). Cible : Milan (8 ans), sandbox KAPLAY.  
> Statut : proposition. Rien à implémenter sans validation user. Tout reste compatible avec l'archi existante (voir CLAUDE.md).  
> Date : 2026‑04‑21.

---

## Partie 1 — Audit des mécaniques sous-exploitées

**Constat global** : sur 38 niveaux, la palette se concentre sur 7 tuiles (lava, water, coin, rail_loop, trampoline, fan, boost) et 5 combos (squelette/revive, chaîne d'or, catapulte, loop, apocalypse). **Plus de 60 % du moteur sandbox n'entre jamais dans un puzzle de campagne.**

### Mécaniques **jamais** utilisées dans les niveaux 1‑1 → 5‑8

| Mécanique | Code qui existe | Utilisé en campagne ? | Constat |
|---|---|---|---|
| **Pont fragile** (`bridge`, casse à 2 passages) | `wagons.js:983` + `tiles.js:632` pulse rouge | Juste mentionné en 4‑4, jamais **forcé** comme contrainte principale | L'effet « temporary lava » après rupture n'est jamais un objectif/failOn |
| **Tunnel de l'Amour Maudit** | `wagons.js:1205` (duplique passager → squelette) | **0 niveau** | Pourtant parfait pour faire 4 squelettes avec 1 seul wagon |
| **Métronome infernal** (2 boosts verticaux + lava) | `tiles.js:738` detectMetronomes | **0 niveau** | x2 score pendant 3 s : ressort puissant ignoré |
| **Cascade** (3 water vertical, vapeur + bridge temp) | `tiles.js:25` checkCascade | **0 niveau** | Crée un pont temporaire de 8 s au-dessus de la lave, inexploitable actuellement |
| **Geyser** (water + fan) | detectGeysers + detectLavaTriangles | Promis 3‑9 mais **pas wiré** (`progress("geyser")` jamais appelé) | Objectif type `geyser` existe dans `OBJECTIVE_TYPES`, hook jamais déclenché |
| **Constellation spectrale** (5 squelettes + portail) | constellation.js + objective type | **0 niveau**, hook non wiré | Idem |
| **Magnet Field** (2 aimants même row, gap 4‑12) | detectMagnetFields | **0 niveau** | Onde magnétique crée zone d'attraction horizontale, inexploitée |
| **Ice Crown** (magnet entouré de 4 ice) | detectIceCrowns | **0 niveau** | Zone 5 tiles d'effet, inconnue du joueur |
| **Lava Triangle ▲/▽** (patterns 3 lava) | detectLavaTriangles | **0 niveau** | Pattern spatial intéressant |
| **Patinoire + Catapulte chaîné** | glide x1.6 → trampo | Juste 5‑6 effleure | Le bonus vitesse n'alimente jamais un combo downstream |
| **Portail vertical** (A en haut, B en bas = chute infinie) | portals.js permet | **0 niveau** | La campagne utilise uniquement le portail horizontal |
| **Dette Fantôme** (passer sur ghost → debuff) | wagons.js:956 | **0 niveau** | Difficile mais thématique |
| **Chaîne d'or verticale** (3 coins diagonaux descendant) | checkTriplet(1,1) support | 2‑3 utilise le ↗ seulement | Le ↘ existe, jamais forcé |
| **rail_up + rail_down sculptés en vallée** | disponible | 2‑6, 4‑3 seuls | Peu exploité pour créer "montagnes russes" |

### Combos inexplorés (paires qui marchent mais qu'aucun niveau ne force)

1. **Cascade + Trampoline dessous** : cascade transforme lava→bridge 8 s ; trampo dessous = catapulte à fenêtre de temps.
2. **Metronome + Rail loop adjacent** : x2 score pendant le looping = scoring fou.
3. **Tunnel + Lava après sortie** : tunnel duplique passagers → sortie immédiate dans lave = squelettes en série.
4. **Portail A → Ice Rink → Portail B** : vortex infini à x1.6 vitesse.
5. **Ice Crown** (5 tiles radius) + wagon pris dedans = ralenti ? accéléré ? (à designer).
6. **Geyser vertical 3 tiles de haut** : water+water+water+fan = jet triple.
7. **Apocalypse en cascade** (5 transforms en 2.5 s sur une grille compacte 2×2 de lava) — jamais décomposé comme objet pédagogique.

### Bilan audit

- **Objectifs types `geyser` et `constellation`** : définis dans `OBJECTIVE_TYPES` mais **aucun hook `progress()` ne les déclenche**. Il faut les brancher (5 lignes de code chacun).
- **3 détecteurs de combos tournent à vide** (magnetFields, metronomes, lavaTriangles, iceCrowns) : on calcule leur présence sans qu'aucun puzzle ne demande au joueur de les construire.
- La règle « **passage en lave compte même si déjà squelette** » (campaign cooldown 1 s, `wagons.js:935`) est bien pensée mais **sous-utilisée**. Des niveaux « 1 wagon, 8 squelettes » sont faisables et manquent.
- **Zéro objectif coopératif asymétrique** (ex. wagon 1 prépare le chemin du wagon 2).
- **Zéro objectif de timing** (ex. « déclencher 2 combos dans la même seconde »).

---

## Partie 2 — Nouvelles mécaniques à ajouter

Chaque proposition est **rétrocompatible** avec l'archi : pas de refacto, pas de nouveau moteur, juste des tuiles/hooks additionnels.

---

### 2.1 — Objectif `visitor` : faire monter un visiteur à bord

**Description.** Un visiteur (sprite humain ambient) attend au sol quelque part sur la carte. Faire passer un wagon **vide** (siège libre) à côté de lui le fait monter. Objectif : transporter N visiteurs du spawn jusqu'à la sortie.

**Implémentation.**
- `OBJECTIVE_TYPES.visitor = { hookName: "onVisitorBoard" }`
- `levels.js` : ajouter champ `visitors: [{col, row, color?, name?}]` dans la def.
- `campaign.js:loadLevel` : après `deserializeTiles`, spawn chaque visiteur (sprite existant `visitor.js`).
- `wagons.js` : handler existant `tryBoardWagon` côté player se duplique pour visiteurs (detectVisitorCollide). Quand wagon passe à < 24 px d'un visiteur et wagon.passengers.length < 4 → passenger="human", `__campaign.progress("visitor")`, destroy visitor.
- Budget code : ~40 lignes (function + hook + objective type).

**Niveaux exemples.**
- **6‑3 « Le ramassage »** : 3 visiteurs répartis cols 5/9/13, objectif embarquer les 3 avec 2 wagons.
- **6‑7 « L'exigeante »** : visiteur attend à col 14 **mais il est en hauteur (row 9)**. Il faut catapulter un wagon vide sous ses pieds.
- **7‑2 « Transport VIP »** : visiteur avec `vip: true` (double points), faire passer sans transformer (failOn skeleton:1).

---

### 2.2 — Tuile `switch` + `gate` : plaque de pression + porte

**Description.** Une `gate` est un bloc solide (collider) posé sur le rail qui stoppe le wagon. Une `switch` (plaque de pression) placée ailleurs l'ouvre quand un wagon roule dessus. La porte reste ouverte 3 s après passage sur le switch.

**Implémentation.**
- 2 nouveaux types de tuile (`switch`, `gate`), sprites pré-rendus 32×32.
- Constants.js : ajouter à `TOOLBAR_ORDER`.
- `tiles.js:placeTile` : 2 branches. `gate` = k.body static + sprite. `switch` = area + flag.
- `wagons.js:onCollide("switch")` : pour chaque gate liée (ou toutes les gates), `gate.openedUntil = k.time() + 3`.
- `k.onUpdate("gate")` : si `openedUntil > time` → opacity 0.3 + collider disabled (`gate.solid = false`), sinon solid.
- Lier switch↔gate via **couleur A/B** comme les portails (pairing auto).
- Budget : ~80 lignes.

**Niveaux exemples.**
- **6‑5 « Le gardien »** : rail gauche → gate → rail droit. Le switch est en hauteur (row 10). Il faut catapulter un wagon exprès pour déclencher l'ouverture pendant qu'un 2ᵉ wagon roule au sol.
- **7‑4 « Serrure à retardement »** : 2 gates (A et B), 2 switches. Séquence imposée.
- **7‑8 « Pas à pas »** : 3 gates en série, il faut chaîner les switches en moins de 9 s (3 × 3 s).

---

### 2.3 — Tuile `bomb` / `lava_spread` : lave qui s'étend au contact

**Description.** Une tuile `bomb` (sprite mèche 🧨) est inerte. Si un wagon passe dessus, elle s'enflamme (2 s mèche visible) puis **transforme ses 4 voisines orthogonales en lava temporaire (6 s)**. Tuile « cascade domino » qui convertit un rail paisible en zone dangereuse.

**Implémentation.**
- Nouveau type `bomb`, sprite 32×32.
- `wagons.js:onCollide("bomb")` : `bomb.fuse = k.time() + 2`. Retire le collider de bomb (wagon peut continuer).
- `tiles.js k.loop(0.2)` : si `bomb.fuse && time > bomb.fuse` → `placeTile` lava sur 4 voisines (avec `temporary: time+6`), destroy bomb.
- FailOn pattern possible : `{ bomb: 1 }` pour niveau « ne déclenche aucune bombe ».
- Ne pas convertir les tuiles de type rail/rail_up/rail_down (sinon trou infranchissable).
- Budget : ~60 lignes.

**Niveaux exemples.**
- **6‑8 « Champ de mines »** : 4 bombes pré-placées sur le rail. Objectif : 5 pièces en bout, failOn: bomb=1. Le joueur doit **catapulter par-dessus**.
- **7‑5 « Détonation volontaire »** : objectif = déclencher 3 squelettes. Stratégie intended : faire sauter 1 bombe à côté d'un groupe de wagons.
- **7‑9 « Effet papillon »** : 1 bombe qui, en explosant, enflamme une voisine = chaîne. 10 squelettes via 1 seul trigger.

---

### 2.4 — Tuile `fan_h` : ventilateur horizontal (souffle latéral)

**Description.** Variante du `fan` existant. Souffle horizontal (flèche → ou ←). Si placé sur le rail, pousse les wagons dans son sens (accélère) ou les freine (contre-sens). **Directional** : choisir au placement (toolbar sous-menu ou 2 types `fan_r` et `fan_l`).

**Implémentation.**
- 2 nouveaux types (ou 1 avec propriété `dir`), sprite asymétrique.
- `tiles.js:placeTile` branche fan_h : onUpdate boucle wagons dans un cône horizontal 3 tiles devant → `w.vel.x += 400 * dt * dir`.
- Combo possible : 2 `fan_h` opposés face-à-face → **zone de suspension** (wagon oscille x gauche/droite, points auto toutes les 0.5 s).
- Budget : ~50 lignes.

**Niveaux exemples.**
- **6‑6 « Contre-courant »** : rail complet, 3 fan_h ← pré-placés. Faut pousser un wagon jusqu'au bout malgré le vent contraire (boosts obligatoires).
- **7‑3 « Tornade »** : 4 fan_h opposés 2 par 2 = zone piégée. Objectif : score 400 en laissant les wagons dedans.
- **7‑7 « Ascenseur aérien »** : combo fan vertical + fan_h horizontal construit une trajectoire en L pour collecter coin en hauteur-décalé.

---

### 2.5 — Timer tiles `alarm` : événement temporel

**Description.** Une tuile `alarm` (réveil ⏰) déclenche un événement au bout de N secondes (N = 10, 20, 30 selon variant). Événements possibles :
- `flood` : toutes les lava deviennent water (ou inverse)
- `freeze` : place 5 ice au hasard sur les rails
- `wind_gust` : push horizontal global pendant 2 s

**Implémentation.**
- Nouveau type `alarm` avec sous-type choisi via shift-clic ou variant A/B/C.
- `tiles.js:placeTile` branche alarm : `alarm.triggerAt = k.time() + alarm.delay`.
- `k.loop(0.5)` : check les alarm → si trigger → execute event.
- Objectif possible : `{ type: "score", target: N }` avec event = double points 5 s.
- Budget : ~70 lignes.

**Niveaux exemples.**
- **6‑9 « Compte à rebours »** : 1 alarm `flood` à 15 s. Faire 3 squelettes **avant** la fin (après, plus de lava).
- **7‑6 « Hiver soudain »** : 1 alarm `freeze` à 10 s. Après, patinoire généralisée → exploit pour catapultes rapides.
- **7‑10 « Tempête »** : 3 alarms décalées (5 s / 10 s / 15 s) → enchaîner 3 combos différents dans chaque fenêtre.

---

### 2.6 — (Bonus) Hook `onGeyser` et `onConstellation` + objectif `metronome`

**Description.** Brancher les detect* qui tournent à vide.

**Implémentation.**
- `main.js` : dans l'update global, pour chaque geyser détecté qui n'a pas encore de flag `_campaignFired`, appeler `window.__campaign?.progress?.("geyser")` et flag.
- Idem `constellation`, `metronome`.
- Ajouter `OBJECTIVE_TYPES.metronome` + `magnetField`.
- Budget : ~15 lignes total.

**Niveaux exemples.**
- **6‑4 « Symphonie mécanique »** : objectif metronome=2 (construire 2 métronomes).
- **7‑1 « Double aimant »** : objectif magnetField=1.

---

## Partie 3 — 15 nouveaux niveaux concrets (Monde 6 « Maîtres » + bonus)

Helpers supposés : `railRow(a, b, row=13)` pose des rails, `tile(c, r, code)` une tuile seule. Codes : `R`=rail, `U`=rail_up, `D`=rail_down, `L`=lava, `W`=water, `C`=coin, `I`=ice, `F`=fan, `M`=magnet, `P`=portal, `T`=trampoline, `B`=boost, `N`=bridge, `Y`=wheel, `X`=rail_loop, `Z`=tunnel.

**Nouveaux codes proposés** : `V`=visitor spawn, `S`=switch, `G`=gate, `O`=bomb, `H`=fan_h (→), `J`=fan_h (←), `K`=alarm.

Seuil d'accès suggéré pour Monde 6 : **50 ⭐** cumulées.

---

### 6‑1 « Le pont chancelant »

*Intro mécanique : pont fragile comme contrainte principale.*

```js
{
  id: "6-1", world: 6, title: "Le pont chancelant",
  hint: "Le pont ne tient que 2 passages. Transforme 2 wagons en squelettes avant qu'il ne cède.",
  layout: "v2:" + railRow(3, 7) + "," + tile(8, 13, "N") + "," + tile(9, 13, "N") + "," + railRow(10, 16) + "," + tile(12, 12, "L"),
  playerSpawn: { col: 4, row: 13 },
  allowedTools: ["erase"], // tout est pré-placé, rien à ajouter !
  tileBudget: 0,
  wagonLimit: 3,
  objectives: [
    { id: "skel2", type: "skeleton", target: 2, label: "2 squelettes (pont fragile !)" },
  ],
  stars: { time: { under: 40 }, efficient: { tilesUnder: 0 } },
  timeLimit: 70,
}
// SOLUTION : envoyer 2 wagons, chacun franchit le pont (1 crossing) puis touche la lave.
// Au 2ᵉ passage le pont se transforme en lava → le 3ᵉ wagon ne franchit plus → objectif déjà atteint.
```

---

### 6‑2 « Tunnel maléfique »

*Intro mécanique : tunnel duplique passagers. 4 squelettes avec 1 wagon.*

```js
{
  id: "6-2", world: 6, title: "Tunnel maléfique",
  hint: "Le TUNNEL 🕳 multiplie les passagers. Ensuite, LAVE !",
  layout: "v2:" + railRow(3, 7) + "," + tile(8, 13, "Z") + "," + railRow(13, 16) + "," + tile(15, 12, "L"),
  playerSpawn: { col: 4, row: 13 },
  allowedTools: ["lava", "erase"],
  tileBudget: 1,
  wagonLimit: 1,
  objectives: [
    { id: "skel4", type: "skeleton", target: 4, label: "4 squelettes avec 1 seul wagon" },
  ],
  stars: { time: { under: 45 }, efficient: { tilesUnder: 1 } },
  timeLimit: 70,
}
// SOLUTION : wagon entre tunnel (1 passager par défaut). Tunnel duplique jusqu'à 4. Sort, passe la lave.
// +1 skeleton au 1er passage, puis les 3 autres via le cooldown 1s (campagne pass-through).
```

---

### 6‑3 « Le ramassage » — utilise nouvelle mécanique VISITOR

```js
{
  id: "6-3", world: 6, title: "Le ramassage",
  hint: "3 visiteurs attendent. Approche un wagon vide pour les embarquer.",
  layout: "v2:" + railRow(3, 16),
  playerSpawn: { col: 4, row: 13 },
  visitors: [{ col: 6, row: 12 }, { col: 10, row: 12 }, { col: 14, row: 12 }],
  allowedTools: ["boost", "erase"],
  tileBudget: 2,
  wagonLimit: 2,
  objectives: [
    { id: "vis3", type: "visitor", target: 3, label: "Embarque 3 visiteurs" },
  ],
  stars: { time: { under: 40 }, efficient: { tilesUnder: 0 } },
  timeLimit: 75,
}
// SOLUTION : 1 wagon avec 2 boosts ramasse les 3 en 1 passage (wagon accepte 4 passagers).
// Ou 2 wagons sans booster.
```

---

### 6‑4 « Symphonie mécanique » — METRONOME

```js
{
  id: "6-4", world: 6, title: "Symphonie mécanique",
  hint: "BOOST haut + LAVE + BOOST bas = MÉTRONOME INFERNAL (x2 score 3s). Construis-en 1.",
  // Rails row 13, besoin de poser 2 boosts verticaux séparés de 4 rows + lava entre
  layout: "v2:" + railRow(3, 16),
  playerSpawn: { col: 4, row: 13 },
  allowedTools: ["lava", "boost", "erase"],
  tileBudget: 4,
  wagonLimit: 3,
  objectives: [
    { id: "metro1", type: "metronome", target: 1, label: "Déclenche 1 MÉTRONOME" },
    { id: "score200", type: "score", target: 200, label: "Atteins 200 pts" },
  ],
  stars: { time: { under: 60 }, efficient: { tilesUnder: 3 } },
  timeLimit: 95,
}
// SOLUTION : poser boost col 9 row 9, lava col 9 row 11, boost col 9 row 13.
// detectMetronomes le trouve → progress("metronome"). Pendant x2, passer un wagon dessus.
```

---

### 6‑5 « Le gardien » — SWITCH/GATE intro

```js
{
  id: "6-5", world: 6, title: "Le gardien",
  hint: "La porte 🚪 bloque le rail. Une plaque de pression ⬜ quelque part l'ouvre 3s.",
  // Gate pré-placée col 10 row 13, switch pré-placé col 14 row 12 (hauteur)
  layout: "v2:" + railRow(3, 9) + "," + tile(10, 13, "G") + "," + railRow(11, 16) + "," + tile(14, 12, "S"),
  playerSpawn: { col: 4, row: 13 },
  allowedTools: ["trampoline", "fan", "boost", "erase"],
  tileBudget: 4,
  wagonLimit: 2,
  objectives: [
    { id: "coin5", type: "coin", target: 5, label: "5 pièces à droite de la porte" },
  ],
  coinSpawns: [{ col: 15, row: 13 }, { col: 16, row: 13 }, ...], // OU placer via setup
  stars: { time: { under: 60 }, efficient: { tilesUnder: 3 } },
  timeLimit: 100,
}
// SOLUTION : wagon 1 = catapulté sur le switch (trampo + fan) → gate ouverte 3s.
// Wagon 2 part pendant cette fenêtre, franchit, ramasse les pièces.
```

---

### 6‑6 « Contre-courant » — FAN_H

```js
{
  id: "6-6", world: 6, title: "Contre-courant",
  hint: "Les ventilateurs horizontaux ← freinent ton wagon. Boost obligatoire pour franchir.",
  layout: "v2:" + railRow(3, 16) + "," + tile(8, 12, "J") + "," + tile(11, 12, "J") + "," + tile(14, 12, "J"),
  playerSpawn: { col: 4, row: 13 },
  allowedTools: ["boost", "lava", "erase"],
  tileBudget: 5,
  wagonLimit: 3,
  objectives: [
    { id: "skel2", type: "skeleton", target: 2, label: "2 squelettes à droite" },
  ],
  stars: { time: { under: 55 }, efficient: { tilesUnder: 4 } },
  timeLimit: 90,
}
// SOLUTION : 3 boosts (cols 7, 10, 13) pour compenser les 3 freinages. Lava col 15.
```

---

### 6‑7 « L'exigeante » — VISITOR en hauteur

```js
{
  id: "6-7", world: 6, title: "L'exigeante",
  hint: "La visiteuse attend perchée. Envoie un wagon vide jusqu'à elle.",
  layout: "v2:" + railRow(3, 16),
  playerSpawn: { col: 4, row: 13 },
  visitors: [{ col: 13, row: 9 }], // en hauteur
  allowedTools: ["trampoline", "fan", "boost", "erase"],
  tileBudget: 4,
  wagonLimit: 2,
  objectives: [
    { id: "vis1", type: "visitor", target: 1, label: "Embarque 1 visiteur en hauteur" },
  ],
  stars: { time: { under: 60 }, efficient: { tilesUnder: 3 } },
  timeLimit: 90,
}
// SOLUTION : catapulte (trampo col 9 + fan col 9 row 12) calibrée pour arc passer col 13 row 9.
```

---

### 6‑8 « Champ de mines » — BOMB intro failOn

```js
{
  id: "6-8", world: 6, title: "Champ de mines",
  hint: "4 bombes 🧨 pré-placées. Rapporte 5 pièces SANS EN DÉCLENCHER UNE.",
  layout: "v2:" + railRow(3, 16) + "," + tile(6, 13, "O") + "," + tile(9, 13, "O") + "," + tile(12, 13, "O") + "," + tile(14, 13, "O") + "," + tile(5, 11, "C") + "," + tile(8, 11, "C") + "," + tile(11, 11, "C") + "," + tile(13, 11, "C") + "," + tile(15, 11, "C"),
  playerSpawn: { col: 4, row: 13 },
  allowedTools: ["trampoline", "fan", "boost", "erase"],
  tileBudget: 4,
  wagonLimit: 3,
  failOn: { bomb: 1 },
  objectives: [
    { id: "coin5", type: "coin", target: 5, label: "5 pièces (évite les bombes !)" },
  ],
  stars: { time: { under: 65 }, efficient: { tilesUnder: 3 } },
  timeLimit: 100,
}
// SOLUTION : catapulte côté gauche (trampo col 4 + fan col 4 row 12), arc parabolique
// passe au-dessus des bombes et collecte les coins (rows 11).
```

---

### 6‑9 « Compte à rebours » — ALARM intro

```js
{
  id: "6-9", world: 6, title: "Compte à rebours",
  hint: "L'alarme ⏰ transforme toutes les laves en eau dans 15s. Fais 3 squelettes avant !",
  layout: "v2:" + railRow(3, 16) + "," + tile(10, 13, "K"), // K = alarm type=flood, delay=15
  playerSpawn: { col: 4, row: 13 },
  allowedTools: ["lava", "boost", "erase"],
  tileBudget: 3,
  wagonLimit: 4,
  objectives: [
    { id: "skel3", type: "skeleton", target: 3, label: "3 squelettes avant 15s" },
  ],
  stars: { time: { under: 14 }, efficient: { tilesUnder: 2 } },
  timeLimit: 25,
}
// SOLUTION : poser lava col 8, boosts cols 6/10, balancer 3 wagons en rafale.
// Après 15s les lavas → water, jeu perdu si pas fini.
```

---

### 6‑10 « Cascade fatale »

*Force le combo water cascade → bridge temporaire → trampoline dessous.*

```js
{
  id: "6-10", world: 6, title: "Cascade fatale",
  hint: "3 EAUX 💧 verticales + LAVE dessous = CASCADE qui crée un pont 8s. Exploite-le.",
  // Lave pré-placée col 9 row 13. Coins à col 15 row 11.
  layout: "v2:" + railRow(3, 8) + "," + tile(9, 13, "L") + "," + railRow(10, 16) + "," + tile(13, 11, "C") + "," + tile(14, 11, "C") + "," + tile(15, 11, "C"),
  playerSpawn: { col: 4, row: 13 },
  allowedTools: ["water", "trampoline", "fan", "erase"],
  tileBudget: 5,
  wagonLimit: 3,
  objectives: [
    { id: "coin3", type: "coin", target: 3, label: "3 pièces après la cascade" },
  ],
  stars: { time: { under: 55 }, efficient: { tilesUnder: 4 } },
  timeLimit: 90,
}
// SOLUTION : poser water col 9 rows 10, 11, 12 (3 verticaux au-dessus de la lave).
// Cascade se déclenche → bridge temporaire remplace la lava pour 8 s.
// Trampo col 10 + fan col 10 row 12 = catapulte qui collecte les coins en hauteur.
```

---

### 6‑11 « Double aimant » — MAGNET FIELD

```js
{
  id: "6-11", world: 6, title: "Double aimant",
  hint: "2 AIMANTS 🧲 sur la même ligne à distance 4-12 = CHAMP MAGNÉTIQUE. Fais-en 1.",
  layout: "v2:" + railRow(3, 16),
  playerSpawn: { col: 4, row: 13 },
  allowedTools: ["magnet", "lava", "erase"],
  tileBudget: 4,
  wagonLimit: 3,
  objectives: [
    { id: "mag1", type: "magnetField", target: 1, label: "Déclenche 1 champ magnétique" },
    { id: "skel2", type: "skeleton", target: 2, label: "2 squelettes dedans" },
  ],
  stars: { time: { under: 55 }, efficient: { tilesUnder: 3 } },
  timeLimit: 90,
}
// SOLUTION : magnet col 6 row 12, magnet col 13 row 12. Lava col 10 row 13.
// Le wagon est attiré par les 2 aimants, zigzag → lava → squelette.
```

---

### 6‑12 « Constellation spectrale »

*Force objectif constellation (5 squelettes + portal à proximité).*

```js
{
  id: "6-12", world: 6, title: "Constellation spectrale",
  hint: "5 squelettes actifs + PORTAIL ouvert = constellation. Rassemble-les.",
  layout: "v2:" + railRow(3, 16) + "," + tile(8, 13, "P") + "," + tile(14, 13, "P"),
  playerSpawn: { col: 4, row: 13 },
  allowedTools: ["lava", "erase"],
  tileBudget: 2,
  wagonLimit: 6,
  objectives: [
    { id: "cons1", type: "constellation", target: 1, label: "1 Constellation Spectrale" },
  ],
  stars: { time: { under: 90 }, efficient: { tilesUnder: 2 } },
  timeLimit: 130,
}
// SOLUTION : 1 lava devant chaque portail, balancer 6 wagons, dès que 5 squelettes
// "vivants" existent simultanément + portails ouverts → constellation (hook à wirer).
```

---

### 6‑13 « Géyser triplet » — GEYSER enfin wiré

```js
{
  id: "6-13", world: 6, title: "Géyser triplet",
  hint: "EAU 💧 au-dessus d'un VENTILO 🌀 = GEYSER. Crée-en 3.",
  layout: "v2:" + railRow(3, 16),
  playerSpawn: { col: 4, row: 13 },
  allowedTools: ["water", "fan", "erase"],
  tileBudget: 6,
  wagonLimit: 3,
  objectives: [
    { id: "gey3", type: "geyser", target: 3, label: "Déclenche 3 GEYSERS" },
  ],
  stars: { time: { under: 50 }, efficient: { tilesUnder: 6 } },
  timeLimit: 85,
}
// SOLUTION : 3 paires (water au-dessus, fan en dessous) aux cols 6/10/14 rows 11/12.
```

---

### 6‑14 « Le Yin Yang infini »

*Boucle squelette↔revive avec 1 seul wagon via portail vortex.*

```js
{
  id: "6-14", world: 6, title: "Le Yin Yang infini",
  hint: "1 seul wagon. 4 squelettes ET 4 résurrections. Boucle-le.",
  layout: "v2:" + railRow(3, 16) + "," + tile(5, 13, "P") + "," + tile(15, 13, "P") + "," + tile(8, 13, "L") + "," + tile(12, 13, "W"),
  playerSpawn: { col: 4, row: 13 },
  allowedTools: ["magnet", "erase"], // magnet à côté du portal = vortex
  tileBudget: 2,
  wagonLimit: 1,
  objectives: [
    { id: "skel4", type: "skeleton", target: 4, label: "4 squelettes (1 wagon !)" },
    { id: "rev4", type: "revive", target: 4, label: "4 résurrections" },
  ],
  stars: { time: { under: 120 }, efficient: { tilesUnder: 2 } },
  timeLimit: 180,
}
// SOLUTION : poser magnet à col 6 row 12 et col 14 row 12 (magnet adjacent portal = vortex).
// 1 wagon boucle : lave → squelette → eau → humain → portail → répète. 4 cycles = win.
```

---

### 6‑15 « Maître du parc »

*Boss du Monde 6 : 4 mécaniques nouvelles enchaînées.*

```js
{
  id: "6-15", world: 6, title: "Maître du parc",
  hint: "Tunnel ! Pont ! Alarme ! Bombe ! Tout dans 1 run. Atteins 1000 pts.",
  layout: "v2:" + railRow(3, 7) + "," + tile(8, 13, "Z") + "," + railRow(13, 16) + "," +
    tile(9, 13, "N") + "," + tile(10, 13, "N") + "," + tile(11, 13, "N") + "," + tile(12, 13, "N") + "," +
    tile(14, 13, "O") + "," + tile(6, 10, "K"),
  playerSpawn: { col: 4, row: 13 },
  allowedTools: ["lava", "water", "coin", "boost", "trampoline", "fan", "magnet", "erase"],
  tileBudget: 10,
  wagonLimit: 5,
  objectives: [
    { id: "score1000", type: "score", target: 1000, label: "Atteins 1000 pts" },
  ],
  stars: { time: { under: 120 }, efficient: { tilesUnder: 8 } },
  timeLimit: 150,
}
// SOLUTION libre : utiliser le tunnel pour duplication, traverser pont fragile,
// déclencher l'alarme avant qu'elle explose, éviter la bombe. Enchaîner combos.
```

---

## Partie 4 — 5 puzzles « génie »

Niveaux conçus pour **surprendre**, **casser les attentes** ou **demander une résolution contre-intuitive**.

---

### G‑1 « Le suicide volontaire »

*La solution passe par se transformer en squelette soi-même pour franchir une barrière.*

```js
{
  id: "genius-1", world: 7, title: "Le suicide volontaire",
  hint: "Seul un squelette peut traverser. Sacrifie-toi.",
  // Rails + "barrière de spectres" col 10 : passage bloqué pour humains, OK pour squelettes.
  // (Implémentation : tile "spirit_gate" qui push back wagons si !isSkeleton)
  layout: "v2:" + railRow(3, 16) + "," + tile(6, 13, "L") + "," + tile(10, 13, "Q") + "," + tile(14, 12, "L") + "," + tile(15, 11, "C") + "," + tile(16, 11, "C"),
  playerSpawn: { col: 4, row: 13 },
  allowedTools: ["water", "erase"], // NOTE: water disponible mais piège si utilisé trop tôt
  tileBudget: 1,
  wagonLimit: 2,
  objectives: [
    { id: "coin2", type: "coin", target: 2, label: "2 pièces derrière la barrière" },
  ],
  stars: { time: { under: 60 }, efficient: { tilesUnder: 0 } },
  timeLimit: 100,
}
// PIÈGE : le joueur pense « eau sous lave = traverser humain ». FAUX.
// La barrière (Q = spirit_gate) ne laisse passer QUE les squelettes.
// SOLUTION : laisser le wagon passer la 1ʳᵉ lava → devient squelette → franchit la barrière
// → 2ᵉ lava inutile → collecte pièces.
// La 2ᵉ lave pré-placée col 14 est un LEURRE.
```

*(Implémentation `spirit_gate` : ~40 lignes, `k.onCollide("spirit_gate")` avec vel.x=-abs(vel.x) si wagon n'a aucun passenger skeleton.)*

---

### G‑2 « Timing de spawn »

*Le puzzle n'est pas spatial : c'est le moment d'appuyer sur X.*

```js
{
  id: "genius-2", world: 7, title: "La fenêtre de tir",
  hint: "2 rail_loops tournent différemment. Attend le bon moment pour lancer.",
  // 2 rail_loops pré-placées. L'objectif ne peut se valider que si un wagon entre
  // quand les loops sont "alignées" (même phase angulaire). 
  // Implémentation : variable globale phase_loops, seulement quand |phaseA - phaseB| < 0.1
  // → bonus combo "SYNCHRONIZED" +500pts instant.
  layout: "v2:" + railRow(3, 16) + "," + tile(7, 12, "X") + "," + tile(12, 12, "X"),
  playerSpawn: { col: 4, row: 13 },
  allowedTools: ["erase"],
  tileBudget: 0,
  wagonLimit: 5,
  objectives: [
    { id: "score500", type: "score", target: 500, label: "500 pts (timing !)" },
  ],
  stars: { time: { under: 60 }, efficient: { tilesUnder: 0 } },
  timeLimit: 120,
}
// SOLUTION : observer la rotation visuelle des loops. Lancer un wagon uniquement
// quand les 2 bras sont alignés pour cueillir le bonus SYNCHRONIZED.
// Niveau pédagogique sur la *temporalité* plutôt que sur la *construction*.
```

*(Implémentation : ~30 lignes pour tracker phase et trigger bonus. Le "timing" est le vrai puzzle.)*

---

### G‑3 « Le pied de nez »

*La solution est de NE RIEN poser.*

```js
{
  id: "genius-3", world: 7, title: "Le paresseux",
  hint: "Atteins 150 points. Aucune restriction. Aucun ordre de grandeur.",
  // Lava et coins pré-placés de sorte qu'un wagon lancé sans rien faire fait 150 pts tout seul.
  layout: "v2:" + railRow(3, 16) + "," + tile(7, 13, "L") + "," + tile(10, 13, "L") + "," + tile(13, 13, "L") +
    "," + tile(5, 12, "C") + "," + tile(8, 12, "C") + "," + tile(11, 12, "C") + "," + tile(14, 12, "C"),
  playerSpawn: { col: 4, row: 13 },
  allowedTools: ["lava", "water", "coin", "boost", "trampoline", "fan", "erase"], // tout dispo
  tileBudget: 10,
  wagonLimit: 3,
  objectives: [
    { id: "score150", type: "score", target: 150, label: "150 pts" },
  ],
  stars: { time: { under: 15 }, efficient: { tilesUnder: 0 } }, // 3 étoiles = RIEN poser
  timeLimit: 60,
}
// PIÈGE : le joueur voit "toolBudget 10" et pense qu'il faut optimiser à fond.
// SOLUTION OPTIMALE : ne rien poser, juste lancer les 3 wagons.
// 3 squelettes (60 pts) + 4 pièces x 3 wagons (120 pts) = 180 pts.
// Leçon : parfois le niveau est déjà résolu, il suffit d'observer.
```

---

### G‑4 « Apocalypse à 2 wagons »

*Déclencher APOCALYPSE (5 transforms en 2.5s) avec seulement 2 wagons → impossible sans loops.*

```js
{
  id: "genius-4", world: 7, title: "Impossible Apocalypse",
  hint: "APOCALYPSE (5 transforms en 2.5s). Tu n'as que 2 wagons. Trouve.",
  layout: "v2:" + railRow(3, 16),
  playerSpawn: { col: 4, row: 13 },
  allowedTools: ["lava", "portal", "magnet", "boost", "erase"],
  tileBudget: 8,
  wagonLimit: 2,
  objectives: [
    { id: "apo1", type: "apocalypse", target: 1, label: "1 APOCALYPSE (2 wagons !)" },
  ],
  stars: { time: { under: 60 }, efficient: { tilesUnder: 6 } },
  timeLimit: 100,
}
// SOLUTION : créer un VORTEX (portal + magnet adjacent) qui fait tourner le wagon.
// Multi-lava groupées (4 flaques alignées cols 8/9/10/11) → wagon passe chaque lave,
// la règle "passage en lave compte même si déjà squelette" (campaign cooldown 1s)
// génère 5 transforms cumulés entre les 2 wagons en < 2.5s.
// Le pass-through skeleton count (wagons.js:932) est la clé. 
// Niveau qui enseigne au joueur une règle cachée du moteur.
```

---

### G‑5 « Le prépareur »

*Coopération séquentielle avec soi-même : wagon 1 prépare le chemin, wagon 2 le suit.*

```js
{
  id: "genius-5", world: 7, title: "Préparer le chemin",
  hint: "Wagon 1 casse le pont. Wagon 2 doit prendre l'autre route.",
  // 2 routes parallèles : route haute (rails row 11) via rail_up, route basse (rails row 13).
  // Un pont fragile sur route basse. Une "porte" (gate) sur route haute ouverte par switch.
  // Le switch est traversé SEULEMENT par wagon cassant le pont (placement contraint).
  layout: "v2:" +
    railRow(3, 7) + "," + tile(8, 12, "U") + "," + tile(9, 11, "U") + "," + railRow(10, 12, 11) + "," + tile(13, 11, "D") + "," + tile(14, 12, "D") + "," + railRow(15, 16) + "," +
    tile(8, 13, "N") + "," + tile(9, 13, "N") + "," + tile(10, 13, "N") + "," + tile(11, 13, "N") + "," +
    tile(12, 13, "G") + "," + // gate A basse
    tile(11, 11, "S") + ",", // switch A haute, lié à gate basse
  playerSpawn: { col: 4, row: 13 },
  allowedTools: ["lava", "coin", "erase"],
  tileBudget: 3,
  wagonLimit: 2,
  objectives: [
    { id: "coin6", type: "coin", target: 6, label: "6 pièces au bout" },
  ],
  stars: { time: { under: 90 }, efficient: { tilesUnder: 2 } },
  timeLimit: 150,
}
// SOLUTION : wagon 1 part, prend la route HAUTE (remontée via rail_up), appuie sur le switch,
// atterrit à droite. Mais sa traversée consomme 2 crossings du pont ? NON — la route haute 
// court-circuite le pont. Le joueur doit saisir que le SWITCH sur la route haute 
// débloque la GATE sur la route basse où le wagon 2 prend la route basse, 
// collecte les pièces pré-placées sur route basse.
// Deux routes + switching = puzzle de *routing*.
```

---

## Partie 5 — Recommandations de priorisation

Classement par **rapport gain/coût**. S = < 2h code, M = 2-5h, L = 5-10h.

### Priorité 1 — GAIN MAX / COÛT MIN (à faire en premier)

| # | Item | Complexité | Gain | Justification |
|---|---|---|---|---|
| 1 | **Wirer `progress("geyser")` + `progress("constellation")` + `progress("metronome")` + `progress("magnetField")`** | **S** (~15 L) | Débloque 8 niveaux puzzle immédiats | Code détecteur existe déjà, il suffit de brancher 4 hooks dans `main.js` onUpdate |
| 2 | **6‑1 « Le pont chancelant »** (niveau pur data, 0 nouveau code) | **S** (data only) | Exploite la mécanique bridge déjà codée | Niveau qui existe quasi-gratuit |
| 3 | **6‑2 « Tunnel maléfique »** (niveau pur data) | **S** | Exploite tunnel déjà codé | Idem, forcera le joueur à découvrir la duplication |
| 4 | **6‑10 « Cascade fatale »** (niveau pur data) | **S** | Cascade combo inexploité | Le bridge temporaire 8s est juicy |
| 5 | **6‑14 « Yin Yang infini »** (niveau pur data, besoin magnet+portal existant) | **S** | 1 wagon infini = puzzle mémorable | Utilise mécaniques existantes |

**Sous-total P1** : 5 items, ~4h cumul. Enrichit la campagne de **5 niveaux profonds** sans ligne de nouveau moteur.

### Priorité 2 — MOYEN (nouvelle mécanique ciblée)

| # | Item | Complexité | Gain | Justification |
|---|---|---|---|---|
| 6 | **Objectif `visitor`** (type + spawn + hook collide) | **M** (~50 L) | 3 niveaux nouveaux (6‑3, 6‑7, 7‑2) | Mécanique simple, thématique (montrer du monde dans le parc) |
| 7 | **Tuile `spirit_gate`** (pour G‑1 « suicide volontaire ») | **M** (~40 L) | 1 puzzle génie | Force le joueur à utiliser la transformation |
| 8 | **Tuile `bomb`** + fail + sprite | **M** (~60 L) | 3 niveaux (6‑8, 7‑5, 7‑9) | Ajoute contrainte spatiale riche |
| 9 | **Tuile `alarm`** (variant flood / freeze / wind) | **M** (~70 L) | 3 niveaux (6‑9, 7‑6, 7‑10) | Introduit dimension temporelle |

**Sous-total P2** : 4 items, ~15h. Débloque **10 nouveaux niveaux**.

### Priorité 3 — PLUS LOURD (changements toolbar)

| # | Item | Complexité | Gain | Justification |
|---|---|---|---|---|
| 10 | **Tuiles `switch` + `gate`** (pairing couleur) | **L** (~80 L + sprites) | 3 niveaux + G‑5 | Mécanique riche, mais demande UI toolbar |
| 11 | **Tuiles `fan_h` →/← directionnelles** | **M** (~50 L) | 3 niveaux | Variante existante, sprite à dessiner |
| 12 | **G‑2 « timing synchronisé »** (bonus combo sur phase loops) | **M** (~30 L) | 1 puzzle génie | Mécanique de phase, novatrice |

**Sous-total P3** : 3 items, ~12h.

### Priorité 4 — À LONG TERME

| # | Item | Complexité | Gain | Justification |
|---|---|---|---|---|
| 13 | Monde 7 « Puzzles de génie » (G‑1..G‑5) assemblé complet | **L** | 5 niveaux end-game | Besoin de 2 nouvelles tuiles + wiring |
| 14 | Tutoriels contextuels pour chaque nouvelle mécanique | **M** | Accessibilité Milan 8 ans | Hints insuffisants pour 1ʳᵉ découverte |
| 15 | Hub menu par monde avec badge « nouvelle mécanique » | **S** | UX | Cosmétique mais aide à l'apprentissage |

---

### Plan d'attaque recommandé (3 sessions)

**Session A (≈ 3h)** : P1 (items 1→5). Livre **5 niveaux Monde 6** + wire les 4 hooks manquants. Commit atomique par niveau + 1 commit hook.

**Session B (≈ 5h)** : P2 (items 6, 7, 8). Livre mécaniques `visitor`, `spirit_gate`, `bomb`. Commits par mécanique. Ajoute niveaux 6‑3 / 6‑7 / 6‑8 / 7‑2 / 7‑5 / 7‑9 / G‑1.

**Session C (≈ 6h)** : P2 (item 9) + P3 (items 10, 11) + P4 (item 13). Livre `alarm`, `switch/gate`, `fan_h`. Finit les 4 puzzles génie restants. Lance Monde 7 complet.

**Total** : **~14h de travail dev** pour doubler la campagne (38 → 53 niveaux + 5 génie = 58). Le cœur du moteur reste intact. Zéro refacto nécessaire.

---

### Remarques de designer senior

1. **La règle cooldown 1 s « pass-through skeleton »** (wagons.js:932) est le secret technique le plus puissant du moteur. Elle mérite d'être **thématisée** par un niveau qui l'enseigne explicitement (G‑4 le fait).
2. **Milan 8 ans** : les niveaux G‑2 (timing) et G‑5 (prépareur) sont probablement trop durs. Les garder en « bonus stars » optionnelles, pas en path critique.
3. **User a validé « pont fragile » comme contrainte intéressante**. L'étendre à `bomb`, `alarm`, `spirit_gate` respecte cette veine « contraintes qui créent le puzzle ».
4. **Éviter l'inflation de tuiles** : 4 nouvelles max (visitor, switch/gate comme paire, bomb, alarm) = +4 slots toolbar. Au-delà, l'UI touch mobile devient illisible.
5. **Pattern récurrent des 15 niveaux** : **pré-placer** des tuiles contraignantes (gate, bomb, bridge fragile) plutôt que laisser le joueur construire = resserre l'espace de solutions = puzzle plus précis.
6. **Respect du style user** : zéro combo-juice automatique, zéro avis cosmétique. Les hints sont **factuels** et formulent **le but**, jamais la solution.

---

*Fin du document. Feedback user attendu avant toute implémentation.*

# Spec — Labyrinthe (round 3 backlog créatif, 5/5 final)

> Copie conseillée dans `/Users/mike/Work/milan project/.claude/specs/labyrinthe.md` côté repo (convention suivie par les 4 specs round 3 précédents : `parade-qte.md`, `reparation-express.md`, `aire-tir-mobile.md`, `boss-goret.md`).

## 1. Contexte & choix d'option

Backlog CLAUDE.md : "Labyrinthe" = dernier item "round 3 créatif", description floue "niveau scénaristique maze". C'est **le seul round 3 non-récurrent** : les 4 autres (parade, réparation, aire tir, boss) sont des événements à spawn par timer sur toute scène sandbox/run. Labyrinthe doit donc être un **niveau** distinct.

**Option retenue : A + C hybride minimaliste = 2 nouveaux niveaux campagne `7-4 Labyrinthe` et `7-5 Dédale final` dans le Monde 7 "Contrats VIP"** (qui s'arrête actuellement à `7-3`, cf `src/levels.js:857-915`). Aucune nouvelle tile, aucun fog de guerre, aucun nouveau mode dans le router. **0 ligne** hors `src/levels.js` et éventuellement 2 lignes cosmétiques dans `src/campaign-menu.js` (renaming monde 7 + seuil ⭐ optionnel). Bundle impact : **≈ +0.4 KB gz** (texte JSON dans `LEVELS`).

**Pourquoi pas B (mode séparé avec fog)** : 200+ lignes nouveau code, nouveau splash entry, shader/overlay post-FX à gérer par un agent feature-dev → risque de casser le cap 103.43 → 105 KB gz. **Pourquoi pas C pur (sandbox challenge 3min)** : dupliquerait la logique de campaign (score, timer, étoiles) dans sandbox alors que le système campagne le fait déjà parfaitement. **Pourquoi A fonctionne bien** : le format `layout` de niveaux supporte déjà des tracé multi-rows via `rail_up`/`rail_down` (exemples `2-6`, `3-6`, `4-3`). Le "scénaristique maze" se traduit naturellement en un circuit serpentant à plusieurs étages avec lava bloquante et budget de tuiles réduit.

Le "feel maze" vient de :
- **Rails qui montent/descendent/repartent** (4-5 changements d'altitude) → l'œil doit suivre un tracé sinueux.
- **Laves pré-placées formant des murs verticaux** (3 tuiles empilées, visuel de muraille de feu).
- **Pièces "égarées" éparses** à des positions piégées (au-dessus d'une lave, derrière un saut, dans un cul-de-sac qui se termine par un portail).
- **Tunnel hanté `X`** (code `X`, cf `constants.js:34`) en bout de parcours = "sortie du labyrinthe" narrative, transforme le wagon en squelette automatiquement.
- **Bombe `E`** au milieu comme "trap" qui peut soit tuer la run (failOn) soit être utilisée par le joueur pour détoner la muraille lava.

## 2. Fichiers impactés

| Fichier | Ranges | Action |
|---|---|---|
| `/Users/mike/Work/milan project/src/levels.js` | après L915 (fin `7-3`), avant L916 `];` | **AJOUTER 2 entrées** `7-4 Labyrinthe` + `7-5 Dédale final` ; respecter indentation/virgule trailing |
| `/Users/mike/Work/milan project/src/campaign-menu.js` | L13-23 | **Optionnel** : renommer `7: "Monde 7 — Contrats VIP"` → `7: "Monde 7 — Contrats VIP & Labyrinthe"` OU laisser tel quel. Seuil `WORLD_STAR_THRESHOLDS[7] = 45` inchangé (déjà en place L23) |

**Aucun changement dans** : `campaign.js`, `main.js`, `tiles.js`, `serializer.js`, `constants.js`, `sprites.js`, `audio.js`. Toutes les tiles utilisées (`L`, `W`, `R`, `U`, `D`, `C`, `B`, `T`, `F`, `P`, `I`, `M`, `N`, `X`, `E`) existent déjà (cf `constants.js:30-36`).

## 3. Comportement attendu

1. Dans le menu campagne (F1 → Campagne), sous le monde 7 `Contrats VIP`, apparaissent **2 cartes de niveau supplémentaires** après `7-3 Compte à rebours` : `7-4 Labyrinthe` et `7-5 Dédale final`.
2. Elles sont **verrouillées** tant que le joueur n'a pas terminé `7-3` (cf `campaign-menu.js:26-38` : `isLevelUnlocked` vérifie `prevStars >= 1` dans le même monde).
3. `7-4 Labyrinthe` propose un circuit **serpentant sur 3 étages** (rails rows 13 → 11 → 9 → 11 → 13 via montées/descentes). Layout pré-placé : ~18-22 tiles dont 3 "murailles" de lave verticales (3 tiles empilées) et 4 pièces "égarées" en positions acrobatiques. Budget joueur : 4 tuiles (eau, boost, fan, trampoline). Objectif : **ramasser 4 pièces** + **1 squelette** via le tunnel hanté en sortie. Temps max 120s. Wagons limite 3.
4. `7-5 Dédale final` = version hardcore : layout plus dense avec portails, bombes pré-placées, **failOn skeleton brûlé** (zéro tolérance) — le wagon doit atteindre le tunnel de sortie *intact* pour fournir une pièce VIP (visiteur pré-placé à embarquer). Budget joueur : 3 tuiles (water, bridge, boost). Objectifs : **2 pièces ramassées** + **1 visiteur VIP embarqué**. Temps max 150s.
5. Les deux niveaux utilisent le système stars existant (1⭐ = complété, 2⭐ = sous N secondes, 3⭐ = sous M tuiles). Platine = condition corsée.
6. L'intro modale (`showLevelIntro` dans `campaign.js:92`) affiche automatiquement le `hint` narratif qui présente le niveau comme un labyrinthe (ton scénarisé : *"Tu entres dans le Dédale de Feu. Les murailles de lave bordent chaque corridor. Trouve la sortie — le tunnel hanté t'attend."*).
7. Pas de nouvelle mécanique gameplay : **tout** repose sur le layout + budget + objectifs du système existant. La narration passe par `hint` (déjà affiché L124 de `campaign.js`).
8. Aucun impact perf : un niveau supplémentaire = 1 call `findLevel` + 1 deserialize. Coût identique aux 28 niveaux existants.
9. Bundle : `LEVELS` actuel ≈ 11 KB min, chaque niveau ≈ 380 octets JSON → 2 niveaux = ~760 octets = **+0.3 KB gz après compression**.
10. Aucune régression possible sur niveaux existants : ajout pur, pas de modif de l'array.

## 4. Pseudo-code des fixes

### 4.1 `src/levels.js` — Ajout après ligne 915 (fin `7-3`, avant `];`)

```js
  // 7-4 : Le Labyrinthe — circuit multi-étages avec murailles lave
  {
    id: "7-4",
    world: 7,
    title: "Labyrinthe",
    hint: "Un dedale de rails et de laves. Trouve la route jusqu'au TUNNEL HANTE en sortie. 4 pieces egarees a ramasser + 1 squelette final.",
    // Tracé : rail row13 (3-5) → UP col6 → row12 col7 → UP col8 → row11 (9-11) → DOWN col12 → row12 col13 → DOWN col14 → row13 (15-16) + TUNNEL X en 16,13
    // Murailles lave : col 6 rows 11-13 (vertical), col 10 rows 9-11, col 14 rows 11-13 (formes visuelles de murs)
    // Pièces égarées : (7,10), (10,8), (12,10), (15,10) — accessibles via fan/trampoline
    layout: "v2:"
      + "3.13.R,4.13.R,5.13.R,6.12.U,7.12.R,8.11.U,9.11.R,10.11.R,11.11.R,12.12.D,13.12.R,14.13.D,15.13.R,16.13.R"
      + ",6.11.L,6.10.L,10.10.L,10.9.L,14.12.L,14.11.L"
      + ",7.10.C,10.8.C,12.10.C,15.10.C"
      + ",16.13.X",
    playerSpawn: { col: 4, row: 13 },
    allowedTools: ["water", "boost", "fan", "trampoline", "erase"],
    tileBudget: 4,
    wagonLimit: 3,
    objectives: [
      { id: "coin4", type: "coin", target: 4, label: "Ramasse 4 pieces egarees" },
      { id: "skel1", type: "skeleton", target: 1, label: "1 wagon dans le tunnel de sortie" },
    ],
    stars: { time: { under: 90 }, efficient: { tilesUnder: 3 } },
    timeLimit: 120,
    platinum: { label: "Labyrinthe termine sous 60s", check: (r) => r.time < 60 },
  },
  // 7-5 : Dédale final — failOn skeleton, visiteur VIP à embarquer
  {
    id: "7-5",
    world: 7,
    title: "Dedale final",
    hint: "Laisse le VIP embarquer et atteins la sortie SANS qu'aucun wagon ne brule. Les bombes peuvent aider — ou tuer ta run.",
    // Circuit : row13 rails 3-6, rail_up 7, row12 rails 8-11, rail_down 12, row13 rails 13-16
    // Murailles : col 7 rows 10-12 (lave, bloque tout saut direct), col 12 rows 10-12 (lave)
    // Bombes : (9,13) (10,13) au-dessus des rails → wagon déclenche → lave → danger
    // Portails : (5,13) entrée A / (14,13) sortie B (téléport pour bypass muraille)
    // Pièces : (11,10), (13,10)
    // Visiteur VIP : col 10 row 13 (sur rail row12 = embarquable)
    layout: "v2:"
      + "3.13.R,4.13.R,5.13.P,6.13.R,7.12.U,8.12.R,9.12.R,10.12.R,11.12.R,12.13.D,13.13.R,14.13.P,15.13.R,16.13.R"
      + ",7.12.L,7.11.L,7.10.L,12.12.L,12.11.L,12.10.L"
      + ",9.13.E,10.13.E"
      + ",11.10.C,13.10.C"
      + ",16.13.X",
    playerSpawn: { col: 4, row: 13 },
    allowedTools: ["water", "bridge", "boost", "erase"],
    visitors: [
      { col: 10, row: 12, isVIP: true },
    ],
    tileBudget: 3,
    wagonLimit: 3,
    failOn: { skeleton: 1 },
    objectives: [
      { id: "vip1", type: "visitor", target: 1, label: "Embarque le VIP" },
      { id: "coin2", type: "coin", target: 2, label: "Ramasse 2 pieces" },
    ],
    stars: { time: { under: 120 }, efficient: { tilesUnder: 2 } },
    timeLimit: 150,
    platinum: { label: "VIP livre sans toucher a une bombe", check: (r) => r.visitors >= 1 && !r.tools.includes("erase") && r.tiles <= 2 },
  },
```

> ⚠ Les positions précises ci-dessus sont **à affiner par playtest** (cf §10 Test plan). Le feature-dev doit lancer le niveau via `window.__campaign.loadLevel("7-4")` et ajuster les coords si le wagon tombe dans un trou ou si une pièce est inatteignable.

### 4.2 `src/campaign-menu.js` (optionnel cosmétique, L17)

```js
// avant
7: "Monde 7 — Contrats VIP",
// après
7: "Monde 7 — Contrats VIP & Dedale",
```

*(Pas indispensable ; le monde contient déjà 3 niveaux VIP + 2 labyrinthes, le titre reste cohérent.)*

### 4.3 Aucun autre changement

- `campaign.js` gère déjà `visitors`, `failOn`, `score`, `coin`, `skeleton`, `visitor` objectives (cf L83-87 + L140-160).
- `serializer.js:63-91` sait lire les codes `R/U/D/L/C/X/P/E/M` etc. tant que `r < GROUND_ROW` (14). Tous les rows utilisés sont ≤ 13 ✅.
- L'affichage ambient du niveau (ciel, décor) vient de `createSceneDecor` qui n'est PAS gated par mode campaign → l'ambiance "labyrinthe" vient purement du layout visible.

## 5. Pièges KAPLAY & conventions

- **Row range** : `serializer.js:87` refuse `r >= GROUND_ROW` (14). Tous les layouts proposés utilisent rows 9-13, OK.
- **Col range** : `c < COLS` (40). Tous ≤ 16, OK.
- **Tile `X` (tunnel hanté)** : transforme le wagon en squelette automatiquement (cf niveau `6-2`). Compte **bien** pour l'objectif `skeleton` via `progress("skeleton")` hook dans `wagons.js` ? **À vérifier** par le feature-dev : `grep "tunnel" src/wagons.js | grep skeleton`. Si le tunnel n'émet pas l'event `onSkeleton`, l'objectif `skel1` ne validera pas. **Mitigation** : si bug, remplacer l'objectif `7-4` par `{ type: "score", target: 150 }` qui est 100% fiable.
- **Bombe `E` + `failOn: { skeleton: 1 }`** : une bombe qui explose convertit son wagon en squelette → fail instantané. C'est **voulu** dans `7-5` (c'est le piège narratif). Documenter dans le `hint`.
- **Visitor `isVIP: true` sur row 12** : `campaign.js:85` appelle `spawnVisitorAt(v.col, v.row, { isVIP: !!v.isVIP, walkSpeed: 0 })`. Le visiteur tombe au sol (gravity) s'il n'y a pas de rail sous lui. Le rail row 12 col 10 est bien présent dans le layout → OK. Sinon le visiteur tombera sur le ground row 13.
- **Portail P** : placer 2 tuiles `P` dans le même layout = `placeTile` appelle la logique auto-pair (cf `tiles.js:217-249`). Les deux premières apparitions `A` et `B` se pairent. OK avec ordre d'apparition dans la string.
- **Lava + rail sur même cell** : `placeTile` écrase l'existant (L121-128). L'ordre dans la string layout est donc important : placer **d'abord** les rails, **ensuite** les lavas → sauf si lava doit *remplacer* un rail (voir level `5-5` où lava remplace rail row 13 cols 8-10). Nos murailles lave sont sur rows 10-12 (hors rails row 13), donc pas de conflit.
- **Budget tuiles == 3 avec `allowedTools.includes("erase")`** : `erase` est toujours autorisé (cf `campaign.js:336`) mais consomme le budget ? → À vérifier : `onTileEvent` L163-171 incrémente `tilesPlaced` sans distinction. **Impact** : si le joueur erase 1 tuile posée et en repose une autre = 2 tuiles consommées sur le budget. Comportement normal, documenter dans hint si besoin.
- **`hint` et accents UTF-8** : Cf `commit 82234a9` qui a restauré les accents. **DOIT conserver** les accents dans le hint (`Dédale`, `brûle`, `égarées`). Si le feature-dev fait des édits texte, vérifier qu'ils ne régressent pas sur ce point.

## 6. Critères de succès

- [ ] `wc -l src/levels.js` passe de 935 → **~1000 lignes** (+65 L approx pour 2 niveaux bien indentés).
- [ ] `npm run build` réussit, bundle gz ≤ **103.9 KB** (actuel 103.43, cap 105 → marge 1.5 KB respectée).
- [ ] Le niveau `7-4` charge sans erreur console : `window.__campaign.loadLevel("7-4")` dans le devtools doit peupler la scène avec rails + lavas + pièces + tunnel.
- [ ] La carte `7-4` apparaît dans `createCampaignMenu` sous le monde 7 (test manuel : F1 → Campagne → scroller Monde 7 → voir 5 cartes).
- [ ] Tant que `7-3` n'a pas 1⭐, `7-4` apparaît grisée + cadenas (cf `campaign-menu.js:68-69`).
- [ ] Jouer `7-4` du début à la fin est **gagnable** avec 3-4 tuiles bien placées (playtest manuel agent : il doit pouvoir obtenir au moins 1⭐).
- [ ] `7-5` `failOn skeleton` déclenche bien `onLose({ reason: "forbid_skeleton" })` si une bombe explose un wagon (test manuel).
- [ ] Aucune nouvelle erreur `window.addEventListener("error")` en chargeant les 2 niveaux.
- [ ] Le `totalStars` max affiché dans `campaign-menu` (`maxStars = LEVELS.length * 3`) passe de 84 → 90 automatiquement. Vérifier que la chaîne "CHAMPIONS DU FOYER" splash screen (`splash.js:83` → `⭐ X / 90`) reflète bien le nouveau total (hardcodé **90** dans `splash.js:83` ! **À corriger**).

## 6.1 Sous-tâche correction hardcode splash

- `src/splash.js:83` : `<div>⭐ ${totalStars} / 90</div>` — valeur hardcodée. Remplacer par :
  ```js
  import { LEVELS } from "./levels.js";
  // ...
  <div>⭐ ${totalStars} / ${LEVELS.length * 3}</div>
  ```
  Même pattern dans `campaign-menu.js:53` → déjà dynamique (`maxStars = LEVELS.length * 3`). Donc splash à corriger uniquement. **+1 commit atomique** `fix(splash): unhardcode max stars count` (optionnel mais propre).

## 7. Effort estimé

**1 commit atomique recommandé** :

```
feat(campaign): ajoute 7-4 Labyrinthe et 7-5 Dedale final (round 3 final)
```

- Diff = `src/levels.js` uniquement (+65 L), optionnellement `src/campaign-menu.js:17` (rename titre monde 7).
- Effort feature-dev : **45-75 min** incluant playtest manuel des 2 niveaux pour ajuster les positions (rails, lavas, pièces), vérifier que chaque objectif est atteignable avec le budget annoncé.

**Option +1 commit polish** :
```
fix(splash): unhardcode max stars count (LEVELS.length * 3)
```
5 min, 1 ligne.

**Ordre recommandé** :
1. Implémenter `7-4` seul + playtest + ajuster positions.
2. Implémenter `7-5` avec visitor + bomb + failOn + playtest.
3. (Optionnel) Corriger hardcode splash.
4. `npm run build` pour vérifier bundle gz ≤ 103.9 KB.
5. Commit + push + CI deploy.

## 8. Risques & mitigations

| Risque | Probabilité | Mitigation |
|---|---|---|
| Tunnel `X` n'émet pas l'event `onSkeleton` → objectif `skel1` de `7-4` ne valide jamais | Moyenne | Remplacer objectif par `{ type: "score", target: 150 }` ou tester et corriger côté `wagons.js` (out of scope de ce commit, garder objectif score si doute) |
| Wagon tombe dans trou entre rails rows 12 et 11 (gap vertical) | Élevée au 1er playtest | Ajouter `rail_up` / `rail_down` supplémentaires pour lisser les transitions (cf pattern level `2-6`) |
| Muraille lave row 10-12 col 6 fait brûler le wagon qui passe dessous row 13 → dommage de splash ? | Faible | `lava` ne fait `onSkeleton` qu'au **contact direct** cellule wagon/lava. Wagon row 13 + lava row 10-12 = 3 cellules d'écart, safe. |
| Bundle dépasse 103.9 KB gz | Très faible | 2 niveaux = ~760 octets JSON, gz ≈ +300 octets, loin du cap |
| Visiteur VIP spawn sur rail row 12 tombe dans le vide avant que le wagon passe | Moyenne | `campaign.js:85` passe `walkSpeed: 0` → VIP statique. Si VIP tombe, le code visitor-system gère la gravité (il atterrit sur ground_row). Peut demander d'ajuster à row 13 si problème. |
| `platinum.check` de `7-5` est bizarre (`!r.tools.includes("erase")` alors que erase est toujours inclus dans allowedTools) | Basse | Remplacer par un vrai prédicat : `r.tiles <= 1` ou `r.time < 90`. Le spec ci-dessus est préliminaire, à ajuster au playtest |
| Regex accents UTF-8 re-décapés par feature-dev | Moyenne (happened in session G, cf commit `82234a9`) | Reviewer le diff avant commit, conserver `é è ê ç` partout |

## 9. Décision bundle

Delta estimé : **+0.3 à +0.5 KB gz** (2 niveaux JSON, ~760 octets, gz ratio ~0.4). Actuel 103.43 KB → prévu **103.7-103.9 KB**. Marge restante vs cap 105 KB : ≥ 1.1 KB. ✅

Si le splash hardcode est corrigé aussi : +1 ligne JS, négligeable (<50 octets).

## 10. Test plan

### 10.1 Playtest manuel `7-4`

1. `npm run dev`, ouvrir `http://localhost:5173/?mobile=0`.
2. Console : `window.__campaign.loadLevel("7-4")` (ou passer par le menu campagne F1 en trichant sur `save.campaign.totalStars` si monde 7 pas débloqué : `save.campaign.totalStars = 99; persistSave(save); location.reload()`).
3. Observer :
   - Rails visibles sur rows 13, 12, 11 avec transitions propres.
   - 3 murailles verticales de 3 lavas empilées (col 6, col 10, col 14).
   - 4 pièces jaunes visibles aux positions spécifiées.
   - Tunnel hanté bleu foncé sur col 16 row 13 (sprite `tunnel_visual`).
4. Lancer un wagon (touche X). Vérifier qu'il suit le tracé sans tomber (si tombe : ajuster `rail_up`/`rail_down`).
5. Poser 1 trampoline + 1 fan pour catapulter le wagon vers les pièces hautes.
6. Ramasser les 4 pièces → objectif `coin4` ✓ dans l'intro.
7. Wagon entre le tunnel → objectif `skel1` ✓ → win popup + 1⭐ minimum.

### 10.2 Playtest `7-5`

1. `window.__campaign.loadLevel("7-5")`.
2. Vérifier VIP (couronne) visible col 10 row 12.
3. Lancer un wagon, il doit embarquer le VIP en passant → objectif `vip1` ✓.
4. **Test failOn** : laisser un wagon percuter la bombe col 9 row 13 → wagon devient squelette → perte immédiate + popup `forbid_skeleton`.
5. **Test victoire** : poser water sur bombe col 9 pour la neutraliser (ou éviter via portail) → wagon atteint sortie intact + VIP livré → win.

### 10.3 Bundle check

```bash
cd /Users/mike/Work/milan\ project && npm run build 2>&1 | grep -E "dist/.*\.js"
```

Vérifier que la taille gzippée du bundle principal reste ≤ 103.9 KB.

### 10.4 Regression check

1. Charger `1-1` → doit toujours marcher.
2. Charger `7-3` → doit toujours marcher.
3. Menu campagne : vérifier que les 5 cartes du monde 7 s'affichent correctement, cadenas sur `7-4` et `7-5` tant que `7-3` non fini.

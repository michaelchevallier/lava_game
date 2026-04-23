# Spec — Aire Tir Mobile (Round 3, session G — évolution Skull Stand)

## 1. Contexte

Le stand `TIR AUX CRANES` (`src/skull-stand.js`, 151 L) existe depuis longtemps :
5 crânes qui rebondissent dans un cadre fixe, click souris = +50 pts (ou +300
si doré 5%). C'est du click statique, pas très « foire » — on veut y ajouter
le classique **stand de tir aux canards en file qui défilent**.

Choix d'archi : **extension en place du skull-stand** avec un **cycle 30s/30s**
(phase CRÂNES ↔ phase CANARDS) plutôt qu'un nouveau stand qui encombrerait la
map. Le stand reste au même endroit (col 30, row 2), mêmes dimensions
(5×2 tiles), mêmes couleurs bois rouge foncé, mais le label change, les
entités internes switchent, et au-dessus du cadre passe une **rangée de
canards** horizontale continue pendant la phase canards.

Nouveauté mécanique : le joueur **tire une fléchette parabolique** depuis sa
position via sa touche `board` (`E` Mario / `O` Pika) quand il est proche du
stand (<150 px). La fléchette suit une trajectoire balistique (gravité 200,
v0=400, angle calculé pour atteindre le canard le plus proche devant le
joueur). Hit = plumes + popup `+50 !`. **3 canards en <5s = JACKPOT +300pts**
+ mini feu d'artifice + achievement `jackpot_canards`.

**Conflit connu** `E`/`O` déjà partagé entre `reparation-express.tryRepair`
et `tryBoardWagon`. Priorité clarifiée en §2 (reparation → tir → board).

Taille cible : `src/skull-stand.js` passe de 151 L → ~320-350 L (toujours bien
sous 1500). Budget bundle **+1.5 KB gz max** (actuel 100.27 KB, cap dur
102 KB). Zéro nouveau sprite : canard = `drawRect` + `drawTriangle` + `drawCircle`
comme dans `ducks.js:93-126` (réutilisation directe du pattern existant,
aucun import cross-module : on duplique les ~15 lignes localement car le
contexte est différent — file horizontale en haut du stand, pas bassin).

## 2. Fichiers impactés

### Modifié

- `/Users/mike/Work/milan project/src/skull-stand.js` (151 L → ~320 L)
  - Toute la fonction `createSkullStand` devient un système à 2 phases.
  - Nouvelles fonctions locales : `spawnDuck(idx)`, `drawDuckBody(d)`,
    `fireDart(player, targetDuck)`, `updateDart(dart)`, `enterPhase(name)`,
    `tickJackpot(duckHitAt)`, `getNearestPlayerForStand()`,
    `getNearestDuckInFront(player)`.
  - Ajout param d'entrée : `getActivePlayers` (pour trouver le joueur tireur).
  - Phase switch via `k.loop(PHASE_DURATION)`, pas de setInterval.

- `/Users/mike/Work/milan project/src/main.js` (ligne 1013)
  - **Passage param supplémentaire** à `createSkullStand` :
    `getActivePlayers: () => activePlayers`.
  - Aucune autre modif.

- `/Users/mike/Work/milan project/src/players.js` (lignes 267-272)
  - Modifier le handler `k.onKeyPress(opts.keys.board, …)` pour ajouter
    une **3e branche** entre `tryRepair` et `tryBoardWagon` :
    `if (window.__skullStand?.tryFire?.(p)) return;`.
  - Ordre final : `stunned check → tryRepair → tryFire → board/exit`.
  - Le `tryFire` retourne `true` si une fléchette part, `false` sinon.
    Donc si le joueur n'est pas à portée du stand, il peut quand même
    embarquer sur un wagon adjacent sans friction.

### Non modifié

- `src/ducks.js` reste strictement pour la pêche (bassin). Pas d'import
  cross-module vers le stand (découplage propre : même vocabulaire visuel,
  états différents, fusion créerait un god-module).
- `src/minigames.js` n'est **pas** touché : le skull-stand est déjà instancié
  séparément via `createSkullStand` (main.js:1013), pas via
  `createMinigames`. On garde cette convention (stand = bâti fixe, minigames
  = triggers par pattern de tiles).
- Mode campaign : skull-stand est actuellement instancié **inconditionnellement**
  (ligne 1013 avant le branchement campaign). On garde ce comportement actuel
  pour ne pas régresser (le stand existe dans tous les modes). Le `tryFire`
  reste désactivé en campaign via le check `router.get().mode === "campaign"` →
  retourner `false` immédiatement (cohérent avec reparation-express).

## 3. Comportement attendu (user-facing)

1. **Phase CRÂNES (30s, phase de départ)** : identique au comportement actuel.
   Label `TIR AUX CRANES` en haut du stand, 5 crânes qui oscillent, click
   souris pour tuer (+50pts / +300 doré). Aucun changement.
2. **Phase CANARDS (30s, en alternance)** : label devient
   `TIR AUX CANARDS`. Les 5 crânes sont dépops (destroy parts + skull). Une
   **file de 5-7 canards** défile à y=`STAND_Y - 24` (juste au-dessus du
   cadre), de droite à gauche, vitesse constante `-50 px/s`. Spawn initial
   espacé de 60 px. Dès qu'un canard sort à gauche (`x < STAND_X - 30`), il
   est re-positionné à droite (`x = STAND_X + STAND_W + 60 + rand(40)`)
   pour que la file ne se vide jamais.
3. **Canard doré** : 12% de chance à chaque spawn/respawn. Corps jaune-or
   (`k.rgb(255, 215, 0)`), bec orange foncé. Hit = +150 (plutôt que +50).
4. **Tir du joueur** : quand un joueur presse `E`/`O` ET qu'il est à
   distance `<150` px du centre du stand, une fléchette part de sa position
   (offset +14, +20 du topleft = milieu du corps) vers le canard le plus
   proche devant lui (côté selon direction face joueur ; fallback = le plus
   proche tout court si direction ambiguë).
5. **Fléchette parabolique** : projectile 6×2 brun (`k.rgb(110, 70, 30)`),
   rotation dynamique selon `atan2(vy, vx)`. Cinématique : `v0=400`, gravité
   locale `200` (pas la gravité globale 1600, trop forte ; la fléchette doit
   survoler). Calcul de l'angle : simple ballistique pour atteindre la cible
   — dx = `target.x - origin.x`, dy = `target.y - origin.y`,
   angle = `atan2(dy - 0.5*200*(dx/400)^2, dx)` (arc lob).
6. **Hit** : collision circulaire à r=12 px entre fléchette et canard.
   Sur hit → destroy dart + duck visible (garder duck en `.dead=true` 0.2s
   pour animation plumes) + spawn 6 plumes via `spawnFeathers` local (rect
   5×2 blancs rotation angle random, vitesse 60-120, gravité 120). Popup
   `+50 !` (ou `+150 !` si doré). Audio `audio.coin?.()`.
7. **Respawn canard** : 3s plus tard, même `idx` repart de la droite
   (`STAND_X + STAND_W + 60`). Pendant ces 3s la file a un « trou »,
   c'est voulu (rend le jackpot plus tendu).
8. **Cooldown tir** : 0.4s entre deux tirs du même joueur
   (`p._lastDartAt`). Anti-spam. 2P = chaque joueur a son propre cooldown.
9. **Combo JACKPOT** : 3 canards touchés par **un même joueur** en moins de
   5s → popup `JACKPOT ! +300` size 28 couleur `k.rgb(255, 180, 40)`,
   audio `audio.combo?.()`, mini feu d'artifice (24 particules colorées
   comme dans `skull-stand.js:111-118` + `minigames.js:127-139`), unlock
   achievement `jackpot_canards`, `dirShake(0, 1, 10, 0.25)`. Reset le
   compteur (pas de chaîne infinie 6-9-12).
10. **Skeleton / stunned** : un joueur `p.isSkeleton` ou dont
    `p.stunnedUntil > k.time()` ne peut pas tirer — `tryFire` retourne
    `false` sans consommer le cooldown.
11. **Mode campagne** : `tryFire` retourne `false` immédiatement si
    `router.get().mode === "campaign"` (via callback `isCampaign`). Phase
    canards s'affiche quand même visuellement, mais inerte (pas de tir).
    Alternative plus simple : **forcer phase CRÂNES permanent en campagne**
    (pas de switch). À choisir en §9.
12. **Wagons qui traversent** : logique existante `skull-stand.js:127-148`
    (loop 0.3s, invert direction si wagon proche) ne s'applique qu'en phase
    CRÂNES (les canards défilent tout droit, les wagons ne les dérangent pas
    car `y=STAND_Y-24` = au-dessus du cadre). Garder le wrap dans un
    `if (phase === "skulls")`.
13. **Visibilité du stand label hors écran** : le `k.onDraw` global
    (`skull-stand.js:22-36`) dessine le label en coords monde ; pas de souci
    de camera car KAPLAY transforme automatiquement. Le label update son
    texte selon `phase` (`TIR AUX CRANES` vs `TIR AUX CANARDS`).
14. **Transition visuelle douce** : au switch de phase, flash blanc
    0.2s `k.rect(STAND_W, STAND_H) k.color(255,255,255) k.opacity(0.5)
    k.lifespan(0.2)` sur le cadre, petit son `audio.boost?.()`. Évite que
    le joueur croie à un bug.
15. **Debug** : `window.__skullStand.__debug()` → `{ phase, duckCount,
    activeDarts, lastHitBy: {p1, p2}, comboCount: {p1, p2} }`.

## 4. API du module (après refonte)

```js
// src/skull-stand.js
export function createSkullStand({
  k, gameState, audio, showPopup, registerCoin,
  getActivePlayers,  // NEW — () => [p1, p2?]
  isCampaign,         // NEW — () => bool (tire() disabled in campaign)
  WIDTH, TILE,
}) {
  // ... setup existant : cadre, label ...

  let phase = "skulls";  // "skulls" | "ducks"
  const skulls = [];     // entités crânes (migration depuis var implicite)
  const ducks = [];      // canards
  const darts = [];      // fléchettes actives
  const comboState = new Map();  // player → { hits: [t1, t2, t3], count }

  function enterSkullsPhase() { /* cleanup ducks, spawn 5 skulls */ }
  function enterDucksPhase()  { /* cleanup skulls, spawn 7 ducks */ }
  function tryFire(p) { /* return true si fléchette partie */ }

  k.loop(30, () => {
    phase = phase === "skulls" ? "ducks" : "skulls";
    flashTransition();
    if (phase === "skulls") enterSkullsPhase(); else enterDucksPhase();
  });

  enterSkullsPhase();  // phase initiale

  const api = {
    tryFire,
    __debug: () => ({
      phase,
      duckCount: ducks.filter(d => d.exists?.()).length,
      activeDarts: darts.filter(d => d.exists?.()).length,
      comboCount: {
        p1: comboState.get(getActivePlayers()?.[0])?.hits?.length || 0,
        p2: comboState.get(getActivePlayers()?.[1])?.hits?.length || 0,
      },
    }),
  };
  window.__skullStand = api;
  return api;
}
```

Import : `constants.js` existant suffit (TILE, WIDTH passés en param déjà).

## 5. Pseudo-code des fixes clés

### 5.1 Phase switch — `enterDucksPhase()`

```js
function enterDucksPhase() {
  // Cleanup skulls
  for (const s of skulls) {
    if (s.parts) for (const p of s.parts) { if (p.exists?.()) k.destroy(p); }
    if (s.exists?.()) k.destroy(s);
  }
  skulls.length = 0;

  // Spawn 7 ducks en file horizontale
  const DUCK_Y = STAND_Y - 24;
  const SPACING = 60;
  for (let i = 0; i < 7; i++) {
    spawnDuck(i, STAND_X + STAND_W - 20 - i * SPACING, DUCK_Y);
  }
}

function spawnDuck(idx, x, y) {
  const gold = Math.random() < 0.12;
  const d = k.add([
    k.rect(18, 14),  // invisible hitbox, vrai rendu via onDraw custom
    k.pos(x, y),
    k.opacity(0),    // cache le rect par défaut, on dessine à la main
    k.area({ shape: new k.Rect(k.vec2(0, 0), 18, 14) }),
    k.z(13),
    "duck-stand",
    { duckIdx: idx, gold, vx: -50, dead: false, deadAt: 0 },
  ]);

  // Rendu visuel (vue de droite, bec à gauche car les canards vont à gauche)
  const renderer = k.add([
    k.pos(0, 0), k.z(13),
    { draw() { if (d.exists?.() && !d.dead) drawDuckBody(d); } },
  ]);
  d._renderer = renderer;

  d.onUpdate(() => {
    if (d.dead) return;
    d.pos.x += d.vx * k.dt();
    if (d.pos.x < STAND_X - 40) {
      // wrap vers la droite, recalc gold
      d.pos.x = STAND_X + STAND_W + 60 + Math.random() * 40;
      d.gold = Math.random() < 0.12;
    }
  });

  ducks.push(d);
}
```

### 5.2 Rendu canard (drawDuckBody — copie réduite depuis ducks.js:93-126)

```js
function drawDuckBody(d) {
  const body = d.gold ? k.rgb(255, 215, 0) : k.rgb(255, 230, 80);
  const bill = d.gold ? k.rgb(200, 120, 0) : k.rgb(255, 140, 0);
  k.drawRect({
    pos: k.vec2(d.pos.x, d.pos.y),
    width: 18, height: 14, color: body,
    outline: { color: k.rgb(180, 130, 0), width: 1 },
  });
  // bec à gauche car défile droite->gauche
  k.drawTriangle({
    p1: k.vec2(d.pos.x - 0, d.pos.y + 4),
    p2: k.vec2(d.pos.x - 5, d.pos.y + 7),
    p3: k.vec2(d.pos.x - 0, d.pos.y + 10),
    color: bill,
  });
  k.drawCircle({
    pos: k.vec2(d.pos.x + 5, d.pos.y + 4),
    radius: 2, color: k.rgb(20, 20, 20),
  });
}
```

### 5.3 `tryFire(p)` — calcul ballistique + spawn dart

```js
function tryFire(p) {
  if (phase !== "ducks") return false;
  if (isCampaign?.()) return false;
  if (p.isSkeleton) return false;
  if (p.stunnedUntil && k.time() < p.stunnedUntil) return false;
  const now = k.time();
  if (p._lastDartAt && now - p._lastDartAt < 0.4) return false;

  // Distance au stand (centre)
  const centerX = STAND_X + STAND_W / 2;
  const centerY = STAND_Y + STAND_H / 2;
  const dxStand = (p.pos.x + 14) - centerX;
  const dyStand = (p.pos.y + 20) - centerY;
  if (dxStand * dxStand + dyStand * dyStand > 150 * 150) return false;

  // Cible = canard le plus proche encore vivant
  let target = null, bestD = Infinity;
  for (const d of ducks) {
    if (!d.exists?.() || d.dead) continue;
    const ddx = (d.pos.x + 9) - (p.pos.x + 14);
    const ddy = (d.pos.y + 7) - (p.pos.y + 20);
    const dd = ddx * ddx + ddy * ddy;
    if (dd < bestD) { bestD = dd; target = d; }
  }
  if (!target) return false;

  p._lastDartAt = now;
  spawnDart(p.pos.x + 14, p.pos.y + 20, target.pos.x + 9, target.pos.y + 7);
  audio.jump?.();  // « fffwww » courte, remplace un son dart
  return true;
}
```

### 5.4 `spawnDart()` + `updateDart()`

```js
function spawnDart(ox, oy, tx, ty) {
  const v0 = 400;
  const grav = 200;
  const dx = tx - ox;
  const dy = ty - oy;
  // Approximation : temps de vol t = dx/v0x, v0x = v0*cos(a), v0y = v0*sin(a)
  // On prend un angle simple : atan2(dy - arc, dx) où arc compense la chute
  const t = Math.abs(dx) / 350 + 0.05;  // estimation durée
  const vxInit = dx / t;
  const vyInit = dy / t - 0.5 * grav * t;
  const dart = k.add([
    k.rect(6, 2),
    k.pos(ox, oy),
    k.anchor("center"),
    k.color(k.rgb(110, 70, 30)),
    k.rotate(0),
    k.area({ shape: new k.Rect(k.vec2(-3, -1), 6, 2) }),
    k.z(14),
    "dart",
    { vx: vxInit, vy: vyInit, life: 0 },
  ]);
  dart.onUpdate(() => {
    dart.life += k.dt();
    dart.pos.x += dart.vx * k.dt();
    dart.pos.y += dart.vy * k.dt();
    dart.vy += grav * k.dt();
    dart.angle = Math.atan2(dart.vy, dart.vx) * 180 / Math.PI;
    if (dart.life > 2 || dart.pos.y > STAND_Y + STAND_H + 80) {
      k.destroy(dart);
    }
  });
  darts.push(dart);
}
```

### 5.5 Collision dart ↔ duck

```js
// Un seul handler global (pas par dart)
k.onCollide("dart", "duck-stand", (dart, duck) => {
  if (duck.dead || !dart.exists?.()) return;
  const pts = duck.gold ? 150 : 50;
  gameState.score += pts;
  showPopup(duck.pos.x + 9, duck.pos.y - 10, `+${pts} !`,
            duck.gold ? k.rgb(255, 215, 0) : k.rgb(255, 230, 80), 16);
  audio.coin?.();
  spawnFeathers(duck.pos.x + 9, duck.pos.y + 7);

  duck.dead = true;
  duck.deadAt = k.time();
  k.destroy(dart);

  // Combo jackpot par joueur tireur
  // → on retrouve le player via dart.shooter (param à ajouter en 5.4)
  recordJackpotHit(dart.shooter, duck);

  // Respawn 3s plus tard
  k.wait(3, () => {
    if (!duck.exists?.()) return;
    duck.dead = false;
    duck.pos.x = STAND_X + STAND_W + 60;
    duck.gold = Math.random() < 0.12;
  });
});
```

**Note** : `spawnDart()` doit stocker `dart.shooter = player` (ajouter
`shooter: p` dans le bag d'init, passer `p` en argument à `spawnDart`).

### 5.6 `recordJackpotHit(p, duck)`

```js
function recordJackpotHit(p, duck) {
  if (!p) return;
  const now = k.time();
  let st = comboState.get(p);
  if (!st) { st = { hits: [] }; comboState.set(p, st); }
  // Purge hits > 5s
  st.hits = st.hits.filter(t => now - t < 5);
  st.hits.push(now);
  if (st.hits.length >= 3) {
    gameState.score += 300;
    showPopup(duck.pos.x + 9, duck.pos.y - 30, "JACKPOT ! +300",
              k.rgb(255, 180, 40), 28);
    audio.combo?.();
    window.__juice?.dirShake?.(0, 1, 10, 0.25);
    window.__achievements?.unlock?.("jackpot_canards");
    // Mini feu d'artifice (24 particules)
    for (let i = 0; i < 24; i++) {
      const a = (Math.PI * 2 * i) / 24;
      k.add([
        k.circle(3),
        k.pos(duck.pos.x + 9, duck.pos.y),
        k.color(k.rgb(255, 120 + Math.random() * 120, 60)),
        k.opacity(1),
        k.lifespan(0.7, { fade: 0.5 }),
        k.z(20),
        "particle",
        { vx: Math.cos(a) * 120, vy: Math.sin(a) * 120 - 40 },
      ]);
    }
    st.hits = [];  // reset
  }
}
```

### 5.7 Patch `players.js` handler board (ligne 267-272)

```js
k.onKeyPress(opts.keys.board, () => {
  if (p.stunnedUntil && k.time() < p.stunnedUntil) return;
  if (window.__reparation?.tryRepair?.(p)) return;
  if (window.__skullStand?.tryFire?.(p)) return;  // NEW
  if (p.ridingWagon) exitWagon(p);
  else tryBoardWagon(p);
});
```

**Ordre de priorité** :
1. Stun check → early return, sans consommer quoi que ce soit.
2. `tryRepair` → succès seulement si joueur debout sur rail cassée (rare).
3. `tryFire` → succès seulement si joueur <150 px du stand ET phase ducks
   ET canard visible.
4. Sinon → board/exit wagon comportement actuel.

Pas de conflit pratique : un joueur sur une rail cassée est rarement à
<150 px du stand (rail = au sol sur le circuit, stand = `row 2..4`). Si
collision exceptionnelle, reparation gagne (c'est plus critique).

### 5.8 Patch `main.js:1013`

```js
createSkullStand({
  k, gameState, audio,
  showPopup: (...args) => showPopup(...args),
  registerCoin: (...args) => registerCoin(...args),
  getActivePlayers: () => activePlayers,
  isCampaign: () => router.get().mode === "campaign",
  WIDTH, TILE,
});
```

## 6. Pièges KAPLAY à rappeler

1. **`k.fixed()`** : aucun overlay fullscreen ici — flash de transition est
   un `k.rect(STAND_W, STAND_H)` local. OK.
2. **`obj.use(k.sprite())`** : on ne fait **aucun** sprite KAPLAY — uniquement
   primitives (`rect`, `circle`, `triangle`). OK.
3. **`drawText` avec `[` ou `\`** : labels `TIR AUX CRANES`, `TIR AUX CANARDS`,
   `JACKPOT ! +300`, `+50 !` — aucun caractère interdit. OK.
4. **`k.get("*")`** : **jamais**. On itère uniquement les arrays locaux
   `skulls`, `ducks`, `darts`. Le handler `k.onCollide("dart", "duck-stand")`
   est un événement ponctuel, pas une itération par frame.
5. **`k.get("wagon")`** dans le loop 0.3s existant : inchangé (était déjà là).
6. **Duplicate component property** : le bag d'init contient `duckIdx`, `gold`,
   `vx`, `dead`, `deadAt`, `_renderer` — aucun conflit avec sprite component
   (puisqu'on n'utilise pas `k.sprite()`).
7. **TDZ** : `phase`, `skulls`, `ducks`, `darts`, `comboState` tous `let`/`const`
   au top du scope factory, initialisés avant `enterSkullsPhase()` qui les
   utilise. OK.
8. **Scene reload** : `k.scene("game", ...)` destroy tout auto, y compris
   les loops `k.loop(30, …)`. Pas besoin de stop() explicite. `window.__skullStand`
   est réassigné à la nouvelle instance à chaque load.
9. **Dart collision** : `k.onCollide("dart", "duck-stand", …)` est un
   handler global scene-wide. Si plusieurs fléchettes en vol simultanément
   (2P), toutes sont gérées car le handler prend `(dart, duck)` en args.
10. **Canard renderer** : on ajoute une entité `renderer` avec `draw()` custom
    qui lit l'état du canard. Si le canard est destroyed (fin de scene),
    `d.exists?.()` retourne false et on skip. Attention : **on doit destroy
    `_renderer` aussi** quand le canard est destroyed (ex: phase switch).
    Voir §5.1 cleanup + ajouter idem dans `enterSkullsPhase()`.

## 7. Critères de succès (checklist testable)

- [ ] `npm run build` réussit, bundle gz **< 102 KB** (budget +1.5 KB sur
      100.27 KB actuels).
- [ ] Pas de warning console au load de la scène sandbox.
- [ ] Phase initiale = CRÂNES, label `TIR AUX CRANES`, 5 crânes visibles,
      click souris fonctionne comme avant (régression zéro).
- [ ] Au bout de 30s, flash blanc + label devient `TIR AUX CANARDS`,
      file de 7 canards défile de droite à gauche à ~50 px/s.
- [ ] Se placer à moins de 150 px du stand avec Mario, presser `E` →
      fléchette brune part en arc, touche le canard le plus proche, plumes
      + popup `+50 !`, score += 50.
- [ ] Canard doré touché → popup `+150 !`, score += 150.
- [ ] Hors portée (>150 px) : presser `E` → comportement board wagon normal,
      pas de fléchette.
- [ ] Cooldown 0.4s : spam `E` ne produit qu'une fléchette toutes les 0.4s
      max.
- [ ] 3 canards touchés en <5s → popup `JACKPOT ! +300` + feu d'artifice
      + score += 300, achievement `jackpot_canards` unlocked (checkable via
      `window.__achievements?.isUnlocked?.('jackpot_canards')`).
- [ ] Après 4e hit (>5s après les 3 premiers), pas de re-jackpot
      automatique (compteur reset correctement).
- [ ] Canard touché respawn à droite 3s plus tard.
- [ ] Après 30s en phase CANARDS → retour phase CRÂNES avec flash.
- [ ] Joueur stunné après parade miss → `E` ne produit pas de fléchette.
- [ ] Joueur skeleton → idem, pas de fléchette.
- [ ] Mode campagne : `E` fonctionne en board wagon uniquement, phase
      canards visible mais inerte (ou forcé en phase crânes selon choix
      final §9).
- [ ] 2P : P1 et P2 peuvent tirer simultanément, 2 fléchettes en vol
      distinctes, chaque joueur a son propre compteur jackpot.
- [ ] `window.__skullStand.__debug()` retourne objet cohérent.
- [ ] FPS stable >55 avec 7 canards + 3 fléchettes + particules en cours.
- [ ] Pas de régression sur `reparation-express` (`tryRepair` gagne toujours
      le check prioritaire sur rail cassée).

## 8. Effort estimé

**1 commit atomique** : `feat(stand): aire tir mobile — canards parabole, jackpot combo 3x = +300pts`.

Ordre recommandé :

1. **Backup mental** : relire `skull-stand.js:38-123` (spawnSkull + kill) —
   on va **garder** tout ça intact, juste le wrapper dans `enterSkullsPhase()`.
2. Extraire le corps actuel `for (let i=0; i<5; i++) spawnSkull(i)` dans
   `enterSkullsPhase()`. Ajouter cleanup skulls en tête.
3. Implémenter `enterDucksPhase()` + `spawnDuck()` + `drawDuckBody()`.
4. Implémenter `tryFire()` + `spawnDart()` + update dart.
5. Ajouter `k.onCollide("dart", "duck-stand", …)` + `recordJackpotHit()`.
6. Ajouter `k.loop(30, () => switch phase + flash)` + appel initial
   `enterSkullsPhase()`.
7. Modifier le label draw pour lire `phase` (ternaire).
8. Patcher `main.js:1013` (2 nouveaux params `getActivePlayers`, `isCampaign`).
9. Patcher `players.js:267-272` (ajout ligne `tryFire`).
10. `npm run build`, vérifier bundle < 102 KB gz.
11. Test manuel : `npm run dev`, console `window.__skullStand.__debug()`,
    attendre 30s, vérifier switch, tirer, vérifier jackpot.
12. Commit + push.

Si bundle >102 KB : simplifier le feu d'artifice jackpot (12 particules au
lieu de 24) + retirer la rotation dynamique de la fléchette (garder angle
initial). Économie ~400 octets.

## 9. Risques & mitigations

| Risque | Mitigation |
|---|---|
| Bundle > 102 KB gz | Module extends 151 → ~320 L, pas de nouveau sprite. Fallback : réduire particules jackpot, simplifier dart rotation. |
| Collision dart↔duck rate bizarre (trop fine) | Area rect 18×14 + dart rect 6×2 → KAPLAY `onCollide` fiable à 60fps. Si miss : élargir dart area à 8×4. |
| Angle ballistique imprécis (fléchette manque) | Formule simplifiée `t = abs(dx)/350 + 0.05`. Si target est en haut à gauche (dy négatif et dx petit), vyInit peut être extrême. Test en live, ajuster constante 350 → 300 ou 400 selon feedback. |
| 2 joueurs spamment `E` → 10+ darts à l'écran | Cap via cooldown 0.4s/joueur = max 5 darts/s globalement. Life max 2s → max ~10 darts simultanés. Acceptable. |
| Wagon qui passe dans la zone canards (y=STAND_Y-24 = au-dessus du cadre) | Les wagons roulent au sol (GROUND_ROW=14) ou sur rails — jamais à y=2 tiles du haut. Zero collision pratique. |
| Conflit `E` reparation vs fire : joueur sur rail cassée ET <150 px stand | Reparation gagne (check en premier). Rare géographiquement (rail = au sol, stand = haut du monde col 30 row 2). |
| Campaign mode : comportement non-désiré | **Choix** : phase canards affichée mais inerte (`tryFire` return false si `isCampaign()`). Alternative simple : forcer `phase = "skulls"` permanent en campaign (skip le loop switch). Recommandation : **inerte** pour cohérence visuelle (mode démo voit les 2 phases). |
| F2 race mode + stand actif | Race mode spawn wagons sur circuit dédié, n'interfère pas avec stand. Laisser tourner. |
| Mobile : pas de `E`/`O` explicite | `tryFire` ne sera jamais appelé sur mobile (pas de handler board mobile direct). Acceptable pour v1 — documenter dans HANDOVER que le mode mobile ne peut pas jouer à la tir-canards. Fallback futur : bouton overlay "TIR" quand joueur proche stand. |
| Phase initiale = skulls ou ducks ? | **Recommandation : skulls** (comportement actuel préservé en ouverture, moins de surprise joueur). |
| Nettoyage renderer canard au phase switch | Important : `d._renderer` est une entité séparée. Dans `enterSkullsPhase()`, boucler sur `ducks` et destroy `d._renderer` puis `d`. Sinon fuite. |
| Achievement `jackpot_canards` n'existe pas | À ajouter dans `achievements.js` (liste existante). Si absent, `window.__achievements?.unlock?.(…)` no-op. Ajout trivial. |
| Dart qui sort du monde (pos.y > 2000) | Life max 2s + check `pos.y > STAND_Y + STAND_H + 80` → destroy auto. |

## 10. Test plan manuel (après livraison)

1. Ouvrir https://michaelchevallier.github.io/lava_game/ après deploy CI.
2. Démarrer sandbox 1P Mario, avatar par défaut.
3. Console : `window.__skullStand.__debug()` → `{ phase: "skulls", duckCount: 0, ... }`.
4. Observer 5 crânes dans le cadre, click souris → +50/+300 doré, comportement
   actuel inchangé.
5. Attendre 30s → flash blanc, label change en `TIR AUX CANARDS`, file de
   7 canards apparaît au-dessus du stand, défile vers la gauche.
6. Console : `window.__skullStand.__debug()` → `{ phase: "ducks", duckCount: 7, ... }`.
7. Déplacer Mario avec `A/D` près du stand (x~15-18 tiles). Presser `E` →
   fléchette part en arc, atteint canard, plumes + `+50 !`.
8. Spam `E` pendant 3s → 3-4 canards touchés rapidement → popup
   `JACKPOT ! +300` + feu d'artifice + dir shake.
9. Attendre 3s → canards touchés respawn à droite.
10. Hors portée (150 px) : presser `E` → pas de fléchette, tentative board
    wagon (normal).
11. Laisser tomber Mario dans lave → skeleton. Presser `E` près stand →
    pas de fléchette.
12. Attendre 30s encore → retour phase CRÂNES.
13. 2P test : F5 settings 2 players, P1 Mario + P2 Pika. Les deux pressent
    `E`/`O` simultanément → 2 fléchettes distinctes, compteurs jackpot
    séparés.
14. Mode campagne via menu → ouvrir niveau 1-1 → stand visible en phase
    canards, presser `E` → pas de fléchette (board wagon à la place).
15. Lancer `reparation-express` event → se mettre sur rail cassée près du
    stand → presser `E` → réparation gagne (popup RÉPARÉ, pas de fléchette).
16. FPS check : `let f=0,s=performance.now();const t=()=>{f++;if(performance.now()-s<2000)requestAnimationFrame(t);else console.log('FPS',Math.round(f/2));};requestAnimationFrame(t);`
    → >55 en phase canards active.

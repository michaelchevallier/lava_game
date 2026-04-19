# CREATIVE BRIEF — Fete Foraine en Lave

> Mission : pousser le jeu d'une demo "tuiles + wagons + combos" vers une experience parc d'attractions vivante, narrative emergente, "juste un coup d'oeil" addictif.
> Reference DNA : Mario Maker (jouet > jeu), Loop Hero (auto-battle contemplatif), Vampire Survivors (escalade absurde), Downwell (juice), Celeste (game feel), Crashlands (sandbox lisible).

---

## AXE 1 — 6 combos emergents inattendus entre tiles existantes

Les combos ci-dessous n'inventent **aucune tile** : ils detectent des configurations de tiles deja presentes (`lava, water, rail, rail_up/down, coin, boost, trampoline, fan, portal, ice, magnet, bridge, wheel`) et declenchent un comportement special. 3 combos deja identifies (Catapulte = Tramp+Fan, Teleport Magnetique = Magnet+Portal, Train Apocalypse Inverse = anti-AFK 20s) sont rappeles pour memoire ; les **6 ci-dessous sont nouveaux**.

### Combo 1 — Geyser (Water + Fan vertical sous-jacent)

| Champ | Valeur |
|---|---|
| Detection | `fan` directement sous une `water` (meme col, row+1). |
| Effet | Colonne d'eau jaillissante : +1.5 tile au-dessus, devient une plateforme `bridge` temporaire (4s), pousse wagons vers le haut a vitesse JUMP/2. Joueurs touches : double-jump rearmed. |
| Visuel | Particules bleu cyan en spray cone 30 deg + sprite eau scale Y 1.5, distortion sin time. |
| Effort | 2 commits (detection + spawn plateforme + push wagons). |
| Risque | Faux positifs si Fan deja utilise pour Catapulte. Resoudre : Geyser prend priorite si water au-dessus, sinon Catapulte. |
| Impact | 4/5 — debloque construction verticale et puzzle "monter sans rail". |

```js
function detectGeyser(col, row) {
  const fan = tileMap.get(gridKey(col, row));
  if (!fan || fan.tileType !== "fan") return false;
  const above = tileMap.get(gridKey(col, row - 1));
  if (!above || above.tileType !== "water") return false;
  spawnGeyserBridge(col, row - 2, 4);
  return true;
}
```

---

### Combo 2 — Glaciation en Chaine (Ice 3+ adjacents devient Patinoire)

| Champ | Valeur |
|---|---|
| Detection | Run horizontal de 3+ tiles `ice` consecutives au sol. |
| Effet | Friction wagon /3 sur le run -> wagon glisse, depasse fin du rail de N tiles, peut sauter par-dessus une lave si momentum suffisant. Bonus : si 5+ ice -> "Curling" : popup "STRIKE !" si wagon termine sa course pile sur un coin. |
| Visuel | Sol scintillant cyan + traces de patin (2 lignes blanches derriere wagon) + crystaux qui chutent. |
| Effort | 2 commits. |
| Risque | Faible. Joueurs : meme glissade donc deja tester platformer. |
| Impact | 4/5 — recompense le builder qui pense "rampe d'elan". |

```js
function detectIceRink(col, row) {
  let len = 0, c = col;
  while (tileMap.get(gridKey(c, row))?.tileType === "ice") { len++; c++; }
  if (len >= 3) markRink(col, row, len);
  return len;
}
function applyRinkPhysics(wagon, rinkLen) {
  wagon.frictionMul = 0.33;
  wagon.glideBonus = rinkLen * 40;
  if (rinkLen >= 5) wagon.curlingArmed = true;
}
```

---

### Combo 3 — Magnet Field (2 magnets en vis-a-vis horizontal)

| Champ | Valeur |
|---|---|
| Detection | 2 `magnet` separes de 4 a 12 tiles sur la meme row, rien entre. |
| Effet | Champ magnetique entre les deux : tout wagon entrant oscille gauche-droite (sin) en avancant, les pieces flottent, et tirs de "boules de fer" emergent du magnet le plus proche. Visuel rappelle le **manege Polyp** de Crashlands. |
| Visuel | Lignes de force pointillees animees entre les 2 magnets, glow violet pulse. |
| Effort | 3 commits (detection paire + render champ + impact wagon). |
| Risque | Cout perf si beaucoup de paires (>6). Cap a 3 champs actifs simultanes. |
| Impact | 5/5 — premier "decor interactif" emergent qui donne envie de placer 2 aimants juste pour voir. |

```js
function detectMagnetField() {
  const fields = [];
  for (const [k1, t1] of tileMap) if (t1.tileType === "magnet") {
    for (let dx = 4; dx <= 12; dx++) {
      const t2 = tileMap.get(gridKey(t1.gridCol + dx, t1.gridRow));
      if (t2?.tileType === "magnet" && pathClear(t1, t2)) {
        fields.push({ a: t1, b: t2, len: dx });
      }
    }
  }
  return fields.slice(0, 3);
}
```

---

### Combo 4 — Cascade (Water sur Water sur Water vertical)

| Champ | Valeur |
|---|---|
| Detection | 3+ tiles `water` empilees verticalement (meme col). |
| Effet | Cascade animee : flot continu vers le bas, wagons descendant la cascade gagnent +1 multi combo gratuit, joueur dedans : nage rapide + immune lave 2s. Si la cascade tombe sur une `lave` -> spawn 2 tiles `bridge` permanents (refroidissement obsidienne) jusqu'a ce que le builder casse une water. |
| Visuel | Eau qui coule (anim 3 frames), eclaboussures en bas, vapeur si lave touchee. |
| Effort | 2 commits. |
| Risque | Bridges crees auto = pourrait casser circuits existants. Solution : bridges temporaires 8s, pas permanents. |
| Impact | 5/5 — premiere mecanique de **terraforming** emergent. Les joueurs vont decouvrir "j'ai cree un pont en versant de l'eau dans la lave !". |

```js
function detectCascade(col, row) {
  let h = 0, r = row;
  while (tileMap.get(gridKey(col, r))?.tileType === "water") { h++; r++; }
  if (h < 3) return;
  const bottom = tileMap.get(gridKey(col, r));
  spawnCascadeFx(col, row, h);
  if (bottom?.tileType === "lava") {
    placeTile(col, r, "bridge", { temporary: 8 });
    spawnSteamBurst(col, r);
  }
}
```

---

### Combo 5 — Loop the Loop (rail_up + rail + rail_down + tramp en boucle fermee)

| Champ | Valeur |
|---|---|
| Detection | Cycle ferme detecte par flood-fill sur les rails (BFS) qui revient au point de depart en passant par >=1 trampoline. |
| Effet | Le wagon entre en mode "looping" : trail arc-en-ciel, +20 pts par tour, vitesse x1.3, sortie de boucle uniquement si joueur appuie sur saut OU apres 3 tours auto. Reference directe : **Sonic loop**. |
| Visuel | Ghost trail des positions wagon sur tout l'arc, halo dore quand 3 tours atteints, popup "LOOP x3 !". |
| Effort | 3 commits (BFS detection + state looping wagon + sortie). |
| Risque | BFS sur 720 cellules a chaque place = OK si memoise et invalide a chaque placeTile. |
| Impact | 5/5 — moment "WOW" garanti. Builder cherche a faire "le plus gros looping". |

```js
function detectClosedLoop(startCol, startRow) {
  const visited = new Set();
  const queue = [[startCol, startRow, 0]];
  while (queue.length) {
    const [c, r, d] = queue.shift();
    const k1 = gridKey(c, r);
    if (visited.has(k1) && d > 4) return reconstructPath(c, r);
    visited.add(k1);
    for (const [dc, dr] of NEIGHBORS_RAIL) {
      const next = tileMap.get(gridKey(c + dc, r + dr));
      if (next && isRailish(next)) queue.push([c + dc, r + dr, d + 1]);
    }
  }
  return null;
}
```

---

### Combo 6 — Phare de Lave (Lava 4 cardinales autour d'une Wheel)

| Champ | Valeur |
|---|---|
| Detection | Une `wheel` (Grande Roue 3x3) entouree de >=4 tiles `lava` a portee de 5 cells (diamond). |
| Effet | La Grande Roue devient "Phare" : projecteurs rotatifs lumineux jaune/orange sur 360 deg, chaque rayon qui touche un wagon -> +1 pt/sec. La nuit (si mode jour/nuit actif), eclaire toute la map. Spectres existants attires par les rayons. |
| Visuel | 4 cones lumineux qui tournent (rotation continue), atmosphere rouge+jaune renforce ambiance lave. |
| Effort | 2 commits. |
| Risque | Cout shader si trop de rayons. Faire en `drawTriangle` simple, pas shader. |
| Impact | 4/5 — recompense le builder qui sacrifie de la lave pour l'esthetique. Fait du parc un **spectacle**. |

```js
function detectLighthouse(wheelObj) {
  let lavaCount = 0;
  for (let dc = -5; dc <= 5; dc++) for (let dr = -5; dr <= 5; dr++) {
    if (Math.abs(dc) + Math.abs(dr) > 5) continue;
    const t = tileMap.get(gridKey(wheelObj.gridCol + dc, wheelObj.gridRow + dr));
    if (t?.tileType === "lava") lavaCount++;
    if (lavaCount >= 4) { wheelObj.lighthouse = true; return; }
  }
}
```

---

## AXE 2 — 5 nouvelles features parc surprenantes

Pas de re-listing classique (Peche/Manege/Spectres deja faits). Du **neuf** : decor interactif, narratif emergent, powerup temporaire, mode bonus, twist inhabituel.

### F1 — Le Photographe Souvenir

**Concept** : un PNJ "photographe" en 16x24px se balade sur la rangee du sol toutes les 30s. Quand un wagon ou un combo APOCALYPSE passe devant lui, il prend une photo (flash + son obturateur), et la photo s'affiche en miniature 80x40 dans le coin sup-droit pendant 4s. Au bout de 5 photos, le HUD propose "COMPOSE TON ALBUM" (touche I) — mosaique des 5 dernieres + bouton "exporter PNG". Reference : **Pokemon Snap**.

```js
function spawnPhotographer() {
  const ph = k.add([
    k.sprite("human"), k.pos(0, GROUND_ROW * TILE - 24),
    k.color(180, 180, 255), k.z(8),
    { vx: 30, photoCooldown: 0, snapped: [] },
  ]);
  ph.onUpdate(() => {
    ph.pos.x += ph.vx * k.dt();
    if (ph.pos.x > WIDTH) ph.pos.x = 0;
    if (ph.photoCooldown > 0) ph.photoCooldown -= k.dt();
    if (ph.photoCooldown <= 0 && wagonNearby(ph, 80)) {
      flashScreen(0.15);
      audio.shutter();
      const dataUrl = captureRegion(ph.pos.x - 60, ph.pos.y - 60, 120, 80);
      ph.snapped.push(dataUrl);
      if (ph.snapped.length > 5) ph.snapped.shift();
      ph.photoCooldown = 5;
    }
  });
}
```

| Effort | Risque | Impact |
|---|---|---|
| 3 commits (PNJ + capture canvas + album UI) | Capture canvas KAPLAY = peut couter en perf, faire offscreen | 5/5 — partage social organique, rejouabilite |

---

### F2 — Mode Foule (visiteurs spawnent et reagissent)

**Concept** : a partir de 200 pts, des visiteurs (sprite human tinted random) spawnent sur le sol et **reagissent** aux events. Combo APOCALYPSE -> tous levent les bras (anim "wow"). Squelette spawn -> visiteurs courent en sens inverse. Plus il y a de visiteurs, plus le score genere passivement (+1 pt/sec/10 visiteurs). Cap a 30. Reference : **Loop Hero** villageois + **Theme Park** ambiance.

```js
function spawnVisitor() {
  if (gameState.visitors.length >= 30) return;
  const v = k.add([
    k.sprite("human"),
    k.pos(k.rand(0, WIDTH), GROUND_ROW * TILE - 24),
    k.color(k.rand(80, 255), k.rand(80, 255), k.rand(80, 255)),
    k.z(7),
    { vx: k.choose([-20, 20]), mood: "happy", panicTimer: 0 },
  ]);
  v.onUpdate(() => {
    if (v.panicTimer > 0) {
      v.vx = -v.vx * 1.5; v.panicTimer -= k.dt();
    }
    v.pos.x += v.vx * k.dt();
    if (v.pos.x < 0 || v.pos.x > WIDTH) v.vx = -v.vx;
  });
  gameState.visitors.push(v);
}
k.onUpdate(() => {
  if (k.time() % 8 < k.dt()) spawnVisitor();
  gameState.score += gameState.visitors.length * 0.1 * k.dt();
});
```

| Effort | Risque | Impact |
|---|---|---|
| 2 commits | Perf 30 entites OK (pool deja prevu CLAUDE.md) | 5/5 — donne **vie** au parc, justifie le titre "fete foraine" |

---

### F3 — Carte a Gratter (powerup temporaire random)

**Concept** : toutes les 60s, une "carte a gratter" tombe du ciel a position random (sprite ticket dore). Joueur qui la touche -> mini-anim "scratch" (3 cases qui se grattent en frottant), revele 1 powerup parmi : `+50 pts`, `wagon dore 30s (x2 score)`, `tous joueurs invincibles 10s`, `slow-mo 5s` (Bullet-Time hors APOCALYPSE), `pluie de pieces 3s`. Reference : **Vampire Survivors** chests.

```js
function spawnScratchCard() {
  const card = k.add([
    k.sprite("coin"), k.pos(k.rand(100, WIDTH-100), -40),
    k.area(), k.scale(1.5), k.color(255, 220, 80), k.z(20),
    { vy: 80, type: "scratch" }, "scratchcard",
  ]);
  card.onUpdate(() => {
    card.pos.y += card.vy * k.dt();
    if (card.pos.y > HEIGHT) k.destroy(card);
  });
  card.onCollide("player", (p) => {
    const reward = k.choose(SCRATCH_REWARDS);
    playScratchAnim(card.pos, reward, () => applyReward(reward, p));
    k.destroy(card);
  });
}
k.loop(60, spawnScratchCard);
```

| Effort | Risque | Impact |
|---|---|---|
| 3 commits (spawn + anim scratch + 5 rewards) | 5 rewards a tester individuellement | 5/5 — variete + dopamine surprise |

---

### F4 — Mode "Tornade" (twist horaire)

**Concept** : toutes les 5 min de jeu (timer global), une **alerte tornade** : screen shake 1s, sirene, flash rouge HUD "TORNADE 30s". Pendant 30s : le vent (Fan) inverse direction, les wagons sont aspires vers un point central (vortex visuel), pieces volent en spirale, joueurs ont un bonus de saut x1.5. Apres : retour normal + bonus "survivant +100 pts". Reference : **Downwell** intensification.

```js
let tornadoTimer = 0;
k.onUpdate(() => {
  tornadoTimer += k.dt();
  if (tornadoTimer > 300 && !gameState.tornado) {
    gameState.tornado = { remaining: 30, cx: WIDTH/2, cy: HEIGHT/2 };
    audio.siren(); k.shake(20);
    tornadoTimer = 0;
  }
  if (gameState.tornado) {
    gameState.tornado.remaining -= k.dt();
    for (const w of wagons) {
      const dx = gameState.tornado.cx - w.pos.x;
      const dy = gameState.tornado.cy - w.pos.y;
      w.pos.x += dx * 0.3 * k.dt();
      w.pos.y += dy * 0.3 * k.dt();
    }
    if (gameState.tornado.remaining <= 0) {
      gameState.score += 100; gameState.tornado = null;
    }
  }
});
```

| Effort | Risque | Impact |
|---|---|---|
| 3 commits (timer + visuel vortex + bonus survivant) | Risque "casse circuit" -> bonus apres compense | 4/5 — moment epique, briser la routine |

---

### F5 — Le Diable du Parc (narratif emergent)

**Concept** : un PNJ "diable rouge" (sprite human tinted rouge + cornes) apparait apres 1000 pts. Il marche lentement, cherche les coins isoles. Quand il atteint une **lava tile**, il **mange la lave** (lave disparait, +30 pts, anim flamme dans la bouche). Quand il atteint un **coin**, il le **vole** (-1 score). Tuer le diable (sauter dessus 3 fois) -> drop "couronne" qui fait +500 pts. Reference : **Crashlands** creatures + **Loop Hero** boss organique.

```js
function spawnDiable() {
  const d = k.add([
    k.sprite("human"), k.pos(WIDTH, GROUND_ROW * TILE - 24),
    k.color(255, 50, 50), k.scale(1.2), k.z(9), k.area(),
    { hp: 3, vx: -25, target: null }, "diable",
  ]);
  d.onUpdate(() => {
    if (!d.target || k.time() % 3 < k.dt()) {
      d.target = findNearestTile(d.pos, ["lava", "coin"]);
    }
    if (d.target) {
      d.vx = Math.sign(d.target.pos.x - d.pos.x) * 25;
      d.pos.x += d.vx * k.dt();
      if (Math.abs(d.target.pos.x - d.pos.x) < 8) {
        if (d.target.tileType === "lava") gameState.score += 30;
        else gameState.score = Math.max(0, gameState.score - 1);
        eraseTile(d.target.gridCol, d.target.gridRow);
        spawnEatFx(d.pos);
        d.target = null;
      }
    }
  });
  d.onCollide("player", (p) => {
    if (p.vel.y > 0) { d.hp--; p.vel.y = -JUMP/2; if (d.hp <= 0) dropCrown(d.pos); }
  });
}
```

| Effort | Risque | Impact |
|---|---|---|
| 4 commits (PNJ AI + manger tile + combat + reward) | AI pathfinding simple = OK ; equilibrage delicat | 5/5 — premier vrai **antagoniste**, raconte une histoire |

---

## AXE 3 — 3 polish "game feel" instantanes

### P1 — Hit-stop sur impact wagon (5 lignes)

```js
function hitStop(durationMs) {
  const orig = k.dt;
  let t = durationMs / 1000;
  k.onUpdate(() => { if (t > 0) { t -= 1/60; k.timeScale = 0.05; } else k.timeScale = 1; });
}
// dans wagon.onCollide("lava"): hitStop(80); k.shake(8);
```
**Pourquoi** : Celeste/Hyper Light Drifter. 80ms de freeze = le cerveau enregistre l'impact. Gain de juice immediat.

---

### P2 — Coin pickup arc-easing + audio detuned (8 lignes)

```js
function pickupCoinFx(x, y) {
  const ghost = k.add([
    k.sprite("coin"), k.pos(x, y), k.scale(1), k.opacity(1), k.z(50),
    k.lifespan(0.4, { fade: 0.2 }),
    { t: 0 },
  ]);
  ghost.onUpdate(() => {
    ghost.t += k.dt();
    const e = 1 - Math.pow(1 - ghost.t / 0.4, 3); // easeOutCubic
    ghost.pos.y = y - 40 * e;
    ghost.scale = k.vec2(1 + e * 0.5);
  });
  audio.coin(1 + Math.min(0.5, gameState.comboCount * 0.05)); // pitch up avec combo
}
```
**Pourquoi** : Vampire Survivors / Downwell. Le coin "flotte vers le HUD" + pitch monte avec combo = recompense viscerale.

---

### P3 — Screen shake **directionnel** (10 lignes)

```js
let shakeOffset = k.vec2(0, 0);
function dirShake(dx, dy, mag, dur) {
  let t = dur;
  k.onUpdate(() => {
    if (t > 0) {
      t -= k.dt();
      const decay = t / dur;
      shakeOffset = k.vec2(dx * mag * decay * (Math.random()*2-1), dy * mag * decay * (Math.random()*2-1));
      k.camPos(WIDTH/2 + shakeOffset.x, HEIGHT/2 + shakeOffset.y);
    } else { k.camPos(WIDTH/2, HEIGHT/2); }
  });
}
// Wagon explose a droite -> dirShake(1, 0.3, 12, 0.25);
// Tornado -> dirShake(0, 1, 6, 0.5);
```
**Pourquoi** : Downwell. Shake omnidirectionnel = cliche ; shake **directionnel** raconte d'ou vient l'impact. Cerveau lit la direction de l'event sans regarder.

---

## TOP 5 PRIORITE FINALE (impact / effort)

| # | Feature | Impact | Effort | Ratio | Source |
|---|---|---|---|---|---|
| 1 | **Cascade (Combo 4)** | 5 | 2 | 2.5 | Axe 1 |
| 2 | **Mode Foule (F2)** | 5 | 2 | 2.5 | Axe 2 |
| 3 | **Magnet Field (Combo 3)** | 5 | 3 | 1.67 | Axe 1 |
| 4 | **Loop the Loop (Combo 5)** | 5 | 3 | 1.67 | Axe 1 |
| 5 | **Hit-stop + dirShake (P1+P3)** | 4 | 1 | 4.0 (juice bundle) | Axe 3 |

> Note : P1+P3 bundle juice est en realite #1 pure ratio, mais place #5 pour qu'il soit **applique apres** les 4 features de gameplay (les renforce toutes).

---

### Brief 100 mots — TOP 1 : Cascade

> Implementer le combo "Cascade" : detecter dans `tiles.js` toute colonne de 3+ `water` empilees verticalement. Spawner anim eau qui coule (3 frames sprite scale Y) + particules eclaboussures en bas. Si la cellule sous la cascade est `lava` -> placer un `bridge` temporaire (8s, prop `temporary`) + `spawnSteamBurst`. Wagon qui descend la cascade : +1 multi combo gratuit (modifier `gameState.comboCount`). Joueur dans la cascade : nage rapide, immune lave 2s. Tester avec `preview_console_logs level=error`. Commit `feat: cascade combo (water stack 3+)`. Cible : moment "WOW" terraforming emergent.

### Brief 100 mots — TOP 2 : Mode Foule

> Ajouter systeme visiteurs dans nouveau fichier `src/visitors.js`. A partir de `gameState.score >= 200`, spawner 1 visiteur toutes les 8s (cap 30). Sprite `human` tinted random RGB(80-255). Marche sol GROUND_ROW, vitesse +/-20px/s, rebond aux bords. Reactions : sur APOCALYPSE -> jump 100px ; sur spawn squelette -> `panicTimer=2s` (vitesse x1.5 sens inverse). Bonus passif : `score += visitors.length * 0.1 * dt`. Pool entites obligatoire (CLAUDE.md MAX entites). Importer dans `main.js`, hook dans game loop. `preview_console_logs` doit etre vide. Commit `feat: crowd mode (visitors react to events)`.

### Brief 100 mots — TOP 3 : Magnet Field

> Implementer "Magnet Field" : dans `tiles.js`, fonction `detectMagnetFields()` appelee a chaque `placeTile`. Detecter paires de `magnet` separes 4-12 tiles meme row, rien d'opaque entre (`pathClear`). Cap 3 champs simultanes (perf). Render : `drawLines` pointillees animees violet entre les 2 magnets, opacite pulse `sin(time*3)`. Effet wagon entrant : `wagon.pos.y += sin(wagon.pos.x * 0.05) * 20` (oscillation), pieces dans la zone flottent up/down. Spawn "boule de fer" toutes les 2s qui suit le wagon (homing). Commit `feat: magnet field combo (paired magnets)`. Tester perf 6 paires avec FPS counter HUD.

### Brief 100 mots — TOP 4 : Loop the Loop

> Implementer detection boucle fermee : BFS sur graph rails depuis chaque `placeTile rail/rail_up/rail_down`. Si cycle ferme >= 6 tiles avec >=1 `trampoline` -> marquer cycle comme "loop". Memoiser, invalider au placeTile suivant. Wagon entrant dans loop : flag `looping`, vitesse x1.3, trail rainbow (overrider couleur trail par HSL rotatif). Compter tours, popup "LOOP xN" tous les tours. Sortie auto apres 3 tours OU si joueur saute. +20 pts/tour. Commit `feat: loop the loop combo (closed rail cycle)`. Risque BFS perf -> cap profondeur 40, debounce detection (max 1/sec).

### Brief 100 mots — TOP 5 : Juice Bundle (Hit-stop + dirShake)

> Polish bundle : ajouter dans `main.js` (ou nouveau `src/juice.js`) les utilitaires `hitStop(ms)` et `dirShake(dx, dy, mag, dur)`. Hook hit-stop sur : wagon collide lava (80ms), wagon collide wagon (60ms), squelette spawn (120ms), APOCALYPSE trigger (200ms). Hook dirShake sur : wagon explose (direction de la velocite), Tornado (vertical), trampoline launch (vertical up). Remplacer tous les `k.shake(N)` existants par `dirShake` quand direction connue. Commit `feat: juice bundle (hit-stop + directional shake)`. Tester : aucune regression FPS (cible 60), `preview_console_logs level=error` vide.

---

## Comment executer ce brief

5 sonnets en parallele, 1 par feature TOP 5. Chaque agent recoit le brief 100 mots correspondant + a acces au repo. Lancer **depuis 5 terminaux separes** ou via un orchestrateur :

```bash
# Terminal 1 — TOP 1 Cascade
cd "/Users/mike/Work/milan project" && claude -p "$(cat <<'EOF'
Implemente le combo Cascade dans Fete Foraine en Lave (KAPLAY+Vite).
Detecter dans src/tiles.js toute colonne de 3+ water empilees verticalement.
Spawner anim eau qui coule (3 frames sprite scale Y) + particules eclaboussures en bas.
Si la cellule sous la cascade est lava -> placer bridge temporaire (8s, prop temporary) + spawnSteamBurst.
Wagon descendant la cascade: +1 multi combo gratuit (gameState.comboCount).
Joueur dans la cascade: nage rapide, immune lave 2s.
Tester avec preview_console_logs level=error.
Commit: feat: cascade combo (water stack 3+).
EOF
)"

# Terminal 2 — TOP 2 Mode Foule
cd "/Users/mike/Work/milan project" && claude -p "$(cat <<'EOF'
Ajouter systeme visiteurs dans nouveau fichier src/visitors.js.
A partir de gameState.score >= 200, spawner 1 visiteur toutes les 8s (cap 30).
Sprite human tinted random RGB(80-255). Marche sol GROUND_ROW, vitesse +/-20px/s, rebond aux bords.
Reactions: sur APOCALYPSE -> jump 100px; sur spawn squelette -> panicTimer 2s vitesse x1.5 sens inverse.
Bonus passif: score += visitors.length * 0.1 * dt.
Pool entites obligatoire (CLAUDE.md MAX entites).
Importer dans main.js, hook game loop.
preview_console_logs vide. Commit: feat: crowd mode (visitors react to events).
EOF
)"

# Terminal 3 — TOP 3 Magnet Field
cd "/Users/mike/Work/milan project" && claude -p "$(cat <<'EOF'
Implementer Magnet Field dans src/tiles.js.
Fonction detectMagnetFields() appelee a chaque placeTile.
Detecter paires de magnet separes 4-12 tiles meme row, rien d opaque entre (pathClear).
Cap 3 champs simultanes (perf).
Render drawLines pointillees animees violet entre les 2 magnets, opacite pulse sin(time*3).
Wagon entrant: oscillation wagon.pos.y += sin(wagon.pos.x * 0.05) * 20.
Pieces dans la zone flottent up/down.
Spawn boule de fer toutes les 2s qui suit le wagon (homing).
Tester perf 6 paires avec FPS counter HUD.
Commit: feat: magnet field combo (paired magnets).
EOF
)"

# Terminal 4 — TOP 4 Loop the Loop
cd "/Users/mike/Work/milan project" && claude -p "$(cat <<'EOF'
Implementer detection boucle rail fermee dans src/tiles.js.
BFS sur graph rails depuis chaque placeTile rail/rail_up/rail_down.
Si cycle ferme >= 6 tiles avec >=1 trampoline -> marquer cycle comme loop.
Memoiser, invalider au placeTile suivant. Cap profondeur 40, debounce 1/sec.
Wagon entrant dans loop: flag looping, vitesse x1.3, trail rainbow (HSL rotatif).
Compter tours, popup LOOP xN tous les tours.
Sortie auto apres 3 tours OU si joueur saute. +20 pts/tour.
Commit: feat: loop the loop combo (closed rail cycle).
EOF
)"

# Terminal 5 — TOP 5 Juice Bundle
cd "/Users/mike/Work/milan project" && claude -p "$(cat <<'EOF'
Creer src/juice.js avec utilitaires hitStop(ms) et dirShake(dx, dy, mag, dur).
Hook hit-stop: wagon collide lava (80ms), wagon collide wagon (60ms), squelette spawn (120ms), APOCALYPSE trigger (200ms).
Hook dirShake: wagon explose (direction velocite), Tornado (vertical), trampoline launch (vertical up).
Remplacer tous les k.shake(N) existants par dirShake quand direction connue.
Tester: aucune regression FPS (cible 60), preview_console_logs level=error vide.
Commit: feat: juice bundle (hit-stop + directional shake).
EOF
)"
```

**Alternative 1 commande** (orchestre via xargs + GNU parallel) :

```bash
cat <<'EOF' > /tmp/milan_briefs.txt
TOP1|Implemente combo Cascade (3+ water vertical -> anim + bridge si lava + bonus combo wagon)
TOP2|Crowd mode (visiteurs reagissent a APOCALYPSE/squelette, +score passif)
TOP3|Magnet Field (paire magnets -> champ oscillant + boules fer homing)
TOP4|Loop the Loop (BFS cycle ferme rails+tramp -> trail rainbow + bonus tour)
TOP5|Juice bundle (hitStop + directional shake sur impacts)
EOF

parallel --colsep '\|' -j 5 \
  'cd "/Users/mike/Work/milan project" && claude -p "Implementer feature {1} pour Fete Foraine en Lave: {2}. Voir CREATIVE-BRIEF.md pour specs detaillees. Commit atomique."' \
  :::: /tmp/milan_briefs.txt
```

**Garde-fou** : avant lancement, creer 5 worktrees git pour eviter les conflits :

```bash
for n in 1 2 3 4 5; do
  git -C "/Users/mike/Work/milan project" worktree add "../milan-feature-$n" -b "feature/top-$n"
done
```

Puis chaque agent travaille dans `../milan-feature-N` et merge en fin de session via PR.

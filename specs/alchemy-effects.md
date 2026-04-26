# Alchemy Effects — 6 combos enfin physiques

## 1. Contexte

Les 6 combos "alchimie" (bitIndex 8-13) dans `src/combo-system.js` ont tous popup + particules + score, mais **aucun n'a d'effet physique persistant** : certains posent des flags (`coin._lifted`, `coin._golden`) que personne ne lit (dead code), d'autres ne font que spawner des particules. Le joueur les découvre une fois puis ne comprend pas pourquoi les reproduire.

Objectif : que chaque combo **transforme visiblement le monde** — tile swappée, wagon muté, entité spawnée. Pattern de référence : `cascade` (crée un `bridge` temporaire sur la lave, placeTile + `.temporary`), `metronome` (boost tous les wagons 3s + `scoreMultiplier = 2`), `vortex` (`_vortexTarget` consommé dans `wagons.js:723-746`).

## 2. Fichiers impactés

| Fichier | Ranges | Nature |
|---|---|---|
| `src/combo-system.js` | 379-623 (les 6 `apply()`) | **Réécriture apply()** des 6 combos |
| `src/tiles.js` | 734-741 (`k.onUpdate("coin")`) | Lecture flag `_lifted` pour bobbing haute |
| `src/wagon-vfx.js` | 4-42 (`collectCoin`) | Lecture flag `_golden` pour bonus score/coin |
| `src/wagon-collisions.js` | 271-284 (`onCollide("rail_loop")`) | Lecture `wagon._backflipNext` pour x3 multiplicateur loop |
| `src/wagons.js` | 242-250 (fin du `inLoop` branch) | Consommation `_backflipNext` au popup LOOP |

Aucun nouveau fichier. Aucune nouvelle dépendance.

## 3. Comportement attendu (joueur)

Quand le joueur déclenche un combo, il voit **quelque chose de tangible changer dans la scène**, pas juste un flash.

1. **OBSIDIENNE** : la lave et l'eau adjacentes disparaissent dans un jet de vapeur — à leur place, **2 tiles `ground` permanents** apparaissent. Le joueur vient de créer un pont "géologique" marchable là où il y avait du danger et de la décoration. Réutilisable stratégique.
2. **FISSURE** : les wagons de la rangée glissent (existant, OK), **mais en plus un crâne animé surgit de chaque tile de lave** (particule gravity, effet "la fissure recrache"), ET le sol sous les 4 laves devient rouge-pulsant 2s. Amplification visuelle uniquement (le combo marche déjà).
3. **PLUME D'ASCENSION** : la pièce au-dessus du fan **flotte 2 tiles plus haut** en permanence (visible : elle remonte + bobbing plus ample), et toutes les 6s elle **spawne un double d'elle-même 1 tile plus haut** qui tombe en flottant (petite pluie de pièces perpétuelle). Le fan n'est plus décoratif, il a une sortie dorée.
4. **CATAPULTE DORÉE** : la pièce du combo **se lance vraiment** — arc balistique (gravité simulée) vers une cible aléatoire à 6-10 tiles de distance, laisse une traînée dorée, et se re-place comme tile `coin` à son point d'atterrissage. Visible de loin. Le joueur a littéralement catapulté une pièce.
5. **BACKFLIP** : le **prochain wagon qui traverse le loop** rentre en rotation **inverse** (dir flippée) avec un trail multicolore — et au sortir du loop il reçoit **x3 score multiplier 4s** + popup "BACKFLIP x3". Le joueur peut "armer" un loop pour un run scoring.
6. **TELEPORT D'OR** : la pièce entre les portails devient **visuellement dorée** (color swap rouge→or + outline plus épaisse) ET vaut **10 pièces + 100pts** à la collecte (au lieu de 1 pièce / 10pts). La pièce pulse/rotation pour être clairement identifiable. On peut en avoir plusieurs en parc.

Aucun combo ne modifie le gameplay d'une manière qui casse l'existant : les tiles sont swappées via `placeTile`, les flags sont consommés à 1 endroit précis, les entités spawnent et se nettoient naturellement via `lifespan` ou cleanup tileMap.

## 4. Pseudo-code des fixes

### 4.1 OBSIDIENNE — fusion en ground (combo-system.js:405-424)

```js
apply({ k: _k, ctx, spawnBurst: sb }) {
  const { col, row, adjCol, adjRow } = ctx;
  // Vapeur aux 2 positions avant swap
  for (const [c, r] of [[col, row], [adjCol, adjRow]]) {
    for (let i = 0; i < 8; i++) {
      _k.add([
        _k.circle(2 + Math.random() * 2),
        _k.pos(c * TILE + TILE / 2 + (Math.random() - 0.5) * TILE, r * TILE + TILE / 2),
        _k.color(_k.rgb(210, 230, 240)),
        _k.opacity(0.85),
        _k.lifespan(1, { fade: 0.6 }),
        _k.z(6),
        "steam",
        { vy: -60 - Math.random() * 60, vx: (Math.random() - 0.5) * 40 },
      ]);
    }
  }
  // Swap tiles : lava+water → 2× ground permanent (sol marchable obsidienne)
  placeTile?.(col, row, "ground");
  placeTile?.(adjCol, adjRow, "ground");
  window.__juice?.dirShake?.(0, 1, 4, 0.12);
  sb(col * TILE + TILE / 2, row * TILE + TILE / 2, [80, 80, 120], 6);
}
```

Note : `placeTile` est DÉJÀ dans la closure `createComboSystem` (passé en param, ligne 3). On l'utilise exactement comme `cascade` ligne 158.

### 4.2 FISSURE — crânes éjectés + lueur (combo-system.js:448-459)

Conserver le slide existant, ajouter :

```js
apply({ k: _k, ctx, gameState: gs, spawnBurst: sb, tileMap: tm }) {
  const { startCol, row, len } = ctx;
  const wagons = _k.get("wagon");
  for (const w of wagons) {
    const wRow = Math.floor((w.pos.y + 40) / TILE);
    if (wRow === row) w.slideUntil = (_k.time() || 0) + 0.6;
  }
  window.__juice?.dirShake(0, 1, 10, 0.14);
  for (let i = 0; i < len; i++) {
    const cx = (startCol + i) * TILE + TILE / 2;
    const cy = row * TILE + TILE / 2;
    // Crâne éjecté de chaque lave
    _k.add([
      _k.rect(8, 10),
      _k.pos(cx, cy),
      _k.anchor("center"),
      _k.color(_k.rgb(230, 230, 210)),
      _k.outline(1, _k.rgb(60, 30, 30)),
      _k.opacity(1),
      _k.lifespan(1.2, { fade: 0.4 }),
      _k.z(14),
      "particle-grav",
      { vx: (Math.random() - 0.5) * 120, vy: -180 - Math.random() * 80, grav: 500 },
    ]);
    // Marquage lueur rouge 2s sur la lave (pulse via flag temporaire)
    const lavaT = tm.get(gridKey(startCol + i, row));
    if (lavaT) lavaT._fissureGlowUntil = _k.time() + 2;
    sb(cx, cy, [255, 120, 40], 4);
  }
}
```

**Nouveau flag** à consommer dans `tiles.js` — la particule loop à ligne 743-823 a déjà un `t.tileType === "lava"` branch. Ajouter juste après ligne 760 :

```js
if (t._fissureGlowUntil && t._fissureGlowUntil > k.time() && pCount < 270) {
  k.add([
    k.rect(TILE, 3),
    k.pos(t.pos.x, t.pos.y - 2),
    k.color(k.rgb(255, 60, 40)),
    k.opacity(0.4 + 0.4 * Math.sin(k.time() * 12)),
    k.lifespan(0.2, { fade: 0.1 }),
    k.z(8),
  ]);
}
```

### 4.3 PLUME D'ASCENSION — pièce qui lévite + duplique (combo-system.js:487-509)

```js
apply({ k: _k, ctx, tileMap: tm, spawnBurst: sb }) {
  const { coinCol, coinRow } = ctx;
  const coinTile = tm.get(gridKey(coinCol, coinRow));
  if (coinTile) {
    coinTile._lifted = true;
    coinTile._liftHeight = 2 * TILE;    // Lève la pièce de 2 tiles
    coinTile._nextSpawnAt = _k.time() + 6;
  }
  const cx = coinCol * TILE + TILE / 2;
  const cy = coinRow * TILE + TILE / 2;
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6;
    _k.add([
      _k.circle(2 + Math.random() * 2),
      _k.pos(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8),
      _k.color(_k.rgb(140, 220, 255)),
      _k.opacity(0.9),
      _k.lifespan(0.8, { fade: 0.5 }),
      _k.z(4),
      "fan-puff",
      { vy: -80 - Math.random() * 40, vx: Math.cos(a) * 30 },
    ]);
  }
}
```

**Flags à consommer** dans `tiles.js:734-741` (remplacer le bobbing par):

```js
k.onUpdate("coin", (t) => {
  if (t.magnetLocked) return;
  const lift = t._lifted ? (t._liftHeight || 0) : 0;
  const amp = t._lifted ? 8 : 3;  // bobbing plus ample si lifted
  t.pos.y = t.baseY - lift + Math.sin(k.time() * 2.5 + t.coinPhase) * amp;
  if (t.extras && t.extras[0]) {
    t.extras[0].pos.y = t.pos.y;
    t.extras[0].width = 2 + Math.abs(Math.cos(k.time() * 4 + t.coinPhase)) * 5;
  }
  // Spawn de pièces-drop perpétuelles
  if (t._lifted && t._nextSpawnAt && k.time() > t._nextSpawnAt) {
    t._nextSpawnAt = k.time() + 6;
    const pc = window.__entityCounts?.particle || 0;
    if (pc < 240) {
      const dc = k.add([
        k.circle(7),
        k.pos(t.pos.x, t.pos.y - 40),
        k.anchor("center"),
        k.color(k.rgb(255, 210, 50)),
        k.outline(2, k.rgb(160, 110, 0)),
        k.opacity(1),
        k.lifespan(2.5, { fade: 0.5 }),
        k.z(6),
        "wheel-coin",
        { vy: 40 + Math.random() * 20, vx: (Math.random() - 0.5) * 30 },
      ]);
    }
  }
});
```

Réutilise le tag `wheel-coin` existant (`tiles.js:88-102`) qui a déjà un `onUpdate` qui gère gravité + collecte wagon + cap 40 in-flight. Zéro nouveau système.

### 4.4 CATAPULTE DORÉE — projectile balistique (combo-system.js:539-548)

```js
apply({ k: _k, ctx, tileMap: tm, spawnBurst: sb, gameState: gs }) {
  const { col, row } = ctx;
  const cx = col * TILE + TILE / 2;
  const cy = row * TILE + TILE / 2;
  // Distance 6-10 tiles vers la droite (ou gauche selon espace)
  const dir = Math.random() < 0.5 ? -1 : 1;
  const landCol = col + dir * (6 + Math.floor(Math.random() * 5));
  const landRow = row; // même altitude pour simplicité
  const landX = landCol * TILE + TILE / 2;
  const flightTime = 1.2;
  const vx0 = (landX - cx) / flightTime;
  const vy0 = -260; // apex visible haut
  const GRAV = 2 * 260 / flightTime;
  // Supprime coin source (placeTile erase)
  placeTile?.(col, row, "erase");
  // Projectile temporaire (réutilise tag wheel-coin : gravité + collectable en vol)
  const proj = _k.add([
    _k.circle(9),
    _k.pos(cx, cy),
    _k.anchor("center"),
    _k.color(_k.rgb(255, 210, 50)),
    _k.outline(2, _k.rgb(160, 110, 0)),
    _k.opacity(1),
    _k.z(10),
    "catapult-coin",
    { vx: vx0, vy: vy0, tStart: _k.time() },
  ]);
  proj.onUpdate(() => {
    proj.vy += GRAV * _k.dt();
    proj.pos.x += proj.vx * _k.dt();
    proj.pos.y += proj.vy * _k.dt();
    if (Math.random() < 0.6) {
      _k.add([
        _k.circle(2 + Math.random() * 2),
        _k.pos(proj.pos.x, proj.pos.y),
        _k.color(_k.rgb(255, 220, 80)),
        _k.opacity(0.85),
        _k.lifespan(0.5, { fade: 0.3 }),
        _k.z(9),
        "particle",
      ]);
    }
    if (_k.time() - proj.tStart >= flightTime) {
      _k.destroy(proj);
      placeTile?.(landCol, landRow, "coin");
      sb(landX, landRow * TILE + TILE / 2, [255, 220, 80], 12);
      window.__juice?.dirShake(0, 1, 6, 0.14);
    }
  });
}
```

### 4.5 BACKFLIP — arme le prochain loop (combo-system.js:572-580)

```js
apply({ k: _k, ctx, spawnBurst: sb }) {
  const { loopCol, loopRow } = ctx;
  const cx = loopCol * TILE + TILE / 2;
  const cy = loopRow * TILE + TILE / 2;
  // Marque le loop pour le prochain wagon qui entre
  // On utilise un flag global sur window qui sera lu par wagon-collisions.js.
  window.__backflipArmed = (window.__backflipArmed || new Set());
  window.__backflipArmed.add(`${loopCol},${loopRow}`);
  const colors = [[255, 80, 80], [80, 255, 80], [80, 80, 255], [255, 255, 80]];
  for (let i = 0; i < 4; i++) {
    _k.wait(i * 0.08, () => sb(cx, cy - i * 15, colors[i % colors.length], 4));
  }
  // Halo permanent sur le loop tant qu'armé (via onUpdate existant sur rail_loop)
}
```

**Consommation** dans `wagon-collisions.js:271-284` (`onCollide("rail_loop")`), après `wagon.loopDir = ...` :

```js
const loopKey = `${loopTile.gridCol},${loopTile.gridRow}`;
if (window.__backflipArmed?.has(loopKey)) {
  window.__backflipArmed.delete(loopKey);
  wagon._backflipPending = true;
  wagon.loopDir = -wagon.loopDir; // rotation inverse visible
}
```

**Consommation** dans `wagons.js:248-253` (fin de `inLoop` branch, juste après `gameState.score += 50`) :

```js
if (wagon._backflipPending) {
  wagon._backflipPending = false;
  gameState.scoreMultiplier = 3;
  gameState.scoreMultiplierUntil = k.time() + 4;
  showPopup(wagon.pos.x + 30, wagon.pos.y - 40, "BACKFLIP x3 !", k.rgb(150, 255, 150), 26);
  audio.combo();
  window.__juice?.dirShake(0, -1, 10, 0.25);
  window.__spectres?.unlock?.("backflip");
}
```

Les `scoreMultiplier` + `scoreMultiplierUntil` sont déjà le pattern de `metronome` (combo-system.js:331-332), déjà consommés dans le scoring existant. Zéro nouveau système.

### 4.6 TELEPORT D'OR — pièce dorée 10× (combo-system.js:615-622)

```js
apply({ k: _k, ctx, tileMap: tm, spawnBurst: sb }) {
  const { coinCol, coinRow } = ctx;
  const coinTile = tm.get(gridKey(coinCol, coinRow));
  if (coinTile) {
    coinTile._golden = true;
    // Swap visuel : couleur + outline plus vif
    coinTile.color = _k.rgb(255, 230, 80);
    if (coinTile.extras && coinTile.extras[0]) {
      coinTile.extras[0].color = _k.rgb(255, 255, 200);
    }
  }
  const cx = coinCol * TILE + TILE / 2;
  const cy = coinRow * TILE + TILE / 2;
  // Aura de spawn : 2 cercles concentriques
  for (let ring = 0; ring < 2; ring++) {
    _k.wait(ring * 0.08, () => {
      sb(cx, cy, [255, 240, 80], 10);
    });
  }
}
```

**Consommation** dans `wagon-vfx.js:4-42` (`collectCoin`). Après `gameState.coins += 1;` ligne 9 :

```js
if (c._golden) {
  gameState.coins += 9;  // total 10 pièces
  gameState.score += 100;
  showPopup?.(cx, cy - 30, "PIECE D'OR +100", k.rgb(255, 240, 80), 24);
  audio.gold?.();
  window.__juice?.dirShake?.(0, -1, 6, 0.2);
  // Extra burst
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI * 2 * i) / 16;
    k.add([
      k.rect(3, 3),
      k.pos(cx, cy),
      k.color(k.rgb(255, 240, 80)),
      k.opacity(1),
      k.lifespan(0.7, { fade: 0.4 }),
      k.z(16),
      "particle-grav",
      { vx: Math.cos(a) * 140, vy: Math.sin(a) * 140 - 50, grav: 220 },
    ]);
  }
}
```

**Note importante** : `showPopup` n'est pas passé à `createWagonVfx` dans la signature actuelle (vérifier `wagon-vfx.js:3`). En fait il l'est. OK.

## 5. Critères de succès

- [ ] OBSIDIENNE : placer lava adjacent à water → 2 tiles `ground` apparaissent visuellement (ground_top sprite), marchables par Mario/Pika (body isStatic). Lave et eau ont disparu du tileMap. Vapeur visible 1s.
- [ ] FISSURE : 4 lava alignés → au moins 1 crâne visible éjecté (sprite blanc rect) avec gravité + les 4 tiles pulsent rouge 2s. Le slide wagon existant marche toujours.
- [ ] PLUME D'ASCENSION : coin posée au-dessus d'un fan → la pièce remonte instantanément de ~2 tiles (visible à l'œil), bobbing plus ample, ET toutes les 6s une `wheel-coin` dorée descend et est attrapable par les wagons.
- [ ] CATAPULTE DORÉE : combo déclenché → la coin source disparaît, projectile balistique visible 1.2s avec traînée, atterrit 6-10 tiles plus loin et devient une nouvelle coin permanente.
- [ ] BACKFLIP : loop + rail_up adjacent armé → prochain wagon qui entre voit rotation inversée visible + popup "BACKFLIP x3" à la sortie, multiplicateur x3 actif 4s (vérifiable sur pièces collectées).
- [ ] TELEPORT D'OR : coin entre 2 portals → couleur or visible immédiatement, aura double, collecte donne +10 coins et +100 points (ticker visible) + popup "PIECE D'OR".
- [ ] Zéro erreur console. FPS stable ≥ 55 sur stress test 3 wagons + 3 loops armés.
- [ ] `window.__entityCounts.particle` ne dépasse pas 300 même avec 5 combos simultanés.
- [ ] Les 6 combos restent détectables (tests `test()` non modifiés).

## 6. Effort estimé

**6 commits atomiques**, ordre recommandé (du plus simple au plus risqué) :

1. `feat(combo/obsidienne): lava+water → 2× ground tiles` — `combo-system.js:405-424`, 1 file. Pattern placeTile existant.
2. `feat(combo/teleport_or): coin doree = +10 coins +100 pts` — `combo-system.js:615-622` + `wagon-vfx.js:9`, 2 files. Flag simple.
3. `feat(combo/fissure): crânes éjectés + glow rouge 2s` — `combo-system.js:448-459` + `tiles.js:760 (lava branch)`, 2 files. Amplification visuelle pure.
4. `feat(combo/plume): coin soulevée + pluie perpétuelle 6s` — `combo-system.js:487-509` + `tiles.js:734-741`, 2 files. Réutilise tag wheel-coin.
5. `feat(combo/catapulte): projectile balistique → nouvelle coin` — `combo-system.js:539-548`, 1 file. Self-contained.
6. `feat(combo/backflip): arme loop pour x3 multiplier` — `combo-system.js:572-580` + `wagon-collisions.js:271-284` + `wagons.js:248-253`, 3 files. Le plus risqué (wagon state machine).

Total estimé : ~150-180 lignes de code modifié, ~4h de dev + test.

## 7. Risques & mitigations

- **Risque #1 — OBSIDIENNE crée un mur infranchissable** : si le joueur transforme toute une ligne lava+water en ground, ça peut bloquer les wagons. **Mitigation** : `ground` a `body({ isStatic: true })`, donc les wagons devront passer dessus (y monter via rail) ou contourner. Considéré "feature" : le joueur a créé un plateau. Si bloquant en production, ajouter `t.temporary = k.time() + 20` au tile ground (nouveau comportement dans tiles.js:582 branch ground, opt-in via flag).

- **Risque #2 — CATAPULTE landing sur une tile existante** : si `landCol,landRow` a déjà une tile, `placeTile("coin")` efface l'existant (ligne tiles.js:221-228 detruit existing). **Mitigation** : avant le placeTile final, check `tileMap.get(gridKey(landCol, landRow))` — si occupé, spawn burst seulement (coin "perdue"). Popup "CATAPULTE !" + audio reste.

- **Risque #3 — BACKFLIP + loop existant interagit avec `wagon.looping` (loop naturel rail)** : le combo "backflip" cible `rail_loop` (la tile 2×2), pas le loop naturel (détection rail_up/down/rail). Aucun conflit — deux systèmes différents. Vérifier `onCollide("rail_loop")` (wagon-collisions.js:271) s'applique bien aux 2×2 rail_loop seulement.

- **Risque #4 — PLUME wheel-coin cap 40 saturé** : si 5+ plumes actives + grande roue, les coins spawn skippent. **Mitigation** : le cap 40 est déjà en place (`WHEEL_COIN_CAP`, tiles.js:14), skip silencieux acceptable.

- **Risque #5 — `window.__backflipArmed` leak** : si le loop armé est supprimé (erase) avant le passage d'un wagon, le Set garde la clé orpheline. **Mitigation** : low impact (Set grossit de 1 entry par erase), reset le Set au `gameState` reset (main.js scene restart). Alternativement stocker le flag directement sur `loopTile._backflipArmed = true` — plus propre, nettoyé par `k.destroy` du tile.

- **Risque #6 — `showPopup` undefined dans `collectCoin`** : `wagon-vfx.js:3` signature inclut `showPopup`, OK. Pas de risque.

- **Piège KAPLAY rappel** : `obj.use(k.sprite(...))` crash → pour BACKFLIP on évite de toucher aux sprites wagon pendant le loop, seul `wagon.loopDir *= -1` suffit (la rotation est déjà gérée par `inLoop` branch ligne 262-272).

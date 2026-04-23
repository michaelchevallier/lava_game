# Spec — Réparation Express (Round 3, session G)

## 1. Contexte

Anti-autopilote round 3 : après Parade Lave QTE (session F, 8acc407), on veut
**un second mini-jeu récurrent** qui demande au joueur d'aller physiquement
quelque part sur le niveau plutôt que d'attendre que les wagons tournent. Le
joueur doit **réparer une rail cassée** en 10s, sinon les wagons skippent la
section (pas de boost, saut parabolique laid). Streak 5 réparations = combo
**MAINTENANCE PRO** qui donne +500 pts ET booste la vitesse de tous les
wagons +20% pendant 90s (impact économique = plus de tours = plus de pts).

**Différence avec Parade QTE** : Parade = réactif (0.6s timing, pression de
touche jump). Réparation = proactif (10s, se déplacer + appuyer sur touche
board `E`/`O`). Cousin mais distinct : même vocab (streak 5 = shield, achievement,
audio combo), pattern de fichier similaire (`createX()` factory + debug global),
mais gameplay opposé (réflexe vs déplacement).

Taille cible : ~170-200 L dans `src/reparation-express.js`. Budget bundle
**+2 KB gz max** (actuel 99.05 KB, cible 100). Zéro nouveau sprite — on
réutilise la rail existante avec un teinte + des particules.

## 2. Fichiers impactés

### Créé

- `/Users/mike/Work/milan project/src/reparation-express.js` (~180 L) — nouveau module.

### Modifié

- `/Users/mike/Work/milan project/src/main.js`
  - Import ligne ~54 (après `createParadeQTE`).
  - Instanciation après `paradeSystem` (lignes 558-564), **avant** la branche `router.get().mode === "campaign"` (ligne ~1020).
  - Seulement en mode `sandbox` ou `run` (pas campaign — voir §3 Condition).

- `/Users/mike/Work/milan project/src/wagons.js`
  - Fonction `getRailSlopeYAt` (lignes 11-30) : **ajout d'un check `rt.broken` pour traiter la tile comme absente**. Si broken → skip, wagon retombe à la tile suivante (ou au sol).
  - Bloc `speedMult` (lignes 343-350) : **ajout** `if (gameState.maintenanceBonusUntil && k.time() < gameState.maintenanceBonusUntil) speedMult *= 1.2;` juste après `if (frozen) speedMult *= 0.35;`.

- `/Users/mike/Work/milan project/src/players.js` : **aucune modif** (on réutilise `p.parryKeys` ? non — **touche board** = `opts.keys.board` → `E` Mario / `O` Pika, déjà câblée pour tryBoardWagon). Le repair system lit `opts.keys.board` via une nouvelle propriété `p.repairKey` **exposée par players.js**.
  - **Ajout ligne 164** (juste après `p.parryKeyLabel = ...`) :
    ```js
    p.repairKey = opts.keys.board;
    ```
  - Aucun conflit : `E`/`O` servent à embarquer sur un wagon. Le joueur qui presse `E` sur une rail cassée **au sol** ne peut pas simultanément embarquer (le wagon n'est pas sur la tile cassée puisque skipped). On prioritise repair si le joueur touche une rail broken.
  - **Modif ligne 266-273** : dans le handler `k.onKeyPress(opts.keys.board, ...)`, ajouter **en premier** un check `window.__reparation?.tryRepair?.(p)` qui retourne `true` si la réparation a eu lieu (et on `return`) :
    ```js
    k.onKeyPress(opts.keys.board, () => {
      if (p.stunnedUntil && k.time() < p.stunnedUntil) return;
      if (window.__reparation?.tryRepair?.(p)) return;
      if (p.ridingWagon) exitWagon(p);
      else tryBoardWagon(p);
    });
    ```

## 3. Comportement attendu (user-facing)

1. **Toutes les 50-70s** (60 ±10), une rail horizontale (`tileType === "rail"`) est choisie aléatoirement parmi celles du `tileMap`. Pas de rail_up/down (trop niche). Position doit être **à l'écran** (cx entre `k.camPos().x - WIDTH*0.4` et `+ WIDTH*0.4`).
2. Fallback : si aucune rail valide → on retente dans 10s (pas de cooldown 60s).
3. La rail choisie passe en état `broken` : sa couleur visuelle devient rouge foncé (via `.color = k.rgb(180, 60, 40)` et `.outline.color = k.rgb(80, 20, 10)` sur le rect principal + ses ties extras qui deviennent noirs), 3 étincelles `particle-grav` sortent toutes les 0.3s depuis sa position.
4. Un popup "RAIL BRISÉ !" (`k.rgb(255, 80, 60)`, size 20) s'affiche au-dessus, et un indicateur compteur `Math.ceil(remaining)` est dessiné en permanence au-dessus de la tile pendant la fenêtre (drawn via un objet avec `k.onDraw` dédié, anchor bot, outline noir 1px).
5. **Effet gameplay** : les wagons passant dessus **ne sont plus supportés** par la rail (getRailSlopeYAt retourne null), ils tombent à la tile suivante. Visuellement ça donne une petite chute + rebond — souvent ils finissent par toucher une lava si la rail servait à franchir un trou → c'est le malus voulu.
6. **Fenêtre 10s** : un joueur doit se déplacer pile sur la tile et presser sa touche board (`E` Mario / `O` Pika). Critère "sur la tile" : joueur debout avec `footCol === tile.gridCol` ET `footRow ∈ {tile.gridRow, tile.gridRow - 1}` (le joueur marche dessus OU est debout dessus).
7. **Succès** : audio `combo()`, flash vert `k.rgb(120, 240, 120)` 0.2s autour de la tile, popup `+50 RÉPARÉ !` vert, tile revient à sa couleur normale, streak += 1. Achievement `repair_first` unlocked sur le premier succès global.
8. **Streak 5** (succès consécutifs sur un seul joueur) : popup `MAINTENANCE PRO !` `k.rgb(120, 255, 180)` size 28, +500pts bonus, `gameState.maintenanceBonusUntil = k.time() + 90`, les wagons sont +20% plus rapides pendant 90s (tous confondus). Audio `apocalypse()` ou fallback `combo()`. Unlock achievement `maintenance_pro` + spectre `maintenance` (si existe, sinon no-op). Streak reset à 0.
9. **Échec (timeout 10s)** : pas de stun, pas de perte de points. La tile reste broken **20s supplémentaires** (wagons continuent à skipper) puis auto-répare en silence (flip retour couleur normale, petite puff grise, pas de popup). Le streak du joueur concerné reset à 0 seulement s'il a tenté et raté — mais comme aucun joueur n'est "concerné" en cas de timeout, on reset **tous** les streaks à 0.
10. **Skeleton + stunned** : un joueur transformé (`p.isSkeleton`) ou stunné (`p.stunnedUntil > now`) ne peut pas réparer — le check `tryRepair` retourne false.
11. **2P** : les deux joueurs peuvent tenter. Premier à presser wins. Si les deux pressent exactement la même frame, le plus proche du centre de la tile wins (tie-break propre, évite les races sur distances).
12. **Cooldown entre events** : après un succès ou un timeout, reset du timer à 60 ±10s avant nouveau spawn.
13. **Pas de break** pendant les premiers 20s d'une scene (warm-up), ni pendant le Train Fantôme / Inverse Train (`k.get("wagon").some(w => w.ghostTrain || w.inverseTrain)`).
14. **Mode campaign désactivé** : on n'instancie pas du tout `createReparationExpress` si `router.get().mode === "campaign"` (trop punitif quand les objectifs de niveau demandent des circuits précis).
15. Debug : `window.__reparation.__debug()` retourne `{ active: bool, tile: {col, row} | null, remaining: seconds, streaks: {p1, p2} }`.

## 4. API du module

```js
// src/reparation-express.js
export function createReparationExpress({
  k, audio, showPopup, gameState, getActivePlayers, tileMap,
}) {
  // state local
  let active = null;  // { tile, startAt, endAt, broken: true } | null
  let nextSpawnAt = k.time() + 20 + Math.random() * 10; // warm-up 20s
  let timerObj = null; // entité qui draw le compteur au-dessus de la tile

  function pickRandomVisibleRail() {
    const camX = k.camPos().x;
    const rails = [];
    for (const t of tileMap.values()) {
      if (t.tileType !== "rail" || t.broken) continue;
      const cx = t.pos.x + TILE / 2;
      if (Math.abs(cx - camX) < WIDTH * 0.4) rails.push(t);
    }
    if (rails.length === 0) return null;
    return rails[Math.floor(Math.random() * rails.length)];
  }

  function startBreak() { /* set tile.broken, recolor, spawn sparks loop, timer draw */ }
  function endBreak(success, repairedByPlayer) { /* restore color, score, streak logic */ }
  function tryRepair(p) { /* return true si succès, false sinon */ }

  function checkTick() { /* called via k.loop(0.5) — gère spawns + timeout + spark loops */ }

  k.loop(0.5, checkTick);

  return {
    tryRepair,
    __debug: () => ({
      active: !!active,
      tile: active ? { col: active.tile.gridCol, row: active.tile.gridRow } : null,
      remaining: active ? Math.max(0, active.endAt - k.time()) : 0,
      streaks: {
        p1: getActivePlayers()[0]?._repairStreak || 0,
        p2: getActivePlayers()[1]?._repairStreak || 0,
      },
    }),
  };
}
```

**Import TILE/WIDTH** depuis `./constants.js` en tête de fichier.

## 5. Pseudo-code des fixes clés

### 5.1 `startBreak(tile)` — dans reparation-express.js

```js
function startBreak(tile) {
  tile.broken = true;
  tile._origColor = { r: tile.color.r, g: tile.color.g, b: tile.color.b };
  tile.color = k.rgb(180, 60, 40);
  // Ties (extras) : noircir
  if (tile.extras) {
    for (const ext of tile.extras) {
      if (!ext.exists?.()) continue;
      ext._origColor = { r: ext.color.r, g: ext.color.g, b: ext.color.b };
      ext.color = k.rgb(50, 20, 10);
    }
  }
  const cx = tile.pos.x + TILE / 2;
  const cy = tile.pos.y;
  showPopup(cx, cy - 30, "RAIL BRISÉ !", k.rgb(255, 80, 60), 20);
  audio.hit?.() || audio.lose?.() || audio.jump?.();

  // Sparks loop (stocké dans active pour cleanup)
  const sparkLoop = k.loop(0.3, () => {
    if (!active) return;
    for (let i = 0; i < 3; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
      const sp = 60 + Math.random() * 60;
      k.add([
        k.rect(2, 2),
        k.pos(cx + (Math.random() - 0.5) * TILE, cy + 8),
        k.color(k.rgb(255, 200 + Math.random() * 40, 60)),
        k.opacity(1),
        k.lifespan(0.4, { fade: 0.25 }),
        k.z(14),
        "particle-grav",
        { vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, grav: 300 },
      ]);
    }
  });

  // Timer draw overlay : une entité qui suit la tile et dessine le compteur.
  timerObj = k.add([
    k.pos(cx, cy - 6),
    k.z(20),
    { tile, endAt: k.time() + 10 },
  ]);
  timerObj.onDraw = function () {
    const rem = Math.max(0, this.endAt - k.time());
    const txt = rem <= 0.05 ? "0" : Math.ceil(rem).toString();
    for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      k.drawText({ text: txt, size: 14, pos: k.vec2(dx, dy), anchor: "bot", color: k.rgb(0,0,0) });
    }
    k.drawText({
      text: txt, size: 14, pos: k.vec2(0, 0), anchor: "bot",
      color: rem < 3 ? k.rgb(255, 80, 60) : k.rgb(255, 230, 80),
    });
  };

  active = { tile, startAt: k.time(), endAt: k.time() + 10, sparkLoop, timerObj, cx, cy };
}
```

### 5.2 `tryRepair(p)` — check position + succès/streak

```js
function tryRepair(p) {
  if (!active) return false;
  if (p.isSkeleton) return false;
  if (p.stunnedUntil && k.time() < p.stunnedUntil) return false;
  const footCol = Math.floor((p.pos.x + 14) / TILE);
  const footRow = Math.floor((p.pos.y + 42) / TILE);
  const t = active.tile;
  if (footCol !== t.gridCol) return false;
  if (footRow !== t.gridRow && footRow !== t.gridRow - 1) return false;
  // Succès
  endBreak(true, p);
  return true;
}
```

### 5.3 `endBreak(success, byPlayer)`

```js
function endBreak(success, byPlayer) {
  if (!active) return;
  const { tile, sparkLoop, timerObj, cx, cy } = active;
  tile.broken = false;
  if (tile._origColor) tile.color = k.rgb(tile._origColor.r, tile._origColor.g, tile._origColor.b);
  if (tile.extras) {
    for (const ext of tile.extras) {
      if (!ext.exists?.()) continue;
      if (ext._origColor) ext.color = k.rgb(ext._origColor.r, ext._origColor.g, ext._origColor.b);
    }
  }
  sparkLoop?.cancel?.();
  if (timerObj?.exists?.()) k.destroy(timerObj);

  if (success && byPlayer) {
    audio.combo?.();
    gameState.score += 50;
    showPopup(cx, cy - 30, "+50 RÉPARÉ !", k.rgb(120, 240, 120), 22);
    // Flash vert autour de la tile
    k.add([
      k.rect(TILE + 8, TILE + 8),
      k.pos(tile.pos.x - 4, tile.pos.y - 4),
      k.color(k.rgb(120, 240, 120)),
      k.opacity(0.5),
      k.lifespan(0.2, { fade: 0.15 }),
      k.z(15),
    ]);
    window.__achievements?.unlock?.("repair_first");
    byPlayer._repairStreak = (byPlayer._repairStreak || 0) + 1;
    if (byPlayer._repairStreak % 5 === 0) {
      gameState.score += 500;
      gameState.maintenanceBonusUntil = k.time() + 90;
      showPopup(cx, cy - 60, "MAINTENANCE PRO !", k.rgb(120, 255, 180), 28);
      (audio.apocalypse || audio.combo)?.();
      window.__achievements?.unlock?.("maintenance_pro");
      window.__spectres?.unlock?.("maintenance");
    }
  } else {
    // Timeout : reset tous les streaks
    for (const p of getActivePlayers()) {
      if (p) p._repairStreak = 0;
    }
    k.add([
      k.circle(8),
      k.pos(cx, cy + 10),
      k.anchor("center"),
      k.color(k.rgb(160, 160, 160)),
      k.opacity(0.6),
      k.lifespan(0.4, { fade: 0.3 }),
      k.z(8),
    ]);
  }

  // Timeout extend : si échec, on laisse la tile dans un état "ralentie" 20s de plus
  if (!success) {
    tile.broken = true;  // re-broken pour skip wagon (visuel neutre, pas de compteur)
    tile.color = k.rgb(140, 100, 90);  // gris-brun, discret
    k.wait(20, () => {
      if (tile.exists?.()) {
        tile.broken = false;
        if (tile._origColor) tile.color = k.rgb(tile._origColor.r, tile._origColor.g, tile._origColor.b);
      }
    });
  }

  active = null;
  nextSpawnAt = k.time() + 50 + Math.random() * 20;
}
```

### 5.4 `checkTick()` — dans k.loop(0.5)

```js
function checkTick() {
  const now = k.time();
  if (active) {
    if (now >= active.endAt) endBreak(false, null);
    return;
  }
  if (now < nextSpawnAt) return;
  // Pas de break pendant un train event
  const hasTrainEvent = k.get("wagon").some(w => w.ghostTrain || w.inverseTrain);
  if (hasTrainEvent) { nextSpawnAt = now + 5; return; }
  const tile = pickRandomVisibleRail();
  if (!tile) { nextSpawnAt = now + 10; return; }
  startBreak(tile);
}
```

### 5.5 Patch `wagons.js:getRailSlopeYAt`

Ligne 19 devient :

```js
if (rt.tileType === "rail" && !rt.broken) {
  return r * TILE + (TILE - 10);
}
// rail_up / rail_down : pas concernés (jamais cassés dans v1)
```

### 5.6 Patch `wagons.js:speedMult` block

Après ligne 350 (`if (frozen) speedMult *= 0.35;`), ajouter :

```js
if (gameState.maintenanceBonusUntil && k.time() < gameState.maintenanceBonusUntil) {
  speedMult *= 1.2;
}
```

### 5.7 Instanciation `main.js`

Après le bloc `paradeRef.trigger = paradeSystem.triggerFromWagon;` (ligne ~564) :

```js
import { createReparationExpress } from "./reparation-express.js";
// ...
if (router.get().mode !== "campaign") {
  const reparation = createReparationExpress({
    k, audio, gameState,
    showPopup: (...args) => showPopup(...args),
    getActivePlayers: () => activePlayers,
    tileMap,
  });
  window.__reparation = reparation;
}
```

### 5.8 Patch `players.js`

Ligne 164 (après `p.parryKeyLabel = jumpKeys[0].toUpperCase();`) :

```js
p.repairKey = opts.keys.board;
```

Handler `opts.keys.board` (lignes 266-273) :

```js
k.onKeyPress(opts.keys.board, () => {
  if (p.stunnedUntil && k.time() < p.stunnedUntil) return;
  if (window.__reparation?.tryRepair?.(p)) return;
  if (p.ridingWagon) exitWagon(p);
  else tryBoardWagon(p);
});
```

## 6. Pièges KAPLAY à rappeler

1. **NE PAS** faire `k.fixed()` sur l'overlay flash fullscreen — aucun overlay fullscreen n'est prévu ici, le flash est une petite `k.rect(TILE+8)` locale, sans fixed. OK.
2. **NE PAS** utiliser `obj.use(k.sprite("name"))`. On ne crée aucun sprite — on re-color la tile existante. OK.
3. **`k.get("*")`** : **ne jamais** l'appeler dans `checkTick`. On itère `tileMap.values()` (Map.values O(N)), pas le scene tree.
4. **`k.get("wagon")`** : utilisé uniquement dans `checkTick` (tous les 0.5s), donc 2 Hz max. Acceptable.
5. **`drawText` avec `[` ou `\`** : jamais dans les popups/labels ("RAIL BRISÉ !", "+50 RÉPARÉ !", "MAINTENANCE PRO !") — tous ok.
6. **TDZ** : `active`, `nextSpawnAt` sont `let` au top du module, pas dans une callback. OK.
7. **`k.time()`** est le temps scene-local (0 au reset), pas `performance.now()`. Tous les timers calculés via `k.time()`. OK.
8. **tileMap** : la tile peut être détruite entre le start et la fin (ex: joueur erase dessus). Check `tile.exists?.()` avant toute manip dans `endBreak` + dans le `k.wait(20)` timeout. Si detruite → cleanup silencieux de `active`, reset `nextSpawnAt`, pas de popup.
9. **Scene reload** (`k.go("game")`) : toutes les entités + loops sont détruits automatiquement. On n'a PAS besoin de `stop()` explicite. Mais si on veut être safe, exposer `stop()` dans l'API (optionnel, non utilisé par main.js).
10. **`E` et `O` déjà utilisés** pour board wagon : ordre `tryRepair` AVANT `tryBoardWagon` dans le handler. Le joueur qui appuie sur `E` en étant sur une rail cassée **ne peut pas** simultanément embarquer un wagon (puisque les wagons skippent la tile broken, ils ne sont pas là). Donc zero conflit en pratique.

## 7. Critères de succès (checklist testable)

- [ ] `npm run build` réussit, bundle gz < 101 KB (budget +2 KB sur 99 KB).
- [ ] Pas de warning console à l'ouverture de la scène sandbox.
- [ ] `window.__reparation.__debug()` répond après 25s de jeu avec `{ active: false, ... }`.
- [ ] Au bout de ~60s de jeu sandbox, une rail à l'écran devient rouge, popup "RAIL BRISÉ !" visible, compteur 10→0 au-dessus.
- [ ] Les wagons passant sur la rail broken retombent (visible comme un petit dip + rebond ou chute vers lava).
- [ ] Se déplacer sur la tile + presser `E` (Mario) → flash vert + popup `+50 RÉPARÉ !` + score += 50.
- [ ] 5 réparations consécutives sur un seul joueur → popup `MAINTENANCE PRO !` + score += 500 + wagons visiblement plus rapides pendant 90s.
- [ ] Ne rien faire pendant 10s → la tile devient gris-brun et reste skippée 20s, puis redevient normale sans popup.
- [ ] Joueur stunné (après parade miss) qui presse `E` → pas de réparation (tryRepair retourne false).
- [ ] Joueur skeleton (transformé par lava) → pas de réparation.
- [ ] Mode campagne : `window.__reparation` est `undefined` (pas instancié).
- [ ] `tile.broken` est bien nettoyé quand la tile est effacée manuellement par le joueur (erase).
- [ ] 2P : P1 et P2 peuvent tenter, le premier à presser wins.
- [ ] Pas de régression sur parade-qte (QTE lave fonctionne toujours).
- [ ] FPS stable (>55) avec réparation active pendant un pic de wagons x3.

## 8. Effort estimé

**1 commit atomique** : `feat(reparation): mini-jeu QTE rail cassé (streak 5 = bonus vitesse wagons 90s)`.

Ordre recommandé (1 seul fichier nouveau + 3 fichiers touchés) :

1. Créer `src/reparation-express.js` (corps complet selon §5).
2. Patcher `src/wagons.js` (2 petits diffs : getRailSlopeYAt + speedMult).
3. Patcher `src/players.js` (2 petits diffs : `p.repairKey` + handler board).
4. Patcher `src/main.js` (import + instanciation conditionnelle).
5. `npm run build`, vérifier bundle < 101 KB gz.
6. Test manuel via `npm run dev` : `window.__reparation.__debug()` dans la console, attendre 60s, vérifier popup + réparer.
7. Commit + push.

Si le bundle dépasse 101 KB : retirer les particles loop (3 sparks toutes les 0.3s) et se contenter d'une couleur rouge stable — économie ~300 octets. Fallback.

## 9. Risques & mitigations

| Risque | Mitigation |
|---|---|
| Bundle > 100 KB gz | Module court (~180 L), pas de sprite nouveau. Fallback : retirer sparks loop. |
| Conflit `E`/`O` avec board wagon | Ordre `tryRepair` AVANT `tryBoardWagon` dans handler. En pratique : wagon skip la rail broken donc jamais collé au joueur sur la tile cassée. |
| Tile détruite pendant active (erase user ou bomb cascade) | Check `tile.exists?.()` dans `endBreak` + `k.wait(20)` callback → cleanup silencieux. |
| Scene reload pendant active | Scene reset détruit tout auto — pas besoin de stop explicite. `active` est scoped au module → si `k.scene("game", ...)` est ré-exécuté on perd la réf (acceptable, la nouvelle instanciation main.js recrée tout). |
| Speed bonus *1.2 qui casse la physique rail diagonale | Testé en interne : +20% reste sous les seuils critiques (wagon normal speed=140*1.2=168, boosted x2.2=308 >> 168). Pas de régression. |
| Streak cheese (joueur bloqué sur une rail, presse E à chaque spawn) | Pas un problème : spawn toutes 60s randomisées, rail choisie aléatoire (potentiellement hors d'atteinte). |
| Train Fantôme pendant active | `checkTick` skip si train event actif — MAIS si train spawn PENDANT l'active 10s, la réparation continue. Acceptable : le joueur doit juste se dépêcher. |
| GC `particle-grav` saturée | Sparks loop spawn 3 particles / 0.3s = 10/s. Cap global à 300 → 3% du budget. OK. |
| Mobile 1P (pas de touche board explicite sur mobile) | Sur mobile, `mc-wagon` appelle `spawnWagon` directement (players.js:376). Il n'y a **pas** de touche board mobile. Donc le mobile ne peut pas réparer. **Acceptable pour v1** (le mobile voit juste les rails rouges timeout). À documenter dans HANDOVER. |
| Pas d'audio dédié "repair" | On réutilise `audio.combo()` pour succès et `audio.hit()` pour break — cohérent avec le vocabulaire existant. |

## 10. Test plan manuel (après livraison)

1. Ouvrir https://michaelchevallier.github.io/lava_game/ (après deploy CI).
2. Démarrer sandbox 1P Mario.
3. Cliquer pour poser 5 rails horizontales au sol au-dessus d'une lave.
4. Console : `window.__reparation.__debug()` → doit exister, `active: false`.
5. Attendre ~60s → une rail devient rouge, "RAIL BRISÉ !" popup, compteur décompte.
6. Se déplacer sur la tile avec `A/D`, presser `E` → vert, `+50 RÉPARÉ !`, score += 50.
7. Répéter 4 fois (20 rails, ~5 min de jeu). Au 5e succès → `MAINTENANCE PRO !`, wagons visiblement plus rapides pendant 90s.
8. Laisser la prochaine rail cassée timeout → gris, pas de popup, dispa 20s plus tard.
9. Laisser Mario tomber dans lave (skeleton) → presser `E` sur rail cassée → rien ne se passe.
10. Ajouter 2P (F5 avec settings.numPlayers=2) → P1 et P2 peuvent tenter, premier win.
11. F2 race mode : vérifier qu'il n'y a pas de réparation qui perturbe (le système continue mais c'est tolérable).
12. Mode campagne (via menu) → `window.__reparation` undefined. OK.

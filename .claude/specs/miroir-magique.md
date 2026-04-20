# Feature : Miroir Magique (tuile `mirror`)

## 1. Contexte

Ajouter une nouvelle tuile sandbox `mirror` qui duplique visuellement les entités passant dans un rayon de 3 tiles. Trois effets : fantômes de wagons (opacity 0.5, flip horizontal, offset -2 tiles Y), reflets de visiteurs (offset +12px Y, flip horizontal), bonus +50% sur pièces collectées dans le rayon. Feature cosmétique/scoring, zéro impact physique (pas de `body`, pas de `area` collidable). Objectif : plus de richesse visuelle + incitation à placer des miroirs près des rails à pièces.

## 2. Fichiers impactés

- `/Users/mike/Work/milan project/src/constants.js` — lignes 30-35 (`TILE_CODE` ajouter `mirror:"Z"`... conflit avec `rail_loop:"Z"`, utiliser **`mirror:"J"`** ), lignes 42-61 (`TOOLBAR_ORDER` insérer après `magnet`).
- `/Users/mike/Work/milan project/src/tiers.js` — ligne 55 (tier 4 `unlocks: ["magnet","bridge","mirror"]`) OU ligne 67 (tier 5). **Décision : tier 4** (après magnet qui est déjà tier 4) pour que la mécanique soit débloquée avec magnet.
- `/Users/mike/Work/milan project/src/hud.js` — ligne 8-13 (`TOOL_ICONS` ajouter `mirror: "🪞"`).
- `/Users/mike/Work/milan project/src/tiles.js` — insérer nouvelle branche `else if (type === "mirror")` vers ligne 344 (après `magnet`). Placement visuel uniquement, PAS de `k.area()` (évite collision).
- `/Users/mike/Work/milan project/src/wagons.js` — hook dans `wagon.onUpdate` vers ligne 410 (boucle principale) : détection proximité miroir → gestion ghost. Nouveau helper `createGhostWagon(wagon, mirrorTile)` en haut du module (après `drawWagonBody`, vers ligne 103). Modifier `collectCoin` lignes 1360-1387 pour bonus x1.5 si miroir dans le rayon.
- `/Users/mike/Work/milan project/src/visitor.js` — dans `v.onUpdate` vers ligne 60 : check proximité miroir → spawn/cleanup reflet. Nouveau helper `createVisitorReflection(v, mirrorTile)` en haut de la fonction.
- `/Users/mike/Work/milan project/src/gc.js` — vérifier que tag `"ghost-mirror"` est capé via un passage GC périodique (ou auto-destroy via lifespan).

## 3. Comportement attendu

1. Le joueur débloque la tuile Miroir au tier 4 (avec magnet et bridge).
2. Cliquer sur le bouton Miroir (ou touche `M`... conflit avec magnet `A`, donc **touche `J`**) puis poser sur la grille crée une tuile visuelle : rectangle TILE×TILE gradient bleu→violet, 3 petites étoiles (4px) qui tournent autour du centre, effet d'ondulation via `sin(k.time()*3)` sur l'opacité interne.
3. Quand un wagon passe dans un rayon de 3 tiles (96 px Chebyshev) autour du miroir, un fantôme apparaît : copie des parts du wagon, `opacity 0.5`, `scale.x = -1` (flip horizontal), offset `y - 2*TILE` (64px au-dessus), et suit le wagon frame par frame.
4. Quand le wagon sort du rayon, le fantôme disparaît dans une anim vapeur (6 particules `steam` blanches montantes, lifespan 0.6s).
5. Même logique pour les visiteurs : reflet translucide (opacity 0.5, flip horizontal) décalé de +12px Y, marche à côté. Si `v.isSkeleton` devient `true`, le reflet se transforme aussi après 0.3s (changement de sprite vers `skeleton`).
6. Quand une pièce est collectée à moins de 3 tiles d'un miroir, gain × 1.5 (au lieu de +1 → +1.5 pour le compteur `gameState.coins`, ou +50 bonus score), popup violette "✨ MIROIR x1.5" et 8 particules violettes.
7. Si le miroir est effacé (gomme), tous ses fantômes/reflets rattachés sont détruits immédiatement.
8. Cap global : max **30** entités `"ghost-mirror"` simultanées. Au-delà, pas de nouveau spawn (simple guard `k.get("ghost-mirror").length < 30`).
9. Plusieurs miroirs qui se chevauchent : **pas d'empilement** — un wagon a au plus UN fantôme actif (on garde le miroir le plus proche via `wagon._mirrorAnchor`).
10. Le miroir n'a pas de collision (traverse librement les wagons/visiteurs).

## 4. Pseudo-code des fixes

### 4a. `constants.js` — TILE_CODE + TOOLBAR_ORDER

```js
export const TILE_CODE = {
  lava: "L", water: "W", rail: "R", rail_up: "U", rail_down: "D",
  coin: "C", boost: "B", trampoline: "T", fan: "F", portal: "P",
  ice: "I", magnet: "M", bridge: "N", wheel: "Y", rail_loop: "Z",
  ground: "Q", tunnel: "X", mirror: "J",
};

export const TOOLBAR_ORDER = [
  // ... inchangé jusqu'à magnet ...
  { tool: "magnet", key: "A", label: "Aimant" },
  { tool: "mirror", key: "J", label: "Miroir" },   // NEW
  { tool: "bridge", key: "V", label: "Pont" },
  // ...
];
```

### 4b. `tiles.js` — branche `mirror` (insérée après `magnet`, vers ligne 344)

```js
} else if (type === "mirror") {
  const x = col * TILE, y = row * TILE;
  const t = k.add([
    k.rect(TILE, TILE),
    k.pos(x, y),
    k.color(k.rgb(80, 100, 220)),
    k.outline(2, k.rgb(180, 140, 240)),
    k.z(1),
    "tile",
    "mirror",
    { gridCol: col, gridRow: row, tileType: "mirror", extras: [] },
  ]);
  // Gradient overlay via onDraw (moins d'entités)
  t.onDraw(() => {
    const wob = 0.5 + 0.5 * Math.sin(k.time() * 3);
    k.drawRect({
      pos: k.vec2(2, 2), width: TILE - 4, height: TILE - 4,
      color: k.rgb(160, 120, 230), opacity: 0.4 + wob * 0.2,
    });
    for (let i = 0; i < 3; i++) {
      const ang = k.time() * 2 + i * (Math.PI * 2 / 3);
      const rr = TILE * 0.45;
      k.drawRect({
        pos: k.vec2(TILE/2 + Math.cos(ang)*rr - 2, TILE/2 + Math.sin(ang)*rr - 2),
        width: 4, height: 4, color: k.rgb(255, 240, 180),
      });
    }
  });
  tileMap.set(key, t);
}
```

### 4c. `wagons.js` — helper `createGhostWagon` (après `drawWagonBody`, ligne ~103)

```js
function createGhostWagon(wagon, mirrorTile) {
  if (k.get("ghost-mirror").length >= 30) return null;
  const offY = -2 * TILE;
  const ghostParts = [];
  for (const p of wagon.parts || []) {
    if (!p?.exists?.()) continue;
    const g = k.add([
      ...("width" in p ? [k.rect(p.width, p.height)] : [k.circle(p.radius || 6)]),
      k.pos(p.pos.x, p.pos.y + offY),
      k.color(p.color || k.rgb(255,255,255)),
      k.opacity(0.5),
      k.scale(-1, 1),
      k.z(p.z ?? 3),
      "ghost-mirror",
      { _src: p, _offY: offY, _mirror: mirrorTile },
    ]);
    ghostParts.push(g);
  }
  return ghostParts;
}

function destroyGhostWagon(wagon) {
  if (!wagon._mirrorGhosts) return;
  const mx = wagon.pos.x + 30, my = wagon.pos.y;
  for (const g of wagon._mirrorGhosts) if (g?.exists?.()) k.destroy(g);
  wagon._mirrorGhosts = null;
  wagon._mirrorAnchor = null;
  // Vapeur
  for (let i = 0; i < 6; i++) {
    k.add([
      k.circle(3), k.pos(mx, my - 2*TILE),
      k.color(k.rgb(220,230,255)), k.opacity(0.7),
      k.lifespan(0.6, { fade: 0.4 }), k.z(6), "particle",
    ]);
  }
}
```

### 4d. `wagons.js` — hook dans `wagon.onUpdate` (vers ligne 410, après `wagon.move(...)`)

```js
// MIRROR detection — une fois par frame, cherche le miroir le plus proche ≤ 3 tiles
const MIRROR_R = 3 * TILE;
let nearest = null, nd = MIRROR_R;
for (const [, t] of tileMap) {
  if (t.tileType !== "mirror") continue;
  const dx = Math.abs(t.gridCol * TILE + TILE/2 - (wagon.pos.x + 30));
  const dy = Math.abs(t.gridRow * TILE + TILE/2 - (wagon.pos.y + 15));
  const d = Math.max(dx, dy); // Chebyshev, moins cher que hypot
  if (d < nd) { nd = d; nearest = t; }
}
if (nearest && !wagon._mirrorGhosts) {
  wagon._mirrorAnchor = nearest;
  wagon._mirrorGhosts = createGhostWagon(wagon, nearest);
} else if (!nearest && wagon._mirrorGhosts) {
  destroyGhostWagon(wagon);
}
// Sync position frame-par-frame
if (wagon._mirrorGhosts) {
  for (const g of wagon._mirrorGhosts) {
    if (!g?.exists?.() || !g._src?.exists?.()) continue;
    g.pos.x = g._src.pos.x;
    g.pos.y = g._src.pos.y + g._offY;
  }
}
```

### 4e. `wagons.js` — modif `collectCoin` (ligne 1360)

```js
function collectCoin(c) {
  audio.coin();
  const cx = c.pos.x, cy = c.pos.y;
  // Check miroir dans rayon 3 tiles
  let mirrorBonus = false;
  for (const [, t] of tileMap) {
    if (t.tileType !== "mirror") continue;
    const d = Math.max(
      Math.abs(t.gridCol * TILE + TILE/2 - cx),
      Math.abs(t.gridRow * TILE + TILE/2 - cy),
    );
    if (d <= 3 * TILE) { mirrorBonus = true; break; }
  }
  if (c.extras) c.extras.forEach((e) => k.destroy(e));
  tileMap.delete(gridKey(c.gridCol, c.gridRow));
  k.destroy(c);
  gameState.coins += mirrorBonus ? 2 : 1; // +1 extra = x2 compteur = x1.5 score via COMBO
  if (mirrorBonus) {
    gameState.score += 50;
    showPopup(cx, cy - 20, "MIROIR x1.5", k.rgb(200, 120, 240), 18);
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      k.add([
        k.rect(3,3), k.pos(cx, cy),
        k.color(k.rgb(200,120,240)), k.opacity(1),
        k.lifespan(0.5, { fade: 0.3 }), k.z(15),
        "particle-grav",
        { vx: Math.cos(a)*100, vy: Math.sin(a)*100 - 40, grav: 250 },
      ]);
    }
  }
  registerCoin(cx, cy);
  // ... reste identique
}
```

### 4f. `visitor.js` — helper + hook dans `v.onUpdate`

```js
// Helper (tout en haut du onUpdate, après le _grounded block)
const MIRROR_R_V = 3 * TILE;
let mNear = null;
for (const [, tt] of tileMap) {
  if (tt.tileType !== "mirror") continue;
  const d = Math.max(
    Math.abs(tt.gridCol * TILE + TILE/2 - (v.pos.x + 14)),
    Math.abs(tt.gridRow * TILE + TILE/2 - (v.pos.y + 20)),
  );
  if (d <= MIRROR_R_V) { mNear = tt; break; }
}
if (mNear && !v._reflection && k.get("ghost-mirror").length < 30) {
  v._reflection = k.add([
    k.sprite(v.isSkeleton ? "skeleton" : "human"),
    k.pos(v.pos.x, v.pos.y + 12),
    k.opacity(0.5), k.scale(-1, 1), k.z(4),
    k.color(k.rgb(v.tint[0], v.tint[1], v.tint[2])),
    "ghost-mirror",
  ]);
}
if (v._reflection) {
  if (!mNear) {
    k.destroy(v._reflection); v._reflection = null;
  } else {
    v._reflection.pos.x = v.pos.x;
    v._reflection.pos.y = v.pos.y + 12;
    // Sync squelette avec délai 0.3s
    if (v.isSkeleton && !v._reflSkel) {
      v._reflSkelAt = k.time() + 0.3;
      v._reflSkel = "pending";
    }
    if (v._reflSkel === "pending" && k.time() >= v._reflSkelAt) {
      v._reflection.sprite = "skeleton";
      v._reflSkel = "done";
    }
  }
}
```

### 4g. Cleanup lors suppression miroir (déjà géré par `placeTile` existing extras)

Dans `placeTile` ligne 119-127, le path `if (existing)` détruit les extras. Il faut ALSO détruire tous les `"ghost-mirror"` dont `_mirror === existing`. Ajouter juste avant `k.destroy(existing)` :

```js
if (existing.tileType === "mirror") {
  for (const g of k.get("ghost-mirror")) {
    if (g._mirror === existing) k.destroy(g);
  }
  // Reset _mirrorGhosts sur wagons concernés
  for (const w of k.get("wagon")) {
    if (w._mirrorAnchor === existing) { w._mirrorGhosts = null; w._mirrorAnchor = null; }
  }
  for (const v of k.get("visitor")) {
    if (v._reflection && !v._reflection.exists()) v._reflection = null;
  }
}
```

## 5. Critères de succès

- [ ] `wc -l src/tiles.js` reste ≤ 470 lignes (ajout ~35 lignes).
- [ ] `wc -l src/wagons.js` ≤ 830 (ajout ~50 lignes).
- [ ] `wc -l src/visitor.js` ≤ +30 lignes.
- [ ] `k.get("ghost-mirror").length` ≤ 30 à tout instant (vérif via console).
- [ ] Spawner 3 wagons + poser 2 miroirs + 5 visiteurs → FPS ≥ 55 (via tick profiler du CLAUDE.md).
- [ ] Effacer un miroir → tous les fantômes liés disparaissent immédiatement (0 entité orpheline).
- [ ] Pièce collectée proche d'un miroir → popup "MIROIR x1.5" + score +50 bonus.
- [ ] Visiteur qui entre dans lave tout en étant dans rayon miroir → reflet devient squelette après 0.3s.
- [ ] Aucune erreur console (tag collision KAPLAY, Duplicate component, TDZ).
- [ ] Export/import save avec `mirror` → tuile restaurée (code "J" dans serializer roundtrip).
- [ ] Tier 4 : bouton Miroir débloqué ; tiers 0-3 : bouton grisé (locked).
- [ ] 6 commits atomiques, CI deploy vert.

## 6. Effort estimé

**6 commits atomiques**, ordre recommandé :

1. `feat(constants): add mirror to TILE_CODE + TOOLBAR_ORDER + tier 4 unlock`
2. `feat(tiles): placeTile type="mirror" visual (gradient + stars + wobble)`
3. `feat(hud): add mirror icon to TOOL_ICONS`
4. `feat(wagons): createGhostWagon + onUpdate mirror detection + cleanup`
5. `feat(visitor): reflection ghost + skeleton sync delay`
6. `feat(wagons): collectCoin x1.5 bonus popup MIROIR near mirror`

Total estimé : **2h30-3h** (incluant tests manuels).

## 7. Risques & mitigations

- **Perf `k.get("ghost-mirror")` par frame** : évité grâce au guard cap 30 + Chebyshev `Math.max` (pas `hypot`). Si lenteur, cacher un compteur via `k.onAdd("ghost-mirror", ...)` comme pour `particle`.
- **Collision tag / property `frame`** (piège KAPLAY) : on n'utilise pas `frame`. OK.
- **`k.Circle` pour area** : on n'utilise pas d'area sur le miroir (pas nécessaire, détection via distance manuelle).
- **TDZ WAGON_THEMES** : non concerné (pas de changement là).
- **Touche `J` conflit** : vérifier `grep "isKeyPressed.*J"` avant commit — Toad utilise FHTG, Pikachu JLI → **CONFLIT avec Pikachu**. Solution fallback : utiliser touche `M` (pas présente dans TOOLBAR_ORDER actuel, vérifier aussi que pas shortcut global). Si M libre → utiliser M. Sinon touche shift-cliquée uniquement (pas de raccourci clavier global, juste bouton toolbar). **Décision par défaut : pas de raccourci clavier, `key: ""` dans TOOLBAR_ORDER** pour éviter tout conflit.
- **Serializer backward compat** : anciens codes save sans "J" → `CODE_TILE["J"]` renvoie `undefined`, le loader doit ignorer (vérifier `if (!CODE_TILE[c]) continue`).
- **Ghost wagon sync avec royalDecos/passengerEntities** : la spec actuelle ne clone QUE `wagon.parts`. Les passagers et décos royales ne sont PAS reflétés (assumé OK, simplification). Si user demande, étendre le helper.
- **Mirror detection pendant loop/tunnel/spectral** : le hook est dans la boucle principale, après early-return `if (wagon.inLoop) return;`. Donc pas de ghost pendant loop (bien, évite rotation chaotique).
- **Multi-miroirs chevauchants** : `nearest` garanti UN seul anchor, pas d'empilement.

## 8. Tests manuels (scénarios à valider)

1. **Scénario basique** : tier 4 débloqué, poser rail + miroir à 2 tiles au-dessus, spawner wagon (X). Vérifier : fantôme apparaît, suit, disparaît en vapeur quand wagon sort.
2. **Scénario pièce bonus** : poser miroir + pièce à 1 tile d'écart + rail + wagon. Quand wagon collecte, popup "MIROIR x1.5" + 50 points + particules violettes.
3. **Scénario visiteur squelette** : poser miroir au sol + lava 2 tiles à droite + laisser visiteur marcher. Quand entre rayon → reflet apparaît. Touche lave → skeleton. Reflet devient squelette après ~0.3s.
4. **Scénario gomme** : poser miroir, spawner wagon (ghost visible), effacer miroir avec gomme. Fantôme disparaît instantanément, pas d'orphelin (`k.get("ghost-mirror").length === 0`).
5. **Scénario stress** : poser 5 miroirs alignés, spawner 3 wagons + 10 visiteurs. Vérifier cap 30 ghosts respecté, FPS ≥ 55.

import { TILE, COLS, ROWS, GROUND_ROW, WORLD_COLS } from "./constants.js";

export function createGroundSystem({ k, gameState, audio }) {
  // single global handler for all ground-particle objects
  k.onUpdate("ground-particle", (pt) => {
    pt.pos.x += pt.vx * k.dt();
    pt.pos.y += pt.vy * k.dt();
    pt.vy += 200 * k.dt();
    pt.opacity -= k.dt() / pt.life;
    if (pt.opacity <= 0) k.destroy(pt);
  });

  const groundMap = new Map();
  // World now extends from -WORLD_COLS to WORLD_COLS (player can build left)
  for (let col = -WORLD_COLS; col < WORLD_COLS; col++) {
    groundMap.set(col, { dug: new Set() });
  }

  // per-column collider lists: groundColliders[col] = array of ent
  const groundColliders = new Map();

  function rebuildGroundColliderForCol(col) {
    const existing = groundColliders.get(col);
    if (existing) {
      for (const e of existing) {
        if (e.exists()) k.destroy(e);
      }
    }
    const dug = groundMap.get(col).dug;
    const colliders = [];

    // Build contiguous segments of non-dug rows to minimise entity count
    let segStart = null;
    for (let row = GROUND_ROW; row <= ROWS; row++) {
      const solid = row < ROWS && !dug.has(row);
      if (solid && segStart === null) {
        segStart = row;
      } else if (!solid && segStart !== null) {
        const segLen = row - segStart;
        const c = k.add([
          k.rect(TILE, segLen * TILE),
          k.pos(col * TILE, segStart * TILE),
          k.area(),
          k.body({ isStatic: true }),
          k.opacity(0),
          "ground",
        ]);
        colliders.push(c);
        segStart = null;
      }
    }
    groundColliders.set(col, colliders);
  }

  function initColliders() {
    for (let col = -WORLD_COLS; col < WORLD_COLS; col++) {
      rebuildGroundColliderForCol(col);
    }
  }

  function digGround(col, row) {
    if (row < GROUND_ROW || row >= ROWS) return false;
    const entry = groundMap.get(col);
    if (!entry || entry.dug.has(row)) return false;
    entry.dug.add(row);
    rebuildGroundColliderForCol(col);

    // brown dust particles
    for (let i = 0; i < 8; i++) {
      const px = col * TILE + TILE / 2 + (Math.random() - 0.5) * TILE;
      const py = row * TILE + TILE / 2 + (Math.random() - 0.5) * TILE;
      const vx = (Math.random() - 0.5) * 120;
      const vy = -60 - Math.random() * 80;
      k.add([
        k.rect(4, 4),
        k.pos(px, py),
        k.color(k.rgb(120 + Math.random() * 40, 80 + Math.random() * 20, 40)),
        k.opacity(1),
        k.z(30),
        "ground-particle",
        { vx, vy, life: 0.5 + Math.random() * 0.3 },
      ]);
    }

    audio.crack ? audio.crack() : audio.place();
    gameState.score += 2;
    return true;
  }

  function fillGround(col, row) {
    if (row < GROUND_ROW || row >= ROWS) return false;
    const entry = groundMap.get(col);
    if (!entry || !entry.dug.has(row)) return false;
    entry.dug.delete(row);
    rebuildGroundColliderForCol(col);
    audio.place();
    gameState.score += 1;
    return true;
  }

  function isDug(col, row) {
    const entry = groundMap.get(col);
    return entry ? entry.dug.has(row) : false;
  }

  function getDugMap() {
    const result = [];
    for (const [col, { dug }] of groundMap) {
      for (const row of dug) {
        result.push([col, row]);
      }
    }
    return result;
  }

  function loadDugMap(pairs) {
    // reset first
    for (const [, entry] of groundMap) entry.dug.clear();
    for (const [col, row] of pairs) {
      const entry = groundMap.get(col);
      if (entry && row >= GROUND_ROW && row < ROWS) entry.dug.add(row);
    }
    for (let col = -WORLD_COLS; col < WORLD_COLS; col++) {
      rebuildGroundColliderForCol(col);
    }
  }

  // Draw function: call inside a k.add draw() override
  function drawGround() {
    for (let col = -WORLD_COLS; col < WORLD_COLS; col++) {
      const dug = groundMap.get(col).dug;
      let drewTop = false;
      for (let row = GROUND_ROW; row < ROWS; row++) {
        if (dug.has(row)) {
          drewTop = false;
          continue;
        }
        if (!drewTop) {
          k.drawSprite({ sprite: "ground_top", pos: k.vec2(col * TILE, row * TILE) });
          drewTop = true;
        } else {
          k.drawSprite({ sprite: "ground", pos: k.vec2(col * TILE, row * TILE) });
        }
      }
    }
  }

  return { initColliders, digGround, fillGround, isDug, getDugMap, loadDugMap, drawGround };
}

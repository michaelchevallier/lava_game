import { TILE, gridKey } from "./constants.js";

export function findWaterPools(tileMap) {
  const waterTiles = [];
  for (const [, t] of tileMap) {
    if (t.tileType === "water") waterTiles.push(t);
  }
  if (waterTiles.length === 0) return [];

  const visited = new Set();
  const pools = [];

  for (const start of waterTiles) {
    const key = gridKey(start.gridCol, start.gridRow);
    if (visited.has(key)) continue;

    const group = [];
    const queue = [start];
    while (queue.length > 0) {
      const cur = queue.pop();
      const k = gridKey(cur.gridCol, cur.gridRow);
      if (visited.has(k)) continue;
      visited.add(k);
      group.push(cur);
      const neighbors = [
        [cur.gridCol - 1, cur.gridRow],
        [cur.gridCol + 1, cur.gridRow],
        [cur.gridCol, cur.gridRow - 1],
        [cur.gridCol, cur.gridRow + 1],
      ];
      for (const [nc, nr] of neighbors) {
        const nkey = gridKey(nc, nr);
        if (visited.has(nkey)) continue;
        const n = tileMap.get(nkey);
        if (n && n.tileType === "water") queue.push(n);
      }
    }

    if (group.length < 3) continue;

    let minCol = Infinity, maxCol = -Infinity;
    let minRow = Infinity, maxRow = -Infinity;
    for (const t of group) {
      if (t.gridCol < minCol) minCol = t.gridCol;
      if (t.gridCol > maxCol) maxCol = t.gridCol;
      if (t.gridRow < minRow) minRow = t.gridRow;
      if (t.gridRow > maxRow) maxRow = t.gridRow;
    }

    pools.push({
      tiles: group,
      bbox: {
        x: minCol * TILE,
        y: minRow * TILE,
        w: (maxCol - minCol + 1) * TILE,
        h: (maxRow - minRow + 1) * TILE,
        minCol,
        maxCol,
        minRow,
        maxRow,
      },
    });
  }

  return pools;
}

export function createDuckSystem({ k, tileMap, gameState, audio, showPopup }) {
  function spawnFeathers(x, y) {
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6 + (Math.random() - 0.5) * 0.6;
      const sp = 60 + Math.random() * 60;
      const p = k.add([
        k.rect(5, 2),
        k.pos(x, y),
        k.anchor("center"),
        k.color(k.rgb(250, 250, 250)),
        k.opacity(0.9),
        k.rotate((a * 180) / Math.PI),
        k.lifespan(0.9, { fade: 0.6 }),
        k.z(12),
        { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30 },
      ]);
      p.onUpdate(() => {
        p.pos.x += p.vx * k.dt();
        p.pos.y += p.vy * k.dt();
        p.vy += 120 * k.dt();
        p.angle += 200 * k.dt();
      });
    }
  }

  function drawDuck(duck) {
    const bodyColor = duck.gold ? k.rgb(255, 215, 0) : k.rgb(255, 230, 80);
    const billColor = duck.gold ? k.rgb(200, 120, 0) : k.rgb(255, 140, 0);

    k.add([
      k.pos(duck.pos.x, duck.pos.y),
      k.z(10),
      {
        draw() {
          if (!duck.exists()) return;
          k.drawRect({
            pos: k.vec2(duck.pos.x, duck.pos.y),
            width: 18,
            height: 14,
            color: bodyColor,
            outline: { color: k.rgb(180, 130, 0), width: 1 },
          });
          const billX = duck.vx >= 0 ? duck.pos.x + 16 : duck.pos.x - 5;
          k.drawTriangle({
            p1: k.vec2(billX, duck.pos.y + 4),
            p2: k.vec2(billX + (duck.vx >= 0 ? 5 : -5), duck.pos.y + 7),
            p3: k.vec2(billX, duck.pos.y + 10),
            color: billColor,
          });
          const eyeX = duck.vx >= 0 ? duck.pos.x + 13 : duck.pos.x + 2;
          k.drawCircle({
            pos: k.vec2(eyeX, duck.pos.y + 4),
            radius: 2,
            color: k.rgb(20, 20, 20),
          });
        },
      },
    ]);
  }

  function maybeSpawnDuck(pool) {
    if (k.get("duck").length >= 8) return;

    const ducksInPool = k.get("duck").filter(
      (d) =>
        d.pos.x >= pool.bbox.x - 4 &&
        d.pos.x <= pool.bbox.x + pool.bbox.w + 4 &&
        d.pos.y >= pool.bbox.y - 4 &&
        d.pos.y <= pool.bbox.y + pool.bbox.h + 4,
    );
    if (ducksInPool.length >= 4) return;

    const gold = Math.random() < 0.1;
    const bodyColor = gold ? k.rgb(255, 215, 0) : k.rgb(255, 230, 80);
    const vx = (Math.random() - 0.5) * 50;

    const spawnTile = pool.tiles[Math.floor(Math.random() * pool.tiles.length)];
    const px = spawnTile.gridCol * TILE + (TILE / 2 - 9);
    const py = spawnTile.gridRow * TILE + (TILE / 2 - 7);

    const duck = k.add([
      k.rect(18, 14),
      k.pos(px, py),
      k.anchor("topleft"),
      k.color(bodyColor),
      k.area(),
      k.z(10),
      "duck",
      {
        vx,
        gold,
        life: 0,
        poolBbox: pool.bbox,
        _lastBillDir: vx >= 0,
      },
    ]);

    const billColor = gold ? k.rgb(200, 120, 0) : k.rgb(255, 140, 0);

    const bill = k.add([
      k.rect(5, 4),
      k.pos(px + 16, py + 4),
      k.color(billColor),
      k.z(11),
      "duck-part",
    ]);

    const eye = k.add([
      k.circle(2),
      k.pos(px + 14, py + 4),
      k.color(k.rgb(20, 20, 20)),
      k.z(12),
      "duck-part",
    ]);

    duck._bill = bill;
    duck._eye = eye;

    duck.onUpdate(() => {
      duck.life += k.dt();

      duck.pos.x += duck.vx * k.dt();

      const leftEdge = duck.poolBbox.x;
      const rightEdge = duck.poolBbox.x + duck.poolBbox.w - 18;

      if (duck.pos.x < leftEdge) {
        duck.pos.x = leftEdge;
        duck.vx = Math.abs(duck.vx) + Math.random() * 5;
      } else if (duck.pos.x > rightEdge) {
        duck.pos.x = rightEdge;
        duck.vx = -(Math.abs(duck.vx) + Math.random() * 5);
      }

      const facingRight = duck.vx >= 0;
      if (facingRight !== duck._lastBillDir) {
        duck._lastBillDir = facingRight;
      }

      const billX = facingRight ? duck.pos.x + 16 : duck.pos.x - 5;
      if (duck._bill && duck._bill.exists()) {
        duck._bill.pos.x = billX;
        duck._bill.pos.y = duck.pos.y + 4;
      }
      const eyeX = facingRight ? duck.pos.x + 13 : duck.pos.x + 2;
      if (duck._eye && duck._eye.exists()) {
        duck._eye.pos.x = eyeX;
        duck._eye.pos.y = duck.pos.y + 4;
      }

      if (duck.life > 12) {
        if (duck._bill && duck._bill.exists()) k.destroy(duck._bill);
        if (duck._eye && duck._eye.exists()) k.destroy(duck._eye);
        k.destroy(duck);
      }
    });

    duck.onClick(() => {
      if (!duck.exists()) return;
      const pts = duck.gold ? 200 : 30;
      gameState.score += pts;
      audio.coin();
      if (duck.gold) {
        showPopup(duck.pos.x + 9, duck.pos.y - 10, "JACKPOT! +200", k.rgb(255, 215, 0), 26);
        window.__juice?.dirShake(0, -1, 4, 0.15);
        window.__spectres?.unlock(14);
      } else {
        showPopup(duck.pos.x + 9, duck.pos.y - 10, "QUACK! +30", k.rgb(255, 230, 80), 20);
      }
      gameState._ducksCaught = (gameState._ducksCaught || 0) + 1;
      if (gameState._ducksCaught >= 10) window.__spectres?.unlock(13);
      spawnFeathers(duck.pos.x + 9, duck.pos.y + 7);
      if (duck._bill && duck._bill.exists()) k.destroy(duck._bill);
      if (duck._eye && duck._eye.exists()) k.destroy(duck._eye);
      k.destroy(duck);
    });
  }

  function startDuckLoop() {
    k.loop(2, () => {
      const pools = findWaterPools(tileMap);
      if (pools.length === 0) return;
      for (const pool of pools) {
        if (Math.random() < 0.6) maybeSpawnDuck(pool);
      }
    });
  }

  return { startDuckLoop, findWaterPools: () => findWaterPools(tileMap) };
}

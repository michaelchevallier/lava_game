// Combos de tuiles déclenchant des mini-jeux spontanés
// - Chamboule-Tout : 3 tuiles ground empilées verticalement (même col, rows consécutives, rien au-dessus)
//   → 3 boîtes apparaissent au sommet, clic pour renverser +20pts, triple <3s = bonus +100pts
// - Roue de Fortune : 5 tuiles coin en + (centre + 4 cardinaux)
//   → spawn d'une roue au-dessus, clic pour spin + récompense aléatoire
// - Maison Hantée : 4 tuiles ground en carré 2×2
//   → fantômes flottants au-dessus, wagon les touche = +25 pts

import { TILE, WORLD_WIDTH, gridKey } from "./constants.js";

export function createMinigames({ k, tileMap, gameState, audio, showPopup }) {
  const chamboules = new Map(); // key = "col,rowTop" → { cans: [e1,e2,e3], lastHitAt, streakStart }
  const roulettes = new Map();  // key = "col,row" → { wheel, spinning, spinStart, result, consumed }
  const hauntedHouses = new Map(); // key = "col,row" → { ghosts: [], lastSpawnAt }
  const MAX_HOUSES = 2;
  const MAX_GHOSTS_PER_HOUSE = 3;
  const GHOST_RESPAWN_INTERVAL = 6;

  function detectChamboule() {
    for (const [, t] of tileMap) {
      if (t.tileType !== "ground") continue;
      const below1 = tileMap.get(gridKey(t.gridCol, t.gridRow + 1));
      const below2 = tileMap.get(gridKey(t.gridCol, t.gridRow + 2));
      const above = tileMap.get(gridKey(t.gridCol, t.gridRow - 1));
      if (below1?.tileType === "ground" && below2?.tileType === "ground" && !above) {
        const key = `${t.gridCol},${t.gridRow}`;
        if (!chamboules.has(key)) spawnChamboule(t.gridCol, t.gridRow, key);
      }
    }
    for (const [key, ch] of chamboules) {
      const [col, row] = key.split(",").map(Number);
      const top = tileMap.get(gridKey(col, row));
      const mid = tileMap.get(gridKey(col, row + 1));
      const bot = tileMap.get(gridKey(col, row + 2));
      if (!top || !mid || !bot || top.tileType !== "ground" || mid.tileType !== "ground" || bot.tileType !== "ground") {
        despawnChamboule(key);
      }
    }
  }

  function spawnChamboule(col, row, key) {
    const cans = [];
    const cx = col * TILE + TILE / 2;
    const topY = row * TILE - 14;
    const CAN_COLORS = [k.rgb(220, 80, 80), k.rgb(80, 160, 220), k.rgb(240, 200, 80)];
    for (let i = 0; i < 3; i++) {
      const dx = (i - 1) * 8;
      const canBody = k.add([
        k.rect(12, 14),
        k.pos(cx + dx, topY - i * 2),
        k.anchor("center"),
        k.color(CAN_COLORS[i]),
        k.outline(2, k.rgb(40, 20, 10)),
        k.area({ shape: new k.Rect(k.vec2(-6, -7), 12, 14) }),
        k.z(6),
        "chamboule-can",
        { chKey: key, canIdx: i, knockedAt: 0 },
      ]);
      const band = k.add([
        k.rect(12, 3),
        k.pos(cx + dx, topY - i * 2 + 1),
        k.anchor("center"),
        k.color(k.rgb(255, 240, 180)),
        k.z(7),
      ]);
      canBody.band = band;
      cans.push(canBody);
    }
    // Striped backdrop (tent)
    const tent = k.add([
      k.rect(TILE + 14, 6),
      k.pos(cx, row * TILE - 26),
      k.anchor("center"),
      k.color(k.rgb(220, 80, 80)),
      k.outline(1, k.rgb(40, 20, 10)),
      k.z(5),
    ]);
    chamboules.set(key, { cans, streakStart: 0, hits: 0, tent, col, row });
  }

  function despawnChamboule(key) {
    const ch = chamboules.get(key);
    if (!ch) return;
    for (const c of ch.cans) {
      if (c.band?.exists()) k.destroy(c.band);
      if (c.exists?.()) k.destroy(c);
    }
    if (ch.tent?.exists?.()) k.destroy(ch.tent);
    chamboules.delete(key);
  }

  function hitCan(can) {
    if (can.knockedAt > 0) return;
    can.knockedAt = k.time();
    const ch = chamboules.get(can.chKey);
    if (!ch) return;
    if (ch.hits === 0) ch.streakStart = k.time();
    ch.hits++;
    gameState.score += 20;
    audio.coin?.();
    showPopup(can.pos.x, can.pos.y - 12, "+20", k.rgb(255, 220, 80), 16);
    can.angle = (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 40);
    can.pos.y += 8;
    if (can.band?.exists?.()) {
      can.band.angle = can.angle;
      can.band.pos.y = can.pos.y + 1;
    }
    // Dust particles
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6;
      k.add([
        k.circle(2),
        k.pos(can.pos.x, can.pos.y),
        k.color(k.rgb(200, 180, 140)),
        k.opacity(0.8),
        k.lifespan(0.3, { fade: 0.2 }),
        k.z(9),
        "particle",
        { vx: Math.cos(a) * 50, vy: Math.sin(a) * 50 - 20 },
      ]);
    }
    if (ch.hits >= 3 && k.time() - ch.streakStart < 3) {
      gameState.score += 100;
      window.__spectres?.unlock(27);
      showPopup(can.pos.x, can.pos.y - 34, "CHAMBOULE ! +100", k.rgb(255, 120, 40), 24);
      audio.combo?.();
      window.__juice?.dirShake?.(0, 1, 10, 0.25);
      for (let i = 0; i < 24; i++) {
        const a = (Math.PI * 2 * i) / 24;
        k.add([
          k.circle(3),
          k.pos(can.pos.x, can.pos.y - 10),
          k.color(k.rgb(255, 120 + Math.random() * 120, 60)),
          k.opacity(1),
          k.lifespan(0.7, { fade: 0.5 }),
          k.z(20),
          "particle",
          { vx: Math.cos(a) * 120, vy: Math.sin(a) * 120 - 40 },
        ]);
      }
    }
    // Respawn whole stand 8s après premier hit
    if (ch.hits === 1) {
      k.wait(8, () => {
        const alive = chamboules.get(can.chKey);
        if (!alive) return;
        despawnChamboule(can.chKey);
        // Re-spawn will happen next detectChamboule tick automatically
      });
    }
  }

  function detectRoulette() {
    for (const [, t] of tileMap) {
      if (t.tileType !== "coin") continue;
      const n = tileMap.get(gridKey(t.gridCol, t.gridRow - 1));
      const s = tileMap.get(gridKey(t.gridCol, t.gridRow + 1));
      const e = tileMap.get(gridKey(t.gridCol + 1, t.gridRow));
      const w = tileMap.get(gridKey(t.gridCol - 1, t.gridRow));
      if (n?.tileType === "coin" && s?.tileType === "coin" && e?.tileType === "coin" && w?.tileType === "coin") {
        const key = `${t.gridCol},${t.gridRow}`;
        if (!roulettes.has(key)) spawnRoulette(t.gridCol, t.gridRow, key);
      }
    }
    for (const [key, ro] of roulettes) {
      const [col, row] = key.split(",").map(Number);
      const center = tileMap.get(gridKey(col, row));
      const n = tileMap.get(gridKey(col, row - 1));
      const s = tileMap.get(gridKey(col, row + 1));
      const e = tileMap.get(gridKey(col + 1, row));
      const w = tileMap.get(gridKey(col - 1, row));
      const stillValid = center?.tileType === "coin" && n?.tileType === "coin" && s?.tileType === "coin" && e?.tileType === "coin" && w?.tileType === "coin";
      if (!stillValid || ro.consumed) despawnRoulette(key);
    }
  }

  const ROULETTE_REWARDS = [
    { pts: 10,  label: "+10",   col: [200, 200, 200] },
    { pts: 30,  label: "+30",   col: [120, 220, 120] },
    { pts: 100, label: "+100",  col: [80, 180, 255] },
    { pts: 200, label: "+200",  col: [255, 180, 40] },
    { pts: 500, label: "JACKPOT ! +500", col: [255, 60, 200] },
  ];
  const ROULETTE_WEIGHTS = [40, 30, 18, 10, 2]; // % par tier

  function pickRoulette() {
    const r = Math.random() * 100;
    let acc = 0;
    for (let i = 0; i < ROULETTE_WEIGHTS.length; i++) {
      acc += ROULETTE_WEIGHTS[i];
      if (r < acc) return ROULETTE_REWARDS[i];
    }
    return ROULETTE_REWARDS[0];
  }

  function spawnRoulette(col, row, key) {
    const cx = col * TILE + TILE / 2;
    const cy = row * TILE + TILE / 2;
    const wheel = k.add([
      k.circle(TILE * 0.8),
      k.pos(cx, cy - TILE * 1.6),
      k.anchor("center"),
      k.color(k.rgb(255, 240, 180)),
      k.outline(3, k.rgb(180, 80, 40)),
      k.area({ shape: new k.Rect(k.vec2(-TILE * 0.8, -TILE * 0.8), TILE * 1.6, TILE * 1.6) }),
      k.z(10),
      "roulette-wheel",
      { roKey: key, spinning: false, spinStart: 0, result: null },
    ]);
    // Decorative rays
    const rays = [];
    const RAY_COLS = [k.rgb(220, 80, 80), k.rgb(80, 180, 220), k.rgb(255, 200, 80), k.rgb(180, 100, 220), k.rgb(120, 220, 120), k.rgb(255, 120, 40), k.rgb(80, 80, 200), k.rgb(255, 80, 180)];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = k.add([
        k.rect(TILE * 0.7, 3),
        k.pos(cx, cy - TILE * 1.6),
        k.anchor("left"),
        k.color(RAY_COLS[i]),
        k.rotate(a * 180 / Math.PI),
        k.z(11),
      ]);
      rays.push(r);
    }
    // Pin
    const pin = k.add([
      k.rect(4, 10),
      k.pos(cx, cy - TILE * 1.6 - TILE * 0.85),
      k.anchor("center"),
      k.color(k.rgb(30, 20, 10)),
      k.z(12),
    ]);
    roulettes.set(key, { wheel, rays, pin, angle: 0, spinning: false, spinStart: 0, result: null, consumed: false });
  }

  function despawnRoulette(key) {
    const ro = roulettes.get(key);
    if (!ro) return;
    if (ro.wheel?.exists?.()) k.destroy(ro.wheel);
    for (const r of ro.rays || []) if (r?.exists?.()) k.destroy(r);
    if (ro.pin?.exists?.()) k.destroy(ro.pin);
    roulettes.delete(key);
  }

  function clickRoulette(wheel) {
    const ro = roulettes.get(wheel.roKey);
    if (!ro || ro.spinning || ro.consumed) return;
    ro.spinning = true;
    ro.spinStart = k.time();
    ro.result = pickRoulette();
    audio.boost?.();
    showPopup(wheel.pos.x, wheel.pos.y - 40, "SPIN !", k.rgb(255, 220, 80), 20);
  }

  function updateRoulettes() {
    for (const [, ro] of roulettes) {
      if (!ro.spinning) continue;
      const t = k.time() - ro.spinStart;
      const eased = 1 - Math.pow(1 - Math.min(1, t / 2), 3);
      const speed = 1600 - 1580 * eased;
      ro.angle = (ro.angle + speed * k.dt()) % 360;
      if (ro.wheel?.exists?.()) ro.wheel.angle = ro.angle;
      for (let i = 0; i < ro.rays.length; i++) {
        if (!ro.rays[i]?.exists?.()) continue;
        ro.rays[i].angle = ro.angle + i * 45;
      }
      if (t >= 2 && !ro.consumed) {
        ro.consumed = true;
        ro.spinning = false;
        gameState.score += ro.result.pts;
        if (ro.result.pts >= 500) window.__spectres?.unlock(28);
        audio.combo?.();
        showPopup(ro.wheel.pos.x, ro.wheel.pos.y - 46, ro.result.label, k.rgb(ro.result.col[0], ro.result.col[1], ro.result.col[2]), 28);
        window.__juice?.dirShake?.(0, 1, 12, 0.25);
        for (let i = 0; i < 30; i++) {
          const a = (Math.PI * 2 * i) / 30;
          k.add([
            k.circle(3 + Math.random() * 3),
            k.pos(ro.wheel.pos.x, ro.wheel.pos.y),
            k.color(k.rgb(ro.result.col[0], ro.result.col[1], ro.result.col[2])),
            k.opacity(1),
            k.lifespan(1, { fade: 0.7 }),
            k.z(20),
            "particle",
            { vx: Math.cos(a) * 180, vy: Math.sin(a) * 180 - 50 },
          ]);
        }
      }
    }
  }

  // ============ MAISON HANTÉE ============

  function detectHauntedHouse() {
    // Scan pour des carrés 2×2 de ground tiles. Limite à MAX_HOUSES actives.
    for (const [, t] of tileMap) {
      if (t.tileType !== "ground") continue;
      if (hauntedHouses.size >= MAX_HOUSES) break;
      const col = t.gridCol;
      const row = t.gridRow;
      const tr = tileMap.get(gridKey(col + 1, row));
      const bl = tileMap.get(gridKey(col, row + 1));
      const br = tileMap.get(gridKey(col + 1, row + 1));
      if (tr?.tileType === "ground" && bl?.tileType === "ground" && br?.tileType === "ground") {
        const key = `${col},${row}`;
        if (!hauntedHouses.has(key)) spawnHauntedHouse(col, row, key);
      }
    }
    // Cleanup : si le carré 2×2 est cassé, despawn
    for (const [key, house] of hauntedHouses) {
      const [col, row] = key.split(",").map(Number);
      const tl = tileMap.get(gridKey(col, row));
      const tr = tileMap.get(gridKey(col + 1, row));
      const bl = tileMap.get(gridKey(col, row + 1));
      const br = tileMap.get(gridKey(col + 1, row + 1));
      const stillValid = tl?.tileType === "ground" && tr?.tileType === "ground" && bl?.tileType === "ground" && br?.tileType === "ground";
      if (!stillValid) despawnHauntedHouse(key);
    }
  }

  function spawnHauntedHouse(col, row, key) {
    const house = { ghosts: [], lastSpawnAt: 0, col, row };
    hauntedHouses.set(key, house);
    window.__spectres?.unlock(26);
  }

  function spawnGhost(house) {
    const cx = (house.col + 1) * TILE;
    const cy = house.row * TILE - 20;
    const ghost = k.add([
      k.sprite("skeleton"),
      k.pos(cx - 14, cy),
      k.opacity(0.6),
      k.area({ shape: new k.Rect(k.vec2(2, 4), 24, 40) }),
      k.z(9),
      "ghost-haunt",
      {
        houseKey: `${house.col},${house.row}`,
        bornAt: k.time(),
        baseY: cy,
        baseX: cx - 14,
      },
    ]);
    ghost.onUpdate(() => {
      const age = k.time() - ghost.bornAt;
      ghost.pos.x += 40 * k.dt();
      ghost.pos.y = ghost.baseY + Math.sin(age * 3) * 10;
      if (ghost.pos.x > WORLD_WIDTH) {
        removeGhost(house, ghost);
      }
    });
    house.ghosts.push(ghost);
  }

  function removeGhost(house, ghost) {
    if (!ghost?.exists?.()) return;
    const idx = house.ghosts.indexOf(ghost);
    if (idx !== -1) house.ghosts.splice(idx, 1);
    k.destroy(ghost);
  }

  function despawnHauntedHouse(key) {
    const house = hauntedHouses.get(key);
    if (!house) return;
    for (const g of house.ghosts) if (g?.exists?.()) k.destroy(g);
    hauntedHouses.delete(key);
  }

  function updateHauntedHouses() {
    const now = k.time();
    for (const [, house] of hauntedHouses) {
      // Nettoie les fantômes morts (au cas où)
      house.ghosts = house.ghosts.filter(g => g?.exists?.());
      if (house.ghosts.length < MAX_GHOSTS_PER_HOUSE
          && now - house.lastSpawnAt > GHOST_RESPAWN_INTERVAL) {
        spawnGhost(house);
        house.lastSpawnAt = now;
      }
    }
  }

  // Wagon touche un fantôme → kill +25pts
  k.onCollide("ghost-haunt", "wagon", (ghost) => {
    const house = hauntedHouses.get(ghost.houseKey);
    if (!house) { if (ghost.exists()) k.destroy(ghost); return; }
    const gx = ghost.pos.x + 14;
    const gy = ghost.pos.y + 20;
    removeGhost(house, ghost);
    gameState.score += 25;
    audio.combo?.();
    showPopup(gx, gy - 20, "+25", k.rgb(180, 80, 240), 18);
    window.__juice?.dirShake?.(0, 1, 4, 0.1);
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 * i) / 12;
      k.add([
        k.circle(2 + Math.random() * 2),
        k.pos(gx, gy),
        k.color(k.rgb(180, 80, 240)),
        k.opacity(0.95),
        k.lifespan(0.5, { fade: 0.35 }),
        k.z(15),
        "particle",
        { vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 - 20 },
      ]);
    }
  });

  // Detection loops
  k.loop(0.5, () => {
    detectChamboule();
    detectRoulette();
    detectHauntedHouse();
  });

  k.onUpdate(updateRoulettes);
  k.onUpdate(updateHauntedHouses);

  // Click handlers (global canvas click)
  k.onClick("chamboule-can", hitCan);
  k.onClick("roulette-wheel", clickRoulette);

  function cleanup() {
    for (const key of Array.from(chamboules.keys())) despawnChamboule(key);
    for (const key of Array.from(roulettes.keys())) despawnRoulette(key);
    for (const key of Array.from(hauntedHouses.keys())) despawnHauntedHouse(key);
  }

  return { cleanup };
}

import { TILE, GROUND_ROW, gridKey } from "./constants.js";

export function createTileSystem({ k, tileMap, gameState, audio, entityCounts, showPopup }) {
  function spawnSteamBurst(col, row) {
    const cx = col * TILE + TILE / 2;
    const cy = row * TILE + TILE / 2;
    for (let i = 0; i < 12; i++) {
      const p = k.add([
        k.circle(3 + Math.random() * 3),
        k.pos(cx + (Math.random() - 0.5) * TILE, cy),
        k.color(k.rgb(210, 230, 240)),
        k.opacity(0.75),
        k.lifespan(0.9, { fade: 0.6 }),
        k.z(4),
        "steam",
        { vy: -60 - Math.random() * 60, vx: (Math.random() - 0.5) * 40 },
      ]);
      p.onUpdate(() => {
        p.pos.x += p.vx * k.dt();
        p.pos.y += p.vy * k.dt();
      });
    }
  }

  function checkCascade(col, row) {
    let topRow = row;
    while (tileMap.get(gridKey(col, topRow - 1))?.tileType === "water") topRow--;
    let h = 0, r = topRow;
    while (tileMap.get(gridKey(col, r))?.tileType === "water") { h++; r++; }
    if (h < 3) {
      // Nettoyer le flag sur toute la colonne si plus valide
      for (let i = topRow; i < r; i++) {
        const t = tileMap.get(gridKey(col, i));
        if (t) t.cascadeActive = false;
      }
      return;
    }
    for (let i = 0; i < h; i++) {
      const t = tileMap.get(gridKey(col, topRow + i));
      if (t) t.cascadeActive = true;
    }
    showPopup(
      col * TILE + TILE / 2,
      topRow * TILE - 16,
      "CASCADE !",
      k.rgb(80, 180, 230),
      18,
    );
    window.__spectres?.unlock(9);
    const bottomTile = tileMap.get(gridKey(col, r));
    if (bottomTile?.tileType === "lava") {
      placeTile(col, r, "bridge");
      const newBridge = tileMap.get(gridKey(col, r));
      if (newBridge) newBridge.temporary = k.time() + 8;
      spawnSteamBurst(col, r);
    }
  }

  function checkCoinResonance(col, row) {
    const isCoinAt = (c, r) => {
      const t = tileMap.get(gridKey(c, r));
      return t && t.tileType === "coin";
    };
    const checkTriplet = (dx, dy) => {
      for (let offset = -2; offset <= 0; offset++) {
        const c0 = col + offset * dx;
        const r0 = row + offset * dy;
        if (
          isCoinAt(c0, r0) &&
          isCoinAt(c0 + dx, r0 + dy) &&
          isCoinAt(c0 + 2 * dx, r0 + 2 * dy)
        ) {
          return [
            [c0, r0],
            [c0 + dx, r0 + dy],
            [c0 + 2 * dx, r0 + 2 * dy],
          ];
        }
      }
      return null;
    };
    const trio = checkTriplet(1, -1) || checkTriplet(1, 1);
    if (!trio) return;
    gameState.comboExpire = k.time() + 4;
    if (gameState.comboCount < 2) gameState.comboCount = 2;
    audio.combo();
    showPopup(
      (trio[1][0] + 0.5) * TILE,
      (trio[1][1] + 0.5) * TILE - 30,
      "CHAINE D'OR !",
      k.rgb(255, 220, 60),
      22,
    );
    for (const [tc, tr] of trio) {
      const cx = tc * TILE + TILE / 2;
      const cy = tr * TILE + TILE / 2;
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8;
        const p = k.add([
          k.circle(3),
          k.pos(cx, cy),
          k.color(k.rgb(255, 230, 80)),
          k.opacity(1),
          k.lifespan(0.7, { fade: 0.5 }),
          k.z(15),
          { vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 },
        ]);
        p.onUpdate(() => {
          p.pos.x += p.vx * k.dt();
          p.pos.y += p.vy * k.dt();
        });
      }
    }
  }

  function placeTile(col, row, type) {
    const key = gridKey(col, row);
    const existing = tileMap.get(key);
    if (existing) {
      if (existing.tileType === "portal" && existing.pair) {
        existing.pair.pair = null;
      }
      if (existing.extras) existing.extras.forEach((e) => k.destroy(e));
      k.destroy(existing);
      tileMap.delete(key);
    }
    if (type === "erase") return;

    gameState.tilesPlacedThisGame = (gameState.tilesPlacedThisGame || 0) + 1;
    if (gameState.tilesPlacedThisGame >= 50) window.__spectres?.unlock(18);

    if (type === "lava") {
      const t = k.add([
        k.sprite("lava1"),
        k.pos(col * TILE, row * TILE),
        k.area(),
        k.z(1),
        "tile",
        "lava",
        { gridCol: col, gridRow: row, tileType: "lava", lavaPhase: 0, extras: [], _bubbleCd: Math.random() * 2 },
      ]);
      tileMap.set(key, t);
      t.onUpdate(() => {
        t._bubbleCd -= k.dt();
        if (t._bubbleCd > 0) return;
        t._bubbleCd = 0.6 + Math.random() * 1.4;
        if (entityCounts.particle > 260) return;
        const bx = t.pos.x + 8 + Math.random() * (TILE - 16);
        const by = t.pos.y + TILE * 0.4;
        k.add([
          k.circle(2 + Math.random() * 2),
          k.pos(bx, by),
          k.color(k.rgb(255, 200 + Math.random() * 30, 80)),
          k.opacity(0.85),
          k.lifespan(1.1, { fade: 0.7 }),
          k.z(2),
          "particle",
          { vx: (Math.random() - 0.5) * 8, vy: -22 - Math.random() * 18 },
        ]);
      });
    } else if (type === "water") {
      const t = k.add([
        k.sprite("water1"),
        k.pos(col * TILE, row * TILE),
        k.area(),
        k.z(1),
        "tile",
        "water",
        { gridCol: col, gridRow: row, tileType: "water", waterPhase: 0, cascadeActive: false, extras: [] },
      ]);
      tileMap.set(key, t);
      t.onUpdate(() => {
        if (!t.cascadeActive) return;
        if (Math.random() < 0.3) {
          const drop = k.add([
            k.circle(2 + Math.random() * 2),
            k.pos(t.pos.x + Math.random() * TILE, t.pos.y),
            k.color(k.rgb(80, 180, 230)),
            k.opacity(0.8),
            k.lifespan(0.6, { fade: 0.4 }),
            k.z(2),
            "particle",
            { vy: 200 + Math.random() * 100 },
          ]);
          drop.onUpdate(() => {
            drop.pos.y += drop.vy * k.dt();
          });
        }
        // Splash en bas de la cascade (tuile du bas de la colonne)
        const botRow = t.gridRow + 1;
        const botTile = tileMap.get(gridKey(t.gridCol, botRow));
        if (!botTile && Math.random() < 0.08) {
          k.add([
            k.circle(4 + Math.random() * 3),
            k.pos(t.pos.x + Math.random() * TILE, t.pos.y + TILE - 4),
            k.color(k.rgb(80, 210, 240)),
            k.opacity(0.7),
            k.lifespan(0.5, { fade: 0.3 }),
            k.z(3),
          ]);
        }
      });
      checkCascade(col, row);
    } else if (type === "rail") {
      const x = col * TILE;
      const y = row * TILE + TILE - 10;
      const ties = [];
      for (let i = 0; i < 3; i++) {
        ties.push(
          k.add([
            k.rect(5, 9),
            k.pos(x + 4 + i * 10, y + 7),
            k.color(k.rgb(100, 60, 30)),
            k.outline(1, k.rgb(40, 20, 10)),
            k.z(1),
          ]),
        );
      }
      const t = k.add([
        k.rect(TILE, 6),
        k.pos(x, y),
        k.color(k.rgb(210, 210, 225)),
        k.outline(2, k.rgb(70, 70, 90)),
        k.z(3),
        "tile",
        "rail",
        { gridCol: col, gridRow: row, tileType: "rail", extras: ties },
      ]);
      tileMap.set(key, t);
    } else if (type === "trampoline") {
      const x = col * TILE;
      const y = row * TILE;
      const base = k.add([
        k.rect(TILE, TILE - 8),
        k.pos(x, y + 8),
        k.color(k.rgb(60, 40, 60)),
        k.outline(2, k.rgb(30, 20, 30)),
        k.z(1),
      ]);
      const spring1 = k.add([
        k.rect(4, TILE - 12),
        k.pos(x + 6, y + 10),
        k.color(k.rgb(200, 200, 215)),
        k.z(2),
      ]);
      const spring2 = k.add([
        k.rect(4, TILE - 12),
        k.pos(x + TILE - 10, y + 10),
        k.color(k.rgb(200, 200, 215)),
        k.z(2),
      ]);
      const t = k.add([
        k.rect(TILE, 6),
        k.pos(x, y + 4),
        k.color(k.rgb(255, 80, 130)),
        k.outline(2, k.rgb(140, 20, 60)),
        k.area(),
        k.z(3),
        "tile",
        "trampoline",
        { gridCol: col, gridRow: row, tileType: "trampoline", extras: [base, spring1, spring2] },
      ]);
      tileMap.set(key, t);
      t.onDraw(() => {
        const pulse = 0.5 + 0.5 * Math.sin(k.time() * 5);
        k.drawCircle({
          pos: k.vec2(TILE / 2, 6),
          radius: TILE * 0.45 * (0.85 + 0.15 * pulse),
          color: k.rgb(255, 100, 160),
          opacity: 0.12 + 0.1 * pulse,
        });
      });
    } else if (type === "boost") {
      const t = k.add([
        k.sprite("boost"),
        k.pos(col * TILE, row * TILE),
        k.area(),
        k.z(1),
        "tile",
        "boost",
        { gridCol: col, gridRow: row, tileType: "boost", extras: [] },
      ]);
      tileMap.set(key, t);
    } else if (type === "portal") {
      const unpairedA = [...tileMap.values()].find(
        (t) => t.tileType === "portal" && !t.pair && t.portalColor === "A",
      );
      const unpairedB = [...tileMap.values()].find(
        (t) => t.tileType === "portal" && !t.pair && t.portalColor === "B",
      );
      const colorKind = unpairedA ? "B" : "A";
      const rgbCore = colorKind === "A" ? k.rgb(80, 220, 240) : k.rgb(240, 80, 220);
      const rgbGlow = colorKind === "A" ? k.rgb(200, 250, 255) : k.rgb(255, 200, 250);
      const cx = col * TILE + TILE / 2;
      const cy = row * TILE + TILE / 2;
      const ring = k.add([
        k.circle(TILE / 2 - 2),
        k.pos(cx, cy),
        k.color(rgbCore),
        k.outline(2, rgbGlow),
        k.area({ shape: new k.Rect(k.vec2(-TILE / 2 + 2, -TILE / 2 + 2), TILE - 4, TILE - 4) }),
        k.z(2),
        k.anchor("center"),
        "tile",
        "portal",
        {
          gridCol: col,
          gridRow: row,
          tileType: "portal",
          portalColor: colorKind,
          pair: null,
          cooldownUntil: 0,
          extras: [],
        },
      ]);
      ring.onUpdate(() => {
        ring.angle = (ring.angle || 0) + 120 * k.dt();
      });
      const otherUnpaired = colorKind === "A" ? unpairedB : unpairedA;
      if (otherUnpaired) {
        ring.pair = otherUnpaired;
        otherUnpaired.pair = ring;
      }
      tileMap.set(key, ring);
    } else if (type === "bridge") {
      const plank1 = k.add([
        k.rect(TILE, 10),
        k.pos(col * TILE, row * TILE + TILE - 14),
        k.color(k.rgb(160, 100, 40)),
        k.outline(1, k.rgb(80, 50, 20)),
        k.z(2),
      ]);
      const plank2 = k.add([
        k.rect(TILE, 8),
        k.pos(col * TILE, row * TILE + TILE - 4),
        k.color(k.rgb(130, 80, 30)),
        k.z(2),
      ]);
      const support = k.add([
        k.rect(4, TILE),
        k.pos(col * TILE + TILE / 2 - 2, row * TILE),
        k.color(k.rgb(100, 60, 20)),
        k.z(1),
      ]);
      const t = k.add([
        k.rect(TILE, 6),
        k.pos(col * TILE, row * TILE + TILE - 10),
        k.color(k.rgb(0, 0, 0)),
        k.opacity(0),
        k.area(),
        k.body({ isStatic: true }),
        k.z(3),
        "tile",
        "bridge",
        { gridCol: col, gridRow: row, tileType: "bridge", extras: [plank1, plank2, support] },
      ]);
      tileMap.set(key, t);
      t.onUpdate(() => {
        // Pulse red when crossings == 1 (one more pass and bridge breaks)
        if ((t.crossings || 0) >= 1 && !t.breaking) {
          const pulse = 0.5 + 0.5 * Math.sin(k.time() * 8);
          plank1.color.r = 200 + 55 * pulse;
          plank1.color.g = 60 - 30 * pulse;
          plank1.color.b = 30 - 20 * pulse;
        }
      });
    } else if (type === "magnet") {
      const t = k.add([
        k.rect(TILE, TILE),
        k.pos(col * TILE, row * TILE),
        k.color(k.rgb(210, 80, 60)),
        k.outline(2, k.rgb(110, 30, 20)),
        k.area(),
        k.z(1),
        "tile",
        "magnet",
        { gridCol: col, gridRow: row, tileType: "magnet", extras: [] },
      ]);
      const leftArm = k.add([
        k.rect(6, TILE - 10),
        k.pos(col * TILE + 6, row * TILE + 4),
        k.color(k.rgb(40, 40, 40)),
        k.z(2),
      ]);
      const rightArm = k.add([
        k.rect(6, TILE - 10),
        k.pos(col * TILE + TILE - 12, row * TILE + 4),
        k.color(k.rgb(40, 40, 40)),
        k.z(2),
      ]);
      const leftTip = k.add([
        k.rect(6, 4),
        k.pos(col * TILE + 6, row * TILE + 4),
        k.color(k.rgb(200, 200, 200)),
        k.z(3),
      ]);
      const rightTip = k.add([
        k.rect(6, 4),
        k.pos(col * TILE + TILE - 12, row * TILE + 4),
        k.color(k.rgb(200, 200, 200)),
        k.z(3),
      ]);
      t.extras = [leftArm, rightArm, leftTip, rightTip];
      tileMap.set(key, t);
    } else if (type === "ice") {
      const t = k.add([
        k.rect(TILE, TILE),
        k.pos(col * TILE, row * TILE),
        k.color(k.rgb(180, 230, 255)),
        k.outline(2, k.rgb(100, 170, 220)),
        k.area(),
        k.z(1),
        "tile",
        "ice",
        { gridCol: col, gridRow: row, tileType: "ice", extras: [] },
      ]);
      const shine1 = k.add([
        k.rect(TILE - 8, 2),
        k.pos(col * TILE + 4, row * TILE + 6),
        k.color(k.rgb(255, 255, 255)),
        k.opacity(0.8),
        k.z(2),
      ]);
      const shine2 = k.add([
        k.rect(TILE / 2 - 4, 2),
        k.pos(col * TILE + 4, row * TILE + TILE - 8),
        k.color(k.rgb(255, 255, 255)),
        k.opacity(0.6),
        k.z(2),
      ]);
      t.extras = [shine1, shine2];
      tileMap.set(key, t);
    } else if (type === "fan") {
      const t = k.add([
        k.sprite("fan"),
        k.pos(col * TILE, row * TILE),
        k.area(),
        k.z(1),
        "tile",
        "fan",
        { gridCol: col, gridRow: row, tileType: "fan", extras: [] },
      ]);
      t.onUpdate(() => {
        if (Math.random() < 0.25) {
          k.add([
            k.circle(2 + Math.random() * 2),
            k.pos(col * TILE + 6 + Math.random() * 20, row * TILE + 2),
            k.color(k.rgb(230, 240, 255)),
            k.opacity(0.7),
            k.lifespan(0.6, { fade: 0.4 }),
            k.z(2),
            "fan-puff",
            { vy: -60 - Math.random() * 50, vx: (Math.random() - 0.5) * 20 },
          ]);
        }
        const cx = col * TILE + TILE / 2;
        for (const w of k.get("wagon")) {
          const dx = Math.abs(w.pos.x + 30 - cx);
          const dy = w.pos.y + 30 - (row * TILE);
          if (dx < 60 && dy < 0 && dy > -220) {
            if (w.vel) w.vel.y -= 600 * k.dt();
          }
        }
      });
      tileMap.set(key, t);
    } else if (type === "coin") {
      const cx = col * TILE + TILE / 2;
      const cy = row * TILE + TILE / 2;
      const t = k.add([
        k.circle(9),
        k.pos(cx, cy),
        k.color(k.rgb(255, 210, 50)),
        k.outline(2, k.rgb(160, 110, 0)),
        k.area({ shape: new k.Rect(k.vec2(-10, -10), 20, 20) }),
        k.z(4),
        "tile",
        "coin",
        { gridCol: col, gridRow: row, tileType: "coin", baseY: cy, extras: [], coinPhase: Math.random() * Math.PI * 2 },
      ]);
      const inner = k.add([
        k.rect(3, 10),
        k.pos(cx, cy),
        k.anchor("center"),
        k.color(k.rgb(200, 150, 0)),
        k.z(5),
      ]);
      t.extras = [inner];
      t.onUpdate(() => {
        // Bobbing animation
        t.pos.y = t.baseY + Math.sin(k.time() * 2.5 + t.coinPhase) * 3;
        inner.pos.y = t.pos.y;
        // Spinning inner bar (width pulse to fake 3D)
        const w = 2 + Math.abs(Math.cos(k.time() * 4 + t.coinPhase)) * 5;
        inner.width = w;
      });
      // Sparkle every ~2s
      t._sparkleCd = Math.random() * 2;
      t.onUpdate(() => {
        t._sparkleCd -= k.dt();
        if (t._sparkleCd > 0) return;
        t._sparkleCd = 1.5 + Math.random() * 2;
        if (entityCounts.particle > 250) return;
        k.add([
          k.rect(2, 2),
          k.pos(t.pos.x + (Math.random() - 0.5) * 16, t.pos.y + (Math.random() - 0.5) * 16),
          k.color(k.rgb(255, 250, 150)),
          k.opacity(1),
          k.lifespan(0.4, { fade: 0.3 }),
          k.z(6),
          "particle",
          { vx: 0, vy: -10 },
        ]);
      });
      tileMap.set(key, t);
      checkCoinResonance(col, row);
    } else if (type === "wheel") {
      window.__spectres?.unlock(12);
      const cx = col * TILE + TILE / 2;
      const cy = row * TILE + TILE / 2;
      const hubR = 8;
      const armLen = 60;
      const NACELLE_COLORS = [
        k.rgb(80, 220, 240),
        k.rgb(240, 80, 80),
        k.rgb(255, 210, 50),
        k.rgb(180, 80, 240),
      ];
      const hub = k.add([
        k.circle(hubR),
        k.pos(cx, cy),
        k.anchor("center"),
        k.color(k.rgb(210, 190, 140)),
        k.outline(2, k.rgb(120, 100, 60)),
        k.z(6),
        "wheel",
        {
          gridCol: col,
          gridRow: row,
          tileType: "wheel",
          wheelAngle: 0,
          nextDrop: k.time() + 7,
          extras: [],
        },
      ]);
      const structs = [];
      for (let q = 0; q < 4; q++) {
        const baseA = (Math.PI / 2) * q;
        const beam = k.add([
          k.rect(armLen * 2, 4),
          k.pos(cx, cy),
          k.anchor("center"),
          k.rotate((baseA * 180) / Math.PI),
          k.color(k.rgb(190, 170, 120)),
          k.z(5),
        ]);
        structs.push(beam);
      }
      const outerRing = k.add([
        k.circle(armLen),
        k.pos(cx, cy),
        k.anchor("center"),
        k.color(k.rgb(0, 0, 0, 0)),
        k.outline(4, k.rgb(190, 170, 120)),
        k.z(5),
      ]);
      structs.push(outerRing);
      const nacelles = [];
      for (let n = 0; n < 4; n++) {
        const nac = k.add([
          k.rect(24, 16),
          k.pos(cx, cy),
          k.anchor("center"),
          k.color(NACELLE_COLORS[n]),
          k.outline(2, k.rgb(30, 30, 30)),
          k.z(7),
        ]);
        nacelles.push(nac);
        structs.push(nac);
      }
      hub.extras = structs;
      hub.onUpdate(() => {
        const DEG_PER_SEC = 12;
        hub.wheelAngle += DEG_PER_SEC * k.dt();
        if (hub.wheelAngle >= 360) hub.wheelAngle -= 360;
        const rad = (hub.wheelAngle * Math.PI) / 180;
        for (let n = 0; n < 4; n++) {
          const a = rad + (Math.PI / 2) * n;
          nacelles[n].pos.x = cx + Math.cos(a) * armLen;
          nacelles[n].pos.y = cy + Math.sin(a) * armLen;
        }
        const now = k.time();
        if (now >= hub.nextDrop) {
          hub.nextDrop = now + 7;
          const isVIP = Math.random() < 1 / 15;
          if (isVIP) {
            showPopup(cx, cy - armLen - 30, "VIP +200pts", k.rgb(255, 210, 50), 22);
            gameState.score += 200;
            const vip = k.add([
              k.rect(10, 18),
              k.pos(cx, cy - armLen),
              k.anchor("center"),
              k.color(k.rgb(255, 210, 50)),
              k.outline(1, k.rgb(180, 140, 20)),
              k.opacity(1),
              k.lifespan(3, { fade: 1 }),
              k.z(8),
              { vy: -80, vx: (Math.random() - 0.5) * 60 },
            ]);
            vip.onUpdate(() => {
              vip.vy += 400 * k.dt();
              vip.pos.y += vip.vy * k.dt();
              vip.pos.x += vip.vx * k.dt();
            });
          } else {
            for (let d = 0; d < 3; d++) {
              const dc = k.add([
                k.circle(9),
                k.pos(cx + (d - 1) * 18, cy - armLen),
                k.anchor("center"),
                k.color(k.rgb(255, 210, 50)),
                k.outline(2, k.rgb(160, 110, 0)),
                k.opacity(1),
                k.z(8),
                "wheel-coin",
                { vy: -60 - Math.random() * 40, vx: (d - 1) * 30 + (Math.random() - 0.5) * 20 },
              ]);
              dc.onUpdate(() => {
                dc.vy += 400 * k.dt();
                dc.pos.y += dc.vy * k.dt();
                dc.pos.x += dc.vx * k.dt();
                if (dc.pos.y > (GROUND_ROW + 1) * TILE) { k.destroy(dc); return; }
                for (const w of k.get("wagon")) {
                  if (Math.abs(w.pos.x + 16 - dc.pos.x) < 26 && Math.abs(w.pos.y + 20 - dc.pos.y) < 26) {
                    gameState.coins++;
                    gameState.score += 10;
                    audio.coin();
                    k.destroy(dc);
                    return;
                  }
                }
              });
            }
          }
        }
      });
      tileMap.set(key, hub);
    } else if (type === "rail_up" || type === "rail_down") {
      const angle = type === "rail_up" ? -45 : 45;
      const cx = col * TILE + TILE / 2;
      // Centered so the diagonal endpoints land on the horizontal rail surface
      // of the cell at row (left for rail_up, right for rail_down) and the row
      // above (right for rail_up, left for rail_down). Surface offset = TILE-10.
      const cy = row * TILE + (TILE - 10) - TILE / 2;
      const len = TILE * Math.SQRT2;
      const rad = (angle * Math.PI) / 180;
      const ties = [];
      for (let i = 0; i < 3; i++) {
        const off = (i - 1) * 13;
        const tx = cx + off * Math.cos(rad);
        const ty = cy + off * Math.sin(rad);
        ties.push(
          k.add([
            k.rect(5, 11),
            k.pos(tx, ty + 7),
            k.anchor("center"),
            k.rotate(angle),
            k.color(k.rgb(100, 60, 30)),
            k.outline(1, k.rgb(40, 20, 10)),
            k.z(1),
          ]),
        );
      }
      const t = k.add([
        k.rect(len, 6),
        k.pos(cx, cy),
        k.anchor("center"),
        k.rotate(angle),
        k.color(k.rgb(210, 210, 225)),
        k.outline(2, k.rgb(70, 70, 90)),
        k.z(3),
        "tile",
        { gridCol: col, gridRow: row, tileType: type, extras: ties },
      ]);
      tileMap.set(key, t);
    }
  }

  k.loop(1, () => {
    for (const [key, b] of tileMap.entries()) {
      if (b.tileType === "bridge" && b.temporary && k.time() > b.temporary) {
        const col2 = b.gridCol;
        const row2 = b.gridRow;
        if (b.extras) b.extras.forEach((e) => k.destroy(e));
        k.destroy(b);
        tileMap.delete(key);
        placeTile(col2, row2, "lava");
        spawnSteamBurst(col2, row2);
      }
    }
  });

  function detectGeysers() {
    const geysers = [];
    for (const [, t] of tileMap) {
      if (t.tileType !== "fan") continue;
      const above = tileMap.get(gridKey(t.gridCol, t.gridRow - 1));
      if (above && above.tileType === "water") {
        geysers.push({ col: t.gridCol, row: t.gridRow - 1, fanRow: t.gridRow });
      }
    }
    return geysers;
  }

  function detectMagnetFields() {
    const fields = [];
    const magnets = [];
    for (const [, t] of tileMap) if (t.tileType === "magnet") magnets.push(t);
    for (let i = 0; i < magnets.length && fields.length < 3; i++) {
      for (let j = i + 1; j < magnets.length && fields.length < 3; j++) {
        const a = magnets[i], b = magnets[j];
        if (a.gridRow !== b.gridRow) continue;
        const dx = Math.abs(b.gridCol - a.gridCol);
        if (dx < 4 || dx > 12) continue;
        const minCol = Math.min(a.gridCol, b.gridCol);
        const maxCol = Math.max(a.gridCol, b.gridCol);
        let clear = true;
        for (let c = minCol + 1; c < maxCol; c++) {
          if (tileMap.get(gridKey(c, a.gridRow))) { clear = false; break; }
        }
        if (!clear) continue;
        fields.push({ a, b, len: dx });
        window.__spectres?.unlock(11);
      }
    }
    return fields;
  }

  function detectMagnetPortals() {
    const result = [];
    for (const [, t] of tileMap) {
      if (t.tileType !== "portal") continue;
      let hasMagnetNearby = false;
      outer: for (let dc = -2; dc <= 2; dc++) {
        for (let dr = -2; dr <= 2; dr++) {
          if (Math.abs(dc) + Math.abs(dr) > 2) continue;
          if (dc === 0 && dr === 0) continue;
          const neighbor = tileMap.get(gridKey(t.gridCol + dc, t.gridRow + dr));
          if (neighbor?.tileType === "magnet") { hasMagnetNearby = true; break outer; }
        }
      }
      if (hasMagnetNearby) {
        result.push({ col: t.gridCol, row: t.gridRow, x: t.pos.x, y: t.pos.y, portalRef: t });
      }
    }
    return result;
  }

  function detectIceRinks() {
    const rinks = [];
    const visited = new Set();
    for (const [, t] of tileMap) {
      if (t.tileType !== "ice") continue;
      const k2 = gridKey(t.gridCol, t.gridRow);
      if (visited.has(k2)) continue;
      let len = 0;
      let c = t.gridCol;
      while (tileMap.get(gridKey(c, t.gridRow))?.tileType === "ice") {
        visited.add(gridKey(c, t.gridRow));
        len++;
        c++;
      }
      if (len >= 3) {
        rinks.push({ startCol: t.gridCol, row: t.gridRow, len });
      }
    }
    return rinks;
  }

  return { placeTile, checkCoinResonance, checkCascade, detectMagnetFields, detectGeysers, detectIceRinks, detectMagnetPortals };
}

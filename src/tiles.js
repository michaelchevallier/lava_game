import { TILE, GROUND_ROW, gridKey } from "./constants.js";

export function createTileSystem({ k, tileMap, gameState, audio, entityCounts, showPopup }) {
  // Cache wagons refreshed 10Hz — évite k.get("wagon") par frame dans les
  // onUpdate de wheel-coin (~40 instances), fan, bomb. Scene-tree scan coupé
  // de 42×/frame à 10×/s.
  let _cachedWagons = [];
  k.loop(0.1, () => { _cachedWagons = k.get("wagon"); });

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
    window.__tiers?.onChain?.();
    window.__campaign?.progress?.("chain"); window.__contract?.progress?.("chain");
    window.__spectres?.unlock?.("gold_chain");
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
    if (gameState.tilesPlacedThisGame >= 50) window.__spectres?.unlock("park_50tiles");

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
      // Trampoline : 1 seul sprite (avant : base + 2 springs + surface = 4 entités)
      const x = col * TILE;
      const y = row * TILE;
      const t = k.add([
        k.sprite("trampoline_visual"),
        k.pos(x, y),
        k.area(),
        k.z(3),
        "tile",
        "trampoline",
        { gridCol: col, gridRow: row, tileType: "trampoline", extras: [] },
      ]);
      tileMap.set(key, t);
      // Pulse via scale (pas d'entité extra)
      t.onUpdate(() => {
        const pulse = 0.5 + 0.5 * Math.sin(k.time() * 5);
        const s = 1 + 0.08 * pulse;
        t.scale = k.vec2(s, 1 + 0.04 * pulse);
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
      // Portal : 1 sprite pré-rendu par variant (cyan A / magenta B).
      // Rotation via k.onUpdate("portal") qui incrément angle — le sprite tourne.
      const unpairedA = [...tileMap.values()].find(
        (t) => t.tileType === "portal" && !t.pair && t.portalColor === "A",
      );
      const unpairedB = [...tileMap.values()].find(
        (t) => t.tileType === "portal" && !t.pair && t.portalColor === "B",
      );
      const colorKind = unpairedA ? "B" : "A";
      const cx = col * TILE + TILE / 2;
      const cy = row * TILE + TILE / 2;
      const ring = k.add([
        k.sprite(colorKind === "A" ? "portal_a_visual" : "portal_b_visual"),
        k.pos(cx, cy),
        k.anchor("center"),
        k.rotate(0),
        k.area({ shape: new k.Rect(k.vec2(-TILE / 2 + 2, -TILE / 2 + 2), TILE - 4, TILE - 4) }),
        k.z(2),
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
      const otherUnpaired = colorKind === "A" ? unpairedB : unpairedA;
      if (otherUnpaired) {
        ring.pair = otherUnpaired;
        otherUnpaired.pair = ring;
      }
      tileMap.set(key, ring);
    } else if (type === "bridge") {
      // Bridge : 1 sprite pré-rendu + overlay danger-pulse sur planche quand abîmé
      const t = k.add([
        k.sprite("bridge_visual"),
        k.pos(col * TILE, row * TILE),
        k.area({ shape: new k.Rect(k.vec2(0, TILE - 14), TILE, 6) }),
        k.body({ isStatic: true }),
        k.z(3),
        "tile",
        "bridge",
        { gridCol: col, gridRow: row, tileType: "bridge", extras: [] },
      ]);
      // Overlay rouge transparent qui pulse quand le bridge est abîmé (crossings>=1).
      // Position : sur la planche principale (y=16-26 dans le sprite 32×32).
      const pulseOverlay = k.add([
        k.rect(TILE, 10),
        k.pos(col * TILE, row * TILE + 16),
        k.color(k.rgb(200, 60, 30)),
        k.opacity(0),
        k.z(4),
      ]);
      t.extras = [pulseOverlay];
      tileMap.set(key, t);
    } else if (type === "magnet") {
      // Magnet : 1 seul sprite (avant : base + 2 arms + 2 tips = 5 entités)
      const t = k.add([
        k.sprite("magnet_visual"),
        k.pos(col * TILE, row * TILE),
        k.area(),
        k.z(3),
        "tile",
        "magnet",
        { gridCol: col, gridRow: row, tileType: "magnet", extras: [] },
      ]);
      tileMap.set(key, t);
    } else if (type === "ice") {
      // Ice : 1 sprite pré-rendu (avant : base + 2 shines = 3 entités)
      const t = k.add([
        k.sprite("ice_visual"),
        k.pos(col * TILE, row * TILE),
        k.area(),
        k.z(1),
        "tile",
        "ice",
        { gridCol: col, gridRow: row, tileType: "ice", extras: [] },
      ]);
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
        const cx = col * TILE + TILE / 2;
        for (const w of _cachedWagons) {
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
      t._sparkleCd = Math.random() * 2;
      tileMap.set(key, t);
      checkCoinResonance(col, row);
    } else if (type === "wheel") {
      const cx = col * TILE + TILE / 2;
      const cy = row * TILE + TILE / 2;
      const armLen = 44;
      // Grande Roue : 1 sprite pré-rendu rotat\u00e9 (avant : hub + 4 beams + outerRing + 4 nacelles = 10 entit\u00e9s)
      const hub = k.add([
        k.sprite("wheel_visual"),
        k.pos(cx, cy),
        k.anchor("center"),
        k.rotate(0),
        k.z(5),
        "wheel",
        "tile",
        {
          gridCol: col,
          gridRow: row,
          tileType: "wheel",
          wheelAngle: 0,
          nextDrop: k.time() + 7,
          extras: [],
        },
      ]);
      hub.onUpdate(() => {
        const DEG_PER_SEC = 12;
        hub.wheelAngle += DEG_PER_SEC * k.dt();
        if (hub.wheelAngle >= 360) hub.wheelAngle -= 360;
        hub.angle = hub.wheelAngle;
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
                for (const w of _cachedWagons) {
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
    } else if (type === "rail_loop") {
      // Loop 2×2 (occupe 2 tiles horizontales, 2 verticales). Ancré sur col/row top-left.
      const cx = (col + 1) * TILE;
      const cy = (row + 1) * TILE;
      const rx = TILE;
      const ry = TILE;
      const extras = [];
      extras.push(k.add([
        k.sprite("rail_loop_visual"),
        k.pos(cx, cy),
        k.anchor("center"),
        k.z(3),
      ]));
      // Raccords avec les rails adjacents (cx-rx-TILE → cx-rx, même pour sortie)
      // On pose un petit tronçon de rail horizontal visible à chaque extrémité.
      const RAIL_FILL = k.rgb(210, 210, 225);
      const RAIL_OUTLINE = k.rgb(70, 70, 90);
      // Tronçon gauche (entrée sol)
      extras.push(k.add([
        k.rect(TILE * 0.4, 6),
        k.pos(cx - rx - TILE * 0.2, cy + ry - 3),
        k.color(RAIL_FILL),
        k.outline(2, RAIL_OUTLINE),
        k.anchor("center"),
        k.z(3),
      ]));
      // Tronçon droit (sortie sol)
      extras.push(k.add([
        k.rect(TILE * 0.4, 6),
        k.pos(cx + rx + TILE * 0.2, cy + ry - 3),
        k.color(RAIL_FILL),
        k.outline(2, RAIL_OUTLINE),
        k.anchor("center"),
        k.z(3),
      ]));
      const t = k.add([
        k.rect(TILE * 0.6, TILE * 0.6),
        k.pos(cx - TILE * 0.3, cy - TILE * 0.3),
        k.area({ shape: new k.Rect(k.vec2(0, 0), TILE * 0.6, TILE * 0.6) }),
        k.opacity(0),
        k.z(2),
        "tile",
        "rail_loop",
        { gridCol: col, gridRow: row, tileType: "rail_loop", extras, loopCx: cx, loopCy: cy, loopRx: rx, loopRy: ry, exitX: cx + rx + 30 },
      ]);
      tileMap.set(key, t);
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
    } else if (type === "bomb") {
      const t = k.add([
        k.sprite("bomb_visual"),
        k.pos(col * TILE, row * TILE),
        k.area(),
        k.z(2),
        "tile",
        "bomb",
        { gridCol: col, gridRow: row, tileType: "bomb", extras: [], _fuseCd: 0, exploded: false },
      ]);
      tileMap.set(key, t);
    } else if (type === "alarm_flood" || type === "alarm_freeze" || type === "alarm_wind") {
      const variant = type === "alarm_flood" ? "flood" : type === "alarm_freeze" ? "freeze" : "wind";
      const colorByVariant = {
        flood: k.rgb(80, 160, 230),
        freeze: k.rgb(180, 230, 255),
        wind: k.rgb(200, 240, 180),
      };
      const iconByVariant = { flood: "💧", freeze: "❄", wind: "🌬" };
      const delay = 10;
      const t = k.add([
        k.rect(TILE, TILE),
        k.pos(col * TILE, row * TILE),
        k.color(colorByVariant[variant]),
        k.outline(2, k.rgb(40, 40, 60)),
        k.opacity(0.85),
        k.area(),
        k.z(2),
        "tile",
        "alarm",
        {
          gridCol: col, gridRow: row, tileType: "alarm",
          variant, triggerAt: k.time() + delay, detonated: false,
          alarmIcon: iconByVariant[variant],
          extras: [],
        },
      ]);
      tileMap.set(key, t);
    } else if (type === "tunnel") {
      // Tunnel : 1 sprite pré-rendu (avant : base + 2 eyes = 3 entités → maintenant 1)
      const t = k.add([
        k.sprite("tunnel_visual"),
        k.pos(col * TILE, row * TILE),
        k.area(),
        k.z(2),
        "tile",
        "tunnel",
        { gridCol: col, gridRow: row, tileType: "tunnel", extras: [], cooldownUntil: 0 },
      ]);
      tileMap.set(key, t);
    } else if (type === "ground") {
      const top = k.add([
        k.sprite("ground_top"),
        k.pos(col * TILE, row * TILE),
        k.z(2),
      ]);
      const t = k.add([
        k.rect(TILE, TILE),
        k.pos(col * TILE, row * TILE),
        k.color(k.rgb(0, 0, 0)),
        k.opacity(0),
        k.area(),
        k.body({ isStatic: true }),
        k.z(2),
        "tile",
        "ground_tile",
        { gridCol: col, gridRow: row, tileType: "ground", extras: [top] },
      ]);
      tileMap.set(key, t);
    }
  }

  k.onUpdate("portal", (ring) => {
    ring.angle = (ring.angle || 0) + 120 * k.dt();
  });

  function explodeBomb(t) {
    if (!t || t.exploded) return;
    t.exploded = true;
    const col = t.gridCol, row = t.gridRow;
    const cx = col * TILE + TILE / 2;
    const cy = row * TILE + TILE / 2;
    audio.transform?.();
    window.__juice?.dirShake?.(0, 1, 10, 0.25);
    window.__juice?.hitStop?.(80);
    showPopup(cx, cy - 30, "BOOM !", k.rgb(255, 120, 40), 24);
    const pCount = entityCounts.particle || 0;
    if (pCount < 220) {
      for (let i = 0; i < 24; i++) {
        const a = (Math.PI * 2 * i) / 24;
        const sp = 160 + Math.random() * 140;
        k.add([
          k.circle(3 + Math.random() * 2),
          k.pos(cx, cy),
          k.color(k.rgb(255, 150 + Math.random() * 80, 40)),
          k.opacity(1),
          k.lifespan(0.55, { fade: 0.35 }),
          k.z(15),
          "particle-grav",
          { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, grav: 400 },
        ]);
      }
    }
    placeTile(col, row, "lava");
    const neighbors = [[col - 1, row], [col + 1, row], [col, row - 1], [col, row + 1]];
    for (const [nc, nr] of neighbors) {
      if (nr < 0 || nr >= GROUND_ROW) continue;
      const existing = tileMap.get(gridKey(nc, nr));
      if (existing?.tileType === "bomb" && !existing.exploded) {
        const chainT = existing;
        k.wait(0.15, () => explodeBomb(chainT));
      } else {
        placeTile(nc, nr, "lava");
      }
    }
  }

  function detonateAlarm(t) {
    if (!t || t.detonated) return;
    t.detonated = true;
    const cx = t.gridCol * TILE + TILE / 2;
    const cy = t.gridRow * TILE + TILE / 2;
    audio.combo?.();
    window.__juice?.dirShake?.(1, 0, 6, 0.25);
    const labels = { flood: "INONDATION !", freeze: "GEL !", wind: "BOURRASQUE !" };
    const colors = { flood: k.rgb(80, 180, 230), freeze: k.rgb(180, 230, 255), wind: k.rgb(200, 240, 180) };
    showPopup(cx, cy - 40, labels[t.variant] || "ALARME !", colors[t.variant], 24);
    if (t.variant === "flood") {
      const lavaPositions = [];
      for (const tile of tileMap.values()) {
        if (tile.tileType === "lava") lavaPositions.push({ col: tile.gridCol, row: tile.gridRow });
      }
      for (const p of lavaPositions) placeTile(p.col, p.row, "water");
      k.wait(5, () => {
        for (const p of lavaPositions) {
          const existing = tileMap.get(gridKey(p.col, p.row));
          if (existing && existing.tileType === "water") placeTile(p.col, p.row, "lava");
        }
      });
    } else if (t.variant === "freeze") {
      const until = k.time() + 3;
      for (const w of k.get("wagon")) w.frozenUntil = until;
    } else if (t.variant === "wind") {
      const until = k.time() + 2;
      for (const w of k.get("wagon")) w.windUntil = until;
    }
    placeTile(t.gridCol, t.gridRow, "erase");
  }

  k.onUpdate("alarm", (t) => {
    if (t.detonated) return;
    if (k.time() >= t.triggerAt) detonateAlarm(t);
  });

  k.onDraw(() => {
    for (const t of k.get("alarm")) {
      if (t.detonated) continue;
      const remaining = Math.max(0, t.triggerAt - k.time());
      k.drawText({
        text: t.alarmIcon || "⏱",
        pos: k.vec2(t.pos.x + TILE / 2, t.pos.y + 4),
        size: 18,
        anchor: "top",
      });
      k.drawText({
        text: remaining <= 0.05 ? "0" : Math.ceil(remaining).toString(),
        pos: k.vec2(t.pos.x + TILE / 2, t.pos.y + TILE - 4),
        size: 12,
        anchor: "bot",
        color: remaining < 3 ? k.rgb(200, 40, 40) : k.rgb(20, 20, 40),
      });
    }
  });

  k.onUpdate("bomb", (t) => {
    if (t.exploded) return;
    // AABB wagon / tile (wagon ~60×40, tile 32×32)
    for (const w of _cachedWagons) {
      if (w.pos.x + 60 > t.pos.x && w.pos.x < t.pos.x + TILE &&
          w.pos.y + 40 > t.pos.y && w.pos.y < t.pos.y + TILE) {
        explodeBomb(t);
        return;
      }
    }
    // Fuse ember particle périodique
    t._fuseCd = (t._fuseCd || 0) - k.dt();
    if (t._fuseCd <= 0 && (entityCounts.particle || 0) < 180) {
      t._fuseCd = 0.25 + Math.random() * 0.15;
      k.add([
        k.circle(1 + Math.random() * 1.5),
        k.pos(t.pos.x + 16 + (Math.random() - 0.5) * 3, t.pos.y + 2),
        k.color(k.rgb(255, 200 + Math.random() * 40, 80)),
        k.opacity(1),
        k.lifespan(0.5, { fade: 0.3 }),
        k.z(12),
        "particle",
        { vx: (Math.random() - 0.5) * 15, vy: -30 - Math.random() * 20 },
      ]);
    }
  });

  k.onUpdate("coin", (t) => {
    t.pos.y = t.baseY + Math.sin(k.time() * 2.5 + t.coinPhase) * 3;
    if (t.extras && t.extras[0]) {
      t.extras[0].pos.y = t.pos.y;
      t.extras[0].width = 2 + Math.abs(Math.cos(k.time() * 4 + t.coinPhase)) * 5;
    }
  });

  k.loop(0.2, () => {
    const pCount = entityCounts.particle;
    for (const t of tileMap.values()) {
      if (t.tileType === "lava") {
        if (pCount < 260 && Math.random() < 0.4) {
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
        }
      } else if (t.tileType === "water" && t.cascadeActive) {
        if (Math.random() < 0.6) {
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
        const botTile = tileMap.get(gridKey(t.gridCol, t.gridRow + 1));
        if (!botTile && Math.random() < 0.25) {
          k.add([
            k.circle(4 + Math.random() * 3),
            k.pos(t.pos.x + Math.random() * TILE, t.pos.y + TILE - 4),
            k.color(k.rgb(80, 210, 240)),
            k.opacity(0.7),
            k.lifespan(0.5, { fade: 0.3 }),
            k.z(3),
          ]);
        }
      } else if (t.tileType === "coin") {
        t._sparkleCd -= 0.2;
        if (t._sparkleCd <= 0) {
          t._sparkleCd = 1.5 + Math.random() * 2;
          if (pCount < 250) {
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
          }
        }
      } else if (t.tileType === "fan") {
        if (pCount < 270 && Math.random() < 0.35) {
          k.add([
            k.circle(2 + Math.random() * 2),
            k.pos(t.pos.x + 6 + Math.random() * 20, t.pos.y + 2),
            k.color(k.rgb(230, 240, 255)),
            k.opacity(0.7),
            k.lifespan(0.6, { fade: 0.4 }),
            k.z(2),
            "fan-puff",
            { vy: -60 - Math.random() * 50, vx: (Math.random() - 0.5) * 20 },
          ]);
        }
      } else if (t.tileType === "bridge" && (t.crossings || 0) >= 1 && !t.breaking) {
        const pulse = 0.5 + 0.5 * Math.sin(k.time() * 8);
        if (t.extras && t.extras[0] && t.extras[0].exists?.()) {
          // Opacity pulse de l'overlay rouge — 0.35 à 0.75 visible danger
          t.extras[0].opacity = 0.35 + pulse * 0.4;
        }
      }
    }
  });

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
      } else if (b.tileType === "lava" && b.temporary && k.time() > b.temporary) {
        if (b.extras) b.extras.forEach((e) => k.destroy(e));
        k.destroy(b);
        tileMap.delete(key);
        spawnSteamBurst(b.gridCol, b.gridRow);
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
        window.__spectres?.unlock("magnet_field");
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

  function detectMetronomes() {
    const result = [];
    for (const [, t] of tileMap) {
      if (t.tileType !== "boost") continue;
      const bottomBoost = tileMap.get(gridKey(t.gridCol, t.gridRow + 4));
      if (!bottomBoost || bottomBoost.tileType !== "boost") continue;
      let hasLava = false;
      for (let r = t.gridRow + 1; r <= t.gridRow + 3; r++) {
        const between = tileMap.get(gridKey(t.gridCol, r));
        if (between?.tileType === "lava") { hasLava = true; break; }
      }
      if (!hasLava) continue;
      result.push({ col: t.gridCol, topRow: t.gridRow, bottomRow: t.gridRow + 4 });
    }
    return result;
  }

  function detectLavaTriangles() {
    const result = [];
    for (const [, t] of tileMap) {
      if (t.tileType !== "lava") continue;
      // Pattern ▲ : t est sommet supérieur, 2 lava en bas-gauche et bas-droite
      const left = tileMap.get(gridKey(t.gridCol, t.gridRow + 1));
      const right = tileMap.get(gridKey(t.gridCol + 1, t.gridRow + 1));
      if (left?.tileType === "lava" && right?.tileType === "lava") {
        const cx = (t.gridCol + 0.5) * TILE;
        const cy = (t.gridRow + 1) * TILE;
        result.push({ cx, cy, key: `${t.gridCol},${t.gridRow}-up` });
        if (result.length >= 2) break;
      }
      // Pattern ▽ : t est sommet inférieur centre, 2 lava au-dessus gauche/droite
      const ul = tileMap.get(gridKey(t.gridCol - 1, t.gridRow - 1));
      const ur = tileMap.get(gridKey(t.gridCol + 1, t.gridRow - 1));
      if (ul?.tileType === "lava" && ur?.tileType === "lava") {
        const cx = t.gridCol * TILE + TILE / 2;
        const cy = t.gridRow * TILE;
        result.push({ cx, cy, key: `${t.gridCol},${t.gridRow}-dn` });
        if (result.length >= 2) break;
      }
    }
    return result;
  }

  function detectIceCrowns() {
    const result = [];
    for (const [, t] of tileMap) {
      if (t.tileType !== "magnet") continue;
      const n = tileMap.get(gridKey(t.gridCol, t.gridRow - 1));
      const s = tileMap.get(gridKey(t.gridCol, t.gridRow + 1));
      const e = tileMap.get(gridKey(t.gridCol + 1, t.gridRow));
      const w = tileMap.get(gridKey(t.gridCol - 1, t.gridRow));
      if (n?.tileType === "ice" && s?.tileType === "ice" && e?.tileType === "ice" && w?.tileType === "ice") {
        result.push({
          centerCol: t.gridCol,
          centerRow: t.gridRow,
          cx: t.gridCol * TILE + TILE / 2,
          cy: t.gridRow * TILE + TILE / 2,
          radius: 5 * TILE,
        });
      }
    }
    return result;
  }

  return { placeTile, checkCoinResonance, checkCascade, detectMagnetFields, detectGeysers, detectIceRinks, detectMagnetPortals, detectMetronomes, detectLavaTriangles, detectIceCrowns };
}

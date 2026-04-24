import { TILE, HEIGHT, gridKey } from "./constants.js";

export function createComboSystem({ k, tileMap, gameState, audio, showPopup, showComboPopup, spectres, save, persistSave, placeTile }) {
  const DEFS = [];
  const BY_TRIGGER_PLACE = new Map();
  const BY_TRIGGER_WAGON = [];
  const BY_TRIGGER_MANUAL = new Map();

  function registerCombo(def) {
    DEFS.push(def);
    if (def.triggerType === "place") {
      for (const t of def.triggerTiles) {
        if (!BY_TRIGGER_PLACE.has(t)) BY_TRIGGER_PLACE.set(t, []);
        BY_TRIGGER_PLACE.get(t).push(def);
      }
    } else if (def.triggerType === "wagon-tick") {
      BY_TRIGGER_WAGON.push(def);
    } else if (def.triggerType === "manual") {
      BY_TRIGGER_MANUAL.set(def.id, def);
    }
  }

  function spawnBurst(cx, cy, color, count) {
    const pCount = window.__entityCounts?.particle || 0;
    if (pCount >= 280) return;
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count;
      k.add([
        k.circle(3 + Math.random() * 2),
        k.pos(cx, cy),
        k.color(k.rgb(color[0], color[1], color[2])),
        k.opacity(1),
        k.lifespan(0.7, { fade: 0.5 }),
        k.z(15),
        "particle-grav",
        { vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 - 30, grav: 200 },
      ]);
    }
  }

  function fireCombo(def, ctx) {
    const isNew = !(save.combos & (1 << def.bitIndex));
    if (isNew) {
      save.combos |= (1 << def.bitIndex);
      persistSave(save);
      showComboPopup(`DECOUVERT ! ${def.name}`, def.color, def.score, { fanfare: true });
      audio.gold?.();
      const cp = k.camPos();
      spawnBurst(cp.x, cp.y - HEIGHT / 4, def.color, 12);
    } else {
      showComboPopup(def.name, def.color, def.score);
      audio.combo?.();
    }
    if (def.score > 0) gameState.score += def.score;
    def.apply({ k, ctx, gameState, tileMap, audio, showPopup, spectres, def, spawnBurst });
  }

  function checkCombos(col, row, placedType) {
    const defs = BY_TRIGGER_PLACE.get(placedType);
    if (!defs) return;
    for (const def of defs) {
      const ctx = def.test(tileMap, col, row);
      if (ctx) fireCombo(def, ctx);
    }
  }

  function tickWagon(wagon) {
    wagon._comboCdUntil ||= {};
    for (const def of BY_TRIGGER_WAGON) {
      if ((wagon._comboCdUntil[def.id] || 0) > k.time()) continue;
      const ctx = def.test(tileMap, wagon, k);
      if (ctx) {
        wagon._comboCdUntil[def.id] = k.time() + (def.debounce || 1);
        fireCombo(def, { ...ctx, wagon });
      }
    }
  }

  function manualFire(defId, ctx) {
    const def = BY_TRIGGER_MANUAL.get(defId);
    if (def) fireCombo(def, ctx || {});
  }

  function listCombos() { return DEFS; }

  function isDiscovered(id) {
    const def = DEFS.find((d) => d.id === id);
    return def ? !!(save.combos & (1 << def.bitIndex)) : false;
  }

  // ─── DEFS ──────────────────────────────────────────────────────────────────

  registerCombo({
    id: "gold_chain",
    bitIndex: 0,
    name: "CHAINE D'OR",
    color: [255, 220, 60],
    score: 0,
    difficulty: 2,
    triggerType: "place",
    triggerTiles: ["coin"],
    codexEmoji: "💰",
    codexDesc: "Aligne 3 pieces en diagonale",
    codexTiles: ["coin x3 diag"],
    test(tm, col, row) {
      const isCoin = (c, r) => tm.get(gridKey(c, r))?.tileType === "coin";
      for (const [dx, dy] of [[1, -1], [1, 1]]) {
        for (let off = -2; off <= 0; off++) {
          const c0 = col + off * dx, r0 = row + off * dy;
          if (isCoin(c0, r0) && isCoin(c0 + dx, r0 + dy) && isCoin(c0 + 2 * dx, r0 + 2 * dy)) {
            return { cells: [[c0, r0], [c0 + dx, r0 + dy], [c0 + 2 * dx, r0 + 2 * dy]] };
          }
        }
      }
      return null;
    },
    apply({ k: _k, ctx, gameState: gs, spectres: sp, spawnBurst: sb }) {
      window.__tiers?.onChain?.();
      window.__campaign?.progress?.("chain"); window.__contract?.progress?.("chain");
      sp?.unlock?.("gold_chain");
      gs.comboExpire = _k.time() + 4;
      if (gs.comboCount < 2) gs.comboCount = 2;
      for (const [tc, tr] of ctx.cells) {
        sb(tc * TILE + TILE / 2, tr * TILE + TILE / 2, [255, 230, 80], 8);
      }
    },
  });

  registerCombo({
    id: "cascade",
    bitIndex: 1,
    name: "CASCADE !",
    color: [80, 180, 230],
    score: 0,
    difficulty: 2,
    triggerType: "place",
    triggerTiles: ["water"],
    codexEmoji: "💧",
    codexDesc: "3 eaux empilees au-dessus de lave",
    codexTiles: ["water x3", "lava"],
    test(tm, col, row) {
      let topRow = row;
      while (tm.get(gridKey(col, topRow - 1))?.tileType === "water") topRow--;
      let h = 0, r = topRow;
      while (tm.get(gridKey(col, r))?.tileType === "water") { h++; r++; }
      if (h < 3) return null;
      return { col, topRow, height: h, bottomRow: r };
    },
    apply({ k: _k, ctx, tileMap: tm, audio: au, showPopup: sp2 }) {
      const { col, topRow, height } = ctx;
      for (let i = 0; i < height; i++) {
        const t = tm.get(gridKey(col, topRow + i));
        if (t) t.cascadeActive = true;
      }
      sp2(col * TILE + TILE / 2, topRow * TILE - 16, "CASCADE !", _k.rgb(80, 180, 230), 18);
      const bottomTile = tm.get(gridKey(col, topRow + height));
      if (bottomTile?.tileType === "lava") {
        placeTile?.(col, topRow + height, "bridge");
        const newBridge = tm.get(gridKey(col, topRow + height));
        if (newBridge) newBridge.temporary = _k.time() + 8;
        const cx = col * TILE + TILE / 2;
        const cy = (topRow + height) * TILE + TILE / 2;
        const pCount = window.__entityCounts?.particle || 0;
        if (pCount < 260) {
          for (let i = 0; i < 12; i++) {
            _k.add([
              _k.circle(3 + Math.random() * 3),
              _k.pos(cx + (Math.random() - 0.5) * TILE, cy),
              _k.color(_k.rgb(210, 230, 240)),
              _k.opacity(0.75),
              _k.lifespan(0.9, { fade: 0.6 }),
              _k.z(4),
              "steam",
              { vy: -60 - Math.random() * 60, vx: (Math.random() - 0.5) * 40 },
            ]);
          }
        }
      }
    },
  });

  registerCombo({
    id: "geyser",
    bitIndex: 2,
    name: "GEYSER !",
    color: [100, 220, 255],
    score: 30,
    difficulty: 2,
    triggerType: "wagon-tick",
    debounce: 1,
    codexEmoji: "💨",
    codexDesc: "Wagon dans la colonne fan + eau",
    codexTiles: ["fan", "water"],
    test(tm, wagon) {
      const wCol = Math.floor((wagon.pos.x + 30) / TILE);
      let fanT = null;
      for (let r = 0; r < 14; r++) {
        const t = tm.get(gridKey(wCol, r));
        if (t?.tileType === "fan") { fanT = t; break; }
      }
      if (!fanT) return null;
      const waterAbove = tm.get(gridKey(wCol, fanT.gridRow - 1));
      if (!waterAbove || waterAbove.tileType !== "water") return null;
      const wRow = Math.floor((wagon.pos.y + 15) / TILE);
      if (wRow < fanT.gridRow - 3 || wRow > fanT.gridRow) return null;
      return { col: wCol, fanRow: fanT.gridRow };
    },
    apply({ ctx, gameState: gs }) {
      const { wagon } = ctx;
      if (wagon.vel) wagon.vel.y = -300;
      window.__campaign?.progress?.("geyser"); window.__contract?.progress?.("geyser");
      window.__spectres?.unlock?.("geyser_master");
      if ((gs.geysers?.length || 0) === 0) window.__tiers?.onGeyser?.();
    },
  });

  registerCombo({
    id: "ice_rink",
    bitIndex: 3,
    name: "PATINOIRE !",
    color: [180, 230, 255],
    score: 20,
    difficulty: 2,
    triggerType: "wagon-tick",
    debounce: 0.7,
    codexEmoji: "🧊",
    codexDesc: "Wagon traverse 3 glaces alignees",
    codexTiles: ["ice x3"],
    test(tm, wagon) {
      const wCol = Math.floor((wagon.pos.x + 30) / TILE);
      const wRow = Math.floor((wagon.pos.y + 40) / TILE);
      let start = wCol;
      while (tm.get(gridKey(start - 1, wRow))?.tileType === "ice") start--;
      let len = 0;
      while (tm.get(gridKey(start + len, wRow))?.tileType === "ice") len++;
      if (len < 3) return null;
      if (wCol < start || wCol >= start + len) return null;
      return { startCol: start, row: wRow, len };
    },
    apply({ k: _k, ctx }) {
      const { wagon, len } = ctx;
      wagon.glideUntil = _k.time() + 0.8;
      wagon.glideBonus = (len - 2) * 30;
    },
  });

  registerCombo({
    id: "vortex",
    bitIndex: 4,
    name: "VORTEX !",
    color: [180, 80, 240],
    score: 25,
    difficulty: 3,
    triggerType: "wagon-tick",
    debounce: 1,
    codexEmoji: "🌀",
    codexDesc: "Portail adjacent a un aimant attire le wagon",
    codexTiles: ["portal", "magnet"],
    test(tm, wagon) {
      if (wagon.rider) return null;
      for (const [, t] of tm) {
        if (t.tileType !== "portal") continue;
        let hasNearMagnet = false;
        outer: for (let dc = -2; dc <= 2; dc++) {
          for (let dr = -2; dr <= 2; dr++) {
            if (Math.abs(dc) + Math.abs(dr) > 2 || (dc === 0 && dr === 0)) continue;
            if (tm.get(gridKey(t.gridCol + dc, t.gridRow + dr))?.tileType === "magnet") {
              hasNearMagnet = true; break outer;
            }
          }
        }
        if (!hasNearMagnet) continue;
        const px = t.pos.x + TILE / 2;
        const py = t.pos.y + TILE / 2;
        const dx = px - (wagon.pos.x + 30);
        const dy = py - (wagon.pos.y + 15);
        const dist = Math.hypot(dx, dy);
        if (dist < 3 * TILE && dist > TILE * 0.4) {
          return { px, py, dx, dy, dist };
        }
      }
      return null;
    },
    apply({ k: _k, ctx }) {
      const { wagon, px, py } = ctx;
      wagon._vortexTarget = { px, py, until: _k.time() + 1 };
      window.__tiers?.onVortex?.();
      window.__campaign?.progress?.("magnetField"); window.__contract?.progress?.("magnetField");
    },
  });

  registerCombo({
    id: "metronome",
    bitIndex: 5,
    name: "METRONOME INFERNAL ! x2",
    color: [255, 80, 80],
    score: 0,
    difficulty: 3,
    triggerType: "wagon-tick",
    debounce: 3,
    codexEmoji: "⚡",
    codexDesc: "2 boosts verticaux avec lave entre eux en moins de 0.8s",
    codexTiles: ["boost x2", "lava"],
    test(tm, wagon, kk) {
      const wCol = Math.floor((wagon.pos.x + 30) / TILE);
      const wRow = Math.floor((wagon.pos.y + 30) / TILE);
      for (let r = 0; r < 14; r++) {
        const topBoost = tm.get(gridKey(wCol, r));
        if (topBoost?.tileType !== "boost") continue;
        const botBoost = tm.get(gridKey(wCol, r + 4));
        if (botBoost?.tileType !== "boost") continue;
        let hasLava = false;
        for (let rr = r + 1; rr <= r + 3; rr++) {
          if (tm.get(gridKey(wCol, rr))?.tileType === "lava") { hasLava = true; break; }
        }
        if (!hasLava) continue;
        if (wRow === r && !wagon._metroEntry) {
          wagon._metroEntry = kk.time();
          wagon._metroTopRow = r;
          wagon._metroBottomRow = r + 4;
          return null;
        }
        if (wRow === r + 4 && wagon._metroEntry && kk.time() - wagon._metroEntry < 0.8) {
          wagon._metroEntry = null;
          return { col: wCol, topRow: r, bottomRow: r + 4 };
        }
        if (wRow > r + 5) wagon._metroEntry = null;
      }
      return null;
    },
    apply({ k: _k, gameState: gs, audio: au, showPopup: sp2 }) {
      gs.scoreMultiplier = 2;
      gs.scoreMultiplierUntil = _k.time() + 3;
      for (const w of _k.get("wagon")) {
        w.boostUntil = Math.max(w.boostUntil || 0, _k.time() + 3);
      }
      for (let i = 0; i < 4; i++) {
        _k.wait(i * 0.083, () => {
          window.__juice?.dirShake(0, 1, 6, 0.08);
          au.combo?.();
        });
      }
      window.__campaign?.progress?.("metronome"); window.__contract?.progress?.("metronome");
    },
  });

  registerCombo({
    id: "apocalypse",
    bitIndex: 6,
    name: "APOCALYPSE !",
    color: [255, 80, 80],
    score: 0,
    difficulty: 5,
    triggerType: "manual",
    codexEmoji: "💀",
    codexDesc: "5 combos en moins de 2.5 secondes",
    codexTiles: ["combo x5"],
    test() { return {}; },
    apply() {},
  });

  registerCombo({
    id: "dette_fantome",
    bitIndex: 7,
    name: "DETTE FANTOME",
    color: [180, 100, 255],
    score: 0,
    difficulty: 3,
    triggerType: "manual",
    codexEmoji: "👻",
    codexDesc: "Un spectre fantome entre dans le wagon",
    codexTiles: ["ghost"],
    test() { return {}; },
    apply() {},
  });

  registerCombo({
    id: "test",
    bitIndex: 31,
    name: "TEST",
    color: [200, 200, 200],
    score: 0,
    difficulty: 1,
    triggerType: "manual",
    codexEmoji: "🧪",
    codexDesc: "Combo de test interne",
    codexTiles: ["?"],
    test() { return {}; },
    apply() {},
  });

  // ─── 6 NOUVEAUX COMBOS difficulty 1-2 ─────────────────────────────────────

  registerCombo({
    id: "obsidienne",
    bitIndex: 8,
    name: "OBSIDIENNE !",
    color: [80, 80, 100],
    score: 20,
    difficulty: 1,
    triggerType: "place",
    triggerTiles: ["lava", "water"],
    codexEmoji: "🪨",
    codexDesc: "Lave et eau adjacentes se solidifient en sol",
    codexTiles: ["lava", "water"],
    test(tm, col, row) {
      const type = tm.get(gridKey(col, row))?.tileType;
      if (!type) return null;
      const pairs = { lava: "water", water: "lava" };
      const target = pairs[type];
      if (!target) return null;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nb = tm.get(gridKey(col + dc, row + dr));
        if (nb?.tileType === target) {
          return { col, row, adjCol: col + dc, adjRow: row + dr };
        }
      }
      return null;
    },
    apply({ k: _k, ctx, spawnBurst: sb }) {
      const { col, row, adjCol, adjRow } = ctx;
      const cx1 = col * TILE + TILE / 2;
      const cy1 = row * TILE + TILE / 2;
      const cx2 = adjCol * TILE + TILE / 2;
      const cy2 = adjRow * TILE + TILE / 2;
      for (let i = 0; i < 10; i++) {
        _k.add([
          _k.circle(2 + Math.random() * 2),
          _k.pos(cx1 + (Math.random() - 0.5) * TILE, cy1),
          _k.color(_k.rgb(180, 180, 200)),
          _k.opacity(0.8),
          _k.lifespan(0.8, { fade: 0.5 }),
          _k.z(4),
          "steam",
          { vy: -50 - Math.random() * 50, vx: (Math.random() - 0.5) * 30 },
        ]);
      }
      sb(cx2, cy2, [80, 80, 120], 8);
    },
  });

  registerCombo({
    id: "fissure",
    bitIndex: 9,
    name: "FISSURE !",
    color: [255, 100, 30],
    score: 30,
    difficulty: 1,
    triggerType: "place",
    triggerTiles: ["lava"],
    codexEmoji: "💥",
    codexDesc: "4 laves alignees horizontalement font glisser les wagons",
    codexTiles: ["lava x4 ligne"],
    test(tm, col, row) {
      const isLava = (c, r) => tm.get(gridKey(c, r))?.tileType === "lava";
      let start = col;
      while (isLava(start - 1, row)) start--;
      let len = 0;
      while (isLava(start + len, row)) len++;
      if (len < 4) return null;
      return { startCol: start, row, len };
    },
    apply({ k: _k, ctx, gameState: gs, spawnBurst: sb }) {
      const { startCol, row, len } = ctx;
      const wagons = _k.get("wagon");
      for (const w of wagons) {
        const wRow = Math.floor((w.pos.y + 40) / TILE);
        if (wRow === row) w.slideUntil = (_k.time() || 0) + 0.6;
      }
      window.__juice?.dirShake(0, 1, 8, 0.1);
      for (let i = 0; i < len; i++) {
        sb((startCol + i) * TILE + TILE / 2, row * TILE + TILE / 2, [255, 120, 40], 4);
      }
    },
  });

  registerCombo({
    id: "plume_ascension",
    bitIndex: 10,
    name: "PLUME D'ASCENSION !",
    color: [100, 200, 255],
    score: 10,
    difficulty: 1,
    triggerType: "place",
    triggerTiles: ["coin", "fan"],
    codexEmoji: "🪶",
    codexDesc: "Fan sous une piece : la piece flotte plus haut",
    codexTiles: ["fan", "coin"],
    test(tm, col, row) {
      const t = tm.get(gridKey(col, row));
      if (!t) return null;
      if (t.tileType === "coin") {
        const below = tm.get(gridKey(col, row + 1));
        if (below?.tileType === "fan") return { coinCol: col, coinRow: row };
      }
      if (t.tileType === "fan") {
        const above = tm.get(gridKey(col, row - 1));
        if (above?.tileType === "coin") return { coinCol: col, coinRow: row - 1 };
      }
      return null;
    },
    apply({ k: _k, ctx, tileMap: tm, spawnBurst: sb }) {
      const { coinCol, coinRow } = ctx;
      const coinTile = tm.get(gridKey(coinCol, coinRow));
      if (coinTile) {
        coinTile._lifted = true;
        coinTile._liftBonus = 30;
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
          _k.lifespan(0.6, { fade: 0.4 }),
          _k.z(4),
          "fan-puff",
          { vy: -80 - Math.random() * 40, vx: Math.cos(a) * 30 },
        ]);
      }
    },
  });

  registerCombo({
    id: "catapulte_doree",
    bitIndex: 11,
    name: "CATAPULTE DOREE !",
    color: [255, 180, 40],
    score: 50,
    difficulty: 2,
    triggerType: "place",
    triggerTiles: ["coin"],
    codexEmoji: "🏹",
    codexDesc: "Trampoline + fan au-dessus + piece : catapulte doree",
    codexTiles: ["trampoline", "fan", "coin"],
    test(tm, col, row) {
      const t = tm.get(gridKey(col, row));
      if (t?.tileType !== "coin") return null;
      let hasTramp = false;
      let hasFan = false;
      for (let dr = -3; dr <= 3; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const nb = tm.get(gridKey(col + dc, row + dr));
          if (nb?.tileType === "trampoline") hasTramp = true;
          if (nb?.tileType === "fan") hasFan = true;
        }
      }
      if (!hasTramp || !hasFan) return null;
      return { col, row };
    },
    apply({ k: _k, ctx, spawnBurst: sb }) {
      const { col, row } = ctx;
      const cx = col * TILE + TILE / 2;
      const cy = row * TILE + TILE / 2;
      for (let i = 0; i < 3; i++) {
        _k.wait(i * 0.12, () => {
          sb(cx + (Math.random() - 0.5) * TILE * 2, cy - i * 20, [255, 200, 60], 6);
        });
      }
    },
  });

  registerCombo({
    id: "backflip",
    bitIndex: 12,
    name: "BACKFLIP !",
    color: [150, 255, 150],
    score: 0,
    difficulty: 2,
    triggerType: "place",
    triggerTiles: ["rail_loop"],
    codexEmoji: "🤸",
    codexDesc: "Rail montant directement adjacent a un loop",
    codexTiles: ["rail_up", "rail_loop"],
    test(tm, col, row) {
      const t = tm.get(gridKey(col, row));
      if (t?.tileType !== "rail_loop") return null;
      for (let dc = -2; dc <= -1; dc++) {
        const nb = tm.get(gridKey(col + dc, row));
        if (nb?.tileType === "rail_up") return { loopCol: col, loopRow: row, upCol: col + dc };
      }
      return null;
    },
    apply({ k: _k, ctx, spawnBurst: sb }) {
      const { loopCol, loopRow } = ctx;
      const cx = loopCol * TILE + TILE / 2;
      const cy = loopRow * TILE + TILE / 2;
      const colors = [[255, 80, 80], [80, 255, 80], [80, 80, 255], [255, 255, 80]];
      for (let i = 0; i < 4; i++) {
        _k.wait(i * 0.08, () => sb(cx, cy - i * 15, colors[i % colors.length], 4));
      }
    },
  });

  registerCombo({
    id: "teleport_or",
    bitIndex: 13,
    name: "TELEPORT D'OR !",
    color: [255, 240, 80],
    score: 20,
    difficulty: 2,
    triggerType: "place",
    triggerTiles: ["coin", "portal"],
    codexEmoji: "✨",
    codexDesc: "Piece entre deux portails pairies : piece doree",
    codexTiles: ["portal", "coin", "portal"],
    test(tm, col, row) {
      const t = tm.get(gridKey(col, row));
      if (!t) return null;
      let coinCol = -1, coinRow = -1;
      if (t.tileType === "coin") { coinCol = col; coinRow = row; }
      else if (t.tileType === "portal") {
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nb = tm.get(gridKey(col + dc, row + dr));
          if (nb?.tileType === "coin") { coinCol = col + dc; coinRow = row + dr; break; }
        }
      }
      if (coinCol < 0) return null;
      let portalCount = 0;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0]]) {
        const nb = tm.get(gridKey(coinCol + dc, coinRow + dr));
        if (nb?.tileType === "portal") portalCount++;
      }
      if (portalCount < 2) return null;
      return { coinCol, coinRow };
    },
    apply({ k: _k, ctx, tileMap: tm, spawnBurst: sb }) {
      const { coinCol, coinRow } = ctx;
      const coinTile = tm.get(gridKey(coinCol, coinRow));
      if (coinTile) coinTile._golden = true;
      const cx = coinCol * TILE + TILE / 2;
      const cy = coinRow * TILE + TILE / 2;
      sb(cx, cy, [255, 240, 80], 8);
    },
  });

  return { registerCombo, checkCombos, tickWagon, manualFire, listCombos, isDiscovered, spawnBurst };
}

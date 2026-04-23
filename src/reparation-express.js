import { TILE, WIDTH } from "./constants.js";

export function createReparationExpress({
  k, audio, showPopup, gameState, getActivePlayers, tileMap,
}) {
  let active = null;
  let nextSpawnAt = k.time() + 20 + Math.random() * 10;
  let timerObj = null;

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

  function startBreak(tile) {
    tile.broken = true;
    tile._origColor = { r: tile.color.r, g: tile.color.g, b: tile.color.b };
    tile.color = k.rgb(180, 60, 40);
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

    timerObj = k.add([
      k.pos(cx, cy - 6),
      k.z(20),
      { tile, endAt: k.time() + 10 },
    ]);
    timerObj.onDraw = function () {
      const rem = Math.max(0, this.endAt - k.time());
      const txt = rem <= 0.05 ? "0" : Math.ceil(rem).toString();
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        k.drawText({ text: txt, size: 14, pos: k.vec2(dx, dy), anchor: "bot", color: k.rgb(0, 0, 0) });
      }
      k.drawText({
        text: txt, size: 14, pos: k.vec2(0, 0), anchor: "bot",
        color: rem < 3 ? k.rgb(255, 80, 60) : k.rgb(255, 230, 80),
      });
    };

    active = { tile, startAt: k.time(), endAt: k.time() + 10, sparkLoop, timerObj, cx, cy };
  }

  function endBreak(success, byPlayer) {
    if (!active) return;
    const { tile, sparkLoop, cx, cy } = active;
    const localTimerObj = active.timerObj;
    tile.broken = false;
    if (tile._origColor) tile.color = k.rgb(tile._origColor.r, tile._origColor.g, tile._origColor.b);
    if (tile.extras) {
      for (const ext of tile.extras) {
        if (!ext.exists?.()) continue;
        if (ext._origColor) ext.color = k.rgb(ext._origColor.r, ext._origColor.g, ext._origColor.b);
      }
    }
    sparkLoop?.cancel?.();
    if (localTimerObj?.exists?.()) k.destroy(localTimerObj);

    if (success && byPlayer) {
      audio.combo?.();
      gameState.score += 50;
      showPopup(cx, cy - 30, "+50 RÉPARÉ !", k.rgb(120, 240, 120), 22);
      k.add([
        k.rect(TILE + 8, TILE + 8),
        k.pos(tile.pos.x - 4, tile.pos.y - 4),
        k.color(k.rgb(120, 240, 120)),
        k.opacity(0.5),
        k.lifespan(0.2, { fade: 0.15 }),
        k.z(15),
      ]);
      byPlayer._repairStreak = (byPlayer._repairStreak || 0) + 1;
      if (byPlayer._repairStreak % 5 === 0) {
        gameState.score += 500;
        gameState.maintenanceBonusUntil = k.time() + 90;
        showPopup(cx, cy - 60, "MAINTENANCE PRO !", k.rgb(120, 255, 180), 28);
        (audio.apocalypse || audio.combo)?.();
      }
    } else {
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

    if (!success) {
      tile.broken = true;
      tile.color = k.rgb(140, 100, 90);
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

  function tryRepair(p) {
    if (!active) return false;
    if (p.isSkeleton) return false;
    if (p.stunnedUntil && k.time() < p.stunnedUntil) return false;
    const footCol = Math.floor((p.pos.x + 14) / TILE);
    const footRow = Math.floor((p.pos.y + 42) / TILE);
    const t = active.tile;
    if (footCol !== t.gridCol) return false;
    if (footRow !== t.gridRow && footRow !== t.gridRow - 1) return false;
    endBreak(true, p);
    return true;
  }

  function checkTick() {
    const now = k.time();
    if (active) {
      if (now >= active.endAt) endBreak(false, null);
      return;
    }
    if (now < nextSpawnAt) return;
    const hasTrainEvent = k.get("wagon").some(w => w.ghostTrain || w.inverseTrain);
    if (hasTrainEvent) { nextSpawnAt = now + 5; return; }
    const tile = pickRandomVisibleRail();
    if (!tile) { nextSpawnAt = now + 10; return; }
    startBreak(tile);
  }

  k.loop(0.5, checkTick);

  const api = {
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

  return api;
}

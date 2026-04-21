import { deserializeTiles } from "./serializer.js";
import { findLevel } from "./levels.js";
import { TILE } from "./constants.js";

export function createCampaignSystem({
  k, tileMap, gameState, save, persistSave,
  placeTile, groundSystem, spawnWagon, showPopup,
  onWin, onLose,
}) {
  let current = null;
  let wagonSpawnTimer = 0;

  function clearPlayfield() {
    tileMap.forEach((t) => {
      if (t.extras) t.extras.forEach((e) => { try { k.destroy(e); } catch (_) {} });
      try { k.destroy(t); } catch (_) {}
    });
    tileMap.clear();
    k.get("wagon").forEach((w) => {
      if (w.parts) w.parts.forEach((p) => { try { k.destroy(p); } catch (_) {} });
      try { k.destroy(w); } catch (_) {}
    });
    k.get("particle").forEach((p) => { try { k.destroy(p); } catch (_) {} });
  }

  function loadLevel(levelId) {
    const def = findLevel(levelId);
    if (!def) {
      console.error("Level not found:", levelId);
      return null;
    }
    clearPlayfield();
    try {
      deserializeTiles(def.layout, placeTile, (pairs) => groundSystem?.loadDugMap?.(pairs));
    } catch (e) {
      console.error("deserializeTiles failed for", levelId, e);
    }
    current = {
      def,
      startTime: k.time(),
      tilesPlaced: 0,
      progress: Object.fromEntries(def.objectives.map((o) => [o.id, 0])),
      status: "playing",
      endAt: 0,
      stars: 0,
    };
    wagonSpawnTimer = 0;
    gameState.score = 0;
    gameState.skeletons = 0;
    gameState.coins = 0;
    gameState.comboCount = 0;
    gameState.comboExpire = 0;
    const players = k.get("player");
    if (def.noPlayer) {
      for (const p of players) {
        try { k.destroy(p); } catch (_) {}
      }
    } else if (def.playerSpawn) {
      // Spawn le joueur haut dans les airs, il tombe naturellement sur le sol
      for (const p of players) {
        try {
          p.pos.x = def.playerSpawn.col * TILE;
          p.pos.y = 2 * TILE;
          if (p.vel) { p.vel.x = 0; p.vel.y = 0; }
        } catch (_) {}
      }
    }
    showLevelIntro(def);
    return current;
  }

  function showLevelIntro(def) {
    const existing = document.getElementById("level-intro");
    if (existing) existing.remove();
    const el = document.createElement("div");
    el.id = "level-intro";
    el.style.cssText = [
      "position:fixed", "top:50%", "left:50%", "transform:translate(-50%,-50%) scale(0.9)",
      "background:linear-gradient(180deg,#1e2840 0%,#0f1420 100%)",
      "border:3px solid #7cc947", "border-radius:14px",
      "padding:28px 36px", "min-width:340px", "max-width:80vw",
      "text-align:center", "color:#fff",
      "font-family:system-ui,sans-serif", "z-index:99000",
      "box-shadow:0 18px 50px rgba(0,0,0,0.7)",
      "animation:introIn 0.25s forwards",
      "pointer-events:none",
    ].join(";");
    const objLabels = def.objectives.map((o) => `<div style="color:#7cdc60;font-size:14px;margin:2px 0">▸ ${o.label}</div>`).join("");
    el.innerHTML = `
      <style>
        @keyframes introIn { from { opacity:0; transform:translate(-50%,-50%) scale(0.85) } to { opacity:1; transform:translate(-50%,-50%) scale(1) } }
        @keyframes introOut { from { opacity:1; transform:translate(-50%,-50%) scale(1) } to { opacity:0; transform:translate(-50%,-50%) scale(0.95) } }
      </style>
      <div style="color:#ffd23f;font-size:12px;letter-spacing:2px;margin-bottom:4px">NIVEAU ${def.world}-${def.id.split("-")[1]}</div>
      <div style="color:#fff;font-size:26px;font-weight:bold;letter-spacing:1px;margin-bottom:12px">${def.title}</div>
      <div style="color:#c8d8ff;font-size:14px;line-height:1.5;margin:10px 0 14px 0;max-width:440px">${def.hint || ""}</div>
      <div style="border-top:1px solid rgba(255,210,63,0.25);padding-top:10px;margin-top:10px">${objLabels}</div>
      ${def.tileBudget > 0 ? `<div style="color:#ffd23f;font-size:12px;margin-top:10px">🧰 Budget : ${def.tileBudget} tuiles max</div>` : ""}
      ${def.timeLimit > 0 ? `<div style="color:#ffd23f;font-size:12px;margin-top:4px">⏱ Temps : ${def.timeLimit}s max</div>` : ""}
    `;
    document.body.appendChild(el);
    setTimeout(() => {
      if (!el.parentNode) return;
      el.style.animation = "introOut 0.35s forwards";
      setTimeout(() => el.remove(), 400);
    }, 3500);
  }

  function progress(type, amount = 1) {
    if (!current || current.status !== "playing") return;
    const matching = current.def.objectives.filter((o) => o.type === type);
    if (matching.length === 0) return;
    for (const o of matching) {
      current.progress[o.id] = Math.min(o.target, (current.progress[o.id] || 0) + amount);
    }
    checkWin();
  }

  function onTileEvent() {
    if (!current || current.status !== "playing") return;
    current.tilesPlaced++;
    if (current.def.tileBudget > 0 && current.tilesPlaced > current.def.tileBudget) {
      current.status = "lost";
      current.endAt = k.time();
      onLose?.({ levelId: current.def.id, reason: "budget", tiles: current.tilesPlaced });
    }
  }

  function checkWin() {
    if (!current || current.status !== "playing") return;
    const allDone = current.def.objectives.every((o) => (current.progress[o.id] || 0) >= o.target);
    if (!allDone) return;
    const elapsed = k.time() - current.startTime;
    current.status = "won";
    current.endAt = k.time();
    current.stars = computeStars(current.def, elapsed, current.tilesPlaced);
    recordResult(current);
    onWin?.({
      levelId: current.def.id,
      stars: current.stars,
      time: elapsed,
      tiles: current.tilesPlaced,
    });
  }

  function computeStars(def, elapsed, tilesPlaced) {
    let stars = 1;
    if (def.stars?.time?.under && elapsed <= def.stars.time.under) stars++;
    if (def.stars?.efficient?.tilesUnder && tilesPlaced <= def.stars.efficient.tilesUnder) stars++;
    return Math.min(3, stars);
  }

  function recordResult(state) {
    if (!save.campaign) save.campaign = { levels: {}, lastPlayedLevel: null, totalStars: 0, unlockedWorlds: [1] };
    const prev = save.campaign.levels[state.def.id] || { stars: 0, bestTime: null, bestTiles: null, attempts: 0 };
    const elapsed = state.endAt - state.startTime;
    const newEntry = {
      stars: Math.max(prev.stars, state.stars),
      bestTime: prev.bestTime == null ? elapsed : Math.min(prev.bestTime, elapsed),
      bestTiles: prev.bestTiles == null ? state.tilesPlaced : Math.min(prev.bestTiles, state.tilesPlaced),
      attempts: (prev.attempts || 0) + 1,
    };
    save.campaign.levels[state.def.id] = newEntry;
    save.campaign.lastPlayedLevel = state.def.id;
    save.campaign.totalStars = Object.values(save.campaign.levels).reduce((s, l) => s + (l.stars || 0), 0);
    try { persistSave(save); } catch (e) { console.error("persistSave campaign", e); }
  }

  function tick(dt = 0.5) {
    if (!current || current.status !== "playing") return;
    const def = current.def;
    // Score objectives : comparer gameState.score au target
    let scoreUpdated = false;
    for (const obj of def.objectives) {
      if (obj.type === "score") {
        const clamped = Math.min(obj.target, Math.floor(gameState.score));
        if (current.progress[obj.id] !== clamped) {
          current.progress[obj.id] = clamped;
          scoreUpdated = true;
        }
      }
    }
    if (scoreUpdated) checkWin();
    if (def.timeLimit > 0) {
      const elapsed = k.time() - current.startTime;
      if (elapsed > def.timeLimit) {
        current.status = "lost";
        current.endAt = k.time();
        onLose?.({ levelId: def.id, reason: "time" });
        return;
      }
    }
    // Wagon auto-spawn selon le level
    if (def.wagonSpawn?.auto && spawnWagon) {
      wagonSpawnTimer += dt;
      const interval = def.wagonSpawn.interval || 6;
      const cap = def.wagonSpawn.cap || 1;
      if (wagonSpawnTimer >= interval) {
        wagonSpawnTimer = 0;
        const live = k.get("wagon").length;
        if (live < cap) {
          try { spawnWagon(false, false); } catch (e) { console.error("spawnWagon campaign", e); }
        }
      }
    }
  }

  function isAllowed(tool) {
    if (!current) return true;
    if (tool === "cursor") return true;
    return current.def.allowedTools.includes(tool);
  }

  function getCurrent() { return current; }

  function abort() {
    current = null;
  }

  return {
    loadLevel, progress, onTileEvent, tick, isAllowed,
    getCurrent, abort, computeStars,
  };
}

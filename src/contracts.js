import { VIPS, getVipById, pickContract } from "./vips.js";

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function daysSince(dateStr, today) {
  if (!dateStr) return Infinity;
  const a = new Date(dateStr).getTime();
  const b = new Date(today).getTime();
  if (isNaN(a) || isNaN(b)) return Infinity;
  return Math.max(0, Math.round((b - a) / 86400000));
}

export function pickDailyVips(save, date = new Date()) {
  const today = todayKey(date);
  const history = save.vipHistory || {};
  const pool = VIPS.filter((v) => daysSince(history[v.id], today) >= 7);
  const fallback = pool.length >= 3 ? pool : VIPS.slice();
  const seed = hashSeed(today + ":" + VIPS.length);
  const rng = mulberry32(seed);
  const ids = fallback.map((v) => v.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const chosen = ids.slice(0, 3);
  return chosen.map((id) => {
    const vip = getVipById(id);
    const contractIdx = Math.floor(rng() * (vip?.contracts?.length || 1));
    return { vipId: id, contractIdx, honored: false, failed: false };
  });
}

export function ensureVipToday(save, persistSave, date = new Date()) {
  const today = todayKey(date);
  if (!save.vipToday || save.vipToday.date !== today) {
    save.vipToday = { date: today, vips: pickDailyVips(save, date) };
    try { persistSave(save); } catch (_) {}
  }
  return save.vipToday;
}

export function getContractForEntry(entry) {
  if (!entry) return null;
  const vip = getVipById(entry.vipId);
  if (!vip) return null;
  return pickContract(vip, entry.contractIdx || 0);
}

export function createContractRunner({ k, save, persistSave, showPopup, WIDTH, HEIGHT, onHonored, onFailed }) {
  let active = null;
  let elapsed = 0;
  const counts = {};

  function start(entry) {
    const contract = getContractForEntry(entry);
    if (!contract) return null;
    active = { entry, contract, start: k.time(), status: "playing" };
    elapsed = 0;
    for (const key of Object.keys(counts)) delete counts[key];
    if (showPopup) {
      const vip = getVipById(entry.vipId);
      showPopup(WIDTH / 2, HEIGHT / 2 - 40, `CONTRAT : ${vip?.name || "VIP"}`, k.rgb(255, 210, 63), 28);
      showPopup(WIDTH / 2, HEIGHT / 2, contract.summary, k.rgb(200, 230, 255), 20);
    }
    return active;
  }

  function progress(type, amount = 1) {
    if (!active || active.status !== "playing") return;
    counts[type] = (counts[type] || 0) + amount;
    const failOn = active.contract.failOn || {};
    if (failOn[type] != null && counts[type] >= failOn[type]) {
      fail("forbid_" + type);
      return;
    }
    checkWin();
  }

  function onToolPlaced(tool) {
    if (!active || active.status !== "playing") return;
    const forbid = active.contract.forbidTools || [];
    if (forbid.includes(tool)) {
      fail("forbid_tool_" + tool);
      return;
    }
    counts.tilesPlaced = (counts.tilesPlaced || 0) + 1;
    const budget = active.contract.tileBudget || 0;
    if (budget > 0 && counts.tilesPlaced > budget) {
      fail("budget");
    }
  }

  function onWagonSpawned() {
    if (!active || active.status !== "playing") return;
    counts.wagonsSpawned = (counts.wagonsSpawned || 0) + 1;
    progress("wagon", 1);
    const limit = active.contract.wagonLimit || 0;
    if (limit > 0 && counts.wagonsSpawned > limit) {
      fail("wagon_limit");
    }
  }

  function checkWin() {
    if (!active || active.status !== "playing") return;
    const objs = active.contract.objectives || [];
    const done = objs.every((o) => (counts[o.type] || 0) >= o.target);
    if (!done) return;
    active.status = "won";
    const vip = getVipById(active.entry.vipId);
    const reward = active.contract.reward || 1;
    save.tickets = (save.tickets || 0) + reward;
    active.entry.honored = true;
    if (!save.almanac) save.almanac = [];
    save.almanac.push({
      vipId: active.entry.vipId,
      contractIdx: active.entry.contractIdx || 0,
      date: todayKey(new Date()),
      testimonial: active.contract.testimonial,
      reward,
    });
    if (!save.vipHistory) save.vipHistory = {};
    save.vipHistory[active.entry.vipId] = todayKey(new Date());
    try { persistSave(save); } catch (_) {}
    if (showPopup) {
      showPopup(WIDTH / 2, HEIGHT / 2 - 30, `CONTRAT HONORÉ ! +${reward} 🎫`, k.rgb(124, 201, 71), 32);
      showPopup(WIDTH / 2, HEIGHT / 2 + 10, vip?.name || "", k.rgb(255, 210, 63), 22);
    }
    onHonored?.({ vip, contract: active.contract, reward });
    active = null;
  }

  function fail(reason) {
    if (!active || active.status !== "playing") return;
    active.status = "failed";
    active.entry.failed = true;
    try { persistSave(save); } catch (_) {}
    if (showPopup) {
      showPopup(WIDTH / 2, HEIGHT / 2, "CONTRAT RATÉ", k.rgb(255, 90, 90), 28);
    }
    onFailed?.({ reason, contract: active.contract });
    active = null;
  }

  function tick(dt) {
    if (!active || active.status !== "playing") return;
    elapsed += dt;
    const tl = active.contract.timeLimit || 0;
    if (tl > 0 && elapsed > tl) fail("time");
  }

  function getActive() { return active; }
  function getElapsed() { return elapsed; }
  function getTimeLeft() {
    if (!active) return 0;
    const tl = active.contract.timeLimit || 0;
    if (tl === 0) return Infinity;
    return Math.max(0, tl - elapsed);
  }
  function getCounts() { return { ...counts }; }

  return {
    start, progress, onToolPlaced, onWagonSpawned,
    tick, getActive, getElapsed, getTimeLeft, getCounts,
  };
}

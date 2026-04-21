import { LEVELS, levelsByWorld } from "./levels.js";
import { getAvatarById } from "./avatars.js";

const MEDALS = ["🥇", "🥈", "🥉"];

function fmtTime(t) {
  if (t == null) return "--:--";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const WORLD_NAMES = {
  1: "Monde 1 — Premiers pas",
  2: "Monde 2 — Combos",
  3: "Monde 3 — Challenges",
  4: "Monde 4 — Experts",
  5: "Monde 5 — Énigmes",
  6: "Monde 6 — Mécaniques secrètes",
  7: "Monde 7 — Contrats VIP",
};

const WORLD_STAR_THRESHOLDS = { 1: 0, 2: 5, 3: 12, 4: 20, 5: 28, 6: 35, 7: 45 };

export function createCampaignMenu({ save, onSelectLevel, onBack }) {
  function isLevelUnlocked(levelId) {
    const idx = LEVELS.findIndex((l) => l.id === levelId);
    if (idx === -1) return false;
    if (idx === 0) return true;
    const lvl = LEVELS[idx];
    const threshold = WORLD_STAR_THRESHOLDS[lvl.world] || 0;
    const totalStars = save.campaign?.totalStars || 0;
    if (totalStars < threshold) return false;
    const prev = LEVELS[idx - 1];
    if (prev.world !== lvl.world) return true;
    const prevStars = save.campaign?.levels?.[prev.id]?.stars || 0;
    return prevStars >= 1;
  }

  function show() {
    const existing = document.getElementById("campaign-menu");
    if (existing) existing.remove();
    const overlay = document.createElement("div");
    overlay.id = "campaign-menu";
    overlay.style.cssText = [
      "position:fixed", "inset:0",
      "background:linear-gradient(180deg,#0f1b3a 0%,#050811 100%)",
      "overflow-y:auto", "z-index:99999", "font-family:system-ui,sans-serif",
      "animation:menuFadeIn 0.35s", "padding:18px 0",
    ].join(";");

    const totalStars = save.campaign?.totalStars || 0;
    const maxStars = LEVELS.length * 3;

    const worlds = levelsByWorld();
    const worldsHtml = Array.from(worlds.entries()).map(([worldNum, lvls]) => {
      const threshold = WORLD_STAR_THRESHOLDS[worldNum] || 0;
      const worldUnlocked = totalStars >= threshold;
      const worldTitle = WORLD_NAMES[worldNum] || `Monde ${worldNum}`;
      const lockedBadge = !worldUnlocked
        ? `<span style="color:#ff9090;font-size:12px;margin-left:10px">🔒 ${threshold}⭐ requises</span>`
        : "";
      const levelsHtml = lvls.map((lvl) => {
        const saved = save.campaign?.levels?.[lvl.id] || { stars: 0, platinum: false };
        const unlocked = worldUnlocked && isLevelUnlocked(lvl.id);
        const starsStr = unlocked
          ? [1, 2, 3].map((i) => i <= saved.stars ? "⭐" : "☆").join("")
          : "🔒";
        const border = saved.platinum ? "#b0e0ff" : (saved.stars === 3 ? "#ffd23f" : (saved.stars > 0 ? "#7cdc60" : (unlocked ? "#3c4e6e" : "#333")));
        const opacity = unlocked ? "1" : "0.4";
        const platBadge = saved.platinum
          ? `<div title="Platine débloquée" style="position:absolute;top:4px;right:4px;font-size:12px;color:#b0e0ff;text-shadow:0 0 6px #b0e0ff">🏆</div>`
          : "";
        const records = (unlocked ? (save.campaign?.records?.[lvl.id] || []) : []).slice(0, 3);
        const recordsHtml = records.length === 0
          ? `<div style="color:rgba(180,200,232,0.35);font-size:10px;margin-top:6px;font-style:italic">aucun record</div>`
          : `<div style="margin-top:6px;color:#b4c8e8;font-size:10px;line-height:1.35">${records.map((r, i) => {
              const av = getAvatarById(r.avatar);
              return `<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><span style="color:${av.color}">${MEDALS[i]}</span> <span style="color:#fff;font-weight:bold">${fmtTime(r.time)}</span> <span style="color:#7b92c2">${av.name}</span></div>`;
            }).join("")}</div>`;
        return `
          <button class="level-card" data-level="${lvl.id}" ${unlocked ? "" : "disabled"} style="
            position:relative;
            background:rgba(0,0,0,0.5);
            border:2px solid ${border};
            border-radius:10px; padding:12px 10px;
            min-width:130px; max-width:160px;
            cursor:${unlocked ? "pointer" : "not-allowed"};
            opacity:${opacity};
            text-align:center; color:#fff; font-family:inherit;
            transition:transform 0.12s, box-shadow 0.12s;
          ">
            ${platBadge}
            <div style="color:#ffd23f;font-size:11px;font-weight:bold;letter-spacing:1px">${lvl.id}</div>
            <div style="color:#b4c8e8;font-size:13px;font-weight:bold;margin:4px 0;min-height:36px;display:flex;align-items:center;justify-content:center">${lvl.title}</div>
            <div style="font-size:18px;letter-spacing:2px">${starsStr}</div>
            ${recordsHtml}
          </button>
        `;
      }).join("");
      return `
        <div style="margin:24px 0;padding:0 24px">
          <div style="display:flex;align-items:baseline;margin-bottom:12px">
            <span style="color:#ffd23f;font-size:18px;font-weight:bold;letter-spacing:1px">${worldTitle}</span>
            ${lockedBadge}
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">${levelsHtml}</div>
        </div>
      `;
    }).join("");

    overlay.innerHTML = `
      <style>
        @keyframes menuFadeIn { from { opacity:0 } to { opacity:1 } }
        .level-card:not([disabled]):hover { transform:translateY(-3px); box-shadow:0 6px 12px rgba(255,210,63,0.25) }
        .level-card:not([disabled]):active { transform:translateY(1px) }
        #menu-back:hover { background:rgba(255,210,63,0.2) !important; color:#ffd23f !important; border-color:#ffd23f !important }
      </style>
      <div style="max-width:900px;margin:0 auto;padding:0 16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:12px">
          <button id="menu-back" style="
            padding:10px 18px;font-size:14px;font-weight:bold;
            background:rgba(0,0,0,0.45);color:#b4c8e8;
            border:1.5px solid #3c4e6e;border-radius:6px;cursor:pointer;
            font-family:inherit;transition:background 0.1s,color 0.1s,border 0.1s
          ">← RETOUR</button>
          <h1 style="color:#7cc947;margin:0;font-size:clamp(22px,4vw,32px);text-shadow:2px 2px 0 #000;letter-spacing:1px;flex:1;text-align:center">CAMPAGNE</h1>
          <div style="color:#ffd23f;font-weight:bold;font-size:16px;min-width:80px;text-align:right">⭐ ${totalStars} / ${maxStars}</div>
        </div>
        ${worldsHtml}
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.querySelector("#menu-back")?.addEventListener("click", () => {
      overlay.remove();
      onBack?.();
    });
    overlay.querySelectorAll("[data-level]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.level;
        if (!isLevelUnlocked(id)) return;
        overlay.remove();
        onSelectLevel?.(id);
      });
    });
  }

  return { show };
}

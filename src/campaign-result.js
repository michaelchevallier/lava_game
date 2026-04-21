import { findLevel, nextLevelId } from "./levels.js";

export function showCampaignResult({ won, stars, time, tiles, levelId, reason, onRetry, onNext, onMenu }) {
  const existing = document.getElementById("campaign-result");
  if (existing) existing.remove();
  const overlay = document.createElement("div");
  overlay.id = "campaign-result";
  overlay.style.cssText = [
    "position:fixed", "inset:0", "background:rgba(10,14,28,0.92)",
    "display:flex", "align-items:center", "justify-content:center",
    "z-index:99998", "font-family:system-ui,sans-serif",
    "animation:resultFadeIn 0.35s",
  ].join(";");

  const def = findLevel(levelId);
  const title = def ? `${def.world}-${def.id.split("-")[1]} · ${def.title}` : levelId;
  const nextId = nextLevelId(levelId);
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  const timeStr = `${m}:${String(s).padStart(2, "0")}`;

  const starsHtml = won
    ? [1, 2, 3].map((i) => {
        const filled = i <= stars;
        return `<span class="result-star ${filled ? "filled" : ""}" style="
          display:inline-block;font-size:68px;margin:0 8px;
          color:${filled ? "#ffd23f" : "rgba(255,255,255,0.18)"};
          text-shadow:${filled ? "0 0 18px #ffd23f" : "none"};
          transform:scale(0);
          animation:starPop 0.4s ${0.1 * i}s forwards;
        ">★</span>`;
      }).join("")
    : `<div style="font-size:54px;color:#ff4a4a">☒</div>`;

  const reasonText = (() => {
    if (won) return "";
    if (reason === "time") return "Temps écoulé";
    if (reason === "budget") return "Budget de tuiles dépassé";
    if (reason === "wagons") return "Plus de wagons disponibles";
    if (reason === "forbid_skeleton") return "Un wagon s'est transformé !";
    if (reason === "forbid_coin") return "Pièce collectée interdite";
    if (time >= (def?.timeLimit || Infinity)) return "Temps écoulé";
    return "Objectif non atteint";
  })();
  const reasonHtml = won ? "" : `<div style="color:#ffb090;font-size:14px;margin-top:6px">${reasonText}</div>`;

  overlay.innerHTML = `
    <style>
      @keyframes resultFadeIn { from { opacity:0 } to { opacity:1 } }
      @keyframes starPop { 0% { transform:scale(0) rotate(-45deg) } 60% { transform:scale(1.3) rotate(0deg) } 100% { transform:scale(1) rotate(0deg) } }
      .result-btn:hover { transform:translateY(-2px); box-shadow:0 6px 0 rgba(0,0,0,0.4) !important }
      .result-btn:active { transform:translateY(2px); box-shadow:0 1px 0 rgba(0,0,0,0.4) !important }
    </style>
    <div style="
      background:linear-gradient(180deg,#1e2840 0%,#0f1420 100%);
      border:3px solid ${won ? "#7cc947" : "#ff4a4a"};
      border-radius:14px; padding:36px 48px; min-width:360px; max-width:92vw;
      text-align:center; color:#fff;
      box-shadow:0 18px 50px rgba(0,0,0,0.65);
    ">
      <div style="color:#ffd23f;font-size:13px;letter-spacing:2px;margin-bottom:6px">${title}</div>
      <div style="color:${won ? "#7cdc60" : "#ff4a4a"};font-size:32px;font-weight:bold;margin-bottom:18px;letter-spacing:2px">
        ${won ? "BRAVO !" : "RATE"}
      </div>
      <div style="margin:14px 0 20px 0;min-height:80px">${starsHtml}</div>
      ${reasonHtml}
      <div style="display:flex;gap:14px;justify-content:center;font-size:13px;color:#b4c8e8;margin:10px 0 22px 0">
        <span>⏱ ${timeStr}</span>
        <span>🧰 ${tiles} tuiles</span>
      </div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button class="result-btn" id="result-retry" style="
          padding:12px 22px;font-size:15px;font-weight:bold;background:#3d50c5;
          color:#fff;border:0;border-radius:6px;cursor:pointer;
          box-shadow:0 4px 0 #263076;transition:transform 0.1s,box-shadow 0.1s
        ">REJOUER</button>
        ${won && nextId ? `<button class="result-btn" id="result-next" style="
          padding:12px 22px;font-size:15px;font-weight:bold;background:#7cc947;
          color:#000;border:0;border-radius:6px;cursor:pointer;
          box-shadow:0 4px 0 #4a7a25;transition:transform 0.1s,box-shadow 0.1s
        ">SUIVANT ▶</button>` : ""}
        <button class="result-btn" id="result-menu" style="
          padding:12px 22px;font-size:15px;font-weight:bold;background:rgba(255,255,255,0.12);
          color:#fff;border:0;border-radius:6px;cursor:pointer;
          box-shadow:0 4px 0 rgba(0,0,0,0.3);transition:transform 0.1s,box-shadow 0.1s
        ">MENU</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector("#result-retry")?.addEventListener("click", () => {
    overlay.remove();
    onRetry?.();
  });
  overlay.querySelector("#result-next")?.addEventListener("click", () => {
    overlay.remove();
    onNext?.(nextId);
  });
  overlay.querySelector("#result-menu")?.addEventListener("click", () => {
    overlay.remove();
    onMenu?.();
  });
}

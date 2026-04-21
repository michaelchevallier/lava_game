import { getAvatarById } from "./avatars.js";

export function showRunResult({ avatar, record, top, onRetry, onMenu }) {
  const existing = document.getElementById("run-result");
  if (existing) existing.remove();
  const overlay = document.createElement("div");
  overlay.id = "run-result";
  overlay.style.cssText = [
    "position:fixed", "inset:0", "background:rgba(10,14,28,0.92)",
    "display:flex", "align-items:center", "justify-content:center",
    "z-index:99998", "font-family:system-ui,sans-serif",
    "animation:runResultFadeIn 0.35s",
  ].join(";");

  const av = getAvatarById(avatar);
  const isNewTop = top.length > 0 && top[0].score === record.score && top[0].date === record.date;
  const rank = top.findIndex((r) => r.date === record.date && r.score === record.score) + 1;
  const podiumHtml = top.slice(0, 5).map((r, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    const isCurrent = r.date === record.date && r.score === record.score;
    const bg = isCurrent ? "rgba(255,210,63,0.25)" : "rgba(255,255,255,0.04)";
    const border = isCurrent ? "2px solid #ffd23f" : "1px solid rgba(255,255,255,0.1)";
    return `
      <div style="display:flex;align-items:center;gap:14px;padding:10px 14px;background:${bg};border:${border};border-radius:6px;margin:4px 0">
        <span style="font-size:20px;width:36px;text-align:center">${medal}</span>
        <span style="flex:1;color:#ffd23f;font-family:monospace;font-size:20px;font-weight:bold">${r.score}</span>
        <span style="color:#b4c8e8;font-size:11px">${r.skeletons} skel · ${r.coins} pièces</span>
      </div>
    `;
  }).join("");

  overlay.innerHTML = `
    <style>
      @keyframes runResultFadeIn { from { opacity:0 } to { opacity:1 } }
      .run-btn:hover { transform:translateY(-2px); box-shadow:0 6px 0 rgba(0,0,0,0.4) !important }
      .run-btn:active { transform:translateY(2px); box-shadow:0 1px 0 rgba(0,0,0,0.4) !important }
    </style>
    <div style="
      background:linear-gradient(180deg,#1e2840 0%,#0f1420 100%);
      border:3px solid #ff6b1c; border-radius:14px;
      padding:32px 40px; min-width:380px; max-width:92vw;
      color:#fff; text-align:center;
      box-shadow:0 18px 50px rgba(0,0,0,0.65);
    ">
      <div style="color:#ffd23f;font-size:13px;letter-spacing:2px;margin-bottom:6px">RUN ARCADE · ${av?.name || avatar}</div>
      <div style="color:#ff6b1c;font-size:32px;font-weight:bold;margin-bottom:14px;letter-spacing:2px">
        ${isNewTop ? "🏆 NOUVEAU RECORD !" : rank > 0 ? `TOP ${rank}` : "TEMPS ÉCOULÉ"}
      </div>
      <div style="color:#ffd23f;font-size:48px;font-weight:bold;margin:14px 0">${record.score}</div>
      <div style="color:#b4c8e8;font-size:13px;margin-bottom:18px">
        ${record.skeletons} squelettes · ${record.coins} pièces
      </div>
      <div style="text-align:left;margin:18px 0;max-width:340px;margin-left:auto;margin-right:auto">
        <div style="color:#ffd23f;font-size:12px;letter-spacing:1px;margin-bottom:8px">TOP 5 · ${av?.name || avatar}</div>
        ${podiumHtml}
      </div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:18px">
        <button class="run-btn" id="run-retry" style="
          padding:12px 22px;font-size:15px;font-weight:bold;background:#ff6b1c;
          color:#fff;border:0;border-radius:6px;cursor:pointer;
          box-shadow:0 4px 0 #9a3d0a;transition:transform 0.1s,box-shadow 0.1s
        ">REJOUER</button>
        <button class="run-btn" id="run-menu" style="
          padding:12px 22px;font-size:15px;font-weight:bold;background:rgba(255,255,255,0.12);
          color:#fff;border:0;border-radius:6px;cursor:pointer;
          box-shadow:0 4px 0 rgba(0,0,0,0.3);transition:transform 0.1s,box-shadow 0.1s
        ">MENU</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector("#run-retry")?.addEventListener("click", () => {
    overlay.remove();
    onRetry?.();
  });
  overlay.querySelector("#run-menu")?.addEventListener("click", () => {
    overlay.remove();
    onMenu?.();
  });
}

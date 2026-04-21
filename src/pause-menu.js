import { findLevel } from "./levels.js";

export function showPauseMenu({ mode, levelId, onResume, onRetry, onCampaignMenu, onMainMenu, onSettings }) {
  const existing = document.getElementById("pause-menu");
  if (existing) existing.remove();
  const overlay = document.createElement("div");
  overlay.id = "pause-menu";
  overlay.style.cssText = [
    "position:fixed", "inset:0", "background:rgba(10,14,28,0.85)",
    "display:flex", "align-items:center", "justify-content:center",
    "z-index:99997", "font-family:system-ui,sans-serif",
    "animation:pauseFadeIn 0.2s",
  ].join(";");

  const def = levelId ? findLevel(levelId) : null;
  const title = def ? `${def.world}-${def.id.split("-")[1]} · ${def.title}` : "PAUSE";
  const modeLabel = mode === "campaign" ? "CAMPAGNE" : mode === "run" ? "RUN ARCADE" : "BAC À SABLE";

  const retryHtml = (mode === "campaign" || mode === "run")
    ? `<button class="pm-btn" id="pm-retry" style="padding:12px 22px;font-size:15px;font-weight:bold;background:#3d50c5;color:#fff;border:0;border-radius:6px;cursor:pointer;box-shadow:0 4px 0 #263076">RELANCER LE NIVEAU</button>`
    : "";
  const campaignMenuHtml = mode === "campaign"
    ? `<button class="pm-btn" id="pm-cmenu" style="padding:10px 18px;font-size:14px;font-weight:bold;background:rgba(124,201,71,0.9);color:#000;border:0;border-radius:6px;cursor:pointer;box-shadow:0 4px 0 #4a7a25">CHOISIR UN AUTRE NIVEAU</button>`
    : "";
  const settingsHtml = `<button class="pm-btn" id="pm-settings" style="padding:10px 18px;font-size:13px;background:rgba(255,255,255,0.08);color:#b4c8e8;border:1px solid #3c4e6e;border-radius:6px;cursor:pointer">⚙ Options</button>`;

  overlay.innerHTML = `
    <style>
      @keyframes pauseFadeIn { from { opacity:0 } to { opacity:1 } }
      .pm-btn:hover { transform:translateY(-2px); filter:brightness(1.15) }
      .pm-btn:active { transform:translateY(1px) }
    </style>
    <div style="
      background:linear-gradient(180deg,#1e2840 0%,#0f1420 100%);
      border:3px solid #ffd23f; border-radius:14px;
      padding:28px 36px; min-width:340px; max-width:92vw;
      color:#fff; text-align:center;
      box-shadow:0 18px 50px rgba(0,0,0,0.65);
    ">
      <div style="color:#ffd23f;font-size:12px;letter-spacing:2px;margin-bottom:4px">${modeLabel}</div>
      <div style="color:#fff;font-size:22px;font-weight:bold;letter-spacing:1px;margin-bottom:18px">${title}</div>
      <div style="display:flex;flex-direction:column;gap:10px;align-items:stretch;min-width:240px">
        <button class="pm-btn" id="pm-resume" style="padding:14px 22px;font-size:16px;font-weight:bold;background:#7cc947;color:#000;border:0;border-radius:6px;cursor:pointer;box-shadow:0 4px 0 #4a7a25">▶ REPRENDRE</button>
        ${retryHtml}
        ${campaignMenuHtml}
        <button class="pm-btn" id="pm-main" style="padding:10px 18px;font-size:13px;background:rgba(255,255,255,0.12);color:#fff;border:0;border-radius:6px;cursor:pointer">🏠 Accueil</button>
        ${settingsHtml}
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  const wire = (sel, fn) => overlay.querySelector(sel)?.addEventListener("click", () => {
    overlay.remove();
    fn?.();
  });
  wire("#pm-resume", onResume);
  wire("#pm-retry", onRetry);
  wire("#pm-cmenu", onCampaignMenu);
  wire("#pm-main", onMainMenu);
  wire("#pm-settings", onSettings);
  // Escape again closes
  const onKey = (e) => {
    if (e.key === "Escape") {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
      onResume?.();
    }
  };
  document.addEventListener("keydown", onKey);
}

export function hidePauseMenu() {
  document.getElementById("pause-menu")?.remove();
}

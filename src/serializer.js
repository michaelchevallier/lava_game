import { STORAGE_KEY, TILE_CODE, CODE_TILE, COLS, GROUND_ROW } from "./constants.js";

export function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { bestScore: 0, totalSkeletons: 0, totalCoins: 0, plays: 0, numPlayers: 2 };
    const parsed = JSON.parse(raw);
    if (!parsed.numPlayers) parsed.numPlayers = 2;
    return parsed;
  } catch (e) {
    return { bestScore: 0, totalSkeletons: 0, totalCoins: 0, plays: 0, numPlayers: 2 };
  }
}

export function persistSave(save) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(save)); } catch (e) {}
}

export function serializeTiles(tileMap) {
  const parts = [];
  for (const [, t] of tileMap) {
    const c = TILE_CODE[t.tileType];
    if (!c) continue;
    parts.push(`${t.gridCol}.${t.gridRow}.${c}`);
  }
  return "v1:" + parts.join(",");
}

export function deserializeTiles(code, placeTile) {
  const stripped = code.startsWith("v1:") ? code.slice(3) : code;
  const parts = stripped.split(",").filter(Boolean);
  for (const p of parts) {
    const [cStr, rStr, tCode] = p.split(".");
    const c = parseInt(cStr, 10);
    const r = parseInt(rStr, 10);
    const type = CODE_TILE[tCode];
    if (!type || isNaN(c) || isNaN(r)) continue;
    if (c < 0 || c >= COLS || r < 0 || r >= GROUND_ROW) continue;
    placeTile(c, r, type);
  }
}

export function showExportModal(code, onImport) {
  const existing = document.getElementById("park-modal");
  if (existing) existing.remove();
  const modal = document.createElement("div");
  modal.id = "park-modal";
  modal.style.cssText =
    "position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:99999;font-family:system-ui,sans-serif;";
  const box = document.createElement("div");
  box.style.cssText =
    "background:#1e2840;padding:24px;border-radius:8px;min-width:440px;max-width:80vw;border:3px solid #ffd23f;color:white;";
  box.innerHTML = `
    <h2 style="margin:0 0 12px 0;color:#ffd23f">Sauvegarder / Charger le parc</h2>
    <p style="margin:4px 0 8px 0;font-size:13px">Ton code :</p>
    <textarea id="park-code" style="width:100%;height:80px;box-sizing:border-box;font-family:monospace;font-size:12px;background:#0f1420;color:#ffe066;border:1px solid #444;padding:8px">${code}</textarea>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button id="park-copy" style="padding:10px 16px;background:#7cc947;color:white;border:0;border-radius:4px;cursor:pointer;font-size:14px;font-weight:bold">Copier</button>
      <button id="park-load" style="padding:10px 16px;background:#3d50c5;color:white;border:0;border-radius:4px;cursor:pointer;font-size:14px;font-weight:bold">Charger ce code</button>
      <button id="park-close" style="padding:10px 16px;background:#555;color:white;border:0;border-radius:4px;cursor:pointer;font-size:14px;margin-left:auto">Fermer</button>
    </div>
    <p style="margin:12px 0 0 0;font-size:11px;color:#aaa">Copie ce code pour partager ou sauvegarder ton parc. Colle un code puis clique "Charger" pour ouvrir un autre parc.</p>
  `;
  modal.appendChild(box);
  document.body.appendChild(modal);
  const ta = box.querySelector("#park-code");
  ta.select();
  box.querySelector("#park-copy").onclick = () => {
    ta.select();
    navigator.clipboard?.writeText(ta.value).catch(() => document.execCommand("copy"));
    box.querySelector("#park-copy").textContent = "Copie !";
  };
  box.querySelector("#park-load").onclick = () => {
    const val = ta.value.trim();
    if (val) onImport(val);
    modal.remove();
  };
  box.querySelector("#park-close").onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

import { getVipById, pickContract } from "./vips.js";
import { ensureVipToday } from "./contracts.js";

export function showVipScreen({ save, persistSave, onPickContract, onBack }) {
  const existing = document.getElementById("vip-screen");
  if (existing) existing.remove();

  const today = ensureVipToday(save, persistSave);

  const root = document.createElement("div");
  root.id = "vip-screen";
  root.style.cssText = [
    "position:fixed", "inset:0",
    "background:linear-gradient(180deg,#21346e 0%,#0f1420 100%)",
    "z-index:99997", "overflow-y:auto",
    "font-family:system-ui,sans-serif",
    "padding:32px 16px", "box-sizing:border-box",
  ].join(";");

  const todayHumain = new Date(today.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const cards = (today.vips || []).map((entry, idx) => {
    const vip = getVipById(entry.vipId);
    const contract = pickContract(vip, entry.contractIdx || 0);
    if (!vip || !contract) return "";
    const honored = entry.honored;
    const failed = entry.failed;
    const objLabels = (contract.objectives || []).map((o) => `${o.target} ${labelForObjective(o.type)}`).join(" + ");
    const forbid = contract.forbidTools && contract.forbidTools.length ? `<div style="color:#ff8a8a;font-size:11px;margin-top:4px">🚫 Interdit : ${contract.forbidTools.join(", ")}</div>` : "";
    const failOn = contract.failOn ? `<div style="color:#ff8a8a;font-size:11px;margin-top:4px">🚫 Zéro : ${Object.keys(contract.failOn).join(", ")}</div>` : "";
    const budget = contract.tileBudget ? `<div style="color:#ffd23f;font-size:11px;margin-top:4px">🧰 Budget : ${contract.tileBudget} tuiles max</div>` : "";
    const wagons = contract.wagonLimit ? `<div style="color:#ffd23f;font-size:11px;margin-top:2px">🚃 Max ${contract.wagonLimit} wagon${contract.wagonLimit > 1 ? "s" : ""}</div>` : "";
    const timeLimit = contract.timeLimit ? `<div style="color:#ffd23f;font-size:11px;margin-top:2px">⏱ ${contract.timeLimit}s max</div>` : "";
    const status = honored
      ? `<div style="color:#7cc947;font-size:12px;font-weight:bold;margin-top:10px">✓ CONTRAT HONORÉ</div>`
      : failed
      ? `<div style="color:#ff6666;font-size:12px;font-weight:bold;margin-top:10px">✗ Raté — retenter demain</div>`
      : `<button data-idx="${idx}" class="vip-pick-btn" style="margin-top:12px;padding:10px 16px;background:#7cc947;color:#000;border:0;border-radius:6px;cursor:pointer;font-weight:bold;font-size:14px;width:100%">Honorer ce contrat →</button>`;

    return `
      <div class="vip-card" style="
        background:linear-gradient(180deg,${vip.color}ee 0%,${vip.color}55 100%);
        border:2px solid ${vip.color};
        border-radius:12px;
        padding:18px 16px;
        color:#fff;
        max-width:280px;
        min-width:240px;
        display:flex;flex-direction:column;
        box-shadow:0 6px 18px rgba(0,0,0,0.4);
        opacity:${honored || failed ? "0.7" : "1"};
      ">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <div style="font-size:40px">${vip.emoji}</div>
          <div>
            <div style="font-size:16px;font-weight:bold;text-shadow:1px 1px 0 rgba(0,0,0,0.4)">${vip.name}</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.85)">${vip.age} ans · ${vip.personality}</div>
          </div>
        </div>
        <div style="font-style:italic;color:rgba(255,255,255,0.9);font-size:12px;margin-bottom:10px">« ${vip.tagline} »</div>
        <div style="background:rgba(0,0,0,0.35);border-radius:6px;padding:10px;margin-top:4px;flex:1">
          <div style="color:#ffd23f;font-size:11px;font-weight:bold;letter-spacing:1px;margin-bottom:4px">CONTRAT</div>
          <div style="font-size:13px;color:#fff;font-weight:bold;margin-bottom:4px">${contract.summary}</div>
          <div style="color:#b4e6b4;font-size:11px">🎯 ${objLabels}</div>
          ${forbid}${failOn}${budget}${wagons}${timeLimit}
          <div style="color:#ffd23f;font-size:12px;margin-top:10px;font-weight:bold">Récompense : ${contract.reward} 🎫 ticket${contract.reward > 1 ? "s" : ""}</div>
        </div>
        ${status}
      </div>
    `;
  }).join("");

  root.innerHTML = `
    <style>
      .vip-pick-btn:hover { background:#8fd45a !important; transform:translateY(-1px); }
      #vip-back:hover { background:rgba(255,210,63,0.25) !important; color:#ffd23f !important; border-color:#ffd23f !important }
    </style>
    <div style="max-width:980px;margin:0 auto;color:#fff">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px">
        <div>
          <div style="color:#ffd23f;font-size:13px;letter-spacing:2px">AUJOURD'HUI AU PARC</div>
          <div style="font-size:28px;font-weight:bold;margin-top:2px">${todayHumain}</div>
          <div style="color:#c8d8ff;font-size:14px;margin-top:4px">Trois visiteurs exigent ton meilleur parc.</div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <div style="background:rgba(255,210,63,0.15);border:1px solid #ffd23f;padding:8px 14px;border-radius:8px;color:#ffd23f;font-weight:bold">🎫 ${save.tickets || 0} tickets</div>
          <button id="vip-back" style="padding:10px 18px;font-size:14px;background:rgba(0,0,0,0.4);border:1.5px solid rgba(255,255,255,0.3);border-radius:6px;color:#fff;cursor:pointer;font-weight:bold">← Retour</button>
        </div>
      </div>
      <div style="display:flex;gap:18px;flex-wrap:wrap;justify-content:center">${cards}</div>
      <div style="text-align:center;color:#aaa;font-size:11px;margin-top:24px">Le tirage se renouvelle chaque jour à minuit. Les VIP vus reviendront dans au moins 7 jours.</div>
    </div>
  `;

  document.body.appendChild(root);

  root.querySelector("#vip-back").addEventListener("click", () => {
    root.remove();
    onBack?.();
  });
  root.querySelectorAll(".vip-pick-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx, 10);
      const entry = today.vips[idx];
      if (!entry || entry.honored || entry.failed) return;
      root.remove();
      onPickContract?.(entry);
    });
  });
}

function labelForObjective(type) {
  const map = {
    skeleton: "squelette(s)",
    coin: "pièce(s)",
    catapult: "catapulte(s)",
    loop: "looping(s)",
    apocalypse: "apocalypse(s)",
    chain: "chaîne(s) d'or",
    constellation: "constellation(s)",
    metronome: "métronome(s)",
    magnetField: "champ(s) magnétique(s)",
    geyser: "geyser(s)",
    portalUse: "portail(s) utilisé(s)",
    wagon: "wagon(s)",
    score: "points",
  };
  return map[type] || type;
}

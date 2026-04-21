import { LEVELS, levelsByWorld } from "./levels.js";
import { AVATARS, getAvatarById } from "./avatars.js";
import { SPECTRE_CATEGORIES, ALL_SPECTRES } from "./spectres.js";
import { TILE_PRICES, TILE_LABELS, TILE_EMOJI, SKINS, buyTile, buySkin, setActiveSkin } from "./shop.js";
import { persistSave } from "./serializer.js";
import { getVipById, pickContract } from "./vips.js";

const MEDALS = ["🥇", "🥈", "🥉"];

function fmtTime(t) {
  if (t == null) return "--:--";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function medalColor(entry) {
  if (!entry) return { color: "#333", label: "—" };
  if (entry.platinum) return { color: "#b0e0ff", label: "PLATINE" };
  if (entry.stars >= 3) return { color: "#ffd23f", label: "OR" };
  if (entry.stars === 2) return { color: "#c8c8c8", label: "ARGENT" };
  if (entry.stars === 1) return { color: "#cd7f32", label: "BRONZE" };
  return { color: "#333", label: "—" };
}

export function createMuseum({ save }) {
  let currentTab = "medals";

  function renderMedalsTab() {
    const worlds = levelsByWorld();
    const totalStars = save.campaign?.totalStars || 0;
    const maxStars = LEVELS.length * 3;
    const platCount = Object.values(save.campaign?.levels || {}).filter((l) => l.platinum).length;
    const summary = `
      <div style="text-align:center;margin-bottom:16px;color:#b4c8e8;font-size:13px">
        <span style="color:#ffd23f;font-weight:bold">⭐ ${totalStars} / ${maxStars}</span>
        &nbsp;·&nbsp;
        <span style="color:#b0e0ff;font-weight:bold">🏆 ${platCount} / ${LEVELS.length}</span>
      </div>
    `;
    const worldsHtml = Array.from(worlds.entries()).map(([worldNum, lvls]) => {
      const cells = lvls.map((lvl) => {
        const saved = save.campaign?.levels?.[lvl.id] || { stars: 0, platinum: false };
        const m = medalColor(saved);
        return `
          <div style="
            background:rgba(0,0,0,0.5);
            border:1.5px solid ${m.color};
            border-radius:8px;padding:6px 4px;text-align:center;
            min-width:62px;
          " title="${lvl.title}">
            <div style="color:#ffd23f;font-size:10px;font-weight:bold">${lvl.id}</div>
            <div style="color:${m.color};font-size:10px;font-weight:bold;margin-top:2px">${m.label}</div>
            <div style="font-size:10px;color:#b4c8e8;margin-top:2px">${[1,2,3].map(i => i <= saved.stars ? "★" : "·").join("")}</div>
          </div>
        `;
      }).join("");
      return `
        <div style="margin-bottom:14px">
          <div style="color:#ffd23f;font-size:13px;font-weight:bold;letter-spacing:1px;margin-bottom:6px">Monde ${worldNum}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">${cells}</div>
        </div>
      `;
    }).join("");
    return summary + worldsHtml;
  }

  function renderRecordsTab() {
    const worlds = levelsByWorld();
    const entries = Array.from(worlds.entries()).map(([worldNum, lvls]) => {
      const rows = lvls.map((lvl) => {
        const recs = (save.campaign?.records?.[lvl.id] || []).slice(0, 3);
        const cells = recs.length === 0
          ? `<span style="color:rgba(180,200,232,0.35);font-size:11px;font-style:italic">aucun record</span>`
          : recs.map((r, i) => {
              const av = getAvatarById(r.avatar);
              return `<span style="display:inline-block;margin-right:10px"><span style="color:${av.color}">${MEDALS[i]}</span> <span style="color:#fff;font-weight:bold">${fmtTime(r.time)}</span> <span style="color:#7b92c2">${av.name}</span></span>`;
            }).join("");
        return `
          <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
            <div style="color:#ffd23f;font-size:11px;font-weight:bold;min-width:32px">${lvl.id}</div>
            <div style="color:#b4c8e8;font-size:12px;min-width:140px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${lvl.title}</div>
            <div style="flex:1;font-size:11px">${cells}</div>
          </div>
        `;
      }).join("");
      return `
        <div style="margin-bottom:14px">
          <div style="color:#ffd23f;font-size:13px;font-weight:bold;letter-spacing:1px;margin-bottom:6px">Monde ${worldNum}</div>
          ${rows}
        </div>
      `;
    }).join("");
    return entries;
  }

  function renderSpectresTab() {
    const total = ALL_SPECTRES.length;
    let unlockedTotal = 0;
    for (const s of ALL_SPECTRES) if (save.spectres?.[s.category]?.[s.id]) unlockedTotal++;
    const titles = save.titles || [];
    const catsHtml = SPECTRE_CATEGORIES.map((cat) => {
      const done = cat.spectres.every((s) => !!save.spectres?.[cat.id]?.[s.id]);
      const items = cat.spectres.map((s) => {
        const has = !!save.spectres?.[cat.id]?.[s.id];
        const bg = has ? "#2a3050" : "#1a1f30";
        const op = has ? "1" : "0.35";
        const filt = has ? "" : "filter:blur(3px) grayscale(1);";
        return `
          <div style="background:${bg};padding:10px 6px;border-radius:6px;text-align:center;border:1px solid ${has ? cat.color : "#444"};opacity:${op}">
            <div style="font-size:24px;${filt}">${s.emoji}</div>
            <div style="font-size:10px;color:white;margin-top:3px;font-weight:bold">${has ? s.name : "???"}</div>
            <div style="font-size:9px;color:#aab;margin-top:1px;line-height:1.3">${has ? "" : s.desc}</div>
          </div>
        `;
      }).join("");
      const titleBadge = done
        ? `<span style="margin-left:10px;background:${cat.color};color:#000;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:bold">TITRE: ${cat.title}</span>`
        : "";
      return `
        <div style="margin-bottom:14px">
          <div style="display:flex;align-items:center;margin-bottom:6px">
            <span style="font-size:18px;margin-right:8px">${cat.emoji}</span>
            <span style="color:${cat.color};font-size:13px;font-weight:bold;letter-spacing:1px">${cat.name}</span>
            ${titleBadge}
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">${items}</div>
        </div>
      `;
    }).join("");
    const titlesLine = titles.length === 0
      ? ""
      : `<div style="text-align:center;margin-bottom:10px;color:#ffd23f;font-size:12px">Titres débloqués : ${titles.map((t) => `<span style="background:rgba(255,210,63,0.18);padding:2px 8px;border-radius:4px;margin:0 2px">${t}</span>`).join("")}</div>`;
    return `
      <div style="text-align:center;margin-bottom:12px;color:#b4c8e8;font-size:13px">
        <span style="color:#c090f0;font-weight:bold">👻 ${unlockedTotal} / ${total}</span> spectres · 6 catégories
      </div>
      ${titlesLine}
      ${catsHtml}
    `;
  }

  function renderRunsTab() {
    const runs = save.runs || {};
    const entries = AVATARS.map((av) => {
      const list = runs[av.id] || [];
      if (list.length === 0) return null;
      const rows = list.slice(0, 5).map((r, i) => `
        <div style="display:flex;gap:10px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px">
          <span style="color:#7b92c2;min-width:22px">${i + 1}.</span>
          <span style="color:#ffd23f;font-weight:bold;min-width:60px">${r.score} pts</span>
          <span style="color:#b4c8e8">💀 ${r.skeletons || 0}</span>
          <span style="color:#b4c8e8">🪙 ${r.coins || 0}</span>
          <span style="color:#7b92c2;margin-left:auto">${fmtDate(r.date)}</span>
        </div>
      `).join("");
      return `
        <div style="margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
            <div style="width:10px;height:10px;border-radius:2px;background:${av.color}"></div>
            <div style="color:${av.color};font-size:14px;font-weight:bold">${av.name}</div>
          </div>
          ${rows}
        </div>
      `;
    }).filter(Boolean).join("");
    if (!entries) {
      return `<div style="text-align:center;color:rgba(180,200,232,0.55);font-size:13px;padding:30px 0;font-style:italic">Aucun run terminé. Lance une partie Run Arcade pour remplir le tableau !</div>`;
    }
    return entries;
  }

  function renderVipTab() {
    const almanac = (save.almanac || []).slice().reverse();
    if (almanac.length === 0) {
      return `
        <div style="text-align:center;padding:40px 20px;color:rgba(180,200,232,0.55)">
          <div style="font-size:48px;margin-bottom:12px;opacity:0.45">📜</div>
          <div style="color:#ffd23f;font-size:14px;font-weight:bold;letter-spacing:1px;margin-bottom:8px">AUCUN CONTRAT HONORÉ</div>
          <div style="font-size:12px;line-height:1.6;max-width:420px;margin:0 auto">
            Honore un contrat VIP depuis l'écran "Aujourd'hui au parc" sur le splash et il apparaîtra ici avec le témoignage du visiteur.
          </div>
        </div>
      `;
    }
    const byVip = new Map();
    for (const e of almanac) {
      if (!byVip.has(e.vipId)) byVip.set(e.vipId, []);
      byVip.get(e.vipId).push(e);
    }
    const cards = almanac.map((entry) => {
      const vip = getVipById(entry.vipId);
      if (!vip) return "";
      const dateStr = entry.date ? new Date(entry.date + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "";
      return `
        <div style="
          background:linear-gradient(135deg,${vip.color}99 0%,rgba(20,28,50,0.8) 100%);
          border:2px solid ${vip.color};
          border-radius:10px;padding:14px 16px;
          max-width:300px;min-width:240px;
          display:flex;flex-direction:column;gap:6px;
        ">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="font-size:32px">${vip.emoji}</div>
            <div>
              <div style="font-size:14px;font-weight:bold;color:#fff;text-shadow:1px 1px 0 rgba(0,0,0,0.4)">${vip.name}</div>
              <div style="font-size:10px;color:rgba(255,255,255,0.8)">${vip.age} ans · ${vip.personality}</div>
            </div>
          </div>
          <div style="background:rgba(0,0,0,0.3);border-radius:6px;padding:8px 10px;font-style:italic;color:#fff;font-size:12px;line-height:1.4">« ${entry.testimonial} »</div>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,0.7)">
            <span>${dateStr}</span>
            <span>+${entry.reward || 1} 🎫</span>
          </div>
        </div>
      `;
    }).join("");
    const totalTickets = (save.almanac || []).reduce((s, e) => s + (e.reward || 1), 0);
    return `
      <div style="text-align:center;margin-bottom:12px;color:#b4c8e8;font-size:13px">
        <span style="color:#ffd23f;font-weight:bold">${almanac.length} contrat${almanac.length > 1 ? "s" : ""} honoré${almanac.length > 1 ? "s" : ""}</span>
        &nbsp;·&nbsp;
        <span style="color:#c090f0;font-weight:bold">${byVip.size} visiteur${byVip.size > 1 ? "s" : ""} différent${byVip.size > 1 ? "s" : ""}</span>
        &nbsp;·&nbsp;
        <span style="color:#7cc947;font-weight:bold">${totalTickets} 🎫 gagnés</span>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">${cards}</div>
    `;
  }

  function renderShopTab() {
    const tickets = save.tickets || 0;
    const tilesHtml = Object.keys(TILE_PRICES).map((tool) => {
      const owned = (save.ticketUnlocks || []).includes(tool);
      const price = TILE_PRICES[tool];
      const canAfford = tickets >= price;
      return `
        <div style="
          background:rgba(0,0,0,0.45);
          border:1.5px solid ${owned ? "#7cc947" : canAfford ? "#ffd23f" : "#3c4e6e"};
          border-radius:8px;padding:10px;
          display:flex;align-items:center;gap:10px;
        ">
          <div style="font-size:28px">${TILE_EMOJI[tool] || "◻"}</div>
          <div style="flex:1">
            <div style="color:#fff;font-weight:bold;font-size:13px">${TILE_LABELS[tool] || tool}</div>
            <div style="color:${owned ? "#7cc947" : "#ffd23f"};font-size:11px;font-weight:bold">${owned ? "DÉBLOQUÉ" : `${price} 🎫`}</div>
          </div>
          ${owned
            ? `<span style="color:#7cc947;font-size:12px;font-weight:bold">✓</span>`
            : `<button class="shop-buy-tile" data-tool="${tool}" ${canAfford ? "" : "disabled"} style="
                padding:6px 12px;font-size:11px;font-weight:bold;
                background:${canAfford ? "#ffd23f" : "rgba(100,100,100,0.3)"};
                color:${canAfford ? "#000" : "#666"};
                border:0;border-radius:5px;cursor:${canAfford ? "pointer" : "not-allowed"};
              ">ACHETER</button>`
          }
        </div>
      `;
    }).join("");

    const skinsHtml = SKINS.map((skin) => {
      const owned = (save.ownedSkins || []).includes(skin.id);
      const active = save.activeSkin === skin.id;
      const canAfford = tickets >= skin.price;
      const color = `rgb(${skin.theme.body.join(",")})`;
      return `
        <div style="
          background:rgba(0,0,0,0.45);
          border:1.5px solid ${active ? "#ffd23f" : owned ? "#7cc947" : canAfford ? "#ffd23f" : "#3c4e6e"};
          border-radius:8px;padding:12px;
          display:flex;align-items:center;gap:12px;
        ">
          <div style="
            width:48px;height:32px;border-radius:4px;
            background:${color};
            border:2px solid rgb(${skin.theme.dark.join(",")});
            box-shadow:inset 0 0 0 2px rgb(${skin.theme.trim.join(",")});
          "></div>
          <div style="flex:1">
            <div style="color:#fff;font-weight:bold;font-size:13px">${skin.emoji} ${skin.name}</div>
            <div style="color:${active ? "#ffd23f" : owned ? "#7cc947" : "#ffd23f"};font-size:11px;font-weight:bold">${active ? "ACTIF" : owned ? "POSSÉDÉ" : `${skin.price} 🎫`}</div>
          </div>
          ${active
            ? `<button class="shop-unequip-skin" style="padding:6px 12px;font-size:11px;font-weight:bold;background:rgba(255,100,100,0.2);color:#ffb4b4;border:1px solid #ffb4b4;border-radius:5px;cursor:pointer">RETIRER</button>`
            : owned
            ? `<button class="shop-equip-skin" data-skin="${skin.id}" style="padding:6px 12px;font-size:11px;font-weight:bold;background:#7cc947;color:#000;border:0;border-radius:5px;cursor:pointer">ÉQUIPER</button>`
            : `<button class="shop-buy-skin" data-skin="${skin.id}" ${canAfford ? "" : "disabled"} style="
                padding:6px 12px;font-size:11px;font-weight:bold;
                background:${canAfford ? "#ffd23f" : "rgba(100,100,100,0.3)"};
                color:${canAfford ? "#000" : "#666"};
                border:0;border-radius:5px;cursor:${canAfford ? "pointer" : "not-allowed"};
              ">ACHETER</button>`
          }
        </div>
      `;
    }).join("");

    return `
      <div style="text-align:center;margin-bottom:16px">
        <div style="display:inline-block;background:rgba(255,210,63,0.15);border:2px solid #ffd23f;padding:10px 20px;border-radius:10px;color:#ffd23f;font-size:18px;font-weight:bold">🎫 ${tickets} tickets d'or</div>
        <div style="color:#b4c8e8;font-size:12px;margin-top:6px">Gagne des tickets en honorant les contrats VIP sur le splash.</div>
      </div>
      <div style="margin-bottom:20px">
        <div style="color:#ffd23f;font-size:13px;font-weight:bold;letter-spacing:1px;margin-bottom:10px">🛠️ TUILES AVANCÉES</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px">${tilesHtml}</div>
      </div>
      <div>
        <div style="color:#ffd23f;font-size:13px;font-weight:bold;letter-spacing:1px;margin-bottom:10px">🎨 SKINS DE WAGON</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px">${skinsHtml}</div>
      </div>
    `;
  }

  function renderContent() {
    if (currentTab === "medals") return renderMedalsTab();
    if (currentTab === "records") return renderRecordsTab();
    if (currentTab === "spectres") return renderSpectresTab();
    if (currentTab === "runs") return renderRunsTab();
    if (currentTab === "vip") return renderVipTab();
    if (currentTab === "shop") return renderShopTab();
    return "";
  }

  function show() {
    const existing = document.getElementById("museum-modal");
    if (existing) existing.remove();
    const overlay = document.createElement("div");
    overlay.id = "museum-modal";
    overlay.style.cssText = [
      "position:fixed", "inset:0",
      "background:rgba(5,8,17,0.94)",
      "display:flex", "align-items:center", "justify-content:center",
      "z-index:99998", "font-family:system-ui,sans-serif",
      "animation:museumFadeIn 0.28s",
      "padding:16px",
    ].join(";");

    const tabs = [
      { id: "medals", label: "🏅 Médailles" },
      { id: "records", label: "⏱️ Records" },
      { id: "spectres", label: "👻 Spectres" },
      { id: "runs", label: "🎰 Runs" },
      { id: "vip", label: "📜 Almanach" },
      { id: "shop", label: "🎫 Boutique" },
    ];

    const renderTabNav = () => tabs.map((t) => `
      <button class="museum-tab" data-tab="${t.id}" style="
        padding:8px 14px;font-size:12px;font-weight:bold;
        background:${currentTab === t.id ? "rgba(255,210,63,0.18)" : "rgba(0,0,0,0.45)"};
        color:${currentTab === t.id ? "#ffd23f" : "#b4c8e8"};
        border:1.5px solid ${currentTab === t.id ? "#ffd23f" : "#3c4e6e"};
        border-radius:6px;cursor:pointer;font-family:inherit;
        transition:background 0.12s,color 0.12s,border 0.12s;
      ">${t.label}</button>
    `).join("");

    overlay.innerHTML = `
      <style>
        @keyframes museumFadeIn { from { opacity:0 } to { opacity:1 } }
        .museum-tab:hover { background:rgba(255,210,63,0.22) !important; color:#ffd23f !important; border-color:#ffd23f !important }
        #museum-close:hover { background:rgba(255,100,100,0.25) !important; color:#ffb4b4 !important; border-color:#ffb4b4 !important }
      </style>
      <div style="
        background:linear-gradient(180deg,#1e2840 0%,#0f1420 100%);
        border:3px solid #ffd23f;border-radius:14px;
        width:min(900px,96vw);max-height:92vh;
        display:flex;flex-direction:column;
        box-shadow:0 18px 60px rgba(0,0,0,0.7);
      ">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid rgba(255,210,63,0.3)">
          <h2 style="margin:0;color:#ffd23f;font-size:22px;letter-spacing:2px">🏆 MUSÉE</h2>
          <button id="museum-close" style="
            padding:8px 16px;font-size:14px;
            background:rgba(0,0,0,0.45);color:#b4c8e8;
            border:1.5px solid #3c4e6e;border-radius:6px;cursor:pointer;
            font-family:inherit;transition:background 0.12s,color 0.12s
          ">FERMER ✕</button>
        </div>
        <div id="museum-tabs" style="display:flex;gap:8px;padding:12px 18px;flex-wrap:wrap;border-bottom:1px solid rgba(255,255,255,0.08)">
          ${renderTabNav()}
        </div>
        <div id="museum-content" style="flex:1;overflow-y:auto;padding:16px 20px;color:#fff">
          ${renderContent()}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const tabsBox = overlay.querySelector("#museum-tabs");
    const contentBox = overlay.querySelector("#museum-content");

    tabsBox.addEventListener("click", (e) => {
      const btn = e.target.closest(".museum-tab");
      if (!btn) return;
      currentTab = btn.dataset.tab;
      tabsBox.innerHTML = renderTabNav();
      contentBox.innerHTML = renderContent();
    });

    contentBox.addEventListener("click", (e) => {
      const buyTileBtn = e.target.closest(".shop-buy-tile");
      const buySkinBtn = e.target.closest(".shop-buy-skin");
      const equipBtn = e.target.closest(".shop-equip-skin");
      const unequipBtn = e.target.closest(".shop-unequip-skin");
      if (buyTileBtn) {
        const tool = buyTileBtn.dataset.tool;
        const res = buyTile(save, persistSave, tool);
        if (res.ok) contentBox.innerHTML = renderContent();
        return;
      }
      if (buySkinBtn) {
        const id = buySkinBtn.dataset.skin;
        const res = buySkin(save, persistSave, id);
        if (res.ok) contentBox.innerHTML = renderContent();
        return;
      }
      if (equipBtn) {
        setActiveSkin(save, persistSave, equipBtn.dataset.skin);
        contentBox.innerHTML = renderContent();
        return;
      }
      if (unequipBtn) {
        setActiveSkin(save, persistSave, null);
        contentBox.innerHTML = renderContent();
        return;
      }
    });

    overlay.querySelector("#museum-close")?.addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
  }

  return { show };
}

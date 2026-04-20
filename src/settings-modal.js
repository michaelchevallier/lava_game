import { AVATARS, getAvatarById, avatarBadgeHtml } from "./avatars.js";

export function createSettingsModal({ save, persistSave, settings, audio, gameState, onAction }) {
  let modal = null;

  const CHAR_COLORS = ["#e74c4c", "#f1c40f", "#2ecc71", "#e91e8c"];
  const CHAR_NAMES = ["Mario", "Pika", "Luigi", "Toad"];
  const CHAR_ICONS = ["M", "P", "L", "T"];

  function buildModal() {
    modal = document.createElement("div");
    modal.id = "settings-modal-v2";
    modal.style.cssText = [
      "position:fixed", "inset:0", "z-index:99998",
      "background:rgba(15,20,35,0.95)",
      "display:none", "align-items:center", "justify-content:center",
      "font-family:system-ui,sans-serif", "pointer-events:auto",
    ].join(";");

    const panel = document.createElement("div");
    panel.style.cssText = [
      "background:rgba(20,28,50,0.98)",
      "border:2px solid rgba(255,210,63,0.5)",
      "border-radius:10px",
      "padding:24px 28px",
      "width:min(680px,94vw)",
      "max-height:90vh",
      "overflow-y:auto",
      "box-sizing:border-box",
      "color:#fff",
    ].join(";");

    const volPct = Math.round((save.volume ?? 0.7) * 100);
    const spdPct = Math.round((save.wagonSpeedMult ?? 1) * 100);
    const zoomPct = Math.round((save.zoom ?? 1) * 100);

    panel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;border-bottom:1px solid rgba(255,210,63,0.3);padding-bottom:12px">
        <h2 style="margin:0;font-size:22px;color:#ffd23f;letter-spacing:2px">PARAMETRES</h2>
        <button id="sm-close" style="background:none;border:1px solid rgba(255,255,255,0.2);color:#ccc;font-size:18px;width:32px;height:32px;border-radius:50%;cursor:pointer;line-height:1">&#x2715;</button>
      </div>

      <section style="margin-bottom:22px">
        <h3 style="margin:0 0 12px 0;font-size:15px;color:#ffd23f;text-transform:uppercase;letter-spacing:1px">Joueurs</h3>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px">
          ${[1,2].map(i => `
            <div id="sm-player-${i}" data-n="${i}" style="
              cursor:pointer;border-radius:8px;padding:10px 8px;text-align:center;width:120px;
              border:2px solid ${settings.numPlayers === i ? '#ffd23f' : 'rgba(255,255,255,0.15)'};
              background:${settings.numPlayers === i ? 'rgba(255,210,63,0.12)' : 'rgba(255,255,255,0.04)'};
              transform:${settings.numPlayers === i ? 'scale(1.04)' : 'scale(1)'};
              transition:all 0.15s ease">
              <div style="display:flex;gap:4px;justify-content:center;margin-bottom:8px;flex-wrap:wrap">
                ${Array.from({length:i}).map((_, j) => `
                  <div style="width:28px;height:36px;border-radius:4px;background:${CHAR_COLORS[j]};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;color:rgba(0,0,0,0.7)">${CHAR_ICONS[j]}</div>
                `).join("")}
              </div>
              <div style="font-size:18px;font-weight:bold;color:${settings.numPlayers === i ? '#ffd23f' : '#fff'}">${i} joueur${i>1?"s":""}</div>
              <div style="font-size:11px;color:rgba(200,220,255,0.7);margin-top:3px">${Array.from({length:i}).map((_,j)=>CHAR_NAMES[j]).join(", ")}</div>
            </div>
          `).join("")}
        </div>
        <div style="font-size:13px;color:#ffd23f;font-weight:bold;margin-bottom:8px;letter-spacing:1px">PERSONNAGES</div>
        <div style="display:flex;gap:16px;flex-wrap:wrap">
          ${[1, 2].map(i => {
            const slot = `p${i}`;
            const currentId = (save.avatars && save.avatars[slot]) || (i === 1 ? "mario" : "pika");
            return `
              <div>
                <div style="font-size:11px;color:rgba(180,210,255,0.8);margin-bottom:5px;text-align:center">Joueur ${i}</div>
                <div class="sm-avatar-grid" data-slot="${slot}" style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px;max-width:260px">
                  ${AVATARS.map(av => avatarBadgeHtml(av, 44, av.id === currentId)).join("")}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </section>

      <section style="margin-bottom:22px">
        <h3 style="margin:0 0 12px 0;font-size:15px;color:#ffd23f;text-transform:uppercase;letter-spacing:1px">Audio</h3>
        <div style="display:flex;align-items:center;gap:12px">
          <label style="color:#c8d8f0;font-size:15px;min-width:90px">Volume</label>
          <input id="sm-volume" type="range" min="0" max="100" step="1" value="${volPct}"
            style="flex:1;accent-color:#ffd23f;cursor:pointer;height:6px">
          <span id="sm-volume-val" style="color:#ffd23f;font-family:monospace;font-size:15px;min-width:42px;text-align:right">${volPct}%</span>
        </div>
      </section>

      <section style="margin-bottom:22px">
        <h3 style="margin:0 0 12px 0;font-size:15px;color:#ffd23f;text-transform:uppercase;letter-spacing:1px">Gameplay</h3>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;align-items:center;gap:12px">
            <label style="color:#c8d8f0;font-size:15px;min-width:130px">Vitesse wagons</label>
            <input id="sm-speed" type="range" min="50" max="200" step="5" value="${spdPct}"
              style="flex:1;accent-color:#7cd647;cursor:pointer;height:6px">
            <span id="sm-speed-val" style="color:#7cd647;font-family:monospace;font-size:15px;min-width:42px;text-align:right">${spdPct}%</span>
          </div>
          <div style="display:flex;align-items:center;gap:12px">
            <label style="color:#c8d8f0;font-size:15px;min-width:130px">Zoom</label>
            <input id="sm-zoom" type="range" min="70" max="140" step="5" value="${zoomPct}"
              style="flex:1;accent-color:#7cc8ff;cursor:pointer;height:6px">
            <span id="sm-zoom-val" style="color:#7cc8ff;font-family:monospace;font-size:15px;min-width:42px;text-align:right">${zoomPct}%</span>
          </div>
        </div>
      </section>

      <section style="margin-bottom:22px">
        <h3 style="margin:0 0 12px 0;font-size:15px;color:#ffd23f;text-transform:uppercase;letter-spacing:1px">Monde</h3>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button id="sm-demo" style="
            padding:10px 18px;font-size:14px;border-radius:6px;border:none;cursor:pointer;font-weight:bold;
            background:${settings.autoMode ? '#7cc947' : 'rgba(255,255,255,0.1)'};
            color:${settings.autoMode ? '#111' : '#fff'}">
            Mode Demo: ${settings.autoMode ? "ON" : "OFF"}
          </button>
          <button id="sm-night" style="
            padding:10px 18px;font-size:14px;border-radius:6px;border:none;cursor:pointer;font-weight:bold;
            background:rgba(40,60,120,0.8);color:#c8d8ff">
            Jour / Nuit (N)
          </button>
        </div>
      </section>

      <section style="margin-bottom:8px">
        <h3 style="margin:0 0 12px 0;font-size:15px;color:#ffd23f;text-transform:uppercase;letter-spacing:1px">Actions</h3>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button id="sm-build" style="padding:10px 16px;font-size:14px;border-radius:6px;border:none;cursor:pointer;background:rgba(70,90,180,0.9);color:#fff;font-weight:bold">Circuit test</button>
          <button id="sm-export" style="padding:10px 16px;font-size:14px;border-radius:6px;border:none;cursor:pointer;background:rgba(160,90,220,0.9);color:#fff;font-weight:bold">Exporter le parc</button>
          <button id="sm-help" style="padding:10px 16px;font-size:14px;border-radius:6px;border:none;cursor:pointer;background:rgba(60,130,200,0.9);color:#fff;font-weight:bold">Aide</button>
          <button id="sm-carnet" style="padding:10px 16px;font-size:14px;border-radius:6px;border:none;cursor:pointer;background:rgba(100,40,160,0.9);color:#fff;font-weight:bold">Carnet des Spectres</button>
          <button id="sm-reset" style="padding:10px 16px;font-size:14px;border-radius:6px;border:none;cursor:pointer;background:rgba(180,40,40,0.8);color:#fff;font-weight:bold">Reset score</button>
          <button id="sm-unlock-all" style="padding:10px 16px;font-size:14px;border-radius:6px;border:none;cursor:pointer;background:rgba(200,160,30,0.9);color:#111;font-weight:bold">Debloquer toutes les tuiles</button>
        </div>
      </section>
    `;

    modal.appendChild(panel);
    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) hide();
    });
    panel.querySelector("#sm-close").addEventListener("click", () => hide());

    for (let i = 1; i <= 2; i++) {
      panel.querySelector(`#sm-player-${i}`).addEventListener("click", () => {
        if (settings.numPlayers !== i) {
          settings.numPlayers = i;
          save.numPlayers = i;
          persistSave(save);
          hide();
          onAction("changeNumPlayers", i);
        }
      });
    }

    panel.querySelectorAll(".sm-avatar-grid").forEach((grid) => {
      grid.addEventListener("click", (e) => {
        const el = e.target.closest("[data-avatar-id]");
        if (!el) return;
        const avatarId = el.dataset.avatarId;
        const slot = grid.dataset.slot;
        if (!save.avatars) save.avatars = { p1: "mario", p2: "pika" };
        save.avatars[slot] = avatarId;
        persistSave(save);
        grid.querySelectorAll("[data-avatar-id]").forEach((badge) => {
          const av = getAvatarById(badge.dataset.avatarId);
          const sel = badge.dataset.avatarId === avatarId;
          badge.style.border = sel ? "3px solid #ffd23f" : "2px solid rgba(255,255,255,0.25)";
          badge.style.transform = sel ? "scale(1.05)" : "scale(1)";
          badge.style.background = sel ? av.color : av.color + "cc";
        });
      });
    });

    const slVol = panel.querySelector("#sm-volume");
    const slVolVal = panel.querySelector("#sm-volume-val");
    slVol.addEventListener("input", () => {
      const v = parseInt(slVol.value) / 100;
      slVolVal.textContent = slVol.value + "%";
      audio.setMasterVolume(v);
      save.volume = v;
      persistSave(save);
    });

    const slSpd = panel.querySelector("#sm-speed");
    const slSpdVal = panel.querySelector("#sm-speed-val");
    slSpd.addEventListener("input", () => {
      const v = parseInt(slSpd.value) / 100;
      slSpdVal.textContent = slSpd.value + "%";
      gameState.wagonSpeedMult = v;
      save.wagonSpeedMult = v;
      persistSave(save);
    });

    const slZoom = panel.querySelector("#sm-zoom");
    const slZoomVal = panel.querySelector("#sm-zoom-val");
    slZoom.addEventListener("input", () => {
      const v = parseInt(slZoom.value) / 100;
      slZoomVal.textContent = slZoom.value + "%";
      gameState.zoom = v;
      save.zoom = v;
      persistSave(save);
      onAction("zoom", v);
    });

    const demoBtn = panel.querySelector("#sm-demo");
    demoBtn.addEventListener("click", () => {
      settings.autoMode = !settings.autoMode;
      save.autoMode = settings.autoMode;
      persistSave(save);
      demoBtn.textContent = "Mode Demo: " + (settings.autoMode ? "ON" : "OFF");
      demoBtn.style.background = settings.autoMode ? "#7cc947" : "rgba(255,255,255,0.1)";
      demoBtn.style.color = settings.autoMode ? "#111" : "#fff";
      onAction("toggleDemo");
    });

    panel.querySelector("#sm-night").addEventListener("click", () => {
      onAction("toggleNight");
    });

    panel.querySelector("#sm-build").addEventListener("click", () => {
      hide();
      onAction("buildTest");
    });
    panel.querySelector("#sm-export").addEventListener("click", () => {
      hide();
      onAction("export");
    });
    panel.querySelector("#sm-help").addEventListener("click", () => {
      hide();
      onAction("help");
    });
    panel.querySelector("#sm-carnet").addEventListener("click", () => {
      hide();
      onAction("carnet");
    });
    panel.querySelector("#sm-reset").addEventListener("click", () => {
      onAction("resetScore");
      const btn = panel.querySelector("#sm-reset");
      btn.textContent = "Score efface !";
      btn.style.background = "rgba(80,180,80,0.8)";
      setTimeout(() => {
        if (btn) {
          btn.textContent = "Reset score";
          btn.style.background = "rgba(180,40,40,0.8)";
        }
      }, 1500);
    });

    panel.querySelector("#sm-unlock-all").addEventListener("click", () => {
      onAction("unlockAll");
      const btn = panel.querySelector("#sm-unlock-all");
      btn.textContent = "Toutes les tuiles debloquees !";
      btn.style.background = "rgba(80,200,80,0.9)";
      btn.style.color = "#fff";
    });
  }

  function refreshPlayerCards() {
    if (!modal) return;
    for (let i = 1; i <= 2; i++) {
      const card = modal.querySelector(`#sm-player-${i}`);
      if (!card) continue;
      const isSelected = settings.numPlayers === i;
      card.style.border = `2px solid ${isSelected ? "#ffd23f" : "rgba(255,255,255,0.15)"}`;
      card.style.background = isSelected ? "rgba(255,210,63,0.12)" : "rgba(255,255,255,0.04)";
      card.style.transform = isSelected ? "scale(1.04)" : "scale(1)";
      const numDiv = card.querySelector("div:last-child");
      if (numDiv) numDiv.style.color = isSelected ? "#ffd23f" : "#fff";
    }
  }

  function show() {
    if (!modal) buildModal();
    refreshPlayerCards();
    modal.style.display = "flex";
  }

  function hide() {
    if (modal) modal.style.display = "none";
  }

  function isVisible() {
    return modal && modal.style.display === "flex";
  }

  return { show, hide, isVisible };
}

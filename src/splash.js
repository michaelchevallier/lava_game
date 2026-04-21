import { WIDTH, HEIGHT } from "./constants.js";
import { AVATARS, getAvatarById, avatarBadgeHtml } from "./avatars.js";

export function createSplash({ save, persistSave, settings, onStart }) {
  function show() {
    const existing = document.getElementById("splash-screen");
    if (existing) existing.remove();
    const splash = document.createElement("div");
    splash.id = "splash-screen";
    splash.style.cssText =
      "position:fixed;inset:0;background:linear-gradient(180deg,#5c94fc 0%,#1a3a7c 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:99999;font-family:system-ui,sans-serif;animation:splashFadeIn 0.5s;overflow-y:auto;padding:12px 0";

    if (!save.avatars) save.avatars = { p1: "mario", p2: "pika" };
    if (!save.campaign) save.campaign = { levels: {}, totalStars: 0, unlockedWorlds: [1] };
    if (!save.runs) save.runs = {};

    let chosenMode = "sandbox";
    let chosenPlayers = Math.min(2, settings.numPlayers || 2);
    let chosenAvatars = {
      p1: save.avatars.p1 || "mario",
      p2: save.avatars.p2 || "pika",
    };

    function renderAvatarGrid(slot) {
      const currentId = chosenAvatars[slot];
      return `
        <div class="avatar-grid" data-slot="${slot}" style="
          display:grid;grid-template-columns:repeat(5,1fr);gap:5px;
          margin-top:8px;max-width:280px;
        ">
          ${AVATARS.map(av => avatarBadgeHtml(av, 48, av.id === currentId)).join("")}
        </div>
      `;
    }

    function renderContent() {
      const totalStars = save.campaign.totalStars || 0;
      const bestRun = (() => {
        const p1Id = chosenAvatars.p1;
        const arr = save.runs[p1Id] || [];
        return arr.length ? arr[0].score : 0;
      })();

      const modeCards = `
        <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;max-width:820px;padding:0 16px">
          <div data-mode="campaign" class="mode-card" style="
            flex:1;min-width:180px;max-width:240px;
            background:rgba(0,0,0,0.4);
            border:2px solid #7cc947;
            border-radius:10px;
            padding:18px 14px;
            cursor:pointer;
            text-align:center;
            transition:transform 0.15s,background 0.15s;
          ">
            <div style="font-size:32px;margin-bottom:4px">🎯</div>
            <div style="font-size:18px;color:#7cc947;font-weight:bold;letter-spacing:1px">CAMPAGNE</div>
            <div style="font-size:11px;color:#ffd23f;margin-top:6px">⭐ ${totalStars} / 90</div>
            <div style="font-size:10px;color:#aaa;margin-top:4px">30 niveaux à résoudre</div>
          </div>

          <div data-mode="run" class="mode-card" style="
            flex:1;min-width:180px;max-width:240px;
            background:rgba(0,0,0,0.4);
            border:2px solid #ff6b1c;
            border-radius:10px;
            padding:18px 14px;
            cursor:pointer;
            text-align:center;
            transition:transform 0.15s,background 0.15s;
          ">
            <div style="font-size:32px;margin-bottom:4px">⏱️</div>
            <div style="font-size:18px;color:#ff6b1c;font-weight:bold;letter-spacing:1px">RUN ARCADE</div>
            <div style="font-size:11px;color:#ffd23f;margin-top:6px">Record : ${bestRun}</div>
            <div style="font-size:10px;color:#aaa;margin-top:4px">Session 3 minutes</div>
          </div>
        </div>
      `;

      const heroes = save.heroes || {};
      const heroEntries = AVATARS
        .map(av => ({ name: av.name, color: av.color, score: heroes[av.id] || 0 }))
        .filter(h => h.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
      const heroBoard = heroEntries.length === 0 ? "" : `
        <div style="margin:14px 0 0 0;padding:12px 16px;background:rgba(0,0,0,0.4);border-radius:8px;border:1px solid rgba(255,210,63,0.4);max-width:520px;width:100%;box-sizing:border-box">
          <div style="text-align:center;color:#ffd23f;font-size:13px;font-weight:bold;margin-bottom:10px;letter-spacing:1px">CHAMPIONS DU FOYER</div>
          <div style="display:flex;justify-content:center;gap:14px;flex-wrap:wrap">
            ${heroEntries.map((h, idx) => {
              const isLeader = idx === 0;
              return `<div style="text-align:center;color:${h.color};font-family:monospace;font-size:${isLeader ? "17px" : "13px"};font-weight:${isLeader ? "bold" : "normal"}">${isLeader ? "👑 " : ""}${h.name}<br><span style="color:#fff">${h.score}</span></div>`;
            }).join("")}
          </div>
        </div>
      `;

      const avatarPickerSection = `
        <div id="avatar-picker-section" style="margin-top:14px;max-width:520px;width:100%;box-sizing:border-box;padding:0 16px">
          <div style="color:#ffd23f;font-size:13px;font-weight:bold;letter-spacing:1px;margin-bottom:10px;text-align:center">CHOISIR <span id="picker-heading">SON PERSONNAGE</span></div>
          <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">
            <div>
              <div style="color:#aad4ff;font-size:12px;text-align:center;margin-bottom:4px;font-weight:bold">JOUEUR 1</div>
              ${renderAvatarGrid("p1")}
            </div>
            <div id="p2-picker" style="display:none">
              <div style="color:#ffd23f;font-size:12px;text-align:center;margin-bottom:4px;font-weight:bold">JOUEUR 2</div>
              ${renderAvatarGrid("p2")}
            </div>
          </div>
        </div>
      `;

      const sandboxRow = `
        <div id="sandbox-row" style="margin-top:16px;display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap">
          <button id="sandbox-btn" style="
            padding:8px 18px;font-size:13px;font-weight:bold;
            background:rgba(0,0,0,0.45);color:#b4c8e8;
            border:1.5px solid #3c4e6e;border-radius:6px;cursor:pointer;
            transition:background 0.15s,color 0.15s,border-color 0.15s
          ">🧰 Bac à sable libre (1-2 joueurs)</button>
          <div id="sandbox-players" style="display:none;gap:6px">
            <button class="players-btn" data-count="1" style="padding:4px 10px;font-size:12px;background:rgba(0,0,0,0.55);color:#b4c8e8;border:1px solid #3c4e6e;border-radius:4px;cursor:pointer">1 joueur</button>
            <button class="players-btn" data-count="2" style="padding:4px 10px;font-size:12px;background:rgba(0,0,0,0.55);color:#b4c8e8;border:1px solid #3c4e6e;border-radius:4px;cursor:pointer">2 joueurs</button>
          </div>
        </div>
      `;

      return `
        <style>
          @keyframes splashFadeIn { from { opacity:0 } to { opacity:1 } }
          @keyframes splashFadeOut { from { opacity:1 } to { opacity:0 } }
          .mode-card:hover { transform:scale(1.05); background:rgba(0,0,0,0.55) !important; }
          .mode-card.selected { background:rgba(255,210,63,0.22) !important; transform:scale(1.06); box-shadow:0 0 20px rgba(255,210,63,0.35) }
          #splash-play:hover { background:#8fd45a !important; }
          #sandbox-btn:hover { background:rgba(0,0,0,0.7) !important; color:#ffd23f !important; border-color:#ffd23f !important }
          .players-btn:hover { background:rgba(255,210,63,0.25) !important; color:#ffd23f !important; border-color:#ffd23f !important }
          .players-btn.selected { background:#ffd23f !important; color:#000 !important; border-color:#ffd23f !important }
          [data-avatar-id]:hover { transform:scale(1.1) !important; }
        </style>
        <h1 style="color:#ffd23f;font-size:clamp(28px,6vw,52px);margin:0 0 6px 0;text-shadow:3px 3px 0 #000;letter-spacing:2px;text-align:center">FÊTE FORAINE</h1>
        <h2 style="color:#fff;font-size:clamp(16px,3vw,26px);margin:0 0 14px 0;text-shadow:2px 2px 0 #000">EN LAVE</h2>
        ${modeCards}
        ${avatarPickerSection}
        ${heroBoard}
        <button id="splash-play" style="margin-top:18px;padding:14px 36px;font-size:20px;font-weight:bold;background:#7cc947;color:#000;border:0;border-radius:6px;cursor:pointer;box-shadow:0 4px 0 #4a7a25;transition:background 0.15s">JOUER</button>
        ${sandboxRow}
        <div style="margin-top:10px;color:#aaa;font-size:12px">Engrenage ⚙ en bas à droite pour changer plus tard</div>
      `;
    }

    function mount() {
      splash.innerHTML = renderContent();
      document.body.appendChild(splash);

      const elP2Picker = splash.querySelector("#p2-picker");
      const elHeading = splash.querySelector("#picker-heading");
      const elPlayersBox = splash.querySelector("#sandbox-players");
      const elSandboxBtn = splash.querySelector("#sandbox-btn");

      function updateHeading() {
        if (elHeading) elHeading.textContent = (chosenMode === "sandbox" && chosenPlayers >= 2) ? "SES PERSONNAGES" : "SON PERSONNAGE";
      }
      function syncP2Visibility() {
        if (!elP2Picker) return;
        elP2Picker.style.display = (chosenMode === "sandbox" && chosenPlayers >= 2) ? "block" : "none";
      }
      function highlightModes() {
        splash.querySelectorAll(".mode-card").forEach((c) => {
          c.classList.toggle("selected", c.dataset.mode === chosenMode);
        });
        if (elPlayersBox) elPlayersBox.style.display = chosenMode === "sandbox" ? "inline-flex" : "none";
        if (elSandboxBtn) {
          elSandboxBtn.style.borderColor = chosenMode === "sandbox" ? "#ffd23f" : "#3c4e6e";
          elSandboxBtn.style.color = chosenMode === "sandbox" ? "#ffd23f" : "#b4c8e8";
          elSandboxBtn.style.background = chosenMode === "sandbox" ? "rgba(255,210,63,0.15)" : "rgba(0,0,0,0.45)";
        }
        splash.querySelectorAll(".players-btn").forEach((b) => {
          b.classList.toggle("selected", parseInt(b.dataset.count) === chosenPlayers && chosenMode === "sandbox");
        });
      }
      function applyMode(nextMode) {
        chosenMode = nextMode;
        if (nextMode !== "sandbox") chosenPlayers = 1;
        else chosenPlayers = Math.max(1, Math.min(2, chosenPlayers));
        highlightModes();
        syncP2Visibility();
        updateHeading();
      }

      highlightModes();
      syncP2Visibility();
      updateHeading();

      splash.querySelectorAll(".mode-card").forEach((c) => {
        c.addEventListener("click", () => applyMode(c.dataset.mode));
      });
      if (elSandboxBtn) elSandboxBtn.addEventListener("click", () => applyMode("sandbox"));
      splash.querySelectorAll(".players-btn").forEach((b) => {
        b.addEventListener("click", () => {
          chosenMode = "sandbox";
          chosenPlayers = parseInt(b.dataset.count);
          highlightModes();
          syncP2Visibility();
          updateHeading();
        });
      });

      splash.querySelectorAll(".avatar-grid").forEach((grid) => {
        grid.addEventListener("click", (e) => {
          const el = e.target.closest("[data-avatar-id]");
          if (!el) return;
          const avatarId = el.dataset.avatarId;
          const slot = grid.dataset.slot;
          chosenAvatars[slot] = avatarId;
          grid.querySelectorAll("[data-avatar-id]").forEach((badge) => {
            const av = getAvatarById(badge.dataset.avatarId);
            const sel = badge.dataset.avatarId === avatarId;
            badge.style.border = sel ? "3px solid #ffd23f" : "2px solid rgba(255,255,255,0.25)";
            badge.style.transform = sel ? "scale(1.05)" : "scale(1)";
            badge.style.background = sel ? av.color : av.color + "cc";
          });
        });
      });

      splash.querySelector("#splash-play").onclick = () => {
        settings.numPlayers = chosenPlayers;
        save.numPlayers = chosenPlayers;
        save.lastPlayed = Date.now();
        save.avatars = { ...chosenAvatars };
        persistSave(save);
        splash.style.animation = "splashFadeOut 0.28s forwards";
        setTimeout(() => { splash.remove(); onStart({ mode: chosenMode, numPlayers: chosenPlayers, avatars: { ...chosenAvatars } }); }, 280);
      };
    }

    mount();
  }

  return { show };
}

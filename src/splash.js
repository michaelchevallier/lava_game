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

    let chosen = Math.min(2, settings.numPlayers || 2);
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
      const players = [
        { id: 1, name: "Mario", color: "#e63946" },
        { id: 2, name: "Pika",  color: "#ffd23f" },
      ];

      const playerCards = players.map((p) => `
        <div data-count="${p.id}" class="splash-card" style="
          flex:1;min-width:130px;max-width:175px;
          background:rgba(0,0,0,0.4);
          border:2px solid ${p.color};
          border-radius:8px;
          padding:14px 10px;
          cursor:pointer;
          text-align:center;
          transition:transform 0.15s,background 0.15s;
        ">
          <div style="font-size:17px;color:#ffd23f;margin-bottom:8px;font-weight:bold">${p.id} JOUEUR${p.id > 1 ? "S" : ""}</div>
          <div style="display:flex;justify-content:center;gap:5px;margin:10px 0">
            ${players.slice(0, p.id).map(pl =>
              `<div style="width:28px;height:44px;background:${pl.color};border-radius:4px;border:2px solid #fff"></div>`
            ).join("")}
          </div>
          <div style="font-size:11px;color:#ccc">${players.slice(0, p.id).map(pl => pl.name).join(" + ")}</div>
        </div>
      `).join("");

      const heroes = save.heroes || {};
      // Affiche tous les avatars avec score > 0, triés desc, top 8
      const heroEntries = AVATARS
        .map(av => ({ name: av.name, color: av.color, score: heroes[av.id] || 0 }))
        .filter(h => h.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
      const leaderScore = heroEntries.length > 0 ? heroEntries[0].score : 0;
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
          <div style="color:#ffd23f;font-size:13px;font-weight:bold;letter-spacing:1px;margin-bottom:10px;text-align:center">CHOISIR SES PERSONNAGES</div>
          <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">
            <div>
              <div style="color:#aad4ff;font-size:12px;text-align:center;margin-bottom:4px;font-weight:bold">JOUEUR 1</div>
              ${renderAvatarGrid("p1")}
            </div>
            <div id="p2-picker" style="display:${chosen >= 2 ? "block" : "none"}">
              <div style="color:#ffd23f;font-size:12px;text-align:center;margin-bottom:4px;font-weight:bold">JOUEUR 2</div>
              ${renderAvatarGrid("p2")}
            </div>
          </div>
        </div>
      `;

      return `
        <style>
          @keyframes splashFadeIn { from { opacity:0 } to { opacity:1 } }
          @keyframes splashFadeOut { from { opacity:1 } to { opacity:0 } }
          .splash-card:hover { transform:scale(1.05); background:rgba(0,0,0,0.55) !important; }
          .splash-card.selected { background:rgba(255,210,63,0.22) !important; transform:scale(1.06); }
          #splash-play:hover { background:#8fd45a !important; }
          [data-avatar-id]:hover { transform:scale(1.1) !important; }
        </style>
        <h1 style="color:#ffd23f;font-size:clamp(28px,6vw,52px);margin:0 0 6px 0;text-shadow:3px 3px 0 #000;letter-spacing:2px;text-align:center">FETE FORAINE</h1>
        <h2 style="color:#fff;font-size:clamp(16px,3vw,26px);margin:0 0 14px 0;text-shadow:2px 2px 0 #000">EN LAVE</h2>
        <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:820px;padding:0 16px">
          ${playerCards}
        </div>
        ${avatarPickerSection}
        ${heroBoard}
        <button id="splash-play" style="margin-top:18px;padding:14px 36px;font-size:20px;font-weight:bold;background:#7cc947;color:#000;border:0;border-radius:6px;cursor:pointer;box-shadow:0 4px 0 #4a7a25;transition:background 0.15s">JOUER</button>
        <div style="margin-top:12px;color:#aaa;font-size:12px">Engrenage en haut a droite pour changer plus tard</div>
      `;
    }

    function mount() {
      splash.innerHTML = renderContent();
      document.body.appendChild(splash);

      function highlight() {
        splash.querySelectorAll(".splash-card").forEach((c) => {
          c.classList.toggle("selected", parseInt(c.dataset.count) === chosen);
        });
        const p2picker = splash.querySelector("#p2-picker");
        if (p2picker) p2picker.style.display = chosen >= 2 ? "block" : "none";
      }
      highlight();

      splash.querySelectorAll(".splash-card").forEach((c) => {
        c.addEventListener("click", () => {
          chosen = parseInt(c.dataset.count);
          highlight();
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
        settings.numPlayers = chosen;
        save.numPlayers = chosen;
        save.lastPlayed = Date.now();
        save.avatars = { ...chosenAvatars };
        persistSave(save);
        splash.style.animation = "splashFadeOut 0.28s forwards";
        setTimeout(() => { splash.remove(); onStart(); }, 280);
      };
    }

    mount();
  }

  return { show };
}

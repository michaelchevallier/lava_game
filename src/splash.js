import { WIDTH, HEIGHT } from "./constants.js";

export function createSplash({ save, persistSave, settings, onStart }) {
  function show() {
    const existing = document.getElementById("splash-screen");
    if (existing) existing.remove();
    const splash = document.createElement("div");
    splash.id = "splash-screen";
    splash.style.cssText =
      "position:fixed;inset:0;background:linear-gradient(180deg,#5c94fc 0%,#1a3a7c 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:99999;font-family:system-ui,sans-serif;animation:splashFadeIn 0.5s";

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
    const heroEntries = [
      { name: "Mario", color: "#e63946", score: heroes.mario || 0 },
      { name: "Pika",  color: "#ffd23f", score: heroes.pika  || 0 },
      { name: "Luigi", color: "#7cc947", score: heroes.luigi || 0 },
      { name: "Toad",  color: "#ff4c6d", score: heroes.toad  || 0 },
    ];
    const leaderScore = Math.max(...heroEntries.map(h => h.score));
    const heroBoard = `
      <div style="margin:18px 0 0 0;padding:12px 16px;background:rgba(0,0,0,0.4);border-radius:8px;border:1px solid rgba(255,210,63,0.4);max-width:520px;width:100%;box-sizing:border-box">
        <div style="text-align:center;color:#ffd23f;font-size:13px;font-weight:bold;margin-bottom:10px;letter-spacing:1px">CHAMPIONS DU FOYER</div>
        <div style="display:flex;justify-content:center;gap:20px;flex-wrap:wrap">
          ${heroEntries.map(h => {
            const isLeader = leaderScore > 0 && h.score === leaderScore;
            return `<div style="text-align:center;color:${h.color};font-family:monospace;font-size:${isLeader ? "17px" : "13px"};font-weight:${isLeader ? "bold" : "normal"}">${isLeader ? "👑 " : ""}${h.name}<br><span style="color:#fff">${h.score}</span></div>`;
          }).join("")}
        </div>
      </div>
    `;

    splash.innerHTML = `
      <style>
        @keyframes splashFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes splashFadeOut { from { opacity:1 } to { opacity:0 } }
        .splash-card:hover { transform:scale(1.05); background:rgba(0,0,0,0.55) !important; }
        .splash-card.selected { background:rgba(255,210,63,0.22) !important; transform:scale(1.06); }
        #splash-play:hover { background:#8fd45a !important; }
      </style>
      <h1 style="color:#ffd23f;font-size:clamp(28px,6vw,52px);margin:0 0 6px 0;text-shadow:3px 3px 0 #000;letter-spacing:2px;text-align:center">FETE FORAINE</h1>
      <h2 style="color:#fff;font-size:clamp(16px,3vw,26px);margin:0 0 28px 0;text-shadow:2px 2px 0 #000">EN LAVE</h2>
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:820px;padding:0 16px">
        ${playerCards}
      </div>
      ${heroBoard}
      <button id="splash-play" style="margin-top:22px;padding:14px 36px;font-size:20px;font-weight:bold;background:#7cc947;color:#000;border:0;border-radius:6px;cursor:pointer;box-shadow:0 4px 0 #4a7a25;transition:background 0.15s">JOUER</button>
      <div style="margin-top:16px;color:#aaa;font-size:12px">Engrenage en haut a droite pour changer plus tard</div>
    `;
    document.body.appendChild(splash);

    let chosen = Math.min(2, settings.numPlayers || 2);

    function highlight() {
      splash.querySelectorAll(".splash-card").forEach((c) => {
        c.classList.toggle("selected", parseInt(c.dataset.count) === chosen);
      });
    }
    highlight();

    splash.querySelectorAll(".splash-card").forEach((c) => {
      c.addEventListener("click", () => {
        chosen = parseInt(c.dataset.count);
        highlight();
      });
    });

    splash.querySelector("#splash-play").onclick = () => {
      settings.numPlayers = chosen;
      save.numPlayers = chosen;
      save.lastPlayed = Date.now();
      persistSave(save);
      splash.style.animation = "splashFadeOut 0.28s forwards";
      setTimeout(() => { splash.remove(); onStart(); }, 280);
    };
  }

  return { show };
}

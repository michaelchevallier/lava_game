import {
  WIDTH, HEIGHT, TILE, COLS, GROUND_ROW,
  TOOLBAR_ORDER,
  COMBO_WINDOW, COMBO_MULTIPLIERS,
  MILESTONES,
} from "./constants.js";

const TOOL_ICONS = {
  lava: "🔥", rail: "🛤", erase: "✖", rail_up: "↗", rail_down: "↘",
  water: "💧", coin: "🪙", boost: "⚡", trampoline: "🎪", fan: "🌀",
  portal: "🌀", ice: "🧊", magnet: "🧲", bridge: "🌉", wheel: "🎡",
  rail_loop: "⭕", sol: "🪨", tunnel: "🏚",
};

// Module-level handle so we can clear previous interval/listeners on scene reset
let __hudIntervalId = null;
let __hudCogHandler = null;

export function setupHtmlHud({ getCurrentTool, gameState, save, settings, onToolClick, onCogClick, k, getTiers }) {
  // Cleanup previous setup (R reset re-triggers the scene)
  if (__hudIntervalId) { clearInterval(__hudIntervalId); __hudIntervalId = null; }
  const elScore = document.getElementById("hud-score");
  const elStats = document.getElementById("hud-stats");
  const elPalier = document.getElementById("hud-palier");
  const elPalierBar = document.getElementById("hud-palier-bar");
  const elTip = document.getElementById("hud-tip");
  const elRecord = document.getElementById("hud-record");
  const elToolbar = document.getElementById("toolbar-buttons");
  const elCog = document.getElementById("cog-btn");

  const TIPS = [
    "Astuce : aligne 3 pieces en diagonale = chaine d'or",
    "Astuce : eau au-dessus d'un ventilateur = geyser",
    "Astuce : magnet voisin d'un portail = vortex",
    "Astuce : 3 glaces alignees = patinoire glissante",
    "Astuce : 5 pieces en moins de 2s = pluie d'or +50",
    "Astuce : trampoline + ventilateur = catapulte",
    "Astuce : touche L pour le rail loop 360deg (+50 par boucle)",
    "Astuce : touche K pour creuser des trous dans le sol",
    "Astuce : rail_down qui s'arrete au-dessus du vide = TOBOGGAN x3",
    "Astuce : 5 squelettes vivants + portail = Constellation Spectrale",
    "Astuce : cog en bas a droite pour les options",
    "Astuce : N pour basculer mode nuit/jour",
    "Astuce : virgule (,) pour respawn ton joueur au centre s'il sort",
    "Astuce : 7% de wagons sont dores (2x points)",
  ];
  let tipIdx = Math.floor(Math.random() * TIPS.length);
  let tipChangedAt = Date.now();
  if (elTip) elTip.textContent = TIPS[tipIdx];

  // Génère les boutons toolbar — clear avant pour éviter duplication au scene reset
  if (elToolbar) {
    elToolbar.innerHTML = "";
    for (const item of TOOLBAR_ORDER) {
      const btn = document.createElement("button");
      btn.className = "tb-btn";
      btn.dataset.tool = item.tool;
      btn.title = item.label + " (" + item.key + ")";
      btn.innerHTML = `<span class="tb-key">${item.key}</span><span class="tb-icon">${TOOL_ICONS[item.tool] || "?"}</span><span class="tb-label">${item.label}</span>`;
      btn.addEventListener("click", () => onToolClick(item.tool));
      btn.addEventListener("touchstart", (e) => { e.preventDefault(); onToolClick(item.tool); }, { passive: false });
      elToolbar.appendChild(btn);
    }
  }

  if (elCog) {
    if (__hudCogHandler) {
      elCog.removeEventListener("click", __hudCogHandler);
      elCog.removeEventListener("touchstart", __hudCogHandler);
    }
    __hudCogHandler = (e) => { if (e?.preventDefault) e.preventDefault(); onCogClick(); };
    elCog.addEventListener("click", __hudCogHandler);
    elCog.addEventListener("touchstart", __hudCogHandler, { passive: false });
  }

  function updateSelectedBtn(tool) {
    if (!elToolbar) return;
    for (const btn of elToolbar.querySelectorAll(".tb-btn")) {
      btn.classList.toggle("selected", btn.dataset.tool === tool);
    }
  }

  let cachedWagonCount = 0;
  let lastWagonCountUpdate = 0;
  let displayScore = 0;
  let lastTierUpdate = 0;

  // Conteneur objectifs tiers — remove l'ancien si présent (scene reset)
  document.getElementById("tier-objectives")?.remove();
  const elTierBox = document.createElement("div");
  elTierBox.id = "tier-objectives";
  elTierBox.style.cssText = [
    "position:fixed", "bottom:64px", "left:50%", "transform:translateX(-50%)",
    "background:rgba(15,20,40,0.88)", "border:1px solid rgba(255,210,63,0.4)",
    "border-radius:6px", "padding:4px 10px", "display:flex", "gap:12px",
    "align-items:center", "font-size:12px", "color:#c8d8ff",
    "font-family:system-ui,sans-serif", "pointer-events:none", "z-index:900",
    "white-space:nowrap",
  ].join(";");
  document.body.appendChild(elTierBox);

  function updateTierBox() {
    const tiers = getTiers?.();
    if (!tiers) { elTierBox.style.display = "none"; return; }
    const objs = tiers.getCurrentObjectives();
    if (objs.length === 0) {
      const maxReached = tiers.getCurrentTier() >= tiers.getMaxTier();
      elTierBox.textContent = maxReached ? "TIER MAX ATTEINT !" : (save.unlockedAll ? "TOUTES LES TUILES DEBLOQUEES" : "");
      elTierBox.style.display = objs.length === 0 && !maxReached && !save.unlockedAll ? "none" : "flex";
      return;
    }
    elTierBox.style.display = "flex";
    const tierNum = tiers.getCurrentTier() + 1;
    let html = `<span style="color:#ffd23f;font-weight:bold">Tier ${tierNum}</span>`;
    for (const obj of objs) {
      const done = obj.done;
      const color = done ? "#7cdc60" : "#c8d8ff";
      const check = done ? "✓ " : "";
      html += `<span style="color:${color}">${check}${obj.label} (${obj.progress}/${obj.target})</span>`;
    }
    elTierBox.innerHTML = html;
  }

  function updateToolbarLock() {
    if (!elToolbar) return;
    const tiers = getTiers?.();
    for (const btn of elToolbar.querySelectorAll(".tb-btn")) {
      const tool = btn.dataset.tool;
      const locked = tiers && !tiers.isUnlocked(tool);
      btn.classList.toggle("tb-locked", locked);
      if (locked) {
        btn.style.opacity = "0.38";
        btn.style.filter = "grayscale(0.8)";
        btn.title = btn.title.replace(" [VERROUILLE]", "") + " [VERROUILLE]";
      } else {
        btn.style.opacity = "";
        btn.style.filter = "";
        btn.title = btn.title.replace(" [VERROUILLE]", "");
      }
    }
  }

  __hudIntervalId = setInterval(() => {
    const now = Date.now();

    // Score animé
    const targetScore = gameState.score;
    const diff = targetScore - displayScore;
    if (Math.abs(diff) < 1) displayScore = targetScore;
    else displayScore += diff * 0.18;
    if (elScore) elScore.textContent = `SCORE ${Math.round(displayScore)}`;

    // Stats
    if (now - lastWagonCountUpdate > 250) {
      cachedWagonCount = k ? k.get("wagon").length : 0;
      lastWagonCountUpdate = now;
    }
    if (elStats) {
      elStats.textContent = `Wagons ${cachedWagonCount} | Squelettes ${gameState.skeletons} | Pieces ${gameState.coins} | Rates ${gameState.missed || 0}`;
    }

    // Palier — round score for display + bounds
    const intScore = Math.floor(gameState.score);
    const nextMile = MILESTONES.find((m) => m > intScore);
    if (elPalier) {
      if (nextMile != null) {
        const remain = Math.max(0, nextMile - intScore);
        elPalier.textContent = `Palier ${nextMile} (-${remain})`;
        const milestoneIdx = MILESTONES.indexOf(nextMile);
        const prevMile = milestoneIdx > 0 ? MILESTONES[milestoneIdx - 1] : 0;
        const progress = Math.max(0, Math.min(1, (intScore - prevMile) / (nextMile - prevMile)));
        if (elPalierBar) elPalierBar.style.width = `${Math.round(progress * 100)}%`;
      } else {
        elPalier.textContent = "MAX SCORE !";
        if (elPalierBar) elPalierBar.style.width = "100%";
      }
    }

    // Record
    if (elRecord) elRecord.textContent = `Record ${save.bestScore}`;

    // Tip rotation toutes les 12s
    if (now - tipChangedAt > 12000) {
      tipIdx = (tipIdx + 1) % TIPS.length;
      tipChangedAt = now;
      if (elTip) elTip.textContent = TIPS[tipIdx];
    }

    // Outil sélectionné
    updateSelectedBtn(getCurrentTool());

    // Tiers objectives + toolbar lock (toutes les 500ms)
    if (now - lastTierUpdate > 500) {
      lastTierUpdate = now;
      updateTierBox();
      updateToolbarLock();
    }
  }, 100);

  return {
    destroy: () => { if (__hudIntervalId) { clearInterval(__hudIntervalId); __hudIntervalId = null; } },
  };
}

export function createHUD({
  k, gameState, save, settings,
  getCurrentTool, fpsBuffer, fpsState, entityState, persistSave,
}) {
  const C_BLACK = k.rgb(0,0,0);

  function drawTextOutlined(opts) {
    const base = { ...opts };
    const outlineColor = opts.outlineColor || k.rgb(0, 0, 0);
    const thickness = opts.outlineThickness || 2;
    const origColor = opts.color;
    const offsets = [
      [-thickness, -thickness], [thickness, -thickness],
      [-thickness, thickness], [thickness, thickness],
    ];
    for (const [dx, dy] of offsets) {
      k.drawText({
        ...base,
        pos: k.vec2(opts.pos.x + dx, opts.pos.y + dy),
        color: outlineColor,
      });
    }
    k.drawText({ ...base, color: origColor });
  }

  function drawTextShadow(opts) {
    const origColor = opts.color;
    k.drawText({ ...opts, pos: k.vec2(opts.pos.x + 1, opts.pos.y + 1), color: C_BLACK });
    k.drawText({ ...opts, color: origColor });
  }

  function showPopup(x, y, text, color, size = 20) {
    const born = k.time();
    const lifespan = 1.0;
    const fadeStart = 0.4;
    const p = k.add([
      k.pos(x, y),
      k.z(20),
      { vy: -70, vx: (Math.random() - 0.5) * 30, born, lifespan, fadeStart, popText: text, popColor: color, popSize: size },
    ]);
    p.onUpdate(() => {
      const age = k.time() - p.born;
      if (age >= p.lifespan) { p.destroy(); return; }
      p.pos.y += p.vy * k.dt();
      p.pos.x += p.vx * k.dt();
      p.vy *= 0.97;
    });
    p.onDraw(() => {
      const age = k.time() - p.born;
      const fadeAge = p.lifespan - p.fadeStart;
      const opacity = age > fadeAge ? 1 - (age - fadeAge) / p.fadeStart : 1;
      drawTextOutlined({
        text: p.popText,
        size: p.popSize,
        pos: k.vec2(0, 0),
        anchor: "center",
        color: k.rgb(p.popColor.r, p.popColor.g, p.popColor.b),
        outlineColor: k.rgb(0, 0, 0),
        outlineThickness: 2,
        opacity,
      });
    });
    return p;
  }

  function setup() {
    // Wrap the HUD in a fixed-camera entity so it doesn't scale/translate
    // with k.camScale / k.camPos (zoom + future camera moves).
    k.add([
      k.pos(0, 0),
      k.fixed(),
      k.z(40),
      {
        draw() { renderHud(); },
      },
    ]);
  }

  function renderHud() {
    const selectedTool = getCurrentTool();

      const now = performance.now();
      fpsBuffer.push(now);
      while (fpsBuffer.length && fpsBuffer[0] < now - 1000) fpsBuffer.shift();
      if (now - fpsState.lastSec > 250) {
        fpsState.value = fpsBuffer.length;
        fpsState.lastSec = now;
      }
      if (now - entityState.stamp > 500) {
        entityState.count = k.get("*").length;
        entityState.stamp = now;
      }
      const fpsColor = fpsState.value >= 55
        ? k.rgb(124, 220, 80)
        : fpsState.value >= 35
        ? k.rgb(255, 200, 40)
        : k.rgb(255, 80, 80);
      k.drawText({
        text: `${fpsState.value}fps E${entityState.count}`,
        size: 11,
        pos: k.vec2(WIDTH - 90, HEIGHT - 16),
        color: fpsColor,
      });

      if (!settings.open && !k.getTreeRoot().paused) {
        const sm = k.mousePos();
        const wm = k.toWorld(sm);
        const col = Math.floor(wm.x / TILE);
        const row = Math.floor(wm.y / TILE);
        if (col >= 0 && col < COLS && row >= 0 && row < GROUND_ROW) {
          const ghostColor =
            selectedTool === "lava"
              ? k.rgb(255, 107, 28)
              : selectedTool === "water"
                ? k.rgb(79, 184, 232)
                : selectedTool === "coin"
                  ? k.rgb(255, 210, 50)
                  : selectedTool === "boost"
                    ? k.rgb(255, 210, 63)
                    : selectedTool === "trampoline"
                      ? k.rgb(255, 80, 130)
                      : selectedTool === "erase"
                        ? k.rgb(220, 80, 80)
                        : selectedTool === "wheel"
                          ? k.rgb(80, 220, 240)
                          : k.rgb(210, 210, 225);
          const ghostW = selectedTool === "wheel" ? TILE * 3 : TILE;
          const ghostH = selectedTool === "wheel" ? TILE * 3 : TILE;
          const ghostOx = selectedTool === "wheel" ? -TILE : 0;
          const ghostOy = selectedTool === "wheel" ? -TILE : 0;
          k.drawRect({
            pos: k.vec2(col * TILE + ghostOx, row * TILE + ghostOy),
            width: ghostW,
            height: ghostH,
            color: ghostColor,
            opacity: 0.3 + Math.sin(k.time() * 6) * 0.1,
          });
          k.drawRect({
            pos: k.vec2(col * TILE + ghostOx, row * TILE + ghostOy),
            width: ghostW,
            height: 2,
            color: ghostColor,
          });
          k.drawRect({
            pos: k.vec2(col * TILE + ghostOx, row * TILE + ghostOy + ghostH - 2),
            width: ghostW,
            height: 2,
            color: ghostColor,
          });
          k.drawRect({
            pos: k.vec2(col * TILE + ghostOx, row * TILE + ghostOy),
            width: 2,
            height: ghostH,
            color: ghostColor,
          });
          k.drawRect({
            pos: k.vec2(col * TILE + ghostOx + ghostW - 2, row * TILE + ghostOy),
            width: 2,
            height: ghostH,
            color: ghostColor,
          });
        }
      }

      const isPaused = k.getTreeRoot().paused;
      if (isPaused) {
        k.drawRect({
          pos: k.vec2(0, 0),
          width: WIDTH,
          height: HEIGHT,
          color: k.rgb(0, 0, 0),
          opacity: 0.7,
        });
        k.drawText({
          text: "PAUSE",
          size: 80,
          pos: k.vec2(WIDTH / 2, HEIGHT / 2 - 30),
          anchor: "center",
          color: k.rgb(255, 210, 63),
        });
        k.drawText({
          text: "Appuie sur P ou ECHAP pour reprendre",
          size: 18,
          pos: k.vec2(WIDTH / 2, HEIGHT / 2 + 40),
          anchor: "center",
          color: k.rgb(220, 220, 220),
        });
      }

      if ((save.plays || 0) === 0 && !isPaused && !settings.open) {
        const alpha = Math.max(0, 1 - (k.time() / 10));
        if (alpha > 0.1) {
          k.drawRect({
            pos: k.vec2(WIDTH / 2 - 300, HEIGHT / 2 - 100),
            width: 600,
            height: 200,
            color: k.rgb(0, 0, 0),
            opacity: alpha * 0.8,
          });
          k.drawRect({
            pos: k.vec2(WIDTH / 2 - 300, HEIGHT / 2 - 100),
            width: 600,
            height: 4,
            color: k.rgb(255, 210, 63),
            opacity: alpha,
          });
          k.drawText({
            text: "BIENVENUE !",
            size: 28,
            pos: k.vec2(WIDTH / 2, HEIGHT / 2 - 75),
            anchor: "center",
            color: k.rgb(255, 230, 80),
            opacity: alpha,
          });
          k.drawText({
            text: "Clique sur les outils en bas pour construire.",
            size: 17,
            pos: k.vec2(WIDTH / 2, HEIGHT / 2 - 40),
            anchor: "center",
            color: k.WHITE,
            opacity: alpha,
          });
          k.drawText({
            text: "Clique sur le terrain pour poser. X = Spawn wagon.",
            size: 17,
            pos: k.vec2(WIDTH / 2, HEIGHT / 2 - 15),
            anchor: "center",
            color: k.WHITE,
            opacity: alpha,
          });
          k.drawText({
            text: "D = Mode auto. Engrenage en haut a droite pour les options.",
            size: 17,
            pos: k.vec2(WIDTH / 2, HEIGHT / 2 + 10),
            anchor: "center",
            color: k.WHITE,
            opacity: alpha,
          });
        } else {
          save.plays = 1;
          persistSave(save);
        }
      }

      if (gameState.bulletTimeUntil > k.time()) {
        k.drawRect({
          pos: k.vec2(0, 0),
          width: WIDTH,
          height: HEIGHT,
          color: k.rgb(20, 30, 80),
          opacity: 0.25,
        });
        const pulse = 1 + Math.sin(k.time() * 8) * 0.1;
        drawTextOutlined({
          text: "BULLET TIME",
          size: 60 * pulse,
          pos: k.vec2(WIDTH / 2, HEIGHT / 2 - 80),
          anchor: "center",
          color: k.rgb(180, 220, 255),
          outlineThickness: 3,
        });
        const btRemaining = gameState.bulletTimeUntil - k.time();
        k.drawRect({
          pos: k.vec2(WIDTH / 2 - 100, HEIGHT / 2 - 30),
          width: 200 * (btRemaining / 3),
          height: 5,
          color: k.rgb(100, 180, 255),
        });
      }

      if (gameState.comboCount >= 2 && k.time() < gameState.comboExpire) {
        const remaining = gameState.comboExpire - k.time();
        const mult = COMBO_MULTIPLIERS[gameState.comboCount] || 1;
        const pulse = 1 + Math.sin(k.time() * 12) * 0.08;
        drawTextOutlined({
          text: `COMBO x${mult}`,
          size: 32 * pulse,
          pos: k.vec2(WIDTH / 2, 90),
          anchor: "center",
          color: k.rgb(255, 120, 220),
          outlineThickness: 3,
        });
        k.drawRect({
          pos: k.vec2(WIDTH / 2 - 80, 115),
          width: 160 * (remaining / COMBO_WINDOW),
          height: 4,
          color: k.rgb(255, 120, 220),
        });
      }

  }

  return {
    setup,
    showPopup,
    drawTextOutlined,
  };
}

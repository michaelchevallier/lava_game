import {
  WIDTH, HEIGHT, TILE, COLS, GROUND_ROW,
  TOOLBAR_ORDER,
  COMBO_WINDOW, COMBO_MULTIPLIERS,
  MILESTONES,
} from "./constants.js";

const TOOL_ICONS = {
  cursor: "👆",
  lava: "🔥", rail: "🛤", erase: "✖", rail_up: "↗", rail_down: "↘",
  water: "💧", coin: "🪙", boost: "⚡", trampoline: "🎪", fan: "🌀",
  portal: "🌀", ice: "🧊", magnet: "🧲", bridge: "🌉", wheel: "🎡",
  rail_loop: "⭕", sol: "🪨", tunnel: "🏚", bomb: "💣",
  alarm_flood: "💧⏱", alarm_freeze: "❄⏱", alarm_wind: "🌬⏱",
};

const TOOL_DESCRIPTIONS = {
  cursor: "Mode curseur : clique sur les entités interactives (ballons, canards, roue)",
  lava: "Transforme un wagon en squelette. Combo x5 en <2.5s = APOCALYPSE",
  rail: "Pose un rail horizontal. Les wagons roulent dessus",
  rail_up: "Rail montant diagonale ↗",
  rail_down: "Rail descendant diagonale ↘",
  water: "Ressuscite un squelette en vivant. Eau + fan au-dessus = GEYSER",
  coin: "Ramassée par le wagon = +5 pts. 3 pièces en diagonale = CHAÎNE D'OR",
  boost: "Accélère le wagon x2.2 pendant 0.6s",
  trampoline: "Fait rebondir le wagon vers le haut. Trampoline + fan au-dessus = CATAPULTE",
  fan: "Pousse le wagon vers le haut. Eau au-dessus = GEYSER",
  portal: "Téléporte le wagon à l'autre portail. Magnet à côté = VORTEX",
  ice: "Le wagon glisse. 3 glaces alignées = PATINOIRE",
  magnet: "Attire les wagons. Magnet + portail = VORTEX",
  bridge: "Pont fragile : casse après 2 passages",
  wheel: "Grande roue : produit pièces et VIP toutes les 7s",
  rail_loop: "Boucle 360° : le wagon fait un looping complet (+50 pts)",
  sol: "Pose du sol plein. 3 sols verticaux = CHAMBOULE-TOUT",
  tunnel: "Tunnel : transforme les wagons qui passent",
  bomb: "Bombe 💣 : explose au contact d'un wagon. Lave pour la bombe + 4 voisines",
  alarm_flood: "Alarme 💧 : après 10s, toutes les LAVES deviennent eau pendant 5s",
  alarm_freeze: "Alarme ❄ : après 10s, tous les wagons gelés (x0.35) pendant 3s",
  alarm_wind: "Alarme 🌬 : après 10s, tous les wagons poussés à droite pendant 2s",
  erase: "Gomme la tuile cliquée",
};

// Module-level handle so we can clear previous interval/listeners on scene reset
let __hudIntervalId = null;
let __hudCogHandler = null;

// Fix: clicking HTML toolbar while holding a movement key shifts focus so
// some browsers never deliver keyup to window → perso bloqué en déplacement.
// On synthétise keyup pour tous les bindings connus + reset mobile input.
const MOVE_KEYS = ["a", "q", "d", "j", "l", "w", "s", "z", "i", "o", "e", "space"];
function releaseHeldInputs() {
  for (const key of MOVE_KEYS) {
    const code = key === "space" ? "Space" : "Key" + key.toUpperCase();
    window.dispatchEvent(new KeyboardEvent("keyup", { key, code, bubbles: true }));
  }
  if (window.__mobileInput) {
    window.__mobileInput.left = false;
    window.__mobileInput.right = false;
    window.__mobileInput.jumpPressed = false;
    window.__mobileInput.wagonPressed = false;
  }
}
if (typeof window !== "undefined" && !window.__releaseHeldInputsBound) {
  window.__releaseHeldInputsBound = true;
  window.addEventListener("blur", releaseHeldInputs);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseHeldInputs();
  });
}

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
  const elToolbarToggle = document.getElementById("toolbar-toggle");

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
      btn.tabIndex = -1;
      const descr = TOOL_DESCRIPTIONS[item.tool] || "";
      btn.title = `${item.label} (${item.key})${descr ? " — " + descr : ""}`;
      btn.innerHTML = `<span class="tb-key">${item.key}</span><span class="tb-icon">${TOOL_ICONS[item.tool] || "?"}</span><span class="tb-label">${item.label}</span>`;
      btn.addEventListener("pointerdown", releaseHeldInputs);
      btn.addEventListener("click", () => { onToolClick(item.tool); btn.blur(); });
      btn.addEventListener("touchstart", (e) => { e.preventDefault(); releaseHeldInputs(); onToolClick(item.tool); }, { passive: false });
      elToolbar.appendChild(btn);
    }
  }

  if (elCog) {
    elCog.tabIndex = -1;
    if (__hudCogHandler) {
      elCog.removeEventListener("click", __hudCogHandler);
      elCog.removeEventListener("touchstart", __hudCogHandler);
    }
    __hudCogHandler = (e) => { if (e?.preventDefault) e.preventDefault(); releaseHeldInputs(); onCogClick(); elCog.blur?.(); };
    elCog.addEventListener("click", __hudCogHandler);
    elCog.addEventListener("touchstart", __hudCogHandler, { passive: false });
  }

  if (elToolbar && elToolbarToggle) {
    elToolbarToggle.tabIndex = -1;
    const isNarrow = window.innerWidth < 900 || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    if (isNarrow) elToolbar.classList.add("collapsed");
    else elToolbarToggle.classList.add("open");
    const toggle = (e) => {
      if (e?.preventDefault) e.preventDefault();
      releaseHeldInputs();
      const wasCollapsed = elToolbar.classList.toggle("collapsed");
      elToolbarToggle.classList.toggle("open", !wasCollapsed);
      elToolbarToggle.blur?.();
    };
    elToolbarToggle.addEventListener("click", toggle);
    elToolbarToggle.addEventListener("touchstart", toggle, { passive: false });
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

  // Campaign HUD : titre + timer + objectifs + budget (bouton au-dessus du HUD bas)
  document.getElementById("campaign-hud")?.remove();
  const elCampaignHud = document.createElement("div");
  elCampaignHud.id = "campaign-hud";
  elCampaignHud.style.cssText = [
    "position:fixed", "top:56px", "left:50%", "transform:translateX(-50%)",
    "background:rgba(15,20,40,0.95)", "border:2px solid #7cc947",
    "border-radius:8px", "padding:8px 16px", "display:none",
    "flex-direction:column", "gap:4px", "align-items:center",
    "font-size:13px", "color:#c8d8ff", "font-family:system-ui,sans-serif",
    "pointer-events:none", "z-index:900", "min-width:320px", "max-width:90vw",
  ].join(";");
  document.body.appendChild(elCampaignHud);

  function updateCampaignHud() {
    const campaign = window.__campaign;
    if (!campaign) { elCampaignHud.style.display = "none"; return; }
    const state = campaign.getCurrent();
    if (!state) { elCampaignHud.style.display = "none"; return; }
    const paused = k.getTreeRoot?.()?.paused;
    if (paused) { elCampaignHud.style.display = "none"; return; }
    elCampaignHud.style.display = "flex";
    const def = state.def;
    const elapsed = k.time() - state.startTime;
    const timeLeft = def.timeLimit > 0 ? Math.max(0, def.timeLimit - elapsed) : 0;
    const timerColor = timeLeft < 10 ? "#ff4a4a" : (timeLeft < 30 ? "#ffd23f" : "#7cdc60");
    const timerHtml = def.timeLimit > 0
      ? `<span style="color:${timerColor};font-weight:bold">⏱ ${formatTime(timeLeft)}</span>`
      : "";
    const budgetLeft = Math.max(0, (def.tileBudget || 0) - state.tilesPlaced);
    const budgetColor = budgetLeft < 2 ? "#ff4a4a" : (budgetLeft < 4 ? "#ffd23f" : "#c8d8ff");
    const budgetHtml = def.tileBudget > 0
      ? `<span style="color:${budgetColor}">🧰 ${state.tilesPlaced}/${def.tileBudget}</span>`
      : "";
    const wagonsLeft = campaign.getWagonsLeft();
    const wagonsColor = wagonsLeft <= 1 ? "#ff4a4a" : (wagonsLeft <= 2 ? "#ffd23f" : "#c8d8ff");
    const wagonsHtml = (def.wagonLimit || 0) > 0 && isFinite(wagonsLeft)
      ? `<span style="color:${wagonsColor}">🚃 ${wagonsLeft} (X)</span>`
      : "";
    const title = `<span style="color:#ffd23f;font-weight:bold">${def.world}-${def.id.split("-")[1]} · ${def.title}</span>`;
    const objectives = def.objectives.map((o) => {
      const progress = state.progress[o.id] || 0;
      const done = progress >= o.target;
      const color = done ? "#7cdc60" : "#c8d8ff";
      const check = done ? "✓ " : "";
      return `<div style="color:${color}">${check}${o.label} <span style="color:#ffd23f">(${progress}/${o.target})</span></div>`;
    }).join("");
    const status = state.status === "won"
      ? `<div style="color:#7cdc60;font-weight:bold;font-size:18px">BRAVO ! ${"⭐".repeat(state.stars)}</div>`
      : state.status === "lost"
        ? `<div style="color:#ff4a4a;font-weight:bold">RATE</div>`
        : "";
    const hintHtml = def.hint ? `<div style="color:#aad4ff;font-size:11px;font-style:italic;max-width:420px;line-height:1.35">💡 ${def.hint}</div>` : "";
    // Hint "appuie sur X" si aucun wagon encore spawné après 3s
    const showSpawnHint = state.wagonsSpawned === 0 && (k.time() - state.startTime) > 3 && state.status === "playing";
    const spawnHintHtml = showSpawnHint
      ? `<div style="color:#ffd23f;font-size:13px;font-weight:bold;background:rgba(255,210,63,0.15);padding:4px 10px;border-radius:4px;margin-top:4px;animation:spawnPulse 1s infinite alternate">↓ Appuie sur <kbd style="background:#000;color:#ffd23f;padding:2px 8px;border-radius:3px;font-family:monospace">X</kbd> pour lancer un wagon</div>`
      : "";
    elCampaignHud.innerHTML = `
      <style>@keyframes spawnPulse { from { opacity:0.8 } to { opacity:1 } }</style>
      ${title}
      <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;justify-content:center">${timerHtml}${budgetHtml}${wagonsHtml}</div>
      <div style="display:flex;flex-direction:column;gap:2px;align-items:center">${objectives}</div>
      ${hintHtml}
      ${spawnHintHtml}
      ${status}
    `;
  }

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  // Run HUD : gros timer central au-dessus
  document.getElementById("run-hud")?.remove();
  const elRunHud = document.createElement("div");
  elRunHud.id = "run-hud";
  elRunHud.style.cssText = [
    "position:fixed", "top:54px", "left:50%", "transform:translateX(-50%)",
    "background:rgba(15,20,40,0.92)", "border:3px solid #ff6b1c",
    "border-radius:10px", "padding:10px 28px", "display:none",
    "flex-direction:column", "gap:2px", "align-items:center",
    "font-family:system-ui,sans-serif", "pointer-events:none", "z-index:900",
    "min-width:200px",
  ].join(";");
  document.body.appendChild(elRunHud);

  function updateRunHud() {
    const run = window.__run;
    if (!run) { elRunHud.style.display = "none"; return; }
    const state = run.getState();
    if (!state) { elRunHud.style.display = "none"; return; }
    elRunHud.style.display = "flex";
    const elapsed = k.time() - state.startTime;
    const left = Math.max(0, state.duration - elapsed);
    const color = left < 10 ? "#ff4a4a" : (left < 30 ? "#ffd23f" : "#7cdc60");
    elRunHud.innerHTML = `
      <div style="color:${color};font-size:32px;font-weight:bold;font-family:monospace;letter-spacing:3px">
        ${formatTime(left)}
      </div>
      <div style="color:#ff6b1c;font-size:11px;letter-spacing:2px">RUN ARCADE</div>
    `;
  }

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
    const campaign = window.__campaign;
    const campaignActive = campaign && campaign.getCurrent?.();
    for (const btn of elToolbar.querySelectorAll(".tb-btn")) {
      const tool = btn.dataset.tool;
      const lockedByTier = tiers && !tiers.isUnlocked(tool);
      const lockedByCampaign = campaignActive && !campaign.isAllowed(tool);
      const locked = lockedByTier || lockedByCampaign;
      btn.classList.toggle("tb-locked", locked);
      if (locked) {
        btn.style.opacity = lockedByCampaign ? "0.18" : "0.38";
        btn.style.filter = "grayscale(0.9)";
        btn.style.pointerEvents = lockedByCampaign ? "none" : "";
        btn.title = btn.title.replace(" [INDISPONIBLE]", "").replace(" [VERROUILLE]", "")
          + (lockedByCampaign ? " [INDISPONIBLE]" : " [VERROUILLE]");
      } else {
        btn.style.opacity = "";
        btn.style.filter = "";
        btn.style.pointerEvents = "";
        btn.title = btn.title.replace(" [INDISPONIBLE]", "").replace(" [VERROUILLE]", "");
      }
    }
  }

  __hudIntervalId = setInterval(() => {
    const now = Date.now();
    const mode = window.__router?.get()?.mode || "sandbox";

    // Score animé — universel
    const targetScore = gameState.score;
    const diff = targetScore - displayScore;
    if (Math.abs(diff) < 1) displayScore = targetScore;
    else displayScore += diff * 0.18;
    if (elScore) elScore.textContent = `SCORE ${Math.round(displayScore)}`;

    // Stats — universel
    if (now - lastWagonCountUpdate > 250) {
      cachedWagonCount = k ? k.get("wagon").length : 0;
      lastWagonCountUpdate = now;
    }
    if (elStats) {
      elStats.textContent = `Wagons ${cachedWagonCount} | Squelettes ${gameState.skeletons} | Pieces ${gameState.coins} | Rates ${gameState.missed || 0}`;
    }

    // Palier MILESTONES — sandbox + run (motivation score). Campagne = caché (objectifs dédiés)
    if (elPalier) {
      if (mode === "campaign") {
        elPalier.style.display = "none";
        if (elPalierBar) elPalierBar.style.display = "none";
      } else {
        const intScore = Math.floor(gameState.score);
        const nextMile = MILESTONES.find((m) => m > intScore);
        if (nextMile != null) {
          elPalier.style.display = "";
          const remain = Math.max(0, nextMile - intScore);
          elPalier.textContent = `Palier ${nextMile} (-${remain})`;
          const milestoneIdx = MILESTONES.indexOf(nextMile);
          const prevMile = milestoneIdx > 0 ? MILESTONES[milestoneIdx - 1] : 0;
          const progress = Math.max(0, Math.min(1, (intScore - prevMile) / (nextMile - prevMile)));
          if (elPalierBar) {
            elPalierBar.style.display = "";
            elPalierBar.style.width = `${Math.round(progress * 100)}%`;
          }
        } else {
          elPalier.style.display = "none";
          if (elPalierBar) elPalierBar.style.display = "none";
        }
      }
    }

    // Record — universel
    if (elRecord) elRecord.textContent = `Record ${save.bestScore}`;

    // Tip rotation — sandbox uniquement (distraction en campagne/run)
    if (mode === "sandbox" && now - tipChangedAt > 12000) {
      tipIdx = (tipIdx + 1) % TIPS.length;
      tipChangedAt = now;
      if (elTip) elTip.textContent = TIPS[tipIdx];
    } else if (mode !== "sandbox" && elTip && elTip.textContent) {
      elTip.textContent = "";
    }

    // Outil sélectionné — universel
    updateSelectedBtn(getCurrentTool());

    // Tier box / campaign HUD / run HUD selon mode
    if (mode === "sandbox") {
      if (now - lastTierUpdate > 500) {
        lastTierUpdate = now;
        updateTierBox();
        updateToolbarLock();
      }
      if (elCampaignHud.style.display !== "none") elCampaignHud.style.display = "none";
      if (elRunHud.style.display !== "none") elRunHud.style.display = "none";
    } else if (mode === "campaign") {
      if (elTierBox.style.display !== "none") elTierBox.style.display = "none";
      if (elRunHud.style.display !== "none") elRunHud.style.display = "none";
      updateCampaignHud();
      if (now - lastTierUpdate > 500) {
        lastTierUpdate = now;
        updateToolbarLock();
      }
    } else if (mode === "run") {
      if (elTierBox.style.display !== "none") elTierBox.style.display = "none";
      if (elCampaignHud.style.display !== "none") elCampaignHud.style.display = "none";
      updateRunHud();
    } else {
      if (elTierBox.style.display !== "none") elTierBox.style.display = "none";
      if (elCampaignHud.style.display !== "none") elCampaignHud.style.display = "none";
      if (elRunHud.style.display !== "none") elRunHud.style.display = "none";
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
    // FPS sample via k.onUpdate (pas draw) : cohérence avec perf-harness
    // qui utilise la même source. Evite divergence draw-rate vs update-rate.
    k.onUpdate(() => {
      const now = performance.now();
      fpsBuffer.push(now);
      while (fpsBuffer.length && fpsBuffer[0] < now - 1000) fpsBuffer.shift();
      if (now - fpsState.lastSec > 250) {
        fpsState.value = fpsBuffer.length;
        fpsState.lastSec = now;
      }
    });
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
    // Ghost cursor preview drawn in WORLD-SPACE (not fixed) so coords match
    // tile placement under any zoom level. Without this it drifts when camScale != 1.
    k.add([
      k.pos(0, 0),
      k.z(39),
      {
        draw() { renderGhostCursor(); },
      },
    ]);
  }

  function renderHud() {
    const selectedTool = getCurrentTool();

      const now = performance.now();
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

      // Ghost cursor moved out of fixed HUD entity (see renderGhostCursor below)

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
            text: "D = Mode auto. Cog en bas a droite pour les options.",
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

  function renderGhostCursor() {
    if (settings.open || k.getTreeRoot().paused) return;
    const selectedTool = getCurrentTool();
    // Mode curseur : pas de preview tuile, on laisse le curseur natif
    if (selectedTool === "cursor") return;
    const sm = k.mousePos();
    const wm = k.toWorld(sm);
    const col = Math.floor(wm.x / TILE);
    const row = Math.floor(wm.y / TILE);
    if (col < 0 || row < 0 || row >= GROUND_ROW) return;
    if (col >= 30 && col < 35 && row >= 2 && row < 4) return; // skull stand zone
    const COLORS = {
      lava: k.rgb(255, 107, 28), water: k.rgb(79, 184, 232),
      coin: k.rgb(255, 210, 50), boost: k.rgb(255, 210, 63),
      trampoline: k.rgb(255, 80, 130), erase: k.rgb(220, 80, 80),
      wheel: k.rgb(80, 220, 240), rail: k.rgb(220, 220, 230),
      rail_up: k.rgb(150, 220, 255), rail_down: k.rgb(150, 220, 255),
      fan: k.rgb(180, 220, 240), portal: k.rgb(200, 150, 240),
      ice: k.rgb(200, 235, 255), magnet: k.rgb(220, 80, 60),
      bridge: k.rgb(160, 100, 40), rail_loop: k.rgb(180, 80, 240),
      sol: k.rgb(160, 100, 50), tunnel: k.rgb(120, 60, 180),
      bomb: k.rgb(60, 60, 60),
      alarm_flood: k.rgb(80, 160, 230),
      alarm_freeze: k.rgb(180, 230, 255),
      alarm_wind: k.rgb(200, 240, 180),
    };
    const ghostColor = COLORS[selectedTool] || k.rgb(210, 210, 225);
    const ghostW = selectedTool === "wheel" ? TILE * 3 : (selectedTool === "rail_loop" ? TILE * 2 : TILE);
    const ghostH = selectedTool === "wheel" ? TILE * 3 : (selectedTool === "rail_loop" ? TILE * 2 : TILE);
    const ghostOx = selectedTool === "wheel" ? -TILE : 0;
    const ghostOy = selectedTool === "wheel" ? -TILE : 0;
    const baseX = col * TILE + ghostOx;
    const baseY = row * TILE + ghostOy;
    k.drawRect({ pos: k.vec2(baseX, baseY), width: ghostW, height: ghostH, color: ghostColor, opacity: 0.3 + Math.sin(k.time() * 6) * 0.1 });
    // Frame
    k.drawRect({ pos: k.vec2(baseX, baseY), width: ghostW, height: 2, color: ghostColor });
    k.drawRect({ pos: k.vec2(baseX, baseY + ghostH - 2), width: ghostW, height: 2, color: ghostColor });
    k.drawRect({ pos: k.vec2(baseX, baseY), width: 2, height: ghostH, color: ghostColor });
    k.drawRect({ pos: k.vec2(baseX + ghostW - 2, baseY), width: 2, height: ghostH, color: ghostColor });
  }

  return {
    setup,
    showPopup,
    drawTextOutlined,
  };
}

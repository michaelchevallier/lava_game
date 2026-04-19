import {
  WIDTH, HEIGHT, TILE, COLS, GROUND_ROW,
  TOOLBAR_ORDER, TB_ICON, TB_GAP, TB_START_X, TB_Y,
  COG_X, COG_Y, COG_R, COMBO_WINDOW, COMBO_MULTIPLIERS,
  MILESTONES,
} from "./constants.js";

export function createHUD({
  k, gameState, save, settings, settingsOverlay, getPlayerConfigs,
  getCurrentTool, fpsBuffer, fpsState, entityState, persistSave, onCarnetBtn,
}) {
  const C_BLACK = k.rgb(0, 0, 0);
  const C_GOLD = k.rgb(255, 210, 63);
  const C_DARK_BG = k.rgb(25, 35, 55);
  const C_TOOLBAR_BORDER = k.rgb(80, 100, 130);
  const C_TOOLBAR_KEY_DIM = k.rgb(150, 170, 200);
  const C_TOOLBAR_LABEL_DIM = k.rgb(180, 200, 220);
  const C_SCORE = k.rgb(255, 230, 80);
  const C_STATS = k.rgb(230, 230, 230);
  const C_RECORD = k.rgb(180, 200, 255);

  const TOOL_LABELS = {
    lava: "LAVE",
    rail: "RAIL --",
    erase: "GOMME",
    rail_up: "RAIL /",
    rail_down: "RAIL Dn",
    water: "EAU",
    coin: "PIECE",
    boost: "BOOST",
    trampoline: "TRAMPOLINE",
    fan: "VENTILATEUR",
    portal: "PORTAIL",
    ice: "GLACE",
    magnet: "AIMANT",
    bridge: "PONT",
    wheel: "GRANDE ROUE",
  };
  const TOOL_COLORS = {
    lava: k.rgb(255, 120, 60),
    rail: k.rgb(220, 220, 230),
    erase: k.rgb(200, 200, 200),
    rail_up: k.rgb(150, 220, 255),
    rail_down: k.rgb(150, 220, 255),
    water: k.rgb(80, 180, 230),
    coin: k.rgb(255, 210, 50),
    boost: k.rgb(255, 210, 63),
    trampoline: k.rgb(255, 100, 160),
    fan: k.rgb(180, 220, 240),
    portal: k.rgb(200, 150, 240),
    ice: k.rgb(200, 235, 255),
    magnet: k.rgb(220, 80, 60),
    bridge: k.rgb(160, 100, 40),
    wheel: k.rgb(80, 220, 240),
  };

  function inCog(m) {
    const dx = m.x - COG_X;
    const dy = m.y - COG_Y;
    return dx * dx + dy * dy < COG_R * COG_R;
  }

  function inPlayerBtn(m, i) {
    const bx = WIDTH / 2 - 200 + 20 + (i - 1) * 92;
    const by = HEIGHT / 2 - 60;
    return m.x > bx && m.x < bx + 70 && m.y > by && m.y < by + 70;
  }

  function inAutoModeBtn(m) {
    const bx = WIDTH / 2 - 120;
    const by = HEIGHT / 2 + 50;
    return m.x > bx && m.x < bx + 240 && m.y > by && m.y < by + 40;
  }

  function inBuildTestBtn(m) {
    const bx = WIDTH / 2 - 120;
    const by = HEIGHT / 2 + 100;
    return m.x > bx && m.x < bx + 240 && m.y > by && m.y < by + 36;
  }

  function inExportBtn(m) {
    const bx = WIDTH / 2 - 120;
    const by = HEIGHT / 2 + 146;
    return m.x > bx && m.x < bx + 240 && m.y > by && m.y < by + 36;
  }

  function inHelpBtn(m) {
    const bx = WIDTH / 2 - 120;
    const by = HEIGHT / 2 + 192;
    return m.x > bx && m.x < bx + 240 && m.y > by && m.y < by + 36;
  }

  function inCarnetBtn(m) {
    const bx = WIDTH / 2 - 120;
    const by = HEIGHT / 2 + 238;
    return m.x > bx && m.x < bx + 240 && m.y > by && m.y < by + 36;
  }

  function toolbarHit(m) {
    if (m.y < TB_Y || m.y > TB_Y + TB_ICON) return null;
    for (let i = 0; i < TOOLBAR_ORDER.length; i++) {
      const x = TB_START_X + i * (TB_ICON + TB_GAP);
      if (m.x >= x && m.x <= x + TB_ICON) return TOOLBAR_ORDER[i].tool;
    }
    return null;
  }

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

  const TIPS = [
    "Astuce : aligne 3 pieces en diagonale = chaine d'or",
    "Astuce : eau au-dessus d'un ventilateur = geyser",
    "Astuce : magnet voisin d'un portail = vortex",
    "Astuce : 3 glaces alignees = patinoire glissante",
    "Astuce : 5 pieces en moins de 2s = pluie d'or +50",
    "Astuce : trampoline + ventilateur = catapulte",
    "Astuce : cog en haut a droite pour les options",
    "Astuce : N pour basculer mode nuit/jour",
    "Astuce : 7% de wagons sont dores (2x points)",
  ];
  let tipIdx = Math.floor(Math.random() * TIPS.length);
  let tipChangedAt = 0;

  function setup() {
    k.onDraw(() => {
      const selectedTool = getCurrentTool();
      if (k.time() - tipChangedAt > 12) {
        tipIdx = (tipIdx + 1) % TIPS.length;
        tipChangedAt = k.time();
      }

      k.drawRect({
        pos: k.vec2(0, 0),
        width: WIDTH,
        height: 62,
        color: C_BLACK,
        opacity: 0.7,
      });
      k.drawRect({
        pos: k.vec2(0, 62),
        width: WIDTH,
        height: 2,
        color: C_GOLD,
      });
      k.drawText({
        text: "Outil:",
        size: 18,
        pos: k.vec2(12, 8),
        color: k.WHITE,
      });
      k.drawText({
        text: TOOL_LABELS[selectedTool],
        size: 18,
        pos: k.vec2(78, 8),
        color: TOOL_COLORS[selectedTool],
      });
      drawTextOutlined({
        text: `SCORE ${gameState.score}`,
        size: 22,
        pos: k.vec2(WIDTH - 320, 6),
        color: C_SCORE,
      });
      const wagonCount = k.get("wagon").length;
      k.drawText({
        text: `Wagons ${wagonCount}  Squelettes ${gameState.skeletons}  Pieces ${gameState.coins}  Rates ${gameState.missed || 0}`,
        size: 16,
        pos: k.vec2(WIDTH - 380, 32),
        color: C_STATS,
      });
      k.drawText({
        text: `Record ${save.bestScore}`,
        size: 15,
        pos: k.vec2(WIDTH - 320, 52),
        color: C_RECORD,
      });
      const nextMile = MILESTONES.find((m) => m > gameState.score);
      if (nextMile != null) {
        const remain = nextMile - gameState.score;
        drawTextOutlined({
          text: `Prochain palier ${nextMile} (-${remain})`,
          size: 13,
          pos: k.vec2(WIDTH - 320, 70),
          color: k.rgb(255, 200, 100),
        });
        const idx = MILESTONES.indexOf(nextMile);
        const prevMile = idx > 0 ? MILESTONES[idx - 1] : 0;
        const progress = Math.max(0, Math.min(1, (gameState.score - prevMile) / (nextMile - prevMile)));
        k.drawRect({
          pos: k.vec2(WIDTH - 320, 90),
          width: 200,
          height: 6,
          color: k.rgb(40, 50, 70),
          radius: 3,
        });
        k.drawRect({
          pos: k.vec2(WIDTH - 320, 90),
          width: 200 * progress,
          height: 6,
          color: k.rgb(255, 200, 100),
          radius: 3,
        });
      }
      // Rotating tip in HUD bottom band
      if (!settings.open) {
        const tipAge = k.time() - tipChangedAt;
        const fade = tipAge < 0.4 ? tipAge / 0.4 : (12 - tipAge < 0.4 ? (12 - tipAge) / 0.4 : 1);
        drawTextOutlined({
          text: TIPS[tipIdx],
          size: 12,
          pos: k.vec2(12, HEIGHT - 100),
          color: k.rgb(200, 220, 255),
          opacity: Math.max(0, Math.min(1, fade)) * 0.85,
        });
      }

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

      for (let i = 0; i < TOOLBAR_ORDER.length; i++) {
        const item = TOOLBAR_ORDER[i];
        const bx = TB_START_X + i * (TB_ICON + TB_GAP);
        const by = TB_Y;
        const isSelected = selectedTool === item.tool;
        k.drawRect({
          pos: k.vec2(bx, by),
          width: TB_ICON,
          height: TB_ICON,
          color: isSelected ? C_GOLD : C_DARK_BG,
        });
        k.drawRect({
          pos: k.vec2(bx, by),
          width: TB_ICON,
          height: 3,
          color: isSelected ? k.WHITE : C_TOOLBAR_BORDER,
        });
        const cx = bx + TB_ICON / 2;
        const cy = by + TB_ICON / 2;
        if (item.tool === "lava") {
          k.drawRect({
            pos: k.vec2(bx + 8, by + 12),
            width: TB_ICON - 16,
            height: TB_ICON - 20,
            color: k.rgb(255, 107, 28),
          });
        } else if (item.tool === "water") {
          k.drawRect({
            pos: k.vec2(bx + 8, by + 12),
            width: TB_ICON - 16,
            height: TB_ICON - 20,
            color: k.rgb(79, 184, 232),
          });
        } else if (item.tool === "coin") {
          k.drawCircle({ pos: k.vec2(cx, cy + 3), radius: 13, color: k.rgb(255, 210, 50) });
          k.drawCircle({ pos: k.vec2(cx, cy + 3), radius: 7, color: k.rgb(200, 150, 0) });
        } else if (item.tool === "rail") {
          k.drawRect({
            pos: k.vec2(bx + 6, cy - 2),
            width: TB_ICON - 12,
            height: 5,
            color: k.rgb(210, 210, 225),
          });
          k.drawRect({
            pos: k.vec2(bx + 8, cy + 6),
            width: 4,
            height: 8,
            color: k.rgb(100, 60, 30),
          });
          k.drawRect({
            pos: k.vec2(bx + TB_ICON - 12, cy + 6),
            width: 4,
            height: 8,
            color: k.rgb(100, 60, 30),
          });
        } else if (item.tool === "rail_up" || item.tool === "rail_down") {
          const angle = item.tool === "rail_up" ? -45 : 45;
          k.drawRect({
            pos: k.vec2(cx, cy + 3),
            width: TB_ICON - 14,
            height: 5,
            anchor: "center",
            angle,
            color: k.rgb(210, 210, 225),
          });
        } else if (item.tool === "boost") {
          k.drawRect({
            pos: k.vec2(bx + 6, by + 10),
            width: TB_ICON - 12,
            height: TB_ICON - 16,
            color: k.rgb(255, 210, 63),
          });
          k.drawText({
            text: ">>",
            size: 22,
            pos: k.vec2(cx, cy + 2),
            anchor: "center",
            color: k.rgb(20, 20, 20),
          });
        } else if (item.tool === "trampoline") {
          k.drawRect({
            pos: k.vec2(bx + 6, cy - 2),
            width: TB_ICON - 12,
            height: 5,
            color: k.rgb(255, 80, 130),
          });
          k.drawRect({
            pos: k.vec2(bx + 10, cy + 4),
            width: 3,
            height: 10,
            color: k.rgb(200, 200, 215),
          });
          k.drawRect({
            pos: k.vec2(bx + TB_ICON - 13, cy + 4),
            width: 3,
            height: 10,
            color: k.rgb(200, 200, 215),
          });
        } else if (item.tool === "bridge") {
          k.drawRect({
            pos: k.vec2(bx + 6, cy),
            width: TB_ICON - 12,
            height: 6,
            color: k.rgb(160, 100, 40),
          });
          k.drawRect({
            pos: k.vec2(bx + 6, cy + 6),
            width: TB_ICON - 12,
            height: 4,
            color: k.rgb(120, 70, 30),
          });
          k.drawRect({
            pos: k.vec2(bx + TB_ICON / 2 - 2, cy - 6),
            width: 3,
            height: 18,
            color: k.rgb(100, 60, 20),
          });
        } else if (item.tool === "magnet") {
          k.drawRect({
            pos: k.vec2(bx + 10, by + 12),
            width: 4,
            height: TB_ICON - 20,
            color: k.rgb(40, 40, 40),
          });
          k.drawRect({
            pos: k.vec2(bx + TB_ICON - 14, by + 12),
            width: 4,
            height: TB_ICON - 20,
            color: k.rgb(40, 40, 40),
          });
          k.drawRect({
            pos: k.vec2(bx + 10, by + 12),
            width: 4,
            height: 4,
            color: k.rgb(210, 80, 60),
          });
          k.drawRect({
            pos: k.vec2(bx + TB_ICON - 14, by + 12),
            width: 4,
            height: 4,
            color: k.rgb(210, 80, 60),
          });
          k.drawRect({
            pos: k.vec2(bx + 10, by + TB_ICON - 14),
            width: TB_ICON - 20,
            height: 4,
            color: k.rgb(40, 40, 40),
          });
        } else if (item.tool === "ice") {
          k.drawRect({
            pos: k.vec2(bx + 8, by + 10),
            width: TB_ICON - 16,
            height: TB_ICON - 18,
            color: k.rgb(180, 230, 255),
          });
          k.drawRect({
            pos: k.vec2(bx + 12, cy - 6),
            width: TB_ICON - 24,
            height: 2,
            color: k.rgb(255, 255, 255),
            opacity: 0.9,
          });
          k.drawRect({
            pos: k.vec2(bx + 12, cy + 4),
            width: (TB_ICON - 24) / 2,
            height: 2,
            color: k.rgb(255, 255, 255),
            opacity: 0.7,
          });
        } else if (item.tool === "portal") {
          k.drawCircle({
            pos: k.vec2(cx - 7, cy),
            radius: TB_ICON / 2 - 10,
            color: k.rgb(80, 220, 240),
            outline: { width: 1, color: k.rgb(200, 250, 255) },
          });
          k.drawCircle({
            pos: k.vec2(cx + 7, cy),
            radius: TB_ICON / 2 - 10,
            color: k.rgb(240, 80, 220),
            outline: { width: 1, color: k.rgb(255, 200, 250) },
          });
        } else if (item.tool === "fan") {
          k.drawCircle({
            pos: k.vec2(cx, cy),
            radius: TB_ICON / 2 - 6,
            color: k.rgb(180, 210, 230),
          });
          const rot = k.time() * 4;
          for (let b = 0; b < 4; b++) {
            const a = rot + (Math.PI / 2) * b;
            k.drawRect({
              pos: k.vec2(cx, cy),
              width: TB_ICON - 14,
              height: 4,
              anchor: "center",
              angle: (a * 180) / Math.PI,
              color: k.rgb(100, 140, 180),
            });
          }
          k.drawCircle({ pos: k.vec2(cx, cy), radius: 3, color: k.rgb(40, 40, 50) });
        } else if (item.tool === "wheel") {
          k.drawCircle({
            pos: k.vec2(cx, cy),
            radius: TB_ICON / 2 - 8,
            color: k.rgb(25, 35, 55),
            outline: { width: 2, color: k.rgb(190, 170, 120) },
          });
          const wRot = k.time() * 12 * (Math.PI / 180);
          const NCOL = [k.rgb(80, 220, 240), k.rgb(240, 80, 80), k.rgb(255, 210, 50), k.rgb(180, 80, 240)];
          const wR = TB_ICON / 2 - 8;
          for (let n = 0; n < 4; n++) {
            const a = wRot + (Math.PI / 2) * n;
            k.drawRect({
              pos: k.vec2(cx + Math.cos(a) * wR, cy + Math.sin(a) * wR),
              width: 8,
              height: 5,
              anchor: "center",
              color: NCOL[n],
            });
          }
          k.drawCircle({ pos: k.vec2(cx, cy), radius: 3, color: k.rgb(210, 190, 140) });
        } else if (item.tool === "erase") {
          k.drawText({
            text: "X",
            size: 28,
            pos: k.vec2(cx, cy + 2),
            anchor: "center",
            color: k.rgb(220, 80, 80),
          });
        }
        k.drawText({
          text: item.key,
          size: 13,
          pos: k.vec2(bx + TB_ICON - 4, by + 3),
          anchor: "topright",
          color: isSelected ? k.rgb(30, 30, 40) : C_TOOLBAR_KEY_DIM,
        });
        k.drawText({
          text: item.label,
          size: 11,
          pos: k.vec2(cx, by + TB_ICON - 10),
          anchor: "center",
          color: isSelected ? k.rgb(30, 30, 40) : C_TOOLBAR_LABEL_DIM,
        });
      }

      k.drawCircle({
        pos: k.vec2(COG_X, COG_Y),
        radius: COG_R,
        color: k.rgb(40, 40, 55),
      });
      k.drawCircle({
        pos: k.vec2(COG_X, COG_Y),
        radius: COG_R - 4,
        color: k.rgb(255, 210, 63),
      });
      k.drawCircle({
        pos: k.vec2(COG_X, COG_Y),
        radius: 6,
        color: k.rgb(40, 40, 55),
      });
      const cogSpin = k.time() * 0.5;
      for (let i = 0; i < 6; i++) {
        const a = cogSpin + (Math.PI * 2 * i) / 6;
        k.drawRect({
          pos: k.vec2(
            COG_X + Math.cos(a) * (COG_R - 2) - 4,
            COG_Y + Math.sin(a) * (COG_R - 2) - 4,
          ),
          width: 8,
          height: 8,
          color: k.rgb(255, 210, 63),
        });
      }

      if (!settings.open && !k.getTreeRoot().paused) {
        const sm = k.mousePos();
        if (sm.y > 65 && sm.y < TB_Y - 10 && !inCog(sm)) {
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

      if (settings.open) {
        k.drawRect({
          pos: k.vec2(0, 0),
          width: WIDTH,
          height: HEIGHT,
          color: k.rgb(0, 0, 0),
          opacity: 0.75,
        });
        const panelW = 440;
        const panelH = 480;
        const panelX = WIDTH / 2 - panelW / 2;
        const panelY = HEIGHT / 2 - panelH / 2;
        k.drawRect({
          pos: k.vec2(panelX, panelY),
          width: panelW,
          height: panelH,
          color: k.rgb(30, 40, 60),
        });
        k.drawRect({
          pos: k.vec2(panelX, panelY),
          width: panelW,
          height: 4,
          color: k.rgb(255, 210, 63),
        });
        k.drawText({
          text: "PARAMETRES",
          size: 30,
          pos: k.vec2(WIDTH / 2, panelY + 25),
          anchor: "top",
          color: k.rgb(255, 230, 80),
        });
        k.drawText({
          text: "Nombre de joueurs",
          size: 18,
          pos: k.vec2(WIDTH / 2, panelY + 70),
          anchor: "top",
          color: k.WHITE,
        });
        const playerConfigs = getPlayerConfigs();
        for (let i = 1; i <= 4; i++) {
          const bx = panelX + 20 + (i - 1) * 92;
          const by = panelY + 120;
          const isSelected = settings.numPlayers === i;
          const cfg = playerConfigs[i - 1];
          k.drawRect({
            pos: k.vec2(bx, by),
            width: 70,
            height: 70,
            color: isSelected ? cfg.color : k.rgb(50, 60, 85),
          });
          k.drawRect({
            pos: k.vec2(bx, by),
            width: 70,
            height: 4,
            color: isSelected ? k.rgb(255, 255, 255) : k.rgb(90, 110, 140),
          });
          drawTextOutlined({
            text: String(i),
            size: 36,
            pos: k.vec2(bx + 35, by + 32),
            anchor: "center",
            color: isSelected ? k.rgb(20, 20, 30) : k.WHITE,
            outlineColor: isSelected ? k.rgb(200, 200, 200) : k.rgb(0, 0, 0),
          });
          k.drawText({
            text: cfg.name,
            size: 11,
            pos: k.vec2(bx + 35, by + 82),
            anchor: "top",
            color: isSelected ? cfg.color : k.rgb(180, 200, 220),
          });
        }
        const autoBx = WIDTH / 2 - 120;
        const autoBy = HEIGHT / 2 + 50;
        k.drawRect({
          pos: k.vec2(autoBx, autoBy),
          width: 240,
          height: 40,
          color: settings.autoMode ? k.rgb(124, 201, 71) : k.rgb(60, 80, 110),
        });
        k.drawText({
          text: settings.autoMode ? "MODE DEMO: ON" : "MODE DEMO: OFF",
          size: 18,
          pos: k.vec2(WIDTH / 2, autoBy + 20),
          anchor: "center",
          color: k.WHITE,
        });
        const testBx = WIDTH / 2 - 120;
        const testBy = HEIGHT / 2 + 100;
        k.drawRect({
          pos: k.vec2(testBx, testBy),
          width: 240,
          height: 36,
          color: k.rgb(70, 90, 140),
        });
        k.drawText({
          text: "Construire circuit test",
          size: 16,
          pos: k.vec2(WIDTH / 2, testBy + 18),
          anchor: "center",
          color: k.WHITE,
        });
        const expBx = WIDTH / 2 - 120;
        const expBy = HEIGHT / 2 + 146;
        k.drawRect({
          pos: k.vec2(expBx, expBy),
          width: 240,
          height: 36,
          color: k.rgb(186, 120, 220),
        });
        k.drawText({
          text: "Sauvegarder / Charger parc",
          size: 15,
          pos: k.vec2(WIDTH / 2, expBy + 18),
          anchor: "center",
          color: k.WHITE,
        });
        const helpBx = WIDTH / 2 - 120;
        const helpBy = HEIGHT / 2 + 192;
        k.drawRect({
          pos: k.vec2(helpBx, helpBy),
          width: 240,
          height: 36,
          color: k.rgb(80, 140, 200),
        });
        k.drawText({
          text: "Aide / Interactions",
          size: 16,
          pos: k.vec2(WIDTH / 2, helpBy + 18),
          anchor: "center",
          color: k.WHITE,
        });
        const carnetBx = WIDTH / 2 - 120;
        const carnetBy = HEIGHT / 2 + 238;
        k.drawRect({
          pos: k.vec2(carnetBx, carnetBy),
          width: 240,
          height: 36,
          color: k.rgb(120, 60, 180),
        });
        k.drawText({
          text: "Carnet des Spectres",
          size: 15,
          pos: k.vec2(WIDTH / 2, carnetBy + 18),
          anchor: "center",
          color: k.WHITE,
        });
        k.drawText({
          text: "(M) Son  (N) Nuit  (R) Reset  (P) Pause",
          size: 12,
          pos: k.vec2(WIDTH / 2, panelY + panelH - 40),
          anchor: "top",
          color: k.rgb(180, 200, 220),
        });
        k.drawText({
          text: "Clic sur l'engrenage pour fermer",
          size: 11,
          pos: k.vec2(WIDTH / 2, panelY + panelH - 18),
          anchor: "top",
          color: k.rgb(140, 160, 190),
        });
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

      k.drawText({
        text: "(1)Lave (2)Rail (4)Up (5)Dn (6)Eau (7)Boost (8)Piece (9)Trampo (3)Gomme",
        size: 14,
        pos: k.vec2(180, 10),
        color: k.rgb(220, 220, 220),
      });
      k.drawText({
        text: "MARIO A/D/Esp/E  PIKA J/L/I/O  LUIGI fleches+Enter  TOAD F/H/T/G",
        size: 14,
        pos: k.vec2(12, 30),
        color: k.rgb(255, 210, 63),
      });
      k.drawText({
        text: "(X) Wagon  (C) Vider  (R) Reset    (Dans le wagon, saute pour faire sauter le wagon)",
        size: 14,
        pos: k.vec2(12, 46),
        color: k.rgb(180, 220, 255),
      });
    });
  }

  return {
    setup,
    showPopup,
    drawTextOutlined,
    inCog,
    inPlayerBtn,
    inAutoModeBtn,
    inBuildTestBtn,
    inExportBtn,
    inHelpBtn,
    inCarnetBtn,
    toolbarHit,
  };
}

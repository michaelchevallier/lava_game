import * as Phaser from "phaser";
import { WORLDS, getLevel, isWorldUnlocked, isLevelUnlocked, totalLevels, CARNIVAL_LEVELS } from "../data/levels/index.js";
import { loadSave, getStars, isCompleted, totalStars, getEndlessTop } from "../systems/SaveSystem.js";
import { Audio } from "../systems/Audio.js";
import { MusicManager } from "../systems/MusicManager.js";
import { getTheme } from "../systems/Theme.js";
import { unlockedCount, TROPHIES, trophyBonus } from "../systems/Trophies.js";
import { hasPlayedToday, getDailyResult, getDailyStreak } from "../systems/Daily.js";
import { shouldShowCutscene } from "./CutsceneScene.js";
import { makeClickable } from "../ui/Clickable.js";

export class CampaignMenuScene extends Phaser.Scene {
  constructor() {
    super("CampaignMenuScene");
  }

  create() {
    const { width, height } = this.scale;

    MusicManager.play("menu");
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.cameras.main.setBackgroundColor("#0a0510");

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a2a, 0x1a0a2a, 0xff6b1c, 0xff4400, 1);
    bg.fillRect(0, 0, width, height);

    for (let i = 0; i < 60; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height * 0.5;
      const star = this.add.circle(sx, sy, Math.random() * 1.4 + 0.4, [0xffffff, 0xffd23f, 0xff66cc, 0x88ccff][i % 4], Math.random() * 0.6 + 0.2);
      this.tweens.add({ targets: star, alpha: { from: 0.2, to: 0.9 }, duration: 800 + Math.random() * 1500, yoyo: true, repeat: -1 });
    }
    for (let i = 0; i < 4; i++) {
      const cy = 30 + (i * 23) % 60;
      const cw = 100 + Math.random() * 80;
      const cloud = this.add.ellipse((i * 380 + 100) % width, cy, cw, 26, 0x6a4a8a, 0.4);
      this.tweens.add({ targets: cloud, x: cloud.x + width + 200, duration: 60000 + i * 10000, repeat: -1 });
    }
    for (let i = 0; i < 5; i++) {
      const flame = this.add.triangle(Math.random() * width, height * 0.85 + Math.random() * 80, 0, 14, 8, -10, 16, 14, 0xff8800, 0.35);
      this.tweens.add({ targets: flame, scale: { from: 0.7, to: 1.3 }, duration: 800 + Math.random() * 600, yoyo: true, repeat: -1 });
    }
    this.time.addEvent({
      delay: 600, loop: true,
      callback: () => {
        if (!this.scene.isActive()) return;
        const sx = Math.random() * width;
        const ember = this.add.circle(sx, height + 10, 1.5, [0xff8800, 0xffd23f][Math.floor(Math.random() * 2)], 0.85).setDepth(45);
        this.tweens.add({
          targets: ember, y: height * 0.4 + Math.random() * 100,
          x: sx + (Math.random() - 0.5) * 120,
          alpha: 0,
          duration: 4500 + Math.random() * 1500,
          ease: "Sine.out",
          onComplete: () => ember.destroy(),
        });
      },
    });

    const titleShadow = this.add.text(width / 2 + 3, 50 + 3, "MILAN PARK DEFENSE", {
      fontFamily: "Bangers, Fredoka, system-ui",
      fontSize: "62px",
      fontStyle: "bold",
      color: "#000",
    }).setOrigin(0.5).setAlpha(0.5);

    const title = this.add.text(width / 2, 50, "MILAN PARK DEFENSE", {
      fontFamily: "Bangers, Fredoka, system-ui",
      fontSize: "62px",
      fontStyle: "bold",
      color: "#ffd23f",
      stroke: "#000",
      strokeThickness: 6,
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, scale: { from: 1, to: 1.02 }, duration: 1800, yoyo: true, repeat: -1, ease: "Sine.inOut" });


    const total = totalStars();
    const starsBox = this.add.container(width - 110, 50);
    const starsBg = this.add.rectangle(0, 0, 200, 50, 0x000, 0.5).setStrokeStyle(2, 0xffd23f);
    const starsLabel = this.add.text(0, 0, "★ " + total + " / " + (totalLevels() * 3), {
      fontFamily: "Fredoka, system-ui",
      fontSize: "24px",
      fontStyle: "bold",
      color: "#ffd23f",
    }).setOrigin(0.5);
    starsBox.add([starsBg, starsLabel]);

    this.drawTrophyButton();
    this.drawStatsButton();
    this.drawFairgroundButton();
    this.drawEncyclopediaButton();

    this.scrollContainer = this.add.container(0, 0);
    this.scrollContainer.setDepth(5);

    let y = 142;
    for (const world of WORLDS) {
      this.drawWorldRow(world, y);
      y += 80;
    }
    const bottomY = y + 8;
    this.drawEndlessButton(bottomY);
    this.drawCarnivalButton(bottomY);
    this.drawBossArenaButton(bottomY);
    this.drawDailyButton();

    const contentBottom = bottomY + 100;
    const viewport = this.scale.height;
    const overflow = Math.max(0, contentBottom - viewport + 20);
    this._scrollMin = -overflow;
    this._scrollY = 0;

    if (overflow > 0) {
      this.input.on("wheel", (_p, _go, _dx, dy) => {
        this._scrollY = Phaser.Math.Clamp(this._scrollY - dy * 0.6, this._scrollMin, 0);
        this.scrollContainer.y = this._scrollY;
      });

      let dragStartY = null;
      let dragStartScroll = 0;
      this.input.on("pointerdown", (p) => {
        if (p.y > 142) {
          dragStartY = p.y;
          dragStartScroll = this._scrollY;
        }
      });
      this.input.on("pointermove", (p) => {
        if (dragStartY != null && p.isDown && Math.abs(p.y - dragStartY) > 8) {
          this._scrollY = Phaser.Math.Clamp(dragStartScroll + (p.y - dragStartY), this._scrollMin, 0);
          this.scrollContainer.y = this._scrollY;
        }
      });
      this.input.on("pointerup", () => { dragStartY = null; });

      const arrowY = 142 + 4;
      const arrow = this.add.text(this.scale.width - 30, arrowY, "▼", {
        fontFamily: "Fredoka, system-ui",
        fontSize: "18px",
        color: "#ffd23f",
        stroke: "#000",
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(60);
      this.tweens.add({ targets: arrow, y: arrowY + 6, duration: 700, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    }
  }

  _addScroll(...objs) {
    if (!this.scrollContainer) return;
    for (const o of objs) {
      if (o && o.scene) this.scrollContainer.add(o);
    }
  }

  drawBossArenaButton(y) {
    const { width } = this.scale;
    const third = (width - 80) / 3;
    const x = 30 + 2 * (third + 10);
    const unlocked = isLevelUnlocked("boss-arena");
    const result = isCompleted("boss-arena");
    const cy = y + 40;

    const btn = makeClickable(this, {
      x: x + third / 2, y: cy, width: third, height: 88,
      radius: 10,
      fillColor: 0x000000, fillAlpha: 0.55,
      strokeColor: unlocked ? 0xff2222 : 0x4a4a4a,
      strokeWidth: 3,
      hoverFill: unlocked ? 0x2a0a0a : 0x000000,
      hoverStroke: 0xffd23f,
      enabled: unlocked,
      label: (unlocked ? "⚔️ ARÈNE BOSS" : "🔒 ARÈNE BOSS") + (result ? "  ✅" : ""),
      labelStyle: { fontFamily: "Fredoka, system-ui", fontSize: "18px", fontStyle: "bold", color: unlocked ? "#ff8888" : "#666", stroke: "#000", strokeThickness: 4 },
      sub: unlocked ? "3 boss en série — 0 erreur" : "Termine 5.6",
      subStyle: { fontFamily: "Fredoka, system-ui", fontSize: "12px", color: unlocked ? "#ffeebb" : "#777" },
      onClick: () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("LevelScene", { levelId: "boss-arena" });
          this.scene.stop();
        });
      },
    });
    this._addScroll(btn);
  }

  drawStatsButton() {
    makeClickable(this, {
      x: 110, y: 110, width: 95, height: 38,
      fillColor: 0x000000, fillAlpha: 0.5,
      strokeColor: 0x88aaff,
      hoverFill: 0x1a3a6a,
      label: "📊 Stats",
      labelStyle: { fontFamily: "Fredoka, system-ui", fontSize: "14px", fontStyle: "bold", color: "#88ccff" },
      onClick: () => {
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("StatsScene");
          this.scene.stop();
        });
      },
    });
  }

  drawEncyclopediaButton() {
    makeClickable(this, {
      x: 320, y: 110, width: 95, height: 38,
      fillColor: 0x000000, fillAlpha: 0.5,
      strokeColor: 0x90ff90,
      hoverFill: 0x1a3a1a,
      label: "📖 Aide",
      labelStyle: { fontFamily: "Fredoka, system-ui", fontSize: "14px", fontStyle: "bold", color: "#bbffbb" },
      onClick: () => {
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("EncyclopediaScene");
          this.scene.stop();
        });
      },
    });
  }

  drawFairgroundButton() {
    makeClickable(this, {
      x: 215, y: 110, width: 95, height: 38,
      fillColor: 0x000000, fillAlpha: 0.5,
      strokeColor: 0xff66cc,
      hoverFill: 0x3a1a3a,
      label: "🎪 Foire",
      labelStyle: { fontFamily: "Fredoka, system-ui", fontSize: "14px", fontStyle: "bold", color: "#ff99dd" },
      onClick: () => {
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("FairgroundHubScene");
          this.scene.stop();
        });
      },
    });
  }

  drawDailyButton() {
    const { width } = this.scale;
    const played = hasPlayedToday();
    const result = getDailyResult();
    const streak = getDailyStreak();
    const x = width / 2;
    const y = 100;

    const lblText = played
      ? "🌟 Défi du Jour " + "★".repeat(result?.stars || 0) + (streak > 1 ? "  •  " + streak + "🔥" : "")
      : "🎯 Défi du Jour" + (streak > 0 ? "  •  " + streak + "🔥" : "");

    const box = makeClickable(this, {
      x, y, width: 320, height: 56,
      fillColor: played ? 0x1a3a1a : 0x3a1a3a,
      fillAlpha: 0.9,
      strokeColor: played ? 0x66ff88 : 0xff66cc,
      hoverFill: played ? 0x2a5a2a : 0x5a2a5a,
      label: lblText,
      labelStyle: { fontFamily: "Fredoka, system-ui", fontSize: "16px", fontStyle: "bold", color: played ? "#aaffaa" : "#ffd23f" },
      sub: played ? "Terminé — reviens demain" : "1 essai par jour — niveau aléatoire",
      subStyle: { fontFamily: "Fredoka, system-ui", fontSize: "11px", color: played ? "#88dd88" : "#ffaaee" },
      onClick: () => {
        if (played) {
          this.tweens.add({ targets: box, x: { from: x - 6, to: x + 6 }, duration: 60, yoyo: true, repeat: 2, onComplete: () => { box.x = x; } });
          return;
        }
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("LevelScene", { levelId: "daily" });
          this.scene.stop();
        });
      },
    });
  }

  drawCarnivalButton(y) {
    const { width } = this.scale;
    const completed = CARNIVAL_LEVELS.filter((id) => isCompleted(id)).length;

    const third = (width - 80) / 3;
    const cx = 30 + (third + 10) + third / 2;
    const btn = makeClickable(this, {
      x: cx, y: y + 40, width: third, height: 88,
      radius: 10,
      fillColor: 0x000000, fillAlpha: 0.55,
      strokeColor: 0xff66cc, strokeWidth: 3,
      hoverFill: 0x2a0a2a, hoverStroke: 0xffd23f,
      label: "🎡 CARNAVAL",
      labelStyle: { fontFamily: "Fredoka, system-ui", fontSize: "20px", fontStyle: "bold", color: "#ffd23f", stroke: "#000", strokeThickness: 4 },
      sub: "Conveyor (" + completed + "/5)",
      subStyle: { fontFamily: "Fredoka, system-ui", fontSize: "12px", color: "#ffeebb" },
      onClick: () => {
        const next = CARNIVAL_LEVELS.find((id) => !isCompleted(id)) || CARNIVAL_LEVELS[0];
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("LevelScene", { levelId: next });
          this.scene.stop();
        });
      },
    });
    this._addScroll(btn);
  }

  drawTrophyButton() {
    const count = unlockedCount();
    const bonus = trophyBonus();
    const total = TROPHIES.length;
    makeClickable(this, {
      x: 110, y: 50, width: 200, height: 50,
      fillColor: 0x000000, fillAlpha: 0.5,
      strokeColor: 0xffaa00,
      hoverFill: 0x331a00,
      label: "🏆 " + count + " / " + total,
      labelStyle: { fontFamily: "Fredoka, system-ui", fontSize: "18px", fontStyle: "bold", color: "#ffd23f" },
      sub: bonus > 0 ? "+" + bonus + "¢ start" : "Galerie",
      subStyle: { fontFamily: "Fredoka, system-ui", fontSize: "11px", color: "#90ff90" },
      onClick: () => {
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("TrophyScene");
          this.scene.stop();
        });
      },
    });
  }

  drawEndlessButton(y) {
    const { width } = this.scale;
    const top = getEndlessTop();
    const best = top[0]?.score ?? 0;
    const bestWave = top[0]?.wave ?? 0;
    const halfW = (width - 80) / 3;
    const subText = best > 0
      ? "Endless  ★ " + best + " • V" + bestWave
      : "Mode Endless";

    const btn = makeClickable(this, {
      x: 30 + halfW / 2, y: y + 40, width: halfW, height: 88,
      radius: 10,
      fillColor: 0x000000, fillAlpha: 0.55,
      strokeColor: 0xff4400, strokeWidth: 3,
      hoverFill: 0x2a0a00, hoverStroke: 0xffd23f,
      label: "🌋 LA COULÉE",
      labelStyle: { fontFamily: "Fredoka, system-ui", fontSize: "20px", fontStyle: "bold", color: "#ffd23f", stroke: "#000", strokeThickness: 4 },
      sub: subText,
      subStyle: { fontFamily: "Fredoka, system-ui", fontSize: "12px", fontStyle: "bold", color: "#ffeebb" },
      onClick: () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("LevelScene", { levelId: "endless" });
          this.scene.stop();
        });
      },
    });
    this._addScroll(btn);
  }

  _showLevelTip(level, x, y) {
    this._hideLevelTip();
    const waveCount = level.waves?.length ?? 0;
    const tileCount = (level.allowedTiles || []).length;
    const visitorTypes = new Set();
    for (const w of level.waves || []) {
      for (const v of w.visitors || []) visitorTypes.add(v.type);
    }
    const lines = [
      "Vagues : " + waveCount + " • Tiles : " + tileCount,
      "Sortie max : " + (level.loseEscaped ?? "?"),
      "Visiteurs : " + Array.from(visitorTypes).join(", "),
    ];
    const text = lines.join("\n");
    const tip = this.add.container(x, y).setDepth(220);
    const txt = this.add.text(0, -8, text, {
      fontFamily: "Fredoka, system-ui",
      fontSize: "11px",
      color: "#ffeebb",
      align: "center",
      stroke: "#000",
      strokeThickness: 3,
    }).setOrigin(0.5, 1);
    const w = txt.width + 16;
    const h = txt.height + 12;
    const bg = this.add.rectangle(0, -h / 2 - 8, w, h, 0x000, 0.85).setStrokeStyle(1, 0xffd23f);
    tip.add([bg, txt]);
    tip.setAlpha(0);
    this.tweens.add({ targets: tip, alpha: 1, duration: 120 });
    this._levelTip = tip;
  }

  _hideLevelTip() {
    if (this._levelTip) {
      this._levelTip.destroy();
      this._levelTip = null;
    }
  }

  drawWorldRow(world, y) {
    const { width } = this.scale;
    const labelX = 100;
    const startX = 340;
    const cellW = 122;
    const cellH = 70;
    const gap = 8;
    const theme = getTheme(world.id);

    const rowBg = this.add.graphics();
    rowBg.fillStyle(0x000000, 0.45);
    rowBg.fillRoundedRect(20, y - 4, width - 40, cellH + 14, 8);
    rowBg.lineStyle(3, theme.accent, 0.9);
    rowBg.strokeRoundedRect(20, y - 4, width - 40, cellH + 14, 8);
    this._addScroll(rowBg);

    const colorIndic = this.add.rectangle(38, y + cellH / 2 + 3, 6, cellH - 4, theme.accent);
    this.tweens.add({ targets: colorIndic, alpha: { from: 0.7, to: 1 }, duration: 1200, yoyo: true, repeat: -1 });
    this._addScroll(colorIndic);

    const monLabel = this.add.text(labelX, y + cellH / 2 - 14, "Monde " + world.id, {
      fontFamily: "Fredoka, system-ui",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#fff",
    });
    const themeLabel = this.add.text(labelX, y + cellH / 2 + 8, theme.name, {
      fontFamily: "Fredoka, system-ui",
      fontSize: "14px",
      color: "#ffeebb",
    });
    this._addScroll(monLabel, themeLabel);

    if (world.comingSoon) {
      const t = this.add.text(width / 2, y + cellH / 2 + 3, "À venir", {
        fontFamily: "Fredoka, system-ui",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#888",
      }).setOrigin(0.5);
      this._addScroll(t);
      return;
    }

    if (!isWorldUnlocked(world)) {
      const t = this.add.text(width / 2, y + cellH / 2 + 3, "🔒 Termine " + world.requires + " pour débloquer", {
        fontFamily: "Fredoka, system-ui",
        fontSize: "16px",
        color: "#aaa",
      }).setOrigin(0.5);
      this._addScroll(t);
      return;
    }

    let x = startX;
    for (const levelId of world.levels) {
      const level = getLevel(levelId);
      if (!level) continue;
      const stars = getStars(levelId);
      const done = isCompleted(levelId);
      const unlocked = isLevelUnlocked(levelId);
      const cellY = y + cellH / 2 + 3;

      const cellBg = this.add.graphics();
      const fill = !unlocked ? 0x1a1a22 : (done ? this.darken(theme.accent, 0.4) : 0x222840);
      const stroke = !unlocked ? 0x333333 : (done ? theme.accent : 0x4a4a6a);
      cellBg.fillStyle(fill, 0.92);
      cellBg.fillRoundedRect(x, cellY - cellH / 2, cellW, cellH, 6);
      cellBg.lineStyle(2, stroke);
      cellBg.strokeRoundedRect(x, cellY - cellH / 2, cellW, cellH, 6);
      this._addScroll(cellBg);

      const hit = this.add.rectangle(x + cellW / 2, cellY, cellW, cellH, 0x000, 0);
      if (unlocked) hit.setInteractive();
      this._addScroll(hit);

      const titleColor = unlocked ? "#fff" : "#666";
      const idText = this.add.text(x + cellW / 2, cellY - 18, unlocked ? levelId : "🔒", {
        fontFamily: "Fredoka, system-ui",
        fontSize: "16px",
        fontStyle: "bold",
        color: titleColor,
        stroke: "#000",
        strokeThickness: 3,
      }).setOrigin(0.5);
      this._addScroll(idText);

      if (unlocked) {
        const nameText = this.add.text(x + cellW / 2, cellY - 2, level.name, {
          fontFamily: "Fredoka, system-ui",
          fontSize: "10px",
          color: "#ddd",
        }).setOrigin(0.5);
        const starText = "★".repeat(stars) + "☆".repeat(3 - stars);
        const starsT = this.add.text(x + cellW / 2, cellY + 18, starText, {
          fontFamily: "Fredoka, system-ui",
          fontSize: "14px",
          color: stars > 0 ? "#ffd23f" : "#666",
          stroke: "#000",
          strokeThickness: 2,
        }).setOrigin(0.5);
        this._addScroll(nameText, starsT);

        const hoverBg = this.add.graphics();
        hoverBg.fillStyle(stroke, 0.2);
        hoverBg.fillRoundedRect(x, cellY - cellH / 2, cellW, cellH, 6).setVisible(false);
        this._addScroll(hoverBg);
        hit.on("pointerover", () => { hoverBg.setVisible(true); Audio.ui(); this._showLevelTip(level, x + cellW / 2, cellY - cellH / 2 - 6); });
        hit.on("pointerout", () => { hoverBg.setVisible(false); this._hideLevelTip(); });
        hit.on("pointerdown", () => {
          Audio.click();
          this.cameras.main.fadeOut(300, 0, 0, 0);
          this.cameras.main.once("camerafadeoutcomplete", () => {
            const isFirstOfWorld = world.levels[0] === levelId;
            if (isFirstOfWorld && shouldShowCutscene(world.id)) {
              this.scene.start("CutsceneScene", { worldId: world.id, nextLevelId: levelId });
            } else {
              this.scene.start("LevelScene", { levelId });
            }
            this.scene.stop();
          });
        });
      }

      x += cellW + gap;
    }
  }

  darken(hex, factor) {
    const r = ((hex >> 16) & 0xff) * factor;
    const g = ((hex >> 8) & 0xff) * factor;
    const b = (hex & 0xff) * factor;
    return (r << 16) | (g << 8) | b;
  }
}

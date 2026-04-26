import * as Phaser from "phaser";
import { WORLDS, getLevel, isWorldUnlocked, isLevelUnlocked, totalLevels, CARNIVAL_LEVELS } from "../data/levels/index.js";
import { loadSave, getStars, isCompleted, totalStars, getEndlessTop } from "../systems/SaveSystem.js";
import { Audio } from "../systems/Audio.js";
import { MusicManager } from "../systems/MusicManager.js";
import { getTheme } from "../systems/Theme.js";
import { unlockedCount, TROPHIES, trophyBonus } from "../systems/Trophies.js";
import { hasPlayedToday, getDailyResult, getDailyStreak } from "../systems/Daily.js";
import { shouldShowCutscene } from "./CutsceneScene.js";

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

    for (let i = 0; i < 40; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height * 0.4;
      const star = this.add.circle(sx, sy, Math.random() * 1.4 + 0.4, 0xffffff, Math.random() * 0.6 + 0.2);
      this.tweens.add({ targets: star, alpha: { from: 0.2, to: 0.9 }, duration: 800 + Math.random() * 1500, yoyo: true, repeat: -1 });
    }

    const titleShadow = this.add.text(width / 2 + 3, 50 + 3, "MILAN PARK DEFENSE", {
      fontFamily: "system-ui",
      fontSize: "56px",
      fontStyle: "bold",
      color: "#000",
    }).setOrigin(0.5).setAlpha(0.5);

    this.add.text(width / 2, 50, "MILAN PARK DEFENSE", {
      fontFamily: "system-ui",
      fontSize: "56px",
      fontStyle: "bold",
      color: "#ffd23f",
      stroke: "#000",
      strokeThickness: 6,
    }).setOrigin(0.5);


    const total = totalStars();
    const starsBox = this.add.container(width - 110, 50);
    const starsBg = this.add.rectangle(0, 0, 200, 50, 0x000, 0.5).setStrokeStyle(2, 0xffd23f);
    const starsLabel = this.add.text(0, 0, "★ " + total + " / " + (totalLevels() * 3), {
      fontFamily: "system-ui",
      fontSize: "24px",
      fontStyle: "bold",
      color: "#ffd23f",
    }).setOrigin(0.5);
    starsBox.add([starsBg, starsLabel]);

    this.drawTrophyButton();
    this.drawStatsButton();

    let y = 142;
    for (const world of WORLDS) {
      this.drawWorldRow(world, y);
      y += 80;
    }
    this.drawEndlessButton(y + 8);
    this.drawCarnivalButton(y + 8);
    this.drawBossArenaButton(y + 8);
    this.drawDailyButton();
  }

  drawBossArenaButton(y) {
    const { width } = this.scale;
    const third = (width - 80) / 3;
    const x = 30 + 2 * (third + 10);
    const w = third;
    const unlocked = isLevelUnlocked("boss-arena");
    const result = isCompleted("boss-arena");

    const card = this.add.graphics();
    card.fillStyle(0x000000, 0.55);
    card.fillRoundedRect(x, y - 4, w, 88, 10);
    card.lineStyle(3, unlocked ? 0xff2222 : 0x4a4a4a, 1);
    card.strokeRoundedRect(x, y - 4, w, 88, 10);

    this.add.text(x + 14, y + 18, unlocked ? "⚔️ ARÈNE BOSS" : "🔒 ARÈNE BOSS", {
      fontFamily: "system-ui",
      fontSize: "20px",
      fontStyle: "bold",
      color: unlocked ? "#ff8888" : "#666",
      stroke: "#000",
      strokeThickness: 4,
    });
    this.add.text(x + 14, y + 48, unlocked ? "3 boss en série — 0 erreur" : "Termine 5.6", {
      fontFamily: "system-ui",
      fontSize: "12px",
      color: unlocked ? "#ffeebb" : "#777",
    });
    if (result) {
      this.add.text(x + 14, y + 66, "✅ Vaincue", { fontFamily: "system-ui", fontSize: "11px", fontStyle: "bold", color: "#90ff90" });
    }

    if (!unlocked) return;

    const btnX = x + w - 100;
    const btn = this.add.graphics();
    btn.fillStyle(0xc63a3a, 1);
    btn.fillRoundedRect(btnX, y + 18, 86, 50, 8);
    btn.lineStyle(2, 0xff2222, 1);
    btn.strokeRoundedRect(btnX, y + 18, 86, 50, 8);
    this.add.text(btnX + 43, y + 43, "▶", {
      fontFamily: "system-ui",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#fff",
      stroke: "#000",
      strokeThickness: 3,
    }).setOrigin(0.5);
    const hit = this.add.rectangle(x + w / 2, y + 40, w, 88, 0x000, 0).setInteractive();
    hit.on("pointerover", () => { btn.clear(); btn.fillStyle(0xff5544, 1); btn.fillRoundedRect(btnX, y + 18, 86, 50, 8); btn.lineStyle(2, 0xffd23f, 1); btn.strokeRoundedRect(btnX, y + 18, 86, 50, 8); Audio.ui(); });
    hit.on("pointerout", () => { btn.clear(); btn.fillStyle(0xc63a3a, 1); btn.fillRoundedRect(btnX, y + 18, 86, 50, 8); btn.lineStyle(2, 0xff2222, 1); btn.strokeRoundedRect(btnX, y + 18, 86, 50, 8); });
    hit.on("pointerdown", () => {
      Audio.click();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("LevelScene", { levelId: "boss-arena" });
        this.scene.stop();
      });
    });
  }

  drawStatsButton() {
    const bx = 110;
    const by = 110;
    const box = this.add.container(bx, by);
    const bg = this.add.rectangle(0, 0, 200, 38, 0x000, 0.5).setStrokeStyle(2, 0x88aaff);
    const lbl = this.add.text(0, 0, "📊 Stats", { fontFamily: "system-ui", fontSize: "16px", fontStyle: "bold", color: "#88ccff" }).setOrigin(0.5);
    box.add([bg, lbl]);
    box.setSize(200, 38);
    box.setInteractive(new Phaser.Geom.Rectangle(-100, -19, 200, 38), Phaser.Geom.Rectangle.Contains);
    box.on("pointerover", () => { bg.setFillStyle(0x1a3a6a, 0.7); Audio.ui(); });
    box.on("pointerout", () => { bg.setFillStyle(0x000, 0.5); });
    box.on("pointerdown", () => {
      Audio.click();
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("StatsScene");
        this.scene.stop();
      });
    });
  }

  drawDailyButton() {
    const { width } = this.scale;
    const played = hasPlayedToday();
    const result = getDailyResult();
    const streak = getDailyStreak();

    const x = width / 2;
    const y = 100;
    const w = 320;
    const h = 56;

    const box = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, played ? 0x1a3a1a : 0x3a1a3a, 0.9).setStrokeStyle(2, played ? 0x66ff88 : 0xff66cc);
    const lblText = played
      ? "🌟 Défi du Jour " + "★".repeat(result?.stars || 0) + (streak > 1 ? "  •  " + streak + "🔥" : "")
      : "🎯 Défi du Jour" + (streak > 0 ? "  •  " + streak + "🔥" : "");
    const lbl = this.add.text(0, -8, lblText, {
      fontFamily: "system-ui",
      fontSize: "16px",
      fontStyle: "bold",
      color: played ? "#aaffaa" : "#ffd23f",
    }).setOrigin(0.5);
    const sub = this.add.text(0, 12, played ? "Terminé — reviens demain" : "1 essai par jour — niveau aléatoire", {
      fontFamily: "system-ui",
      fontSize: "11px",
      color: played ? "#88dd88" : "#ffaaee",
    }).setOrigin(0.5);
    box.add([bg, lbl, sub]);
    box.setSize(w, h);
    box.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    box.on("pointerover", () => { bg.setFillStyle(played ? 0x2a5a2a : 0x5a2a5a, 0.95); Audio.ui(); });
    box.on("pointerout", () => { bg.setFillStyle(played ? 0x1a3a1a : 0x3a1a3a, 0.9); });
    box.on("pointerdown", () => {
      if (played) {
        this.tweens.add({ targets: box, x: { from: x - 6, to: x + 6 }, duration: 60, yoyo: true, repeat: 2, onComplete: () => { box.x = x; } });
        return;
      }
      Audio.click();
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("LevelScene", { levelId: "daily" });
        this.scene.stop();
      });
    });
  }

  drawCarnivalButton(y) {
    const { width } = this.scale;
    const completed = CARNIVAL_LEVELS.filter((id) => isCompleted(id)).length;

    const third = (width - 80) / 3;
    const x = 30 + (third + 10);
    const w = third;
    const card = this.add.graphics();
    card.fillStyle(0x000000, 0.55);
    card.fillRoundedRect(x, y - 4, w, 88, 10);
    card.lineStyle(3, 0xff66cc, 1);
    card.strokeRoundedRect(x, y - 4, w, 88, 10);

    this.add.text(x + 14, y + 18, "🎡 CARNAVAL", {
      fontFamily: "system-ui",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#ffd23f",
      stroke: "#000",
      strokeThickness: 4,
    });
    this.add.text(x + 14, y + 48, "Conveyor (" + completed + "/5)", {
      fontFamily: "system-ui",
      fontSize: "12px",
      color: "#ffeebb",
    });

    const btn = this.add.graphics();
    const btnX = x + w - 100;
    btn.fillStyle(0xb83a8a, 1);
    btn.fillRoundedRect(btnX, y + 18, 86, 50, 8);
    btn.lineStyle(2, 0xff66cc, 1);
    btn.strokeRoundedRect(btnX, y + 18, 86, 50, 8);

    const lbl = this.add.text(btnX + 43, y + 43, "▶", {
      fontFamily: "system-ui",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#fff",
      stroke: "#000",
      strokeThickness: 3,
    }).setOrigin(0.5);

    const hit = this.add.rectangle(x + w / 2, y + 40, w, 88, 0x000, 0).setInteractive();
    hit.on("pointerover", () => { btn.clear(); btn.fillStyle(0xff66cc, 1); btn.fillRoundedRect(btnX, y + 18, 86, 50, 8); btn.lineStyle(2, 0xffd23f, 1); btn.strokeRoundedRect(btnX, y + 18, 86, 50, 8); Audio.ui(); });
    hit.on("pointerout", () => { btn.clear(); btn.fillStyle(0xb83a8a, 1); btn.fillRoundedRect(btnX, y + 18, 86, 50, 8); btn.lineStyle(2, 0xff66cc, 1); btn.strokeRoundedRect(btnX, y + 18, 86, 50, 8); });
    hit.on("pointerdown", () => {
      Audio.click();
      const next = CARNIVAL_LEVELS.find((id) => !isCompleted(id)) || CARNIVAL_LEVELS[0];
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("LevelScene", { levelId: next });
        this.scene.stop();
      });
    });
  }

  drawTrophyButton() {
    const count = unlockedCount();
    const bonus = trophyBonus();
    const total = TROPHIES.length;
    const x = 110;
    const y = 50;

    const box = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 200, 50, 0x000, 0.5).setStrokeStyle(2, 0xffaa00);
    const lbl = this.add.text(0, -8, "🏆 " + count + " / " + total, {
      fontFamily: "system-ui",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#ffd23f",
    }).setOrigin(0.5);
    const sub = this.add.text(0, 12, bonus > 0 ? "+" + bonus + "¢ start" : "Galerie", {
      fontFamily: "system-ui",
      fontSize: "11px",
      color: "#90ff90",
    }).setOrigin(0.5);
    box.add([bg, lbl, sub]);
    box.setSize(200, 50);
    box.setInteractive(new Phaser.Geom.Rectangle(-100, -25, 200, 50), Phaser.Geom.Rectangle.Contains);
    box.on("pointerover", () => { bg.setFillStyle(0x331a00, 0.7); Audio.ui(); });
    box.on("pointerout", () => { bg.setFillStyle(0x000, 0.5); });
    box.on("pointerdown", () => {
      Audio.click();
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("TrophyScene");
        this.scene.stop();
      });
    });
  }

  drawEndlessButton(y) {
    const { width } = this.scale;
    const top = getEndlessTop();
    const best = top[0]?.score ?? 0;
    const bestWave = top[0]?.wave ?? 0;

    const card = this.add.graphics();
    card.fillStyle(0x000000, 0.55);
    const halfW = (width - 80) / 3;
    card.fillRoundedRect(30, y - 4, halfW, 88, 10);
    card.lineStyle(3, 0xff4400, 1);
    card.strokeRoundedRect(30, y - 4, halfW, 88, 10);

    const indic = this.add.rectangle(38, y + 42, 6, 78, 0xff2200);
    this.tweens.add({ targets: indic, alpha: { from: 0.6, to: 1 }, duration: 1000, yoyo: true, repeat: -1 });

    this.add.text(50, y + 18, "🌋 LA COULÉE", {
      fontFamily: "system-ui",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#ffd23f",
      stroke: "#000",
      strokeThickness: 4,
    });
    this.add.text(50, y + 48, "Mode Endless", {
      fontFamily: "system-ui",
      fontSize: "12px",
      color: "#ffeebb",
    });

    if (best > 0) {
      this.add.text(50, y + 66, "★ " + best + " • V" + bestWave, {
        fontFamily: "system-ui",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#ffd23f",
      });
    }

    const btnX = 30 + halfW - 100;
    const btn = this.add.graphics();
    btn.fillStyle(0xc63a3a, 1);
    btn.fillRoundedRect(btnX, y + 18, 86, 50, 8);
    btn.lineStyle(2, 0xff8800, 1);
    btn.strokeRoundedRect(btnX, y + 18, 86, 50, 8);

    const lbl = this.add.text(btnX + 43, y + 43, "▶", {
      fontFamily: "system-ui",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#fff",
      stroke: "#000",
      strokeThickness: 3,
    }).setOrigin(0.5);

    const hit = this.add.rectangle(30 + halfW / 2, y + 40, halfW, 88, 0x000, 0).setInteractive();
    hit.on("pointerover", () => { btn.clear(); btn.fillStyle(0xff5544, 1); btn.fillRoundedRect(btnX, y + 18, 86, 50, 8); btn.lineStyle(2, 0xffd23f, 1); btn.strokeRoundedRect(btnX, y + 18, 86, 50, 8); Audio.ui(); });
    hit.on("pointerout", () => { btn.clear(); btn.fillStyle(0xc63a3a, 1); btn.fillRoundedRect(btnX, y + 18, 86, 50, 8); btn.lineStyle(2, 0xff8800, 1); btn.strokeRoundedRect(btnX, y + 18, 86, 50, 8); });
    hit.on("pointerdown", () => {
      Audio.click();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("LevelScene", { levelId: "endless" });
        this.scene.stop();
      });
    });
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
      fontFamily: "system-ui",
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

    const colorIndic = this.add.rectangle(38, y + cellH / 2 + 3, 6, cellH - 4, theme.accent);
    this.tweens.add({ targets: colorIndic, alpha: { from: 0.7, to: 1 }, duration: 1200, yoyo: true, repeat: -1 });

    this.add.text(labelX, y + cellH / 2 - 14, "Monde " + world.id, {
      fontFamily: "system-ui",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#fff",
    });
    this.add.text(labelX, y + cellH / 2 + 8, theme.name, {
      fontFamily: "system-ui",
      fontSize: "14px",
      color: "#ffeebb",
    });

    if (world.comingSoon) {
      this.add.text(width / 2, y + cellH / 2 + 3, "À venir", {
        fontFamily: "system-ui",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#888",
      }).setOrigin(0.5);
      return;
    }

    if (!isWorldUnlocked(world)) {
      this.add.text(width / 2, y + cellH / 2 + 3, "🔒 Termine " + world.requires + " pour débloquer", {
        fontFamily: "system-ui",
        fontSize: "16px",
        color: "#aaa",
      }).setOrigin(0.5);
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

      const hit = this.add.rectangle(x + cellW / 2, cellY, cellW, cellH, 0x000, 0);
      if (unlocked) hit.setInteractive();

      const titleColor = unlocked ? "#fff" : "#666";
      this.add.text(x + cellW / 2, cellY - 18, unlocked ? levelId : "🔒", {
        fontFamily: "system-ui",
        fontSize: "16px",
        fontStyle: "bold",
        color: titleColor,
        stroke: "#000",
        strokeThickness: 3,
      }).setOrigin(0.5);

      if (unlocked) {
        this.add.text(x + cellW / 2, cellY - 2, level.name, {
          fontFamily: "system-ui",
          fontSize: "10px",
          color: "#ddd",
        }).setOrigin(0.5);
        const starText = "★".repeat(stars) + "☆".repeat(3 - stars);
        this.add.text(x + cellW / 2, cellY + 18, starText, {
          fontFamily: "system-ui",
          fontSize: "14px",
          color: stars > 0 ? "#ffd23f" : "#666",
          stroke: "#000",
          strokeThickness: 2,
        }).setOrigin(0.5);

        const hoverBg = this.add.graphics();
        hoverBg.fillStyle(stroke, 0.2);
        hoverBg.fillRoundedRect(x, cellY - cellH / 2, cellW, cellH, 6).setVisible(false);
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

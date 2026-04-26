import * as Phaser from "phaser";
import { WORLDS, getLevel, isWorldUnlocked, isLevelUnlocked, totalLevels } from "../data/levels/index.js";
import { loadSave, getStars, isCompleted, totalStars } from "../systems/SaveSystem.js";
import { Audio } from "../systems/Audio.js";
import { MusicManager } from "../systems/MusicManager.js";
import { getTheme } from "../systems/Theme.js";

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

    this.add.text(width / 2, 100, "Choisis un niveau", {
      fontFamily: "system-ui",
      fontSize: "20px",
      color: "#ffeebb",
      stroke: "#000",
      strokeThickness: 4,
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

    let y = 150;
    for (const world of WORLDS) {
      this.drawWorldRow(world, y);
      y += 105;
    }
  }

  drawWorldRow(world, y) {
    const { width } = this.scale;
    const labelX = 100;
    const startX = 340;
    const cellW = 130;
    const cellH = 84;
    const gap = 10;
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
      this.add.text(x + cellW / 2, cellY - 22, unlocked ? levelId : "🔒", {
        fontFamily: "system-ui",
        fontSize: "18px",
        fontStyle: "bold",
        color: titleColor,
        stroke: "#000",
        strokeThickness: 3,
      }).setOrigin(0.5);

      if (unlocked) {
        this.add.text(x + cellW / 2, cellY - 2, level.name, {
          fontFamily: "system-ui",
          fontSize: "11px",
          color: "#ddd",
        }).setOrigin(0.5);
        const starText = "★".repeat(stars) + "☆".repeat(3 - stars);
        this.add.text(x + cellW / 2, cellY + 22, starText, {
          fontFamily: "system-ui",
          fontSize: "16px",
          color: stars > 0 ? "#ffd23f" : "#666",
          stroke: "#000",
          strokeThickness: 2,
        }).setOrigin(0.5);

        const hoverBg = this.add.graphics();
        hoverBg.fillStyle(stroke, 0.2);
        hoverBg.fillRoundedRect(x, cellY - cellH / 2, cellW, cellH, 6).setVisible(false);
        hit.on("pointerover", () => { hoverBg.setVisible(true); Audio.ui(); });
        hit.on("pointerout", () => hoverBg.setVisible(false));
        hit.on("pointerdown", () => {
          Audio.click();
          this.cameras.main.fadeOut(300, 0, 0, 0);
          this.cameras.main.once("camerafadeoutcomplete", () => {
            this.scene.start("LevelScene", { levelId });
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

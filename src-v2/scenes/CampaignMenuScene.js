import * as Phaser from "phaser";
import { WORLDS, getLevel, isWorldUnlocked, isLevelUnlocked, totalLevels } from "../data/levels/index.js";
import { loadSave, getStars, isCompleted, totalStars } from "../systems/SaveSystem.js";
import { Audio } from "../systems/Audio.js";

export class CampaignMenuScene extends Phaser.Scene {
  constructor() {
    super("CampaignMenuScene");
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#1a1f30");

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1f30, 0x1a1f30, 0xff6b1c, 0xff6b1c, 1);
    bg.fillRect(0, 0, width, height);

    this.add.text(width / 2, 50, "PARK DEFENSE", {
      fontFamily: "system-ui",
      fontSize: "56px",
      fontStyle: "bold",
      color: "#ffd23f",
      stroke: "#000",
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(width / 2, 105, "Choisis un niveau", {
      fontFamily: "system-ui",
      fontSize: "22px",
      color: "#ffffff",
      stroke: "#000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    const total = totalStars();
    this.add.text(width - 30, 30, "★ " + total + " / " + (totalLevels() * 3), {
      fontFamily: "system-ui",
      fontSize: "26px",
      fontStyle: "bold",
      color: "#ffd23f",
      stroke: "#000",
      strokeThickness: 4,
    }).setOrigin(1, 0);

    let y = 170;
    for (const world of WORLDS) {
      this.drawWorldRow(world, y);
      y += 100;
    }
  }

  drawWorldRow(world, y) {
    const { width } = this.scale;
    const labelX = 90;
    const startX = 320;
    const cellW = 130;
    const cellH = 80;
    const gap = 10;

    this.add.rectangle(width / 2, y + cellH / 2, width - 40, cellH + 14, 0x222840, 0.65)
      .setStrokeStyle(2, world.color);

    this.add.text(labelX, y + cellH / 2 - 14, "Monde " + world.id, {
      fontFamily: "system-ui",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#fff",
    });
    this.add.text(labelX, y + cellH / 2 + 8, world.name, {
      fontFamily: "system-ui",
      fontSize: "14px",
      color: "#bbb",
    });

    if (world.comingSoon) {
      this.add.text(width / 2, y + cellH / 2, "À venir", {
        fontFamily: "system-ui",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#888",
      }).setOrigin(0.5);
      return;
    }

    if (!isWorldUnlocked(world)) {
      this.add.text(width / 2, y + cellH / 2, "🔒 Termine " + world.requires + " pour débloquer", {
        fontFamily: "system-ui",
        fontSize: "18px",
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
      const cellY = y + cellH / 2;
      const fill = !unlocked ? 0x1a1a22 : (done ? 0x2a4a2a : 0x222840);
      const stroke = !unlocked ? 0x333 : (done ? 0x90ff90 : 0x4a4a6a);
      const cell = this.add.rectangle(x + cellW / 2, cellY, cellW, cellH, fill).setStrokeStyle(2, stroke);
      if (unlocked) cell.setInteractive();
      const titleColor = unlocked ? "#fff" : "#666";
      this.add.text(x + cellW / 2, cellY - 18, unlocked ? levelId : "🔒", {
        fontFamily: "system-ui",
        fontSize: "16px",
        fontStyle: "bold",
        color: titleColor,
      }).setOrigin(0.5);
      if (unlocked) {
        this.add.text(x + cellW / 2, cellY + 2, level.name, {
          fontFamily: "system-ui",
          fontSize: "11px",
          color: "#bbb",
        }).setOrigin(0.5);
        const starText = "★".repeat(stars) + "☆".repeat(3 - stars);
        this.add.text(x + cellW / 2, cellY + 22, starText, {
          fontFamily: "system-ui",
          fontSize: "14px",
          color: stars > 0 ? "#ffd23f" : "#666",
        }).setOrigin(0.5);

        cell.on("pointerover", () => { cell.setFillStyle(done ? 0x3a6a3a : 0x33405a); Audio.ui(); });
        cell.on("pointerout", () => cell.setFillStyle(done ? 0x2a4a2a : 0x222840));
        cell.on("pointerdown", () => {
          Audio.click();
          this.scene.start("LevelScene", { levelId });
          this.scene.stop();
        });
      }

      x += cellW + gap;
    }
  }
}

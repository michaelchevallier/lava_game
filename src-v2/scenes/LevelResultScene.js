import * as Phaser from "phaser";
import { saveProgress } from "../systems/SaveSystem.js";
import { getNextLevelId } from "../data/levels/index.js";
import { Audio } from "../systems/Audio.js";

export class LevelResultScene extends Phaser.Scene {
  constructor() {
    super("LevelResultScene");
  }

  init(data) {
    this.payload = data || {};
  }

  create() {
    const { width, height } = this.scale;
    const { win, stars, killed, escaped, coins, levelId, levelName } = this.payload;

    if (win) saveProgress(levelId, stars);

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1f30, 0.85);

    const titleText = win ? "VICTOIRE !" : "DÉFAITE";
    const title = this.add.text(width / 2, 120, titleText, {
      fontFamily: "system-ui",
      fontSize: "84px",
      fontStyle: "bold",
      color: win ? "#90ff90" : "#ff8080",
      stroke: "#000",
      strokeThickness: 10,
    }).setOrigin(0.5).setScale(0.4);

    this.tweens.add({
      targets: title,
      scale: 1,
      duration: 350,
      ease: "Back.out",
    });

    this.add.text(width / 2, 200, "Niveau " + levelId + " — " + (levelName || ""), {
      fontFamily: "system-ui",
      fontSize: "22px",
      color: "#ddd",
    }).setOrigin(0.5);

    if (win) {
      const starsX = width / 2;
      const starsY = 320;
      const gap = 110;
      for (let i = 0; i < 3; i++) {
        const filled = i < stars;
        const star = this.add.text(starsX + (i - 1) * gap, starsY, filled ? "★" : "☆", {
          fontFamily: "system-ui",
          fontSize: "100px",
          color: filled ? "#ffd23f" : "#666",
          stroke: "#000",
          strokeThickness: 8,
        }).setOrigin(0.5).setScale(0);
        this.tweens.add({
          targets: star,
          scale: 1,
          duration: 350,
          delay: 600 + i * 220,
          ease: "Back.out",
        });
      }
    } else {
      this.add.text(width / 2, 320, "Trop de visiteurs ont atteint la sortie…", {
        fontFamily: "system-ui",
        fontSize: "22px",
        color: "#ffa0a0",
      }).setOrigin(0.5);
    }

    const stats = [
      "Tués : " + (killed || 0),
      "Échappés : " + (escaped || 0),
      "Pièces restantes : " + (coins || 0),
    ];
    this.add.text(width / 2, 470, stats.join("   •   "), {
      fontFamily: "system-ui",
      fontSize: "20px",
      color: "#fff",
    }).setOrigin(0.5);

    const buttons = [];
    const btnY = 600;
    const btnGap = 220;

    if (win) {
      const next = getNextLevelId(levelId);
      if (next) {
        buttons.push({ label: "[ N ] Niveau suivant", color: 0x4ed8a3, key: "N", action: () => { this.scene.start("LevelScene", { levelId: next }); this.scene.stop(); } });
      }
    }
    buttons.push({ label: "[ R ] Rejouer", color: 0xffd23f, key: "R", action: () => { this.scene.start("LevelScene", { levelId }); this.scene.stop(); } });
    buttons.push({ label: "[ M ] Menu", color: 0xddeeff, key: "M", action: () => { this.scene.start("CampaignMenuScene"); this.scene.stop(); } });

    const totalW = buttons.length * (200 + 20) - 20;
    let x = width / 2 - totalW / 2 + 100;
    buttons.forEach((b) => {
      const bg = this.add.rectangle(x, btnY, 200, 60, 0x222840).setStrokeStyle(3, b.color);
      const label = this.add.text(x, btnY, b.label, {
        fontFamily: "system-ui",
        fontSize: "18px",
        fontStyle: "bold",
        color: "#fff",
        stroke: "#000",
        strokeThickness: 3,
      }).setOrigin(0.5);
      bg.setInteractive();
      bg.on("pointerover", () => { bg.setFillStyle(0x33405a); Audio.ui(); });
      bg.on("pointerout", () => bg.setFillStyle(0x222840));
      bg.on("pointerdown", () => { Audio.click(); b.action(); });
      this.input.keyboard.once("keydown-" + b.key, () => { Audio.click(); b.action(); });
      x += 220;
    });
  }
}

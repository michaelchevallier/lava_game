import * as Phaser from "phaser";
import { TROPHIES, isUnlocked, unlockedCount, trophyBonus } from "../systems/Trophies.js";
import { Audio } from "../systems/Audio.js";

export class TrophyScene extends Phaser.Scene {
  constructor() {
    super("TrophyScene");
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(300, 0, 0, 0);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a2a, 0x1a0a2a, 0x4a2a4a, 0x4a2a4a, 1);
    bg.fillRect(0, 0, width, height);

    for (let i = 0; i < 30; i++) {
      const star = this.add.circle(Math.random() * width, Math.random() * height * 0.5, Math.random() * 1.4 + 0.4, 0xffffff, Math.random() * 0.6 + 0.2);
      this.tweens.add({ targets: star, alpha: { from: 0.3, to: 1 }, duration: 1000 + Math.random() * 1500, yoyo: true, repeat: -1 });
    }

    this.add.text(width / 2, 50, "🏆 GALERIE DES TROPHÉES", {
      fontFamily: "system-ui",
      fontSize: "44px",
      fontStyle: "bold",
      color: "#ffd23f",
      stroke: "#000",
      strokeThickness: 6,
    }).setOrigin(0.5);

    const total = unlockedCount();
    const bonus = trophyBonus();
    this.add.text(width / 2, 100, total + " / " + TROPHIES.length + " débloqués • bonus permanent +" + bonus + "¢ start", {
      fontFamily: "system-ui",
      fontSize: "18px",
      color: "#ffeebb",
    }).setOrigin(0.5);

    const cols = 5;
    const cellW = 220;
    const cellH = 110;
    const gap = 12;
    const startX = (width - (cols * cellW + (cols - 1) * gap)) / 2;
    const startY = 150;

    TROPHIES.forEach((t, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cellW + gap);
      const y = startY + row * (cellH + gap);
      this.drawTrophyCard(t, x, y, cellW, cellH);
    });

    const backBtn = this.add.container(80, height - 50);
    const back = this.add.rectangle(0, 0, 130, 50, 0x222840).setStrokeStyle(2, 0xffd23f);
    const backLbl = this.add.text(0, 0, "← Retour", { fontFamily: "system-ui", fontSize: "16px", fontStyle: "bold", color: "#ffd23f" }).setOrigin(0.5);
    backBtn.add([back, backLbl]);
    backBtn.setSize(130, 50);
    backBtn.setInteractive(new Phaser.Geom.Rectangle(-65, -25, 130, 50), Phaser.Geom.Rectangle.Contains);
    backBtn.on("pointerover", () => back.setFillStyle(0x33405a));
    backBtn.on("pointerout", () => back.setFillStyle(0x222840));
    backBtn.on("pointerdown", () => {
      Audio.click();
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("CampaignMenuScene");
        this.scene.stop();
      });
    });
    this.input.keyboard.once("keydown-ESC", () => {
      this.scene.start("CampaignMenuScene");
      this.scene.stop();
    });
  }

  drawTrophyCard(t, x, y, w, h) {
    const unlocked = isUnlocked(t.id);
    const card = this.add.graphics();
    card.fillStyle(unlocked ? 0x3a2a4a : 0x1a1a22, 0.92);
    card.fillRoundedRect(x, y, w, h, 8);
    card.lineStyle(2, unlocked ? 0xffd23f : 0x4a4a6a);
    card.strokeRoundedRect(x, y, w, h, 8);

    this.add.text(x + 20, y + 18, unlocked ? t.emoji : "🔒", {
      fontFamily: "system-ui",
      fontSize: "44px",
      color: "#fff",
    });

    this.add.text(x + 80, y + 14, t.name, {
      fontFamily: "system-ui",
      fontSize: "16px",
      fontStyle: "bold",
      color: unlocked ? "#ffd23f" : "#888",
      wordWrap: { width: w - 90 },
    });

    this.add.text(x + 80, y + 42, t.desc, {
      fontFamily: "system-ui",
      fontSize: "12px",
      color: unlocked ? "#ddd" : "#666",
      wordWrap: { width: w - 90 },
    });

    if (unlocked) {
      this.add.text(x + 80, y + 80, "+5¢ start permanent", {
        fontFamily: "system-ui",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#90ff90",
      });
    }
  }
}

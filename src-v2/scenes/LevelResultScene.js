import * as Phaser from "phaser";
import { saveProgress, saveEndlessRun, getEndlessTop } from "../systems/SaveSystem.js";
import { getNextLevelId } from "../data/levels/index.js";
import { Audio } from "../systems/Audio.js";
import { MusicManager } from "../systems/MusicManager.js";

export class LevelResultScene extends Phaser.Scene {
  constructor() {
    super("LevelResultScene");
  }

  init(data) {
    this.payload = data || {};
  }

  create() {
    const { width, height } = this.scale;
    const { win, stars, killed, escaped, coins, levelId, levelName, endless, endlessWave } = this.payload;

    this.cameras.main.fadeIn(400, 0, 0, 0);

    MusicManager.play("menu");

    if (endless) {
      saveEndlessRun(killed || 0, endlessWave || 0);
    } else if (win) saveProgress(levelId, stars);

    const bg = this.add.graphics();
    if (win) {
      bg.fillGradientStyle(0x0a3a4a, 0x0a3a4a, 0x4ed8a3, 0x4ed8a3, 1);
    } else {
      bg.fillGradientStyle(0x3a0a0a, 0x3a0a0a, 0x6a1a1a, 0x6a1a1a, 1);
    }
    bg.fillRect(0, 0, width, height);

    if (win) {
      for (let i = 0; i < 50; i++) {
        const cx = Math.random() * width;
        const cy = -20 - Math.random() * 80;
        const c = this.add.rectangle(cx, cy, 6, 12, [0xffd23f, 0xff66ff, 0x66ff88, 0x66aaff, 0xff8844][i % 5]).setDepth(50);
        this.tweens.add({
          targets: c,
          y: height + 40,
          x: cx + (Math.random() - 0.5) * 200,
          angle: 360 * (Math.random() > 0.5 ? 1 : -1),
          duration: 2500 + Math.random() * 2000,
          delay: Math.random() * 800,
          ease: "Cubic.in",
        });
      }
    }

    const titleText = endless ? "FIN DU RUN" : (win ? "VICTOIRE !" : "DÉFAITE");
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

    if (endless) {
      this.add.text(width / 2, 280, "Vague atteinte : " + (endlessWave || 0), {
        fontFamily: "system-ui",
        fontSize: "30px",
        fontStyle: "bold",
        color: "#ffd23f",
        stroke: "#000",
        strokeThickness: 5,
      }).setOrigin(0.5);
      this.add.text(width / 2, 320, "Score (kills) : " + (killed || 0), {
        fontFamily: "system-ui",
        fontSize: "26px",
        color: "#ffeebb",
      }).setOrigin(0.5);

      const top = getEndlessTop();
      this.add.text(width / 2, 370, "🏆 Top 5 local", {
        fontFamily: "system-ui",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#fff",
      }).setOrigin(0.5);
      top.slice(0, 5).forEach((r, i) => {
        const isCurrent = r.score === (killed || 0) && r.wave === (endlessWave || 0);
        const medals = ["🥇", "🥈", "🥉", "4.", "5."];
        this.add.text(width / 2, 400 + i * 24,
          (medals[i] || (i + 1) + ".") + " " + r.score + " kills • Vague " + r.wave,
          {
            fontFamily: "system-ui",
            fontSize: "16px",
            color: isCurrent ? "#ffd23f" : "#ddd",
            fontStyle: isCurrent ? "bold" : "normal",
          }).setOrigin(0.5);
      });
    } else if (win) {
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

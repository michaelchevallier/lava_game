import * as Phaser from "phaser";
import { loadSave, totalStars, getEndlessTop } from "../systems/SaveSystem.js";
import { TROPHIES, unlockedCount } from "../systems/Trophies.js";
import { totalLevels } from "../data/levels/index.js";
import { getDailyStreak } from "../systems/Daily.js";
import { Audio } from "../systems/Audio.js";
import { makeClickable } from "../ui/Clickable.js";

export class StatsScene extends Phaser.Scene {
  constructor() {
    super("StatsScene");
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(300, 0, 0, 0);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a1a3a, 0x0a1a3a, 0x2a4a6a, 0x2a4a6a, 1);
    bg.fillRect(0, 0, width, height);

    this.add.text(width / 2, 50, "📊 STATISTIQUES", {
      fontFamily: "system-ui",
      fontSize: "44px",
      fontStyle: "bold",
      color: "#ffd23f",
      stroke: "#000",
      strokeThickness: 6,
    }).setOrigin(0.5);

    const save = loadSave();
    const top = getEndlessTop();
    const bestEndless = top[0] || { wave: 0, score: 0 };
    const completedLevels = Object.values(save.levels || {}).filter((l) => l.completed).length;

    const stats = [
      { icon: "💀", label: "Visiteurs tués", value: save.totalKills || 0, color: "#ff6644" },
      { icon: "🎫", label: "Tickets cumulés", value: save.totalTickets || 0, color: "#ff66cc" },
      { icon: "★", label: "Étoiles", value: totalStars() + " / " + (totalLevels() * 3), color: "#ffd23f" },
      { icon: "🏆", label: "Trophées", value: unlockedCount() + " / " + TROPHIES.length, color: "#ffaa00" },
      { icon: "🎮", label: "Niveaux finis", value: completedLevels + " / " + totalLevels(), color: "#90ff90" },
      { icon: "🔥", label: "Streak Daily", value: getDailyStreak() + (getDailyStreak() > 0 ? " jours" : ""), color: "#ff8844" },
      { icon: "🌋", label: "Endless record", value: "V" + bestEndless.wave + " — " + bestEndless.score + " kills", color: "#ff4400" },
      { icon: "📅", label: "Daily joués", value: Object.keys(save.daily || {}).length, color: "#aaaaff" },
    ];

    const cols = 2;
    const cellW = 480;
    const cellH = 80;
    const gap = 16;
    const startX = (width - (cols * cellW + (cols - 1) * gap)) / 2;
    const startY = 130;

    stats.forEach((s, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cellW + gap);
      const y = startY + row * (cellH + gap);

      const card = this.add.graphics();
      card.fillStyle(0x1a2a4a, 0.85);
      card.fillRoundedRect(x, y, cellW, cellH, 10);
      card.lineStyle(2, 0x4a6a9a);
      card.strokeRoundedRect(x, y, cellW, cellH, 10);

      this.add.text(x + 30, y + cellH / 2, s.icon, {
        fontFamily: "system-ui",
        fontSize: "44px",
      }).setOrigin(0.5);

      this.add.text(x + 80, y + 18, s.label, {
        fontFamily: "system-ui",
        fontSize: "14px",
        color: "#bbcce0",
      });

      this.add.text(x + 80, y + 42, String(s.value), {
        fontFamily: "system-ui",
        fontSize: "26px",
        fontStyle: "bold",
        color: s.color,
        stroke: "#000",
        strokeThickness: 3,
      });
    });

    makeClickable(this, {
      x: 80, y: height - 50, width: 130, height: 50,
      fillColor: 0x222840, strokeColor: 0xffd23f,
      hoverFill: 0x33405a,
      label: "← Retour",
      labelStyle: { fontFamily: "system-ui", fontSize: "16px", fontStyle: "bold", color: "#ffd23f" },
      onClick: () => {
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("CampaignMenuScene");
          this.scene.stop();
        });
      },
    });
    this.input.keyboard.once("keydown-ESC", () => {
      this.scene.start("CampaignMenuScene");
      this.scene.stop();
    });
  }
}

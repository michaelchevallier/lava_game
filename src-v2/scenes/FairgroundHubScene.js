import * as Phaser from "phaser";
import { Audio } from "../systems/Audio.js";
import { MusicManager } from "../systems/MusicManager.js";
import { makeClickable } from "../ui/Clickable.js";

const GAMES = [
  { id: "chamboule", emoji: "🎯", name: "Chamboule-Tout", desc: "Renverse 9 boîtes en 20s", color: 0xffd23f, stroke: 0xffaa00 },
  { id: "pigeon",    emoji: "🕊", name: "Tir au Pigeon",  desc: "Touche les pigeons en 30s", color: 0x88ccff, stroke: 0x4488dd },
  { id: "wheel",     emoji: "🎡", name: "Roue Fortune",    desc: "Spin pour gagner gros",    color: 0xff66cc, stroke: 0xaa3399 },
  { id: "pancake",   emoji: "🥞", name: "Crêpes",          desc: "Flip parfait au bon moment", color: 0xff8844, stroke: 0xc63a3a },
  { id: "bumper",    emoji: "🚗", name: "Bumper Cars",     desc: "Esquive 30s",              color: 0x66ff88, stroke: 0x4ed8a3 },
];

export class FairgroundHubScene extends Phaser.Scene {
  constructor() {
    super("FairgroundHubScene");
  }

  create() {
    const { width, height } = this.scale;
    MusicManager.play("calm");
    this.cameras.main.fadeIn(300, 0, 0, 0);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a4a, 0x1a0a4a, 0xff66cc, 0xff8844, 1);
    bg.fillRect(0, 0, width, height);
    for (let i = 0; i < 80; i++) {
      const star = this.add.circle(Math.random() * width, Math.random() * height, Math.random() * 1.6 + 0.4, [0xffffff, 0xffd23f, 0xff66cc, 0x88ccff][i % 4], Math.random() * 0.6 + 0.3);
      this.tweens.add({ targets: star, alpha: { from: 0.2, to: 1 }, duration: 800 + Math.random() * 1500, yoyo: true, repeat: -1 });
    }

    this.add.text(width / 2, 60, "🎪 FOIRE FORAINE", {
      fontFamily: "Bangers, Fredoka, system-ui",
      fontSize: "64px",
      color: "#ffd23f",
      stroke: "#000",
      strokeThickness: 8,
    }).setOrigin(0.5);
    this.add.text(width / 2, 110, "Mini-jeux bonus — gagne tickets et pièces", {
      fontFamily: "Fredoka, system-ui",
      fontSize: "16px",
      color: "#ffeebb",
    }).setOrigin(0.5);

    const cardW = 220;
    const cardH = 280;
    const gap = 16;
    const totalW = GAMES.length * (cardW + gap) - gap;
    let x = (width - totalW) / 2 + cardW / 2;

    GAMES.forEach((g) => {
      makeClickable(this, {
        x, y: height / 2 + 30, width: cardW, height: cardH,
        radius: 14,
        fillColor: 0x000000, fillAlpha: 0.5,
        strokeColor: g.stroke, strokeWidth: 3,
        hoverFill: 0x2a1a3a, hoverStroke: 0xffd23f,
        onClick: () => {
          this.cameras.main.fadeOut(300, 0, 0, 0);
          this.cameras.main.once("camerafadeoutcomplete", () => {
            this.scene.start("FairgroundScene", { gameType: g.id });
            this.scene.stop();
          });
        },
        decorate: (c, s) => {
          c.add(s.add.text(0, -90, g.emoji, { fontFamily: "system-ui", fontSize: "70px" }).setOrigin(0.5));
          c.add(s.add.text(0, 10, g.name, { fontFamily: "Bangers, Fredoka, system-ui", fontSize: "26px", color: "#ffd23f", stroke: "#000", strokeThickness: 4 }).setOrigin(0.5));
          c.add(s.add.text(0, 50, g.desc, { fontFamily: "Fredoka, system-ui", fontSize: "13px", color: "#ffeebb", align: "center", wordWrap: { width: cardW - 30 } }).setOrigin(0.5));
          c.add(s.add.text(0, 105, "▶ JOUER", { fontFamily: "Bangers, Fredoka, system-ui", fontSize: "22px", color: "#fff", stroke: "#000", strokeThickness: 4 }).setOrigin(0.5));
        },
      });
      x += cardW + gap;
    });

    makeClickable(this, {
      x: 80, y: height - 50, width: 130, height: 50,
      fillColor: 0x222840, strokeColor: 0xffd23f,
      hoverFill: 0x33405a,
      label: "← Retour",
      labelStyle: { fontFamily: "Fredoka, system-ui", fontSize: "16px", fontStyle: "bold", color: "#ffd23f" },
      onClick: () => {
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("CampaignMenuScene");
          this.scene.stop();
        });
      },
    });

    makeClickable(this, {
      x: width - 110, y: height - 50, width: 200, height: 50,
      fillColor: 0x3a1a3a, strokeColor: 0xff66cc, strokeWidth: 3,
      hoverFill: 0x5a2a5a, hoverStroke: 0xffd23f,
      label: "🎨 Boutique Skins",
      labelStyle: { fontFamily: "Fredoka, system-ui", fontSize: "16px", fontStyle: "bold", color: "#ffd23f" },
      onClick: () => {
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("SkinsScene");
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

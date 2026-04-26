import * as Phaser from "phaser";
import { MusicManager } from "../systems/MusicManager.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    const { width, height } = this.scale;

    MusicManager.init();

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a2a, 0x1a0a2a, 0xff6b1c, 0xff4400, 1);
    bg.fillRect(0, 0, width, height);

    for (let i = 0; i < 60; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height * 0.5;
      const star = this.add.circle(sx, sy, Math.random() * 1.6 + 0.4, 0xffffff, Math.random() * 0.7 + 0.3);
      this.tweens.add({ targets: star, alpha: { from: 0.3, to: 1 }, duration: 800 + Math.random() * 1500, yoyo: true, repeat: -1 });
    }

    for (let i = 0; i < 12; i++) {
      const fx = Math.random() * width;
      const fy = height * 0.6 + Math.random() * height * 0.3;
      const flame = this.add.triangle(fx, fy, 0, 12, 6, -10, 12, 12, 0xff8800, 0.5);
      this.tweens.add({ targets: flame, scale: { from: 0.6, to: 1.3 }, duration: 700 + Math.random() * 600, yoyo: true, repeat: -1 });
    }

    const titleShadow = this.add.text(width / 2 + 4, 200 + 4, "MILAN PARK DEFENSE", {
      fontFamily: "system-ui",
      fontSize: "92px",
      fontStyle: "bold",
      color: "#000",
    }).setOrigin(0.5).setAlpha(0.5);

    const title = this.add.text(width / 2, 200, "MILAN PARK DEFENSE", {
      fontFamily: "system-ui",
      fontSize: "92px",
      fontStyle: "bold",
      color: "#ffd23f",
      stroke: "#000",
      strokeThickness: 8,
    }).setOrigin(0.5).setScale(0.3);
    this.tweens.add({ targets: title, scale: 1, duration: 600, ease: "Back.out" });

    this.add.text(width / 2, 290, "Tower Defense • Foire en Lave", {
      fontFamily: "system-ui",
      fontSize: "26px",
      color: "#ffeebb",
      stroke: "#000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    const tile = this.add.container(width / 2, 430);
    const cannon = this.add.rectangle(0, 0, 60, 60, 0xc63a10).setStrokeStyle(3, 0xffe066);
    const eye = this.add.circle(-15, -10, 6, 0xff2200);
    const muzzle = this.add.rectangle(28, 0, 24, 12, 0x1a1a1a).setStrokeStyle(2, 0xffe066);
    tile.add([cannon, muzzle, eye]);

    this.tweens.add({ targets: tile, angle: 360, duration: 4000, repeat: -1, ease: "Linear" });
    this.tweens.add({ targets: tile, scale: { from: 1, to: 1.15 }, duration: 600, yoyo: true, repeat: -1, ease: "Sine.inOut" });

    const playBtn = this.add.container(width / 2, 560);
    const playBg = this.add.rectangle(0, 0, 280, 70, 0x4ed8a3).setStrokeStyle(4, 0x2a8a5a);
    const playLabel = this.add.text(0, 0, "▶ JOUER", {
      fontFamily: "system-ui",
      fontSize: "32px",
      fontStyle: "bold",
      color: "#fff",
      stroke: "#000",
      strokeThickness: 4,
    }).setOrigin(0.5);
    playBtn.add([playBg, playLabel]);
    playBtn.setSize(280, 70);
    playBtn.setInteractive(new Phaser.Geom.Rectangle(-140, -35, 280, 70), Phaser.Geom.Rectangle.Contains);

    this.tweens.add({ targets: playBg, scale: { from: 1, to: 1.05 }, duration: 800, yoyo: true, repeat: -1, ease: "Sine.inOut" });

    playBtn.on("pointerover", () => playBg.setFillStyle(0x66e8b0));
    playBtn.on("pointerout", () => playBg.setFillStyle(0x4ed8a3));
    playBtn.on("pointerdown", () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("CampaignMenuScene");
        this.scene.stop();
      });
    });

    this.add.text(width / 2, height - 30, "Phaser 4 • CC0 • v1.0 — Click ou ESPACE pour jouer", {
      fontFamily: "system-ui",
      fontSize: "13px",
      color: "#ccc",
    }).setOrigin(0.5);

    this.input.keyboard.once("keydown-SPACE", () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("CampaignMenuScene");
        this.scene.stop();
      });
    });

    this._buildVolumeSlider(width, height);
  }

  _buildVolumeSlider(width, height) {
    const sliderX = width - 110;
    const sliderY = height - 70;
    const trackW = 120;
    const trackH = 6;
    const knobR = 9;

    const saved = parseFloat(localStorage.getItem("parkdef:volume") ?? "0.5");
    let vol = isNaN(saved) ? 0.5 : Math.max(0, Math.min(1, saved));

    this.add.text(sliderX - trackW / 2, sliderY - 18, "Volume", {
      fontFamily: "system-ui",
      fontSize: "12px",
      color: "#aaa",
    });

    const track = this.add.rectangle(sliderX, sliderY, trackW, trackH, 0x555555).setOrigin(0.5);
    const fill = this.add.rectangle(sliderX - trackW / 2, sliderY, trackW * vol, trackH, 0x4ed8a3).setOrigin(0, 0.5);
    const knob = this.add.circle(sliderX - trackW / 2 + trackW * vol, sliderY, knobR, 0xffffff)
      .setInteractive({ draggable: true, useHandCursor: true });

    const updateVol = (px) => {
      const minX = sliderX - trackW / 2;
      const maxX = sliderX + trackW / 2;
      const clampedX = Math.max(minX, Math.min(maxX, px));
      vol = (clampedX - minX) / trackW;
      knob.setPosition(clampedX, sliderY);
      fill.setSize(trackW * vol, trackH);
      MusicManager.setVolume(vol);
    };

    this.input.setDraggable(knob);
    this.input.on("drag", (_ptr, obj, dragX) => {
      if (obj === knob) updateVol(dragX);
    });
  }
}

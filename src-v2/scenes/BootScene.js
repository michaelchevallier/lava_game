import * as Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#1a1f30");

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2a3050, 0x2a3050, 0xff6b1c, 0xff6b1c, 1);
    bg.fillRect(0, 0, width, height);

    this.add.text(width / 2, height / 2 - 80, "PARK DEFENSE", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "84px",
      fontStyle: "bold",
      color: "#ffd23f",
      stroke: "#000",
      strokeThickness: 8,
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 20, "Tower Defense • Foire en Lave", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "28px",
      color: "#ffffff",
      stroke: "#000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 80, "Sprint 0 — Phaser 4 boot OK", {
      fontFamily: "system-ui, monospace",
      fontSize: "18px",
      color: "#90ff90",
    }).setOrigin(0.5);

    const tile = this.add.rectangle(width / 2, height - 120, 80, 80, 0xff4400, 1)
      .setStrokeStyle(3, 0xffe066);

    this.tweens.add({
      targets: tile,
      angle: 360,
      duration: 2000,
      repeat: -1,
      ease: "Linear",
    });

    this.tweens.add({
      targets: tile,
      scale: { from: 1, to: 1.2 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    this.add.text(width / 2, height - 40, "Chargement de la campagne…", {
      fontFamily: "system-ui, monospace",
      fontSize: "14px",
      color: "#cccccc",
    }).setOrigin(0.5);

    this.time.delayedCall(1500, () => this.scene.start("CampaignMenuScene"));
  }
}

import * as Phaser from "phaser";
import { Sun } from "./Sun.js";

export class CottonCandy extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);

    this.intervalMs = opts.intervalMs ?? 25000;
    this.lastTickAt = scene.time.now - this.intervalMs + 8000;

    const shadow = scene.add.ellipse(0, 26, 56, 10, 0x000, 0.4);
    const standBase = scene.add.rectangle(0, 22, 60, 14, 0x6b3a0a).setStrokeStyle(2, 0x2a1a04);
    const standTop = scene.add.rectangle(0, 14, 56, 4, 0x8a4a1a);
    const drape = scene.add.rectangle(0, 8, 50, 10, 0xff66cc).setStrokeStyle(1, 0xc63a8a);

    const stripe1 = scene.add.rectangle(-12, 8, 8, 10, 0xfff8d0, 0.7);
    const stripe2 = scene.add.rectangle(12, 8, 8, 10, 0xfff8d0, 0.7);

    const cloudC = scene.add.circle(0, -12, 14, 0xffaaee).setStrokeStyle(1, 0xff66cc);
    const cloudL = scene.add.circle(-10, -10, 9, 0xffaaee).setStrokeStyle(1, 0xff66cc);
    const cloudR = scene.add.circle(10, -10, 9, 0xffaaee).setStrokeStyle(1, 0xff66cc);
    const cloudT = scene.add.circle(0, -22, 8, 0xffccf2).setStrokeStyle(1, 0xff66cc);
    const stick = scene.add.rectangle(0, 2, 2, 10, 0x6b3a0a);

    this.add([shadow, standBase, drape, stripe1, stripe2, standTop, stick, cloudC, cloudL, cloudR, cloudT]);
    this.cloudC = cloudC;
    this.setSize(60, 80);
    this.setDepth(8);

    scene.add.existing(this);

    scene.tweens.add({
      targets: [cloudC, cloudL, cloudR, cloudT],
      scale: { from: 1, to: 1.12 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    this._tick = (time, delta) => this.tick(time, delta);
    scene.events.on("game-tick", this._tick);
    this.once("destroy", () => scene.events.off("game-tick", this._tick));
  }

  tick(time) {
    if (!this.scene) return;
    if (time - this.lastTickAt < this.intervalMs) return;
    this.lastTickAt = time;
    this.spawnTicket();
  }

  spawnTicket() {
    const offsetX = (Math.random() - 0.5) * 30;
    const ticket = new Sun(this.scene, this.x + offsetX, this.y - 20, {
      amount: 0,
      driftToY: this.y + 14,
      lifetimeMs: 10000,
      autoCollectAt: 8000,
    });
    ticket._isTicket = true;
    if (ticket.main) ticket.main.setFillStyle(0xff66cc);
    if (ticket.halo) ticket.halo.setFillStyle(0xffaaee);
    if (this.scene.suns) this.scene.suns.push(ticket);
  }
}

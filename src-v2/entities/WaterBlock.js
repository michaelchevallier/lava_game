import * as Phaser from "phaser";

export class WaterBlock extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);

    this.maxHp = opts.hp ?? 30;
    this.hp = this.maxHp;
    this.isBlocking = true;
    this._dying = false;

    const useBlockSprite = scene.textures.exists("kenney_tile_base") && scene.textures.exists("kenney_tile_base2");

    if (useBlockSprite) {
      const blockBase = scene.add.image(0, 14, "kenney_tile_base2").setTint(0x1a4a6a).setScale(0.95);
      const blockTop = scene.add.image(0, -6, "kenney_tile_base").setTint(0x4ea3d8).setScale(0.88);
      const eye1 = scene.add.circle(-8, -8, 3, 0x000);
      const eye2 = scene.add.circle(8, -8, 3, 0x000);
      const mouth = scene.add.rectangle(0, 4, 14, 3, 0x000);
      this.add([blockBase, blockTop, eye1, eye2, mouth]);
    } else {
      const base = scene.add.rectangle(0, 18, 64, 18, 0x244a6a).setStrokeStyle(2, 0x0a1a2a);
      const block = scene.add.rectangle(0, -4, 56, 48, 0x4ea3d8).setStrokeStyle(2, 0x1a4a6a);
      const shine = scene.add.rectangle(-12, -16, 14, 6, 0xc8e8ff, 0.6);
      const eye1 = scene.add.circle(-8, -8, 3, 0x000);
      const eye2 = scene.add.circle(8, -8, 3, 0x000);
      const mouth = scene.add.rectangle(0, 4, 14, 3, 0x000);
      this.add([base, block, shine, eye1, eye2, mouth]);
    }

    this.hpBarBg = scene.add.rectangle(0, -34, 50, 5, 0x000, 0.6).setStrokeStyle(1, 0x222);
    this.hpBar = scene.add.rectangle(-25, -34, 50, 5, 0x4ed8a3).setOrigin(0, 0.5);
    this.add([this.hpBarBg, this.hpBar]);

    this.setSize(56, 70);
    this.setDepth(8);

    scene.add.existing(this);

    this._tick = (time, delta) => this.tick(time, delta);
    scene.events.on("game-tick", this._tick);
    this.once("destroy", () => scene.events.off("game-tick", this._tick));
  }

  takeDamage(dmg) {
    if (!this.scene || this._dying) return;
    this.hp -= dmg;
    const pct = Math.max(0, this.hp / this.maxHp);
    this.hpBar.setScale(pct, 1);
    if (this.hp <= 0) this.kill();
  }

  kill() {
    if (this._dying) return;
    this._dying = true;
    this.scene.events.emit("tile-destroyed", this);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleY: 0.2,
      duration: 250,
      onComplete: () => this.destroy(),
    });
  }

  tick() {
    if (!this.scene || this._dying) return;
  }
}

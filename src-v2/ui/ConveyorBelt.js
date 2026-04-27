import * as Phaser from "phaser";
import { TILE_DEFS, makeTileIcon } from "./Toolbar.js";

const SLOT_W = 76;
const SLOT_H = 76;
const SLOT_GAP = 6;
const MAX_SLOTS = 7;

export class ConveyorBelt extends Phaser.GameObjects.Container {
  constructor(scene, opts) {
    super(scene, 0, 0);
    this.scene = scene;
    this.allowed = (opts.allowedTiles || []).filter((id) => id !== "shovel");
    this.spawnIntervalMs = opts.spawnIntervalMs ?? 3500;
    this.onSelect = opts.onSelect;
    this.selectedTile = null;
    this.tiles = [];
    this._lastSpawn = 0;

    const { width, height } = scene.scale;
    const beltY = height - 50;
    const beltW = MAX_SLOTS * (SLOT_W + SLOT_GAP) - SLOT_GAP + 24;
    const beltX = (width - beltW) / 2;

    this.beltX = beltX;
    this.beltY = beltY;
    this.beltW = beltW;

    const bg = scene.add.rectangle(beltX, beltY, beltW, SLOT_H + 16, 0x2a1a0a, 0.92).setStrokeStyle(2, 0x6b3a0a).setOrigin(0, 0.5);
    bg.setDepth(48);
    this.add(bg);

    for (let i = 0; i < MAX_SLOTS; i++) {
      const x = beltX + 12 + i * (SLOT_W + SLOT_GAP);
      const slotBg = scene.add.rectangle(x, beltY, SLOT_W - 4, SLOT_H - 4, 0x000, 0.25).setStrokeStyle(1, 0x4a2a0a, 0.4).setOrigin(0, 0.5);
      slotBg.setDepth(48);
      this.add(slotBg);
    }

    const lblBg = scene.add.rectangle(beltX, beltY - SLOT_H / 2 - 18, 130, 22, 0x6b3a0a, 0.95).setStrokeStyle(1, 0xffd23f).setOrigin(0, 0.5);
    lblBg.setDepth(49);
    const lbl = scene.add.text(beltX + 8, beltY - SLOT_H / 2 - 18, "🎡 Tapis Carnaval", {
      fontFamily: "Fredoka, system-ui",
      fontSize: "13px",
      fontStyle: "bold",
      color: "#ffd23f",
    }).setOrigin(0, 0.5).setDepth(50);
    this.add([lblBg, lbl]);

    scene.add.existing(this);
    this.setDepth(48);

    this._tickHandler = (time, delta) => this.tick(time, delta);
    scene.events.on("update", this._tickHandler);

    scene.events.once("shutdown", () => this._cleanup());
    scene.events.once("destroy", () => this._cleanup());
  }

  _cleanup() {
    if (this._tickHandler) {
      this.scene?.events?.off("update", this._tickHandler);
      this._tickHandler = null;
    }
  }

  tick(time, delta) {
    if (!this.scene || !this.active) return;

    if (this.tiles.length < MAX_SLOTS && time - this._lastSpawn > this.spawnIntervalMs) {
      this.spawnTile(time);
      this._lastSpawn = time;
    }

    for (const tile of this.tiles) {
      if (tile._slotIdx > 0 && tile._sliding) continue;
    }
    this._updatePositions();
  }

  spawnTile(time) {
    if (!this.allowed.length) return;
    const id = this.allowed[Math.floor(Math.random() * this.allowed.length)];
    const def = TILE_DEFS.find((d) => d.id === id);
    if (!def) return;

    const slotIdx = this.tiles.length;
    const x = this._slotX(MAX_SLOTS) + 60;
    const y = this.beltY;

    const c = this.scene.add.container(x, y);
    const back = this.scene.add.rectangle(0, 0, SLOT_W - 4, SLOT_H - 4, 0x222840).setStrokeStyle(2, 0x4a4a6a);
    const icon = makeTileIcon(this.scene, def.id, 0, -8);
    icon.setScale(0.85);
    const label = this.scene.add.text(0, 22, def.label, {
      fontFamily: "Fredoka, system-ui",
      fontSize: "10px",
      color: "#dde",
    }).setOrigin(0.5);
    c.add([back, icon, label]);
    c.setSize(SLOT_W - 4, SLOT_H - 4);
    c.setInteractive(new Phaser.Geom.Rectangle(-(SLOT_W - 4) / 2, -(SLOT_H - 4) / 2, SLOT_W - 4, SLOT_H - 4), Phaser.Geom.Rectangle.Contains);
    c.setDepth(50);
    c._def = def;
    c._back = back;
    c._slotIdx = slotIdx;

    c.on("pointerover", () => {
      if (this.selectedTile !== c) back.setStrokeStyle(2, 0xffd23f);
    });
    c.on("pointerout", () => {
      if (this.selectedTile !== c) back.setStrokeStyle(2, 0x4a4a6a);
    });
    c.on("pointerdown", (pointer, lx, ly, ev) => {
      this.selectTile(c);
      if (ev && ev.stopPropagation) ev.stopPropagation();
      this.scene._conveyorClickAt = this.scene.time.now;
    });

    this.tiles.push(c);
    this.scene.tweens.add({
      targets: c,
      x: this._slotX(slotIdx),
      duration: 600,
      ease: "Cubic.out",
    });
  }

  _slotX(idx) {
    return this.beltX + 12 + idx * (SLOT_W + SLOT_GAP) + (SLOT_W - 4) / 2;
  }

  _updatePositions() {
    for (let i = 0; i < this.tiles.length; i++) {
      const t = this.tiles[i];
      if (!t || !t.active) continue;
      if (t._slotIdx !== i) {
        t._slotIdx = i;
        if (!t._sliding) {
          t._sliding = true;
          this.scene.tweens.add({
            targets: t,
            x: this._slotX(i),
            duration: 300,
            ease: "Cubic.out",
            onComplete: () => { t._sliding = false; },
          });
        }
      }
    }
  }

  selectTile(tile) {
    if (this.selectedTile === tile) {
      this.clearSelection();
      this.onSelect?.(null);
      return;
    }
    if (this.selectedTile) this.selectedTile._back.setStrokeStyle(2, 0x4a4a6a);
    this.selectedTile = tile;
    tile._back.setStrokeStyle(3, 0xffd23f);
    tile._back.setFillStyle(0x33405a);
    this.onSelect?.(tile._def);
  }

  consumeSelected() {
    if (!this.selectedTile) return;
    const t = this.selectedTile;
    this.selectedTile = null;
    const idx = this.tiles.indexOf(t);
    if (idx >= 0) this.tiles.splice(idx, 1);
    this.scene.tweens.add({
      targets: t,
      scale: 0.4,
      alpha: 0,
      y: t.y - 30,
      duration: 280,
      onComplete: () => t.destroy(),
    });
  }

  clearSelection() {
    if (!this.selectedTile) return;
    if (this.selectedTile._back && this.selectedTile.active) {
      this.selectedTile._back.setStrokeStyle(2, 0x4a4a6a);
      this.selectedTile._back.setFillStyle(0x222840);
    }
    this.selectedTile = null;
  }

  triggerCooldown() {}
  isOnCooldown() { return false; }
}

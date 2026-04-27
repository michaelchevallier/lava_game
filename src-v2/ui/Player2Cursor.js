import * as Phaser from "phaser";
import { GRID, cellToPixel } from "../systems/Grid.js";

export class Player2Cursor {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.col = opts.col ?? 6;
    this.row = opts.row ?? 2;
    this.color = opts.color ?? 0x66ddff;
    this.active = false;
    this.onPlace = opts.onPlace;

    this._build();
    this._setupInputs();

    scene.events.once("shutdown", () => this._cleanup());
    scene.events.once("destroy", () => this._cleanup());
  }

  _build() {
    const { x, y } = cellToPixel(this.col, this.row);
    this.container = this.scene.add.container(x, y).setDepth(45).setVisible(false);
    const ring = this.scene.add.rectangle(0, 0, 84, 84, this.color, 0).setStrokeStyle(3, this.color);
    const inner = this.scene.add.rectangle(0, 0, 70, 70, this.color, 0.15).setStrokeStyle(1, this.color);
    const cross1 = this.scene.add.rectangle(0, 0, 30, 2, this.color);
    const cross2 = this.scene.add.rectangle(0, 0, 2, 30, this.color);
    const lbl = this.scene.add.text(0, -50, "P2", {
      fontFamily: "Bangers, Fredoka, system-ui",
      fontSize: "20px",
      color: "#66ddff",
      stroke: "#000",
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.container.add([ring, inner, cross1, cross2, lbl]);
    this.scene.tweens.add({
      targets: ring,
      scale: { from: 1, to: 1.08 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  _setupInputs() {
    this._keyHandler = (e) => {
      if (this.scene?.gameOver) return;
      let acted = false;
      if (e.code === "ArrowLeft") { this.col = Math.max(0, this.col - 1); acted = true; }
      else if (e.code === "ArrowRight") { this.col = Math.min(GRID.cols - 1, this.col + 1); acted = true; }
      else if (e.code === "ArrowUp") { this.row = Math.max(0, this.row - 1); acted = true; }
      else if (e.code === "ArrowDown") { this.row = Math.min(GRID.rows - 1, this.row + 1); acted = true; }
      else if (e.code === "Enter" || e.code === "NumpadEnter") {
        e.preventDefault();
        this.activate();
        this._tryPlace();
        return;
      }
      if (acted) {
        e.preventDefault();
        this.activate();
        this._snapToCell();
      }
    };
    this.scene.input.keyboard.on("keydown", this._keyHandler);
  }

  _snapToCell() {
    const { x, y } = cellToPixel(this.col, this.row);
    this.scene.tweens.add({ targets: this.container, x, y, duration: 90, ease: "Cubic.out" });
  }

  activate() {
    if (this.active) return;
    this.active = true;
    this.container.setVisible(true);
    this.container.setAlpha(0);
    this.scene.tweens.add({ targets: this.container, alpha: 1, duration: 180 });
  }

  _tryPlace() {
    if (!this.onPlace) return;
    const { x, y } = cellToPixel(this.col, this.row);
    this.onPlace({ x, y, col: this.col, row: this.row });
    this.scene.tweens.add({
      targets: this.container, scale: { from: 1.4, to: 1 }, duration: 150, ease: "Back.out",
    });
  }

  _cleanup() {
    if (this._keyHandler) {
      this.scene?.input?.keyboard?.off("keydown", this._keyHandler);
      this._keyHandler = null;
    }
  }
}

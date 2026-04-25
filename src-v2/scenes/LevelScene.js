import * as Phaser from "phaser";
import { Visitor } from "../entities/Visitor.js";
import { LavaTower } from "../entities/LavaTower.js";
import { Toolbar } from "../ui/Toolbar.js";
import {
  GRID,
  cellToPixel,
  pixelToCell,
  rowToY,
  rightEdgeX,
  leftEdgeX,
  createGridState,
  isEmpty,
  setCell,
} from "../systems/Grid.js";

export class LevelScene extends Phaser.Scene {
  constructor() {
    super("LevelScene");
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, 0, width, height, 0x6ec1e4).setOrigin(0.5, 0);
    const groundY = GRID.originY + GRID.rows * GRID.cellSize;
    this.add.rectangle(width / 2, groundY, width, height - groundY, 0x4a8a3a).setOrigin(0.5, 0);

    this.gridState = createGridState();
    this.drawGrid();
    this.drawEntryExit();

    this.escaped = 0;
    this.killed = 0;
    this.visitors = [];
    this.projectiles = [];
    this.towers = [];

    this.scoreText = this.add.text(20, 20, "Échappés : 0", {
      fontFamily: "system-ui",
      fontSize: "20px",
      color: "#ffaaaa",
      stroke: "#000",
      strokeThickness: 4,
    });
    this.killText = this.add.text(20, 50, "Tués : 0", {
      fontFamily: "system-ui",
      fontSize: "20px",
      color: "#90ff90",
      stroke: "#000",
      strokeThickness: 4,
    });
    this.add.text(width / 2, 20, "Sprint 2 — pose des Lava Towers sur la grille", {
      fontFamily: "system-ui",
      fontSize: "16px",
      color: "#ffd23f",
    }).setOrigin(0.5, 0);

    this.events.on("visitor-escaped", () => {
      this.escaped++;
      this.scoreText.setText("Échappés : " + this.escaped);
    });
    this.events.on("visitor-killed", () => {
      this.killed++;
      this.killText.setText("Tués : " + this.killed);
    });

    this.events.on("update", () => {
      this.visitors = this.visitors.filter((v) => v.active);
      this.projectiles = this.projectiles.filter((p) => p.active);
      this.checkProjectileHits();
    });

    this.placementDef = null;
    this.ghost = null;
    this.toolbar = new Toolbar(this, height - 100, (def) => this.setPlacement(def));

    this.input.on("pointermove", (p) => this.updateGhost(p));
    this.input.on("pointerdown", (p) => this.tryPlace(p));

    this.spawnerEvent = this.time.addEvent({
      delay: 2500,
      loop: true,
      callback: () => this.spawnVisitorRandomLane(),
    });

    for (let r = 0; r < GRID.rows; r++) this.spawnVisitor(r);
  }

  drawGrid() {
    const g = this.add.graphics();
    g.lineStyle(1, 0x244a1a, 0.4);
    for (let r = 0; r < GRID.rows; r++) {
      const y0 = GRID.originY + r * GRID.cellSize;
      const stripe = this.add.rectangle(
        GRID.originX + (GRID.cols * GRID.cellSize) / 2,
        y0 + GRID.cellSize / 2,
        GRID.cols * GRID.cellSize,
        GRID.cellSize - 4,
        r % 2 === 0 ? 0x5fb04c : 0x4ea03c,
        0.85,
      );
      stripe.setStrokeStyle(2, 0x244a1a);
    }
    for (let c = 1; c < GRID.cols; c++) {
      const x = GRID.originX + c * GRID.cellSize;
      g.lineBetween(x, GRID.originY, x, GRID.originY + GRID.rows * GRID.cellSize);
    }
    g.setDepth(2);
  }

  drawEntryExit() {
    const left = leftEdgeX();
    const right = rightEdgeX();
    for (let r = 0; r < GRID.rows; r++) {
      const y = rowToY(r);
      this.add.rectangle(left - 40, y, 50, 80, 0xff6b1c).setStrokeStyle(3, 0x8a3a0a);
      this.add.rectangle(right + 40, y, 50, 80, 0x4a4a4a).setStrokeStyle(3, 0x222);
    }
    this.add.text(left - 40, GRID.originY - 20, "SORTIE", {
      fontFamily: "system-ui",
      fontSize: "14px",
      color: "#fff",
      stroke: "#000",
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.add.text(right + 40, GRID.originY - 20, "ENTRÉE", {
      fontFamily: "system-ui",
      fontSize: "14px",
      color: "#fff",
      stroke: "#000",
      strokeThickness: 3,
    }).setOrigin(0.5);
  }

  setPlacement(def) {
    this.placementDef = def;
    if (this.ghost) {
      this.ghost.destroy();
      this.ghost = null;
    }
    if (def) {
      this.ghost = this.add.rectangle(0, 0, 60, 60, def.color, 0.45)
        .setStrokeStyle(2, def.accent)
        .setVisible(false)
        .setDepth(40);
    }
  }

  updateGhost(pointer) {
    if (!this.ghost) return;
    const cell = pixelToCell(pointer.x, pointer.y);
    if (!cell) {
      this.ghost.setVisible(false);
      return;
    }
    const { x, y } = cellToPixel(cell.col, cell.row);
    this.ghost.setPosition(x, y);
    const ok = isEmpty(this.gridState, cell.col, cell.row);
    this.ghost.setFillStyle(ok ? this.placementDef.color : 0xff2222, ok ? 0.45 : 0.6);
    this.ghost.setVisible(true);
  }

  tryPlace(pointer) {
    if (!this.placementDef) return;
    const cell = pixelToCell(pointer.x, pointer.y);
    if (!cell) return;
    if (!isEmpty(this.gridState, cell.col, cell.row)) return;
    const { x, y } = cellToPixel(cell.col, cell.row);
    const tower = new LavaTower(this, x, y, { fireRate: 1500, damage: 1 });
    this.towers.push(tower);
    setCell(this.gridState, cell.col, cell.row, tower);
    this.toolbar.clearSelection();
    this.setPlacement(null);
  }

  spawnVisitor(row) {
    const y = rowToY(row);
    const x = rightEdgeX() + 50;
    const v = new Visitor(this, x, y, { hp: 1, speed: 60 });
    v.row = row;
    this.visitors.push(v);
  }

  spawnVisitorRandomLane() {
    const r = Math.floor(Math.random() * GRID.rows);
    this.spawnVisitor(r);
  }

  checkProjectileHits() {
    for (const proj of this.projectiles) {
      if (!proj.active || proj._dead) continue;
      for (const v of this.visitors) {
        if (!v.active || v._dying) continue;
        if (Math.abs(proj.y - v.y) > 36) continue;
        if (Math.abs(proj.x - v.x) > 18) continue;
        proj.hit(v);
        break;
      }
    }
  }
}

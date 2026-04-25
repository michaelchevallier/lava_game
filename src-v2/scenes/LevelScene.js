import * as Phaser from "phaser";
import { Visitor } from "../entities/Visitor.js";
import { LavaTower } from "../entities/LavaTower.js";
import { CoinGenerator } from "../entities/CoinGenerator.js";
import { WaterBlock } from "../entities/WaterBlock.js";
import { Fan } from "../entities/Fan.js";
import { MagnetBomb } from "../entities/MagnetBomb.js";
import { Catapult } from "../entities/Catapult.js";
import { Toolbar } from "../ui/Toolbar.js";
import { WaveManager, computeStars } from "../systems/WaveManager.js";
import { getLevel, getFirstLevelId } from "../data/levels/index.js";
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

  init(data) {
    const wantedId = data?.levelId || getFirstLevelId();
    this.level = getLevel(wantedId) || getLevel(getFirstLevelId());
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
    this.coins = this.level.startCoins ?? 100;
    this.visitors = [];
    this.projectiles = [];
    this.towers = [];
    this.gameOver = false;

    this.coinsText = this.add.text(20, 16, "¢ " + this.coins, {
      fontFamily: "system-ui",
      fontSize: "28px",
      fontStyle: "bold",
      color: "#ffd23f",
      stroke: "#000",
      strokeThickness: 5,
    });
    this.scoreText = this.add.text(20, 56, "Échappés : 0", {
      fontFamily: "system-ui",
      fontSize: "18px",
      color: "#ffaaaa",
      stroke: "#000",
      strokeThickness: 4,
    });
    this.killText = this.add.text(20, 82, "Tués : 0", {
      fontFamily: "system-ui",
      fontSize: "18px",
      color: "#90ff90",
      stroke: "#000",
      strokeThickness: 4,
    });
    this.levelTitleText = this.add.text(width / 2, 16, "Niveau " + this.level.id + " — " + this.level.name, {
      fontFamily: "system-ui",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#fff",
      stroke: "#000",
      strokeThickness: 4,
    }).setOrigin(0.5, 0);
    this.waveStatusText = this.add.text(width / 2, 44, "Préparation…", {
      fontFamily: "system-ui",
      fontSize: "14px",
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

    this.events.on("coins-earned", (amount) => {
      this.coins += amount;
      this.refreshCoinsText();
    });

    this.events.on("update", (time, delta) => {
      this.visitors = this.visitors.filter((v) => v.active);
      this.projectiles = this.projectiles.filter((p) => p.active);
      this.towers = this.towers.filter((t) => t.active);
      this.checkProjectileHits();
      this.updateBlockers(time, delta);
      if (this.waveManager && !this.gameOver) {
        this.waveManager.tick(time);
        this.refreshWaveStatus(time);
        this.checkEndCondition();
      }
    });

    this.events.on("tile-destroyed", (tile) => {
      for (let r = 0; r < this.gridState.length; r++) {
        for (let c = 0; c < this.gridState[r].length; c++) {
          if (this.gridState[r][c] === tile) {
            this.gridState[r][c] = null;
            return;
          }
        }
      }
    });

    this.placementDef = null;
    this.ghost = null;
    this.toolbar = new Toolbar(
      this,
      height - 100,
      (def) => this.setPlacement(def),
      () => this.coins,
    );

    this.input.on("pointermove", (p) => this.updateGhost(p));
    this.input.on("pointerdown", (p) => this.tryPlace(p));

    this.waveManager = new WaveManager(this, this.level);
    this.waveManager.start();
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
    if (this.coins < this.placementDef.cost) return;
    const { x, y } = cellToPixel(cell.col, cell.row);
    let entity = null;
    if (this.placementDef.id === "lava") {
      entity = new LavaTower(this, x, y, { fireRate: 1500, damage: 1 });
    } else if (this.placementDef.id === "coin") {
      entity = new CoinGenerator(this, x, y, { amount: 25, intervalMs: 8000 });
    } else if (this.placementDef.id === "water") {
      entity = new WaterBlock(this, x, y, { hp: 8 });
    } else if (this.placementDef.id === "fan") {
      entity = new Fan(this, x, y);
    } else if (this.placementDef.id === "magnet") {
      entity = new MagnetBomb(this, x, y);
    } else if (this.placementDef.id === "catapult") {
      entity = new Catapult(this, x, y);
    }
    if (!entity) return;
    this.towers.push(entity);
    setCell(this.gridState, cell.col, cell.row, entity);
    this.coins -= this.placementDef.cost;
    this.refreshCoinsText();
    this.toolbar.clearSelection();
    this.setPlacement(null);
  }

  refreshCoinsText() {
    this.coinsText.setText("¢ " + this.coins);
  }

  updateBlockers(time, delta) {
    const dtSec = delta / 1000;
    for (const v of this.visitors) {
      if (!v.active || v._dying) continue;
      if (v.canFly) { v.blocked = false; continue; }
      const cellAhead = pixelToCell(v.x - 35, v.y);
      let blocker = null;
      if (cellAhead) {
        const t = this.gridState[cellAhead.row][cellAhead.col];
        if (t && t.isBlocking && !t._dying) blocker = t;
      }
      if (blocker) {
        v.blocked = true;
        if (typeof blocker.takeDamage === "function") blocker.takeDamage(0.6 * dtSec);
      } else {
        v.blocked = false;
      }
    }
  }

  spawnVisitor(row, type = "basic") {
    const y = rowToY(row);
    const x = rightEdgeX() + 50;
    const v = new Visitor(this, x, y, { type });
    v.row = row;
    this.visitors.push(v);
  }

  refreshWaveStatus(time) {
    const total = this.waveManager.totalVisitors();
    const spawned = this.waveManager.spawnedCount();
    const alive = this.visitors.length;
    const next = this.waveManager.nextWaveAtMs(time);
    if (next != null && next > 100) {
      this.waveStatusText.setText("Prochaine vague dans " + Math.ceil(next / 1000) + "s — " + spawned + "/" + total);
    } else {
      this.waveStatusText.setText("En cours — visiteurs vivants : " + alive + " / " + total + " — échappés " + this.escaped + "/" + (this.level.loseEscaped || 5));
    }
  }

  checkEndCondition() {
    if (this.gameOver) return;
    if (this.escaped >= (this.level.loseEscaped || 5)) {
      this.endLevel(false);
      return;
    }
    if (this.waveManager.allSpawned && this.visitors.length === 0) {
      this.endLevel(true);
    }
  }

  endLevel(win) {
    this.gameOver = true;
    const stars = win ? computeStars(this.level, this.escaped) : 0;
    this.time.delayedCall(800, () => {
      this.scene.start("LevelResultScene", {
        win,
        stars,
        killed: this.killed,
        escaped: this.escaped,
        coins: this.coins,
        levelId: this.level.id,
        levelName: this.level.name,
      });
    });
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

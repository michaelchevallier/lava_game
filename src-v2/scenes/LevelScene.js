import * as Phaser from "phaser";
import { Visitor } from "../entities/Visitor.js";
import { LavaTower } from "../entities/LavaTower.js";
import { CoinGenerator } from "../entities/CoinGenerator.js";
import { WaterBlock } from "../entities/WaterBlock.js";
import { Fan } from "../entities/Fan.js";
import { MagnetBomb } from "../entities/MagnetBomb.js";
import { Catapult } from "../entities/Catapult.js";
import { FrostTramp } from "../entities/FrostTramp.js";
import { Portal } from "../entities/Portal.js";
import { Toolbar } from "../ui/Toolbar.js";
import { WaveManager, computeStars } from "../systems/WaveManager.js";
import { getLevel, getFirstLevelId } from "../data/levels/index.js";
import { Audio } from "../systems/Audio.js";
import { Tutorial } from "../ui/Tutorial.js";
import { getTheme } from "../systems/Theme.js";
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
    this.theme = getTheme(this.level.world || 1);

    const skyGrad = this.add.graphics();
    skyGrad.fillGradientStyle(this.theme.skyTop, this.theme.skyTop, this.theme.skyBottom, this.theme.skyBottom, 1);
    skyGrad.fillRect(0, 0, width, GRID.originY);

    this.drawSkyDecor();

    const groundY = GRID.originY + GRID.rows * GRID.cellSize;
    const groundGrad = this.add.graphics();
    groundGrad.fillGradientStyle(this.theme.groundTop, this.theme.groundTop, this.theme.groundBottom, this.theme.groundBottom, 1);
    groundGrad.fillRect(0, groundY, width, height - groundY);

    this.gridState = createGridState();
    this.drawGrid();
    this.drawEntryExit();
    this.applyWeather();
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
      Audio.kill();
    });

    this.events.on("coins-earned", (amount) => {
      this.coins += amount;
      this.refreshCoinsText();
      Audio.coin();
      this.tweens.add({
        targets: this.coinsText,
        scale: { from: 1.25, to: 1 },
        duration: 200,
        ease: "Cubic.out",
      });
    });

    this.events.on("visitor-escaped", () => {
      Audio.hit();
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

    Audio.resume();

    this.level.waves.forEach((wave, i) => {
      const at = Math.max(0, wave.delayMs - 1200);
      this.time.delayedCall(at, () => {
        if (!this.gameOver && this.scene.isActive()) {
          const colorHex = "#" + this.theme.accent.toString(16).padStart(6, "0");
          this.showWaveBanner("VAGUE " + (i + 1), colorHex);
          Audio.crack ? Audio.crack() : Audio.click?.();
        }
      });
    });

    if (this.level.id === "1.1") {
      this.tutorial = new Tutorial(this, [
        {
          text: "Bienvenue à Park Defense ! Place une Coin Generator pour gagner des pièces régulièrement.",
          hint: "Clique sur le bouton Coin Gen en bas",
          arrowAt: { x: this.scale.width / 2 - 200, y: this.scale.height - 130 },
          condition: (s) => s.towers.some((t) => t.constructor.name === "CoinGenerator"),
        },
        {
          text: "Maintenant pose une Lava Tower pour transformer les visiteurs en squelettes.",
          hint: "Drag depuis le bouton Lava Tower",
          arrowAt: { x: this.scale.width / 2 - 60, y: this.scale.height - 130 },
          condition: (s) => s.towers.some((t) => t.constructor.name === "LavaTower"),
        },
        {
          text: "Parfait ! Les visiteurs arrivent par la droite, ils marchent vers la sortie à gauche. Ne les laisse pas passer !",
          hint: "À toi de jouer",
          timeout: 4000,
        },
      ]);
      this.tutorial.start();
    }
  }

  drawGrid() {
    const t = this.theme;
    for (let r = 0; r < GRID.rows; r++) {
      const y0 = GRID.originY + r * GRID.cellSize;
      const stripe = this.add.rectangle(
        GRID.originX + (GRID.cols * GRID.cellSize) / 2,
        y0 + GRID.cellSize / 2,
        GRID.cols * GRID.cellSize,
        GRID.cellSize - 2,
        r % 2 === 0 ? t.laneA : t.laneB,
        1,
      );
      stripe.setStrokeStyle(1, t.laneStroke);
    }
    const cellG = this.add.graphics();
    cellG.lineStyle(1, t.laneStroke, 0.25);
    for (let r = 0; r <= GRID.rows; r++) {
      const y = GRID.originY + r * GRID.cellSize;
      cellG.lineBetween(GRID.originX, y, GRID.originX + GRID.cols * GRID.cellSize, y);
    }
    for (let c = 1; c < GRID.cols; c++) {
      const x = GRID.originX + c * GRID.cellSize;
      cellG.lineBetween(x, GRID.originY, x, GRID.originY + GRID.rows * GRID.cellSize);
    }
    cellG.setDepth(2);

    const detailColor = this.level.world === 4 ? 0xff6b1c : (this.level.world === 5 ? 0x6a0a0a : 0x3a7a2a);
    for (let i = 0; i < 40; i++) {
      const x = GRID.originX + Math.random() * (GRID.cols * GRID.cellSize);
      const y = GRID.originY + Math.random() * (GRID.rows * GRID.cellSize);
      const blade = this.add.rectangle(x, y, 1, 3 + Math.random() * 3, detailColor, 0.45);
      blade.setDepth(3);
    }
  }

  drawSkyDecor() {
    const w = this.scale.width;
    const world = this.level.world || 1;
    if (world === 1 || world === 3) {
      for (let i = 0; i < 5; i++) {
        const cx = (i * 280 + 80) % w;
        const cy = 30 + (i * 7) % 60;
        const cloud = this.add.ellipse(cx, cy, 80, 22, 0xffffff, world === 3 ? 0.7 : 0.85);
        this.tweens.add({ targets: cloud, x: cloud.x + 1280, duration: 80000 + i * 12000, repeat: -1 });
      }
    }
    if (world === 1) {
      const sun = this.add.circle(w - 80, 60, 28, 0xffd23f).setStrokeStyle(3, 0xffaa00);
      this.tweens.add({ targets: sun, scale: 1.06, duration: 1800, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    }
    if (world === 2 || world === 5) {
      for (let i = 0; i < 25; i++) {
        const sx = Math.random() * w;
        const sy = Math.random() * (GRID.originY - 20);
        const star = this.add.circle(sx, sy, 1 + Math.random() * 1.2, 0xffffff, 0.8);
        this.tweens.add({ targets: star, alpha: { from: 0.3, to: 1 }, duration: 1000 + Math.random() * 1500, yoyo: true, repeat: -1 });
      }
      const moon = this.add.circle(w - 100, 50, 22, 0xfff8c8).setStrokeStyle(2, 0xc8c8a0);
      const moonShade = this.add.circle(w - 92, 46, 18, this.theme.skyTop, 0.6);
    }
    if (world === 4) {
      for (let i = 0; i < 8; i++) {
        const fx = Math.random() * w;
        const fy = Math.random() * (GRID.originY - 30);
        const flame = this.add.triangle(fx, fy, 0, 8, 4, -8, 8, 8, 0xff6b1c, 0.6);
        this.tweens.add({ targets: flame, scale: { from: 0.8, to: 1.2 }, duration: 800 + Math.random() * 600, yoyo: true, repeat: -1 });
      }
    }
  }

  applyWeather() {
    const w = this.theme.weather;
    if (w === "rain") {
      this.time.addEvent({
        delay: 80, loop: true,
        callback: () => {
          if (!this.scene.isActive()) return;
          for (let i = 0; i < 3; i++) {
            const x = Math.random() * this.scale.width;
            const drop = this.add.rectangle(x, -10, 1.5, 12, 0xaaccff, 0.7).setDepth(45);
            this.tweens.add({
              targets: drop, y: this.scale.height + 20, x: x + 30,
              duration: 700, ease: "Linear",
              onComplete: () => drop.destroy(),
            });
          }
        },
      });
    } else if (w === "ash") {
      this.time.addEvent({
        delay: 250, loop: true,
        callback: () => {
          if (!this.scene.isActive()) return;
          const x = Math.random() * this.scale.width;
          const ash = this.add.circle(x, -10, 1 + Math.random() * 1.5, 0x444444, 0.7).setDepth(45);
          this.tweens.add({
            targets: ash, y: this.scale.height + 20, x: x + (Math.random() - 0.5) * 100,
            duration: 4000 + Math.random() * 2000, ease: "Linear",
            onComplete: () => ash.destroy(),
          });
        },
      });
    } else if (w === "lightning") {
      this.time.addEvent({
        delay: 4500, loop: true,
        callback: () => {
          if (!this.scene.isActive()) return;
          const flash = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0xffffff, 0.55).setDepth(60);
          this.tweens.add({
            targets: flash, alpha: 0, duration: 200,
            onComplete: () => flash.destroy(),
          });
        },
      });
    } else if (w === "fireflies") {
      for (let i = 0; i < 12; i++) {
        const fx = Math.random() * this.scale.width;
        const fy = GRID.originY + Math.random() * (GRID.rows * GRID.cellSize - 40);
        const fly = this.add.circle(fx, fy, 2, 0xfff8c8, 1).setDepth(45);
        this.tweens.add({
          targets: fly,
          x: fx + (Math.random() - 0.5) * 200,
          y: fy + (Math.random() - 0.5) * 80,
          alpha: { from: 1, to: 0.3 },
          duration: 2000 + Math.random() * 2000,
          yoyo: true, repeat: -1, ease: "Sine.inOut",
        });
      }
    }
  }

  showWaveBanner(text, color) {
    const t = this.add.text(this.scale.width / 2, 200, text, {
      fontFamily: "system-ui",
      fontSize: "56px",
      fontStyle: "bold",
      color,
      stroke: "#000",
      strokeThickness: 10,
    }).setOrigin(0.5).setDepth(70).setScale(0);
    this.tweens.add({
      targets: t, scale: 1, duration: 350, ease: "Back.out",
    });
    this.tweens.add({
      targets: t, alpha: 0, duration: 600, delay: 1400,
      onComplete: () => t.destroy(),
    });
  }

  showDamageNumber(x, y, dmg, color = "#ffeebb") {
    const d = this.add.text(x, y, "-" + dmg, {
      fontFamily: "system-ui",
      fontSize: "16px",
      fontStyle: "bold",
      color,
      stroke: "#000",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(35);
    this.tweens.add({
      targets: d, y: y - 30, alpha: 0,
      duration: 600, ease: "Cubic.out",
      onComplete: () => d.destroy(),
    });
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
      this.ghost = this.add.rectangle(0, 0, 84, 84, def.color, 0.4)
        .setStrokeStyle(3, def.accent)
        .setVisible(false)
        .setDepth(40);
      const p = this.input?.activePointer;
      if (p) this.updateGhost(p);
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
      entity = new LavaTower(this, x, y);
    } else if (this.placementDef.id === "coin") {
      entity = new CoinGenerator(this, x, y);
    } else if (this.placementDef.id === "water") {
      entity = new WaterBlock(this, x, y);
    } else if (this.placementDef.id === "fan") {
      entity = new Fan(this, x, y);
    } else if (this.placementDef.id === "magnet") {
      entity = new MagnetBomb(this, x, y);
    } else if (this.placementDef.id === "catapult") {
      entity = new Catapult(this, x, y);
    } else if (this.placementDef.id === "frost") {
      entity = new FrostTramp(this, x, y);
    } else if (this.placementDef.id === "portal") {
      entity = new Portal(this, x, y);
    }
    if (!entity) return;
    this.towers.push(entity);
    setCell(this.gridState, cell.col, cell.row, entity);
    this.coins -= this.placementDef.cost;
    this.refreshCoinsText();
    Audio.place();
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
    if (this.tutorial) this.tutorial.cleanup();
    const stars = win ? computeStars(this.level, this.escaped) : 0;
    if (win) Audio.win(); else Audio.lose();
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
      this.scene.stop();
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

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
import { LawnMower } from "../entities/LawnMower.js";
import { Sun } from "../entities/Sun.js";
import { TreasureChest } from "../entities/TreasureChest.js";
import { CottonCandy } from "../entities/CottonCandy.js";
import { Mine } from "../entities/Mine.js";
import { NeonLamp } from "../entities/NeonLamp.js";
import { Tamer } from "../entities/Tamer.js";
import { Laser } from "../entities/Laser.js";
import { Bulle } from "../entities/Bulle.js";
import { Toolbar } from "../ui/Toolbar.js";
import { ConveyorBelt } from "../ui/ConveyorBelt.js";
import { Player2Cursor } from "../ui/Player2Cursor.js";
import { WaveManager, computeStars } from "../systems/WaveManager.js";
import { getLevel, getFirstLevelId } from "../data/levels/index.js";
import { getDailyLevel, recordDaily } from "../systems/Daily.js";
import { loadSave, saveSave } from "../systems/SaveSystem.js";
import { Audio } from "../systems/Audio.js";
import { MusicManager } from "../systems/MusicManager.js";
import { Flash } from "../systems/Flash.js";
import { Particles } from "../systems/Particles.js";
import { Tutorial } from "../ui/Tutorial.js";
import { getTheme } from "../systems/Theme.js";
import { LavaMeter } from "../systems/LavaMeter.js";
import { bumpKills, bumpTickets, trophyBonus } from "../systems/Trophies.js";
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
    if (wantedId === "daily") {
      this.level = getDailyLevel();
      this.isDaily = true;
    } else {
      this.level = getLevel(wantedId) || getLevel(getFirstLevelId());
      this.isDaily = false;
    }
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

    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.events.removeAllListeners("coins-earned");
    this.events.removeAllListeners("visitor-killed");
    this.events.removeAllListeners("visitor-escaped");
    this.events.removeAllListeners("tile-destroyed");
    this.events.removeAllListeners("sun-collected");
    this.events.removeAllListeners("mower-fired");
    this.events.removeAllListeners("lava-erupt");
    this.events.removeAllListeners("lava-overflow");
    this.events.removeAllListeners("lava-safe");
    this.events.removeAllListeners("tower-disabled");
    this.events.removeAllListeners("coins-refund");
    this.events.removeAllListeners("ticket-collected");
    if (this.lavaMeter) { this.lavaMeter.destroy(); this.lavaMeter = null; }

    this.gridState = createGridState();
    this.drawGrid();
    this.drawEntryExit();
    this.applyWeather();
    this.escaped = 0;
    this.killed = 0;
    this.coins = (this.level.startCoins ?? 100) + trophyBonus();
    this.visitors = [];
    this.projectiles = [];
    this.towers = [];
    this.suns = [];
    this.mowers = [];
    this.gameOver = false;
    this._coinMultiplier = 1;

    this.lavaMeter = new LavaMeter(this, { x: 30, y: 130, height: 450 });

    this.coinsText = this.add.text(20, 16, "¢ " + this.coins, {
      fontFamily: "Fredoka, system-ui",
      fontSize: "28px",
      fontStyle: "bold",
      color: "#ffd23f",
      stroke: "#000",
      strokeThickness: 5,
    });
    this.scoreText = this.add.text(20, 56, "Échappés : 0", {
      fontFamily: "Fredoka, system-ui",
      fontSize: "18px",
      color: "#ffaaaa",
      stroke: "#000",
      strokeThickness: 4,
    });
    this.killText = this.add.text(20, 82, "Tués : 0", {
      fontFamily: "Fredoka, system-ui",
      fontSize: "18px",
      color: "#90ff90",
      stroke: "#000",
      strokeThickness: 4,
    });
    this.tickets = 0;
    this.ticketsText = this.add.text(20, 108, "🎫 0", {
      fontFamily: "Fredoka, system-ui",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#ff66cc",
      stroke: "#000",
      strokeThickness: 4,
    });
    this.levelTitleText = this.add.text(width / 2, 16, "Niveau " + this.level.id + " — " + this.level.name, {
      fontFamily: "Fredoka, system-ui",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#fff",
      stroke: "#000",
      strokeThickness: 4,
    }).setOrigin(0.5, 0);
    this.waveStatusText = this.add.text(width / 2, 44, "Préparation…", {
      fontFamily: "Fredoka, system-ui",
      fontSize: "14px",
      color: "#ffd23f",
    }).setOrigin(0.5, 0);

    this.events.on("visitor-escaped", () => {
      this.escaped++;
      this.scoreText.setText("Échappés : " + this.escaped);
      this.lavaMeter.addEscape();
      Audio.hit();
    });
    this.events.on("visitor-killed", () => {
      this.killed++;
      this.killText.setText("Tués : " + this.killed);
      this.lavaMeter.addKill();
      Audio.kill();
      const newly = bumpKills(1);
      if (newly && newly.length) this._popTrophies(newly);
    });

    this.events.on("sun-collected", (amount) => {
      const mult = this.lavaMeter?.coinMultiplier ?? 1;
      this.coins += Math.round(amount * mult);
      this.refreshCoinsText();
      Audio.coin();
      Flash.hud(this.coinsText, 0xffd23f, 250);
    });

    this.events.on("lava-erupt", ({ row }) => {
      this._handleLavaErupt(row);
    });

    this.events.on("lava-overflow", () => {
      this.endLevel(false);
    });

    this.events.on("mower-fired", () => {
      Audio.explode?.() || Audio.hit();
    });

    this.events.on("tower-disabled", ({ tower, untilMs }) => {
      if (!tower || !tower.active) return;
      tower._disabledUntil = untilMs;
      tower.setAlpha(0.45);
      this.time.delayedCall(Math.max(0, untilMs - this.time.now), () => {
        if (tower && tower.active) tower.setAlpha(1);
      });
    });

    this.events.on("coins-refund", (amount) => {
      if (!amount || amount <= 0) return;
      this.coins += amount;
      this.refreshCoinsText();
      Flash.hud(this.coinsText, 0xff66cc, 280);
    });

    this.events.on("ticket-collected", () => {
      this.tickets = (this.tickets || 0) + 1;
      this.ticketsText?.setText("🎫 " + this.tickets);
      Flash.hud(this.ticketsText, 0xffaaee, 280);
      Audio.gold?.() || Audio.coin();
      const newly = bumpTickets(1);
      if (newly && newly.length) this._popTrophies(newly);
    });

    this.events.on("update", (time, delta) => {
      this.visitors = this.visitors.filter((v) => v.active);
      this.projectiles = this.projectiles.filter((p) => p.active);
      this.towers = this.towers.filter((t) => t.active);
      this.suns = this.suns.filter((s) => s.active);
      this.mowers = this.mowers.filter((m) => m.active);
      this.checkProjectileHits();
      this.updateBlockers(time, delta);
      this.checkMowerTriggers();
      if (this.waveManager && !this.gameOver) {
        this.waveManager.tick(time);
        this.refreshWaveStatus(time);
        this.checkEndCondition();
      }
    });

    this.events.on("tile-destroyed", (tile) => {
      if (tile && tile.active) Flash.entity(tile, 0xff4444, 200);
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
    this.conveyorMode = this.level.mode === "conveyor";
    if (this.conveyorMode) {
      this.toolbar = new ConveyorBelt(this, {
        allowedTiles: this.level.allowedTiles || [],
        spawnIntervalMs: this.level.conveyorIntervalMs ?? 3500,
        onSelect: (def) => this.setPlacement(def),
      });
      this.coinsText.setVisible(false);
    } else {
      this.toolbar = new Toolbar(
        this,
        height - 100,
        (def) => this.setPlacement(def),
        () => this.coins,
        this.level.allowedTiles,
      );
    }

    this.input.on("pointermove", (p) => { this.updateGhost(p); this._updateTileHoverInfo(p); });
    this.input.on("pointerdown", (p) => this.tryPlace(p));

    for (let r = 0; r < GRID.rows; r++) {
      const mx = leftEdgeX() - 60;
      const my = rowToY(r);
      const mower = new LawnMower(this, mx, my, { row: r });
      this.mowers.push(mower);
    }

    this.waveManager = new WaveManager(this, this.level);
    this.waveManager.start();

    this._setupPauseMenu();
    this._showLevelIntro();
    this.p2 = new Player2Cursor(this, {
      onPlace: ({ x, y }) => this.tryPlace({ x, y }),
    });

    this.skySunsTimer = this.time.addEvent({
      delay: 11000 + Math.random() * 4000,
      loop: true,
      callback: () => {
        if (!this.scene.isActive() || this.gameOver) return;
        const sx = GRID.originX + 60 + Math.random() * (GRID.cols * GRID.cellSize - 120);
        const targetY = GRID.originY + 40 + Math.random() * (GRID.rows * GRID.cellSize - 80);
        const sun = new Sun(this, sx, -20, {
          amount: 25,
          driftToY: targetY,
          lifetimeMs: 12000,
          autoCollectAt: 8000,
        });
        this.suns.push(sun);
      },
    });

    if (!this.conveyorMode) {
      this._chestsSpawned = 0;
      this.time.addEvent({
        delay: 38000 + Math.random() * 12000,
        loop: true,
        callback: () => {
          if (!this.scene.isActive() || this.gameOver) return;
          if (this._chestsSpawned >= 3) return;
          this._chestsSpawned++;
          const col = 4 + Math.floor(Math.random() * 7);
          const row = Math.floor(Math.random() * GRID.rows);
          const { x, y } = cellToPixel(col, row);
          new TreasureChest(this, x, y);
        },
      });
    }

    Audio.resume();
    MusicManager.play("calm");

    this._lastMusicCheck = 0;
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (!this.scene.isActive() || this.gameOver || !this.waveManager) return;
        if (this.waveManager.allSpawned && this.visitors.length >= 5) {
          MusicManager.play("intense");
        } else if (MusicManager.currentTrack === "intense" && this.visitors.length < 5) {
          MusicManager.play("calm");
        }
      },
    });

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
          text: "Bienvenue à Milan Park Defense ! Place une Coin Generator pour gagner des pièces régulièrement.",
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
    if (world === 6) {
      for (let i = 0; i < 60; i++) {
        const sx = Math.random() * w;
        const sy = Math.random() * (GRID.originY - 10);
        const star = this.add.circle(sx, sy, Math.random() * 1.4 + 0.4, [0xff66ff, 0x66ddff, 0xffffff, 0xffaaee][i % 4], 0.85);
        this.tweens.add({ targets: star, alpha: { from: 0.2, to: 1 }, duration: 700 + Math.random() * 1500, yoyo: true, repeat: -1 });
      }
      for (let i = 0; i < 4; i++) {
        const aurX = (i * 350 + 100) % w;
        const aur = this.add.ellipse(aurX, 50 + (i * 13) % 40, 200, 60, [0xff66ff, 0x66ddff][i % 2], 0.18);
        this.tweens.add({ targets: aur, x: aur.x + 1280, duration: 35000 + i * 6000, repeat: -1 });
      }
      for (let i = 0; i < 5; i++) {
        const beam = this.add.rectangle(Math.random() * w, GRID.originY / 2, 4, GRID.originY, [0xff66ff, 0x66ddff][i % 2], 0.25);
        this.tweens.add({ targets: beam, alpha: { from: 0.05, to: 0.4 }, duration: 1200 + Math.random() * 800, yoyo: true, repeat: -1 });
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
    } else if (w === "magic") {
      this.time.addEvent({
        delay: 200, loop: true,
        callback: () => {
          if (!this.scene.isActive() || this.gameOver) return;
          const sx = Math.random() * this.scale.width;
          const sy = -10;
          const colors = [0xff66ff, 0x66ddff, 0xffaaee, 0xaa88ff];
          const c = colors[Math.floor(Math.random() * colors.length)];
          const sparkle = this.add.circle(sx, sy, 1.5 + Math.random() * 1.5, c, 0.9).setDepth(45);
          const drift = (Math.random() - 0.5) * 200;
          this.tweens.add({
            targets: sparkle,
            y: this.scale.height + 20,
            x: sx + drift,
            alpha: { from: 0.9, to: 0 },
            scale: { from: 1, to: 0.4 },
            duration: 4500 + Math.random() * 2500,
            ease: "Sine.in",
            onComplete: () => sparkle.destroy(),
          });
        },
      });
    }
  }

  showWaveBanner(text, color) {
    const w = this.scale.width;
    const stripe = this.add.rectangle(w / 2, 200, w, 90, 0x000000, 0.55).setDepth(69);
    stripe.scaleX = 0;
    this.tweens.add({ targets: stripe, scaleX: 1, duration: 250, ease: "Cubic.out" });
    const t = this.add.text(w / 2, 200, text, {
      fontFamily: "Fredoka, system-ui",
      fontSize: "56px",
      fontStyle: "bold",
      color,
      stroke: "#000",
      strokeThickness: 10,
    }).setOrigin(0.5).setDepth(70).setScale(0);
    this.tweens.add({
      targets: t, scale: 1, duration: 350, ease: "Back.out",
    });
    for (let i = 0; i < 20; i++) {
      const px = Math.random() * w;
      const part = this.add.circle(px, 200, 2 + Math.random() * 2, color, 0.85).setDepth(70);
      this.tweens.add({
        targets: part, y: part.y + (Math.random() - 0.5) * 100,
        x: part.x + (Math.random() - 0.5) * 200,
        alpha: 0, duration: 800, ease: "Cubic.out",
        onComplete: () => part.destroy(),
      });
    }
    this.tweens.add({
      targets: t, alpha: 0, duration: 600, delay: 1400,
      onComplete: () => t.destroy(),
    });
    this.tweens.add({
      targets: stripe, alpha: 0, duration: 600, delay: 1400,
      onComplete: () => stripe.destroy(),
    });
  }

  showDamageNumber(x, y, dmg, color = "#ffeebb") {
    const d = this.add.text(x, y, "-" + dmg, {
      fontFamily: "Fredoka, system-ui",
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
      fontFamily: "Fredoka, system-ui",
      fontSize: "14px",
      color: "#fff",
      stroke: "#000",
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.add.text(right + 40, GRID.originY - 20, "ENTRÉE", {
      fontFamily: "Fredoka, system-ui",
      fontSize: "14px",
      color: "#fff",
      stroke: "#000",
      strokeThickness: 3,
    }).setOrigin(0.5);
  }

  _updateTileHoverInfo(pointer) {
    if (this.placementDef) { this._hideTileHoverInfo(); return; }
    const cell = pixelToCell(pointer.x, pointer.y);
    if (!cell) { this._hideTileHoverInfo(); return; }
    const tile = this.gridState[cell.row]?.[cell.col];
    if (!tile || tile._dying) { this._hideTileHoverInfo(); return; }
    if (this._hoveredTile === tile) {
      this._hoverInfo?.setPosition(tile.x, tile.y - 60);
      return;
    }
    this._hideTileHoverInfo();
    this._hoveredTile = tile;
    const NAMES = { LavaTower: "Lava Tower", CoinGenerator: "Coin Gen", WaterBlock: "Water Block", Fan: "Ventilateur", MagnetBomb: "Magnet Bomb", Catapult: "Catapulte", FrostTramp: "Frost Tramp", Portal: "Portail", Tamer: "Dompteur", CottonCandy: "Barbe-à-Papa", Mine: "Mine", NeonLamp: "Néon" };
    const name = NAMES[tile.constructor.name] || tile.constructor.name;
    const hp = tile.hp ?? tile._hp;
    const lines = [name];
    if (typeof hp === "number") lines.push("HP : " + Math.ceil(hp));
    lines.push("Pelle : " + Math.floor(({ LavaTower: 50, CoinGenerator: 25, WaterBlock: 25, Fan: 62, MagnetBomb: 137, Catapult: 87, FrostTramp: 112, Portal: 150, Tamer: 200, CottonCandy: 37, Mine: 50, NeonLamp: 100 }[tile.constructor.name] || 0)) + "¢");
    const tip = this.add.container(tile.x, tile.y - 60).setDepth(120);
    const txt = this.add.text(0, 0, lines.join("\n"), { fontFamily: "Fredoka, system-ui", fontSize: "11px", color: "#ffeebb", align: "center", stroke: "#000", strokeThickness: 3 }).setOrigin(0.5);
    const w = txt.width + 14;
    const h = txt.height + 8;
    const bg = this.add.rectangle(0, 0, w, h, 0x000, 0.8).setStrokeStyle(1, 0xffd23f);
    tip.add([bg, txt]);
    tip.setAlpha(0);
    this.tweens.add({ targets: tip, alpha: 1, duration: 120 });
    this._hoverInfo = tip;
  }

  _hideTileHoverInfo() {
    if (this._hoverInfo) { this._hoverInfo.destroy(); this._hoverInfo = null; }
    this._hoveredTile = null;
  }

  setPlacement(def) {
    this.placementDef = def;
    if (this.ghost) { this.ghost.destroy(); this.ghost = null; }
    if (this.rangeIndicator) { this.rangeIndicator.destroy(); this.rangeIndicator = null; }
    if (def) {
      this.ghost = this.add.rectangle(0, 0, 84, 84, def.color, 0.4)
        .setStrokeStyle(3, def.accent)
        .setVisible(false)
        .setDepth(40);
      this.rangeIndicator = this.add.graphics().setDepth(39).setVisible(false);
      const p = this.input?.activePointer;
      if (p) this.updateGhost(p);
    }
  }

  updateGhost(pointer) {
    if (!this.ghost) return;
    const cell = pixelToCell(pointer.x, pointer.y);
    if (!cell) {
      this.ghost.setVisible(false);
      this.rangeIndicator?.setVisible(false);
      return;
    }
    const { x, y } = cellToPixel(cell.col, cell.row);
    this.ghost.setPosition(x, y);
    const ok = isEmpty(this.gridState, cell.col, cell.row);
    this.ghost.setFillStyle(ok ? this.placementDef.color : 0xff2222, ok ? 0.45 : 0.6);
    this.ghost.setVisible(true);
    this._drawRangeIndicator(this.placementDef.id, x, y, cell);
  }

  _drawRangeIndicator(id, x, y, cell) {
    if (!this.rangeIndicator) return;
    const g = this.rangeIndicator;
    g.clear();
    const color = this.placementDef?.accent ?? 0xffd23f;
    const cellSize = 90;
    if (id === "lava" || id === "neon" || id === "tamer" || id === "portal" || id === "catapult") {
      const fromX = x + cellSize / 2;
      const toX = 100 + 12 * cellSize;
      g.fillStyle(color, 0.12);
      g.fillRect(fromX, y - 38, toX - fromX, 76);
      g.lineStyle(2, color, 0.5);
      g.strokeRect(fromX, y - 38, toX - fromX, 76);
    } else if (id === "fan") {
      const toX = 100;
      g.fillStyle(color, 0.12);
      g.fillRect(toX, y - 38, x - cellSize / 2 - toX, 76);
      g.lineStyle(2, color, 0.5);
      g.strokeRect(toX, y - 38, x - cellSize / 2 - toX, 76);
    } else if (id === "frost") {
      g.fillStyle(color, 0.15);
      g.fillRect(x - cellSize, y - cellSize, cellSize * 3, cellSize * 3);
      g.lineStyle(2, color, 0.55);
      g.strokeRect(x - cellSize, y - cellSize, cellSize * 3, cellSize * 3);
    } else if (id === "magnet") {
      g.fillStyle(color, 0.13);
      g.fillCircle(x, y, 130);
      g.lineStyle(2, color, 0.55);
      g.strokeCircle(x, y, 130);
    } else if (id === "mine") {
      g.fillStyle(color, 0.13);
      g.fillCircle(x, y, 70);
      g.lineStyle(2, color, 0.55);
      g.strokeCircle(x, y, 70);
    } else if (id === "cottoncandy") {
      g.fillStyle(color, 0.12);
      g.fillCircle(x, y, 110);
      g.lineStyle(2, color, 0.5);
      g.strokeCircle(x, y, 110);
    }
    g.setVisible(true);
  }

  tryPlace(pointer) {
    if (!this.placementDef) return;
    if (this._conveyorClickAt && this.time.now - this._conveyorClickAt < 50) return;
    const cell = pixelToCell(pointer.x, pointer.y);
    if (!cell) return;
    if (this.placementDef.removeMode) {
      this.tryRemove(cell);
      return;
    }
    if (!isEmpty(this.gridState, cell.col, cell.row)) return;
    if (!this.conveyorMode && this.coins < this.placementDef.cost) return;
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
    } else if (this.placementDef.id === "tamer") {
      entity = new Tamer(this, x, y);
    } else if (this.placementDef.id === "cottoncandy") {
      entity = new CottonCandy(this, x, y);
    } else if (this.placementDef.id === "mine") {
      entity = new Mine(this, x, y);
    } else if (this.placementDef.id === "neon") {
      entity = new NeonLamp(this, x, y);
    } else if (this.placementDef.id === "laser") {
      entity = new Laser(this, x, y);
    } else if (this.placementDef.id === "bulle") {
      entity = new Bulle(this, x, y);
    }
    if (!entity) return;
    this.towers.push(entity);
    setCell(this.gridState, cell.col, cell.row, entity);
    if (this.conveyorMode) {
      this.toolbar.consumeSelected?.();
    } else {
      this.coins -= this.placementDef.cost;
      this.refreshCoinsText();
    }
    Audio.place();

    entity.setScale(0.3);
    entity.alpha = 0.6;
    this.tweens.add({
      targets: entity,
      scale: 1,
      alpha: 1,
      duration: 280,
      ease: "Back.out",
    });
    Particles.burst(this, x, y + 20, 8, (i, a) => {
      Particles.spawnCircle(this, x, y + 20, {
        radius: 3 + Math.random() * 3, color: 0xc8b08a, alpha: 0.7, depth: 7,
        tween: {
          x: x + Math.cos(a) * (30 + Math.random() * 20),
          y: y + 20 + Math.sin(a) * 10 - 10 - Math.random() * 10,
          alpha: 0, duration: 450, ease: "Cubic.out",
        },
      });
    });
    const ring = this.add.circle(x, y, 50, 0, 0).setStrokeStyle(2, this.placementDef.accent || 0xffe066, 0.8).setDepth(9);
    this.tweens.add({
      targets: ring,
      scale: 0.4,
      alpha: 0,
      duration: 350,
      onComplete: () => ring.destroy(),
    });

    this.toolbar.triggerCooldown(this.placementDef.id);
    this.toolbar.clearSelection();
    this.setPlacement(null);
  }

  refreshCoinsText() {
    this.coinsText.setText("¢ " + this.coins);
  }

  tryRemove(cell) {
    const t = this.gridState[cell.row][cell.col];
    if (!t || t._dying) return;
    let refund = 0;
    const tileMap = { LavaTower: 100, CoinGenerator: 50, WaterBlock: 50, Fan: 125, MagnetBomb: 275, Catapult: 175, FrostTramp: 225, Portal: 300, Tamer: 400, CottonCandy: 75, Mine: 100, NeonLamp: 200, Laser: 250, Bulle: 200 };
    refund = Math.floor((tileMap[t.constructor.name] || 0) / 2);
    this.gridState[cell.row][cell.col] = null;
    this.coins += refund;
    this.refreshCoinsText();
    if (refund > 0) {
      const ping = this.add.text(t.x, t.y - 30, "+" + refund + "¢", {
        fontFamily: "Fredoka, system-ui",
        fontSize: "18px",
        fontStyle: "bold",
        color: "#ffd23f",
        stroke: "#000",
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(40);
      this.tweens.add({
        targets: ping, y: ping.y - 30, alpha: 0, duration: 700,
        onComplete: () => ping.destroy(),
      });
    }
    Audio.click?.();
    Particles.burst(this, t.x, t.y, 6, (i, a) => {
      Particles.spawnCircle(this, t.x, t.y, {
        radius: 3, color: 0xc8b08a, alpha: 0.7, depth: 20,
        tween: { x: t.x + Math.cos(a) * 30, y: t.y + Math.sin(a) * 30, alpha: 0, duration: 350 },
      });
    });
    this.tweens.add({
      targets: t, alpha: 0, scale: 0.4, duration: 250,
      onComplete: () => t.destroy(),
    });
    this.toolbar.clearSelection();
    this.setPlacement(null);
  }

  checkMowerTriggers() {
    for (const v of this.visitors) {
      if (!v.active || v._dying || v._mowerTriggered) continue;
      if (v.x < leftEdgeX()) {
        const mower = this.mowers.find((m) => m.row === v.row && !m.activated && !m._dead);
        if (mower) {
          v._mowerTriggered = true;
          mower.activate();
        }
      }
    }
  }

  updateBlockers(time, delta) {
    const dtSec = delta / 1000;
    for (const v of this.visitors) {
      if (!v.active || v._dying) continue;
      if (v.canFly) { v.blocked = false; continue; }
      if (v.walksOnWater) { v.blocked = false; continue; }
      if (v._jumpUntil && time < v._jumpUntil) { v.blocked = false; continue; }
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

  spawnVisitor(row, type = "basic", opts = {}) {
    const y = rowToY(row);
    const x = rightEdgeX() + 50;
    const v = new Visitor(this, x, y, { type, ...opts });
    v.row = row;
    this.visitors.push(v);
  }

  refreshWaveStatus(time) {
    if (this.waveManager.infinite) {
      const next = this.waveManager.nextWaveAtMs(time);
      const wave = this.waveManager.endlessWave;
      this.waveStatusText.setText(
        "Vague " + wave + " — alive " + this.visitors.length + " — kills " + this.killed +
          (next > 100 ? " — next " + Math.ceil(next / 1000) + "s" : "")
      );
      return;
    }
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
    if (this.waveManager.infinite) return;
    if (this.waveManager.allSpawned && this.visitors.length === 0) {
      this.endLevel(true);
    }
  }

  endLevel(win) {
    this.gameOver = true;
    if (this.tutorial) this.tutorial.cleanup();
    const isEndless = !!this.waveManager?.infinite;
    const stars = win ? computeStars(this.level, this.escaped) : 0;
    if (this.isDaily) {
      const newly = recordDaily(stars, this.killed, this.escaped);
      if (newly && newly.length) this._popTrophies(newly);
    }
    if (win) Audio.win(); else Audio.lose();
    this.time.delayedCall(600, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("LevelResultScene", {
          win,
          stars,
          killed: this.killed,
          escaped: this.escaped,
          coins: this.coins,
          levelId: this.level.id,
          levelName: this.level.name,
          endless: isEndless,
          endlessWave: this.waveManager?.endlessWave ?? 0,
        });
        this.scene.stop();
      });
    });
  }

  _showLevelIntro() {
    if (this.level.id === "1.1") return;
    const { width, height } = this.scale;
    const card = this.add.container(width / 2, height / 2 - 80).setDepth(150);
    const stripe = this.add.rectangle(0, 0, width, 110, 0x000, 0.7);
    stripe.scaleX = 0;
    const title = this.add.text(0, -16, "NIVEAU " + this.level.id, {
      fontFamily: "Fredoka, system-ui", fontSize: "20px", fontStyle: "bold", color: "#ffd23f", stroke: "#000", strokeThickness: 3,
    }).setOrigin(0.5);
    const name = this.add.text(0, 16, this.level.name, {
      fontFamily: "Fredoka, system-ui", fontSize: "32px", fontStyle: "bold", color: "#fff", stroke: "#000", strokeThickness: 5,
    }).setOrigin(0.5);
    const sub = this.add.text(0, 48, (this.level.waves?.length || 0) + " vagues  •  Sortie max " + (this.level.loseEscaped ?? "?"), {
      fontFamily: "Fredoka, system-ui", fontSize: "13px", color: "#ffeebb",
    }).setOrigin(0.5);
    card.add([stripe, title, name, sub]);
    card.setAlpha(0);
    this.tweens.add({ targets: card, alpha: 1, duration: 250 });
    this.tweens.add({ targets: stripe, scaleX: 1, duration: 350, ease: "Cubic.out" });
    this.time.delayedCall(2000, () => {
      this.tweens.add({ targets: card, alpha: 0, duration: 400, onComplete: () => card.destroy() });
    });
  }

  _setupPauseMenu() {
    this.paused = false;
    this.input.keyboard.on("keydown-P", () => this._togglePause());
    this._blurHandler = () => {
      if (!this.gameOver && !this.paused && document.hidden) this._openPauseMenu();
    };
    document.addEventListener("visibilitychange", this._blurHandler);
    this.events.once("shutdown", () => document.removeEventListener("visibilitychange", this._blurHandler));
    this.events.once("destroy", () => document.removeEventListener("visibilitychange", this._blurHandler));
    this.input.keyboard.on("keydown-ESC", () => {
      if (this.placementDef) return;
      this._togglePause();
    });
    this.input.keyboard.on("keydown-R", (e) => {
      if (!e.shiftKey || this.gameOver) return;
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("LevelScene", { levelId: this.level.id });
        this.scene.stop();
      });
    });

    const { width } = this.scale;
    const btn = this.add.container(width - 40, 30).setDepth(60);
    const r = this.add.rectangle(0, 0, 50, 36, 0x222840, 0.85).setStrokeStyle(2, 0xffd23f);
    const t = this.add.text(0, 0, "⏸ P", { fontFamily: "Fredoka, system-ui", fontSize: "14px", fontStyle: "bold", color: "#ffd23f" }).setOrigin(0.5);
    btn.add([r, t]);
    btn.setSize(50, 36);
    btn.setInteractive(new Phaser.Geom.Rectangle(-25, -18, 50, 36), Phaser.Geom.Rectangle.Contains);
    btn.on("pointerover", () => r.setFillStyle(0x33405a, 0.95));
    btn.on("pointerout", () => r.setFillStyle(0x222840, 0.85));
    btn.on("pointerdown", () => this._togglePause());

    this._setupMuteButton();
  }

  _setupMuteButton() {
    const { width } = this.scale;
    const save = loadSave();
    let muted = !!save.settings?.muted;

    const btn = this.add.container(width - 100, 30).setDepth(60);
    const r = this.add.rectangle(0, 0, 50, 36, 0x222840, 0.85).setStrokeStyle(2, 0x88ccff);
    const t = this.add.text(0, 0, muted ? "🔇" : "🔊", { fontFamily: "Fredoka, system-ui", fontSize: "16px" }).setOrigin(0.5);
    btn.add([r, t]);
    btn.setSize(50, 36);
    btn.setInteractive(new Phaser.Geom.Rectangle(-25, -18, 50, 36), Phaser.Geom.Rectangle.Contains);
    btn.on("pointerover", () => r.setFillStyle(0x33405a, 0.95));
    btn.on("pointerout", () => r.setFillStyle(0x222840, 0.85));
    btn.on("pointerdown", () => {
      muted = !muted;
      t.setText(muted ? "🔇" : "🔊");
      const s = loadSave();
      s.settings = s.settings || {};
      s.settings.muted = muted;
      saveSave(s);
      Audio.setVolume?.(muted ? 0 : 1);
      MusicManager.setVolume?.(muted ? 0 : (s.settings.volume ?? 0.5));
    });
  }

  _togglePause() {
    if (this.gameOver) return;
    if (this.paused) {
      this._closePauseMenu();
    } else {
      this._openPauseMenu();
    }
  }

  _openPauseMenu() {
    this.paused = true;
    this.physics?.world?.pause?.();
    this.tweens.pauseAll();
    this.time.paused = true;

    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000, 0.65).setDepth(200).setInteractive();
    const card = this.add.container(width / 2, height / 2).setDepth(201);
    const bg = this.add.rectangle(0, 0, 360, 280, 0x1a1a2a, 0.95).setStrokeStyle(3, 0xffd23f);
    const title = this.add.text(0, -110, "⏸  EN PAUSE", { fontFamily: "Fredoka, system-ui", fontSize: "28px", fontStyle: "bold", color: "#ffd23f", stroke: "#000", strokeThickness: 4 }).setOrigin(0.5);
    card.add([bg, title]);

    const items = [
      { label: "▶ Reprendre", color: 0x4ed8a3, action: () => this._closePauseMenu() },
      { label: "↻ Recommencer", color: 0x88c8e8, action: () => {
          this._closePauseMenu();
          this.cameras.main.fadeOut(250, 0, 0, 0);
          this.cameras.main.once("camerafadeoutcomplete", () => {
            this.scene.start("LevelScene", { levelId: this.level.id });
            this.scene.stop();
          });
        } },
      { label: "✕ Quitter", color: 0xff6644, action: () => {
          this._closePauseMenu();
          this.cameras.main.fadeOut(250, 0, 0, 0);
          this.cameras.main.once("camerafadeoutcomplete", () => {
            this.scene.start("CampaignMenuScene");
            this.scene.stop();
          });
        } },
    ];

    items.forEach((it, i) => {
      const y = -40 + i * 56;
      const btn = this.add.container(0, y);
      const r = this.add.rectangle(0, 0, 280, 44, 0x222840).setStrokeStyle(2, it.color);
      const lbl = this.add.text(0, 0, it.label, { fontFamily: "Fredoka, system-ui", fontSize: "18px", fontStyle: "bold", color: "#fff" }).setOrigin(0.5);
      btn.add([r, lbl]);
      btn.setSize(280, 44);
      btn.setInteractive(new Phaser.Geom.Rectangle(-140, -22, 280, 44), Phaser.Geom.Rectangle.Contains);
      btn.on("pointerover", () => { r.setFillStyle(0x33405a); Audio.ui?.(); });
      btn.on("pointerout", () => { r.setFillStyle(0x222840); });
      btn.on("pointerdown", () => { Audio.click?.(); it.action(); });
      card.add(btn);
    });

    const hint = this.add.text(0, 110, "[P] pour reprendre", { fontFamily: "Fredoka, system-ui", fontSize: "12px", color: "#aaa" }).setOrigin(0.5);
    card.add(hint);

    this._pauseMenu = { overlay, card };
  }

  _closePauseMenu() {
    if (!this._pauseMenu) return;
    this._pauseMenu.overlay.destroy();
    this._pauseMenu.card.destroy();
    this._pauseMenu = null;
    this.paused = false;
    this.physics?.world?.resume?.();
    this.tweens.resumeAll();
    this.time.paused = false;
  }

  _popTrophies(newly) {
    if (!newly || !newly.length) return;
    const baseY = 80;
    newly.forEach((t, i) => {
      this.time.delayedCall(i * 250, () => {
        const x = this.scale.width - 20;
        const y = baseY + i * 76;
        const card = this.add.container(x + 320, y).setDepth(120);
        const bg = this.add.rectangle(0, 0, 300, 64, 0x2a1a3a, 0.95).setStrokeStyle(2, 0xffd23f).setOrigin(1, 0.5);
        const emoji = this.add.text(-280, 0, t.emoji, { fontFamily: "Fredoka, system-ui", fontSize: "32px" }).setOrigin(0.5);
        const title = this.add.text(-260, -10, "🏆 " + t.name, { fontFamily: "Fredoka, system-ui", fontSize: "14px", fontStyle: "bold", color: "#ffd23f" });
        const sub = this.add.text(-260, 8, "+5¢ start permanent", { fontFamily: "Fredoka, system-ui", fontSize: "11px", color: "#90ff90" });
        card.add([bg, emoji, title, sub]);
        Audio.win?.();
        this.tweens.add({ targets: card, x: x, duration: 400, ease: "Back.out" });
        this.time.delayedCall(2800, () => {
          this.tweens.add({
            targets: card, x: x + 320, alpha: 0, duration: 350, ease: "Cubic.in",
            onComplete: () => card.destroy(),
          });
        });
      });
    });
  }

  _handleLavaErupt(row) {
    const duration = 5000;
    const dmgPerSec = 5;
    const affectedTiles = [];

    for (let c = 0; c < GRID.cols; c++) {
      const tile = this.gridState[row][c];
      if (!tile || tile._dying) continue;
      if (tile.constructor.name === "WaterBlock") continue;
      affectedTiles.push(tile);
    }

    const laneX = GRID.originX + (GRID.cols * GRID.cellSize) / 2;
    const laneY = rowToY(row);
    const laneW = GRID.cols * GRID.cellSize;

    for (let i = 0; i < 18; i++) {
      const fx = GRID.originX + Math.random() * laneW;
      const flame = this.add.triangle(fx, laneY, 0, 10, 5, -12, 10, 10, 0xff4400, 0.75).setDepth(30);
      this.tweens.add({
        targets: flame,
        scale: { from: 0.6, to: 1.4 },
        y: laneY - 10 - Math.random() * 20,
        alpha: 0,
        duration: 600 + Math.random() * 400,
        yoyo: false,
        repeat: Math.floor(duration / 600),
        ease: "Sine.inOut",
        onComplete: () => flame.destroy(),
      });
    }

    const startMs = this.time.now;
    const ticker = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        const elapsed = this.time.now - startMs;
        if (elapsed >= duration) { ticker.remove(); return; }
        const dtSec = 0.1;
        for (const tile of affectedTiles) {
          if (!tile.active || tile._dying) continue;
          if (typeof tile.takeDamage === "function") {
            tile.takeDamage(dmgPerSec * dtSec);
          }
        }
      },
    });

    this.showWaveBanner("ERUPTION !", "#ff4400");
  }

  checkProjectileHits() {
    const now = this.time.now;
    for (const proj of this.projectiles) {
      if (!proj.active || proj._dead) continue;
      for (const v of this.visitors) {
        if (!v.active || v._dying) continue;
        if (v._jumpUntil && now < v._jumpUntil) continue;
        if (Math.abs(proj.y - v.y) > 36) continue;
        if (Math.abs(proj.x - v.x) > 18) continue;
        proj.hit(v);
        break;
      }
    }
  }
}

import * as Phaser from "phaser";
import { Audio } from "../systems/Audio.js";
import { bumpTickets } from "../systems/Trophies.js";
import { loadSave, saveSave } from "../systems/SaveSystem.js";
import { makeClickable } from "../ui/Clickable.js";

export class FairgroundScene extends Phaser.Scene {
  constructor() {
    super("FairgroundScene");
  }

  init(data) {
    this.gameType = data?.gameType || "chamboule";
    this.score = 0;
    this.timeLeftMs = 0;
    this.gameOver = false;
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(300, 0, 0, 0);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a4a, 0x1a0a4a, 0x4a2a6a, 0x4a2a6a, 1);
    bg.fillRect(0, 0, width, height);

    this.scoreText = this.add.text(width / 2, 30, "Score : 0", {
      fontFamily: "Bangers, Fredoka, system-ui",
      fontSize: "32px",
      color: "#ffd23f",
      stroke: "#000",
      strokeThickness: 5,
    }).setOrigin(0.5, 0).setDepth(100);

    this.timerText = this.add.text(width - 30, 30, "", {
      fontFamily: "Bangers, Fredoka, system-ui",
      fontSize: "28px",
      color: "#ff8888",
      stroke: "#000",
      strokeThickness: 4,
    }).setOrigin(1, 0).setDepth(100);

    this.input.keyboard.once("keydown-ESC", () => this._endGame());

    if (this.gameType === "chamboule") this._createChamboule();
    else if (this.gameType === "pigeon") this._createPigeon();
    else if (this.gameType === "wheel") this._createWheel();
    else if (this.gameType === "pancake") this._createPancake();
    else if (this.gameType === "bumper") this._createBumper();
  }

  _setTimer(ms) {
    this.timeLeftMs = ms;
    this._tickHandler = (time, delta) => {
      if (this.gameOver) return;
      this.timeLeftMs -= delta;
      if (this.timeLeftMs <= 0) { this.timeLeftMs = 0; this._endGame(); }
      this.timerText.setText(Math.ceil(this.timeLeftMs / 1000) + "s");
    };
    this.events.on("update", this._tickHandler);
  }

  _addScore(n) {
    this.score += n;
    this.scoreText.setText("Score : " + this.score);
    this.tweens.add({ targets: this.scoreText, scale: { from: 1.3, to: 1 }, duration: 200, ease: "Cubic.out" });
    Audio.coin?.();
  }

  _endGame() {
    if (this.gameOver) return;
    this.gameOver = true;
    if (this._tickHandler) this.events.off("update", this._tickHandler);

    const reward = Math.floor(this.score / 5);
    if (reward > 0) {
      const newly = bumpTickets(reward);
      const save = loadSave();
      save.totalTickets = (save.totalTickets || 0);
      saveSave(save);
    }

    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000, 0.85).setDepth(150);
    const card = this.add.container(width / 2, height / 2).setDepth(151);
    const bg = this.add.rectangle(0, 0, 460, 320, 0x1a1a2a, 0.95).setStrokeStyle(3, 0xffd23f);
    const title = this.add.text(0, -110, "TERMINÉ !", {
      fontFamily: "Bangers, Fredoka, system-ui",
      fontSize: "60px",
      color: "#ffd23f",
      stroke: "#000",
      strokeThickness: 6,
    }).setOrigin(0.5);
    const scoreT = this.add.text(0, -30, "Score : " + this.score, {
      fontFamily: "Fredoka, system-ui",
      fontSize: "26px",
      fontStyle: "bold",
      color: "#fff",
    }).setOrigin(0.5);
    const rewardT = this.add.text(0, 10, reward > 0 ? "🎫 +" + reward + " tickets" : "Pas de récompense cette fois", {
      fontFamily: "Fredoka, system-ui",
      fontSize: "20px",
      color: reward > 0 ? "#ff66cc" : "#aaa",
    }).setOrigin(0.5);
    card.add([bg, title, scoreT, rewardT]);

    Audio.win?.();

    makeClickable(this, {
      x: width / 2, y: height / 2 + 100, width: 220, height: 50,
      radius: 8, fillColor: 0x4ed8a3, strokeColor: 0x2a8a5a, strokeWidth: 3,
      hoverFill: 0x66e8b0, hoverStroke: 0xffd23f,
      label: "← Retour à la foire",
      labelStyle: { fontFamily: "Fredoka, system-ui", fontSize: "16px", fontStyle: "bold", color: "#fff" },
      depth: 152,
      onClick: () => {
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("FairgroundHubScene");
          this.scene.stop();
        });
      },
    });
  }

  // ========== Chamboule-Tout ==========
  _createChamboule() {
    const { width } = this.scale;
    this.add.text(width / 2, 80, "Clique sur les boîtes pour les renverser !", {
      fontFamily: "Fredoka, system-ui", fontSize: "16px", color: "#ffeebb",
    }).setOrigin(0.5);

    this._setTimer(20000);
    this.cans = [];
    const spawnCan = () => {
      if (this.gameOver) return;
      if (this.cans.filter((c) => c.active).length >= 9) return;
      const x = 200 + Math.random() * 880;
      const y = 200 + Math.random() * 350;
      const can = this.add.container(x, y);
      const body = this.add.rectangle(0, 0, 50, 70, 0xddccaa).setStrokeStyle(2, 0x6a4a2a);
      const stripe = this.add.rectangle(0, 0, 50, 14, 0xc63a3a);
      const eye1 = this.add.circle(-10, -8, 3, 0x000);
      const eye2 = this.add.circle(10, -8, 3, 0x000);
      const mouth = this.add.arc(0, 8, 8, 0, 180, false, 0x000, 0).setStrokeStyle(2, 0x000);
      can.add([body, stripe, eye1, eye2, mouth]);
      can.setInteractive(new Phaser.Geom.Rectangle(-25, -35, 50, 70), Phaser.Geom.Rectangle.Contains);
      can.on("pointerdown", () => {
        if (!can.active) return;
        Audio.kill?.();
        this._addScore(10);
        this.tweens.add({
          targets: can, angle: 90, y: y + 30, alpha: 0, duration: 300, ease: "Cubic.in",
          onComplete: () => can.destroy(),
        });
      });
      this.cans.push(can);
    };
    for (let i = 0; i < 5; i++) spawnCan();
    this._spawnTimer = this.time.addEvent({ delay: 1500, loop: true, callback: spawnCan });
  }

  // ========== Tir au Pigeon ==========
  _createPigeon() {
    const { width, height } = this.scale;
    this.add.text(width / 2, 80, "Clique sur les pigeons en vol !", {
      fontFamily: "Fredoka, system-ui", fontSize: "16px", color: "#ffeebb",
    }).setOrigin(0.5);

    this._setTimer(30000);
    const spawnPigeon = () => {
      if (this.gameOver) return;
      const fromLeft = Math.random() > 0.5;
      const startX = fromLeft ? -40 : width + 40;
      const endX = fromLeft ? width + 40 : -40;
      const y = 150 + Math.random() * 400;
      const p = this.add.container(startX, y);
      const body = this.add.ellipse(0, 0, 36, 22, 0x888);
      const wingL = this.add.triangle(-8, 0, 0, 0, -16, -10, -16, 10, 0xaaaaaa);
      const wingR = this.add.triangle(8, 0, 0, 0, 16, -10, 16, 10, 0xaaaaaa);
      const head = this.add.circle(14, -2, 8, 0x888);
      const eye = this.add.circle(17, -3, 2, 0x000);
      const beak = this.add.triangle(20, 0, 0, 0, 8, -2, 8, 2, 0xffaa00);
      p.add([wingL, wingR, body, head, eye, beak]);
      if (!fromLeft) p.setScale(-1, 1);
      this.tweens.add({ targets: [wingL, wingR], scaleY: { from: 1, to: 0.4 }, duration: 200, yoyo: true, repeat: -1 });
      p.setInteractive(new Phaser.Geom.Rectangle(-20, -12, 40, 24), Phaser.Geom.Rectangle.Contains);
      p.on("pointerdown", () => {
        if (!p.active) return;
        Audio.explode?.();
        this._addScore(15);
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI * 2 * i) / 8;
          const f = this.add.rectangle(p.x, p.y, 3, 6, 0xddd, 0.9);
          this.tweens.add({ targets: f, x: p.x + Math.cos(a) * 40, y: p.y + Math.sin(a) * 40, alpha: 0, duration: 500, onComplete: () => f.destroy() });
        }
        p.destroy();
      });
      this.tweens.add({
        targets: p, x: endX,
        duration: 3000 + Math.random() * 2000,
        onComplete: () => p.destroy(),
      });
    };
    this._spawnTimer = this.time.addEvent({ delay: 900, loop: true, callback: spawnPigeon });
    for (let i = 0; i < 3; i++) this.time.delayedCall(i * 300, spawnPigeon);
  }

  // ========== Roue de la Fortune ==========
  _createWheel() {
    const { width, height } = this.scale;
    this.add.text(width / 2, 100, "Clique pour faire tourner la roue !", {
      fontFamily: "Fredoka, system-ui", fontSize: "16px", color: "#ffeebb",
    }).setOrigin(0.5);

    const cx = width / 2, cy = height / 2 + 30;
    const radius = 200;
    const segments = [
      { color: 0xff4400, value: 5,  label: "5" },
      { color: 0xffd23f, value: 10, label: "10" },
      { color: 0xff66cc, value: 20, label: "20" },
      { color: 0x88ccff, value: 50, label: "50" },
      { color: 0x66ff88, value: 100, label: "100" },
      { color: 0x9a4ad8, value: 30, label: "30" },
      { color: 0xff8844, value: 15, label: "15" },
      { color: 0xffd23f, value: 200, label: "200★" },
    ];
    const wheel = this.add.container(cx, cy);
    const g = this.add.graphics();
    const seg = (Math.PI * 2) / segments.length;
    segments.forEach((s, i) => {
      g.fillStyle(s.color, 1);
      g.slice(0, 0, radius, i * seg, (i + 1) * seg, false);
      g.fillPath();
      g.lineStyle(2, 0x000, 1);
      g.lineBetween(0, 0, Math.cos(i * seg) * radius, Math.sin(i * seg) * radius);
    });
    g.lineStyle(4, 0xffd23f, 1);
    g.strokeCircle(0, 0, radius);
    wheel.add(g);
    segments.forEach((s, i) => {
      const a = i * seg + seg / 2;
      const tx = Math.cos(a) * (radius * 0.7);
      const ty = Math.sin(a) * (radius * 0.7);
      const t = this.add.text(tx, ty, s.label, {
        fontFamily: "Bangers, Fredoka, system-ui", fontSize: "26px", color: "#fff", stroke: "#000", strokeThickness: 5,
      }).setOrigin(0.5);
      wheel.add(t);
    });
    const center = this.add.circle(0, 0, 22, 0x222).setStrokeStyle(3, 0xffd23f);
    wheel.add(center);

    const arrow = this.add.triangle(cx + radius + 16, cy, 0, -16, 0, 16, -28, 0, 0xffd23f).setStrokeStyle(3, 0x000).setDepth(50);

    let spinning = false;
    let segmentsLanded = 0;
    const SPINS = 3;
    const trySpin = () => {
      if (spinning || this.gameOver) return;
      if (segmentsLanded >= SPINS) { this._endGame(); return; }
      spinning = true;
      Audio.click?.();
      const target = Math.random() * Math.PI * 2 + Math.PI * 8;
      const targetAngle = wheel.rotation + target;
      this.tweens.add({
        targets: wheel, rotation: targetAngle, duration: 3000, ease: "Cubic.out",
        onComplete: () => {
          spinning = false;
          segmentsLanded++;
          const ang = ((-wheel.rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          const idx = Math.floor(ang / seg) % segments.length;
          const winSeg = segments[idx];
          this._addScore(winSeg.value);
          this.cameras.main.flash(200, 255, 215, 60);
          this.add.text(cx, cy - 240, "+" + winSeg.value + "!", {
            fontFamily: "Bangers, Fredoka, system-ui", fontSize: "48px", color: "#ffd23f", stroke: "#000", strokeThickness: 6,
          }).setOrigin(0.5);
          if (segmentsLanded >= SPINS) this.time.delayedCall(1500, () => this._endGame());
        },
      });
    };
    this.input.on("pointerdown", trySpin);
    this.input.keyboard.on("keydown-SPACE", trySpin);

    this.add.text(width / 2, height - 80, "Spins restants : " + SPINS, {
      fontFamily: "Fredoka, system-ui", fontSize: "16px", color: "#ffeebb",
    }).setOrigin(0.5);
  }

  // ========== Course de Crêpes ==========
  _createPancake() {
    const { width, height } = this.scale;
    this.add.text(width / 2, 80, "Espace quand le curseur est dans le vert !", {
      fontFamily: "Fredoka, system-ui", fontSize: "16px", color: "#ffeebb",
    }).setOrigin(0.5);

    const trackY = height / 2 + 40;
    const trackW = 700;
    const trackX = (width - trackW) / 2;
    const track = this.add.rectangle(width / 2, trackY, trackW, 50, 0x222840).setStrokeStyle(2, 0x666);
    const greenZone = this.add.rectangle(width / 2, trackY, 90, 46, 0x66ff88, 0.7);
    const yellowL = this.add.rectangle(width / 2 - 75, trackY, 60, 46, 0xffd23f, 0.7);
    const yellowR = this.add.rectangle(width / 2 + 75, trackY, 60, 46, 0xffd23f, 0.7);

    let cursorX = trackX;
    let dir = 1;
    let speed = 6;
    const cursor = this.add.rectangle(cursorX, trackY, 8, 60, 0xffffff).setStrokeStyle(2, 0x000);

    const pan = this.add.text(width / 2, trackY - 90, "🍳", { fontFamily: "system-ui", fontSize: "60px" }).setOrigin(0.5);

    let flips = 0;
    const TOTAL_FLIPS = 8;
    let busy = false;

    const flipCount = this.add.text(width / 2, trackY + 80, "Flip 0 / " + TOTAL_FLIPS, {
      fontFamily: "Fredoka, system-ui", fontSize: "20px", fontStyle: "bold", color: "#ffd23f",
    }).setOrigin(0.5);

    const tryFlip = () => {
      if (busy || this.gameOver) return;
      busy = true;
      const offset = Math.abs(cursorX - width / 2);
      let pts = 0;
      let txt = "";
      let color = "#888";
      if (offset < 45) { pts = 25; txt = "PARFAIT !"; color = "#66ff88"; }
      else if (offset < 105) { pts = 10; txt = "BIEN"; color = "#ffd23f"; }
      else { pts = 0; txt = "RATÉ"; color = "#ff6644"; }
      const fb = this.add.text(width / 2, trackY - 160, txt + (pts > 0 ? "  +" + pts : ""), {
        fontFamily: "Bangers, Fredoka, system-ui", fontSize: "32px", color, stroke: "#000", strokeThickness: 4,
      }).setOrigin(0.5);
      this.tweens.add({ targets: fb, y: fb.y - 30, alpha: 0, duration: 800, onComplete: () => fb.destroy() });
      if (pts > 0) {
        this._addScore(pts);
        this.tweens.add({ targets: pan, angle: 360, y: pan.y - 30, duration: 350, yoyo: true, ease: "Cubic.out", onComplete: () => { pan.angle = 0; busy = false; } });
      } else {
        this.tweens.add({ targets: pan, x: { from: pan.x - 8, to: pan.x + 8 }, duration: 60, yoyo: true, repeat: 3, onComplete: () => { busy = false; } });
      }
      flips++;
      flipCount.setText("Flip " + flips + " / " + TOTAL_FLIPS);
      speed += 0.5;
      if (flips >= TOTAL_FLIPS) this.time.delayedCall(900, () => this._endGame());
    };
    this.input.keyboard.on("keydown-SPACE", tryFlip);
    this.input.on("pointerdown", tryFlip);

    this._tickHandler = () => {
      if (this.gameOver || busy) return;
      cursorX += dir * speed;
      if (cursorX > trackX + trackW) { cursorX = trackX + trackW; dir = -1; }
      else if (cursorX < trackX) { cursorX = trackX; dir = 1; }
      cursor.x = cursorX;
    };
    this.events.on("update", this._tickHandler);
  }

  // ========== Bumper Cars ==========
  _createBumper() {
    const { width, height } = this.scale;
    this.add.text(width / 2, 80, "Esquive avec ← → ↑ ↓ pendant 30 secondes !", {
      fontFamily: "Fredoka, system-ui", fontSize: "16px", color: "#ffeebb",
    }).setOrigin(0.5);

    this._setTimer(30000);

    const arenaY1 = 130, arenaY2 = height - 60;
    this.add.rectangle(width / 2, (arenaY1 + arenaY2) / 2, width - 60, arenaY2 - arenaY1, 0x000, 0.4).setStrokeStyle(3, 0xff66cc);

    const car = this.add.container(width / 2, height - 140);
    const body = this.add.rectangle(0, 0, 40, 28, 0x66ff88).setStrokeStyle(2, 0x2a8a4a);
    const w1 = this.add.circle(-12, 12, 5, 0x000);
    const w2 = this.add.circle(12, 12, 5, 0x000);
    const head = this.add.circle(0, -8, 8, 0xffd2a8);
    car.add([body, w1, w2, head]);

    const obstacles = [];
    const spawnObstacle = () => {
      if (this.gameOver) return;
      const fromLeft = Math.random() > 0.5;
      const sx = fromLeft ? -50 : width + 50;
      const sy = arenaY1 + 50 + Math.random() * (arenaY2 - arenaY1 - 100);
      const dur = 2400 - Math.min(1400, this.score * 80);
      const c = this.add.container(sx, sy);
      const cb = this.add.rectangle(0, 0, 40, 28, 0xff4400).setStrokeStyle(2, 0x880000);
      c.add(cb);
      obstacles.push(c);
      this.tweens.add({
        targets: c, x: fromLeft ? width + 50 : -50, duration: dur,
        onComplete: () => {
          if (c.active) {
            this._addScore(2);
            c.destroy();
          }
        },
      });
    };
    this._spawnTimer = this.time.addEvent({ delay: 700, loop: true, callback: spawnObstacle });

    const keys = { left: false, right: false, up: false, down: false };
    this._keyDown = (e) => {
      if (e.code === "ArrowLeft") keys.left = true;
      if (e.code === "ArrowRight") keys.right = true;
      if (e.code === "ArrowUp") keys.up = true;
      if (e.code === "ArrowDown") keys.down = true;
    };
    this._keyUp = (e) => {
      if (e.code === "ArrowLeft") keys.left = false;
      if (e.code === "ArrowRight") keys.right = false;
      if (e.code === "ArrowUp") keys.up = false;
      if (e.code === "ArrowDown") keys.down = false;
    };
    this.input.keyboard.on("keydown", this._keyDown);
    this.input.keyboard.on("keyup", this._keyUp);

    this.events.on("update", (time, delta) => {
      if (this.gameOver) return;
      const sp = 0.32 * delta;
      if (keys.left) car.x = Math.max(50, car.x - sp);
      if (keys.right) car.x = Math.min(width - 50, car.x + sp);
      if (keys.up) car.y = Math.max(arenaY1 + 30, car.y - sp);
      if (keys.down) car.y = Math.min(arenaY2 - 30, car.y + sp);
      for (const o of obstacles) {
        if (!o.active) continue;
        if (Math.abs(o.x - car.x) < 40 && Math.abs(o.y - car.y) < 28) {
          this.cameras.main.shake(150, 0.01);
          Audio.hit?.();
          this.score = Math.max(0, this.score - 5);
          this.scoreText.setText("Score : " + this.score);
          o.destroy();
          this.tweens.add({ targets: car, x: car.x + (Math.random() - 0.5) * 60, duration: 200, ease: "Back.out" });
        }
      }
    });
  }
}

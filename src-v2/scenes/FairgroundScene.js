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
    else if (this.gameType === "math") this._createMath();
    else if (this.gameType === "trafficlight") this._createTrafficLight();
    else if (this.gameType === "archery") this._createArchery();
    else if (this.gameType === "candysort") this._createCandySort();
    else if (this.gameType === "lavajump") this._createLavaJump();
    else this._createComingSoon();
  }

  _createComingSoon() {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2 - 60, "🚧", {
      fontFamily: "system-ui", fontSize: "120px",
    }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 50, "Bientôt disponible !", {
      fontFamily: "Bangers, Fredoka, system-ui", fontSize: "48px",
      color: "#ffd23f", stroke: "#000", strokeThickness: 6,
    }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 110, "Ce mini-jeu arrive très vite — reviens demain", {
      fontFamily: "Fredoka, system-ui", fontSize: "16px",
      color: "#ffeebb",
    }).setOrigin(0.5);
    this.time.delayedCall(2200, () => {
      if (this.gameOver) return;
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("FairgroundHubScene");
        this.scene.stop();
      });
    });
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
    this.add.text(width / 2, 80, "Clique sur les boîtes — argent x2, or x5, arc-en-ciel x10 !", {
      fontFamily: "Fredoka, system-ui", fontSize: "16px", color: "#ffeebb",
    }).setOrigin(0.5);

    this._setTimer(20000);
    this.cans = [];
    const TIERS = [
      { w: 70, pts: 10, body: 0xddccaa, stripe: 0xc63a3a, edge: 0x6a4a2a, label: null,    labelColor: null    },
      { w: 20, pts: 25, body: 0xc0c8d8, stripe: 0x4a5a78, edge: 0x223040, label: "x2",    labelColor: "#fff" },
      { w: 8,  pts: 50, body: 0xffd23f, stripe: 0xc88a00, edge: 0x6a4a04, label: "x5",    labelColor: "#fff" },
      { w: 2,  pts:100, body: 0xff66ff, stripe: 0x66ddff, edge: 0x9a4ad8, label: "x10",   labelColor: "#fff" },
    ];
    const pickTier = () => {
      const r = Math.random() * 100;
      let acc = 0;
      for (const t of TIERS) { acc += t.w; if (r < acc) return t; }
      return TIERS[0];
    };

    const spawnCan = () => {
      if (this.gameOver) return;
      if (this.cans.filter((c) => c.active).length >= 9) return;
      const x = 200 + Math.random() * 880;
      const y = 200 + Math.random() * 350;
      const tier = pickTier();
      const can = this.add.container(x, y);
      const body = this.add.rectangle(0, 0, 50, 70, tier.body).setStrokeStyle(2, tier.edge);
      const stripe = this.add.rectangle(0, 0, 50, 14, tier.stripe);
      const eye1 = this.add.circle(-10, -8, 3, 0x000);
      const eye2 = this.add.circle(10, -8, 3, 0x000);
      const mouth = this.add.arc(0, 8, 8, 0, 180, false, 0x000, 0).setStrokeStyle(2, 0x000);
      can.add([body, stripe, eye1, eye2, mouth]);
      if (tier.label) {
        const lbl = this.add.text(0, 24, tier.label, {
          fontFamily: "Bangers, Fredoka, system-ui", fontSize: "16px", color: tier.labelColor, stroke: "#000", strokeThickness: 4,
        }).setOrigin(0.5);
        can.add(lbl);
        if (tier.pts >= 50) {
          this.tweens.add({ targets: lbl, scale: { from: 1, to: 1.25 }, duration: 350, yoyo: true, repeat: -1, ease: "Sine.inOut" });
          const halo = this.add.circle(0, 0, 38, tier.body, 0.25);
          can.addAt(halo, 0);
          this.tweens.add({ targets: halo, alpha: { from: 0.25, to: 0.05 }, scale: { from: 1, to: 1.4 }, duration: 700, yoyo: true, repeat: -1 });
        }
      }
      can.setInteractive(new Phaser.Geom.Rectangle(-25, -35, 50, 70), Phaser.Geom.Rectangle.Contains);
      can.on("pointerdown", () => {
        if (!can.active) return;
        Audio.kill?.();
        this._addScore(tier.pts);
        if (tier.pts >= 50) this.cameras.main.flash(150, 255, 215, 60);
        const popup = this.add.text(can.x, can.y - 40, "+" + tier.pts, {
          fontFamily: "Bangers, Fredoka, system-ui", fontSize: tier.pts >= 50 ? "32px" : "22px",
          color: tier.label ? (tier.pts >= 100 ? "#ff66ff" : tier.pts >= 50 ? "#ffd23f" : "#fff") : "#ffd23f",
          stroke: "#000", strokeThickness: 4,
        }).setOrigin(0.5).setDepth(50);
        this.tweens.add({ targets: popup, y: popup.y - 50, alpha: 0, duration: 700, onComplete: () => popup.destroy() });
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
    this.add.text(width / 2, 80, "Clique sur les pigeons — argent x2, or x5, arc-en-ciel x10 (rapide !)", {
      fontFamily: "Fredoka, system-ui", fontSize: "16px", color: "#ffeebb",
    }).setOrigin(0.5);

    this._setTimer(30000);
    const TIERS = [
      { w: 70, pts: 15,  body: 0x888888, wing: 0xaaaaaa, durMin: 3000, durJit: 2000, scale: 1,    label: null  },
      { w: 20, pts: 30,  body: 0xc0c8d8, wing: 0xe0e8f0, durMin: 2400, durJit: 1200, scale: 1,    label: "x2"  },
      { w: 8,  pts: 75,  body: 0xffd23f, wing: 0xffe066, durMin: 1700, durJit: 600,  scale: 0.85, label: "x5"  },
      { w: 2,  pts: 150, body: 0xff66ff, wing: 0x66ddff, durMin: 1100, durJit: 400,  scale: 0.75, label: "x10" },
    ];
    const pickTier = () => {
      const r = Math.random() * 100;
      let acc = 0;
      for (const t of TIERS) { acc += t.w; if (r < acc) return t; }
      return TIERS[0];
    };

    const spawnPigeon = () => {
      if (this.gameOver) return;
      const tier = pickTier();
      const fromLeft = Math.random() > 0.5;
      const startX = fromLeft ? -40 : width + 40;
      const endX = fromLeft ? width + 40 : -40;
      const y = 150 + Math.random() * 400;
      const p = this.add.container(startX, y);
      const body = this.add.ellipse(0, 0, 36, 22, tier.body);
      const wingL = this.add.triangle(-8, 0, 0, 0, -16, -10, -16, 10, tier.wing);
      const wingR = this.add.triangle(8, 0, 0, 0, 16, -10, 16, 10, tier.wing);
      const head = this.add.circle(14, -2, 8, tier.body);
      const eye = this.add.circle(17, -3, 2, 0x000);
      const beak = this.add.triangle(20, 0, 0, 0, 8, -2, 8, 2, 0xffaa00);
      p.add([wingL, wingR, body, head, eye, beak]);
      if (tier.label) {
        const lbl = this.add.text(0, -22, tier.label, {
          fontFamily: "Bangers, Fredoka, system-ui", fontSize: "14px", color: "#fff", stroke: "#000", strokeThickness: 3,
        }).setOrigin(0.5);
        p.add(lbl);
        if (tier.pts >= 75) {
          this.tweens.add({ targets: lbl, scale: { from: 1, to: 1.25 }, duration: 350, yoyo: true, repeat: -1 });
        }
      }
      if (tier.scale !== 1) p.setScale(tier.scale * (fromLeft ? 1 : -1), tier.scale);
      else if (!fromLeft) p.setScale(-1, 1);
      this.tweens.add({ targets: [wingL, wingR], scaleY: { from: 1, to: 0.4 }, duration: 200, yoyo: true, repeat: -1 });
      p.setInteractive(new Phaser.Geom.Rectangle(-20, -12, 40, 24), Phaser.Geom.Rectangle.Contains);
      p.on("pointerdown", () => {
        if (!p.active) return;
        Audio.explode?.();
        this._addScore(tier.pts);
        if (tier.pts >= 75) this.cameras.main.flash(120, 255, 215, 60);
        const popup = this.add.text(p.x, p.y - 30, "+" + tier.pts, {
          fontFamily: "Bangers, Fredoka, system-ui", fontSize: tier.pts >= 75 ? "32px" : "22px",
          color: tier.pts >= 150 ? "#ff66ff" : tier.pts >= 75 ? "#ffd23f" : tier.pts >= 30 ? "#fff" : "#ffeebb",
          stroke: "#000", strokeThickness: 4,
        }).setOrigin(0.5).setDepth(50);
        this.tweens.add({ targets: popup, y: popup.y - 50, alpha: 0, duration: 700, onComplete: () => popup.destroy() });
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI * 2 * i) / 8;
          const f = this.add.rectangle(p.x, p.y, 3, 6, tier.wing, 0.9);
          this.tweens.add({ targets: f, x: p.x + Math.cos(a) * 40, y: p.y + Math.sin(a) * 40, alpha: 0, duration: 500, onComplete: () => f.destroy() });
        }
        p.destroy();
      });
      this.tweens.add({
        targets: p, x: endX,
        duration: tier.durMin + Math.random() * tier.durJit,
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
    this._showPancakeDifficulty();
  }

  _showPancakeDifficulty() {
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x1a0a4a, 0.92).setDepth(180);
    const title = this.add.text(width / 2, height / 2 - 200, "Course de Crêpes", {
      fontFamily: "Bangers, Fredoka, system-ui", fontSize: "56px", color: "#ffd23f", stroke: "#000", strokeThickness: 6,
    }).setOrigin(0.5).setDepth(181);
    const sub = this.add.text(width / 2, height / 2 - 130, "30 secondes — fais le maximum de flips !", {
      fontFamily: "Fredoka, system-ui", fontSize: "18px", color: "#ffeebb",
    }).setOrigin(0.5).setDepth(181);

    const DIFFS = [
      { id: "easy",   label: "🥞 Facile",   sub: "Curseur lent, zone large",       speed: 4,  greenW: 140, accel: 0.20, color: 0x66ff88, stroke: 0x2a8a4a },
      { id: "normal", label: "🍳 Normal",   sub: "Vitesse moyenne",                speed: 6,  greenW: 90,  accel: 0.35, color: 0xffd23f, stroke: 0xc88a00 },
      { id: "hard",   label: "🔥 Difficile", sub: "Rapide, zone serrée",           speed: 9,  greenW: 60,  accel: 0.55, color: 0xff6644, stroke: 0x880000 },
      { id: "demon",  label: "👹 Démon",    sub: "Bonne chance",                  speed: 13, greenW: 38,  accel: 0.75, color: 0xff66ff, stroke: 0x6a0080 },
    ];

    const cards = [];
    DIFFS.forEach((d, i) => {
      const x = width / 2 + (i - 1.5) * 230;
      const y = height / 2 + 30;
      const c = makeClickable(this, {
        x, y, width: 200, height: 140,
        radius: 12,
        fillColor: 0x000, fillAlpha: 0.6, strokeColor: d.color, strokeWidth: 3,
        hoverFill: 0x222, hoverStroke: 0xffd23f,
        depth: 181,
        label: d.label,
        labelStyle: { fontFamily: "Bangers, Fredoka, system-ui", fontSize: "28px", color: "#fff", stroke: "#000", strokeThickness: 4 },
        decorate: (cont, sc) => {
          cont.add(sc.add.text(0, 30, d.sub, { fontFamily: "Fredoka, system-ui", fontSize: "12px", color: "#ffeebb", align: "center", wordWrap: { width: 180 } }).setOrigin(0.5));
        },
        onClick: () => {
          overlay.destroy();
          title.destroy();
          sub.destroy();
          cards.forEach((cc) => cc.destroy());
          this._startPancakeGame(d);
        },
      });
      cards.push(c);
    });
  }

  _startPancakeGame(diff) {
    const { width, height } = this.scale;
    this.add.text(width / 2, 80, "Espace ou clic quand le curseur est dans le vert ! Combo = bonus !", {
      fontFamily: "Fredoka, system-ui", fontSize: "16px", color: "#ffeebb",
    }).setOrigin(0.5);

    this._setTimer(30000);

    const trackY = height / 2 + 40;
    const trackW = 700;
    const trackX = (width - trackW) / 2;
    const track = this.add.rectangle(width / 2, trackY, trackW, 50, 0x222840).setStrokeStyle(2, 0x666);
    const greenZone = this.add.rectangle(width / 2, trackY, diff.greenW, 46, 0x66ff88, 0.7);
    const yellowSize = diff.greenW + 80;
    const yellowL = this.add.rectangle(width / 2 - (diff.greenW / 2 + 30), trackY, 60, 46, 0xffd23f, 0.5);
    const yellowR = this.add.rectangle(width / 2 + (diff.greenW / 2 + 30), trackY, 60, 46, 0xffd23f, 0.5);

    let cursorX = trackX;
    let dir = 1;
    let speed = diff.speed;
    const cursor = this.add.rectangle(cursorX, trackY, 8, 60, 0xffffff).setStrokeStyle(2, 0x000);

    const pan = this.add.text(width / 2, trackY - 90, "🍳", { fontFamily: "system-ui", fontSize: "60px" }).setOrigin(0.5);

    let flips = 0;
    let combo = 0;
    let bestCombo = 0;
    let busy = false;

    const flipCount = this.add.text(width / 2, trackY + 80, "Flips : 0", {
      fontFamily: "Fredoka, system-ui", fontSize: "20px", fontStyle: "bold", color: "#ffd23f",
    }).setOrigin(0.5);
    const comboText = this.add.text(width / 2, trackY + 110, "", {
      fontFamily: "Bangers, Fredoka, system-ui", fontSize: "22px", color: "#ff66cc", stroke: "#000", strokeThickness: 4,
    }).setOrigin(0.5);
    const diffBadge = this.add.text(40, 80, diff.label, {
      fontFamily: "Bangers, Fredoka, system-ui", fontSize: "20px", color: "#fff", stroke: "#000", strokeThickness: 4,
    }).setOrigin(0, 0.5);

    const tryFlip = () => {
      if (busy || this.gameOver) return;
      busy = true;
      const offset = Math.abs(cursorX - width / 2);
      let pts = 0, txt = "", color = "#888";
      const halfGreen = diff.greenW / 2;
      const halfYellow = halfGreen + 60;
      if (offset < halfGreen) {
        combo++;
        if (combo > bestCombo) bestCombo = combo;
        const mult = Math.min(1 + (combo - 1) * 0.25, 4);
        pts = Math.round(25 * mult);
        txt = combo >= 3 ? "PARFAIT x" + combo + " !" : "PARFAIT !";
        color = "#66ff88";
      } else if (offset < halfYellow) {
        combo = 0;
        pts = 10;
        txt = "BIEN";
        color = "#ffd23f";
      } else {
        combo = 0;
        pts = 0;
        txt = "RATÉ";
        color = "#ff6644";
      }
      const fb = this.add.text(width / 2, trackY - 160, txt + (pts > 0 ? "  +" + pts : ""), {
        fontFamily: "Bangers, Fredoka, system-ui", fontSize: "32px", color, stroke: "#000", strokeThickness: 4,
      }).setOrigin(0.5);
      this.tweens.add({ targets: fb, y: fb.y - 30, alpha: 0, duration: 800, onComplete: () => fb.destroy() });
      if (pts > 0) {
        this._addScore(pts);
        this.tweens.add({ targets: pan, angle: 360, y: pan.y - 30, duration: 280, yoyo: true, ease: "Cubic.out", onComplete: () => { pan.angle = 0; busy = false; } });
      } else {
        this.tweens.add({ targets: pan, x: { from: pan.x - 8, to: pan.x + 8 }, duration: 50, yoyo: true, repeat: 3, onComplete: () => { busy = false; } });
      }
      flips++;
      flipCount.setText("Flips : " + flips);
      comboText.setText(combo >= 2 ? "Combo x" + combo : "");
      speed = Math.min(speed + diff.accel, diff.speed * 2.5);
    };
    this.input.keyboard.on("keydown-SPACE", tryFlip);
    this.input.on("pointerdown", tryFlip);

    this._pancakeCursorTick = () => {
      if (this.gameOver || busy) return;
      cursorX += dir * speed;
      if (cursorX > trackX + trackW) { cursorX = trackX + trackW; dir = -1; }
      else if (cursorX < trackX) { cursorX = trackX; dir = 1; }
      cursor.x = cursorX;
    };
    this.events.on("update", this._pancakeCursorTick);
  }

  // ========== Bumper Cars ==========
  _createBumper() {
    const { width, height } = this.scale;
    this.add.text(width / 2, 80, "Esquive avec ← → ↑ ↓ — survis le plus longtemps possible !", {
      fontFamily: "Fredoka, system-ui", fontSize: "16px", color: "#ffeebb",
    }).setOrigin(0.5);

    const arenaY1 = 130, arenaY2 = height - 60;
    this.add.rectangle(width / 2, (arenaY1 + arenaY2) / 2, width - 60, arenaY2 - arenaY1, 0x000, 0.4).setStrokeStyle(3, 0xff66cc);

    let lives = 3;
    let invulnUntil = 0;
    let survivedMs = 0;

    const livesIcons = [];
    const livesContainer = this.add.container(40, 30).setDepth(100);
    livesContainer.add(this.add.text(0, 0, "Vies :", { fontFamily: "Fredoka, system-ui", fontSize: "20px", fontStyle: "bold", color: "#fff", stroke: "#000", strokeThickness: 3 }).setOrigin(0, 0.5));
    for (let i = 0; i < 3; i++) {
      const heart = this.add.text(70 + i * 30, 0, "❤️", { fontFamily: "system-ui", fontSize: "24px" }).setOrigin(0, 0.5);
      livesContainer.add(heart);
      livesIcons.push(heart);
    }
    this.timerText.setText("0.0s");

    const car = this.add.container(width / 2, height - 140);
    const body = this.add.rectangle(0, 0, 40, 28, 0x66ff88).setStrokeStyle(2, 0x2a8a4a);
    const w1 = this.add.circle(-12, 12, 5, 0x000);
    const w2 = this.add.circle(12, 12, 5, 0x000);
    const head = this.add.circle(0, -8, 8, 0xffd2a8);
    car.add([body, w1, w2, head]);

    const obstacles = [];
    const difficultyAt = (sec) => {
      const t = Math.min(1, sec / 90);
      return {
        spawnDelay: Math.round(700 - 400 * t),
        carDur: Math.round(2400 - 1700 * t),
        burst: 1 + Math.floor(sec / 25),
      };
    };

    const spawnObstacle = () => {
      if (this.gameOver) return;
      const fromLeft = Math.random() > 0.5;
      const sx = fromLeft ? -50 : width + 50;
      const sy = arenaY1 + 18 + Math.random() * (arenaY2 - arenaY1 - 36);
      const diff = difficultyAt(survivedMs / 1000);
      const dur = diff.carDur + Math.floor(Math.random() * 400 - 200);
      const c = this.add.container(sx, sy);
      const cb = this.add.rectangle(0, 0, 40, 28, 0xff4400).setStrokeStyle(2, 0x880000);
      c.add(cb);
      obstacles.push(c);
      this.tweens.add({
        targets: c, x: fromLeft ? width + 50 : -50, duration: Math.max(700, dur),
        onComplete: () => {
          if (c.active) {
            this._addScore(2);
            c.destroy();
          }
        },
      });
    };

    const scheduleNextSpawn = () => {
      if (this.gameOver) return;
      const diff = difficultyAt(survivedMs / 1000);
      for (let i = 0; i < diff.burst; i++) this.time.delayedCall(i * 80, spawnObstacle);
      this._spawnTimer = this.time.delayedCall(diff.spawnDelay, scheduleNextSpawn);
    };
    scheduleNextSpawn();

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
      survivedMs += delta;
      this.timerText.setText((survivedMs / 1000).toFixed(1) + "s");
      const sp = 0.34 * delta;
      if (keys.left) car.x = Math.max(50, car.x - sp);
      if (keys.right) car.x = Math.min(width - 50, car.x + sp);
      if (keys.up) car.y = Math.max(arenaY1 + 18, car.y - sp);
      if (keys.down) car.y = Math.min(arenaY2 - 18, car.y + sp);

      const invuln = time < invulnUntil;
      car.setAlpha(invuln ? (Math.floor(time / 80) % 2 ? 0.3 : 1) : 1);

      if (invuln) return;

      for (const o of obstacles) {
        if (!o.active) continue;
        if (Math.abs(o.x - car.x) < 38 && Math.abs(o.y - car.y) < 26) {
          this.cameras.main.shake(180, 0.012);
          Audio.hit?.();
          lives--;
          if (livesIcons[lives]) {
            this.tweens.add({
              targets: livesIcons[lives], scale: { from: 1.5, to: 0 }, alpha: 0, angle: 360, duration: 350,
              onComplete: () => livesIcons[lives].destroy(),
            });
          }
          o.destroy();
          this.tweens.add({ targets: car, x: car.x + (Math.random() - 0.5) * 60, duration: 200, ease: "Back.out" });
          invulnUntil = time + 1100;
          if (lives <= 0) {
            this._addScore(Math.floor(survivedMs / 100));
            this.time.delayedCall(700, () => this._endGame());
            break;
          }
        }
      }
    });
  }

  // ========== Calcul Rapide ==========
  _createMath() {
    this._showMathDifficulty();
  }

  _showMathDifficulty() {
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x1a0a4a, 0.92).setDepth(180);
    const title = this.add.text(width / 2, height / 2 - 200, "Calcul Rapide", {
      fontFamily: "Bangers, Fredoka, system-ui", fontSize: "56px", color: "#66ddff", stroke: "#000", strokeThickness: 6,
    }).setOrigin(0.5).setDepth(181);
    const sub = this.add.text(width / 2, height / 2 - 130, "30 secondes — fais le maximum de bonnes réponses !", {
      fontFamily: "Fredoka, system-ui", fontSize: "18px", color: "#ffeebb",
    }).setOrigin(0.5).setDepth(181);

    const DIFFS = [
      { id: "petit",     label: "🐣 Petit",      sub: "Additions 1-9",                  ops: ["+"],           min: 1,  max: 9,  color: 0x66ff88, stroke: 0x2a8a4a },
      { id: "moyen",     label: "🦔 Moyen",      sub: "+ et − jusqu'à 20",             ops: ["+", "-"],      min: 1,  max: 20, color: 0xffd23f, stroke: 0xc88a00 },
      { id: "grand",     label: "🦊 Grand",      sub: "+, − et × jusqu'à 12",          ops: ["+", "-", "×"], min: 1,  max: 12, color: 0xff8844, stroke: 0xc63a3a },
      { id: "champion",  label: "🦅 Champion",   sub: "Tout, jusqu'à 20 et × 1-12",    ops: ["+", "-", "×"], min: 1,  max: 20, color: 0xff66ff, stroke: 0x6a0080 },
    ];

    const cards = [];
    DIFFS.forEach((d, i) => {
      const x = width / 2 + (i - 1.5) * 230;
      const y = height / 2 + 30;
      const c = makeClickable(this, {
        x, y, width: 200, height: 140,
        radius: 12,
        fillColor: 0x000, fillAlpha: 0.6, strokeColor: d.color, strokeWidth: 3,
        hoverFill: 0x222, hoverStroke: 0xffd23f,
        depth: 181,
        label: d.label,
        labelStyle: { fontFamily: "Bangers, Fredoka, system-ui", fontSize: "26px", color: "#fff", stroke: "#000", strokeThickness: 4 },
        decorate: (cont, sc) => {
          cont.add(sc.add.text(0, 30, d.sub, { fontFamily: "Fredoka, system-ui", fontSize: "12px", color: "#ffeebb", align: "center", wordWrap: { width: 180 } }).setOrigin(0.5));
        },
        onClick: () => {
          overlay.destroy();
          title.destroy();
          sub.destroy();
          cards.forEach((cc) => cc.destroy());
          this._startMathGame(d);
        },
      });
      cards.push(c);
    });
  }

  _startMathGame(diff) {
    const { width, height } = this.scale;
    this.add.text(width / 2, 80, "Trouve la bonne réponse — combo bonus !", {
      fontFamily: "Fredoka, system-ui", fontSize: "16px", color: "#ffeebb",
    }).setOrigin(0.5);

    this._setTimer(30000);

    const diffBadge = this.add.text(40, 80, diff.label, {
      fontFamily: "Bangers, Fredoka, system-ui", fontSize: "20px", color: "#fff", stroke: "#000", strokeThickness: 4,
    }).setOrigin(0, 0.5);

    const calcEmoji = this.add.text(width / 2, 180, "🧮", { fontFamily: "system-ui", fontSize: "60px" }).setOrigin(0.5);

    const questionText = this.add.text(width / 2, 290, "", {
      fontFamily: "Bangers, Fredoka, system-ui", fontSize: "72px", color: "#ffd23f",
      stroke: "#000", strokeThickness: 8,
    }).setOrigin(0.5);

    const streakText = this.add.text(width / 2, 360, "", {
      fontFamily: "Bangers, Fredoka, system-ui", fontSize: "24px", color: "#ff66cc",
      stroke: "#000", strokeThickness: 4,
    }).setOrigin(0.5);

    let streak = 0;
    let bestStreak = 0;
    let busy = false;
    const buttons = [];

    const computeAnswer = (a, b, op) => {
      if (op === "+") return a + b;
      if (op === "-") return a - b;
      return a * b;
    };

    const genQuestion = () => {
      const op = diff.ops[Math.floor(Math.random() * diff.ops.length)];
      let a, b, ans;
      if (op === "×") {
        const cap = diff.id === "champion" ? 12 : Math.min(12, diff.max);
        a = 1 + Math.floor(Math.random() * cap);
        b = 1 + Math.floor(Math.random() * cap);
        ans = a * b;
      } else if (op === "-") {
        a = diff.min + Math.floor(Math.random() * (diff.max - diff.min + 1));
        b = diff.min + Math.floor(Math.random() * (a - diff.min + 1));
        ans = a - b;
      } else {
        const half = Math.max(1, Math.floor(diff.max / 2));
        a = diff.min + Math.floor(Math.random() * half);
        b = diff.min + Math.floor(Math.random() * (diff.max - a));
        ans = a + b;
      }
      const decoys = new Set();
      while (decoys.size < 2) {
        const delta = (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
        const d = ans + delta;
        if (d !== ans && d >= 0) decoys.add(d);
      }
      const choices = [ans, ...decoys];
      for (let i = choices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
      }
      return { a, b, op, ans, choices };
    };

    const refreshButtons = (q) => {
      buttons.forEach((b) => b.destroy());
      buttons.length = 0;
      const btnY = 540;
      const btnW = 180;
      const gap = 30;
      const totalW = q.choices.length * btnW + (q.choices.length - 1) * gap;
      const startX = width / 2 - totalW / 2 + btnW / 2;
      q.choices.forEach((val, i) => {
        const c = makeClickable(this, {
          x: startX + i * (btnW + gap), y: btnY,
          width: btnW, height: 80,
          radius: 12,
          fillColor: 0x222840, fillAlpha: 0.92,
          strokeColor: 0x66ddff, strokeWidth: 3,
          hoverFill: 0x33405a, hoverStroke: 0xffd23f,
          label: String(val),
          labelStyle: { fontFamily: "Bangers, Fredoka, system-ui", fontSize: "44px", color: "#fff", stroke: "#000", strokeThickness: 5 },
          onClick: () => {
            if (busy || this.gameOver) return;
            busy = true;
            if (val === q.ans) {
              streak++;
              if (streak > bestStreak) bestStreak = streak;
              const mult = streak >= 6 ? 3 : streak >= 5 ? 2.5 : streak >= 4 ? 2 : streak >= 3 ? 1.5 : streak >= 2 ? 1.2 : 1;
              const pts = Math.round(25 * mult);
              this._addScore(pts);
              streakText.setText(streak >= 2 ? "Combo x" + streak + " (×" + mult + ")" : "");
              const fb = this.add.text(width / 2, 440, "+" + pts + (streak >= 3 ? "  PARFAIT !" : "  Bravo !"), {
                fontFamily: "Bangers, Fredoka, system-ui", fontSize: "36px", color: "#66ff88", stroke: "#000", strokeThickness: 5,
              }).setOrigin(0.5);
              this.tweens.add({ targets: fb, y: fb.y - 30, alpha: 0, duration: 700, onComplete: () => fb.destroy() });
              if (streak >= 3) this.cameras.main.flash(120, 102, 255, 136);
              this.tweens.add({ targets: c, scale: { from: 1.15, to: 1 }, duration: 200, ease: "Back.out" });
              this.time.delayedCall(280, () => { busy = false; nextQuestion(); });
            } else {
              streak = 0;
              streakText.setText("");
              const fb = this.add.text(width / 2, 440, "RATÉ — bonne réponse : " + q.ans, {
                fontFamily: "Bangers, Fredoka, system-ui", fontSize: "26px", color: "#ff6644", stroke: "#000", strokeThickness: 4,
              }).setOrigin(0.5);
              this.tweens.add({ targets: fb, y: fb.y - 30, alpha: 0, duration: 1100, onComplete: () => fb.destroy() });
              this.cameras.main.shake(120, 0.006);
              this.tweens.add({ targets: c, x: { from: c.x - 8, to: c.x + 8 }, duration: 60, yoyo: true, repeat: 2 });
              this.time.delayedCall(450, () => { busy = false; nextQuestion(); });
            }
          },
        });
        buttons.push(c);
      });
    };

    const nextQuestion = () => {
      if (this.gameOver) return;
      const q = genQuestion();
      questionText.setText(q.a + " " + q.op + " " + q.b + " = ?");
      refreshButtons(q);
    };
    nextQuestion();

    this._mathCleanup = () => {
      buttons.forEach((b) => b.destroy());
    };
  }

  // ========== Saut de Lave ==========
  _createLavaJump() {
    const { width, height } = this.scale;

    let lives = 3;
    let survivedMs = 0;
    let maxHeightReached = 0;
    let scrollOffset = 0;

    const livesIcons = [];
    const livesContainer = this.add.container(40, 30).setDepth(100);
    livesContainer.add(this.add.text(0, 0, "Vies :", { fontFamily: "Fredoka, system-ui", fontSize: "20px", fontStyle: "bold", color: "#fff", stroke: "#000", strokeThickness: 3 }).setOrigin(0, 0.5));
    for (let i = 0; i < 3; i++) {
      const heart = this.add.text(70 + i * 30, 0, "❤️", { fontFamily: "system-ui", fontSize: "24px" }).setOrigin(0, 0.5);
      livesContainer.add(heart);
      livesIcons.push(heart);
    }
    this.timerText.setText("0s");

    const lavaG = this.add.graphics().setDepth(5);
    let lavaY = height + 40;

    const getScrollSpeed = () => {
      const s = survivedMs / 1000;
      if (s < 10) return 0.05;
      if (s < 20) return 0.10;
      return Math.min(0.18, 0.15 + (s - 20) * 0.001);
    };

    const getSpacing = () => {
      const s = survivedMs / 1000;
      if (s < 10) return { min: 80, max: 130 };
      if (s < 20) return { min: 100, max: 150 };
      return { min: 120, max: 180 };
    };

    const PLAT_W = 80, PLAT_H = 16;
    const platPool = [];
    const coinPool = [];

    for (let i = 0; i < 8; i++) {
      const px = 60 + Math.random() * (width - 120 - PLAT_W);
      const py = height - 100 - i * 130;
      const pg = this.add.graphics();
      pg.fillStyle(0x8a4a04, 1);
      pg.fillRect(0, 0, PLAT_W, PLAT_H);
      pg.lineStyle(2, 0x4a2a04, 1);
      pg.strokeRect(0, 0, PLAT_W, PLAT_H);
      pg.x = px;
      pg.y = py;
      platPool.push({ g: pg, x: px, y: py, hasCoin: Math.random() > 0.6 });
    }

    platPool.forEach((p) => {
      if (p.hasCoin) {
        const cg = this.add.graphics();
        cg.fillStyle(0xffd23f, 1);
        cg.fillCircle(0, 0, 10);
        cg.lineStyle(2, 0xc88a00, 1);
        cg.strokeCircle(0, 0, 10);
        cg.x = p.x + PLAT_W / 2;
        cg.y = p.y - 20;
        cg.setDepth(4);
        coinPool.push({ g: cg, platRef: p, collected: false });
        p.coinRef = coinPool[coinPool.length - 1];
      }
    });

    const player = this.add.container(width / 2, height - 200).setDepth(10);
    const pHead = this.add.circle(0, -20, 10, 0xffd2a8).setStrokeStyle(1, 0x8a6a4a);
    const pBody = this.add.rectangle(0, 0, 14, 20, 0xff4400).setStrokeStyle(1, 0x880000);
    const pLegL = this.add.rectangle(-4, 16, 5, 14, 0xcc3300);
    const pLegR = this.add.rectangle(4, 16, 5, 14, 0xcc3300);
    player.add([pBody, pHead, pLegL, pLegR]);

    let pVx = 0, pVy = 0;
    let grounded = false;
    let invulnUntil = 0;
    let legAnimT = 0;

    const keys = { left: false, right: false, jump: false };
    this._ljKeyDown = (e) => {
      if (e.code === "ArrowLeft") keys.left = true;
      if (e.code === "ArrowRight") keys.right = true;
      if (e.code === "Space" || e.code === "ArrowUp") keys.jump = true;
    };
    this._ljKeyUp = (e) => {
      if (e.code === "ArrowLeft") keys.left = false;
      if (e.code === "ArrowRight") keys.right = false;
      if (e.code === "Space" || e.code === "ArrowUp") keys.jump = false;
    };
    this.input.keyboard.on("keydown", this._ljKeyDown);
    this.input.keyboard.on("keyup", this._ljKeyUp);

    let jumpPressed = false;
    let highestPlat = 0;

    this._ljTick = (time, delta) => {
      if (this.gameOver) return;

      survivedMs += delta;
      this.timerText.setText(Math.floor(survivedMs / 1000) + "s");

      const scrollSpeed = getScrollSpeed();
      const scroll = scrollSpeed * delta;
      scrollOffset += scroll;
      lavaY -= scroll;

      platPool.forEach((p) => {
        p.y += scroll;
        p.g.y = p.y;
        if (p.coinRef) {
          p.coinRef.g.y = p.y - 20;
        }
        if (p.y > height + 40) {
          const sp = getSpacing();
          const topPlat = platPool.reduce((m, pp) => Math.min(m, pp.y), height);
          const newY = topPlat - (sp.min + Math.random() * (sp.max - sp.min));
          p.x = 60 + Math.random() * (width - 120 - PLAT_W);
          p.y = newY;
          p.g.x = p.x;
          p.g.y = p.y;
          p.hasCoin = Math.random() > 0.55;
          if (p.coinRef) {
            p.coinRef.collected = false;
            p.coinRef.g.setVisible(p.hasCoin);
            p.coinRef.g.x = p.x + PLAT_W / 2;
            p.coinRef.g.y = p.y - 20;
          }
          const heightGained = Math.floor(scrollOffset / 10);
          if (heightGained > maxHeightReached) {
            const diff = heightGained - maxHeightReached;
            maxHeightReached = heightGained;
            this._addScore(Math.floor(diff / 2));
          }
        }
      });

      pVy += 0.0024 * delta;

      if (keys.left) player.x = Math.max(20, player.x - 0.4 * delta);
      if (keys.right) player.x = Math.min(width - 20, player.x + 0.4 * delta);

      if (keys.jump && !jumpPressed && grounded) {
        pVy = -0.85;
        grounded = false;
        jumpPressed = true;
        Audio.click?.();
      }
      if (!keys.jump) jumpPressed = false;

      player.y += pVy * delta * 0.6;

      grounded = false;
      for (const p of platPool) {
        if (pVy >= 0 &&
          player.y + 26 >= p.y &&
          player.y + 26 <= p.y + PLAT_H + pVy * delta * 0.6 + 6 &&
          player.x + 7 >= p.x &&
          player.x - 7 <= p.x + PLAT_W) {
          player.y = p.y - 26;
          pVy = 0;
          grounded = true;
          legAnimT += delta;
          pLegL.setPosition(-4, 16 + Math.sin(legAnimT * 0.015) * 4);
          pLegR.setPosition(4, 16 + Math.cos(legAnimT * 0.015) * 4);
          break;
        }
      }

      coinPool.forEach((c) => {
        if (c.collected || !c.g.visible) return;
        const dx = player.x - c.g.x;
        const dy = player.y - c.g.y;
        if (Math.sqrt(dx * dx + dy * dy) < 22) {
          c.collected = true;
          c.g.setVisible(false);
          this._addScore(25);
          Audio.coin?.();
          const popup = this.add.text(c.g.x, c.g.y - 20, "+25", {
            fontFamily: "Bangers, Fredoka, system-ui", fontSize: "18px", color: "#ffd23f", stroke: "#000", strokeThickness: 3,
          }).setOrigin(0.5).setDepth(50);
          this.tweens.add({ targets: popup, y: popup.y - 30, alpha: 0, duration: 600, onComplete: () => popup.destroy() });
        }
      });

      if (player.y > lavaY - 26 && time > invulnUntil) {
        lives--;
        invulnUntil = time + 1500;
        pVy = -0.7;
        this.cameras.main.shake(200, 0.012);
        Audio.hit?.();
        if (livesIcons[lives]) {
          this.tweens.add({
            targets: livesIcons[lives], scale: { from: 1.5, to: 0 }, alpha: 0, angle: 360, duration: 350,
            onComplete: () => livesIcons[lives].destroy(),
          });
        }
        if (lives <= 0) {
          this._addScore(Math.floor(maxHeightReached / 10));
          this.time.delayedCall(700, () => this._endGame());
        }
      }

      const invuln = time < invulnUntil;
      player.setAlpha(invuln ? (Math.floor(time / 100) % 2 ? 0.3 : 1) : 1);

      lavaG.clear();
      lavaG.fillStyle(0xff4400, 1);
      lavaG.fillRect(0, lavaY, width, height - lavaY + 10);
      lavaG.fillStyle(0xff6600, 0.5);
      lavaG.fillRect(0, lavaY - 8, width, 10);
      for (let fi = 0; fi < 6; fi++) {
        const fx = (fi / 6) * width + (survivedMs * 0.05 + fi * 40) % (width / 6);
        const fh = 12 + Math.sin(survivedMs * 0.004 + fi) * 6;
        lavaG.fillStyle(0xff8800, 0.7);
        lavaG.fillTriangle(fx, lavaY, fx + 14, lavaY, fx + 7, lavaY - fh);
      }
    };
    this.events.on("update", this._ljTick);
  }

  // ========== Tri Bonbons ==========
  _createCandySort() {
    const { width, height } = this.scale;
    this.add.text(width / 2, 80, "Glisse chaque bonbon dans le bocal de sa couleur !", {
      fontFamily: "Fredoka, system-ui", fontSize: "16px", color: "#ffeebb",
    }).setOrigin(0.5);

    this._setTimer(25000);

    const COLORS = [
      { key: "red",    fill: 0xff4444, stroke: 0x880000 },
      { key: "blue",   fill: 0x4488ff, stroke: 0x002288 },
      { key: "yellow", fill: 0xffd23f, stroke: 0xc88a00 },
      { key: "green",  fill: 0x44cc44, stroke: 0x006600 },
    ];

    const jarW = 60, jarH = 90;
    const jarY = height - 80;
    const jarXs = [width / 2 - 210, width / 2 - 70, width / 2 + 70, width / 2 + 210];
    const jars = [];
    let fourthJarAdded = false;

    const makeJar = (idx) => {
      const col = COLORS[idx];
      const x = jarXs[idx];
      const g = this.add.graphics();
      g.lineStyle(5, col.stroke, 1);
      g.fillStyle(col.fill, 0.15);
      g.strokeRect(x - jarW / 2, jarY - jarH / 2, jarW, jarH);
      g.fillRect(x - jarW / 2, jarY - jarH / 2, jarW, jarH);
      g.fillStyle(col.fill, 0.5);
      g.fillRect(x - jarW / 2 + 4, jarY - jarH / 2 - 14, jarW - 8, 12);
      g.lineStyle(3, col.stroke, 1);
      g.strokeRect(x - jarW / 2 + 4, jarY - jarH / 2 - 14, jarW - 8, 12);
      jars.push({ x, y: jarY, colorKey: col.key, g, idx, alive: true });
      return g;
    };

    for (let i = 0; i < 3; i++) makeJar(i);

    const candies = [];
    let combo = 0;

    const spawnCandy = () => {
      if (this.gameOver) return;
      const activeCount = candies.filter((c) => c.active).length;
      const maxCount = this.timeLeftMs > 5000 ? (this.timeLeftMs > 15000 ? 4 : 5) : 6;
      if (activeCount >= maxCount) return;

      const poolSize = fourthJarAdded ? 4 : 3;
      const colIdx = Math.floor(Math.random() * poolSize);
      const col = COLORS[colIdx];
      const x = 100 + Math.random() * (width - 200);
      const size = 28;

      const cont = this.add.container(x, 120);
      const shapes = [0, 1, 2];
      const shapeType = shapes[Math.floor(Math.random() * 3)];
      let shape;
      if (shapeType === 0) {
        shape = this.add.circle(0, 0, size / 2, col.fill).setStrokeStyle(2, col.stroke);
      } else if (shapeType === 1) {
        shape = this.add.rectangle(0, 0, size, size, col.fill).setStrokeStyle(2, col.stroke);
      } else {
        shape = this.add.triangle(0, -size / 2, size / 2, size / 2, -size / 2, size / 2, col.fill).setStrokeStyle(2, col.stroke);
      }
      cont.add(shape);
      cont.setDepth(10);

      const hitRect = new Phaser.Geom.Rectangle(-size / 2, -size / 2, size, size);
      cont.setInteractive(hitRect, Phaser.Geom.Rectangle.Contains);
      this.input.setDraggable(cont);

      let vy = 0;
      const GRAV = this.timeLeftMs > 5000 ? 0.00003 : 0.000036;
      let dragging = false;
      let dragOffX = 0, dragOffY = 0;
      let landed = false;

      cont.on("dragstart", (ptr) => {
        dragging = true;
        dragOffX = cont.x - ptr.x;
        dragOffY = cont.y - ptr.y;
        cont.setDepth(20);
      });
      cont.on("drag", (ptr, dragX, dragY) => {
        cont.setPosition(dragX, dragY);
      });
      cont.on("dragend", () => {
        dragging = false;
        cont.setDepth(10);
        let matched = false;
        for (const jar of jars) {
          if (!jar.alive) continue;
          if (Math.abs(cont.x - jar.x) < jarW / 2 + 10 && Math.abs(cont.y - jar.y) < jarH / 2 + 20) {
            if (jar.colorKey === col.key) {
              matched = true;
              combo++;
              const pts = 15 + (combo >= 3 ? Math.min(20, (combo - 2) * 5) : 0);
              this._addScore(pts);
              this.tweens.add({ targets: jar.g, alpha: { from: 0.6, to: 1 }, duration: 200, yoyo: true });
              const popup = this.add.text(jar.x, jar.y - 60, "+" + pts + (combo >= 3 ? " COMBO!" : ""), {
                fontFamily: "Bangers, Fredoka, system-ui", fontSize: "22px", color: "#66ff88", stroke: "#000", strokeThickness: 4,
              }).setOrigin(0.5).setDepth(50);
              this.tweens.add({ targets: popup, y: popup.y - 30, alpha: 0, duration: 700, onComplete: () => popup.destroy() });
              this.tweens.add({
                targets: cont, x: jar.x, y: jar.y, scaleX: 0, scaleY: 0, duration: 250, ease: "Cubic.in",
                onComplete: () => {
                  cont.destroy();
                  const ci = candies.indexOf(cont);
                  if (ci !== -1) candies.splice(ci, 1);
                },
              });
              landed = true;
            } else {
              combo = 0;
              this.cameras.main.shake(80, 0.005);
            }
            break;
          }
        }
        if (!matched) {
          vy = 0;
        }
      });

      const gravityTick = (time, delta) => {
        if (this.gameOver || !cont.active || dragging || landed) return;
        vy += GRAV * delta;
        cont.y += vy * delta;
        if (cont.y > height - 40) {
          this.cameras.main.shake(60, 0.004);
          combo = 0;
          this.score = Math.max(0, this.score - 5);
          this.scoreText.setText("Score : " + this.score);
          cont.destroy();
          this.events.off("update", gravityTick);
          const ci = candies.indexOf(cont);
          if (ci !== -1) candies.splice(ci, 1);
        }
      };
      this.events.on("update", gravityTick);

      candies.push(cont);
    };

    this._csSpawnTimer = this.time.addEvent({
      delay: 1200,
      loop: true,
      callback: () => {
        if (this.gameOver) return;
        const elapsed = 25000 - this.timeLeftMs;
        const delay = elapsed < 10000 ? 1500 : elapsed < 20000 ? 1000 : 700;
        if (!fourthJarAdded && elapsed >= 10000) {
          fourthJarAdded = true;
          makeJar(3);
          this.tweens.add({ targets: jars[3].g, x: { from: jarXs[3] + 100, to: jarXs[3] }, duration: 400, ease: "Back.out" });
        }
        spawnCandy();
      },
    });
    for (let i = 0; i < 3; i++) this.time.delayedCall(i * 400, spawnCandy);
  }

  // ========== Tir à l'Arc ==========
  _createArchery() {
    const { width, height } = this.scale;

    const TOTAL_ARROWS = 6;
    let arrowsFired = 0;
    let allHit = true;
    let endScheduled = false;

    const arrowCountText = this.add.text(30, 80, "Fleches : 0 / " + TOTAL_ARROWS, {
      fontFamily: "Fredoka, system-ui", fontSize: "20px", fontStyle: "bold", color: "#ffd23f",
      stroke: "#000", strokeThickness: 4,
    }).setOrigin(0, 0.5);

    const TIERS = [
      { w: 60, pts: 30,  radius: 28, color: 0xc63a3a, label: null,   pulse: false, halo: false },
      { w: 25, pts: 60,  radius: 22, color: 0xc0c8d8, label: "x2",  pulse: true,  halo: false },
      { w: 12, pts: 120, radius: 16, color: 0xffd23f, label: "x4",  pulse: true,  halo: true  },
      { w: 3,  pts: 250, radius: 10, color: 0xff2222, label: "x8",  pulse: true,  halo: true  },
    ];

    const pickTier = () => {
      const r = Math.random() * 100;
      let acc = 0;
      for (const t of TIERS) { acc += t.w; if (r < acc) return t; }
      return TIERS[0];
    };

    const targets = [];

    const spawnTarget = (speed) => {
      if (this.gameOver) return;
      const tier = pickTier();
      const yMin = 160, yMax = 520;
      const y = yMin + Math.random() * (yMax - yMin);
      const fromLeft = Math.random() > 0.5;
      const startX = fromLeft ? -tier.radius - 10 : width + tier.radius + 10;
      const endX = fromLeft ? width + tier.radius + 10 : -tier.radius - 10;

      const cont = this.add.container(startX, y);
      const outerRing = this.add.circle(0, 0, tier.radius + 6, 0xffd23f, 0.25);
      const circle = this.add.circle(0, 0, tier.radius, tier.color).setStrokeStyle(2, 0x222);
      const inner = this.add.circle(0, 0, Math.max(4, tier.radius * 0.35), 0xffffff, 0.35);
      cont.add([circle, inner]);

      if (tier.halo) {
        cont.addAt(outerRing, 0);
        this.tweens.add({ targets: outerRing, alpha: { from: 0.25, to: 0.05 }, scale: { from: 1, to: 1.5 }, duration: 600, yoyo: true, repeat: -1 });
      }
      if (tier.label) {
        const lbl = this.add.text(0, 0, tier.label, {
          fontFamily: "Bangers, Fredoka, system-ui", fontSize: "14px", color: "#fff", stroke: "#000", strokeThickness: 3,
        }).setOrigin(0.5);
        cont.add(lbl);
        if (tier.pulse) {
          this.tweens.add({ targets: lbl, scale: { from: 1, to: 1.3 }, duration: 300, yoyo: true, repeat: -1 });
        }
      }

      const tween = this.tweens.add({
        targets: cont, x: endX, duration: (Math.abs(endX - startX) / speed) * 1000,
        onComplete: () => { if (cont.active) cont.destroy(); },
      });
      targets.push({ cont, tier, tween });
    };

    const arcX = 120, arcY = height - 100;
    const arcG = this.add.graphics();
    arcG.lineStyle(4, 0x8a6a3a, 1);
    arcG.beginPath();
    arcG.arc(arcX, arcY, 40, Phaser.Math.DegToRad(210), Phaser.Math.DegToRad(330), false);
    arcG.strokePath();
    const bowLabel = this.add.text(arcX, arcY - 52, "ARC", {
      fontFamily: "Bangers, Fredoka, system-ui", fontSize: "14px", color: "#c8a060", stroke: "#000", strokeThickness: 3,
    }).setOrigin(0.5);

    let dragStart = null;
    let cordLine = this.add.graphics();
    const ARROW_OBJECTS = [];

    const arrowDone = (hit) => {
      if (!hit) allHit = false;
      arrowsFired++;
      arrowCountText.setText("Fleches : " + arrowsFired + " / " + TOTAL_ARROWS);
      if (arrowsFired >= TOTAL_ARROWS && !endScheduled) {
        endScheduled = true;
        if (allHit) {
          this._addScore(100);
          const bonus = this.add.text(width / 2, height / 2 - 60, "PARFAIT ! +100 bonus !", {
            fontFamily: "Bangers, Fredoka, system-ui", fontSize: "36px", color: "#ffd23f", stroke: "#000", strokeThickness: 6,
          }).setOrigin(0.5).setDepth(60);
          this.tweens.add({ targets: bonus, y: bonus.y - 30, alpha: 0, duration: 1200, onComplete: () => bonus.destroy() });
        }
        this.time.delayedCall(1500, () => this._endGame());
      }
    };

    const fireArrow = (dx, dy) => {
      if (this.gameOver || arrowsFired >= TOTAL_ARROWS) return;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const capped = Math.min(dist, 150);
      const norm = dist > 0 ? dist : 1;
      const vx = (-dx / norm) * capped * 0.7;
      const vy = (-dy / norm) * capped * 0.7;

      const arrowG = this.add.graphics();
      let ax = arcX, ay = arcY;
      let avx = vx, avy = vy;
      const GRAVITY = 0.0004;
      let hit = false;
      let active = true;

      const ramp = Math.min(2, 1 + (arrowsFired / 2) * 0.5);

      const arrowTick = (time, delta) => {
        if (!active || this.gameOver) return;
        avx += 0;
        avy += GRAVITY * delta * delta;
        ax += avx * delta * 0.001 * 60;
        ay += avy * delta * 0.001 * 60;

        arrowG.clear();
        arrowG.lineStyle(2, 0x8a6a3a, 1);
        arrowG.lineBetween(ax - avx * 8, ay - avy * 8, ax, ay);
        arrowG.fillStyle(0x4a2a0a, 1);
        arrowG.fillTriangle(ax, ay, ax - avx * 0.4 - avy * 0.15, ay - avy * 0.4 + avx * 0.15, ax - avx * 0.4 + avy * 0.15, ay - avy * 0.4 - avx * 0.15);

        if (ax < -20 || ax > width + 20 || ay > height + 20) {
          active = false;
          arrowG.destroy();
          this.events.off("update", arrowTick);
          arrowDone(false);
          return;
        }

        for (let i = targets.length - 1; i >= 0; i--) {
          const t = targets[i];
          if (!t.cont.active) { targets.splice(i, 1); continue; }
          const tdx = ax - t.cont.x;
          const tdy = ay - t.cont.y;
          if (Math.sqrt(tdx * tdx + tdy * tdy) < t.tier.radius * ramp) {
            hit = true;
            active = false;
            arrowG.destroy();
            this.events.off("update", arrowTick);
            Audio.explode?.();
            this._addScore(t.tier.pts);
            if (t.tier.pts >= 120) this.cameras.main.flash(150, 255, 215, 60);
            const popup = this.add.text(t.cont.x, t.cont.y - 30, "+" + t.tier.pts, {
              fontFamily: "Bangers, Fredoka, system-ui", fontSize: "28px", color: "#ffd23f", stroke: "#000", strokeThickness: 4,
            }).setOrigin(0.5).setDepth(50);
            this.tweens.add({ targets: popup, y: popup.y - 50, alpha: 0, duration: 700, onComplete: () => popup.destroy() });
            const ring = this.add.circle(t.cont.x, t.cont.y, t.tier.radius, t.tier.tier ? 0xffd23f : 0xff6644, 0.6).setDepth(30);
            this.tweens.add({ targets: ring, scaleX: 3, scaleY: 3, alpha: 0, duration: 500, onComplete: () => ring.destroy() });
            t.tween?.stop();
            t.cont.destroy();
            targets.splice(i, 1);
            arrowDone(true);
            return;
          }
        }
      };
      this.events.on("update", arrowTick);
      ARROW_OBJECTS.push(arrowTick);
    };

    this.input.on("pointerdown", (ptr) => {
      if (this.gameOver || arrowsFired >= TOTAL_ARROWS) return;
      dragStart = { x: ptr.x, y: ptr.y };
    });
    this.input.on("pointermove", (ptr) => {
      if (!dragStart) return;
      cordLine.clear();
      const dx = Math.min(Math.max(ptr.x - dragStart.x, -150), 150);
      const dy = Math.min(Math.max(ptr.y - dragStart.y, -150), 150);
      cordLine.lineStyle(2, 0xffd23f, 0.8);
      cordLine.lineBetween(arcX, arcY - 28, arcX + dx, arcY + dy);
      cordLine.lineBetween(arcX, arcY + 28, arcX + dx, arcY + dy);
    });
    this.input.on("pointerup", (ptr) => {
      if (!dragStart || this.gameOver) return;
      const dx = ptr.x - dragStart.x;
      const dy = ptr.y - dragStart.y;
      dragStart = null;
      cordLine.clear();
      if (arrowsFired < TOTAL_ARROWS) {
        Audio.click?.();
        fireArrow(dx, dy);
      }
    });

    const scheduleTargets = () => {
      const spawnWave = (speed) => {
        if (this.gameOver) return;
        for (let i = 0; i < 2; i++) {
          this.time.delayedCall(i * 600, () => spawnTarget(speed));
        }
      };
      spawnWave(30);
      this.time.delayedCall(2000, () => spawnWave(30));
      this.time.delayedCall(4000, () => spawnWave(60));
      this.time.delayedCall(6000, () => spawnWave(60));
      this.time.delayedCall(8000, () => spawnWave(90));
      this.time.delayedCall(10000, () => spawnWave(90));
    };
    scheduleTargets();
  }

  // ========== Feu Tricolore ==========
  _createTrafficLight() {
    const { width, height } = this.scale;
    this.add.text(width / 2, 80, "Maintiens ESPACE ou ↑ pour courir — stoppe au ROUGE !", {
      fontFamily: "Fredoka, system-ui", fontSize: "16px", color: "#ffeebb",
    }).setOrigin(0.5);

    this._setTimer(30000);

    const trackY = height / 2 + 30;
    const trackLeft = 60;
    const trackRight = width - 160;
    const trackLen = trackRight - trackLeft;

    this.add.rectangle(width / 2 + (trackLeft - width / 2 + trackLen / 2), trackY + 30, trackLen, 12, 0x444444);

    const finishZone = this.add.rectangle(trackRight + 8, trackY + 20, 24, 60, 0x66ff88, 0.35)
      .setStrokeStyle(2, 0x66ff88);
    this.add.text(trackRight + 8, trackY - 20, "FIN", {
      fontFamily: "Bangers, Fredoka, system-ui", fontSize: "14px", color: "#66ff88",
    }).setOrigin(0.5);

    let runnerX = trackLeft;
    const runnerContainer = this.add.container(runnerX, trackY + 10);
    const head = this.add.circle(0, -22, 10, 0xffd2a8).setStrokeStyle(1, 0x8a6a4a);
    const body = this.add.rectangle(0, 0, 14, 24, 0x4488ff).setStrokeStyle(1, 0x224488);
    const legL = this.add.rectangle(-4, 18, 5, 16, 0x2244aa);
    const legR = this.add.rectangle(4, 18, 5, 16, 0x2244aa);
    runnerContainer.add([body, head, legL, legR]);

    const tlX = width - 100;
    const tlY = height / 2 - 10;
    const tlBg = this.add.rectangle(tlX, tlY, 44, 120, 0x111111).setStrokeStyle(3, 0x333333).setOrigin(0.5);
    const lightR = this.add.circle(tlX, tlY - 36, 16, 0x440000);
    const lightY = this.add.circle(tlX, tlY, 16, 0x444400);
    const lightG = this.add.circle(tlX, tlY + 36, 16, 0x004400);

    const setLight = (color) => {
      lightR.setFillStyle(color === "red" ? 0xff2222 : 0x440000);
      lightY.setFillStyle(color === "yellow" ? 0xffdd00 : 0x444400);
      lightG.setFillStyle(color === "green" ? 0x44ff44 : 0x004400);
    };

    let tlPhase = "green";
    let phaseTimer = 0;
    let tour = 1;
    let greenDur = 1500;
    let runnerSpeed = 0.3;
    let running = false;
    let redViolation = false;
    let redSurvived = false;
    let legAnim = 0;

    setLight("green");

    this._tlKeyDown = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") running = true;
    };
    this._tlKeyUp = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") running = false;
    };
    this.input.keyboard.on("keydown", this._tlKeyDown);
    this.input.keyboard.on("keyup", this._tlKeyUp);

    this._tlTick = (time, delta) => {
      if (this.gameOver) return;

      phaseTimer += delta;

      if (tlPhase === "green") {
        if (running) {
          runnerX = Math.min(trackRight, runnerX + runnerSpeed * delta);
          legAnim += delta;
          legL.setPosition(-4, 18 + Math.sin(legAnim * 0.02) * 6);
          legR.setPosition(4, 18 + Math.cos(legAnim * 0.02) * 6);
        }
        if (phaseTimer >= greenDur) {
          tlPhase = "yellow";
          phaseTimer = 0;
          setLight("yellow");
        }
        if (runnerX >= trackRight) {
          this._addScore(200);
          this.cameras.main.flash(200, 255, 215, 60);
          const popup = this.add.text(runnerContainer.x, trackY - 50, "+200 BONUS !", {
            fontFamily: "Bangers, Fredoka, system-ui", fontSize: "28px", color: "#ffd23f",
            stroke: "#000", strokeThickness: 5,
          }).setOrigin(0.5).setDepth(50);
          this.tweens.add({ targets: popup, y: popup.y - 40, alpha: 0, duration: 800, onComplete: () => popup.destroy() });
          runnerX = trackLeft;
          tour++;
          greenDur = Math.max(600, 1500 - (tour - 1) * 150);
          runnerSpeed = Math.min(0.5, 0.3 + (tour - 1) * 0.02);
        }
      } else if (tlPhase === "yellow") {
        if (running) {
          runnerX = Math.min(trackRight, runnerX + runnerSpeed * delta);
          legAnim += delta;
          legL.setPosition(-4, 18 + Math.sin(legAnim * 0.02) * 6);
          legR.setPosition(4, 18 + Math.cos(legAnim * 0.02) * 6);
        }
        if (phaseTimer >= 400) {
          tlPhase = "red";
          phaseTimer = 0;
          redViolation = false;
          redSurvived = false;
          setLight("red");
        }
      } else if (tlPhase === "red") {
        if (running) {
          redViolation = true;
          this.cameras.main.shake(180, 0.01);
          Audio.hit?.();
          runnerX = trackLeft;
          legL.setPosition(-4, 18);
          legR.setPosition(4, 18);
          tlPhase = "green";
          phaseTimer = 0;
          setLight("green");
          redViolation = false;
        } else {
          if (phaseTimer >= 1200 && !redSurvived) {
            redSurvived = true;
            const pts = 20 * tour;
            this._addScore(pts);
            const popup = this.add.text(runnerContainer.x, trackY - 50, "+" + pts + " Arrêt parfait !", {
              fontFamily: "Bangers, Fredoka, system-ui", fontSize: "22px", color: "#66ff88",
              stroke: "#000", strokeThickness: 4,
            }).setOrigin(0.5).setDepth(50);
            this.tweens.add({ targets: popup, y: popup.y - 40, alpha: 0, duration: 800, onComplete: () => popup.destroy() });
          }
          if (phaseTimer >= 1600) {
            tlPhase = "green";
            phaseTimer = 0;
            tour++;
            greenDur = Math.max(600, 1500 - (tour - 1) * 150);
            runnerSpeed = Math.min(0.5, 0.3 + (tour - 1) * 0.02);
            setLight("green");
          }
        }
      }

      runnerContainer.x = runnerX;
    };
    this.events.on("update", this._tlTick);
  }
}

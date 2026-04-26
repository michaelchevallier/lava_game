import { GRID, rowToY, cellToPixel } from "./Grid.js";

const ESCAPE_STEP = 12;
const KILL_STEP = 0.5;
const ERUPT_THRESHOLD = 50;
const ERUPT_RESET_THRESHOLD = 75;
const GLOW_THRESHOLD = 75;
const SAFE_THRESHOLD = 20;
const ERUPT_COOLDOWN_MS = 25000;

export class LavaMeter {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.x = opts.x ?? 30;
    this.y = opts.y ?? 130;
    this.height = opts.height ?? 450;
    this.width = 30;
    this._level = 0;
    this._eruptedAt = false;
    this._eruptResetAt = 0;
    this._tweens = [];
    this._bubbleTimer = null;
    this._glowTween = null;
    this._safeTween = null;
    this._lastSafeState = null;

    this._buildGraphics();
    this._startBubbles();
    this._update();
  }

  _buildGraphics() {
    const s = this.scene;
    const depth = 80;

    this._bg = s.add.rectangle(
      this.x + this.width / 2, this.y + this.height / 2,
      this.width + 8, this.height + 8,
      0x000000, 0.8
    ).setStrokeStyle(2, 0xffd23f, 1).setDepth(depth);

    this._fillGfx = s.add.graphics().setDepth(depth + 1);

    this._tickGfx = s.add.graphics().setDepth(depth + 2);
    this._drawTicks();

    this._glowGfx = s.add.graphics().setDepth(depth - 1);

    this._labelTop = s.add.text(this.x + this.width / 2, this.y - 14, "LAVA", {
      fontFamily: "system-ui",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#ffd23f",
      stroke: "#000",
      strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(depth + 3);

    this._labelPct = s.add.text(this.x + this.width / 2, this.y + this.height + 6, "0%", {
      fontFamily: "system-ui",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#ffffff",
      stroke: "#000",
      strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(depth + 3);

    this._safeLabel = s.add.text(this.x + this.width / 2, this.y - 28, "+25%", {
      fontFamily: "system-ui",
      fontSize: "10px",
      fontStyle: "bold",
      color: "#90ff90",
      stroke: "#000",
      strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(depth + 3).setAlpha(0);
  }

  _drawTicks() {
    this._tickGfx.clear();
    this._tickGfx.lineStyle(1, 0xffffff, 0.7);
    for (const pct of [25, 50, 75]) {
      const yPos = this.y + this.height - (pct / 100) * this.height;
      this._tickGfx.lineBetween(this.x - 2, yPos, this.x + this.width + 2, yPos);
    }
  }

  _fillColor() {
    const l = this._level;
    if (l <= 30) return 0xffd23f;
    if (l <= 60) return 0xff7722;
    return 0xff2200;
  }

  _drawFill() {
    this._fillGfx.clear();
    if (this._level <= 0) return;
    const fillH = Math.max(1, (this._level / 100) * this.height);
    const fillY = this.y + this.height - fillH;
    const col = this._fillColor();
    this._fillGfx.fillStyle(col, 1);
    this._fillGfx.fillRect(this.x, fillY, this.width, fillH);
  }

  _drawGlow() {
    this._glowGfx.clear();
    if (this._level < GLOW_THRESHOLD) return;
    this._glowGfx.fillStyle(0xff2200, 0.18);
    this._glowGfx.fillRoundedRect(this.x - 8, this.y - 8, this.width + 16, this.height + 16, 8);
  }

  _startGlowPulse() {
    if (this._glowTween) return;
    this._glowTween = this.scene.tweens.add({
      targets: this._glowGfx,
      alpha: { from: 0.5, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
    this._tweens.push(this._glowTween);
  }

  _stopGlowPulse() {
    if (this._glowTween) {
      this._glowTween.remove();
      this._glowTween = null;
    }
    this._glowGfx.setAlpha(1);
  }

  _startSafePulse() {
    if (this._safeTween) return;
    this._bg.setStrokeStyle(2, 0x90ff90, 1);
    this._safeTween = this.scene.tweens.add({
      targets: this._bg,
      alpha: { from: 0.7, to: 1 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
    this._tweens.push(this._safeTween);
    this.scene.tweens.add({ targets: this._safeLabel, alpha: 1, duration: 300 });
  }

  _stopSafePulse() {
    if (this._safeTween) {
      this._safeTween.remove();
      this._safeTween = null;
    }
    this._bg.setAlpha(1).setStrokeStyle(2, 0xffd23f, 1);
    this.scene.tweens.add({ targets: this._safeLabel, alpha: 0, duration: 200 });
  }

  _startBubbles() {
    this._bubbleTimer = this.scene.time.addEvent({
      delay: 380,
      loop: true,
      callback: () => {
        if (!this.scene.scene.isActive()) return;
        if (this._level <= 0) return;
        const count = this._level > 50 ? 4 : 3;
        for (let i = 0; i < count; i++) {
          const bx = this.x + 4 + Math.random() * (this.width - 8);
          const by = this.y + this.height - 4;
          const bubble = this.scene.add.circle(bx, by, 2 + Math.random() * 2, 0xff7722, 0.75).setDepth(85);
          this.scene.tweens.add({
            targets: bubble,
            y: by - 30 - Math.random() * 20,
            alpha: 0,
            duration: 1200 + Math.random() * 300,
            ease: "Cubic.out",
            onComplete: () => bubble.destroy(),
          });
        }
      },
    });
  }

  _update() {
    this._drawFill();
    this._drawGlow();
    this._labelPct.setText(Math.round(this._level) + "%");

    const isSafe = this._level < SAFE_THRESHOLD;
    if (isSafe !== this._lastSafeState) {
      this._lastSafeState = isSafe;
      if (isSafe) {
        this.scene._coinMultiplier = 1.25;
        this._startSafePulse();
        this.scene.events.emit("lava-safe");
      } else {
        this.scene._coinMultiplier = 1;
        this._stopSafePulse();
      }
    }

    if (this._level >= GLOW_THRESHOLD) {
      this._startGlowPulse();
    } else {
      this._stopGlowPulse();
    }

    if (this._level >= ERUPT_RESET_THRESHOLD) {
      const now = this.scene.time.now;
      if (!this._eruptedAt) {
        // already reset, wait for 50% trigger
      } else if (now - this._eruptResetAt >= ERUPT_COOLDOWN_MS) {
        this._eruptedAt = false;
      }
    }

    if (this._level >= ERUPT_THRESHOLD && !this._eruptedAt) {
      this._eruptedAt = true;
      this._eruptResetAt = this.scene.time.now;
      const row = Math.floor(Math.random() * GRID.rows);
      this.scene.events.emit("lava-erupt", { row });
    }

    if (this._level >= 100) {
      this._level = 100;
      this._drawFill();
      this.scene.events.emit("lava-overflow");
    }
  }

  addEscape() {
    this._level = Math.min(100, this._level + ESCAPE_STEP);
    this._update();
  }

  addKill() {
    this._level = Math.max(0, this._level - KILL_STEP);
    this._update();
  }

  getLevel() {
    return this._level;
  }

  get coinMultiplier() {
    return this._level < SAFE_THRESHOLD ? 1.25 : 1;
  }

  reset() {
    this._level = 0;
    this._eruptedAt = false;
    this._eruptResetAt = 0;
    this._lastSafeState = null;
    this._update();
  }

  destroy() {
    for (const t of this._tweens) {
      if (t && t.remove) t.remove();
    }
    this._tweens = [];
    if (this._bubbleTimer) {
      this._bubbleTimer.remove();
      this._bubbleTimer = null;
    }
    this._bg?.destroy();
    this._fillGfx?.destroy();
    this._tickGfx?.destroy();
    this._glowGfx?.destroy();
    this._labelTop?.destroy();
    this._labelPct?.destroy();
    this._safeLabel?.destroy();
  }
}

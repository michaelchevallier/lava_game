import * as Phaser from "phaser";

export class Tutorial {
  constructor(scene, steps) {
    this.scene = scene;
    this.steps = steps;
    this.currentIdx = -1;
    this.active = false;
    this.popup = null;
  }

  start() {
    this.active = true;
    this.next();
  }

  next() {
    this.dismiss();
    this.currentIdx++;
    if (this.currentIdx >= this.steps.length) {
      this.active = false;
      return;
    }
    this.render(this.steps[this.currentIdx]);
  }

  render(step) {
    const { width, height } = this.scene.scale;
    const y = step.y ?? height - 200;

    const bg = this.scene.add.rectangle(width / 2, y, 700, 80, 0x1a1f30, 0.92).setStrokeStyle(2, 0xffd23f);
    const txt = this.scene.add.text(width / 2, y - 12, step.text, {
      fontFamily: "system-ui",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#fff",
      align: "center",
      wordWrap: { width: 660 },
    }).setOrigin(0.5);
    const hint = this.scene.add.text(width / 2, y + 22, step.hint || "Clique pour continuer", {
      fontFamily: "system-ui",
      fontSize: "13px",
      color: "#ffd23f",
    }).setOrigin(0.5);

    bg.setDepth(80);
    txt.setDepth(81);
    hint.setDepth(81);

    let arrow = null;
    if (step.arrowAt) {
      arrow = this.scene.add.text(step.arrowAt.x, step.arrowAt.y, "▼", {
        fontFamily: "system-ui",
        fontSize: "40px",
        color: "#ffd23f",
        stroke: "#000",
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(82);
      this.scene.tweens.add({
        targets: arrow,
        y: arrow.y - 20,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    }

    this.popup = { bg, txt, hint, arrow };

    if (step.condition) {
      const checker = this.scene.time.addEvent({
        delay: 200,
        loop: true,
        callback: () => {
          if (step.condition(this.scene)) {
            checker.remove();
            this.next();
          }
        },
      });
      this.popup.checker = checker;
    } else {
      this.scene.time.delayedCall(step.timeout || 4000, () => {
        if (this.active) this.next();
      });
    }
  }

  dismiss() {
    if (!this.popup) return;
    this.popup.bg?.destroy();
    this.popup.txt?.destroy();
    this.popup.hint?.destroy();
    this.popup.arrow?.destroy();
    this.popup.checker?.remove();
    this.popup = null;
  }

  cleanup() {
    this.active = false;
    this.dismiss();
  }
}

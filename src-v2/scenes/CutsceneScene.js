import * as Phaser from "phaser";
import { getCutscene } from "../data/cutscenes.js";
import { loadSave, saveSave } from "../systems/SaveSystem.js";
import { Audio } from "../systems/Audio.js";

export class CutsceneScene extends Phaser.Scene {
  constructor() {
    super("CutsceneScene");
  }

  init(data) {
    this.worldId = data?.worldId ?? 1;
    this.nextLevelId = data?.nextLevelId ?? null;
    this.cutscene = getCutscene(this.worldId);
  }

  create() {
    const { width, height } = this.scale;
    const cs = this.cutscene;
    if (!cs) {
      this._goNext();
      return;
    }

    this.cameras.main.fadeIn(400, 0, 0, 0);

    const bg = this.add.graphics();
    bg.fillGradientStyle(cs.bgTop, cs.bgTop, cs.bgBottom, cs.bgBottom, 1);
    bg.fillRect(0, 0, width, height);

    for (let i = 0; i < 60; i++) {
      const star = this.add.circle(Math.random() * width, Math.random() * height, Math.random() * 1.4 + 0.4, 0xffffff, Math.random() * 0.5 + 0.2);
      this.tweens.add({ targets: star, alpha: { from: 0.2, to: 0.9 }, duration: 800 + Math.random() * 1500, yoyo: true, repeat: -1 });
    }

    this.add.text(width / 2, 80, cs.title, {
      fontFamily: "system-ui",
      fontSize: "52px",
      fontStyle: "bold",
      color: cs.color,
      stroke: "#000",
      strokeThickness: 8,
    }).setOrigin(0.5);

    const artText = (cs.art || []).join("\n");
    this.add.text(width / 2, 220, artText, {
      fontFamily: "monospace",
      fontSize: "36px",
      color: "#fff",
      align: "center",
      lineSpacing: 8,
    }).setOrigin(0.5).setAlpha(0.85);

    const fullText = cs.panels.join("\n\n");
    this.bodyText = this.add.text(width / 2, height - 220, "", {
      fontFamily: "system-ui",
      fontSize: "22px",
      color: "#fff",
      stroke: "#000",
      strokeThickness: 4,
      align: "center",
      wordWrap: { width: width - 200 },
      lineSpacing: 6,
    }).setOrigin(0.5, 0);

    this._typeText(fullText);

    const skipHint = this.add.text(width - 30, height - 30, "[Espace / Clic] continuer", {
      fontFamily: "system-ui",
      fontSize: "13px",
      color: "#ffeebb",
    }).setOrigin(1, 1).setAlpha(0.8);
    this.tweens.add({ targets: skipHint, alpha: { from: 0.4, to: 0.95 }, duration: 900, yoyo: true, repeat: -1 });

    this.input.keyboard.once("keydown-SPACE", () => this._advance());
    this.input.keyboard.once("keydown-ESC", () => this._advance());
    this.input.once("pointerdown", () => this._advance());
  }

  _typeText(full) {
    this._fullText = full;
    let i = 0;
    this._typeTimer = this.time.addEvent({
      delay: 24,
      loop: true,
      callback: () => {
        if (i >= full.length) { this._typeTimer.remove(); return; }
        this.bodyText.setText(full.slice(0, ++i));
        if (i % 4 === 0) Audio.click?.();
      },
    });
  }

  _advance() {
    if (this._advancing) return;
    this._advancing = true;
    if (this._typeTimer) {
      this._typeTimer.remove();
      this.bodyText.setText(this._fullText);
    }
    this.time.delayedCall(150, () => {
      const save = loadSave();
      if (!save.cutscenesSeen) save.cutscenesSeen = {};
      save.cutscenesSeen[this.worldId] = true;
      saveSave(save);
      this._goNext();
    });
  }

  _goNext() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      if (this.nextLevelId) {
        this.scene.start("LevelScene", { levelId: this.nextLevelId });
      } else {
        this.scene.start("CampaignMenuScene");
      }
      this.scene.stop();
    });
  }
}

export function shouldShowCutscene(worldId) {
  const save = loadSave();
  return !save.cutscenesSeen?.[worldId];
}

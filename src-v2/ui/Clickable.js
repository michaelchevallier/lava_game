import * as Phaser from "phaser";
import { Audio } from "../systems/Audio.js";

export function makeClickable(scene, opts) {
  const {
    x, y, width, height,
    onClick,
    fillColor = 0x222840,
    fillAlpha = 0.85,
    strokeColor = 0xffd23f,
    strokeWidth = 2,
    hoverFill = 0x33405a,
    hoverStroke = null,
    radius = 0,
    depth = 50,
    enabled = true,
    label = null,
    labelStyle = null,
    sub = null,
    subStyle = null,
    decorate = null,
  } = opts;

  const container = scene.add.container(x, y).setDepth(depth);

  let bg;
  if (radius > 0) {
    bg = scene.add.graphics();
    const drawBg = (fc, sc) => {
      bg.clear();
      bg.fillStyle(fc, fillAlpha);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
      bg.lineStyle(strokeWidth, sc, 1);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
    };
    drawBg(fillColor, strokeColor);
    bg._drawBg = drawBg;
    container.add(bg);
  } else {
    bg = scene.add.rectangle(0, 0, width, height, fillColor, fillAlpha).setStrokeStyle(strokeWidth, strokeColor);
    container.add(bg);
  }

  if (label) {
    const defaultLabelStyle = { fontFamily: "system-ui", fontSize: "16px", fontStyle: "bold", color: "#ffd23f", stroke: "#000", strokeThickness: 3 };
    const lblY = sub ? -10 : 0;
    const lblText = scene.add.text(0, lblY, label, labelStyle ?? defaultLabelStyle).setOrigin(0.5);
    container.add(lblText);
  }
  if (sub) {
    const defaultSubStyle = { fontFamily: "system-ui", fontSize: "11px", color: "#ddd" };
    const subText = scene.add.text(0, 12, sub, subStyle ?? defaultSubStyle).setOrigin(0.5);
    container.add(subText);
  }

  if (decorate) decorate(container, scene);

  container.setSize(width, height);
  if (enabled) {
    container.setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
      Phaser.Geom.Rectangle.Contains,
    );
    container.on("pointerover", () => {
      if (bg._drawBg) bg._drawBg(hoverFill, hoverStroke ?? strokeColor);
      else { bg.setFillStyle(hoverFill, fillAlpha); if (hoverStroke) bg.setStrokeStyle(strokeWidth, hoverStroke); }
      Audio.ui?.();
    });
    container.on("pointerout", () => {
      if (bg._drawBg) bg._drawBg(fillColor, strokeColor);
      else { bg.setFillStyle(fillColor, fillAlpha); bg.setStrokeStyle(strokeWidth, strokeColor); }
    });
    container.on("pointerdown", () => {
      Audio.click?.();
      onClick?.();
    });
  } else {
    container.setAlpha(0.55);
  }

  return container;
}

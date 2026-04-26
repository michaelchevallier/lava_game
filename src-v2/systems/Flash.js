function applyFillRecursive(target, color) {
  if (!target.list) return;
  for (const c of target.list) {
    if (typeof c.setFillStyle === "function" && c.fillColor !== undefined) {
      if (c._origFill === undefined) c._origFill = c.fillColor;
      c.setFillStyle(color, c.fillAlpha ?? 1);
    } else if (typeof c.setTint === "function") {
      c.setTint(color);
    }
    if (c.list) applyFillRecursive(c, color);
  }
}

function restoreFillRecursive(target) {
  if (!target.list) return;
  for (const c of target.list) {
    if (c._origFill !== undefined && typeof c.setFillStyle === "function") {
      c.setFillStyle(c._origFill, c.fillAlpha ?? 1);
      delete c._origFill;
    } else if (typeof c.clearTint === "function") {
      c.clearTint();
    }
    if (c.list) restoreFillRecursive(c);
  }
}

export const Flash = {
  entity(target, color = 0xffffff, ms = 80) {
    if (!target || !target.scene || !target.active) return;
    if (target._flashTimer) {
      clearTimeout(target._flashTimer);
      restoreFillRecursive(target);
    }
    applyFillRecursive(target, color);
    target._flashTimer = setTimeout(() => {
      if (target.scene && target.active) restoreFillRecursive(target);
      target._flashTimer = null;
    }, ms);
  },

  hud(text, color = 0xffd23f, ms = 200) {
    if (!text || !text.scene) return;
    const hex = "#" + color.toString(16).padStart(6, "0");
    const orig = text.style?.color;
    text.setColor(hex);
    text.scene.tweens.add({
      targets: text,
      scale: { from: 1.3, to: 1 },
      duration: ms * 1.5,
      ease: "Cubic.out",
    });
    text.scene.time.delayedCall(ms, () => {
      if (text.scene && orig) text.setColor(orig);
    });
  },
};

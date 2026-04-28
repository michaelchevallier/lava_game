import * as Phaser from "phaser";
import { getEquippedSkin } from "../systems/SaveSystem.js";
import { SKINS } from "../scenes/SkinsScene.js";

export const TILE_DEFS = [
  { id: "coin", label: "Coin Gen", cost: 50, color: 0xffd23f, accent: 0xc88a00, cooldownMs: 1500,
    desc: "Génère 30¢ toutes les 8s", stats: ["+30¢ / 8s", "HP 5"] },
  { id: "water", label: "Water Block", cost: 50, color: 0x4ea3d8, accent: 0x1a4a6a, cooldownMs: 1500,
    desc: "Mur tank — encaisse les morsures", stats: ["HP 30", "Bloque la lane"] },
  { id: "cottoncandy", label: "Barbe-à-Papa", cost: 75, color: 0xff66cc, accent: 0xffaaee, cooldownMs: 4000,
    desc: "Ralentit les visiteurs dans la zone (3×3)", stats: ["Slow 50%", "Zone 3×3", "HP 3"] },
  { id: "lava", label: "Lava Tower", cost: 100, color: 0xff4400, accent: 0xffe066, cooldownMs: 3000,
    desc: "Tire un projectile de lave dans la lane", stats: ["1 dmg / 1.1s", "DPS ~0.9", "HP 5"] },
  { id: "fan", label: "Fan", cost: 125, color: 0xddeeff, accent: 0x666, cooldownMs: 4500,
    desc: "Pousse les visiteurs en arrière", stats: ["Push -80px", "Zone 3×3", "HP 3"] },
  { id: "catapult", label: "Catapult", cost: 175, color: 0x6b3a0a, accent: 0x9bd84a, cooldownMs: 5000,
    desc: "Lance un boulet ballistique au-dessus des murs", stats: ["2 dmg / 2.2s", "DPS ~0.9", "Ignore Water", "HP 5"] },
  { id: "frost", label: "Frost Tramp", cost: 225, color: 0x88c8e8, accent: 0x4a8ab8, cooldownMs: 7000,
    desc: "Trampoline glacé : slow + dégâts", stats: ["1 dmg + slow 60%", "Zone 3×3", "HP 4"] },
  { id: "magnet", label: "Magnet Bomb", cost: 275, color: 0x66001a, accent: 0xff2222, cooldownMs: 15000,
    desc: "Explose après 1.5s : kill all dans 3×3", stats: ["99 dmg AOE", "Zone 3×3", "Single use"] },
  { id: "portal", label: "Portal", cost: 300, color: 0x9a4ad8, accent: 0xff66ff, cooldownMs: 11000,
    desc: "Téléporte le visiteur 5 cases derrière", stats: ["3 utilisations", "HP 2"] },
  { id: "tamer", label: "Dompteur", cost: 400, color: 0xc63a3a, accent: 0xffd23f, cooldownMs: 17000,
    desc: "Retourne les visiteurs (vers la sortie ENTRÉE)", stats: ["Charm 6s", "HP 3"] },
  { id: "mine", label: "Mine", cost: 100, color: 0x4a2a4a, accent: 0xff8800, cooldownMs: 6000,
    desc: "Explose au passage du visiteur", stats: ["3 dmg AOE", "Zone 1×3", "Single use"] },
  { id: "neon", label: "Néon", cost: 200, color: 0xff66ff, accent: 0xffaaff, cooldownMs: 7000,
    desc: "Étourdit les visiteurs en zone 3×3", stats: ["Stun 2s / 5s", "Zone 3×3", "HP 5"] },
  { id: "laser", label: "Laser", cost: 250, color: 0x66ddff, accent: 0xffffff, cooldownMs: 8000,
    desc: "Faisceau continu sur le 1er ennemi de la lane", stats: ["0.6 dmg / 0.25s", "DPS ~2.4", "HP 5"] },
  { id: "bulle", label: "Bulle", cost: 200, color: 0x66ffdd, accent: 0xaaffee, cooldownMs: 7000,
    desc: "Capture le visiteur dans une bulle (freeze 5s)", stats: ["Freeze 5s / 6s", "HP 5"] },
  { id: "shovel", label: "Pelle", cost: 0, color: 0x6b3a0a, accent: 0xc8a060, removeMode: true, cooldownMs: 0,
    desc: "Retire une tour (rembourse 50%)" },
];

export class Toolbar extends Phaser.GameObjects.Container {
  constructor(scene, y, onSelect, getCoins, allowedTiles = null) {
    super(scene, 0, y);
    this.scene = scene;
    this.onSelect = onSelect;
    this.getCoins = getCoins ?? (() => 0);
    this.selectedId = null;

    const w = scene.scale.width;
    const h = 100;
    const bg = scene.add.rectangle(w / 2, 0, w, h, 0x141826).setStrokeStyle(2, 0x2a3050).setOrigin(0.5, 0);
    this.add(bg);

    let visibleDefs;
    if (allowedTiles && allowedTiles.length) {
      const allowedSet = new Set([...allowedTiles, "shovel"]);
      visibleDefs = TILE_DEFS.filter((d) => allowedSet.has(d.id));
    } else {
      visibleDefs = TILE_DEFS.slice();
    }
    this._visibleDefs = visibleDefs;

    this.buttons = [];
    const totalCount = visibleDefs.length;
    const gap = 4;
    let btnW = Math.floor((w - 60 - gap * (totalCount - 1)) / totalCount);
    btnW = Math.max(70, Math.min(110, btnW));
    const btnH = 84;
    const totalW = totalCount * (btnW + gap) - gap;
    const startX = w / 2 - totalW / 2;

    const SHORTCUTS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "Q", "W", "E", "R", "T"];
    visibleDefs.forEach((def, i) => {
      const x = startX + i * (btnW + gap) + btnW / 2;
      const label = SHORTCUTS[i] || "";
      const btn = this.makeButton(def, x, h / 2, btnW, btnH, label);
      this.buttons.push(btn);
      this.add(btn);
    });

    scene.add.existing(this);
    this.setDepth(50);

    this._refreshHandler = () => this.refreshAfford();
    scene.events.on("update", this._refreshHandler);

    const KEY_TO_INDEX = {
      Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4,
      Digit6: 5, Digit7: 6, Digit8: 7, Digit9: 8, Digit0: 9,
      KeyQ: 10, KeyA: 10,
      KeyW: 11, KeyZ: 11,
      KeyE: 12,
      KeyR: 13,
      KeyT: 14,
    };
    this._keyHandler = (e) => {
      if (!this.scene || !this.active) return;
      const idx = KEY_TO_INDEX[e.code];
      if (idx !== undefined) {
        const def = this._visibleDefs[idx];
        if (def) {
          const btn = this.buttons.find((b) => b._defId === def.id);
          if (btn && btn._affordable) this.select(def.id);
        }
        return;
      }
      if (e.code === "Escape") this.clearSelection();
    };
    scene.input.keyboard.on("keydown", this._keyHandler);

    scene.events.once("shutdown", () => {
      scene.events.off("update", this._refreshHandler);
      scene.input.keyboard.off("keydown", this._keyHandler);
    });
    scene.events.once("destroy", () => {
      scene.events.off("update", this._refreshHandler);
      scene.input.keyboard.off("keydown", this._keyHandler);
    });
  }

  makeButton(def, x, y, w, h, shortcut) {
    const c = this.scene.add.container(x, y);

    const back = this.scene.add.rectangle(0, 0, w, h, 0x222840).setStrokeStyle(2, 0x4a4a6a);
    const icon = this.makeIcon(def.id, 0, -14);
    const label = this.scene.add.text(0, 18, def.label, {
      fontFamily: "Fredoka, system-ui",
      fontSize: "12px",
      color: "#dde",
    }).setOrigin(0.5);
    const costLabel = this.scene.add.text(0, 34, def.cost + " ¢", {
      fontFamily: "Fredoka, system-ui",
      fontSize: "13px",
      fontStyle: "bold",
      color: "#ffd23f",
    }).setOrigin(0.5);
    const shortcutBg = this.scene.add.rectangle(w / 2 - 12, -h / 2 + 12, 18, 18, 0x000, 0.55).setStrokeStyle(1, 0xffd23f);
    const shortcutText = this.scene.add.text(w / 2 - 12, -h / 2 + 12, String(shortcut), {
      fontFamily: "Fredoka, system-ui",
      fontSize: "13px",
      fontStyle: "bold",
      color: "#ffd23f",
    }).setOrigin(0.5);

    const cooldownOverlay = this.scene.add.rectangle(0, 0, w, h, 0x000, 0.65).setVisible(false);
    const cooldownBar = this.scene.add.rectangle(-w / 2, h / 2 - 4, w, 4, 0x66ddff).setOrigin(0, 0.5).setVisible(false);

    const skinId = getEquippedSkin(def.id);
    const skin = skinId ? SKINS.find((s) => s.id === skinId) : null;
    let skinDot = null;
    if (skin) {
      skinDot = this.scene.add.circle(-w / 2 + 10, -h / 2 + 10, 5, skin.color).setStrokeStyle(1, skin.accent);
      this.scene.tweens.add({ targets: skinDot, scale: { from: 1, to: 1.2 }, duration: 800, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    }

    c.add([back, icon, label, costLabel, shortcutBg, shortcutText, cooldownOverlay, cooldownBar]);
    if (skinDot) c.add(skinDot);
    c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    c._defId = def.id;
    c._back = back;
    c._icon = icon;
    c._costLabel = costLabel;
    c._cooldownOverlay = cooldownOverlay;
    c._cooldownBar = cooldownBar;
    c._cooldownUntil = 0;
    c._cooldownStartedAt = 0;
    c._def = def;
    c._affordable = true;
    c._w = w;

    c.on("pointerover", () => {
      if (this.selectedId !== def.id && c._affordable) back.setStrokeStyle(2, 0xffd23f);
      this._showTileTooltip(def, c);
    });
    c.on("pointerout", () => {
      if (this.selectedId !== def.id) back.setStrokeStyle(2, c._affordable ? 0x4a4a6a : 0x6a2222);
      this._hideTileTooltip();
    });
    c.on("pointerdown", (pointer) => {
      if (!c._affordable) return;
      if (this.isOnCooldown(def.id)) return;
      this.select(def.id);
      this._dragStartedFromToolbar = true;
      this._dragPointerId = pointer.id;
    });

    return c;
  }

  _now() {
    return this.scene._gameTime ?? this.scene.time.now;
  }

  triggerCooldown(id) {
    const btn = this.buttons.find((b) => b._defId === id);
    if (!btn || !btn._def.cooldownMs) return;
    const mul = this._cooldownMul ?? 1;
    const now = this._now();
    btn._cooldownStartedAt = now;
    btn._cooldownUntil = now + btn._def.cooldownMs * mul;
    btn._cooldownOverlay?.setVisible(true);
    btn._cooldownBar?.setVisible(true);
  }

  isOnCooldown(id) {
    const btn = this.buttons.find((b) => b._defId === id);
    if (!btn) return false;
    return this._now() < btn._cooldownUntil;
  }

  refreshAfford() {
    if (!this.scene || !this.active) return;
    const coins = this.getCoins();
    const now = this._now();
    for (const b of this.buttons) {
      if (!b || !b.scene || !b._back || !b._back.scene || !b._costLabel || !b._costLabel.scene) continue;

      const onCd = now < b._cooldownUntil;
      if (onCd) {
        const dur = b._cooldownUntil - b._cooldownStartedAt;
        const elapsed = now - b._cooldownStartedAt;
        const remain = Math.max(0, 1 - elapsed / dur);
        if (b._cooldownBar) b._cooldownBar.setScale(remain, 1);
      } else if (b._cooldownOverlay && b._cooldownOverlay.visible) {
        b._cooldownOverlay.setVisible(false);
        b._cooldownBar?.setVisible(false);
      }

      const can = coins >= b._def.cost && !onCd;
      if (can === b._affordable) continue;
      b._affordable = can;
      b._icon.setAlpha(can ? 1 : 0.4);
      b._costLabel.setColor(can ? "#ffd23f" : (onCd ? "#88ddff" : "#ff8888"));
      if (this.selectedId !== b._defId) {
        b._back.setStrokeStyle(2, can ? 0x4a4a6a : (onCd ? 0x4a8ab8 : 0x6a2222));
      }
      if (!can && this.selectedId === b._defId) {
        this.selectedId = null;
        this.refreshButtons();
        this.onSelect?.(null);
      }
    }
  }

  select(id) {
    if (this.selectedId === id) {
      this.selectedId = null;
      this.refreshButtons();
      this.onSelect?.(null);
      return;
    }
    this.selectedId = id;
    this.refreshButtons();
    const def = TILE_DEFS.find((d) => d.id === id);
    this.onSelect?.(def);
  }

  refreshButtons() {
    for (const b of this.buttons) {
      const isSel = b._defId === this.selectedId;
      const baseStroke = b._affordable ? 0x4a4a6a : 0x6a2222;
      b._back.setStrokeStyle(isSel ? 3 : 2, isSel ? 0xffd23f : baseStroke);
      b._back.setFillStyle(isSel ? 0x33405a : 0x222840);
    }
  }

  clearSelection() {
    if (this.selectedId == null) return;
    this.selectedId = null;
    this.refreshButtons();
  }

  makeIcon(id, x, y) {
    return makeTileIcon(this.scene, id, x, y);
  }

  _showTileTooltip(def, btnContainer) {
    this._hideTileTooltip();
    if (!def?.desc && !def?.stats?.length) return;
    const scene = this.scene;
    const lines = [def.desc].filter(Boolean);
    if (def.stats) for (const s of def.stats) lines.push("• " + s);
    if (def.cost) lines.push("Coût : " + def.cost + "¢   •   Cooldown : " + Math.round((def.cooldownMs || 0) / 100) / 10 + "s");
    const text = lines.join("\n");

    const worldX = this.x + btnContainer.x;
    const worldY = this.y + btnContainer.y;

    const tip = scene.add.container(worldX, worldY - 70).setDepth(220);
    const txt = scene.add.text(0, 0, text, {
      fontFamily: "Fredoka, system-ui",
      fontSize: "12px",
      color: "#ffeebb",
      align: "left",
      lineSpacing: 3,
    }).setOrigin(0.5, 1);
    const w = txt.width + 18;
    const h = txt.height + 14;
    const bg = scene.add.rectangle(0, -h / 2, w, h, 0x000, 0.92).setStrokeStyle(2, def.accent || 0xffd23f).setOrigin(0.5, 1);
    const arrow = scene.add.triangle(0, 4, -8, 0, 8, 0, 0, 8, 0x000, 0.92).setOrigin(0.5, 0);
    tip.add([bg, arrow, txt]);
    txt.setPosition(0, -h / 2 - 7);
    txt.setOrigin(0.5);
    tip.setAlpha(0);
    scene.tweens.add({ targets: tip, alpha: 1, duration: 120 });
    this._tileTooltip = tip;
  }

  _hideTileTooltip() {
    if (this._tileTooltip) {
      this._tileTooltip.destroy();
      this._tileTooltip = null;
    }
  }
}

export function makeTileIcon(s, id, x, y) {
    const c = s.add.container(x, y);
    if (id === "coin") {
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6;
        c.add(s.add.ellipse(Math.cos(a) * 8, Math.sin(a) * 8 - 2, 7, 10, 0xffd23f).setStrokeStyle(1, 0xc88a00));
      }
      c.add(s.add.circle(0, -2, 7, 0xff9f1c).setStrokeStyle(1, 0x6b3a0a));
      c.add(s.add.circle(-2, -3, 1, 0x000));
      c.add(s.add.circle(2, -3, 1, 0x000));
    } else if (id === "lava") {
      c.add(s.add.rectangle(0, 8, 28, 6, 0x4a2a04).setStrokeStyle(1, 0x2a1a04));
      c.add(s.add.ellipse(0, 0, 22, 10, 0xff7722).setStrokeStyle(1, 0xffe066));
      c.add(s.add.rectangle(0, -6, 22, 14, 0xc63a10).setStrokeStyle(1, 0x6b1a04));
      c.add(s.add.rectangle(10, -6, 14, 6, 0x1a1a1a).setStrokeStyle(1, 0xffe066));
      c.add(s.add.circle(-4, -8, 2, 0xff2200));
    } else if (id === "water") {
      c.add(s.add.rectangle(0, 6, 26, 6, 0x244a6a));
      c.add(s.add.rectangle(0, -2, 24, 18, 0x4ea3d8).setStrokeStyle(1, 0x1a4a6a));
      c.add(s.add.circle(-4, -4, 1.5, 0x000));
      c.add(s.add.circle(4, -4, 1.5, 0x000));
      c.add(s.add.rectangle(0, 1, 6, 1, 0x000));
    } else if (id === "fan") {
      c.add(s.add.rectangle(0, 8, 26, 4, 0x444));
      c.add(s.add.circle(0, -2, 12, 0x222).setStrokeStyle(1, 0x666));
      const b1 = s.add.rectangle(0, -2, 18, 3, 0xddeeff);
      const b2 = s.add.rectangle(0, -2, 18, 3, 0xddeeff);
      b2.angle = 90;
      c.add([b1, b2]);
      c.add(s.add.circle(0, -2, 2, 0x88aabb));
    } else if (id === "magnet") {
      c.add(s.add.rectangle(0, 8, 26, 5, 0x4a2a04));
      c.add(s.add.circle(0, -2, 11, 0x66001a).setStrokeStyle(1, 0xff2222));
      c.add(s.add.rectangle(0, -14, 2, 6, 0x222));
      c.add(s.add.circle(0, -16, 2, 0xffd23f));
    } else if (id === "catapult") {
      c.add(s.add.rectangle(0, 8, 28, 5, 0x4a2a04));
      const arm = s.add.rectangle(-2, -2, 4, 16, 0x6b3a0a);
      arm.angle = -20;
      c.add(arm);
      c.add(s.add.rectangle(-6, -10, 8, 6, 0x2a1a04));
      c.add(s.add.circle(6, -8, 4, 0x9bd84a).setStrokeStyle(1, 0x4a8a3a));
    } else if (id === "frost") {
      c.add(s.add.rectangle(0, 8, 28, 5, 0x4a6a8a));
      c.add(s.add.rectangle(0, -2, 22, 14, 0x88c8e8).setStrokeStyle(1, 0x4a8ab8));
      c.add(s.add.triangle(-6, -6, 0, 0, 4, -6, 8, 0, 0xc8e8ff));
      c.add(s.add.triangle(6, -6, 0, 0, 4, -6, 8, 0, 0xc8e8ff));
    } else if (id === "portal") {
      c.add(s.add.rectangle(0, 8, 26, 5, 0x4a2a4a));
      c.add(s.add.ellipse(0, -2, 22, 22, 0x9a4ad8).setStrokeStyle(1, 0xff66ff));
      c.add(s.add.ellipse(0, -2, 14, 14, 0x4a1a8a));
      c.add(s.add.ellipse(0, -2, 8, 8, 0xff66ff, 0.7));
    } else if (id === "tamer") {
      c.add(s.add.rectangle(0, 8, 22, 5, 0x2a0a0a));
      c.add(s.add.rectangle(0, -2, 14, 16, 0xc63a3a).setStrokeStyle(1, 0x6a0010));
      c.add(s.add.circle(0, -12, 6, 0xffd2a8).setStrokeStyle(1, 0x6b3a0a));
      c.add(s.add.rectangle(0, -16, 14, 2, 0x000));
      c.add(s.add.rectangle(0, -19, 10, 6, 0xc63a3a).setStrokeStyle(1, 0x000));
      c.add(s.add.rectangle(0, -16, 10, 1.5, 0xffd23f));
      const whip = s.add.rectangle(8, -2, 10, 1.5, 0x6b3a0a);
      whip.setOrigin(0, 0.5);
      whip.angle = 25;
      c.add(whip);
    } else if (id === "cottoncandy") {
      c.add(s.add.rectangle(0, 10, 24, 4, 0x6b3a0a));
      c.add(s.add.rectangle(0, 4, 22, 8, 0xff66cc).setStrokeStyle(1, 0xc63a8a));
      c.add(s.add.rectangle(0, -2, 2, 6, 0x6b3a0a));
      c.add(s.add.circle(0, -8, 9, 0xffaaee).setStrokeStyle(1, 0xff66cc));
      c.add(s.add.circle(-7, -7, 6, 0xffaaee).setStrokeStyle(1, 0xff66cc));
      c.add(s.add.circle(7, -7, 6, 0xffaaee).setStrokeStyle(1, 0xff66cc));
    } else if (id === "neon") {
      c.add(s.add.rectangle(0, 12, 8, 4, 0x222));
      c.add(s.add.rectangle(0, -2, 4, 18, 0x444));
      c.add(s.add.rectangle(0, -14, 18, 6, 0x222).setStrokeStyle(1, 0x111));
      c.add(s.add.rectangle(0, -14, 14, 3, 0xff66ff).setStrokeStyle(1, 0xffaaff));
      c.add(s.add.ellipse(0, -14, 24, 8, 0xff66ff, 0.35));
      c.add(s.add.ellipse(0, -14, 32, 12, 0xffaaff, 0.18));
    } else if (id === "mine") {
      c.add(s.add.rectangle(0, 8, 26, 4, 0x3a2a1a));
      c.add(s.add.circle(0, -2, 11, 0x4a2a4a).setStrokeStyle(2, 0x222));
      for (let k = 0; k < 6; k++) {
        const a = (Math.PI * 2 * k) / 6;
        c.add(s.add.circle(Math.cos(a) * 11, -2 + Math.sin(a) * 4, 2, 0x222));
      }
      c.add(s.add.circle(0, -8, 2, 0xff4400));
    } else if (id === "laser") {
      c.add(s.add.rectangle(0, 10, 24, 5, 0x222244));
      c.add(s.add.rectangle(0, -2, 14, 16, 0x6688aa).setStrokeStyle(1, 0x223355));
      c.add(s.add.rectangle(0, -12, 16, 4, 0x222244));
      c.add(s.add.circle(7, -4, 3, 0x66ddff).setStrokeStyle(1, 0xffffff));
      c.add(s.add.rectangle(14, -4, 12, 2, 0x66ddff, 0.85).setOrigin(0, 0.5));
      c.add(s.add.rectangle(14, -4, 12, 6, 0x66ddff, 0.25).setOrigin(0, 0.5));
    } else if (id === "bulle") {
      c.add(s.add.rectangle(0, 10, 22, 5, 0x224a6a));
      c.add(s.add.circle(0, -2, 11, 0x66ffdd).setStrokeStyle(2, 0x1a8a8a));
      c.add(s.add.circle(0, -2, 7, 0xaaffee, 0.6));
      c.add(s.add.circle(-3, -3, 1, 0x000));
      c.add(s.add.circle(3, -3, 1, 0x000));
      c.add(s.add.rectangle(0, 2, 4, 1, 0x000));
    } else if (id === "shovel") {
      c.add(s.add.rectangle(0, 6, 4, 24, 0x6b3a0a).setStrokeStyle(1, 0x2a1a04));
      c.add(s.add.triangle(0, -6, 0, 0, -8, -10, 8, -10, 0x999).setStrokeStyle(1, 0x444));
      c.add(s.add.rectangle(0, -8, 12, 4, 0x999).setStrokeStyle(1, 0x444));
    }
    return c;
}

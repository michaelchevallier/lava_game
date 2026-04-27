import * as Phaser from "phaser";
import { getTickets, spendTickets, ownsSkin, unlockSkin, getEquippedSkin, setEquippedSkin } from "../systems/SaveSystem.js";
import { Audio } from "../systems/Audio.js";
import { makeClickable } from "../ui/Clickable.js";
import { makeTileIcon } from "../ui/Toolbar.js";

export const SKINS = [
  { id: "lava_gold", tileId: "lava", name: "Lava Or", price: 5, color: 0xffd23f, accent: 0xff7722 },
  { id: "lava_obsidian", tileId: "lava", name: "Lava Obsidienne", price: 8, color: 0x111122, accent: 0xff2222 },
  { id: "coin_emerald", tileId: "coin", name: "Pièce Émeraude", price: 5, color: 0x66ff88, accent: 0x118844 },
  { id: "water_pink", tileId: "water", name: "Bloc Bonbon", price: 5, color: 0xff66cc, accent: 0xc63a8a },
  { id: "water_dark", tileId: "water", name: "Bloc Abyssal", price: 8, color: 0x1a1a4a, accent: 0x66ddff },
  { id: "fan_neon", tileId: "fan", name: "Fan Néon", price: 7, color: 0xff00aa, accent: 0x00ffff },
  { id: "magnet_silver", tileId: "magnet", name: "Bombe Argent", price: 8, color: 0xc8c8c8, accent: 0xffffff },
  { id: "catapult_dragon", tileId: "catapult", name: "Catapulte Dragon", price: 10, color: 0x6a0010, accent: 0xff8800 },
  { id: "frost_aqua", tileId: "frost", name: "Frost Aqua", price: 7, color: 0x66ffdd, accent: 0xaaffee },
  { id: "neon_acid", tileId: "neon", name: "Néon Acide", price: 7, color: 0x00ff44, accent: 0xaaff88 },
  { id: "laser_violet", tileId: "laser", name: "Laser Violet", price: 8, color: 0xaa44ff, accent: 0xff66ff },
  { id: "bulle_or", tileId: "bulle", name: "Bulle Or", price: 8, color: 0xffd23f, accent: 0xffaa00 },
];

export class SkinsScene extends Phaser.Scene {
  constructor() {
    super("SkinsScene");
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.cameras.main.setBackgroundColor("#1a0a3a");

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2a1a4a, 0x2a1a4a, 0xff66cc, 0x6a1a8a, 1);
    bg.fillRect(0, 0, width, height);

    this.add.text(width / 2, 40, "🎨 BOUTIQUE DE SKINS", {
      fontFamily: "Bangers, Fredoka, system-ui",
      fontSize: "44px",
      color: "#ffd23f",
      stroke: "#000",
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.ticketsText = this.add.text(width - 30, 40, "🎫 " + getTickets(), {
      fontFamily: "Fredoka, system-ui",
      fontSize: "26px",
      fontStyle: "bold",
      color: "#ff66cc",
      stroke: "#000",
      strokeThickness: 4,
    }).setOrigin(1, 0.5);

    makeClickable(this, {
      x: 70, y: 40, width: 110, height: 40,
      fillColor: 0x000, fillAlpha: 0.5, strokeColor: 0xffd23f,
      hoverFill: 0x3a2a00,
      label: "← Retour",
      labelStyle: { fontFamily: "Fredoka, system-ui", fontSize: "16px", fontStyle: "bold", color: "#ffd23f" },
      onClick: () => {
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("FairgroundHubScene");
          this.scene.stop();
        });
      },
    });

    this.scrollContainer = this.add.container(0, 0);
    this.scrollContainer.setDepth(5);

    const cellW = 280;
    const cellH = 130;
    const gap = 16;
    const cols = Math.floor((width - 60) / (cellW + gap));
    const startX = (width - cols * (cellW + gap) + gap) / 2;
    const startY = 90;

    SKINS.forEach((skin, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cellW + gap) + cellW / 2;
      const y = startY + row * (cellH + gap) + cellH / 2;
      this.drawSkinCard(skin, x, y, cellW, cellH);
    });

    const totalRows = Math.ceil(SKINS.length / cols);
    const contentBottom = startY + totalRows * (cellH + gap) + 40;
    const overflow = Math.max(0, contentBottom - height + 20);
    this._scrollY = 0;
    this._scrollMin = -overflow;
    if (overflow > 0) {
      this.input.on("wheel", (_p, _go, _dx, dy) => {
        this._scrollY = Phaser.Math.Clamp(this._scrollY - dy * 0.6, this._scrollMin, 0);
        this.scrollContainer.y = this._scrollY;
      });
    }
  }

  drawSkinCard(skin, x, y, w, h) {
    const owned = ownsSkin(skin.id);
    const equipped = getEquippedSkin(skin.tileId) === skin.id;
    const tickets = getTickets();
    const canBuy = !owned && tickets >= skin.price;

    const fill = equipped ? 0x2a4a1a : (owned ? 0x1a2a4a : 0x000000);
    const stroke = equipped ? 0x66ff88 : (owned ? 0x88aaff : 0xff66cc);

    const bg = this.add.graphics();
    bg.fillStyle(fill, 0.85);
    bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
    bg.lineStyle(3, stroke);
    bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);
    this.scrollContainer.add(bg);

    const preview = this.add.container(x - w / 2 + 50, y - 8);
    const swatch = this.add.circle(0, 0, 26, skin.color).setStrokeStyle(3, skin.accent);
    preview.add(swatch);
    const icon = makeTileIcon(this, skin.tileId, 0, 4);
    preview.add(icon);
    this.scrollContainer.add(preview);

    const name = this.add.text(x - w / 2 + 90, y - 22, skin.name, {
      fontFamily: "Fredoka, system-ui",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#fff",
    }).setOrigin(0, 0.5);
    const tile = this.add.text(x - w / 2 + 90, y, "Pour : " + skin.tileId, {
      fontFamily: "Fredoka, system-ui",
      fontSize: "12px",
      color: "#ddd",
    }).setOrigin(0, 0.5);
    this.scrollContainer.add(name);
    this.scrollContainer.add(tile);

    let label, color, action;
    if (equipped) {
      label = "✅ ÉQUIPÉ";
      color = "#aaffaa";
      action = () => {
        setEquippedSkin(skin.tileId, null);
        Audio.click();
        this.scene.restart();
      };
    } else if (owned) {
      label = "ÉQUIPER";
      color = "#88ccff";
      action = () => {
        setEquippedSkin(skin.tileId, skin.id);
        Audio.click();
        this.scene.restart();
      };
    } else if (canBuy) {
      label = "🎫 " + skin.price + " — ACHETER";
      color = "#ffd23f";
      action = () => {
        if (spendTickets(skin.price)) {
          unlockSkin(skin.id);
          Audio.collect?.();
          this.scene.restart();
        }
      };
    } else {
      label = "🔒 " + skin.price + " 🎫";
      color = "#888";
      action = null;
    }

    const btn = makeClickable(this, {
      x, y: y + h / 2 - 24, width: w - 30, height: 34,
      fillColor: 0x000, fillAlpha: 0.7, strokeColor: stroke,
      hoverFill: 0x222,
      enabled: !!action,
      label,
      labelStyle: { fontFamily: "Fredoka, system-ui", fontSize: "14px", fontStyle: "bold", color, stroke: "#000", strokeThickness: 3 },
      onClick: action || (() => {}),
    });
    this.scrollContainer.add(btn);
  }
}

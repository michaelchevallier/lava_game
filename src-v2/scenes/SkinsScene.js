import * as Phaser from "phaser";
import { getTickets, spendTickets, ownsSkin, unlockSkin, getEquippedSkin, setEquippedSkin } from "../systems/SaveSystem.js";
import { Audio } from "../systems/Audio.js";
import { makeClickable } from "../ui/Clickable.js";
import { makeTileIcon } from "../ui/Toolbar.js";

export const SKINS = [
  { id: "coin_emerald",     tileId: "coin",     name: "Pièce Émeraude",   price: 80,    tier: 1, color: 0x66ff88, accent: 0x118844 },
  { id: "water_pink",       tileId: "water",    name: "Bloc Bonbon",      price: 100,   tier: 1, color: 0xff66cc, accent: 0xc63a8a },
  { id: "lava_gold",        tileId: "lava",     name: "Lava Or",          price: 120,   tier: 1, color: 0xffd23f, accent: 0xff7722 },
  { id: "frost_aqua",       tileId: "frost",    name: "Frost Aqua",       price: 130,   tier: 1, color: 0x66ffdd, accent: 0xaaffee },
  { id: "neon_acid",        tileId: "neon",     name: "Néon Acide",       price: 140,   tier: 1, color: 0x00ff44, accent: 0xaaff88 },
  { id: "fan_neon",         tileId: "fan",      name: "Fan Néon",         price: 150,   tier: 1, color: 0xff00aa, accent: 0x00ffff },

  { id: "water_dark",       tileId: "water",    name: "Bloc Abyssal",     price: 250,   tier: 2, color: 0x1a1a4a, accent: 0x66ddff },
  { id: "catapult_oak",     tileId: "catapult", name: "Catapulte Chêne",  price: 280,   tier: 2, color: 0x4a3a1a, accent: 0x8a6a3a },
  { id: "magnet_silver",    tileId: "magnet",   name: "Bombe Argent",     price: 350,   tier: 2, color: 0xc8c8c8, accent: 0xffffff },
  { id: "bulle_or",         tileId: "bulle",    name: "Bulle Or",         price: 400,   tier: 2, color: 0xffd23f, accent: 0xffaa00 },
  { id: "portal_void",      tileId: "portal",   name: "Portail du Vide",  price: 450,   tier: 2, color: 0x222244, accent: 0x9a4ad8 },
  { id: "mine_copper",      tileId: "mine",     name: "Mine Cuivre",      price: 500,   tier: 2, color: 0xc8743a, accent: 0xff8800 },

  { id: "lava_obsidian",    tileId: "lava",     name: "Lava Obsidienne",  price: 1000,  tier: 3, color: 0x111122, accent: 0xff2222 },
  { id: "coin_celestial",   tileId: "coin",     name: "Pièce Céleste",    price: 1200,  tier: 3, color: 0xaaccff, accent: 0xffffff },
  { id: "tamer_royal",      tileId: "tamer",    name: "Dompteur Royal",   price: 1500,  tier: 3, color: 0x6a0080, accent: 0xffd23f },
  { id: "catapult_dragon",  tileId: "catapult", name: "Catapulte Dragon", price: 1800,  tier: 3, color: 0x6a0010, accent: 0xff8800 },
  { id: "laser_violet",     tileId: "laser",    name: "Laser Violet",     price: 2000,  tier: 3, color: 0xaa44ff, accent: 0xff66ff },
  { id: "mine_diamond",     tileId: "mine",     name: "Mine Diamant",     price: 2500,  tier: 3, color: 0x88eeff, accent: 0xffffff },

  { id: "lava_inferno",     tileId: "lava",     name: "Lava Inferno",     price: 5000,  tier: 4, color: 0xff2200, accent: 0xffeeaa },
  { id: "water_tsunami",    tileId: "water",    name: "Bloc Tsunami",     price: 7500,  tier: 4, color: 0x0066cc, accent: 0x88ddff },
  { id: "coin_galaxy",      tileId: "coin",     name: "Pièce Galaxie",    price: 10000, tier: 4, color: 0x4a1a8a, accent: 0xffffff },
  { id: "magnet_quantum",   tileId: "magnet",   name: "Bombe Quantique",  price: 12500, tier: 4, color: 0x6644ff, accent: 0x88ffff },
  { id: "laser_phoenix",    tileId: "laser",    name: "Laser Phénix",     price: 15000, tier: 4, color: 0xff8800, accent: 0xffd23f },

  { id: "portal_omega",     tileId: "portal",   name: "Portail Oméga",    price: 25000, tier: 5, color: 0xff00ff, accent: 0x00ffff },
  { id: "bulle_arcane",     tileId: "bulle",    name: "Bulle Arcane",     price: 30000, tier: 5, color: 0xaa00ff, accent: 0xffd23f },
  { id: "catapult_titan",   tileId: "catapult", name: "Catapulte Titan",  price: 40000, tier: 5, color: 0xffd23f, accent: 0xff0000 },
  { id: "lava_godflame",    tileId: "lava",     name: "Flamme Divine",    price: 50000, tier: 5, color: 0xffeeaa, accent: 0xff0000 },
];

const TIER_INFO = {
  1: { label: "COMMUN",     color: "#cccccc", glow: 0x666666 },
  2: { label: "RARE",       color: "#66ddff", glow: 0x3388cc },
  3: { label: "ÉPIQUE",     color: "#ff66ff", glow: 0xaa44cc },
  4: { label: "LÉGENDAIRE", color: "#ffd23f", glow: 0xffaa00 },
  5: { label: "MYTHIQUE",   color: "#ff4444", glow: 0xff66ff },
};

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
    const tier = skin.tier || 1;
    const tinfo = TIER_INFO[tier];

    const fill = equipped ? 0x2a4a1a : (owned ? 0x1a2a4a : 0x000000);
    const stroke = equipped ? 0x66ff88 : (owned ? 0x88aaff : tinfo.glow);

    const bg = this.add.graphics();
    bg.fillStyle(fill, 0.85);
    bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
    bg.lineStyle(tier >= 4 ? 4 : 3, stroke);
    bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);
    this.scrollContainer.add(bg);

    if (tier === 5) {
      const glow = this.add.graphics();
      glow.lineStyle(2, 0xffd23f, 0.4);
      glow.strokeRoundedRect(x - w / 2 - 3, y - h / 2 - 3, w + 6, h + 6, 12);
      this.scrollContainer.add(glow);
      this.tweens.add({ targets: glow, alpha: { from: 0.2, to: 0.9 }, duration: 700, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    }

    const tierBadge = this.add.text(x + w / 2 - 8, y - h / 2 + 6, tinfo.label, {
      fontFamily: "Bangers, Fredoka, system-ui",
      fontSize: tier >= 4 ? "12px" : "10px",
      color: tinfo.color,
      stroke: "#000",
      strokeThickness: 3,
    }).setOrigin(1, 0);
    this.scrollContainer.add(tierBadge);

    const preview = this.add.container(x - w / 2 + 50, y - 4);
    const swatch = this.add.circle(0, 0, 26, skin.color).setStrokeStyle(3, skin.accent);
    preview.add(swatch);
    const icon = makeTileIcon(this, skin.tileId, 0, 4);
    preview.add(icon);
    this.scrollContainer.add(preview);

    const name = this.add.text(x - w / 2 + 90, y - 18, skin.name, {
      fontFamily: "Fredoka, system-ui",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#fff",
    }).setOrigin(0, 0.5);
    const tile = this.add.text(x - w / 2 + 90, y + 2, "Pour : " + skin.tileId, {
      fontFamily: "Fredoka, system-ui",
      fontSize: "12px",
      color: "#ddd",
    }).setOrigin(0, 0.5);
    this.scrollContainer.add(name);
    this.scrollContainer.add(tile);

    const formatPrice = (p) => p >= 1000 ? (p / 1000).toFixed(p % 1000 === 0 ? 0 : 1) + "k" : String(p);

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
      label = "🎫 " + formatPrice(skin.price) + " — ACHETER";
      color = "#ffd23f";
      action = () => {
        if (spendTickets(skin.price)) {
          unlockSkin(skin.id);
          Audio.collect?.();
          this.scene.restart();
        }
      };
    } else {
      label = "🔒 " + formatPrice(skin.price) + " 🎫";
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

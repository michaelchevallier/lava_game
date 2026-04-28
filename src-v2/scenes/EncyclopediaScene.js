import * as Phaser from "phaser";
import { TILE_DEFS, makeTileIcon } from "../ui/Toolbar.js";
import { makeClickable } from "../ui/Clickable.js";
import { Audio } from "../systems/Audio.js";

const ENEMY_INFO = [
  { id: "basic", name: "Visiteur lambda", emoji: "🚶", hp: 1, speed: 45, desc: "Le client de base. Fragile, vitesse moyenne." },
  { id: "tank", name: "Bucket", emoji: "🪣", hp: 2, speed: 35, desc: "Casque-tank. Plus résistant, plus lent." },
  { id: "vip", name: "VIP", emoji: "🎩", hp: 2, speed: 45, desc: "Costume + chapeau. 2 HP, vitesse normale." },
  { id: "skeleton", name: "Squelette", emoji: "💀", hp: 1, speed: 50, desc: "Immune à la lave. Faut catapult/laser/neon." },
  { id: "flying", name: "Volant", emoji: "🦅", hp: 1, speed: 55, desc: "Vole au-dessus de l'eau. Catapult le touche." },
  { id: "clown", name: "Clown", emoji: "🤡", hp: 3, speed: 40, desc: "Lance une tour ramassée derrière la ligne." },
  { id: "magicien", name: "Magicien", emoji: "🎩✨", hp: 2, speed: 45, desc: "Désactive temporairement la tour la plus proche." },
  { id: "boudeur", name: "Boudeur", emoji: "😤", hp: 4, speed: 35, desc: "Vole de l'argent quand il passe une tour. Drop au kill." },
  { id: "trompette", name: "Trompette", emoji: "🎺", hp: 2, speed: 50, desc: "Booste la vitesse des alliés autour." },
  { id: "enfant", name: "Enfant", emoji: "🎈", hp: 1, speed: 55, desc: "Spawn 2 backups au premier hit. Piège." },
  { id: "lavewalker", name: "Lavewalker", emoji: "🔥🚶", hp: 3, speed: 45, desc: "Immune lave + frost. Vraiment chiant." },
  { id: "stiltman", name: "Échasses", emoji: "🦒", hp: 2, speed: 50, desc: "Saute par-dessus le 1er obstacle." },
  { id: "funambule", name: "Funambule", emoji: "🎪", hp: 1, speed: 60, desc: "Très rapide mais 1 HP." },
  { id: "boss", name: "Boss", emoji: "👹", hp: 12, speed: 28, desc: "Tank lent. Demande beaucoup de DPS." },
  { id: "magicboss", name: "Magic Boss", emoji: "🧙‍♂️", hp: 25, speed: 26, desc: "Boss W4. Summon des minions en multi-phase." },
  { id: "lavaqueen", name: "Lava Queen", emoji: "👑🔥", hp: 35, speed: 22, desc: "Boss W5. Trail de lave + immune lave." },
  { id: "carnivalboss", name: "Carnival Boss", emoji: "🎡", hp: 50, speed: 24, desc: "Boss W6. 3 phases avec gimmicks différents." },
];

export class EncyclopediaScene extends Phaser.Scene {
  constructor() {
    super("EncyclopediaScene");
  }

  init(data) {
    this.tab = "tiles";
    this.returnTo = (data && data.returnTo) || "CampaignMenuScene";
    this.returnData = (data && data.returnData) || null;
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(300, 0, 0, 0);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a1a3a, 0x0a1a3a, 0x2a4a6a, 0x2a4a6a, 1);
    bg.fillRect(0, 0, width, height);

    this.add.text(width / 2, 40, "📖 ENCYCLOPÉDIE", {
      fontFamily: "Bangers, Fredoka, system-ui",
      fontSize: "44px",
      fontStyle: "bold",
      color: "#ffd23f",
      stroke: "#000",
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(100);

    this.scrollContainer = this.add.container(0, 0);
    this.scrollContainer.setDepth(5);

    this._drawTabs();
    this._drawContent();

    makeClickable(this, {
      x: 80, y: height - 40, width: 130, height: 44,
      fillColor: 0x222840, strokeColor: 0xffd23f,
      hoverFill: 0x33405a,
      label: "← Retour",
      labelStyle: { fontFamily: "Fredoka, system-ui", fontSize: "16px", fontStyle: "bold", color: "#ffd23f" },
      onClick: () => this._exit(),
    }).setDepth(100);

    this.input.keyboard.once("keydown-ESC", () => this._exit());
  }

  _exit() {
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start(this.returnTo, this.returnData || {});
      this.scene.stop();
    });
  }

  _drawTabs() {
    const { width } = this.scale;
    if (this._tabContainer) this._tabContainer.destroy();
    this._tabContainer = this.add.container(0, 0).setDepth(100);

    const tabs = [
      { id: "tiles", label: "🗼 Tours (" + TILE_DEFS.filter((t) => !t.removeMode).length + ")" },
      { id: "enemies", label: "👹 Visiteurs (" + ENEMY_INFO.length + ")" },
    ];

    tabs.forEach((t, i) => {
      const x = width / 2 + (i - 0.5) * 220;
      const active = this.tab === t.id;
      const c = makeClickable(this, {
        x, y: 90, width: 200, height: 38,
        fillColor: active ? 0x4a3a08 : 0x1a2a4a,
        fillAlpha: 0.85,
        strokeColor: active ? 0xffd23f : 0x4a6a9a,
        hoverFill: 0x33405a,
        label: t.label,
        labelStyle: { fontFamily: "Fredoka, system-ui", fontSize: "16px", fontStyle: "bold", color: active ? "#ffd23f" : "#bbcce0" },
        onClick: () => {
          if (this.tab === t.id) return;
          Audio.click?.();
          this.tab = t.id;
          this._scrollY = 0;
          if (this.scrollContainer) this.scrollContainer.y = 0;
          this._drawTabs();
          this._drawContent();
        },
      });
      this._tabContainer.add(c);
    });
  }

  _drawContent() {
    if (this.scrollContainer) this.scrollContainer.removeAll(true);
    let bottom = 130;
    if (this.tab === "tiles") bottom = this._drawTiles();
    else bottom = this._drawEnemies();
    this._setupScroll(bottom);
  }

  _setupScroll(contentBottom) {
    const viewportTop = 130;
    const viewportBottom = this.scale.height - 70;
    const viewport = viewportBottom - viewportTop;
    const overflow = Math.max(0, contentBottom - viewport - viewportTop);
    this._scrollMin = -overflow;
    this._scrollY = 0;

    if (this._wheelHandler) this.input.off("wheel", this._wheelHandler);
    if (this._downHandler) this.input.off("pointerdown", this._downHandler);
    if (this._moveHandler) this.input.off("pointermove", this._moveHandler);
    if (this._upHandler) this.input.off("pointerup", this._upHandler);

    if (overflow > 0) {
      this._wheelHandler = (_p, _go, _dx, dy) => {
        this._scrollY = Phaser.Math.Clamp(this._scrollY - dy * 0.6, this._scrollMin, 0);
        this.scrollContainer.y = this._scrollY;
      };
      this.input.on("wheel", this._wheelHandler);

      let dragStartY = null;
      let dragStartScroll = 0;
      this._downHandler = (p) => {
        if (p.y > 130 && p.y < this.scale.height - 60) {
          dragStartY = p.y;
          dragStartScroll = this._scrollY;
        }
      };
      this._moveHandler = (p) => {
        if (dragStartY != null && p.isDown && Math.abs(p.y - dragStartY) > 8) {
          this._scrollY = Phaser.Math.Clamp(dragStartScroll + (p.y - dragStartY), this._scrollMin, 0);
          this.scrollContainer.y = this._scrollY;
        }
      };
      this._upHandler = () => { dragStartY = null; };
      this.input.on("pointerdown", this._downHandler);
      this.input.on("pointermove", this._moveHandler);
      this.input.on("pointerup", this._upHandler);

      if (!this._scrollHint) {
        this._scrollHint = this.add.text(this.scale.width - 30, 138, "▼", {
          fontFamily: "Fredoka, system-ui",
          fontSize: "18px",
          color: "#ffd23f",
          stroke: "#000",
          strokeThickness: 3,
        }).setOrigin(0.5).setDepth(101);
        this.tweens.add({ targets: this._scrollHint, y: 144, duration: 700, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      }
    } else if (this._scrollHint) {
      this._scrollHint.destroy();
      this._scrollHint = null;
    }
  }

  _drawTiles() {
    const { width } = this.scale;
    const tiles = TILE_DEFS.filter((t) => !t.removeMode);
    const cols = 3;
    const cellW = 380;
    const cellH = 140;
    const gap = 12;
    const startX = (width - (cols * cellW + (cols - 1) * gap)) / 2;
    const startY = 145;

    tiles.forEach((def, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cellW + gap);
      const y = startY + row * (cellH + gap);
      this._drawTileCard(def, x, y, cellW, cellH);
    });

    const rows = Math.ceil(tiles.length / cols);
    return startY + rows * (cellH + gap);
  }

  _drawTileCard(def, x, y, w, h) {
    const card = this.add.graphics();
    card.fillStyle(0x1a2a4a, 0.9);
    card.fillRoundedRect(x, y, w, h, 10);
    card.lineStyle(2, def.accent || 0x4a6a9a);
    card.strokeRoundedRect(x, y, w, h, 10);
    this.scrollContainer.add(card);

    const iconBg = this.add.graphics();
    iconBg.fillStyle(0x000, 0.5);
    iconBg.fillRoundedRect(x + 12, y + 12, 60, 60, 6);
    this.scrollContainer.add(iconBg);
    const icon = makeTileIcon(this, def.id, x + 42, y + 42);
    icon.setScale(1.3);
    this.scrollContainer.add(icon);

    const name = this.add.text(x + 84, y + 14, def.label, {
      fontFamily: "Fredoka, system-ui", fontSize: "20px", fontStyle: "bold", color: "#ffd23f",
      stroke: "#000", strokeThickness: 3,
    });
    this.scrollContainer.add(name);

    const meta = this.add.text(x + 84, y + 40, "💰 " + def.cost + "¢   ⏱ " + (def.cooldownMs / 1000).toFixed(1) + "s", {
      fontFamily: "Fredoka, system-ui", fontSize: "13px", color: "#aaccff",
    });
    this.scrollContainer.add(meta);

    const desc = this.add.text(x + 84, y + 62, def.desc || "", {
      fontFamily: "Fredoka, system-ui", fontSize: "12px", color: "#ddeefa",
      wordWrap: { width: w - 96 },
    });
    this.scrollContainer.add(desc);

    if (def.stats) {
      const stats = def.stats.join(" · ");
      const statsTxt = this.add.text(x + 12, y + h - 22, stats, {
        fontFamily: "Fredoka, system-ui", fontSize: "11px", color: "#90ff90",
        wordWrap: { width: w - 24 },
      });
      this.scrollContainer.add(statsTxt);
    }
  }

  _drawEnemies() {
    const { width } = this.scale;
    const cols = 3;
    const cellW = 380;
    const cellH = 110;
    const gap = 10;
    const startX = (width - (cols * cellW + (cols - 1) * gap)) / 2;
    const startY = 145;

    ENEMY_INFO.forEach((e, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cellW + gap);
      const y = startY + row * (cellH + gap);
      this._drawEnemyCard(e, x, y, cellW, cellH);
    });

    const rows = Math.ceil(ENEMY_INFO.length / cols);
    return startY + rows * (cellH + gap);
  }

  _drawEnemyCard(e, x, y, w, h) {
    const card = this.add.graphics();
    card.fillStyle(0x2a1a4a, 0.9);
    card.fillRoundedRect(x, y, w, h, 10);
    card.lineStyle(2, 0xff66cc);
    card.strokeRoundedRect(x, y, w, h, 10);
    this.scrollContainer.add(card);

    const emoji = this.add.text(x + 40, y + h / 2, e.emoji, {
      fontFamily: "Fredoka, system-ui", fontSize: "44px",
    }).setOrigin(0.5);
    this.scrollContainer.add(emoji);

    const name = this.add.text(x + 80, y + 12, e.name, {
      fontFamily: "Fredoka, system-ui", fontSize: "18px", fontStyle: "bold", color: "#ff99dd",
      stroke: "#000", strokeThickness: 3,
    });
    this.scrollContainer.add(name);

    const stats = this.add.text(x + 80, y + 38, "❤ HP " + e.hp + "   🏃 vitesse " + e.speed, {
      fontFamily: "Fredoka, system-ui", fontSize: "13px", color: "#aaccff",
    });
    this.scrollContainer.add(stats);

    const desc = this.add.text(x + 80, y + 60, e.desc, {
      fontFamily: "Fredoka, system-ui", fontSize: "12px", color: "#ddeefa",
      wordWrap: { width: w - 92 },
    });
    this.scrollContainer.add(desc);
  }
}

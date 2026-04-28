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
    this.tab = "tiles";
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
    }).setOrigin(0.5);

    this._drawTabs();
    this._drawContent();

    makeClickable(this, {
      x: 80, y: height - 40, width: 130, height: 44,
      fillColor: 0x222840, strokeColor: 0xffd23f,
      hoverFill: 0x33405a,
      label: "← Retour",
      labelStyle: { fontFamily: "Fredoka, system-ui", fontSize: "16px", fontStyle: "bold", color: "#ffd23f" },
      onClick: () => this._exit(),
    });

    this.input.keyboard.once("keydown-ESC", () => this._exit());
  }

  _exit() {
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("CampaignMenuScene");
      this.scene.stop();
    });
  }

  _drawTabs() {
    const { width } = this.scale;
    if (this._tabContainer) this._tabContainer.destroy();
    this._tabContainer = this.add.container(0, 0);

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
          this._drawTabs();
          this._drawContent();
        },
      });
      this._tabContainer.add(c);
    });
  }

  _drawContent() {
    if (this._content) this._content.destroy();
    this._content = this.add.container(0, 0);
    if (this.tab === "tiles") this._drawTiles();
    else this._drawEnemies();
  }

  _drawTiles() {
    const { width, height } = this.scale;
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
  }

  _drawTileCard(def, x, y, w, h) {
    const card = this.add.graphics();
    card.fillStyle(0x1a2a4a, 0.9);
    card.fillRoundedRect(x, y, w, h, 10);
    card.lineStyle(2, def.accent || 0x4a6a9a);
    card.strokeRoundedRect(x, y, w, h, 10);
    this._content.add(card);

    const iconBg = this.add.graphics();
    iconBg.fillStyle(0x000, 0.5);
    iconBg.fillRoundedRect(x + 12, y + 12, 60, 60, 6);
    this._content.add(iconBg);
    const icon = makeTileIcon(this, def.id, x + 42, y + 42);
    icon.setScale(1.3);
    this._content.add(icon);

    const name = this.add.text(x + 84, y + 14, def.label, {
      fontFamily: "Fredoka, system-ui", fontSize: "20px", fontStyle: "bold", color: "#ffd23f",
      stroke: "#000", strokeThickness: 3,
    });
    this._content.add(name);

    const meta = this.add.text(x + 84, y + 40, "💰 " + def.cost + "¢   ⏱ " + (def.cooldownMs / 1000).toFixed(1) + "s", {
      fontFamily: "Fredoka, system-ui", fontSize: "13px", color: "#aaccff",
    });
    this._content.add(meta);

    const desc = this.add.text(x + 84, y + 62, def.desc || "", {
      fontFamily: "Fredoka, system-ui", fontSize: "12px", color: "#ddeefa",
      wordWrap: { width: w - 96 },
    });
    this._content.add(desc);

    if (def.stats) {
      const stats = def.stats.join(" · ");
      const statsTxt = this.add.text(x + 12, y + h - 22, stats, {
        fontFamily: "Fredoka, system-ui", fontSize: "11px", color: "#90ff90",
        wordWrap: { width: w - 24 },
      });
      this._content.add(statsTxt);
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
  }

  _drawEnemyCard(e, x, y, w, h) {
    const card = this.add.graphics();
    card.fillStyle(0x2a1a4a, 0.9);
    card.fillRoundedRect(x, y, w, h, 10);
    card.lineStyle(2, 0xff66cc);
    card.strokeRoundedRect(x, y, w, h, 10);
    this._content.add(card);

    const emoji = this.add.text(x + 40, y + h / 2, e.emoji, {
      fontFamily: "Fredoka, system-ui", fontSize: "44px",
    }).setOrigin(0.5);
    this._content.add(emoji);

    const name = this.add.text(x + 80, y + 12, e.name, {
      fontFamily: "Fredoka, system-ui", fontSize: "18px", fontStyle: "bold", color: "#ff99dd",
      stroke: "#000", strokeThickness: 3,
    });
    this._content.add(name);

    const stats = this.add.text(x + 80, y + 38, "❤ HP " + e.hp + "   🏃 vitesse " + e.speed, {
      fontFamily: "Fredoka, system-ui", fontSize: "13px", color: "#aaccff",
    });
    this._content.add(stats);

    const desc = this.add.text(x + 80, y + 60, e.desc, {
      fontFamily: "Fredoka, system-ui", fontSize: "12px", color: "#ddeefa",
      wordWrap: { width: w - 92 },
    });
    this._content.add(desc);
  }
}

import * as Phaser from "phaser";

export const TILE_DEFS = [
  { id: "coin", label: "Coin Gen", cost: 50, color: 0xffd23f, accent: 0xc88a00 },
  { id: "lava", label: "Lava Tower", cost: 100, color: 0xff4400, accent: 0xffe066 },
  { id: "water", label: "Water Block", cost: 50, color: 0x4ea3d8, accent: 0x1a4a6a },
  { id: "fan", label: "Fan", cost: 100, color: 0xddeeff, accent: 0x666 },
  { id: "magnet", label: "Magnet Bomb", cost: 150, color: 0x66001a, accent: 0xff2222 },
  { id: "catapult", label: "Catapult", cost: 125, color: 0x6b3a0a, accent: 0x9bd84a },
];

export class Toolbar extends Phaser.GameObjects.Container {
  constructor(scene, y, onSelect, getCoins) {
    super(scene, 0, y);
    this.scene = scene;
    this.onSelect = onSelect;
    this.getCoins = getCoins ?? (() => 0);
    this.selectedId = null;

    const w = scene.scale.width;
    const h = 100;
    const bg = scene.add.rectangle(w / 2, 0, w, h, 0x141826).setStrokeStyle(2, 0x2a3050).setOrigin(0.5, 0);
    this.add(bg);

    this.buttons = [];
    const btnW = 130;
    const btnH = 84;
    const totalW = TILE_DEFS.length * (btnW + 12) - 12;
    const startX = w / 2 - totalW / 2;

    TILE_DEFS.forEach((def, i) => {
      const x = startX + i * (btnW + 12) + btnW / 2;
      const btn = this.makeButton(def, x, h / 2, btnW, btnH);
      this.buttons.push(btn);
      this.add(btn);
    });

    scene.add.existing(this);
    this.setDepth(50);

    scene.events.on("update", () => this.refreshAfford());
  }

  makeButton(def, x, y, w, h) {
    const c = this.scene.add.container(x, y);

    const back = this.scene.add.rectangle(0, 0, w, h, 0x222840).setStrokeStyle(2, 0x4a4a6a);
    const icon = this.scene.add.rectangle(0, -14, 36, 30, def.color).setStrokeStyle(2, def.accent);
    const label = this.scene.add.text(0, 18, def.label, {
      fontFamily: "system-ui",
      fontSize: "12px",
      color: "#dde",
    }).setOrigin(0.5);
    const costLabel = this.scene.add.text(0, 34, def.cost + " ¢", {
      fontFamily: "system-ui",
      fontSize: "13px",
      fontStyle: "bold",
      color: "#ffd23f",
    }).setOrigin(0.5);

    c.add([back, icon, label, costLabel]);
    c.setSize(w, h);
    c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    c._defId = def.id;
    c._back = back;
    c._icon = icon;
    c._costLabel = costLabel;
    c._def = def;
    c._affordable = true;

    c.on("pointerover", () => {
      if (this.selectedId !== def.id && c._affordable) back.setStrokeStyle(2, 0xffd23f);
    });
    c.on("pointerout", () => {
      if (this.selectedId !== def.id) back.setStrokeStyle(2, c._affordable ? 0x4a4a6a : 0x6a2222);
    });
    c.on("pointerdown", () => {
      if (!c._affordable) return;
      this.select(def.id);
    });

    return c;
  }

  refreshAfford() {
    const coins = this.getCoins();
    for (const b of this.buttons) {
      const can = coins >= b._def.cost;
      if (can === b._affordable) continue;
      b._affordable = can;
      b._icon.setAlpha(can ? 1 : 0.4);
      b._costLabel.setColor(can ? "#ffd23f" : "#ff8888");
      if (this.selectedId !== b._defId) {
        b._back.setStrokeStyle(2, can ? 0x4a4a6a : 0x6a2222);
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
}

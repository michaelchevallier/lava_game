import * as Phaser from "phaser";

const TILE_DEFS = [
  { id: "lava", label: "Lava Tower", color: 0xff4400, accent: 0xffe066 },
];

export class Toolbar extends Phaser.GameObjects.Container {
  constructor(scene, y, onSelect) {
    super(scene, 0, y);
    this.scene = scene;
    this.onSelect = onSelect;
    this.selectedId = null;

    const w = scene.scale.width;
    const h = 100;
    const bg = scene.add.rectangle(w / 2, 0, w, h, 0x141826).setStrokeStyle(2, 0x2a3050).setOrigin(0.5, 0);
    this.add(bg);

    this.buttons = [];
    const btnW = 110;
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
  }

  makeButton(def, x, y, w, h) {
    const c = this.scene.add.container(x, y);

    const back = this.scene.add.rectangle(0, 0, w, h, 0x222840).setStrokeStyle(2, 0x4a4a6a);
    const icon = this.scene.add.rectangle(0, -10, 36, 30, def.color).setStrokeStyle(2, def.accent);
    const label = this.scene.add.text(0, 28, def.label, {
      fontFamily: "system-ui",
      fontSize: "13px",
      color: "#dde",
    }).setOrigin(0.5);

    c.add([back, icon, label]);
    c.setSize(w, h);
    c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    c._defId = def.id;
    c._back = back;
    c._def = def;

    c.on("pointerover", () => {
      if (this.selectedId !== def.id) back.setStrokeStyle(2, 0xffd23f);
    });
    c.on("pointerout", () => {
      if (this.selectedId !== def.id) back.setStrokeStyle(2, 0x4a4a6a);
    });
    c.on("pointerdown", () => this.select(def.id));

    return c;
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
      b._back.setStrokeStyle(isSel ? 3 : 2, isSel ? 0xffd23f : 0x4a4a6a);
      b._back.setFillStyle(isSel ? 0x33405a : 0x222840);
    }
  }

  clearSelection() {
    if (this.selectedId == null) return;
    this.selectedId = null;
    this.refreshButtons();
  }
}

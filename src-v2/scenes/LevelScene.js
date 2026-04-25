import * as Phaser from "phaser";
import { Visitor } from "../entities/Visitor.js";
import { LavaTower } from "../entities/LavaTower.js";

const LANE_Y = 420;
const SPAWN_X = 1340;
const HOUSE_X = 60;

export class LevelScene extends Phaser.Scene {
  constructor() {
    super("LevelScene");
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, 0, width, 360, 0x6ec1e4).setOrigin(0.5, 0);
    this.add.rectangle(width / 2, 360, width, height - 360, 0x4a8a3a).setOrigin(0.5, 0);

    this.add.rectangle(width / 2, LANE_Y + 50, width, 80, 0x3a6a2a).setOrigin(0.5, 0.5);
    for (let i = 0; i < 16; i++) {
      this.add.rectangle(80 + i * 80, LANE_Y + 50, 4, 80, 0x244a1a, 0.5);
    }

    this.add.rectangle(HOUSE_X, LANE_Y, 60, 80, 0xff6b1c).setStrokeStyle(3, 0x8a3a0a);
    this.add.text(HOUSE_X, LANE_Y - 60, "SORTIE", {
      fontFamily: "system-ui",
      fontSize: "16px",
      color: "#fff",
      stroke: "#000",
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.rectangle(SPAWN_X - 20, LANE_Y, 60, 80, 0x4a4a4a).setStrokeStyle(3, 0x222);
    this.add.text(SPAWN_X - 20, LANE_Y - 60, "ENTRÉE", {
      fontFamily: "system-ui",
      fontSize: "16px",
      color: "#fff",
      stroke: "#000",
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.escaped = 0;
    this.killed = 0;
    this.visitors = [];
    this.projectiles = [];
    this.towers = [];

    this.scoreText = this.add.text(20, 20, "Échappés : 0", {
      fontFamily: "system-ui",
      fontSize: "20px",
      color: "#ffaaaa",
      stroke: "#000",
      strokeThickness: 4,
    });
    this.killText = this.add.text(20, 50, "Tués : 0", {
      fontFamily: "system-ui",
      fontSize: "20px",
      color: "#90ff90",
      stroke: "#000",
      strokeThickness: 4,
    });

    this.add.text(this.scale.width / 2, 20, "Sprint 1b — Lava Tower tire sur les visiteurs", {
      fontFamily: "system-ui",
      fontSize: "16px",
      color: "#ffd23f",
    }).setOrigin(0.5, 0);

    this.events.on("visitor-escaped", () => {
      this.escaped++;
      this.scoreText.setText("Échappés : " + this.escaped);
    });
    this.events.on("visitor-killed", () => {
      this.killed++;
      this.killText.setText("Tués : " + this.killed);
    });

    this.events.on("update", () => {
      this.visitors = this.visitors.filter((v) => v.active);
      this.projectiles = this.projectiles.filter((p) => p.active);
      this.checkProjectileHits();
    });

    const tower = new LavaTower(this, 280, LANE_Y - 5, { fireRate: 1500, damage: 1 });
    this.towers.push(tower);

    this.time.addEvent({
      delay: 2500,
      loop: true,
      callback: () => this.spawnVisitor(),
    });

    this.spawnVisitor();
  }

  spawnVisitor() {
    const v = new Visitor(this, SPAWN_X, LANE_Y, { hp: 1, speed: 60 });
    this.visitors.push(v);
  }

  checkProjectileHits() {
    for (const proj of this.projectiles) {
      if (!proj.active || proj._dead) continue;
      for (const v of this.visitors) {
        if (!v.active || v._dying) continue;
        const dx = proj.x - v.x;
        const dy = proj.y - v.y;
        if (Math.abs(dy) > 40) continue;
        if (Math.abs(dx) > 18) continue;
        proj.hit(v);
        break;
      }
    }
  }
}

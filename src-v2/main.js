import * as Phaser from "phaser";
import { BootScene } from "./scenes/BootScene.js";
import { CampaignMenuScene } from "./scenes/CampaignMenuScene.js";
import { LevelScene } from "./scenes/LevelScene.js";
import { LevelResultScene } from "./scenes/LevelResultScene.js";

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: 1280,
  height: 720,
  backgroundColor: "#1a1f30",
  pixelArt: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scene: [BootScene, CampaignMenuScene, LevelScene, LevelResultScene],
};

new Phaser.Game(config);

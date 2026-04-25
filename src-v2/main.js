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

const game = new Phaser.Game(config);
window.__game = game;

const resumeAudioOnce = () => {
  import("./systems/Audio.js").then((m) => m.Audio.resume());
  window.removeEventListener("pointerdown", resumeAudioOnce);
  window.removeEventListener("keydown", resumeAudioOnce);
};
window.addEventListener("pointerdown", resumeAudioOnce);
window.addEventListener("keydown", resumeAudioOnce);

window.__pd_scene = () => game.scene.scenes.find((s) => s.scene.key === "LevelScene" && s.scene.isActive());

window.__pd_place = (toolId, col, row) => {
  const scene = window.__pd_scene();
  if (!scene) return "no LevelScene active";
  const def = (scene.toolbar?.constructor?.TILE_DEFS) ||
    [
      { id: "coin", cost: 50, color: 0xffd23f, accent: 0xc88a00 },
      { id: "lava", cost: 100, color: 0xff4400, accent: 0xffe066 },
      { id: "water", cost: 50, color: 0x4ea3d8, accent: 0x1a4a6a },
      { id: "fan", cost: 100, color: 0xddeeff, accent: 0x666666 },
      { id: "magnet", cost: 150, color: 0x66001a, accent: 0xff2222 },
      { id: "catapult", cost: 125, color: 0x6b3a0a, accent: 0x9bd84a },
    ];
  const d = def.find((x) => x.id === toolId);
  if (!d) return "unknown tool " + toolId;
  scene.placementDef = d;
  const px = 100 + col * 90 + 45;
  const py = 130 + row * 90 + 45;
  scene.tryPlace({ x: px, y: py });
  return scene.coins;
};

window.__pd_stats = () => {
  const scene = window.__pd_scene();
  if (!scene) return null;
  return {
    levelId: scene.level?.id,
    coins: scene.coins,
    killed: scene.killed,
    escaped: scene.escaped,
    visitorsAlive: scene.visitors?.length,
    towersPlaced: scene.towers?.length,
    waveAllSpawned: scene.waveManager?.allSpawned,
    waveSpawned: scene.waveManager?.spawnedCount(),
    waveTotal: scene.waveManager?.totalVisitors(),
    gameOver: scene.gameOver,
  };
};

window.__pd_goto = (levelId) => {
  for (const s of game.scene.scenes) {
    if (s.scene.isActive() && s.scene.key !== "BootScene") {
      game.scene.stop(s.scene.key);
    }
  }
  game.scene.start("LevelScene", { levelId });
};

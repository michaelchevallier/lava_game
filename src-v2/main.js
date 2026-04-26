import * as Phaser from "phaser";
import { BootScene } from "./scenes/BootScene.js";
import { CampaignMenuScene } from "./scenes/CampaignMenuScene.js";
import { LevelScene } from "./scenes/LevelScene.js";
import { LevelResultScene } from "./scenes/LevelResultScene.js";
import { TrophyScene } from "./scenes/TrophyScene.js";
import { TILE_DEFS } from "./ui/Toolbar.js";
import { MusicManager } from "./systems/MusicManager.js";

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
  scene: [BootScene, CampaignMenuScene, LevelScene, LevelResultScene, TrophyScene],
};

const game = new Phaser.Game(config);
window.__game = game;

const resumeAudioOnce = () => {
  import("./systems/Audio.js").then((m) => m.Audio.resume());
  MusicManager.resume();
  MusicManager.play("menu");
  window.removeEventListener("pointerdown", resumeAudioOnce);
  window.removeEventListener("keydown", resumeAudioOnce);
};
window.addEventListener("pointerdown", resumeAudioOnce);
window.addEventListener("keydown", resumeAudioOnce);

window.__pd_scene = () => game.scene.scenes.find((s) => s.scene.key === "LevelScene" && s.scene.isActive());

window.__pd_place = (toolId, col, row) => {
  const scene = window.__pd_scene();
  if (!scene) return "no LevelScene active";
  const d = TILE_DEFS.find((x) => x.id === toolId);
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

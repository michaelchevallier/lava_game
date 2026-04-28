import * as Phaser from "phaser";
import { BootScene } from "./scenes/BootScene.js";
import { CampaignMenuScene } from "./scenes/CampaignMenuScene.js";
import { LevelScene } from "./scenes/LevelScene.js";
import { LevelResultScene } from "./scenes/LevelResultScene.js";
import { TrophyScene } from "./scenes/TrophyScene.js";
import { CutsceneScene } from "./scenes/CutsceneScene.js";
import { StatsScene } from "./scenes/StatsScene.js";
import { FairgroundHubScene } from "./scenes/FairgroundHubScene.js";
import { FairgroundScene } from "./scenes/FairgroundScene.js";
import { SkinsScene } from "./scenes/SkinsScene.js";
import { EncyclopediaScene } from "./scenes/EncyclopediaScene.js";
import { TILE_DEFS } from "./ui/Toolbar.js";
import { MusicManager } from "./systems/MusicManager.js";
import { loadSave } from "./systems/SaveSystem.js";

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
  scene: [BootScene, CampaignMenuScene, LevelScene, LevelResultScene, TrophyScene, CutsceneScene, StatsScene, FairgroundHubScene, FairgroundScene, SkinsScene, EncyclopediaScene],
};

const game = new Phaser.Game(config);
window.__game = game;

const resumeAudioOnce = () => {
  const save = loadSave();
  const muted = save.settings?.muted;
  import("./systems/Audio.js").then((m) => {
    m.Audio.resume();
    if (muted) m.Audio.setVolume(0);
  });
  MusicManager.resume();
  if (muted) MusicManager.setVolume(0);
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

window.__pd_unlock_all = () => {
  const KEY = "parkdef:save";
  const allLevels = ["1.1","1.2","1.3","1.4","1.5","1.6","2.1","2.2","2.3","2.4","2.5","2.6","3.1","3.2","3.3","3.4","3.5","3.6","4.1","4.2","4.3","4.4","4.5","4.6","5.1","5.2","5.3","5.4","5.5","5.6","6.1","6.2","6.3","6.4","6.5","6.6","7.1","7.2","7.3","7.4","7.5","7.6","8.1","8.2","8.3","8.4","8.5","8.6","9.1","9.2","9.3","9.4","9.5","9.6","10.1","10.2","10.3","10.4","10.5","10.6","c.1","c.2","c.3","c.4","c.5","boss-arena"];
  const allTrophies = ["first_kill","kills_50","kills_500","kills_2000","first_star","stars_15","stars_45","world1_done","boss_magic","boss_queen","boss_patron","endless_wave5","endless_wave10","tickets_10","no_escape","daily_first","daily_streak_3","world_espace","world_subocean","world_medieval","world_cyberpunk","all_worlds","first_skin","narrative_choice"];
  const save = {
    version: 1,
    levels: {},
    trophies: {},
    cutscenesSeen: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true },
    totalKills: 5000,
    totalTickets: 50,
    settings: { volume: 0.7, muted: false },
    daily: {},
    endless: { runs: [{ score: 200, wave: 12, ts: Date.now() }] },
  };
  for (const id of allLevels) save.levels[id] = { stars: 3, completed: true };
  for (const t of allTrophies) save.trophies[t] = Date.now();
  localStorage.setItem(KEY, JSON.stringify(save));
  location.reload();
  return "🔓 Tout débloqué — reload en cours";
};

window.__pd_reset = () => {
  localStorage.removeItem("parkdef:save");
  location.reload();
  return "🗑 Save reset — reload en cours";
};

window.__pd_speed = (factor) => {
  const s = window.__pd_scene();
  if (!s) return "no LevelScene active";
  s._gameSpeed = Math.max(0.1, Math.min(50, factor));
  return "gameSpeed = " + s._gameSpeed;
};

window.__pd_goto = (levelId) => {
  for (const s of game.scene.scenes) {
    if (s.scene.isActive() && s.scene.key !== "BootScene") {
      game.scene.stop(s.scene.key);
    }
  }
  game.scene.start("LevelScene", { levelId });
};

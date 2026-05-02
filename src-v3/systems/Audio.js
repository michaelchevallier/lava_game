const BASE = (import.meta.env?.BASE_URL || "/") + "audio/sfx/";

const SFX_FILES = {
  hero_shoot: "hero_shoot.ogg",
  tower_shoot: "tower_shoot.ogg",
  enemy_hit: "enemy_hit.ogg",
  enemy_die_basic: "enemy_die_basic.ogg",
  enemy_die_medium: "enemy_die_medium.ogg",
  enemy_die_boss: "enemy_die_boss.ogg",
  tower_built: "tower_built.ogg",
  tower_upgrade: "tower_upgrade.ogg",
  wave_start: "wave_start.ogg",
  castle_hit: "castle_hit.ogg",
  coin_pickup: "coin_pickup.ogg",
  gem_gain: "gem_gain.ogg",
  achievement: "achievement.ogg",
  perk_pick: "perk_pick.ogg",
  skin_equip: "skin_equip.ogg",
  boom: "boom.ogg",
  boss_charge: "boss_charge.ogg",
  level_up: "level_up.ogg",
  wave_clear: "wave_clear.ogg",
  blue_pill: "blue_pill.ogg",
};

const POOL_SIZE = 4;
const pool = {};
const cursor = {};
let muted = false;
let masterVol = 0.5;
let started = false;

function ensurePool(name) {
  if (pool[name]) return pool[name];
  const file = SFX_FILES[name];
  if (!file) return null;
  const arr = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const a = new Audio(BASE + file);
    a.preload = "auto";
    a.volume = 0;
    arr.push(a);
  }
  pool[name] = arr;
  cursor[name] = 0;
  return arr;
}

function play(name, volMul = 1) {
  if (muted) return;
  const arr = ensurePool(name);
  if (!arr) return;
  const idx = cursor[name];
  cursor[name] = (idx + 1) % POOL_SIZE;
  const a = arr[idx];
  try {
    a.currentTime = 0;
    a.volume = Math.min(1, masterVol * volMul);
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
}

export const Audio = {
  isMuted() { return muted; },
  setMuted(m) {
    muted = !!m;
    document.dispatchEvent(new CustomEvent("crowdef:audio-muted", { detail: { muted } }));
  },
  toggleMuted() { this.setMuted(!muted); return muted; },
  setVolume(v) { masterVol = Math.max(0, Math.min(1, v)); },
  resume() {},
  start() {
    if (started) return;
    started = true;
    for (const name of Object.keys(SFX_FILES)) ensurePool(name);
  },

  sfxHeroShoot()   { play("hero_shoot", 0.6); },
  sfxTowerShoot()  { play("tower_shoot", 0.7); },
  sfxEnemyHit()    { play("enemy_hit", 0.55); },
  sfxEnemyDie(tier = "basic") {
    if (tier === "boss") play("enemy_die_boss", 1.0);
    else if (tier === "elite" || tier === "medium") play("enemy_die_medium", 0.85);
    else play("enemy_die_basic", 0.7);
  },
  sfxTowerBuilt() { play("tower_built", 0.9); },
  sfxTowerUpgrade() { play("tower_upgrade", 0.9); },
  sfxWaveStart()  { play("wave_start", 0.85); },
  sfxCastleHit()  { play("castle_hit", 0.9); },
  sfxLevelWon()   { play("achievement", 1.0); },
  sfxLevelLost()  { play("boom", 0.8); },
  sfxCoinPickup() { play("coin_pickup", 0.5); },
  sfxGemGain()    { play("gem_gain", 0.7); },
  sfxAchievement() { play("achievement", 1.0); },
  sfxPerkPick()   { play("perk_pick", 0.85); },
  sfxSkinEquip()  { play("skin_equip", 0.7); },
  sfxBoom()       { play("boom", 0.95); },
  sfxBossCharge() { play("boss_charge", 0.85); },
  sfxLevelUp()    { play("level_up", 0.95); },
  sfxWaveClear()  { play("wave_clear", 0.8); },
  sfxBluePill()   { play("blue_pill", 0.85); },
};

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

let ctx = null;
let masterGain = null;
let muted = false;
let masterVol = 0.5;
let started = false;
const buffers = {};
const lastPlayTime = {};
const MIN_REPLAY_INTERVAL_MS = 28;

function ensureCtx() {
  if (ctx) return ctx;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : masterVol;
    masterGain.connect(ctx.destination);
  } catch (e) {
    ctx = null;
  }
  return ctx;
}

async function loadBuffer(name) {
  const file = SFX_FILES[name];
  if (!file) return null;
  if (buffers[name]) return buffers[name];
  const c = ensureCtx();
  if (!c) return null;
  try {
    const res = await fetch(BASE + file);
    const ab = await res.arrayBuffer();
    const buf = await c.decodeAudioData(ab);
    buffers[name] = buf;
    return buf;
  } catch (e) {
    return null;
  }
}

function play(name, volMul = 1) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume?.();
  const buf = buffers[name];
  if (!buf) {
    loadBuffer(name);
    return;
  }
  const now = performance.now();
  const last = lastPlayTime[name] || 0;
  if (now - last < MIN_REPLAY_INTERVAL_MS) return;
  lastPlayTime[name] = now;
  try {
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.value = Math.min(1, volMul);
    src.connect(g);
    g.connect(masterGain);
    src.start(0);
  } catch (e) {}
}

export const Audio = {
  isMuted() { return muted; },
  setMuted(m) {
    muted = !!m;
    if (masterGain) masterGain.gain.value = muted ? 0 : masterVol;
    document.dispatchEvent(new CustomEvent("crowdef:audio-muted", { detail: { muted } }));
  },
  toggleMuted() { this.setMuted(!muted); return muted; },
  setVolume(v) {
    masterVol = Math.max(0, Math.min(1, v));
    if (masterGain && !muted) masterGain.gain.value = masterVol;
  },
  resume() { ensureCtx()?.resume?.(); },
  start() {
    if (started) return;
    started = true;
    ensureCtx();
    for (const name of Object.keys(SFX_FILES)) loadBuffer(name);
  },

  sfxHeroShoot()   { play("hero_shoot", 0.45); },
  sfxTowerShoot()  { play("tower_shoot", 0.55); },
  sfxEnemyHit()    { play("enemy_hit", 0.4); },
  sfxEnemyDie(tier = "basic") {
    if (tier === "boss") play("enemy_die_boss", 0.9);
    else if (tier === "elite" || tier === "medium") play("enemy_die_medium", 0.7);
    else play("enemy_die_basic", 0.55);
  },
  sfxTowerBuilt() { play("tower_built", 0.7); },
  sfxTowerUpgrade() { play("tower_upgrade", 0.7); },
  sfxWaveStart()  { play("wave_start", 0.7); },
  sfxCastleHit()  { play("castle_hit", 0.8); },
  sfxLevelWon()   { play("achievement", 0.85); },
  sfxLevelLost()  { play("boom", 0.7); },
  sfxCoinPickup() { play("coin_pickup", 0.4); },
  sfxGemGain()    { play("gem_gain", 0.55); },
  sfxAchievement() { play("achievement", 0.85); },
  sfxPerkPick()   { play("perk_pick", 0.7); },
  sfxSkinEquip()  { play("skin_equip", 0.55); },
  sfxBoom()       { play("boom", 0.85); },
  sfxBossCharge() { play("boss_charge", 0.7); },
  sfxLevelUp()    { play("level_up", 0.8); },
  sfxWaveClear()  { play("wave_clear", 0.65); },
  sfxBluePill()   { play("blue_pill", 0.7); },
};

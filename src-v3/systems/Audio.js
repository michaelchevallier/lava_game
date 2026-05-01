let ctx = null;
let masterGain = null;
let muted = false;
let started = false;

function ensureCtx() {
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(ctx.destination);
  } catch (e) {
    ctx = null;
  }
  return ctx;
}

function tone(freq, duration, type = "sine", gain = 0.2, attack = 0.01, release = 0.1) {
  const c = ensureCtx();
  if (!c || muted) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t0 = c.currentTime;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + attack);
  g.gain.linearRampToValueAtTime(0, t0 + duration + release);
  o.connect(g);
  g.connect(masterGain);
  o.start(t0);
  o.stop(t0 + duration + release + 0.05);
}

function sweepTone(fStart, fEnd, duration, type = "sawtooth", gain = 0.18) {
  const c = ensureCtx();
  if (!c || muted) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  const t0 = c.currentTime;
  o.frequency.setValueAtTime(fStart, t0);
  o.frequency.linearRampToValueAtTime(fEnd, t0 + duration);
  g.gain.setValueAtTime(gain, t0);
  g.gain.linearRampToValueAtTime(0, t0 + duration);
  o.connect(g);
  g.connect(masterGain);
  o.start(t0);
  o.stop(t0 + duration + 0.05);
}

function noise(duration, gain = 0.15, filterFreq = 1200) {
  const c = ensureCtx();
  if (!c || muted) return;
  const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  const g = c.createGain();
  const t0 = c.currentTime;
  g.gain.setValueAtTime(gain, t0);
  g.gain.linearRampToValueAtTime(0, t0 + duration);
  src.buffer = buf;
  src.connect(filter);
  filter.connect(g);
  g.connect(masterGain);
  src.start(t0);
  src.stop(t0 + duration);
}

function seq(notes) {
  const c = ensureCtx();
  if (!c || muted) return;
  notes.forEach((n, i) => {
    setTimeout(() => tone(n.f, n.d || 0.12, n.type || "square", n.g ?? 0.2), (n.delay ?? i * 90));
  });
}

export const Audio = {
  isMuted() { return muted; },
  setMuted(m) {
    muted = !!m;
    document.dispatchEvent(new CustomEvent("crowdef:audio-muted", { detail: { muted } }));
  },
  toggleMuted() { this.setMuted(!muted); return muted; },
  setVolume(v) { ensureCtx(); if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, v)); },
  resume() { ensureCtx()?.resume?.(); },
  start() { if (started) return; started = true; this.resume(); },

  sfxHeroShoot()   { tone(820, 0.04, "square", 0.10); },
  sfxTowerShoot()  { sweepTone(680, 380, 0.10, "sawtooth", 0.16); },
  sfxEnemyHit()    { tone(380, 0.04, "sawtooth", 0.14); },
  sfxEnemyDie(tier = "basic") {
    if (tier === "boss") {
      noise(0.25, 0.28, 300); tone(160, 0.20, "sawtooth", 0.22); setTimeout(() => tone(100, 0.30, "sawtooth", 0.18), 120); setTimeout(() => tone(60, 0.35, "sawtooth", 0.14), 280);
    } else if (tier === "brute") {
      noise(0.15, 0.22, 500); tone(140, 0.18, "sawtooth", 0.20); setTimeout(() => sweepTone(200, 80, 0.20, "sawtooth", 0.16), 80);
    } else {
      noise(0.08, 0.18, 1200); tone(320, 0.08, "sawtooth", 0.14);
    }
  },
  sfxTowerBuilt()  { seq([{ f: 660, d: 0.10 }, { f: 880, d: 0.10 }, { f: 1175, d: 0.14 }]); },
  sfxWaveStart()   { noise(0.10, 0.22, 200); tone(140, 0.20, "sawtooth", 0.20); },
  sfxCastleHit()   { noise(0.20, 0.30, 300); tone(70, 0.30, "sawtooth", 0.22); },
  sfxLevelWon()    { seq([{ f: 659, d: 0.18 }, { f: 784, d: 0.18, delay: 130 }, { f: 988, d: 0.18, delay: 280 }, { f: 1318, d: 0.30, delay: 430 }]); },
  sfxLevelLost()   { tone(220, 0.40, "sawtooth", 0.20); setTimeout(() => tone(160, 0.50, "sawtooth", 0.20), 200); setTimeout(() => tone(110, 0.60, "sawtooth", 0.18), 480); },

  sfxGemGain()     { seq([{ f: 1100, d: 0.06, type: "sine", g: 0.18 }, { f: 1480, d: 0.08, type: "sine", g: 0.18, delay: 50 }, { f: 1760, d: 0.14, type: "sine", g: 0.20, delay: 130 }]); },
  sfxAchievement() { seq([{ f: 523, d: 0.10, type: "triangle", g: 0.22 }, { f: 659, d: 0.10, type: "triangle", g: 0.22, delay: 90 }, { f: 784, d: 0.10, type: "triangle", g: 0.22, delay: 180 }, { f: 1046, d: 0.30, type: "triangle", g: 0.26, delay: 280 }]); },
  sfxPerkPick()    { seq([{ f: 783, d: 0.08, type: "triangle", g: 0.18 }, { f: 1175, d: 0.18, type: "triangle", g: 0.20, delay: 70 }]); },
  sfxSkinEquip()   { tone(880, 0.10, "sine", 0.16); setTimeout(() => tone(1175, 0.14, "sine", 0.16), 80); },
  sfxBoom()        { tone(80, 0.15, "triangle", 0.22); noise(0.10, 0.28, 400); },
  sfxBossCharge()  { sweepTone(60, 220, 0.30, "sawtooth", 0.22); },
  sfxLevelUp()     { seq([{ f: 659, d: 0.10, type: "triangle", g: 0.18 }, { f: 880, d: 0.10, type: "triangle", g: 0.20, delay: 80 }, { f: 1175, d: 0.10, type: "triangle", g: 0.22, delay: 160 }, { f: 1568, d: 0.18, type: "triangle", g: 0.24, delay: 240 }]); },
  sfxWaveClear()   { tone(880, 0.15, "square", 0.18); setTimeout(() => tone(1320, 0.15, "square", 0.18), 160); },
};

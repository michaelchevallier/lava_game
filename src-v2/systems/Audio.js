let ctx = null;
let masterGain = null;
let muted = false;

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

export const Audio = {
  setMuted(m) { muted = !!m; },
  setVolume(v) { if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, v)); },
  resume() { ensureCtx()?.resume?.(); },

  place() { tone(180, 0.04, "square", 0.18); },
  coin()  { tone(988, 0.06, "square", 0.18); setTimeout(() => tone(1318, 0.08, "square", 0.18), 60); },
  gold()  { tone(1320, 0.08, "square", 0.16); setTimeout(() => tone(1760, 0.08, "square", 0.16), 80); setTimeout(() => tone(2093, 0.1, "square", 0.16), 160); },
  hit()   { tone(440, 0.05, "sawtooth", 0.18); },
  fire()  { tone(800, 0.05, "square", 0.13); },
  kill()  { tone(220, 0.18, "sawtooth", 0.2); setTimeout(() => tone(110, 0.16, "sawtooth", 0.18), 80); },
  explode(){ noise(0.35, 0.3, 600); tone(80, 0.3, "sawtooth", 0.2); },
  win()   { const seq = [659, 784, 988, 1318]; seq.forEach((f, i) => setTimeout(() => tone(f, 0.18, "square", 0.2), i * 110)); },
  lose()  { tone(220, 0.4, "sawtooth", 0.2); setTimeout(() => tone(160, 0.5, "sawtooth", 0.2), 200); },
  click() { tone(600, 0.04, "square", 0.12); },
  ui()    { tone(880, 0.04, "sine", 0.1); },
};

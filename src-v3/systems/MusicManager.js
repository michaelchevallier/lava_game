let ctx = null;
let musicGain = null;
let currentTrack = null;
let currentNodes = [];
let musicVolume = 0.35;
let muted = false;
let scheduledTimers = [];

function ensureCtx() {
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(ctx.destination);
  } catch (e) {
    ctx = null;
  }
  return ctx;
}

function fadeTo(target, ms = 800) {
  if (!musicGain) return;
  const t0 = ctx.currentTime;
  const cur = musicGain.gain.value;
  musicGain.gain.cancelScheduledValues(t0);
  musicGain.gain.setValueAtTime(cur, t0);
  musicGain.gain.linearRampToValueAtTime(target, t0 + ms / 1000);
}

function disposeNodes() {
  for (const n of currentNodes) {
    try { n.stop?.(); } catch (e) {}
    try { n.disconnect?.(); } catch (e) {}
  }
  currentNodes = [];
  for (const t of scheduledTimers) clearTimeout(t);
  scheduledTimers = [];
}

function makePadOsc(freq, type = "sine", gainVal = 0.06, detuneCents = 0) {
  const c = ensureCtx();
  if (!c) return null;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  o.detune.value = detuneCents;
  g.gain.value = gainVal;
  o.connect(g);
  g.connect(musicGain);
  o.start();
  currentNodes.push(o);
  currentNodes.push(g);
  return { osc: o, gain: g };
}

function scheduleArpeggio(freqs, intervalMs, gainVal = 0.08, type = "triangle") {
  let i = 0;
  const tick = () => {
    if (currentTrack === null) return;
    const c = ensureCtx();
    if (!c || muted) {
      scheduledTimers.push(setTimeout(tick, intervalMs));
      return;
    }
    const f = freqs[i % freqs.length];
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = f;
    const t0 = c.currentTime;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gainVal, t0 + 0.04);
    g.gain.linearRampToValueAtTime(0, t0 + intervalMs / 1000 * 0.85);
    o.connect(g);
    g.connect(musicGain);
    o.start(t0);
    o.stop(t0 + intervalMs / 1000 + 0.1);
    i++;
    scheduledTimers.push(setTimeout(tick, intervalMs));
  };
  tick();
}

function scheduleDrumPattern(bpm = 110) {
  const beatMs = 60000 / bpm;
  let beat = 0;
  const kick = () => {
    const c = ensureCtx();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    const t0 = c.currentTime;
    o.frequency.setValueAtTime(120, t0);
    o.frequency.exponentialRampToValueAtTime(40, t0 + 0.08);
    g.gain.setValueAtTime(0.3, t0);
    g.gain.linearRampToValueAtTime(0, t0 + 0.1);
    o.connect(g);
    g.connect(musicGain);
    o.start(t0);
    o.stop(t0 + 0.15);
  };
  const hat = () => {
    const c = ensureCtx();
    if (!c) return;
    const buf = c.createBuffer(1, c.sampleRate * 0.04, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = c.createBufferSource();
    const flt = c.createBiquadFilter();
    flt.type = "highpass";
    flt.frequency.value = 4000;
    const g = c.createGain();
    g.gain.value = 0.05;
    src.buffer = buf;
    src.connect(flt);
    flt.connect(g);
    g.connect(musicGain);
    src.start();
  };
  const tick = () => {
    if (currentTrack === null) return;
    if (!muted) {
      if (beat % 4 === 0 || beat % 4 === 2) kick();
      if (beat % 2 === 1) hat();
    }
    beat++;
    scheduledTimers.push(setTimeout(tick, beatMs));
  };
  tick();
}

const TRACKS = {
  menu() {
    makePadOsc(196.0, "sine", 0.05);
    makePadOsc(293.66, "sine", 0.04);
    makePadOsc(392.0, "triangle", 0.03);
    makePadOsc(196.0, "sine", 0.03, 7);
    scheduleArpeggio([523.25, 587.33, 659.25, 783.99, 659.25, 587.33], 350, 0.06, "triangle");
  },
  calm() {
    makePadOsc(220.0, "sine", 0.06);
    makePadOsc(329.63, "sine", 0.04);
    makePadOsc(440.0, "triangle", 0.025);
    makePadOsc(220.0, "sine", 0.03, -8);
    scheduleArpeggio([880.0, 1046.5, 1318.5, 1046.5], 600, 0.04, "sine");
  },
  intense() {
    makePadOsc(110.0, "sawtooth", 0.05);
    makePadOsc(146.83, "sawtooth", 0.04);
    makePadOsc(220.0, "square", 0.025);
    scheduleArpeggio([220.0, 277.18, 329.63, 220.0, 415.30, 329.63], 200, 0.08, "square");
    scheduleDrumPattern(120);
  },
  boss() {
    makePadOsc(73.42, "sawtooth", 0.10);
    makePadOsc(98.0, "sawtooth", 0.07);
    makePadOsc(155.56, "sawtooth", 0.05);
    makePadOsc(73.42, "square", 0.04, 12);
    scheduleArpeggio([196.0, 233.08, 196.0, 277.18, 246.94, 207.65], 250, 0.10, "sawtooth");
    scheduleDrumPattern(95);
  },
};

export const MusicManager = {
  start() {
    ensureCtx();
  },

  setMusicVolume(v) {
    musicVolume = Math.max(0, Math.min(1, v));
    if (musicGain && currentTrack !== null && !muted) {
      fadeTo(musicVolume, 200);
    }
  },

  getMusicVolume() { return musicVolume; },

  setMuted(m) {
    muted = !!m;
    if (!musicGain) return;
    if (muted) fadeTo(0, 300);
    else if (currentTrack !== null) fadeTo(musicVolume, 600);
  },

  play(trackName) {
    const c = ensureCtx();
    if (!c) return;
    if (currentTrack === trackName) return;
    if (currentTrack !== null) {
      fadeTo(0, 600);
      const oldNodes = currentNodes;
      const oldTimers = scheduledTimers;
      currentNodes = [];
      scheduledTimers = [];
      setTimeout(() => {
        for (const n of oldNodes) {
          try { n.stop?.(); } catch (e) {}
          try { n.disconnect?.(); } catch (e) {}
        }
        for (const t of oldTimers) clearTimeout(t);
      }, 700);
    }
    currentTrack = trackName;
    const builder = TRACKS[trackName];
    if (!builder) {
      currentTrack = null;
      return;
    }
    builder();
    fadeTo(muted ? 0 : musicVolume, 800);
  },

  stop() {
    if (currentTrack === null) return;
    fadeTo(0, 500);
    const oldNodes = currentNodes;
    const oldTimers = scheduledTimers;
    currentTrack = null;
    currentNodes = [];
    scheduledTimers = [];
    setTimeout(() => {
      for (const n of oldNodes) {
        try { n.stop?.(); } catch (e) {}
        try { n.disconnect?.(); } catch (e) {}
      }
      for (const t of oldTimers) clearTimeout(t);
    }, 600);
  },

  getCurrentTrack() { return currentTrack; },
};

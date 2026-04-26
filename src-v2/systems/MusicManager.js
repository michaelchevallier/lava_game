let ctx = null;
let masterGain = null;
let currentTrack = null;
let currentFadeGain = null;
let loopTimer = null;
let activeNodes = [];
let storedVolume = 0.5;
let initialized = false;

function ensureCtx() {
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = storedVolume;
    masterGain.connect(ctx.destination);
  } catch (e) {
    ctx = null;
  }
  return ctx;
}

function stopAllNodes() {
  for (const n of activeNodes) {
    try { n.stop(); } catch (_) {}
    try { n.disconnect(); } catch (_) {}
  }
  activeNodes = [];
  if (loopTimer) { clearInterval(loopTimer); loopTimer = null; }
}

function playOsc(freq, type, gainVal, startAt, stopAt, dest) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = gainVal;
  o.connect(g);
  g.connect(dest);
  o.start(startAt);
  o.stop(stopAt);
  activeNodes.push(o);
}

function playNoiseHit(startAt, dest) {
  const dur = 0.08;
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 2000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.18, startAt);
  g.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
  src.buffer = buf;
  src.connect(filter);
  filter.connect(g);
  g.connect(dest);
  src.start(startAt);
  src.stop(startAt + dur);
  activeNodes.push(src);
}

const TRACKS = {
  menu: {
    bpm: 80,
    barBeat: 16,
    loop(dest, t0) {
      // Ré mineur arpège: D3 F3 A3 C4 D4 F4 A4 C5
      const notes = [146.83, 174.61, 220.0, 261.63, 293.66, 349.23, 440.0, 523.25];
      const beat = 60 / 80;
      const pattern = [0, 2, 4, 7, 4, 2, 0, 5, 2, 5, 7, 9, 7, 5, 2, 0];
      for (let i = 0; i < pattern.length; i++) {
        const freq = notes[pattern[i] % notes.length];
        const start = t0 + i * beat;
        playOsc(freq, "sine", 0.12, start, start + beat * 0.9, dest);
      }
      // Delay echo layer (offset 0.08s, lower volume)
      for (let i = 0; i < pattern.length; i++) {
        const freq = notes[pattern[i] % notes.length];
        const start = t0 + i * beat + 0.08;
        playOsc(freq, "sine", 0.045, start, start + beat * 0.85, dest);
      }
      // Drone bass D2
      playOsc(73.42, "sine", 0.09, t0, t0 + pattern.length * beat, dest);
    },
    duration() { return (60 / 80) * 16; },
  },
  calm: {
    bpm: 100,
    loop(dest, t0) {
      // Do majeur fairground: C4 E4 G4 C5 G4 E4 C4 G3 E3 C3 E3 G3
      const notes = {
        C3: 130.81, E3: 164.81, G3: 196.0,
        C4: 261.63, E4: 329.63, G4: 392.0,
        C5: 523.25,
      };
      const beat = 60 / 100;
      const pattern = ["C4","E4","G4","C5","G4","E4","C4","G3","E3","C3","E3","G3"];
      for (let i = 0; i < pattern.length; i++) {
        const freq = notes[pattern[i]];
        const start = t0 + i * beat;
        playOsc(freq, "square", 0.08, start, start + beat * 0.75, dest);
        playOsc(freq * 2, "sine", 0.04, start, start + beat * 0.6, dest);
      }
      // Bass pulse every 2 beats
      for (let i = 0; i < 6; i++) {
        const start = t0 + i * beat * 2;
        playOsc(65.41, "square", 0.07, start, start + beat * 0.5, dest);
      }
    },
    duration() { return (60 / 100) * 12; },
  },
  intense: {
    bpm: 120,
    loop(dest, t0) {
      const beat = 60 / 120;
      const notes = {
        C3: 130.81, E3: 164.81, G3: 196.0,
        C4: 261.63, E4: 329.63, G4: 392.0,
        A3: 220.0, Bb3: 233.08,
      };
      const pattern = ["C4","G4","E4","G4","C4","A3","G3","A3"];
      for (let i = 0; i < pattern.length; i++) {
        const freq = notes[pattern[i]];
        const start = t0 + i * beat;
        playOsc(freq, "square", 0.09, start, start + beat * 0.65, dest);
        playOsc(freq * 2, "sine", 0.035, start, start + beat * 0.5, dest);
      }
      // Bassline accents
      const bassPattern = [0, 1, 2, 3, 4, 5, 6, 7];
      const bassNotes = [65.41, 65.41, 73.42, 65.41, 65.41, 73.42, 82.41, 65.41];
      for (let i = 0; i < bassPattern.length; i++) {
        const start = t0 + i * beat;
        playOsc(bassNotes[i], "sawtooth", 0.08, start, start + beat * 0.45, dest);
      }
      // Percussion: noise hit on beats 0, 2, 4, 6
      for (let b = 0; b < 8; b++) {
        if (b % 2 === 0) playNoiseHit(t0 + b * beat, dest);
      }
      // Snare on beats 2 and 6 (lower noise)
      for (const b of [2, 6]) {
        const start = t0 + b * beat;
        const dur = 0.06;
        const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 800;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.14, start);
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        src.buffer = buf;
        src.connect(filter);
        filter.connect(g);
        g.connect(dest);
        src.start(start);
        src.stop(start + dur);
        activeNodes.push(src);
      }
    },
    duration() { return (60 / 120) * 8; },
  },
};

function startTrack(name, fadeGain) {
  const spec = TRACKS[name];
  if (!spec || !ctx) return;

  function scheduleBar() {
    const t0 = ctx.currentTime + 0.05;
    spec.loop(fadeGain, t0);
  }

  scheduleBar();
  const durMs = spec.duration() * 1000;
  loopTimer = setInterval(() => {
    if (!ctx) return;
    scheduleBar();
  }, durMs - 50);
}

export const MusicManager = {
  init() {
    if (initialized) return;
    initialized = true;
    const saved = parseFloat(localStorage.getItem("parkdef:volume") ?? "0.5");
    storedVolume = isNaN(saved) ? 0.5 : Math.max(0, Math.min(1, saved));
    ensureCtx();
  },

  play(track) {
    if (!ensureCtx()) return;
    if (ctx.state === "suspended") ctx.resume();
    if (currentTrack === track) return;

    const fadeOutGain = currentFadeGain;
    const now = ctx.currentTime;
    const FADE = 1.5;

    if (fadeOutGain) {
      fadeOutGain.gain.setValueAtTime(fadeOutGain.gain.value, now);
      fadeOutGain.gain.linearRampToValueAtTime(0, now + FADE);
      stopAllNodes();
    } else {
      stopAllNodes();
    }

    currentTrack = track;

    const fadeGain = ctx.createGain();
    fadeGain.gain.setValueAtTime(0, now);
    fadeGain.gain.linearRampToValueAtTime(1, now + FADE);
    fadeGain.connect(masterGain);
    currentFadeGain = fadeGain;

    startTrack(track, fadeGain);
  },

  stop() {
    stopAllNodes();
    currentTrack = null;
    currentFadeGain = null;
  },

  setVolume(v) {
    storedVolume = Math.max(0, Math.min(1, v));
    localStorage.setItem("parkdef:volume", String(storedVolume));
    if (masterGain) masterGain.gain.value = storedVolume;
  },

  resume() {
    ensureCtx()?.resume?.();
  },

  get currentTrack() { return currentTrack; },
};

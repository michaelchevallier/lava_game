const BASE = (import.meta.env?.BASE_URL || "/") + "audio/music/";

const TRACKS = {
  menu: { url: BASE + "menu_theme.mp3", loop: true, volMul: 0.85 },
  calm: { url: BASE + "gameplay_calm.mp3", loop: true, volMul: 0.75 },
  intense: { url: BASE + "gameplay_intense.mp3", loop: true, volMul: 1.0 },
  boss: { url: BASE + "boss_theme.mp3", loop: true, volMul: 1.1 },
};

const STINGS = {
  victory: { url: BASE + "victory_sting.mp3", volMul: 1.0, duckMs: 4500 },
  defeat: { url: BASE + "defeat_sting.mp3", volMul: 1.0, duckMs: 4500 },
};

let musicVolume = 0.35;
let muted = false;
let currentTrack = null;
let stingDuckUntil = 0;
const audioByTrack = {};
const audioBySting = {};
const fadeStates = {};

function ensureLoopAudio(name) {
  if (audioByTrack[name]) return audioByTrack[name];
  const t = TRACKS[name];
  if (!t) return null;
  try {
    const a = new Audio(t.url);
    a.loop = !!t.loop;
    a.volume = 0;
    a.preload = "auto";
    audioByTrack[name] = a;
    return a;
  } catch (e) {
    return null;
  }
}

function ensureStingAudio(name) {
  if (audioBySting[name]) return audioBySting[name];
  const s = STINGS[name];
  if (!s) return null;
  try {
    const a = new Audio(s.url);
    a.loop = false;
    a.volume = 0;
    a.preload = "auto";
    audioBySting[name] = a;
    return a;
  } catch (e) {
    return null;
  }
}

function targetVolFor(name) {
  if (muted) return 0;
  const ducking = performance.now() < stingDuckUntil ? 0.35 : 1;
  const mul = TRACKS[name]?.volMul ?? 1;
  return Math.min(1, musicVolume * mul * ducking);
}

function fade(audio, target, ms = 600, onDone = null) {
  if (!audio) return;
  const id = audio;
  if (fadeStates[id]) cancelAnimationFrame(fadeStates[id]);
  const start = performance.now();
  const fromVol = audio.volume;
  const step = () => {
    const t = Math.min(1, (performance.now() - start) / ms);
    audio.volume = fromVol + (target - fromVol) * t;
    if (t >= 1) {
      audio.volume = target;
      fadeStates[id] = null;
      if (target === 0) {
        try { audio.pause(); } catch (e) {}
      }
      if (onDone) onDone();
      return;
    }
    fadeStates[id] = requestAnimationFrame(step);
  };
  fadeStates[id] = requestAnimationFrame(step);
}

function applyAllVolumes(ms = 200) {
  for (const name of Object.keys(audioByTrack)) {
    const a = audioByTrack[name];
    if (!a) continue;
    const tgt = name === currentTrack ? targetVolFor(name) : 0;
    fade(a, tgt, ms);
  }
}

export const MusicManager = {
  start() {
    for (const name of Object.keys(TRACKS)) ensureLoopAudio(name);
    for (const name of Object.keys(STINGS)) ensureStingAudio(name);
  },

  setMusicVolume(v) {
    musicVolume = Math.max(0, Math.min(1, v));
    applyAllVolumes(200);
  },

  getMusicVolume() { return musicVolume; },

  setMuted(m) {
    muted = !!m;
    applyAllVolumes(300);
    for (const name of Object.keys(audioBySting)) {
      const a = audioBySting[name];
      if (!a) continue;
      a.volume = muted ? 0 : a.volume;
    }
  },

  play(trackName) {
    if (!TRACKS[trackName]) return;
    if (currentTrack === trackName) return;
    const prev = currentTrack;
    currentTrack = trackName;
    const next = ensureLoopAudio(trackName);
    if (next) {
      try {
        const p = next.play();
        if (p && p.catch) p.catch(() => {});
      } catch (e) {}
      fade(next, targetVolFor(trackName), 800);
    }
    if (prev && audioByTrack[prev]) {
      fade(audioByTrack[prev], 0, 800);
    }
  },

  playSting(stingName) {
    const s = STINGS[stingName];
    if (!s) return;
    const a = ensureStingAudio(stingName);
    if (!a) return;
    stingDuckUntil = performance.now() + s.duckMs;
    applyAllVolumes(250);
    try {
      a.currentTime = 0;
      a.volume = muted ? 0 : Math.min(1, musicVolume * s.volMul * 1.6);
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {}
    setTimeout(() => applyAllVolumes(500), s.duckMs);
  },

  stop() {
    if (currentTrack === null) return;
    const prev = currentTrack;
    currentTrack = null;
    if (audioByTrack[prev]) fade(audioByTrack[prev], 0, 500);
  },

  getCurrentTrack() { return currentTrack; },
};

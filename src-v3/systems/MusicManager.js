const BASE = (import.meta.env?.BASE_URL || "/") + "audio/music/";

const TRACKS = {
  menu: { url: BASE + "menu_theme.mp3", loop: true, volMul: 0.85 },
  calm: { url: BASE + "gameplay_calm.mp3", loop: true, volMul: 0.75 },
  intense: { url: BASE + "gameplay_intense.mp3", loop: true, volMul: 1.0 },
  boss: { url: BASE + "boss_theme.mp3", loop: true, volMul: 1.1 },
};

const STINGS = {
  victory: { url: BASE + "victory_sting.mp3", volMul: 0.9, duckMs: 4500 },
  defeat: { url: BASE + "defeat_sting.mp3", volMul: 0.9, duckMs: 4500 },
};

let musicVolume = 0.35;
let muted = false;
let currentTrack = null;
let activeSting = null;
let stingDuckUntil = 0;
const audioByTrack = {};
const audioBySting = {};
const fadeStates = new WeakMap();
let _stingEndTimer = null;

function ensureLoopAudio(name) {
  if (audioByTrack[name]) return audioByTrack[name];
  const t = TRACKS[name];
  if (!t) return null;
  try {
    const a = new Audio(t.url);
    a.loop = true;
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

function fade(audio, target, ms = 600) {
  if (!audio) return;
  const prev = fadeStates.get(audio);
  if (prev) cancelAnimationFrame(prev);
  const start = performance.now();
  const fromVol = audio.volume;
  const step = () => {
    const t = Math.min(1, (performance.now() - start) / ms);
    audio.volume = fromVol + (target - fromVol) * t;
    if (t >= 1) {
      audio.volume = target;
      fadeStates.delete(audio);
      return;
    }
    fadeStates.set(audio, requestAnimationFrame(step));
  };
  fadeStates.set(audio, requestAnimationFrame(step));
}

function ensurePlaying(audio) {
  if (!audio) return;
  if (audio.paused) {
    try {
      const p = audio.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {}
  }
}

function applyAllVolumes(ms = 200) {
  for (const name of Object.keys(audioByTrack)) {
    const a = audioByTrack[name];
    if (!a) continue;
    const tgt = name === currentTrack ? targetVolFor(name) : 0;
    if (name === currentTrack) ensurePlaying(a);
    fade(a, tgt, ms);
  }
}

function stopSting() {
  if (_stingEndTimer) {
    clearTimeout(_stingEndTimer);
    _stingEndTimer = null;
  }
  if (!activeSting) return;
  const a = audioBySting[activeSting];
  if (a) {
    try { a.pause(); a.currentTime = 0; } catch (e) {}
  }
  activeSting = null;
  stingDuckUntil = 0;
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
      if (muted) a.volume = 0;
    }
  },

  play(trackName) {
    if (!TRACKS[trackName]) return;
    stopSting();
    if (currentTrack === trackName) {
      const a = audioByTrack[trackName];
      if (a) {
        ensurePlaying(a);
        fade(a, targetVolFor(trackName), 400);
      }
      return;
    }
    const prev = currentTrack;
    currentTrack = trackName;
    const next = ensureLoopAudio(trackName);
    if (next) {
      ensurePlaying(next);
      fade(next, targetVolFor(trackName), 800);
    }
    if (prev && audioByTrack[prev] && prev !== trackName) {
      fade(audioByTrack[prev], 0, 800);
    }
  },

  playSting(stingName) {
    const s = STINGS[stingName];
    if (!s) return;
    const a = ensureStingAudio(stingName);
    if (!a) return;
    if (activeSting && activeSting !== stingName) stopSting();
    activeSting = stingName;
    stingDuckUntil = performance.now() + s.duckMs;
    applyAllVolumes(250);
    try {
      a.currentTime = 0;
      a.volume = muted ? 0 : Math.min(1, musicVolume * s.volMul);
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {}
    if (_stingEndTimer) clearTimeout(_stingEndTimer);
    _stingEndTimer = setTimeout(() => {
      activeSting = null;
      stingDuckUntil = 0;
      applyAllVolumes(600);
    }, s.duckMs);
  },

  stop() {
    stopSting();
    if (currentTrack === null) return;
    const prev = currentTrack;
    currentTrack = null;
    if (audioByTrack[prev]) fade(audioByTrack[prev], 0, 500);
  },

  getCurrentTrack() { return currentTrack; },
};

const TRACK_URL = (import.meta.env?.BASE_URL || "/") + "audio/carrousel-des-braves.mp3";

let audioEl = null;
let currentTrack = null;
let musicVolume = 0.35;
let muted = false;
let fadeRaf = null;

const TRACK_VOLUME_MUL = {
  menu: 0.85,
  calm: 0.75,
  intense: 1.0,
  boss: 1.1,
};

function ensureAudio() {
  if (audioEl) return audioEl;
  try {
    audioEl = new Audio(TRACK_URL);
    audioEl.loop = true;
    audioEl.volume = 0;
    audioEl.preload = "auto";
  } catch (e) {
    audioEl = null;
  }
  return audioEl;
}

function targetVolume() {
  if (muted) return 0;
  if (currentTrack === null) return 0;
  const mul = TRACK_VOLUME_MUL[currentTrack] || 1;
  return Math.min(1, musicVolume * mul);
}

function startFade(target, ms = 600) {
  if (!audioEl) return;
  if (fadeRaf) cancelAnimationFrame(fadeRaf);
  const start = performance.now();
  const fromVol = audioEl.volume;
  const step = () => {
    const t = (performance.now() - start) / ms;
    if (t >= 1) {
      audioEl.volume = target;
      fadeRaf = null;
      if (target === 0 && currentTrack === null) {
        try { audioEl.pause(); } catch (e) {}
      }
      return;
    }
    audioEl.volume = fromVol + (target - fromVol) * t;
    fadeRaf = requestAnimationFrame(step);
  };
  fadeRaf = requestAnimationFrame(step);
}

export const MusicManager = {
  start() {
    ensureAudio();
  },

  setMusicVolume(v) {
    musicVolume = Math.max(0, Math.min(1, v));
    if (audioEl && currentTrack !== null) {
      startFade(targetVolume(), 200);
    }
  },

  getMusicVolume() { return musicVolume; },

  setMuted(m) {
    muted = !!m;
    if (!audioEl) return;
    startFade(targetVolume(), 300);
    if (muted && audioEl.paused === false) {
      // keep playing under the hood so resume is instant
    }
  },

  play(trackName) {
    const a = ensureAudio();
    if (!a) return;
    if (currentTrack === trackName) return;
    currentTrack = trackName;
    try {
      const playPromise = a.play();
      if (playPromise && playPromise.catch) playPromise.catch(() => {});
    } catch (e) {}
    startFade(targetVolume(), 800);
  },

  stop() {
    if (currentTrack === null) return;
    currentTrack = null;
    startFade(0, 500);
  },

  getCurrentTrack() { return currentTrack; },
};

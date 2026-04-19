export const audio = (() => {
  let ctx = null;
  let muted = false;
  let masterVolume = 0.7;
  const getCtx = () => {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return null; }
    }
    return ctx;
  };
  const beep = (freq, dur, type = "square", vol = 0.12, slideTo = null) => {
    if (muted) return;
    const c = getCtx();
    if (!c) return;
    try {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, c.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
      const effectiveVol = vol * masterVolume;
      g.gain.setValueAtTime(effectiveVol, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
      osc.connect(g);
      g.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + dur);
    } catch (e) {}
  };
  const noise = (dur, vol = 0.1) => {
    if (muted) return;
    const c = getCtx();
    if (!c) return;
    try {
      const bufSize = c.sampleRate * dur;
      const buf = c.createBuffer(1, bufSize, c.sampleRate);
      const out = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) out[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      const src = c.createBufferSource();
      src.buffer = buf;
      const g = c.createGain();
      g.gain.value = vol * masterVolume;
      src.connect(g);
      g.connect(c.destination);
      src.start();
    } catch (e) {}
  };
  return {
    isMuted: () => muted,
    toggleMute: () => { muted = !muted; return muted; },
    getMasterVolume: () => masterVolume,
    setMasterVolume: (v) => { masterVolume = Math.max(0, Math.min(1, v)); },
    jump: () => beep(440, 0.1, "square", 0.1, 720),
    coin: () => {
      beep(988, 0.07, "square", 0.1);
      setTimeout(() => beep(1318, 0.12, "square", 0.1), 50);
    },
    transform: () => {
      beep(220, 0.35, "sawtooth", 0.18, 80);
      setTimeout(() => beep(90, 0.25, "sine", 0.15), 100);
      setTimeout(() => noise(0.3, 0.1), 60);
    },
    splash: () => {
      beep(600, 0.12, "triangle", 0.1, 300);
      setTimeout(() => beep(400, 0.12, "triangle", 0.08, 180), 80);
    },
    wagonSpawn: () => {
      beep(330, 0.08, "square", 0.12);
      setTimeout(() => beep(494, 0.12, "square", 0.12), 80);
    },
    place: () => beep(180, 0.04, "square", 0.07),
    boost: () => {
      for (let i = 0; i < 5; i++) setTimeout(() => beep(400 + i * 120, 0.05, "square", 0.1), i * 25);
    },
    combo: () => {
      beep(660, 0.08, "square", 0.12);
      setTimeout(() => beep(880, 0.08, "square", 0.12), 70);
      setTimeout(() => beep(1175, 0.14, "square", 0.12), 140);
    },
    board: () => {
      beep(523, 0.06, "square", 0.1);
      setTimeout(() => beep(784, 0.08, "square", 0.1), 60);
    },
    achievement: () => {
      beep(523, 0.1, "triangle", 0.14);
      setTimeout(() => beep(659, 0.1, "triangle", 0.14), 90);
      setTimeout(() => beep(784, 0.14, "triangle", 0.16), 180);
      setTimeout(() => beep(1047, 0.22, "triangle", 0.14), 290);
    },
    confetti: () => {
      beep(880, 0.05, "square", 0.1);
      setTimeout(() => beep(1320, 0.05, "square", 0.1), 40);
      setTimeout(() => beep(1760, 0.08, "square", 0.1), 80);
      setTimeout(() => noise(0.18, 0.06), 60);
    },
    crack: () => {
      noise(0.25, 0.18);
      beep(180, 0.12, "sawtooth", 0.12, 60);
    },
    gold: () => {
      beep(1320, 0.06, "triangle", 0.1);
      setTimeout(() => beep(1760, 0.06, "triangle", 0.1), 50);
      setTimeout(() => beep(2093, 0.1, "triangle", 0.1), 100);
    },
  };
})();

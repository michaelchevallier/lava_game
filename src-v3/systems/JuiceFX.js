import * as THREE from "three";

const offset = new THREE.Vector3();
const shakes = [];

export const JuiceFX = {
  init() {
    shakes.length = 0;
    offset.set(0, 0, 0);
  },

  shake(intensity = 0.1, durationMs = 200) {
    shakes.push({ intensity, life: durationMs / 1000, maxLife: durationMs / 1000 });
  },

  tick(dt) {
    offset.set(0, 0, 0);
    for (let i = shakes.length - 1; i >= 0; i--) {
      const s = shakes[i];
      s.life -= dt;
      if (s.life <= 0) { shakes.splice(i, 1); continue; }
      const ratio = s.life / s.maxLife;
      const k = s.intensity * ratio;
      offset.x += (Math.random() * 2 - 1) * k;
      offset.z += (Math.random() * 2 - 1) * k;
      offset.y += (Math.random() * 2 - 1) * k * 0.4;
    }
    return offset;
  },

  reset() {
    shakes.length = 0;
    offset.set(0, 0, 0);
  },
};

// Simple particle pool with active cap. Throttles when too many particles
// are alive simultaneously to keep frame time stable on big kill bursts.

const MAX_ACTIVE = 200;

export const Particles = {
  count: 0,
  canSpawn(n = 1) {
    return Particles.count + n <= MAX_ACTIVE;
  },
  // Spawn a circle particle. Returns null if cap reached.
  spawnCircle(scene, x, y, opts = {}) {
    if (!Particles.canSpawn(1)) return null;
    const radius = opts.radius ?? 3;
    const color = opts.color ?? 0xffeecc;
    const alpha = opts.alpha ?? 1;
    const depth = opts.depth ?? 20;
    const part = scene.add.circle(x, y, radius, color, alpha).setDepth(depth);
    Particles.count++;
    const tweenCfg = {
      targets: part,
      ...opts.tween,
      onComplete: () => {
        Particles.count = Math.max(0, Particles.count - 1);
        part.destroy();
        opts.onComplete?.();
      },
    };
    scene.tweens.add(tweenCfg);
    return part;
  },
  // Spawn a rectangle particle.
  spawnRect(scene, x, y, opts = {}) {
    if (!Particles.canSpawn(1)) return null;
    const w = opts.width ?? 4;
    const h = opts.height ?? 4;
    const color = opts.color ?? 0xffeecc;
    const alpha = opts.alpha ?? 1;
    const depth = opts.depth ?? 20;
    const part = scene.add.rectangle(x, y, w, h, color, alpha).setDepth(depth);
    Particles.count++;
    const tweenCfg = {
      targets: part,
      ...opts.tween,
      onComplete: () => {
        Particles.count = Math.max(0, Particles.count - 1);
        part.destroy();
        opts.onComplete?.();
      },
    };
    scene.tweens.add(tweenCfg);
    return part;
  },
  // Convenience burst: spawn N particles in a circle pattern, scaled down
  // to whatever the cap allows.
  burst(scene, x, y, requestedCount, factory) {
    const slots = Math.max(1, Math.min(requestedCount, MAX_ACTIVE - Particles.count));
    for (let i = 0; i < slots; i++) {
      const a = (Math.PI * 2 * i) / slots + Math.random() * 0.3;
      factory(i, a, slots);
    }
    return slots;
  },
};

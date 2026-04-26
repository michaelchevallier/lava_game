export const JuiceFX = {
  hitstop(scene, ms) {
    const now = scene.time.now;
    if (scene._juiceLockUntil && now < scene._juiceLockUntil) return;
    scene._juiceLockUntil = now + ms;

    scene.tweens.timeScale = 0;
    if (scene.physics?.world) scene.physics.world.isPaused = true;

    scene.time.delayedCall(ms, () => {
      scene.tweens.timeScale = 1;
      if (scene.physics?.world) scene.physics.world.isPaused = false;
      scene._juiceLockUntil = 0;
    });
  },

  shake(scene, mag, dur) {
    if (scene.cameras?.main) {
      scene.cameras.main.shake(dur, mag / 1000);
    }
  },

  kill(scene) {
    JuiceFX.hitstop(scene, 65);
    JuiceFX.shake(scene, 4, 100);
  },

  explode(scene) {
    JuiceFX.shake(scene, 12, 250);
  },

  fire(scene) {
    JuiceFX.shake(scene, 2, 80);
  },

  boss(scene) {
    JuiceFX.shake(scene, 16, 500);
  },
};

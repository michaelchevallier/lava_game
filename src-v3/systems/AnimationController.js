import * as THREE from "three";

export class AnimationController {
  constructor(model, clips) {
    this.mixer = new THREE.AnimationMixer(model);
    this.actions = {};
    for (const clip of clips || []) {
      this.actions[clip.name] = this.mixer.clipAction(clip);
    }
    this.current = null;
    this.currentName = null;
  }

  play(name, opts = {}) {
    const fade = opts.fade ?? 0.2;
    const action = this.actions[name];
    if (!action) return null;
    if (this.currentName === name) return this.current;
    if (this.current && this.current !== action) {
      this.current.fadeOut(fade);
    }
    action.reset();
    action.fadeIn(fade);
    if (opts.loop === false) {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
    } else {
      action.setLoop(THREE.LoopRepeat, Infinity);
    }
    if (opts.timeScale != null) action.timeScale = opts.timeScale;
    action.play();
    this.current = action;
    this.currentName = name;
    return action;
  }

  has(name) { return !!this.actions[name]; }

  stop() {
    if (this.current) this.current.stop();
    this.current = null;
    this.currentName = null;
  }

  tick(dt) {
    this.mixer.update(dt);
  }

  dispose() {
    if (this.mixer) this.mixer.stopAllAction();
    this.actions = {};
    this.current = null;
    this.currentName = null;
  }
}

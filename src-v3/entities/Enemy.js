import * as THREE from "three";
import { Particles } from "../systems/Particles.js";

const SPEED = 1.2; // units/sec along path
const HP_MAX = 3;
const DAMAGE = 5;
const REWARD = 2;

export class Enemy {
  constructor(scene, curve) {
    this.scene = scene;
    this.curve = curve;
    this.t = 0;
    this.hp = HP_MAX;
    this.dead = false;
    this.reachedEnd = false;
    this.damage = DAMAGE;
    this.reward = REWARD;
    this.type = "basic";

    // Cute "red dude" stack: body + head, simple boxes
    this.group = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.7, 0.4),
      new THREE.MeshLambertMaterial({ color: 0xc63a10 }),
    );
    body.position.y = 0.45;
    body.castShadow = true;
    this.group.add(body);

    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.3, 0.32),
      new THREE.MeshLambertMaterial({ color: 0xffc99a }),
    );
    head.position.y = 0.95;
    head.castShadow = true;
    this.group.add(head);

    // tiny health pip on top (only shown after first hit)
    this.hpBarBg = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.7, depthTest: false }),
    );
    this.hpBarBg.position.y = 1.3;
    this.hpBarBg.rotation.x = -Math.PI / 4;
    this.hpBarBg.visible = false;
    this.group.add(this.hpBarBg);

    this.hpBar = new THREE.Mesh(
      new THREE.PlaneGeometry(0.58, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xff6633, transparent: true, opacity: 0.95, depthTest: false }),
    );
    this.hpBar.position.set(0, 1.3, 0.001);
    this.hpBar.rotation.x = -Math.PI / 4;
    this.hpBar.visible = false;
    this.group.add(this.hpBar);

    this._bobPhase = Math.random() * Math.PI * 2;
    scene.add(this.group);
    const start = curve.getPointAt(0);
    this.group.position.copy(start);
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    this.hpBarBg.visible = true;
    this.hpBar.visible = true;
    const ratio = Math.max(0, this.hp / HP_MAX);
    this.hpBar.scale.x = ratio;
    this.hpBar.position.x = -(0.58 * (1 - ratio)) / 2;
    Particles.emit(
      { x: this.group.position.x, y: this.group.position.y + 0.6, z: this.group.position.z },
      0xffffff,
      3,
      { speed: 2, life: 0.3, scale: 0.25 },
    );
    if (this.hp <= 0) this.dead = true;
  }

  tick(dt) {
    if (this.dead) return;
    // path length is curve.getLength() in units; we walk normalized t
    const len = this.curve.getLength();
    this.t += (SPEED * dt) / len;
    if (this.t >= 1) {
      this.t = 1;
      this.reachedEnd = true;
    }
    const p = this.curve.getPointAt(this.t);
    this.group.position.x = p.x;
    this.group.position.z = p.z;
    // Face along path
    const tangent = this.curve.getTangentAt(this.t).normalize();
    this.group.rotation.y = Math.atan2(tangent.x, tangent.z);
    // Tiny walk-bob
    this._bobPhase += dt * 14;
    this.group.position.y = Math.abs(Math.sin(this._bobPhase)) * 0.06;
  }

  destroy() {
    this.scene.remove(this.group);
    this.group.traverse((c) => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    });
  }
}

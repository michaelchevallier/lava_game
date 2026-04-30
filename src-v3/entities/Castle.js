import * as THREE from "three";
import { Particles } from "../systems/Particles.js";

export class Castle {
  constructor(scene, index, stoneHex, roofHex) {
    this.scene = scene;
    this.index = index;
    this.hp = 100;
    this.hpMax = 100;
    this.pathIdx = 0;
    this.pos = new THREE.Vector3();
    this.isDead = false;
    this.group = new THREE.Group();
    this._buildMesh(stoneHex, roofHex);
    scene.add(this.group);
  }

  _buildMesh(stoneHex, roofHex) {
    const stoneMat = new THREE.MeshLambertMaterial({ color: stoneHex });
    const stoneDarkMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(stoneHex).multiplyScalar(0.7) });
    const roofMat = new THREE.MeshLambertMaterial({ color: roofHex });
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x3a2410 });
    const flagMat = new THREE.MeshLambertMaterial({ color: 0xc63a3a, side: THREE.DoubleSide });

    this._stoneMat = stoneMat;
    this._stoneDarkMat = stoneDarkMat;
    this._roofMat = roofMat;

    const keep = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 2.6), stoneMat);
    keep.position.y = 0.9;
    keep.castShadow = true;
    this.group.add(keep);

    const crenW = 0.35, crenH = 0.32;
    const positions = [
      [-1.0, -1.3], [0, -1.3], [1.0, -1.3],
      [-1.3, 0], [1.3, 0],
      [-1.0, 1.3], [0, 1.3], [1.0, 1.3],
    ];
    for (const [px, pz] of positions) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(crenW, crenH, crenW), stoneDarkMat);
      c.position.set(px, 1.8 + crenH / 2 + 0.02, pz);
      c.castShadow = true;
      this.group.add(c);
    }

    const towerOffsets = [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]];
    for (const [tx, tz] of towerOffsets) {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 2.4, 8), stoneMat);
      tower.position.set(tx, 1.2, tz);
      tower.castShadow = true;
      this.group.add(tower);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.7, 8), roofMat);
      cap.position.set(tx, 2.4 + 0.35, tz);
      cap.castShadow = true;
      this.group.add(cap);
    }

    const centralRoof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.3, 4), roofMat);
    centralRoof.position.y = 1.8 + 0.65 + 0.34;
    centralRoof.rotation.y = Math.PI / 4;
    centralRoof.castShadow = true;
    this.group.add(centralRoof);

    const door = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.05), doorMat);
    door.position.set(0, 0.4, -1.31);
    this.group.add(door);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6), stoneDarkMat);
    pole.position.y = 1.8 + 1.3 + 0.4;
    this.group.add(pole);

    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.32), flagMat);
    flag.position.set(0.25, 1.8 + 1.3 + 0.55, 0);
    this.group.add(flag);
  }

  takeDamage(dmg) {
    if (this.isDead) return;
    this.hp = Math.max(0, this.hp - dmg);
    this._updateTint();
    if (this.hp <= 0) {
      this.isDead = true;
      this._applyGrayscale();
      Particles.emit(
        { x: this.pos.x, y: 1.5, z: this.pos.z },
        0x6a4a2a, 24,
        { speed: 5, life: 0.6, scale: 0.5, yLift: 1.0 },
      );
      document.dispatchEvent(new CustomEvent("crowdef:castle-destroyed", { detail: { castleIdx: this.index } }));
    }
  }

  _updateTint() {
    const ratio = this.hpMax > 0 ? this.hp / this.hpMax : 0;
    if (ratio < 0.3) {
      const red = new THREE.Color(0xff0000);
      this._stoneMat.color.lerp(red, 0.3);
      this._stoneDarkMat.color.lerp(red, 0.3);
    }
  }

  _applyGrayscale() {
    const gray = new THREE.Color(0x888888);
    this.group.traverse((o) => {
      if (!o.isMesh) return;
      if (Array.isArray(o.material)) {
        for (const m of o.material) m.color.set(gray);
      } else if (o.material && o.material.color) {
        o.material.color.set(gray);
      }
    });
  }

  setPosition(x, y, z) {
    this.pos.set(x, y, z);
    this.group.position.set(x, y, z);
  }

  destroy() {
    if (this.scene) this.scene.remove(this.group);
    this.group.traverse((c) => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
        else c.material.dispose();
      }
    });
  }
}

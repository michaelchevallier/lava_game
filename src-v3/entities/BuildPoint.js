import * as THREE from "three";

export const BUILD_POINT_RADIUS = 1.2;
export const BUILD_POINT_VISUAL_RADIUS = 1.6;
export const BUILD_DRAIN_PER_SEC = 30;

const HALO_NEUTRAL = 0x66ddff;
const HALO_VALID = 0x66ff66;
const HALO_INVALID = 0xff5555;
const HALO_OCCUPIED = 0xffd23f;
const HALO_POOR = 0xff9a30;

export class BuildPoint {
  constructor(scene, position, pathIdx = 0) {
    this.scene = scene;
    this.pos = position.clone();
    this.pathIdx = pathIdx;
    this.occupied = false;
    this.tower = null;
    this.totalInvested = 0;
    this.paidThisLevel = 0;
    this.buildingType = null;
    this._lastRatio = -1;

    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(BUILD_POINT_VISUAL_RADIUS - 0.18, BUILD_POINT_VISUAL_RADIUS, 36),
      new THREE.MeshBasicMaterial({ color: HALO_NEUTRAL, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false }),
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.set(this.pos.x, 0.04, this.pos.z);
    this.ring.renderOrder = 5;
    scene.add(this.ring);

    this.fill = new THREE.Mesh(
      new THREE.CircleGeometry(BUILD_POINT_VISUAL_RADIUS - 0.24, 24, 0, 0.001),
      new THREE.MeshBasicMaterial({ color: HALO_VALID, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }),
    );
    this.fill.rotation.x = -Math.PI / 2;
    this.fill.position.set(this.pos.x, 0.05, this.pos.z);
    this.fill.renderOrder = 6;
    this.fill.visible = false;
    scene.add(this.fill);
  }

  setHaloState(state) {
    let color = HALO_NEUTRAL;
    let opacity = 0.0;
    if (state === "hidden") { opacity = 0.0; }
    else if (state === "idle") { color = HALO_NEUTRAL; opacity = 0.18; }
    else if (state === "near") { color = HALO_VALID; opacity = 0.5; }
    else if (state === "near-poor") { color = HALO_POOR; opacity = 0.5; }
    else if (state === "active") { color = HALO_VALID; opacity = 0.7; }
    else if (state === "active-poor") { color = HALO_POOR; opacity = 0.7; }
    else if (state === "invalid") { color = HALO_INVALID; opacity = 0.55; }
    else if (state === "occupied") { color = HALO_OCCUPIED; opacity = 0.45; }
    this.ring.material.color.setHex(color);
    this.ring.material.opacity += (opacity - this.ring.material.opacity) * 0.25;
  }

  updateBuildFill(ratio) {
    if (ratio <= 0) {
      this.fill.visible = false;
      this._lastRatio = -1;
      return;
    }
    this.fill.visible = true;
    if (Math.abs(ratio - this._lastRatio) < 0.01) return;
    this._lastRatio = ratio;
    this.fill.geometry.dispose();
    const angle = Math.max(0.001, Math.PI * 2 * ratio);
    this.fill.geometry = new THREE.CircleGeometry(BUILD_POINT_VISUAL_RADIUS - 0.24, 24, -Math.PI / 2, -angle);
  }

  attachTower(tower) {
    this.tower = tower;
    this.occupied = true;
    this.paidThisLevel = 0;
    this.buildingType = null;
    this.fill.visible = false;
  }

  detachTower() {
    const refund = Math.round(this.totalInvested * 0.8);
    this.tower = null;
    this.occupied = false;
    this.buildingType = null;
    this.totalInvested = 0;
    this.paidThisLevel = 0;
    this.fill.visible = false;
    return refund;
  }

  dispose() {
    this.scene.remove(this.ring);
    this.ring.geometry.dispose();
    this.ring.material.dispose();
    this.scene.remove(this.fill);
    this.fill.geometry.dispose();
    this.fill.material.dispose();
  }
}

export function generateBuildPointGrid(scene, paths) {
  const points = [];
  const seen = [];
  const OFFSETS = [3.4, 4.9];
  const DEDUP_SQ = 3.5 * 3.5;
  for (let pi = 0; pi < paths.length; pi++) {
    const path = paths[pi];
    // Scale samples by path length so long mazes get plenty of build points
    const len = path.getLength();
    const samplesCount = Math.max(30, Math.min(1500, Math.floor(len / 2.5)));
    const samples = path.getSpacedPoints(samplesCount);
    for (let i = 0; i < samples.length; i++) {
      const p = samples[i];
      const t = i / samplesCount;
      const tan = path.getTangentAt(Math.min(0.999, t)).normalize();
      const perp = new THREE.Vector3(-tan.z, 0, tan.x);
      for (const sign of [-1, 1]) {
        for (const off of OFFSETS) {
          const x = p.x + perp.x * sign * off;
          const z = p.z + perp.z * sign * off;
          if (Math.abs(x) > 60 || Math.abs(z) > 60) continue;
          let dup = false;
          for (const s of seen) {
            const dx = s.x - x;
            const dz = s.z - z;
            if (dx * dx + dz * dz < DEDUP_SQ) { dup = true; break; }
          }
          if (dup) continue;
          seen.push({ x, z });
          points.push(new BuildPoint(scene, new THREE.Vector3(x, 0, z), pi));
        }
      }
    }
  }
  return points;
}

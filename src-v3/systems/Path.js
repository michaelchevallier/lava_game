import * as THREE from "three";

const DEFAULT_POINTS = [
  [-15, 0, -8], [-9, 0, -2], [-5, 0, -7], [0, 0, -3],
  [4, 0, -8], [8, 0, -2], [6, 0, 4], [2, 0, 6],
];

export function buildPath(rawPoints) {
  const src = rawPoints || DEFAULT_POINTS;
  const points = src.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
}

// Render the path as a flat dirt strip on the ground
export function makePathLine(curve, mat) {
  const samples = curve.getSpacedPoints(120);
  const group = new THREE.Group();

  // Build a thick "ribbon" by extruding a small cross-section
  const halfWidth = 1.4;
  const positions = [];
  const indices = [];
  for (let i = 0; i < samples.length; i++) {
    const p = samples[i];
    const t = i / (samples.length - 1);
    const tangent = curve.getTangentAt(t).normalize();
    const normal = new THREE.Vector3(0, 1, 0);
    const side = new THREE.Vector3().crossVectors(tangent, normal).normalize().multiplyScalar(halfWidth);
    const left = p.clone().add(side);
    const right = p.clone().sub(side);
    positions.push(left.x, 0.01, left.z);
    positions.push(right.x, 0.01, right.z);
  }
  for (let i = 0; i < samples.length - 1; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    indices.push(a, b, c);
    indices.push(b, d, c);
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  const mesh = new THREE.Mesh(geom, mat);
  mesh.receiveShadow = true;
  group.add(mesh);
  return group;
}

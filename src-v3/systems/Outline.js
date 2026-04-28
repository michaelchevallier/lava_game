import * as THREE from "three";

export function addOutlineToMesh(mesh, scale = 1.04, color = 0x000000) {
  const outlineMat = new THREE.MeshBasicMaterial({
    color,
    side: THREE.BackSide,
  });
  const outline = mesh.isSkinnedMesh
    ? new THREE.SkinnedMesh(mesh.geometry, outlineMat)
    : new THREE.Mesh(mesh.geometry, outlineMat);
  outline.castShadow = false;
  outline.receiveShadow = false;
  if (mesh.isSkinnedMesh) {
    outline.bind(mesh.skeleton, mesh.bindMatrix);
  }
  outline.scale.setScalar(scale);
  outline.userData._isOutline = true;
  mesh.add(outline);
  return outline;
}

export function addOutlineToScene(root, scale = 1.04, color = 0x000000) {
  const targets = [];
  root.traverse((node) => {
    if (node.userData && node.userData._isOutline) return;
    if (node.isSkinnedMesh || node.isMesh) targets.push(node);
  });
  for (const m of targets) addOutlineToMesh(m, scale, color);
}

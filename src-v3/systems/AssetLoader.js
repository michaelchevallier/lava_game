import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();

const cache = {};
let readyPromise = null;

const MANIFEST = {
  knight: "quaternius/Knight_Male.gltf",
  zombie: "quaternius/Zombie_Male.gltf",
  goblin: "quaternius/Goblin_Male.gltf",
  soldier: "quaternius/Soldier_Male.gltf",
  knightgolden: "quaternius/Knight_Golden_Male.gltf",
  wizard: "quaternius/Wizard.gltf",
  pirate: "quaternius/Pirate_Male.gltf",
  tower_archer: "quaternius/Tower_Archer.gltf",
  tower_archer_l2: "quaternius/Tower_Archer_L2.gltf",
  tower_archer_l3: "quaternius/Tower_Archer_L3.gltf",
  tower_mage: "quaternius/Tower_Mage.gltf",
  tower_mage_l2: "quaternius/Tower_Mage_L2.gltf",
  tower_tank: "quaternius/Tower_Tank.gltf",
  tower_tank_l2: "quaternius/Tower_Tank_L2.gltf",
  tower_tank_l3: "quaternius/Tower_Tank_L3.gltf",
  tower_ballista: "quaternius/Tower_Ballista.gltf",
  tower_ballista_l2: "quaternius/Tower_Ballista_L2.gltf",
  tower_ballista_l3: "quaternius/Tower_Ballista_L3.gltf",
};

function loadOne(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, (gltf) => resolve(gltf), undefined, (err) => reject(err));
  });
}

export const AssetLoader = {
  ready() {
    if (readyPromise) return readyPromise;
    readyPromise = Promise.all(
      Object.entries(MANIFEST).map(async ([key, path]) => {
        const url = (import.meta.env?.BASE_URL || "/") + path;
        try {
          const gltf = await loadOne(url);
          cache[key] = gltf;
        } catch (e) {
          cache[key] = null;
        }
      }),
    ).then(() => {
      document.dispatchEvent(new CustomEvent("crowdef:assets-ready"));
      return cache;
    });
    return readyPromise;
  },

  get(key) {
    return cache[key] || null;
  },

  isLoaded() {
    return Object.keys(MANIFEST).every((k) => cache[k] !== undefined);
  },
};

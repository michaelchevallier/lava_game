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
  tower_cannon: "towers/cannon_quaternius.glb",
  tower_crossbow: "towers/giant_crossbow.glb",
  tower_fan: "towers/tower_windmill.glb",
  tower_mine: "towers/spike_mine.glb",
  tower_magnet: "towers/magnet_polygoogle.glb",
  tower_portal: "towers/teleporter_base.glb",
  tower_frost: "towers/snowman.glb",
  nature_commontree1: "nature/CommonTree_1.gltf",
  nature_commontree2: "nature/CommonTree_2.gltf",
  nature_commontree3: "nature/CommonTree_3.gltf",
  nature_pine1: "nature/Pine_1.gltf",
  nature_pine2: "nature/Pine_2.gltf",
  nature_pine3: "nature/Pine_3.gltf",
  nature_rock1: "nature/Rock_Medium_1.gltf",
  nature_rock2: "nature/Rock_Medium_2.gltf",
  nature_rock3: "nature/Rock_Medium_3.gltf",
  nature_pebble1: "nature/Pebble_Round_1.gltf",
  nature_pebble2: "nature/Pebble_Round_2.gltf",
  nature_bush: "nature/Bush_Common.gltf",
  nature_bushflower: "nature/Bush_Common_Flowers.gltf",
  nature_flower3: "nature/Flower_3_Group.gltf",
  nature_flower4: "nature/Flower_4_Group.gltf",
  nature_mushroom: "nature/Mushroom_Common.gltf",
  nature_fern: "nature/Fern_1.gltf",
  nature_grass: "nature/Grass_Common_Tall.gltf",
  nature_plant: "nature/Plant_1.gltf",
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

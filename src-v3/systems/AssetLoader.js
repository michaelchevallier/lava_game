import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();

const cache = {};
let readyPromise = null;

const MANIFEST = {
  knight: "quaternius/Knight_Male.gltf",
  zombie: "quaternius/Zombie_Male.gltf",
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

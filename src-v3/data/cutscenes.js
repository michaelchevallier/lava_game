export const CUTSCENES = {
  world1: {
    title: "🌳 La Plaine du Royaume",
    icon: "🛡️",
    paragraphs: [
      "Le château de ton enfance vient d'être attaqué.",
      "Des Brigands envahissent la Plaine, menaçant les villageois.",
      "Tu es le seul à pouvoir défendre la frontière.",
      "Construis des tours, tiens jusqu'au boss... et bonne chance, jeune chevalier.",
    ],
  },
  world2: {
    title: "🌲 La Forêt Sombre",
    icon: "🧙",
    paragraphs: [
      "Le Brigand vaincu, tu pénètres dans la Forêt Sombre.",
      "Un mage maléfique invoque des créatures depuis les ombres.",
      "Méfie-toi des Assassins — ils se fondent dans la pénombre.",
      "Au cœur de la forêt t'attend le Sorcier...",
    ],
  },
  world3: {
    title: "🏜️ Le Désert Brûlant",
    icon: "🏴‍☠️",
    paragraphs: [
      "Au-delà de la forêt s'étend un désert sans fin.",
      "Des pirates corsaires y règnent en chefs de guerre.",
      "Leurs créatures volantes attaquent depuis le ciel — une baliste sera essentielle.",
      "Le Capitaine Corsaire ne te laissera pas approcher facilement de son trésor.",
    ],
  },
  world4: {
    title: "🌋 Le Volcan du Dragon",
    icon: "🐉",
    paragraphs: [
      "Tu as franchi le désert. Devant toi, le Volcan, ancien royaume du Dragon.",
      "Des Imps de feu surgissent des cratères.",
      "Le Dragon de Lave règne ici depuis des siècles.",
      "C'est le combat final. Ne laisse rien tomber.",
    ],
  },
};

export function getCutsceneForLevel(levelId) {
  if (levelId === "world1-1") return { id: "world1", ...CUTSCENES.world1 };
  if (levelId === "world2-1") return { id: "world2", ...CUTSCENES.world2 };
  if (levelId === "world3-1") return { id: "world3", ...CUTSCENES.world3 };
  if (levelId === "world4-1") return { id: "world4", ...CUTSCENES.world4 };
  return null;
}

export const CUTSCENES = {
  world1: {
    title: "Milan Park — Les Portes s'ouvrent !",
    icon: "🎪",
    paragraphs: [
      "Milan Park ouvre ses portes ce matin... et c'est le chaos.",
      "Des brigands envahissent l'entrée du parc, bousculant les familles.",
      "La billetterie est menacée — si elle tombe, plus personne ne peut entrer.",
      "Défends la billetterie avant que la foule ne déborde. Bonne chance !",
    ],
  },
  world2: {
    title: "Le Sentier d'Aventure",
    icon: "🌲",
    paragraphs: [
      "La billetterie tenue, tu t'enfonces dans le sentier d'aventure du parc.",
      "Un sorcier des bois s'est installé dans la cabane des contes et invoque ses sbires.",
      "Ses Assassins se fondent dans les sous-bois — tu ne les verras pas venir.",
      "Chasse le sorcier avant qu'il ne transforme toute l'attraction en cauchemar.",
    ],
  },
  world3: {
    title: "L'Attraction Sahara",
    icon: "🏜️",
    paragraphs: [
      "L'attraction Sahara du parc est prise d'assaut par des corsaires assoiffés.",
      "Ils surgissent des dunes en colonnes serrées, sabrant les oasis.",
      "Leurs créatures volantes attaquent depuis le ciel — une baliste sera essentielle.",
      "Garde les oasis ouverts au public. Le Capitaine Corsaire approche.",
    ],
  },
  world4: {
    title: "Le Volcan en Fureur — Foire en Lave !",
    icon: "🌋",
    paragraphs: [
      "L'attraction phare du parc — le Volcan en Fureur — réveille un Dragon endormi.",
      "Des Imps de feu surgissent des cratères, transformant les allées en coulées de lave.",
      "Si le Dragon prend le contrôle, la Foire en Lave sera éternelle.",
      "C'est le combat pour sauver Milan Park. Ne laisse rien tomber.",
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

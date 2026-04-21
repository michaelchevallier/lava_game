// Pool de 40 visiteurs VIP. 20 archetypes × 2 moods (calme / énergique).
// Chaque VIP a 1-3 contrats. Contract objectives utilisent les mêmes types
// que campaign.js (skeleton, coin, catapult, loop, apocalypse, chain,
// constellation, metronome, magnetField, geyser, portalUse, wagon, score).

export const VIPS = [
  // ───── 1-2 Mémé / Papy (2e âge) ─────
  {
    id: "ginette",
    name: "Mémé Ginette",
    age: 72,
    emoji: "👵",
    color: "#d18fc4",
    personality: "aventurière pudique",
    tagline: "Frissons bienvenus, voltiges non merci",
    contracts: [
      {
        summary: "3 squelettes sans looping",
        objectives: [{ type: "skeleton", target: 3 }],
        failOn: { loop: 1 },
        reward: 2,
        testimonial: "Trois frissons élégants, rien de vulgaire : parfait mon petit !",
      },
      {
        summary: "5 pièces, un seul wagon",
        objectives: [{ type: "coin", target: 5 }],
        wagonLimit: 1,
        reward: 1,
        testimonial: "Propre, rapide, efficace. Comme dans ma jeunesse.",
      },
    ],
  },
  {
    id: "marcel",
    name: "Tonton Marcel",
    age: 68,
    emoji: "👴",
    color: "#8a9bb8",
    personality: "bricoleur méthodique",
    tagline: "Chaque tuile compte. Chaque pièce aussi.",
    contracts: [
      {
        summary: "10 pièces en 20 tuiles",
        objectives: [{ type: "coin", target: 10 }],
        tileBudget: 20,
        reward: 3,
        testimonial: "Dix pièces avec vingt tuiles ? Du bel ouvrage, fiston.",
      },
      {
        summary: "2 chaînes d'or",
        objectives: [{ type: "chain", target: 2 }],
        reward: 2,
        testimonial: "Deux chaînes parfaites. Je remballe mes outils, t'as tout compris.",
      },
    ],
  },

  // ───── 3-4 Ados sombres / lumineux ─────
  {
    id: "maya",
    name: "Maya la Gothique",
    age: 19,
    emoji: "🖤",
    color: "#4a3861",
    personality: "sombre cynique",
    tagline: "Montre-moi le chaos",
    contracts: [
      {
        summary: "2 apocalypses",
        objectives: [{ type: "apocalypse", target: 2 }],
        reward: 3,
        testimonial: "Deux fins du monde dans l'après-midi. Ma journée est faite.",
      },
      {
        summary: "8 squelettes, zéro pièce",
        objectives: [{ type: "skeleton", target: 8 }],
        failOn: { coin: 1 },
        reward: 3,
        testimonial: "Que des os, pas d'or vulgaire. Je reviendrai.",
      },
    ],
  },
  {
    id: "justin",
    name: "Justin le TikTokeur",
    age: 16,
    emoji: "📱",
    color: "#ff6b9d",
    personality: "influenceur stressé",
    tagline: "Du spectaculaire en moins d'une minute",
    contracts: [
      {
        summary: "1 apocalypse en 90s",
        objectives: [{ type: "apocalypse", target: 1 }],
        timeLimit: 90,
        reward: 2,
        testimonial: "J'AI LA VIDÉO FRÈRE, on passe à un million ce soir.",
      },
    ],
  },

  // ───── 5-6 Scientifique / Pirate ─────
  {
    id: "lambert",
    name: "Professeur Lambert",
    age: 55,
    emoji: "🧪",
    color: "#6fb8c9",
    personality: "scientifique méticuleux",
    tagline: "Précision rituelle avant spectacle",
    contracts: [
      {
        summary: "3 constellations",
        objectives: [{ type: "constellation", target: 3 }],
        reward: 3,
        testimonial: "Trois alignements stellaires reproductibles : publiable.",
      },
      {
        summary: "2 métronomes sans boost",
        objectives: [{ type: "metronome", target: 2 }],
        forbidTools: ["boost"],
        reward: 2,
        testimonial: "Rigueur exemplaire. Pas un boost, que du rythme pur.",
      },
    ],
  },
  {
    id: "barbe",
    name: "Capitaine Barbe",
    age: 42,
    emoji: "🏴‍☠️",
    color: "#8a4a2e",
    personality: "pirate excentrique",
    tagline: "Trésors et téléportations, moussaillon !",
    contracts: [
      {
        summary: "5 pièces + 2 portails",
        objectives: [{ type: "coin", target: 5 }, { type: "portalUse", target: 2 }],
        reward: 3,
        testimonial: "Pièces ET téléportations ? Je te nomme corsaire honoraire !",
      },
    ],
  },

  // ───── 7-8 Boulangère / Peintre ─────
  {
    id: "rosa",
    name: "Rosa la Boulangère",
    age: 34,
    emoji: "🥐",
    color: "#e8b97c",
    personality: "joyeuse débordée",
    tagline: "Vite, vite, la fournée va brûler !",
    contracts: [
      {
        summary: "1 wagon, 8 pièces en 75s",
        objectives: [{ type: "coin", target: 8 }],
        wagonLimit: 1,
        timeLimit: 75,
        reward: 2,
        testimonial: "Huit pièces avant que mes croissants sortent. Service express !",
      },
    ],
  },
  {
    id: "pablo",
    name: "Pablo le Peintre",
    age: 29,
    emoji: "🎨",
    color: "#c85a9c",
    personality: "artiste distrait",
    tagline: "La beauté jaillit de l'improbable",
    contracts: [
      {
        summary: "1 constellation + 1 chaîne",
        objectives: [{ type: "constellation", target: 1 }, { type: "chain", target: 1 }],
        reward: 2,
        testimonial: "Du ciel et de l'or entrelacés. C'est ma prochaine toile.",
      },
      {
        summary: "3 pièces sans rail",
        objectives: [{ type: "coin", target: 3 }],
        forbidTools: ["rail", "rail_up", "rail_down", "rail_loop"],
        reward: 2,
        testimonial: "Sans ligne droite, que du jaillissement. Bravo l'artiste.",
      },
    ],
  },

  // ───── 9-10 Astronaute / Punk ─────
  {
    id: "cosmo",
    name: "Cosmo l'Astronaute",
    age: 37,
    emoji: "🚀",
    color: "#4a6fc9",
    personality: "rêveur interstellaire",
    tagline: "Des geysers pour toucher les étoiles",
    contracts: [
      {
        summary: "2 geysers + 1 constellation",
        objectives: [{ type: "geyser", target: 2 }, { type: "constellation", target: 1 }],
        reward: 3,
        testimonial: "Deux jets, une constellation. J'ai revu Mars en rêve.",
      },
    ],
  },
  {
    id: "lisa",
    name: "Lisa la Punk",
    age: 24,
    emoji: "💀",
    color: "#2d2d3d",
    personality: "rebelle explosive",
    tagline: "PLUS FORT, PLUS VITE, PLUS D'OS",
    contracts: [
      {
        summary: "3 apocalypses en 3min",
        objectives: [{ type: "apocalypse", target: 3 }],
        timeLimit: 180,
        reward: 3,
        testimonial: "TROIS APOCALYPSES. Tu sais quoi mettre dans ma prochaine chanson.",
      },
      {
        summary: "10 squelettes, pas de chaîne",
        objectives: [{ type: "skeleton", target: 10 }],
        failOn: { chain: 1 },
        reward: 2,
        testimonial: "Dix de tes brutes, zéro technique mainstream. Respect.",
      },
    ],
  },

  // ───── 11-12 Sage / DJ ─────
  {
    id: "leon",
    name: "Père Léon",
    age: 88,
    emoji: "🧓",
    color: "#b5a890",
    personality: "philosophe lent",
    tagline: "La sobriété est la plus belle des voies",
    contracts: [
      {
        summary: "5 pièces avec 1 seul wagon",
        objectives: [{ type: "coin", target: 5 }],
        wagonLimit: 1,
        reward: 2,
        testimonial: "Un seul wagon, cinq pièces. Tout est dit, jeune maître.",
      },
    ],
  },
  {
    id: "zaza",
    name: "Zaza la DJ",
    age: 27,
    emoji: "🎧",
    color: "#e04a78",
    personality: "hyperactive sonore",
    tagline: "Besoin de rythme, pas de silence",
    contracts: [
      {
        summary: "3 métronomes",
        objectives: [{ type: "metronome", target: 3 }],
        reward: 3,
        testimonial: "Trois BPM parfaits. Je mix ça ce soir au Zéphyr.",
      },
      {
        summary: "2 métronomes + 2 catapultes",
        objectives: [{ type: "metronome", target: 2 }, { type: "catapult", target: 2 }],
        reward: 2,
        testimonial: "Le beat et le drop. C'est mon set favori.",
      },
    ],
  },

  // ───── 13-14 Maire / Clown ─────
  {
    id: "gerald",
    name: "Gérald le Maire",
    age: 52,
    emoji: "🎩",
    color: "#5c4a7d",
    personality: "officiel guindé",
    tagline: "Spectacle ordonné. Sans explosion s'il vous plaît.",
    contracts: [
      {
        summary: "Score 400 sans apocalypse",
        objectives: [{ type: "score", target: 400 }],
        failOn: { apocalypse: 1 },
        reward: 3,
        testimonial: "Quatre cents points dans la dignité. Je vous décerne la médaille du parc.",
      },
    ],
  },
  {
    id: "pop",
    name: "Pop l'Acrobate",
    age: 22,
    emoji: "🤡",
    color: "#ff9933",
    personality: "clown en liberté",
    tagline: "Envoie-les voler, bouffon !",
    contracts: [
      {
        summary: "4 catapultes",
        objectives: [{ type: "catapult", target: 4 }],
        reward: 2,
        testimonial: "Quatre envols ! Le cirque recrute.",
      },
      {
        summary: "6 catapultes, aucun rail",
        objectives: [{ type: "catapult", target: 6 }],
        forbidTools: ["rail", "rail_up", "rail_down", "rail_loop"],
        reward: 3,
        testimonial: "Que de la voltige pure. On t'offre la piste centrale.",
      },
    ],
  },

  // ───── 15-16 Dentiste dark / Prof ─────
  {
    id: "fang",
    name: "Dr Fang",
    age: 44,
    emoji: "🦷",
    color: "#7a2e2e",
    personality: "dentiste obsessionnel",
    tagline: "Montre-moi tes os",
    contracts: [
      {
        summary: "12 squelettes",
        objectives: [{ type: "skeleton", target: 12 }],
        reward: 3,
        testimonial: "Douze squelettes, tous en état exemplaire. Mon tiroir est comblé.",
      },
    ],
  },
  {
    id: "clara",
    name: "Clara la Prof",
    age: 38,
    emoji: "📚",
    color: "#6e8a4a",
    personality: "historienne passionnée",
    tagline: "Du récit, de la transmission",
    contracts: [
      {
        summary: "7 pièces en 60s",
        objectives: [{ type: "coin", target: 7 }],
        timeLimit: 60,
        reward: 2,
        testimonial: "Sept pièces en une minute : je le raconterai demain en classe.",
      },
    ],
  },

  // ───── 17-18 Ado casse-cou / Snob ─────
  {
    id: "benji",
    name: "Benji le Skateur",
    age: 15,
    emoji: "🛹",
    color: "#4ab8e8",
    personality: "ado casse-cou",
    tagline: "Loops ou rien frérot",
    contracts: [
      {
        summary: "3 loopings",
        objectives: [{ type: "loop", target: 3 }],
        reward: 2,
        testimonial: "Trois loops. Gros. Je te filme la prochaine fois.",
      },
      {
        summary: "5 loopings + 1 apocalypse",
        objectives: [{ type: "loop", target: 5 }, { type: "apocalypse", target: 1 }],
        reward: 3,
        testimonial: "Cinq loops et le boss final : c'est un combo de fou.",
      },
    ],
  },
  {
    id: "dupont",
    name: "Mme Dupont",
    age: 61,
    emoji: "💎",
    color: "#c8a8d8",
    personality: "snob exigeante",
    tagline: "Que du raffinement, cher parc",
    contracts: [
      {
        summary: "Score 500 sans squelette",
        objectives: [{ type: "score", target: 500 }],
        failOn: { skeleton: 1 },
        reward: 3,
        testimonial: "Cinq cents points dans l'élégance. Un parc pour les vrais initiés.",
      },
    ],
  },

  // ───── 19-20 Forgeron / Prêtresse ─────
  {
    id: "igor",
    name: "Igor le Forgeron",
    age: 50,
    emoji: "🔨",
    color: "#8a5a2e",
    personality: "rustique taiseux",
    tagline: "Du fer, de l'enclume, de la brute",
    contracts: [
      {
        summary: "5 catapultes + 5 squelettes",
        objectives: [{ type: "catapult", target: 5 }, { type: "skeleton", target: 5 }],
        reward: 3,
        testimonial: "Frappé, envolé, reparti. Un parc solide.",
      },
    ],
  },
  {
    id: "luna",
    name: "Luna la Prêtresse",
    age: 33,
    emoji: "🌙",
    color: "#4a3a7d",
    personality: "mystique cérémoniale",
    tagline: "Rituels d'étoile et d'aimant",
    contracts: [
      {
        summary: "2 constellations + 2 aimants",
        objectives: [{ type: "constellation", target: 2 }, { type: "magnetField", target: 2 }],
        reward: 3,
        testimonial: "Les astres et les pôles ont répondu. Mon rituel est accompli.",
      },
    ],
  },

  // ───── 21-22 Chevalier / Pompier ─────
  {
    id: "arthur",
    name: "Arthur le Chevalier",
    age: 40,
    emoji: "⚔️",
    color: "#6a6a8a",
    personality: "héroïque solennel",
    tagline: "Convoyer la compagnie jusqu'à l'autre bout",
    contracts: [
      {
        summary: "3 wagons spawnés",
        objectives: [{ type: "wagon", target: 3 }],
        reward: 2,
        testimonial: "Trois convois menés à bon port. Ma quête est honorée.",
      },
    ],
  },
  {
    id: "noe",
    name: "Noé le Pompier",
    age: 35,
    emoji: "🚒",
    color: "#d84a3a",
    personality: "sécurité avant tout",
    tagline: "Du frisson, mais personne ne brûle",
    contracts: [
      {
        summary: "3 squelettes, aucune apocalypse",
        objectives: [{ type: "skeleton", target: 3 }],
        failOn: { apocalypse: 1 },
        reward: 2,
        testimonial: "Trois frissons maîtrisés, zéro sinistre. C'est comme ça qu'on fait.",
      },
    ],
  },

  // ───── 23-24 Ballerine / Mécano ─────
  {
    id: "mia",
    name: "Mia la Ballerine",
    age: 25,
    emoji: "🩰",
    color: "#e4a8c0",
    personality: "gracieuse disciplinée",
    tagline: "Alignement parfait, chaque soir",
    contracts: [
      {
        summary: "2 constellations sans lave",
        objectives: [{ type: "constellation", target: 2 }],
        forbidTools: ["lava"],
        reward: 3,
        testimonial: "Pas une flamme, deux envolées célestes. Magnifique équilibre.",
      },
    ],
  },
  {
    id: "rex",
    name: "Rex le Mécano",
    age: 45,
    emoji: "🔧",
    color: "#5a6a7a",
    personality: "technicien pragmatique",
    tagline: "Aimants, roues, ça tourne rond",
    contracts: [
      {
        summary: "3 champs magnétiques",
        objectives: [{ type: "magnetField", target: 3 }],
        reward: 2,
        testimonial: "Trois champs bien calibrés. Tu peux venir bosser chez moi.",
      },
    ],
  },

  // ───── 25-26 Sultan chat / Infirmière ─────
  {
    id: "sultan",
    name: "Sultan le Chat",
    age: 9,
    emoji: "🐈",
    color: "#d4a85a",
    personality: "paresseux royal",
    tagline: "Un frisson, pas plus, merci",
    contracts: [
      {
        summary: "1 squelette, rien d'autre",
        objectives: [{ type: "skeleton", target: 1 }],
        tileBudget: 8,
        reward: 1,
        testimonial: "Miaou. Un frisson suffit. Je retourne dormir.",
      },
    ],
  },
  {
    id: "brigitte",
    name: "Brigitte l'Infirmière",
    age: 36,
    emoji: "⚕️",
    color: "#f0c4c4",
    personality: "maternelle efficace",
    tagline: "Soigne le wagon, refais le plein",
    contracts: [
      {
        summary: "2 chaînes en moins de 90s",
        objectives: [{ type: "chain", target: 2 }],
        timeLimit: 90,
        reward: 2,
        testimonial: "Deux chaînes en une minute et demie. Soin express validé.",
      },
    ],
  },

  // ───── 27-28 Chef / Voyante ─────
  {
    id: "oscar",
    name: "Oscar le Chef",
    age: 48,
    emoji: "👨‍🍳",
    color: "#e8d4a8",
    personality: "gourmet râleur",
    tagline: "Dosage millimétré, rien qui déborde",
    contracts: [
      {
        summary: "Score 350 en 15 tuiles",
        objectives: [{ type: "score", target: 350 }],
        tileBudget: 15,
        reward: 3,
        testimonial: "Trois cent cinquante points en quinze ingrédients : grand chef, grand respect.",
      },
    ],
  },
  {
    id: "kim",
    name: "Kim la Voyante",
    age: 55,
    emoji: "🔮",
    color: "#7a5ac8",
    personality: "mystique bavarde",
    tagline: "Les portails me parlent",
    contracts: [
      {
        summary: "3 portails + 1 aimant",
        objectives: [{ type: "portalUse", target: 3 }, { type: "magnetField", target: 1 }],
        reward: 2,
        testimonial: "Les portails m'ont livré leur secret. Merci mon enfant.",
      },
    ],
  },

  // ───── 29-30 Étudiant / Judoka ─────
  {
    id: "momo",
    name: "Momo l'Étudiant",
    age: 21,
    emoji: "📖",
    color: "#7a9abc",
    personality: "stressé sous caféine",
    tagline: "Vite, j'ai partiels demain",
    contracts: [
      {
        summary: "6 pièces en 45s",
        objectives: [{ type: "coin", target: 6 }],
        timeLimit: 45,
        reward: 2,
        testimonial: "Six pièces avant mes fiches. Tu me sauves la révision.",
      },
    ],
  },
  {
    id: "yuki",
    name: "Yuki la Judoka",
    age: 30,
    emoji: "🥋",
    color: "#3a3a5a",
    personality: "disciplinée silencieuse",
    tagline: "Technique pure, sans artifice",
    contracts: [
      {
        summary: "1 apocalypse sans portail",
        objectives: [{ type: "apocalypse", target: 1 }],
        forbidTools: ["portal"],
        reward: 3,
        testimonial: "Hajime, ippon, fin. Technique irréprochable.",
      },
    ],
  },

  // ───── 31-32 Routier / Scout ─────
  {
    id: "dede",
    name: "Dédé le Routier",
    age: 58,
    emoji: "🚛",
    color: "#a87a3a",
    personality: "bourru généreux",
    tagline: "Du spectaculaire, pas du frisé",
    contracts: [
      {
        summary: "5 catapultes",
        objectives: [{ type: "catapult", target: 5 }],
        reward: 2,
        testimonial: "Cinq envols, du brut comme je les aime. Café offert la prochaine fois.",
      },
    ],
  },
  {
    id: "theo",
    name: "Théo le Scout",
    age: 11,
    emoji: "🏕️",
    color: "#6ea84a",
    personality: "énergique curieux",
    tagline: "Pièces ET frissons, les deux !",
    contracts: [
      {
        summary: "3 pièces + 1 squelette",
        objectives: [{ type: "coin", target: 3 }, { type: "skeleton", target: 1 }],
        reward: 1,
        testimonial: "Une pièce et un frisson, chef scout je rentre à la base !",
      },
    ],
  },

  // ───── 33-34 Avocate / Grec ─────
  {
    id: "ava",
    name: "Ava l'Avocate",
    age: 42,
    emoji: "⚖️",
    color: "#4a4a6a",
    personality: "rigoureuse glaciale",
    tagline: "Pas un point de trop, pas un point de moins",
    contracts: [
      {
        summary: "Exactement 2 squelettes + 4 pièces",
        objectives: [{ type: "skeleton", target: 2 }, { type: "coin", target: 4 }],
        failOn: { apocalypse: 1, loop: 1 },
        reward: 3,
        testimonial: "Le contrat, toute la lettre, rien que la lettre. Admis au barreau.",
      },
    ],
  },
  {
    id: "zorba",
    name: "Zorba le Grec",
    age: 66,
    emoji: "🕺",
    color: "#4a8ac8",
    personality: "exubérant dansant",
    tagline: "Tout en même temps, OPA !",
    contracts: [
      {
        summary: "1 apocalypse + 1 constellation",
        objectives: [{ type: "apocalypse", target: 1 }, { type: "constellation", target: 1 }],
        reward: 3,
        testimonial: "Feu du ciel et feu de la terre ! OPA ! Je te paye l'ouzo !",
      },
    ],
  },

  // ───── 35-36 Tatoueuse / Rappeur ─────
  {
    id: "prune",
    name: "Prune la Tatoueuse",
    age: 28,
    emoji: "🎤",
    color: "#2d2d45",
    personality: "rock'n'roll obsessive",
    tagline: "Loops loops loops",
    contracts: [
      {
        summary: "4 loopings en 2 minutes",
        objectives: [{ type: "loop", target: 4 }],
        timeLimit: 120,
        reward: 2,
        testimonial: "Quatre loops, je te grave le motif gratuit la prochaine fois.",
      },
    ],
  },
  {
    id: "mo",
    name: "Mo le Rappeur",
    age: 23,
    emoji: "🎙️",
    color: "#ffc447",
    personality: "chill verbeux",
    tagline: "Groove d'abord, frissons ensuite",
    contracts: [
      {
        summary: "2 métronomes + 3 pièces",
        objectives: [{ type: "metronome", target: 2 }, { type: "coin", target: 3 }],
        reward: 2,
        testimonial: "Le beat, le cash, le flow. T'as le sens du rythme mon gars.",
      },
    ],
  },

  // ───── 37-38 Coach / Gamer ─────
  {
    id: "chantal",
    name: "Chantal la Coach",
    age: 50,
    emoji: "🏋️",
    color: "#e87a4a",
    personality: "motivante survoltée",
    tagline: "PLUS, TOUJOURS PLUS, ALLEZ !",
    contracts: [
      {
        summary: "10 squelettes + 5 pièces en 3min",
        objectives: [{ type: "skeleton", target: 10 }, { type: "coin", target: 5 }],
        timeLimit: 180,
        reward: 3,
        testimonial: "DIX FRISSONS CINQ PIÈCES, TU VAS FAIRE UNE CARRIÈRE !",
      },
    ],
  },
  {
    id: "igor_jr",
    name: "Igor Jr. le Gamer",
    age: 14,
    emoji: "🎮",
    color: "#4ac8c8",
    personality: "stratège tryhard",
    tagline: "Combo optimisé, 100% efficient",
    contracts: [
      {
        summary: "3 chaînes en moins de 100s",
        objectives: [{ type: "chain", target: 3 }],
        timeLimit: 100,
        reward: 3,
        testimonial: "Trois chaînes sub-100, GG WP. On ranked-up le parc.",
      },
    ],
  },

  // ───── 39-40 Fleuriste / Photographe ─────
  {
    id: "eliane",
    name: "Éliane la Fleuriste",
    age: 65,
    emoji: "🌸",
    color: "#f4c4d8",
    personality: "douce jardinière",
    tagline: "Doucement, pas de lave chérie",
    contracts: [
      {
        summary: "6 pièces sans lave ni apocalypse",
        objectives: [{ type: "coin", target: 6 }],
        forbidTools: ["lava"],
        failOn: { apocalypse: 1 },
        reward: 2,
        testimonial: "Six pièces dans la quiétude florale. Un parc comme un jardin.",
      },
    ],
  },
  {
    id: "fabrice",
    name: "Fabrice le Photographe",
    age: 39,
    emoji: "📸",
    color: "#5c6c7c",
    personality: "voyeur patient",
    tagline: "Le cliché parfait, une seule fois",
    contracts: [
      {
        summary: "1 constellation + 1 geyser",
        objectives: [{ type: "constellation", target: 1 }, { type: "geyser", target: 1 }],
        reward: 2,
        testimonial: "Le cliché de ma vie : astres et geyser dans le même cadre.",
      },
      {
        summary: "2 aimants + 1 métronome",
        objectives: [{ type: "magnetField", target: 2 }, { type: "metronome", target: 1 }],
        reward: 2,
        testimonial: "Deux champs, un rythme : expo solo assurée.",
      },
    ],
  },
];

export function getVipById(id) {
  return VIPS.find((v) => v.id === id) || null;
}

export function pickContract(vip, index = 0) {
  if (!vip || !vip.contracts || vip.contracts.length === 0) return null;
  return vip.contracts[index % vip.contracts.length] || null;
}

export const TILE = 32;
export const COLS = 40;
export const ROWS = 18;
export const GROUND_ROW = 14;
export const WIDTH = COLS * TILE;
export const HEIGHT = ROWS * TILE;
// Monde élargi : on peut construire au-delà de la vue par défaut (zoom out → voit plus)
export const WORLD_COLS = 80;
export const WORLD_WIDTH = WORLD_COLS * TILE;

export const SPEED = 220;
export const JUMP = 620;
export const WAGON_JUMP = 560;

export const COMBO_WINDOW = 2.5;
export const COMBO_MULTIPLIERS = [1, 1, 2, 3, 5, 8];
export const MILESTONES = [50, 100, 250, 500, 1000, 2000, 5000];

export const WAGON_THEMES = [
  { body: [107, 60, 26], dark: [45, 26, 14], trim: [255, 210, 63] },
  { body: [196, 60, 60], dark: [120, 30, 30], trim: [255, 220, 80] },
  { body: [60, 150, 80], dark: [30, 80, 40], trim: [255, 255, 150] },
  { body: [70, 90, 200], dark: [30, 40, 120], trim: [150, 220, 255] },
  { body: [180, 80, 200], dark: [100, 40, 120], trim: [255, 200, 255] },
  { body: [240, 150, 50], dark: [140, 80, 20], trim: [255, 230, 120] },
  { body: [40, 40, 40], dark: [10, 10, 10], trim: [200, 50, 50] },
  { body: [220, 220, 230], dark: [130, 130, 150], trim: [80, 160, 230] },
];

export const TILE_CODE = {
  lava: "L", water: "W", rail: "R", rail_up: "U", rail_down: "D",
  coin: "C", boost: "B", trampoline: "T", fan: "F", portal: "P",
  ice: "I", magnet: "M", bridge: "N", wheel: "Y", rail_loop: "Z",
  ground: "Q", tunnel: "X",
};
export const CODE_TILE = Object.fromEntries(
  Object.entries(TILE_CODE).map(([k, v]) => [v, k]),
);

export const STORAGE_KEY = "milan_lava_park";

export const TOOLBAR_ORDER = [
  { tool: "cursor", key: "`", label: "Curseur" },
  { tool: "lava", key: "1", label: "Lave" },
  { tool: "rail", key: "2", label: "Rail" },
  { tool: "rail_up", key: "4", label: "Up" },
  { tool: "rail_down", key: "5", label: "Dn" },
  { tool: "water", key: "6", label: "Eau" },
  { tool: "boost", key: "7", label: "Boost" },
  { tool: "coin", key: "8", label: "Piece" },
  { tool: "trampoline", key: "9", label: "Tramp" },
  { tool: "fan", key: "0", label: "Vent" },
  { tool: "portal", key: "P", label: "Portail" },
  { tool: "ice", key: "G", label: "Glace" },
  { tool: "magnet", key: "A", label: "Aimant" },
  { tool: "bridge", key: "V", label: "Pont" },
  { tool: "wheel", key: "Y", label: "Roue" },
  { tool: "rail_loop", key: "L", label: "Loop" },
  { tool: "erase", key: "3", label: "Gomme" },
  { tool: "sol", key: "K", label: "Sol" },
  { tool: "tunnel", key: "B", label: "Tunnel" },
];
export const TB_ICON = 52;
export const TB_GAP = 4;
export const TB_TOTAL_W = TOOLBAR_ORDER.length * (TB_ICON + TB_GAP);
export const TB_START_X = (WIDTH - TB_TOTAL_W) / 2;
export const TB_Y = HEIGHT - TB_ICON - 14;

export const COG_X = WIDTH - 50;
export const COG_Y = 90;
export const COG_R = 22;

export function gridKey(col, row) {
  return `${col},${row}`;
}

export const SEASONS = ["normal", "halloween", "christmas", "carnival"];

export function currentSeason(date = new Date()) {
  const epoch = new Date(2026, 0, 1).getTime();
  const fortnights = Math.floor((date.getTime() - epoch) / (14 * 86400000));
  return SEASONS[((fortnights % SEASONS.length) + SEASONS.length) % SEASONS.length];
}

export const SEASON_PALETTES = {
  normal:    { lava: [255, 100,  30], sky: [ 92, 148, 252], accent: [255, 220,  60] },
  halloween: { lava: [180,  50, 200], sky: [ 40,  30,  80], accent: [255, 140,  30] },
  christmas: { lava: [220,  60,  40], sky: [180, 200, 230], accent: [255, 250, 250] },
  carnival:  { lava: [255,  80, 180], sky: [255, 180, 220], accent: [ 80, 220, 200] },
};

export const MODE_CONFIG = {
  campaign: {
    enableTiers: false,
    enableQuests: false,
    enableVisitorQuests: false,
    enableAmbientVisitors: false,
    enableWeather: false,
    enableMinigames: false,
    enableBalloons: false,
    enableCoinThief: false,
    enableRace: false,
    enableGhostTrain: false,
    enableInverseTrain: false,
    enableTutorial: false,
    lockToolbar: true,
    numPlayers: 1,
    wagonAutoSpawn: false,
  },
  run: {
    enableTiers: false,
    enableQuests: false,
    enableVisitorQuests: false,
    enableAmbientVisitors: true,
    enableWeather: false,
    enableMinigames: false,
    enableBalloons: true,
    enableCoinThief: true,
    enableRace: false,
    enableGhostTrain: true,
    enableInverseTrain: false,
    enableTutorial: false,
    lockToolbar: false,
    numPlayers: 1,
    wagonAutoSpawn: true,
    wagonSpawnInterval: 5,
    wagonCap: 3,
  },
  sandbox: {
    enableTiers: true,
    enableQuests: true,
    enableVisitorQuests: true,
    enableAmbientVisitors: true,
    enableWeather: true,
    enableMinigames: true,
    enableBalloons: true,
    enableCoinThief: true,
    enableRace: true,
    enableGhostTrain: true,
    enableInverseTrain: true,
    enableTutorial: true,
    lockToolbar: false,
    numPlayers: 2,
    wagonAutoSpawn: false,
  },
};

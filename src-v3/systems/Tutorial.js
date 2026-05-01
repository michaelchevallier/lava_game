import { SaveSystem } from "./SaveSystem.js";

let _step = 0;
let _active = false;
let _runnerRef = null;
let _stepTimer = null;

const STEPS = [
  "Bienvenue dans Milan Crowd Defense ! Bouge avec <strong>WASD</strong> ou les flèches.",
  "Vois ces cercles jaunes au sol ? Ce sont des <strong>Points de construction</strong>. Approche-en un.",
  "Sélectionne une tour : touche <strong>1</strong> pour Archer (30¢).",
  "Reste sur le cercle pour la construire.",
  "Bien joué ! Détruis les ennemis pour gagner des <strong>pièces</strong>. Ils arrivent par vagues.",
  "Quand tu montes de niveau, choisis un <strong>perk</strong>. Bonne défense, gardien !",
];

function getOverlay() { return document.getElementById("tutorial-overlay"); }
function getTextEl() { return document.getElementById("tutorial-text"); }

function showStep() {
  const ov = getOverlay();
  const txt = getTextEl();
  if (!ov || !txt) return;
  txt.innerHTML = STEPS[_step];
  ov.classList.remove("hidden");
  ov.classList.add("visible");
}

function advance() {
  if (!_active) return;
  _step++;
  if (_step >= STEPS.length) {
    finish();
    return;
  }
  if (_step === 4) {
    showStep();
    _stepTimer = setTimeout(() => { if (_active) advance(); }, 3000);
    return;
  }
  if (_step === 5) {
    showStep();
    _stepTimer = setTimeout(() => { if (_active) finish(); }, 3000);
    return;
  }
  showStep();
}

function finish() {
  _active = false;
  _step = 0;
  if (_stepTimer) { clearTimeout(_stepTimer); _stepTimer = null; }
  SaveSystem.setTutorialDone();
  _detachListeners();
  const ov = getOverlay();
  if (!ov) return;
  ov.classList.remove("visible");
  setTimeout(() => { ov.classList.add("hidden"); }, 300);
}

function _onKeyDown(e) {
  if (!_active) return;
  if (_step === 0) {
    if (e.code === "KeyW" || e.code === "KeyA" || e.code === "KeyS" || e.code === "KeyD" ||
        e.code === "ArrowUp" || e.code === "ArrowDown" || e.code === "ArrowLeft" || e.code === "ArrowRight") {
      advance();
    }
    return;
  }
  if (_step === 2) {
    const m = e.code.match(/^Digit([1-9])$/);
    if (m && parseInt(m[1], 10) === 1) advance();
    return;
  }
}

function _onTowerBuilt() {
  if (!_active || _step !== 3) return;
  advance();
}

let _keyHandler = null;
let _towerHandler = null;

function _attachListeners() {
  _keyHandler = (e) => _onKeyDown(e);
  _towerHandler = () => _onTowerBuilt();
  window.addEventListener("keydown", _keyHandler);
  document.addEventListener("crowdef:tower-built", _towerHandler);
}

function _detachListeners() {
  if (_keyHandler) { window.removeEventListener("keydown", _keyHandler); _keyHandler = null; }
  if (_towerHandler) { document.removeEventListener("crowdef:tower-built", _towerHandler); _towerHandler = null; }
}

function _tickProximityCheck() {
  if (!_active || _step !== 1 || !_runnerRef) return;
  const hero = _runnerRef.hero;
  const bps = _runnerRef.buildPoints;
  if (!hero || !bps || bps.length === 0) return;
  const hp = hero.group.position;
  for (const bp of bps) {
    const dx = hp.x - bp.pos.x;
    const dz = hp.z - bp.pos.z;
    if (dx * dx + dz * dz < 49) {
      advance();
      return;
    }
  }
}

export const Tutorial = {
  tryStart(runner) {
    if (SaveSystem.getTutorialDone()) return;
    if (!runner.level || runner.level.id !== "world1-1") return;
    _runnerRef = runner;
    _step = 0;
    _active = true;
    _attachListeners();
    showStep();
  },

  tick() {
    _tickProximityCheck();
  },

  isActive() { return _active; },

  skip() { if (_active) finish(); },
};

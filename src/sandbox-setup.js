import { serializeTiles, deserializeTiles, showExportModal } from "./serializer.js";
import { createContractRunner } from "./contracts.js";

export function createSandboxSetup({
  k, tileMap, save, persistSave, audio, juice, showPopup,
  router, placeTile, groundSystem, spectres, WIDTH, HEIGHT,
}) {
  function clearAll() {
    tileMap.forEach((t) => {
      if (t.extras) t.extras.forEach((e) => k.destroy(e));
      k.destroy(t);
    });
    tileMap.clear();
  }

  function buildDemoCircuit() {
    clearAll();
    placeTile(6, 13, "coin");
    placeTile(8, 13, "coin");
    placeTile(10, 13, "boost");
    placeTile(13, 13, "lava");
    placeTile(14, 13, "lava");
    placeTile(15, 13, "lava");
    placeTile(16, 13, "lava");
    placeTile(18, 13, "coin");
    placeTile(20, 12, "rail_up");
    placeTile(21, 11, "rail");
    placeTile(22, 11, "rail");
    placeTile(23, 11, "coin");
    placeTile(24, 11, "rail");
    placeTile(25, 11, "rail");
    placeTile(26, 12, "rail_down");
    placeTile(28, 13, "trampoline");
    placeTile(31, 13, "water");
    placeTile(32, 13, "water");
    placeTile(34, 13, "lava");
    placeTile(35, 13, "lava");
    placeTile(36, 13, "lava");
    placeTile(3, 8, "portal");
    placeTile(38, 13, "portal");
  }

  function loadParkFromCode(code) {
    try {
      clearAll();
      deserializeTiles(code, placeTile, (pairs) => groundSystem.loadDugMap(pairs));
      audio.combo();
      showPopup(WIDTH / 2, 100, "PARC CHARGE !", k.rgb(124, 201, 71), 32);
    } catch (e) {
      showPopup(WIDTH / 2, 100, "CODE INVALIDE", k.rgb(255, 80, 80), 28);
    }
  }

  function exportAction() {
    const code = serializeTiles(tileMap, groundSystem.getDugMap());
    spectres.unlock("first_save");
    showExportModal(code, (pasted) => { loadParkFromCode(pasted); });
  }

  function resetPark() {
    clearAll();
    save.sandboxLayout = null;
    persistSave(save);
    showPopup(WIDTH / 2, 100, "PARC VIERGE !", k.rgb(124, 201, 71), 32);
  }

  function initSandboxScene() {
    if (router.get().mode !== "sandbox") return;
    if (save.sandboxLayout) {
      k.wait(0.1, () => {
        try {
          deserializeTiles(save.sandboxLayout, placeTile, (pairs) => groundSystem.loadDugMap(pairs));
        } catch (e) { console.error("sandbox layout load failed", e); }
      });
    }
    k.loop(10, () => {
      try {
        save.sandboxLayout = serializeTiles(tileMap, groundSystem.getDugMap());
        persistSave(save);
      } catch (e) {}
    });

    const contractEntry = router.get().contractEntry;
    if (contractEntry) {
      const contractRunner = createContractRunner({
        k, save, persistSave,
        showPopup: (...args) => showPopup(...args),
        WIDTH, HEIGHT,
        onHonored: () => {
          juice.dirShake(0, 1, 10, 0.25);
          k.wait(1.8, () => { router.enter({ contractEntry: null }); });
        },
        onFailed: () => {
          juice.dirShake(0, -1, 8, 0.2);
          k.wait(1.2, () => { router.enter({ contractEntry: null }); });
        },
      });
      window.__contract = contractRunner;
      k.wait(0.4, () => contractRunner.start(contractEntry));
      k.loop(0.5, () => contractRunner.tick(0.5));
    }
  }

  return { buildDemoCircuit, loadParkFromCode, exportAction, resetPark, initSandboxScene };
}

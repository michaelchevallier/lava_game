export function createRaceSystem({
  k, gameState, settings, audio, juice, showPopup,
  spawnWagon, exitWagon, getActivePlayers,
  WORLD_WIDTH, TILE, GROUND_ROW, WIDTH, HEIGHT,
}) {
  let race = null;

  function spawnRaceWagon(color, startX) {
    spawnWagon();
    const w = k.get("wagon").at(-1);
    w.pos.x = startX;
    w.isRace = true;
    w.invincible = true;
    w.raceColor = color;
    w.lapsCompleted = 0;
    w.halfTurnDir = 1;
    w.theme = color === "red"
      ? { body: [220, 40, 40], dark: [120, 0, 0], trim: [255, 200, 50] }
      : { body: [40, 80, 220], dark: [0, 30, 120], trim: [200, 220, 255] };
    if (w.parts && w.parts[0]) {
      w.parts[0].color = k.rgb(...w.theme.body);
    }
    if (w.parts && w.parts[3]) {
      w.parts[3].color = k.rgb(...w.theme.dark);
      w.parts[4].color = k.rgb(...w.theme.dark);
    }
    if (w.parts && w.parts[5]) {
      w.parts[5].color = k.rgb(...w.theme.trim);
    }
    w.speed = 0;
    return w;
  }

  function forceBoardPlayer(player, wagon) {
    if (!player || !wagon) return;
    player.ridingWagon = wagon;
    wagon.rider = player;
    player.opacity = 0;
    if (player.vel) player.vel = k.vec2(0, 0);
  }

  function start() {
    if (race?.active) return;
    if (race?.cooldownUntil && k.time() < race.cooldownUntil) {
      const remaining = Math.ceil(race.cooldownUntil - k.time());
      showPopup(WIDTH / 2, 80, `Course en cooldown (${remaining}s)`, k.rgb(255, 100, 100), 18);
      return;
    }
    if ((settings.numPlayers || 1) < 2) {
      showPopup(WIDTH / 2, 80, "RACE = 2 JOUEURS REQUIS", k.rgb(255, 80, 80), 22);
      return;
    }
    const players = getActivePlayers?.() || [];
    if (players.length < 2) {
      showPopup(WIDTH / 2, 80, "Aucun joueur trouve", k.rgb(255, 80, 80), 22);
      return;
    }

    const prevCooldown = race?.cooldownUntil || 0;
    race = { active: true, wagons: [], cooldownUntil: prevCooldown, started: false };

    const red = spawnRaceWagon("red", TILE * 5);
    const blue = spawnRaceWagon("blue", TILE * 9);
    red.raceLocked = true;
    blue.raceLocked = true;
    race.wagons = [red, blue];

    forceBoardPlayer(players[0], red);
    forceBoardPlayer(players[1], blue);

    showPopup(WIDTH / 2, 80, "3", k.rgb(255, 220, 60), 36);
    k.wait(0.8, () => {
      audio.boost?.();
      showPopup(WIDTH / 2, 80, "2", k.rgb(255, 180, 60), 36);
    });
    k.wait(1.6, () => {
      audio.boost?.();
      showPopup(WIDTH / 2, 80, "1", k.rgb(255, 120, 60), 36);
    });
    k.wait(2.4, () => {
      audio.combo?.();
      showPopup(WIDTH / 2, 80, "PARTEZ !", k.rgb(60, 255, 120), 40);
      if (race?.active) {
        race.started = true;
        const speedBase = 140 * (gameState.wagonSpeedMult || 1);
        for (const w of race.wagons) {
          if (w.exists()) {
            w.speed = speedBase;
            w.halfTurnDir = 1;
            w.raceLocked = false; // déverrouille rider control pour les 2 joueurs
          }
        }
      }
    });
  }

  function checkLapsAndBounce(wagon) {
    if (!race?.started) return;
    const labelColor = wagon.raceColor === "red" ? k.rgb(255, 80, 80) : k.rgb(80, 150, 255);

    if (wagon.pos.x < 0 && wagon.halfTurnDir < 0) {
      wagon.halfTurnDir = 1;
      wagon.speed = Math.abs(wagon.speed);
      wagon.lapsCompleted += 0.5;
      audio.boost?.();
      showPopup(wagon.pos.x + 40, wagon.pos.y - 30, "DEMI-TOUR !", labelColor, 18);
      if (wagon.lapsCompleted >= 3) { declareWinner(wagon); return; }
    } else if (wagon.pos.x > WORLD_WIDTH - 80 && wagon.halfTurnDir > 0) {
      wagon.halfTurnDir = -1;
      wagon.speed = -Math.abs(wagon.speed);
      wagon.lapsCompleted += 0.5;
      audio.boost?.();
      showPopup(wagon.pos.x - 40, wagon.pos.y - 30, "DEMI-TOUR !", labelColor, 18);
      if (wagon.lapsCompleted >= 3) { declareWinner(wagon); return; }
    }
  }

  function declareWinner(wagon) {
    if (!race?.active) return;
    race.active = false;
    const colorName = wagon.raceColor === "red" ? "ROUGE" : "BLEU";
    showPopup(WIDTH / 2, HEIGHT / 2 - 40, `JOUEUR ${colorName} GAGNE !`, k.rgb(255, 220, 60), 30);
    gameState.score += 500;
    showPopup(WIDTH / 2, HEIGHT / 2 + 10, `${colorName} +500 pts !`, k.rgb(255, 220, 60), 22);

    const loser = race.wagons.find(w => w !== wagon);
    if (loser?.exists()) {
      gameState.score += 100;
      showPopup(WIDTH / 2, HEIGHT / 2 + 50, "Participant +100 pts", k.rgb(180, 180, 200), 16);
    }

    juice?.dirShake(0, -1, 12, 0.4);
    wagon.isGolden = true;
    if (wagon.parts?.[0]) wagon.parts[0].color = k.rgb(255, 200, 30);
    if (wagon.parts?.[5]) wagon.parts[5].color = k.rgb(255, 240, 100);

    const savedCooldown = k.time() + 30;
    k.wait(3, () => {
      if (race) race.cooldownUntil = savedCooldown;
      cleanup();
    });
  }

  function abort(reason) {
    if (!race) return;
    showPopup(WIDTH / 2, 80, `COURSE ANNULEE (${reason})`, k.rgb(255, 80, 80), 20);
    race.cooldownUntil = k.time() + 5;
    cleanup();
  }

  function cleanup() {
    if (!race) return;
    const prevCooldown = race.cooldownUntil || 0;
    const wagons = race.wagons || [];
    race = { active: false, cooldownUntil: prevCooldown };

    for (const w of wagons) {
      if (!w || !w.exists()) continue;
      if (w.rider) {
        try { exitWagon(w.rider); } catch (_) {}
      }
      if (w.parts) {
        for (const p of w.parts) {
          if (p && p.exists()) k.destroy(p);
        }
      }
      if (w.exists()) k.destroy(w);
    }
  }

  function check() {
    if (!race?.active) return;
    for (const w of race.wagons) {
      if (!w.exists()) { abort("wagon detruit"); return; }
      checkLapsAndBounce(w);
    }
  }

  k.add([
    k.pos(0, 0),
    k.fixed(),
    k.z(45),
    {
      draw() {
        if (!race?.active) return;
        const [red, blue] = race.wagons;
        if (!red?.exists() || !blue?.exists()) return;

        k.drawRect({ pos: k.vec2(WIDTH / 2 - 100, 4), width: 200, height: 22, color: k.rgb(0, 0, 0), opacity: 0.6 });
        const lapMax = Math.max(red.lapsCompleted || 0, blue.lapsCompleted || 0);
        k.drawText({
          text: race.started ? `RACE TOUR ${Math.floor(lapMax) + 1}/3` : "RACE EN ATTENTE",
          size: 14,
          pos: k.vec2(WIDTH / 2, 14),
          anchor: "center",
          color: k.rgb(255, 255, 255),
        });

        k.drawRect({ pos: k.vec2(8, 4), width: 80, height: 28, color: k.rgb(220, 40, 40), opacity: 0.8 });
        k.drawText({ text: `P1 ${(red.lapsCompleted || 0).toFixed(1)}/3`, size: 12, pos: k.vec2(48, 18), anchor: "center", color: k.rgb(255, 255, 255) });
        k.drawRect({ pos: k.vec2(8, 32), width: Math.round(80 * Math.min(1, (red.lapsCompleted || 0) / 3)), height: 4, color: k.rgb(255, 100, 100) });

        k.drawRect({ pos: k.vec2(WIDTH - 88, 4), width: 80, height: 28, color: k.rgb(40, 80, 220), opacity: 0.8 });
        k.drawText({ text: `P2 ${(blue.lapsCompleted || 0).toFixed(1)}/3`, size: 12, pos: k.vec2(WIDTH - 48, 18), anchor: "center", color: k.rgb(255, 255, 255) });
        k.drawRect({ pos: k.vec2(WIDTH - 88, 32), width: Math.round(80 * Math.min(1, (blue.lapsCompleted || 0) / 3)), height: 4, color: k.rgb(100, 150, 255) });
      },
    },
  ]);

  return {
    start,
    check,
    abort,
    isActive: () => !!race?.active,
    getStatus: () => ({ active: !!race?.active, wagons: race?.wagons }),
  };
}

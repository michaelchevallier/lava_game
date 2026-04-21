export function createRouter(initial = {}) {
  let current = {
    mode: "sandbox",
    levelId: null,
    runDuration: 180,
    numPlayers: 1,
    avatars: {},
    ...initial,
  };
  const enterHandlers = [];
  const exitHandlers = [];

  function get() { return current; }

  function enter(next = {}) {
    const prev = current;
    for (const fn of exitHandlers) {
      try { fn(prev); } catch (e) { console.error("router.onExit", e); }
    }
    current = { ...prev, ...next };
    for (const fn of enterHandlers) {
      try { fn(current, prev); } catch (e) { console.error("router.onEnter", e); }
    }
  }

  function onEnter(fn) { enterHandlers.push(fn); return () => {
    const i = enterHandlers.indexOf(fn);
    if (i >= 0) enterHandlers.splice(i, 1);
  }; }

  function onExit(fn) { exitHandlers.push(fn); return () => {
    const i = exitHandlers.indexOf(fn);
    if (i >= 0) exitHandlers.splice(i, 1);
  }; }

  return { get, enter, onEnter, onExit };
}

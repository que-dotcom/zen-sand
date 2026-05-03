export const EMPTY = 0;
export const SAND  = 1;
export const WATER = 2;
export const WALL  = 3;
export const SNOW  = 4;
export const FIRE  = 5;

// ─── Update functions ───────────────────────────────────────────────────────

function updateSand(engine, x, y) {
  const below = engine.get(x, y + 1);
  // Fall straight down
  if (below === EMPTY || below === WATER) {
    engine.swap(x, y, x, y + 1);
    return;
  }
  // Slide diagonally
  const dir = Math.random() > 0.5 ? 1 : -1;
  const dA = engine.get(x + dir, y + 1);
  const dB = engine.get(x - dir, y + 1);
  if (dA === EMPTY || dA === WATER) { engine.swap(x, y, x + dir, y + 1); return; }
  if (dB === EMPTY || dB === WATER) { engine.swap(x, y, x - dir, y + 1); return; }
}

function updateWater(engine, x, y) {
  // Fall down
  if (engine.get(x, y + 1) === EMPTY) { engine.swap(x, y, x, y + 1); return; }
  // Diagonal fall
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x + dir, y + 1) === EMPTY) { engine.swap(x, y, x + dir, y + 1); return; }
  if (engine.get(x - dir, y + 1) === EMPTY) { engine.swap(x, y, x - dir, y + 1); return; }
  // Spread sideways (limited steps to avoid teleporting)
  if (engine.get(x + dir, y) === EMPTY) { engine.swap(x, y, x + dir, y); return; }
  if (engine.get(x - dir, y) === EMPTY) { engine.swap(x, y, x - dir, y); return; }
}

function updateSnow(engine, x, y) {
  // Slow, fluffy fall
  if (Math.random() > 0.45) return;
  const below = engine.get(x, y + 1);
  if (below === EMPTY) { engine.swap(x, y, x, y + 1); return; }
  // Dissolve in water
  if (below === WATER) {
    engine.cells[engine.idx(x, y)] = EMPTY;
    engine.colors[engine.idx(x, y)] = 0;
    return;
  }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x + dir, y + 1) === EMPTY) { engine.swap(x, y, x + dir, y + 1); return; }
  if (engine.get(x - dir, y + 1) === EMPTY) { engine.swap(x, y, x - dir, y + 1); return; }
  // Gentle sideways drift
  if (Math.random() > 0.88 && engine.get(x + dir, y) === EMPTY) {
    engine.swap(x, y, x + dir, y);
  }
}

function updateFire(engine, x, y) {
  // Rise upward
  if (Math.random() > 0.6) return;
  const up = engine.get(x, y - 1);
  if (up === EMPTY) { engine.swap(x, y, x, y - 1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x + dir, y - 1) === EMPTY) { engine.swap(x, y, x + dir, y - 1); return; }
  if (engine.get(x - dir, y - 1) === EMPTY) { engine.swap(x, y, x - dir, y - 1); return; }
  // Fade out randomly
  if (Math.random() > 0.94) {
    engine.cells[engine.idx(x, y)] = EMPTY;
    engine.colors[engine.idx(x, y)] = 0;
  }
  // Ignite neighboring materials
  const neighbors = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx, dy] of neighbors) {
    if (engine.get(x + dx, y + dy) === SNOW) {
      engine.set(x + dx, y + dy, WATER); // Snow melts
    }
  }
}

// ─── Material definitions ────────────────────────────────────────────────────

export const MATERIALS = {
  [EMPTY]: { name: 'empty',         colors: [],                                                                    update: null       },
  [SAND]:  { name: 'sand',          colors: [0xC2A35A, 0xD4B56A, 0xB8943E, 0xCFAF58, 0xBFA050, 0xC8AB62],        update: updateSand  },
  [WATER]: { name: 'water',         colors: [0x3A7BD5, 0x2E6BC4, 0x4A8BE5, 0x3575D0, 0x5090DF, 0x2D65C0],        update: updateWater },
  [WALL]:  { name: 'wall',          colors: [0x888888, 0x777777, 0x999999, 0x828282, 0x6E6E6E],                   update: null       },
  [SNOW]:  { name: 'snow',          colors: [0xEEEEFF, 0xFFFFFF, 0xDDDDEE, 0xF0F0FF, 0xE8E8F8, 0xF5F5FF],        update: updateSnow  },
  [FIRE]:  { name: 'fire',          colors: [0xFF4400, 0xFF6600, 0xFF2200, 0xFF8800, 0xFFAA00, 0xFF3300],         update: updateFire  },
};

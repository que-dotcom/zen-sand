// ─── Material IDs ────────────────────────────────────────────────────────────
export const EMPTY = 0;
export const SAND  = 1;
export const WATER = 2;
export const WALL  = 3;
export const SNOW  = 4;
export const FIRE  = 5;
export const OIL   = 6;
export const LAVA  = 7;
export const SMOKE = 8;
export const ASH   = 9;
export const COAL  = 10;
export const STONE = 11;
export const GLASS = 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FLAMMABLE = new Set([OIL, COAL]);

// ─── Update functions ─────────────────────────────────────────────────────────

function updateSand(engine, x, y) {
  const below = engine.get(x, y + 1);
  if (below === EMPTY || below === WATER || below === OIL) {
    engine.swap(x, y, x, y + 1); return;
  }
  const dir = Math.random() > 0.5 ? 1 : -1;
  const dA = engine.get(x + dir, y + 1);
  const dB = engine.get(x - dir, y + 1);
  if (dA === EMPTY || dA === WATER || dA === OIL) { engine.swap(x, y, x + dir, y + 1); return; }
  if (dB === EMPTY || dB === WATER || dB === OIL) { engine.swap(x, y, x - dir, y + 1); return; }
  // Near lava → slowly becomes glass
  if (Math.random() > 0.985) {
    const nb = [engine.get(x,y+1), engine.get(x,y-1), engine.get(x+1,y), engine.get(x-1,y)];
    if (nb.includes(LAVA)) engine.set(x, y, GLASS);
  }
}

function updateWater(engine, x, y) {
  // Sink below oil
  const below = engine.get(x, y + 1);
  if (below === EMPTY || below === OIL) { engine.swap(x, y, x, y + 1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x + dir, y + 1) === EMPTY) { engine.swap(x, y, x + dir, y + 1); return; }
  if (engine.get(x - dir, y + 1) === EMPTY) { engine.swap(x, y, x - dir, y + 1); return; }
  if (engine.get(x + dir, y) === EMPTY)     { engine.swap(x, y, x + dir, y);     return; }
  if (engine.get(x - dir, y) === EMPTY)     { engine.swap(x, y, x - dir, y);     return; }
}

function updateSnow(engine, x, y) {
  if (Math.random() > 0.45) return;
  const below = engine.get(x, y + 1);
  if (below === EMPTY) { engine.swap(x, y, x, y + 1); return; }
  // Melt in water or lava
  if (below === WATER || below === LAVA) { engine.set(x, y, WATER); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x + dir, y + 1) === EMPTY) { engine.swap(x, y, x + dir, y + 1); return; }
  if (engine.get(x - dir, y + 1) === EMPTY) { engine.swap(x, y, x - dir, y + 1); return; }
  if (Math.random() > 0.88 && engine.get(x + dir, y) === EMPTY) {
    engine.swap(x, y, x + dir, y);
  }
}

function updateFire(engine, x, y) {
  if (Math.random() > 0.6) return;

  // Produce smoke above
  if (Math.random() > 0.75 && engine.get(x, y - 1) === EMPTY) {
    engine.set(x, y - 1, SMOKE);
  }

  // Spread and react with neighbors
  const nbDirs = [[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1]];
  for (const [dx, dy] of nbDirs) {
    const n = engine.get(x + dx, y + dy);
    if (n === OIL  && Math.random() > 0.08) { engine.set(x + dx, y + dy, FIRE); }
    if (n === COAL && Math.random() > 0.94) { engine.set(x + dx, y + dy, FIRE); }
    if (n === SNOW && Math.random() > 0.5)  { engine.set(x + dx, y + dy, WATER); }
    // Water extinguishes fire
    if (n === WATER && Math.random() > 0.55) {
      engine.set(x, y, SMOKE);
      engine.updated[engine.idx(x, y)] = 1;
      return;
    }
  }

  // Rise upward
  const up = engine.get(x, y - 1);
  if (up === EMPTY || up === SMOKE) { engine.swap(x, y, x, y - 1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x + dir, y - 1) === EMPTY) { engine.swap(x, y, x + dir, y - 1); return; }
  if (engine.get(x - dir, y - 1) === EMPTY) { engine.swap(x, y, x - dir, y - 1); return; }

  // Burn out → ash or vanish
  if (Math.random() > 0.93) {
    engine.set(x, y, Math.random() > 0.45 ? ASH : EMPTY);
  }
}

function updateOil(engine, x, y) {
  // Buoyancy: rise through water
  if (engine.get(x, y - 1) === WATER) { engine.swap(x, y, x, y - 1); return; }

  const below = engine.get(x, y + 1);
  if (below === EMPTY) { engine.swap(x, y, x, y + 1); return; }

  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x + dir, y + 1) === EMPTY) { engine.swap(x, y, x + dir, y + 1); return; }
  if (engine.get(x - dir, y + 1) === EMPTY) { engine.swap(x, y, x - dir, y + 1); return; }
  if (engine.get(x + dir, y) === EMPTY)     { engine.swap(x, y, x + dir, y);     return; }
  if (engine.get(x - dir, y) === EMPTY)     { engine.swap(x, y, x - dir, y);     return; }

  // Ignite from fire or lava
  const check = [[0,-1],[1,0],[-1,0],[0,1],[1,-1],[-1,-1]];
  for (const [dx, dy] of check) {
    const n = engine.get(x + dx, y + dy);
    if ((n === FIRE || n === LAVA) && Math.random() > 0.05) {
      engine.set(x, y, FIRE); return;
    }
  }
}

function updateLava(engine, x, y) {
  if (Math.random() > 0.4) return; // Lava is sluggish

  // React with surroundings first
  const nbDirs = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx, dy] of nbDirs) {
    const n = engine.get(x + dx, y + dy);
    // Water → solidify into stone, water → steam
    if (n === WATER) {
      engine.set(x, y, STONE);
      engine.set(x + dx, y + dy, SMOKE);
      return;
    }
    // Snow → melt
    if (n === SNOW) { engine.set(x + dx, y + dy, WATER); }
    // Oil → ignite
    if (n === OIL && Math.random() > 0.3) { engine.set(x + dx, y + dy, FIRE); }
  }
  // Sand below → slowly becomes glass
  if (engine.get(x, y + 1) === SAND && Math.random() > 0.97) {
    engine.set(x, y + 1, GLASS);
  }

  // Flow like very slow water
  const below = engine.get(x, y + 1);
  if (below === EMPTY) { engine.swap(x, y, x, y + 1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x + dir, y + 1) === EMPTY) { engine.swap(x, y, x + dir, y + 1); return; }
  if (engine.get(x - dir, y + 1) === EMPTY) { engine.swap(x, y, x - dir, y + 1); return; }
  if (engine.get(x + dir, y) === EMPTY)     { engine.swap(x, y, x + dir, y);     return; }
  if (engine.get(x - dir, y) === EMPTY)     { engine.swap(x, y, x - dir, y);     return; }
}

function updateSmoke(engine, x, y) {
  if (Math.random() > 0.5) return;
  const up = engine.get(x, y - 1);
  if (up === EMPTY) { engine.swap(x, y, x, y - 1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x + dir, y - 1) === EMPTY) { engine.swap(x, y, x + dir, y - 1); return; }
  if (engine.get(x - dir, y - 1) === EMPTY) { engine.swap(x, y, x - dir, y - 1); return; }
  if (engine.get(x + dir, y) === EMPTY)     { engine.swap(x, y, x + dir, y);     return; }
  if (engine.get(x - dir, y) === EMPTY)     { engine.swap(x, y, x - dir, y);     return; }
  // Dissipate
  if (Math.random() > 0.96) engine.set(x, y, EMPTY);
}

function updateAsh(engine, x, y) {
  // Dissolve in water
  const nb = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx, dy] of nb) {
    if (engine.get(x + dx, y + dy) === WATER && Math.random() > 0.94) {
      engine.set(x, y, EMPTY); return;
    }
  }
  // Slow fall
  if (Math.random() > 0.35) return;
  const below = engine.get(x, y + 1);
  if (below === EMPTY || below === WATER) { engine.swap(x, y, x, y + 1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x + dir, y + 1) === EMPTY) { engine.swap(x, y, x + dir, y + 1); return; }
  if (engine.get(x - dir, y + 1) === EMPTY) { engine.swap(x, y, x - dir, y + 1); return; }
}

function updateCoal(engine, x, y) {
  // Falls like sand
  const below = engine.get(x, y + 1);
  if (below === EMPTY || below === WATER) { engine.swap(x, y, x, y + 1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  const dA = engine.get(x + dir, y + 1);
  const dB = engine.get(x - dir, y + 1);
  if (dA === EMPTY || dA === WATER) { engine.swap(x, y, x + dir, y + 1); return; }
  if (dB === EMPTY || dB === WATER) { engine.swap(x, y, x - dir, y + 1); return; }
  // Ignite slowly from fire or lava
  const check = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx, dy] of check) {
    const n = engine.get(x + dx, y + dy);
    if ((n === FIRE || n === LAVA) && Math.random() > 0.985) {
      engine.set(x, y, FIRE); return;
    }
  }
}

// ─── Material definitions ─────────────────────────────────────────────────────
export const MATERIALS = {
  [EMPTY]: { name: 'empty', colors: [],                                                                  update: null        },
  [SAND]:  { name: 'sand',  colors: [0xC2A35A,0xD4B56A,0xB8943E,0xCFAF58,0xBFA050,0xC8AB62],           update: updateSand  },
  [WATER]: { name: 'water', colors: [0x3A7BD5,0x2E6BC4,0x4A8BE5,0x3575D0,0x5090DF,0x2D65C0],           update: updateWater },
  [WALL]:  { name: 'wall',  colors: [0x888888,0x777777,0x999999,0x828282,0x6E6E6E],                     update: null        },
  [SNOW]:  { name: 'snow',  colors: [0xEEEEFF,0xFFFFFF,0xDDDDEE,0xF0F0FF,0xE8E8F8,0xF5F5FF],           update: updateSnow  },
  [FIRE]:  { name: 'fire',  colors: [0xFF4400,0xFF6600,0xFF2200,0xFF8800,0xFFAA00,0xFF3300],             update: updateFire  },
  [OIL]:   { name: 'oil',   colors: [0x8B6914,0x7A5C10,0x9B7824,0x6E5010,0xA08030],                    update: updateOil   },
  [LAVA]:  { name: 'lava',  colors: [0xFF4500,0xFF6000,0xFF2200,0xFF7700,0xFF5500,0xEE4000],             update: updateLava  },
  [SMOKE]: { name: 'smoke', colors: [0x555555,0x444444,0x666666,0x4A4A4A,0x505050],                     update: updateSmoke },
  [ASH]:   { name: 'ash',   colors: [0xBBBBBB,0xAAAAAA,0xCCCCCC,0xB8B8B8,0xC4C4C4],                    update: updateAsh   },
  [COAL]:  { name: 'coal',  colors: [0x222222,0x1A1A1A,0x2A2A2A,0x1E1E1E,0x252525],                    update: updateCoal  },
  [STONE]: { name: 'stone', colors: [0x5A5A5A,0x4E4E4E,0x686868,0x525252,0x606060],                    update: null        },
  [GLASS]: { name: 'glass', colors: [0xB8E0FF,0xC0E8FF,0xA8D8F0,0xCCEEFF,0xD0F0FF],                    update: null        },
};

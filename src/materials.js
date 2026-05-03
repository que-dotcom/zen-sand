// ─── Material IDs ─────────────────────────────────────────────────────────────
export const EMPTY       = 0;
export const SAND        = 1;
export const WATER       = 2;
export const WALL        = 3;
export const SNOW        = 4;
export const FIRE        = 5;
export const OIL         = 6;
export const LAVA        = 7;
export const SMOKE       = 8;
export const ASH         = 9;
export const COAL        = 10;
export const STONE       = 11;
export const GLASS       = 12;
export const SOIL        = 13;
export const SEED        = 14;
export const PLANT       = 15;
export const DARK_PLANT  = 16;
export const FUNGUS      = 17;
export const GLOW_FUNGUS = 18;
export const FLOWER      = 19;
export const DARK_FLOWER = 20;
export const METAL       = 21;
export const LIGHTNING   = 22;
export const SPARK       = 23;

// ─── Plant meta encoding (Uint8) ──────────────────────────────────────────────
// bits 0-2: flower color index (0-7)
// bit  3  : size flag (0=small, 1=large)
// bit  4  : dark flag (0=normal, 1=dark)
const META_COLOR = 0x07;
const META_LARGE = 0x08;
const META_DARK  = 0x10;

const FLOWER_COLORS  = [0xFF6688, 0xFFDD44, 0xFF88BB, 0xFFEEEE, 0xFF9944, 0x99EEAA, 0xCC88FF, 0x88CCFF];
const DARK_F_COLORS  = [0xAA00BB, 0x990022, 0x440044, 0x001144, 0x220033, 0x004422, 0x550000, 0x330044];
const STEM_COLORS    = [0x2D5A1B, 0x3D7A25, 0x4A8A2C, 0x52A030, 0x5AB038];
const DARK_STEM_COLS = [0x1A081A, 0x220A22, 0x2A0A2A, 0x300A30, 0x1E081E];
const FLOWER_CENTER  = 0xFFFF99; // stamen
const DARK_F_CENTER  = 0x220022;

// ─── Combustion update functions ───────────────────────────────────────────────

function updateSand(engine, x, y) {
  const below = engine.get(x, y + 1);
  if (below === EMPTY || below === WATER || below === OIL) { engine.swap(x, y, x, y + 1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  const dA = engine.get(x + dir, y + 1), dB = engine.get(x - dir, y + 1);
  if (dA === EMPTY || dA === WATER || dA === OIL) { engine.swap(x, y, x + dir, y + 1); return; }
  if (dB === EMPTY || dB === WATER || dB === OIL) { engine.swap(x, y, x - dir, y + 1); return; }
  // Lava contact → glass
  if (Math.random() > 0.985) {
    const nb = [engine.get(x,y+1), engine.get(x,y-1), engine.get(x+1,y), engine.get(x-1,y)];
    if (nb.includes(LAVA)) engine.set(x, y, GLASS);
  }
}

function updateWater(engine, x, y) {
  const below = engine.get(x, y + 1);
  if (below === EMPTY || below === OIL) { engine.swap(x, y, x, y + 1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x + dir, y + 1) === EMPTY) { engine.swap(x, y, x + dir, y + 1); return; }
  if (engine.get(x - dir, y + 1) === EMPTY) { engine.swap(x, y, x - dir, y + 1); return; }
  if (engine.get(x + dir, y)     === EMPTY) { engine.swap(x, y, x + dir, y);     return; }
  if (engine.get(x - dir, y)     === EMPTY) { engine.swap(x, y, x - dir, y);     return; }
  // Slowly convert adjacent sand → soil
  if (Math.random() > 0.997) {
    const check = [[0,1],[1,0],[-1,0]];
    for (const [dx,dy] of check) {
      if (engine.get(x+dx, y+dy) === SAND) { engine.set(x+dx, y+dy, SOIL); break; }
    }
  }
}

function updateSnow(engine, x, y) {
  if (Math.random() > 0.45) return;
  const below = engine.get(x, y + 1);
  if (below === EMPTY) { engine.swap(x, y, x, y + 1); return; }
  if (below === WATER || below === LAVA) { engine.set(x, y, WATER); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x + dir, y + 1) === EMPTY) { engine.swap(x, y, x + dir, y + 1); return; }
  if (engine.get(x - dir, y + 1) === EMPTY) { engine.swap(x, y, x - dir, y + 1); return; }
  if (Math.random() > 0.88 && engine.get(x + dir, y) === EMPTY) engine.swap(x, y, x + dir, y);
}

function updateFire(engine, x, y) {
  if (Math.random() > 0.6) return;
  if (Math.random() > 0.75 && engine.get(x, y - 1) === EMPTY) engine.set(x, y - 1, SMOKE);

  const nbDirs = [[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1]];
  for (const [dx, dy] of nbDirs) {
    const n = engine.get(x+dx, y+dy);
    if (n === OIL        && Math.random() > 0.08) { engine.set(x+dx, y+dy, FIRE);  }
    if (n === COAL       && Math.random() > 0.94) { engine.set(x+dx, y+dy, FIRE);  }
    if (n === SNOW       && Math.random() > 0.50) { engine.set(x+dx, y+dy, WATER); }
    if (n === PLANT      && Math.random() > 0.40) { engine.set(x+dx, y+dy, FIRE);  }
    if (n === DARK_PLANT && Math.random() > 0.20) { engine.set(x+dx, y+dy, FIRE);  }
    if (n === FLOWER     && Math.random() > 0.50) { engine.set(x+dx, y+dy, FIRE);  }
    if (n === DARK_FLOWER&& Math.random() > 0.30) { engine.set(x+dx, y+dy, FIRE);  }
    if (n === FUNGUS     && Math.random() > 0.50) { engine.set(x+dx, y+dy, EMPTY); }
    if (n === GLOW_FUNGUS&& Math.random() > 0.50) { engine.set(x+dx, y+dy, EMPTY); }
    if (n === WATER && Math.random() > 0.55) {
      engine.set(x, y, SMOKE); engine.updated[engine.idx(x,y)] = 1; return;
    }
  }

  const up = engine.get(x, y - 1);
  if (up === EMPTY || up === SMOKE) { engine.swap(x, y, x, y - 1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x+dir, y-1) === EMPTY) { engine.swap(x, y, x+dir, y-1); return; }
  if (engine.get(x-dir, y-1) === EMPTY) { engine.swap(x, y, x-dir, y-1); return; }
  if (Math.random() > 0.93) engine.set(x, y, Math.random() > 0.45 ? ASH : EMPTY);
}

function updateOil(engine, x, y) {
  if (engine.get(x, y-1) === WATER) { engine.swap(x, y, x, y-1); return; }
  const below = engine.get(x, y+1);
  if (below === EMPTY) { engine.swap(x, y, x, y+1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x+dir, y+1) === EMPTY) { engine.swap(x, y, x+dir, y+1); return; }
  if (engine.get(x-dir, y+1) === EMPTY) { engine.swap(x, y, x-dir, y+1); return; }
  if (engine.get(x+dir, y)   === EMPTY) { engine.swap(x, y, x+dir, y);   return; }
  if (engine.get(x-dir, y)   === EMPTY) { engine.swap(x, y, x-dir, y);   return; }
  const check = [[0,-1],[1,0],[-1,0],[0,1],[1,-1],[-1,-1]];
  for (const [dx,dy] of check) {
    const n = engine.get(x+dx, y+dy);
    if ((n === FIRE || n === LAVA) && Math.random() > 0.05) { engine.set(x, y, FIRE); return; }
  }
}

function updateLava(engine, x, y) {
  if (Math.random() > 0.4) return;
  const nbDirs = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nbDirs) {
    const n = engine.get(x+dx, y+dy);
    if (n === WATER) { engine.set(x, y, STONE); engine.set(x+dx, y+dy, SMOKE); return; }
    if (n === SNOW)  { engine.set(x+dx, y+dy, WATER); }
    if (n === OIL  && Math.random() > 0.3)  { engine.set(x+dx, y+dy, FIRE); }
    if ((n === PLANT || n === DARK_PLANT || n === FLOWER || n === DARK_FLOWER) && Math.random() > 0.2) {
      engine.set(x+dx, y+dy, FIRE);
    }
  }
  if (engine.get(x, y+1) === SAND && Math.random() > 0.97) engine.set(x, y+1, GLASS);
  const below = engine.get(x, y+1);
  if (below === EMPTY) { engine.swap(x, y, x, y+1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x+dir, y+1) === EMPTY) { engine.swap(x, y, x+dir, y+1); return; }
  if (engine.get(x-dir, y+1) === EMPTY) { engine.swap(x, y, x-dir, y+1); return; }
  if (engine.get(x+dir, y)   === EMPTY) { engine.swap(x, y, x+dir, y);   return; }
  if (engine.get(x-dir, y)   === EMPTY) { engine.swap(x, y, x-dir, y);   return; }
}

function updateSmoke(engine, x, y) {
  if (Math.random() > 0.5) return;
  const up = engine.get(x, y-1);
  if (up === EMPTY) { engine.swap(x, y, x, y-1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x+dir, y-1) === EMPTY) { engine.swap(x, y, x+dir, y-1); return; }
  if (engine.get(x-dir, y-1) === EMPTY) { engine.swap(x, y, x-dir, y-1); return; }
  if (engine.get(x+dir, y)   === EMPTY) { engine.swap(x, y, x+dir, y);   return; }
  if (engine.get(x-dir, y)   === EMPTY) { engine.swap(x, y, x-dir, y);   return; }
  if (Math.random() > 0.96) engine.set(x, y, EMPTY);
}

function updateAsh(engine, x, y) {
  const nb = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb) {
    if (engine.get(x+dx, y+dy) === WATER && Math.random() > 0.94) { engine.set(x, y, EMPTY); return; }
  }
  if (Math.random() > 0.35) return;
  const below = engine.get(x, y+1);
  if (below === EMPTY || below === WATER) { engine.swap(x, y, x, y+1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x+dir, y+1) === EMPTY) { engine.swap(x, y, x+dir, y+1); return; }
  if (engine.get(x-dir, y+1) === EMPTY) { engine.swap(x, y, x-dir, y+1); return; }
}

function updateCoal(engine, x, y) {
  const below = engine.get(x, y+1);
  if (below === EMPTY || below === WATER) { engine.swap(x, y, x, y+1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  const dA = engine.get(x+dir, y+1), dB = engine.get(x-dir, y+1);
  if (dA === EMPTY || dA === WATER) { engine.swap(x, y, x+dir, y+1); return; }
  if (dB === EMPTY || dB === WATER) { engine.swap(x, y, x-dir, y+1); return; }
  const check = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of check) {
    const n = engine.get(x+dx, y+dy);
    if ((n === FIRE || n === LAVA) && Math.random() > 0.985) { engine.set(x, y, FIRE); return; }
  }
}

// ─── Life & growth update functions ──────────────────────────────────────────

function updateSoil(engine, x, y) {
  // 砂と同じ重力挙動（落下・積み上げ）
  const below = engine.get(x, y+1);
  if (below === EMPTY || below === WATER) { engine.swap(x, y, x, y+1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  const dA = engine.get(x+dir, y+1), dB = engine.get(x-dir, y+1);
  if (dA === EMPTY || dA === WATER) { engine.swap(x, y, x+dir, y+1); return; }
  if (dB === EMPTY || dB === WATER) { engine.swap(x, y, x-dir, y+1); return; }
}

function updateSeed(engine, x, y) {
  // Fall like sand
  const below = engine.get(x, y+1);
  if (below === EMPTY || below === WATER) { engine.swap(x, y, x, y+1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  const dA = engine.get(x+dir, y+1), dB = engine.get(x-dir, y+1);
  if (dA === EMPTY || dA === WATER) { engine.swap(x, y, x+dir, y+1); return; }
  if (dB === EMPTY || dB === WATER) { engine.swap(x, y, x-dir, y+1); return; }

  if (Math.random() > 0.04) return; // germination check（緩和）

  // Heat kills seed
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === FIRE || n === LAVA) { engine.set(x, y, ASH); return; }
  }

  // Must rest on solid ground
  const onGround = [SOIL,SAND,STONE,WALL,GLASS,COAL,ASH].includes(below);
  if (!onGround) return;

  // 半径3セル以内の水・油を探索（範囲拡大）
  let hasWater = false, hasOil = false;
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      if (dx === 0 && dy === 0) continue;
      const n = engine.get(x+dx, y+dy);
      if (n === WATER || n === SOIL) hasWater = true;
      if (n === OIL)                 hasOil   = true;
    }
  }
  // 土の上なら水なしでも発芽可能
  if (!hasWater && below !== SOIL) return;

  // Germinate
  const isDark   = hasOil;
  const colorIdx = Math.floor(Math.random() * 8);
  const isLarge  = Math.random() > 0.5 ? META_LARGE : 0;
  const metaByte = colorIdx | isLarge | (isDark ? META_DARK : 0);
  const stemCols = isDark ? DARK_STEM_COLS : STEM_COLORS;

  engine.plant(x, y, isDark ? DARK_PLANT : PLANT, stemCols[0], metaByte);
}

function updatePlant(engine, x, y) {
  const i   = engine.idx(x, y);
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];

  // React to fire / lava → burn
  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === FIRE || n === LAVA) { engine.set(x, y, FIRE); return; }
    // Oil contact → mutate to dark plant
    if (n === OIL && Math.random() > 0.96) {
      engine.cells[i]  = DARK_PLANT;
      engine.colors[i] = DARK_STEM_COLS[0];
      engine.meta[i]   = engine.meta[i] | META_DARK;
      return;
    }
  }

  if (Math.random() > 0.012) return; // growth tick

  if (engine.get(x, y-1) !== EMPTY) return; // blocked above

  const meta = engine.meta[i];
  // 半径2セル以内の水を探索
  let hasWater = false;
  for (let dy = -2; dy <= 2 && !hasWater; dy++)
    for (let dx = -2; dx <= 2 && !hasWater; dx++)
      if (engine.get(x+dx, y+dy) === WATER) hasWater = true;
  if (!hasWater && Math.random() > 0.3) return;

  // Estimate height by scanning downward
  let height = 0;
  for (let dy = 1; dy <= 16; dy++) {
    if (engine.get(x, y+dy) === PLANT) height++; else break;
  }

  const bloomChance = Math.min(0.06 + height * 0.045, 0.6);

  if (Math.random() < bloomChance) {
    _bloom(engine, x, y-1, meta, false);
  } else {
    const stemColor = STEM_COLORS[Math.min(height, STEM_COLORS.length-1)];
    engine.plant(x, y-1, PLANT, stemColor, meta);
  }
}

function updateDarkPlant(engine, x, y) {
  const i   = engine.idx(x, y);
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];

  // React to fire / lava → burn intensely
  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === FIRE || n === LAVA) {
      engine.set(x, y, FIRE);
      // Spread fire aggressively
      const sdir = Math.random() > 0.5 ? 1 : -1;
      if (engine.get(x+sdir, y) !== EMPTY) engine.set(x+sdir, y, FIRE);
      return;
    }
  }

  // Drip oil to nearby empty cells
  if (Math.random() > 0.997) {
    const oilDirs = [[1,0],[-1,0],[0,1]];
    for (const [dx,dy] of oilDirs) {
      if (engine.get(x+dx, y+dy) === EMPTY) { engine.set(x+dx, y+dy, OIL); break; }
    }
  }

  if (Math.random() > 0.02) return; // growth tick

  // Dark plants grow diagonally
  const growDirs = [[-1,-1],[1,-1],[0,-1]];
  growDirs.sort(() => Math.random() - 0.5); // shuffle

  for (const [dx,dy] of growDirs) {
    const nx = x+dx, ny = y+dy;
    if (!engine.inBounds(nx,ny) || engine.get(nx,ny) !== EMPTY) continue;

    const meta = engine.meta[i];
    let height = 0;
    for (let ddy = 1; ddy <= 16; ddy++) {
      if (engine.get(x, y+ddy) === DARK_PLANT) height++; else break;
    }
    const bloomChance = Math.min(0.08 + height * 0.05, 0.65);

    if (Math.random() < bloomChance) {
      _bloom(engine, nx, ny, meta, true);
    } else {
      const col = DARK_STEM_COLS[Math.floor(Math.random() * DARK_STEM_COLS.length)];
      engine.plant(nx, ny, DARK_PLANT, col, meta);
    }
    break;
  }
}

// Shared bloom logic
function _bloom(engine, x, y, meta, isDark) {
  const colorIdx    = meta & META_COLOR;
  const isLarge     = (meta & META_LARGE) !== 0;
  const petalColor  = isDark ? DARK_F_COLORS[colorIdx] : FLOWER_COLORS[colorIdx];
  const centerColor = isDark ? DARK_F_CENTER : FLOWER_CENTER;
  const radius      = isLarge
    ? 3 + Math.floor(Math.random() * 2)
    : 1 + Math.floor(Math.random() * 2);
  const flowerType  = isDark ? DARK_FLOWER : FLOWER;

  // Center (stamen)
  engine.plant(x, y, flowerType, centerColor, meta);

  // Petals spread horizontally
  for (let dx = -radius; dx <= radius; dx++) {
    if (dx === 0) continue;
    const fx = x + dx;
    if (!engine.inBounds(fx, y)) continue;
    if (engine.get(fx, y) === EMPTY) {
      engine.plant(fx, y, flowerType, petalColor, meta);
    }
  }
  // One row of petals above center too (fuller flower)
  for (let dx = -Math.floor(radius/2); dx <= Math.floor(radius/2); dx++) {
    const fx = x + dx;
    if (!engine.inBounds(fx, y-1)) continue;
    if (engine.get(fx, y-1) === EMPTY) {
      engine.plant(fx, y-1, flowerType, petalColor, meta);
    }
  }
}

function updateFungus(engine, x, y) {
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === FIRE || n === LAVA)             { engine.set(x, y, EMPTY);      return; }
    if (n === OIL  && Math.random() > 0.97)   { engine.set(x, y, GLOW_FUNGUS); return; }
  }
  if (Math.random() > 0.002) return;

  const spreadDirs = [[1,0],[-1,0],[0,1]];
  for (const [dx,dy] of spreadDirs) {
    const nx = x+dx, ny = y+dy;
    if (!engine.inBounds(nx,ny) || engine.get(nx,ny) !== EMPTY) continue;
    const bt = engine.get(nx, ny+1);
    const solid = bt !== EMPTY && bt !== WATER && bt !== OIL && bt !== LAVA && bt !== FIRE;
    if (solid) { engine.set(nx, ny, FUNGUS); engine.updated[engine.idx(nx,ny)] = 1; return; }
  }
}

function updateGlowFungus(engine, x, y) {
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === FIRE || n === LAVA)          { engine.set(x, y, EMPTY); return; }
    if (n === OIL  && Math.random() > 0.8) { engine.set(x+dx, y+dy, EMPTY); } // consume oil
  }
  if (Math.random() > 0.008) return;

  const spreadDirs = [[1,0],[-1,0],[0,1]];
  for (const [dx,dy] of spreadDirs) {
    const nx = x+dx, ny = y+dy;
    if (!engine.inBounds(nx,ny)) continue;
    const target = engine.get(nx,ny);
    if (target !== EMPTY && target !== OIL && target !== FUNGUS) continue;
    const bt = engine.get(nx, ny+1);
    const solid = bt !== EMPTY && bt !== WATER && bt !== OIL && bt !== LAVA && bt !== FIRE;
    if (solid || target === OIL) { engine.set(nx, ny, GLOW_FUNGUS); engine.updated[engine.idx(nx,ny)] = 1; return; }
  }
}

// ─── Electricity update functions ────────────────────────────────────────────

function updateMetal(engine, x, y) {
  // Falls like sand but slightly more stable (less diagonal sliding)
  const below = engine.get(x, y+1);
  if (below === EMPTY || below === WATER) { engine.swap(x, y, x, y+1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  const dA = engine.get(x+dir, y+1), dB = engine.get(x-dir, y+1);
  if ((dA === EMPTY || dA === WATER) && Math.random() > 0.35) { engine.swap(x, y, x+dir, y+1); return; }
  if ((dB === EMPTY || dB === WATER) && Math.random() > 0.35) { engine.swap(x, y, x-dir, y+1); return; }
  // Lava melts metal → becomes lava
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    if (engine.get(x+dx, y+dy) === LAVA && Math.random() > 0.94) {
      engine.set(x, y, LAVA); return;
    }
  }
}

// 雷の隣接反応ヘルパー（進行中・着地点で共用）
function _lightningReact(engine, x, y) {
  const dirs = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of dirs) {
    const nx = x+dx, ny = y+dy;
    const n  = engine.get(nx, ny);
    const ni = engine.idx(nx, ny);
    if (n === METAL && engine.meta[ni] === 0) {
      engine.cells[ni]  = LIGHTNING;
      engine.colors[ni] = MATERIALS[LIGHTNING].colors[Math.floor(Math.random() * MATERIALS[LIGHTNING].colors.length)];
      engine.meta[ni]   = 5 + Math.floor(Math.random() * 3);
    } else if (n === WATER) {
      engine.cells[ni]   = SPARK;
      engine.colors[ni]  = MATERIALS[SPARK].colors[Math.floor(Math.random() * MATERIALS[SPARK].colors.length)];
      engine.updated[ni] = 1;
    } else if (n === SAND   && Math.random() > 0.25) { engine.set(nx, ny, GLASS); }
    else if (n === OIL)                               { engine.set(nx, ny, FIRE);  }
    else if (n === COAL)                              { engine.set(nx, ny, FIRE);  }
    else if (n === SNOW)                              { engine.set(nx, ny, WATER); }
    else if (n === SOIL)                              { engine.set(nx, ny, SAND);  }
    else if (n === PLANT  || n === DARK_PLANT ||
             n === FLOWER || n === DARK_FLOWER)       { engine.set(nx, ny, FIRE);  }
    else if (n === FUNGUS || n === GLOW_FUNGUS)       { engine.set(nx, ny, GLOW_FUNGUS); }
    else if (n === SEED)                              { engine.set(nx, ny, ASH);   }
  }
}

function updateLightning(engine, x, y) {
  const i = engine.idx(x, y);
  if (engine.meta[i] === 0) engine.meta[i] = 5 + Math.floor(Math.random() * 4);

  // 上から下へ高速落下（最大4セル/frame）＋ジグザグ
  const SPEED  = 4;
  const zigDir = Math.random() > 0.5 ? 1 : -1;
  let cx = x, cy = y;

  for (let step = 0; step < SPEED; step++) {
    let nx = cx, ny = cy + 1;
    if (!engine.inBounds(nx, ny)) break;

    // 30%の確率でジグザグ
    if (Math.random() > 0.7 && engine.inBounds(cx + zigDir, cy + 1)
        && engine.get(cx + zigDir, cy + 1) === EMPTY) {
      nx = cx + zigDir;
    } else if (engine.get(cx, cy + 1) !== EMPTY) {
      // 直下が塞がれていたら斜め下を試みる
      if (engine.inBounds(cx + zigDir, cy + 1) && engine.get(cx + zigDir, cy + 1) === EMPTY) {
        nx = cx + zigDir;
      } else if (engine.inBounds(cx - zigDir, cy + 1) && engine.get(cx - zigDir, cy + 1) === EMPTY) {
        nx = cx - zigDir;
      } else {
        break;
      }
    }

    if (engine.get(nx, ny) !== EMPTY) break;

    // 通過点の左右に反応チェック
    _lightningReact(engine, nx, ny);

    cx = nx; cy = ny;
  }

  if (cx !== x || cy !== y) {
    // 旧位置をSPARKトレイルに
    engine.cells[i]  = EMPTY;
    engine.colors[i] = 0;
    engine.meta[i]   = 0;

    // 新位置に雷を配置
    const ni = engine.idx(cx, cy);
    engine.cells[ni]  = LIGHTNING;
    engine.colors[ni] = MATERIALS[LIGHTNING].colors[Math.floor(Math.random() * MATERIALS[LIGHTNING].colors.length)];
    engine.meta[ni]   = 5 + Math.floor(Math.random() * 4);
    engine.updated[ni] = 1;
    _lightningReact(engine, cx, cy);
  } else {
    // 動けない：反応して消滅カウントダウン
    _lightningReact(engine, x, y);
    engine.meta[i]--;
    if (engine.meta[i] <= 0) {
      engine.cells[i] = EMPTY; engine.colors[i] = 0; engine.meta[i] = 0;
    }
  }
}
function updateSpark(engine, x, y) {
  // Fade back to water quickly
  if (Math.random() > 0.82) { engine.set(x, y, WATER); return; }

  // Spread electric wave through adjacent water (one generation per frame)
  if (Math.random() > 0.6) return;
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    const nx = x+dx, ny = y+dy;
    if (engine.get(nx, ny) === WATER) {
      const ni = engine.idx(nx, ny);
      engine.cells[ni]   = SPARK;
      engine.colors[ni]  = MATERIALS[SPARK].colors[Math.floor(Math.random() * MATERIALS[SPARK].colors.length)];
      engine.updated[ni] = 1; // one step per frame = visible wave front
    }
  }
}

// ─── Material definitions ──────────────────────────────────────────────────────
export const MATERIALS = {
  [EMPTY]:       { name: 'empty',       colors: [],                                                                    update: null            },
  [SAND]:        { name: 'sand',        colors: [0xC2A35A,0xD4B56A,0xB8943E,0xCFAF58,0xBFA050,0xC8AB62],              update: updateSand      },
  [WATER]:       { name: 'water',       colors: [0x3A7BD5,0x2E6BC4,0x4A8BE5,0x3575D0,0x5090DF,0x2D65C0],              update: updateWater     },
  [WALL]:        { name: 'wall',        colors: [0x888888,0x777777,0x999999,0x828282,0x6E6E6E],                        update: null            },
  [SNOW]:        { name: 'snow',        colors: [0xEEEEFF,0xFFFFFF,0xDDDDEE,0xF0F0FF,0xE8E8F8,0xF5F5FF],              update: updateSnow      },
  [FIRE]:        { name: 'fire',        colors: [0xFF4400,0xFF6600,0xFF2200,0xFF8800,0xFFAA00,0xFF3300],                update: updateFire      },
  [OIL]:         { name: 'oil',         colors: [0x8B6914,0x7A5C10,0x9B7824,0x6E5010,0xA08030],                       update: updateOil       },
  [LAVA]:        { name: 'lava',        colors: [0xFF4500,0xFF6000,0xFF2200,0xFF7700,0xFF5500,0xEE4000],                update: updateLava      },
  [SMOKE]:       { name: 'smoke',       colors: [0x555555,0x444444,0x666666,0x4A4A4A,0x505050],                        update: updateSmoke     },
  [ASH]:         { name: 'ash',         colors: [0xBBBBBB,0xAAAAAA,0xCCCCCC,0xB8B8B8,0xC4C4C4],                       update: updateAsh       },
  [COAL]:        { name: 'coal',        colors: [0x222222,0x1A1A1A,0x2A2A2A,0x1E1E1E,0x252525],                       update: updateCoal      },
  [STONE]:       { name: 'stone',       colors: [0x5A5A5A,0x4E4E4E,0x686868,0x525252,0x606060],                       update: null            },
  [GLASS]:       { name: 'glass',       colors: [0xB8E0FF,0xC0E8FF,0xA8D8F0,0xCCEEFF,0xD0F0FF],                       update: null            },
  [SOIL]:        { name: 'soil',        colors: [0x5C3D1E,0x4A2E12,0x6B4A28,0x523518,0x3E2810],                       update: updateSoil      },
  [SEED]:        { name: 'seed',        colors: [0xA8C060,0x90A840,0xB8D070,0x98B848,0xC0D878],                       update: updateSeed      },
  [PLANT]:       { name: 'plant',       colors: [0x3D7A25,0x4A8A2C,0x52A030,0x2D5A1B,0x5AB038],                       update: updatePlant     },
  [DARK_PLANT]:  { name: 'dark_plant',  colors: [0x1A081A,0x220A22,0x2A0A2A,0x300A30,0x1E081E],                       update: updateDarkPlant },
  [FUNGUS]:      { name: 'fungus',      colors: [0x4A2060,0x3A1050,0x5A3070,0x441858,0x3C1060],                       update: updateFungus    },
  [GLOW_FUNGUS]: { name: 'glow_fungus', colors: [0x00FFCC,0x00DDAA,0x00FFAA,0x33FFDD,0x00EEC0],                       update: updateGlowFungus},
  [FLOWER]:      { name: 'flower',      colors: [...FLOWER_COLORS, FLOWER_CENTER],                                     update: null            },
  [DARK_FLOWER]: { name: 'dark_flower', colors: [...DARK_F_COLORS, DARK_F_CENTER],                                     update: null            },
  [METAL]:       { name: 'metal',       colors: [0xB0B8C8,0x909AAA,0xC0C8D8,0xA0A8B8,0x8090A0,0xC8D0E0],              update: updateMetal     },
  [LIGHTNING]:   { name: 'lightning',   colors: [0xFFFFFF,0xEEEEFF,0xCCDDFF,0xAABBFF,0xDDEEFF,0xFFFFEE],              update: updateLightning },
  [SPARK]:       { name: 'spark',       colors: [0x88CCFF,0xAADDFF,0x66BBEE,0xCCEEFF,0x99DDFF,0x55AAEE],              update: updateSpark     },
};

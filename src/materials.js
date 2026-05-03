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
export const RUST        = 24;
export const STEAM       = 25;
export const ACID        = 26;
export const MUD         = 27;
export const ICE         = 28;
export const HARD_SOIL   = 29; // 静的な土（描画スタイル）

// ─── Plant meta encoding (Uint8) ──────────────────────────────────────────────
// bits 0-2: flower color index (0-7)
// bit  3  : size flag (0=small, 1=large)
// bit  4  : dark flag (0=normal, 1=dark)
// bit  5  : lotus flag (MUD-grown plant)
const META_COLOR = 0x07;
const META_LARGE = 0x08;
const META_DARK  = 0x10;
const META_LOTUS = 0x20;

const LOTUS_COLORS    = [0xFF99CC,0xFFCCFF,0xCC88FF,0xFFEEAA,0x88DDFF,0xAAFFDD,0xFF77AA,0xDDAAFF];
const LOTUS_CENTER    = 0xFFFF44;
const LOTUS_STEM_COLS = [0x1A4A2A,0x2A5A32,0x3A6A3A,0x1E3A26,0x224A2E];

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
  // Sand + Water/Mud → MUD (slow ooze)
  if (Math.random() > 0.997) {
    const nb4s = [[0,1],[1,0],[-1,0],[0,-1]];
    for (const [dx,dy] of nb4s) {
      const sn = engine.get(x+dx, y+dy);
      if (sn === WATER || sn === MUD) { engine.set(x, y, MUD); return; }
    }
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
  // Water + Snow/Ice → ICE (slow freeze)
  if (Math.random() > 0.997) {
    const nb4w = [[0,1],[1,0],[-1,0],[0,-1]];
    for (const [dx,dy] of nb4w) {
      const wn = engine.get(x+dx, y+dy);
      if (wn === SNOW || wn === ICE) { engine.set(x, y, ICE); return; }
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
      if (Math.random() > 0.5) { engine.set(x, y, STEAM); engine.meta[engine.idx(x,y)] = 0; }
      else { engine.set(x, y, SMOKE); }
      engine.updated[engine.idx(x,y)] = 1; return;
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
    if (n === WATER) { engine.set(x, y, STONE); engine.set(x+dx, y+dy, STEAM); engine.meta[engine.idx(x+dx,y+dy)] = 0; return; }
    if (n === ICE)   { engine.set(x, y, STONE); engine.set(x+dx, y+dy, STEAM); engine.meta[engine.idx(x+dx,y+dy)] = 0; return; }
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

  if (Math.random() > (below === MUD ? 0.08 : 0.04)) return; // MUD上は2倍速発芽

  // Dormant near ice
  {
    const nb4seed = [[0,1],[1,0],[-1,0],[0,-1]];
    for (const [dx,dy] of nb4seed) {
      if (engine.get(x+dx, y+dy) === ICE) return;
    }
  }

  // Heat kills seed
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === FIRE || n === LAVA) { engine.set(x, y, ASH); return; }
  }

  // Must rest on solid ground
  const onGround = [SOIL,SAND,STONE,WALL,GLASS,COAL,ASH,HARD_SOIL,MUD].includes(below);
  if (!onGround) return;

  // 半径3セル以内の水・油を探索
  let hasWater = false, hasOil = false, hasSteamS = false;
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      if (dx === 0 && dy === 0) continue;
      const n = engine.get(x+dx, y+dy);
      if (n === WATER || n === SOIL || n === HARD_SOIL) hasWater = true;
      if (n === OIL)                                    hasOil   = true;
      if (n === STEAM)                                  hasSteamS = true;
    }
  }
  // 蒸気は上方向に広域探索（蒸気は上昇するため遠くても有効）
  if (!hasSteamS) {
    for (let dy = -10; dy <= 1 && !hasSteamS; dy++)
      for (let dx = -6; dx <= 6 && !hasSteamS; dx++)
        if (engine.get(x+dx, y+dy) === STEAM) hasSteamS = true;
  }
  // 土/泥/固土の上 or 水/蒸気があれば発芽可能
  if (!hasWater && !hasSteamS && below !== SOIL && below !== MUD && below !== HARD_SOIL) return;

  // Germinate
  const isDark   = hasOil;
  const isMudGrow = !isDark && (below === MUD); // 泥の上 → 蓮の花
  const colorIdx = Math.floor(Math.random() * 8);
  const isLarge  = Math.random() > 0.5 ? META_LARGE : 0;
  const metaByte = colorIdx | isLarge | (isDark ? META_DARK : 0) | (isMudGrow ? META_LOTUS : 0);
  const stemCols = isDark ? DARK_STEM_COLS : (isMudGrow ? LOTUS_STEM_COLS : STEM_COLORS);

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

  if (engine.get(x, y-1) !== EMPTY) return; // blocked above

  const meta = engine.meta[i];
  const isLotusPlant = (meta & META_LOTUS) !== 0;

  // 蓮(泥生まれ)は常に成長可能。通常植物は水/蒸気/土が必要
  let hasSoilNear = false;
  if (!isLotusPlant) {
    let hasWater = false, hasSteam = false;
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const np = engine.get(x+dx, y+dy);
        if (np === WATER) hasWater = true;
        if (np === STEAM) hasSteam = true;
        if (np === SOIL || np === HARD_SOIL) hasSoilNear = true;
      }
    if (!hasWater && !hasSteam && Math.random() > 0.3) return;
  }

  // 成長確率: 蓮 > 土の近く > 通常
  const growthRate = isLotusPlant ? 0.030 : (hasSoilNear ? 0.022 : 0.012);
  if (Math.random() > growthRate) return;

  // Estimate height by scanning downward
  let height = 0;
  for (let dy = 1; dy <= 16; dy++) {
    if (engine.get(x, y+dy) === PLANT) height++; else break;
  }

  // 土の近くや蓮はより大きく咲く
  const bloomBase  = isLotusPlant ? 0.10 : (hasSoilNear ? 0.08 : 0.06);
  const bloomStep  = isLotusPlant ? 0.060 : (hasSoilNear ? 0.052 : 0.045);
  const bloomChance = Math.min(bloomBase + height * bloomStep, 0.75);

  if (Math.random() < bloomChance) {
    _bloom(engine, x, y-1, meta, false);
  } else {
    const stemColor = isLotusPlant
      ? LOTUS_STEM_COLS[Math.min(height, LOTUS_STEM_COLS.length-1)]
      : STEM_COLORS[Math.min(height, STEM_COLORS.length-1)];
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
  const isLotus     = (meta & META_LOTUS) !== 0;
  const petalColor  = isDark ? DARK_F_COLORS[colorIdx] : (isLotus ? LOTUS_COLORS[colorIdx] : FLOWER_COLORS[colorIdx]);
  const centerColor = isDark ? DARK_F_CENTER : (isLotus ? LOTUS_CENTER : FLOWER_CENTER);
  // 蓮の花は横に広く広がる
  const radius      = isLarge
    ? (isLotus ? 5 + Math.floor(Math.random() * 2) : 3 + Math.floor(Math.random() * 2))
    : (isLotus ? 3 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 2));
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
    if (n === ICE  && Math.random() > 0.95)   { engine.set(x, y, EMPTY);      return; } // 凍死
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
    if (n === ICE  && Math.random() > 0.90)  { engine.set(x, y, EMPTY); return; } // 凍死
    if (n === OIL  && Math.random() > 0.8) { engine.set(x+dx, y+dy, EMPTY); } // consume oil
  }
  // 蒸気が隣接していると超加速成長（高温多湿の洞窟）
  let glowNearSteam = false;
  for (const [dx2,dy2] of nb4) { if (engine.get(x+dx2, y+dy2) === STEAM) { glowNearSteam = true; break; } }
  if (Math.random() > (glowNearSteam ? 0.002 : 0.008)) return;

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


function updateRust(engine, x, y) {
  // 落下しない（固体）
  // 雷 → 砂に崩壊、溶岩 → 溶解
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === LIGHTNING) { engine.set(x, y, SAND); return; }
    if (n === LAVA)      { engine.set(x, y, LAVA); return; }
  }
}

// ─── Liquid & Gas update functions ───────────────────────────────────────────

function updateSteam(engine, x, y) {
  // No TTL: steam accumulates at ceiling, then drips as water

  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    const nx = x+dx, ny = y+dy, n = engine.get(nx, ny);
    if (n === SNOW || n === ICE) { engine.set(x, y, WATER); return; } // 冷えて凝結
    if (n === ASH && Math.random() > 0.99) { engine.set(x, y, EMPTY); engine.set(nx, ny, SOIL); return; } // 灰+蒸気→土（生命サイクル循環）
    if (n === COAL && Math.random() > 0.97) {
      // 蒸気機関: 圧力爆発
      engine.set(x, y, SMOKE);
      engine.set(nx, ny, FIRE);
      for (const [ex,ey] of [[0,-1],[1,-1],[-1,-1],[1,0],[-1,0],[0,-2]]) {
        const px=x+ex, py=y+ey;
        if (engine.inBounds(px,py) && engine.get(px,py) === EMPTY) {
          engine.set(px, py, Math.random() > 0.4 ? FIRE : SMOKE);
        }
      }
      return;
    }
    if (n === METAL && Math.random() > 0.995) { engine.set(nx, ny, RUST); }
  }

  // Rise slowly (25% per frame — slower than smoke)
  if (Math.random() > 0.25) {
    if (Math.random() > 0.997) { engine.set(x, y, EMPTY); } // 微量の蒸発（広い空間で消える）
    return;
  }

  const up = engine.get(x, y-1);
  if (up === EMPTY) { engine.swap(x, y, x, y-1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x+dir, y-1) === EMPTY) { engine.swap(x, y, x+dir, y-1); return; }
  if (engine.get(x-dir, y-1) === EMPTY) { engine.swap(x, y, x-dir, y-1); return; }
  // 横に少し漂う
  if (Math.random() > 0.35) return;
  if (engine.get(x+dir, y) === EMPTY) { engine.swap(x, y, x+dir, y); return; }
  if (engine.get(x-dir, y) === EMPTY) { engine.swap(x, y, x-dir, y); return; }

  // 完全に詰まった（天井または壁に押し付けられた）→ 水滴を垂らす
  const atCeiling = (y === 0 || up === WALL || up === STONE || up === GLASS || up === ICE);
  if (atCeiling && Math.random() > 0.98) {
    // 水滴が落ちる
    if (engine.inBounds(x, y+1) && engine.get(x, y+1) === EMPTY) {
      engine.set(x, y+1, WATER);
    }
    engine.set(x, y, EMPTY); // 蒸気は消えて水滴に変わった
    return;
  }
  // 天井でない詰まり → ゆっくり消散
  if (Math.random() > 0.993) { engine.set(x, y, EMPTY); }
}

function updateAcid(engine, x, y) {
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];

  for (const [dx,dy] of nb4) {
    const nx = x+dx, ny = y+dy, n = engine.get(nx, ny);
    if (n === WALL        && Math.random() > 0.98)  { engine.set(nx, ny, EMPTY); return; }
    if (n === SAND        && Math.random() > 0.92)  { engine.set(nx, ny, EMPTY); return; }
    if (n === STONE       && Math.random() > 0.97)  { engine.set(nx, ny, EMPTY); return; }
    if (n === COAL        && Math.random() > 0.93)  { engine.set(nx, ny, EMPTY); return; }
    if (n === GLASS       && Math.random() > 0.95)  { engine.set(nx, ny, EMPTY); return; }
    if (n === SOIL        && Math.random() > 0.95)  { engine.set(nx, ny, SAND);  return; }
    if (n === HARD_SOIL   && Math.random() > 0.95)  { engine.set(nx, ny, SAND);  return; } // 固い土も溶ける
    if (n === ASH         && Math.random() > 0.93)  { engine.set(nx, ny, EMPTY); return; } // 灰も溶ける
    if (n === METAL       && Math.random() > 0.97)  { engine.set(nx, ny, RUST);  return; }
    if (n === RUST        && Math.random() > 0.90)  { engine.set(nx, ny, EMPTY); return; } // 錆除去
    if (n === ICE         && Math.random() > 0.80)  { engine.set(nx, ny, WATER); return; }
    if (n === SNOW        && Math.random() > 0.85)  { engine.set(nx, ny, WATER); return; }
    if (n === MUD         && Math.random() > 0.95)  { engine.set(nx, ny, WATER); engine.set(x, y, SAND); return; }
    if ((n === PLANT || n === FLOWER || n === DARK_PLANT || n === DARK_FLOWER) && Math.random() > 0.90) {
      engine.set(nx, ny, EMPTY); return;
    }
    if (n === SEED        && Math.random() > 0.90)  { engine.set(nx, ny, ASH);   return; }
    if (n === FUNGUS      && Math.random() > 0.85)  { engine.set(nx, ny, EMPTY); return; }
    if (n === GLOW_FUNGUS && Math.random() > 0.85)  {
      // 最後の輝き: SPARK×3バースト
      const si = engine.idx(nx, ny);
      engine.cells[si] = SPARK; engine.colors[si] = 0x00FFDD; engine.updated[si] = 1;
      for (const [bx,by] of [[0,-1],[1,0],[-1,0]]) {
        const px=nx+bx, py=ny+by;
        if (engine.inBounds(px,py) && engine.get(px,py) === EMPTY) { engine.set(px,py,SPARK); }
      }
      return;
    }
    if (n === WATER && Math.random() > 0.70)        { engine.set(x, y, WATER); return; } // 希釈
    if (n === LAVA) {
      // 激しい反応 → 蒸気バースト
      engine.set(x, y, STEAM); engine.meta[engine.idx(x,y)] = 0;
      engine.set(nx, ny, SMOKE);
      for (const [ex,ey] of [[0,-1],[1,-1],[-1,-1]]) {
        const px=x+ex, py=y+ey;
        if (engine.inBounds(px,py) && engine.get(px,py) === EMPTY) { engine.set(px,py,STEAM); engine.meta[engine.idx(px,py)] = 0; }
      }
      return;
    }
    if (n === FIRE && Math.random() > 0.70) { engine.set(x, y, WATER); return; } // 中和
  }

  // Flow: denser than water — sinks through water
  if (Math.random() > 0.65) return;
  const below = engine.get(x, y+1);
  if (below === EMPTY || below === WATER || below === STEAM) { engine.swap(x, y, x, y+1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if ([EMPTY,WATER,STEAM].includes(engine.get(x+dir,y+1))) { engine.swap(x, y, x+dir, y+1); return; }
  if ([EMPTY,WATER,STEAM].includes(engine.get(x-dir,y+1))) { engine.swap(x, y, x-dir, y+1); return; }
  if (engine.get(x+dir, y) === EMPTY) { engine.swap(x, y, x+dir, y); return; }
  if (engine.get(x-dir, y) === EMPTY) { engine.swap(x, y, x-dir, y); return; }
}

function updateMud(engine, x, y) {
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];

  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if ((n === FIRE || n === LAVA) && Math.random() > 0.95) { engine.set(x, y, STONE); return; } // 焼成
    if ((n === LIGHTNING || n === SPARK) && Math.random() > 0.6) { engine.set(x, y, SPARK); return; } // 導電
    if (n === SNOW && Math.random() > 0.98) { engine.set(x+dx, y+dy, MUD); } // 雪→泥
  }

  // Viscous flow
  if (Math.random() > 0.5) return;
  const below = engine.get(x, y+1);
  if (below === EMPTY || below === WATER || below === STEAM) { engine.swap(x, y, x, y+1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if ([EMPTY,WATER,STEAM].includes(engine.get(x+dir,y+1))) { engine.swap(x, y, x+dir, y+1); return; }
  if ([EMPTY,WATER,STEAM].includes(engine.get(x-dir,y+1))) { engine.swap(x, y, x-dir, y+1); return; }
  if (Math.random() > 0.25) return;
  if (engine.get(x+dir, y) === EMPTY) { engine.swap(x, y, x+dir, y); return; }
  if (engine.get(x-dir, y) === EMPTY) { engine.swap(x, y, x-dir, y); return; }
}

function updateIce(engine, x, y) {
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === FIRE  && Math.random() > 0.90) { engine.set(x, y, WATER); return; }
    if (n === LAVA  && Math.random() > 0.60) {
      engine.set(x, y, WATER);
      if (engine.inBounds(x, y-1) && engine.get(x, y-1) === EMPTY) { engine.set(x, y-1, STEAM); engine.meta[engine.idx(x, y-1)] = 0; }
      return;
    }
    if ((n === LIGHTNING || n === SPARK) && Math.random() > 0.70) {
      engine.set(x, y, WATER);
      for (const [sdx,sdy] of [[0,-1],[1,0],[-1,0]]) {
        const px=x+sdx, py=y+sdy;
        if (engine.inBounds(px,py) && engine.get(px,py) === EMPTY) { engine.set(px,py,SPARK); }
      }
      return;
    }
    if (n === ACID  && Math.random() > 0.80) { engine.set(x, y, WATER); return; }
    if (n === STEAM && Math.random() > 0.97) { engine.set(x+dx, y+dy, WATER); } // 蒸気凝結
  }
  // Slow freeze: spread to adjacent water when cold nearby
  if (Math.random() > 0.003) return;
  for (const [dx,dy] of nb4) {
    if (engine.get(x+dx, y+dy) === WATER) {
      let cold = false;
      for (let ey=-3; ey<=3 && !cold; ey++)
        for (let ex=-3; ex<=3 && !cold; ex++) {
          const cn = engine.get(x+ex, y+ey);
          if (cn === SNOW || cn === ICE) cold = true;
        }
      if (cold) { engine.set(x+dx, y+dy, ICE); engine.updated[engine.idx(x+dx,y+dy)] = 1; return; }
    }
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
  // 水/泥に長時間接触 → 錆（泥はより速い）
  if (Math.random() > 0.998) {
    for (const [dx,dy] of nb4) {
      const wn = engine.get(x+dx, y+dy);
      if (wn === WATER)              { engine.set(x, y, RUST); return; }
      if (wn === MUD && Math.random() > 0.4) { engine.set(x, y, RUST); return; } // 泥は0.3%速
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
    else if (n === OIL) {
      // 爆発: 半径4のFIRE広範囲生成（油田爆破）
      const r = 4;
      for (let ey = -r; ey <= r; ey++) for (let ex = -r; ex <= r; ex++) {
        if (ex*ex + ey*ey > r*r) continue;
        const en = engine.get(nx+ex, ny+ey);
        if (en === EMPTY || en === OIL || en === SMOKE) engine.set(nx+ex, ny+ey, FIRE);
      }
    }
    else if (n === COAL)                              { engine.set(nx, ny, FIRE);  }
    else if (n === SNOW)                              { engine.set(nx, ny, WATER); }
    else if (n === SOIL)                              { engine.set(nx, ny, SAND);  }
    else if (n === RUST)                              { engine.set(nx, ny, SAND);  } // 錆が砂に崩壊
    else if (n === ICE) {
      engine.set(nx, ny, WATER);
      for (const [sdx,sdy] of [[0,-1],[1,0],[-1,0]]) {
        const px=nx+sdx, py=ny+sdy;
        if (engine.inBounds(px,py) && engine.get(px,py) === EMPTY) { engine.set(px,py,SPARK); }
      }
    }
    else if (n === MUD) {
      const mi = engine.idx(nx, ny);
      engine.cells[mi] = SPARK; engine.colors[mi] = MATERIALS[SPARK].colors[0]; engine.updated[mi] = 1;
    }
    else if (n === STEAM) { engine.set(nx, ny, WATER); }
    else if (n === PLANT || n === FLOWER || n === DARK_FLOWER) { engine.set(nx, ny, FIRE); }
    else if (n === DARK_PLANT) {
      // F+: 激しく発火 + 8方向に飛び火
      engine.set(nx, ny, FIRE);
      const sd = [[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
      for (const [sdx,sdy] of sd) {
        const sn = engine.get(nx+sdx, ny+sdy);
        if (sn === EMPTY || sn === OIL || sn === PLANT || sn === FLOWER) engine.set(nx+sdx, ny+sdy, FIRE);
      }
    }
    else if (n === FUNGUS) { engine.set(nx, ny, GLOW_FUNGUS); }
    else if (n === GLOW_FUNGUS) {
      // 超発光バースト → 消滅
      const br = 3;
      for (let by = -br; by <= br; by++) for (let bx = -br; bx <= br; bx++) {
        if (bx*bx + by*by > br*br) continue;
        const bn = engine.get(nx+bx, ny+by);
        if (bn === EMPTY || bn === GLOW_FUNGUS || bn === FUNGUS) {
          const bi = engine.idx(nx+bx, ny+by);
          engine.cells[bi] = SPARK; engine.colors[bi] = 0x00FFDD; engine.updated[bi] = 1;
        }
      }
      engine.set(nx, ny, EMPTY);
    }
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
  [RUST]:        { name: 'rust',        colors: [0xB7410E,0xC0622A,0x9E2800,0xD4652B,0x8B3010,0xCC5218,0xA03818],                       update: updateRust      },
  [STEAM]:       { name: 'steam',       colors: [0xDDEEFF,0xCCDDF0,0xEEEEFF,0xC8D8E8,0xD8E8F8,0xE8F0FF],              update: updateSteam     },
  [ACID]:        { name: 'acid',        colors: [0x66FF33,0x44EE22,0x55DD44,0x88FF66,0x33CC11,0x77EE55],               update: updateAcid      },
  [MUD]:         { name: 'mud',         colors: [0x6B4226,0x5A3520,0x7B4A30,0x4A2D18,0x634030,0x523525],              update: updateMud       },
  [ICE]:         { name: 'ice',         colors: [0xAADDFF,0xBBEEFF,0x99CCEE,0xCCEEFF,0xB0DDFF,0x88CCEE],              update: updateIce       },
  [HARD_SOIL]:   { name: 'hard_soil',   colors: [0xC47A45,0xB86838,0xD48855,0xA85C30,0xCC7A40],                       update: null            },
};

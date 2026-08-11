import {
  EMPTY, WATER, OIL, LAVA, SAND, SANDSTONE, STONE, MUD, SOIL, ICE, SNOW, SMOKE,
  FIRE, COAL, PLANT, DARK_PLANT, ACID, ACID_PLANT, FLOWER, DARK_FLOWER, SAKURA_TREE,
  SAKURA_PETAL, FUNGUS, GLOW_FUNGUS, STEAM, ASH, OBSIDIAN, GLASS, SEED
} from './ids.js';
import {
  META_MUD_SUMI
} from './meta.js';

// ─── Combustion update functions ───────────────────────────────────────────────

export function updateSand(engine, x, y) {
  const below = engine.get(x, y + 1);
  if (below === EMPTY || below === WATER || below === OIL) { engine.swap(x, y, x, y + 1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  const dA = engine.get(x + dir, y + 1), dB = engine.get(x - dir, y + 1);
  if (dA === EMPTY || dA === WATER || dA === OIL) { engine.swap(x, y, x + dir, y + 1); return; }
  if (dB === EMPTY || dB === WATER || dB === OIL) { engine.swap(x, y, x - dir, y + 1); return; }
  // Lava contact → sandstone（間接的な熱変成岩）
  if (Math.random() > 0.985) {
    const nb = [engine.get(x,y+1), engine.get(x,y-1), engine.get(x+1,y), engine.get(x-1,y)];
    if (nb.includes(LAVA)) engine.set(x, y, SANDSTONE);
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

export function updateWater(engine, x, y) {
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
  // Water + Snow/Ice → ICE（凍結 1%/frame。0.3% だと雪を降らせても
  // 凍る前に融けてしまい、「反応しているのに見えない」状態になる）
  if (Math.random() > 0.99) {
    const nb4w = [[0,1],[1,0],[-1,0],[0,-1]];
    for (const [dx,dy] of nb4w) {
      const wn = engine.get(x+dx, y+dy);
      if (wn === SNOW || wn === ICE) { engine.set(x, y, ICE); return; }
    }
  }
}

export function updateSnow(engine, x, y) {
  if (Math.random() > 0.45) return;
  const below = engine.get(x, y + 1);
  if (below === EMPTY) { engine.swap(x, y, x, y + 1); return; }
  if (below === LAVA) {
    // 急冷: 雪が触れた溶岩は黒曜石に固まり、雪は融けて水になる（氷と同じ作法）
    engine.set(x, y + 1, OBSIDIAN);
    engine.set(x, y, WATER);
    return;
  }
  if (below === WATER) { engine.set(x, y, WATER); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x + dir, y + 1) === EMPTY) { engine.swap(x, y, x + dir, y + 1); return; }
  if (engine.get(x - dir, y + 1) === EMPTY) { engine.swap(x, y, x - dir, y + 1); return; }
  if (Math.random() > 0.88 && engine.get(x + dir, y) === EMPTY) engine.swap(x, y, x + dir, y);
}

export function updateFire(engine, x, y) {
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
    if (n === ACID_PLANT && Math.random() > 0.20) { engine.set(x+dx, y+dy, FIRE);  }
    if (n === FLOWER      && Math.random() > 0.50) { engine.set(x+dx, y+dy, FIRE);  }
    if (n === DARK_FLOWER && Math.random() > 0.30) { engine.set(x+dx, y+dy, FIRE);  }
    if (n === SAKURA_TREE  && Math.random() > 0.40) { engine.set(x+dx, y+dy, FIRE);  }
    if (n === SAKURA_PETAL && Math.random() > 0.55) { engine.set(x+dx, y+dy, EMPTY); }
    if (n === FUNGUS      && Math.random() > 0.50) { engine.set(x+dx, y+dy, EMPTY); }
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

export function updateOil(engine, x, y) {
  // 凍結オイル: ICEが隣接していれば固まって動かない
  const nb4oil = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4oil) {
    if (engine.get(x+dx, y+dy) === ICE) return;
  }
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

export function updateLava(engine, x, y) {
  if (Math.random() > 0.4) return;
  const nbDirs = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nbDirs) {
    const n = engine.get(x+dx, y+dy);
    if (n === WATER) { engine.set(x, y, STONE); engine.set(x+dx, y+dy, STEAM); engine.meta[engine.idx(x+dx,y+dy)] = 0; return; }
    if (n === ICE)   { engine.set(x, y, OBSIDIAN); engine.set(x+dx, y+dy, STEAM); engine.meta[engine.idx(x+dx,y+dy)] = 0; return; } // 急冷→黒曜石
    if (n === SNOW)  { engine.set(x, y, OBSIDIAN); engine.set(x+dx, y+dy, STEAM); engine.meta[engine.idx(x+dx,y+dy)] = 0; return; } // 雪でも急冷→黒曜石
    if (n === OIL  && Math.random() > 0.3)  { engine.set(x+dx, y+dy, FIRE); }
    if ((n === PLANT || n === DARK_PLANT || n === DARK_FLOWER || n === FLOWER || n === ACID_PLANT || n === SAKURA_TREE) && Math.random() > 0.2) {
      engine.set(x+dx, y+dy, FIRE);
    }
    if (n === SAKURA_PETAL) engine.set(x+dx, y+dy, EMPTY);
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

export function updateSmoke(engine, x, y) {
  const i = engine.idx(x, y);
  if (Math.random() > 0.5) return;
  // 酸性スモッグ: ACID隣接で汚染フラグをセット
  const nb4smk = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4smk) {
    if (engine.get(x+dx, y+dy) === ACID) { engine.meta[i] = 1; break; }
  }
  // 酸性スモッグ: 隣接する種を枯らす（農業の天敵）
  if (engine.meta[i] === 1) {
    for (const [dx,dy] of nb4smk) {
      if (engine.get(x+dx, y+dy) === SEED && Math.random() > 0.96) {
        engine.set(x+dx, y+dy, ASH);
      }
    }
  }
  const up = engine.get(x, y-1);
  if (up === EMPTY) { engine.swap(x, y, x, y-1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x+dir, y-1) === EMPTY) { engine.swap(x, y, x+dir, y-1); return; }
  if (engine.get(x-dir, y-1) === EMPTY) { engine.swap(x, y, x-dir, y-1); return; }
  if (engine.get(x+dir, y)   === EMPTY) { engine.swap(x, y, x+dir, y);   return; }
  if (engine.get(x-dir, y)   === EMPTY) { engine.swap(x, y, x-dir, y);   return; }
  // 消滅率: 通常 4%/frame → 酸性スモッグ 1%/frame（滞留）
  const evapRate = engine.meta[i] === 1 ? 0.99 : 0.96;
  if (Math.random() > evapRate) engine.set(x, y, EMPTY);
}

export function updateAsh(engine, x, y) {
  const nb = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb) {
    const n = engine.get(x+dx, y+dy);
    if (n === WATER) {
      // 雨水が灰を溶かして肥沃な泥に変換（焼き畑農法の核心演出）
      if (Math.random() > 0.97) {
        const i = engine.idx(x, y);
        engine.cells[i] = MUD;
        engine.meta[i]  = 1; // 肥沃フラグ（発芽率6倍）
        return;
      }
      return;
    }
    if (n === ICE) return; // 氷結灰: ICE隣接で固体化（移動停止）
    // 肥沃化: 灰がMUDに隣接 → MUDにフラグをセット（焼き畑農法）
    if (n === MUD && Math.random() > 0.97) {
      engine.meta[engine.idx(x+dx, y+dy)] = 1;
    }
  }
  // 風散布: FIRE/SMOKEが近くにあると上昇・横ドリフト（焼き畑演出）
  {
    let nearHeat = false;
    for (const [dx,dy] of nb) {
      const n = engine.get(x+dx, y+dy);
      if (n === FIRE || n === SMOKE) { nearHeat = true; break; }
    }
    if (nearHeat) {
      if (Math.random() > 0.85 && engine.get(x, y-1) === EMPTY) { engine.swap(x, y, x, y-1); return; } // 上昇気流
      if (Math.random() > 0.90) {
        const d = Math.random() > 0.5 ? 1 : -1;
        if (engine.get(x+d, y) === EMPTY) { engine.swap(x, y, x+d, y); return; } // 横ドリフト
      }
    }
  }
  if (Math.random() > 0.35) return;
  const below = engine.get(x, y+1);
  if (below === EMPTY || below === WATER) { engine.swap(x, y, x, y+1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x+dir, y+1) === EMPTY) { engine.swap(x, y, x+dir, y+1); return; }
  if (engine.get(x-dir, y+1) === EMPTY) { engine.swap(x, y, x-dir, y+1); return; }
}

export function updateCoal(engine, x, y) {
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
  // ⑥ 墨水 (Sumi-e Water): 炭が水に浸かると 0.3%/frame で墨色の泥(MUD)に変化
  // meta = META_MUD_SUMI(2) を立てる → この泥の上で種が発芽するとDARK_PLANTになる
  if (Math.random() > 0.997) {
    for (const [dx,dy] of check) {
      if (engine.get(x+dx, y+dy) === WATER) {
        const mi = engine.idx(x, y);
        engine.cells[mi]  = MUD;
        engine.colors[mi] = 0x111111; // 墨色（炭が水に溶けた濃い黒）
        engine.meta[mi]   = META_MUD_SUMI; // = 2
        return;
      }
    }
  }
}


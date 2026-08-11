import {
  PLANT, DARK_PLANT, FLOWER, DARK_FLOWER, ACID, ACID_PLANT, WATER, FIRE, LAVA,
  EMPTY, ICE, STEAM, SAND, GLASS, MUD
} from './ids.js';
import {
  ACID_STEM_COLS, DARK_STEM_COLS, ACID_FLOWER_COLS
} from './meta.js';

// ─── P3 素材 update functions ─────────────────────────────────────────────────

export function updateAcidPlant(engine, x, y) {
  const i   = engine.idx(x, y);
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];

  for (const [dx,dy] of nb4) {
    const nx2 = x+dx, ny2 = y+dy;
    const n   = engine.get(nx2, ny2);
    // 感染: 隣接する通常植物・暗黒植物を腐食植物に変える
    if ((n === PLANT || n === DARK_PLANT || n === FLOWER || n === DARK_FLOWER) && Math.random() > 0.997) {
      const ni2 = engine.idx(nx2, ny2);
      engine.cells[ni2]  = ACID_PLANT;
      engine.colors[ni2] = ACID_STEM_COLS[0];
      engine.meta[ni2]   = 0;
      return;
    }
    // 浄化: 水が隣接→暗黒植物に戻る
    if (n === WATER && Math.random() > 0.995) {
      engine.cells[i]  = DARK_PLANT;
      engine.colors[i] = DARK_STEM_COLS[0];
      return;
    }
    // 火・溶岩で燃焼 → 酸の飛沫を散らす
    if ((n === FIRE || n === LAVA) && Math.random() > 0.5) {
      engine.set(x, y, FIRE);
      for (const [sdx,sdy] of [[0,-1],[1,0],[-1,0],[0,1],[1,-1],[-1,-1]]) {
        const sx=x+sdx, sy=y+sdy;
        if (engine.inBounds(sx,sy) && engine.get(sx,sy) === EMPTY && Math.random() > 0.6) {
          engine.set(sx, sy, ACID);
        }
      }
      return;
    }
    // ICE隣接: 酸が氷を溶かす（腐食植物は凍らない）
    if (n === ICE && Math.random() > 0.90) { engine.set(nx2, ny2, WATER); }
  }

  // 酸を少量分泌 (0.3%/frame)
  if (Math.random() > 0.997) {
    for (const [dx,dy] of [[1,0],[-1,0],[0,1]]) {
      if (engine.inBounds(x+dx,y+dy) && engine.get(x+dx, y+dy) === EMPTY) {
        engine.set(x+dx, y+dy, ACID); break;
      }
    }
  }

  // 上方向への成長（暗黒植物と同じ斜め成長）
  if (Math.random() > 0.02) return;
  const growDirs = [[-1,-1],[1,-1],[0,-1]];
  growDirs.sort(() => Math.random() - 0.5);
  for (const [dx,dy] of growDirs) {
    const gx = x+dx, gy = y+dy;
    if (!engine.inBounds(gx,gy) || engine.get(gx,gy) !== EMPTY) continue;
    const meta = engine.meta[i];
    let height = 0;
    for (let ddy = 1; ddy <= 16; ddy++) {
      if (engine.get(x, y+ddy) === ACID_PLANT) height++; else break;
    }
    const bloomChance = Math.min(0.08 + height * 0.05, 0.65);
    if (Math.random() < bloomChance) {
      // 酸性の花: DARK_FLOWER IDを流用、ライムグリーンで着色
      engine.plant(gx, gy, DARK_FLOWER, ACID_FLOWER_COLS[Math.floor(Math.random() * ACID_FLOWER_COLS.length)], meta);
    } else {
      engine.plant(gx, gy, ACID_PLANT, ACID_STEM_COLS[Math.floor(Math.random() * ACID_STEM_COLS.length)], meta);
    }
    break;
  }
}

export function updateSpring(engine, x, y) {
  // 水源: 3%/frame で隣接EMPTYにWATERを生成する永久水源
  if (Math.random() > 0.03) return;
  const dirs = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of dirs) {
    const nx = x+dx, ny = y+dy;
    if (engine.inBounds(nx,ny) && engine.get(nx,ny) === EMPTY) {
      engine.set(nx, ny, WATER);
      return;
    }
  }
}

export function updateLavaSpring(engine, x, y) {
  // 溶岩源泉（地熱噴出口）: WATERが隣接すれば直接STEAMに変換（STONEを作らない）
  // → 永久水循環シナリオでSTONEが詰まる問題を防ぐ
  const dirs = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of dirs) {
    const nx = x+dx, ny = y+dy;
    if (engine.inBounds(nx,ny) && engine.get(nx,ny) === WATER) {
      if (Math.random() > 0.02) return;
      engine.set(nx, ny, STEAM);
      return;
    }
  }
  // 水がない場合: 通常の溶岩噴出（2%/frame）
  if (Math.random() > 0.02) return;
  for (const [dx,dy] of dirs) {
    const nx = x+dx, ny = y+dy;
    if (engine.inBounds(nx,ny) && engine.get(nx,ny) === EMPTY) {
      engine.set(nx, ny, LAVA);
      return;
    }
  }
}

export function updateObsidian(engine, x, y) {
  // 黒曜石: 溶岩でのみ溶ける。酸・雷・水に完全耐性
  // 再溶融は 0.3%/frame とごく遅い。3% だと「石は残るのに黒曜石は溶岩に食われて
  // 消える」非対称で、溶岩+冷却系が必ず全部石に収束してしまう（急冷の見せ場が消える）
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    if (engine.get(x+dx, y+dy) === LAVA && Math.random() > 0.997) {
      engine.set(x, y, LAVA); return;
    }
  }
}

export function updateSandstone(engine, x, y) {
  // 砂岩: 水でじわじわ侵食→砂、酸で速く溶ける、溶岩で再加熱→ガラス
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === WATER && Math.random() > 0.9995) { engine.set(x, y, SAND);  return; } // 水侵食（崖崩れ）
    if (n === LAVA  && Math.random() > 0.98)   { engine.set(x, y, GLASS); return; } // 再加熱→ガラス
  }
}

export function updateBasalt(engine, x, y) {
  // 玄武岩: 溶岩で再溶融、酸で泥化
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === LAVA && Math.random() > 0.98) { engine.set(x, y, LAVA); return; }
    if (n === ACID && Math.random() > 0.97) { engine.set(x, y, MUD);  return; } // 酸+玄武岩→泥（鉱物溶出）
  }
}


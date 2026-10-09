import {
  EMPTY, WATER, OIL, LAVA, SAND, SANDSTONE, STONE, MUD, SOIL, ICE, SNOW, SMOKE,
  FIRE, COAL, PLANT, DARK_PLANT, ACID, ACID_PLANT, FLOWER, DARK_FLOWER, SAKURA_TREE,
  SAKURA_PETAL, FUNGUS, GLOW_FUNGUS, STEAM, ASH, OBSIDIAN, GLASS, SEED
} from './ids.js';
import {
  META_MUD_SUMI
} from './meta.js';
import { T_BOIL, T_FREEZE, T_LAVA_SOLID, T_AMBIENT_GROUND } from './climate.js';

// 近傍の方向表（関数のたびに配列を作らないよう、モジュールで 1 度だけ作る。中身は書き換えない）
const NB0 = [[0,1],[1,0],[-1,0],[0,-1]];
const NB1 = [[0,1],[1,0],[-1,0]];
const NB2 = [[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1]];
const NB3 = [[0,-1],[1,0],[-1,0],[0,1],[1,-1],[-1,-1]];


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
    const nb4s = NB0;
    for (let _k1 = 0; _k1 < nb4s.length; _k1++) { const dx = nb4s[_k1][0], dy = nb4s[_k1][1];
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
    const check = NB1;
    for (let _k2 = 0; _k2 < check.length; _k2++) { const dx = check[_k2][0], dy = check[_k2][1];
      if (engine.get(x+dx, y+dy) === SAND) { engine.set(x+dx, y+dy, SOIL); break; }
    }
  }
  // 水が凍るかどうかは温度で決まる（thermal.js）。隣に雪や氷があるだけでは凍らない。
  // 冷たい雪・氷は熱伝導で隣の水を冷やし、氷点を下回って潜熱ぶん冷えた水が氷になる。
}

export function updateSnow(engine, x, y) {
  if (Math.random() > 0.45) return;
  const below = engine.get(x, y + 1);
  if (below === EMPTY) { engine.swap(x, y, x, y + 1); return; }
  if (below === LAVA) {
    // 急冷: 雪が触れた溶岩は黒曜石に固まり、雪は融けて水になる（氷と同じ作法）
    engine.set(x, y + 1, OBSIDIAN);
    engine.temp[engine.idx(x, y + 1)] = T_AMBIENT_GROUND; // 急冷: 熱は氷雪の融解・蒸発に奪われ、黒曜石は一気に冷える
    engine.set(x, y, WATER);
    return;
  }
  if (below === WATER) {
    const wi = engine.idx(x, y + 1);
    const tw = engine.temp[wi];
    if (tw <= T_FREEZE + SNOW_SLUSH_WINDOW) {
      // 氷点に近い冷たい池: 雪は融けきれずに水面で氷になる（氷の蓋が広がっていく）
      engine.set(x, y, ICE);
    } else {
      // 暖かい池: 雪は融けて水になり、融解の熱を奪って池を少し冷やす（氷点の下までは冷やせない）
      const cooled = tw - (tw - T_FREEZE) * SNOW_COOLING;
      engine.temp[wi] = cooled;
      engine.set(x, y, WATER);
      engine.temp[engine.idx(x, y)] = cooled;
    }
    return;
  }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x + dir, y + 1) === EMPTY) { engine.swap(x, y, x + dir, y + 1); return; }
  if (engine.get(x - dir, y + 1) === EMPTY) { engine.swap(x, y, x - dir, y + 1); return; }
  if (Math.random() > 0.88 && engine.get(x + dir, y) === EMPTY) engine.swap(x, y, x + dir, y);
}

export function updateFire(engine, x, y) {
  if (Math.random() > 0.6) return;
  if (Math.random() > 0.75 && engine.get(x, y - 1) === EMPTY) engine.set(x, y - 1, SMOKE);

  const nbDirs = NB2;
  for (let _k3 = 0; _k3 < nbDirs.length; _k3++) { const dx = nbDirs[_k3][0], dy = nbDirs[_k3][1];
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
  const nb4oil = NB0;
  for (let _k4 = 0; _k4 < nb4oil.length; _k4++) { const dx = nb4oil[_k4][0], dy = nb4oil[_k4][1];
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
  const check = NB3;
  for (let _k5 = 0; _k5 < check.length; _k5++) { const dx = check[_k5][0], dy = check[_k5][1];
    const n = engine.get(x+dx, y+dy);
    if ((n === FIRE || n === LAVA) && Math.random() > 0.05) { engine.set(x, y, FIRE); return; }
  }
}

const SNOW_SLUSH_WINDOW = 10;   // 池の水温が氷点からこの範囲内なら、落ちた雪は氷になる
const SNOW_COOLING      = 0.15; // 暖かい池に雪が融けるとき、氷点までの差のこの割合だけ水が冷える
const LAVA_QUENCH_WATER = 40; // 水 1 セルを沸騰させるごとに溶岩が失う温度
const LAVA_COST_MELT    = 40; // 岩 1 セルを溶かすごとに溶岩が失う温度

export function updateLava(engine, x, y) {
  if (Math.random() > 0.4) return;
  const nbDirs = NB0;
  for (let _k6 = 0; _k6 < nbDirs.length; _k6++) { const dx = nbDirs[_k6][0], dy = nbDirs[_k6][1];
    const n = engine.get(x+dx, y+dy);
    // 熱はゆっくりしか伝わらない（溶岩の表面は冷えた地殻で断熱される）ので、接触は反応として扱い、
    // 溶岩は温度で熱を支払う: 水に触れれば沸騰させ（蒸気爆発は thermal.js）、岩に触れれば溶かす。
    // 熱を使い切った（T_LAVA_SOLID 以下の）溶岩は thermal.js で固まって石になる。
    if (n === WATER) {
      const wi = engine.idx(x+dx, y+dy), li = engine.idx(x, y);
      engine.temp[wi] = T_BOIL + 10;
      engine.temp[li] -= LAVA_QUENCH_WATER;
      return;
    }
    if (n === STONE && engine.temp[engine.idx(x, y)] > T_LAVA_SOLID + LAVA_COST_MELT + 5 && Math.random() > 0.85) {
      const li = engine.idx(x, y), si = engine.idx(x+dx, y+dy);
      engine.temp[li] -= LAVA_COST_MELT;
      engine.set(x+dx, y+dy, LAVA);
      engine.temp[si] = engine.temp[li]; // 溶けた岩は親の残り熱を引き継ぐ
      continue;
    }
    if (n === ICE)   { engine.set(x, y, OBSIDIAN); engine.temp[engine.idx(x, y)] = T_AMBIENT_GROUND; engine.set(x+dx, y+dy, STEAM); engine.meta[engine.idx(x+dx,y+dy)] = 0; return; } // 急冷→黒曜石
    if (n === SNOW)  { engine.set(x, y, OBSIDIAN); engine.temp[engine.idx(x, y)] = T_AMBIENT_GROUND; engine.set(x+dx, y+dy, STEAM); engine.meta[engine.idx(x+dx,y+dy)] = 0; return; } // 雪でも急冷→黒曜石
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
  const nb4smk = NB0;
  for (let _k7 = 0; _k7 < nb4smk.length; _k7++) { const dx = nb4smk[_k7][0], dy = nb4smk[_k7][1];
    if (engine.get(x+dx, y+dy) === ACID) { engine.meta[i] = 1; break; }
  }
  // 酸性スモッグ: 隣接する種を枯らす（農業の天敵）
  if (engine.meta[i] === 1) {
    for (let _k8 = 0; _k8 < nb4smk.length; _k8++) { const dx = nb4smk[_k8][0], dy = nb4smk[_k8][1];
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
  const nb = NB0;
  for (let _k9 = 0; _k9 < nb.length; _k9++) { const dx = nb[_k9][0], dy = nb[_k9][1];
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
    for (let _k10 = 0; _k10 < nb.length; _k10++) { const dx = nb[_k10][0], dy = nb[_k10][1];
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
  const check = NB0;
  for (let _k11 = 0; _k11 < check.length; _k11++) { const dx = check[_k11][0], dy = check[_k11][1];
    const n = engine.get(x+dx, y+dy);
    if ((n === FIRE || n === LAVA) && Math.random() > 0.985) { engine.set(x, y, FIRE); return; }
  }
  // ⑥ 墨水 (Sumi-e Water): 炭が水に浸かると 0.3%/frame で墨色の泥(MUD)に変化
  // meta = META_MUD_SUMI(2) を立てる → この泥の上で種が発芽するとDARK_PLANTになる
  if (Math.random() > 0.997) {
    for (let _k12 = 0; _k12 < check.length; _k12++) { const dx = check[_k12][0], dy = check[_k12][1];
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


import {
  SNOW, ICE, WATER, ASH, EMPTY, SOIL, COAL, SMOKE, FIRE, METAL, RUST, WALL,
  STONE, GLASS, OBSIDIAN, BASALT, SAND, SANDSTONE, HARD_SOIL, MUD, PLANT,
  FLOWER, DARK_PLANT, DARK_FLOWER, SEED, FUNGUS, GLOW_FUNGUS, SPARK, LAVA,
  STEAM, LIGHTNING, ACID, CLOUD
} from './ids.js';
import { T_DEW, T_AMBIENT_GROUND, T_AMBIENT_TOP } from './climate.js';

// 近傍の方向表（関数のたびに配列を作らないよう、モジュールで 1 度だけ作る。中身は書き換えない）
const NB0 = [[0,1],[1,0],[-1,0],[0,-1]];
const NB1 = [[0,-1],[1,-1],[-1,-1],[1,0],[-1,0],[0,-2]];
const NB2 = [[0,-1],[1,0],[-1,0],[0,1]];
const NB3 = [[0,-1],[1,-1],[-1,-1]];
const NB4 = [[0,-1],[1,0],[-1,0]];


// ─── 露点と雲 ────────────────────────────────────────────────────────────────
// 気温は高度が上がるほど下がる（climate.js）。蒸気は上昇しながら冷えて、温度が露点（T_DEW）を
// 下回ると凝結して見える雲（CLOUD）になる。冷えるほど、また近くに雲（凝結核）があるほど凝結しやすい。
// 雲は厚くなる（隣接する雲が多い）と雨粒を落とし、露点より暖かくなると蒸発して蒸気に戻る。
const CLOUD_FORM_MAX        = 0.02;  // 気温が最低（最上段）のときの凝結確率/frame（露点ちょうどで 0）
const CLOUD_SEEDING         = 0.5;   // 隣接する雲 1 つごとの凝結しやすさの上乗せ
const CLOUD_RAIN_BASE       = 0.0025; // 雨粒を落とす確率/frame（厚みに応じて増える）
const CLOUD_RAIN_MIN_NEIGH  = 4;     // 雨を降らせるのに必要な隣接する雲の数（8近傍）
const CLOUD_EVAP_MAX        = 0.06;  // 地表の気温で蒸発する確率/frame（露点ちょうどで 0）
const CLOUD_DRIFT           = 0.12;  // 横に漂う確率/frame

// 雨粒 1 つは蒸気 25 セル分の体積に相当する（水蒸気爆発の 25 倍膨張の逆）。
// 水が蒸気になると 25 倍に増えるので、雲が水に戻るときも 25 セル分の雲が 1 粒に集まる。
// 体積の膨張を受けた蒸気は engine.meta === VAPOR_EXPANDED で印をつけ、凝結するときは 25 セルで水 1 セルに戻る。
export const VAPOR_EXPANDED = 1;
const RAIN_DROP_VOLUME = 25;

// 蒸気 1 セルが水に戻る。膨張した蒸気は 25 分の 1 の確率でだけ水が残り、あとは消える（質量保存）。
function condenseToWater(engine, x, y) {
  const expanded = engine.meta[engine.idx(x, y)] === VAPOR_EXPANDED;
  if (expanded && Math.random() > 1 / RAIN_DROP_VOLUME) { engine.set(x, y, EMPTY); return; }
  engine.set(x, y, WATER);
  engine.meta[engine.idx(x, y)] = 0;
}
function absorbNearbyCloud(engine, x, y, count) {
  const r = 3, cells = [];
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if ((dx || dy) && engine.get(x+dx, y+dy) === CLOUD) cells.push([x+dx, y+dy, Math.random()]);
    }
  }
  cells.sort((a, b) => a[2] - b[2]);
  for (let k = 0; k < Math.min(count, cells.length); k++) engine.set(cells[k][0], cells[k][1], EMPTY);
}

function countCloud8(engine, x, y) {
  let n = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if ((dx || dy) && engine.get(x+dx, y+dy) === CLOUD) n++;
    }
  }
  return n;
}

// ─── Liquid & Gas update functions ───────────────────────────────────────────

export function updateSteam(engine, x, y) {
  // No TTL: steam accumulates at ceiling, then drips as water

  const nb4 = NB0;
  for (let _k1 = 0; _k1 < nb4.length; _k1++) { const dx = nb4[_k1][0], dy = nb4[_k1][1];
    const nx = x+dx, ny = y+dy, n = engine.get(nx, ny);
    if (n === SNOW || n === ICE) { condenseToWater(engine, x, y); return; } // 冷えて凝結
    if (n === ASH && Math.random() > 0.99) { engine.set(x, y, EMPTY); engine.set(nx, ny, SOIL); return; } // 灰+蒸気→土（生命サイクル循環）
    if (n === COAL && Math.random() > 0.97) {
      // 蒸気機関: 圧力爆発
      engine.set(x, y, SMOKE);
      engine.set(nx, ny, FIRE);
      for (let _k2 = 0; _k2 < NB1.length; _k2++) { const ex = NB1[_k2][0], ey = NB1[_k2][1];
        const px=x+ex, py=y+ey;
        if (engine.inBounds(px,py) && engine.get(px,py) === EMPTY) {
          engine.set(px, py, Math.random() > 0.4 ? FIRE : SMOKE);
        }
      }
      return;
    }
    if (n === METAL && Math.random() > 0.995) { engine.set(nx, ny, RUST); }
    // ⑤ 霧の結露 (Shizuku): 真上（dy=-1）が冷たい岩石 → 0.3%/frame で凝結→水に変換
    // WALL/ICE は既存の atCeiling 処理で対応済みのため除外
    if (dx === 0 && dy === -1 &&
        (n === STONE || n === GLASS || n === OBSIDIAN || n === BASALT || n === SANDSTONE) &&
        Math.random() > 0.97) {
      condenseToWater(engine, x, y); return;
    }
  }

  // 露点を下回るまで冷えた蒸気は凝結して雲になる（冷えるほど、雲に近いほど凝結しやすい）
  const temp = engine.temp[engine.idx(x, y)];
  if (temp < T_DEW) {
    const over = Math.min(1, (T_DEW - temp) / (T_DEW - T_AMBIENT_TOP));
    const p = CLOUD_FORM_MAX * over * (1 + CLOUD_SEEDING * countCloud8(engine, x, y));
    if (Math.random() < p) { engine.set(x, y, CLOUD); return; }
  }

  // Rise slowly (35% per frame — slower than smoke)
  if (Math.random() > 0.35) {
    if (Math.random() > 0.997) { engine.set(x, y, EMPTY); } // 微量の蒸発（広い空間で消える）
    return;
  }

  const up = engine.get(x, y-1);
  if (up === EMPTY) { engine.swap(x, y, x, y-1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x+dir, y-1) === EMPTY) { engine.swap(x, y, x+dir, y-1); return; }
  if (engine.get(x-dir, y-1) === EMPTY) { engine.swap(x, y, x-dir, y-1); return; }
  // 蒸気は水より軽い: 上の水を押しのけて浮上する（水は蒸気のいた下へ沈む）
  if (up === WATER && Math.random() > 0.2) { engine.swap(x, y, x, y-1); return; }
  if (engine.get(x+dir, y-1) === WATER && Math.random() > 0.4) { engine.swap(x, y, x+dir, y-1); return; }
  if (engine.get(x-dir, y-1) === WATER && Math.random() > 0.4) { engine.swap(x, y, x-dir, y-1); return; }
  // 横に少し漂う
  if (Math.random() > 0.35) return;
  if (engine.get(x+dir, y) === EMPTY) { engine.swap(x, y, x+dir, y); return; }
  if (engine.get(x-dir, y) === EMPTY) { engine.swap(x, y, x-dir, y); return; }

  // 完全に詰まった（天井または壁に押し付けられた）→ 水滴を垂らす
  const atCeiling = (y === 0 || up === WALL || up === STONE || up === GLASS || up === ICE);
  if (atCeiling && Math.random() > 0.9) {
    // 水滴が落ちる
    const expanded = engine.meta[engine.idx(x, y)] === VAPOR_EXPANDED;
    if (engine.inBounds(x, y+1) && engine.get(x, y+1) === EMPTY && (!expanded || Math.random() < 1 / RAIN_DROP_VOLUME)) {
      engine.set(x, y+1, WATER);
    }
    engine.set(x, y, EMPTY); // 蒸気は消えて水滴に変わった
    return;
  }
  // 天井でない詰まり → ゆっくり消散
  if (Math.random() > 0.993) { engine.set(x, y, EMPTY); }
}

// 雲: 露点より高い所に浮かぶ可視の水滴群。厚くなると雨を降らせ、暖かい所では蒸発する。
export function updateCloud(engine, x, y) {
  const temp = engine.temp[engine.idx(x, y)];

  // 熱源に触れると蒸発して蒸気に戻る
  for (let _k3 = 0; _k3 < NB0.length; _k3++) { const dx = NB0[_k3][0], dy = NB0[_k3][1];
    const n = engine.get(x+dx, y+dy);
    if (n === FIRE || n === LAVA) { engine.set(x, y, STEAM); return; }
  }

  // 露点より暖かい空気では蒸発して蒸気に戻る。暖かいほど速い
  if (temp > T_DEW) {
    const warm = Math.min(1, (temp - T_DEW) / (T_AMBIENT_GROUND - T_DEW));
    if (Math.random() < CLOUD_EVAP_MAX * warm) {
      engine.set(x, y, STEAM); return; // 膨張の印（meta）は引き継ぐ
    }
  }

  // 厚い雲は雨粒を落とす（雨粒は WATER として落下する）
  const neigh = countCloud8(engine, x, y);
  if (neigh >= CLOUD_RAIN_MIN_NEIGH && Math.random() < CLOUD_RAIN_BASE * (neigh - CLOUD_RAIN_MIN_NEIGH + 1)) {
    if (engine.get(x, y+1) === EMPTY) {
      const expanded = engine.meta[engine.idx(x, y)] === VAPOR_EXPANDED;
      engine.set(x, y, EMPTY); engine.set(x, y+1, WATER); engine.updated[engine.idx(x, y+1)] = 1;
      engine.meta[engine.idx(x, y+1)] = 0;
      if (expanded) absorbNearbyCloud(engine, x, y, RAIN_DROP_VOLUME - 1);
      return;
    }
  }

  // 薄い雲（隣接する雲が2以下）はゆっくり沈み、厚い雲は浮かんだまま横に漂う
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (neigh <= 2 && Math.random() < 0.03 && engine.get(x, y+1) === EMPTY) { engine.swap(x, y, x, y+1); return; }
  if (Math.random() < CLOUD_DRIFT && engine.get(x+dir, y) === EMPTY) { engine.swap(x, y, x+dir, y); return; }
}

export function updateAcid(engine, x, y) {
  const nb4 = NB0;

  for (let _k4 = 0; _k4 < nb4.length; _k4++) { const dx = nb4[_k4][0], dy = nb4[_k4][1];
    const nx = x+dx, ny = y+dy, n = engine.get(nx, ny);
    if (n === WALL        && Math.random() > 0.98)  { engine.set(nx, ny, EMPTY); return; }
    if (n === SAND        && Math.random() > 0.92)  { engine.set(nx, ny, EMPTY); return; }
    if (n === STONE       && Math.random() > 0.97)  { engine.set(nx, ny, EMPTY); return; }
    if (n === COAL        && Math.random() > 0.93)  { engine.set(nx, ny, EMPTY); return; }
    if (n === GLASS       && Math.random() > 0.95)  { engine.set(nx, ny, EMPTY); return; }
    if (n === SOIL        && Math.random() > 0.95)  { engine.set(nx, ny, SAND);  return; }
    if (n === HARD_SOIL   && Math.random() > 0.95)  { engine.set(nx, ny, SAND);  return; } // 固い土も溶ける
    if (n === SANDSTONE   && Math.random() > 0.80)  { engine.set(nx, ny, SAND);  return; } // 砂岩は酸に弱い
    if (n === BASALT      && Math.random() > 0.95)  { engine.set(nx, ny, MUD);   return; } // 玄武岩は酸で泥化（OBSIDIAN は耐性で対象外）
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
      // 最後の輝き: SPARKバースト + 隣接発光菌へ連鎖爆発を伝播
      const si = engine.idx(nx, ny);
      engine.cells[si] = SPARK; engine.colors[si] = 0x00FFDD; engine.updated[si] = 1;
      for (let _k5 = 0; _k5 < NB2.length; _k5++) { const bx = NB2[_k5][0], by = NB2[_k5][1];
        const px=nx+bx, py=ny+by;
        if (!engine.inBounds(px,py)) continue;
        const pn = engine.get(px,py);
        if (pn === EMPTY) { engine.set(px,py,SPARK); }
        else if (pn === GLOW_FUNGUS) { engine.meta[engine.idx(px,py)] = 255; } // 連鎖フラグ
      }
      return;
    }
    if (n === WATER && Math.random() > 0.70)        { engine.set(x, y, WATER); return; } // 希釈
    if (n === LAVA) {
      // 激しい反応 → 蒸気バースト
      engine.set(x, y, STEAM); engine.meta[engine.idx(x,y)] = 0;
      engine.set(nx, ny, SMOKE);
      for (let _k6 = 0; _k6 < NB3.length; _k6++) { const ex = NB3[_k6][0], ey = NB3[_k6][1];
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

export function updateMud(engine, x, y) {
  // 泥火山: 直下にLAVAがあれば泥を上方向へ噴出（間欠泉）
  if (engine.get(x, y+1) === LAVA && Math.random() < 0.05) {
    if (engine.inBounds(x, y-1) && engine.get(x, y-1) === EMPTY) {
      engine.set(x, y-1, MUD);
      engine.updated[engine.idx(x, y-1)] = 1;
    }
  }

  const nb4 = NB0;

  for (let _k7 = 0; _k7 < nb4.length; _k7++) { const dx = nb4[_k7][0], dy = nb4[_k7][1];
    const n = engine.get(x+dx, y+dy);
    if (n === FIRE && Math.random() > 0.95) { engine.set(x, y, STONE);  return; } // 焼成→石
    if (n === LAVA && Math.random() > 0.95) { engine.set(x, y, BASALT); return; } // 溶岩+泥→玄武岩
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

export function updateIce(engine, x, y) {
  const nb4 = NB0;
  for (let _k8 = 0; _k8 < nb4.length; _k8++) { const dx = nb4[_k8][0], dy = nb4[_k8][1];
    const n = engine.get(x+dx, y+dy);
    if (n === FIRE  && Math.random() > 0.90) { engine.set(x, y, WATER); return; }
    if (n === LAVA  && Math.random() > 0.60) {
      // 急冷: 氷が融ける瞬間、触れていた溶岩は黒曜石に固まる
      // （これがないと融け水+溶岩→石の皮が先に張り、黒曜石がほぼ生まれない）
      engine.set(x+dx, y+dy, OBSIDIAN);
      engine.set(x, y, WATER);
      if (engine.inBounds(x, y-1) && engine.get(x, y-1) === EMPTY) { engine.set(x, y-1, STEAM); engine.meta[engine.idx(x, y-1)] = 0; }
      return;
    }
    if ((n === LIGHTNING || n === SPARK) && Math.random() > 0.70) {
      engine.set(x, y, WATER);
      for (let _k9 = 0; _k9 < NB4.length; _k9++) { const sdx = NB4[_k9][0], sdy = NB4[_k9][1];
        const px=x+sdx, py=y+sdy;
        if (engine.inBounds(px,py) && engine.get(px,py) === EMPTY) { engine.set(px,py,SPARK); }
      }
      return;
    }
    if (n === ACID  && Math.random() > 0.80) { engine.set(x, y, WATER); return; }
    if (n === STEAM && Math.random() > 0.97) { engine.set(x+dx, y+dy, WATER); } // 蒸気凝結
  }
  // 水が氷に広がるのは温度で決まる（thermal.js）。氷は熱伝導で隣の水を冷やし、冷えきった水が凍る。
}


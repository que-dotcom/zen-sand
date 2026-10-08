import { MATERIALS } from './materials.js';
import {
  EMPTY, WATER, ICE, SNOW, STEAM, CLOUD, LAVA, STONE, FIRE, OIL, COAL, PLANT, DARK_PLANT,
  ACID_PLANT, FLOWER, DARK_FLOWER, SAKURA_TREE, SAKURA_PETAL, FUNGUS, GLOW_FUNGUS, SEED,
  METAL, GOLD, WALL, GLASS, SAND, SOIL, ASH, SMOKE, SPARK, LIGHTNING, LAVA_SPRING,
  POLLEN, FIREFLY, KINTSUGI, OBSIDIAN, BASALT, SANDSTONE, MUD, ACID, HARD_SOIL,
} from './materials/ids.js';
import {
  T_FREEZE, T_ICE_MELT, T_BOIL, T_FIRE, T_LAVA, T_LAVA_SOLID, T_STONE_MELT,
  T_IGNITE_OIL, T_IGNITE_PLANT, T_IGNITE_COAL, ambientAtAltitude,
} from './materials/climate.js';

// ─── 素材ごとの熱的性質 ───────────────────────────────────────────────────────
// COND: 熱伝導率（隣り合う 2 セルの平均が 1 ステップあたりの熱の流れやすさ。4 辺の合計が 1 未満で安定）
// AIR : 空気（周囲の気温）との熱交換率。気体は気温に追従し、溶岩・氷・雪はほとんど追従しない
// INIT: 置かれた直後の温度。未指定の素材は、置かれた場所の温度をそのまま引き継ぐ
// FIXED: 温度が固定された熱源（炎・溶岩源泉・雷）
const COND  = new Float32Array(256).fill(0.08);
const AIR   = new Float32Array(256).fill(0.004);
const INIT  = new Float32Array(256).fill(NaN);
const FIXED = new Uint8Array(256);
const CAP   = new Float32Array(256).fill(1); // 熱容量: 大きいほど温度が変わりにくい（温度変化 = 流入熱 / CAP）

function props(ids, { cond, air, init, fixed, cap }) {
  for (const id of ids) {
    if (cond  !== undefined) COND[id]  = cond;
    if (air   !== undefined) AIR[id]   = air;
    if (init  !== undefined) INIT[id]  = init;
    if (fixed)               FIXED[id] = 1;
    if (cap   !== undefined) CAP[id]   = cap;
  }
}
props([METAL],                    { cond: 0.22, air: 0.005 });
props([GOLD, KINTSUGI],           { cond: 0.20, air: 0.004 });
props([WATER],                    { cond: 0.15, air: 0.004, cap: 2.5 });
props([ICE],                      { cond: 0.12, air: 0.0003, init: 50, cap: 6 });
props([SNOW],                     { cond: 0.01, air: 0.0003, init: 55, cap: 4 });
props([LAVA],                     { cond: 0.003, air: 0.0002, init: T_LAVA, cap: 8 });
props([LAVA_SPRING],              { cond: 0.003, init: T_LAVA, fixed: true });
props([FIRE],                     { cond: 0.10, init: T_FIRE, fixed: true });
props([LIGHTNING],                { cond: 0.10, init: T_LAVA, fixed: true });
props([SPARK],                    { cond: 0.10, air: 0.03, init: 200 });
props([STEAM],                    { cond: 0.06, air: 0.03, init: T_BOIL, cap: 0.6 });
props([CLOUD],                    { cond: 0.05, air: 0.02, cap: 0.6 });
props([SMOKE],                    { cond: 0.05, air: 0.03, init: 135, cap: 0.6 });
props([POLLEN, FIREFLY],          { cond: 0.03, air: 0.03, cap: 0.6 });
props([STONE, OBSIDIAN, BASALT, SANDSTONE, WALL, GLASS, HARD_SOIL], { cond: 0.08, air: 0.004, cap: 1.5 });
props([SAND, SOIL, MUD, ASH],     { cond: 0.05, air: 0.004 });
props([PLANT, DARK_PLANT, ACID_PLANT, FLOWER, DARK_FLOWER, SAKURA_TREE, SAKURA_PETAL,
       FUNGUS, GLOW_FUNGUS, SEED, OIL, COAL, ACID], { cond: 0.05, air: 0.004 });

export function initialTemp(type) { return INIT[type]; }

// ─── 気温の行テーブル ─────────────────────────────────────────────────────────
function ambientRows(engine) {
  const H = engine.height;
  if (!engine._amb || engine._amb.length !== H) {
    engine._amb = new Float32Array(H);
    for (let y = 0; y < H; y++) engine._amb[y] = ambientAtAltitude(engine.altitude(y));
  }
  return engine._amb;
}

// 全セルを気温で初期化する（コンストラクタ・クリア・リサイズ後）
export function resetTemps(engine) {
  const n = engine.cells.length;
  if (!engine.temp || engine.temp.length !== n) engine.temp = new Float32Array(n);
  engine._amb = null;
  const amb = ambientRows(engine);
  for (let y = 0; y < engine.height; y++) {
    engine.temp.fill(amb[y], y * engine.width, (y + 1) * engine.width);
  }
}

// ─── 水蒸気爆発 ───────────────────────────────────────────────────────────────
// 沸騰した水 1 セルが体積 25 倍の蒸気になる（現実は約 1000 倍だが 25 倍に抑える）。
// 元のセル + 近傍の空きセルを近い順に蒸気で埋めて「沸騰」を表現する。
const STEAM_EXPANSION = 25;
const STEAM_BURST_RADIUS = 6;
const LATENT_BOIL = 140; // 蒸発の潜熱（熱量）: 周りの高温のセルから奪う。温度の下がり幅は熱容量で割った値

export function steamExplosion(engine, wx, wy) {
  const candidates = [];
  const r = STEAM_BURST_RADIUS;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const d2 = dx*dx + dy*dy;
      if (d2 === 0 || d2 > r*r) continue;
      if (engine.get(wx+dx, wy+dy) === EMPTY) candidates.push([d2 + Math.random(), wx+dx, wy+dy]);
    }
  }
  candidates.sort((a, b) => a[0] - b[0]);
  engine.set(wx, wy, STEAM);
  engine.meta[engine.idx(wx, wy)] = 1; // 膨張した蒸気の印（fluids.js の VAPOR_EXPANDED）
  const extra = Math.min(STEAM_EXPANSION - 1, candidates.length);
  for (let k = 0; k < extra; k++) {
    const [, px, py] = candidates[k];
    engine.set(px, py, STEAM);
    engine.meta[engine.idx(px, py)] = 1;
    engine.updated[engine.idx(px, py)] = 1;
  }
  // 潜熱: 周囲の高温セル（熱源）から熱を奪う
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (!engine.inBounds(wx+dx, wy+dy)) continue;
      const j = engine.idx(wx+dx, wy+dy);
      if (engine.cells[j] !== EMPTY && engine.cells[j] !== STEAM && !FIXED[engine.cells[j]] && engine.temp[j] > T_BOIL) {
        engine.temp[j] = Math.max(T_BOIL, engine.temp[j] - LATENT_BOIL / CAP[engine.cells[j]]);
      }
    }
  }
  engine.fireEvent('steam_explosion');
}

// ─── 溶岩の色 ─────────────────────────────────────────────────────────────────
// 温度が下がるほど暗い赤茶に寄る（固まる直前が最も暗い）。基準色はセル位置から決める（ちらつき防止）。
const LAVA_COOL_COLOR = [0x4A, 0x1A, 0x0C];
function lavaColor(i, t) {
  const hot = MATERIALS[LAVA].colors;
  const base = hot[(i * 2654435761 >>> 0) % hot.length];
  const f = Math.min(1, Math.max(0, (T_LAVA - t) / (T_LAVA - T_LAVA_SOLID)));
  const ch = (shift, k) => Math.round(((base >> shift) & 0xFF) * (1 - f) + LAVA_COOL_COLOR[k] * f);
  return (ch(16, 0) << 16) | (ch(8, 1) << 8) | ch(0, 2);
}

// 隣り合う 2 素材の熱の通りやすさ: 直列の熱抵抗なので調和平均（片方が断熱的なら全体も通りにくい）
function pairK(a, b) { return (2 * a * b) / (a + b); }

// ─── 1 ステップ分の熱伝導と相変化 ──────────────────────────────────────────────
export function thermalStep(engine) {
  const n = engine.cells.length;
  if (!engine.temp || engine.temp.length !== n) resetTemps(engine);
  if (!engine._tmp || engine._tmp.length !== n) engine._tmp = new Float32Array(n);
  const amb = ambientRows(engine);
  const { cells, temp, _tmp: out, width: W, height: H } = engine;

  // 1) 熱伝導: 空きセルは気温で固定された熱浴。非空セルだけが隣と熱をやり取りする
  for (let y = 0; y < H; y++) {
    const a = amb[y];
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const type = cells[i];
      if (type === EMPTY) { out[i] = a; continue; }
      if (FIXED[type])    { out[i] = INIT[type]; continue; }
      const t = temp[i], c = COND[type], air = AIR[type], cap = CAP[type];
      let d = 0, j, tj;
      // 左
      if (x > 0) { j = i - 1; tj = cells[j]; d += tj === EMPTY ? air * (a - t) : pairK(c, COND[tj]) * (temp[j] - t); }
      else d += air * (a - t);
      // 右
      if (x < W - 1) { j = i + 1; tj = cells[j]; d += tj === EMPTY ? air * (a - t) : pairK(c, COND[tj]) * (temp[j] - t); }
      else d += air * (a - t);
      // 上
      if (y > 0) { j = i - W; tj = cells[j]; d += tj === EMPTY ? air * (amb[y-1] - t) : pairK(c, COND[tj]) * (temp[j] - t); }
      else d += air * (a - t);
      // 下
      if (y < H - 1) { j = i + W; tj = cells[j]; d += tj === EMPTY ? air * (amb[y+1] - t) : pairK(c, COND[tj]) * (temp[j] - t); }
      else d += air * (a - t);
      const nt = t + d / cap;
      out[i] = nt < 0 ? 0 : nt > 255 ? 255 : nt;
    }
  }
  engine._tmp = temp;
  engine.temp = out;

  // 2) 相変化・発火: 温度の閾値で素材が変わる
  const T = engine.temp;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const type = cells[i];
      if (type === EMPTY) continue;
      const t = T[i];
      switch (type) {
        case WATER:
          if (t >= T_BOIL) { steamExplosion(engine, x, y); }
          else if (t <= T_FREEZE) { engine.set(x, y, ICE); T[i] = t; }
          break;
        case ICE:
        case SNOW:
          if (t >= T_ICE_MELT && Math.random() < (type === ICE ? 0.2 : 0.15)) {
            engine.set(x, y, WATER);
            T[i] = T_FREEZE + 6; // 融解の潜熱: 融けたての水は冷たい
          }
          break;
        case LAVA:
          if (t <= T_LAVA_SOLID) { engine.set(x, y, STONE); T[i] = t; }
          else engine.colors[i] = lavaColor(i, t);
          break;
        case STONE:
          if (t >= T_STONE_MELT && Math.random() < 0.3) { engine.set(x, y, LAVA); T[i] = t; }
          break;
        case OIL:
          if (t >= T_IGNITE_OIL && Math.random() < 0.15) engine.set(x, y, FIRE);
          break;
        case COAL:
          if (t >= T_IGNITE_COAL && Math.random() < 0.05) engine.set(x, y, FIRE);
          break;
        case PLANT: case DARK_PLANT: case ACID_PLANT: case FLOWER: case DARK_FLOWER:
        case SAKURA_TREE: case SAKURA_PETAL: case FUNGUS: case GLOW_FUNGUS: case SEED:
          if (t >= T_IGNITE_PLANT && Math.random() < 0.1) engine.set(x, y, FIRE);
          break;
      }
    }
  }
}

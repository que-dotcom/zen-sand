import { MATERIALS } from './materials.js';
import {
  EMPTY, WATER, ICE, SNOW, STEAM, CLOUD, LAVA, STONE, FIRE, OIL, COAL, PLANT, DARK_PLANT,
  ACID_PLANT, FLOWER, DARK_FLOWER, SAKURA_TREE, SAKURA_PETAL, FUNGUS, GLOW_FUNGUS, SEED,
  METAL, GOLD, WALL, GLASS, SAND, SOIL, ASH, SMOKE, SPARK, LIGHTNING, LAVA_SPRING,
  POLLEN, FIREFLY, KINTSUGI, OBSIDIAN, BASALT, SANDSTONE, MUD, ACID, HARD_SOIL,
} from './materials/ids.js';
import {
  T_FREEZE, T_ICE_MELT, T_BOIL, T_FIRE, T_LAVA, T_LAVA_SOLID, T_STONE_MELT,
  T_IGNITE_OIL, T_IGNITE_PLANT, T_IGNITE_COAL, T_SOIL_DRY, T_SOIL_BURN, ambientAtAltitude,
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
props([ICE],                      { cond: 0.012, air: 0.006, init: T_FREEZE - 8, cap: 5 }); // 熱を通しにくいので、温まった表面から順に融ける
props([SNOW],                     { cond: 0.004, air: 0.004, init: T_FREEZE - 6, cap: 10 }); // 断熱性が高く融けにくい
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
  const shift = engine.ambientShift || 0;
  if (!engine._amb || engine._amb.length !== H || engine._ambShift !== shift) {
    engine._amb = new Float32Array(H);
    engine._ambShift = shift;
    engine._thermalFull = true; // 気温が変わったので全行を気温に合わせ直す
    for (let y = 0; y < H; y++) engine._amb[y] = ambientAtAltitude(engine.altitude(y), shift);
  }
  return engine._amb;
}

// 環境の気温をずらす（設定のスライダー）。空きセルは次のステップで新しい気温になり、
// 素材のセルは熱交換でゆっくり新しい気温へ近づく。
export function setAmbientShift(engine, shift) {
  engine.ambientShift = shift;
  ambientRows(engine);
}

// 全セルを気温で初期化する（コンストラクタ・クリア・リサイズ後）
export function resetTemps(engine) {
  const n = engine.cells.length;
  if (!engine.temp || engine.temp.length !== n) engine.temp = new Float32Array(n);
  engine._amb = null;
  engine._thermalFull = true;
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

// ─── 融解の潜熱 ───────────────────────────────────────────────────────────────
// 氷・雪は氷点（T_FREEZE）を超えても、すぐには融けない。氷点より上の熱は融解に使われ（温度は氷点に留まる）、
// 潜熱 LATENT_FUSION（温度に換算した度数）ぶん熱を受けて初めて水になる。進み具合は engine.meta（0〜255）に持つ。
// 熱を通しにくい氷では、熱を受けた表面のセルから順に融け、内側は冷たいまま残る。氷点を下回ると進みは戻る（凍り直す）。
//
// 凍結も同じ潜熱を使う（対称）: 水は氷点以下になってもすぐには凍らない。氷点より下の冷えは凍結に使われ
// （温度は氷点に留まり、凍結の潜熱は周りへ放出される）、同じ LATENT_FUSION ぶん冷えて初めて氷になる。
// 水の meta は凍結の進み（0 = 液体 〜 255 = 凍りきる）、氷の meta は融解の進み（0 = 氷 〜 255 = 融けきる）。
const SOIL_DRY_WET = 30; // 土の湿り気度がこれを下回ると「乾いた」とみなす
const LATENT_FUSION = 12;
const FUSION_RATE = 255 / LATENT_FUSION; // 氷点との差 1 度ぶんの熱で進む量
const MELT_TINT = [0x3A, 0x6E, 0xA8];    // 融けかけの氷が寄っていく色（水色がかった暗い色）

function meltTint(i, type, progress) {
  const cols = MATERIALS[type].colors;
  const base = cols[(i * 2654435761 >>> 0) % cols.length];
  const f = Math.min(1, progress / 255) * 0.75;
  const ch = (shift, k) => Math.round(((base >> shift) & 0xFF) * (1 - f) + MELT_TINT[k] * f);
  return (ch(16, 0) << 16) | (ch(8, 1) << 8) | ch(0, 2);
}

// 小数の進みを Uint8 の meta に確率的に丸めて保存する（小さな増分が 0 に切り捨てられないように）
function storeProgress(engine, i, v) {
  const lo = Math.floor(v);
  engine.meta[i] = lo + (Math.random() < v - lo ? 1 : 0);
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

// 隣り合う 2 素材の熱の通りやすさ: 直列の熱抵抗なので調和平均（片方が断熱的なら全体も通りにくい）。
// 割り算を毎セル・毎辺でしないよう、素材の組ごとに前計算しておく。
const PAIR = new Float32Array(256 * 256);
for (let a = 0; a < 256; a++) {
  for (let b = 0; b < 256; b++) PAIR[(a << 8) | b] = (2 * COND[a] * COND[b]) / (COND[a] + COND[b]);
}

// 相変化・発火の判定が要る素材（それ以外は判定を飛ばす）
const PHASE = new Uint8Array(256);
for (const id of [WATER, ICE, SNOW, LAVA, STONE, OIL, COAL, PLANT, DARK_PLANT, ACID_PLANT, FLOWER, DARK_FLOWER,
                  SAKURA_TREE, SAKURA_PETAL, FUNGUS, GLOW_FUNGUS, SEED, SOIL]) PHASE[id] = 1;

// ─── 1 ステップ分の熱伝導と相変化 ──────────────────────────────────────────────
// 素材のある行（と、直前のステップで素材があった行・その上下 1 行）だけを処理する。
// それ以外の行は全部が空きセルで、気温のまま変わらないので計算しなくてよい。
export function thermalStep(engine) {
  const n = engine.cells.length;
  if (!engine.temp || engine.temp.length !== n) resetTemps(engine);
  if (!engine._tmp || engine._tmp.length !== n) engine._tmp = new Float32Array(n);
  const amb = ambientRows(engine);
  const { cells, temp: T, _tmp: out, width: W, height: H } = engine;

  const [occLo, occHi] = engine.occupiedRows();
  let lo, hi;
  if (engine._thermalFull || !engine._thermalRows) {
    lo = 0; hi = H - 1; // 気温の変更・リサイズ・クリアの直後は全行を気温に合わせ直す
    engine._thermalFull = false;
  } else {
    const [pLo, pHi] = engine._thermalRows; // 前回「素材があった」行（余白を足す前の値）
    lo = Math.max(0, Math.min(occLo, pLo) - 1);
    hi = Math.min(H - 1, Math.max(occHi, pHi) + 1);
  }
  engine._thermalRows = [occLo, occHi];
  if (lo > hi) return;

  // 1) 熱伝導: 空きセルは気温で固定された熱浴。非空セルだけが隣と熱をやり取りする。
  //    画面の外側とは熱をやり取りしない（断熱）。端のセルは外気にさらされず、外から熱も入ってこない。
  //    結果は scratch（out）に書き、あとで範囲ぶんだけ T へ書き戻す（隣の更新前の値を読むため）。
  for (let y = lo; y <= hi; y++) {
    const a = amb[y];
    const row = y * W;
    const aUp = y > 0 ? amb[y - 1] : a, aDown = y < H - 1 ? amb[y + 1] : a;
    for (let x = 0; x < W; x++) {
      const i = row + x;
      const type = cells[i];
      if (type === EMPTY) { out[i] = a; continue; }
      if (FIXED[type])    { out[i] = INIT[type]; continue; }
      const t = T[i], air = AIR[type], base = type << 8;
      let d = 0, tj;
      // 左
      if (x > 0)     { tj = cells[i - 1]; d += tj === EMPTY ? air * (a - t) : PAIR[base | tj] * (T[i - 1] - t); }
      // 右
      if (x < W - 1) { tj = cells[i + 1]; d += tj === EMPTY ? air * (a - t) : PAIR[base | tj] * (T[i + 1] - t); }
      // 上
      if (y > 0)     { tj = cells[i - W]; d += tj === EMPTY ? air * (aUp - t) : PAIR[base | tj] * (T[i - W] - t); }
      // 下
      if (y < H - 1) { tj = cells[i + W]; d += tj === EMPTY ? air * (aDown - t) : PAIR[base | tj] * (T[i + W] - t); }
      const nt = t + d / CAP[type];
      out[i] = nt < 0 ? 0 : nt > 255 ? 255 : nt;
    }
  }
  T.set(out.subarray(lo * W, (hi + 1) * W), lo * W);

  // 2) 相変化・発火: 温度の閾値で素材が変わる
  for (let y = lo; y <= hi; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const type = cells[i];
      if (PHASE[type] === 0) continue;
      const t = T[i];
      switch (type) {
        case WATER:
          if (t >= T_BOIL) { steamExplosion(engine, x, y); }
          else if (t < T_FREEZE) {
            // 氷点より下の冷えは凍結に使われ、温度は氷点に留まる
            const next = engine.meta[i] + (T_FREEZE - t) * FUSION_RATE;
            T[i] = T_FREEZE;
            if (next >= 255) {
              engine.set(x, y, ICE);
              T[i] = T_FREEZE;
              engine.meta[i] = 0;
            } else {
              storeProgress(engine, i, next);
            }
          } else if (engine.meta[i] > 0 && engine.meta[i] < 255 && t > T_FREEZE) {
            // 氷点を超えると、凍りかけが解ける（水の meta は凍結の進みだけを表す）
            storeProgress(engine, i, Math.max(0, engine.meta[i] - (t - T_FREEZE) * FUSION_RATE));
          }
          break;
        case ICE:
        case SNOW: {
          const progress = engine.meta[i];
          if (t > T_ICE_MELT) {
            // 氷点より上の熱は融解に使われ、温度は氷点に留まる
            const next = progress + (t - T_ICE_MELT) * FUSION_RATE;
            T[i] = T_ICE_MELT;
            if (next >= 255) {
              engine.set(x, y, WATER);
              T[i] = T_FREEZE + 6; // 融けたての水は冷たい
              engine.meta[i] = 0;
            } else {
              storeProgress(engine, i, next);
              engine.colors[i] = meltTint(i, type, next);
            }
          } else if (progress > 0 && t < T_FREEZE) {
            // 氷点を下回ると、融けかけが凍り直す
            const next = Math.max(0, progress - (T_FREEZE - t) * FUSION_RATE);
            storeProgress(engine, i, next);
            engine.colors[i] = meltTint(i, type, next);
          }
          break;
        }
        case SOIL:
          // 高温: 土の有機物は燃える。炎が燃え尽きたあとに灰が残る（水気があっても焼ける）
          if (t >= T_SOIL_BURN) { if (Math.random() < 0.05) engine.set(x, y, FIRE); }
          // 乾燥: 暖かく、湿り気度（moisture.js）が下がりきった土は、ほぐれて砂になる
          else if (t >= T_SOIL_DRY && engine.wet[i] < SOIL_DRY_WET && Math.random() < 0.006) {
            engine.set(x, y, SAND); T[i] = t;
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

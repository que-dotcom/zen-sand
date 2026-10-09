import {
  EMPTY, WATER, ICE, SNOW, ACID, MUD, SPRING, SOIL, SAND, ASH, COAL, STONE, GLASS, METAL, GOLD, KINTSUGI,
  WALL, HARD_SOIL, SANDSTONE, BASALT, OBSIDIAN, RUST, SEED, PLANT, DARK_PLANT, ACID_PLANT, FLOWER,
  DARK_FLOWER, FUNGUS, GLOW_FUNGUS, SAKURA_TREE, SAKURA_SEED, SAKURA_PETAL,
} from './materials/ids.js';

// ─── 湿り気度・酸性度 ─────────────────────────────────────────────────────────
// どちらも各セルが 0〜255 の値を持つ（engine.wet / engine.acid）。
//   湿り気度: 0 = からから 〜 255 = 水を含みきっている
//   酸性度  : 0 = 中性 〜 255 = 酸そのもの
// 素材ごとに「湿りにくさ」（抵抗値 0〜255）を持つ。0 は水をすいすい通す素材（土・灰）、
// 255 は水を通さない素材（ガラス・金属・壁）。隣り合う 2 セルの間で水が移る速さは、
// 2 つの素材のうち通しにくいほうの通りやすさ（= 1 - 抵抗値 / 255）で決まる。
// 酸性度も同じ道（水の通り道）を伝って広がる。

// 湿りにくさ（抵抗値）。ここに無い素材（気体・炎・溶岩・油など）は水を通さない（255）
const RESIST = new Uint8Array(256).fill(255);
function resist(value, ...ids) { for (const id of ids) RESIST[id] = value; }
resist(0,   WATER, SPRING, ICE, SNOW, ACID, MUD);       // 水そのもの・水気のかたまり
resist(30,  SOIL);                                       // 土: 水をよく吸う
resist(45,  ASH);
resist(70,  SAND);
resist(90,  SEED);
resist(100, PLANT, DARK_PLANT, ACID_PLANT, FLOWER, DARK_FLOWER, FUNGUS, GLOW_FUNGUS, SAKURA_TREE, SAKURA_SEED);
resist(110, SAKURA_PETAL);
resist(120, HARD_SOIL);
resist(150, COAL, RUST);
resist(170, SANDSTONE);
resist(200, BASALT);
resist(225, STONE);
resist(245, OBSIDIAN);
resist(255, GLASS, METAL, GOLD, KINTSUGI, WALL);

// 通りやすさ 0〜1
const PERM = new Float32Array(256);
for (let t = 0; t < 256; t++) PERM[t] = t === EMPTY ? 0 : (255 - RESIST[t]) / 255;

// 常に一定の湿り気度に保たれる素材（水源）。-1 は固定なし
const SRC_WET = new Float32Array(256).fill(-1);
for (const id of [WATER, SPRING, ICE, SNOW, ACID]) SRC_WET[id] = 255;
SRC_WET[MUD] = 200;

// 常に一定の酸性度に保たれる素材
const SRC_ACID = new Float32Array(256).fill(-1);
SRC_ACID[ACID] = 255;

// 酸の中和（1 ステップあたり減る割合）。水は薄め、灰・土・玄武岩はアルカリ性で打ち消す
const ACID_DECAY = new Float32Array(256).fill(0.002);
ACID_DECAY[WATER] = 0.02;
ACID_DECAY[ASH] = 0.03;
ACID_DECAY[SOIL] = 0.006;
ACID_DECAY[BASALT] = 0.01;

const WET_FLOW  = 0.06;   // 水の移りやすさの基準（1 ステップで差の何割が移るか）
const ACID_FLOW = 0.04;   // 酸の移りやすさの基準
const SIDE_FACTOR = 0.7;  // 横へ染みる勢い（下向き = 1）
const UP_FACTOR   = 0.35; // 上へ染み上がる勢い（毛細管現象）
const EVAP_BASE   = 0.0003;  // 乾く速さ（1 ステップあたり湿り気度の何割が蒸発するか）
const EVAP_HOT    = 100;     // この温度を超えるほど速く乾く
const EVAP_HOT_STEP = 20;    // 超えた分が 20 度ごとに、基準の速さがもう 1 回分ずつ加わる

/** 素材の湿りにくさ（抵抗値 0〜255）。0 = 湿りやすい、255 = 湿らない */
export function wetResistance(type) { return RESIST[type]; }

/** 置かれた直後の湿り気度。水源は決まった値、それ以外は null（引き継ぐ） */
export function sourceWet(type) { const v = SRC_WET[type]; return v >= 0 ? v : null; }
export function sourceAcid(type) { const v = SRC_ACID[type]; return v >= 0 ? v : null; }

export function ensureFields(engine) {
  const n = engine.cells.length;
  if (!engine.wet  || engine.wet.length  !== n) engine.wet  = new Float32Array(n);
  if (!engine.acid || engine.acid.length !== n) engine.acid = new Float32Array(n);
}

// 1 ステップ分の水と酸の移動。素材のある行（とその上下 1 行）だけを処理する。
export function moistureStep(engine) {
  ensureFields(engine);
  const { cells, wet, acid, temp, width: W, height: H } = engine;
  const [occLo, occHi] = engine.occupiedRows();
  if (occLo > occHi) return;
  const lo = Math.max(0, occLo - 1), hi = Math.min(H - 1, occHi + 1);

  // 1) 水源・乾燥・中和
  for (let y = lo; y <= hi; y++) {
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const i = row + x, type = cells[i];
      if (type === EMPTY) { wet[i] = 0; acid[i] = 0; continue; }
      const sw = SRC_WET[type];
      if (sw >= 0) wet[i] = sw;
      else if (wet[i] > 0) {
        const hot = temp[i] > EVAP_HOT ? (temp[i] - EVAP_HOT) / EVAP_HOT_STEP : 0;
        const w = wet[i] * (1 - EVAP_BASE * (1 + hot));
        wet[i] = w < 0.05 ? 0 : w;
      }
      const sa = SRC_ACID[type];
      if (sa >= 0) acid[i] = sa;
      else if (acid[i] > 0) {
        const a = acid[i] * (1 - ACID_DECAY[type]);
        acid[i] = a < 0.05 ? 0 : a;
      }
    }
  }

  // 2) 隣り合うセルの間で水と酸が移る（右と下の辺を 1 回ずつ数える）
  for (let y = lo; y <= hi; y++) {
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const i = row + x, pa = PERM[cells[i]];
      if (pa === 0) continue;
      if (x < W - 1) {
        const j = i + 1, p = Math.min(pa, PERM[cells[j]]);
        if (p > 0) exchange(wet, acid, i, j, p * SIDE_FACTOR, p * SIDE_FACTOR);
      }
      if (y < H - 1) {
        const j = i + W, p = Math.min(pa, PERM[cells[j]]);
        if (p > 0) {
          // i が上、j が下。水は下へ速く、上へはゆっくり染みる
          const down = wet[i] > wet[j];
          exchange(wet, acid, i, j, p * (down ? 1 : UP_FACTOR), p);
        }
      }
    }
  }
}

function exchange(wet, acid, i, j, wetK, acidK) {
  const dw = (wet[j] - wet[i]) * WET_FLOW * wetK;
  wet[i] += dw; wet[j] -= dw;
  const da = (acid[j] - acid[i]) * ACID_FLOW * acidK;
  acid[i] += da; acid[j] -= da;
}

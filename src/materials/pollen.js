import {
  FLOWER, EMPTY, POLLEN, PLANT, WATER, ICE, SAKURA_PETAL, FIRE, LAVA
} from './ids.js';
import {
  POLLEN_DRIFT, POLLEN_GENE, POLLEN_DARK, POLLEN_LIFE, POLLEN_LIFE_SHIFT,
  POLLEN_COLS, META_DARK, META_LOTUS, DARK_F_COLORS, LOTUS_COLORS, FLOWER_COLORS
} from './meta.js';

// ─── Pollen update functions ──────────────────────────────────────────────────

// 花粉放出ヘルパー（FLOWER/DARK_FLOWER/SAKURA_TREE Phase2 の共通ロジック）
// geneIdx: 遺伝子インデックス（0-7）  isDark: DARK_FLOWER 由来かどうか
export function _emitPollen(engine, x, y, geneIdx, isDark) {
  if (!engine.inBounds(x, y-1) || engine.get(x, y-1) !== EMPTY) return;
  const driftDir   = Math.random() > 0.5 ? POLLEN_DRIFT : 0;
  const pollenMeta = (geneIdx & POLLEN_GENE)
    | (isDark ? POLLEN_DARK : 0)
    | driftDir
    | (7 << POLLEN_LIFE_SHIFT); // 寿命 = 7（最大値）
  const pi = engine.idx(x, y-1);
  engine.cells[pi]   = POLLEN;
  engine.colors[pi]  = POLLEN_COLS[Math.floor(Math.random() * POLLEN_COLS.length)];
  engine.meta[pi]    = pollenMeta;
  engine.updated[pi] = 1;
}

// FLOWER: 静的だが花粉を放出する（update: null → updateFlower に変更）
export function updateFlower(engine, x, y) {
  if (Math.random() < 0.00005) { // 0.005%/frame
    const pm = engine.meta[engine.idx(x, y)];
    _emitPollen(engine, x, y, pm & POLLEN_GENE, (pm & META_DARK) !== 0);
  }
}

// DARK_FLOWER: 同上（isDark = true）
export function updateDarkFlower(engine, x, y) {
  if (Math.random() < 0.00005) {
    const pm = engine.meta[engine.idx(x, y)];
    _emitPollen(engine, x, y, pm & POLLEN_GENE, true);
  }
}

// ─── POLLEN 物理挙動 ──────────────────────────────────────────────────────────
// ・逆重力: 30% で上昇、35% で横ドリフト（meta の方向ビットで左右固定）、35% で静止
// ・寿命: 0.8%/frame でデクリメント。0 になったら EMPTY へ
// ・FLOWER: 受粉（遺伝子色上書き）、PLANT: 0.5% で早期開花、
//   WATER: 黄みがかった色に染色、ICE: 氷封静止（寿命停止）、SAKURA_PETAL: 相殺
// ─────────────────────────────────────────────────────────────────────────────
export function updatePollen(engine, x, y) {
  const i    = engine.idx(x, y);
  const meta = engine.meta[i];

  // パレット直置き（meta=0）の場合は寿命を初期化して次フレームから動く
  if (meta === 0) {
    const driftDir = Math.random() > 0.5 ? POLLEN_DRIFT : 0;
    engine.meta[i] = driftDir | (7 << POLLEN_LIFE_SHIFT);
    return;
  }

  const geneIdx = meta & POLLEN_GENE;                         // bits 0-2: 遺伝子
  const driftR  = (meta & POLLEN_DRIFT) !== 0;                // bit 4: true=右
  const life    = (meta & POLLEN_LIFE) >> POLLEN_LIFE_SHIFT;  // bits 5-7: 寿命

  // ──── 隣接セルとの反応 ────────────────────────────────────────────────────
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  let iceAdjacent = false;
  for (const [dx,dy] of nb4) {
    const nx = x+dx, ny = y+dy;
    const n  = engine.get(nx, ny);
    const ni = engine.idx(nx, ny);

    if (n === FIRE || n === LAVA) { engine.set(x, y, EMPTY); return; }

    if (n === ICE) { iceAdjacent = true; continue; } // 氷封フラグを立てるだけ

    if (n === SAKURA_PETAL) {
      // 花びらと花粉が交差 → 互いに消滅（儚い出会い）
      engine.set(x, y, EMPTY);
      engine.set(nx, ny, EMPTY);
      return;
    }

    if (n === FLOWER) {
      // 受粉（60% の確率）: FLOWER の遺伝子色を花粉の遺伝子で上書き
      if (Math.random() < 0.60) {
        const flowerMeta = engine.meta[ni];
        engine.meta[ni]   = (flowerMeta & ~POLLEN_GENE) | geneIdx;
        // 視覚的にも即座に遺伝子色へ変化
        const isDark  = (flowerMeta & META_DARK)  !== 0;
        const isLotus = (flowerMeta & META_LOTUS) !== 0;
        engine.colors[ni] = isDark  ? DARK_F_COLORS[geneIdx]
                          : isLotus ? LOTUS_COLORS[geneIdx]
                          :           FLOWER_COLORS[geneIdx];
        engine.set(x, y, EMPTY);
        return;
      }
    }

    if (n === PLANT && Math.random() < 0.005) {
      // 早期開花（0.5%）: PLANT → FLOWER（遺伝子色で咲く）
      engine.cells[ni]   = FLOWER;
      engine.colors[ni]  = FLOWER_COLORS[geneIdx];
      engine.meta[ni]    = geneIdx;
      engine.updated[ni] = 1;
      engine.set(x, y, EMPTY);
      return;
    }

    if (n === WATER) {
      // 花粉水: 水の色を黄みがかった色に染める（花粉自身は消えない）
      engine.colors[ni] = 0xD4B83A;
    }
  }

  // ──── 氷封の花粉: ICE 隣接中は静止・寿命停止 ──────────────────────────────
  if (iceAdjacent) {
    engine.colors[i] = 0xFFEE88; // 薄い黄白色（氷に閉じ込められた花粉）
    return;
  }

  // ──── 寿命デクリメント（0.8%/frame）─────────────────────────────────────────
  if (Math.random() < 0.008) {
    if (life === 0) { engine.set(x, y, EMPTY); return; }
    engine.meta[i] = (meta & ~POLLEN_LIFE) | ((life - 1) << POLLEN_LIFE_SHIFT);
  }

  // ──── 浮遊移動（逆重力型）────────────────────────────────────────────────────
  const r       = Math.random();
  const driftDx = driftR ? 1 : -1;

  if (r < 0.30) {
    // 上昇（30%）
    if (engine.inBounds(x, y-1) && engine.get(x, y-1) === EMPTY) {
      engine.swap(x, y, x, y-1); return;
    }
  } else if (r < 0.65) {
    // 横ドリフト（35%）: meta に記録された方向へ。塞がれたら反転
    if (engine.inBounds(x+driftDx, y) && engine.get(x+driftDx, y) === EMPTY) {
      engine.swap(x, y, x+driftDx, y); return;
    }
    if (engine.inBounds(x-driftDx, y) && engine.get(x-driftDx, y) === EMPTY) {
      engine.meta[i] ^= POLLEN_DRIFT; // ドリフト方向を反転して記憶
      engine.swap(x, y, x-driftDx, y); return;
    }
  }
  // 残り 35%: その場に漂う（何もしない）
}


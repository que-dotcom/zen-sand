import {
  EMPTY, WATER, OIL, LAVA, ICE, SNOW, STEAM, STONE, WALL, GLASS, OBSIDIAN,
  BASALT, SANDSTONE, METAL, GOLD, KINTSUGI
} from './ids.js';
import {
  KINTSUGI_COLS
} from './meta.js';

// ─── 金継ぎ (Kintsugi) update functions ──────────────────────────────────────
//
// GOLD     … 溶けた金。最重量級の粘性液体。割れ目（鉱物固体に2面以上挟まれた場所）
//            でのみ凝固して KINTSUGI になる。平らな床の上では固まらない。
// KINTSUGI … 固まった継ぎ目。石と同じく静的。溶岩で再溶解して金に戻る。
//            updateAcid の反応リストに載っていないため酸には自動的に不活性
//            （現実の金が王水以外に溶けないことに対応。酸で周囲の石だけが溶けると
//            金の骨格が宙に残る）。CONDUCTOR_IDS[7] として雷の振動波を伝える。

// 継ぎの土台になれる鉱物固体（この2面以上に挟まれた金だけが固まる）
const SEAM_BASE = [STONE, WALL, GLASS, OBSIDIAN, BASALT, SANDSTONE, METAL, KINTSUGI];

// 凝固ヘルパー: 金 → 金継ぎ（シナリオトリガー用イベントも発火）
function _solidify(engine, x, y) {
  const i = engine.idx(x, y);
  engine.cells[i]   = KINTSUGI;
  engine.colors[i]  = KINTSUGI_COLS[Math.floor(Math.random() * KINTSUGI_COLS.length)];
  engine.meta[i]    = 0;
  engine.updated[i] = 1;
  engine.fireEvent('kintsugi_formed');
}

export function updateGold(engine, x, y) {
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];

  // 急冷凝固: 氷・雪に触れた金は即座に固まる（溶岩→黒曜石と同じ作法で蒸気を出す）
  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === ICE || n === SNOW) {
      engine.set(x+dx, y+dy, STEAM);
      engine.meta[engine.idx(x+dx, y+dy)] = 0;
      _solidify(engine, x, y);
      return;
    }
  }

  // 割れ目凝固: 鉱物固体に2面以上挟まれていると 10%/frame で固まる
  let mineral = 0;
  for (const [dx,dy] of nb4) {
    if (SEAM_BASE.includes(engine.get(x+dx, y+dy))) mineral++;
  }
  if (mineral >= 2 && Math.random() > 0.90) { _solidify(engine, x, y); return; }

  // 流動: 水・油を押しのけて沈む。粘性は溶岩並み（55%/frame は動かない）
  // 火・溶岩には無反応（すでに溶けているので燃えも焦げもしない）
  if (Math.random() > 0.45) return;
  const below = engine.get(x, y+1);
  if (below === EMPTY || below === WATER || below === OIL) { engine.swap(x, y, x, y+1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  const dA = engine.get(x+dir, y+1), dB = engine.get(x-dir, y+1);
  if (dA === EMPTY || dA === WATER || dA === OIL) { engine.swap(x, y, x+dir, y+1); return; }
  if (dB === EMPTY || dB === WATER || dB === OIL) { engine.swap(x, y, x-dir, y+1); return; }
  if (Math.random() > 0.30) return; // 横流れはさらに渋い（とろりと広がる）
  if (engine.get(x+dir, y) === EMPTY) { engine.swap(x, y, x+dir, y); return; }
  if (engine.get(x-dir, y) === EMPTY) { engine.swap(x, y, x-dir, y); return; }
}

export function updateKintsugi(engine, x, y) {
  // 溶岩に触れると再溶解して金に戻る（10%/frame）
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    if (engine.get(x+dx, y+dy) === LAVA && Math.random() > 0.90) {
      engine.set(x, y, GOLD);
      return;
    }
  }
  // きらめき: 0.8%/frame で金箔の色幅の中を揺らぐ（振動波通過後の閃光もここで鎮まる）
  if (Math.random() < 0.008) {
    engine.colors[engine.idx(x, y)] =
      KINTSUGI_COLS[Math.floor(Math.random() * KINTSUGI_COLS.length)];
  }
  // それ以外は完全に静的（石と同じく落下しない）
}

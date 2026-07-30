import {
  KOI_BODY, WATER, ACID, LAVA, EMPTY, FIRE, ASH, DARK_PLANT, PLANT, SEED,
  SAKURA_TREE, SAKURA_PETAL
} from './ids.js';
import {
  KOI_DIRS, META_DARK, META_ICE_CRYSTAL, STEM_COLORS
} from './meta.js';

// ─── KOI update functions ────────────────────────────────────────────────────

// KOI_BODY: 鯉の胴体ボディセル（updateKoi が頭移動のたびに管理する）
// 自律的には動かない（static）。頭が動くときに一括クリア→再生成される。
export function updateKoiBody(engine, x, y) { return; }

// ─── KOI meta エンコーディング ────────────────────────────────────────────────
// bits 0-2 (0x07): 移動方向インデックス（0-7、KOI_DIRS に対応）
// bits 3-7       : 予約
//
// 視覚的集合体の構成（頭を中心とした 3×3 ブロック）:
//   [BODY][KOI ][BODY]   ← y
//   [BODY][BODY][BODY]   ← y+1
//   [BODY][BODY][BODY]   ← y+2
//
// 頭が移動するたびに「旧ボディをクリア → 新ボディを生成」する
// 物理的な swap は頭セル 1 個のみ。ボディは WATER との色の上書きにすぎない。
// ─────────────────────────────────────────────────────────────────────────────
export function updateKoi(engine, x, y) {
  if (Math.random() > 0.15) return;

  const i    = engine.idx(x, y);
  const meta = engine.meta[i];
  const dir  = meta & 0x07;

  // ──── 死亡判定（4方向に ACID/LAVA があれば消滅）────────────────────────────
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx, dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === ACID || n === LAVA) {
      engine.set(x, y, EMPTY);
      return;
    }
  }

  // ──── 移動ロジック ────────────────────────────────────────────────────────
  const [dx, dy] = KOI_DIRS[dir];
  const nx = x+dx, ny = y+dy;

  if (engine.inBounds(nx, ny)) {
    const target = engine.get(nx, ny);
    // 水、または自分のボディの中を泳げる
    if (target === WATER || target === KOI_BODY) {
      const koiColor = engine.colors[i];

      // ★ 移動前: 旧ボディをすべて水に戻す（x±1, y〜y+2）
      for (let bx = -1; bx <= 1; bx++) {
        for (let by = 0; by <= 2; by++) {
          if (bx === 0 && by === 0) continue; // 頭は消さない
          const cx = x+bx, cy = y+by;
          if (engine.inBounds(cx, cy) && engine.get(cx, cy) === KOI_BODY) {
            engine.set(cx, cy, WATER);
          }
        }
      }

      // ★ 頭を移動（物理的な swap はこの 1 回のみ）
      engine.swap(x, y, nx, ny);

      // ★ 移動後: 新しい頭を中心に 3×3 のボディを生成（WATER セルのみ上書き）
      for (let bx = -1; bx <= 1; bx++) {
        for (let by = 0; by <= 2; by++) {
          if (bx === 0 && by === 0) continue; // 頭は上書きしない
          const cx = nx+bx, cy = ny+by;
          if (engine.inBounds(cx, cy) && engine.get(cx, cy) === WATER) {
            const bi = engine.idx(cx, cy);
            engine.cells[bi]   = KOI_BODY;
            engine.colors[bi]  = koiColor; // 頭と同じ錦鯉色
            engine.updated[bi] = 1;
          }
        }
      }

      // 5% の確率でランダムに向きを変える（自然な揺らぎ）
      if (Math.random() < 0.05) {
        engine.meta[engine.idx(nx, ny)] = (meta & ~0x07) | Math.floor(Math.random() * 8);
      }
      return;
    }
  }

  // 障害物 or 水以外 → 向きをランダムに変えて待機（次フレームで再試行）
  engine.meta[i] = (meta & ~0x07) | Math.floor(Math.random() * 8);
}

// ─── Ma Void update function ─────────────────────────────────────────────────

// ─── MA_VOID 動作仕様 ─────────────────────────────────────────────────────────
// ★ 静的素材: 重力なし。落下せず、その場に留まる。
//
// 【崩壊条件】8方向確認:
//   EMPTY（MA_VOID ではない真の空間）/ LAVA / ACID が隣接 → 自身が EMPTY に消滅
//   → 密閉された空間（石・壁で囲まれた場所）でのみ存在できる
//
// 【聖域内の干渉】4方向確認（1フレームに1反応・戻り値で終了）:
//   FIRE       → 即消去（穢れの浄化）
//   ASH        → 5%  で EMPTY（無に還る）
//   DARK_PLANT → 1%  で PLANT（闇が光に）。META_DARK / META_ICE_CRYSTAL を解除
//   SEED       → 10% で SAKURA_TREE Phase2（白い桜として直接開花）
//   SAKURA_PETAL → swap（浮遊演出: 花びらが落ちずに漂う）
//
// パフォーマンス: 20%/frame のみ処理（Math.random() > 0.2 でスキップ）
// ─────────────────────────────────────────────────────────────────────────────
export function updateMaVoid(engine, x, y) {
  // 処理頻度を 10% に絞る（パフォーマンス確保 + 全体的な動作速度の抑制）
  if (Math.random() > 0.1) return;

  // ──── 聖域崩壊チェック（8方向）─────────────────────────────────────────────
  // ・LAVA / ACID → 即死（侵食）
  // ・EMPTY       → isExposed フラグを立てるのみ（ループ内では確率ロールしない）
  //
  // ループの「外」で 1 回だけ風化ロールを行うことで多重判定を防止する。
  // 実効崩壊確率: 10% × 2% = 0.2%/frame → 平均寿命 ~8〜10 秒 (@ 60fps)
  // → プレイヤーが箱の内部を塗りつぶすのに十分な猶予が生まれる
  let isExposed = false;
  const nb8 = [[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
  for (const [dx, dy] of nb8) {
    const nx = x+dx, ny = y+dy;
    if (!engine.inBounds(nx, ny)) continue;
    const n = engine.get(nx, ny);
    if (n === LAVA || n === ACID) {
      engine.set(x, y, EMPTY); return; // 汚染による即死
    }
    if (n === EMPTY) {
      isExposed = true; // 外気に触れているフラグ（ここでは消さない）
    }
  }

  // ループを抜けた後で 1 回だけ風化判定（多重ロール完全防止）
  // 10% × 1% = 0.1%/frame → 平均寿命 ~16.6秒（@ 60fps）
  if (isExposed && Math.random() < 0.01) {
    engine.set(x, y, EMPTY); return; // ゆっくりとした風化消滅
  }

  // ──── 聖域内の干渉（4方向のみ）──────────────────────────────────────────────
  // 1反応/フレーム: return で打ち切り
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    const nx = x+dx, ny = y+dy;
    const n  = engine.get(nx, ny);
    const ni = engine.idx(nx, ny);

    // 穢れの浄化: FIRE を即消去
    if (n === FIRE) {
      engine.set(nx, ny, EMPTY);
      return;
    }

    // 無への還元: ASH を 5% で消滅
    if (n === ASH && Math.random() < 0.05) {
      engine.set(nx, ny, EMPTY);
      return;
    }

    // 闇の浄化: DARK_PLANT → PLANT（1%）
    // META_DARK(0x10) と META_ICE_CRYSTAL(0x40) を解除し、明るい茎色に変換
    if (n === DARK_PLANT && Math.random() < 0.01) {
      engine.cells[ni]   = PLANT;
      engine.colors[ni]  = STEM_COLORS[Math.floor(Math.random() * STEM_COLORS.length)];
      engine.meta[ni]    = engine.meta[ni] & ~(META_DARK | META_ICE_CRYSTAL);
      engine.updated[ni] = 1;
      return;
    }

    // 聖域の発芽: SEED → 白い桜の木（Phase 2 = 即開花）（10%）
    // 土も水もなくとも聖域の力で直接開花フェーズから始まる
    if (n === SEED && Math.random() < 0.10) {
      engine.cells[ni]   = SAKURA_TREE;
      engine.colors[ni]  = 0xFFFFFF; // 白い桜（幽玄な聖域の木）
      engine.meta[ni]    = 64;        // Phase 2 直入り（開花）
      engine.updated[ni] = 1;
      return;
    }

    // 花びらの浮遊: MA_VOID の「真下」にある花びらのみ上へ押し上げる
    // dy=1  → neighbor は (x, y+1) = MA_VOID より下 = 花びらが下にある → swap で花びらが上昇 ✓
    // dy=-1 → neighbor は (x, y-1) = MA_VOID より上 = 花びらが上にある → swap すると下降してしまう ✗（除外）
    // dx=±1 → 横方向は中立（横移動のみ、浮遊ドリフトに使用）
    if (n === SAKURA_PETAL && (dy === 1 || dx !== 0)) {
      engine.swap(x, y, nx, ny);
      return;
    }
  }
}


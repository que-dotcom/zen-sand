// ─── 散 — 風の掃き消しの儀式 ─────────────────────────────────────────────────
// 砂曼荼羅のように、庭全体を風がゆっくり右へ掃き消していく。
// 壁も岩も区別しない（すべては無常）。終わると盤面は完全な空になる。
import { EMPTY } from './materials.js';

export class ChiriRitual {
  constructor(engine, durationFrames = 600) {
    this.engine   = engine;
    this.duration = durationFrames;
    this.active   = false;
    this.t        = 0;
  }

  start() {
    this.active = true;
    this.t = 0;
  }

  // 毎フレーム呼ぶ。終了フレームで 'done' を返す。
  step() {
    if (!this.active) return 'idle';
    const e = this.engine, W = e.width, H = e.height;
    const progress = this.t / this.duration;
    // そよ風から始まり、終盤に強く吹き抜ける（3乗カーブ）
    const p = 0.002 + 0.12 * progress ** 3;

    // 右へ運ぶので右端から走査する（同一フレームでの二重移動を防ぐ）
    for (let y = 0; y < H; y++) {
      for (let x = W - 1; x >= 0; x--) {
        const i = e.idx(x, y);
        if (e.cells[i] === EMPTY) continue;
        if (Math.random() > p) continue;
        const nx = x + 2 + Math.floor(Math.random() * 3);      // 右へ 2〜4
        const ny = y - (Math.random() < 0.4 ? 1 : 0);          // 時々ふわりと上へ
        if (nx >= W) { e.set(x, y, EMPTY); continue; }         // 画面の外へ散る
        if (e.inBounds(nx, ny) && e.cells[e.idx(nx, ny)] === EMPTY) {
          e.swap(x, y, nx, ny);
        } else if (Math.random() < 0.08) {
          e.set(x, y, EMPTY);                                  // 行き場のない粒も少しずつ霧散する
        }
      }
    }

    if (++this.t >= this.duration) {
      this.active = false;
      e.clear(); // 結び: 完全な空
      return 'done';
    }
    return 'active';
  }
}

// ─── 倍速ガバナー ─────────────────────────────────────────────────────────────
// 描画（rAF）とシミュレーションのステップ数を切り離し、「表示 60fps を保てる範囲」で
// 倍速の上限を動的に決める。
//
//   上限 = 1フレームの作業予算（60fps の 16.7ms × 余裕率）から描画コストを引き、
//          1ステップの実測コストで割った値（整数に切り捨て）。固定の段や上限値は持たない。
//   選べる倍速は 1×, 2×, 4× … と倍々に並べ、最後に実測した上限そのものを置く。
//
// 実測値は指数移動平均（EMA）で更新し続けるので、盤面が重くなれば上限は下がり、
// 軽くなれば戻る。コストモデルが外れて実際にフレームが遅れた場合は、
// 遅延フレームの連続を検知して一段下げ、しばらく上限を抑える（フィードバック）。

const TARGET_FRAME_MS = 1000 / 60;
const EMA_ALPHA       = 0.1;

export class SpeedGovernor {
  constructor({
    targetMs     = TARGET_FRAME_MS,
    utilization  = 0.75,   // 1フレームの予算のうち作業に使ってよい割合（残りは描画合成・GC・他の処理）
    warmupFrames = 30,     // 実測が揃うまでは 1× 固定
    lateRatio    = 1.3,    // フレーム間隔が target×この値を超えたら「遅れた」と数える
    lateLimit    = 20,     // 遅れが累積この回数に達したら上限を一段下げる
    penaltyMs    = 10000,  // フィードバックによる上限抑制の持続時間
  } = {}) {
    this.targetMs     = targetMs;
    this.utilization  = utilization;
    this.warmupFrames = warmupFrames;
    this.lateRatio    = lateRatio;
    this.lateLimit    = lateLimit;
    this.penaltyMs    = penaltyMs;

    this.speed      = 1;
    this.stepMs     = 0;    // 1ステップあたりの実測コスト（ms, EMA）
    this.renderMs   = 0;    // 1回の描画コスト（ms, EMA）
    this.samples    = 0;    // 描画サンプル数
    this.stepSamples = 0;   // ステップサンプル数
    this.lateCount  = 0;
    this.penaltyMax = null; // フィードバックで抑えられている上限
    this.penaltyUntil = 0;
  }

  get calibrated() {
    return this.samples >= this.warmupFrames && this.stepSamples > 0;
  }

  // 実測コストだけで決まる上限。未較正の間は 1×。
  get modelMax() {
    if (!this.calibrated) return 1;
    const budget = this.targetMs * this.utilization - this.renderMs;
    const affordable = this.stepMs > 0 ? budget / this.stepMs : 1;
    return Math.max(1, Math.floor(affordable));
  }

  // フィードバック抑制も含めた現在の上限
  maxSpeed(now = 0) {
    const m = this.modelMax;
    if (this.penaltyMax !== null && now < this.penaltyUntil) {
      return Math.max(1, Math.min(m, this.penaltyMax));
    }
    return m;
  }

  // 選べる倍速: 1, 2, 4, … と倍々に並べ、最後に上限そのもの
  options(now = 0) {
    const max = this.maxSpeed(now);
    const list = [];
    for (let v = 1; v < max; v *= 2) list.push(v);
    list.push(max);
    return list;
  }

  // 1フレーム分の作業コストを記録する。上限を超えていれば速度を下げ、下げたら true を返す。
  recordWork(stepTotalMs, steps, renderMs, now = 0) {
    this.samples++;
    this.renderMs = this.samples === 1 ? renderMs : this.renderMs + (renderMs - this.renderMs) * EMA_ALPHA;
    if (steps > 0) {
      const per = stepTotalMs / steps;
      this.stepSamples++;
      this.stepMs = this.stepSamples === 1 ? per : this.stepMs + (per - this.stepMs) * EMA_ALPHA;
    }
    return this._clamp(now);
  }

  // rAF のフレーム間隔を記録する（実際に 60fps を割っているかの安全弁）。下げたら true。
  recordFrameInterval(ms, now = 0) {
    if (ms > 250) return false; // タブ切替などの長い中断は無視
    if (ms > this.targetMs * this.lateRatio && this.speed > 1) {
      this.lateCount++;
    } else if (this.lateCount > 0) {
      this.lateCount--;
    }
    if (this.lateCount >= this.lateLimit) {
      this.lateCount = 0;
      if (this.speed > 1) {
        // 一段（半分）下げ、その値を一定時間の上限にする
        this.speed        = Math.max(1, Math.floor(this.speed / 2));
        this.penaltyMax   = this.speed;
        this.penaltyUntil = now + this.penaltyMs;
        return true;
      }
    }
    return false;
  }

  _clamp(now) {
    const max = this.maxSpeed(now);
    if (this.speed > max) { this.speed = max; return true; }
    return false;
  }

  // 次の倍速へ。上限まで行ったら 1× に戻る。
  cycle(now = 0) {
    const next = this.options(now).find(v => v > this.speed);
    this.speed = next !== undefined ? next : 1;
    return this.speed;
  }
}

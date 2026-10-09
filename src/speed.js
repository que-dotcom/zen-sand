// ─── 倍速ガバナー ─────────────────────────────────────────────────────────────
// 描画（rAF）とシミュレーションのステップ数を切り離し、「表示 60fps を保てる範囲」で
// 倍速の上限を動的に決める。
//
//   上限 = 1フレームの作業予算（60fps の 16.7ms × 余裕率）から描画コストを引き、
//          1ステップの実測コストで割った値（整数に切り捨て）。固定の段や上限値は持たない。
//   選べる倍速は 1×, 2×, 4× … と 2 の乗数を上限まで並べ、最後に「最速」を置く。
//   最速は特定の数値ではなく、そのときの上限にいつも追従するモード（盤面が重くなれば遅くなり、軽くなれば速くなる）。
//
// 1 ステップのコストは「平均（EMA）」と「直近の最大値（ピークホールド）」のうち大きいほうで見積もる。
// 盤面が急に重くなったときは最大値が即座に効いて上限が下がり、軽くなったときは最大値がゆっくり減って戻る。
// （空の盤面で測った軽いコストのまま上限を高く見積もり、砂を落とした瞬間にフレームが固まるのを防ぐ。）
//
// さらに、1 フレームに回すステップは時間でも打ち切る（runSteps）。予算を使い切ったら残りは諦めて、
// その分だけ速度を落とす。見積もりが外れても、1 フレームが予算を大きく超えて固まることはない。
//
// コストモデルが外れて実際にフレームが遅れた場合は、遅延フレームの連続を検知して一段下げ、
// しばらく上限を抑える（フィードバック）。

// 「最速」を表す希望値（実際の速度は、その時点の上限になる）
export const FASTEST = Infinity;

const TARGET_FRAME_MS = 1000 / 60;
const EMA_ALPHA       = 0.1;
const PEAK_DECAY      = 0.97; // ピークホールドの減衰（1 サンプルごと。約 23 フレームで半分）

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

    this.requested  = 1;    // ユーザーが選んだ倍速（希望）
    this.speed      = 1;    // 実際に回している倍速 = min(希望, その時点の上限)。負荷が下がれば希望まで戻る
    this.stepMs     = 0;    // 1ステップあたりの実測コスト（ms, EMA）
    this.stepPeak   = 0;    // 1ステップあたりの直近の最大コスト（ms, 急に増えたら即座に追従し、ゆっくり減る）
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
    const cost = this.stepCost;
    const affordable = cost > 0 ? this.frameBudget / cost : 1;
    return Math.max(1, Math.floor(affordable));
  }

  // 上限の計算に使う 1 ステップのコスト（平均と直近最大の大きいほう）
  get stepCost() { return Math.max(this.stepMs, this.stepPeak); }

  // 1 フレームのうちシミュレーションに使える時間（ms）
  get frameBudget() { return Math.max(0, this.targetMs * this.utilization - this.renderMs); }

  // 1 フレームぶんのステップを、予算の時間内で実行する。最低 1 ステップは必ず回す。
  // 予算を使い切ったら残りは諦め、速度をその達成率まで下げる。
  //   want: 回したいステップ数 / stepFn: 1 ステップを実行する関数 / clock: 現在時刻（ms）を返す関数
  // 戻り値: { done, truncated, ms }
  runSteps(want, stepFn, clock = () => performance.now()) {
    const start = clock();
    const deadline = start + this.frameBudget;
    let done = 0;
    while (done < want) {
      stepFn();
      done++;
      if (done < want && clock() >= deadline) break;
    }
    const truncated = done < want;
    if (truncated) this.speed = Math.max(1, Math.floor(this.speed * done / want));
    return { done, truncated, ms: clock() - start };
  }

  // フィードバック抑制も含めた現在の上限
  maxSpeed(now = 0) {
    const m = this.modelMax;
    if (this.penaltyMax !== null && now < this.penaltyUntil) {
      return Math.max(1, Math.min(m, this.penaltyMax));
    }
    return m;
  }

  // 選べる倍速: 2 の乗数（1, 2, 4, … 上限まで）と、最後に「最速」（FASTEST）
  options(now = 0) {
    const max = this.maxSpeed(now);
    const list = [];
    for (let v = 1; v <= max; v *= 2) list.push(v);
    list.push(FASTEST);
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
      this.stepPeak = Math.max(per, this.stepPeak * PEAK_DECAY);
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

  // 実際の速度を「希望」と「現在の上限」の小さいほうに合わせる。下げたら true。
  // 上限が上がれば、希望のぶんまで自動で戻る。
  _clamp(now) {
    const target = Math.min(this.requested, this.maxSpeed(now));
    const lowered = target < this.speed;
    this.speed = target;
    return lowered;
  }

  // 「最速」モードか
  get fastest() { return this.requested === FASTEST; }

  // 希望が上限に抑えられているか（最速は、いつも上限そのものなので抑えられているとは言わない）
  get limited() { return !this.fastest && this.requested > this.speed; }

  // 次の倍速（希望）へ。2 の乗数を順に進み、最速の次は 1× に戻る。
  cycle(now = 0) {
    const next = this.options(now).find(v => v > this.requested);
    this.requested = next !== undefined ? next : 1;
    this.speed = Math.min(this.requested, this.maxSpeed(now));
    return this.speed;
  }
}

import { MATERIALS, EMPTY, WATER, ICE, SNOW, SPARK } from './materials.js';
import { thermalStep, resetTemps, initialTemp, setAmbientShift } from './thermal.js';

// 素材 ID → 更新関数の表（毎セル MATERIALS[type].update を引くより速い）
const UPDATERS = new Array(256).fill(undefined);
for (const id of Object.keys(MATERIALS)) UPDATERS[id] = MATERIALS[id].update || undefined;
import { T_ICE_MELT } from './materials/climate.js';

export class Engine {
  constructor(width, height) {
    this.width       = width;
    this.height      = height;
    this.cells       = new Uint8Array(width * height);
    this.colors      = new Uint32Array(width * height);
    this.updated     = new Uint8Array(width * height);
    this.meta        = new Uint8Array(width * height); // flower color/size lineage
    this.firedEvents = new Set(); // scenario event bus (cleared each frame)
    this.temp        = new Float32Array(width * height); // 温度場 0〜255（空きセルは気温）
    this.ambientShift = 0; // 環境の気温の調整量（設定のスライダー。0 = 標準）
    resetTemps(this);
  }

  fireEvent(name) { this.firedEvents.add(name); }

  idx(x, y) { return y * this.width + x; }
  inBounds(x, y) { return x >= 0 && x < this.width && y >= 0 && y < this.height; }

  setAmbientShift(shift) { setAmbientShift(this, shift); }

  ambientAt(y) { return this._amb && this._amb.length === this.height ? this._amb[y] : 100; }

  // 高度 0（地表＝最下段）〜 1（最上段）。気象（露点・雲）の基準になる。
  altitude(y) { return 1 - y / (this.height - 1); }

  get(x, y) {
    if (!this.inBounds(x, y)) return 255;
    return this.cells[this.idx(x, y)];
  }

  set(x, y, type) {
    if (!this.inBounds(x, y)) return;
    const i = this.idx(x, y);
    this.cells[i] = type;
    if (type !== EMPTY) {
      const cols = MATERIALS[type].colors;
      this.colors[i] = cols[Math.floor(Math.random() * cols.length)];
      // 水・氷・雪の meta は相変化の進み（thermal.js）。別の素材から変わったときに前の値を引きずらない
      if (type === WATER || type === ICE || type === SNOW || type === SPARK) this.meta[i] = 0; // 火花の meta は電荷（0 = 広がらない）
      // 温度: 置いた素材に初期温度があればそれ、なければその場所の温度を引き継ぐ
      const t0 = initialTemp(type);
      if (t0 === t0) this.temp[i] = t0;
      else if (type === WATER && this.temp[i] < T_ICE_MELT + 4) this.temp[i] = T_ICE_MELT + 4; // 氷雪が融けた水は、融点より少し暖かい
    } else {
      this.colors[i] = 0;
      this.meta[i]   = 0;
      this.temp[i]   = this.ambientAt(y);
    }
  }

  // Plant growth helper: set cell with explicit color + meta (preserves lineage)
  plant(x, y, type, color, meta) {
    if (!this.inBounds(x, y)) return;
    const i = this.idx(x, y);
    this.cells[i]   = type;
    this.colors[i]  = color;
    this.meta[i]    = meta;
    this.updated[i] = 1;
  }

  swap(x1, y1, x2, y2) {
    const i1 = this.idx(x1, y1), i2 = this.idx(x2, y2);
    const tC = this.cells[i1], tK = this.colors[i1], tM = this.meta[i1], tT = this.temp[i1];
    this.cells[i1]  = this.cells[i2];  this.colors[i1]  = this.colors[i2];  this.meta[i1]  = this.meta[i2];
    this.cells[i2]  = tC;              this.colors[i2]  = tK;               this.meta[i2]  = tM;
    this.temp[i1]   = this.temp[i2];   this.temp[i2]    = tT;
    this.updated[i1] = 1; this.updated[i2] = 1;
  }

  // 素材のあるセルが存在する行の範囲 [最上行, 最下行]。何も無ければ最上行 > 最下行。
  // 空の行を 4 バイトずつ（Uint32）読み飛ばして求めるので、ほぼ空の盤面でも速い。
  occupiedRows() {
    const { cells, width: W, height: H } = this;
    const n = cells.length;
    if (!this._cells32 || this._cells32.buffer !== cells.buffer) this._cells32 = new Uint32Array(cells.buffer, cells.byteOffset, n >> 2);
    const words = this._cells32;
    let w = 0;
    while (w < words.length && words[w] === 0) w++;
    let first = w * 4;
    if (w === words.length) first = words.length * 4; // 4 バイトに収まらない端数の残り
    while (first < n && cells[first] === EMPTY) first++;
    if (first >= n) return [0, -1];
    let last = n - 1;
    let wl = words.length - 1;
    while (last >= wl * 4 + 4 && cells[last] === EMPTY) last--; // 端数
    if (last < wl * 4 + 4) {
      while (wl >= 0 && words[wl] === 0) wl--;
      last = wl * 4 + 3;
      while (last > first && cells[last] === EMPTY) last--;
    }
    return [Math.floor(first / W), Math.floor(last / W)];
  }

  update() {
    this.firedEvents.clear();
    this.updated.fill(0);
    const { cells, updated, width: W } = this;
    const [top, bottom] = this.occupiedRows();
    // 素材のある行だけを下から順に更新する（上へ昇る素材は次のフレームで処理される）
    for (let y = bottom; y >= top; y--) {
      const ltr = (y & 1) === 0;
      const row = y * W;
      for (let xi = 0; xi < W; xi++) {
        const x = ltr ? xi : W - 1 - xi;
        const i = row + x;
        if (updated[i]) continue;
        const type = cells[i];
        if (type === EMPTY) continue;
        const update = UPDATERS[type];
        if (update !== undefined) update(this, x, y);
      }
    }
    thermalStep(this);
  }

  clear() {
    this.cells.fill(0);
    this.colors.fill(0);
    this.meta.fill(0);
    resetTemps(this);
  }
}

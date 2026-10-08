import { MATERIALS, EMPTY, WATER } from './materials.js';
import { thermalStep, resetTemps, initialTemp } from './thermal.js';
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
    resetTemps(this);
  }

  fireEvent(name) { this.firedEvents.add(name); }

  idx(x, y) { return y * this.width + x; }
  inBounds(x, y) { return x >= 0 && x < this.width && y >= 0 && y < this.height; }

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

  update() {
    this.firedEvents.clear();
    this.updated.fill(0);
    for (let y = this.height - 1; y >= 0; y--) {
      const ltr = (y & 1) === 0;
      for (let xi = 0; xi < this.width; xi++) {
        const x = ltr ? xi : this.width - 1 - xi;
        const i = this.idx(x, y);
        if (this.updated[i]) continue;
        const type = this.cells[i];
        if (type === EMPTY) continue;
        const mat = MATERIALS[type];
        if (mat && mat.update) mat.update(this, x, y);
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

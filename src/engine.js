import { MATERIALS, EMPTY } from './materials.js';

export class Engine {
  constructor(width, height) {
    this.width   = width;
    this.height  = height;
    this.cells   = new Uint8Array(width * height);
    this.colors  = new Uint32Array(width * height);
    this.updated = new Uint8Array(width * height);
    this.meta    = new Uint8Array(width * height); // flower color/size lineage
  }

  idx(x, y) { return y * this.width + x; }
  inBounds(x, y) { return x >= 0 && x < this.width && y >= 0 && y < this.height; }

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
    } else {
      this.colors[i] = 0;
      this.meta[i]   = 0;
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
    const tC = this.cells[i1], tK = this.colors[i1], tM = this.meta[i1];
    this.cells[i1]  = this.cells[i2];  this.colors[i1]  = this.colors[i2];  this.meta[i1]  = this.meta[i2];
    this.cells[i2]  = tC;              this.colors[i2]  = tK;               this.meta[i2]  = tM;
    this.updated[i1] = 1; this.updated[i2] = 1;
  }

  update() {
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
  }

  clear() {
    this.cells.fill(0);
    this.colors.fill(0);
    this.meta.fill(0);
  }
}

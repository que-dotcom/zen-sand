import { MATERIALS, EMPTY } from './materials.js';

export class Engine {
  constructor(width, height) {
    this.width  = width;
    this.height = height;
    this.cells   = new Uint8Array(width * height);
    this.colors  = new Uint32Array(width * height);
    this.updated = new Uint8Array(width * height);
  }

  idx(x, y) {
    return y * this.width + x;
  }

  inBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  // Returns WALL (255) for out-of-bounds — treated as impassable
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
    }
  }

  swap(x1, y1, x2, y2) {
    const i1 = this.idx(x1, y1);
    const i2 = this.idx(x2, y2);
    const tmpC = this.cells[i1];
    const tmpK = this.colors[i1];
    this.cells[i1]  = this.cells[i2];
    this.colors[i1] = this.colors[i2];
    this.cells[i2]  = tmpC;
    this.colors[i2] = tmpK;
    this.updated[i1] = 1;
    this.updated[i2] = 1;
  }

  update() {
    this.updated.fill(0);
    // Bottom-to-top scan so gravity works naturally
    for (let y = this.height - 1; y >= 0; y--) {
      // Alternate scan direction each row to reduce directional bias
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
  }
}

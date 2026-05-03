import { EMPTY } from './materials.js';

// Background in ABGR (little-endian) format: #0A0A0A fully opaque
const BG = (0xFF << 24) | (0x0A << 16) | (0x0A << 8) | 0x0A;

export class Renderer {
  constructor(canvas, engine, cellSize) {
    this.canvas   = canvas;
    this.engine   = engine;
    this.cellSize = cellSize;
    this.ctx      = canvas.getContext('2d');

    const pw = engine.width  * cellSize;
    const ph = engine.height * cellSize;
    this.imageData = this.ctx.createImageData(pw, ph);
    // Uint32 view for fast per-pixel writes (little-endian ABGR)
    this.pixels = new Uint32Array(this.imageData.data.buffer);
    this.pw = pw;
  }

  // Convert 0xRRGGBB hex → little-endian ABGR Uint32
  hexToPixel(hex) {
    const r = (hex >> 16) & 0xFF;
    const g = (hex >>  8) & 0xFF;
    const b =  hex        & 0xFF;
    return (0xFF << 24) | (b << 16) | (g << 8) | r;
  }

  render() {
    const { engine, cellSize, pixels, pw } = this;
    const cs = cellSize;

    for (let cy = 0; cy < engine.height; cy++) {
      for (let cx = 0; cx < engine.width; cx++) {
        const i = engine.idx(cx, cy);
        const color = engine.cells[i] === EMPTY
          ? BG
          : this.hexToPixel(engine.colors[i]);

        const px = cx * cs;
        const py = cy * cs;
        for (let dy = 0; dy < cs; dy++) {
          const row = (py + dy) * pw + px;
          for (let dx = 0; dx < cs; dx++) {
            pixels[row + dx] = color;
          }
        }
      }
    }

    this.ctx.putImageData(this.imageData, 0, 0);
  }
}

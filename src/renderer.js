import { EMPTY } from './materials.js';
import { T_FREEZE, T_BOIL } from './materials/climate.js';

// Background in ABGR (little-endian) format: #0A0A0A fully opaque
const BG = (0xFF << 24) | (0x0A << 16) | (0x0A << 8) | 0x0A;

// 等温線の色（ABGR）
const ISO_FREEZE = (0xFF << 24) | (0xFF << 16) | (0xF0 << 8) | 0xA0; // 水色がかった白
const ISO_BOIL   = (0xFF << 24) | (0xFF << 16) | (0xFF << 8) | 0xFF; // 白

// ─── 温度ビュー（デバッグ）─────────────────────────────────────────────────────
// 温度 0〜255 を 青→水色→緑→黄→橙→赤→白 のヒートマップにする。
// 黄色が沸点（150）付近、青が氷点（80）付近になるように色の節を置いてある。
export const HEAT_STOPS = [
  [0,   10,  10,  60],
  [70,  30,  70, 220],
  [100, 40, 200, 200],
  [130, 60, 200,  80],
  [150, 240, 230, 60],
  [190, 255, 140, 30],
  [230, 230,  40, 20],
  [255, 255, 255, 255],
];

export function heatRGB(t) {
  const v = Math.min(255, Math.max(0, t));
  for (let k = 1; k < HEAT_STOPS.length; k++) {
    const [t1, r1, g1, b1] = HEAT_STOPS[k];
    if (v <= t1) {
      const [t0, r0, g0, b0] = HEAT_STOPS[k - 1];
      const f = (v - t0) / (t1 - t0);
      return [r0 + (r1 - r0) * f, g0 + (g1 - g0) * f, b0 + (b1 - b0) * f].map(Math.round);
    }
  }
  return [255, 255, 255];
}

// ABGR の Uint32 パレット（256 段）。dim は空きセル（気温）を素材より暗く描くための係数
function heatPalette(dim) {
  const pal = new Uint32Array(256);
  for (let t = 0; t < 256; t++) {
    const [r, g, b] = heatRGB(t).map(c => Math.round(c * dim));
    pal[t] = (0xFF << 24) | (b << 16) | (g << 8) | r;
  }
  return pal;
}

export class Renderer {
  constructor(canvas, engine, cellSize) {
    this.canvas   = canvas;
    this.engine   = engine;
    this.cellSize = cellSize;
    this.ctx      = canvas.getContext('2d');
    this.tempView = false; // true なら素材の色ではなく温度のヒートマップで描く
    this.heatSolid = heatPalette(1);
    this.heatAir   = heatPalette(0.4);
    this.cursor    = null; // 温度ビューでハイライトするセルのグリッド座標 {x, y}
    this.resize();
  }

  // 盤面の大きさ（セル数）が変わったときに、描画用のバッファを作り直す。
  // 描画は「1 セル = 1 ピクセル」の小さなバッファに書き、画面へは拡大して貼る
  // （セルごとに cellSize² 個のピクセルを書くより、書き込み量が 1 / cellSize² で済む）。
  resize() {
    const { engine } = this;
    this.buffer = document.createElement('canvas');
    this.buffer.width  = engine.width;
    this.buffer.height = engine.height;
    this.bctx = this.buffer.getContext('2d');
    this.imageData = this.bctx.createImageData(engine.width, engine.height);
    // Uint32 view for fast per-pixel writes (little-endian ABGR)
    this.pixels = new Uint32Array(this.imageData.data.buffer);
  }

  // Convert 0xRRGGBB hex → little-endian ABGR Uint32
  hexToPixel(hex) {
    const r = (hex >> 16) & 0xFF;
    const g = (hex >>  8) & 0xFF;
    const b =  hex        & 0xFF;
    return (0xFF << 24) | (b << 16) | (g << 8) | r;
  }

  render() {
    const { engine, pixels } = this;
    const { cells, colors, temp, width: W, height: H } = engine;
    if (pixels.length !== cells.length) this.resize();

    if (!this.tempView) {
      for (let i = 0, n = cells.length; i < n; i++) {
        if (cells[i] === EMPTY) { pixels[i] = BG; continue; }
        const c = colors[i];
        pixels[i] = 0xFF000000 | ((c & 0xFF) << 16) | (c & 0xFF00) | ((c >> 16) & 0xFF);
      }
    } else {
      const solid = this.heatSolid, air = this.heatAir;
      for (let cy = 0; cy < H; cy++) {
        for (let cx = 0; cx < W; cx++) {
          const i = cy * W + cx;
          const t = temp[i];
          let color = (cells[i] === EMPTY ? air : solid)[t < 0 ? 0 : t > 255 ? 255 : Math.round(t)];
          // 等温線: 氷点（水色）と沸点（白）をまたぐ境目のセルを明るい線で縁取る
          const tr = cx + 1 < W ? temp[i + 1] : t;
          const td = cy + 1 < H ? temp[i + W] : t;
          if ((t - T_BOIL) * (tr - T_BOIL) < 0 || (t - T_BOIL) * (td - T_BOIL) < 0) color = ISO_BOIL;
          else if ((t - T_FREEZE) * (tr - T_FREEZE) < 0 || (t - T_FREEZE) * (td - T_FREEZE) < 0) color = ISO_FREEZE;
          pixels[i] = color;
        }
      }
    }

    // 小さなバッファを、補間なし（くっきりしたセルの角）で画面いっぱいに拡大して貼る
    this.bctx.putImageData(this.imageData, 0, 0);
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.buffer, 0, 0, W, H, 0, 0, W * this.cellSize, H * this.cellSize);
    if (this.tempView && this.cursor) this._drawCursor();
  }

  // 温度ビューのカーソル: 見失わないよう、黒縁つきの白い十字と枠でセルを示す
  _drawCursor() {
    const { x, y } = this.cursor;
    const { engine, cellSize: cs, ctx } = this;
    if (!engine.inBounds(x, y)) return;
    const px = x * cs, py = y * cs, arm = cs * 6;
    ctx.save();
    for (const [w, col] of [[5, 'rgba(0,0,0,0.9)'], [2, '#fff']]) {
      ctx.lineWidth = w;
      ctx.strokeStyle = col;
      ctx.strokeRect(px - 1, py - 1, cs + 2, cs + 2);
      ctx.beginPath();
      ctx.moveTo(px + cs / 2, py - arm); ctx.lineTo(px + cs / 2, py - cs);
      ctx.moveTo(px + cs / 2, py + cs * 2); ctx.lineTo(px + cs / 2, py + arm);
      ctx.moveTo(px - arm, py + cs / 2); ctx.lineTo(px - cs, py + cs / 2);
      ctx.moveTo(px + cs * 2, py + cs / 2); ctx.lineTo(px + arm, py + cs / 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

import { SAND } from './materials.js';

// ─── 熊手（砂紋）─────────────────────────────────────────────────────────────
// 物理には触れず、静止した砂セルの色だけを書き換えて砂紋を刻む。
// 固定パレットを塗るので何度掻いても暗く潰れない（再度掻くと模様が上書きされる）。
const RAKE_TINE_SPACING = 3; // 熊手の歯の間隔（セル）
const RAKE_GROOVE_COLS  = [0x87723F, 0x8E7845, 0x806B38]; // 溝（陰）
const RAKE_RIDGE_COLS   = [0xD9BC72, 0xE0C47A, 0xD2B468]; // 畝（光）

export class InputHandler {
  constructor(canvas, engine, cellSize) {
    this.canvas        = canvas;
    this.engine        = engine;
    this.cellSize      = cellSize;
    this.isDrawing     = false;
    this.material      = 1; // default: SAND
    this.tool          = 'brush'; // 'brush' | 'rake'
    this.brushRadius   = 3;
    this.usedMaterials = new Set(); // シナリオ進行トラッキング用
    this._prevRake     = null;      // 熊手ストロークの直前グリッド座標
    this._bindEvents();
  }

  resetUsage() { this.usedMaterials.clear(); }

  _gridPos(clientX, clientY) {
    const rect  = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width  / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: Math.floor(((clientX - rect.left) * scaleX) / this.cellSize),
      y: Math.floor(((clientY - rect.top)  * scaleY) / this.cellSize),
    };
  }

  paint(clientX, clientY) {
    if (this.tool === 'rake') { this.rake(clientX, clientY); return; }
    const { x, y } = this._gridPos(clientX, clientY);
    this.usedMaterials.add(this.material);
    const r = this.brushRadius;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          // Sparse fill for large brushes to look more natural
          if (r > 2 && Math.random() > 0.75) continue;
          this.engine.set(x + dx, y + dy, this.material);
        }
      }
    }
  }

  rake(clientX, clientY) {
    const { x, y } = this._gridPos(clientX, clientY);
    this.rakeStroke(x, y);
  }

  // ストロークの進行方向に沿って、垂直に並んだ歯（tine）ごとに溝と畝を塗る
  // グリッド座標で動く純粋ロジック（テスト可能にするため rake と分離）
  rakeStroke(x, y) {
    const prev = this._prevRake;
    this._prevRake = { x, y };
    if (!prev) return;
    const dx = x - prev.x, dy = y - prev.y;
    const len = Math.hypot(dx, dy);
    if (len < 1) return;
    const ux = dx / len, uy = dy / len; // 進行方向の単位ベクトル
    const px = -uy,      py = ux;       // その垂直方向（歯を並べる軸）
    const maxK = Math.floor(this.brushRadius / RAKE_TINE_SPACING);
    for (let s = 0; s <= len; s++) {
      const bx = prev.x + ux * s, by = prev.y + uy * s;
      for (let k = -maxK; k <= maxK; k++) {
        const off = k * RAKE_TINE_SPACING;
        this._rakeCell(Math.round(bx + px * off),       Math.round(by + py * off),       RAKE_GROOVE_COLS);
        this._rakeCell(Math.round(bx + px * (off + 1)), Math.round(by + py * (off + 1)), RAKE_RIDGE_COLS);
      }
    }
  }

  _rakeCell(x, y, cols) {
    const e = this.engine;
    if (!e.inBounds(x, y)) return;
    const i = e.idx(x, y);
    if (e.cells[i] !== SAND) return;
    e.colors[i] = cols[Math.floor(Math.random() * cols.length)];
  }

  _bindEvents() {
    const c = this.canvas;
    const start = (cx, cy) => { this.isDrawing = true; this._prevRake = null; this.paint(cx, cy); };
    const end   = ()       => { this.isDrawing = false; this._prevRake = null; };
    // Mouse
    c.addEventListener('mousedown',  e => start(e.clientX, e.clientY));
    c.addEventListener('mousemove',  e => { if (this.isDrawing) this.paint(e.clientX, e.clientY); });
    c.addEventListener('mouseup',    end);
    c.addEventListener('mouseleave', end);
    // Touch
    c.addEventListener('touchstart', e => { e.preventDefault(); start(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    c.addEventListener('touchmove',  e => { e.preventDefault(); if (this.isDrawing) this.paint(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    c.addEventListener('touchend',   end);
  }
}

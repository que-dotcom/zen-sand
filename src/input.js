export class InputHandler {
  constructor(canvas, engine, cellSize) {
    this.canvas        = canvas;
    this.engine        = engine;
    this.cellSize      = cellSize;
    this.isDrawing     = false;
    this.material      = 1; // default: SAND
    this.brushRadius   = 3;
    this.usedMaterials = new Set(); // シナリオ進行トラッキング用
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

  _bindEvents() {
    const c = this.canvas;
    // Mouse
    c.addEventListener('mousedown',  e => { this.isDrawing = true;  this.paint(e.clientX, e.clientY); });
    c.addEventListener('mousemove',  e => { if (this.isDrawing) this.paint(e.clientX, e.clientY); });
    c.addEventListener('mouseup',    () => { this.isDrawing = false; });
    c.addEventListener('mouseleave', () => { this.isDrawing = false; });
    // Touch
    c.addEventListener('touchstart', e => { e.preventDefault(); this.isDrawing = true;  this.paint(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    c.addEventListener('touchmove',  e => { e.preventDefault(); if (this.isDrawing) this.paint(e.touches[0].clientX, e.touches[0].clientY); },       { passive: false });
    c.addEventListener('touchend',   () => { this.isDrawing = false; });
  }
}

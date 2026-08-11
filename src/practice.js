import {
  EMPTY, WALL, STONE, SAND, WATER, LAVA, OIL, SOIL, MUD, COAL, GLASS,
  OBSIDIAN, BASALT, STEAM, FIRE, PLANT, FLOWER, SPARK, KINTSUGI,
} from './materials.js';

// ─── 実験帳 (Practice Mode) ──────────────────────────────────────────────────
//
// シナリオとは別の練習モード。お題の化学反応ごとに小さな舞台を自動設置し、
// プレイヤーが素材を注いで反応を起こす。成功判定は「生成物のセル数が
// ベースラインから goal 以上増えたか」を毎フレーム数えるだけ —— 素材コードには
// 一切手を入れない汎用方式。成功したら約2秒の余韻ののち次のお題へ進む。

// ─── 舞台設置ヘルパー ────────────────────────────────────────────────────────

function set(e, x, y, type) { if (e.inBounds(x, y)) e.set(x, y, type); }

function fillRect(e, x0, y0, x1, y1, type) {
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) set(e, x, y, type);
}

function hLine(e, x0, x1, y, type) { for (let x = x0; x <= x1; x++) set(e, x, y, type); }
function vLine(e, x, y0, y1, type) { for (let y = y0; y <= y1; y++) set(e, x, y, type); }

// 舞台の基準座標（テストからも同じ式で参照する）
export function stageFrame(engine) {
  return {
    cx: Math.floor(engine.width / 2),
    y0: Math.floor(engine.height * 0.66), // 舞台の床の高さ
  };
}

// 壁の受け皿（床 + 左右の壁）
function basin(e, cx, y0, halfW, depth) {
  hLine(e, cx - halfW, cx + halfW, y0, WALL);
  vLine(e, cx - halfW, y0 - depth, y0, WALL);
  vLine(e, cx + halfW, y0 - depth, y0, WALL);
}

// ─── お題10題 ────────────────────────────────────────────────────────────────
// products: 数える生成物 / goal: 成功に必要な増分（ベースライン比）

export const DRILLS = [
  {
    id: 'steam', title: '蒸気', goal: 10, products: [STEAM],
    hint: '水の池に、火 [4] か溶岩 [6] を落とそう',
    done: '水は空へ還っていく',
    setup(e) {
      const { cx, y0 } = stageFrame(e);
      basin(e, cx, y0, 20, 6);
      fillRect(e, cx - 19, y0 - 4, cx + 19, y0 - 1, WATER);
    },
  },
  {
    id: 'burn', title: '燃焼', goal: 15, products: [FIRE],
    hint: '油の池に、火 [4] を一粒',
    done: '炎は油の上を走る',
    setup(e) {
      const { cx, y0 } = stageFrame(e);
      basin(e, cx, y0, 20, 6);
      fillRect(e, cx - 19, y0 - 3, cx + 19, y0 - 1, OIL);
    },
  },
  {
    id: 'stone', title: '石化', goal: 12, products: [STONE],
    hint: '溶岩に、水 [2] を注ごう',
    done: '岩は水と火のあいだに生まれる',
    setup(e) {
      const { cx, y0 } = stageFrame(e);
      basin(e, cx, y0, 20, 6);
      fillRect(e, cx - 19, y0 - 3, cx + 19, y0 - 1, LAVA);
    },
  },
  {
    id: 'glass', title: 'ガラス', goal: 8, products: [GLASS],
    hint: '砂の山に、雷 [t] を落とそう',
    done: '砂は光を透すものに変わった',
    setup(e) {
      const { cx, y0 } = stageFrame(e);
      hLine(e, cx - 24, cx + 24, y0, WALL);
      for (let dy = 0; dy < 9; dy++) {
        hLine(e, cx - (9 - dy), cx + (9 - dy), y0 - 1 - dy, SAND);
      }
    },
  },
  {
    id: 'obsidian', title: '黒曜石', goal: 8, products: [OBSIDIAN],
    hint: '溶岩を、氷 [o] か雪 [3] で急冷しよう',
    done: '漆黒の鏡石が残る',
    setup(e) {
      const { cx, y0 } = stageFrame(e);
      basin(e, cx, y0, 20, 6);
      fillRect(e, cx - 19, y0 - 3, cx + 19, y0 - 1, LAVA);
    },
  },
  {
    id: 'basalt', title: '玄武岩', goal: 8, products: [BASALT],
    hint: '泥の池に、溶岩 [6] を注ごう',
    done: '火山の島はこうしてできる',
    setup(e) {
      const { cx, y0 } = stageFrame(e);
      basin(e, cx, y0, 20, 6);
      fillRect(e, cx - 19, y0 - 3, cx + 19, y0 - 1, MUD);
    },
  },
  {
    id: 'sprout', title: '発芽', goal: 3, products: [PLANT, FLOWER],
    hint: '土の床に、種 [w] を蒔こう',
    done: '緑が目を覚ます',
    setup(e) {
      const { cx, y0 } = stageFrame(e);
      hLine(e, cx - 28, cx + 28, y0, WALL);
      fillRect(e, cx - 27, y0 - 3, cx + 6, y0 - 1, SOIL);
      // 右手に小さな水瓶（潤いの演出。発芽は土だけでも成立する）
      vLine(e, cx + 10, y0 - 5, y0 - 1, WALL);
      vLine(e, cx + 20, y0 - 5, y0 - 1, WALL);
      fillRect(e, cx + 11, y0 - 4, cx + 19, y0 - 1, WATER);
    },
  },
  {
    id: 'sumi', title: '墨', goal: 4, products: [MUD],
    hint: '水の池に、炭 [7] を沈めよう',
    done: '水は墨を含んだ。墨泥に種を蒔くと——',
    setup(e) {
      const { cx, y0 } = stageFrame(e);
      basin(e, cx, y0, 20, 6);
      fillRect(e, cx - 19, y0 - 4, cx + 19, y0 - 1, WATER);
    },
  },
  {
    id: 'spark', title: '感電', goal: 8, products: [SPARK],
    hint: '水面に、雷 [t] を落とそう',
    done: '水は一瞬、光の網になる',
    setup(e) {
      const { cx, y0 } = stageFrame(e);
      basin(e, cx, y0, 22, 6);
      fillRect(e, cx - 21, y0 - 4, cx + 21, y0 - 1, WATER);
    },
  },
  {
    id: 'kintsugi', title: '金継ぎ', goal: 3, products: [KINTSUGI],
    hint: '石の割れ目に、金 [n] を注ごう',
    done: '割れ目は、金の景色になった',
    setup(e) {
      const { cx, y0 } = stageFrame(e);
      hLine(e, cx - 14, cx + 14, y0, WALL);
      fillRect(e, cx - 10, y0 - 8, cx + 10, y0 - 1, STONE);
      vLine(e, cx, y0 - 8, y0 - 1, EMPTY);      // 割れ目（幅1）
      set(e, cx - 1, y0 - 8, EMPTY);            // 漏斗状の口
      set(e, cx + 1, y0 - 8, EMPTY);
    },
  },
];

// ─── モード制御 ──────────────────────────────────────────────────────────────

const CELEBRATE_FRAMES = 130; // 成功表示の余韻（約2秒 @ 60fps）

export class PracticeMode {
  // hooks: { onBar(text|null), onSuccess(), onFinish() } — DOM や音の配線は呼び出し側が持つ
  constructor(engine, hooks = {}) {
    this.engine   = engine;
    this.hooks    = hooks;
    this.active   = false;
    this.index    = 0;
    this.state    = 'idle'; // 'trying' | 'celebrate'
    this.baseline = 0;
    this.wait     = 0;
  }

  start() {
    this.active = true;
    this.index  = 0;
    this._load();
  }

  stop() {
    this.active = false;
    this.state  = 'idle';
    this.hooks.onBar?.(null);
  }

  skip() {
    if (!this.active) return;
    this._next();
  }

  step() {
    if (!this.active) return;
    if (this.state === 'celebrate') {
      if (--this.wait <= 0) this._next();
      return;
    }
    const d = DRILLS[this.index];
    if (this._count(d.products) - this.baseline >= d.goal) {
      this.state = 'celebrate';
      this.wait  = CELEBRATE_FRAMES;
      this.hooks.onBar?.(`⭕ 「${d.title}」成功 —— ${d.done}`);
      this.hooks.onSuccess?.();
    }
  }

  _load() {
    const d = DRILLS[this.index];
    this.engine.clear();
    d.setup(this.engine);
    this.baseline = this._count(d.products);
    this.state    = 'trying';
    this.hooks.onBar?.(`実験 ${this.index + 1}/${DRILLS.length} 「${d.title}」 — ${d.hint}`);
  }

  _next() {
    this.index++;
    if (this.index >= DRILLS.length) {
      this.active = false;
      this.state  = 'idle';
      this.hooks.onBar?.('—— 実験帳、皆伝。庭は自由に ——');
      this.hooks.onFinish?.();
      return;
    }
    this._load();
  }

  _count(products) {
    const cells = this.engine.cells;
    let n = 0;
    for (let i = 0; i < cells.length; i++) {
      if (products.includes(cells[i])) n++;
    }
    return n;
  }
}

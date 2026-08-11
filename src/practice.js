import {
  EMPTY, WALL, STONE, SAND, WATER, LAVA, SOIL, MUD, GLASS,
  OBSIDIAN, BASALT, STEAM, FIRE, PLANT, FLOWER, SPARK, KINTSUGI,
  ICE, LAVA_SPRING, HARD_SOIL,
} from './materials.js';

// ─── 実験帳 (Practice Mode) ──────────────────────────────────────────────────
//
// シナリオとは別の練習モード。お題の化学反応ごとに小さな「情景」を自動設置し、
// プレイヤーが素材を注いで反応を起こす。成功判定は「生成物のセル数が
// ベースラインから goal 以上増えたか」を毎フレーム数えるだけ —— 素材コードには
// 一切手を入れない汎用方式。成功したら約2秒の余韻ののち次のお題へ進む。
//
// 舞台は受け皿ではなく地形で作る: 草原・岩間の泉・溶岩の流れる山肌・砂丘・
// 火口・泥田・畑・池・石碑。フィールドの上で反応が「見えて分かる」ことを優先する。

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

// 庭の枠: 床 + 低い縁（液体の流出を留める）
function frame(e, cx, y0, halfW, lip = 2) {
  hLine(e, cx - halfW, cx + halfW, y0, WALL);
  vLine(e, cx - halfW, y0 - lip, y0, WALL);
  vLine(e, cx + halfW, y0 - lip, y0, WALL);
}

// 三角の山（砂丘・火山・畝に使う）。基部の半幅 = h
function mound(e, mx, baseY, h, mat) {
  for (let dy = 0; dy < h; dy++) {
    hLine(e, mx - (h - dy - 1), mx + (h - dy - 1), baseY - dy, mat);
  }
}

// 中央に窪みをもつ左右の岩の土手（泉・池の岸）
function rockyBanks(e, cx, y0, halfW, pondHalfW, maxH) {
  for (let x = cx - halfW + 1; x <= cx + halfW - 1; x++) {
    const d = Math.abs(x - cx);
    if (d <= pondHalfW) continue;
    const h = Math.min(maxH, 1 + Math.floor((d - pondHalfW) / 3));
    fillRect(e, x, y0 - h, x, y0 - 1, STONE);
  }
}

// ─── お題10題 ────────────────────────────────────────────────────────────────
// products: 数える生成物 / goal: 成功に必要な増分（ベースライン比）

export const DRILLS = [
  {
    id: 'wildfire', title: '野火', goal: 12, products: [FIRE],
    hint: '乾いた草原に、火 [4] を放とう',
    done: '炎は草を走り、あとに灰が残る',
    setup(e) {
      const { cx, y0 } = stageFrame(e);
      frame(e, cx, y0, 34);
      fillRect(e, cx - 33, y0 - 2, cx + 33, y0 - 1, SOIL);
      for (let x = cx - 31; x <= cx + 31; x++) {
        if (Math.random() < 0.30) continue; // 疎らな地肌を残す
        const h = 2 + Math.floor(Math.random() * 4);
        for (let dy = 1; dy <= h; dy++) set(e, x, y0 - 2 - dy, PLANT);
        if (Math.random() > 0.75) set(e, x, y0 - 3 - h, FLOWER);
      }
    },
  },
  {
    id: 'steam', title: '湯けむり', goal: 10, products: [STEAM],
    hint: '岩間の泉に、火 [4] か溶岩 [6] を沈めよう',
    done: '湯けむりが立ちのぼる',
    setup(e) {
      const { cx, y0 } = stageFrame(e);
      frame(e, cx, y0, 34);
      rockyBanks(e, cx, y0, 34, 12, 6);
      fillRect(e, cx - 11, y0 - 3, cx + 11, y0 - 1, WATER);
    },
  },
  {
    id: 'stone', title: '溶岩流', goal: 10, products: [STONE],
    hint: '山肌を流れる溶岩に、水 [2] を注ごう',
    done: '流れは、岩の段になって止まった',
    setup(e) {
      const { cx, y0 } = stageFrame(e);
      frame(e, cx, y0, 34, 8);
      // 左が高い赤土の山肌（固い土は溶岩に溶けない）。溶岩源泉が山頂から流し続ける
      for (let x = cx - 30; x <= cx + 8; x++) {
        const h = Math.max(1, Math.round(16 * (cx + 8 - x) / 38));
        fillRect(e, x, y0 - h, x, y0 - 1, HARD_SOIL);
      }
      set(e, cx - 30, y0 - 17, LAVA_SPRING);
      set(e, cx - 29, y0 - 17, LAVA_SPRING);
      // 最初から山肌を流れ下る溶岩の舌を1本敷いておく（情景がすぐ読める）
      for (let x = cx - 28; x <= cx - 6; x++) {
        const h = Math.max(1, Math.round(16 * (cx + 8 - x) / 38));
        set(e, x, y0 - h - 1, LAVA);
      }
    },
  },
  {
    id: 'glass', title: '雷とガラス', goal: 8, products: [GLASS],
    hint: '砂丘に、雷 [t] を落とそう',
    done: '雷の通り道が、ガラスの脈になった',
    setup(e) {
      const { cx, y0 } = stageFrame(e);
      frame(e, cx, y0, 34);
      fillRect(e, cx - 33, y0 - 2, cx + 33, y0 - 1, SAND);
      mound(e, cx - 16, y0 - 2, 8,  SAND);
      mound(e, cx + 2,  y0 - 2, 11, SAND);
      mound(e, cx + 20, y0 - 2, 6,  SAND);
    },
  },
  {
    id: 'obsidian', title: '火口', goal: 8, products: [OBSIDIAN],
    hint: '火口の溶岩に、氷 [o] を沈めよう',
    done: '火口は、漆黒の鏡石で蓋をされた',
    setup(e) {
      const { cx, y0 } = stageFrame(e);
      frame(e, cx, y0, 34);
      mound(e, cx, y0 - 1, 22, STONE);                      // 石の山体（溶岩に溶けない）
      fillRect(e, cx - 6, y0 - 22, cx + 6, y0 - 15, EMPTY); // 峰を大きくくり抜いてカルデラに
      fillRect(e, cx - 6, y0 - 14, cx + 6, y0 - 12, LAVA);  // 有限の火口湖39セル（深さ3）
      // 源泉は置かない: 溶岩が無限だと、できた黒曜石が下から再溶融して定着しないため
      // 深い湖なのは、氷を「沈める」と4面が同時に急冷されて黒曜石の収率が上がるため
    },
  },
  {
    id: 'basalt', title: '泥田', goal: 8, products: [BASALT],
    hint: '泥の田に、溶岩 [6] を注ごう',
    done: '泥は焼き締まり、玄武岩になった',
    setup(e) {
      const { cx, y0 } = stageFrame(e);
      frame(e, cx, y0, 34, 3);
      fillRect(e, cx - 33, y0 - 3, cx + 33, y0 - 1, SOIL);
      fillRect(e, cx - 16, y0 - 3, cx + 16, y0 - 1, MUD);
      fillRect(e, cx - 6, y0 - 3, cx - 5, y0 - 1, SOIL); // 畦（あぜ）
      fillRect(e, cx + 5, y0 - 3, cx + 6, y0 - 1, SOIL);
    },
  },
  {
    id: 'sprout', title: '畑', goal: 3, products: [PLANT, FLOWER],
    hint: '畝に、種 [w] を蒔こう',
    done: '畑に、緑が目を覚ます',
    setup(e) {
      const { cx, y0 } = stageFrame(e);
      frame(e, cx, y0, 34);
      fillRect(e, cx - 33, y0 - 3, cx + 33, y0 - 1, SOIL);
      for (let x = cx - 28; x <= cx + 8; x += 6) mound(e, x, y0 - 4, 2, SOIL); // 畝
      vLine(e, cx + 14, y0 - 4, y0 - 1, STONE);           // 石張りの水瓶
      vLine(e, cx + 24, y0 - 4, y0 - 1, STONE);
      fillRect(e, cx + 15, y0 - 3, cx + 23, y0 - 1, WATER);
    },
  },
  {
    id: 'freeze', title: '凍る池', goal: 10, products: [ICE],
    hint: '池に雪 [3] を降らせるか、氷 [o] を沈めよう',
    done: '池は、静かに凍りついた',
    setup(e) {
      const { cx, y0 } = stageFrame(e);
      frame(e, cx, y0, 34);
      rockyBanks(e, cx, y0, 34, 16, 4);
      fillRect(e, cx - 15, y0 - 3, cx + 15, y0 - 1, WATER);
    },
  },
  {
    id: 'spark', title: '雷鳴の池', goal: 8, products: [SPARK],
    hint: '水面に、雷 [t] を落とそう',
    done: '水は一瞬、光の網になる',
    setup(e) {
      const { cx, y0 } = stageFrame(e);
      frame(e, cx, y0, 34);
      rockyBanks(e, cx, y0, 34, 21, 3);
      fillRect(e, cx - 20, y0 - 3, cx + 20, y0 - 1, WATER);
      fillRect(e, cx - 9, y0 - 4, cx - 7, y0 - 1, STONE); // 水面から顔を出す岩
      fillRect(e, cx + 6, y0 - 4, cx + 8, y0 - 1, STONE);
    },
  },
  {
    id: 'kintsugi', title: '金継ぎ', goal: 3, products: [KINTSUGI],
    hint: '石碑の割れ目に、金 [n] を注ごう',
    done: '割れ目は、金の景色になった',
    setup(e) {
      const { cx, y0 } = stageFrame(e);
      frame(e, cx, y0, 34);
      fillRect(e, cx - 33, y0 - 2, cx + 33, y0 - 1, SAND);   // 砂庭
      fillRect(e, cx - 12, y0 - 4, cx + 12, y0 - 3, BASALT); // 台座
      fillRect(e, cx - 8, y0 - 13, cx + 8, y0 - 5, STONE);   // 石碑
      // 稲妻形の割れ目（幅2）を上から下へ刻む
      const wander = [0, 1, 2, 2, 1, 0, -1, -1, 0];
      wander.forEach((dx, i) => {
        set(e, cx + dx,     y0 - 13 + i, EMPTY);
        set(e, cx + dx + 1, y0 - 13 + i, EMPTY);
      });
      set(e, cx - 1, y0 - 13, EMPTY); // 注ぎ口を少し広げる
      set(e, cx + 2, y0 - 13, EMPTY);
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

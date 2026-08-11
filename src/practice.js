import {
  EMPTY, STONE, SAND, WATER, LAVA, SOIL, MUD, GLASS,
  OBSIDIAN, BASALT, STEAM, FIRE, PLANT, FLOWER, SPARK, KINTSUGI,
  ICE, LAVA_SPRING, HARD_SOIL,
} from './materials.js';

// ─── 実験帳 (Practice Mode) ──────────────────────────────────────────────────
//
// シナリオとは別の練習モード。お題の化学反応ごとに「画面全体の情景」を設置し、
// プレイヤーが素材を注いで反応を起こす。成功判定は「生成物のセル数が
// ベースラインから goal 以上増えたか」を毎フレーム数えるだけ —— 素材コードには
// 一切手を入れない汎用方式。成功したら約2秒の余韻ののち次のお題へ進む。
//
// 設計原則:
// - 舞台は画面の底から積み上げ、幅いっぱいに広げる（画面端が壁の役割をするので
//   枠は不要。空中の小さな受け皿は見づらい）
// - プレイヤーに置かせる素材は「落ちる・流れる」ものだけ（火・水・溶岩・雷・雪・
//   種・金）。氷のような固定素材は空中に貼り付いて反応できず、
//   「反応しているのに判定されない」体験になるため使わせない

// ─── 舞台設置ヘルパー ────────────────────────────────────────────────────────

function set(e, x, y, type) { if (e.inBounds(x, y)) e.set(x, y, type); }

function fillRect(e, x0, y0, x1, y1, type) {
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) set(e, x, y, type);
}

// 三角の山（砂丘・火山・畝に使う）。基部の半幅 = h
function mound(e, mx, baseY, h, mat) {
  for (let dy = 0; dy < h; dy++) {
    for (let x = mx - (h - dy - 1); x <= mx + (h - dy - 1); x++) set(e, x, baseY - dy, mat);
  }
}

// 舞台の基準座標（テストからも同じ式で参照する）
export function stageFrame(engine) {
  return {
    W: engine.width,
    H: engine.height,
    cx: Math.floor(engine.width / 2),
  };
}

// ─── お題10題 ────────────────────────────────────────────────────────────────
// products: 数える生成物 / goal: 成功に必要な増分（ベースライン比）

export const DRILLS = [
  {
    id: 'wildfire', title: '野火', goal: 12, products: [FIRE],
    hint: '乾いた草原に、火 [4] を放とう',
    done: '炎は草を走り、あとに灰が残る',
    setup(e) {
      const { W, H } = stageFrame(e);
      fillRect(e, 0, H - 3, W - 1, H - 1, SOIL);
      for (let x = 0; x <= W - 1; x++) {
        if (Math.random() < 0.30) continue; // 疎らな地肌を残す
        const h = 2 + Math.floor(Math.random() * 4);
        for (let dy = 1; dy <= h; dy++) set(e, x, H - 3 - dy, PLANT);
        if (Math.random() > 0.75) set(e, x, H - 4 - h, FLOWER);
      }
    },
  },
  {
    id: 'steam', title: '湯けむり', goal: 10, products: [STEAM],
    hint: '岩間の泉に、火 [4] か溶岩 [6] を沈めよう',
    done: '湯けむりが立ちのぼる',
    setup(e) {
      const { W, H, cx } = stageFrame(e);
      const pw = Math.floor(W * 0.15); // 泉の半幅
      fillRect(e, 0, H - 4, W - 1, H - 1, STONE);      // 地表は水面と同じ高さ（蓋にしない）
      mound(e, Math.floor(W * 0.15), H - 5, 5, STONE); // 岸の岩
      mound(e, Math.floor(W * 0.85), H - 5, 4, STONE);
      fillRect(e, cx - pw, H - 4, cx + pw, H - 2, WATER);
    },
  },
  {
    id: 'stone', title: '溶岩流', goal: 10, products: [STONE],
    hint: '山肌を流れる溶岩に、水 [2] を注ごう',
    done: '流れは、岩の段になって止まった',
    setup(e) {
      const { W, H } = stageFrame(e);
      const slopeR = Math.floor(W * 0.55);       // 山裾の右端
      const hMax   = Math.floor(H * 0.45);       // 山頂の高さ
      // 左が高い赤土の山肌（固い土は溶岩に溶けない）。右は開けた平地
      fillRect(e, 0, H - 2, W - 1, H - 1, HARD_SOIL);
      for (let x = 0; x <= slopeR; x++) {
        const h = Math.max(2, Math.round(hMax * (slopeR - x) / slopeR));
        fillRect(e, x, H - 1 - h, x, H - 1, HARD_SOIL);
      }
      // 山頂の溶岩源泉と、最初から流れ下る溶岩の舌
      set(e, 0, H - 2 - hMax, LAVA_SPRING);
      set(e, 1, H - 2 - hMax, LAVA_SPRING);
      for (let x = 2; x <= Math.floor(slopeR * 0.7); x++) {
        const h = Math.max(2, Math.round(hMax * (slopeR - x) / slopeR));
        set(e, x, H - 2 - h, LAVA);
      }
    },
  },
  {
    id: 'glass', title: '雷とガラス', goal: 8, products: [GLASS],
    hint: '砂丘に、雷 [t] を落とそう',
    done: '雷の通り道が、ガラスの脈になった',
    setup(e) {
      const { W, H } = stageFrame(e);
      fillRect(e, 0, H - 3, W - 1, H - 1, SAND);
      mound(e, Math.floor(W * 0.20), H - 3, Math.floor(H * 0.10), SAND);
      mound(e, Math.floor(W * 0.45), H - 3, Math.floor(H * 0.16), SAND);
      mound(e, Math.floor(W * 0.70), H - 3, Math.floor(H * 0.09), SAND);
      mound(e, Math.floor(W * 0.88), H - 3, Math.floor(H * 0.12), SAND);
    },
  },
  {
    id: 'obsidian', title: '火口', goal: 8, products: [OBSIDIAN],
    hint: '火口に、雪 [3] を降らせよう',
    done: '火口は、漆黒の鏡石で蓋をされた',
    setup(e) {
      const { W, H, cx } = stageFrame(e);
      // 台形の楯状火山。山頂に広く開けた溶岩湖を持つ
      // - 深い縦穴にしないのは、融け水が溜まって氷の栓ができ溶岩が密封されるため
      // - 縁の石は溶岩面と同じ高さ: 融け水は溜まらず山腹へ流れ落ちる
      const baseHW = Math.floor(W * 0.30);               // 山裾の半幅
      const topHW  = Math.max(14, Math.floor(W * 0.09)); // 山頂の半幅
      const vh     = Math.max(20, Math.floor(H * 0.28)); // 山の高さ
      fillRect(e, 0, H - 2, W - 1, H - 1, STONE);
      for (let dy = 0; dy < vh; dy++) {
        const hw = Math.round(baseHW + (topHW - baseHW) * (dy / (vh - 1)));
        for (let x = cx - hw; x <= cx + hw; x++) set(e, x, H - 2 - dy, STONE);
      }
      const lakeTop = H - 1 - vh; // 山頂の行 = 溶岩面
      fillRect(e, cx - (topHW - 2), lakeTop, cx + (topHW - 2), lakeTop + 2, LAVA);
      // 源泉は置かない: 溶岩が無限だと、できた黒曜石が下から再溶融して定着しないため
    },
  },
  {
    id: 'basalt', title: '泥田', goal: 8, products: [BASALT],
    hint: '泥の田に、溶岩 [6] を注ごう',
    done: '泥は焼き締まり、玄武岩になった',
    setup(e) {
      const { W, H } = stageFrame(e);
      fillRect(e, 0, H - 4, W - 1, H - 1, SOIL);
      // 2枚の泥田と畦（あぜ）
      fillRect(e, Math.floor(W * 0.12), H - 4, Math.floor(W * 0.44), H - 2, MUD);
      fillRect(e, Math.floor(W * 0.56), H - 4, Math.floor(W * 0.88), H - 2, MUD);
      fillRect(e, Math.floor(W * 0.27), H - 4, Math.floor(W * 0.28), H - 2, SOIL);
      fillRect(e, Math.floor(W * 0.71), H - 4, Math.floor(W * 0.72), H - 2, SOIL);
    },
  },
  {
    id: 'sprout', title: '畑', goal: 3, products: [PLANT, FLOWER],
    hint: '畝に、種 [w] を蒔こう',
    done: '畑に、緑が目を覚ます',
    setup(e) {
      const { W, H } = stageFrame(e);
      fillRect(e, 0, H - 4, W - 1, H - 1, SOIL);
      for (let x = 8; x <= Math.floor(W * 0.68); x += 8) mound(e, x, H - 5, 2, SOIL); // 畝
      const pL = Math.floor(W * 0.76), pR = Math.floor(W * 0.92);
      fillRect(e, pL, H - 6, pL, H - 1, STONE);   // 石張りの水瓶
      fillRect(e, pR, H - 6, pR, H - 1, STONE);
      fillRect(e, pL + 1, H - 5, pR - 1, H - 2, WATER);
    },
  },
  {
    id: 'freeze', title: '凍る池', goal: 10, products: [ICE],
    hint: '池に、雪 [3] を降らせよう',
    done: '池は、静かに凍りついた',
    setup(e) {
      const { W, H, cx } = stageFrame(e);
      const pw = Math.floor(W * 0.25);
      fillRect(e, 0, H - 4, W - 1, H - 1, STONE);      // 地表は水面と同じ高さ（蓋にしない）
      mound(e, Math.floor(W * 0.10), H - 5, 4, STONE);
      mound(e, Math.floor(W * 0.90), H - 5, 5, STONE);
      fillRect(e, cx - pw, H - 4, cx + pw, H - 2, WATER);
    },
  },
  {
    id: 'spark', title: '雷鳴の池', goal: 8, products: [SPARK],
    hint: '水面に、雷 [t] を落とそう',
    done: '水は一瞬、光の網になる',
    setup(e) {
      const { W, H } = stageFrame(e);
      fillRect(e, 0, H - 4, W - 1, H - 1, STONE);      // 地表は水面と同じ高さ（蓋にしない）
      fillRect(e, Math.floor(W * 0.10), H - 4, Math.floor(W * 0.90), H - 2, WATER);
      // 水面から顔を出す岩の小島
      fillRect(e, Math.floor(W * 0.34), H - 5, Math.floor(W * 0.36), H - 2, STONE);
      fillRect(e, Math.floor(W * 0.62), H - 5, Math.floor(W * 0.63), H - 2, STONE);
    },
  },
  {
    id: 'kintsugi', title: '金継ぎ', goal: 3, products: [KINTSUGI],
    hint: '石碑の割れ目に、金 [n] を注ごう',
    done: '割れ目は、金の景色になった',
    setup(e) {
      const { W, H, cx } = stageFrame(e);
      const mh  = Math.max(14, Math.floor(H * 0.10)); // 石碑の高さ（画面に応じて拡大）
      const mw  = Math.floor(mh * 0.8);               // 石碑の半幅
      const top = H - 5 - mh;                         // 石碑の天面の行
      fillRect(e, 0, H - 3, W - 1, H - 1, SAND);                  // 砂庭
      fillRect(e, cx - mw - 5, H - 5, cx + mw + 5, H - 4, BASALT); // 台座
      fillRect(e, cx - mw, top, cx + mw, H - 6, STONE);            // 石碑
      // 稲妻形の割れ目（幅2）を上から下へ刻む（ランダムウォーク、半幅の半分まで振れる）
      let dx = 0;
      const swing = Math.max(2, Math.floor(mw * 0.5));
      for (let i = 0; i < mh - 1; i++) {
        set(e, cx + dx,     top + i, EMPTY);
        set(e, cx + dx + 1, top + i, EMPTY);
        if (Math.random() < 0.5) {
          dx += Math.random() < 0.5 ? 1 : -1;
          dx = Math.max(-swing, Math.min(swing, dx));
        }
      }
      set(e, cx - 1, top, EMPTY); // 注ぎ口を少し広げる
      set(e, cx + 2, top, EMPTY);
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

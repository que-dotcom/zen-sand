import {
  EMPTY, WATER, WALL, LAVA, SOIL, SEED, PLANT, GLOW_FUNGUS,
  FLOWER, DARK_PLANT, DARK_FLOWER, METAL, MUD, OBSIDIAN, BASALT, SPRING, LAVA_SPRING,
  ACID, ICE, LIGHTNING, FIRE, OIL, COAL, SNOW, ASH, STEAM
} from './materials.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function set(engine, x, y, type) {
  if (engine.inBounds(x, y)) engine.set(x, y, type);
}

function fillRect(engine, x0, y0, x1, y1, type) {
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++)
      set(engine, x, y, type);
}

function hLine(engine, x0, x1, y, type) {
  for (let x = x0; x <= x1; x++) set(engine, x, y, type);
}

function vLine(engine, x, y0, y1, type) {
  for (let y = y0; y <= y1; y++) set(engine, x, y, type);
}

// ── 「最後の楽園」 layout ─────────────────────────────────────────────────────

export function loadLastParadise(engine) {
  engine.clear();

  const W  = engine.width;
  const H  = engine.height;
  const cx = Math.floor(W / 2);

  // ── Key coordinates ─────────────────────────────────────────────────────
  const iHW = Math.max(20, Math.floor(W * 0.13)); // island half-width
  const iL  = cx - iHW;
  const iR  = cx + iHW;

  const yWall   = Math.floor(H * 0.87); // bottom containment
  const yObsB   = Math.floor(H * 0.80); // obsidian bottom
  const yObsT   = Math.floor(H * 0.74); // obsidian top
  const yBslB   = yObsT - 1;            // basalt bottom
  const yBslT   = Math.floor(H * 0.52); // basalt top
  const ySoilB  = yBslT - 1;            // soil bottom
  const ySoilT  = yBslT - 4;            // soil top
  const yMtlT   = Math.floor(H * 0.36); // metal pillar top
  const yMtlB   = ySoilB;               // metal pillar bottom

  const chanTop = Math.floor(H * 0.16); // top of spring chamber
  const chanL   = iL - 5;               // outer-left channel wall
  const chanR   = iR + 5;               // outer-right channel wall

  const st = 3; // basalt shell thickness

  // ── 1. Bottom containment wall ──────────────────────────────────────────
  hLine(engine, 0, W - 1, yWall, WALL);

  // ── 2. OBSIDIAN base (ancient foundation) ───────────────────────────────
  fillRect(engine, iL + 2, yObsT, iR - 2, yObsB, OBSIDIAN);

  // ── 3. BASALT island (solid shell with hollow cave) ─────────────────────
  fillRect(engine, iL, yBslT, iR, yBslB, BASALT);
  // Hollow out cave interior
  fillRect(engine, iL + st, yBslT + st, iR - st, yBslB - st, EMPTY);

  // ── 4. GLOW_FUNGUS colony on cave ceiling ───────────────────────────────
  const caveCeilY = yBslT + st;
  for (let x = iL + st + 2; x <= iR - st - 2; x += 4) {
    set(engine, x, caveCeilY, GLOW_FUNGUS);
    if (Math.random() > 0.5) set(engine, x + 1, caveCeilY + 1, GLOW_FUNGUS);
  }

  // ── 5. SOIL on top of island ─────────────────────────────────────────────
  fillRect(engine, iL + 1, ySoilT, iR - 1, ySoilB, SOIL);
  // MUD patches to support plant growth
  for (let x = iL + 3; x <= iR - 3; x += 3) {
    set(engine, x, ySoilB, MUD);
  }

  // ── 6. SEEDS buried in soil ─────────────────────────────────────────────
  for (let x = iL + 5; x <= iR - 5; x += 7) {
    const sy = ySoilT + Math.floor(Math.random() * (ySoilB - ySoilT));
    set(engine, x, sy, SEED);
  }

  // ── 7. PLANTS and FLOWERS growing on soil ───────────────────────────────
  for (let x = iL + 6; x <= iR - 6; x += 6) {
    const ph = 3 + Math.floor(Math.random() * 5);
    for (let py = ySoilT - ph; py < ySoilT; py++) {
      set(engine, x, py, PLANT);
    }
    set(engine, x, ySoilT - ph - 1, FLOWER);
  }

  // ── 8. METAL pillars (supercooling + lightning chain targets) ────────────
  const mL = iL - 3;
  const mR = iR + 3;
  vLine(engine, mL, yMtlT, yMtlB, METAL);
  vLine(engine, mR, yMtlT, yMtlB, METAL);

  // ── 9. Water channel guides (outer walls) ───────────────────────────────
  hLine(engine, chanL, chanR, chanTop, WALL);          // top cap
  vLine(engine, chanL, chanTop, ySoilT - 1, WALL);    // left guide
  vLine(engine, chanR, chanTop, ySoilT - 1, WALL);    // right guide

  // ── 10. SPRING sources inside top chamber ───────────────────────────────
  const springY = chanTop + 1;
  for (let x = cx - 5; x <= cx + 5; x++) {
    set(engine, x, springY, SPRING);
  }

  // ── 11. Pre-fill WATER in side channels ─────────────────────────────────
  for (let y = chanTop + 2; y <= ySoilT - 1; y++) {
    for (let x = chanL + 1; x < mL; x++) {
      if (engine.inBounds(x, y) && engine.get(x, y) === EMPTY)
        engine.set(x, y, WATER);
    }
    for (let x = mR + 1; x < chanR; x++) {
      if (engine.inBounds(x, y) && engine.get(x, y) === EMPTY)
        engine.set(x, y, WATER);
    }
  }
  // Also fill water between metal and island sides
  for (let y = yMtlT; y <= ySoilT - 1; y++) {
    for (let x = mL + 1; x < iL; x++) {
      if (engine.inBounds(x, y) && engine.get(x, y) === EMPTY)
        engine.set(x, y, WATER);
    }
    for (let x = iR + 1; x <= mR - 1; x++) {
      if (engine.inBounds(x, y) && engine.get(x, y) === EMPTY)
        engine.set(x, y, WATER);
    }
  }
}

// ── 「凍った呪いの森」 layout ─────────────────────────────────────────────────

// ローカルカラーパレット（materials.js の private consts の複製）
const _DARK_STEM = [0x1A081A, 0x220A22, 0x2A0A2A, 0x300A30, 0x1E081E];
const _DARK_FLWR = [0xAA00BB, 0x990022, 0x440044, 0x001144, 0x220033];
const _STEM      = [0x2D5A1B, 0x3D7A25, 0x4A8A2C, 0x52A030, 0x5AB038];
const _FLOWER    = [0xFF6688, 0xFFDD44, 0xFF88BB, 0xFFEEEE, 0xFF9944, 0x99EEAA, 0xCC88FF, 0x88CCFF];
const META_DARK_BIT = 0x10; // META_DARK フラグ

function plantDark(engine, x, y, type) {
  if (!engine.inBounds(x, y)) return;
  const i = engine.idx(x, y);
  const pal = type === DARK_FLOWER ? _DARK_FLWR : _DARK_STEM;
  engine.cells[i]  = type;
  engine.colors[i] = pal[Math.floor(Math.random() * pal.length)];
  engine.meta[i]   = META_DARK_BIT;
}

function plantNormal(engine, x, y, type) {
  if (!engine.inBounds(x, y)) return;
  const i = engine.idx(x, y);
  const pal = type === FLOWER ? _FLOWER : _STEM;
  const ci  = Math.floor(Math.random() * pal.length);
  engine.cells[i]  = type;
  engine.colors[i] = pal[ci];
  engine.meta[i]   = type === FLOWER ? ci : 0;
}

export function loadFrozenCursedForest(engine) {
  engine.clear();

  const W  = engine.width;
  const H  = engine.height;

  // ── Key coordinates ────────────────────────────────────────────────────────
  const yWall  = Math.floor(H * 0.90);   // 底面ウォール
  const yBsltB = yWall - 1;              // 玄武岩 底
  const yBsltT = yWall - 3;              // 玄武岩 天（3セル厚）
  const ySoilB = yBsltT - 1;             // 土 底
  const ySoilT = ySoilB - 2;             // 土 天（3セル厚）
  const yGround = ySoilT;                // 植物の根元ライン

  const margin    = Math.floor(W * 0.02);
  const forestL   = margin;
  const forestR   = W - 1 - margin;
  const darkZoneW = Math.floor(W * 0.14); // 両端14%が呪われた暗黒域

  // ── 1. 底面ウォール ────────────────────────────────────────────────────────
  hLine(engine, 0, W - 1, yWall, WALL);

  // ── 2. 玄武岩基盤 ─────────────────────────────────────────────────────────
  fillRect(engine, forestL, yBsltT, forestR, yBsltB, BASALT);

  // ── 3. 泥層（植物の根が張れる肥沃な土台） ──────────────────────────────────
  hLine(engine, forestL, forestR, yBsltT - 1, MUD);

  // ── 4. 土層 ───────────────────────────────────────────────────────────────
  fillRect(engine, forestL, ySoilT, forestR, ySoilB, SOIL);

  // ── 5. 鬱蒼とした森（3層重ね）────────────────────────────────────────────
  //   背景層: 間隔6, 高さ10-16（大木）
  //   中間層: 間隔3, 高さ5-10（標準樹）
  //   前景層: 間隔2, 高さ2-5（低木・下草）

  const layers = [
    { step: 6, minH: 10, maxH: 16, offset: 0  },
    { step: 3, minH:  5, maxH: 10, offset: 1  },
    { step: 2, minH:  2, maxH:  5, offset: 0  },
  ];

  for (const { step, minH, maxH, offset } of layers) {
    for (let x = forestL + offset; x <= forestR; x += step) {
      const isEdge = x < forestL + darkZoneW || x > forestR - darkZoneW;

      // 暗黒域はやや低め・間引きでギザギザ感
      const localMin = isEdge ? Math.max(2, minH - 2) : minH;
      const localMax = isEdge ? Math.max(localMin + 1, maxH - 3) : maxH;
      const ph = localMin + Math.floor(Math.random() * (localMax - localMin + 1));

      // 暗黒域は30%でスキップ（疎な呪われた林）、通常域は15%でスキップ
      if (Math.random() < (isEdge ? 0.30 : 0.15)) continue;

      // 植物の茎
      for (let py = yGround - ph; py < yGround; py++) {
        if (!engine.inBounds(x, py)) continue;
        if (engine.get(x, py) !== EMPTY) continue; // 既存セルは上書きしない
        if (isEdge) {
          plantDark(engine, x, py, DARK_PLANT);
        } else {
          plantNormal(engine, x, py, PLANT);
        }
      }

      // 先端の花（60%で咲く）
      if (Math.random() > 0.40) {
        const flowerY = yGround - ph - 1;
        if (engine.inBounds(x, flowerY) && engine.get(x, flowerY) === EMPTY) {
          if (isEdge) {
            plantDark(engine, x, flowerY, DARK_FLOWER);
          } else {
            plantNormal(engine, x, flowerY, FLOWER);
          }
        }
      }
    }
  }

  // ── 6. 中央域の土中に種を埋める（雷で砕いた後の新芽用） ────────────────────
  const seedZoneL = forestL + darkZoneW + 3;
  const seedZoneR = forestR - darkZoneW - 3;
  for (let x = seedZoneL; x <= seedZoneR; x += 8) {
    set(engine, x, ySoilT + 1, SEED);
  }

  // ── 7. 暗黒域・通常域の境界に微量のOIL滲み出し（演出用・呪いの浸食の予兆） ─
  //   土の表面にごく少量、植物がないセルにのみ配置
  const borderL = forestL + darkZoneW;
  const borderR = forestR - darkZoneW;
  for (const bx of [borderL - 1, borderL, borderL + 1, borderR - 1, borderR, borderR + 1]) {
    if (engine.inBounds(bx, yGround) && engine.get(bx, yGround) === EMPTY) {
      set(engine, bx, yGround, OIL);
    }
  }
}

// ── Act trigger constants ─────────────────────────────────────────────────────
export const TRIGGERS = {
  ACID_USED:      'acid_used',
  ICE_USED:       'ice_used',
  LIGHTNING_USED: 'lightning_used',
  LAVA_USED:      'lava_used',
  FIRE_USED:      'fire_used',
  WATER_USED:     'water_used',
  OIL_USED:       'oil_used',
  COAL_USED:      'coal_used',
  PLANT_SPAWNED:  'plant_spawned', // エンジンイベント: 種が発芽した（プレイヤー入力不要）
};

// Material ID → trigger name mapping (プレイヤー入力ベース)
export const MATERIAL_TRIGGER_MAP = {
  [ACID]:      TRIGGERS.ACID_USED,
  [ICE]:       TRIGGERS.ICE_USED,
  [LIGHTNING]: TRIGGERS.LIGHTNING_USED,
  [LAVA]:      TRIGGERS.LAVA_USED,
  [FIRE]:      TRIGGERS.FIRE_USED,
  [WATER]:     TRIGGERS.WATER_USED,
  [OIL]:       TRIGGERS.OIL_USED,
  [COAL]:      TRIGGERS.COAL_USED,
};

// ── Scenarios ─────────────────────────────────────────────────────────────────
export const SCENARIOS = [
  {
    id:         'frozen_cursed_forest',
    title:      '凍った呪いの森',
    subtitle:   '呪い・結晶・解放の三幕劇',
    emoji:      '🌙',
    difficulty: '★★',
    load:       loadFrozenCursedForest,
    acts: [
      {
        trigger: null,
        hint: '美しい森だ。油を垂らして、呪いを解き放とう。  [5] キー',
      },
      {
        trigger: TRIGGERS.OIL_USED,
        hint: '闇が広がる！ 氷で封じ込めよう。  [o] キー',
      },
      {
        trigger: TRIGGERS.ICE_USED,
        hint: '凍った呪いの森。雷で砕くか [t]、永遠に眺めるか。',
      },
    ],
  },
  {
    id:       'last_paradise',
    title:    '最後の楽園',
    subtitle: '汚染・封印・再生の三幕劇',
    emoji:    '🌋',
    difficulty: '★★★',
    load:     loadLastParadise,
    acts: [
      {
        trigger: null,
        hint: '楽園が広がっている。酸を一滴、落としてみよう。  [u] キー',
      },
      {
        trigger: TRIGGERS.ACID_USED,
        hint: '汚染が広がる！ 氷で封印しよう。  [o] キー',
      },
      {
        trigger: TRIGGERS.ICE_USED,
        hint: '氷河期が訪れた。審判の雷を落とそう。  [t] キー',
      },
      {
        trigger: TRIGGERS.LIGHTNING_USED,
        hint: '氷が割れ始めた。溶岩を解放しよう。  [6] キー',
      },
      {
        trigger: TRIGGERS.LAVA_USED,
        hint: '—— 再生 ——',
      },
    ],
  },
];

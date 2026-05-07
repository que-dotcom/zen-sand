// ─── Material IDs ─────────────────────────────────────────────────────────────
export const EMPTY       = 0;
export const SAND        = 1;
export const WATER       = 2;
export const WALL        = 3;
export const SNOW        = 4;
export const FIRE        = 5;
export const OIL         = 6;
export const LAVA        = 7;
export const SMOKE       = 8;
export const ASH         = 9;
export const COAL        = 10;
export const STONE       = 11;
export const GLASS       = 12;
export const SOIL        = 13;
export const SEED        = 14;
export const PLANT       = 15;
export const DARK_PLANT  = 16;
export const FUNGUS      = 17;
export const GLOW_FUNGUS = 18;
export const FLOWER      = 19;
export const DARK_FLOWER = 20;
export const METAL       = 21;
export const LIGHTNING   = 22;
export const SPARK       = 23;
export const RUST        = 24;
export const STEAM       = 25;
export const ACID        = 26;
export const MUD         = 27;
export const ICE         = 28;
export const HARD_SOIL   = 29; // 静的な土（描画スタイル）
export const ACID_PLANT  = 30; // 酸変異植物（感染する腐食林）
export const OBSIDIAN    = 31; // 黒曜石（LAVA+ICE/SNOW 急冷）
export const SANDSTONE   = 32; // 砂岩（LAVA+SAND 変成）
export const BASALT      = 33; // 玄武岩（LAVA+MUD 火山岩）
export const SPRING      = 34; // 水源（永久に水を湧き出す静的素材）
export const LAVA_SPRING = 35; // 溶岩源泉（永久に溶岩を湧き出す静的素材）

// ─── 侘び寂び (Wabi-Sabi) elements ────────────────────────────────────────────
export const SAKURA_SEED  = 36; // 桜の種（発芽→桜の木）
export const SAKURA_TREE  = 37; // 桜の木（成長・開花・散花の3フェーズ）
export const SAKURA_PETAL = 38; // 花びら（ヒラヒラと舞い落ちる）
export const FIREFLY      = 39; // 蛍（植物+水から自然発生・明滅）
export const POLLEN       = 40; // 花粉（逆重力型・遺伝子を運ぶ大気搬送粒子）
export const MA_VOID      = 41; // 間（封じられた聖域・空白の力）
export const KOI          = 42; // 鯉（水中を泳ぐ自律エージェント）

// ─── Plant meta encoding (Uint8) ──────────────────────────────────────────────
// bits 0-2: flower color index (0-7)
// bit  3  : size flag (0=small, 1=large)
// bit  4  : dark flag (0=normal, 1=dark)
// bit  5  : lotus flag (MUD-grown plant)
const META_COLOR = 0x07;
const META_LARGE = 0x08;
const META_DARK  = 0x10;
const META_LOTUS = 0x20;
const META_ICE_CRYSTAL = 0x40; // bit6: 氷晶フラグ（暗黒植物+氷で結晶化）
const META_DORMANT     = 0x80; // bit7: 冬眠フラグ（種+氷で封印→溶解で一斉発芽）

const LOTUS_COLORS    = [0xFF99CC,0xFFCCFF,0xCC88FF,0xFFEEAA,0x88DDFF,0xAAFFDD,0xFF77AA,0xDDAAFF];
const LOTUS_CENTER    = 0xFFFF44;
const LOTUS_STEM_COLS = [0x1A4A2A,0x2A5A32,0x3A6A3A,0x1E3A26,0x224A2E];

const FLOWER_COLORS  = [0xFF6688, 0xFFDD44, 0xFF88BB, 0xFFEEEE, 0xFF9944, 0x99EEAA, 0xCC88FF, 0x88CCFF];
const DARK_F_COLORS  = [0xAA00BB, 0x990022, 0x440044, 0x001144, 0x220033, 0x004422, 0x550000, 0x330044];
const STEM_COLORS    = [0x2D5A1B, 0x3D7A25, 0x4A8A2C, 0x52A030, 0x5AB038];
const DARK_STEM_COLS = [0x1A081A, 0x220A22, 0x2A0A2A, 0x300A30, 0x1E081E];
const FLOWER_CENTER  = 0xFFFF99; // stamen
const DARK_F_CENTER  = 0x220022;
const ICE_CRYSTAL_STEM   = [0x001A33, 0x002244, 0x003355, 0x001528, 0x002030];
const ICE_CRYSTAL_FLOWER = [0xAAEEFF, 0x88DDFF, 0xCCF8FF, 0x77CCEE, 0xBBEEFF];
const ICE_CRYSTAL_CENTER = 0xEEFFFF;
const ACID_STEM_COLS   = [0x4A8000, 0x3A6600, 0x5A9900, 0x2E5200, 0x668800];
const ACID_FLOWER_COLS = [0xAAFF00, 0x88EE00, 0xCCFF22, 0x66CC00, 0xBBFF44];
const ACID_F_CENTER    = 0x1A2200;

// ─── Wabi-Sabi color palettes ─────────────────────────────────────────────────
// 桜の幹・枝・開花・散花・花びら・種
const SAKURA_TRUNK_COLS  = [0x3D1A08, 0x4A220E, 0x2D1206, 0x5A2A12, 0x3A1808];
const SAKURA_BRANCH_COLS = [0x7A3518, 0x8A4020, 0x6A2C14, 0x904528, 0x6E3010];
const SAKURA_BLOOM_COLS  = [0xFFB7C5, 0xFF9DB5, 0xFFCCD5, 0xFFAABB, 0xFFC8D8, 0xFF8BAE];
const SAKURA_FADE_COLS   = [0xFFE8EE, 0xFFDDE5, 0xFFF0F5, 0xFFE4EC];
const SAKURA_PETAL_COLS  = [0xFFCCDD, 0xFFBBCC, 0xFFD5E5, 0xFFB0C8, 0xFFC0D0, 0xFFE8F2];
const YUKIZAKURA_PETAL_COLS = [0xFFF0F8, 0xF8F0FF, 0xF0EEFF, 0xFFF8FF, 0xE8F0FF, 0xF5F8FF]; // ① 雪桜: 白銀・淡青白
const SAKURA_SEED_COLS   = [0xC0784E, 0xAA6040, 0xD08858, 0xB87050, 0xC87848];
// 蛍（動的に書き換えるのでデフォルト色のみ）
const FIREFLY_COLS = [0xFFFF44, 0xFFEE22, 0xFFFF66, 0xFFF020, 0xFFEE44];
// 花粉
const POLLEN_COLS  = [0xFFEE44, 0xFFDD22, 0xFFEE66, 0xFFCC00, 0xFFEE88, 0xFFDD55];
// 間（MA_VOID）: 背景(0x0A0A0A)とわずかに異なる幽玄な暗色
const MA_VOID_COLS = [0x08080C, 0x090910, 0x07070A, 0x0A0A0E, 0x080A0D];
// 鯉（KOI）: 錦鯉カラー（白・赤・黒・橙のバリエーション）
const KOI_COLS = [0xFFFFFF, 0xEEEEEE, 0xEE3322, 0xDD2211, 0x111111, 0x222222, 0xFF6600];
// 鯉の移動方向テーブル（8方向、インデックス 0-7）
//   0:[上] 1:[右上] 2:[右] 3:[右下] 4:[下] 5:[左下] 6:[左] 7:[左上]
const KOI_DIRS = [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
// 鯉のボディ（KOI_BODY）: パレット非表示・内部専用素材
// KOI（頭）が移動するたびに周囲の WATER を KOI_BODY で塗り直す
// → 3x3 の視覚的集合体として「錦鯉ブロック」を表現する
const KOI_BODY = 43;

// ─── POLLEN meta エンコーディング ────────────────────────────────────────────
// bits 0-2 (0x07): 遺伝子カラーインデックス（0-7、FLOWER_COLORS のインデックスに対応）
//                  META_COLOR(0x07) と同じビット位置 → FLOWER の meta から直接継承可能
// bit  3   (0x08): 暗変異フラグ（DARK_FLOWER 由来なら 1）
// bit  4   (0x10): ドリフト方向（0=左、1=右）
// bits 5-7 (0xE0): 寿命カウンタ（0-7、0.8%/frame でデクリメント、0で消滅）
//
// 注意: SAKURA_PETAL の META_PETAL_FROZEN(0x80) は POLLEN には無関係（別素材）
//       FLOWER/PLANT の META_COLOR(0x07) と bit レイアウトが揃っているのは意図的
// ─────────────────────────────────────────────────────────────────────────────
const POLLEN_GENE       = 0x07; // bits 0-2: 遺伝子インデックス
const POLLEN_DARK       = 0x08; // bit  3:   暗変異フラグ
const POLLEN_DRIFT      = 0x10; // bit  4:   ドリフト方向（0=左、1=右）
const POLLEN_LIFE       = 0xE0; // bits 5-7: 寿命
const POLLEN_LIFE_SHIFT = 5;    // bits 5-7 へのシフト量

// ─── フェーズ1 SOIL / MUD meta 値の割り当て ────────────────────────────────────
// 純粋な数値（ビット演算なし）。素材ごとに独立した意味を持つ。
//
// SOIL:
//   0                = 通常
//   META_SOIL_PETAL  = 落花の恵み（桜の花びらが土に還った肥沃土）
//
// MUD:
//   0               = 通常
//   1               = 既存: 灰+水 肥沃（updateSeed の === 1 チェックで参照）
//   META_MUD_SUMI   = 墨水（炭+水）。この泥の上で種が発芽するとDARK_PLANTになる
//   META_MUD_PETAL  = 落花の恵み（桜の花びらが泥に還った肥沃泥）
//
// 衝突チェック: 既存の === 1 は MUD の肥沃フラグ専用。2/3/4 は未使用なので安全。
// ─────────────────────────────────────────────────────────────────────────────
const META_SOIL_PETAL = 4; // SOIL: 花びら由来の肥沃
const META_MUD_SUMI   = 2; // MUD:  墨水（炭+水）
const META_MUD_PETAL  = 3; // MUD:  花びら由来の肥沃
// SAKURA_PETAL:
//   bit  7 (0x80) = META_PETAL_FROZEN: 氷封フラグ（ICE接触で立つ、FIRE/LAVA/解氷で解除）
//   bits 0-6      = 残り寿命（最大79 = 0x4F → bit 7 は通常 0。衝突なし）
const META_PETAL_FROZEN = 0x80;

// ─── Combustion update functions ───────────────────────────────────────────────

function updateSand(engine, x, y) {
  const below = engine.get(x, y + 1);
  if (below === EMPTY || below === WATER || below === OIL) { engine.swap(x, y, x, y + 1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  const dA = engine.get(x + dir, y + 1), dB = engine.get(x - dir, y + 1);
  if (dA === EMPTY || dA === WATER || dA === OIL) { engine.swap(x, y, x + dir, y + 1); return; }
  if (dB === EMPTY || dB === WATER || dB === OIL) { engine.swap(x, y, x - dir, y + 1); return; }
  // Lava contact → sandstone（間接的な熱変成岩）
  if (Math.random() > 0.985) {
    const nb = [engine.get(x,y+1), engine.get(x,y-1), engine.get(x+1,y), engine.get(x-1,y)];
    if (nb.includes(LAVA)) engine.set(x, y, SANDSTONE);
  }
  // Sand + Water/Mud → MUD (slow ooze)
  if (Math.random() > 0.997) {
    const nb4s = [[0,1],[1,0],[-1,0],[0,-1]];
    for (const [dx,dy] of nb4s) {
      const sn = engine.get(x+dx, y+dy);
      if (sn === WATER || sn === MUD) { engine.set(x, y, MUD); return; }
    }
  }
}

function updateWater(engine, x, y) {
  const below = engine.get(x, y + 1);
  if (below === EMPTY || below === OIL) { engine.swap(x, y, x, y + 1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x + dir, y + 1) === EMPTY) { engine.swap(x, y, x + dir, y + 1); return; }
  if (engine.get(x - dir, y + 1) === EMPTY) { engine.swap(x, y, x - dir, y + 1); return; }
  if (engine.get(x + dir, y)     === EMPTY) { engine.swap(x, y, x + dir, y);     return; }
  if (engine.get(x - dir, y)     === EMPTY) { engine.swap(x, y, x - dir, y);     return; }
  // Slowly convert adjacent sand → soil
  if (Math.random() > 0.997) {
    const check = [[0,1],[1,0],[-1,0]];
    for (const [dx,dy] of check) {
      if (engine.get(x+dx, y+dy) === SAND) { engine.set(x+dx, y+dy, SOIL); break; }
    }
  }
  // Water + Snow/Ice → ICE (slow freeze)
  if (Math.random() > 0.997) {
    const nb4w = [[0,1],[1,0],[-1,0],[0,-1]];
    for (const [dx,dy] of nb4w) {
      const wn = engine.get(x+dx, y+dy);
      if (wn === SNOW || wn === ICE) { engine.set(x, y, ICE); return; }
    }
  }
}

function updateSnow(engine, x, y) {
  if (Math.random() > 0.45) return;
  const below = engine.get(x, y + 1);
  if (below === EMPTY) { engine.swap(x, y, x, y + 1); return; }
  if (below === WATER || below === LAVA) { engine.set(x, y, WATER); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x + dir, y + 1) === EMPTY) { engine.swap(x, y, x + dir, y + 1); return; }
  if (engine.get(x - dir, y + 1) === EMPTY) { engine.swap(x, y, x - dir, y + 1); return; }
  if (Math.random() > 0.88 && engine.get(x + dir, y) === EMPTY) engine.swap(x, y, x + dir, y);
}

function updateFire(engine, x, y) {
  if (Math.random() > 0.6) return;
  if (Math.random() > 0.75 && engine.get(x, y - 1) === EMPTY) engine.set(x, y - 1, SMOKE);

  const nbDirs = [[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1]];
  for (const [dx, dy] of nbDirs) {
    const n = engine.get(x+dx, y+dy);
    if (n === OIL        && Math.random() > 0.08) { engine.set(x+dx, y+dy, FIRE);  }
    if (n === COAL       && Math.random() > 0.94) { engine.set(x+dx, y+dy, FIRE);  }
    if (n === SNOW       && Math.random() > 0.50) { engine.set(x+dx, y+dy, WATER); }
    if (n === PLANT      && Math.random() > 0.40) { engine.set(x+dx, y+dy, FIRE);  }
    if (n === DARK_PLANT && Math.random() > 0.20) { engine.set(x+dx, y+dy, FIRE);  }
    if (n === ACID_PLANT && Math.random() > 0.20) { engine.set(x+dx, y+dy, FIRE);  }
    if (n === FLOWER      && Math.random() > 0.50) { engine.set(x+dx, y+dy, FIRE);  }
    if (n === DARK_FLOWER && Math.random() > 0.30) { engine.set(x+dx, y+dy, FIRE);  }
    if (n === SAKURA_TREE  && Math.random() > 0.40) { engine.set(x+dx, y+dy, FIRE);  }
    if (n === SAKURA_PETAL && Math.random() > 0.55) { engine.set(x+dx, y+dy, EMPTY); }
    if (n === FUNGUS      && Math.random() > 0.50) { engine.set(x+dx, y+dy, EMPTY); }
    if (n === GLOW_FUNGUS&& Math.random() > 0.50) { engine.set(x+dx, y+dy, EMPTY); }
    if (n === WATER && Math.random() > 0.55) {
      if (Math.random() > 0.5) { engine.set(x, y, STEAM); engine.meta[engine.idx(x,y)] = 0; }
      else { engine.set(x, y, SMOKE); }
      engine.updated[engine.idx(x,y)] = 1; return;
    }
  }

  const up = engine.get(x, y - 1);
  if (up === EMPTY || up === SMOKE) { engine.swap(x, y, x, y - 1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x+dir, y-1) === EMPTY) { engine.swap(x, y, x+dir, y-1); return; }
  if (engine.get(x-dir, y-1) === EMPTY) { engine.swap(x, y, x-dir, y-1); return; }
  if (Math.random() > 0.93) engine.set(x, y, Math.random() > 0.45 ? ASH : EMPTY);
}

function updateOil(engine, x, y) {
  // 凍結オイル: ICEが隣接していれば固まって動かない
  const nb4oil = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4oil) {
    if (engine.get(x+dx, y+dy) === ICE) return;
  }
  if (engine.get(x, y-1) === WATER) { engine.swap(x, y, x, y-1); return; }
  const below = engine.get(x, y+1);
  if (below === EMPTY) { engine.swap(x, y, x, y+1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x+dir, y+1) === EMPTY) { engine.swap(x, y, x+dir, y+1); return; }
  if (engine.get(x-dir, y+1) === EMPTY) { engine.swap(x, y, x-dir, y+1); return; }
  if (engine.get(x+dir, y)   === EMPTY) { engine.swap(x, y, x+dir, y);   return; }
  if (engine.get(x-dir, y)   === EMPTY) { engine.swap(x, y, x-dir, y);   return; }
  const check = [[0,-1],[1,0],[-1,0],[0,1],[1,-1],[-1,-1]];
  for (const [dx,dy] of check) {
    const n = engine.get(x+dx, y+dy);
    if ((n === FIRE || n === LAVA) && Math.random() > 0.05) { engine.set(x, y, FIRE); return; }
  }
}

function updateLava(engine, x, y) {
  if (Math.random() > 0.4) return;
  const nbDirs = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nbDirs) {
    const n = engine.get(x+dx, y+dy);
    if (n === WATER) { engine.set(x, y, STONE); engine.set(x+dx, y+dy, STEAM); engine.meta[engine.idx(x+dx,y+dy)] = 0; return; }
    if (n === ICE)   { engine.set(x, y, OBSIDIAN); engine.set(x+dx, y+dy, STEAM); engine.meta[engine.idx(x+dx,y+dy)] = 0; return; } // 急冷→黒曜石
    if (n === SNOW)  { engine.set(x, y, OBSIDIAN); engine.set(x+dx, y+dy, STEAM); engine.meta[engine.idx(x+dx,y+dy)] = 0; return; } // 雪でも急冷→黒曜石
    if (n === OIL  && Math.random() > 0.3)  { engine.set(x+dx, y+dy, FIRE); }
    if ((n === PLANT || n === DARK_PLANT || n === DARK_FLOWER || n === FLOWER || n === ACID_PLANT || n === SAKURA_TREE) && Math.random() > 0.2) {
      engine.set(x+dx, y+dy, FIRE);
    }
    if (n === SAKURA_PETAL) engine.set(x+dx, y+dy, EMPTY);
  }
  if (engine.get(x, y+1) === SAND && Math.random() > 0.97) engine.set(x, y+1, GLASS);
  const below = engine.get(x, y+1);
  if (below === EMPTY) { engine.swap(x, y, x, y+1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x+dir, y+1) === EMPTY) { engine.swap(x, y, x+dir, y+1); return; }
  if (engine.get(x-dir, y+1) === EMPTY) { engine.swap(x, y, x-dir, y+1); return; }
  if (engine.get(x+dir, y)   === EMPTY) { engine.swap(x, y, x+dir, y);   return; }
  if (engine.get(x-dir, y)   === EMPTY) { engine.swap(x, y, x-dir, y);   return; }
}

function updateSmoke(engine, x, y) {
  const i = engine.idx(x, y);
  if (Math.random() > 0.5) return;
  // 酸性スモッグ: ACID隣接で汚染フラグをセット
  const nb4smk = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4smk) {
    if (engine.get(x+dx, y+dy) === ACID) { engine.meta[i] = 1; break; }
  }
  // 酸性スモッグ: 隣接する種を枯らす（農業の天敵）
  if (engine.meta[i] === 1) {
    for (const [dx,dy] of nb4smk) {
      if (engine.get(x+dx, y+dy) === SEED && Math.random() > 0.96) {
        engine.set(x+dx, y+dy, ASH);
      }
    }
  }
  const up = engine.get(x, y-1);
  if (up === EMPTY) { engine.swap(x, y, x, y-1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x+dir, y-1) === EMPTY) { engine.swap(x, y, x+dir, y-1); return; }
  if (engine.get(x-dir, y-1) === EMPTY) { engine.swap(x, y, x-dir, y-1); return; }
  if (engine.get(x+dir, y)   === EMPTY) { engine.swap(x, y, x+dir, y);   return; }
  if (engine.get(x-dir, y)   === EMPTY) { engine.swap(x, y, x-dir, y);   return; }
  // 消滅率: 通常 4%/frame → 酸性スモッグ 1%/frame（滞留）
  const evapRate = engine.meta[i] === 1 ? 0.99 : 0.96;
  if (Math.random() > evapRate) engine.set(x, y, EMPTY);
}

function updateAsh(engine, x, y) {
  const nb = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb) {
    const n = engine.get(x+dx, y+dy);
    if (n === WATER) {
      // 雨水が灰を溶かして肥沃な泥に変換（焼き畑農法の核心演出）
      if (Math.random() > 0.97) {
        const i = engine.idx(x, y);
        engine.cells[i] = MUD;
        engine.meta[i]  = 1; // 肥沃フラグ（発芽率6倍）
        return;
      }
      return;
    }
    if (n === ICE) return; // 氷結灰: ICE隣接で固体化（移動停止）
    // 肥沃化: 灰がMUDに隣接 → MUDにフラグをセット（焼き畑農法）
    if (n === MUD && Math.random() > 0.97) {
      engine.meta[engine.idx(x+dx, y+dy)] = 1;
    }
  }
  // 風散布: FIRE/SMOKEが近くにあると上昇・横ドリフト（焼き畑演出）
  {
    let nearHeat = false;
    for (const [dx,dy] of nb) {
      const n = engine.get(x+dx, y+dy);
      if (n === FIRE || n === SMOKE) { nearHeat = true; break; }
    }
    if (nearHeat) {
      if (Math.random() > 0.85 && engine.get(x, y-1) === EMPTY) { engine.swap(x, y, x, y-1); return; } // 上昇気流
      if (Math.random() > 0.90) {
        const d = Math.random() > 0.5 ? 1 : -1;
        if (engine.get(x+d, y) === EMPTY) { engine.swap(x, y, x+d, y); return; } // 横ドリフト
      }
    }
  }
  if (Math.random() > 0.35) return;
  const below = engine.get(x, y+1);
  if (below === EMPTY || below === WATER) { engine.swap(x, y, x, y+1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x+dir, y+1) === EMPTY) { engine.swap(x, y, x+dir, y+1); return; }
  if (engine.get(x-dir, y+1) === EMPTY) { engine.swap(x, y, x-dir, y+1); return; }
}

function updateCoal(engine, x, y) {
  const below = engine.get(x, y+1);
  if (below === EMPTY || below === WATER) { engine.swap(x, y, x, y+1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  const dA = engine.get(x+dir, y+1), dB = engine.get(x-dir, y+1);
  if (dA === EMPTY || dA === WATER) { engine.swap(x, y, x+dir, y+1); return; }
  if (dB === EMPTY || dB === WATER) { engine.swap(x, y, x-dir, y+1); return; }
  const check = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of check) {
    const n = engine.get(x+dx, y+dy);
    if ((n === FIRE || n === LAVA) && Math.random() > 0.985) { engine.set(x, y, FIRE); return; }
  }
  // ⑥ 墨水 (Sumi-e Water): 炭が水に浸かると 0.3%/frame で墨色の泥(MUD)に変化
  // meta = META_MUD_SUMI(2) を立てる → この泥の上で種が発芽するとDARK_PLANTになる
  if (Math.random() > 0.997) {
    for (const [dx,dy] of check) {
      if (engine.get(x+dx, y+dy) === WATER) {
        const mi = engine.idx(x, y);
        engine.cells[mi]  = MUD;
        engine.colors[mi] = 0x111111; // 墨色（炭が水に溶けた濃い黒）
        engine.meta[mi]   = META_MUD_SUMI; // = 2
        return;
      }
    }
  }
}

// ─── Life & growth update functions ──────────────────────────────────────────

function updateSoil(engine, x, y) {
  // 砂と同じ重力挙動（落下・積み上げ）
  const below = engine.get(x, y+1);
  if (below === EMPTY || below === WATER) { engine.swap(x, y, x, y+1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  const dA = engine.get(x+dir, y+1), dB = engine.get(x-dir, y+1);
  if (dA === EMPTY || dA === WATER) { engine.swap(x, y, x+dir, y+1); return; }
  if (dB === EMPTY || dB === WATER) { engine.swap(x, y, x-dir, y+1); return; }
}

function updateSeed(engine, x, y) {
  // Fall like sand
  const below = engine.get(x, y+1);
  if (below === EMPTY || below === WATER) { engine.swap(x, y, x, y+1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  const dA = engine.get(x+dir, y+1), dB = engine.get(x-dir, y+1);
  if (dA === EMPTY || dA === WATER) { engine.swap(x, y, x+dir, y+1); return; }
  if (dB === EMPTY || dB === WATER) { engine.swap(x, y, x-dir, y+1); return; }

  const iSeed    = engine.idx(x, y);
  const isDormant = (engine.meta[iSeed] & META_DORMANT) !== 0;

  // 氷晶発芽: 半径3以内にICEがあれば冬眠封印。ICEが一掃されたら99%一斉大型発芽
  {
    const ICE_RADIUS = 3;
    let nearIce = false;
    outer: for (let dy = -ICE_RADIUS; dy <= ICE_RADIUS; dy++) {
      for (let dx = -ICE_RADIUS; dx <= ICE_RADIUS; dx++) {
        if (dx === 0 && dy === 0) continue;
        if (engine.get(x+dx, y+dy) === ICE) { nearIce = true; break outer; }
      }
    }
    if (nearIce) {
      if (!isDormant) {
        engine.meta[iSeed] |= META_DORMANT;
        engine.colors[iSeed] = 0xB0D8E8; // 青白い冬眠色
      }
      return; // 封印中は発芽しない
    }
  }

  const belowMeta    = engine.meta[engine.idx(x, y+1)];
  const isFertileMud = (below === MUD  && belowMeta === 1);                        // 既存: 灰+水 肥沃
  const isSumiMud    = (below === MUD  && belowMeta === META_MUD_SUMI);            // ⑥ 墨水 → DARK_PLANT化
  const isPetalFert  = (below === MUD  && belowMeta === META_MUD_PETAL) ||         // ② 落花の恵み（泥）
                       (below === SOIL && belowMeta === META_SOIL_PETAL);          // ② 落花の恵み（土）
  // 優先順: 冬眠明け=99% > 灰肥沃=24% > 花びら肥沃=18% > 通常MUD=8% > 通常=4%
  const germRate = isDormant ? 0.01
    : isFertileMud  ? 0.24
    : isPetalFert   ? 0.18
    : (below === MUD ? 0.08 : 0.04);
  if (Math.random() > germRate) return;

  // Heat kills seed（冬眠種は熱に耐える — 氷河期の力で押しのける）
  if (!isDormant) {
    const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
    for (const [dx,dy] of nb4) {
      const n = engine.get(x+dx, y+dy);
      if (n === FIRE || n === LAVA) { engine.set(x, y, ASH); return; }
    }
  }

  // ★ 冬眠明け大爆発: 溶岩も押しのけて半径6の巨大開花
  if (isDormant) {
    const colorIdx = Math.floor(Math.random() * 8);
    const burstMeta = colorIdx | META_LARGE | META_LOTUS; // 大型蓮スタイルの巨大花
    const burstR = 6;
    for (let bdy = -burstR; bdy <= burstR; bdy++) {
      for (let bdx = -burstR; bdx <= burstR; bdx++) {
        const dist2 = bdx*bdx + bdy*bdy;
        if (dist2 > burstR*burstR) continue;
        const fx = x+bdx, fy = y+bdy;
        if (!engine.inBounds(fx,fy)) continue;
        const fn = engine.get(fx,fy);
        // 空・溶岩・火・蒸気・煙・灰を押しのける（壁・石・地面は残す）
        if (fn !== EMPTY && fn !== LAVA && fn !== FIRE && fn !== STEAM && fn !== SMOKE && fn !== ASH) continue;
        const dist = Math.sqrt(dist2);
        if (dist <= 1.5) {
          // 中心: 茎
          engine.plant(fx, fy, PLANT, LOTUS_STEM_COLS[Math.min(Math.floor(dist), LOTUS_STEM_COLS.length-1)], burstMeta);
        } else if (dist <= 3.5) {
          // 中間: 大きな花びら（蓮カラー）
          engine.plant(fx, fy, FLOWER, LOTUS_COLORS[colorIdx], burstMeta);
        } else {
          // 外縁: 通常カラーで広がり
          engine.plant(fx, fy, FLOWER, FLOWER_COLORS[colorIdx % FLOWER_COLORS.length], burstMeta);
        }
      }
    }
    engine.fireEvent('plant_spawned'); // 冬眠明け発芽イベント（シナリオトリガー用）
    return; // 種位置は中心のPLANTで上書き済み
  }

  // Must rest on solid ground（玄武岩・砂岩・黒曜石も土台になれる）
  const onGround = [SOIL,SAND,STONE,WALL,GLASS,COAL,ASH,HARD_SOIL,MUD,BASALT,SANDSTONE,OBSIDIAN].includes(below);
  if (!onGround) return;

  // 半径3セル以内の水・油を探索
  let hasWater = false, hasOil = false, hasSteamS = false;
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      if (dx === 0 && dy === 0) continue;
      const n = engine.get(x+dx, y+dy);
      if (n === WATER || n === SOIL || n === HARD_SOIL) hasWater = true;
      if (n === OIL)                                    hasOil   = true;
      if (n === STEAM)                                  hasSteamS = true;
    }
  }
  // 蒸気は上方向に広域探索（蒸気は上昇するため遠くても有効）
  if (!hasSteamS) {
    for (let dy = -10; dy <= 1 && !hasSteamS; dy++)
      for (let dx = -6; dx <= 6 && !hasSteamS; dx++)
        if (engine.get(x+dx, y+dy) === STEAM) hasSteamS = true;
  }
  // 土/泥/固土の上 or 水/蒸気があれば発芽可能
  if (!hasWater && !hasSteamS && below !== SOIL && below !== MUD && below !== HARD_SOIL) return;

  // Germinate
  const isDark   = hasOil || isSumiMud; // ⑥ 墨水の上での発芽 → 強制的にDARK_PLANTへ
  const isMudGrow = !isDark && (below === MUD); // 泥の上 → 蓮の花
  const colorIdx = Math.floor(Math.random() * 8);
  const isLarge  = Math.random() > 0.5 ? META_LARGE : 0;
  const metaByte = colorIdx | isLarge | (isDark ? META_DARK : 0) | (isMudGrow ? META_LOTUS : 0);
  const stemCols = isDark ? DARK_STEM_COLS : (isMudGrow ? LOTUS_STEM_COLS : STEM_COLORS);

  engine.plant(x, y, isDark ? DARK_PLANT : PLANT, stemCols[0], metaByte);
}

function updatePlant(engine, x, y) {
  const i   = engine.idx(x, y);
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];

  // 蛍の自然発生: 植物+水が近くにある時、0.05%/frame で出現
  if (Math.random() < 0.0005) {
    let nearWater = false;
    outer: for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        if (engine.get(x+dx, y+dy) === WATER) { nearWater = true; break outer; }
      }
    }
    if (nearWater) {
      const spawnDirs = [[0,-1],[-1,-1],[1,-1],[-1,0],[1,0]];
      for (const [sdx, sdy] of spawnDirs) {
        const sx = x+sdx, sy = y+sdy;
        if (engine.inBounds(sx, sy) && engine.get(sx, sy) === EMPTY) {
          const fi = engine.idx(sx, sy);
          engine.cells[fi]   = FIREFLY;
          engine.colors[fi]  = 0xFFFF44;
          engine.meta[fi]    = Math.floor(Math.random() * 255); // ランダムな明滅フェーズから開始
          engine.updated[fi] = 1;
          break;
        }
      }
    }
  }

  // React to fire / lava → burn
  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === FIRE || n === LAVA) { engine.set(x, y, FIRE); return; }
    // Oil contact → mutate to dark plant
    if (n === OIL && Math.random() > 0.96) {
      engine.cells[i]  = DARK_PLANT;
      engine.colors[i] = DARK_STEM_COLS[0];
      engine.meta[i]   = engine.meta[i] | META_DARK;
      return;
    }
    // Acid contact → mutate to dark plant（第1段階。その後さらに酸に触れるとACID_PLANTへ）
    if (n === ACID && Math.random() > 0.97) {
      engine.cells[i]  = DARK_PLANT;
      engine.colors[i] = DARK_STEM_COLS[0];
      engine.meta[i]   = engine.meta[i] | META_DARK;
      return;
    }
  }

  if (engine.get(x, y-1) !== EMPTY) return; // blocked above

  const meta = engine.meta[i];
  const isLotusPlant = (meta & META_LOTUS) !== 0;

  // 蓮(泥生まれ)は常に成長可能。通常植物は水/蒸気/土が必要
  let hasSoilNear = false;
  if (!isLotusPlant) {
    let hasWater = false, hasSteam = false;
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const np = engine.get(x+dx, y+dy);
        if (np === WATER) hasWater = true;
        if (np === STEAM) hasSteam = true;
        if (np === SOIL || np === HARD_SOIL) hasSoilNear = true;
      }
    if (!hasWater && !hasSteam && Math.random() > 0.3) return;
  }

  // 成長確率: 蓮 > 土の近く > 通常
  const growthRate = isLotusPlant ? 0.030 : (hasSoilNear ? 0.022 : 0.012);
  if (Math.random() > growthRate) return;

  // Estimate height by scanning downward
  let height = 0;
  for (let dy = 1; dy <= 16; dy++) {
    if (engine.get(x, y+dy) === PLANT) height++; else break;
  }

  // 土の近くや蓮はより大きく咲く
  const bloomBase  = isLotusPlant ? 0.10 : (hasSoilNear ? 0.08 : 0.06);
  const bloomStep  = isLotusPlant ? 0.060 : (hasSoilNear ? 0.052 : 0.045);
  const bloomChance = Math.min(bloomBase + height * bloomStep, 0.75);

  if (Math.random() < bloomChance) {
    _bloom(engine, x, y-1, meta, false);
  } else {
    const stemColor = isLotusPlant
      ? LOTUS_STEM_COLS[Math.min(height, LOTUS_STEM_COLS.length-1)]
      : STEM_COLORS[Math.min(height, STEM_COLORS.length-1)];
    engine.plant(x, y-1, PLANT, stemColor, meta);
  }
}

function updateDarkPlant(engine, x, y) {
  const i   = engine.idx(x, y);
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  const isCrystal = (engine.meta[i] & META_ICE_CRYSTAL) !== 0;

  // 氷晶化: ICE隣接 → 結晶フラグをセットして色を紺碧に更新（未結晶時のみ）
  if (!isCrystal) {
    for (const [dx,dy] of nb4) {
      if (engine.get(x+dx, y+dy) === ICE && Math.random() > 0.85) {
        engine.meta[i] |= META_ICE_CRYSTAL;
        engine.colors[i] = ICE_CRYSTAL_STEM[Math.floor(Math.random() * ICE_CRYSTAL_STEM.length)];
        return;
      }
    }
  }

  // React to fire / lava → burn intensely（氷晶でも炎には負ける）
  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === FIRE || n === LAVA) {
      engine.set(x, y, FIRE);
      // Spread fire aggressively
      const sdir = Math.random() > 0.5 ? 1 : -1;
      if (engine.get(x+sdir, y) !== EMPTY) engine.set(x+sdir, y, FIRE);
      return;
    }
  }

  // 結晶状態: 油分泌・成長しない（凍りついている）
  if (isCrystal) return;

  // 酸変異: ACID隣接 → ACID_PLANT（感染する腐食林の起点）
  for (const [dx,dy] of nb4) {
    if (engine.get(x+dx, y+dy) === ACID && Math.random() > 0.97) {
      engine.cells[i]  = ACID_PLANT;
      engine.colors[i] = ACID_STEM_COLS[Math.floor(Math.random() * ACID_STEM_COLS.length)];
      engine.meta[i]   = 0;
      return;
    }
  }

  // Drip oil to nearby empty cells
  if (Math.random() > 0.997) {
    const oilDirs = [[1,0],[-1,0],[0,1]];
    for (const [dx,dy] of oilDirs) {
      if (engine.get(x+dx, y+dy) === EMPTY) { engine.set(x+dx, y+dy, OIL); break; }
    }
  }

  if (Math.random() > 0.02) return; // growth tick

  // Dark plants grow diagonally
  const growDirs = [[-1,-1],[1,-1],[0,-1]];
  growDirs.sort(() => Math.random() - 0.5); // shuffle

  for (const [dx,dy] of growDirs) {
    const nx = x+dx, ny = y+dy;
    if (!engine.inBounds(nx,ny) || engine.get(nx,ny) !== EMPTY) continue;

    const meta = engine.meta[i];
    let height = 0;
    for (let ddy = 1; ddy <= 16; ddy++) {
      if (engine.get(x, y+ddy) === DARK_PLANT) height++; else break;
    }
    const bloomChance = Math.min(0.08 + height * 0.05, 0.65);

    if (Math.random() < bloomChance) {
      _bloom(engine, nx, ny, meta, true);
    } else {
      const col = DARK_STEM_COLS[Math.floor(Math.random() * DARK_STEM_COLS.length)];
      engine.plant(nx, ny, DARK_PLANT, col, meta);
    }
    break;
  }
}

// Shared bloom logic
function _bloom(engine, x, y, meta, isDark) {
  const colorIdx    = meta & META_COLOR;
  const isLarge     = (meta & META_LARGE) !== 0;
  const isLotus     = (meta & META_LOTUS) !== 0;
  const isCrystal   = isDark && (meta & META_ICE_CRYSTAL) !== 0;
  const petalColor  = isCrystal
    ? ICE_CRYSTAL_FLOWER[colorIdx % ICE_CRYSTAL_FLOWER.length]
    : (isDark ? DARK_F_COLORS[colorIdx] : (isLotus ? LOTUS_COLORS[colorIdx] : FLOWER_COLORS[colorIdx]));
  const centerColor = isCrystal ? ICE_CRYSTAL_CENTER : (isDark ? DARK_F_CENTER : (isLotus ? LOTUS_CENTER : FLOWER_CENTER));
  // 蓮の花は横に広く広がる
  const radius      = isLarge
    ? (isLotus ? 5 + Math.floor(Math.random() * 2) : 3 + Math.floor(Math.random() * 2))
    : (isLotus ? 3 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 2));
  const flowerType  = isDark ? DARK_FLOWER : FLOWER;

  // Center (stamen)
  engine.plant(x, y, flowerType, centerColor, meta);

  // Petals spread horizontally
  for (let dx = -radius; dx <= radius; dx++) {
    if (dx === 0) continue;
    const fx = x + dx;
    if (!engine.inBounds(fx, y)) continue;
    if (engine.get(fx, y) === EMPTY) {
      engine.plant(fx, y, flowerType, petalColor, meta);
    }
  }
  // One row of petals above center too (fuller flower)
  for (let dx = -Math.floor(radius/2); dx <= Math.floor(radius/2); dx++) {
    const fx = x + dx;
    if (!engine.inBounds(fx, y-1)) continue;
    if (engine.get(fx, y-1) === EMPTY) {
      engine.plant(fx, y-1, flowerType, petalColor, meta);
    }
  }
}

function updateFungus(engine, x, y) {
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === FIRE || n === LAVA)             { engine.set(x, y, EMPTY);      return; }
    if (n === ICE  && Math.random() > 0.95)   { engine.set(x, y, EMPTY);      return; } // 凍死
    if (n === OIL  && Math.random() > 0.97)   { engine.set(x, y, GLOW_FUNGUS); return; }
  }
  if (Math.random() > 0.002) return;

  const spreadDirs = [[1,0],[-1,0],[0,1]];
  for (const [dx,dy] of spreadDirs) {
    const nx = x+dx, ny = y+dy;
    if (!engine.inBounds(nx,ny) || engine.get(nx,ny) !== EMPTY) continue;
    const bt = engine.get(nx, ny+1);
    const solid = bt !== EMPTY && bt !== WATER && bt !== OIL && bt !== LAVA && bt !== FIRE;
    if (solid) { engine.set(nx, ny, FUNGUS); engine.updated[engine.idx(nx,ny)] = 1; return; }
  }
}

function updateGlowFungus(engine, x, y) {
  const i = engine.idx(x, y);
  // 連鎖爆発フラグ（酸による死亡が隣接発光菌に伝播）
  if (engine.meta[i] === 255) {
    engine.cells[i] = SPARK; engine.colors[i] = 0x00FFDD; engine.updated[i] = 1;
    const nb4chain = [[0,1],[1,0],[-1,0],[0,-1]];
    for (const [dx,dy] of nb4chain) {
      const cx2 = x+dx, cy2 = y+dy;
      if (!engine.inBounds(cx2,cy2)) continue;
      if (engine.get(cx2,cy2) === GLOW_FUNGUS) engine.meta[engine.idx(cx2,cy2)] = 255;
      else if (engine.get(cx2,cy2) === EMPTY) engine.set(cx2, cy2, SPARK);
    }
    return;
  }

  // ⑦ 蛍との共鳴タイマー ─────────────────────────────────────────────────────
  // GLOW_FUNGUS meta 値の割り当て:
  //   0      = 通常状態
  //   1-254  = 共鳴タイマー（蛍が光を手渡した後のカウントダウン）  ← フェーズ3 新規
  //   255    = 既存の連鎖爆発フラグ（上のブロックで処理済み）
  //
  // meta=255 は直上のブロックで return 済みなので、ここでは meta が 1-254 なら共鳴中。
  // ─────────────────────────────────────────────────────────────────────────────
  const resonTimer = engine.meta[i];
  if (resonTimer > 0) {
    // 致命的反応は共鳴中でも有効（燃えたり凍えたりはする）
    const nb4r = [[0,1],[1,0],[-1,0],[0,-1]];
    for (const [dx,dy] of nb4r) {
      const n = engine.get(x+dx, y+dy);
      if (n === FIRE || n === LAVA)           { engine.set(x, y, EMPTY); return; }
      if (n === ICE  && Math.random() > 0.90) { engine.set(x, y, EMPTY); return; }
    }
    // タイマーをデクリメント
    const newTimer = resonTimer - 1;
    engine.meta[i] = newTimer;
    // 蛍のサイン波と同期した黄緑色の明滅（青成分なし → 純粋な温かい光）
    const phase = (resonTimer * 8) & 0xFF; // タイマー値から位相を生成（32フレーム/周期）
    const glow  = (Math.sin(phase * 2 * Math.PI / 255) + 1) * 0.5; // 0.0 ～ 1.0
    const r2    = Math.round(0x22 + glow * (0xFF - 0x22));
    const g2    = Math.round(0x44 + glow * (0xFF - 0x44));
    engine.colors[i] = (r2 << 16) | (g2 << 8) | 0x00;
    if (newTimer === 0) {
      // エネルギーを使い果たして FUNGUS に戻る（静けさへの回帰）
      engine.set(x, y, FUNGUS);
    }
    return; // 共鳴中は通常の成長・拡散をスキップ
  }

  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === FIRE || n === LAVA)          { engine.set(x, y, EMPTY); return; }
    if (n === ICE  && Math.random() > 0.90)  { engine.set(x, y, EMPTY); return; } // 凍死
    if (n === OIL  && Math.random() > 0.8) { engine.set(x+dx, y+dy, EMPTY); } // consume oil
  }
  // 蒸気が隣接していると超加速成長（高温多湿の洞窟）
  let glowNearSteam = false;
  for (const [dx2,dy2] of nb4) { if (engine.get(x+dx2, y+dy2) === STEAM) { glowNearSteam = true; break; } }
  if (Math.random() > (glowNearSteam ? 0.002 : 0.008)) return;

  const spreadDirs = glowNearSteam
    ? [[1,0],[-1,0],[0,1],[0,-1],[1,-1]] // 蒸気充満時は5方向へ拡散
    : [[1,0],[-1,0],[0,1]];
  for (const [dx,dy] of spreadDirs) {
    const nx = x+dx, ny = y+dy;
    if (!engine.inBounds(nx,ny)) continue;
    const target = engine.get(nx,ny);
    if (target !== EMPTY && target !== OIL && target !== FUNGUS) continue;
    const bt = engine.get(nx, ny+1);
    const solid = bt !== EMPTY && bt !== WATER && bt !== OIL && bt !== LAVA && bt !== FIRE;
    if (solid || target === OIL) { engine.set(nx, ny, GLOW_FUNGUS); engine.updated[engine.idx(nx,ny)] = 1; return; }
  }
}


function updateRust(engine, x, y) {
  // 雷 → 砂に崩壊、溶岩 → 溶解。隣接METALに錆伝播（0.5%）
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === LIGHTNING) { engine.set(x, y, SAND); return; }
    if (n === LAVA)      { engine.set(x, y, LAVA); return; }
    if (n === METAL && Math.random() > 0.995) { engine.set(x+dx, y+dy, RUST); }
  }
  // 落下挙動: 錆が積み重なると自重で崩れる（重い砂）
  if (Math.random() > 0.4) return;
  const below = engine.get(x, y+1);
  if (below === EMPTY || below === WATER) { engine.swap(x, y, x, y+1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x+dir, y+1) === EMPTY) { engine.swap(x, y, x+dir, y+1); return; }
  if (engine.get(x-dir, y+1) === EMPTY) { engine.swap(x, y, x-dir, y+1); return; }
}

// ─── Liquid & Gas update functions ───────────────────────────────────────────

function updateSteam(engine, x, y) {
  // No TTL: steam accumulates at ceiling, then drips as water

  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    const nx = x+dx, ny = y+dy, n = engine.get(nx, ny);
    if (n === SNOW || n === ICE) { engine.set(x, y, WATER); return; } // 冷えて凝結
    if (n === ASH && Math.random() > 0.99) { engine.set(x, y, EMPTY); engine.set(nx, ny, SOIL); return; } // 灰+蒸気→土（生命サイクル循環）
    if (n === COAL && Math.random() > 0.97) {
      // 蒸気機関: 圧力爆発
      engine.set(x, y, SMOKE);
      engine.set(nx, ny, FIRE);
      for (const [ex,ey] of [[0,-1],[1,-1],[-1,-1],[1,0],[-1,0],[0,-2]]) {
        const px=x+ex, py=y+ey;
        if (engine.inBounds(px,py) && engine.get(px,py) === EMPTY) {
          engine.set(px, py, Math.random() > 0.4 ? FIRE : SMOKE);
        }
      }
      return;
    }
    if (n === METAL && Math.random() > 0.995) { engine.set(nx, ny, RUST); }
    // ⑤ 霧の結露 (Shizuku): 真上（dy=-1）が冷たい岩石 → 0.3%/frame で凝結→水に変換
    // WALL/ICE は既存の atCeiling 処理で対応済みのため除外
    if (dx === 0 && dy === -1 &&
        (n === STONE || n === GLASS || n === OBSIDIAN || n === BASALT || n === SANDSTONE) &&
        Math.random() > 0.997) {
      engine.set(x, y, WATER); return;
    }
  }

  // Rise slowly (25% per frame — slower than smoke)
  if (Math.random() > 0.25) {
    if (Math.random() > 0.997) { engine.set(x, y, EMPTY); } // 微量の蒸発（広い空間で消える）
    return;
  }

  const up = engine.get(x, y-1);
  if (up === EMPTY) { engine.swap(x, y, x, y-1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if (engine.get(x+dir, y-1) === EMPTY) { engine.swap(x, y, x+dir, y-1); return; }
  if (engine.get(x-dir, y-1) === EMPTY) { engine.swap(x, y, x-dir, y-1); return; }
  // 横に少し漂う
  if (Math.random() > 0.35) return;
  if (engine.get(x+dir, y) === EMPTY) { engine.swap(x, y, x+dir, y); return; }
  if (engine.get(x-dir, y) === EMPTY) { engine.swap(x, y, x-dir, y); return; }

  // 完全に詰まった（天井または壁に押し付けられた）→ 水滴を垂らす
  const atCeiling = (y === 0 || up === WALL || up === STONE || up === GLASS || up === ICE);
  if (atCeiling && Math.random() > 0.98) {
    // 水滴が落ちる
    if (engine.inBounds(x, y+1) && engine.get(x, y+1) === EMPTY) {
      engine.set(x, y+1, WATER);
    }
    engine.set(x, y, EMPTY); // 蒸気は消えて水滴に変わった
    return;
  }
  // 天井でない詰まり → ゆっくり消散
  if (Math.random() > 0.993) { engine.set(x, y, EMPTY); }
}

function updateAcid(engine, x, y) {
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];

  for (const [dx,dy] of nb4) {
    const nx = x+dx, ny = y+dy, n = engine.get(nx, ny);
    if (n === WALL        && Math.random() > 0.98)  { engine.set(nx, ny, EMPTY); return; }
    if (n === SAND        && Math.random() > 0.92)  { engine.set(nx, ny, EMPTY); return; }
    if (n === STONE       && Math.random() > 0.97)  { engine.set(nx, ny, EMPTY); return; }
    if (n === COAL        && Math.random() > 0.93)  { engine.set(nx, ny, EMPTY); return; }
    if (n === GLASS       && Math.random() > 0.95)  { engine.set(nx, ny, EMPTY); return; }
    if (n === SOIL        && Math.random() > 0.95)  { engine.set(nx, ny, SAND);  return; }
    if (n === HARD_SOIL   && Math.random() > 0.95)  { engine.set(nx, ny, SAND);  return; } // 固い土も溶ける
    if (n === SANDSTONE   && Math.random() > 0.80)  { engine.set(nx, ny, SAND);  return; } // 砂岩は酸に弱い
    if (n === BASALT      && Math.random() > 0.95)  { engine.set(nx, ny, MUD);   return; } // 玄武岩は酸で泥化（OBSIDIAN は耐性で対象外）
    if (n === ASH         && Math.random() > 0.93)  { engine.set(nx, ny, EMPTY); return; } // 灰も溶ける
    if (n === METAL       && Math.random() > 0.97)  { engine.set(nx, ny, RUST);  return; }
    if (n === RUST        && Math.random() > 0.90)  { engine.set(nx, ny, EMPTY); return; } // 錆除去
    if (n === ICE         && Math.random() > 0.80)  { engine.set(nx, ny, WATER); return; }
    if (n === SNOW        && Math.random() > 0.85)  { engine.set(nx, ny, WATER); return; }
    if (n === MUD         && Math.random() > 0.95)  { engine.set(nx, ny, WATER); engine.set(x, y, SAND); return; }
    if ((n === PLANT || n === FLOWER || n === DARK_PLANT || n === DARK_FLOWER) && Math.random() > 0.90) {
      engine.set(nx, ny, EMPTY); return;
    }
    if (n === SEED        && Math.random() > 0.90)  { engine.set(nx, ny, ASH);   return; }
    if (n === FUNGUS      && Math.random() > 0.85)  { engine.set(nx, ny, EMPTY); return; }
    if (n === GLOW_FUNGUS && Math.random() > 0.85)  {
      // 最後の輝き: SPARKバースト + 隣接発光菌へ連鎖爆発を伝播
      const si = engine.idx(nx, ny);
      engine.cells[si] = SPARK; engine.colors[si] = 0x00FFDD; engine.updated[si] = 1;
      for (const [bx,by] of [[0,-1],[1,0],[-1,0],[0,1]]) {
        const px=nx+bx, py=ny+by;
        if (!engine.inBounds(px,py)) continue;
        const pn = engine.get(px,py);
        if (pn === EMPTY) { engine.set(px,py,SPARK); }
        else if (pn === GLOW_FUNGUS) { engine.meta[engine.idx(px,py)] = 255; } // 連鎖フラグ
      }
      return;
    }
    if (n === WATER && Math.random() > 0.70)        { engine.set(x, y, WATER); return; } // 希釈
    if (n === LAVA) {
      // 激しい反応 → 蒸気バースト
      engine.set(x, y, STEAM); engine.meta[engine.idx(x,y)] = 0;
      engine.set(nx, ny, SMOKE);
      for (const [ex,ey] of [[0,-1],[1,-1],[-1,-1]]) {
        const px=x+ex, py=y+ey;
        if (engine.inBounds(px,py) && engine.get(px,py) === EMPTY) { engine.set(px,py,STEAM); engine.meta[engine.idx(px,py)] = 0; }
      }
      return;
    }
    if (n === FIRE && Math.random() > 0.70) { engine.set(x, y, WATER); return; } // 中和
  }

  // Flow: denser than water — sinks through water
  if (Math.random() > 0.65) return;
  const below = engine.get(x, y+1);
  if (below === EMPTY || below === WATER || below === STEAM) { engine.swap(x, y, x, y+1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if ([EMPTY,WATER,STEAM].includes(engine.get(x+dir,y+1))) { engine.swap(x, y, x+dir, y+1); return; }
  if ([EMPTY,WATER,STEAM].includes(engine.get(x-dir,y+1))) { engine.swap(x, y, x-dir, y+1); return; }
  if (engine.get(x+dir, y) === EMPTY) { engine.swap(x, y, x+dir, y); return; }
  if (engine.get(x-dir, y) === EMPTY) { engine.swap(x, y, x-dir, y); return; }
}

function updateMud(engine, x, y) {
  // 泥火山: 直下にLAVAがあれば泥を上方向へ噴出（間欠泉）
  if (engine.get(x, y+1) === LAVA && Math.random() < 0.05) {
    if (engine.inBounds(x, y-1) && engine.get(x, y-1) === EMPTY) {
      engine.set(x, y-1, MUD);
      engine.updated[engine.idx(x, y-1)] = 1;
    }
  }

  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];

  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === FIRE && Math.random() > 0.95) { engine.set(x, y, STONE);  return; } // 焼成→石
    if (n === LAVA && Math.random() > 0.95) { engine.set(x, y, BASALT); return; } // 溶岩+泥→玄武岩
    if ((n === LIGHTNING || n === SPARK) && Math.random() > 0.6) { engine.set(x, y, SPARK); return; } // 導電
    if (n === SNOW && Math.random() > 0.98) { engine.set(x+dx, y+dy, MUD); } // 雪→泥
  }

  // Viscous flow
  if (Math.random() > 0.5) return;
  const below = engine.get(x, y+1);
  if (below === EMPTY || below === WATER || below === STEAM) { engine.swap(x, y, x, y+1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  if ([EMPTY,WATER,STEAM].includes(engine.get(x+dir,y+1))) { engine.swap(x, y, x+dir, y+1); return; }
  if ([EMPTY,WATER,STEAM].includes(engine.get(x-dir,y+1))) { engine.swap(x, y, x-dir, y+1); return; }
  if (Math.random() > 0.25) return;
  if (engine.get(x+dir, y) === EMPTY) { engine.swap(x, y, x+dir, y); return; }
  if (engine.get(x-dir, y) === EMPTY) { engine.swap(x, y, x-dir, y); return; }
}

function updateIce(engine, x, y) {
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === FIRE  && Math.random() > 0.90) { engine.set(x, y, WATER); return; }
    if (n === LAVA  && Math.random() > 0.60) {
      engine.set(x, y, WATER);
      if (engine.inBounds(x, y-1) && engine.get(x, y-1) === EMPTY) { engine.set(x, y-1, STEAM); engine.meta[engine.idx(x, y-1)] = 0; }
      return;
    }
    if ((n === LIGHTNING || n === SPARK) && Math.random() > 0.70) {
      engine.set(x, y, WATER);
      for (const [sdx,sdy] of [[0,-1],[1,0],[-1,0]]) {
        const px=x+sdx, py=y+sdy;
        if (engine.inBounds(px,py) && engine.get(px,py) === EMPTY) { engine.set(px,py,SPARK); }
      }
      return;
    }
    if (n === ACID  && Math.random() > 0.80) { engine.set(x, y, WATER); return; }
    if (n === STEAM && Math.random() > 0.97) { engine.set(x+dx, y+dy, WATER); } // 蒸気凝結
  }
  // Slow freeze: spread to adjacent water when cold nearby
  if (Math.random() > 0.003) return;
  for (const [dx,dy] of nb4) {
    if (engine.get(x+dx, y+dy) === WATER) {
      let cold = false;
      for (let ey=-3; ey<=3 && !cold; ey++)
        for (let ex=-3; ex<=3 && !cold; ex++) {
          const cn = engine.get(x+ex, y+ey);
          if (cn === SNOW || cn === ICE) cold = true;
        }
      if (cold) { engine.set(x+dx, y+dy, ICE); engine.updated[engine.idx(x+dx,y+dy)] = 1; return; }
    }
  }
}

// ─── P3 素材 update functions ─────────────────────────────────────────────────

function updateAcidPlant(engine, x, y) {
  const i   = engine.idx(x, y);
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];

  for (const [dx,dy] of nb4) {
    const nx2 = x+dx, ny2 = y+dy;
    const n   = engine.get(nx2, ny2);
    // 感染: 隣接する通常植物・暗黒植物を腐食植物に変える
    if ((n === PLANT || n === DARK_PLANT || n === FLOWER || n === DARK_FLOWER) && Math.random() > 0.997) {
      const ni2 = engine.idx(nx2, ny2);
      engine.cells[ni2]  = ACID_PLANT;
      engine.colors[ni2] = ACID_STEM_COLS[0];
      engine.meta[ni2]   = 0;
      return;
    }
    // 浄化: 水が隣接→暗黒植物に戻る
    if (n === WATER && Math.random() > 0.995) {
      engine.cells[i]  = DARK_PLANT;
      engine.colors[i] = DARK_STEM_COLS[0];
      return;
    }
    // 火・溶岩で燃焼 → 酸の飛沫を散らす
    if ((n === FIRE || n === LAVA) && Math.random() > 0.5) {
      engine.set(x, y, FIRE);
      for (const [sdx,sdy] of [[0,-1],[1,0],[-1,0],[0,1],[1,-1],[-1,-1]]) {
        const sx=x+sdx, sy=y+sdy;
        if (engine.inBounds(sx,sy) && engine.get(sx,sy) === EMPTY && Math.random() > 0.6) {
          engine.set(sx, sy, ACID);
        }
      }
      return;
    }
    // ICE隣接: 酸が氷を溶かす（腐食植物は凍らない）
    if (n === ICE && Math.random() > 0.90) { engine.set(nx2, ny2, WATER); }
  }

  // 酸を少量分泌 (0.3%/frame)
  if (Math.random() > 0.997) {
    for (const [dx,dy] of [[1,0],[-1,0],[0,1]]) {
      if (engine.inBounds(x+dx,y+dy) && engine.get(x+dx, y+dy) === EMPTY) {
        engine.set(x+dx, y+dy, ACID); break;
      }
    }
  }

  // 上方向への成長（暗黒植物と同じ斜め成長）
  if (Math.random() > 0.02) return;
  const growDirs = [[-1,-1],[1,-1],[0,-1]];
  growDirs.sort(() => Math.random() - 0.5);
  for (const [dx,dy] of growDirs) {
    const gx = x+dx, gy = y+dy;
    if (!engine.inBounds(gx,gy) || engine.get(gx,gy) !== EMPTY) continue;
    const meta = engine.meta[i];
    let height = 0;
    for (let ddy = 1; ddy <= 16; ddy++) {
      if (engine.get(x, y+ddy) === ACID_PLANT) height++; else break;
    }
    const bloomChance = Math.min(0.08 + height * 0.05, 0.65);
    if (Math.random() < bloomChance) {
      // 酸性の花: DARK_FLOWER IDを流用、ライムグリーンで着色
      engine.plant(gx, gy, DARK_FLOWER, ACID_FLOWER_COLS[Math.floor(Math.random() * ACID_FLOWER_COLS.length)], meta);
    } else {
      engine.plant(gx, gy, ACID_PLANT, ACID_STEM_COLS[Math.floor(Math.random() * ACID_STEM_COLS.length)], meta);
    }
    break;
  }
}

function updateSpring(engine, x, y) {
  // 水源: 3%/frame で隣接EMPTYにWATERを生成する永久水源
  if (Math.random() > 0.03) return;
  const dirs = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of dirs) {
    const nx = x+dx, ny = y+dy;
    if (engine.inBounds(nx,ny) && engine.get(nx,ny) === EMPTY) {
      engine.set(nx, ny, WATER);
      return;
    }
  }
}

function updateLavaSpring(engine, x, y) {
  // 溶岩源泉（地熱噴出口）: WATERが隣接すれば直接STEAMに変換（STONEを作らない）
  // → 永久水循環シナリオでSTONEが詰まる問題を防ぐ
  const dirs = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of dirs) {
    const nx = x+dx, ny = y+dy;
    if (engine.inBounds(nx,ny) && engine.get(nx,ny) === WATER) {
      if (Math.random() > 0.02) return;
      engine.set(nx, ny, STEAM);
      return;
    }
  }
  // 水がない場合: 通常の溶岩噴出（2%/frame）
  if (Math.random() > 0.02) return;
  for (const [dx,dy] of dirs) {
    const nx = x+dx, ny = y+dy;
    if (engine.inBounds(nx,ny) && engine.get(nx,ny) === EMPTY) {
      engine.set(nx, ny, LAVA);
      return;
    }
  }
}

function updateObsidian(engine, x, y) {
  // 黒曜石: 溶岩でのみ溶ける。酸・雷・水に完全耐性
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    if (engine.get(x+dx, y+dy) === LAVA && Math.random() > 0.97) {
      engine.set(x, y, LAVA); return;
    }
  }
}

function updateSandstone(engine, x, y) {
  // 砂岩: 水でじわじわ侵食→砂、酸で速く溶ける、溶岩で再加熱→ガラス
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === WATER && Math.random() > 0.9995) { engine.set(x, y, SAND);  return; } // 水侵食（崖崩れ）
    if (n === LAVA  && Math.random() > 0.98)   { engine.set(x, y, GLASS); return; } // 再加熱→ガラス
  }
}

function updateBasalt(engine, x, y) {
  // 玄武岩: 溶岩で再溶融、酸で泥化
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === LAVA && Math.random() > 0.98) { engine.set(x, y, LAVA); return; }
    if (n === ACID && Math.random() > 0.97) { engine.set(x, y, MUD);  return; } // 酸+玄武岩→泥（鉱物溶出）
  }
}

// ─── Electricity update functions ────────────────────────────────────────────

function updateMetal(engine, x, y) {
  // Falls like sand but slightly more stable (less diagonal sliding)
  const below = engine.get(x, y+1);
  if (below === EMPTY || below === WATER) { engine.swap(x, y, x, y+1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  const dA = engine.get(x+dir, y+1), dB = engine.get(x-dir, y+1);
  if ((dA === EMPTY || dA === WATER) && Math.random() > 0.35) { engine.swap(x, y, x+dir, y+1); return; }
  if ((dB === EMPTY || dB === WATER) && Math.random() > 0.35) { engine.swap(x, y, x-dir, y+1); return; }
  // Lava melts metal → becomes lava
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    if (engine.get(x+dx, y+dy) === LAVA && Math.random() > 0.94) {
      engine.set(x, y, LAVA); return;
    }
  }
  // 超冷却: ICEが隣接している間 meta=1（フロスト状態）。離れたら0に戻す
  {
    const mi = engine.idx(x, y);
    let nearIce = false;
    for (const [dx,dy] of nb4) {
      if (engine.get(x+dx, y+dy) === ICE) { nearIce = true; break; }
    }
    if (nearIce && engine.meta[mi] === 0) {
      engine.meta[mi]   = 1;
      engine.colors[mi] = 0xD8EEF8; // 霜がかかった白銀色
    } else if (!nearIce && engine.meta[mi] === 1) {
      engine.meta[mi]   = 0;
      engine.colors[mi] = 0xB0B8C8; // 通常金属色に戻す
    }
  }
  // 水/泥に長時間接触 → 錆（泥はより速い）
  if (Math.random() > 0.998) {
    for (const [dx,dy] of nb4) {
      const wn = engine.get(x+dx, y+dy);
      if (wn === WATER)              { engine.set(x, y, RUST); return; }
      if (wn === MUD && Math.random() > 0.4) { engine.set(x, y, RUST); return; } // 泥は0.3%速
    }
  }
}

// 雷の隣接反応ヘルパー（進行中・着地点で共用）
function _lightningReact(engine, x, y) {
  const dirs = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of dirs) {
    const nx = x+dx, ny = y+dy;
    const n  = engine.get(nx, ny);
    const ni = engine.idx(nx, ny);
    if (n === METAL) {
      const isSupercooled = engine.meta[ni] === 1;
      engine.cells[ni]  = LIGHTNING;
      engine.colors[ni] = isSupercooled
        ? 0x88DDFF // 氷青の超冷却雷
        : MATERIALS[LIGHTNING].colors[Math.floor(Math.random() * MATERIALS[LIGHTNING].colors.length)];
      engine.meta[ni]   = 5 + Math.floor(Math.random() * 3);
      if (isSupercooled) {
        // 分岐チェーン: 超冷却金属から枝分かれ伝播
        const branchDirs = [[0,1],[1,0],[-1,0],[0,-1]];
        for (const [bdx,bdy] of branchDirs) {
          const bx=nx+bdx, by=ny+bdy;
          if (!engine.inBounds(bx,by)) continue;
          const bn = engine.get(bx,by), bi = engine.idx(bx,by);
          if (bn === METAL) {
            engine.cells[bi]   = LIGHTNING;
            engine.colors[bi]  = 0x66CCFF; // 薄い氷青（分岐は少し弱い）
            engine.meta[bi]    = 3 + Math.floor(Math.random() * 2);
            engine.updated[bi] = 1;
          } else if (bn === WATER) {
            engine.set(bx, by, ICE); // 極低温放熱: 隣接水が瞬時に凍る
          }
        }
      }
    } else if (n === WATER) {
      engine.cells[ni]   = SPARK;
      engine.colors[ni]  = MATERIALS[SPARK].colors[Math.floor(Math.random() * MATERIALS[SPARK].colors.length)];
      engine.updated[ni] = 1;
    } else if (n === SAND   && Math.random() > 0.25) { engine.set(nx, ny, GLASS); }
    else if (n === OIL) {
      // 爆発: 半径4のFIRE広範囲生成（油田爆破）
      const r = 4;
      for (let ey = -r; ey <= r; ey++) for (let ex = -r; ex <= r; ex++) {
        if (ex*ex + ey*ey > r*r) continue;
        const en = engine.get(nx+ex, ny+ey);
        if (en === EMPTY || en === OIL || en === SMOKE) engine.set(nx+ex, ny+ey, FIRE);
      }
    }
    else if (n === COAL)                              { engine.set(nx, ny, FIRE);  }
    else if (n === SNOW)                              { engine.set(nx, ny, WATER); }
    else if (n === SOIL)                              { engine.set(nx, ny, SAND);  }
    else if (n === RUST)                              { engine.set(nx, ny, SAND);  } // 錆が砂に崩壊
    else if (n === ICE) {
      engine.set(nx, ny, WATER);
      for (const [sdx,sdy] of [[0,-1],[1,0],[-1,0]]) {
        const px=nx+sdx, py=ny+sdy;
        if (engine.inBounds(px,py) && engine.get(px,py) === EMPTY) { engine.set(px,py,SPARK); }
      }
    }
    else if (n === MUD) {
      const mi = engine.idx(nx, ny);
      engine.cells[mi] = SPARK; engine.colors[mi] = MATERIALS[SPARK].colors[0]; engine.updated[mi] = 1;
    }
    else if (n === STEAM) { engine.set(nx, ny, WATER); }
    else if (n === PLANT || n === FLOWER || n === DARK_FLOWER) { engine.set(nx, ny, FIRE); }
    else if (n === DARK_PLANT) {
      const dpi = engine.idx(nx, ny);
      if (engine.meta[dpi] & META_ICE_CRYSTAL) {
        // 氷晶粉砕 → SPARK + 周囲に水が飛び散る
        engine.cells[dpi]   = SPARK;
        engine.colors[dpi]  = 0xAAEEFF;
        engine.updated[dpi] = 1;
        for (const [wdx,wdy] of [[0,-1],[1,0],[-1,0],[0,1],[1,-1],[-1,-1]]) {
          const wp=nx+wdx, wq=ny+wdy;
          if (engine.inBounds(wp,wq) && engine.get(wp,wq) === EMPTY) engine.set(wp, wq, WATER);
        }
      } else {
        // F+: 激しく発火 + 8方向に飛び火
        engine.set(nx, ny, FIRE);
        const sd = [[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
        for (const [sdx,sdy] of sd) {
          const sn = engine.get(nx+sdx, ny+sdy);
          if (sn === EMPTY || sn === OIL || sn === PLANT || sn === FLOWER) engine.set(nx+sdx, ny+sdy, FIRE);
        }
      }
    }
    else if (n === FUNGUS) { engine.set(nx, ny, GLOW_FUNGUS); }
    else if (n === GLOW_FUNGUS) {
      // 超発光バースト → 消滅
      const br = 3;
      for (let by = -br; by <= br; by++) for (let bx = -br; bx <= br; bx++) {
        if (bx*bx + by*by > br*br) continue;
        const bn = engine.get(nx+bx, ny+by);
        if (bn === EMPTY || bn === GLOW_FUNGUS || bn === FUNGUS) {
          const bi = engine.idx(nx+bx, ny+by);
          engine.cells[bi] = SPARK; engine.colors[bi] = 0x00FFDD; engine.updated[bi] = 1;
        }
      }
      engine.set(nx, ny, EMPTY);
    }
    else if (n === SEED) { engine.set(nx, ny, ASH); }
    else if (n === SAKURA_TREE && engine.meta[ni] < 64) {
      // ③ 雷桜 (Raiken): Phase 1の桜に雷が当たると即座に Phase 2（開花）へ強制移行
      engine.meta[ni]   = 64;
      engine.colors[ni] = SAKURA_BLOOM_COLS[Math.floor(Math.random() * SAKURA_BLOOM_COLS.length)];
      engine.updated[ni] = 1;
      // 周囲に花びらを爆散（半径3）
      const raikenDirs = [
        [-2,-1],[-1,-2],[0,-2],[1,-2],[2,-1],
        [-1,-1],[0,-1],[1,-1],[-2, 0],[2, 0],
        [-1, 1],[0, 1],[1, 1],[-2, 1],[2, 1],
      ];
      for (const [bdx,bdy] of raikenDirs) {
        const bx = nx+bdx, by = ny+bdy;
        if (!engine.inBounds(bx,by) || engine.get(bx,by) !== EMPTY) continue;
        if (Math.random() > 0.55) continue; // 45%の確率で各方向に花びらを生成
        const bi = engine.idx(bx, by);
        engine.cells[bi]   = SAKURA_PETAL;
        engine.colors[bi]  = SAKURA_BLOOM_COLS[Math.floor(Math.random() * SAKURA_BLOOM_COLS.length)];
        engine.meta[bi]    = 50 + Math.floor(Math.random() * 30);
        engine.updated[bi] = 1;
      }
    }
  }
}

function updateLightning(engine, x, y) {
  const i = engine.idx(x, y);
  if (engine.meta[i] === 0) engine.meta[i] = 5 + Math.floor(Math.random() * 4);

  // 上から下へ高速落下（最大4セル/frame）＋ジグザグ
  const SPEED  = 4;
  const zigDir = Math.random() > 0.5 ? 1 : -1;
  let cx = x, cy = y;

  for (let step = 0; step < SPEED; step++) {
    let nx = cx, ny = cy + 1;
    if (!engine.inBounds(nx, ny)) break;

    // 30%の確率でジグザグ
    if (Math.random() > 0.7 && engine.inBounds(cx + zigDir, cy + 1)
        && engine.get(cx + zigDir, cy + 1) === EMPTY) {
      nx = cx + zigDir;
    } else if (engine.get(cx, cy + 1) !== EMPTY) {
      // 直下が塞がれていたら斜め下を試みる
      if (engine.inBounds(cx + zigDir, cy + 1) && engine.get(cx + zigDir, cy + 1) === EMPTY) {
        nx = cx + zigDir;
      } else if (engine.inBounds(cx - zigDir, cy + 1) && engine.get(cx - zigDir, cy + 1) === EMPTY) {
        nx = cx - zigDir;
      } else {
        break;
      }
    }

    if (engine.get(nx, ny) !== EMPTY) break;

    // 通過点の左右に反応チェック
    _lightningReact(engine, nx, ny);

    cx = nx; cy = ny;
  }

  if (cx !== x || cy !== y) {
    // 旧位置をSPARKトレイルに
    engine.cells[i]  = EMPTY;
    engine.colors[i] = 0;
    engine.meta[i]   = 0;

    // 新位置に雷を配置
    const ni = engine.idx(cx, cy);
    engine.cells[ni]  = LIGHTNING;
    engine.colors[ni] = MATERIALS[LIGHTNING].colors[Math.floor(Math.random() * MATERIALS[LIGHTNING].colors.length)];
    engine.meta[ni]   = 5 + Math.floor(Math.random() * 4);
    engine.updated[ni] = 1;
    _lightningReact(engine, cx, cy);
  } else {
    // 動けない：反応して消滅カウントダウン
    _lightningReact(engine, x, y);
    engine.meta[i]--;
    if (engine.meta[i] <= 0) {
      engine.cells[i] = EMPTY; engine.colors[i] = 0; engine.meta[i] = 0;
    }
  }
}
function updateSpark(engine, x, y) {
  // Fade back to water quickly
  if (Math.random() > 0.82) { engine.set(x, y, WATER); return; }

  // Spread electric wave through adjacent water (one generation per frame)
  if (Math.random() > 0.6) return;
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    const nx = x+dx, ny = y+dy;
    if (engine.get(nx, ny) === WATER) {
      const ni = engine.idx(nx, ny);
      engine.cells[ni]   = SPARK;
      engine.colors[ni]  = MATERIALS[SPARK].colors[Math.floor(Math.random() * MATERIALS[SPARK].colors.length)];
      engine.updated[ni] = 1; // one step per frame = visible wave front
    }
  }
}

// ─── Wabi-Sabi update functions ───────────────────────────────────────────────

function updateSakuraSeed(engine, x, y) {
  // 砂と同じ重力挙動で落下
  const below = engine.get(x, y+1);
  if (below === EMPTY || below === WATER) { engine.swap(x, y, x, y+1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  const dA = engine.get(x+dir, y+1), dB = engine.get(x-dir, y+1);
  if (dA === EMPTY || dA === WATER) { engine.swap(x, y, x+dir, y+1); return; }
  if (dB === EMPTY || dB === WATER) { engine.swap(x, y, x-dir, y+1); return; }

  // 火/溶岩に触れると焼失
  const nb4s = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4s) {
    const n = engine.get(x+dx, y+dy);
    if (n === FIRE || n === LAVA) { engine.set(x, y, ASH); return; }
  }

  // 発芽条件: 固い地面の上 + 半径4内に水/土/蒸気
  const GROUND = [SOIL,SAND,STONE,WALL,GLASS,COAL,ASH,HARD_SOIL,MUD,BASALT,SANDSTONE,OBSIDIAN];
  if (!GROUND.includes(below)) return;

  let hasWater = false;
  outer: for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const n = engine.get(x+dx, y+dy);
      if (n === WATER || n === MUD || n === SOIL || n === STEAM) { hasWater = true; break outer; }
    }
  }
  if (!hasWater) return;

  if (Math.random() > 0.05) return; // 5%/frame で発芽

  engine.plant(x, y, SAKURA_TREE,
    SAKURA_TRUNK_COLS[Math.floor(Math.random() * SAKURA_TRUNK_COLS.length)],
    0 // meta=0 → Phase 1（成長期）スタート
  );
}

// ─── SAKURA_TREE meta エンコーディング ────────────────────────────────────────
// meta は 0-255 の純粋なフェーズカウンタ（数値として使用、ビット演算なし）
//
//  0  ～  63 : Phase 1「成長期」  茶色い幹・枝が上へ伸びる
//  64 ～ 191 : Phase 2「開花期」  ピンクに変化し、花びらを放出する
// 192 ～ 255 : Phase 3「散り期」  淡白になり、最後の花びらを散らしてEMPTYになる
//
// 7%/frame でインクリメント → 平均1分弱で255に到達（全ライフサイクル）
// Phase1:約15秒 / Phase2:約30秒 / Phase3:約15秒
// ─────────────────────────────────────────────────────────────────────────────

function updateSakuraTree(engine, x, y) {
  const i    = engine.idx(x, y);
  const meta = engine.meta[i];

  // 火・溶岩 → 燃焼
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === FIRE || n === LAVA)              { engine.set(x, y, FIRE); return; }
    if (n === ACID && Math.random() > 0.97)    { engine.set(x, y, ASH);  return; }
  }

  // フェーズカウンタを 7%/frame でインクリメント
  if (Math.random() < 0.07) {
    const newMeta = Math.min(255, meta + 1);
    engine.meta[i] = newMeta;

    // フェーズ境界を越えた瞬間だけ色を更新（"パッと咲く・パッと散る"演出）
    if (meta < 64 && newMeta >= 64) {
      // Phase 1→2: ピンクの開花色に変化
      engine.colors[i] = SAKURA_BLOOM_COLS[Math.floor(Math.random() * SAKURA_BLOOM_COLS.length)];
    } else if (meta < 192 && newMeta >= 192) {
      // Phase 2→3: 淡白な散り色に変化
      engine.colors[i] = SAKURA_FADE_COLS[Math.floor(Math.random() * SAKURA_FADE_COLS.length)];
    }
  }

  const phase = engine.meta[i]; // インクリメント後の値を使う

  if (phase < 64) {
    // ──── Phase 1: 成長期 ────────────────────────────────────────────────
    if (Math.random() > 0.025) return; // 2.5%/frame の成長チック

    // 真下から高さを推定（幹の長さ）
    let height = 0;
    for (let dy = 1; dy <= 20; dy++) {
      if (engine.get(x, y+dy) === SAKURA_TREE || engine.get(x, y+dy) === SAKURA_SEED) height++;
      else break;
    }
    if (height >= 14) return; // 最大14セルの高さで成長停止

    // 下部（trunk）は真っすぐ上へ、上部（canopy）は斜めに分岐
    const growDirs = height < 5
      ? [[0,-1],[0,-1],[0,-1],[-1,-1],[1,-1]]     // 幹: 直立が多く、稀に分岐
      : [[-1,-1],[1,-1],[0,-1],[-1,-1],[1,-1]];   // 樹冠: 均等に広がる

    const gd = growDirs[Math.floor(Math.random() * growDirs.length)];
    const gx = x+gd[0], gy = y+gd[1];
    if (!engine.inBounds(gx,gy) || engine.get(gx,gy) !== EMPTY) return;

    const col = height < 5
      ? SAKURA_TRUNK_COLS[Math.floor(Math.random()  * SAKURA_TRUNK_COLS.length)]
      : SAKURA_BRANCH_COLS[Math.floor(Math.random() * SAKURA_BRANCH_COLS.length)];
    // 新セルは meta=0 からスタート（細胞が独立してエイジングする）
    engine.plant(gx, gy, SAKURA_TREE, col, 0);

  } else if (phase < 192) {
    // ──── Phase 2: 開花期 ────────────────────────────────────────────────
    // 花粉放出（0.005%/frame）: 桜遺伝子（インデックス0=ピンク赤）を持つ花粉を真上に
    if (Math.random() < 0.00005) {
      _emitPollen(engine, x, y, 0, false); // gene=0 (FLOWER_COLORS[0]=0xFF6688 桜ピンク)
    }
    if (Math.random() > 0.018) return; // 1.8%/frame で花びらを放出

    // 周囲の空きセルに SAKURA_PETAL を生成
    const petalDirs = [[-2,-1],[-1,-2],[0,-2],[1,-2],[2,-1],[-1,-1],[1,-1],[-2,0],[2,0]];
    const pd = petalDirs[Math.floor(Math.random() * petalDirs.length)];
    const px = x+pd[0], py = y+pd[1];
    if (!engine.inBounds(px,py) || engine.get(px,py) !== EMPTY) return;

    // ① 雪桜 (Yukizakura): 半径2以内にSNOWがあれば雪桜色（白銀）の花びらを生成
    let nearSnow = false;
    outer_yuki: for (let sy = -2; sy <= 2; sy++) {
      for (let sx = -2; sx <= 2; sx++) {
        if (engine.get(x+sx, y+sy) === SNOW) { nearSnow = true; break outer_yuki; }
      }
    }
    const fi = engine.idx(px, py);
    engine.cells[fi]   = SAKURA_PETAL;
    engine.colors[fi]  = nearSnow
      ? YUKIZAKURA_PETAL_COLS[Math.floor(Math.random() * YUKIZAKURA_PETAL_COLS.length)]
      : SAKURA_PETAL_COLS[Math.floor(Math.random() * SAKURA_PETAL_COLS.length)];
    engine.meta[fi]    = 50 + Math.floor(Math.random() * 30); // 寿命: 50-79
    engine.updated[fi] = 1;

  } else {
    // ──── Phase 3: 散り期 ────────────────────────────────────────────────
    if (Math.random() < 0.004) { engine.set(x, y, EMPTY); return; } // 0.4%/frame で消滅

    // 最後の花びらを散らす
    if (Math.random() > 0.025) return;
    const petalDirs = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1],[0,1]];
    const pd = petalDirs[Math.floor(Math.random() * petalDirs.length)];
    const px = x+pd[0], py = y+pd[1];
    if (!engine.inBounds(px,py) || engine.get(px,py) !== EMPTY) return;

    const fi = engine.idx(px, py);
    engine.cells[fi]   = SAKURA_PETAL;
    engine.colors[fi]  = SAKURA_FADE_COLS[Math.floor(Math.random() * SAKURA_FADE_COLS.length)];
    engine.meta[fi]    = 15 + Math.floor(Math.random() * 20); // 散り期の花びらは短命
    engine.updated[fi] = 1;
  }
}

// ─── SAKURA_PETAL meta エンコーディング（フェーズ2更新） ─────────────────────
// bit  7   (0x80) = META_PETAL_FROZEN: 氷封フラグ（ICE接触で立つ、FIRE/LAVA/解氷で解除）
// bits 0-6 (0x7F) = 残り寿命カウンタ（生成時 15-79、0で消滅）
//
// 寿命の最大値 79 = 0x4F → bit 7 は通常 0。ビット演算で安全に共存。
// 凍結中: 寿命カウント停止・移動停止・薄い青白色（0xC8E8FF）で静止
// 解凍条件: 隣接 ICE が消える OR 隣接 FIRE/LAVA → ピンクに戻り舞い始める
// ─────────────────────────────────────────────────────────────────────────────

function updateSakuraPetal(engine, x, y) {
  const i        = engine.idx(x, y);
  const rawMeta  = engine.meta[i];
  const isFrozen = (rawMeta & META_PETAL_FROZEN) !== 0;          // ④ bit 7 = 凍結フラグ
  const life     = rawMeta === 0 ? 65 : rawMeta & 0x7F;          // bits 0-6 = 実際の寿命（0-79）
  //               ↑ meta=0 はパレット直置き（engine.set は meta を初期化しないため）

  // ──── ④ 凍結状態の処理 ─────────────────────────────────────────────────────
  if (isFrozen) {
    const nb4f = [[0,1],[1,0],[-1,0],[0,-1]];
    let hasIce = false, hasHeat = false;
    for (const [dx,dy] of nb4f) {
      const n = engine.get(x+dx, y+dy);
      if (n === ICE)                hasIce  = true;
      if (n === FIRE || n === LAVA) hasHeat = true;
    }
    if (hasHeat || !hasIce) {
      // 火・溶岩 OR 氷が隣から消えた → 解凍して再び舞い始める
      engine.meta[i]   = life; // bit 7 をクリア（寿命値はそのまま保持）
      engine.colors[i] = SAKURA_PETAL_COLS[Math.floor(Math.random() * SAKURA_PETAL_COLS.length)];
    }
    return; // 凍結中はここで処理終了（移動・寿命カウントなし）
  }

  // ──── 通常状態 ─────────────────────────────────────────────────────────────
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === FIRE || n === LAVA) { engine.set(x, y, EMPTY); return; }
    // ④ 氷封の花: ICE に触れると凍結フラグ (bit 7) をセットして静止
    if (n === ICE) {
      engine.meta[i]   = META_PETAL_FROZEN | life; // bit 7 をセット、life 値を保持
      engine.colors[i] = 0xC8E8FF;                 // 氷のような薄い青白色
      return;
    }
  }

  // 水の上に乗ると溶ける（3%/frame）
  if (engine.get(x, y+1) === WATER && Math.random() < 0.03) {
    engine.set(x, y, EMPTY); return;
  }

  // 寿命のデクリメント（7%/frame）。life は bits 0-6 の値。
  if (Math.random() < 0.07) {
    if (life <= 1) {
      // ② 落花の恵み (Hanabira Compost): 真下が土/泥のとき肥沃フラグを立てて消滅
      if (engine.inBounds(x, y+1)) {
        const bi    = engine.idx(x, y+1);
        const btype = engine.cells[bi];
        const bmeta = engine.meta[bi];
        if (btype === SOIL && bmeta === 0) {
          engine.meta[bi]   = META_SOIL_PETAL;
          engine.colors[bi] = 0x6B4A28;
        } else if (btype === MUD && bmeta === 0) {
          engine.meta[bi]   = META_MUD_PETAL;
          engine.colors[bi] = 0x7A4A32;
        }
        // meta=1(灰肥沃) / meta=2(墨水) は上書きしない
      }
      engine.set(x, y, EMPTY); return;
    }
    engine.meta[i] = life - 1; // bit 7 は 0 なので直接代入で安全
    if (life < 15) {
      engine.colors[i] = 0xFFF8FB;
    } else if (life < 30) {
      engine.colors[i] = 0xFFEEF5;
    }
  }

  // ヒラヒラ移動（60%/frame の確率で動く）
  if (Math.random() > 0.60) return;

  const r = Math.random();
  let dx = 0, dy = 0;
  if      (r < 0.28) { dx =  0; dy = 1;  }
  else if (r < 0.53) { dx = -1; dy = 1;  }
  else if (r < 0.78) { dx =  1; dy = 1;  }
  else if (r < 0.88) { dx = -1; dy = 0;  }
  else if (r < 0.95) { dx =  1; dy = 0;  }
  else if (r < 0.97) { dx = -1; dy = -1; }
  else               { dx =  1; dy = -1; }

  const nx = x+dx, ny = y+dy;
  if (engine.inBounds(nx, ny) && engine.get(nx, ny) === EMPTY) {
    engine.swap(x, y, nx, ny);
  }
}

// ─── FIREFLY meta エンコーディング ───────────────────────────────────────────
// meta = 明滅フェーズカウンタ（純粋な数値、0-255）
//
// 毎フレーム +3 でインクリメント（256でラップ）→ 1サイクル≈85frame≈1.4秒
// sin(meta * 2π / 255) で 0.0～1.0 の輝度を計算
// その輝度で色を動的補間: 暗黄(0x22,0x33,0x00) ↔ 明黄(0xFF,0xFF,0x44)
//
// 寿命: 0.25%/frame でランダム消滅 → 平均寿命≈7秒(@60fps)
// 天敵: 火・溶岩に隣接すると即消滅
// ─────────────────────────────────────────────────────────────────────────────

function updateFirefly(engine, x, y) {
  const i    = engine.idx(x, y);
  const meta = engine.meta[i];

  // 明滅フェーズを毎フレーム +3 で進める（255→0 でラップ）
  const newPhase = (meta + 3) & 0xFF;
  engine.meta[i] = newPhase;

  // サイン波で輝度を計算し、色を動的に書き換える
  const glow = (Math.sin(newPhase * 2 * Math.PI / 255) + 1) * 0.5; // 0.0 ～ 1.0
  const r = Math.round(0x22 + glow * (0xFF - 0x22));
  const g = Math.round(0x33 + glow * (0xFF - 0x33));
  const b = Math.round(0x00 + glow * (0x44 - 0x00));
  engine.colors[i] = (r << 16) | (g << 8) | b;

  // 寿命: 0.25%/frame でランダム消滅（平均 ~7秒 @ 60fps）
  if (Math.random() < 0.0025) { engine.set(x, y, EMPTY); return; }

  // 火・溶岩・GLOW_FUNGUS の隣接チェック
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === FIRE || n === LAVA) { engine.set(x, y, EMPTY); return; }
    // ⑦ 蛍と発光菌の共鳴: GLOW_FUNGUS に触れると光を手渡して儚く消える（一期一会）
    // meta=255 は既存の連鎖爆発フラグなので触らない。15%/frame で発火。
    if (n === GLOW_FUNGUS) {
      const gi = engine.idx(x+dx, y+dy);
      if (engine.meta[gi] !== 255 && Math.random() < 0.15) {
        engine.meta[gi] = 200; // 共鳴タイマーをセット（200フレーム ≈ 3.3秒）
        engine.set(x, y, EMPTY); // 蛍は光を手渡して消える
        return;
      }
    }
  }

  // フワフワ移動: 重力に逆らって上へ（70%/frame で移動試行）
  if (Math.random() > 0.70) return;

  const r2 = Math.random();
  let mx = 0, my = 0;
  if      (r2 < 0.40) { mx =  0; my = -1; } // 真上（40%）
  else if (r2 < 0.62) { mx = -1; my = -1; } // 斜め上左（22%）
  else if (r2 < 0.84) { mx =  1; my = -1; } // 斜め上右（22%）
  else if (r2 < 0.92) { mx = -1; my =  0; } // 左ドリフト（8%）
  else                { mx =  1; my =  0; } // 右ドリフト（8%）

  const nx = x+mx, ny = y+my;
  if (engine.inBounds(nx, ny) && engine.get(nx, ny) === EMPTY) {
    engine.swap(x, y, nx, ny); return;
  }
  // 上方向が塞がれたら横に逃げる
  const alt = Math.random() > 0.5 ? 1 : -1;
  if (engine.inBounds(x+alt, y) && engine.get(x+alt, y) === EMPTY) {
    engine.swap(x, y, x+alt, y);
  }
}

// ─── Pollen update functions ──────────────────────────────────────────────────

// 花粉放出ヘルパー（FLOWER/DARK_FLOWER/SAKURA_TREE Phase2 の共通ロジック）
// geneIdx: 遺伝子インデックス（0-7）  isDark: DARK_FLOWER 由来かどうか
function _emitPollen(engine, x, y, geneIdx, isDark) {
  if (!engine.inBounds(x, y-1) || engine.get(x, y-1) !== EMPTY) return;
  const driftDir   = Math.random() > 0.5 ? POLLEN_DRIFT : 0;
  const pollenMeta = (geneIdx & POLLEN_GENE)
    | (isDark ? POLLEN_DARK : 0)
    | driftDir
    | (7 << POLLEN_LIFE_SHIFT); // 寿命 = 7（最大値）
  const pi = engine.idx(x, y-1);
  engine.cells[pi]   = POLLEN;
  engine.colors[pi]  = POLLEN_COLS[Math.floor(Math.random() * POLLEN_COLS.length)];
  engine.meta[pi]    = pollenMeta;
  engine.updated[pi] = 1;
}

// FLOWER: 静的だが花粉を放出する（update: null → updateFlower に変更）
function updateFlower(engine, x, y) {
  if (Math.random() < 0.00005) { // 0.005%/frame
    const pm = engine.meta[engine.idx(x, y)];
    _emitPollen(engine, x, y, pm & POLLEN_GENE, (pm & META_DARK) !== 0);
  }
}

// DARK_FLOWER: 同上（isDark = true）
function updateDarkFlower(engine, x, y) {
  if (Math.random() < 0.00005) {
    const pm = engine.meta[engine.idx(x, y)];
    _emitPollen(engine, x, y, pm & POLLEN_GENE, true);
  }
}

// ─── POLLEN 物理挙動 ──────────────────────────────────────────────────────────
// ・逆重力: 30% で上昇、35% で横ドリフト（meta の方向ビットで左右固定）、35% で静止
// ・寿命: 0.8%/frame でデクリメント。0 になったら EMPTY へ
// ・FLOWER: 受粉（遺伝子色上書き）、PLANT: 0.5% で早期開花、
//   WATER: 黄みがかった色に染色、ICE: 氷封静止（寿命停止）、SAKURA_PETAL: 相殺
// ─────────────────────────────────────────────────────────────────────────────
function updatePollen(engine, x, y) {
  const i    = engine.idx(x, y);
  const meta = engine.meta[i];

  // パレット直置き（meta=0）の場合は寿命を初期化して次フレームから動く
  if (meta === 0) {
    const driftDir = Math.random() > 0.5 ? POLLEN_DRIFT : 0;
    engine.meta[i] = driftDir | (7 << POLLEN_LIFE_SHIFT);
    return;
  }

  const geneIdx = meta & POLLEN_GENE;                         // bits 0-2: 遺伝子
  const driftR  = (meta & POLLEN_DRIFT) !== 0;                // bit 4: true=右
  const life    = (meta & POLLEN_LIFE) >> POLLEN_LIFE_SHIFT;  // bits 5-7: 寿命

  // ──── 隣接セルとの反応 ────────────────────────────────────────────────────
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  let iceAdjacent = false;
  for (const [dx,dy] of nb4) {
    const nx = x+dx, ny = y+dy;
    const n  = engine.get(nx, ny);
    const ni = engine.idx(nx, ny);

    if (n === FIRE || n === LAVA) { engine.set(x, y, EMPTY); return; }

    if (n === ICE) { iceAdjacent = true; continue; } // 氷封フラグを立てるだけ

    if (n === SAKURA_PETAL) {
      // 花びらと花粉が交差 → 互いに消滅（儚い出会い）
      engine.set(x, y, EMPTY);
      engine.set(nx, ny, EMPTY);
      return;
    }

    if (n === FLOWER) {
      // 受粉（60% の確率）: FLOWER の遺伝子色を花粉の遺伝子で上書き
      if (Math.random() < 0.60) {
        const flowerMeta = engine.meta[ni];
        engine.meta[ni]   = (flowerMeta & ~POLLEN_GENE) | geneIdx;
        // 視覚的にも即座に遺伝子色へ変化
        const isDark  = (flowerMeta & META_DARK)  !== 0;
        const isLotus = (flowerMeta & META_LOTUS) !== 0;
        engine.colors[ni] = isDark  ? DARK_F_COLORS[geneIdx]
                          : isLotus ? LOTUS_COLORS[geneIdx]
                          :           FLOWER_COLORS[geneIdx];
        engine.set(x, y, EMPTY);
        return;
      }
    }

    if (n === PLANT && Math.random() < 0.005) {
      // 早期開花（0.5%）: PLANT → FLOWER（遺伝子色で咲く）
      engine.cells[ni]   = FLOWER;
      engine.colors[ni]  = FLOWER_COLORS[geneIdx];
      engine.meta[ni]    = geneIdx;
      engine.updated[ni] = 1;
      engine.set(x, y, EMPTY);
      return;
    }

    if (n === WATER) {
      // 花粉水: 水の色を黄みがかった色に染める（花粉自身は消えない）
      engine.colors[ni] = 0xD4B83A;
    }
  }

  // ──── 氷封の花粉: ICE 隣接中は静止・寿命停止 ──────────────────────────────
  if (iceAdjacent) {
    engine.colors[i] = 0xFFEE88; // 薄い黄白色（氷に閉じ込められた花粉）
    return;
  }

  // ──── 寿命デクリメント（0.8%/frame）─────────────────────────────────────────
  if (Math.random() < 0.008) {
    if (life === 0) { engine.set(x, y, EMPTY); return; }
    engine.meta[i] = (meta & ~POLLEN_LIFE) | ((life - 1) << POLLEN_LIFE_SHIFT);
  }

  // ──── 浮遊移動（逆重力型）────────────────────────────────────────────────────
  const r       = Math.random();
  const driftDx = driftR ? 1 : -1;

  if (r < 0.30) {
    // 上昇（30%）
    if (engine.inBounds(x, y-1) && engine.get(x, y-1) === EMPTY) {
      engine.swap(x, y, x, y-1); return;
    }
  } else if (r < 0.65) {
    // 横ドリフト（35%）: meta に記録された方向へ。塞がれたら反転
    if (engine.inBounds(x+driftDx, y) && engine.get(x+driftDx, y) === EMPTY) {
      engine.swap(x, y, x+driftDx, y); return;
    }
    if (engine.inBounds(x-driftDx, y) && engine.get(x-driftDx, y) === EMPTY) {
      engine.meta[i] ^= POLLEN_DRIFT; // ドリフト方向を反転して記憶
      engine.swap(x, y, x-driftDx, y); return;
    }
  }
  // 残り 35%: その場に漂う（何もしない）
}

// ─── KOI update functions ────────────────────────────────────────────────────

// KOI_BODY: 鯉の胴体ボディセル（updateKoi が頭移動のたびに管理する）
// 自律的には動かない（static）。頭が動くときに一括クリア→再生成される。
function updateKoiBody(engine, x, y) { return; }

// ─── KOI meta エンコーディング ────────────────────────────────────────────────
// bits 0-2 (0x07): 移動方向インデックス（0-7、KOI_DIRS に対応）
// bits 3-7       : 予約
//
// 視覚的集合体の構成（頭を中心とした 3×3 ブロック）:
//   [BODY][KOI ][BODY]   ← y
//   [BODY][BODY][BODY]   ← y+1
//   [BODY][BODY][BODY]   ← y+2
//
// 頭が移動するたびに「旧ボディをクリア → 新ボディを生成」する
// 物理的な swap は頭セル 1 個のみ。ボディは WATER との色の上書きにすぎない。
// ─────────────────────────────────────────────────────────────────────────────
function updateKoi(engine, x, y) {
  if (Math.random() > 0.15) return;

  const i    = engine.idx(x, y);
  const meta = engine.meta[i];
  const dir  = meta & 0x07;

  // ──── 死亡判定（4方向に ACID/LAVA があれば消滅）────────────────────────────
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx, dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === ACID || n === LAVA) {
      engine.set(x, y, EMPTY);
      return;
    }
  }

  // ──── 移動ロジック ────────────────────────────────────────────────────────
  const [dx, dy] = KOI_DIRS[dir];
  const nx = x+dx, ny = y+dy;

  if (engine.inBounds(nx, ny)) {
    const target = engine.get(nx, ny);
    // 水、または自分のボディの中を泳げる
    if (target === WATER || target === KOI_BODY) {
      const koiColor = engine.colors[i];

      // ★ 移動前: 旧ボディをすべて水に戻す（x±1, y〜y+2）
      for (let bx = -1; bx <= 1; bx++) {
        for (let by = 0; by <= 2; by++) {
          if (bx === 0 && by === 0) continue; // 頭は消さない
          const cx = x+bx, cy = y+by;
          if (engine.inBounds(cx, cy) && engine.get(cx, cy) === KOI_BODY) {
            engine.set(cx, cy, WATER);
          }
        }
      }

      // ★ 頭を移動（物理的な swap はこの 1 回のみ）
      engine.swap(x, y, nx, ny);

      // ★ 移動後: 新しい頭を中心に 3×3 のボディを生成（WATER セルのみ上書き）
      for (let bx = -1; bx <= 1; bx++) {
        for (let by = 0; by <= 2; by++) {
          if (bx === 0 && by === 0) continue; // 頭は上書きしない
          const cx = nx+bx, cy = ny+by;
          if (engine.inBounds(cx, cy) && engine.get(cx, cy) === WATER) {
            const bi = engine.idx(cx, cy);
            engine.cells[bi]   = KOI_BODY;
            engine.colors[bi]  = koiColor; // 頭と同じ錦鯉色
            engine.updated[bi] = 1;
          }
        }
      }

      // 5% の確率でランダムに向きを変える（自然な揺らぎ）
      if (Math.random() < 0.05) {
        engine.meta[engine.idx(nx, ny)] = (meta & ~0x07) | Math.floor(Math.random() * 8);
      }
      return;
    }
  }

  // 障害物 or 水以外 → 向きをランダムに変えて待機（次フレームで再試行）
  engine.meta[i] = (meta & ~0x07) | Math.floor(Math.random() * 8);
}

// ─── Ma Void update function ─────────────────────────────────────────────────

// ─── MA_VOID 動作仕様 ─────────────────────────────────────────────────────────
// ★ 静的素材: 重力なし。落下せず、その場に留まる。
//
// 【崩壊条件】8方向確認:
//   EMPTY（MA_VOID ではない真の空間）/ LAVA / ACID が隣接 → 自身が EMPTY に消滅
//   → 密閉された空間（石・壁で囲まれた場所）でのみ存在できる
//
// 【聖域内の干渉】4方向確認（1フレームに1反応・戻り値で終了）:
//   FIRE       → 即消去（穢れの浄化）
//   ASH        → 5%  で EMPTY（無に還る）
//   DARK_PLANT → 1%  で PLANT（闇が光に）。META_DARK / META_ICE_CRYSTAL を解除
//   SEED       → 10% で SAKURA_TREE Phase2（白い桜として直接開花）
//   SAKURA_PETAL → swap（浮遊演出: 花びらが落ちずに漂う）
//
// パフォーマンス: 20%/frame のみ処理（Math.random() > 0.2 でスキップ）
// ─────────────────────────────────────────────────────────────────────────────
function updateMaVoid(engine, x, y) {
  // 処理頻度を 10% に絞る（パフォーマンス確保 + 全体的な動作速度の抑制）
  if (Math.random() > 0.1) return;

  // ──── 聖域崩壊チェック（8方向）─────────────────────────────────────────────
  // ・LAVA / ACID → 即死（侵食）
  // ・EMPTY       → isExposed フラグを立てるのみ（ループ内では確率ロールしない）
  //
  // ループの「外」で 1 回だけ風化ロールを行うことで多重判定を防止する。
  // 実効崩壊確率: 10% × 2% = 0.2%/frame → 平均寿命 ~8〜10 秒 (@ 60fps)
  // → プレイヤーが箱の内部を塗りつぶすのに十分な猶予が生まれる
  let isExposed = false;
  const nb8 = [[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
  for (const [dx, dy] of nb8) {
    const nx = x+dx, ny = y+dy;
    if (!engine.inBounds(nx, ny)) continue;
    const n = engine.get(nx, ny);
    if (n === LAVA || n === ACID) {
      engine.set(x, y, EMPTY); return; // 汚染による即死
    }
    if (n === EMPTY) {
      isExposed = true; // 外気に触れているフラグ（ここでは消さない）
    }
  }

  // ループを抜けた後で 1 回だけ風化判定（多重ロール完全防止）
  // 10% × 1% = 0.1%/frame → 平均寿命 ~16.6秒（@ 60fps）
  if (isExposed && Math.random() < 0.01) {
    engine.set(x, y, EMPTY); return; // ゆっくりとした風化消滅
  }

  // ──── 聖域内の干渉（4方向のみ）──────────────────────────────────────────────
  // 1反応/フレーム: return で打ち切り
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    const nx = x+dx, ny = y+dy;
    const n  = engine.get(nx, ny);
    const ni = engine.idx(nx, ny);

    // 穢れの浄化: FIRE を即消去
    if (n === FIRE) {
      engine.set(nx, ny, EMPTY);
      return;
    }

    // 無への還元: ASH を 5% で消滅
    if (n === ASH && Math.random() < 0.05) {
      engine.set(nx, ny, EMPTY);
      return;
    }

    // 闇の浄化: DARK_PLANT → PLANT（1%）
    // META_DARK(0x10) と META_ICE_CRYSTAL(0x40) を解除し、明るい茎色に変換
    if (n === DARK_PLANT && Math.random() < 0.01) {
      engine.cells[ni]   = PLANT;
      engine.colors[ni]  = STEM_COLORS[Math.floor(Math.random() * STEM_COLORS.length)];
      engine.meta[ni]    = engine.meta[ni] & ~(META_DARK | META_ICE_CRYSTAL);
      engine.updated[ni] = 1;
      return;
    }

    // 聖域の発芽: SEED → 白い桜の木（Phase 2 = 即開花）（10%）
    // 土も水もなくとも聖域の力で直接開花フェーズから始まる
    if (n === SEED && Math.random() < 0.10) {
      engine.cells[ni]   = SAKURA_TREE;
      engine.colors[ni]  = 0xFFFFFF; // 白い桜（幽玄な聖域の木）
      engine.meta[ni]    = 64;        // Phase 2 直入り（開花）
      engine.updated[ni] = 1;
      return;
    }

    // 花びらの浮遊: MA_VOID の「真下」にある花びらのみ上へ押し上げる
    // dy=1  → neighbor は (x, y+1) = MA_VOID より下 = 花びらが下にある → swap で花びらが上昇 ✓
    // dy=-1 → neighbor は (x, y-1) = MA_VOID より上 = 花びらが上にある → swap すると下降してしまう ✗（除外）
    // dx=±1 → 横方向は中立（横移動のみ、浮遊ドリフトに使用）
    if (n === SAKURA_PETAL && (dy === 1 || dx !== 0)) {
      engine.swap(x, y, nx, ny);
      return;
    }
  }
}

// ─── Material definitions ──────────────────────────────────────────────────────
export const MATERIALS = {
  [EMPTY]:       { name: 'empty',       colors: [],                                                                    update: null            },
  [SAND]:        { name: 'sand',        colors: [0xC2A35A,0xD4B56A,0xB8943E,0xCFAF58,0xBFA050,0xC8AB62],              update: updateSand      },
  [WATER]:       { name: 'water',       colors: [0x3A7BD5,0x2E6BC4,0x4A8BE5,0x3575D0,0x5090DF,0x2D65C0],              update: updateWater     },
  [WALL]:        { name: 'wall',        colors: [0x888888,0x777777,0x999999,0x828282,0x6E6E6E],                        update: null            },
  [SNOW]:        { name: 'snow',        colors: [0xEEEEFF,0xFFFFFF,0xDDDDEE,0xF0F0FF,0xE8E8F8,0xF5F5FF],              update: updateSnow      },
  [FIRE]:        { name: 'fire',        colors: [0xFF4400,0xFF6600,0xFF2200,0xFF8800,0xFFAA00,0xFF3300],                update: updateFire      },
  [OIL]:         { name: 'oil',         colors: [0x8B6914,0x7A5C10,0x9B7824,0x6E5010,0xA08030],                       update: updateOil       },
  [LAVA]:        { name: 'lava',        colors: [0xFF4500,0xFF6000,0xFF2200,0xFF7700,0xFF5500,0xEE4000],                update: updateLava      },
  [SMOKE]:       { name: 'smoke',       colors: [0x555555,0x444444,0x666666,0x4A4A4A,0x505050],                        update: updateSmoke     },
  [ASH]:         { name: 'ash',         colors: [0xBBBBBB,0xAAAAAA,0xCCCCCC,0xB8B8B8,0xC4C4C4],                       update: updateAsh       },
  [COAL]:        { name: 'coal',        colors: [0x222222,0x1A1A1A,0x2A2A2A,0x1E1E1E,0x252525],                       update: updateCoal      },
  [STONE]:       { name: 'stone',       colors: [0x5A5A5A,0x4E4E4E,0x686868,0x525252,0x606060],                       update: null            },
  [GLASS]:       { name: 'glass',       colors: [0xB8E0FF,0xC0E8FF,0xA8D8F0,0xCCEEFF,0xD0F0FF],                       update: null            },
  [SOIL]:        { name: 'soil',        colors: [0x5C3D1E,0x4A2E12,0x6B4A28,0x523518,0x3E2810],                       update: updateSoil      },
  [SEED]:        { name: 'seed',        colors: [0xA8C060,0x90A840,0xB8D070,0x98B848,0xC0D878],                       update: updateSeed      },
  [PLANT]:       { name: 'plant',       colors: [0x3D7A25,0x4A8A2C,0x52A030,0x2D5A1B,0x5AB038],                       update: updatePlant     },
  [DARK_PLANT]:  { name: 'dark_plant',  colors: [0x1A081A,0x220A22,0x2A0A2A,0x300A30,0x1E081E],                       update: updateDarkPlant },
  [FUNGUS]:      { name: 'fungus',      colors: [0x4A2060,0x3A1050,0x5A3070,0x441858,0x3C1060],                       update: updateFungus    },
  [GLOW_FUNGUS]: { name: 'glow_fungus', colors: [0x00FFCC,0x00DDAA,0x00FFAA,0x33FFDD,0x00EEC0],                       update: updateGlowFungus},
  [FLOWER]:      { name: 'flower',      colors: [...FLOWER_COLORS, FLOWER_CENTER],                                     update: updateFlower     },
  [DARK_FLOWER]: { name: 'dark_flower', colors: [...DARK_F_COLORS, DARK_F_CENTER],                                     update: updateDarkFlower },
  [METAL]:       { name: 'metal',       colors: [0xB0B8C8,0x909AAA,0xC0C8D8,0xA0A8B8,0x8090A0,0xC8D0E0],              update: updateMetal     },
  [LIGHTNING]:   { name: 'lightning',   colors: [0xFFFFFF,0xEEEEFF,0xCCDDFF,0xAABBFF,0xDDEEFF,0xFFFFEE],              update: updateLightning },
  [SPARK]:       { name: 'spark',       colors: [0x88CCFF,0xAADDFF,0x66BBEE,0xCCEEFF,0x99DDFF,0x55AAEE],              update: updateSpark     },
  [RUST]:        { name: 'rust',        colors: [0xB7410E,0xC0622A,0x9E2800,0xD4652B,0x8B3010,0xCC5218,0xA03818],                       update: updateRust      },
  [STEAM]:       { name: 'steam',       colors: [0xDDEEFF,0xCCDDF0,0xEEEEFF,0xC8D8E8,0xD8E8F8,0xE8F0FF],              update: updateSteam     },
  [ACID]:        { name: 'acid',        colors: [0x66FF33,0x44EE22,0x55DD44,0x88FF66,0x33CC11,0x77EE55],               update: updateAcid      },
  [MUD]:         { name: 'mud',         colors: [0x6B4226,0x5A3520,0x7B4A30,0x4A2D18,0x634030,0x523525],              update: updateMud       },
  [ICE]:         { name: 'ice',         colors: [0xAADDFF,0xBBEEFF,0x99CCEE,0xCCEEFF,0xB0DDFF,0x88CCEE],              update: updateIce       },
  [HARD_SOIL]:   { name: 'hard_soil',   colors: [0xC47A45,0xB86838,0xD48855,0xA85C30,0xCC7A40],                       update: null            },
  [ACID_PLANT]:  { name: 'acid_plant',  colors: [...ACID_STEM_COLS],                                                   update: updateAcidPlant },
  [OBSIDIAN]:    { name: 'obsidian',    colors: [0x1A1A2E,0x2A1A3E,0x0D0D1E,0x1E1428,0x120E22],                       update: updateObsidian  },
  [SANDSTONE]:   { name: 'sandstone',   colors: [0xC4A35A,0xD4B46A,0xB8943E,0xCCA850,0xC8A045],                       update: updateSandstone },
  [BASALT]:      { name: 'basalt',      colors: [0x2A1A1A,0x1E1212,0x3A2020,0x2E1818,0x1A1010],                       update: updateBasalt    },
  [SPRING]:      { name: 'spring',      colors: [0x1A88DD,0x2299EE,0x1177CC,0x0E66BB,0x2AA0FF],                       update: updateSpring    },
  [LAVA_SPRING]:  { name: 'lava_spring',  colors: [0xFF3300,0xEE2200,0xFF4411,0xDD1100,0xCC2200],                        update: updateLavaSpring  },
  // ── Wabi-Sabi ──────────────────────────────────────────────────────────────
  [SAKURA_SEED]:  { name: 'sakura_seed',  colors: [...SAKURA_SEED_COLS],                                                 update: updateSakuraSeed  },
  [SAKURA_TREE]:  { name: 'sakura_tree',  colors: [...SAKURA_TRUNK_COLS, ...SAKURA_BRANCH_COLS],                         update: updateSakuraTree  },
  [SAKURA_PETAL]: { name: 'sakura_petal', colors: [...SAKURA_PETAL_COLS],                                                update: updateSakuraPetal },
  [FIREFLY]:      { name: 'firefly',      colors: [...FIREFLY_COLS],                                                     update: updateFirefly     },
  [POLLEN]:       { name: 'pollen',       colors: [...POLLEN_COLS],                                                      update: updatePollen      },
  [MA_VOID]:      { name: 'ma_void',      colors: [...MA_VOID_COLS],                                                     update: updateMaVoid      },
  [KOI]:          { name: 'koi',          colors: [...KOI_COLS],                                                         update: updateKoi         },
  [KOI_BODY]:     { name: 'koi_body',    colors: [...KOI_COLS],                                                         update: updateKoiBody     },
};

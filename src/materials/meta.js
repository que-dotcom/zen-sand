import {
  STONE, WALL, BASALT, METAL, SANDSTONE, OBSIDIAN, GLASS
} from './ids.js';

// ─── Plant meta encoding (Uint8) ──────────────────────────────────────────────
// bits 0-2: flower color index (0-7)
// bit  3  : size flag (0=small, 1=large)
// bit  4  : dark flag (0=normal, 1=dark)
// bit  5  : lotus flag (MUD-grown plant)
export const META_COLOR = 0x07;
export const META_LARGE = 0x08;
export const META_DARK  = 0x10;
export const META_LOTUS = 0x20;
export const META_ICE_CRYSTAL = 0x40; // bit6: 氷晶フラグ（暗黒植物+氷で結晶化）
export const META_DORMANT     = 0x80; // bit7: 冬眠フラグ（種+氷で封印→溶解で一斉発芽）

export const LOTUS_COLORS    = [0xFF99CC,0xFFCCFF,0xCC88FF,0xFFEEAA,0x88DDFF,0xAAFFDD,0xFF77AA,0xDDAAFF];
export const LOTUS_CENTER    = 0xFFFF44;
export const LOTUS_STEM_COLS = [0x1A4A2A,0x2A5A32,0x3A6A3A,0x1E3A26,0x224A2E];

export const FLOWER_COLORS  = [0xFF6688, 0xFFDD44, 0xFF88BB, 0xFFEEEE, 0xFF9944, 0x99EEAA, 0xCC88FF, 0x88CCFF];
export const DARK_F_COLORS  = [0xAA00BB, 0x990022, 0x440044, 0x001144, 0x220033, 0x004422, 0x550000, 0x330044];
export const STEM_COLORS    = [0x2D5A1B, 0x3D7A25, 0x4A8A2C, 0x52A030, 0x5AB038];
export const DARK_STEM_COLS = [0x1A081A, 0x220A22, 0x2A0A2A, 0x300A30, 0x1E081E];
export const FLOWER_CENTER  = 0xFFFF99; // stamen
export const DARK_F_CENTER  = 0x220022;
export const ICE_CRYSTAL_STEM   = [0x001A33, 0x002244, 0x003355, 0x001528, 0x002030];
export const ICE_CRYSTAL_FLOWER = [0xAAEEFF, 0x88DDFF, 0xCCF8FF, 0x77CCEE, 0xBBEEFF];
export const ICE_CRYSTAL_CENTER = 0xEEFFFF;
export const ACID_STEM_COLS   = [0x4A8000, 0x3A6600, 0x5A9900, 0x2E5200, 0x668800];
export const ACID_FLOWER_COLS = [0xAAFF00, 0x88EE00, 0xCCFF22, 0x66CC00, 0xBBFF44];
const ACID_F_CENTER    = 0x1A2200;

// ─── Wabi-Sabi color palettes ─────────────────────────────────────────────────
// 桜の幹・枝・開花・散花・花びら・種
export const SAKURA_TRUNK_COLS  = [0x3D1A08, 0x4A220E, 0x2D1206, 0x5A2A12, 0x3A1808];
export const SAKURA_BRANCH_COLS = [0x7A3518, 0x8A4020, 0x6A2C14, 0x904528, 0x6E3010];
export const SAKURA_BLOOM_COLS  = [0xFFB7C5, 0xFF9DB5, 0xFFCCD5, 0xFFAABB, 0xFFC8D8, 0xFF8BAE];
export const SAKURA_FADE_COLS   = [0xFFE8EE, 0xFFDDE5, 0xFFF0F5, 0xFFE4EC];
export const SAKURA_PETAL_COLS  = [0xFFCCDD, 0xFFBBCC, 0xFFD5E5, 0xFFB0C8, 0xFFC0D0, 0xFFE8F2];
export const YUKIZAKURA_PETAL_COLS = [0xFFF0F8, 0xF8F0FF, 0xF0EEFF, 0xFFF8FF, 0xE8F0FF, 0xF5F8FF]; // ① 雪桜: 白銀・淡青白
export const SAKURA_SEED_COLS   = [0xC0784E, 0xAA6040, 0xD08858, 0xB87050, 0xC87848];
// 蛍（動的に書き換えるのでデフォルト色のみ）
export const FIREFLY_COLS = [0xFFFF44, 0xFFEE22, 0xFFFF66, 0xFFF020, 0xFFEE44];
// 花粉
export const POLLEN_COLS  = [0xFFEE44, 0xFFDD22, 0xFFEE66, 0xFFCC00, 0xFFEE88, 0xFFDD55];
// 間（MA_VOID）: 背景(0x0A0A0A)とわずかに異なる幽玄な暗色
export const MA_VOID_COLS = [0x08080C, 0x090910, 0x07070A, 0x0A0A0E, 0x080A0D];
// 鯉（KOI）: 錦鯉カラー（白・赤・黒・橙のバリエーション）
export const KOI_COLS = [0xFFFFFF, 0xEEEEEE, 0xEE3322, 0xDD2211, 0x111111, 0x222222, 0xFF6600];
// 鯉の移動方向テーブル（8方向、インデックス 0-7）
//   0:[上] 1:[右上] 2:[右] 3:[右下] 4:[下] 5:[左下] 6:[左] 7:[左上]
export const KOI_DIRS = [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
// 振動波（VIBRATION）
export const VIBRATION_COLS = [0xFFFFFF, 0xEEEEFF, 0xDDDDFF]; // 白青の閃光色

// 伝導体インデックステーブル（3ビットで表現 → meta に収める鍵）
// index: 0=STONE  1=WALL  2=BASALT  3=METAL  4=SANDSTONE  5=OBSIDIAN  6=GLASS
// Phase 1 では 0(STONE) と 1(WALL) のみ通過可能
export const CONDUCTOR_IDS = [STONE, WALL, BASALT, METAL, SANDSTONE, OBSIDIAN, GLASS];

// VIBRATION meta エンコード定数（8ビット = 元素材3 + 方向3 + 強度2）
//   bit 2-0 (VIB_MAT_MASK) : 元素材インデックス（CONDUCTOR_IDS の添字）
//   bit 5-3 (VIB_DIR_MASK) : 進行方向（0-7、VIB_DIRS に対応）
//   bit 7-6 (VIB_STR_MASK) : 強度（0=弱 〜 3=雷直撃）
export const VIB_MAT_MASK  = 0x07;
export const VIB_DIR_MASK  = 0x38;
export const VIB_DIR_SHIFT = 3;
export const VIB_STR_MASK  = 0xC0;
export const VIB_STR_SHIFT = 6;

// 8方向テーブル（KOI_DIRS と同一レイアウト。共通化は Phase 2 以降で検討）
export const VIB_DIRS = [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];

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
export const POLLEN_GENE       = 0x07; // bits 0-2: 遺伝子インデックス
export const POLLEN_DARK       = 0x08; // bit  3:   暗変異フラグ
export const POLLEN_DRIFT      = 0x10; // bit  4:   ドリフト方向（0=左、1=右）
export const POLLEN_LIFE       = 0xE0; // bits 5-7: 寿命
export const POLLEN_LIFE_SHIFT = 5;    // bits 5-7 へのシフト量

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
export const META_SOIL_PETAL = 4; // SOIL: 花びら由来の肥沃
export const META_MUD_SUMI   = 2; // MUD:  墨水（炭+水）
export const META_MUD_PETAL  = 3; // MUD:  花びら由来の肥沃
// SAKURA_PETAL:
//   bit  7 (0x80) = META_PETAL_FROZEN: 氷封フラグ（ICE接触で立つ、FIRE/LAVA/解氷で解除）
//   bits 0-6      = 残り寿命（最大79 = 0x4F → bit 7 は通常 0。衝突なし）
export const META_PETAL_FROZEN = 0x80;

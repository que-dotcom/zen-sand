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
export const GOLD         = 45; // 金（溶けた金。最重量級の粘性液体、割れ目で凝固）
export const KINTSUGI     = 46; // 金継ぎ（金が割れ目で固まった継ぎ目。非パレット・反応生成のみ）
// ─── 振動波（内部素材、パレット不使用）─────────────────────────────────────────
export const VIBRATION = 44; // 雷が伝導体に命中した際に発生する衝撃波信号

// 鯉のボディ（KOI_BODY）: パレット非表示・内部専用素材
// KOI（頭）が移動するたびに周囲の WATER を KOI_BODY で塗り直す
// → 3x3 の視覚的集合体として「錦鯉ブロック」を表現する
export const KOI_BODY = 43;

// ─── 気候・温度の基準値 ───────────────────────────────────────────────────────
// 温度は 0〜255 の相対値。実際の ℃ には対応させず、素材の相変化が起きる関係だけを保つ。
//   氷結 < 気温（地表〜上空） < 沸騰 < 発火 < 岩の融点 < 溶岩
// 気温は高度で下がる（高いほど冷たい）。上空ほど水蒸気が露点に達しやすくなる。

export const T_FREEZE   = 80;   // これ以下の水は氷になる
export const T_ICE_MELT = T_FREEZE; // 氷・雪はこれを超えると融けはじめる（融けきるには潜熱の分だけ熱が要る。thermal.js）
export const T_DEW      = 96;   // これを下回った水蒸気は凝結して雲になる
export const T_BOIL     = 150;  // これ以上の水は沸騰して蒸気になる

export const T_AMBIENT_GROUND = 108; // 地表（高度 0）の気温
export const T_AMBIENT_TOP    = 86;  // 最上段（高度 1）の気温。氷点よりは上に保つ（上空で水が凍ると雨が降らなくなるため）

export const T_IGNITE_OIL   = 165;
export const T_IGNITE_PLANT = 185;
export const T_IGNITE_COAL  = 200;
export const T_SOIL_DRY     = 135;  // これ以上に温まり、水気のない土は乾いて砂になる
export const T_SOIL_BURN    = 175;  // これ以上に熱された土は焼けて灰になる
export const T_LAVA_SOLID   = 170;  // これ以下の溶岩は固まって石になる
export const T_STONE_MELT   = 215;  // これ以上の石は溶けて溶岩になる
export const T_FIRE         = 215;
export const T_LAVA         = 255;

// 高度 alt（0 = 地表, 1 = 最上段）の気温
// shift は環境の気温の調整量（設定のスライダー）。高度による下がり方は変えず、全体を上下にずらす。
export function ambientAtAltitude(alt, shift = 0) {
  return T_AMBIENT_GROUND - (T_AMBIENT_GROUND - T_AMBIENT_TOP) * alt + shift;
}

// 設定できる地表の気温の範囲（0〜255 の範囲に収まり、上空の気温も 0 を下回らない）
export const T_AMBIENT_GROUND_MIN = 30;
export const T_AMBIENT_GROUND_MAX = 200;

// 気温が露点になる高度（これより上で蒸気が凝結しはじめる）
export const DEW_ALTITUDE = (T_AMBIENT_GROUND - T_DEW) / (T_AMBIENT_GROUND - T_AMBIENT_TOP);

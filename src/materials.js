// ─── Materials facade ─────────────────────────────────────────────────────────
// 実装は materials/ 以下に分割されている。
//   ids.js         素材ID定数        meta.js       meta ビット定義・パレット
//   basic.js       砂・水・火など基本  life.js       土・種・植物・菌類
//   fluids.js      蒸気・酸・泥・氷    geology.js    岩石・水源・酸性植物
//   electricity.js 金属・雷・振動波    sakura.js     桜・蛍
//   pollen.js      花粉・花           agents.js     鯉・間
//   registry.js    MATERIALS レジストリ
// 公開APIは分割前と同一（KOI_BODY / VIBRATION は内部専用のため非公開のまま）。
export {
  EMPTY, SAND, WATER, WALL, SNOW, FIRE, OIL, LAVA, SMOKE, ASH, COAL, STONE,
  GLASS, SOIL, SEED, PLANT, DARK_PLANT, FUNGUS, GLOW_FUNGUS, FLOWER, DARK_FLOWER,
  METAL, LIGHTNING, SPARK, RUST, STEAM, ACID, MUD, ICE, HARD_SOIL, ACID_PLANT,
  OBSIDIAN, SANDSTONE, BASALT, SPRING, LAVA_SPRING, SAKURA_SEED, SAKURA_TREE,
  SAKURA_PETAL, FIREFLY, POLLEN, MA_VOID, KOI, GOLD, KINTSUGI
} from './materials/ids.js';
export { MATERIALS } from './materials/registry.js';

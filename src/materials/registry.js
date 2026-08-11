import {
  EMPTY, SAND, WATER, WALL, SNOW, FIRE, OIL, LAVA, SMOKE, ASH, COAL, STONE,
  GLASS, SOIL, SEED, PLANT, DARK_PLANT, FUNGUS, GLOW_FUNGUS, FLOWER, DARK_FLOWER,
  METAL, LIGHTNING, SPARK, RUST, STEAM, ACID, MUD, ICE, HARD_SOIL, ACID_PLANT,
  OBSIDIAN, SANDSTONE, BASALT, SPRING, LAVA_SPRING, SAKURA_SEED, SAKURA_TREE,
  SAKURA_PETAL, FIREFLY, POLLEN, MA_VOID, KOI, KOI_BODY, VIBRATION, GOLD, KINTSUGI
} from './ids.js';
import {
  FLOWER_COLORS, FLOWER_CENTER, DARK_F_COLORS, DARK_F_CENTER, ACID_STEM_COLS,
  SAKURA_SEED_COLS, SAKURA_TRUNK_COLS, SAKURA_BRANCH_COLS, SAKURA_PETAL_COLS,
  FIREFLY_COLS, POLLEN_COLS, MA_VOID_COLS, KOI_COLS, VIBRATION_COLS,
  GOLD_COLS, KINTSUGI_COLS
} from './meta.js';
import {
  updateSand, updateWater, updateSnow, updateFire, updateOil, updateLava,
  updateSmoke, updateAsh, updateCoal
} from './basic.js';
import {
  updateSoil, updateSeed, updatePlant, updateDarkPlant, updateFungus, updateGlowFungus,
  updateRust
} from './life.js';
import {
  updateSteam, updateAcid, updateMud, updateIce
} from './fluids.js';
import {
  updateAcidPlant, updateObsidian, updateSandstone, updateBasalt, updateSpring,
  updateLavaSpring
} from './geology.js';
import {
  updateMetal, updateLightning, updateSpark, updateVibration
} from './electricity.js';
import {
  updateSakuraSeed, updateSakuraTree, updateSakuraPetal, updateFirefly
} from './sakura.js';
import {
  updateFlower, updateDarkFlower, updatePollen
} from './pollen.js';
import {
  updateMaVoid, updateKoi, updateKoiBody
} from './agents.js';
import {
  updateGold, updateKintsugi
} from './kintsugi.js';

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
  [VIBRATION]:    { name: 'vibration',   colors: [...VIBRATION_COLS],                                                   update: updateVibration   },
  [GOLD]:         { name: 'gold',        colors: [...GOLD_COLS],                                                        update: updateGold        },
  [KINTSUGI]:     { name: 'kintsugi',    colors: [...KINTSUGI_COLS],                                                    update: updateKintsugi    },
};


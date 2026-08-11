import {
  EMPTY, WATER, ICE, MUD, DARK_PLANT, PLANT, SOIL, OIL, FIRE, LAVA, ASH, STEAM,
  SMOKE, FLOWER, SAND, STONE, WALL, GLASS, COAL, HARD_SOIL, BASALT, SANDSTONE,
  OBSIDIAN, FIREFLY, ACID, ACID_PLANT, DARK_FLOWER, GLOW_FUNGUS, FUNGUS, SPARK,
  METAL, LIGHTNING, RUST
} from './ids.js';
import {
  META_DORMANT, META_MUD_SUMI, META_MUD_PETAL, META_SOIL_PETAL, META_LARGE,
  META_LOTUS, LOTUS_STEM_COLS, LOTUS_COLORS, FLOWER_COLORS, META_DARK, DARK_STEM_COLS,
  STEM_COLORS, META_ICE_CRYSTAL, ICE_CRYSTAL_STEM, ACID_STEM_COLS, META_COLOR,
  ICE_CRYSTAL_FLOWER, DARK_F_COLORS, ICE_CRYSTAL_CENTER, DARK_F_CENTER, LOTUS_CENTER,
  FLOWER_CENTER
} from './meta.js';

// ─── Life & growth update functions ──────────────────────────────────────────

export function updateSoil(engine, x, y) {
  // 砂と同じ重力挙動（落下・積み上げ）
  const below = engine.get(x, y+1);
  if (below === EMPTY || below === WATER) { engine.swap(x, y, x, y+1); return; }
  const dir = Math.random() > 0.5 ? 1 : -1;
  const dA = engine.get(x+dir, y+1), dB = engine.get(x-dir, y+1);
  if (dA === EMPTY || dA === WATER) { engine.swap(x, y, x+dir, y+1); return; }
  if (dB === EMPTY || dB === WATER) { engine.swap(x, y, x-dir, y+1); return; }
}

export function updateSeed(engine, x, y) {
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

export function updatePlant(engine, x, y) {
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
          engine.fireEvent('firefly_born'); // 蛍の自然発生イベント（シナリオトリガー用）
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

export function updateDarkPlant(engine, x, y) {
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

export function updateFungus(engine, x, y) {
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

export function updateGlowFungus(engine, x, y) {
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


export function updateRust(engine, x, y) {
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


import {
  SNOW, ICE, WATER, ASH, EMPTY, SOIL, COAL, SMOKE, FIRE, METAL, RUST, WALL,
  STONE, GLASS, OBSIDIAN, BASALT, SAND, SANDSTONE, HARD_SOIL, MUD, PLANT,
  FLOWER, DARK_PLANT, DARK_FLOWER, SEED, FUNGUS, GLOW_FUNGUS, SPARK, LAVA,
  STEAM, LIGHTNING, ACID
} from './ids.js';

// ─── Liquid & Gas update functions ───────────────────────────────────────────

export function updateSteam(engine, x, y) {
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

export function updateAcid(engine, x, y) {
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

export function updateMud(engine, x, y) {
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

export function updateIce(engine, x, y) {
  const nb4 = [[0,1],[1,0],[-1,0],[0,-1]];
  for (const [dx,dy] of nb4) {
    const n = engine.get(x+dx, y+dy);
    if (n === FIRE  && Math.random() > 0.90) { engine.set(x, y, WATER); return; }
    if (n === LAVA  && Math.random() > 0.60) {
      // 急冷: 氷が融ける瞬間、触れていた溶岩は黒曜石に固まる
      // （これがないと融け水+溶岩→石の皮が先に張り、黒曜石がほぼ生まれない）
      engine.set(x+dx, y+dy, OBSIDIAN);
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


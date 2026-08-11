import {
  EMPTY, WATER, LAVA, ICE, RUST, MUD, METAL, LIGHTNING, SPARK, SAND, GLASS,
  OIL, FIRE, SMOKE, COAL, SNOW, SOIL, STEAM, PLANT, FLOWER, DARK_FLOWER, DARK_PLANT,
  FUNGUS, GLOW_FUNGUS, SEED, ASH, SAKURA_TREE, SAKURA_PETAL, VIBRATION, SANDSTONE,
  KINTSUGI
} from './ids.js';
import {
  META_ICE_CRYSTAL, SAKURA_BLOOM_COLS, CONDUCTOR_IDS, VIB_STR_SHIFT, VIBRATION_COLS,
  VIB_DIR_SHIFT, VIB_DIRS, VIB_MAT_MASK, VIB_DIR_MASK, VIB_STR_MASK, META_DORMANT
} from './meta.js';
import {
  MATERIALS
} from './registry.js';

// ─── Electricity update functions ────────────────────────────────────────────

export function updateMetal(engine, x, y) {
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
        if (Math.random() > 0.55) continue;
        const bi = engine.idx(bx, by);
        engine.cells[bi]   = SAKURA_PETAL;
        engine.colors[bi]  = SAKURA_BLOOM_COLS[Math.floor(Math.random() * SAKURA_BLOOM_COLS.length)];
        engine.meta[bi]    = 50 + Math.floor(Math.random() * 30);
        engine.updated[bi] = 1;
      }
    }
    else if (CONDUCTOR_IDS.includes(n)) {
      // 振動波トリガー: 雷が伝導体に命中 → 左右に VIBRATION 波を発生
      const matIdx = CONDUCTOR_IDS.indexOf(n); // 全伝導体対応（Phase 2）
      const vibStr = 3 << VIB_STR_SHIFT;       // 強度3（雷直撃）

      // 右方向（dir=2）: 命中点(nx,ny)に VIBRATION を配置
      engine.cells[ni]   = VIBRATION;
      engine.colors[ni]  = VIBRATION_COLS[0];
      engine.meta[ni]    = matIdx | (2 << VIB_DIR_SHIFT) | vibStr;
      engine.updated[ni] = 1;

      // 左方向（dir=6）: 命中点の 1 セル左が伝導体なら VIBRATION を配置
      const lx = nx - 1, ly = ny;
      if (engine.inBounds(lx, ly)) {
        const lCell = engine.get(lx, ly);
        const lIdx  = CONDUCTOR_IDS.indexOf(lCell);
        if (lIdx !== -1) { // 全伝導体対応（Phase 2）
          const li = engine.idx(lx, ly);
          engine.cells[li]   = VIBRATION;
          engine.colors[li]  = VIBRATION_COLS[0];
          engine.meta[li]    = lIdx | (6 << VIB_DIR_SHIFT) | vibStr;
          engine.updated[li] = 1;
        }
      }
    }
  }
}

export function updateLightning(engine, x, y) {
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
export function updateSpark(engine, x, y) {
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

// ─── VIBRATION update function ───────────────────────────────────────────────

// 復元ヘルパー: VIBRATION が去った後のセルを元の伝導体素材に戻す
// str（強度）を受け取り、素材ごとの確率的な通過リアクションも担当する
function _vibRestore(engine, x, y, matIdx, str) {
  const originalMat = CONDUCTOR_IDS[matIdx];
  const i = engine.idx(x, y);

  // ── 通過時リアクション（確率的な副作用）────────────────────────────────────
  if (originalMat === GLASS && str >= 2 && Math.random() < 0.15) {
    // 強い振動でガラスが砕けて砂になる（+ 破片スパーク）
    engine.set(x, y, SAND);
    if (engine.inBounds(x, y-1) && engine.get(x, y-1) === EMPTY) {
      engine.set(x, y-1, SPARK);
    }
    return;
  }
  if (originalMat === SANDSTONE && str >= 1 && Math.random() < 0.05) {
    // 振動で砂岩が崩れる
    engine.set(x, y, SAND);
    return;
  }
  if (originalMat === METAL && str >= 3) {
    // 強衝撃: 金属の超冷却フラグ等をリセット（振動の余熱で状態が戻る）
    engine.set(x, y, METAL);
    engine.meta[i] = 0;
    return;
  }
  if (originalMat === KINTSUGI) {
    // 金は砕けない。振動が通ると継ぎ目が白金色に瞬き、金の火花が散る
    engine.set(x, y, KINTSUGI);
    engine.colors[i] = 0xFFE870;
    if (str >= 1 && Math.random() < 0.35 &&
        engine.inBounds(x, y-1) && engine.get(x, y-1) === EMPTY) {
      engine.set(x, y-1, SPARK);
    }
    return;
  }

  // ── デフォルト: 完全復元（STONE, WALL, BASALT, OBSIDIAN など）───────────
  engine.set(x, y, originalMat);
}

// ─── VIBRATION meta エンコーディング ─────────────────────────────────────────
// bit 2-0: 元素材インデックス（CONDUCTOR_IDS の添字、0-6）
// bit 5-3: 進行方向（0-7、VIB_DIRS に対応）
// bit 7-6: 強度（0=弱 〜 3=雷直撃）
//
// Phase 2 通過可能素材: CONDUCTOR_IDS 全7種（STONE/WALL/BASALT/METAL/SANDSTONE/OBSIDIAN/GLASS）
// 通過時リアクション: _vibRestore 内で確率的に発動（GLASS破砕, SANDSTONE崩壊 等）
// 出口リアクション:   非伝導体に到達したとき隣接素材に干渉（SEED覚醒, 桜開花 等）
// ─────────────────────────────────────────────────────────────────────────────
export function updateVibration(engine, x, y) {
  const i    = engine.idx(x, y);
  const meta = engine.meta[i];

  const matIdx = meta & VIB_MAT_MASK;
  const dir    = (meta & VIB_DIR_MASK) >> VIB_DIR_SHIFT;
  const str    = (meta & VIB_STR_MASK) >> VIB_STR_SHIFT;

  const SPEED = 3;
  let cx = x, cy = y, curMatIdx = matIdx;

  for (let step = 0; step < SPEED; step++) {
    const [dx, dy] = VIB_DIRS[dir];
    const nx = cx + dx, ny = cy + dy;

    // 画面外に到達 → 復元して消滅
    if (!engine.inBounds(nx, ny)) {
      _vibRestore(engine, cx, cy, curMatIdx, str);
      return;
    }

    const nextCell = engine.get(nx, ny);
    const nextIdx  = CONDUCTOR_IDS.indexOf(nextCell);

    if (nextIdx !== -1) {
      // ──── 伝導体 → 通過リアクション付きで復元し、前進 ─────────────────────
      _vibRestore(engine, cx, cy, curMatIdx, str); // 通過リアクションも内包

      const ni = engine.idx(nx, ny);
      engine.cells[ni]   = VIBRATION;
      engine.colors[ni]  = VIBRATION_COLS[Math.floor(Math.random() * VIBRATION_COLS.length)];
      engine.meta[ni]    = nextIdx | (dir << VIB_DIR_SHIFT) | (str << VIB_STR_SHIFT);
      engine.updated[ni] = 1;

      cx = nx; cy = ny; curMatIdx = nextIdx;

    } else {
      // ──── 非伝導体に到達 → 復元 + 出口リアクション + 消滅 ──────────────────
      _vibRestore(engine, cx, cy, curMatIdx, str);

      const ni = engine.idx(nx, ny);
      if (nextCell === SEED) {
        // 休眠フラグを解除（振動の衝撃で種が目覚める）
        engine.meta[ni] &= ~META_DORMANT;
      } else if (nextCell === SAKURA_TREE && engine.meta[ni] < 64) {
        // 衝撃で即開花（Phase 2 強制移行）
        engine.meta[ni]   = 64;
        engine.colors[ni] = SAKURA_BLOOM_COLS[Math.floor(Math.random() * SAKURA_BLOOM_COLS.length)];
      } else if (nextCell === SOIL || nextCell === ASH) {
        // 小さくバウンド（1セル上に押し上げ）
        if (engine.inBounds(nx, ny-1) && engine.get(nx, ny-1) === EMPTY) {
          engine.swap(nx, ny, nx, ny-1);
        }
      } else if (nextCell === WATER || nextCell === EMPTY) {
        // 波紋・消散の光
        if (Math.random() < 0.5) engine.set(nx, ny, SPARK);
      }
      return; // 波はここで消滅
    }
  }
  // SPEED ステップ消化 → VIBRATION は (cx,cy) に残り、次フレームで続きを処理
}


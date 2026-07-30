import {
  EMPTY, WATER, FIRE, LAVA, ASH, SOIL, SAND, STONE, WALL, GLASS, COAL, HARD_SOIL,
  MUD, BASALT, SANDSTONE, OBSIDIAN, STEAM, SAKURA_TREE, ACID, SAKURA_SEED,
  SAKURA_PETAL, SNOW, ICE, GLOW_FUNGUS
} from './ids.js';
import {
  SAKURA_TRUNK_COLS, SAKURA_BLOOM_COLS, SAKURA_FADE_COLS, SAKURA_BRANCH_COLS,
  YUKIZAKURA_PETAL_COLS, SAKURA_PETAL_COLS, META_PETAL_FROZEN, META_SOIL_PETAL,
  META_MUD_PETAL
} from './meta.js';
import {
  _emitPollen
} from './pollen.js';

// ─── Wabi-Sabi update functions ───────────────────────────────────────────────

export function updateSakuraSeed(engine, x, y) {
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

export function updateSakuraTree(engine, x, y) {
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

export function updateSakuraPetal(engine, x, y) {
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

export function updateFirefly(engine, x, y) {
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


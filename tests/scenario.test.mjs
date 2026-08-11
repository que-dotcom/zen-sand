// 金継ぎの化学 + シナリオ2本（金継ぎ・桜と蛍）の回帰検証。
// 盤面 PNG は tests/out/ に出力する。
//
// 実行手順（docs/practice-drill-guide.md §6）:
//   1. リポジトリ直下に一時 package.json を置く:  {"type":"module"}
//   2. node tests/scenario.test.mjs
//   3. 検証が終わったら package.json を削除してからコミットする
// 注意: 物理は確率的なので、稀に1項目落ちることがある。落ちたら数回再実行して
//       毎回同じ項目が落ちるかを確認する（毎回落ちるなら本物の回帰）。
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Engine } from '../src/engine.js';
import { MATERIALS } from '../src/materials/registry.js';
import { CONDUCTOR_IDS } from '../src/materials/meta.js';
import * as scen from '../src/scenarios.js';
import * as ids from '../src/materials/ids.js';

const {
  EMPTY, SAND, WATER, WALL, STONE, ICE, LAVA, ACID, LIGHTNING,
  GOLD, KINTSUGI, BASALT, SOIL, PLANT, SAKURA_SEED, SAKURA_TREE,
  VIBRATION, KOI,
} = ids;

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'out');
mkdirSync(OUT, { recursive: true });

// ─── PNG 書き出し ───────────────────────────────────────────────────────────
function crc32(buf) {
  let t = crc32.t;
  if (!t) {
    t = crc32.t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
  }
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function savePNG(engine, path) {
  const { width: w, height: h } = engine;
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    const row = y * (1 + w * 3);
    for (let x = 0; x < w; x++) {
      const i = engine.idx(x, y);
      const col = engine.cells[i] === EMPTY ? 0x141418 : engine.colors[i];
      raw[row + 1 + x * 3]     = (col >> 16) & 0xFF;
      raw[row + 1 + x * 3 + 1] = (col >> 8) & 0xFF;
      raw[row + 1 + x * 3 + 2] = col & 0xFF;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  writeFileSync(path, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]));
}

// ─── テストハーネス ─────────────────────────────────────────────────────────
let pass = 0, fail = 0;
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`PASS  ${name}`); }
  else      { fail++; console.log(`FAIL  ${name}  ${detail}`); }
}
function count(engine, type) {
  let n = 0;
  for (let i = 0; i < engine.cells.length; i++) if (engine.cells[i] === type) n++;
  return n;
}
function run(engine, frames, events = null, perFrame = null) {
  for (let f = 0; f < frames; f++) {
    if (perFrame) perFrame(f);
    engine.update();
    if (events) for (const e of engine.firedEvents) events.add(e);
  }
}

// ─── T1-T2: レジストリ整合性 ────────────────────────────────────────────────
check('T1 GOLD/KINTSUGI がレジストリに登録', !!MATERIALS[GOLD] && !!MATERIALS[KINTSUGI]);
check('T1 素材名', MATERIALS[GOLD].name === 'gold' && MATERIALS[KINTSUGI].name === 'kintsugi');
check('T2 CONDUCTOR_IDS は8個（3bit上限内）で末尾が KINTSUGI',
  CONDUCTOR_IDS.length === 8 && CONDUCTOR_IDS[7] === KINTSUGI);

// ─── T3: 割れ目凝固（垂直の割れ目に金を落とす）──────────────────────────────
{
  const e = new Engine(40, 40);
  for (let y = 20; y <= 30; y++) { e.set(19, y, STONE); e.set(21, y, STONE); }
  for (let x = 15; x <= 25; x++) e.set(x, 31, WALL);
  e.set(20, 5, GOLD);
  const ev = new Set();
  run(e, 300, ev);
  check('T3 金が割れ目で凝固して KINTSUGI になる', count(e, KINTSUGI) >= 1,
    `kintsugi=${count(e, KINTSUGI)} gold=${count(e, GOLD)}`);
  check('T3 kintsugi_formed イベント発火', ev.has('kintsugi_formed'));
}

// ─── T4: 平らな床では固まらない（1面接触）───────────────────────────────────
{
  const e = new Engine(60, 40);
  for (let x = 0; x < 60; x++) e.set(x, 30, STONE);
  e.set(30, 10, GOLD);
  run(e, 300);
  check('T4 平床の金は液体のまま（凝固しない）',
    count(e, KINTSUGI) === 0 && count(e, GOLD) === 1,
    `kintsugi=${count(e, KINTSUGI)} gold=${count(e, GOLD)}`);
}

// ─── T5: 酸は金を溶かせない（金の器が酸を湛え、中の石だけ溶ける）────────────
{
  const e = new Engine(30, 30);
  for (let x = 18; x <= 22; x++) e.set(x, 22, KINTSUGI); // 金の床
  for (let y = 16; y <= 21; y++) { e.set(17, y, KINTSUGI); e.set(23, y, KINTSUGI); } // 金の壁
  e.set(20, 21, STONE); // 器の中の石
  for (let y = 17; y <= 20; y++) for (let x = 18; x <= 22; x++)
    if (e.get(x, y) === EMPTY) e.set(x, y, ACID);
  const before = count(e, KINTSUGI);
  run(e, 500);
  check('T5 酸の中で金継ぎは不変', count(e, KINTSUGI) === before,
    `before=${before} after=${count(e, KINTSUGI)}`);
  check('T5 器の中の石は酸に溶けた', count(e, STONE) === 0, `stone=${count(e, STONE)}`);
}

// ─── T6: 溶岩で金継ぎが再溶解して金に戻る ───────────────────────────────────
{
  const e = new Engine(20, 20);
  for (let x = 8; x <= 12; x++) e.set(x, 12, WALL);
  // 溶岩が横に滑り落ちないよう、金継ぎの真上に壁の筒を作って閉じ込める
  for (let y = 9; y <= 11; y++) { e.set(9, y, WALL); e.set(11, y, WALL); }
  e.set(10, 11, KINTSUGI);
  e.set(10, 10, LAVA);
  let sawGold = false;
  for (let f = 0; f < 200; f++) { e.update(); if (count(e, GOLD) > 0) { sawGold = true; break; } }
  check('T6 溶岩接触で金継ぎ→金に再溶解', sawGold);
}

// ─── T7: 氷急冷（溶岩→黒曜石の作法）────────────────────────────────────────
{
  const e = new Engine(20, 20);
  e.set(10, 12, ICE);
  e.set(10, 8, GOLD);
  run(e, 100);
  check('T7 氷に触れた金は急冷凝固', count(e, KINTSUGI) === 1,
    `kintsugi=${count(e, KINTSUGI)} gold=${count(e, GOLD)}`);
}

// ─── T8: 雷 → 振動波が金継ぎの継ぎ目を走り、通過後に完全復元 ────────────────
{
  const e = new Engine(100, 60);
  for (let x = 20; x <= 80; x++) e.set(x, 50, STONE);
  for (let x = 45; x <= 55; x++) e.set(x, 50, KINTSUGI);
  e.set(30, 40, LIGHTNING);
  let sawVib = false;
  for (let f = 0; f < 120; f++) {
    e.update();
    if (!sawVib) {
      for (let x = 45; x <= 55; x++) if (e.get(x, 50) === VIBRATION) { sawVib = true; break; }
    }
  }
  let kintCount = 0;
  for (let x = 45; x <= 55; x++) if (e.get(x, 50) === KINTSUGI) kintCount++;
  check('T8 振動波が金継ぎ区間を通過', sawVib);
  check('T8 通過後に11セル全て復元', kintCount === 11 && count(e, VIBRATION) === 0,
    `kintsugi=${kintCount}/11 vib=${count(e, VIBRATION)}`);
}

// ─── T9: 金継ぎシナリオ実走（注ぐ→固まる→水を湛える）───────────────────────
{
  const e = new Engine(240, 160);
  scen.loadKintsugi(e);
  savePNG(e, join(OUT, 'kintsugi-initial.png'));
  check('T9 レイアウト: 器と台座と砂庭がある',
    count(e, STONE) > 100 && count(e, BASALT) > 100 && count(e, SAND) > 1000);

  const cx = 120, R = 31;
  const yWall = Math.floor(160 * 0.92), yDaisT = yWall - 7 - 2;
  const bowlCy = yDaisT - 1 - R;
  const ev = new Set();
  // 金を器の中へ注ぐ（200フレーム）
  run(e, 700, ev, f => {
    if (f < 200) {
      for (const dx of [-1, 0, 1]) {
        if (e.get(cx + dx, bowlCy - 8) === EMPTY) e.set(cx + dx, bowlCy - 8, GOLD);
      }
    }
  });
  savePNG(e, join(OUT, 'kintsugi-after-gold.png'));
  check('T9 注いだ金が割れ目で凝固', count(e, KINTSUGI) >= 5, `kintsugi=${count(e, KINTSUGI)}`);
  check('T9 kintsugi_formed 発火', ev.has('kintsugi_formed'));

  // 水を注いで器が湛えるか
  run(e, 500, ev, f => {
    if (f < 150) {
      for (const dx of [-1, 0, 1]) {
        if (e.get(cx + dx, bowlCy - 8) === EMPTY) e.set(cx + dx, bowlCy - 8, WATER);
      }
    }
  });
  savePNG(e, join(OUT, 'kintsugi-after-water.png'));
  let waterInBowl = 0;
  for (let y = bowlCy; y <= bowlCy + R; y++)
    for (let x = cx - R; x <= cx + R; x++) {
      const dx = x - cx, dy = y - bowlCy;
      if (dx * dx + dy * dy < (R - 3) * (R - 3) && e.get(x, y) === WATER) waterInBowl++;
    }
  check('T9 直した器が水を湛える', waterInBowl >= 40, `waterInBowl=${waterInBowl}`);
}

// ─── T10: 桜と蛍シナリオ実走（種→開花→蛍のイベント発火）────────────────────
{
  const e = new Engine(240, 160);
  scen.loadSakuraFirefly(e);
  savePNG(e, join(OUT, 'sakura-initial.png'));
  check('T10 レイアウト: 池と土と草花と鯉がある',
    count(e, WATER) > 50 && count(e, SOIL) > 500 && count(e, PLANT) > 5 && count(e, KOI) === 1);

  const yWall = Math.floor(160 * 0.90), ySoilT = yWall - 5, yGround = ySoilT - 1;
  const pondR = (120 - Math.floor(240 * 0.12)) + Math.max(8, Math.floor(240 * 0.11));
  const ev = new Set();
  run(e, 10, ev);
  e.set(pondR + 7, yGround, SAKURA_SEED); // 池のほとりに種を蒔く
  run(e, 6000, ev);
  savePNG(e, join(OUT, 'sakura-final.png'));
  check('T10 桜が発芽して成長した', ev.has('sakura_bloomed') || count(e, SAKURA_TREE) > 0,
    `bloomed=${ev.has('sakura_bloomed')} tree=${count(e, SAKURA_TREE)}`);
  check('T10 sakura_bloomed イベント発火', ev.has('sakura_bloomed'));
  check('T10 firefly_born イベント発火', ev.has('firefly_born'));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

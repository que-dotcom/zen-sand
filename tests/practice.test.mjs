// 実験帳の機械プレイ検証: 全10題を正答ボットでプレイして完走できることを確認し、
// 各舞台を60フレーム流した状態の PNG を tests/out/ に出力する。
//
// 実行手順（docs/practice-drill-guide.md §6）:
//   1. リポジトリ直下に一時 package.json を置く:  {"type":"module"}
//   2. node tests/practice.test.mjs   ← 2回連続で全題完走を確認すること
//   3. 検証が終わったら package.json を削除してからコミットする
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Engine } from '../src/engine.js';
import { PracticeMode, DRILLS, stageFrame } from '../src/practice.js';
import * as ids from '../src/materials/ids.js';

const { EMPTY, FIRE, WATER, LIGHTNING, LAVA, SEED, GOLD, SNOW } = ids;

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'out');
mkdirSync(OUT, { recursive: true });

// ─── PNG 書き出し（1セル=1px、自前エンコーダ。依存パッケージなし）──────────
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
function savePNG(e, path) {
  const { width: w, height: h } = e;
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    const row = y * (1 + w * 3);
    for (let x = 0; x < w; x++) {
      const i = e.idx(x, y);
      const col = e.cells[i] === EMPTY ? 0x141418 : e.colors[i];
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

// ─── 舞台PNG（目視用: 各題を60フレーム流した「本当の初期状態」）─────────────
for (const d of DRILLS) {
  const e = new Engine(200, 140);
  d.setup(e);
  for (let f = 0; f < 60; f++) e.update();
  savePNG(e, join(OUT, `stage-${d.id}.png`));
}

// ─── 機械プレイ ─────────────────────────────────────────────────────────────
// 正答ボットは「ブラシで掃くように塗る」動きを sweep（x をずらして置く）で模倣する。
// 同一点に置き続けると自分の生成物を上書きして詰まる（作成要領 §5）。
const engine = new Engine(200, 140);
const { W, H, cx } = stageFrame(engine);

const ANSWERS = {
  wildfire: f => { if (f % 15 === 0) engine.set(1 + ((f * 7) % (W - 2)), H - 5, FIRE); },
  steam:    f => { if (f % 3 === 0)  engine.set(cx + ((f * 5) % 57) - 28, H - 3, FIRE); },
  stone:    f => { if (f % 2 === 0)  engine.set(5 + ((f * 3) % 90), 30, WATER); },
  glass:    f => { if (f % 12 === 0) engine.set([40, 90, 140, 176][(f / 12) % 4 | 0], 30, LIGHTNING); },
  obsidian: f => { if (f % 3 === 0)  engine.set(cx + ((f * 3) % 29) - 14, 60, SNOW); },
  basalt:   f => { if (f % 3 === 0)  engine.set(24 + ((f * 5) % 64), H - 8, LAVA); },
  sprout:   f => { if (f % 20 === 0) engine.set(10 + (f % 120), H - 10, SEED); },
  freeze:   f => { if (f % 2 === 0)  engine.set(cx + ((f * 5) % 99) - 49, H - 8, SNOW); },
  spark:    f => { if (f % 10 === 0) engine.set(20 + ((f * 7) % 160), H - 10, LIGHTNING); },
  kintsugi: f => { if (f % 4 === 0)  engine.set(cx + (f % 2), H - 21, GOLD); },
};

let bells = 0;
const barLog = [];
const p = new PracticeMode(engine, {
  onBar: t => barLog.push(t),
  onSuccess: () => bells++,
  onFinish: () => barLog.push('<finish-hook>'),
});

p.start();

const DRILL_LIMIT = 8000; // 1題あたりの上限（約2分強@60fps）
const stalled = [];
const perDrill = [];
let drillFrames = 0, lastIndex = 0;
while (p.active) {
  if (p.state === 'trying') ANSWERS[DRILLS[p.index].id]?.(drillFrames);
  engine.update();
  p.step();
  drillFrames++;
  if (p.index !== lastIndex) {
    perDrill.push(`${DRILLS[lastIndex].id}: ${drillFrames}f`);
    lastIndex = p.index; drillFrames = 0;
  } else if (drillFrames > DRILL_LIMIT) {
    stalled.push(DRILLS[p.index].id);
    perDrill.push(`${DRILLS[p.index].id}: STALL`);
    p.skip();
    lastIndex = p.index; drillFrames = 0;
  }
}

let pass = 0, fail = 0;
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`PASS  ${name}`); }
  else      { fail++; console.log(`FAIL  ${name}  ${detail}`); }
}

console.log('所要フレーム:', perDrill.join(', '));
check('全10題が制限時間内に達成可能', stalled.length === 0, `stalled=[${stalled}]`);
check('完走してモード終了', !p.active && p.index === DRILLS.length, `index=${p.index}`);
check('おりんが10回鳴った', bells === 10, `bells=${bells}`);
check('皆伝メッセージ表示', barLog.some(t => typeof t === 'string' && t.includes('皆伝')));
check('各題のヒントが表示された',
  DRILLS.every(d => barLog.some(t => typeof t === 'string' && t.includes(`「${d.title}」 — `))));
check('成功メッセージが10回', barLog.filter(t => typeof t === 'string' && t.startsWith('⭕')).length === 10);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

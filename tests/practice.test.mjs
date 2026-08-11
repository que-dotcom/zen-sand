// 実験帳の機械プレイ検証: 全題を正答ボットでプレイして完走できることを確認し、
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
import { PracticeMode, DRILLS, stageFrame, stripRuby } from '../src/practice.js';
import * as ids from '../src/materials/ids.js';

const { EMPTY, FIRE, WATER, LIGHTNING, LAVA, OIL, SEED, GOLD, SNOW, METAL } = ids;

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
  oilfield: f => { if (f % 18 === 0) engine.set(25 + ((f * 11) % (W - 50)), H - 25, LIGHTNING); },
  steam:    f => { if (f % 3 === 0)  engine.set(cx + ((f * 5) % 57) - 28, H - 3, FIRE); },
  stone:    f => { if (f % 2 === 0)  engine.set(5 + ((f * 3) % 90), 30, WATER); },
  glass:    f => { if (f % 12 === 0) engine.set([40, 90, 140, 176][(f / 12) % 4 | 0], 30, LIGHTNING); },
  sandstone:f => { if (f % 2 === 0)  engine.set(25 + ((f * 7) % (W - 50)), H - 35, LAVA); },
  obsidian: f => { if (f % 3 === 0)  engine.set(cx + ((f * 3) % 29) - 14, 60, SNOW); },
  basalt:   f => { if (f % 3 === 0)  engine.set(24 + ((f * 5) % 64), H - 8, LAVA); },
  'glow-cave': f => { if (f % 2 === 0) engine.set(20 + ((f * 7) % (W - 40)), H - 22, OIL); },
  sprout:   f => { if (f % 20 === 0) engine.set(10 + (f % 120), H - 10, SEED); },
  'sumi-night': f => {
    if (f < 240 && f % 2 === 0) engine.set(20 + ((f * 5) % (W - 40)), H - 35, WATER);
    if (f >= 180 && f % 8 === 0) engine.set(20 + ((f * 11) % (W - 40)), H - 30, SEED);
  },
  freeze:   f => { if (f % 2 === 0)  engine.set(cx + ((f * 5) % 99) - 49, H - 8, SNOW); },
  spark:    f => { if (f % 10 === 0) engine.set(20 + ((f * 7) % 160), H - 10, LIGHTNING); },
  'rust-sea': f => { if (f % 3 === 0) engine.set(20 + ((f * 7) % 160), H - 32, METAL); },
  'firefly-brook': f => { if (f % 3 === 0) engine.set(18 + ((f * 11) % 164), H - 22, WATER); },
  kintsugi: f => { if (f % 4 === 0)  engine.set(cx + (f % 2), H - 21, GOLD); },
};

let bells = 0;
const barLog = [];
const reactLog = [];
const celebrations = [];
const p = new PracticeMode(engine, {
  onBar: t => barLog.push(t),
  onSuccess: () => bells++,
  onReact: text => reactLog.push(text),
  onCelebrate: replay => celebrations.push(replay),
  onFinish: () => barLog.push('<finish-hook>'),
});

p.start();

const DRILL_LIMIT = 8000; // 1題あたりの上限（約2分強@60fps）
const stalled = [];
const perDrill = [];
let drillFrames = 0, readyFrames = 0, lastIndex = 0;
while (p.active) {
  if (p.state === 'trying') ANSWERS[DRILLS[p.index].id]?.(drillFrames);
  engine.update();
  p.step();
  drillFrames++;
  if (p.state === 'ready') {
    // 成功後も180フレームは反応を続け、プレイヤーの「次へ」を模した操作で進む
    if (++readyFrames >= 180) { p.skip(); readyFrames = 0; }
  } else {
    readyFrames = 0;
  }
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
check('全題が制限時間内に達成可能', stalled.length === 0, `stalled=[${stalled}]`);
check('完走してモード終了', !p.active && p.index === DRILLS.length, `index=${p.index}`);
check('おりんが各題で鳴った', bells === DRILLS.length, `bells=${bells}`);
check('各題で反応トーストが1回ずつ出た',
  reactLog.length === DRILLS.length && new Set(reactLog).size === DRILLS.length,
  `reacts=${reactLog.length}`);
check('成功90フレーム後に各題のリプレイが出た',
  celebrations.length === DRILLS.length && celebrations.every(replay =>
    replay.frames.length >= 30 && replay.frames.every(frame =>
      frame.length === replay.width * replay.height)),
  `celebrations=${celebrations.length}`);
check('皆伝メッセージ表示', barLog.some(t => typeof t === 'string' && t.includes('ぜんぶ クリア！')));
check('各題のヒントが表示された',
  DRILLS.every(d => barLog.some(t => typeof t === 'string' && t.includes(`「${d.title}」 — `))));
check('成功メッセージが各題に出た',
  barLog.filter(t => typeof t === 'string' && t.startsWith('⭕')).length === DRILLS.length);

const manualEngine = new Engine(200, 140);
let skippedCelebrations = 0;
const manualPractice = new PracticeMode(manualEngine, {
  onCelebrate: () => skippedCelebrations++,
});
manualPractice.start();
for (let x = 0; x < 12; x++) manualEngine.set(x, 100, FIRE);
manualPractice.step();
check('成功後は自動で次の実験へ進まない',
  manualPractice.active && manualPractice.index === 0 && manualPractice.state === 'ready');
manualPractice.skip();
check('次へ操作で次の実験へ進む', manualPractice.index === 1 && manualPractice.state === 'trying');
for (let f = 0; f < 120; f++) { manualEngine.update(); manualPractice.step(); }
check('ready中に次へを押すとリプレイを出さない', skippedCelebrations === 0,
  `celebrations=${skippedCelebrations}`);

check('ルビ表記を読み仮名なしの文字列へ変換する',
  stripRuby('火{ひ}を重{かさ}ね') === '火を重ね');

const guideLog = [];
const guideEngine = new Engine(200, 140);
const guidePractice = new PracticeMode(guideEngine, {
  onGuide: ids => guideLog.push(ids),
});
guidePractice.start();
check('開始時にお題の配置素材をガイドする',
  guideLog.at(-1) === DRILLS[0].place);
for (let x = 0; x < DRILLS[0].goal; x++) guideEngine.set(x, 20, FIRE);
guidePractice.step();
check('成功してreadyへ移るとガイドを解除する',
  guidePractice.state === 'ready' && guideLog.at(-1) === null);

const sumiGuideLog = [];
const sumiGuideEngine = new Engine(200, 140);
const sumiGuidePractice = new PracticeMode(sumiGuideEngine, {
  onGuide: ids => sumiGuideLog.push(ids),
});
sumiGuidePractice.start();
sumiGuidePractice.index = DRILLS.findIndex(drill => drill.id === 'sumi-night');
sumiGuidePractice._load();
for (let x = 0; x < 10; x++) sumiGuideEngine.set(x, 20, ids.MUD);
sumiGuidePractice.step();
check('途中の指示へ進むとその配置素材をガイドする',
  sumiGuideLog.at(-1) === DRILLS[sumiGuidePractice.index].instructions[0].place);

const stuckLog = [];
const stuckPractice = new PracticeMode(new Engine(200, 140), {
  onStuck: drill => stuckLog.push(drill.id),
});
stuckPractice.start();
for (let frame = 0; frame < 899; frame++) stuckPractice.step();
check('900フレーム未満では詰まり支援を出さない', stuckLog.length === 0);
stuckPractice.step();
check('900フレーム無反応で詰まり支援を出す',
  stuckLog.length === 1 && stuckLog[0] === DRILLS[0].id);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

// 雷と水の検証:  node tests/lightning.test.mjs
import { Engine } from '../src/engine.js';
import * as ids from '../src/materials/ids.js';

let passed = 0, failed = 0;
function check(name, ok, detail = '') {
  if (ok) { passed++; console.log(`PASS  ${name}`); }
  else { failed++; console.log(`FAIL  ${name}  ${detail}`); }
}
const W = 80, H = 100;
const count = (e, t) => { let n = 0; for (const c of e.cells) if (c === t) n++; return n; };

// 池に雷を落としても、電気は有限の範囲で止まり、水がすべて元に戻る
{
  const e = new Engine(W, H);
  for (let x = 0; x < W; x++) e.set(x, H - 1, ids.WALL);
  for (let y = 0; y < H; y++) { e.set(0, y, ids.WALL); e.set(W - 1, y, ids.WALL); }
  for (let y = H - 20; y < H - 1; y++) for (let x = 1; x < W - 1; x++) e.set(x, y, ids.WATER);
  for (let f = 0; f < 30; f++) e.update();
  const before = count(e, ids.WATER);
  for (const x of [30, 40, 50]) e.set(x, H - 30, ids.LIGHTNING);
  for (let f = 0; f < 400; f++) e.update();
  check('雷のあと火花が残らない', count(e, ids.SPARK) === 0, `spark=${count(e, ids.SPARK)}`);
  check('雷のあと水の量が変わらない', count(e, ids.WATER) === before, `${count(e, ids.WATER)} / ${before}`);
}

// 泥は雷の電気で光っても、水に変わらず泥のまま戻る
{
  const e = new Engine(40, 40);
  for (let x = 0; x < 40; x++) e.set(x, 39, ids.WALL);
  for (let x = 10; x < 30; x++) for (let y = 36; y < 39; y++) e.set(x, y, ids.MUD);
  const mud = count(e, ids.MUD);
  e.set(20, 20, ids.LIGHTNING);
  for (let f = 0; f < 200; f++) e.update();
  check('雷のあと泥が水に変わらない', count(e, ids.WATER) === 0, `water=${count(e, ids.WATER)}`);
  check('雷のあと泥が残る', count(e, ids.MUD) === mud, `${count(e, ids.MUD)} / ${mud}`);
}

// 氷に雷を当てても、空中に水が湧かない（融けた氷の分だけ水になる）
{
  const e = new Engine(40, 40);
  for (let x = 0; x < 40; x++) e.set(x, 39, ids.WALL);
  for (let x = 10; x < 30; x++) for (let y = 36; y < 39; y++) e.set(x, y, ids.ICE);
  const ice = count(e, ids.ICE);
  e.set(20, 20, ids.LIGHTNING);
  for (let f = 0; f < 200; f++) e.update();
  const total = count(e, ids.ICE) + count(e, ids.WATER) + count(e, ids.SPARK);
  check('雷のあと氷と水の合計が増えない', total <= ice, `${total} / ${ice}`);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

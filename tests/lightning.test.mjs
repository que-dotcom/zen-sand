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

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

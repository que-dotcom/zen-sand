// 高度・露点・雲の検証:  node tests/cloud.test.mjs
import { Engine } from '../src/engine.js';
import * as ids from '../src/materials/ids.js';
import { DEW_ALTITUDE } from '../src/materials/climate.js';

let passed = 0, failed = 0;
function check(name, ok, detail = '') {
  if (ok) { passed++; console.log(`PASS  ${name}`); }
  else { failed++; console.log(`FAIL  ${name}  ${detail}`); }
}
const W = 80, H = 100;
const box = () => {
  const e = new Engine(W, H);
  for (let x = 0; x < W; x++) e.set(x, H - 1, ids.WALL);
  for (let y = 0; y < H; y++) { e.set(0, y, ids.WALL); e.set(W - 1, y, ids.WALL); }
  return e;
};
const count = (e, t, pred = () => true) => {
  let n = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (e.get(x, y) === t && pred(e.altitude(y))) n++;
  return n;
};

check('高度は最下段 0・最上段 1', box().altitude(H - 1) === 0 && box().altitude(0) === 1);

// 1. 露点より高い蒸気は雲になる
{
  const e = box();
  for (let y = 5; y < 15; y++) for (let x = 1; x < W - 1; x++) e.set(x, y, ids.STEAM);
  for (let f = 0; f < 400; f++) e.update();
  check('露点より高い蒸気は凝結して雲になる', count(e, ids.CLOUD) > 100, `cloud=${count(e, ids.CLOUD)}`);
}

// 2. 露点より低い所の蒸気は、昇りきる前は雲にならない
{
  const e = box();
  for (let y = H - 12; y < H - 2; y++) for (let x = 1; x < W - 1; x++) e.set(x, y, ids.STEAM);
  for (let f = 0; f < 30; f++) e.update();
  check('露点より低い高度では雲ができない', count(e, ids.CLOUD, a => a <= DEW_ALTITUDE) === 0);
}

// 3. 高いほど雲になりやすい（同量の蒸気を高さ違いで置いて比較）
{
  const rate = (y0) => {
    const e = box();
    for (let y = y0; y < y0 + 4; y++) for (let x = 1; x < W - 1; x++) { e.set(x, y, ids.STEAM); e.temp[e.idx(x, y)] = e.ambientAt(y); } // 気温になじんだ蒸気
    for (let f = 0; f < 5; f++) e.update();
    return count(e, ids.CLOUD);
  };
  let low = 0, high = 0;
  for (let i = 0; i < 20; i++) { low += rate(35); high += rate(2); } // alt≈0.64 と alt≈0.98
  check('高度が高いほど凝結しやすい', high > low, `high=${high} low=${low}`);
}

// 4. 地表付近の雲は蒸発して蒸気に戻る
{
  const e = box();
  for (let y = H - 8; y < H - 2; y++) for (let x = 20; x < 60; x++) e.set(x, y, ids.CLOUD);
  for (let f = 0; f < 300; f++) e.update();
  check('暖かい低空の雲は蒸発する', count(e, ids.CLOUD, a => a < 0.1) < 40, `cloud=${count(e, ids.CLOUD, a => a < 0.1)}`);
}

// 5. 厚い雲は雨を降らせる
{
  const e = box();
  for (let y = 6; y < 16; y++) for (let x = 10; x < 70; x++) e.set(x, y, ids.CLOUD);
  let rained = 0;
  for (let f = 0; f < 400; f++) { e.update(); rained = Math.max(rained, count(e, ids.WATER)); }
  check('厚い雲は雨粒を落とす', rained > 0, `water=${rained}`);
}

// 6. 薄い孤立した雲は雨を降らせない
{
  const e = box();
  e.set(40, 6, ids.CLOUD);
  let rained = false;
  for (let f = 0; f < 300; f++) { e.update(); if (count(e, ids.WATER) > 0) rained = true; }
  check('孤立した雲は雨を降らせない', !rained);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

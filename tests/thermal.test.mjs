// 温度場の検証:  node tests/thermal.test.mjs
import { Engine } from '../src/engine.js';
import * as ids from '../src/materials/ids.js';
import {
  T_FREEZE, T_BOIL, T_LAVA, T_LAVA_SOLID, T_AMBIENT_GROUND, T_AMBIENT_TOP,
} from '../src/materials/climate.js';

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
const count = (e, t) => { let n = 0; for (const c of e.cells) if (c === t) n++; return n; };
const run = (e, n) => { for (let f = 0; f < n; f++) e.update(); };

// 1. 気温は高度で下がる
{
  const e = box();
  check('地表の気温が最も高い', Math.abs(e.temp[e.idx(40, H - 2)] - T_AMBIENT_GROUND) < 3);
  check('上空ほど気温が低い', e.temp[e.idx(40, 0)] < e.temp[e.idx(40, H - 2)] && Math.abs(e.temp[e.idx(40, 0)] - T_AMBIENT_TOP) < 1);
}

// 2. 温度は素材の移動に付いていく
{
  const e = new Engine(10, 10);
  e.set(5, 2, ids.LAVA);
  run(e, 3);
  let found = false;
  for (let y = 0; y < 10; y++) if (e.get(5, y) === ids.LAVA && e.temp[e.idx(5, y)] > 240) found = true;
  check('落下した溶岩は高温を保つ', found);
}

// 3. 熱は金属のほうが砂よりよく伝わる（熱伝導率の違い）
{
  const rod = (type) => {
    const e = box();
    for (let x = 10; x < 50; x++) e.set(x, H - 2, type); // 床の上に置く（金属は落下するため）
    for (let f = 0; f < 300; f++) { e.temp[e.idx(10, H - 2)] = 215; e.update(); } // 端を 215 に保つ熱源
    return e.temp[e.idx(14, H - 2)] - e.ambientAt(H - 2);
  };
  const metal = rod(ids.METAL), sand = rod(ids.WALL);
  check('金属は熱をよく伝える（石の壁より遠くまで温まる）', metal > sand + 5, `metal=${metal.toFixed(1)} wall=${sand.toFixed(1)}`);
  check('熱源から離れた金属も気温より温まる', metal > 10, `metal=${metal.toFixed(1)}`);
}

// 4. 加熱された水は沸騰して蒸気になり、体積が 25 倍になる
{
  const e = box();
  e.set(40, 90, ids.WATER);
  e.temp[e.idx(40, 90)] = T_BOIL + 5;
  e.update();
  check('沸点を超えた水は蒸気になる', count(e, ids.WATER) === 0);
  check('沸騰で蒸気 25 セルに膨張する', count(e, ids.STEAM) === 25, `steam=${count(e, ids.STEAM)}`);
}

// 5. 氷点以下の水は凍る
{
  const e = box();
  e.set(40, 90, ids.WATER);
  e.temp[e.idx(40, 90)] = T_FREEZE - 5;
  e.update();
  check('氷点以下の水は氷になる', count(e, ids.WATER) === 0 && count(e, ids.ICE) === 1);
}

// 6. 氷は暖かい環境で融ける。雪は置いた直後は冷たい
{
  const e = box();
  e.set(40, 90, ids.SNOW);
  check('雪は冷たい状態で置かれる', e.temp[e.idx(40, 90)] < T_FREEZE);
  for (let i = 0; i < e.cells.length; i++) if (e.cells[i] === ids.SNOW) e.temp[i] = T_AMBIENT_GROUND + 10;
  run(e, 30);
  check('暖まった雪は融ける', count(e, ids.SNOW) === 0);
}

// 7. 高温の岩は溶岩になり、冷えた溶岩は石に固まる
{
  const e = box();
  e.set(40, 90, ids.STONE);
  e.temp[e.idx(40, 90)] = T_LAVA;
  run(e, 20);
  check('高温の石は溶けて溶岩になる', count(e, ids.LAVA) === 1 && count(e, ids.STONE) === 0, `lava=${count(e, ids.LAVA)} stone=${count(e, ids.STONE)}`);
  const l = box();
  l.set(40, 90, ids.LAVA);
  l.temp[l.idx(40, 90)] = T_LAVA_SOLID - 1;
  l.update();
  check('冷えた溶岩は石に固まる', count(l, ids.STONE) === 1 && count(l, ids.LAVA) === 0);
}

// 8. 溶岩は水を沸騰させるたびに熱を失い、やがて固まる
{
  const e = box();
  for (let x = 20; x < 30; x++) e.set(x, 98, ids.LAVA);
  for (let y = 90; y < 98; y++) for (let x = 20; x < 30; x++) e.set(x, y, ids.WATER);
  const l0 = count(e, ids.LAVA);
  run(e, 600);
  check('水に覆われた溶岩は冷えて固まる', count(e, ids.LAVA) < l0 && count(e, ids.STONE) > 0, `lava=${count(e, ids.LAVA)} stone=${count(e, ids.STONE)}`);
}

// 9. 溶岩は熱を失わない限り岩を溶かし続け、熱量が保存される（無限に増えない）
{
  const e = box();
  for (let y = 85; y < 98; y++) for (let x = 5; x < 75; x++) e.set(x, y, ids.STONE);
  e.set(10, 84, ids.LAVA);
  run(e, 2000);
  check('小さな溶岩は岩を溶かし切れない（熱が尽きる）', count(e, ids.LAVA) < 10, `lava=${count(e, ids.LAVA)}`);
}

// 10. 水の質量保存: 沸騰で 25 倍に膨らんだ蒸気は、凝結して水 1 粒に戻る
{
  const e = box();
  e.set(40, 90, ids.WATER);
  e.temp[e.idx(40, 90)] = T_BOIL + 5;
  let maxWater = 0;
  for (let f = 0; f < 3000; f++) { e.update(); maxWater = Math.max(maxWater, count(e, ids.WATER)); }
  check('水が増殖しない（凝結しても元の 1 粒を大きく超えない）', maxWater <= 3, `maxWater=${maxWater}`);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

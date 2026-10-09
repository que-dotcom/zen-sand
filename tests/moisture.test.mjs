// 湿り気度・酸性度の検証:  node tests/moisture.test.mjs
import { Engine } from '../src/engine.js';
import * as ids from '../src/materials/ids.js';
import { wetResistance } from '../src/moisture.js';

let passed = 0, failed = 0;
function check(name, ok, detail = '') {
  if (ok) { passed++; console.log(`PASS  ${name}`); }
  else { failed++; console.log(`FAIL  ${name}  ${detail}`); }
}
const W = 60, H = 40;
const box = () => {
  const e = new Engine(W, H);
  for (let x = 0; x < W; x++) e.set(x, H - 1, ids.WALL);
  for (let y = 0; y < H; y++) { e.set(0, y, ids.WALL); e.set(W - 1, y, ids.WALL); }
  return e;
};
const run = (e, n) => { for (let f = 0; f < n; f++) e.update(); };
const wetAt = (e, x, y) => e.wet[e.idx(x, y)];
const acidAt = (e, x, y) => e.acid[e.idx(x, y)];

// 1. 素材ごとの湿りにくさ（0 = 湿りやすい 〜 255 = 湿らない）
check('土は岩より湿りやすい', wetResistance(ids.SOIL) < wetResistance(ids.SAND) && wetResistance(ids.SAND) < wetResistance(ids.STONE));
check('ガラス・金属・壁は湿らない', [ids.GLASS, ids.METAL, ids.WALL].every(t => wetResistance(t) === 255));
check('値は 0〜255 に収まる', Array.from({ length: 64 }, (_, t) => wetResistance(t)).every(v => v >= 0 && v <= 255));

// 2. 水は隣の素材へ染み込む。湿りにくい素材ほど染みにくい
{
  const e = box();
  // 水(左) | 土 | 水(右の壁側) と、同じ並びを岩・ガラスで
  for (const [row, mat] of [[H - 4, ids.SOIL], [H - 8, ids.STONE], [H - 12, ids.GLASS]]) {
    e.set(10, row, ids.SPRING);
    for (let x = 11; x < 20; x++) e.set(x, row, mat);
    for (let x = 9; x < 21; x++) { e.set(x, row - 1, ids.WALL); e.set(x, row + 1, ids.WALL); } // 縦方向の流入を断つ
    e.set(9, row, ids.WALL); e.set(20, row, ids.WALL);
  }
  run(e, 300);
  const soil = wetAt(e, 13, H - 4), stone = wetAt(e, 13, H - 8), glass = wetAt(e, 13, H - 12);
  check('土には水が染み込む', soil > 100, `soil=${soil.toFixed(1)}`);
  check('岩には土より染みにくい', stone < soil * 0.5, `stone=${stone.toFixed(1)} soil=${soil.toFixed(1)}`);
  check('ガラスには染みない', glass === 0, `glass=${glass}`);
  check('水源に近いほど湿っている', wetAt(e, 11, H - 4) > wetAt(e, 15, H - 4) && wetAt(e, 15, H - 4) > wetAt(e, 19, H - 4));
}

// 3. 暑いと乾く
{
  const mk = () => {
    const e = box();
    e.set(30, H - 2, ids.SOIL);
    e.wet[e.idx(30, H - 2)] = 200;
    return e;
  };
  const hot = mk(), normal = mk();
  for (let f = 0; f < 600; f++) { hot.update(); hot.temp[hot.idx(30, H - 2)] = 160; normal.update(); }
  check('高温の土は常温より早く乾く', wetAt(hot, 30, H - 2) < wetAt(normal, 30, H - 2) * 0.75,
    `hot=${wetAt(hot, 30, H - 2).toFixed(1)} normal=${wetAt(normal, 30, H - 2).toFixed(1)}`);
}

// 4. 酸源は 255。酸は水の通り道を伝って広がり、離れるほど弱く、ガラスには染みない
{
  const e = box();
  e.set(10, H - 2, ids.ACID);
  check('酸は置いた瞬間から酸性度 255・湿り気度 255', acidAt(e, 10, H - 2) === 255 && wetAt(e, 10, H - 2) === 255);
  const s = box();
  for (let x = 5; x < 25; x++) s.set(x, H - 2, ids.SOIL);
  s.acid[s.idx(10, H - 2)] = 255;
  run(s, 100);
  check('酸は土へ染みて、離れるほど弱い', acidAt(s, 11, H - 2) > acidAt(s, 15, H - 2) && acidAt(s, 15, H - 2) > 0 && acidAt(s, 11, H - 2) > 5,
    `near=${acidAt(s, 11, H - 2).toFixed(1)} far=${acidAt(s, 15, H - 2).toFixed(1)}`);
  const g = box();
  for (let x = 5; x < 10; x++) g.set(x, H - 2, ids.SOIL);
  for (let x = 10; x < 14; x++) g.set(x, H - 2, ids.GLASS);
  for (let x = 14; x < 20; x++) g.set(x, H - 2, ids.SOIL);
  g.acid[g.idx(9, H - 2)] = 255;
  run(g, 300);
  check('酸はガラスの向こうへ染みない', acidAt(g, 16, H - 2) === 0, `far=${acidAt(g, 16, H - 2)}`);
}

// 5. 値は素材といっしょに動く
{
  const e = box();
  e.set(30, 5, ids.SOIL);
  e.wet[e.idx(30, 5)] = 150;
  e.acid[e.idx(30, 5)] = 90;
  e.swap(30, 5, 30, 6);
  check('入れ替えで湿り気度と酸性度が付いていく', e.get(30, 6) === ids.SOIL && wetAt(e, 30, 6) === 150 && acidAt(e, 30, 6) === 90);
  e.set(30, 6, ids.EMPTY);
  check('空きセルは乾いた中性', wetAt(e, 30, 6) === 0 && acidAt(e, 30, 6) === 0);
  e.set(30, 6, ids.SAND);
  check('空気から生まれたセルは乾いた中性', wetAt(e, 30, 6) === 0 && acidAt(e, 30, 6) === 0);
}

// 6. 土が乾く条件は自身の湿り気度（水の隣では乾かない）
{
  const e = box();
  e.setAmbientShift(34);
  const dry = [], wetSide = [];
  for (let x = 3; x < 10; x++) { e.set(x, H - 2, ids.SOIL); e.temp[e.idx(x, H - 2)] = 142; dry.push(x); }
  for (let x = 12; x < 17; x++) for (let y = H - 5; y < H - 1; y++) e.set(x, y, ids.WALL);
  for (let x = 13; x < 16; x++) for (let y = H - 4; y < H - 1; y++) e.set(x, y, ids.EMPTY);
  for (let y = H - 4; y < H - 1; y++) for (let x = 13; x < 17; x++) e.set(x, y, ids.WATER); // 壁で囲んだ水たまり
  e.set(17, H - 3, ids.WALL); e.set(17, H - 4, ids.WALL); e.set(17, H - 5, ids.WALL);
  for (let x = 17; x < 24; x++) { e.set(x, H - 2, ids.SOIL); e.temp[e.idx(x, H - 2)] = 142; wetSide.push(x); }
  e.set(12, H - 1, ids.WALL);
  run(e, 3000);
  const sand = xs => xs.filter(x => e.get(x, H - 2) === ids.SAND).length;
  check('水から離れた暑い土は砂になる', sand(dry) >= 5, `sand=${sand(dry)}/${dry.length}`);
  check('水源の隣の土は砂にならない', sand(wetSide) <= 2, `sand=${sand(wetSide)}/${wetSide.length}`);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

// 温度場の検証:  node tests/thermal.test.mjs
import { Engine } from '../src/engine.js';
import * as ids from '../src/materials/ids.js';
import {
  T_FREEZE, T_ICE_MELT, T_BOIL, T_LAVA, T_LAVA_SOLID, T_AMBIENT_GROUND, T_AMBIENT_TOP,
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

// 3b. 画面の外側とは熱をやり取りしない（断熱）
{
  // 全面を石で埋めた閉じた系: 外へ熱が逃げず、外から入ってもこないので、総熱量（温度×熱容量）が保存される
  const e = new Engine(40, 30);
  for (let i = 0; i < e.cells.length; i++) { e.cells[i] = ids.STONE; e.colors[i] = 0x808080; }
  for (let i = 0; i < e.cells.length; i++) e.temp[i] = 150;
  const total = () => { let s = 0; for (const t of e.temp) s += t; return s; };
  const t0 = total();
  run(e, 300);
  check('全面を埋めると端から熱が逃げない（気温より高くても温度が変わらない）', Math.abs(total() - t0) / t0 < 1e-4, `${t0.toFixed(1)} -> ${total().toFixed(1)}`);

  // 熱いセルが四隅・辺にあっても、外へ熱を捨てない（内側の隣とだけ熱を交換する）
  const c = new Engine(20, 20);
  for (let i = 0; i < c.cells.length; i++) { c.cells[i] = ids.STONE; c.colors[i] = 0x808080; c.temp[i] = 100; }
  c.temp[c.idx(0, 0)] = 200; c.temp[c.idx(19, 10)] = 200;
  const sum = () => { let s = 0; for (const t of c.temp) s += t; return s; };
  const s0 = sum();
  run(c, 200);
  check('端の熱源の熱は系の内側にとどまる', Math.abs(sum() - s0) / s0 < 1e-4, `${s0.toFixed(1)} -> ${sum().toFixed(1)}`);
}

// 3c. 環境の気温（設定のスライダー）: 全体を上下にずらす。高度による下がり方は変わらない
{
  const e = box();
  const g0 = e.ambientAt(H - 2), t0 = e.ambientAt(0);
  e.setAmbientShift(30);
  check('気温を上げると地表も上空も同じだけ上がる', Math.abs(e.ambientAt(H - 2) - g0 - 30) < 1e-3 && Math.abs(e.ambientAt(0) - t0 - 30) < 1e-3);
  check('気温を変えても高度による差は変わらない', Math.abs((e.ambientAt(H - 2) - e.ambientAt(0)) - (g0 - t0)) < 1e-3);
  run(e, 2);
  check('空きセルは新しい気温になる', Math.abs(e.temp[e.idx(40, 50)] - e.ambientAt(50)) < 1e-3);

  // 寒い環境では水が凍り、暑い環境では氷が融ける
  const pond = (shift, type, frames) => {
    const w = box();
    w.setAmbientShift(shift);
    for (let y = H - 4; y < H - 1; y++) for (let x = 20; x < 60; x++) { w.set(x, y, type); }
    run(w, frames);
    return [count(w, ids.ICE), count(w, ids.WATER)];
  };
  const [coldIce] = pond(-60, ids.WATER, 3000);
  const [normalIce] = pond(0, ids.WATER, 3000);
  check('気温を氷点より下にすると水が凍る', coldIce > 0 && normalIce === 0, `cold=${coldIce} normal=${normalIce}`);
  const [hotIce] = pond(60, ids.ICE, 1200);
  const [normalIce2] = pond(0, ids.ICE, 1200);
  check('氷は暑い環境のほうが速く融ける', hotIce < normalIce2, `hot=${hotIce} normal=${normalIce2}`);
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

// 5. 氷点以下の水は凍る。ただし凍結にも潜熱がいる（一瞬では凍らない）
{
  const hold = (type, temp, maxFrames) => {
    const e = box();
    e.set(40, H - 2, type); // 床の上
    let frames = -1;
    for (let f = 0; f < maxFrames && frames < 0; f++) {
      for (let i = 0; i < e.cells.length; i++) if (e.cells[i] === type) e.temp[i] = temp;
      e.update();
      if (count(e, type) === 0) frames = f + 1;
    }
    return frames;
  };
  const freezeFrames = hold(ids.WATER, T_FREEZE - 1, 400);
  check('氷点以下の水は凍る', freezeFrames > 0, `frames=${freezeFrames}`);
  check('凍結にも潜熱がいる（1 フレームでは凍らない）', freezeFrames > 1, `frames=${freezeFrames}`);
  // 凍結と融解は同じ潜熱を使う: どちらも温度差が大きいほど速く、1 フレームでは終わらない
  const meltFrames = hold(ids.ICE, T_FREEZE + 1, 400);
  check('融解にも潜熱がいる（1 フレームでは融けない）', meltFrames > 1, `frames=${meltFrames}`);
  const deepFreeze = hold(ids.WATER, T_FREEZE - 20, 400);
  const deepMelt = hold(ids.ICE, T_FREEZE + 20, 400);
  check('温度差が大きいほど凍結も融解も速い', deepFreeze > 0 && deepFreeze < freezeFrames && deepMelt > 0 && deepMelt < meltFrames, `freeze ${freezeFrames}->${deepFreeze} melt ${meltFrames}->${deepMelt}`);
}

// 5b. 暖かい環境では、氷が隣にあっても水は凍らず、氷は増えない（温度に関係なく凍る規則はない）
{
  const e = box();
  for (let y = H - 5; y < H - 1; y++) { for (let x = 20; x < 30; x++) e.set(x, y, ids.ICE); for (let x = 30; x < 40; x++) e.set(x, y, ids.WATER); }
  const ice0 = count(e, ids.ICE);
  run(e, 1500);
  check('暖かい環境で氷が水を凍らせて増えることはない', count(e, ids.ICE) <= ice0, `ice ${ice0} -> ${count(e, ids.ICE)}`);
}

// 5c. 雪は氷点に近い冷たい池では氷になり、暖かい池ではただ水になる（池の水温はすぐ気温に近づくので、水面のすぐ上から落とす）
{
  const pond = (waterTemp) => {
    const e = box();
    for (let y = H - 4; y < H - 1; y++) for (let x = 20; x < 60; x++) { e.set(x, y, ids.WATER); e.temp[e.idx(x, y)] = waterTemp; }
    let iceMax = 0;
    for (let f = 0; f < 40; f++) {
      if (f % 2 === 0) e.set(20 + ((f * 7) % 40), H - 8, ids.SNOW);
      e.update();
      iceMax = Math.max(iceMax, count(e, ids.ICE));
    }
    return iceMax;
  };
  const cold = pond(T_FREEZE + 6), warm = pond(T_AMBIENT_GROUND);
  check('雪は氷点に近い冷たい池の水面で氷になる', cold >= 3, `ice=${cold}`);
  check('暖かい池では雪は融けて水になるだけで氷はできない', warm === 0, `ice=${warm}`);
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

// 6b. 氷・雪の初期温度は氷点のすぐ下（冷たすぎない）。氷点を超えたら融け、暖かい空気ではやがて融ける
{
  const e = box();
  e.set(40, H - 2 - 1, ids.ICE);
  const t0 = e.temp[e.idx(40, H - 2 - 1)];
  check('氷は氷点のすぐ下の温度で置かれる', t0 < T_FREEZE && t0 >= T_FREEZE - 12, `t0=${t0}`);
  const s = box(); s.set(40, 90, ids.SNOW);
  const ts = s.temp[s.idx(40, 90)];
  check('雪も氷点のすぐ下の温度で置かれる', ts < T_FREEZE && ts >= T_FREEZE - 12, `ts=${ts}`);

  const h = box();
  h.set(40, H - 2 - 1, ids.ICE);
  let melted = -1;
  for (let f = 0; f < 3000 && melted < 0; f++) { h.update(); if (count(h, ids.ICE) === 0) melted = f; }
  check('暖かい地表の氷は、放っておけばやがて融ける', melted >= 0, `ice=${count(h, ids.ICE)} after 3000f`);
}

// 6c. 融解には潜熱がいる: 氷点を超えても一瞬では融けず、熱を受けた端から順に融ける
{
  const e = box();
  const y = H - 2;
  for (let x = 10; x < 20; x++) e.set(x, y, ids.ICE);
  // 左端の壁（x=9）を熱源にして、左から右へ熱を流す
  e.set(9, y, ids.WALL);
  let firstGone = -1, order = [];
  let stillIceAtFirstMelt = 0, allGone = -1;
  for (let f = 0; f < 6000 && allGone < 0; f++) {
    e.temp[e.idx(9, y)] = 130;
    e.update();
    const iceX = [];
    for (let x = 10; x < 20; x++) if (e.get(x, y) === ids.ICE) iceX.push(x);
    if (firstGone < 0 && iceX.length < 10) { firstGone = f; stillIceAtFirstMelt = iceX.length; }
    if (iceX.length === 0) allGone = f;
  }
  check('氷点を超えても一斉には融けない（はじめの 1 セルが融けた時点で残りはまだ氷）', firstGone >= 0 && stillIceAtFirstMelt >= 5, `firstGone=${firstGone} remaining=${stillIceAtFirstMelt}`);
  check('熱源から遠い氷ほど遅れて融ける（全部融けるまでに時間差がある）', allGone > firstGone + 100, `first=${firstGone} all=${allGone}`);
}

// 6d. 氷点を超えた氷の温度は氷点に留まる（熱は融解に使われる）
{
  const e = box();
  e.set(40, H - 2 - 1, ids.ICE);
  let maxT = 0;
  for (let f = 0; f < 600; f++) {
    e.update();
    for (let i = 0; i < e.cells.length; i++) if (e.cells[i] === ids.ICE) maxT = Math.max(maxT, e.temp[i]);
  }
  check('氷の温度は氷点を超えない', maxT <= T_FREEZE + 0.5, `maxT=${maxT.toFixed(1)}`);
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

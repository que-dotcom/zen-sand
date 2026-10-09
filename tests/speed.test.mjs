// 倍速ガバナーの検証: 実測コストから「60fps を保てる上限」が動的に決まること。
//   node tests/speed.test.mjs
import { SpeedGovernor } from '../src/speed.js';

let passed = 0, failed = 0;
function check(name, ok, detail = '') {
  if (ok) { passed++; console.log(`PASS  ${name}`); }
  else { failed++; console.log(`FAIL  ${name}  ${detail}`); }
}

// stepMs / renderMs を一定にして warmup 分だけ回す
function feed(g, { stepMs, renderMs, frames = 40, steps = 1, now = 0 }) {
  for (let f = 0; f < frames; f++) g.recordWork(stepMs * steps, steps, renderMs, now);
}

// 1. 較正前は 1× 固定
{
  const g = new SpeedGovernor();
  check('較正前の上限は 1×', g.maxSpeed() === 1);
  g.cycle();
  check('較正前は倍速にならない', g.speed === 1);
}

// 2. 軽い端末（1ステップ 0.2ms, 描画 1ms）→ 上限まで上がる
{
  const g = new SpeedGovernor();
  feed(g, { stepMs: 0.2, renderMs: 1 });
  // 予算 12.5ms - 描画 1ms = 11.5ms / 0.2ms = 57.5 → 上限 57×（固定値ではなく実測から導出）
  check('軽い端末の上限は実測から導かれる (57×)', g.maxSpeed() === 57, `max=${g.maxSpeed()}`);
  check('選べる倍速は 2 の乗数（上限まで）と最速', g.options().join() === '1,2,4,8,16,32,Infinity', g.options().join());
  const seen = [];
  for (let i = 0; i < 8; i++) seen.push(g.cycle());
  check('cycle は上限まで上がり 1 に戻る', seen.join() === '2,4,8,16,32,57,1,2', seen.join());
  const g2 = new SpeedGovernor();
  feed(g2, { stepMs: 0.1, renderMs: 1 });
  check('端末が速ければ上限も高くなる', g2.maxSpeed() > g.maxSpeed(), `${g2.maxSpeed()} vs ${g.maxSpeed()}`);
}

// 3. 重い端末（1ステップ 4ms, 描画 3ms）→ 予算 12.5-3=9.5ms / 4ms = 2.4 → 2×
{
  const g = new SpeedGovernor();
  feed(g, { stepMs: 4, renderMs: 3 });
  check('重い端末の上限は 2×', g.maxSpeed() === 2, `max=${g.maxSpeed()}`);
  check('その場合の選択肢は 1×, 2×, 最速', g.options().join() === '1,2,Infinity', g.options().join());
}

// 4. 1ステップが予算を超える端末は 1× のまま
{
  const g = new SpeedGovernor();
  feed(g, { stepMs: 20, renderMs: 3 });
  check('極端に重いと 1× のまま', g.maxSpeed() === 1);
  g.cycle();
  check('その場合 cycle しても 1×', g.speed === 1);
}

// 5. 負荷が増えたら自動で速度が下がり、軽くなれば上限が戻る
{
  const g = new SpeedGovernor();
  feed(g, { stepMs: 0.2, renderMs: 1 });
  while (g.speed < g.maxSpeed()) g.cycle();
  const before = g.speed;
  let lowered = false;
  for (let i = 0; i < 80; i++) lowered = g.recordWork(3 * g.speed, g.speed, 1) || lowered;
  check('盤面が重くなると速度が下がる', lowered && g.speed < before, `speed=${g.speed} before=${before}`);
  check('下げた先は新しい上限以内', g.speed <= g.maxSpeed(), `speed=${g.speed} max=${g.maxSpeed()}`);
  for (let i = 0; i < 120; i++) g.recordWork(0.2, 1, 1);
  check('軽くなれば上限が戻る', g.maxSpeed() >= 50, `max=${g.maxSpeed()}`);
}

// 6. ステップ 0 のフレーム（高リフレッシュレート）でも壊れない
{
  const g = new SpeedGovernor();
  feed(g, { stepMs: 0.2, renderMs: 1, frames: 10 });
  for (let i = 0; i < 30; i++) g.recordWork(0, 0, 1);
  check('ステップ 0 のフレームを混ぜても上限が算出できる', g.calibrated && g.maxSpeed() >= 50);
}

// 7. フィードバック: コストモデルが外れて実フレームが遅れたら一段下げる
{
  const g = new SpeedGovernor();
  feed(g, { stepMs: 0.2, renderMs: 1 });
  while (g.speed < 8) g.cycle();
  let lowered = false;
  for (let i = 0; i < 20; i++) lowered = g.recordFrameInterval(25, 1000) || lowered;
  check('遅延フレームが続くと半分に下がる', lowered && g.speed === 4, `speed=${g.speed}`);
  check('抑制中は上限が 4× に制限される', g.maxSpeed(2000) === 4, `max=${g.maxSpeed(2000)}`);
  // 遅れが続けばさらに一段ずつ下がる
for (let i = 0; i < 40; i++) g.recordFrameInterval(25, 1500);
check('遅れが続けばさらに下がる', g.speed === 1, `speed=${g.speed}`);
check('抑制は時間が経てば解ける', g.maxSpeed(1500 + g.penaltyMs + 1) === 57);
}

// 8. 長い中断（タブ切替）は遅延として数えない
{
  const g = new SpeedGovernor();
  feed(g, { stepMs: 0.2, renderMs: 1 });
  while (g.speed < 8) g.cycle();
  for (let i = 0; i < 100; i++) g.recordFrameInterval(5000, 0);
  check('長い中断では下がらない', g.speed === 8);
}

// 8b. 最速: 特定の数値ではなく、上限にいつも追従する
{
  const g = new SpeedGovernor();
  feed(g, { stepMs: 0.2, renderMs: 1 });
  const reqs = []; for (let i = 0; i < 9; i++) { g.cycle(); reqs.push(g.requested); }
  check('希望は 2 の乗数を順に進み、最速の次は 1× に戻る', reqs.join() === '2,4,8,16,32,Infinity,1,2,4', reqs.join());
  while (!g.fastest) g.cycle();
  check('最速の速さはその時点の上限', g.speed === g.maxSpeed() && g.speed === 57, `speed=${g.speed} max=${g.maxSpeed()}`);
  check('最速は上限に抑えられた状態とは言わない', !g.limited);
  g.recordWork(8, 1, 1, 0); // 重くなる
  check('重くなると最速は上限に合わせて遅くなる', g.fastest && g.speed === g.maxSpeed() && g.speed < 5, `speed=${g.speed}`);
  for (let i = 0; i < 200; i++) g.recordWork(0.2, 1, 1, 0);
  check('軽くなると最速は上限に合わせて速くなる', g.fastest && g.speed === g.maxSpeed() && g.speed > 50, `speed=${g.speed}`);
  const fresh = new SpeedGovernor();
  fresh.cycle(); // 較正前は選べるのは 1× と最速だけ
  check('較正前は最速を選んでも 1×（測定が済めば追従）', fresh.requested === Infinity && fresh.speed === 1);
}

// 9. 負荷が急に増えたら、平均が追いつく前に上限が即座に下がる（ピークホールド）
{
  const g = new SpeedGovernor();
  feed(g, { stepMs: 0.1, renderMs: 1 });
  const light = g.maxSpeed();
  while (g.requested < light) g.cycle();
  g.recordWork(6, 1, 1, 0); // 1 ステップが 0.1ms → 6ms に急増した 1 フレーム
  check('負荷が急増したら上限が即座に下がる（平均に引きずられない）', g.maxSpeed() <= 2 && g.speed <= 2, `max=${g.maxSpeed()} speed=${g.speed} (light=${light})`);
  check('急増しても平均だけで見積もっていた上限より低い', g.maxSpeed() < light / 10);
  for (let i = 0; i < 200; i++) g.recordWork(0.1, 1, 1, 0);
  check('負荷が戻れば上限も戻る（ピークはゆっくり減る）', g.maxSpeed() > 50, `max=${g.maxSpeed()}`);
}

// 10. 希望の倍速は覚えておき、上限が回復すれば自動で戻る
{
  const g = new SpeedGovernor();
  feed(g, { stepMs: 0.2, renderMs: 1 });
  while (g.requested < 16) g.cycle();
  check('希望を選ぶと、上限が足りていればそのまま 16×', g.speed === 16 && !g.limited);
  g.recordWork(8, 1, 1, 0); // 重くなる
  check('重くなると実際の速度だけ下がり、希望は残る', g.speed < 16 && g.requested === 16 && g.limited, `speed=${g.speed} req=${g.requested}`);
  for (let i = 0; i < 200; i++) g.recordWork(0.2, 1, 1, 0);
  check('軽くなると希望の 16× まで自動で戻る', g.speed === 16 && !g.limited, `speed=${g.speed}`);
  g.cycle();
  check('cycle は希望を進める（上限の外から 1× に戻る）', g.requested > 16 || g.requested === 1);
}

// 11. 時間で打ち切る: 予算を使い切ったら残りのステップは回さず、速度を達成率まで下げる
{
  const g = new SpeedGovernor();
  feed(g, { stepMs: 0.1, renderMs: 1 });
  while (g.requested < 100) g.cycle();
  let clockNow = 0, calls = 0;
  const run = g.runSteps(100, () => { calls++; clockNow += 2; }, () => clockNow); // 1 ステップが実は 2ms かかる
  const budget = g.frameBudget;
  check('予算を超えたら残りのステップを諦める', run.truncated && run.done < 100 && run.done === calls, `done=${run.done} budget=${budget.toFixed(1)}`);
  check('打ち切りのときも予算を大きく超えない（超過は最大 1 ステップ分）', run.ms <= budget + 2 + 1e-6, `ms=${run.ms} budget=${budget.toFixed(1)}`);
  check('打ち切ったら速度を達成率まで下げる', g.speed < 100 && g.speed >= 1, `speed=${g.speed}`);
  const g2 = new SpeedGovernor(); feed(g2, { stepMs: 0.1, renderMs: 1 });
  let t2 = 0; const run2 = g2.runSteps(1, () => { t2 += 999; }, () => t2);
  check('予算がなくても最低 1 ステップは回す', run2.done === 1 && !run2.truncated);
  const g3 = new SpeedGovernor(); feed(g3, { stepMs: 0.1, renderMs: 1 });
  let t3 = 0; const run3 = g3.runSteps(5, () => { t3 += 0.01; }, () => t3);
  check('軽ければ全ステップ回す', run3.done === 5 && !run3.truncated);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

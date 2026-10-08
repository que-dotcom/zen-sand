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
  check('選べる倍速は倍々＋上限そのもの', g.options().join() === '1,2,4,8,16,32,57', g.options().join());
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
  check('その場合の選択肢は 1×, 2×', g.options().join() === '1,2', g.options().join());
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

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

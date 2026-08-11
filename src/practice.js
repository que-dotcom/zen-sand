import {
  EMPTY, STONE, SAND, WATER, LAVA, OIL, COAL, SOIL, MUD, GLASS,
  OBSIDIAN, SANDSTONE, BASALT, STEAM, FIRE, PLANT, DARK_PLANT, FLOWER, SPARK, KINTSUGI,
  FUNGUS, GLOW_FUNGUS, ICE, LAVA_SPRING, HARD_SOIL, METAL, RUST, FIREFLY,
  LIGHTNING, SEED, SNOW, GOLD,
} from './materials.js';

export function stripRuby(s) {
  return s.replace(/([一-龠々〆〤ヶ]+)\{([^}]+)\}/g, '$1');
}

// ─── 実験帳 (Practice Mode) ──────────────────────────────────────────────────
//
// シナリオとは別の練習モード。お題の化学反応ごとに「画面全体の情景」を設置し、
// プレイヤーが素材を注いで反応を起こす。成功判定は「生成物のセル数が
// ベースラインから goal 以上増えたか」を毎フレーム数えるだけ —— 素材コードには
// 一切手を入れない汎用方式。成功したら約2秒の余韻ののち次のお題へ進む。
//
// 設計原則:
// - 舞台は画面の底から積み上げ、幅いっぱいに広げる（画面端が壁の役割をするので
//   枠は不要。空中の小さな受け皿は見づらい）
// - プレイヤーに置かせる素材は「落ちる・流れる」ものだけ（火・水・溶岩・雷・雪・
//   種・金）。氷のような固定素材は空中に貼り付いて反応できず、
//   「反応しているのに判定されない」体験になるため使わせない

// ─── 舞台設置ヘルパー ────────────────────────────────────────────────────────

function set(e, x, y, type) { if (e.inBounds(x, y)) e.set(x, y, type); }

function fillRect(e, x0, y0, x1, y1, type) {
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) set(e, x, y, type);
}

// 三角の山（砂丘・火山・畝に使う）。基部の半幅 = h
function mound(e, mx, baseY, h, mat) {
  for (let dy = 0; dy < h; dy++) {
    for (let x = mx - (h - dy - 1); x <= mx + (h - dy - 1); x++) set(e, x, baseY - dy, mat);
  }
}

// 舞台の基準座標（テストからも同じ式で参照する）
export function stageFrame(engine) {
  return {
    W: engine.width,
    H: engine.height,
    cx: Math.floor(engine.width / 2),
  };
}

// ─── お題16題 ────────────────────────────────────────────────────────────────
// products: 数える生成物 / goal: 成功に必要な増分（ベースライン比）

export const DRILLS = [
  {
    id: 'wildfire', title: '野火', goal: 12, products: [FIRE], place: [FIRE],
    hint: '乾{かわ}いた 草原{そうげん}に、火{ひ} [4] を 放{はな}ってみよう',
    react: '火{ひ}が 草{くさ}に 燃{も}えうつったよ！',
    learn: '乾{かわ}いた 草{くさ}に 火{ひ}が つくと、燃{も}えて どんどん 広{ひろ}がるよ。燃{も}えた あとには、白{しろ}い 灰{はい}が のこるんだ。',
    done: '炎は草を走り、あとに灰が残る',
    setup(e) {
      const { W, H } = stageFrame(e);
      fillRect(e, 0, H - 3, W - 1, H - 1, SOIL);
      for (let x = 0; x <= W - 1; x++) {
        if (Math.random() < 0.30) continue; // 疎らな地肌を残す
        const h = 2 + Math.floor(Math.random() * 4);
        for (let dy = 1; dy <= h; dy++) set(e, x, H - 3 - dy, PLANT);
        if (Math.random() > 0.75) set(e, x, H - 4 - h, FLOWER);
      }
    },
  },
  {
    id: 'oilfield', title: '油田の雷鳴', goal: 30, products: [FIRE], place: [LIGHTNING],
    hint: '黒{くろ}い 油{あぶら}の 海{うみ}に、雷{かみなり} [t] を 落{お}としてみよう',
    react: '雷{かみなり}で 油{あぶら}に 火{ひ}が ついた！',
    learn: '油{あぶら}は とても 燃{も}えやすい 液体{えきたい}。雷{かみなり}の 火花{ひばな}が つくと、いっきに 炎{ほのお}の 海{うみ}に なるよ。',
    done: '稲妻は油田を、炎の海へ変えた',
    setup(e) {
      const { W, H } = stageFrame(e);
      fillRect(e, 0, H - 3, W - 1, H - 1, STONE);
      const left = Math.floor(W * 0.09), right = Math.floor(W * 0.91);
      fillRect(e, left, H - Math.max(15, Math.floor(H * 0.13)), right, H - 4, OIL);
      mound(e, Math.floor(W * 0.08), H - 4, Math.max(10, Math.floor(H * 0.16)), STONE);
      mound(e, Math.floor(W * 0.92), H - 4, Math.max(10, Math.floor(H * 0.17)), STONE);
      for (let x = Math.floor(W * 0.22); x < right; x += Math.max(12, Math.floor(W * 0.16))) {
        fillRect(e, x, H - Math.max(19, Math.floor(H * 0.18)), x + 1, H - 4, STONE);
      }
    },
  },
  {
    id: 'steam', title: '湯けむり', goal: 10, products: [STEAM], place: [FIRE, LAVA],
    hint: '岩{いわ}の 間{あいだ}の 泉{いずみ}に、火{ひ} [4] か 溶岩{ようがん} [6] を 入{い}れてみよう',
    react: '水{みず}が 温{あたた}まって 湯気{ゆげ}が 出{で}てきた！',
    learn: '水{みず}は 熱{あつ}くなると「蒸気{じょうき}（湯気{ゆげ}）」に なって、空{そら}へ のぼっていくよ。温泉{おんせん}の 湯{ゆ}けむりと 同{おな}じだね。',
    done: '湯けむりが立ちのぼる',
    setup(e) {
      const { W, H, cx } = stageFrame(e);
      const pw = Math.floor(W * 0.15); // 泉の半幅
      fillRect(e, 0, H - 4, W - 1, H - 1, STONE);      // 地表は水面と同じ高さ（蓋にしない）
      mound(e, Math.floor(W * 0.15), H - 5, 5, STONE); // 岸の岩
      mound(e, Math.floor(W * 0.85), H - 5, 4, STONE);
      fillRect(e, cx - pw, H - 4, cx + pw, H - 2, WATER);
    },
  },
  {
    id: 'stone', title: '溶岩流', goal: 10, products: [STONE], place: [WATER],
    hint: '山{やま}を 流{なが}れる 溶岩{ようがん}に、水{みず} [2] を かけてみよう',
    react: '溶岩{ようがん}が 水{みず}で 冷{ひ}やされて 石{いし}に なった！',
    learn: 'あつあつの 溶岩{ようがん}は、水{みず}に ふれると いっきに 冷{ひ}やされて、硬{かた}い 石{いし}に かわるよ。',
    done: '流れは、岩の段になって止まった',
    setup(e) {
      const { W, H } = stageFrame(e);
      const slopeR = Math.floor(W * 0.55);       // 山裾の右端
      const hMax   = Math.floor(H * 0.45);       // 山頂の高さ
      // 左が高い赤土の山肌（固い土は溶岩に溶けない）。右は開けた平地
      fillRect(e, 0, H - 2, W - 1, H - 1, HARD_SOIL);
      for (let x = 0; x <= slopeR; x++) {
        const h = Math.max(2, Math.round(hMax * (slopeR - x) / slopeR));
        fillRect(e, x, H - 1 - h, x, H - 1, HARD_SOIL);
      }
      // 山頂の溶岩源泉と、最初から流れ下る溶岩の舌
      set(e, 0, H - 2 - hMax, LAVA_SPRING);
      set(e, 1, H - 2 - hMax, LAVA_SPRING);
      for (let x = 2; x <= Math.floor(slopeR * 0.7); x++) {
        const h = Math.max(2, Math.round(hMax * (slopeR - x) / slopeR));
        set(e, x, H - 2 - h, LAVA);
      }
    },
  },
  {
    id: 'glass', title: '雷とガラス', goal: 8, products: [GLASS], place: [LIGHTNING],
    hint: '砂山{すなやま}に、雷{かみなり} [t] を 落{お}としてみよう',
    react: '雷{かみなり}が 砂{すな}を ガラスに 変{か}えた！',
    learn: '雷{かみなり}は ものすごく 熱{あつ}い。砂{すな}が 溶{と}けて 冷{ひ}えると、透明{とうめい}な ガラスに なるんだ。本物{ほんもの}の 砂漠{さばく}でも 起{お}きることだよ。',
    done: '雷の通り道が、ガラスの脈になった',
    setup(e) {
      const { W, H } = stageFrame(e);
      fillRect(e, 0, H - 3, W - 1, H - 1, SAND);
      mound(e, Math.floor(W * 0.20), H - 3, Math.floor(H * 0.10), SAND);
      mound(e, Math.floor(W * 0.45), H - 3, Math.floor(H * 0.16), SAND);
      mound(e, Math.floor(W * 0.70), H - 3, Math.floor(H * 0.09), SAND);
      mound(e, Math.floor(W * 0.88), H - 3, Math.floor(H * 0.12), SAND);
    },
  },
  {
    id: 'sandstone', title: '砂の炉', goal: 10, products: [SANDSTONE], place: [LAVA],
    hint: '砂山{すなやま}の 上{うえ}から、溶岩{ようがん} [6] を 流{なが}してみよう',
    react: '砂{すな}が 焼{や}きかたまって 岩{いわ}に なってきた！',
    learn: '砂{すな}は 溶岩{ようがん}の 熱{ねつ}で 焼{や}きかたまると、「砂岩{さがん}」という 岩{いわ}に なるよ。',
    done: '砂は焼き締まり、金色の岩肌になった',
    setup(e) {
      const { W, H } = stageFrame(e);
      fillRect(e, 0, H - 3, W - 1, H - 1, STONE);
      fillRect(e, Math.floor(W * 0.07), H - Math.max(18, Math.floor(H * 0.16)),
        Math.floor(W * 0.93), H - 4, SAND);
      mound(e, Math.floor(W * 0.24), H - 4, Math.max(11, Math.floor(H * 0.16)), SAND);
      mound(e, Math.floor(W * 0.60), H - 4, Math.max(16, Math.floor(H * 0.23)), SAND);
      mound(e, Math.floor(W * 0.86), H - 4, Math.max(9, Math.floor(H * 0.13)), SAND);
    },
  },
  {
    id: 'obsidian', title: '火口', goal: 8, products: [OBSIDIAN], place: [SNOW],
    hint: '火口{かこう}に、雪{ゆき} [3] を 降{ふ}らせてみよう',
    react: '雪{ゆき}で 冷{ひ}やされて 黒{くろ}い 石{いし}が できた！',
    learn: '溶岩{ようがん}が 急{きゅう}に 冷{ひ}やされると、黒{くろ}くて ぴかぴかの「黒曜石{こくようせき}」に なるよ。大昔{おおむかし}の 人{ひと}は、これで 矢尻{やじり}を 作{つく}ったんだ。',
    done: '火口は、漆黒の鏡石で蓋をされた',
    setup(e) {
      const { W, H, cx } = stageFrame(e);
      // 台形の楯状火山。山頂に広く開けた溶岩湖を持つ
      // - 深い縦穴にしないのは、融け水が溜まって氷の栓ができ溶岩が密封されるため
      // - 縁の石は溶岩面と同じ高さ: 融け水は溜まらず山腹へ流れ落ちる
      const baseHW = Math.floor(W * 0.30);               // 山裾の半幅
      const topHW  = Math.max(14, Math.floor(W * 0.09)); // 山頂の半幅
      const vh     = Math.max(20, Math.floor(H * 0.28)); // 山の高さ
      fillRect(e, 0, H - 2, W - 1, H - 1, STONE);
      for (let dy = 0; dy < vh; dy++) {
        const hw = Math.round(baseHW + (topHW - baseHW) * (dy / (vh - 1)));
        for (let x = cx - hw; x <= cx + hw; x++) set(e, x, H - 2 - dy, STONE);
      }
      const lakeTop = H - 1 - vh; // 山頂の行 = 溶岩面
      fillRect(e, cx - (topHW - 2), lakeTop, cx + (topHW - 2), lakeTop + 2, LAVA);
      // 源泉は置かない: 溶岩が無限だと、できた黒曜石が下から再溶融して定着しないため
    },
  },
  {
    id: 'basalt', title: '泥田', goal: 8, products: [BASALT], place: [LAVA],
    hint: '泥{どろ}の 田{た}んぼに、溶岩{ようがん} [6] を 注{そそ}いでみよう',
    react: '泥{どろ}が 焼{や}けて 硬{かた}い 岩{いわ}に なった！',
    learn: '泥{どろ}は 溶岩{ようがん}の 熱{ねつ}で 焼{や}きしまると、「玄武岩{げんぶがん}」という 黒{くろ}い 岩{いわ}に なるよ。',
    done: '泥は焼き締まり、玄武岩になった',
    setup(e) {
      const { W, H } = stageFrame(e);
      fillRect(e, 0, H - 4, W - 1, H - 1, SOIL);
      // 2枚の泥田と畦（あぜ）
      fillRect(e, Math.floor(W * 0.12), H - 4, Math.floor(W * 0.44), H - 2, MUD);
      fillRect(e, Math.floor(W * 0.56), H - 4, Math.floor(W * 0.88), H - 2, MUD);
      fillRect(e, Math.floor(W * 0.27), H - 4, Math.floor(W * 0.28), H - 2, SOIL);
      fillRect(e, Math.floor(W * 0.71), H - 4, Math.floor(W * 0.72), H - 2, SOIL);
    },
  },
  {
    id: 'glow-cave', title: '夜光洞', goal: 12, products: [GLOW_FUNGUS], place: [OIL],
    hint: '洞穴{ほらあな}の きのこに、油{あぶら} [5] を 注{そそ}いでみよう',
    react: 'きのこが 光{ひか}りはじめた！',
    learn: 'この きのこは 油{あぶら}を 吸{す}いこむと、青緑{あおみどり}に 光{ひか}る「光{ひかり}きのこ」に かわるよ。暗{くら}い 洞穴{ほらあな}の 明{あか}りに なるね。',
    done: '菌床は青緑の灯りを宿した',
    setup(e) {
      const { W, H } = stageFrame(e);
      fillRect(e, 0, H - 3, W - 1, H - 1, STONE);
      const wallW = Math.max(8, Math.floor(W * 0.10));
      fillRect(e, 0, H - Math.max(34, Math.floor(H * 0.32)), wallW, H - 4, STONE);
      fillRect(e, W - 1 - wallW, H - Math.max(36, Math.floor(H * 0.34)), W - 1, H - 4, STONE);
      for (let x = wallW + 10; x < W - wallW - 10; x += Math.max(24, Math.floor(W * 0.18))) {
        const h = 8 + ((x * 5) % 12);
        fillRect(e, x, 0, x + 2, h, STONE); // 天井の鍾乳石。間から油を落とせる
      }
      for (let x = wallW + 8; x < W - wallW - 8; x += Math.max(18, Math.floor(W * 0.13))) {
        const h = 7 + ((x * 7) % 10);
        fillRect(e, x, H - 4 - h, x + 2, H - 4, STONE);
      }
      for (let x = wallW + 3; x < W - wallW - 3; x += 3) set(e, x, H - 4, FUNGUS);
      for (let x = wallW + 12; x < W - wallW - 12; x += 6) set(e, x, H - 12, FUNGUS);
    },
  },
  {
    id: 'sprout', title: '畑', goal: 3, products: [PLANT, FLOWER], place: [SEED],
    hint: '畑{はたけ}の 畝{うね}に、種{たね} [w] を まいてみよう',
    react: '種{たね}から 芽{め}が 出{で}たよ！',
    learn: '種{たね}は、土{つち}と 水{みず}が そろうと 芽{め}を 出{だ}すよ。育{そだ}つと、やがて 花{はな}も 咲{さ}くんだ。',
    done: '畑に、緑が目を覚ます',
    setup(e) {
      const { W, H } = stageFrame(e);
      fillRect(e, 0, H - 4, W - 1, H - 1, SOIL);
      for (let x = 8; x <= Math.floor(W * 0.68); x += 8) mound(e, x, H - 5, 2, SOIL); // 畝
      const pL = Math.floor(W * 0.76), pR = Math.floor(W * 0.92);
      fillRect(e, pL, H - 6, pL, H - 1, STONE);   // 石張りの水瓶
      fillRect(e, pR, H - 6, pR, H - 1, STONE);
      fillRect(e, pL + 1, H - 5, pR - 1, H - 2, WATER);
    },
  },
  {
    id: 'sumi-night', title: '墨田の夜', goal: 8, products: [DARK_PLANT], place: [WATER],
    hint: '① 画面{がめん}の 下{した}の 黒{くろ}い 墨畑{すみばたけ}に、水{みず} [2] を 流{なが}してみよう',
    react: '墨{すみ}の 泥{どろ}から 黒{くろ}い 草{くさ}が 生{は}えた！',
    learn: '墨{すみ}と 水{みず}が 混{ま}ざると、黒{くろ}い 泥{どろ}に なる。その 泥{どろ}から 育{そだ}った 草{くさ}は、夜{よる}の 色{いろ}に なるんだ。',
    instructions: [
      { products: [MUD], goal: 10, hint: '② できた 黒{くろ}い 泥{どろ}の 上{うえ}に、種{たね} [w] を まいてみよう', place: [SEED] },
    ],
    done: '墨の泥から、夜色の草が伸びた',
    setup(e) {
      const { W, H } = stageFrame(e);
      fillRect(e, 0, H - 3, W - 1, H - 1, STONE);
      const left = Math.floor(W * 0.08), right = Math.floor(W * 0.92);
      const bankTop = H - Math.max(18, Math.floor(H * 0.16));
      fillRect(e, 0, bankTop, left - 1, H - 4, HARD_SOIL);
      fillRect(e, right + 1, bankTop, W - 1, H - 4, HARD_SOIL);
      fillRect(e, left, H - Math.max(12, Math.floor(H * 0.12)), right, H - 4, COAL);
      for (let x = left; x <= right; x += Math.max(16, Math.floor(W * 0.15))) {
        fillRect(e, x, H - Math.max(17, Math.floor(H * 0.16)), x + 1, H - 6, STONE);
      }
      mound(e, Math.floor(W * 0.13), H - 4, Math.max(8, Math.floor(H * 0.11)), STONE);
      mound(e, Math.floor(W * 0.87), H - 4, Math.max(9, Math.floor(H * 0.12)), STONE);
    },
  },
  {
    id: 'freeze', title: '凍る池', goal: 10, products: [ICE], place: [SNOW],
    hint: '池{いけ}に、雪{ゆき} [3] を 降{ふ}らせてみよう',
    react: '池{いけ}が 凍{こお}りはじめた！',
    learn: '水{みず}は 雪{ゆき}で 冷{ひ}やされると、凍{こお}って「氷{こおり}」に なるよ。寒{さむ}い 冬{ふゆ}の 池{いけ}と 同{おな}じだね。',
    done: '池は、静かに凍りついた',
    setup(e) {
      const { W, H, cx } = stageFrame(e);
      const pw = Math.floor(W * 0.25);
      fillRect(e, 0, H - 4, W - 1, H - 1, STONE);      // 地表は水面と同じ高さ（蓋にしない）
      mound(e, Math.floor(W * 0.10), H - 5, 4, STONE);
      mound(e, Math.floor(W * 0.90), H - 5, 5, STONE);
      fillRect(e, cx - pw, H - 4, cx + pw, H - 2, WATER);
    },
  },
  {
    id: 'spark', title: '雷鳴の池', goal: 8, products: [SPARK], place: [LIGHTNING],
    hint: '池{いけ}の 水面{みなも}に、雷{かみなり} [t] を 落{お}としてみよう',
    react: '電気{でんき}が 水{みず}の 中{なか}を 走{はし}った！',
    learn: '水{みず}は 電気{でんき}を 通{とお}すよ。だから 雷{かみなり}が 落{お}ちると、池{いけ} 全体{ぜんたい}に 電気{でんき}が 広{ひろ}がるんだ。本物{ほんもの}の 雷{かみなり}の 日{ひ}は、プールや 池{いけ}に 入{はい}っちゃ だめだよ。',
    done: '水は一瞬、光の網になる',
    setup(e) {
      const { W, H } = stageFrame(e);
      fillRect(e, 0, H - 4, W - 1, H - 1, STONE);      // 地表は水面と同じ高さ（蓋にしない）
      fillRect(e, Math.floor(W * 0.10), H - 4, Math.floor(W * 0.90), H - 2, WATER);
      // 水面から顔を出す岩の小島
      fillRect(e, Math.floor(W * 0.34), H - 5, Math.floor(W * 0.36), H - 2, STONE);
      fillRect(e, Math.floor(W * 0.62), H - 5, Math.floor(W * 0.63), H - 2, STONE);
    },
  },
  {
    id: 'rust-sea', title: '錆の海', goal: 8, products: [RUST], place: [METAL],
    hint: '海{うみ}に、金属{きんぞく} [r] を 沈{しず}めてみよう',
    react: '金属{きんぞく}が 錆{さ}びて 赤{あか}くなってきた！',
    learn: '鉄{てつ}は 水{みず}に 濡{ぬ}れると、少{すこ}しずつ 赤{あか}い「錆{さび}」に 変{か}わるよ。自転車{じてんしゃ}を 雨{あめ}ざらしに すると 錆{さ}びるのと 同{おな}じだね。',
    done: '波の底で、鉄は赤い砂になった',
    setup(e) {
      const { W, H } = stageFrame(e);
      fillRect(e, 0, H - 3, W - 1, H - 1, STONE);
      // 広い入江。石の地表と水面を揃え、上から落とした金属が水に届くようにする
      fillRect(e, Math.floor(W * 0.04), H - Math.max(18, Math.floor(H * 0.13)),
        Math.floor(W * 0.96), H - 4, WATER);
    },
  },
  {
    id: 'firefly-brook', title: '蛍の沢', goal: 8, products: [FIREFLY], place: [WATER],
    hint: '草{くさ}むらの 沢{さわ}に、水{みず} [2] を 注{そそ}いでみよう',
    react: '草{くさ}の 間{あいだ}から 蛍{ほたる}が 生{う}まれた！',
    learn: '蛍{ほたる}は、きれいな 水辺{みずべ}の 草{くさ}むらが 大好{だいす}き。水{みず}が あると 集{あつ}まってきて、ぴかぴか 光{ひか}って 飛{と}ぶよ。',
    done: '草のあいだに、淡い灯がともる',
    setup(e) {
      const { W, H } = stageFrame(e);
      fillRect(e, 0, H - 3, W - 1, H - 1, SOIL);
      // 沢が満ちるのを待つ低い草むら。水を注ぐと、近くの草から蛍が生まれる
      for (let x = Math.max(6, Math.floor(W * 0.03)); x < W - Math.max(6, Math.floor(W * 0.03)); x += 4) {
        for (let y = H - 4; y >= H - Math.max(14, Math.floor(H * 0.10)); y -= 2) set(e, x, y, PLANT);
      }
    },
  },
  {
    id: 'kintsugi', title: '金継ぎ', goal: 3, products: [KINTSUGI], place: [GOLD],
    hint: '石{いし}の 割{わ}れ目{め}に、金{きん} [n] を 注{そそ}いでみよう',
    react: '割{わ}れ目{め}に 金{きん}が 流{なが}れこんで 固{かた}まった！',
    learn: '割{わ}れた 器{うつわ}を 金{きん}で つなぐ、「金継{きんつ}ぎ」という 日本{にほん}の 技{わざ}だよ。割{わ}れ目{め}が 宝物{たからもの}の 模様{もよう}に 変{か}わるんだ。',
    done: '割れ目は、金の景色になった',
    setup(e) {
      const { W, H, cx } = stageFrame(e);
      const mh  = Math.max(14, Math.floor(H * 0.10)); // 石碑の高さ（画面に応じて拡大）
      const mw  = Math.floor(mh * 0.8);               // 石碑の半幅
      const top = H - 5 - mh;                         // 石碑の天面の行
      fillRect(e, 0, H - 3, W - 1, H - 1, SAND);                  // 砂庭
      fillRect(e, cx - mw - 5, H - 5, cx + mw + 5, H - 4, BASALT); // 台座
      fillRect(e, cx - mw, top, cx + mw, H - 6, STONE);            // 石碑
      // 稲妻形の割れ目（幅2）を上から下へ刻む（ランダムウォーク、半幅の半分まで振れる）
      let dx = 0;
      const swing = Math.max(2, Math.floor(mw * 0.5));
      for (let i = 0; i < mh - 1; i++) {
        set(e, cx + dx,     top + i, EMPTY);
        set(e, cx + dx + 1, top + i, EMPTY);
        if (Math.random() < 0.5) {
          dx += Math.random() < 0.5 ? 1 : -1;
          dx = Math.max(-swing, Math.min(swing, dx));
        }
      }
      set(e, cx - 1, top, EMPTY); // 注ぎ口を少し広げる
      set(e, cx + 2, top, EMPTY);
    },
  },
];

// ─── モード制御 ──────────────────────────────────────────────────────────────

export class PracticeMode {
  // hooks: { onBar(text|null), onState(state), onGuide(ids|null), onStuck(drill), onReact(text), onSuccess(), onCelebrate(replay), onFinish() }
  // DOM や音の配線は呼び出し側が持つ。
  constructor(engine, hooks = {}) {
    this.engine   = engine;
    this.hooks    = hooks;
    this.active   = false;
    this.index    = 0;
    this.state    = 'idle'; // 'trying' | 'ready'（成功後、次へを待つ）
    this.baseline = 0;
    this.instructionIndex = 0;
    this.instructionBaselines = [];
    this.reacted = false;
    this.replayFrames = [];
    this.replayWidth = 0;
    this.replayHeight = 0;
    this.recordFrame = 0;
    this.celebrateFrames = null;
    this.celebrated = false;
    this.stuckFrames = 0;
    this.stuckCount = 0;
  }

  start() {
    this.active = true;
    this.index  = 0;
    this._load();
  }

  stop() {
    this.active = false;
    this.state  = 'idle';
    this._discardReplay();
    this.hooks.onBar?.(null);
    this.hooks.onGuide?.(null);
    this.hooks.onState?.('idle');
  }

  skip() {
    if (!this.active) return;
    this._next();
  }

  step() {
    if (!this.active) return;
    this._recordReplay();
    if (this.state === 'ready') {
      this._stepCelebration();
      return; // 反応を眺め、プレイヤーの「次へ」を待つ
    }
    const d = DRILLS[this.index];
    const instruction = d.instructions?.[this.instructionIndex];
    if (instruction) {
      this._stepStuck(d);
      const baseline = this.instructionBaselines[this.instructionIndex];
      if (this._count(instruction.products) - baseline >= instruction.goal) {
        this.instructionIndex++;
        this.hooks.onBar?.(`じっけん ${this.index + 1}/${DRILLS.length} 「${d.title}」 — ${instruction.hint}`);
        this.hooks.onGuide?.(instruction.place ?? null);
      }
      return;
    }
    const productIncrease = this._count(d.products) - this.baseline;
    if (!this.reacted && productIncrease >= 1) {
      this.reacted = true;
      this.hooks.onGuide?.(null); // 反応が始まったらボタンの誘導は役目を終える
      this.hooks.onReact?.(d.react);
    }
    this._stepStuck(d);
    if (productIncrease >= d.goal) {
      this.state = 'ready';
      this.celebrateFrames = 0;
      this.hooks.onGuide?.(null);
      this.hooks.onBar?.(`⭕ できた！ 「${d.title}」 — 🧪の「つぎへ」で 次{つぎ}の じっけんに 進{すす}めるよ`);
      this.hooks.onState?.('ready');
      this.hooks.onSuccess?.();
    }
  }

  _load() {
    const d = DRILLS[this.index];
    this.engine.clear();
    d.setup(this.engine);
    this.baseline = this._count(d.products);
    this.instructionIndex = 0;
    this.instructionBaselines = (d.instructions ?? []).map(instruction => this._count(instruction.products));
    this.reacted = false;
    this.stuckFrames = 0;
    this.stuckCount = 0;
    this._discardReplay();
    this.state    = 'trying';
    this.hooks.onGuide?.(d.place ?? null);
    this.hooks.onState?.('trying');
    this.hooks.onBar?.(`じっけん ${this.index + 1}/${DRILLS.length} 「${d.title}」 — ${d.hint}`);
  }

  _next() {
    this.index++;
    if (this.index >= DRILLS.length) return this._finish();
    this._load();
  }

  _stepStuck(drill) {
    if (this.reacted || ++this.stuckFrames % 900 !== 0 || this.stuckCount >= 3) return;
    this.stuckCount++;
    this.hooks.onStuck?.(drill);
  }

  _recordReplay() {
    const { width, height, colors } = this.engine;
    if (width !== this.replayWidth || height !== this.replayHeight) this._discardReplay();
    this.replayWidth = width;
    this.replayHeight = height;
    if (++this.recordFrame % 3 !== 0) return;
    this.replayFrames.push(new Uint32Array(colors));
    if (this.replayFrames.length > 120) this.replayFrames.shift();
  }

  _discardReplay() {
    this.replayFrames = [];
    this.replayWidth = 0;
    this.replayHeight = 0;
    this.recordFrame = 0;
    this.celebrateFrames = null;
    this.celebrated = false;
  }

  _stepCelebration() {
    if (this.celebrateFrames === null || this.celebrated) return;
    if (++this.celebrateFrames < 90) return;
    this.celebrated = true;
    const replay = {
      frames: this.replayFrames.slice(),
      width: this.replayWidth,
      height: this.replayHeight,
    };
    if (this.index === DRILLS.length - 1) this._finish();
    this.hooks.onCelebrate?.(replay);
  }

  _finish() {
    this.active = false;
    this.state = 'idle';
    this.index = DRILLS.length;
    this.hooks.onGuide?.(null);
    this.hooks.onState?.('idle');
    this.hooks.onBar?.('🎓 ぜんぶ クリア！ じっけんちょう、かんぺき！ こんどは 自由{じゆう}に 遊{あそ}んでみよう');
    this.hooks.onFinish?.();
  }

  _count(products) {
    const cells = this.engine.cells;
    let n = 0;
    for (let i = 0; i < cells.length; i++) {
      if (products.includes(cells[i])) n++;
    }
    return n;
  }
}

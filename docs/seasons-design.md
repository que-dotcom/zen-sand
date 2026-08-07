# 四季システム 設計書

日付: 2026-07-30 / 状態: 設計（未実装）

## 概要

庭全体にゆっくり巡る「季節」の大域状態を1つ導入する。
季節は素材の反応確率を増減させ、季節限定の反応を数個追加する。
狙いは「同じ庭が時間とともに違う表情を見せる」こと。ストーリー（シナリオ増設）と
化学反応拡張の両方の土台になる。

## 中核設計

### 1. 季節の状態は Engine が持つ

```js
// engine.js
this.season = { index: 0, t: 0 };           // index: 0=春 1=夏 2=秋 3=冬
const SEASON_LENGTH = 3600;                  // 1季節 ≈ 60秒(60fps)、1年 = 4分

update() {
  if (++this.season.t >= SEASON_LENGTH) {
    this.season.t = 0;
    this.season.index = (this.season.index + 1) % 4;
  }
  ...既存処理...
}
```

### 2. 素材は「意味キー」で確率を問い合わせる（seasonGate 方式）

季節分岐を各素材ファイルに散らばらせない。倍率表は1ファイルに集約する。

```js
// materials/season.js（新規）
export const SEASON_NAMES = ['春', '夏', '秋', '冬'];
const MODS = {
  //                        春    夏    秋    冬
  'sakura.germinate':     [1.5,  1.0,  0.5,  0.0],
  'sakura.bloom':         [4.0,  0.5,  0.2,  0.0],
  'sakura.petal_emit':    [2.0,  1.0,  0.5,  0.0],
  'firefly.spawn':        [0.5,  4.0,  0.5,  0.0],
  'seed.germinate':       [1.5,  1.0,  0.5,  0.1],
  'plant.grow':           [1.5,  1.2,  0.5,  0.1],
  'pollen.emit':          [2.0,  1.0,  0.3,  0.0],
  'ice.melt':             [1.5,  2.0,  1.0,  0.0],
  'snow.melt':            [1.5,  2.0,  1.0,  0.1],
  'koi.move':             [1.0,  1.2,  1.0,  0.4],
  // 季節限定の新反応（既存確率0からの導入）
  'water.freeze_surface': [0.0,  0.0,  0.0,  1.0],
  'water.evaporate':      [0.0,  1.0,  0.0,  0.0],
};

// engine.js に生やすヘルパ
seasonGate(key, p) {
  const mods = MODS[key];
  const m = mods ? mods[this.season.index] : 1.0;
  return Math.random() < p * m;
}
```

呼び出し側の書き換えは機械的な等価変換にする:

```js
// 変更前（sakura.js:46）
if (Math.random() > 0.05) return; // 5%/frame で発芽
// 変更後
if (!engine.seasonGate('sakura.germinate', 0.05)) return;
```

`>` と `<` の向きの取り違いが一番の事故源なので、**「イベントが起きる確率 p を
正の数で渡す」形に統一**する（既存コードは `Math.random() > 0.985` のような
「起きない側」の書き方が混在している。例: p = 1 − 0.985 = 0.015）。

## 既存素材への影響範囲（洗い出し）

| ファイル | 関数 | 現在の確率・条件 | 季節キー |
|---|---|---|---|
| sakura.js | updateSakuraSeed | 発芽 5%/frame（水/土が半径4内） | sakura.germinate |
| sakura.js | updateSakuraTree | Phase1→2 開花遷移、Phase2 花びら放出 | sakura.bloom / sakura.petal_emit |
| sakura.js | updateFirefly | 蛍の自然発生（植物+水） | firefly.spawn |
| life.js | updateSeed | 発芽条件成立時の確率 | seed.germinate |
| life.js | updatePlant / updateDarkPlant | 成長ステップ確率 | plant.grow |
| pollen.js | updateFlower / updateDarkFlower | _emitPollen 呼び出し確率 | pollen.emit |
| fluids.js | updateIce | 熱源近傍の融解（p≈0.2 など複数） | ice.melt |
| basic.js | updateSnow | 水接触・熱での融解 | snow.melt |
| agents.js | updateKoi | 移動頻度 | koi.move |
| basic.js | updateWater | （新規）表面凍結・蒸発 | water.freeze_surface / water.evaporate |

**季節の影響を受けないもの（明示）**: 岩石系（geology.js 全部）、電気系
（electricity.js）、間（MA_VOID）、壁・石・ガラス。岩は季節を超える存在、
というのが世界観上の意味付け。

## 季節限定の新反応（フェーズ2で追加）

1. **冬・表面凍結**: 上が EMPTY の WATER セルが低確率（p=0.002）で ICE になる。
   池が縁からゆっくり凍る。既存の「凍った呪いの森」シナリオの氷ギミックと整合。
2. **夏・蒸発**: 上が EMPTY の WATER セルが低確率（p=0.0005）で STEAM になる。
   夏の池は少しずつ痩せる → 水源（SPRING）の価値が出る。
3. **秋・紅葉（色のみ）**: PLANT の色を橙〜紅系パレットへ低確率で書き換える。
   熊手と同じ「物理不変・色だけ」方式なので安全。冬は枯れ色、春に緑へ戻す。

## UI

- 画面隅に現在の季節の漢字（春/夏/秋/冬）を薄く表示（DOM要素、和風フェード）。
- クリックで手動で次の季節へ送れる（デバッグ兼「季節を選んで遊ぶ」導線）。
- シナリオは `scenario.season: 'winter'` のように季節を固定できる
  （凍った呪いの森=冬固定、など。既存バランスを壊さないための逃げ道）。

## 実装順序（3段階、各段階で検証可能）

1. **PR1: 季節時計 + seasonGate 導入（全倍率 1.0）** — 挙動完全不変。
   materials.js 分割で使った「前後ダンプ diff」の手法で等価性を検証できる。
   ※ seasonGate は Math.random 呼び出し回数を変えないよう p をそのまま使う。
2. **PR2: 倍率表を有効化** — 素材ごとに目視プレイテスト。UI表示もここで入れる。
3. **PR3: 季節限定反応（凍結・蒸発・紅葉）** — 1つずつ追加して確認。

## リスク

- **確率の向きの取り違え**: `>` 混在の等価変換ミス。→ p 正数統一 + PR1 の diff 検証で潰す。
- **シナリオバランス**: 既存2シナリオは通年一定の確率を前提。→ season 固定機能で回避。
- **性能**: seasonGate は表引き1回なので無視できる。
- **保存なし前提**: 季節はセッション内でのみ巡る。リロードで春に戻る（それも無常）。

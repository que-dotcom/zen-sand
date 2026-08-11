# 開発計画

## 第8弾: 実験帳の学習モード化（2026-08-12 ユーザ依頼）

### 背景

体験者は PC 操作に不慣れな小中学生。実験帳をチュートリアルから
「学習教材」へ寄せる。ユーザ要望4点:

1. 舞台が画面下部の UI バーと重なって見えない → キャンバスをバーの上までにする
2. ブラシの初期サイズを大きく（1〜8 の 3 → 5）
3. 化学反応が起きるたびに、ひらがなの分かりやすい口調で何が起きたか話す
4. 成功時に、反応の様子を**ループ再生する全画面ポップアップ**で見せ、
   ひらがなで解説し、「つぎへ」で次のフィールドに進む

### 方式

- 録画は practice.js（DOM 非依存）が engine.colors のリングバッファで持ち、
  ポップアップの描画・DOM は main.js 側。文言（react/learn/hint の子ども向け16題分）は
  指示書 spec.md に確定済み
- 実装は codex-delegate に委任、検収（テスト・CDP実機・文言）は Claude

### Tasks

- task-601: spec.md 作成（文言込み）→ Codex 委任 — risk: safe
- task-602: 検収: practice ×2 / scenario 回帰 / node --check / CDP スモーク（ポップアップ実動作）— risk: safe
- task-603: コミット + push + ClubProject 同期 — risk: safe（毎度コミット運用）

---

## PR1: 下部バーの再編（2026-08-11 着手）

仕様: `docs/keyboard-mode-design.md` の §1（グループ再編）・§2（3行レイアウト）・§7-1。
範囲は **マウス操作のみ・素材の挙動不変・見た目とDOM構造だけ**。キーボード操作は PR2 以降。

### 設計書に無く、このPRで決めた点

- **「表示中グループ（タブ）」と「選択中の素材/道具」を別の状態として持つ。**
  熊手（道具）を選んだまま「基本」タブを見ると素材行に active が無い状態になるため。
  素材を選ぶと表示グループも自動でそちらへ移る。タブを押した時は表示だけ変え、選択は据え置く。
- 既存の1素材1キー割り当ては全て残す（設計書 §7-1 の指示どおり）。
  キーで素材を選んだ時も、そのグループのタブを自動で開く。
- ブラシは ⊖ / ⊕ の2ボタンに置換。範囲・初期値はスライダーと同じ 1〜8・初期3 を維持。
- 操作行の `tabindex="-1"`（設計書 §5）は PR3 に回す。決定キーの誤発火対策であり、
  PR1 の「見た目だけ」の範囲を超えて Tab キーの挙動を変えてしまうため。

### Tasks

#### task-101: PALETTE のグループ再編
- intent: `main.js` の `PALETTE` を 基本/火/生命/気液/岩石/電気/侘寂/道具 の8グループに並べ替える。
  `group` 文字列と配列の並び順のみ変更し、id・label・color・key は1文字も変えない
- verification: Node で新旧 PALETTE をダンプし、(id,label,color,key) の集合が完全一致・32件。
  グループ別件数が 4/4/5/4/5/2/6/2
- rollback: `git checkout -- src/main.js`
- risk: safe

#### task-102: index.html を3行構造へ
- intent: `#toolbar` を `#palette`（`#group-tabs` + `#mat-row`）に置換。
  ブラシスライダーを ⊖ / 数値 / ⊕ に置換
- verification: DOM に `#group-tabs` `#mat-row` `#brush-dec` `#brush-val` `#brush-inc` が存在
- rollback: `git checkout -- index.html`
- risk: safe

#### task-103: main.js の UI 構築ロジック改修
- intent: グループタブ生成、`renderMatRow()`、`selectMaterial` の改修（表示グループ追従）、
  ブラシ ⊖⊕ の配線。`selectMaterial` の副作用（input.tool / input.material）は不変
- verification: ブラウザで全8タブを押して素材行が入れ替わる。素材選択で active が移る
- rollback: `git checkout -- src/main.js`
- risk: safe

#### task-104: style.css の行構造化
- intent: `#toolbar` の横スクロール指定を撤去。3行の縦積みレイアウト、タブの下線、
  ドット 8px→12px、モバイル調整
- verification: 1920px と 680px の両方でバーが横スクロールせず全8タブが見える
- rollback: `git checkout -- style.css`
- risk: safe

#### task-105: ブラウザ実機検証
- intent: ローカルサーバで開き、スクリーンショットで3行構造を目視。
  コンソールエラー0件。砂の配置・落下が従来どおり動く
- verification: ページ由来のコンソールエラー0件、スクリーンショットで8タブと素材行を確認
- rollback: 前タスクの rollback に同じ
- risk: safe

#### task-106: コミット
- intent: PR1 をコミットする
- verification: git log に新コミット
- risk: requires-approval

---

## 第6弾: 実験帳の手順明確化・手動遷移・新題追加（2026-08-11 ユーザフィードバック）

### 仕様要約

- 墨田の夜は、水 [2] を炭田へ注いで墨泥を作ってから、種 [w] を墨泥の上へ蒔く2段階を
  画面上で明示する。
- 成功後は反応を止めず、自動遷移もしない。🧪ボタンを「次へ」に切り替え、プレイヤーが
  押した時だけ次の舞台を読み込む。
- 新題候補「砂の炉」: 砂丘へ溶岩 [6] を流し、砂岩を作る。成立性を8試行以上で確認する。

### Tasks

- task-501: 墨田の夜の段階別ヒントと成功後の手動遷移を実装・状態遷移をテスト — risk: safe
- task-502: 砂の炉の単体プローブ、舞台、正答ボットを追加 — risk: safe
- task-503: 全題を2回連続、既存シナリオ回帰、舞台PNGで検証 — risk: safe
- task-504: ブラウザスモーク — risk: safe
- task-505: コミット — risk: requires-approval

---

## 第5弾: 実験帳の反応題増設（2026-08-11 ユーザ依頼: 著しい変化を追加）

### 仕様要約

- 既存の10題と異なる、視覚的な変化が大きい反応を追加する。候補の選定・舞台設計・成功判定は
  `docs/practice-drill-guide.md` に従い、素材コードを変えずに実施する。
- 候補: 油田爆発（油+雷→炎）／夜光洞（菌+油→発光菌）／墨田の夜（炭+水+種→暗黒植物）。
- すべて機械プレイで複数回完走と既存シナリオ回帰を確認してから採用する。

### Tasks

- task-401: 3候補の単体プローブで成立率・生成物数・初期舞台の安定性を測定 — risk: safe
- task-402: 合格した候補を `DRILLS` に画面全体の情景として追加 — risk: safe
- task-403: 機械プレイの正答ボット・検証条件を更新 — risk: safe
- task-404: 実験帳を2回連続、シナリオ回帰を実行し、舞台PNGを確認 — risk: safe
- task-405: ブラウザスモーク — risk: safe
- task-406: コミット — risk: requires-approval

---

## 第4弾: 実験帳モード（2026-08-11 ユーザ依頼: 化学反応の練習モード）

### 仕様要約

- シナリオとは別の練習モード「実験帳」🧪。お題の化学反応を順に出し、
  小さな舞台を自動設置 → プレイヤーが素材を注いで反応を起こす → 生成物のセル数が
  閾値を超えたら ⭕成功（おりんの音）→ 約2秒後に次のお題。全10題で皆伝。
- 検出方式: **生成物セル数のベースラインからの増分**。素材コードは一切変更しない
  （盤面を数えるだけの汎用方式。全反応に適用できる）
- 10題: 蒸気 / 燃焼 / 石化 / ガラス / 黒曜石 / 玄武岩 / 発芽 / 墨 / 感電 / 金継ぎ
- 操作: 🧪で開始、実験中に🧪でスキップ、クリアで退出。ヒントはシナリオバーを共用

### Tasks

- task-301: plan.md 追記（このエントリ）— risk: safe
- task-302: src/practice.js 新規（PracticeMode クラス + DRILLS 10題 + 舞台設置。DOM非依存）— risk: safe
- task-303: main.js 配線（practice-btn、ループに step()、シナリオ/クリアとの排他）+ index.html に🧪ボタン — risk: safe
- task-304: docs/keyboard-mode-design.md の操作行に🧪を追記（3箇所）— risk: safe
- task-305: Node 検証 — 全10題を機械プレイして完走できること（各題の達成可能性の実証）— risk: safe
- task-306: ブラウザスモーク（ボタン動作・バー表示・エラー0件）— risk: safe
- task-308: README を実験帳・現在の操作・33素材の状態へ更新し、検証導線を作成要領へ集約 — risk: safe
- task-307: コミット — risk: requires-approval

---

## 第3弾: シナリオ2本増設（2026-08-11 ユーザ選択済み: ①金継ぎ + ⑤桜と蛍）

### 仕様要約

- **金継ぎ 🏺（★★・五幕）**: 割れた石の器に溶けた金を注いで継ぐ「直す物語」。
  新素材2つ: 金（GOLD=45、最重量級の粘性液体）と 金継ぎ（KINTSUGI=46、非パレット・反応生成のみ）。
  化学: 金は鉱物固体2面以上に挟まれると凝固（割れ目でだけ固まる）／氷・雪で急冷凝固／
  溶岩で金継ぎ→金に再溶解／酸は金に無反応（updateAcid のリスト外なので自動的に不活性 = 金の骨格が残る）／
  金継ぎは伝導体（CONDUCTOR_IDS[7]、3bitマスク最後の枠）で雷の振動波が継ぎ目を走る。
- **桜と蛍 🌸（★・四幕）**: 既存素材のみ。宵の庭に桜種を蒔き、開花を待ち、蛍を眺める。
- 新イベント: kintsugi_formed（金凝固時）/ sakura_bloomed（Phase1→2境界）/ firefly_born（蛍自然発生時）
- パレット: 金を「電気」グループ・キー n に追加（侘寂は6個満杯のため。金属つながり）

### Tasks

- task-201: plan.md にこの計画を追記 — risk: safe（このエントリ）
- task-202: ids.js（GOLD=45, KINTSUGI=46）+ meta.js（GOLD_COLS/KINTSUGI_COLS、CONDUCTOR_IDS に KINTSUGI 追加）
  - verification: node --check 通過、CONDUCTOR_IDS.length === 8（3bit 上限内）— risk: safe
- task-203: src/materials/kintsugi.js 新規（updateGold / updateKintsugi、kintsugi_formed 発火）— risk: safe
- task-204: electricity.js の _vibRestore に金継ぎ通過キラめき（SPARK、破壊なし）— risk: safe
- task-205: registry.js + materials.js ファサード + main.js PALETTE 配線 — risk: safe
- task-206: sakura.js 開花境界に sakura_bloomed、life.js 蛍発生に firefly_born — risk: safe
- task-207: scenarios.js — TRIGGERS/MATERIAL_TRIGGER_MAP 追加、loadKintsugi / loadSakuraFirefly レイアウト、SCENARIOS 2件
  - verification: Node でロード→PNG 目視 — risk: safe
- task-208: docs/keyboard-mode-design.md の電気グループ表更新（金属・雷・金 = 3個）— risk: safe
- task-209: Node 検証スイート — 金の流動/凝固/イベント、酸耐性（骨格残存）、溶岩再溶解、振動波の通過と復元、
  桜シナリオ長回しで sakura_bloomed / firefly_born 発火確認 — risk: safe
- task-210: 両シナリオの盤面 PNG 目視 — risk: safe
- task-211: コミット — risk: requires-approval

---

## 第2弾: 4段階の開発（2026-07-30 ユーザ承認済み）

1. 熊手（砂紋ツール）実装 — input.js にツールモード追加、main.js にパレット登録。
   物理不変・色の書き換えのみ。検証: ブラウザで砂紋の描画と水没時の崩れを目視。
2. 四季システムの設計書作成 — 既存素材への影響範囲の洗い出し（実装はしない）
3. 「散」（風の掃き消し儀式）+ 水琴窟（Web Audio 生成音）実装 — audio-verification-loop で検証
4. 未使用レンズ（規模を極端に振る・時間をずらす）でブレストもう一巡

---

# materials.js 分割リファクタリング計画（完了済み）

## 仕様要約

- 対象: `src/materials.js`（2,241行）。素材ID定数・meta定数・カラーパレット・約40個の update 関数・MATERIALS レジストリが1ファイルに同居している。
- 目的: 挙動を一切変えずに、カテゴリ別モジュールへ分割する（純粋リファクタリング）。
- 制約:
  - `engine.js` / `main.js` / `renderer.js` / `scenarios.js` は `./materials.js` から import している。この4ファイルは変更しない。
  - そのため `src/materials.js` は「再エクスポートだけの薄い窓口（ファサード）」として残す。
  - コードは行単位でそのまま移動する（書き直さない）。変えるのは import / export 行のみ。

## 分割後の構成

```
src/materials.js              … 窓口。materials/ 以下を再エクスポートするだけ
src/materials/ids.js          … 素材ID定数（内部専用の KOI_BODY / VIBRATION 含む）
src/materials/meta.js         … meta ビット定義・カラーパレット・方向テーブル
src/materials/basic.js        … 砂・水・雪・火・油・溶岩・煙・灰・炭
src/materials/life.js         … 土・種・植物・暗黒植物・開花・菌類・発光菌・錆
src/materials/fluids.js       … 蒸気・酸・泥・氷
src/materials/geology.js      … 酸性植物・水源・溶岩源泉・黒曜石・砂岩・玄武岩
src/materials/electricity.js  … 金属・稲妻・電撃・振動波
src/materials/sakura.js       … 桜種・桜の木・花びら・蛍
src/materials/pollen.js       … 花粉・花・暗黒花（_emitPollen は桜の木からも使うため export）
src/materials/agents.js       … 鯉・鯉ボディ・間
src/materials/registry.js     … MATERIALS レジストリ本体
```

- 元ファイルの行範囲: ids=1-48+120-123 / meta=50-118+125-162 / basic=164-400 / life=401-849 /
  fluids=850-1041 / geology=1042-1177 / electricity=1178-1548 / sakura=1549-1867 /
  pollen=1868-2007 / agents=2008-2192 / registry=2193-2241

## Tasks

### task-001: ベースライン取得
- intent: リファクタ前の MATERIALS レジストリ（名前・色・update関数のソース文字列）を JSON に書き出す
- verification: scratchpad に baseline.json が生成され、44素材分のエントリを含む
- rollback: なし（読み取りのみ）
- risk: safe

### task-002: 行範囲抽出による分割ファイル生成
- intent: sed で行範囲を抽出して materials/ 以下の各ファイルを生成し、各ファイル先頭に import 文を付与、関数・定数に export を付与
- verification: `node --check` 相当（動的 import が成功する）
- rollback: `git clean` で新規ファイル削除（元ファイル未変更のため安全）
- risk: safe

### task-003: materials.js をファサード化
- intent: materials.js を再エクスポートのみの薄いファイルに置き換える
- verification: 動的 import が成功し、既存4ファイルの import が全て解決する
- rollback: `git checkout -- src/materials.js`
- risk: safe

### task-004: 同一性検証
- intent: リファクタ後のレジストリダンプを task-001 のベースラインと diff し、完全一致を確認
- verification: diff が空（update 関数のソース文字列まで一致）
- rollback: task-002/003 の rollback に同じ
- risk: safe

### task-005: ブラウザ実動作スモークテスト
- intent: ローカルサーバで index.html を開き、コンソールエラーが無く、シミュレーションが動くことを確認
- verification: ページロード後にコンソールエラー 0 件
- rollback: 同上
- risk: safe

### task-006: コミット
- intent: 変更をコミットする
- verification: git log に新コミット、working tree クリーン
- rollback: git reset
- risk: requires-approval（コミットはユーザ確認後）

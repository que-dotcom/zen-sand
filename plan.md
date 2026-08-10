# 開発計画

## 第3弾 PR1: 下部バーの再編（2026-08-11 着手）

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

import { Engine }       from './engine.js';
import { Renderer, heatRGB, stopsRGB, WET_STOPS, ACID_STOPS } from './renderer.js';
import { wetResistance } from './moisture.js';
import { InputHandler } from './input.js';
import { EMPTY, SAND, WATER, WALL, SNOW, FIRE, OIL, LAVA, COAL,
         SOIL, SEED, FUNGUS, METAL, LIGHTNING,
         STEAM, ACID, MUD, ICE, HARD_SOIL,
         ACID_PLANT, OBSIDIAN, SANDSTONE, BASALT, SPRING, LAVA_SPRING,
         SAKURA_SEED, SAKURA_PETAL, FIREFLY, POLLEN, MA_VOID, KOI, GOLD, MATERIALS } from './materials.js';
import { SCENARIOS, MATERIAL_TRIGGER_MAP } from './scenarios.js';
import { ZenAudio }     from './audio.js';
import { ChiriRitual }  from './ritual.js';
import { DRILLS, PracticeMode } from './practice.js';
import { SpeedGovernor } from './speed.js';
import { T_FREEZE, T_DEW, T_BOIL, T_LAVA_SOLID, T_STONE_MELT,
         T_AMBIENT_GROUND, T_AMBIENT_TOP, T_AMBIENT_GROUND_MIN, T_AMBIENT_GROUND_MAX } from './materials/climate.js';

function rubyHTML(s) {
  return s.replace(/([一-龠々〆〤ヶ]+)\{([^}]+)\}/g, '<ruby>$1<rt>$2</rt></ruby>');
}

const CELL_SIZE = 3; // 1 セルの画面上の大きさ（px）。小さいほど盤面の升目が増えて細かくなるが、処理は重くなる

// 素材ではない「道具」のパレットID（負数 = engine.set に渡らない）
const RAKE_TOOL = -1;

// ─── Material palette ────────────────────────────────────────────────────────
// グループは「タブ1枚 = 1グループ、素材行は最大6個」に収まるよう構成している。
// どのタブを選んでも素材行が横スクロールしないのが再編の狙い（docs/keyboard-mode-design.md §1）。
const PALETTE = [
  // 基本 — 最初に触る4つ
  { id: SAND,   label: '砂',   color: '#C2A35A', key: '1', group: '基本' },
  { id: WATER,  label: '水',   color: '#3A7BD5', key: '2', group: '基本' },
  { id: SNOW,   label: '雪',   color: '#EEEEFF', key: '3', group: '基本' },
  { id: WALL,   label: '壁',   color: '#888888', key: '8', group: '基本' },
  // 火 — 燃える／燃やすもの
  { id: FIRE,   label: '火',   color: '#FF6600', key: '4', group: '火' },
  { id: OIL,    label: '油',   color: '#8B6914', key: '5', group: '火' },
  { id: LAVA,   label: '溶岩', color: '#FF4500', key: '6', group: '火' },
  { id: COAL,   label: '炭',   color: '#333333', key: '7', group: '火' },
  // 生命 — 育つもの・育てる土
  { id: SOIL,       label: '土(落)', color: '#5C3D1E', key: 'q', group: '生命' },
  { id: HARD_SOIL,  label: '土(固)', color: '#C47A45', key: 'a', group: '生命' },
  { id: SEED,       label: '種',     color: '#A8C060', key: 'w', group: '生命' },
  { id: FUNGUS,     label: '菌',     color: '#4A2060', key: 'e', group: '生命' },
  { id: ACID_PLANT, label: '酸植物', color: '#5A9900', key: 'p', group: '生命' },
  // 気液 — 流れるもの
  { id: STEAM,  label: '蒸気', color: '#DDEEFF', key: 'y', group: '気液' },
  { id: ACID,   label: '酸',   color: '#66FF33', key: 'u', group: '気液' },
  { id: MUD,    label: '泥',   color: '#6B4226', key: 'i', group: '気液' },
  { id: ICE,    label: '氷',   color: '#AADDFF', key: 'o', group: '気液' },
  // 岩石 — 動かない地形と湧き出し口
  { id: OBSIDIAN,    label: '黒曜石', color: '#1A1A2E', key: 's', group: '岩石' },
  { id: SANDSTONE,   label: '砂岩',   color: '#C4A35A', key: 'd', group: '岩石' },
  { id: BASALT,      label: '玄武岩', color: '#2A1A1A', key: 'f', group: '岩石' },
  { id: SPRING,      label: '水源',   color: '#1A88DD', key: 'g', group: '岩石' },
  { id: LAVA_SPRING, label: '溶岩源', color: '#FF3300', key: 'h', group: '岩石' },
  // 電気
  { id: METAL,     label: '金属', color: '#B0B8C8', key: 'r', group: '電気' },
  { id: LIGHTNING, label: '雷',   color: '#EEEEFF', key: 't', group: '電気' },
  { id: GOLD,      label: '金',   color: '#FFC63A', key: 'n', group: '電気' },
  // 侘寂
  { id: SAKURA_SEED,  label: '桜種',  color: '#C0784E', key: 'j', group: '侘寂' },
  { id: SAKURA_PETAL, label: '花びら', color: '#FFB7C5', key: 'k', group: '侘寂' },
  { id: FIREFLY,      label: '蛍',    color: '#FFFF44', key: 'l', group: '侘寂' },
  { id: POLLEN,       label: '花粉',  color: '#FFEE44', key: 'z', group: '侘寂' },
  { id: MA_VOID,      label: '間',    color: '#08080C', key: 'x', group: '侘寂' },
  { id: KOI,          label: '鯉',    color: '#E04020', key: 'c', group: '侘寂' },
  // 道具 — 素材を置かずに庭をいじるもの
  { id: RAKE_TOOL, label: '熊手', color: '#C8A860', key: 'v', group: '道具' },
  { id: EMPTY,     label: '消',   color: '#555555', key: '0', group: '道具' },
];

// タブの並び順。PALETTE の出現順から重複を除いて作るので、両者がずれることはない。
const GROUPS = [...new Set(PALETTE.map(m => m.group))];

// ─── Rain spawner ────────────────────────────────────────────────────────────
class Spawner {
  constructor(engine, input) {
    this.engine  = engine;
    this.input   = input;
    this.enabled = false;
    this.tick    = 0;
    this.rate    = 4;
  }

  update() {
    if (!this.enabled) return;
    this.tick++;
    if (this.tick < this.rate) return;
    this.tick = 0;

    const mat = this.input.material;
    if (mat === EMPTY || mat === WALL || this.input.tool !== 'brush') return;

    const { width } = this.engine;
    const spread  = Math.floor(width * 0.6);
    const centerX = Math.floor(width / 2);
    const count   = Math.max(1, Math.floor(this.input.brushRadius * 0.8));

    for (let i = 0; i < count; i++) {
      const x = centerX + Math.floor((Math.random() - 0.5) * spread);
      if (this.engine.get(x, 0) === EMPTY) {
        this.engine.set(x, 0, mat);
      }
    }
  }
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────
function init() {
  const canvas = document.getElementById('canvas');

  function resize() {
    const uiH = document.getElementById('ui').offsetHeight;
    const w = Math.floor(window.innerWidth  / CELL_SIZE);
    const h = Math.floor((window.innerHeight - uiH) / CELL_SIZE);
    canvas.width  = w * CELL_SIZE;
    canvas.height = h * CELL_SIZE;
    return { w, h };
  }

  let { w, h } = resize();
  const engine   = new Engine(w, h);
  const renderer = new Renderer(canvas, engine, CELL_SIZE);
  const input    = new InputHandler(canvas, engine, CELL_SIZE);
  const spawner  = new Spawner(engine, input);
  const audio    = new ZenAudio();
  const ritual   = new ChiriRitual(engine);

  // ── 音のトリガ（水琴窟）──────────────────────────────────────────────────
  // AudioContext はユーザ操作後にしか作れないため、pointerdown で ensure する
  canvas.addEventListener('pointerdown', () => {
    audio.ensure();
    if (input.tool === 'rake')            audio.scrape();
    else if (input.material === WATER)    audio.drip();
  });
  canvas.addEventListener('pointermove', () => {
    if (input.isDrawing && input.tool === 'rake') audio.scrape();
  });

  window.addEventListener('resize', () => {
    const { w: nw, h: nh } = resize();
    engine.width  = nw;
    engine.height = nh;
    engine.cells   = new Uint8Array(nw * nh);
    engine.colors  = new Uint32Array(nw * nh);
    engine.updated = new Uint8Array(nw * nh);
    engine.meta    = new Uint8Array(nw * nh);
    engine.wet     = new Float32Array(nw * nh);
    engine.acid    = new Float32Array(nw * nh);
    renderer.resize();
    if (activeScenario) loadScenario(activeScenario);
  });

  // ── Hint toast ────────────────────────────────────────────────────────────
  const hint = document.getElementById('hint');
  let hintTimer = null;
  function showHint(msg, duration = 1800, kids = false) {
    hint.innerHTML = rubyHTML(msg);
    hint.classList.toggle('kids', kids);
    hint.classList.add('show');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      hint.classList.remove('show', 'kids');
    }, duration);
  }

  // ── Scenario system ───────────────────────────────────────────────────────
  let activeScenario = null;
  let currentAct     = 0;

  const scenarioBar   = document.getElementById('scenario-bar');

  function updateScenarioBar() {
    if (!activeScenario) {
      scenarioBar.classList.remove('show');
      return;
    }
    const acts = activeScenario.acts;
    const actHint = currentAct < acts.length
      ? acts[currentAct].hint
      : acts[acts.length - 1].hint;
    scenarioBar.innerHTML = rubyHTML(actHint);
    scenarioBar.classList.add('show');
  }

  function loadScenario(scenario) {
    practice.stop(); // 実験帳とシナリオは排他
    activeScenario = scenario;
    currentAct     = 0;
    input.resetUsage();
    scenario.load(engine);
    updateScenarioBar();
    scenarioModal.close();
    showHint(`シナリオ: ${scenario.title}`);
  }

  function checkActProgress() {
    if (!activeScenario) return;
    const acts = activeScenario.acts;
    if (currentAct >= acts.length - 1) return;

    const nextAct = acts[currentAct + 1];
    if (!nextAct.trigger) return;

    // 素材使用ベースのトリガー
    const usedTrigger = [...input.usedMaterials].some(
      id => MATERIAL_TRIGGER_MAP[id] === nextAct.trigger
    );

    // エンジンイベントベースのトリガー（plant_spawned など）
    const eventTrigger = engine.firedEvents.has(nextAct.trigger);

    if (usedTrigger || eventTrigger) {
      currentAct++;
      input.resetUsage();
      updateScenarioBar();
    }
  }

  // ── 実験帳（化学反応の練習モード）────────────────────────────────────────
  const practice = new PracticeMode(engine, {
    onBar: text => {
      if (text === null) {
        if (!activeScenario) scenarioBar.classList.remove('show');
        return;
      }
      scenarioBar.innerHTML = rubyHTML(text);
      scenarioBar.classList.add('show');
    },
    onState: state => {
      if (state === 'ready') {
        practiceBtn.textContent = '次へ ➜';
        practiceBtn.title = '次の実験へ進む';
        practiceBtn.classList.add('practice-next');
      } else if (state === 'trying') {
        practiceBtn.textContent = '⏭';
        practiceBtn.title = '実験帳 — このお題をスキップ';
        practiceBtn.classList.remove('practice-next');
      } else {
        practiceBtn.textContent = '🧪';
        practiceBtn.title = '実験帳 — 化学反応の練習';
        practiceBtn.classList.remove('practice-next');
      }
    },
    onSuccess: () => audio.bell(),
    onGuide: ids => {
      suggestedIds = new Set(ids ?? []);
      if (suggestedIds.size) {
        const suggested = PALETTE.find(mat => suggestedIds.has(mat.id));
        if (suggested) showGroup(suggested.group);
      } else {
        renderMatRow();
      }
    },
    onStuck: drill => {
      const suggested = PALETTE.find(mat => drill.place?.includes(mat.id));
      const label = suggested?.label ?? drill.title;
      showHint(`下{した}の 光{ひか}っている「${label}」の ボタンを 押{お}してから、画面{がめん}の 上{うえ}を なぞってみてね`, 4200, true);
    },
    onReact: text => showHint(text, 3500, true),
    onCelebrate: replay => openPracticePopup(replay),
    onFinish:  () => setTimeout(() => {
      if (!practice.active && !activeScenario) scenarioBar.classList.remove('show');
    }, 4000),
  });

  // ── 実験帳の成功ポップアップ ─────────────────────────────────────────────
  const practicePopup = document.getElementById('practice-popup');
  const practicePopupTitle = document.getElementById('practice-popup-title');
  const practicePopupLearn = document.getElementById('practice-popup-learn');
  const practiceReplay = document.getElementById('practice-replay');
  const practiceReplayCtx = practiceReplay.getContext('2d');
  const practicePopupNext = document.getElementById('practice-popup-next');
  const practicePopupClose = document.getElementById('practice-popup-close');
  let replayTimer = null;
  let popupIsFinal = false;

  function closePracticePopup() {
    clearInterval(replayTimer);
    replayTimer = null;
    practicePopup.classList.remove('show');
    practicePopup.setAttribute('aria-hidden', 'true');
  }

  function openPracticePopup(replay) {
    popupIsFinal = !practice.active;
    const drill = DRILLS[popupIsFinal ? DRILLS.length - 1 : practice.index];
    practicePopupTitle.innerHTML = rubyHTML(popupIsFinal
      ? '🎓 ぜんぶ クリア！'
      : `⭕ せいこう！「${drill.title}」`);
    practicePopupLearn.innerHTML = rubyHTML(popupIsFinal
      ? `${DRILLS.length}この じっけん、ぜんぶ 成功{せいこう}！ きみは もう りっぱな 博士{はかせ}だよ。こんどは 好{す}きな 材料{ざいりょう}で、自分{じぶん}だけの 庭{にわ}を 作{つく}ってみよう。`
      : drill.learn);
    practicePopupNext.textContent = popupIsFinal ? 'じゆうに あそぶ' : 'つぎへ ➜';
    practicePopupClose.hidden = popupIsFinal;

    clearInterval(replayTimer);
    practiceReplay.width = replay.width;
    practiceReplay.height = replay.height;
    const image = practiceReplayCtx.createImageData(replay.width, replay.height);
    const pixels = new Uint32Array(image.data.buffer);
    const background = (0xFF << 24) | (0x0A << 16) | (0x0A << 8) | 0x0A;
    const toPixel = hex => {
      const r = (hex >> 16) & 0xFF;
      const g = (hex >> 8) & 0xFF;
      const b = hex & 0xFF;
      return (0xFF << 24) | (b << 16) | (g << 8) | r;
    };
    let frame = 0;
    const renderReplay = () => {
      const colors = replay.frames[frame];
      for (let i = 0; i < colors.length; i++) {
        pixels[i] = colors[i] === 0 ? background : toPixel(colors[i]);
      }
      practiceReplayCtx.putImageData(image, 0, 0);
      frame = (frame + 1) % replay.frames.length;
    };
    renderReplay();
    replayTimer = setInterval(renderReplay, 50);
    practicePopup.classList.add('show');
    practicePopup.setAttribute('aria-hidden', 'false');
  }

  practicePopupNext.addEventListener('click', () => {
    closePracticePopup();
    if (!popupIsFinal) practice.skip();
  });
  practicePopupClose.addEventListener('click', closePracticePopup);
  practicePopup.addEventListener('click', e => {
    if (e.target === practicePopup) closePracticePopup();
  });

  // ── モーダル共通 ─────────────────────────────────────────────────────────
  // 開く: .show と aria-hidden を切り替え、ダイアログ本体にフォーカスを移す（Esc・Tab が効くように）。
  // 閉じる: ✕（data-modal-close）・背景クリック・Esc。閉じたら開く前のフォーカスに戻す。
  // 開いている間は素材のホットキーを無効にし、Tab はモーダル内で循環させる。
  const openModals = [];
  function createModal(el, { onOpen } = {}) {
    const box = el.querySelector('.modal-box');
    let returnFocus = null;
    const modal = {
      get isOpen() { return el.classList.contains('show'); },
      open() {
        if (modal.isOpen) return;
        returnFocus = document.activeElement;
        onOpen?.();
        el.classList.add('show');
        el.setAttribute('aria-hidden', 'false');
        openModals.push(modal);
        box.focus();
      },
      close() {
        if (!modal.isOpen) return;
        el.classList.remove('show');
        el.setAttribute('aria-hidden', 'true');
        openModals.splice(openModals.indexOf(modal), 1);
        if (returnFocus?.isConnected) returnFocus.focus();
        returnFocus = null;
      },
      trapTab(e) {
        const items = [...box.querySelectorAll('button, input, [href], [tabindex]:not([tabindex="-1"])')];
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === box)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      },
    };
    el.addEventListener('click', e => { if (e.target === el) modal.close(); });
    el.querySelectorAll('[data-modal-close]').forEach(b => b.addEventListener('click', modal.close));
    return modal;
  }

  // ── Scenario modal ────────────────────────────────────────────────────────
  const scenarioModal = createModal(document.getElementById('scenario-modal'));

  // Build scenario cards
  const scenarioList = document.getElementById('scenario-list');
  SCENARIOS.forEach(scenario => {
    const card = document.createElement('div');
    card.className = 'scenario-card';
    card.innerHTML = `
      <div class="scenario-card-left">
        <span class="scenario-emoji">${scenario.emoji}</span>
        <div>
          <div class="scenario-title">${scenario.title}</div>
          <div class="scenario-subtitle">${scenario.subtitle}</div>
          <div class="scenario-difficulty">${scenario.difficulty}</div>
        </div>
      </div>
      <button class="scenario-play-btn">プレイ</button>
    `;
    card.querySelector('.scenario-play-btn').addEventListener('click', () => {
      loadScenario(scenario);
    });
    scenarioList.appendChild(card);
  });

  document.getElementById('scenario-btn').addEventListener('click', scenarioModal.open);

  // ── UI: group tabs + material row ─────────────────────────────────────────
  // 「表示中グループ」と「選択中の素材/道具」は別の状態として持つ。
  // 熊手（道具グループ）を選んだまま別グループのタブを眺める状態があり得るため、
  // タブは表示を切り替えるだけで、実際に描くものは選択操作でしか変わらない。
  const groupTabs = document.getElementById('group-tabs');
  const matRow    = document.getElementById('mat-row');

  let activeGroup = GROUPS[0];
  let selectedId  = null;
  let suggestedIds = new Set();

  GROUPS.forEach(group => {
    const tab = document.createElement('button');
    tab.className     = 'tab-btn';
    tab.dataset.group = group;
    tab.textContent   = group;
    tab.addEventListener('click', () => showGroup(group));
    groupTabs.appendChild(tab);
  });

  // 表示グループを切り替える（選択中の素材はそのまま）
  function showGroup(group) {
    activeGroup = group;
    groupTabs.querySelectorAll('.tab-btn').forEach(t => {
      t.classList.toggle('active', t.dataset.group === group);
      t.classList.toggle('suggest', PALETTE.some(mat =>
        mat.group === t.dataset.group && suggestedIds.has(mat.id)
      ));
    });
    renderMatRow();
  }

  // 素材行は表示グループの分だけ作り直す。最大6個なので毎回全消しで作っても軽い。
  function renderMatRow() {
    matRow.replaceChildren();
    PALETTE.filter(m => m.group === activeGroup).forEach(mat => {
      const btn = document.createElement('button');
      btn.className  = 'mat-btn';
      btn.dataset.id = mat.id;
      btn.title      = mat.label;
      btn.classList.toggle('active', mat.id === selectedId);
      btn.classList.toggle('suggest', suggestedIds.has(mat.id));

      const dot = document.createElement('span');
      dot.className        = 'dot';
      dot.style.background = mat.color;
      btn.append(dot, mat.label);

      btn.addEventListener('click', () => selectMaterial(mat.id));
      matRow.appendChild(btn);
    });
  }

  function selectMaterial(id) {
    if (id === RAKE_TOOL) {
      input.tool = 'rake'; // 素材は据え置き（熊手は色だけ書き換える道具）
    } else {
      input.tool = 'brush';
      input.material = id;
    }
    selectedId = id;

    // 選んだものが必ず画面に見えているよう、そのグループのタブを開く
    // （キー入力で選んだ時に「選択したのに素材行に無い」が起きないようにする）
    const found = PALETTE.find(p => p.id === id);
    if (found) {
      showGroup(found.group); // renderMatRow はこの中で走る
      showHint(`選択: ${found.label}`);
    } else {
      renderMatRow();
    }
  }
  selectMaterial(SAND);

  document.addEventListener('keydown', e => {
    const top = openModals[openModals.length - 1];
    if (e.key === 'Escape') {
      if (top) top.close();
      else closePracticePopup();
      return;
    }
    if (top) { // モーダルを開いている間は素材のホットキーを効かせない
      if (e.key === 'Tab') top.trapTab(e);
      return;
    }
    // 素材の 1 キー直接選択（1〜8, q〜c など）は無効。素材は下部バーから選ぶ。
    // PALETTE の key は、キーボード操作の設計（docs/keyboard-mode-design.md）で使うために残してある。
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    const command = COMMANDS.find(c => c.key === e.key.toLowerCase());
    if (command) { e.preventDefault(); command.run(); }
  });

  // ── UI: brush size ────────────────────────────────────────────────────────
  // スライダーではなく ⊖ / ⊕ の2ボタンにする。<input type="range"> はキーボードだと
  // 「左右で値変更」になり、他の行の「左右で項目移動」と衝突するため
  // （docs/keyboard-mode-design.md §2）。範囲・初期値はスライダー時代と同じ。
  const BRUSH_MIN = 1;
  const BRUSH_MAX = 8;
  const brushVal  = document.getElementById('brush-val');

  function setBrush(r) {
    input.brushRadius    = Math.min(BRUSH_MAX, Math.max(BRUSH_MIN, r));
    brushVal.textContent = input.brushRadius;
  }
  document.getElementById('brush-dec')
    .addEventListener('click', () => setBrush(input.brushRadius - 1));
  document.getElementById('brush-inc')
    .addEventListener('click', () => setBrush(input.brushRadius + 1));
  setBrush(5);

  // ── UI: 実験帳 ───────────────────────────────────────────────────────────
  const practiceBtn = document.getElementById('practice-btn');
  practiceBtn.addEventListener('click', () => {
    audio.ensure();
    if (!practice.active) {
      activeScenario = null;
      practice.start();
      showHint('実験帳 — ⏭でスキップ、成功後は「次へ」、クリアで退出');
    } else {
      practice.skip();
    }
  });

  // ── UI: rain toggle ───────────────────────────────────────────────────────
  const rainBtn = document.getElementById('rain-btn');
  rainBtn.addEventListener('click', () => {
    spawner.enabled = !spawner.enabled;
    rainBtn.classList.toggle('active', spawner.enabled);
    showHint(spawner.enabled ? '雨モード ON ☁' : '雨モード OFF');
  });

  // ── UI: sound toggle ─────────────────────────────────────────────────────
  const soundBtn = document.getElementById('sound-btn');
  soundBtn.addEventListener('click', () => {
    audio.ensure();
    audio.setMuted(!audio.muted);
    soundBtn.textContent = audio.muted ? '🔕' : '🔔';
    showHint(audio.muted ? '音 OFF' : '音 ON — 水琴窟');
  });

  // ── UI: 散（風の掃き消し）────────────────────────────────────────────────
  const chiriBtn = document.getElementById('chiri-btn');
  chiriBtn.addEventListener('click', () => {
    if (ritual.active) return;
    audio.ensure();
    ritual.start();
    audio.wind(ritual.duration / 60); // 60fps 換算の秒数だけ風が吹く
    showHint('散 — すべては風に還る');
  });

  // ── UI: clear ────────────────────────────────────────────────────────────
  document.getElementById('clear-btn').addEventListener('click', () => {
    closePracticePopup();
    practice.stop();
    engine.clear();
    activeScenario = null;
    updateScenarioBar();
  });

  // ── UI: 倍速 ─────────────────────────────────────────────────────────────
  // 上限は SpeedGovernor が実測から動的に決める（表示 60fps を保てる範囲）。
  const governor = new SpeedGovernor();
  const speedBtn = document.getElementById('speed-btn');
  function updateSpeedBtn() {
    // 最速: 上限にいつも追従する（いまの速度を併記）。上限に抑えられているときは「実際/希望」を出す
    speedBtn.textContent = governor.fastest ? `最速 ${governor.speed}×`
      : governor.limited ? `${governor.speed}/${governor.requested}×` : `${governor.speed}×`;
    speedBtn.classList.toggle('active', governor.requested > 1);
    speedBtn.title = !governor.calibrated
      ? '倍速（性能を測定中）'
      : governor.fastest
        ? `最速 — この端末が 60fps を保てる最大の速さに自動で合わせます（いま ${governor.speed}×）`
        : governor.limited
          ? `倍速 ${governor.requested}× を希望 — 今は負荷が高く ${governor.speed}× に抑えています（上限 ${governor.maxSpeed(performance.now())}×）。軽くなれば自動で戻ります`
          : `倍速（2 の乗数 or 最速。今の上限 ${governor.maxSpeed(performance.now())}×）`;
  }
  speedBtn.addEventListener('click', () => {
    const now = performance.now();
    governor.cycle(now);
    updateSpeedBtn();
    showHint(!governor.calibrated
      ? '性能を測定中… しばらくしてからもう一度'
      : governor.fastest
        ? `最速 — いまは ${governor.speed}×（上限に自動で合わせます）`
        : `${governor.requested}× — 上限 ${governor.maxSpeed(now)}×（この端末で 60fps を保てる範囲）`);
  });
  updateSpeedBtn();

  // ── デバッグ: 温度ビュー ──────────────────────────────────────────────────
  // 設定画面（⚙）の「温度ビュー」で、盤面を温度のヒートマップに切り替える。
  // 凡例の目盛りは素材が変わる温度（氷点・露点・沸点・溶岩が固まる温度・石の融点）。
  const debugPanel  = document.getElementById('debug-temp');
  const dtValue     = document.getElementById('dt-value');
  const dtState     = document.getElementById('dt-state');
  const dtInfo      = document.getElementById('dt-info');
  const debugBar    = document.getElementById('debug-temp-bar');
  const debugMarker = document.getElementById('debug-temp-marker');
  const debugTicks  = document.getElementById('debug-temp-ticks');
  const debugTitle  = document.getElementById('debug-temp-title');
  const debugNote   = document.getElementById('debug-temp-note');
  // 素材が変わる温度の目盛り。隣り合うものが重ならないよう上下 2 段に交互に置く
  const TEMP_TICKS = [[0, '0'], [T_FREEZE, `氷点 ${T_FREEZE}`], [T_DEW, `露点 ${T_DEW}`], [T_BOIL, `沸点 ${T_BOIL}`],
                      [T_LAVA_SOLID, `固化 ${T_LAVA_SOLID}`], [T_STONE_MELT, `岩融 ${T_STONE_MELT}`], [255, '255']];
  const WET_TICKS = [[0, '0 乾'], [30, '乾き 30'], [128, '128'], [200, '泥 200'], [255, '255 飽和']];
  const ACID_TICKS = [[0, '0 中性'], [64, '64'], [128, '128'], [192, '192'], [255, '255 酸']];
  // 値ビューごとの見た目。key は設定画面・キーボードの切り替えと共通
  const VIEWS = {
    temp: { title: '🌡 温度ビュー', key: 'T', rgb: heatRGB, ticks: TEMP_TICKS,
            note: '白い線＝沸点・水色の線＝氷点　暗い面＝空気' },
    wet:  { title: '💧 湿り気ビュー', key: 'M', rgb: t => stopsRGB(WET_STOPS, t), ticks: WET_TICKS,
            note: '砂色＝乾いている・青＝湿っている　暗い面＝空気' },
    acid: { title: '🧪 酸性度ビュー', key: 'B', rgb: t => stopsRGB(ACID_STOPS, t), ticks: ACID_TICKS,
            note: '灰緑＝中性・黄〜白＝強い酸　暗い面＝空気' },
  };
  function applyViewChrome(view) {
    const v = VIEWS[view];
    debugTitle.innerHTML = `${v.title} <small><kbd>${v.key}</kbd> か ⚙ 設定で切替</small>`;
    debugNote.textContent = v.note;
    debugBar.style.background = 'linear-gradient(to right,' +
      Array.from({ length: 17 }, (_, k) => {
        const [r, g, b] = v.rgb(Math.min(255, k * 16));
        return `rgb(${r},${g},${b}) ${(k * 6.25).toFixed(2)}%`;
      }).join(',') + ')';
    // 隣り合う目盛りが重ならないよう、上下 2 段に交互に置く（1 行ラベル）
    debugTicks.innerHTML = v.ticks.map(([t, label], k) =>
      `<span style="left:${(t / 255 * 100).toFixed(1)}%;top:${k % 2 ? 19 : 4}px">${label}</span>`).join('');
  }

  // 温度から「いま何が起きうる温度帯か」を言葉にする
  function tempState(t) {
    if (t <= T_FREEZE)       return ['❄ 氷点以下 — 水は凍る', '#8fd8ff'];
    if (t < T_DEW)           return ['低温 — 蒸気は凝結して雲になる', '#7fd3d8'];
    if (t < T_BOIL - 15)     return ['常温', '#9be08a'];
    if (t < T_BOIL)          return ['高温 — まもなく沸騰', '#f2e35a'];
    if (t < T_STONE_MELT - 20) return ['♨ 沸点以上 — 水は蒸発する（可燃物は発火）', '#ffb04a'];
    if (t < T_STONE_MELT)    return ['🔥 灼熱 — 岩が溶けはじめる', '#ff6a3a'];
    return ['🌋 溶岩の熱 — 岩は溶ける', '#ffffff'];
  }

  let debugCursor = null; // 最後にカーソルがあったグリッド座標

  // 湿り気度・酸性度の段階を言葉にする
  function wetState(w) {
    if (w < 30)  return ['からから — 土は温まると乾いて砂になる', '#d8b878'];
    if (w < 90)  return ['しっとり', '#9bc4c8'];
    if (w < 170) return ['湿っている', '#6aa8e8'];
    return ['水を含みきっている', '#4a82ff'];
  }
  function acidState(a) {
    if (a < 8)   return ['中性', '#9be08a'];
    if (a < 80)  return ['弱い酸', '#d6e05a'];
    if (a < 180) return ['酸性', '#ffe14a'];
    return ['強い酸', '#ffffff'];
  }

  function updateTempReadout() {
    if (renderer.view === 'normal') return;
    renderer.cursor = debugCursor;
    if (!debugCursor || !engine.inBounds(debugCursor.x, debugCursor.y)) {
      dtValue.textContent = '--';
      dtValue.style.color = '';
      dtState.textContent = 'カーソルを盤面に合わせてください';
      dtInfo.textContent = '';
      debugMarker.style.display = 'none';
      return;
    }
    const { x, y } = debugCursor;
    const i = engine.idx(x, y);
    const type = engine.cells[i];
    const t = engine.temp[i], w = engine.wet[i], a = engine.acid[i];
    const name = type === EMPTY ? '空気' : (MATERIALS[type]?.name ?? `#${type}`);
    const view = renderer.view;
    const value = view === 'temp' ? t : view === 'wet' ? w : a;
    const [state, color] = view === 'temp' ? tempState(t) : view === 'wet' ? wetState(w) : acidState(a);
    dtValue.innerHTML = `${value.toFixed(0)}<small>/ 255</small>`;
    dtValue.style.color = color;
    dtState.textContent = state;
    const amb = engine.ambientAt(y);
    dtInfo.textContent = `${name}  (${x}, ${y})\n温度 ${t.toFixed(0)}  湿り気 ${w.toFixed(0)}  酸性度 ${a.toFixed(0)}\n` +
      (type === EMPTY ? `気温 ${amb.toFixed(0)}  高度 ${engine.altitude(y).toFixed(2)}`
                      : `湿りにくさ ${wetResistance(type)}（0 = 湿りやすい 〜 255 = 湿らない）`);
    debugMarker.style.display = 'block';
    debugMarker.style.left = `${Math.min(100, Math.max(0, value / 255 * 100))}%`;
  }
  canvas.addEventListener('pointermove', e => {
    debugCursor = input._gridPos(e.clientX, e.clientY);
    updateTempReadout();
  });
  canvas.addEventListener('pointerleave', () => { debugCursor = null; updateTempReadout(); });

  // view: 'normal'（通常）| 'temp' | 'wet' | 'acid'
  function setView(view) {
    renderer.view = view;
    debugPanel.hidden = view === 'normal';
    if (view !== 'normal') applyViewChrome(view);
    updateTempReadout();
  }
  const setTempView = on => setView(on ? 'temp' : 'normal');

  // ── 設定画面 ─────────────────────────────────────────────────────────────
  // 項目は SETTINGS に足すだけで画面に並ぶ。get は画面を開くたびに現在値を読み直す
  // （状態の持ち主は各機能側。設定画面はスイッチの見た目しか持たない）。
  // type: 'switch'（既定）は get/set で真偽値、'range' は min/max/step の数値（format は値の表示用）。
  const SETTINGS = [
    {
      section: '環境',
      type: 'range',
      name: '🌤 気温（地表）',
      desc: '環境の気温を変えます（上空はそれより低くなります）。氷点（80）を下回ると水が凍り、沸点（150）を上回ると水が沸騰します。素材の温度はゆっくり気温に近づきます。',
      min: T_AMBIENT_GROUND_MIN, max: T_AMBIENT_GROUND_MAX, step: 1,
      initial: T_AMBIENT_GROUND,
      get: () => T_AMBIENT_GROUND + engine.ambientShift,
      set: v => engine.setAmbientShift(v - T_AMBIENT_GROUND),
      format: v => {
        const top = v - (T_AMBIENT_GROUND - T_AMBIENT_TOP);
        const note = v >= T_BOIL ? '🔥 沸点以上' : v <= T_FREEZE ? '❄ 氷点以下' : top <= T_FREEZE ? '上空は氷点以下' : '常温';
        return `${v}  （最上段 ${top}）  ${note}`;
      },
    },
    {
      section: 'デバッグ',
      name: '🌡 温度ビュー',
      desc: '盤面を温度のヒートマップで表示します。カーソルを当てたセルの温度・素材・気温と、沸点・氷点の等温線を確認できます。',
      shortcut: 'T',
      get: () => renderer.tempView,
      set: on => setTempView(on),
    },
    {
      section: 'デバッグ',
      name: '💧 湿り気ビュー',
      desc: '盤面を湿り気度（0〜255）のヒートマップで表示します。カーソルを当てたセルの湿り気度・酸性度・素材の湿りにくさ（抵抗値）を確認できます。水は土のように湿りにくさが低い素材へ染み込み、ガラスや金属には染みません。',
      shortcut: 'M',
      get: () => renderer.view === 'wet',
      set: on => setView(on ? 'wet' : 'normal'),
    },
    {
      section: 'デバッグ',
      name: '🧪 酸性度ビュー',
      desc: '盤面を酸性度（0〜255）のヒートマップで表示します。酸は水の通り道を伝って広がり、水で薄まり、灰や土で中和されます。',
      shortcut: 'B',
      get: () => renderer.view === 'acid',
      set: on => setView(on ? 'acid' : 'normal'),
    },
  ];

  const settingsList = document.getElementById('settings-list');
  const settingSyncs = []; // 画面を開くたびに、各項目の表示を現在値へ合わせる関数
  let lastSection = null;
  SETTINGS.forEach((item, k) => {
    if (item.section !== lastSection) {
      lastSection = item.section;
      const h = document.createElement('div');
      h.className = 'settings-section';
      h.textContent = item.section;
      settingsList.appendChild(h);
    }
    const isRange = item.type === 'range';
    const row = document.createElement(isRange ? 'div' : 'label');
    row.className = isRange ? 'settings-row settings-row-range' : 'settings-row';
    row.innerHTML = `
      <span class="settings-label">
        <span class="settings-name"></span>
        <span class="settings-desc"></span>
      </span>` + (isRange
      ? `<span class="settings-range">
           <input type="range" class="settings-slider" id="setting-${k}" aria-label="">
           <span class="settings-value" aria-live="polite"></span>
           <button type="button" class="settings-reset">標準に戻す</button>
         </span>`
      : `<input type="checkbox" class="settings-switch" role="switch">`);
    row.querySelector('.settings-name').textContent = item.name;
    row.querySelector('.settings-desc').textContent = item.desc;
    if (item.shortcut) {
      const kbd = document.createElement('kbd');
      kbd.className = 'settings-key';
      kbd.textContent = item.shortcut;
      row.querySelector('.settings-name').append(' ', kbd);
    }
    const input = row.querySelector('input');
    if (isRange) {
      const value = row.querySelector('.settings-value');
      input.min = item.min; input.max = item.max; input.step = item.step;
      input.setAttribute('aria-label', item.name);
      const show = () => { value.textContent = item.format(Number(input.value)); };
      input.addEventListener('input', () => { item.set(Number(input.value)); show(); });
      row.querySelector('.settings-reset').addEventListener('click', () => {
        input.value = item.initial; item.set(item.initial); show();
      });
      settingSyncs.push(() => { input.value = item.get(); show(); });
    } else {
      input.addEventListener('change', () => item.set(input.checked));
      settingSyncs.push(() => { input.checked = item.get(); });
    }
    settingsList.appendChild(row);
  });

  const settingsModal = createModal(document.getElementById('settings-modal'), {
    onOpen: () => settingSyncs.forEach(sync => sync()),
  });
  document.getElementById('settings-btn').addEventListener('click', settingsModal.open);

  // ── キーボードコマンド ───────────────────────────────────────────────────
  // 素材のホットキーの代わりに、機能の切り替えだけをコマンドとして割り当てる。
  // モーダルを開いている間は効かない（keydown ハンドラ側で弾いている）。
  const COMMANDS = ['temp', 'wet', 'acid'].map(view => ({
    key: VIEWS[view].key.toLowerCase(),
    name: `${VIEWS[view].title}の切り替え`,
    run: () => {
      const on = renderer.view !== view;
      setView(on ? view : 'normal');
      showHint(on ? `${VIEWS[view].title} ON — [${VIEWS[view].key}] で通常画面に戻る` : `通常画面 — [${VIEWS[view].key}] で${VIEWS[view].title}`);
    },
  }));

  // ── Game loop ─────────────────────────────────────────────────────────────
  // 描画は rAF ごと、シミュレーションは「60 ステップ/秒 × 倍速」を時間で積算して回す。
  // 1フレームに回すステップ数は倍速の 2 倍までに抑え、遅れを取り戻そうとして暴走しない。
  const STEP_MS = 1000 / 60;
  let frame = 0;
  let waterPresent = false;
  let lastTime = performance.now();
  let acc = 0;
  let renderCount = 0;

  function stepSimulation() {
    spawner.update();
    engine.update();
    if (ritual.step() === 'done') {
      activeScenario = null;
      updateScenarioBar();
      audio.bell();
      showHint('無');
    }
    practice.step();
    // 水の在否を毎秒まばらに標本調査（環境音の雫用）
    if (++frame % 60 === 0) {
      waterPresent = false;
      for (let i = 0; i < 200; i++) {
        if (engine.cells[Math.floor(Math.random() * engine.cells.length)] === WATER) {
          waterPresent = true;
          break;
        }
      }
    }
  }

  function loop(timeStamp) {
    const now = performance.now();
    const interval = timeStamp - lastTime;
    lastTime = timeStamp;
    let lowered = governor.recordFrameInterval(interval, now);

    acc += Math.min(interval, 100) / STEP_MS * governor.speed;
    const steps = Math.min(Math.floor(acc), governor.speed * 2);
    acc = Math.min(acc - steps, 1);

    const t0 = performance.now();
    // 予算の時間内でステップを回す。使い切ったら残りは諦め、速度をその分だけ下げる（固まらない）
    const run = governor.runSteps(steps, stepSimulation);
    if (run.truncated) acc = 0; // 回しきれなかった分の遅れは取り戻さない
    const t1 = performance.now();
    audio.ambientTick(waterPresent);
    renderer.render();
    if (renderer.view !== 'normal' && renderCount % 6 === 0) updateTempReadout(); // 動く素材の値に追従
    checkActProgress();
    const t2 = performance.now();

    lowered = governor.recordWork(t1 - t0, run.done, t2 - t1, t2) || lowered || run.truncated;
    if (lowered) {
      updateSpeedBtn();
      showHint(governor.fastest
        ? `最速 — 負荷が高いので ${governor.speed}× に合わせました`
        : `${governor.speed}× に下げました（希望 ${governor.requested}×）— 60fps を保てる上限です。軽くなれば戻ります`);
    } else if (++renderCount % 30 === 0) {
      updateSpeedBtn(); // 較正完了・上限の変化をツールチップに反映
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__zen = { engine, practice, input, renderer };
}

document.addEventListener('DOMContentLoaded', init);

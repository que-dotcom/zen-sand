import { Engine }       from './engine.js';
import { Renderer }     from './renderer.js';
import { InputHandler } from './input.js';
import { EMPTY, SAND, WATER, WALL, SNOW, FIRE, OIL, LAVA, COAL,
         SOIL, SEED, FUNGUS, METAL, LIGHTNING,
         STEAM, ACID, MUD, ICE, HARD_SOIL,
         ACID_PLANT, OBSIDIAN, SANDSTONE, BASALT, SPRING, LAVA_SPRING,
         SAKURA_SEED, SAKURA_PETAL, FIREFLY, POLLEN, MA_VOID, KOI, GOLD } from './materials.js';
import { SCENARIOS, MATERIAL_TRIGGER_MAP } from './scenarios.js';
import { ZenAudio }     from './audio.js';
import { ChiriRitual }  from './ritual.js';
import { DRILLS, PracticeMode } from './practice.js';

function rubyHTML(s) {
  return s.replace(/([一-龠々〆〤ヶ]+)\{([^}]+)\}/g, '<ruby>$1<rt>$2</rt></ruby>');
}

const CELL_SIZE = 4;

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
    renderer.imageData = renderer.ctx.createImageData(nw * CELL_SIZE, nh * CELL_SIZE);
    renderer.pixels    = new Uint32Array(renderer.imageData.data.buffer);
    renderer.pw        = nw * CELL_SIZE;
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
  const scenarioModal = document.getElementById('scenario-modal');

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
    closeModal();
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

  // ── Scenario modal ────────────────────────────────────────────────────────
  function openModal() {
    scenarioModal.classList.add('show');
  }

  function closeModal() {
    scenarioModal.classList.remove('show');
  }

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

  document.getElementById('scenario-btn').addEventListener('click', openModal);
  document.getElementById('scenario-modal-close').addEventListener('click', closeModal);
  scenarioModal.addEventListener('click', e => {
    if (e.target === scenarioModal) closeModal();
  });

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
      btn.title      = `${mat.label}  [${mat.key}]`;
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
      showHint(`選択: ${found.label}  [${found.key}]`);
    } else {
      renderMatRow();
    }
  }
  selectMaterial(SAND);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      closePracticePopup();
    }
    const mat = PALETTE.find(p => p.key === e.key);
    if (mat) selectMaterial(mat.id);
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

  // ── Game loop ─────────────────────────────────────────────────────────────
  let frame = 0;
  let waterPresent = false;
  function loop() {
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
    audio.ambientTick(waterPresent);
    renderer.render();
    checkActProgress();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__zen = { engine, practice, input };
}

document.addEventListener('DOMContentLoaded', init);

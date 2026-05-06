import { Engine }       from './engine.js';
import { Renderer }     from './renderer.js';
import { InputHandler } from './input.js';
import { EMPTY, SAND, WATER, WALL, SNOW, FIRE, OIL, LAVA, COAL,
         SOIL, SEED, FUNGUS, METAL, LIGHTNING,
         STEAM, ACID, MUD, ICE, HARD_SOIL,
         ACID_PLANT, OBSIDIAN, SANDSTONE, BASALT, SPRING, LAVA_SPRING,
         SAKURA_SEED, SAKURA_PETAL, FIREFLY } from './materials.js';
import { SCENARIOS, MATERIAL_TRIGGER_MAP } from './scenarios.js';

const CELL_SIZE = 4;

// ─── Material palette ────────────────────────────────────────────────────────
const PALETTE = [
  // 燃焼系
  { id: SAND,   label: '砂',   color: '#C2A35A', key: '1' },
  { id: WATER,  label: '水',   color: '#3A7BD5', key: '2' },
  { id: SNOW,   label: '雪',   color: '#EEEEFF', key: '3' },
  { id: FIRE,   label: '火',   color: '#FF6600', key: '4' },
  { id: OIL,    label: '油',   color: '#8B6914', key: '5' },
  { id: LAVA,   label: '溶岩', color: '#FF4500', key: '6' },
  { id: COAL,   label: '炭',   color: '#333333', key: '7' },
  { id: WALL,   label: '壁',   color: '#888888', key: '8' },
  // 生命系
  { id: SOIL,      label: '土(落)', color: '#5C3D1E', key: 'q' },
  { id: HARD_SOIL, label: '土(固)', color: '#C47A45', key: 'a' },
  { id: SEED,   label: '種',   color: '#A8C060', key: 'w' },
  { id: FUNGUS, label: '菌',   color: '#4A2060', key: 'e' },
  // 電気系
  { id: METAL,     label: '金属', color: '#B0B8C8', key: 'r' },
  { id: LIGHTNING, label: '雷',   color: '#EEEEFF', key: 't' },
  // 液体・気体系
  { id: STEAM,  label: '蒸気', color: '#DDEEFF', key: 'y' },
  { id: ACID,   label: '酸',   color: '#66FF33', key: 'u' },
  { id: MUD,    label: '泥',   color: '#6B4226', key: 'i' },
  { id: ICE,    label: '氷',   color: '#AADDFF', key: 'o' },
  // P3 素材
  { id: ACID_PLANT, label: '酸植物', color: '#5A9900', key: 'p' },
  { id: OBSIDIAN,   label: '黒曜石', color: '#1A1A2E', key: 's' },
  { id: SANDSTONE,  label: '砂岩',   color: '#C4A35A', key: 'd' },
  { id: BASALT,     label: '玄武岩', color: '#2A1A1A', key: 'f' },
  { id: SPRING,      label: '水源',   color: '#1A88DD', key: 'g' },
  { id: LAVA_SPRING, label: '溶岩源', color: '#FF3300', key: 'h' },
  // 侘び寂び
  { id: SAKURA_SEED,  label: '桜種',  color: '#C0784E', key: 'j' },
  { id: SAKURA_PETAL, label: '花びら', color: '#FFB7C5', key: 'k' },
  { id: FIREFLY,      label: '蛍',    color: '#FFFF44', key: 'l' },
  // ツール
  { id: EMPTY,  label: '消',   color: '#555555', key: '0' },
];

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
    if (mat === EMPTY || mat === WALL) return;

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
    const w = Math.floor(window.innerWidth  / CELL_SIZE);
    const h = Math.floor(window.innerHeight / CELL_SIZE);
    canvas.width  = w * CELL_SIZE;
    canvas.height = h * CELL_SIZE;
    return { w, h };
  }

  let { w, h } = resize();
  const engine   = new Engine(w, h);
  const renderer = new Renderer(canvas, engine, CELL_SIZE);
  const input    = new InputHandler(canvas, engine, CELL_SIZE);
  const spawner  = new Spawner(engine, input);

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
  function showHint(msg) {
    hint.textContent = msg;
    hint.classList.add('show');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => hint.classList.remove('show'), 1800);
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
    scenarioBar.textContent = actHint;
    scenarioBar.classList.add('show');
  }

  function loadScenario(scenario) {
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

  // ── UI: material buttons ──────────────────────────────────────────────────
  const toolbar = document.getElementById('toolbar');
  PALETTE.forEach(mat => {
    const btn = document.createElement('button');
    btn.className   = 'mat-btn';
    btn.dataset.id  = mat.id;
    btn.innerHTML   = `<span class="dot" style="background:${mat.color}"></span>${mat.label}`;
    btn.addEventListener('click', () => selectMaterial(mat.id));
    toolbar.appendChild(btn);
  });

  function selectMaterial(id) {
    input.material = id;
    document.querySelectorAll('.mat-btn').forEach(b =>
      b.classList.toggle('active', Number(b.dataset.id) === id));
    const found = PALETTE.find(p => p.id === id);
    if (found) showHint(`選択: ${found.label}  [${found.key}]`);
  }
  selectMaterial(SAND);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
    const mat = PALETTE.find(p => p.key === e.key);
    if (mat) selectMaterial(mat.id);
  });

  // ── UI: brush size ────────────────────────────────────────────────────────
  const brushSlider = document.getElementById('brush-size');
  brushSlider.addEventListener('input', () => {
    input.brushRadius = Number(brushSlider.value);
  });

  // ── UI: rain toggle ───────────────────────────────────────────────────────
  const rainBtn = document.getElementById('rain-btn');
  rainBtn.addEventListener('click', () => {
    spawner.enabled = !spawner.enabled;
    rainBtn.classList.toggle('active', spawner.enabled);
    showHint(spawner.enabled ? '雨モード ON ☁' : '雨モード OFF');
  });

  // ── UI: clear ────────────────────────────────────────────────────────────
  document.getElementById('clear-btn').addEventListener('click', () => {
    engine.clear();
    activeScenario = null;
    updateScenarioBar();
  });

  // ── Game loop ─────────────────────────────────────────────────────────────
  function loop() {
    spawner.update();
    engine.update();
    renderer.render();
    checkActProgress();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

document.addEventListener('DOMContentLoaded', init);

// ─── 水琴窟 — 生成音響 ────────────────────────────────────────────────────────
// 音の生成コアは「任意の BaseAudioContext で動く純関数」として書く。
// 実行時は AudioContext、検証時は OfflineAudioContext を渡す（同一コードを検証する）。

// 共有ノイズバッファ（ctx ごとに1回生成）
function noiseBuffer(ctx, seconds = 2) {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

// 水琴窟の雫: 減衰する正弦（わずかに音程が沈む）+ 洞の残響（フィードバックディレイ）
export function playDrip(ctx, dest, { when = ctx.currentTime, f0 = 1400, gain = 0.35 } = {}) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(f0, when);
  osc.frequency.exponentialRampToValueAtTime(f0 * 0.94, when + 0.35);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain, when + 0.004);      // 4ms アタック
  g.gain.exponentialRampToValueAtTime(1e-4, when + 0.9);   // 指数減衰
  g.gain.linearRampToValueAtTime(0, when + 0.93);

  // 洞の響き（減衰するこだま）
  const dly = ctx.createDelay(0.5);
  dly.delayTime.value = 0.19;
  const fb  = ctx.createGain(); fb.gain.value  = 0.32;
  const wet = ctx.createGain(); wet.gain.value = 0.35;
  osc.connect(g);
  g.connect(dest);
  g.connect(dly); dly.connect(fb); fb.connect(dly); dly.connect(wet); wet.connect(dest);

  osc.start(when);
  osc.stop(when + 1.0);
}

// 熊手の砂擦れ: 低めの帯域ノイズの短いふくらみ
export function playScrape(ctx, dest, { when = ctx.currentTime, gain = 0.5 } = {}) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 0.4);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(420, when);
  bp.frequency.linearRampToValueAtTime(700, when + 0.16);
  bp.Q.value = 1.2;
  // バンドパス単体では白色ノイズの高域が漏れてヒスになる → ローパスを直列に足す
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1100;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain, when + 0.03);
  g.gain.linearRampToValueAtTime(0, when + 0.2);
  src.connect(bp); bp.connect(lp); lp.connect(g); g.connect(dest);
  src.start(when);
  src.stop(when + 0.22);
}

// 散の風: 帯域が揺れるノイズの長いうねり（duration 秒で吹き終わる）
export function playWind(ctx, dest, { when = ctx.currentTime, duration = 10, gain = 0.5 } = {}) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 2);
  src.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.7;
  bp.frequency.setValueAtTime(180, when);
  bp.frequency.linearRampToValueAtTime(750, when + duration * 0.45);
  bp.frequency.linearRampToValueAtTime(300, when + duration);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain, when + duration * 0.3);   // ゆっくり立ち上がる
  g.gain.setValueAtTime(gain, when + duration * 0.7);
  g.gain.linearRampToValueAtTime(0, when + duration);            // 吹き止む
  src.connect(bp); bp.connect(g); g.connect(dest);
  src.start(when);
  src.stop(when + duration + 0.05);
}

// おりん: 非整数倍音の長い減衰（散の結びに一打）
export function playBell(ctx, dest, { when = ctx.currentTime, f0 = 660, gain = 0.3 } = {}) {
  const partials = [
    { ratio: 1.0,   g: 1.0,  decay: 3.5 },
    { ratio: 2.756, g: 0.45, decay: 2.2 },
    { ratio: 5.404, g: 0.18, decay: 1.2 },
  ];
  for (const p of partials) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f0 * p.ratio;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain * p.g, when + 0.006);
    g.gain.exponentialRampToValueAtTime(1e-4, when + p.decay);
    g.gain.linearRampToValueAtTime(0, when + p.decay + 0.03);
    osc.connect(g); g.connect(dest);
    osc.start(when);
    osc.stop(when + p.decay + 0.05);
  }
}

// ─── 実行時ラッパ ────────────────────────────────────────────────────────────
// AudioContext はユーザ操作（ポインタダウン等）後にしか鳴らせないため遅延生成する。
export class ZenAudio {
  constructor() {
    this.ctx     = null;
    this.master  = null;
    this.muted   = false;
    this._nextDrip   = 0; // 環境音の次回時刻（ctx.currentTime 基準）
    this._lastScrape = 0;
  }

  // ユーザ操作ハンドラから呼ぶ（初回のみ生成、以後 resume）
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(this.ctx.destination);
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 1;
  }

  get ready() { return !!this.ctx && !this.muted; }

  drip()  { if (this.ready) playDrip(this.ctx, this.master, { f0: 900 + Math.random() * 1400 }); }
  bell()  { if (this.ready) playBell(this.ctx, this.master); }
  wind(duration) { if (this.ready) playWind(this.ctx, this.master, { duration }); }

  scrape() {
    if (!this.ready) return;
    const now = this.ctx.currentTime;
    if (now - this._lastScrape < 0.15) return; // 擦れ音の連打を抑制
    this._lastScrape = now;
    playScrape(this.ctx, this.master);
  }

  // 毎フレーム呼ぶ。水があるときだけ、まばらに雫を鳴らす（2〜7秒間隔）
  ambientTick(waterPresent) {
    if (!this.ready || !waterPresent) return;
    const now = this.ctx.currentTime;
    if (now < this._nextDrip) return;
    this._nextDrip = now + 2 + Math.random() * 5;
    playDrip(this.ctx, this.master, { f0: 900 + Math.random() * 1400, gain: 0.22 });
  }
}

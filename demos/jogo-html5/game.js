/* Coleção Cósmica · jogo em HTML5 Canvas + JS puro (sem biblioteca) */
(function () {
  'use strict';
  const A = window.CCArt;
  const W = 216, STEP = 1 / 60;
  let H = 384; // altura lógica se adapta ao formato da tela do celular
  const $ = s => document.querySelector(s);
  const cv = $('#cv'), ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const Q = new URLSearchParams(location.search);
  const SHOT = Q.get('shot');

  // ---------- Save (localStorage) ----------
  const KEY = 'colecao-cosmica-v1';
  let save = { album: {}, best: 0, muted: false, trades: 0 };
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) save = Object.assign(save, s); } catch (e) { /* sem storage */ }
  function persist() { if (SHOT) return; try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { } }
  const owned = () => A.PLANETS.filter(p => save.album[p.id] > 0).length;
  const repeats = () => A.PLANETS.reduce((n, p) => n + Math.max(0, (save.album[p.id] || 0) - 1), 0);

  // ---------- Som (Web Audio, gerado por código) ----------
  const Snd = {
    ac: null, master: null,
    init() {
      if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.ac = new AC(); this.master = this.ac.createGain(); this.master.gain.value = save.muted ? 0 : 0.5; this.master.connect(this.ac.destination);
      const len = this.ac.sampleRate * 0.4, b = this.ac.createBuffer(1, len, this.ac.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      this.noise = b;
    },
    setMuted(m) { save.muted = m; persist(); if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.5, this.ac.currentTime, 0.02); },
    tone(f, dur, type, vol, f2, delay) {
      if (!this.ac || save.muted) return;
      const t = this.ac.currentTime + (delay || 0), o = this.ac.createOscillator(), g = this.ac.createGain();
      o.type = type || 'square'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.08, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
    },
    boom(vol) {
      if (!this.ac || save.muted) return;
      const s = this.ac.createBufferSource(), g = this.ac.createGain(), f = this.ac.createBiquadFilter();
      s.buffer = this.noise; f.type = 'lowpass'; f.frequency.value = 900; g.gain.value = vol || 0.12;
      s.connect(f); f.connect(g); g.connect(this.master); s.start();
    },
    shoot() { this.tone(1320, 0.05, 'square', 0.018, 700); },
    hit() { this.tone(260, 0.06, 'square', 0.03, 140); },
    card(rar) { const n = [660, 880, 1100, 1320]; n.forEach((f, i) => this.tone(f * (rar === 2 ? 1.26 : 1), 0.09, 'triangle', 0.06, 0, i * 0.06)); },
    power() { this.tone(440, 0.18, 'triangle', 0.07, 1320); },
    hurt() { this.boom(0.2); this.tone(200, 0.3, 'sawtooth', 0.05, 60); },
    ui() { this.tone(980, 0.04, 'square', 0.03); },
    clear() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.07, 0, i * 0.11)); }
  };

  // ---------- Sprites ----------
  const shipImg = A.sprite(A.SHIP, A.SHIP_PAL);
  const droneImg = A.sprite(A.DRONE, A.DRONE_PAL);
  const droneFlash = A.sprite(A.DRONE, Object.fromEntries(Object.keys(A.DRONE_PAL).map(k => [k, '#ffffff'])));
  const cardImg = [0, 1, 2].map(A.cardSprite);
  const heart = A.sprite(['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'], { '#': '#ff5a7a' });
  const heartOff = A.sprite(['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'], { '#': '#3a3466' });
  const ROCKS = {}; [5, 7, 10].forEach(r => { ROCKS[r] = [0, 1, 2].map(i => A.rock(r, r * 31 + i * 7)); });
  const PW = {
    S: { col: '#4fe3ff', nome: 'Escudo', dur: 8 },
    M: { col: '#c38bff', nome: 'Ímã', dur: 10 },
    D: { col: '#ff9a3d', nome: 'Tiro duplo', dur: 10 },
    V: { col: '#ff5a7a', nome: '+1 vida', dur: 0 }
  };

  // ---------- Fundo ----------
  const R0 = A.mulberry32(7);
  const stars = [0, 1, 2].map(l => Array.from({ length: [60, 34, 14][l] }, () => ({ x: R0() * W, y: R0() * 468, tw: R0() * 6 })));
  const SCOL = ['#3b3770', '#8c86c9', '#fff4d6'];
  let starSpeed = 1, bgPlanet = null;
  function drawStars(dt, speed) {
    for (let l = 0; l < 3; l++) {
      const v = [6, 16, 38][l] * speed;
      ctx.fillStyle = SCOL[l];
      for (const s of stars[l]) {
        s.y += v * dt; if (s.y > H) { s.y -= H; s.x = Math.random() * W; }
        s.tw += dt;
        if (l === 2 && speed > 3) ctx.fillRect(s.x | 0, s.y | 0, 1, Math.min(14, speed * 2) | 0);
        else if (l === 2 && Math.sin(s.tw * 3) > 0.6) { ctx.fillRect((s.x | 0) - 1, s.y | 0, 3, 1); ctx.fillRect(s.x | 0, (s.y | 0) - 1, 1, 3); }
        else ctx.fillRect(s.x | 0, s.y | 0, 1, 1);
      }
    }
  }
  function bgGrad() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b0920'); g.addColorStop(0.6, '#140f33'); g.addColorStop(1, '#22143a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  // ---------- Entrada ----------
  const keys = {};
  let touch = null, tdx = 0, tdy = 0;
  addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'KeyP' || e.code === 'Escape') { if (mode === 'play') pause(); else if (mode === 'pause') resume(); }
    if (e.code === 'KeyM') toggleMute();
    if ((e.code === 'Enter' || e.code === 'Space') && mode === 'title') { e.preventDefault(); act('play'); }
    if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
  });
  addEventListener('keyup', e => { keys[e.code] = false; });
  cv.addEventListener('pointerdown', e => { Snd.init(); touch = { id: e.pointerId, x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => {
    if (!touch || touch.id !== e.pointerId) return;
    const k = W / cv.clientWidth * 1.25;
    tdx += (e.clientX - touch.x) * k; tdy += (e.clientY - touch.y) * k; touch.x = e.clientX; touch.y = e.clientY;
  });
  const endT = e => { if (touch && touch.id === e.pointerId) touch = null; };
  cv.addEventListener('pointerup', endT); cv.addEventListener('pointercancel', endT);
  document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play') pause(); });
  addEventListener('blur', () => { if (mode === 'play' && !SHOT) pause(); });

  // ---------- Estado do jogo ----------
  let mode = 'title', nav = [], g = null, autopilot = false;
  function newGame() {
    g = {
      level: +(Q.get('lvl') || 1), score: 0, lives: 3, t: 0, dur: 0, ending: 0,
      ship: { x: W / 2, y: H - 60, inv: 0, fire: 0, tilt: 0 },
      pw: { S: 0, M: 0, D: 0 }, bullets: [], rocks: [], cards: [], powers: [], drones: [], eb: [], parts: [], texts: [],
      tr: 0.6, tc: 2, tp: 9, td: 4, runCards: [], phaseCards: [], banner: null, shake: 0, flash: 0
    };
    startPhase();
  }
  function startPhase() {
    g.t = 0; g.dur = 34 + g.level * 3; g.ending = 0; g.phaseCards = [];
    g.rocks.length = g.eb.length = g.drones.length = 0;
    const p = A.PLANETS[(g.level * 5 + 3) % A.PLANETS.length];
    bgPlanet = { img: A.planetPixels(p, 56, g.level), x: 30 + (g.level * 53) % 150, y: -70 };
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  function spawnRock(r, x, y, vx, vy) {
    r = r || (Math.random() < 0.35 + g.level * 0.04 ? 10 : Math.random() < 0.5 ? 7 : 5);
    g.rocks.push({ x: x ?? rnd(12, W - 12), y: y ?? -14, r, vx: vx ?? rnd(-12, 12), vy: vy ?? rnd(28, 46) + g.level * 6, hp: r === 10 ? 3 : r === 7 ? 2 : 1, img: ROCKS[r][(Math.random() * 3) | 0], fl: 0 });
  }
  function spawnCard(x, y) { g.cards.push({ x: x ?? rnd(16, W - 16), y: y ?? -10, vy: rnd(34, 44), ph: Math.random() * 6, rar: rollRarity() }); }
  function rollRarity() {
    const r = Math.random(), lend = 0.03 + g.level * 0.006, rara = 0.2 + g.level * 0.012;
    return r < lend ? 2 : r < lend + rara ? 1 : 0;
  }
  function spawnPower(x, y) {
    const k = g.lives < 3 && Math.random() < 0.25 ? 'V' : ['S', 'M', 'D'][(Math.random() * 3) | 0];
    g.powers.push({ x: x ?? rnd(16, W - 16), y: y ?? -10, k, vy: 34, ph: 0 });
  }
  function boom(x, y, n, col, sp) {
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = rnd(10, sp || 70); g.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: rnd(0.3, 0.7), col: col || (Math.random() < 0.5 ? '#ffd166' : '#ff7a59') }); }
  }
  function floatText(x, y, t, col) { g.texts.push({ x, y, t, col: col || '#fff4d6', l: 0.8 }); }

  function collectCard(c) {
    const pool = A.PLANETS.filter(p => p.rar === c.rar);
    const p = pool[(Math.random() * pool.length) | 0];
    const isNew = !(save.album[p.id] > 0);
    save.album[p.id] = (save.album[p.id] || 0) + 1; persist();
    g.runCards.push({ id: p.id, isNew }); g.phaseCards.push({ id: p.id, isNew });
    g.score += 50 + c.rar * 100;
    g.banner = { p, isNew, t: 1.8 };
    boom(c.x, c.y, 14, A.RAR[c.rar].cor, 50);
    Snd.card(c.rar);
  }
  function hurt() {
    if (g.ship.inv > 0) return;
    if (g.pw.S > 0) { g.pw.S = 0; g.ship.inv = 1; boom(g.ship.x, g.ship.y, 20, '#4fe3ff', 60); Snd.hit(); floatText(g.ship.x, g.ship.y - 12, 'ESCUDO!', '#4fe3ff'); return; }
    g.lives--; g.ship.inv = 1.6; g.shake = 0.35; g.flash = 0.15; Snd.hurt();
    boom(g.ship.x, g.ship.y, 26, null, 90);
    if (g.lives <= 0) { s_dead(); gameOver(); }
  }
  function s_dead() { g.ship.dead = true; boom(g.ship.x, g.ship.y, 40, null, 110); boom(g.ship.x, g.ship.y, 16, '#4fe3ff', 60); }
  const hit = (a, b, r) => { const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy < r * r; };

  function update(dt) {
    const s = g.ship;
    // movimento
    let mx = 0, my = 0;
    if (keys.ArrowLeft || keys.KeyA) mx -= 1; if (keys.ArrowRight || keys.KeyD) mx += 1;
    if (keys.ArrowUp || keys.KeyW) my -= 1; if (keys.ArrowDown || keys.KeyS) my += 1;
    if (autopilot) { const a = pilot(); mx = a[0]; my = a[1]; }
    const sp = 120;
    s.x += mx * sp * dt + tdx; s.y += my * sp * dt + tdy;
    s.tilt += ((mx || Math.sign(tdx) * Math.min(1, Math.abs(tdx))) - s.tilt) * 0.2;
    tdx = tdy = 0;
    s.x = Math.max(8, Math.min(W - 8, s.x)); s.y = Math.max(70, Math.min(H - 14, s.y));
    if (s.inv > 0) s.inv -= dt;
    // tiro automático
    s.fire -= dt;
    if (s.fire <= 0 && !g.ending) {
      s.fire = 0.2;
      if (g.pw.D > 0) { g.bullets.push({ x: s.x - 4, y: s.y - 4 }, { x: s.x + 4, y: s.y - 4 }); }
      else g.bullets.push({ x: s.x, y: s.y - 7 });
      Snd.shoot();
    }
    for (const k in g.pw) if (g.pw[k] > 0) g.pw[k] -= dt;

    // fase
    g.t += dt;
    if (!g.ending && g.t >= g.dur) { g.ending = 0.01; for (const r of g.rocks) boom(r.x, r.y, 6, '#8c86c9', 40); g.rocks.length = 0; g.eb.length = 0; for (const d of g.drones) boom(d.x, d.y, 10); g.drones.length = 0; Snd.clear(); }
    if (g.ending) { g.ending += dt; starSpeed = 1 + g.ending * 6; if (g.ending > 1.6) phaseClear(); }
    else {
      g.tr -= dt; if (g.tr <= 0) { spawnRock(); g.tr = Math.max(0.32, 1.05 - g.level * 0.09) * rnd(0.7, 1.3); }
      g.tc -= dt; if (g.tc <= 0) { spawnCard(); g.tc = rnd(3, 4.5); }
      g.tp -= dt; if (g.tp <= 0) { spawnPower(); g.tp = rnd(11, 15); }
      if (g.level >= 3) { g.td -= dt; if (g.td <= 0) { g.drones.push({ x0: rnd(40, W - 40), x: 0, y: -10, t: 0, hp: 3, fire: 1.2, fl: 0 }); g.td = Math.max(2.4, 6 - g.level * 0.4); } }
    }

    // balas
    for (let i = g.bullets.length - 1; i >= 0; i--) { const b = g.bullets[i]; b.y -= 260 * dt; if (b.y < -6) g.bullets.splice(i, 1); }
    // rochas
    for (let i = g.rocks.length - 1; i >= 0; i--) {
      const r = g.rocks[i]; r.x += r.vx * dt; r.y += r.vy * dt; if (r.fl > 0) r.fl -= dt;
      if (r.x < -14 || r.x > W + 14 || r.y > H + 14) { g.rocks.splice(i, 1); continue; }
      let dead = false;
      for (let j = g.bullets.length - 1; j >= 0; j--) {
        if (hit(r, g.bullets[j], r.r + 2)) {
          g.bullets.splice(j, 1); r.hp--; r.fl = 0.06; Snd.hit();
          if (r.hp <= 0) { dead = true; break; }
        }
      }
      if (dead) {
        g.rocks.splice(i, 1); const pts = { 10: 30, 7: 20, 5: 10 }[r.r] * g.level; g.score += pts; floatText(r.x, r.y, '+' + pts);
        boom(r.x, r.y, r.r * 2, null, 60); Snd.boom(0.06);
        if (r.r === 10) { spawnRock(5, r.x - 4, r.y, -22, r.vy * 0.9); spawnRock(5, r.x + 4, r.y, 22, r.vy * 0.9); }
        if (Math.random() < 0.06) spawnPower(r.x, r.y);
        continue;
      }
      if (hit(r, s, r.r + 3)) { g.rocks.splice(i, 1); boom(r.x, r.y, 12); hurt(); if (mode !== 'play') return; }
    }
    // drones
    for (let i = g.drones.length - 1; i >= 0; i--) {
      const d = g.drones[i]; d.t += dt; d.y += 22 * dt; d.x = d.x0 + Math.sin(d.t * 1.5) * 40; if (d.fl > 0) d.fl -= dt;
      d.fire -= dt; if (d.fire <= 0 && d.y > 10 && d.y < H - 100) { d.fire = 1.8; const a = Math.atan2(s.y - d.y, s.x - d.x); g.eb.push({ x: d.x, y: d.y + 4, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70 }); Snd.tone(300, 0.08, 'square', 0.02, 500); }
      if (d.y > H + 10) { g.drones.splice(i, 1); continue; }
      for (let j = g.bullets.length - 1; j >= 0; j--) if (hit(d, g.bullets[j], 7)) { g.bullets.splice(j, 1); d.hp--; d.fl = 0.06; }
      if (d.hp <= 0) { g.drones.splice(i, 1); const pts = 40 * g.level; g.score += pts; floatText(d.x, d.y, '+' + pts, '#ff9ec0'); boom(d.x, d.y, 22, '#ff4f8b', 70); Snd.boom(0.1); if (Math.random() < 0.3) spawnCard(d.x, d.y); continue; }
      if (hit(d, s, 9)) { g.drones.splice(i, 1); boom(d.x, d.y, 16); hurt(); if (mode !== 'play') return; }
    }
    for (let i = g.eb.length - 1; i >= 0; i--) {
      const b = g.eb[i]; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.y > H + 4 || b.y < -4 || b.x < -4 || b.x > W + 4) { g.eb.splice(i, 1); continue; }
      if (hit(b, s, 5)) { g.eb.splice(i, 1); hurt(); if (mode !== 'play') return; }
    }
    // figurinhas
    for (let i = g.cards.length - 1; i >= 0; i--) {
      const c = g.cards[i]; c.ph += dt;
      if (g.pw.M > 0 && hit(c, s, 100)) { const a = Math.atan2(s.y - c.y, s.x - c.x); c.x += Math.cos(a) * 150 * dt; c.y += Math.sin(a) * 150 * dt; }
      else { c.y += c.vy * dt; c.x += Math.sin(c.ph * 2) * 12 * dt; }
      if (c.y > H + 10) { g.cards.splice(i, 1); continue; }
      if (hit(c, s, 12)) { g.cards.splice(i, 1); collectCard(c); }
    }
    // power-ups
    for (let i = g.powers.length - 1; i >= 0; i--) {
      const p = g.powers[i]; p.y += p.vy * dt; p.ph += dt;
      if (p.y > H + 10) { g.powers.splice(i, 1); continue; }
      if (hit(p, s, 12)) {
        g.powers.splice(i, 1); Snd.power(); g.score += 25;
        if (p.k === 'V') { g.lives = Math.min(5, g.lives + 1); } else g.pw[p.k] = PW[p.k].dur;
        floatText(s.x, s.y - 14, PW[p.k].nome.toUpperCase(), PW[p.k].col); boom(p.x, p.y, 12, PW[p.k].col, 40);
      }
    }
    // partículas
    for (let i = g.parts.length - 1; i >= 0; i--) { const p = g.parts[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; p.l -= dt; if (p.l <= 0) g.parts.splice(i, 1); }
    for (let i = g.texts.length - 1; i >= 0; i--) { const t = g.texts[i]; t.y -= 18 * dt; t.l -= dt; if (t.l <= 0) g.texts.splice(i, 1); }
    if (g.banner) { g.banner.t -= dt; if (g.banner.t <= 0) g.banner = null; }
    if (g.shake > 0) g.shake -= dt; if (g.flash > 0) g.flash -= dt;
    if (bgPlanet) bgPlanet.y += 5 * dt;
  }

  // Piloto automático (usado só para demonstração e testes)
  function pilot() {
    const s = g.ship; let tx = W / 2, ty = H - 70;
    const tgt = [...g.cards, ...g.powers].filter(c => c.y < s.y + 4).sort((a, b) => b.y - a.y)[0];
    if (tgt) { tx = tgt.x; ty = Math.max(150, Math.min(H - 40, tgt.y + 30)); }
    else { const r = g.rocks.filter(r => r.y < s.y).sort((a, b) => b.y - a.y)[0]; if (r) tx = r.x; }
    let mx = Math.abs(tx - s.x) > 3 ? Math.sign(tx - s.x) : 0, my = Math.abs(ty - s.y) > 4 ? Math.sign(ty - s.y) : 0;
    for (const o of [...g.rocks, ...g.eb, ...g.drones]) {
      const dy = s.y - o.y, dx = s.x - o.x, rr = (o.r || 5) + 12;
      if (dy > -8 && dy < 60 && Math.abs(dx) < rr) { mx = dx >= 0 ? 1 : -1; if (s.x < 20) mx = 1; if (s.x > W - 20) mx = -1; my = 1; }
    }
    return [mx, my];
  }

  // ---------- Desenho ----------
  function drawPower(p) {
    const c = PW[p.k], b = Math.sin(p.ph * 5) > 0 ? 1 : 0, x = Math.round(p.x), y = Math.round(p.y);
    ctx.fillStyle = '#0d0b1f'; ctx.fillRect(x - 6, y - 6, 13, 13);
    ctx.fillStyle = c.col; ctx.fillRect(x - 5, y - 5, 11, 1); ctx.fillRect(x - 5, y + 5, 11, 1); ctx.fillRect(x - 5, y - 5, 1, 11); ctx.fillRect(x + 5, y - 5, 1, 11);
    if (b) { ctx.fillRect(x - 7, y - 1, 1, 3); ctx.fillRect(x + 7, y - 1, 1, 3); }
    A.text(ctx, p.k === 'V' ? '+' : p.k, x - 1, y - 2, c.col, 1, 'center');
  }
  function drawShip(s) {
    if (s.dead || (s.inv > 0 && ((s.inv * 12) | 0) % 2)) return;
    const x = Math.round(s.x - 6), y = Math.round(s.y - 7);
    // chama
    const fl = 2 + ((performance.now() / 60) | 0) % 3;
    ctx.fillStyle = '#ffd166'; ctx.fillRect(x + 5, y + 14, 1, fl); ctx.fillRect(x + 7, y + 14, 1, fl);
    ctx.fillStyle = '#ff5a3c'; ctx.fillRect(x + 5, y + 14 + fl, 1, 1); ctx.fillRect(x + 7, y + 14 + fl, 1, 1);
    ctx.drawImage(shipImg, x, y);
    if (g && g.pw.S > 0) {
      const r = 11, t = performance.now() / 1000;
      ctx.fillStyle = g.pw.S < 2 && ((t * 8) | 0) % 2 ? 'rgba(79,227,255,.2)' : 'rgba(79,227,255,.75)';
      for (let a = 0; a < 24; a++) { const an = a / 24 * 6.283 + t * 2; if (a % 3 === 0) continue; ctx.fillRect(Math.round(s.x + Math.cos(an) * r), Math.round(s.y + Math.sin(an) * r), 1, 1); }
    }
  }
  function renderPlay() {
    ctx.save();
    if (g.shake > 0) ctx.translate(Math.round(rnd(-2, 2)), Math.round(rnd(-2, 2)));
    bgGrad();
    if (bgPlanet) { ctx.globalAlpha = 0.55; ctx.drawImage(bgPlanet.img, Math.round(bgPlanet.x), Math.round(bgPlanet.y)); ctx.globalAlpha = 1; }
    drawStars(STEP, starSpeed * (g.ending ? 1 : 1.6));
    // figurinhas com brilho
    for (const c of g.cards) {
      const x = Math.round(c.x - 4), y = Math.round(c.y - 5);
      if (c.rar > 0 && ((c.ph * 6) | 0) % 2) { ctx.fillStyle = A.RAR[c.rar].cor; ctx.fillRect(x - 2, y + 5, 1, 1); ctx.fillRect(x + 10, y + 5, 1, 1); ctx.fillRect(x + 4, y - 2, 1, 1); ctx.fillRect(x + 4, y + 12, 1, 1); }
      ctx.drawImage(cardImg[c.rar], x, y);
    }
    for (const p of g.powers) drawPower(p);
    for (const r of g.rocks) { ctx.drawImage(r.img, Math.round(r.x - r.r - 1), Math.round(r.y - r.r - 1)); if (r.fl > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(r.img, Math.round(r.x - r.r - 1), Math.round(r.y - r.r - 1)); ctx.globalCompositeOperation = 'source-over'; } }
    for (const d of g.drones) ctx.drawImage(d.fl > 0 ? droneFlash : droneImg, Math.round(d.x - 5), Math.round(d.y - 3));
    ctx.fillStyle = '#ff4f8b'; for (const b of g.eb) ctx.fillRect(Math.round(b.x - 1), Math.round(b.y - 1), 3, 3);
    ctx.fillStyle = '#a8f3ff'; for (const b of g.bullets) ctx.fillRect(Math.round(b.x), Math.round(b.y), 1, 4);
    drawShip(g.ship);
    for (const p of g.parts) { ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); }
    for (const t of g.texts) A.text(ctx, t.t, t.x, t.y, t.col, 1, 'center', '#0d0b1f');
    ctx.restore();
    if (g.flash > 0) { ctx.fillStyle = 'rgba(255,90,90,.35)'; ctx.fillRect(0, 0, W, H); }
    drawHUD();
  }
  function drawHUD() {
    ctx.fillStyle = 'rgba(8,6,24,.75)'; ctx.fillRect(0, 0, W, 22);
    A.text(ctx, String(g.score).padStart(6, '0'), 5, 4, '#fff4d6', 1);
    for (let i = 0; i < Math.max(3, g.lives); i++) ctx.drawImage(i < g.lives ? heart : heartOff, 5 + i * 9, 12);
    A.text(ctx, 'FASE ' + g.level, 92, 4, '#ffd166', 1, 'center');
    A.text(ctx, 'ALBUM ' + owned() + '/24', 92, 12, '#8c86c9', 1, 'center');
    // barra de progresso da fase
    const pr = Math.min(1, g.t / g.dur);
    ctx.fillStyle = '#231e4a'; ctx.fillRect(0, 22, W, 2);
    ctx.fillStyle = '#ff7a59'; ctx.fillRect(0, 22, Math.round(W * pr), 2);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(Math.round(W * pr) - 1, 21, 2, 4);
    // power-ups ativos
    let px = 5;
    for (const k of ['S', 'M', 'D']) if (g.pw[k] > 0) {
      const c = PW[k]; ctx.fillStyle = 'rgba(8,6,24,.7)'; ctx.fillRect(px - 1, H - 15, 30, 11);
      A.text(ctx, k, px + 1, H - 12, c.col);
      ctx.fillStyle = '#231e4a'; ctx.fillRect(px + 7, H - 10, 20, 2);
      ctx.fillStyle = c.col; ctx.fillRect(px + 7, H - 10, Math.round(20 * g.pw[k] / c.dur), 2);
      px += 33;
    }
    // faixa de figurinha nova
    if (g.banner) {
      const b = g.banner, t = Math.min(1, (1.8 - b.t) * 6, b.t * 4), y = Math.round(28 + (1 - t) * -40), rc = A.RAR[b.p.rar];
      ctx.fillStyle = '#0d0b1f'; ctx.fillRect(28, y, 160, 30);
      ctx.fillStyle = rc.cor; ctx.fillRect(28, y, 160, 1); ctx.fillRect(28, y + 29, 160, 1); ctx.fillRect(28, y, 1, 30); ctx.fillRect(187, y, 1, 30);
      ctx.drawImage(A.planetCanvas(b.p, 24), 32, y + 3);
      A.text(ctx, b.isNew ? 'NOVA FIGURINHA!' : 'REPETIDA  P/ TROCA', 60, y + 6, b.isNew ? '#ffd166' : '#8c86c9');
      A.text(ctx, '#' + String(b.p.id).padStart(2, '0') + ' ' + b.p.name, 60, y + 16, rc.cor);
    }
  }

  // Tela de título (arte animada)
  let tPlanet = document.createElement('canvas'), tFrame = 0, tTime = 0;
  const titleP = A.PLANETS[19];
  function renderTitle(dt) {
    tTime += dt;
    bgGrad(); drawStars(dt, 0.6);
    // halo
    const cx = 108, cy = 150 + Math.round((H - 384) * 0.6);
    const hg = ctx.createRadialGradient(cx, cy, 10, cx, cy, 90); hg.addColorStop(0, 'rgba(255,122,89,.25)'); hg.addColorStop(1, 'rgba(255,122,89,0)');
    ctx.fillStyle = hg; ctx.fillRect(0, cy - 100, W, 200);
    if (tFrame++ % 3 === 0) A.planetPixels(titleP, 96, tTime * 0.25, tPlanet);
    // cartas orbitando (atrás)
    const orbit = (i, front) => {
      const a = tTime * 0.7 + i * 2.094, x = cx + Math.cos(a) * 78, y = cy + Math.sin(a) * 22;
      if ((Math.sin(a) > 0) === front) ctx.drawImage(cardImg[i], Math.round(x - 4), Math.round(y - 5 + Math.sin(tTime * 3 + i) * 2));
    };
    for (let i = 0; i < 3; i++) orbit(i, false);
    ctx.drawImage(tPlanet, cx - 48, cy - 48);
    for (let i = 0; i < 3; i++) orbit(i, true);
    // nave voando em oito
    const sx = cx + Math.sin(tTime * 0.9) * 70, sy = cy + 64 + Math.sin(tTime * 1.8) * 6;
    drawShip({ x: sx, y: sy, inv: 0 });
    // logo
    const lx = 108, ly = 34;
    A.text(ctx, 'COLECAO', lx, ly, '#ffd166', 3, 'center', '#5a2a3a');
    // cedilha e til desenhados à mão (a fonte bitmap não tem acento)
    const x0 = lx - Math.round(A.textW('COLECAO', 3) / 2);
    const px = (x, y, c) => { ctx.fillStyle = '#3a1a2e'; ctx.fillRect(x + 3, y + 3, 3, 3); ctx.fillStyle = c; ctx.fillRect(x, y, 3, 3); };
    px(x0 + 63, ly + 15, '#ffd166'); px(x0 + 63, ly + 18, '#ffd166'); px(x0 + 60, ly + 21, '#ffd166');
    px(x0 + 72, ly - 6, '#ffd166'); px(x0 + 75, ly - 9, '#ffd166'); px(x0 + 78, ly - 6, '#ffd166'); px(x0 + 81, ly - 9, '#ffd166');
    A.text(ctx, 'COSMICA', lx, ly + 27, '#ff7a59', 3, 'center', '#3a1a2e');
    const x2 = lx - Math.round(A.textW('COSMICA', 3) / 2);
    px(x2 + 18, ly + 21, '#ff7a59'); px(x2 + 21, ly + 18, '#ff7a59');
    A.text(ctx, 'UM ALBUM DE PLANETAS PARA COMPLETAR', 108, ly + 52, '#8c86c9', 1, 'center');
  }

  // ---------- Telas (DOM) ----------
  const screens = ['sTitle', 'sPause', 'sClear', 'sOver', 'sAlbum', 'sTrade'];
  function show(id) { screens.forEach(s => { $('#' + s).hidden = s !== id; }); $('#hudBtns').hidden = id !== null || mode !== 'play'; }
  function setMode(m) {
    mode = m;
    const map = { title: 'sTitle', play: null, pause: 'sPause', clear: 'sClear', over: 'sOver', album: 'sAlbum', trade: 'sTrade' };
    show(map[m]);
    if (m === 'title') { $('#tBest').textContent = save.best; $('#tAlbum').textContent = owned() + '/24'; }
  }
  function miniCard(id, isNew) {
    const p = A.PLANETS[id - 1], d = document.createElement('div');
    d.className = 'mini'; d.style.setProperty('--rc', A.RAR[p.rar].cor);
    const c = document.createElement('canvas'); c.width = c.height = 32; c.getContext('2d').drawImage(A.planetCanvas(p, 32), 0, 0);
    d.append(c, document.createTextNode('#' + String(id).padStart(2, '0')));
    if (isNew) { const n = document.createElement('span'); n.className = 'new'; n.textContent = 'NOVA'; d.append(n); }
    return d;
  }
  function fillGot(el, list) {
    el.innerHTML = '';
    const seen = new Set(), uniq = list.filter(c => !seen.has(c.id) && seen.add(c.id));
    if (!uniq.length) { el.innerHTML = '<span class="none">Nenhuma figurinha desta vez.</span>'; return; }
    uniq.slice(0, 8).forEach(c => el.append(miniCard(c.id, list.some(x => x.id === c.id && x.isNew))));
  }
  function phaseClear() {
    starSpeed = 1; g.ending = 0; g.banner = null; g.bullets.length = 0; g.cards.length = 0; g.powers.length = 0;
    const bonus = 200 * g.level + g.lives * 50; g.score += bonus;
    $('#cTitle').textContent = 'Fase ' + g.level + ' concluída';
    $('#cSub').textContent = 'Bônus +' + bonus + ' · total ' + g.score + ' pts';
    fillGot($('#cGot'), g.phaseCards);
    setMode('clear');
  }
  function gameOver() {
    const rec = g.score > save.best; if (rec) { save.best = g.score; persist(); }
    $('#oScore').textContent = g.score;
    $('#oRec').textContent = rec ? 'Novo recorde!' : 'Recorde: ' + save.best;
    fillGot($('#oGot'), g.runCards);
    setTimeout(() => setMode('over'), 500);
    mode = 'dying';
  }
  function pause() { if (mode !== 'play') return; setMode('pause'); }
  function resume() { Snd.init(); setMode('play'); last = performance.now(); acc = 0; }
  function toggleMute() { Snd.init(); Snd.setMuted(!save.muted); syncMute(); }
  function syncMute() { const b = $('#bMute'); b.classList.toggle('off', !!save.muted); b.setAttribute('aria-label', save.muted ? 'Som desligado' : 'Som ligado'); }
  let toastT = 0;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2200); }

  function buildAlbum() {
    const grid = $('#aGrid'); grid.innerHTML = '';
    for (const p of A.PLANETS) {
      const n = save.album[p.id] || 0, b = document.createElement('button');
      b.className = 'slot r' + p.rar + (n ? '' : ' miss');
      b.innerHTML = '<span class="no">' + String(p.id).padStart(2, '0') + '</span>';
      if (n) {
        b.style.setProperty('--rc', A.RAR[p.rar].cor);
        const c = document.createElement('canvas'); c.width = c.height = 32; c.getContext('2d').drawImage(A.planetCanvas(p, 32), 0, 0);
        const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = p.name;
        b.append(c, nm);
        if (n > 1) { const ct = document.createElement('span'); ct.className = 'ct'; ct.textContent = 'x' + n; b.append(ct); }
        b.setAttribute('aria-label', p.name + ', ' + A.RAR[p.rar].nome + (n > 1 ? ', ' + n + ' cópias' : ''));
        b.onclick = () => openDetail(p);
      } else {
        b.insertAdjacentHTML('beforeend', '<span class="q">?</span>');
        b.setAttribute('aria-label', 'Figurinha ' + p.id + ' ainda não encontrada');
        b.onclick = () => toast('#' + String(p.id).padStart(2, '0') + ' ainda não encontrada');
      }
      grid.append(b);
    }
    const o = owned(); $('#aCount').textContent = o; $('#aRep').textContent = repeats(); $('#aBar').style.width = (o / 24 * 100) + '%';
  }
  function openDetail(p) {
    const n = save.album[p.id] || 0, rc = A.RAR[p.rar];
    $('#dCard').style.setProperty('--rc', rc.cor);
    const c = $('#dCv'); c.getContext('2d').clearRect(0, 0, 72, 72); c.getContext('2d').drawImage(A.planetCanvas(p, 72), 0, 0);
    $('#dNum').textContent = 'Nº ' + String(p.id).padStart(2, '0') + ' de 24';
    $('#dName').textContent = p.name; $('#dRar').textContent = rc.nome; $('#dFact').textContent = p.fact;
    $('#dQty').textContent = n > 1 ? 'Você tem ' + n + ' (' + (n - 1) + ' para troca)' : 'Você tem 1';
    $('#detail').hidden = false;
  }

  // Trocas simuladas com colecionadores fictícios
  const COLL = [
    { nome: 'Lia, piloto de carga', pal: ['#ffcf9e', '#3b2a5a', '#ff7a59'] },
    { nome: 'Tomás do Anel 4', pal: ['#c98e63', '#1f6f6a', '#ffd166'] },
    { nome: 'Dra. Odete', pal: ['#7a4a33', '#e9ecf5', '#4fe3ff'] }
  ];
  function avatar(pal) {
    return A.sprite(['..hhhh..', '.hhhhhh.', 'hsssssh.', 'hseses..', '.ssssss.', '..smms..', '.cccccc.', 'cccccccc'],
      { h: pal[1], s: pal[0], e: '#0d0b1f', m: '#a3483a', c: pal[2] });
  }
  function buildTrades() {
    const list = $('#tList'); list.innerHTML = '';
    const missing = A.PLANETS.filter(p => !(save.album[p.id] > 0));
    $('#tRep').textContent = repeats();
    if (!missing.length) { list.innerHTML = '<p class="note">Álbum completo! Não falta nenhuma figurinha.</p>'; return; }
    COLL.forEach((co, i) => {
      if (i >= missing.length) return;
      const want = missing[(save.trades + i * Math.max(1, Math.floor(missing.length / 3))) % missing.length];
      const cost = [2, 3, 5][want.rar];
      const give = pickRepeats(cost);
      const d = document.createElement('div'); d.className = 'offer';
      const av = avatar(co.pal); av.className = 'av';
      const who = document.createElement('div'); who.className = 'who'; who.textContent = co.nome;
      const deal = document.createElement('div'); deal.className = 'deal';
      deal.append(document.createTextNode('Pede ' + cost + ' repetidas'));
      const ar = document.createElement('span'); ar.className = 'arrow'; ar.textContent = '>';
      const c = document.createElement('canvas'); c.width = c.height = 32; c.getContext('2d').drawImage(A.planetCanvas(want, 32), 0, 0);
      deal.append(ar, c, document.createTextNode('#' + String(want.id).padStart(2, '0') + ' ' + want.name + ' (' + A.RAR[want.rar].nome.toLowerCase() + ')'));
      const bt = document.createElement('button'); bt.className = 'btn';
      bt.textContent = give ? 'Trocar' : 'Faltam repetidas';
      bt.disabled = !give;
      bt.onclick = () => {
        give.forEach(id => { save.album[id]--; });
        save.album[want.id] = 1; save.trades++; persist(); Snd.card(want.rar);
        toast('Troca feita: ' + want.name + ' entrou no álbum');
        buildTrades();
      };
      d.append(av, who, deal, bt); list.append(d);
    });
  }
  function pickRepeats(n) {
    const pool = []; A.PLANETS.forEach(p => { for (let k = 1; k < (save.album[p.id] || 0); k++) pool.push(p.id); });
    if (pool.length < n) return null;
    pool.sort((a, b) => (save.album[b] - save.album[a]) || (A.PLANETS[a - 1].rar - A.PLANETS[b - 1].rar));
    return pool.slice(0, n);
  }

  function act(a) {
    Snd.init(); Snd.ui();
    if (a === 'play') { newGame(); autopilot = false; setMode('play'); last = performance.now(); acc = 0; }
    else if (a === 'resume') resume();
    else if (a === 'next') { g.level++; startPhase(); setMode('play'); last = performance.now(); acc = 0; }
    else if (a === 'menu') { g = null; nav = []; setMode('title'); }
    else if (a === 'album') { if (mode === 'album') return; nav.push(mode); buildAlbum(); setMode('album'); }
    else if (a === 'trade') { nav.push(mode); buildTrades(); setMode('trade'); }
    else if (a === 'back') { const m = nav.pop() || 'title'; if (m === 'album') buildAlbum(); setMode(m); }
    else if (a === 'closeDetail') $('#detail').hidden = true;
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) act(b.dataset.act); });
  $('#bPause').onclick = () => { Snd.ui(); pause(); };
  $('#bMute').onclick = toggleMute;
  $('#detail').addEventListener('click', e => { if (e.target.id === 'detail') $('#detail').hidden = true; });

  // ---------- Tamanho da tela ----------
  function fit() {
    const vw = innerWidth, vh = innerHeight;
    let w, h;
    if (vw > 980) { H = 384; h = Math.min(vh - 48, 900); w = h * W / H; }
    else {
      H = Math.round(Math.max(384, Math.min(468, W * vh / vw)));
      w = vw; h = w * H / W; if (h > vh) { h = vh; w = h * W / H; }
    }
    if (cv.height !== H) { cv.height = H; ctx.imageSmoothingEnabled = false; }
    const st = $('#stage'); st.style.width = Math.round(w) + 'px'; st.style.height = Math.round(h) + 'px';
    st.style.setProperty('--u', (w / W) + 'px');
  }
  addEventListener('resize', fit); fit();

  function dyingStep() { for (const p of g.parts) { p.x += p.vx * STEP; p.y += p.vy * STEP; p.vx *= 0.97; p.vy *= 0.97; p.l -= STEP; } g.parts = g.parts.filter(p => p.l > 0); if (g.flash > 0) g.flash -= STEP; if (g.shake > 0) g.shake -= STEP; }
  // ---------- Laço principal (passo fixo de 1/60 s) ----------
  let last = performance.now(), acc = 0;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (mode === 'play' || mode === 'dying') {
      acc += dt;
      while (acc >= STEP) { if (mode === 'play') update(STEP); else { dyingStep(); } acc -= STEP; }
      renderPlay();
    } else if (g && (mode === 'pause' || mode === 'clear' || mode === 'over' || ((mode === 'album' || mode === 'trade') && nav[0] && nav[0] !== 'title'))) {
      renderPlay();
    } else renderTitle(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  syncMute(); setMode('title');

  // ---------- PWA ----------
  let deferred = null;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#bInstall').hidden = false; });
  $('#bInstall').onclick = async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $('#bInstall').hidden = true; };
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });

  // ---------- Modo de captura/teste (?shot=...) ----------
  // avança o jogo N segundos de forma síncrona (testes automatizados e capturas)
  function simulate(sec) { for (let i = 0; i < sec * 60; i++) { if (mode === 'play') update(STEP); else if (mode === 'dying') dyingStep(); } renderPlay(); }
  window.CC = { get g() { return g; }, get mode() { return mode; }, act, save, simulate, keys, set autopilot(v) { autopilot = v; } };
  if (SHOT) {
    const fill = (n) => { const R = A.mulberry32(42); A.PLANETS.forEach(p => { if (R() < n) save.album[p.id] = 1 + (R() < 0.45 ? 1 + ((R() * 3) | 0) : 0); }); save.best = 12840; };
    if (SHOT === 'album' || SHOT === 'trade' || SHOT === 'title') fill(0.62);
    if (SHOT === 'title') setMode('title');
    if (SHOT === 'album') act('album');
    if (SHOT === 'trade') act('trade');
    if (SHOT === 'detail') { fill(0.62); save.album[22] = 2; act('album'); openDetail(A.PLANETS[21]); }
    if (['play', 'pause', 'clear', 'over'].includes(SHOT)) {
      fill(0.3); act('play'); autopilot = true;
      simulate(+(Q.get('sim') || 6));
      if (SHOT === 'pause') pause();
      if (SHOT === 'clear') { g.t = g.dur; simulate(2); }
      if (SHOT === 'over') { g.lives = 1; g.ship.inv = 0; g.pw.S = 0; hurt(); simulate(0.6); setMode('over'); }
    }
  }
})();

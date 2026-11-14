/* Coleção Cósmica · arte gerada por código (fonte bitmap, sprites, planetas)
   Tudo original: nenhuma imagem externa. */
(function (G) {
  'use strict';

  // ---------- RNG e ruído ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash3(x, y, z, s) {
    let h = (x * 374761393 + y * 668265263 + z * 2147483647 + s * 1442695041) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  const sm = t => t * t * (3 - 2 * t);
  function noise3(x, y, z, s) {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    const fx = sm(x - ix), fy = sm(y - iy), fz = sm(z - iz);
    const l = (a, b, t) => a + (b - a) * t;
    const c = (dx, dy, dz) => hash3(ix + dx, iy + dy, iz + dz, s);
    return l(
      l(l(c(0, 0, 0), c(1, 0, 0), fx), l(c(0, 1, 0), c(1, 1, 0), fx), fy),
      l(l(c(0, 0, 1), c(1, 0, 1), fx), l(c(0, 1, 1), c(1, 1, 1), fx), fy), fz);
  }
  function fbm(x, y, z, s) {
    return noise3(x, y, z, s) * 0.55 + noise3(x * 2.1, y * 2.1, z * 2.1, s + 7) * 0.3 + noise3(x * 4.3, y * 4.3, z * 4.3, s + 13) * 0.15;
  }
  function hsl(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360; s /= 100; l /= 100;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    return [Math.round(f(h + 1 / 3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1 / 3) * 255)];
  }

  // ---------- Fonte bitmap 5 linhas (própria) ----------
  const F = {
    A: '.##.|#..#|####|#..#|#..#', B: '###.|#..#|###.|#..#|###.', C: '.###|#...|#...|#...|.###',
    D: '###.|#..#|#..#|#..#|###.', E: '####|#...|###.|#...|####', F: '####|#...|###.|#...|#...',
    G: '.###|#...|#.##|#..#|.###', H: '#..#|#..#|####|#..#|#..#', I: '###|.#.|.#.|.#.|###',
    J: '..##|...#|...#|#..#|.##.', K: '#..#|#.#.|##..|#.#.|#..#', L: '#...|#...|#...|#...|####',
    M: '#...#|##.##|#.#.#|#...#|#...#', N: '#..#|##.#|#.##|#..#|#..#', O: '.##.|#..#|#..#|#..#|.##.',
    P: '###.|#..#|###.|#...|#...', Q: '.##.|#..#|#..#|#.#.|.#.#', R: '###.|#..#|###.|#.#.|#..#',
    S: '.###|#...|.##.|...#|###.', T: '###|.#.|.#.|.#.|.#.', U: '#..#|#..#|#..#|#..#|.##.',
    V: '#...#|#...#|.#.#.|.#.#.|..#..', W: '#...#|#...#|#.#.#|##.##|#...#', X: '#..#|#..#|.##.|#..#|#..#',
    Y: '#.#|#.#|.#.|.#.|.#.', Z: '####|...#|.##.|#...|####',
    0: '.##.|#.##|##.#|#..#|.##.', 1: '.#.|##.|.#.|.#.|###', 2: '###.|...#|.##.|#...|####',
    3: '###.|...#|.##.|...#|###.', 4: '#..#|#..#|####|...#|...#', 5: '####|#...|###.|...#|###.',
    6: '.##.|#...|###.|#..#|.##.', 7: '####|...#|..#.|.#..|.#..', 8: '.##.|#..#|.##.|#..#|.##.',
    9: '.##.|#..#|.###|...#|.##.', ' ': '..|..|..|..|..', ':': '.|#|.|#|.', '.': '.|.|.|.|#',
    '!': '#|#|#|.|#', '-': '...|...|###|...|...', '/': '..#|..#|.#.|#..|#..', '+': '...|.#.|###|.#.|...',
    '?': '###|..#|.##|...|.#.', '#': '.#.#.|#####|.#.#.|#####|.#.#.', '%': '#..#|..#.|.#..|#..#|....',
    "'": '#|#|.|.|.', ',': '.|.|.|#|#', '(': '.#|#.|#.|#.|.#', ')': '#.|.#|.#|.#|#.', '*': '...|#.#|.#.|#.#|...'
  };
  const GL = {};
  for (const k in F) GL[k] = F[k].split('|');
  function norm(t) { return String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase(); }
  function textW(t, sc) { sc = sc || 1; let w = 0; for (const ch of norm(t)) { const g = GL[ch] || GL['?']; w += (g[0].length + 1) * sc; } return Math.max(0, w - sc); }
  function text(ctx, t, x, y, col, sc, align, shadow) {
    sc = sc || 1; t = norm(t);
    let w = textW(t, sc);
    if (align === 'center') x -= Math.round(w / 2); else if (align === 'right') x -= w;
    x = Math.round(x); y = Math.round(y);
    const draw = (ox, oy, c) => {
      ctx.fillStyle = c; let cx = x + ox;
      for (const ch of t) {
        const g = GL[ch] || GL['?'];
        for (let r = 0; r < 5; r++) for (let i = 0; i < g[r].length; i++) if (g[r][i] === '#') ctx.fillRect(cx + i * sc, y + oy + r * sc, sc, sc);
        cx += (g[0].length + 1) * sc;
      }
    };
    if (shadow) draw(sc, sc, shadow);
    draw(0, 0, col);
    return w;
  }

  // ---------- Sprites em pixel art (string -> canvas) ----------
  function sprite(rows, pal, scale) {
    scale = scale || 1;
    const c = document.createElement('canvas');
    c.width = rows[0].length * scale; c.height = rows.length * scale;
    const x = c.getContext('2d');
    rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const p = pal[r[i]]; if (p) { x.fillStyle = p; x.fillRect(i * scale, j * scale, scale, scale); } } });
    return c;
  }
  // Nave "Faísca": desenho próprio, 13x14
  const SHIP = [
    '......w......',
    '.....wcw.....',
    '.....cbc.....',
    '....cbBbc....',
    '....cbBbc....',
    '...ocbBbco...',
    '..o.cbbbc.o..',
    '.oo.cwcwc.oo.',
    'ooo.ccccc.ooo',
    'oodcccccccdoo',
    'odd.ddddd.ddo',
    'od...d.d...do',
    '.....r.r.....',
    '.....y.y.....'
  ];
  const SHIP_PAL = { w: '#fff7e0', c: '#e9ecf5', b: '#2fd6ff', B: '#a8f3ff', o: '#ff7a59', d: '#8a93b8', r: '#ff5a3c', y: '#ffd166' };
  const DRONE = [
    '...gggg...',
    '..gGGGGg..',
    '.gGkkkkGg.',
    'gmmmmmmmmg',
    'mMmMmMmMmm',
    '.m.m..m.m.',
    '..p....p..'
  ];
  const DRONE_PAL = { g: '#6e5aa8', G: '#a993f0', k: '#ff4f8b', m: '#3c3463', M: '#ffd166', p: '#ff4f8b' };

  // Rocha procedural
  function rock(r, seed) {
    const s = r * 2 + 2, c = document.createElement('canvas'); c.width = c.height = s;
    const x = c.getContext('2d'), img = x.createImageData(s, s), R = mulberry32(seed);
    const bumps = []; for (let i = 0; i < 8; i++) bumps.push(0.78 + R() * 0.22);
    const pal = [[46, 40, 58], [86, 74, 92], [128, 108, 118], [172, 150, 148]];
    const craters = []; for (let i = 0; i < 3; i++) craters.push([(R() - 0.5) * r, (R() - 0.5) * r, 1 + R() * r * 0.3]);
    for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) {
      const dx = i - s / 2 + 0.5, dy = j - s / 2 + 0.5, d = Math.hypot(dx, dy);
      const a = (Math.atan2(dy, dx) / (Math.PI * 2) + 1) * 8, ai = Math.floor(a) % 8, t = a - Math.floor(a);
      const rr = r * (bumps[ai] * (1 - t) + bumps[(ai + 1) % 8] * t);
      if (d > rr) continue;
      let L = (-dx - dy) / (rr * 1.6) + 0.45 + (noise3(i * 0.5, j * 0.5, 0, seed) - 0.5) * 0.4;
      for (const cr of craters) { const cd = Math.hypot(dx - cr[0], dy - cr[1]); if (cd < cr[2]) L -= 0.35; else if (cd < cr[2] + 1) L += 0.15; }
      if (d > rr - 1.2) L -= 0.25;
      const k = Math.max(0, Math.min(3, Math.floor(L * 4)));
      const o = (j * s + i) * 4; img.data[o] = pal[k][0]; img.data[o + 1] = pal[k][1]; img.data[o + 2] = pal[k][2]; img.data[o + 3] = 255;
    }
    x.putImageData(img, 0, 0); return c;
  }

  // ---------- Planetas (álbum) ----------
  // tipo: gas | rock | ice | lava | crystal ; raridade: 0 comum, 1 rara, 2 lendária
  const PLANETS = [
    ['Ferrugem', 'rock', 18, 32, 0, 0, 'Ventos de poeira cor de tijolo sopram o ano inteiro.'],
    ['Ondina', 'rock', 200, 120, 0, 0, 'Um oceano só, com ilhas que mudam de lugar.'],
    ['Pétala', 'gas', 330, 20, 0, 0, 'Nuvens rosadas em faixas finas como papel.'],
    ['Cobalto', 'gas', 222, 260, 0, 0, 'Azul tão escuro que some no céu noturno.'],
    ['Musgo', 'rock', 100, 60, 0, 0, 'Coberto por um tapete verde que brilha no escuro.'],
    ['Areia Alta', 'rock', 40, 28, 0, 0, 'Dunas de três quilômetros de altura.'],
    ['Brasa', 'lava', 12, 40, 0, 0, 'Rios de lava desenham mapas novos toda semana.'],
    ['Gelo Fino', 'ice', 190, 210, 0, 0, 'A crosta é tão fina que dá para ver o mar por baixo.'],
    ['Lavanda', 'gas', 270, 300, 0, 0, 'Tempestades lilases que duram séculos.'],
    ['Coral', 'gas', 8, 30, 1, 0, 'Um anel de cristais de gelo cor de salmão.'],
    ['Âmbar', 'gas', 38, 22, 0, 0, 'Atmosfera densa e dourada como mel.'],
    ['Granito', 'rock', 30, 210, 0, 0, 'Montanhas cinzentas e nenhuma nuvem.'],
    ['Neblina', 'ice', 210, 180, 0, 0, 'Vive escondido sob uma névoa branca.'],
    ['Jade', 'rock', 150, 170, 0, 0, 'Vales verdes cortados por rios de vidro.'],
    ['Safira', 'ice', 215, 250, 1, 1, 'Gelo azul que canta quando o vento passa.'],
    ['Cobre Velho', 'rock', 24, 160, 1, 1, 'Anéis de poeira metálica giram ao contrário.'],
    ['Aurora', 'gas', 160, 290, 0, 1, 'Faixas verdes e roxas que se movem como cortina.'],
    ['Ônix', 'lava', 280, 20, 0, 1, 'Negro por fora, com veias de luz violeta.'],
    ['Maré Dupla', 'rock', 190, 40, 1, 1, 'Duas luas puxam o mar em direções opostas.'],
    ['Cereja', 'gas', 350, 300, 1, 1, 'O planeta-anel mais vermelho do setor.'],
    ['Vidro Verde', 'crystal', 140, 190, 0, 1, 'Facetas lisas refletem a estrela como espelho.'],
    ['Coroa de Vidro', 'crystal', 48, 200, 1, 2, 'Lendária: um diamante do tamanho de um mundo.'],
    ['Olho Rubro', 'lava', 0, 45, 1, 2, 'Lendária: um olho de fogo que nunca pisca.'],
    ['Último Farol', 'ice', 180, 50, 1, 2, 'Lendária: brilha sozinho no fim do mapa estelar.']
  ].map((p, i) => ({ id: i + 1, name: p[0], type: p[1], h1: p[2], h2: p[3], ring: !!p[4], rar: p[5], fact: p[6], seed: 1000 + i * 97 }));
  const RAR = [
    { nome: 'Comum', cor: '#c9d1e8', cor2: '#7c86a8' },
    { nome: 'Rara', cor: '#4fe3ff', cor2: '#1d7fd1' },
    { nome: 'Lendária', cor: '#ffd166', cor2: '#ff8a3d' }
  ];

  const LV = (() => { const a = -0.55, b = -0.6, c = 0.58, n = Math.hypot(a, b, c); return [a / n, b / n, c / n]; })();
  const BAYER = [0, 0.5, 0.75, 0.25];
  function planetPixels(p, size, rot, out) {
    const c = out || document.createElement('canvas'); c.width = c.height = size;
    const x = c.getContext('2d'), img = x.createImageData(size, size), D = img.data;
    const R = (p.ring ? 0.33 : 0.44) * size, cx = size / 2, cy = size / 2;
    const A = [hsl(p.h1, 55, 14), hsl(p.h1, 60, 30), hsl(p.h1, 65, 48), hsl(p.h1, 70, 66), hsl(p.h1, 60, 84)];
    const B = [hsl(p.h2, 45, 14), hsl(p.h2, 55, 28), hsl(p.h2, 60, 44), hsl(p.h2, 70, 62), hsl(p.h2, 60, 82)];
    const ringC = [hsl(p.h2, 40, 30), hsl(p.h2, 55, 55), hsl(p.h2, 60, 75)];
    const cr = Math.cos(rot), sr = Math.sin(rot), tilt = 0.32;
    const put = (i, j, col) => { const o = (j * size + i) * 4; D[o] = col[0]; D[o + 1] = col[1]; D[o + 2] = col[2]; D[o + 3] = 255; };
    for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
      const dx = (i + 0.5 - cx) / R, dy = (j + 0.5 - cy) / R, d2 = dx * dx + dy * dy;
      // anel (elipse inclinada)
      let ringHit = false, ringK = 0;
      if (p.ring) {
        const ex = dx, ey = dy / tilt, rr = Math.sqrt(ex * ex + ey * ey);
        if (rr > 1.25 && rr < 1.85 && !(rr > 1.5 && rr < 1.58)) { ringHit = true; ringK = rr < 1.5 ? 1 : 2; if (dx > 0.6) ringK = 0; }
      }
      const front = ringHit && dy > 0;
      if (d2 > 1) { if (ringHit) put(i, j, ringC[ringK]); continue; }
      if (front) { put(i, j, ringC[ringK]); continue; }
      const z = Math.sqrt(1 - d2);
      let L = dx * LV[0] + dy * LV[1] + z * LV[2];
      const X = dx * cr + z * sr, Z = -dx * sr + z * cr, Y = dy;
      let pat = 0, emis = null, pal = A;
      if (p.type === 'gas') {
        pat = 0.5 + 0.5 * Math.sin(Y * 9 + fbm(X * 2, Y * 2, Z * 2, p.seed) * 5);
        pal = pat > 0.55 ? B : A;
        L += (pat - 0.5) * 0.25;
      } else if (p.type === 'rock') {
        pat = fbm(X * 1.8 + 3, Y * 1.8, Z * 1.8, p.seed);
        pal = pat > 0.52 ? B : A; if (pat > 0.52) L += 0.06;
      } else if (p.type === 'ice') {
        pat = fbm(X * 2.4, Y * 2.4, Z * 2.4, p.seed);
        pal = pat > 0.58 ? B : A; L += 0.12;
        if (Math.abs(Y) > 0.72) { pal = B; L += 0.35; }
      } else if (p.type === 'lava') {
        pat = fbm(X * 2.2, Y * 2.2, Z * 2.2, p.seed);
        pal = A; L = L * 0.5 - 0.05;
        if (Math.abs(pat - 0.5) < 0.045) emis = hsl(p.h2, 100, 60 + (0.045 - Math.abs(pat - 0.5)) * 500);
      } else if (p.type === 'crystal') {
        const f = Math.floor(Math.atan2(X, Z) * 2.2) + Math.floor(Y * 3) * 7;
        L = L * 0.7 + hash3(f, 3, 1, p.seed) * 0.5;
        pal = (f & 1) ? A : B;
      }
      // dither ordenado
      let v = Math.max(0, Math.min(0.999, L)) * 4.2 + BAYER[(i & 1) + (j & 1) * 2] * 0.6 - 0.3;
      const k = Math.max(0, Math.min(4, Math.floor(v)));
      put(i, j, emis || pal[k]);
    }
    x.putImageData(img, 0, 0); return c;
  }
  const pCache = {};
  function planetCanvas(p, size) { const k = p.id + ':' + size; return pCache[k] || (pCache[k] = planetPixels(p, size, p.seed * 0.37)); }

  // Card pequeno (figurinha caindo no jogo)
  function cardSprite(rar) {
    const col = RAR[rar].cor, col2 = RAR[rar].cor2;
    return sprite([
      '.kkkkkkk.',
      'kwwwwwwwk',
      'kwbbbbbwk',
      'kwbppbbwk',
      'kwbpppbwk',
      'kwbbppbwk',
      'kwbbbbbwk',
      'kwwwwwwwk',
      'kwlllllwk',
      'kwwwwwwwk',
      '.kkkkkkk.'
    ], { k: col2, w: col, b: '#1a1838', p: rar === 2 ? '#ffd166' : rar === 1 ? '#4fe3ff' : '#ff9a6b', l: '#1a1838' });
  }

  G.CCArt = { mulberry32, noise3, hsl, text, textW, norm, sprite, SHIP, SHIP_PAL, DRONE, DRONE_PAL, rock, PLANETS, RAR, planetPixels, planetCanvas, cardSprite };
})(window);

/* Alba Studio: ilustrações SVG das peças (desenho próprio, viewBox 400x500). */
(function () {
  let uid = 0;

  function hex2rgb(h) {
    h = h.replace('#', '');
    return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16));
  }
  function rgb2hex(r) {
    return '#' + r.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }
  function shade(h, p) {
    const c = hex2rgb(h);
    return rgb2hex(c.map((v) => (p < 0 ? v * (1 + p) : v + (255 - v) * p)));
  }
  function lum(h) {
    const [r, g, b] = hex2rgb(h);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }

  // Cada peça: corpo (silhueta), detalhes de frente e de costas, enquadramento do detalhe e tipo de cabide.
  const G = {
    camiseta: {
      body: 'M150 62 Q200 84 250 62 L318 84 L362 160 L314 184 L292 150 L294 446 Q200 456 106 446 L108 150 L86 184 L38 160 L82 84 Z',
      top: 66, hanger: 'top', det: '110 30 180 225',
      front: (c) => `<path d="M156 64 Q200 98 244 64 Q200 80 156 64Z" fill="${c.inner}"/>
        <path d="M150 62 Q200 106 250 62" fill="none" stroke="${c.line}" stroke-width="7" stroke-opacity=".55"/>
        <path d="M44 150 L92 174 M356 150 L308 174" stroke="${c.line}" stroke-width="1.4" stroke-dasharray="3 3"/>
        <path d="M107 432 Q200 442 293 432" fill="none" stroke="${c.line}" stroke-width="1.4" stroke-dasharray="3 3"/>`,
      back: (c) => `<path d="M150 62 Q200 76 250 62" fill="none" stroke="${c.line}" stroke-width="6" stroke-opacity=".5"/>
        <path d="M44 150 L92 174 M356 150 L308 174" stroke="${c.line}" stroke-width="1.4" stroke-dasharray="3 3"/>
        <path d="M107 432 Q200 442 293 432" fill="none" stroke="${c.line}" stroke-width="1.4" stroke-dasharray="3 3"/>`,
    },
    camisa: {
      body: 'M152 58 L248 58 L318 84 Q340 100 346 150 L374 398 L334 406 L306 196 L306 444 Q200 458 94 444 L94 196 L66 406 L26 398 L54 150 Q60 100 82 84 Z',
      top: 62, hanger: 'top', det: '110 34 180 225',
      front: (c) => `<path d="M152 58 Q200 70 248 58 L200 102 Z" fill="${c.inner}"/>
        <path d="M193 102 L193 450 M207 102 L207 450" stroke="${c.line}" stroke-width="1.2" stroke-opacity=".7"/>
        ${[150, 200, 250, 300, 350, 400].map((y) => `<circle cx="200" cy="${y}" r="5" fill="${c.btn}" stroke="${c.line}" stroke-width="1"/>`).join('')}
        <path d="M118 158 h54 v56 q-27 9 -54 0 Z" fill="${c.base}" stroke="${c.line}" stroke-width="1.3"/>
        <path d="M118 166 h54" stroke="${c.line}" stroke-width="1" stroke-dasharray="3 3"/>
        <path d="M152 58 L200 102 L176 128 L138 68 Z" fill="${c.base}" stroke="${c.line}" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M248 58 L200 102 L224 128 L262 68 Z" fill="${c.base}" stroke="${c.line}" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M31 366 L69 374 M369 366 L331 374" stroke="${c.line}" stroke-width="1.5"/>`,
      back: (c) => `<path d="M152 58 Q200 76 248 58" fill="none" stroke="${c.line}" stroke-width="7" stroke-opacity=".45"/>
        <path d="M80 112 Q200 128 320 112" fill="none" stroke="${c.line}" stroke-width="1.4"/>
        <path d="M190 124 L190 176 M210 124 L210 176" stroke="${c.line}" stroke-width="1.1" stroke-opacity=".7"/>
        <path d="M31 366 L69 374 M369 366 L331 374" stroke="${c.line}" stroke-width="1.5"/>`,
    },
    vestido: {
      body: 'M150 90 Q176 84 200 112 Q224 84 250 90 Q258 140 256 160 Q254 186 244 206 Q300 320 346 456 Q200 482 54 456 Q100 320 156 206 Q146 186 144 160 Q142 140 150 90 Z',
      top: 34, hanger: 'top', det: '110 16 180 225', straps: true,
      front: (c) => `<path d="M156 206 Q200 216 244 206" fill="none" stroke="${c.line}" stroke-width="2"/>
        <path d="M182 216 Q170 330 136 468 M218 216 Q230 330 264 468" fill="none" stroke="${c.line}" stroke-width="1.2" stroke-opacity=".55"/>
        <path d="M200 218 L200 474" stroke="${c.hi}" stroke-width="10" stroke-opacity=".12"/>
        <path d="M164 140 Q172 156 176 176 M236 140 Q228 156 224 176" fill="none" stroke="${c.line}" stroke-width="1.1" stroke-opacity=".6"/>`,
      back: (c) => `<path d="M156 206 Q200 216 244 206" fill="none" stroke="${c.line}" stroke-width="2"/>
        <path d="M200 96 L200 262" stroke="${c.line}" stroke-width="1.4" stroke-dasharray="2 3"/>
        <path d="M182 216 Q170 330 136 468 M218 216 Q230 330 264 468" fill="none" stroke="${c.line}" stroke-width="1.2" stroke-opacity=".55"/>`,
    },
    calca: {
      body: 'M122 46 L278 46 L300 458 L218 464 L203 170 L197 170 L182 464 L100 458 Z',
      top: 46, hanger: 'clip', det: '106 28 188 235',
      front: (c) => `<path d="M122 46 L278 46 L279 74 L121 74 Z" fill="${c.dark}" fill-opacity=".35" stroke="${c.line}" stroke-width="1.2"/>
        ${[142, 200, 258].map((x) => `<rect x="${x - 3}" y="42" width="6" height="36" rx="2" fill="${c.base}" stroke="${c.line}" stroke-width="1"/>`).join('')}
        <circle cx="200" cy="60" r="4.5" fill="${c.btn}" stroke="${c.line}"/>
        <path d="M206 74 L206 146 Q206 160 194 164" fill="none" stroke="${c.line}" stroke-width="1.3" stroke-dasharray="3 3"/>
        <path d="M128 82 Q162 92 168 74 M272 82 Q238 92 232 74" fill="none" stroke="${c.line}" stroke-width="1.5"/>
        <path d="M150 92 L141 458 M250 92 L259 458" stroke="${c.line}" stroke-width="1.2" stroke-opacity=".5"/>
        <path d="M176 74 L178 116 M224 74 L222 116" stroke="${c.line}" stroke-width="1.2"/>
        <path d="M101 446 L181 452 M299 446 L219 452" stroke="${c.line}" stroke-width="1.2" stroke-dasharray="3 3"/>`,
      back: (c) => `<path d="M122 46 L278 46 L279 74 L121 74 Z" fill="${c.dark}" fill-opacity=".35" stroke="${c.line}" stroke-width="1.2"/>
        <path d="M200 74 L200 168" stroke="${c.line}" stroke-width="1.3"/>
        <path d="M138 112 h46 M216 112 h46" stroke="${c.line}" stroke-width="3" stroke-linecap="round"/>
        <path d="M150 92 L141 458 M250 92 L259 458" stroke="${c.line}" stroke-width="1.2" stroke-opacity=".5"/>`,
    },
    saia: {
      body: 'M138 64 L262 64 Q300 250 334 454 Q200 474 66 454 Q100 250 138 64 Z',
      top: 64, hanger: 'clip', det: '100 50 200 250',
      front: (c) => pleats(c) + `<path d="M138 64 L262 64 L264 92 L136 92 Z" fill="${c.base}" stroke="${c.line}" stroke-width="1.3"/>`,
      back: (c) => pleats(c) + `<path d="M138 64 L262 64 L264 92 L136 92 Z" fill="${c.base}" stroke="${c.line}" stroke-width="1.3"/>
        <path d="M150 70 Q200 80 250 70" fill="none" stroke="${c.line}" stroke-width="1" stroke-dasharray="2 2"/>`,
    },
    jaqueta: {
      body: 'M150 56 L250 56 L326 86 Q350 104 354 160 L380 392 L336 402 L310 210 L312 404 Q200 416 88 404 L90 210 L64 402 L20 392 L46 160 Q50 104 74 86 Z',
      top: 60, hanger: 'top', det: '100 36 200 250',
      front: (c) => `<path d="M150 56 Q200 70 250 56 L200 90 Z" fill="${c.inner}"/>
        <path d="M200 90 L200 404" stroke="${c.line}" stroke-width="2"/>
        ${[150, 210, 270, 330].map((y) => `<circle cx="210" cy="${y}" r="4.5" fill="${c.btn}" stroke="${c.line}"/>`).join('')}
        <path d="M118 170 h58 v62 h-58 Z M224 170 h58 v62 h-58 Z" fill="${c.base}" stroke="${c.line}" stroke-width="1.3"/>
        <path d="M114 162 h66 v24 h-66 Z M220 162 h66 v24 h-66 Z" fill="${c.base}" stroke="${c.line}" stroke-width="1.3"/>
        <circle cx="147" cy="178" r="3.5" fill="${c.btn}"/><circle cx="253" cy="178" r="3.5" fill="${c.btn}"/>
        <path d="M89 380 Q200 394 311 380" fill="none" stroke="${c.line}" stroke-width="1.4"/>
        <path d="M150 56 L200 90 L168 134 L118 74 Z" fill="${c.base}" stroke="${c.line}" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M250 56 L200 90 L232 134 L282 74 Z" fill="${c.base}" stroke="${c.line}" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M28 362 L66 370 M372 362 L334 370" stroke="${c.line}" stroke-width="1.5"/>`,
      back: (c) => `<path d="M150 56 Q200 76 250 56" fill="none" stroke="${c.line}" stroke-width="9" stroke-opacity=".4"/>
        <path d="M76 124 Q200 144 324 124" fill="none" stroke="${c.line}" stroke-width="1.4"/>
        <path d="M89 380 Q200 394 311 380" fill="none" stroke="${c.line}" stroke-width="1.4"/>
        <path d="M28 362 L66 370 M372 362 L334 370" stroke="${c.line}" stroke-width="1.5"/>`,
    },
    blazer: {
      body: 'M146 56 L254 56 L330 82 Q352 96 354 150 L378 412 L336 420 L312 200 Q318 330 314 446 Q200 456 86 446 Q82 330 88 200 L64 420 L22 412 L46 150 Q48 96 70 82 Z',
      top: 60, hanger: 'top', det: '100 36 200 250',
      front: (c) => `<path d="M150 56 Q200 66 250 56 L228 80 L200 256 L172 80 Z" fill="#EDE8DF"/>
        <path d="M168 60 Q200 76 232 60" fill="none" stroke="#cfc7b8" stroke-width="3"/>
        <path d="M200 256 L200 404 Q198 432 176 450" fill="none" stroke="${c.line}" stroke-width="1.6"/>
        <circle cx="208" cy="300" r="5.5" fill="${c.btn}" stroke="${c.line}"/><circle cx="208" cy="352" r="5.5" fill="${c.btn}" stroke="${c.line}"/>
        <path d="M106 330 h62 M232 330 h62" stroke="${c.line}" stroke-width="3" stroke-linecap="round"/>
        <path d="M238 182 h42" stroke="${c.line}" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M150 56 L122 100 L142 112 L130 130 L200 258 L172 80 Z" fill="${c.base}" stroke="${c.line}" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M250 56 L278 100 L258 112 L270 130 L200 258 L228 80 Z" fill="${c.base}" stroke="${c.line}" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M30 382 L68 390 M370 382 L332 390" stroke="${c.line}" stroke-width="1.3"/>`,
      back: (c) => `<path d="M146 56 Q200 72 254 56" fill="none" stroke="${c.line}" stroke-width="8" stroke-opacity=".45"/>
        <path d="M200 72 L200 446" stroke="${c.line}" stroke-width="1.4"/>
        <path d="M200 380 L212 446" stroke="${c.line}" stroke-width="1.2"/>`,
    },
    trico: {
      body: 'M148 64 Q200 82 252 64 L322 88 Q344 104 348 150 L372 398 L332 406 L306 196 L306 446 Q200 456 94 446 L94 196 L68 406 L28 398 L52 150 Q56 104 78 88 Z',
      top: 66, hanger: 'top', det: '110 34 180 225',
      front: (c) => `<path d="M154 66 Q200 98 246 66 Q200 82 154 66Z" fill="${c.inner}"/>
        <path d="M148 64 Q200 112 252 64" fill="none" stroke="${c.line}" stroke-width="10" stroke-opacity=".35"/>
        <path d="M148 64 Q200 112 252 64" fill="none" stroke="${c.line}" stroke-width="1.2"/>` + rib(c),
      back: (c) => `<path d="M148 64 Q200 80 252 64" fill="none" stroke="${c.line}" stroke-width="9" stroke-opacity=".35"/>` + rib(c),
    },
    bolsa: {
      body: 'M104 176 L296 176 L318 444 Q318 452 310 452 L90 452 Q82 452 82 444 Z',
      top: 176, hanger: 'none', det: '110 60 180 225', handles: true,
      front: (c) => `<path d="M104 176 L296 176 L298 204 L102 204 Z" fill="${c.dark}" fill-opacity=".3"/>
        <path d="M112 212 L290 212 M96 438 L304 438" stroke="${c.hi}" stroke-opacity=".45" stroke-width="1.2" stroke-dasharray="4 3"/>
        <rect x="184" y="196" width="32" height="40" rx="4" fill="${c.base}" stroke="${c.line}" stroke-width="1.3"/>
        <circle cx="200" cy="224" r="6" fill="#C9A86A" stroke="#9c7f47"/>`,
      back: (c) => `<path d="M104 176 L296 176 L298 204 L102 204 Z" fill="${c.dark}" fill-opacity=".3"/>
        <path d="M120 250 L280 250 L286 380 L114 380 Z" fill="none" stroke="${c.line}" stroke-width="1.4"/>
        <path d="M112 212 L290 212 M96 438 L304 438" stroke="${c.hi}" stroke-opacity=".45" stroke-width="1.2" stroke-dasharray="4 3"/>`,
    },
    'bolsa-mini': {
      body: 'M88 230 Q88 206 112 206 L288 206 Q312 206 312 230 L312 322 Q312 344 288 344 L112 344 Q88 344 88 322 Z',
      top: 206, hanger: 'none', det: '100 150 200 250', strap: true,
      front: (c) => `<path d="M88 230 Q88 206 112 206 L288 206 Q312 206 312 230 L312 272 Q200 304 88 272 Z" fill="${c.base}" stroke="${c.line}" stroke-width="1.5"/>
        <path d="M98 266 Q200 294 302 266" fill="none" stroke="${c.hi}" stroke-opacity=".5" stroke-width="1.2" stroke-dasharray="4 3"/>
        <rect x="186" y="272" width="28" height="18" rx="4" fill="#C9A86A" stroke="#9c7f47"/>`,
      back: (c) => `<path d="M100 318 L300 318" stroke="${c.hi}" stroke-opacity=".5" stroke-width="1.2" stroke-dasharray="4 3"/>
        <path d="M110 232 L290 232 L290 300 L110 300 Z" fill="none" stroke="${c.line}" stroke-width="1.3"/>`,
    },
  };

  function pleats(c) {
    let s = '';
    for (let i = 0; i <= 10; i++) {
      const x1 = 140 + i * 12, x2 = 70 + i * 26.4;
      s += `<path d="M${x1} 92 L${x2} 460" stroke="${i % 2 ? c.hi : c.line}" stroke-width="${i % 2 ? 2 : 1.2}" stroke-opacity="${i % 2 ? 0.28 : 0.7}"/>`;
    }
    return s;
  }
  function rib(c) {
    let s = '';
    for (let x = 100; x <= 300; x += 7) s += `M${x} 424 L${x} 448 `;
    s += 'M34 372 L38 398 M42 373 L46 400 M50 375 L54 401 M58 377 L62 403 ';
    s += 'M366 372 L362 398 M358 373 L354 400 M350 375 L346 401 M342 377 L338 403';
    return `<path d="M95 422 Q200 432 305 422" fill="none" stroke="${c.line}" stroke-width="1.4"/>
      <path d="M32 368 L70 376 M368 368 L330 376" stroke="${c.line}" stroke-width="1.4"/>
      <path d="${s}" stroke="${c.line}" stroke-width="1" stroke-opacity=".55"/>`;
  }

  function palette(base) {
    const l = lum(base);
    const darkBase = l < 0.22;
    return {
      base,
      line: darkBase ? shade(base, 0.22) : shade(base, -0.3),
      dark: shade(base, -0.35),
      inner: shade(base, darkBase ? 0.1 : -0.22),
      hi: '#ffffff',
      btn: darkBase ? shade(base, 0.35) : shade(base, l > 0.7 ? -0.08 : 0.4),
    };
  }

  function garment(tipo, cor, vista, tex, n) {
    const g = G[tipo];
    const c = palette(cor);
    const texFill = tex === 'linho' ? `url(#aL${n})` : tex === 'malha' ? `url(#aM${n})` : null;
    let s = '';
    if (g.straps) s += `<path d="M160 92 L170 26 M240 92 L230 26" stroke="${c.base}" stroke-width="7" stroke-linecap="round"/><path d="M160 92 L170 26 M240 92 L230 26" stroke="${c.line}" stroke-width="1" stroke-opacity=".5"/>`;
    if (g.handles) s += `<path d="M146 180 Q144 70 200 70 Q256 70 254 180" fill="none" stroke="${c.dark}" stroke-width="13" stroke-linecap="round"/><path d="M146 180 Q144 70 200 70 Q256 70 254 180" fill="none" stroke="${c.base}" stroke-width="7" stroke-linecap="round" stroke-opacity=".7"/>`;
    if (g.strap) s += `<path d="M104 214 Q110 40 200 40 Q290 40 296 214" fill="none" stroke="${c.dark}" stroke-width="6" stroke-linecap="round"/>`;
    s += `<path d="${g.body}" fill="${c.base}"/>`;
    if (texFill) s += `<path d="${g.body}" fill="${texFill}"/>`;
    s += `<path d="${g.body}" fill="url(#aS${n})"/><path d="${g.body}" fill="url(#aV${n})"/>`;
    s += vista === 'costas' ? g.back(c) : g.front(c);
    s += `<path d="${g.body}" fill="none" stroke="${c.line}" stroke-width="1.6" stroke-linejoin="round"/>`;
    return s;
  }

  function defs(n) {
    return `<defs>
      <linearGradient id="aS${n}" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset=".25" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".09"/><stop offset=".75" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>
      <linearGradient id="aV${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient>
      <pattern id="aL${n}" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 2.5h5M2.5 0v5" stroke="#000" stroke-opacity=".06" stroke-width=".8"/></pattern>
      <pattern id="aM${n}" width="9" height="11" patternUnits="userSpaceOnUse"><path d="M0 0l4.5 5.5L9 0M0 5.5l4.5 5.5L9 5.5" fill="none" stroke="#000" stroke-opacity=".09" stroke-width="1"/></pattern>
      <radialGradient id="aR${n}"><stop offset="0" stop-color="#000" stop-opacity=".2"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    </defs>`;
  }

  function hanger(g) {
    const y = g.top;
    if (g.hanger === 'top') {
      return `<path d="M200 ${y + 4} L200 ${y - 26} q0 -16 13 -16 q13 0 13 13" fill="none" stroke="#8d877d" stroke-width="4" stroke-linecap="round"/>
        <path d="M104 ${y + 34} L200 ${y} L296 ${y + 34}" fill="none" stroke="#8B6A4E" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    if (g.hanger === 'clip') {
      return `<path d="M200 ${y - 40} L200 ${y - 62} q0 -16 13 -16 q13 0 13 13" fill="none" stroke="#8d877d" stroke-width="4" stroke-linecap="round"/>
        <path d="M110 ${y - 38} H290" stroke="#8B6A4E" stroke-width="8" stroke-linecap="round"/>
        <rect x="128" y="${y - 38}" width="14" height="${46}" rx="2" fill="#6f6a62"/><rect x="258" y="${y - 38}" width="14" height="46" rx="2" fill="#6f6a62"/>`;
    }
    return '';
  }

  /**
   * pecaSVG(tipo, cor, { vista: 'frente'|'costas'|'detalhe'|'cena', fundo, textura })
   */
  function pecaSVG(tipo, cor, o) {
    o = o || {};
    const vista = o.vista || 'frente';
    const fundo = o.fundo || '#ECE7DF';
    const n = ++uid;
    const g = G[tipo] || G.camiseta;
    let vb = '0 0 400 500';
    let inner = `<rect x="-50" y="-50" width="500" height="600" fill="${fundo}"/>`;
    if (vista === 'cena') {
      const arch = shade(fundo, -0.07);
      inner += `<path d="M64 500 V214 A136 136 0 0 1 336 214 V500 Z" fill="${arch}"/>
        <rect x="0" y="452" width="400" height="48" fill="${shade(fundo, -0.04)}"/>`;
      if (g.hanger === 'none') inner += `<rect x="96" y="388" width="208" height="64" fill="${shade(fundo, 0.25)}"/><rect x="96" y="388" width="208" height="5" fill="${shade(fundo, 0.4)}"/>`;
      else inner += `<ellipse cx="200" cy="462" rx="110" ry="9" fill="url(#aR${n})"/>`;
      const ty = g.hanger === 'none' ? 72 : g.hanger === 'clip' ? 92 : 74;
      inner += `<g transform="translate(62 ${ty}) scale(.69)">${hanger(g)}${garment(tipo, cor, 'frente', o.textura, n)}</g>`;
    } else {
      if (vista === 'detalhe') vb = g.det;
      else inner += `<ellipse cx="200" cy="474" rx="160" ry="14" fill="url(#aR${n})"/>`;
      inner += garment(tipo, cor, vista === 'costas' ? 'costas' : 'frente', o.textura, n);
    }
    return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">${defs(n)}${inner}</svg>`;
  }

  window.pecaSVG = pecaSVG;
  window.albaShade = shade;
})();

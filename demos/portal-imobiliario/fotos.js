/* Ilustrações próprias em SVG para fachadas e cômodos (nenhuma foto de banco de imagem). */
(function () {
  const PAL = [
    { wall: '#efe4d2', wall2: '#d9c6a8', roof: '#9b4f34', acc: '#2f6f5e', sky: ['#9fc9e4', '#e8f1f4'], floor: '#b98a5c', fab: '#4f7a6b', soft: '#f6efe3' },
    { wall: '#dca889', wall2: '#c9bdb0', roof: '#4b5560', acc: '#c46b3c', sky: ['#a8c7e0', '#f2ecdf'], floor: '#a8784e', fab: '#c98a5b', soft: '#f3ede6' },
    { wall: '#cdd8c2', wall2: '#ddd0bf', roof: '#5e6b5a', acc: '#355e7e', sky: ['#b5d3e6', '#f1efe6'], floor: '#c79f74', fab: '#566f8f', soft: '#f7f2ea' },
    { wall: '#f4f1ec', wall2: '#cfc6ba', roof: '#3b3f45', acc: '#a8763e', sky: ['#8fbad8', '#e9eff0'], floor: '#9a6e46', fab: '#3f5d55', soft: '#f6f3ee' },
    { wall: '#ecc98c', wall2: '#e0bf98', roof: '#a3492f', acc: '#486a3e', sky: ['#a7cce3', '#f4ead9'], floor: '#b0834f', fab: '#9b5a3c', soft: '#f8ecdc' },
    { wall: '#b8c9d6', wall2: '#b9c4c1', roof: '#56606a', acc: '#b5653d', sky: ['#9cc0dc', '#eef0ea'], floor: '#a57b55', fab: '#6b5a8c', soft: '#eef1ef' },
    { wall: '#e9dfc9', wall2: '#cbb98f', roof: '#7a5c3a', acc: '#4c7a3f', sky: ['#a6cfe6', '#f3f0de'], floor: '#b38b5b', fab: '#6f7f4a', soft: '#f5f0e2' },
    { wall: '#69747d', wall2: '#bfc5ca', roof: '#2f3a44', acc: '#c9853d', sky: ['#93b8d6', '#eaeef0'], floor: '#8f6d50', fab: '#2f4f6a', soft: '#eef0f2' },
    { wall: '#e8c4b6', wall2: '#d8cbb9', roof: '#8c3f2a', acc: '#2a6576', sky: ['#88bde0', '#eef4f2'], floor: '#c09468', fab: '#2a6576', soft: '#faf6f0' },
    { wall: '#c6ddd4', wall2: '#d5bcab', roof: '#6a4a3c', acc: '#5d7b5a', sky: ['#a9c9e0', '#f3ebe4'], floor: '#a9805d', fab: '#b77a6a', soft: '#f6ece6' },
  ];
  let uid = 0;
  const pal = i => PAL[(i || 0) % PAL.length];
  const R = (s, n) => { const x = Math.sin((s + 1) * 127.1 + n * 311.7) * 43758.5; return x - Math.floor(x); };
  const wrap = (body, defs, lbl) => `<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${lbl}" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>${body}</svg>`;

  function sky(p, id, s) {
    return {
      defs: `<linearGradient id="sk${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky[0]}"/><stop offset="1" stop-color="${p.sky[1]}"/></linearGradient>`,
      body: `<rect width="800" height="500" fill="url(#sk${id})"/>
      <circle cx="${620 + R(s, 1) * 120}" cy="${70 + R(s, 2) * 30}" r="34" fill="#fff6dc" opacity=".9"/>
      ${cloud(120 + R(s, 3) * 80, 70 + R(s, 4) * 30, 1)}${cloud(400 + R(s, 5) * 120, 50 + R(s, 6) * 30, .7)}`
    };
  }
  function cloud(x, y, k) {
    return `<g fill="#fff" opacity=".85" transform="translate(${x} ${y}) scale(${k})"><ellipse cx="0" cy="0" rx="46" ry="16"/><ellipse cx="-22" cy="-8" rx="24" ry="16"/><ellipse cx="16" cy="-14" rx="28" ry="20"/></g>`;
  }
  function tree(x, y, k, c) {
    c = c || '#4f7d4a';
    return `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-5" y="-10" width="10" height="60" rx="3" fill="#6b4b33"/><circle cx="0" cy="-40" r="42" fill="${c}"/><circle cx="-26" cy="-20" r="28" fill="${c}" opacity=".9"/><circle cx="24" cy="-24" r="30" fill="${c}" opacity=".85"/><circle cx="-10" cy="-56" r="20" fill="#fff" opacity=".08"/></g>`;
  }
  function bush(x, y, w, c) {
    c = c || '#5f8f55';
    return `<g fill="${c}"><ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${w / 3.2}"/><ellipse cx="${x - w / 3}" cy="${y + 4}" rx="${w / 3}" ry="${w / 4}" opacity=".9"/><ellipse cx="${x + w / 3}" cy="${y + 3}" rx="${w / 3}" ry="${w / 4.2}" opacity=".85"/></g>`;
  }
  function win(x, y, w, h, p, curtain) {
    return `<g><rect x="${x - 5}" y="${y - 5}" width="${w + 10}" height="${h + 10}" rx="3" fill="#fff" opacity=".9"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#9fc3d8"/><path d="M${x} ${y + h * .65} L${x + w * .55} ${y} L${x + w} ${y}L${x + w} ${y + h * .2}L${x + w * .25} ${y + h}L${x} ${y + h}Z" fill="#fff" opacity=".22"/>
    <path d="M${x + w / 2} ${y}V${y + h}M${x} ${y + h / 2}H${x + w}" stroke="#fff" stroke-width="4"/>
    ${curtain ? `<rect x="${x - 2}" y="${y - 2}" width="${w * .22}" height="${h + 4}" fill="${p.acc}" opacity=".55"/>` : ''}</g>`;
  }
  function ground(p) {
    return `<rect y="420" width="800" height="80" fill="#8fb37a"/><rect y="438" width="800" height="62" fill="#c9c2b6"/><rect y="438" width="800" height="5" fill="#b0a898"/><path d="M0 470H800" stroke="#bdb5a8" stroke-width="2" stroke-dasharray="30 22"/>`;
  }

  /* ---------- Fachadas ---------- */
  function fachada(im) {
    const p = pal(im.pal), id = ++uid, s = im.pal;
    const sk = sky(p, id, s);
    let b = sk.body;
    const t = im.tipo;
    if (t === 'casa' && s % 3 === 2) {
      b += `<path d="M0 420 Q200 370 420 400 T800 385 V430 H0Z" fill="#a9c79a" opacity=".6"/>`;
      b += tree(80, 385, 1, '#5a8a50');
      b += `<rect x="170" y="230" width="300" height="200" fill="${p.wall}"/><rect x="470" y="280" width="190" height="150" fill="${p.wall2}"/>
      <rect x="158" y="218" width="324" height="16" fill="#3a3530"/><rect x="460" y="268" width="212" height="14" fill="#3a3530"/>
      <rect x="195" y="260" width="150" height="120" fill="#9fc3d8"/><path d="M195 340 L275 260 H315 L195 380Z" fill="#fff" opacity=".22"/><path d="M270 260V380M195 320H345" stroke="#3a3530" stroke-width="4"/>
      <g fill="#8a5a3a">${Array.from({ length: 8 }, (_, k) => `<rect x="${362 + k * 13}" y="250" width="8" height="180"/>`).join('')}</g>
      <rect x="495" y="305" width="140" height="125" fill="#d7d2c8"/><g stroke="#bfb8ab" stroke-width="3">${[0, 1, 2, 3, 4].map(k => `<path d="M495 ${325 + k * 22}H635"/>`).join('')}</g>
      <rect x="150" y="426" width="530" height="8" fill="#cfc6b8"/>`;
      b += bush(240, 428, 80) + bush(400, 430, 50, '#6c9a5c') + tree(720, 400, .9, '#4c7a45');
    } else if (t === 'casa') {
      b += `<path d="M0 420 Q200 360 420 400 T800 380 V430 H0Z" fill="#a9c79a" opacity=".6"/>`;
      b += tree(90, 380, 1.1, '#5a8a50');
      b += `<rect x="190" y="250" width="420" height="180" fill="${p.wall}"/><rect x="190" y="250" width="420" height="16" fill="#000" opacity=".06"/>
      <polygon points="160,262 400,140 640,262" fill="${p.roof}"/><polygon points="160,262 400,140 410,145 180,262" fill="#fff" opacity=".12"/>
      <rect x="160" y="258" width="480" height="10" fill="#000" opacity=".12"/>
      ${win(225, 300, 90, 70, p)}${win(485, 300, 90, 70, p)}
      <rect x="360" y="300" width="80" height="130" rx="4" fill="${p.acc}"/><circle cx="426" cy="370" r="4" fill="#f1d38a"/><rect x="368" y="310" width="64" height="40" rx="3" fill="#fff" opacity=".18"/>
      <rect x="345" y="424" width="110" height="10" fill="#cfc6b8"/>
      <circle cx="400" cy="210" r="16" fill="${p.wall}"/><circle cx="400" cy="210" r="10" fill="#9fc3d8"/>`;
      b += bush(240, 425, 90) + bush(560, 425, 100, '#6c9a5c') + tree(700, 400, .9, '#4c7a45');
      b += `<g stroke="#fff" stroke-width="5" opacity=".9"><path d="M130 440V400M150 440V400M170 440V400M630 440V400M650 440V400M670 440V400M120 410H180M620 410H680"/></g>`;
    } else if (t === 'sobrado') {
      b += tree(80, 385, 1, '#557f4c');
      b += `<rect x="210" y="160" width="380" height="270" fill="${p.wall}"/><rect x="410" y="160" width="180" height="270" fill="${p.wall2}"/>
      <rect x="196" y="146" width="408" height="18" fill="${p.roof}"/><rect x="196" y="282" width="230" height="12" fill="${p.roof}" opacity=".85"/>
      <rect x="240" y="190" width="150" height="80" fill="#9fc3d8"/><path d="M240 250 L310 190 H350 L260 270 H240Z" fill="#fff" opacity=".25"/>
      <rect x="230" y="262" width="170" height="8" fill="#fff"/><path d="M234 262 V232 M398 262V232 M234 232 H398" stroke="#fff" stroke-width="3" opacity=".8"/>
      ${win(445, 195, 110, 70, p)}
      <rect x="240" y="320" width="120" height="110" fill="${p.acc}" opacity=".9"/><g stroke="#fff" stroke-opacity=".35" stroke-width="3">${[0, 1, 2, 3, 4].map(k => `<path d="M240 ${336 + k * 20}H360"/>`).join('')}</g>
      <rect x="440" y="320" width="56" height="110" rx="3" fill="#6b4b33"/><circle cx="486" cy="378" r="4" fill="#f1d38a"/>
      ${win(515, 330, 50, 60, p)}`;
      b += bush(520, 428, 70) + tree(700, 395, .95, '#4c7a45');
    } else if (t === 'apartamento' || t === 'studio') {
      const floors = t === 'studio' ? 6 : 7 + (s % 3);
      b += `<rect x="560" y="120" width="170" height="320" fill="#c7cdd2" opacity=".7"/><g fill="#fff" opacity=".35">${Array.from({ length: 10 }, (_, k) => `<rect x="580" y="${140 + k * 28}" width="130" height="10"/>`).join('')}</g>
      <rect x="40" y="200" width="140" height="240" fill="#d2d6d8" opacity=".7"/>`;
      const top = 440 - floors * 36 - 20;
      b += `<rect x="250" y="${top}" width="300" height="${440 - top}" fill="${p.wall}"/><rect x="250" y="${top}" width="80" height="${440 - top}" fill="${p.wall2}"/>
      <rect x="238" y="${top - 14}" width="324" height="16" fill="${p.roof}"/>`;
      for (let f = 0; f < floors; f++) {
        const y = top + 18 + f * 36;
        b += `<rect x="268" y="${y}" width="44" height="22" fill="#9fc3d8"/><rect x="345" y="${y}" width="80" height="22" fill="#9fc3d8"/><rect x="345" y="${y}" width="30" height="22" fill="#fff" opacity=".22"/>
        <rect x="440" y="${y - 2}" width="96" height="26" fill="#8fb2c6"/><rect x="434" y="${y + 18}" width="108" height="8" fill="#fff" opacity=".95"/><rect x="434" y="${y + 10}" width="108" height="10" fill="#fff" opacity=".35"/>
        ${R(s, f) > .6 ? `<circle cx="${450 + R(s, f + 9) * 70}" cy="${y + 12}" r="7" fill="#5f8f55"/>` : ''}`;
      }
      b += `<rect x="370" y="380" width="60" height="60" fill="${p.acc}"/><rect x="376" y="386" width="22" height="54" fill="#cfe0ea" opacity=".85"/><rect x="402" y="386" width="22" height="54" fill="#cfe0ea" opacity=".85"/>
      <rect x="350" y="370" width="100" height="10" fill="${p.roof}"/>`;
      b += tree(200, 400, .8, '#5a8a50') + tree(620, 402, .85, '#4c7a45') + bush(470, 430, 70);
    } else if (t === 'comercial') {
      b += `<rect x="60" y="230" width="130" height="210" fill="#cfd4d6" opacity=".75"/><rect x="620" y="200" width="140" height="240" fill="#c9cdd0" opacity=".75"/>`;
      b += `<rect x="200" y="170" width="400" height="270" fill="${p.wall2}"/><rect x="200" y="170" width="400" height="60" fill="${p.roof}"/>
      <text x="400" y="210" text-anchor="middle" font-family="Georgia,serif" font-size="26" fill="#fff" letter-spacing="4">${im.finalidade === 'venda' ? 'VENDE-SE' : 'ALUGA-SE'}</text>
      <rect x="220" y="250" width="360" height="190" fill="#a9c8d8"/><g stroke="${p.roof}" stroke-width="6">${[0, 1, 2, 3].map(k => `<path d="M${310 + k * 90 - 90} 250V440"/>`).join('')}<path d="M220 330H580"/></g>
      <path d="M230 440 L330 250 H380 L270 440Z" fill="#fff" opacity=".22"/><path d="M420 440 L500 250 H520 L440 440Z" fill="#fff" opacity=".18"/>
      <rect x="190" y="236" width="420" height="10" fill="${p.acc}"/>`;
      b += bush(150, 432, 60) + tree(700, 405, .7, '#4c7a45');
    } else {
      // terreno
      b += `<path d="M0 330 Q160 270 330 320 T640 300 T800 310 V440 H0Z" fill="#a9c79a"/><path d="M0 360 Q220 320 420 350 T800 340 V440 H0Z" fill="#94b884"/>
      <rect x="120" y="360" width="560" height="80" fill="#b9a97c"/><rect x="120" y="360" width="560" height="80" fill="url(#gr${id})"/>
      <g stroke="#7a6a50" stroke-width="3">${Array.from({ length: 15 }, (_, k) => `<path d="M${120 + k * 40} 440V405"/>`).join('')}<path d="M120 412H680M120 426H680"/></g>
      <rect x="520" y="300" width="6" height="110" fill="#6b4b33"/><rect x="470" y="290" width="110" height="60" rx="4" fill="#fff"/><rect x="470" y="290" width="110" height="18" rx="4" fill="${p.acc}"/>
      <text x="525" y="304" text-anchor="middle" font-family="Arial" font-size="12" font-weight="700" fill="#fff">VENDE-SE</text><text x="525" y="334" text-anchor="middle" font-family="Arial" font-size="16" font-weight="700" fill="#333">${im.area} m²</text>`;
      sk.defs += `<pattern id="gr${id}" width="18" height="10" patternUnits="userSpaceOnUse"><path d="M2 8 L5 2 M9 9 L12 3" stroke="#8f8a5a" stroke-width="2"/></pattern>`;
      b += tree(80, 370, 1, '#5a8a50') + tree(730, 360, 1.1, '#4c7a45') + tree(300, 330, .6, '#6b9a5c');
    }
    b += ground(p);
    return wrap(b, sk.defs, 'Ilustração da fachada');
  }

  /* ---------- Cômodos ---------- */
  function room(p, wall, floorColor) {
    return `<rect width="800" height="500" fill="${wall}"/><rect y="0" width="800" height="18" fill="#fff" opacity=".35"/>
    <polygon points="0,500 0,380 800,380 800,500" fill="${floorColor}"/>
    <g stroke="#000" stroke-opacity=".08" stroke-width="2">${Array.from({ length: 11 }, (_, k) => `<path d="M${k * 80 - 40} 380 L${k * 120 - 200} 500"/>`).join('')}<path d="M0 420H800M0 460H800" stroke-opacity=".05"/></g>
    <rect y="372" width="800" height="10" fill="#fff" opacity=".7"/>`;
  }
  function plant(x, y, k, p) {
    return `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-22 0 L22 0 L16 50 L-16 50Z" fill="${p.wall2}"/><g fill="#4f7d4a"><ellipse cx="-14" cy="-30" rx="10" ry="30" transform="rotate(-25 -14 -30)"/><ellipse cx="14" cy="-34" rx="10" ry="32" transform="rotate(22 14 -34)"/><ellipse cx="0" cy="-44" rx="10" ry="40"/><ellipse cx="-26" cy="-12" rx="8" ry="20" transform="rotate(-55 -26 -12)" fill="#5f8f55"/></g></g>`;
  }
  function frame(x, y, w, h, p) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" stroke="#3a3530" stroke-width="5"/><path d="M${x + 8} ${y + h - 10} L${x + w * .4} ${y + h * .45} L${x + w * .6} ${y + h * .7} L${x + w * .75} ${y + h * .5} L${x + w - 8} ${y + h - 10}Z" fill="${p.acc}" opacity=".7"/><circle cx="${x + w * .72}" cy="${y + h * .28}" r="${h * .1}" fill="${p.roof}" opacity=".6"/>`;
  }
  function bigWindow(x, y, w, h, p) {
    return `<rect x="${x - 8}" y="${y - 8}" width="${w + 16}" height="${h + 16}" fill="#fff"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.sky[0]}"/>
    <rect x="${x}" y="${y + h * .62}" width="${w}" height="${h * .38}" fill="#a9c79a"/>
    <circle cx="${x + w * .3}" cy="${y + h * .6}" r="${h * .18}" fill="#6b9a5c"/><circle cx="${x + w * .75}" cy="${y + h * .62}" r="${h * .14}" fill="#5a8a50"/>
    <path d="M${x} ${y + h * .5} L${x + w * .5} ${y} H${x + w * .7} L${x} ${y + h * .8}Z" fill="#fff" opacity=".2"/>
    <path d="M${x + w / 2} ${y}V${y + h}" stroke="#fff" stroke-width="6"/>`;
  }

  const comodos = {
    sala(p, s) {
      let b = room(p, p.soft, p.floor);
      b += bigWindow(470, 80, 250, 230, p);
      b += `<rect x="456" y="70" width="40" height="320" fill="${p.acc}" opacity=".45"/>`;
      b += frame(110, 110, 120, 90, p) + frame(250, 130, 70, 70, p);
      b += `<ellipse cx="300" cy="455" rx="260" ry="30" fill="${p.wall2}" opacity=".8"/>
      <rect x="70" y="300" width="380" height="110" rx="26" fill="${p.fab}"/><rect x="70" y="270" width="380" height="70" rx="26" fill="${p.fab}"/><rect x="70" y="270" width="380" height="70" rx="26" fill="#fff" opacity=".08"/>
      <rect x="95" y="300" width="160" height="56" rx="16" fill="#fff" opacity=".12"/><rect x="265" y="300" width="160" height="56" rx="16" fill="#fff" opacity=".12"/>
      <rect x="110" y="282" width="56" height="44" rx="10" fill="${p.acc}"/><rect x="360" y="282" width="56" height="44" rx="10" fill="${p.wall2}"/>
      <rect x="80" y="405" width="12" height="20" fill="#3a3530"/><rect x="428" y="405" width="12" height="20" fill="#3a3530"/>
      <ellipse cx="300" cy="448" rx="80" ry="16" fill="#3a3530"/><rect x="292" y="448" width="16" height="30" fill="#3a3530"/><circle cx="290" cy="438" r="10" fill="${p.roof}"/>
      <path d="M720 380 V250" stroke="#3a3530" stroke-width="5"/><path d="M695 250 L745 250 L732 210 L708 210Z" fill="${p.wall2}"/>`;
      b += plant(610, 390, 1.2, p);
      return b;
    },
    cozinha(p) {
      let b = room(p, '#f4f2ee', '#d8d2c8');
      b += `<g stroke="#000" stroke-opacity=".06">${Array.from({ length: 20 }, (_, k) => `<path d="M${k * 40} 150V290"/>`).join('')}${[0, 1, 2, 3].map(k => `<path d="M0 ${170 + k * 35}H800"/>`).join('')}</g>
      <rect x="60" y="40" width="680" height="110" fill="${p.acc}"/><g stroke="#fff" stroke-opacity=".35" stroke-width="3">${[1, 2, 3, 4, 5].map(k => `<path d="M${60 + k * 113} 40V150"/>`).join('')}</g>
      ${bigWindow(330, 170, 140, 100, p)}
      <rect x="60" y="290" width="680" height="20" fill="#e9e3d9"/><rect x="60" y="306" width="680" height="94" fill="${p.acc}"/><rect x="60" y="306" width="680" height="94" fill="#000" opacity=".08"/>
      <g stroke="#fff" stroke-opacity=".35" stroke-width="3">${[1, 2, 3, 4, 5].map(k => `<path d="M${60 + k * 113} 306V400"/>`).join('')}</g>
      <g fill="#d9c08a">${[0, 1, 2, 3, 4, 5].map(k => `<rect x="${105 + k * 113}" y="318" width="22" height="5" rx="2"/>`).join('')}</g>
      <rect x="350" y="284" width="100" height="8" rx="3" fill="#b9bec2"/><path d="M400 284 V250 Q400 240 412 240" stroke="#9aa0a5" stroke-width="5" fill="none"/>
      <rect x="560" y="268" width="90" height="22" rx="4" fill="#3a3530"/><circle cx="585" cy="279" r="6" fill="#555"/><circle cx="625" cy="279" r="6" fill="#555"/>
      <rect x="150" y="262" width="26" height="28" rx="6" fill="${p.roof}"/><rect x="186" y="270" width="18" height="20" rx="4" fill="${p.wall2}"/>`;
      b += `<path d="M260 0V40M540 0V40" stroke="#3a3530" stroke-width="3"/><path d="M240 40 H280 L272 60 H248Z M520 40 H560 L552 60 H528Z" fill="#3a3530"/><ellipse cx="260" cy="64" rx="14" ry="5" fill="#fff4cf" opacity=".9"/><ellipse cx="540" cy="64" rx="14" ry="5" fill="#fff4cf" opacity=".9"/>`;
      b += `<g fill="#3a3530"><rect x="250" y="430" width="70" height="12" rx="5"/><rect x="262" y="440" width="6" height="60"/><rect x="302" y="440" width="6" height="60"/><rect x="480" y="430" width="70" height="12" rx="5"/><rect x="492" y="440" width="6" height="60"/><rect x="532" y="440" width="6" height="60"/></g>`;
      return b;
    },
    quarto(p) {
      let b = room(p, p.wall, p.floor);
      b += bigWindow(560, 90, 170, 190, p) + `<rect x="540" y="80" width="40" height="300" fill="${p.soft}" opacity=".9"/><rect x="710" y="80" width="40" height="300" fill="${p.soft}" opacity=".9"/>`;
      b += `<rect x="150" y="190" width="340" height="150" rx="14" fill="${p.wall2}"/><rect x="150" y="190" width="340" height="150" rx="14" fill="#fff" opacity=".1"/>
      <rect x="130" y="320" width="380" height="80" rx="10" fill="#fff"/><rect x="130" y="350" width="380" height="80" rx="10" fill="${p.fab}"/><rect x="130" y="350" width="380" height="16" fill="#fff" opacity=".2"/>
      <rect x="170" y="290" width="130" height="50" rx="16" fill="#fff"/><rect x="340" y="290" width="130" height="50" rx="16" fill="#fff"/>
      <rect x="140" y="430" width="14" height="30" fill="#3a3530"/><rect x="486" y="430" width="14" height="30" fill="#3a3530"/>
      <rect x="40" y="330" width="80" height="70" rx="4" fill="${p.wall2}"/><rect x="520" y="330" width="80" height="70" rx="4" fill="${p.wall2}"/>
      <path d="M80 330V300" stroke="#3a3530" stroke-width="4"/><path d="M60 300 H100 L92 270 H68Z" fill="#f6e7c4"/>`;
      b += frame(250, 90, 140, 80, p);
      return b;
    },
    banheiro(p) {
      let b = `<rect width="800" height="500" fill="#eef0ef"/><g stroke="#cfd6d4" stroke-width="2">${Array.from({ length: 14 }, (_, k) => `<path d="M${k * 60} 0V500"/>`).join('')}${Array.from({ length: 9 }, (_, k) => `<path d="M0 ${k * 60}H800"/>`).join('')}</g>
      <rect y="400" width="800" height="100" fill="${p.wall2}"/>`;
      b += `<rect x="90" y="70" width="230" height="160" rx="80" fill="#dfe9ee" stroke="#c9b48a" stroke-width="6"/><path d="M130 190 L230 90 H270 L150 210Z" fill="#fff" opacity=".4"/>
      <rect x="70" y="280" width="270" height="20" rx="4" fill="#f7f5f1"/><ellipse cx="205" cy="286" rx="60" ry="8" fill="#e3e6e5"/><path d="M205 280 V258 Q205 250 216 250" stroke="#b9bec2" stroke-width="5" fill="none"/>
      <rect x="80" y="300" width="250" height="90" fill="${p.acc}"/><path d="M205 300V390" stroke="#fff" stroke-opacity=".35" stroke-width="3"/>
      <rect x="430" y="60" width="300" height="340" fill="#bcd6df" opacity=".35" stroke="#b9bec2" stroke-width="5"/><path d="M460 400 L620 60 H660 L500 400Z" fill="#fff" opacity=".3"/>
      <path d="M640 90 V110 Q640 120 630 120 H600" stroke="#9aa0a5" stroke-width="5" fill="none"/><circle cx="600" cy="125" r="18" fill="#9aa0a5"/>
      <rect x="360" y="190" width="40" height="8" fill="#9aa0a5"/><rect x="368" y="198" width="24" height="70" rx="4" fill="${p.soft}"/>`;
      b += plant(380, 390, .8, p);
      return b;
    },
    varanda(p, s) {
      let b = `<rect width="800" height="500" fill="${p.sky[0]}"/><rect y="180" width="800" height="200" fill="${p.sky[1]}"/>
      <g fill="#b7c3cc">${Array.from({ length: 12 }, (_, k) => `<rect x="${k * 70}" y="${200 - R(s, k) * 110}" width="${50 + R(s, k + 3) * 20}" height="${200 + R(s, k) * 110}"/>`).join('')}</g>
      <g fill="#a2b0ba">${Array.from({ length: 9 }, (_, k) => `<rect x="${30 + k * 90}" y="${250 - R(s, k + 7) * 60}" width="60" height="200"/>`).join('')}</g>
      <rect y="300" width="800" height="80" fill="#9db890"/>`;
      b += `<rect x="0" y="0" width="800" height="40" fill="${p.wall}"/><rect x="0" y="0" width="60" height="500" fill="${p.wall}"/><rect x="740" y="0" width="60" height="500" fill="${p.wall}"/>
      <polygon points="0,500 0,400 800,400 800,500" fill="${p.floor}"/>
      <rect x="60" y="280" width="680" height="120" fill="#cfe3ea" opacity=".45"/><rect x="60" y="274" width="680" height="10" fill="#3a3530"/>`;
      b += `<g><rect x="200" y="340" width="110" height="60" rx="12" fill="${p.fab}"/><rect x="200" y="300" width="110" height="50" rx="12" fill="${p.fab}"/><rect x="212" y="398" width="8" height="40" fill="#3a3530"/><rect x="290" y="398" width="8" height="40" fill="#3a3530"/></g>
      <g><circle cx="420" cy="380" r="40" fill="#3a3530"/><rect x="415" y="380" width="10" height="70" fill="#3a3530"/><rect x="400" y="350" width="10" height="22" rx="3" fill="#fff"/><rect x="428" y="352" width="12" height="20" rx="5" fill="${p.roof}"/></g>
      <g><rect x="520" y="340" width="110" height="60" rx="12" fill="${p.fab}"/><rect x="520" y="300" width="110" height="50" rx="12" fill="${p.fab}"/><rect x="532" y="398" width="8" height="40" fill="#3a3530"/><rect x="610" y="398" width="8" height="40" fill="#3a3530"/></g>`;
      b += plant(110, 420, 1.3, p) + plant(690, 420, 1.1, p);
      return b;
    },
    quintal(p, s) {
      const sk = sky(p, ++uid, s);
      let b = sk.body + `<path d="M0 300 Q200 260 420 290 T800 270 V500 H0Z" fill="#8fb37a"/>`;
      b += `<rect x="0" y="210" width="800" height="110" fill="${p.wall}"/><rect x="0" y="210" width="800" height="12" fill="${p.wall2}"/>`;
      b += tree(120, 300, 1.1, '#5a8a50') + tree(690, 300, 1.2, '#4c7a45');
      b += `<rect x="0" y="320" width="800" height="180" fill="#a7c48f"/><rect x="0" y="380" width="800" height="120" fill="#d9cdb6"/>
      <rect x="230" y="370" width="340" height="100" rx="10" fill="#7fc3d6"/><rect x="240" y="378" width="320" height="84" rx="8" fill="#93d1e0"/><path d="M270 400 Q320 390 370 402 T470 400 T540 404" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>
      <g fill="${p.acc}"><rect x="610" y="420" width="120" height="16" rx="6"/><rect x="700" y="400" width="34" height="24" rx="6"/></g><g fill="#3a3530"><rect x="620" y="434" width="6" height="22"/><rect x="716" y="434" width="6" height="22"/></g>
      <rect x="60" y="330" width="120" height="60" fill="${p.roof}" opacity=".85"/><rect x="74" y="342" width="92" height="30" fill="#3a3530"/><path d="M84 350 h72M84 360h72" stroke="#c46b3c" stroke-width="3"/>`;
      return [b, sk.defs];
    },
    escritorio(p) {
      let b = room(p, '#efeeea', p.floor);
      b += bigWindow(80, 70, 220, 220, p);
      b += `<rect x="360" y="70" width="380" height="200" fill="${p.wall2}"/><g fill="${p.acc}">${[0, 1, 2].map(r => [0, 1, 2, 3, 4, 5, 6].map(c => `<rect x="${375 + c * 50}" y="${85 + r * 62}" width="${12 + (c % 3) * 6}" height="48" opacity="${.5 + (c % 3) * .2}"/>`).join('')).join('')}</g>
      <g stroke="#fff" stroke-width="5">${[0, 1, 2].map(r => `<path d="M360 ${136 + r * 62}H740"/>`).join('')}</g>
      <rect x="330" y="310" width="400" height="16" rx="4" fill="#6b4b33"/><rect x="350" y="326" width="12" height="90" fill="#3a3530"/><rect x="698" y="326" width="12" height="90" fill="#3a3530"/>
      <rect x="470" y="236" width="130" height="78" rx="6" fill="#2d3236"/><rect x="478" y="244" width="114" height="60" fill="#5d7f96"/><rect x="525" y="314" width="20" height="4" fill="#2d3236"/>
      <rect x="400" y="380" width="70" height="70" rx="16" fill="${p.fab}"/><rect x="400" y="330" width="70" height="60" rx="16" fill="${p.fab}"/><rect x="430" y="450" width="10" height="40" fill="#3a3530"/>`;
      b += plant(250, 400, 1.1, p);
      return b;
    },
  };

  function comodo(im, nome) {
    const p = pal(im.pal), s = (im.pal || 0) + nome.length;
    const f = comodos[nome] || comodos.sala;
    const r = f(p, s);
    if (Array.isArray(r)) return wrap(r[0], r[1], 'Ilustração: ' + nome);
    return wrap(r, '', 'Ilustração: ' + nome);
  }

  const NOMES = { fachada: 'Fachada', sala: 'Sala', cozinha: 'Cozinha', quarto: 'Quarto', banheiro: 'Banheiro', varanda: 'Varanda', quintal: 'Área externa', escritorio: 'Escritório' };

  window.Fotos = {
    svg(im, nome) { return nome === 'fachada' ? fachada(im) : comodo(im, nome); },
    nome: n => NOMES[n] || n,
    paletas: PAL.length,
  };
})();

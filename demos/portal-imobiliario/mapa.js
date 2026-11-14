/* Mapa: Leaflet + OpenStreetMap quando há internet; mapa ilustrado em SVG próprio como alternativa. */
(function () {
  const D = window.DADOS;
  const lats = D.bairros.map(b => b.lat), lngs = D.bairros.map(b => b.lng);
  const B = { n: Math.max(...lats) + 0.012, s: Math.min(...lats) - 0.012, w: Math.min(...lngs) - 0.014, e: Math.max(...lngs) + 0.014 };
  const VW = 1000, VH = 720;
  const proj = (lat, lng) => [((lng - B.w) / (B.e - B.w)) * VW, ((B.n - lat) / (B.n - B.s)) * VH];

  function pill(p) { return `<span class="mk${p.destaque ? ' mk-dest' : ''}" data-id="${p.id}">${p.rotulo}</span>`; }

  /* ---------- Mapa ilustrado (SVG) ---------- */
  function svgBase() {
    const cores = ['#e3ecd8', '#efe4d2', '#dfeae4', '#ece1d7', '#dcebe8', '#ebe6d3'];
    const bairros = D.bairros.map((b, i) => {
      const [x, y] = proj(b.lat, b.lng);
      const rx = 135 + (i % 3) * 14, ry = 104 + (i % 2) * 12;
      return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${cores[i]}" stroke="#d6cdb9" stroke-width="2" stroke-dasharray="8 8"/>`;
    }).join('');
    const nomes = D.bairros.map((b, i) => { const [x, y] = proj(b.lat, b.lng); const ry = 104 + (i % 2) * 12; return `<text x="${x}" y="${y - ry + 34}" text-anchor="middle" class="mp-bairro">${b.nome}</text>`; }).join('');
    const lago = D.bairros.find(b => b.id === 'lago');
    const [lx, ly] = proj(lago.lat - 0.004, lago.lng + 0.004);
    const G = [-1200, 2200];
    return `<svg viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMid meet" class="mp-svg" aria-hidden="true">
      <rect x="${G[0]}" y="${G[0]}" width="${G[1] - G[0]}" height="${G[1] - G[0]}" fill="#f4efe5"/>
      <g stroke="#e9e1d1" stroke-width="2">${Array.from({ length: 86 }, (_, k) => `<path d="M${G[0] + k * 40} ${G[0]}V${G[1]}"/><path d="M${G[0]} ${G[0] + k * 40}H${G[1]}"/>`).join('')}</g>
      ${bairros}
      <path d="M-1200 640 C -400 560, 200 560, 300 650 S 700 700, 860 580 S 1400 560, 2200 620" fill="none" stroke="#a9cfe0" stroke-width="30" stroke-linecap="round"/>
      <ellipse cx="${lx}" cy="${ly}" rx="90" ry="48" fill="#a9cfe0"/>
      <g fill="none" stroke="#fff" stroke-linecap="round"><path d="M-1200 360 H2200" stroke-width="24"/><path d="M500 -1200 V2200" stroke-width="20"/><path d="M-200 -120 L1300 940" stroke-width="14"/><path d="M-100 900 Q420 320 1300 0" stroke-width="14"/></g>
      <g fill="none" stroke="#e7c9a9" stroke-linecap="round"><path d="M-1200 360 H2200" stroke-width="7"/><path d="M500 -1200 V2200" stroke-width="6"/></g>
      ${nomes}
      <text x="40" y="344" class="mp-rua">Av. Brasil Central</text>
    </svg>`;
  }

  function criarSVG(el, pontos, onClick) {
    el.innerHTML = `<div class="mp-wrap">${svgBase()}<div class="mp-pins"></div><span class="mp-cred">Mapa ilustrado · Vale Serena, cidade fictícia</span></div>`;
    const pins = el.querySelector('.mp-pins'), wr = el.querySelector('.mp-wrap'), svg = el.querySelector('svg');
    let vb = [0, 0, VW, VH];
    const posicionar = () => pins.querySelectorAll('.mp-pin').forEach(b => { b.style.left = ((+b.dataset.x - vb[0]) / vb[2] * 100) + '%'; b.style.top = ((+b.dataset.y - vb[1]) / vb[3] * 100) + '%'; });
    const fit = () => {
      const W = wr.clientWidth, H = wr.clientHeight; if (!W || !H) return;
      const A = W / H;
      vb = A < VW / VH ? [0, -(VW / A - VH) / 2, VW, VW / A] : [-(VH * A - VW) / 2, 0, VH * A, VH];
      // aproxima um pouco em telas estreitas para o texto não ficar miúdo
      const z = 1;
      if (z < 1) { const cx = vb[0] + vb[2] / 2, cy = vb[1] + vb[3] / 2; vb = [cx - vb[2] * z / 2, cy - vb[3] * z / 2, vb[2] * z, vb[3] * z]; }
      svg.setAttribute('viewBox', vb.join(' '));
      posicionar();
    };
    let ro = null; if (window.ResizeObserver) { ro = new ResizeObserver(fit); ro.observe(wr); }
    function set(ps) {
      pins.innerHTML = ps.map(p => {
        const [x, y] = proj(p.lat, p.lng);
        return `<button class="mp-pin" data-x="${x}" data-y="${y}" data-id="${p.id}" aria-label="${p.titulo}">${pill(p)}</button>`;
      }).join('');
      fit();
    }
    pins.addEventListener('click', e => { const b = e.target.closest('.mp-pin'); if (b) onClick(b.dataset.id); });
    set(pontos);
    return {
      tipo: 'ilustrado', set,
      destacar(id) { pins.querySelectorAll('.mp-pin').forEach(b => b.classList.toggle('on', b.dataset.id === id)); },
      centrar() {}, destroy() { if (ro) ro.disconnect(); el.innerHTML = ''; },
    };
  }

  /* ---------- Leaflet ---------- */
  function criarLeaflet(el, pontos, onClick, opts, falhou) {
    el.innerHTML = '<div class="mp-leaf"></div>';
    const box = el.firstChild;
    const map = L.map(box, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });
    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; colaboradores do <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> · endereços fictícios',
    }).addTo(map);
    let ok = 0, err = 0;
    tiles.on('tileload', () => ok++);
    tiles.on('tileerror', () => err++);
    const timer = setTimeout(() => { if (ok === 0) falhou(); }, opts.timeout || 4500);
    let layer = L.layerGroup().addTo(map), marks = {};
    function set(ps) {
      layer.clearLayers(); marks = {};
      ps.forEach(p => {
        const m = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: 'mk-leaf', html: pill(p), iconSize: null }), riseOnHover: true, title: p.titulo });
        m.on('click', () => onClick(p.id));
        m.addTo(layer); marks[p.id] = m;
      });
      if (ps.length > 1) map.fitBounds(L.latLngBounds(ps.map(p => [p.lat, p.lng])).pad(0.15), { maxZoom: 15 });
      else if (ps.length === 1) map.setView([ps[0].lat, ps[0].lng], opts.zoom || 15);
      else map.setView([D.base.lat, D.base.lng], 13);
    }
    set(pontos);
    setTimeout(() => map.invalidateSize(), 60);
    return {
      tipo: 'ruas', set, map,
      destacar(id) { Object.entries(marks).forEach(([k, m]) => { const e = m.getElement(); if (e) { e.classList.toggle('on', k === id); if (k === id) m.setZIndexOffset(1000); else m.setZIndexOffset(0); } }); },
      destroy() { clearTimeout(timer); map.remove(); el.innerHTML = ''; },
    };
  }

  window.Mapa = {
    leafletOk: () => typeof window.L !== 'undefined',
    falhouOnline: false,
    criar(el, pontos, onClick, opts) {
      opts = opts || {};
      const self = this;
      let ultimos = pontos, inst;
      const usarSVG = opts.modo === 'ilustrado' || !this.leafletOk() || this.falhouOnline;
      if (usarSVG) inst = criarSVG(el, pontos, onClick);
      else inst = criarLeaflet(el, pontos, onClick, opts, () => {
        self.falhouOnline = true;
        inst.destroy();
        inst = criarSVG(el, ultimos, onClick);
        if (opts.aoTrocar) opts.aoTrocar('ilustrado');
      });
      return {
        get tipo() { return inst.tipo; },
        set(ps) { ultimos = ps; inst.set(ps); },
        destacar(id) { inst.destacar(id); },
        destroy() { inst.destroy(); },
      };
    },
  };
})();

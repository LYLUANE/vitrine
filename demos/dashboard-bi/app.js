(function () {
  'use strict';
  var D = window.DADOS, REG = D.reg, DIA = 86400000;
  var NS = 'http://www.w3.org/2000/svg';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var DSEM = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  var st = { periodo: 12, regiao: '', filial: '', categoria: '', vendedor: '', pagina: 0, busca: '', ord: { col: 'd', dir: -1 }, pg: 0 };

  /* ---------- formatos ---------- */
  var fBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  var fBRL2 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var fN = new Intl.NumberFormat('pt-BR');
  var f1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  function brl(v) { return fBRL.format(v); }
  function brlC(v) {
    var a = Math.abs(v);
    if (a >= 1e6) return 'R$ ' + f1.format(v / 1e6) + ' mi';
    if (a >= 1e4) return 'R$ ' + fN.format(Math.round(v / 1e3)) + ' mil';
    if (a >= 1e3) return 'R$ ' + f1.format(v / 1e3) + ' mil';
    return fBRL.format(v);
  }
  function pct(v, casas) { return (casas === 0 ? fN.format(Math.round(v * 100)) : f1.format(v * 100)) + '%'; }
  function dataDe(d) { return new Date(D.inicio.getFullYear(), D.inicio.getMonth(), D.inicio.getDate() + d); }
  function dataTxt(d) { var x = dataDe(d); return String(x.getDate()).padStart(2, '0') + '/' + String(x.getMonth() + 1).padStart(2, '0') + '/' + x.getFullYear(); }
  function idxMes(y, m) { return Math.round((new Date(y, m, 1) - D.inicio) / DIA); }
  function mesTxt(d) { var x = dataDe(d); return MESES[x.getMonth()] + '/' + String(x.getFullYear()).slice(2); }

  /* ---------- svg / dom ---------- */
  function s(tag, at, pai) { var e = document.createElementNS(NS, tag); for (var k in at) { if (k === 'text') e.textContent = at[k]; else if (k === 'fill' || k === 'stroke') e.style[k] = at[k]; else e.setAttribute(k, at[k]); } if (pai) pai.appendChild(e); return e; }
  function h(tag, at, pai) { var e = document.createElement(tag); for (var k in at) { if (k === 'text') e.textContent = at[k]; else if (k === 'cls') e.className = at[k]; else e.setAttribute(k, at[k]); } if (pai) pai.appendChild(e); return e; }
  // barra com ponta de 4px arredondada e base reta (horizontal, cresce para a direita)
  function barraH(x, y, w, alt) { var r = Math.min(4, w / 2, alt / 2); if (w <= 0) return ''; return 'M' + x + ',' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + alt - r) + 'Q' + (x + w) + ',' + (y + alt) + ' ' + (x + w - r) + ',' + (y + alt) + 'H' + x + 'Z'; }
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function hexRgb(x) { x = x.replace('#', ''); return [parseInt(x.substr(0, 2), 16), parseInt(x.substr(2, 2), 16), parseInt(x.substr(4, 2), 16)]; }
  function mistura(a, b, t) { var A = hexRgb(a), B = hexRgb(b); return 'rgb(' + A.map(function (v, i) { return Math.round(v + (B[i] - v) * t); }).join(',') + ')'; }
  function escala(max) {
    if (max <= 0) return { max: 1, passo: 1 };
    var bruto = max / 4, mag = Math.pow(10, Math.floor(Math.log10(bruto))), n = bruto / mag;
    var passo = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
    return { max: Math.ceil(max / passo) * passo, passo: passo };
  }
  function ativavel(g, rotulo, acao) {
    g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button'); g.setAttribute('aria-label', rotulo);
    g.classList.add('alvo');
    g.addEventListener('click', acao);
    g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); acao(); } });
  }

  /* ---------- tooltip ---------- */
  var tt = $('#tooltip');
  function dica(titulo, linhas, ev) {
    tt.textContent = '';
    h('div', { cls: 'tt-t', text: titulo }, tt);
    linhas.forEach(function (l) {
      var d = h('div', { cls: 'tt-l' }, tt);
      if (l.cor) { var i = h('i', {}, d); i.style.background = l.cor; }
      h('b', { text: l.v }, d); h('span', { text: l.n }, d);
    });
    tt.classList.add('on');
    posDica(ev);
  }
  function posDica(ev) {
    var x, y;
    if (ev && ev.clientX != null && ev.type.indexOf('key') < 0 && ev.type !== 'focus') { x = ev.clientX; y = ev.clientY; }
    else if (ev && ev.target && ev.target.getBoundingClientRect) { var b = ev.target.getBoundingClientRect(); x = b.left + b.width / 2; y = b.top; }
    else return;
    var w = tt.offsetWidth, hh = tt.offsetHeight, px = x + 14, py = y - hh - 12;
    if (px + w > innerWidth - 8) px = x - w - 14;
    if (px < 8) px = 8;
    if (py < 8) py = y + 18;
    tt.style.left = px + 'px'; tt.style.top = py + 'px';
  }
  function someDica() { tt.classList.remove('on'); }
  function comDica(g, fn) {
    g.addEventListener('pointermove', function (e) { fn(e); });
    g.addEventListener('pointerleave', someDica);
    g.addEventListener('focus', function (e) { fn(e); });
    g.addEventListener('blur', someDica);
  }

  /* ---------- filtros ---------- */
  function preencheFiltros() {
    var sr = $('#f-regiao'), sf = $('#f-filial'), sc = $('#f-categoria'), sv = $('#f-vendedor');
    function opts(sel, todos, lista, val) { sel.textContent = ''; h('option', { value: '', text: todos }, sel); lista.forEach(function (o) { var op = h('option', { value: o[0], text: o[1] }, sel); if (String(o[0]) === String(val)) op.selected = true; }); sel.classList.toggle('ativo', val !== ''); }
    opts(sr, 'Todas as regiões', D.regioes.map(function (n, i) { return [i, n]; }), st.regiao);
    opts(sf, 'Todas as filiais', D.filiais.map(function (f, i) { return [i, f.nome, f.r]; }).filter(function (o) { return st.regiao === '' || o[2] === +st.regiao; }), st.filial);
    opts(sc, 'Todas as categorias', D.categorias.map(function (n, i) { return [i, n]; }), st.categoria);
    opts(sv, 'Todos os vendedores', D.vendedores.map(function (v, i) { return [i, v.nome, v.f]; }).filter(function (o) {
      var f = D.filiais[o[2]]; return (st.filial === '' || o[2] === +st.filial) && (st.regiao === '' || f.r === +st.regiao);
    }).sort(function (a, b) { return a[1].localeCompare(b[1]); }), st.vendedor);
    $('#f-periodo').value = String(st.periodo);
  }
  function casa(r, ign) {
    ign = ign || {};
    if (!ign.regiao && st.regiao !== '' && r.r !== +st.regiao) return false;
    if (!ign.regiao && st.filial !== '' && r.f !== +st.filial) return false;
    if (!ign.categoria && st.categoria !== '' && r.k !== +st.categoria) return false;
    if (!ign.vendedor && st.vendedor !== '' && r.v !== +st.vendedor) return false;
    return true;
  }
  function janela() {
    var fim = D.fim, n = st.periodo;
    var ini = idxMes(fim.getFullYear(), fim.getMonth() - n), ant = idxMes(fim.getFullYear(), fim.getMonth() - 2 * n);
    return { ini: ini, fim: D.nDias, aIni: ant, aFim: ini };
  }
  function primeiro(d) { var lo = 0, hi = REG.length; while (lo < hi) { var m = (lo + hi) >> 1; if (REG[m].d < d) lo = m + 1; else hi = m; } return lo; }
  function fatia(a, b, ign) { var out = [], i = primeiro(a), j = primeiro(b); for (; i < j; i++) if (casa(REG[i], ign)) out.push(REG[i]); return out; }
  function resumo(rows) {
    var fat = 0, cus = 0, nf = 0, ped = 0, atr = 0;
    for (var i = 0; i < rows.length; i++) { var r = rows[i]; if (r.st >= 1) ped++; if (r.st >= 2) { fat += r.val; cus += r.cus; nf++; if (r.atr) atr += r.val; } }
    return { fat: fat, marg: fat ? (fat - cus) / fat : 0, tk: nf ? fat / nf : 0, ped: ped, nf: nf, inad: fat ? atr / fat : 0, orc: rows.length };
  }
  function baldes(J) {
    var n = st.periodo, b = [];
    if (n >= 6) {
      for (var i = 0; i < n; i++) { var y = D.fim.getFullYear(), m = D.fim.getMonth() - n + i; var a = idxMes(y, m), z = idxMes(y, m + 1); b.push({ a: a, z: z, pa: idxMes(y, m - n), pz: idxMes(y, m - n + 1), rot: mesTxt(a), ttl: (function (d) { var x = dataDe(d); return MESES[x.getMonth()] + ' de ' + x.getFullYear(); })(a) }); }
    } else if (n === 3) {
      for (var d = J.ini, k = 0; d < J.fim; d += 7, k++) { var z2 = Math.min(d + 7, J.fim); if (J.fim - z2 < 4) z2 = J.fim; b.push({ a: d, z: z2, pa: J.aIni + (d - J.ini), pz: J.aIni + (z2 - J.ini), rot: dataTxt(d).slice(0, 5), ttl: 'Semana de ' + dataTxt(d).slice(0, 5) + ' a ' + dataTxt(z2 - 1).slice(0, 5) }); if (z2 === J.fim) break; }
    } else {
      for (var d2 = J.ini; d2 < J.fim; d2++) { b.push({ a: d2, z: d2 + 1, pa: J.aIni + (d2 - J.ini), pz: J.aIni + (d2 - J.ini) + 1, rot: String(dataDe(d2).getDate()), ttl: DSEM[dataDe(d2).getDay()] + ', ' + dataTxt(d2) }); }
    }
    return b;
  }
  function soma(rows, bs, campoA, campoZ) {
    var out = bs.map(function () { return 0; }), j = 0;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i]; if (r.st < 2) continue;
      while (j < bs.length && r.d >= bs[j][campoZ]) j++;
      if (j >= bs.length) break;
      if (r.d >= bs[j][campoA]) out[j] += r.val;
    }
    return out;
  }

  /* ---------- cálculo central ---------- */
  var C = {};
  function calcula() {
    var J = janela();
    C.J = J;
    C.cur = fatia(J.ini, J.fim); C.ant = fatia(J.aIni, J.aFim);
    C.k = resumo(C.cur); C.ka = resumo(C.ant);
    C.b = baldes(J);
    C.serie = soma(C.cur, C.b, 'a', 'z'); C.serieAnt = soma(C.ant, C.b, 'pa', 'pz');
    C.curSemReg = fatia(J.ini, J.fim, { regiao: 1 }); C.antSemReg = fatia(J.aIni, J.aFim, { regiao: 1 });
    C.curSemCat = fatia(J.ini, J.fim, { categoria: 1 });
    C.curSemVend = fatia(J.ini, J.fim, { vendedor: 1 });
  }

  /* ---------- KPIs ---------- */
  function delta(atual, ant, tipo, bomSobe) {
    if (!ant && tipo !== 'pp') return { txt: 'sem base', cls: '' };
    var d = tipo === 'pp' ? (atual - ant) * 100 : (atual / ant - 1) * 100;
    if (Math.abs(d) < 0.05) return { seta: '•', txt: 'estável', cls: '' };
    var sobe = d > 0, bom = sobe === bomSobe;
    return { seta: sobe ? '▲' : '▼', txt: (sobe ? '+' : '−') + f1.format(Math.abs(d)) + (tipo === 'pp' ? ' p.p.' : '%'), cls: bom ? 'bom' : 'ruim', leitura: bom ? 'melhora' : 'piora' };
  }
  function renderKpis() {
    var k = C.k, a = C.ka, box = $('#kpis'); box.textContent = '';
    var antTxt = 'vs. ' + (st.periodo === 1 ? mesTxt(C.J.aIni) : mesTxt(C.J.aIni) + '–' + mesTxt(C.J.aFim - 1));
    var lista = [
      { rot: 'Faturamento', val: k.fat >= 1e6 ? brlC(k.fat) : brl(k.fat), d: delta(k.fat, a.fat, '%', true), hero: true, spark: C.serie, info: fN.format(k.nf) + ' pedidos faturados' },
      { rot: 'Margem bruta', val: pct(k.marg), d: delta(k.marg, a.marg, 'pp', true), info: brlC(k.fat * k.marg) + ' de lucro bruto' },
      { rot: 'Ticket médio', val: brl(k.tk), d: delta(k.tk, a.tk, '%', true), info: 'por pedido faturado' },
      { rot: 'Pedidos', val: fN.format(k.ped), d: delta(k.ped, a.ped, '%', true), info: pct(k.orc ? k.ped / k.orc : 0, 0) + ' dos orçamentos viram pedido' },
      { rot: 'Inadimplência', val: pct(k.inad), d: delta(k.inad, a.inad, 'pp', false), info: brlC(k.fat * k.inad) + ' vencido há mais de 30 dias', alerta: k.inad > 0.03 }
    ];
    lista.forEach(function (t) {
      var c = h('div', { cls: 'kpi' + (t.hero ? ' hero' : '') }, box);
      var r = h('div', { cls: 'rot' }, c); h('span', { text: t.rot }, r);
      if (t.alerta) { var al = h('span', { cls: 'status', title: 'Acima da meta de 3%' }, r); al.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5l7 13H1z" fill="var(--warning)"/><path d="M8 6v4M8 11.8v.2" stroke="#0b0b0b" stroke-width="1.6" stroke-linecap="round"/></svg>'; h('span', { text: 'acima da meta', style: 'font-size:11.5px;color:var(--ink-2)' }, al); }
      h('div', { cls: 'val', text: t.val }, c);
      var dl = h('div', { cls: 'delta' }, c);
      var b = h('b', { cls: t.d.cls }, dl); b.textContent = (t.d.seta ? t.d.seta + ' ' : '') + t.d.txt;
      dl.appendChild(document.createTextNode(' vs. anterior'));
      if (t.d.leitura) h('span', { cls: 'sr', text: ' (' + t.d.leitura + ', comparado a ' + antTxt.slice(4) + ')' }, dl);
      dl.title = 'Comparado a ' + antTxt.slice(4);
      h('div', { cls: 'info', text: t.info }, c);
      if (t.spark) sparkline(c, t.spark);
    });
  }
  function sparkline(pai, v) {
    var w = 300, hh = 34, sv = s('svg', { class: 'spark', viewBox: '0 0 ' + w + ' ' + hh, preserveAspectRatio: 'none', 'aria-hidden': 'true' }, pai);
    var max = Math.max.apply(null, v) || 1, min = Math.min.apply(null, v);
    var pts = v.map(function (y, i) { return [(i / Math.max(1, v.length - 1)) * (w - 6) + 3, hh - 4 - ((y - min) / ((max - min) || 1)) * (hh - 10)]; });
    s('path', { d: 'M' + pts.map(function (p) { return p.join(','); }).join('L') + 'L' + pts[pts.length - 1][0] + ',' + hh + 'L' + pts[0][0] + ',' + hh + 'Z', fill: 'color-mix(in srgb, var(--s1) 12%, transparent)' }, sv);
    s('path', { d: 'M' + pts.map(function (p) { return p.join(','); }).join('L'), fill: 'none', stroke: 'var(--s1)', 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke', 'stroke-linejoin': 'round' }, sv);
  }

  /* ---------- tabela-espelho de cada gráfico ---------- */
  function tabelaViz(card, cols, linhas) {
    var box = $('.tabela-viz', card); box.textContent = '';
    var t = h('table', {}, box), th = h('tr', {}, h('thead', {}, t)), tb = h('tbody', {}, t);
    cols.forEach(function (c, i) { h('th', { cls: i ? 'num' : '', text: c, scope: 'col' }, th); });
    linhas.forEach(function (l) { var tr = h('tr', {}, tb); l.forEach(function (v, i) { h('td', { cls: i ? 'num' : '', text: v }, tr); }); });
  }

  /* ---------- linha com tendência ---------- */
  function renderLinha() {
    var box = $('#viz-linha'), W = box.clientWidth; if (!W) return; box.textContent = '';
    var cur = C.serie, ant = C.serieAnt, n = cur.length, Hh = W < 500 ? 230 : 280;
    var m = { t: 18, r: W < 500 ? 16 : 64, b: 28, l: W < 500 ? 52 : 64 };
    var iw = W - m.l - m.r, ih = Hh - m.t - m.b;
    // tendência: regressão linear sobre o período atual
    var sx = 0, sy = 0, sxy = 0, sxx = 0; cur.forEach(function (y, x) { sx += x; sy += y; sxy += x * y; sxx += x * x; });
    var inc = n > 1 ? (n * sxy - sx * sy) / (n * sxx - sx * sx) : 0, cte = (sy - inc * sx) / n;
    var tend = cur.map(function (_, x) { return cte + inc * x; });
    var esc = escala(Math.max.apply(null, cur.concat(ant)));
    var X = function (i) { return m.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw); }, Y = function (v) { return m.t + ih - (v / esc.max) * ih; };
    var sv = s('svg', { width: W, height: Hh, role: 'img', 'aria-label': 'Gráfico de linha do faturamento por ' + (n > 14 ? 'dia' : n > 12 ? 'semana' : 'mês') + ', período atual contra período anterior, com linha de tendência.' }, box);
    for (var t = 0; t <= esc.max + 1e-6; t += esc.passo) {
      s('line', { class: t ? 'grid' : 'base', x1: m.l, x2: m.l + iw, y1: Y(t), y2: Y(t) }, sv);
      s('text', { class: 'mut', x: m.l - 8, y: Y(t) + 4, 'text-anchor': 'end', text: t ? brlC(t).replace('R$ ', '') : '0' }, sv);
    }
    var cada = Math.ceil(n / Math.max(2, Math.floor(iw / (n > 14 ? 34 : 52))));
    C.b.forEach(function (b, i) { if (i % cada === 0 || i === n - 1 && n <= 14) s('text', { class: 'mut', x: X(i), y: Hh - 8, 'text-anchor': 'middle', text: b.rot }, sv); });
    function caminho(v) { return v.map(function (y, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(y).toFixed(1); }).join(''); }
    s('path', { d: caminho(cur) + 'L' + X(n - 1) + ',' + Y(0) + 'L' + X(0) + ',' + Y(0) + 'Z', fill: 'color-mix(in srgb, var(--s1) 10%, transparent)' }, sv);
    s('path', { d: caminho(ant), fill: 'none', stroke: 'var(--prev)', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, sv);
    s('path', { d: caminho(tend), fill: 'none', stroke: 'var(--trend)', 'stroke-width': 1.5, 'stroke-linecap': 'round', opacity: .75 }, sv);
    s('path', { d: caminho(cur), fill: 'none', stroke: 'var(--s1)', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, sv);
    s('circle', { cx: X(n - 1), cy: Y(cur[n - 1]), r: 4.5, fill: 'var(--s1)', stroke: 'var(--surface)', 'stroke-width': 2 }, sv);
    if (W >= 500) s('text', { class: 'forte', x: X(n - 1) + 9, y: Y(cur[n - 1]) + 4, text: brlC(cur[n - 1]).replace('R$ ', '') }, sv);
    // camada de interação: crosshair
    var cruz = s('line', { x1: 0, x2: 0, y1: m.t, y2: m.t + ih, stroke: 'var(--axis)', 'stroke-width': 1, opacity: 0 }, sv);
    var pA = s('circle', { r: 4, fill: 'var(--s1)', stroke: 'var(--surface)', 'stroke-width': 2, opacity: 0 }, sv);
    var pB = s('circle', { r: 4, fill: 'var(--prev)', stroke: 'var(--surface)', 'stroke-width': 2, opacity: 0 }, sv);
    var hit = s('rect', { x: m.l - 10, y: m.t, width: iw + 20, height: ih, fill: 'transparent', tabindex: 0, 'aria-label': 'Explorar valores com as setas' }, sv);
    var foco = n - 1;
    function mostra(i, ev) {
      foco = i; var x = X(i);
      cruz.setAttribute('x1', x); cruz.setAttribute('x2', x); cruz.setAttribute('opacity', 1);
      pA.setAttribute('cx', x); pA.setAttribute('cy', Y(cur[i])); pA.setAttribute('opacity', 1);
      pB.setAttribute('cx', x); pB.setAttribute('cy', Y(ant[i])); pB.setAttribute('opacity', 1);
      var v = ant[i] ? (cur[i] / ant[i] - 1) : 0;
      dica(C.b[i].ttl, [{ cor: 'var(--s1)', v: brl(cur[i]), n: 'período atual' }, { cor: 'var(--prev)', v: brl(ant[i]), n: 'período anterior' }, { cor: 'var(--trend)', v: brl(tend[i]), n: 'tendência' }, { v: (v >= 0 ? '▲ +' : '▼ −') + f1.format(Math.abs(v * 100)) + '%', n: 'vs. anterior' }], ev && ev.clientX != null ? ev : { clientX: box.getBoundingClientRect().left + x, clientY: box.getBoundingClientRect().top + Y(cur[i]), type: 'p' });
    }
    function esconde() { cruz.setAttribute('opacity', 0); pA.setAttribute('opacity', 0); pB.setAttribute('opacity', 0); someDica(); }
    hit.addEventListener('pointermove', function (e) { var r = sv.getBoundingClientRect(), x = e.clientX - r.left; mostra(Math.max(0, Math.min(n - 1, Math.round((x - m.l) / (iw / Math.max(1, n - 1))))), e); });
    hit.addEventListener('pointerleave', esconde);
    hit.addEventListener('focus', function () { mostra(foco); });
    hit.addEventListener('blur', esconde);
    hit.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); mostra(Math.min(n - 1, foco + 1)); } if (e.key === 'ArrowLeft') { e.preventDefault(); mostra(Math.max(0, foco - 1)); } });
    // legenda e subtítulo
    var leg = $('#leg-linha'); leg.textContent = '';
    [['var(--s1)', 'Período atual'], ['var(--prev)', 'Período anterior'], ['var(--trend)', 'Tendência (atual)']].forEach(function (l) { var sp = h('span', {}, leg); h('i', {}, sp).style.background = l[0]; sp.appendChild(document.createTextNode(l[1])); });
    var cres = cte ? inc / (sy / n) : 0;
    $('#sub-linha').textContent = (n > 14 ? 'Por dia' : n > 12 ? 'Por semana' : 'Por mês') + ' · tendência ' + (cres >= 0 ? 'de alta' : 'de queda') + ' de ' + f1.format(Math.abs(cres * 100)) + '% por ' + (n > 14 ? 'dia' : n > 12 ? 'semana' : 'mês');
    tabelaViz(box.parentNode, [n > 14 ? 'Dia' : n > 12 ? 'Semana' : 'Mês', 'Atual', 'Anterior', 'Variação'], C.b.map(function (b, i) { return [b.ttl, brl(cur[i]), brl(ant[i]), ant[i] ? (cur[i] >= ant[i] ? '+' : '−') + f1.format(Math.abs((cur[i] / ant[i] - 1) * 100)) + '%' : '—']; }));
  }

  /* ---------- barras por região (drill-down) ---------- */
  function renderRegiao() {
    var box = $('#viz-regiao'), W = box.clientWidth; if (!W) return; box.textContent = '';
    var ag = D.regioes.map(function (n, i) { return { i: i, nome: n, fat: 0, ant: 0, ped: 0 }; });
    C.curSemReg.forEach(function (r) { if (r.st >= 2) { ag[r.r].fat += r.val; ag[r.r].ped++; } });
    C.antSemReg.forEach(function (r) { if (r.st >= 2) ag[r.r].ant += r.val; });
    ag.sort(function (a, b) { return b.fat - a.fat; });
    var tot = ag.reduce(function (a, b) { return a + b.fat; }, 0) || 1;
    var lab = W < 420 ? 96 : 118, dir = W < 420 ? 64 : 92, linha = 46, bh = 20;
    var max = ag[0].fat || 1, iw = W - lab - dir - 70, Hh = ag.length * linha + 6;
    var sv = s('svg', { width: W, height: Hh, role: 'group', 'aria-label': 'Barras de faturamento por região' }, box);
    var selR = st.regiao !== '' ? +st.regiao : (st.filial !== '' ? D.filiais[+st.filial].r : -1);
    ag.forEach(function (a, k) {
      var y = k * linha + 6, w = Math.max(2, (a.fat / max) * iw);
      var g = s('g', {}, sv);
      if (selR >= 0 && selR !== a.i) g.classList.add('esmaecido');
      s('rect', { class: 'foco', x: 0, y: y - 6, width: W, height: linha - 2, rx: 8, fill: 'transparent', stroke: 'none' }, g);
      s('text', { x: 0, y: y + bh / 2 + 4, text: a.nome, class: selR === a.i ? 'forte' : '' }, g);
      s('path', { class: 'barra', d: barraH(lab, y, w, bh), fill: 'var(--s1)' }, g);
      s('text', { class: 'forte', x: lab + w + 8, y: y + bh / 2 + 4, text: brlC(a.fat) }, g);
      var dv = a.ant ? a.fat / a.ant - 1 : 0;
      s('text', { class: 'mut', x: W - 2, y: y + bh / 2 + 4, 'text-anchor': 'end', text: (dv >= 0 ? '▲ +' : '▼ −') + f1.format(Math.abs(dv * 100)) + '%' }, g);
      s('text', { class: 'mut', x: lab, y: y + bh + 14, text: pct(a.fat / tot) + ' do total · ' + fN.format(a.ped) + ' pedidos' }, g);
      ativavel(g, a.nome + ': ' + brl(a.fat) + '. ' + (selR === a.i ? 'Remover filtro de região' : 'Filtrar o painel por esta região'), function () {
        st.regiao = (selR === a.i && st.regiao !== '') ? '' : String(a.i); st.filial = ''; st.vendedor = ''; atualiza();
      });
      comDica(g, function (e) { dica(a.nome, [{ cor: 'var(--s1)', v: brl(a.fat), n: 'faturamento' }, { v: brl(a.ant), n: 'período anterior' }, { v: pct(a.fat / tot), n: 'participação' }, { v: selR === a.i ? 'Clique para remover o filtro' : 'Clique para filtrar', n: '' }], e); });
    });
    tabelaViz(box.parentNode, ['Região', 'Faturamento', 'Anterior', 'Participação'], ag.map(function (a) { return [a.nome, brl(a.fat), brl(a.ant), pct(a.fat / tot)]; }));
  }

  /* ---------- funil ---------- */
  function renderFunil() {
    var box = $('#viz-funil'), W = box.clientWidth; if (!W) return; box.textContent = '';
    var et = [['Orçamentos', 0], ['Pedidos fechados', 1], ['Faturados', 2], ['Entregues', 3], ['Recebidos', 4]].map(function (e) { return { nome: e[0], n: 0, v: 0, st: e[1] }; });
    C.cur.forEach(function (r) { for (var i = 0; i <= Math.min(r.st, 4); i++) { if (i === 4 && r.st !== 4) break; et[i].n++; et[i].v += r.val; } });
    var linha = 52, bh = 20, Hh = et.length * linha + 4, max = et[0].n || 1;
    var sv = s('svg', { width: W, height: Hh, role: 'img', 'aria-label': 'Funil: ' + et.map(function (e) { return e.nome + ' ' + fN.format(e.n); }).join(', ') }, box);
    et.forEach(function (e, i) {
      var y = i * linha, w = Math.max(2, (e.n / max) * (W - 2));
      var g = s('g', { tabindex: 0 }, sv); g.classList.add('alvo');
      s('text', { x: 0, y: y + 14, text: e.nome, class: 'forte' }, g);
      var conv = i ? (et[i - 1].n ? e.n / et[i - 1].n : 0) : 1;
      s('text', { x: W, y: y + 14, 'text-anchor': 'end', class: 'mut', text: fN.format(e.n) + (i ? ' · ' + pct(conv, 0) + ' da etapa anterior' : '') }, g);
      s('path', { class: 'barra', d: barraH(0, y + 22, w, bh), fill: 'var(--f' + (i + 1) + ')' }, g);
      comDica(g, function (ev) { dica(e.nome, [{ cor: 'var(--f' + (i + 1) + ')', v: fN.format(e.n), n: 'registros' }, { v: brl(e.v), n: 'valor' }, { v: pct(e.n / max), n: 'do total de orçamentos' }], ev); });
    });
    var nota = h('p', { cls: 'sub', text: 'Recebidos: pedidos pagos. Pedidos dos últimos 30 dias ainda estão a vencer.' }, box);
    nota.style.marginTop = '4px';
    tabelaViz(box.parentNode, ['Etapa', 'Quantidade', 'Valor', 'Conversão'], et.map(function (e, i) { return [e.nome, fN.format(e.n), brl(e.v), i ? pct(et[i - 1].n ? e.n / et[i - 1].n : 0) : '—']; }));
  }

  /* ---------- categorias (barra segmentada) ---------- */
  function renderCategoria() {
    var box = $('#viz-categoria'), W = box.clientWidth; if (!W) return; box.textContent = '';
    var ag = D.categorias.map(function (n, i) { return { i: i, nome: n, fat: 0, cus: 0 }; });
    C.curSemCat.forEach(function (r) { if (r.st >= 2) { ag[r.k].fat += r.val; ag[r.k].cus += r.cus; } });
    var tot = ag.reduce(function (a, b) { return a + b.fat; }, 0) || 1, sel = st.categoria !== '' ? +st.categoria : -1;
    var seg = h('div', { cls: 'seg', role: 'group', 'aria-label': 'Participação de cada categoria no faturamento' }, box);
    var larg = W - (ag.length - 1) * 2;
    function alterna(i) { st.categoria = sel === i ? '' : String(i); atualiza(); }
    ag.forEach(function (a) {
      var w = a.fat / tot * larg; if (w <= 0) return;
      var b = h('button', { type: 'button', 'aria-label': a.nome + ': ' + pct(a.fat / tot) + ' do faturamento. ' + (sel === a.i ? 'Remover filtro' : 'Filtrar por esta categoria') }, seg);
      b.style.flex = '0 0 ' + w + 'px'; b.style.background = 'var(--s' + (a.i + 1) + ')';
      if (a.i === 3 && !document.documentElement.matches('[data-theme="dark"]') && !(matchMedia('(prefers-color-scheme: dark)').matches && !document.documentElement.matches('[data-theme="light"]'))) b.classList.add('claro');
      var rot = pct(a.fat / tot, 0); if (w > rot.length * 8 + 14) b.textContent = rot;
      if (sel >= 0 && sel !== a.i) b.classList.add('esmaecido');
      b.addEventListener('click', function () { alterna(a.i); });
      comDica(b, function (e) { dica(a.nome, [{ cor: 'var(--s' + (a.i + 1) + ')', v: brl(a.fat), n: 'faturamento' }, { v: pct(a.fat / tot), n: 'participação' }, { v: pct(a.fat ? (a.fat - a.cus) / a.fat : 0), n: 'margem bruta' }], e); });
    });
    var lista = h('div', { cls: 'cat-lista' }, box);
    ag.forEach(function (a) {
      var b = h('button', { type: 'button', 'aria-pressed': String(sel === a.i) }, lista);
      h('i', {}, b).style.background = 'var(--s' + (a.i + 1) + ')';
      h('span', { text: a.nome }, b);
      h('span', { cls: 'n', text: brlC(a.fat) }, b);
      h('span', { cls: 'm', text: 'margem ' + pct(a.fat ? (a.fat - a.cus) / a.fat : 0) }, b);
      if (sel >= 0 && sel !== a.i) b.classList.add('esmaecido');
      b.addEventListener('click', function () { alterna(a.i); });
    });
    tabelaViz(box.parentNode, ['Categoria', 'Faturamento', 'Participação', 'Margem'], ag.map(function (a) { return [a.nome, brl(a.fat), pct(a.fat / tot), pct(a.fat ? (a.fat - a.cus) / a.fat : 0)]; }));
  }

  /* ---------- rankings ---------- */
  function ranking(box, itens, opts) {
    var W = box.clientWidth; if (!W) return; box.textContent = '';
    var linha = 44, bh = 14, max = itens.length ? itens[0].fat : 1, valW = 78;
    var sv = s('svg', { width: W, height: Math.max(40, itens.length * linha), role: 'group', 'aria-label': opts.aria }, box);
    if (!itens.length) s('text', { x: 0, y: 24, text: 'Sem vendas para os filtros escolhidos.' }, sv);
    itens.forEach(function (it, k) {
      var y = k * linha, g = s('g', {}, sv);
      if (opts.sel >= 0 && opts.sel !== it.id) g.classList.add('esmaecido');
      s('rect', { class: 'foco', x: 0, y: y + 1, width: W, height: linha - 4, rx: 8, fill: 'transparent', stroke: 'none' }, g);
      s('text', { class: 'mut', x: 0, y: y + 16, text: String(k + 1).padStart(2, '0') }, g);
      var nm = s('text', { x: 24, y: y + 16, text: it.nome, class: opts.sel === it.id ? 'forte' : '' }, g);
      if (it.extra && W > 430) s('text', { class: 'mut', x: W - 2, y: y + 16, 'text-anchor': 'end', text: it.extra }, g);
      var w = Math.max(2, (it.fat / max) * (W - 24 - valW));
      s('path', { class: 'barra', d: barraH(24, y + 23, w, bh), fill: 'var(--s1)' }, g);
      s('text', { class: 'forte', x: 24 + w + 8, y: y + 34, text: brlC(it.fat) }, g);
      if (opts.clica) ativavel(g, it.nome + ': ' + brl(it.fat) + '. ' + (opts.sel === it.id ? 'Remover filtro' : 'Filtrar por este vendedor'), function () { opts.clica(it); });
      else { g.setAttribute('tabindex', '0'); g.classList.add('alvo'); }
      comDica(g, function (e) { dica(it.nome, it.dica, e); });
      nm.textContent = it.nome;
    });
  }
  function renderProdutos() {
    var ag = {};
    C.cur.forEach(function (r) { if (r.st < 2) return; var a = ag[r.p] || (ag[r.p] = { id: r.p, fat: 0, cus: 0, q: 0, n: 0 }); a.fat += r.val; a.cus += r.cus; a.q += r.q; a.n++; });
    var lista = Object.keys(ag).map(function (k) { return ag[k]; }).sort(function (a, b) { return b.fat - a.fat; });
    var top = lista.slice(0, 10).map(function (a) { var p = D.produtos[a.id]; return { id: a.id, nome: p.nome, fat: a.fat, extra: D.categorias[p.k] + ' · margem ' + pct((a.fat - a.cus) / a.fat), dica: [{ cor: 'var(--s1)', v: brl(a.fat), n: 'faturamento' }, { v: fN.format(a.q), n: 'caixas/fardos' }, { v: pct((a.fat - a.cus) / a.fat), n: 'margem bruta' }, { v: D.categorias[p.k], n: '' }] }; });
    ranking($('#viz-produtos'), top, { aria: 'Ranking dos 10 produtos com maior faturamento', sel: -1 });
    tabelaViz($('#viz-produtos').parentNode, ['Produto', 'Faturamento', 'Volume', 'Margem'], lista.map(function (a) { return [D.produtos[a.id].nome, brl(a.fat), fN.format(a.q), pct((a.fat - a.cus) / a.fat)]; }));
  }
  function renderVendedores() {
    var ag = {};
    C.curSemVend.forEach(function (r) { var a = ag[r.v] || (ag[r.v] = { id: r.v, fat: 0, cus: 0, orc: 0, ped: 0 }); a.orc++; if (r.st >= 1) a.ped++; if (r.st >= 2) { a.fat += r.val; a.cus += r.cus; } });
    var lista = Object.keys(ag).map(function (k) { return ag[k]; }).sort(function (a, b) { return b.fat - a.fat; });
    var sel = st.vendedor !== '' ? +st.vendedor : -1;
    var itens = lista.map(function (a) { var v = D.vendedores[a.id]; return { id: a.id, nome: v.nome, fat: a.fat, extra: 'conversão ' + pct(a.ped / a.orc, 0) + ' · margem ' + pct(a.fat ? (a.fat - a.cus) / a.fat : 0), dica: [{ cor: 'var(--s1)', v: brl(a.fat), n: 'faturamento' }, { v: pct(a.ped / a.orc), n: 'orçamentos convertidos' }, { v: fN.format(a.ped), n: 'pedidos' }, { v: D.filiais[v.f].nome, n: '' }] }; });
    ranking($('#viz-vendedores'), itens, { aria: 'Ranking de vendedores por faturamento', sel: sel, clica: function (it) { st.vendedor = sel === it.id ? '' : String(it.id); atualiza(); } });
    tabelaViz($('#viz-vendedores').parentNode, ['Vendedor', 'Faturamento', 'Pedidos', 'Conversão', 'Margem'], lista.map(function (a) { return [D.vendedores[a.id].nome, brl(a.fat), fN.format(a.ped), pct(a.ped / a.orc), pct(a.fat ? (a.fat - a.cus) / a.fat : 0)]; }));
  }

  /* ---------- mapa de calor ---------- */
  function renderCalor() {
    var box = $('#viz-calor'), W = box.clientWidth; if (!W) return; box.textContent = '';
    var horas = []; for (var x = 7; x <= 18; x++) horas.push(x);
    var dias = [1, 2, 3, 4, 5, 6], mat = dias.map(function () { return horas.map(function () { return 0; }); });
    C.cur.forEach(function (r) { if (r.st >= 1 && r.w >= 1) mat[r.w - 1][r.h - 7]++; });
    var max = 0, maxPos = [0, 0], min = Infinity;
    mat.forEach(function (l, i) { l.forEach(function (v, j) { if (v > max) { max = v; maxPos = [i, j]; } if (v < min) min = v; }); });
    var lab = 40, topo = 22, gap = 2, cw = (W - lab) / horas.length, ch = W < 500 ? 30 : 38, Hh = topo + dias.length * ch + 46;
    var escuro = cssVar('--surface') === '#1a1a19';
    var rampa = escuro ? ['#1f2c3d', '#184f95', '#2a78d6', '#6da7ec', '#b7d3f6'] : ['#e3eefc', '#9ec5f4', '#3987e5', '#1c5cab', '#0d366b'];
    var lo = rampa[0], hi = rampa[4];
    function cor(t) { var x = t * 4, i = Math.min(3, Math.floor(x)); return mistura(rampa[i], rampa[i + 1], x - i); }
    var sv = s('svg', { width: W, height: Hh, role: 'group', 'aria-label': 'Mapa de calor de pedidos por dia da semana e hora. Pico: ' + DSEM[dias[maxPos[0]]] + ' às ' + horas[maxPos[1]] + 'h.' }, box);
    horas.forEach(function (hr, j) { if (W > 520 || j % 2 === 0) s('text', { class: 'mut', x: lab + j * cw + cw / 2, y: 14, 'text-anchor': 'middle', text: hr + 'h' }, sv); });
    dias.forEach(function (d, i) {
      s('text', { x: 0, y: topo + i * ch + ch / 2 + 4, text: DSEM[d] }, sv);
      horas.forEach(function (hr, j) {
        var v = mat[i][j], t = max ? Math.pow(v / max, 0.85) : 0;
        var g = s('g', { tabindex: 0 }, sv); g.classList.add('alvo');
        var cel = s('rect', { class: 'barra foco', x: lab + j * cw + gap / 2, y: topo + i * ch + gap / 2, width: cw - gap, height: ch - gap, rx: 4, fill: v ? cor(t) : 'var(--surface-2)' }, g);
        cel.setAttribute('aria-label', DSEM[d] + ' ' + hr + 'h: ' + v + ' pedidos');
        if (i === maxPos[0] && j === maxPos[1] && cw > 26) s('text', { x: lab + j * cw + cw / 2, y: topo + i * ch + ch / 2 + 4, 'text-anchor': 'middle', text: fN.format(v), style: 'fill:' + (t > 0.55 ? (escuro ? '#0b0b0b' : '#fff') : 'var(--ink)') + ';font-weight:600;font-size:11.5px' }, g);
        comDica(g, function (e) { dica(DSEM[d] + ', ' + hr + 'h às ' + (hr + 1) + 'h', [{ v: fN.format(v), n: 'pedidos' }, { v: pct(max ? v / max : 0, 0), n: 'do horário de pico' }], e); });
      });
    });
    // legenda de escala
    var ly = topo + dias.length * ch + 18, lw = Math.max(60, Math.min(220, W - lab - 46 - 140));
    var gid = 'grad-calor';
    var defs = s('defs', {}, sv), lg = s('linearGradient', { id: gid }, defs);
    rampa.forEach(function (c, i) { s('stop', { offset: (i * 25) + '%', 'stop-color': c }, lg); });
    s('text', { class: 'mut', x: lab, y: ly + 10, text: 'Menos' }, sv);
    s('rect', { x: lab + 46, y: ly, width: lw, height: 12, rx: 3, fill: 'url(#' + gid + ')' }, sv);
    s('text', { class: 'mut', x: lab + 52 + lw, y: ly + 10, text: 'Mais (' + fN.format(max) + ' pedidos)' }, sv);
    tabelaViz(box.parentNode, ['Dia'].concat(horas.map(function (x) { return x + 'h'; })), dias.map(function (d, i) { return [DSEM[d]].concat(mat[i].map(function (v) { return fN.format(v); })); }));
  }

  /* ---------- tabela detalhada ---------- */
  var COLS = [
    { k: 'id', t: 'Pedido', v: function (r) { return r.id; }, f: function (r) { return '#' + r.id; }, num: false },
    { k: 'd', t: 'Data', v: function (r) { return r.d * 100 + r.h; }, f: function (r) { return dataTxt(r.d); } },
    { k: 'f', t: 'Filial', v: function (r) { return D.filiais[r.f].nome; } },
    { k: 'v', t: 'Vendedor', v: function (r) { return D.vendedores[r.v].nome; } },
    { k: 'c', t: 'Cliente', v: function (r) { return D.clientes[r.c].nome; } },
    { k: 'p', t: 'Produto', v: function (r) { return D.produtos[r.p].nome; } },
    { k: 'k', t: 'Categoria', v: function (r) { return D.categorias[r.k]; } },
    { k: 'q', t: 'Qtd.', v: function (r) { return r.q; }, f: function (r) { return fN.format(r.q); }, num: true },
    { k: 'val', t: 'Valor', v: function (r) { return r.val; }, f: function (r) { return fBRL2.format(r.val); }, num: true },
    { k: 'mg', t: 'Margem', v: function (r) { return (r.val - r.cus) / r.val; }, f: function (r) { return pct((r.val - r.cus) / r.val); }, num: true },
    { k: 'st', t: 'Situação', v: function (r) { return situacao(r).t; } }
  ];
  function situacao(r) {
    if (r.st === 1) return { t: 'Cancelado', i: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="var(--muted)" stroke-width="1.5"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="var(--muted)" stroke-width="1.5" stroke-linecap="round"/></svg>' };
    if (r.st === 2) return { t: 'Faturado', i: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="2" width="11" height="12" rx="2" fill="none" stroke="var(--s1)" stroke-width="1.5"/><path d="M5.5 6h5M5.5 9h5" stroke="var(--s1)" stroke-width="1.5" stroke-linecap="round"/></svg>' };
    if (r.atr) return { t: 'Em atraso', i: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5l7 13H1z" fill="var(--critical)"/><path d="M8 6v4M8 11.8v.2" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>' };
    if (r.st === 3) return { t: 'A vencer', i: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="var(--warning)" stroke-width="2"/><path d="M8 4.5V8l2.5 1.5" fill="none" stroke="var(--ink-2)" stroke-width="1.5" stroke-linecap="round"/></svg>' };
    return { t: 'Recebido', i: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="var(--good)"/><path d="M4.8 8.2l2.2 2.2 4.2-4.6" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' };
  }
  function linhasTabela() {
    var q = st.busca.trim().toLowerCase();
    var rows = C.cur.filter(function (r) { return r.st >= 1; });
    if (q) rows = rows.filter(function (r) { return (String(r.id) + ' ' + D.clientes[r.c].nome + ' ' + D.produtos[r.p].nome + ' ' + D.vendedores[r.v].nome + ' ' + D.filiais[r.f].nome).toLowerCase().indexOf(q.replace('#', '')) >= 0; });
    var col = COLS.filter(function (c) { return c.k === st.ord.col; })[0], dir = st.ord.dir;
    rows.sort(function (a, b) { var x = col.v(a), y = col.v(b); return (typeof x === 'string' ? x.localeCompare(y, 'pt-BR') : x - y) * dir; });
    return rows;
  }
  function renderTabela() {
    var t = $('#tabela'), thead = $('thead', t), tbody = $('tbody', t);
    thead.textContent = ''; tbody.textContent = '';
    var tr = h('tr', {}, thead);
    COLS.forEach(function (c) {
      var th = h('th', { scope: 'col', cls: c.num ? 'num' : '' }, tr);
      th.setAttribute('aria-sort', st.ord.col === c.k ? (st.ord.dir > 0 ? 'ascending' : 'descending') : 'none');
      var b = h('button', { type: 'button', text: c.t }, th);
      b.addEventListener('click', function () { if (st.ord.col === c.k) st.ord.dir *= -1; else { st.ord.col = c.k; st.ord.dir = c.num || c.k === 'd' ? -1 : 1; } st.pg = 0; renderTabela(); });
    });
    var rows = linhasTabela(), por = 15, pags = Math.max(1, Math.ceil(rows.length / por));
    if (st.pg >= pags) st.pg = pags - 1;
    rows.slice(st.pg * por, st.pg * por + por).forEach(function (r) {
      var l = h('tr', {}, tbody);
      COLS.forEach(function (c) {
        var td = h('td', { cls: c.num ? 'num' : '' }, l);
        if (c.k === 'st') { var si = situacao(r), sp = h('span', { cls: 'status' }, td); sp.innerHTML = si.i; sp.appendChild(document.createTextNode(si.t)); }
        else td.textContent = c.f ? c.f(r) : c.v(r);
      });
    });
    if (!rows.length) { var v = h('tr', {}, tbody); h('td', { colspan: COLS.length, text: 'Nenhum pedido encontrado com esses filtros.' }, v); }
    var tot = rows.reduce(function (a, r) { return a + (r.st >= 2 ? r.val : 0); }, 0);
    $('#sub-tabela').textContent = fN.format(rows.length) + ' pedidos · ' + brl(tot) + ' faturados no período e filtros atuais';
    var pg = $('#paginacao'); pg.textContent = '';
    h('span', { text: 'Página ' + (st.pg + 1) + ' de ' + fN.format(pags) }, pg);
    var bx = h('div', {}, pg);
    var a = h('button', { type: 'button', text: '← Anterior' }, bx); a.disabled = st.pg === 0; a.addEventListener('click', function () { st.pg--; renderTabela(); });
    var p = h('button', { type: 'button', text: 'Próxima →' }, bx); p.disabled = st.pg >= pags - 1; p.addEventListener('click', function () { st.pg++; renderTabela(); });
  }
  function exportaCSV() {
    var rows = linhasTabela();
    var esc = function (x) { x = String(x); return /[;"\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; };
    var dec = function (v) { return v.toFixed(2).replace('.', ','); };
    var out = ['Pedido;Data;Hora;Região;Filial;Vendedor;Cliente;Produto;Categoria;Quantidade;Valor (R$);Custo (R$);Margem (%);Situação'];
    rows.forEach(function (r) { out.push([r.id, dataTxt(r.d), r.h + 'h', D.regioes[r.r], D.filiais[r.f].nome, D.vendedores[r.v].nome, D.clientes[r.c].nome, D.produtos[r.p].nome, D.categorias[r.k], r.q, dec(r.val), dec(r.cus), dec((r.val - r.cus) / r.val * 100), situacao(r).t].map(esc).join(';')); });
    var blob = new Blob(['﻿' + out.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'pedidos-rio-claro-' + st.periodo + 'm.csv'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ---------- chips e textos ---------- */
  function renderChips() {
    var box = $('#chips'); box.textContent = '';
    var itens = [];
    if (st.regiao !== '') itens.push(['Região', D.regioes[+st.regiao], function () { st.regiao = ''; st.filial = ''; }]);
    if (st.filial !== '') itens.push(['Filial', D.filiais[+st.filial].nome, function () { st.filial = ''; }]);
    if (st.categoria !== '') itens.push(['Categoria', D.categorias[+st.categoria], function () { st.categoria = ''; }]);
    if (st.vendedor !== '') itens.push(['Vendedor', D.vendedores[+st.vendedor].nome, function () { st.vendedor = ''; }]);
    itens.forEach(function (it) {
      var c = h('span', { cls: 'chip' }, box); c.appendChild(document.createTextNode(it[0] + ': ')); h('b', { text: it[1] }, c);
      var b = h('button', { type: 'button', 'aria-label': 'Remover filtro ' + it[0], text: '×' }, c);
      b.addEventListener('click', function () { it[2](); atualiza(); });
    });
    var per = $('#f-periodo').selectedOptions[0].text;
    box.setAttribute('data-resumo', per + (itens.length ? ' · filtros:' : ' · rede inteira'));
    $('#periodo-txt').textContent = 'Analisando ' + (st.periodo === 1 ? mesTxt(C.J.ini) : mesTxt(C.J.ini) + ' a ' + mesTxt(C.J.fim - 1)) + ' · dados até 31/10/2026';
    $('#btn-limpar').hidden = !itens.length;
  }

  /* ---------- ciclo ---------- */
  function desenha() {
    var p = st.pagina;
    if (p === 0) { renderKpis(); renderLinha(); renderFunil(); renderRegiao(); renderCategoria(); }
    if (p === 1) { renderProdutos(); renderVendedores(); renderCalor(); }
    if (p === 2) renderTabela();
  }
  var pend = null;
  function atualiza() {
    document.body.classList.add('carregando');
    clearTimeout(pend);
    pend = setTimeout(function () {
      preencheFiltros(); calcula(); renderChips(); desenha(); someDica();
      document.body.classList.remove('carregando');
    }, 16);
  }
  function irPagina(p, foco) {
    st.pagina = (p + 3) % 3;
    $$('.abas [role=tab]').forEach(function (b, i) { var on = i === st.pagina; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; if (on && foco) b.focus(); });
    $$('.pagina').forEach(function (s, i) { s.hidden = i !== st.pagina; s.classList.toggle('ativa', i === st.pagina); });
    $$('#apres-pontos button').forEach(function (b, i) { b.setAttribute('aria-current', i === st.pagina); });
    desenha();
  }

  /* ---------- eventos ---------- */
  $('#f-periodo').addEventListener('change', function (e) { st.periodo = +e.target.value; st.pg = 0; atualiza(); });
  $('#f-regiao').addEventListener('change', function (e) { st.regiao = e.target.value; st.filial = ''; st.vendedor = ''; atualiza(); });
  $('#f-filial').addEventListener('change', function (e) { st.filial = e.target.value; if (st.filial !== '') st.regiao = String(D.filiais[+st.filial].r); st.vendedor = ''; atualiza(); });
  $('#f-categoria').addEventListener('change', function (e) { st.categoria = e.target.value; atualiza(); });
  $('#f-vendedor').addEventListener('change', function (e) { st.vendedor = e.target.value; atualiza(); });
  $('#btn-limpar').addEventListener('click', function () { st.regiao = st.filial = st.categoria = st.vendedor = ''; atualiza(); });
  $$('.abas [role=tab]').forEach(function (b, i) {
    b.addEventListener('click', function () { irPagina(i); });
    b.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') irPagina(st.pagina + 1, true); if (e.key === 'ArrowLeft') irPagina(st.pagina - 1, true); });
  });
  $$('.btn-tab').forEach(function (b) { b.addEventListener('click', function () { var c = b.closest('.cartao'), on = !c.classList.contains('ver-tabela'); c.classList.toggle('ver-tabela', on); b.setAttribute('aria-pressed', on); b.textContent = on ? 'Gráfico' : 'Tabela'; }); });
  var bt;
  $('#busca').addEventListener('input', function (e) { clearTimeout(bt); bt = setTimeout(function () { st.busca = e.target.value; st.pg = 0; renderTabela(); }, 150); });
  $('#btn-csv').addEventListener('click', exportaCSV);
  $('#btn-tema').addEventListener('click', function () {
    var esc = document.documentElement.getAttribute('data-theme') === 'dark' || (!document.documentElement.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
    var novo = esc ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', novo);
    try { localStorage.setItem('rc-tema', novo); } catch (e) {}
    desenha();
  });

  // modo apresentação
  var APRES_MS = 12000, timer = null, t0 = 0, pausado = false, raf = null;
  var pontos = $('#apres-pontos');
  ['Visão geral', 'Vendas e equipe', 'Pedidos'].forEach(function (n, i) { var b = h('button', { type: 'button', text: (i + 1) + '. ' + n }, pontos); b.addEventListener('click', function () { irPagina(i); reinicia(); }); });
  function progresso() { var p = pausado ? 0 : Math.min(1, (performance.now() - t0) / APRES_MS); $('#apres-prog').style.width = (p * 100) + '%'; if (p >= 1) { irPagina(st.pagina + 1); reinicia(); } raf = requestAnimationFrame(progresso); }
  function reinicia() { t0 = performance.now(); }
  function entraApres() {
    document.body.classList.add('apresentando'); $('#apres-barra').hidden = false;
    var el = document.documentElement; if (el.requestFullscreen) el.requestFullscreen().catch(function () {});
    pausado = false; reinicia(); cancelAnimationFrame(raf); raf = requestAnimationFrame(progresso);
    irPagina(0); $('#apres-prox').focus();
  }
  function saiApres() {
    document.body.classList.remove('apresentando'); $('#apres-barra').hidden = true; cancelAnimationFrame(raf);
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
    setTimeout(desenha, 60);
  }
  $('#btn-apresentar').addEventListener('click', entraApres);
  $('#apres-sair').addEventListener('click', saiApres);
  $('#apres-prox').addEventListener('click', function () { irPagina(st.pagina + 1); reinicia(); });
  $('#apres-ant').addEventListener('click', function () { irPagina(st.pagina - 1); reinicia(); });
  $('#apres-pausa').addEventListener('click', function (e) {
    pausado = !pausado; var b = e.currentTarget; b.setAttribute('aria-label', pausado ? 'Retomar troca automática' : 'Pausar troca automática');
    b.innerHTML = pausado ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
    reinicia();
  });
  document.addEventListener('fullscreenchange', function () { if (!document.fullscreenElement && document.body.classList.contains('apresentando')) saiApres(); else setTimeout(desenha, 80); });
  document.addEventListener('keydown', function (e) {
    if (!document.body.classList.contains('apresentando')) return;
    if (e.key === 'Escape') saiApres();
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { irPagina(st.pagina + 1); reinicia(); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { irPagina(st.pagina - 1); reinicia(); }
  });

  // redesenha ao mudar o tamanho
  var rz, ultimaL = innerWidth;
  addEventListener('resize', function () { if (innerWidth === ultimaL) return; ultimaL = innerWidth; clearTimeout(rz); rz = setTimeout(desenha, 120); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', desenha);

  // parâmetros de URL para links diretos (ex.: ?pagina=1&tema=dark)
  var u = new URLSearchParams(location.search);
  if (u.get('tema')) document.documentElement.setAttribute('data-theme', u.get('tema'));
  if (u.get('periodo')) st.periodo = +u.get('periodo');
  if (u.get('regiao')) st.regiao = u.get('regiao');
  if (u.get('categoria')) st.categoria = u.get('categoria');
  if (u.get('tabela')) $$('.btn-tab')[+u.get('tabela')] && $$('.btn-tab')[+u.get('tabela')].click();
  preencheFiltros(); calcula(); renderChips();
  irPagina(+(u.get('pagina') || 0));
  if (u.get('apresentar')) { document.body.classList.add('apresentando'); $('#apres-barra').hidden = false; irPagina(+(u.get('pagina') || 0)); }
})();

/* Cristal Orçamentos · app (front-end puro, dados em localStorage) */
let db = loadDB();
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const SESS = 'cristal_sess';
const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

$$('.logo').forEach(e => e.innerHTML = LOGO_SVG);

function save() { saveDB(db); }
function prodMap() { return Object.fromEntries(db.produtos.map(p => [p.id, p])); }
function cliente(id) { return db.clientes.find(c => c.id === id) || { nome: '(cliente removido)', tel: '' }; }
function orc(id) { return db.orcamentos.find(o => o.id === id); }
function total(o) { return totais(o, db.produtos).total; }
function badge(s) { return `<span class="badge b-${s}">${STATUS[s]}</span>`; }
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2600); }
function vencido(o) { return o.status === 'enviado' && parseISO(o.validade) < parseISO(isoLocal(new Date())); }

/* ---------- login ---------- */
function logado() { try { return localStorage.getItem(SESS) === '1'; } catch (e) { return window._sess; } }
function setLogado(v) { try { v ? localStorage.setItem(SESS, '1') : localStorage.removeItem(SESS); } catch (e) { window._sess = v; } }
if (new URLSearchParams(location.search).has('auto')) setLogado(true);

$('#loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  if (f.u.value.trim().toLowerCase() === 'demo@cristal.app' && f.s.value === 'cristal123') {
    setLogado(true); $('#loginErro').hidden = true;
    if (!location.hash) location.hash = '#/painel';
    boot();
// atalho para capturas de tela: ?auto=1&abrir=wpp|pedido
(() => { const a = new URLSearchParams(location.search).get('abrir'); if (a && draft && draft.id) { const o = orc(draft.id); if (a === 'wpp') whats(o); if (a === 'pedido') converter(o); } })();
  } else $('#loginErro').hidden = false;
});
$('#btnSair').onclick = () => { setLogado(false); boot(); };
$('#btnReset').onclick = () => {
  if (!confirm('Apagar as alterações e voltar aos dados de exemplo?')) return;
  try { localStorage.removeItem(DB_KEY); } catch (e) { }
  db = loadDB(); route(); toast('Dados de exemplo restaurados.');
};

function boot() {
  const ok = logado();
  $('#login').hidden = ok; $('#app').hidden = !ok;
  if (ok) route();
}
window.addEventListener('hashchange', () => logado() && route());

/* ---------- roteador ---------- */
function route() {
  const [r, arg] = (location.hash.replace('#/', '') || 'painel').split('/');
  $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.r === r || (r === 'orcamento' && a.dataset.r === 'orcamentos')));
  $('#topAct').innerHTML = '';
  const v = $('#view');
  window.scrollTo(0, 0);
  ({ painel, orcamentos, orcamento: () => editor(arg), pedidos, clientes, produtos }[r] || painel)(v);
}
function head(crumb, titulo, acts = '') { $('#crumb').textContent = crumb; $('#titulo').textContent = titulo; $('#topAct').innerHTML = acts; }

/* ---------- painel ---------- */
function painel(v) {
  head('Visão geral', 'Painel', `<a class="btn primary" href="#/orcamento/novo">+ Novo orçamento</a>`);
  const hoje = new Date(), ym = isoLocal(hoje).slice(0, 7);
  const doMes = db.orcamentos.filter(o => o.data.startsWith(ym));
  const decididos = db.orcamentos.filter(o => o.status === 'aprovado' || o.status === 'recusado');
  const aprov = decididos.filter(o => o.status === 'aprovado');
  const taxa = decididos.length ? Math.round(aprov.length / decididos.length * 100) : 0;
  const abertos = db.orcamentos.filter(o => o.status === 'enviado');
  const vAberto = abertos.reduce((s, o) => s + total(o), 0);
  const aprovMes = doMes.filter(o => o.status === 'aprovado').reduce((s, o) => s + total(o), 0);
  const semPedido = db.orcamentos.filter(o => o.status === 'aprovado' && !o.pedido);
  const baixo = db.produtos.filter(p => p.estoque != null && p.estoque <= p.minimo);

  // série 6 meses
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const k = isoLocal(d).slice(0, 7);
    const os = db.orcamentos.filter(o => o.data.startsWith(k));
    meses.push({ rot: MES[d.getMonth()], orcado: os.reduce((s, o) => s + total(o), 0), aprovado: os.filter(o => o.status === 'aprovado').reduce((s, o) => s + total(o), 0) });
  }

  v.innerHTML = `
  <div class="kpis">
    <div class="kpi"><span>Orçamentos no mês</span><b>${doMes.length}</b><small>${brl(doMes.reduce((s, o) => s + total(o), 0))} orçados</small></div>
    <div class="kpi"><span>Taxa de aprovação</span><b>${taxa}%</b><small>${aprov.length} de ${decididos.length} respondidos</small><div class="meter"><i style="width:${taxa}%"></i></div></div>
    <div class="kpi accent"><span>Valor em aberto</span><b>${brl(vAberto)}</b><small>${abertos.length} aguardando o cliente</small></div>
    <div class="kpi"><span>Aprovado no mês</span><b>${brl(aprovMes)}</b><small>${semPedido.length} sem pedido gerado</small></div>
  </div>
  <div class="grid2">
    <section class="card">
      <div class="card-h"><h2>Orçado x aprovado</h2><div class="legend"><span><i class="lg-a"></i>Orçado</span><span><i class="lg-b"></i>Aprovado</span></div></div>
      ${grafico(meses)}
    </section>
    <section class="card">
      <div class="card-h"><h2>Precisa de atenção</h2></div>
      <ul class="alertas">
        ${semPedido.map(o => `<li><span class="dot ok"></span><div><b>${o.num}</b> aprovado, falta gerar o pedido<small>${esc(cliente(o.cliente).nome)} · ${brl(total(o))}</small></div><a class="btn sm" href="#/orcamento/${o.id}">Abrir</a></li>`).join('')}
        ${abertos.map(o => `<li><span class="dot ${vencido(o) ? 'bad' : 'wait'}"></span><div><b>${o.num}</b> ${vencido(o) ? 'venceu sem resposta' : 'aguardando resposta'}<small>${esc(cliente(o.cliente).nome)} · válido até ${fmtData(o.validade)}</small></div><a class="btn sm" href="#/orcamento/${o.id}">Abrir</a></li>`).join('')}
        ${baixo.map(p => `<li><span class="dot bad"></span><div><b>Estoque baixo</b> ${esc(p.nome)}<small>${num(p.estoque, 1)} ${UNIDADES[p.unidade]} (mínimo ${num(p.minimo, 0)})</small></div><a class="btn sm" href="#/produtos">Ver</a></li>`).join('')}
        ${!semPedido.length && !abertos.length && !baixo.length ? '<li class="vazio">Tudo em dia.</li>' : ''}
      </ul>
    </section>
  </div>
  <section class="card">
    <div class="card-h"><h2>Últimos orçamentos</h2><a class="linkbtn" href="#/orcamentos">Ver todos →</a></div>
    ${tabelaOrc(db.orcamentos.slice().reverse().slice(0, 6))}
  </section>`;
}

function grafico(m) {
  const W = 560, H = 230, pl = 52, pb = 28, pt = 12;
  const max = Math.max(...m.map(x => x.orcado), 1);
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / step) * step;
  const bw = (W - pl - 10) / m.length;
  const y = v => pt + (H - pt - pb) * (1 - v / top);
  let g = '';
  for (let i = 0; i <= 4; i++) {
    const val = top * i / 4, yy = y(val);
    g += `<line x1="${pl}" x2="${W - 6}" y1="${yy}" y2="${yy}" class="gl"/><text x="${pl - 8}" y="${yy + 4}" class="ax" text-anchor="end">${val >= 1000 ? Math.round(val / 1000) + ' mil' : Math.round(val)}</text>`;
  }
  m.forEach((x, i) => {
    const cx = pl + bw * i + bw / 2;
    g += `<rect x="${cx - 17}" y="${y(x.orcado)}" width="16" height="${y(0) - y(x.orcado)}" rx="3" class="bar-a"><title>Orçado em ${x.rot}: ${brl(x.orcado)}</title></rect>
          <rect x="${cx + 1}" y="${y(x.aprovado)}" width="16" height="${y(0) - y(x.aprovado)}" rx="3" class="bar-b"><title>Aprovado em ${x.rot}: ${brl(x.aprovado)}</title></rect>
          <text x="${cx}" y="${H - 8}" class="ax" text-anchor="middle">${x.rot}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de valor orçado e aprovado nos últimos 6 meses">${g}</svg>`;
}

function tabelaOrc(lista) {
  if (!lista.length) return '<p class="vazio">Nenhum orçamento encontrado.</p>';
  return `<div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Número</th><th>Cliente</th><th>Data</th><th>Validade</th><th class="r">Total</th><th>Status</th></tr></thead>
    <tbody>${lista.map(o => `<tr onclick="location.hash='#/orcamento/${o.id}'">
      <td><b>${o.num}</b>${o.pedido ? ' <span class="chip">pedido</span>' : ''}</td><td>${esc(cliente(o.cliente).nome)}</td>
      <td>${fmtData(o.data)}</td><td class="${vencido(o) ? 'venc' : ''}">${fmtData(o.validade)}</td>
      <td class="r"><b>${brl(total(o))}</b></td><td>${badge(o.status)}</td></tr>`).join('')}</tbody></table></div>`;
}

/* ---------- lista de orçamentos ---------- */
let filtro = { st: 'todos', q: '' };
function orcamentos(v) {
  head('Comercial', 'Orçamentos', `<a class="btn primary" href="#/orcamento/novo">+ Novo orçamento</a>`);
  const cont = s => s === 'todos' ? db.orcamentos.length : db.orcamentos.filter(o => o.status === s).length;
  v.innerHTML = `<section class="card">
    <div class="filtros">
      <div class="seg">${['todos', 'rascunho', 'enviado', 'aprovado', 'recusado'].map(s => `<button data-st="${s}" class="${filtro.st === s ? 'on' : ''}">${s === 'todos' ? 'Todos' : STATUS[s]} <small>${cont(s)}</small></button>`).join('')}</div>
      <input type="search" id="busca" placeholder="Buscar por cliente ou número" value="${esc(filtro.q)}">
    </div>
    <div id="lista"></div></section>`;
  const draw = () => {
    const q = filtro.q.toLowerCase();
    const l = db.orcamentos.filter(o => (filtro.st === 'todos' || o.status === filtro.st) && (!q || o.num.toLowerCase().includes(q) || cliente(o.cliente).nome.toLowerCase().includes(q))).reverse();
    $('#lista').innerHTML = tabelaOrc(l);
  };
  $$('.seg button', v).forEach(b => b.onclick = () => { filtro.st = b.dataset.st; orcamentos(v); });
  $('#busca').oninput = e => { filtro.q = e.target.value; draw(); };
  draw();
}

/* ---------- editor ---------- */
let draft = null;
function novoOrc() {
  const hoje = new Date();
  return { id: null, num: '(novo)', cliente: db.clientes[0]?.id || '', data: isoLocal(hoje), validade: isoLocal(addDays(hoje, 15)), prazo: 10, status: 'rascunho', descTipo: '%', desc: 0, frete: 0, pagamento: '50% na aprovação e 50% na instalação', obs: 'Medidas sujeitas a conferência no local antes da produção.', itens: [{ prod: db.produtos[0].id, p: db.produtos[0].preco, q: 1, l: 1, a: 1, c: 0 }], pedido: null };
}

function editor(id) {
  if (id === 'novo') draft = novoOrc();
  else { const o = orc(id); if (!o) { location.hash = '#/orcamentos'; return; } draft = JSON.parse(JSON.stringify(o)); }
  renderEditor();
}
function renderEditor() {
  const v = $('#view'), id = draft.id || 'novo';
  const ro = draft.status === 'aprovado' || draft.status === 'recusado';
  head('Orçamentos › ' + draft.num, id === 'novo' ? 'Novo orçamento' : 'Orçamento ' + draft.num, badge(draft.status));
  const pm = prodMap();
  const cats = [...new Set(db.produtos.map(p => p.cat))];
  const optProd = sel => cats.map(c => `<optgroup label="${esc(c)}">${db.produtos.filter(p => p.cat === c).map(p => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</optgroup>`).join('');

  v.innerHTML = `
  <div class="ed">
    <div class="ed-main">
      <section class="card">
        <div class="card-h"><h2>Cliente e condições</h2></div>
        <div class="form-grid">
          <label class="span2">Cliente<div class="row-in"><select id="fCli">${db.clientes.map(c => `<option value="${c.id}" ${c.id === draft.cliente ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select><button type="button" class="btn sm ghost" id="addCli">+ Novo</button></div></label>
          <label>Data<input type="date" id="fData" value="${draft.data}"></label>
          <label>Validade<input type="date" id="fVal" value="${draft.validade}"></label>
          <label>Prazo de entrega (dias úteis)<input type="number" min="0" id="fPrazo" value="${draft.prazo}"></label>
          <label>Pagamento<input id="fPag" value="${esc(draft.pagamento)}"></label>
        </div>
      </section>
      <section class="card">
        <div class="card-h"><h2>Itens</h2><small class="muted">Vidro e espelho por m² (com área mínima), perfil por metro, ferragem por unidade.</small></div>
        <div class="itens" id="itens">
          ${draft.itens.map((it, i) => {
            const p = pm[it.prod] || db.produtos[0];
            return `<div class="item" data-i="${i}">
              <label class="i-prod">Produto<select data-k="prod">${optProd(it.prod)}</select></label>
              ${p.unidade === 'm2' ? `<label class="i-dim">Largura (m)<input type="number" step="0.01" min="0" data-k="l" value="${it.l}"></label>
              <label class="i-dim">Altura (m)<input type="number" step="0.01" min="0" data-k="a" value="${it.a}"></label>` : p.unidade === 'ml' ? `<label class="i-dim">Compr. (m)<input type="number" step="0.01" min="0" data-k="c" value="${it.c}"></label><span class="i-dim gap"></span>` : `<span class="i-dim gap"></span><span class="i-dim gap"></span>`}
              <label class="i-q">Qtd<input type="number" min="1" step="1" data-k="q" value="${it.q}"></label>
              <label class="i-p">Preço (R$/${UNIDADES[p.unidade]})<input type="number" step="0.01" min="0" data-k="p" value="${it.p}"></label>
              <div class="i-sub"><span class="calc" data-calc></span><b data-sub></b></div>
              <button type="button" class="x" data-rm title="Remover item" aria-label="Remover item">×</button>
            </div>`;
          }).join('')}
        </div>
        <button type="button" class="btn ghost" id="addItem">+ Adicionar item</button>
      </section>
      <section class="card">
        <label class="full">Observações (saem no PDF)<textarea id="fObs" rows="3">${esc(draft.obs)}</textarea></label>
      </section>
    </div>
    <aside class="ed-side">
      <section class="card sticky">
        <div class="card-h"><h2>Resumo</h2></div>
        <div class="tot">
          <div><span>Subtotal</span><b id="tSub"></b></div>
          <div class="desc-row"><span>Desconto</span><div class="row-in"><input type="number" min="0" step="0.01" id="fDesc" value="${draft.desc}"><select id="fDescT"><option ${draft.descTipo === '%' ? 'selected' : ''}>%</option><option ${draft.descTipo === 'R$' ? 'selected' : ''}>R$</option></select></div></div>
          <div class="muted-row"><span></span><span id="tDesc"></span></div>
          <div class="desc-row"><span>Frete</span><div class="row-in"><input type="number" min="0" step="0.01" id="fFrete" value="${draft.frete}"></div></div>
          <div class="grand"><span>Total</span><b id="tTot"></b></div>
        </div>
        <div class="acts" id="acts"></div>
        ${draft.pedido ? `<p class="okbox">Pedido <b>${db.pedidos.find(p => p.id === draft.pedido)?.num}</b> gerado. Estoque já baixado.</p>` : ''}
        ${ro ? '<p class="muted tiny">Orçamento respondido: os campos ficam travados para manter o histórico.</p>' : ''}
      </section>
    </aside>
  </div>`;

  if (ro) $$('.ed input, .ed select, .ed textarea, #addItem, #addCli, [data-rm]', v).forEach(e => e.disabled = true);

  // ações por status
  const a = [];
  if (!ro) a.push(`<button class="btn primary" data-act="salvar">Salvar</button>`);
  if (draft.status === 'rascunho') a.push(`<button class="btn" data-act="enviar">Marcar como enviado</button>`);
  if (draft.status === 'enviado') a.push(`<button class="btn ok" data-act="aprovar">Cliente aprovou</button><button class="btn danger-g" data-act="recusar">Cliente recusou</button>`);
  if (draft.status === 'aprovado' && !draft.pedido) a.push(`<button class="btn ok" data-act="pedido">Converter em pedido</button>`);
  if (draft.status === 'recusado') a.push(`<button class="btn" data-act="reabrir">Reabrir como rascunho</button>`);
  a.push(`<div class="acts2"><button class="btn ghost" data-act="pdf">Gerar PDF</button><button class="btn wpp" data-act="wpp">WhatsApp</button></div>`);
  if (draft.id) a.push(`<button class="linkbtn" data-act="duplicar">Duplicar orçamento</button>`);
  $('#acts').innerHTML = a.join('');

  // eventos
  $('#itens').addEventListener('input', e => {
    const row = e.target.closest('.item'); if (!row) return;
    const k = e.target.dataset.k, i = +row.dataset.i;
    if (k === 'prod') {
      const p = pm[e.target.value]; draft.itens[i].prod = p.id; draft.itens[i].p = p.preco;
      if (p.unidade === 'ml' && !draft.itens[i].c) draft.itens[i].c = 1;
      if (p.unidade === 'm2' && !draft.itens[i].l) { draft.itens[i].l = 1; draft.itens[i].a = 1; }
      lerCampos(); renderEditor(); return;
    }
    draft.itens[i][k] = parseFloat(e.target.value) || 0; recalc();
  });
  $('#itens').addEventListener('click', e => {
    if (e.target.matches('[data-rm]')) {
      if (draft.itens.length === 1) return toast('O orçamento precisa de pelo menos um item.');
      draft.itens.splice(+e.target.closest('.item').dataset.i, 1); lerCampos(); reEditor();
    }
  });
  $('#addItem').onclick = () => { const p = db.produtos[0]; draft.itens.push({ prod: p.id, p: p.preco, q: 1, l: 1, a: 1, c: 0 }); lerCampos(); reEditor(); };
  $('#addCli').onclick = () => formCliente(null, c => { draft.cliente = c.id; lerCampos(true); reEditor(); });
  ['fDesc', 'fDescT', 'fFrete'].forEach(i => $('#' + i).addEventListener('input', () => { lerCampos(); recalc(); }));
  $('#acts').onclick = e => { const b = e.target.closest('[data-act]'); if (b) acao(b.dataset.act); };
  recalc();
}
function reEditor() { renderEditor(); }
function lerCampos(skipCli) {
  if (!skipCli) draft.cliente = $('#fCli').value;
  draft.data = $('#fData').value; draft.validade = $('#fVal').value;
  draft.prazo = +$('#fPrazo').value || 0; draft.pagamento = $('#fPag').value; draft.obs = $('#fObs').value;
  draft.desc = parseFloat($('#fDesc').value) || 0; draft.descTipo = $('#fDescT').value; draft.frete = parseFloat($('#fFrete').value) || 0;
}
function recalc() {
  const pm = prodMap();
  $$('#itens .item').forEach(row => {
    const it = draft.itens[+row.dataset.i], p = pm[it.prod];
    const mr = medidaCobrada(it, p);
    let txt = '';
    if (p.unidade === 'm2') {
      const area = it.l * it.a;
      txt = `${num(mr)} m²${area > 0 && area < p.areaMin ? ' (mín. ' + num(p.areaMin) + ')' : ''}`;
    } else if (p.unidade === 'ml') txt = `${num(mr)} m`;
    else txt = `${it.q} un`;
    $('[data-calc]', row).textContent = txt + ' × ' + brl(it.p);
    $('[data-sub]', row).textContent = brl(subtotalItem(it, p));
  });
  const t = totais(draft, db.produtos);
  $('#tSub').textContent = brl(t.sub);
  $('#tDesc').textContent = t.desc ? '− ' + brl(t.desc) : '';
  $('#tTot').textContent = brl(t.total);
}

function persistir() {
  lerCampos();
  if (!draft.id) {
    db.seq.orc++;
    draft.id = 'o' + Date.now().toString(36);
    draft.num = 'ORC-' + new Date().getFullYear() + '-' + pad(db.seq.orc, 4);
    db.orcamentos.push(draft);
  } else {
    const i = db.orcamentos.findIndex(o => o.id === draft.id);
    db.orcamentos[i] = draft;
  }
  save();
  return draft;
}

function acao(act) {
  const ro = draft.status === 'aprovado' || draft.status === 'recusado';
  if (!ro && act !== 'duplicar') persistir();
  const o = orc(draft.id);
  switch (act) {
    case 'salvar': toast('Orçamento salvo.'); break;
    case 'enviar': o.status = 'enviado'; save(); toast('Marcado como enviado.'); break;
    case 'aprovar': o.status = 'aprovado'; save(); toast('Aprovado! Agora gere o pedido.'); break;
    case 'recusar': o.status = 'recusado'; save(); toast('Marcado como recusado.'); break;
    case 'reabrir': o.status = 'rascunho'; save(); toast('Voltou para rascunho.'); break;
    case 'pedido': return converter(o);
    case 'pdf': history.replaceState(null, '', '#/orcamento/' + o.id); window.open('orcamento.html?id=' + encodeURIComponent(o.id), '_blank'); return;
    case 'wpp': return whats(o);
    case 'duplicar': {
      const c = JSON.parse(JSON.stringify(o));
      db.seq.orc++; c.id = 'o' + Date.now().toString(36); c.num = 'ORC-' + new Date().getFullYear() + '-' + pad(db.seq.orc, 4);
      c.status = 'rascunho'; c.pedido = null; c.data = isoLocal(new Date()); c.validade = isoLocal(addDays(new Date(), 15));
      db.orcamentos.push(c); save(); toast('Cópia criada como rascunho.'); location.hash = '#/orcamento/' + c.id; return;
    }
  }
  if (location.hash !== '#/orcamento/' + o.id) location.hash = '#/orcamento/' + o.id; else editor(o.id);
}

function converter(o) {
  const pm = prodMap();
  const baixa = {};
  o.itens.forEach(it => { const p = pm[it.prod]; if (p && p.estoque != null) baixa[p.id] = (baixa[p.id] || 0) + medidaReal(it, p); });
  const linhas = Object.entries(baixa).map(([id, q]) => {
    const p = pm[id], fica = p.estoque - q;
    return `<tr><td>${esc(p.nome)}</td><td class="r">${num(p.estoque, 2)}</td><td class="r">− ${num(q, 2)}</td><td class="r ${fica < 0 ? 'neg' : fica <= p.minimo ? 'warn' : ''}"><b>${num(fica, 2)} ${UNIDADES[p.unidade]}</b></td></tr>`;
  }).join('');
  const falta = Object.entries(baixa).some(([id, q]) => pm[id].estoque - q < 0);
  modal(`<h2>Converter em pedido</h2>
    <p class="muted">${o.num} · ${esc(cliente(o.cliente).nome)} · ${brl(total(o))}</p>
    <p>Ao confirmar, o sistema cria o pedido e dá baixa no estoque:</p>
    <div class="tbl-wrap"><table class="tbl mini"><thead><tr><th>Material</th><th class="r">Atual</th><th class="r">Baixa</th><th class="r">Fica</th></tr></thead><tbody>${linhas || '<tr><td colspan="4">Só serviços, sem baixa de estoque.</td></tr>'}</tbody></table></div>
    ${falta ? '<p class="erro">Atenção: algum material vai ficar negativo. Confirme só se a compra já foi feita.</p>' : ''}
    <div class="modal-act"><button class="btn ghost" data-close>Cancelar</button><button class="btn ok" id="okPed">Gerar pedido</button></div>`);
  $('#okPed').onclick = () => {
    Object.entries(baixa).forEach(([id, q]) => { const p = db.produtos.find(x => x.id === id); p.estoque = Math.round((p.estoque - q) * 100) / 100; });
    db.seq.ped++;
    const pd = { id: 'd' + Date.now().toString(36), num: 'PED-' + pad(db.seq.ped, 4), orc: o.id, data: isoLocal(new Date()), status: 'Em produção' };
    db.pedidos.push(pd); o.pedido = pd.id; save(); closeModal();
    toast(pd.num + ' gerado e estoque atualizado.'); editor(o.id);
  };
}

function msgWhats(o) {
  const pm = prodMap(), c = cliente(o.cliente), t = totais(o, db.produtos);
  const nome = c.nome.split(' ')[0];
  const linhas = o.itens.map(it => { const p = pm[it.prod]; const m = descMedidas(it, p); return `• ${it.q}x ${p.nome}${m ? ' (' + m + ')' : ''}: ${brl(subtotalItem(it, p))}`; }).join('\n');
  return `${/\(fict/.test(c.nome) ? 'Olá, tudo bem?' : 'Olá, ' + nome + '!'} Aqui é da ${EMPRESA.nome}.\nSegue o orçamento *${o.num}*:\n\n${linhas}\n\n` +
    (t.desc ? `Desconto: − ${brl(t.desc)}\n` : '') + (t.frete ? `Frete e instalação: ${brl(t.frete)}\n` : '') +
    `*Total: ${brl(t.total)}*\n\nPagamento: ${o.pagamento}\nPrazo: ${o.prazo} dias úteis após a aprovação\nVálido até ${fmtData(o.validade)}\n\nO PDF com todos os detalhes vai logo abaixo. Qualquer dúvida, é só chamar!`;
}
function whats(o) {
  const c = cliente(o.cliente), msg = msgWhats(o);
  const fone = '55' + (c.tel || '').replace(/\D/g, '');
  modal(`<h2>Enviar por WhatsApp</h2>
    <p class="muted">Para ${esc(c.nome)} · ${esc(c.tel)}</p>
    <div class="wpp-prev"><div class="bubble">${esc(msg).replace(/\*(.+?)\*/g, '<b>$1</b>').replace(/\n/g, '<br>')}</div></div>
    <p class="tiny muted">Demonstração: o número do cliente é fictício. No uso real, o PDF vai junto pelo WhatsApp Business.</p>
    <div class="modal-act"><button class="btn ghost" id="cpMsg">Copiar texto</button><a class="btn wpp" id="abrirW" target="_blank" rel="noopener" href="https://wa.me/${fone}?text=${encodeURIComponent(msg)}">Abrir no WhatsApp</a></div>`);
  $('#cpMsg').onclick = () => { navigator.clipboard?.writeText(msg).then(() => toast('Mensagem copiada.'), () => toast('Não deu para copiar aqui.')); };
  $('#abrirW').onclick = () => { if (o.status === 'rascunho') { o.status = 'enviado'; save(); } closeModal(); setTimeout(() => editor(o.id), 50); };
}

/* ---------- pedidos ---------- */
function pedidos(v) {
  head('Produção', 'Pedidos');
  const l = db.pedidos.slice().reverse();
  v.innerHTML = `<section class="card">${l.length ? `<div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Pedido</th><th>Orçamento</th><th>Cliente</th><th>Data</th><th class="r">Valor</th><th>Situação</th></tr></thead>
    <tbody>${l.map(p => { const o = orc(p.orc); return `<tr>
      <td><b>${p.num}</b></td><td><a href="#/orcamento/${o.id}">${o.num}</a></td><td>${esc(cliente(o.cliente).nome)}</td><td>${fmtData(p.data)}</td>
      <td class="r"><b>${brl(total(o))}</b></td>
      <td><select class="mini-sel" data-p="${p.id}">${['Em produção', 'Pronto para instalar', 'Instalado'].map(s => `<option ${s === p.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td></tr>`; }).join('')}
    </tbody></table></div>` : '<p class="vazio">Nenhum pedido ainda. Aprove um orçamento e converta.</p>'}</section>`;
  $$('[data-p]', v).forEach(s => s.onchange = () => { db.pedidos.find(p => p.id === s.dataset.p).status = s.value; save(); toast('Situação atualizada.'); });
}

/* ---------- clientes ---------- */
function clientes(v) {
  head('Cadastros', 'Clientes', `<button class="btn primary" id="nCli">+ Novo cliente</button>`);
  $('#nCli').onclick = () => formCliente(null, () => clientes(v));
  v.innerHTML = `<section class="card"><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Nome</th><th>WhatsApp</th><th>E-mail</th><th>Bairro</th><th class="r">Orçamentos</th><th class="r">Aprovado</th><th></th></tr></thead>
    <tbody>${db.clientes.map(c => { const os = db.orcamentos.filter(o => o.cliente === c.id); return `<tr>
      <td><b>${esc(c.nome)}</b></td><td>${esc(c.tel)}</td><td>${esc(c.email)}</td><td>${esc(c.cidade)}</td>
      <td class="r">${os.length}</td><td class="r">${brl(os.filter(o => o.status === 'aprovado').reduce((s, o) => s + total(o), 0))}</td>
      <td class="r"><button class="btn sm ghost" data-ed="${c.id}">Editar</button></td></tr>`; }).join('')}</tbody></table></div></section>`;
  $$('[data-ed]', v).forEach(b => b.onclick = () => formCliente(b.dataset.ed, () => clientes(v)));
}
function formCliente(id, done) {
  const c = id ? db.clientes.find(x => x.id === id) : { nome: '', tel: '', email: '', cidade: '', doc: '' };
  modal(`<h2>${id ? 'Editar cliente' : 'Novo cliente'}</h2><form id="fc" class="form-grid">
    <label class="span2">Nome<input name="nome" required value="${esc(c.nome)}"></label>
    <label>WhatsApp<input name="tel" placeholder="(11) 90000-0000" value="${esc(c.tel)}"></label>
    <label>E-mail<input name="email" type="email" value="${esc(c.email)}"></label>
    <label>Bairro<input name="cidade" value="${esc(c.cidade)}"></label>
    <label>CPF/CNPJ<input name="doc" value="${esc(c.doc)}"></label>
    <div class="modal-act span2"><button type="button" class="btn ghost" data-close>Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
  $('#fc').onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    let obj;
    if (id) { obj = Object.assign(c, d); } else { obj = { id: 'c' + Date.now().toString(36), ...d }; db.clientes.push(obj); }
    save(); closeModal(); toast('Cliente salvo.'); done && done(obj);
  };
}

/* ---------- produtos ---------- */
function produtos(v) {
  head('Cadastros', 'Produtos e estoque', `<button class="btn primary" id="nProd">+ Novo produto</button>`);
  $('#nProd').onclick = () => formProduto(null, () => produtos(v));
  v.innerHTML = `<section class="card"><div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>Produto</th><th>Categoria</th><th>Cobrança</th><th class="r">Preço</th><th class="r">Estoque</th><th></th></tr></thead>
    <tbody>${db.produtos.map(p => {
      const est = p.estoque == null ? '<span class="muted">serviço</span>' : `<span class="${p.estoque <= p.minimo ? 'warn' : ''}">${num(p.estoque, p.unidade === 'un' ? 0 : 1)} ${UNIDADES[p.unidade]}</span>${p.estoque <= p.minimo ? ' <span class="chip red">repor</span>' : ''}`;
      return `<tr><td><b>${esc(p.nome)}</b>${p.unidade === 'm2' && p.areaMin ? `<small class="sub">área mínima cobrada: ${num(p.areaMin)} m²</small>` : ''}</td><td>${esc(p.cat)}</td><td>${UNIDADE_NOME[p.unidade]}</td>
      <td class="r"><b>${brl(p.preco)}</b></td><td class="r">${est}</td><td class="r"><button class="btn sm ghost" data-ed="${p.id}">Editar</button></td></tr>`;
    }).join('')}</tbody></table></div></section>`;
  $$('[data-ed]', v).forEach(b => b.onclick = () => formProduto(b.dataset.ed, () => produtos(v)));
}
function formProduto(id, done) {
  const p = id ? db.produtos.find(x => x.id === id) : { nome: '', cat: 'Vidros', unidade: 'm2', preco: 0, estoque: 0, minimo: 0, areaMin: 0 };
  modal(`<h2>${id ? 'Editar produto' : 'Novo produto'}</h2><form id="fp" class="form-grid">
    <label class="span2">Nome<input name="nome" required value="${esc(p.nome)}"></label>
    <label>Categoria<input name="cat" value="${esc(p.cat)}"></label>
    <label>Cobrança<select name="unidade">${Object.entries(UNIDADE_NOME).map(([k, t]) => `<option value="${k}" ${k === p.unidade ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <label>Preço (R$)<input name="preco" type="number" step="0.01" min="0" value="${p.preco}"></label>
    <label>Área mínima (m²)<input name="areaMin" type="number" step="0.01" min="0" value="${p.areaMin || 0}"></label>
    <label>Estoque atual<input name="estoque" type="number" step="0.01" placeholder="vazio = serviço" value="${p.estoque ?? ''}"></label>
    <label>Estoque mínimo<input name="minimo" type="number" step="0.01" min="0" value="${p.minimo}"></label>
    <div class="modal-act span2"><button type="button" class="btn ghost" data-close>Cancelar</button><button class="btn primary">Salvar</button></div></form>`);
  $('#fp').onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const obj = { nome: d.nome, cat: d.cat, unidade: d.unidade, preco: +d.preco || 0, areaMin: +d.areaMin || 0, estoque: d.estoque === '' ? null : +d.estoque, minimo: +d.minimo || 0 };
    if (id) Object.assign(p, obj); else db.produtos.push({ id: 'p' + Date.now().toString(36), ...obj });
    save(); closeModal(); toast('Produto salvo.'); done && done();
  };
}

/* ---------- modal ---------- */
function modal(html) { $('#modalBody').innerHTML = html; $('#modal').hidden = false; setTimeout(() => $('#modalBody input, #modalBody button')?.focus(), 30); }
function closeModal() { $('#modal').hidden = true; }
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal' || e.target.matches('[data-close]')) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

boot();
// atalho para capturas de tela: ?auto=1&abrir=wpp|pedido
(() => { const a = new URLSearchParams(location.search).get('abrir'); if (a && draft && draft.id) { const o = orc(draft.id); if (a === 'wpp') whats(o); if (a === 'pedido') converter(o); } })();

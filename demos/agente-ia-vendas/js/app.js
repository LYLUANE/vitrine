/* Casa & Obra (marca fictícia) · interface do chat e do painel de bastidores */
(function () {
  'use strict';
  const A = window.Agente;
  const D = window.CASA_OBRA_DADOS;
  const $ = (s) => document.querySelector(s);
  const msgs = $('#msgs'), log = $('#log'), sugs = $('#sugs'), form = $('#form'), txt = $('#txt'), btn = $('#enviar');
  const params = new URLSearchParams(location.search);
  const RAPIDO = params.has('rapido');
  const espera = (ms) => (RAPIDO ? Promise.resolve() : new Promise((r) => setTimeout(r, ms)));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const hora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const CENARIOS = [
    { t: 'Orçamento de obra', d: 'Três itens, frete pelo CEP e PDF', m: ['Oi! Preciso de 40 sacos de cimento CP II, 3 m³ de areia média e 2 milheiros de tijolo baiano. CEP 13560-210. Me passa o orçamento?', 'Pode fechar o pedido', 'Sim, confirmo', 'Agendar para sábado de manhã'] },
    { t: 'Desconto alto demais', d: 'Cliente pede 20%; o teto é 8%', m: ['Quero 60 sacos de argamassa AC-III e 10 latas de tinta acrílica 18L. Faz 20% de desconto?'] },
    { t: 'Produto que não existe', d: 'Ele não inventa preço nem prazo', m: ['Vocês têm porcelanato 120x120 marmorizado?'] },
    { t: 'Status e entrega', d: 'Consulta o pedido e agenda', m: ['Qual o status do pedido 48213? Dá pra entregar no sábado de manhã?'] },
    { t: 'Reclamação', d: 'Vai para uma pessoa, com resumo', m: ['Recebi 5 sacos de cimento empedrado, que absurdo! Pedido 47990.'] }
  ];

  let turnos = 0, nFer = 0, nGr = 0, ocupado = false;
  const grCont = {};

  /* cenários */
  const cl = $('#cenarios');
  CENARIOS.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'cen'; b.type = 'button';
    b.innerHTML = '<span class="n">0' + (i + 1) + '</span><b>' + esc(c.t) + '</b><span>' + esc(c.d) + '</span>';
    b.addEventListener('click', () => rodarCenario(i));
    cl.appendChild(b);
  });

  function limpar() {
    A.reset();
    msgs.innerHTML = '<div class="dia">Hoje</div>';
    log.innerHTML = '';
    sugs.innerHTML = '';
    turnos = nFer = nGr = 0;
    Object.keys(grCont).forEach((k) => delete grCont[k]);
    document.querySelectorAll('#grs li').forEach((li) => { li.classList.remove('on'); li.querySelector('em').textContent = '0×'; });
    contadores(); tabela();
  }

  async function rodarCenario(i) {
    if (ocupado) return;
    document.querySelectorAll('.cen').forEach((b, j) => b.classList.toggle('ativo', i === j));
    limpar();
    const passos = RAPIDO ? Math.min(Number(params.get('passos') || 1), CENARIOS[i].m.length) : 1;
    for (let k = 0; k < passos; k++) await enviar(CENARIOS[i].m[k]);
    if (window.matchMedia('(max-width:1060px)').matches && !RAPIDO) $('.chat').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* chat */
  function bolha(quem, html) {
    const d = document.createElement('div');
    d.className = 'b ' + quem;
    d.innerHTML = html + '<span class="h">' + hora() + '</span>';
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  function cardOrcamento(o) {
    const li = o.itens.map((i) => '<li><span>' + i.qtd.toLocaleString('pt-BR') + ' × ' + esc(i.nome.split(',')[0]) + '</span><span>' + A.brl(i.total) + '</span></li>').join('');
    return '<div class="orc-card"><div class="t"><span>' + esc(o.numero) + '</span><span>' + o.itens.length + ' itens</span></div><ul>' + li +
      (o.desconto ? '<li><span>Desconto ' + o.desconto_percentual + '%</span><span>− ' + A.brl(o.desconto) + '</span></li>' : '') +
      '<li><span>Frete</span><span>' + (o.semFrete ? 'a calcular' : (o.frete ? A.brl(o.frete) : 'grátis')) + '</span></li></ul>' +
      '<div class="tot"><span>Total</span><span>' + A.brl(o.total) + '</span></div>' +
      '<button type="button" data-orc="' + esc(o.numero) + '">Abrir orçamento em PDF</button></div>';
  }
  const orcs = {};
  msgs.addEventListener('click', (e) => {
    const b = e.target.closest('[data-orc]');
    if (!b) return;
    const w = window.open('', '_blank');
    if (!w) { alert('O navegador bloqueou a janela. Libere pop-ups para ver o PDF.'); return; }
    w.document.open(); w.document.write(window.htmlOrcamento(orcs[b.dataset.orc])); w.document.close();
    w.focus(); setTimeout(() => { try { w.print(); } catch (_) {} }, 400);
  });

  function mostrarSugestoes(lista) {
    sugs.innerHTML = '';
    lista.forEach((s) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'sug'; b.textContent = s;
      b.addEventListener('click', () => enviar(s));
      sugs.appendChild(b);
    });
  }

  /* painel */
  function jsonHtml(o) {
    // JSON compacto: objetos e listas curtos ficam numa linha só
    const fmt = (v, ind) => {
      const one = JSON.stringify(v);
      if (one === undefined) return undefined;
      if (v === null || typeof v !== 'object' || one.length <= (ind > 0 ? 96 : 64)) return one.replace(/,"/g, ', "').replace(/":/g, '": ');
      const pad = '  '.repeat(ind + 1), fim = '  '.repeat(ind);
      if (Array.isArray(v)) return '[\n' + v.map((x) => pad + fmt(x, ind + 1)).join(',\n') + '\n' + fim + ']';
      return '{\n' + Object.keys(v).filter((k) => v[k] !== undefined).map((k) => pad + JSON.stringify(k) + ': ' + fmt(v[k], ind + 1)).join(',\n') + '\n' + fim + '}';
    };
    const s = fmt(o, 0);
    return esc(s).replace(/(&quot;(?:[^&]|&(?!quot;))*?&quot;)(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g, (m, str, col, bool, n) => {
      if (str) return col ? '<span class="j-k">' + str + '</span>' + col : '<span class="j-s">' + str + '</span>';
      if (bool) return '<span class="j-b">' + bool + '</span>';
      return '<span class="j-n">' + n + '</span>';
    });
  }

  function passoHtml(s) {
    if (s.tipo === 'intencao') {
      const ent = Object.keys(s.entidades).length ? '<div class="rot">entidades extraídas</div><pre>' + jsonHtml(s.entidades) + '</pre>' : '';
      return '<div class="passo"><div class="passo-cab"><span class="tag int">intenção</span><div class="chips">' + s.nomes.map((n) => '<span class="chip">' + esc(n) + '</span>').join('') + '</div></div>' + ent + '</div>';
    }
    if (s.tipo === 'ferramenta') {
      return '<div class="passo"><div class="passo-cab"><span class="tag fer">ferramenta</span><code>' + esc(s.nome) + '()</code><span class="ms">' + s.ms + ' ms</span></div>' +
        '<div class="rot">argumentos</div><pre>' + jsonHtml(s.args) + '</pre><div class="rot">resultado</div><pre>' + jsonHtml(s.res) + '</pre></div>';
    }
    if (s.tipo === 'guardrail') return '<div class="passo gr"><div class="passo-cab"><span class="tag gr">trava</span><code>' + esc(s.titulo) + '</code></div><p>' + esc(s.detalhe) + '</p></div>';
    if (s.tipo === 'nota') return '<div class="passo nota"><div class="passo-cab"><span class="tag nota">nota</span></div><p>' + esc(s.texto) + '</p></div>';
    if (s.tipo === 'resposta') return '<div class="passo res"><div class="passo-cab"><span class="tag res">resposta final</span></div><p>' + md(s.texto) + '</p></div>';
    return '';
  }

  function contadores() {
    $('#c-turnos').textContent = turnos; $('#c-fer').textContent = nFer; $('#c-gr').textContent = nGr;
  }

  function acenderTrava(id) {
    const li = document.querySelector('#grs li[data-gr="' + id + '"]');
    if (!li) return;
    grCont[id] = (grCont[id] || 0) + 1;
    li.classList.add('on'); li.classList.remove('pisca'); void li.offsetWidth; li.classList.add('pisca');
    li.querySelector('em').textContent = grCont[id] + '×';
  }

  function tabela(mudou) {
    const est = A.estoque;
    $('#tab').innerHTML = D.produtos.map((p) => '<tr' + (mudou && mudou.includes(p.sku) ? ' class="mudou"' : '') + '><td>' + esc(p.nome) + '<br><code>' + p.sku + '</code></td><td class="num">' + A.brl(p.preco) + '<br><code>/' + esc(p.unidade) + '</code></td><td class="num">' + est[p.sku].toLocaleString('pt-BR') + '</td></tr>').join('');
  }

  async function enviar(texto) {
    texto = (texto || '').trim();
    if (!texto || ocupado) return;
    ocupado = true; btn.disabled = true; sugs.innerHTML = '';
    bolha('eu', esc(texto));
    const r = A.processar(texto);
    turnos++;
    const vazio = $('#vazio'); if (vazio) vazio.remove();
    const turno = document.createElement('div');
    turno.className = 'turno';
    turno.innerHTML = '<div class="turno-tit">turno ' + turnos + ' · ' + hora() + '</div>';
    log.appendChild(turno);
    $('#status-chat').textContent = 'digitando…';
    const dig = document.createElement('div');
    dig.className = 'digitando'; dig.innerHTML = '<i></i><i></i><i></i>';
    msgs.appendChild(dig); msgs.scrollTop = msgs.scrollHeight;

    for (const s of r.steps) {
      if (s.tipo === 'entrada') continue;
      await espera(s.tipo === 'ferramenta' ? Math.min(s.ms * 1.6, 650) : 380);
      turno.insertAdjacentHTML('beforeend', passoHtml(s));
      if (s.tipo === 'ferramenta') nFer++;
      if (s.tipo === 'guardrail') { nGr++; acenderTrava(s.id); }
      contadores();
      log.scrollTop = log.scrollHeight;
    }
    dig.remove();
    $('#status-chat').textContent = 'online';
    let html = md(r.resposta);
    if (r.anexo && r.anexo.tipo === 'orcamento') { orcs[r.anexo.o.numero] = r.anexo.o; html += cardOrcamento(r.anexo.o); }
    bolha('ele', html);
    if (r.steps.some((s) => s.nome === 'registrar_pedido')) {
      const skus = r.steps.find((s) => s.nome === 'registrar_pedido') && (A.estado.orcamento ? A.estado.orcamento.itens.map((i) => i.sku) : []);
      tabela(skus);
    }
    mostrarSugestoes(r.sugestoes);
    ocupado = false; btn.disabled = false;
    if (!RAPIDO && !matchMedia('(pointer:coarse)').matches) txt.focus({ preventScroll: true });
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); const v = txt.value; txt.value = ''; enviar(v); });

  tabela();
  mostrarSugestoes(['Bom dia!', 'Tem argamassa AC-III?', 'Status do pedido 48102']);
  const c = params.get('cenario');
  if (c) rodarCenario(Number(c) - 1);
})();

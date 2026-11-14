/* Alba Studio · e-mail marketing (projeto demonstrativo, marca fictícia) */
(function () {
  'use strict';
  const E = window.EMAILS || [];
  const V = window.VALIDACAO || [];
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } },
  };

  /* ---------------- pré-visualização ---------------- */
  const st = { i: 0, device: 'desktop', tema: 'claro', semImg: false };
  const frame = $('#frame'), device = $('#device'), stage = $('#stage');
  const sizer = document.createElement('div');
  sizer.className = 'sizer';
  stage.insertBefore(sizer, device);
  sizer.appendChild(device);

  $('#mailList').innerHTML = E.map((e, i) => `<li><button type="button" data-i="${i}">
      <span class="n">${String(i + 1).padStart(2, '0')}</span><b>${esc(e.nome)}</b><small>${esc(e.quando)}</small></button></li>`).join('');

  function srcdoc(e) {
    let h = e.html.replace('<head>', '<head><base href="emails/"><style>a{pointer-events:none;cursor:default}</style>');
    h = h.replace('@media (prefers-color-scheme: dark)', st.tema === 'escuro' ? '@media all' : '@media not all');
    if (st.semImg) h = h.replace(/src="img\//g, 'src="img/bloqueada/');
    return h;
  }

  function fit() {
    const mob = st.device === 'mobile';
    const w = mob ? 395 : 600, h = mob ? 750 : 794;
    device.style.width = w + 'px';
    const cs = getComputedStyle(stage);
    const avail = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const s = Math.min(1, avail / w);
    device.style.transform = s < 1 ? `scale(${s})` : '';
    sizer.style.width = w * s + 'px';
    sizer.style.height = h * s + 'px';
  }

  function render() {
    const e = E[st.i];
    if (!e) return;
    document.querySelectorAll('#mailList button').forEach((b) => b.setAttribute('aria-current', String(+b.dataset.i === st.i)));
    device.classList.toggle('mobile', st.device === 'mobile');
    $('#deviceUrl').textContent = st.device === 'mobile' ? '' : 'Pré-visualização · 600 px';
    frame.srcdoc = srcdoc(e);
    $('#inboxSub').textContent = e.assunto;
    $('#inboxPre').textContent = e.pre;
    const v = V.find((x) => x.arquivo === e.slug + '.html');
    const okN = v ? v.regras.filter((r) => r.ok).length : 0;
    $('#mailInfo').innerHTML = `<h3>${esc(e.nome)}</h3>
      <dl>
        <div><dt>Gatilho</dt><dd>${esc(e.gatilho)}</dd></div>
        <div><dt>Quando sai</dt><dd>${esc(e.quando)}</dd></div>
        <div><dt>Objetivo</dt><dd>${esc(e.objetivo)}</dd></div>
        <div><dt>Assunto</dt><dd>${esc(e.assunto)}</dd></div>
        <div><dt>Pré-cabeçalho</dt><dd>${esc(e.pre)}</dd></div>
      </dl>
      ${v ? `<div><p class="checks-title">Validação automática <span>${okN} de ${v.regras.length} ok</span></p>
        <ul class="checks">${v.regras.slice(0, 5).map((r) => `<li class="${r.ok ? '' : 'bad'}">${esc(r.regra)}</li>`).join('')}
        <li class="more"><details><summary>Ver as ${v.regras.length - 5} outras</summary><ul class="checks" style="border:0;padding-top:8px">
        ${v.regras.slice(5).map((r) => `<li class="${r.ok ? '' : 'bad'}">${esc(r.regra)}${r.nota ? ` · ${esc(r.nota)}` : ''}</li>`).join('')}</ul></details></li></ul>
        <p class="phone-cap" style="margin-top:12px">${v.kb} KB · ${v.imagens} imagens · ${v.links} links · ${v.estilos_inline} estilos inline</p></div>` : ''}`;
    fit();
  }

  $('#mailList').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-i]');
    if (b) { st.i = +b.dataset.i; render(); }
  });
  document.querySelectorAll('.seg').forEach((g) => g.addEventListener('click', (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    g.querySelectorAll('button').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    st[g.dataset.grupo] = b.dataset.v;
    render();
  }));
  $('#semImg').addEventListener('change', (ev) => { st.semImg = ev.target.checked; render(); });
  window.addEventListener('resize', fit);

  /* ---------------- ver código ---------------- */
  function highlight(src) {
    const re = /(<!--[\s\S]*?-->)|(<\/?[\w:!]+)((?:\s+[\w:-]+(?:="[^"]*")?)*)(\s*\/?>)|([^<]+)|(<)/g;
    let out = '', m;
    while ((m = re.exec(src))) {
      if (m[1]) out += `<span class="hl-c">${esc(m[1])}</span>`;
      else if (m[2]) {
        out += `<span class="hl-t">${esc(m[2])}</span>`;
        out += esc(m[3]).replace(/([\w:-]+)(=&quot;[\s\S]*?&quot;)?/g, (x, a, v) => `<span class="hl-a">${a}</span>${v ? `<span class="hl-v">${v}</span>` : ''}`);
        out += `<span class="hl-t">${esc(m[4])}</span>`;
      } else out += esc(m[5] || m[6]);
    }
    return out;
  }
  const dlg = $('#codeDlg');
  $('#verCodigo').addEventListener('click', () => {
    const e = E[st.i];
    $('#codeTitle').textContent = `${e.slug}.html`;
    $('#codeBox').innerHTML = highlight(e.html);
    $('#dlCode').href = `emails/${e.slug}.html`;
    $('#copyCode').textContent = 'Copiar';
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  });
  $('#closeCode').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (ev) => { if (ev.target === dlg) dlg.close(); });
  $('#copyCode').addEventListener('click', async () => {
    const txt = E[st.i].html;
    let ok = false;
    try { await navigator.clipboard.writeText(txt); ok = true; } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = txt; document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
      ta.remove();
    }
    $('#copyCode').textContent = ok ? 'Copiado' : 'Use o Baixar';
  });

  /* ---------------- régua (fluxograma) ---------------- */
  // tipo: trig | wait | cond | mail | act | end ; c = coluna, r = linha ; m = índice do e-mail
  const FLOWS = [
    {
      id: 'boas', nome: 'Boas-vindas', titulo: 'Boas-vindas com cupom',
      texto: 'Começa no cadastro e tenta levar à primeira compra em até uma semana, sem insistir com quem já comprou.',
      regras: ['Quem compra sai da régua na hora e vai para o pós-compra.', 'Quem não abriu recebe o mesmo e-mail com outro assunto, uma vez só.', 'O cupom tem código único por pessoa, gerado pela loja.'],
      plataforma: 'Gatilho “entrou na lista” no Klaviyo, Brevo ou RD Station; no Shopify Email, automação de boas-vindas.',
      nodes: [
        { id: 'a', t: 'trig', c: 1.5, r: 0, txt: 'Cadastro na newsletter', sub: 'site, pop-up ou checkout' },
        { id: 'b', t: 'mail', c: 1.5, r: 1, txt: '01 · Boas-vindas com cupom', m: 0 },
        { id: 'c', t: 'wait', c: 1.5, r: 2, txt: 'Espera 2 dias' },
        { id: 'd', t: 'cond', c: 1.5, r: 3, txt: 'Comprou com o cupom?' },
        { id: 'e', t: 'act', c: 0, r: 4, txt: 'Tag cliente-novo', sub: 'sai desta régua' },
        { id: 'f', t: 'cond', c: 2.5, r: 4, txt: 'Abriu o e-mail 01?' },
        { id: 'g', t: 'end', c: 0, r: 5.4, txt: 'Vai para o pós-compra' },
        { id: 'h', t: 'mail', c: 2, r: 5.4, txt: 'Cupom vence amanhã', sub: 'variação do 01', m: 0 },
        { id: 'i', t: 'mail', c: 3, r: 5.4, txt: 'Reenvio, outro assunto', sub: 'mesmo template', m: 0 },
        { id: 'j', t: 'end', c: 2.5, r: 6.6, txt: 'Lista de novidades' },
      ],
      edges: [['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'e', 'sim'], ['d', 'f', 'não'], ['e', 'g'], ['f', 'h', 'sim'], ['f', 'i', 'não'], ['h', 'j'], ['i', 'j']],
      path: ['a', 'b', 'c', 'd', 'f', 'h', 'j'],
    },
    {
      id: 'carrinho', nome: 'Carrinho abandonado', titulo: 'Carrinho abandonado',
      texto: 'A loja avisa a plataforma quando alguém sai do checkout com peças na sacola. São no máximo dois e-mails, e a compra para tudo na hora.',
      regras: ['Checa a compra antes de cada envio, para não cobrar quem já pagou.', 'O segundo e-mail muda pelo comportamento: quem clicou recebe ajuda, quem não abriu recebe o frete grátis.', 'Sem desconto automático no carrinho, para não ensinar a abandonar.'],
      plataforma: 'Evento “checkout iniciado” da Shopify, Nuvemshop ou VTEX enviado ao Klaviyo, RD Station ou Brevo.',
      nodes: [
        { id: 'a', t: 'trig', c: 1, r: 0, txt: 'Saiu do checkout', sub: 'com peças na sacola' },
        { id: 'b', t: 'wait', c: 1, r: 1, txt: 'Espera 1 hora' },
        { id: 'c', t: 'cond', c: 1, r: 2, txt: 'Comprou nesse tempo?' },
        { id: 'd', t: 'end', c: 0, r: 3, txt: 'Sai da régua' },
        { id: 'e', t: 'mail', c: 1, r: 3, txt: '02 · Carrinho abandonado', m: 1 },
        { id: 'f', t: 'wait', c: 1, r: 4, txt: 'Espera 24 horas' },
        { id: 'g', t: 'cond', c: 1, r: 5, txt: 'Comprou?' },
        { id: 'h', t: 'end', c: 0, r: 6, txt: 'Vai para o pós-compra' },
        { id: 'i', t: 'cond', c: 2, r: 6, txt: 'Clicou no e-mail 02?' },
        { id: 'k', t: 'mail', c: 1.5, r: 7.2, txt: 'Dúvida de tamanho?', sub: 'WhatsApp em destaque', m: 1 },
        { id: 'l', t: 'mail', c: 2.5, r: 7.2, txt: 'Último lembrete', sub: 'frete grátis no pedido', m: 1 },
        { id: 'm', t: 'end', c: 2, r: 8.4, txt: 'Fim · sacola liberada em 48 h' },
      ],
      edges: [['a', 'b'], ['b', 'c'], ['c', 'd', 'sim'], ['c', 'e', 'não'], ['e', 'f'], ['f', 'g'], ['g', 'h', 'sim'], ['g', 'i', 'não'], ['i', 'k', 'sim'], ['i', 'l', 'não'], ['k', 'm'], ['l', 'm']],
      path: ['a', 'b', 'c', 'e', 'f', 'g', 'i', 'k', 'm'],
    },
    {
      id: 'lanc', nome: 'Lançamento', titulo: 'Lançamento de coleção',
      texto: 'Campanha com data marcada, só para quem está engajado. O teste A/B roda numa parte da lista e o assunto vencedor vai para o resto.',
      regras: ['Segmento: abriu ou clicou nos últimos 90 dias (protege a reputação do domínio).', 'Teste em 30% da lista, vencedor pela taxa de cliques em 3 horas.', 'Quem clicou e não comprou recebe as peças mais vistas, uma vez.'],
      plataforma: 'Campanha com teste A/B nativo no Mailchimp, Klaviyo, Brevo ou RD Station.',
      nodes: [
        { id: 'a', t: 'trig', c: 1, r: 0, txt: 'Terça, 10h', sub: 'data da coleção' },
        { id: 'b', t: 'act', c: 1, r: 1, txt: 'Segmento engajado', sub: 'abriu ou clicou em 90 dias' },
        { id: 'c', t: 'mail', c: 0.4, r: 2.2, txt: 'Assunto A · 15%', sub: 'teste', m: 2 },
        { id: 'd', t: 'mail', c: 1.6, r: 2.2, txt: 'Assunto B · 15%', sub: 'teste', m: 2 },
        { id: 'e', t: 'wait', c: 1, r: 3.4, txt: 'Espera 3 horas', sub: 'mede os cliques' },
        { id: 'f', t: 'mail', c: 1, r: 4.4, txt: '03 · Vencedor para 70%', m: 2 },
        { id: 'g', t: 'wait', c: 1, r: 5.4, txt: 'Espera 2 dias' },
        { id: 'h', t: 'cond', c: 1, r: 6.4, txt: 'Clicou e não comprou?' },
        { id: 'i', t: 'mail', c: 0.4, r: 7.6, txt: 'Peças mais vistas', sub: 'da coleção', m: 2 },
        { id: 'j', t: 'end', c: 1.6, r: 7.6, txt: 'Fim da campanha' },
      ],
      edges: [['a', 'b'], ['b', 'c'], ['b', 'd'], ['c', 'e'], ['d', 'e'], ['e', 'f'], ['f', 'g'], ['g', 'h'], ['h', 'i', 'sim'], ['h', 'j', 'não']],
      path: ['a', 'b', 'd', 'e', 'f', 'g', 'h', 'i'],
    },
    {
      id: 'pos', nome: 'Pós-compra', titulo: 'Pós-compra e avaliação',
      texto: 'Pede a avaliação quando a peça já foi usada, não no dia da entrega. Depois sugere o que combina com o que a pessoa comprou.',
      regras: ['A nota vem só de quem comprou, ligada ao número do pedido.', 'No máximo um lembrete de avaliação.', 'As sugestões usam a categoria do pedido, não uma vitrine genérica.'],
      plataforma: 'Status “entregue” da loja (Shopify, Nuvemshop, VTEX ou planilha da transportadora) via integração ou webhook.',
      nodes: [
        { id: 'a', t: 'trig', c: 1, r: 0, txt: 'Pedido entregue', sub: 'status vindo da loja' },
        { id: 'b', t: 'wait', c: 1, r: 1, txt: 'Espera 7 dias' },
        { id: 'c', t: 'mail', c: 1, r: 2, txt: '04 · Pós-compra', sub: 'pedido de avaliação', m: 3 },
        { id: 'd', t: 'cond', c: 1, r: 3, txt: 'Avaliou?' },
        { id: 'e', t: 'act', c: 0, r: 4, txt: 'Nota publicada', sub: 'e obrigada por e-mail' },
        { id: 'f', t: 'wait', c: 2, r: 4, txt: 'Espera 4 dias' },
        { id: 'g', t: 'mail', c: 2, r: 5, txt: 'Lembrete curto', sub: 'um só', m: 3 },
        { id: 'h', t: 'wait', c: 1, r: 6.2, txt: 'Espera 30 dias' },
        { id: 'i', t: 'cond', c: 1, r: 7.2, txt: 'Comprou de novo?' },
        { id: 'j', t: 'act', c: 0, r: 8.4, txt: 'Segmento recorrente' },
        { id: 'k', t: 'mail', c: 2, r: 8.4, txt: 'Combina com seu pedido', sub: 'sugestões', m: 3 },
      ],
      edges: [['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'e', 'sim'], ['d', 'f', 'não'], ['f', 'g'], ['e', 'h'], ['g', 'h'], ['h', 'i'], ['i', 'j', 'sim'], ['i', 'k', 'não']],
      path: ['a', 'b', 'c', 'd', 'f', 'g', 'h', 'i', 'k'],
    },
    {
      id: 'reat', nome: 'Reativação', titulo: 'Reativação de inativos',
      texto: 'Tenta trazer de volta quem sumiu e, se não houver resposta, tira a pessoa da lista ativa. Lista menor e engajada entrega melhor.',
      regras: ['Entra quem não compra há 120 dias e não abre e-mail há 60.', 'Oferece ritmo menor antes de oferecer a saída.', 'Sem resposta em 14 dias: sai dos disparos (supressão), sem apagar o histórico.'],
      plataforma: 'Segmento dinâmico no Klaviyo, RD Station, Brevo ou Mailchimp, com a data da última compra vinda da loja.',
      nodes: [
        { id: 'a', t: 'trig', c: 1, r: 0, txt: 'Entrou no segmento', sub: '120 dias sem comprar' },
        { id: 'b', t: 'mail', c: 1, r: 1, txt: '05 · Reativação', sub: 'cupom VOLTA15', m: 4 },
        { id: 'c', t: 'wait', c: 1, r: 2, txt: 'Espera 5 dias' },
        { id: 'd', t: 'cond', c: 1, r: 3, txt: 'Abriu ou clicou?' },
        { id: 'e', t: 'act', c: 0, r: 4, txt: 'Volta à lista ativa' },
        { id: 'f', t: 'mail', c: 2, r: 4, txt: 'Ainda quer receber?', sub: 'variação C do assunto', m: 4 },
        { id: 'g', t: 'wait', c: 2, r: 5, txt: 'Espera 14 dias' },
        { id: 'h', t: 'cond', c: 2, r: 6, txt: 'Clicou em algo?' },
        { id: 'i', t: 'act', c: 1, r: 7.2, txt: 'Ajusta a frequência' },
        { id: 'j', t: 'end', c: 2.6, r: 7.2, txt: 'Sai da lista ativa', sub: 'supressão' },
      ],
      edges: [['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'e', 'sim'], ['d', 'f', 'não'], ['f', 'g'], ['g', 'h'], ['h', 'i', 'sim'], ['h', 'j', 'não']],
      path: ['a', 'b', 'c', 'd', 'f', 'g', 'h', 'j'],
    },
  ];

  const NW = 188, NH = 62, CW = 212, RH = 98, PAD = 22;
  const ICON = {
    trig: 'M9 1 3 9h4l-1 6 6-8H8z',
    wait: 'M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm0 2v4l3 2',
    cond: 'M8 1.5 14.5 8 8 14.5 1.5 8z',
    mail: 'M2 4h12v8H2zM2 4l6 5 6-5',
    act: 'M2 8.5V2.5h6l6 6-6 6zM5.5 5.5h.01',
    end: 'M3 3h10v10H3z',
  };
  const STY = {
    trig: { fill: '#B0603C', stroke: '#B0603C', tx: '#fff', sub: '#F6DCCB' },
    wait: { fill: '#25221E', stroke: '#9C9385', tx: '#EDE6DA', sub: '#A79E90', dash: '5 4' },
    cond: { fill: '#3A342D', stroke: '#E0A383', tx: '#fff', sub: '#CFC6B8' },
    mail: { fill: '#EDE6DA', stroke: '#EDE6DA', tx: '#1F1D1A', sub: '#6E685F' },
    act: { fill: '#4F6B47', stroke: '#4F6B47', tx: '#fff', sub: '#D5E2CF' },
    end: { fill: 'none', stroke: '#8B8274', tx: '#CFC6B8', sub: '#8B8274' },
  };
  const NS = 'http://www.w3.org/2000/svg';
  const svg = $('#flowSvg');
  let flowIdx = 0, tokenTimer = null;

  function wrap(t, max) {
    const out = []; let line = '';
    t.split(' ').forEach((w) => {
      if ((line + ' ' + w).trim().length > max && line) { out.push(line); line = w; } else line = (line + ' ' + w).trim();
    });
    if (line) out.push(line);
    return out;
  }
  const px = (n) => PAD + n.c * CW + NW / 2;
  const py = (n) => PAD + n.r * RH + NH / 2;

  function shape(n, s) {
    const x = px(n) - NW / 2, y = py(n) - NH / 2;
    if (n.t === 'cond') {
      const k = 14;
      return `<polygon class="box" points="${x + k},${y} ${x + NW - k},${y} ${x + NW},${y + NH / 2} ${x + NW - k},${y + NH} ${x + k},${y + NH} ${x},${y + NH / 2}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="1.5"/>`;
    }
    const rx = n.t === 'wait' || n.t === 'end' ? NH / 2 : n.t === 'mail' ? 4 : 7;
    return `<rect class="box" x="${x}" y="${y}" width="${NW}" height="${NH}" rx="${rx}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="1.5" ${s.dash ? `stroke-dasharray="${s.dash}"` : ''}/>`;
  }

  function edgePath(a, b) {
    const x1 = px(a), y1 = py(a) + NH / 2, x2 = px(b), y2 = py(b) - NH / 2;
    if (Math.abs(x1 - x2) < 1) return { d: `M${x1} ${y1} V${y2}`, lx: x1, ly: y1 + 15 };
    const my = (b.r - a.r) > 1.5 ? y2 - 18 : (y1 + y2) / 2;
    const sx = Math.sign(x2 - x1), r = 8;
    const d = `M${x1} ${y1} V${my - r} Q${x1} ${my} ${x1 + sx * r} ${my} H${x2 - sx * r} Q${x2} ${my} ${x2} ${my + r} V${y2}`;
    return { d, lx: x1 + sx * 44, ly: my };
  }

  function drawFlow(animate) {
    const f = FLOWS[flowIdx];
    const byId = Object.fromEntries(f.nodes.map((n) => [n.id, n]));
    const maxC = Math.max(...f.nodes.map((n) => n.c)), maxR = Math.max(...f.nodes.map((n) => n.r));
    const W = PAD * 2 + maxC * CW + NW, H = PAD * 2 + maxR * RH + NH;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W);
    svg.style.maxWidth = '100%';
    svg.style.minWidth = Math.min(W, 680) + 'px';
    const D = (r) => (animate ? (r * 0.16).toFixed(2) : 0);
    let edges = '', labels = '', nodes = '';
    f.edges.forEach(([a, b, lab]) => {
      const p = edgePath(byId[a], byId[b]);
      const dl = (+D(byId[a].r) + 0.25).toFixed(2);
      edges += `<path class="edge" d="${p.d}" style="animation-delay:${dl}s" marker-end="url(#arr)"/><path class="edge-flow" d="${p.d}" style="animation-delay:0s,${(+dl + 0.5).toFixed(2)}s"/>`;
      if (lab) {
        const cls = lab === 'sim' ? 'sim' : 'nao';
        labels += `<g class="edge-label ${cls} node${animate ? '' : ' static'}" style="animation-delay:${(+dl + 0.3).toFixed(2)}s"><rect x="${p.lx - 17}" y="${p.ly - 10}" width="34" height="20" rx="10"/><text x="${p.lx}" y="${p.ly + 4}" text-anchor="middle">${lab}</text></g>`;
      }
    });
    f.nodes.forEach((n) => {
      const s = STY[n.t];
      const x = px(n) - NW / 2, cy = py(n);
      const lines = wrap(n.txt, n.t === 'cond' ? 18 : 21).slice(0, 2);
      const all = lines.length + (n.sub ? 1 : 0);
      let ty = cy - (all - 1) * 7.5 + 4.5;
      const tx = x + (n.t === 'cond' ? 38 : 36);
      let t = lines.map((l) => { const r = `<text x="${tx}" y="${ty}" fill="${s.tx}" font-size="12.5" font-weight="600">${esc(l)}</text>`; ty += 15; return r; }).join('');
      if (n.sub) t += `<text x="${tx}" y="${ty}" fill="${s.sub}" font-size="11">${esc(n.sub)}</text>`;
      const ix = x + (n.t === 'cond' ? 18 : 14), iy = cy - 8;
      const icon = `<path d="${ICON[n.t]}" transform="translate(${ix} ${iy})" fill="none" stroke="${n.t === 'mail' ? '#8E4B2E' : s.tx}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
      const mail = n.t === 'mail' ? ` tabindex="0" role="button" data-m="${n.m}" aria-label="Ver o template ${esc(E[n.m] ? E[n.m].nome : '')}"` : '';
      const ver = n.t === 'mail' ? `<text x="${x + NW - 10}" y="${cy - NH / 2 + 14}" text-anchor="end" fill="#8E4B2E" font-size="9.5" font-weight="700" letter-spacing="1">VER</text>` : '';
      nodes += `<g class="node ${n.t}${animate ? '' : ' static'}" style="animation-delay:${D(n.r)}s"${mail}>${shape(n, s)}${icon}${t}${ver}</g>`;
    });
    // caminho do contato (bolinha que percorre a régua)
    let tok = '';
    if (f.path) {
      let d = '';
      for (let i = 0; i < f.path.length - 1; i++) {
        const p = edgePath(byId[f.path[i]], byId[f.path[i + 1]]).d;
        d += i === 0 ? p : ' L' + p.slice(1);
      }
      tok = `<circle class="token" r="5.5" cx="0" cy="0" opacity="0"><animateMotion id="tokMove" dur="${f.path.length * 0.85}s" repeatCount="indefinite" begin="indefinite" path="${d}"/></circle>`;
    }
    svg.classList.toggle('ani', !!animate);
    svg.innerHTML = `<title>Fluxograma: ${esc(f.titulo)}</title><defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 9 5 1 9" fill="none" stroke="#8B8274" stroke-width="1.6"/></marker></defs>${edges}${labels}${nodes}${tok}`;
    svg.querySelectorAll('.edge').forEach((p) => p.style.setProperty('--len', Math.ceil(p.getTotalLength())));
    const sc = $('#flowScroll');
    sc.scrollLeft = (sc.scrollWidth - sc.clientWidth) / 2;
    clearTimeout(tokenTimer);
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (f.path && !reduce) {
      tokenTimer = setTimeout(() => {
        const c = svg.querySelector('.token'), a = svg.querySelector('#tokMove');
        if (c && a && a.beginElement) { c.setAttribute('opacity', '1'); a.beginElement(); }
      }, animate ? maxR * 160 + 900 : 200);
    }
    $('#flowSide').innerHTML = `<p class="kicker" style="margin-bottom:8px">Fluxo ${flowIdx + 1} de ${FLOWS.length}</p><h3>${esc(f.titulo)}</h3><p>${esc(f.texto)}</p>
      <h4>Regras</h4><ul>${f.regras.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
      <h4>Na plataforma</h4><p style="margin:0">${esc(f.plataforma)}</p>
      <button type="button" class="replay" id="replay">Rever a animação</button>`;
    $('#replay').addEventListener('click', () => drawFlow(true));
  }

  const tabs = $('#flowTabs');
  tabs.innerHTML = FLOWS.map((f, i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-f="${i}">${esc(f.nome)}</button>`).join('');
  tabs.addEventListener('click', (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    flowIdx = +b.dataset.f;
    tabs.querySelectorAll('button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    drawFlow(true);
  });
  function abreEmail(m) {
    st.i = m; render();
    document.getElementById('emails').scrollIntoView({ behavior: 'smooth' });
  }
  svg.addEventListener('click', (ev) => { const g = ev.target.closest('[data-m]'); if (g) abreEmail(+g.dataset.m); });
  svg.addEventListener('keydown', (ev) => { const g = ev.target.closest('[data-m]'); if (g && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); abreEmail(+g.dataset.m); } });

  // anima quando a régua aparece na tela
  let flowSeen = false;
  if ('IntersectionObserver' in window) {
    drawFlow(false);
    svg.querySelectorAll('.node').forEach((n) => n.classList.add('static'));
    new IntersectionObserver((ents, obs) => {
      if (ents.some((e) => e.isIntersecting) && !flowSeen) { flowSeen = true; drawFlow(true); obs.disconnect(); }
    }, { threshold: 0.25 }).observe(svg);
  } else drawFlow(false);

  /* ---------------- A/B ---------------- */
  $('#abGrid').innerHTML = E.map((e, i) => `<article class="ab-card" data-i="${i}">
      <h3>${esc(e.nome)}</h3><p class="meta">${esc(e.objetivo)}</p>
      <div class="ab-opts">${e.ab.map(([l, s, h], j) => `<button type="button" class="ab-opt" aria-pressed="${j === 0}" data-j="${j}">
        <span class="l">${l}</span><span class="s">${esc(s)}</span><span class="c ${s.length > 40 ? 'long' : ''}">${s.length} car.</span><span class="h">${esc(h)}</span></button>`).join('')}</div>
      <div class="phone-row" aria-label="Prévia na caixa de entrada do celular"><span class="avatar" aria-hidden="true">A</span><div><p><b>Alba Studio</b></p><p class="ps">${esc(e.ab[0][1])}</p><p class="pp">${esc(e.pre)}</p></div></div>
      <p class="phone-cap">Prévia na caixa de entrada do celular</p>
      <p class="ab-rule"><b>Como decide:</b> ${esc(e.teste)}</p>
    </article>`).join('') + `<article class="ab-card ab-how"><h3>Como eu rodo o teste</h3><p class="meta">O mesmo método nos cinco e-mails.</p><ol>
      <li><span><b>Uma ideia por vez</b>Muda só o assunto. Remetente, horário e conteúdo ficam iguais.</span></li>
      <li><span><b>Amostra que dá para confiar</b>Lista pequena testa 50/50 por mais tempo; lista grande testa numa parte e manda o vencedor ao resto.</span></li>
      <li><span><b>Métrica certa</b>Clique, pedido ou avaliação. A abertura sozinha engana: o Apple Mail carrega as imagens sozinho e infla esse número.</span></li>
      <li><span><b>Registro do vencedor</b>O que ganhou vira padrão no próximo e-mail do mesmo tipo.</span></li></ol></article>`;
  $('#abGrid').addEventListener('click', (ev) => {
    const b = ev.target.closest('.ab-opt');
    if (!b) return;
    const card = b.closest('.ab-card'), e = E[+card.dataset.i];
    card.querySelectorAll('.ab-opt').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $('.ps', card).textContent = e.ab[+b.dataset.j][1];
  });

  /* ---------------- checklist de entregabilidade ---------------- */
  const CHECK = [
    { g: 'Autenticação do domínio', d: 'Prova para o Gmail e o Outlook que o e-mail saiu mesmo da Alba.', itens: [
      ['spf', 'SPF publicado no DNS', 'Lista quais servidores podem enviar pelo domínio. Um registro só por domínio, com o include da plataforma.', 'albastudio.example.  TXT  "v=spf1 include:_spf.sua-plataforma.example ~all"'],
      ['dkim', 'DKIM assinando os envios', 'Assinatura digital em cada e-mail. A plataforma gera a chave; eu publico o registro e confiro se a assinatura passa.', 's1._domainkey.albastudio.example  CNAME  s1.dkim.sua-plataforma.example'],
      ['dmarc', 'DMARC com relatórios', 'Diz o que fazer com e-mail que falha no SPF ou DKIM. Começa em p=none para observar e sobe para quarantine quando os relatórios estiverem limpos.', '_dmarc.albastudio.example  TXT  "v=DMARC1; p=none; rua=mailto:dmarc@albastudio.example"'],
      ['dominio', 'Remetente no domínio da loja', 'Enviar como news@albastudio.example, nunca de um endereço gratuito, com o domínio alinhado ao SPF e ao DKIM.'],
    ] },
    { g: 'Lista limpa', d: 'Quem recebe quis receber, e quem não existe mais sai.', itens: [
      ['optin', 'Consentimento registrado', 'Caixa de cadastro sem marcação prévia, data e origem guardadas. Confirmação dupla (double opt-in) quando a lista vem de sorteio ou pop-up.'],
      ['bounce', 'Rejeições permanentes removidas', 'Endereço que não existe sai depois da primeira rejeição permanente. A maioria das plataformas faz sozinha; eu confiro a regra.'],
      ['sunset', 'Política para inativos', 'Quem não abre há muito tempo passa pela régua de reativação e, sem resposta, sai dos disparos.'],
      ['comprada', 'Nenhuma lista comprada ou importada sem permissão', 'Lista comprada traz armadilhas de spam e queima o domínio em poucos envios.'],
    ] },
    { g: 'Descadastro', d: 'Sair tem que ser fácil, senão a pessoa clica em “spam”.', itens: [
      ['link', 'Link de descadastro visível no rodapé', 'Em todo e-mail, com texto claro, mais a opção de receber menos.'],
      ['oneclick', 'Descadastro em um clique no cabeçalho', 'Gmail e Yahoo mostram o botão “cancelar inscrição” ao lado do remetente quando o cabeçalho existe.', 'List-Unsubscribe: <https://albastudio.example/descadastrar?u=ID>, <mailto:sair@albastudio.example>\nList-Unsubscribe-Post: List-Unsubscribe=One-Click'],
      ['prazo', 'Pedido de saída atendido em até 2 dias', 'Prazo exigido pelo Gmail e pelo Yahoo para quem envia em volume. A central de preferências salva na hora.'],
    ] },
    { g: 'Conteúdo e acompanhamento', d: 'Antes e depois de cada disparo.', itens: [
      ['teste', 'Teste em Gmail, Outlook e Apple Mail', 'Celular e computador, claro e escuro, com imagens bloqueadas. Os links com UTM conferidos um a um.'],
      ['texto', 'Versão em texto e equilíbrio entre imagem e texto', 'Nada de e-mail que é uma imagem só: o texto importante está em HTML, com texto alternativo nas imagens.'],
      ['aquec', 'Aquecimento do domínio novo', 'Começar pelos contatos mais engajados e aumentar o volume aos poucos nas primeiras semanas.'],
      ['postmaster', 'Reclamações de spam abaixo de 0,3%', 'Acompanho no Google Postmaster Tools e no painel da plataforma. O ideal é ficar abaixo de 0,1%.'],
    ] },
  ];
  const done = store.get('alba_email_check', {});
  $('#checkGrid').innerHTML = CHECK.map((g) => `<div class="check-group"><h3>${esc(g.g)}</h3><p>${esc(g.d)}</p>
    ${g.itens.map(([id, t, d, code]) => `<div class="citem"><label><input type="checkbox" data-id="${id}" ${done[id] ? 'checked' : ''}><span><b>${esc(t)}${['spf', 'dkim', 'dmarc', 'oneclick'].includes(id) ? '<span class="tag">obrigatório</span>' : ''}</b><span>${esc(d)}</span></span></label>${code ? `<pre>${esc(code)}</pre>` : ''}</div>`).join('')}</div>`).join('');
  const total = CHECK.reduce((a, g) => a + g.itens.length, 0);
  function prog() {
    const n = Object.values(done).filter(Boolean).length;
    $('#progBar').style.width = (n / total * 100) + '%';
    $('#progTxt').textContent = n === total ? `Tudo conferido: ${total} de ${total}. Pronto para o primeiro disparo.` : `${n} de ${total} itens conferidos`;
  }
  $('#checkGrid').addEventListener('change', (ev) => {
    const c = ev.target.closest('input[data-id]');
    if (!c) return;
    done[c.dataset.id] = c.checked; store.set('alba_email_check', done); prog();
  });
  $('#resetCheck').addEventListener('click', () => {
    Object.keys(done).forEach((k) => delete done[k]); store.set('alba_email_check', done);
    document.querySelectorAll('#checkGrid input').forEach((c) => { c.checked = false; }); prog();
  });
  prog();

  // ?email=3 abre direto um e-mail; ?checklist=cheio marca tudo (útil para capturas)
  const q = new URLSearchParams(location.search);
  if (q.get('email')) st.i = Math.max(0, Math.min(E.length - 1, +q.get('email') - 1));
  if (q.get('device') === 'mobile' || (!q.get('device') && window.innerWidth < 640)) $('.seg[data-grupo="device"] [data-v="mobile"]').click();
  if (q.get('tema') === 'escuro') $('.seg[data-grupo="tema"] [data-v="escuro"]').click();
  if (q.get('fluxo')) { const b = tabs.querySelector(`[data-f="${+q.get('fluxo') - 1}"]`); if (b) b.click(); }
  if (q.get('checklist') === 'demo') {
    ['spf', 'dkim', 'dmarc', 'dominio', 'optin', 'bounce', 'link', 'oneclick', 'prazo'].forEach((id) => { const c = $(`#checkGrid [data-id="${id}"]`); if (c) c.checked = true; done[id] = true; });
    prog();
  }
  render();
  if (q.get('codigo')) $('#verCodigo').click();
  // ?medir=1: grava a posição das seções (usado só para gerar as capturas da vitrine)
  if (q.get('medir')) setTimeout(() => {
    const m = {};
    ['emails', 'regua', 'assuntos', 'entregabilidade'].forEach((id) => { m[id] = Math.round(document.getElementById(id).getBoundingClientRect().top + scrollY); });
    m.studio = Math.round($('.studio').getBoundingClientRect().top + scrollY);
    m.flow = Math.round($('#flowTabs').getBoundingClientRect().top + scrollY);
    m.ab = Math.round($('#abGrid').getBoundingClientRect().top + scrollY);
    m.check = Math.round($('.check-top').getBoundingClientRect().top + scrollY);
    document.body.setAttribute('data-medidas', JSON.stringify(m));
  }, 300);
})();

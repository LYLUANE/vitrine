/* Alba Studio: loja demonstrativa. Roteamento por hash, dados em data/produtos.json. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const BRL = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } },
  };
  const ICON = {
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    wa: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.5-.3z"/></svg>',
  };

  let D = null;
  let cart = store.get('alba_cart', []);
  let favs = store.get('alba_favs', []);
  let cupom = store.get('alba_cupom', null);
  let ck = store.get('alba_ck', { step: 1, dados: {}, entrega: {}, frete: null, pag: 'pix', obs: '' });
  const app = $('#app');

  /* ---------- dados ---------- */
  const prod = (id) => D.produtos.find((p) => p.id === id);
  const corDe = (p, cid) => p.cores.find((c) => c.id === cid) || p.cores[0];
  const est = (p, cid, t) => (p.estoque[cid] && p.estoque[cid][t]) || 0;
  const estCor = (p, cid) => p.tamanhos.reduce((a, t) => a + est(p, cid, t), 0);
  const tamLabel = (t) => (t === 'U' ? 'Único' : t);
  const parcela = (v) => `3x de ${BRL(v / 3)}`;
  const svg = (p, cid, vista) => window.pecaSVG(p.tipo, corDe(p, cid).hex, { vista: vista || 'frente', fundo: p.fundo, textura: p.textura });

  /* ---------- carrinho ---------- */
  function saveCart() { store.set('alba_cart', cart); store.set('alba_cupom', cupom); badges(); }
  function subtotal() { return cart.reduce((a, i) => { const p = prod(i.id); return a + (p ? p.preco * i.qtd : 0); }, 0); }
  function desconto(sub) { if (!cupom || !D.cupons[cupom]) return 0; return Math.round(sub * D.cupons[cupom].valor) / 100; }
  function addCart(id, cor, tam, qtd) {
    const p = prod(id);
    const max = est(p, cor, tam);
    const ex = cart.find((i) => i.id === id && i.cor === cor && i.tam === tam);
    const atual = ex ? ex.qtd : 0;
    const q = Math.min(max - atual, qtd);
    if (q <= 0) { toast('Você já tem todo o estoque dessa variação na sacola.'); return false; }
    if (ex) ex.qtd += q; else cart.push({ id, cor, tam, qtd: q });
    saveCart();
    return true;
  }
  function badges() {
    const n = cart.reduce((a, i) => a + i.qtd, 0);
    const c = $('#cartCount'); c.textContent = n; c.classList.toggle('on', n > 0);
    const f = $('#favCount'); f.textContent = favs.length; f.classList.toggle('on', favs.length > 0);
  }

  /* ---------- frete simulado ---------- */
  function fretes(cep, sub) {
    const d = +String(cep).replace(/\D/g, '')[0];
    // faixas pela 1ª cifra do CEP (aproximação para demonstração)
    const T = {
      0: [18.9, 29.9, '2 a 4', '1 a 2'], 1: [18.9, 29.9, '2 a 4', '1 a 2'],
      2: [24.9, 39.9, '3 a 6', '2 a 3'], 3: [24.9, 39.9, '3 a 6', '2 a 3'],
      4: [34.9, 54.9, '6 a 10', '3 a 5'], 5: [34.9, 54.9, '6 a 10', '3 a 5'], 6: [36.9, 58.9, '7 a 12', '4 a 6'],
      7: [29.9, 49.9, '5 a 8', '2 a 4'], 8: [26.9, 42.9, '4 a 7', '2 a 3'], 9: [26.9, 42.9, '4 a 7', '2 a 3'],
    }[d];
    const gratis = sub >= D.freteGratisAcima;
    return [
      { id: 'eco', nome: 'Econômico', prazo: `${T[2]} dias úteis`, valor: gratis ? 0 : T[0] },
      { id: 'exp', nome: 'Expresso', prazo: `${T[3]} dias úteis`, valor: T[1] },
      { id: 'ret', nome: 'Retirar no ateliê', prazo: 'combinar pelo WhatsApp', valor: 0 },
    ];
  }
  const cepOk = (c) => /^\d{8}$/.test(String(c).replace(/\D/g, ''));
  const maskCep = (v) => { v = v.replace(/\D/g, '').slice(0, 8); return v.length > 5 ? v.slice(0, 5) + '-' + v.slice(5) : v; };
  const maskTel = (v) => {
    v = v.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    if (v.length > 6) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
    if (v.length > 2) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
    return v;
  };

  /* ---------- UI comum ---------- */
  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600);
  }
  function openLayer(id) {
    closeLayers();
    const el = $('#' + id);
    el.classList.add('on'); el.setAttribute('aria-hidden', 'false');
    if (id !== 'modal') $('.scrim').classList.add('on');
    document.body.classList.add('lock');
  }
  function closeLayers() {
    $$('.drawer.on, .modal.on, .filters.on').forEach((e) => { e.classList.remove('on'); e.setAttribute('aria-hidden', 'true'); });
    $('.scrim').classList.remove('on');
    document.body.classList.remove('lock');
  }
  function openModal(html) { $('#modalBody').innerHTML = html; openLayer('modal'); }

  function card(p) {
    const c = p.cores[0];
    const total = p.cores.reduce((a, k) => a + estCor(p, k.id), 0);
    const badge = p.novo ? '<span class="badge">Novo</span>' : total < 18 ? '<span class="badge low">Últimas peças</span>' : '';
    const on = favs.includes(p.id);
    return `<article class="card" data-card="${p.id}">
      <a class="card-img" href="#/produto/${p.id}" aria-label="${esc(p.nome)}">
        <span class="img-main">${svg(p, c.id)}</span><span class="alt">${svg(p, c.id, 'cena')}</span>${badge}
      </a>
      <button class="fav" data-fav="${p.id}" aria-pressed="${on}" aria-label="Favoritar ${esc(p.nome)}">${ICON.heart}</button>
      <div class="card-body">
        <a href="#/produto/${p.id}"><h3>${esc(p.nome)}</h3></a>
        <p class="price">${BRL(p.preco)}<small>ou ${parcela(p.preco)}</small></p>
        <div class="dots">${p.cores.map((k, i) => `<button class="${i ? '' : 'on'}" style="background:${k.hex}" data-dot="${k.id}" aria-label="Ver na cor ${esc(k.nome)}" title="${esc(k.nome)}"></button>`).join('')}</div>
      </div>
    </article>`;
  }

  /* ---------- rotas ---------- */
  function parseHash() {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    const parts = path.split('/').filter(Boolean);
    const q = {};
    (qs || '').split('&').filter(Boolean).forEach((kv) => { const [k, v] = kv.split('='); q[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
    return { parts, q };
  }
  function route() {
    closeLayers();
    const { parts, q } = parseHash();
    const r = parts[0] || '';
    $$('.nav a').forEach((a) => a.classList.toggle('on', location.hash && a.getAttribute('href') === location.hash));
    if (r === 'loja') renderShop(q);
    else if (r === 'colecao') renderShop({ col: parts[1] });
    else if (r === 'produto') renderProduct(parts[1], q);
    else if (r === 'favoritos') renderFavs();
    else if (r === 'checkout') renderCheckout();
    else if (r === 'pedido') renderDone();
    else if (r === 'ajuda') renderHelp();
    else renderHome();
    window.scrollTo(0, 0);
  }

  /* ---------- home ---------- */
  function renderHome() {
    document.title = 'Alba Studio · Moda contemporânea (projeto demonstrativo)';
    const top = D.produtos.slice().sort((a, b) => a.ordem - b.ordem).slice(0, 8);
    const v = prod('vestido-midi-alcas'), cm = prod('camisa-linho-solta'), b = prod('bolsa-tote-couro');
    const perk = (path, t) => `<li><svg viewBox="0 0 32 32">${path}</svg><span>${t}</span></li>`;
    app.innerHTML = `
    <section class="hero">
      <div>
        <span class="eyebrow">Coleção Linho &amp; Luz · Verão</span>
        <h1>Roupa leve,<br>feita para <em>durar</em><br>muitos verões.</h1>
        <p>Linho, alfaiataria sem peso e tricô fino em cores de areia e terra. Peças femininas e masculinas que combinam entre si.</p>
        <div class="hero-ctas">
          <a class="btn" href="#/loja">Ver coleção</a>
          <a class="btn btn-ghost" href="#/loja?pub=feminino">Feminino</a>
          <a class="btn btn-ghost" href="#/loja?pub=masculino">Masculino</a>
        </div>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="a1">${window.pecaSVG('vestido', v.cores[0].hex, { vista: 'cena', fundo: '#E4D8C8' })}</div>
        <div class="a2">${window.pecaSVG('camisa', cm.cores[0].hex, { vista: 'cena', fundo: '#DCD6CB', textura: 'linho' })}</div>
        <div class="a3">${window.pecaSVG('bolsa', b.cores[0].hex, { vista: 'frente', fundo: '#EFE9E0' })}</div>
        <a class="hero-tag" href="#/produto/vestido-midi-alcas"><b>Vestido midi</b>de alças · ${BRL(v.preco)}</a>
      </div>
    </section>
    <section class="perks"><ul>
      ${perk('<path d="M3 9h17v13H3zM20 13h5l4 4v5h-9"/><circle cx="8" cy="23" r="2.5"/><circle cx="24" cy="23" r="2.5"/>', `Frete grátis acima de ${BRL(D.freteGratisAcima)}`)}
      ${perk('<path d="M6 12a10 10 0 1 1 1 9"/><path d="M6 5v7h7"/>', 'Troca fácil em até 30 dias')}
      ${perk('<rect x="4" y="8" width="24" height="16" rx="2"/><path d="M4 13h24"/>', '3x sem juros ou 5% off no Pix')}
      ${perk('<path d="M16 3l11 6v14l-11 6-11-6V9z"/><path d="M5 9l11 6 11-6M16 15v14"/>', 'Envio em até 2 dias úteis')}
    </ul></section>
    <section class="section">
      <div class="sec-head"><div><span class="eyebrow">Coleções</span><h2>Escolha por onde começar</h2></div><a class="link" href="#/loja">Ver tudo</a></div>
      <div class="cols">${D.colecoes.slice(0, 4).map((c, i) => `
        <a class="col-card" href="#/colecao/${c.id}">${window.pecaSVG(c.tipo, c.cor, { vista: i % 2 ? 'frente' : 'cena', fundo: ['#E3D9CB', '#D9D4CB', '#E6DDD3', '#E2D7C8'][i], textura: c.tipo === 'trico' ? 'malha' : 'linho' })}
          <div class="cap"><h3>${c.nome}</h3><p>${c.texto}</p></div></a>`).join('')}
      </div>
    </section>
    <section class="section">
      <div class="sec-head"><div><span class="eyebrow">Destaques</span><h2>Mais vendidos</h2><p>As peças que mais saem da arara nesta estação.</p></div><a class="link" href="#/loja?ord=top">Ver todos</a></div>
      <div class="grid">${top.map(card).join('')}</div>
    </section>
    <section class="editorial">
      <div class="ed-art" aria-hidden="true">
        ${[['camisa', '#D6C6AA', '#C9BBA4', 'linho'], ['trico', '#6A2E35', '#3A3530', 'malha'], ['calca', '#B5A27F', '#CFC5B4', ''], ['blazer', '#E6DED0', '#2F2C28', 'linho'], ['saia', '#D9C29C', '#BFAE92', ''], ['jaqueta', '#717150', '#3F3D37', '']].map(([t, c, f, x]) => `<div>${window.pecaSVG(t, c, { vista: 'detalhe', fundo: f, textura: x })}</div>`).join('')}
      </div>
      <div class="ed-txt">
        <span class="eyebrow">Feito para durar</span>
        <h2>Menos peças, mais combinações.</h2>
        <p>Cada modelo nasce pensando no que já está no seu armário: as cores conversam entre si e a modelagem funciona com e sem salto, no escritório e no fim de semana.</p>
        <ul><li>Tecidos naturais e mistos, com composição na etiqueta</li><li>Tabela de medidas real em cada produto</li><li>Acabamento conferido peça por peça antes do envio</li></ul>
        <a class="btn" href="#/colecao/linho-de-verao">Conhecer o linho</a>
      </div>
    </section>
    <section class="section">
      <div class="split">
        <a href="#/loja?pub=feminino">${window.pecaSVG('blazer', '#9DA88F', { vista: 'detalhe', fundo: '#E8E1D6', textura: 'linho' })}<div class="lbl"><b>Feminino</b><span>Comprar agora</span></div></a>
        <a href="#/loja?pub=masculino">${window.pecaSVG('jaqueta', '#2E3A50', { vista: 'detalhe', fundo: '#DED8CD' })}<div class="lbl" style="color:#fff"><b>Masculino</b><span>Comprar agora</span></div></a>
      </div>
    </section>
    <section class="news">
      <span class="eyebrow">Lookbook</span>
      <h2>Receba as novidades antes</h2>
      <p>Um e-mail por mês com a coleção nova e como combinar as peças. Sem spam.</p>
      <form data-news><input type="email" required placeholder="Seu melhor e-mail" aria-label="E-mail"><button class="btn">Quero receber</button></form>
    </section>`;
  }

  /* ---------- catálogo ---------- */
  let F;
  function renderShop(q) {
    F = { pub: q.pub ? [q.pub] : [], cat: q.cat ? [q.cat] : [], tam: [], cor: [], max: 600, q: q.q || '', ord: q.ord || 'rel', col: q.col || '', novo: !!q.novo };
    const col = F.col && D.colecoes.find((c) => c.id === F.col);
    const titulo = col ? col.nome : F.novo ? 'Novidades' : F.pub.length ? (F.pub[0] === 'feminino' ? 'Feminino' : 'Masculino') : F.cat[0] === 'bolsa' ? 'Bolsas' : 'Todos os produtos';
    document.title = titulo + ' · Alba Studio';
    const cats = {};
    D.produtos.forEach((p) => { const k = p.tipo === 'bolsa-mini' ? 'bolsa' : p.tipo; cats[k] = (cats[k] || 0) + 1; });
    const tams = ['PP', 'P', 'M', 'G', 'GG', '36', '38', '40', '42', '44', 'U'];
    app.innerHTML = `
    <div class="page-head"><div class="crumbs"><a href="#/">Início</a> / ${titulo}</div><h1>${titulo}</h1></div>
    <div class="shop">
      <aside class="filters" id="filters" aria-label="Filtros">
        <div class="filters-head"><h3>Filtrar</h3><button class="icon-btn" data-close aria-label="Fechar filtros">${ICON.x}</button></div>
        <div class="f-group"><h4>Para quem</h4>
          ${['feminino', 'masculino'].map((v) => `<label class="check"><input type="checkbox" data-f="pub" value="${v}" ${F.pub.includes(v) ? 'checked' : ''}> ${v === 'feminino' ? 'Feminino' : 'Masculino'}<small>${D.produtos.filter((p) => p.publico === v).length}</small></label>`).join('')}
        </div>
        <div class="f-group"><h4>Categoria</h4>
          ${Object.keys(cats).map((k) => `<label class="check"><input type="checkbox" data-f="cat" value="${k}" ${F.cat.includes(k) ? 'checked' : ''}> ${D.categorias[k]}<small>${cats[k]}</small></label>`).join('')}
        </div>
        <div class="f-group"><h4>Tamanho</h4><div class="chips">
          ${tams.map((t) => `<button class="chip" data-chip="${t}" aria-pressed="false">${tamLabel(t)}</button>`).join('')}
        </div></div>
        <div class="f-group"><h4>Cor</h4><div class="swatches">
          ${Object.entries(D.familias).map(([k, [n, h]]) => `<button class="sw" data-sw="${k}" aria-pressed="false"><i style="background:${h}"></i>${n}</button>`).join('')}
        </div></div>
        <div class="f-group"><h4>Preço</h4>
          <input type="range" class="range" min="120" max="600" step="10" value="600" data-range aria-label="Preço máximo">
          <div class="range-val"><span>até</span><b id="maxv">${BRL(600)}</b></div>
        </div>
        <div class="f-group"><button class="link" data-clear>Limpar filtros</button></div>
        <div class="filters-foot"><button class="btn btn-block" data-close id="seeN">Ver produtos</button></div>
      </aside>
      <section>
        <div class="toolbar">
          <div class="search">${ICON.search}<input type="search" placeholder="Buscar: linho, vestido, blazer..." value="${esc(F.q)}" data-q aria-label="Buscar produtos"></div>
          <button class="btn btn-ghost btn-filter" data-open-filters>Filtrar</button>
          <select data-ord aria-label="Ordenar">
            <option value="rel">Ordenar: relevância</option><option value="top">Mais vendidos</option><option value="novo">Novidades</option>
            <option value="asc">Menor preço</option><option value="desc">Maior preço</option>
          </select>
          <span class="n" id="nres"></span>
        </div>
        <div class="active-tags" id="tags"></div>
        <div class="grid" id="results"></div>
      </section>
    </div>`;
    $('[data-ord]').value = F.ord;
    applyFilters();
  }
  function filtered() {
    const q = F.q.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    let r = D.produtos.filter((p) => {
      const cat = p.tipo === 'bolsa-mini' ? 'bolsa' : p.tipo;
      if (F.pub.length && !F.pub.includes(p.publico)) return false;
      if (F.cat.length && !F.cat.includes(cat)) return false;
      if (F.col && p.colecao !== F.col) return false;
      if (F.novo && !p.novo) return false;
      if (p.preco > F.max) return false;
      if (F.cor.length && !p.cores.some((c) => F.cor.includes(c.familia))) return false;
      if (F.tam.length && !F.tam.some((t) => p.cores.some((c) => est(p, c.id, t) > 0))) return false;
      if (q) {
        const hay = (p.nome + ' ' + D.categorias[cat] + ' ' + p.composicao + ' ' + p.cores.map((c) => c.nome).join(' ')).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return true;
    });
    const o = { rel: (a, b) => a.ordem - b.ordem, top: (a, b) => a.ordem - b.ordem, novo: (a, b) => (b.novo - a.novo) || a.ordem - b.ordem, asc: (a, b) => a.preco - b.preco, desc: (a, b) => b.preco - a.preco }[F.ord];
    return r.sort(o);
  }
  function applyFilters() {
    const r = filtered();
    $('#results').innerHTML = r.length ? r.map(card).join('') : `<div class="empty" style="grid-column:1/-1"><h3>Nada por aqui</h3><p>Nenhuma peça com essa combinação. Tente tirar um filtro.</p><button class="btn btn-ghost" data-clear>Limpar filtros</button></div>`;
    $('#nres').textContent = `${r.length} ${r.length === 1 ? 'produto' : 'produtos'}`;
    $('#seeN').textContent = `Ver ${r.length} ${r.length === 1 ? 'produto' : 'produtos'}`;
    $('#maxv').textContent = BRL(F.max);
    $$('[data-chip]').forEach((b) => { const on = F.tam.includes(b.dataset.chip); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    $$('[data-sw]').forEach((b) => { const on = F.cor.includes(b.dataset.sw); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    const tags = [];
    F.pub.forEach((v) => tags.push(['pub', v, v === 'feminino' ? 'Feminino' : 'Masculino']));
    F.cat.forEach((v) => tags.push(['cat', v, D.categorias[v]]));
    F.tam.forEach((v) => tags.push(['tam', v, 'Tam. ' + tamLabel(v)]));
    F.cor.forEach((v) => tags.push(['cor', v, D.familias[v][0]]));
    if (F.max < 600) tags.push(['max', '', 'Até ' + BRL(F.max)]);
    if (F.col) tags.push(['col', '', D.colecoes.find((c) => c.id === F.col).nome]);
    if (F.novo) tags.push(['novo', '', 'Novidades']);
    $('#tags').innerHTML = tags.map(([k, v, l]) => `<button data-untag="${k}" data-v="${v}">${esc(l)}</button>`).join('');
  }

  /* ---------- produto ---------- */
  let S;
  const VISTAS = [['frente', 'Frente'], ['costas', 'Costas'], ['detalhe', 'Detalhe'], ['cena', 'Na arara']];
  function renderProduct(id, q) {
    const p = prod(id);
    if (!p) { app.innerHTML = '<div class="empty"><h3>Produto não encontrado</h3><a class="btn" href="#/loja">Ver catálogo</a></div>'; return; }
    document.title = p.nome + ' · Alba Studio';
    const cor = (q.cor && p.cores.some((c) => c.id === q.cor)) ? q.cor : p.cores[0].id;
    S = { p, cor, tam: p.tamanhos.length === 1 && est(p, cor, 'U') > 0 ? 'U' : null, qtd: 1, vista: 'frente' };
    const cat = p.tipo === 'bolsa-mini' ? 'bolsa' : p.tipo;
    const rel = D.produtos.filter((x) => x.id !== p.id && (x.colecao === p.colecao || x.publico === p.publico)).sort((a, b) => (b.colecao === p.colecao) - (a.colecao === p.colecao) || a.ordem - b.ordem).slice(0, 4);
    app.innerHTML = `
    <div class="pdp">
      <div class="gallery">
        <div class="thumbs" id="thumbs"></div>
        <div class="main-img" id="mainImg" data-next-view></div>
        <div class="slides" id="slides"></div>
        <div class="slide-dots" id="sdots">${VISTAS.map((v, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>
      </div>
      <div class="info">
        <div class="crumbs"><a href="#/">Início</a> / <a href="#/loja?pub=${p.publico}">${p.publico === 'feminino' ? 'Feminino' : 'Masculino'}</a> / <a href="#/loja?cat=${cat}">${D.categorias[cat]}</a></div>
        <h1>${esc(p.nome)}</h1>
        <div class="pp">${BRL(p.preco)}</div>
        <p class="pp-sub">ou ${parcela(p.preco)} sem juros · <b>${BRL(p.preco * 0.95)} no Pix</b></p>
        <div class="opt">
          <div class="opt-h"><span>Cor: <b id="corNome"></b></span></div>
          <div class="colors">${p.cores.map((c) => `<button data-cor="${c.id}" style="background:${c.hex}" aria-label="${esc(c.nome)}" title="${esc(c.nome)}"></button>`).join('')}</div>
        </div>
        <div class="opt">
          <div class="opt-h"><span>Tamanho${S.tam === 'U' ? '' : ': <b id="tamNome">escolha</b>'}</span>${cat === 'bolsa' ? '<button class="link" data-medidas>Medidas da bolsa</button>' : '<button class="link" data-medidas>Guia de medidas</button>'}</div>
          <div class="sizes" id="sizes"></div>
          <p class="stock-msg" id="stockMsg"></p>
        </div>
        <div class="buy-wrap">
          <div class="buy">
            <div class="qty"><button data-q="-1" aria-label="Diminuir">−</button><span id="qtd">1</span><button data-q="1" aria-label="Aumentar">+</button></div>
            <button class="btn" id="addBtn" data-add>Adicionar à sacola</button>
            <button class="fav-lg" data-fav="${p.id}" aria-pressed="${favs.includes(p.id)}" aria-label="Favoritar">${ICON.heart}</button>
          </div>
        </div>
        <div class="ship">
          <h4>Calcular frete e prazo</h4>
          <form data-ship><input type="text" inputmode="numeric" placeholder="00000-000" maxlength="9" data-cep aria-label="CEP" value="${esc(ck.entrega.cep || '')}"><button class="btn btn-ghost">Calcular</button></form>
          <ul class="ship-res" id="shipRes"></ul>
          <small>Valores simulados para a demonstração.</small>
        </div>
        <div class="acc">
          <details open><summary>Descrição</summary><p>${esc(p.descricao)}</p></details>
          <details><summary>Composição e cuidados</summary><p><b>Composição:</b> ${esc(p.composicao)}</p><p><b>Cuidados:</b> ${esc(p.cuidados)}</p></details>
          <details><summary>Trocas e devoluções</summary><p>Primeira troca grátis em até 30 dias, com a etiqueta. Compras pela internet também podem ser devolvidas em até 7 dias do recebimento, como prevê o Código de Defesa do Consumidor.</p></details>
        </div>
      </div>
    </div>
    <section class="section related"><div class="sec-head"><div><span class="eyebrow">Combina com</span><h2>Complete o look</h2></div></div><div class="grid">${rel.map(card).join('')}</div></section>`;
    drawProduct();
    const sl = $('#slides');
    sl.addEventListener('scroll', () => {
      const i = Math.round(sl.scrollLeft / sl.clientWidth);
      $$('#sdots i').forEach((d, k) => d.classList.toggle('on', k === i));
    }, { passive: true });
  }
  function drawProduct() {
    const { p, cor } = S;
    $('#thumbs').innerHTML = VISTAS.map(([v, l]) => `<button class="${v === S.vista ? 'on' : ''}" data-vista="${v}" aria-label="Ver ${l}">${svg(p, cor, v)}</button>`).join('');
    $('#mainImg').innerHTML = svg(p, cor, S.vista) + `<span class="vlabel">${VISTAS.find((v) => v[0] === S.vista)[1]}</span>`;
    $('#slides').innerHTML = VISTAS.map(([v]) => `<div>${svg(p, cor, v)}</div>`).join('');
    $$('[data-cor]').forEach((b) => b.classList.toggle('on', b.dataset.cor === cor));
    $('#corNome').textContent = corDe(p, cor).nome;
    if (S.tam && est(p, cor, S.tam) === 0) S.tam = null;
    $('#sizes').innerHTML = p.tamanhos.map((t) => {
      const n = est(p, cor, t);
      return `<button class="size ${S.tam === t ? 'on' : ''}" data-tam="${t}" ${n ? '' : 'disabled'} aria-label="Tamanho ${tamLabel(t)}${n ? '' : ', esgotado'}">${tamLabel(t)}${n && n <= 2 ? '<i class="low"></i>' : ''}</button>`;
    }).join('');
    if (p.tamanhos.length === 1) $('#sizes').style.gridTemplateColumns = '120px';
    const tn = $('#tamNome'); if (tn) tn.textContent = S.tam ? tamLabel(S.tam) : 'escolha';
    const m = $('#stockMsg');
    if (S.tam) {
      const n = est(p, cor, S.tam);
      S.qtd = Math.min(S.qtd, n);
      m.className = 'stock-msg ' + (n <= 2 ? 'low' : 'ok');
      m.textContent = n <= 2 ? `Restam ${n} ${n === 1 ? 'unidade' : 'unidades'} nesta cor e tamanho.` : 'Em estoque, pronta entrega.';
    } else {
      const esg = p.tamanhos.filter((t) => !est(p, cor, t)).map(tamLabel);
      m.className = 'stock-msg';
      m.textContent = esg.length ? `Esgotado nesta cor: ${esg.join(', ')}.` : 'Todos os tamanhos disponíveis nesta cor.';
    }
    $('#qtd').textContent = S.qtd;
    const add = $('#addBtn');
    add.disabled = !S.tam;
    add.textContent = S.tam ? `Adicionar · ${BRL(p.preco * S.qtd)}` : 'Escolha o tamanho';
  }

  function guiaMedidas(p) {
    const cat = p.tipo === 'bolsa-mini' ? 'bolsa' : p.tipo;
    if (cat === 'bolsa') {
      const mini = p.tipo === 'bolsa-mini';
      return `<h2>Medidas da bolsa</h2><p>Medidas da peça pronta, em centímetros.</p>
      <table class="tbl"><tr><th>Largura</th><th>Altura</th><th>Profundidade</th><th>Alça</th></tr>
      <tr><td>${mini ? 26 : 38}</td><td>${mini ? 14 : 32}</td><td>${mini ? 6 : 12}</td><td>${mini ? '110 (regulável)' : '28 de queda'}</td></tr></table>`;
    }
    const baixo = ['calca', 'saia'].includes(cat);
    const fem = p.publico === 'feminino';
    const rows = baixo
      ? [['36', 66, 94, 26], ['38', 70, 98, 27], ['40', 74, 102, 28], ['42', 78, 106, 29], ['44', 83, 111, 30]]
      : fem ? [['PP', 80, 64, 92], ['P', 86, 68, 96], ['M', 92, 74, 102], ['G', 98, 80, 108], ['GG', 104, 86, 114]]
        : [['PP', 88, 76, 92], ['P', 94, 82, 98], ['M', 100, 88, 104], ['G', 106, 94, 110], ['GG', 114, 102, 118]];
    const head = baixo ? ['Tam.', 'Cintura', 'Quadril', 'Gancho'] : ['Tam.', 'Busto/Tórax', 'Cintura', 'Quadril'];
    return `<h2>Guia de medidas</h2><p>Medidas do corpo, em centímetros. ${fem ? 'Modelagem feminina' : 'Modelagem masculina'}${baixo ? '' : ', caimento regular'}. Entre dois tamanhos, escolha o maior para um caimento mais solto.</p>
      <table class="tbl"><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr>
      ${rows.map((r) => `<tr class="${S && S.tam === r[0] ? 'sel' : ''}">${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>
      <div class="howto"><svg viewBox="0 0 100 140" fill="none" stroke="#8E4B2E" stroke-width="1.6"><circle cx="50" cy="16" r="10" stroke="#736D64"/><path d="M30 34h40l6 40-6 60H30l-6-60z" stroke="#736D64"/><path d="M24 50h52M28 76h44M24 98h52" stroke-dasharray="3 3"/></svg>
      <ul><li><b>Busto/Tórax:</b> na parte mais larga do peito.</li><li><b>Cintura:</b> na parte mais fina do tronco.</li><li><b>Quadril:</b> na parte mais larga do quadril.</li><li>Use fita métrica rente ao corpo, sem apertar.</li></ul></div>`;
  }

  /* ---------- favoritos ---------- */
  function renderFavs() {
    document.title = 'Favoritos · Alba Studio';
    const list = favs.map(prod).filter(Boolean);
    app.innerHTML = `<div class="page-head"><div class="crumbs"><a href="#/">Início</a> / Favoritos</div><h1>Favoritos</h1></div>
      <section class="section" style="padding-top:24px;padding-bottom:80px">${list.length ? `<div class="grid">${list.map(card).join('')}</div>`
        : `<div class="empty"><h3>Sua lista está vazia</h3><p>Toque no coração das peças que você gostou para guardar aqui. A lista fica salva neste aparelho.</p><a class="btn" href="#/loja">Ver catálogo</a></div>`}</section>`;
  }

  /* ---------- sacola ---------- */
  function renderCart() {
    const body = $('#cartBody');
    if (!cart.length) {
      body.innerHTML = `<div class="cart-empty"><h3>Sacola vazia</h3><p>Que tal começar pelos mais vendidos?</p><a class="btn" href="#/loja">Ver catálogo</a></div>`;
      return;
    }
    const sub = subtotal(), desc = desconto(sub);
    const falta = D.freteGratisAcima - (sub - desc);
    body.innerHTML = `
      <div class="free-bar">${falta > 0 ? `Faltam <b>${BRL(falta)}</b> para o frete grátis` : '<b>Frete grátis</b> no envio econômico liberado'}<div class="bar"><i style="width:${Math.min(100, ((sub - desc) / D.freteGratisAcima) * 100)}%"></i></div></div>
      <div class="items">${cart.map((i, k) => itemHTML(i, k, true)).join('')}</div>
      <div class="cart-foot">
        ${cupom ? `<div class="coupon-on"><span>Cupom <b>${cupom}</b> aplicado</span><button data-rm-cupom>remover</button></div>`
          : `<form class="coupon" data-cupom><input type="text" placeholder="Cupom de desconto" aria-label="Cupom"><button class="btn btn-ghost">Aplicar</button></form>
             <p class="coupon-hint">Cupom de exemplo: <button type="button" data-use-cupom="ALBA10">ALBA10</button> (10% off)</p>`}
        <div class="sum">
          <div><span>Subtotal</span><span>${BRL(sub)}</span></div>
          ${desc ? `<div class="disc"><span>Desconto (${cupom})</span><span>− ${BRL(desc)}</span></div>` : ''}
          <div><span>Frete</span><span><small>calculado no checkout</small></span></div>
          <div class="tot"><span>Total</span><span>${BRL(sub - desc)}</span></div>
        </div>
        <a class="btn btn-block" href="#/checkout">Finalizar compra</a>
        <button class="keep" data-close>Continuar comprando</button>
      </div>`;
  }
  function itemHTML(i, k, edit) {
    const p = prod(i.id); if (!p) return '';
    return `<div class="item">
      <a class="thumb" href="#/produto/${p.id}?cor=${i.cor}">${svg(p, i.cor)}</a>
      <div><h4>${esc(p.nome)}</h4><div class="meta">${corDe(p, i.cor).nome} · ${tamLabel(i.tam)}${edit ? '' : ` · ${i.qtd}x`}</div>
        ${edit ? `<div class="qty sm"><button data-iq="${k}" data-d="-1" aria-label="Diminuir">−</button><span>${i.qtd}</span><button data-iq="${k}" data-d="1" aria-label="Aumentar">+</button></div>` : ''}</div>
      <div class="side"><span>${BRL(p.preco * i.qtd)}</span>${edit ? `<button class="rm" data-rm="${k}">remover</button>` : ''}</div>
    </div>`;
  }
  function openCart() { renderCart(); openLayer('cart'); }

  /* ---------- checkout ---------- */
  function saveCk() { store.set('alba_ck', ck); }
  function totals() {
    const sub = subtotal(), desc = desconto(sub);
    let fr = null;
    if (ck.frete && cepOk(ck.entrega.cep || '')) fr = fretes(ck.entrega.cep, sub - desc).find((f) => f.id === ck.frete) || null;
    const pix = ck.pag === 'pix' ? Math.round((sub - desc) * 5) / 100 : 0;
    return { sub, desc, fr, pix, total: sub - desc - pix + (fr ? fr.valor : 0) };
  }
  function summaryHTML() {
    const t = totals();
    return `<aside class="summary collapsed" id="summary">
      <h3>Resumo</h3>
      <button class="link s-toggle" data-s-toggle>Ver itens (${cart.reduce((a, i) => a + i.qtd, 0)})</button>
      <div class="s-items">${cart.map((i, k) => itemHTML(i, k, false)).join('')}</div>
      <div class="sum">
        <div><span>Subtotal</span><span>${BRL(t.sub)}</span></div>
        ${t.desc ? `<div class="disc"><span>Cupom ${cupom}</span><span>− ${BRL(t.desc)}</span></div>` : ''}
        ${t.pix ? `<div class="disc"><span>5% no Pix</span><span>− ${BRL(t.pix)}</span></div>` : ''}
        <div><span>Frete</span><span>${t.fr ? (t.fr.valor ? BRL(t.fr.valor) : 'Grátis') : '<small>no passo 2</small>'}</span></div>
        <div class="tot"><span>Total</span><span>${BRL(t.total)}</span></div>
      </div>
      <p class="note">Demonstração: o pedido é montado e enviado como mensagem de WhatsApp. Nada é cobrado.</p>
    </aside>`;
  }
  function field(name, label, val, o) {
    o = o || {};
    return `<div class="field" data-field="${name}"><label class="f" for="f_${name}">${label}</label>
      <input id="f_${name}" name="${name}" type="${o.type || 'text'}" value="${esc(val || '')}" ${o.ph ? `placeholder="${o.ph}"` : ''} ${o.im ? `inputmode="${o.im}"` : ''} ${o.ac ? `autocomplete="${o.ac}"` : ''} ${o.max ? `maxlength="${o.max}"` : ''}>
      <div class="err">${o.err || 'Preencha este campo.'}</div></div>`;
  }
  function renderCheckout() {
    document.title = 'Finalizar compra · Alba Studio';
    if (!cart.length) {
      app.innerHTML = `<div class="empty" style="padding:90px 20px"><h3>Sua sacola está vazia</h3><p>Adicione uma peça para finalizar a compra.</p><a class="btn" href="#/loja">Ver catálogo</a></div>`;
      return;
    }
    const s = ck.step;
    const steps = ['Dados', 'Entrega', 'Pagamento'];
    let body = '';
    if (s === 1) {
      body = `<h1>Seus dados</h1><p class="co-sub">Para a gente falar com você sobre o pedido.</p>
        <form data-step="1" novalidate>
          ${field('nome', 'Nome completo', ck.dados.nome, { ac: 'name', err: 'Digite nome e sobrenome.' })}
          <div class="row">${field('tel', 'WhatsApp', ck.dados.tel, { type: 'tel', im: 'tel', ph: '(00) 00000-0000', ac: 'tel', err: 'Digite um celular com DDD.' })}
          ${field('email', 'E-mail (opcional)', ck.dados.email, { type: 'email', ac: 'email', err: 'E-mail inválido.' })}</div>
          <div class="co-actions"><a class="link" href="#/loja">Continuar comprando</a><button class="btn">Ir para entrega</button></div>
        </form>`;
    } else if (s === 2) {
      const e = ck.entrega;
      const ops = cepOk(e.cep || '') ? fretes(e.cep, subtotal() - desconto(subtotal())) : null;
      body = `<h1>Entrega</h1><p class="co-sub">Endereço e forma de envio.</p>
        <form data-step="2" novalidate>
          <div class="row">${field('cep', 'CEP', e.cep, { im: 'numeric', ph: '00000-000', max: 9, ac: 'postal-code', err: 'CEP com 8 números.' })}<div></div></div>
          <div class="row-3">${field('rua', 'Rua / avenida', e.rua, { ac: 'address-line1' })}${field('num', 'Número', e.num, { im: 'numeric' })}</div>
          <div class="row">${field('comp', 'Complemento (opcional)', e.comp)}${field('bairro', 'Bairro', e.bairro)}</div>
          <div class="row-3">${field('cidade', 'Cidade', e.cidade, { ac: 'address-level2' })}${field('uf', 'UF', e.uf, { max: 2, ac: 'address-level1', err: 'Sigla do estado.' })}</div>
          <div class="field" data-field="frete"><label class="f">Forma de envio</label>
            <div class="opts" id="freteOps">${ops ? freteOpts(ops) : '<p class="co-sub" style="margin:0">Digite o CEP para ver as opções.</p>'}</div>
            <div class="err">Escolha uma forma de envio.</div></div>
          <div class="co-actions"><button type="button" class="link" data-go="1">Voltar</button><button class="btn">Ir para pagamento</button></div>
        </form>`;
    } else {
      const d = ck.dados, e = ck.entrega;
      const t = totals();
      body = `<h1>Pagamento</h1><p class="co-sub">Confira tudo e envie o pedido pelo WhatsApp. O link de pagamento chega na conversa.</p>
        <div class="review"><h4>Contato <button data-go="1">alterar</button></h4><p>${esc(d.nome)} · ${esc(d.tel)}${d.email ? ' · ' + esc(d.email) : ''}</p></div>
        <div class="review"><h4>Entrega <button data-go="2">alterar</button></h4><p>${esc(e.rua)}, ${esc(e.num)}${e.comp ? ' – ' + esc(e.comp) : ''} · ${esc(e.bairro)} · ${esc(e.cidade)}/${esc(e.uf.toUpperCase())} · CEP ${esc(e.cep)}<br>${t.fr ? `${t.fr.nome} (${t.fr.prazo}) · ${t.fr.valor ? BRL(t.fr.valor) : 'grátis'}` : ''}</p></div>
        <form data-step="3" novalidate>
          <div class="field"><label class="f">Forma de pagamento</label><div class="opts">
            <label class="opt-card"><input type="radio" name="pag" value="pix" ${ck.pag === 'pix' ? 'checked' : ''}><span class="t">Pix<small>5% de desconto · chave enviada no WhatsApp</small></span><span class="v">−5%</span></label>
            <label class="opt-card"><input type="radio" name="pag" value="cartao" ${ck.pag === 'cartao' ? 'checked' : ''}><span class="t">Cartão de crédito<small>Até 3x sem juros · link de pagamento seguro</small></span><span class="v">3x</span></label>
          </div></div>
          <div class="field"><label class="f" for="f_obs">Observação (opcional)</label><textarea id="f_obs" name="obs" placeholder="Ex.: é presente, pode embrulhar?">${esc(ck.obs || '')}</textarea></div>
          <div class="co-actions"><button type="button" class="link" data-go="2">Voltar</button><button class="btn btn-wa">${ICON.wa} Enviar pedido pelo WhatsApp</button></div>
        </form>`;
    }
    app.innerHTML = `<div class="co"><div>
      <ol class="steps">${steps.map((n, i) => `<li class="${i + 1 === s ? 'on' : i + 1 < s ? 'done' : ''}">${n}</li>`).join('')}</ol>
      ${body}</div>${summaryHTML()}</div>`;
  }
  function freteOpts(ops) {
    return ops.map((f) => `<label class="opt-card"><input type="radio" name="frete" value="${f.id}" ${ck.frete === f.id ? 'checked' : ''}><span class="t">${f.nome}<small>${f.prazo}</small></span><span class="v">${f.valor ? BRL(f.valor) : 'Grátis'}</span></label>`).join('');
  }
  function validate(form, rules) {
    let ok = true, first = null;
    Object.entries(rules).forEach(([n, fn]) => {
      const fld = form.querySelector(`[data-field="${n}"]`);
      const inp = form.elements[n];
      const v = inp && inp.value !== undefined ? inp.value.trim() : '';
      const good = fn(v, inp);
      fld.classList.toggle('bad', !good);
      if (!good) { ok = false; if (!first) first = fld; }
    });
    if (first) { const i = first.querySelector('input'); if (i) i.focus(); first.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    return ok;
  }
  function pedidoTexto(o) {
    const L = [];
    L.push(`*Pedido Alba Studio #${o.num}*`);
    L.push('_(projeto demonstrativo, marca fictícia)_', '');
    L.push('*Itens*');
    o.itens.forEach((i) => L.push(`• ${i.qtd}x ${i.nome}, ${i.cor}, tam. ${i.tam}: ${BRL(i.valor)}`));
    L.push('', `Subtotal: ${BRL(o.sub)}`);
    if (o.desc) L.push(`Cupom ${o.cupom}: − ${BRL(o.desc)}`);
    if (o.pix) L.push(`Desconto Pix (5%): − ${BRL(o.pix)}`);
    L.push(`Frete (${o.frete.nome}, ${o.frete.prazo}): ${o.frete.valor ? BRL(o.frete.valor) : 'grátis'}`);
    L.push(`*Total: ${BRL(o.total)}*`);
    L.push(`Pagamento: ${o.pag === 'pix' ? 'Pix' : 'Cartão de crédito em até 3x'}`, '');
    L.push('*Entrega*');
    L.push(o.nome);
    L.push(`${o.end.rua}, ${o.end.num}${o.end.comp ? ' – ' + o.end.comp : ''}`);
    L.push(`${o.end.bairro} · ${o.end.cidade}/${o.end.uf.toUpperCase()}`);
    L.push(`CEP ${o.end.cep}`);
    L.push(`WhatsApp: ${o.tel}`);
    if (o.email) L.push(`E-mail: ${o.email}`);
    if (o.obs) L.push('', `Obs.: ${o.obs}`);
    return L.join('\n').replace(/ /g, ' ');
  }
  function finalizar() {
    const t = totals();
    const o = {
      num: 'A' + String(Date.now()).slice(-5),
      itens: cart.map((i) => { const p = prod(i.id); return { nome: p.nome, cor: corDe(p, i.cor).nome, tam: tamLabel(i.tam), qtd: i.qtd, valor: p.preco * i.qtd }; }),
      sub: t.sub, desc: t.desc, cupom, pix: t.pix, frete: t.fr, total: t.total, pag: ck.pag,
      nome: ck.dados.nome, tel: ck.dados.tel, email: ck.dados.email, end: ck.entrega, obs: ck.obs,
    };
    o.texto = pedidoTexto(o);
    store.set('alba_pedido', o);
    window.open('https://wa.me/?text=' + encodeURIComponent(o.texto), '_blank', 'noopener');
    cart = []; cupom = null; ck.step = 1; ck.frete = null; ck.obs = ''; saveCk(); saveCart();
    location.hash = '#/pedido';
  }
  function renderDone() {
    const o = store.get('alba_pedido', null);
    if (!o) { location.hash = '#/'; return; }
    document.title = 'Pedido enviado · Alba Studio';
    app.innerHTML = `<div class="done-page">
      <div class="ok-ic"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
      <span class="eyebrow">Pedido #${esc(o.num)}</span>
      <h1>Pedido montado!</h1>
      <p>Abrimos o WhatsApp com a mensagem abaixo já preenchida. Na loja real, ela iria direto para o número da loja, que responde com o link de pagamento. Nesta demonstração o link abre sem destinatário.</p>
      <div class="wa-msg">${esc(o.texto).replace(/\*(.+?)\*/g, '<b>$1</b>').replace(/_(.+?)_/g, '<i>$1</i>')}</div>
      <div class="done-actions"><a class="btn btn-wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(o.texto)}">${ICON.wa} Abrir WhatsApp de novo</a><a class="btn btn-ghost" href="#/">Voltar à loja</a></div>
    </div>`;
  }
  function renderHelp() {
    document.title = 'Trocas e entregas · Alba Studio';
    app.innerHTML = `<div class="help"><div class="crumbs"><a href="#/">Início</a> / Ajuda</div>
      <h1 style="font-family:var(--serif);font-size:48px">Trocas, entregas e pagamento</h1>
      <h2>Trocas e devoluções</h2><p>A primeira troca é grátis em até 30 dias após o recebimento, com a peça sem uso e com etiqueta. Para devolver por arrependimento, você tem 7 dias corridos a partir do recebimento, como prevê o Código de Defesa do Consumidor para compras feitas fora da loja física.</p>
      <h2>Prazos de entrega</h2><p>Postamos em até 2 dias úteis. O prazo de transporte aparece no cálculo de frete, pelo CEP. Acima de ${BRL(D.freteGratisAcima)} o envio econômico é grátis.</p>
      <h2>Formas de pagamento</h2><p>Pix com 5% de desconto ou cartão de crédito em até 3x sem juros. Depois que você envia o pedido pelo WhatsApp, a loja confirma o estoque e manda a chave Pix ou o link de pagamento.</p>
      <p class="note">Projeto demonstrativo: marca e políticas fictícias, criadas para mostrar como a loja funciona.</p></div>`;
  }

  /* ---------- eventos ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target;
    const g = (sel) => t.closest(sel);
    let el;
    if ((el = g('[data-close]'))) { if (el.tagName !== 'A') e.preventDefault(); closeLayers(); return; }
    if (g('.scrim')) { closeLayers(); return; }
    if (t.id === 'modal') { closeLayers(); return; }
    if (g('[data-open-cart]')) { openCart(); return; }
    if (g('[data-menu]')) { openLayer('menu'); return; }
    if (g('[data-open-filters]')) { $('#filters').classList.add('on'); $('.scrim').classList.add('on'); document.body.classList.add('lock'); return; }
    if ((el = g('[data-fav]'))) {
      e.preventDefault();
      const id = el.dataset.fav;
      const on = !favs.includes(id);
      favs = on ? favs.concat(id) : favs.filter((x) => x !== id);
      store.set('alba_favs', favs); badges();
      $$(`[data-fav="${id}"]`).forEach((b) => b.setAttribute('aria-pressed', on));
      toast(on ? 'Salvo nos favoritos.' : 'Removido dos favoritos.');
      if (!on && parseHash().parts[0] === 'favoritos') renderFavs();
      return;
    }
    if ((el = g('[data-dot]'))) {
      const c = el.closest('[data-card]'); const p = prod(c.dataset.card);
      $('.img-main', c).innerHTML = svg(p, el.dataset.dot);
      $('.alt', c).innerHTML = svg(p, el.dataset.dot, 'cena');
      $$('[data-dot]', c).forEach((d) => d.classList.toggle('on', d === el));
      $$('a', c).forEach((a) => { a.href = `#/produto/${p.id}?cor=${el.dataset.dot}`; });
      return;
    }
    // catálogo
    if ((el = g('[data-chip]'))) { const v = el.dataset.chip; F.tam = F.tam.includes(v) ? F.tam.filter((x) => x !== v) : F.tam.concat(v); applyFilters(); return; }
    if ((el = g('[data-sw]'))) { const v = el.dataset.sw; F.cor = F.cor.includes(v) ? F.cor.filter((x) => x !== v) : F.cor.concat(v); applyFilters(); return; }
    if ((el = g('[data-untag]'))) {
      const k = el.dataset.untag, v = el.dataset.v;
      if (k === 'max') { F.max = 600; $('[data-range]').value = 600; } else if (k === 'col') F.col = ''; else if (k === 'novo') F.novo = false;
      else { F[k] = F[k].filter((x) => x !== v); const cb = $(`[data-f="${k}"][value="${v}"]`); if (cb) cb.checked = false; }
      applyFilters(); return;
    }
    if (g('[data-clear]')) {
      F = Object.assign(F, { pub: [], cat: [], tam: [], cor: [], max: 600, q: '', col: '', novo: false });
      $$('[data-f]').forEach((c) => { c.checked = false; }); $('[data-range]').value = 600; $('[data-q]').value = '';
      applyFilters(); return;
    }
    // produto
    if ((el = g('[data-vista]'))) { S.vista = el.dataset.vista; drawProduct(); return; }
    if (g('[data-next-view]')) { const i = VISTAS.findIndex((v) => v[0] === S.vista); S.vista = VISTAS[(i + 1) % 4][0]; drawProduct(); return; }
    if ((el = g('[data-cor]'))) { S.cor = el.dataset.cor; drawProduct(); history.replaceState(null, '', `#/produto/${S.p.id}?cor=${S.cor}`); return; }
    if ((el = g('[data-tam]'))) { S.tam = el.dataset.tam; S.qtd = Math.max(1, S.qtd); drawProduct(); return; }
    if ((el = g('.qty [data-q]'))) {
      if (!S.tam) { toast('Escolha o tamanho primeiro.'); return; }
      S.qtd = Math.max(1, Math.min(est(S.p, S.cor, S.tam), S.qtd + +el.dataset.q)); drawProduct(); return;
    }
    if (g('[data-add]')) {
      if (!S.tam) return;
      if (addCart(S.p.id, S.cor, S.tam, S.qtd)) { toast(`${S.p.nome} na sacola.`); setTimeout(openCart, 250); }
      return;
    }
    if (g('[data-medidas]')) { openModal(guiaMedidas(S.p)); return; }
    // sacola
    if ((el = g('[data-iq]'))) {
      const i = cart[+el.dataset.iq]; const p = prod(i.id);
      const nq = i.qtd + +el.dataset.d;
      if (nq > est(p, i.cor, i.tam)) { toast('Não há mais unidades dessa variação.'); return; }
      if (nq <= 0) cart.splice(+el.dataset.iq, 1); else i.qtd = nq;
      saveCart(); renderCart(); return;
    }
    if ((el = g('[data-rm]'))) { cart.splice(+el.dataset.rm, 1); saveCart(); renderCart(); return; }
    if ((el = g('[data-use-cupom]'))) { cupom = el.dataset.useCupom; saveCart(); renderCart(); toast('Cupom ALBA10 aplicado: 10% off.'); return; }
    if (g('[data-rm-cupom]')) { cupom = null; saveCart(); renderCart(); return; }
    // checkout
    if ((el = g('[data-go]'))) { ck.step = +el.dataset.go; saveCk(); renderCheckout(); window.scrollTo(0, 0); return; }
    if (g('[data-s-toggle]')) { $('#summary').classList.toggle('collapsed'); return; }
  });

  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-f]')) { const k = t.dataset.f; F[k] = t.checked ? F[k].concat(t.value) : F[k].filter((x) => x !== t.value); applyFilters(); }
    if (t.matches('[data-ord]')) { F.ord = t.value; applyFilters(); }
    if (t.name === 'frete') { ck.frete = t.value; saveCk(); $('#summary').outerHTML = summaryHTML(); }
    if (t.name === 'pag') { ck.pag = t.value; saveCk(); $('#summary').outerHTML = summaryHTML(); }
  });

  let qT;
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.matches('[data-range]')) { F.max = +t.value; applyFilters(); }
    if (t.matches('[data-q]')) { clearTimeout(qT); qT = setTimeout(() => { F.q = t.value; applyFilters(); }, 150); }
    if (t.matches('[data-cep]') || t.name === 'cep') {
      t.value = maskCep(t.value);
      if (t.name === 'cep') {
        ck.entrega.cep = t.value;
        const box = $('#freteOps');
        if (cepOk(t.value)) { box.innerHTML = freteOpts(fretes(t.value, subtotal() - desconto(subtotal()))); }
        else { box.innerHTML = '<p class="co-sub" style="margin:0">Digite o CEP para ver as opções.</p>'; ck.frete = null; }
        saveCk();
        $('#summary').outerHTML = summaryHTML();
      }
    }
    if (t.name === 'tel') t.value = maskTel(t.value);
    if (t.name === 'uf') t.value = t.value.replace(/[^a-z]/gi, '').toUpperCase();
    const fld = t.closest('.field.bad'); if (fld) fld.classList.remove('bad');
  });

  document.addEventListener('submit', (e) => {
    const f = e.target;
    e.preventDefault();
    if (f.matches('[data-news]')) { f.reset(); toast('Demonstração: nenhum e-mail é cadastrado.'); return; }
    if (f.matches('[data-cupom]')) {
      const v = f.querySelector('input').value.trim().toUpperCase();
      if (D.cupons[v]) { cupom = v; saveCart(); renderCart(); toast(`Cupom ${v} aplicado.`); } else toast('Cupom inválido. Experimente ALBA10.');
      return;
    }
    if (f.matches('[data-ship]')) {
      const cep = f.querySelector('input').value;
      const res = $('#shipRes');
      if (!cepOk(cep)) { res.innerHTML = '<li>Digite um CEP com 8 números.</li>'; return; }
      ck.entrega.cep = maskCep(cep); saveCk();
      res.innerHTML = fretes(cep, S.p.preco * S.qtd).map((x) => `<li><span>${x.nome} · ${x.prazo}</span><span class="${x.valor ? '' : 'free'}">${x.valor ? BRL(x.valor) : 'Grátis'}</span></li>`).join('');
      return;
    }
    const step = f.dataset.step;
    if (step === '1') {
      const ok = validate(f, {
        nome: (v) => v.split(/\s+/).filter(Boolean).length >= 2,
        tel: (v) => v.replace(/\D/g, '').length >= 10,
        email: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      });
      if (!ok) return;
      ck.dados = { nome: f.nome.value.trim(), tel: f.tel.value.trim(), email: f.email.value.trim() };
      ck.step = 2; saveCk(); renderCheckout(); window.scrollTo(0, 0);
    } else if (step === '2') {
      const ok = validate(f, {
        cep: cepOk, rua: (v) => v.length > 2, num: (v) => v.length > 0, bairro: (v) => v.length > 1, cidade: (v) => v.length > 1,
        uf: (v) => /^[A-Z]{2}$/i.test(v), frete: () => !!ck.frete,
      });
      if (!ok) return;
      ['cep', 'rua', 'num', 'comp', 'bairro', 'cidade', 'uf'].forEach((k) => { ck.entrega[k] = f.elements[k].value.trim(); });
      ck.step = 3; saveCk(); renderCheckout(); window.scrollTo(0, 0);
    } else if (step === '3') {
      ck.obs = f.obs.value.trim(); saveCk();
      finalizar();
    }
  });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLayers(); });
  window.addEventListener('hashchange', route);

  /* ---------- início ---------- */
  function boot(data) {
    D = data;
    cart = cart.filter((i) => prod(i.id));
    if (cupom && !D.cupons[cupom]) cupom = null;
    // ?seed=1 coloca duas peças de exemplo na sacola (útil para mostrar o checkout)
    if (/[?&]seed=1/.test(location.search) && !cart.length) {
      cart = [{ id: 'vestido-midi-alcas', cor: 'terracota', tam: 'M', qtd: 1 }, { id: 'bolsa-tote-couro', cor: 'caramelo', tam: 'U', qtd: 1 }];
      saveCart();
    }
    badges();
    route();
    if (/[?&]cart=1/.test(location.search)) openCart();
  }
  if (location.protocol === 'file:' && window.ALBA_DATA) boot(window.ALBA_DATA);
  else fetch('data/produtos.json').then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).catch(() => window.ALBA_DATA).then(boot);
})();

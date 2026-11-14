/* Lar à Vista · portal imobiliário demonstrativo (front-end puro, dados mock). */
(function () {
  const D = window.DADOS;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const app = $('#app');
  const EU = 'c1'; // corretora logada na demo (fictícia)

  /* ---------- armazenamento local (tolerante a falhas) ---------- */
  const PFX = 'larvista:';
  const ler = (k, def) => { try { const v = localStorage.getItem(PFX + k); return v ? JSON.parse(v) : def; } catch (e) { return def; } };
  const gravar = (k, v) => { try { localStorage.setItem(PFX + k, JSON.stringify(v)); } catch (e) { /* cota cheia ou bloqueado */ } };

  const st = {
    favs: new Set(ler('favs', [])),
    leads: ler('leads', []),
    extras: ler('extras', []),
    ov: ler('ov', {}),          // overrides de status de anúncio {id:{status,motivo}}
    corr: ler('corr', {}),      // overrides de status de anunciante
    precos: ler('precos', {}),  // preços de planos editados
    mapa: ler('mapa', 'ruas'),
    f: Object.assign({ fin: 'venda', tipo: '', pmin: '', pmax: '', quartos: 0, bairro: '', ordem: 'relevancia' }, ler('filtros', {})),
    rascunho: null,
    vistaMob: 'lista',
  };
  try { const qm = new URLSearchParams(location.search).get('mapa'); if (qm === 'ilustrado' || qm === 'ruas') st.mapa = qm; } catch (e) { }
  const salvar = () => { gravar('favs', [...st.favs]); gravar('leads', st.leads); gravar('extras', st.extras); gravar('ov', st.ov); gravar('corr', st.corr); gravar('precos', st.precos); gravar('filtros', st.f); gravar('mapa', st.mapa); };

  /* ---------- dados derivados ---------- */
  const todos = () => D.imoveis.concat(st.extras).map(i => st.ov[i.id] ? Object.assign({}, i, st.ov[i.id]) : i);
  const pub = () => todos().filter(i => i.status === 'publicado');
  const porId = id => todos().find(i => i.id === id);
  const corretor = id => { const c = D.corretores.find(x => x.id === id); return c ? Object.assign({}, c, st.corr[id] ? { status: st.corr[id] } : {}) : null; };
  const bairro = id => D.bairros.find(b => b.id === id) || { nome: id };
  const plano = id => { const p = D.planos.find(x => x.id === id); return Object.assign({}, p, st.precos[id] != null ? { preco: st.precos[id] } : {}); };
  const TIPOS = { casa: 'Casa', apartamento: 'Apartamento', sobrado: 'Sobrado', studio: 'Studio', terreno: 'Terreno', comercial: 'Comercial' };
  const STATUS = { publicado: 'Publicado', em_analise: 'Em análise', reprovado: 'Reprovado', pausado: 'Pausado' };

  /* ---------- formatação ---------- */
  const brl = (v, dec) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: dec ? 2 : 0, maximumFractionDigits: dec ? 2 : 0 });
  const num = v => v.toLocaleString('pt-BR');
  const curto = v => v >= 1e6 ? 'R$ ' + (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' mi' : v >= 1e4 ? 'R$ ' + Math.round(v / 1e3) + ' mil' : 'R$ ' + num(v);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ico = (n, cls) => `<svg class="ico ${cls || ''}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const precoTxt = i => i.finalidade === 'aluguel' ? brl(i.preco) + '<small>/mês</small>' : brl(i.preco);

  function toast(msg, tipo) {
    const t = document.createElement('div');
    t.className = 'toast ' + (tipo || '');
    t.innerHTML = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => t.classList.add('sai'), 3600);
    setTimeout(() => t.remove(), 4100);
  }

  /* ---------- fotos ---------- */
  function fotoHTML(im, idx) {
    const f = im.fotos[idx];
    if (typeof f === 'string' && f.startsWith('up:')) {
      const src = (im.uploads || [])[+f.slice(3)];
      return src ? `<img src="${src}" alt="Foto enviada pelo anunciante">` : Fotos.svg(im, 'fachada');
    }
    return Fotos.svg(im, f);
  }
  const fotoNome = (im, idx) => { const f = im.fotos[idx]; return f.startsWith('up:') ? 'Foto ' + (idx + 1) : Fotos.nome(f); };

  /* ---------- cartões ---------- */
  function atributos(i, compacto) {
    const a = [];
    if (i.quartos) a.push(`<span>${ico('bed')}${i.quartos}${compacto ? '' : i.quartos > 1 ? ' quartos' : ' quarto'}</span>`);
    if (i.banheiros) a.push(`<span>${ico('bath')}${i.banheiros}${compacto ? '' : i.banheiros > 1 ? ' banheiros' : ' banheiro'}</span>`);
    if (i.vagas) a.push(`<span>${ico('car')}${i.vagas}${compacto ? '' : i.vagas > 1 ? ' vagas' : ' vaga'}</span>`);
    a.push(`<span>${ico('area')}${num(i.area)} m²</span>`);
    return `<div class="attrs">${a.join('')}</div>`;
  }
  function cartao(i) {
    const fav = st.favs.has(i.id);
    return `<article class="card" data-id="${i.id}">
      <a class="card-foto" href="#/imovel/${i.id}" aria-label="${esc(i.titulo)}">${fotoHTML(i, 0)}
        <span class="tags">${i.destaque ? '<span class="tag tag-dest">Destaque</span>' : ''}<span class="tag">${i.finalidade === 'venda' ? 'Venda' : 'Aluguel'}</span></span>
        <span class="n-fotos">${i.fotos.length} ${i.fotos.length > 1 ? 'imagens' : 'imagem'}</span>
      </a>
      <button class="fav ${fav ? 'on' : ''}" data-fav="${i.id}" aria-pressed="${fav}" aria-label="${fav ? 'Tirar dos favoritos' : 'Salvar nos favoritos'}">${ico('heart')}</button>
      <a class="card-corpo" href="#/imovel/${i.id}">
        <div class="preco">${precoTxt(i)}</div>
        ${i.condominio ? `<div class="cond">Cond. ${brl(i.condominio)}${i.iptu ? ' · IPTU ' + brl(i.iptu) + '/ano' : ''}</div>` : i.iptu ? `<div class="cond">IPTU ${brl(i.iptu)}/ano</div>` : '<div class="cond">&nbsp;</div>'}
        <h3>${esc(i.titulo)}</h3>
        <p class="end">${ico('pin')}${esc(bairro(i.bairro).nome)} · ${TIPOS[i.tipo]}</p>
        ${atributos(i, true)}
      </a>
    </article>`;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-fav]');
    if (!b) return;
    e.preventDefault();
    const id = b.dataset.fav;
    if (st.favs.has(id)) { st.favs.delete(id); toast('Removido dos favoritos'); } else { st.favs.add(id); toast(ico('heart') + ' Salvo nos favoritos'); }
    salvar();
    $$(`[data-fav="${id}"]`).forEach(x => { const on = st.favs.has(id); x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    atualizarNav();
    if (location.hash.startsWith('#/favoritos')) render();
  });

  /* ---------- roteamento ---------- */
  let mapaAtual = [];
  function limparMapas() { mapaAtual.forEach(m => { try { m.destroy(); } catch (e) { } }); mapaAtual = []; }
  const rota = () => (location.hash.replace(/^#\/?/, '') || 'busca').split('/');
  const papelDe = r => r[0] === 'corretor' ? 'corretor' : r[0] === 'admin' ? 'admin' : 'visitante';

  function atualizarNav() {
    const r = rota(), papel = papelDe(r);
    $$('.perfil button').forEach(b => { b.classList.toggle('on', b.dataset.role === papel); b.setAttribute('aria-pressed', b.dataset.role === papel); });
    const links = {
      visitante: [['busca', 'Buscar imóveis'], ['favoritos', `Favoritos${st.favs.size ? ` <b>${st.favs.size}</b>` : ''}`]],
      corretor: [['corretor', 'Meu painel'], ['corretor/novo', 'Novo anúncio']],
      admin: [['admin', 'Moderação'], ['admin/anunciantes', 'Anunciantes'], ['admin/planos', 'Planos']],
    }[papel];
    const atual = r.join('/');
    $('#nav').innerHTML = links.map(([h, t]) => `<a href="#/${h}" class="${atual === h || (h === 'busca' && r[0] === 'imovel') ? 'on' : ''}">${t}</a>`).join('');
    document.body.dataset.papel = papel;
  }
  $$('.perfil button').forEach(b => b.addEventListener('click', () => {
    location.hash = { visitante: '#/busca', corretor: '#/corretor', admin: '#/admin' }[b.dataset.role];
  }));

  function render() {
    limparMapas();
    const r = rota();
    atualizarNav();
    if (r[0] === 'imovel') vImovel(r[1]);
    else if (r[0] === 'favoritos') vFavoritos();
    else if (r[0] === 'corretor' && r[1] === 'novo') vNovo();
    else if (r[0] === 'corretor') vPainel();
    else if (r[0] === 'admin' && r[1] === 'anunciantes') vAnunciantes();
    else if (r[0] === 'admin' && r[1] === 'planos') vPlanos();
    else if (r[0] === 'admin') vModeracao();
    else vBusca();
  }
  window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });

  /* =================================================================
     VISITANTE · BUSCA
     ================================================================= */
  const FAIXAS = {
    venda: [100000, 200000, 300000, 400000, 500000, 700000, 1000000],
    aluguel: [1000, 1500, 2000, 2500, 3000, 4000],
  };
  function filtrar() {
    const f = st.f;
    let l = pub().filter(i => (!f.fin || i.finalidade === f.fin) && (!f.tipo || i.tipo === f.tipo) && (!f.bairro || i.bairro === f.bairro)
      && (!f.quartos || i.quartos >= f.quartos) && (!f.pmin || i.preco >= +f.pmin) && (!f.pmax || i.preco <= +f.pmax));
    const o = f.ordem;
    if (o === 'menor') l.sort((a, b) => a.preco - b.preco);
    else if (o === 'maior') l.sort((a, b) => b.preco - a.preco);
    else if (o === 'recentes') l.sort((a, b) => b.publicado.localeCompare(a.publicado));
    else if (o === 'm2') l.sort((a, b) => a.preco / a.area - b.preco / b.area);
    else l.sort((a, b) => (b.destaque - a.destaque) || b.publicado.localeCompare(a.publicado));
    return l;
  }
  const opt = (v, t, sel) => `<option value="${v}"${String(sel) === String(v) ? ' selected' : ''}>${t}</option>`;

  function vBusca() {
    const f = st.f;
    const faixas = FAIXAS[f.fin || 'venda'];
    app.innerHTML = `
    <section class="hero">
      <div class="hero-in">
        <p class="eyebrow">Imóveis em Vale Serena · cidade fictícia</p>
        <h1>Casa, apartamento ou ponto comercial, <em>com o mapa na mão.</em></h1>
        <div class="busca-rapida">
          <div class="seg" role="group" aria-label="Finalidade">
            <button data-fin="venda" class="${f.fin === 'venda' ? 'on' : ''}">Comprar</button>
            <button data-fin="aluguel" class="${f.fin === 'aluguel' ? 'on' : ''}">Alugar</button>
          </div>
          <label class="campo"><span>Tipo</span><select data-f="tipo">${opt('', 'Todos os tipos', f.tipo)}${Object.entries(TIPOS).map(([k, v]) => opt(k, v, f.tipo)).join('')}</select></label>
          <label class="campo"><span>Bairro</span><select data-f="bairro">${opt('', 'Todos os bairros', f.bairro)}${D.bairros.map(b => opt(b.id, b.nome, f.bairro)).join('')}</select></label>
          <a class="btn btn-pri" href="#resultados">${ico('search')} Ver imóveis</a>
        </div>
      </div>
    </section>
    <section class="filtros" id="resultados">
      <div class="filtros-in">
        <label class="campo"><span>Preço mínimo</span><select data-f="pmin">${opt('', 'Sem mínimo', f.pmin)}${faixas.map(v => opt(v, curto(v), f.pmin)).join('')}</select></label>
        <label class="campo"><span>Preço máximo</span><select data-f="pmax">${opt('', 'Sem máximo', f.pmax)}${faixas.map(v => opt(v, curto(v), f.pmax)).join('')}</select></label>
        <div class="campo"><span>Quartos</span><div class="chips" role="group" aria-label="Quartos">${[0, 1, 2, 3, 4].map(q => `<button data-q="${q}" class="${+f.quartos === q ? 'on' : ''}">${q ? q + '+' : 'Todos'}</button>`).join('')}</div></div>
        <label class="campo"><span>Ordenar por</span><select data-f="ordem">${opt('relevancia', 'Relevância', f.ordem)}${opt('menor', 'Menor preço', f.ordem)}${opt('maior', 'Maior preço', f.ordem)}${opt('recentes', 'Mais recentes', f.ordem)}${opt('m2', 'Menor preço por m²', f.ordem)}</select></label>
        <button class="link limpar" id="limpar">Limpar filtros</button>
      </div>
    </section>
    <section class="resultados vista-${st.vistaMob}">
      <div class="lista-col">
        <div class="lista-topo"><p id="contagem"></p>
          <div class="seg seg-mob" role="group" aria-label="Exibir"><button data-vista="lista" class="${st.vistaMob === 'lista' ? 'on' : ''}">${ico('list')} Lista</button><button data-vista="mapa" class="${st.vistaMob === 'mapa' ? 'on' : ''}">${ico('map')} Mapa</button></div>
        </div>
        <div class="grade" id="grade"></div>
      </div>
      <div class="mapa-col">
        <div class="mapa-box">
          <div class="mapa" id="mapa"></div>
          <div class="mapa-modo" role="group" aria-label="Tipo de mapa"><button data-modo="ruas" class="${st.mapa === 'ruas' ? 'on' : ''}">Ruas</button><button data-modo="ilustrado" class="${st.mapa === 'ilustrado' ? 'on' : ''}">Ilustrado</button></div>
          <div class="mapa-card" id="mapaCard" hidden></div>
        </div>
        <p class="nota">Bairros e endereços fictícios; os marcadores estão em posições ilustrativas.</p>
      </div>
    </section>`;

    const clickPin = id => {
      const i = porId(id); if (!i) return;
      const c = $('#mapaCard');
      c.hidden = false;
      c.innerHTML = `<button class="x" aria-label="Fechar">${ico('x')}</button><a href="#/imovel/${i.id}" class="mc"><span class="mc-foto">${fotoHTML(i, 0)}</span><span><b>${precoTxt(i)}</b><span>${esc(i.titulo)}</span><small>${esc(bairro(i.bairro).nome)}</small></span></a>`;
      $('.x', c).onclick = () => { c.hidden = true; };
      mapa.destacar(id);
      const card = $(`#grade .card[data-id="${id}"]`);
      $$('#grade .card').forEach(x => x.classList.toggle('foco', x === card));
    };
    const pontos = l => l.map(i => ({ id: i.id, lat: i.lat, lng: i.lng, titulo: i.titulo, destaque: i.destaque, rotulo: i.finalidade === 'aluguel' ? brl(i.preco) : curto(i.preco) }));
    let mapa;
    const criarMapa = l => {
      if (mapa) { mapa.destroy(); mapaAtual = mapaAtual.filter(m => m !== mapa); }
      mapa = Mapa.criar($('#mapa'), pontos(l), clickPin, { modo: st.mapa, aoTrocar: m => { $$('.mapa-modo button').forEach(b => b.classList.toggle('on', b.dataset.modo === m)); toast('Sem conexão com o OpenStreetMap: mostrando o mapa ilustrado.'); } });
      mapaAtual.push(mapa);
    };

    const atualizar = () => {
      const l = filtrar();
      $('#contagem').innerHTML = `<b>${l.length}</b> ${l.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}${st.f.bairro ? ' em ' + esc(bairro(st.f.bairro).nome) : ''}`;
      $('#grade').innerHTML = l.length ? l.map(cartao).join('') : `<div class="vazio">${ico('search')}<h3>Nenhum imóvel com esses filtros</h3><p>Tente aumentar a faixa de preço ou trocar o bairro.</p><button class="btn" id="limpar2">Limpar filtros</button></div>`;
      const l2 = $('#limpar2'); if (l2) l2.onclick = limpar;
      if (mapa) mapa.set(pontos(l)); else criarMapa(l);
      $('#mapaCard').hidden = true;
      salvar();
    };
    const limpar = () => { Object.assign(st.f, { tipo: '', pmin: '', pmax: '', quartos: 0, bairro: '', ordem: 'relevancia' }); vBusca(); };

    $$('[data-f]').forEach(s => s.addEventListener('change', () => { st.f[s.dataset.f] = s.value; $$(`[data-f="${s.dataset.f}"]`).forEach(o => { o.value = s.value; }); atualizar(); }));
    $$('[data-fin]').forEach(b => b.addEventListener('click', () => { if (st.f.fin === b.dataset.fin) return; st.f.fin = b.dataset.fin; st.f.pmin = ''; st.f.pmax = ''; limparMapas(); vBusca(); }));
    $$('[data-q]').forEach(b => b.addEventListener('click', () => { st.f.quartos = +b.dataset.q; $$('[data-q]').forEach(x => x.classList.toggle('on', x === b)); atualizar(); }));
    $('#limpar').onclick = () => { limparMapas(); limpar(); };
    $$('[data-vista]').forEach(b => b.addEventListener('click', () => {
      st.vistaMob = b.dataset.vista;
      $('.resultados').className = 'resultados vista-' + st.vistaMob;
      $$('[data-vista]').forEach(x => x.classList.toggle('on', x === b));
      if (st.vistaMob === 'mapa') criarMapa(filtrar());
    }));
    $$('[data-modo]').forEach(b => b.addEventListener('click', () => {
      st.mapa = b.dataset.modo; salvar();
      if (st.mapa === 'ruas') Mapa.falhouOnline = false;
      $$('[data-modo]').forEach(x => x.classList.toggle('on', x === b));
      criarMapa(filtrar());
    }));
    $('a[href="#resultados"]').addEventListener('click', e => { e.preventDefault(); $('#resultados').scrollIntoView({ behavior: 'smooth' }); });
    $('#grade').addEventListener('mouseover', e => { const c = e.target.closest('.card'); if (c && mapa) mapa.destacar(c.dataset.id); });
    atualizar();
  }

  /* =================================================================
     VISITANTE · IMÓVEL
     ================================================================= */
  function vImovel(id) {
    const i = porId(id);
    if (!i) { app.innerHTML = `<section class="pagina"><div class="vazio">${ico('search')}<h3>Imóvel não encontrado</h3><p>O anúncio pode ter sido removido.</p><a class="btn" href="#/busca">Voltar à busca</a></div></section>`; return; }
    const c = corretor(i.corretor);
    const fav = st.favs.has(i.id);
    const venda = i.finalidade === 'venda';
    const naoPub = i.status !== 'publicado';
    app.innerHTML = `
    <section class="pagina imovel">
      ${naoPub ? `<div class="aviso">Pré-visualização: este anúncio está <b>${STATUS[i.status].toLowerCase()}</b> e não aparece na busca pública.</div>` : ''}
      <nav class="migalha"><a href="#/busca">${ico('left')} Voltar à busca</a><span>${TIPOS[i.tipo]} · ${venda ? 'Venda' : 'Aluguel'} · Cód. ${i.id}</span></nav>
      <div class="galeria" id="galeria">
        <div class="g-principal">
          <div class="g-img" id="gImg"></div>
          <button class="g-seta g-ant" aria-label="Imagem anterior">${ico('left')}</button>
          <button class="g-seta g-prox" aria-label="Próxima imagem">${ico('right')}</button>
          <span class="g-leg" id="gLeg"></span>
          <span class="g-selo">Ilustrações · sem fotos reais</span>
        </div>
        <div class="g-thumbs" id="gThumbs">${i.fotos.map((_, k) => `<button data-k="${k}" aria-label="${esc(fotoNome(i, k))}">${fotoHTML(i, k)}</button>`).join('')}</div>
      </div>
      <div class="im-grid">
        <div class="im-main">
          <header class="im-cab">
            <div>
              <h1>${esc(i.titulo)}</h1>
              <p class="end">${ico('pin')}${esc(i.endereco)} · Vale Serena</p>
            </div>
            <button class="fav fav-grande ${fav ? 'on' : ''}" data-fav="${i.id}" aria-pressed="${fav}" aria-label="Salvar nos favoritos">${ico('heart')}<span>Favoritar</span></button>
          </header>
          <div class="im-attrs">
            ${i.quartos ? `<div>${ico('bed')}<b>${i.quartos}</b><span>${i.quartos > 1 ? 'quartos' : 'quarto'}${i.suites ? ` (${i.suites} suíte${i.suites > 1 ? 's' : ''})` : ''}</span></div>` : ''}
            ${i.banheiros ? `<div>${ico('bath')}<b>${i.banheiros}</b><span>${i.banheiros > 1 ? 'banheiros' : 'banheiro'}</span></div>` : ''}
            ${i.vagas ? `<div>${ico('car')}<b>${i.vagas}</b><span>${i.vagas > 1 ? 'vagas' : 'vaga'}</span></div>` : ''}
            <div>${ico('area')}<b>${num(i.area)} m²</b><span>${i.tipo === 'terreno' ? 'de terreno' : 'de área útil'}</span></div>
          </div>
          <h2>Sobre o imóvel</h2>
          <p class="desc">${esc(i.descricao)}</p>
          <ul class="carac">${i.caracteristicas.map(x => `<li>${ico('check')}${esc(x)}</li>`).join('')}</ul>
          ${venda ? simuladorHTML(i) : aluguelHTML(i)}
          <h2>Localização</h2>
          <div class="mapa mapa-peq" id="mapaIm"></div>
          <p class="nota">Endereço fictício. Na versão real, o anunciante escolhe se mostra o endereço exato ou só a região.</p>
        </div>
        <aside class="im-lado">
          <div class="caixa preco-box">
            <span class="rot">${venda ? 'Valor de venda' : 'Aluguel'}</span>
            <div class="preco grande">${precoTxt(i)}</div>
            <dl>${i.condominio ? `<dt>Condomínio</dt><dd>${brl(i.condominio)}/mês</dd>` : ''}${i.iptu ? `<dt>IPTU</dt><dd>${brl(i.iptu)}/ano</dd>` : ''}<dt>Preço por m²</dt><dd>${brl(Math.round(i.preco / i.area))}</dd></dl>
          </div>
          <form class="caixa contato" id="contato">
            <div class="anunciante"><span class="av" style="background:${c.cor}">${c.nome.split(' ').map(p => p[0]).slice(0, 2).join('')}</span><div><b>${esc(c.nome)}</b><small>${esc(c.tipo)} · fictício</small></div></div>
            <h3>Falar com o anunciante</h3>
            <label class="campo"><span>Nome</span><input name="nome" required autocomplete="name" placeholder="Seu nome"></label>
            <label class="campo"><span>E-mail</span><input name="email" type="email" required autocomplete="email" placeholder="voce@exemplo.com"></label>
            <label class="campo"><span>Telefone</span><input name="tel" inputmode="tel" autocomplete="tel" placeholder="(00) 00000-0000"></label>
            <label class="campo"><span>Mensagem</span><textarea name="msg" rows="3">Olá! Vi o imóvel ${i.id} no Lar à Vista e gostaria de mais informações${venda ? '' : ' sobre a visita'}.</textarea></label>
            <button class="btn btn-pri largo" type="submit">${ico('chat')} Enviar mensagem</button>
            <p class="nota">Formulário de demonstração: nada é enviado. A mensagem aparece no painel do corretor dentro deste navegador.</p>
          </form>
        </aside>
      </div>
    </section>`;

    // galeria
    let k = 0;
    const mostrar = n => {
      k = (n + i.fotos.length) % i.fotos.length;
      $('#gImg').innerHTML = fotoHTML(i, k);
      $('#gLeg').textContent = `${fotoNome(i, k)} · ${k + 1}/${i.fotos.length}`;
      $$('#gThumbs button').forEach((b, j) => b.classList.toggle('on', j === k));
    };
    $('.g-ant').onclick = () => mostrar(k - 1);
    $('.g-prox').onclick = () => mostrar(k + 1);
    $('#gThumbs').onclick = e => { const b = e.target.closest('button'); if (b) mostrar(+b.dataset.k); };
    $('#galeria').addEventListener('keydown', e => { if (e.key === 'ArrowLeft') mostrar(k - 1); if (e.key === 'ArrowRight') mostrar(k + 1); });
    let x0 = null;
    $('#gImg').addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    $('#gImg').addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) mostrar(k + (dx < 0 ? 1 : -1)); x0 = null; });
    if (i.fotos.length < 2) $$('.g-seta').forEach(b => b.hidden = true);
    mostrar(0);

    // mapa
    const m = Mapa.criar($('#mapaIm'), [{ id: i.id, lat: i.lat, lng: i.lng, titulo: i.titulo, destaque: true, rotulo: TIPOS[i.tipo] }], () => {}, { modo: st.mapa, zoom: 15 });
    mapaAtual.push(m);

    if (venda) ligarSimulador(i);

    $('#contato').addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      st.leads.unshift({ imovel: i.id, corretor: i.corretor, nome: fd.get('nome'), email: fd.get('email'), tel: fd.get('tel'), msg: fd.get('msg'), quando: new Date().toISOString() });
      salvar();
      e.target.innerHTML = `<div class="ok">${ico('check')}<h3>Mensagem registrada</h3><p>Isto é uma demonstração: nada saiu do seu navegador. ${i.corretor === EU ? 'Troque para <b>Ver como: Corretor</b> para ver o contato chegando no painel.' : 'Na versão real, o anunciante receberia por e-mail e WhatsApp.'}</p></div>`;
      toast(ico('check') + ' Contato de demonstração registrado', 'ok');
    });
  }

  function aluguelHTML(i) {
    const total = i.preco + (i.condominio || 0) + Math.round((i.iptu || 0) / 12);
    return `<div class="caixa custo"><h2>Custo mensal estimado</h2>
      <div class="custo-linhas"><span>Aluguel</span><b>${brl(i.preco)}</b><span>Condomínio</span><b>${i.condominio ? brl(i.condominio) : '—'}</b><span>IPTU (mensal)</span><b>${i.iptu ? brl(Math.round(i.iptu / 12)) : 'incluso ou a confirmar'}</b><span class="tot">Total por mês</span><b class="tot">${brl(total)}</b></div>
      <p class="nota">Estimativa. Seguro-incêndio, garantia (fiador, caução ou seguro-fiança) e contas de consumo não estão incluídos.</p></div>`;
  }

  /* ---------- simulador de financiamento ---------- */
  function simuladorHTML(i) {
    const ent = Math.round(i.preco * 0.2 / 1000) * 1000;
    return `<section class="caixa sim" id="sim">
      <div class="sim-cab"><h2>Simular financiamento</h2>
        <div class="seg" role="group" aria-label="Sistema de amortização"><button data-sis="price" class="on">Price</button><button data-sis="sac">SAC</button></div></div>
      <div class="sim-grid">
        <div class="sim-in">
          <label class="campo"><span>Valor do imóvel</span><input id="sValor" inputmode="numeric" value="${num(i.preco)}"></label>
          <label class="campo"><span>Entrada <output id="oEnt"></output></span><input id="sEnt" type="range" min="0" max="${i.preco}" step="1000" value="${ent}"></label>
          <label class="campo"><span>Prazo <output id="oPrazo"></output></span><input id="sPrazo" type="range" min="5" max="35" step="1" value="30"></label>
          <label class="campo"><span>Juros ao ano <output id="oJuros"></output></span><input id="sJuros" type="range" min="6" max="16" step="0.1" value="11"></label>
        </div>
        <div class="sim-out" id="sOut"></div>
      </div>
      <p class="nota"><b>É só uma estimativa.</b> A conta não inclui seguros obrigatórios (MIP e DFI), tarifas, correção pela TR nem custos de cartório e ITBI. Taxa, prazo e entrada mínima dependem da análise de crédito de cada banco.</p>
    </section>`;
  }
  function calcular(P, anos, taxaAA, sis) {
    const n = anos * 12, j = Math.pow(1 + taxaAA / 100, 1 / 12) - 1;
    if (P <= 0) return { n, primeira: 0, ultima: 0, total: 0, juros: 0, serie: [] };
    const serie = [];
    let total = 0;
    if (sis === 'price') {
      const pmt = P * j / (1 - Math.pow(1 + j, -n));
      for (let m = 0; m < n; m += 12) serie.push(pmt);
      total = pmt * n;
      return { n, j, primeira: pmt, ultima: pmt, total, juros: total - P, serie };
    }
    const a = P / n;
    for (let m = 0; m < n; m++) { const p = a + (P - a * m) * j; total += p; if (m % 12 === 0) serie.push(p); }
    return { n, j, primeira: a + P * j, ultima: a + a * j, total, juros: total - P, serie };
  }
  function ligarSimulador(i) {
    let sis = 'price';
    const v = () => +($('#sValor').value.replace(/\D/g, '')) || 0;
    const upd = () => {
      const valor = v(), entR = $('#sEnt');
      entR.max = valor; if (+entR.value > valor) entR.value = valor;
      const ent = +entR.value, anos = +$('#sPrazo').value, tx = +$('#sJuros').value;
      $('#oEnt').textContent = `${brl(ent)} (${valor ? Math.round(ent / valor * 100) : 0}%)`;
      $('#oPrazo').textContent = `${anos} anos (${anos * 12} meses)`;
      $('#oJuros').textContent = tx.toLocaleString('pt-BR', { minimumFractionDigits: 1 }) + '% a.a.';
      const P = Math.max(0, valor - ent);
      const r = calcular(P, anos, tx, sis), o = calcular(P, anos, tx, sis === 'price' ? 'sac' : 'price');
      const max = Math.max(...r.serie, ...o.serie, 1);
      const pts = (s, w, h) => s.map((y, x) => `${(x / Math.max(1, s.length - 1)) * w},${h - (y / max) * (h - 8)}`).join(' ');
      $('#sOut').innerHTML = `
        <div class="sim-dest"><span>${sis === 'price' ? 'Parcela fixa' : '1ª parcela'}</span><b>${brl(r.primeira, true)}</b>${sis === 'sac' ? `<small>caindo até ${brl(r.ultima, true)} na última</small>` : '<small>mesmo valor do início ao fim</small>'}</div>
        <dl class="sim-dl"><dt>Valor financiado</dt><dd>${brl(P)}</dd><dt>Total pago ao banco</dt><dd>${brl(r.total)}</dd><dt>Juros no período</dt><dd>${brl(r.juros)}</dd><dt>No ${sis === 'price' ? 'SAC' : 'Price'}, os juros seriam</dt><dd>${brl(o.juros)}</dd></dl>
        <svg viewBox="0 0 300 90" preserveAspectRatio="none" class="sim-graf" role="img" aria-label="Evolução da parcela ao longo do prazo">
          <polyline points="${pts(o.serie, 300, 86)}" fill="none" stroke="#c9bfae" stroke-width="2" stroke-dasharray="4 4"/>
          <polyline points="${pts(r.serie, 300, 86)}" fill="none" stroke="#c4683f" stroke-width="3"/>
        </svg>
        <div class="sim-leg"><span><i style="background:#c4683f"></i>${sis === 'price' ? 'Price' : 'SAC'}</span><span><i class="tracej"></i>${sis === 'price' ? 'SAC' : 'Price'}</span><span>parcela ao longo de ${anos} anos</span></div>`;
    };
    $('#sValor').addEventListener('input', e => { const d = e.target.value.replace(/\D/g, ''); e.target.value = d ? num(+d) : ''; upd(); });
    ['#sEnt', '#sPrazo', '#sJuros'].forEach(s => $(s).addEventListener('input', upd));
    $$('[data-sis]').forEach(b => b.addEventListener('click', () => { sis = b.dataset.sis; $$('[data-sis]').forEach(x => x.classList.toggle('on', x === b)); upd(); }));
    upd();
  }

  /* ---------- favoritos ---------- */
  function vFavoritos() {
    const l = pub().filter(i => st.favs.has(i.id));
    app.innerHTML = `<section class="pagina">
      <header class="pag-cab"><div><p class="eyebrow">Visitante</p><h1>Seus favoritos</h1><p class="sub">Ficam salvos neste navegador. Na versão real, sincronizam com a conta e avisam quando o preço baixa.</p></div></header>
      ${l.length ? `<div class="grade grade-larga">${l.map(cartao).join('')}</div>` : `<div class="vazio">${ico('heart')}<h3>Nenhum favorito ainda</h3><p>Toque no coração de um anúncio para guardar e comparar depois.</p><a class="btn btn-pri" href="#/busca">Buscar imóveis</a></div>`}
    </section>`;
  }

  /* =================================================================
     CORRETOR · PAINEL
     ================================================================= */
  function serieExemplo(dias, base, seed) {
    return Array.from({ length: dias }, (_, d) => Math.round(base * (0.7 + 0.35 * Math.sin((d + seed) / 3.2) + 0.25 * ((Math.sin(d * 12.9898 + seed) * 43758.5453) % 1 + 1) / 2 + (d % 7 === 5 || d % 7 === 6 ? 0.25 : 0))));
  }
  function vPainel() {
    const c = corretor(EU), pl = plano(c.plano);
    const meus = todos().filter(i => i.corretor === EU);
    const ativos = meus.filter(i => i.status === 'publicado');
    const views = serieExemplo(30, 72, 2), conts = views.map((v, d) => v * 0.022 * (0.8 + 0.4 * Math.sin(d / 2.3)));
    const tv = views.reduce((a, b) => a + b, 0), tc = Math.round(conts.reduce((a, b) => a + b, 0));
    const meusLeads = st.leads.filter(l => l.corretor === EU);
    const leadsEx = [
      { nome: 'Exemplo · Carla M.', imovel: 'LV1002', msg: 'Gostaria de agendar visita no sábado de manhã.', quando: '2026-11-12T14:20:00', ex: true },
      { nome: 'Exemplo · Jonas P.', imovel: 'LV1001', msg: 'O quintal tem espaço para piscina pequena?', quando: '2026-11-11T09:05:00', ex: true },
      { nome: 'Exemplo · Renata S.', imovel: 'LV1003', msg: 'O studio aceita contrato de 12 meses?', quando: '2026-11-10T18:40:00', ex: true },
    ];
    const W = 640, H = 170, mx = Math.max(...views);
    const barras = views.map((v, d) => { const h = (v / mx) * (H - 30); return `<rect x="${d * (W / 30) + 3}" y="${H - 18 - h}" width="${W / 30 - 6}" height="${h}" rx="3" class="${d === 29 ? 'hoje' : ''}"><title>Dia ${d + 1}: ${v} visualizações</title></rect>`; }).join('');
    const mxc = Math.max(...conts, 1);
    const linha = conts.map((v, d) => `${d * (W / 30) + W / 60},${H - 18 - (v / mxc) * (H - 50)}`).join(' ');
    app.innerHTML = `<section class="pagina painel">
      <header class="pag-cab">
        <div><p class="eyebrow">Corretor · ${esc(c.nome)} (fictícia)</p><h1>Seus anúncios</h1><p class="sub">Plano ${pl.nome}: ${ativos.length} de ${pl.anuncios || '∞'} anúncios ativos · ${pl.destaques} destaques.</p></div>
        <a class="btn btn-pri" href="#/corretor/novo">${ico('plus')} Novo anúncio</a>
      </header>
      <div class="exemplo-faixa">Números de exemplo para demonstração: não são acessos reais.</div>
      <div class="kpis">
        <div class="kpi">${ico('eye')}<span>Visualizações · 30 dias</span><b>${num(tv)}</b><small>exemplo</small></div>
        <div class="kpi">${ico('chat')}<span>Contatos · 30 dias</span><b>${tc + meusLeads.length}</b><small>${meusLeads.length ? meusLeads.length + ' feito(s) nesta demo' : 'exemplo'}</small></div>
        <div class="kpi">${ico('check')}<span>Anúncios ativos</span><b>${ativos.length}</b><small>${meus.length - ativos.length} fora do ar ou em análise</small></div>
        <div class="kpi">${ico('area')}<span>Contato por visualização</span><b>${(tc / tv * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</b><small>exemplo</small></div>
      </div>
      <div class="painel-grid">
        <div class="caixa graf">
          <div class="graf-cab"><h2>Visualizações e contatos</h2><div class="sim-leg"><span><i style="background:#9cb8ab"></i>visualizações</span><span><i style="background:#c4683f"></i>contatos</span></div></div>
          <svg viewBox="0 0 ${W} ${H}" class="barras" role="img" aria-label="Gráfico de exemplo de visualizações dos últimos 30 dias">${barras}<polyline points="${linha}" fill="none" stroke="#c4683f" stroke-width="2.5" stroke-linejoin="round"/>
            <text x="2" y="${H - 2}">há 30 dias</text><text x="${W - 2}" y="${H - 2}" text-anchor="end">hoje</text></svg>
        </div>
        <div class="caixa leads">
          <h2>Contatos recebidos</h2>
          <ul>${meusLeads.map(l => ({ ...l, ex: false })).concat(leadsEx).slice(0, 5).map(l => `<li class="${l.ex ? '' : 'novo'}"><div><b>${esc(l.nome)}</b>${l.ex ? '' : '<span class="pill pill-ok">desta demo</span>'}<small>${l.imovel} · ${new Date(l.quando).toLocaleDateString('pt-BR')}</small></div><p>${esc(l.msg)}</p></li>`).join('')}</ul>
        </div>
      </div>
      <div class="caixa">
        <h2>Anúncios</h2>
        <div class="tabela tab-anuncios">
          <div class="tr th"><span>Imóvel</span><span>Status</span><span>Visualizações</span><span>Contatos</span><span></span></div>
          ${meus.map(i => `<div class="tr">
            <span class="ti"><span class="mini">${fotoHTML(i, 0)}</span><span><b>${esc(i.titulo)}</b><small>${i.id} · ${precoTxt(i)}</small></span></span>
            <span><span class="pill pill-${i.status}">${STATUS[i.status]}</span>${i.motivo && i.status === 'reprovado' ? `<small class="motivo">${esc(i.motivo)}</small>` : ''}</span>
            <span data-rot="Visualizações">${i.status === 'publicado' || i.views ? num(i.views || 0) : '—'}</span>
            <span data-rot="Contatos">${i.status === 'publicado' || i.contatos ? (i.contatos || 0) + st.leads.filter(l => l.imovel === i.id).length : '—'}</span>
            <span class="acoes"><a class="btn btn-peq" href="#/imovel/${i.id}">Ver</a>${i.status === 'publicado' ? `<button class="btn btn-peq" data-pausa="${i.id}">Pausar</button>` : i.status === 'pausado' ? `<button class="btn btn-peq" data-reativa="${i.id}">Reativar</button>` : ''}</span>
          </div>`).join('')}
        </div>
      </div>
    </section>`;
    $$('[data-pausa]').forEach(b => b.onclick = () => { st.ov[b.dataset.pausa] = Object.assign({}, st.ov[b.dataset.pausa], { status: 'pausado' }); salvar(); toast('Anúncio pausado: saiu da busca.'); vPainel(); });
    $$('[data-reativa]').forEach(b => b.onclick = () => { st.ov[b.dataset.reativa] = Object.assign({}, st.ov[b.dataset.reativa], { status: 'publicado' }); salvar(); toast('Anúncio de volta na busca.', 'ok'); vPainel(); });
  }

  /* =================================================================
     CORRETOR · NOVO ANÚNCIO (etapas)
     ================================================================= */
  const CARACS = ['Aceita financiamento', 'Aceita pet', 'Churrasqueira', 'Piscina', 'Quintal', 'Varanda', 'Portaria 24h', 'Elevador', 'Armários planejados', 'Energia solar', 'Mobiliado', 'Academia'];
  const novoRascunho = () => ({ etapa: 0, finalidade: 'venda', tipo: 'apartamento', titulo: '', preco: '', condominio: '', iptu: '', quartos: 2, suites: 1, banheiros: 1, vagas: 1, area: '', bairro: 'centro', rua: '', caracteristicas: [], descricao: '', uploads: [], ilustradas: false, capa: 0 });
  function vNovo() {
    if (!st.rascunho) st.rascunho = novoRascunho();
    const r = st.rascunho;
    const etapas = ['Dados básicos', 'Detalhes', 'Fotos', 'Prévia e envio'];
    app.innerHTML = `<section class="pagina novo">
      <header class="pag-cab"><div><p class="eyebrow">Corretor · novo anúncio</p><h1>Cadastrar imóvel</h1><p class="sub">Quatro etapas. O rascunho fica guardado enquanto você navega.</p></div>
        <button class="link" id="descartar">Descartar rascunho</button></header>
      <ol class="stepper">${etapas.map((e, k) => `<li class="${k === r.etapa ? 'on' : k < r.etapa ? 'feito' : ''}"><button data-ir="${k}" ${k > r.etapa ? 'disabled' : ''}><span>${k < r.etapa ? ico('check') : k + 1}</span>${e}</button></li>`).join('')}</ol>
      <div class="novo-grid">
        <form class="caixa etapa" id="etapa" novalidate></form>
        <aside class="previa-lado"><p class="rot">Prévia do cartão na busca</p><div id="previa"></div></aside>
      </div>
    </section>`;
    $('#descartar').onclick = () => { st.rascunho = novoRascunho(); vNovo(); };
    $$('[data-ir]').forEach(b => b.onclick = () => { r.etapa = +b.dataset.ir; vNovo(); });
    const form = $('#etapa');
    const n = (k, l, extra) => `<label class="campo"><span>${l}</span><input name="${k}" value="${esc(r[k])}" ${extra || ''}></label>`;
    const sel = (k, l, ops) => `<label class="campo"><span>${l}</span><select name="${k}">${ops.map(([v, t]) => opt(v, t, r[k])).join('')}</select></label>`;
    const contador = (k, l, max) => `<div class="campo"><span>${l}</span><div class="cont"><button type="button" data-menos="${k}" aria-label="Menos">−</button><b id="c-${k}">${r[k]}</b><button type="button" data-mais="${k}" data-max="${max}" aria-label="Mais">+</button></div></div>`;
    const nav = (prox) => `<div class="etapa-nav">${r.etapa > 0 ? `<button type="button" class="btn" id="voltar">${ico('left')} Voltar</button>` : '<span></span>'}<button type="submit" class="btn btn-pri">${prox}</button></div>`;

    if (r.etapa === 0) {
      form.innerHTML = `<h2>O que você está anunciando?</h2>
        <div class="campo"><span>Finalidade</span><div class="seg" role="group"><button type="button" data-set-fin="venda" class="${r.finalidade === 'venda' ? 'on' : ''}">Venda</button><button type="button" data-set-fin="aluguel" class="${r.finalidade === 'aluguel' ? 'on' : ''}">Aluguel</button></div></div>
        <div class="tipos">${Object.entries(TIPOS).map(([k, v]) => `<label class="tipo-op"><input type="radio" name="tipo" value="${k}" ${r.tipo === k ? 'checked' : ''}><span>${v}</span></label>`).join('')}</div>
        ${n('titulo', 'Título do anúncio', 'maxlength="70" placeholder="Ex.: Apartamento com varanda perto do parque" required')}
        <div class="linha3">${n('preco', r.finalidade === 'venda' ? 'Preço de venda (R$)' : 'Aluguel mensal (R$)', 'inputmode="numeric" required placeholder="0"')}${n('condominio', 'Condomínio (R$/mês)', 'inputmode="numeric" placeholder="0"')}${n('iptu', 'IPTU (R$/ano)', 'inputmode="numeric" placeholder="0"')}</div>
        <p class="erro" id="erro" hidden></p>${nav('Continuar ' + ico('right'))}`;
      $$('[data-set-fin]', form).forEach(b => b.onclick = () => { r.finalidade = b.dataset.setFin; coletar(); vNovo(); });
    } else if (r.etapa === 1) {
      form.innerHTML = `<h2>Detalhes do imóvel</h2>
        <div class="linha4">${contador('quartos', 'Quartos', 8)}${contador('suites', 'Suítes', 6)}${contador('banheiros', 'Banheiros', 8)}${contador('vagas', 'Vagas', 6)}</div>
        <div class="linha3">${n('area', 'Área (m²)', 'inputmode="numeric" required placeholder="0"')}${sel('bairro', 'Bairro', D.bairros.map(b => [b.id, b.nome]))}${n('rua', 'Rua (sem número)', 'placeholder="Ex.: Rua das Paineiras"')}</div>
        <div class="campo"><span>Características</span><div class="checks">${CARACS.map(c => `<label><input type="checkbox" name="carac" value="${c}" ${r.caracteristicas.includes(c) ? 'checked' : ''}><span>${c}</span></label>`).join('')}</div></div>
        <label class="campo"><span>Descrição <output id="oDesc">${r.descricao.length}/600</output></span><textarea name="descricao" rows="4" maxlength="600" placeholder="Conte o que o visitante não vê nas fotos: sol da manhã, rua tranquila, o que tem por perto.">${esc(r.descricao)}</textarea></label>
        <p class="erro" id="erro" hidden></p>${nav('Continuar ' + ico('right'))}`;
      $$('[data-mais],[data-menos]', form).forEach(b => b.onclick = () => {
        const k = b.dataset.mais || b.dataset.menos;
        r[k] = Math.max(0, Math.min(+(b.dataset.max || 9), r[k] + (b.dataset.mais ? 1 : -1)));
        $('#c-' + k).textContent = r[k]; previa();
      });
      $('textarea', form).addEventListener('input', e => { $('#oDesc').textContent = e.target.value.length + '/600'; });
    } else if (r.etapa === 2) {
      form.innerHTML = `<h2>Fotos</h2>
        <label class="drop" id="drop"><input type="file" id="arquivos" accept="image/*" multiple hidden>${ico('upload')}<b>Arraste as fotos aqui ou clique para escolher</b><span>JPG ou PNG. Nesta demonstração as fotos não saem do seu computador: são reduzidas e mostradas só aqui.</span></label>
        <div class="ou"><span>ou</span></div>
        <button type="button" class="btn largo" id="usarIlus">Usar ilustrações de exemplo (fachada e cômodos)</button>
        <div class="fotos-up" id="fotosUp"></div>
        <p class="erro" id="erro" hidden></p>${nav('Ver prévia ' + ico('right'))}`;
      desenharFotos();
      const inp = $('#arquivos'), drop = $('#drop');
      inp.onchange = () => receber(inp.files);
      ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('sobre'); }));
      ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('sobre'); }));
      drop.addEventListener('drop', e => receber(e.dataTransfer.files));
      $('#usarIlus').onclick = () => { r.ilustradas = true; r.uploads = []; desenharFotos(); previa(); toast('Ilustrações de exemplo adicionadas'); };
    } else {
      const im = montarImovel();
      const checks = [
        [r.titulo.length >= 15, 'Título com pelo menos 15 caracteres'],
        [+r.preco > 0, 'Preço informado'],
        [+r.area > 0, 'Área informada'],
        [im.fotos.length >= 3, 'Pelo menos 3 fotos'],
        [r.descricao.length >= 80, 'Descrição com 80 caracteres ou mais (recomendado)'],
      ];
      const pode = checks.slice(0, 4).every(c => c[0]);
      form.innerHTML = `<h2>Prévia e envio</h2>
        <div class="previa-pagina">
          <div class="pp-foto">${fotoHTML(im, r.capa || 0)}</div>
          <div class="pp-info"><div class="preco">${precoTxt(im)}</div><h3>${esc(im.titulo || 'Título do anúncio')}</h3><p class="end">${ico('pin')}${esc(im.endereco)}</p>${atributos(im)}<p class="desc">${esc(im.descricao)}</p></div>
        </div>
        <ul class="checklist">${checks.map(([ok, t]) => `<li class="${ok ? 'certo' : 'nao'}">${ico(ok ? 'check' : 'x')}${t}</li>`).join('')}</ul>
        <p class="nota">${ico('shield')} Todo anúncio novo passa pela moderação antes de aparecer na busca. Na demo, troque para <b>Ver como: Admin</b> para aprovar.</p>
        <div class="etapa-nav"><button type="button" class="btn" id="voltar">${ico('left')} Voltar</button><button type="submit" class="btn btn-pri" ${pode ? '' : 'disabled'}>${ico('check')} Enviar para moderação</button></div>`;
    }
    const v = $('#voltar'); if (v) v.onclick = () => { coletar(); r.etapa--; vNovo(); };
    form.addEventListener('input', () => { coletar(); previa(); });
    form.addEventListener('change', () => { coletar(); previa(); });
    form.addEventListener('submit', e => {
      e.preventDefault(); coletar();
      const erro = msg => { const p = $('#erro'); if (p) { p.hidden = false; p.textContent = msg; } };
      if (r.etapa === 0 && (!r.titulo.trim() || !(+r.preco > 0))) return erro('Preencha o título e o preço para continuar.');
      if (r.etapa === 1 && !(+r.area > 0)) return erro('Informe a área do imóvel.');
      if (r.etapa === 2 && !r.uploads.length && !r.ilustradas) return erro('Adicione fotos ou use as ilustrações de exemplo.');
      if (r.etapa < 3) { r.etapa++; vNovo(); return; }
      const im = montarImovel();
      im.id = 'LV' + (2001 + st.extras.length);
      st.extras.push(im);
      salvar();
      st.rascunho = null;
      toast(ico('check') + ` Anúncio ${im.id} enviado para moderação`, 'ok');
      location.hash = '#/corretor';
    });

    function coletar() {
      const fd = new FormData(form);
      ['titulo', 'rua', 'descricao', 'bairro', 'tipo'].forEach(k => { if (fd.has(k)) r[k] = fd.get(k); });
      ['preco', 'condominio', 'iptu', 'area'].forEach(k => { if (fd.has(k)) { const d = String(fd.get(k)).replace(/\D/g, ''); r[k] = d; const el = form.elements[k]; if (el && document.activeElement === el) el.value = d ? num(+d) : ''; } });
      if (r.etapa === 1) r.caracteristicas = fd.getAll('carac');
    }
    function montarImovel() {
      const b = bairro(r.bairro);
      const fotos = r.uploads.length ? r.uploads.map((_, k) => 'up:' + k) : r.ilustradas ? fotosPadrao(r.tipo) : ['fachada'];
      if (r.uploads.length && r.capa) { const c = fotos.splice(r.capa, 1)[0]; fotos.unshift(c); }
      const ups = r.uploads.slice();
      return {
        id: 'prévia', titulo: r.titulo || 'Título do anúncio', tipo: r.tipo, finalidade: r.finalidade, preco: +r.preco || 0, condominio: +r.condominio || 0, iptu: +r.iptu || 0,
        quartos: r.tipo === 'terreno' ? 0 : r.quartos, suites: r.suites, banheiros: r.banheiros, vagas: r.vagas, area: +r.area || 0, bairro: r.bairro,
        endereco: (r.rua ? r.rua + ', ' : '') + b.nome, corretor: EU, status: 'em_analise', destaque: false, pal: 3 + (r.titulo.length % 7), fotos, uploads: ups,
        caracteristicas: r.caracteristicas.slice(), lat: +(b.lat + (Math.random() - .5) * .006).toFixed(5), lng: +(b.lng + (Math.random() - .5) * .006).toFixed(5),
        publicado: new Date().toISOString().slice(0, 10), views: 0, contatos: 0, descricao: r.descricao || 'Descrição ainda não preenchida.', novo: true,
      };
    }
    function previa() { const p = $('#previa'); if (p) p.innerHTML = cartao(montarImovel()).replace(/href="#\/imovel\/[^"]+"/g, 'href="javascript:void 0"').replace(/data-fav="[^"]+"/, 'disabled'); }
    function desenharFotos() {
      const box = $('#fotosUp'); if (!box) return;
      if (r.uploads.length) box.innerHTML = r.uploads.map((src, k) => `<figure class="${k === (r.capa || 0) ? 'capa' : ''}"><img src="${src}" alt="Foto ${k + 1}"><figcaption>${k === (r.capa || 0) ? 'Capa' : `<button type="button" data-capa="${k}">Usar como capa</button>`}<button type="button" data-rm="${k}" aria-label="Remover">${ico('x')}</button></figcaption></figure>`).join('');
      else if (r.ilustradas) { const im = montarImovel(); box.innerHTML = im.fotos.map((f, k) => `<figure class="${k === 0 ? 'capa' : ''}">${Fotos.svg(im, f)}<figcaption>${k === 0 ? 'Capa' : Fotos.nome(f)}</figcaption></figure>`).join(''); }
      else box.innerHTML = '';
      $$('[data-rm]', box).forEach(b => b.onclick = () => { r.uploads.splice(+b.dataset.rm, 1); r.capa = 0; desenharFotos(); previa(); });
      $$('[data-capa]', box).forEach(b => b.onclick = () => { r.capa = +b.dataset.capa; desenharFotos(); previa(); });
    }
    function receber(files) {
      const lista = [...files].filter(f => f.type.startsWith('image/')).slice(0, 12 - r.uploads.length);
      if (!lista.length) return;
      r.ilustradas = false;
      const box = $('#fotosUp');
      lista.forEach(file => {
        const fig = document.createElement('figure');
        fig.className = 'subindo';
        fig.innerHTML = `<div class="barra"><i></i></div><figcaption>${esc(file.name).slice(0, 22)}</figcaption>`;
        box.appendChild(fig);
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const k = Math.min(1, 900 / Math.max(img.width, img.height));
            const cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
            cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
            const data = cv.toDataURL('image/jpeg', 0.72);
            let p = 0; const bar = $('.barra i', fig);
            const t = setInterval(() => { p += 12 + Math.random() * 18; bar.style.width = Math.min(100, p) + '%'; if (p >= 100) { clearInterval(t); r.uploads.push(data); desenharFotos(); previa(); } }, 120);
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      });
    }
    previa();
  }
  function fotosPadrao(tipo) {
    return { terreno: ['fachada'], comercial: ['fachada', 'escritorio', 'banheiro'], studio: ['fachada', 'quarto', 'cozinha', 'banheiro'] }[tipo] || ['fachada', 'sala', 'cozinha', 'quarto', 'banheiro'];
  }

  /* =================================================================
     ADMIN
     ================================================================= */
  function adminCab(titulo, sub) {
    const t = todos();
    const ativos = D.corretores.map(c => corretor(c.id)).filter(c => c.status === 'ativo');
    const receita = ativos.reduce((s, c) => s + plano(c.plano).preco, 0);
    return `<header class="pag-cab"><div><p class="eyebrow">Administração</p><h1>${titulo}</h1><p class="sub">${sub}</p></div></header>
      <div class="kpis">
        <div class="kpi">${ico('check')}<span>Anúncios publicados</span><b>${t.filter(i => i.status === 'publicado').length}</b></div>
        <div class="kpi kpi-alerta">${ico('shield')}<span>Aguardando moderação</span><b>${t.filter(i => i.status === 'em_analise').length}</b></div>
        <div class="kpi">${ico('list')}<span>Anunciantes ativos</span><b>${ativos.length}</b><small>${D.corretores.map(c => corretor(c.id)).filter(c => c.status === 'pendente').length} cadastro(s) pendente(s)</small></div>
        <div class="kpi">${ico('area')}<span>Receita mensal dos planos</span><b>${brl(receita)}</b><small>exemplo · planos fictícios</small></div>
      </div>`;
  }
  function vModeracao() {
    const t = todos();
    const fila = t.filter(i => i.status === 'em_analise');
    const hist = t.filter(i => st.ov[i.id] && st.ov[i.id].mod || i.status === 'reprovado');
    const media = (b, fin, tipo) => { const l = t.filter(x => x.bairro === b && x.finalidade === fin && x.status === 'publicado' && x.area > 0 && x.tipo !== 'terreno' === (tipo !== 'terreno')); return l.length ? l.reduce((s, x) => s + x.preco / x.area, 0) / l.length : 0; };
    app.innerHTML = `<section class="pagina admin">
      ${adminCab('Moderação de anúncios', 'Todo anúncio novo ou editado passa por aqui antes de ir para a busca.')}
      <h2 class="sec">Fila de análise <span class="pill pill-em_analise">${fila.length}</span></h2>
      ${fila.length ? `<div class="fila">${fila.map(i => {
        const c = corretor(i.corretor), m = media(i.bairro, i.finalidade, i.tipo), pm2 = i.area ? i.preco / i.area : 0;
        const dif = m ? Math.round((pm2 / m - 1) * 100) : null;
        const checks = [
          [i.fotos.length >= 3, `${i.fotos.length} ${i.fotos.length > 1 ? 'imagens' : 'imagem'}`, 'mínimo de 3'],
          [i.descricao.length >= 80, 'Descrição completa', 'descrição curta'],
          [dif === null || Math.abs(dif) <= 35, dif === null ? 'Sem base de comparação no bairro' : `Preço/m² ${dif >= 0 ? dif + '% acima' : -dif + '% abaixo'} da média do bairro`, ''],
          [c.status === 'ativo', `Anunciante ${c.status}`, ''],
        ];
        return `<article class="mod" data-id="${i.id}">
          <a class="mod-foto" href="#/imovel/${i.id}">${fotoHTML(i, 0)}</a>
          <div class="mod-info">
            <div class="mod-top"><span class="pill pill-em_analise">Em análise</span><small>${i.id} · enviado ${new Date(i.publicado + 'T12:00').toLocaleDateString('pt-BR')}</small></div>
            <h3>${esc(i.titulo)}</h3>
            <p class="end">${ico('pin')}${esc(i.endereco)} · ${TIPOS[i.tipo]} · ${i.finalidade === 'venda' ? 'Venda' : 'Aluguel'}</p>
            <p class="mod-preco">${precoTxt(i)} <small>· ${num(i.area)} m² · por ${esc(c.nome)}</small></p>
            <ul class="checklist compacta">${checks.map(([ok, t2, alt]) => `<li class="${ok ? 'certo' : 'nao'}">${ico(ok ? 'check' : 'x')}${t2}${!ok && alt ? ` (${alt})` : ''}</li>`).join('')}</ul>
          </div>
          <div class="mod-acoes">
            <a class="btn btn-peq" href="#/imovel/${i.id}">${ico('eye')} Ver anúncio</a>
            <button class="btn btn-ok" data-aprova="${i.id}">${ico('check')} Aprovar</button>
            <button class="btn btn-nao" data-reprova="${i.id}">${ico('x')} Reprovar</button>
          </div>
          <form class="reprovar" data-form="${i.id}" hidden>
            <label class="campo"><span>Motivo (vai para o anunciante)</span><select name="motivo"><option>Fotos com baixa qualidade ou de outro site</option><option>Preço fora da realidade do bairro</option><option>Dados incompletos ou contraditórios</option><option>Imóvel duplicado</option><option>Conteúdo proibido pelas regras do portal</option></select></label>
            <label class="campo"><span>Observação (opcional)</span><input name="obs" placeholder="Ex.: troque a foto da fachada"></label>
            <div class="linha-btn"><button type="button" class="btn btn-peq" data-cancela="${i.id}">Cancelar</button><button class="btn btn-nao btn-peq">Confirmar reprovação</button></div>
          </form>
        </article>`;
      }).join('')}</div>` : `<div class="vazio pequeno">${ico('check')}<h3>Fila zerada</h3><p>Nenhum anúncio aguardando. Cadastre um em <b>Ver como: Corretor</b> para testar o fluxo.</p></div>`}
      <h2 class="sec">Decisões recentes</h2>
      <div class="tabela tab-hist">
        <div class="tr th"><span>Anúncio</span><span>Anunciante</span><span>Decisão</span><span></span></div>
        ${hist.length ? hist.map(i => `<div class="tr"><span class="ti"><span class="mini">${fotoHTML(i, 0)}</span><span><b>${esc(i.titulo)}</b><small>${i.id}</small></span></span><span data-rot="Anunciante">${esc(corretor(i.corretor).nome)}</span><span><span class="pill pill-${i.status}">${STATUS[i.status]}</span>${i.motivo && i.status === 'reprovado' ? `<small class="motivo">${esc(i.motivo)}</small>` : ''}</span><span class="acoes">${st.ov[i.id] && st.ov[i.id].mod ? `<button class="btn btn-peq" data-desfaz="${i.id}">Desfazer</button>` : ''}</span></div>`).join('') : '<div class="tr"><span>Nenhuma decisão ainda.</span></div>'}
      </div>
    </section>`;
    $$('[data-aprova]').forEach(b => b.onclick = () => { st.ov[b.dataset.aprova] = { status: 'publicado', motivo: '', mod: true }; salvar(); toast(ico('check') + ' Aprovado: já aparece na busca.', 'ok'); vModeracao(); });
    $$('[data-reprova]').forEach(b => b.onclick = () => { $(`[data-form="${b.dataset.reprova}"]`).hidden = false; });
    $$('[data-cancela]').forEach(b => b.onclick = () => { $(`[data-form="${b.dataset.cancela}"]`).hidden = true; });
    $$('form.reprovar').forEach(f => f.onsubmit = e => {
      e.preventDefault(); const fd = new FormData(f);
      st.ov[f.dataset.form] = { status: 'reprovado', motivo: fd.get('motivo') + (fd.get('obs') ? ': ' + fd.get('obs') : ''), mod: true };
      salvar(); toast('Anúncio reprovado. O corretor vê o motivo no painel.'); vModeracao();
    });
    $$('[data-desfaz]').forEach(b => b.onclick = () => { delete st.ov[b.dataset.desfaz]; salvar(); toast('Decisão desfeita.'); vModeracao(); });
  }

  function vAnunciantes() {
    const t = todos();
    const lista = D.corretores.map(c => corretor(c.id));
    app.innerHTML = `<section class="pagina admin">
      ${adminCab('Anunciantes', 'Corretores e imobiliárias cadastrados. Nomes e telefones fictícios.')}
      <div class="caixa">
        <div class="tabela tab-anun">
          <div class="tr th"><span>Anunciante</span><span>Plano</span><span>Anúncios</span><span>Desde</span><span>Status</span><span></span></div>
          ${lista.map(c => {
            const meus = t.filter(i => i.corretor === c.id);
            return `<div class="tr">
              <span class="ti"><span class="av" style="background:${c.cor}">${c.nome.split(' ').map(p => p[0]).slice(0, 2).join('')}</span><span><b>${esc(c.nome)}</b><small>${esc(c.tipo)} · ${c.telefone}</small></span></span>
              <span data-rot="Plano">${plano(c.plano).nome}</span>
              <span data-rot="Anúncios">${meus.filter(i => i.status === 'publicado').length} ativos / ${meus.length}</span>
              <span data-rot="Desde">${c.desde.split('-').reverse().join('/')}</span>
              <span><span class="pill pill-c-${c.status}">${{ ativo: 'Ativo', pendente: 'Cadastro pendente', suspenso: 'Suspenso' }[c.status]}</span></span>
              <span class="acoes">${c.status === 'pendente' ? `<button class="btn btn-peq btn-ok" data-cst="${c.id}:ativo">Aprovar cadastro</button>` : c.status === 'ativo' ? `<button class="btn btn-peq" data-cst="${c.id}:suspenso">Suspender</button>` : `<button class="btn btn-peq" data-cst="${c.id}:ativo">Reativar</button>`}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    </section>`;
    $$('[data-cst]').forEach(b => b.onclick = () => { const [id, s] = b.dataset.cst.split(':'); st.corr[id] = s; salvar(); toast(s === 'ativo' ? 'Anunciante ativo.' : 'Anunciante suspenso: os anúncios dele saem da busca na versão real.'); vAnunciantes(); });
  }

  function vPlanos() {
    const lista = D.corretores.map(c => corretor(c.id));
    app.innerHTML = `<section class="pagina admin">
      ${adminCab('Planos', 'Valores de exemplo. Na versão real, a cobrança recorrente fica com Stripe ou Mercado Pago.')}
      <div class="planos">${D.planos.map(p0 => {
        const p = plano(p0.id), assin = lista.filter(c => c.plano === p.id && c.status === 'ativo').length;
        return `<article class="plano ${p.id === 'pro' ? 'plano-dest' : ''}">
          ${p.id === 'pro' ? '<span class="plano-selo">Sugerido para autônomos</span>' : ''}
          <h3>${p.nome}</h3>
          <label class="plano-preco">R$ <input type="number" min="0" step="1" value="${p.preco}" data-preco="${p.id}" aria-label="Preço do plano ${p.nome}"><span>/mês</span></label>
          <ul>${p.recursos.map(r => `<li>${ico('check')}${r}</li>`).join('')}</ul>
          <p class="assin"><b>${assin}</b> assinante${assin === 1 ? '' : 's'} ativo${assin === 1 ? '' : 's'} (exemplo)</p>
        </article>`;
      }).join('')}</div>
      <p class="nota">Altere um preço e ele vale para o cálculo da receita acima (só neste navegador).</p>
    </section>`;
    $$('[data-preco]').forEach(inp => inp.addEventListener('change', () => { st.precos[inp.dataset.preco] = Math.max(0, +inp.value || 0); salvar(); toast('Preço do plano atualizado (demonstração).', 'ok'); vPlanos(); }));
  }

  /* ---------- reset ---------- */
  $('#resetar').onclick = () => {
    ['favs', 'leads', 'extras', 'ov', 'corr', 'precos', 'filtros', 'mapa'].forEach(k => { try { localStorage.removeItem(PFX + k); } catch (e) { } });
    st.favs = new Set(); st.leads = []; st.extras = []; st.ov = {}; st.corr = {}; st.precos = {}; st.rascunho = null; st.mapa = 'ruas';
    st.f = { fin: 'venda', tipo: '', pmin: '', pmax: '', quartos: 0, bairro: '', ordem: 'relevancia' };
    toast('Dados de exemplo restaurados.'); render();
  };

  render();
})();

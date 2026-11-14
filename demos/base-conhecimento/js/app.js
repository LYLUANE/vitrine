/* Central de Ajuda Caderneta — interface (rotas, busca, artigo, painel de edição). */
(function () {
  "use strict";
  const { Indice, destacar, trecho, markdown, esc, norm, slugTitulo, stem } = window.Motor;
  const app = document.getElementById("app");
  const CHAVE = { artigos: "cad_kb_artigos_v1", votos: "cad_kb_votos_v1", meuVoto: "cad_kb_meuvoto_v1", vistos: "cad_kb_vistos_v1", tema: "cad_kb_tema", motivo: "cad_kb_motivos_v1" };

  // ---------------------------------------------------------- armazenamento
  const ler = (k, padrao) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

  const ORIGINAIS = window.KB_ARTIGOS.map(a => Object.assign({}, a));
  let artigos = [], indice = null;

  function carregar() {
    const locais = ler(CHAVE.artigos, {});
    const mapa = new Map(ORIGINAIS.map(a => [a.id, Object.assign({ origem: "original" }, a)]));
    for (const id in locais) {
      const a = locais[id];
      if (a._excluido) { mapa.delete(id); continue; }
      mapa.set(id, Object.assign({}, a, { origem: mapa.has(id) ? "editado" : "novo" }));
    }
    artigos = Array.from(mapa.values());
    indice = new Indice(artigos);
  }
  const porId = id => artigos.find(a => a.id === id);

  // ---------------------------------------------------------------- ícones
  const IC = {
    busca: '<path d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm9 16-4.2-4.2"/>',
    bandeira: '<path d="M5 21V4m0 1h11l-2 4 2 4H5"/>',
    moeda: '<circle cx="12" cy="12" r="8"/><path d="M14.5 9.2c-.5-.8-1.4-1.2-2.5-1.2-1.6 0-2.6.8-2.6 1.9 0 2.7 5.3 1.4 5.3 4.2 0 1.1-1.1 1.9-2.7 1.9-1.2 0-2.2-.5-2.7-1.4M12 6.5V8m0 8v1.5"/>',
    carrinho: '<path d="M3 4h2l2.2 10.5a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L20 8H6.2"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
    caixa: '<path d="M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8"/>',
    nota: '<path d="M7 3h7l4 4v14H7zM14 3v4h4M10 11h5M10 14.5h5M10 18h3"/>',
    cadeado: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3M12 14.5v2.5"/>',
    plug: '<path d="M9 3v5M15 3v5M6.5 8h11v3a5.5 5.5 0 0 1-11 0zM12 16.5V21"/>',
    lua: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2m0 15v2M4.6 4.6 6 6m12 12 1.4 1.4M2.5 12h2m15 0h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    editar: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',
    seta: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    baixar: '<path d="M12 4v11m-5-5 5 5 5-5M5 20h14"/>',
    relogio: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    historico: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5M4 4v4.5h4.5M12 8v4l3 2"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    imprimir: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/>',
    filtro: '<path d="M4 5h16l-6 7.5V19l-4 2v-8.5z"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    polegar: '<path d="M7 11v9H4v-9zm0 0 4-7c1.5 0 2.5 1 2.2 2.6L12.6 10H18a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 16.8 20H7"/>'
  };
  const icone = (n, cls) => '<svg class="ic ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (IC[n] || "") + "</svg>";

  // --------------------------------------------------------------- utilidades
  const MESES = ["jan.", "fev.", "mar.", "abr.", "maio", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
  function dataBR(iso) { const [a, m, d] = String(iso).split("-").map(Number); return d + " " + MESES[(m || 1) - 1] + " " + a; }
  function hojeISO() { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function minutosLeitura(a) { const n = (indice.puro.get(a.id) || "").split(/\s+/).length; return Math.max(1, Math.round(n / 180)); }
  const corTipo = t => ({ "Tutorial": "t-tutorial", "Solução de problema": "t-problema", "Referência": "t-referencia", "Perguntas frequentes": "t-faq" }[t] || "");
  const catIcone = nome => (window.KB_CATEGORIAS.find(c => c.nome === nome) || {}).icone || "nota";

  function toast(msg) {
    const t = document.getElementById("toast");
    t.innerHTML = msg; t.classList.add("ver");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("ver"), 3400);
  }

  function parseHash() {
    const h = location.hash.replace(/^#\/?/, "");
    const [caminho, qs] = h.split("?");
    return { partes: (caminho || "").split("/").filter(Boolean).map(decodeURIComponent), params: new URLSearchParams(qs || "") };
  }
  function irPara(h) { location.hash = h; }
  let substituindo = false;
  function trocarHash(h) { substituindo = true; history.replaceState(null, "", h); setTimeout(() => { substituindo = false; }, 0); }

  // -------------------------------------------------------------- tema
  function aplicarTema(t) {
    document.documentElement.setAttribute("data-theme", t);
    const b = document.getElementById("btn-tema");
    if (b) { b.innerHTML = icone(t === "dark" ? "sol" : "lua"); b.setAttribute("aria-label", t === "dark" ? "Usar modo claro" : "Usar modo escuro"); }
  }
  function temaInicial() {
    const salvo = ler(CHAVE.tema, null);
    if (salvo) return salvo;
    return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  // ------------------------------------------------- busca instantânea (sugestões)
  function ligarSugestoes(form) {
    const input = form.querySelector("input");
    const caixa = form.querySelector(".sugestoes");
    let sel = -1, itens = [];
    const fechar = () => { caixa.hidden = true; sel = -1; input.setAttribute("aria-expanded", "false"); };
    const marcar = () => caixa.querySelectorAll("a").forEach((a, k) => a.classList.toggle("ativo", k === sel));
    input.addEventListener("input", () => {
      const q = input.value;
      if (!q.trim()) { fechar(); return; }
      const r = indice.buscar(q);
      itens = r.resultados.slice(0, 6);
      sel = -1;
      let html = "";
      if (r.correcoes.length) html += '<div class="sug-correcao">Buscando por <strong>' + esc(r.correcoes.map(c => c.sugerido).join(", ")) + "</strong></div>";
      if (!itens.length) html += '<div class="sug-vazio">Nada encontrado. Tente outra palavra ou <a href="#/busca">veja todos os artigos</a>.</div>';
      html += itens.map(x => '<a href="#/artigo/' + x.doc.id + "?q=" + encodeURIComponent(q.trim()) + '" class="sug-item"><span class="sug-ic">' + icone(catIcone(x.doc.categoria)) +
        '</span><span><span class="sug-titulo">' + destacar(x.doc.titulo, x.termos) + '</span><span class="sug-meta">' + esc(x.doc.categoria) + " · " + esc(x.doc.tipo) + "</span></span></a>").join("");
      if (r.resultados.length) html += '<a class="sug-todos" href="#/busca?q=' + encodeURIComponent(q.trim()) + '">' + (r.resultados.length === 1 ? "Ver o resultado " : "Ver os " + r.resultados.length + " resultados ") + icone("seta") + "</a>";
      caixa.innerHTML = html; caixa.hidden = false; input.setAttribute("aria-expanded", "true");
    });
    input.addEventListener("keydown", e => {
      const links = caixa.querySelectorAll("a.sug-item");
      if (e.key === "ArrowDown" && links.length) { e.preventDefault(); sel = (sel + 1) % links.length; marcar(); }
      else if (e.key === "ArrowUp" && links.length) { e.preventDefault(); sel = (sel - 1 + links.length) % links.length; marcar(); }
      else if (e.key === "Escape") fechar();
      else if (e.key === "Enter" && sel >= 0 && links[sel]) { e.preventDefault(); fechar(); location.hash = links[sel].getAttribute("href"); }
    });
    form.addEventListener("submit", e => { e.preventDefault(); fechar(); irPara("#/busca?q=" + encodeURIComponent(input.value.trim())); });
    document.addEventListener("click", e => { if (!form.contains(e.target)) fechar(); });
    caixa.addEventListener("click", () => fechar());
  }

  function formBusca(cls, valor, placeholder) {
    return '<form class="form-busca ' + cls + '" role="search" autocomplete="off"><label class="sr" for="b-' + cls + '">Buscar na central de ajuda</label>' +
      icone("busca", "ic-busca") + '<input id="b-' + cls + '" type="search" value="' + esc(valor || "") + '" placeholder="' + esc(placeholder) +
      '" aria-autocomplete="list" aria-expanded="false" spellcheck="false"><kbd class="atalho-barra" title="Atalho para buscar">/</kbd><button type="submit" class="btn-buscar">Buscar</button>' +
      '<div class="sugestoes" hidden></div></form>';
  }

  // ------------------------------------------------------------------ INÍCIO
  const COMECE = ["primeiro-acesso", "convidar-usuarios", "importar-planilha", "certificado-a1"];

  function cartaoLista(a, extra) {
    return '<a class="item-lista" href="#/artigo/' + a.id + '"><span class="tipo ' + corTipo(a.tipo) + '">' + esc(a.tipo) + '</span><span class="item-titulo">' +
      esc(a.titulo) + "</span>" + (extra || "") + "</a>";
  }

  function telaInicio() {
    document.body.dataset.tela = "inicio";
    const contagem = c => artigos.filter(a => a.categoria === c).length;
    const recentes = artigos.slice().sort((a, b) => b.atualizado.localeCompare(a.atualizado)).slice(0, 5);
    const vistos = ler(CHAVE.vistos, []).map(porId).filter(Boolean).slice(0, 4);
    app.innerHTML =
      '<section class="hero"><div class="hero-in">' +
        '<p class="sobretitulo">Central de Ajuda Caderneta</p>' +
        "<h1>Como podemos <em>ajudar</em> hoje?</h1>" +
        '<p class="hero-sub">' + artigos.length + " artigos sobre financeiro, vendas, estoque, notas fiscais e integrações. A busca entende erros de digitação e palavras sem acento.</p>" +
        formBusca("grande", "", "Ex.: emitir nota, boleto, impressora não imprime") +
        '<p class="experimente">Experimente: <a href="#/busca?q=certificado%20digital">certificado digital</a><a href="#/busca?q=sangria">sangria</a><a href="#/busca?q=impresora%20termica">impresora termica</a> <span>(com erro de digitação)</span></p>' +
      "</div></section>" +
      '<section class="bloco"><div class="bloco-cab"><h2>Navegue por assunto</h2><a class="link-seta" href="#/busca">Todos os artigos ' + icone("seta") + "</a></div>" +
        '<div class="grade-cat">' + window.KB_CATEGORIAS.map(c =>
          '<a class="cat" href="#/busca?cat=' + encodeURIComponent(c.nome) + '"><span class="cat-ic">' + icone(c.icone) + '</span><span class="cat-nome">' + esc(c.nome) +
          '</span><span class="cat-desc">' + esc(c.desc) + '</span><span class="cat-num">' + contagem(c.nome) + " artigos</span></a>").join("") +
          '<a class="cat cat-chat" href="#" data-chamado><span class="cat-ic">' + icone("chat") + '</span><span class="cat-nome">Falar com o suporte</span><span class="cat-desc">Não achou a resposta? Abra um chamado com o contexto da sua busca.</span><span class="cat-num">Seg. a sex., 8h às 18h</span></a>' +
        "</div></section>" +
      '<section class="bloco duas"><div class="painel"><h2>Comece por aqui</h2><p class="painel-sub">O básico para os primeiros dias.</p>' +
        COMECE.map(porId).filter(Boolean).map((a, k) => '<a class="passo-inicio" href="#/artigo/' + a.id + '"><span class="n">' + (k + 1) + "</span><span><strong>" + esc(a.titulo) + "</strong><small>" + esc(a.resumo) + "</small></span></a>").join("") +
        '</div><div class="painel"><h2>Atualizados recentemente</h2><p class="painel-sub">Mudanças no sistema já refletidas nos artigos.</p>' +
        recentes.map(a => cartaoLista(a, '<span class="item-data">' + icone("relogio") + dataBR(a.atualizado) + "</span>")).join("") +
      "</div></section>" +
      (vistos.length ? '<section class="bloco"><div class="bloco-cab"><h2>Vistos por você</h2><span class="nota-local">Guardado só neste navegador</span></div><div class="grade-vistos">' +
        vistos.map(a => cartaoLista(a)).join("") + "</div></section>" : "");
    ligarSugestoes(app.querySelector(".form-busca"));
  }

  // ------------------------------------------------------------------- BUSCA
  const FACETAS = [
    { chave: "cat", campo: "categoria", rotulo: "Categoria", lista: () => window.KB_CATEGORIAS.map(c => c.nome) },
    { chave: "prod", campo: "produto", rotulo: "Produto", lista: () => window.KB_PRODUTOS },
    { chave: "tipo", campo: "tipo", rotulo: "Tipo de artigo", lista: () => window.KB_TIPOS }
  ];
  let ultimaLista = [], ultimaConsulta = "";

  function telaBusca(params) {
    document.body.dataset.tela = "busca";
    const q = params.get("q") || "";
    app.innerHTML =
      '<div class="pagina-busca">' +
        '<div class="busca-topo">' + formBusca("media", q, "Buscar artigos") + "</div>" +
        '<div class="busca-grid">' +
          '<aside class="filtros" aria-label="Filtros"><details class="filtros-det" open><summary>' + icone("filtro") + ' Filtros <span class="filtros-qtd"></span></summary><div class="filtros-corpo"></div></details></aside>' +
          '<section class="resultados" aria-live="polite"></section>' +
        "</div></div>";
    if (window.innerWidth < 860) app.querySelector(".filtros-det").removeAttribute("open");
    const form = app.querySelector(".form-busca");
    ligarSugestoesBusca(form);
    atualizarResultados(params);
  }

  // na página de busca, digitar atualiza a lista direto (sem menu suspenso)
  function ligarSugestoesBusca(form) {
    const input = form.querySelector("input");
    form.querySelector(".sugestoes").remove();
    let t;
    input.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const p = parseHash().params;
        if (input.value.trim()) p.set("q", input.value); else p.delete("q");
        trocarHash("#/busca?" + p.toString());
        atualizarResultados(p);
      }, 90);
    });
    form.addEventListener("submit", e => { e.preventDefault(); input.blur(); });
  }

  function atualizarResultados(params) {
    const q = (params.get("q") || "").trim();
    const ord = params.get("ord") || (q ? "relevancia" : "recentes");
    const sel = {};
    FACETAS.forEach(f => { sel[f.chave] = (params.get(f.chave) || "").split(",").filter(Boolean); });

    let base, correcoes = [], parcial = false;
    if (q) { const r = indice.buscar(q); base = r.resultados; correcoes = r.correcoes; parcial = r.parcial; }
    else base = artigos.map(a => ({ doc: a, score: 0, termos: new Set() }));

    const passa = (x, exceto) => FACETAS.every(f => f.chave === exceto || !sel[f.chave].length || sel[f.chave].includes(x.doc[f.campo]));
    const lista = base.filter(x => passa(x));
    if (ord === "recentes") lista.sort((a, b) => b.doc.atualizado.localeCompare(a.doc.atualizado));
    else if (ord === "az") lista.sort((a, b) => a.doc.titulo.localeCompare(b.doc.titulo, "pt-BR"));
    ultimaLista = lista; ultimaConsulta = q;

    // filtros com contagem (cada faceta conta considerando as outras)
    const corpoF = app.querySelector(".filtros-corpo");
    const totalSel = FACETAS.reduce((s, f) => s + sel[f.chave].length, 0);
    corpoF.innerHTML = FACETAS.map(f => {
      const cont = {};
      base.filter(x => passa(x, f.chave)).forEach(x => { cont[x.doc[f.campo]] = (cont[x.doc[f.campo]] || 0) + 1; });
      return '<fieldset><legend>' + f.rotulo + "</legend>" + f.lista().map(v => {
        const n = cont[v] || 0, on = sel[f.chave].includes(v);
        return '<label class="chk' + (n || on ? "" : " zerado") + '"><input type="checkbox" data-f="' + f.chave + '" value="' + esc(v) + '"' + (on ? " checked" : "") +
          '><span class="chk-caixa"></span><span class="chk-nome">' + esc(v) + '</span><span class="chk-n">' + n + "</span></label>";
      }).join("") + "</fieldset>";
    }).join("") + (totalSel ? '<button type="button" class="btn-limpar" data-limpar>Limpar filtros</button>' : "");
    app.querySelector(".filtros-qtd").textContent = totalSel ? "(" + totalSel + ")" : "";

    corpoF.querySelectorAll("input[type=checkbox]").forEach(cb => cb.addEventListener("change", () => {
      const p = parseHash().params;
      const atual = (p.get(cb.dataset.f) || "").split(",").filter(Boolean);
      const novo = cb.checked ? atual.concat(cb.value) : atual.filter(v => v !== cb.value);
      if (novo.length) p.set(cb.dataset.f, novo.join(",")); else p.delete(cb.dataset.f);
      trocarHash("#/busca?" + p.toString()); atualizarResultados(p);
    }));
    const lim = corpoF.querySelector("[data-limpar]");
    if (lim) lim.addEventListener("click", () => {
      const p = parseHash().params; FACETAS.forEach(f => p.delete(f.chave));
      trocarHash("#/busca?" + p.toString()); atualizarResultados(p);
    });

    // resultados
    const res = app.querySelector(".resultados");
    const titulo = q ? "<strong>" + lista.length + "</strong> " + (lista.length === 1 ? "artigo" : "artigos") + " para “" + esc(q) + "”"
      : "<strong>" + lista.length + "</strong> " + (lista.length === 1 ? "artigo" : "artigos") + (totalSel ? " com os filtros escolhidos" : " na base");
    const chips = FACETAS.flatMap(f => sel[f.chave].map(v => '<button type="button" class="chip" data-f="' + f.chave + '" data-v="' + esc(v) + '">' + esc(v) + ' <span aria-hidden="true">×</span><span class="sr">remover filtro</span></button>')).join("");
    res.innerHTML =
      '<div class="res-barra"><p class="res-total">' + titulo + '</p><div class="res-acoes">' +
        '<label class="ordenar"><span>Ordenar</span><select id="ordenar">' +
          (q ? '<option value="relevancia"' + (ord === "relevancia" ? " selected" : "") + ">Relevância</option>" : "") +
          '<option value="recentes"' + (ord === "recentes" ? " selected" : "") + '>Mais recentes</option><option value="az"' + (ord === "az" ? " selected" : "") + ">A a Z</option></select></label>" +
        '<button type="button" class="btn-sec" id="exportar"' + (lista.length ? "" : " disabled") + ">" + icone("baixar") + " Exportar CSV</button>" +
      "</div></div>" +
      (chips ? '<div class="chips">' + chips + "</div>" : "") +
      (correcoes.length ? '<p class="correcao">' + icone("busca") + " Mostrando resultados para <strong>" + esc(correcoes.map(c => c.sugerido).join(", ")) + "</strong>. Você digitou “" + esc(q) + "”.</p>" : "") +
      (parcial ? '<p class="correcao">Nenhum artigo tem todas as palavras. Mostrando os que têm parte delas.</p>' : "") +
      (lista.length ? '<ol class="lista-res">' + lista.map(x => {
        const a = x.doc;
        const resumo = q ? trecho(indice.puro.get(a.id) + " " + a.resumo, x.termos) : esc(a.resumo);
        return '<li><a class="res" href="#/artigo/' + a.id + (q ? "?q=" + encodeURIComponent(q) : "") + '">' +
          '<span class="res-topo"><span class="tipo ' + corTipo(a.tipo) + '">' + esc(a.tipo) + '</span><span class="res-cat">' + icone(catIcone(a.categoria)) + esc(a.categoria) + " · " + esc(a.produto) + "</span></span>" +
          '<span class="res-titulo">' + destacar(a.titulo, x.termos) + "</span>" +
          '<span class="res-trecho">' + resumo + "</span>" +
          '<span class="res-meta">Atualizado em ' + dataBR(a.atualizado) + (a.origem !== "original" ? ' · <span class="selo-local">' + (a.origem === "novo" ? "Novo (local)" : "Editado (local)") + "</span>" : "") + "</span></a></li>";
      }).join("") + "</ol>"
      : '<div class="vazio"><h3>Nenhum artigo encontrado</h3><p>Tente palavras mais gerais, como “nota” em vez de “NF-e modelo 55”, ou remova algum filtro.</p><button type="button" class="btn-pri" data-chamado>' + icone("chat") + " Perguntar ao suporte</button></div>");

    res.querySelectorAll(".chip").forEach(c => c.addEventListener("click", () => {
      const p = parseHash().params;
      const novo = (p.get(c.dataset.f) || "").split(",").filter(v => v && v !== c.dataset.v);
      if (novo.length) p.set(c.dataset.f, novo.join(",")); else p.delete(c.dataset.f);
      trocarHash("#/busca?" + p.toString()); atualizarResultados(p);
    }));
    res.querySelector("#ordenar").addEventListener("change", e => {
      const p = parseHash().params; p.set("ord", e.target.value);
      trocarHash("#/busca?" + p.toString()); atualizarResultados(p);
    });
    res.querySelector("#exportar").addEventListener("click", exportarCSV);
  }

  function exportarCSV() {
    const base = location.href.split("#")[0];
    const cel = v => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
    const linhas = [["posicao", "titulo", "categoria", "produto", "tipo", "atualizado_em", "relevancia", "tags", "link"].join(";")];
    ultimaLista.forEach((x, k) => {
      const a = x.doc;
      linhas.push([k + 1, a.titulo, a.categoria, a.produto, a.tipo, a.atualizado, x.score ? x.score.toFixed(2).replace(".", ",") : "", (a.tags || []).join(", "), base + "#/artigo/" + a.id].map(cel).join(";"));
    });
    const blob = new Blob(["﻿" + linhas.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "central-ajuda-" + (ultimaConsulta ? slugTitulo(ultimaConsulta) : "artigos") + "-" + hojeISO() + ".csv";
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast("CSV com " + ultimaLista.length + " artigos baixado. Abre direto no Excel.");
  }

  // ------------------------------------------------------------------ ARTIGO
  function relacionados(a) {
    const fixos = (a.relacionados || []).map(porId).filter(Boolean);
    const tags = new Set((a.tags || []).map(t => norm(t)));
    const extra = artigos.filter(b => b.id !== a.id && !fixos.includes(b)).map(b => ({
      b, s: (b.tags || []).filter(t => tags.has(norm(t))).length * 2 + (b.categoria === a.categoria ? 1 : 0)
    })).filter(x => x.s > 0).sort((x, y) => y.s - x.s).map(x => x.b);
    return fixos.concat(extra).slice(0, 3);
  }

  function telaArtigo(id, params) {
    const a = porId(id);
    if (!a) {
      app.innerHTML = '<div class="pagina-erro"><h1>Artigo não encontrado</h1><p>Ele pode ter sido removido no painel de edição.</p><a class="btn-pri" href="#/">Voltar ao início</a></div>';
      return;
    }
    document.body.dataset.tela = "artigo";
    const vistos = ler(CHAVE.vistos, []).filter(v => v !== id); vistos.unshift(id); gravar(CHAVE.vistos, vistos.slice(0, 8));
    const { html, toc } = markdown(a.corpo, window.Ilustracoes.render);
    const q = (params.get("q") || "").trim();
    const tocHtml = toc.length ? toc.map(t => '<a class="toc-n' + t.nivel + '" href="#' + t.id + '" data-alvo="' + t.id + '">' + esc(t.texto) + "</a>").join("") : "";
    const hist = (a.historico || []).slice().sort((x, y) => y.data.localeCompare(x.data));

    app.innerHTML =
      '<div class="pagina-artigo">' +
        '<nav class="trilha" aria-label="Você está em"><a href="#/">Central de ajuda</a><span>/</span><a href="#/busca?cat=' + encodeURIComponent(a.categoria) + '">' + esc(a.categoria) + "</a><span>/</span><span aria-current=\"page\">" + esc(a.titulo) + "</span></nav>" +
        (q ? '<div class="faixa-busca">' + icone("busca") + ' Destacando “<strong>' + esc(q) + '</strong>” neste artigo <span class="faixa-n"></span><a href="#/busca?q=' + encodeURIComponent(q) + '">Voltar aos resultados</a><a href="#/artigo/' + a.id + '">Limpar destaque</a></div>' : "") +
        '<div class="artigo-grid">' +
          '<article class="artigo">' +
            '<header class="artigo-cab">' +
              '<div class="artigo-selos"><span class="tipo ' + corTipo(a.tipo) + '">' + esc(a.tipo) + '</span><span class="selo-prod">' + esc(a.produto) + "</span>" +
                (a.origem !== "original" ? '<span class="selo-local">' + (a.origem === "novo" ? "Criado no painel (local)" : "Editado no painel (local)") + "</span>" : "") + "</div>" +
              "<h1>" + esc(a.titulo) + "</h1>" +
              '<p class="artigo-resumo">' + esc(a.resumo) + "</p>" +
              '<p class="artigo-meta">' + icone("relogio") + " Atualizado em " + dataBR(a.atualizado) + " <span>·</span> " + minutosLeitura(a) + " min de leitura</p>" +
            "</header>" +
            (tocHtml ? '<details class="toc-movel"><summary>Neste artigo</summary><nav>' + tocHtml + "</nav></details>" : "") +
            '<div class="conteudo">' + html + "</div>" +
            blocoFeedback(a) +
            '<details class="historico"><summary>' + icone("historico") + " Histórico de atualizações <span>(" + hist.length + ")</span></summary><ol>" +
              hist.map(h => "<li><time>" + dataBR(h.data) + "</time><span>" + esc(h.nota) + "</span></li>").join("") + "</ol></details>" +
          "</article>" +
          '<aside class="lateral">' +
            (tocHtml ? '<div class="toc"><p class="lateral-tit">Neste artigo</p><nav>' + tocHtml + "</nav></div>" : "") +
            '<div class="lateral-acoes"><a href="#/editor/' + a.id + '">' + icone("editar") + ' Editar no painel</a><button type="button" data-copiar-link>' + icone("link") + ' Copiar link</button><button type="button" onclick="window.print()">' + icone("imprimir") + " Imprimir</button></div>" +
          "</aside>" +
        "</div>" +
        '<section class="relacionados"><h2>Artigos relacionados</h2><div class="grade-rel">' +
          relacionados(a).map(r => '<a class="rel" href="#/artigo/' + r.id + '"><span class="tipo ' + corTipo(r.tipo) + '">' + esc(r.tipo) + "</span><strong>" + esc(r.titulo) + "</strong><small>" + esc(r.resumo) + "</small></a>").join("") +
        "</div></section>" +
        '<section class="ainda-duvida"><div><h2>Ainda com dúvida?</h2><p>O chamado já vai com este artigo e o que você buscou, para ninguém pedir para você repetir.</p></div><button type="button" class="btn-pri" data-chamado>' + icone("chat") + " Falar com o suporte</button></section>" +
      "</div>";

    ligarFeedback(a);
    if (toc.length) espiarSecoes();
    app.querySelectorAll('a[data-alvo]').forEach(l => l.addEventListener("click", e => {
      e.preventDefault();
      const alvo = document.getElementById(l.dataset.alvo);
      if (alvo) window.scrollTo({ top: alvo.getBoundingClientRect().top + scrollY - 84, behavior: "smooth" });
      const det = l.closest("details.toc-movel"); if (det) det.open = false;
    }));
    if (q) destacarNoArtigo(q);
  }

  function destacarNoArtigo(q) {
    const termos = new Set(window.Motor.tokens(q));
    // inclui termos corrigidos/prefixos encontrados pelo índice
    indice.buscar(q).resultados.forEach(r => r.termos.forEach(t => termos.add(t)));
    const raiz = app.querySelector(".conteudo");
    const walker = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.parentElement.closest("pre, svg, kbd, mark") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const nos = []; while (walker.nextNode()) nos.push(walker.currentNode);
    let total = 0;
    nos.forEach(n => {
      const h = destacar(n.nodeValue, termos);
      if (h.indexOf("<mark>") === -1) return;
      total += (h.match(/<mark>/g) || []).length;
      const span = document.createElement("span"); span.innerHTML = h; n.replaceWith(span);
    });
    const faixa = app.querySelector(".faixa-n");
    if (faixa) faixa.textContent = total ? "(" + total + (total === 1 ? " ocorrência)" : " ocorrências)") : "(o termo está no título ou nas palavras-chave)";
    const primeiro = raiz.querySelector("mark");
    if (primeiro) setTimeout(() => window.scrollTo({ top: primeiro.getBoundingClientRect().top + scrollY - 160, behavior: "smooth" }), 350);
  }

  function espiarSecoes() {
    const links = app.querySelectorAll(".toc a[data-alvo]");
    const titulos = Array.from(app.querySelectorAll(".conteudo h2, .conteudo h3"));
    const marcar = () => {
      let atual = titulos[0] && titulos[0].id;
      for (const t of titulos) if (t.getBoundingClientRect().top < 140) atual = t.id;
      links.forEach(l => l.classList.toggle("ativo", l.dataset.alvo === atual));
    };
    window.removeEventListener("scroll", espiarSecoes._f);
    espiarSecoes._f = marcar;
    window.addEventListener("scroll", marcar, { passive: true });
    marcar();
  }

  function blocoFeedback(a) {
    return '<section class="feedback" data-id="' + a.id + '"><div class="fb-linha"><p class="fb-pergunta">Este artigo ajudou?</p><div class="fb-botoes">' +
      '<button type="button" class="fb-btn" data-voto="sim">' + icone("polegar") + ' Sim <span class="fb-n" data-n="sim"></span></button>' +
      '<button type="button" class="fb-btn fb-nao" data-voto="nao">' + icone("polegar", "virado") + ' Não <span class="fb-n" data-n="nao"></span></button>' +
      '</div></div><p class="fb-status"></p><div class="fb-motivo" hidden><label for="fb-txt">O que faltou? Sua resposta ajuda a melhorar o texto.</label><textarea id="fb-txt" rows="3" placeholder="Ex.: não encontrei onde fica a opção no PDV"></textarea><button type="button" class="btn-sec" data-enviar-motivo>Enviar</button></div>' +
      '<p class="fb-nota">Contagem local: guardada só neste navegador (demonstração).</p></section>';
  }

  function ligarFeedback(a) {
    const box = app.querySelector(".feedback");
    const atualizar = () => {
      const votos = ler(CHAVE.votos, {})[a.id] || { sim: 0, nao: 0 };
      const meu = ler(CHAVE.meuVoto, {})[a.id];
      box.querySelector('[data-n="sim"]').textContent = votos.sim;
      box.querySelector('[data-n="nao"]').textContent = votos.nao;
      box.querySelectorAll(".fb-btn").forEach(b => { b.classList.toggle("on", b.dataset.voto === meu); b.setAttribute("aria-pressed", b.dataset.voto === meu); });
      box.querySelector(".fb-status").textContent = meu === "sim" ? "Obrigado! Que bom que resolveu." : meu === "nao" ? "Obrigado por avisar. Conte o que faltou, se quiser." : "";
      box.querySelector(".fb-motivo").hidden = meu !== "nao";
    };
    box.querySelectorAll(".fb-btn").forEach(b => b.addEventListener("click", () => {
      const votos = ler(CHAVE.votos, {}), meus = ler(CHAVE.meuVoto, {});
      const v = votos[a.id] || { sim: 0, nao: 0 };
      const antes = meus[a.id], agora = b.dataset.voto;
      if (antes) v[antes] = Math.max(0, v[antes] - 1);
      if (antes === agora) delete meus[a.id]; else { v[agora] += 1; meus[a.id] = agora; }
      votos[a.id] = v; gravar(CHAVE.votos, votos); gravar(CHAVE.meuVoto, meus);
      atualizar();
    }));
    box.querySelector("[data-enviar-motivo]").addEventListener("click", () => {
      const txt = box.querySelector("textarea").value.trim();
      if (!txt) { box.querySelector("textarea").focus(); return; }
      const m = ler(CHAVE.motivo, {}); (m[a.id] = m[a.id] || []).push({ data: hojeISO(), texto: txt }); gravar(CHAVE.motivo, m);
      box.querySelector(".fb-motivo").innerHTML = '<p class="fb-ok">Recebido. Na versão real, isto vai para a fila do time de conteúdo.</p>';
    });
    atualizar();
  }

  // ------------------------------------------------------------------ EDITOR
  let editorSujo = false;

  function telaEditor(id) {
    document.body.dataset.tela = "editor";
    const novo = id === "novo" || !id;
    const a = novo ? { id: "", titulo: "", resumo: "", categoria: window.KB_CATEGORIAS[0].nome, produto: window.KB_PRODUTOS[0], tipo: window.KB_TIPOS[0], tags: [], corpo: "## Passo a passo\n\n1. Primeiro passo.\n2. Segundo passo.\n\n> [!dica] Dica\n> Um atalho útil para o leitor.\n", historico: [], origem: "novo" } : porId(id);
    if (!a) { irPara("#/editor/novo"); return; }
    const opts = (lista, v) => lista.map(x => '<option' + (x === v ? " selected" : "") + ">" + esc(x) + "</option>").join("");

    app.innerHTML =
      '<div class="pagina-editor">' +
        '<div class="editor-cab"><div><p class="sobretitulo">Painel de edição</p><h1>' + (novo ? "Novo artigo" : "Editar artigo") + '</h1><p class="editor-aviso">Demonstração: as alterações ficam salvas só neste navegador (localStorage) e já entram na busca.</p></div>' +
          '<div class="editor-botoes"><button type="button" class="btn-sec" id="ed-exportar">' + icone("baixar") + ' Exportar JSON</button><a class="btn-sec" href="#/editor/novo">' + icone("mais") + " Novo artigo</a></div></div>" +
        '<div class="editor-grid">' +
          '<aside class="ed-lista"><input type="search" id="ed-filtro" placeholder="Filtrar artigos" aria-label="Filtrar artigos"><div class="ed-itens"></div></aside>' +
          '<form class="ed-form" novalidate>' +
            '<div class="ed-campos">' +
              '<label class="campo largo"><span>Título</span><input name="titulo" required maxlength="120" value="' + esc(a.titulo) + '" placeholder="Ex.: Configurar a balança no PDV"></label>' +
              '<label class="campo largo"><span>Resumo <small>(aparece na busca)</small></span><input name="resumo" maxlength="200" value="' + esc(a.resumo) + '" placeholder="Uma frase que diga o que o artigo resolve"></label>' +
              '<label class="campo"><span>Categoria</span><select name="categoria">' + opts(window.KB_CATEGORIAS.map(c => c.nome), a.categoria) + "</select></label>" +
              '<label class="campo"><span>Produto</span><select name="produto">' + opts(window.KB_PRODUTOS, a.produto) + "</select></label>" +
              '<label class="campo"><span>Tipo</span><select name="tipo">' + opts(window.KB_TIPOS, a.tipo) + "</select></label>" +
              '<label class="campo"><span>Palavras-chave</span><input name="tags" value="' + esc((a.tags || []).join(", ")) + '" placeholder="balança, pesagem, pdv"></label>' +
            "</div>" +
            '<div class="ed-barra" role="toolbar" aria-label="Formatação">' +
              '<button type="button" data-ins="negrito" title="Negrito"><b>N</b></button>' +
              '<button type="button" data-ins="titulo" title="Seção">T2</button>' +
              '<button type="button" data-ins="passos" title="Passos numerados">1. Passos</button>' +
              '<button type="button" data-ins="dica" title="Caixa de dica">Dica</button>' +
              '<button type="button" data-ins="aviso" title="Caixa de atenção">Atenção</button>' +
              '<button type="button" data-ins="codigo" title="Bloco de código">&lt;/&gt; Código</button>' +
              '<button type="button" data-ins="tabela" title="Tabela">Tabela</button>' +
              '<button type="button" data-ins="tecla" title="Tecla">Tecla</button>' +
              '<select data-ilustracao aria-label="Inserir ilustração"><option value="">+ Ilustração</option>' + window.Ilustracoes.nomes.map(n => "<option>" + n + "</option>").join("") + "</select>" +
              '<div class="ed-abas" role="tablist"><button type="button" class="on" data-aba="escrever">Escrever</button><button type="button" data-aba="previa">Prévia</button></div>' +
            "</div>" +
            '<div class="ed-split" data-modo="escrever"><textarea name="corpo" spellcheck="true" aria-label="Conteúdo em Markdown">' + esc(a.corpo) + '</textarea><div class="ed-previa conteudo" aria-label="Prévia"></div></div>' +
            '<div class="ed-rodape"><label class="campo nota"><span>Nota da alteração <small>(vai para o histórico)</small></span><input name="nota" maxlength="140" placeholder="' + (novo ? "Publicação do artigo." : "Ex.: incluído o passo de conferência") + '"></label>' +
              '<div class="ed-acoes">' +
                (a.origem === "editado" ? '<button type="button" class="btn-ghost" id="ed-restaurar">Restaurar original</button>' : "") +
                (!novo ? '<button type="button" class="btn-ghost perigo" id="ed-excluir">' + (a.origem === "original" || a.origem === "editado" ? "Ocultar artigo" : "Excluir") + "</button>" : "") +
                (!novo ? '<a class="btn-sec" href="#/artigo/' + a.id + '">Ver artigo</a>' : "") +
                '<button type="submit" class="btn-pri">Salvar</button></div></div>' +
          "</form>" +
        "</div></div>";

    const form = app.querySelector(".ed-form");
    const ta = form.corpo, previa = app.querySelector(".ed-previa");
    const renderPrevia = () => {
      previa.innerHTML = '<h1 class="previa-titulo">' + esc(form.titulo.value || "Título do artigo") + "</h1>" + markdown(ta.value, window.Ilustracoes.render).html;
    };
    renderPrevia();
    editorSujo = false;
    form.addEventListener("input", () => { editorSujo = true; renderPrevia(); });

    // lista lateral
    const itens = app.querySelector(".ed-itens");
    const desenharLista = (f) => {
      const fq = norm(f || "");
      const locais = ler(CHAVE.artigos, {});
      const ocultos = Object.keys(locais).filter(k => locais[k]._excluido && ORIGINAIS.some(o => o.id === k));
      itens.innerHTML = artigos.filter(x => !fq || norm(x.titulo).includes(fq)).sort((x, y) => x.categoria.localeCompare(y.categoria) || x.titulo.localeCompare(y.titulo))
        .map(x => '<a href="#/editor/' + x.id + '" class="ed-item' + (x.id === a.id ? " atual" : "") + '"><span>' + esc(x.titulo) + '</span><small>' + esc(x.categoria) +
          (x.origem !== "original" ? ' · <b class="b-' + x.origem + '">' + (x.origem === "novo" ? "novo" : "editado") + "</b>" : "") + "</small></a>").join("") +
        (ocultos.length ? '<p class="ed-ocultos">' + ocultos.length + ' ocultado(s). <button type="button" id="ed-reexibir">Reexibir</button></p>' : "");
      const re = itens.querySelector("#ed-reexibir");
      if (re) re.addEventListener("click", () => { const l = ler(CHAVE.artigos, {}); ocultos.forEach(k => delete l[k]); gravar(CHAVE.artigos, l); carregar(); desenharLista(""); toast("Artigos reexibidos."); });
    };
    desenharLista("");
    app.querySelector("#ed-filtro").addEventListener("input", e => desenharLista(e.target.value));

    // barra de formatação
    const MODELOS = {
      negrito: ["**", "texto em negrito", "**"],
      titulo: ["\n## ", "Nome da seção", "\n"],
      passos: ["\n1. ", "Primeiro passo.", "\n2. Segundo passo.\n3. Terceiro passo.\n"],
      dica: ["\n> [!dica] ", "Título da dica", "\n> Explique aqui o atalho ou a boa prática.\n"],
      aviso: ["\n> [!aviso] ", "Cuidado com", "\n> Explique o risco e como evitar.\n"],
      codigo: ["\n~~~bash\n", "comando ou código aqui", "\n~~~\n"],
      tabela: ["\n| Coluna | Descrição |\n|---|---|\n| ", "valor", " | explicação |\n"],
      tecla: ["[[", "Ctrl", "]]"]
    };
    const inserir = (antes, meio, depois) => {
      const ini = ta.selectionStart, fim = ta.selectionEnd;
      const sel = ta.value.slice(ini, fim) || meio;
      ta.setRangeText(antes + sel + depois, ini, fim, "end");
      ta.selectionStart = ini + antes.length; ta.selectionEnd = ini + antes.length + sel.length;
      ta.focus(); editorSujo = true; renderPrevia();
    };
    form.querySelectorAll("[data-ins]").forEach(b => b.addEventListener("click", () => inserir.apply(null, MODELOS[b.dataset.ins])));
    form.querySelector("[data-ilustracao]").addEventListener("change", e => { if (e.target.value) { inserir("\n![", "Legenda da ilustração", "](ilustracao:" + e.target.value + ")\n"); e.target.value = ""; } });
    ta.addEventListener("keydown", e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") { e.preventDefault(); inserir.apply(null, MODELOS.negrito); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); form.requestSubmit(); }
    });
    form.querySelectorAll("[data-aba]").forEach(b => b.addEventListener("click", () => {
      form.querySelectorAll("[data-aba]").forEach(x => x.classList.toggle("on", x === b));
      form.querySelector(".ed-split").dataset.modo = b.dataset.aba;
    }));

    // salvar
    form.addEventListener("submit", e => {
      e.preventDefault();
      const titulo = form.titulo.value.trim();
      if (titulo.length < 5) { form.titulo.focus(); form.titulo.classList.add("erro"); toast("Dê um título com pelo menos 5 caracteres."); return; }
      if (!ta.value.trim()) { ta.focus(); toast("Escreva o conteúdo do artigo."); return; }
      form.titulo.classList.remove("erro");
      const locais = ler(CHAVE.artigos, {});
      let idFinal = a.id;
      if (novo) {
        const baseId = slugTitulo(titulo).slice(0, 60); idFinal = baseId; let k = 2;
        while (porId(idFinal) || locais[idFinal]) idFinal = baseId + "-" + k++;
      }
      const hoje = hojeISO();
      const nota = form.nota.value.trim() || (novo ? "Publicação do artigo." : "Editado no painel.");
      const salvo = {
        id: idFinal, titulo, resumo: form.resumo.value.trim() || titulo,
        categoria: form.categoria.value, produto: form.produto.value, tipo: form.tipo.value,
        tags: form.tags.value.split(",").map(t => t.trim()).filter(Boolean),
        corpo: ta.value, atualizado: hoje,
        historico: [{ data: hoje, nota }].concat(a.historico || []),
        relacionados: a.relacionados || []
      };
      locais[idFinal] = salvo;
      if (!gravar(CHAVE.artigos, locais)) { toast("Não foi possível salvar: o navegador bloqueou o armazenamento local."); return; }
      editorSujo = false;
      carregar();
      toast("Salvo neste navegador. O artigo já aparece na busca.");
      if (novo) irPara("#/editor/" + idFinal); else { telaEditor(idFinal); }
    });

    const rest = app.querySelector("#ed-restaurar");
    if (rest) rest.addEventListener("click", () => {
      if (!confirm("Descartar suas alterações e voltar ao texto original?")) return;
      const l = ler(CHAVE.artigos, {}); delete l[a.id]; gravar(CHAVE.artigos, l); carregar(); telaEditor(a.id); toast("Texto original restaurado.");
    });
    const exc = app.querySelector("#ed-excluir");
    if (exc) exc.addEventListener("click", () => {
      const original = ORIGINAIS.some(o => o.id === a.id);
      if (!confirm(original ? "Ocultar este artigo da central? Dá para reexibir depois." : "Excluir este artigo criado no painel?")) return;
      const l = ler(CHAVE.artigos, {});
      if (original) l[a.id] = { _excluido: true }; else delete l[a.id];
      gravar(CHAVE.artigos, l); carregar(); irPara("#/editor/novo"); toast(original ? "Artigo ocultado." : "Artigo excluído.");
    });
    app.querySelector("#ed-exportar").addEventListener("click", () => {
      const l = ler(CHAVE.artigos, {});
      const blob = new Blob([JSON.stringify(l, null, 2)], { type: "application/json" });
      const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "artigos-editados-" + hojeISO() + ".json";
      document.body.appendChild(link); link.click(); link.remove();
      toast(Object.keys(l).length ? "JSON com " + Object.keys(l).length + " alteração(ões) baixado." : "Nenhuma alteração local ainda. O arquivo saiu vazio.");
    });
  }

  // ------------------------------------------------------------------- rotas
  let rotaAnterior = "";
  function rotear() {
    if (substituindo) return;
    const { partes, params } = parseHash();
    const rota = partes[0] || "";
    if (rotaAnterior === "editor" && editorSujo && !confirm("Há alterações não salvas no painel. Sair mesmo assim?")) {
      substituindo = true; history.back(); setTimeout(() => { substituindo = false; }, 50); return;
    }
    editorSujo = false;
    window.removeEventListener("scroll", espiarSecoes._f || (() => {}));
    if (rota === "busca") telaBusca(params);
    else if (rota === "artigo") telaArtigo(partes[1], params);
    else if (rota === "editor") telaEditor(partes[1]);
    else telaInicio();
    rotaAnterior = rota;
    document.querySelectorAll(".nav-principal a").forEach(l => l.classList.toggle("ativo", (l.dataset.rota || "") === rota));
    const cab = document.querySelector(".cab-busca");
    cab.hidden = rota === "" || rota === "busca";
    if (!params.get("q") || rota !== "artigo") window.scrollTo(0, 0);
    const titulo = rota === "artigo" && porId(partes[1]) ? porId(partes[1]).titulo + " · " : rota === "busca" ? "Busca · " : rota === "editor" ? "Painel de edição · " : "";
    document.title = titulo + "Central de Ajuda Caderneta";
  }

  // ---------------------------------------------------------------- início
  function iniciar() {
    carregar();
    aplicarTema(temaInicial());
    document.getElementById("btn-tema").addEventListener("click", () => {
      const t = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      aplicarTema(t); gravar(CHAVE.tema, t);
    });
    const cab = document.querySelector(".cab-busca");
    cab.innerHTML = formBusca("compacta", "", "Buscar artigos");
    ligarSugestoes(cab.querySelector("form"));

    document.addEventListener("click", e => {
      const cp = e.target.closest("[data-copiar]");
      if (cp) {
        const code = cp.closest(".codigo").querySelector("code").textContent;
        (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(() => { cp.textContent = "Copiado"; setTimeout(() => cp.textContent = "Copiar", 1600); }, () => toast("Selecione o código e use Ctrl+C."));
      }
      if (e.target.closest("[data-copiar-link]")) {
        const url = location.href.split("?")[0];
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast("Link copiado."), () => toast(esc(url)));
      }
      if (e.target.closest("[data-chamado]")) {
        e.preventDefault();
        toast("<strong>Demonstração.</strong> Na versão real, abre o chat de atendimento com o artigo e a busca já anexados.");
      }
    });
    document.addEventListener("keydown", e => {
      if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) {
        const alvo = app.querySelector(".form-busca input") || document.querySelector(".cab-busca input");
        if (alvo && alvo.offsetParent !== null) { e.preventDefault(); alvo.focus(); }
        else { const c = document.querySelector(".cab-busca input"); if (c && c.offsetParent) { e.preventDefault(); c.focus(); } }
      }
    });
    window.addEventListener("hashchange", rotear);
    window.addEventListener("beforeunload", e => { if (editorSujo) { e.preventDefault(); e.returnValue = ""; } });
    rotear();
    // ?sugestao=texto abre a busca já digitada (usado nas capturas de tela)
    const pre = new URLSearchParams(location.search).get("sugestao");
    const campo = app.querySelector(".form-busca.grande input");
    if (pre && campo) { campo.value = pre; campo.dispatchEvent(new Event("input")); }
  }
  iniciar();
})();

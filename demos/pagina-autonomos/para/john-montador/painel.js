/* Painel do prestador: pedidos, agenda da semana, orçamentos por item, tabela de preços. Sem framework. */
(function () {
  "use strict";
  var L = window.Loja, esc = L.esc, brl = L.brl;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var ic = function (id) { return '<svg class="ic" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; };
  var ST_ORC = ["novo", "enviado", "aprovado", "recusado", "em execução", "concluído"];
  var ST_AG = ["novo", "confirmado", "feito", "cancelado"];
  var UNIDADES = ["m²", "metro linear", "unidade", "diária", "hora", "m³", "milheiro", "saco", "cento", "kg"];
  var slug = function (s) { return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-"); };
  var D, PED, TAB, vista = "hoje", filtro = "todos", semana = 0, ed = null;
  var params = new URLSearchParams(location.search);

  function plano() { return D.plano || "atendimento"; }
  function completo() { return plano() !== "pagina"; }

  /* ---------- login de demonstração ---------- */
  function telaLogin() {
    $("#app").innerHTML = '<div class="login"><form class="login-cartao" id="login"><div class="marca"><svg viewBox="0 0 40 40"><use href="#ramo-' + esc(D.icone || D.tema) + '"/></svg></div>' +
      "<h1>" + esc(D.nome) + "</h1><p>Painel do prestador · pedidos, agenda e preços</p>" +
      '<div class="demo-cred">Login de demonstração: usuário <b>demo</b> e senha <b>demo</b>. Os dados ficam só neste navegador.</div>' +
      '<div class="campo"><label for="lg-u">Usuário</label><input type="text" id="lg-u" value="demo" autocomplete="username"></div>' +
      '<div class="campo"><label for="lg-s">Senha</label><input type="password" id="lg-s" value="demo" autocomplete="current-password"></div>' +
      '<p class="erro" id="lg-erro"></p><button class="botao botao-zap" type="submit">Entrar no painel</button></form></div>';
    $("#login").addEventListener("submit", function (e) {
      e.preventDefault();
      if ($("#lg-u").value.trim() === "demo" && $("#lg-s").value === "demo") { try { sessionStorage.setItem("pa-logado", "1"); } catch (x) {} iniciar(); }
      else $("#lg-erro").textContent = "Na demonstração, use demo e demo.";
    });
  }

  /* ---------- estrutura ---------- */
  function iniciar() {
    PED = L.pedidos(D); TAB = L.tabela(D);
    if (!completo()) vista = "precos";
    var nomePlano = { pagina: "Plano Página", agenda: "Plano Agenda", atendimento: "Plano Atendimento automático" }[plano()];
    $("#app").innerHTML = '<div class="app"><header class="app-topo"><div class="marca"><svg viewBox="0 0 40 40"><use href="#ramo-' + esc(D.icone || D.tema) + '"/></svg></div>' +
      "<div><h1>" + esc(D.nome) + "</h1><small>Painel do prestador</small></div>" +
      '<a class="ver-site" href="index.html" style="margin-left:auto">' + ic("olho") + "Ver site</a>" +
      '<button class="sair" type="button" id="sair">Sair</button></header>' +
      '<p class="faixa-plano"><span>Demonstração · <b>' + esc(nomePlano) + '</b></span><span>Dados de exemplo, salvos só neste navegador</span></p>' +
      '<nav class="abas" id="abas"></nav><main class="vista" id="vista"></main></div>';
    $("#sair").addEventListener("click", function () { try { sessionStorage.removeItem("pa-logado"); } catch (x) {} telaLogin(); });
    desenhar();
    if (D.demo && completo() && !params.get("estatico")) setTimeout(chegaPedido, 6000);
  }

  function abas() {
    var novos = PED.filter(function (p) { return p.status === "novo"; }).length;
    var lista = completo() ? [["hoje", "hoje", "Hoje"], ["agenda", "cal", "Agenda"], ["orcamentos", "doc", "Pedidos"], ["precos", "tag", "Preços"], ["novo", "mais", "Novo orçamento"]]
      : [["precos", "tag", "Tabela de preços"]];
    $("#abas").innerHTML = lista.map(function (a) {
      return '<button type="button" class="aba' + (a[0] === "novo" ? " aba-novo" : "") + (vista === a[0] ? " on" : "") + '" data-aba="' + a[0] + '">' + ic(a[1]) + "<span>" + a[2] + "</span>" +
        (a[0] === "orcamentos" && novos ? '<span class="bolinha">' + novos + "</span>" : "") + "</button>";
    }).join("");
  }

  function desenhar() {
    abas();
    var v = $("#vista");
    if (vista === "hoje") v.innerHTML = vHoje();
    else if (vista === "agenda") v.innerHTML = vAgenda();
    else if (vista === "orcamentos") v.innerHTML = vPedidos();
    else if (vista === "precos") v.innerHTML = vPrecos();
  }

  function salvarPed() { L.salvarPedidos(D, PED); }
  function achar(id) { for (var i = 0; i < PED.length; i++) if (PED[i].id === id) return PED[i]; return null; }
  function rotTipo(p) { return p.tipo === "agendamento" ? "Agendamento" : "Orçamento"; }
  function rotOrigem(p) { return { site: "pelo site", manual: "feito no painel", robo: "pelo robô", whatsapp: "pelo WhatsApp" }[p.origem] || ""; }
  function st(s) { return '<span class="st st-' + slug(s) + '">' + esc(s) + "</span>"; }
  function quando(p) {
    if (!p.data) return "sem data";
    var dt = new Date(p.data + "T12:00:00");
    return L.DIAS[dt.getDay()] + " " + L.dataBR(p.data).slice(0, 5) + (p.hora ? " · " + p.hora : "");
  }
  function cartao(p, comHora) {
    var tot = L.totais(p);
    var resumo = p.tipo === "agendamento" ? (p.servico || "") : (p.itens || []).map(function (i) { return i.nome; }).join(", ") || (p.obs || "a descrever");
    return '<button type="button" class="cartao" data-abrir="' + esc(p.id) + '">' +
      (comHora ? '<span class="c-hora">' + esc(p.hora || "--") + "</span>" : '<span class="c-ic">' + ic(p.tipo === "agendamento" ? "cal" : "doc") + "</span>") +
      '<span class="c-meio"><b>' + esc(p.cliente) + "</b><small>" + esc(resumo) + "</small><small>" + esc((p.bairro || "") + " · " + quando(p)) + "</small></span>" +
      '<span class="c-dir">' + st(p.status) + (p.tipo !== "agendamento" ? "<b>" + (tot.sub ? brl(tot.total) : "a orçar") + "</b>" : "") +
      '<span class="origem">' + esc(rotOrigem(p)) + "</span></span></button>";
  }

  /* ---------- vistas ---------- */
  function vHoje() {
    var hoje = L.iso(L.hoje(0));
    var doDia = PED.filter(function (p) { return p.data === hoje && p.hora && p.status !== "cancelado" && p.status !== "recusado"; }).sort(function (a, b) { return a.hora < b.hora ? -1 : 1; });
    var novos = PED.filter(function (p) { return p.status === "novo"; }).sort(function (a, b) { return b.criado - a.criado; });
    var abertos = PED.filter(function (p) { return p.tipo !== "agendamento" && ["novo", "enviado"].indexOf(p.status) > -1; });
    var aprov = PED.filter(function (p) { return p.tipo !== "agendamento" && ["aprovado", "em execução"].indexOf(p.status) > -1; });
    var somaAb = abertos.reduce(function (s, p) { return s + L.totais(p).total; }, 0);
    var dt = L.hoje(0);
    var h = "<h2>Hoje <small>" + L.DIAS_LONGO[dt.getDay()] + ", " + L.dataBR(hoje) + "</small></h2>" +
      '<div class="kpis"><div class="kpi"><b>' + novos.length + "</b><span>pedidos novos para responder</span></div>" +
      '<div class="kpi"><b>' + doDia.length + "</b><span>compromissos hoje</span></div>" +
      '<div class="kpi"><b>' + abertos.length + "</b><span>orçamentos em aberto · " + brl(somaAb) + "</span></div>" +
      '<div class="kpi"><b>' + aprov.length + "</b><span>aprovados ou em execução</span></div></div>";
    h += '<div class="duas"><div><h3>Lista do dia</h3>' + (doDia.length ? '<div class="cartoes">' + doDia.map(function (p) { return cartao(p, true); }).join("") + "</div>" : '<p class="vazio">Nada marcado para hoje.</p>') + "</div>";
    h += '<div><h3>Chegando</h3><div class="cartoes" id="chegando">' + (novos.length ? novos.slice(0, 5).map(function (p) { return cartao(p); }).join("") : '<p class="vazio">Nenhum pedido novo.</p>') + "</div></div></div>";
    if (plano() === "atendimento" && D.link_bot)
      h += '<a class="cartao-robo" href="' + esc(D.link_bot) + '">' + ic("robo") + "<span><b>Robô de WhatsApp</b><small>Ver uma conversa de exemplo: triagem do pedido e agendamento sozinho</small></span></a>";
    return h;
  }

  function vAgenda() {
    var seg = L.hoje(semana * 7);
    var hoje = L.iso(L.hoje(0)), horas = (D.agenda || {}).horarios || [];
    var dias = [];
    for (var i = 0; i < 7; i++) { var x = new Date(seg); x.setDate(seg.getDate() + i); dias.push(x); }
    var h = '<div class="dia-cab"><h2>Próximos 7 dias</h2><div><button class="mini" type="button" data-sem="-1">' + ic("volta") + '</button><button class="mini" type="button" data-sem="0">Hoje</button><button class="mini" type="button" data-sem="1">' + ic("seta") + "</button></div></div>";
    h += '<div class="semana">' + dias.map(function (x) {
      var iso = L.iso(x);
      var evs = PED.filter(function (p) { return p.data === iso && p.hora && p.status !== "cancelado" && p.status !== "recusado"; }).sort(function (a, b) { return a.hora < b.hora ? -1 : 1; });
      var livres = iso >= hoje ? L.livres(D, iso) : [];
      return '<div class="sem-dia' + (iso === hoje ? " hoje" : "") + '"><h4>' + L.DIAS_LONGO[x.getDay()] + "<span>" + L.dataBR(iso).slice(0, 5) + "</span></h4>" +
        evs.map(function (p) { return '<button type="button" class="ev" data-abrir="' + esc(p.id) + '"><b>' + esc(p.hora) + "</b><span>" + esc(p.cliente) + " · " + esc(p.servico || rotTipo(p)) + "</span>" + st(p.status) + "</button>"; }).join("") +
        livres.map(function (hh) { return '<div class="ev livre"><b>' + hh + "</b><span>livre</span></div>"; }).join("") +
        (!evs.length && !livres.length ? '<div class="ev livre"><span>' + ((D.agenda.bloqueios || []).indexOf(iso) > -1 ? "feriado" : horas.length && (D.agenda.dias_semana || []).indexOf(x.getDay()) < 0 ? "não atende" : "—") + "</span></div>" : "") + "</div>";
    }).join("") + '</div><p class="dica-p">Os horários livres são os mesmos que o cliente vê no site. Quando um pedido é marcado, o horário some da página.</p>';
    return h;
  }

  function vPedidos() {
    var fs = ["todos", "novo", "enviado", "aprovado", "em execução", "concluído", "recusado", "agendamentos"];
    var lista = PED.slice().sort(function (a, b) { return b.criado - a.criado; }).filter(function (p) {
      if (filtro === "todos") return true;
      if (filtro === "agendamentos") return p.tipo === "agendamento";
      return p.tipo !== "agendamento" && p.status === filtro;
    });
    return '<h2>Pedidos e orçamentos</h2><div class="filtros">' + fs.map(function (f) { return '<button type="button" class="filtro' + (f === filtro ? " on" : "") + '" data-filtro="' + f + '">' + f + "</button>"; }).join("") + "</div>" +
      (lista.length ? '<div class="cartoes">' + lista.map(function (p) { return cartao(p); }).join("") + "</div>" : '<p class="vazio">Nada com esse filtro.</p>') +
      '<p class="dica-p">' + (D.demo ? '<button class="mini" type="button" id="zerar">Restaurar dados de exemplo</button>' : "") + "</p>";
  }

  function vPrecos() {
    return "<h2>Tabela de preços <small>o site mostra o que estiver aqui</small></h2>" +
      (!completo() ? '<p class="dica-p" style="margin:-4px 0 12px">No Plano Página o painel tem a tabela de preços; os orçamentos chegam direto no seu WhatsApp. Agenda e orçamento por item entram no Plano Agenda.</p>' : "") +
      '<div class="precos" id="precos">' + TAB.map(function (t, i) {
        return '<div class="preco-item' + (t.mostrar ? "" : " oculto") + '" data-i="' + i + '">' +
          '<div class="campo"><label>Serviço ou item</label><input data-k="nome" value="' + esc(t.nome) + '"></div>' +
          '<div class="pi-linha"><div class="campo"><label>Unidade</label><select data-k="unidade">' + UNIDADES.concat(UNIDADES.indexOf(t.unidade) < 0 ? [t.unidade] : []).map(function (u) { return "<option" + (u === t.unidade ? " selected" : "") + ">" + esc(u) + "</option>"; }).join("") + "</select></div>" +
          '<div class="campo"><label>Preço (R$)</label><input data-k="preco" inputmode="decimal" value="' + (t.preco ? String(t.preco).replace(".", ",") : "") + '" placeholder="0,00"></div></div>' +
          '<div class="campo"><label>Descrição curta</label><input data-k="descricao" value="' + esc(t.descricao || "") + '"></div>' +
          '<div class="pi-rodape"><label class="chave"><input type="checkbox" data-k="mostrar"' + (t.mostrar ? " checked" : "") + ">" + (t.mostrar ? "Preço visível no site" : "Site mostra “sob consulta”") + "</label>" +
          '<button type="button" class="mini" data-rm-preco="' + i + '">' + ic("lixo") + "Remover</button></div></div>";
      }).join("") + '</div><button type="button" class="botao-cheio" id="add-preco">' + ic("mais") + "Cadastrar serviço ou item</button>" +
      '<p class="dica-p">As mudanças são salvas na hora. <a href="index.html#servicos">Ver como ficou no site</a>.</p>';
  }

  /* ---------- editor de pedido ---------- */
  function abrir(id) {
    var p = id ? achar(id) : { id: L.id(), tipo: "orcamento", origem: "manual", cliente: "", telefone: "", bairro: (D.regioes || [""])[0], data: "", itens: [], status: "novo", desconto: 0, desconto_tipo: "R$", prazo: "", validade: L.iso(L.hoje(15)), obs: "", novo: true };
    ed = JSON.parse(JSON.stringify(p));
    if (ed.tipo !== "agendamento") { ed.desconto_tipo = ed.desconto_tipo || "R$"; if (!ed.validade) ed.validade = L.iso(L.hoje(15)); }
    var box = document.createElement("div"); box.className = "editor"; box.id = "editor";
    document.body.appendChild(box); document.body.style.overflow = "hidden";
    desenharEditor();
  }
  function fechar() { var e = $("#editor"); if (e) e.remove(); var b = $(".ed-barra"); if (b) b.remove(); document.body.style.overflow = ""; ed = null; desenhar(); }

  function msgOrc(p) {
    var t = L.totais(p), l = ["Olá" + (p.cliente ? ", " + p.cliente.split(" ")[0] : "") + "! Segue o orçamento da " + D.nome + ":", ""];
    (p.itens || []).forEach(function (i) { l.push("• " + i.nome + ": " + L.qtd(i.qtd) + " " + L.un(i.unidade, i.qtd) + " × " + (i.preco ? brl(i.preco) : "a definir") + (i.preco ? " = " + brl(i.preco * i.qtd) : "")); });
    l.push("");
    if (t.desconto) { l.push("Subtotal: " + brl(t.sub)); l.push("Desconto: " + brl(t.desconto)); }
    l.push("Total: " + brl(t.total));
    if (p.prazo) l.push("Prazo de execução: " + p.prazo);
    if (p.validade) l.push("Válido até " + L.dataBR(p.validade) + ".");
    if (p.obs) l.push("", p.obs);
    l.push("", "Qualquer dúvida, é só responder aqui.");
    return l.join("\n");
  }
  function msgLembrete(p) {
    var dt = p.data ? new Date(p.data + "T12:00:00") : null;
    return "Olá" + (p.cliente ? ", " + p.cliente.split(" ")[0] : "") + "! Aqui é da " + D.nome + ". Lembrete do seu horário: " + (p.servico || "atendimento") +
      (dt ? ", " + L.DIAS_LONGO[dt.getDay()] + " " + L.dataBR(p.data) : "") + (p.hora ? " às " + p.hora : "") + ". Pode confirmar respondendo SIM?";
  }

  function desenharEditor() {
    var p = ed, box = $("#editor"), ag = p.tipo === "agendamento";
    var opcB = (D.regioes || []).concat(["Outro bairro"]).map(function (r) { return "<option" + (r === p.bairro ? " selected" : "") + ">" + esc(r) + "</option>"; }).join("");
    var h = '<div class="ed-topo"><button type="button" id="ed-fechar" aria-label="Fechar">' + ic("volta") + "</button><h2>" + (p.novo ? "Novo orçamento" : rotTipo(p) + " · " + esc(p.cliente || "")) + "</h2>" + (p.exemplo ? '<span class="origem">exemplo</span>' : "") + "</div>";
    h += '<div class="ed-corpo"><div class="bloco"><b>Cliente</b><div class="pi-linha"><div class="campo"><label>Nome</label><input data-e="cliente" value="' + esc(p.cliente) + '"></div>' +
      '<div class="campo"><label>WhatsApp do cliente</label><input data-e="telefone" inputmode="tel" value="' + esc(p.telefone || "") + '" placeholder="(14) 9...."></div></div>' +
      '<div class="pi-linha"><div class="campo"><label>Bairro</label><select data-e="bairro">' + opcB + "</select></div>" +
      '<div class="campo"><label>' + (ag ? "Dia" : "Data desejada") + '</label><input type="date" data-e="data" value="' + esc(p.data || "") + '"></div></div>' +
      (ag ? '<div class="pi-linha"><div class="campo"><label>Serviço</label><input data-e="servico" value="' + esc(p.servico || "") + '"></div><div class="campo"><label>Horário</label><input data-e="hora" value="' + esc(p.hora || "") + '"></div></div>' : "") +
      (p.fotos ? '<p class="dica-p">' + p.fotos + " foto(s) do local enviadas pelo WhatsApp.</p>" : "") + "</div>";

    var sts = ag ? ST_AG : ST_ORC;
    h += '<div class="bloco"><b>Status</b><div class="status-sel">' + sts.map(function (s) { return '<button type="button" data-st="' + s + '" class="' + (p.status === s ? "on" : "") + '">' + s + "</button>"; }).join("") + "</div></div>";

    if (!ag) {
      h += '<div class="bloco"><b>Itens do orçamento</b><div class="itens-ed">' + (p.itens || []).map(function (it, i) {
        return '<div class="it-ed" data-it="' + i + '"><div class="campo"><label>Item</label><input data-f="nome" value="' + esc(it.nome) + '"></div>' +
          '<button type="button" class="rm" data-rm="' + i + '" aria-label="Tirar item">' + ic("lixo") + "</button>" +
          '<div class="tres"><div class="campo"><label>Qtd.</label><input data-f="qtd" inputmode="decimal" value="' + L.qtd(it.qtd) + '"></div>' +
          '<div class="campo"><label>Unidade</label><input data-f="unidade" value="' + esc(it.unidade) + '"></div>' +
          '<div class="campo"><label>Preço un.</label><input data-f="preco" inputmode="decimal" value="' + (it.preco ? String(it.preco).replace(".", ",") : "") + '" placeholder="0,00"></div></div>' +
          '<span class="sub">' + (it.preco ? brl(it.preco * it.qtd) : "preço a definir") + "</span></div>";
      }).join("") + (!(p.itens || []).length ? '<p class="vazio">Nenhum item ainda.</p>' : "") + "</div>" +
        '<div class="add-linha"><select id="add-tab"><option value="">Incluir item da tabela…</option>' + TAB.map(function (t, i) { return '<option value="' + i + '">' + esc(t.nome) + " · " + (t.preco ? brl(t.preco) + "/" + esc(t.unidade) : esc(t.unidade)) + "</option>"; }).join("") +
        '</select><button type="button" class="mini" id="add-avulso">' + ic("mais") + "Avulso</button></div></div>";
      var t = L.totais(p);
      h += '<div class="bloco"><b>Condições</b><div class="pi-linha"><div class="campo"><label>Desconto</label><input data-e="desconto" inputmode="decimal" value="' + (p.desconto ? String(p.desconto).replace(".", ",") : "") + '" placeholder="0"></div>' +
        '<div class="campo"><label>Tipo</label><select data-e="desconto_tipo"><option' + (p.desconto_tipo === "R$" ? " selected" : "") + ">R$</option><option" + (p.desconto_tipo === "%" ? " selected" : "") + ">%</option></select></div></div>" +
        '<div class="pi-linha"><div class="campo"><label>Prazo de execução</label><input data-e="prazo" value="' + esc(p.prazo || "") + '" placeholder="ex.: 5 dias úteis"></div>' +
        '<div class="campo"><label>Validade</label><input type="date" data-e="validade" value="' + esc(p.validade || "") + '"></div></div>' +
        '<div class="campo"><label>Observações</label><textarea data-e="obs">' + esc(p.obs || "") + "</textarea></div>" +
        '<div class="totais"><div><span>Subtotal</span><span>' + brl(t.sub) + "</span></div><div><span>Desconto</span><span>− " + brl(t.desconto) + '</span></div><div class="tot"><span>Total</span><span>' + brl(t.total) + "</span></div>" +
        (t.consulta ? '<div><small class="origem">' + t.consulta + " item(ns) sem preço ainda</small></div>" : "") + "</div></div>";
      h += '<div class="bloco"><b>Mensagem pronta para o WhatsApp</b><p class="msg-zap">' + esc(msgOrc(p)) + "</p></div>";
    } else {
      h += '<div class="bloco"><b>Lembrete pelo WhatsApp</b><p class="msg-zap">' + esc(msgLembrete(p)) + "</p></div>";
    }
    h += "</div>";
    box.innerHTML = h;
    var barra = $(".ed-barra") || document.body.appendChild(Object.assign(document.createElement("div"), { className: "ed-barra" }));
    barra.innerHTML = '<button type="button" class="mini forte" id="ed-salvar">Salvar</button>' +
      (!ag ? '<button type="button" class="mini" id="ed-pdf">' + ic("print") + "Gerar PDF</button>" : "") +
      '<button type="button" class="mini zap" id="ed-zap">' + ic("zap") + (ag ? "Enviar lembrete" : "Enviar no WhatsApp") + "</button>" +
      '<button type="button" class="mini" id="ed-copiar">Copiar</button>' +
      (!p.novo ? '<button type="button" class="mini" id="ed-excluir" aria-label="Excluir pedido">' + ic("lixo") + "</button>" : "");
  }

  function lerEditor() {
    $$("[data-e]", $("#editor")).forEach(function (el) {
      var k = el.getAttribute("data-e"); ed[k] = k === "desconto" ? L.num(el.value) : el.value;
    });
    $$(".it-ed", $("#editor")).forEach(function (row) {
      var it = ed.itens[+row.getAttribute("data-it")];
      $$("[data-f]", row).forEach(function (el) {
        var k = el.getAttribute("data-f"); it[k] = (k === "qtd" || k === "preco") ? L.num(el.value) : el.value;
      });
    });
  }
  function salvarEd(silencio) {
    lerEditor(); var p = ed, novo = p.novo; delete p.novo;
    var i = PED.findIndex(function (x) { return x.id === p.id; });
    if (i > -1) PED[i] = p; else { p.criado = Date.now(); PED.unshift(p); }
    salvarPed(); ed = JSON.parse(JSON.stringify(p));
    if (!silencio) L.toast(novo ? "Orçamento criado" : "Salvo");
  }

  function folhaPDF(p) {
    var t = L.totais(p), num = "Nº " + String(p.id).slice(-5).toUpperCase();
    $("#folha-orc").innerHTML = '<div class="fo-cab"><div><h1>' + esc(D.nome) + "</h1><p>" + esc(D.ramo_texto) + "</p><p>WhatsApp " + esc(D.telefone) + (D.selo ? " · " + esc(D.selo) : "") + "</p></div>" +
      '<div class="fo-num">Orçamento<b>' + num + "</b>" + L.dataBR(L.iso(L.hoje(0))) + "</div></div>" +
      "<p><b>Cliente:</b> " + esc(p.cliente || "—") + (p.telefone ? " · " + esc(p.telefone) : "") + "<br><b>Local:</b> " + esc(p.bairro || "—") + (p.data ? " · data desejada " + L.dataBR(p.data) : "") + "</p>" +
      '<table class="fo-tab"><thead><tr><th>Item</th><th class="n">Qtd.</th><th>Un.</th><th class="n">Preço un.</th><th class="n">Subtotal</th></tr></thead><tbody>' +
      (p.itens || []).map(function (i) { return "<tr><td>" + esc(i.nome) + '</td><td class="n">' + L.qtd(i.qtd) + "</td><td>" + esc(i.unidade) + '</td><td class="n">' + (i.preco ? brl(i.preco) : "a definir") + '</td><td class="n">' + (i.preco ? brl(i.preco * i.qtd) : "—") + "</td></tr>"; }).join("") +
      '</tbody></table><div class="fo-tot"><div><span>Subtotal</span><span>' + brl(t.sub) + "</span></div><div><span>Desconto</span><span>− " + brl(t.desconto) + '</span></div><div class="t"><span>Total</span><span>' + brl(t.total) + "</span></div></div>" +
      '<div class="fo-obs">' + (p.prazo ? "<span><b>Prazo de execução:</b> " + esc(p.prazo) + "</span>" : "") + (p.validade ? "<span><b>Validade:</b> até " + L.dataBR(p.validade) + "</span>" : "") +
      (p.obs ? "<span><b>Observações:</b> " + esc(p.obs) + "</span>" : "") + "<span>Valores confirmados após visita técnica e medição no local.</span></div>" +
      '<p class="fo-rod">' + esc(D.nome) + " · " + esc(D.rodape || "") + "</p>";
  }

  /* pedido simulado chegando, só na demonstração */
  function chegaPedido() {
    if (!D.chegando || sessionStorage.getItem("pa-chegou-" + D.id)) return;
    try { sessionStorage.setItem("pa-chegou-" + D.id, "1"); } catch (x) {}
    var c = JSON.parse(JSON.stringify(D.chegando)); if (c.dia != null) { c.data = L.iso(L.hoje(c.dia)); delete c.dia; }
    c.exemplo = true; L.novoPedido(D, c); PED = L.pedidos(D);
    L.toast("Novo pedido chegou " + rotOrigem(c));
    if (!ed) { desenhar(); var el = $('[data-abrir="' + c.id + '"]') || $(".cartao"); if (el) el.classList.add("novo-chegou"); }
  }

  /* ---------- eventos ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target;
    var aba = t.closest("[data-aba]");
    if (aba) { var a = aba.getAttribute("data-aba"); if (a === "novo") abrir(null); else { vista = a; desenhar(); window.scrollTo(0, 0); } return; }
    var ab = t.closest("[data-abrir]"); if (ab && !ed) { abrir(ab.getAttribute("data-abrir")); return; }
    var fl = t.closest("[data-filtro]"); if (fl) { filtro = fl.getAttribute("data-filtro"); desenhar(); return; }
    var sm = t.closest("[data-sem]"); if (sm) { var s = +sm.getAttribute("data-sem"); semana = s === 0 ? 0 : semana + s; desenhar(); return; }
    if (t.closest("#zerar")) { L.zerar(D); PED = L.pedidos(D); TAB = L.tabela(D); L.toast("Dados de exemplo restaurados"); desenhar(); return; }
    if (t.closest("#add-preco")) { TAB.push({ id: L.id(), nome: "Novo serviço", unidade: "unidade", preco: 0, mostrar: false, descricao: "" }); L.salvarTabela(D, TAB); desenhar(); var u = $$(".preco-item").pop(); if (u) { u.scrollIntoView({ block: "center" }); $("input", u).select(); } return; }
    var rp = t.closest("[data-rm-preco]"); if (rp) { var ix = +rp.getAttribute("data-rm-preco"); if (confirm("Remover “" + TAB[ix].nome + "” da tabela?")) { TAB.splice(ix, 1); L.salvarTabela(D, TAB); desenhar(); } return; }
    if (!ed) return;
    if (t.closest("#ed-fechar")) { fechar(); return; }
    var stb = t.closest("[data-st]"); if (stb) { lerEditor(); ed.status = stb.getAttribute("data-st"); desenharEditor(); return; }
    var rm = t.closest("[data-rm]"); if (rm) { lerEditor(); ed.itens.splice(+rm.getAttribute("data-rm"), 1); desenharEditor(); return; }
    if (t.closest("#add-avulso")) { lerEditor(); ed.itens.push({ nome: "Item avulso", unidade: "unidade", qtd: 1, preco: 0 }); desenharEditor(); var l = $$(".it-ed").pop(); if (l) $("input", l).select(); return; }
    if (t.closest("#ed-salvar")) { salvarEd(); fechar(); return; }
    if (t.closest("#ed-pdf")) { salvarEd(true); folhaPDF(ed); setTimeout(function () { window.print(); }, 60); return; }
    if (t.closest("#ed-zap")) {
      salvarEd(true); var msg = ed.tipo === "agendamento" ? msgLembrete(ed) : msgOrc(ed);
      if (ed.tipo !== "agendamento" && ed.status === "novo") { ed.status = "enviado"; salvarEd(true); desenharEditor(); }
      window.open(L.zap(ed.telefone || "", msg), "_blank", "noopener"); return;
    }
    if (t.closest("#ed-copiar")) { lerEditor(); L.copiar(ed.tipo === "agendamento" ? msgLembrete(ed) : msgOrc(ed)); return; }
    if (t.closest("#ed-excluir")) { if (confirm("Excluir este pedido?")) { PED = PED.filter(function (x) { return x.id !== ed.id; }); salvarPed(); fechar(); } return; }
  });
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.id === "add-tab" && t.value !== "") { lerEditor(); var x = TAB[+t.value]; ed.itens.push({ nome: x.nome, unidade: x.unidade, qtd: 1, preco: x.preco || 0 }); desenharEditor(); return; }
    if (ed && t.closest("#editor")) {
      lerEditor(); var f = t.getAttribute("data-f") || t.getAttribute("data-e");
      if (["qtd", "preco", "desconto", "desconto_tipo"].indexOf(f) > -1) { var y = window.scrollY, sc = $("#editor").scrollTop; desenharEditor(); $("#editor").scrollTop = sc; window.scrollTo(0, y); }
      else { var m = $(".msg-zap"); if (m) m.textContent = ed.tipo === "agendamento" ? msgLembrete(ed) : msgOrc(ed); }
      return;
    }
    var pi = t.closest(".preco-item");
    if (pi) {
      var item = TAB[+pi.getAttribute("data-i")], k = t.getAttribute("data-k");
      item[k] = k === "mostrar" ? t.checked : k === "preco" ? L.num(t.value) : t.value;
      if (k === "preco" && !item.preco) item.mostrar = false;
      L.salvarTabela(D, TAB); if (k === "mostrar" || k === "preco") desenhar(); L.toast("Tabela salva");
    }
  });

  L.carregar().then(function (d) {
    D = d; if (!d) return;
    document.title = "Painel · " + d.nome;
    var v = params.get("vista"); if (v) vista = v;
    var logado = params.get("entrar") === "demo"; try { logado = logado || sessionStorage.getItem("pa-logado") === "1"; } catch (x) {}
    if (logado) { iniciar(); if (params.get("abrir")) { var p = PED.filter(function (x) { return x.tipo !== "agendamento"; })[+params.get("abrir") || 0]; if (p) abrir(p.id); } }
    else telaLogin();
  });
})();

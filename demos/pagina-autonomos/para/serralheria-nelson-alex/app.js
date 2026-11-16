/* Página para autônomos: monta tudo a partir de dados.json + tabela de preços do painel (sem framework) */
(function () {
  "use strict";
  var L = window.Loja, esc = L.esc, brl = L.brl;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var ic = function (id) { return '<svg class="ic" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; };
  var num2 = function (n) { return (n < 10 ? "0" : "") + n; };
  var D, TAB, qtds = {}, fotos = 0, agSel = { dia: null, hora: null };

  function precoTxt(t) {
    return t.mostrar && t.preco > 0 ? "<b>" + brl(t.preco) + "</b>" + (t.unidade ? "por " + esc(t.unidade) : "") : "<b class='consulta'>sob consulta</b>";
  }

  function montar(d) {
    if (!d) { $("#pagina").innerHTML = '<p class="carregando">Não consegui ler os dados da página.</p>'; return; }
    D = d; TAB = L.tabela(d);
    var mod = d.modulos || {}, n = 0;
    var secao = function (titulo, id, corpo, nota, plano) {
      n++;
      return '<section class="secao" id="' + id + '"><div class="secao-cab"><span class="num">' + num2(n) + '</span><h2>' + esc(titulo) + "</h2>" +
        (plano && d.demo ? '<span class="plano-tag">' + esc(plano) + "</span>" : "") + "</div>" +
        (nota ? '<p class="secao-nota">' + esc(nota) + "</p>" : "") + corpo + "</section>";
    };
    var h = "", ramo = d.tema || d.ramo || "generico";
    if (d.demo) h += '<p class="faixa-demo"><span>' + esc(d.faixa_texto || "Projeto demonstrativo · marca fictícia") + '</span>' +
      (mod.painel ? '<a href="painel.html">Painel do prestador' + ic("seta") + "</a>" : "") + "</p>";

    h += '<header class="topo"><div class="topo-linha"><div class="marca"><svg viewBox="0 0 40 40" aria-hidden="true"><use href="#ramo-' + esc(d.icone || ramo) + '"/></svg></div>' +
      '<div><p class="ramo">' + esc(d.ramo_texto) + '</p><h1 class="nome">' + esc(d.nome) + "</h1></div></div>" +
      (d.slogan ? '<p class="slogan">' + esc(d.slogan) + "</p>" : "") +
      (d.selo ? '<p class="selo">' + ic("pin") + esc(d.selo) + "</p>" : "") + "</header>";

    var msgPadrao = d.mensagem_padrao || ("Olá, " + d.nome + "! Vi sua página e quero um orçamento.");
    h += '<div class="acoes" id="acoes"><a class="botao botao-zap" href="' + L.zap(d.whatsapp, msgPadrao) + '" target="_blank" rel="noopener">' + ic("zap") + "Pedir orçamento no WhatsApp</a>" +
      '<div class="acoes-2"><a class="botao botao-ligar" href="tel:+' + String(d.whatsapp).replace(/\D/g, "") + '">' + ic("fone") + "Ligar</a>" +
      '<a class="botao botao-ligar" href="#orcamento">' + ic("calc") + "Calcular</a>" +
      (mod.agenda ? '<a class="botao botao-ligar" href="#agendar">' + ic("cal") + "Agendar</a>" : "") + "</div></div>";
    if (d.destaques && d.destaques.length)
      h += '<ul class="destaques">' + d.destaques.map(function (t) { return "<li>" + ic("check") + esc(t) + "</li>"; }).join("") + "</ul>";
    if (d.aviso) h += '<p class="aviso">' + ic("info") + esc(d.aviso) + "</p>";

    /* tabela de preços (vem do painel) */
    var vis = TAB.filter(function (t) { return t.ativo !== false; });
    if (vis.length)
      h += secao(d.titulo_servicos || "Serviços e preços", "servicos", '<ul class="servicos">' + vis.map(function (t) {
        return '<li><span class="serv-nome">' + esc(t.nome) + '</span><span class="serv-preco">' + precoTxt(t) + "</span>" +
          (t.descricao ? '<span class="serv-desc">' + esc(t.descricao) + "</span>" : "") + "</li>";
      }).join("") + "</ul>", d.nota_precos);

    /* galeria */
    if (d.galeria && d.galeria.length) {
      var temAD = d.galeria.some(function (g) { return g.antes; });
      h += secao(d.titulo_galeria || "Trabalhos", "trabalhos", '<div class="galeria">' + d.galeria.map(function (g) {
        var leg = "<figcaption><b>" + esc(g.legenda || "") + "</b>" + (g.detalhe ? " · " + esc(g.detalhe) : "") + "</figcaption>";
        if (g.antes) return '<figure class="item"><div class="quadro ad"><img src="' + esc(g.antes) + '" alt="Antes: ' + esc(g.legenda) + '" loading="lazy">' +
          '<img class="depois" src="' + esc(g.depois) + '" alt="Depois: ' + esc(g.legenda) + '" loading="lazy"><span class="linha-corte"></span>' +
          '<span class="etq etq-a">Antes</span><span class="etq etq-d">Depois</span><input type="range" min="0" max="100" value="50" aria-label="Comparar antes e depois"></div>' + leg + "</figure>";
        return '<figure class="item"><div class="quadro"><img src="' + esc(g.foto) + '" alt="' + esc(g.legenda) + '" loading="lazy"></div>' + leg + "</figure>";
      }).join("") + '</div><p class="galeria-dica">' + ic("arrasta") + (temAD ? "Arraste a linha para comparar. Deslize para o lado para ver mais." : "Deslize para o lado para ver mais.") + "</p>", d.nota_galeria);
    }

    /* orçamento automático */
    var opcBairro = (d.regioes || []).map(function (r) { return "<option>" + esc(r) + "</option>"; }).join("") + "<option>Outro bairro</option>";
    var orc = '<div class="calc" id="calc">' + vis.map(function (t) {
      return '<div class="calc-item" data-id="' + esc(t.id) + '"><div class="calc-nome"><b>' + esc(t.nome) + "</b><small>" +
        (t.mostrar && t.preco > 0 ? brl(t.preco) + " / " + esc(t.unidade) : "sob consulta · " + esc(t.unidade)) + '</small></div>' +
        '<div class="passo"><button type="button" data-q="-1" aria-label="Menos">−</button><input inputmode="decimal" value="0" aria-label="Quantidade de ' + esc(t.nome) + '"><button type="button" data-q="1" aria-label="Mais">+</button></div>' +
        '<span class="calc-sub"></span></div>';
    }).join("") + '</div><div class="resumo" id="resumo"></div>' +
      '<form class="pedido" id="form-pedido" novalidate>' +
      '<div class="campo"><label for="f-bairro">Bairro</label><select id="f-bairro">' + opcBairro + "</select></div>" +
      '<div class="dupla"><div class="campo"><label for="f-data">' + esc(d.rotulo_data || "Data desejada") + '</label><input type="date" id="f-data"></div>' +
      '<div class="campo"><label for="f-nome">Seu nome</label><input type="text" id="f-nome" autocomplete="given-name"></div></div>' +
      '<div class="campo"><span class="rot">' + esc(d.rotulo_fotos || "Fotos do local") + ' <span class="opc">(opcional)</span></span>' +
      '<label class="fotos-btn">' + ic("camera") + '<span id="f-fotos-txt">Escolher fotos</span><input type="file" id="f-fotos" accept="image/*" multiple></label>' +
      '<div class="miniaturas" id="f-minis"></div><p class="dica">O link do WhatsApp não leva anexo: a mensagem avisa que você tem fotos e você manda na conversa em seguida.</p></div>' +
      '<div class="campo"><label for="f-det">Detalhes <span class="opc">(opcional)</span></label><textarea id="f-det" placeholder="' + esc(d.placeholder_detalhes || "Medidas, quantidade, o que precisa") + '"></textarea></div>' +
      '<p class="previa" id="f-previa"></p><button class="botao botao-zap" type="submit">' + ic("zap") + "Enviar pelo WhatsApp</button></form>";
    h += secao(d.titulo_orcamento || "Orçamento na hora", "orcamento", orc, "Escolha os itens e a quantidade. A estimativa aparece na hora.", "Plano Página");

    /* agendamento */
    if (mod.agenda) {
      var ag = d.agenda || {};
      var servAg = (ag.servicos && ag.servicos.length ? ag.servicos : vis.map(function (t) { return t.nome; }));
      var dias = "", janela = ag.janela_dias || 14, ini = ag.antecedencia_dias == null ? 1 : ag.antecedencia_dias;
      for (var i = ini; i < ini + janela; i++) {
        var dt = L.hoje(i);
        if ((ag.dias_semana || [1, 2, 3, 4, 5, 6]).indexOf(dt.getDay()) < 0 || (ag.bloqueios || []).indexOf(L.iso(dt)) > -1) continue;
        dias += '<button type="button" class="dia" data-dia="' + L.iso(dt) + '"><small>' + L.DIAS[dt.getDay()] + "</small><b>" + dt.getDate() + "</b><small>" +
          ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][dt.getMonth()] + "</small></button>";
      }
      h += secao(ag.titulo || "Agendar horário", "agendar",
        '<form class="pedido agenda" id="form-agenda" novalidate><div class="campo"><label for="a-serv">' + esc(ag.rotulo_servico || "Serviço") + '</label><select id="a-serv">' +
        servAg.map(function (s) { return "<option>" + esc(s) + "</option>"; }).join("") + "</select></div>" +
        '<div class="campo"><span class="rot">Dia</span><div class="dias" id="a-dias">' + dias + "</div></div>" +
        '<div class="campo"><span class="rot">Horário livre</span><div class="horas" id="a-horas"><p class="dica">Escolha um dia.</p></div></div>' +
        '<div class="campo"><label for="a-bairro">Bairro</label><select id="a-bairro">' + opcBairro + "</select></div>" +
        '<div class="campo"><label for="a-nome">Seu nome</label><input type="text" id="a-nome" autocomplete="given-name"></div>' +
        '<button class="botao botao-zap" type="submit" id="a-enviar" disabled>' + ic("zap") + "Pedir este horário</button>" +
        '<p class="dica" style="margin-top:8px">' + esc(ag.nota || "O horário fica reservado quando o profissional confirmar pelo WhatsApp.") + "</p></form>",
        ag.subtitulo || null, "Plano Agenda");
    }

    if (d.passos && d.passos.length)
      h += secao("Como funciona", "como", '<ol class="passos">' + d.passos.map(function (p) {
        return "<li><div><b>" + esc(p.titulo) + "</b><span>" + esc(p.texto) + "</span></div></li>";
      }).join("") + "</ol>");

    var reg = "";
    if (d.regioes && d.regioes.length)
      reg += '<ul class="chips">' + d.regioes.map(function (r, i) { return '<li class="' + (i === 0 ? "principal" : "") + '">' + esc(r) + "</li>"; }).join("") + "</ul>";
    if (d.horarios && d.horarios.length)
      reg += '<table class="horarios">' + d.horarios.map(function (r) { return "<tr><td>" + esc(r.dias) + "</td><td>" + esc(r.horas) + "</td></tr>"; }).join("") + "</table>";
    if (reg) h += secao("Onde e quando atendo", "regioes", reg, d.nota_regioes);

    var av = "";
    if (d.avaliacoes && d.avaliacoes.length)
      av += '<div class="aval-lista">' + d.avaliacoes.map(function (a) {
        var e = Math.max(0, Math.min(5, a.estrelas || 5));
        return '<div class="aval"><span class="estrelas" aria-label="' + e + ' de 5">' + "★★★★★".slice(0, e) + "</span><p>" + esc(a.texto) + "</p><small>" + esc(a.nome) + (a.origem ? " · " + esc(a.origem) : "") + "</small></div>";
      }).join("") + "</div>";
    var qr = d.qr_avaliacao ? '<div class="qr"><img src="' + esc(d.qr_avaliacao) + '" alt="QR code para avaliar no Google" width="100" height="100"><small>' + esc(d.qr_rotulo || "Aponte a câmera") + "</small></div>" : "";
    av += '<div class="aval-vazio"' + (qr ? "" : ' style="grid-template-columns:1fr"') + "><div><b>" +
      (d.avaliacoes && d.avaliacoes.length ? "Já fez serviço comigo? Conte como foi." : "Ainda sem avaliações publicadas aqui.") + "</b><p>" +
      esc(d.texto_avaliacao || "Se você já foi atendido, sua avaliação no Google ajuda o vizinho a escolher com segurança.") + "</p>" +
      (d.link_avaliacao ? '<a class="link-aval" href="' + esc(d.link_avaliacao) + '" target="_blank" rel="noopener">Avaliar no Google' + ic("seta") + "</a>" : "") + "</div>" + qr + "</div>";
    h += secao("Avaliações", "avaliacoes", av);

    var pg = d.pagamento || {}, ph = "";
    if (pg.pix) ph += '<div class="pix"><span class="pix-ic">' + ic("pix") + "</span><div><small>Chave PIX" + (pg.pix_tipo ? " · " + esc(pg.pix_tipo) : "") + "</small><b>" + esc(pg.pix) + "</b>" +
      (pg.pix_nome ? "<small>" + esc(pg.pix_nome) + "</small>" : "") + '</div><button class="copiar" type="button" data-copiar="' + esc(pg.pix) + '">Copiar</button></div>';
    if (pg.formas && pg.formas.length) ph += '<ul class="formas">' + pg.formas.map(function (f) {
      var k = f.toLowerCase(); return "<li>" + ic(k.indexOf("pix") > -1 ? "pix" : k.indexOf("dinheiro") > -1 ? "dinheiro" : "cartao") + esc(f) + "</li>";
    }).join("") + "</ul>";
    if (pg.obs) ph += '<p class="pag-obs">' + esc(pg.obs) + "</p>";
    if (ph) h += secao("Pagamento", "pagamento", ph, "Só informação: o pagamento é combinado direto com o profissional.");

    h += '<footer class="rodape"><button class="compartilhar" type="button" id="compartilhar">' + ic("share") + "Compartilhar esta página</button><p>" + esc(d.rodape || "") + "</p></footer>";

    $("#pagina").innerHTML = h;
    document.title = d.nome + " · " + d.ramo_texto;
    $("#barra").innerHTML = '<a class="botao botao-zap" href="' + L.zap(d.whatsapp, msgPadrao) + '" target="_blank" rel="noopener">' + ic("zap") + "Orçamento no WhatsApp</a>" +
      '<a class="botao botao-ligar" href="tel:+' + String(d.whatsapp).replace(/\D/g, "") + '" aria-label="Ligar">' + ic("fone") + "</a>";
    ligar();
  }

  /* ---------- orçamento ---------- */
  function itensEscolhidos() {
    return TAB.filter(function (t) { return (qtds[t.id] || 0) > 0; }).map(function (t) {
      return { nome: t.nome, unidade: t.unidade, qtd: qtds[t.id], preco: t.mostrar ? (t.preco || 0) : 0 };
    });
  }
  function mensagemOrc() {
    var itens = itensEscolhidos(), tot = L.totais({ itens: itens });
    var l = ["Olá, " + D.nome + "! Vim pela sua página e quero um orçamento.", ""];
    if (itens.length) {
      l.push("Itens:");
      itens.forEach(function (it) { l.push("• " + it.nome + ": " + L.qtd(it.qtd) + " " + L.un(it.unidade, it.qtd) + (it.preco ? " (estimativa " + brl(it.preco * it.qtd) + ")" : " (sob consulta)")); });
      if (tot.sub) l.push("Estimativa da página: " + brl(tot.total) + (tot.consulta ? " + itens sob consulta" : ""));
      l.push("");
    }
    l.push("Bairro: " + $("#f-bairro").value);
    var dt = $("#f-data").value; if (dt) l.push((D.rotulo_data || "Data desejada") + ": " + L.dataBR(dt));
    if (fotos) l.push("Fotos: tenho " + fotos + (fotos > 1 ? " fotos" : " foto") + " do local, mando aqui em seguida.");
    var det = $("#f-det").value.trim(); if (det) l.push("Detalhes: " + det);
    var nome = $("#f-nome").value.trim(); if (nome) l.push("", "Meu nome é " + nome + ".");
    return l.join("\n");
  }
  function atualizarOrc() {
    TAB.forEach(function (t) {
      var row = $('.calc-item[data-id="' + t.id + '"]'); if (!row) return;
      var q = qtds[t.id] || 0; row.classList.toggle("on", q > 0);
      $(".calc-sub", row).textContent = q > 0 ? (t.mostrar && t.preco ? brl(t.preco * q) : "consulta") : "";
    });
    var itens = itensEscolhidos(), tot = L.totais({ itens: itens }), r = $("#resumo");
    if (!itens.length) { r.innerHTML = '<p class="dica">Nenhum item escolhido ainda. Você também pode só descrever o serviço abaixo.</p>'; }
    else r.innerHTML = '<div class="resumo-linha"><span>' + itens.length + (itens.length > 1 ? " itens" : " item") + (tot.consulta ? " · " + tot.consulta + " sob consulta" : "") +
      '</span><b>' + (tot.sub ? brl(tot.total) : "sob consulta") + '</b></div><p class="resumo-aviso">' + ic("info") +
      esc(D.aviso_orcamento || "Estimativa pela tabela. O valor final é confirmado na visita, depois de medir o local.") + "</p>";
    $("#f-previa").textContent = mensagemOrc();
  }

  /* ---------- agenda ---------- */
  function desenharHoras() {
    var box = $("#a-horas"); if (!box) return;
    if (!agSel.dia) return;
    var livres = L.livres(D, agSel.dia), todos = (D.agenda || {}).horarios || [];
    box.innerHTML = todos.map(function (hh) {
      var ok = livres.indexOf(hh) > -1;
      return '<button type="button" class="hora' + (agSel.hora === hh ? " sel" : "") + '" data-hora="' + hh + '"' + (ok ? "" : " disabled") + ">" + hh + (ok ? "" : "<small>ocupado</small>") + "</button>";
    }).join("") || '<p class="dica">Sem horários neste dia.</p>';
    $("#a-enviar").disabled = !agSel.hora;
  }

  function ligar() {
    $$(".quadro.ad").forEach(function (q) {
      var r = $("input", q), f = function () { q.style.setProperty("--pos", r.value + "%"); };
      r.addEventListener("input", f); f();
    });
    var barra = $("#barra");
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) {
      barra.classList.toggle("ver", !e[0].isIntersecting && e[0].boundingClientRect.top < 0);
    }).observe($("#acoes"));

    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-copiar]"); if (b) L.copiar(b.getAttribute("data-copiar"));
      var q = e.target.closest("[data-q]");
      if (q) {
        var row = q.closest(".calc-item"), id = row.getAttribute("data-id"), inp = $("input", row);
        var v = Math.max(0, L.num(inp.value) + Number(q.getAttribute("data-q")));
        inp.value = L.qtd(v); qtds[id] = v; atualizarOrc();
      }
      var dia = e.target.closest("[data-dia]");
      if (dia) { $$(".dia").forEach(function (x) { x.classList.toggle("sel", x === dia); }); agSel.dia = dia.getAttribute("data-dia"); agSel.hora = null; desenharHoras(); }
      var hora = e.target.closest("[data-hora]");
      if (hora && !hora.disabled) { agSel.hora = hora.getAttribute("data-hora"); desenharHoras(); }
    });
    $("#calc").addEventListener("input", function (e) {
      var row = e.target.closest(".calc-item"); if (!row) return;
      qtds[row.getAttribute("data-id")] = Math.max(0, L.num(e.target.value)); atualizarOrc();
    });
    $("#compartilhar").addEventListener("click", function () {
      var dd = { title: D.nome, text: D.nome + " · " + D.ramo_texto + (D.selo ? ". " + D.selo : ""), url: location.href };
      if (navigator.share) navigator.share(dd).catch(function () {});
      else window.open("https://wa.me/?text=" + encodeURIComponent(dd.text + " " + dd.url), "_blank", "noopener");
    });

    var f = $("#form-pedido");
    try { $("#f-data").min = L.iso(L.hoje(0)); } catch (e) {}
    f.addEventListener("input", atualizarOrc); f.addEventListener("change", atualizarOrc);
    $("#f-fotos").addEventListener("change", function () {
      var arqs = Array.prototype.slice.call(this.files || []); fotos = arqs.length;
      $("#f-fotos-txt").textContent = fotos ? fotos + (fotos > 1 ? " fotos escolhidas" : " foto escolhida") : "Escolher fotos";
      $("#f-minis").innerHTML = "";
      arqs.slice(0, 6).forEach(function (a) { var im = document.createElement("img"); im.alt = ""; im.src = URL.createObjectURL(a); $("#f-minis").appendChild(im); });
      atualizarOrc();
    });
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = mensagemOrc();
      L.novoPedido(D, { tipo: "orcamento", origem: "site", cliente: $("#f-nome").value.trim() || "Cliente pelo site", bairro: $("#f-bairro").value,
        data: $("#f-data").value || "", itens: itensEscolhidos(), fotos: fotos, obs: $("#f-det").value.trim() });
      window.open(L.zap(D.whatsapp, msg), "_blank", "noopener");
      L.toast("Pedido enviado. Na demo ele aparece no painel.");
    });
    atualizarOrc();
    var d1 = $(".dia"); if (d1) d1.click();

    var fa = $("#form-agenda");
    if (fa) fa.addEventListener("submit", function (e) {
      e.preventDefault(); if (!agSel.hora) return;
      var nome = $("#a-nome").value.trim(), serv = $("#a-serv").value, bairro = $("#a-bairro").value;
      var dt = new Date(agSel.dia + "T12:00:00");
      var msg = "Olá, " + D.nome + "! Quero agendar pela sua página.\n\nServiço: " + serv + "\nDia: " + L.DIAS_LONGO[dt.getDay()] + ", " + L.dataBR(agSel.dia) +
        "\nHorário: " + agSel.hora + "\nBairro: " + bairro + (nome ? "\n\nMeu nome é " + nome + "." : "");
      L.novoPedido(D, { tipo: "agendamento", origem: "site", cliente: nome || "Cliente pelo site", bairro: bairro, servico: serv, data: agSel.dia, hora: agSel.hora });
      window.open(L.zap(D.whatsapp, msg), "_blank", "noopener");
      L.toast("Horário pedido. Na demo ele aparece no painel.");
      agSel.hora = null; desenharHoras();
    });
  }

  L.carregar().then(montar);
})();

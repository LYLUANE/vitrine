/* Loja de dados compartilhada entre a página e o painel.
   Na demonstração tudo fica no localStorage deste navegador. Na versão do cliente, as mesmas funções gravam num banco online. */
(function (w) {
  "use strict";
  var L = {};
  L.esc = function (t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  L.brl = function (v) {
    v = Number(v) || 0;
    return "R$ " + v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".").replace(/,00$/, "");
  };
  L.num = function (v) { var n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? 0 : n; };
  L.qtd = function (v) { return String(Math.round(v * 100) / 100).replace(".", ","); };
  L.un = function (u, q) {
    if (!(q > 1)) return u;
    var m = { "metro linear": "metros lineares", "unidade": "unidades", "diária": "diárias", "hora": "horas", "saco": "sacos", "cento": "centos", "milheiro": "milheiros" };
    return m[u] || u;
  };
  L.hoje = function (desloc) {
    var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + (desloc || 0)); return d;
  };
  L.iso = function (d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); };
  L.dataBR = function (iso) { if (!iso) return ""; var p = iso.split("-"); return p[2] + "/" + p[1] + "/" + p[0]; };
  L.DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  L.DIAS_LONGO = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  L.id = function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };

  L.carregar = function () {
    var emb = function () { try { return JSON.parse(document.getElementById("dados-embutidos").textContent); } catch (e) { return null; } };
    if (location.protocol === "file:") return Promise.resolve(emb());
    return fetch("dados.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).catch(emb);
  };

  function chave(d, k) { return "pa:" + (d.id || "pagina") + ":" + k; }
  function ler(d, k) { try { var v = localStorage.getItem(chave(d, k)); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function gravar(d, k, v) { try { localStorage.setItem(chave(d, k), JSON.stringify(v)); } catch (e) {} }

  L.tabela = function (d) { return ler(d, "tabela") || (d.tabela || []).map(function (t) { return Object.assign({}, t); }); };
  L.salvarTabela = function (d, t) { gravar(d, "tabela", t); };

  /* pedidos de exemplo nascem com datas relativas a hoje, para a demo sempre parecer viva */
  L.pedidos = function (d) {
    var p = ler(d, "pedidos");
    if (p) return p;
    p = (d.pedidos_exemplo || []).map(function (e, i) {
      var o = Object.assign({}, e);
      o.id = "ex" + i; o.exemplo = true;
      if (e.dia != null) {
        var dt = L.hoje(e.dia), dias = (d.agenda || {}).dias_semana || [1, 2, 3, 4, 5, 6], n = 0;
        while (e.dia >= 0 && dias.indexOf(dt.getDay()) < 0 && n++ < 7) dt.setDate(dt.getDate() + 1);
        o.data = L.iso(dt);
      }
      o.criado = Date.now() - (e.ha_horas || (i + 1) * 3) * 36e5;
      delete o.dia; delete o.ha_horas;
      return o;
    });
    gravar(d, "pedidos", p);
    return p;
  };
  L.salvarPedidos = function (d, p) { gravar(d, "pedidos", p); };
  L.novoPedido = function (d, ped) {
    var p = L.pedidos(d); ped.id = ped.id || L.id(); ped.criado = Date.now(); ped.status = ped.status || "novo";
    p.unshift(ped); L.salvarPedidos(d, p); return ped;
  };
  L.zerar = function (d) { try { localStorage.removeItem(chave(d, "pedidos")); localStorage.removeItem(chave(d, "tabela")); } catch (e) {} };

  L.totais = function (ped) {
    var sub = 0, consulta = 0;
    (ped.itens || []).forEach(function (it) { if (it.preco > 0) sub += it.preco * it.qtd; else consulta++; });
    var desc = ped.desconto_tipo === "%" ? sub * (L.num(ped.desconto) / 100) : L.num(ped.desconto);
    return { sub: sub, desconto: Math.min(desc, sub), total: Math.max(0, sub - desc), consulta: consulta };
  };

  /* horários livres de um dia, descontando o que já está marcado */
  L.livres = function (d, iso) {
    var ag = d.agenda || {}, dt = new Date(iso + "T12:00:00");
    if ((ag.dias_semana || [1, 2, 3, 4, 5, 6]).indexOf(dt.getDay()) < 0 || (ag.bloqueios || []).indexOf(iso) > -1) return [];
    var ocupados = L.pedidos(d).filter(function (p) { return p.data === iso && p.hora && p.status !== "recusado" && p.status !== "cancelado"; })
      .map(function (p) { return p.hora; });
    var agora = new Date(), ehHoje = iso === L.iso(L.hoje(0));
    return (ag.horarios || []).filter(function (h) {
      if (ocupados.indexOf(h) > -1) return false;
      if (ehHoje) { var hh = h.split(":"); return +hh[0] > agora.getHours() + 1; }
      return true;
    });
  };

  L.zap = function (numero, texto) { return "https://wa.me/" + String(numero || "").replace(/\D/g, "") + "?text=" + encodeURIComponent(texto); };

  L.toast = function (t) {
    var el = document.getElementById("toast"); if (!el) return;
    el.textContent = t; el.classList.add("ver");
    clearTimeout(L.toast.t); L.toast.t = setTimeout(function () { el.classList.remove("ver"); }, 2400);
  };
  L.copiar = function (t) {
    var ok = function () { L.toast("Copiado"); };
    var falha = function () {
      var a = document.createElement("textarea"); a.value = t; document.body.appendChild(a); a.select();
      try { document.execCommand("copy"); ok(); } catch (e) { L.toast("Não deu para copiar"); } a.remove();
    };
    if (navigator.clipboard && w.isSecureContext) navigator.clipboard.writeText(t).then(ok, falha); else falha();
  };
  w.Loja = L;
})(window);

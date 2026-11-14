/* Motor da Central de Ajuda: normalização, índice invertido, busca tolerante a erros e Markdown.
   Sem bibliotecas externas. */
(function () {
  "use strict";

  const STOP = new Set(("a o e de da do das dos em no na nos nas um uma uns umas para por com sem que se ao aos " +
    "como mais ou sua seu suas seus ja nao sim the eu voce isso esse essa este esta pelo pela pelos pelas " +
    "entre ate sobre tem ter foi ser sao era quando onde qual quais").split(" "));

  /** minúsculas, sem acento */
  function norm(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  /** radical leve para plural em português */
  function stem(t) {
    if (t.length <= 3) return t;
    if (t.endsWith("oes") || t.endsWith("aes")) return t.slice(0, -3) + "ao";
    if (t.endsWith("ais")) return t.slice(0, -3) + "al";
    if (t.endsWith("eis") && t.length > 5) return t.slice(0, -3) + "el";
    if (t.endsWith("ns")) return t.slice(0, -2) + "m";
    if (/(r|z|s)es$/.test(t) && t.length > 5) return t.slice(0, -2);
    if (t.endsWith("s") && !t.endsWith("ss")) return t.slice(0, -1);
    return t;
  }

  const RE_PALAVRA = /[\p{L}\p{N}]+/gu;

  function tokens(texto, manterStop) {
    const out = [];
    const m = norm(texto).match(/[a-z0-9]+/g) || [];
    for (const w of m) {
      if (w.length < 2) continue;
      if (!manterStop && STOP.has(w)) continue;
      out.push(stem(w));
    }
    return out;
  }

  /** distância de edição (Damerau simplificada: inclui troca de letras vizinhas), com corte */
  function distancia(a, b, max) {
    if (a === b) return 0;
    const la = a.length, lb = b.length;
    if (Math.abs(la - lb) > max) return max + 1;
    let prev2 = null, prev = new Array(lb + 1), cur = new Array(lb + 1);
    for (let j = 0; j <= lb; j++) prev[j] = j;
    for (let i = 1; i <= la; i++) {
      cur[0] = i;
      let menor = cur[0];
      for (let j = 1; j <= lb; j++) {
        const custo = a[i - 1] === b[j - 1] ? 0 : 1;
        let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + custo);
        if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
        cur[j] = v;
        if (v < menor) menor = v;
      }
      if (menor > max) return max + 1;
      prev2 = prev.slice(); const t = prev; prev = cur; cur = t;
    }
    return prev[lb];
  }

  /** texto puro de um corpo Markdown */
  function textoPuro(md) {
    const fecha = t => (/[.!?:;]$/.test(t) ? t : t + ".");
    const out = [];
    String(md || "").replace(/~~~[\s\S]*?~~~/g, "\n").split("\n").forEach(l => {
      l = l.trim().replace(/\[\[([^\]]+)\]\]/g, "$1").replace(/[*`]/g, "");
      if (!l || /^\|[\s:|-]+\|$/.test(l)) return;
      if (/^\|/.test(l)) { out.push(fecha(l.replace(/^\||\|$/g, "").split("|").map(c => c.trim()).filter(c => c && c !== "—").join(", "))); return; }
      l = l.replace(/^#{1,6}\s+/, "").replace(/^>\s*\[![a-z]+\]\s*/i, "").replace(/^>\s?/, "")
        .replace(/^\d+\.\s+/, "").replace(/^[-*]\s+/, "")
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/\[\[([^\]]+)\]\]/g, "$1").replace(/[*`]/g, "").trim();
      if (l) out.push(fecha(l));
    });
    return out.join(" ").replace(/\s+/g, " ").trim();
  }

  // ---------------------------------------------------------------- índice
  const PESOS = { titulo: 6, tags: 4, resumo: 2.5, categoria: 1.5, corpo: 1 };

  function Indice(docs) {
    this.docs = docs;
    this.mapa = new Map();      // token -> Map(idDoc -> peso)
    this.forma = new Map();     // token -> palavra original mais comum (para "você quis dizer")
    this.puro = new Map();      // idDoc -> texto puro
    for (const d of docs) this._adicionar(d);
    this.vocab = Array.from(this.mapa.keys());
  }

  Indice.prototype._adicionar = function (d) {
    const puro = textoPuro(d.corpo);
    this.puro.set(d.id, puro);
    const campos = {
      titulo: d.titulo, tags: (d.tags || []).join(" "), resumo: d.resumo,
      categoria: d.categoria + " " + d.produto + " " + d.tipo, corpo: puro
    };
    const acumulado = new Map();
    for (const campo in campos) {
      const txt = campos[campo] || "";
      const brutas = txt.match(RE_PALAVRA) || [];
      for (const bruta of brutas) {
        const n = norm(bruta);
        if (n.length < 2 || STOP.has(n)) continue;
        const t = stem(n);
        acumulado.set(t, (acumulado.get(t) || 0) + PESOS[campo]);
        if (!this.forma.has(t)) this.forma.set(t, bruta.toLowerCase());
      }
    }
    for (const [t, p] of acumulado) {
      if (!this.mapa.has(t)) this.mapa.set(t, new Map());
      // log suaviza termos repetidos muitas vezes no corpo
      this.mapa.get(t).set(d.id, 1 + Math.log(1 + p));
    }
  };

  /** candidatos do vocabulário para um termo da consulta */
  Indice.prototype._candidatos = function (qt, ultimo) {
    const out = [];
    if (this.mapa.has(qt)) out.push({ t: qt, f: 1, dist: 0 });
    const maxDist = qt.length >= 7 ? 2 : qt.length >= 4 ? 1 : 0;
    for (const v of this.vocab) {
      if (v === qt) continue;
      if (ultimo && qt.length >= 2 && v.startsWith(qt)) { out.push({ t: v, f: 0.75, dist: 0, prefixo: true }); continue; }
      if (maxDist && Math.abs(v.length - qt.length) <= maxDist) {
        const d = distancia(qt, v, maxDist);
        if (d <= maxDist) out.push({ t: v, f: d === 1 ? 0.62 : 0.4, dist: d });
      }
    }
    return out;
  };

  /**
   * Busca. Retorna { resultados:[{doc, score, termos:Set}], correcoes:[{digitado, sugerido}] }
   * Semântica E (todos os termos), com recuo para OU se nada for encontrado.
   */
  Indice.prototype.buscar = function (consulta) {
    const qts = tokens(consulta);
    if (!qts.length) return { resultados: [], correcoes: [], termos: [] };
    const porTermo = [];
    const correcoes = [];
    qts.forEach((qt, i) => {
      const ultimo = i === qts.length - 1 && !/\s$/.test(consulta);
      const cands = this._candidatos(qt, ultimo);
      const docs = new Map(); // id -> {s, termos}
      for (const c of cands) {
        for (const [id, peso] of this.mapa.get(c.t)) {
          const s = peso * c.f;
          const atual = docs.get(id);
          if (!atual) docs.set(id, { s, termos: new Set([c.t]) });
          else { atual.termos.add(c.t); if (s > atual.s) atual.s = s; }
        }
      }
      porTermo.push(docs);
      const exato = cands.some(c => c.dist === 0 && !c.prefixo);
      const temPrefixo = cands.some(c => c.prefixo);
      if (!exato && !temPrefixo) {
        const melhor = cands.filter(c => c.dist > 0)
          .sort((a, b) => a.dist - b.dist || this.mapa.get(b.t).size - this.mapa.get(a.t).size)[0];
        if (melhor) correcoes.push({ digitado: qt, sugerido: this.forma.get(melhor.t) || melhor.t });
      }
    });

    const juntar = (modoE) => {
      const total = new Map();
      porTermo.forEach((docs) => {
        for (const [id, r] of docs) {
          const a = total.get(id) || { s: 0, n: 0, termos: new Set() };
          a.s += r.s; a.n += 1; r.termos.forEach(t => a.termos.add(t));
          total.set(id, a);
        }
      });
      const out = [];
      for (const [id, a] of total) {
        if (modoE && a.n < porTermo.length) continue;
        const doc = this.docs.find(d => d.id === id);
        out.push({ doc, score: a.s * (a.n / porTermo.length), termos: a.termos });
      }
      return out.sort((x, y) => y.score - x.score);
    };
    let resultados = juntar(true);
    let parcial = false;
    if (!resultados.length && porTermo.length > 1) { resultados = juntar(false); parcial = resultados.length > 0; }
    return { resultados, correcoes, parcial, termos: qts };
  };

  // ------------------------------------------------------------- destaque
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /** escapa e envolve em <mark> as palavras cuja forma normalizada está no conjunto de termos */
  function destacar(texto, termos) {
    const s = String(texto || "");
    if (!termos || !termos.size) return esc(s);
    let out = "", ultimo = 0;
    s.replace(RE_PALAVRA, (w, pos) => {
      const t = stem(norm(w));
      if (termos.has(t)) {
        out += esc(s.slice(ultimo, pos)) + "<mark>" + esc(w) + "</mark>";
        ultimo = pos + w.length;
      }
      return w;
    });
    return out + esc(s.slice(ultimo));
  }

  /** trecho do corpo com mais termos encontrados */
  function trecho(puro, termos, tam) {
    tam = tam || 190;
    const frases = puro.split(/(?<=[.!?])\s+/);
    let melhor = frases[0] || "", nota = -1;
    for (const f of frases) {
      let n = 0;
      (f.match(RE_PALAVRA) || []).forEach(w => { if (termos.has(stem(norm(w)))) n++; });
      if (n > nota) { nota = n; melhor = f; }
    }
    if (melhor.length > tam) melhor = melhor.slice(0, tam).replace(/\s+\S*$/, "") + "…";
    return destacar(melhor, termos);
  }

  // -------------------------------------------------------------- Markdown
  function inline(t) {
    let s = esc(t);
    const codigos = [];
    s = s.replace(/`([^`]+)`/g, (_, c) => { codigos.push(c); return "\u0000" + (codigos.length - 1) + "\u0000"; });
    s = s.replace(/\[\[([^\]]+)\]\]/g, "<kbd>$1</kbd>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, txt, url) => {
      const seguro = /^(#|https?:\/\/|mailto:)/.test(url) ? url : "#";
      const ext = /^https?:/.test(seguro) ? ' target="_blank" rel="noopener"' : "";
      return '<a href="' + seguro + '"' + ext + ">" + txt + "</a>";
    });
    s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => "<code>" + codigos[+i] + "</code>");
    return s;
  }

  function slugTitulo(t) {
    return norm(t).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "secao";
  }

  const ROTULOS = { dica: "Dica", aviso: "Atenção", importante: "Importante" };

  /** Markdown -> { html, toc:[{id, texto, nivel}] } */
  function markdown(md, ilustrar) {
    const linhas = String(md || "").replace(/\r/g, "").split("\n");
    const html = [], toc = [], usados = {};
    let i = 0;
    const para = [];
    const fecharPara = () => { if (para.length) { html.push("<p>" + inline(para.join(" ")) + "</p>"); para.length = 0; } };

    while (i < linhas.length) {
      const l = linhas[i];
      // bloco de código
      let m = l.match(/^~~~\s*([\w+-]*)\s*$/);
      if (m) {
        fecharPara();
        const lang = m[1] || "texto";
        const buf = [];
        i++;
        while (i < linhas.length && !/^~~~\s*$/.test(linhas[i])) { buf.push(linhas[i]); i++; }
        i++;
        html.push('<div class="codigo"><div class="codigo-topo"><span>' + esc(lang) +
          '</span><button type="button" class="copiar" data-copiar>Copiar</button></div><pre><code>' +
          esc(buf.join("\n")) + "</code></pre></div>");
        continue;
      }
      // títulos
      m = l.match(/^(#{2,3})\s+(.+)$/);
      if (m) {
        fecharPara();
        const nivel = m[1].length, texto = m[2].trim();
        let id = slugTitulo(texto);
        usados[id] = (usados[id] || 0) + 1;
        if (usados[id] > 1) id += "-" + usados[id];
        toc.push({ id, texto, nivel });
        html.push("<h" + nivel + ' id="' + id + '">' + inline(texto) + "</h" + nivel + ">");
        i++; continue;
      }
      // imagem ilustrativa
      m = l.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
      if (m) {
        fecharPara();
        const alvo = m[2];
        let corpo = "";
        if (alvo.startsWith("ilustracao:") && ilustrar) corpo = ilustrar(alvo.slice(11));
        if (!corpo) corpo = '<div class="fig-vazia">Ilustração: ' + esc(alvo) + "</div>";
        html.push('<figure class="ilustracao">' + corpo + "<figcaption>" + inline(m[1]) + "</figcaption></figure>");
        i++; continue;
      }
      // aviso / dica
      m = l.match(/^>\s*\[!(dica|aviso|importante)\]\s*(.*)$/i);
      if (m) {
        fecharPara();
        const tipo = m[1].toLowerCase();
        const titulo = m[2] || ROTULOS[tipo];
        const buf = [];
        i++;
        while (i < linhas.length && /^>/.test(linhas[i])) { buf.push(linhas[i].replace(/^>\s?/, "")); i++; }
        html.push('<aside class="aviso aviso-' + tipo + '"><div class="aviso-icone" aria-hidden="true"></div><div><strong class="aviso-titulo">' +
          esc(ROTULOS[tipo]) + (m[2] ? " · " + inline(titulo) : "") + "</strong><p>" + inline(buf.join(" ")) + "</p></div></aside>");
        continue;
      }
      // citação simples
      if (/^>\s?/.test(l)) {
        fecharPara();
        const buf = [];
        while (i < linhas.length && /^>/.test(linhas[i])) { buf.push(linhas[i].replace(/^>\s?/, "")); i++; }
        html.push("<blockquote><p>" + inline(buf.join(" ")) + "</p></blockquote>");
        continue;
      }
      // tabela
      if (/^\|.*\|\s*$/.test(l) && i + 1 < linhas.length && /^\|[\s:|-]+\|\s*$/.test(linhas[i + 1])) {
        fecharPara();
        const cel = (row) => row.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
        const cab = cel(l);
        i += 2;
        const rows = [];
        while (i < linhas.length && /^\|.*\|\s*$/.test(linhas[i])) { rows.push(cel(linhas[i])); i++; }
        html.push('<div class="tabela-rolagem"><table><thead><tr>' + cab.map(c => "<th>" + inline(c) + "</th>").join("") +
          "</tr></thead><tbody>" + rows.map(r => "<tr>" + r.map((c, k) => '<td data-rotulo="' + esc(cab[k] || "") + '">' + inline(c) + "</td>").join("") + "</tr>").join("") +
          "</tbody></table></div>");
        continue;
      }
      // lista numerada = passos
      if (/^\s*\d+\.\s+/.test(l)) {
        fecharPara();
        const itens = [];
        while (i < linhas.length && /^\s*\d+\.\s+/.test(linhas[i])) { itens.push(linhas[i].replace(/^\s*\d+\.\s+/, "")); i++; }
        html.push('<ol class="passos">' + itens.map(t => "<li><div>" + inline(t) + "</div></li>").join("") + "</ol>");
        continue;
      }
      // lista simples
      if (/^\s*[-*]\s+/.test(l)) {
        fecharPara();
        const itens = [];
        while (i < linhas.length && /^\s*[-*]\s+/.test(linhas[i])) { itens.push(linhas[i].replace(/^\s*[-*]\s+/, "")); i++; }
        html.push("<ul>" + itens.map(t => "<li>" + inline(t) + "</li>").join("") + "</ul>");
        continue;
      }
      if (/^\s*$/.test(l)) { fecharPara(); i++; continue; }
      para.push(l.trim());
      i++;
    }
    fecharPara();
    return { html: html.join("\n"), toc };
  }

  window.Motor = { norm, stem, tokens, distancia, textoPuro, Indice, destacar, trecho, markdown, esc, slugTitulo };
})();

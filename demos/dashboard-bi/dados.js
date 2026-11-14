/* Gerador de dados fictícios da Distribuidora Rio Claro (marca fictícia).
   Determinístico (mesma semente = mesmos números). Gera 24 meses de orçamentos e pedidos
   (nov/2024 a out/2026): 12 meses analisados + 12 meses anteriores para comparação.
   Sazonalidade: dezembro forte (festas), bebidas sobem no verão e no Carnaval,
   frios sobem nas festas, sábado meio período, domingo fechado, crescimento anual de ~9%. */
(function () {
  'use strict';
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var R = rng(20261031);
  function poisson(l) { if (l > 40) { var g = Math.round(l + Math.sqrt(l) * (R() + R() + R() - 1.5) * 2); return Math.max(0, g); } var L = Math.exp(-l), k = 0, p = 1; do { k++; p *= R(); } while (p > L); return k - 1; }
  function pick(w) { var s = 0, i; for (i = 0; i < w.length; i++) s += w[i]; var x = R() * s; for (i = 0; i < w.length; i++) { x -= w[i]; if (x <= 0) return i; } return w.length - 1; }

  var regioes = ['Capital', 'Interior Norte', 'Interior Sul', 'Litoral', 'Serra'];
  var filiais = [
    { nome: 'CD Capital', r: 0, base: 13 },
    { nome: 'Atacado Centro', r: 0, base: 8 },
    { nome: 'CD Interior Norte', r: 1, base: 9 },
    { nome: 'CD Interior Sul', r: 2, base: 8 },
    { nome: 'CD Litoral', r: 3, base: 6 },
    { nome: 'Filial Serra', r: 4, base: 4 }
  ];
  var vendedores = [
    { nome: 'Ana Paula Ribeiro', f: 0, conv: 0.52, tk: 1.08 },
    { nome: 'Marcos Teixeira', f: 0, conv: 0.44, tk: 1.00 },
    { nome: 'Juliana Prado', f: 0, conv: 0.47, tk: 0.94 },
    { nome: 'Rafael Monteiro', f: 1, conv: 0.41, tk: 1.12 },
    { nome: 'Camila Souza', f: 1, conv: 0.49, tk: 0.90 },
    { nome: 'Thiago Andrade', f: 2, conv: 0.46, tk: 1.03 },
    { nome: 'Priscila Gomes', f: 2, conv: 0.50, tk: 0.97 },
    { nome: 'Bruno Carvalho', f: 3, conv: 0.39, tk: 1.05 },
    { nome: 'Letícia Martins', f: 3, conv: 0.48, tk: 0.98 },
    { nome: 'Diego Fontes', f: 4, conv: 0.45, tk: 1.06 },
    { nome: 'Renata Lopes', f: 5, conv: 0.53, tk: 0.92 }
  ];
  var categorias = ['Bebidas', 'Mercearia', 'Limpeza', 'Higiene', 'Frios'];
  var catPeso = [0.30, 0.32, 0.15, 0.12, 0.11];
  var catMargem = [0.22, 0.17, 0.28, 0.31, 0.19];
  // fator por mês (0 = jan) para cada categoria
  var sazCat = [
    [1.25, 1.30, 1.05, 0.95, 0.88, 0.80, 0.80, 0.88, 0.98, 1.08, 1.18, 1.42],
    [0.95, 0.92, 1.02, 1.00, 1.02, 1.00, 1.02, 1.03, 1.00, 1.03, 1.08, 1.22],
    [0.98, 0.96, 1.02, 1.00, 1.00, 0.98, 1.00, 1.02, 1.03, 1.02, 1.04, 1.08],
    [0.97, 0.95, 1.00, 1.00, 1.03, 1.06, 1.06, 1.02, 1.00, 1.00, 1.03, 1.10],
    [0.92, 0.90, 0.98, 1.02, 1.00, 1.10, 1.04, 0.98, 0.98, 1.02, 1.12, 1.50]
  ];
  var sazGeral = [0.90, 0.88, 1.00, 0.97, 1.00, 0.98, 1.00, 1.02, 1.00, 1.05, 1.10, 1.24];
  var produtos = [
    ['Refrigerante cola 2 L (fardo 6)', 0, 46], ['Água mineral 500 ml (fardo 12)', 0, 19], ['Suco de uva integral 1 L (cx 12)', 0, 142],
    ['Cerveja lata 350 ml (fardo 12)', 0, 54], ['Energético 250 ml (fardo 24)', 0, 168], ['Chá gelado 1,5 L (fardo 6)', 0, 38],
    ['Arroz tipo 1 5 kg (fardo 6)', 1, 168], ['Feijão carioca 1 kg (fardo 10)', 1, 79], ['Óleo de soja 900 ml (cx 20)', 1, 156],
    ['Café torrado 500 g (cx 20)', 1, 318], ['Açúcar cristal 5 kg (fardo 6)', 1, 112], ['Macarrão espaguete 500 g (fardo 20)', 1, 74],
    ['Detergente 500 ml (cx 24)', 2, 52], ['Sabão em pó 1,6 kg (cx 10)', 2, 189], ['Água sanitária 2 L (cx 6)', 2, 36],
    ['Desinfetante 2 L (cx 6)', 2, 48], ['Esponja dupla face (cx 60)', 2, 63], ['Amaciante 2 L (cx 6)', 2, 71],
    ['Papel higiênico 12 rolos (fardo 4)', 3, 88], ['Sabonete 85 g (cx 72)', 3, 151], ['Creme dental 90 g (cx 48)', 3, 172],
    ['Shampoo 350 ml (cx 12)', 3, 118], ['Desodorante aerosol (cx 12)', 3, 134], ['Fralda infantil G (fardo 4)', 3, 216],
    ['Queijo muçarela (peça 4 kg)', 4, 152], ['Presunto cozido (peça 3,5 kg)', 4, 118], ['Margarina 500 g (cx 12)', 4, 84],
    ['Iogurte 170 g (cx 24)', 4, 61], ['Requeijão 200 g (cx 24)', 4, 139], ['Mortadela (peça 5 kg)', 4, 89]
  ].map(function (p, i) { return { nome: p[0], k: p[1], preco: p[2], marg: catMargem[p[1]] + ((i * 37) % 9 - 4) / 100, peso: 0.6 + ((i * 53) % 10) / 10 }; });
  var prodPorCat = categorias.map(function (_, k) { return produtos.map(function (p, i) { return p.k === k ? i : -1; }).filter(function (i) { return i >= 0; }); });

  var pref = ['Mercado', 'Supermercado', 'Mercearia', 'Empório', 'Atacadinho', 'Padaria', 'Minimercado', 'Armazém'];
  var suf = ['Bom Preço', 'São Jorge', 'Andorinha', 'Santa Luzia', 'do Bairro', 'Primavera', 'Estrela', 'Bela Vista', 'Ipê', 'Três Irmãos', 'Popular', 'Nova Era', 'Jardim', 'do Povo', 'Central', 'Real', 'Paraíso', 'Boa Esperança', 'Vitória', 'Sol Nascente', 'Recanto', 'Pinheiral', 'Dois Rios', 'Aurora'];
  var clientes = [], cliPorFilial = filiais.map(function () { return []; });
  filiais.forEach(function (f, fi) {
    var n = 18 + f.base * 3;
    for (var i = 0; i < n; i++) {
      var nome = pref[Math.floor(R() * pref.length)] + ' ' + suf[Math.floor(R() * suf.length)];
      cliPorFilial[fi].push(clientes.length);
      clientes.push({ nome: nome + ' ' + (fi + 1) + String(i + 1).padStart(2, '0'), f: fi, risco: R() < 0.12 ? 0.10 + R() * 0.12 : 0.006 + R() * 0.03, peso: 0.3 + R() * 1.7 });
    }
  });
  // remove o código do fim do nome, mantendo nomes únicos e legíveis
  var vistos = {};
  clientes.forEach(function (c) { var base = c.nome.replace(/ \d+$/, ''); vistos[base] = (vistos[base] || 0) + 1; c.nome = vistos[base] > 1 ? base + ' ' + ['II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][Math.min(vistos[base] - 2, 8)] : base; });

  var INICIO = new Date(2024, 10, 1), FIM = new Date(2026, 10, 1); // fim exclusivo
  var DIA = 86400000, nDias = Math.round((FIM - INICIO) / DIA);
  var horasSemana = [3, 7, 10, 10, 8, 4, 5, 8, 9, 7, 5, 2], horasSab = [4, 9, 10, 8, 5, 2];
  var reg = [], id = 48210;
  for (var d = 0; d < nDias; d++) {
    var dt = new Date(INICIO.getFullYear(), INICIO.getMonth(), INICIO.getDate() + d);
    var dow = dt.getDay(); if (dow === 0) continue;
    var m = dt.getMonth(), anos = d / 365;
    var fdia = (dow === 6 ? 0.42 : (dow === 1 ? 1.1 : 1)) * sazGeral[m] * (1 + 0.09 * anos);
    if (m === 1 && dt.getDate() >= 12 && dt.getDate() <= 18) fdia *= 0.85; // semana de Carnaval: menos dias úteis
    for (var fi = 0; fi < filiais.length; fi++) {
      var f = filiais[fi], extraLit = (fi === 4 && (m <= 1 || m === 11)) ? 1.35 : 1;
      var nOrc = poisson(f.base * fdia * extraLit / 0.47);
      var vends = vendedores.map(function (v, i) { return v.f === fi ? i : -1; }).filter(function (i) { return i >= 0; });
      var cw = categorias.map(function (_, k) { return catPeso[k] * sazCat[k][m] * (k === 0 ? extraLit : 1); });
      for (var o = 0; o < nOrc; o++) {
        var vi = vends[Math.floor(R() * vends.length)], v = vendedores[vi];
        var k = pick(cw), pl = prodPorCat[k], pi = pl[pick(pl.map(function (i) { return produtos[i].peso; }))], p = produtos[pi];
        var ci = cliPorFilial[fi][pick(cliPorFilial[fi].map(function (i) { return clientes[i].peso; }))];
        var q = Math.max(2, Math.round((4 + R() * 22) * v.tk * (0.6 + clientes[ci].peso * 0.4) * (240 / (p.preco + 60))));
        var preco = p.preco * (1 + 0.045 * anos) * (0.97 + R() * 0.06);
        var val = Math.round(q * preco * 100) / 100;
        var mg = p.marg + (R() - 0.5) * 0.04 - (q > 30 ? 0.015 : 0);
        var h = dow === 6 ? 7 + pick(horasSab) : 7 + pick(horasSemana);
        var idade = nDias - d, st = 0, atr = false;
        if (R() < v.conv) {
          st = 1;
          if (R() < 0.955) {
            st = 2;
            if (idade > 2 && R() < 0.985) {
              st = 3;
              if (idade > 30) {
                var risco = clientes[ci].risco * (idade > 150 ? 0.55 : 1) * (fi === 3 ? 1.35 : 1);
                if (R() < risco) atr = true; else st = 4;
              }
            }
          }
        }
        reg.push({ id: st ? id++ : 0, d: d, f: fi, r: f.r, v: vi, c: ci, p: pi, k: k, q: q, val: val, cus: Math.round(val * (1 - mg) * 100) / 100, h: h, w: dow, st: st, atr: atr });
      }
    }
  }
  window.DADOS = { regioes: regioes, filiais: filiais, vendedores: vendedores, categorias: categorias, produtos: produtos, clientes: clientes, inicio: INICIO, fim: FIM, nDias: nDias, reg: reg };
})();

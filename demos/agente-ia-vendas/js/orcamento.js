/* Monta o HTML do orçamento para a janela de impressão (Salvar como PDF). */
(function (g) {
  'use strict';
  const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function htmlOrcamento(o, hoje) {
    hoje = hoje || new Date();
    const val = new Date(hoje); val.setDate(val.getDate() + o.validade_dias);
    const d = (x) => x.toLocaleDateString('pt-BR');
    const linhas = o.itens.map((i) => '<tr><td><code>' + esc(i.sku) + '</code></td><td>' + esc(i.nome) + '</td><td class="n">' + i.qtd.toLocaleString('pt-BR') + ' ' + esc(i.qtd > 1 && i.unidade !== 'm³' ? (i.unidade === 'unidade' ? 'unidades' : i.unidade + 's') : i.unidade) + '</td><td class="n">' + brl(i.preco) + '</td><td class="n">' + brl(i.total) + '</td></tr>').join('');
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>' + esc(o.numero) + ' · Casa & Obra</title>' +
      '<style>@page{size:A4;margin:16mm}*{box-sizing:border-box}body{font:13px/1.5 Manrope,Segoe UI,Arial,sans-serif;color:#1f2a30;margin:0;padding:28px}' +
      '.top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #b9532c;padding-bottom:14px}' +
      '.m{display:flex;gap:12px;align-items:center}.m b{font:400 26px Georgia,serif}.m small{display:block;color:#5b676d;font-size:11px}' +
      '.num{text-align:right}.num b{display:block;font:600 18px Consolas,monospace}.num span{color:#5b676d;font-size:12px}' +
      'h2{font:400 20px Georgia,serif;margin:22px 0 8px}table{width:100%;border-collapse:collapse}th{text-align:left;background:#efe9de;font:600 10.5px Consolas,monospace;text-transform:uppercase;letter-spacing:.05em;padding:7px 8px}' +
      'td{padding:7px 8px;border-bottom:1px solid #e6dfd2}td.n,th.n{text-align:right;white-space:nowrap}code{font-size:11px;color:#5b676d}' +
      '.tot{margin-left:auto;width:300px;margin-top:12px}.tot div{display:flex;justify-content:space-between;padding:4px 0}.tot .g{border-top:2px solid #1f2a30;margin-top:4px;padding-top:8px;font-size:17px;font-weight:700}' +
      '.obs{margin-top:26px;padding:12px 14px;background:#f6f2ea;border-radius:8px;font-size:12px;color:#4b5961}.obs li{margin:2px 0}' +
      '.rod{margin-top:28px;font-size:10.5px;color:#7d8a90;text-align:center;border-top:1px solid #e6dfd2;padding-top:10px}' +
      '.bt{position:fixed;bottom:16px;right:16px;box-shadow:0 4px 14px rgba(0,0,0,.2);padding:9px 16px;background:#b9532c;color:#fff;border:0;border-radius:8px;font:600 13px sans-serif;cursor:pointer}@media print{.bt{display:none}body{padding:0}}</style></head><body>' +
      '<button class="bt" onclick="print()">Imprimir / salvar PDF</button>' +
      '<div class="top"><div class="m"><svg width="44" height="44" viewBox="0 0 30 30"><rect width="30" height="30" rx="7" fill="#1f2a30"/><path d="M6 15 15 7l9 8v8H6z" fill="#b9532c"/><path d="M6 19h18M6 23h18M11 15v8M19 19v4" stroke="#f3eee4" stroke-width="1.3"/></svg>' +
      '<div><b>Casa &amp; Obra</b><small>Materiais de construção · marca fictícia</small></div></div>' +
      '<div class="num"><b>' + esc(o.numero) + '</b><span>Emitido em ' + d(hoje) + ' · válido até ' + d(val) + '</span></div></div>' +
      '<h2>Orçamento</h2><table><thead><tr><th>Código</th><th>Produto</th><th class="n">Qtd.</th><th class="n">Unitário</th><th class="n">Total</th></tr></thead><tbody>' + linhas + '</tbody></table>' +
      '<div class="tot"><div><span>Subtotal</span><span>' + brl(o.subtotal) + '</span></div>' +
      (o.desconto ? '<div><span>Desconto (' + o.desconto_percentual + '%)</span><span>− ' + brl(o.desconto) + '</span></div>' : '') +
      '<div><span>Frete' + (o.cep ? ' (CEP ' + esc(o.cep) + ')' : '') + '</span><span>' + (o.semFrete ? 'a calcular' : (o.frete ? brl(o.frete) : 'grátis')) + '</span></div>' +
      '<div class="g"><span>Total</span><span>' + brl(o.total) + '</span></div></div>' +
      '<div class="obs"><b>Condições</b><ul><li>Preços válidos por ' + o.validade_dias + ' dias, sujeitos à disponibilidade de estoque.</li><li>Pagamento por PIX ou cartão. Entrega de segunda a sábado, em janelas de manhã ou tarde.</li><li>Material conferido na entrega. Avarias devem ser informadas no ato.</li></ul></div>' +
      '<div class="rod">Documento gerado automaticamente pelo assistente de vendas · Projeto demonstrativo, dados fictícios</div>' +
      '</body></html>';
  }
  g.htmlOrcamento = htmlOrcamento;
})(typeof window !== 'undefined' ? window : globalThis);

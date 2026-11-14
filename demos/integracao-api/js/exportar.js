/**
 * exportar.js
 * Exporta os pedidos do ERP para CSV (puro, sem biblioteca) ou Excel (SheetJS via cdnjs, carregado só no clique).
 */
const SHEETJS = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

function linhasPedidos(pedidos) {
  return pedidos.map((p) => ({
    'Nº ERP': p.numero,
    'Pedido Marketplace X': p.pedido_externo,
    Data: new Date(p.data_pedido).toLocaleString('pt-BR'),
    Situação: p.situacao,
    Cliente: p.cliente.nome,
    CPF: p.cliente.cpf,
    Cidade: p.cliente.cidade,
    UF: p.cliente.uf,
    Itens: p.itens.reduce((s, i) => s + i.quantidade, 0),
    Subtotal: p.valores.subtotal,
    Frete: p.valores.frete,
    Desconto: p.valores.desconto,
    Total: p.valores.total,
    'Tarifa marketplace': p.valores.tarifa_marketplace,
    Pagamento: p.pagamento.forma,
    Transportadora: p.envio?.transportadora ?? '',
    Rastreio: p.envio?.rastreio ?? '',
  }));
}

function linhasItens(pedidos) {
  return pedidos.flatMap((p) => p.itens.map((i) => ({
    'Nº ERP': p.numero, SKU: i.sku, Descrição: i.descricao, Variação: i.variacao ?? '',
    Quantidade: i.quantidade, 'Valor unitário': i.valor_unitario, Total: i.total,
  })));
}

function baixar(blob, nome) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

const carimbo = () => new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');

/** CSV no padrão do Excel brasileiro: separador ";", vírgula decimal e BOM UTF-8. */
export function exportarCSV(pedidos) {
  const linhas = linhasPedidos(pedidos);
  if (!linhas.length) return false;
  const cab = Object.keys(linhas[0]);
  const cel = (v) => {
    const t = typeof v === 'number' ? v.toFixed(2).replace('.', ',') : String(v ?? '');
    return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const csv = [cab.join(';'), ...linhas.map((l) => cab.map((c) => cel(l[c])).join(';'))].join('\r\n');
  baixar(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), `pedidos-erp-leve-${carimbo()}.csv`);
  return true;
}

function carregarSheetJS() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return new Promise((ok, falha) => {
    const s = document.createElement('script');
    s.src = SHEETJS;
    s.onload = () => ok(window.XLSX);
    s.onerror = () => falha(new Error('Não foi possível carregar o SheetJS'));
    document.head.appendChild(s);
  });
}

/** Planilha com duas abas: Pedidos e Itens. */
export async function exportarExcel(pedidos) {
  if (!pedidos.length) return false;
  const XLSX = await carregarSheetJS();
  const wb = XLSX.utils.book_new();
  const abaPedidos = XLSX.utils.json_to_sheet(linhasPedidos(pedidos));
  abaPedidos['!cols'] = [10, 14, 18, 20, 22, 15, 16, 5, 6, 10, 9, 9, 10, 10, 16, 20, 18].map((w) => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, abaPedidos, 'Pedidos');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(linhasItens(pedidos)), 'Itens');
  XLSX.writeFile(wb, `pedidos-erp-leve-${carimbo()}.xlsx`);
  return true;
}

/**
 * repositorio-erp.js
 * "Banco" do ERP Leve em memória. Na versão real seria uma tabela no
 * PostgreSQL/MySQL do ERP ou a API do ERP do cliente.
 *
 * Idempotência: a chave é o id do pedido no marketplace (pedido_externo).
 * Gravar o mesmo pedido duas vezes nunca cria duplicado.
 */

// Assinatura do conteúdo: se nada mudou, não regrava (e não dispara nada no ERP).
// JSON com chaves em ordem alfabética, para a mesma informação gerar o mesmo texto.
function estavel(v) {
  if (Array.isArray(v)) return `[${v.map(estavel).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${estavel(v[k])}`).join(',')}}`;
  }
  return JSON.stringify(v ?? null);
}

function assinatura(obj) {
  const texto = estavel(obj);
  let h = 0x811c9dc5;                                // FNV-1a 32 bits
  for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16);
}

export class RepositorioERP {
  constructor() {
    this.pedidos = new Map();        // pedido_externo -> registro do ERP
    this.brutos = new Map();         // pedido_externo -> JSON original (auditoria)
    this.sequencia = 1040;
    this.cursor = null;              // maior last_updated já processado
    this.eventosVistos = new Set();  // ids de webhooks já tratados
  }

  // #region upsert
  /**
   * Grava ou atualiza um pedido normalizado.
   * @returns {'novo'|'atualizado'|'ignorado'}
   */
  salvar(pedidoERP, bruto) {
    const chave = pedidoERP.pedido_externo;
    const hash = assinatura(pedidoERP);
    const existente = this.pedidos.get(chave);

    if (existente && existente._hash === hash) return 'ignorado';

    const registro = {
      ...pedidoERP,
      numero: existente?.numero ?? `PV-${String(++this.sequencia).padStart(6, '0')}`,
      criado_no_erp: existente?.criado_no_erp ?? new Date().toISOString(),
      sincronizado_em: new Date().toISOString(),
      _hash: hash,
    };
    this.pedidos.set(chave, registro);
    this.brutos.set(chave, bruto);
    return existente ? 'atualizado' : 'novo';
  }
  // #endregion

  listar() {
    return [...this.pedidos.values()].sort((a, b) => b.data_pedido.localeCompare(a.data_pedido));
  }

  obter(chave) { return this.pedidos.get(chave); }
  obterBruto(chave) { return this.brutos.get(chave); }
}

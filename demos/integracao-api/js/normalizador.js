/**
 * normalizador.js
 * Converte o JSON do Marketplace X (inglês, snake_case, códigos próprios)
 * para o modelo do ERP Leve (português, campos fixos, valores conferidos).
 * Função pura: mesma entrada, mesma saída. Fácil de testar.
 */

// #region mapa-status
/** Situação do pedido no ERP a partir do status do marketplace. */
export const SITUACAO = {
  pending_payment: 'Aguardando pagamento',
  paid: 'Pago, a separar',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

const FORMA_PAGAMENTO = { pix: 'Pix', credit_card: 'Cartão de crédito', boleto: 'Boleto' };
// #endregion

const centavos = (v) => Math.round(Number(v || 0) * 100);
const reais = (c) => c / 100;
const formatarCPF = (d) => String(d || '').replace(/\D/g, '').padStart(11, '0')
  .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

// #region normalizar
/**
 * @param {object} pedido   GET /v1/orders/{id}
 * @param {object} cliente  GET /v1/customers/{buyer.id}
 * @param {object} [envio]  GET /v1/shipments/{shipping.id} (só quando já foi despachado)
 * @returns {object} pedido no formato do ERP Leve
 */
export function normalizarPedido(pedido, cliente, envio) {
  // Dinheiro em centavos durante a conta: evita 0,1 + 0,2 = 0,30000000000000004
  const itens = pedido.order_items.map((i) => ({
    sku: i.item.seller_sku,
    descricao: i.item.title,
    variacao: i.item.variation_attributes?.[0]?.value ?? null,
    quantidade: i.quantity,
    valor_unitario: i.unit_price,
    total: reais(centavos(i.unit_price) * i.quantity),
  }));

  const subtotal = itens.reduce((s, i) => s + centavos(i.total), 0);
  const frete = centavos(pedido.shipping_cost);
  const desconto = centavos(pedido.coupon?.amount);
  const total = subtotal + frete - desconto;
  const pagamento = pedido.payments?.[0] ?? {};

  const avisos = [];
  // Conferência: o total pago informado pelo marketplace bate com a soma dos itens?
  if (pedido.paid_amount && centavos(pedido.paid_amount) !== total) {
    avisos.push(`Total divergente: marketplace ${pedido.paid_amount}, ERP ${reais(total)}`);
  }

  return {
    origem: 'Marketplace X',
    pedido_externo: String(pedido.id),
    data_pedido: pedido.date_created,
    atualizado_na_origem: pedido.last_updated,
    situacao: SITUACAO[pedido.status] ?? 'Revisar',
    cliente: {
      nome: `${cliente.first_name} ${cliente.last_name}`.trim(),
      cpf: formatarCPF(cliente.billing_info?.doc_number),
      email: cliente.email,
      cidade: cliente.address?.city,
      uf: (cliente.address?.state || '').replace('BR-', ''),
      cep: cliente.address?.zip_code,
    },
    itens,
    pagamento: {
      forma: FORMA_PAGAMENTO[pagamento.payment_method_id] ?? pagamento.payment_method_id,
      parcelas: pagamento.installments ?? 1,
      aprovado_em: pagamento.date_approved ?? null,
    },
    valores: {
      subtotal: reais(subtotal),
      frete: reais(frete),
      desconto: reais(desconto),
      total: reais(total),
      tarifa_marketplace: reais(pedido.order_items.reduce((s, i) => s + centavos(i.sale_fee) * i.quantity, 0)),
    },
    envio: envio ? {
      transportadora: envio.carrier,
      rastreio: envio.tracking_number,
      despachado_em: envio.date_shipped,
      previsao: envio.estimated_delivery,
    } : null,
    avisos,
  };
}
// #endregion

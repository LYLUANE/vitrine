/**
 * mock-api.js
 * Simula a API REST do "Marketplace X" (marketplace fictício) dentro do navegador.
 *
 * O que ela imita de uma API de verdade:
 *  - autenticação OAuth "client_credentials" com token que expira;
 *  - listagem paginada de pedidos com filtro por data de atualização;
 *  - endpoints separados de clientes e envios;
 *  - limite de taxa (429 + cabeçalho Retry-After);
 *  - falhas ocasionais do servidor (500/503);
 *  - webhook "orders.created", às vezes entregue em duplicidade (como acontece
 *    nas plataformas reais, que garantem "pelo menos uma entrega").
 *
 * Nenhuma chamada sai do navegador. Os dados são gerados com semente fixa.
 */

const CLIENT_ID = 'demo-erp-leve';
const CLIENT_SECRET = 'segredo-de-demonstracao';

// ---------- gerador pseudoaleatório com semente (resultado sempre igual) ----------
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOMES = ['Camila', 'Rafael', 'Juliana', 'Thiago', 'Patrícia', 'Bruno', 'Larissa', 'Diego',
  'Fernanda', 'Gustavo', 'Aline', 'Marcelo', 'Beatriz', 'Leonardo', 'Renata', 'Vinícius', 'Tatiane', 'Caio'];
const SOBRENOMES = ['Rocha', 'Almeida', 'Siqueira', 'Moura', 'Teixeira', 'Barros', 'Lacerda', 'Pacheco',
  'Nogueira', 'Freitas', 'Campos', 'Duarte', 'Prado', 'Vasconcelos'];
const CIDADES = [['São Paulo', 'SP', '01310'], ['Campinas', 'SP', '13015'], ['Belo Horizonte', 'MG', '30130'],
  ['Curitiba', 'PR', '80010'], ['Porto Alegre', 'RS', '90010'], ['Recife', 'PE', '50010'],
  ['Salvador', 'BA', '40020'], ['Goiânia', 'GO', '74003'], ['Florianópolis', 'SC', '88010'],
  ['Botucatu', 'SP', '18600'], ['Fortaleza', 'CE', '60060'], ['Rio de Janeiro', 'RJ', '20040']];
const CATALOGO = [
  { id: 'MX-IT-30211', title: 'Caneca de cerâmica 350 ml', sku: 'CAN-350', variacoes: ['Azul', 'Areia', 'Verde'], preco: 49.9 },
  { id: 'MX-IT-30877', title: 'Jogo americano de linho (4 un.)', sku: 'JAM-LIN-4', variacoes: ['Cru', 'Grafite'], preco: 89.0 },
  { id: 'MX-IT-31402', title: 'Luminária de mesa articulada', sku: 'LUM-ART', variacoes: ['Preta', 'Branca'], preco: 159.9 },
  { id: 'MX-IT-31950', title: 'Organizador de bambu para gaveta', sku: 'ORG-BAM', variacoes: ['P', 'M', 'G'], preco: 64.5 },
  { id: 'MX-IT-32118', title: 'Garrafa térmica inox 750 ml', sku: 'GAR-INX-750', variacoes: ['Prata', 'Preta', 'Coral'], preco: 119.0 },
  { id: 'MX-IT-32604', title: 'Kit 3 potes herméticos de vidro', sku: 'POT-VID-3', variacoes: ['Padrão'], preco: 74.9 },
  { id: 'MX-IT-33025', title: 'Tábua de corte em madeira teca', sku: 'TAB-TECA', variacoes: ['Média', 'Grande'], preco: 98.0 },
  { id: 'MX-IT-33781', title: 'Vela aromática em lata 180 g', sku: 'VEL-180', variacoes: ['Alecrim', 'Baunilha', 'Capim-limão'], preco: 39.9 },
];
const METODOS = ['pix', 'credit_card', 'credit_card', 'pix', 'boleto'];
const TRANSPORTADORAS = ['Rota Leve Entregas', 'Expresso Fictício', 'Coleta X'];

const arred = (n) => Math.round(n * 100) / 100;
const iso = (ms) => new Date(ms).toISOString();
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export class MarketplaceXMock {
  /**
   * @param {object} opcoes
   * @param {number} [opcoes.semente]       semente dos dados
   * @param {number} [opcoes.qtdPedidos]    pedidos iniciais
   * @param {number} [opcoes.taxaFalha]     chance (0 a 1) de 500/503 por requisição
   * @param {number} [opcoes.limitePorSeg]  requisições aceitas por janela de 1 s
   */
  constructor({ semente = 2026, qtdPedidos = 34, taxaFalha = 0.07, limitePorSeg = 8 } = {}) {
    this.rnd = mulberry32(semente);
    this.taxaFalha = taxaFalha;
    this.limitePorSeg = limitePorSeg;
    this.janela = [];            // horários das últimas requisições (limite de taxa)
    this.tokens = new Map();     // token -> requisições restantes
    this.ouvintesWebhook = [];
    this.clientes = new Map();
    this.envios = new Map();
    this.pedidos = [];
    this.proximoPedido = 2000004801;
    this.proximoEvento = 1;
    this._semear(qtdPedidos);
  }

  // ---------------- dados ----------------
  _escolher(lista) { return lista[Math.floor(this.rnd() * lista.length)]; }

  _semear(qtd) {
    for (let i = 0; i < 16; i++) this._novoCliente();
    const agora = Date.now();
    for (let i = 0; i < qtd; i++) {
      // pedidos espalhados nas últimas 72 h, do mais antigo para o mais novo
      const criado = agora - (72 - (i * 70) / qtd) * 3600e3 - this.rnd() * 1800e3;
      this._novoPedido(criado);
    }
  }

  _novoCliente() {
    const id = 77100 + this.clientes.size * 7 + Math.floor(this.rnd() * 5);
    const nome = this._escolher(NOMES);
    const sobrenome = this._escolher(SOBRENOMES);
    const [cidade, uf, cep] = this._escolher(CIDADES);
    const doc = String(Math.floor(this.rnd() * 1e11)).padStart(11, '0');
    const cliente = {
      id,
      nickname: (nome.slice(0, 6) + '.' + sobrenome[0] + Math.floor(this.rnd() * 90 + 10)).toUpperCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, ''),
      first_name: nome,
      last_name: sobrenome,
      email: `${nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}.${id}@exemplo.mx`,
      phone: { area_code: '11', number: '9' + String(Math.floor(this.rnd() * 1e8)).padStart(8, '0') },
      billing_info: { doc_type: 'CPF', doc_number: doc },
      address: { city: cidade, state: `BR-${uf}`, zip_code: cep + '-' + String(Math.floor(this.rnd() * 999)).padStart(3, '0') },
    };
    this.clientes.set(id, cliente);
    return cliente;
  }

  _novoPedido(criadoMs, statusForcado) {
    const cliente = this._escolher([...this.clientes.values()]);
    const nItens = this.rnd() < 0.7 ? 1 : this.rnd() < 0.7 ? 2 : 3;
    const itens = [];
    for (let k = 0; k < nItens; k++) {
      const prod = this._escolher(CATALOGO);
      const variacao = this._escolher(prod.variacoes);
      const qtd = this.rnd() < 0.75 ? 1 : 2;
      itens.push({
        item: { id: prod.id, title: prod.title, seller_sku: `${prod.sku}-${variacao.slice(0, 3).toUpperCase()}`, variation_attributes: [{ name: 'Variação', value: variacao }] },
        quantity: qtd,
        unit_price: prod.preco,
        full_unit_price: prod.preco,
        sale_fee: arred(prod.preco * 0.13),
      });
    }
    const bruto = itens.reduce((s, it) => s + it.unit_price * it.quantity, 0);
    const frete = bruto > 199 ? 0 : arred(14.9 + Math.floor(this.rnd() * 9) * 1.5);
    const desconto = this.rnd() < 0.2 ? arred(bruto * 0.1) : 0;
    const total = arred(bruto + frete - desconto);

    const r = this.rnd();
    const status = statusForcado || (r < 0.08 ? 'cancelled' : r < 0.16 ? 'pending_payment' : r < 0.55 ? 'paid' : r < 0.82 ? 'shipped' : 'delivered');
    const id = this.proximoPedido++;
    const metodo = this._escolher(METODOS);
    const aprovado = status !== 'pending_payment' && status !== 'cancelled';

    const envioId = 41000000 + id % 100000;
    const pedido = {
      id,
      status,
      date_created: iso(criadoMs),
      last_updated: iso(criadoMs + 60e3 * (5 + Math.floor(this.rnd() * 50))),
      currency_id: 'BRL',
      buyer: { id: cliente.id, nickname: cliente.nickname },
      order_items: itens,
      payments: [{
        id: 90000000 + id % 1000000,
        payment_method_id: metodo,
        status: aprovado ? 'approved' : status === 'cancelled' ? 'refunded' : 'pending',
        installments: metodo === 'credit_card' ? (this.rnd() < 0.5 ? 1 : 3) : 1,
        transaction_amount: total,
        date_approved: aprovado ? iso(criadoMs + 120e3) : null,
      }],
      shipping: { id: envioId, logistic_type: this.rnd() < 0.6 ? 'drop_off' : 'cross_docking' },
      shipping_cost: frete,
      coupon: desconto ? { id: 'CUPOM10', amount: desconto } : null,
      total_amount: arred(bruto),
      paid_amount: aprovado ? total : 0,
      tags: aprovado ? ['paid'] : ['not_paid'],
    };
    this.pedidos.push(pedido);
    this._atualizarEnvio(pedido, criadoMs);
    return pedido;
  }

  _atualizarEnvio(pedido, baseMs) {
    const id = pedido.shipping.id;
    const anterior = this.envios.get(id);
    const statusEnvio = { pending_payment: 'pending', paid: 'ready_to_ship', shipped: 'shipped', delivered: 'delivered', cancelled: 'cancelled' }[pedido.status];
    const enviado = pedido.status === 'shipped' || pedido.status === 'delivered';
    this.envios.set(id, {
      id,
      order_id: pedido.id,
      status: statusEnvio,
      carrier: anterior?.carrier || this._escolher(TRANSPORTADORAS),
      service: 'Padrão',
      tracking_number: enviado ? (anterior?.tracking_number || `MX${String(pedido.id).slice(-7)}${Math.floor(this.rnd() * 90 + 10)}BR`) : null,
      date_shipped: enviado ? iso(baseMs + 20 * 3600e3) : null,
      estimated_delivery: iso(baseMs + 5 * 86400e3),
      receiver_address: this.clientes.get(pedido.buyer.id).address,
    });
  }

  /** De vez em quando um pedido pago é despachado: gera "atualizações" para a próxima sincronização. */
  _evoluir() {
    const pagos = this.pedidos.filter((p) => p.status === 'paid');
    if (!pagos.length || this.rnd() > 0.65) return;
    const p = this._escolher(pagos);
    p.status = 'shipped';
    p.last_updated = iso(Date.now());
    this._atualizarEnvio(p, Date.now() - 20 * 3600e3);
  }

  // ---------------- "servidor HTTP" ----------------

  /**
   * Ponto único de entrada, no formato de um fetch simplificado.
   * @returns {Promise<{status:number, headers:object, body:any, ms:number}>}
   */
  async request(method, caminho, { headers = {}, body = null } = {}) {
    const inicio = performance.now();
    await espera(50 + this.rnd() * 110);                         // latência de rede
    const resp = this._rotear(method, caminho, headers, body);
    return { ...resp, ms: Math.round(performance.now() - inicio) };
  }

  _rotear(method, caminho, headers, body) {
    const url = new URL(caminho, 'https://api.marketplace-x.exemplo');
    const rota = `${method} ${url.pathname}`;

    // 1) limite de taxa: janela deslizante de 1 segundo
    const agora = Date.now();
    this.janela = this.janela.filter((t) => agora - t < 1000);
    if (this.janela.length >= this.limitePorSeg) {
      return json(429, { error: 'too_many_requests', message: `Limite de ${this.limitePorSeg} req/s excedido` }, { 'retry-after': '1' });
    }
    this.janela.push(agora);

    // 2) falha intermitente do servidor
    if (this.rnd() < this.taxaFalha) {
      return this.rnd() < 0.5
        ? json(500, { error: 'internal_error', message: 'Erro inesperado. Tente novamente.' })
        : json(503, { error: 'service_unavailable', message: 'Serviço temporariamente indisponível' }, { 'retry-after': '2' });
    }

    // 3) autenticação
    if (rota === 'POST /oauth/token') {
      if (body?.client_id !== CLIENT_ID || body?.client_secret !== CLIENT_SECRET) {
        return json(401, { error: 'invalid_client' });
      }
      const token = 'MXDEMO-' + Math.floor(this.rnd() * 1e12).toString(36).toUpperCase();
      this.tokens.set(token, 22);                // vale por 22 requisições, para a expiração aparecer na demo
      return json(200, { access_token: token, token_type: 'bearer', expires_in: 21600, scope: 'orders.read customers.read shipments.read' });
    }
    const token = (headers.authorization || '').replace(/^Bearer\s+/i, '');
    const restante = this.tokens.get(token);
    if (!restante) return json(401, { error: 'invalid_token', message: 'Token ausente ou expirado' });
    if (restante <= 1) this.tokens.delete(token); else this.tokens.set(token, restante - 1);

    // 4) recursos
    if (rota === 'GET /v1/orders/search') return this._buscarPedidos(url.searchParams);
    let m;
    if ((m = url.pathname.match(/^\/v1\/orders\/(\d+)$/)) && method === 'GET') {
      const p = this.pedidos.find((x) => x.id === Number(m[1]));
      return p ? json(200, clone(p)) : json(404, { error: 'not_found' });
    }
    if ((m = url.pathname.match(/^\/v1\/customers\/(\d+)$/)) && method === 'GET') {
      const c = this.clientes.get(Number(m[1]));
      return c ? json(200, clone(c)) : json(404, { error: 'not_found' });
    }
    if ((m = url.pathname.match(/^\/v1\/shipments\/(\d+)$/)) && method === 'GET') {
      const e = this.envios.get(Number(m[1]));
      return e ? json(200, clone(e)) : json(404, { error: 'not_found' });
    }
    return json(404, { error: 'route_not_found', path: url.pathname });
  }

  _buscarPedidos(q) {
    const limite = Math.min(Number(q.get('limit') || 10), 50);
    const pagina = Math.max(Number(q.get('page') || 1), 1);
    const desde = q.get('updated_from');
    if (pagina === 1) this._evoluir();
    const filtrados = this.pedidos
      .filter((p) => !desde || p.last_updated > desde)
      .sort((a, b) => a.last_updated.localeCompare(b.last_updated));
    const total = filtrados.length;
    const fatia = filtrados.slice((pagina - 1) * limite, pagina * limite);
    return json(200, {
      results: clone(fatia),
      paging: { page: pagina, limit: limite, total, pages: Math.max(1, Math.ceil(total / limite)) },
    });
  }

  // ---------------- webhook ----------------

  /** Registra quem recebe as notificações (no mundo real, uma URL HTTPS do servidor). */
  onWebhook(fn) { this.ouvintesWebhook.push(fn); }

  /** Cria um pedido agora e dispara "orders.created". Em ~35% das vezes entrega o mesmo evento duas vezes. */
  simularNovoPedido() {
    const pedido = this._novoPedido(Date.now() - 4 * 60e3, 'paid');
    pedido.last_updated = iso(Date.now());
    const evento = {
      _id: 'evt_' + String(this.proximoEvento++).padStart(6, '0'),
      topic: 'orders.created',
      resource: `/v1/orders/${pedido.id}`,
      user_id: 5512033,
      attempts: 1,
      sent: iso(Date.now()),
    };
    const entregar = (e) => this.ouvintesWebhook.forEach((fn) => fn(clone(e)));
    setTimeout(() => entregar(evento), 250);
    if (this.rnd() < 0.35) setTimeout(() => entregar({ ...evento, attempts: 2 }), 1400);
    return pedido.id;
  }

  /** Ajusta a taxa de falhas (botão "API instável" no painel). */
  definirTaxaFalha(t) { this.taxaFalha = t; }
}

export const CREDENCIAIS_DEMO = { client_id: CLIENT_ID, client_secret: CLIENT_SECRET };

function json(status, body, headers = {}) {
  return { status, headers: { 'content-type': 'application/json', ...headers }, body };
}
function clone(o) { return JSON.parse(JSON.stringify(o)); }

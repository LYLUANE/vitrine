/**
 * conector.js
 * Conector Marketplace X -> ERP Leve.
 *
 * Responsabilidades:
 *  1. autenticar e renovar o token quando ele expira;
 *  2. buscar só o que mudou desde a última sincronização (cursor), página a página;
 *  3. repetir chamadas que falharam por motivo passageiro (429, 5xx) com backoff exponencial;
 *  4. enriquecer o pedido com cliente e envio e normalizar para o modelo do ERP;
 *  5. gravar sem duplicar (idempotência pelo id do pedido e pelo id do evento do webhook);
 *  6. registrar tudo em log estruturado.
 *
 * O mesmo código roda num servidor Node trocando `api.request` por `fetch`.
 */
import { normalizarPedido } from './normalizador.js';

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export class ConectorMarketplaceX {
  /**
   * @param {object} deps
   * @param {object} deps.api          cliente HTTP com request(method, path, {headers, body})
   * @param {object} deps.repositorio  RepositorioERP
   * @param {object} deps.log          Logger
   * @param {object} deps.credenciais  { client_id, client_secret }
   */
  constructor({ api, repositorio, log, credenciais, opcoes = {} }) {
    this.api = api;
    this.repo = repositorio;
    this.log = log;
    this.credenciais = credenciais;
    this.opcoes = { porPagina: 10, maxTentativas: 5, backoffBaseMs: 300, backoffMaxMs: 4000, ...opcoes };
    this.token = null;
    this.cacheClientes = new Map();
    this.ocupado = false;
    this.fila = [];                       // webhooks que chegaram durante uma sincronização
    this.ouvintes = [];
    this.totais = { requisicoes: 0, retries: 0, errosTratados: 0, falhasFinais: 0, duplicadosEvitados: 0 };
  }

  aoTerminar(fn) { this.ouvintes.push(fn); }

  // #region autenticar
  async autenticar() {
    this.log.info('Pedindo token de acesso (client_credentials)');
    const r = await this.chamar('POST', '/oauth/token', {
      grant_type: 'client_credentials', ...this.credenciais,
    }, { semToken: true });
    this.token = r.access_token;
    this.log.ok(`Token recebido: ${this.token.slice(0, 10)}… (escopo: ${r.scope})`);
  }
  // #endregion

  // #region chamar
  /**
   * Uma chamada HTTP com política de repetição.
   *  - 429: espera o tempo do cabeçalho Retry-After;
   *  - 500/502/503/504: backoff exponencial com variação aleatória (jitter);
   *  - 401: renova o token uma vez e tenta de novo;
   *  - outros 4xx: erro definitivo, não adianta repetir.
   */
  async chamar(method, caminho, body = null, { semToken = false } = {}) {
    const { maxTentativas, backoffBaseMs, backoffMaxMs } = this.opcoes;
    let renovouToken = false;

    for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
      if (!semToken && !this.token) await this.autenticar();
      const headers = semToken ? {} : { authorization: `Bearer ${this.token}` };

      this.totais.requisicoes++;
      const r = await this.api.request(method, caminho, { headers, body });
      this.log.registrar(r.status < 400 ? 'req' : 'aviso', `${method} ${caminho} → ${r.status}`, { ms: r.ms, status: r.status });

      if (r.status < 400) return r.body;

      if (r.status === 401 && !semToken && !renovouToken) {
        this.log.aviso('Token expirado. Renovando e repetindo a chamada');
        this.token = null; renovouToken = true; tentativa--;          // renovar não gasta tentativa
        this.totais.errosTratados++;
        continue;
      }

      const temporario = r.status === 429 || r.status >= 500;
      if (!temporario || tentativa === maxTentativas) {
        this.totais.falhasFinais++;
        throw new ErroAPI(r.status, r.body, caminho);
      }

      const retryAfter = Number(r.headers['retry-after']);
      const exponencial = Math.min(backoffMaxMs, backoffBaseMs * 2 ** (tentativa - 1));
      const jitter = exponencial * (0.8 + Math.random() * 0.4);
      const aguardar = retryAfter ? retryAfter * 1000 : Math.round(jitter);

      this.totais.retries++; this.totais.errosTratados++;
      this.log.registrar('retry', `${r.status} ${r.body?.error ?? ''}: nova tentativa ${tentativa + 1}/${maxTentativas} em ${aguardar} ms`, { status: r.status });
      await espera(aguardar);
    }
  }
  // #endregion

  // #region sincronizar
  /** Busca tudo que mudou desde o cursor e grava no ERP. */
  async sincronizar(tipo = 'manual') {
    if (this.ocupado) { this.log.aviso('Sincronização já em andamento, pedido ignorado'); return null; }
    this.ocupado = true;
    const exec = { tipo, inicio: Date.now(), novos: 0, atualizados: 0, ignorados: 0, falhas: 0, paginas: 0, status: 'ok' };
    const antes = { ...this.totais };
    const desde = this.repo.cursor;
    this.log.info(`Sincronização ${tipo} iniciada${desde ? ` (mudanças desde ${hora(desde)})` : ' (carga inicial)'}`);

    let maiorAtualizacao = desde;
    try {
      let pagina = 1, paginas = 1;
      do {
        const q = new URLSearchParams({ page: pagina, limit: this.opcoes.porPagina, sort: 'updated_asc' });
        if (desde) q.set('updated_from', desde);
        const resp = await this.chamar('GET', `/v1/orders/search?${q}`);
        paginas = resp.paging.pages;
        exec.paginas++;
        this.log.info(`Página ${pagina}/${paginas}: ${resp.results.length} pedido(s) de ${resp.paging.total}`);

        for (const pedido of resp.results) {
          try {
            const resultado = await this.processarPedido(pedido);
            exec[resultado === 'novo' ? 'novos' : resultado === 'atualizado' ? 'atualizados' : 'ignorados']++;
            if (!maiorAtualizacao || pedido.last_updated > maiorAtualizacao) maiorAtualizacao = pedido.last_updated;
          } catch (e) {
            // um pedido com problema não derruba a sincronização inteira
            exec.falhas++;
            this.log.erro(`Pedido ${pedido.id} ficou para a próxima rodada: ${e.message}`);
          }
        }
        pagina++;
      } while (pagina <= paginas);

      // o cursor só avança se não sobrou pedido com falha (senão ele seria pulado)
      if (!exec.falhas) this.repo.cursor = maiorAtualizacao;
      if (exec.falhas) exec.status = 'parcial';
    } catch (e) {
      exec.status = 'erro';
      this.log.erro(`Sincronização interrompida: ${e.message}. O cursor não avançou; nada se perde.`);
    } finally {
      this.ocupado = false;
    }

    this.fecharExecucao(exec, antes);
    await this.esvaziarFila();
    return exec;
  }
  // #endregion

  // #region processar
  /** Enriquece com cliente (com cache) e envio, normaliza e grava. */
  async processarPedido(pedido) {
    let cliente = this.cacheClientes.get(pedido.buyer.id);
    if (!cliente) {
      cliente = await this.chamar('GET', `/v1/customers/${pedido.buyer.id}`);
      this.cacheClientes.set(pedido.buyer.id, cliente);
    }
    const despachado = pedido.status === 'shipped' || pedido.status === 'delivered';
    const envio = despachado ? await this.chamar('GET', `/v1/shipments/${pedido.shipping.id}`) : null;

    const pedidoERP = normalizarPedido(pedido, cliente, envio);
    pedidoERP.avisos.forEach((a) => this.log.aviso(`Pedido ${pedido.id}: ${a}`));

    const resultado = this.repo.salvar(pedidoERP, { pedido, cliente, envio });
    const reg = this.repo.obter(pedidoERP.pedido_externo);
    if (resultado === 'novo') this.log.ok(`Pedido ${pedido.id} gravado como ${reg.numero} (${pedidoERP.situacao})`);
    else if (resultado === 'atualizado') this.log.ok(`Pedido ${pedido.id} atualizado em ${reg.numero}: ${pedidoERP.situacao}`);
    else { this.totais.duplicadosEvitados++; this.log.info(`Pedido ${pedido.id} já está no ERP sem mudança: gravação ignorada`); }
    return resultado;
  }
  // #endregion

  // #region webhook
  /**
   * Recebe a notificação "orders.created". A plataforma pode reenviar o mesmo
   * evento; o id do evento e a chave do pedido garantem que nada duplica.
   */
  async receberWebhook(evento) {
    this.log.info(`Webhook ${evento.topic} recebido (${evento._id}, tentativa ${evento.attempts})`);
    if (this.repo.eventosVistos.has(evento._id)) {
      this.totais.duplicadosEvitados++;
      this.log.aviso(`Evento ${evento._id} repetido: respondido 200 e descartado (idempotência)`);
      return;
    }
    this.repo.eventosVistos.add(evento._id);
    if (this.ocupado) { this.fila.push(evento); this.log.info('Sincronização em andamento: evento na fila'); return; }
    await this.tratarEvento(evento);
  }

  async tratarEvento(evento) {
    this.ocupado = true;
    const exec = { tipo: 'webhook', inicio: Date.now(), novos: 0, atualizados: 0, ignorados: 0, falhas: 0, paginas: 0, status: 'ok' };
    const antes = { ...this.totais };
    try {
      const pedido = await this.chamar('GET', evento.resource);
      const r = await this.processarPedido(pedido);
      exec[r === 'novo' ? 'novos' : r === 'atualizado' ? 'atualizados' : 'ignorados']++;
    } catch (e) {
      exec.status = 'erro'; exec.falhas++;
      this.log.erro(`Webhook ${evento._id} não processado: ${e.message}. A sincronização agendada recupera o pedido.`);
    } finally {
      this.ocupado = false;
    }
    this.fecharExecucao(exec, antes);
    await this.esvaziarFila();
  }

  async esvaziarFila() {
    while (this.fila.length) await this.tratarEvento(this.fila.shift());
  }
  // #endregion

  fecharExecucao(exec, antes) {
    exec.fim = Date.now();
    exec.requisicoes = this.totais.requisicoes - antes.requisicoes;
    exec.retries = this.totais.retries - antes.retries;
    const nivel = exec.status === 'ok' ? 'ok' : exec.status === 'parcial' ? 'aviso' : 'erro';
    this.log.registrar(nivel, `Fim (${exec.tipo}): ${exec.novos} novo(s), ${exec.atualizados} atualizado(s), ${exec.ignorados} sem mudança, ${exec.retries} retry(s) em ${((exec.fim - exec.inicio) / 1000).toFixed(1)} s`);
    this.ouvintes.forEach((fn) => fn(exec));
  }
}

export class ErroAPI extends Error {
  constructor(status, body, caminho) {
    super(`HTTP ${status} em ${caminho}${body?.error ? ` (${body.error})` : ''}`);
    this.status = status;
    this.body = body;
  }
}

function hora(isoTxt) {
  return new Date(isoTxt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

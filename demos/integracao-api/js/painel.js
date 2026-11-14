/**
 * painel.js
 * Liga as peças (API simulada, conector, repositório, log) à tela.
 * Nada de regra de integração aqui: só apresentação.
 */
import { MarketplaceXMock, CREDENCIAIS_DEMO } from './mock-api.js';
import { RepositorioERP } from './repositorio-erp.js';
import { Logger } from './logger.js';
import { ConectorMarketplaceX } from './conector.js';
import { SITUACAO } from './normalizador.js';
import { destacarJSON } from './destaque.js';
import { exportarCSV, exportarExcel } from './exportar.js';

// ---------- montagem ----------
const params = new URLSearchParams(location.search);
const api = new MarketplaceXMock({ taxaFalha: 0.08 });
const repositorio = new RepositorioERP();
const log = new Logger();
const conector = new ConectorMarketplaceX({ api, repositorio, log, credenciais: CREDENCIAIS_DEMO });
api.onWebhook((evento) => conector.receberWebhook(evento));

const $ = (id) => document.getElementById(id);
const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const horaCurta = (ms) => new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const resumir = (t) => (t.length > 24 ? t.slice(0, 22).trimEnd() + '…' : t);
const CLASSE_SITUACAO = {
  [SITUACAO.paid]: 'pago', [SITUACAO.shipped]: 'enviado', [SITUACAO.delivered]: 'entregue',
  [SITUACAO.pending_payment]: 'aguardando', [SITUACAO.cancelled]: 'cancelado',
};

const estado = { filtroSituacao: '', busca: '', uf: '', selecionado: null, execucoes: [] };

// ---------- console de logs ----------
const caixaLog = $('log');
let pendentes = [];
log.assinar((linha) => {
  pendentes.push(linha);
  agendarQuadro();
});

function desenharLog() {
  if (!pendentes.length) return;
  const perto = caixaLog.scrollHeight - caixaLog.scrollTop - caixaLog.clientHeight < 60;
  const frag = document.createDocumentFragment();
  for (const l of pendentes) {
    const d = document.createElement('div');
    const rotulo = { info: 'INFO', req: 'REQ', ok: 'OK', aviso: 'AVISO', erro: 'ERRO', retry: 'RETRY' }[l.nivel];
    d.innerHTML = `<time>${horaCurta(l.ts)}</time><span class="nv ${l.nivel}">${rotulo}</span><span>${esc(l.mensagem)}${l.ms != null ? ` <span class="ms">${l.ms} ms</span>` : ''}</span>`;
    frag.appendChild(d);
  }
  pendentes = [];
  caixaLog.appendChild(frag);
  while (caixaLog.children.length > 350) caixaLog.firstChild.remove();
  if (perto) caixaLog.scrollTop = caixaLog.scrollHeight;
}

// ---------- redesenho agrupado por quadro ----------
let quadro = 0;
function agendarQuadro() {
  if (quadro) return;
  quadro = requestAnimationFrame(() => { quadro = 0; desenharLog(); desenharTabela(); desenharKPIs(); });
}

// ---------- KPIs ----------
function desenharKPIs() {
  const pedidos = repositorio.listar();
  $('kPedidos').textContent = pedidos.length;
  const valor = pedidos.filter((p) => p.situacao !== SITUACAO.cancelled).reduce((s, p) => s + p.valores.total, 0);
  $('kValor').textContent = brl(valor).replace(/,\d{2}$/, '');
  $('kReq').textContent = conector.totais.requisicoes;
  $('kRetry').textContent = conector.totais.retries;
  $('kDup').textContent = conector.totais.duplicadosEvitados;
  $('console').classList.toggle('ativo', conector.ocupado);
}

// ---------- tabela e filtros ----------
function filtrar(pedidos) {
  const q = estado.busca.trim().toLowerCase();
  return pedidos.filter((p) => {
    if (estado.filtroSituacao && p.situacao !== estado.filtroSituacao) return false;
    if (estado.uf && p.cliente.uf !== estado.uf) return false;
    if (!q) return true;
    const alvo = [p.numero, p.pedido_externo, p.cliente.nome, p.envio?.rastreio, ...p.itens.map((i) => i.sku + ' ' + i.descricao)].join(' ').toLowerCase();
    return alvo.includes(q);
  });
}

function desenharChips(pedidos) {
  const contagem = {};
  pedidos.forEach((p) => { contagem[p.situacao] = (contagem[p.situacao] || 0) + 1; });
  const opcoes = [['', 'Todos', pedidos.length], ...Object.values(SITUACAO).map((s) => [s, s, contagem[s] || 0])];
  $('chips').innerHTML = opcoes.map(([v, r, n]) =>
    `<button class="chip" data-v="${esc(v)}" aria-pressed="${estado.filtroSituacao === v}">${esc(r)}<b>${n}</b></button>`).join('');

  const ufs = [...new Set(pedidos.map((p) => p.cliente.uf))].sort();
  const sel = $('fUF');
  if (sel.options.length - 1 !== ufs.length) {
    sel.innerHTML = '<option value="">Todos os estados</option>' + ufs.map((u) => `<option${u === estado.uf ? ' selected' : ''}>${u}</option>`).join('');
  }
}

function desenharTabela() {
  const todos = repositorio.listar();
  desenharChips(todos);
  const lista = filtrar(todos);
  $('vazio').style.display = lista.length ? 'none' : '';
  if (todos.length && !lista.length) $('vazio').textContent = 'Nenhum pedido com esses filtros.';
  const agora = Date.now();
  $('tbody').innerHTML = lista.map((p) => {
    const recente = agora - Date.parse(p.sincronizado_em) < 6000;
    const qtd = p.itens.reduce((s, i) => s + i.quantidade, 0);
    return `<tr data-id="${p.pedido_externo}" class="${p.pedido_externo === estado.selecionado ? 'sel' : ''} ${recente ? 'recente' : ''}">
      <td><span class="mono">${p.numero}</span><br><span class="fraco mono">#${p.pedido_externo}</span></td>
      <td class="col-cliente">${esc(p.cliente.nome)}<br><small class="fraco">${esc(p.cliente.cidade)} · ${p.cliente.uf}</small></td>
      <td class="col-data">${new Date(p.data_pedido).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}<br><span class="fraco">${new Date(p.data_pedido).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></td>
      <td class="col-itens">${qtd} un.<br><span class="fraco">${esc(resumir(p.itens[0].descricao))}${p.itens.length > 1 ? ` +${p.itens.length - 1}` : ''}</span></td>
      <td><span class="etq ${CLASSE_SITUACAO[p.situacao] || ''}">${esc(p.situacao)}</span>${p.envio?.rastreio ? `<br><span class="fraco mono">${p.envio.rastreio}</span>` : ''}</td>
      <td class="num">${brl(p.valores.total)}</td></tr>`;
  }).join('');
  const ultima = estado.execucoes[0];
  $('subPedidos').textContent = ultima
    ? `${todos.length} pedido(s) · última rodada às ${horaCurta(ultima.fim)}`
    : conector.ocupado ? 'Sincronizando…' : 'Nenhuma sincronização ainda';
}

$('chips').addEventListener('click', (e) => {
  const b = e.target.closest('.chip'); if (!b) return;
  estado.filtroSituacao = b.dataset.v; desenharTabela();
});
$('fBusca').addEventListener('input', (e) => { estado.busca = e.target.value; desenharTabela(); });
$('fUF').addEventListener('change', (e) => { estado.uf = e.target.value; desenharTabela(); });
$('tbody').addEventListener('click', (e) => {
  const tr = e.target.closest('tr'); if (!tr) return;
  selecionar(tr.dataset.id, true);
});

// ---------- JSON lado a lado ----------
function selecionar(id, rolar) {
  estado.selecionado = id;
  const reg = repositorio.obter(id);
  const bruto = repositorio.obterBruto(id);
  if (!reg || !bruto) return;
  const { _hash, ...semHash } = reg;
  const blocos = [`<span class="t-coment">// GET /v1/orders/${bruto.pedido.id}</span>\n${destacarJSON(bruto.pedido)}`,
    `<span class="t-coment">// GET /v1/customers/${bruto.cliente.id}</span>\n${destacarJSON(bruto.cliente)}`];
  if (bruto.envio) blocos.push(`<span class="t-coment">// GET /v1/shipments/${bruto.envio.id}</span>\n${destacarJSON(bruto.envio)}`);
  $('jsonOrigem').innerHTML = blocos.join('\n\n');
  $('jsonDestino').innerHTML = `<span class="t-coment">// tabela pedidos_venda · chave: pedido_externo</span>\n${destacarJSON(semHash)}`;
  $('jsonOrigemRota').textContent = `${bruto.envio ? 3 : 2} chamadas`;
  $('jsonDestinoNum').textContent = reg.numero;
  $('subJson').textContent = `Pedido #${id} de ${reg.cliente.nome}: inglês e códigos do marketplace viram campos em português, valores conferidos em centavos.`;
  desenharTabela();
  if (rolar && window.innerWidth < 1020) $('tJson').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------- linha do tempo ----------
const ROTULO_TIPO = { manual: 'Sincronização manual', agendada: 'Sincronização agendada', webhook: 'Webhook: novo pedido', inicial: 'Carga inicial' };
function desenharTempo() {
  $('tempo').innerHTML = estado.execucoes.slice(0, 30).map((x) => {
    const classe = x.status !== 'ok' ? x.status : x.tipo;
    const st = x.status === 'erro' ? ' · <b style="color:var(--verm)">interrompida</b>' : x.status === 'parcial' ? ' · <b style="color:var(--ouro)">parcial</b>' : '';
    return `<li><span class="bola ${classe}"></span><div>
      <div class="linha1"><b>${ROTULO_TIPO[x.tipo] || x.tipo}${st}</b><span class="fraco">${horaCurta(x.inicio)} · ${((x.fim - x.inicio) / 1000).toFixed(1)} s</span></div>
      <div class="nums">
        <span class="${x.novos ? 'forte' : ''}">${x.novos} novo(s)</span>
        <span class="${x.atualizados ? 'forte' : ''}">${x.atualizados} atualizado(s)</span>
        <span>${x.ignorados} sem mudança</span>
        <span>${x.requisicoes} req.</span>
        <span class="${x.retries ? 'quente' : ''}">${x.retries} retry</span>
        ${x.falhas ? `<span class="quente">${x.falhas} p/ próxima</span>` : ''}
      </div></div></li>`;
  }).join('');
}

conector.aoTerminar((exec) => {
  estado.execucoes.unshift(exec);
  desenharTempo();
  if (!estado.selecionado || exec.tipo === 'webhook') {
    const alvo = repositorio.listar()[0];
    if (alvo) selecionar(alvo.pedido_externo, false);
  }
  agendarQuadro();
  $('btnSync').disabled = false;
});

// ---------- ações ----------
function aviso(txt) {
  const t = $('toast'); t.textContent = txt; t.classList.add('vis');
  clearTimeout(aviso.t); aviso.t = setTimeout(() => t.classList.remove('vis'), 2600);
}

async function sincronizar(tipo) {
  $('btnSync').disabled = true;
  agendarQuadro();
  await conector.sincronizar(tipo);
  $('btnSync').disabled = false;
}

$('btnSync').addEventListener('click', () => sincronizar('manual'));
$('btnWebhook').addEventListener('click', () => {
  const id = api.simularNovoPedido();
  aviso(`Marketplace X criou o pedido #${id} e chamou o webhook`);
});
$('btnLimpar').addEventListener('click', () => { caixaLog.innerHTML = ''; });

let timerAgenda = 0;
$('chkAgenda').addEventListener('change', (e) => {
  clearInterval(timerAgenda);
  if (e.target.checked) {
    timerAgenda = setInterval(() => sincronizar('agendada'), 20000);
    log.info('Agendamento ligado: sincronização a cada 20 s (no servidor real, cron a cada 5 min)');
  } else log.info('Agendamento desligado');
});
$('chkInstavel').addEventListener('change', (e) => {
  api.definirTaxaFalha(e.target.checked ? 0.3 : 0.08);
  log.aviso(e.target.checked ? 'Simulação: API instável, 30% das chamadas falham com 500/503' : 'Simulação: API estável de novo (8% de falhas)');
});

$('btnCSV').addEventListener('click', () => {
  const lista = filtrar(repositorio.listar());
  if (exportarCSV(lista)) aviso(`CSV com ${lista.length} pedido(s) gerado`); else aviso('Nada para exportar ainda');
});
$('btnXLSX').addEventListener('click', async () => {
  const lista = filtrar(repositorio.listar());
  try {
    if (await exportarExcel(lista)) aviso(`Excel com ${lista.length} pedido(s): abas Pedidos e Itens`); else aviso('Nada para exportar ainda');
  } catch {
    exportarCSV(lista); aviso('Sem conexão com o SheetJS: exportei em CSV');
  }
});

// ---------- início: carga inicial automática ----------
log.info('Painel pronto. Conector Marketplace X → ERP Leve (API simulada no navegador)');
setTimeout(async () => {
  await sincronizar('inicial');
  if (params.has('webhook')) { api.simularNovoPedido(); }
}, 500);

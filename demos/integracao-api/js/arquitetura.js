/**
 * arquitetura.js
 * Lê os arquivos reais do conector e mostra os trechos marcados com
 * "// #region nome" ... "// #endregion", com destaque de sintaxe.
 */
import { destacarJS } from './destaque.js';

const TRECHOS = [
  {
    arquivo: 'conector.js', regiao: 'chamar', titulo: 'Retry com backoff exponencial',
    texto: 'Toda chamada passa por aqui. O que é passageiro se repete; o que é erro de verdade para na hora.',
    pontos: ['429 respeita o Retry-After da API', '5xx espera 300, 600, 1200 ms… com variação aleatória', '401 renova o token sem gastar tentativa'],
  },
  {
    arquivo: 'conector.js', regiao: 'sincronizar', titulo: 'Paginação com cursor',
    texto: 'Busca só o que mudou desde a última rodada, página por página, em ordem de atualização.',
    pontos: ['Um pedido com problema não derruba a rodada', 'O cursor só avança quando tudo deu certo', 'Erro na página: nada é marcado como lido'],
  },
  {
    arquivo: 'conector.js', regiao: 'processar', titulo: 'Enriquecer e normalizar',
    texto: 'O pedido da listagem não traz CPF nem rastreio. O conector busca cliente e envio e monta o registro completo.',
    pontos: ['Cliente em cache: menos chamadas, menos 429', 'Envio só quando o pedido já saiu'],
  },
  {
    arquivo: 'normalizador.js', regiao: 'normalizar', titulo: 'Do modelo do marketplace ao do ERP',
    texto: 'Função pura: recebe o JSON da API e devolve o pedido no formato do ERP, com os valores conferidos.',
    pontos: ['Contas em centavos', 'Aviso quando o total não bate', 'Fácil de cobrir com teste unitário'],
  },
  {
    arquivo: 'repositorio-erp.js', regiao: 'upsert', titulo: 'Idempotência na gravação',
    texto: 'A chave é o id do pedido no marketplace. Uma assinatura do conteúdo evita regravar o que não mudou.',
    pontos: ['Mesmo pedido duas vezes: um registro só', 'Número do ERP preservado nas atualizações'],
  },
  {
    arquivo: 'conector.js', regiao: 'webhook', titulo: 'Webhook sem duplicar',
    texto: 'O marketplace pode mandar o mesmo evento mais de uma vez. O id do evento é guardado e a repetição é descartada.',
    pontos: ['Evento durante uma rodada vai para a fila', 'Se falhar, o agendamento recupera o pedido'],
  },
];

function extrair(fonte, regiao) {
  const ini = fonte.indexOf(`// #region ${regiao}`);
  if (ini < 0) return null;
  const fim = fonte.indexOf('// #endregion', ini);
  const linhas = fonte.slice(fonte.indexOf('\n', ini) + 1, fim).replace(/\s+$/, '').split('\n');
  const recuo = Math.min(...linhas.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return linhas.map((l) => l.slice(recuo)).join('\n');
}

async function montar() {
  const caixa = document.getElementById('trechos');
  const cache = {};
  for (const t of TRECHOS) {
    const sec = document.createElement('section');
    sec.className = 'cartao trecho';
    sec.innerHTML = `<div class="explica"><div class="arquivo">js/${t.arquivo}</div><h3>${t.titulo}</h3><p>${t.texto}</p>
      <ul>${t.pontos.map((p) => `<li>${p}</li>`).join('')}</ul></div><pre class="codigo">carregando…</pre>`;
    caixa.appendChild(sec);
    const pre = sec.querySelector('pre');
    try {
      cache[t.arquivo] ??= fetch(`js/${t.arquivo}`).then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); });
      const codigo = extrair(await cache[t.arquivo], t.regiao);
      pre.innerHTML = codigo ? destacarJS(codigo) : 'Trecho não encontrado.';
    } catch {
      pre.textContent = `Abra esta página por um servidor (ou no GitHub Pages) para ler js/${t.arquivo}.`;
    }
  }
}
montar();

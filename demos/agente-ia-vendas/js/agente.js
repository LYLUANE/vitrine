/* Casa & Obra (marca fictícia) · motor do agente simulado
   Na demo, o "raciocínio" é um motor de regras com roteiro de intenções.
   Na versão real, quem decide qual ferramenta chamar é um modelo de linguagem
   (ex.: Claude) com estas mesmas ferramentas e as mesmas travas no código. */
(function () {
  'use strict';
  const D = window.CASA_OBRA_DADOS;
  const R = D.regras;

  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/³/g, '3').replace(/[’'`´\-]/g, ' ').replace(/\s+/g, ' ');
  const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const num = (v) => v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  const r2 = (v) => Math.round(v * 100) / 100;

  // índice de sinônimos (o mais longo vence)
  const SIN = [];
  D.produtos.forEach((p) => p.sinonimos.concat([p.nome]).forEach((s) => SIN.push({ s: norm(s).trim(), p })));
  const FAMILIAS = {};
  D.produtos.forEach((p) => { (FAMILIAS[p.familia] = FAMILIAS[p.familia] || []).push(p); });
  Object.keys(FAMILIAS).forEach((f) => SIN.push({ s: f, familia: f }));
  SIN.sort((a, b) => b.s.length - a.s.length);

  const estoque = {};
  D.produtos.forEach((p) => { estoque[p.sku] = p.estoque; });
  const bySku = (sku) => D.produtos.find((p) => p.sku === sku);

  let S;
  function reset() {
    S = { carrinho: [], cep: null, frete: null, desconto: 0, orcamento: null, aguardandoConfirmacao: false,
      pedidoAtual: null, contOrc: 317, contPed: 48240, contAtd: 2290, contAg: 1150 };
    D.produtos.forEach((p) => { estoque[p.sku] = p.estoque; });
  }
  reset();

  /* ---------------- ferramentas ---------------- */
  const FERRAMENTAS = {
    consultar_estoque(a) {
      const t = norm(a.termo);
      const achados = [];
      SIN.forEach((x) => {
        if (!x.p) return;
        if (t.includes(x.s) && !achados.includes(x.p)) achados.push(x.p);
      });
      if (!achados.length && FAMILIAS[t]) FAMILIAS[t].forEach((p) => achados.push(p));
      return {
        encontrados: achados.slice(0, 3).map((p) => ({ sku: p.sku, nome: p.nome, preco: p.preco, unidade: p.unidade,
          disponivel: estoque[p.sku], atende_quantidade: a.quantidade ? estoque[p.sku] >= a.quantidade : undefined,
          reposicao: estoque[p.sku] < (a.quantidade || 0) ? 'até 5 dias úteis' : undefined }))
      };
    },
    calcular_frete(a) {
      const dig = a.cep.replace(/\D/g, '');
      const km = 3 + (parseInt(dig.slice(2, 6), 10) % 36);
      const peso = a.peso_total_kg;
      let valor = r2(45 + km * 3.2 + Math.ceil(peso / 1000) * 25);
      const gratis = a.valor_mercadoria >= R.frete_gratis_acima && km <= R.frete_gratis_ate_km;
      if (gratis) valor = 0;
      const veiculo = peso > 3500 ? 'caminhão truck' : peso > 800 ? 'caminhão toco' : 'utilitário';
      return { cep: a.cep, distancia_km: km, peso_total_kg: Math.round(peso), veiculo, valor, frete_gratis: gratis,
        prazo: km > 25 ? '2 dias úteis' : 'próximo dia útil', obs: 'distância simulada a partir do CEP (dados fictícios)' };
    },
    gerar_orcamento(a) {
      const itens = a.itens.map((i) => { const p = bySku(i.sku); return { sku: p.sku, nome: p.nome, unidade: p.unidade, qtd: i.qtd, preco: p.preco, total: r2(p.preco * i.qtd) }; });
      const subtotal = r2(itens.reduce((s, i) => s + i.total, 0));
      // trava no código: mesmo que alguém peça mais, a ferramenta não passa do teto
      const teto = subtotal >= 3000 ? R.desconto_max_acima_3000 : R.desconto_padrao_max;
      a.desconto_percentual = Math.min(a.desconto_percentual, teto);
      const desconto = r2(subtotal * a.desconto_percentual / 100);
      const frete = a.frete || 0;
      const numero = 'ORC-2026-' + (++S.contOrc);
      return { numero, itens, subtotal, desconto_percentual: a.desconto_percentual, desconto, frete,
        total: r2(subtotal - desconto + frete), validade_dias: R.validade_orcamento_dias, pdf: 'pronto para imprimir' };
    },
    consultar_pedido(a) {
      const p = D.pedidos[a.numero] || (S.pedidoAtual && S.pedidoAtual.pedido === a.numero ? { status: S.pedidoAtual.status, itens: 'conforme ' + S.pedidoAtual.orcamento, total: S.pedidoAtual.total, entrega_agendada: S.pedidoAtual.entrega } : null);
      if (!p) return { encontrado: false, numero: a.numero };
      return Object.assign({ encontrado: true, numero: a.numero }, p);
    },
    agendar_entrega(a) {
      const ped = D.pedidos[a.pedido];
      if (ped && ped.status === 'entregue') return { agendado: false, motivo: 'pedido já entregue' };
      if (ped && ped.entrega_agendada) return { agendado: false, motivo: 'pedido já tem entrega marcada', janela_atual: ped.entrega_agendada };
      const janela = a.periodo === 'tarde' ? '13h às 17h' : '8h às 12h';
      const res = { agendado: true, pedido: a.pedido, data: a.data, janela, reserva: 'AG-' + (++S.contAg),
        aviso: 'motorista avisa por WhatsApp 30 min antes' };
      if (ped) ped.entrega_agendada = a.data + ', ' + janela;
      if (S.pedidoAtual && S.pedidoAtual.pedido === a.pedido) S.pedidoAtual.entrega = a.data + ', ' + janela;
      return res;
    },
    registrar_pedido(a) {
      S.orcamento.itens.forEach((i) => { estoque[i.sku] = Math.max(0, estoque[i.sku] - i.qtd); });
      const pedido = String(++S.contPed);
      return { pedido, orcamento: a.orcamento, status: 'aguardando pagamento', estoque_reservado: true,
        pagamento: 'link de PIX enviado ao cliente (simulado)' };
    },
    transferir_para_humano(a) {
      return { protocolo: 'ATD-' + (++S.contAtd), fila: a.fila, prioridade: a.prioridade,
        tempo_estimado: 'até 15 min em horário comercial', historico_enviado: true };
    }
  };

  /* ---------------- leitura da mensagem ---------------- */
  const RX = {
    saudacao: /^(oi|ola|bom dia|boa tarde|boa noite|e ai|opa|tudo bem)\b/,
    reclamacao: /(reclama|absurdo|pessim|horrivel|defeito|quebrad|trincad|empedrad|veio errad|faltando|faltou|nunca chegou|nao chegou|atrasad|vergonha|procon|descaso|estragad|danificad)/,
    humano: /(atendente|falar com (um |uma |o |a )?(pessoa|humano|alguem|gerente|vendedor)|gerente)/,
    pedidoNum: /\b(?:pedido|ped|n[ºo°]?)\s*#?\s*(\d{5})/,
    status: /(status|situacao|onde esta|cade|chega quando|ja saiu|andamento)/,
    agendar: /(agendar|agenda|marcar|entrega(r)? (no|na|para|pra|amanha|hoje|sabado|segunda|terca|quarta|quinta|sexta)|da pra entregar|pode entregar)/,
    cep: /(\d{5})[\s.\-]?(\d{3})\b/,
    desconto: /(desconto|abaixa|abate|mais barato|melhor preco|faz por|chorinho)/,
    pct: /(\d{1,2})\s*(%|por cento)/,
    orcamento: /(orcamento|orcar|quanto fica|quanto da|total|cotacao|pdf)/,
    fechar: /(pode fechar|fecha(r)? (o )?pedido|quero fechar|vou levar|quero comprar|fechar a compra|finalizar|fechado)/,
    sim: /^(sim|s|isso|confirmo|confirmado|pode|pode sim|ok|fechado|manda|bora|sim,? confirmo|sim pode)\b/,
    nao: /^(nao|n|ainda nao|espera|cancela|melhor nao)\b/,
    pergunta: /(tem |voces tem|vende|vendem|trabalham com|preco d|quanto custa|valor d|quero|preciso|me ve|manda)/
  };

  function lerItens(t) {
    const usado = new Array(t.length).fill(false);
    const out = [];
    SIN.forEach((x) => {
      const re = new RegExp('\\b' + x.s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g');
      let m;
      while ((m = re.exec(t))) {
        const ini = m.index, fim = ini + m[0].length;
        if (usado.slice(ini, fim).some(Boolean)) continue;
        for (let i = ini; i < fim; i++) usado[i] = true;
        const antes = t.slice(Math.max(0, ini - 26), ini);
        const ns = antes.match(/(\d+(?:[.,]\d+)?)(?!.*\d)/);
        const qtd = ns ? parseFloat(ns[1].replace(',', '.')) : null;
        const p = x.p || FAMILIAS[x.familia][0];
        out.push({ ini, p, qtd, generico: !x.p, familia: x.familia });
      }
    });
    return out.sort((a, b) => a.ini - b.ini);
  }

  function extrairTermo(t) {
    const m = t.match(/(?:voces tem|tem|vende[m]?|trabalham com|preco d[oa]s?|quanto custa[m]?|valor d[oa]s?|quero|preciso de|me ve)\s+(.+?)(\?|$|\.|,)/);
    if (!m) return null;
    return m[1].replace(/^(o|a|os|as|um|uma|de)\s+/, '').replace(/^\d+\s*(sacos?|unidades?|un|mcub|metros?|latas?|barras?)?\s*(de\s+)?/, '').trim();
  }

  const DIAS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const DIAS_TXT = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  function lerData(t) {
    const hoje = new Date();
    let alvo = null;
    if (/amanha/.test(t)) { alvo = new Date(hoje); alvo.setDate(hoje.getDate() + 1); }
    else if (/\bhoje\b/.test(t)) alvo = new Date(hoje);
    else {
      DIAS.forEach((d, i) => { if (new RegExp('\\b' + d).test(t)) { alvo = new Date(hoje); let dd = (i - hoje.getDay() + 7) % 7; if (dd === 0) dd = 7; alvo.setDate(hoje.getDate() + dd); } });
    }
    if (!alvo) return null;
    if (alvo.getDay() === 0) return { domingo: true };
    return { data: DIAS_TXT[alvo.getDay()] + ' ' + String(alvo.getDate()).padStart(2, '0') + '/' + String(alvo.getMonth() + 1).padStart(2, '0'), periodo: /tarde/.test(t) ? 'tarde' : 'manha' };
  }

  /* ---------------- passo a passo do agente ---------------- */
  function processar(texto) {
    const t = norm(texto).trim();
    const steps = [];
    const falas = [];
    const sug = [];
    let anexo = null;
    const ms = () => 90 + Math.floor(Math.random() * 380);
    const call = (nome, args) => {
      const res = FERRAMENTAS[nome](args);
      steps.push({ tipo: 'ferramenta', nome, args, res, ms: ms() });
      return res;
    };
    const guard = (id, titulo, detalhe) => steps.push({ tipo: 'guardrail', id, titulo, detalhe });
    const intencao = (nomes, entidades) => steps.push({ tipo: 'intencao', nomes, entidades });

    // 1) Reclamação ou pedido de humano: sempre vai para uma pessoa
    const reclamacao = RX.reclamacao.test(t);
    if (reclamacao || RX.humano.test(t)) {
      const nPed = (t.match(RX.pedidoNum) || [])[1] || (t.match(/\b(\d{5})\b/) || [])[1];
      const ent = { pedido: nPed || null, tom: reclamacao ? 'insatisfeito' : 'neutro' };
      intencao([reclamacao ? 'reclamacao' : 'falar_com_humano'], ent);
      let ped = null;
      if (nPed) ped = call('consultar_pedido', { numero: nPed });
      if (reclamacao) guard('humano', 'Reclamação vai para uma pessoa', 'O agente não discute culpa nem promete troca, reembolso ou prazo. Ele junta o contexto e transfere.');
      const fila = reclamacao ? 'pos_venda' : (/gerente/.test(t) ? 'gerencia_comercial' : 'vendas');
      const resumo = reclamacao
        ? 'Cliente relata problema' + (nPed ? ' no pedido ' + nPed : '') + ': "' + texto.slice(0, 120) + '"' + (ped && ped.encontrado ? '. Pedido ' + ped.status + ' (' + ped.itens + ').' : '.')
        : 'Cliente pediu atendimento humano' + (S.orcamento ? '. Orçamento ' + S.orcamento.numero + ' em aberto (' + brl(S.orcamento.total) + ').' : '.');
      const h = call('transferir_para_humano', { fila, prioridade: reclamacao ? 'alta' : 'normal', resumo });
      if (reclamacao) {
        falas.push('Sinto muito por isso. Não é o que a gente quer que aconteça com a sua obra.');
        falas.push('Já passei seu caso para a equipe de **pós-venda** com o resumo' + (ped && ped.encontrado ? ' e os dados do pedido ' + nPed : '') + '. Se puder, mande uma foto do material aqui mesmo, que ela vai junto.');
        falas.push('Protocolo **' + h.protocolo + '**. Uma pessoa da equipe responde em até 15 minutos no horário comercial.');
      } else {
        falas.push('Claro. Já chamei uma pessoa da equipe (' + (fila === 'gerencia_comercial' ? 'gerência comercial' : 'vendas') + ') e enviei o histórico desta conversa, para você não precisar repetir nada.');
        falas.push('Protocolo **' + h.protocolo + '**, resposta em até 15 minutos no horário comercial.');
      }
      return fim();
    }

    // 2) Confirmação pendente
    if (S.aguardandoConfirmacao) {
      if (RX.sim.test(t)) {
        intencao(['confirmar_pedido'], { orcamento: S.orcamento.numero, resposta: 'sim' });
        guard('confirma', 'Confirmação explícita recebida', 'O pedido só é registrado depois do "sim" do cliente sobre o resumo com total.');
        const r = call('registrar_pedido', { orcamento: S.orcamento.numero, cliente_confirmou: true });
        S.aguardandoConfirmacao = false;
        S.carrinho = []; S.desconto = 0;
        S.pedidoAtual = { pedido: r.pedido, status: r.status, orcamento: S.orcamento.numero, total: S.orcamento.total, entrega: null };
        falas.push('Pedido **' + r.pedido + '** registrado. Reservei o material no estoque.');
        falas.push('Te mandei o link do PIX de ' + brl(S.orcamento.total) + '. Assim que o pagamento cair, a separação começa.');
        falas.push('Quer já deixar a entrega agendada?');
        sug.push('Agendar para sábado de manhã', 'Entregar amanhã à tarde');
        return fim();
      }
      if (RX.nao.test(t)) {
        intencao(['recusar_confirmacao'], { orcamento: S.orcamento.numero });
        S.aguardandoConfirmacao = false;
        falas.push('Sem problema, não fechei nada. O orçamento **' + S.orcamento.numero + '** continua valendo por ' + R.validade_orcamento_dias + ' dias. É só me chamar.');
        return fim();
      }
    }

    // 3) Leitura geral
    const nPed = (t.match(RX.pedidoNum) || [])[1];
    const cepM = t.match(RX.cep);
    const pctM = t.match(RX.pct);
    let limpo = t.replace(RX.cep, ' ').replace(/(?:pedido|ped)\s*#?\s*\d{5}/g, ' ').replace(RX.pct, ' ').replace(/\bm ?3\b/g, 'mcub');
    const itens = lerItens(limpo);
    const querDesc = RX.desconto.test(t) || !!pctM;
    const querOrc = RX.orcamento.test(t);
    const querFechar = RX.fechar.test(t);
    const querAgendar = RX.agendar.test(t) || (/\b(sabado|amanha|segunda|terca|quarta|quinta|sexta)\b/.test(t) && (nPed || S.pedidoAtual));
    const querStatus = !!nPed && (RX.status.test(t) || !querAgendar);

    const nomes = [];
    const ent = {};
    if (itens.length) { nomes.push('pedir_produtos'); ent.itens = itens.map((i) => ({ produto: i.p.sku, qtd: i.qtd || 1 })); }
    if (cepM) { nomes.push('calcular_frete'); ent.cep = cepM[1] + '-' + cepM[2]; }
    if (querDesc) { nomes.push('pedir_desconto'); ent.desconto_pedido = pctM ? Number(pctM[1]) + '%' : 'sem valor'; }
    if (nPed) { ent.pedido = nPed; if (querStatus) nomes.push('consultar_pedido'); }
    if (querAgendar) nomes.push('agendar_entrega');
    if (querOrc) nomes.push('gerar_orcamento');
    if (querFechar) nomes.push('fechar_pedido');

    const pergunta = RX.pergunta.test(t);
    if (!nomes.length && pergunta) {
      const termo = extrairTermo(t) || t;
      intencao(['consultar_produto'], { termo });
      const r = call('consultar_estoque', { termo });
      if (!r.encontrados.length) {
        guard('inventa', 'Não inventa produto', 'A busca no catálogo voltou vazia. O agente responde que não tem, em vez de criar preço ou prazo.');
        falas.push('Conferi no nosso catálogo e **não trabalhamos com ' + termo + '**. Prefiro te falar isso do que passar preço ou prazo que não existe.');
        falas.push('No momento temos material básico (cimento, areia, brita, tijolo, bloco, argamassa, vergalhão), tinta, tubos de PVC, caixa d\'água e telha. Se quiser, chamo um vendedor para ver encomenda com fornecedor.');
        sug.push('Quero falar com um vendedor', 'Tem argamassa AC-III?');
        return fim();
      }
    }

    if (!nomes.length) {
      if (RX.saudacao.test(t)) {
        intencao(['saudacao'], {});
        falas.push('Olá! Sou o assistente da **Casa & Obra**. Consigo consultar estoque, calcular frete, montar orçamento, ver o status do seu pedido e agendar entrega.');
        falas.push('Me diga o que precisa, por exemplo: "40 sacos de cimento e 3 m³ de areia, CEP 13560-210".');
        sug.push('40 sacos de cimento e 3 m³ de areia, CEP 13560-210', 'Status do pedido 48213');
        return fim();
      }
      intencao(['nao_entendida'], { texto: texto.slice(0, 60) });
      steps.push({ tipo: 'nota', texto: 'Nenhuma regra casou. Na versão com modelo de linguagem, o modelo interpreta frases livres; aqui a demo pede para reformular.' });
      falas.push('Não tenho certeza se entendi. Posso ajudar com **produtos e quantidades**, **frete pelo CEP**, **orçamento**, **desconto**, **status do pedido**, **agendamento de entrega** ou passar para um atendente.');
      sug.push('Quero 20 sacos de argamassa AC-III', 'Falar com um atendente');
      return fim();
    }

    intencao(nomes, ent);

    // status do pedido
    if (nPed && querStatus) {
      const r = call('consultar_pedido', { numero: nPed });
      if (!r.encontrado) falas.push('Não achei o pedido **' + nPed + '**. Confere o número para mim? Ele está no comprovante, com 5 dígitos.');
      else falas.push('O pedido **' + nPed + '** (' + r.itens + ') está **' + r.status + '**' + (r.entrega_agendada ? ', entrega: ' + r.entrega_agendada : '') + '.');
    }

    // produtos
    if (itens.length) {
      itens.forEach((i) => {
        const qtd = i.qtd || 1;
        const r = call('consultar_estoque', { termo: i.p.nome, quantidade: qtd });
        const e = r.encontrados.find((x) => x.sku === i.p.sku) || r.encontrados[0];
        const usar = Math.min(qtd, e.disponivel);
        const ex = S.carrinho.find((c) => c.sku === i.p.sku);
        if (ex) ex.qtd = usar; else S.carrinho.push({ sku: i.p.sku, qtd: usar });
        let linha = '• ' + num(usar) + ' ' + i.p.unidade + (usar > 1 && !/m³/.test(i.p.unidade) ? 's' : '') + ' de ' + i.p.nome + ': ' + brl(i.p.preco) + ' cada';
        if (usar < qtd) linha += ' (tenho ' + e.disponivel + ' a pronta entrega; os outros ' + num(qtd - usar) + ' chegam em até 5 dias úteis)';
        if (i.generico && FAMILIAS[i.familia].length > 1) linha += ' (considerei este; temos também ' + FAMILIAS[i.familia].slice(1).map((p) => p.nome.split(',')[0]).join(', ') + ')';
        falas.push(linha);
      });
      falas.unshift('Conferi no estoque agora:');
      S.orcamento = null;
    }

    // frete
    if (cepM) S.cep = cepM[1] + '-' + cepM[2];
    if (S.carrinho.length && S.cep && (cepM || itens.length)) {
      const sub = subtotal();
      const peso = S.carrinho.reduce((s, c) => s + bySku(c.sku).peso_kg * c.qtd, 0);
      const f = call('calcular_frete', { cep: S.cep, peso_total_kg: Math.round(peso), valor_mercadoria: r2(sub) });
      S.frete = f.valor;
      falas.push('Frete para o CEP ' + S.cep + ': ' + (f.frete_gratis ? '**grátis**' : '**' + brl(f.valor) + '**') + ' (' + f.veiculo + ', ' + f.prazo + ').');
    } else if (cepM && !S.carrinho.length) {
      falas.push('Anotei o CEP ' + S.cep + '. Me diga os itens e eu já calculo o frete junto.');
    }

    // desconto
    if (querDesc) {
      if (!S.carrinho.length) {
        falas.push('Consigo ver desconto, sim. Primeiro me passe os itens e quantidades, porque o limite depende do valor do pedido.');
      } else {
        const sub = subtotal();
        const lim = sub >= 3000 ? R.desconto_max_acima_3000 : R.desconto_padrao_max;
        const pedido = pctM ? Number(pctM[1]) : lim;
        if (pedido > lim) {
          guard('desconto', 'Desconto acima do teto', 'Pedido de ' + pedido + '%. Teto da regra comercial: ' + lim + '% (' + (sub >= 3000 ? 'pedido acima de R$ 3.000' : 'pedido até R$ 3.000') + '). O código bloqueia; só o gerente libera mais.');
          S.desconto = lim;
          falas.push(pedido + '% eu não consigo liberar. O máximo que tenho autorização para este pedido é **' + lim + '%**, e já apliquei.');
          sug.push('Falar com o gerente');
        } else {
          S.desconto = pedido;
          falas.push('Consigo **' + pedido + '%** de desconto, sim. Já apliquei.');
        }
        S.orcamento = null;
      }
    }

    // agendamento
    if (querAgendar) {
      const pedAg = nPed || (S.pedidoAtual && S.pedidoAtual.pedido);
      const d = lerData(t);
      if (!pedAg) falas.push('Para agendar preciso do número do pedido (5 dígitos). Se ainda não fechou, posso montar o orçamento agora.');
      else if (!d) falas.push('Qual dia fica melhor? Entregamos de segunda a sábado, de manhã (8h às 12h) ou à tarde (13h às 17h).');
      else if (d.domingo) falas.push('Domingo não temos entrega. Pode ser sábado ou segunda?');
      else {
        const a = call('agendar_entrega', { pedido: pedAg, data: d.data, periodo: d.periodo });
        if (a.agendado) falas.push('Entrega do pedido **' + pedAg + '** agendada para **' + a.data + ', ' + a.janela + '**. Reserva ' + a.reserva + '. O motorista avisa aqui 30 minutos antes.');
        else falas.push('Não precisei agendar: ' + a.motivo + (a.janela_atual ? ' (' + a.janela_atual + ')' : '') + '.');
      }
    }

    // orçamento e fechamento
    if ((querOrc || querFechar || querDesc) && S.carrinho.length) {
      if (!S.orcamento) {
        const o = call('gerar_orcamento', { itens: S.carrinho.map((c) => ({ sku: c.sku, qtd: c.qtd })), cep: S.cep, desconto_percentual: S.desconto, frete: S.frete || 0 });
        S.orcamento = o;
        S.orcamento.cep = S.cep;
        S.orcamento.semFrete = !S.cep;
      }
      const o = S.orcamento;
      anexo = { tipo: 'orcamento', o };
      falas.push('Orçamento **' + o.numero + '**: ' + brl(o.subtotal) + (o.desconto ? ' − ' + o.desconto_percentual + '% (' + brl(o.desconto) + ')' : '') + (o.semFrete ? '' : ' + frete ' + brl(o.frete)) + ' = **' + brl(o.total) + '**. Válido por ' + o.validade_dias + ' dias.');
      if (o.semFrete) falas.push('Me passa o CEP da obra que eu incluo o frete.');
      if (querFechar) {
        guard('confirma', 'Pede confirmação antes de fechar', 'O agente mostra o resumo com total e só registra o pedido depois de um "sim" explícito.');
        S.aguardandoConfirmacao = true;
        falas.push('Para fechar, confirma para mim: **' + o.itens.length + ' ' + (o.itens.length > 1 ? 'itens' : 'item') + ', total ' + brl(o.total) + '**' + (o.semFrete ? ' (sem frete)' : ', entrega no CEP ' + o.cep) + '. Posso registrar o pedido?');
        sug.push('Sim, confirmo', 'Não, ainda não');
      } else {
        sug.push('Pode fechar o pedido');
        if (!S.desconto) sug.push('Consegue 15% de desconto?');
      }
    } else if ((querOrc || querFechar) && !S.carrinho.length) {
      falas.push('Monto o orçamento na hora. Quais produtos e quantidades você precisa?');
    } else if ((itens.length || cepM) && S.carrinho.length) {
      if (!S.cep) { falas.push('Me passa o CEP da entrega que eu calculo o frete e fecho o orçamento.'); sug.push('Meu CEP é 13560-210'); }
      else { falas.push('Quer que eu gere o orçamento em PDF?'); sug.push('Gerar o orçamento'); }
    }

    return fim();

    function fim() {
      steps.unshift({ tipo: 'entrada', texto });
      const resposta = falas.join('\n');
      steps.push({ tipo: 'resposta', texto: resposta });
      return { steps, resposta, anexo, sugestoes: sug.slice(0, 3), estoque };
    }
  }

  function subtotal() { return S.carrinho.reduce((s, c) => s + bySku(c.sku).preco * c.qtd, 0); }

  window.Agente = { processar, reset, brl, num, estoque, get estado() { return S; } };
})();

/* Central de Ajuda Caderneta (marca fictícia) — artigos da base.
   Cada artigo: id, titulo, resumo, categoria, produto, tipo, tags, atualizado, historico, relacionados, corpo (Markdown). */

window.KB_CATEGORIAS = [
  { nome: "Primeiros passos", icone: "bandeira", desc: "Configuração inicial, usuários e importação" },
  { nome: "Financeiro", icone: "moeda", desc: "Conciliação, boletos, Pix e contas" },
  { nome: "Vendas e PDV", icone: "carrinho", desc: "Caixa, orçamentos, preços e impressoras" },
  { nome: "Estoque", icone: "caixa", desc: "Inventário, variações e saldo" },
  { nome: "Notas fiscais", icone: "nota", desc: "NF-e, certificado e rejeições" },
  { nome: "Conta e segurança", icone: "cadeado", desc: "Acesso, senha e seus dados" },
  { nome: "Integrações e API", icone: "plug", desc: "API, webhooks e loja virtual" }
];

window.KB_PRODUTOS = ["Caderneta Web", "Caderneta PDV", "App Caderneta", "API Caderneta"];
window.KB_TIPOS = ["Tutorial", "Solução de problema", "Referência", "Perguntas frequentes"];

window.KB_ARTIGOS = [
{
  id: "primeiro-acesso",
  titulo: "Configure sua empresa no primeiro acesso",
  resumo: "O assistente inicial leva cerca de 15 minutos. Veja o que ter em mãos e como revisar cada etapa depois.",
  categoria: "Primeiros passos", produto: "Caderneta Web", tipo: "Tutorial",
  tags: ["cadastro", "empresa", "cnpj", "configuração inicial", "assistente", "regime tributário"],
  atualizado: "2026-10-30",
  historico: [
    { data: "2026-10-30", nota: "Incluída a etapa de data de início e saldo inicial." },
    { data: "2026-06-12", nota: "Telas atualizadas para o novo assistente." },
    { data: "2025-11-03", nota: "Publicação do artigo." }
  ],
  relacionados: ["convidar-usuarios", "importar-planilha", "certificado-a1"],
  corpo: `O assistente de configuração abre no primeiro login e leva cerca de 15 minutos. Cada etapa é salva ao avançar, então dá para parar e continuar depois.

![O assistente mostra a etapa atual e o que falta](ilustracao:assistente)

## Antes de começar

- CNPJ e razão social, iguais aos do cartão CNPJ
- Inscrição estadual (ou "Isento", quando for o caso)
- Regime tributário: Simples Nacional, Lucro Presumido ou Lucro Real
- Banco, agência e conta da conta principal

## Passo a passo

1. Entre em **app.caderneta.exemplo** com o e-mail usado na contratação.
2. Em **Dados da empresa**, digite o CNPJ. Razão social e endereço vêm da consulta pública: confira antes de seguir.
3. Escolha o **regime tributário**. Ele define os impostos sugeridos no cadastro de produtos e nas notas.
4. Cadastre a **conta bancária principal**. Ela é o destino padrão dos recebimentos.
5. Defina a **data de início**. O que aconteceu antes dela entra como saldo inicial, sem precisar lançar o passado.
6. Clique em **Concluir**. Tudo pode ser revisto em **Configurações > Empresa**.

> [!aviso] Regime tributário errado
> Se o regime mudar depois que você já emitiu notas, os produtos cadastrados não são ajustados sozinhos. Confirme o regime com a sua contabilidade antes de concluir.

## Próximo passo

Chame quem vai trabalhar com você no sistema: veja [Convidar usuários e definir permissões](#/artigo/convidar-usuarios).`
},
{
  id: "convidar-usuarios",
  titulo: "Convidar usuários e definir permissões",
  resumo: "Cada pessoa entra com o próprio login. Escolha um perfil pronto ou ajuste o que cada um pode ver e fazer.",
  categoria: "Primeiros passos", produto: "Caderneta Web", tipo: "Tutorial",
  tags: ["usuários", "permissões", "perfil", "convite", "contador", "acesso"],
  atualizado: "2026-09-18",
  historico: [
    { data: "2026-09-18", nota: "Novo perfil Contador, com acesso somente leitura." },
    { data: "2025-11-03", nota: "Publicação do artigo." }
  ],
  relacionados: ["primeiro-acesso", "verificacao-duas-etapas", "exportar-dados"],
  corpo: `Não compartilhe um login entre várias pessoas. Com usuários separados, o histórico mostra quem fez cada alteração e você remove um acesso sem trocar a senha de todo mundo.

## Convidar alguém

1. Vá em **Configurações > Usuários** e clique em **Convidar**.
2. Informe nome e e-mail da pessoa.
3. Escolha um **perfil** (tabela abaixo).
4. Clique em **Enviar convite**. O link vale por 7 dias.

## Perfis prontos

| Perfil | Pode | Não pode |
|---|---|---|
| Administrador | Tudo, inclusive usuários e plano | — |
| Financeiro | Contas, conciliação, boletos, relatórios | Excluir notas, mudar usuários |
| Vendedor | Orçamentos, pedidos, clientes | Ver custos e margem |
| Estoquista | Produtos, entradas, inventário | Financeiro |
| Contador | Ver e exportar notas e relatórios | Alterar qualquer dado |

> [!dica] Permissão sob medida
> Clique em **Personalizar** no perfil para ligar ou desligar telas específicas. Por exemplo: vendedor que pode dar até 5% de desconto, e não mais.

## Remover um acesso

Abra o usuário e clique em **Desativar**. O histórico dele continua guardado; só o login para de funcionar na hora.`
},
{
  id: "importar-planilha",
  titulo: "Importar clientes e produtos por planilha",
  resumo: "Traga seus cadastros de outro sistema em CSV. Veja o modelo de colunas e os erros que mais travam a importação.",
  categoria: "Primeiros passos", produto: "Caderneta Web", tipo: "Tutorial",
  tags: ["importação", "planilha", "csv", "excel", "migração", "clientes", "produtos", "sku"],
  atualizado: "2026-08-07",
  historico: [
    { data: "2026-08-07", nota: "Limite por arquivo aumentado para 5.000 linhas." },
    { data: "2026-02-20", nota: "Incluída a coluna NCM no modelo de produtos." },
    { data: "2025-11-10", nota: "Publicação do artigo." }
  ],
  relacionados: ["produto-variacoes", "primeiro-acesso", "exportar-dados"],
  corpo: `A importação aceita arquivos **CSV** com até 5.000 linhas. Para listas maiores, divida em mais de um arquivo.

![Planilha mapeada para os campos do sistema](ilustracao:importar)

## Modelo de produtos

A primeira linha precisa ter os nomes das colunas. Separe por ponto e vírgula e use vírgula nos decimais, como o Excel em português salva por padrão:

~~~csv
sku;nome;unidade;preco_venda;custo;ncm;estoque_inicial
CAM-001;Camiseta básica branca P;UN;49,90;18,50;61091000;30
CAM-002;Camiseta básica branca M;UN;49,90;18,50;61091000;42
CAF-250;Café torrado 250 g;UN;22,00;11,20;09012100;15
~~~

## Passo a passo

1. Em **Cadastros > Importar**, escolha **Produtos** ou **Clientes**.
2. Baixe o modelo, preencha e salve como **CSV UTF-8**.
3. Envie o arquivo. O sistema mostra uma prévia das 10 primeiras linhas.
4. Confira o mapeamento de colunas e clique em **Validar**.
5. Corrija as linhas apontadas com erro e clique em **Importar**.

> [!importante] Registros repetidos
> Se o SKU (produtos) ou o CPF/CNPJ (clientes) já existir, a linha **atualiza** o cadastro em vez de criar outro. Revise antes de reimportar uma planilha antiga.

## Erros comuns

- **Acentos trocados por símbolos**: o arquivo não foi salvo em UTF-8.
- **Preço zerado**: o número usa ponto como milhar (1.249,90 funciona; 1,249.90 não).
- **NCM inválido**: precisa ter 8 dígitos, sem pontos.`
},
{
  id: "atalhos-teclado",
  titulo: "Atalhos de teclado do Caderneta Web e do PDV",
  resumo: "Lista dos atalhos que mais economizam tempo no balcão e no escritório.",
  categoria: "Primeiros passos", produto: "Caderneta PDV", tipo: "Referência",
  tags: ["atalhos", "teclado", "produtividade", "pdv", "busca rápida"],
  atualizado: "2026-05-22",
  historico: [
    { data: "2026-05-22", nota: "Incluídos os atalhos de sangria e suprimento." },
    { data: "2025-12-01", nota: "Publicação do artigo." }
  ],
  relacionados: ["abrir-fechar-caixa", "orcamento-para-pedido"],
  corpo: `Os atalhos funcionam no navegador e no aplicativo do PDV. No Mac, troque Ctrl por Cmd.

## Caderneta Web

| Atalho | O que faz |
|---|---|
| [[Ctrl]] + [[K]] | Busca rápida em qualquer tela |
| [[N]] | Novo registro na lista aberta |
| [[Ctrl]] + [[S]] | Salvar o formulário |
| [[Esc]] | Fechar janela sem salvar |
| [[G]] depois [[F]] | Ir para o Financeiro |
| [[G]] depois [[E]] | Ir para o Estoque |

## Caderneta PDV

| Atalho | O que faz |
|---|---|
| [[F2]] | Buscar produto pelo nome |
| [[F4]] | Alterar quantidade do item |
| [[F6]] | Aplicar desconto |
| [[F8]] | Sangria |
| [[F9]] | Suprimento |
| [[F10]] | Finalizar venda |
| [[Ctrl]] + [[Del]] | Cancelar item (pede senha de supervisor) |

> [!dica] Leitor de código de barras
> O leitor funciona como um teclado. Com o cursor no campo de produto, basta bipar: não precisa de atalho.`
},
{
  id: "conciliacao-ofx",
  titulo: "Conciliação bancária com arquivo OFX",
  resumo: "Compare o extrato do banco com os lançamentos do sistema e descubra diferenças em minutos.",
  categoria: "Financeiro", produto: "Caderneta Web", tipo: "Tutorial",
  tags: ["conciliação", "ofx", "extrato", "banco", "conferência", "saldo"],
  atualizado: "2026-11-04",
  historico: [
    { data: "2026-11-04", nota: "Sugestão automática agora aceita diferença de até 3 dias na data." },
    { data: "2026-03-15", nota: "Incluída a regra de conciliação automática." },
    { data: "2025-11-03", nota: "Publicação do artigo." }
  ],
  relacionados: ["conciliacao-lancamento-nao-aparece", "plano-de-contas", "boletos-cnab"],
  corpo: `Conciliar é conferir se cada movimento do extrato tem um lançamento correspondente no sistema. Feito toda semana, leva poucos minutos e evita descobrir um erro só no fim do mês.

![À esquerda o extrato, à direita os lançamentos sugeridos](ilustracao:conciliacao)

## Baixar o OFX no banco

No internet banking, procure **Extrato > Exportar** e escolha o formato **OFX** (às vezes chamado de "Money"). Selecione o mesmo período que você quer conferir.

## Conciliar

1. Abra **Financeiro > Conciliação** e escolha a conta bancária.
2. Clique em **Importar extrato** e envie o arquivo OFX.
3. Para cada linha do extrato, o sistema sugere o lançamento com mesmo valor e data próxima. Confira e clique em **Confirmar**.
4. Se não houver lançamento, clique em **Criar** e escolha a categoria. O valor e a data já vêm preenchidos.
5. Ao final, o saldo do sistema deve bater com o saldo final do extrato.

> [!dica] Tarifas que se repetem
> Crie uma **regra**: "descrição contém TARIFA PACOTE → categoria Tarifas bancárias". Na próxima importação, essas linhas são conciliadas sozinhas.

> [!aviso] Mesmo arquivo duas vezes
> O sistema reconhece linhas já importadas pelo identificador do banco e não as duplica. Se o banco não envia esse identificador, confira o período antes de importar de novo.`
},
{
  id: "conciliacao-lancamento-nao-aparece",
  titulo: "Lançamento não aparece na conciliação",
  resumo: "O valor está no extrato, mas o sistema não sugere nada? Confira estas cinco causas, da mais comum para a mais rara.",
  categoria: "Financeiro", produto: "Caderneta Web", tipo: "Solução de problema",
  tags: ["conciliação", "ofx", "lançamento", "diferença", "saldo não bate", "erro"],
  atualizado: "2026-09-02",
  historico: [
    { data: "2026-09-02", nota: "Incluída a causa de pagamentos agrupados." },
    { data: "2026-01-14", nota: "Publicação do artigo." }
  ],
  relacionados: ["conciliacao-ofx", "contas-recorrentes"],
  corpo: `A sugestão automática procura um lançamento **em aberto**, na **mesma conta**, com **o mesmo valor** e data até 3 dias de diferença. Se algum desses pontos falha, nada aparece.

## Causas e soluções

1. **Lançamento em outra conta bancária.** Abra o lançamento e confira o campo *Conta*. É comum lançar na conta principal um pagamento que saiu da conta reserva.
2. **Valor diferente por centavos ou tarifa.** Boleto pago com juros, ou Pix com tarifa descontada. Use **Conciliar com diferença** e lance a diferença como juros ou tarifa.
3. **Data muito distante.** Cheques e depósitos podem compensar dias depois. Use a busca manual na linha do extrato e amplie o período.
4. **Lançamento já conciliado.** Ele pode ter sido ligado a outra linha por engano. Filtre por *Conciliados*, desfaça e refaça.
5. **Pagamento agrupado.** O banco mostra um débito único para vários boletos. Selecione os lançamentos com [[Ctrl]] e clique em **Conciliar em grupo**.

> [!importante] Saldo inicial
> Se o saldo nunca bate desde o primeiro mês, revise o saldo inicial em **Financeiro > Contas bancárias**. Ele precisa ser o saldo do extrato no dia anterior à data de início.`
},
{
  id: "boletos-cnab",
  titulo: "Emitir boletos e enviar remessa CNAB ao banco",
  resumo: "Configure a carteira de cobrança, gere os boletos e troque arquivos de remessa e retorno com o banco.",
  categoria: "Financeiro", produto: "Caderneta Web", tipo: "Tutorial",
  tags: ["boleto", "cnab", "remessa", "retorno", "cobrança", "carteira", "banco"],
  atualizado: "2026-07-25",
  historico: [
    { data: "2026-07-25", nota: "Explicação sobre CNAB 240 e 400 revisada." },
    { data: "2025-11-20", nota: "Publicação do artigo." }
  ],
  relacionados: ["pix-qr-dinamico", "conciliacao-ofx", "contas-recorrentes"],
  corpo: `Para o boleto ser registrado, o banco precisa receber um **arquivo de remessa**. Depois, você baixa o **arquivo de retorno** para o sistema dar baixa no que foi pago.

## O que pedir ao seu gerente

- Contrato de cobrança registrada ativo
- Número da carteira e do convênio (ou código do cedente)
- Layout do arquivo: **CNAB 240** ou **CNAB 400**

> [!dica] 240 ou 400?
> O número é a quantidade de caracteres por linha do arquivo. Os dois funcionam; use o que o banco indicar para o seu convênio.

## Passo a passo

1. Em **Financeiro > Cobrança > Carteiras**, clique em **Nova carteira** e preencha os dados do banco.
2. Defina multa, juros ao mês e instruções que vão impressas no boleto.
3. Em **Contas a receber**, selecione os títulos e clique em **Gerar boletos**.
4. Clique em **Gerar remessa** e baixe o arquivo.
5. No internet banking, envie o arquivo em **Cobrança > Transmitir arquivo**.
6. Nos dias seguintes, baixe o **retorno** no banco e importe em **Cobrança > Importar retorno**. Os títulos pagos são baixados sozinhos.

> [!aviso] Boleto enviado antes do registro
> Mandar o PDF ao cliente antes de transmitir a remessa pode gerar boleto "não encontrado" na hora do pagamento. Transmita primeiro.`
},
{
  id: "pix-qr-dinamico",
  titulo: "Receber por Pix com QR Code dinâmico",
  resumo: "Um QR Code por cobrança, com valor certo e baixa automática quando o pagamento cai.",
  categoria: "Financeiro", produto: "Caderneta Web", tipo: "Tutorial",
  tags: ["pix", "qr code", "recebimento", "cobrança", "baixa automática", "chave pix"],
  atualizado: "2026-10-09",
  historico: [
    { data: "2026-10-09", nota: "QR Code agora também sai impresso no cupom do PDV." },
    { data: "2026-04-02", nota: "Publicação do artigo." }
  ],
  relacionados: ["boletos-cnab", "abrir-fechar-caixa", "conciliacao-ofx"],
  corpo: `O **QR Code estático** é aquele impresso no balcão: o cliente digita o valor e você confere no aplicativo do banco. O **dinâmico** é gerado para cada cobrança, já com valor e identificador. Quando o pagamento cai, o sistema dá baixa sozinho.

![O cliente lê o código e o pedido muda para Pago](ilustracao:pix)

## Requisitos

- Conta PJ em banco com API Pix habilitada
- Chave Pix cadastrada nessa conta
- Credenciais de integração fornecidas pelo banco (o gerente ou o portal do desenvolvedor do banco informa como obter)

## Ativar

1. Em **Financeiro > Pix**, clique em **Conectar banco**.
2. Escolha o banco e cole as credenciais. Algumas instituições também pedem um certificado de integração.
3. Selecione a chave Pix que vai receber.
4. Faça uma cobrança de teste de R$ 1,00 e pague com outra conta.

## No dia a dia

Na venda ou na conta a receber, clique em **Cobrar com Pix**. O código pode ser exibido na tela, enviado por WhatsApp ou impresso no cupom. O status muda para **Pago** em poucos segundos após a confirmação do banco.

> [!importante] Validade da cobrança
> Por padrão o QR Code dinâmico expira em 24 horas. Ajuste em **Pix > Preferências** se você cobra com mais antecedência.`
},
{
  id: "plano-de-contas",
  titulo: "Plano de contas: como organizar as categorias",
  resumo: "Um plano enxuto deixa o DRE legível. Veja uma estrutura de partida para comércio e serviços.",
  categoria: "Financeiro", produto: "Caderneta Web", tipo: "Referência",
  tags: ["plano de contas", "categorias", "dre", "relatório", "despesas", "receitas"],
  atualizado: "2026-03-28",
  historico: [
    { data: "2026-03-28", nota: "Exemplo de estrutura para prestadores de serviço." },
    { data: "2025-11-03", nota: "Publicação do artigo." }
  ],
  relacionados: ["conciliacao-ofx", "contas-recorrentes"],
  corpo: `O plano de contas é a lista de categorias usadas nos lançamentos. É dele que saem o DRE e o gráfico de despesas. Categorias demais confundem; de menos, escondem o problema.

## Estrutura sugerida

~~~text
1 Receitas
  1.1 Vendas de produtos
  1.2 Prestação de serviços
  1.3 Receitas financeiras
2 Deduções
  2.1 Impostos sobre vendas
  2.2 Devoluções
3 Custos
  3.1 Mercadorias vendidas
  3.2 Frete de compra
4 Despesas
  4.1 Pessoal (salários, encargos, benefícios)
  4.2 Ocupação (aluguel, energia, água)
  4.3 Administrativas (contador, sistemas, material)
  4.4 Comerciais (marketing, comissões, taxas de cartão)
  4.5 Financeiras (tarifas, juros pagos)
~~~

## Boas práticas

- Use no máximo **dois níveis**. Detalhe extra vai no campo *Observação*.
- Taxa de cartão é **despesa comercial**, não dedução de imposto.
- Retirada dos sócios não é despesa: lance em **Movimentações de sócios** para não distorcer o lucro.
- Antes de excluir uma categoria com lançamentos, use **Mesclar** para mover tudo para outra.

> [!dica] Combine com a contabilidade
> Peça ao contador para revisar a lista uma vez. Com nomes parecidos com os da contabilidade, o fechamento mensal fica mais rápido.`
},
{
  id: "contas-recorrentes",
  titulo: "Contas recorrentes: aluguel, assinaturas e mensalidades",
  resumo: "Lance uma vez e o sistema cria as próximas parcelas. Veja como editar só uma ou todas as futuras.",
  categoria: "Financeiro", produto: "Caderneta Web", tipo: "Tutorial",
  tags: ["recorrente", "mensalidade", "aluguel", "assinatura", "contas a pagar", "contas a receber", "repetir"],
  atualizado: "2026-06-30",
  historico: [
    { data: "2026-06-30", nota: "Nova opção de reajuste anual automático." },
    { data: "2025-12-10", nota: "Publicação do artigo." }
  ],
  relacionados: ["boletos-cnab", "plano-de-contas", "conciliacao-lancamento-nao-aparece"],
  corpo: `Use recorrência para contas com valor e dia fixos. O sistema mantém sempre os próximos 12 lançamentos criados, então o fluxo de caixa já mostra o futuro.

## Criar

1. Em **Contas a pagar** (ou a receber), clique em **Novo**.
2. Preencha descrição, valor, categoria e vencimento.
3. Marque **Repetir** e escolha a frequência: mensal, bimestral, trimestral ou anual.
4. Opcional: defina a data de término ou o reajuste anual (percentual ou índice informado por você).
5. Salve.

## Editar uma recorrência

Ao alterar um lançamento recorrente, o sistema pergunta:

- **Só este**: muda apenas o mês aberto (por exemplo, uma conta de energia mais cara).
- **Este e os próximos**: muda daqui em diante, como um aluguel reajustado.

> [!aviso] Lançamentos já pagos
> Pagamentos já baixados nunca são alterados pela edição em lote. Se precisar corrigir um mês pago, estorne a baixa primeiro.`
},
{
  id: "abrir-fechar-caixa",
  titulo: "Abrir e fechar o caixa no PDV",
  resumo: "Troco inicial, sangria, suprimento e fechamento com conferência por forma de pagamento.",
  categoria: "Vendas e PDV", produto: "Caderneta PDV", tipo: "Tutorial",
  tags: ["caixa", "pdv", "abertura", "fechamento", "sangria", "suprimento", "troco", "frente de caixa"],
  atualizado: "2026-10-21",
  historico: [
    { data: "2026-10-21", nota: "Fechamento cego passou a ser opção por operador." },
    { data: "2026-05-22", nota: "Incluídos atalhos de sangria e suprimento." },
    { data: "2025-11-03", nota: "Publicação do artigo." }
  ],
  relacionados: ["pdv-offline", "impressora-termica", "atalhos-teclado"],
  corpo: `Cada caixa é aberto por um operador e fica ligado a ele até o fechamento. Assim, diferenças de valor têm responsável e horário.

![Tela de fechamento com o resumo por forma de pagamento](ilustracao:caixa)

## Abrir

1. Entre no PDV com o seu usuário.
2. Informe o **troco inicial** contado na gaveta.
3. Clique em **Abrir caixa**. A primeira venda já pode ser feita.

## Durante o dia

- **Sangria** ([[F8]]): retirada de dinheiro da gaveta, por exemplo para o cofre.
- **Suprimento** ([[F9]]): entrada de dinheiro para troco.

Os dois pedem motivo e imprimem um comprovante para assinar.

## Fechar

1. Clique em **Fechar caixa**.
2. Conte o dinheiro e digite o valor de cada forma de pagamento.
3. O sistema compara com o esperado e mostra a diferença.
4. Confirme. O relatório de fechamento é impresso e fica salvo em **Vendas > Caixas**.

> [!dica] Fechamento cego
> Ative em **PDV > Preferências** para que o operador digite os valores sem ver o total esperado. A conferência fica mais honesta.`
},
{
  id: "pdv-offline",
  titulo: "PDV sem internet: o que continua funcionando",
  resumo: "Vendas, cupom e dinheiro seguem normais. Veja o que depende de conexão e o que acontece quando ela volta.",
  categoria: "Vendas e PDV", produto: "Caderneta PDV", tipo: "Perguntas frequentes",
  tags: ["offline", "sem internet", "contingência", "nfc-e", "pdv", "sincronização", "queda"],
  atualizado: "2026-08-19",
  historico: [
    { data: "2026-08-19", nota: "Esclarecido o prazo de transmissão das notas em contingência." },
    { data: "2026-02-05", nota: "Publicação do artigo." }
  ],
  relacionados: ["abrir-fechar-caixa", "rejeicoes-sefaz", "pix-qr-dinamico"],
  corpo: `O PDV guarda produtos, preços e clientes no próprio computador. Se a internet cair, ele passa para o **modo offline** e mostra um aviso laranja no topo.

## O que funciona sem internet?

- Vendas em dinheiro e em maquininha de cartão independente
- Busca de produtos e leitura de código de barras
- Sangria, suprimento e fechamento do caixa
- Emissão de NFC-e em **contingência offline**, quando a sua UF permite

## O que precisa de conexão?

- Pix com QR Code dinâmico e cartão integrado (TEF)
- Consulta de crédito ou limite do cliente
- Preços alterados no Caderneta Web depois da queda

## E quando a internet volta?

As vendas são enviadas ao Caderneta Web e as notas emitidas em contingência são transmitidas à SEFAZ automaticamente. Acompanhe em **PDV > Sincronização**.

> [!importante] Prazo da contingência
> As notas emitidas offline precisam ser transmitidas dentro do prazo definido pela SEFAZ do seu estado. Não deixe o computador do caixa desligado por dias depois de uma queda.

> [!dica] Teste antes de precisar
> Desconecte o cabo de rede num horário calmo e faça uma venda de teste. Assim a equipe conhece o aviso e o procedimento.`
},
{
  id: "impressora-termica",
  titulo: "Impressora térmica não imprime ou sai com caracteres estranhos",
  resumo: "Checklist para cupom em branco, impressão cortada, símbolos no lugar de acentos e impressora não encontrada.",
  categoria: "Vendas e PDV", produto: "Caderneta PDV", tipo: "Solução de problema",
  tags: ["impressora", "térmica", "cupom", "não imprime", "acentos", "58mm", "80mm", "usb", "erro"],
  atualizado: "2026-09-27",
  historico: [
    { data: "2026-09-27", nota: "Incluída a solução para impressoras em rede." },
    { data: "2025-12-15", nota: "Publicação do artigo." }
  ],
  relacionados: ["abrir-fechar-caixa", "pdv-offline"],
  corpo: `Antes de tudo, faça o **autoteste** da impressora: com ela desligada, segure o botão de avanço de papel e ligue. Se a página de teste sair, o problema está na configuração, não no equipamento.

![Impressora térmica de 80 mm com cupom](ilustracao:impressora)

## Cupom sai em branco

O rolo está invertido. Papel térmico só imprime de um lado: risque com a unha; o lado que escurece deve ficar virado para a cabeça de impressão.

## Impressora não encontrada

1. Confira o cabo USB e teste outra porta do computador.
2. Em **PDV > Dispositivos**, clique em **Procurar impressoras**.
3. Em impressora de rede, imprima a configuração (geralmente segurando o botão de avanço por 5 segundos) e confirme se o IP está na mesma faixa do computador.

## Texto cortado na lateral

A largura configurada não bate com o papel. Em **PDV > Dispositivos**, escolha **58 mm** ou **80 mm** conforme o rolo.

## Símbolos no lugar de acentos

A página de código está errada. Mude para **CP-860 (Português)** ou **UTF-8**, conforme o modelo, e imprima um teste.

> [!aviso] Driver genérico do Windows
> Instalar a impressora como "Genérica / Somente texto" costuma cortar o cupom e ignorar o corte de papel. Use o driver do fabricante ou a conexão direta pelo PDV.`
},
{
  id: "orcamento-para-pedido",
  titulo: "Criar orçamento e converter em pedido de venda",
  resumo: "Mande o orçamento em PDF ou link, acompanhe a validade e transforme em pedido com um clique.",
  categoria: "Vendas e PDV", produto: "Caderneta Web", tipo: "Tutorial",
  tags: ["orçamento", "pedido", "proposta", "venda", "pdf", "validade", "aprovação"],
  atualizado: "2026-07-03",
  historico: [
    { data: "2026-07-03", nota: "Cliente agora pode aprovar o orçamento pelo link." },
    { data: "2025-11-25", nota: "Publicação do artigo." }
  ],
  relacionados: ["tabela-precos", "estoque-negativo", "primeira-nfe"],
  corpo: `O orçamento não mexe no estoque nem no financeiro. Só quando vira pedido os produtos são reservados e as parcelas entram em contas a receber.

## Criar o orçamento

1. Em **Vendas > Orçamentos**, clique em **Novo**.
2. Escolha o cliente. A tabela de preços dele é aplicada sozinha.
3. Adicione os itens, frete e condição de pagamento.
4. Defina a **validade** (padrão: 10 dias).
5. Clique em **Enviar** e escolha PDF por e-mail ou link de aprovação.

## Converter em pedido

Quando o cliente aprovar pelo link, o orçamento muda para **Aprovado** e você recebe um aviso. Abra e clique em **Gerar pedido**. Se ele aprovou por telefone, use o mesmo botão.

> [!dica] Preço mudou depois do envio
> O pedido mantém o preço do orçamento enquanto ele estiver na validade. Vencido, o sistema pergunta se quer atualizar para o preço atual.

> [!aviso] Estoque não reservado
> Como o orçamento não reserva produtos, o item pode acabar antes da aprovação. A coluna **Disponível** no orçamento mostra o saldo atual.`
},
{
  id: "tabela-precos",
  titulo: "Tabelas de preço e descontos por cliente",
  resumo: "Preço de atacado, revenda ou cliente especial sem duplicar produtos.",
  categoria: "Vendas e PDV", produto: "Caderneta Web", tipo: "Tutorial",
  tags: ["preço", "tabela de preço", "desconto", "atacado", "revenda", "margem", "cliente"],
  atualizado: "2026-04-17",
  historico: [
    { data: "2026-04-17", nota: "Regras por quantidade mínima." },
    { data: "2025-11-25", nota: "Publicação do artigo." }
  ],
  relacionados: ["orcamento-para-pedido", "convidar-usuarios"],
  corpo: `Cada produto tem um preço de venda padrão. Uma **tabela de preços** aplica uma regra sobre ele, e você liga a tabela ao cliente.

## Criar uma tabela

1. Vá em **Vendas > Tabelas de preço** e clique em **Nova**.
2. Dê um nome, como "Atacado" ou "Revenda".
3. Escolha a regra: **percentual sobre o preço padrão** (ex.: -12%) ou **preço fixo por produto**.
4. Opcional: defina **quantidade mínima** por item (ex.: preço de atacado a partir de 6 unidades).
5. Salve e, no cadastro do cliente, escolha a tabela no campo *Tabela de preço*.

## Limite de desconto do vendedor

Em **Configurações > Usuários > Permissões**, defina o desconto máximo por perfil. Acima disso, a venda pede a senha de um supervisor.

> [!importante] Margem negativa
> Se o preço final ficar abaixo do custo, o item aparece em vermelho no pedido. Quem não tem permissão para ver custos vê só o aviso, sem o valor.`
},
{
  id: "inventario-celular",
  titulo: "Fazer inventário com o celular",
  resumo: "Conte o estoque lendo códigos de barras com a câmera, por setor, com mais de uma pessoa ao mesmo tempo.",
  categoria: "Estoque", produto: "App Caderneta", tipo: "Tutorial",
  tags: ["inventário", "contagem", "celular", "app", "código de barras", "balanço", "estoque"],
  atualizado: "2026-10-14",
  historico: [
    { data: "2026-10-14", nota: "Contagem simultânea por setores." },
    { data: "2026-01-30", nota: "Publicação do artigo." }
  ],
  relacionados: ["estoque-negativo", "produto-variacoes"],
  corpo: `O inventário compara o que existe na prateleira com o saldo do sistema e ajusta as diferenças de uma vez, com histórico.

![Contagem pela câmera do celular](ilustracao:inventario)

## Preparar

1. No Caderneta Web, vá em **Estoque > Inventários > Novo**.
2. Escolha **total** ou **parcial** (só algumas categorias ou setores).
3. Crie os setores, como "Corredor A" e "Depósito", e distribua as pessoas.

## Contar no app

1. Abra o **App Caderneta**, toque em **Inventário** e escolha o seu setor.
2. Aponte a câmera para o código de barras. Cada leitura soma 1.
3. Para caixas fechadas, toque no item e digite a quantidade.
4. Ao terminar o setor, toque em **Finalizar setor**.

## Fechar o inventário

No Caderneta Web, revise a lista de diferenças. Itens com diferença grande ficam no topo. Clique em **Aplicar ajustes**: o saldo é corrigido e cada ajuste fica registrado com data e responsável.

> [!aviso] Vendas durante a contagem
> Vendas feitas no meio da contagem podem distorcer o resultado. Prefira contar fora do horário ou fazer inventário parcial por setor.`
},
{
  id: "estoque-negativo",
  titulo: "Estoque negativo: por que acontece e como corrigir",
  resumo: "Saldo abaixo de zero quase sempre é entrada não lançada. Veja como achar a origem e evitar de novo.",
  categoria: "Estoque", produto: "Caderneta Web", tipo: "Solução de problema",
  tags: ["estoque negativo", "saldo", "entrada", "nota de compra", "kardex", "movimentação", "erro"],
  atualizado: "2026-06-05",
  historico: [
    { data: "2026-06-05", nota: "Nova opção para bloquear venda sem saldo." },
    { data: "2025-12-20", nota: "Publicação do artigo." }
  ],
  relacionados: ["inventario-celular", "produto-variacoes", "orcamento-para-pedido"],
  corpo: `O sistema permite vender sem saldo para não travar o caixa. O resultado é um estoque negativo, que indica que alguma entrada não foi registrada.

## Achar a origem

1. Abra o produto e clique em **Movimentações** (o histórico de entradas e saídas, também chamado de kardex).
2. Procure o momento em que o saldo ficou abaixo de zero.
3. Verifique se houve compra desse produto antes dessa data.

## Causas mais comuns

- **Nota de compra não importada.** Importe o XML em **Estoque > Entradas** e o saldo é corrigido.
- **Venda do produto errado.** Produtos com nomes parecidos, ou variação errada (tamanho M vendido como P).
- **Kit montado sem baixar componentes.** Confira se o produto é um kit e se os componentes estão cadastrados.
- **Devolução não lançada.** O item voltou à prateleira, mas não ao sistema.

## Corrigir

Prefira lançar a entrada que faltou. Se não for possível identificar, use **Ajuste de estoque** com o motivo "Correção de saldo" e a quantidade contada.

> [!dica] Bloquear venda sem saldo
> Em **Estoque > Preferências**, ative **Impedir venda com saldo insuficiente**. Recomendado depois de um inventário completo, quando o saldo é confiável.`
},
{
  id: "produto-variacoes",
  titulo: "Cadastrar produto com variações de tamanho e cor",
  resumo: "Um produto pai com grade de variações, cada uma com SKU, código de barras e estoque próprios.",
  categoria: "Estoque", produto: "Caderneta Web", tipo: "Tutorial",
  tags: ["variação", "grade", "tamanho", "cor", "sku", "produto", "código de barras", "moda"],
  atualizado: "2026-05-11",
  historico: [
    { data: "2026-05-11", nota: "Geração automática de códigos de barras internos." },
    { data: "2025-11-15", nota: "Publicação do artigo." }
  ],
  relacionados: ["importar-planilha", "inventario-celular", "loja-virtual-sincronizar"],
  corpo: `Com variações, a "Camiseta básica" é um cadastro só, mas o estoque é controlado por combinação: branca P, branca M, preta P e assim por diante.

## Criar a grade

1. Em **Produtos > Novo**, preencha nome, NCM e preço base.
2. Ative **Este produto tem variações**.
3. Adicione os atributos, como **Tamanho** (P, M, G, GG) e **Cor** (Branca, Preta).
4. Clique em **Gerar variações**. O sistema cria todas as combinações.
5. Ajuste preço, peso ou SKU das que forem diferentes e salve.

## Códigos de barras

Se os produtos não têm código de fábrica, clique em **Gerar códigos internos** e imprima as etiquetas em **Produtos > Etiquetas**.

> [!importante] Excluir uma variação
> Variações com movimentação não podem ser excluídas, só **inativadas**. Isso preserva o histórico de vendas e notas.

> [!dica] Loja virtual
> A grade é enviada para a loja integrada com os mesmos atributos. Use nomes iguais aos da loja ("GG", e não "Extra G") para evitar duplicidade.`
},
{
  id: "certificado-a1",
  titulo: "Instalar o certificado digital A1",
  resumo: "Envie o arquivo .pfx, confira a validade e receba aviso antes de vencer.",
  categoria: "Notas fiscais", produto: "Caderneta Web", tipo: "Tutorial",
  tags: ["certificado digital", "a1", "a3", "pfx", "nf-e", "validade", "e-cnpj", "senha do certificado"],
  atualizado: "2026-09-09",
  historico: [
    { data: "2026-09-09", nota: "Aviso de vencimento agora sai 30 e 7 dias antes." },
    { data: "2025-11-05", nota: "Publicação do artigo." }
  ],
  relacionados: ["primeira-nfe", "rejeicoes-sefaz", "primeiro-acesso"],
  corpo: `Para emitir notas fiscais, o sistema assina cada XML com o certificado digital da empresa (e-CNPJ). O Caderneta trabalha com o modelo **A1**, que é um arquivo instalado no próprio sistema.

![O certificado fica guardado com criptografia e mostra a validade](ilustracao:certificado)

## A1 ou A3?

- **A1**: arquivo .pfx ou .p12. Costuma valer 1 ano. Funciona em sistemas na nuvem.
- **A3**: fica num cartão ou token USB e precisa estar conectado ao computador. Não é compatível com emissão na nuvem.

## Instalar

1. Vá em **Fiscal > Certificado digital**.
2. Clique em **Enviar certificado** e escolha o arquivo .pfx.
3. Digite a senha definida na compra do certificado.
4. Confira CNPJ e data de validade exibidos. O CNPJ precisa ser o mesmo da empresa cadastrada.

> [!aviso] Senha do certificado
> A senha não pode ser recuperada pela certificadora nem por nós. Sem ela, é preciso comprar outro certificado. Guarde-a num gerenciador de senhas.

> [!dica] Renovação
> Você recebe aviso por e-mail 30 e 7 dias antes do vencimento. Ao renovar, basta enviar o novo arquivo: as notas antigas continuam válidas.`
},
{
  id: "primeira-nfe",
  titulo: "Emitir sua primeira NF-e",
  resumo: "Do pedido à nota autorizada, com o que conferir antes de transmitir para a SEFAZ.",
  categoria: "Notas fiscais", produto: "Caderneta Web", tipo: "Tutorial",
  tags: ["nf-e", "nota fiscal", "emitir", "sefaz", "danfe", "xml", "cfop", "homologação"],
  atualizado: "2026-11-06",
  historico: [
    { data: "2026-11-06", nota: "Incluída a dica sobre o ambiente de homologação." },
    { data: "2026-04-22", nota: "Telas do novo emissor." },
    { data: "2025-11-05", nota: "Publicação do artigo." }
  ],
  relacionados: ["certificado-a1", "rejeicoes-sefaz", "cancelar-ou-corrigir-nfe"],
  corpo: `A NF-e (modelo 55) é usada em vendas para empresas e em operações entre estados. Para venda ao consumidor no balcão, o PDV emite a NFC-e.

## Antes da primeira nota

- Certificado A1 instalado ([veja como](#/artigo/certificado-a1))
- Série e próximo número configurados em **Fiscal > Configurações** (se você já emitia em outro sistema, continue a numeração)
- Produtos com NCM e origem preenchidos
- Cliente com CPF/CNPJ, endereço completo e indicação de contribuinte do ICMS

## Emitir

1. Abra o pedido de venda e clique em **Gerar NF-e**.
2. Confira a **natureza da operação** e o **CFOP** sugerido.
3. Revise impostos, frete e volumes na aba **Totais**.
4. Clique em **Transmitir**. Em poucos segundos o status muda para **Autorizada**.
5. Envie o DANFE e o XML ao cliente por e-mail direto da tela.

> [!dica] Teste sem valor fiscal
> Em **Fiscal > Configurações**, mude o ambiente para **Homologação** e emita notas de teste. Elas não têm validade fiscal. Volte para **Produção** antes de emitir de verdade.

> [!importante] Guarde os XMLs
> O arquivo que vale juridicamente é o XML, não o PDF. O Caderneta guarda os XMLs emitidos e você pode baixá-los a qualquer momento em **Fiscal > Exportar XML**.`
},
{
  id: "rejeicoes-sefaz",
  titulo: "Rejeições da SEFAZ mais comuns e como resolver",
  resumo: "Tabela com códigos frequentes, o que significam e onde corrigir no sistema.",
  categoria: "Notas fiscais", produto: "Caderneta Web", tipo: "Referência",
  tags: ["rejeição", "sefaz", "erro", "nf-e", "ncm", "duplicidade", "schema", "denegada", "código"],
  atualizado: "2026-10-02",
  historico: [
    { data: "2026-10-02", nota: "Incluída a rejeição por NCM inexistente." },
    { data: "2026-02-11", nota: "Publicação do artigo." }
  ],
  relacionados: ["primeira-nfe", "certificado-a1", "inutilizar-numeracao"],
  corpo: `Quando a nota é rejeitada, ela **não foi emitida**: corrija e transmita de novo com o mesmo número. O código e a mensagem aparecem no histórico da nota.

## Rejeições frequentes

| Código | O que significa | Como resolver |
|---|---|---|
| 204 | Duplicidade de NF-e | O número já foi autorizado. Clique em **Consultar na SEFAZ** para baixar a nota existente. |
| 213 | CNPJ do emitente diferente do certificado | Instale o certificado da empresa certa, ou revise o CNPJ em **Configurações > Empresa**. |
| 225 | Falha no schema XML | Algum campo tem formato inválido, como e-mail com espaço ou CEP incompleto. A mensagem indica o campo. |
| 539 | Duplicidade com diferença na chave de acesso | O número foi usado com outros dados. Consulte o número e, se não houver nota válida, emita com o próximo. |
| 778 | NCM inexistente | Corrija o NCM no cadastro do produto. Consulte a tabela NCM vigente. |
| 301 | Uso denegado: irregularidade do emitente | A situação da empresa na SEFAZ tem pendência. Fale com a contabilidade antes de tentar de novo. |

> [!importante] Rejeição x denegação
> A nota **rejeitada** pode ser corrigida e reenviada. A **denegada** (código 301 e semelhantes) fica registrada e o número não pode ser reaproveitado.

> [!dica] Mensagem completa
> A descrição exata pode variar conforme a versão do manual da NF-e e o estado. Sempre leia a mensagem completa no histórico da nota.`
},
{
  id: "cancelar-ou-corrigir-nfe",
  titulo: "Cancelar NF-e ou emitir carta de correção?",
  resumo: "O que dá para corrigir com a CC-e, quando é preciso cancelar e o que fazer se o prazo passou.",
  categoria: "Notas fiscais", produto: "Caderneta Web", tipo: "Perguntas frequentes",
  tags: ["cancelar", "cancelamento", "carta de correção", "cc-e", "nf-e", "prazo", "devolução", "erro na nota"],
  atualizado: "2026-08-28",
  historico: [
    { data: "2026-08-28", nota: "Texto sobre prazos revisado." },
    { data: "2025-12-05", nota: "Publicação do artigo." }
  ],
  relacionados: ["primeira-nfe", "inutilizar-numeracao", "rejeicoes-sefaz"],
  corpo: `## Quando usar a carta de correção (CC-e)?

Para erros que **não mudam valores nem as partes da operação**: endereço incompleto, transportadora, dados adicionais, descrição de um item.

A CC-e **não pode** alterar:

- Valores, quantidades, alíquotas e base de cálculo
- CPF/CNPJ e razão social do emitente ou do destinatário
- Data de emissão ou de saída

Para emitir: abra a nota, clique em **Carta de correção** e descreva a correção. Cada nova carta substitui a anterior, então repita tudo o que precisa ser corrigido.

## Quando cancelar?

Quando a mercadoria não saiu ou o erro está em algo que a CC-e não cobre. Abra a nota, clique em **Cancelar** e informe o motivo (mínimo de 15 caracteres).

> [!aviso] Prazo de cancelamento
> O cancelamento só é aceito dentro do prazo da SEFAZ, que em geral é de 24 horas após a autorização. Alguns estados aceitam pedidos fora do prazo com regras próprias.

## Passou do prazo, e agora?

O caminho mais comum é emitir uma **nota de devolução** (entrada) referenciando a original e depois emitir a nota correta. Confirme o procedimento com a contabilidade, porque há regras estaduais.`
},
{
  id: "inutilizar-numeracao",
  titulo: "Inutilizar numeração de NF-e pulada",
  resumo: "Números que nunca viraram nota precisam ser informados à SEFAZ. Veja quando e como fazer.",
  categoria: "Notas fiscais", produto: "Caderneta Web", tipo: "Tutorial",
  tags: ["inutilização", "inutilizar", "numeração", "nf-e", "sequência", "salto de numeração", "sefaz"],
  atualizado: "2026-07-14",
  historico: [
    { data: "2026-07-14", nota: "Relatório de saltos de numeração adicionado." },
    { data: "2026-01-20", nota: "Publicação do artigo." }
  ],
  relacionados: ["rejeicoes-sefaz", "cancelar-ou-corrigir-nfe", "primeira-nfe"],
  corpo: `A numeração da NF-e precisa ser contínua. Se um número foi pulado (por erro de configuração ou nota rejeitada que nunca foi reenviada), você deve **inutilizá-lo**.

## Inutilizar x cancelar

- **Cancelar**: para nota que foi **autorizada**.
- **Inutilizar**: para número que **nunca** teve nota autorizada.

## Passo a passo

1. Abra **Fiscal > Relatórios > Saltos de numeração**. O sistema lista os números faltantes por série.
2. Selecione os números e clique em **Inutilizar**.
3. Informe a justificativa (mínimo de 15 caracteres), por exemplo: "Numeração pulada por erro na configuração da série".
4. Confirme. O protocolo da SEFAZ fica salvo junto com o pedido.

> [!importante] Prazo
> A inutilização deve ser feita dentro do prazo da SEFAZ, em geral até o dia 10 do mês seguinte ao do salto. Rode o relatório no início de cada mês.

> [!aviso] Não dá para desfazer
> Número inutilizado não pode mais ser usado. Confira se não existe nota autorizada com ele antes de confirmar.`
},
{
  id: "verificacao-duas-etapas",
  titulo: "Ativar a verificação em duas etapas",
  resumo: "Além da senha, um código do aplicativo autenticador. Protege o financeiro mesmo se a senha vazar.",
  categoria: "Conta e segurança", produto: "Caderneta Web", tipo: "Tutorial",
  tags: ["duas etapas", "2fa", "autenticador", "segurança", "código", "login", "senha"],
  atualizado: "2026-09-30",
  historico: [
    { data: "2026-09-30", nota: "Administradores podem exigir 2FA de todos os usuários." },
    { data: "2025-11-08", nota: "Publicação do artigo." }
  ],
  relacionados: ["acesso-bloqueado", "convidar-usuarios"],
  corpo: `Com a verificação em duas etapas (2FA), o login pede a senha e um código de 6 dígitos que muda a cada 30 segundos no seu celular.

![Código temporário no aplicativo autenticador](ilustracao:dois-fatores)

## Ativar

1. Instale um aplicativo autenticador no celular (há opções gratuitas nas lojas de aplicativo).
2. No Caderneta Web, vá em **Meu perfil > Segurança** e clique em **Ativar verificação em duas etapas**.
3. Leia o QR Code com o aplicativo.
4. Digite o código de 6 dígitos que aparecer.
5. **Baixe ou anote os 10 códigos de recuperação** e guarde fora do celular.

> [!importante] Códigos de recuperação
> Cada código funciona uma vez. Eles são a única forma de entrar se você perder o celular. Sem eles, a recuperação exige confirmação de identidade pelo suporte e leva mais tempo.

## Exigir de toda a equipe

Administradores podem tornar a 2FA obrigatória em **Configurações > Segurança**. Quem ainda não ativou é levado à tela de configuração no próximo login.`
},
{
  id: "acesso-bloqueado",
  titulo: "Esqueci a senha ou meu acesso foi bloqueado",
  resumo: "Como redefinir a senha, o que fazer após tentativas erradas e como entrar sem o celular da 2FA.",
  categoria: "Conta e segurança", produto: "Caderneta Web", tipo: "Solução de problema",
  tags: ["senha", "esqueci a senha", "bloqueado", "login", "acesso", "redefinir", "2fa", "erro"],
  atualizado: "2026-10-25",
  historico: [
    { data: "2026-10-25", nota: "Tempo de bloqueio reduzido para 15 minutos." },
    { data: "2025-11-08", nota: "Publicação do artigo." }
  ],
  relacionados: ["verificacao-duas-etapas", "convidar-usuarios"],
  corpo: `## Esqueci a senha

1. Na tela de login, clique em **Esqueci minha senha**.
2. Digite o e-mail do seu usuário.
3. Abra o e-mail "Redefinição de senha" e clique no link (vale por 1 hora).
4. Crie a nova senha, com pelo menos 10 caracteres.

> [!dica] O e-mail não chegou
> Confira a caixa de spam e as abas de promoções. Se o seu usuário foi criado por um administrador, confirme com ele qual e-mail foi cadastrado.

## Acesso bloqueado

Depois de **5 tentativas erradas**, o login fica bloqueado por **15 minutos**. Espere ou peça ao administrador para desbloquear em **Configurações > Usuários**.

## Perdi o celular da verificação em duas etapas

1. Na tela do código, clique em **Usar código de recuperação**.
2. Digite um dos códigos guardados quando você ativou a 2FA.
3. Já dentro, desative a 2FA antiga e ative de novo com o celular novo.

> [!aviso] Sem códigos de recuperação
> Se você é administrador e não tem os códigos, abra um chamado. Por segurança, pedimos confirmação de identidade do responsável legal da empresa.`
},
{
  id: "exportar-dados",
  titulo: "Exportar seus dados e fazer backup",
  resumo: "Planilhas de cadastros e lançamentos, XMLs fiscais e o pacote completo da empresa.",
  categoria: "Conta e segurança", produto: "Caderneta Web", tipo: "Referência",
  tags: ["exportar", "backup", "dados", "planilha", "xml", "lgpd", "cancelamento", "contador"],
  atualizado: "2026-06-18",
  historico: [
    { data: "2026-06-18", nota: "Pacote completo agora inclui anexos de lançamentos." },
    { data: "2025-12-01", nota: "Publicação do artigo." }
  ],
  relacionados: ["importar-planilha", "convidar-usuarios", "primeira-nfe"],
  corpo: `Os dados são da sua empresa. Você pode exportar tudo a qualquer momento, sem pedir ao suporte.

## O que dá para exportar

| O quê | Onde | Formato |
|---|---|---|
| Clientes, fornecedores e produtos | Cada lista > **Exportar** | CSV ou XLSX |
| Lançamentos financeiros | **Financeiro > Relatórios** | CSV ou XLSX |
| Notas emitidas e recebidas | **Fiscal > Exportar XML** | ZIP com XMLs |
| Pacote completo | **Configurações > Dados da empresa** | ZIP |

## Pacote completo

1. Em **Configurações > Dados da empresa**, clique em **Gerar pacote completo**.
2. O pacote é preparado em segundo plano. Você recebe um e-mail quando estiver pronto.
3. O link de download vale por 72 horas e só funciona com login de administrador.

> [!dica] Envio mensal ao contador
> Em **Fiscal > Envio automático**, cadastre o e-mail da contabilidade. Todo dia 1º o sistema envia os XMLs do mês anterior.

> [!importante] Backup do nosso lado
> Fazemos cópias de segurança diárias da base. A exportação é para você ter uma cópia própria e para levar os dados a outro sistema, se um dia quiser.`
},
{
  id: "api-primeira-chamada",
  titulo: "Gerar token da API e fazer a primeira chamada",
  resumo: "Crie uma chave com escopo limitado e liste produtos com uma requisição HTTP simples.",
  categoria: "Integrações e API", produto: "API Caderneta", tipo: "Referência",
  tags: ["api", "token", "rest", "integração", "chave de acesso", "curl", "python", "desenvolvedor"],
  atualizado: "2026-10-18",
  historico: [
    { data: "2026-10-18", nota: "Exemplo em Python adicionado." },
    { data: "2026-03-03", nota: "Tokens passam a ter escopos." },
    { data: "2025-12-12", nota: "Publicação do artigo." }
  ],
  relacionados: ["webhooks-assinatura", "loja-virtual-sincronizar"],
  corpo: `A API do Caderneta é REST, responde em JSON e usa token no cabeçalho \`Authorization\`. Endereço base: \`https://api.caderneta.exemplo/v1\`.

![Sua aplicação chama a API; o Caderneta avisa por webhook](ilustracao:api)

## Gerar o token

1. Em **Configurações > Integrações > API**, clique em **Novo token**.
2. Dê um nome que diga quem usa (ex.: "Loja virtual").
3. Marque só os **escopos** necessários, como \`produtos:ler\` e \`pedidos:escrever\`.
4. Copie o token. Ele aparece **uma única vez**.

## Primeira chamada

~~~bash
curl https://api.caderneta.exemplo/v1/produtos?limite=2 \\
  -H "Authorization: Bearer SEU_TOKEN"
~~~

Resposta:

~~~json
{
  "dados": [
    { "id": 1042, "sku": "CAM-001", "nome": "Camiseta básica branca P", "preco": 49.9, "estoque": 30 },
    { "id": 1043, "sku": "CAM-002", "nome": "Camiseta básica branca M", "preco": 49.9, "estoque": 42 }
  ],
  "proxima_pagina": "eyJpZCI6MTA0M30"
}
~~~

## Em Python

~~~python
import requests

resp = requests.get(
    "https://api.caderneta.exemplo/v1/produtos",
    headers={"Authorization": "Bearer SEU_TOKEN"},
    params={"limite": 50},
    timeout=15,
)
resp.raise_for_status()
for p in resp.json()["dados"]:
    print(p["sku"], p["estoque"])
~~~

> [!aviso] Token não vai no navegador
> Nunca coloque o token em JavaScript de página pública. Faça as chamadas pelo seu servidor.

> [!dica] Limite de requisições
> São 120 requisições por minuto por token. Ao passar, a API responde \`429\` com o cabeçalho \`Retry-After\` indicando quantos segundos esperar.`
},
{
  id: "webhooks-assinatura",
  titulo: "Receber webhooks e validar a assinatura",
  resumo: "Seja avisado de pedidos, pagamentos e notas em tempo real, e confirme que o aviso veio mesmo do Caderneta.",
  categoria: "Integrações e API", produto: "API Caderneta", tipo: "Referência",
  tags: ["webhook", "assinatura", "hmac", "sha256", "notificação", "evento", "api", "node"],
  atualizado: "2026-11-10",
  historico: [
    { data: "2026-11-10", nota: "Novo evento nfe.autorizada." },
    { data: "2026-03-03", nota: "Publicação do artigo." }
  ],
  relacionados: ["api-primeira-chamada", "loja-virtual-sincronizar"],
  corpo: `Em vez de consultar a API a cada minuto, cadastre uma URL e o Caderneta faz um POST nela quando algo acontece.

## Eventos disponíveis

| Evento | Quando dispara |
|---|---|
| \`pedido.criado\` | Novo pedido de venda |
| \`pagamento.confirmado\` | Boleto ou Pix baixado |
| \`estoque.alterado\` | Saldo de um produto mudou |
| \`nfe.autorizada\` | Nota autorizada pela SEFAZ |

## Cadastrar

Em **Configurações > Integrações > Webhooks**, informe a URL (precisa ser HTTPS), escolha os eventos e copie o **segredo** gerado.

## Validar a assinatura

Cada envio traz o cabeçalho \`X-Caderneta-Assinatura\`, com o HMAC SHA-256 do corpo bruto usando o seu segredo. Exemplo em Node.js:

~~~js
import crypto from "node:crypto";

export function assinaturaValida(corpoBruto, cabecalho, segredo) {
  const esperado = crypto
    .createHmac("sha256", segredo)
    .update(corpoBruto)
    .digest("hex");
  const recebido = String(cabecalho || "").replace("sha256=", "");
  if (recebido.length !== esperado.length) return false;
  return crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(recebido));
}
~~~

> [!importante] Use o corpo bruto
> Calcule o HMAC sobre os bytes recebidos, antes de converter para JSON. Reformatar o JSON muda a assinatura.

## Respostas e novas tentativas

Responda \`200\` em até 10 segundos e processe depois, numa fila. Se a resposta for outra ou demorar, o envio é repetido até 6 vezes, com intervalos crescentes. Use o campo \`id_evento\` para ignorar repetidos.`
},
{
  id: "loja-virtual-sincronizar",
  titulo: "Integrar a loja virtual: estoque e pedidos sincronizados",
  resumo: "Conecte a loja para os pedidos entrarem no Caderneta e o estoque baixar nos dois lados.",
  categoria: "Integrações e API", produto: "Caderneta Web", tipo: "Tutorial",
  tags: ["loja virtual", "e-commerce", "integração", "sincronizar", "estoque", "pedidos", "marketplace"],
  atualizado: "2026-09-12",
  historico: [
    { data: "2026-09-12", nota: "Estoque de segurança por produto." },
    { data: "2026-02-25", nota: "Publicação do artigo." }
  ],
  relacionados: ["produto-variacoes", "webhooks-assinatura", "api-primeira-chamada"],
  corpo: `Com a integração, o Caderneta é o dono do estoque e dos preços. A loja recebe as alterações e devolve os pedidos.

## O que sincroniza

- **Do Caderneta para a loja**: estoque, preço e produtos marcados como "Publicar na loja"
- **Da loja para o Caderneta**: pedidos, dados do cliente e status de pagamento

## Conectar

1. Em **Integrações > Loja virtual**, escolha a plataforma da sua loja na lista.
2. Autorize o acesso com o login de administrador da loja.
3. Faça o **vínculo de produtos** pelo SKU. Itens sem correspondência aparecem para você ligar manualmente.
4. Escolha o depósito que abastece a loja e ative a sincronização.

> [!dica] Estoque de segurança
> Defina uma quantidade reservada (ex.: 2 unidades) que não aparece na loja. Isso evita vender online a última peça que acabou de sair no balcão.

> [!aviso] Preço alterado na loja
> Mudanças de preço feitas direto na loja são sobrescritas na próxima sincronização. Altere sempre no Caderneta.

## Plataforma não está na lista?

Use a [API](#/artigo/api-primeira-chamada) e os [webhooks](#/artigo/webhooks-assinatura) para montar a integração, ou fale com o nosso time sobre integrações sob medida.`
}
];

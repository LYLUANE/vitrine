/*
  Dados da vitrine. Para adicionar um projeto:
  1. Copie uma entrada abaixo e troque os campos.
  2. Crie a pasta img/<slug>/ (ou use img/<slug>.png) e aponte "capa" e "telas" para ela.
  Campos obrigatórios: slug, titulo, categoria, subtema, resumo, ferramentas, capa, status.
  Opcionais: link_demo, link_pdf, problema, solucao, fluxo, telas, video, entrega.
  categoria precisa ser uma das CATEGORIAS. status: "pronto" ou "em breve".
*/
window.CATEGORIAS = ["Sites", "Vídeo", "Design gráfico", "IA & Automação", "Sistemas"];

const DEMO = "https://lyluane.github.io/demos-clinica/";

window.CASES = [
  {
    slug: "site-clinica",
    titulo: "Site de clínica com agendamento online",
    categoria: "Sites",
    subtema: "Clínica de estética e odontologia",
    resumo: "Página da clínica com horários livres em tempo real e agendamento em poucos cliques.",
    ferramentas: ["HTML", "CSS", "JavaScript"],
    capa: "img/site.png",
    link_demo: DEMO + "site/",
    link_pdf: "pdf/site-clinica.pdf",
    status: "pronto",
    problema: "A clínica-tipo recebe pedidos de horário por telefone e mensagem, e a recepção perde tempo confirmando o que já está ocupado.",
    solucao: "Um site de uma página com serviços, equipe e uma agenda que mostra só os horários livres. O agendamento cai direto no painel da recepção.",
    fluxo: ["Paciente abre o site", "Escolhe serviço e horário livre", "Confirma os dados", "Agendamento aparece no painel"],
    telas: ["img/site.png"]
  },
  {
    slug: "chatbot-whatsapp",
    titulo: "Atendente de WhatsApp com IA",
    categoria: "IA & Automação",
    subtema: "Atendimento de clínica",
    resumo: "Responde dúvidas e preços, agenda, lembra 24h antes e passa para humano quando precisa.",
    ferramentas: ["JavaScript", "n8n", "Claude", "WhatsApp Business API"],
    capa: "img/chatbot.png",
    link_demo: DEMO + "chatbot/",
    link_pdf: "pdf/chatbot-whatsapp.pdf",
    status: "pronto",
    problema: "Mensagens chegam fora do horário e ficam sem resposta; orçamentos enviados não recebem retorno.",
    solucao: "Um atendente que segue as regras da clínica, agenda direto na agenda real, envia lembrete e follow-up de orçamento e transfere para a recepção em casos sensíveis. A demo mostra também os bastidores de cada decisão.",
    fluxo: ["Mensagem do paciente", "Regras da clínica", "IA entende a intenção", "Agenda ou responde", "Humano quando precisa"],
    telas: ["img/chatbot.png"]
  },
  {
    slug: "painel-gestao",
    titulo: "Painel de gestão da recepção",
    categoria: "Sistemas",
    subtema: "Agenda, orçamentos e pacientes",
    resumo: "Agenda do dia e por profissional, funil de orçamentos, pacientes e indicadores num só lugar.",
    ferramentas: ["JavaScript", "Next.js", "Supabase"],
    capa: "img/gestao.png",
    link_demo: DEMO + "gestao/",
    link_pdf: "pdf/painel-gestao.pdf",
    status: "pronto",
    problema: "A agenda fica no caderno, os orçamentos em conversas soltas e ninguém sabe quantos estão parados.",
    solucao: "Um painel simples para a recepção: confirmar, marcar falta, acompanhar orçamentos por etapa e ver os números da semana. Recebe os agendamentos do site e do WhatsApp.",
    fluxo: ["Agendamentos do site e WhatsApp", "Agenda do dia", "Confirmação ou falta", "Funil de orçamentos", "Indicadores"],
    telas: ["img/gestao.png"]
  },
  {
    slug: "ia-crm",
    titulo: "IA no CRM: prioridades do dia",
    categoria: "IA & Automação",
    subtema: "Perguntas em português sobre os dados",
    resumo: "Lista quem contatar hoje e responde perguntas sobre os dados da clínica, com mensagem sugerida.",
    ferramentas: ["JavaScript", "Claude", "Supabase"],
    capa: "img/crm.png",
    link_demo: DEMO + "crm/",
    link_pdf: "pdf/ia-crm.pdf",
    status: "pronto",
    problema: "Os dados existem, mas a equipe não tem tempo de cruzar planilhas para saber quem precisa de retorno.",
    solucao: "Um assistente que lê o CRM, monta as prioridades do dia e responde perguntas como \"quem não volta há 90 dias?\", já sugerindo a mensagem.",
    fluxo: ["Dados do CRM", "Regras de prioridade", "IA resume e responde", "Mensagem sugerida", "Equipe revisa e envia"],
    telas: ["img/crm.png"]
  },
  {
    slug: "controle-estoque",
    titulo: "Controle de estoque por atendimento",
    categoria: "Sistemas",
    subtema: "Materiais de clínica",
    resumo: "Baixa de materiais por procedimento, alerta de mínimo, pedido de compra e entradas x saídas.",
    ferramentas: ["JavaScript", "Supabase"],
    capa: "img/estoque.png",
    link_demo: DEMO + "estoque/",
    link_pdf: "pdf/controle-estoque.pdf",
    status: "pronto",
    problema: "O material acaba no meio da semana porque ninguém registra o que cada procedimento consome.",
    solucao: "Cada atendimento dá baixa automática nos materiais. Quando um item chega ao mínimo, o sistema avisa e monta o pedido de compra.",
    fluxo: ["Atendimento concluído", "Baixa automática", "Confere estoque mínimo", "Alerta", "Pedido de compra"],
    telas: ["img/estoque.png"]
  },
  {
    slug: "automacao-formulario",
    titulo: "Automação: formulário, planilha, e-mail e WhatsApp",
    categoria: "IA & Automação",
    subtema: "Leads e relatório semanal",
    resumo: "Um contato do site vira linha na planilha, e-mail para a equipe e mensagem no WhatsApp.",
    ferramentas: ["n8n", "Google Sheets", "Gmail", "WhatsApp"],
    capa: "img/automacao.png",
    link_demo: DEMO + "automacao/",
    link_pdf: "pdf/automacao-formulario.pdf",
    status: "pronto",
    problema: "Contatos do site ficam parados na caixa de e-mail e a equipe repassa tudo à mão.",
    solucao: "Um fluxo que registra o contato na planilha, avisa a equipe, responde o interessado no WhatsApp e envia um resumo toda segunda-feira.",
    fluxo: ["Formulário do site", "Planilha", "E-mail para a equipe", "WhatsApp para o contato", "Relatório semanal"],
    telas: ["img/automacao.png"]
  },
  {
    slug: "assistente-documentos",
    titulo: "Assistente que responde pelos documentos",
    categoria: "IA & Automação",
    subtema: "Respostas com fonte",
    resumo: "Responde só com base nos documentos da clínica, mostra o trecho de origem e diz \"não sei\" sem fonte.",
    ferramentas: ["JavaScript", "Claude", "Busca em documentos"],
    capa: "img/documentos.png",
    link_demo: DEMO + "documentos/",
    link_pdf: "pdf/assistente-documentos.pdf",
    status: "pronto",
    problema: "A equipe perde tempo procurando políticas, preparos e valores em PDFs e mensagens antigas.",
    solucao: "Um assistente que busca nos documentos oficiais, responde citando o trecho de onde tirou a informação e admite quando não encontrou.",
    fluxo: ["Pergunta da equipe", "Busca nos documentos", "Trechos encontrados", "Resposta com fonte", "\"Não sei\" se não houver"],
    telas: ["img/documentos.png"]
  },
  {
    slug: "workflows-n8n",
    titulo: "Workflows n8n prontos para importar",
    categoria: "IA & Automação",
    subtema: "Versão real das demos",
    resumo: "Três fluxos importáveis: atendente de WhatsApp com IA, lembretes e follow-up, leads e relatório.",
    ferramentas: ["n8n", "Claude", "Supabase", "Google"],
    capa: "img/n8n.png",
    link_demo: DEMO + "n8n/",
    link_pdf: "pdf/workflows-n8n.pdf",
    status: "pronto",
    problema: "Uma demo no navegador mostra a ideia, mas o cliente quer saber como fica rodando de verdade.",
    solucao: "Os mesmos fluxos das demos em arquivos do n8n, com notas do que configurar. Foram importados no n8n 2.45.7; a execução completa depende das contas do cliente (WhatsApp Business, Anthropic, Supabase e Google).",
    fluxo: ["Gatilho (mensagem, horário ou formulário)", "Regras", "IA quando precisa", "Envio", "Registro"],
    telas: ["img/n8n.png"]
  },

  /* ---- em breve ---- */
  {
    slug: "kit-identidade-visual",
    titulo: "Kit de identidade visual",
    categoria: "Design gráfico",
    subtema: "Logo, cores, tipografia e aplicações",
    resumo: "Logo em versões, paleta, fontes e aplicações em cartão, fachada e redes sociais.",
    ferramentas: ["Figma", "Inkscape", "SVG"],
    capa: "",
    status: "em breve"
  },
  {
    slug: "posts-instagram",
    titulo: "Posts para Instagram",
    categoria: "Design gráfico",
    subtema: "Carrossel e feed",
    resumo: "Série de posts e carrosséis com modelo editável para o cliente seguir publicando.",
    ferramentas: ["Figma", "Canva"],
    capa: "",
    status: "em breve"
  },
  {
    slug: "banner-outdoor",
    titulo: "Banner e outdoor",
    categoria: "Design gráfico",
    subtema: "Arte para impressão",
    resumo: "Arte em vetor com sangria e PDF pronto para a gráfica.",
    ferramentas: ["Inkscape", "SVG", "PDF para gráfica"],
    capa: "",
    status: "em breve"
  },
  {
    slug: "reels-legendas",
    titulo: "Pacote de 3 Reels com legenda animada",
    categoria: "Vídeo",
    subtema: "Confeitaria, contabilidade e atendimento com IA",
    resumo: "Três Reels 9:16 de 14 a 19 segundos, com narração, legenda palavra por palavra e animação no ritmo da voz.",
    ferramentas: ["HyperFrames", "GSAP", "Narração local (Kokoro)", "FFmpeg"],
    capa: "img/reels.png",
    status: "pronto",
    problema: "Pequenos negócios precisam postar vídeo curto toda semana, mas não têm tempo de gravar nem de editar. Muita gente assiste sem som, então vídeo sem legenda perde o público.",
    solucao: "Três formatos que se repetem toda semana: promoção de produto (confeitaria), dica em lista (contabilidade para MEI) e demonstração de serviço (atendente de WhatsApp com IA). Cada um tem gancho no primeiro segundo, texto na área segura do Instagram e legenda que acende palavra por palavra.",
    fluxo: ["Roteiro de 4 ou 5 frases", "Narração", "Tempo de cada palavra", "Animação das cenas", "Legenda e revisão", "MP4 9:16"],
    videos: [
      { src: "video/reel-confeitaria.mp4", capa: "img/reel-confeitaria.jpg", legenda: "Promoção de produto · Doce Ponto (marca fictícia)" },
      { src: "video/reel-mei.mp4", capa: "img/reel-mei.jpg", legenda: "Dica em lista · Conta Clara (marca fictícia)" },
      { src: "video/reel-atendente-ia.mp4", capa: "img/reel-atendente-ia.jpg", legenda: "Demonstração de serviço · atendente com IA" }
    ],
    entrega: [
      ["Roteiro", "4 ou 5 frases com gancho, prova e chamada, aprovado antes de animar"],
      ["Prévia", "primeira versão para você assistir e pedir ajustes"],
      ["Arquivos", "MP4 9:16 pronto para Reels, Shorts e TikTok, mais a legenda em SRT"],
      ["Série", "o mesmo modelo serve para os próximos vídeos, trocando só texto e cores"]
    ]
  },
  {
    slug: "video-historia-narrado",
    titulo: "Vídeo de história narrado",
    categoria: "Vídeo",
    subtema: "Roteiro, narração e imagens",
    resumo: "Roteiro, narração, imagens e edição de um vídeo contando uma história do início ao fim.",
    ferramentas: ["Roteiro", "Narração", "FFmpeg"],
    capa: "",
    status: "em breve"
  },
  {
    slug: "pagina-vendas",
    titulo: "Página de vendas",
    categoria: "Sites",
    subtema: "Landing page de produto",
    resumo: "Página única de oferta com seções claras, prova e chamada para ação.",
    ferramentas: ["HTML", "CSS", "JavaScript"],
    capa: "",
    status: "em breve"
  }
];

/* Etapas padrão de entrega, usadas quando o caso não define "entrega". */
window.ENTREGA_PADRAO = [
  ["Briefing", "Conversa curta para entender o negócio, o público e o que precisa ficar pronto."],
  ["Proposta visual", "Rascunho de telas ou layout para aprovar antes de desenvolver."],
  ["Desenvolvimento", "Construção com prévias para acompanhar o andamento."],
  ["Revisão", "Ajustes combinados a partir do que o cliente testou."],
  ["Entrega", "Arquivos, publicação e um guia curto de uso."]
];

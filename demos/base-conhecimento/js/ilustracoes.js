/* Ilustrações próprias em SVG. As cores vêm de variáveis CSS, então seguem o modo escuro. */
(function () {
  "use strict";
  const W = 'viewBox="0 0 640 300" role="img" xmlns="http://www.w3.org/2000/svg"';
  const barra = (x, y, w, cls) => `<rect x="${x}" y="${y}" width="${w}" height="8" rx="4" class="${cls || "i-txt"}"/>`;
  const janela = (x, y, w, h) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" class="i-card"/>` +
    `<path d="M${x} ${y + 14}a14 14 0 0 1 14-14h${w - 28}a14 14 0 0 1 14 14v14H${x}z" class="i-topo"/>` +
    `<circle cx="${x + 18}" cy="${y + 14}" r="4" class="i-ponto"/><circle cx="${x + 32}" cy="${y + 14}" r="4" class="i-ponto"/><circle cx="${x + 46}" cy="${y + 14}" r="4" class="i-ponto"/>`;
  const check = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" class="i-ok"/><path d="M${cx - r * .45} ${cy}l${r * .32} ${r * .32} ${r * .55}-${r * .62}" class="i-check"/>`;

  const ART = {
    assistente: () => `<svg ${W}><rect width="640" height="300" class="i-fundo"/>
      ${janela(70, 34, 500, 232)}
      <g transform="translate(110 92)">
        <line x1="20" y1="20" x2="400" y2="20" class="i-trilho"/>
        <line x1="20" y1="20" x2="230" y2="20" class="i-trilho-ativo"/>
        ${check(20, 20, 16)}${check(125, 20, 16)}
        <circle cx="230" cy="20" r="16" class="i-marca"/><text x="230" y="25" class="i-num">3</text>
        <circle cx="315" cy="20" r="16" class="i-vazio"/><text x="315" y="25" class="i-num i-num-apagado">4</text>
        <circle cx="400" cy="20" r="16" class="i-vazio"/><text x="400" y="25" class="i-num i-num-apagado">5</text>
      </g>
      <text x="110" y="160" class="i-rotulo">Conta bancária principal</text>
      <rect x="110" y="172" width="200" height="34" rx="8" class="i-campo"/>${barra(124, 185, 110)}
      <rect x="326" y="172" width="200" height="34" rx="8" class="i-campo"/>${barra(340, 185, 80)}
      <rect x="426" y="222" width="100" height="30" rx="15" class="i-marca"/><text x="476" y="242" class="i-botao">Avançar</text>
    </svg>`,

    conciliacao: () => `<svg ${W}><rect width="640" height="300" class="i-fundo"/>
      <rect x="40" y="36" width="250" height="228" rx="14" class="i-card"/>
      <rect x="350" y="36" width="250" height="228" rx="14" class="i-card"/>
      <text x="60" y="66" class="i-rotulo">Extrato do banco (OFX)</text>
      <text x="370" y="66" class="i-rotulo">Lançamentos no sistema</text>
      ${[0, 1, 2, 3].map(k => {
        const y = 88 + k * 42, ok = k !== 2;
        return `<rect x="56" y="${y}" width="218" height="32" rx="8" class="i-linha-item"/>${barra(68, y + 12, 90)}<text x="262" y="${y + 21}" class="i-valor">${["-R$ 189,90", "+R$ 1.240,00", "-R$ 32,50", "+R$ 560,00"][k]}</text>
        <rect x="366" y="${y}" width="218" height="32" rx="8" class="${ok ? "i-linha-item" : "i-linha-falta"}"/>${ok ? barra(378, y + 12, 100) : `<text x="378" y="${y + 21}" class="i-falta">Sem correspondência</text>`}
        ${ok ? `<path d="M276 ${y + 16}C310 ${y + 16} 330 ${y + 16} 364 ${y + 16}" class="i-liga"/>${check(320, y + 16, 9)}` : `<path d="M276 ${y + 16}H310" class="i-liga i-liga-falta"/>`}`;
      }).join("")}
    </svg>`,

    pix: () => `<svg ${W}><rect width="640" height="300" class="i-fundo"/>
      <rect x="120" y="28" width="150" height="250" rx="22" class="i-card i-borda"/>
      <rect x="140" y="62" width="110" height="110" rx="6" class="i-branco"/>
      ${(() => { let s = ""; const pad = [[0,0],[0,1],[1,0],[2,2],[3,1],[4,3],[1,4],[3,3],[2,0],[0,3],[4,0],[4,4],[2,4],[3,0],[1,2]];
        pad.forEach(([a, b]) => { s += `<rect x="${150 + a * 18}" y="${72 + b * 18}" width="14" height="14" class="i-qr"/>`; }); return s; })()}
      <text x="195" y="198" class="i-centro">R$ 87,40</text>
      ${barra(155, 212, 80)}
      <rect x="148" y="236" width="94" height="26" rx="13" class="i-marca"/><text x="195" y="253" class="i-botao">Pagar</text>
      <path d="M290 150h70" class="i-seta"/><path d="M352 142l10 8-10 8" class="i-seta-ponta"/>
      <rect x="380" y="92" width="200" height="116" rx="14" class="i-card"/>
      <text x="400" y="122" class="i-rotulo">Pedido 4821</text>
      ${barra(400, 136, 120)}
      <rect x="400" y="160" width="86" height="28" rx="14" class="i-ok-suave"/>${check(416, 174, 8)}<text x="430" y="179" class="i-ok-texto">Pago</text>
    </svg>`,

    certificado: () => `<svg ${W}><rect width="640" height="300" class="i-fundo"/>
      <rect x="130" y="50" width="300" height="200" rx="12" class="i-card i-borda"/>
      <rect x="146" y="66" width="268" height="168" rx="6" class="i-moldura"/>
      <text x="170" y="104" class="i-rotulo">e-CNPJ · A1</text>
      ${barra(170, 120, 180)}${barra(170, 138, 140)}
      <text x="170" y="178" class="i-mini">Válido até</text>
      <text x="170" y="200" class="i-valor-esq">12/09/2027</text>
      <circle cx="365" cy="190" r="30" class="i-acento"/><circle cx="365" cy="190" r="20" class="i-selo"/>
      <path d="M350 214l-8 28 14-8 9 12 4-26M380 214l8 28-14-8-9 12" class="i-acento"/>
      <rect x="452" y="128" width="72" height="62" rx="10" class="i-marca"/>
      <path d="M468 128v-14a20 20 0 0 1 40 0v14" class="i-arco"/>
      <circle cx="488" cy="155" r="7" class="i-branco"/><rect x="485" y="158" width="6" height="16" rx="3" class="i-branco"/>
    </svg>`,

    caixa: () => `<svg ${W}><rect width="640" height="300" class="i-fundo"/>
      ${janela(60, 30, 520, 240)}
      <text x="88" y="84" class="i-rotulo">Fechamento · Caixa 02</text>
      ${["Dinheiro", "Cartão", "Pix", "Sangrias"].map((n, k) => {
        const y = 104 + k * 34;
        return `<text x="88" y="${y + 18}" class="i-mini">${n}</text>
        <rect x="200" y="${y}" width="130" height="26" rx="6" class="i-campo"/><text x="320" y="${y + 18}" class="i-valor">${["R$ 612,30", "R$ 1.980,50", "R$ 744,00", "-R$ 400,00"][k]}</text>`;
      }).join("")}
      <rect x="370" y="104" width="180" height="128" rx="12" class="i-moldura"/>
      <text x="460" y="134" class="i-centro-mini">Diferença</text>
      <text x="460" y="172" class="i-centro i-ok-texto">R$ 0,00</text>
      <rect x="400" y="190" width="120" height="28" rx="14" class="i-marca"/><text x="460" y="209" class="i-botao">Confirmar</text>
    </svg>`,

    inventario: () => `<svg ${W}><rect width="640" height="300" class="i-fundo"/>
      ${[0, 1, 2].map(k => `<rect x="60" y="${60 + k * 70}" width="280" height="8" rx="4" class="i-prateleira"/>
        ${[0, 1, 2, 3].map(j => `<rect x="${74 + j * 66}" y="${18 + k * 70}" width="48" height="42" rx="4" class="${(j + k) % 3 ? "i-caixinha" : "i-caixinha2"}"/>`).join("")}`).join("")}
      <rect x="400" y="40" width="150" height="240" rx="22" class="i-card i-borda"/>
      <rect x="418" y="70" width="114" height="90" rx="8" class="i-tela-escura"/>
      ${[0,1,2,3,4,5,6,7,8,9].map(j => `<rect x="${432 + j * 9}" y="96" width="${j % 3 ? 3 : 5}" height="38" class="i-codbar"/>`).join("")}
      <line x1="424" y1="115" x2="526" y2="115" class="i-laser"/>
      <text x="475" y="186" class="i-centro-mini">Camiseta M · Branca</text>
      <text x="475" y="222" class="i-centro">42</text>
      <rect x="430" y="236" width="90" height="24" rx="12" class="i-marca"/><text x="475" y="252" class="i-botao">+1</text>
    </svg>`,

    "dois-fatores": () => `<svg ${W}><rect width="640" height="300" class="i-fundo"/>
      ${janela(70, 50, 270, 200)}
      <text x="96" y="104" class="i-rotulo">Código de verificação</text>
      ${[0,1,2,3,4,5].map(k => `<rect x="${96 + k * 36}" y="122" width="28" height="38" rx="6" class="i-campo"/><text x="${110 + k * 36}" y="148" class="i-digito">${"483 921".replace(" ", "")[k]}</text>`).join("")}
      <rect x="96" y="186" width="120" height="30" rx="15" class="i-marca"/><text x="156" y="206" class="i-botao">Entrar</text>
      <rect x="400" y="34" width="150" height="240" rx="22" class="i-card i-borda"/>
      <text x="475" y="88" class="i-centro-mini">Caderneta</text>
      <text x="475" y="138" class="i-centro i-grande">483 921</text>
      <circle cx="475" cy="190" r="22" class="i-trilho-circ"/>
      <path d="M475 168a22 22 0 1 1-19 11" class="i-progresso"/>
      <text x="475" y="195" class="i-centro-mini">18 s</text>
    </svg>`,

    api: () => `<svg ${W}><rect width="640" height="300" class="i-fundo"/>
      <rect x="40" y="100" width="150" height="100" rx="14" class="i-card i-borda"/><text x="115" y="146" class="i-centro-mini">Seu sistema</text>${barra(75, 162, 80)}
      <rect x="245" y="88" width="150" height="124" rx="14" class="i-marca"/><text x="320" y="146" class="i-botao i-grande-b">API</text><text x="320" y="170" class="i-botao">/v1</text>
      <rect x="450" y="100" width="150" height="100" rx="14" class="i-card i-borda"/><text x="525" y="146" class="i-centro-mini">Caderneta</text>${barra(485, 162, 80)}
      <path d="M192 126h50" class="i-seta"/><path d="M234 118l10 8-10 8" class="i-seta-ponta"/>
      <path d="M398 126h50" class="i-seta"/><path d="M440 118l10 8-10 8" class="i-seta-ponta"/>
      <text x="217" y="114" class="i-micro">GET</text><text x="423" y="114" class="i-micro">JSON</text>
      <path d="M525 204v40H115v-40" class="i-seta i-tracejado"/><path d="M107 214l8-12 8 12" class="i-seta-ponta"/>
      <rect x="250" y="230" width="140" height="28" rx="14" class="i-acento"/><text x="320" y="249" class="i-botao">webhook</text>
    </svg>`,

    impressora: () => `<svg ${W}><rect width="640" height="300" class="i-fundo"/>
      <path d="M262 40h116v130H262z" class="i-papel"/>
      ${barra(280, 60, 80)}${barra(280, 76, 60)}${barra(280, 98, 80)}${barra(280, 112, 70)}${barra(280, 126, 80)}
      <text x="320" y="156" class="i-centro-mini">TOTAL R$ 64,80</text>
      <path d="M262 40l10 6 10-6 10 6 10-6 10 6 10-6 10 6 10-6 10 6 10-6 10 6" class="i-serrilha"/>
      <rect x="200" y="160" width="240" height="100" rx="18" class="i-card i-borda"/>
      <rect x="236" y="164" width="168" height="10" rx="5" class="i-tela-escura"/>
      <circle cx="400" cy="230" r="10" class="i-ok"/><rect x="226" y="222" width="70" height="14" rx="7" class="i-campo"/>
      <text x="470" y="200" class="i-mini">80 mm</text><path d="M462 190h-14" class="i-seta"/>
    </svg>`,

    importar: () => `<svg ${W}><rect width="640" height="300" class="i-fundo"/>
      <rect x="50" y="56" width="210" height="188" rx="12" class="i-card i-borda"/>
      ${[0,1,2,3,4].map(r => [0,1,2].map(c => `<rect x="${64 + c * 64}" y="${72 + r * 32}" width="58" height="24" rx="4" class="${r === 0 ? "i-cab" : "i-celula"}"/>`).join("")).join("")}
      <text x="155" y="270" class="i-centro-mini">produtos.csv</text>
      <path d="M282 150h76" class="i-seta"/><path d="M350 142l10 8-10 8" class="i-seta-ponta"/>
      <rect x="380" y="56" width="210" height="188" rx="12" class="i-card i-borda"/>
      ${["SKU", "Nome", "Preço", "NCM"].map((n, k) => `<text x="400" y="${92 + k * 40}" class="i-mini">${n}</text><rect x="460" y="${78 + k * 40}" width="112" height="22" rx="5" class="i-campo"/>${check(560, 89 + k * 40, 7)}`).join("")}
    </svg>`
  };

  window.Ilustracoes = {
    nomes: Object.keys(ART),
    render(nome) { const f = ART[nome]; return f ? f() : ""; }
  };
})();

/* Vidraçaria Cristal (marca fictícia) · dados e cálculos compartilhados */
const DB_KEY = 'cristal_orc_v1';

const EMPRESA = {
  nome: 'Vidraçaria Cristal',
  slogan: 'Vidros, espelhos e box sob medida',
  endereco: 'Av. Central, 1200 · Centro',
  fone: '(11) 4000-0000',
  email: 'orcamentos@vidracariacristal.exemplo',
  doc: 'CNPJ 00.000.000/0000-00 (fictício)'
};

const UNIDADES = { m2: 'm²', ml: 'm', un: 'un' };
const UNIDADE_NOME = { m2: 'por m²', ml: 'por metro linear', un: 'por unidade' };
const STATUS = {
  rascunho: 'Rascunho', enviado: 'Enviado', aprovado: 'Aprovado', recusado: 'Recusado'
};

function pad(n, s = 2) { return String(n).padStart(s, '0'); }
function isoLocal(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function parseISO(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function fmtData(s) { if (!s) return '—'; const d = parseISO(s); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); }
function brl(v) { return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function num(v, c = 2) { return (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c }); }
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function uid() { return Math.random().toString(36).slice(2, 9); }

/* ---------- cálculo ---------- */
function medidaReal(it, prod) {
  const u = prod ? prod.unidade : 'un';
  if (u === 'm2') return (+it.l || 0) * (+it.a || 0) * (+it.q || 0);
  if (u === 'ml') return (+it.c || 0) * (+it.q || 0);
  return +it.q || 0;
}
function medidaCobrada(it, prod) {
  const u = prod ? prod.unidade : 'un';
  if (u === 'm2') {
    const area = (+it.l || 0) * (+it.a || 0);
    const min = prod.areaMin || 0;
    return (area > 0 ? Math.max(area, min) : 0) * (+it.q || 0);
  }
  return medidaReal(it, prod);
}
function subtotalItem(it, prod) { return Math.round(medidaCobrada(it, prod) * (+it.p || 0) * 100) / 100; }
function totais(o, prods) {
  const map = Object.fromEntries(prods.map(p => [p.id, p]));
  const sub = o.itens.reduce((s, it) => s + subtotalItem(it, map[it.prod]), 0);
  const desc = o.descTipo === '%' ? sub * (+o.desc || 0) / 100 : (+o.desc || 0);
  const frete = +o.frete || 0;
  return { sub, desc: Math.min(desc, sub), frete, total: Math.max(0, sub - desc + frete) };
}
function descMedidas(it, prod) {
  if (!prod) return '';
  if (prod.unidade === 'm2') return num(+it.l || 0) + ' × ' + num(+it.a || 0) + ' m';
  if (prod.unidade === 'ml') return num(+it.c || 0) + ' m';
  return '';
}

/* ---------- seed ---------- */
function seed() {
  const hoje = new Date();
  const produtos = [
    { id: 'p1', nome: 'Vidro temperado incolor 8 mm', cat: 'Vidros', unidade: 'm2', preco: 289, estoque: 46, minimo: 10, areaMin: 0.5 },
    { id: 'p2', nome: 'Vidro temperado fumê 8 mm', cat: 'Vidros', unidade: 'm2', preco: 329, estoque: 7.5, minimo: 8, areaMin: 0.5 },
    { id: 'p3', nome: 'Vidro laminado 8 mm (4+4)', cat: 'Vidros', unidade: 'm2', preco: 365, estoque: 12, minimo: 6, areaMin: 0.5 },
    { id: 'p4', nome: 'Espelho prata 4 mm lapidado', cat: 'Espelhos', unidade: 'm2', preco: 198, estoque: 24, minimo: 6, areaMin: 0.25 },
    { id: 'p5', nome: 'Kit perfil de alumínio para box', cat: 'Alumínio', unidade: 'ml', preco: 89, estoque: 58, minimo: 20, areaMin: 0 },
    { id: 'p6', nome: 'Corrimão e perfil para guarda-corpo', cat: 'Alumínio', unidade: 'ml', preco: 145, estoque: 14, minimo: 15, areaMin: 0 },
    { id: 'p7', nome: 'Puxador tubular inox 30 cm', cat: 'Ferragens', unidade: 'un', preco: 78, estoque: 15, minimo: 5, areaMin: 0 },
    { id: 'p8', nome: 'Kit ferragem porta pivotante', cat: 'Ferragens', unidade: 'un', preco: 420, estoque: 4, minimo: 3, areaMin: 0 },
    { id: 'p9', nome: 'Película jateada decorativa', cat: 'Acabamento', unidade: 'm2', preco: 75, estoque: 40, minimo: 10, areaMin: 0.25 },
    { id: 'p10', nome: 'Instalação (mão de obra)', cat: 'Serviços', unidade: 'm2', preco: 60, estoque: null, minimo: 0, areaMin: 1 }
  ];
  const clientes = [
    { id: 'c1', nome: 'Mariana Toledo', tel: '(11) 98000-1201', email: 'mariana@exemplo.com', cidade: 'Jardim das Flores', doc: '' },
    { id: 'c2', nome: 'Construtora Horizonte (fictícia)', tel: '(11) 98000-1202', email: 'obras@horizonte.exemplo', cidade: 'Centro', doc: '00.000.000/0001-00' },
    { id: 'c3', nome: 'Rafael Antunes', tel: '(11) 98000-1203', email: 'rafa.antunes@exemplo.com', cidade: 'Vila Nova', doc: '' },
    { id: 'c4', nome: 'Clínica Sorriso Leve (fictícia)', tel: '(11) 98000-1204', email: 'adm@sorrisoleve.exemplo', cidade: 'Centro', doc: '' },
    { id: 'c5', nome: 'Patrícia Mendes', tel: '(11) 98000-1205', email: 'patimendes@exemplo.com', cidade: 'Parque Alto', doc: '' },
    { id: 'c6', nome: 'Café Esquina (fictício)', tel: '(11) 98000-1206', email: 'contato@cafeesquina.exemplo', cidade: 'Vila Nova', doc: '' },
    { id: 'c7', nome: 'Jorge e Lúcia Prado', tel: '(11) 98000-1207', email: 'prado.casa@exemplo.com', cidade: 'Jardim das Flores', doc: '' },
    { id: 'c8', nome: 'Academia Ritmo (fictícia)', tel: '(11) 98000-1208', email: 'gerencia@ritmo.exemplo', cidade: 'Parque Alto', doc: '' }
  ];
  // [diasAtrás, cliente, status, itens [prod, l|c, a, q], desc%, frete, prazo, convertido]
  const plano = [
    [168, 'c2', 'aprovado', [['p3', 1.1, 1.0, 14], ['p6', 15.4, 0, 1], ['p10', 1.1, 1.0, 14]], 5, 0, 20, true],
    [160, 'c1', 'aprovado', [['p1', 0.9, 1.9, 2], ['p5', 4.2, 0, 1], ['p10', 1.8, 1.9, 1]], 0, 60, 10, true],
    [150, 'c3', 'recusado', [['p4', 1.2, 0.9, 1]], 0, 40, 7, false],
    [133, 'c4', 'aprovado', [['p9', 1.0, 1.0, 6], ['p10', 1.0, 1.0, 6]], 0, 0, 5, true],
    [120, 'c5', 'aprovado', [['p1', 1.0, 2.1, 1], ['p8', 0, 0, 1], ['p7', 0, 0, 1]], 0, 60, 12, true],
    [104, 'c6', 'recusado', [['p2', 2.4, 1.2, 2]], 3, 80, 12, false],
    [96, 'c7', 'aprovado', [['p4', 1.6, 1.0, 1], ['p4', 0.6, 1.2, 2]], 0, 50, 7, true],
    [82, 'c8', 'aprovado', [['p4', 2.0, 1.8, 4], ['p10', 2.0, 1.8, 4]], 8, 0, 15, true],
    [70, 'c3', 'aprovado', [['p1', 0.8, 1.9, 2], ['p5', 4.0, 0, 1]], 0, 60, 10, true],
    [58, 'c2', 'recusado', [['p3', 1.2, 1.0, 10], ['p6', 12, 0, 1]], 6, 0, 25, false],
    [44, 'c5', 'aprovado', [['p9', 1.4, 0.9, 3]], 0, 30, 5, true],
    [33, 'c1', 'aprovado', [['p4', 1.2, 0.8, 1], ['p7', 0, 0, 2]], 0, 40, 7, true],
    [24, 'c6', 'aprovado', [['p1', 1.5, 2.2, 2], ['p8', 0, 0, 1], ['p7', 0, 0, 2], ['p10', 1.5, 2.2, 2]], 5, 0, 15, true],
    [12, 'c7', 'aprovado', [['p1', 0.95, 1.9, 2], ['p5', 4.3, 0, 1], ['p10', 1.9, 1.9, 1]], 0, 60, 10, false],
    [9, 'c4', 'enviado', [['p2', 1.8, 1.2, 3], ['p10', 1.8, 1.2, 3]], 5, 0, 12, false],
    [7, 'c8', 'enviado', [['p4', 3.0, 2.0, 2]], 0, 90, 10, false],
    [5, 'c3', 'recusado', [['p9', 0.9, 2.0, 2]], 0, 30, 5, false],
    [3, 'c5', 'aprovado', [['p1', 1.0, 1.0, 3], ['p6', 6.0, 0, 1]], 0, 50, 12, false],
    [2, 'c2', 'enviado', [['p3', 1.1, 1.0, 18], ['p6', 19.8, 0, 1], ['p10', 1.1, 1.0, 18]], 6, 0, 25, false],
    [0, 'c1', 'rascunho', [['p4', 1.4, 0.7, 1]], 0, 40, 7, false]
  ];
  const map = Object.fromEntries(produtos.map(p => [p.id, p]));
  const orcamentos = [], pedidos = [];
  let n = 0, np = 0;
  const pagamentos = ['50% na aprovação e 50% na instalação', 'PIX à vista com 5% já aplicado', 'Cartão em até 6x sem juros'];
  plano.forEach((pl, i) => {
    const [dias, cli, status, itens, desc, frete, prazo, conv] = pl;
    const data = addDays(hoje, -dias);
    n++;
    const o = {
      id: 'o' + n,
      num: 'ORC-' + data.getFullYear() + '-' + pad(n + 40, 4),
      cliente: cli, data: isoLocal(data), validade: isoLocal(addDays(data, 15)),
      prazo, status, descTipo: '%', desc, frete,
      pagamento: pagamentos[i % 3],
      obs: i === 18 ? 'Guarda-corpo da sacada do 2º ao 5º andar. Medidas conferidas na obra.' : 'Medidas sujeitas a conferência no local antes da produção.',
      itens: itens.map(([pid, a1, a2, q]) => {
        const p = map[pid];
        const it = { prod: pid, p: p.preco, q, l: 0, a: 0, c: 0 };
        if (p.unidade === 'm2') { it.l = a1; it.a = a2; }
        else if (p.unidade === 'ml') { it.c = a1; }
        else { it.q = q; }
        return it;
      }),
      pedido: null
    };
    if (conv) {
      np++;
      const pd = { id: 'd' + np, num: 'PED-' + pad(np + 20, 4), orc: o.id, data: isoLocal(addDays(data, 2)), status: dias > 20 ? 'Instalado' : 'Em produção' };
      o.pedido = pd.id;
      pedidos.push(pd);
    }
    orcamentos.push(o);
  });
  return { produtos, clientes, orcamentos, pedidos, seq: { orc: n + 40, ped: np + 20 } };
}

function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* sem storage */ }
  const db = seed();
  saveDB(db);
  return db;
}
function saveDB(db) { try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) { } }

const LOGO_SVG = `<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="lg-cr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fc4c4"/><stop offset="1" stop-color="#2b6f76"/></linearGradient></defs><path d="M24 3 43 14v20L24 45 5 34V14z" fill="url(#lg-cr)"/><path d="M24 3v42M5 14l38 20M43 14 5 34" stroke="#fff" stroke-opacity=".45" stroke-width="1.2"/><path d="M15 12l9-5 9 5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>`;

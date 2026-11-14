/* Rota Junto · app de caronas entre cidades (PWA)
   Marca, pessoas e dados fictícios. Projeto demonstrativo de Evelyn Luane.
   Tudo roda no navegador: nada é cobrado, enviado ou verificado de verdade. */
'use strict';

/* ================= utilidades ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = v => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const QS = new URLSearchParams(location.search);
const VITRINE = QS.get('v');               // modo vitrine: tela fixa, sem salvar nada
const KEY = 'rotajunto.v1';
const espera = ms => new Promise(r => setTimeout(r, ms));
function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let a = seed; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const pad = n => String(n).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const hoje = () => iso(new Date());
const somaDias = (s, n) => { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() + n); return iso(d); };
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
function fmtData(s, curto) {
  if (s === hoje()) return 'Hoje';
  if (s === somaDias(hoje(), 1)) return 'Amanhã';
  const d = new Date(s + 'T12:00');
  return (curto ? '' : DIAS[d.getDay()] + ', ') + d.getDate() + ' ' + MESES[d.getMonth()];
}
const minParaHora = m => pad(Math.floor(m / 60) % 24) + ':' + pad(m % 60);
const horaParaMin = h => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
const agoraTxt = () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };

/* ================= ícones ================= */
const P = {
  home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>',
  busca: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  rota: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h8"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  sino: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
  troca: '<path d="M7 4v16M7 4 3 8M7 4l4 4M17 20V4M17 20l-4-4M17 20l4-4"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pessoas: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
  pino: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
  alvo: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  voltar: '<path d="M15 5 8 12l7 7"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  escudo: '<path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  estrela: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  dir: '<path d="m9 5 7 7-7 7"/>',
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  lua: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
  enviar: '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  cartao: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
  dinheiro: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  mala: '<rect x="5" y="7" width="14" height="13" rx="2"/><path d="M9 7V4h6v3M9 11v5M15 11v5"/>',
  pata: '<circle cx="6" cy="11" r="1.8"/><circle cx="9.5" cy="6.5" r="1.8"/><circle cx="14.5" cy="6.5" r="1.8"/><circle cx="18" cy="11" r="1.8"/><path d="M12 12c-3 0-5 3.5-5 5.5S9 20 12 19s5 .5 5-1.5-2-5.5-5-5.5Z"/>',
  musica: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  neve: '<path d="M12 2v20M4 7l16 10M20 7 4 17"/>',
  semfumo: '<path d="M3 16h12v3H3zM18 16h3v3h-3M4 4l16 16"/>',
  doc: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="11" r="2"/><path d="M6 16a3 3 0 0 1 5 0M14 10h4M14 13h4"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  cel: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  sair: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  baixar: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
  alerta: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.01"/>',
  volante: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M3.5 10.5 10 12M20.5 10.5 14 12M12 14v7"/>',
  lixo: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  refaz: '<path d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4"/>',
  compart: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
  carro: '<path d="M5 16V11l2-5h10l2 5v5"/><path d="M3 16h18v3H3zM5 11h14"/><circle cx="7.5" cy="13.5" r=".6"/><circle cx="16.5" cy="13.5" r=".6"/>',
  tema: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/>'
};
const ic = (n, c = '') => `<svg class="i ${c}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;
const LOGO = (s = 30) => `<svg width="${s}" height="${s}" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="18" fill="#0E5E4E"/><path d="M16 46c6-14 26-8 32-26" stroke="#F4EFE4" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="16" cy="46" r="6" fill="#E3912A"/><circle cx="48" cy="20" r="6" fill="#F4EFE4"/></svg>`;

/* ================= dados fictícios ================= */
const CIDADES = {
  'São Paulo': [-23.55, -46.63], 'Campinas': [-22.91, -47.06], 'Sorocaba': [-23.50, -47.46],
  'Piracicaba': [-22.73, -47.65], 'Itapetininga': [-23.59, -48.05], 'Botucatu': [-22.89, -48.44],
  'Jaú': [-22.30, -48.56], 'Avaré': [-23.10, -48.93], 'Bauru': [-22.31, -49.06],
  'Ourinhos': [-22.98, -49.87], 'Marília': [-22.21, -49.95], 'Ribeirão Preto': [-21.18, -47.81]
};
const NOMES_C = Object.keys(CIDADES).sort((a, b) => a.localeCompare(b, 'pt-BR'));
function distKm(a, b) {
  const [la1, lo1] = CIDADES[a], [la2, lo2] = CIDADES[b], R = 6371, r = Math.PI / 180;
  const dla = (la2 - la1) * r, dlo = (lo2 - lo1) * r;
  const h = Math.sin(dla / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(dlo / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 1.22);   // fator de estrada aproximado
}
const precoSugerido = km => Math.max(15, Math.round(km * 0.26 / 5) * 5);
const duracaoMin = km => Math.round(km / 80 * 60 / 5) * 5 + 10;

const PELES = ['#F3CDA8', '#E3AC80', '#C98A62', '#97613F', '#634029'];
const MOTORISTAS = [
  { id: 'm1', nome: 'Marina Couto', av: { p: 1, c: '#3B2418', e: 'longo', f: '#F6D9A8', r: '#0E5E4E' }, nota: '4,9', carro: 'Hatch prata', placa: 'RJT4E21', desde: 2023, bio: 'Faço Botucatu ↔ São Paulo toda semana para trabalhar. Gosto de pontualidade e conversa leve.', prefs: ['mala', 'neve', 'musica'] },
  { id: 'm2', nome: 'Rafael Toledo', av: { p: 2, c: '#1E1612', e: 'curto', f: '#CFE6DD', r: '#33475B' }, nota: '4,8', carro: 'Sedã branco', placa: 'QWE7B04', desde: 2024, bio: 'Engenheiro, viajo a Campinas e Sorocaba com frequência. Carro revisado e sem pressa.', prefs: ['mala', 'semfumo', 'neve'] },
  { id: 'm3', nome: 'Júlia Prado', av: { p: 0, c: '#8A4B22', e: 'coque', f: '#F2D3D0', r: '#B3402D' }, nota: '5,0', carro: 'Hatch vermelho', placa: 'BTU2C88', desde: 2025, bio: 'Estudo em Bauru e volto para casa nos fins de semana. Aceito pet pequeno na caixinha.', prefs: ['pata', 'musica', 'semfumo'] },
  { id: 'm4', nome: 'Caio Menezes', av: { p: 4, c: '#111', e: 'cacheado', f: '#DCE3F5', r: '#E3912A' }, nota: '4,7', carro: 'SUV cinza', placa: 'KLM9D31', desde: 2022, bio: 'Representante comercial, rodo o interior toda semana. Porta-malas grande.', prefs: ['mala', 'neve', 'pata'] },
  { id: 'm5', nome: 'Beatriz Lemos', av: { p: 3, c: '#1A1210', e: 'cacheado', f: '#FBE5C8', r: '#5B3F8C' }, nota: '4,9', carro: 'Sedã azul', placa: 'PRA5F12', desde: 2024, bio: 'Professora, faço Piracicaba e Campinas. Prefiro viagens tranquilas, sem fumo.', prefs: ['semfumo', 'neve'] },
  { id: 'm6', nome: 'Otávio Ramos', av: { p: 1, c: '#6B6B6B', e: 'barba', f: '#E0ECD2', r: '#2C3E35' }, nota: '4,8', carro: 'Hatch preto', placa: 'AVR3G67', desde: 2021, bio: 'Aposentado, visito a família em Avaré e Ourinhos. Saio cedo e paro no caminho para café.', prefs: ['musica', 'mala'] },
  { id: 'm7', nome: 'Lúcia Andrade', av: { p: 2, c: '#2A1A12', e: 'longo', f: '#D8E9F0', r: '#0E5E4E' }, nota: '4,9', carro: 'Minivan prata', placa: 'MRL8H45', desde: 2023, bio: 'Viajo com espaço sobrando entre Marília, Bauru e Ribeirão Preto.', prefs: ['mala', 'pata', 'neve'] },
  { id: 'm8', nome: 'Diego Sartori', av: { p: 0, c: '#C08A3E', e: 'curto', f: '#F5E1C6', r: '#1F3A5F' }, nota: '4,6', carro: 'Sedã grafite', placa: 'SRC1J90', desde: 2025, bio: 'Faço Sorocaba ↔ São Paulo de segunda a sexta. Ponto de encontro sempre em local movimentado.', prefs: ['semfumo', 'musica'] }
];
const motorista = id => MOTORISTAS.find(m => m.id === id) || EU_MOT;
const EU = { nome: 'Helena Duarte', av: { p: 1, c: '#4A2C1C', e: 'coque', f: '#D6E9E1', r: '#E3912A' } };
const EU_MOT = { id: 'eu', nome: 'Você', av: EU.av, nota: '—', carro: 'Seu carro', placa: '', prefs: [] };
const PASSAGEIROS = [
  { nome: 'Pedro Alencar', av: { p: 2, c: '#151515', e: 'curto', f: '#E7E1F5', r: '#33475B' } },
  { nome: 'Sofia Brandão', av: { p: 0, c: '#9C5A2C', e: 'longo', f: '#FBE5C8', r: '#B3402D' } },
  { nome: 'Tiago Moura', av: { p: 3, c: '#111', e: 'barba', f: '#DCEFE2', r: '#0E5E4E' } }
];
const PREF = { mala: ['mala', 'Bagagem média'], neve: ['neve', 'Ar-condicionado'], musica: ['musica', 'Música baixa'], pata: ['pata', 'Aceita pet pequeno'], semfumo: ['semfumo', 'Sem fumar'] };

/* avatar ilustrado */
let avN = 0;
function avatar(a, s = 48) {
  const sk = PELES[a.p], h = a.c;
  const topo = {
    curto: `<path d="M20.5 27c-.6-9 4.6-14.5 11.5-14.5S44.1 18 43.5 27c-2.4-4.2-6.8-6.4-11.5-6.4S22.9 22.8 20.5 27z" fill="${h}"/>`,
    longo: `<path d="M17.5 31c0-12 6.5-19 14.5-19s14.5 7 14.5 19v15h-29z" fill="${h}"/>`,
    coque: `<circle cx="32" cy="12.5" r="5.5" fill="${h}"/><path d="M20.5 27c-.4-8.6 4.8-13.5 11.5-13.5S43.9 18.4 43.5 27c-3-4.6-7-6.2-11.5-6.2S23.5 22.4 20.5 27z" fill="${h}"/>`,
    cacheado: `<g fill="${h}"><circle cx="21.5" cy="25" r="5"/><circle cx="25" cy="18" r="5.5"/><circle cx="32" cy="15" r="6"/><circle cx="39" cy="18" r="5.5"/><circle cx="42.5" cy="25" r="5"/></g>`,
    barba: `<path d="M21 26c0-7.5 5-12 11-12s11 4.5 11 12c-2-3-6-4.4-11-4.4S23 23 21 26z" fill="${h}"/>`
  }[a.e];
  const frente = a.e === 'longo' ? `<path d="M20.5 27.5c.2-8.5 5-14 11.5-14s11.3 5.5 11.5 14c-5-1-9.6-3.8-11.5-7.6-2 3.8-6.5 6.6-11.5 7.6z" fill="${h}"/>` : '';
  const barba = a.e === 'barba' ? `<path d="M21.2 30c.8 7.6 5 11.6 10.8 11.6S42 37.6 42.8 30c-2.2 2.6-5.4 3.6-10.8 3.6S23.4 32.6 21.2 30z" fill="${h}"/>` : '';
  const cid = 'av' + (++avN);
  return `<svg class="av" width="${s}" height="${s}" viewBox="0 0 64 64" aria-hidden="true"><clipPath id="${cid}"><circle cx="32" cy="32" r="32"/></clipPath><g clip-path="url(#${cid})"><rect width="64" height="64" fill="${a.f}"/>
  ${a.e === 'longo' ? topo : ''}
  <path d="M9 66c2-13 11-20 23-20s21 7 23 20z" fill="${a.r}"/>
  <rect x="27" y="36" width="10" height="11" rx="4" fill="${sk}"/>
  <ellipse cx="32" cy="28.5" rx="11" ry="12.5" fill="${sk}"/>
  ${a.e === 'longo' ? frente : topo}${barba}
  <circle cx="28" cy="29.5" r="1.4" fill="#2a1d15"/><circle cx="36" cy="29.5" r="1.4" fill="#2a1d15"/>
  <path d="M28.6 ${a.e === 'barba' ? 35.4 : 34.6}q3.4 2.6 6.8 0" stroke="${a.e === 'barba' ? '#F3E3D3' : '#2a1d15'}" stroke-width="1.5" fill="none" stroke-linecap="round"/></g></svg>`;
}

/* mapa estilizado em SVG */
const MAPA = { lo0: -50.35, lo1: -46.25, la0: -20.85, la1: -23.95 };
const ESTRADAS = [['São Paulo', 'Campinas'], ['São Paulo', 'Sorocaba'], ['Campinas', 'Piracicaba'], ['Campinas', 'Ribeirão Preto'], ['Sorocaba', 'Itapetininga'], ['Sorocaba', 'Botucatu'], ['Itapetininga', 'Avaré'], ['Piracicaba', 'Botucatu'], ['Botucatu', 'Jaú'], ['Botucatu', 'Avaré'], ['Botucatu', 'Bauru'], ['Jaú', 'Bauru'], ['Avaré', 'Ourinhos'], ['Bauru', 'Marília'], ['Marília', 'Ourinhos'], ['Jaú', 'Ribeirão Preto'], ['Piracicaba', 'Jaú']];
let mapaN = 0;
function mapa(o, d, { w = 360, h = 240, rotulos = true, anim = true, carro = false, foco = true } = {}) {
  const id = 'mp' + (++mapaN);
  let { lo0, lo1, la0, la1 } = MAPA;
  if (foco && o && d) {     // enquadra a rota
    const A = CIDADES[o], B = CIDADES[d];
    const cx = (A[1] + B[1]) / 2, cy = (A[0] + B[0]) / 2;
    let sx = Math.abs(A[1] - B[1]) * 1.9 + .7, sy = Math.abs(A[0] - B[0]) * 1.9 + .55;
    if (sx / sy > w / h) sy = sx * h / w; else sx = sy * w / h;
    lo0 = cx - sx / 2; lo1 = cx + sx / 2; la0 = cy + sy / 2; la1 = cy - sy / 2;
  }
  const X = lo => (lo - lo0) / (lo1 - lo0) * w, Y = la => (la - la0) / (la1 - la0) * h;
  const pt = c => [X(CIDADES[c][1]), Y(CIDADES[c][0])];
  const k = w / ((lo1 - lo0) * 90);   // escala para traços decorativos
  let s = `<svg class="mapa" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Mapa ilustrativo${o ? ' da rota ' + esc(o) + ' a ' + esc(d) : ''}">
  <defs><pattern id="${id}g" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0V22" fill="none" stroke="var(--map-land2)" stroke-width=".6"/></pattern></defs>
  <rect width="${w}" height="${h}" fill="var(--map-bg)"/><rect width="${w}" height="${h}" fill="url(#${id}g)"/>`;
  // manchas de relevo e rio (decorativos)
  const rel = [[-49.4, -22.6, 1.1], [-47.8, -22.2, .9], [-48.6, -23.4, .8], [-47.0, -23.2, .7]];
  rel.forEach(([lo, la, r]) => { s += `<ellipse cx="${X(lo)}" cy="${Y(la)}" rx="${r * 90 * k}" ry="${r * 60 * k}" fill="var(--map-land)"/>`; });
  const rio = [[-46.4, -23.5], [-47.3, -23.0], [-48.0, -22.75], [-48.6, -22.55], [-49.3, -21.9], [-50.3, -21.3]];
  s += `<path d="M${rio.map(([lo, la]) => X(lo) + ' ' + Y(la)).join(' L')}" fill="none" stroke="var(--map-river)" stroke-width="${Math.max(3, 5 * k)}" stroke-linejoin="round" stroke-linecap="round" opacity=".9"/>`;
  ESTRADAS.forEach(([a, b]) => { const [x1, y1] = pt(a), [x2, y2] = pt(b); s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--map-road)" stroke-width="${Math.max(2, 3.2 * k)}" stroke-linecap="round"/>`; });
  Object.keys(CIDADES).forEach(c => {
    if (c === o || c === d) return;
    const [x, y] = pt(c); if (x < -20 || x > w + 20 || y < -20 || y > h + 20) return;
    s += `<circle cx="${x}" cy="${y}" r="3" fill="var(--map-text)" opacity=".55"/>`;
    if (rotulos) s += `<text x="${x + 6}" y="${y + 3.5}" font-size="9.5" fill="var(--map-text)" opacity=".8">${esc(c)}</text>`;
  });
  if (o && d) {
    const [x1, y1] = pt(o), [x2, y2] = pt(d);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1;
    const cx = mx - dy * .18, cy = my + dx * .18;
    const path = `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`;
    s += `<path d="${path}" fill="none" stroke="var(--surface)" stroke-width="9" stroke-linecap="round" opacity=".9"/>
    <path id="${id}r" d="${path}" fill="none" stroke="var(--primary)" stroke-width="4.5" stroke-linecap="round" class="${anim ? 'rota-desenha' : ''}"/>`;
    if (carro) s += `<g><circle r="9" fill="var(--accent)" stroke="var(--surface)" stroke-width="3"/><animateMotion dur="6s" repeatCount="indefinite" rotate="0"><mpath href="#${id}r"/></animateMotion></g>`;
    const pino = (x, y, cor, txt, lado) => `<g transform="translate(${x} ${y})"><circle r="11" fill="${cor}" opacity=".18"/><circle r="6.5" fill="${cor}" stroke="var(--surface)" stroke-width="3"/></g>` +
      (rotulos ? `<g transform="translate(${x} ${y - 16})"><rect x="${lado ? -txt.length * 3.4 - 8 : -txt.length * 3.4 - 8}" y="-12" width="${txt.length * 6.8 + 16}" height="20" rx="10" fill="var(--surface)" stroke="var(--line)"/><text text-anchor="middle" y="2.5" font-size="11" fill="var(--text)">${esc(txt)}</text></g>` : '');
    s += pino(x1, y1, 'var(--primary)', o) + pino(x2, y2, 'var(--accent)', d, 1);
  }
  return s + '</svg>';
}

/* QR fictício (padrão decorativo, não é um Pix real) */
function qrFake(seed) {
  const r = rng(hash(seed)), n = 25, c = 160 / n; let s = `<svg class="qr" viewBox="0 0 160 160" role="img" aria-label="QR fictício de demonstração">`;
  const olho = (x, y) => `<rect x="${x}" y="${y}" width="${c * 7}" height="${c * 7}" fill="#111"/><rect x="${x + c}" y="${y + c}" width="${c * 5}" height="${c * 5}" fill="#fff"/><rect x="${x + c * 2}" y="${y + c * 2}" width="${c * 3}" height="${c * 3}" fill="#111"/>`;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if ((i < 8 && j < 8) || (i < 8 && j > n - 9) || (i > n - 9 && j < 8)) continue;
    if (r() > .52) s += `<rect x="${i * c}" y="${j * c}" width="${c}" height="${c}" fill="#111"/>`;
  }
  return s + olho(0, 0) + olho(c * (n - 7), 0) + olho(0, c * (n - 7)) + `<rect x="58" y="70" width="44" height="20" rx="4" fill="#fff"/><text x="80" y="84" text-anchor="middle" font-size="11" font-weight="800" font-family="sans-serif" fill="#B3402D">DEMO</text></svg>`;
}

/* ================= estado ================= */
function estadoInicial() {
  const h = hoje();
  return {
    onb: false, logado: false, tema: 'sistema', notifOn: true,
    verif: { email: true, tel: true, doc: 'nao', tipo: 'CNH' },
    reservas: [], ofertas: [],
    historico: [
      { id: 'h1', o: 'Botucatu', d: 'Bauru', data: somaDias(h, -12), hora: '08:10', mot: 'm3', preco: 25, papel: 'passageiro' },
      { id: 'h2', o: 'São Paulo', d: 'Botucatu', data: somaDias(h, -26), hora: '18:30', mot: 'm1', preco: 60, papel: 'passageiro' }
    ],
    conversas: {
      m1: { lida: true, msgs: [
        { de: 'ele', t: '18:02', txt: 'Oi, Helena! Cheguei no ponto, estou no carro prata em frente à rodoviária.' },
        { de: 'eu', t: '18:04', txt: 'Perfeito, já estou indo! 2 minutinhos.' },
        { de: 'sistema', txt: 'Viagem concluída · São Paulo → Botucatu' },
        { de: 'ele', t: '21:15', txt: 'Obrigada pela companhia, boa semana!' }
      ] }
    },
    notifs: [{ ic: 'escudo', titulo: 'Bem-vinda ao Rota Junto', txt: 'Complete a verificação do perfil para reservar com mais confiança.', t: 'hoje', nova: true }],
    busca: { o: 'São Paulo', d: 'Botucatu', data: somaDias(h, 1), pax: 1 }
  };
}
let S;
try { S = !VITRINE && JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
if (!S) S = estadoInicial();
function salvar() { if (VITRINE) return; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }

/* ================= caronas geradas ================= */
const CACHE_CARONAS = {};
const PONTOS = ['Rodoviária de {c}', 'Posto na saída da cidade, {c}', 'Praça central de {c}', 'Estacionamento do terminal, {c}'];
function caronas(o, d, data) {
  const r = rng(hash(o + d + data)), km = distKm(o, d), dur = duracaoMin(km), base = precoSugerido(km);
  const horas = ['05:40', '06:30', '07:15', '08:00', '09:30', '11:00', '13:20', '15:00', '17:10', '18:30', '19:45'];
  const qtd = 4 + Math.floor(r() * 3), lista = [];
  const usados = new Set();
  while (lista.length < qtd) {
    const hh = horas[Math.floor(r() * horas.length)]; if (usados.has(hh)) continue; usados.add(hh);
    const livres = MOTORISTAS.filter(x => !lista.some(c => c.mot === x.id));
    const m = livres[Math.floor(r() * livres.length)];
    const total = m.carro.includes('Minivan') ? 5 : 3, vagas = 1 + Math.floor(r() * total);
    const c = {
      id: [o, d, data, hh].join('|'), o, d, data, hora: hh, chegada: minParaHora(horaParaMin(hh) + dur + Math.round(r() * 2) * 5),
      dur, km, mot: m.id, preco: base + [-5, 0, 0, 5, 10][Math.floor(r() * 5)], vagas, total,
      embarque: PONTOS[Math.floor(r() * PONTOS.length)].replace('{c}', o), desembarque: PONTOS[Math.floor(r() * 2)].replace('{c}', d),
      verificado: r() > .2
    };
    lista.push(c); CACHE_CARONAS[c.id] = c;
  }
  return lista.sort((a, b) => a.hora.localeCompare(b.hora));
}
function carona(id) {
  if (CACHE_CARONAS[id]) return CACHE_CARONAS[id];
  const [o, d, data] = id.split('|'); caronas(o, d, data); return CACHE_CARONAS[id];
}

/* ================= navegação ================= */
const telas = $('#telas'), abas = $('#abas'), avisos = $('#avisos'), app = $('#app');
const ABAS = [['inicio', 'home', 'Início'], ['viagens', 'rota', 'Viagens'], ['oferecer', 'mais', 'Oferecer'], ['mensagens', 'chat', 'Mensagens'], ['perfil', 'user', 'Perfil']];
const pilha = [];
let atual = null;

function desenharAbas(ativa) {
  const nl = Object.values(S.conversas).filter(c => !c.lida).length;
  abas.innerHTML = ABAS.map(([k, i, t]) => k === 'oferecer'
    ? `<button data-aba="${k}" class="centro ${k === ativa ? 'ativa' : ''}" aria-label="${t}"><span class="bola">${ic(i)}</span>${t}</button>`
    : `<button data-aba="${k}" class="${k === ativa ? 'ativa' : ''}">${ic(i)}${t}${k === 'mensagens' && nl ? `<span class="badge">${nl}</span>` : ''}</button>`).join('');
}

function montar(nome, p) {
  const v = VIEWS[nome](p || {});
  const el = document.createElement('section');
  el.className = 'tela' + (v.aba ? ' com-abas' : '');
  el.dataset.tela = nome;
  el.innerHTML = v.html;
  return { el, v };
}
const EASE = 'cubic-bezier(.2,.8,.2,1)';
function ir(nome, p = {}, modo = 'push') {
  const { el, v } = montar(nome, p);
  const velho = atual;
  if (modo === 'pop') telas.insertBefore(el, velho); else telas.appendChild(el);
  v.depois && v.depois(el);
  if (modo === 'push') { pilha.push({ nome, p }); if (!VITRINE) history.pushState({ n: pilha.length }, ''); }
  else if (modo === 'substitui') pilha[pilha.length - 1] = { nome, p };
  else if (modo === 'raiz' || modo === 'aba') { pilha.length = 0; pilha.push({ nome, p }); }
  abas.classList.toggle('oculta', !v.aba);
  if (v.aba) desenharAbas(nome);
  atual = el;
  const fim = () => velho && velho.remove();
  if (!velho || modo === 'nada') return fim();
  setTimeout(fim, 520);   // garantia caso a animação não termine
  const t = { duration: 380, easing: EASE };
  if (modo === 'push' || modo === 'substitui') {
    el.animate([{ transform: 'translateX(100%)' }, { transform: 'none' }], t);
    velho.animate([{ transform: 'none', filter: 'brightness(1)' }, { transform: 'translateX(-28%)', filter: 'brightness(.85)' }], t).onfinish = fim;
  } else if (modo === 'pop') {
    el.animate([{ transform: 'translateX(-28%)', filter: 'brightness(.85)' }, { transform: 'none', filter: 'brightness(1)' }], t);
    velho.animate([{ transform: velho.style.transform || 'none' }, { transform: 'translateX(100%)' }], t).onfinish = fim;
  } else {
    el.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'ease-out' });
    velho.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).onfinish = fim;
  }
}
function voltar() { if (pilha.length < 2) return false; pilha.pop(); const a = pilha[pilha.length - 1]; ir(a.nome, a.p, 'pop'); return true; }
function pedirVoltar() { if (VITRINE) return voltar(); if (pilha.length > 1) history.back(); }
window.addEventListener('popstate', () => { voltar(); });
function refazer() {   // redesenha a tela atual sem animação
  const a = pilha[pilha.length - 1]; if (!a) return;
  const sc = $('.conteudo', atual)?.scrollTop || 0;
  const { el, v } = montar(a.nome, a.p);
  telas.replaceChild(el, atual); atual = el; v.depois && v.depois(el);
  const c = $('.conteudo', el); if (c) c.scrollTop = sc;
  if (v.aba) desenharAbas(a.nome);
}
const topo = (titulo, sub = '', extra = '') => `<header class="topo"><button class="ico-btn" data-acao="voltar" aria-label="Voltar">${ic('voltar')}</button><h1>${titulo}${sub ? `<small>${sub}</small>` : ''}</h1>${extra}</header>`;

/* ================= avisos e notificações ================= */
function toast(txt) {
  $('.toast', app)?.remove();
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = txt; app.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
function notificar(titulo, txt, icone = 'sino', guardar = true) {
  if (guardar) { S.notifs.unshift({ ic: icone, titulo, txt, t: agoraTxt(), nova: true }); salvar(); }
  if (!S.notifOn) return;
  const n = document.createElement('div'); n.className = 'notif'; n.setAttribute('role', 'status');
  n.innerHTML = `<span class="app-ic">${LOGO(38)}</span><div class="t"><b>Rota Junto <span>agora</span></b><p><strong>${esc(titulo)}</strong><br>${esc(txt)}</p></div>`;
  avisos.prepend(n);
  const sai = () => { n.classList.add('sai'); setTimeout(() => n.remove(), 320); };
  let y0 = null;
  n.addEventListener('pointerdown', e => { y0 = e.clientY; n.setPointerCapture(e.pointerId); });
  n.addEventListener('pointermove', e => { if (y0 !== null) n.style.transform = `translateY(${Math.min(0, e.clientY - y0)}px)`; });
  n.addEventListener('pointerup', e => { const dy = e.clientY - y0; y0 = null; if (dy < -30 || Math.abs(dy) < 4) sai(); else n.style.transform = ''; });
  if (!VITRINE) setTimeout(sai, 5200);
  // notificação do sistema, se a pessoa permitiu
  if (!VITRINE && 'Notification' in window && Notification.permission === 'granted' && document.hidden && navigator.serviceWorker?.controller) {
    navigator.serviceWorker.ready.then(r => r.showNotification(titulo, { body: txt, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' })).catch(() => { });
  }
  if (atual && ['inicio', 'notificacoes'].includes(atual.dataset.tela)) refazer();
}
function carregar(txt, ms = 1100) {
  const c = document.createElement('div'); c.className = 'carregando';
  c.innerHTML = `<div><div class="spinner"></div>${esc(txt)}</div>`; app.appendChild(c);
  return espera(ms).then(() => c.remove());
}
function folha(html, aoMontar) {
  const veu = document.createElement('div'); veu.className = 'veu';
  const f = document.createElement('div'); f.className = 'folha'; f.setAttribute('role', 'dialog');
  f.innerHTML = `<div class="pegador"></div>${html}`;
  app.append(veu, f);
  const fechar = () => {
    f.animate([{ transform: f.style.transform || 'none' }, { transform: 'translateY(100%)' }], { duration: 260, easing: EASE }).onfinish = () => f.remove();
    veu.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260 }).onfinish = () => veu.remove();
  };
  veu.onclick = fechar;
  // arrastar para baixo fecha
  let y0 = null;
  f.addEventListener('pointerdown', e => { if (e.target.closest('button,input,select,a')) return; y0 = e.clientY; f.setPointerCapture(e.pointerId); });
  f.addEventListener('pointermove', e => { if (y0 !== null) f.style.transform = `translateY(${Math.max(0, e.clientY - y0)}px)`; });
  f.addEventListener('pointerup', e => { if (y0 === null) return; const dy = e.clientY - y0; y0 = null; if (dy > 90) fechar(); else f.style.transform = ''; });
  aoMontar && aoMontar(f, fechar);
  return fechar;
}

/* ================= ilustrações ================= */
const ILU = [
  `<svg class="ilu" viewBox="0 0 320 240" aria-hidden="true"><rect x="10" y="20" width="300" height="200" rx="34" fill="var(--primary-soft)"/>
   <path d="M40 200C90 150 120 190 160 140S240 70 290 60" stroke="var(--surface)" stroke-width="26" fill="none" stroke-linecap="round"/>
   <path d="M40 200C90 150 120 190 160 140S240 70 290 60" stroke="var(--primary)" stroke-width="3" stroke-dasharray="10 10" fill="none"/>
   <circle cx="62" cy="182" r="14" fill="var(--primary)"/><circle cx="62" cy="182" r="5" fill="var(--surface)"/>
   <path d="M266 40c-11 0-19 8-19 18 0 14 19 30 19 30s19-16 19-30c0-10-8-18-19-18z" fill="var(--accent)"/><circle cx="266" cy="58" r="6" fill="var(--surface)"/>
   <g transform="translate(140 112) rotate(-28)"><rect x="-30" y="-14" width="60" height="28" rx="10" fill="var(--accent)"/><rect x="-16" y="-24" width="34" height="16" rx="6" fill="var(--accent)"/><rect x="-11" y="-20" width="11" height="10" rx="2" fill="var(--surface)"/><rect x="3" y="-20" width="11" height="10" rx="2" fill="var(--surface)"/><circle cx="-16" cy="14" r="7" fill="var(--text)"/><circle cx="16" cy="14" r="7" fill="var(--text)"/></g>
   <g opacity=".6" fill="var(--primary)"><circle cx="230" cy="170" r="22"/><circle cx="252" cy="182" r="16"/><circle cx="90" cy="70" r="16"/><circle cx="108" cy="80" r="12"/></g></svg>`,
  `<svg class="ilu" viewBox="0 0 320 240" aria-hidden="true"><rect x="10" y="20" width="300" height="200" rx="34" fill="var(--accent-soft)"/>
   <path d="M160 46 108 66v40c0 30 22 55 52 62 30-7 52-32 52-62V66z" fill="var(--primary)"/><path d="m136 108 17 17 32-34" stroke="var(--surface)" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
   <g transform="translate(46 130)"><circle r="30" fill="var(--surface)"/><g transform="translate(-26 -26) scale(.82)">AV1</g></g>
   <g transform="translate(274 130)"><circle r="30" fill="var(--surface)"/><g transform="translate(-26 -26) scale(.82)">AV2</g></g>
   <rect x="96" y="186" width="128" height="22" rx="11" fill="var(--surface)"/><text x="160" y="201" text-anchor="middle" font-size="11" font-weight="700" fill="var(--primary)" font-family="Manrope,sans-serif">documento conferido</text></svg>`,
  `<svg class="ilu" viewBox="0 0 320 240" aria-hidden="true"><rect x="10" y="20" width="300" height="200" rx="34" fill="var(--primary-soft)"/>
   <rect x="40" y="52" width="170" height="46" rx="20" fill="var(--surface)"/><rect x="58" y="68" width="110" height="8" rx="4" fill="var(--line)"/><rect x="58" y="80" width="70" height="8" rx="4" fill="var(--line)"/>
   <rect x="110" y="112" width="170" height="46" rx="20" fill="var(--primary)"/><rect x="128" y="128" width="120" height="8" rx="4" fill="var(--primary-ink)" opacity=".7"/><rect x="128" y="140" width="80" height="8" rx="4" fill="var(--primary-ink)" opacity=".45"/>
   <rect x="40" y="172" width="120" height="34" rx="17" fill="var(--surface)"/><circle cx="72" cy="189" r="5" fill="var(--muted)"/><circle cx="92" cy="189" r="5" fill="var(--muted)" opacity=".7"/><circle cx="112" cy="189" r="5" fill="var(--muted)" opacity=".4"/>
   <path d="M262 52c-12 0-21 9-21 20 0 15 21 32 21 32s21-17 21-32c0-11-9-20-21-20z" fill="var(--accent)"/><circle cx="262" cy="72" r="7" fill="var(--surface)"/></svg>`
];
function iluOnb(i) {
  if (i !== 1) return ILU[i];
  return ILU[1].replace('AV1', avatar(MOTORISTAS[2].av, 64)).replace('AV2', avatar(MOTORISTAS[1].av, 64));
}

/* ================= telas ================= */
const VIEWS = {};

VIEWS.onboarding = p => {
  const sl = [
    ['Divida a estrada, não o sossego.', 'Encontre quem já vai para a mesma cidade e pague só a sua parte do combustível e do pedágio.'],
    ['Perfis conferidos antes da viagem.', 'Motoristas e passageiros enviam documento e selfie. Você vê o carro, a placa e as regras antes de reservar.'],
    ['Combine tudo pelo chat do app.', 'Ponto de encontro, bagagem e horário ficam registrados na conversa, e o app te avisa quando a carona estiver chegando.']
  ];
  const i = +(p.i || 0);
  return {
    html: `<div class="onb">
      <div class="onb-topo"><span class="marca">${LOGO(30)} Rota Junto</span><button class="btn peq sec" data-acao="pular">Pular</button></div>
      <div class="onb-pista" style="transform:translateX(${-i * 100}%)">${sl.map((s, k) => `<div class="onb-slide">${iluOnb(k)}<h2>${s[0]}</h2><p>${s[1]}</p></div>`).join('')}</div>
      <div class="onb-pe"><div class="pontos">${sl.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
      <button class="btn prim" data-acao="onb-prox">${i === 2 ? 'Começar' : 'Próximo'} ${ic('dir', 's')}</button></div></div>`,
    depois(el) {
      let idx = i;
      const pista = $('.onb-pista', el), pts = $$('.pontos i', el), bt = $('[data-acao="onb-prox"]', el);
      const vai = n => { idx = Math.max(0, Math.min(2, n)); pista.style.transform = `translateX(${-idx * 100}%)`; pts.forEach((p, k) => p.classList.toggle('on', k === idx)); bt.innerHTML = (idx === 2 ? 'Começar' : 'Próximo') + ' ' + ic('dir', 's'); };
      el._vai = vai; el._idx = () => idx;
      let x0 = null, dx = 0;
      pista.addEventListener('pointerdown', e => { x0 = e.clientX; dx = 0; pista.style.transition = 'none'; });
      pista.addEventListener('pointermove', e => { if (x0 === null) return; dx = e.clientX - x0; pista.style.transform = `translateX(calc(${-idx * 100}% + ${dx}px))`; });
      const solta = () => { if (x0 === null) return; x0 = null; pista.style.transition = ''; if (dx < -50) vai(idx + 1); else if (dx > 50) vai(idx - 1); else vai(idx); };
      pista.addEventListener('pointerup', solta); pista.addEventListener('pointercancel', solta); pista.addEventListener('pointerleave', solta);
    }
  };
};

VIEWS.login = () => ({
  html: `<div class="login">
    <div class="topo-arte">${mapa('Botucatu', 'São Paulo', { w: 380, h: 180, rotulos: false, carro: true })}</div>
    <span class="selo ac" style="align-self:flex-start;margin-bottom:10px">Acesso de demonstração</span>
    <h1>Entre para reservar sua carona</h1>
    <p class="muted" style="margin:6px 0 0">Qualquer e-mail funciona. Nenhum dado sai do seu aparelho.</p>
    <form data-form="login" autocomplete="off">
      <div class="campo">${ic('email')}<label>E-mail<input name="email" type="email" value="helena@exemplo.com" required></label></div>
      <div class="campo">${ic('escudo')}<label>Senha<input name="senha" type="password" value="demo1234" required></label></div>
      <button class="btn prim bloco" type="submit">Entrar</button>
    </form>
    <div class="divisor">ou</div>
    <button class="btn borda bloco" data-acao="entrar">${ic('cel', 's')} Receber código por SMS (simulado)</button>
    <p class="rodape-demo">Rota Junto é uma marca fictícia · projeto demonstrativo</p>
  </div>`
});

function saudacao() { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }
function opcoes(sel) { return NOMES_C.map(c => `<option ${c === sel ? 'selected' : ''}>${esc(c)}</option>`).join(''); }
VIEWS.inicio = () => {
  const b = S.busca, h = hoje(), am = somaDias(h, 1);
  const novas = S.notifs.some(n => n.nova);
  const prox = S.reservas.filter(r => r.status === 'confirmada').sort((a, b) => (a.c.data + a.c.hora).localeCompare(b.c.data + b.c.hora))[0];
  const pops = [['São Paulo', 'Botucatu'], ['Botucatu', 'Bauru'], ['Campinas', 'Ribeirão Preto'], ['Sorocaba', 'São Paulo'], ['Marília', 'Bauru']];
  return {
    aba: true,
    html: `<header class="ola"><div class="t"><small>${saudacao()},</small><b>${EU.nome.split(' ')[0]}</b></div>
      <button class="ico-btn" data-go="notificacoes" aria-label="Notificações">${ic('sino')}${novas ? '<span class="ponto"></span>' : ''}</button></header>
    <div class="conteudo">
      <section class="hero">
        <h2>Para onde você vai <em>de carona</em>?</h2>
        <form data-form="busca">
          <div class="rota-campos">
            <div class="campo">${ic('alvo')}<label>Saindo de<select name="o">${opcoes(b.o)}</select></label></div>
            <div class="campo">${ic('pino')}<label>Indo para<select name="d">${opcoes(b.d)}</select></label></div>
            <button type="button" class="troca" data-acao="trocar" aria-label="Inverter origem e destino">${ic('troca', 's')}</button>
          </div>
          <div class="datas" role="group" aria-label="Data">
            <button type="button" class="chip ${b.data === h ? 'on' : ''}" data-data="${h}">Hoje</button>
            <button type="button" class="chip ${b.data === am ? 'on' : ''}" data-data="${am}">Amanhã</button>
            <label class="chip data-esc ${b.data !== h && b.data !== am ? 'on' : ''}">${ic('cal', 's')} ${b.data !== h && b.data !== am ? fmtData(b.data, 1) : 'Outra data'}<input type="date" name="data" min="${h}" value="${b.data}"></label>
          </div>
          <div class="linha-busca">
            <div class="campo" style="min-height:52px">${ic('pessoas')}<label>Passageiros<span style="font-weight:700;font-size:15px;color:var(--text)">${b.pax} ${b.pax > 1 ? 'pessoas' : 'pessoa'}</span></label>
              <div class="stepper"><button type="button" data-acao="pax" data-n="-1" aria-label="Menos">−</button><button type="button" data-acao="pax" data-n="1" aria-label="Mais">+</button></div></div>
          </div>
          <button class="btn prim bloco" style="margin-top:12px">${ic('busca', 's')} Buscar caronas</button>
        </form>
      </section>
      ${prox ? `<div class="secao-t"><h2>Sua próxima viagem</h2></div>
      <button class="cartao prox" data-go="detalhe" data-p='${esc(JSON.stringify({ res: prox.id }))}'>${avatar(motorista(prox.c.mot).av, 46)}
        <div style="flex:1"><b>${esc(prox.c.o)} → ${esc(prox.c.d)}</b><br><small class="muted">${fmtData(prox.c.data)} · ${prox.c.hora} · com ${esc(motorista(prox.c.mot).nome.split(' ')[0])}</small></div>${ic('dir')}</button>` : ''}
      <div class="secao-t"><h2>Rotas procuradas</h2><span>sugestões</span></div>
      <div class="populares">${pops.map(([o, d]) => `<button class="pop" data-acao="rota-pop" data-o="${o}" data-d="${d}">${mapa(o, d, { w: 156, h: 82, rotulos: false, anim: false })}<div><b>${o} → ${d}</b><small>${distKm(o, d)} km · a partir de ${brl(precoSugerido(distKm(o, d)) - 5)}</small></div></button>`).join('')}</div>
      <button class="banner-seg" data-go="seguranca"><span class="ic">${ic('escudo')}</span><span style="flex:1"><b>Viaje com segurança</b><small>Confira placa e foto, compartilhe a rota e pague só pelo app.</small></span>${ic('dir')}</button>
      <p class="rodape-demo">Marca fictícia · caronas, pessoas e notas são exemplos</p>
    </div>`
  };
};

VIEWS.resultados = p => {
  const { o, d, data, pax } = p;
  let lista = caronas(o, d, data).filter(c => c.vagas >= pax);
  const ord = p.ord || 'hora';
  if (ord === 'preco') lista = [...lista].sort((a, b) => a.preco - b.preco);
  if (p.verif) lista = lista.filter(c => c.verificado);
  const km = distKm(o, d);
  return {
    html: topo(`${esc(o)} → ${esc(d)}`, `${fmtData(data)} · ${pax} ${pax > 1 ? 'passageiros' : 'passageiro'} · ${km} km`, `<button class="ico-btn" data-acao="alerta-rota" aria-label="Criar alerta">${ic('sino')}</button>`) +
      `<div class="conteudo">
      <div class="chips" style="padding-top:4px;padding-bottom:4px">
        <button class="chip ${ord === 'hora' ? 'on' : ''}" data-acao="ordenar" data-ord="hora">${ic('relogio', 's')} Mais cedo</button>
        <button class="chip ${ord === 'preco' ? 'on' : ''}" data-acao="ordenar" data-ord="preco">${ic('dinheiro', 's')} Menor preço</button>
        <button class="chip ${p.verif ? 'on' : ''}" data-acao="so-verif">${ic('escudo', 's')} Só verificados</button>
      </div>
      <p class="muted tiny" style="margin:12px 2px 0">${lista.length} caronas encontradas · notas são exemplos</p>
      ${lista.length ? lista.map(c => cardCarona(c)).join('') : `<div class="vazio">${ic('carro', 'l')}<p>Nenhuma carona com ${pax} vagas nesse dia. Tente outra data ou crie um alerta.</p></div>`}
      <button class="btn borda bloco" style="margin-top:16px" data-acao="alerta-rota">${ic('sino', 's')} Avisar quando surgir carona nesta rota</button>
    </div>`
  };
};
function cardCarona(c) {
  const m = motorista(c.mot);
  return `<button class="carona" data-go="detalhe" data-p='${esc(JSON.stringify({ id: c.id }))}'>
    <div class="horarios"><b>${c.hora}</b><div class="traco"><span>${Math.floor(c.dur / 60)}h${pad(c.dur % 60)}</span></div><b>${c.chegada}</b></div>
    <div class="cidades"><span>${esc(c.o)}</span><span>${esc(c.d)}</span></div>
    <div class="pe">${avatar(m.av, 42)}<div class="nome"><b>${esc(m.nome)}</b><span class="nota">${ic('estrela')} ${m.nota} · nota de exemplo</span>${c.verificado ? ` <span class="selo" style="margin-left:2px">${ic('escudo', 's')} verificado</span>` : ''}</div>
    <div class="preco"><b>${brl(c.preco)}</b><small class="${c.vagas === 1 ? 'vagas-baixas' : ''}">${c.vagas} ${c.vagas > 1 ? 'vagas' : 'vaga'}</small></div></div></button>`;
}

VIEWS.detalhe = p => {
  const res = p.res ? S.reservas.find(r => r.id === p.res) : null;
  const c = res ? res.c : carona(p.id);
  const m = motorista(c.mot);
  const ocup = c.total - c.vagas;
  const reservada = res && res.status === 'confirmada';
  return {
    html: `<div class="det-mapa">${mapa(c.o, c.d, { w: 400, h: 250, carro: true })}
      <header class="topo"><button class="ico-btn" data-acao="voltar" aria-label="Voltar">${ic('voltar')}</button><span style="flex:1"></span><button class="ico-btn" data-acao="compartilhar" aria-label="Compartilhar viagem">${ic('compart')}</button></header></div>
    <div class="conteudo det-corpo">
      ${reservada ? `<div class="aviso verde" style="margin-top:0">${ic('check')}<div><b>Reserva confirmada · ${res.cod}</b><br>${res.lug} ${res.lug > 1 ? 'lugares' : 'lugar'} · ${res.pagTxt}</div></div>` : ''}
      ${res && res.status === 'cancelada' ? `<div class="aviso" style="margin-top:0">${ic('info')}<div>Reserva cancelada. Nenhum valor foi cobrado (simulação).</div></div>` : ''}
      <div class="det-linha" style="margin-top:6px"><h2 class="display" style="font-size:22px">${fmtData(c.data)}</h2><span class="selo cinza">${c.km} km · ${Math.floor(c.dur / 60)}h${pad(c.dur % 60)} (estimativa)</span></div>
      <div class="timeline">
        <div class="tl"><span class="h">${c.hora}</span><b>${esc(c.o)}</b><small>${esc(c.embarque)}</small></div>
        <div class="tl"><span class="h">${c.chegada}</span><b>${esc(c.d)}</b><small>${esc(c.desembarque)}</small></div>
      </div>
      <div class="cartao" style="margin-top:16px">
        <div class="motor">${avatar(m.av, 58)}<div class="t"><b>${esc(m.nome)}</b><span class="nota">${ic('estrela')} ${m.nota} · nota de exemplo</span><br>${c.verificado ? `<span class="selo ok">${ic('escudo', 's')} Documento verificado (simulado)</span>` : `<span class="selo cinza">Verificação pendente</span>`}</div></div>
        <p class="muted" style="font-size:13.5px;margin:12px 0 0">“${esc(m.bio)}”</p>
        <div class="prefs">${m.prefs.map(k => `<span class="pref">${ic(PREF[k][0])} ${PREF[k][1]}</span>`).join('')}</div>
      </div>
      <div class="cartao" style="margin-top:12px">
        <div class="det-linha"><span class="muted">Carro</span><b>${esc(m.carro)}</b></div>
        <div class="det-linha"><span class="muted">Placa</span><b style="letter-spacing:.08em">${esc(m.placa.slice(0, 3))}-${esc(m.placa.slice(3))}</b></div>
        <div class="det-linha"><span class="muted">Lugares livres</span><b>${c.vagas} de ${c.total}</b></div>
        <div class="assentos" aria-hidden="true">${Array.from({ length: c.total }, (_, k) => `<span class="assento ${k < ocup ? 'ocupado' : ''}" style="color:var(--primary)"></span>`).join('')}</div>
      </div>
      <button class="btn borda bloco" style="margin-top:14px" data-go="chat" data-p='${esc(JSON.stringify({ mid: m.id }))}'>${ic('chat', 's')} Conversar com ${esc(m.nome.split(' ')[0])}</button>
      ${reservada ? `<button class="btn perigo bloco" style="margin-top:10px" data-acao="cancelar-res" data-id="${res.id}">Cancelar reserva</button>` : ''}
      <p class="rodape-demo">Placa, motorista e nota são fictícios</p>
    </div>
    ${reservada || (res && res.status === 'cancelada') ? '' : `<footer class="rodape-acao"><div class="preco-pe"><small>por pessoa</small><b>${brl(c.preco)}</b></div><button class="btn prim" data-go="reserva" data-p='${esc(JSON.stringify({ id: c.id }))}' ${c.vagas ? '' : 'disabled'}>Reservar lugar</button></footer>`}`
  };
};

VIEWS.reserva = p => {
  const c = carona(p.id), m = motorista(c.mot);
  const lug = p.lug || Math.min(S.busca.pax, c.vagas), pag = p.pag || 'pix';
  const PAGS = [['pix', 'qr', 'Pix (simulado)', 'Gera um QR de demonstração'], ['cartao', 'cartao', 'Cartão de demonstração', '•••• 0000 · nenhum dado real'], ['dinheiro', 'dinheiro', 'Dinheiro ao motorista', 'Pague no embarque']];
  return {
    html: topo('Confirmar reserva', `${esc(c.o)} → ${esc(c.d)} · ${fmtData(c.data)} · ${c.hora}`) +
      `<div class="conteudo">
      <div class="cartao" style="display:flex;align-items:center;gap:12px">${avatar(m.av, 46)}<div style="flex:1"><b>${esc(m.nome)}</b><br><small class="muted">${esc(m.carro)} · saída ${c.hora} · ${esc(c.embarque)}</small></div></div>
      <div class="cartao" style="margin-top:12px;display:flex;align-items:center;justify-content:space-between">
        <div><b>Lugares</b><br><small class="muted">${c.vagas} disponíveis</small></div>
        <div class="stepper"><button data-acao="lug" data-n="-1" aria-label="Menos">−</button><output>${lug}</output><button data-acao="lug" data-n="1" aria-label="Mais">+</button></div>
      </div>
      <h2 style="font-size:16px;margin:22px 2px 0">Forma de pagamento</h2>
      ${PAGS.map(([k, i, t, s]) => `<button class="pag ${pag === k ? 'on' : ''}" data-acao="pag" data-pag="${k}"><span class="ic">${ic(i)}</span><span class="t"><b>${t}</b><small>${s}</small></span><span class="radio"></span></button>`).join('')}
      <div class="cartao resumo" style="margin-top:16px">
        <div class="det-linha"><span>${brl(c.preco)} × ${lug} ${lug > 1 ? 'lugares' : 'lugar'}</span><span>${brl(c.preco * lug)}</span></div>
        <div class="det-linha"><span class="muted">Taxa do app</span><span class="muted">${brl(0)} na demonstração</span></div>
        <div class="det-linha total"><span>Total</span><span>${brl(c.preco * lug)}</span></div>
      </div>
      <div class="aviso">${ic('info')}<div><b>Pagamento simulado.</b> Nenhum valor é cobrado e o app não pede dados bancários. Na versão real, o valor fica retido e só vai ao motorista depois da viagem.</div></div>
    </div>
    <footer class="rodape-acao"><button class="btn prim bloco" data-acao="confirmar-res">Confirmar · ${brl(c.preco * lug)}</button></footer>`
  };
};

VIEWS.confirmado = p => {
  const r = S.reservas.find(x => x.id === p.res) || S.reservas[0];
  const c = r.c, m = motorista(c.mot);
  const cores = ['var(--primary)', 'var(--accent)', '#E77B66', '#5DC48A'];
  return {
    html: `<div class="confete" aria-hidden="true">${Array.from({ length: 26 }, (_, k) => `<i style="left:${(k * 37) % 100}%;background:${cores[k % 4]};animation-delay:${(k % 7) * .12}s"></i>`).join('')}</div>
    <div class="conf">
      <svg class="check" viewBox="0 0 110 110" aria-hidden="true"><circle cx="55" cy="55" r="48" fill="var(--primary-soft)" stroke="var(--primary)" stroke-width="5"/><path d="m34 57 14 14 29-31" fill="none" stroke="var(--primary)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <h1>Reserva confirmada!</h1>
      <p class="muted" style="margin:6px 0 0">${esc(m.nome.split(' ')[0])} já foi avisada. Mostre o código no embarque.</p>
      <span class="codigo">${r.cod}</span>
      <div class="cartao" style="width:100%;text-align:left">
        <div class="det-linha"><span class="muted">Rota</span><b>${esc(c.o)} → ${esc(c.d)}</b></div>
        <div class="det-linha"><span class="muted">Saída</span><b>${fmtData(c.data)} · ${c.hora}</b></div>
        <div class="det-linha"><span class="muted">Embarque</span><b style="text-align:right;max-width:60%">${esc(c.embarque)}</b></div>
        <div class="det-linha"><span class="muted">Pagamento</span><b>${esc(r.pagTxt)}</b></div>
      </div>
      <div style="display:flex;gap:10px;width:100%;margin-top:16px">
        <button class="btn borda" style="flex:1" data-go="chat" data-p='${esc(JSON.stringify({ mid: m.id }))}'>${ic('chat', 's')} Mensagem</button>
        <button class="btn prim" style="flex:1" data-aba="viagens">Minhas viagens</button>
      </div>
      <p class="rodape-demo">Simulação · nenhum valor foi cobrado</p>
    </div>`,
    depois() { }
  };
};

VIEWS.oferecer = p => {
  const f = Object.assign({ o: 'Botucatu', d: 'São Paulo', data: somaDias(hoje(), 2), hora: '07:00', vagas: 3, encontro: '', prefs: ['mala', 'neve'] }, S.rascunho || {}, p);
  const km = f.o !== f.d ? distKm(f.o, f.d) : 0, sug = precoSugerido(km || 1);
  const preco = f.preco || sug;
  const docOk = S.verif.doc === 'ok';
  return {
    aba: true,
    html: `<header class="topo grande"><h1>Oferecer carona</h1></header>
    <div class="conteudo">
      <p class="muted" style="margin:-6px 2px 14px">Tem lugar sobrando? Divida o custo da estrada com quem vai para o mesmo lado.</p>
      <form data-form="oferta">
        <div class="rota-campos">
          <div class="campo">${ic('alvo')}<label>Saindo de<select name="o">${opcoes(f.o)}</select></label></div>
          <div class="campo">${ic('pino')}<label>Indo para<select name="d">${opcoes(f.d)}</select></label></div>
          <button type="button" class="troca" data-acao="trocar-of" aria-label="Inverter">${ic('troca', 's')}</button>
        </div>
        <div class="mini-mapa">${f.o !== f.d ? mapa(f.o, f.d, { w: 380, h: 150 }) : mapa(null, null, { w: 380, h: 150 })}</div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <div class="campo" style="flex:1.2">${ic('cal')}<label>Data<input type="date" name="data" min="${hoje()}" value="${f.data}"></label></div>
          <div class="campo" style="flex:1">${ic('relogio')}<label>Saída<input type="time" name="hora" value="${f.hora}"></label></div>
        </div>
        <div class="cartao" style="margin-top:12px;display:flex;align-items:center;justify-content:space-between">
          <div><b>Lugares oferecidos</b><br><small class="muted">sem contar você</small></div>
          <div class="stepper"><button type="button" data-acao="vagas" data-n="-1" aria-label="Menos">−</button><output>${f.vagas}</output><button type="button" data-acao="vagas" data-n="1" aria-label="Mais">+</button></div>
        </div>
        <div class="cartao" style="margin-top:12px">
          <div class="preco-sug"><div><small class="muted" style="font-weight:700">Preço por passageiro</small><br><b data-preco>${brl(preco)}</b></div>
          <span class="selo">${km ? `sugerido ${brl(sug)}` : 'escolha a rota'}</span></div>
          <input class="range" type="range" name="preco" min="${Math.max(10, Math.round(sug * .6 / 5) * 5)}" max="${Math.round(sug * 1.4 / 5) * 5}" step="5" value="${preco}" aria-label="Preço por passageiro">
          <small class="muted">Sugestão para ${km} km (estimativa), dividindo combustível e pedágio entre os ocupantes. A ideia é dividir custos, não lucrar com a viagem.</small>
        </div>
        <label class="campo-txt" for="enc">Ponto de encontro</label>
        <input class="input" id="enc" name="encontro" placeholder="Ex.: Rodoviária de ${esc(f.o)}, portão principal" value="${esc(f.encontro)}">
        <label class="campo-txt">Preferências da viagem</label>
        <div class="prefs" style="margin-top:0">${Object.entries(PREF).map(([k, [i, t]]) => `<button type="button" class="chip ${f.prefs.includes(k) ? 'on' : ''}" data-acao="pref" data-k="${k}">${ic(i, 's')} ${t}</button>`).join('')}</div>
        ${docOk ? `<div class="aviso verde">${ic('escudo')}<div>Seu documento está verificado (simulado). Sua carona aparece com o selo de verificado.</div></div>`
        : `<div class="aviso">${ic('alerta')}<div>Na versão real, só publica quem tem CNH verificada. Aqui você pode publicar mesmo assim. <a href="#" data-go="verificacao" style="color:inherit;font-weight:700">Verificar agora</a></div></div>`}
        <button class="btn prim bloco" style="margin-top:16px">${ic('carro', 's')} Publicar carona</button>
      </form>
      <p class="rodape-demo">Projeto demonstrativo · nenhuma carona é publicada de verdade</p>
    </div>`
  };
};

VIEWS.viagens = p => {
  const seg = p.seg || 'prox';
  const res = S.reservas.filter(r => r.status === 'confirmada').map(r => ({ tipo: 'res', k: r.c.data + r.c.hora, r }));
  const ofs = S.ofertas.map(o => ({ tipo: 'of', k: o.data + o.hora, o }));
  const prox = [...res, ...ofs].sort((a, b) => a.k.localeCompare(b.k));
  const hist = [...S.historico, ...S.reservas.filter(r => r.status === 'cancelada').map(r => ({ ...r.c, id: r.id, cancelada: true, papel: 'passageiro' }))];
  const card = it => {
    if (it.tipo === 'res') {
      const c = it.r.c, m = motorista(c.mot);
      return `<button class="carona" data-go="detalhe" data-p='${esc(JSON.stringify({ res: it.r.id }))}'>
        <div class="det-linha" style="padding:0 0 10px"><span class="selo">${ic('pessoas', 's')} Passageiro</span><span class="muted tiny">${fmtData(c.data)} · código ${it.r.cod}</span></div>
        <div class="horarios"><b>${c.hora}</b><div class="traco"><span>${c.km} km</span></div><b>${c.chegada}</b></div>
        <div class="cidades"><span>${esc(c.o)}</span><span>${esc(c.d)}</span></div>
        <div class="pe">${avatar(m.av, 36)}<div class="nome"><b>${esc(m.nome)}</b><span class="nota">${esc(m.carro)}</span></div><div class="preco"><b style="font-size:16px">${brl(c.preco * it.r.lug)}</b><small>${it.r.lug} ${it.r.lug > 1 ? 'lugares' : 'lugar'}</small></div></div></button>`;
    }
    const o = it.o, ac = o.pedidos.filter(x => x.st === 'ok').length, pend = o.pedidos.filter(x => x.st === 'pend').length;
    return `<button class="carona" data-go="minha-oferta" data-p='${esc(JSON.stringify({ id: o.id }))}'>
      <div class="det-linha" style="padding:0 0 10px"><span class="selo ac">${ic('volante', 's')} Motorista</span><span class="muted tiny">${fmtData(o.data)}</span></div>
      <div class="horarios"><b>${o.hora}</b><div class="traco"><span>${distKm(o.o, o.d)} km</span></div><b>${minParaHora(horaParaMin(o.hora) + duracaoMin(distKm(o.o, o.d)))}</b></div>
      <div class="cidades"><span>${esc(o.o)}</span><span>${esc(o.d)}</span></div>
      <div class="pe"><div class="nome"><b>${ac} de ${o.vagas} lugares reservados</b>${pend ? `<span class="selo ac">${pend} ${pend > 1 ? 'pedidos' : 'pedido'} aguardando</span>` : `<span class="nota">${brl(o.preco)} por pessoa</span>`}</div>${ic('dir')}</div></button>`;
  };
  return {
    aba: true,
    html: `<header class="topo grande"><h1>Minhas viagens</h1></header>
    <div class="conteudo">
      <div class="seg" role="tablist"><button class="${seg === 'prox' ? 'on' : ''}" data-acao="seg" data-seg="prox">Próximas (${prox.length})</button><button class="${seg === 'hist' ? 'on' : ''}" data-acao="seg" data-seg="hist">Anteriores</button></div>
      ${seg === 'prox' ? (prox.length ? prox.map(card).join('') : `<div class="vazio"><svg class="ilu" viewBox="0 0 150 110" aria-hidden="true"><rect x="5" y="10" width="140" height="90" rx="22" fill="var(--primary-soft)"/><path d="M25 85c25-30 40-5 60-30s30-25 45-30" stroke="var(--primary)" stroke-width="3" stroke-dasharray="6 6" fill="none"/><circle cx="25" cy="85" r="7" fill="var(--primary)"/><circle cx="130" cy="25" r="7" fill="var(--accent)"/></svg><p><b style="color:var(--text)">Nenhuma viagem marcada</b><br>Busque uma carona ou ofereça os lugares livres do seu carro.</p><button class="btn prim" data-aba="inicio">Buscar carona</button></div>`)
      : hist.map(h => { const m = motorista(h.mot); return `<div class="carona" style="opacity:${h.cancelada ? .7 : 1}"><div class="det-linha" style="padding:0 0 8px"><span class="selo ${h.cancelada ? 'cinza' : 'ok'}">${h.cancelada ? 'Cancelada' : ic('check', 's') + ' Concluída'}</span><span class="muted tiny">${fmtData(h.data)} · ${h.hora}</span></div>
        <b>${esc(h.o)} → ${esc(h.d)}</b><div class="pe">${avatar(m.av, 34)}<div class="nome"><b>${esc(m.nome)}</b><span class="nota">${h.cancelada ? 'nenhum valor cobrado' : 'viagem de exemplo'}</span></div><div class="preco"><b style="font-size:16px">${brl(h.preco)}</b></div></div></div>`; }).join('')}
      <p class="rodape-demo">Viagens de exemplo · projeto demonstrativo</p>
    </div>`
  };
};

VIEWS['minha-oferta'] = p => {
  const o = S.ofertas.find(x => x.id === p.id);
  if (!o) return VIEWS.viagens({});
  const ac = o.pedidos.filter(x => x.st === 'ok').length;
  return {
    html: `<div class="det-mapa">${mapa(o.o, o.d, { w: 400, h: 250, carro: true })}<header class="topo"><button class="ico-btn" data-acao="voltar" aria-label="Voltar">${ic('voltar')}</button></header></div>
    <div class="conteudo det-corpo">
      <div class="det-linha"><h2 class="display" style="font-size:22px">${fmtData(o.data)} · ${o.hora}</h2><span class="selo ac">${ic('volante', 's')} Você dirige</span></div>
      <div class="timeline"><div class="tl"><b>${esc(o.o)}</b><small>${esc(o.encontro || 'Ponto de encontro a combinar')}</small></div><div class="tl"><b>${esc(o.d)}</b><small>${distKm(o.o, o.d)} km · cerca de ${Math.floor(duracaoMin(distKm(o.o, o.d)) / 60)}h${pad(duracaoMin(distKm(o.o, o.d)) % 60)}</small></div></div>
      <div class="cartao" style="margin-top:14px">
        <div class="det-linha"><span class="muted">Preço por pessoa</span><b>${brl(o.preco)}</b></div>
        <div class="det-linha"><span class="muted">Lugares reservados</span><b>${ac} de ${o.vagas}</b></div>
        <div class="det-linha"><span class="muted">Você recebe (simulado)</span><b style="color:var(--primary)">${brl(o.preco * ac)}</b></div>
      </div>
      <div class="secao-t"><h2>Pedidos de passageiros</h2></div>
      <div class="cartao">${o.pedidos.length ? o.pedidos.map((x, k) => { const pa = PASSAGEIROS[x.p]; return `<div class="pedido">${avatar(pa.av, 42)}<div class="t"><b>${esc(pa.nome)}</b><br><small class="muted">${x.lug} lugar · perfil de exemplo</small></div>
        ${x.st === 'pend' ? `<button class="btn peq sec" data-acao="pedido" data-id="${o.id}" data-k="${k}" data-st="nao">Recusar</button><button class="btn peq prim" data-acao="pedido" data-id="${o.id}" data-k="${k}" data-st="ok">Aceitar</button>` : `<span class="selo ${x.st === 'ok' ? 'ok' : 'cinza'}">${x.st === 'ok' ? 'Aceito' : 'Recusado'}</span>`}</div>`; }).join('') : '<p class="muted" style="margin:0">Ainda sem pedidos. Você recebe uma notificação quando alguém pedir um lugar.</p>'}</div>
      <button class="btn perigo bloco" style="margin-top:16px" data-acao="cancelar-of" data-id="${o.id}">${ic('lixo', 's')} Cancelar esta carona</button>
    </div>`
  };
};

VIEWS.mensagens = () => {
  const ids = Object.keys(S.conversas);
  return {
    aba: true,
    html: `<header class="topo grande"><h1>Mensagens</h1></header>
    <div class="conteudo">
      ${ids.length ? ids.map(id => { const m = motorista(id), cv = S.conversas[id], ult = [...cv.msgs].reverse().find(x => x.de !== 'sistema') || cv.msgs[cv.msgs.length - 1]; return `<button class="conversa" data-go="chat" data-p='${esc(JSON.stringify({ mid: id }))}'>${avatar(m.av, 50)}<div class="t"><b>${esc(m.nome)}<span>${ult.t || ''}</span></b><small>${ult.de === 'eu' ? 'Você: ' : ''}${esc(ult.txt)}</small></div>${cv.lida ? '' : '<span class="naolida"></span>'}</button>`; }).join('')
        : `<div class="vazio">${ic('chat', 'l')}<p>Suas conversas com motoristas e passageiros aparecem aqui.</p></div>`}
      <div class="aviso verde" style="margin-top:18px">${ic('escudo')}<div>Combine tudo pelo chat do app. Ele fica registrado e ajuda o suporte se algo der errado.</div></div>
      <p class="rodape-demo">Conversas simuladas · respostas automáticas de exemplo</p>
    </div>`
  };
};

VIEWS.chat = p => {
  const m = motorista(p.mid);
  if (!S.conversas[p.mid]) S.conversas[p.mid] = { lida: true, msgs: [{ de: 'sistema', txt: 'Início da conversa · as mensagens ficam salvas no app' }] };
  S.conversas[p.mid].lida = true; salvar();
  const res = S.reservas.find(r => r.c.mot === p.mid && r.status === 'confirmada');
  const rap = ['Estou a caminho', 'Posso levar uma mala média?', 'Onde exatamente é o ponto?', 'Vou atrasar 5 minutos'];
  return {
    html: `<header class="topo" style="border-bottom:1px solid var(--line);background:var(--surface)"><button class="ico-btn" data-acao="voltar" aria-label="Voltar" style="box-shadow:none;background:var(--surface-2)">${ic('voltar')}</button>${avatar(m.av, 40)}<h1>${esc(m.nome)}<small>${res ? `${esc(res.c.o)} → ${esc(res.c.d)} · ${fmtData(res.c.data)} ${res.c.hora}` : 'motorista · perfil de exemplo'}</small></h1></header>
    <div class="chat-corpo">${S.conversas[p.mid].msgs.map(bolha).join('')}</div>
    <footer class="chat-pe"><div class="rapidas">${rap.map(t => `<button class="chip" data-acao="rapida">${t}</button>`).join('')}</div>
      <form class="chat-form" data-form="chat" data-mid="${p.mid}"><input name="txt" placeholder="Escreva uma mensagem" autocomplete="off" aria-label="Mensagem"><button aria-label="Enviar">${ic('enviar')}</button></form></footer>`,
    depois(el) { const c = $('.chat-corpo', el); c.scrollTop = c.scrollHeight; }
  };
};
const bolha = b => b.de === 'sistema' ? `<div class="bolha sistema">${esc(b.txt)}</div>` : `<div class="bolha ${b.de}">${esc(b.txt)}<small>${b.t || ''}</small></div>`;
function respostaAuto(txt, m) {
  const t = txt.toLowerCase();
  if (/mala|bagagem|mochila/.test(t)) return 'Pode sim! O porta-malas tem espaço para uma mala média por pessoa.';
  if (/ponto|onde|local|endere/.test(t)) return 'Fico no estacionamento da rodoviária, ao lado da entrada principal. Te mando a localização no dia.';
  if (/atras|minuto/.test(t)) return 'Sem problema, eu espero até 10 minutos. Me avisa quando estiver chegando.';
  if (/caminho|cheg/.test(t)) return 'Ótimo! Estou no ' + m.carro.toLowerCase() + ', placa final ' + m.placa.slice(-2) + '.';
  if (/pet|cachorro|gato/.test(t)) return m.prefs.includes('pata') ? 'Aceito pet pequeno na caixa de transporte.' : 'Desculpa, dessa vez não consigo levar pet.';
  if (/pix|pag|dinheiro/.test(t)) return 'Pode pagar pelo próprio app, fica mais seguro para nós dois.';
  return ['Combinado! Qualquer coisa me chama aqui.', 'Perfeito, obrigada por avisar.', 'Beleza! Até lá.'][hash(t) % 3];
}

VIEWS.perfil = () => {
  const v = S.verif, pct = (v.email ? 1 : 0) + (v.tel ? 1 : 0) + (v.doc === 'ok' ? 1 : 0);
  const temaSel = S.tema;
  return {
    aba: true,
    html: `<header class="topo grande"><h1>Perfil</h1></header>
    <div class="conteudo">
      <div class="perfil-cab">${avatar(EU.av, 92)}<h2>${EU.nome}</h2><p class="muted" style="margin:2px 0 0">Passageira e motorista · conta de demonstração</p></div>
      <div class="cartao" style="margin-top:16px">
        <div class="det-linha" style="padding-top:0"><b>Verificação do perfil</b><span class="selo ${pct === 3 ? 'ok' : 'ac'}">${pct} de 3</span></div>
        <div class="barra"><i style="width:${pct / 3 * 100}%"></i></div>
        <div class="verif">
          <div class="v"><span class="st ok">${ic('check', 's')}</span><span style="flex:1">E-mail confirmado</span></div>
          <div class="v"><span class="st ok">${ic('check', 's')}</span><span style="flex:1">Telefone confirmado</span></div>
          <div class="v"><span class="st ${v.doc === 'ok' ? 'ok' : v.doc === 'analise' ? 'an' : ''}">${v.doc === 'ok' ? ic('check', 's') : ic('doc', 's')}</span><span style="flex:1">${v.doc === 'ok' ? 'Documento verificado (simulado)' : v.doc === 'analise' ? 'Documento em análise' : 'Documento com foto'}</span>
          ${v.doc === 'ok' ? '' : `<button class="btn peq prim" data-go="verificacao">${v.doc === 'analise' ? 'Ver' : 'Enviar'}</button>`}</div>
        </div>
      </div>
      <div class="lista" style="margin-top:14px">
        <button class="item" data-go="seguranca"><span class="ic">${ic('escudo')}</span><span class="t"><b>Regras de segurança</b><small>o que conferir antes e durante a viagem</small></span>${ic('dir')}</button>
        <button class="item" data-go="notificacoes"><span class="ic">${ic('sino')}</span><span class="t"><b>Notificações</b><small>${S.notifs.length} no histórico</small></span>${ic('dir')}</button>
        <div class="item"><span class="ic">${ic('cel')}</span><span class="t"><b>Avisos no app</b><small>lembretes de viagem e mensagens</small></span><button class="chave ${S.notifOn ? 'on' : ''}" data-acao="notif-on" role="switch" aria-checked="${S.notifOn}" aria-label="Avisos no app"></button></div>
        <button class="item" data-acao="testar-notif"><span class="ic">${ic('sino')}</span><span class="t"><b>Testar notificação</b><small>simula um lembrete de viagem</small></span>${ic('dir')}</button>
      </div>
      <div class="secao-t"><h2>Aparência</h2></div>
      <div class="seg"><button class="${temaSel === 'sistema' ? 'on' : ''}" data-acao="tema" data-t="sistema">Automático</button><button class="${temaSel === 'claro' ? 'on' : ''}" data-acao="tema" data-t="claro">${'Claro'}</button><button class="${temaSel === 'escuro' ? 'on' : ''}" data-acao="tema" data-t="escuro">Escuro</button></div>
      <div class="lista" style="margin-top:14px">
        <button class="item" data-acao="instalar"><span class="ic">${ic('baixar')}</span><span class="t"><b>Instalar o app</b><small>${standalone() ? 'já está instalado neste aparelho' : 'atalho na tela inicial, abre sem internet'}</small></span>${ic('dir')}</button>
        <button class="item" data-acao="permissao"><span class="ic">${ic('info')}</span><span class="t"><b>Notificações do sistema</b><small>${'Notification' in window ? ({ granted: 'permitidas', denied: 'bloqueadas no navegador', default: 'toque para permitir' })[Notification.permission] : 'não suportadas neste navegador'}</small></span>${ic('dir')}</button>
        <button class="item" data-acao="reiniciar"><span class="ic">${ic('refaz')}</span><span class="t"><b>Reiniciar demonstração</b><small>apaga reservas e conversas deste aparelho</small></span>${ic('dir')}</button>
        <button class="item" data-acao="sair"><span class="ic" style="background:var(--surface-2);color:var(--danger)">${ic('sair')}</span><span class="t"><b style="color:var(--danger)">Sair</b></span></button>
      </div>
      <p class="rodape-demo">Rota Junto é uma marca fictícia · projeto demonstrativo de Evelyn Luane</p>
    </div>`
  };
};

VIEWS.verificacao = p => {
  const passo = p.passo || (S.verif.doc === 'analise' ? 3 : S.verif.doc === 'ok' ? 4 : 0);
  const tipo = S.verif.tipo;
  let corpo = '';
  if (passo === 0) corpo = `<h2 class="display" style="font-size:24px">Qual documento você vai usar?</h2><p class="muted">Motoristas precisam da CNH. Passageiros podem usar RG ou CNH.</p>
    <div class="doc-tipos">${['CNH', 'RG'].map(t => `<button class="pag ${tipo === t ? 'on' : ''}" data-acao="doc-tipo" data-t="${t}"><span class="ic">${ic('doc')}</span><span class="t"><b>${t}</b><small>${t === 'CNH' ? 'para dirigir' : 'só passageiro'}</small></span></button>`).join('')}</div>
    <div class="aviso verde">${ic('info')}<div>Nesta demonstração a câmera não é ligada e nenhuma imagem sai do aparelho. As fotos abaixo são ilustrações.</div></div>`;
  else if (passo === 1) corpo = `<h2 class="display" style="font-size:24px">Foto da frente da ${tipo}</h2><p class="muted">Apoie numa mesa, com boa luz e sem reflexo.</p>
    <div class="camera" id="cam"><svg viewBox="0 0 200 130" width="72%" aria-hidden="true"><rect width="200" height="130" rx="12" fill="#E8E2D2"/><rect width="200" height="26" rx="12" fill="#0E5E4E"/><rect y="14" width="200" height="12" fill="#0E5E4E"/><text x="12" y="18" font-size="10" font-weight="700" fill="#fff" font-family="sans-serif">DOCUMENTO DE EXEMPLO</text><rect x="12" y="38" width="52" height="64" rx="6" fill="#cfc6b2"/><circle cx="38" cy="62" r="12" fill="#a99f8a"/><path d="M20 98c3-14 33-14 36 0" fill="#a99f8a"/><g fill="#b9b19d"><rect x="76" y="40" width="100" height="8" rx="4"/><rect x="76" y="56" width="70" height="8" rx="4"/><rect x="76" y="72" width="90" height="8" rx="4"/><rect x="76" y="88" width="50" height="8" rx="4"/></g></svg>
    <div class="moldura"></div><div class="scan"></div><div class="legenda">Encaixe o documento na moldura</div></div>`;
  else if (passo === 2) corpo = `<h2 class="display" style="font-size:24px">Agora uma selfie</h2><p class="muted">Rosto centralizado, sem óculos escuros nem boné.</p>
    <div class="camera" id="cam"><div style="width:42%;border-radius:50%;overflow:hidden">${avatar(EU.av, 160).replace('width="160" height="160"', 'width="100%" height="100%" style="width:100%;height:auto"')}</div><div class="moldura oval"></div><div class="scan"></div><div class="legenda">Olhe para a câmera</div></div>`;
  else if (passo === 3) corpo = `<div style="text-align:center;padding:30px 0"><div class="spinner"></div><h2 class="display" style="font-size:24px">Documento em análise</h2><p class="muted">Na versão real, a conferência leva alguns minutos e você recebe uma notificação. Aqui é simulado.</p></div>`;
  else corpo = `<div style="text-align:center;padding:24px 0"><svg class="check" viewBox="0 0 110 110" width="96" aria-hidden="true"><circle cx="55" cy="55" r="48" fill="var(--ok-soft)" stroke="var(--ok)" stroke-width="5"/><path d="m34 57 14 14 29-31" fill="none" stroke="var(--ok)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg><h2 class="display" style="font-size:24px;margin-top:12px">Perfil verificado</h2><p class="muted">Seu perfil agora mostra o selo de documento verificado (simulado).</p></div>`;
  const botao = ['Continuar', 'Capturar foto', 'Capturar selfie', null, 'Voltar ao perfil'][passo];
  return {
    html: topo('Verificação', 'documento e selfie · simulado') +
      `<div class="conteudo"><div class="passos">${[0, 1, 2, 3].map(k => `<i class="${k <= Math.min(passo, 3) ? 'on' : ''}"></i>`).join('')}</div>${corpo}</div>
      ${botao ? `<footer class="rodape-acao"><button class="btn prim bloco" data-acao="verif-prox" data-passo="${passo}">${passo === 1 || passo === 2 ? ic('camera', 's') + ' ' : ''}${botao}</button></footer>` : ''}`,
    depois() {
      if (passo === 3 && !VITRINE) setTimeout(() => {
        S.verif.doc = 'ok'; salvar();
        notificar('Perfil verificado', 'Seu documento foi conferido (simulação). O selo já aparece no seu perfil.', 'escudo');
        if (atual?.dataset.tela === 'verificacao') ir('verificacao', { passo: 4 }, 'substitui');
      }, 2600);
    }
  };
};

VIEWS.seguranca = () => {
  const R = [
    ['Confira antes de entrar', 'Compare a foto do motorista, o modelo do carro e a placa com o que aparece no app. Se não bater, não embarque.'],
    ['Encontro em lugar movimentado', 'Prefira rodoviária, posto ou praça central. Evite combinar na porta de casa com quem você não conhece.'],
    ['Compartilhe a viagem', 'Envie o trajeto e o horário para alguém de confiança pelo botão de compartilhar.'],
    ['Pague só pelo app', 'O valor fica guardado e só vai para o motorista depois da viagem. Desconfie de quem pede Pix por fora.'],
    ['Cinto e limite de lugares', 'Todos usam cinto, inclusive atrás. O motorista não leva mais gente do que os lugares do carro.'],
    ['Avalie com sinceridade', 'Depois da viagem, conte como foi. É assim que a comunidade se protege.']
  ];
  return {
    html: topo('Regras de segurança') + `<div class="conteudo">
      <div class="cartao">${R.map((r, k) => `<div class="regra"><span class="n">${k + 1}</span><div><b>${r[0]}</b><p>${r[1]}</p></div></div>`).join('')}</div>
      <button class="sos" data-acao="sos"><span class="ic">SOS</span><span><b>Botão de ajuda</b><small>Em emergência, ligue 190 (Polícia Militar) ou 192 (SAMU).</small></span></button>
      <p class="rodape-demo">Regras de exemplo para um app de caronas · marca fictícia</p></div>`
  };
};

VIEWS.notificacoes = () => {
  const html = topo('Notificações', '', `<button class="btn peq sec" data-acao="ler-tudo">Marcar lidas</button>`) + `<div class="conteudo">
    ${S.notifs.length ? S.notifs.map(n => `<div class="notif-item ${n.nova ? 'nova' : ''}"><span class="ic">${ic(n.ic || 'sino')}</span><div style="flex:1"><b>${esc(n.titulo)}</b><small>${esc(n.txt)}</small></div><small class="muted">${esc(n.t)}</small></div>`).join('') : `<div class="vazio">${ic('sino', 'l')}<p>Nada por aqui ainda.</p></div>`}
    <button class="btn borda bloco" style="margin-top:18px" data-acao="testar-notif">${ic('sino', 's')} Simular lembrete de viagem</button>
    <p class="rodape-demo">Notificações locais simuladas</p></div>`;
  return { html };
};

/* ================= ações ================= */
const pAtual = () => pilha[pilha.length - 1].p;
function lerBusca(form) { const fd = new FormData(form); S.busca.o = fd.get('o'); S.busca.d = fd.get('d'); if (fd.get('data')) S.busca.data = fd.get('data'); }
function lerOferta(form) {
  const fd = new FormData(form), r = S.rascunho || {};
  Object.assign(r, { o: fd.get('o'), d: fd.get('d'), data: fd.get('data'), hora: fd.get('hora'), encontro: fd.get('encontro') });
  r.vagas = r.vagas || 3; r.prefs = r.prefs || ['mala', 'neve'];
  S.rascunho = r; return r;
}
function standalone() { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }
let promptInstalar = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); promptInstalar = e; });

app.addEventListener('click', async e => {
  if (e.target.matches?.('input[type=date],input[type=time]') && e.target.showPicker) { try { e.target.showPicker(); } catch (er) { } }
  const alvo = e.target.closest('[data-go],[data-acao],[data-aba],[data-data]');
  if (!alvo || !app.contains(alvo)) return;
  if (alvo.tagName === 'A') e.preventDefault();
  if (alvo.dataset.aba) { if (alvo.dataset.aba !== atual?.dataset.tela || pilha.length > 1) ir(alvo.dataset.aba, {}, 'aba'); return; }
  if (alvo.dataset.go) { if (alvo.closest('.folha')) return; ir(alvo.dataset.go, alvo.dataset.p ? JSON.parse(alvo.dataset.p) : {}); return; }
  if (alvo.dataset.data) { const f = alvo.closest('form'); lerBusca(f); S.busca.data = alvo.dataset.data; salvar(); refazer(); return; }
  const a = alvo.dataset.acao, p = pilha.length ? pAtual() : {};
  switch (a) {
    case 'voltar': pedirVoltar(); break;
    case 'pular': S.onb = true; salvar(); ir('login', {}, 'raiz'); break;
    case 'onb-prox': { const i = atual._idx(); if (i < 2) atual._vai(i + 1); else { S.onb = true; salvar(); ir('login', {}, 'raiz'); } break; }
    case 'entrar': await carregar('Enviando código de demonstração…', 900); S.logado = true; salvar(); ir('inicio', {}, 'raiz'); setTimeout(() => notificar('Código 2468', 'Código de acesso de demonstração (simulado). Você já entrou.', 'cel', false), 500); break;
    case 'trocar': { const f = alvo.closest('form'); lerBusca(f); [S.busca.o, S.busca.d] = [S.busca.d, S.busca.o]; f.o.value = S.busca.o; f.d.value = S.busca.d; alvo.classList.toggle('gira'); salvar(); break; }
    case 'pax': { lerBusca(alvo.closest('form')); S.busca.pax = Math.max(1, Math.min(4, S.busca.pax + +alvo.dataset.n)); salvar(); refazer(); break; }
    case 'rota-pop': S.busca.o = alvo.dataset.o; S.busca.d = alvo.dataset.d; salvar(); ir('resultados', { ...S.busca }); break;
    case 'ordenar': p.ord = alvo.dataset.ord; refazer(); break;
    case 'so-verif': p.verif = !p.verif; refazer(); break;
    case 'alerta-rota': notificar('Alerta criado', `Vamos avisar quando surgir carona de ${p.o} para ${p.d}.`, 'sino'); break;
    case 'compartilhar': {
      const c = p.res ? S.reservas.find(r => r.id === p.res).c : carona(p.id);
      const txt = `Vou de carona pelo Rota Junto (demo): ${c.o} → ${c.d}, ${fmtData(c.data)} às ${c.hora}.`;
      if (navigator.share && !VITRINE) navigator.share({ title: 'Minha viagem', text: txt }).catch(() => { });
      else { navigator.clipboard?.writeText(txt).catch(() => { }); toast('Resumo da viagem copiado'); }
      break;
    }
    case 'lug': { const c = carona(p.id); p.lug = Math.max(1, Math.min(c.vagas, (p.lug || Math.min(S.busca.pax, c.vagas)) + +alvo.dataset.n)); refazer(); break; }
    case 'pag': p.pag = alvo.dataset.pag; refazer(); break;
    case 'confirmar-res': confirmarReserva(p); break;
    case 'cancelar-res': {
      const r = S.reservas.find(x => x.id === alvo.dataset.id);
      folha(`<h3>Cancelar reserva?</h3><p class="muted">Cancelando com mais de 24 horas de antecedência, o valor volta integralmente (regra de exemplo). Nada foi cobrado nesta demonstração.</p>
        <div style="display:flex;gap:10px;margin-top:16px"><button class="btn sec" style="flex:1" data-f="nao">Manter</button><button class="btn perigo" style="flex:1" data-f="sim">Cancelar</button></div>`, (f, fechar) => {
        f.querySelector('[data-f=nao]').onclick = fechar;
        f.querySelector('[data-f=sim]').onclick = () => { r.status = 'cancelada'; salvar(); fechar(); toast('Reserva cancelada'); refazer(); };
      });
      break;
    }
    case 'trocar-of': { const r = lerOferta(alvo.closest('form')); [r.o, r.d] = [r.d, r.o]; r.preco = null; salvar(); refazer(); break; }
    case 'vagas': { const r = lerOferta(alvo.closest('form')); r.vagas = Math.max(1, Math.min(6, r.vagas + +alvo.dataset.n)); salvar(); refazer(); break; }
    case 'pref': { const r = lerOferta(alvo.closest('form')); const k = alvo.dataset.k; r.prefs = r.prefs.includes(k) ? r.prefs.filter(x => x !== k) : [...r.prefs, k]; salvar(); alvo.classList.toggle('on'); break; }
    case 'seg': p.seg = alvo.dataset.seg; refazer(); break;
    case 'pedido': {
      const o = S.ofertas.find(x => x.id === alvo.dataset.id), x = o.pedidos[+alvo.dataset.k];
      x.st = alvo.dataset.st; salvar(); refazer();
      toast(x.st === 'ok' ? `${PASSAGEIROS[x.p].nome.split(' ')[0]} foi avisado que o lugar está garantido` : 'Pedido recusado');
      break;
    }
    case 'cancelar-of': S.ofertas = S.ofertas.filter(x => x.id !== alvo.dataset.id); salvar(); toast('Carona cancelada · passageiros avisados'); pedirVoltar(); break;
    case 'rapida': { const f = $('.chat-form', atual); f.txt.value = alvo.textContent; f.requestSubmit(); break; }
    case 'tema': S.tema = alvo.dataset.t; salvar(); aplicarTema(); refazer(); break;
    case 'notif-on': S.notifOn = !S.notifOn; salvar(); refazer(); break;
    case 'testar-notif': {
      const r = S.reservas.find(x => x.status === 'confirmada');
      setTimeout(() => notificar('Lembrete de viagem', r ? `Sua carona para ${r.c.d} sai ${fmtData(r.c.data).toLowerCase()} às ${r.c.hora}. Chegue 10 min antes.` : 'Sua carona para São Paulo sai amanhã às 07:15. Chegue 10 min antes.', 'relogio'), 600);
      toast('Notificação chega em instantes');
      break;
    }
    case 'permissao':
      if (!('Notification' in window)) { toast('Este navegador não suporta notificações'); break; }
      Notification.requestPermission().then(() => refazer());
      break;
    case 'instalar':
      if (standalone()) toast('O app já está instalado');
      else if (promptInstalar) { promptInstalar.prompt(); promptInstalar.userChoice.finally(() => { promptInstalar = null; }); }
      else folha(`<h3>Instalar o Rota Junto</h3><p class="muted">No Android (Chrome): menu ⋮ → <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</p><p class="muted">No iPhone (Safari): botão compartilhar → <b>Adicionar à Tela de Início</b>.</p><p class="muted">Depois de instalado, o app abre em tela cheia e funciona sem internet com os dados salvos.</p>`);
      break;
    case 'reiniciar':
      folha(`<h3>Reiniciar demonstração?</h3><p class="muted">Apaga reservas, caronas oferecidas e conversas salvas neste aparelho.</p><div style="display:flex;gap:10px;margin-top:16px"><button class="btn sec" style="flex:1" data-f="nao">Voltar</button><button class="btn prim" style="flex:1" data-f="sim">Reiniciar</button></div>`, (f, fechar) => {
        f.querySelector('[data-f=nao]').onclick = fechar;
        f.querySelector('[data-f=sim]').onclick = () => { const t = S.tema; S = estadoInicial(); S.tema = t; salvar(); fechar(); iniciar(); };
      });
      break;
    case 'sair': S.logado = false; salvar(); ir('login', {}, 'raiz'); break;
    case 'doc-tipo': S.verif.tipo = alvo.dataset.t; salvar(); refazer(); break;
    case 'verif-prox': {
      const ps = +alvo.dataset.passo;
      if (ps === 4) { pedirVoltar(); break; }
      if (ps === 1 || ps === 2) {
        const cam = $('#cam', atual); cam.classList.add('lendo'); alvo.disabled = true;
        await espera(1500); cam.classList.remove('lendo');
        if (ps === 2) { S.verif.doc = 'analise'; salvar(); }
      }
      ir('verificacao', { passo: ps + 1 }, 'substitui');
      break;
    }
    case 'sos':
      folha(`<h3>Botão de ajuda</h3><p class="muted">Na versão real, este botão liga para o 190 e envia sua localização e os dados da viagem para seu contato de confiança.</p>
        <div class="aviso">${ic('alerta')}<div>Isto é uma simulação. Nenhuma ligação é feita e nenhuma localização é enviada.</div></div>
        <a class="btn perigo bloco" style="margin-top:14px;text-decoration:none" href="tel:190">Ligar 190 de verdade</a>
        <button class="btn sec bloco" style="margin-top:10px" data-f="ok">Entendi</button>`, (f, fechar) => { f.querySelector('[data-f=ok]').onclick = fechar; });
      break;
    case 'ler-tudo': S.notifs.forEach(n => n.nova = false); salvar(); refazer(); break;
  }
});

app.addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, tipo = f.dataset.form;
  if (tipo === 'login') { await carregar('Entrando…', 700); S.logado = true; salvar(); ir('inicio', {}, 'raiz'); }
  if (tipo === 'busca') {
    lerBusca(f);
    if (S.busca.o === S.busca.d) { toast('Escolha cidades diferentes para origem e destino'); return; }
    salvar(); ir('resultados', { ...S.busca });
  }
  if (tipo === 'oferta') {
    const r = lerOferta(f); r.preco = +f.preco.value;
    if (r.o === r.d) { toast('Escolha cidades diferentes'); return; }
    if (!r.hora || !r.data) { toast('Informe data e horário'); return; }
    await carregar('Publicando sua carona…', 900);
    const o = { id: 'of' + Date.now(), o: r.o, d: r.d, data: r.data, hora: r.hora, vagas: r.vagas, preco: r.preco, encontro: r.encontro, prefs: r.prefs, pedidos: [] };
    S.ofertas.push(o); S.rascunho = null; salvar();
    ir('viagens', { seg: 'prox' }, 'aba');
    toast('Carona publicada!');
    setTimeout(() => {
      const of = S.ofertas.find(x => x.id === o.id); if (!of) return;
      of.pedidos.push({ p: 0, lug: 1, st: 'pend' }); salvar();
      notificar('Novo pedido de lugar', `${PASSAGEIROS[0].nome} quer 1 lugar na sua carona para ${o.d}.`, 'pessoas');
      if (atual?.dataset.tela === 'viagens' || atual?.dataset.tela === 'minha-oferta') refazer();
    }, 5000);
  }
  if (tipo === 'chat') {
    const txt = f.txt.value.trim(); if (!txt) return;
    const mid = f.dataset.mid, cv = S.conversas[mid], m = motorista(mid);
    const b = { de: 'eu', t: agoraTxt(), txt }; cv.msgs.push(b); salvar();
    const corpo = $('.chat-corpo', atual); corpo.insertAdjacentHTML('beforeend', bolha(b)); f.txt.value = '';
    corpo.insertAdjacentHTML('beforeend', '<div class="digitando" aria-label="digitando"><i></i><i></i><i></i></div>'); corpo.scrollTop = corpo.scrollHeight;
    await espera(1200 + Math.random() * 600);
    const resp = { de: 'ele', t: agoraTxt(), txt: respostaAuto(txt, m) }; cv.msgs.push(resp); salvar();
    const aqui = atual?.dataset.tela === 'chat' && $('.chat-form', atual)?.dataset.mid === mid;
    if (aqui) { $('.digitando', atual)?.remove(); const c2 = $('.chat-corpo', atual); c2.insertAdjacentHTML('beforeend', bolha(resp)); c2.scrollTop = c2.scrollHeight; }
    else { cv.lida = false; salvar(); notificar(m.nome, resp.txt, 'chat', false); if (atual && $('#abas:not(.oculta)')) desenharAbas(atual.dataset.tela); }
  }
});

app.addEventListener('input', e => {
  const f = e.target.closest('form');
  if (f?.dataset.form === 'oferta' && e.target.name === 'preco') { $('[data-preco]', f).textContent = brl(e.target.value); (S.rascunho = S.rascunho || {}).preco = +e.target.value; salvar(); }
});
app.addEventListener('change', e => {
  const f = e.target.closest('form'); if (!f) return;
  if (f.dataset.form === 'busca') { lerBusca(f); salvar(); if (e.target.name === 'data') refazer(); }
  if (f.dataset.form === 'oferta' && ['o', 'd'].includes(e.target.name)) { const r = lerOferta(f); r.preco = null; salvar(); refazer(); }
  else if (f.dataset.form === 'oferta') { lerOferta(f); salvar(); }
});

async function confirmarReserva(p) {
  const c = carona(p.id), lug = p.lug || Math.min(S.busca.pax, c.vagas), pag = p.pag || 'pix';
  const pagTxt = { pix: 'Pix (simulado)', cartao: 'Cartão de demonstração', dinheiro: 'Dinheiro ao motorista' }[pag];
  const finalizar = async () => {
    await carregar(pag === 'dinheiro' ? 'Reservando seu lugar…' : 'Processando pagamento simulado…', 1300);
    const cod = 'RJ-' + (hash(c.id + Date.now()) % 9000 + 1000);
    const r = { id: 'r' + Date.now(), c: { ...c, vagas: c.vagas - lug }, lug, pag, pagTxt, cod, status: 'confirmada' };
    S.reservas.push(r); c.vagas -= lug; salvar();
    ir('confirmado', { res: r.id }, 'substitui');
    const m = motorista(c.mot);
    setTimeout(() => {
      if (!S.conversas[m.id]) S.conversas[m.id] = { lida: false, msgs: [] };
      S.conversas[m.id].msgs.push({ de: 'sistema', txt: `Reserva ${cod} · ${c.o} → ${c.d}` }, { de: 'ele', t: agoraTxt(), txt: `Oi! Recebi sua reserva para ${fmtData(c.data).toLowerCase()} às ${c.hora}. Te espero em: ${c.embarque}.` });
      S.conversas[m.id].lida = false; salvar();
      notificar(m.nome, 'Oi! Recebi sua reserva. Te espero no ponto de encontro.', 'chat', false);
    }, 3500);
    setTimeout(() => notificar('Lembrete agendado', `Vamos te avisar 1 hora antes da saída (${c.hora}).`, 'relogio'), 8000);
  };
  if (pag !== 'pix') return finalizar();
  const fechar = folha(`<h3>Pix simulado</h3><p class="muted" style="margin:0">Este QR é só uma ilustração. <b>Não tente pagar.</b></p>${qrFake(c.id)}
    <div class="copia"><span style="flex:1">00020126DEMO.ROTAJUNTO.NAO.PAGAR.${brl(c.preco * lug).replace(/\D/g, '')}</span></div>
    <button class="btn prim bloco" style="margin-top:14px" data-f="ok">${ic('check', 's')} Simular pagamento aprovado</button>`, (f, fch) => {
    f.querySelector('[data-f=ok]').onclick = () => { fch(); finalizar(); };
  });
}

/* ================= gesto de voltar (arrastar da borda) ================= */
(() => {
  let x0 = null, y0 = 0, el = null, dx = 0, ativo = false;
  app.addEventListener('touchstart', e => {
    if (pilha.length < 2 || e.touches.length > 1) return;
    const t = e.touches[0], r = app.getBoundingClientRect();
    if (t.clientX - r.left > 28) return;
    x0 = t.clientX; y0 = t.clientY; el = atual; dx = 0; ativo = false;
  }, { passive: true });
  app.addEventListener('touchmove', e => {
    if (x0 === null) return;
    const t = e.touches[0]; dx = t.clientX - x0;
    if (!ativo) { if (Math.abs(t.clientY - y0) > Math.abs(dx)) { x0 = null; return; } if (dx > 8) ativo = true; else return; }
    el.style.transform = `translateX(${Math.max(0, dx)}px)`; el.style.boxShadow = '-10px 0 30px rgba(0,0,0,.18)';
  }, { passive: true });
  app.addEventListener('touchend', () => {
    if (x0 === null) return; x0 = null;
    if (!ativo) return;
    const w = app.clientWidth;
    if (dx > w * .33) pedirVoltar();
    else { el.animate([{ transform: el.style.transform }, { transform: 'none' }], { duration: 220, easing: EASE }); el.style.transform = ''; el.style.boxShadow = ''; }
  });
})();

/* ================= tema ================= */
function aplicarTema() {
  const t = QS.get('tema') || S.tema;
  if (t === 'sistema') document.documentElement.removeAttribute('data-tema'); else document.documentElement.dataset.tema = t;
  const escuro = t === 'escuro' || (t === 'sistema' && matchMedia('(prefers-color-scheme: dark)').matches);
  $$('meta[name=theme-color]').forEach(m => m.setAttribute('content', escuro ? '#0C1311' : '#0E5E4E'));
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', aplicarTema);

/* ================= início ================= */
function iniciar() {
  aplicarTema();
  telas.innerHTML = ''; atual = null; pilha.length = 0;
  if (!S.onb) ir('onboarding', {}, 'raiz');
  else if (!S.logado) ir('login', {}, 'raiz');
  else ir('inicio', {}, 'raiz');
}

/* modo vitrine: abre uma tela específica com dados de exemplo (usado nas molduras de celular) */
function vitrine(v) {
  document.body.classList.add('vitrine');
  S.tema = QS.get('tema') || 'claro';
  aplicarTema();
  S.onb = true; S.logado = true;
  const amanha = somaDias(hoje(), 1);
  const lista = caronas('São Paulo', 'Botucatu', amanha);
  const c = lista.find(x => x.hora >= '06:00') || lista[0];
  c.mot = 'm1'; c.verificado = true; c.vagas = Math.max(2, c.vagas); c.total = 3;
  const semear = () => {
    const r = { id: 'rv', c: { ...c }, lug: 1, pag: 'pix', pagTxt: 'Pix (simulado)', cod: 'RJ-4821', status: 'confirmada' };
    S.reservas = [r];
    S.ofertas = [{ id: 'ofv', o: 'Botucatu', d: 'Bauru', data: somaDias(hoje(), 3), hora: '17:30', vagas: 3, preco: 25, encontro: 'Rodoviária de Botucatu', prefs: ['mala'], pedidos: [{ p: 0, lug: 1, st: 'ok' }, { p: 1, lug: 1, st: 'pend' }] }];
    return r;
  };
  S.busca = { o: 'São Paulo', d: 'Botucatu', data: amanha, pax: 1 };
  const base = () => ir('inicio', {}, 'raiz');
  const emp = (n, p) => { ir(n, p, 'nada'); pilha.push({ nome: n, p }); };
  switch (v) {
    case 'onboarding': S.onb = false; ir('onboarding', { i: +(QS.get('i') || 0) }, 'raiz'); break;
    case 'login': ir('login', {}, 'raiz'); break;
    case 'inicio': semear(); base(); break;
    case 'resultados': base(); emp('resultados', { ...S.busca }); break;
    case 'detalhe': base(); pilha.push({ nome: 'resultados', p: { ...S.busca } }); emp('detalhe', { id: c.id }); break;
    case 'reserva': base(); emp('reserva', { id: c.id, pag: QS.get('pag') || 'pix' }); break;
    case 'pix': base(); emp('reserva', { id: c.id }); confirmarReserva({ id: c.id, pag: 'pix', lug: 1 }); break;
    case 'confirmado': { const r = semear(); ir('confirmado', { res: r.id }, 'raiz'); break; }
    case 'oferecer': S.rascunho = { o: 'Botucatu', d: 'São Paulo', data: somaDias(hoje(), 2), hora: '07:00', vagas: 3, encontro: 'Rodoviária de Botucatu', prefs: ['mala', 'neve', 'semfumo'] }; ir('oferecer', {}, 'raiz'); break;
    case 'viagens': semear(); ir('viagens', {}, 'raiz'); break;
    case 'minha-oferta': semear(); ir('viagens', {}, 'raiz'); emp('minha-oferta', { id: 'ofv' }); break;
    case 'mensagens': semear(); S.conversas.m4 = { lida: false, msgs: [{ de: 'ele', t: '09:12', txt: 'Bom dia! Ainda tenho 2 lugares para Bauru na sexta.' }] }; ir('mensagens', {}, 'raiz'); break;
    case 'chat': {
      semear();
      S.conversas.m1 = { lida: true, msgs: [
        { de: 'sistema', txt: 'Reserva RJ-4821 · São Paulo → Botucatu' },
        { de: 'ele', t: '10:02', txt: `Oi! Recebi sua reserva para amanhã às ${c.hora}. Te espero em: ${c.embarque}.` },
        { de: 'eu', t: '10:05', txt: 'Oi, Marina! Posso levar uma mala média?' },
        { de: 'ele', t: '10:06', txt: 'Pode sim! O porta-malas tem espaço para uma mala média por pessoa.' },
        { de: 'eu', t: '10:07', txt: 'Perfeito, obrigada. Chego 10 minutos antes.' }
      ] };
      ir('chat', { mid: 'm1' }, 'raiz'); break;
    }
    case 'perfil': S.verif.doc = QS.get('doc') || 'nao'; ir('perfil', {}, 'raiz'); break;
    case 'verificacao': ir('verificacao', { passo: +(QS.get('passo') || 1) }, 'raiz'); break;
    case 'seguranca': ir('seguranca', {}, 'raiz'); break;
    case 'notificacoes': semear(); S.notifs = [
      { ic: 'chat', titulo: 'Marina Couto', txt: 'Oi! Recebi sua reserva. Te espero no ponto de encontro.', t: '10:02', nova: true },
      { ic: 'relogio', titulo: 'Lembrete agendado', txt: 'Vamos te avisar 1 hora antes da saída.', t: '10:01', nova: true },
      { ic: 'pessoas', titulo: 'Novo pedido de lugar', txt: 'Sofia Brandão quer 1 lugar na sua carona para Bauru.', t: 'ontem', nova: false },
      { ic: 'escudo', titulo: 'Bem-vinda ao Rota Junto', txt: 'Complete a verificação do perfil para reservar com mais confiança.', t: 'seg', nova: false }
    ]; ir('notificacoes', {}, 'raiz'); break;
    case 'notif': semear(); base(); setTimeout(() => notificar('Lembrete de viagem', `Sua carona para Botucatu sai amanhã às ${c.hora}. Chegue 10 min antes.`, 'relogio'), 300); break;
    default: base();
  }
}

if (VITRINE) {   // espera as fontes para a moldura já abrir com a tipografia certa
  const fontes = ['600 20px Fraunces', '400 15px Manrope', '600 15px Manrope', '700 15px Manrope', '800 15px Manrope'];
  Promise.race([document.fonts ? Promise.all(fontes.map(f => document.fonts.load(f))) : Promise.resolve(), espera(2500)]).then(() => vitrine(VITRINE), () => vitrine(VITRINE));
} else { iniciar(); history.replaceState({ n: 1 }, ''); }

/* service worker: cache para abrir sem internet */
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !VITRINE) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
}

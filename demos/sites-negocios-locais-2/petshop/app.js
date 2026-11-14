(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var brl=function(v){var d=Math.round(v*100)%100?2:0;return 'R$ '+v.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d})};
var WA='https://wa.me/5514000000000?text=';
var store={get:function(k,d){try{var v=localStorage.getItem('petlar.'+k);return v?JSON.parse(v):d}catch(e){return d}},set:function(k,v){try{localStorage.setItem('petlar.'+k,JSON.stringify(v))}catch(e){}}};

/* ---------- dados ---------- */
var PORTES=[{id:'P',nome:'Pequeno',info:'até 10 kg'},{id:'M',nome:'Médio',info:'10 a 25 kg'},{id:'G',nome:'Grande',info:'25 a 40 kg'},{id:'GG',nome:'Gigante',info:'acima de 40 kg'}];
var SERV=[
  {id:'banho',nome:'Banho',info:'com secagem e perfume',p:{P:55,M:70,G:90,GG:115},dur:1},
  {id:'hig',nome:'Banho + tosa higiênica',info:'patas, barriga e rosto',p:{P:75,M:95,G:120,GG:150},dur:1},
  {id:'tosa',nome:'Banho + tosa completa',info:'máquina ou tesoura',p:{P:95,M:120,G:150,GG:190},dur:2}
];
var BAIRROS=[['Centro',10],['Vila dos Lavradores',12],['Vila Assumpção',12],['Lavapés',12],['Jardim Paraíso',15],['Jardim Cristina',15],['Cohab',18],['Rubião Júnior',25]];
var HORAS=['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00'];
var st={porte:'M',serv:'hig',dia:null,hora:null,lt:false,bairro:0,hidra:false};

function chip(label,sub,pressed,onclick){var b=document.createElement('button');b.type='button';b.className='chip';b.setAttribute('aria-pressed',pressed?'true':'false');b.innerHTML=label+(sub?'<small>'+sub+'</small>':'');b.onclick=onclick;return b}
function seeded(str){var h=2166136261;for(var i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return function(){h^=h<<13;h^=h>>>17;h^=h<<5;return ((h>>>0)%1000)/1000}}

/* ---------- agendamento ---------- */
var dias=[];(function(){var d=new Date();d.setHours(0,0,0,0);while(dias.length<8){d.setDate(d.getDate()+1);if(d.getDay()!==0)dias.push(new Date(d))}})();
var DOW=['dom','seg','ter','qua','qui','sex','sáb'];
function renderBook(){
  var p=$('#porte');p.innerHTML='';PORTES.forEach(function(x){p.appendChild(chip(x.nome,x.info,st.porte===x.id,function(){st.porte=x.id;renderBook()}))});
  var s=$('#servico');s.innerHTML='';SERV.forEach(function(x){s.appendChild(chip(x.nome,brl(x.p[st.porte])+' · '+x.info,st.serv===x.id,function(){st.serv=x.id;renderBook()}))});
  var dd=$('#dias');dd.innerHTML='';dias.forEach(function(d,i){var c=chip(DOW[d.getDay()]+'<b>'+d.getDate()+'</b>','',st.dia===i,function(){st.dia=i;st.hora=null;renderBook()});dd.appendChild(c)});
  var sl=$('#slots');sl.innerHTML='';
  if(st.dia===null){sl.innerHTML='<p class="note" style="grid-column:1/-1;margin:0">Escolha um dia para ver os horários livres.</p>'}
  else{var d=dias[st.dia];var r=seeded(d.toDateString()+st.serv);var sab=d.getDay()===6;
    HORAS.forEach(function(h){if(sab&&parseInt(h)>=12)return;var ocupado=r()<.42;var c=chip(h,'',st.hora===h,function(){st.hora=h;renderBook()});if(ocupado){c.disabled=true;c.title='Ocupado'}sl.appendChild(c)})}
  $('#ltBox').style.display=st.lt?'block':'none';
  var serv=SERV.filter(function(x){return x.id===st.serv})[0];var porte=PORTES.filter(function(x){return x.id===st.porte})[0];
  var total=serv.p[st.porte]+(st.hidra?25:0)+(st.lt?BAIRROS[st.bairro][1]:0);
  $('#sPorte').textContent=porte.nome+' ('+porte.info+')';
  $('#sServ').textContent=serv.nome+(st.hidra?' + hidratação':'');
  $('#sQuando').textContent=(st.dia!==null&&st.hora)?DOW[dias[st.dia].getDay()]+', '+dias[st.dia].toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+' às '+st.hora:'escolha dia e hora';
  $('#sLt').textContent=st.lt?BAIRROS[st.bairro][0]+' · '+brl(BAIRROS[st.bairro][1]):'não';
  $('#sTotal').textContent=brl(total);
  renderFees();
}
var sel=$('#ltBairro');BAIRROS.forEach(function(b,i){var o=document.createElement('option');o.value=i;o.textContent=b[0]+' · '+brl(b[1])+' ida e volta';sel.appendChild(o)});
sel.onchange=function(){st.bairro=+sel.value;renderBook()};
$('#lt').onchange=function(e){st.lt=e.target.checked;renderBook()};
$('#hidra').onchange=function(e){st.hidra=e.target.checked;renderBook()};
$('#confirmar').onclick=function(){
  if(st.dia===null||!st.hora){$('#sQuando').textContent='⚠ escolha dia e hora';$('#dias').scrollIntoView({behavior:'smooth',block:'center'});return}
  var t=$('#sServ').textContent+'\nPorte: '+$('#sPorte').textContent+'\nQuando: '+$('#sQuando').textContent+'\nLeva e traz: '+$('#sLt').textContent+'\nTotal: '+$('#sTotal').textContent;
  openModal('Horário reservado','Seu código de atendimento é PL-'+(2100+Math.floor(Math.random()*800))+'. Envie a confirmação para a recepção:','Olá! Quero confirmar meu agendamento no Pet Lar:\n'+t);
};

/* ---------- tabela leva e traz ---------- */
function renderFees(){var t=$('#feeTable');t.innerHTML='';BAIRROS.forEach(function(b,i){var tr=document.createElement('tr');if(st.lt&&st.bairro===i)tr.className='on';tr.innerHTML='<td>'+b[0]+'</td><td>'+brl(b[1])+'</td>';tr.style.cursor='pointer';tr.onclick=function(){st.lt=true;st.bairro=i;$('#lt').checked=true;sel.value=i;renderBook()};t.appendChild(tr)})}

/* ---------- status ---------- */
var ETAPAS=['Recebido na recepção','No banho','Secagem e escovação','Tosa e acabamento','Pronto para buscar'];
var PETS={'PL-2048':{nome:'Paçoca',serv:'Banho e tosa higiênica · porte M',etapa:2,ini:'09:05'},'PL-1175':{nome:'Biscoito',serv:'Banho · porte P',etapa:4,ini:'08:10'}};
var cur='PL-2048';
function renderStatus(){var p=PETS[cur];$('#petNome').textContent=p.nome;$('#petAv').textContent=p.nome[0];$('#petServ').textContent=p.serv;
  var ol=$('#steps');ol.innerHTML='';var base=p.ini.split(':').map(Number);
  ETAPAS.forEach(function(e,i){var li=document.createElement('li');li.className=i<p.etapa?'done':(i===p.etapa?(i===4?'done':'now'):'');var m=base[0]*60+base[1]+i*25;var hh=String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
    li.innerHTML='<span class="dot">'+(i<p.etapa||(i===4&&p.etapa===4)?'✓':i+1)+'</span><span>'+e+'</span><time>'+(i<=p.etapa?hh:'')+'</time>';ol.appendChild(li)});
  $('#ready').style.display=p.etapa===4?'block':'none';$('#nextStep').style.display=p.etapa===4?'none':'inline-flex'}
$('#codeForm').onsubmit=function(e){e.preventDefault();var c=$('#code').value.trim().toUpperCase();if(PETS[c]){cur=c;renderStatus()}else{$('#petServ').textContent='Código não encontrado. Confira o comprovante.'}};
$('#nextStep').onclick=function(){if(PETS[cur].etapa<4){PETS[cur].etapa++;renderStatus()}};

/* ---------- vacinas ---------- */
var VAC={'Cão':[['V10 (polivalente)',365],['Antirrábica',365],['Gripe canina',365],['Giárdia',365],['Dose da série de filhote',21]],'Gato':[['V4 / V5 felina',365],['Antirrábica',365],['FeLV (leucemia felina)',365],['Dose da série de filhote',21]]};
function iso(d){return d.toISOString().slice(0,10)}
function addDays(s,n){var d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return d}
function exemplo(){var h=new Date();var a=function(n){var d=new Date(h);d.setDate(d.getDate()-n);return iso(d)};return {pet:'Paçoca',esp:'Cão',doses:[['V10 (polivalente)',a(352),365],['Antirrábica',a(300),365],['Gripe canina',a(120),365],['Giárdia',a(380),365]]}}
var card=store.get('vac',null)||exemplo();
function fmt(d){return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})}
function renderVac(){
  $('#vPet').textContent=card.pet;$('#vInfo').textContent=card.esp+' · cartão digital · '+card.doses.length+' registro(s)';
  var ul=$('#vList');ul.innerHTML='';var hoje=new Date();hoje.setHours(12,0,0,0);var prox=null;
  card.doses.forEach(function(d){var n=addDays(d[1],d[2]);var diff=Math.round((n-hoje)/864e5);var cls=diff<0?'late':diff<=30?'soon':'ok';var txt=diff<0?'atrasada '+(-diff)+'d':diff===0?'hoje':'em '+diff+' dias';
    var li=document.createElement('li');li.innerHTML='<div><b>'+d[0]+'</b><div class="when">aplicada '+fmt(new Date(d[1]+'T12:00:00'))+'</div></div><div class="next '+cls+'">'+fmt(n)+'<div class="when">'+txt+'</div></div>';ul.appendChild(li);
    if(!prox||n<prox.n)prox={n:n,nome:d[0],diff:diff}});
  var vn=$('#vNext');
  if(prox){vn.innerHTML=(prox.diff<0?'⚠ Dose atrasada: ':'Próxima dose: ')+'<b>'+prox.nome+'</b> · '+fmt(prox.n)+($('#fLembrete').checked?'<br><span style="font-size:13px">Lembrete no WhatsApp em '+fmt(new Date(prox.n.getTime()-7*864e5))+'</span>':'')}else vn.textContent='Nenhuma dose registrada.';
}
function fillVac(){var s=$('#fVac');s.innerHTML='';VAC[$('#fEsp').value].forEach(function(v,i){var o=document.createElement('option');o.value=i;o.textContent=v[0]+(v[1]===365?' · reforço anual':' · próxima em 21 dias');s.appendChild(o)})}
$('#fEsp').onchange=fillVac;$('#fLembrete').onchange=renderVac;
$('#fData').value=iso(new Date());
$('#vForm').onsubmit=function(e){e.preventDefault();var esp=$('#fEsp').value,v=VAC[esp][+$('#fVac').value];var nome=$('#fPet').value.trim()||'Meu pet';
  if(nome!==card.pet||esp!==card.esp){card={pet:nome,esp:esp,doses:[]}}
  card.doses=card.doses.filter(function(d){return d[0]!==v[0]});card.doses.push([v[0],$('#fData').value||iso(new Date()),v[1]]);store.set('vac',card);renderVac()};
$('#vReset').onclick=function(){card=exemplo();store.set('vac',null);$('#fPet').value='Paçoca';$('#fEsp').value='Cão';fillVac();renderVac()};

/* ---------- loja ---------- */
var ICON={
 racao:'<svg viewBox="0 0 64 64"><path d="M16 10h32l4 46H12z" fill="#c9a77a"/><path d="M16 10h32l-2 8H18z" fill="#a8855a"/><g fill="#f3ece1"><circle cx="26" cy="31" r="3"/><circle cx="32" cy="28" r="3"/><circle cx="38" cy="31" r="3"/><path d="M32 35c-4 0-6 3.5-6 5.5 0 1.6 1.4 2.2 2.7 1.9 1.2-.3 2-.8 3.3-.8s2.1.5 3.3.8c1.3.3 2.7-.3 2.7-1.9 0-2-2-5.5-6-5.5z"/></g></svg>',
 petisco:'<svg viewBox="0 0 64 64"><path d="M14 28a6 6 0 1 1 8-8l20 0a6 6 0 1 1 8 8 6 6 0 1 1-8 8H22a6 6 0 1 1-8-8z" fill="#c99a3b" transform="rotate(-20 32 32)"/></svg>',
 shampoo:'<svg viewBox="0 0 64 64"><rect x="26" y="6" width="12" height="8" rx="2" fill="#64735a"/><rect x="20" y="14" width="24" height="44" rx="8" fill="#dfe3d4" stroke="#64735a" stroke-width="2"/><path d="M26 34h12M26 40h8" stroke="#64735a" stroke-width="2.5" stroke-linecap="round"/></svg>',
 brinquedo:'<svg viewBox="0 0 64 64"><path d="M10 32c8-6 14 6 22 0s14 6 22 0" stroke="#b4532c" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="10" cy="32" r="6" fill="#64735a"/><circle cx="54" cy="32" r="6" fill="#64735a"/></svg>',
 coleira:'<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="18" stroke="#8f3f1f" stroke-width="7" fill="none"/><circle cx="32" cy="54" r="5" fill="#c99a3b"/></svg>',
 areia:'<svg viewBox="0 0 64 64"><path d="M14 18h36l-4 38H18z" fill="#eae0d1" stroke="#a8855a" stroke-width="2"/><path d="M20 30h24" stroke="#a8855a" stroke-width="2"/><circle cx="32" cy="42" r="5" fill="#a8855a"/></svg>',
 cama:'<svg viewBox="0 0 64 64"><ellipse cx="32" cy="40" rx="26" ry="14" fill="#b4532c"/><ellipse cx="32" cy="37" rx="18" ry="8" fill="#e8d6bf"/></svg>',
 remedio:'<svg viewBox="0 0 64 64"><rect x="12" y="20" width="40" height="28" rx="6" fill="#fbf7f1" stroke="#64735a" stroke-width="2"/><path d="M32 26v16M24 34h16" stroke="#b4532c" stroke-width="4" stroke-linecap="round"/></svg>'
};
var PRODS=[
 {id:1,cat:'Alimentação',n:'Ração premium cães adultos',d:'15 kg · frango e arroz',p:189.9,i:'racao'},
 {id:2,cat:'Alimentação',n:'Ração gatos castrados',d:'10 kg · salmão',p:169.9,i:'racao'},
 {id:3,cat:'Alimentação',n:'Petisco de carne desidratada',d:'pacote 200 g',p:24.9,i:'petisco'},
 {id:4,cat:'Higiene',n:'Shampoo neutro pelagem clara',d:'500 ml',p:39.9,i:'shampoo'},
 {id:5,cat:'Higiene',n:'Areia granulada para gatos',d:'4 kg',p:29.9,i:'areia'},
 {id:6,cat:'Acessórios',n:'Brinquedo de corda trançada',d:'algodão · médio',p:27.9,i:'brinquedo'},
 {id:7,cat:'Acessórios',n:'Coleira de couro com plaquinha',d:'gravação do nome inclusa',p:59.9,i:'coleira'},
 {id:8,cat:'Acessórios',n:'Caminha redonda lavável',d:'60 cm',p:139.9,i:'cama'}
];
var cart=store.get('cart',{}),filtro='Todos';
function renderShop(){
  var f=$('#filters');f.innerHTML='';['Todos','Alimentação','Higiene','Acessórios'].forEach(function(c){f.appendChild(chip(c,'',filtro===c,function(){filtro=c;renderShop()}))});
  var g=$('#prods');g.innerHTML='';PRODS.filter(function(p){return filtro==='Todos'||p.cat===filtro}).forEach(function(p){var q=cart[p.id]||0;var el=document.createElement('article');el.className='prod';
    el.innerHTML='<div class="pic">'+ICON[p.i]+'</div><h4>'+p.n+'</h4><small>'+p.d+'</small><div class="pr">'+brl(p.p)+'</div>';
    var b=document.createElement('button');b.className='add'+(q?' in':'');b.textContent=q?'No pedido: '+q+'  ·  +1':'Adicionar';b.onclick=function(){cart[p.id]=(cart[p.id]||0)+1;store.set('cart',cart);renderShop()};el.appendChild(b);g.appendChild(el)});
  var tot=0,n=0;Object.keys(cart).forEach(function(k){var p=PRODS.filter(function(x){return x.id==k})[0];if(p){tot+=p.p*cart[k];n+=cart[k]}});
  $('#cart').classList.toggle('show',n>0);$('#cartQtd').textContent=n+(n===1?' item':' itens')+' · toque para limpar';$('#cartTotal').textContent=brl(Math.round(tot*100)/100);
}
$('#cartQtd').onclick=function(){cart={};store.set('cart',cart);renderShop()};
$('#cartSend').onclick=function(){var l=[],tot=0;Object.keys(cart).forEach(function(k){var p=PRODS.filter(function(x){return x.id==k})[0];if(p){l.push(cart[k]+'x '+p.n+' ('+p.d+') · '+brl(p.p*cart[k]));tot+=p.p*cart[k]}});
  openModal('Pedido pronto','Confira e envie. A loja responde com o prazo de entrega no seu bairro.','Olá! Quero fazer este pedido na lojinha do Pet Lar:\n'+l.join('\n')+'\nTotal: '+brl(Math.round(tot*100)/100)+'\nEntrega ou retirada: ')};

/* ---------- planos ---------- */
var planPorte='M';
function renderPlans(){
  var c=$('#planPorte');c.innerHTML='';PORTES.forEach(function(x){c.appendChild(chip('Porte '+x.nome,'',planPorte===x.id,function(){planPorte=x.id;renderPlans()}))});
  var b=SERV[0].p[planPorte];var ltm=12;
  var P=[
    {n:'Avulso',tag:'',v:b,un:'por banho',save:'',it:['Paga só quando usa','Horário conforme agenda livre'],no:['Horário fixo reservado','Leva e traz incluso','Hidratação grátis']},
    {n:'Plano 2 banhos',tag:'',v:Math.round(b*2*.9),un:'por mês',save:'Economia de '+brl(Math.round(b*2-b*2*.9))+' por mês',it:['2 banhos a cada mês','Horário fixo quinzenal','10% de desconto na loja'],no:['Leva e traz incluso','Hidratação grátis']},
    {n:'Plano 4 banhos',tag:'Mais escolhido',v:Math.round(b*4*.8),un:'por mês',save:'Economia de '+brl(Math.round(b*4-b*4*.8+ltm*4))+' por mês com leva e traz',it:['4 banhos a cada mês','Horário fixo semanal','Leva e traz incluso (Centro e vilas)','1 hidratação grátis por mês','10% de desconto na loja'],no:[]}
  ];
  var g=$('#plans');g.innerHTML='';P.forEach(function(p,i){var d=document.createElement('div');d.className='plan'+(p.tag?' best':'');
    d.innerHTML=(p.tag?'<span class="tag">'+p.tag+'</span>':'')+'<h3>'+p.n+'</h3><div class="price">'+brl(p.v)+' <small>'+p.un+'</small></div><span class="save" style="'+(p.save?'':'visibility:hidden')+'">'+(p.save||'-')+'</span><ul>'+p.it.map(function(x){return '<li>'+x+'</li>'}).join('')+p.no.map(function(x){return '<li class="no">'+x+'</li>'}).join('')+'</ul>';
    var bt=document.createElement('button');bt.className='btn '+(p.tag?'btn-terra':'btn-line');bt.textContent=i===0?'Agendar avulso':'Assinar '+p.n.toLowerCase();
    bt.onclick=function(){if(i===0){location.hash='#agendar';return}openModal('Assinatura (simulação)','Você escolheu o '+p.n+' para porte '+PORTES.filter(function(x){return x.id===planPorte})[0].nome.toLowerCase()+'. A cobrança mensal seria feita por link de pagamento recorrente. Nesta demonstração nenhum valor é cobrado.','Olá! Quero assinar o '+p.n+' (porte '+planPorte+') por '+brl(p.v)+'/mês.')};
    d.appendChild(bt);g.appendChild(d)});
  var rows=[['Banhos no mês','1 (avulso)','2','4'],['Custo por banho',brl(b),brl(Math.round(b*.9)),brl(Math.round(b*.8))],['Horário fixo','–','quinzenal','semanal'],['Leva e traz','à parte','à parte','incluso'],['Hidratação','R$ 25','R$ 25','1 grátis'],['Fidelidade','–','sem multa','sem multa']];
  $('#cmp').innerHTML='<thead><tr><th>Porte '+planPorte+'</th><th>Avulso</th><th>2 banhos</th><th class="hl">4 banhos</th></tr></thead><tbody>'+rows.map(function(r){return '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td><td class="hl"><b>'+r[3]+'</b></td></tr>'}).join('')+'</tbody>';
}

/* ---------- modal ---------- */
function openModal(t,txt,msg){$('#mTitle').textContent=t;$('#mText').textContent=txt;$('#mMsg').textContent=msg;$('#mWa').href=WA+encodeURIComponent(msg);$('#modal').classList.add('open')}
$('#mClose').onclick=function(){$('#modal').classList.remove('open')};
$('#modal').onclick=function(e){if(e.target.id==='modal')$('#modal').classList.remove('open')};

fillVac();renderBook();renderStatus();renderVac();renderShop();renderPlans();
})();

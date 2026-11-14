(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var brl=function(v){var d=Math.round(v*100)%100?2:0;return 'R$ '+v.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d})};
var WA='https://wa.me/5514000000000?text=';
var store={get:function(k,d){try{var v=localStorage.getItem('mov.'+k);return v?JSON.parse(v):d}catch(e){return d}},set:function(k,v){try{localStorage.setItem('mov.'+k,JSON.stringify(v))}catch(e){}}};
function chip(html,pressed,fn){var b=document.createElement('button');b.type='button';b.className='chip';b.setAttribute('aria-pressed',pressed?'true':'false');b.innerHTML=html;b.onclick=fn;return b}
function tabs(el,items,cur,fn){el.innerHTML='';items.forEach(function(t,i){var b=document.createElement('button');b.type='button';b.textContent=t;b.setAttribute('aria-pressed',i===cur?'true':'false');b.onclick=function(){fn(i)};el.appendChild(b)})}

/* ---------- grade ---------- */
var DIAS=['Seg','Ter','Qua','Qui','Sex','Sáb'];
var T={F:['Funcional','todos os níveis'],H:['HIIT 30','intermediário'],M:['Mobilidade','iniciante'],C:['Core e glúteo','todos os níveis'],S:['Funcional 60+','iniciante'],K:['Força com kettlebell','intermediário']};
var PROF=['Prof. Rafa','Prof. Lia','Prof. Duda','Prof. Caio'];
var BASE=[
 [['06:00','F',0,10],['07:00','H',0,12],['09:00','S',1,6],['12:10','H',3,8],['17:30','M',1,4],['18:30','F',2,12],['19:30','K',3,9],['20:30','C',2,5]],
 [['06:00','K',3,7],['07:00','F',0,11],['09:00','M',1,3],['12:10','F',2,9],['18:00','C',1,8],['18:30','H',0,12],['19:30','F',2,10],['20:30','M',3,2]],
 [['06:00','F',0,9],['07:00','H',0,12],['09:00','S',1,7],['12:10','H',3,6],['17:30','M',1,5],['18:30','F',2,12],['19:30','K',3,11],['20:30','C',2,4]],
 [['06:00','K',3,6],['07:00','F',0,10],['09:00','M',1,2],['12:10','F',2,8],['18:00','C',1,9],['18:30','H',0,11],['19:30','F',2,12],['20:30','M',3,3]],
 [['06:00','F',0,8],['07:00','H',0,9],['09:00','S',1,5],['12:10','H',3,7],['17:30','M',1,3],['18:30','F',2,10],['19:30','C',2,6]],
 [['08:00','F',0,11],['09:00','K',3,8],['10:00','M',1,4],['11:00','F',2,7]]
];
var CAP=12;
var res=store.get('res',{});var wait=store.get('wait',{});
var agora=new Date(),hoje=agora.getDay();var dia=(hoje>=1&&hoje<=5)||(hoje===6&&agora.getHours()<11)?hoje-1:0;
function key(d,i){return d+'-'+i}
function vagas(d,i){var c=BASE[d][i];return c[3]+(res[key(d,i)]?1:0)}
function renderGrade(){
  tabs($('#dayTabs'),DIAS,dia,function(i){dia=i;renderGrade()});
  var g=$('#grid');g.innerHTML='';
  BASE[dia].forEach(function(c,i){var t=T[c[1]],oc=vagas(dia,i),full=oc>=CAP,mine=!!res[key(dia,i)],w=!!wait[key(dia,i)];
    var el=document.createElement('div');el.className='cls';
    el.innerHTML='<time>'+c[0]+'</time><h3>'+t[0]+'</h3><div class="act"></div><div class="meta"><span>'+PROF[c[2]]+'</span><span class="lvl">'+t[1]+'</span><span class="bar'+(full?' full':'')+'"><i style="width:'+Math.round(oc/CAP*100)+'%"></i></span></div>';
    var a=el.querySelector('.act');var b=document.createElement('button');b.className='rsv'+(mine||w?' on':'');
    b.textContent=mine?'Reservado ✓':w?'Na fila ✓':full?'Avisar':'Reservar';
    b.onclick=function(){var k=key(dia,i);if(mine){delete res[k]}else if(w){delete wait[k]}else if(full){wait[k]=1}else{res[k]=1}store.set('res',res);store.set('wait',wait);renderGrade();renderAluno()};
    a.appendChild(b);var s=document.createElement('small');s.textContent=full?'turma cheia':(CAP-oc)+' de '+CAP+' vagas';a.appendChild(s);g.appendChild(el)});
  fillExp();
}

/* ---------- experimental ---------- */
var OBJ=['Emagrecer','Ganhar força','Condicionamento','Aliviar dores'];var obj=0;
function renderObj(){var o=$('#objetivos');o.innerHTML='';OBJ.forEach(function(x,i){o.appendChild(chip(x,obj===i,function(){obj=i;renderObj()}))})}
function fillExp(){var s=$('#eAula');var cur=s.value;s.innerHTML='';for(var k=0;k<3;k++){var d=(dia+k)%6;BASE[d].forEach(function(c,i){if(vagas(d,i)<CAP){var o=document.createElement('option');o.value=d+'-'+i;o.textContent=DIAS[d]+' '+c[0]+' · '+T[c[1]][0]+' · '+(CAP-vagas(d,i))+(CAP-vagas(d,i)===1?' vaga':' vagas');s.appendChild(o)}})}if(cur)s.value=cur;if(!s.value&&s.options.length)s.selectedIndex=0}
$('#expForm').onsubmit=function(e){e.preventDefault();if(!$('#eAula').value)return;var p=$('#eAula').value.split('-').map(Number);var c=BASE[p[0]][p[1]];var nome=$('#eNome').value.trim();
  var t=$('#ticket');t.style.display='block';
  t.innerHTML='<span class="mono" style="font-size:11.5px;color:var(--rust)">AULA EXPERIMENTAL CONFIRMADA</span><h3>'+nome.split(' ')[0]+', te esperamos!</h3><dl><dt>Aula</dt><dd>'+T[c[1]][0]+' · '+PROF[c[2]]+'</dd><dt>Quando</dt><dd>'+DIAS[p[0]]+', '+c[0]+' (chegue 10 min antes)</dd><dt>Objetivo</dt><dd>'+OBJ[obj]+'</dd></dl><div class="cut"></div><a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="'+WA+encodeURIComponent('Olá! Sou '+nome+' e reservei a aula experimental: '+T[c[1]][0]+', '+DIAS[p[0]]+' às '+c[0]+'. Objetivo: '+OBJ[obj]+'.')+'">Receber lembrete no WhatsApp</a>';
  $('#expForm').style.display='none';
};

/* ---------- pico ---------- */
var H=[6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21];
var PICO=[
 [9,11,4,5,2,2,8,3,1,1,2,6,12,11,9,5],[8,11,3,4,2,2,9,3,1,1,2,7,12,10,8,4],[9,12,4,5,2,2,8,3,1,1,2,6,12,11,9,5],[8,10,3,4,2,2,8,3,1,2,2,7,11,12,8,4],[8,9,3,5,2,2,7,3,1,1,2,5,10,8,6,2],[0,0,10,9,7,6,0,0,0,0,0,0,0,0,0,0]
];
var pd=(dia===5?0:dia);
function renderPico(){tabs($('#picoTabs'),DIAS,pd,function(i){pd=i;renderPico()});
  var ch=$('#chart');ch.innerHTML='';var hr=new Date().getHours();var now=(pd===hoje-1)?hr:-1;var best=null;
  PICO[pd].forEach(function(v,i){var b=document.createElement('div');var cls=v>=10?'hi':v>=6?'mid':'';b.className='b '+cls+(H[i]===now?' now':'');b.style.height=Math.max(2,v/CAP*100)+'%';b.title=H[i]+'h: '+v+' alunos em média';if(v)b.innerHTML='<span>'+v+'</span>';ch.appendChild(b);
    if(v>0&&v<=4&&(H[i]>=17||H[i]<=8)&&!best)best=H[i]});
  $('#hours').innerHTML=H.map(function(h){return '<span>'+h+'h</span>'}).join('');
  var mx=Math.max.apply(null,PICO[pd]),pk=H[PICO[pd].indexOf(mx)];
  $('#tip').innerHTML='<b>'+DIAS[pd]+':</b> mais cheio às '+pk+'h. '+(pd===5?'Sábado só tem aulas pela manhã; às 11h costuma ser mais tranquilo.':'Quer pegar o estúdio mais calmo depois do trabalho? A aula das 20h30 costuma ter metade das vagas livres.');
}

/* ---------- planos ---------- */
var FREQ=['2x por semana','3x por semana','Livre'];var FREQC=['2x/sem','3x/sem','Livre'];var BASEP=[169,209,259];var fq=1;
var PER=[['Mensal',1,0,'Sem fidelidade'],['Trimestral',3,.1,'10% de desconto'],['Anual',12,.2,'20% de desconto']];
function price(f,p){return Math.round(BASEP[f]*(1-PER[p][2]))}
function renderPlans(){tabs($('#freq'),FREQ,fq,function(i){fq=i;renderPlans()});
  var g=$('#plans');g.innerHTML='';PER.forEach(function(p,i){var v=price(fq,i);var d=document.createElement('div');d.className='plan'+(i===1?' best':'');
    var it=[FREQ[fq]+' em qualquer turma com vaga','Avaliação física inicial inclusa','App com treino do dia e check-in'];if(i>=1)it.push('Reavaliação a cada 3 meses');if(i===2)it.push('1 mês de congelamento por ano');
    d.innerHTML=(i===1?'<span class="badge">mais escolhido</span>':'')+'<h3>'+p[0]+'</h3><div class="pr">'+brl(v)+'<small>/mês</small></div><div class="tot">'+(p[1]>1?p[1]+'x de '+brl(v)+' · '+p[3]:p[3])+'</div><ul>'+it.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ul>';
    var b=document.createElement('button');b.className='btn '+(i===1?'btn-rust':'btn-ink');b.textContent='Matricular no '+p[0].toLowerCase();b.onclick=function(){matricula(i)};d.appendChild(b);g.appendChild(d)});
  $('#cmp').innerHTML='<thead><tr><th>Valor por mês</th>'+FREQC.map(function(f,i){return '<th'+(i===fq?' style="color:var(--rust)"':'')+'>'+f+'</th>'}).join('')+'</tr></thead><tbody>'+PER.map(function(p,pi){return '<tr><td>'+p[0]+'</td>'+FREQ.map(function(f,fi){return '<td'+(fi===fq?' style="font-weight:600"':'')+'>'+brl(price(fi,pi))+'</td>'}).join('')+'</tr>'}).join('')+'<tr><td>Por aula (mensal)</td>'+[8,12,20].map(function(n,fi){return '<td>~'+brl(Math.round(BASEP[fi]/((fi===2)?20:n*1)))+'</td>'}).join('')+'</tr><tr><td>Taxa de matrícula</td><td>isenta</td><td>isenta</td><td>isenta</td></tr></tbody>';
}

/* ---------- modal matrícula ---------- */
var M={};
function sheet(html){$('#sheet').innerHTML=html;$('#modal').classList.add('open')}
function close(){$('#modal').classList.remove('open')}
$('#modal').onclick=function(e){if(e.target.id==='modal')close()};
function stepper(n){return '<div class="stepper">'+[0,1,2].map(function(i){return '<i class="'+(i<=n?'on':'')+'"></i>'}).join('')+'</div>'}
function matricula(p){M={p:p,f:fq,v:price(fq,p)};
  sheet(stepper(0)+'<span class="mono" style="font-size:11.5px;color:var(--ink-2)">PASSO 1 DE 3</span><h3>Seus dados</h3><p>'+PER[p][0]+' · '+FREQ[fq]+' · '+brl(M.v)+'/mês</p><div class="form" style="margin-top:14px"><input type="text" id="mNome" placeholder="Nome completo" aria-label="Nome completo"><input type="tel" id="mTel" placeholder="WhatsApp" aria-label="WhatsApp"><label style="display:flex;gap:10px;font-size:14px;align-items:flex-start"><input type="checkbox" id="mOk" style="width:18px;height:18px;accent-color:var(--rust)"> Li o contrato e as regras de cancelamento (exemplo)</label></div><div class="row"><button class="btn btn-rust" id="m1">Continuar</button><button class="btn btn-ghost" id="mX">Cancelar</button></div>');
  $('#mX').onclick=close;$('#m1').onclick=function(){M.nome=$('#mNome').value.trim()||'Aluno demo';pagamento()};}
function pagamento(){var tot=M.v*PER[M.p][1];
  sheet(stepper(1)+'<span class="mono" style="font-size:11.5px;color:var(--ink-2)">PASSO 2 DE 3</span><h3>Pagamento</h3><p>Primeira cobrança: <b>'+brl(PER[M.p][1]>1?tot:M.v)+'</b>'+(PER[M.p][1]>1?' ('+PER[M.p][1]+'x de '+brl(M.v)+' no cartão ou à vista no Pix)':'')+'</p><div class="pay"><label><input type="radio" name="pg" value="pix" checked><span><b>Pix</b><small>QR code na hora, confirmação automática</small></span></label><label><input type="radio" name="pg" value="card"><span><b>Cartão de crédito</b><small>Você é levado ao link seguro do meio de pagamento</small></span></label></div><div class="qr" id="qr"><svg width="86" height="86" viewBox="0 0 21 21" aria-hidden="true">'+qr()+'</svg><div><b>Pix simulado</b><p style="font-size:13px">Nenhum valor é cobrado nesta demonstração.</p></div></div><div class="row"><button class="btn btn-rust" id="m2">Simular pagamento aprovado</button><button class="btn btn-ghost" id="mX">Voltar</button></div><p class="note">Na versão real o site usa o link de pagamento do banco ou da maquininha do estúdio. Dados de cartão nunca passam pelo site.</p>');
  document.querySelectorAll('input[name=pg]').forEach(function(r){r.onchange=function(){$('#qr').style.display=r.value==='pix'&&r.checked?'flex':'none'}});
  $('#mX').onclick=function(){matricula(M.p)};$('#m2').onclick=feito}
function qr(){var s='',r=7;for(var y=0;y<21;y++)for(var x=0;x<21;x++){var f=(x<7&&y<7)||(x>13&&y<7)||(x<7&&y>13);var on=f?((x%14<7&&y%14<7)&&(Math.max(Math.abs(x%14-3),Math.abs(y%14-3))!==2)):((r=(r*9301+49297)%233280)/233280>.5);if(on)s+='<rect x="'+x+'" y="'+y+'" width="1" height="1"/>'}return s}
function feito(){var n='MOV-'+(4100+Math.floor(Math.random()*800));
  sheet(stepper(2)+'<span class="mono" style="font-size:11.5px;color:var(--olive)">MATRÍCULA CONFIRMADA</span><h3>Bem-vindo, '+M.nome.split(' ')[0]+'!</h3><p>Matrícula <b class="mono">'+n+'</b> · '+PER[M.p][0]+' · '+FREQ[M.f]+'.</p><ol class="steps" style="margin-top:12px"><li>Agende sua avaliação física (inclusa)</li><li>Reserve as aulas na grade</li><li>Faça check-in na área do aluno ao chegar</li></ol><div class="row"><a class="btn btn-rust" href="#avaliacao" id="mGo">Agendar avaliação</a><button class="btn btn-ghost" id="mX">Fechar</button></div>');
  $('#mX').onclick=close;$('#mGo').onclick=close}

/* ---------- área do aluno ---------- */
var DEMO={nome:'Aluno demo',ck:[0,2],done:{'0-0':1,'0-1':1}};var aluno=store.get('aluno',DEMO);
var WOD=[
 ['Aquecimento · 8 min',[['Polichinelo','2 x 40 s'],['Mobilidade de quadril','10 cada lado'],['Prancha alta com toque no ombro','2 x 12']]],
 ['Bloco A · EMOM 12 min',[['Kettlebell swing','15 rep'],['Agachamento goblet','12 rep'],['Remada com elástico','12 rep']]],
 ['Bloco B · 3 rodadas',[['Afundo alternado','10 cada perna'],['Flexão (joelho no chão se precisar)','8 a 12'],['Corda naval','30 s']]],
 ['Volta à calma · 5 min',[['Alongamento de posterior','2 x 30 s'],['Respiração diafragmática','1 min']]]
];
function renderAluno(){var a=$('#alunoArea');
  if(!aluno){a.innerHTML='<div class="panel login" style="grid-column:1/-1"><p class="muted" style="margin-bottom:16px">Área do aluno simulada. Entre para ver como o aluno usa no celular.</p><button class="btn btn-rust" id="login">Entrar como aluno demo</button></div>';$('#login').onclick=function(){aluno=JSON.parse(JSON.stringify(DEMO));store.set('aluno',aluno);renderAluno()};return}
  var td=dia;var ckToday=aluno.ck.indexOf(td)>=0;var minhas=Object.keys(res).map(function(k){var p=k.split('-').map(Number);return DIAS[p[0]]+' '+BASE[p[0]][p[1]][0]+' · '+T[BASE[p[0]][p[1]][1]][0]});
  var tot=0,ok=0;WOD.forEach(function(b,bi){b[1].forEach(function(e,ei){tot++;if(aluno.done[bi+'-'+ei])ok++})});
  a.innerHTML='<div class="panel"><div class="hello"><div><span class="mono" style="font-size:11.5px;color:#a9a99f">OLÁ,</span><br><b>'+aluno.nome+'</b></div><button class="btn btn-ghost btn-sm" id="sair" style="color:#b5b3a8">Sair</button></div><button class="checkin'+(ckToday?' done':'')+'" id="ck">'+(ckToday?'Check-in feito ✓':'Fazer check-in')+'</button><div class="week">'+DIAS.map(function(d,i){return '<div>'+d+'<i class="'+(aluno.ck.indexOf(i)>=0?'on':'')+(i===td?' today':'')+'"></i></div>'}).join('')+'</div><p class="streak">'+aluno.ck.length+' treino(s) nesta semana · meta: '+(fq+2>4?5:fq+2)+'</p><div style="margin-top:18px;border-top:1px solid #3a3c36;padding-top:14px"><span class="mono" style="font-size:11.5px;color:#a9a99f">MINHAS RESERVAS</span><p style="margin-top:6px;font-size:14.5px">'+(minhas.length?minhas.join('<br>'):'Nenhuma ainda. Reserve na grade acima.')+'</p></div></div>'+
  '<div class="panel wod"><span class="mono" style="font-size:11.5px;color:#a9a99f">TREINO DO DIA · '+DIAS[td].toUpperCase()+'</span><h3>Funcional · corpo todo</h3><p class="muted" style="font-size:14px">Carga sugerida pelo Prof. Rafa a partir da sua última avaliação.</p><div class="prog"><i style="width:'+Math.round(ok/tot*100)+'%"></i></div><p class="mono" style="font-size:12px;margin-top:6px;color:#b5b3a8">'+ok+' de '+tot+' exercícios</p>'+WOD.map(function(b,bi){return '<div class="blk"><h4>'+b[0]+'</h4>'+b[1].map(function(e,ei){var k=bi+'-'+ei,d=!!aluno.done[k];return '<label class="ex'+(d?' ok':'')+'"><input type="checkbox" data-k="'+k+'"'+(d?' checked':'')+'><span>'+e[0]+'</span><em>'+e[1]+'</em></label>'}).join('')+'</div>'}).join('')+'</div>';
  $('#ck').onclick=function(){if(!ckToday){aluno.ck.push(td);store.set('aluno',aluno);renderAluno()}};
  $('#sair').onclick=function(){aluno=null;store.set('aluno',false);renderAluno()};
  a.querySelectorAll('input[data-k]').forEach(function(c){c.onchange=function(){if(c.checked)aluno.done[c.dataset.k]=1;else delete aluno.done[c.dataset.k];store.set('aluno',aluno);renderAluno()}});
}

/* ---------- avaliação ---------- */
var avD=null,avH=null,avT=0;var avDias=[];(function(){var d=new Date();d.setHours(0,0,0,0);while(avDias.length<7){d.setDate(d.getDate()+1);if(d.getDay()!==0)avDias.push(new Date(d))}})();
var DW=['dom','seg','ter','qua','qui','sex','sáb'];var AVH=['07:00','08:00','10:00','14:00','15:00','16:00','17:00','20:00'];
function renderAv(){var dd=$('#avDias');dd.innerHTML='';avDias.forEach(function(d,i){dd.appendChild(chip(DW[d.getDay()]+'<b>'+d.getDate()+'</b>',avD===i,function(){avD=i;avH=null;renderAv()}))});
  var s=$('#avSlots');s.innerHTML='';if(avD===null){s.innerHTML='<p class="note" style="grid-column:1/-1;margin:0">Escolha um dia.</p>'}else{var sab=avDias[avD].getDay()===6;AVH.forEach(function(h,i){if(sab&&parseInt(h)>11)return;var b=chip(h,avH===h,function(){avH=h;renderAv()});if((i*7+avDias[avD].getDate())%3===0){b.disabled=true}s.appendChild(b)})}
  var t=$('#avTipo');t.innerHTML='';['Sim, sou aluno','Ainda não'].forEach(function(x,i){t.appendChild(chip(x,avT===i,function(){avT=i;renderAv()}))});
  $('#avPreco').textContent=avT===0?'Aluno: inclusa no plano (1 a cada 3 meses).':'Avulsa: R$ 90, abatidos se você se matricular em até 7 dias.'}
$('#avOk').onclick=function(){if(avD===null||!avH){$('#avPreco').textContent='Escolha dia e horário.';return}var q=DW[avDias[avD].getDay()]+', '+avDias[avD].toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+' às '+avH;
  sheet('<span class="mono" style="font-size:11.5px;color:var(--olive)">AVALIAÇÃO AGENDADA</span><h3>'+q+'</h3><p>Venha com roupa leve, sem ter comido nas 2 horas anteriores e bem hidratado. Leve exames recentes, se tiver.</p><div class="row"><a class="btn btn-wa" target="_blank" rel="noopener" href="'+WA+encodeURIComponent('Olá! Agendei minha avaliação física para '+q+'.')+'">Confirmar no WhatsApp</a><button class="btn btn-ghost" id="mX">Fechar</button></div><p class="note">Demonstração: número fictício.</p>');$('#mX').onclick=close};

renderObj();renderGrade();renderPico();renderPlans();renderAluno();renderAv();
})();

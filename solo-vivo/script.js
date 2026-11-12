const $=(s,e=document)=>e.querySelector(s),$$=(s,e=document)=>[...e.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),f1=n=>n.toFixed(1).replace('.',',');
const Z=[['Milho','🌽',62,60],['Soja','🫘',48,55],['Café','☕',70,65],['Horta vertical','🥬',55,70],['Pomar','🍊',66,60],['Trigo','🌾',40,50]].map(([n,e,m,t])=>({n,e,m,t,open:false}));
const C=[['Milho','🌽',96,11.4],['Soja','🫘',64,8.2],['Café','☕',38,3.6],['Horta vertical','🥬',88,5.1],['Pomar','🍊',20,9.7]].map(([n,e,g,y])=>({n,e,g,y}));
const U=[['Falcão','🛸','Drone de monitoramento'],['Ceifa-X','🤖','Robô colheitadeira'],['Semeia','🚜','Robô semeador'],['Brisa','🚁','Drone pulverizador']].map(([n,e,r],i)=>({n,e,r,bat:[88,64,100,45][i],on:i<2}));
let auto=true,tank=82,hour=6,day=1,harv=0,hist=[],warnedTank=false;
const log=(m)=>{const l=$('#log'),li=document.createElement('li');li.innerHTML=`<time>${$('#clk').textContent}</time><span>${m}</span>`;l.prepend(li);while(l.children.length>5)l.lastChild.remove()};

/* abas */
$$('.tabs button').forEach(b=>b.onclick=()=>{$$('.tabs button').forEach(x=>x.setAttribute('aria-selected',x===b));$$('.view').forEach(v=>v.classList.toggle('on',v.id==='v-'+b.dataset.v));scrollTo({top:0,behavior:'smooth'})});
$('#theme').onclick=()=>{const r=document.documentElement,d=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches;r.dataset.theme=d?'light':'dark'};

$$('[data-go]').forEach(b=>b.onclick=()=>$('.tabs [data-v="'+b.dataset.go+'"]').click());
/* construção */
$('#zones').innerHTML=Z.map((z,i)=>`<div class="card zone"><div class="zimg pi pi${i}"></div><div class="top2"><h3>${z.e} ${z.n}</h3><span class="state" id="zs${i}">Fechada</span></div>
<div class="val" id="zm${i}">0%</div><div class="bar" id="zb${i}"><i></i></div>
<label>Umidade desejada <b id="zt${i}">${z.t}%</b></label><input type="range" min="30" max="85" value="${z.t}" id="zr${i}" aria-label="Umidade desejada de ${z.n}">
<button class="btn ghost" id="zv${i}" style="width:100%;margin-top:8px">Abrir válvula</button></div>`).join('');
Z.forEach((z,i)=>{$('#zr'+i).oninput=e=>{z.t=+e.target.value;$('#zt'+i).textContent=z.t+'%'};$('#zv'+i).onclick=()=>{if(auto)return;z.open=!z.open;draw()}});
$('#crops').innerHTML=C.map((c,i)=>`<div class="card crop"><div class="zimg pi pi${i}"></div><h3>${c.e} ${c.n}</h3><div class="bar"><i id="cg${i}"></i></div>
<div class="row"><span id="cp${i}">0%</span><span>Estimativa: ${f1(c.y)} t</span></div><button class="btn" id="cb${i}" disabled>Aguardando</button></div>`).join('');
C.forEach((c,i)=>$('#cb'+i).onclick=()=>{if(c.g<100)return;harv+=c.y;c.g=0;log(`Ceifa-X colheu ${f1(c.y)} t de ${c.n}.`);draw()});
$('#auto').onclick=e=>{auto=!auto;e.currentTarget.setAttribute('aria-checked',auto);$('#autoTxt').textContent=auto?'A IA abre e fecha as válvulas conforme a umidade desejada.':'Modo manual: você controla cada válvula.';log(auto?'Gaia assumiu a irrigação.':'Irrigação em modo manual.');draw()};
function unitsHTML(){$('#units').innerHTML=U.map((u,i)=>`<div class="unit"><span class="ic">${u.e}</span><div class="nf"><b>${u.n} · ${u.on?'Em missão':u.bat<100?'Carregando':'Em base'}</b><small>${u.r} · bateria ${Math.round(u.bat)}%</small><div class="bar ${u.bat<25?'warn':''}"><i style="width:${u.bat}%"></i></div></div><button class="btn ${u.on?'ghost':''}" data-u="${i}" ${u.bat<20&&!u.on?'disabled':''}>${u.on?'Recolher':'Enviar'}</button></div>`).join('')}
$('#units').onclick=e=>{const b=e.target.closest('[data-u]');if(!b)return;const u=U[b.dataset.u];u.on=!u.on;log(`${u.n} ${u.on?'saiu em missão':'voltou para a base'}.`);unitsHTML()};

/* gráfico */
function chart(){const W=320,H=130,p=14;const pts=hist.map((v,i)=>[p+i*(W-2*p)/29,H-p-(clamp(v,20,90)-20)/70*(H-2*p)]);
const ln=pts.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' ');
const yt=v=>H-p-(v-20)/70*(H-2*p);
$('#chart').innerHTML=`<defs><linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sky)" stop-opacity=".45"/><stop offset="1" stop-color="var(--sky)" stop-opacity="0"/></linearGradient></defs>
<rect x="${p}" y="${yt(65)}" width="${W-2*p}" height="${yt(55)-yt(65)}" fill="var(--g)" opacity=".15"/>
<text x="${p+2}" y="${yt(65)-3}" font-size="9" fill="var(--mut)">faixa ideal</text>
<path d="${ln} L${pts.at(-1)[0]} ${H-p} L${p} ${H-p}Z" fill="url(#gA)"/><path d="${ln}" fill="none" stroke="var(--sky)" stroke-width="2.5" stroke-linejoin="round"/>
<circle cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="4" fill="var(--lime)"/>`}

/* atualização da tela */
function impDraw(){
  const b=$('#impCrops');
  if(!b.children.length){b.innerHTML=Z.map((z,i)=>`<button class="ic2" data-go="irrig"><div class="im pi pi${i}"><small id="ig${i}"></small></div><div class="tx"><span><b>${z.n}</b><em id="ie${i}"></em></span><span class="arr">→</span></div></button>`).join('');$$('#impCrops .ic2').forEach(x=>x.onclick=()=>$('.tabs [data-v="irrig"]').click())}
  Z.forEach((z,i)=>{$('#ig'+i).textContent=z.open?'💧 irrigando':'solo '+Math.round(z.m)+'%';$('#ie'+i).textContent='meta '+z.t+'% de umidade'})}
function draw(){impDraw();
  const avg=Z.reduce((s,z)=>s+z.m,0)/Z.length,sun=Math.max(0,Math.sin(Math.PI*(hour-6)/12)),solar=sun*48;
  $('#kMoist').textContent=Math.round(avg)+'%';$('#kSolar').textContent=f1(solar)+' kW';$('#kSolarS').textContent=sun>0?'gerando':'bateria noturna';
  $('#kTank').textContent=Math.round(tank)+'%';$('#kTankL').textContent=Math.round(tank*500)+' mil L';
  $('#kHarv').textContent=f1(harv)+' t';$('#harv2').textContent=f1(harv)+' t';
  $('#tankTxt').textContent=Math.round(tank)+'%';$('#tankBar').className='bar'+(tank<20?' warn':'');$('#tankBar i').style.width=tank+'%';
  Z.forEach((z,i)=>{$('#zm'+i).textContent=Math.round(z.m)+'%';$('#zb'+i+' i').style.width=z.m+'%';
    const s=$('#zs'+i);s.textContent=z.open?'Irrigando':'Fechada';s.className='state'+(z.open?' on':'');
    const b=$('#zv'+i);b.textContent=auto?'Controlado pela IA':z.open?'Fechar válvula':'Abrir válvula';b.disabled=auto})
  C.forEach((c,i)=>{$('#cg'+i).style.width=c.g+'%';$('#cp'+i).textContent=Math.round(c.g)+'% crescido';const b=$('#cb'+i);b.disabled=c.g<100;b.textContent=c.g<100?'Aguardando':'Colher agora'});
  const h=Math.floor(hour),m=Math.floor((hour%1)*60);
  $('#clk').textContent=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');$('#day').textContent='Dia '+day;
  $('#wT').textContent=Math.round(16+12*sun)+'°C';$('#wH').textContent=Math.round(80-30*sun)+'%';$('#wW').textContent=Math.round(8+6*sun)+' km/h';$('#wR').textContent=Math.round(15+10*(1-sun))+'%';
  chart()}

/* simulação */
function tick(){
  hour+=.25;if(hour>=24){hour=0;day++;log('Novo dia na Solo Vivo.')}
  const sun=Math.max(0,Math.sin(Math.PI*(hour-6)/12));
  Z.forEach(z=>{
    z.m-=.35+sun*.45;
    if(auto&&tank>3)z.open=z.m<z.t-4?true:z.m>z.t+4?false:z.open;
    if(tank<=3&&z.open){z.open=false}
    if(z.open){z.m+=2.4;tank-=.4}
    z.m=clamp(z.m,20,95)});
  tank=clamp(tank+.14,0,100);
  if(tank<15&&!warnedTank){warnedTank=true;log('⚠️ Reservatório baixo. Gaia reduziu o uso.')}else if(tank>40)warnedTank=false;
  C.forEach((c,i)=>{const z=Z[i];if(c.g<100){c.g=Math.min(100,c.g+(z.m<30?.05:.3)+Math.random()*.1);if(c.g>=100)log(`${c.e} ${c.n} está pronto para colheita.`)}});
  U.forEach(u=>{if(u.on){u.bat-=1.6;if(u.bat<15){u.on=false;log(`${u.n} voltou para recarga.`)}}else u.bat=Math.min(100,u.bat+2.5)});
  hist.push(Z.reduce((s,z)=>s+z.m,0)/Z.length);if(hist.length>30)hist.shift();
  draw();unitsHTML();
}
for(let i=0;i<30;i++)hist.push(Z.reduce((s,z)=>s+z.m,0)/Z.length+Math.sin(i/4)*3);
log('Sistema iniciado. Todas as unidades online.');log('Gaia calibrou 6 talhões de cultivo.');
draw();unitsHTML();setInterval(tick,2000);

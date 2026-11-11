(async()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const brl=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const brl0=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0});
const fmt1=n=>n.toFixed(1).replace('.',',');
const dur=m=>`${Math.floor(m/60)}h${String(m%60).padStart(2,'0')}`;
const fmtLabel=f=>{const [a,b]=f.split(' ');return a+' '+(b==='DUB'?'dublado':b==='NAC'?'nacional':'legendado')};
const mulberry=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const hashStr=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const hexA=(h,a)=>{const n=parseInt(h.slice(1),16);return `rgba(${n>>16},${n>>8&255},${n&255},${a})`};
const ageBadge=m=>m.age?`<span class="age" data-a="${m.age}">${m.age}</span>`:'';
const metaRest=m=>`<span>${m.genre}</span>`+(m.min?`<span>${dur(m.min)}</span>`:'');

/* ---------- filmes ----------
   Filmes reais em cartaz (novembro de 2026). Para mostrar os cartazes oficiais, coloque em img/filmes/:
     <id>-cartaz.jpg  (vertical, 2:3, ex.: 600x900)
     <id>-fundo.jpg   (horizontal, 16:9, ex.: 1600x900)
   Depois de colocar os dois arquivos de um filme, mude imgs:false para imgs:true na linha dele.
   Sem os arquivos, o site mostra um cartaz tipográfico no lugar.
   age (classificação) e min (duração em minutos) ficam em branco até serem confirmados. */
const MOVIES=[
 {id:'godzilla-minus-zero',title:'Godzilla Minus Zero',genre:'Ação, ficção científica',age:'',min:0,tag:'Estreia da semana',imgs:false,color:'#2b3a42',syn:'Dois anos depois da guerra, o Japão tenta se reerguer quando uma nova ameaça surge, justo no momento em que a esperança começa a voltar.'},
 {id:'klara-e-o-sol',title:'Klara e o Sol',genre:'Drama, ficção científica',age:'',min:0,tag:'Estreia da semana',imgs:false,color:'#c9893a',syn:'Klara, uma Amiga Artificial, conhece Josie e acaba ajudando a curar uma família marcada por perdas e conflitos.'},
 {id:'street-fighter',title:'Street Fighter',genre:'Ação',age:'',min:0,tag:'Em cartaz',imgs:false,color:'#8c1d18',syn:'Os lutadores mais conhecidos dos games chegam à tela grande num torneio em que cada luta decide muito mais do que um título.'},
 {id:'homem-aranha-um-novo-dia',title:'Homem-Aranha: Um Novo Dia',genre:'Ação, aventura',age:'',min:0,tag:'Em cartaz',imgs:false,color:'#1d3c78',syn:'Uma nova fase para o herói da vizinhança, com Nova York de novo no centro da história.'},
 {id:'o-gatola-da-cartola',title:'O Gatola da Cartola',genre:'Animação, família',age:'',min:0,tag:'Para a família',imgs:false,color:'#d2462d',syn:'O Gatola precisa animar dois irmãos que acabaram de se mudar de cidade, e arrisca a própria cartola mágica numa missão cheia de confusão.'},
 {id:'os-farofeiros-3',title:'Os Farofeiros 3',genre:'Comédia',age:'',min:0,tag:'Cinema nacional',imgs:false,color:'#1f7a6a',syn:'A turma viaja ao Caribe para o casamento de Anita, filha de Rocha, numa ilha onde nada sai como o planejado.'}
];
const NM=MOVIES.length;

const lin=(x,x0,y0,x1,y1,st)=>{const g=x.createLinearGradient(x0,y0,x1,y1);st.forEach(([o,c])=>g.addColorStop(o,c));return g};

/* cartaz tipográfico usado enquanto o cartaz oficial não é adicionado */
function placeholder(m,kind){
  const bd=kind==='bd',w=bd?1280:600,h=bd?720:900,c=document.createElement('canvas');c.width=w;c.height=h;
  const x=c.getContext('2d'),pad=bd?120:48;
  x.fillStyle=m.color;x.fillRect(0,0,w,h);
  const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(255,255,255,.08)');g.addColorStop(1,'rgba(0,0,0,.35)');x.fillStyle=g;x.fillRect(0,0,w,h);
  x.strokeStyle='rgba(255,255,255,.18)';x.lineWidth=2;x.strokeRect(pad/2,pad/2,w-pad,h-pad);
  x.fillStyle='#fff';x.textBaseline='alphabetic';
  const words=m.title.split(' '),size=bd?96:78,lines=[];let line='';
  x.font=`700 ${size}px "Schibsted Grotesk",system-ui,sans-serif`;
  for(const wd of words){const t=line?line+' '+wd:wd;if(x.measureText(t).width>w-pad*2&&line){lines.push(line);line=wd}else line=t}lines.push(line);
  lines.forEach((l,i)=>x.fillText(l,pad,h-pad-(lines.length-1-i)*size*1.02));
  x.font=`500 ${bd?24:20}px "Schibsted Grotesk",system-ui,sans-serif`;x.fillStyle='rgba(255,255,255,.7)';
  x.fillText(m.genre,pad,pad+(bd?30:24));
  return c;
}
const loadImg=src=>new Promise(res=>{const i=new Image();i.decoding='async';i.onload=()=>res(i);i.onerror=()=>res(null);i.src=src});
async function prepMovies(){
  try{await Promise.race([document.fonts.load('700 40px "Schibsted Grotesk"'),new Promise(r=>setTimeout(r,1200))])}catch(_){}
  await Promise.all(MOVIES.map(async m=>{
    const [po,bd]=m.imgs?await Promise.all([loadImg(`img/filmes/${m.id}-cartaz.jpg`),loadImg(`img/filmes/${m.id}-fundo.jpg`)]):[null,null];
    if(po)m.poURL=po.src;else{const c=placeholder(m,'po');m.poURL=c.toDataURL('image/jpeg',.85);c.width=0}
    m.smURL=m.poURL;
    if(bd){m.bdURL=bd.src;m.bd=bd}else{const c=placeholder(m,'bd');m.bdURL=c.toDataURL('image/jpeg',.85);m.bd=c}
  }));
}
await prepMovies();

/* ---------- salas e sessões ---------- */
const ROOMS={
 1:{name:'Sala 1',rows:10,cols:14,rec:2,recAdd:8,base:28,screenW:12,z0:3.2,dz:1.05,desc:'A maior sala, com fileiras em degraus. As duas últimas fileiras têm poltronas reclináveis.'},
 2:{name:'Sala 2',rows:8,cols:12,rec:0,recAdd:0,base:24,screenW:9.5,z0:2.8,dz:1,desc:'Sala média, boa para animações e lançamentos em sessões da tarde.'},
 3:{name:'Sala 3 VIP',rows:6,cols:10,rec:6,recAdd:0,base:42,screenW:7.5,z0:2.6,dz:1.15,desc:'Todas as poltronas são reclináveis. Sala menor, com sessões em horário nobre.'}
};
const SCHED=[
 [1,'14:00',0,'3D LEG'],[1,'16:45',3,'3D LEG'],[1,'19:30',0,'3D LEG'],[1,'22:00',2,'2D LEG'],
 [2,'14:30',4,'2D DUB'],[2,'16:30',4,'2D DUB'],[2,'18:45',1,'2D LEG'],[2,'21:15',5,'2D NAC'],[2,'23:30',5,'2D NAC'],
 [3,'15:30',2,'VIP LEG'],[3,'18:15',3,'VIP LEG'],[3,'21:00',1,'VIP LEG']
];
const NOW=new Date();
const DAYS=[...Array(7)].map((_,i)=>new Date(NOW.getFullYear(),NOW.getMonth(),NOW.getDate()+i));
const WD=['dom','seg','ter','qua','qui','sex','sáb'],MO=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const longDate=new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'numeric',month:'long'});
const ALL=[];
DAYS.forEach((d,di)=>{
  const list=SCHED.slice();if(d.getDay()===0||d.getDay()===6)list.push([2,'11:00',4,'2D DUB']);
  list.forEach(([room,time,mi,fmt])=>{const [hh,mm]=time.split(':').map(Number);ALL.push({id:`${di}-${room}-${time}`,day:di,room,time,mi,fmt,start:new Date(d.getFullYear(),d.getMonth(),d.getDate(),hh,mm)})});
});
const ofDay=d=>ALL.filter(s=>s.day===d);
const byId=id=>ALL.find(s=>s.id===id);
const isPast=s=>s.start.getTime()<Date.now()-10*60000;
const price=(s,ri)=>{const R=ROOMS[s.room];return R.base+(ri>=R.rows-R.rec?R.recAdd:0)};
function build(s){
  if(s._b)return s._b;
  const R=ROOMS[s.room],rnd=mulberry(hashStr(s.id)),wk=[0,6].includes(DAYS[s.day].getDay());
  const p=.16+rnd()*.42+(wk?.08:0)+(+s.time.slice(0,2)>=18?.1:0);
  const rows=[];
  for(let i=0;i<R.rows;i++){
    const row={label:String.fromCharCode(65+i),seats:[]};
    for(let c=0;c<R.cols;c++){
      let type=i>=R.rows-R.rec?'rec':'std';if(i===R.rows-1&&(c<2||c>=R.cols-2))type='acc';
      const dx=Math.abs(c-(R.cols-1)/2)/((R.cols-1)/2),w=(1.3-dx*.55)*(i<2?.6:1);
      row.seats.push({type,taken:type!=='acc'&&rnd()<p*w});
    }
    rows.push(row);
  }
  return s._b={rows};
}
const occ=s=>{const b=build(s);let t=0,n=0;b.rows.forEach(r=>r.seats.forEach(x=>{n++;if(x.taken)t++}));return t/n};

/* ---------- estado ---------- */
const state={day:ofDay(0).some(s=>!isPast(s))?0:1,fmt:'all',sid:null,sel:[],view:null,cart:{},hl:-1};
const cur=()=>byId(state.sid);
let toastT;
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2400)}
const scrollTo=(el,block='start')=>el&&el.scrollIntoView({behavior:reduce?'auto':'smooth',block});

/* ---------- topo ---------- */
$('#burger').addEventListener('click',()=>{const n=$('#nav'),o=n.classList.toggle('open');$('#burger').setAttribute('aria-expanded',o)});
$$('#nav a').forEach(a=>a.addEventListener('click',()=>{$('#nav').classList.remove('open');$('#burger').setAttribute('aria-expanded','false')}));

/* ---------- destaque ---------- */
let hi=0,heroTimer=0,heroVisible=true;
MOVIES.forEach((m,i)=>{
  const im=document.createElement('img');im.src=m.bdURL;im.alt='';im.decoding='async';$('#heroImgs').appendChild(im);
  const t=document.createElement('button');t.className='thumb';t.type='button';t.setAttribute('role','tab');t.setAttribute('aria-label',m.title);
  t.innerHTML=`<img src="${m.smURL}" alt="">`;t.addEventListener('click',()=>{heroSet(i);heroAuto()});$('#thumbs').appendChild(t);
});
function heroFill(m){
  $('#hKicker').textContent=m.tag;$('#hTitle').textContent=m.title;
  $('#hMeta').innerHTML=`${ageBadge(m)}${metaRest(m)}`;
  $('#hSyn').textContent=m.syn;
}
function heroSet(i,first){
  hi=(i+NM)%NM;const m=MOVIES[hi];
  $$('#heroImgs img').forEach((im,k)=>im.classList.toggle('on',k===hi));
  $$('.thumb').forEach((b,k)=>b.setAttribute('aria-selected',k===hi));
  const c=$('#heroCopy');
  if(first||reduce){heroFill(m);return}
  c.classList.add('out');setTimeout(()=>{heroFill(m);c.classList.remove('out')},320);
}
function heroAuto(){clearInterval(heroTimer);if(reduce)return;heroTimer=setInterval(()=>{if(heroVisible&&!document.hidden)heroSet(hi+1)},8000)}
new IntersectionObserver(e=>{heroVisible=e[0].isIntersecting}).observe($('#inicio'));
$('#hBuy').addEventListener('click',()=>goSessions(hi));

/* ---------- em cartaz ---------- */
$('#posters').innerHTML=MOVIES.map((m,i)=>`<article class="poster"><button class="poster-img" type="button" data-mi="${i}" aria-label="Ver horários de ${m.title}"><img src="${m.poURL}" alt="Cartaz de ${m.title}" loading="lazy" decoding="async">${ageBadge(m)}</button><h3>${m.title}</h3><div class="meta">${metaRest(m)}</div><button class="link" type="button" data-mi="${i}">Ver horários</button></article>`).join('');
$('#posters').addEventListener('click',e=>{const b=e.target.closest('[data-mi]');if(b)goSessions(+b.dataset.mi)});
const pstep=d=>{const p=$('#posters');p.scrollBy({left:d*(p.querySelector('.poster').offsetWidth+20)*2,behavior:reduce?'auto':'smooth'})};
$('#pPrev').addEventListener('click',()=>pstep(-1));$('#pNext').addEventListener('click',()=>pstep(1));

/* ---------- sessões ---------- */
function renderDays(){
  $('#days').innerHTML=DAYS.map((d,i)=>`<button class="day" type="button" data-d="${i}" aria-pressed="${i===state.day}"><small>${i===0?'hoje':WD[d.getDay()]}</small><b>${String(d.getDate()).padStart(2,'0')}</b></button>`).join('');
}
function renderFmts(){
  $('#fmts').innerHTML=[['all','Todos'],['2D','2D'],['3D','3D'],['VIP','VIP']].map(([k,l])=>`<button type="button" data-f="${k}" aria-pressed="${state.fmt===k}">${l}</button>`).join('');
}
const slotHTML=s=>{
  const o=occ(s),past=isPast(s),pct=Math.round(o*100),col=o>.85?'#c8102e':o>.6?'#d98a00':'#2e9e63',R=ROOMS[s.room];
  return `<button class="slot" type="button" data-sid="${s.id}" aria-pressed="${state.sid===s.id}" ${past?'disabled':''} style="--occ:${pct}%;--oc:${col}" aria-label="${s.time}, ${R.name}, ${fmtLabel(s.fmt)}, ${past?'encerrada':pct+'% ocupada'}"><b>${s.time}</b><small>${brl0(R.base)}${o>.85&&!past?'<em>últimos</em>':''}</small><i></i></button>`;
};
function renderSessions(){
  const list=ofDay(state.day).filter(s=>state.fmt==='all'||s.fmt.startsWith(state.fmt));
  const el=$('#mlist');
  if(!list.length){el.innerHTML='<p class="empty">Nenhuma sessão nesse formato neste dia. Escolha outro formato ou outro dia.</p>';return}
  el.innerHTML=MOVIES.map((m,mi)=>{
    const ss=list.filter(s=>s.mi===mi).sort((a,b)=>a.time.localeCompare(b.time));if(!ss.length)return '';
    const groups={};ss.forEach(s=>{(groups[s.room+'|'+s.fmt]=groups[s.room+'|'+s.fmt]||[]).push(s)});
    return `<article class="mrow${state.hl===mi?' hl':''}" id="mr-${mi}"><img src="${m.smURL}" alt="Cartaz de ${m.title}" loading="lazy"><div class="m-info"><h3>${m.title}</h3><div class="meta">${ageBadge(m)}${metaRest(m)}</div></div><div class="m-groups">${Object.values(groups).map(arr=>`<div class="grp"><div class="grp-l"><b>${fmtLabel(arr[0].fmt)}</b>${ROOMS[arr[0].room].name}</div><div class="slots">${arr.map(slotHTML).join('')}</div></div>`).join('')}</div></article>`;
  }).join('');
}
$('#days').addEventListener('click',e=>{const b=e.target.closest('.day');if(!b)return;state.day=+b.dataset.d;renderDays();renderSessions()});
$('#fmts').addEventListener('click',e=>{const b=e.target.closest('[data-f]');if(!b)return;state.fmt=b.dataset.f;renderFmts();renderSessions()});
$('#mlist').addEventListener('click',e=>{const b=e.target.closest('.slot');if(!b||b.disabled)return;selectSession(b.dataset.sid,true)});
function goSessions(mi){
  state.hl=mi;if(state.fmt!=='all'){state.fmt='all';renderFmts()}
  renderSessions();const row=$('#mr-'+mi);scrollTo(row||$('#sessoes'),'center');
  clearTimeout(goSessions.t);goSessions.t=setTimeout(()=>{state.hl=-1;const r=$('#mr-'+mi);r&&r.classList.remove('hl')},2500);
}

/* ---------- mapa de assentos ---------- */
function fit(){
  const S=cur();if(!S)return;const R=ROOMS[S.room],room=$('#room'),W=room.clientWidth-16;
  const g=W>700?5:W>480?4:3,s=Math.max(15,Math.min(36,Math.floor((W-2*30-(R.cols+1)*g)/(R.cols+1.05))));
  room.style.setProperty('--s',s+'px');room.style.setProperty('--g',g+'px');
}
function renderMap(){
  const S=cur(),R=ROOMS[S.room],B=build(S),box=$('#rows');fit();box.innerHTML='';
  B.rows.forEach((row,ri)=>{
    const rw=document.createElement('div');rw.className='rw';
    rw.innerHTML=`<b class="rl">${row.label}</b>`;
    const rs=document.createElement('div');rs.className='rs';
    row.seats.forEach((st,ci)=>{
      if(ci===R.cols/2){const a=document.createElement('span');a.className='aisle';rs.appendChild(a)}
      const dx=(ci-(R.cols-1)/2)/((R.cols-1)/2),b=document.createElement('button');
      b.type='button';b.className='seat'+(st.type!=='std'?' '+st.type:'')+(st.taken?' taken':'');
      b.dataset.r=ri;b.dataset.c=ci;
      b.style.setProperty('--w',(ri*14+Math.abs(ci-(R.cols-1)/2)*10|0)+'ms');b.style.setProperty('--dy',`calc(var(--s)*${(-(dx*dx)*.22).toFixed(3)})`);
      b.setAttribute('aria-label',`Fileira ${row.label}, assento ${ci+1}, ${st.taken?'ocupado':st.type==='rec'?'reclinável, livre':st.type==='acc'?'acessível, livre':'livre'}`);
      b.setAttribute('aria-pressed','false');if(st.taken)b.setAttribute('aria-disabled','true');
      rs.appendChild(b);
    });
    rw.appendChild(rs);rw.insertAdjacentHTML('beforeend',`<b class="rl">${row.label}</b>`);box.appendChild(rw);
  });
}
const seatBtn=(r,c)=>$(`.seat[data-r="${r}"][data-c="${c}"]`);
function defaultView(S){
  const R=ROOMS[S.room],B=build(S),r0=Math.round((R.rows-1)*.55),c0=Math.floor(R.cols/2);
  for(let d=0;d<R.rows;d++)for(const dr of [0,-1,1])for(let dc=0;dc<R.cols;dc++){
    const r=clamp(r0+dr*d,0,R.rows-1),c=clamp(c0+(dc%2?1:-1)*Math.ceil(dc/2),0,R.cols-1);
    if(!B.rows[r].seats[c].taken)return{r,c};
  }
  return{r:0,c:0};
}
const rowsEl=$('#rows');
rowsEl.addEventListener('click',e=>{const b=e.target.closest('.seat');if(b)toggleSeat(+b.dataset.r,+b.dataset.c)});
rowsEl.addEventListener('pointerover',e=>{if(e.pointerType!=='mouse')return;const b=e.target.closest('.seat');if(b)showSeat({r:+b.dataset.r,c:+b.dataset.c})});
rowsEl.addEventListener('focusin',e=>{const b=e.target.closest('.seat');if(b)showSeat({r:+b.dataset.r,c:+b.dataset.c})});
rowsEl.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')showSeat(lastSel()||state.base)});
const lastSel=()=>state.sel.length?state.sel[state.sel.length-1]:null;
function toggleSeat(r,c){
  const S=cur(),st=build(S).rows[r].seats[c],b=seatBtn(r,c);
  if(st.taken){toast('Esse assento já está ocupado');return}
  const i=state.sel.findIndex(s=>s.r===r&&s.c===c);
  if(i>=0){state.sel.splice(i,1);b.classList.remove('sel');b.setAttribute('aria-pressed','false')}
  else{if(state.sel.length>=8){toast('O máximo é 8 assentos por reserva');return}state.sel.push({r,c});b.classList.add('sel');b.setAttribute('aria-pressed','true')}
  showSeat(i>=0?(lastSel()||{r,c}):{r,c});updatePanel();updateOrder();
}
function renderHead(){
  const S=cur(),m=MOVIES[S.mi];
  $('#bkPoster').src=m.smURL;$('#bkPoster').alt=`Cartaz de ${m.title}`;$('#bkTitle').textContent=m.title;
  $('#bkMeta').textContent=`${longDate.format(DAYS[S.day])}, ${S.time}, ${ROOMS[S.room].name}, ${fmtLabel(S.fmt)}`;
}
function selectSession(id,scroll){
  state.sid=id;state.sel=[];const S=cur();
  if(S.day!==state.day){state.day=S.day;renderDays()}
  state.base=defaultView(S);state.view=state.base;
  renderSessions();renderHead();renderMap();
  pov.cam=null;showSeat(state.base,true);updatePanel();updateOrder();
  if(scroll)scrollTo($('#assentos'));
}

/* ---------- visão do telão (canvas) ---------- */
const pov={cv:$('#pov'),x:$('#pov').getContext('2d'),cam:null,raf:0};
const geo=(room,r,c)=>{const R=ROOMS[room],N=R.cols;return{x:(c-(N-1)/2)*.56+(c>=N/2?.6:-.6),z:R.z0+r*R.dz,h:1.1+r*.2}};
const rr=(x,a,b,w,h,r)=>{r=Math.max(0,Math.min(r,w/2,h/2));x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()};
function drawPOV(cam){
  const S=cur(),R=ROOMS[S.room],B=build(S),m=MOVIES[S.mi],x=pov.x,W=pov.cv.width,H=pov.cv.height,f=W*.43;
  const half=R.screenW/2,yb=1.5,yt=yb+R.screenW/2.1,ym=(yb+yt)/2;
  const th=Math.atan2(-cam.x,cam.z)*.9,sn=Math.sin(th),cs=Math.cos(th);
  const c3=(X,Y,D)=>{const rx=X-cam.x;return[rx*cs-D*sn,Y-cam.h,rx*sn+D*cs]};
  const dpc=c3(0,ym,cam.z)[2],botOff=f*(ym-yb)/dpc;
  let mid=H*.4;if(mid+botOff>H*.62)mid=H*.62-botOff;
  const cy=mid+f*(ym-cam.h)/dpc;
  const pr=(X,Y,D)=>{const [a,b,d]=c3(X,Y,D);return[W/2+f*a/d,cy-f*b/d,d]};
  const quad=(p,fill)=>{x.fillStyle=fill;x.beginPath();p.forEach((q,i)=>i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]));x.closePath();x.fill()};
  x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,W,H);
  x.fillStyle=lin(x,0,0,0,H,[[0,'#050203'],[1,'#12080b']]);x.fillRect(0,0,W,H);
  [-1,1].forEach(sg=>{
    const xa=sg*(half+.1),xb=sg*(half+1.7),p=[pr(xa,0,cam.z),pr(xb,0,cam.z),pr(xb,yt+1.4,cam.z),pr(xa,yt+1.4,cam.z)];
    const g0=Math.min(p[0][0],p[1][0]),g1=Math.max(p[0][0],p[1][0]);
    if(g1-g0<1)return;const g=x.createLinearGradient(g0,0,g1,0);for(let i=0;i<=8;i++)g.addColorStop(i/8,i%2?'#3a0b13':'#6a1222');quad(p,g);
  });
  const cn=[pr(-half,yt,cam.z),pr(half,yt,cam.z),pr(half,yb,cam.z),pr(-half,yb,cam.z)];
  x.save();x.shadowColor=m.color;x.shadowBlur=70;quad(cn,'#000');x.restore();
  const src=m.bd,sw=src.width,sh=Math.min(src.height,sw/2.1),sy0=(src.height-sh)/2,N=56;
  for(let k=0;k<N;k++){
    const u0=k/N,u1=(k+1)/N,X0=-half+u0*2*half,X1=-half+u1*2*half;
    const a=pr(X0,yt,cam.z),b=pr(X0,yb,cam.z),c=pr(X1,yt,cam.z);
    if(Math.max(a[0],c[0])<-4||Math.min(a[0],c[0])>W+4)continue;
    x.setTransform(c[0]-a[0]+.6,c[1]-a[1],0,b[1]-a[1],a[0],a[1]);
    x.drawImage(src,u0*sw,sy0,sw/N+1,sh,0,0,1,1);
  }
  x.setTransform(1,0,0,1,0,0);
  for(let j=0;j<R.rows;j++){
    const D=cam.z-geo(S.room,j,0).z;if(D<.4)continue;
    const fy=j*.2,topY=fy+1.0,botY=fy+.3,t=Math.min(1,D/14),cr=150-92*t|0,cg=26-16*t|0,cb=42-24*t|0;
    for(let c=0;c<R.cols;c++){
      const X=geo(S.room,j,c).x,L=pr(X-.27,topY,D),Rt=pr(X+.27,topY,D),Bm=pr(X,botY,D);
      if(Rt[0]<-20||L[0]>W+20)continue;
      const sy=(L[1]+Rt[1])/2,w2=Rt[0]-L[0],h2=Math.min(H*3,Bm[1]-sy);
      if(B.rows[j].seats[c].taken){const hc=pr(X,fy+1.06,D);x.fillStyle='#0a0405';x.beginPath();x.arc(hc[0],hc[1],f*.115/D,0,7);x.fill()}
      x.fillStyle=lin(x,0,sy,0,sy+h2,[[0,`rgb(${cr+40},${cg+8},${cb+10})`],[1,`rgb(${cr},${cg},${cb})`]]);
      rr(x,L[0],sy,w2,h2,w2*.3);x.fill();
    }
  }
  const sc=pr(0,ym,cam.z),rad=Math.max(Math.abs(cn[1][0]-cn[0][0]),W*.5)*.75;
  x.save();x.globalCompositeOperation='screen';const g2=x.createRadialGradient(sc[0],sc[1],0,sc[0],sc[1],rad);g2.addColorStop(0,hexA(m.color,.24));g2.addColorStop(1,hexA(m.color,0));x.fillStyle=g2;x.fillRect(0,0,W,H);x.restore();
  const ag=x.createLinearGradient(0,H*.88,0,H);ag.addColorStop(0,'#e0384f');ag.addColorStop(1,'#8e0b20');
  x.save();x.fillStyle=ag;x.shadowColor='rgba(200,16,46,.5)';x.shadowBlur=26;rr(x,-30,H*.91,W*.17,H*.2,26);x.fill();rr(x,W*.83,H*.91,W*.17+30,H*.2,26);x.fill();x.restore();
  const vg=x.createRadialGradient(W/2,H*.5,H*.35,W/2,H*.5,W*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.6)');x.fillStyle=vg;x.fillRect(0,0,W,H);
}
function povTo(g,instant){
  const to={x:g.x,z:g.z,h:g.h};cancelAnimationFrame(pov.raf);
  if(!pov.cam||instant||reduce){pov.cam=to;drawPOV(to);return}
  const from={...pov.cam},t0=performance.now(),D=650;
  const step=t=>{const k=Math.min(1,(t-t0)/D),e=1-Math.pow(1-k,3);
    pov.cam={x:from.x+(to.x-from.x)*e,z:from.z+(to.z-from.z)*e,h:from.h+(to.h-from.h)*e};drawPOV(pov.cam);if(k<1)pov.raf=requestAnimationFrame(step)};
  pov.raf=requestAnimationFrame(step);
}
function showSeat(v,instant){
  if(!v)return;state.view=v;
  const S=cur(),R=ROOMS[S.room],B=build(S),row=B.rows[v.r],st=row.seats[v.c],g=geo(S.room,v.r,v.c),half=R.screenW/2;
  const ang=(Math.atan((half-g.x)/g.z)+Math.atan((half+g.x)/g.z))*180/Math.PI,p=v.r/(R.rows-1);
  const zone=p<.28?'Bem de perto':p<.72?'Ponto ideal':'Visão completa';
  const sel=state.sel.some(s=>s.r===v.r&&s.c===v.c);
  $('#povTitle').textContent=`Fileira ${row.label}, assento ${v.c+1}`;
  $('#povMode').textContent=st.taken?'Ocupado':sel?'Seu assento':'Prévia';
  $('#povZone').textContent=[zone,st.type==='rec'?'reclinável':'',st.type==='acc'?'acessível':''].filter(Boolean).join(', ');
  $$('.seat.view').forEach(e=>e.classList.remove('view'));const vb=seatBtn(v.r,v.c);vb&&vb.classList.add('view');
  $('#stDist').textContent=fmt1(g.z)+' m';$('#stAng').textContent=Math.round(ang)+'°';
  $('#stOff').textContent=fmt1(Math.abs(g.x))+' m';$('#stOffL').textContent=Math.abs(g.x)<.3?'do centro':g.x<0?'à esquerda':'à direita';
  povTo(g,instant);updatePanel(true);
}

/* ---------- resumo, pedido e bomboniere ---------- */
const PRODS=[
 {id:'pipoca',name:'Pipoca média',desc:'Estourada na hora, com manteiga e sal na medida.',price:19.9,art:()=>`<svg viewBox="0 0 200 220">${bucketG({id:'a',b1:'#d92d3b',b2:'#fff1e4',seed:3})}</svg>`},
 {id:'casal',name:'Combo casal',desc:'Pipoca grande e dois refrigerantes de 500 ml.',price:46.9,badge:'Mais pedido',art:()=>`<svg viewBox="0 0 300 220"><g transform="translate(-6,52) scale(.66)">${cupG({id:'b1',c1:'#d92d3b',c2:'#fff1e4',straw:'#f2b659'})}</g><g transform="translate(206,52) scale(.66)">${cupG({id:'b2',c1:'#d92d3b',c2:'#fff1e4',straw:'#f2b659'})}</g><g transform="translate(50,-4) scale(1.0)">${bucketG({id:'b',b1:'#d92d3b',b2:'#fff1e4',seed:7,n:34})}</g></svg>`},
 {id:'refri',name:'Refrigerante 500 ml',desc:'Gelado, no copo do cinema.',price:9.9,art:()=>`<svg viewBox="0 0 200 220">${cupG({id:'c',c1:'#d92d3b',c2:'#fff1e4',straw:'#fff'})}</svg>`},
 {id:'nachos',name:'Nachos com cheddar',desc:'Tortilhas crocantes com molho cheddar quente.',price:18.9,art:()=>nachosSVG()},
 {id:'choco',name:'Barra de chocolate',desc:'Chocolate ao leite para dividir, ou não.',price:8.5,art:()=>chocoSVG()},
 {id:'balde',name:'Balde colecionável',desc:'Balde especial com pipoca grande, para levar para casa depois.',price:59.9,badge:'Edição limitada',art:()=>`<svg viewBox="0 0 200 220">${bucketG({id:'d',b1:'#3a1a7a',b2:'#6b3fd0',seed:11,n:30,lab:'#f2b659',txt:'CINEMAX',tc:'#2a1500',fs:13})}<ellipse cx="100" cy="176" rx="64" ry="11" fill="none" stroke="#f2b659" stroke-width="4" transform="rotate(-10 100 176)"/><g fill="#fff3df"><circle cx="62" cy="118" r="1.8"/><circle cx="138" cy="190" r="1.8"/><circle cx="130" cy="124" r="1.4"/><circle cx="74" cy="196" r="1.4"/></g></svg>`}
];
function popcorn(n,seed){
  const r=mulberry(seed),pts=[],cols=['#fff6dc','#ffeaa8','#ffdc7c','#fff0c2'];
  for(let i=0;i<n;i++){const a=Math.PI*r(),d=Math.sqrt(r());pts.push([100+Math.cos(a)*d*54,94-Math.sin(a)*d*44,7+r()*5,r()])}
  pts.sort((a,b)=>a[1]-b[1]);
  return pts.map(([px,py,s,k])=>`<g fill="${cols[k*4|0]}" stroke="#e0b25a" stroke-width=".8" stroke-opacity=".55"><circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${s.toFixed(1)}"/><circle cx="${(px+s*.55).toFixed(1)}" cy="${(py-s*.25).toFixed(1)}" r="${(s*.62).toFixed(1)}"/><circle cx="${(px-s*.5).toFixed(1)}" cy="${(py-s*.2).toFixed(1)}" r="${(s*.58).toFixed(1)}"/></g>`).join('');
}
function bucketG(o){
  const id='bk'+o.id;
  return `<defs><clipPath id="${id}"><path d="M44 98H156L142 206Q141 212 134 212H66Q59 212 58 206Z"/></clipPath></defs>${popcorn(o.n||26,o.seed||3)}<g clip-path="url(#${id})">${[...Array(9)].map((_,i)=>`<rect x="${30+i*16.5}" y="96" width="16.5" height="120" fill="${i%2?o.b2:o.b1}"/>`).join('')}<rect x="124" y="96" width="40" height="120" fill="#000" opacity=".14"/></g><rect x="40" y="92" width="120" height="12" rx="6" fill="${o.b1}"/><rect x="66" y="132" width="68" height="38" rx="7" fill="${o.lab||'#fff'}"/><text x="100" y="157" text-anchor="middle" font-family="Big Shoulders Display,Impact,sans-serif" font-weight="900" font-size="${o.fs||15}" fill="${o.tc||o.b1}" letter-spacing="1">${o.txt||'CINEMAX'}</text>`;
}
function cupG(o){
  const id='cp'+o.id;
  return `<defs><clipPath id="${id}"><path d="M66 78H134L124 206Q123 212 117 212H83Q77 212 76 206Z"/></clipPath></defs><path d="M104 64L120 14" stroke="${o.straw}" stroke-width="7" stroke-linecap="round"/><g clip-path="url(#${id})"><rect x="60" y="70" width="80" height="150" fill="${o.c1}"/><rect x="60" y="120" width="80" height="48" fill="${o.c2}"/><rect x="118" y="70" width="22" height="150" fill="#000" opacity=".15"/></g><rect x="60" y="62" width="80" height="14" rx="7" fill="#f3ece6"/><path d="M70 62Q100 42 130 62Z" fill="#f3ece6"/><text x="100" y="152" text-anchor="middle" font-family="Big Shoulders Display,Impact,sans-serif" font-weight="900" font-size="15" fill="${o.c1}" letter-spacing=".5">CINEMAX</text>`;
}
function nachosSVG(){
  const ch=[[64,104,-24],[98,92,8],[134,104,26],[80,74,-38],[120,70,32],[100,54,4],[56,88,-54],[146,86,50]];
  return `<svg viewBox="0 0 200 220">${ch.map(([a,b,d])=>`<g transform="translate(${a},${b+16}) rotate(${d})"><polygon points="0,-30 26,18 -26,18" fill="#f3b24a" stroke="#c98524" stroke-width="2"/><polygon points="0,-18 12,8 -12,8" fill="#ffd27a" opacity=".6"/></g>`).join('')}<path d="M46 118Q66 98 86 114T124 108T156 116L152 132H50Z" fill="#ffae1a"/><path d="M70 126v18a6 6 0 0012 0v-14zM118 126v26a6 6 0 0012 0v-22z" fill="#ffae1a"/><path d="M30 126H170L152 200Q150 208 142 208H58Q50 208 48 200Z" fill="#c93a2f"/><path d="M30 126H170L166 148H34Z" fill="#fff1e4"/><text x="100" y="143" text-anchor="middle" font-family="Big Shoulders Display,Impact,sans-serif" font-weight="900" font-size="17" fill="#c93a2f" letter-spacing="2">NACHOS</text></svg>`;
}
function chocoSVG(){
  const sq=[];for(let i=0;i<4;i++)for(let j=0;j<4;j++)sq.push(`<rect x="${48+i*26}" y="${52+j*20}" width="23" height="17" rx="4" fill="${(i+j)%2?'#6b3320':'#7a3c26'}"/>`);
  return `<svg viewBox="0 0 200 220"><g transform="rotate(-12 100 120)"><rect x="40" y="44" width="116" height="136" rx="12" fill="#4a2417"/>${sq.join('')}<rect x="36" y="112" width="124" height="74" rx="10" fill="#d92d3b"/><path d="M36 134H160V146H36Z" fill="#f2b659"/><text x="98" y="128" text-anchor="middle" font-family="Big Shoulders Display,Impact,sans-serif" font-weight="900" font-size="18" fill="#fff6e8" letter-spacing="2">CINEMAX</text><text x="98" y="172" text-anchor="middle" font-family="Big Shoulders Display,Impact,sans-serif" font-weight="800" font-size="22" fill="#fff6e8" letter-spacing="2">AO LEITE</text><path d="M120 112l36-28v28z" fill="#f2b659" opacity=".9"/></g></svg>`;
}
const cartCount=()=>Object.values(state.cart).reduce((a,b)=>a+b,0);
const cartTotal=()=>PRODS.reduce((a,p)=>a+(state.cart[p.id]||0)*p.price,0);
const seatsTotal=()=>{const S=cur();return state.sel.reduce((a,s)=>a+price(S,s.r),0)};
const total=()=>seatsTotal()+cartTotal();
const ctl=p=>{const q=state.cart[p.id]||0;return q?`<div class="qty"><button type="button" data-dec="${p.id}" aria-label="Diminuir ${p.name}">−</button><b>${q}</b><button type="button" data-inc="${p.id}" aria-label="Aumentar ${p.name}">+</button></div>`:`<button class="btn btn-line add" type="button" data-inc="${p.id}">Adicionar</button>`};
function renderProds(){
  $('#prods').innerHTML=PRODS.map(p=>`<article class="prod" data-p="${p.id}"><div class="prod-art">${p.badge?`<span class="badge">${p.badge}</span>`:''}${p.art()}</div><div class="p-top"><h3>${p.name}</h3><span class="price">${brl(p.price)}</span></div><p>${p.desc}</p><div class="ctl">${ctl(p)}</div></article>`).join('');
}
$('#prods').addEventListener('click',e=>{
  const b=e.target.closest('[data-inc],[data-dec]');if(!b)return;
  const id=b.dataset.inc||b.dataset.dec,d=b.dataset.inc?1:-1;
  state.cart[id]=clamp((state.cart[id]||0)+d,0,12);if(!state.cart[id])delete state.cart[id];
  const p=PRODS.find(x=>x.id===id),box=b.closest('.prod').querySelector('.ctl');box.innerHTML=ctl(p);
  const nb=box.querySelector(d>0?'[data-inc]':'[data-dec],[data-inc]');nb&&nb.focus();
  updatePanel();updateOrder();
});
function updatePanel(){
  const S=cur();if(!S)return;const n=state.sel.length,k=cartCount();
  $('#picked').innerHTML=n?state.sel.map((s,i)=>`<span class="pk">${build(S).rows[s.r].label}${s.c+1}<button type="button" data-rm="${i}" aria-label="Remover assento">×</button></span>`).join(''):'Nenhum assento escolhido ainda.';
  const v=state.view||state.base,vp=price(S,v.r);
  $('#sum').innerHTML=(n?`<div><span>Assentos (${n})</span><span>${brl(seatsTotal())}</span></div>`:`<div><span>Valor deste assento</span><span>${brl(vp)}</span></div>`)+(k?`<div><span>Bomboniere (${k} ${k>1?'itens':'item'})</span><span>${brl(cartTotal())}</span></div>`:'')+(n?`<div class="tot"><span>Total</span><span>${brl(total())}</span></div>`:'');
  const b=$('#btnBook');b.disabled=!n;b.textContent=n?`Reservar ${n} ${n>1?'assentos':'assento'}`:'Escolha um assento';
}
$('#picked').addEventListener('click',e=>{
  const b=e.target.closest('[data-rm]');if(!b)return;const s=state.sel.splice(+b.dataset.rm,1)[0];
  const el=seatBtn(s.r,s.c);el&&(el.classList.remove('sel'),el.setAttribute('aria-pressed','false'));
  showSeat(lastSel()||state.base);updatePanel();updateOrder();
});
function updateOrder(){
  const n=state.sel.length,k=cartCount(),el=$('#order');
  if(!n&&!k){el.hidden=true;return}
  el.hidden=false;
  $('#orderS').textContent=[n?`${n} ${n>1?'assentos':'assento'}`:'',k?`${k} ${k>1?'itens':'item'}`:''].filter(Boolean).join(' + ');
  $('#orderT').textContent=brl(total());$('#orderBtn').textContent=n?'Finalizar':'Escolher assento';
}
$('#orderBtn').addEventListener('click',()=>{if(state.sel.length)finalize();else{toast('Escolha ao menos um assento para finalizar');scrollTo($('#assentos'))}});
$('#btnBook').addEventListener('click',finalize);

/* ---------- ingresso ---------- */
function barcode(seed){
  const r=mulberry(hashStr(seed));let px=0,s='';
  while(px<300){const w=1+Math.floor(r()*3),g=1+Math.floor(r()*2);s+=`<rect x="${px}" y="0" width="${w}" height="56" fill="#fff"/>`;px+=w+g}
  return `<svg viewBox="0 0 ${px} 56" preserveAspectRatio="none" aria-hidden="true">${s}</svg>`;
}
function finalize(){
  const S=cur(),B=build(S),n=state.sel.length;if(!n){toast('Escolha ao menos um assento');return}
  const seats=[...state.sel].sort((a,b)=>a.r-b.r||a.c-b.c),labels=seats.map(s=>B.rows[s.r].label+(s.c+1));
  const code='CMX'+hashStr(S.id+labels.join()+Date.now()).toString(36).toUpperCase().slice(0,6);
  const tot=total(),items=cartCount(),m=MOVIES[S.mi];
  const rowsU=[...new Set(seats.map(s=>B.rows[s.r].label))];
  const cols=rowsU.length===1?[['Sala',String(S.room).padStart(2,'0')],['Fileira',rowsU[0]],['Assentos',seats.map(s=>s.c+1).join(', ')]]:[['Sala',String(S.room).padStart(2,'0')],['Formato',S.fmt.split(' ')[0]],['Assentos',labels.join(' ')]];
  seats.forEach(s=>{B.rows[s.r].seats[s.c].taken=true});
  state.sel=[];state.cart={};state.base=defaultView(S);state.view=state.base;
  renderMap();renderProds();renderSessions();showSeat(state.base,true);updatePanel();updateOrder();
  const d=DAYS[S.day];
  $('#ticket').innerHTML=`<div class="tk-note">Ingresso para ${n} ${n>1?'pessoas':'pessoa'}</div><div class="tk-poster"><img src="${m.poURL}" alt=""><b>${m.title}</b></div><div class="tk-row"><span>${d.getDate()} ${MO[d.getMonth()]}</span><span>${S.time}</span><span>${brl(tot)}</span></div><div class="tk-cols">${cols.map(([a,b])=>`<div><small>${a.toUpperCase()}</small><b>${b}</b></div>`).join('')}</div>${items?`<div class="tk-extra">Bomboniere: ${items} ${items>1?'itens':'item'} para retirar na sessão</div>`:''}<div class="tk-stub">${barcode(code)}<small>${code}</small></div>`;
  openModal();
}
let modalFocus=null;
function openModal(){modalFocus=document.activeElement;setTimeout(confetti,reduce?0:1900);$('#modal').hidden=false;document.documentElement.style.overflow='hidden';setTimeout(()=>$('#mClose').focus({preventScroll:true}),50)}
function closeModal(){$('#modal').hidden=true;document.documentElement.style.overflow='';modalFocus&&modalFocus.focus&&modalFocus.focus({preventScroll:true})}
$('#mClose').addEventListener('click',closeModal);$('#modalBg').addEventListener('click',closeModal);
addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#modal').hidden)closeModal()});

function confetti(){
  if(reduce||$('#modal').hidden)return;
  const c=document.createElement('canvas');c.className='confetti';c.width=innerWidth;c.height=innerHeight;document.body.appendChild(c);
  const x=c.getContext('2d'),cols=['#c8102e','#e0a800','#2e9e63','#1f7ae0','#ffffff'];
  const P=Array.from({length:90},()=>({x:innerWidth/2+(Math.random()-.5)*200,y:innerHeight*.18,vx:(Math.random()-.5)*10,vy:-Math.random()*8-3,s:4+Math.random()*5,r:Math.random()*6,vr:(Math.random()-.5)*.3,c:cols[Math.random()*cols.length|0]}));
  const t0=performance.now();
  (function f(t){x.clearRect(0,0,c.width,c.height);
    for(const p of P){p.vy+=.3;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);x.restore()}
    if(t-t0<2200)requestAnimationFrame(f);else c.remove(); // para e remove o canvas
  })(t0);
}

/* ---------- sobre nós ---------- */
(()=>{
  const seats=Object.values(ROOMS).reduce((a,r)=>a+r.rows*r.cols,0),acc=Object.values(ROOMS).length*4;
  $('#facts').innerHTML=[[Object.keys(ROOMS).length,'salas'],[seats,'poltronas'],[acc,'lugares para cadeirantes'],[SCHED.length,'sessões por dia']].map(([n,l])=>`<div class="fact"><b>${n}</b><span>${l}</span></div>`).join('');
  $('#rooms').innerHTML=Object.values(ROOMS).map(R=>{
    const rows=[];for(let i=0;i<R.rows;i++){let s='';for(let c=0;c<R.cols;c++){if(c===R.cols/2)s+='<i class="g"></i>';const cls=i===R.rows-1&&(c<2||c>=R.cols-2)?'a':i>=R.rows-R.rec?'r':'';s+=`<i class="${cls}"></i>`}rows.push(`<div>${s}</div>`)}
    return `<article class="card room-c"><h3>${R.name}</h3><div class="mini" aria-hidden="true"><span class="scr"></span>${rows.join('')}</div><p>${R.desc}</p><small>${R.rows*R.cols} lugares, 4 acessíveis${R.rec?(R.rec===R.rows?', todos reclináveis':`, ${R.rec} fileiras reclináveis`):''}</small></article>`;
  }).join('');
})();
function reveal(){
  if(reduce||!('IntersectionObserver'in window))return;
  document.documentElement.classList.add('js-rv');
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -8% 0px'});
  $$('.sec-h,.poster,.prod,.room-c,.fact,.about-grid,.booking,.bk-head').forEach((el,i)=>{el.classList.add('rv');el.style.setProperty('--rd',(i%4)*70+'ms');io.observe(el)});
  const fx=$('#facts');
  const io2=new IntersectionObserver(es=>{if(!es[0].isIntersecting)return;io2.disconnect();
    $$('.fact b',fx).forEach(b=>{const n=+b.textContent,t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/1100);b.textContent=Math.round(n*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(f)})(t0)})},{threshold:.5});
  io2.observe(fx);
}
/* destaca no menu a seção visível */
(()=>{const links=$$('#nav a'),map={};links.forEach(a=>map[a.getAttribute('href').slice(1)]=a);
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){links.forEach(a=>a.classList.remove('on'));const a=map[e.target.id==='assentos'?'sessoes':e.target.id];a&&a.classList.add('on')}}),{rootMargin:'-45% 0px -50% 0px'});
  ['cartaz','sessoes','assentos','bomboniere','sobre','contato'].forEach(id=>{const el=document.getElementById(id);el&&io.observe(el)})})();
let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{if(state.sid)fit()},150)},{passive:true});

/* ---------- início ---------- */
renderDays();renderFmts();renderProds();
const first=ofDay(state.day).filter(s=>!isPast(s)).sort((a,b)=>a.time.localeCompare(b.time));
const pick=first.find(s=>s.mi===0&&s.time==='19:30')||first[0]||ofDay(state.day)[0];
selectSession(pick.id,false);
heroSet(0,true);heroAuto();reveal();
(()=>{const nx=ALL.filter(s=>!isPast(s)).sort((a,b)=>a.start-b.start)[0],el=$('#nextSess');if(!nx){el.textContent='Programação da semana disponível';return}
  const d=nx.day===0?'hoje':nx.day===1?'amanhã':WD[DAYS[nx.day].getDay()];
  el.innerHTML=`Próxima sessão ${d} às <b>${nx.time}</b>: ${MOVIES[nx.mi].title}, ${ROOMS[nx.room].name}`;
  el.addEventListener('click',()=>selectSession(nx.id,true))})();

/* service worker: guarda página, CSS, JS e fontes para as próximas visitas */
if('serviceWorker'in navigator&&location.protocol.startsWith('http')){const reg=()=>navigator.serviceWorker.register('sw.js').catch(()=>{});document.readyState==='complete'?reg():addEventListener('load',reg)}
})();

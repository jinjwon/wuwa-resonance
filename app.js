import {HEROES,TRAITS,TRAIT_ICON,ELEMENT_ICON,ECHOS,AUGMENTS,STARTERS,fresh,chooseStarter,restore,capacity,levelCost,MAX_CAPACITY,traits,active,buy,move,equip,unequip,sell,roll,enemies,makeBattle,step,burst,settle,advance,syncUid} from './engine.js';
import {CombatEffects} from './effects.js';
const $=q=>document.querySelector(q),SAVE='wuwa-resonance-front-v1',NET='wuwa-resonance-net-v1',NICK='wuwa-resonance-nick';
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
let mode='solo',s=fresh(),enemy=[],battle=null,selected=null,speed=1,timer=null,view=new Map(),liveStats=[],energyView=0,burstRequested=false,chainView=0,runToken=0,modalKind=null;
let net=null;// multiplayer session: {code,token,id,es,room,me,offset,battle,playingSeq,watchedSeq,prepKey,outShown,overShown}
const messages=[],ART=new Map();
const LOCKED_MODALS=new Set(['menu','net','lobby','starter','solo-flow','over','waiting']);

// ── portraits: AI atlas for the original 16, element emblem cards for the expansion,
//    and any file dropped into assets/heroes/<key>.png overrides both.
function portrait(id,cls=''){
 const h=HEROES[id];
 if(ART.has(h.key))return `<div class="portrait portrait-file ${cls}" style="--art:url('assets/heroes/${ART.get(h.key)}');--hero:${h.color}"></div>`;
 if(id>=16)return `<div class="portrait portrait-emblem ${cls}" style="--hero:${h.color}" data-glyph="${ELEMENT_ICON[h.origin]}"><span class="emblem-name">${h.name[0]}</span><span class="emblem-tag">${h.origin}</span></div>`;
 if(id>=12)return `<div class="portrait portrait-new ${cls}" style="--x:${(id-12)%2*100}%;--y:${Math.floor((id-12)/2)*100}%;--hero:${h.color}"></div>`;
 return `<div class="portrait ${cls}" style="--x:${id%4*100/3}%;--y:${Math.floor(id/4)*50}%;--hero:${h.color}"></div>`;
}
const fx=new CombatEffects(portrait);
const multi=()=>mode==='multi';
const room=()=>net?.room;
const mePublic=()=>room()?.players.find(p=>p.id===net.id);
const isHost=()=>room()?.hostId===net?.id;

function save(){if(multi())return;try{if(s.phase==='prep')localStorage.setItem(SAVE,JSON.stringify(s));}catch{}}
function clearSave(){try{localStorage.removeItem(SAVE);}catch{}}
function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),2300);}
function log(msg){messages.unshift(msg);messages.splice(20);$('#log').innerHTML=messages.map(m=>`<p>${esc(m)}</p>`).join('');}
function modal(html,kind=null){modalKind=kind;$('#modalContent').innerHTML=html;if(!$('#modal').open)$('#modal').showModal();}
function closeModal(){modalKind=null;if($('#modal').open)$('#modal').close();}
function chosen(){return selected?s[selected.area]?.[selected.i]:null;}
function tile(u,area,i){
 if(!u)return `<button class="tile empty" data-area="${area}" data-i="${i}" aria-label="${area==='board'?'전장':area==='bench'?'대기석':'적 전장'} 빈 칸 ${i+1}"><span>＋</span></button>`;
 const h=HEROES[u.id],f=battle?.fighters.find(f=>f.uid===u.uid),v=view.get(u.uid)||f;
 const label=area==='enemy'&&!multi()?`잔상 ${h.name}`:h.name;
 return `<button class="tile ${area==='enemy'?(multi()?'rival':'phantom'):''} ${chosen()?.uid===u.uid?'selected':''} ${v?.hp<=0?'dead':''}" data-area="${area}" data-i="${i}" data-uid="${u.uid}" style="--hero:${h.color}" aria-label="${label} ${u.star}성">${portrait(u.id)}<span class="stars">${'★'.repeat(u.star)}</span><span class="unit-name">${label}</span>${u.echo?`<span class="echo-badge" title="${ECHOS.find(e=>e.id===u.echo)?.name}">◇</span>`:''}${f?`<div class="health"><i style="width:${Math.max(0,(v.hp??f.max)/f.max*100)}%"></i></div><div class="mana"><i style="width:${(v.mana||0)/f.threshold*100}%"></i></div>${v.shield>0?`<span class="shield">◇${Math.round(v.shield)}</span>`:''}${u.id===0&&v.charge?`<span class="charge">승천 ${v.charge}</span>`:''}`:''}</button>`;
}
function renderBattle(){
 $('#board').innerHTML=s.board.map((u,i)=>tile(u,'board',i)).join('');$('#enemy').innerHTML=enemy.map((u,i)=>tile(u,'enemy',i)).join('');
 $('#liveDamage').textContent=Math.round(liveStats.reduce((n,f)=>n+f.damage,0)).toLocaleString();$('#liveCombo').textContent=chainView;
 const total=Math.max(1,...liveStats.map(f=>f.damage));$('#damageLive').innerHTML=liveStats.slice().sort((a,b)=>b.damage-a.damage).map(f=>`<div class="live-damage-row">${portrait(f.id)}<div>${HEROES[f.id].name}<b>${Math.round(f.damage)}</b><i style="width:${f.damage/total*100}%"></i></div></div>`).join('');
 $('#energyText').textContent=`${Math.floor(energyView)} / 100`;$('#energyFill').style.width=`${energyView}%`;
 const canBurst=!multi()&&s.phase==='battle'&&energyView>=100&&!burstRequested&&!battle?.ended;
 $('#resonance').disabled=!canBurst;$('#resonance').classList.toggle('ready',canBurst);
}
function render(){
 document.body.classList.toggle('multi',multi());
 const r=room(),me=mePublic();
 $('#round').textContent=multi()?`R${String(r?.round||0).padStart(2,'0')}`:`${String(s.round).padStart(2,'0')} / 09`;
 $('#life').textContent=`♥ ${s.life}`;$('#gold').textContent=`◈ ${s.gold}`;
 $('#phase').textContent=({prep:'● FORMATION',battle:'● COMBAT',result:'● RESULT',reward:'● REWARD',starter:'● EXPEDITION',out:'● SPECTATING',lobby:'● LOBBY'})[s.phase]||'● LOBBY';
 if(multi()){
  const opp=net.battle&&r?.phase==='battle'?net.battle.opponent.name+(net.battle.ghost?' (잔상)':''):null;
  $('#enemyTitle').textContent=opp?`VS ${opp}`:r?.phase==='prep'?`${r.round}라운드 · 상대는 전투 시작 때 공개`:r?.phase==='over'?'대전 종료':'공명 로비';
  $('.arena').classList.toggle('boss-stage',false);
 }else{
  $('#enemyTitle').textContent=s.round%3===0?`재해급 잔상 · ${s.round===9?'무음의 심연':s.round===6?'파열의 군주':'잔향의 수호자'}`:`${s.round}구역 · ${s.elite?'정예 잔상':'잔상 모사체'}`;
  $('.arena').classList.toggle('boss-stage',s.round%3===0||s.elite);
 }
 $('.arena').classList.toggle('battle-active',s.phase==='battle');
 if(multi()){
  const humans=r?.players.filter(p=>p.alive&&!p.bot&&p.connected)||[],readyN=humans.filter(p=>p.ready).length;
  $('#fight').disabled=r?.phase!=='prep'||!me?.alive;
  $('#fight').classList.toggle('is-ready',!!me?.ready&&r?.phase==='prep');
  $('#fight').textContent=!me?.alive?'탈락 · 관전 중':r?.phase==='battle'?'전투 진행 중':me?.ready?`준비 완료 ✓ ${readyN}/${humans.length}`:`준비 완료 ${readyN}/${humans.length}`;
  $('#restart').textContent='나가기';$('#restart').disabled=false;$('#help').disabled=false;
 }else{
  $('#fight').classList.remove('is-ready');
  $('#fight').disabled=s.phase!=='prep'||!s.board.some(Boolean);$('#fight').textContent=s.phase==='battle'?'전투 진행 중':'전투 개시 ⚔';$('#restart').textContent='새 원정';$('#restart').disabled=s.phase==='battle';$('#help').disabled=s.phase==='battle';
 }
 $('#capacity').textContent=`출전 ${s.board.filter(Boolean).length} / ${capacity(s)}`;$('#benchCount').textContent=`${s.bench.filter(Boolean).length} / 8`;$('#bench').innerHTML=s.bench.map((u,i)=>tile(u,'bench',i)).join('');
 $('#refresh').disabled=s.phase!=='prep'||s.gold<2;$('#lock').disabled=s.phase!=='prep';$('#lock').classList.toggle('locked',s.locked);$('#lock').textContent=s.locked?'▣ 잠금 유지':'♧ 상점 잠금';
 const cost=levelCost(s);$('#levelUp').innerHTML=capacity(s)>=MAX_CAPACITY?'출전 최대':`출전 +1 <b>${cost} G</b>`;$('#levelUp').disabled=s.phase!=='prep'||s.gold<cost||capacity(s)>=MAX_CAPACITY;
 $('#shop').innerHTML=s.shop.map((id,i)=>{if(id===null||id===undefined)return '<div class="shop-card sold">모집 완료<span>✓</span></div>';const h=HEROES[id];const copies=[...s.board,...s.bench].filter(u=>u?.id===id&&u.star===1).length;return `<button class="shop-card ${copies===2?'merge-ready':''}" data-buy="${i}" style="--hero:${h.color}" ${s.phase!=='prep'||s.gold<h.cost?'disabled':''}>${portrait(id)}<span class="cost">${h.cost} G</span>${copies?`<span class="owned">${copies===2?'승급 가능':`보유 ${copies}/3`}</span>`:''}<div class="card-copy"><small>${h.origin} · ${h.role}</small><strong>${h.name}</strong><span>${h.skill}<b>＋ 모집</b></span></div></button>`;}).join('');
 const ts=traits(s.board);$('#traits').innerHTML=Object.entries(TRAITS).sort((a,b)=>(ts[b[0]]||0)-(ts[a[0]]||0)).map(([t,d])=>`<div class="trait ${active(ts,t)?'active':''}"><span class="trait-icon">${TRAIT_ICON[t]}</span><div><b>${t}</b><small>${d}</small></div><span class="trait-count">${ts[t]||0}/2</span></div>`).join('');
 if(multi())renderPlayers();
 else $('#route').innerHTML=Array.from({length:9},(_,i)=>`<span class="route-node ${i+1===s.round?'current':i+1<s.round?'complete':''}"><span>${(i+1)%3===0?'♜':i+1}</span></span>`).join('');
 $('#augments').innerHTML=s.augments.length?s.augments.map(id=>{const a=AUGMENTS.find(x=>x.id===id);return `<div class="augment-small"><b>${a.icon} ${a.name}</b><small>${a.desc}</small></div>`;}).join(''):`<p class="muted">${multi()?'2·5·8… 라운드 시작 때<br>덱을 바꾸는 공명 변주 선택.':'3 · 6구역 돌파 후<br>덱을 바꾸는 공명 변주 선택.'}</p>`;
 $('#encounterInfo').innerHTML=multi()?feedHtml():`<div class="encounter-tag"><b>${s.round%3===0?'♜ 재해급 보스':s.elite?'⚔ 정예 도전':'◇ 일반 탐사'}</b><small>${s.elite?'적 체력 +25% · 공격 +16%<br>승리 보상 +4코인':'3구역마다 재해급 잔상 등장'}<br>매 전투 후 에코 1개 선택</small></div>`;
 const u=chosen();$('#echoInventory').innerHTML=s.inventory.length?s.inventory.map((id,i)=>{const e=ECHOS.find(e=>e.id===id);return `<button data-equip="${i}" title="${e.desc}" ${!u||s.phase!=='prep'?'disabled':''}>${e.icon} ${e.name}</button>`;}).join(''):'<span class="muted">장착 중인 에코는 캐릭터 정보에서 회수할 수 있어요.</span>';
 const pending=multi()?s.pending?.length||0:0;$('#pendingBtn').hidden=!pending||s.phase!=='prep';$('#pendingBtn').textContent=`보상 선택 ${pending}`;
 $('#resonance span').textContent=multi()?'자동 협주':'협주 총공격';
 renderBattle();detail();tickTimer();save();
}
function renderPlayers(){
 const list=(room()?.players||[]).slice().sort((a,b)=>(b.alive-a.alive)||(a.alive?b.life-a.life:a.place-b.place));
 $('#route').innerHTML=`<div class="player-strip" role="list">${list.map(p=>`<button role="listitem" class="pchip ${p.id===net.id?'me':''} ${p.alive?'':'out'} ${p.connected||p.bot?'':'offline'}" data-scout="${p.id}" title="${esc(p.name)} 덱 보기"><span class="pchip-top"><b>${esc(p.name)}</b>${p.bot?'<em>BOT</em>':''}${p.ready&&p.alive&&room().phase==='prep'?'<em class="ok">✓</em>':''}</span><span class="pl-life"><i style="width:${Math.max(0,p.life)}%"></i></span><small>${p.alive?`♥ ${p.life}${p.streak>=2?` · ${p.streak}연승`:p.streak<=-2?` · ${-p.streak}연패`:''}`:`${p.place}위 탈락`}</small></button>`).join('')}</div>`;
}
function feedHtml(){
 const feed=room()?.feed||[];
 return `<div class="encounter-tag"><b>⚔ 대전 기록</b>${feed.length?feed.slice(0,8).map(f=>f.out?`<small class="feed-out">R${f.round} · ${f.out.map(esc).join(', ')} 탈락</small>`:`<small>R${f.round} · ${esc(f.a)} vs ${esc(f.o)} → ${f.winner?`<b>${esc(f.winner)}</b> 승${f.dmg?` (−${f.dmg})`:''}`:'무승부'}</small>`).join(''):'<small>첫 전투 후 결과가 표시됩니다.<br>패배 시 체력 감소 = 2 + 라운드 보정 + 남은 상대 ★</small>'}</div>`;
}
function detail(){const u=chosen();$('#sell').disabled=!u||s.phase!=='prep';$('#unequip').disabled=!u?.echo||s.phase!=='prep';if(!u){$('#detail').innerHTML=`<p class="muted">캐릭터를 선택하면 스킬·에코를 확인합니다.<br>${multi()?'협주 100이 되면 <b>자동으로 총공격</b>합니다.':'협주가 100이면 <b>총공격</b>을 직접 발동하세요.'}</p>`;$('#sell').textContent='선택 캐릭터 판매';return;}const h=HEROES[u.id],e=ECHOS.find(e=>e.id===u.echo);$('#detail').innerHTML=`<div class="detail-hero">${portrait(u.id)}<div><b>${h.name} ${'★'.repeat(u.star)}</b><small>${h.origin} · ${h.role}</small></div></div><b class="skill-name">${h.skill}</b><p>${h.desc}</p>${e?`<div class="equipped"><b>${e.icon} ${e.name}</b><small>${e.desc}</small></div>`:'<p class="muted">에코 미장착</p>'}`;$('#sell').textContent=`판매 · ${h.cost*3**(u.star-1)} G`;}
function starterCards(){return STARTERS.map(k=>`<button data-starter="${k.id}">${portrait(k.lead)}<div><small>${k.tag}</small><h3>${k.title}</h3><p>${k.desc}</p><b>이 팀으로 출발 ↗</b></div></button>`).join('');}
function startScreen(){modal(`<div class="eyebrow">WUTHERING WAVES · FAN STRATEGY</div><h2>어떤 공명으로 시작할까요?</h2><p>첫 3명과 주력 에코를 지급합니다. 같은 공명자 3명을 모으면 승급합니다.</p><div class="starter-grid">${starterCards()}</div><p class="starter-note">9구역 원정 · 협주 총공격 · 에코 장착 · 준비 단계 자동 저장</p>`,'solo-flow');}

// ── mode menu ───────────────────────────────────────────────────────
function menu(){modal(`<div class="eyebrow">WUTHERING WAVES · FAN STRATEGY</div><h2>어떤 전장으로 갈까요?</h2><p>24명의 공명자 · 6속성 × 4역할 유대. 혼자 9구역 원정을 떠나거나, 친구·봇과 최후의 1인을 가립니다.</p><div class="mode-grid"><button data-mode="solo"><span class="mode-icon">◇</span><small>SOLO EXPEDITION</small><h3>혼자 원정</h3><p>9구역 로그라이크 · 재해급 보스 3회<br>협주 총공격을 직접 발동</p><b>${hasSoloSave()?'저장된 원정 이어하기 ↗':'원정 시작 ↗'}</b></button><button data-mode="multi" class="mode-multi"><span class="mode-icon">⚔</span><small>RESONANCE ARENA · 2–8인</small><h3>함께 대전</h3><p>방 코드로 모여 매 라운드 다른 플레이어 덱과 자동 전투<br>공용 모집 풀 · 마지막까지 살아남으면 승리</p><b>로비 열기 ↗</b></button></div>`,'menu');}
function hasSoloSave(){try{return !!restore(localStorage.getItem(SAVE));}catch{return false;}}
async function netScreen(){
 let nick='';try{nick=localStorage.getItem(NICK)||'';}catch{}
 modal(`<div class="eyebrow">RESONANCE ARENA</div><h2>공명 로비</h2><label class="field"><span>플레이어 이름</span><input id="nick" maxlength="12" autocomplete="nickname" placeholder="예: 진원" value="${esc(nick)}"></label><div class="net-actions"><button class="primary" data-net="create">방 만들기</button></div><div class="or"><span>또는 방 코드로 참가</span></div><div class="join-row"><input id="joinCode" maxlength="4" placeholder="ABCD" autocapitalize="characters" aria-label="방 코드"><button data-net="join">참가</button></div><p class="lan-note" id="lanNote">같은 와이파이의 친구는 이 컴퓨터 주소로 접속합니다…</p><div class="modal-actions"><button data-net="back">← 뒤로</button></div>`,'net');
 setTimeout(()=>$('#nick')?.focus(),30);
 try{const info=await fetch('/api/info').then(r=>r.json());const el=$('#lanNote');if(el)el.innerHTML=info.lan.length?`친구 접속 주소: ${info.lan.map(u=>`<code>${esc(u)}</code>`).join(' ')}<br><small>같은 와이파이에 연결돼 있어야 합니다. 처음 실행 시 macOS 방화벽 허용 창이 뜨면 허용하세요.</small>`:'이 컴퓨터가 네트워크에 연결돼 있지 않아 같은 기기에서만 접속할 수 있어요.';}catch{}
}
function nickValue(){const n=($('#nick')?.value||'').trim();if(!n){toast('이름을 입력해 주세요.');$('#nick')?.focus();return null;}try{localStorage.setItem(NICK,n);}catch{}return n;}
async function post(url,body){try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return await r.json();}catch{return {error:'게임 서버에 연결할 수 없어요. npm start로 실행했는지 확인하세요.'};}}
async function send(type,payload={}){if(!net)return {error:'offline'};const r=await post('/api/act',{code:net.code,token:net.token,type,...payload});if(r.error)toast(r.error);return r;}

// ── multiplayer session ─────────────────────────────────────────────
function connect(code,token,id){
 stopPlayback();clearTimeout(timer);
 net={code,token,id,es:null,room:null,me:null,offset:0,battle:null,playingSeq:null,watchedSeq:null,prepKey:null,outShown:false,overShown:false};
 try{sessionStorage.setItem(NET,JSON.stringify({code,token,id}));}catch{}
 mode='multi';s={...fresh(),phase:'lobby',shop:[null,null,null,null,null]};enemy=[];battle=null;selected=null;messages.length=0;$('#log').innerHTML='';
 const es=new EventSource(`/api/stream?code=${encodeURIComponent(code)}&token=${encodeURIComponent(token)}`);net.es=es;
 es.addEventListener('state',e=>onState(JSON.parse(e.data)));
 es.addEventListener('battle',e=>{net.battle=JSON.parse(e.data);maybeReplay();});
 es.addEventListener('gone',()=>leaveToMenu('방에서 나갔습니다.'));
 es.onerror=()=>{if(es.readyState===EventSource.CLOSED)leaveToMenu('방 연결이 끊겼어요. 방이 닫혔을 수 있습니다.');};
 render();
}
function leaveToMenu(msg){
 if(net?.es)net.es.close();net=null;try{sessionStorage.removeItem(NET);}catch{}
 stopPlayback();mode='solo';s=fresh();enemy=[];battle=null;selected=null;
 if(msg)toast(msg);render();menu();
}
function stopPlayback(){runToken++;clearTimeout(timer);fx.clear();view.clear();liveStats=[];energyView=0;chainView=0;burstRequested=false;}
function onState({room:r,me}){
 if(!net)return;
 const prev=net.room;net.room=r;net.me=me;net.offset=r.serverNow-Date.now();
 if(me.s)syncUid(Math.max(0,...[...me.s.board,...me.s.bench].filter(Boolean).map(u=>u.uid)));
 if(r.phase==='lobby'){s={...fresh(),phase:'lobby',shop:[null,null,null,null,null]};enemy=[];battle=null;net.outShown=false;net.overShown=false;net.prepKey=null;showLobby();render();return;}
 s=me.s;
 if(selected&&!chosen())selected=null;
 if(r.phase==='starter'){if(s.phase==='starter'&&!mePublic()?.picked){if(modalKind!=='starter')modal(`<div class="eyebrow">ROUND 0 · STARTER <span class="modal-timer" data-timer></span></div><h2>시작 공명을 고르세요.</h2><p>같은 팀을 다른 플레이어도 고를 수 있어요. 고른 3명은 공용 모집 풀에서 빠집니다. 시간이 지나면 무작위로 정해집니다.</p><div class="starter-grid">${starterCards()}</div>`,'starter');}else waitingStarter();render();return;}
 if(r.phase==='prep'){const key=`${r.round}`;if(net.prepKey!==key){net.prepKey=key;enterPrep();}else render();}
 if(r.phase==='battle'){maybeReplay();if(net.playingSeq!==r.battleSeq)render();}
 if(r.phase==='over'){if(!net.overShown){net.overShown=true;stopPlayback();showOver();}else if(modalKind==='over')showOver();render();return;}
 if(!mePublic()?.alive&&!net.outShown&&r.phase!=='over'){net.outShown=true;const p=mePublic();modal(`<div class="eyebrow">ELIMINATED</div><h2>${p?.place}위 · 공명이 잠들었습니다.</h2><p>남은 플레이어의 대전을 계속 지켜볼 수 있어요. 상단 플레이어 카드를 누르면 덱을 볼 수 있습니다.</p><div class="modal-actions"><button data-net="leave">로비 나가기</button><button class="primary" data-close>관전 계속</button></div>`);}
 if(modalKind==='lobby'&&r.phase!=='lobby')closeModal();
}
function waitingStarter(){const r=room(),done=r.players.filter(p=>p.picked).length;modal(`<div class="eyebrow">ROUND 0 · STARTER <span class="modal-timer" data-timer></span></div><h2>다른 공명자를 기다리는 중…</h2><p>${done} / ${r.players.length}명 선택 완료. 모두 고르면 바로 1라운드 준비가 시작됩니다.</p><div class="wait-list">${r.players.map(p=>`<span class="${p.picked?'ok':''}">${p.picked?'✓':'…'} ${esc(p.name)}</span>`).join('')}</div>`,'waiting');}
function enterPrep(){
 stopPlayback();battle=null;enemy=Array(12).fill(null);selected=null;net.battle=null;net.playingSeq=null;
 $('#arenaMessage').textContent=mePublic()?.alive?'배치를 마치고 준비 완료를 누르세요':'관전 중 · 다음 전투를 기다립니다';
 if(['waiting','starter','result','lobby'].includes(modalKind)||modalKind===null)closeModal();
 render();
 if(mePublic()?.alive){if(room().round>1)log(`${room().round}라운드 준비 · 수입 획득`);if(s.pending?.length)rewardModal();}
}
function rewardModal(){
 const r=s.pending?.[0];if(!r)return closeModal();
 const list=r.type==='augment'?AUGMENTS:ECHOS;
 modal(`<div class="eyebrow">${r.type==='augment'?'RESONANCE VARIATION':'ECHO CAPTURE'} <span class="modal-timer" data-timer></span></div><h2>${r.type==='augment'?'조합의 규칙을 바꾸세요.':'다음 주력을 완성할 에코.'}</h2><p>${r.type==='augment'?'공명 변주는 대전 끝까지 유지됩니다.':'에코는 가방에 보관됩니다. 캐릭터를 선택해 장착하세요.'} 고르지 않으면 전투 시작 때 첫 번째가 선택됩니다.</p><div class="augment-choices">${r.choices.map((id,i)=>{const x=list.find(a=>a.id===id);return `<button data-pick="${i}"><span>${x.icon}</span><h3>${x.name}</h3><p>${x.desc}</p><small>${r.type==='augment'?'대전 전체에 적용':'에코 획득'} ↗</small></button>`;}).join('')}</div><div class="modal-actions"><button data-close>나중에 고르기</button></div>`,'reward');
}
function showLobby(){
 const r=room(),host=isHost();
 modal(`<div class="eyebrow">RESONANCE ARENA · LOBBY</div><div class="room-code"><small>방 코드</small><strong>${esc(r.code)}</strong><button data-net="copy">코드 복사</button></div><p class="lan-note" id="lanNote2"></p><div class="lobby-list">${r.players.map(p=>`<div class="lobby-row"><span class="dot ${p.connected||p.bot?'on':''}"></span><b>${esc(p.name)}</b>${p.id===r.hostId?'<em>방장</em>':''}${p.bot?'<em class="bot">BOT</em>':''}${p.id===net.id?'<em class="you">나</em>':''}${host&&p.id!==net.id?`<button class="kick" data-kick="${p.id}" aria-label="${esc(p.name)} 내보내기">✕</button>`:''}</div>`).join('')}${Array.from({length:Math.max(0,8-r.players.length)},()=>'<div class="lobby-row empty">빈 자리</div>').join('')}</div>${host?`<div class="lobby-controls"><div class="seg" role="group" aria-label="준비 시간">${[25,40,60].map(n=>`<button data-prep="${n}" class="${r.prepSeconds===n?'on':''}">${n}초</button>`).join('')}</div><button data-net="bot" ${r.players.length>=8?'disabled':''}>＋ 봇 추가</button></div><div class="modal-actions"><button data-net="leave">방 나가기</button><button class="primary" data-net="start" ${r.players.length<2?'disabled':''}>대전 시작 (${r.players.length}명)</button></div>`:`<p class="muted center-note">방장이 시작하면 바로 시작 팀을 고릅니다. · 준비 시간 ${r.prepSeconds}초</p><div class="modal-actions"><button data-net="leave">방 나가기</button></div>`}`,'lobby');
 fetch('/api/info').then(r=>r.json()).then(info=>{const el=$('#lanNote2');if(el&&info.lan.length)el.innerHTML=`친구 접속: ${info.lan.map(u=>`<code>${esc(u)}</code>`).join(' ')} → <b>함께 대전</b> → 코드 입력`;}).catch(()=>{});
}
function showOver(){
 const r=room(),list=r.players.slice().sort((a,b)=>a.place-b.place),me=mePublic();
 modal(`<div class="eyebrow">ARENA COMPLETE · ${r.round} ROUNDS</div><h2>${me?.place===1?'최후의 공명자가 되었습니다!':`${me?.place}위로 대전을 마쳤습니다.`}</h2><div class="standings">${list.map(p=>`<div class="${p.id===net.id?'me':''}"><span class="place">${p.place===1?'♛':p.place}</span><b>${esc(p.name)}</b>${p.bot?'<em>BOT</em>':''}<small>${p.place===1?`♥ ${p.life}`:'탈락'}</small><span class="mini-team">${p.board.filter(Boolean).slice(0,6).map(u=>portrait(u.id)).join('')}</span></div>`).join('')}</div><div class="modal-actions"><button data-net="leave">나가기</button>${isHost()?'<button class="primary" data-net="lobby">같은 멤버로 로비 복귀</button>':'<span class="muted">방장이 로비로 돌아가면 다시 대전할 수 있어요.</span>'}</div>`,'over');
}
function scout(id){
 const p=room()?.players.find(p=>p.id===id);if(!p)return;
 const board=p.board.length?p.board:Array(12).fill(null),ts=traits(board),act=Object.keys(TRAITS).filter(t=>active(ts,t));
 modal(`<div class="eyebrow">SCOUTING ${p.bot?'· BOT':''}</div><h2>${esc(p.name)} <small class="scout-life">♥ ${p.life} · 출전 ${board.filter(Boolean).length}/${p.level}</small></h2><div class="scout-board">${board.map(u=>u?`<div class="scout-cell" style="--hero:${HEROES[u.id].color}">${portrait(u.id)}<span>${'★'.repeat(u.star)}</span><b>${HEROES[u.id].name}</b></div>`:'<div class="scout-cell empty"></div>').join('')}</div><p class="scout-traits">${act.length?act.map(t=>`<span>${TRAIT_ICON[t]} ${t} ${ts[t]}</span>`).join(''):'<span class="muted">활성 유대 없음</span>'}</p>${p.augments.length?`<p class="scout-traits">${p.augments.map(a=>{const x=AUGMENTS.find(y=>y.id===a);return `<span>${x.icon} ${x.name}</span>`;}).join('')}</p>`:''}<button class="primary wide" data-close>닫기</button>`);
}
// Rebuild full per-event snapshots from the server's delta-encoded replay.
function expandEvents(list){
 const states=new Map(),stats=new Map();let en=0;
 return list.map(e=>{if(e.en!==undefined)en=e.en;for(const [uid,hp,shield,mana,charge] of e.st||[])states.set(uid,{uid,hp,shield,mana,charge});for(const [uid,id,damage,healed,extras] of e.sa||[])stats.set(uid,{uid,id,damage,healed,extras});return {...e,energy:en,states:[...states.values()],stats:[...stats.values()]};});
}
function maybeReplay(){
 const r=room(),b=net?.battle;if(!r||!b||r.phase!=='battle'||b.seq!==r.battleSeq||net.playingSeq===b.seq)return;
 net.playingSeq=b.seq;stopPlayback();
 if(['reward','result'].includes(modalKind)||modalKind===null)closeModal();
 selected=null;enemy=b.enemyBoard;battle={fighters:b.fighters,ended:false};
 const events=expandEvents(b.events);
 view=new Map((events[0]?.states||[]).map(f=>[f.uid,f]));
 render();
 fx.banner(b.ghost?'PHANTOM DUEL':'RIVAL DUEL',`VS ${b.opponent.name}${b.ghost?' 잔상':''}`);log(`R${b.round} · ${b.opponent.name}${b.ghost?' (잔상)':''} 전투 개시`);
 $('#arenaMessage').textContent=`${b.opponent.name}${b.ghost?' 잔상':''}의 공명과 교전 중`;
 const token=runToken;timer=setTimeout(()=>{if(token===runToken)playEvents(events,()=>finishReplay(b));},1000/speed);
}
function finishReplay(b){
 battle.ended=true;
 const won=b.outcome==='win',draw=b.outcome==='draw';
 fx.banner(won?'VICTORY':draw?'DRAW':'DEFEAT',won?`${b.opponent.name} 제압`:`생존력 −${b.damageTaken}`);
 log(`R${b.round} · ${won?'승리':draw?'무승부':'패배'}${b.damageTaken?` (−${b.damageTaken})`:''}`);
 const token=runToken;
 timer=setTimeout(()=>{if(token!==runToken)return;
  const list=battle.fighters.filter(f=>f.side==='ally').map(f=>({...f,damage:liveStats.find(x=>x.uid===f.uid)?.damage||0})).sort((a,c)=>c.damage-a.damage),total=list.reduce((n,f)=>n+f.damage,0);
  modal(`<div class="eyebrow">ROUND ${b.round} · ${won?'VICTORY':draw?'DRAW':'DEFEAT'}</div><h2>${won?'공명이 이어집니다.':draw?'승부가 나지 않았습니다.':'조합을 다시 다듬을 시간.'}</h2><p>VS ${esc(b.opponent.name)}${b.ghost?' (잔상 · 상대 체력 변화 없음)':''} · ${b.damageTaken?`생존력 −${b.damageTaken}`:'생존력 유지'}</p><div class="result-stat"><span>준 피해<b>${b.dealt.toLocaleString()}</b></span><span>받은 피해<b>${b.received.toLocaleString()}</b></span><span>협동·추격<b>${chainView}회</b></span></div><div class="damage-chart">${list.map(f=>`<div>${portrait(f.id)}<span>${HEROES[f.id].name}<i style="width:${f.damage/Math.max(total,1)*100}%"></i></span><b>${Math.round(f.damage)}</b></div>`).join('')}</div><button class="primary wide" data-net="watched">다음 라운드 준비 ↗</button><p class="muted center-note">모든 플레이어가 확인하면 다음 라운드가 시작됩니다.</p>`,'result');
  timer=setTimeout(()=>markWatched(),9000);
 },1100/speed);
}
function markWatched(){if(!net||!net.battle||net.watchedSeq===net.battle.seq)return;net.watchedSeq=net.battle.seq;send('watched',{seq:net.battle.seq});const btn=document.querySelector('[data-net="watched"]');if(btn){btn.disabled=true;btn.textContent='다른 플레이어 기다리는 중…';}}
function tickTimer(){
 const r=room();let text='';
 if(multi()&&r?.deadline&&['starter','prep','battle'].includes(r.phase)){const left=Math.max(0,Math.ceil((r.deadline-(Date.now()+net.offset))/1000));text=`${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`;$('#timer').classList.toggle('urgent',left<=10&&r.phase!=='battle');}
 $('#timer').textContent=text;document.querySelectorAll('[data-timer]').forEach(el=>el.textContent=text);
}
setInterval(()=>{if(multi())tickTimer();},250);

// ── solo flow ───────────────────────────────────────────────────────
function reset(){clearTimeout(timer);runToken++;fx.clear();clearSave();s=fresh();enemy=[];battle=null;view.clear();liveStats=[];energyView=0;chainView=0;selected=null;burstRequested=false;messages.length=0;render();startScreen();}
function prep(){battle=null;view.clear();liveStats=[];energyView=0;chainView=0;burstRequested=false;selected=null;enemy=enemies(s.round);$('#arenaMessage').textContent='공명자를 배치하고 에코로 주력을 강화하세요';fx.clear();render();}
function startSolo(){mode='solo';const saved=(()=>{try{return restore(localStorage.getItem(SAVE));}catch{return null;}})();if(saved){s=saved;closeModal();prep();log('저장된 준비 단계에서 이어갑니다.');}else{s=fresh();enemy=[];render();startScreen();}}
function help(){modal(`<div class="eyebrow">HOW TO PLAY</div><h2>조합을 완성하고, 협주를 터뜨리세요.</h2><div class="help-steps"><p><b>모집과 승급</b>같은 공명자·같은 등급 3명은 자동 승급. 새로고침은 2코인.</p><p><b>배치와 유대</b>캐릭터 → 빈 칸을 눌러 이동. 다른 캐릭터를 누르면 교환합니다. 전장 윗줄이 먼저 공격받습니다. 같은 속성·역할의 서로 다른 2명으로 유대 발동.</p><p><b>에코 장착</b>캐릭터 선택 → 에코 목록에서 장착. 교체하거나 판매하면 에코를 돌려받습니다.</p><p><b>혼자 원정</b>협주 100이면 전장 하단 버튼으로 총공격. 3·6구역에서 공명 변주, 정예 경로는 보상 +4코인. 9구역 보스를 이기면 완료.</p><p><b>함께 대전</b>방장이 방을 만들고 같은 와이파이의 친구가 코드로 참가합니다. 매 라운드 제한 시간 안에 배치 → 모두 준비 완료 또는 시간 종료 시 무작위 상대와 자동 전투. 협주 총공격은 자동 발동. 진 쪽은 체력이 깎이고 0이 되면 탈락, 마지막 1인이 승리합니다. 모집 풀은 모두가 공유하므로 같은 캐릭터를 노리는 상대를 정찰하세요(상단 플레이어 카드). <b>출전 +1</b>로 출전 인원을 늘릴 수 있습니다.</p></div><button class="primary wide" data-close>전장으로</button>`);}
$('#help').onclick=help;$('#sound').onclick=()=>{fx.sound=!fx.sound;$('#sound').textContent=`사운드 ${fx.sound?'ON':'OFF'}`;fx.tone('heal');};$('#motion').onclick=()=>{fx.enabled=!fx.enabled;document.body.classList.toggle('low-motion',!fx.enabled);$('#motion').textContent=`연출 ${fx.enabled?'ON':'OFF'}`;};$('#speed').onclick=()=>{speed=speed===1?2:1;$('#speed').textContent=`${speed}× 속도`;};
$('#restart').onclick=()=>{if(multi())modal('<h2>로비에서 나갈까요?</h2><p>대전 도중 나가면 탈락 처리됩니다.</p><div class="modal-actions"><button data-close>계속 플레이</button><button class="primary" data-net="leave">나가기</button></div>');else modal('<h2>새 원정을 시작할까요?</h2><p>현재 저장된 원정이 초기화됩니다.</p><div class="modal-actions"><button data-close>계속 플레이</button><button class="primary" data-reset>새 원정</button></div><div class="modal-actions"><button data-mode="menu">← 모드 선택으로</button></div>');};
$('#refresh').onclick=()=>{if(s.phase!=='prep'||s.gold<2)return;if(multi()){send('refresh').then(r=>{if(!r.error)fx.tone();});return;}s.gold-=2;s.shop=roll(s);fx.tone();render();};
$('#lock').onclick=()=>{if(s.phase!=='prep')return;if(multi()){send('lock');return;}s.locked=!s.locked;render();};
$('#levelUp').onclick=()=>{if(multi())send('level').then(r=>{if(!r.error){toast('출전 인원 +1');fx.tone('heal');}});};
$('#pendingBtn').onclick=()=>rewardModal();
$('#sell').onclick=()=>{const u=chosen();if(!u)return;if(multi()){send('sell',{uid:u.uid});selected=null;return;}if(sell(s,u.uid)){selected=null;render();}};
$('#unequip').onclick=()=>{const u=chosen();if(s.phase!=='prep'||!u?.echo)return;if(multi()){send('unequip',{uid:u.uid});return;}unequip(s,u.uid);render();};
function upgradeNotices(list){(list||[]).forEach(msg=>{toast(msg);log(msg);fx.banner('RESONATOR UPGRADE',msg);});}
document.addEventListener('click',async ev=>{
 const el=ev.target.closest('button');if(!el||el.disabled)return;
 if(el.hasAttribute('data-close')){if(modalKind==='result')markWatched();closeModal();return;}
 if(el.hasAttribute('data-reset')){reset();return;}
 if(el.dataset.mode){if(el.dataset.mode==='solo')startSolo();else if(el.dataset.mode==='multi')netScreen();else{clearTimeout(timer);runToken++;fx.clear();s=fresh();enemy=[];battle=null;render();menu();}return;}
 if(el.dataset.net){const a=el.dataset.net;
  if(a==='back'){menu();return;}
  if(a==='create'||a==='join'){const name=nickValue();if(!name)return;const code=($('#joinCode')?.value||'').trim().toUpperCase();if(a==='join'&&code.length!==4){toast('4자리 방 코드를 입력해 주세요.');$('#joinCode')?.focus();return;}el.disabled=true;const r=await post(`/api/${a}`,a==='join'?{name,code}:{name});el.disabled=false;if(r.error){toast(r.error);return;}clearTimeout(timer);runToken++;connect(r.code,r.token,r.id);return;}
  if(a==='copy'){try{await navigator.clipboard.writeText(room().code);toast('방 코드를 복사했어요.');}catch{toast(`방 코드: ${room().code}`);}return;}
  if(a==='bot'){send('addBot');return;}if(a==='start'){send('start');return;}if(a==='lobby'){send('lobby');return;}
  if(a==='leave'){await send('leave');leaveToMenu();return;}
  if(a==='watched'){markWatched();return;}
  return;}
 if(el.dataset.kick){send('kick',{id:el.dataset.kick});return;}
 if(el.dataset.prep){send('settings',{prepSeconds:+el.dataset.prep});return;}
 if(el.dataset.scout){scout(el.dataset.scout);return;}
 if(el.dataset.pick){const r=await send('pick',{i:+el.dataset.pick});if(!r.error){toast(r.type==='augment'?'공명 변주 적용':'에코 획득');setTimeout(()=>{if(s.pending?.length)rewardModal();else if(modalKind==='reward')closeModal();},60);}return;}
 if(el.dataset.starter){if(multi()){const r=await send('starter',{id:el.dataset.starter});if(!r.error&&room()?.phase==='starter')waitingStarter();return;}if(chooseStarter(s,el.dataset.starter)){closeModal();prep();log(`${STARTERS.find(k=>k.id===s.starter).title} · 탐사 시작`);}return;}
 if(el.hasAttribute('data-buy')){if(multi()){const r=await send('buy',{i:+el.dataset.buy});if(!r.error){fx.tone('heal');upgradeNotices(r.notices);}return;}const result=buy(s,+el.dataset.buy);if(result.error)toast(result.error);else{fx.tone('heal');upgradeNotices(result.notices);}render();return;}
 if(el.hasAttribute('data-equip')){const u=chosen();if(!u)return;if(multi()){const r=await send('equip',{uid:u.uid,i:+el.dataset.equip});if(!r.error)toast('에코 장착 완료');return;}if(equip(s,u.uid,+el.dataset.equip)){toast('에코 장착 완료');render();}return;}
 if(el.dataset.area&&el.dataset.area!=='enemy'&&s.phase==='prep'){const dest={area:el.dataset.area,i:+el.dataset.i};
  if(selected){if(selected.area===dest.area&&selected.i===dest.i)selected=null;else if(multi()){const from=selected;selected=null;render();send('move',{from,to:dest});return;}else if(move(s,selected,dest))selected=null;else toast(`출전 인원은 최대 ${capacity(s)}명입니다.`);}
  else if(s[dest.area][dest.i])selected=dest;render();return;}
});
function playEvents(events,done){const token=runToken;let index=0;function next(){if(token!==runToken||s.phase!=='battle')return;const e=events[index++];if(!e){done();return;}view=new Map(e.states.map(f=>[f.uid,f]));liveStats=e.stats;energyView=e.energy;chainView=liveStats.reduce((n,f)=>n+f.extras,0);renderBattle();let wait=70/speed;if(e.kind==='skill'){const a=battle.fighters.find(f=>f.uid===e.from),h=HEROES[a.id];log(`${a.side==='ally'?'✦':'·'} ${h.name} · ${e.name}`);$('#arenaMessage').textContent=`${h.name} · ${e.name}`;if(a.side==='ally'&&fx.cutin(h,e.name))wait=430/speed;}else if(e.kind==='burst'){const mine=!e.side||e.side==='ally';fx.banner(mine?'RESONANCE CHAIN':'RIVAL CHAIN',mine?'협주 총공격 · 전원 해방 충전':'상대의 협주 총공격!');fx.tone('ult');wait=650/speed;}else if(e.kind!=='sync'){const a=battle.fighters.find(f=>f.uid===e.from);fx.hit(e,HEROES[a.id].color);if(['coop','extra'].includes(e.kind)&&a.side==='ally')fx.combo(chainView);if(e.kind==='ult')wait=130/speed;}timer=setTimeout(next,wait);}next();}
function afterEvents(){if(battle.ended){fx.banner(battle.winner==='ally'?'VICTORY':'DEFEAT',battle.winner==='ally'?'잔향 제압 · 다음 구역 개방':'공명 재편성');timer=setTimeout(finish,1050/speed);return;}if(burstRequested&&battle.energy>=100){burstRequested=false;playEvents(burst(battle),afterEvents);return;}burstRequested=false;timer=setTimeout(tick,260/speed);}
function tick(){if(s.phase==='battle')playEvents(step(battle),afterEvents);}
$('#fight').onclick=()=>{
 if(multi()){const me=mePublic();if(room()?.phase==='prep'&&me?.alive)send('ready',{value:!me.ready});return;}
 if(s.phase!=='prep'||!s.board.some(Boolean))return;save();s.phase='battle';selected=null;battle=makeBattle(s,enemy);view=new Map(battle.fighters.map(f=>[f.uid,{...f}]));energyView=battle.energy;runToken++;render();fx.banner(s.round%3===0?'CALAMITY SIGNAL':'COMBAT START',s.round%3===0?'재해급 잔상 출현':'공명 동기화 · 전투 개시');log(`${s.round}구역 · 전투 개시`);timer=setTimeout(tick,1000/speed);};
$('#resonance').onclick=()=>{if(multi()||s.phase!=='battle'||energyView<100||battle.ended||burstRequested)return;burstRequested=true;$('#resonance').disabled=true;$('#resonance').classList.remove('ready');$('#arenaMessage').textContent='협주 총공격 대기 · 현재 행동 후 발동';};
function finish(){const result=settle(s,battle);if(!result)return;clearSave();render();const list=battle.fighters.filter(f=>f.side==='ally').sort((a,b)=>b.damage-a.damage),total=list.reduce((n,f)=>n+f.damage,0);modal(`<div class="eyebrow">${result.ended?'EXPEDITION COMPLETE':`SECTOR ${s.round} CLEAR`}</div><h2>${result.ended?(s.life<=0?'공명이 잠들었습니다.':result.won?'무음의 심연을 돌파했습니다.':'최종 잔상을 넘지 못했습니다.'):(result.won?'공명이 이어집니다.':'조합을 다시 다듬을 시간.')}</h2><p>${result.won?'승리':'패배'} · 보상 +${result.income}코인 · ${s.wins}승 / ${s.round}전</p><div class="result-stat"><span>누적 피해<b>${Math.round(total).toLocaleString()}</b></span><span>협동·추격<b>${chainView}회</b></span><span>협주 총공격<b>${battle.bursts}회</b></span></div><div class="damage-chart">${list.map(f=>`<div>${portrait(f.id)}<span>${HEROES[f.id].name}<i style="width:${f.damage/Math.max(total,1)*100}%"></i></span><b>${Math.round(f.damage)}</b></div>`).join('')}</div><button class="primary wide" id="continue">${result.ended?'새로운 공명 선택 ↗':'보상 선택 ↗'}</button>`,'solo-flow');$('#continue').onclick=()=>{if(result.ended)reset();else{s.phase='reward';if(s.round%3===0)augmentReward();else echoReward();}};}
function randomThree(list){const copy=list.slice();for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy.slice(0,3);}
function augmentReward(){const choices=randomThree(AUGMENTS.filter(a=>!s.augments.includes(a.id)));modal(`<div class="eyebrow">RESONANCE VARIATION</div><h2>조합의 규칙을 바꾸세요.</h2><div class="augment-choices">${choices.map(a=>`<button data-augment="${a.id}"><span>${a.icon}</span><h3>${a.name}</h3><p>${a.desc}</p><small>원정 전체에 적용 ↗</small></button>`).join('')}</div>`,'solo-flow');document.querySelectorAll('[data-augment]').forEach(el=>el.onclick=()=>{if(s.phase!=='reward')return;s.augments.push(el.dataset.augment);if(el.dataset.augment==='wealth')s.gold+=8;echoReward();});}
function echoReward(){const choices=randomThree(ECHOS);modal(`<div class="eyebrow">ECHO CAPTURE</div><h2>다음 주력을 완성할 에코.</h2><p>에코는 가방에 보관됩니다. 준비 단계에서 캐릭터를 선택해 장착하세요.</p><div class="augment-choices">${choices.map(e=>`<button data-echo="${e.id}"><span>${e.icon}</span><h3>${e.name}</h3><p>${e.desc}</p><small>에코 획득 ↗</small></button>`).join('')}</div>`,'solo-flow');document.querySelectorAll('[data-echo]').forEach(el=>el.onclick=()=>{s.inventory.push(el.dataset.echo);routeReward();});}
function routeReward(){const boss=(s.round+1)%3===0;modal(`<div class="eyebrow">NEXT SECTOR</div><h2>${boss?'재해급 신호가 감지됐습니다.':'다음 경로를 선택하세요.'}</h2><div class="route-choices"><button data-route="normal"><b>${boss?'♜ 재해급 잔상':'◇ 안정된 잔향'}</b><p>${boss?'보스 구역에 진입합니다. 팀과 에코를 점검하세요.':'기본 난이도 · 코인을 모으며 덱을 완성하세요.'}</p><small>준비 단계로 ↗</small></button>${boss?'':`<button data-route="elite"><b>⚔ 깊은 잔향</b><p>적 체력 +25%, 공격 +16%.<br>승리 보상 +4코인.</p><small>정예 도전 ↗</small></button>`}</div>`,'solo-flow');document.querySelectorAll('[data-route]').forEach(el=>el.onclick=()=>{if(advance(s,el.dataset.route==='elite')){closeModal();prep();}});}
$('#modal').addEventListener('cancel',ev=>{if(LOCKED_MODALS.has(modalKind))ev.preventDefault();else if(modalKind==='result')markWatched();});
$('#modal').addEventListener('close',()=>{if(!LOCKED_MODALS.has(modalKind))modalKind=null;});

// ── boot ────────────────────────────────────────────────────────────
document.body.classList.toggle('low-motion',!fx.enabled);$('#motion').textContent=`연출 ${fx.enabled?'ON':'OFF'}`;
(async()=>{
 try{const files=await fetch('/api/art').then(r=>r.ok?r.json():[]);for(const f of files)ART.set(f.replace(/\.[^.]+$/,''),f);}catch{}
 let session=null;try{session=JSON.parse(sessionStorage.getItem(NET)||'null');}catch{}
 if(session?.code&&session?.token){connect(session.code,session.token,session.id);return;}
 const saved=(()=>{try{return restore(localStorage.getItem(SAVE));}catch{return null;}})();
 if(saved){s=saved;prep();log('저장된 준비 단계에서 이어갑니다.');}else{render();menu();}
})();

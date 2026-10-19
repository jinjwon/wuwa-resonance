import {ENEMIES,unitInfo,isEnemy,encounter,bossFor,TIERS,TIER_AT,tier,teamProgress,CHAIN,copiesOf,chainLevel,chainOf,HEROES,TRAITS,TRAIT_ICON,ELEMENT_ICON,ECHOS,AUGMENTS,STARTERS,fresh,chooseStarter,restore,capacity,levelCost,MAX_CAPACITY,traits,active,buy,move,equip,unequip,sell,roll,enemies,makeBattle,step,burst,settle,advance,syncUid} from './engine.js';
import {CombatEffects} from './effects.js';
import {SpriteStage,foeSrc} from './sprites.js';
import {loadSettings,saveSettings,resetSettings,LABELS,ROOM_CHOICES,PLAY_CHOICES,RULE_OPTIONS} from './settings.js';
import {codexHtml} from './codex.js';
import {icon,logo,FAVICON} from './icons.js';
const $=q=>document.querySelector(q),SAVE='wuwa-resonance-front-v1',NET='wuwa-resonance-net-v1',NICK='wuwa-resonance-nick';
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
let settings=loadSettings(),mode='solo',s=fresh(settings.rules),enemy=[],battle=null,selected=null,speed=settings.play.speed,timer=null,view=new Map(),liveStats=[],energyView=0,burstRequested=false,chainView=0,runToken=0,modalKind=null;
let net=null;// multiplayer session: {code,token,id,es,room,me,offset,battle,playingSeq,watchedSeq,prepKey,outShown,overShown}
const messages=[],ART=new Map();
// 명조식 UI 색: 속성 색(아이콘·테두리)과 코스트 등급 색(1 회색 · 2 파랑 · 3 보라 · 4 금색).
const EL_COLOR={응결:'#5cc8f2',용융:'#f2643f',전도:'#b07bff',기류:'#4fe0a8',회절:'#f2dd6c',인멸:'#e0508f'},TIER=['','#9aa7b6','#5d9cf2','#b27cf2','#f2c35b'];
const heroVars=h=>`--hero:${h.color};--el:${EL_COLOR[h.origin]};--tier:${TIER[h.cost]}`;
const LOCKED_MODALS=new Set(['menu','net','lobby','starter','solo-flow','over','waiting']);

// ── portraits: AI atlas for the original 16, element emblem cards for the expansion,
//    and any file dropped into assets/heroes/<key>.png overrides both.
function portrait(id,cls=''){
 if(id>=100){const e=unitInfo(id);return `<div class="portrait portrait-foe ${e.kind} ${cls}" style="--art:url('${foeSrc(e)}');--hero:${e.color}"></div>`;}
 const h=HEROES[id];
 if(ART.has(h.key))return `<div class="portrait portrait-file ${cls}" style="--art:url('assets/heroes/${ART.get(h.key)}');--hero:${h.color}"></div>`;
 if(id>=16)return `<div class="portrait portrait-emblem ${cls}" style="--hero:${h.color}" data-glyph="${ELEMENT_ICON[h.origin]}"><span class="emblem-name">${h.name[0]}</span><span class="emblem-tag">${h.origin}</span></div>`;
 if(id>=12)return `<div class="portrait portrait-new ${cls}" style="--x:${(id-12)%2*100}%;--y:${Math.floor((id-12)/2)*100}%;--hero:${h.color}"></div>`;
 return `<div class="portrait ${cls}" style="--x:${id%4*100/3}%;--y:${Math.floor(id/4)*50}%;--hero:${h.color}"></div>`;
}
const fx=new CombatEffects(portrait);
const stage=new SpriteStage($('.arena'),unitInfo);stage.speed=speed;
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
 const h=unitInfo(u.id),f=battle?.fighters.find(f=>f.uid===u.uid),v=view.get(u.uid)||f,foe=isEnemy(u.id);
 const label=h.name,lv=area==='enemy'?0:chainOf(s,u.id);
 return `<button class="tile ${foe?`foe ${h.kind}`:area==='enemy'?'rival':''} ${chosen()?.uid===u.uid?'selected':''} ${v?.hp<=0?'dead':''}" data-area="${area}" data-i="${i}" data-uid="${u.uid}" style="${heroVars(h)}" aria-label="${label} ${u.star}성">${portrait(u.id)}<span class="el-icon" title="${h.origin}">${icon(h.origin)}</span><span class="stars">${'★'.repeat(u.star)}</span>${lv?`<span class="chain-badge" title="공명 체인 ${lv}">C${lv}</span>`:''}<span class="unit-name">${label}</span>${u.echo?`<span class="echo-badge" title="${ECHOS.find(e=>e.id===u.echo)?.name}">${icon('echo')}</span>`:''}${f?`<div class="health"><i style="width:${Math.max(0,(v.hp??f.max)/f.max*100)}%"></i></div><div class="mana"><i style="width:${(v.mana||0)/f.threshold*100}%"></i></div>${v.shield>0?`<span class="shield">◇${Math.round(v.shield)}</span>`:''}${u.id===0&&v.charge?`<span class="charge">승천 ${v.charge}</span>`:''}`:''}</button>`;
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
 $('#round').textContent=multi()?`R${String(r?.round||0).padStart(2,'0')}`:`${String(s.round).padStart(2,'0')} / ${String(s.rules.rounds).padStart(2,'0')}`;
 $('#life').innerHTML=`${icon('heart')}${s.life}`;$('#gold').innerHTML=`${icon('coin')}${s.gold}`;
 $('#phase').textContent=({prep:'● FORMATION',battle:'● COMBAT',result:'● RESULT',reward:'● REWARD',starter:'● EXPEDITION',out:'● SPECTATING',lobby:'● LOBBY'})[s.phase]||'● LOBBY';
 if(multi()){
  const opp=net.battle&&r?.phase==='battle'?net.battle.opponent.name+(net.battle.ghost?' (잔상)':''):null;
  const kindLabel=r?.roundKind==='overlord'?`명식전 · ${r.boss}`:r?.roundKind==='tacet'?'잔상 토벌 · 모두 같은 잔상과 전투':'플레이어 대전 · 상대는 전투 시작 때 공개';
  $('#enemyTitle').textContent=opp?`VS ${opp}`:r?.phase==='prep'?`${r.round}라운드 · ${kindLabel}`:r?.phase==='over'?'대전 종료':'공명 로비';
  $('.arena').classList.toggle('boss-stage',r?.roundKind==='overlord'&&['prep','battle'].includes(r?.phase));
 }else{
  $('#enemyTitle').textContent=s.round%3===0?`명식 · ${bossFor(s.round,{seed:s.seed}).name}`:`${s.round}구역 · ${s.elite?'깊은 잔향 · 정예 잔상':'잔상 무리'}`;
  $('.arena').classList.toggle('boss-stage',s.round%3===0||s.elite);
 }
 $('.arena').classList.toggle('battle-active',s.phase==='battle');
 if(multi()){
  const humans=r?.players.filter(p=>p.alive&&!p.bot&&p.connected)||[],readyN=humans.filter(p=>p.ready).length;
  $('#fight').disabled=r?.phase!=='prep'||!me?.alive;
  $('#fight').classList.toggle('is-ready',!!me?.ready&&r?.phase==='prep');
  $('#fight').textContent=!me?.alive?'탈락 · 관전 중':r?.phase==='battle'?'전투 진행 중':me?.ready?`준비 완료 ✓ ${readyN}/${humans.length}`:`준비 완료 ${readyN}/${humans.length}`;
  $('#restart').innerHTML=`${icon('restart')}<span>나가기</span>`;$('#restart').disabled=false;$('#help').disabled=false;
 }else{
  $('#fight').classList.remove('is-ready');
  $('#fight').disabled=s.phase!=='prep'||!s.board.some(Boolean);$('#fight').innerHTML=s.phase==='battle'?'전투 진행 중':`${icon('blade')}전투 개시`;$('#restart').innerHTML=`${icon('restart')}<span>새 원정</span>`;$('#restart').disabled=s.phase==='battle';$('#help').disabled=s.phase==='battle';
 }
 $('#capacity').textContent=`출전 ${s.board.filter(Boolean).length} / ${capacity(s)}`;$('#benchCount').textContent=`${s.bench.filter(Boolean).length} / 8`;$('#bench').innerHTML=s.bench.map((u,i)=>tile(u,'bench',i)).join('');
 $('#refresh').disabled=s.phase!=='prep'||s.gold<2;$('#lock').disabled=s.phase!=='prep';$('#lock').classList.toggle('locked',s.locked);$('#lock').innerHTML=s.locked?`${icon('lock')}<span>잠금 유지</span>`:`${icon('unlock')}<span>상점 잠금</span>`;
 const cost=levelCost(s);$('#levelUp').innerHTML=capacity(s)>=MAX_CAPACITY?'출전 최대':`출전 +1 <b>${cost} G</b>`;$('#levelUp').disabled=s.phase!=='prep'||s.gold<cost||capacity(s)>=MAX_CAPACITY;
 $('#shop').innerHTML=s.shop.map((id,i)=>{if(id===null||id===undefined)return '<div class="shop-card sold">모집 완료<span>✓</span></div>';const h=HEROES[id];const copies=[...s.board,...s.bench].filter(u=>u?.id===id&&u.star===1).length,owned=copiesOf(s,id),lv=chainLevel(owned),up=chainLevel(owned+1)>lv;const poor=s.phase==='prep'&&s.gold<h.cost;return `<button class="shop-card ${copies===2?'merge-ready':''} ${poor?'poor':''}" data-buy="${i}" data-tier="${h.cost}" style="${heroVars(h)}" ${s.phase!=='prep'||poor?'disabled':''}>${portrait(id)}<span class="cost">${h.cost} G</span>${poor?'<span class="short">코인 부족</span>':''}${copies?`<span class="owned">${copies===2?'승급 가능':`보유 ${copies}/3`}</span>`:''}${owned?`<span class="chain-pill ${up?'up':''}" title="${up?`다음: ${CHAIN[lv].desc}`:'공명 체인'}">체인 ${lv}${up?` → ${lv+1}`:''}</span>`:''}<div class="card-copy"><small><i class="el-dot">${icon(h.origin)}</i>${h.origin} · ${h.role}</small><strong>${h.name}</strong><span>${h.skill}<b>＋ 모집</b></span></div></button>`;}).join('');
 const ts=traits(s.board),entries=Object.entries(TRAITS),on=entries.filter(([t])=>ts[t]).sort((a,b)=>ts[b[0]]-ts[a[0]]),off=entries.filter(([t])=>!ts[t]);
 const teams=teamProgress(s.board);
 $('#traits').innerHTML=(on.length?on.map(([t])=>{const k=tier(ts,t),next=TIER_AT.find(n=>n>ts[t]);return `<div class="trait ${k?'active':''}" style="--el:${EL_COLOR[t]||'#e9dcb8'}"><span class="trait-icon">${icon(t)}</span><div><b>${t}</b><small>${k?TIERS[t].d(k-1):`${TIER_AT[0]}명: ${TIERS[t].d(0)}`}${next&&k?`<br><i class="next">다음 ${next}명: ${TIERS[t].d(k)}</i>`:''}</small></div><span class="trait-count">${TIER_AT.map(n=>`<i class="${ts[t]>=n?'on':''}"></i>`).join('')}<em>${ts[t]}${next?`/${next}`:''}</em></span></div>`;}).join(''):'<p class="muted trait-empty">공명자를 전장에 배치하면 유대가 표시됩니다.</p>')
  +(teams.length?`<div class="team-box"><small>공명 편성</small>${teams.map(t=>`<div class="team ${t.have===t.members.length?'on':''}" title="${t.desc}"><span class="team-faces">${t.members.map(id=>`<span class="${s.board.some(u=>u?.id===id)?'have':''}">${portrait(id)}</span>`).join('')}</span><div><b>${t.name}</b><small>${t.have===t.members.length?t.desc.split(' — ')[1]:`${t.have}/${t.members.length} · ${t.desc.split(' — ')[0]}`}</small></div></div>`).join('')}</div>`:'')+(off.length?`<div class="trait-off"><small>미발동 유대</small><div>${off.map(([t,d])=>`<span title="${t} · ${d}" style="--el:${EL_COLOR[t]||'#c9c2ae'}">${icon(t)}${t}</span>`).join('')}</div></div>`:'');
 if(multi())renderPlayers();
 else $('#route').innerHTML=Array.from({length:s.rules.rounds},(_,i)=>`<span class="route-node ${i+1===s.round?'current':i+1<s.round?'complete':''}"><span>${(i+1)%3===0?icon('boss'):i+1}</span></span>`).join('');
 $('#augments').innerHTML=s.augments.length?s.augments.map(id=>{const a=AUGMENTS.find(x=>x.id===id);return `<div class="augment-small"><b>${a.icon} ${a.name}</b><small>${a.desc}</small></div>`;}).join(''):`<p class="muted">${multi()?'2·5·8… 라운드 시작 때<br>덱을 바꾸는 공명 변주 선택.':'3 · 6구역 돌파 후<br>덱을 바꾸는 공명 변주 선택.'}</p>`;
 const boss=s.round%3===0?bossFor(s.round,{seed:s.seed}):null;
 $('#encounterInfo').innerHTML=multi()?feedHtml():`<div class="encounter-tag"><b>${boss?`${icon('boss')}명식 · ${boss.name}`:s.elite?`${icon('blade')}깊은 잔향`:`${icon('path')}잔상 무리`}</b><small>${boss?`${boss.skill} — ${boss.desc}${boss.echo?`<br>처치 시 에코 「${ECHOS.find(e=>e.id===boss.echo).name}」 획득 기회`:''}`:s.elite?'정예 잔상 추가 · 적 체력 +12%<br>승리 보상 +4코인':'3구역마다 명식(보스) 등장'}<br>매 전투 후 에코 1개 선택</small></div>`;
 const u=chosen();$('#echoInventory').innerHTML=s.inventory.length?s.inventory.map((id,i)=>{const e=ECHOS.find(e=>e.id===id);return `<button data-equip="${i}" title="${e.desc}" ${!u||s.phase!=='prep'?'disabled':''}>${e.icon} ${e.name}</button>`;}).join(''):'<span class="muted">장착 중인 에코는 캐릭터 정보에서 회수할 수 있어요.</span>';
 const pending=multi()?s.pending?.length||0:0;$('#pendingBtn').hidden=!pending||s.phase!=='prep';$('#pendingBtn').textContent=`보상 선택 ${pending}`;
 $('#resonance span').textContent=multi()?'자동 협주':'협주 총공격';
 renderBattle();detail();tickTimer();save();
}
function renderPlayers(){
 const list=(room()?.players||[]).slice().sort((a,b)=>(b.alive-a.alive)||(a.alive?b.life-a.life:a.place-b.place));
 $('#route').innerHTML=`<div class="player-strip" role="list">${list.map(p=>`<button role="listitem" class="pchip ${p.id===net.id?'me':''} ${p.alive?'':'out'} ${p.connected||p.bot?'':'offline'}" data-scout="${p.id}" title="${esc(p.name)} 덱 보기"><span class="pchip-top"><b>${esc(p.name)}</b>${p.bot?'<em>BOT</em>':''}${p.ready&&p.alive&&room().phase==='prep'?'<em class="ok">✓</em>':''}</span><span class="pl-life"><i style="width:${Math.max(0,p.life)}%"></i></span><small>${p.alive?`${icon('heart')}${p.life}${p.streak>=2?` · ${p.streak}연승`:p.streak<=-2?` · ${-p.streak}연패`:''}`:`${p.place}위 탈락`}</small></button>`).join('')}</div>`;
}
function feedHtml(){
 const feed=room()?.feed||[];
 return `<div class="encounter-tag"><b>${icon('arena')}대전 기록</b>${feed.length?feed.slice(0,8).map(f=>f.out?`<small class="feed-out">R${f.round} · ${f.out.map(esc).join(', ')} 탈락</small>`:`<small>R${f.round} · ${esc(f.a)} vs ${esc(f.o)} → ${f.winner?`<b>${esc(f.winner)}</b> 승${f.dmg?` (−${f.dmg})`:''}`:'무승부'}</small>`).join(''):'<small>첫 전투 후 결과가 표시됩니다.<br>패배 시 체력 감소 = 2 + 라운드 보정 + 남은 상대 ★</small>'}</div>`;
}
function detail(){const u=chosen();$('#sell').disabled=!u||s.phase!=='prep';$('#unequip').disabled=!u?.echo||s.phase!=='prep';if(!u){$('#detail').innerHTML=`<p class="muted">캐릭터를 선택하면 스킬·에코를 확인합니다.<br>${multi()?'협주 100이 되면 <b>자동으로 총공격</b>합니다.':'협주가 100이면 <b>총공격</b>을 직접 발동하세요.'}</p>`;$('#sell').textContent='선택 캐릭터 판매';return;}const h=HEROES[u.id],e=ECHOS.find(e=>e.id===u.echo);$('#detail').innerHTML=`<div class="detail-hero">${portrait(u.id)}<div><b>${h.name} ${'★'.repeat(u.star)}</b><small>${h.origin} · ${h.role}</small></div></div><b class="skill-name">${h.skill}</b><p>${h.desc}</p>${chainHtml(u.id)}${e?`<div class="equipped"><b>${e.icon} ${e.name}</b><small>${e.desc}</small></div>`:'<p class="muted">에코 미장착</p>'}`;$('#sell').textContent=`판매 · ${h.cost*3**(u.star-1)} G`;}
function chainHtml(id){const n=copiesOf(s,id),lv=chainLevel(n);return `<div class="chain-head"><span>공명 체인 <b>${lv} / 6</b></span><span>사본 ${n} / 9</span></div><div class="chain-list" style="--hero:${HEROES[id].color}">${CHAIN.map(c=>`<div class="${lv>=c.n?'on':''}" title="사본 ${c.copies}장"><b>${c.n}</b><span>${c.name} · ${c.desc}</span></div>`).join('')}</div>`;}
function starterCards(){return STARTERS.map(k=>`<button data-starter="${k.id}">${portrait(k.lead)}<div><small>${k.tag}</small><h3>${k.title}</h3><p>${k.desc}</p><b>이 팀으로 출발 ↗</b></div></button>`).join('');}
function startScreen(){modal(`<div class="eyebrow">WUTHERING WAVES · FAN STRATEGY</div><h2>어떤 공명으로 시작할까요?</h2><p>첫 3명과 주력 에코를 지급합니다. 같은 공명자를 모을 때마다 <b>공명 체인</b>이 한 칸씩 열리고, 3장이면 ★★로 승급합니다.</p><div class="starter-grid">${starterCards()}</div><p class="starter-note">${s.rules.rounds}구역 원정 · 3구역마다 명식 · 난이도 ${({easy:'쉬움',normal:'보통',hard:'어려움'})[s.rules.difficulty]} · 준비 단계 자동 저장</p><div class="modal-actions"><button data-mode="menu">← 타이틀</button></div>`,'solo-flow');}

// ── mode menu ───────────────────────────────────────────────────────
function menu(){modal(`<div class="title-hero">${logo('logo-lg')}<p class="title-tag">WUTHERING WAVES · FAN STRATEGY</p></div><h2>어떤 전장으로 갈까요?</h2><p>25명의 공명자 · 6속성 × 4역할 유대 · 사본을 모을수록 열리는 공명 체인. 혼자 9구역 원정을 떠나거나, 친구·봇과 최후의 1인을 가립니다.</p><div class="mode-grid"><button data-mode="solo"><span class="mode-icon">${icon('solo')}</span><small>SOLO EXPEDITION</small><h3>혼자 원정</h3><p>9구역 로그라이크 · 재해급 보스 3회<br>협주 총공격을 직접 발동</p><b>${hasSoloSave()?'저장된 원정 이어하기 ↗':'원정 시작 ↗'}</b></button><button data-mode="multi" class="mode-multi"><span class="mode-icon">${icon('arena')}</span><small>RESONANCE ARENA · 2–8인</small><h3>함께 대전</h3><p>방 코드로 모여 매 라운드 다른 플레이어 덱과 자동 전투<br>공용 모집 풀 · 마지막까지 살아남으면 승리</p><b>로비 열기 ↗</b></button></div>`,'menu');}
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
 stopPlayback();mode='solo';s=fresh(settings.rules);enemy=[];battle=null;selected=null;
 if(msg)toast(msg);render();showTitle();
}
function stopPlayback(){runToken++;clearTimeout(timer);fx.clear();stage.clear();view.clear();liveStats=[];energyView=0;chainView=0;burstRequested=false;}
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
 modal(`<div class="eyebrow">RESONANCE ARENA · LOBBY</div><div class="room-code"><small>방 코드</small><strong>${esc(r.code)}</strong><button data-net="copy">코드 복사</button></div><p class="lan-note" id="lanNote2"></p><div class="lobby-list">${r.players.map(p=>`<div class="lobby-row"><span class="dot ${p.connected||p.bot?'on':''}"></span><b>${esc(p.name)}</b>${p.id===r.hostId?'<em>방장</em>':''}${p.bot?'<em class="bot">BOT</em>':''}${p.id===net.id?'<em class="you">나</em>':''}${host&&p.id!==net.id?`<button class="kick" data-kick="${p.id}" aria-label="${esc(p.name)} 내보내기">✕</button>`:''}</div>`).join('')}${Array.from({length:Math.max(0,r.maxPlayers-r.players.length)},()=>'<div class="lobby-row empty">빈 자리</div>').join('')}</div>${host?`<div class="room-rules">${Object.keys(ROOM_CHOICES).map(k=>`<div class="set-row"><span>${LABELS.room[k][0]}</span><div class="seg">${ROOM_CHOICES[k].map(v=>`<button data-room="${k}" data-val="${v}" class="${r[k]===v?'on':''}" ${k==='maxPlayers'&&v<r.players.length?'disabled':''}>${LABELS.room[k][1](v)}</button>`).join('')}</div></div>`).join('')}</div><div class="lobby-controls"><button data-net="bot" ${r.players.length>=r.maxPlayers?'disabled':''}>＋ 봇 추가</button></div><div class="modal-actions"><button data-net="leave">방 나가기</button><button class="primary" data-net="start" ${r.players.length<2?'disabled':''}>대전 시작 (${r.players.length}명)</button></div>`:`<p class="muted center-note">방장이 시작하면 바로 시작 팀을 고릅니다.<br>준비 ${r.prepSeconds}초 · 생존력 ${r.startLife} · 잔상 토벌 ${r.opening}라운드 · ${r.pveEvery?`${r.pveEvery}라운드마다 명식전`:'명식전 없음'} · 최대 ${r.maxPlayers}명</p><div class="modal-actions"><button data-net="leave">방 나가기</button></div>`}`,'lobby');
 fetch('/api/info').then(r=>r.json()).then(info=>{const el=$('#lanNote2');if(el&&info.lan.length)el.innerHTML=`친구 접속: ${info.lan.map(u=>`<code>${esc(u)}</code>`).join(' ')} → <b>함께 대전</b> → 코드 입력`;}).catch(()=>{});
}
function showOver(){
 const r=room(),list=r.players.slice().sort((a,b)=>a.place-b.place),me=mePublic();
 modal(`<div class="eyebrow">ARENA COMPLETE · ${r.round} ROUNDS</div><h2>${me?.place===1?'최후의 공명자가 되었습니다!':`${me?.place}위로 대전을 마쳤습니다.`}</h2><div class="standings">${list.map(p=>`<div class="${p.id===net.id?'me':''}"><span class="place">${p.place===1?'♛':p.place}</span><b>${esc(p.name)}</b>${p.bot?'<em>BOT</em>':''}<small>${p.place===1?`${icon('heart')}${p.life}`:'탈락'}</small><span class="mini-team">${p.board.filter(Boolean).slice(0,6).map(u=>portrait(u.id)).join('')}</span></div>`).join('')}</div><div class="modal-actions"><button data-net="leave">나가기</button>${isHost()?'<button class="primary" data-net="lobby">같은 멤버로 로비 복귀</button>':'<span class="muted">방장이 로비로 돌아가면 다시 대전할 수 있어요.</span>'}</div>`,'over');
}
function scout(id){
 const p=room()?.players.find(p=>p.id===id);if(!p)return;
 const board=p.board.length?p.board:Array(12).fill(null),ts=traits(board),act=Object.keys(TRAITS).filter(t=>active(ts,t));
 modal(`<div class="eyebrow">SCOUTING ${p.bot?'· BOT':''}</div><h2>${esc(p.name)} <small class="scout-life">${icon('heart')}${p.life} · 출전 ${board.filter(Boolean).length}/${p.level}</small></h2><div class="scout-board">${board.map(u=>u?`<div class="scout-cell" style="--hero:${HEROES[u.id].color}">${portrait(u.id)}<span>${'★'.repeat(u.star)}</span><b>${HEROES[u.id].name}</b></div>`:'<div class="scout-cell empty"></div>').join('')}</div><p class="scout-traits">${act.length?act.map(t=>`<span>${icon(t)}${t} ${ts[t]}</span>`).join(''):'<span class="muted">활성 유대 없음</span>'}</p>${p.augments.length?`<p class="scout-traits">${p.augments.map(a=>{const x=AUGMENTS.find(y=>y.id===a);return `<span>${x.icon} ${x.name}</span>`;}).join('')}</p>`:''}<button class="primary wide" data-close>닫기</button>`);
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
 render();stage.mount(battle.fighters,{phantom:b.ghost});
 fx.banner(b.pve==='overlord'?'OVERLORD':b.pve?'TACET DISCORD':b.ghost?'PHANTOM DUEL':'RIVAL DUEL',b.pve?b.opponent.name:`VS ${b.opponent.name}${b.ghost?' 잔상':''}`);log(`R${b.round} · ${b.opponent.name}${b.ghost?' (잔상)':''} 전투 개시`);
 $('#arenaMessage').textContent=`${b.opponent.name}${b.ghost?' 잔상':''}의 공명과 교전 중`;
 const token=runToken;timer=setTimeout(()=>{if(token===runToken)playEvents(events,()=>finishReplay(b));},1000/speed);
}
function finishReplay(b){
 battle.ended=true;
 const won=b.outcome==='win',draw=b.outcome==='draw';if(!draw)stage.victory(won?'ally':'enemy');
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
function reset(){clearTimeout(timer);runToken++;fx.clear();stage.clear();clearSave();s=fresh(settings.rules);enemy=[];battle=null;view.clear();liveStats=[];energyView=0;chainView=0;selected=null;burstRequested=false;messages.length=0;render();startScreen();}
function prep(){battle=null;view.clear();liveStats=[];energyView=0;chainView=0;burstRequested=false;selected=null;enemy=encounter(s.round,{seed:s.seed,elite:s.elite});$('#arenaMessage').textContent='공명자를 배치하고 에코로 주력을 강화하세요';fx.clear();stage.clear();render();}
function startSolo(){mode='solo';const saved=(()=>{try{return restore(localStorage.getItem(SAVE));}catch{return null;}})();if(saved){s=saved;closeModal();prep();log('저장된 준비 단계에서 이어갑니다.');}else{s=fresh(settings.rules);enemy=[];render();startScreen();}}
function navLabels(){$('#sound').title=$('#sound').ariaLabel='사운드';$('#motion').title=$('#motion').ariaLabel='연출';$('#help').title=$('#help').ariaLabel='도움말';$('#restart').title=$('#restart').ariaLabel=multi()?'나가기':'새 원정';$('#sound').innerHTML=`${icon(fx.sound?'soundOn':'soundOff')}<span>사운드 ${fx.sound?'ON':'OFF'}</span>`;$('#motion').innerHTML=`${icon('motion')}<span>연출 ${fx.enabled?'ON':'OFF'}</span>`;$('#help').innerHTML=icon('help');$('#refresh').innerHTML=`${icon('refresh')}<span>새로고침</span> <b>2 G</b>`;$('#fullscreen').innerHTML=`${icon(document.fullscreenElement?'exitFull':'full')}<span>전체 화면</span>`;$('#fullscreen').title='전체 화면';}
// ── 타이틀 · 설정 · 도감 ─────────────────────────────────────────────
function isTitleOpen(){return !$('#title').hidden;}
function hideTitle(){$('#title').hidden=true;document.body.classList.remove('on-title');}
function showTitle(){
 const saved=hasSoloSave(),r=settings.rules,diff={easy:'쉬움',normal:'보통',hard:'어려움'}[r.difficulty];
 const faces=HEROES.filter(h=>ART.has(h.key)).slice(0,8).map(h=>portrait(h.id,'title-face')).join('');
 $('#title').innerHTML=`<div class="title-faces" aria-hidden="true">${faces}</div><div class="title-inner">${logo('logo-xl')}<p class="title-tag">WUTHERING WAVES · FAN AUTO BATTLER</p>
 <nav class="title-menu" aria-label="타이틀 메뉴">
  <button data-title="solo">${icon('solo')}<span><b>${saved?'원정 이어하기':'혼자 원정'}</b><small>${saved?'저장된 준비 단계에서 계속':`${r.rounds}구역 · 난이도 ${diff} · 3구역마다 명식`}</small></span></button>
  <button data-title="multi">${icon('arena')}<span><b>함께 대전</b><small>2~5명 · 같은 와이파이 · 잔상 토벌 → 플레이어 대전 → 명식전</small></span></button>
  <button data-title="codex">${icon('echo')}<span><b>도감</b><small>공명자 25 · 유대와 공명 편성 · 잔상과 명식</small></span></button>
  <button data-title="settings">${icon('motion')}<span><b>설정</b><small>게임 규칙 · 함께 대전 규칙 · 플레이 환경</small></span></button>
  <button data-title="help">${icon('help')}<span><b>도움말</b><small>규칙 요약</small></span></button>
 </nav><p class="title-foot">비공식 팬 프로토타입 · 수치와 조합 효과는 자체 설계</p></div>`;
 $('#title').hidden=false;document.body.classList.add('on-title');
}
function settingsModal(){
 const groups={rules:RULE_OPTIONS,room:ROOM_CHOICES,play:PLAY_CHOICES};
 modal(`<div class="eyebrow">SETTINGS</div><h2>설정</h2>${Object.entries(groups).map(([g,choices])=>`<section class="set-group"><h3>${LABELS[g].title}</h3>${Object.keys(choices).map(k=>`<div class="set-row"><span>${LABELS[g][k][0]}</span><div class="seg">${choices[k].map(v=>`<button data-set="${g}.${k}" data-val='${JSON.stringify(v)}' class="${settings[g][k]===v?'on':''}">${LABELS[g][k][1](v)}</button>`).join('')}</div></div>`).join('')}</section>`).join('')}<p class="muted set-note">원정 규칙은 다음 새 원정부터, 함께 대전 규칙은 방을 만들 때 적용됩니다(로비에서 다시 바꿀 수 있어요).</p><div class="modal-actions"><button data-set-reset>기본값으로</button><button class="primary" data-close>완료</button></div>`,'settings');
}
function codexModal(tab='heroes'){modal(`<div class="eyebrow">CODEX</div><h2>정보 도감</h2>${codexHtml(tab,{portrait,icon,elColor:EL_COLOR})}<button class="primary wide" data-close>닫기</button>`,'codex');}
function applyPlay(){speed=settings.play.speed;stage.speed=speed;$('#speed').textContent=`${speed}× 속도`;fx.sound=settings.play.sound;fx.enabled=settings.play.motion&&!matchMedia('(prefers-reduced-motion: reduce)').matches;stage.enabled=fx.enabled;document.body.classList.toggle('low-motion',!fx.enabled);navLabels();}
function help(){modal(`<div class="eyebrow">HOW TO PLAY</div><h2>조합을 완성하고, 협주를 터뜨리세요.</h2><div class="help-steps"><p><b>모집과 승급</b>같은 공명자·같은 등급 3명은 자동 승급(★★, ★★★는 9장). 새로고침은 2코인.</p><p><b>공명 체인</b>같은 공명자의 사본을 모을 때마다(★★=3장, ★★★=9장으로 계산) 체인이 열립니다. 2장 공격·체력, 3장 해방 가속, 4장 <b>변주 연계</b>(해방 직후 다음 아군이 끼어들어 공격), 5장 해방 피해, 7장 보호막·협주, 9장 <b>메아리</b>(해방 한 번 더). 팔면 다시 닫힙니다. 캐릭터를 선택하면 진행도를 볼 수 있어요.</p><p><b>배치와 유대</b>캐릭터 → 빈 칸을 눌러 이동. 다른 캐릭터를 누르면 교환합니다. 전장 윗줄이 먼저 공격받습니다. 같은 속성·역할의 서로 다른 공명자 2/3/4명으로 유대가 단계별로 강해집니다.</p><p><b>공명 편성</b>명조 파티 조합(예: 금희·절지·벨리나) 세 명을 모두 배치하면 아군 전체 보너스. 도감 › 유대·편성에서 전체 목록을 볼 수 있어요.</p><p><b>에코 장착</b>캐릭터 선택 → 에코 목록에서 장착. 교체하거나 판매하면 에코를 돌려받습니다.</p><p><b>혼자 원정</b>잔상과 싸우며 구역을 넘어갑니다. 3구역마다 명식(보스)이 나타나고, 쓰러뜨리면 그 명식의 에코가 보상 후보에 들어갑니다. 협주 100이면 전장 하단 버튼으로 총공격(설정에서 자동 가능). 깊은 잔향 경로는 정예 잔상이 추가되고 보상 +4코인. 원정 길이·난이도는 타이틀 › 설정에서.</p><p><b>함께 대전 (2~5명)</b>방장이 방을 만들고 같은 와이파이의 친구가 코드로 참가합니다. 롤토체스처럼 처음 몇 라운드는 모두 같은 잔상과 싸우고(잔상 토벌), 이후 무작위 플레이어와 대전, 정해진 주기마다 명식전이 열립니다. 잔상·명식전은 연승·연패에 포함되지 않고 이기면 코인과 에코를 얻습니다. 매 라운드 제한 시간 안에 배치 → 모두 준비 완료 또는 시간 종료 시 자동 전투. 협주 총공격은 자동 발동. 진 쪽은 체력이 깎이고 0이 되면 탈락, 마지막 1인이 승리합니다. 모집 풀은 모두가 공유하므로 같은 캐릭터를 노리는 상대를 정찰하세요(상단 플레이어 카드). <b>출전 +1</b>로 출전 인원을 늘릴 수 있습니다.</p></div><button class="primary wide" data-close>전장으로</button>`);}
$('#help').onclick=help;$('#sound').onclick=()=>{fx.sound=!fx.sound;settings.play.sound=fx.sound;saveSettings(settings);navLabels();fx.tone('heal');};$('#motion').onclick=()=>{fx.enabled=!fx.enabled;settings.play.motion=fx.enabled;saveSettings(settings);stage.enabled=fx.enabled;document.body.classList.toggle('low-motion',!fx.enabled);navLabels();};$('#speed').onclick=()=>{speed=speed===1?2:1;settings.play.speed=speed;saveSettings(settings);stage.speed=speed;$('#speed').textContent=`${speed}× 속도`;};
$('#restart').onclick=()=>{if(multi())modal('<h2>로비에서 나갈까요?</h2><p>대전 도중 나가면 탈락 처리됩니다.</p><div class="modal-actions"><button data-close>계속 플레이</button><button class="primary" data-net="leave">나가기</button></div>');else modal('<h2>새 원정을 시작할까요?</h2><p>현재 저장된 원정이 초기화됩니다.</p><div class="modal-actions"><button data-close>계속 플레이</button><button class="primary" data-reset>새 원정</button></div><div class="modal-actions"><button data-mode="menu">← 모드 선택으로</button></div>');};
$('#refresh').onclick=()=>{if(s.phase!=='prep'||s.gold<2)return;if(multi()){send('refresh').then(r=>{if(!r.error)fx.tone();});return;}s.gold-=2;s.shop=roll(s);fx.tone();render();};
$('#lock').onclick=()=>{if(s.phase!=='prep')return;if(multi()){send('lock');return;}s.locked=!s.locked;render();};
$('#levelUp').onclick=()=>{if(multi())send('level').then(r=>{if(!r.error){toast('출전 인원 +1');fx.tone('heal');}});};
$('#pendingBtn').onclick=()=>rewardModal();
// 휴대폰은 가로 전용: 전체 화면에 들어가며 가로 방향 고정을 시도합니다(지원 브라우저만).
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else{await document.documentElement.requestFullscreen({navigationUI:'hide'});await screen.orientation?.lock?.('landscape');}}catch{}navLabels();};
document.addEventListener('fullscreenchange',navLabels);
$('#sell').onclick=()=>{const u=chosen();if(!u)return;if(multi()){send('sell',{uid:u.uid});selected=null;return;}if(sell(s,u.uid)){selected=null;render();}};
$('#unequip').onclick=()=>{const u=chosen();if(s.phase!=='prep'||!u?.echo)return;if(multi()){send('unequip',{uid:u.uid});return;}unequip(s,u.uid);render();};
function upgradeNotices(list){(list||[]).forEach(msg=>{toast(msg);log(msg);fx.banner('RESONATOR UPGRADE',msg);});}
document.addEventListener('click',async ev=>{
 const el=ev.target.closest('button');if(!el||el.disabled)return;
 if(el.hasAttribute('data-close')){if(modalKind==='result')markWatched();closeModal();return;}
 if(el.hasAttribute('data-reset')){reset();return;}
 if(el.dataset.mode){if(el.dataset.mode==='solo')startSolo();else if(el.dataset.mode==='multi')netScreen();else{clearTimeout(timer);runToken++;fx.clear();stage.clear();closeModal();s=fresh(settings.rules);enemy=[];battle=null;render();showTitle();}return;}
 if(el.dataset.net){const a=el.dataset.net;
  if(a==='back'){closeModal();showTitle();return;}
  if(a==='create'||a==='join'){const name=nickValue();if(!name)return;const code=($('#joinCode')?.value||'').trim().toUpperCase();if(a==='join'&&code.length!==4){toast('4자리 방 코드를 입력해 주세요.');$('#joinCode')?.focus();return;}el.disabled=true;const r=await post(`/api/${a}`,a==='join'?{name,code}:{name,settings:settings.room});el.disabled=false;if(r.error){toast(r.error);return;}clearTimeout(timer);runToken++;connect(r.code,r.token,r.id);return;}
  if(a==='copy'){try{await navigator.clipboard.writeText(room().code);toast('방 코드를 복사했어요.');}catch{toast(`방 코드: ${room().code}`);}return;}
  if(a==='bot'){send('addBot');return;}if(a==='start'){send('start');return;}if(a==='lobby'){send('lobby');return;}
  if(a==='leave'){await send('leave');leaveToMenu();return;}
  if(a==='watched'){markWatched();return;}
  return;}
 if(el.dataset.kick){send('kick',{id:el.dataset.kick});return;}
 if(el.dataset.room){const v=+el.dataset.val;settings.room[el.dataset.room]=v;saveSettings(settings);send('settings',{[el.dataset.room]:v});return;}
 if(el.dataset.title){const t=el.dataset.title;if(t==='solo'){hideTitle();startSolo();}else if(t==='multi'){hideTitle();netScreen();}else if(t==='codex')codexModal();else if(t==='settings')settingsModal();else if(t==='help')help();return;}
 if(el.dataset.codex){codexModal(el.dataset.codex);return;}
 if(el.dataset.set){const [g,k]=el.dataset.set.split('.');settings[g][k]=JSON.parse(el.dataset.val);saveSettings(settings);settings=loadSettings();applyPlay();settingsModal();if(g==='rules'&&isTitleOpen())showTitle();return;}
 if(el.hasAttribute('data-set-reset')){settings=resetSettings();saveSettings(settings);applyPlay();settingsModal();return;}
 if(el.dataset.scout){scout(el.dataset.scout);return;}
 if(el.dataset.pick){const r=await send('pick',{i:+el.dataset.pick});if(!r.error){toast(r.type==='augment'?'공명 변주 적용':'에코 획득');setTimeout(()=>{if(s.pending?.length)rewardModal();else if(modalKind==='reward')closeModal();},60);}return;}
 if(el.dataset.starter){if(multi()){const r=await send('starter',{id:el.dataset.starter});if(!r.error&&room()?.phase==='starter')waitingStarter();return;}if(chooseStarter(s,el.dataset.starter)){closeModal();prep();log(`${STARTERS.find(k=>k.id===s.starter).title} · 탐사 시작`);}return;}
 if(el.hasAttribute('data-buy')){if(multi()){const r=await send('buy',{i:+el.dataset.buy});if(!r.error){fx.tone('heal');upgradeNotices(r.notices);}return;}const result=buy(s,+el.dataset.buy);if(result.error)toast(result.error);else{fx.tone('heal');upgradeNotices(result.notices);}render();return;}
 if(el.hasAttribute('data-equip')){const u=chosen();if(!u)return;if(multi()){const r=await send('equip',{uid:u.uid,i:+el.dataset.equip});if(!r.error)toast('에코 장착 완료');return;}if(equip(s,u.uid,+el.dataset.equip)){toast('에코 장착 완료');render();}return;}
 if(el.dataset.area&&el.dataset.area!=='enemy'&&s.phase==='prep'){const dest={area:el.dataset.area,i:+el.dataset.i};
  if(selected){if(selected.area===dest.area&&selected.i===dest.i)selected=null;else if(multi()){const from=selected;selected=null;render();send('move',{from,to:dest});return;}else if(move(s,selected,dest))selected=null;else toast(`출전 인원은 최대 ${capacity(s)}명입니다.`);}
  else if(s[dest.area][dest.i])selected=dest;render();if(selected&&matchMedia('(min-width:1101px)').matches)$('#detail').scrollIntoView({block:'nearest',behavior:'smooth'});return;}
});
function playEvents(events,done){const token=runToken;let index=0;function next(){if(token!==runToken||s.phase!=='battle')return;const e=events[index++];if(!e){done();return;}view=new Map(e.states.map(f=>[f.uid,f]));liveStats=e.stats;energyView=e.energy;chainView=liveStats.reduce((n,f)=>n+f.extras,0);renderBattle();stage.sync(e.states);let wait=(fx.enabled?160:70)/speed;if(e.kind==='skill'){const a=battle.fighters.find(f=>f.uid===e.from),h=unitInfo(a.id);stage.cast(a.uid,h.color);log(`${a.side==='ally'?'✦':'·'} ${h.name} · ${e.name}`);$('#arenaMessage').textContent=`${h.name} · ${e.name}`;if(a.side==='ally'&&!isEnemy(a.id)&&fx.cutin(h,e.name))wait=430/speed;else if(h.kind==='overlord'){fx.banner('OVERLORD',`${h.name} · ${e.name}`);fx.tone('ult');wait=520/speed;}}else if(e.kind==='burst'){const mine=!e.side||e.side==='ally';stage.rally(mine?'ally':'enemy');fx.banner(mine?'RESONANCE CHAIN':'RIVAL CHAIN',mine?'협주 총공격 · 전원 해방 충전':'상대의 협주 총공격!');fx.tone('ult');wait=650/speed;}else if(e.kind==='intro'){const a=battle.fighters.find(f=>f.uid===e.from);stage.intro(e.from,e.to,unitInfo(a.id).color);if(a.side==='ally')$('#arenaMessage').textContent=`${unitInfo(a.id).name} · 변주 입장`;}else if(e.kind!=='sync'){const a=battle.fighters.find(f=>f.uid===e.from);fx.hit(e,unitInfo(a.id).color);stage.number(e);if(e.kind==='heal')stage.heal(e.to);else stage.strike(e.from,e.to,e.kind,unitInfo(a.id).color);if(['coop','extra'].includes(e.kind)&&a.side==='ally')fx.combo(chainView);if(e.kind==='ult')wait=(fx.enabled?260:130)/speed;}timer=setTimeout(next,wait);}next();}
function afterEvents(){if(battle.ended){stage.victory(battle.winner);fx.banner(battle.winner==='ally'?'VICTORY':'DEFEAT',battle.winner==='ally'?'잔향 제압 · 다음 구역 개방':'공명 재편성');timer=setTimeout(finish,1050/speed);return;}if((burstRequested||settings.play.autoBurst)&&battle.energy>=100){burstRequested=false;playEvents(burst(battle),afterEvents);return;}burstRequested=false;timer=setTimeout(tick,260/speed);}
function tick(){if(s.phase==='battle')playEvents(step(battle),afterEvents);}
$('#fight').onclick=()=>{
 if(multi()){const me=mePublic();if(room()?.phase==='prep'&&me?.alive)send('ready',{value:!me.ready});return;}
 if(s.phase!=='prep'||!s.board.some(Boolean))return;save();s.phase='battle';selected=null;battle=makeBattle(s,enemy);view=new Map(battle.fighters.map(f=>[f.uid,{...f}]));energyView=battle.energy;runToken++;$('#arenaMessage').textContent='자동 전투 중 · 협주 100이 되면 총공격 버튼';render();stage.mount(battle.fighters,{phantom:true});fx.banner(s.round%3===0?'CALAMITY SIGNAL':'COMBAT START',s.round%3===0?'재해급 잔상 출현':'공명 동기화 · 전투 개시');log(`${s.round}구역 · 전투 개시`);timer=setTimeout(tick,1000/speed);};
$('#resonance').onclick=()=>{if(multi()||s.phase!=='battle'||energyView<100||battle.ended||burstRequested)return;burstRequested=true;$('#resonance').disabled=true;$('#resonance').classList.remove('ready');$('#arenaMessage').textContent='협주 총공격 대기 · 현재 행동 후 발동';};
function finish(){const result=settle(s,battle);if(!result)return;clearSave();render();const list=battle.fighters.filter(f=>f.side==='ally').sort((a,b)=>b.damage-a.damage),total=list.reduce((n,f)=>n+f.damage,0);modal(`<div class="eyebrow">${result.ended?'EXPEDITION COMPLETE':`SECTOR ${s.round} CLEAR`}</div><h2>${result.ended?(s.life<=0?'공명이 잠들었습니다.':result.won?`${s.rules.rounds}구역 원정을 완주했습니다.`:'마지막 명식을 넘지 못했습니다.'):(result.won?(result.boss?`명식 · ${result.boss.name} 처치`:'공명이 이어집니다.'):'조합을 다시 다듬을 시간.')}</h2><p>${result.won?'승리':'패배'} · 보상 +${result.income}코인 · ${s.wins}승 / ${s.round}전</p><div class="result-stat"><span>누적 피해<b>${Math.round(total).toLocaleString()}</b></span><span>협동·추격<b>${chainView}회</b></span><span>협주 총공격<b>${battle.bursts}회</b></span></div><div class="damage-chart">${list.map(f=>`<div>${portrait(f.id)}<span>${HEROES[f.id].name}<i style="width:${f.damage/Math.max(total,1)*100}%"></i></span><b>${Math.round(f.damage)}</b></div>`).join('')}</div><button class="primary wide" id="continue">${result.ended?'새로운 공명 선택 ↗':'보상 선택 ↗'}</button>`,'solo-flow');$('#continue').onclick=()=>{if(result.ended)reset();else{s.phase='reward';const boss=result.won?result.boss:null;if(s.round%3===0)augmentReward(boss);else echoReward(boss);}};}
function randomThree(list){const copy=list.slice();for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy.slice(0,3);}
function augmentReward(boss=null){const choices=randomThree(AUGMENTS.filter(a=>!s.augments.includes(a.id)));modal(`<div class="eyebrow">RESONANCE VARIATION</div><h2>조합의 규칙을 바꾸세요.</h2><div class="augment-choices">${choices.map(a=>`<button data-augment="${a.id}"><span>${a.icon}</span><h3>${a.name}</h3><p>${a.desc}</p><small>원정 전체에 적용 ↗</small></button>`).join('')}</div>`,'solo-flow');document.querySelectorAll('[data-augment]').forEach(el=>el.onclick=()=>{if(s.phase!=='reward')return;s.augments.push(el.dataset.augment);if(el.dataset.augment==='wealth')s.gold+=8;echoReward(boss);});}
function echoReward(boss=null){const choices=randomThree(ECHOS);const bossEcho=boss?.echo&&ECHOS.find(e=>e.id===boss.echo);if(bossEcho&&!choices.includes(bossEcho))choices[0]=bossEcho;modal(`<div class="eyebrow">ECHO CAPTURE</div><h2>다음 주력을 완성할 에코.</h2><p>에코는 가방에 보관됩니다. 준비 단계에서 캐릭터를 선택해 장착하세요.</p><div class="augment-choices">${choices.map(e=>`<button data-echo="${e.id}" class="${e===bossEcho?'boss-echo':''}"><span>${e.icon}</span><h3>${e.name}</h3><p>${e.desc}</p><small>${e===bossEcho?`명식 ${boss.name}의 에코 ↗`:'에코 획득 ↗'}</small></button>`).join('')}</div>`,'solo-flow');document.querySelectorAll('[data-echo]').forEach(el=>el.onclick=()=>{s.inventory.push(el.dataset.echo);routeReward();});}
function routeReward(){const boss=(s.round+1)%3===0;modal(`<div class="eyebrow">NEXT SECTOR</div><h2>${boss?'재해급 신호가 감지됐습니다.':'다음 경로를 선택하세요.'}</h2><div class="route-choices"><button data-route="normal"><b>${boss?`${icon('boss')}재해급 잔상`:`${icon('path')}안정된 잔향`}</b><p>${boss?'보스 구역에 진입합니다. 팀과 에코를 점검하세요.':'기본 난이도 · 코인을 모으며 덱을 완성하세요.'}</p><small>준비 단계로 ↗</small></button>${boss?'':`<button data-route="elite"><b>${icon('blade')}깊은 잔향</b><p>적 체력 +25%, 공격 +16%.<br>승리 보상 +4코인.</p><small>정예 도전 ↗</small></button>`}</div>`,'solo-flow');document.querySelectorAll('[data-route]').forEach(el=>el.onclick=()=>{if(advance(s,el.dataset.route==='elite')){closeModal();prep();}});}
$('#modal').addEventListener('cancel',ev=>{if(LOCKED_MODALS.has(modalKind))ev.preventDefault();else if(modalKind==='result')markWatched();});
$('#modal').addEventListener('close',()=>{if(!LOCKED_MODALS.has(modalKind))modalKind=null;});

// ── boot ────────────────────────────────────────────────────────────
document.querySelector('.brand').innerHTML=logo();document.querySelector('link[rel=icon]').href=FAVICON;
document.body.classList.toggle('low-motion',!fx.enabled);stage.enabled=fx.enabled;navLabels();
(async()=>{
 try{const files=await fetch('/api/art').then(r=>r.ok?r.json():[]);for(const f of files)ART.set(f.replace(/\.[^.]+$/,''),f);}catch{}
 let session=null;try{session=JSON.parse(sessionStorage.getItem(NET)||'null');}catch{}
 if(session?.code&&session?.token){connect(session.code,session.token,session.id);return;}
 const saved=(()=>{try{return restore(localStorage.getItem(SAVE));}catch{return null;}})();
 if(saved){s=saved;prep();log('저장된 준비 단계에서 이어갑니다.');}else{render();showTitle();}
})();

// Multiplayer room rules (TFT-style lobby). Pure game logic: no HTTP here, so tests can drive it directly.
import {HEROES,STARTERS,ECHOS,AUGMENTS,fresh,unit,chooseStarter,capacity,levelUp,levelCost,makePool,rollPool,buy,move,equip,unequip,sell,merge,traits,runDuel,runPve,encounter,bossFor,duelDamage,multiIncome,MAX_CAPACITY} from './engine.js';

export const MAX_PLAYERS=5;
export const START_LIFE=100;
// 방장이 로비에서 고르는 규칙. opening: 처음 N라운드는 잔상 토벌, pveEvery: N라운드마다 명식전(0이면 없음).
export const ROOM_OPTIONS={prepSeconds:[25,40,60],startLife:[60,100,150],pveEvery:[0,4,5,6],opening:[0,1,2,3],maxPlayers:[2,3,4,5]};
const STARTER_SECONDS=25;
const BOT_NAMES=['잔향 봇 · 알파','잔향 봇 · 베타','잔향 봇 · 감마','잔향 봇 · 델타','잔향 봇 · 엡실론','잔향 봇 · 제타','잔향 봇 · 에타'];
const token=()=>Array.from({length:24},()=>'abcdefghijkmnpqrstuvwxyz23456789'[Math.floor(Math.random()*32)]).join('');
export const cleanName=n=>String(n??'').replace(/[\u0000-\u001f<>&"'`]/g,'').trim().slice(0,12);

function shuffle(list,rng){const a=list.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function pickThree(list,rng){return shuffle(list,rng).slice(0,3).map(x=>x.id);}
const snapshotBoard=board=>board.map(u=>u?{uid:u.uid,id:u.id,star:u.star,echo:u.echo}:null);
// Turn a battle event into the viewpoint of the player who fought on the "enemy" side.
function flipEvent(e){const out={...e,energy:e.foeEnergy??0,foeEnergy:e.energy,stats:e.foeStats??[],foeStats:e.stats};if(e.side)out.side=e.side==='ally'?'enemy':'ally';return out;}
// Battle replays are delta-encoded: each event carries only the fighter states and stats that changed.
// The client rebuilds full snapshots with expandEvents() in app.js.
function compactEvents(events){
 const lastState=new Map(),lastStat=new Map();let lastEnergy=null;
 return events.map(e=>{
  const out={};for(const k of ['from','to','kind','amount','kill','name','side'])if(e[k]!==undefined&&e[k]!==false)out[k]=e[k];
  const en=Math.floor(e.energy);if(en!==lastEnergy){out.en=en;lastEnergy=en;}
  const st=[];for(const f of e.states){const row=[f.uid,Math.round(f.hp),Math.round(f.shield),f.mana,f.charge];const key=row.join();if(lastState.get(f.uid)!==key){lastState.set(f.uid,key);st.push(row);}}if(st.length)out.st=st;
  const sa=[];for(const f of e.stats){const row=[f.uid,f.id,Math.round(f.damage),Math.round(f.healed),f.extras];const key=row.join();if(lastStat.get(f.uid)!==key){lastStat.set(f.uid,key);sa.push(row);}}if(sa.length)out.sa=sa;
  return out;
 });
}
// Rough replay length, mirroring the client's playback pacing at 1× speed.
function replayMs(events){let ms=2200;for(const e of events)ms+=e.kind==='burst'?650:e.kind==='skill'?260:e.kind==='ult'?130:e.kind==='sync'?0:70;return ms;}

export class Room{
 constructor(code,{rng=Math.random,now=()=>Date.now(),manual=false,prepSeconds=40,startLife=START_LIFE,pveEvery=5,opening=2,maxPlayers=MAX_PLAYERS}={}){
  Object.assign(this,{code,rng,now,manual,prepSeconds,startLife,pveEvery,opening,maxPlayers,seed:Math.floor(rng()*1e9),players:[],phase:'lobby',round:0,pool:makePool(),deadline:null,timer:null,hostId:null,feed:[],battleSeq:0,listeners:new Set(),version:0,createdAt:now(),lastActive:now()});
 }
 // ── membership ──
 addPlayer(name,{bot=false}={}){
  if(this.phase!=='lobby')return {error:'이미 대전이 시작된 방입니다.'};
  if(this.players.length>=this.maxPlayers)return {error:`방 인원은 최대 ${this.maxPlayers}명입니다.`};
  name=cleanName(name)||(bot?'봇':'공명자');
  if(this.players.some(p=>p.name===name))name=(name.slice(0,10)+' '+(this.players.length+1)).trim();
  const p={id:'p'+(this.players.length+1)+Math.floor(this.rng()*1e6).toString(36),token:token(),name,bot,s:null,alive:true,place:null,ready:false,connected:bot,lastOpp:null,lastWon:false,battle:null,watched:false,pickedStarter:false,lastDamage:0};
  this.players.push(p);if(!bot&&!this.hostId)this.hostId=p.id;this.touch();return {player:p};
 }
 addBot(byId){if(byId!==this.hostId)return {error:'방장만 봇을 추가할 수 있어요.'};const used=new Set(this.players.map(p=>p.name));return this.addPlayer(BOT_NAMES.find(n=>!used.has(n))||'잔향 봇',{bot:true});}
 removePlayer(id,byId=id){
  const p=this.players.find(p=>p.id===id);if(!p)return {error:'플레이어를 찾을 수 없어요.'};
  if(byId!==id&&byId!==this.hostId)return {error:'방장만 내보낼 수 있어요.'};
  if(this.phase==='lobby'||this.phase==='over'){this.players=this.players.filter(x=>x!==p);}
  else{// leaving mid-game counts as elimination
   p.connected=false;p.left=true;if(p.alive){p.s.life=0;this.eliminate([p]);}
  }
  if(this.hostId===id)this.hostId=this.players.find(x=>!x.bot&&!x.left)?.id??null;
  this.checkOver();this.touch();return {ok:true};
 }
 setSettings(byId,opts={}){if(byId!==this.hostId||this.phase!=='lobby')return {error:'방장만 로비에서 변경할 수 있어요.'};
  for(const [k,list] of Object.entries(ROOM_OPTIONS)){const v=Number(opts[k]);if(opts[k]===undefined||!list.includes(v))continue;if(k==='maxPlayers'&&v<this.players.length)continue;this[k]=v;}
  this.touch();return {ok:true};}
 // 라운드 종류: 'tacet'(잔상 토벌) · 'overlord'(명식전) · 'pvp'
 roundKind(r=this.round){if(r<=this.opening)return 'tacet';if(this.pveEvery&&r%this.pveEvery===0)return 'overlord';return 'pvp';}
 // ── flow ──
 start(byId){
  if(byId!==this.hostId)return {error:'방장만 시작할 수 있어요.'};
  if(!['lobby','over'].includes(this.phase))return {error:'이미 진행 중입니다.'};
  if(this.players.length<2)return {error:'2명 이상 모이면 시작할 수 있어요. 봇을 추가해 보세요.'};
  this.players=this.players.filter(p=>!p.left);
  this.pool=makePool();this.round=0;this.feed=[];this.seed=Math.floor(this.rng()*1e9);
  for(const p of this.players){Object.assign(p,{s:{...fresh(),life:this.startLife,phase:'starter',streak:0,pending:[]},alive:true,place:null,ready:false,battle:null,lastOpp:null,lastWon:false,pickedStarter:false,lastDamage:0});}
  this.phase='starter';this.setDeadline(STARTER_SECONDS);
  for(const p of this.players)if(p.bot)this.pickStarter(p,STARTERS[Math.floor(this.rng()*STARTERS.length)].id);
  this.touch();return {ok:true};
 }
 pickStarter(p,id){
  if(this.phase!=='starter'||p.pickedStarter)return {error:'이미 시작 팀을 골랐어요.'};
  const kit=STARTERS.find(k=>k.id===id);if(!kit)return {error:'알 수 없는 시작 팀입니다.'};
  if(kit.units.some(h=>this.pool[h]<=0))return {error:'풀에 남은 공명자가 부족해요.'};
  chooseStarter(p.s,id);for(const h of kit.units)this.pool[h]--;
  p.s.phase='starter';p.pickedStarter=true;this.touch();
  if(this.players.every(x=>x.pickedStarter))this.beginPrep();
  return {ok:true};
 }
 beginPrep(){
  this.round++;this.phase='prep';
  for(const p of this.players){
   if(!p.pickedStarter){const kit=shuffle(STARTERS,this.rng).find(k=>k.units.every(h=>this.pool[h]>0))||STARTERS[0];this.pickStarterSilently(p,kit.id);}
   p.battle=null;p.watched=false;p.ready=false;
   if(!p.alive)continue;
   const s=p.s;s.round=this.round;s.phase='prep';
   if(this.round>1){
    s.gold+=multiIncome(s,p.lastWon);
    if(!s.locked)s.shop=rollPool(this.pool,this.round,this.rng);
    if((this.round-1)%3===0){const left=AUGMENTS.filter(a=>!s.augments.includes(a.id));if(left.length)s.pending.push({type:'augment',choices:pickThree(left,this.rng)});}
    s.pending.push({type:'echo',choices:pickThree(ECHOS,this.rng)});
   }
  }
  for(const p of this.players)if(p.bot&&p.alive)this.botTurn(p);
  this.setDeadline(this.round===1?Math.max(this.prepSeconds,30):this.prepSeconds);this.touch();
 }
 pickStarterSilently(p,id){p.s.phase='starter';chooseStarter(p.s,id);for(const h of STARTERS.find(k=>k.id===id).units)this.pool[h]=Math.max(0,this.pool[h]-1);p.pickedStarter=true;}
 beginBattle(){
  if(this.phase!=='prep')return;
  const alive=this.players.filter(p=>p.alive);
  for(const p of alive){while(p.s.pending.length)this.resolvePending(p,0);p.s.phase='battle';p.ready=false;p.watched=p.bot||!p.connected;}
  const kind=this.roundKind();
  if(kind!=='pvp'){const seq=++this.battleSeq;let longest=0;this.pendingResults=[];for(const p of alive)longest=Math.max(longest,this.fightPve(p,kind,seq));this.phase='battle';this.setDeadline(Math.min(95,Math.ceil(longest/1000)+4));this.touch();return;}
  // Pairing: shuffle a few times and keep the order with the fewest rematches.
  let best=null,bestScore=Infinity;
  for(let k=0;k<12;k++){const order=shuffle(alive,this.rng);let score=0;for(let i=0;i+1<order.length;i+=2)if(order[i].lastOpp===order[i+1].id||order[i+1].lastOpp===order[i].id)score++;if(score<bestScore){best=order;bestScore=score;}if(!score)break;}
  const seq=++this.battleSeq;let longest=0;this.pendingResults=[];
  for(let i=0;i<best.length;i+=2){
   const a=best[i],o=best[i+1];
   if(o){longest=Math.max(longest,this.fight(a,o,false,seq));}
   else{const host=shuffle(alive.filter(x=>x!==a),this.rng)[0];longest=Math.max(longest,this.fight(a,host,true,seq));}
  }
  this.phase='battle';this.setDeadline(Math.min(95,Math.ceil(longest/1000)+4));this.touch();
 }
 fight(a,o,ghost,seq){
  const {b,events}=runDuel(a.s,o.s,this.rng);
  const outcomeA=b.winner==='ally'?'win':b.winner==='draw'?'draw':'lose',outcomeO=ghost?null:(b.winner==='enemy'?'win':b.winner==='draw'?'draw':'lose');
  const dmgA=outcomeA==='win'?0:duelDamage(b,'ally',this.round),dmgO=ghost||outcomeO==='win'?0:duelDamage(b,'enemy',this.round);
  const fighters=b.fighters.map(f=>({uid:f.uid,id:f.id,star:f.star,side:f.side,max:f.max,threshold:f.threshold,echo:f.echo}));
  const totals=side=>Math.round(b.fighters.filter(f=>f.side===side).reduce((n,f)=>n+f.damage,0));
  const payload=(me,opp,side)=>({seq,round:this.round,ghost,opponent:{id:opp.id,name:opp.name},enemyBoard:snapshotBoard((side==='ally'?o:a).s.board),fighters:side==='ally'?fighters:fighters.map(f=>({...f,side:f.side==='ally'?'enemy':'ally'})),events:compactEvents(side==='ally'?events:events.map(flipEvent)),outcome:side==='ally'?outcomeA:outcomeO,damageTaken:side==='ally'?dmgA:dmgO,dealt:side==='ally'?totals('ally'):totals('enemy'),received:side==='ally'?totals('enemy'):totals('ally')});
  a.battle=payload(a,o,'ally');a.lastOpp=o.id;
  this.pendingResults.push({p:a,outcome:outcomeA,dmg:dmgA});
  if(!ghost){o.battle=payload(o,a,'enemy');o.lastOpp=a.id;this.pendingResults.push({p:o,outcome:outcomeO,dmg:dmgO});}
  this.feed.unshift({round:this.round,a:a.name,o:o.name+(ghost?' (잔상)':''),winner:outcomeA==='win'?a.name:outcomeA==='draw'?null:o.name+(ghost?' (잔상)':''),dmg:Math.max(dmgA,dmgO)});this.feed.splice(16);
  return replayMs(events);
 }
// 잔상·명식 전투: 모든 생존자가 각자 같은 적 편성과 싸운다. 패배하면 생존력 감소, 승리하면 코인과 에코 보상.
 fightPve(p,kind,seq){
  const boss=kind==='overlord',bossInfo=boss?bossFor(this.round,{seed:this.seed,every:this.pveEvery||3}):null;
  const enemy=encounter(this.round,{seed:this.seed,boss,every:this.pveEvery||3}),{b,events}=runPve(p.s,enemy,this.rng);
  const outcome=b.winner==='ally'?'win':'lose',alive=b.fighters.filter(f=>f.side==='enemy'&&f.hp>0).length,dmg=outcome==='win'?0:2+Math.floor(this.round/4)+alive*(boss?2:1);
  const fighters=b.fighters.map(f=>({uid:f.uid,id:f.id,star:f.star,side:f.side,max:f.max,threshold:f.threshold,echo:f.echo}));
  const totals=side=>Math.round(b.fighters.filter(f=>f.side===side).reduce((n,f)=>n+f.damage,0));
  const name=boss?`명식 · ${bossInfo.name}`:'잔상 무리';
  p.battle={seq,round:this.round,ghost:false,pve:kind,opponent:{id:'pve',name},enemyBoard:snapshotBoard(enemy),fighters,events:compactEvents(events),outcome,damageTaken:dmg,dealt:totals('ally'),received:totals('enemy')};
  this.pendingResults.push({p,outcome,dmg,pve:kind,boss:bossInfo});
  this.feed.unshift({round:this.round,a:p.name,o:name,winner:outcome==='win'?p.name:name,dmg});this.feed.splice(16);
  return replayMs(events);
 }
 endBattle(){
  if(this.phase!=='battle')return;
  const fallen=[];
  for(const r of this.pendingResults||[]){const {p,outcome,dmg}=r;
   if(!p.alive)continue;
   p.lastDamage=dmg;
   if(r.pve){// PvE는 연승/연패에 포함하지 않고 보상을 준다(명식은 그 명식의 에코를 반드시 후보에 포함)
    p.lastWon=false;if(outcome==='win'){p.s.wins++;p.s.gold+=r.boss?3:2;const pool=ECHOS.map(e=>e.id).filter(id=>id!==r.boss?.echo);const choices=r.boss?.echo?[r.boss.echo,...pickThree(pool.map(id=>({id})),this.rng).slice(0,2)]:pickThree(ECHOS,this.rng);p.s.pending.push({type:'echo',choices,from:r.boss?.name||'잔상'});}
   }else{
   p.lastWon=outcome==='win';
   p.s.streak=outcome==='win'?Math.max(0,p.s.streak||0)+1:outcome==='lose'?Math.min(0,p.s.streak||0)-1:0;
   if(outcome==='win')p.s.wins++;}
   p.s.life=Math.max(0,p.s.life-dmg);if(p.s.life<=0)fallen.push(p);
  }
  this.pendingResults=[];this.eliminate(fallen);
  if(!this.checkOver())this.beginPrep();else this.touch();
 }
 eliminate(list){
  if(!list.length)return;
  const aliveBefore=this.players.filter(p=>p.alive).length;
  // Lower life (more overkill) places worse when several fall in the same round.
  list.sort((x,y)=>x.s.life-y.s.life||(x.lastDamage>y.lastDamage?-1:1));
  list.forEach((p,i)=>{p.alive=false;p.place=aliveBefore-i;p.s.phase='out';for(const u of [...p.s.board,...p.s.bench])if(u)this.pool[u.id]+=3**(u.star-1);});
  this.feed.unshift({round:this.round,out:list.map(p=>p.name)});
 }
 checkOver(){
  if(['lobby','over'].includes(this.phase))return this.phase==='over';
  const alive=this.players.filter(p=>p.alive);
  if(alive.length<=1){if(alive[0]){alive[0].place=1;alive[0].s.phase='out';}this.phase='over';this.clearTimer();this.deadline=null;return true;}
  return false;
 }
 backToLobby(byId){if(byId!==this.hostId||this.phase!=='over')return {error:'대전이 끝난 뒤 방장이 로비로 돌아갈 수 있어요.'};this.players=this.players.filter(p=>!p.left);this.phase='lobby';this.round=0;for(const p of this.players){p.s=null;p.place=null;p.alive=true;p.battle=null;}this.touch();return {ok:true};}
 // ── per-player actions ──
 resolvePending(p,index){const r=p.s.pending[0];if(!r)return {error:'선택할 보상이 없어요.'};const id=r.choices[index];if(id===undefined)return {error:'잘못된 선택입니다.'};p.s.pending.shift();if(r.type==='augment'){p.s.augments.push(id);if(id==='wealth')p.s.gold+=8;}else p.s.inventory.push(id);return {ok:true,type:r.type,id};}
 act(p,msg){
  if(!p)return {error:'플레이어를 찾을 수 없어요.'};
  this.lastActive=this.now();
  const t=msg?.type;
  if(t==='leave')return this.removePlayer(p.id);
  if(t==='addBot')return this.addBot(p.id);
  if(t==='kick')return this.removePlayer(String(msg.id),p.id);
  if(t==='settings')return this.setSettings(p.id,msg);
  if(t==='start')return this.start(p.id);
  if(t==='lobby')return this.backToLobby(p.id);
  if(t==='starter'){const r=this.pickStarter(p,String(msg.id));return r;}
  if(t==='watched'){if(this.phase==='battle'&&msg.seq===this.battleSeq){p.watched=true;this.touch();this.maybeEndBattle();}return {ok:true};}
  if(!p.alive||this.phase!=='prep')return {error:'준비 단계에서만 할 수 있어요.'};
  const s=p.s;let out={ok:true};
  switch(t){
   case 'buy':out=buy(s,msg.i|0,this.pool);break;
   case 'move':if(!move(s,{area:msg.from?.area,i:msg.from?.i},{area:msg.to?.area,i:msg.to?.i}))out={error:`출전 인원은 최대 ${capacity(s)}명입니다.`};break;
   case 'sell':if(!sell(s,msg.uid,this.pool))out={error:'판매할 수 없어요.'};break;
   case 'equip':if(!equip(s,msg.uid,msg.i|0))out={error:'장착할 수 없어요.'};break;
   case 'unequip':if(!unequip(s,msg.uid))out={error:'회수할 에코가 없어요.'};break;
   case 'refresh':if(s.gold<2)out={error:'셸 코인이 부족해요.'};else{s.gold-=2;s.shop=rollPool(this.pool,this.round,this.rng);}break;
   case 'lock':s.locked=!s.locked;break;
   case 'level':out=levelUp(s);break;
   case 'pick':out=this.resolvePending(p,msg.i|0);break;
   case 'ready':p.ready=!!msg.value;break;
   default:out={error:'알 수 없는 행동입니다.'};
  }
  this.touch();
  if(t==='ready')this.maybeStartBattle();
  return out;
 }
 maybeStartBattle(){if(this.phase==='prep'&&this.players.filter(p=>p.alive&&!p.bot&&p.connected).every(p=>p.ready))this.beginBattle();}
 maybeEndBattle(){if(this.phase==='battle'&&this.players.filter(p=>p.alive&&!p.bot&&p.connected).every(p=>p.watched))this.endBattle();}
 setConnected(p,on){p.connected=on;this.touch();if(!on){this.maybeStartBattle();this.maybeEndBattle();}}
 // ── bots ──
 botTurn(p){
  const s=p.s,rng=this.rng;
  while(s.pending.length){const r=s.pending[0];this.resolvePending(p,Math.floor(rng()*r.choices.length));}
  const owned=()=>[...s.board,...s.bench].filter(Boolean);
  const boardTraits=()=>traits(s.board);
  const score=id=>{const h=HEROES[id],copies=owned().filter(u=>u.id===id).length,t=boardTraits();return copies*3+((t[h.origin]||0)===1?2:0)+((t[h.role]||0)===1?1.5:0)+h.cost*.6+rng();};
  if(s.gold>=levelCost(s)+12&&capacity(s)<MAX_CAPACITY&&this.round>=3)levelUp(s);
  for(let rolls=0;rolls<3;rolls++){
   let bought=true;
   while(bought){bought=false;const options=s.shop.map((id,i)=>({id,i})).filter(x=>x.id!==null&&HEROES[x.id].cost<=s.gold-(this.round>=4?6:0)&&this.pool[x.id]>0).sort((x,y)=>score(y.id)-score(x.id));
    if(options.length&&s.bench.includes(null)){buy(s,options[0].i,this.pool);bought=true;}
    else if(!s.bench.includes(null)){const weakest=s.bench.filter(Boolean).sort((x,y)=>x.star*HEROES[x.id].cost-y.star*HEROES[y.id].cost)[0];if(weakest&&options.length){sell(s,weakest.uid,this.pool);bought=true;}}}
   if(s.gold>=14){s.gold-=2;s.shop=rollPool(this.pool,this.round,rng);}else break;
  }
  // Field the strongest units, front row first.
  const ranked=owned().sort((x,y)=>y.star*3+HEROES[y.id].cost-(x.star*3+HEROES[x.id].cost));
  const team=ranked.slice(0,capacity(s)),rest=ranked.slice(capacity(s));
  s.board=Array(12).fill(null);s.bench=Array(8).fill(null);
  const tanky=team.slice().sort((x,y)=>HEROES[y.id].hp-HEROES[x.id].hp);
  const slots=[1,2,3,4,0,5,7,8,9,10,6,11];tanky.forEach((u,i)=>s.board[slots[i]]=u);
  rest.slice(0,8).forEach((u,i)=>s.bench[i]=u);
  for(const u of rest.slice(8)){this.pool[u.id]+=3**(u.star-1);if(u.echo)s.inventory.push(u.echo);}
  merge(s);
  for(const u of team)if(!u.echo&&s.inventory.length)u.echo=s.inventory.shift();
  p.ready=true;
 }
 // ── timers & views ──
 setDeadline(seconds){this.clearTimer();this.deadline=this.now()+seconds*1000;if(!this.manual)this.timer=setTimeout(()=>this.onDeadline(),seconds*1000+120);}
 clearTimer(){if(this.timer)clearTimeout(this.timer);this.timer=null;}
 onDeadline(){this.timer=null;if(this.phase==='starter')this.beginPrep();else if(this.phase==='prep')this.beginBattle();else if(this.phase==='battle')this.endBattle();}
 touch(){this.version++;this.lastActive=this.now();for(const fn of this.listeners)try{fn();}catch{}}
 publicView(){
  const nextKind=this.roundKind(this.phase==='lobby'||this.phase==='starter'?1:this.round);
  return {code:this.code,phase:this.phase,round:this.round,deadline:this.deadline,serverNow:this.now(),hostId:this.hostId,prepSeconds:this.prepSeconds,startLife:this.startLife,pveEvery:this.pveEvery,opening:this.opening,maxPlayers:this.maxPlayers,roundKind:nextKind,boss:nextKind==='overlord'?bossFor(this.round,{seed:this.seed,every:this.pveEvery||3}).name:null,battleSeq:this.battleSeq,
   players:this.players.map(p=>({id:p.id,name:p.name,bot:p.bot,connected:p.connected,ready:p.ready,alive:p.alive,place:p.place,left:!!p.left,life:p.s?.life??this.startLife,level:p.s?capacity(p.s):3,streak:p.s?.streak||0,lastDamage:p.lastDamage,lastWon:p.lastWon,board:p.s?snapshotBoard(p.s.board):[],augments:p.s?.augments||[],starter:p.s?.starter||null,picked:p.pickedStarter})),
   feed:this.feed};
 }
 privateView(p){return {id:p.id,s:p.s,battleSeq:p.battle?.seq??null};}
}

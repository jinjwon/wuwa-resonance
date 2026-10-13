import test from 'node:test';
import assert from 'node:assert/strict';
import {HEROES,STARTERS,fresh,chooseStarter,unit,buy,merge,traits,active,move,equip,sell,restore,roll,enemies,makeBattle,step,burst,settle,advance,makeDuel,runDuel,makePool,rollPool,capacity,levelUp,levelCost,POOL_SIZE} from './engine.js';
import {Room} from './multi.mjs';
const rng=(seed=42)=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
function starter(id='dragon'){const s=fresh();chooseStarter(s,id);return s;}
function fight(s,seed=42){const b=makeBattle(s,enemies(s.round),rng(seed));let all=[];while(!b.ended){all.push(...step(b));if(b.energy>=100&&!b.ended)all.push(...burst(b));}return {b,all};}
test('시작 조합 3명과 전용 에코, 재선택 불가',()=>{for(const kit of STARTERS){const s=starter(kit.id);assert.equal(s.board.filter(Boolean).length,3);assert.equal(s.board[0].echo,kit.echo);assert.equal(s.shop.length,5);assert.equal(chooseStarter(s,'bloom'),false);}});
test('상점 영입·잔액·자동 승급·전투 중 영입 차단',()=>{const s=starter();buy(s,0);const r=buy(s,3);assert.equal(s.board[0].star,2);assert.equal(s.board[0].echo,'jue');assert.equal(s.gold,2);assert.equal(r.notices.length,1);assert.ok(buy(s,0).error);s.phase='battle';assert.ok(buy(s,2).error);});
test('합성에서 추가 에코 보존, 3성 연쇄 합성',()=>{const s=starter();s.board.fill(null);s.board[0]={...unit(0,2),echo:'jue'};s.board[1]={...unit(0,2),echo:'bell'};s.bench[0]={...unit(0),echo:'crown'};s.bench[1]=unit(0);s.bench[2]=unit(0);merge(s);assert.equal(s.board[0].star,3);assert.equal(s.board[0].echo,'jue');assert.deepEqual(s.inventory.sort(),['bell','crown']);});
test('배치 인원 제한과 맞교환, 잘못된 칸 차단',()=>{const s=starter();s.bench[0]=unit(2);assert.equal(move(s,{area:'bench',i:0},{area:'board',i:5}),false);assert.equal(move(s,{area:'bench',i:0},{area:'board',i:0}),true);assert.equal(move(s,{area:'board',i:0},{area:'bench',i:99}),false);s.phase='battle';assert.equal(move(s,{area:'board',i:0},{area:'bench',i:1}),false);});
test('동일 캐릭터로 유대 중복 계산하지 않음',()=>{assert.equal(active(traits([unit(0),unit(0)]),'회절'),false);assert.equal(active(traits([unit(0),unit(2)]),'회절'),true);});
test('에코 장착·교체·판매 시 반환, 전투 중 차단',()=>{const s=starter();const u=s.board[0];s.inventory=['bell'];assert.ok(equip(s,u.uid,0));assert.equal(u.echo,'bell');assert.deepEqual(s.inventory,['jue']);s.phase='battle';assert.equal(equip(s,u.uid,0),false);assert.equal(sell(s,u.uid),false);s.phase='prep';assert.ok(sell(s,u.uid));assert.deepEqual(s.inventory,['jue','bell']);});
test('금희 협동 조합의 실제 추격과 승천 축적',()=>{const s=starter();s.round=4;const {b,all}=fight(s);assert.ok(all.some(e=>e.kind==='coop'));assert.ok(all.some(e=>e.states.some(f=>f.charge>0)));assert.ok(all.some(e=>e.kind==='skill'&&e.name==='용의 승천'));assert.ok(b.fighters.some(f=>f.extras>0));});
test('같은 씨드에서 에코 해방 피해 강화',()=>{const s=starter();s.board=[unit(0,2),...Array(11).fill(null)];s.round=4;const a=fight(s,10);s.board[0].echo='jue';const b=fight(s,10);const first=evs=>evs.find(e=>e.kind==='ult'&&e.from===s.board[0].uid).amount;assert.ok(first(b.all)>first(a.all));});
test('협주 총공격은 100 필요, 소비와 유한 연쇄',()=>{const s=starter();s.round=5;const b=makeBattle(s,enemies(5),rng());assert.deepEqual(burst(b),[]);b.energy=100;const events=burst(b);assert.equal(b.bursts,1);assert.equal(b.energy,0);assert.equal(events[0].kind,'burst');assert.ok(events.some(e=>e.kind==='extra'));assert.deepEqual(burst(b),[]);});
test('모든 시작 덱이 첫 구역 돌파 가능',()=>{for(const kit of STARTERS)for(let seed=1;seed<=5;seed++){const {b}=fight(starter(kit.id),seed);assert.equal(b.winner,'ally',`${kit.id}, seed ${seed}`);}});
test('9개 구역 종료·체력 범위·공격량·원본 상태 보존',()=>{for(let r=1;r<=9;r++){const s=starter();s.round=r;s.board[0].star=r>3?2:1;s.board[3]=unit(2);const original=JSON.stringify(s.board);const {b,all}=fight(s,r);assert.ok(b.tick<=60);assert.ok(['ally','enemy'].includes(b.winner));assert.ok(all.length<4000);assert.ok(b.fighters.every(f=>Number.isFinite(f.hp)&&f.hp>=0&&f.hp<=f.max));assert.equal(JSON.stringify(s.board),original);}});
test('결산 중복 금지와 다음 구역 조건',()=>{const s=starter();const {b}=fight(s);s.phase='battle';const r=settle(s,b);assert.ok(r.income>=8);const gold=s.gold;assert.equal(settle(s,b),null);assert.equal(s.gold,gold);assert.equal(advance(s),false);s.phase='reward';assert.equal(advance(s,true),true);assert.equal(s.round,2);assert.equal(s.elite,true);});
test('체크포인트 유효성 및 UID 충돌 방지',()=>{const s=starter();const copy=restore(JSON.stringify(s));assert.equal(copy.board[0].id,0);const added=unit(11);assert.ok(added.uid>Math.max(...copy.board.filter(Boolean).map(u=>u.uid)));assert.equal(restore('invalid'),null);assert.equal(restore(JSON.stringify({...s,round:99})),null);assert.equal(restore(JSON.stringify({...s,phase:'battle'})),null);});
test('모든 새 상점에 보유 공명자 최소 1명 등장',()=>{const s=starter();const owned=s.board.filter(Boolean).map(u=>u.id);for(let i=0;i<50;i++)assert.ok(roll(s,rng(i)).some(id=>owned.includes(id)));});

test('추가 공명자도 상점에서 영입하고 3장 합성·저장 복구 가능',()=>{
 for(const name of ['앙코','모르테피','상리요','산화']){
  const h=HEROES.find(h=>h.name===name);assert.ok(h,`${name} 모집 가능`);
  const s=starter();s.gold=30;s.shop=[h.id,h.id,h.id,null,null];
  for(let i=0;i<3;i++)assert.ok(!buy(s,i).error);
  assert.equal(s.bench.filter(Boolean).length,1);assert.equal(s.bench[0].star,2);
  assert.equal(restore(JSON.stringify(s)).bench[0].id,h.id);
  const empty=fresh();assert.ok(roll(empty,()=> (h.id+.5)/HEROES.length).includes(h.id));
 }
});
test('신규 시작 팀은 용융·전도 유대를 발동하고 첫 구역을 돌파',()=>{
 for(const [kit,trait] of [['inferno','용융'],['voltage','전도']]){
  assert.ok(chooseStarter(fresh(),kit));
  for(let seed=1;seed<=10;seed++){
   const s=starter(kit);assert.ok(active(traits(s.board),trait));assert.equal(fight(s,seed).b.winner,'ally',`${kit}:${seed}`);
  }
 }
});
test('새 공명자의 해방은 추격 또는 아군 보호막을 생성',()=>{
 for(const name of ['앙코','모르테피','상리요','산화']){
  const h=HEROES.find(h=>h.name===name);assert.ok(h);
  const s=starter();s.board.fill(null);s.board[0]=unit(h.id,2);s.board[1]=unit(2);s.round=6;
  const b=makeBattle(s,[unit(7,3)],()=>.5);const f=b.fighters.find(f=>f.uid===s.board[0].uid);
  const foe=b.fighters.find(f=>f.side==='enemy');foe.hp=foe.max=100000;foe.atk=0;
  f.mana=f.threshold-1;const all=[...step(b),...step(b)];
  assert.ok(all.some(e=>e.from===f.uid&&e.kind==='skill'),name);
  if(name==='산화'){assert.ok(all.some(e=>e.from===f.uid&&e.kind==='ult'));assert.ok(b.fighters.filter(f=>f.side==='ally').every(f=>f.shield>=160));}
  else assert.ok(f.extras>0,name);
 }
});
test('용융 유대는 실제 해방 피해를 높이고 전도 유대는 협주를 충전',()=>{
 const sample=(name,trait,on)=>{
  const h=HEROES.find(h=>h.name===name);assert.ok(h);
  const s=starter();s.board.fill(null);s.board[0]=unit(h.id);s.round=9;
  const b=makeBattle(s,[unit(7,3)],()=>.5);b.counts={[trait]:on?2:0};
  const f=b.fighters.find(f=>f.side==='ally');f.mana=f.threshold-1;
  const events=step(b);return {b,hit:events.find(e=>e.from===f.uid&&e.kind==='ult')?.amount};
 };
 assert.ok(sample('앙코','용융',true).hit>sample('앙코','용융',false).hit);
 assert.ok(sample('상리요','전도',true).b.energy>sample('상리요','전도',false).b.energy);
});

// ── 2026-10 확장: 신규 공명자 8명 ──
const NEW8=['페비','루파','칸타렐라','능양','카카루','아우구스타','유노','샤콘'];
test('24명 · 6속성 각 4명 · 신규 8명 모집/합성 가능',()=>{
 assert.equal(HEROES.length,24);
 const by={};for(const h of HEROES)by[h.origin]=(by[h.origin]||0)+1;
 assert.deepEqual(Object.values(by),[4,4,4,4,4,4]);
 assert.equal(new Set(HEROES.map(h=>h.key)).size,24);
 for(const name of NEW8){const h=HEROES.find(h=>h.name===name);assert.ok(h,name);const s=starter();s.gold=40;s.shop=[h.id,h.id,h.id,null,null];for(let i=0;i<3;i++)assert.ok(!buy(s,i).error);assert.equal(s.bench.find(Boolean).star,2);}
});
test('신규 공명자 해방이 고유 효과를 낸다',()=>{
 const cast=name=>{const h=HEROES.find(h=>h.name===name);const s=starter();s.board.fill(null);s.board[0]=unit(h.id,2);s.board[1]=unit(10);s.round=6;
  const b=makeBattle(s,[unit(7,3)],()=>.5);const f=b.fighters.find(f=>f.uid===s.board[0].uid),mate=b.fighters.find(f=>f.uid===s.board[1].uid),foe=b.fighters.find(f=>f.side==='enemy');
  foe.hp=foe.max=100000;foe.atk=0;mate.hp=mate.max*.5;f.mana=f.threshold-1;const atk0=mate.atk,e0=b.energy;const all=[...step(b),...step(b)];
  assert.ok(all.some(e=>e.from===f.uid&&e.kind==='skill'),name);return {b,f,mate,foe,all,atk0,e0};};
 assert.ok(cast('페비').foe.mark);
 const lupa=cast('루파');assert.ok(lupa.mate.atk>lupa.atk0);
 const can=cast('칸타렐라');assert.ok(can.all.some(e=>e.from===can.f.uid&&e.kind==='heal'));
 const ling=cast('능양');assert.ok(ling.f.extras>0);
 const aug=cast('아우구스타');assert.ok(aug.all.some(e=>e.from===aug.f.uid&&e.kind==='ult'));
 const iuno=cast('유노');assert.ok(iuno.f.extras>0);
 const cia=cast('샤콘');assert.ok(cia.mate.shield>=180&&cia.b.energy>=15&&cia.mate.extras>0);
 // 카카루: 체력 50% 이하 대상에게 1.5배
 const hit=low=>{const h=HEROES.find(h=>h.name==='카카루');const s=starter();s.board.fill(null);s.board[0]=unit(h.id);s.round=6;const b=makeBattle(s,[unit(7,3)],()=>.5);const f=b.fighters.find(f=>f.side==='ally'),foe=b.fighters.find(f=>f.side==='enemy');foe.max=100000;foe.hp=low?40000:90000;foe.atk=0;f.mana=f.threshold-1;return step(b).find(e=>e.kind==='ult').amount;};
 assert.ok(hit(true)>hit(false)*1.4);
});
// ── PvP ──
function team(ids,aug=[]){const s={...fresh(),phase:'prep',augments:aug};ids.forEach((id,i)=>s.board[i]=unit(id,2));return s;}
test('PvP 전투는 양측 유대·변주를 각각 적용하고 반드시 끝난다',()=>{
 const a=team([12,13,1]),o=team([14,8,20]);
 const b=makeDuel(a,o,rng(3));assert.ok(active(b.counts,'용융'));assert.ok(active(b.foe.counts,'전도'));assert.equal(b.foe.npc,false);
 for(let seed=1;seed<=20;seed++){const {b,events}=runDuel(team([0,8,9,2]),team([3,11,10,18]),rng(seed));assert.ok(b.ended);assert.ok(['ally','enemy','draw'].includes(b.winner));assert.ok(events.length<6000);assert.ok(b.fighters.every(f=>Number.isFinite(f.hp)&&f.hp>=0));}
});
test('PvP 협주는 양측 모두 자동 발동',()=>{let both=false;for(let seed=1;seed<=10&&!both;seed++){const {events}=runDuel(team([14,8,20,21]),team([14,8,20,21]),rng(seed));const sides=new Set(events.filter(e=>e.kind==='burst').map(e=>e.side));both=sides.has('ally')&&sides.has('enemy');}assert.ok(both);});
test('응결 유대는 상대 쪽 공격력만 낮춘다',()=>{const a=team([4,9]),o=team([0,2]);const b=makeDuel(a,o,rng());const foeJin=b.fighters.find(f=>f.side==='enemy'&&f.id===0),myCarl=b.fighters.find(f=>f.side==='ally'&&f.id===4);assert.ok(Math.abs(foeJin.atk-HEROES[0].atk*1.9*.88)<1e-6);assert.ok(Math.abs(myCarl.atk-HEROES[4].atk*1.9)<1e-6);});
// ── 공용 풀·출전 확장 ──
test('공용 풀: 비어 있으면 등장·모집 불가, 판매 시 반환',()=>{
 const pool=makePool();assert.equal(pool[0],POOL_SIZE[HEROES[0].cost]);
 pool.fill(0);pool[19]=1;for(let i=0;i<20;i++)assert.ok(rollPool(pool,1,rng(i)).every(id=>id===19));
 const s={...fresh(),phase:'prep',shop:[19,19,null,null,null]};assert.ok(!buy(s,0,pool).error);assert.equal(pool[19],0);assert.ok(buy(s,1,pool).error);
 assert.ok(sell(s,s.bench[0].uid,pool));assert.equal(pool[19],1);
 const odds=rollPool(makePool(),1,rng(5));assert.ok(odds.every(id=>HEROES[id].cost<=2));
});
test('출전 확장 비용·상한',()=>{const s={...fresh(),phase:'prep',gold:100};assert.equal(capacity(s),3);assert.equal(levelCost(s),4);assert.ok(levelUp(s).ok);assert.equal(capacity(s),4);assert.equal(s.gold,96);s.round=9;while(!levelUp(s).error);assert.equal(capacity(s),8);s.phase='battle';assert.ok(levelUp(s).error);});
// ── 방(로비) ──
function playRoom(n,seed){
 const r=new Room('T',{rng:rng(seed),manual:true});const host=r.addPlayer('호스트').player;host.connected=true;
 for(let i=1;i<n;i++)r.addBot(host.id);
 assert.ok(r.start(host.id).ok);r.act(host,{type:'starter',id:'dragon'});
 let guard=0;while(r.phase!=='over'&&guard++<80){if(r.phase==='prep'){if(host.alive)r.botTurn(host);r.beginBattle();}if(r.phase==='battle'){assert.ok(r.pool.every(x=>x>=0));r.endBattle();}}
 return {r,host};
}
test('방: 2~8인 대전이 끝까지 진행되고 순위가 1..N으로 매겨진다',()=>{
 for(const n of [2,3,5,8]){const {r}=playRoom(n,n*7);assert.equal(r.phase,'over',`${n}인`);assert.deepEqual(r.players.map(p=>p.place).sort((a,b)=>a-b),Array.from({length:n},(_,i)=>i+1));assert.ok(r.round<60);assert.ok(r.pool.every(x=>x>=0));}
});
test('방: 홀수 인원은 잔상과 싸우고 잔상 주인은 체력이 줄지 않는다',()=>{
 const r=new Room('T',{rng:rng(2),manual:true});const h=r.addPlayer('A').player;h.connected=true;r.addBot(h.id);r.addBot(h.id);r.start(h.id);r.act(h,{type:'starter',id:'storm'});
 assert.equal(r.phase,'prep');r.beginBattle();const ghosts=r.players.filter(p=>p.battle?.ghost);assert.equal(ghosts.length,1);
 const lifeBefore=new Map(r.players.map(p=>[p.id,p.s.life]));const hits=r.pendingResults.length;assert.equal(hits,3);r.endBattle();
 const damaged=r.players.filter(p=>p.s.life<lifeBefore.get(p.id)).length;assert.ok(damaged<=2);
});
test('방: 권한·보상 선택·준비 완료·중도 이탈',()=>{
 const r=new Room('T',{rng:rng(9),manual:true});const a=r.addPlayer('A').player,b=r.addPlayer('B').player;a.connected=b.connected=true;
 assert.ok(r.start(b.id).error);assert.ok(r.addBot(b.id).error);assert.ok(r.start(a.id).ok);
 r.act(a,{type:'starter',id:'dragon'});assert.equal(r.phase,'starter');assert.ok(r.act(a,{type:'buy',i:0}).error);
 r.act(b,{type:'starter',id:'triumph'});assert.equal(r.phase,'prep');assert.equal(r.round,1);
 assert.ok(!r.act(a,{type:'buy',i:0}).error);
 r.act(a,{type:'ready',value:true});assert.equal(r.phase,'prep');r.act(b,{type:'ready',value:true});assert.equal(r.phase,'battle');
 assert.ok(a.battle&&b.battle&&a.battle.seq===b.battle.seq);assert.equal(a.battle.opponent.id,b.id);
 assert.equal(a.battle.fighters.find(f=>f.side==='ally').uid,a.battle.fighters.find(f=>a.s.board.some(u=>u?.uid===f.uid)).uid);
 r.act(a,{type:'watched',seq:r.battleSeq});assert.equal(r.phase,'battle');r.act(b,{type:'watched',seq:r.battleSeq});assert.equal(r.phase,'prep');assert.equal(r.round,2);
 assert.equal(a.s.pending.length,1);const inv=a.s.inventory.length;assert.ok(r.act(a,{type:'pick',i:1}).ok);assert.equal(a.s.inventory.length,inv+1);
 const gold=b.s.gold;r.act(b,{type:'leave'});assert.equal(r.phase,'over');assert.equal(a.place,1);assert.equal(b.place,2);assert.ok(gold>=0);
});

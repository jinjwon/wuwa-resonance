// This fan prototype uses custom combat rules, not live Wuthering Waves balance.
// Shared by the browser (solo) and the lobby server (multiplayer), so it stays dependency-free.
export const HEROES = [
  ['금희','회절','공명',4,660,68,'용의 승천','협동공격마다 승천 축적. 해방 시 축적을 소모해 광역 폭발.','#f0dcab','jinhsi'],
  ['장리','용융','공명',3,740,75,'불사조의 비상','해방 시 광역 피해. 다음 3회 공격에 화염 추격.','#f79883','changli'],
  ['파수인','회절','조율',3,740,38,'별의 영역','아군 전체 회복·보호막. 협주 18 충전.','#a3d5ff','shorekeeper'],
  ['카멜리아','인멸','연격',4,820,67,'붉은 꽃의 만개','공격할수록 만개 축적. 해방 후 4회 공격이 강화.','#f18eab','camellya'],
  ['카를로타','응결','공명',3,630,86,'결정의 종막','체력이 가장 낮은 적에게 큰 피해. 처치 시 즉시 재장전.','#c7b6ee','carlotta'],
  ['카르티시아','기류','연격',4,950,67,'폭풍의 검','체력을 소모해 변신. 해방 후 연격 강화, 타격 시 회복.','#94e6d0','cartethyia'],
  ['플로로','인멸','협동',3,680,62,'잔향의 악장','해방으로 헤카테 소환. 이후 4회 동안 소환수 추격.','#b99be8','phrolova'],
  ['기염','기류','연격',3,920,65,'청룡의 돌파','해방 후 4회 동안 모든 적에게 청룡 추가 피해.','#8bd5ce','jiyan'],
  ['음림','전도','협동',2,650,65,'뇌정의 심판','적 전체 표식. 표식 대상은 협동공격에 더 큰 피해.','#d599f0','yinlin'],
  ['절지','응결','협동',2,660,49,'먹빛 두루미','해방 시 두루미 협동공격 4회 예약. 아군 해방에 반응.','#a7e0dc','zhezhi'],
  ['벨리나','회절','조율',1,800,31,'꽃의 축복','전체 회복. 남는 회복량의 절반을 보호막으로 전환.','#c9e89b','verina'],
  ['방랑자','인멸','연격',1,820,56,'무음의 심연','해방 시 단일 큰 피해. 체력이 적을수록 피해 증가.','#ddc59b','rover'],
  ['앙코','용융','연격',3,760,65,'양들의 불꽃 놀이','해방 후 4회 공격에 불꽃 추격. 용융 조합으로 해방 강화.','#ffb1ba','encore'],
  ['모르테피','용융','협동',2,700,55,'붉은 용의 합주','해방 후 4회 공격에 협동 사격. 아군 해방에도 협동 유대로 반응.','#ed8e78','mortefi'],
  ['상리요','전도','공명',4,880,72,'연산의 붕괴','해방으로 광역 전격. 이후 4회 공격에 전류 추격.','#9ccfff','xiangliyao'],
  ['산화','응결','연격',1,770,54,'서리의 파열','해방으로 얼음을 폭발시키고 아군 전체에 보호막 80 부여.','#a4e5f2','sanhua'],
  // 2026-10 확장: 속성별 4명 균형
  ['페비','회절','조율',2,700,40,'고해의 빛','아군 전체 회복. 적 전체에 빛의 표식을 남겨 협동공격 피해를 키움.','#f4e3a6','phoebe'],
  ['루파','용융','협동',3,760,60,'늑대의 사냥','아군 전체 공격력 +10%(최대 3중첩). 대상에게 화염 일격.','#ff9466','lupa'],
  ['칸타렐라','인멸','조율',3,720,52,'심해의 포옹','적 전체 피해. 준 피해의 절반으로 가장 약한 아군 회복.','#c58ff0','cantarella'],
  ['능양','응결','연격',1,830,57,'사자의 춤','해방 시 단일 피해. 이후 4회 공격에 얼음 추격.','#bfe0ff','lingyang'],
  ['카카루','전도','공명',2,720,70,'사냥개의 처형','단일 큰 피해. 대상 체력이 50% 이하면 피해 1.5배.','#ab92ff','calcharo'],
  ['아우구스타','전도','공명',4,840,72,'개선의 창','자신에게 보호막 후 적 전체 큰 피해. 협주 +10.','#ffd36e','augusta'],
  ['유노','기류','협동',4,760,70,'달의 궤도','적 전체 피해. 이후 4회 공격에 협동 사격.','#9fe6c8','iuno'],
  ['샤콘','기류','조율',3,740,46,'바람의 협주곡','아군 전체 보호막과 협주 +15. 아군 전원이 바람 추격 1회.','#7fd9bd','ciaccona'],
  ['젠니','회절','공명',3,780,66,'최종 결산','공격마다 대상에 광휘 축적(최대 6). 해방 시 적 전체의 광휘를 터뜨려 축적 1당 피해 +35%.','#f0b3a8','zani']
].map((h,id)=>({id,name:h[0],origin:h[1],role:h[2],cost:h[3],hp:h[4],atk:h[5],skill:h[6],desc:h[7],color:h[8],key:h[9]}));
export const ELEMENT_ICON = {용융:'♨',전도:'ϟ',회절:'✦',응결:'❄',기류:'≋',인멸:'☾'};
export const TRAIT_ICON = {...ELEMENT_ICON,공명:'✧',협동:'羽',연격:'⚔',조율:'♫'};
export const TRAITS = {
  용융:'2명: 아군 해방 피해 +20%',전도:'2명: 아군 해방마다 협주 +10',
  회절:'2명: 해방마다 아군 전체 회복 40',응결:'2명: 적 공격력 −12%',기류:'2명: 3회 공격마다 60% 기류 추격',인멸:'2명: 피해 15% 흡혈',
  공명:'2명: 해방 피해 +35%',협동:'2명: 해방에 최대 2명 추격',연격:'2명: 일반 공격 +25%',조율:'2명: 시작 보호막 160, 협주 +20'
};
export const ECHOS = [
 {id:'jue',name:'용의 별빛',icon:'✦',desc:'해방 피해 +45%. 공명 주력에게 추천.'},
 {id:'heron',name:'백로의 잔향',icon:'羽',desc:'해방 필요 공격 횟수 −1. 조율·협동에게 추천.'},
 {id:'crown',name:'무관의 칼날',icon:'♜',desc:'일반·추격 피해 +30%. 연격 주력에게 추천.'},
 {id:'turtle',name:'거북의 가호',icon:'◇',desc:'최대 체력 +30%, 시작 보호막 220.'},
 {id:'rider',name:'불꽃의 질주',icon:'ϟ',desc:'공격력 +20%. 처치 시 최대 체력 20% 회복.'},
 {id:'bell',name:'돌아오는 종소리',icon:'◉',desc:'회복량 +50%. 해방마다 협주 8 충전.'}
];
export const AUGMENTS = [
 {id:'duet',name:'끝나지 않는 협주',icon:'羽',desc:'협동공격의 피해 +60%. 금희의 승천 축적도 더 빠르게 쌓입니다.'},
 {id:'bloom',name:'붉은 개화',icon:'✿',desc:'연격 캐릭터가 일반 공격을 할 때 35% 피해의 추격 1회.'},
 {id:'overdrive',name:'공명 과부하',icon:'✦',desc:'모든 아군의 해방 필요 공격 횟수 −1.'},
 {id:'bulwark',name:'부서지지 않는 음계',icon:'◇',desc:'모든 아군의 최대 체력 +25%, 시작 보호막 150.'},
 {id:'concerto',name:'앙코르',icon:'♫',desc:'협주 획득량 +40%, 총공격 피해 +40%.'},
 {id:'wealth',name:'검은 해안의 지원',icon:'◎',desc:'즉시 8코인, 이후 매 전투 보상 +3코인.'}
];
export const STARTERS=[
 {id:'dragon',title:'용을 깨우는 협주',lead:0,units:[0,8,9],tag:'금희 × 음림 × 절지',desc:'협동공격으로 승천을 쌓고 금희의 해방으로 폭발.',echo:'jue'},
 {id:'bloom',title:'끝없이 피는 붉은 꽃',lead:3,units:[3,11,10],tag:'카멜리아 × 방랑자 × 벨리나',desc:'연격과 인멸 흡혈로 버티며 카멜리아를 성장.',echo:'crown'},
 {id:'storm',title:'폭풍을 가르는 청룡',lead:7,units:[7,5,2],tag:'기염 × 카르티시아 × 파수인',desc:'기류 추격과 파수인의 회복으로 연쇄 돌파.',echo:'heron'},
 {id:'inferno',title:'양과 용의 불꽃 합주',lead:12,units:[12,13,10],tag:'앙코 × 모르테피 × 벨리나',desc:'앙코의 불꽃 추격과 모르테피의 협동 사격. 용융으로 해방 강화.',echo:'crown'},
 {id:'voltage',title:'빙점을 넘는 연산',lead:14,units:[14,8,15],tag:'상리요 × 음림 × 산화',desc:'전도 협주 충전으로 총공격을 앞당기고 산화의 보호막으로 버티기.',echo:'heron'},
 {id:'triumph',title:'바람이 부르는 개선가',lead:21,units:[21,22,23],tag:'아우구스타 × 유노 × 샤콘',desc:'기류 추격과 샤콘의 보호막 위에서 아우구스타의 창을 내리꽂기.',echo:'jue'},
 {id:'frazzle',title:'빛으로 정산하는 밤',lead:24,units:[24,16,2],tag:'젠니 × 페비 × 파수인',desc:'젠니의 타격과 페비의 표식으로 광휘를 쌓고, 젠니의 해방으로 한 번에 결산.',echo:'jue'},
 {id:'erosion',title:'침식하는 폭풍검',lead:5,units:[5,23,18],tag:'카르티시아 × 샤콘 × 칸타렐라',desc:'샤콘의 보호막과 칸타렐라의 회복 위에서 카르티시아가 체력을 태워 베어 낸다.',echo:'crown'}
];
// ── 공명 체인: 같은 공명자를 모을수록 한 칸씩 열린다 (★ 승급과 별개로 사본 1장마다 의미가 있음) ──
// 사본 수 = 보유 중인 같은 공명자의 3^(★-1) 합. 판매하면 다시 닫힌다.
export const CHAIN=[
 {n:1,copies:2,name:'공명의 각성',desc:'공격력·최대 체력 +8%'},
 {n:2,copies:3,name:'가속하는 주파수',desc:'해방 필요 공격 횟수 −1'},
 {n:3,copies:4,name:'변주 연계',desc:'해방 직후 다음 아군이 변주 입장 공격(공격력 80%)'},
 {n:4,copies:5,name:'공명 증폭',desc:'해방 피해 +25%'},
 {n:5,copies:7,name:'잔향 수호',desc:'시작 보호막 120 · 해방마다 협주 +8'},
 {n:6,copies:9,name:'잔향의 메아리',desc:'해방이 60% 위력으로 한 번 더 울린다'}
];
export function copiesOf(s,id){return [...s.board,...s.bench].reduce((n,u)=>n+(u?.id===id?3**(u.star-1):0),0);}
export const chainLevel=copies=>CHAIN.filter(c=>copies>=c.copies).length;
export const chainOf=(s,id)=>chainLevel(copiesOf(s,id));
function chainMap(s){const m=new Map();for(const u of [...s.board,...s.bench])if(u)m.set(u.id,(m.get(u.id)||0)+3**(u.star-1));return id=>chainLevel(m.get(id)||0);}
let uid=0;
export function unit(id,star=1){return {uid:++uid,id,star,echo:null};}
export function syncUid(n){uid=Math.max(uid,n|0);}
export function fresh(){return {version:1,round:1,life:80,gold:10,board:Array(12).fill(null),bench:Array(8).fill(null),shop:[],locked:false,augments:[],inventory:[],phase:'starter',wins:0,elite:false,starter:null,level:0};}
export const MAX_CAPACITY=8;
export function capacity(s){return Math.min(MAX_CAPACITY,(s.round>=6?5:s.round>=3?4:3)+(s.level||0));}
export const levelCost=s=>4+2*(s.level||0);
export function levelUp(s){if(s.phase!=='prep')return {error:'준비 단계에만 확장할 수 있어요.'};if(capacity(s)>=MAX_CAPACITY)return {error:`출전 인원은 최대 ${MAX_CAPACITY}명입니다.`};const cost=levelCost(s);if(s.gold<cost)return {error:'셸 코인이 부족해요.'};s.gold-=cost;s.level=(s.level||0)+1;return {ok:true};}
export function traits(board){const counts={};for(const id of new Set(board.filter(Boolean).map(u=>u.id))){for(const t of [HEROES[id].origin,HEROES[id].role])counts[t]=(counts[t]||0)+1;}return counts;}
export const active=(counts,t)=>(counts[t]||0)>=2;
export function chooseStarter(s,id){if(s.phase!=='starter')return false;const kit=STARTERS.find(k=>k.id===id);if(!kit)return false;kit.units.forEach((h,i)=>s.board[i===2?8:i]=unit(h));s.board[0].echo=kit.echo;s.starter=id;s.phase='prep';s.shop=[...kit.units,kit.units[0],10];return true;}
export function restore(raw){try{const s=JSON.parse(raw);if(s.version!==1||s.phase!=='prep'||!Number.isInteger(s.round)||s.round<1||s.round>9||!Array.isArray(s.board)||s.board.length!==12||!Array.isArray(s.bench)||s.bench.length!==8)return null;const all=[...s.board,...s.bench].filter(Boolean);if(all.some(u=>!HEROES[u.id]||![1,2,3].includes(u.star)||!Number.isInteger(u.uid)))return null;if(!Number.isFinite(s.gold)||s.gold<0||!Array.isArray(s.shop)||s.shop.length!==5||s.shop.some(id=>id!==null&&!HEROES[id])||!Array.isArray(s.inventory)||s.inventory.some(id=>!ECHOS.some(e=>e.id===id))||!Array.isArray(s.augments)||s.augments.some(id=>!AUGMENTS.some(a=>a.id===id))||!Number.isFinite(s.life)||s.life<=0)return null;s.level=Number.isInteger(s.level)&&s.level>=0&&s.level<=5?s.level:0;uid=Math.max(uid,...all.map(u=>u.uid));return s;}catch{return null;}}
export function roll(s,rng=Math.random){const owned=[...new Set([...s.board,...s.bench].filter(Boolean).map(u=>u.id))];const pick=()=>Math.floor(rng()*HEROES.length);const list=Array.from({length:5},pick);if(owned.length)list[Math.floor(rng()*5)]=owned[Math.floor(rng()*owned.length)];return list;}

// ── Shared champion pool (multiplayer) ──────────────────────────────
export const POOL_SIZE={1:22,2:18,3:14,4:10};
export function makePool(){return HEROES.map(h=>POOL_SIZE[h.cost]);}
export function shopOdds(round){if(round<=2)return [70,30,0,0];if(round<=4)return [50,35,15,0];if(round<=6)return [35,35,25,5];if(round<=9)return [25,30,30,15];return [15,25,35,25];}
export function rollPool(pool,round,rng=Math.random){
 const odds=shopOdds(round);
 const weighted=list=>{const total=list.reduce((n,h)=>n+pool[h.id],0);if(!total)return null;let r=rng()*total;for(const h of list){r-=pool[h.id];if(r<0)return h.id;}return list[list.length-1].id;};
 return Array.from({length:5},()=>{let r=rng()*100,tier=1;for(let i=0;i<4;i++){if(r<odds[i]){tier=i+1;break;}r-=odds[i];}
  return weighted(HEROES.filter(h=>h.cost===tier&&pool[h.id]>0))??weighted(HEROES.filter(h=>pool[h.id]>0));});
}

export function merge(s){const notices=[];let again=true;while(again){again=false;for(let id=0;id<HEROES.length;id++)for(let star=1;star<3;star++){const found=[];for(const area of ['board','bench'])s[area].forEach((u,i)=>{if(u?.id===id&&u.star===star)found.push({area,i,u});});if(found.length>=3){const group=found.slice(0,3),keep=group[0];const equipped=group.find(x=>x.u.echo);const echo=equipped?.u.echo||null;for(const x of group){if(x.u.echo&&x!==equipped)s.inventory.push(x.u.echo);s[x.area][x.i]=null;}s[keep.area][keep.i]={...keep.u,star:star+1,echo};notices.push(`${HEROES[id].name} ${'★'.repeat(star+1)} 승급`);again=true;}}}return notices;}
export function buy(s,index,pool=null){if(s.phase!=='prep')return {error:'준비 단계에 모집할 수 있어요.'};const id=s.shop[index];if(id===null||id===undefined)return {error:'이미 모집했습니다.'};if(s.gold<HEROES[id].cost)return {error:'셸 코인이 부족해요.'};if(pool&&pool[id]<=0)return {error:`${HEROES[id].name}의 모집 풀이 비었어요.`};const slot=s.bench.indexOf(null);if(slot<0)return {error:'대기석을 비워주세요.'};const before=chainOf(s,id);s.gold-=HEROES[id].cost;if(pool)pool[id]--;s.bench[slot]=unit(id);s.shop[index]=null;const notices=merge(s),after=chainOf(s,id);
 if(after>before){const node=CHAIN[after-1],msg=`공명 체인 ${after} · ${node.name}`;const star=notices.findIndex(n=>n.startsWith(HEROES[id].name));if(star>=0)notices[star]+=` · ${msg}`;else notices.push(`${HEROES[id].name} ${msg}`);}
 return {notices,chain:after};}
export function move(s,from,to){if(s.phase!=='prep'||!['board','bench'].includes(from?.area)||!['board','bench'].includes(to?.area))return false;if(!Number.isInteger(from.i)||!Number.isInteger(to.i)||from.i<0||to.i<0||from.i>=s[from.area].length||to.i>=s[to.area].length)return false;const a=s[from.area][from.i],b=s[to.area][to.i];if(!a)return false;if(from.area==='bench'&&to.area==='board'&&!b&&s.board.filter(Boolean).length>=capacity(s))return false;[s[from.area][from.i],s[to.area][to.i]]=[b,a];return true;}
export function equip(s,uid,index){if(s.phase!=='prep'||!s.inventory[index])return false;const u=[...s.board,...s.bench].find(u=>u?.uid===uid);if(!u)return false;const next=s.inventory.splice(index,1)[0];if(u.echo)s.inventory.push(u.echo);u.echo=next;return true;}
export function unequip(s,uid){if(s.phase!=='prep')return false;const u=[...s.board,...s.bench].find(u=>u?.uid===uid);if(!u?.echo)return false;s.inventory.push(u.echo);u.echo=null;return true;}
export function sell(s,uid,pool=null){if(s.phase!=='prep')return false;for(const area of ['board','bench']){const i=s[area].findIndex(u=>u?.uid===uid);if(i>=0){const u=s[area][i];s.gold+=HEROES[u.id].cost*3**(u.star-1);if(pool)pool[u.id]+=3**(u.star-1);if(u.echo)s.inventory.push(u.echo);s[area][i]=null;return true;}}return false;}
export function enemies(round){const arr=Array(12).fill(null),n=Math.min(6,2+Math.floor(round/2));for(let i=0;i<n;i++)arr[i<3?i:i+3]=unit((round*3+i*5)%12,round>=7?2:1);return arr;}

// ── Combat ──────────────────────────────────────────────────────────
// Each side has a context: the ally side is the battle object itself (keeps the
// original solo API: b.counts, b.mods, b.energy), the enemy side is b.foe.
// A side with npc=true is a PvE phantom: no traits, echoes, augments or concerto.
const ctxOf=(b,f)=>f.side==='ally'?b:b.foe;
function fighter(u,side,slot,own,oppCounts,npcScale,chain=0){
 const h=HEROES[u.id],scale=[0,1,1.9,3.5][u.star]*(chain>=1?1.08:1);let hp=h.hp*scale,atk=h.atk*scale;
 if(npcScale){hp*=.66+npcScale.round*.08;atk*=.60+npcScale.round*.055;if(npcScale.round%3===0){hp*=1.3;atk*=1.13;}if(npcScale.elite){hp*=1.25;atk*=1.16;}}
 else{if(own.mods.has('bulwark'))hp*=1.25;if(u.echo==='turtle')hp*=1.3;if(u.echo==='rider')atk*=1.2;}
 if(active(oppCounts,'응결'))atk*=.88;
 const pl=!own.npc;
 return {...u,side,slot,hp,max:hp,atk,shield:pl?((active(own.counts,'조율')?160:0)+(own.mods.has('bulwark')?150:0)+(u.echo==='turtle'?220:0)+(chain>=5?120:0)):0,mana:0,threshold:Math.max(2,4-(pl&&own.mods.has('overdrive')?1:0)-(pl&&u.echo==='heron'?1:0)-(chain>=2?1:0)),hits:0,damage:0,healed:0,extras:0,charge:0,buff:0,mark:false,lupa:0,frazzle:0,chain};
}
function baseBattle(counts,mods,rng,foe){return {fighters:[],counts,mods,rng,tick:0,energy:active(counts,'조율')?20:0,bursts:0,chains:0,events:[],ended:false,winner:null,foe};}
export function makeBattle(s,enemy,rng=Math.random){
 const counts=traits(s.board),b=baseBattle(counts,new Set(s.augments),rng,{counts:{},mods:new Set(),energy:0,bursts:0,npc:true});
 const ch=chainMap(s);
 b.fighters=[...s.board.flatMap((u,i)=>u?[fighter(u,'ally',i,b,{},null,ch(u.id))]:[]),...enemy.flatMap((u,i)=>u?[fighter(u,'enemy',i,b.foe,counts,{round:s.round,elite:s.elite})]:[])];
 return b;
}
// Player vs player: both boards get their own traits, echoes and augments. Concerto bursts fire automatically.
export function makeDuel(a,o,rng=Math.random){
 const ca=traits(a.board),co=traits(o.board);
 const b=baseBattle(ca,new Set(a.augments||[]),rng,{counts:co,mods:new Set(o.augments||[]),energy:active(co,'조율')?20:0,bursts:0,npc:false});
 b.pvp=true;
 const cha=chainMap(a),cho=chainMap(o);
 b.fighters=[...a.board.flatMap((u,i)=>u?[fighter(u,'ally',i,b,co,null,cha(u.id))]:[]),...o.board.flatMap((u,i)=>u?[fighter(u,'enemy',i,b.foe,ca,null,cho(u.id))]:[])];
 return b;
}
const sideStats=(b,side)=>b.fighters.filter(f=>f.side===side).map(f=>({uid:f.uid,id:f.id,damage:f.damage,healed:f.healed,extras:f.extras}));
function emit(b,e){const ev={...e,energy:b.energy,stats:sideStats(b,'ally'),states:b.fighters.map(f=>({uid:f.uid,hp:f.hp,shield:f.shield,mana:f.mana,charge:f.charge}))};if(b.pvp){ev.foeEnergy=b.foe.energy;ev.foeStats=sideStats(b,'enemy');}b.events.push(ev);}
function energy(b,a,n){const c=ctxOf(b,a);if(c.npc)return;c.energy=Math.min(100,c.energy+n*(c.mods.has('concerto')?1.4:1));}
function heal(b,a,f,n){if(f.hp<=0)return;const value=n*(a.echo==='bell'?1.5:1),gain=Math.min(value,f.max-f.hp);f.hp+=gain;a.healed+=gain;if(a.id===10)f.shield+=Math.max(0,value-gain)*.5;if(gain>0)emit(b,{from:a.uid,to:f.uid,kind:'heal',amount:Math.round(gain)});}
function damage(b,a,f,n,kind='hit'){if(!f||f.hp<=0||a.hp<=0)return;const c=ctxOf(b,a),pl=!c.npc;let val=n;if(pl){if(a.echo==='crown'&&['hit','extra','coop'].includes(kind))val*=1.3;if(kind==='ult'){if(a.chain>=4)val*=1.25;if(active(c.counts,'용융'))val*=1.2;if(active(c.counts,'공명'))val*=1.35;if(a.echo==='jue')val*=1.45;}if(kind==='coop'){if(f.mark)val*=1.25;if(c.mods.has('duet'))val*=1.6;}}const shield=Math.min(f.shield,val);f.shield-=shield;const dealt=Math.min(f.hp,val-shield);f.hp-=dealt;a.damage+=dealt+shield;if(['coop','extra'].includes(kind)){a.extras++;b.chains++;}if(pl){energy(b,a,kind==='hit'?4:kind==='coop'?6:2);if(kind==='coop')for(const jin of b.fighters.filter(x=>x.side===a.side&&x.id===0&&x.hp>0))jin.charge=Math.min(12,jin.charge+(c.mods.has('duet')?2:1));}emit(b,{from:a.uid,to:f.uid,kind,amount:Math.round(dealt+shield),kill:f.hp<=0});if(pl&&active(c.counts,'인멸'))heal(b,a,a,(dealt+shield)*.15);if(f.hp<=0&&a.echo==='rider')heal(b,a,a,a.max*.2);}
function finishCheck(b){const ally=b.fighters.some(f=>f.side==='ally'&&f.hp>0),enemy=b.fighters.some(f=>f.side==='enemy'&&f.hp>0);if(!ally||!enemy||b.tick>=60){b.ended=true;b.winner=ally&&!enemy?'ally':b.pvp&&ally&&enemy?'draw':'enemy';}return b.ended;}
export function burst(b,side='ally'){const c=side==='ally'?b:b.foe;if(b.ended||c.npc||c.energy<100)return [];b.events=[];c.energy=0;c.bursts++;const allies=b.fighters.filter(f=>f.side===side&&f.hp>0);if(!allies.length)return [];const lead=allies.reduce((a,f)=>f.atk>a.atk?f:a);emit(b,{from:lead.uid,kind:'burst',side,name:'협주 · 공명 해방'});for(const a of allies){const foe=b.fighters.filter(f=>f.side!==side&&f.hp>0).sort((x,y)=>x.hp-y.hp)[0];damage(b,a,foe,a.atk*(c.mods.has('concerto')?3.36:2.4),'extra');a.mana=Math.min(a.threshold-1,a.mana+1);}c.energy=0;finishCheck(b);emit(b,{kind:'sync'});return b.events;}
function liberate(b,a,h,foes,friends,target){
 const id=a.id;
 if([2,10].includes(id)){for(const f of friends()){heal(b,a,f,(id===2?130:160)*a.star);if(id===2)f.shield+=70*a.star;}if(id===2)energy(b,a,18);}
 else if(id===0){const power=1+a.charge*.16;a.charge=0;for(const f of foes())damage(b,a,f,a.atk*1.85*power,'ult');}
 else if(id===8){for(const f of foes()){f.mark=true;damage(b,a,f,a.atk*1.2,'ult');}}
 else if(id===9){a.buff=4;damage(b,a,target(),a.atk*2,'ult');}
 else if(id===4){const f=foes().sort((x,y)=>x.hp-y.hp)[0];damage(b,a,f,a.atk*4,'ult');if(f.hp<=0)a.mana=a.threshold-1;}
 else if(id===5){a.hp=Math.max(1,a.hp-a.max*.12);a.buff=4;for(const f of foes())damage(b,a,f,a.atk*1.8,'ult');}
 else if(id===15){for(const f of foes())damage(b,a,f,a.atk*1.5,'ult');for(const f of friends())f.shield+=80*a.star;}
 else if(id===14||id===22){a.buff=4;for(const f of foes())damage(b,a,f,a.atk*(id===14?1.8:1.4),'ult');}
 else if(id===11){damage(b,a,target(),a.atk*(3+(1-a.hp/a.max)*2),'ult');}
 else if(id===16){for(const f of friends())heal(b,a,f,110*a.star);for(const f of foes()){f.mark=true;f.frazzle=Math.min(6,f.frazzle+2);damage(b,a,f,a.atk*1.1,'ult');}}
 else if(id===24){for(const f of foes()){const stacks=f.frazzle;f.frazzle=0;damage(b,a,f,a.atk*1.3*(1+stacks*.35),'ult');}}
 else if(id===17){for(const f of friends())if(f.lupa<3){f.lupa++;f.atk*=1.1;}damage(b,a,target(),a.atk*2.4,'ult');}
 else if(id===18){const before=a.damage;for(const f of foes())damage(b,a,f,a.atk*1.3,'ult');const weak=friends().sort((x,y)=>x.hp/x.max-y.hp/y.max)[0];if(weak)heal(b,a,weak,(a.damage-before)*.5);}
 else if(id===19){a.buff=4;damage(b,a,target(),a.atk*2.6,'ult');}
 else if(id===20){const f=target();damage(b,a,f,a.atk*3*(f.hp/f.max<=.5?1.5:1),'ult');}
 else if(id===21){a.shield+=110*a.star;for(const f of foes())damage(b,a,f,a.atk*1.6,'ult');energy(b,a,10);}
 else if(id===23){for(const f of friends())f.shield+=90*a.star;energy(b,a,15);for(const f of friends()){const t=target();if(!t)break;damage(b,f,t,f.atk*.4,'extra');}}
 else{a.buff=4;if(id===1||id===7)for(const f of foes())damage(b,a,f,a.atk*1.6,'ult');else damage(b,a,target(),a.atk*2.6,'ult');}
}
const EXTRA_ON_BUFF=[1,6,7,12,13,14,19,22],BUFF_EXTRA_KIND=[12,14,19];
export function step(b){if(b.ended)return [];b.events=[];b.tick++;const actors=b.fighters.filter(f=>f.hp>0);for(let i=actors.length-1;i>0;i--){const j=Math.floor(b.rng()*(i+1));[actors[i],actors[j]]=[actors[j],actors[i]];}for(const a of actors){if(a.hp<=0)continue;const foes=()=>b.fighters.filter(f=>f.side!==a.side&&f.hp>0);const friends=()=>b.fighters.filter(f=>f.side===a.side&&f.hp>0);const target=()=>foes().sort((x,y)=>Math.floor(x.slot/6)-Math.floor(y.slot/6)||Math.abs(x.slot%6-a.slot%6)-Math.abs(y.slot%6-a.slot%6))[0];if(!target())break;const c=ctxOf(b,a),pl=!c.npc,h=HEROES[a.id];a.hits++;a.mana++;let base=a.atk*(pl&&active(c.counts,'연격')&&h.role==='연격'?1.25:1);if(a.id===3){a.charge=Math.min(10,a.charge+1);base*=1+a.charge*.045;}if(a.buff>0){a.buff--;if([3,5].includes(a.id))base*=1.65;}const victim=target();damage(b,a,victim,base,'hit');if(a.id===24&&victim)victim.frazzle=Math.min(6,victim.frazzle+1);if(a.id===5&&a.buff>0)heal(b,a,a,a.max*.04);
 if(pl&&((active(c.counts,'기류')&&a.hits%3===0)||(c.mods.has('bloom')&&h.role==='연격')))damage(b,a,target(),a.atk*(c.mods.has('bloom')?.35:.6),'extra');
 if(a.buff>0&&EXTRA_ON_BUFF.includes(a.id)){if(a.id===7)for(const f of foes())damage(b,a,f,a.atk*.5,'extra');else damage(b,a,target(),a.atk*.7,BUFF_EXTRA_KIND.includes(a.id)?'extra':'coop');}
 if(a.mana>=a.threshold&&foes().length){a.mana=0;emit(b,{from:a.uid,kind:'skill',name:h.skill});liberate(b,a,h,foes,friends,target);
 if(a.chain>=6&&foes().length&&a.hp>0){emit(b,{from:a.uid,kind:'skill',name:`${h.skill} · 메아리`,echo:true});a.atk*=.6;liberate(b,a,h,foes,friends,target);a.atk/=.6;}
 if(a.chain>=3&&a.hp>0){const team=friends().filter(f=>f.uid!==a.uid).sort((x,y)=>((x.slot-a.slot+12)%12)-((y.slot-a.slot+12)%12)),next=team[0],t=target();if(next&&t){emit(b,{from:next.uid,to:t.uid,kind:'intro',name:'변주 입장'});damage(b,next,t,next.atk*.8,'extra');}}
 if(a.chain>=5)energy(b,a,8);
 if(pl){if(active(c.counts,'전도'))energy(b,a,10);if(active(c.counts,'회절'))for(const f of friends())heal(b,a,f,40*a.star);if(a.echo==='bell')energy(b,a,8);let supports=friends().filter(f=>f.uid!==a.uid&&HEROES[f.id].role==='협동');if(!active(c.counts,'협동'))supports=supports.filter(f=>f.id===9&&f.buff>0).slice(0,1);else supports=supports.slice(0,2);for(const support of supports){const f=target();if(!f)break;damage(b,support,f,support.atk*(support.id===9&&support.buff>0?1.5:1),'coop');if(support.id===9&&support.buff>0)support.buff--;}}
 }
 if(finishCheck(b))break;
 }finishCheck(b);emit(b,{kind:'sync'});return b.events;}
// Runs a duel to the end, firing each side's concerto as soon as it is full.
export function runDuel(a,o,rng=Math.random){const b=makeDuel(a,o,rng),events=[];while(!b.ended){events.push(...step(b));for(const side of ['ally','enemy'])if(!b.ended&&(side==='ally'?b:b.foe).energy>=100)events.push(...burst(b,side));}return {b,events};}
// Life lost by the loser: base by round plus surviving winner stars.
export function duelDamage(b,loser,round){const winner=loser==='ally'?'enemy':'ally';const stars=b.fighters.filter(f=>f.side===winner&&f.hp>0).reduce((n,f)=>n+f.star,0);return 2+Math.floor(round/3)*2+(b.winner==='draw'?0:stars);}
export function multiIncome(s,won){const streak=Math.abs(s.streak||0);return 5+Math.min(5,Math.floor(s.gold/10))+(won?1:0)+(streak>=5?2:streak>=3?1:0)+(s.augments.includes('wealth')?3:0);}
export function settle(s,b){if(s.phase!=='battle'||!b.ended)return null;const won=b.winner==='ally';if(won)s.wins++;else s.life=Math.max(0,s.life-(s.round%3===0?22:14));const income=6+(won?2:0)+Math.min(3,Math.floor(s.gold/10))+(s.elite&&won?4:0)+(s.augments.includes('wealth')?3:0);s.gold+=income;s.phase='result';return {won,income,ended:s.life<=0||s.round===9};}
export function advance(s,elite=false){if(s.phase!=='reward'||s.round>=9||s.life<=0)return false;s.round++;s.phase='prep';s.elite=elite;if(!s.locked)s.shop=roll(s);return true;}

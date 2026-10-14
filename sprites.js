// Pixel battle layer: every fighter becomes a hand-made 24×32 chibi that stands on its tile,
// marches to the front line, lunges or shoots at its target, and falls when defeated.
// Each resonator is assembled from pixel-art parts (body · back hair · front hair · signature items · weapon)
// drawn as text grids below, so there are no image files. Animated with the Web Animations API.
const W=24,H=32,LINE='#0d0f18';

// ── pixel codes ──────────────────────────────────────────────────────
// s S skin · k line · w eye light · e eye · r blush · u mouth · c C cloth · d D cloth2 · t T trim
// p P pants · b B boots · h H g hair · o O gold · y Y white · x X glow · m M metal · n wood
// z Z horn/black · i I pink · l leaf · f F red · v V blue · a A top (defaults to cloth) · '.' empty
const HEAD=[
 '........................','........................','........................','........................',
 '........................','........................',
 '.......ssssssssss.......',
 '......ssssssssssss......',
 '......ssssssssssss......',
 '......ssssssssssss......',
 '......sskksssskkss......',
 '......sswesssswess......',
 '......sreesssseers......',
 '......sssssuusssss......',
 '.......ssssssssss.......',
 '..........SSSS..........'
];
const ARMS=['.......aaattttaaa.......','.....AAaaaattaaaaAA.....','.....AAaaaattaaaaAA.....','.....AAaaaattaaaaAA.....','.....AAddddddddddAA.....','.....ssaaaaaaaaaass.....'];
const BODY={
 short:[...HEAD,...ARMS,
  '.....cccccccccccccc.....','....cccccccccccccccc....','....CCCCCCCCCCCCCCCC....',
  '.........ss..ss.........','.........ss..ss.........','.........bb..bb.........','.........bb..bb.........',
  '........bbb..bbb........','........BBB..BBB........','........................'],
 dress:[...HEAD,...ARMS,
  '.....cccccccccccccc.....','....cccccccccccccccc....','....cccccccccccccccc....','...cccccccccccccccccc...',
  '...cccccccccccccccccc...','..CCCCCCCCCCCCCCCCCCCC..','..tttttttttttttttttttt..',
  '........bbb..bbb........','........BBB..BBB........','........................'],
 coat:[...HEAD,
  '.......cccddddccc.......','.....CCcccddddcccCC.....','.....CCcccddddcccCC.....','.....CCcccddddcccCC.....',
  '.....CCcccttttcccCC.....','.....sscccppppcccss.....',
  '......cccppppppccc......','......cccppppppccc......','......CCCppppppCCC......',
  '.....CCC.pp..pp.CCC.....','.....CC..pp..pp..CC.....','.........pp..pp.........','.........PP..PP.........',
  '........bbb..bbb........','........BBB..BBB........','........................'],
 suit:[...HEAD,
  '.......ccddttddcc.......','.....CCcccdttdcccCC.....','.....CCcccdttdcccCC.....','.....CCccccttccccCC.....',
  '.....CCccccccccccCC.....','.....ssppppppppppss.....',
  '......pppppppppppp......','......pppppppppppp......','.......pppp..pppp.......',
  '........ppp..ppp........','........ppp..ppp........','........ppp..ppp........','........PPP..PPP........',
  '........bbb..bbb........','........BBB..BBB........','........................']
};
const TOP=['........................','........................','.........hhhhhh.........','.......hhhhhhhhhh.......','......hhhhgghhhhhh......','.....hhhghhhhhhhhhh.....'];
const LOCKS=['....hh............hh....','....hh............hh....','....Hh............hH....','....HH............HH....','....HH............HH....','.....H............H.....'];
const FRONT={
 full:[...TOP,'....hhhhhhhhhhhhhhhh....','....hhhhhhhhhhhhhhhh....','....hhhhhhhhhhhhhhhh....','....hhh.hhh..hhh.hhh....','....hh............hh....',...LOCKS],
 side:[...TOP,'....hhhhhhhhhhhhhhhh....','....hhhhhhhhhhhhhhhh....','....hhhhhhhhhhhhhhhh....','....hhhhhhhh.hhh.hhh....','....hhhh..........hh....','....hhh...........hh....',...LOCKS.slice(1)],
 parted:[...TOP,'....hhhhhhhhhhhhhhhh....','....hhhhhhh..hhhhhhh....','....hhhhhh....hhhhhh....','....hhhhh......hhhhh....','....hhh..........hhh....',...LOCKS],
 bob:[...TOP,'....hhhhhhhhhhhhhhhh....','....hhhhhhhhhhhhhhhh....','....hhhhhhhhhhhhhhhh....','....hhh.hhh..hhh.hhh....','....hh............hh....','....hh............hh....','....hh............hh....','....HH............HH....','.....H............H.....'],
 male:[...TOP,'.....hhhhhhhhhhhhhh.....','.....hhhhhhhhhhhhhh.....','.....hhhhhhhhhhhhhh.....','.....hh.hhh.hhh.hhh.....','.....h............h.....','.....H............H.....'],
 spiky:['........................','.......h...h..h...h.....','......hh..hhhhh..hh.....','.....hhhhhhhhhhhhhh.....','....hhhhhgghhhhhhhhh....','...hhhhhhgghhhhhhhhhh...',
  '....hhhhhhhhhhhhhhhh....','...hhhhhhhhhhhhhhhhhh...','....hhhhhhhhhhhhhhhh....','....hhh.hh.hh.hh.hhh....','....hh............hh....','....h..............h....','....h..............h....']
};
// Back hair is drawn behind the body as simple shapes.
const BACK={
 long:put=>{for(let y=5;y<=21;y++)for(let x=3;x<=20;x++)put(x,y,x===3||x===20||y>=20?'H':'h');for(let x=3;x<=20;x+=2)put(x,22,'H');},
 wave:put=>{BACK.long(put);for(let y=8;y<=22;y++){if(y%4<2){put(2,y,'H');put(21,y,'H');}}},
 bob:put=>{for(let y=4;y<=15;y++)for(let x=4;x<=19;x++)put(x,y,y>=14?'H':'h');for(let x=4;x<=19;x+=2)put(x,16,'H');},
 short:put=>{for(let y=3;y<=11;y++)for(let x=5;x<=18;x++)put(x,y,'h');},
 twin:put=>{BACK.short(put);for(const [a,b] of [[1,4],[19,22]])for(let y=6;y<=22;y++)for(let x=a;x<=b;x++){const edge=x===a||x===b;if(y<9&&(a===1?x<3:x>20))continue;if(y>20&&(a===1?x===1||x===4:x===19||x===22))continue;put(x,y,edge?'H':'h');}},
 drill:put=>{BACK.short(put);for(const [a,b] of [[1,4],[19,22]])for(let y=9;y<=23;y++)for(let x=a;x<=b;x++){if(y===23&&(x===a||x===b))continue;put(x,y,y%3===0?'H':x===a||x===b?'H':'h');}},
 pony:put=>{BACK.short(put);for(let y=1;y<=4;y++)for(let x=16;x<=20;x++)put(x,y,'h');for(let y=5;y<=19;y++)for(let x=19;x<=22;x++){if(y>16&&x===19)continue;put(x,y,x===22?'H':'h');}},
 lowtail:put=>{BACK.short(put);for(let y=11;y<=23;y++)for(let x=17;x<=20;x++){if(y>20&&(x===17||x===20))continue;put(x,y,x===20?'H':'h');}},
 braid:put=>{BACK.short(put);for(let y=12;y<=27;y++)for(let x=18;x<=20;x++)put(x,y,(Math.floor(y/2)+x)%2?'h':'H');put(19,28,'t');}
};
const ITEM={
 tiara:['o.o','.oo','..O'],
 horns:['zZ..','zzZ.','.zz.','..z.'],
 crown:['.o..o..o..o.','.o..oo.oo.o.','oooooooooooo','OtOOOtOOOtOO'],
 thorns:['t...t..t...t','.t.tttttt.t.','..tttttttt..'],
 elfear:['S...','sss.'],
 hat:['........yyyyyyyy........','......yyyyyyyyyyyy......','......yyyyyyyyyyyy......','......dddddddddddd......','..yyyyyyyyyyyyyyyyyyyy..','.YYYYYYYYYYYYYYYYYYYYYY.'],
 bow:['tt.tt','tTtTt','tt.tt'],
 darkbow:['dd.dd','dDdDd','dd.dd'],
 flower:['.f.','fof','.f.'],
 feather:['..t','.tT','tT.','T..'],
 ears:['h..','hh.','hih'],
 butterfly:['x.x','XxX','x.x'],
 laurel:['.o.','oo.','.oo','oo.'],
 glasses:['.kkkk..kkkk.','.k..kkkk..k.'],
 headpiece:['.dddd..dddd.','ddyyd..dyydd','.dddddddddd.'],
 flowers:['.i...i...i.','iyi.iyi.iyi'],
 sheep:['.yyy.','yyzyy','yzzzy','.y.y.'],
 jelly:['.xxx.','xXXXx','x.x.x','.x.x.'],
 puppet:['.zz.','zxxz','.zz.','.z.z'],
 gaunt:['ttt','tTt'],
 sword:['.m.','.mM','.mM','.mM','.mM','.mM','.mM','.mM','ttt','.n.','.n.'],
 broad:['mmM','mmM','mmM','mmM','mmM','mmM','mmM','mmM','.M.','ttt','.n.','.n.'],
 spear:['.m.','mmm','.m.','.t.','tnt',...Array(19).fill('.n.')],
 gun:['zzzzzM','zzt...','z.....'],
 staff:['.x.','xXx','.x.',...Array(18).fill('.n.')],
 cross:['.o.','ooo','.o.',...Array(18).fill('.n.')],
 flowerstaff:['.i.','iyi','.l.',...Array(18).fill('.n.')],
 brush:['.z.','zzz','zzz','.t.',...Array(12).fill('.n.')],
 orb:['.x.','xXx','.x.'],
 spark:['X'],
 moon:['.oo.','o...','o...','.oo.'],
 lyre:['o.y.o','oyyyo','oyyyo','.ooo.'],
 veil:['........yyyyyyyy........','......yyyyyyyyyyyy......','.....yyyyyyyyyyyyyy.....','....yyyYyyyyyyyyyyyy....',...Array(11).fill('...yyy............yyy...'),'...YYY............YYY...','...YY..............YY...'],
 bigbow:['ff.ff','fFfFf','ff.ff','.f.f.'],
 pinkbow:['ii.ii','iIiIi','ii.ii'],
 hornsGold:['MM..','MoM.','.MM.','..M.'],
 band:['....zzzzzzzzzzzzzzzz....'],
 redband:['....zzzzzzzfzzzzzzzz....'],
 xclip:['v.v','.v.','v.v'],
 lily:['.y.y.','yyoyy','.yly.','..l..'],
 bun:['.hhh.','hhhhh','.yyy.'],
 halo:['....oooooooooo....','..oo..........oo..','.o..............o.','o................o','o................o'],
 ribbon:['fF','.f'],
 blueribbon:['vV','.v','.v'],
 mark:['f'],
 tassel:['f','f','F'],
 blacktassel:['z','z','k'],
 ornament:['.z.','zoz','.z.'],
 glove:['zz','zo'],
 gauntBig:['ZMMZ','MmmM','MxxM','MxxM','ZMMZ'],
 shoulder:['MMM','mMM'],
 collar:['zzzz'],
 earsDark:['.zz.','zooz','zooz'],
 bud:['y']
};
const pair=(name,x,y,rx)=>[[name,x,y],[name,rx,y,1]];
// [item, x, y, mirror?] — weapons live in the same list; `weapon` decides melee vs ranged motion.
export const LOOK={
 jinhsi:{body:'dress',front:'full',back:'long',weapon:'sword',pal:{h:'#eef0f6',a:'#1e1c24',c:'#f2efe6',d:'#d9b45a',t:'#d9b45a',e:'#e0b04a',b:'#e9e4d4'},items:[...pair('tiara',4,3,17),['blueribbon',4,6],['collar',10,15],['sword',18,11]]},
 changli:{body:'dress',front:'side',back:'long',weapon:'sword',pal:{h:'#e8706a',g:'#f8c8b8',a:'#26212c',c:'#b8323a',d:'#26212c',t:'#e9c45a',e:'#e8b040',b:'#26212c'},items:[['feather',16,2],['tiara',17,3,1],['sword',18,11]]},
 shorekeeper:{body:'dress',front:'full',back:'long',weapon:'orb',pal:{h:'#9cc6f2',a:'#eef4fb',c:'#e2ecf8',d:'#a8c8ee',t:'#7ab8f0',e:'#6aa8f0',b:'#c8daf0',x:'#5ab8ff'},items:[['veil',0,1],['butterfly',16,2],['butterfly',20,11],['orb',19,15],['spark',21,13]]},
 camellya:{body:'short',front:'full',back:'bob',weapon:'sword',pal:{h:'#f0eef2',g:'#2b2229',H:'#3a2c34',c:'#1b1418',d:'#c3243c',t:'#d82e46',e:'#d23a4a',b:'#1b1418'},items:[['flower',15,4],['flower',5,7],['sword',18,11]]},
 carlotta:{body:'dress',front:'parted',back:'wave',weapon:'gun',pal:{h:'#e2dcec',a:'#a8203a',c:'#f3eef2',d:'#2a2228',t:'#2a2228',e:'#9a6ad8',b:'#2a2228'},items:[['bigbow',2,2],['glove',17,21],['gun',17,20]]},
 cartethyia:{body:'dress',front:'full',back:'long',weapon:'sword',pal:{h:'#f2dc92',a:'#eef3f8',c:'#eef3f8',d:'#3c4bb0',t:'#4b5ad8',e:'#6aa8e8',b:'#e8ecf4'},items:[['elfear',1,10],['elfear',19,10,1],['thorns',6,2],['collar',10,15],['sword',18,11]]},
 phrolova:{body:'dress',front:'side',back:'long',weapon:'orb',pal:{h:'#4a2f78',a:'#1a1222',c:'#1a1222',d:'#b8304c',t:'#f2ece4',e:'#c8406a',b:'#1a1222',x:'#ff5a7a'},items:[['halo',3,0,0,1],['ribbon',16,4],['ribbon',5,5,1],['orb',19,15],['spark',21,13]]},
 jiyan:{male:true,body:'coat',front:'male',back:'pony',weapon:'spear',pal:{h:'#2f9a8e',c:'#1c2a2a',d:'#2a8f86',t:'#c9a24a',e:'#e0b04a',p:'#1c2422',b:'#141a1a'},items:[['spear',18,3]]},
 yinlin:{body:'short',front:'side',back:'long',weapon:'orb',pal:{h:'#d42a38',a:'#2a1a2e',c:'#2a1a2e',d:'#c9a24a',t:'#b56cf5',e:'#b47aff',b:'#1a1020',x:'#c47aff'},items:[['redband',0,6],['puppet',19,10]]},
 zhezhi:{body:'dress',front:'full',back:'long',weapon:'staff',pal:{h:'#1c2030',g:'#2f8f8a',a:'#e7f1f2',c:'#e7f1f2',d:'#2f7c7a',t:'#3fa3a0',e:'#6a8a9a',b:'#e7f1f2'},items:[['bun',15,0],['glasses',6,10],['brush',18,8]]},
 verina:{body:'short',front:'full',back:'twin',weapon:'staff',pal:{h:'#e2e6a0',a:'#f3f6e6',c:'#f3f6e6',d:'#7cbf4a',t:'#7cbf4a',e:'#6ab84a',b:'#f3f6e6'},items:[['flowers',6,3],['lily',9,0],['flowerstaff',18,6]]},
 rover:{male:true,body:'coat',front:'male',back:'short',weapon:'sword',pal:{h:'#1c1c24',g:'#3a3a48',c:'#1e1d26',d:'#2a2933',t:'#d6b685',e:'#e0c080',p:'#1d1c24',b:'#121117'},items:[['sword',18,11]]},
 encore:{body:'short',front:'full',back:'twin',weapon:'gun',pal:{h:'#f5a0b8',a:'#2a2228',c:'#f2ece4',d:'#2a2228',t:'#f07aa0',e:'#9a6ad8',b:'#2a2228'},items:[['pinkbow',15,1],['sheep',0,19],['gun',17,20]]},
 mortefi:{male:true,body:'coat',front:'male',back:'short',weapon:'gun',pal:{h:'#c8282e',g:'#e85a50',c:'#eeeae4',d:'#1e1c22',t:'#c8282e',e:'#e0b04a',p:'#1e1c22',b:'#16141a'},items:[['glasses',6,10],['glove',17,21],['gun',17,20],['gun',1,20,1]]},
 xiangliyao:{male:true,body:'coat',front:'male',back:'short',weapon:'fist',pal:{h:'#a9a6ad',g:'#d0ced4',c:'#e8e8ee',d:'#1c2a5a',t:'#5a8cff',e:'#8a8af0',p:'#1c1c26',b:'#1c1c26',x:'#5ab0ff'},items:[['gauntBig',16,18],['spark',21,17]]},
 sanhua:{body:'dress',front:'parted',back:'long',weapon:'sword',pal:{h:'#e8ecf2',a:'#1a1a20',c:'#1a1a20',d:'#2a2a34',t:'#d9b45a',e:'#d23a4a',b:'#1a1a20'},items:[['ornament',15,3],['blacktassel',17,6],['mark',11,8],['sword',18,11]]},
 phoebe:{body:'dress',front:'full',back:'long',weapon:'staff',pal:{h:'#f3d77a',a:'#f6f3ea',c:'#f6f3ea',d:'#2e3488',t:'#3a3f9e',e:'#8a7af0',b:'#2e3488'},items:[['hat',0,0],['xclip',15,7],['collar',10,15],['cross',18,6]]},
 lupa:{body:'short',front:'side',back:'long',weapon:'sword',pal:{h:'#d42c46',a:'#f2eee8',c:'#2a1f24',d:'#2a1f24',t:'#b32035',e:'#c8504a',b:'#2a1f24'},items:[...pair('hornsGold',3,0,17),['ribbon',16,5],['broad',18,10]]},
 cantarella:{body:'dress',front:'side',back:'wave',weapon:'orb',pal:{h:'#c8acf2',a:'#ece6ff',c:'#2e2a6a',d:'#2e2a6a',t:'#8a7af0',e:'#a88af5',b:'#2e2a6a',x:'#b9a0ff'},items:[['headpiece',6,1],['jelly',19,8]]},
 lingyang:{male:true,body:'coat',front:'spiky',back:'short',weapon:'fist',pal:{h:'#eef1f5',c:'#f4f4f4',d:'#1d1d1d',t:'#d23a3a',e:'#9aa8c0',p:'#1d1d1d',b:'#1d1d1d'},items:[...pair('earsDark',3,0,17),['band',0,6],['tassel',19,12],['gaunt',4,20],['gaunt',17,20]]},
 calcharo:{male:true,body:'coat',front:'male',back:'long',weapon:'sword',pal:{h:'#d6d6e4',c:'#1a1824',d:'#3a3650',t:'#9a7bff',e:'#e0b04a',p:'#15131c',b:'#0e0c14'},items:[['shoulder',4,16],['broad',18,10]]},
 augusta:{body:'dress',front:'side',back:'long',weapon:'spear',pal:{h:'#d8452a',a:'#f2eee4',c:'#f2eee4',d:'#2a2420',t:'#e3b53c',e:'#e8b040',b:'#2a2420'},items:[['crown',6,0],['spear',18,3]]},
 iuno:{body:'dress',front:'full',back:'long',weapon:'orb',pal:{h:'#2f3a92',g:'#4553b8',a:'#f0f2fb',c:'#f0f2fb',d:'#2f3a92',t:'#d4b058',e:'#8aa8ff',b:'#f0f2fb'},items:[...pair('laurel',3,4,18),['moon',19,13]]},
 ciaccona:{body:'short',front:'side',back:'braid',weapon:'staff',pal:{h:'#cc2c58',a:'#f2ece0',c:'#2f6b5a',d:'#2f6b5a',t:'#e9d6a0',e:'#4fd0a0',b:'#2a2420'},items:[...pair('horns',3,0,17),['bud',4,1],['bud',19,1],['elfear',1,10],['elfear',19,10,1],['lyre',17,17]]},
 zani:{body:'suit',front:'side',back:'long',weapon:'fist',pal:{h:'#eeeef2',c:'#1e1c22',d:'#f2f0ec',t:'#c8282e',e:'#c0603a',p:'#1e1c22',b:'#151318'},items:[...pair('horns',3,0,17),['glove',5,21],['glove',17,21]]}
};
const MELEE=new Set(['sword','spear','fist']);
function mix(hex,k){const n=parseInt(hex.slice(1),16),c=[n>>16,n>>8&255,n&255].map(v=>Math.round(k<0?v*(1+k):v+(255-v)*k));return '#'+c.map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('');}
function palette(P){
 const h=P.h,c=P.c,d=P.d||c,t=P.t||'#e9cf8e',p=P.p||mix(c,-.4),b=P.b||'#2b2836',x=P.x||t;
 const a=P.a||c;
 return {a,A:mix(a,-.24),v:'#4a7ae0',V:'#2c4ea8',I:'#c85a80',s:'#f8dccb',S:'#e6b8a4',k:'#2a2033',w:'#ffffff',e:P.e||'#3a3550',r:P.male?'#f8dccb':'#f2a3a0',u:'#c46a72',
  c,C:mix(c,-.24),d,D:mix(d,-.28),t,T:mix(t,-.3),p,P:mix(p,-.25),b,B:mix(b,-.4),
  h,H:P.H||mix(h,-.26),g:P.g||mix(h,.3),o:'#e9c45a',O:'#a8822e',y:'#f6f3ea',Y:'#cfc9bb',x,X:mix(x,.55),
  m:'#e3eaf3',M:'#9aa6b8',n:'#7a5a3a',z:'#2b2530',Z:'#6b5f72',i:'#f5a3c0',l:'#62c46e',f:'#d8344a',F:'#8a1a2a'};
}

// ── 잔상 · 명식 도트: 모양 7종을 속성 색으로 칠하고 명식은 장식을 더한다 ──
// c 속성색 · C 그늘 · t 밝은 속성색 · d 어두운 몸 · D 더 어두운 · x 발광 · X 밝은 발광 · y 흰색 · k 검정 · o 금색
const SHAPE={
 blob:['.........d....d.........','........cccccccc........','......cccccccccccc......','.....cccccccccccccc.....','....ccyyccccccccyycc....','....ccykccccccccykcc....',
  'd...ccccccckkccccccc...d','dd..cccttttttttttccc..dd','d...ccttttttttttttcc...d','....cCttttttttttttCc....','.....CCttttttttttCC.....','......CCCCCCCCCCCC......','........CCCCCCCC........','..........dddd..........'],
 prism:['...........tt...........','..........cttc..........','.........ccttcc.........','........cccttccc........','.......ccccttcccc.......','......cccccttccccc......',
  '.....cccccxxxxccccc.....','....ccccccxXXxccccCC....','....cccccxXXXXxcccCC....','.....ccccccxxcccCCC.....','......ccccccccCCCC......','.......cccccCCCCC.......','........ccccCCCC........',
  '.........cccCCC.........','..........ccCC..........','...........cC...........','........................','.........t....t.........'],
 beast:['................d.d.....','...............dcdcd....','..............dccccccd..','.d...........dccccykcct.','dd..........dcccccccccc.','.dd.........dcccccccttt.',
  '..ddcccccccccccccccc....','...ccccccccccccccccc....','...cccccccccccccccc.....','...CccccccccccccccC.....','...CCcccccccccccCCC.....','....CC.CC....CC.CC......',
  '....CC.CC....CC.CC......','....dd.dd....dd.dd......','....dd.dd....dd.dd......'],
 knight:['..........tttt..........','.........dddddd.........','........dddddddd........','.......dddddddddd.......','.......ddtddddtdd.......','.......dddddddddd.......',
  '........dddkkddd........','......CCccccccccCC......','....CCCccccttccccCCC....','....CCcccccttcccccCC....','....dd.ccccttcccc.dd....','....dd.ccccttcccc.dd....',
  '....dd.ccccttcccc.dd....','....tt.dddddddddd.tt....','.......cccccccccc.......','......cccccccccccc......','......cccc....cccc......','......CCC......CCC......',
  '......ddd......ddd......','......ddd......ddd......','.....dddd......dddd.....'],
 bird:['..............ddd.......','.............dkdtt......','..............dd........','..............dd........','.............ddd........','............dddd........',
  '.cc........ccccc.....cc.','cccc.....ccccccccc..cccc','ccccccccccccccccccccccc.','.CCcccccccccccccccccCC..','...CCCcccccccccccCCC....','.......CCcccccccCC......',
  '..........CCCCC.........','..........d...d.........','..........d...d.........','..........d...d.........','..........d...d.........','..........d...d.........',
  '.........dd..dd.........'],
 turtle:['..........oo............','.........oooo...........','.........oOOo...........','........dddddddd........','......ddccccccccdd......','.....dccttccccttccd.....',
  '....dccccccttccccccd....','...dcctcccccccccctccd...','...dccccccttttccccccd...','..ddddddddddddddddddd...','..CCCCCCCCCCCCCCCCCCdyk.','...CC.CC.......CC.CCdd..',
  '...CC.CC.......CC.CC....','...dd.dd.......dd.dd....'],
 dragon:['..................dd....','.................dccd...','................dcykcc..','................dccccctt','...............dcccccd..','..............dcccd.....',
  '.............dcccd......','...t........dcccd.......','..tct......dcccd........','..tcct....dcccd.........','...ccct..dcccd..........','....cccccccccd..........',
  '.....ccccccccc..........','......CCCCCCCC..........','.....tt.....tt..........']
};
const FOE_ITEM={
 crown:['o.o.o.o','ooooooo'],flame:['.x.x.','xXxXx','.xXx.'],halo:['..oooooo..','.o......o.','o........o'],mask:['yyyyyyyy'],
 horns:['d......d','dd....dd','.d....d.'],bell:['.oo.','oOOo']
};
// key → [shape, [[item, x, yFromTop]], 명식 여부]
const FOE_LOOK={crownless:['knight',[['crown',8,-2]]],rider:['knight',[['flame',9,-3]]],dreamless:['knight',[['mask',8,4]]],fallacy:['knight',[['halo',7,-3]]],
 heron:['bird',[]],aix:['beast',[['horns',13,-2]]],turtle:['turtle',[]],mephis:['dragon',[]],jue:['dragon',[['crown',15,-2]]],
 warrior:['knight',[]],wailer:['knight',[['horns',8,-1]]],bard:['knight',[['halo',7,-3]]],hunter:['knight',[]],drake:['dragon',[]]};
function foeGrid(info){
 const [shape,items]=FOE_LOOK[info.key]||[info.shape,[]],rows=SHAPE[shape]||SHAPE.blob,top=H-1-rows.length;
 const c=info.color,boss=info.kind==='overlord',elite=info.kind==='elite';
 const pal={c,C:mix(c,-.32),t:mix(c,.45),x:mix(c,.15),X:mix(c,.65),d:boss?'#1c1724':elite?'#2a2333':'#3a3446',D:'#141019',y:'#f6f3ea',k:'#121018',o:'#e9c45a',O:'#a8822e'};
 const g=Array.from({length:H},()=>Array(W).fill(null));
 const stamp=(art,ox,oy)=>art.forEach((row,j)=>[...row].forEach((ch,i)=>{const X=ox+i,Y=oy+j;if(ch!=='.'&&pal[ch]&&X>=0&&Y>=0&&X<W&&Y<H)g[Y][X]=pal[ch];}));
 stamp(rows,0,top);for(const [name,x,dy] of items)stamp(FOE_ITEM[name],x,top+dy);
 const out=g.map(r=>r.slice());for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(!g[y][x]&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>g[y+dy]?.[x+dx]))out[y][x]=LINE;
 return out;
}
const cache=new Map();
// Builds the 24×32 pixel grid (array of rows of color strings or null). Exported for the sprite sheet tool.
export function spriteGrid(key){
 if(typeof key==='object')return foeGrid(key);
 const L=LOOK[key];if(!L)return null;const pal=palette({...L.pal,male:L.male});
 const g=Array.from({length:H},()=>Array(W).fill(null));
 const put=(x,y,code)=>{if(x>=0&&y>=0&&x<W&&y<H&&pal[code])g[y][x]=pal[code];};
 const stamp=(rows,ox=0,oy=0,flip=false)=>rows.forEach((row,j)=>{const r=flip?[...row].reverse():[...row];r.forEach((ch,i)=>{if(ch!=='.')put(ox+i,oy+j,ch);});});
 BACK[L.back]?.(put);
 for(const [name,x,y,flip,back] of L.items)if(back)stamp(ITEM[name],x,y,!!flip);
 stamp(BODY[L.body]);
 stamp(FRONT[L.front]);
 for(const [name,x,y,flip,back] of L.items)if(!back)stamp(ITEM[name],x,y,!!flip);
 // 1px dark outline around the silhouette
 const out=g.map(row=>row.slice());
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(!g[y][x]&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>g[y+dy]?.[x+dx]))out[y][x]=LINE;
 return out;
}
export function spriteUrl(key){
 const ck=typeof key==='object'?'foe:'+key.key:key;if(cache.has(ck))return cache.get(ck);
 const grid=spriteGrid(key)||spriteGrid('rover');
 const c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d');
 grid.forEach((row,y)=>row.forEach((col,x)=>{if(col){ctx.fillStyle=col;ctx.fillRect(x,y,1,1);}}));
 const url=c.toDataURL();cache.set(ck,url);return url;
}
export const SPRITE_SIZE={W,H};

// Hand-made sprite images (assets/sprites/<key>.png, listed in index.json) replace the code-drawn pixels when present.
// Each entry: {w,h,fx} — image size and the feet's horizontal position (0..1) so weapons/effects don't shift the stance.
const ART={};
// Enemy portraits (assets/enemies/<key>.png, index.json) are shown as round tokens in battle.
const FOE_ART={};
if(typeof document!=='undefined'){fetch('assets/sprites/index.json').then(r=>r.ok?r.json():{}).then(m=>Object.assign(ART,m)).catch(()=>{});fetch('assets/enemies/index.json').then(r=>r.ok?r.json():{}).then(m=>Object.assign(FOE_ART,m)).catch(()=>{});}
const ART_BASE=250;// source sheet cell height that maps to one 24×32 sprite height
export class SpriteStage{
 constructor(arena,heroes){
  this.arena=arena;this.info=typeof heroes==='function'?heroes:id=>heroes[id];this.enabled=true;this.speed=1;this.units=new Map();
  this.layer=document.createElement('div');this.layer.id='sprites';this.layer.setAttribute('aria-hidden','true');arena.append(this.layer);
  new ResizeObserver(()=>this.layout()).observe(arena);
 }
 clear(){this.layer.replaceChildren();this.units.clear();this.arena.classList.remove('sprites-on');}
 // Center-bottom of a fighter's tile, relative to the arena.
 home(uid){const t=this.arena.querySelector(`.tile[data-uid="${uid}"]`);if(!t)return null;const a=this.arena.getBoundingClientRect(),b=t.getBoundingClientRect();return {x:b.left+b.width/2-a.left,y:b.top+b.height*.86-a.top,w:b.width,h:b.height};}
 mount(fighters,{phantom=false}={}){
  this.clear();this.arena.classList.add('sprites-on');
  for(const f of fighters){
   const h=this.info(f.id),foe=f.id>=100,look=foe?{weapon:h.shape==='knight'||h.shape==='beast'?'sword':'orb'}:LOOK[h.key]||{},art=foe?(FOE_ART[h.key]&&{...FOE_ART[h.key],token:true}):ART[h.key];
   const el=document.createElement('div');el.className=`sprite ${f.side}${f.side==='enemy'&&phantom?' phantom':''} walking`;el.style.setProperty('--hero',h.color);
   el.innerHTML=`<div class="sp-move"><div class="sp-hp"><i></i></div><img class="sp-body${art?' sp-art':''}${art?.token?' sp-token':''}" alt="" src="${art?.token?`assets/enemies/${h.key}.png`:art?`assets/sprites/${h.key}.png`:spriteUrl(foe?h:h.key)}"><span class="sp-star">${'★'.repeat(f.star)}</span></div><div class="sp-shadow"></div>`;
   el.querySelector('.sp-body').style.animationDelay=`${-Math.random()*1.1}s`;
   this.layer.append(el);
   this.units.set(f.uid,{el,move:el.firstElementChild,body:el.querySelector('.sp-body'),hp:el.querySelector('.sp-hp i'),side:f.side,melee:MELEE.has(look.weapon),max:f.max,dead:false,adv:0,art,scale:foe&&h.kind==='overlord'?1.4:1});
   if(foe&&h.kind==='overlord')el.classList.add('overlord');
  }
  this.layout();
  // March toward the front line, then settle into the idle bob.
  requestAnimationFrame(()=>{for(const u of this.units.values())u.adv=1;this.layout();});
  setTimeout(()=>{for(const u of this.units.values())u.el.classList.remove('walking');},700);
 }
 layout(){
  for(const [uid,u] of this.units){const pos=this.home(uid);if(!pos)continue;
   const k=Math.max(2,Math.min(5,Math.floor(pos.w*.8/W)));u.k=k;
   if(u.art?.token){u.hgt=Math.round(H*k*.78);u.wid=u.hgt;u.body.style.left='0px';}
   else if(u.art){u.hgt=Math.round(H*k*u.art.h/ART_BASE*1.12);u.wid=Math.round(u.hgt*u.art.w/u.art.h);u.body.style.left=`${Math.round((u.side==='enemy'?u.art.fx-.5:.5-u.art.fx)*u.wid)}px`;}
   else{u.hgt=H*k;u.wid=W*k;}
   if(u.scale!==1){u.hgt=Math.round(u.hgt*u.scale);u.wid=Math.round(u.wid*u.scale);}
   u.x=pos.x;u.y=Math.max(u.hgt+14,pos.y+(u.side==='ally'?-pos.h*.16:pos.h*.5)*u.adv);
   Object.assign(u.el.style,{left:`${u.x}px`,top:`${u.y}px`,zIndex:u.dead?0:Math.round(u.y)});u.body.style.width=`${u.wid}px`;u.body.style.height=`${u.hgt}px`;}
 }
 anim(el,frames,ms,opts={}){if(!el)return;el._a?.cancel();el._a=el.animate(frames,{duration:ms/this.speed,easing:'ease-out',...opts});return el._a;}
 sync(states){for(const s of states){const u=this.units.get(s.uid);if(!u)continue;u.hp.style.width=`${Math.max(0,s.hp/u.max*100)}%`;if(s.hp<=0&&!u.dead)this.fall(u);}}
 fall(u){u.dead=true;u.el.classList.add('down');const dir=u.side==='ally'?1:-1;this.anim(u.move,[{transform:'none',opacity:1},{transform:`translate(${dir*6}px,4px) rotate(${dir*80}deg)`,opacity:.35}],420,{fill:'forwards'});}
 strike(from,to,kind,color){
  const a=this.units.get(from),b=this.units.get(to);if(!a||!b||a.dead)return;
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
  if(this.enabled){
   if(a.melee&&kind!=='coop'){const reach=Math.max(0,len-(b.wid||72)*.7)/len;this.anim(a.move,[{transform:'none'},{transform:`translate(${dx*reach}px,${dy*reach}px) scale(1.06)`,offset:.45},{transform:'none'}],kind==='ult'?420:320);}
   else{this.anim(a.move,[{transform:'none'},{transform:`translate(${-dx/len*5}px,${-dy/len*5}px)`,offset:.3},{transform:'none'}],240);this.bolt(a,b,color,kind);}
  }
  if(b.dead&&kind!=='ult')return;
  this.flash(b);if(this.enabled&&!b.dead)this.anim(b.move,[{transform:'none'},{transform:`translate(${dx/len*(kind==='ult'?9:4)}px,${dy/len*(kind==='ult'?9:4)}px)`,offset:.35},{transform:'none'}],200,{delay:a.melee?110/this.speed:150/this.speed});
  if(kind==='ult'&&this.enabled)this.sparks(b,color,10);
 }
 flash(u){u.body.animate([{filter:'brightness(3.2) saturate(0)'},{filter:'none'}],{duration:180/this.speed,delay:110/this.speed});}
 bolt(a,b,color,kind){
  const el=document.createElement('i');el.className=`sp-bolt ${kind}`;el.style.setProperty('--c',color);el.style.left=`${a.x}px`;el.style.top=`${a.y-(a.hgt||96)*.55}px`;this.layer.append(el);
  const tx=b.x-a.x,ty=b.y-a.y-((b.hgt||96)-(a.hgt||96))*.55;
  el.animate([{transform:'translate(-50%,-50%)'},{transform:`translate(calc(-50% + ${tx}px),calc(-50% + ${ty}px))`}],{duration:170/this.speed,easing:'linear'}).onfinish=()=>el.remove();
 }
 sparks(u,color,n=8){const y=u.y-(u.hgt||96)*.5;for(let i=0;i<n;i++){const s=document.createElement('i');s.className='sp-spark';s.style.cssText=`left:${u.x}px;top:${y}px;--c:${color}`;this.layer.append(s);const ang=i/n*Math.PI*2,d=18+Math.random()*16;s.animate([{transform:'translate(-50%,-50%)',opacity:1},{transform:`translate(calc(-50% + ${Math.cos(ang)*d}px),calc(-50% + ${Math.sin(ang)*d}px))`,opacity:0}],{duration:420/this.speed,easing:'ease-out'}).onfinish=()=>s.remove();}}
 cast(uid,color){const u=this.units.get(uid);if(!u||u.dead)return;
  const ring=document.createElement('i');ring.className='sp-ring';ring.style.cssText=`left:${u.x}px;top:${u.y-4}px;--c:${color}`;this.layer.append(ring);ring.animate([{transform:'translate(-50%,-50%) scale(.2)',opacity:1},{transform:'translate(-50%,-50%) scale(1.6)',opacity:0}],{duration:520/this.speed}).onfinish=()=>ring.remove();
  if(this.enabled){this.anim(u.move,[{transform:'none'},{transform:'translateY(-16px) scale(1.12)',offset:.4},{transform:'none'}],380);this.sparks(u,color,8);}
 }
 heal(uid){const u=this.units.get(uid);if(!u||u.dead||!this.enabled)return;for(let i=0;i<3;i++){const s=document.createElement('i');s.className='sp-heal';s.style.cssText=`left:${u.x+(i-1)*9}px;top:${u.y-(u.hgt||96)*.6}px`;this.layer.append(s);s.animate([{transform:'translate(-50%,0)',opacity:1},{transform:'translate(-50%,-18px)',opacity:0}],{duration:520/this.speed,delay:i*70/this.speed}).onfinish=()=>s.remove();}}
 intro(from,to,color){const a=this.units.get(from);if(!a||a.dead)return;
  if(this.enabled){const ghost=a.body.cloneNode();ghost.className='sp-after';Object.assign(ghost.style,{left:`${a.x}px`,top:`${a.y}px`,width:a.body.style.width,height:a.body.style.height});this.layer.append(ghost);ghost.animate([{opacity:.7},{opacity:0}],{duration:360/this.speed}).onfinish=()=>ghost.remove();}
  this.strike(from,to,'extra',color);}
 rally(side){for(const u of this.units.values())if(u.side===side&&!u.dead&&this.enabled)this.anim(u.move,[{transform:'none'},{transform:'translateY(-12px)',offset:.35},{transform:'none'}],420);}
 // Floating damage / heal number above the sprite (tile popups are hidden while sprites are on).
 number(e){const u=this.units.get(e.to);if(!u||!e.amount)return;const el=document.createElement('span');el.className=`sp-num ${e.kind}`;el.textContent=`${e.kind==='heal'?'+':''}${e.amount}`;el.style.left=`${u.x+(Math.random()*18-9)}px`;el.style.top=`${u.y-(u.hgt||96)-6}px`;this.layer.append(el);el.animate([{transform:'translate(-50%,-100%) scale(1.25)',opacity:1},{transform:'translate(-50%,-100%) scale(1)',opacity:1,offset:.2},{transform:'translate(-50%,calc(-100% - 22px))',opacity:0}],{duration:760/this.speed,easing:'ease-out'}).onfinish=()=>el.remove();}
 victory(side){for(const u of this.units.values())if(u.side===side&&!u.dead){u.el.classList.add('cheer');}}
}
// Portrait image for an enemy tile: a dropped-in image (assets/sprites/<key>.png) or its code-drawn pixel sprite.
export const foeSrc=info=>FOE_ART[info.key]?`assets/enemies/${info.key}.png`:spriteUrl(info);

// Pixel battle layer: every fighter becomes a procedurally drawn 18×24 chibi that stands on its tile,
// marches to the front line, lunges or shoots at its target, and falls when defeated.
// Sprites are drawn once per resonator into a canvas (no image files) and animated with the Web Animations API.
const W=18,H=24,SKIN='#f7dcc9',BLUSH='#f0a7a0',EYE='#1c2236',LEG='#2b2836',BOOT='#16141d',LINE='#0a0e18';
export const LOOK={
 jinhsi:{hair:'#eef0f6',cloth:'#f3efe2',trim:'#d9b45a',style:'long',acc:'crown',weapon:'sword'},
 changli:{hair:'#d4503f',cloth:'#2a2230',trim:'#f06a4f',style:'long',acc:null,weapon:'sword'},
 shorekeeper:{hair:'#a6cbf4',cloth:'#2d3d6b',trim:'#d6ebff',style:'long',acc:'halo',weapon:'staff'},
 camellya:{hair:'#f0eef2',cloth:'#1d1519',trim:'#d12a44',style:'short',acc:'bow',weapon:'sword'},
 carlotta:{hair:'#ddd5ee',cloth:'#f3eef8',trim:'#7a4ab0',style:'twin',acc:'bow',weapon:'gun'},
 cartethyia:{hair:'#f2dc92',cloth:'#eef3f8',trim:'#5866d8',style:'long',acc:'crown',weapon:'sword'},
 phrolova:{hair:'#5b3a8c',cloth:'#1d1426',trim:'#c63a60',style:'long',acc:'halo',weapon:'staff'},
 jiyan:{hair:'#3aa59a',cloth:'#1d2a2e',trim:'#7fe0c8',style:'pony',acc:null,weapon:'spear'},
 yinlin:{hair:'#cf3440',cloth:'#2a1a26',trim:'#b061f7',style:'long',acc:null,weapon:'orb'},
 zhezhi:{hair:'#262b3a',cloth:'#e7f1f2',trim:'#3fa3a0',style:'long',acc:'glasses',weapon:'staff'},
 verina:{hair:'#e8d872',cloth:'#eaf4d2',trim:'#7cbf4a',style:'twin',acc:'halo',weapon:'staff'},
 rover:{hair:'#1d1d25',cloth:'#2c2b35',trim:'#d6b685',style:'short',acc:null,weapon:'sword'},
 encore:{hair:'#f6b6a2',cloth:'#e64d52',trim:'#ffe0a6',style:'twin',acc:'ears',weapon:'gun'},
 mortefi:{hair:'#2f2a3b',cloth:'#3a2d2a',trim:'#e07a52',style:'short',acc:'glasses',weapon:'gun'},
 xiangliyao:{hair:'#40465c',cloth:'#2c3348',trim:'#8cc4ff',style:'pony',acc:null,weapon:'fist'},
 sanhua:{hair:'#ebf2f6',cloth:'#2a3f66',trim:'#a4e5f2',style:'short',acc:'bow',weapon:'sword'},
 phoebe:{hair:'#f3d77a',cloth:'#f4f2ea',trim:'#3a3f9e',style:'long',acc:'hat',weapon:'staff'},
 lupa:{hair:'#d8304a',cloth:'#f0ece6',trim:'#b32035',style:'long',acc:'horns',weapon:'sword'},
 cantarella:{hair:'#c4a6ef',cloth:'#3b2a6e',trim:'#e9e1ff',style:'long',acc:'bow',weapon:'orb'},
 lingyang:{hair:'#eef1f5',cloth:'#f4f4f4',trim:'#1d1d1d',style:'spiky',acc:'ears',weapon:'fist'},
 calcharo:{hair:'#d8d8e6',cloth:'#1d1a2a',trim:'#9a7bff',style:'long',acc:null,weapon:'sword'},
 augusta:{hair:'#dc4a2a',cloth:'#f0ece2',trim:'#e3b53c',style:'long',acc:'crown',weapon:'spear'},
 iuno:{hair:'#34409a',cloth:'#eef0fb',trim:'#d4b058',style:'long',acc:'crown',weapon:'orb'},
 ciaccona:{hair:'#cf2f5a',cloth:'#2f6b5a',trim:'#f0e6d0',style:'long',acc:'horns',weapon:'staff'},
 zani:{hair:'#eeeef2',cloth:'#f2f0ec',trim:'#c8282e',style:'long',acc:'horns',weapon:'fist'}
};
const MELEE=new Set(['sword','spear','fist']);
function mix(hex,k){const n=parseInt(hex.slice(1),16),c=[n>>16,n>>8&255,n&255].map(v=>Math.round(k<0?v*(1+k):v+(255-v)*k));return '#'+c.map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('');}
const cache=new Map();
export function spriteUrl(key){
 if(cache.has(key))return cache.get(key);
 const L=LOOK[key]||{hair:'#ccc',cloth:'#556',trim:'#fff',style:'short',acc:null,weapon:'sword'};
 const g=Array.from({length:H},()=>Array(W).fill(null));
 const p=(x,y,c)=>{if(x>=0&&y>=0&&x<W&&y<H)g[y][x]=c;},r=(x,y,w,h,c)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)p(x+i,y+j,c);};
 const hair=L.hair,hair2=mix(hair,-.28),cloth2=mix(L.cloth,-.3);
 // back hair
 if(L.style==='long'){r(3,5,2,12,hair2);r(13,5,2,12,hair2);}
 if(L.style==='twin'){r(1,6,3,9,hair2);r(14,6,3,9,hair2);}
 if(L.style==='pony'){r(13,3,3,11,hair2);}
 // legs, body, arms
 r(6,19,2,3,LEG);r(10,19,2,3,LEG);r(6,22,2,1,BOOT);r(10,22,2,1,BOOT);
 r(4,17,10,2,cloth2);r(5,12,8,6,L.cloth);r(8,12,2,5,L.trim);r(6,12,6,1,L.trim);r(5,16,8,1,cloth2);
 r(4,12,1,4,cloth2);r(13,12,1,4,cloth2);p(4,16,SKIN);p(13,16,SKIN);p(8,11,mix(SKIN,-.12));p(9,11,mix(SKIN,-.12));
 // head
 r(5,5,8,6,SKIN);
 r(4,2,10,3,hair);r(5,1,8,1,hair);r(5,5,8,1,hair);p(5,6,hair);p(12,6,hair);p(7,6,hair2);p(10,6,hair2);
 r(4,5,1,5,hair);r(13,5,1,5,hair);
 if(L.style==='spiky'){p(4,1,hair);p(7,0,hair);p(10,0,hair);p(13,1,hair);p(3,3,hair);p(14,3,hair);}
 const eye=L.acc==='glasses'?9:8;r(6,eye,2,10-eye,EYE);r(10,eye,2,10-eye,EYE);p(6,eye,'#ffffff');p(10,eye,'#ffffff');p(5,10,BLUSH);p(12,10,BLUSH);
 // accessories
 if(L.acc==='glasses'){r(5,8,3,1,'#1a1a2a');r(10,8,3,1,'#1a1a2a');p(8,8,'#1a1a2a');p(9,8,'#1a1a2a');}
 if(L.acc==='crown'){r(6,1,6,1,L.trim);p(6,0,L.trim);p(9,0,L.trim);p(11,0,L.trim);}
 if(L.acc==='horns'){r(4,0,1,2,'#3a2f3d');p(3,0,'#3a2f3d');r(13,0,1,2,'#3a2f3d');p(14,0,'#3a2f3d');}
 if(L.acc==='ears'){r(4,0,2,2,hair);r(12,0,2,2,hair);p(5,1,BLUSH);p(12,1,BLUSH);}
 if(L.acc==='halo'){r(6,0,6,1,'#fff3b8');p(5,1,'#fff3b8');p(12,1,'#fff3b8');}
 if(L.acc==='bow'){r(11,1,3,2,L.trim);p(10,2,L.trim);p(14,1,mix(L.trim,-.3));}
 if(L.acc==='hat'){r(4,0,10,3,'#f5f2ea');r(4,2,10,1,L.trim);r(1,3,16,1,'#f5f2ea');}
 // weapon in the right hand
 const metal='#e1e9f4',wood='#7a5a3a';
 if(L.weapon==='sword'){r(15,4,1,11,metal);p(16,5,mix(metal,-.25));r(14,15,3,1,L.trim);r(15,16,1,2,wood);}
 if(L.weapon==='spear'){r(15,2,1,20,wood);r(14,0,3,2,metal);p(15,0,'#ffffff');r(14,9,3,1,L.trim);}
 if(L.weapon==='gun'){r(13,14,5,2,'#3b3f4a');p(17,14,mix(L.trim,.2));p(14,16,'#3b3f4a');}
 if(L.weapon==='staff'){r(15,4,1,18,wood);r(14,1,3,3,L.trim);p(15,2,'#ffffff');}
 if(L.weapon==='orb'){r(14,10,3,3,L.trim);p(15,11,'#ffffff');p(14,9,mix(L.trim,.4));}
 if(L.weapon==='fist'){r(3,15,2,2,L.trim);r(13,15,2,2,L.trim);}
 // 1px dark outline around the silhouette
 const out=g.map(row=>row.slice());
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(!g[y][x]&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>g[y+dy]?.[x+dx]))out[y][x]=LINE;
 const c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d');
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(out[y][x]){ctx.fillStyle=out[y][x];ctx.fillRect(x,y,1,1);}
 const url=c.toDataURL();cache.set(key,url);return url;
}

export class SpriteStage{
 constructor(arena,heroes){
  this.arena=arena;this.heroes=heroes;this.enabled=true;this.speed=1;this.units=new Map();
  this.layer=document.createElement('div');this.layer.id='sprites';this.layer.setAttribute('aria-hidden','true');arena.append(this.layer);
  new ResizeObserver(()=>this.layout()).observe(arena);
 }
 clear(){this.layer.replaceChildren();this.units.clear();this.arena.classList.remove('sprites-on');}
 // Center-bottom of a fighter's tile, relative to the arena.
 home(uid){const t=this.arena.querySelector(`.tile[data-uid="${uid}"]`);if(!t)return null;const a=this.arena.getBoundingClientRect(),b=t.getBoundingClientRect();return {x:b.left+b.width/2-a.left,y:b.top+b.height*.86-a.top,w:b.width,h:b.height};}
 mount(fighters,{phantom=false}={}){
  this.clear();this.arena.classList.add('sprites-on');
  for(const f of fighters){
   const h=this.heroes[f.id],look=LOOK[h.key]||{};
   const el=document.createElement('div');el.className=`sprite ${f.side}${f.side==='enemy'&&phantom?' phantom':''} walking`;el.style.setProperty('--hero',h.color);
   el.innerHTML=`<div class="sp-move"><div class="sp-hp"><i></i></div><img class="sp-body" alt="" src="${spriteUrl(h.key)}"><span class="sp-star">${'★'.repeat(f.star)}</span></div><div class="sp-shadow"></div>`;
   el.querySelector('.sp-body').style.animationDelay=`${-Math.random()*1.1}s`;
   this.layer.append(el);
   this.units.set(f.uid,{el,move:el.firstElementChild,body:el.querySelector('.sp-body'),hp:el.querySelector('.sp-hp i'),side:f.side,melee:MELEE.has(look.weapon),max:f.max,dead:false,adv:0});
  }
  this.layout();
  // March toward the front line, then settle into the idle bob.
  requestAnimationFrame(()=>{for(const u of this.units.values())u.adv=1;this.layout();});
  setTimeout(()=>{for(const u of this.units.values())u.el.classList.remove('walking');},700);
 }
 layout(){
  for(const [uid,u] of this.units){const pos=this.home(uid);if(!pos)continue;
   const k=Math.max(2,Math.min(5,Math.floor(pos.w*.72/W)));u.k=k;
   u.x=pos.x;u.y=pos.y+(u.side==='ally'?-1:1)*pos.h*.16*u.adv;
   Object.assign(u.el.style,{left:`${u.x}px`,top:`${u.y}px`});u.body.style.width=`${W*k}px`;u.body.style.height=`${H*k}px`;}
 }
 anim(el,frames,ms,opts={}){if(!el)return;el._a?.cancel();el._a=el.animate(frames,{duration:ms/this.speed,easing:'ease-out',...opts});return el._a;}
 sync(states){for(const s of states){const u=this.units.get(s.uid);if(!u)continue;u.hp.style.width=`${Math.max(0,s.hp/u.max*100)}%`;if(s.hp<=0&&!u.dead)this.fall(u);}}
 fall(u){u.dead=true;u.el.classList.add('down');const dir=u.side==='ally'?1:-1;this.anim(u.move,[{transform:'none',opacity:1},{transform:`translate(${dir*6}px,4px) rotate(${dir*80}deg)`,opacity:.35}],420,{fill:'forwards'});}
 strike(from,to,kind,color){
  const a=this.units.get(from),b=this.units.get(to);if(!a||!b||a.dead)return;
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
  if(this.enabled){
   if(a.melee&&kind!=='coop'){const reach=Math.max(0,len-(b.k||3)*W*.7)/len;this.anim(a.move,[{transform:'none'},{transform:`translate(${dx*reach}px,${dy*reach}px) scale(1.06)`,offset:.45},{transform:'none'}],kind==='ult'?420:320);}
   else{this.anim(a.move,[{transform:'none'},{transform:`translate(${-dx/len*5}px,${-dy/len*5}px)`,offset:.3},{transform:'none'}],240);this.bolt(a,b,color,kind);}
  }
  if(b.dead&&kind!=='ult')return;
  this.flash(b);if(this.enabled&&!b.dead)this.anim(b.move,[{transform:'none'},{transform:`translate(${dx/len*(kind==='ult'?9:4)}px,${dy/len*(kind==='ult'?9:4)}px)`,offset:.35},{transform:'none'}],200,{delay:a.melee?110/this.speed:150/this.speed});
  if(kind==='ult'&&this.enabled)this.sparks(b,color,10);
 }
 flash(u){u.body.animate([{filter:'brightness(3.2) saturate(0)'},{filter:'none'}],{duration:180/this.speed,delay:110/this.speed});}
 bolt(a,b,color,kind){
  const el=document.createElement('i');el.className=`sp-bolt ${kind}`;el.style.setProperty('--c',color);el.style.left=`${a.x}px`;el.style.top=`${a.y-(a.k||3)*H*.55}px`;this.layer.append(el);
  const tx=b.x-a.x,ty=b.y-a.y-((b.k||3)-(a.k||3))*H*.55;
  el.animate([{transform:'translate(-50%,-50%)'},{transform:`translate(calc(-50% + ${tx}px),calc(-50% + ${ty}px))`}],{duration:170/this.speed,easing:'linear'}).onfinish=()=>el.remove();
 }
 sparks(u,color,n=8){const y=u.y-(u.k||3)*H*.5;for(let i=0;i<n;i++){const s=document.createElement('i');s.className='sp-spark';s.style.cssText=`left:${u.x}px;top:${y}px;--c:${color}`;this.layer.append(s);const ang=i/n*Math.PI*2,d=18+Math.random()*16;s.animate([{transform:'translate(-50%,-50%)',opacity:1},{transform:`translate(calc(-50% + ${Math.cos(ang)*d}px),calc(-50% + ${Math.sin(ang)*d}px))`,opacity:0}],{duration:420/this.speed,easing:'ease-out'}).onfinish=()=>s.remove();}}
 cast(uid,color){const u=this.units.get(uid);if(!u||u.dead)return;
  const ring=document.createElement('i');ring.className='sp-ring';ring.style.cssText=`left:${u.x}px;top:${u.y-4}px;--c:${color}`;this.layer.append(ring);ring.animate([{transform:'translate(-50%,-50%) scale(.2)',opacity:1},{transform:'translate(-50%,-50%) scale(1.6)',opacity:0}],{duration:520/this.speed}).onfinish=()=>ring.remove();
  if(this.enabled){this.anim(u.move,[{transform:'none'},{transform:'translateY(-16px) scale(1.12)',offset:.4},{transform:'none'}],380);this.sparks(u,color,8);}
 }
 heal(uid){const u=this.units.get(uid);if(!u||u.dead||!this.enabled)return;for(let i=0;i<3;i++){const s=document.createElement('i');s.className='sp-heal';s.style.cssText=`left:${u.x+(i-1)*9}px;top:${u.y-(u.k||3)*H*.6}px`;this.layer.append(s);s.animate([{transform:'translate(-50%,0)',opacity:1},{transform:'translate(-50%,-18px)',opacity:0}],{duration:520/this.speed,delay:i*70/this.speed}).onfinish=()=>s.remove();}}
 intro(from,to,color){const a=this.units.get(from);if(!a||a.dead)return;
  if(this.enabled){const ghost=a.body.cloneNode();ghost.className='sp-after';Object.assign(ghost.style,{left:`${a.x}px`,top:`${a.y}px`,width:a.body.style.width,height:a.body.style.height});this.layer.append(ghost);ghost.animate([{opacity:.7},{opacity:0}],{duration:360/this.speed}).onfinish=()=>ghost.remove();}
  this.strike(from,to,'extra',color);}
 rally(side){for(const u of this.units.values())if(u.side===side&&!u.dead&&this.enabled)this.anim(u.move,[{transform:'none'},{transform:'translateY(-12px)',offset:.35},{transform:'none'}],420);}
 // Floating damage / heal number above the sprite (tile popups are hidden while sprites are on).
 number(e){const u=this.units.get(e.to);if(!u||!e.amount)return;const el=document.createElement('span');el.className=`sp-num ${e.kind}`;el.textContent=`${e.kind==='heal'?'+':''}${e.amount}`;el.style.left=`${u.x+(Math.random()*18-9)}px`;el.style.top=`${u.y-(u.k||3)*H-6}px`;this.layer.append(el);el.animate([{transform:'translate(-50%,-100%) scale(1.25)',opacity:1},{transform:'translate(-50%,-100%) scale(1)',opacity:1,offset:.2},{transform:'translate(-50%,calc(-100% - 22px))',opacity:0}],{duration:760/this.speed,easing:'ease-out'}).onfinish=()=>el.remove();}
 victory(side){for(const u of this.units.values())if(u.side===side&&!u.dead){u.el.classList.add('cheer');}}
}

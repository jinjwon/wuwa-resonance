// Cuts a generated sprite sheet (checkerboard background baked in) into per-character PNGs.
// Usage: sips -s format bmp sheet.webp --out sheet.bmp; node tools/cut-sprite-sheet.mjs sheet.bmp out; node tools/place-sprites.mjs out assets/sprites
import fs from 'node:fs';import zlib from 'node:zlib';import {readBmp} from './bmp.mjs';
const [,,src,outDir]=process.argv;const {w,h,px}=readBmp(src);
const N=w*h,bgLike=new Uint8Array(N);
for(let i=0;i<N;i++){const r=px[i*3],g=px[i*3+1],b=px[i*3+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b);bgLike[i]=(mx-mn<=16&&mn>=198)?1:0;}
const tone=new Uint8Array(N);for(let i=0;i<N;i++){if(!bgLike[i])continue;const v=Math.min(px[i*3],px[i*3+1],px[i*3+2]),m=Math.max(px[i*3],px[i*3+1],px[i*3+2]);tone[i]=v>=236?1:m<=228?2:0;}
const at=(x,y)=>x>=0&&y>=0&&x<w&&y<h?y*w+x:-1;
const checker=i=>{const x=i%w,y=(i-x)/w,t=tone[i];if(t){for(const [dx,dy] of [[8,0],[-8,0],[0,8],[0,-8],[9,0],[-9,0],[0,9],[0,-9],[7,0],[-7,0],[0,7],[0,-7]]){const j=at(x+dx,y+dy);if(j>=0&&tone[j]===3-t)return true;}return false;}
 let L=false,D=false;for(const [dx,dy] of [[4,0],[-4,0],[0,4],[0,-4],[3,0],[-3,0],[0,3],[0,-3],[5,0],[-5,0],[0,5],[0,-5]]){const j=at(x+dx,y+dy);if(j<0)continue;if(tone[j]===1)L=true;if(tone[j]===2)D=true;}return L&&D;};
// 1) flood fill background from the border
const bg=new Uint8Array(N),stack=[];
const push=i=>{if(!bg[i]&&bgLike[i]){bg[i]=1;stack.push(i);}};
for(let x=0;x<w;x++){push(x);push((h-1)*w+x);}for(let y=0;y<h;y++){push(y*w);push(y*w+w-1);}
while(stack.length){const i=stack.pop(),x=i%w,y=(i-x)/w;if(x>0)push(i-1);if(x<w-1)push(i+1);if(y>0)push(i-w);if(y<h-1)push(i+w);}
// 2) enclosed checker patches (gaps between arms/legs): bg-like regions holding both checker tones
const seen=new Uint8Array(N);let holes=0;
for(let s=0;s<N;s++){if(bg[s]||!bgLike[s]||seen[s])continue;const reg=[s];seen[s]=1;let light=0,dark=0;
 for(let k=0;k<reg.length;k++){const i=reg[k],x=i%w;const v=px[i*3];if(v>=238)light++;else if(v<=228)dark++;for(const j of [x>0?i-1:-1,x<w-1?i+1:-1,i-w,i+w])if(j>=0&&j<N&&!seen[j]&&bgLike[j]&&!bg[j]){seen[j]=1;reg.push(j);}}
 if(reg.length>=24&&light>reg.length*.15&&dark>reg.length*.15&&reg.filter(checker).length>reg.length*.75){for(const i of reg)bg[i]=1;holes++;}}
// 2b) restore: removed regions without the checker structure (white hair, fur, cloth) that touch the character
{// label the pre-restore foreground so a restored region may join only one character
 const own=new Int32Array(N).fill(-1);let nl=0;for(let s0=0;s0<N;s0++){if(bg[s0]||own[s0]>=0)continue;const q=[s0];own[s0]=nl;while(q.length){const i=q.pop(),x=i%w;for(const j of [x>0?i-1:-1,x<w-1?i+1:-1,i-w,i+w,x>0?i-w-1:-1,x<w-1?i-w+1:-1,x>0?i+w-1:-1,x<w-1?i+w+1:-1]){if(j>=0&&j<N&&!bg[j]&&own[j]<0){own[j]=nl;q.push(j);}}}nl++;}
 const size=new Int32Array(nl);for(let i=0;i<N;i++)if(own[i]>=0)size[own[i]]++;
 const fail=new Uint8Array(N);for(let i=0;i<N;i++)if(bg[i]&&!checker(i))fail[i]=1;
 const vis=new Uint8Array(N);let restored=0;
 for(let s=0;s<N;s++){if(!fail[s]||vis[s])continue;const reg=[s];vis[s]=1;let touch=false;const owners=new Set();
  for(let k=0;k<reg.length;k++){const i=reg[k],x=i%w;for(const j of [x>0?i-1:-1,x<w-1?i+1:-1,i-w,i+w]){if(j<0||j>=N)continue;if(!bg[j]){touch=true;if(size[own[j]]>4000)owners.add(own[j]);}else if(fail[j]&&!vis[j]){vis[j]=1;reg.push(j);}}}
  if(touch&&reg.length>=30&&owners.size<=1){for(const i of reg)bg[i]=0;restored+=reg.length;}}
 console.log('restored px',restored);}
// 3) connected foreground components (8-neighbour)
const lab=new Int32Array(N).fill(-1),comps=[];
for(let s=0;s<N;s++){if(bg[s]||lab[s]>=0)continue;const c={n:0,x0:w,y0:h,x1:0,y1:0,id:comps.length},q=[s];lab[s]=c.id;
 while(q.length){const i=q.pop(),x=i%w,y=(i-x)/w;c.n++;if(x<c.x0)c.x0=x;if(x>c.x1)c.x1=x;if(y<c.y0)c.y0=y;if(y>c.y1)c.y1=y;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=w||Y>=h)continue;const j=Y*w+X;if(!bg[j]&&lab[j]<0){lab[j]=c.id;q.push(j);}}}
 comps.push(c);}
// split characters that touch each other (e.g. a sword overlapping the neighbour) at the thinnest column
for(const c of comps.slice()){if(c.n<4000||c.x1-c.x0<330)continue;const W=c.x1-c.x0+1,col=new Array(W).fill(0);
 for(let y=c.y0;y<=c.y1;y++)for(let x=c.x0;x<=c.x1;x++)if(lab[y*w+x]===c.id)col[x-c.x0]++;
 let cut=0,best=1e9;for(let k=Math.floor(W*.3);k<W*.7;k++){const v=col[k]+col[k-1]+col[k+1];if(v<best){best=v;cut=k;}}
 const X=c.x0+cut,ys=[c.y0,c.y1],n={n:0,x0:w,y0:h,x1:0,y1:0,id:comps.length};comps.push(n);Object.assign(c,{n:0,x0:w,y0:h,x1:0,y1:0});
 for(let y=ys[0];y<=ys[1];y++)for(let x=0;x<w;x++){const i=y*w+x;if(lab[i]!==c.id)continue;const o=x>=X?n:c;lab[i]=o.id;o.n++;if(x<o.x0)o.x0=x;if(x>o.x1)o.x1=x;if(y<o.y0)o.y0=y;if(y>o.y1)o.y1=y;}
 console.log('split at',X,'col pixels',best);}
const big=comps.filter(c=>c.n>4000).sort((a,b)=>a.y0-b.y0);
// rows by vertical centre, then left→right
const rows=[];for(const c of big){const cy=(c.y0+c.y1)/2;let r=rows.find(r=>Math.abs(r.cy-cy)<90);if(!r){r={cy,list:[]};rows.push(r);}r.list.push(c);}
rows.sort((a,b)=>a.cy-b.cy);const order=rows.flatMap(r=>r.list.sort((a,b)=>a.x0-b.x0));
// attach small pieces (effects, sparkles) to the nearest character box
const owner=new Map(order.map((c,k)=>[c.id,k]));
for(const c of comps){if(owner.has(c.id)||c.n<6)continue;const cx=(c.x0+c.x1)/2,cy=(c.y0+c.y1)/2;let best=-1,bd=1e9;
 order.forEach((o,k)=>{const dx=Math.max(o.x0-cx,0,cx-o.x1),dy=Math.max(o.y0-cy,0,cy-o.y1),d=Math.hypot(dx,dy);if(d<bd){bd=d;best=k;}});if(bd<26)owner.set(c.id,best);}
console.log('holes',holes,'components',comps.length,'characters',order.length,'rows',rows.map(r=>r.list.length));
fs.mkdirSync(outDir,{recursive:true});
const crc=b=>{let c,cr=0xffffffff;for(const x of b){c=(cr^x)&255;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;cr=(cr>>>8)^c;}return (cr^0xffffffff)>>>0;};
const chunk=(t,d)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(t),d]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([l,td,c]);};
const png=(W,H,rgba)=>{const raw=Buffer.alloc((W*4+1)*H);for(let y=0;y<H;y++){raw[y*(W*4+1)]=0;rgba.copy(raw,y*(W*4+1)+1,y*W*4,(y+1)*W*4);}const ih=Buffer.alloc(13);ih.writeUInt32BE(W,0);ih.writeUInt32BE(H,4);ih[8]=8;ih[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);};
const meta=[];
order.forEach((c,k)=>{const ids=[...owner].filter(([,v])=>v===k).map(([id])=>id),set=new Set(ids);let x0=w,y0=h,x1=0,y1=0;for(const id of ids){const o=comps[id];x0=Math.min(x0,o.x0);y0=Math.min(y0,o.y0);x1=Math.max(x1,o.x1);y1=Math.max(y1,o.y1);}
 const W=x1-x0+1,H=y1-y0+1,out=Buffer.alloc(W*H*4);
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=y*w+x;if(!set.has(lab[i]))continue;const o=((y-y0)*W+(x-x0))*4;out[o]=px[i*3];out[o+1]=px[i*3+1];out[o+2]=px[i*3+2];out[o+3]=255;}
 // feet anchor: centre of the lowest 6% of opaque rows
 fs.writeFileSync(`${outDir}/${String(k).padStart(2,'0')}.png`,png(W,H,out));meta.push({k,W,H,x0,y0});});
fs.writeFileSync(`${outDir}/meta.json`,JSON.stringify(meta));console.log(meta.map(m=>`${m.k}:${m.W}x${m.H}`).join(' '));

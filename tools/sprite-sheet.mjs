// Renders every resonator pixel sprite into one PNG for review: node tools/sprite-sheet.mjs docs/sprites.png [keys] [scale]
import zlib from 'node:zlib';import fs from 'node:fs';
const m=await import('../sprites.js');
const {HEROES}=await import('../engine.js');
const keys=process.argv[3]?.trim()?process.argv[3].split(','):HEROES.map(h=>h.key);
const K=+process.argv[4]||6,COLS=Math.min(keys.length,7),CW=26*K,CH=34*K,rows=Math.ceil(keys.length/COLS),Wd=COLS*CW,Hd=rows*CH;
const buf=Buffer.alloc(Wd*Hd*3);for(let i=0;i<Wd*Hd;i++){buf[i*3]=0x2a;buf[i*3+1]=0x2e;buf[i*3+2]=0x38;}
keys.forEach((k,n)=>{const g=m.spriteGrid(k),ox=(n%COLS)*CW+K,oy=Math.floor(n/COLS)*CH+K;g.forEach((row,y)=>row.forEach((c,x)=>{if(!c)return;const v=parseInt(c.slice(1),16);for(let j=0;j<K;j++)for(let i=0;i<K;i++){const p=((oy+y*K+j)*Wd+ox+x*K+i)*3;buf[p]=v>>16;buf[p+1]=v>>8&255;buf[p+2]=v&255;}}));});
const raw=Buffer.alloc((Wd*3+1)*Hd);for(let y=0;y<Hd;y++){raw[y*(Wd*3+1)]=0;buf.copy(raw,y*(Wd*3+1)+1,y*Wd*3,(y+1)*Wd*3);}
const crc=b=>{let c,cr=0xffffffff;for(const x of b){c=(cr^x)&255;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;cr=(cr>>>8)^c;}return (cr^0xffffffff)>>>0;};
const chunk=(t,d)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(t),d]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([l,td,c]);};
const ih=Buffer.alloc(13);ih.writeUInt32BE(Wd,0);ih.writeUInt32BE(Hd,4);ih[8]=8;ih[9]=2;
fs.writeFileSync(process.argv[2],Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
console.log(keys.join(' '));

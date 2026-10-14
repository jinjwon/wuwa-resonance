import fs from 'node:fs';import zlib from 'node:zlib';
const [,,dir,dest]=process.argv;
const KEYS=['jinhsi','changli','shorekeeper','camellya','carlotta','cartethyia','phrolova','jiyan','yinlin','zhezhi','verina','rover','encore','mortefi','xiangliyao','sanhua','phoebe','lupa','cantarella','lingyang','calcharo','augusta','iuno','ciaccona','zani'];
const read=f=>{const b=fs.readFileSync(f);let o=8,W,H,idat=[];while(o<b.length){const len=b.readUInt32BE(o),t=b.toString('ascii',o+4,o+8),d=b.subarray(o+8,o+8+len);if(t==='IHDR'){W=d.readUInt32BE(0);H=d.readUInt32BE(4);}if(t==='IDAT')idat.push(d);o+=12+len;}const raw=zlib.inflateSync(Buffer.concat(idat));return {W,H,raw};};
fs.mkdirSync(dest,{recursive:true});const manifest={};
KEYS.forEach((key,i)=>{const f=`${dir}/${String(i).padStart(2,'0')}.png`,{W,H,raw}=read(f);
 // feet anchor = horizontal centre of opaque pixels in the lowest 8% of rows
 let sum=0,n=0;for(let y=Math.floor(H*.92);y<H;y++)for(let x=0;x<W;x++)if(raw[y*(W*4+1)+1+x*4+3]){sum+=x;n++;}
 fs.copyFileSync(f,`${dest}/${key}.png`);manifest[key]={w:W,h:H,fx:+(n?sum/n/W:.5).toFixed(3)};});
fs.writeFileSync(`${dest}/index.json`,JSON.stringify(manifest,null,1));
console.log(Object.entries(manifest).map(([k,v])=>`${k}:${v.w}x${v.h}@${v.fx}`).join('  '));

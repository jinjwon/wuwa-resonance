import fs from 'node:fs';
export function readBmp(p){const b=fs.readFileSync(p);const off=b.readUInt32LE(10),w=b.readInt32LE(18),hh=b.readInt32LE(22),bpp=b.readUInt16LE(28),h=Math.abs(hh),top=hh<0,stride=Math.ceil(w*bpp/8/4)*4,px=new Uint8Array(w*h*3);
 for(let y=0;y<h;y++){const row=off+(top?y:h-1-y)*stride;for(let x=0;x<w;x++){const i=row+x*(bpp/8),o=(y*w+x)*3;px[o]=b[i+2];px[o+1]=b[i+1];px[o+2]=b[i];}}return {w,h,px};}

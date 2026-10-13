import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(p,(e,b)=>{if(e){res.writeHead(404).end('Not found');return;}res.setHeader('Content-Type',({'html':'text/html; charset=utf-8','js':'text/javascript','css':'text/css','png':'image/png'})[p.split('.').pop()]||'text/plain');res.end(b);});}).listen(4190,'127.0.0.1',()=>console.log('http://localhost:4190'));

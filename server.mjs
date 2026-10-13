// Local game server: static files + multiplayer lobby (Server-Sent Events + JSON POST). No dependencies.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Room} from './multi.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const PORT=Number(process.env.PORT)||4190;
const HOST=process.env.HOST||'0.0.0.0';
const TYPES={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',mjs:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',svg:'image/svg+xml',json:'application/json'};
const rooms=new Map();

function lanUrls(){const out=[];for(const list of Object.values(os.networkInterfaces()))for(const n of list||[])if(n.family==='IPv4'&&!n.internal)out.push(`http://${n.address}:${PORT}/`);return out;}
function json(res,code,body){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(body));}
function readBody(req){return new Promise((resolve,reject)=>{let size=0,data='';req.on('data',c=>{size+=c.length;if(size>16384){reject(new Error('too large'));req.destroy();}else data+=c;});req.on('end',()=>{try{resolve(data?JSON.parse(data):{});}catch{reject(new Error('bad json'));}});req.on('error',reject);});}
function newCode(){const abc='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';for(;;){const c=Array.from({length:4},()=>abc[Math.floor(Math.random()*abc.length)]).join('');if(!rooms.has(c))return c;}}
function findPlayer(room,token){return room?.players.find(p=>p.token===token&&!p.left)||null;}
function artList(){try{return fs.readdirSync(path.join(root,'assets','heroes')).filter(f=>/^[a-z0-9-]+\.(png|jpe?g|webp)$/i.test(f));}catch{return [];}}

// One SSE stream per browser tab. Each client gets the shared room view plus its own private state;
// the (large) battle replay is sent once per battle as a separate event.
function stream(req,res,room,player){
 res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-store','Connection':'keep-alive','X-Accel-Buffering':'no'});
 let sentBattle=null,lastVersion=-1;
 const send=(event,data)=>res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
 const push=()=>{
  if(room.version===lastVersion)return;lastVersion=room.version;
  const me=room.players.includes(player)?player:null;
  if(!me){send('gone',{reason:'방에서 나갔습니다.'});return;}
  if(me.battle&&sentBattle!==me.battle.seq&&room.phase==='battle'){sentBattle=me.battle.seq;send('battle',me.battle);}
  send('state',{room:room.publicView(),me:room.privateView(me)});
 };
 room.listeners.add(push);player.streams=(player.streams||0)+1;room.setConnected(player,true);push();
 const ping=setInterval(()=>res.write(': ping\n\n'),20000);
 req.on('close',()=>{clearInterval(ping);room.listeners.delete(push);player.streams--;if(player.streams<=0)setTimeout(()=>{if(player.streams<=0&&room.players.includes(player))room.setConnected(player,false);},4000);});
}

async function api(req,res,url){
 const route=url.pathname.slice(5);
 if(req.method==='GET'&&route==='info')return json(res,200,{lan:lanUrls(),port:PORT});
 if(req.method==='GET'&&route==='art')return json(res,200,artList());
 if(req.method==='GET'&&route==='stream'){
  const room=rooms.get(String(url.searchParams.get('code')||'').toUpperCase());const p=findPlayer(room,url.searchParams.get('token'));
  if(!p)return json(res,404,{error:'방 또는 플레이어를 찾을 수 없어요.'});return stream(req,res,room,p);
 }
 if(req.method!=='POST')return json(res,405,{error:'POST only'});
 let body;try{body=await readBody(req);}catch{return json(res,400,{error:'잘못된 요청입니다.'});}
 if(route==='create'){
  if(rooms.size>=40)return json(res,503,{error:'열린 방이 너무 많아요.'});
  const room=new Room(newCode());const r=room.addPlayer(body.name);rooms.set(room.code,room);
  return json(res,200,{code:room.code,id:r.player.id,token:r.player.token});
 }
 const room=rooms.get(String(body.code||'').toUpperCase().trim());
 if(!room)return json(res,404,{error:'방 코드를 찾을 수 없어요.'});
 if(route==='join'){const r=room.addPlayer(body.name);if(r.error)return json(res,409,r);return json(res,200,{code:room.code,id:r.player.id,token:r.player.token});}
 if(route==='act'){const p=findPlayer(room,body.token);if(!p)return json(res,403,{error:'방 참가 정보가 만료됐어요.'});const r=room.act(p,body)||{ok:true};return json(res,200,r);}
 return json(res,404,{error:'not found'});
}

const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://local');
 if(url.pathname.startsWith('/api/'))return api(req,res,url).catch(()=>json(res,500,{error:'서버 오류'}));
 let rel;try{rel=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);}catch{res.writeHead(400).end();return;}
 const p=path.resolve(root,'.'+rel);
 if(!p.startsWith(root+path.sep)||/(^|[\\/])(\.|node_modules)/.test(path.relative(root,p))){res.writeHead(403).end();return;}
 fs.readFile(p,(e,b)=>{if(e){res.writeHead(404).end('Not found');return;}res.setHeader('Content-Type',TYPES[p.split('.').pop().toLowerCase()]||'application/octet-stream');res.setHeader('Cache-Control','no-cache');res.end(b);});
});
// Drop rooms nobody has touched for 30 minutes.
setInterval(()=>{const now=Date.now();for(const [code,room] of rooms)if(now-room.lastActive>30*60*1000&&!room.players.some(p=>p.streams>0)){room.clearTimer();rooms.delete(code);}},60*1000).unref();
server.listen(PORT,HOST,()=>{
 console.log(`\n  명조 · 공명전선  →  http://localhost:${PORT}/`);
 const lan=lanUrls();if(HOST==='0.0.0.0'&&lan.length)console.log(`  같은 와이파이 친구 접속 →  ${lan.join('  ')}`);
 console.log('');
});

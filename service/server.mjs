import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {collect} from './collector.mjs';
const port=Number(process.env.PORT||8765);
const origins=new Set((process.env.ALLOWED_ORIGINS||`http://127.0.0.1:${port},http://localhost:${port}`).split(',').map(s=>s.trim()));
let running=null,lastStart=0;
const files=new Set(['index.html','app.js','snapshot.js','config.js','styles.css','ui.js']);
export const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const origin=req.headers.origin;
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');
 if(origin&&origins.has(origin)){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
 const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
 if(url.pathname==='/api/snapshot'){
  if(!origin||!origins.has(origin))return send(403,{error:'Origin не разрешён. Настройте ALLOWED_ORIGINS.'});
  if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.writeHead(204);return res.end();}
  if(req.method!=='POST')return send(405,{error:'Используйте POST'});
  if(Number(req.headers['content-length']||0)>0||req.headers['transfer-encoding'])return send(400,{error:'Параметры и персональные данные не принимаются'});
  if(running)return send(409,{error:'Обновление уже выполняется. Повторите через полминуты.'});
  if(Date.now()-lastStart<30000)return send(429,{error:'Между обновлениями нужен интервал 30 секунд.'});
  lastStart=Date.now();running=collect();
  try{return send(200,await running);}catch{return send(500,{error:'Не удалось собрать срез. Старые данные не считаются свежими.'});}finally{running=null;}
 }
 if(url.pathname==='/health')return send(200,{status:'ok'});
 if(req.method!=='GET')return send(405,{error:'Метод не поддерживается'});
 const name=url.pathname==='/'?'index.html':url.pathname.slice(1);
 if(!files.has(name))return send(404,{error:'Не найдено'});
 try{const data=await readFile(fileURLToPath(new URL('../'+name,import.meta.url)));res.writeHead(200,{'Content-Type':name.endsWith('.css')?'text/css; charset=utf-8':name.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8'});res.end(data);}catch{return send(404,{error:'Файл не найден'});}
});
server.requestTimeout=35000;
server.listen(port,()=>console.log(`Five Cards: http://127.0.0.1:${port}`));

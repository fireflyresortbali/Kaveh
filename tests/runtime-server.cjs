const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const fixture=fs.readFileSync(path.join(__dirname,'campaign-runtime.js'),'utf8');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const marker=/\}\)\(\);\s*\};\s*if\(window\.THREE\)/;
if(!marker.test(html))throw Error('Test injection point missing');
const preview=`if(location.search.includes('patron')){await startMemory(2);closeModal();beginStage();paused=false;age=1;doAgeUp()}
else if(location.search.includes('forge')){await startMemory(2);closeModal();beginStage();paused=false;age=2;const b=placeFree('blacksmith',0,45,65,true);setSel([b.id]);centerOn(b.x,b.y);cam.z0=13}
else if(new URLSearchParams(location.search).has('level')){const id=Number(new URLSearchParams(location.search).get('level'));await startMemory(id);closeModal();beginStage();paused=false;setSel([]);reveals.push({x:39,y:45,r:80,until:3600});updateFog();centerOn(39*TILE,45*TILE);cam.z0=37}
else {${fixture}}`;
html=html.replace(marker,`setTimeout(async()=>{while(!document.querySelector('#loading').hidden)await new Promise(r=>setTimeout(r,100));\n${preview}\n},100);\n})();\n};\nif(window.THREE)`);
http.createServer((req,res)=>{
  if(req.url==='/report'){let body='';req.on('data',s=>body+=s);req.on('end',()=>{const result=JSON.parse(body);console.log(JSON.stringify({passed:result.passed,checks:result.checks.length,levels:result.levels,stages:result.stages,error:result.error||null}));res.end('ok')});return}
  if(req.url==='/assets/age-of-iron-forge.png'){res.writeHead(200,{'content-type':'image/png'});fs.createReadStream(path.join(root,'assets','age-of-iron-forge.png')).pipe(res);return}
  res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html);
}).listen(8779,'127.0.0.1',()=>console.log('Runtime test listening on 8779'));

// Node 22+; launches its own temporary Chromium profile, never the user's profile.
// This is a desktop diagnostic smoke run, NOT a mobile benchmark or release gate.
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const {createServer}=require('/Users/alireza/.codex/worktrees/kaveh-alg-61-emulator-performance-logs/tests/performance/server.cjs');
const delay=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
  const output=path.resolve(process.argv[2]||path.join(os.tmpdir(),'kaveh-performance-review.json'));
  const report={kind:'desktop-headless-diagnostic',runAt:new Date().toISOString(),physicalMobile:false,seed:null,valid:false,phase:'initialization'};
  const persist=()=>{fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');};
  // Replace stale output immediately; even an interrupted run is visibly incomplete.
  persist();
  let profile,server,chrome,ws;
  const pending=new Map(); let seq=0;
  try {
    const executable=process.env.PERF_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    if(!fs.existsSync(executable)) throw Error('Set PERF_CHROME to a Chromium executable.');
    profile=fs.mkdtempSync(path.join(os.tmpdir(),'kaveh-perf-'));
    server=createServer();
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
    report.phase='browser-launch';
    const url=`http://127.0.0.1:${server.address().port}/`;
    chrome=cp.spawn(executable,[`--user-data-dir=${profile}`,'--headless=new','--remote-debugging-port=0','--no-first-run','--no-default-browser-check','--window-size=960,640','about:blank'],{stdio:['ignore','ignore','pipe']});
    let browserLog=''; chrome.stderr.on('data',b=>{browserLog=(browserLog+b).slice(-4000);});
    let launchError=null;
    chrome.on('error',e=>launchError=e);
    const portFile=path.join(profile,'DevToolsActivePort');
    for(let i=0;!fs.existsSync(portFile);i++) {
      if(launchError) throw launchError;
      if(i>200||chrome.exitCode!==null) throw Error('Chromium did not start. '+browserLog);
      await delay(100);
    }
    const port=Number(fs.readFileSync(portFile,'utf8').split('\n')[0]);
    const tabs=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    const tab=tabs.find(t=>t.type==='page');
    ws=new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
    ws.onmessage=event=>{
      const m=JSON.parse(event.data),p=pending.get(m.id);
      if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}
    };
    function cdp(method,params={}) {
      return new Promise((resolve,reject)=>{
        const id=++seq;
        const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method));},180000);
        pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));
      });
    }
    async function evaluate(expression) {
      const r=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});
      if(r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
      return r.result.value;
    }
    report.phase='startup';
    report.browser=await cdp('Browser.getVersion');
    await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Emulation.setCPUThrottlingRate',{rate:6});
    await cdp('Page.navigate',{url});
    for(let i=0;;i++) {
      if(await evaluate('!!window.__perfReview')) break;
      if(i>600) throw Error('Game instrumentation did not initialize.');
      await delay(100);
    }
    report.environment=await evaluate('window.__perfReview.ready()');
    report.webgl=await evaluate(`(()=>{const c=document.querySelector('#view');const gl=c.getContext('webgl2')||c.getContext('webgl');const x=gl.getExtension('WEBGL_debug_renderer_info');return{version:gl.getParameter(gl.VERSION),renderer:x?gl.getParameter(x.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}})()`);
    if(process.env.PERF_ACCEPTANCE==='1'){
      report.phase='optimization-acceptance';report.acceptance=await evaluate('window.__optimizationChecks()');
      report.valid=report.acceptance.passed===true;if(!report.valid)process.exitCode=1;report.phase='complete';console.log(JSON.stringify({output,valid:report.valid,checks:report.acceptance.checks.length}));
    }else if(process.env.PERF_CAMPAIGN==='1'){
      report.phase='campaign-runtime';console.log('Running all 62 campaign memories and objective transitions.');
      await evaluate('window.__runCampaign();true');
      const deadline=Date.now()+900000;
      while(!await evaluate('!!window.__campaignResult')){
        const snapshot=await evaluate('window.__perfReview.snapshot()');
        if(snapshot.errors.length)throw Error(snapshot.errors.join('\n'));
        if(Date.now()>deadline)throw Error('Campaign runtime report did not arrive within 15 minutes');
        await delay(1000);
      }
      report.campaign=await evaluate('window.__campaignResult');
      report.final=await evaluate('window.__perfReview.snapshot()');
      report.valid=report.campaign.passed===true&&report.campaign.levels===62&&report.campaign.stages>0&&report.final.errors.length===0;
      report.phase='complete';if(!report.valid)process.exitCode=1;
      console.log(JSON.stringify({output,valid:report.valid,checks:report.campaign.checks.length,levels:report.campaign.levels,stages:report.campaign.stages,error:report.campaign.error,errors:report.final.errors}));
    }else{
    console.log('Game ready. Capturing paused menu and live play diagnostics.');
    report.phase='menu';
    report.menu=await evaluate('window.__perfReview.capture("campaign-menu",5,true)');
    report.phase='start-memory-1';
    await evaluate('window.__perfReview.start(1)'); await delay(2000);
    report.phase='gameplay';
    report.gameplay=await evaluate('window.__perfReview.capture("opening-gameplay",10,true)');
    report.phase='pause';
    await evaluate('window.__perfReview.pause()');
    report.paused=await evaluate('window.__perfReview.capture("paused-mission",5,true)');
    console.log('Checking repeated effects and landscape transitions.');
    report.phase='effects';
    report.effectBaseline=await evaluate('window.__perfReview.snapshot()');
    report.effects=await evaluate('window.__perfReview.effectCycles(10)');
    report.phase='transitions';
    const pairs=process.env.PERF_STRESS==='1'?21:3;
    report.transitions=await evaluate(`window.__perfReview.transitions(${JSON.stringify(Array.from({length:pairs},()=>[1,2]).flat())},300)`);
    if(process.env.PERF_STRESS==='1'){
      report.phase='optimization-acceptance';
      report.acceptance=await evaluate('window.__optimizationChecks()');
      // Ignore the first pair while the second mission warms app-lifetime caches.
      for(const id of [1,2])for(const key of ['geometries','textures','programs']){
        const values=report.transitions.slice(2).filter(s=>s.id===id).map(s=>s.renderers.main[key]);
        if(Math.max(...values)-Math.min(...values)>2)throw Error('Mission '+id+' '+key+' failed to plateau: '+values);
      }
    }
    report.final=await evaluate('window.__perfReview.snapshot()');
    report.valid=(process.env.PERF_STRESS!=='1'||report.acceptance?.passed===true) && report.final.errors.length===0 && [report.menu,report.gameplay,report.paused].every(s=>s.comparable) && report.transitions.every(s=>s.valid);
    report.phase='complete';
    if(!report.valid) process.exitCode=1;
    console.log(JSON.stringify({output,valid:report.valid,errors:report.final.errors,renderer:report.webgl.renderer,menuRenders:report.menu.metrics['main.calls']?.n,menuIntervals:report.menu.metrics.rafIntervalMs,gameplayIntervals:report.gameplay.metrics.rafIntervalMs,effects:report.effects.map(s=>s.renderers.main),transitions:report.transitions.map(s=>({id:s.id,...s.renderers.main}))},null,2));
    }
  } catch(error) {
    report.valid=false;
    report.failure={phase:report.phase,error:String(error.stack||error)};
    process.exitCode=1;
    console.error(report.failure.error);
  } finally {
    report.finishedAt=new Date().toISOString();
    let writeError;
    try { persist(); } catch(error) { writeError=error; }
    for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('Runner closing'));}
    ws?.close(); chrome?.kill();
    if(server) await new Promise(r=>server.close(r));
    // Chrome owns this temporary profile until it has exited.
    if(chrome&&chrome.exitCode===null&&chrome.signalCode===null) await Promise.race([new Promise(r=>chrome.once('exit',r)),delay(5000)]);
    if(profile&&(!chrome||chrome.exitCode!==null||chrome.signalCode!==null)) fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:100});
    if(writeError) throw writeError;
  }
})().catch(e=>{console.error(e.stack);process.exitCode=1;});

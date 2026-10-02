// Fault-injection checks for diagnostic validity; no browser or game files modified.
// Run: node tests/performance/diagnostic-regression.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const EventEmitter=require('node:events');
const root=path.resolve(__dirname,'../..');

async function missionLoad(fail,mode="healthy") {
  // Exercise the real production catch-and-resolve behavior, not a rewritten stub.
  const start=fs.readFileSync(path.join(root,'campaign.js'),'utf8').split('\n').find(l=>l.startsWith('async function startMemory('));
  assert.ok(start,'Review fixture extraction when startMemory changes');
  const logs=[],actions={close:0,begin:0};let clock=0,ticks=0;
  const elements=new Map();
  const renderer={render(){},domElement:{width:960,height:553},info:{autoReset:true,reset(){},memory:{},render:{},programs:[]}};
  const ctx={console:{error:e=>logs.push(String(e))},performance:{now:()=>clock},
    window:{addEventListener(){}},document:{hidden:false,addEventListener(){}},
    setTimeout(fn,ms){if(mode==="late-ready"){clock+=17000;renderer.render();renderer.render();ctx.now+=.05;fn();return;}clock+=ms;ticks++;if(mode!=="stalled"||ticks===1)renderer.render();if(mode!=="stalled"&&mode!=="no-simulation"&&ticks>=2)ctx.now+=.05;fn();},R3:renderer,SR:null,aux:null,now:0,paused:false,
    memory:{id:1},ents:[],alive:()=>true,fxs:[],objs:new Map(),G:{},MC:{},BAKED:{},portCache:new Map(),
    scene:{children:[]},staticWorld:[],DPR:1,DPRS:1,loop(){},update(){},sync(){},syncFx(){},drawOverlay(){},
    hudTick(){},drawMini(){},pathPoint(){},pathEnt(){},saveMemory(){},campaign:{},landscapeBusy:false,
    campaignActive:false,canStart:()=>true,$:key=>{if(!elements.has(key))elements.set(key,{hidden:true});return elements.get(key);},
    saveProgress(){},async prepareLandscape(){if(fail)throw Error('landscape allocation failed');},setupWorld(){},
    memoryIntro(){},showMemoryCard(){ctx.paused=true;},openCampaign(){},
    closeModal(){actions.close++;},beginStage(){actions.begin++;},openMenu(){}};
  vm.createContext(ctx);vm.runInContext(start,ctx);
  vm.runInContext(fs.readFileSync(path.join(root,'tests/performance/harness.js'),'utf8'),ctx);
  const [sample]=await ctx.window.__perfReview.transitions([2],1000);
  assert.equal(sample.valid,!fail&&mode==='healthy');
  if(!fail&&mode==='healthy'){assert.equal(sample.renderedFrames,2);assert.ok(sample.simulationAdvancedSeconds>0,'Wait beyond the first zero-time frame');}
  if(!fail&&mode!=='healthy'){assert.equal(sample.settleTimedOut,true);assert.ok(clock>=15000,'Readiness wait is bounded');}
  if(fail){
    assert.match(sample.errors.join(' '),/landscape allocation failed/);
    assert.equal(logs.length,1,'Keep the original console diagnostic');
    assert.deepEqual(actions,{close:0,begin:0},'Preserve failure dialog/stage state');
    assert.equal(ctx.paused,true);
  } else {
    assert.equal(sample.errors.length,0);
    assert.deepEqual(actions,{close:1,begin:1});
  }
}

async function runnerFailure(mode='cdp') {
  const missingExecutable=mode==='startup',campaignMode=mode.startsWith('campaign');
  const source=fs.readFileSync(path.join(root,'tests/performance/run-review.cjs'),'utf8');
  const output='/private/tmp/mock-diagnostic-output.json';
  const files=new Map([[output,JSON.stringify({valid:true,stale:true})]]),writes=[];
  let killed=false,closed=false;
  const fakeFs={existsSync:()=>!missingExecutable,mkdtempSync:()=>'/private/tmp/mock-profile',
    readFileSync:()=> '12345\n',mkdirSync(){},writeFileSync:(p,v)=>{files.set(p,v);writes.push(JSON.parse(v));},rmSync(){}};
  const child=new EventEmitter();child.stderr=new EventEmitter();child.exitCode=0;child.signalCode=null;child.kill=()=>{killed=true;};
  class FakeWebSocket {
    constructor(){queueMicrotask(()=>this.onopen());}
    send(raw){
      const m=JSON.parse(raw);let result={};
      if(m.method==='Runtime.evaluate'){
        const e=m.params.expression;
        if(campaignMode&&e==='!!window.__campaignResult')result={result:{value:mode==='campaign-failed'}};
        else if(campaignMode&&e==='window.__campaignResult')result={result:{value:{passed:false,levels:0,stages:0,checks:[],error:'injected campaign check failure'}}};
        else if(campaignMode&&e==='window.__perfReview.snapshot()')result={result:{value:{errors:mode==='campaign-fatal'?['injected fatal runtime error']:[]}}};
        else if(e==='window.__perfReview.start(1)')result={exceptionDetails:{text:'Uncaught',exception:{description:'Error: injected beginStage failure'}}};
        else result={result:{value:e==='!!window.__perfReview'?true:e.includes('ready()')?{}:e.includes('getContext')?{renderer:'fake'}:{comparable:true,marker:'retained menu evidence'}}};
      }
      queueMicrotask(()=>this.onmessage({data:JSON.stringify({id:m.id,result})}));
    }
    close(){}
  }
  const processFake={env:{PERF_CHROME:'/fake/chrome',PERF_CAMPAIGN:campaignMode?'1':''},argv:['node','run',output]};
  let clock=0;class FakeDate extends Date {static now(){return clock+=500000;}}
  const server=new EventEmitter();server.listen=(p,h,r)=>r();server.address=()=>({port:1234});server.close=r=>{closed=true;r();};
  const req=n=>n==='node:fs'?fakeFs:n==='node:child_process'?{spawn:()=>child}:n==='./server.cjs'?{createServer:()=>server}:require(n);
  await vm.runInNewContext(source,{require:req,process:processFake,WebSocket:FakeWebSocket,
    fetch:async()=>({json:async()=>[{type:'page',webSocketDebuggerUrl:'ws://fake'}]}),
    Date:FakeDate,setTimeout:(fn,ms,...args)=>setTimeout(fn,ms===1000?0:ms,...args),clearTimeout,console:{log(){},error(){}}});
  const report=JSON.parse(files.get(output));
  assert.equal(processFake.exitCode,1);
  assert.equal(writes[0].valid,false,'Invalidate stale output before launching');
  assert.equal(report.stale,undefined);
  assert.equal(report.valid,false);
  assert.ok(report.runAt&&report.finishedAt);
  if(mode==='campaign-failed'){
    assert.equal(report.phase,'complete');assert.equal(report.campaign.passed,false);
    assert.match(report.campaign.error,/injected campaign check failure/);
  }else{
    assert.equal(report.failure.phase,missingExecutable?'initialization':campaignMode?'campaign-runtime':'start-memory-1');
    assert.match(report.failure.error,missingExecutable?/Set PERF_CHROME/:mode==='campaign-missing'?/report did not arrive/:mode==='campaign-fatal'?/fatal runtime error/:/injected beginStage failure/);
  }
  if(!missingExecutable){
    if(!campaignMode)assert.equal(report.menu.marker,'retained menu evidence');
    assert.ok(killed&&closed,'Clean up owned browser and server on failure');
  }

}

(async()=>{
  await missionLoad(true);await missionLoad(false);await missionLoad(false,'stalled');await missionLoad(false,'no-simulation');await missionLoad(false,'late-ready');
  for(const mode of ['cdp','startup','campaign-missing','campaign-failed','campaign-fatal'])await runnerFailure(mode);
  console.log('Diagnostic regressions passed: caught mission failure, healthy load, CDP exception, startup failure, missing campaign report, failed campaign check, fatal campaign runtime error.');
})().catch(e=>{console.error(e);process.exitCode=1;});

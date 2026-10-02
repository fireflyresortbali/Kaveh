// Exercise the production visibility lifecycle with queued asynchronous WebAudio operations.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
const start=html.indexOf('function refreshAppActivity(){');
const end=html.indexOf("\ndocument.addEventListener('visibilitychange',refreshAppActivity);",start);
assert.ok(start>=0&&end>start,'Production refreshAppActivity source was not found');
const lifecycle=html.slice(start,end);
const acceptance=fs.readFileSync(path.join(__dirname,'optimization-checks.js'),'utf8');
const rapidPredicate=acceptance.match(/await until\((\(\)=>ctx\.state==='running'&&AU\.resumeAfterHidden===false)/)?.[1];
assert.ok(rapidPredicate,'Rapid audio check must wait for the current resume continuation');
const isRapidAudioReady=(state,resumeAfterHidden)=>vm.runInNewContext(rapidPredicate,{ctx:{state},AU:{resumeAfterHidden}})();
assert.equal(isRapidAudioReady('running',true),false,'Old state-only condition would pass while lifecycle work is pending');
assert.equal(isRapidAudioReady('running',false),true,'The shipped acceptance predicate passes after the current resume completes');
assert.equal(isRapidAudioReady('suspended',true),false,'A stalled or rejected resume stays a failure');
const untilLine=acceptance.split('\n').find(line=>line.startsWith('  const until=async('));
assert.ok(untilLine&&untilLine.includes('JSON.stringify(diagnostic())'),'Acceptance failure must serialize its diagnostic snapshot');
class MockAudioContext {
  constructor(initialState,suspendDelay,resumeDelay){this.state=initialState;this.delays={suspend:suspendDelay,resume:resumeDelay};this.trace=[];this.tail=Promise.resolve();}
  operation(kind){const entry={kind,calledAt:Date.now(),stateAtCall:this.state};this.trace.push(entry);const op=this.tail.then(()=>new Promise(resolve=>setTimeout(()=>{this.state=kind==='suspend'?'suspended':'running';entry.resolvedAt=Date.now();entry.stateAtResolve=this.state;resolve();},this.delays[kind])));this.tail=op;return op;}
  suspend(){return this.operation('suspend');} resume(){return this.operation('resume');}
}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitFor(predicate,label){const deadline=Date.now()+1000;while(!predicate()&&Date.now()<deadline)await delay(2);assert.ok(predicate(),label);}
async function run({name,initial='running',suspendDelay=0,resumeDelay=0,yieldBetweenEvents=false,inFlightResume=false}){
  const ctx=new MockAudioContext(initial,suspendDelay,resumeDelay),doc={hidden:false},AU={ctx,timer:1,ambientTimer:1,resumeAfterHidden:initial==='suspended',suspending:Promise.resolve()};
  let appInactive=false,pageAway=false,activityEpoch=0,raf=1,scene=1,requests=0;
  const sandbox={document:doc,window:{},AU,performance:{now:()=>Date.now()},requestAnimationFrame:()=>++raf,cancelAnimationFrame:()=>{raf=0;},clearInterval(){},setInterval:()=>++requests,auTick(){},auBirds(){},clearTransientInput(){},requestWorldFrame(){requests++;},sceneLoop(){requests++;},$:()=>({hidden:true}),
    get appInactive(){return appInactive;},set appInactive(v){appInactive=v;},get pageAway(){return pageAway;},set pageAway(v){pageAway=v;},get activityEpoch(){return activityEpoch;},set activityEpoch(v){activityEpoch=v;},get worldRAF(){return raf;},set worldRAF(v){raf=v;},get sceneAnim(){return scene;},set sceneAnim(v){scene=v;}};
  vm.runInNewContext(lifecycle+';globalThis.refreshAppActivity=refreshAppActivity;',sandbox);
  const fire=(active)=>{pageAway=!active;sandbox.refreshAppActivity();};
  if(inFlightResume){
    fire(false);fire(true);
    await waitFor(()=>ctx.trace.some(x=>x.kind==='resume'),`${name}: first resume started`);
    assert.equal(ctx.trace.at(-1).kind,'resume',`${name}: resume is in flight before second hide`);
    assert.equal(ctx.trace.at(-1).resolvedAt,undefined,`${name}: resume remains pending before second hide`);
    fire(false);fire(true);
  }else{
    fire(false);fire(true);if(yieldBetweenEvents)await Promise.resolve();
    fire(false);fire(true);if(yieldBetweenEvents)await Promise.resolve();
    if(initial==='running'){
      assert.equal(ctx.state,'running',`${name}: pre-burst state remains visible during asynchronous suspension`);
      assert.equal(AU.resumeAfterHidden,true,`${name}: current-epoch resume remains pending while raw running predicate is already true`);
    }
  }
  await waitFor(()=>ctx.state==='running'&&!AU.resumeAfterHidden&&AU.timer&&AU.ambientTimer,`${name}: final resume and activity continuation`);
  assert.equal(AU.resumeAfterHidden,false,`${name}: pending resume flag cleared`);assert.equal(appInactive,false,`${name}: app active`);
  assert.ok(ctx.trace.some(x=>x.kind==='suspend'),`${name}: suspend recorded`);assert.ok(ctx.trace.some(x=>x.kind==='resume'),`${name}: resume recorded`);assert.equal(ctx.trace.at(-1).kind,'resume',`${name}: final queued audio operation resumes`);
  return {name,trace:ctx.trace.map(({kind,stateAtCall,stateAtResolve})=>({kind,stateAtCall,stateAtResolve})),epoch:activityEpoch};
}
(async()=>{const results=[];for(const config of [
  {name:'synchronous burst, suspend slow',suspendDelay:12,resumeDelay:1},{name:'synchronous burst, resume slow',suspendDelay:1,resumeDelay:12},
  {name:'microtask-separated burst',suspendDelay:4,resumeDelay:4,yieldBetweenEvents:true},{name:'already suspended before rapid burst',initial:'suspended',suspendDelay:5,resumeDelay:5}
  ,{name:'hide arrives during an in-flight resume',suspendDelay:1,resumeDelay:20,inFlightResume:true}
])results.push(await run(config));
  const diagnostic=vm.runInNewContext(untilLine+';until',{performance:{now:()=>Date.now()},delay});
  await assert.rejects(diagnostic(()=>false,'stalled resume',10,()=>({elapsedMs:11,state:'suspended',resumeAfterHidden:true,audioOps:[{method:'resume',error:'rejected'}]})),/stalled resume .*"state":"suspended".*"method":"resume"/);
  console.log(JSON.stringify({passed:true,predicateSourceVerified:true,diagnosticSourceVerified:true,cases:results},null,2));})().catch(error=>{console.error(error);process.exitCode=1;});

// Exercise the production visibility lifecycle with queued asynchronous WebAudio operations.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
const start=html.indexOf('function refreshAppActivity(){');
const end=html.indexOf("\ndocument.addEventListener('visibilitychange',refreshAppActivity);",start);
assert.ok(start>=0&&end>start,'Production refreshAppActivity source was not found');
const lifecycle=html.slice(start,end);
const acceptance=fs.readFileSync(path.join(__dirname,'optimization-checks.js'),'utf8');
const untilObservedLine=acceptance.split('\n').find(line=>line.startsWith('  const untilObserved=async('));
const readCompletionLine=acceptance.split('\n').find(line=>line.startsWith('  const readRapidResumeCompletion='));
const recordCompletionLine=acceptance.split('\n').find(line=>line.startsWith('  const recordResumeCompletion='));
assert.ok(untilObservedLine&&untilObservedLine.includes('value.completedAt>deadline'),'Observed completion must retain the strict original deadline');
assert.ok(untilObservedLine.includes('JSON.stringify(diagnostic({elapsedMs:'),'Acceptance failure must serialize its diagnostic snapshot');
assert.ok(readCompletionLine&&readCompletionLine.includes('rapidResumeCompletion.epoch===activityEpoch')&&readCompletionLine.includes("ctx.state==='running'")&&readCompletionLine.includes('AU.resumeAfterHidden===false'),'Readiness must match current epoch and healthy audio state');
assert.ok(recordCompletionLine&&recordCompletionLine.includes('op.callEpoch===activityEpoch')&&recordCompletionLine.includes('!AU.resumeAfterHidden'),'Only the current, completed resume may record readiness');
class MockAudioContext {
  constructor(initialState,suspendDelay,resumeDelay){this.state=initialState;this.delays={suspend:suspendDelay,resume:resumeDelay};this.trace=[];this.tail=Promise.resolve();}
  operation(kind){const entry={kind,calledAt:Date.now(),stateAtCall:this.state};this.trace.push(entry);const op=this.tail.then(()=>new Promise(resolve=>setTimeout(()=>{this.state=kind==='suspend'?'suspended':'running';entry.resolvedAt=Date.now();entry.stateAtResolve=this.state;resolve();},this.delays[kind])));this.tail=op;return op;}
  suspend(){return this.operation('suspend');} resume(){return this.operation('resume');}
}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function verifyCompletionSource(){
  const completionEnv={queueMicrotask,performance:{now:()=>100},activityEpoch:7,appInactive:false,AU:{resumeAfterHidden:false},ctx:{state:'running'},rapidResumeCompletion:null};
  vm.runInNewContext(recordCompletionLine+';'+readCompletionLine+';globalThis.__record=recordResumeCompletion;globalThis.__read=readRapidResumeCompletion',completionEnv);
  completionEnv.__record({method:'resume',callEpoch:6});await new Promise(resolve=>queueMicrotask(resolve));
  assert.equal(completionEnv.__read(),null,'Stale epoch resume does not signal completion');
  completionEnv.__record({method:'resume',callEpoch:7});await new Promise(resolve=>queueMicrotask(resolve));
  assert.ok(completionEnv.__read(),'Current epoch completion is accepted only while context is running and resume flag is clear');
  completionEnv.AU.resumeAfterHidden=true;assert.equal(completionEnv.__read(),null,'An incomplete final continuation stays failed');
  const continuationEnv={queueMicrotask,performance:{now:()=>200},activityEpoch:9,appInactive:false,AU:{resumeAfterHidden:true},ctx:{state:'suspended'},rapidResumeCompletion:null};
  vm.runInNewContext(recordCompletionLine+';globalThis.__record=recordResumeCompletion',continuationEnv);
  const audioPromise=Promise.resolve(),op={method:'resume',callEpoch:9};
  const observedResume=()=>{audioPromise.then(()=>continuationEnv.__record(op));return audioPromise;};
  await (async()=>{await observedResume();continuationEnv.ctx.state='running';if(continuationEnv.activityEpoch===op.callEpoch)continuationEnv.AU.resumeAfterHidden=false})();
  assert.equal(continuationEnv.rapidResumeCompletion?.completedAt,200,'Completion microtask runs after the awaited current-epoch production continuation');
  assert.equal(continuationEnv.rapidResumeCompletion?.epoch,9,'Recorded completion is tagged with its epoch');
}
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
(async()=>{await verifyCompletionSource();const results=[];for(const config of [
  {name:'synchronous burst, suspend slow',suspendDelay:12,resumeDelay:1},{name:'synchronous burst, resume slow',suspendDelay:1,resumeDelay:12},
  {name:'microtask-separated burst',suspendDelay:4,resumeDelay:4,yieldBetweenEvents:true},{name:'already suspended before rapid burst',initial:'suspended',suspendDelay:5,resumeDelay:5}
  ,{name:'hide arrives during an in-flight resume',suspendDelay:1,resumeDelay:20,inFlightResume:true}
])results.push(await run(config));
  async function checkObservedCompletion(completionAt,callbackAt,shouldPass,label){let clock=0,observed=null;const wait=vm.runInNewContext(untilObservedLine+';untilObserved',{performance:{now:()=>clock},delay:async()=>{clock=callbackAt;if(completionAt!==null)observed={completedAt:completionAt,epoch:7};},check:(ok,message)=>assert.ok(ok,message)});const task=wait(()=>observed,label,0,3000,details=>({elapsedMs:details.elapsedMs,completionMs:details.completionMs,state:completionAt===null?'suspended':'running',audioOps:[{method:'resume',settledAt:completionAt}]}));if(shouldPass)await task;else await assert.rejects(task,new RegExp(label+' .*"method":"resume"'));}
  await checkObservedCompletion(2752,5286,true,'resume completed before delayed poll');
  await checkObservedCompletion(3001,5286,false,'resume completed after deadline');
  await checkObservedCompletion(null,5286,false,'stalled or rejected resume');
  console.log(JSON.stringify({passed:true,currentEpochVerified:true,completionDeadlineCases:['on-time completion with late poll','late completion rejected','stalled/rejected resume rejected'],cases:results},null,2));})().catch(error=>{console.error(error);process.exitCode=1;});

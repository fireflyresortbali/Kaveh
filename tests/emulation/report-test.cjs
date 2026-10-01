const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createReport,validateEvent,isComplete}=require('./report.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'kaveh-report-test-'));
try {
  const dir=path.join(root,'partial'),log=createReport(dir,{platform:'test'});
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'report.json'))).valid,false);
  const ready={sequence:0,kind:'ready',data:{source:{htmlSha256:'fixture'}}};
  validateEvent(ready,0);log.append(ready);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'events.jsonl'),'utf8').trim()).kind,'ready');
  assert.throws(()=>validateEvent(ready,1),/out-of-order/);
  assert.throws(()=>validateEvent({sequence:1,kind:'invented',data:{}},1),/Invalid/);
  log.finish(Error('Missing completion'));
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'report.json'))).valid,false);
  assert.match(fs.readFileSync(path.join(dir,'summary.md'),'utf8'),/INCOMPLETE/);
  assert.throws(()=>createReport(dir,{}),/EEXIST/);
  const missing=createReport(path.join(root,'missing'),{platform:'test'});missing.finish();
  assert.equal(missing.report.valid,false);
  assert.equal(isComplete([{kind:'complete',data:{passed:true,final:{errors:[]}}}]),false,'Premature completion cannot pass');
  const snap={errors:[],renderers:{main:{geometries:1,textures:1,programs:1}}};
  const complete=[{kind:'ready',data:{source:{htmlSha256:'fixture'}}},
    ...['campaign-menu','mission-1-gameplay','paused-menu'].map(label=>({kind:'capture',data:{label,comparable:true,truncated:false,visibilityChanges:0,errors:[],before:{paused:label!=='mission-1-gameplay',completedMainRenders:0,simulationSeconds:0,errors:[]},after:{paused:label!=='mission-1-gameplay',completedMainRenders:label==='mission-1-gameplay'?2:0,simulationSeconds:label==='mission-1-gameplay'?1:0,errors:[]},raw:label==='mission-1-gameplay'?{'main.calls':[1,1],'main.submitMs':[1,1],rafIntervalMs:[16]}:{},metrics:label==='mission-1-gameplay'?{'main.calls':{n:2},'main.submitMs':{n:2}}:{}}})),
    ...['playing','paused'].map(label=>({kind:'lifecycle',data:{label,hiddenRenders:0,hiddenSimulationSeconds:0,preservedPause:true,resumedCorrectly:true,before:{paused:label==='paused'},resumed:{paused:label==='paused',completedMainRenders:0,simulationSeconds:0},after:{paused:label==='paused',completedMainRenders:1,simulationSeconds:label==='paused'?0:0.5}}})),
    {kind:'effects',data:Array.from({length:10},()=>snap)},
    ...Array.from({length:21},(_,index)=>({kind:'transition-pair',data:{index,warmup:index===0,samples:[1,2].map(id=>({...snap,id,valid:true}))}})),
    {kind:'complete',data:{passed:true,final:snap}}];
  assert.equal(isComplete(complete),true);
  for(const mutate of [d=>delete d.before,d=>delete d.after,d=>delete d.raw,d=>delete d.metrics,d=>d.after.simulationSeconds=5,d=>d.after.completedMainRenders=3]){
    const broken=structuredClone(complete);mutate(broken.find(e=>e.kind==='capture'&&e.data.label==='campaign-menu').data);
    assert.equal(isComplete(broken),false,'Incomplete or contradictory menu capture fails');
  }
  for(const mutate of [d=>d.after.simulationSeconds=0,d=>d.raw['main.calls']=[],d=>d.raw.rafIntervalMs=[],d=>d.metrics['main.calls'].n=0]){
    const broken=structuredClone(complete);mutate(broken.find(e=>e.kind==='capture'&&e.data.label==='mission-1-gameplay').data);
    assert.equal(isComplete(broken),false,'Stalled or incomplete gameplay capture fails');
  }
  const contradictory=JSON.parse(JSON.stringify(complete));contradictory.find(e=>e.kind==='lifecycle'&&e.data.label==='paused').data.after.completedMainRenders=30;
  assert.equal(isComplete(contradictory),false,'Raw snapshots override a claimed resume pass');
  for(const kind of ['ready','capture','lifecycle','effects','transition-pair','complete'])assert.equal(isComplete(complete.filter(e=>e.kind!==kind)),false,kind+' cannot be missing');
  const growing=JSON.parse(JSON.stringify(complete));growing.find(e=>e.kind==='transition-pair'&&e.data.index===20).data.samples[0].renderers.main.geometries++;
  assert.equal(isComplete(growing),false,'Resource growth must fail');
  console.log('PASS: incremental logs, initial invalid status, missing completion, failure summary, event ordering, unknown event and output collision checks.');
}finally{fs.rmSync(root,{recursive:true,force:true});}

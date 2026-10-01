const fs=require('node:fs'),path=require('node:path');
function createReport(dir,metadata){
  // A run must never overwrite or accidentally reuse an earlier successful result.
  fs.mkdirSync(dir,{recursive:false});
  const report={schemaVersion:1,valid:false,startedAt:new Date().toISOString(),...metadata,events:[],limitations:[
    'Emulators use Mac resources: not phone FPS, GPU timing, battery or thermal qualification.',
    'Instrumented, random gameplay with adaptive resolution; compare only matching scenarios and settings.',
    'Renderer resources are counts, not GPU bytes. Native app memory excludes separate web/GPU processes.',
    'Local HTTP test shell; not bundled offline release, store build, device floor, touch or audio acceptance.'
  ]};
  const save=()=>fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2)+'\n');
  save();
  return {report,save,append(event){
    fs.appendFileSync(path.join(dir,'events.jsonl'),JSON.stringify({receivedAt:new Date().toISOString(),...event})+'\n');
    report.events.push(event);save();
  },finish(error){
    report.finishedAt=new Date().toISOString();
    if(error)report.failure=String(error.stack||error);
    report.valid=!error&&isComplete(report.events);
    save();
    const lines=['# '+report.platform+' emulator benchmark','',`Status: **${report.valid?'PASS (emulator checks only)':'INCOMPLETE / FAIL'}**`,
      `Started: ${report.startedAt}`,'', '| Scenario | RAF p95 (ms) | CPU render submission p95 (ms) | Main renders |', '| --- | ---: | ---: | ---: |'];
    for(const e of report.events.filter(x=>x.kind==='capture')){
      const d=e.data;lines.push(`| ${d.label} | ${d.metrics.rafIntervalMs?.p95?.toFixed(2)??'idle'} | ${d.metrics['main.submitMs']?.p95?.toFixed(2)??'idle'} | ${d.after.completedMainRenders-d.before.completedMainRenders} |`);
    }
    lines.push('',...report.limitations.map(x=>'- '+x));
    if(error)lines.push('','Failure: '+String(error.message||error));
    lines.push('','See report.json for environment/source hashes and raw samples; events.jsonl for incremental events.');
    fs.writeFileSync(path.join(dir,'summary.md'),lines.join('\n')+'\n');
  }};
}
function validateEvent(event,expected){
  if(!event||event.sequence!==expected||!['ready','capture','background-ready','lifecycle','effects','transition-pair','complete','fatal'].includes(event.kind)||!event.data||typeof event.data!=='object')throw Error('Invalid or out-of-order event');
}
function validResume(d){
  if(!d.before||!d.resumed||!d.after||d.before.paused!==d.resumed.paused)return false;
  const renders=d.after.completedMainRenders-d.resumed.completedMainRenders;
  const simulation=d.after.simulationSeconds-d.resumed.simulationSeconds;
  if(!Number.isFinite(renders)||renders<0||!Number.isFinite(simulation))return false;
  return d.before.paused ? d.after.paused&&renders<=1&&simulation===0 : !d.after.paused&&renders>0&&simulation>0;
}
function validCapture(d){
  if(!d||d.comparable!==true||d.truncated!==false||d.visibilityChanges!==0||d.errors?.length!==0||!d.before||!d.after||!d.raw||!d.metrics)return false;
  for(const snap of [d.before,d.after])if(snap.errors?.length!==0||!Number.isInteger(snap.completedMainRenders)||snap.completedMainRenders<0||!Number.isFinite(snap.simulationSeconds))return false;
  const renders=d.after.completedMainRenders-d.before.completedMainRenders,simulation=d.after.simulationSeconds-d.before.simulationSeconds;
  if(renders<0)return false;
  if(renders>0){
    for(const key of ['main.calls','main.submitMs'])if(!Array.isArray(d.raw[key])||d.raw[key].length!==renders||!d.raw[key].every(v=>Number.isFinite(v)&&v>=0)||d.metrics[key]?.n!==renders)return false;
  }else if((d.raw['main.calls']?.length||0)!==0||(d.raw['main.submitMs']?.length||0)!==0)return false;
  if(d.label==='mission-1-gameplay')return d.before.paused===false&&d.after.paused===false&&renders>0&&simulation>0&&Array.isArray(d.raw.rafIntervalMs)&&d.raw.rafIntervalMs.length>0&&d.raw.rafIntervalMs.every(v=>Number.isFinite(v)&&v>0);
  if(!['campaign-menu','paused-menu'].includes(d.label))return false;
  return d.before.paused===true&&d.after.paused===true&&simulation===0&&renders<=(d.label==='campaign-menu'?0:1);
}
function isComplete(events){
  const of=kind=>events.filter(e=>e.kind===kind).map(e=>e.data);
  const complete=of('complete');
  if(complete.length!==1||complete[0].passed!==true||complete[0].final?.errors?.length!==0||of('fatal').length)return false;
  if(of('ready').length!==1||!of('ready')[0].source?.htmlSha256)return false;
  const captures=of('capture');
  if(captures.length!==3||!['campaign-menu','mission-1-gameplay','paused-menu'].every(label=>captures.some(d=>d.label===label&&validCapture(d))))return false;
  const lives=of('lifecycle');
  if(lives.length!==2||!['playing','paused'].every(label=>lives.some(d=>d.label===label&&d.hiddenRenders===0&&d.hiddenSimulationSeconds===0&&d.preservedPause&&d.resumedCorrectly&&validResume(d))))return false;
  const effects=of('effects');
  if(effects.length!==1||effects[0].length!==10||new Set(effects[0].map(d=>JSON.stringify(d.renderers?.main))).size!==1)return false;
  const pairs=of('transition-pair');
  if(pairs.length!==21||!pairs.every((p,i)=>p.index===i&&p.warmup===(i===0)&&p.samples.length===2&&p.samples.every((s,j)=>s.id===j+1&&s.valid)))return false;
  return [1,2].every(id=>new Set(pairs.slice(1).flatMap(p=>p.samples).filter(s=>s.id===id).map(s=>JSON.stringify(s.renderers.main))).size===1);
}
module.exports={createReport,validateEvent,isComplete,validCapture};

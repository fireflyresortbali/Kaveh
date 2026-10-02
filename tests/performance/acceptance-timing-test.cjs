// Execute the real browser acceptance wait with controlled delayed/stalled progress.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/optimization-checks.js','utf8');
const line=source.split('\n').find(s=>s.includes('const until=async('));assert.ok(line,'Review extraction if the helper changes');
async function run(mode){
  let time=0,checks=0;
  const until=vm.runInNewContext(line+';until',{performance:{now:()=>time},delay:async ms=>{time+=mode==='late'?17000:ms;},check(ok,label){assert.ok(ok,label);checks++;}});
  const predicate=()=>mode!=='stalled'&&time>=4000;
  if(mode==='delayed'){await until(predicate,'delayed resume',15000);assert.equal(time,4000);assert.equal(checks,1);}
  else await assert.rejects(until(predicate,'must fail',mode==='default'?undefined:15000),/must fail/);
}
(async()=>{for(const mode of ['delayed','stalled','late','default'])await run(mode);console.log('PASS: delayed resume, stalled progress, readiness after deadline, default audio deadline.');})().catch(e=>{console.error(e);process.exitCode=1;});

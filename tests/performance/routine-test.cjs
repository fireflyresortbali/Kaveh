const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {plan,assess,runBatch,hash}=require('./check.cjs');
const sourceHash=hash();
const resources={geometries:12,textures:5,programs:3};
const capture=playing=>({comparable:true,truncated:false,visibilityChanges:0,errors:[],before:{paused:!playing,completedMainRenders:10,simulationSeconds:1},after:{paused:!playing,completedMainRenders:playing?50:10,simulationSeconds:playing?2:1}});
const healthy=()=>({valid:true,finishedAt:new Date().toISOString(),environment:{source:{htmlSha256:sourceHash}},final:{errors:[]},menu:capture(false),paused:capture(false),gameplay:capture(true),effects:Array.from({length:10},()=>({renderers:{main:{...resources}}})),transitions:Array.from({length:6},(_,i)=>({valid:true,id:i%2+1,memory:i%2+1,renderedFrames:2,simulationAdvancedSeconds:0.1,settleTimedOut:false,errors:[],renderers:{main:{...resources}}}))});
assert.deepEqual(assess({name:'desktop'},healthy(),0,sourceHash),[]);
const mutations=[r=>r.valid=false,r=>delete r.finishedAt,r=>r.environment.source.htmlSha256='stale',r=>r.menu.after.completedMainRenders++,r=>r.paused.after.simulationSeconds++,r=>r.gameplay.after.completedMainRenders=10,r=>r.gameplay.after.simulationSeconds=1,r=>r.gameplay.visibilityChanges++,r=>r.gameplay.truncated=true,r=>r.final.errors.push('caught load failure'),r=>r.effects.pop(),r=>r.effects[4].renderers.main.textures++,r=>r.transitions.pop(),r=>r.transitions[4].renderers.main.programs--,r=>r.transitions[4].memory=2,r=>r.transitions[4].valid=false];
for(const mutate of mutations){const r=healthy();mutate(r);assert.ok(assess({name:'desktop'},r,0,sourceHash).length);}
assert.ok(assess({name:'desktop'},healthy(),1,sourceHash).length,'Nonzero child cannot pass with a valid report');
const acceptance={valid:true,finishedAt:'now',environment:{source:{htmlSha256:sourceHash}},acceptance:{passed:false,checks:Array(25).fill('check')}};
assert.ok(assess({name:'acceptance'},acceptance,0,sourceHash).length);
acceptance.acceptance.passed=true;assert.deepEqual(assess({name:'acceptance'},acceptance,0,sourceHash),[]);
assert.throws(()=>plan('mobile','android',''));assert.equal(plan('mobile','ios','owned-device').length,3);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'kaveh-routine-test-'));
try{
 const steps=plan('mobile','android','owned-device');let calls=0;
 const dir=path.join(tmp,'failed');const result=runBatch(steps,dir,{run(script,args,env,log){calls++;fs.writeFileSync(log,'retained failure');if(calls===1)throw Error('injected launch error');return 1;}});
 assert.equal(calls,3,'A failed trial must not skip or replace other planned trials');assert.equal(result.valid,false);assert.equal(result.trials.length,3);assert.match(fs.readFileSync(path.join(dir,'summary.md'),'utf8'),/FAIL/);
 assert.throws(()=>runBatch(steps,dir),/EEXIST/,'Do not overwrite evidence');
 const good=runBatch(plan('desktop'),path.join(tmp,'pass'),{run(script,args,env,log){fs.writeFileSync(log,'ok');fs.writeFileSync(args[0],JSON.stringify(env.PERF_ACCEPTANCE?acceptance:healthy()));return 0;}});
 assert.equal(good.valid,true);assert.equal(good.trials.length,2);
 const missing=runBatch(plan('campaign'),path.join(tmp,'missing'),{run:()=>0});assert.equal(missing.valid,false,'Exit 0 without a report is not a pass');
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
console.log('Routine regressions passed: healthy run, 16 invalid evidence cases, failed acceptance/child, missing report, all planned trials retained and output collision.');

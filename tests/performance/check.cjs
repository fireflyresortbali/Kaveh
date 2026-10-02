// Unified development checks. Node 24, no package install or automatic SDK setup.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),crypto=require('node:crypto');
const {desktopFailures}=require('./validate.cjs');
const {isComplete}=require('../emulation/report.cjs');
const root=path.resolve(__dirname,'../..');
const hash=()=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'index.html'))).digest('hex');
const quickScripts=['build-campaign.cjs','tests/performance/diagnostic-regression.cjs','tests/performance/acceptance-timing-test.cjs','tests/performance/audio-lifecycle-test.cjs','tests/performance/routine-test.cjs','tests/emulation/report-test.cjs','tests/emulation/scenario-test.cjs','tests/emulation/runner-test.cjs','tests/emulation/host-monitor-test.cjs'];
function plan(profile,platform,device){
  if(['desktop','stress','campaign'].includes(profile))return [{name:profile,script:'tests/performance/run-review.cjs',env:profile==='stress'?{PERF_STRESS:'1'}:profile==='campaign'?{PERF_CAMPAIGN:'1'}:{}},...(profile==='desktop'?[{name:'acceptance',script:'tests/performance/run-review.cjs',env:{PERF_ACCEPTANCE:'1'}}]:[])];
  if(profile==='mobile'&&['android','ios'].includes(platform)&&device)return Array.from({length:3},(_,i)=>({name:platform+'-'+(i+1),script:'tests/emulation/run.cjs',platform,device}));
  throw Error('Usage: node tests/performance/check.cjs quick | desktop|stress|campaign NEW_DIR | mobile android|ios DEVICE_ID NEW_DIR');
}
function assess(step,report,status,expectedHash){
  const failures=[];
  if(status!==0)failures.push('Child command failed (exit '+status+')');
  if(!report||report.valid!==true||!report.finishedAt)failures.push('Missing, incomplete or failing report');
  if(step.platform){
    if(report?.platform!==step.platform||!Array.isArray(report?.events)||!isComplete(report.events))failures.push('Incomplete native scenarios');
    if(report?.events?.find(e=>e.kind==='ready')?.data?.source?.htmlSha256!==expectedHash)failures.push('Native source hash mismatch');
  }else{
    if(report?.environment?.source?.htmlSha256!==expectedHash)failures.push('Desktop source hash mismatch');
    if(step.name==='acceptance'||step.name==='stress'){
      if(report?.acceptance?.passed!==true||report.acceptance.checks?.length!==25)failures.push('Missing or failed 25-check acceptance suite');
    }
    if(step.name==='campaign'){
      if(report?.campaign?.passed!==true||report.campaign.levels!==62||report.campaign.stages!==194||report.final?.errors?.length!==0)failures.push('Incomplete campaign coverage');
    }else if(step.name!=='acceptance')failures.push(...desktopFailures(report,step.name==='stress'?42:6));
  }
  return failures;
}
function execute(script,args,env,log){
  const clean={...process.env};for(const key of ['PERF_ACCEPTANCE','PERF_CAMPAIGN','PERF_STRESS'])delete clean[key];
  const fd=fs.openSync(log,'wx');
  try{const result=cp.spawnSync(process.execPath,[script,...args],{cwd:root,env:{...clean,...env},stdio:['ignore',fd,fd]});return result.status===0&&!result.error?0:result.status??1;}finally{fs.closeSync(fd);}
}
function runBatch(steps,dir,{run=execute,sourceHash=hash(),metadata={}}={}){
  fs.mkdirSync(dir,{recursive:false}); // Existing output is never overwritten, even after a failed run.
  const report={schemaVersion:1,valid:false,startedAt:new Date().toISOString(),sourceHash,...metadata,physicalMobile:false,visualReview:steps[0].platform?'pending — inspect every screen.png, including failures':'not applicable',trials:[]};
  const save=()=>fs.writeFileSync(path.join(dir,'routine.json'),JSON.stringify(report,null,2)+'\n');save();
  for(const step of steps){
    const destination=path.join(dir,step.name+(step.platform?'':'.json'));
    const file=step.platform?path.join(destination,'report.json'):destination;
    const entry={name:step.name,report:path.relative(dir,file),valid:false};report.trials.push(entry);save();
    console.log('Running '+step.name+'; log: '+path.join(dir,step.name+'.log'));
    try{
      entry.exitCode=run(step.script,step.platform?[step.platform,step.device,destination]:[destination],step.env||{},path.join(dir,step.name+'.log'));
      const child=JSON.parse(fs.readFileSync(file,'utf8'));entry.failures=assess(step,child,entry.exitCode,sourceHash);
    }catch(e){entry.failures=[String(e.message||e)];}
    entry.valid=entry.failures.length===0;save();
    // Finish every planned trial. A failure is retained, never replaced by a retry.
  }
  report.finishedAt=new Date().toISOString();report.valid=report.trials.every(t=>t.valid);
  if(hash()!==sourceHash){report.valid=false;report.failure='Source changed while tests were running';}
  save();
  fs.writeFileSync(path.join(dir,'summary.md'),['# Routine performance checks','',`Automated status: **${report.valid?'PASS':'FAIL / INCOMPLETE'}**`,...report.trials.map(t=>`- ${t.name}: ${t.valid?'PASS':'FAIL'} — ${t.report}${t.failures.length?' — '+t.failures.join('; '):''}`),'',`Visual review: ${report.visualReview}.`,'Timing is diagnostic, not a physical-phone FPS, GPU, battery or thermal qualification.','See routine.json, per-run JSON and command logs. Never compare differing game/settings/hardware as an optimization A/B.',''].join('\n'));
  return report;
}
function quick(){
  const files=cp.execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard','--','*.js','*.cjs','*.mjs'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
  for(const file of new Set(files))cp.execFileSync(process.execPath,['--check',file],{cwd:root,stdio:'inherit'});
  for(const file of quickScripts)cp.execFileSync(process.execPath,[file,...(file==='build-campaign.cjs'?['--check']:[])],{cwd:root,stdio:'inherit'});
  console.log('PASS: syntax, generated campaign freshness, diagnostic and emulator failure regressions.');
}
function main(args=process.argv.slice(2)){
  if(Number(process.versions.node.split('.')[0])!==24)throw Error('Use Node.js 24 for comparable local and CI checks.');
  if(args[0]==='quick'&&args.length===1)return quick();
  const [profile,platform,device]=args;
  const steps=plan(profile,platform,device),output=profile==='mobile'?args[3]:args[1];
  if(!output||args.length!==(profile==='mobile'?4:2))throw Error('Supply a NEW output directory; see docs/PERFORMANCE-TESTING.md.');
  const metadata={profile,node:process.version,host:{platform:process.platform,arch:process.arch,release:os.release(),cpu:os.cpus()[0]?.model},commit:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()};
  const result=runBatch(steps,path.resolve(output),{metadata});
  console.log((result.valid?'PASS':'FAIL')+': '+path.resolve(output,'summary.md'));if(!result.valid)process.exitCode=1;
}
module.exports={plan,assess,runBatch,hash};
if(require.main===module)try{main();}catch(e){console.error(e.stack||e);process.exitCode=1;}

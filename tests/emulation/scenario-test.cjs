// Run the actual injected scenario against controlled lifecycle faults.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {isComplete}=require('./report.cjs');
async function check(fault){
  let paused=true,renders=0,sim=0,handler;
  const events=[];
  const snap=()=>({paused,completedMainRenders:renders,simulationSeconds:sim,errors:[],renderers:{main:{geometries:1,textures:1,programs:1}}});
  const context={EMULATION_ENDPOINT:'/test',console,AbortSignal,performance:{now:()=>0},
    document:{hidden:false,addEventListener:(n,h)=>handler=h,removeEventListener:()=>handler=null},
    R3:{getContext:()=>({getExtension:()=>null,getParameter:()=>null})},
    setTimeout(fn,ms){
      if(ms===500){
        if(paused){renders+=fault==='paused-render'?30:1;if(fault==='paused-simulation')sim+=0.5;}
        else{renders+=30;if(fault!=='playing-simulation')sim+=0.5;}
      }
      queueMicrotask(fn);
    },
    fetch:async(url,options)=>{
      const event=JSON.parse(options.body);events.push(event);
      if(event.kind==='background-ready'){context.document.hidden=true;handler();context.document.hidden=false;handler();}
      return {ok:true};
    },
    perfReview:{snapshot:snap,ready:async()=>({source:{htmlSha256:'fixture'}}),
      capture:async label=>{
        const before=snap(),playing=label==='mission-1-gameplay';
        if(playing){renders+=30;if(fault!=='capture-playing-simulation')sim+=1;}
        if(label==='campaign-menu'&&fault==='capture-menu-simulation')sim+=5;
        return {label,comparable:true,truncated:false,visibilityChanges:0,errors:[],before,after:snap(),
          raw:playing?{'main.calls':Array(30).fill(1),'main.submitMs':Array(30).fill(1),rafIntervalMs:[16,16]}:{},
          metrics:playing?{'main.calls':{n:30},'main.submitMs':{n:30}}:{}};
      },
      start:async()=>{paused=false;return {};},pause:()=>{paused=true;},
      effectCycles:async()=>Array.from({length:10},snap),transitions:async()=>[1,2].map(id=>({id,valid:true,...snap()}))}
  };
  await vm.runInNewContext(fs.readFileSync(__dirname+'/scenario.js','utf8'),context);
  assert.equal(isComplete(events),!fault,fault||'healthy');
  assert.equal(events.at(-1).kind,fault?'fatal':'complete');
  if(fault)assert.match(events.at(-1).data.message,/Lifecycle regression|Covered campaign|Gameplay capture invalid/);
}
(async()=>{for(const fault of [null,'paused-render','paused-simulation','playing-simulation','capture-menu-simulation','capture-playing-simulation'])await check(fault);console.log('PASS: healthy native captures/lifecycle; menu simulation, stalled capture simulation and paused/active resume faults.');})().catch(e=>{console.error(e);process.exitCode=1;});

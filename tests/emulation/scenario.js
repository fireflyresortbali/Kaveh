// Injected into the game closure only by the local emulation runner.
(async () => {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  let sequence = 0;
  const send = async (kind, data) => {
    const response = await fetch(EMULATION_ENDPOINT, {method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({sequence:sequence++,kind,data}), signal:AbortSignal.timeout(15000)});
    if (!response.ok) throw Error('Log collector rejected '+kind+': '+response.status);
  };
  const requireCheck = (condition,message) => { if(!condition) throw Error(message); };
  async function lifecycle(label) {
    const before=perfReview.snapshot();
    let hidden=null, resumed=null;
    const handler=()=>{
      const snap=perfReview.snapshot();
      if(document.hidden) hidden=snap;
      else if(hidden) resumed=snap;
    };
    document.addEventListener('visibilitychange',handler);
    try {
      await send('background-ready',{label,before});
      const deadline=performance.now()+90000;
      while(!resumed&&performance.now()<deadline)await wait(100);
      requireCheck(hidden&&resumed,'Missing real hidden/visible events: '+label);
      const result={label,before,hidden,resumed,
        hiddenRenders:resumed.completedMainRenders-hidden.completedMainRenders,
        hiddenSimulationSeconds:resumed.simulationSeconds-hidden.simulationSeconds,
        preservedPause:before.paused===resumed.paused};
      await wait(500);
      result.after=perfReview.snapshot();
      result.postResumeRenders=result.after.completedMainRenders-resumed.completedMainRenders;
      result.postResumeSimulationSeconds=result.after.simulationSeconds-resumed.simulationSeconds;
      result.resumedCorrectly=before.paused
        ? result.after.paused&&result.postResumeRenders<=1&&result.postResumeSimulationSeconds===0
        : !result.after.paused&&result.postResumeRenders>0&&result.postResumeSimulationSeconds>0;
      await send('lifecycle',result);
      requireCheck(result.hiddenRenders===0&&result.hiddenSimulationSeconds===0&&result.preservedPause&&result.resumedCorrectly,'Lifecycle regression: '+label);
    } finally {document.removeEventListener('visibilitychange',handler);}
  }
  try {
    const environment=await perfReview.ready();
    const gl=R3.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
    environment.graphics={version:gl.getParameter(gl.VERSION),vendor:debug?gl.getParameter(debug.UNMASKED_VENDOR_WEBGL):null,renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):null};
    environment.pageReadyMs=performance.now();
    await send('ready',environment);
    await wait(1000);
    const menu=await perfReview.capture('campaign-menu',3,true);
    await send('capture',menu);
    requireCheck(menu.comparable&&menu.before.paused&&menu.after.paused&&menu.after.simulationSeconds===menu.before.simulationSeconds&&menu.after.completedMainRenders===menu.before.completedMainRenders,'Covered campaign is rendering/simulating or capture invalid');
    const started=await perfReview.start(1);requireCheck(started.started!==false,'Mission failed to start');
    await wait(2000);
    const play=await perfReview.capture('mission-1-gameplay',15,true);
    await send('capture',play);
    requireCheck(play.comparable&&!play.before.paused&&!play.after.paused&&play.after.simulationSeconds>play.before.simulationSeconds&&play.after.completedMainRenders>play.before.completedMainRenders,'Gameplay capture invalid');
    await lifecycle('playing');
    perfReview.pause();
    const pause=await perfReview.capture('paused-menu',3,true);
    await send('capture',pause);
    requireCheck(pause.comparable&&pause.after.completedMainRenders-pause.before.completedMainRenders<=1&&pause.after.simulationSeconds===pause.before.simulationSeconds,'Pause continued rendering/simulation');
    await lifecycle('paused');
    const effects=await perfReview.effectCycles(10);
    await send('effects',effects);
    requireCheck(new Set(effects.map(x=>JSON.stringify(x.renderers.main))).size===1,'Effect resource count grows');
    // One warmup pair, followed by 20 comparable pairs. Stream each sample durably.
    const samples=[];
    for(let i=0;i<21;i++){
      const pair=await perfReview.transitions([1,2],500);
      samples.push(...pair);await send('transition-pair',{index:i,warmup:i===0,samples:pair});
      requireCheck(pair.every(x=>x.valid),'Mission transition failed to render');
    }
    for(const id of [1,2]){
      const rows=samples.slice(2).filter(x=>x.id===id);
      requireCheck(new Set(rows.map(x=>JSON.stringify(x.renderers.main))).size===1,'Warmed mission resources grow: '+id);
    }
    const final=perfReview.snapshot();requireCheck(final.errors.length===0,'Errors at end of run');
    await send('complete',{passed:true,final,audio:'Not tested: automated launch supplies no user audio gesture.'});
  } catch(error) {
    try{await send('fatal',{message:String(error.message||error)+'\n'+String(error.stack||'')});}catch(_) {console.error('Benchmark failed',error);}
  }
})();

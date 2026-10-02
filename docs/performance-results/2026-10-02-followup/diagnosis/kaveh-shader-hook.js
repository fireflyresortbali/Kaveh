window.__shaderProbe=async()=>{
  const result=[],wait=ms=>new Promise(r=>setTimeout(r,ms));
  const programs=()=>R3.info.programs.map(p=>({id:p.id,name:p.name,uses:p.usedTimes,key:p.cacheKey}));
  const render=R3.render;const frames=[];
  R3.render=function(...a){const v=render.apply(this,a);frames.push({memory:memory.id,simulation:now,frameN,programs:programs()});return v;};
  for(const id of [1,2,1,2,1,2]){
    frames.length=0;
    await perfReview.start(id);
    // Force exactly one production loop tick, at zero simulation time, then a positive tick.
    cancelAnimationFrame(worldRAF);worldRAF=0;loop(lastT);cancelAnimationFrame(worldRAF);worldRAF=0;
    const zero={...perfReview.snapshot(),programs:programs()};
    loop(lastT+50);cancelAnimationFrame(worldRAF);worldRAF=0;
    const positive={...perfReview.snapshot(),programs:programs()};
    loop(lastT+50);cancelAnimationFrame(worldRAF);worldRAF=0;
    const second={...perfReview.snapshot(),programs:programs()};
    result.push({id,zero,positive,second,frames:frames.slice()});paused=true;await wait(10);
  }
  return result;
};

// Host-independent correctness/resource gates. Timings are intentionally diagnostic.
function desktopFailures(r,count){
  const failures=[],check=(ok,label)=>{if(!ok)failures.push(label);};
  check(r?.final?.errors?.length===0,'Runtime errors or missing final snapshot');
  for(const key of ['menu','paused','gameplay']){
    const s=r?.[key];check(s?.comparable===true&&!s.truncated&&s.visibilityChanges===0&&s.errors?.length===0,key+': invalid capture');
    const renders=s?.after?.completedMainRenders-s?.before?.completedMainRenders;
    const simulation=s?.after?.simulationSeconds-s?.before?.simulationSeconds;
    if(key==='gameplay')check(Number.isFinite(renders)&&renders>0&&Number.isFinite(simulation)&&simulation>0&&s?.before?.paused===false&&s?.after?.paused===false,'Gameplay must render and simulate');
    else check(Number.isFinite(renders)&&renders>=0&&renders<=(key==='menu'?0:1)&&simulation===0&&s?.before?.paused===true&&s?.after?.paused===true,key+': recurring idle rendering or simulation');
  }
  const plateau=(samples,label)=>{
    for(const key of ['geometries','textures','programs']){
      const values=samples.map(s=>s?.renderers?.main?.[key]);
      check(values.length>=2&&values.every(v=>Number.isInteger(v)&&v>=0)&&new Set(values).size===1,label+': '+key+' did not plateau');
    }
  };
  check(r?.effects?.length===10,'Missing 10 effect cycles');plateau((r?.effects||[]).slice(1),'Effects after warmup');
  check(r?.transitions?.length===count,'Wrong mission transition count');
  check(Array.isArray(r?.transitions)&&r.transitions.every((s,i)=>s.valid===true&&s.id===i%2+1&&s.memory===s.id&&s.renderedFrames>=2&&s.simulationAdvancedSeconds>0&&s.settleTimedOut===false&&s.errors?.length===0),'Invalid mission transitions');
  for(const id of [1,2])plateau((r?.transitions||[]).slice(2).filter(s=>s.id===id),'Mission '+id+' after first pair');
  return failures;
}
module.exports={desktopFailures};

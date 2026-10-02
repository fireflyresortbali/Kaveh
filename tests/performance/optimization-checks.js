// Browser acceptance tests injected only by the diagnostic server.
window.__optimizationChecks=async function(){
  const checks=[],delay=ms=>new Promise(r=>setTimeout(r,ms));
  const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label)};
  const until=async(predicate,label,timeoutMs=3000)=>{const deadline=performance.now()+timeoutMs;while(!predicate()&&performance.now()<deadline)await delay(25);check(predicate()&&performance.now()<=deadline,label)};
  const count=()=>window.__perfReview.snapshot().completedMainRenders;
  const render=()=>{updateCamera(0);cullChunks();R3.render(scene,camera)};
  await window.__perfReview.start(1);await delay(200);
  openMenu();await delay(100);let n=count(),time=now;await delay(200);
  check(count()===n&&now===time,'paused scene has no recurring renders or simulation');
  resize();requestWorldFrame();await delay(100);
  check(count()===n+1,'paused resize draws one refreshed frame');
  n=count();await delay(100);check(count()===n,'paused resize does not restart recurring work');
  // Exercise both visibilitychange and pagehide/pageshow paths. This synthetic
  // test verifies handlers, not a phone OS/WebView's background policy.
  auInit();await delay(100);auSetMusic(false);auSetSfx(false);
  await until(()=>AU.ctx?.state==='running','audio started for suspend test');
  let longPress=false;keys.add('arrowleft');ptrs.set(99,{x:2,y:3});miniDrag=true;
  drag={mode:'panmaybe',lp:setTimeout(()=>longPress=true,80)};camVel.x=10;
  const hiddenDescriptor=Object.getOwnPropertyDescriptor(document,'hidden');
  try{
    Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));
    n=count();time=now;loop(performance.now()+30000);await delay(150);
    check(count()===n&&now===time,'hidden handler blocks rendering and simulation, including stale callbacks');
    check(!keys.size&&!ptrs.size&&!drag&&!miniDrag&&!longPress&&camVel.x===0,'suspend cancels keys, gestures, inertia and long press');
    await until(()=>AU.ctx.state==='suspended'&&!AU.timer&&!AU.ambientTimer,'hidden audio context and scheduler suspend');
  }finally{
    if(hiddenDescriptor)Object.defineProperty(document,'hidden',hiddenDescriptor);else delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  }
  await delay(150);
  check(paused&&!AU.music&&!AU.sfx,'visibility resume preserves manual pause and mute preferences');
  await until(()=>AU.ctx.state==='running','previously running audio context resumes');
  n=count();await delay(100);check(count()===n,'resumed manual pause remains static');
  closeModal();requestWorldFrame();await until(()=>count()>n&&now>time,'playing resumes after closing pause',15000);
  window.dispatchEvent(new Event('pagehide'));n=count();time=now;await delay(100);
  window.dispatchEvent(new Event('pageshow'));
  await until(()=>count()>n&&now-time>0&&now-time<.5,'page resume restarts play without simulating the hidden interval',15000);
  window.dispatchEvent(new Event('pagehide'));window.dispatchEvent(new Event('pageshow'));
  window.dispatchEvent(new Event('pagehide'));window.dispatchEvent(new Event('pageshow'));
  await until(()=>AU.ctx.state==='running','rapid hide/show preserves pending audio resume');
  // Scheduler recovers from a stale timestamp without replaying old music.
  const step=AU.step;AU.nextT=AU.ctx.currentTime-3600;auTick();
  check(AU.step-step<=4&&AU.nextT>AU.ctx.currentTime,'audio scheduler cannot create a catch-up burst');
  openCampaign();await delay(100);n=count();time=now;await delay(200);
  check(count()===n&&now===time,'covered campaign menu draws no world frames');
  await window.__perfReview.start(1);await delay(100);paused=true;await delay(50);
  // Shared resources remain valid when an instance is removed. Unique resources
  // must release exactly once even when referenced by two meshes in one tree.
  const a=unitModel('kaveh',0),b=unitModel('kaveh',0);let sharedDisposals=0,ownedDisposals=0;
  const shared=new Set();b.root.traverse(o=>{for(const r of [o.geometry,o.material])if(r&&sharedGraphics.has(r))shared.add(r)});
  const onShared=()=>sharedDisposals++;for(const r of shared)r.addEventListener('dispose',onShared);
  a.root.traverse(o=>{if(o.name==='kaveh-reference-face')o.material.addEventListener('dispose',()=>ownedDisposals++)});
  scene.add(a.root,b.root);render();disposeVisual(a.root);render();
  check(sharedDisposals===0&&ownedDisposals===1,'removing a character releases unique material once and preserves cached resources');
  for(const r of shared)r.removeEventListener('dispose',onShared);disposeVisual(b.root);
  const effects=[];
  for(let cycle=0;cycle<21;cycle++){
    const batch=['hit','smoke','spark','rubble','beam','sun','rain'].map(t=>({t,x:(camTX+cycle*.01)*TILE,y:camTZ*TILE,r:5*TILE,w:3,h:3,h0:1,s:1,life:4,max:4}));
    fxs.push(...batch);syncFx(0);render();
    for(const f of batch)f.life=0;fxs=fxs.filter(f=>!batch.includes(f));syncFx(0);render();
    effects.push(window.__perfReview.snapshot());
  }
  const flat=(samples,renderer,key)=>new Set(samples.map(s=>s.renderers[renderer][key])).size===1;
  check(flat(effects.slice(1),'main','geometries')&&flat(effects.slice(1),'main','textures')&&flat(effects.slice(1),'main','programs'),'all seven effect types plateau across 20 warmed cycles');
  check(new Set(effects.slice(1).map(s=>s.geometryCache)).size===1,'random rubble does not grow the global geometry cache');
  const auxiliary=[];
  for(let cycle=0;cycle<21;cycle++){
    for(const key of ['kaveh','zahhak','fereydun']){buildStory(key);SR.render(sScene,sCam)}
    for(const type of ['villager','companion','tower','bush']){portCache.clear();portrait(type,0)}
    auxiliary.push(window.__perfReview.snapshot());
  }
  for(const renderer of ['story','portrait'])for(const key of ['geometries','textures','programs'])check(flat(auxiliary.slice(1),renderer,key),renderer+' '+key+' plateau across 20 warmed cycles');
  check(!window.__perfReview.snapshot().errors.length,'no browser/runtime errors during acceptance tests');
  return {passed:true,checks,effects,auxiliary,visibilityTest:'synthetic handler events; real mobile lifecycle still requires device testing'};
};

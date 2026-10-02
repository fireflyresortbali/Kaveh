// Injected inside the game closure by server.cjs. Never loaded by index.html.
// RAW RAF cadence and CPU submission time are NOT GPU time or displayed FPS.
const perfReview = (() => {
  const maxSamples = 240000;
  let active = null;
  const renderers = new Map();
  const errors = [];
  let completedMainRenders = 0;
  const originalConsoleError = console.error;
  console.error = function(...args) {
    if (errors.length < 100) errors.push(args.map(value => String(value?.stack || value)).join(' '));
    return originalConsoleError.apply(this,args);
  };
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  window.addEventListener('error', e => { if (errors.length < 100) errors.push(String(e.error?.stack || e.message)); });
  window.addEventListener('unhandledrejection', e => { if (errors.length < 100) errors.push(String(e.reason)); });
  document.addEventListener('visibilitychange', () => {
    if (active) { active.visibilityChanges++; active.previous = null; }
  });
  function summary(values) {
    if (!values.length) return {n:0, p50:null, p95:null, p99:null, max:null, mean:null};
    const sorted = values.slice().sort((a,b) => a-b);
    const p = q => sorted[Math.max(0, Math.ceil(q*sorted.length)-1)];
    return {n:sorted.length,p50:p(.5),p95:p(.95),p99:p(.99),max:sorted.at(-1),mean:sorted.reduce((a,b)=>a+b,0)/sorted.length};
  }
  function add(key, value) {
    if (!active || document.hidden) return;
    const list = active.series[key] ||= [];
    if (list.length < maxSamples) list.push(value); else active.truncated = true;
  }
  function timed(key, fn) {
    return function(...args) {
      if (!active || document.hidden) return fn.apply(this,args);
      const start = performance.now();
      try { return fn.apply(this,args); } finally { add(key,performance.now()-start); }
    };
  }
  function attach(name, renderer) {
    if (!renderer || renderers.has(name)) return;
    renderers.set(name, renderer);
    const render = renderer.render;
    renderer.render = function(...args) {
      if (!active || document.hidden) {
        const result = render.apply(this,args);
        if (name === 'main') completedMainRenders++;
        return result;
      }
      const before = performance.now(), auto = this.info.autoReset;
      this.info.autoReset = false;
      this.info.reset();
      try {
        const result = render.apply(this,args);
        if (name === 'main') completedMainRenders++;
        return result;
      }
      finally {
        add(name+'.submitMs',performance.now()-before);
        for (const k of ['calls','triangles','points','lines']) add(name+'.'+k,this.info.render[k]);
        this.info.autoReset = auto;
      }
    };
  }
  function snapshot() {
    attach('main',R3); attach('story',SR); attach('portrait',aux);
    return {
      wallMs:performance.now(), simulationSeconds:now, paused, memory:memory?.id,
      completedMainRenders, errors:errors.slice(),
      entities:ents.length, units:ents.filter(e=>e.kind==='unit'&&alive(e)).length,
      effects:fxs.length, visualObjects:objs.size, geometryCache:Object.keys(G).length,
      materialCache:Object.keys(MC).length, bakedCache:Object.keys(BAKED).length,
      portraitCache:portCache.size, sceneChildren:scene.children.length,
      staticWorldObjects:staticWorld.length, dpr:DPR, adaptiveScale:DPRS,
      drawingBuffer:[R3.domElement.width,R3.domElement.height],
      renderers:Object.fromEntries([...renderers].map(([name,r])=>[name,{
        geometries:r.info.memory.geometries,textures:r.info.memory.textures,programs:r.info.programs?.length ?? null
      }])),
      // Chromium-only, approximate JS heap; not total process memory or VRAM.
      jsHeapBytes:performance.memory?.usedJSHeapSize ?? null,
    };
  }
  const originalLoop = loop;
  loop = function(t) {
    if (active) {
      if (!document.hidden) {
        if (active.previous !== null) add('rafIntervalMs',t-active.previous);
        active.previous=t;
      } else active.previous=null;
    }
    return originalLoop(t);
  };
  update=timed('simulationMs',update);
  sync=timed('visualSyncMs',sync);
  syncFx=timed('effectsSyncMs',syncFx);
  drawOverlay=timed('overlayMs',drawOverlay);
  hudTick=timed('hudMs',hudTick);
  drawMini=timed('minimapMs',drawMini);
  pathPoint=timed('pathPointMs',pathPoint);
  pathEnt=timed('pathEntMs',pathEnt);
  saveMemory=timed('saveMs',saveMemory);
  attach('main',R3);
  return {
    snapshot,
    async ready() {
      const deadline=performance.now()+120000;
      while ($('#loading').hidden===false) {
        if (performance.now()>deadline) throw Error('Startup timed out: '+$('#lmsg').textContent);
        await delay(100);
      }
      snapshot(); return {source:PERF_SOURCE,userAgent:navigator.userAgent,mobileBranch:MOBILE,viewport:[innerWidth,innerHeight],devicePixelRatio,errors};
    },
    async capture(label, seconds=10, raw=false) {
      if(active) throw Error('Capture already active');
      if(!Number.isFinite(seconds)||seconds<=0||seconds>1800) throw Error('Duration must be 0–1800 seconds');
      const before=snapshot();
      active={previous:null,series:{},visibilityChanges:0,truncated:false,startedHidden:document.hidden};
      try {
        await delay(seconds*1000);
        const data=active; active=null;
        const after=snapshot(), intervals=data.series.rafIntervalMs||[];
        return {label,requestedSeconds:seconds,elapsedMs:after.wallMs-before.wallMs,before,after,
          visibilityChanges:data.visibilityChanges,truncated:data.truncated,
          comparable:!data.startedHidden&&!document.hidden&&data.visibilityChanges===0&&!data.truncated&&(intervals.length>0||(before.paused&&after.paused))&&errors.length===0,
          metrics:Object.fromEntries(Object.entries(data.series).map(([k,v])=>[k,summary(v)])),
          intervalsOver50ms:intervals.filter(x=>x>50).length,
          intervalsOver100ms:intervals.filter(x=>x>100).length,
          raw:raw?data.series:undefined,errors:errors.slice(),
          caveats:['Instrumented diagnostics; not a physical-mobile release benchmark.',
            'RAF intervals are delivered callback cadence, not GPU duration or displayed frames.',
            'CPU timings are inclusive and may overlap; do not sum nested timings.',
            'Resource values are renderer counts, not bytes. Adaptive DPR remains enabled.',
            'Gameplay randomness is not seeded; repeated runs are not deterministic.']};
      } finally { active=null; }
    },
    async start(id=1) {
      campaign.completed=Array.from({length:62},(_,i)=>i+1);
      await startMemory(id);
      if (errors.length || memory?.id !== id || landscapeBusy || !$('#loading').hidden) {
        if (!errors.length) errors.push('Mission initialization did not complete for memory '+id);
        return {...snapshot(),started:false};
      }
      closeModal(); beginStage(); paused=false;if(typeof requestWorldFrame==='function')requestWorldFrame();
      return snapshot();
    },
    pause() { openMenu(); return snapshot(); },
    async transitions(ids=[1,2,1,2,1,2], settleMs=500) {
      const samples=[];
      for(const id of ids) {
        const start=performance.now();
        await this.start(id);
        const rendersBefore=completedMainRenders,simulationBefore=now;
        const deadline=performance.now()+15000;
        // The production loop refreshes shadows every second frame. A timer alone
        // can sample before its first shadow pass (especially with software WebGL).
        // Wait for independent readiness, never for a desired resource count.
        await delay(settleMs);
        while(errors.length===0&&!document.hidden&&performance.now()<deadline&&
          (completedMainRenders-rendersBefore<2||now<=simulationBefore))await delay(25);
        const renderedFrames=completedMainRenders-rendersBefore;
        const simulationAdvancedSeconds=now-simulationBefore;
        const settleTimedOut=performance.now()>=deadline;
        const settled=renderedFrames>=2&&simulationAdvancedSeconds>0&&!settleTimedOut;
        paused=true;
        samples.push({id,transitionAndSettleMs:performance.now()-start,renderedFrames,
          simulationAdvancedSeconds,settleTimedOut,
          valid:settled&&errors.length===0&&!document.hidden,...snapshot()});
      }
      return samples;
    },
    async effectCycles(count=10) {
      if(!Number.isInteger(count)||count<1||count>100) throw Error('Use 1–100 cycles');
      paused=true;
      const samples=[];
      for(let i=0;i<count;i++) {
        // Diagnostic allocations; this is not a gameplay power or GPU workload benchmark.
        const f={t:'rain',x:camTX*TILE,y:camTZ*TILE,r:5*TILE,life:4,max:4};
        fxs.push(f);syncFx(performance.now()/1000);R3.render(scene,camera);await delay(30);f.life=0;
        fxs=fxs.filter(x=>x!==f);syncFx(performance.now()/1000);R3.render(scene,camera);
        samples.push(snapshot());
      }
      return samples;
    },
  };
})();
window.__perfReview=perfReview;

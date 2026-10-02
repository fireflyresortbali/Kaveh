const cp=require('node:child_process');
// A delayed host heartbeat invalidates continuity; it does not diagnose the OS cause.
// Caffeinate prevents idle sleep only. Closing the lid or forced sleep still interrupts.
function createHostMonitor({onGap,onUpdate=()=>{},platform=process.platform,pid=process.pid,now=Date.now,spawn=cp.spawn,setTimer=setInterval,clearTimer=clearInterval}={}){
  const state={idleSleepPrevention:platform==='darwin'?'starting':'not available',maxGapMs:0,gaps:[],thresholdMs:15000};
  let helper,timer,last,stopping=false,problem=null;
  const fail=error=>{if(!problem){problem=error;state.failure=error.message;onUpdate(state);onGap?.(error);}};
  if(platform==='darwin'){
    helper=spawn('/usr/bin/caffeinate',['-i','-w',String(pid)],{stdio:'ignore'});
    helper.once('spawn',()=>{state.idleSleepPrevention='active';onUpdate(state);});
    helper.once('error',error=>{state.idleSleepPrevention='failed';fail(Error('Idle-sleep prevention failed: '+error.message));});
    helper.once('exit',(code,signal)=>{if(!stopping){state.idleSleepPrevention='failed';fail(Error('Idle-sleep helper exited early: '+code+' / '+signal));}});
  }
  function tick(){
    const current=now(),gap=current-last;last=current;state.maxGapMs=Math.max(state.maxGapMs,gap);
    if(gap>state.thresholdMs||gap<0){state.gaps.push({at:new Date(current).toISOString(),gapMs:gap});fail(Error('Host continuity interrupted: '+gap+' ms scheduling/clock gap; keep the Mac awake with lid open. This attempt is invalid.'));}
    onUpdate(state);
  }
  return {state,
    startMeasurement(){if(problem)throw problem;last=now();state.measurementStartedAt=new Date(last).toISOString();timer=setTimer(tick,1000);onUpdate(state);},
    endMeasurement(){if(timer!==undefined){tick();clearTimer(timer);timer=undefined;}if(problem)throw problem;state.measurementFinishedAt=new Date(now()).toISOString();onUpdate(state);},
    get error(){return problem;},
    stop(){stopping=true;if(timer!==undefined)clearTimer(timer);timer=undefined;helper?.kill();state.stoppedAt=new Date(now()).toISOString();onUpdate(state);}
  };
}
module.exports={createHostMonitor};

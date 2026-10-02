const assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {createHostMonitor}=require('./host-monitor.cjs');
for(const mode of ['healthy','sleep','clock-backwards','helper-failure']){
  let clock=100000,callback,killed=false,cleared=false,error,updates=0;
  const child=new EventEmitter();child.kill=()=>{killed=true;child.emit('exit',null,'SIGTERM');};
  const monitor=createHostMonitor({platform:'darwin',pid:42,now:()=>clock,
    spawn(file,args){assert.equal(file,'/usr/bin/caffeinate');assert.deepEqual(args,['-i','-w','42']);return child;},
    setTimer(fn){callback=fn;return 1;},clearTimer(){cleared=true;},onGap:e=>error=e,onUpdate:()=>updates++});
  child.emit('spawn');monitor.startMeasurement();clock+=1000;callback();assert.equal(monitor.error,null);
  if(mode==='sleep')clock+=60000;else if(mode==='clock-backwards')clock-=5000;else clock+=1000;
  if(mode==='helper-failure')child.emit('error',Error('injected failure'));else callback();
  if(mode==='healthy'){monitor.endMeasurement();assert.equal(error,undefined);}else{assert.throws(()=>monitor.endMeasurement(),/Host continuity|Idle-sleep/);assert.ok(error);}
  monitor.stop();assert.ok(cleared&&killed&&updates>0);if(mode==='healthy')assert.equal(monitor.error,null,'Normal cleanup is not an interruption');
}
let spawned=false;const m=createHostMonitor({platform:'linux',spawn(){spawned=true;},onUpdate(){}});m.stop();assert.equal(spawned,false);
console.log('PASS: host heartbeat healthy/sleep/clock-jump/helper-failure, scoped helper cleanup and non-mac behavior.');

// macOS runner: explicit, already-booted task-owned simulator/emulator only.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),cp=require('node:child_process');
const {promisify}=require('node:util'),execFile=promisify(cp.execFile);
const {createServer}=require('../performance/server.cjs');
const {build,bundle}=require('./build-shells.cjs');
const {createReport,validateEvent}=require('./report.cjs');
const {createHostMonitor}=require('./host-monitor.cjs');
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const run=async(file,args,options={})=>(await execFile(file,args,{encoding:'utf8',timeout:60000,maxBuffer:8*1024*1024,...options})).stdout.trim();
async function main(){
  const [platform,device,output]=process.argv.slice(2);
  if(!['android','ios'].includes(platform)||!device||!output)throw Error('Usage: node tests/emulation/run.cjs android|ios DEVICE_ID NEW_OUTPUT_DIRECTORY');
  const dir=path.resolve(output);fs.mkdirSync(path.dirname(dir),{recursive:true});
  const log=createReport(dir,{platform,device,host:{platform:os.platform(),release:os.release(),arch:os.arch(),cpu:os.cpus()[0]?.model,totalMemoryBytes:os.totalmem(),loadAverage:os.loadavg(),node:process.version}});
  let hostMonitor,server,port,pid,installed=false,verifiedDevice=false,timer,sequence=0,finished=false,locked=false;
  const lock=path.join(os.tmpdir(),'kaveh-emulation-'+sha(platform+device).slice(0,16)+'.lock');
  const adb=(...args)=>run(process.env.ADB||'adb',['-s',device,...args]);
  const sim=(...args)=>run('xcrun',['simctl',...args]);
  let resolveDone,rejectDone;
  const done=new Promise((resolve,reject)=>{resolveDone=resolve;rejectDone=reject;});
  // Attach rejection handling before any setup work; failures still reach the outer catch.
  done.catch(()=>{});
  const fail=error=>{if(!finished){finished=true;rejectDone(error);}};
  const sampleNative=async label=>{
    const filename='native-'+label+'.txt';
    try{const value=platform==='android'?await adb('shell','dumpsys','meminfo',bundle):await run('ps',['-p',String(pid),'-o','pid,ppid,%cpu,rss,vsz,comm']);
      fs.writeFileSync(path.join(dir,filename),value+'\n');log.report.nativeSamples??=[];log.report.nativeSamples.push({label,file:filename,at:new Date().toISOString()});log.save();
    }catch(e){log.report.nativeSampleError=String(e.message);log.save();}
  };
  async function diagnostics(label){
    if(!verifiedDevice)return;
    await sampleNative(label);
    const attempt=async(name,fn)=>{try{await fn();}catch(error){log.report.diagnosticErrors??=[];log.report.diagnosticErrors.push({name,message:String(error.message)});log.save();}};
    await attempt('console',async()=>{
      const output=platform==='android'?await adb('logcat','-d','-t','500','KavehBench:I','*:S')
        :await sim('spawn',device,'log','show','--last','5m','--style','compact','--predicate','process == "KavehBench"');
      fs.writeFileSync(path.join(dir,'console.txt'),output+'\n');
    });
    await attempt('screenshot',async()=>{
      if(platform==='android'){
        const image=await execFile(process.env.ADB||'adb',['-s',device,'exec-out','screencap','-p'],{encoding:'buffer',timeout:15000,maxBuffer:8*1024*1024});
        fs.writeFileSync(path.join(dir,'screen.png'),image.stdout);
      }else await run('xcrun',['simctl','io',device,'screenshot',path.join(dir,'screen.png')],{timeout:15000});
    });
  }
  function commandFailure(error,file){
    const parts=[];
    for(let cause=error,depth=0;cause&&depth<4;cause=cause.cause,depth++){
      parts.push((depth?'CAUSE: ':'')+String(cause.message),
        'COMMAND STATUS: '+JSON.stringify({code:cause.code,signal:cause.signal,killed:cause.killed}),
        'STDOUT:\n'+String(cause.stdout||''),'STDERR:\n'+String(cause.stderr||''));
    }
    fs.writeFileSync(path.join(dir,file),parts.join('\n')+'\n');
  }
  let cycle=0,actions=Promise.resolve();
  const actionAbort=new AbortController();
  const driverDir=path.join(os.tmpdir(),'kaveh-alg61-driver');
  const driverArgs=['-project',path.join(__dirname,'native/BenchDriver.xcodeproj'),'-scheme','BenchDriver','-destination','platform=iOS Simulator,id='+device,'-derivedDataPath',driverDir,'-parallel-testing-enabled','NO'];
  async function background(){
    if(platform==='ios'){
      const file='lifecycle-'+(++cycle)+'.txt';
      try{
        const output=await run('xcodebuild',['test-without-building',...driverArgs,'-resultBundlePath',path.join(dir,'lifecycle-'+cycle+'.xcresult')],{timeout:120000,signal:actionAbort.signal});
        fs.writeFileSync(path.join(dir,file),output);
      }catch(error){commandFailure(error,file);throw error;}
      return;
    }
    if(platform==='android')await adb('shell','am','start','-a','android.intent.action.MAIN','-c','android.intent.category.HOME');

    await wait(3000);
    if(platform==='android')await adb('shell','am','start','-n',bundle+'/.BenchActivity');

  }
  const interrupt=()=>fail(Error('Benchmark interrupted'));
  process.on('SIGINT',interrupt);process.on('SIGTERM',interrupt);
  try{
    fs.writeFileSync(lock,String(process.pid),{flag:'wx'});locked=true;
    if(platform==='android'){
      if(!/^emulator-\d+$/.test(device))throw Error('Only Android emulator serials are allowed');
      const avd=await adb('emu','avd','name');
      if(!avd.startsWith('Kaveh_ALG61_'))throw Error('Use a task-owned Kaveh_ALG61_ AVD');
      if(await adb('shell','getprop','sys.boot_completed')!=='1')throw Error('Emulator is not fully booted');
      log.report.runtime={avd,release:await adb('shell','getprop','ro.build.version.release'),api:await adb('shell','getprop','ro.build.version.sdk'),fingerprint:await adb('shell','getprop','ro.build.fingerprint'),webview:await adb('shell','dumpsys','webviewupdate'),display:await adb('shell','wm','size'),density:await adb('shell','wm','density'),meminfo:await adb('shell','cat','/proc/meminfo')};
    }else{
      const devices=JSON.parse(await sim('list','devices','available','-j')).devices;
      const entry=Object.entries(devices).flatMap(([runtime,rows])=>rows.map(row=>({...row,runtime}))).find(x=>x.udid===device);
      if(!entry||!entry.name.startsWith('Kaveh ALG61 ')||entry.state!=='Booted')throw Error('Use a booted, task-owned Kaveh ALG61 simulator');
      log.report.runtime={...entry,xcode:await run('xcodebuild',['-version'])};
    }
    verifiedDevice=true;log.save();
    hostMonitor=createHostMonitor({onGap:fail,onUpdate(state){fs.writeFileSync(path.join(dir,'host-continuity.json'),JSON.stringify(state,null,2)+'\n');}});
    if(platform==='ios')await run('xcodebuild',['build-for-testing',...driverArgs,'-quiet'],{timeout:120000});
    const shell=build(platform,path.join(os.tmpdir(),'kaveh-alg61-shells',platform));
    log.report.shell={...shell,executableSha256:sha(fs.readFileSync(platform==='ios'?path.join(shell.file,'KavehBench'):shell.file))};
    log.report.toolingSha256=Object.fromEntries(['run.cjs','host-monitor.cjs','scenario.js','report.cjs','build-shells.cjs','native/Bench.swift','native/BenchActivity.java','native/AndroidManifest.xml','native/BackgroundTests.swift','native/BenchDriver.xcodeproj/project.pbxproj','native/BenchDriver.xcodeproj/xcshareddata/xcschemes/BenchDriver.xcscheme'].map(f=>[f,sha(fs.readFileSync(path.join(__dirname,f)))]));
    const enginePath=path.join(os.tmpdir(),'kaveh-alg61-deps','three.min.js');
    fs.mkdirSync(path.dirname(enginePath),{recursive:true});
    const engineHash='8a5f7249903b54d30f79f708699d2fed2d6a1d0741a4cd41377d1f01bb5a2271';
    if(!fs.existsSync(enginePath)){
      const response=await fetch('https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js',{signal:AbortSignal.timeout(60000)});
      if(!response.ok)throw Error('Three.js download failed: '+response.status);
      const bytes=Buffer.from(await response.arrayBuffer());if(sha(bytes)!==engineHash)throw Error('Three.js integrity check failed');fs.writeFileSync(enginePath,bytes);
    }
    const engine=fs.readFileSync(enginePath);if(sha(engine)!==engineHash)throw Error('Cached Three.js integrity check failed');
    log.report.engine={version:'0.149.0',sha256:engineHash,delivery:'local test server'};log.save();
    const endpoint='/emulation/'+crypto.randomBytes(24).toString('hex');
    server=createServer({head:'<script src="/emulation/three.min.js"></script>',beforeBoot:`const EMULATION_ENDPOINT=${JSON.stringify(endpoint)};\n`+fs.readFileSync(path.join(__dirname,'scenario.js'),'utf8'),onRequest(req,res){
      if(req.url==='/emulation/three.min.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end(engine);return true;}
      if(req.url!==endpoint)return false;
      if(req.method!=='POST'){res.writeHead(405);res.end();return true;}
      let body='',size=0;
      req.on('data',chunk=>{size+=chunk.length;if(size>2*1024*1024){req.destroy();fail(Error('Event body exceeds 2 MiB'));}else body+=chunk;});
      req.on('error',fail);
      req.on('end',()=>{
        try{
          const event=JSON.parse(body);validateEvent(event,sequence++);log.append(event);
          res.end('ok');console.log(event.kind+(event.data.label?' '+event.data.label:''));
          if(event.kind==='background-ready'){actions=actions.then(()=>wait(100)).then(background);actions.catch(fail);}
          if(event.kind==='ready')sampleNative('ready').catch(fail);
          if(event.kind==='fatal')fail(Error(event.data.message));
          if(event.kind==='complete'){finished=true;resolveDone();}
        }catch(error){res.writeHead(400);res.end('Invalid event');fail(error);}
      });return true;
    }});
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));port=server.address().port;
    const url=`http://127.0.0.1:${port}/`;
    hostMonitor.startMeasurement();
    timer=setTimeout(()=>fail(Error('Benchmark completion timed out after 5 minutes')),300000);
    if(platform==='android'){
      await adb('install','-r',shell.file);installed=true;
      await adb('shell','am','force-stop',bundle);await adb('shell','pm','clear',bundle);
      await adb('reverse',`tcp:${port}`,`tcp:${port}`);
      log.report.launch=await adb('shell','am','start','-W','-n',bundle+'/.BenchActivity','--es','url',url);
    }else{
      await sim('install',device,shell.file);installed=true;
      await sim('terminate',device,bundle).catch(()=>{});
      log.report.launch=await sim('launch',device,bundle,'--url',url);
      pid=Number(log.report.launch.split(':').at(-1).trim());
    }
    log.save();await done;await actions;hostMonitor.endMeasurement();await diagnostics('completed');
    log.finish();if(!log.report.valid)throw Error('Missing successful completion event');
    console.log('Saved '+dir);
  }catch(error){
    if(hostMonitor?.error&&hostMonitor.error!==error)error=Error(hostMonitor.error.message,{cause:error});
    actionAbort.abort();await actions.catch(()=>{});
    commandFailure(error,'failure-command.txt');
    await diagnostics('failure');log.finish(error);throw error;
  }
  finally{
    clearTimeout(timer);hostMonitor?.stop();actionAbort.abort();await actions.catch(()=>{});server?.closeAllConnections();server?.close();
    process.removeListener('SIGINT',interrupt);process.removeListener('SIGTERM',interrupt);
    if(platform==='android'&&port)await adb('reverse','--remove',`tcp:${port}`).catch(()=>{});
    if(installed){if(platform==='android')await adb('shell','am','force-stop',bundle).catch(()=>{});else await sim('terminate',device,bundle).catch(()=>{});}
    if(locked)fs.unlinkSync(lock);
  }
}
module.exports={main};
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});

// Execute the real runner with fake native commands/HTTP transport, no SDK/network.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),crypto=require('node:crypto');
const assert=require('node:assert/strict'),{promisify}=require('node:util'),{EventEmitter}=require('node:events');
async function check(platform,mode){
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'kaveh-runner-test-')),output=path.join(temp,'run');
  const device=platform==='ios'?'fixture':'emulator-9876',commands=[];
  let requestHandler,endpoint,timer,closed=false,terminated=false;
  const emit=kind=>{
    const req=new EventEmitter();req.url=endpoint;req.method='POST';req.destroy=()=>{};
    requestHandler(req,{end(){},writeHead(){}});
    req.emit('data',Buffer.from(JSON.stringify({sequence:0,kind,data:kind==='fatal'?{message:'injected game failure'}:{label:'playing'}})));req.emit('end');
  };
  const fakeExec=function(){};
  fakeExec[promisify.custom]=async(file,args)=>{
    commands.push([file,...args].join(' '));const command=args.join(' ');
    if(command.includes('emu avd name'))return {stdout:'Kaveh_ALG61_fixture\nOK'};
    if(command.includes('sys.boot_completed'))return {stdout:'1'};
    if(command.includes('list devices'))return {stdout:JSON.stringify({devices:{fixture:[{udid:device,name:'Kaveh ALG61 fixture',state:'Booted'}]}})};
    if(command.includes('test-without-building')){const e=Error('injected XCTest failure');e.stdout='fixture stdout';e.stderr='fixture stderr';throw e;}
    const launch=platform==='android'?command.includes('am start -W'):command.includes('launch fixture io.algorstudio');
    if(launch&&mode==='host-command'){const e=Error('injected native timeout');e.code='ETIMEDOUT';e.signal='SIGTERM';e.killed=true;e.stdout='original stdout';e.stderr='original stderr';throw e;}
    if(launch)queueMicrotask(()=>mode==='timeout'?timer():emit(mode==='lifecycle'?'background-ready':'fatal'));
    if(command.includes('screencap')||command.includes(' screenshot ')){
      if(mode==='diagnostic-failure')throw Error('injected screenshot failure');
      if(platform==='ios')fs.writeFileSync(args.at(-1),'screenshot fixture');
      return {stdout:Buffer.from('screenshot fixture')};
    }
    if(command.includes('force-stop')||command.includes('terminate fixture'))terminated=true;
    return {stdout:launch?'io.algorstudio.kavehbench: 123':'native fixture'};
  };
  const realHash=crypto.createHash;
  const fakeCrypto={...crypto,createHash(algorithm){let engine=false;const h=realHash(algorithm);return {update(data){engine=String(data)==='engine fixture';h.update(data);return this;},digest(format){return engine?'8a5f7249903b54d30f79f708699d2fed2d6a1d0741a4cd41377d1f01bb5a2271':h.digest(format);}};}};
  const fakeFs={...fs,existsSync:p=>String(p).endsWith('three.min.js')||fs.existsSync(p),readFileSync(p,...args){if(String(p).endsWith('three.min.js'))return Buffer.from('engine fixture');if(String(p).startsWith('/fixture-app'))return Buffer.from('app fixture');return fs.readFileSync(p,...args);}};
  const server={listen(p,h,fn){assert.equal(h,'127.0.0.1');fn();},address:()=>({port:12345}),closeAllConnections(){},close(){closed=true;}};
  const module={exports:{}};
  const requireFake=name=>name==='node:fs'?fakeFs:name==='node:crypto'?fakeCrypto:name==='node:os'?{...os,tmpdir:()=>temp}:name==='node:child_process'?{execFile:fakeExec}:name==='../performance/server.cjs'?{createServer(options){requestHandler=options.onRequest;endpoint=JSON.parse(options.beforeBoot.match(/EMULATION_ENDPOINT=("[^"]+")/)[1]);return server;}}:name==='./build-shells.cjs'?{bundle:'io.algorstudio.kavehbench',build(){if(mode==='build'){const e=Error('injected build failure');e.stdout='build stdout';e.stderr='build stderr';throw e;}return {file:'/fixture-app',bundle:'io.algorstudio.kavehbench'};}}:name==='./host-monitor.cjs'?{createHostMonitor:()=>({get error(){return mode==='host-command'?Error('Host continuity interrupted: fixture'):null;},startMeasurement(){},endMeasurement(){},stop(){}})}:name==='./report.cjs'?require('./report.cjs'):require(name);
  const context={require:requireFake,module,__dirname,Buffer,AbortController,AbortSignal,console:{log(){},error(){}},process:{argv:['node','run',platform,device,output],env:{},pid:123,version:process.version,on(){},removeListener(){}},
    setTimeout(fn,ms){if(ms===300000){timer=fn;return 0;}return setTimeout(fn,0);},clearTimeout};
  try{
    vm.runInNewContext(fs.readFileSync(__dirname+'/run.cjs','utf8'),context);
    await assert.rejects(module.exports.main(),mode==='host-command'?/Host continuity interrupted/:mode==='timeout'?/timed out/:mode==='build'?/injected build/:mode==='lifecycle'?/injected XCTest/:/injected game/);
    const report=JSON.parse(fs.readFileSync(path.join(output,'report.json')));
    assert.equal(report.valid,false);assert.ok(report.finishedAt);
    assert.ok(commands.some(c=>c.includes('screencap')||c.includes(' screenshot ')),'Attempt screenshot on failure');
    assert.ok(fs.existsSync(path.join(output,'console.txt')),'Preserve native console');
    if(mode==='diagnostic-failure'){assert.match(report.failure,/injected game failure/);assert.match(report.diagnosticErrors[0].message,/screenshot/);}
    else assert.ok(fs.existsSync(path.join(output,'screen.png')));
    if(mode==='lifecycle')assert.match(fs.readFileSync(path.join(output,'lifecycle-1.txt'),'utf8'),/fixture stderr/);
    if(mode==='host-command'){const text=fs.readFileSync(path.join(output,'failure-command.txt'),'utf8');for(const expected of ['Host continuity','injected native timeout','ETIMEDOUT','SIGTERM','"killed":true','original stdout','original stderr'])assert.ok(text.includes(expected),expected+' preserved through host error');}
    if(mode==='build')assert.match(fs.readFileSync(path.join(output,'failure-command.txt'),'utf8'),/build stderr/);
    if(mode!=='build'){assert.ok(closed&&terminated,'Owned server and test app cleaned');if(platform==='android')assert.ok(commands.some(c=>c.includes('reverse --remove')));}
    assert.equal(fs.readdirSync(temp).filter(f=>f.endsWith('.lock')).length,0,'Owned lock removed');
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
(async()=>{for(const [p,m] of [['android','fatal'],['android','timeout'],['android','diagnostic-failure'],['ios','lifecycle'],['ios','build'],['ios','host-command']])await check(p,m);console.log('PASS: fatal/timeout/build/lifecycle failures retain diagnostics and original errors, clean owned app/server/mapping/lock.');})().catch(e=>{console.error(e);process.exitCode=1;});

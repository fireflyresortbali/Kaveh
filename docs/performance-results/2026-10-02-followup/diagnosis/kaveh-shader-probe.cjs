const fs=require('node:fs'),Module=require('node:module'),path=require('node:path');
const root='/Users/alireza/.codex/worktrees/kaveh-alg-61-emulator-performance-logs';
const filename=path.join(root,'tests/performance/run-review.cjs');
let source=fs.readFileSync(filename,'utf8');
source=source.replace('server=createServer();',"server=createServer({beforeBoot:fs.readFileSync('/private/tmp/kaveh-shader-hook.js','utf8')});");
const start=source.indexOf("    if(process.env.PERF_ACCEPTANCE==='1'){");
const end=source.indexOf('  } catch(error)',start);
source=source.slice(0,start)+"report.probe=await evaluate('window.__shaderProbe()');report.valid=true;report.kind='controlled-shader-investigation-not-benchmark';\n"+source.slice(end);
const m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(path.dirname(filename));m._compile(source,filename);

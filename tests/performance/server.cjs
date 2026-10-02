// Diagnostic copy only: injects instrumentation without editing the shipped game.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '../..');

function createServer({beforeBoot="",head="",onRequest=null}={}) {
  const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const hook = '(async function boot(){';
  if (source.split(hook).length !== 2) throw Error('Performance hook changed; review injection before use.');
  const metadata = {
    commit: cp.execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim(),
    dirtyFiles: cp.execFileSync('git', ['status', '--short'], {cwd: root, encoding: 'utf8'}).trim(),
    htmlSha256: crypto.createHash('sha256').update(source).digest('hex'),
    htmlBytes: Buffer.byteLength(source),
    toolingSha256: Object.fromEntries(['server.cjs','harness.js','run-review.cjs','optimization-checks.js','../campaign-runtime.js'].map(name => [name,crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,name))).digest('hex')])),
  };
  const harness = fs.readFileSync(path.join(__dirname, 'harness.js'), 'utf8');
  const acceptance = fs.readFileSync(path.join(__dirname,'optimization-checks.js'),'utf8');
  const campaign = fs.readFileSync(path.join(__dirname,'../campaign-runtime.js'),'utf8');
  const html = source.replace(hook, () => `const PERF_SOURCE=${JSON.stringify(metadata)};\n${harness}\n${acceptance}\nwindow.__runCampaign=()=>{${campaign}};\n${beforeBoot}\n${hook}`).replace("<script>",()=>head+"<script>");
  return http.createServer((req, res) => {
    if(onRequest&&onRequest(req,res))return;
    const url = new URL(req.url, 'http://localhost');
    if(url.pathname==='/report'&&req.method==='POST'){req.resume();res.end('ok');return;}
    if (url.pathname === '/' || url.pathname === '/index.html') {
      res.writeHead(200, {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store'});
      res.end(html); return;
    }
    let name;
    try { name = decodeURIComponent(url.pathname); } catch { res.writeHead(400); res.end(); return; }
    const file = path.resolve(root, '.' + name);
    if (!file.startsWith(path.join(root, 'assets') + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404); res.end(); return;
    }
    const types = {'.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg'};
    res.writeHead(200, {'content-type': types[path.extname(file)] || 'application/octet-stream'});
    fs.createReadStream(file).pipe(res);
  });
}

module.exports = {createServer};
if (require.main === module) {
  const host = process.env.PERF_HOST || '127.0.0.1';
  const port = Number(process.env.PERF_PORT || 8780);
  createServer().listen(port, host, () => console.log(`Diagnostic game: http://${host}:${port}; API: window.__perfReview`));
}

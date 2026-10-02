// Build test-only shells with installed SDKs. No Gradle/npm install or signing account.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const native=path.join(__dirname,'native');
const bundle='io.algorstudio.kavehbench';
function command(file,args,options={}){return cp.execFileSync(file,args,{encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024,...options});}
function build(platform,dir){
  fs.mkdirSync(dir,{recursive:true});
  if(platform==='android'){
    const sdk=process.env.ANDROID_HOME||path.join(os.homedir(),'Codes/android-tools');
    const java=process.env.JAVA_HOME||'/Applications/Android Studio.app/Contents/jbr/Contents/Home';
    const env={...process.env,JAVA_HOME:java},bt=path.join(sdk,'build-tools/36.0.0'),jar=path.join(sdk,'platforms/android-35/android.jar');
    for(const p of [bt,jar,path.join(java,'bin/javac')])if(!fs.existsSync(p))throw Error('Missing build dependency: '+p);
    const classes=path.join(dir,'classes'),dex=path.join(dir,'dex');fs.mkdirSync(classes,{recursive:true});fs.mkdirSync(dex,{recursive:true});
    command(path.join(java,'bin/javac'),['-source','8','-target','8','-classpath',jar,'-d',classes,path.join(native,'BenchActivity.java')]);
    const classFiles=fs.readdirSync(path.join(classes,'io/algorstudio/kavehbench')).filter(f=>f.endsWith('.class')).map(f=>path.join(classes,'io/algorstudio/kavehbench',f));
    command(path.join(bt,'d8'),['--lib',jar,'--min-api','26','--output',dex,...classFiles],{env});
    const unsigned=path.join(dir,'unsigned.apk'),apk=path.join(dir,'KavehBench.apk'),key=path.join(dir,'test.keystore');
    command(path.join(bt,'aapt'),['package','-f','-M',path.join(native,'AndroidManifest.xml'),'-I',jar,'-F',unsigned]);
    command(path.join(bt,'aapt'),['add',unsigned,'classes.dex'],{cwd:dex});
    if(!fs.existsSync(key))command(path.join(java,'bin/keytool'),['-genkeypair','-keystore',key,'-storepass','android','-keypass','android','-alias','test','-dname','CN=Local Kaveh Test','-keyalg','RSA','-validity','3650']);
    command(path.join(bt,'apksigner'),['sign','--ks',key,'--ks-pass','pass:android','--out',apk,unsigned],{env});
    return {file:apk,bundle,sdk,buildTools:'36.0.0',compileApi:35,targetApi:35};
  }
  if(platform==='ios'){
    const app=path.join(dir,'KavehBench.app');fs.mkdirSync(app,{recursive:true});
    const sdk=command('xcrun',['--sdk','iphonesimulator','--show-sdk-path']).trim();
    command('xcrun',['--sdk','iphonesimulator','swiftc','-parse-as-library','-O','-target','arm64-apple-ios18.0-simulator','-sdk',sdk,'-module-cache-path',path.join(dir,'module-cache'),'-framework','UIKit','-framework','WebKit',path.join(native,'Bench.swift'),'-o',path.join(app,'KavehBench')]);
    fs.writeFileSync(path.join(app,'Info.plist'),`<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>CFBundleIdentifier</key><string>${bundle}</string><key>CFBundleExecutable</key><string>KavehBench</string><key>CFBundleName</key><string>Kaveh Bench</string><key>CFBundlePackageType</key><string>APPL</string><key>CFBundleVersion</key><string>1</string><key>CFBundleShortVersionString</key><string>1.0</string><key>MinimumOSVersion</key><string>18.0</string><key>UIDeviceFamily</key><array><integer>1</integer></array><key>UIApplicationSceneManifest</key><dict><key>UIApplicationSupportsMultipleScenes</key><false/><key>UISceneConfigurations</key><dict/></dict><key>UILaunchScreen</key><dict/><key>UIRequiresFullScreen</key><true/><key>UISupportedInterfaceOrientations</key><array><string>UIInterfaceOrientationLandscapeRight</string><string>UIInterfaceOrientationLandscapeLeft</string></array><key>NSAppTransportSecurity</key><dict><key>NSAllowsLocalNetworking</key><true/></dict></dict></plist>`);
    command('codesign',['--force','--sign','-',app]);
    return {file:app,bundle,sdk,minimumOS:'18.0',target:'arm64 simulator'};
  }
  throw Error('Use android or ios');
}
module.exports={build,command,bundle};
if(require.main===module)console.log(JSON.stringify(build(process.argv[2],path.resolve(process.argv[3]||path.join(os.tmpdir(),'kaveh-alg61-shells',process.argv[2]||'unknown'))),null,2));

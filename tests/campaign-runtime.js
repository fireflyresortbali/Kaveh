// Test fixtures run only on the separate local test server, never in the user's save.
(async()=>{
const result={checks:[],levels:0,stages:0};
const check=(v,label)=>{if(!v)throw Error(label);result.checks.push(label)};
try{
  check(CAMPAIGN_LEVELS.length===62,'62 levels loaded');check(new Set(CAMPAIGN_LEVELS.map(l=>l.act)).size===9,'9 acts loaded');
  check(Object.keys(PLANS).length===62,'every level has objective logic');
  for(const type of ['ariel','companion','priest','caravan','ram','dragon','bounddemon','champion','tyrant','cave','range','blacksmith','market','library','observatory','nest','wonder','wall','stronghold','lair','tradepost','stonedefender'])check(portrait(type,0).startsWith('data:image/'),'portrait renders '+type);
  campaign.completed=Array.from({length:62},(_,i)=>i+1);const mapLayouts=new Set();
  for(const l of CAMPAIGN_LEVELS){
    await startMemory(l.id);closeModal();beginStage();paused=false;
    check(ents.some(e=>e.type==='ariel'),'Ariel in level '+l.id);
    if(l.id>1){const forms=ents.filter(e=>LANDSCAPE_TYPES.has(e.type));const signature=forms.map(e=>e.type+':'+e.tx+','+e.ty).join('|');check(forms.length>=5,'landforms populate map '+l.id);check(!mapLayouts.has(signature),'map layout differs in level '+l.id);mapLayouts.add(signature)}
    check(l.id!==1||!ents.some(e=>e.type==='tc'),'cave start has no Town Center');
    const oldage=age;age=l.maxAge;check(!!ageRequirement(),'age cap enforced '+l.id);doAgeUp();check(age===l.maxAge,'cannot exceed cap '+l.id);age=oldage;
    for(let i=0;i<PLANS[l.id].length;i++){
      memory.stage=i;closeModal();beginStage();paused=false;const st=PLANS[l.id][i];
      if(['fight','capture','race','duel'].includes(st.kind))check(memory.targets.length>0,'targets exist '+l.id+'/'+i);
      if(['reach','escort','tribute'].includes(st.kind))check(Number.isFinite(memory.marker?.x),'destination exists '+l.id+'/'+i);
      if(memory.marker){const a=ents.find(e=>e.type==='ariel');const target=byId.get(memory.targets[0]);const path=target?.kind==='bld'?pathEnt(a,target):pathPoint(a,memory.marker.x,memory.marker.y);check(path.length>0,'destination has a walking route '+l.id+'/'+i)}
      check(st.kind!=='build'||(DEF[st.type].age||1)<=l.maxAge,'building age reachable '+l.id+'/'+i);
      check(saveMemory(false),'save serializes '+l.id+'/'+i);
      result.stages++;
    }
    result.levels++;await new Promise(r=>setTimeout(r,0));
  }
  await startMemory(1);closeModal();beginStage();paused=false;
  const siamak=ents.find(e=>e.type==='companion');blessingMode=true;setSel([siamak.id]);check(!blessingMode,'selecting Siamak cancels blessing');commandInner(22*TILE,72*TILE,null,[siamak]);check(siamak.state==='move','Siamak accepts move order');blessingMode=true;commandInner(23*TILE,72*TILE,null,[siamak]);check(!blessingMode&&siamak.state==='move','ground order exits blessing and moves');blessingMode=true;commandInner(0,0,ents.find(e=>e.type==='cave'),[]);check(blessing===ents.find(e=>e.type==='cave').id&&!blessingMode,'building blessing still works');
  const cave=ents.find(e=>e.type==='cave');setSel([cave.id]);check(cmdList().some(c=>c.act==='train:villager'),'cave trains villagers');check(!cmdList().some(c=>c.act==='ageup'),'cave cannot age up');
  check(ents.filter(e=>e.type==='villager').length===5,'five villagers at start');check(ents.filter(e=>e.type==='spearman').length===6,'six defenders at start');check(ents.some(e=>e.type==='mountain'),'mountain ridge exists');
  setSel([ents.find(e=>e.type==='villager').id]);for(const b of ['house','farm','barracks','tower','wall'])check(cmdList().some(c=>c.act==='build:'+b),'opening can build '+b);
  const wallSite=(()=>{for(let y=55;y<77;y++)for(let x=12;x<52;x++)if([0,1,2,3].every(dx=>fits(x+dx,y,1,1,true)))return{x,y};throw Error('No four-tile wall site')})();
  res.wood=1000;placing='wall';wallStart=null;const wallCount=ents.length;
  placeWallEnd({x:wallSite.x+.5,z:wallSite.y+.5});check(wallStart?.x===wallSite.x&&ents.length===wallCount,'first wall click only sets start');
  placeWallEnd({x:wallSite.x+3.5,z:wallSite.y+.5});const walls=ents.slice(wallCount);
  check(walls.length===4&&walls.every(b=>b.type==='wall'&&b.wallBatch===walls[0].wallBatch),'second click builds one continuous wall');
  check(res.wood===900&&placing===null&&wallStart===null,'wall charges for every section and ends placement');
  walls.forEach(b=>complete(b));setSel([walls[1].id]);check(cmdList().some(c=>c.act==='gate'),'completed wall offers gate');
  doAct('gate');const gate=walls[1];check(gate.type==='gate'&&!gate.done&&res.wood===855,'gate replaces selected section and charges cost');
  complete(gate);check(!isBlk(gate.tx,gate.ty,0)&&isBlk(gate.tx,gate.ty,1),'completed gate admits allies but blocks enemies');
  check(isBlk(walls[0].tx,walls[0].ty,0)&&isBlk(walls[0].tx,walls[0].ty,1),'ordinary wall blocks both sides');
  const crossX=(gate.tx+.5)*TILE,crossY=(gate.ty+.5)*TILE;
  check(lineClear(crossX,crossY-TILE*.8,crossX,crossY+TILE*.8,0),'allies can move straight through gate');
  check(!lineClear(crossX,crossY-TILE*.8,crossX,crossY+TILE*.8,1),'enemies cannot move straight through gate');
  saveMemory(false);await resumeMemory();check(byId.get(gate.id)?.type==='gate'&&!isBlk(gate.tx,gate.ty,0)&&isBlk(gate.tx,gate.ty,1),'gate access survives save and reload');
  await startMemory(1);closeModal();beginStage();paused=false;
  const sparSite=nearFree(28,65),sparX=sparSite.x*TILE+16,sparY=sparSite.y*TILE+16;
  const spar=mkUnit('spearman',0,sparX,sparY),sparFoe=mkUnit('serpent',1,sparX+15,sparY);
  sparFoe.hp=1000;orderAttack(spar,sparFoe);const sparHp=sparFoe.hp;
  updUnit(spar,.05);check(spar.attackPending&&sparFoe.hp===sparHp,'melee winds up before dealing damage');
  for(let i=0;i<10;i++)updUnit(spar,.05);
  check(!spar.attackPending&&sparFoe.hp<sparHp,'melee strike deals damage after windup');
  const bowSite=nearFree(30,65),bowX=bowSite.x*TILE+16,bowY=bowSite.y*TILE+16;
  const bow=mkUnit('archer',0,bowX,bowY),bowFoe=mkUnit('serpent',1,bowX+3*TILE,bowY);
  orderAttack(bow,bowFoe);const oldShots=projs.length;
  updUnit(bow,.05);check(bow.attackPending&&projs.length===oldShots,'archer draws before releasing arrow');
  for(let i=0;i<14;i++)updUnit(bow,.05);
  check(!bow.attackPending&&projs.length>oldShots,'archer releases arrow after drawing');
  now=10000;triggers();check(memory.stage===0&&!ents.some(e=>e.memoryWave),'no attack before settlement ready');
  stageTarget('barracks',0,0);triggers();check(memory.stage===1,'training ground advances objective');now+=10000;triggers();check(memory.stage===1,'preparation has no forced time limit');
  spawnAlly('villager',3);spawnAlly('spearman',2);stageTarget('tower',0,1);triggers();check(memory.stage===2,'settlement readiness advances');check($('#m-title').textContent==='The scout returns','Siamak receives a story lead-in');check($('#memory-objective').textContent.includes('Prince Siamak'),'mission identifies prince');
  closeModal();paused=false;const prince=byId.get(memory.siamakId);prince.x=memory.marker.x;prince.y=memory.marker.y;triggers();check(memory.duelStarted&&byId.get(memory.duelEnemy),'Siamak visibly meets demon at pass');now=memory.duelAt+9;triggers();check(memory.duelResolved&&$('#m-title').textContent==='Siamak falls at the pass','story explains witnessed death');
  saveMemory(false);await resumeMemory();check($('#m-title').textContent==='Siamak falls at the pass','saved aftermath resumes clearly');$('#m-acts button').click();paused=false;check(memory.stage===3,'aftermath leads to village defence');
  for(let i=0;i<3;i++){now=memory.stageAt+61+i*80;triggers()};check(memory.wave===3,'all three waves launch');now=memory.stageAt+301;triggers();check(!gameOver,'timer cannot win with live attackers');for(const e of ents)if(e.memoryWave)e.dead=true;triggers();check(gameOver,'defeating waves wins');
  await startMemory(2);closeModal();beginStage();paused=false;setSel([ents.find(e=>e.type==='villager').id]);check(cmdList().some(c=>c.act==='build:farm'),'level two villagers can build farms');memory.stage=2;beginStage();closeModal();paused=false;refreshMissionHUD();check($('#memory-objective').textContent.includes('Blacksmith is a building')&&$('#mission-guide').textContent==='See Age of Iron','Blacksmith explains building and age');$('#mission-guide').click();check($('#upgrade-name').textContent.includes('Age of Iron')&&$('#upgrade-status').textContent.includes('Temple'),'guide opens age requirement');closeUpgrade();age=1;doAgeUp();check(age===2&&memory.pendingPatron===2,'age upgrade opens patron choice');
  check($('#m-acts').children.length===3&&$('#modal').classList.contains('patron-modal')&&$('#story-art').getAttribute('src').includes('age-of-iron-forge.png'),'illustrated Age of Iron patrons offered');$('#m-acts button').click();check(memory.patrons.length===1&&powers.length===1,'patron choice grants power');
  const temple=stageTarget('temple',0,0);const priest=mkUnit('priest',0,temple.x+80,temple.y+80);setSel([priest.id]);check($('#sel').textContent.includes('0.6 Glory/s')&&$('#sel').textContent.includes('Priests do not fight'),'priest selection explains role');const before=res.farr;updUnit(priest,1);check(res.farr>before,'priest generates Glory');
  blessing=temple.id;memory.blessing=blessing;const beforeBless=res.farr;updUnit(priest,1);check(Math.abs(res.farr-beforeBless-.72)<.001,'blessing increases prayer by exactly 20 percent');
  res.gold=432;memory.stage=1;saveMemory(false);res.gold=0;await resumeMemory();check(res.gold===432&&age===2,'save restores economy and age');check(blessing===temple.id,'save restores blessing');check(memory.patrons.length===1,'save restores patron choice');
  // Force each objective's success condition to exercise transitions, without claiming playtime/balance.
  for(const l of CAMPAIGN_LEVELS){await startMemory(l.id);closeModal();beginStage();paused=false;let guard=0;
    while(!gameOver&&guard++<100){const idx=memory.stage,st=PLANS[l.id][idx];if(!st)break;closeModal();paused=false;
      if(st.kind==='event'||st.kind==='side'){advanceStage();continue}
      if(st.kind==='siamak'){const prince=byId.get(memory.siamakId);prince.x=memory.marker.x;prince.y=memory.marker.y;triggers();now=memory.duelAt+9;triggers();$('#m-acts button').click();paused=false;continue}
      if(st.kind==='prepare'){spawnAlly('villager',12);spawnAlly('spearman',10);stageTarget('tower',0,0)}
      if(st.kind==='hold'&&l.id===1){memory.wave=3;for(const e of ents)if(e.memoryWave)e.dead=true}
      if(st.kind==='build')stageTarget(st.type,0,0);
      if(st.kind==='stock'){for(const k in st.cost)res[k]=st.cost[k];missionAction();continue}
      if(['fight','race','duel'].includes(st.kind)){for(const id of memory.targets){const e=byId.get(id);if(e){e.dead=true;if(e.kind==='bld')stampE(e,false)}}}
      if(st.kind==='capture'){for(const id of memory.targets){const e=byId.get(id);if(e)e.team=0}}
      if(st.kind==='reach'){const a=ents.find(e=>e.type==='ariel');a.x=memory.marker.x;a.y=memory.marker.y}
      if(st.kind==='escort'){memory.escorting=true;for(const id of memory.targets){const e=byId.get(id);e.team=0;e.x=14*TILE;e.y=67*TILE}}
      if(st.seconds){now=memory.stageAt+st.seconds+1;if(st.kind==='race')now=memory.stageAt+1;}
      if(st.n&&['rescue','tax','famine','succession','blind','ambush'].includes(st.kind))spawnAlly(['blind','ambush'].includes(st.kind)?'spearman':'villager',st.n);
      if(st.kind==='tribute')memory.deliveries=st.n;
      if(st.kind==='court')memory.goal=st.n;
      if(st.kind==='puzzle'){advanceStage();continue}
      triggers();if(memory.stage===idx&&st.kind!=='duel')throw Error('Objective failed to transition '+l.id+'/'+idx+' '+st.kind);
    }
    check(gameOver,'level can reach ending '+l.id);
  }
  result.passed=true;
}catch(e){result.error=e.stack;result.passed=false}
document.body.insertAdjacentHTML('beforeend','<pre id="ariel-test-result" style="position:fixed;inset:0;z-index:9999;background:#142b2a;color:white;overflow:auto;padding:30px">'+esc(JSON.stringify({...result,checks:result.checks.length},null,2))+'</pre>');
await fetch('/report',{method:'POST',body:JSON.stringify(result)});
})();

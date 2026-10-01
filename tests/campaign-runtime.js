// Test fixtures run only on the separate local test server, never in the user's save.
(async()=>{
const result={checks:[],levels:0,stages:0};
const check=(v,label)=>{if(!v)throw Error(label);result.checks.push(label)};
try{
  check(CAMPAIGN_LEVELS.length===62,'62 levels loaded');check(new Set(CAMPAIGN_LEVELS.map(l=>l.act)).size===9,'9 acts loaded');
  check(Object.keys(PLANS).length===62,'every level has objective logic');
  for(const type of ['ariel','companion','priest','caravan','ram','dragon','bounddemon','champion','tyrant','cave','range','blacksmith','market','library','observatory','nest','wonder','wall','stronghold','lair','tradepost','stonedefender'])check(portrait(type,0).startsWith('data:image/'),'portrait renders '+type);
  campaign.completed=Array.from({length:62},(_,i)=>i+1);
  for(const l of CAMPAIGN_LEVELS){
    startMemory(l.id);closeModal();beginStage();paused=false;
    check(ents.some(e=>e.type==='ariel'),'Ariel in level '+l.id);
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
  startMemory(1);closeModal();beginStage();paused=false;
  const siamak=ents.find(e=>e.type==='companion');blessingMode=true;setSel([siamak.id]);check(!blessingMode,'selecting Siamak cancels blessing');commandInner(22*TILE,72*TILE,null,[siamak]);check(siamak.state==='move','Siamak accepts move order');blessingMode=true;commandInner(23*TILE,72*TILE,null,[siamak]);check(!blessingMode&&siamak.state==='move','ground order exits blessing and moves');blessingMode=true;commandInner(0,0,ents.find(e=>e.type==='cave'),[]);check(blessing===ents.find(e=>e.type==='cave').id&&!blessingMode,'building blessing still works');
  const cave=ents.find(e=>e.type==='cave');setSel([cave.id]);check(cmdList().some(c=>c.act==='train:villager'),'cave trains villagers');check(!cmdList().some(c=>c.act==='ageup'),'cave cannot age up');
  check(ents.filter(e=>e.type==='villager').length===5,'five villagers at start');check(ents.filter(e=>e.type==='spearman').length===6,'six defenders at start');check(ents.some(e=>e.type==='mountain'),'mountain ridge exists');
  setSel([ents.find(e=>e.type==='villager').id]);for(const b of ['house','farm','barracks','tower','wall'])check(cmdList().some(c=>c.act==='build:'+b),'opening can build '+b);
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
  spawnAlly('villager',3);spawnAlly('spearman',2);stageTarget('tower',0,1);triggers();check(memory.stage===2,'settlement readiness advances');closeModal();advanceStage();paused=false;
  for(let i=0;i<3;i++){now=memory.stageAt+61+i*80;triggers()};check(memory.wave===3,'all three waves launch');now=memory.stageAt+301;triggers();check(!gameOver,'timer cannot win with live attackers');for(const e of ents)if(e.memoryWave)e.dead=true;triggers();check(gameOver,'defeating waves wins');
  startMemory(2);closeModal();beginStage();paused=false;age=1;doAgeUp();check(age===2&&memory.pendingPatron===2,'age upgrade opens patron choice');
  check($('#m-acts').children.length===3,'three patrons offered');$('#m-acts button').click();check(memory.patrons.length===1&&powers.length===1,'patron choice grants power');
  const temple=stageTarget('temple',0,0);const priest=mkUnit('priest',0,temple.x+80,temple.y+80);const before=res.farr;updUnit(priest,1);check(res.farr>before,'priest generates Glory');
  blessing=temple.id;memory.blessing=blessing;const beforeBless=res.farr;updUnit(priest,1);check(Math.abs(res.farr-beforeBless-.72)<.001,'blessing increases prayer by exactly 20 percent');
  res.gold=432;memory.stage=1;saveMemory(false);res.gold=0;resumeMemory();check(res.gold===432&&age===2,'save restores economy and age');check(blessing===temple.id,'save restores blessing');check(memory.patrons.length===1,'save restores patron choice');
  // Force each objective's success condition to exercise transitions, without claiming playtime/balance.
  for(const l of CAMPAIGN_LEVELS){startMemory(l.id);closeModal();beginStage();paused=false;let guard=0;
    while(!gameOver&&guard++<100){const idx=memory.stage,st=PLANS[l.id][idx];if(!st)break;closeModal();paused=false;
      if(st.kind==='event'||st.kind==='side'){advanceStage();continue}
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

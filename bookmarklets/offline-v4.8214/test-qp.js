// tetrio-patch v4.8212. Source code and maintenance comments are written in English.
// Shared native local DUO transport. No AI implementation in the standard edition.
(() => {let session=null,sequence=0;
 function autoDeath(ally,clock=()=>ally.getFrame()*1000/60){
  let deadline=clock()+2000;
  return ()=>{if(!ally.isPlaying())return;if(ally.state.zenith.incapacitated){deadline=null;return}
   if(deadline===null){deadline=clock()+2000;return}
   if(clock()>=deadline){deadline=null;ally.source.self.zthm.IncapacitateSelf('garbagesmash');finishIfBothDown()}
  };
 }
 function send(target,type,amt){if(!target?.isPlaying())return;target.source.Push('ige',{id:'local-duo-'+ ++sequence,type:'interaction_confirm',data:{type,...(amt===undefined?{}:{amt})}})}
 function finishIfBothDown(){
  const state=session;if(!state||state.stopped||state.ending||!state.ally)return;
  const down=game=>!!game.state.zenith?.incapacitated||!game.isPlaying();
  if(!down(state.main)||!down(state.ally))return;
  state.ending=true;
  // A paused engine may not consume the peer IGE before the other board dies.
  // The actual local engine states are authoritative for simultaneous defeat.
  Promise.resolve().then(()=>{if(state.stopped)return;if(state.main.isPlaying())state.main.source.self.gom.GameOver('garbagesmash',true);api.stop()});
 }
 function link(source,target){
  const manager=source.source.self.zthm;
  for(const [name,type]of [['GiveClimbPts','zenith.climb_pts'],['GiveBonus','zenith.bonus']]){
   const original=manager[name].bind(manager);manager[name]=function(value,fromAlly=false){const before=name==='GiveBonus'?source.state.zenith.bonusremaining:0;const result=original(value,fromAlly);if(!fromAlly&&value)send(target,type,name==='GiveBonus'?source.state.zenith.bonusremaining-before:value);return result};
  }
  const incap=manager.IncapacitateSelf.bind(manager);manager.IncapacitateSelf=function(reason){const was=source.state.zenith.incapacitated;const result=incap(reason);if(!was&&source.state.zenith.incapacitated){send(target,'zenith.incapacitated');}finishIfBothDown();return result};
  const receive=manager.ReceiveAttack.bind(manager);manager.ReceiveAttack=function(amount){source._localDuoLastInjected={attacker:target,frame:source.getFrame()};return receive(amount)};
  let halfCarry=0;const attack=manager.AttackAlly.bind(manager);manager.AttackAlly=function(amount){const reversed=source.options.zenith_mods.includes('duo_reversed');let scaled=amount;if(reversed){const value=amount*.5+halfCarry;scaled=Math.floor(value);halfCarry=value-scaled}const reflected=source.state.zenith.allyincapacitated;const result=attack(scaled);if(reversed&&!reflected&&scaled)send(target,'zenith.attack',Math.min(255,scaled));return result};
  const revive=manager.ReviveOther.bind(manager);manager.ReviveOther=function(){const was=source.state.zenith.allyincapacitated;const result=revive();if(was)send(target,'zenith.revive');return result};
 }
 function fadeBotWhileDown(ally){
  let holder=null,baseAlpha=1,wasDown=false;
  const update=()=>{const next=ally?.getHolderData?.()?.holder||ally?.source?.self?.hm?.H?.holder;if(next!==holder){if(holder&&!holder._destroyed)holder.alpha=baseAlpha;holder=next;baseAlpha=Number.isFinite(holder?.alpha)?holder.alpha:1;wasDown=false}if(!holder||holder._destroyed)return;const down=!!ally.state.zenith?.incapacitated;if(down){if(!wasDown)baseAlpha=Number.isFinite(holder.alpha)?holder.alpha:1;holder.alpha=baseAlpha*.45}else if(wasDown)holder.alpha=baseAlpha;else baseAlpha=Number.isFinite(holder.alpha)?holder.alpha:baseAlpha;wasDown=down};
  ally.on('frame','local-bot-revive-opacity',update);
  return()=>{ally.remove('frame','local-bot-revive-opacity');if(holder&&!holder._destroyed)holder.alpha=baseAlpha};
 }
const api=window.LocalTestQP={finishIfBothDown,autoDeath,
start(main,mode,create,config={}){api.stop();if(mode==='solo'||!mode)return;if(!['duo-dead','duo-reverse-dead'].includes(mode))throw Error('この版は蘇生練習のみです');const state=session={main,ally:null,mode,cleanup:[],stopped:false};const ally=create({...main.options,gameid:8002,username:'LOCAL PARTNER',zenith_ally:[main.id,main.options.username],can_retry:false,noreplay:false,display_username:true});state.ally=ally;ally._localTestMode=mode;ally._localMissionConfig={...(config.missions||{})};ally._localReplaySide='partner';main.source.self.zthm.duoOtherSideGame=ally;ally.source.self.zthm.duoOtherSideGame=main;main.updateDuoSide('left',true);ally.updateDuoSide('right',true);state.cleanup.push(window.LocalBoardPair?.attach([main,ally])||(()=>{}),fadeBotWhileDown(ally));link(main,ally);link(ally,main);state.cleanup.push(window.LocalReviveMissions.attach(main,config.missions||{}));const defeatCheck=()=>finishIfBothDown();main.on('frame','local-duo-defeat',defeatCheck);ally.on('frame','local-duo-defeat',defeatCheck);state.cleanup.push(()=>main.remove('frame','local-duo-defeat'),()=>ally.remove('frame','local-duo-defeat'));const tick=autoDeath(ally),timer=setInterval(tick,100);ally.on('frame','local-test-dead',tick);state.cleanup.push(()=>ally.remove('frame','local-test-dead'),()=>clearInterval(timer));const stopOnEnd=()=>api.stop();main.on('end','local-test-stop',stopOnEnd);state.cleanup.push(()=>main.remove('end','local-test-stop'))},
getAlly(){return session?.ally||null},setSpeed(speed){session?.ally?.playbackSpeed(speed)},stop(){const state=session;if(!state||state.stopped)return;state.stopped=true;session=null;for(const cleanup of state.cleanup)cleanup();if(state.ally){state.main.source.self.zthm.duoOtherSideGame=null;state.ally.state.playing=false;state.ally.playbackSpeed(0);state.ally.destroy()}}
};})();

(() => {
 let active=null,id=0;
 const api=window.LocalQPAttacks={
  start(game,config={}){
   api.stop();if(!['periodic','floor'].includes(config.attackMode))return;
   const lines=Number(config.attackLines),seconds=Number(config.attackSeconds);
   if(!Number.isInteger(lines)||lines<1||lines>20||!Number.isFinite(seconds)||seconds<.5||seconds>60)throw Error('攻撃は1〜20段、間隔は0.5〜60秒で指定してください');
   game._localAttackConfig={mode:config.attackMode,lines,seconds};
   let next=game.getFrame()+Math.round(seconds*60);
   const tick=()=>{
    if(!game.isPlaying()||game.state.zenith?.incapacitated||game.getFrame()<next)return;
    next=game.getFrame()+Math.round(seconds*60);
    for(const target of [game,window.LocalTestQP?.getAlly()].filter(Boolean)){
     if(!target.isPlaying()||target.state.zenith?.incapacitated)continue;
     target.source.Push('ige',{id:'local-training-'+ ++id,type:'interaction',data:{type:'garbage',gameid:8000,username:'LOCAL TRAINING',amt:config.attackMode==='floor'?Math.min(40,lines+Math.max(0,(target.state.stats.zenith.floor||1)-1)):lines,zthalt:target.getZenithAltitude(),x:4.5,y:30}});
    }
   };
   active={game};game.on('frame','local-training-attacks',tick);game.on('end','local-training-stop',()=>api.stop());
  },
  stop(){if(!active)return;const {game}=active;active=null;game.remove('frame','local-training-attacks');game.remove('end','local-training-stop')}
 };
})();

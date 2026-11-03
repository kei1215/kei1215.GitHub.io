/* Revive-specific rendering. Visual effects never mutate collision or board data. */
(()=>{
 const active=new WeakMap(),frames=()=>performance.now()/1000;
 const clamp=x=>Math.max(0,Math.min(1,x));
 function alpha(rule,time){if(!rule||rule.mode==='normal')return null;
  const p=clamp(Number(rule.visiblePercent??100)/100);
  switch(rule.mode){case 'hidden':return 0;
   case 'pulse':return (time%(rule.period||5))<(rule.period||5)*p?1:0;
   case 'fade-in':return p*clamp(time/(rule.period||5));
   case 'gradient':return p;
   default:return null;
  }
 }
 function apply(game,entry){
  const H=game.source?.self?.hm?.H,rule=entry.rule,now=(game.getFrame()-entry.started)/60;
  if(!H)return;
  const stack=rule.modes?.stack,garbage=rule.modes?.garbage||stack;
  if((stack&&stack.mode!=='normal')||(garbage&&garbage.mode!=='normal')){
   for(const obj of H.stackobj?.children||[]){if(!obj?.__mino)continue;
    const isGarbage=obj.__mino==='gb'||obj.__mino==='gbd';
    const chosen=isGarbage?garbage:stack;
    const a=chosen?.afterLock?1:alpha(chosen,now);
    // Follow original native Invisible alpha if requested, but don't overwrite
    // a normal (unmodified) visibility rule.
    if(a!==null)obj.alpha=a;
    if(a===null)obj.alpha=1;
   }
  }
  const falling=H.fallingobj;
  // Match the selected position in a five-piece NEXT batch.
  // This avoids accidentally hiding every active piece.
  const selected=Array.isArray(rule.nextWhenSpawnSlots)?rule.nextWhenSpawnSlots:[];
  const placed=Number(game.state?.stats?.piecesplaced??game.state?.stats?.pieces??0);
  const sinceStart=placed-entry.startedPieces;
  const incomingSlot=sinceStart>0?(sinceStart-1)%5+1:0;
  const hideSpawn=selected.length?selected.includes(incomingSlot):
    (rule.nextWhenSpawnHidden===true && (rule.nextHidden||[]).includes(incomingSlot));
  for(const obj of falling?.children||[]){
   // The native renderer creates ghost tiles first with alpha <= 0.25,
   // whereas active minos are opaque even when their container is fading.
   if(obj.__qpNativeAlpha===undefined)obj.__qpNativeAlpha=obj.alpha;
   if(obj.__qpNativeGhost===undefined)obj.__qpNativeGhost=(typeof obj.__qpNativeAlpha==='number'&&obj.__qpNativeAlpha<=.3);
   const isGhost=obj.__qpNativeGhost;
   const setting=hideSpawn&&!isGhost?{mode:'hidden'}:rule.modes?.[isGhost?'ghost':'active'];
   if(!setting||setting.mode==='normal'){obj.alpha=obj.__qpNativeAlpha;continue;}
   const amount=alpha(setting,now);if(amount!==null)obj.alpha=isGhost?Math.min(obj.__qpNativeAlpha,amount):amount;
  }
  const next=rule.modes?.next;
  for(let i=0;i<(H.nextobj?.length||0);i++){
   const obj=H.nextobj[i];if(!obj)continue;
   // Each NEXT position may override the global queue mode and percentage.
   // A hard `nextHidden` mask is still respected by maskPreviews().
   const slot=rule.nextSlots?.[i],chosen=slot&&slot.mode!=='normal'?slot:next;
   const base=alpha(chosen,now);
   if(base===null){if(slot&&slot.mode==='normal')obj.alpha=1;continue;}
   let a=base;
   if(chosen.mode==='gradient' && chosen===next){
    // Fade out from the bottom of the queue. Percent controls how many
    // previews stay fully visible, with one partially visible on the edge.
    const count=Math.max(1,H.nextobj.length),slots=count*base;
    a=clamp(slots-i);
   }
   obj.alpha=a;
  }
  const hold=H.holdobj;const holdRule=rule.modes?.hold;
  if(hold&&holdRule&&holdRule.mode!=='normal')hold.alpha=alpha(holdRule,now);
 }
 function restore(game){const old=active.get(game);if(!old)return;active.delete(game);
  const H=game.source?.self?.hm?.H;
  if(H){if(H.fallingobj){H.fallingobj.alpha=1;for(const obj of H.fallingobj.children||[])if(obj)obj.alpha=obj.__qpNativeAlpha??1}
   if(H.stackobj){H.stackdirty=true;for(const obj of H.stackobj.children||[])if(obj)obj.alpha=1}
   for(const obj of H.nextobj||[])if(obj)obj.alpha=1;
   if(H.holdobj)H.holdobj.alpha=1;
  }
 }
 function activate(game,rule){restore(game);if(!rule?.modes)return;active.set(game,{rule,started:game.getFrame(),startedPieces:Number(game.state?.stats?.piecesplaced??game.state?.stats?.pieces??0)})}
 window.LocalVisibilityEffects={activate,restore,tick(game){const entry=active.get(game);if(entry)apply(game,entry)}};
})();

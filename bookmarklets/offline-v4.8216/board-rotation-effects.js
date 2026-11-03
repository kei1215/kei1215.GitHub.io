/* Revive RUN board rotation (4.81 BoardRotationFix2).
 * Transform only the locally controlled game's native PIXI holder.
 * The TETR.IO renderer owns holder.rotation (a NUMBER, not a method) and
 * derives it from holderstate.br (DEGREES). Never call holder.rotation().
 */
(()=>{
 'use strict';
 const running=new WeakMap();
 const smooth=t=>t*t*(3-2*t);
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 const norm=v=>((v%360)+360)%360;
 const finite=(v,fallback)=>Number.isFinite(Number(v))?Number(v):fallback;
 const now=()=>performance.now();
 function chooseAngle(settings={}){
  if(settings.mode==='random')return 1+Math.floor(Math.random()*359);
  return clamp(finite(settings.degrees,180),0,360);
 }
 function holderData(game){
  // getHolderData() is exported by the native client. Prefer it to guesses
  // about the private engine structure; the fallback supports older clients.
  try{const value=game?.getHolderData?.();if(value)return value}catch{}
  return game?.source?.self?.hm?.H||null;
 }
 function runtime(game){return game?.source?.self?.gsm||null}
 function stop(game){
  const state=running.get(game);
  if(!state)return;
  running.delete(game);
  if(state.raf)cancelAnimationFrame(state.raf);
  // A mission may rebuild the holder. Always restore the CURRENT holderstate,
  // never a captured reference to a destroyed PIXI container.
  const H=holderData(game);
  if(state.originalAngle!==null&&H?.holderstate)H.holderstate.br=state.originalAngle;
  if(state.inputPatched){
   if(state.options)state.options.inverted=state.originalOption;
   if(state.setoptions)state.setoptions.inverted=state.originalInput;
   if(state.gsm&&state.rotateOriginal)state.gsm._ProcessRotate=state.rotateOriginal;
   const shift=state.gsm;
   if(shift?.lShift&&shift?.rShift){
    shift.lShift.held=false;shift.rShift.held=false;
    shift.lShift.das=0;shift.rShift.das=0;
   }
  }
 }
 function beginOne(game,duration,settings={},controls={}){
  if(!game)return false;
  stop(game);
  const degrees=chooseAngle(settings);
  const halfTurn=Math.abs(norm(degrees)-180)<1e-6;
  const reverseHorizontal=halfTurn||controls.reverseHorizontal===true;
  const reverseRotation=halfTurn||controls.reverseRotation===true;
  const state={
   raf:0,started:now(),missingSince:null,first:null,originalAngle:null,
   degrees,reverseHorizontal,reverseRotation,options:null,setoptions:null,
   originalOption:false,originalInput:false,rotateOriginal:null,
   gsm:null,inputPatched:false,reported:false
  };
  running.set(game,state);
  // A temporary missing canvas is normal while the native holder is being
  // constructed or rebuilt. Defer activation rather than aborting the mission.
  function frame(timestamp){
   if(running.get(game)!==state)return;
   const H=holderData(game),gsm=runtime(game);
   const holder=H?.holder;
   if(!H?.holderstate||!holder||holder._destroyed||!gsm?.setoptions||
      (reverseRotation&&typeof gsm._ProcessRotate!=='function')){
    if(state.missingSince===null)state.missingSince=timestamp;
    if(timestamp-state.missingSince>=5000){
     if(!state.reported){
      const missing=[];
      if(!H?.holderstate)missing.push('holderstate');
      if(!holder||holder._destroyed)missing.push('holder');
      if(!gsm?.setoptions)missing.push('setoptions');
      if(reverseRotation&&typeof gsm?._ProcessRotate!=='function')missing.push('_ProcessRotate');
      window.LocalUIHealth?.fail?.('Revive RUN盤面回転','プレイヤー盤面の準備ができません：'+missing.join(', '));
      state.reported=true;
     }
     stop(game);
     delete game._localReviveRotationAngle;
     return;
    }
    state.raf=requestAnimationFrame(frame);
    return;
   }
   state.missingSince=null;
   // Capture native baseline only AFTER the real player holder is available.
   if(state.originalAngle===null){
    state.originalAngle=finite(H.holderstate.br,0);
    state.first=timestamp;
    state.options=game.options||null;
    state.setoptions=gsm.setoptions;
    state.originalOption=!!state.options?.inverted;
    state.originalInput=!!state.setoptions.inverted;
    state.gsm=gsm;
    state.rotateOriginal=typeof gsm._ProcessRotate==='function'?gsm._ProcessRotate:null;
    if(reverseHorizontal){
     if(state.options)state.options.inverted=!state.originalOption;
     state.setoptions.inverted=!state.originalInput;
    }
    if(reverseRotation){
     gsm._ProcessRotate=function(direction){
      const opposite=direction===1?-1:direction===-1?1:direction;
      return state.rotateOriginal.call(this,opposite);
     };
    }
    if(reverseHorizontal&&gsm.lShift&&gsm.rShift){
     gsm.lShift.held=false;gsm.rShift.held=false;
     gsm.lShift.das=0;gsm.rShift.das=0;
    }
    state.inputPatched=true;
    game._localReviveRotationAngle=state.originalAngle+degrees;
   }
   const p=duration===0?1:clamp((timestamp-state.first)/duration,0,1);
   // The native rendering loop converts holderstate.br degrees to radians
   // and assigns the PIXI holder.rotation numeric property. This survives
   // redraws and also allows native shake/zoom animations to keep running.
   H.holderstate.br=state.originalAngle+degrees*smooth(p);
   state.raf=requestAnimationFrame(frame);
  }
  state.raf=requestAnimationFrame(frame);
  return true;
 }
 function activate(games,settings={},controls={}){
  const each=[...new Set((Array.isArray(games)?games:[games]).filter(Boolean))];
  if(!settings.enabled&&!controls.reverseHorizontal&&!controls.reverseRotation)return()=>{};
  const duration=settings.enabled?clamp(finite(settings.durationMs,700),0,3000):0;
  for(const game of each)beginOne(game,duration,
   settings.enabled?settings:{degrees:0,mode:'fixed'},controls);
  return()=>{for(const game of each){stop(game);delete game._localReviveRotationAngle}};
 }
 window.LocalBoardRotationEffects={activate,stop,chooseAngle};
})();

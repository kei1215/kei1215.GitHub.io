/* QP local /rotate: display-only PIXI holder rotation. No board/game-state resets.
 * v4.8212 - fixed, one-time random, continuous spin, smooth random continuous.
 */
(()=>{
 'use strict';
 if(window.LocalRotateCommand)return;
 const TAU=Math.PI*2;
 const toRad=angle=>angle*Math.PI/180;
 const rand=(min,max)=>min+Math.random()*(max-min);
 const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
 const number=value=>value!==''&&value!==undefined&&Number.isFinite(Number(value))?Number(value):NaN;
 const running={mode:'reset',game:null,holder:null,descriptor:null,base:0,offset:0,raf:0,started:0,lastFrame:0,target:0,from:0,until:0,period:1.6,speed:90};
 const report=message=>{
  const text='[QP /rotate] '+message;
  console.info(text);
  let node=document.getElementById('qp-rotate-status');
  if(!node&&document.body){node=document.createElement('div');node.id='qp-rotate-status';node.style.cssText='position:fixed;bottom:1em;right:1em;z-index:2147483647;max-width:min(32em,80vw);color:#fff;background:#17202eea;border:1px solid #8499bb;border-radius:9px;padding:.65em 1em;font:13px system-ui;pointer-events:none;white-space:pre-wrap';document.body.appendChild(node)}
  if(node){node.textContent=message;node.hidden=false;clearTimeout(node._timer);node._timer=setTimeout(()=>node.hidden=true,4500)}
  return message;
 };
 function localGame(){
  try{
   const games=window.LocalAIRoom?.getGames?.()||[];
   if(games.length){const role=window.LocalRoomUI?.read?.()?.players||{};
    const side=role.left==='player'?0:role.right==='player'?1:0;
    return games[side]||games[0]||null;
   }
   return window.OriginalReplay?.game?.()||null;
  }catch{return null}
 }
 function holderOf(game){
  try{const h=game?.getHolderData?.()||game?.source?.self?.hm?.H;
   return h?.holder&&!h.holder._destroyed?h.holder:null;
  }catch{return null}
 }
 function originalAccessor(holder){
  let proto=holder;
  while((proto=Object.getPrototypeOf(proto))){const d=Object.getOwnPropertyDescriptor(proto,'rotation');if(d?.get&&d?.set)return d}
  return null;
 }
 function releaseHolder(){
  const s=running,holder=s.holder;
  if(holder&&s.descriptor){
   try{delete holder.rotation;s.descriptor.set.call(holder,s.base)}catch(err){console.warn('[QP rotate restore]',err)}
  }
  s.holder=null;s.descriptor=null;s.base=0;
 }
 function attachHolder(holder){
  const s=running;if(holder===s.holder)return true;
  releaseHolder();if(!holder)return false;
  const own=Object.getOwnPropertyDescriptor(holder,'rotation');
  // Never overwrite a property that another mod owns.
  if(own&&!own.configurable)return false;
  const accessor=originalAccessor(holder);
  if(!accessor)return false;
  let base=Number(accessor.get.call(holder))||0;
  try{
   Object.defineProperty(holder,'rotation',{
    configurable:true,enumerable:false,
    get(){return accessor.get.call(this)},
    set(value){
     // The native renderer is still free to animate its baseline rotation.
     // Apply our purely visual offset *after* its update.
     const input=Number(value)||0;
     const projected=base+s.offset;
     const actual=Number(accessor.get.call(this))||0;
     if(Math.abs(input-projected)>1e-7||Math.abs(actual-projected)>1e-7)base=input;
     accessor.set.call(this,base+s.offset);
     if(s.holder===this)s.base=base;
    }
   });
   s.holder=holder;s.descriptor=accessor;s.base=base;
   accessor.set.call(holder,base+s.offset);
   return true;
  }catch(err){console.warn('[QP rotate attach]',err);return false}
 }
 function updateOffset(angle){
  const s=running;s.offset=toRad(angle);
  if(s.holder&&s.descriptor){
   try{s.descriptor.set.call(s.holder,s.base+s.offset)}catch(err){console.warn('[QP rotate apply]',err)}
  }
 }
 function reset(silent=false){
  const s=running;
  if(s.raf)cancelAnimationFrame(s.raf);
  s.raf=0;releaseHolder();s.mode='reset';s.game=null;s.offset=0;
  if(!silent)report('回転解除（0°）');
 }
 function tick(t){
  const s=running;if(s.mode==='reset')return;
  const game=localGame();
  if(game!==s.game){releaseHolder();s.game=game}
  const holder=holderOf(game);
  if(holder!==s.holder)attachHolder(holder);
  // Offer the same stage/renderer references as the user's grabber, without
  // poisoning Object.prototype or attaching a hook to every JS object.
  try{const app=window.OriginalReplay?.renderer?.();if(app?.stage&&app?.renderer){
   window.__renderer=app.renderer;window.__stage=app.stage;
   window.__PIXI_DEVTOOLS__={app,renderer:app.renderer,stage:app.stage};
  }}catch{}

  if(s.mode==='spin'){
   const dt=clamp((t-(s.lastFrame||t))/1000,0,.1);
   s.from+=dt*s.speed;
   updateOffset(s.from);
  }else if(s.mode==='random-continuous'){
   if(t>=s.until){
    s.from=s.target;
    const jump=rand(50,260)*(Math.random()<.5?-1:1);
    s.target=s.from+jump;
    s.started=t;s.until=t+s.period*1000;
   }
   const p=clamp((t-s.started)/(s.until-s.started||1),0,1);
   updateOffset(s.from+(s.target-s.from)*(p*p*(3-2*p)));
  }else updateOffset(s.target);
  s.lastFrame=t;s.raf=requestAnimationFrame(tick);
 }
 function launch(mode,params={}){
  if(running.mode==='reset'&&!localGame()){report('プレイ中のローカル盤面が見つかりません。ゲーム開始後に実行してください');return false}
  reset(true);
  const s=running;s.mode=mode;s.started=s.lastFrame=performance.now();s.from=params.angle||0;s.target=params.angle||0;
  s.speed=params.speed??90;s.period=params.period??1.6;s.until=s.started;
  if(mode==='random-continuous'){s.from=0;s.target=0;s.until=s.started}
  s.raf=requestAnimationFrame(tick);
  return true;
 }
 function command(input){
  const raw=String(input??'').trim();
  if(!/^\/rotate(?:\s|$)/i.test(raw))return false;
  const words=raw.split(/\s+/).slice(1).map(x=>x.toLowerCase());
  if(words.length===0){
   if(running.mode==='fixed'&&running.target===180)reset();
   else if(launch('fixed',{angle:180}))report('固定回転：180°');
   return true;
  }
  if(words[0]==='reset'||words[0]==='off'||words[0]==='stop'){
   if(words.length!==1)report('使い方：/rotate reset');else reset();return true;
  }
  if(words[0]==='help'){
   report('/rotate (180°のON/OFF) | /rotate 45 | /rotate random\n/rotate spin [度/秒] | /rotate random continuous [秒]\n/rotate reset');return true;
  }
  if(words[0]==='random'){
   if(words.length===1){const a=Math.floor(rand(1,360));if(launch('fixed',{angle:a}))report('ランダム固定回転：'+a+'°');return true}
   if(words[1]==='continuous'&&words.length<=3){
    const seconds=words[2]===undefined?1.6:number(words[2]);
    if(!Number.isFinite(seconds)||seconds<.25||seconds>20){report('切替間隔は0.25～20秒で指定してください');return true}
    if(launch('random-continuous',{period:seconds}))report('ランダム連続回転：'+seconds+'秒ごとに次の角度へ');return true;
   }
   report('使い方：/rotate random または /rotate random continuous [秒]');return true;
  }
  if(words[0]==='spin'&&words.length<=2){
   const speed=words[1]===undefined?90:number(words[1]);
   if(!Number.isFinite(speed)||Math.abs(speed)>1080||speed===0){report('回転速度は-1080～1080°/秒（0以外）で指定してください');return true}
   if(launch('spin',{speed}))report('連続回転：'+speed+'°/秒');return true;
  }
  if(words.length===1){
   const angle=number(words[0]);
   if(Number.isFinite(angle)&&angle>=0&&angle<=360){if(launch('fixed',{angle}))report('固定回転：'+angle+'°');return true}
  }
  report('無効な指定です。/rotate help を参照してください');return true;
 }
 function installInputs(){
  const controls=document.getElementById('local-utility-actions')||document.getElementById('local-panel');
  if(!controls||document.getElementById('qp-rotate-command-field'))return;
  const wrap=document.createElement('form');wrap.id='qp-rotate-command-form';wrap.style.cssText='display:flex;gap:5px;flex-wrap:wrap;margin:.5em 0';
  const input=document.createElement('input');input.id='qp-rotate-command-field';input.placeholder='/rotate help';input.setAttribute('aria-label','QP回転コマンド');input.style.cssText='min-width:11em;flex:1;color:#fff;background:#222938;border:1px solid #777;padding:.3em';
  const button=document.createElement('button');button.type='submit';button.textContent='実行';
  wrap.append(input,button);controls.appendChild(wrap);
  const dev=document.createElement('button');dev.type='button';dev.textContent='DevTools（F12）';dev.title='Developer Tools を開く／閉じる';dev.onclick=()=>{try{window.IPC?.send?.('qp-local-devtools-toggle')}catch(err){console.warn('[QP DevTools]',err)}};wrap.appendChild(dev);
  wrap.addEventListener('submit',event=>{event.preventDefault();event.stopPropagation();command(input.value);input.value=''});
 }
 // If a local build has a room-chat field, intercept before native chat sends.
 const chat=input=>!!input&&/chat|message/i.test([input.id,input.name,input.placeholder,input.getAttribute?.('aria-label')].filter(Boolean).join(' '));
 window.addEventListener('keydown',event=>{
  if(event.key!=='Enter'||event.isComposing)return;
  const target=event.target;
  if(!(target instanceof HTMLInputElement||target instanceof HTMLTextAreaElement)||!chat(target)||!/^\/rotate(?:\s|$)/i.test(target.value))return;
  event.preventDefault();event.stopImmediatePropagation();command(target.value);target.value='';
 },true);
 window.addEventListener('pagehide',()=>reset(true));
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installInputs,{once:true});
 else installInputs();
 const observer=new MutationObserver(()=>{if(document.getElementById('local-panel')&&!document.getElementById('qp-rotate-command-field'))installInputs()});
 observer.observe(document.documentElement,{childList:true,subtree:true});
 window.LocalRotateCommand={command,reset,status:()=>({mode:running.mode,angle:running.mode==='fixed'?running.target:running.from,speed:running.speed,period:running.period,holder:!!running.holder})};
})();

(() => {
 const requiresAttack=new Set(['cancel','receive','received','ljgarbage','szgarbage','garbage','garbageclear','tank']);
 // Default sample missions are provided by the separate editor, not re-added to a saved JSON list.
 const definitions=[];
 const customDefinitions=()=>window.LocalMissionLibrary?.read?.().missions||[];
 // `display_hold`, `display_next` and `nextcount` are structural renderer
 // options: changing their value alone does not remove the old PIXI queue.
 // Rebuilding the holder is the same path the original client uses after a
 // SetOptions update, and preserves the current game state/board.
 const visualOptionKeys=new Set(['display_hold','display_next','nextcount','display_shadow']);
 function refreshHUD(engine,values){
  if(!Object.keys(values).some(key=>visualOptionKeys.has(key)))return;
  try{engine.hm?.CreateHolder?.();engine.hm.H.stackdirty=true;engine.hm.H.fallingdirty=true}
  catch(error){window.LocalUIHealth?.fail?.('リバイブMOD表示の更新',error)}
 }
  // The native deck controls the *maximum number* of slots, not the custom
  // mission ranks. A custom-only pool never silently falls back to officials.
  // Schema-8 compatibility: a saved rank is an explicit rank unless the
  // author chose rankMode:auto; a missing rank always means automatic.
  const rankKeys=new Set(['F','E','D','C','B','A']);
  const hasMissionMod=task=>Array.isArray(task?.mods)&&task.mods.length>0||!!task?.mod;
  const autoRank=task=>task?.rankMode==='auto'||task?.rank==null||task?.rank===''||task?.rank==='auto';
  const effectiveRank=(task,nativeRank)=>{
   if(hasMissionMod(task))return 'A';
   if(autoRank(task))return rankKeys.has(nativeRank)?nativeRank:'E';
   return rankKeys.has(task.rank)?task.rank:'E';
  };
  function selectLocalRevivePrompts(nativeRows, customTasks, testIds, source, shuffle, toRow){
   if(!nativeRows.length)return [];
   const pool=[...customTasks];shuffle(pool);
   const fixed=Array.isArray(testIds)?testIds:[];
   const flags=nativeRows.map((_,i)=>source==='custom'||(source==='both'&&i%2===0));
   if(source==='both')shuffle(flags);
   const used=new Set(),selected=[];
   for(let i=0;i<nativeRows.length;i++){
    const native=nativeRows[i],forced=String(fixed[i]||'');
    const specified=forced?pool.find(task=>task.id===forced&&!used.has(task.id)):null;
    // A fixed ID never turns into an unrelated mission. In custom-only mode
    // ineligible / missing IDs leave that slot empty, not native-filled.
    if(forced){
     if(specified){used.add(specified.id);selected.push(toRow(specified,effectiveRank(specified,native[0])))}
     else if(source!=='custom')selected.push(native);
     continue;
    }
    if(source==='standard'||!flags[i]){selected.push(native);continue}
    // Prefer the current official difficulty when options exist. If a custom
    // pool contains only rank-A missions, they remain selectable at any stage.
    const unused=pool.filter(task=>!used.has(task.id));
    const matched=unused.find(task=>effectiveRank(task,native[0])===native[0]);
    const task=matched||unused[0];
    if(task){used.add(task.id);selected.push(toRow(task,effectiveRank(task,native[0])))}
    else if(source==='both')selected.push(native);
   }
   return selected;
  }
  window.LocalReviveDeckPolicy={select:selectLocalRevivePrompts,effectiveRank};
 function attach(game,config={}){
  if(!game.options.zenith_duo)return()=>{};
  const engine=game.source.self,manager=engine.zthm;
  if(manager._localMissionCleanup)return manager._localMissionCleanup;
  config={source:'standard',attackEnabled:false,includeAttackRequired:false,allowControlPenalties:false,...config};
  game._localMissionConfig={...config};
  const originals={GetPromptsList:manager.GetPromptsList,IncrementPrompt:manager.IncrementPrompt,NixPrompt:manager.NixPrompt,CheckPromptCompletion:manager.CheckPromptCompletion};
  const originalHold=engine.fm?.Hold;
  const announced=new WeakSet();
  let current=null,snapshot=null,started=0,lastSecond=0,lastLines=0,reviveCount=0,timerArmed=false,stopRotation=null,holdUsed=false,trackedPiece='',trackedFalling=null,heightWasSatisfied=null,heightCounted=false;
  let damnationInitialized=false,damnationLastCheck=-999,damnationSerial=0;
  let hudMasks={hold:null,next:[]};
  // Read and normalize custom mission JSON at most once per game session.
  // The previous code parsed localStorage and rebuilt all missions on every frame.
  let missionCache=null;
  // Mission JSON is authoritative: do not silently append built-in templates.
  // Standard missions are already collected by the native Zenith prompt engine.
  const missionList=()=>missionCache||(missionCache=customDefinitions());
  const invalidateMissions=()=>{missionCache=null};
  window.addEventListener('local-custom-missions',invalidateMissions);
  function showStatus(){/* Native QP mission/chain UI already reports the result. */}
  function clearMasks(){if(hudMasks.hold&&!hudMasks.hold._destroyed)hudMasks.hold.visible=true;for(const item of hudMasks.next)if(item&&!item._destroyed)item.visible=true;hudMasks={hold:null,next:[]}}
  function maskPreviews(){const vis=current?.effects?.visibility;const H=engine.hm?.H;if(!vis||!H)return;
   if(H.holdobj){if(hudMasks.hold&&hudMasks.hold!==H.holdobj&&!hudMasks.hold._destroyed)hudMasks.hold.visible=true;hudMasks.hold=H.holdobj;H.holdobj.visible=vis.holdContent!==false}
   const arr=Array.isArray(H.nextobj)?H.nextobj:[];if(arr!==hudMasks.next){for(const item of hudMasks.next)if(item&&!item._destroyed)item.visible=true;hudMasks.next=arr}
   for(let i=0;i<arr.length;i++)if(arr[i])arr[i].visible=!(vis.nextHidden||[]).includes(i+1);
  }
  if(originalHold&&engine.fm)engine.fm.Hold=function(...args){
   if(current?.effects?.holdEnabled===false)return;
   if(!current)return originalHold.apply(this,args);
   // Native Hold checks display_hold. Temporarily expose it only to game logic.
   const a=game.options.display_hold,b=engine.gsm.setoptions.display_hold;
   const before=game.state.hold,locked=game.state.holdlocked;
   game.options.display_hold=true;engine.gsm.setoptions.display_hold=true;
   try{const value=originalHold.apply(this,args);
    if(game.state.hold!==before||(!locked&&game.state.holdlocked))holdUsed=true;
    return value;
   }finally{game.options.display_hold=a;engine.gsm.setoptions.display_hold=b}
  };
  const shapeHeight=piece=>{
   // Native GetPieceDefinition() supplies actual orientation, kicks and minos.
   // Never infer the collision box from a sprite or video pixels.
   if(!piece||!Number.isFinite(Number(piece.y)))return null;
   const definition=engine.fm?.GetPieceDefinition?.(piece.type,piece.r,true);
   if(!definition||!Array.isArray(definition.data)||!definition.data.length)return null;
   const dy=Number(definition.dy);if(!Number.isFinite(dy))return null;
   const y=Math.ceil(Number(piece.y));
   const cells=definition.data.map(pair=>y+Number(pair[1])-dy);
   if(cells.some(y=>!Number.isFinite(y)))return null;
   // The internal board includes hidden buffer rows. `boardheight` is only
   // the visible height and cannot be used as the floor's row index.
   const boardHeight=game.state?.board?.length;
   if(!Number.isInteger(boardHeight)||boardHeight<1||boardHeight>100)return null;
   const lowest=Math.max(...cells);
   if(lowest<0||lowest>=boardHeight)return null;
   return boardHeight-1-lowest; // 0 == actual bottom collision row
  };
  const heightMatches=(piece,rules)=>{
   const height=rules?.height;if(!height?.enabled)return true;
   const bottom=shapeHeight(piece);
   if(bottom===null)return false; // Unknown geometry must never be treated as a success.
   return height.compare==='atLeast'?bottom>=Number(height.rows):bottom<=Number(height.rows);
  };
  const filteredPlacement=task=>{const r=task?.rules;return task?.event==='pieces'&&r&&
   ((r.pieces?.length||0)>0||!!r.piece||(r.facings?.length||0)>0||(r.facing!==''&&r.facing!=null)||r.holdRequired||r.columnMin>1||r.columnMax<10||r.height?.enabled)};
  const pieceMatches=(piece,r)=>{
   const shapes=Array.isArray(r.pieces)&&r.pieces.length?r.pieces:(r.piece?[r.piece]:[]);
   const facings=Array.isArray(r.facings)&&r.facings.length?r.facings:(r.facing!==''&&r.facing!=null?[Number(r.facing)]:[]);
   const shape=String(piece?.type||'').toUpperCase(),rotation=Number(piece?.r);
   const facing=((rotation%4)+4)%4*90;
   const placedX=Number(piece?.x);
   return (!shapes.length||shapes.includes(shape))&&(!facings.length||facings.includes(facing))&&
    (!r.holdRequired||holdUsed)&&Number.isFinite(placedX)&&
    placedX>=Number(r.columnMin??1)-1&&placedX<=Number(r.columnMax??10)-1&&heightMatches(piece,r);
  };
  function lockPlacement(piece){
   const task=current;
   if(!filteredPlacement(task)){holdUsed=false;return}
   // The lock event contains the actual placed piece, not the NEXT piece.
   const r=task.rules||{},prompt=(game.state.zenith?.reviveprompts||[]).find(p=>p.id===task.id);
   const valid=prompt&&!prompt.complete&&!prompt.locked&&!prompt.stunned&&pieceMatches(piece,r);
   holdUsed=false;
   if(valid){originals.IncrementPrompt.call(manager,task.id,1);maybeAnnounce(prompt,task)}
  }
  function checkActiveHeight(prompt,task){
   if(task.event!=='pieceheight'||prompt?.complete||prompt?.locked||prompt?.stunned)return;
   // Only the currently controllable mino is eligible. Never look at
   // locked stack cells or the post-lock render/ghost to award Touch Grass.
   const falling=game.state?.falling;
   if(!falling||!Number.isFinite(Number(falling.y))){trackedFalling=null;return}
   const pieceToken=String(game.state?.stats?.piecesplaced??0)+':'+String(falling.type||'');
   if(pieceToken!==trackedPiece||(trackedFalling&&trackedFalling!==falling)){
    trackedPiece=pieceToken;heightWasSatisfied=null;heightCounted=false;
   }
   trackedFalling=falling;
   const r=task.rules||{};
   // Other matching conditions can be used for the active piece as well.
   const eligible=pieceMatches(falling,{...r,holdRequired:false,height:{...r.height,enabled:false}});
   const satisfied=eligible&&heightMatches(falling,{...r,height:{...r.height,enabled:true}});
   // True floor contact may be awarded on its first observed active frame;
   // the absolute row check now uses the FULL board length. Other height
   // targets still require crossing when requested.
   const floorContact=r.height?.compare!=='atLeast'&&Number(r.height?.rows)===0&&shapeHeight(falling)===0;
   if(heightWasSatisfied===null){
    heightWasSatisfied=satisfied;
    if(r.height?.requireCrossing!==false&&!floorContact)return;
   }
   const crossed=satisfied&&!heightWasSatisfied;
   heightWasSatisfied=satisfied;
   if(!heightCounted&&satisfied&&(crossed||r.height?.requireCrossing===false||floorContact)){
    heightCounted=true;
    originals.IncrementPrompt.call(manager,task.id,1);maybeAnnounce(prompt,task);
   }
  }
  game.on('lock','local-mission-conditioned-lock',lockPlacement);
  function restore(){
   if(stopRotation){stopRotation();stopRotation=null;}
   clearMasks();window.LocalVisibilityEffects?.restore?.(game);
   if(snapshot){for(const [object,values]of snapshot)for(const [key,value]of Object.entries(values)){if(value.present)object[key]=value.value;else delete object[key]}}
   const restoreVisual=snapshot?.visual||{};
   snapshot=null;current=null;damnationInitialized=false;delete game._localMissionEffects;delete engine._localSuppressRotationSound;refreshHUD(engine,restoreVisual);engine.hm.H.stackdirty=true;engine.hm.H.fallingdirty=true;
  }
  const damnationIsActive=()=>current&&current.applyModRules!==false&&
    (current.mods||[current.mod]).includes('doublehole_reversed')&&!engine.iom?.IsReplay?.();
  const garbageCount=()=>{const value=Number(engine.bm?.CountGarbageLinesNoPerma?.());return Number.isFinite(value)?Math.max(0,Math.floor(value)):null};
  function injectDamnationRows(from,count){
   const bm=engine.bm;if(typeof bm?.PushLine!=='function')return false;
   for(let n=0;n<count;n++){
    const row=from+n;
    const holes=Array.from({length:engine.W},(_,col)=>col).filter(col=>(col+row)%2===0);
    bm.PushLine({column:holes});
   }
   if(count){bm.ClearIsLegalAtPosMemo?.();if(engine.hm?.H){engine.hm.H.stackdirty=true;engine.hm.H.fallingdirty=true}}
   return true;
  }
  function seedDamnationInitialRows(){
   if(!damnationIsActive()||damnationInitialized)return;
   const have=garbageCount();if(have===null){window.LocalUIHealth?.fail?.('Damnation初期5段','ゴミ段数を取得できません');return}
   // Native startup rows count toward five. Do not add another five.
   if(!injectDamnationRows(have,Math.max(0,5-have)))return;
   damnationInitialized=true;damnationLastCheck=Number(game.getFrame()||0);
  }
  function refillDamnationBelowFive(){
   if(!damnationInitialized||!damnationIsActive())return;
   const frame=Number(game.getFrame()||0);
   if(frame-damnationLastCheck<8)return; // no per-frame PushLine or spamming
   damnationLastCheck=frame;
   const have=garbageCount();if(have===null||have>=5)return;
   injectDamnationRows(have,5-have); // refill on count dropping, not initial seeding
   damnationSerial++;
  }
  function activate(task){
   restore();current=task;holdUsed=false;trackedPiece='';trackedFalling=null;heightWasSatisfied=null;heightCounted=false;started=game.getFrame();lastSecond=0;timerArmed=!task.timeout||task.event==='survive'||task.timerStart==='immediate'||(task.event!=='lines'&&task.timerStart!=='first-clear');
   // Some QP line-clears do not emit zthm's generic "lines" event (notably
   // the Loaded Dice revive window).  Keep the authoritative line total as a
   // fallback so a visible clear always advances a line-based mission.
   lastLines=Number(game.state?.stats?.lines||0);game._localCustomMissionUsed=true;
   const mods=[...(game.options.zenith_mods||[])];
   const ruleMods=task.applyModRules===false?[]:(task.mods||[task.mod]).filter(Boolean);
   // An already-active MOD does not cancel a JSON penalty. Same-base reverse
   // variants cannot run simultaneously, so keep the initial run's variant.
   for(const mod of ruleMods){
    const base=mod.replace(/_reversed$/,'');
    if(!mods.includes(mod)&&!mods.some(m=>m.replace(/_reversed$/,'')===base))mods.push(mod);
   }
   const selection={};for(const mod of mods){const name=mod.replace(/_reversed$/,'');if(LocalQPOptions.names.includes(name))selection[name]=mod.endsWith('_reversed')?'reverse':'normal'}
   const values={...LocalQPOptions.build(selection).options,zenith_mods:mods};
   const v=task.effects?.visibility||{};
   if(v.hold!==undefined)values.display_hold=v.hold!==false;
   if(v.next!==undefined||v.nextCount!==undefined)values.display_next=v.next!==false&&v.nextCount!==0;
   if(v.nextCount!==undefined)values.nextcount=Math.max(1,Math.min(6,v.nextCount));
   // Height belongs to the active run; temporary missions never resize its board.
   delete values.boardheight;
   const altitude=Number(game.state.stats.zenith?.altitude||0);
   const distances=[0,50,150,300,450,650,850,1100,1350,1650,Infinity];
   const floor=Math.max(1,Math.min(10,distances.findIndex((limit,index)=>index>0&&altitude<limit)||10));
   if(ruleMods.includes('gravity')){
    const bumps=[0,.48,.3,.3,.3,.3,.3,.3,.3,.3,.3];
    values.locktime=[0,30,29,28,27,26,24,22,20,18,16][floor];
    values.__runtimeGravity=Math.max(engine.gsm.g,.02+bumps.slice(1,floor+1).reduce((sum,value)=>sum+value,0));
   }
   if(ruleMods.includes('gravity_reversed')){
    values.locktime=[0,24,22,20,18,16,15,14,13,12,11][floor];
    values.__runtimeGravity=20;
   }
   const runtimeGravity=values.__runtimeGravity;delete values.__runtimeGravity;
   const objects=[...new Set([game.options,engine.gsm.setoptions])];
   snapshot=objects.map(object=>[object,Object.fromEntries(Object.keys(values).map(key=>[key,{present:Object.hasOwn(object,key),value:object[key]}]))]);
   snapshot.visual=Object.fromEntries(Object.keys(values).filter(key=>visualOptionKeys.has(key)).map(key=>[key,true]));
   for(const object of objects)Object.assign(object,values);
   if(runtimeGravity!==undefined){snapshot.push([engine.gsm,{g:{present:Object.hasOwn(engine.gsm,'g'),value:engine.gsm.g}}]);engine.gsm.g=runtimeGravity}
   game._localMissionEffects=task.effects||{};
   // A board-rotation revive mission targets the incapacitated DUO partner.
   // Input-reversal penalties remain attached to the locally controlled game.
   const boardRotationRequested=task.effects?.boardRotation?.enabled===true;
   const controlsRequested=task.effects?.controls?.reverseHorizontal===true||task.effects?.controls?.reverseRotation===true;
   const partner=game.source?.self?.zthm?.duoOtherSideGame||null;
   const cleanupRotation=[];
   if(boardRotationRequested){
    const target=partner||game;
    const cleanup=window.LocalBoardRotationEffects?.activate?.([target],task.effects.boardRotation||{},{});
    if(cleanup)cleanupRotation.push(cleanup);
    window.__localReviveRotationTarget=target;
   }
   if(config.allowControlPenalties&&controlsRequested){
    const cleanup=window.LocalBoardRotationEffects?.activate?.([game],{enabled:false},task.effects.controls||{});
    if(cleanup)cleanupRotation.push(cleanup);
   }
   if(cleanupRotation.length)stopRotation=()=>{for(const cleanup of cleanupRotation)cleanup();delete window.__localReviveRotationTarget};
   // INITIALIZATION is NOT the same process as Damnation's ongoing
   // minimum-five garbage replenishment. Initial state may already contain
   // five native rows. Seed any missing initial rows ONCE here, before the
   // periodic below-five rule is allowed to run.
   damnationInitialized=false;damnationLastCheck=-999;damnationSerial=0;
   if(ruleMods.includes('doublehole_reversed')&&!engine.iom?.IsReplay?.()){
    seedDamnationInitialRows();
   }
   window.LocalVisibilityEffects?.activate?.(game,task.effects?.visibility);
   // The engine's spin judgement remains untouched.  Audio adapters can
   // consult this flag, so a JSON mission may silence only the rotation cue.
   engine._localSuppressRotationSound=task.effects?.sound?.rotation===false;
   // Asceticism (and any JSON mission which applies nohold_reversed) uses
   // the real in-game presentation: HOLD disappears and only one NEXT is
   // allocated.  Restoring the mission rebuilds the previous holder.
   refreshHUD(engine,values);maskPreviews();
  }
  const canUse=row=>{
   if(row[5]?.some(mod=>game.options.zenith_mods.includes(mod)||game.options.zenith_mods.includes(mod+'_reversed')))return false;
   return LocalRevivePolicy.eligible({source:'standard',requiresAttack:requiresAttack.has(row[1])},{...config,source:'both'});
  };
  const floor=()=>{const level=Number(game.state?.stats?.zenith?.floor);return Number.isInteger(level)?Math.max(1,Math.min(10,level)):1};
  const missionAllowed=task=>{
   if(!LocalRevivePolicy.eligible(task,config))return false;
   const when=task.when||{},active=game.options.zenith_mods||[];
   const revives=Number(game.state?.stats?.zenith?.revivesTotal??reviveCount);
   if(floor()<(when.floorMin??1)||floor()>(when.floorMax??10)||revives<(when.reviveMin??0)||revives>(when.reviveMax??99))return false;
   if((when.modsAll||[]).some(mod=>!active.includes(mod))||(when.modsNone||[]).some(mod=>active.includes(mod)))return false;
   // Even when all MODs are already active, the revive prompt and its
   // independent penalty events remain eligible. Any conflicting temporary
   // modifier is skipped in activate(), never the mission itself.
   return true;
  };
  manager.GetPromptsList=function(){
   restore();invalidateMissions();
   // Ask the actual native engine for the current floor/revive-level deck.
   // Its output is the authority for the *number* and *rank* of prompts.
   const native=originals.GetPromptsList.call(this);
   const standard=native.filter(canUse);
   const library=window.LocalMissionLibrary?.read?.()||{};
   const fixed=Array.isArray(library.testSequence)?library.testSequence:[];
   if(config.source==='standard'&&!fixed.some(Boolean))return standard;
   const candidates=missionList().filter(missionAllowed);
   const toRow=(task,rank)=>{
    const official=manager.self?.cm?.constants?.zenithRevivePrompts?.find(row=>row[1]===task.event);
    const objective=task.event==='survive'?'Survive '+task.target+' seconds':task.event==='spin'?'Perform '+task.target+' Spins':task.event==='lines'?'Clear '+task.target+' Lines':task.event==='attack'?'Send '+task.target+' Attack':task.event==='pieces'?'Place '+task.target+' Pieces':(official?.[3]||task.event);
    const name=typeof task.name==='string'&&task.name.trim()?task.name.trim():objective;
    const timed=task.timeout>0&&task.event!=='survive'&&!/\bwithin\s+\d+\s*(?:s|sec|seconds?)\b/i.test(name);
    return [rank,task.id,task.target,`${name}${timed?' · Within '+task.timeout+'s':''}`,official?.[4]??(task.event==='survive'?4:2),[]];
   };
   // Native slot count is the cap; custom-only uses only matching custom IDs.
   // Rankless missions inherit the slot rank and MOD missions are always A.
   return selectLocalRevivePrompts(standard,candidates,fixed,config.source,
    array=>this.S.rngex.shuffleArray(array),toRow);
  };
  function sync(){
   const prompt=game.state.zenith?.allyincapacitated?(game.state.zenith.reviveprompts||[]).find(task=>!task.complete&&!task.locked&&!task.stunned):null;
   // Native prompt ids do not require a custom mission lookup.
   if(!prompt||(!prompt.id?.startsWith('custom_')&&!prompt.id?.startsWith('local_mod_'))){if(current)restore();return prompt}
   if(prompt.id===current?.id)return prompt;
   const task=missionList().find(task=>task.id===prompt.id);
   if(task?.id!==current?.id){if(task)activate(task);else if(current)restore()}
   return prompt;
  }
  function maybeAnnounce(prompt,task){if(!prompt?.complete||announced.has(prompt))return;announced.add(prompt);reviveCount++;const all=(game.state.zenith?.reviveprompts||[]).every(p=>p.complete);showStatus((all?'復活ミッション全達成！':'ミッション達成！')+'\n'+task.name)}
  manager.IncrementPrompt=function(id,amount=1){
   sync();const task=current,entry=task&&(game.state.zenith?.reviveprompts||[]).find(p=>p.id===task.id);
   const result=originals.IncrementPrompt.call(this,id,amount);
   // Native mission IDs (including spin/garbage/consecutive challenges)
   // are emitted by the original engine; forward only matching events.
   if(task&&task===current&&id===task.event&&task.event!=='lines'&&id!==task.id&&!filteredPlacement(task))originals.IncrementPrompt.call(this,task.id,amount);
   if(task&&entry)maybeAnnounce(entry,task);
   return result;
  };
  manager.NixPrompt=function(id,...args){
   const task=current;const result=originals.NixPrompt.call(this,id,...args);
   if(task&&task===current&&id!==task.id){
    const failEvents=Array.isArray(task.penaltyEvents)?task.penaltyEvents:[task.event];
    // Forward only a penalty received from the native event engine.
    if(failEvents.includes(id))originals.NixPrompt.call(this,task.id,...args);
   }
   return result;
  };
  manager.CheckPromptCompletion=function(){const task=current,entry=task&&(game.state.zenith?.reviveprompts||[]).find(p=>p.id===task.id);const result=originals.CheckPromptCompletion.call(this);if(task&&entry)maybeAnnounce(entry,task);sync();return result};
  // A failed local timer should restart this prompt, never lock all prompts.
  // Keep the native prompt object/ID so native duo UI can continue reporting progress.
  function retryPrompt(prompt,task){
   if(!prompt||current!==task||prompt.complete)return;
   prompt.count=0;
   prompt.complete=false;
   prompt.locked=false;
   prompt.stunned=false;
   delete prompt.expired;
   // Reset native counters used by bucket/spin challenges.
   if(game.state.zenith){game.state.zenith.quadbuckets=[];game.state.zenith.spinbuckets=[];game.state.zenith.promptstarttime=game.getFrame();}
   // Restore temporary modifiers and start a fresh timed attempt.
   // Successful prompts in the same revive sequence remain completed.
   restore();activate(task);
   try{
    manager.self.c?.OnClient?.(()=>{
     manager.duoOtherSideGame?.duoSetPromptProgress?.(prompt.id);
     const ui=manager.self.hm?.H?.board?.el?.('zenithpromptsself');
     ui?.update?.(game.state.zenith.reviveprompts);
     ui?.action?.('nix',prompt.id);
    });
   }catch(error){window.LocalUIHealth?.fail?.('復活ミッション進捗リセット',error)}
   showStatus('制限時間切れ・最初から再挑戦\n'+task.name,true);
  }
  const tick=()=>{
   
   const prompt=sync(),task=current;
   if(!task||!game.isPlaying())return;
   maskPreviews();window.LocalVisibilityEffects?.tick?.(game);
   refillDamnationBelowFive();
   if(task.event==='pieceheight')checkActiveHeight(prompt,task);
   if(task.event==='lines'){
    const total=Number(game.state?.stats?.lines||0),delta=Math.max(0,total-lastLines);lastLines=total;
    if(delta){
     if(!timerArmed&&task.timeout){timerArmed=true;started=game.getFrame();lastSecond=0}
     const entry=(game.state.zenith?.reviveprompts||[]).find(p=>p.id===task.id);
     originals.IncrementPrompt.call(manager,task.id,delta);
     if(entry)maybeAnnounce(entry,task);
    }
   }else if(!timerArmed&&task.timeout&&task.timerStart==='first-clear'){
    const total=Number(game.state?.stats?.lines||0);
    if(total>lastLines){timerArmed=true;started=game.getFrame();lastSecond=0}
    lastLines=total;
   }
   if(current!==task)return; // Native completion may have cleared the current task.
   const elapsed=timerArmed?Math.floor((game.getFrame()-started)/60):0;
   // Survival milestones must be applied *before* expiration (10s/10s is a success).
   if(task.event==='survive'&&!game.state.zenith.incapacitated&&elapsed>lastSecond){
    const delta=elapsed-lastSecond;lastSecond=elapsed;
    const entry=(game.state.zenith?.reviveprompts||[]).find(p=>p.id===task.id);
    originals.IncrementPrompt.call(manager,task.id,delta);
    if(entry)maybeAnnounce(entry,task);
   }
   if(current!==task||prompt?.complete)return;
   
   if(task.timeout&&timerArmed&&elapsed>=task.timeout){retryPrompt(prompt,task);return;}
  };
  game.on('frame','local-missions',tick);
  function cleanup(){restore();if(originalHold&&engine.fm)engine.fm.Hold=originalHold;window.removeEventListener('local-custom-missions',invalidateMissions);for(const [name,method]of Object.entries(originals))manager[name]=method;game.remove('frame','local-missions');game.remove('lock','local-mission-conditioned-lock');game.remove('end','local-mission-stop');delete manager._localMissionCleanup}
  game.on('end','local-mission-stop',cleanup);manager._localMissionCleanup=cleanup;return cleanup;
 }
 window.LocalReviveMissions={attach,definitions,requiresAttack};
})();

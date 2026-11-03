/* Device-local custom revive mission library. JSON is portable and never sent
   to a server, so players can share a mission pack without sharing records. */
(() => {
 const KEY='qp-local-custom-missions-v1', BASE=['pieces','pieceheight','lines','spin','attack','survive'],MOD=/^(nohold|messy|gravity|volatile|doublehole|invisible|allspin|expert)(?:_reversed)?$/;
 // Official event IDs are evaluated by the native Zenith mission engine.
 const EVENTS=[...new Set([...BASE,'combo','double','quad','osingle','odouble','szdouble','ljtriple','iholdlines','hold','rotate','singleconsecutive','tspinsingle','tspindouble','szspin','ljspin','iflat','placeoconsecutive','norotateclockwise','singlenocombo','spam','noclear','ispinclear','upperhalfquad','quadcombo','szsingle','combonohold','noclearspin','szljspin','tspintriple','triple','b2b','quadbuckets','holdconsecutive','softdrop','top3rows','linesnoti','szspintriple','odoubleconsecutive','tspinminiclear','doublespiece','ljgarbage','szgarbage','columnopiece','spinclear','iclearspam','holddas','oclear','spinbuckets','quadconsecutive','singlesonly','nogarbage','nocancel','tspindoubleup','ljspintriple','nohold','oclearspam','tnorotate','tspincombo','ispindouble','szspinconsecutive','ljspinconsecutive','colorclear','combospin','tspindtcolumn','send'])];
 // These are the missions discussed for the local QP patch.  They are an
 // editable starter pack, not hidden game rules: exporting JSON exposes every
 // value and users may edit, remove, or add entries afterwards.
 const starterMissions=()=>[
  {id:'nohold-place-8',name:'No Hold: 8 PIECES',event:'pieces',target:8,rank:'E',mods:['nohold']},
  {id:'messy-survive-10',name:'Messier Garbage: SURVIVE 10s',event:'survive',target:10,timeout:10,rank:'E',mods:['messy']},
  {id:'gravity-place-6',name:'Gravity: PLACE 6 PIECES',event:'pieces',target:6,rank:'D',mods:['gravity']},
  {id:'volatile-survive-10',name:'Volatile Garbage: SURVIVE 10s',event:'survive',target:10,timeout:10,rank:'D',mods:['volatile']},
  {id:'doublehole-clear-4',name:'Double Hole: CLEAR 4 LINES',event:'lines',target:4,rank:'D',mods:['doublehole']},
  {id:'invisible-place-6',name:'Invisible: PLACE 6 PIECES',event:'pieces',target:6,rank:'C',mods:['invisible']},
  {id:'allspin-spin-2',name:'All-Spin: PERFORM 2 SPINS',event:'spin',target:2,rank:'C',mods:['allspin']},
  {id:'expert-survive-10',name:'Expert: SURVIVE 10s',event:'survive',target:10,timeout:10,rank:'D',mods:['expert']},
  {id:'asceticism-place-6',name:'Asceticism: PLACE 6 PIECES',event:'pieces',target:6,rank:'B',mods:['nohold_reversed'],effects:{visibility:{hold:false,next:true,nextCount:1}}},
  {id:'loaded-dice-clear-4',name:'Loaded Dice: CLEAR 4 LINES',event:'lines',target:4,timeout:10,rank:'B',mods:['messy_reversed']},
  {id:'freefall-place-6',name:'Freefall: PLACE 6 PIECES',event:'pieces',target:6,rank:'B',mods:['gravity_reversed']},
  {id:'damnation-attack-4',name:'Damnation: SEND 4 ATTACK',event:'attack',target:4,rank:'B',requiresAttack:true,mods:['doublehole_reversed']},
  {id:'exile-place-6',name:'The Exile: PLACE 6 PIECES',event:'pieces',target:6,rank:'A',mods:['invisible_reversed'],effects:{visibility:{hold:false,next:true,nextCount:1}}},
  {id:'warlock-spin-2',name:'Warlock: PERFORM 2 SPINS',event:'spin',target:2,rank:'A',mods:['allspin_reversed']},
  {id:'tyrant-survive-10',name:'The Tyrant: SURVIVE 10s',event:'survive',target:10,timeout:10,rank:'A',mods:['expert_reversed']}
 ];
 const empty=()=>({schema:8,starterInstalled:false,testSequence:['','',''],missions:[]});
 const number=(value,min,max,label)=>{const n=Number(value);if(!Number.isInteger(n)||n<min||n>max)throw Error(label+'が不正です');return n};
 const mods=value=>{if(value===undefined)return [];if(!Array.isArray(value)||value.length>8)throw Error('MOD複合が不正です');const result=[...new Set(value.map(String))];if(result.some(mod=>!MOD.test(mod)))throw Error('MOD名が不正です');const bases=result.map(mod=>mod.replace('_reversed',''));if(new Set(bases).size!==bases.length)throw Error('同じMODの表・裏は同時に指定できません');return result};
 const clean=row=>{
  if(!row||typeof row!=='object'||Array.isArray(row))throw Error('ミッションが不正です');
  const rawId=String(row.id||crypto.randomUUID()).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,52);
  const event=String(row.event||'pieces');
  const generatedName=({survive:`Survive ${row.target} seconds`,pieces:`Place ${row.target} Pieces`,pieceheight:`Reach Piece Height ${row.target}`,lines:`Clear ${row.target} Lines`,spin:`Perform ${row.target} Spins`,attack:`Send ${row.target} Attack`})[event]||`Complete ${event}`;
  const name=String(row.name||generatedName).trim().slice(0,48);
  const target=number(row.target,1,999,'target'),timeout=number(row.timeout||0,0,600,'timeout'),missionMods=mods(row.mods??(row.mod?[row.mod]:[]));
  const timerStart=row.event==='survive'?'immediate':(row.timerStart??(row.event==='lines'?'first-clear':'immediate'));
  if(!['immediate','first-clear'].includes(timerStart))throw Error('計測開始条件が不正です');
  if(!rawId||!name||!EVENTS.includes(event))throw Error('ミッションの項目が不正です');
  const when=row.when&&typeof row.when==='object'&&!Array.isArray(row.when)?row.when:{};
  const conditions={floorMin:number(when.floorMin??1,1,10,'floorMin'),floorMax:number(when.floorMax??10,1,10,'floorMax'),reviveMin:number(when.reviveMin??0,0,99,'reviveMin'),reviveMax:number(when.reviveMax??99,0,99,'reviveMax'),modsAll:mods(when.modsAll),modsNone:mods(when.modsNone)};
  if(conditions.floorMin>conditions.floorMax||conditions.reviveMin>conditions.reviveMax)throw Error('条件の範囲が逆です');
  const effects=row.effects&&typeof row.effects==='object'&&!Array.isArray(row.effects)?row.effects:{};
  const vis=effects.visibility||{};
  const nextHidden=[...new Set(Array.isArray(vis.nextHidden)?vis.nextHidden.map(Number):[])];
  if(nextHidden.some(n=>!Number.isInteger(n)||n<1||n>6))throw Error('非表示NEXT番号は1～6です');
  const defaultSlot=()=>({mode:'normal',visiblePercent:100,period:5});
  const slots=Array.isArray(vis.nextSlots)?vis.nextSlots:[];
  if(slots.length>6)throw Error('NEXT個別設定は6枠までです');
  const nextWhenSpawnSlots=[...new Set(Array.isArray(vis.nextWhenSpawnSlots)?vis.nextWhenSpawnSlots.map(Number):[])];
  if(nextWhenSpawnSlots.some(n=>!Number.isInteger(n)||n<1||n>5))throw Error('操作中の非表示NEXT位置は1～5です');
  const nextSlots=Array.from({length:6},(_,i)=>{
   const rule=slots[i]||defaultSlot(),mode=String(rule.mode||'normal');
   if(!['normal','hidden','pulse','fade-in','gradient'].includes(mode))throw Error('NEXT'+(i+1)+'番目の表示モードが不正です');
   return {mode,visiblePercent:number(rule.visiblePercent??100,0,100,'NEXT表示率'),period:number(rule.period??5,1,60,'NEXT周期')};
  });
  const visibility={hold:vis.hold!==false,holdContent:vis.holdContent!==false,next:vis.next!==false,nextCount:number(vis.nextCount??5,0,6,'nextCount'),nextHidden:nextHidden.sort((a,b)=>a-b),nextWhenSpawnSlots:nextWhenSpawnSlots.sort((a,b)=>a-b),nextSlots};
  const sound={rotation:effects.sound?.rotation!==false};
  const modes={};
  for(const surface of ['stack','garbage','active','ghost','next','hold']){
   const rule=vis.modes?.[surface]||{};
   const mode=String(rule.mode||'normal');
   if(!['normal','hidden','pulse','fade-in','gradient'].includes(mode))throw Error(surface+'表示方法が不正です');
   modes[surface]={mode,visiblePercent:number(rule.visiblePercent??100,0,100,surface+'の表示率'),period:number(rule.period??5,1,60,surface+'の周期'),afterLock:rule.afterLock===true};
  }
  visibility.modes=modes;visibility.nextWhenSpawnHidden=vis.nextWhenSpawnHidden===true;
  // Imported files cannot enable board rotation or control reversal in this build.
  const boardRotation={enabled:false,mode:'fixed',degrees:0,durationMs:0};
  const controls={reverseHorizontal:false,reverseRotation:false};
  // v4.11-QP add-on: event-driven lock conditions. These are only evaluated
  // for piece-placement missions; other native events retain their judgments.
  const inputRules=row.rules||{};
  if(!inputRules||typeof inputRules!=='object'||Array.isArray(inputRules))throw Error('rulesが不正です');
  const allowedPieces=['I','O','T','S','Z','J','L'];
  const oldPiece=String(inputRules.piece||'').toUpperCase();
  const pieces=[...new Set((Array.isArray(inputRules.pieces)?inputRules.pieces:(oldPiece?[oldPiece]:[])).map(p=>String(p).toUpperCase()))];
  if(pieces.some(p=>!allowedPieces.includes(p)))throw Error('指定ミノが不正です');
  const oldFacing=inputRules.facing===''||inputRules.facing==null?'':Number(inputRules.facing);
  const facings=[...new Set((Array.isArray(inputRules.facings)?inputRules.facings:(oldFacing===''?[]:[oldFacing])).map(Number))];
  if(facings.some(n=>![0,90,180,270].includes(n)))throw Error('向きは0/90/180/270度です');
  const inputHeight=inputRules.height||{};
  if(!inputHeight||typeof inputHeight!=='object'||Array.isArray(inputHeight))throw Error('heightが不正です');
  const height={enabled:inputHeight.enabled===true||event==='pieceheight',
   rows:number(inputHeight.rows??0,0,39,'高さ'),
   compare:['atMost','atLeast'].includes(inputHeight.compare)?inputHeight.compare:'atMost',
   // When monitoring the active mino, require an actual threshold crossing by default.
   requireCrossing:inputHeight.requireCrossing!==false};

  const lineOpts=inputRules.lines||{};
  if(typeof lineOpts!=='object'||Array.isArray(lineOpts))throw Error('ライン指定が不正です');
  const lines={enabled:lineOpts.enabled===true,
   compare:['exact','atLeast','atMost'].includes(lineOpts.compare)?lineOpts.compare:'exact',
   count:number(lineOpts.count??1,0,4,'消去ライン数')};
  const resetOn=Array.isArray(inputRules.resetOn)?[...new Set(inputRules.resetOn.map(String))]:[];
  const possible=['hold','moveLeft','moveRight','rotateCW','rotateCCW','rotate180','softDrop','hardDrop'];
  if(resetOn.some(x=>!possible.includes(x)))throw Error('進捗初期化キーが不正です');
  const rotationInput=['any','only180','onlyCWCCW'].includes(inputRules.rotationInput)?inputRules.rotationInput:'any';
  const softDrop=['any','held','forbid'].includes(inputRules.softDrop)?inputRules.softDrop:'any';
  const horizontal=['any','leftHeld','rightHeld','eitherHeld'].includes(inputRules.horizontal)?inputRules.horizontal:'any';
  const spinType=['any','full','mini','empty'].includes(inputRules.spinType)?inputRules.spinType:'any';
  const resetOnMismatch=inputRules.resetOnMismatch===true;
  const rules={piece:pieces.length===1?pieces[0]:'',pieces,
   facing:facings.length===1?facings[0]:'',facings,
   holdRequired:inputRules.holdRequired===true,
   columnMin:number(inputRules.columnMin??1,1,10,'columnMin'),columnMax:number(inputRules.columnMax??10,1,10,'columnMax'),height,lines,resetOn,rotationInput,softDrop,horizontal,spinType,resetOnMismatch};
  if(rules.columnMin>rules.columnMax)throw Error('列指定の範囲が逆です');
  if(!['pieces','pieceheight','spin','lines'].includes(event)&&(pieces.length||facings.length||rules.holdRequired||rules.columnMin!==1||rules.columnMax!==10||height.enabled||lines.enabled||spinType!=='any'))
    throw Error('詳細なミノ条件は設置・高さ・Spin・ラインミッションで使用します');
  if(event==='pieceheight'&&lines.enabled)throw Error('操作ミノの高さにはライン数を指定できません');
  if(!['spin','lines'].includes(event)&&lines.enabled)throw Error('ライン数はSpin・ライン消去で指定します');
  if(event!=='spin'&&spinType!=='any')throw Error('Spin種類はSpinで指定します');
  if(event==='pieceheight'&&target>100)throw Error('操作ミノの高さミッションの目標回数は1～100です');
  // A mission with MODs always *appears* as A in the deck, while retaining
  // its stored original rank for reversibility. No rank => normal-level auto.
  const savedRank=typeof row.rank==='string'?row.rank.trim().toUpperCase():'';
  const rankMode=row.rankMode==='auto'||!savedRank?'auto':'fixed';
  if(savedRank&&!['A','B','C','D','E','F'].includes(savedRank))throw Error('ランクが不正です');
  const modLabels=mods(row.modLabels??missionMods);
  const applyModRules=row.applyModRules!==false;
  // Native failure event names, not player-written JavaScript. By default,
  // reuse the official penalty for the selected mission event; No Hold also
  // fails on the engine's actual `nohold` failure event.
  const rawPenalty=row.penaltyEvents??[event,...(applyModRules&&missionMods.includes('nohold')?['nohold']:[])];
  if(!Array.isArray(rawPenalty)||rawPenalty.length>24||rawPenalty.some(x=>typeof x!=='string'||!/^[a-z][a-z0-9_]{0,39}$/.test(x)))throw Error('ペナルティイベントIDが不正です');
  const penaltyEvents=[...new Set(rawPenalty)];
  
  return {id:'custom_'+rawId.replace(/^custom_/,'').replace(/^local_mod_/,'').slice(0,45),source:'custom',name,event,target,count:target,timeout,timerStart,mods:missionMods,mod:missionMods[0]||'',modLabels,applyModRules,penaltyEvents,requiresAttack:row.requiresAttack===true,rank:rankMode==='fixed'?savedRank:null,rankMode,rules,when:conditions,effects:{visibility,boardRotation,controls,holdEnabled:typeof effects.holdEnabled==='boolean'?effects.holdEnabled:!(applyModRules&&missionMods.some(m=>m==='nohold'||m==='nohold_reversed')),sound}};
 };
 // Only a mission ID from the imported JSON is allowed for each forced slot.
 const testSequence=(input,missions)=>{
  const ids=new Set(missions.map(row=>row.id));
  const slots=Array.isArray(input)?input:[];
  return [0,1,2].map(i=>typeof slots[i]==='string'&&ids.has(slots[i])?slots[i]:'');
 };
 const read=()=>{try{
  const raw=localStorage.getItem(KEY);
  // First use receives the documented editable starter missions.  A later
  // explicit empty array remains empty, so users can remove every mission.
  if(!raw){const value={schema:8,starterInstalled:true,testSequence:['','',''],missions:starterMissions().map(clean)};localStorage.setItem(KEY,JSON.stringify(value));return value}
  const data=JSON.parse(raw);
  if([1,2,3,4,5,6,7,8].includes(data?.schema)&&Array.isArray(data.missions)){
   // A saved empty array is intentional. Never silently reinstall deleted missions.
   const missions=data.missions.map(clean);return {schema:8,starterInstalled:data.starterInstalled===true,testSequence:testSequence(data.testSequence,missions),missions};
  }
 }catch(error){window.LocalUIHealth?.fail?.('ミッションJSON読み込み',error)}return empty()};
 const write=data=>{const missions=(data?.missions||[]).map(clean);const value={schema:8,starterInstalled:data?.starterInstalled===true,testSequence:testSequence(data?.testSequence,missions),missions};if(value.missions.length>128)throw Error('自作ミッションは128件までです');if(new Set(value.missions.map(m=>m.id)).size!==value.missions.length)throw Error('ミッションIDが重複しています');localStorage.setItem(KEY,JSON.stringify(value));return value};
 const download=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(read(),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='tetrio-local-revive-missions.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 const importFile=async file=>{if(file.size>1024*1024)throw Error('ミッションJSONは1MBまでです');const value=write(JSON.parse(await file.text()));window.dispatchEvent(new Event('local-custom-missions'));return value};
 const open=()=>{
  let dialog=document.getElementById('local-mission-manager');if(dialog){dialog.hidden=false;return}
  dialog=document.createElement('section');dialog.id='local-mission-manager';dialog.setAttribute('role','dialog');dialog.style.cssText='position:fixed;z-index:2147483647;inset:10vh 15vw auto 15vw;max-height:78vh;overflow:auto;padding:1em;background:#1c1720;color:#fff;border:2px solid #b9815b;box-shadow:0 0 0 100vmax #0009;font:15px system-ui';
  const title=document.createElement('h2');title.textContent='自作復活ミッション（端末内JSON）';
  const note=document.createElement('p');note.textContent='独立したミッションエディタ v5.3.html でJSONを作成・保存してから、ここで読み込んでください。イベントには公式復活ミッションIDを指定可能。HOLD表示/使用・NEXT個数/個別非表示・同時MODを扱います。';
  const area=document.createElement('textarea');area.rows=16;area.style.width='100%';area.value=JSON.stringify(read(),null,2);
  const status=document.createElement('p'),save=document.createElement('button'),defaults=document.createElement('button'),out=document.createElement('button'),close=document.createElement('button');save.textContent='保存して反映';defaults.textContent='初期MODミッションを追加';out.textContent='JSONを書き出す';close.textContent='閉じる';
  save.onclick=()=>{try{const value=write(JSON.parse(area.value));area.value=JSON.stringify(value,null,2);status.textContent=`保存しました（${value.missions.length}件）`;window.dispatchEvent(new Event('local-custom-missions'))}catch(error){status.textContent='保存失敗: '+error.message}};
  defaults.onclick=()=>{try{const current=read(),known=new Set(current.missions.map(row=>row.id));const add=starterMissions().map(clean).filter(row=>!known.has(row.id));const value=write({...current,starterInstalled:true,missions:[...current.missions,...add]});area.value=JSON.stringify(value,null,2);status.textContent=`初期ミッションを${add.length}件追加しました`;window.dispatchEvent(new Event('local-custom-missions'))}catch(error){status.textContent='追加失敗: '+error.message}};
  out.onclick=download;close.onclick=()=>dialog.hidden=true;
  dialog.append(title,note,area,status,save,defaults,out,close);document.body.appendChild(dialog);
 };
 window.LocalMissionLibrary={read,write,download,importFile,open,clean};
 window.dispatchEvent(new Event('local-mission-library-ready'));
})();

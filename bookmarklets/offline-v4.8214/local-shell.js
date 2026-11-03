(() => {
 const offlineStyle=document.createElement('style');
 offlineStyle.textContent=`
 body.qp-local-mode .ceriad,body.qp-local-mode [data-cid]{display:none!important;min-height:0!important;height:0!important;margin:0!important;padding:0!important}
 body.qp-local-mode.qp-local-playing #pixi{display:block!important}
 body.qp-local-mode .qp-online-unavailable{position:relative;cursor:not-allowed}
 body.qp-local-mode .qp-online-unavailable::after{content:'OFFLINE — ONLINE PLAY IS UNAVAILABLE';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(30,0,0,.85);color:white;font:700 clamp(16px,2vw,36px) sans-serif;text-align:center;z-index:20;pointer-events:none}
 body.qp-local-mode .qp-online-unavailable>*{opacity:.35}
 /* Keep Tab in the old, compact upper-left position.  It must never become a
    centered in-game HUD: that obscures the board and is awkward for settings. */
 body.qp-local-mode #local-panel{position:fixed!important;z-index:2147483647!important;left:1em;top:4.5em;right:auto;bottom:auto;transform:none;padding:.65em .8em;max-width:min(45vw,52em);max-height:calc(100vh - 6em);overflow:auto;background:#171724f2;border:1px solid #7778;box-shadow:.3em .3em 1.2em #000b;font-family:HUN,sans-serif;text-align:left}
 /* The hidden attribute is the source of truth while a game is running. The panel starts
    closed; Tab is the explicit escape/settings toggle. */
 body.qp-local-mode.qp-local-playing #local-panel{max-width:min(31em,calc(100vw - 2em));max-height:calc(100vh - 6em)}
 body.qp-local-mode #local-panel[hidden]{display:none!important}
 body.qp-local-mode #local-panel #local-stop{min-width:12em;margin:0;padding:.45em 1em;border:1px solid #a88;background:#422;color:#fdd;font-family:HUN,sans-serif;cursor:pointer}
 /* Local entries use the same compact card height as standard SOLO entries. */
 body.qp-local-mode #game_qp_offline,body.qp-local-mode #game_ai_local{position:relative!important;overflow:hidden!important;min-height:5.5em!important;height:auto!important;padding:.75em 1.1em!important}
 body.qp-local-mode #game_qp_offline img,body.qp-local-mode #game_ai_local img{position:absolute!important;left:1.2em!important;top:50%!important;transform:translateY(-50%)!important;width:5.7em!important;height:3.2em!important;max-width:5.7em!important;max-height:3.2em!important;object-fit:contain!important;object-position:left center!important}
 body.qp-local-mode #game_qp_offline h1,body.qp-local-mode #game_qp_offline p,body.qp-local-mode #game_ai_local h1,body.qp-local-mode #game_ai_local p{margin-left:7.1em!important}
 body.qp-local-mode #zenithmenu .zenith_card.qp-local-reverse{filter:none}
 /* Current and older clients use different inner card wrappers.  Prefer the
    native rotator, but rotate the whole card when that wrapper is absent. */
 body.qp-local-mode #zenithmenu .zenith_card .zenith_card_rot,body.qp-local-mode #zenithmenu .zenith_card{transition:transform .24s cubic-bezier(.2,.8,.2,1)}
 body.qp-local-mode #zenithmenu .zenith_card.qp-local-reverse .zenith_card_rot{transform:rotate(180deg)!important}
 body.qp-local-mode #zenithmenu .zenith_card.qp-local-reverse-root{transform:rotate(180deg)!important}
 /* Settings must be independent from the native deck's scrolling and click
    handlers.  A fixed dialog also keeps the QP cards visible while adjusting
    attack / mission rules. */
 /* This cannot be a child of .zenith_deck.  The stock deck is transformed and
    clips overflowing children, so a correctly-clicked SETTING button opened
    an invisible panel.  Keep both custom controls at the document layer. */
 body.qp-local-mode #qp-local-settings{display:none;position:fixed!important;z-index:2147483600!important;right:max(1.35em,calc((100vw - 74em)/2 + 1.2em))!important;top:5.1em!important;bottom:auto!important;width:min(34em,calc(100vw - 2.7em));max-width:38em;max-height:calc(100vh - 7em);overflow:auto;box-sizing:border-box;margin:0;padding:1em 1.1em;background:linear-gradient(160deg,#28180feF,#15131ddd);color:#ffe8d5;border:2px solid #b86737;border-radius:.32em;box-shadow:.35em .35em 1.3em #000d;font-family:PFW,sans-serif}
 body.qp-local-mode #qp-local-settings[open]{display:block!important}
 /* The button is positioned beside RESET but lives outside the native deck.
    Native deck capture handlers otherwise consume its click before it can
    open the local settings dialog. */
/* The settings control deliberately inherits the stock RESET button's
   classes.  Only detach it for placement; do not invent a second UI style. */
/* Visibility is controlled by updateQPSettingsVisibility().  This must not
   force display:block:important, otherwise the control leaks onto SOLO and
   AI LAB even after the native QP deck has been left. */
body.qp-local-mode .qp-local-settings-button{position:fixed!important;z-index:2147483500!important;margin:0!important;cursor:pointer!important}
 body.qp-local-mode #qp-local-settings-button{display:none;min-width:5.5em;box-sizing:border-box;padding:.38em .72em!important;border:1px solid #a95029!important;border-radius:.18em!important;background:linear-gradient(#6b2a19,#42180f)!important;color:#ffc28f!important;font:700 1em HUN,sans-serif!important;line-height:1.1!important;text-align:center;text-shadow:0 1px 1px #000;box-shadow:inset 0 1px #ffb07a55,0 1px 2px #000b;transition:filter .12s,transform .12s}
 body.qp-local-mode #qp-local-settings-button:hover,body.qp-local-mode #qp-local-settings-button:focus{filter:brightness(1.28);transform:translateY(-1px);outline:1px solid #ffd0a1}
 body.qp-local-mode #qp-local-settings-button:active{filter:brightness(.85);transform:translateY(1px)}
 body.qp-local-mode #qp-local-settings summary{cursor:pointer;font-family:HUN,sans-serif;font-size:1.2em;color:#ffba82;padding:0 0 .55em;border-bottom:1px solid #b86737}
 body.qp-local-mode #qp-local-settings label{display:grid;grid-template-columns:minmax(12em,1fr) minmax(8em,.72fr);align-items:center;gap:.7em;margin:.65em 0;color:#ffe8d5}
 body.qp-local-mode #qp-local-settings select,body.qp-local-mode #qp-local-settings input{width:100%;box-sizing:border-box;font:inherit;margin:0;background:#16131beF;color:#fff4e9;border:1px solid #b9815b;border-radius:.18em;padding:.35em .45em}
 body.qp-local-mode #qp-local-settings #qp-ai-options label{display:flex;align-items:center;justify-content:space-between;gap:.75em;grid-template-columns:none}
 body.qp-local-mode #qp-local-settings #qp-ai-options label input[type="checkbox"]{order:2;flex:0 0 auto;width:1.15em;height:1.15em}
 body.qp-local-mode #qp-local-settings #qp-ai-options label input[type="number"]{max-width:12em}
 body.qp-local-mode #zenithmenu .zenith_card.qp-local-reverse::after{content:'REVERSE';position:absolute;right:.55em;bottom:.35em;color:#ffb36b;font-family:HUN,sans-serif;font-size:.72em;text-shadow:0 1px 3px #000}
 body.qp-local-mode #zenithmenu .zenith_card.floorlocked .zenith_card_lock,body.qp-local-mode #zenithmenu .zenith_card .zenith_card_supporterlock{display:none!important}
 body.qp-local-mode #zenithmenu #qp-local-native-note{margin-top:1em;text-align:center;opacity:.72;font-family:PFW,sans-serif}
 body.qp-local-mode [data-menuview="tetra"]>:not(#tetra_me):not(#qp-tetra-offline-status){display:none!important}
 body.qp-local-mode #qp-tetra-offline-status{opacity:.72;cursor:default;border-color:#777}
 `;
 document.head.appendChild(offlineStyle);
 // LocalMissionLibrary must already be loaded from index.html's static script;
 // this fallback only handles edge cases where index.html was manually edited.
 if(!window.LocalMissionLibrary){probeLog('警告: LocalMissionLibrary の読み込みに失敗しました。index.html への custom-missions.js の静的読み込みを追加して再構築してください。');return}
 // Keep the dynamic DuoRepoly load for older archives without duo-replay-merge.js.
 if(!window.LocalDuoReplay){const duoScript=document.createElement('script');duoScript.src='https://kei1215.github.io/bookmarklets/offline-v4.8214/duo-replay-merge.js';duoScript.async=false;document.head.appendChild(duoScript)}
 for(const id of ['play_multi','multi_quickplay','multi_league','multi_createroom','multi_listing','play_returntoroom']){
  const entry=document.getElementById(id);if(!entry)continue;
  entry.classList.add('qp-online-unavailable');entry.setAttribute('aria-disabled','true');
  entry.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation()},true);
 }
 const panel=document.getElementById('local-panel');document.getElementById('menus').classList.add('hidden');
 const diagnostics=document.createElement('details');diagnostics.id='local-diagnostics-section';const diagnosticsTitle=document.createElement('summary');diagnosticsTitle.textContent='描画診断';diagnostics.appendChild(diagnosticsTitle);
 // Keep the three utility actions together directly below 終了.  Add-on
 // modules (vA) place their action into this same row instead of appending
 // an unrelated button farther down the Tab panel.
 const utilities=document.createElement('div');utilities.id='local-utility-actions';utilities.setAttribute('aria-label','ローカル操作');utilities.style.cssText='display:flex;flex-wrap:wrap;gap:.35em;margin:.45em 0';
 const noRenderButton=document.createElement('button');noRenderButton.id='local-no-render-toggle';noRenderButton.textContent='描画停止：OFF';noRenderButton.onclick=()=>{const enabled=window.LocalRenderDiagnostics?.noRender(!window.LocalRenderDiagnostics?.isNoRender());noRenderButton.textContent='描画停止：'+(enabled?'ON':'OFF')};utilities.appendChild(noRenderButton);
 const qpSettingsButton=document.createElement('button');qpSettingsButton.id='local-open-qp-settings';qpSettingsButton.textContent='QP設定を開く';qpSettingsButton.onclick=()=>openNativeQP(true);utilities.appendChild(qpSettingsButton);
 const stopButton=document.getElementById('local-stop');if(stopButton?.parentNode)stopButton.parentNode.insertBefore(utilities,stopButton.nextSibling);else panel.appendChild(utilities);panel.appendChild(diagnostics);
 const localSettings=document.createElement('details');localSettings.id='local-speed-settings';const localSettingsTitle=document.createElement('summary');localSettingsTitle.textContent='オフライン専用設定・ゲーム速度';localSettings.appendChild(localSettingsTitle);
 const speedRow=document.createElement('label');speedRow.textContent='ゲーム時間速度 ';const speedSelect=document.createElement('select');for(const value of [0,.25,.5,1,1.5,2,3,4,8]){const option=document.createElement('option');option.value=String(value);option.textContent=value===0?'0×（停止）':value+'×';speedSelect.appendChild(option)}speedSelect.value=localStorage.getItem('qp-local-game-speed')||'1';speedSelect.onchange=()=>LocalNative.setGameSpeed(Number(speedSelect.value));speedRow.appendChild(speedSelect);localSettings.appendChild(speedRow);
 const fpsRow=document.createElement('label');fpsRow.textContent='描画FPS上限 ';const fpsSelect=document.createElement('select');for(const [value,label]of [[0,'制限なし'],[60,'60 FPS'],[120,'120 FPS'],[240,'240 FPS']]){const option=document.createElement('option');option.value=String(value);option.textContent=label;fpsSelect.appendChild(option)}fpsSelect.value=localStorage.getItem('qp-local-fps-limit')||'60';fpsSelect.onchange=()=>LocalNative.setFrameLimit(Number(fpsSelect.value));fpsRow.appendChild(fpsSelect);localSettings.appendChild(fpsRow);panel.appendChild(localSettings);
 const localRoutes=new Map();
 const ownPress=(element,activate)=>localRoutes.set(element.id,activate);
 const routeLocalCard=event=>{
  const element=event.target?.closest?.('#game_qp_offline');
  const activate=element&&localRoutes.get(element.id);if(!activate)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(event.type==='click')activate();
  if(event.type==='keydown'&&(event.key==='Enter'||event.key===' '))activate();
 };
 for(const type of ['pointerdown','mousedown','touchstart','click','keydown'])window.addEventListener(type,routeLocalCard,true);
 const back=document.getElementById('back');
 let busy=false,generation=0;
 async function start(action,profile='solo'){
  if(busy)return;busy=true;const current=++generation;
  try{
   await LocalReplayData.check(profile);await LocalUIHealth.check();await OriginalReplay.init();LocalNative.stop();OriginalReplay.stop();document.getElementById('menus').classList.add('hidden');await new Promise(resolve=>setTimeout(resolve,650));
   // #zenithmenu remains mounted while other SOLO pages are visible.  Clear
   // the explicit QP-only marker before any local launch so SETTING cannot
   // survive behind 40L, AI LAB, replay, or the board.
   document.body.classList.remove('qp-local-qp-open');
   document.body.classList.add('qp-local-playing');
   const game=await action();
   if(game){const configured=Number(localStorage.getItem('qp-local-game-speed')??1);const speed=[0,.25,.5,1,1.5,2,3,4,8].includes(configured)?configured:1;game.playbackSpeed(speed);game._localSpeedChanges=[{frame:game.getFrame(),speed}];LocalTestQP.setSpeed(speed);}
   // The game's listener table also contains the native ZEN undo snapshots.
   // Clearing it breaks Ctrl+Z/Ctrl+Y and ZEN's stop/autosave handler.
   // Only replace Solo's result handler; leave ZEN's native listeners intact.
   if(game){game.options.anchorseed=false;if(!game.options.zenlevels&&!game.options.zenith&&!game._localTLMatch)game.remove('end');game.on('end',function(reason){const game=this;
    try{if(!game._localTLMatch&&!game._localReplaySide)LocalReplayLibrary.save(game,reason)}catch(error){probeLog('ローカルリプレイ保存失敗: '+error.stack);LocalUIHealth.fail('リプレイ保存',error)}
    if(reason==='retry')return; // Native Retry recreates the game and copies listeners.
    if(reason==='dropnow')return;
    // Native QP board fall finishes at 1750ms. Preserve its background and tail.
    // Local QP's result transition can leave the native roll-up action
    // hidden.  Restore the official EXIT control rather than adding a second
    // local exit button.
    const exit=document.getElementById('leavezenith');
    if(exit){exit.textContent='EXIT';exit.hidden=false;exit.classList.remove('hidden','thidden','rolledup');}
    window.dispatchEvent(new CustomEvent('local-game-ended',{detail:{game,reason}}));
    if(game.options.zenith)setTimeout(()=>{if(current===generation)LocalNative.results(game).catch(error=>probeLog(error.stack))},2750);
   })}
   
   panel.hidden=true;window.dispatchEvent(new Event('local-game-started'));return game;
  }catch(error){document.body.classList.remove('qp-local-playing');LocalUIHealth.fail('プレイ開始',error);probeLog(error.stack);panel.hidden=false}finally{busy=false}
 }
 const playSolo=(mode,aiName=null)=>start(()=>{
  if(mode==='zen'&&!QPLocalZen.active()){
   const slot=QPLocalZen.list().find(slot=>slot.scope==='local');
   QPLocalZen.select(slot?.id||QPLocalZen.create('ローカルZEN'));
  }
  return LocalNative.solo(mode,aiName);
 });
 const qp=document.createElement('div');qp.id='game_qp_offline';qp.className='scroller_item has_image has_description ns';
 const icon=document.createElement('img');icon.src='/res/local/qpo.svg';icon.alt='';qp.appendChild(icon);
 const qpTitle=document.createElement('h1');qpTitle.textContent='QP OFFLINE';qp.appendChild(qpTitle);
 const qpHint=document.createElement('p');qpHint.textContent='LOCAL ONLY · NO OPPONENTS · NO KILLS';qp.appendChild(qpHint);
 const zenithMenu=document.getElementById('zenithmenu');
 const zenithCards=[...zenithMenu.querySelectorAll('.zenith_card[data-card]')];
 for(const card of zenithCards){
  card.classList.remove('floorlocked','supporterlock','reversehide','forceoff','reversed');
  card.querySelectorAll('.zenith_card_lock,.zenith_card_supporterlock').forEach(lock=>lock.hidden=true);
 }
 const note=document.createElement('p');note.id='qp-local-native-note';note.textContent='OFFLINE · LOCAL RECORDS ONLY · CLICK AGAIN FOR REVERSE MOD';
 zenithMenu.querySelector('.zenith_deck')?.appendChild(note);
 const settings=document.createElement('details');settings.id='qp-local-settings';
 const settingsTitle=document.createElement('summary');settingsTitle.textContent='QP 詳細設定';settings.appendChild(settingsTitle);
 const field=(label,element)=>{const row=document.createElement('label');row.append(document.createTextNode(label),element);settings.appendChild(row);return element};
 const saved=(key,fallback)=>localStorage.getItem(key)??fallback;
 const attackMode=field('受ける攻撃',document.createElement('select'));attackMode.setAttribute('aria-label','受ける攻撃');
 for(const [value,label]of [['none','攻撃なし'],['periodic','定期攻撃'],['floor','高層ほど強い攻撃']]){const option=document.createElement('option');option.value=value;option.textContent=label;attackMode.appendChild(option)}attackMode.value=saved('qp-local-attack-mode','none');
 const attackLines=field('攻撃段数',document.createElement('input'));attackLines.type='number';attackLines.min='1';attackLines.max='20';attackLines.value=saved('qp-local-attack-lines','2');attackLines.setAttribute('aria-label','攻撃段数');
 const attackSeconds=field('攻撃間隔（ゲーム内秒）',document.createElement('input'));attackSeconds.type='number';attackSeconds.min='.5';attackSeconds.max='60';attackSeconds.step='.5';attackSeconds.value=saved('qp-local-attack-seconds','5');attackSeconds.setAttribute('aria-label','攻撃間隔');
 const missionSource=field('復活ミッション',document.createElement('select'));missionSource.setAttribute('aria-label','復活ミッション');for(const [value,label]of [['standard','標準のみ'],['custom','自作のみ'],['both','すべて表示']]){const option=document.createElement('option');option.value=value;option.textContent=label;missionSource.appendChild(option)}missionSource.value=saved('qp-local-mission-source','standard');
 const missionTools=document.createElement('div');missionTools.id='local-mission-tools';missionTools.style.cssText='display:flex;flex-wrap:wrap;gap:.45em;margin:.7em 0';
 const missionImport=document.createElement('input');missionImport.type='file';missionImport.accept='application/json,text/plain,.json,.txt';missionImport.hidden=true;
 const missionButton=(label,action)=>{const button=document.createElement('button');button.type='button';button.textContent=label;button.onclick=action;missionTools.appendChild(button);return button};
 missionButton('自作ミッションを管理',()=>window.LocalMissionLibrary?.open?.());
 missionButton('詳細エディタを開く',()=>window.open('https://kei1215.github.io/bookmarklets/offline-v4.8214/mission-editor.html','_blank','noopener'));
 missionButton('ミッションJSONを書き出す',()=>window.LocalMissionLibrary?.download?.());
 missionButton('ミッションJSONを読み込む',()=>missionImport.click());
 missionImport.onchange=async()=>{try{const file=missionImport.files?.[0];if(file)await window.LocalMissionLibrary?.importFile?.(file)}catch(error){window.LocalUIHealth?.fail?.('ミッションJSON',error);alert('ミッションJSONを読み込めません: '+error.message)}finally{missionImport.value=''}};
 settings.append(missionTools,missionImport);
 // A run may start with several MODs before any revive prompt is offered.
 // This is NOT the mission editor; mission JSON stays in the separate HTML app.
 const comboPanel=document.createElement('details');comboPanel.id='qp-local-revive-combo';
 const comboTitle=document.createElement('summary');comboTitle.textContent='リバイブラン：MOD複数同時起動';comboPanel.appendChild(comboTitle);
 const comboNote=document.createElement('p');comboNote.textContent='DUO復活ランの開始時に、選んだMODをまとめて有効化します。既存のMODカード選択に追加します。ミッション中のMOD指定も別途加算されます。';comboPanel.appendChild(comboNote);
 const comboEnabled=document.createElement('input');comboEnabled.type='checkbox';comboEnabled.checked=saved('qp-local-revive-combo-enabled','false')==='true';
 const comboEnableLabel=document.createElement('label');comboEnableLabel.append('複数MODを同時適用',comboEnabled);comboPanel.appendChild(comboEnableLabel);
 const comboSelectors=new Map();
 for(const name of LocalQPOptions.names){
  const row=document.createElement('label');row.append(name);
  const select=document.createElement('select');
  for(const [v,display] of [['off','無効'],['normal','通常'],['reverse','リバース']]){const opt=document.createElement('option');opt.value=v;opt.textContent=display;select.appendChild(opt)}
  select.value=saved('qp-local-revive-combo-'+name,'off');
  select.addEventListener('change',()=>localStorage.setItem('qp-local-revive-combo-'+name,select.value));
  row.append(select);comboPanel.appendChild(row);comboSelectors.set(name,select);
 }
 comboEnabled.addEventListener('change',()=>localStorage.setItem('qp-local-revive-combo-enabled',String(comboEnabled.checked)));
 settings.appendChild(comboPanel);
 // Optional control-changing revive penalties (L/R reversal and board rotation)
 // are disabled by default; standard native mission failure rules remain on.
 const controlPenalties=field('追加の操作系ペナルティを有効にする（個別ミッションの盤面回転は別設定）',document.createElement('input'));
 controlPenalties.type='checkbox';controlPenalties.checked=saved('qp-local-control-penalties','false')==='true';
 controlPenalties.addEventListener('change',()=>localStorage.setItem('qp-local-control-penalties',String(controlPenalties.checked)));
 // Test the first, second, third revive prompts in a fixed order. These are
 // JSON mission IDs; blanks use the usual random candidate selection.
 const fixedPanel=document.createElement('details');fixedPanel.id='qp-local-fixed-revives';
 const fixedTitle=document.createElement('summary');fixedTitle.textContent='復活ミッションのテスト：1～3番目を指定';fixedPanel.appendChild(fixedTitle);
 const fixedNote=document.createElement('p');fixedNote.textContent='自作ミッションJSONから順番を指定します。未指定はランダム。既定の抽選へ戻すには3枠すべて自動を選択してください。';fixedPanel.appendChild(fixedNote);
 const fixedSelectors=[];
 for(let i=0;i<3;i++){
  const row=document.createElement('label');row.append(document.createTextNode((i+1)+'番目'));
  const select=document.createElement('select');select.setAttribute('aria-label','復活ミッション'+(i+1)+'番目');
  select.addEventListener('change',()=>{
   try{const library=window.LocalMissionLibrary?.read?.();if(!library)throw Error('自作ミッション機能を読み込めませんでした');library.testSequence=fixedSelectors.map(s=>s.value);window.LocalMissionLibrary.write(library)}
   catch(error){window.LocalUIHealth?.fail?.('固定復活ミッションの保存',error)}
  });row.appendChild(select);fixedPanel.appendChild(row);fixedSelectors.push(select);
 }
 function refreshFixed(){
  const library=window.LocalMissionLibrary?.read?.()||{missions:[],testSequence:[]};
  fixedSelectors.forEach((select,i)=>{
   const previous=library.testSequence?.[i]||'';select.replaceChildren();
   select.add(new Option('自動（ランダム）',''));
   for(const task of library.missions||[])select.add(new Option(task.name+' ('+task.id+')',task.id));
   select.value=previous;
  });
 }
 window.addEventListener('local-custom-missions',refreshFixed);
 window.addEventListener('local-mission-library-ready',refreshFixed);
 refreshFixed();settings.appendChild(fixedPanel);
 const attackRequired=field('攻撃なしでも攻撃必須ミッションを表示',document.createElement('input'));attackRequired.type='checkbox';attackRequired.checked=saved('qp-local-mission-attack-required','false')==='true';attackRequired.setAttribute('aria-label','攻撃必須ミッションも表示');
 const modHyper=field('MOD中も条件を満たせばHYPERSPEEDを許可',document.createElement('input'));modHyper.type='checkbox';modHyper.checked=saved('qp-local-mod-hyper','false')==='true';modHyper.setAttribute('aria-label','MOD中HYPERSPEED');
 for(const control of [attackMode,attackLines,attackSeconds,missionSource,attackRequired,modHyper])control.addEventListener('change',()=>{localStorage.setItem('qp-local-attack-mode',attackMode.value);localStorage.setItem('qp-local-attack-lines',attackLines.value);localStorage.setItem('qp-local-attack-seconds',attackSeconds.value);localStorage.setItem('qp-local-mission-source',missionSource.value);localStorage.setItem('qp-local-mission-attack-required',String(attackRequired.checked));localStorage.setItem('qp-local-mod-hyper',String(modHyper.checked))});
 // The stock deck uses transforms and overflow clipping.  A fixed child is
 // then fixed to that clipped deck rather than the application viewport.
 // Place the dialog directly below <body>, just like the detached SETTING
 // control, so opening it is always visible and interactive.
 document.body.appendChild(settings);
 const resetButton=document.getElementById('zenith_deck_reset');
 // RESET's actual visual treatment is attached to its classes, not to a
 // button element. Clone the *node* and only replace its ID. Keeping the old
 // RESET ID accidentally bound SETTING to “Remove all mods”; this clone has
 // no native listeners and lives outside the deck, so it keeps the hover and
 // press look without inheriting RESET's action.
 const settingsButton=resetButton?resetButton.cloneNode(true):document.createElement('div');
 settingsButton.id='qp-local-settings-button';settingsButton.classList.add('qp-local-settings-button');settingsButton.textContent='SETTING';
 settingsButton.removeAttribute('title');settingsButton.setAttribute('title','QP settings');settingsButton.setAttribute('role','button');settingsButton.tabIndex=0;
 settingsButton.style.cursor='pointer';settingsButton.style.pointerEvents='auto';
 settingsButton.setAttribute('aria-controls','qp-local-settings');settingsButton.setAttribute('aria-expanded','false');
 const toggleQPSettings=event=>{event?.preventDefault();event?.stopImmediatePropagation();settings.open=!settings.open;settingsButton.setAttribute('aria-expanded',String(settings.open));if(settings.open)settings.querySelector('select,input')?.focus({preventScroll:true})};
 // The real button is detached from the deck tree, so it cannot be consumed
 // by the native RESET/deck handler.  One click path also makes mouse,
 // keyboard, and accessibility activation behave identically.
 // The native deck has a capture listener for clicks.  Opening on pointerdown
 // makes the local control win that race, then suppresses only its follow-up
 // click.  This is the same route that worked in the previous UI.
 let settingsPointerAt=0;
 settingsButton.addEventListener('pointerdown',event=>{event.preventDefault();event.stopImmediatePropagation();settingsPointerAt=performance.now();toggleQPSettings(event)},true);
 settingsButton.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();if(performance.now()-settingsPointerAt>350)toggleQPSettings(event)},true);
 settingsButton.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleQPSettings(event)}},true);
 // Settings belong to the QP deck only.  In particular, do not leave this
 // floating panel over SOLO, a replay, or the game board after navigating
 // away from QUICK PLAY.
 const closeQPSettings=()=>{settings.open=false;settingsButton.setAttribute('aria-expanded','false');};
 const leaveNativeQP=()=>{closeQPSettings();document.body.classList.remove('qp-local-qp-open');settingsButton.style.display='none'};
 const resetDeck=()=>{for(const card of zenithCards)card.classList.remove('active','qp-local-reverse','qp-local-reverse-root');closeQPSettings();};
 const placeSettingsButton=()=>{if(!resetButton)return;const rect=resetButton.getBoundingClientRect();settingsButton.style.top=Math.max(8,rect.top+(rect.height-settingsButton.offsetHeight)/2)+'px';settingsButton.style.left=Math.max(8,rect.left-settingsButton.offsetWidth-12)+'px'};
 // Keep it visually immediately left of RESET, but outside the deck's DOM
 // tree so the native handler cannot swallow pointer events.
 document.body.appendChild(settingsButton);requestAnimationFrame(placeSettingsButton);window.addEventListener('resize',placeSettingsButton);
 // The MOD deck can scroll independently of the window.  Capturing scroll
 // events keeps the detached, clickable button beside native RESET.
 window.addEventListener('scroll',placeSettingsButton,true);
 // Close immediately for any navigation out of the deck.  Native TETR.IO
 // changes menu visibility by class rather than emitting a single shared
 // navigation event, so watch both the deck and the menu tree.
 const leaveQP=event=>{const target=event.target;if(target===settingsButton||settingsButton.contains(target)||settings.contains(target))return;closeQPSettings()};
 document.addEventListener('pointerdown',leaveQP,true);
 document.addEventListener('keydown',event=>{if(event.key==='Escape')closeQPSettings()},true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)closeQPSettings()});
 const updateQPSettingsVisibility=()=>{
  // The native client leaves #zenithmenu mounted when SOLO is displayed.
  // Its DOM visibility is therefore not a valid QP-state signal.
  const header=document.getElementById('header_text');
  const visible=document.body.classList.contains('qp-local-qp-open')&&header?.textContent?.trim()==='QUICK PLAY'&&!zenithMenu.hidden&&!zenithMenu.classList.contains('hidden');
  if(!visible){closeQPSettings();settingsButton.style.display='none'}
  else {settingsButton.style.display='block';requestAnimationFrame(placeSettingsButton)}
 };
 const qpVisibilityObserver=new MutationObserver(updateQPSettingsVisibility);
 qpVisibilityObserver.observe(zenithMenu,{attributes:true,attributeFilter:['class','style','hidden']});
 qpVisibilityObserver.observe(document.getElementById('menus')||document.body,{attributes:true,subtree:true,attributeFilter:['class','style','hidden']});
 const qpHeader=document.getElementById('header_text');if(qpHeader)qpVisibilityObserver.observe(qpHeader,{childList:true,characterData:true,subtree:true});
 // Some native view transitions replace header content without delivering a
 // mutation to the original node.  A small state guard prevents a detached
 // QP-only control from ever remaining on SOLO/AI LAB in that case.
 setInterval(updateQPSettingsVisibility,250);
 updateQPSettingsVisibility();
 if(resetButton)resetButton.addEventListener('click',()=>{setTimeout(resetDeck,0)},true);
 function selectedQPConfig(){
  const selected={};let duo='solo';
  for(const card of zenithCards){
   const name=card.dataset.card;if(!card.classList.contains('active')){selected[name]='off';continue}
   const reverse=card.classList.contains('qp-local-reverse');selected[name]=reverse?'reverse':'normal';
   if(name==='duo')duo=reverse?'duo-reverse-dead':'duo-dead';
  }
  if(duo!=='solo'&&comboEnabled.checked){for(const [name,selector]of comboSelectors){if(selector.value!=='off')selected[name]=selector.value}}
  const config=LocalQPOptions.build(selected,modHyper.checked);
  config.testMode=duo;config.attackMode=attackMode.value;
  config.attackLines=Number(attackLines.value);config.attackSeconds=Number(attackSeconds.value);
  config.missions={source:missionSource.value,attackEnabled:config.attackMode!=='none',includeAttackRequired:attackRequired.checked,allowControlPenalties:controlPenalties.checked};
  return config;
 }
 window.LocalQPSelectedMode=()=>zenithCards.some(card=>card.classList.contains('active'))?'qp-mod':'qp';
 function openNativeQP(showSettings=false){
  LocalNative.resetResults();LocalNative.view('zenith');
  zenithMenu.classList.remove('hidden','thidden','rolledup','inresults');document.body.classList.add('inzenith','qp-local-qp-open');
  document.getElementById('start_zenith_label').textContent='START';
  document.getElementById('zenith_rollup_main').textContent='PLAY';
  document.getElementById('header_text').textContent='QUICK PLAY';
  document.getElementById('footer_text').textContent='OVERTHROW THE TOWER!';
  requestAnimationFrame(()=>{updateQPSettingsVisibility();placeSettingsButton();if(showSettings){settings.open=true;settingsButton.setAttribute('aria-expanded','true');settings.querySelector('select,input')?.focus({preventScroll:true})}});
 }
 // Shared launcher used by vA's training screen.  It only calls the same
 // local routes used by the visible SOLO/QP controls, so no online match or
 // server request is created.  "tl" and "custom" currently open the native
 // Local-only shared launcher. TL/CUSTOM use the native custom board while
 // the room layer owns the selected FT and player/AI assignment.
 window.LocalTrainingLaunch=async({mode,profileId,firstTo=1,mods=[],controller='bot'}={})=>{
  const profile=window.LocalBotLearning?.getProfile?.(profileId);if(!profile)throw Error('保存AIを選択してください');
  if(window.OriginalReplay?.game?.()?.isPlaying())throw Error('現在のプレイを終了してから開始してください');
  // TL / CUSTOM FT is owned by the saved room, not by the generic BOT
  // start button (which passes its default firstTo=1). Do not overwrite FT.
  if(mode!=='tl'&&mode!=='custom'){const ft=window.LocalAIRoom?.ft?.(firstTo);if(ft)localStorage.setItem('qp-local-ai-ft',String(ft.firstTo));}
  document.getElementById('local-panel')?.setAttribute('hidden','');
  if(mode==='40l'||mode==='blitz')return playSolo(mode,controller==='bot'?profile.name:null);
  if(mode==='qp'||mode==='qp-duo'){
   // A human reopening QP keeps their previous card choices.  Only an AI
   // launch with an explicit MOD list replaces the deck, so training cannot
   // silently inherit a previous human run's MODs.
   if(controller==='bot'&&Array.isArray(mods)){
    // [] means QP NOMOD; do not inherit human player's previous MOD deck.
    resetDeck();for(const mod of mods){const card=zenithCards.find(item=>item.dataset.card===String(mod).replace(/_reversed$/,''));if(card){card.classList.add('active');if(String(mod).endsWith('_reversed'))card.classList.add('qp-local-reverse')}}
   }
   const config=selectedQPConfig();if(mode==='qp-duo')config.testMode='duo-dead';
   const game=await start(()=>LocalNative.qp(controller==='bot'?{...config,options:{...(config.options||{}),username:profile.name}}:config),'qp');return game;
  }
  if(mode==='tl'||mode==='custom'){
   // These modes are a real local versus match, not the single-board CUSTOM
   // solo route.  The AI room owns both boards and garbage transport.
   const room=window.LocalRoomUI?.read?.()||{};
   const games=window.LocalAIRoom?.start?.({left:room.players?.left||'ai',right:room.players?.right||'ai',profileId,firstTo:room.match?.ft||firstTo,mode});
   if(!games?.length)throw Error('TL/CUSTOM対戦を開始できませんでした');
   return games[0];
  }
  throw Error('開始モードを選択してください');
 };
 const qpRoute=event=>{
  const card=event.target?.closest?.('#zenithmenu .zenith_card[data-card]');
  if(card&&(event.type==='click'||event.type==='keydown'&&(event.key==='Enter'||event.key===' '))){
   event.preventDefault();event.stopImmediatePropagation();
   if(!card.classList.contains('active')){card.classList.add('active');card.classList.remove('qp-local-reverse','qp-local-reverse-root','reversed')}
   else if(!card.classList.contains('qp-local-reverse')){card.classList.remove('reversed');card.classList.add('qp-local-reverse');card.classList.toggle('qp-local-reverse-root',!card.querySelector('.zenith_card_rot'))}
   else card.classList.remove('active','qp-local-reverse','qp-local-reverse-root','reversed');
   return;
  }
  const startButton=event.target?.closest?.('#start_zenith');
  if(startButton&&event.type==='click'){
   event.preventDefault();event.stopImmediatePropagation();
   zenithMenu.classList.add('hidden','thidden','rolledup');document.body.classList.remove('inzenith');leaveNativeQP();
   start(()=>LocalNative.qp(selectedQPConfig()),'qp');return;
  }
  const leave=event.target?.closest?.('#leavezenith,#zenith_rollup_main');
  if(leave&&event.type==='click'){
   event.preventDefault();event.stopImmediatePropagation();LocalNative.resetResults();leaveNativeQP();LocalNative.view('play1p');
  }
 };
 for(const type of ['click','keydown'])window.addEventListener(type,qpRoute,true);
 ownPress(qp,openNativeQP);
 document.getElementById('solo_menu').append(qp);
 document.querySelectorAll('[data-solo]').forEach(button=>button.onclick=()=>playSolo(button.dataset.solo));
 document.getElementById('local-stop').onclick=()=>{generation++;leaveNativeQP();LocalNative.stop();setTimeout(()=>{OriginalReplay.stop();document.body.classList.remove('qp-local-playing');LocalNative.view('play1p');panel.hidden=true},600)};
 document.getElementById('play-original').onclick=()=>document.getElementById('local-file').click();
 async function openReplayFile(file){
  if(!file)return;
  if(OriginalReplay.game()?.isPlaying()){probeLog('プレイを終了してからリプレイを開いてください。');return}
  try{const data=JSON.parse(await file.text());const type=LocalReplayData.describe(data);await LocalReplayData.check(type.profile);if(!data.users?.length)data.users=[{username:data.replay.options.username||'REPLAY'}];
   await start(()=>{LocalNative.replay(data);return null},type.profile);
  }catch(error){probeLog(error.stack)}
 }
 document.getElementById('local-file').onchange=event=>openReplayFile(event.target.files[0]);
 // Prevent Electron's default file navigation. Keep online pages on the native
 // drop handler, including its live-server guard; this page has no connection.
 window.addEventListener('dragover',event=>{
  if(Array.from(event.dataTransfer?.types||[]).includes('Files'))event.preventDefault();
 },true);
 window.addEventListener('drop',event=>{
  const file=event.dataTransfer?.files?.[0];
  if(!file||! /\.ttrm?(?:\.json)?$/i.test(file.name))return;
  event.preventDefault();event.stopImmediatePropagation();openReplayFile(file);
 },true);
 function showHistory(filter='any'){
  panel.hidden=true;LocalNative.view('tetra_me');
  LocalReplayLibrary.show(document.getElementById('tetra_myrecords'),async data=>{
   if(OriginalReplay.game()?.isPlaying()){probeLog('プレイを終了してからリプレイを開いてください。');return}
   try{const copy=structuredClone(data),type=LocalReplayData.describe(copy);await start(()=>{LocalNative.replay(copy);return null},type.profile)}catch(error){LocalUIHealth.fail('リプレイ再生',error)}
  },filter);
 }
 const intercept=(id,action)=>document.getElementById(id)?.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();action()},true);
 document.getElementById('sig_channel').classList.remove('block_offline');
 intercept('sig_channel',()=>LocalNative.view('tetra'));
 const me=document.getElementById('tetra_me');me.classList.remove('block_anon','block_bot');me.removeAttribute('data-block-reason');
 intercept('tetra_me',()=>showHistory());
 document.getElementById('tetra_me_username').textContent=localStorage.getItem('qp-local-username')||'LOCAL';
 const tetraView=document.querySelector('[data-menuview="tetra"]');for(const node of tetraView.children)if(node.id!=='tetra_me')node.hidden=true;
 const tetraOffline=document.createElement('div');tetraOffline.id='qp-tetra-offline-status';tetraOffline.className='scroller_block ns mega_block';tetraOffline.setAttribute('aria-disabled','true');const tetraOfflineTitle=document.createElement('h1');tetraOfflineTitle.textContent='OFFLINE';const tetraOfflineText=document.createElement('p');tetraOfflineText.textContent='ME以外のTETRA CHANNEL機能はオフラインでは利用できません。';tetraOffline.append(tetraOfflineTitle,tetraOfflineText);tetraView.appendChild(tetraOffline);
 document.getElementById('tetra_jump_mypage').hidden=true;
 for(const tab of document.querySelectorAll('.tetra_myrecords_gamemode'))tab.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();document.querySelectorAll('.tetra_myrecords_gamemode').forEach(n=>n.classList.toggle('pressed',n===tab));showHistory(tab.dataset.value)},true);
 window.LocalShowHistory=showHistory;
 // Intercept only the native start buttons, keeping the original menu DOM and navigation.
 for(const [id,mode] of [['start_40l','40l'],['start_blitz','blitz'],['start_zen','zen'],['start_custom','custom']]){
  document.getElementById(id).addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();playSolo(mode)},true);
 }
 LocalUIHealth.check().then(()=>{if(!window.OriginalReplay)throw Error('OFFLINE本体の初期化に失敗しました');return window.OriginalReplay.init()}).then(()=>{LocalUIHealth.stage('メニュー初期化');LocalNative.menus();LocalNative.view('play1p');const fps=localStorage.getItem('qp-local-fps-limit');if(fps!==null)LocalNative.setFrameLimit(fps);LocalUIHealth.complete();panel.hidden=true}).catch(error=>{LocalUIHealth.fail(null,error);probeLog(error.stack)});
 window.addEventListener('pagehide' ,()=>{const game=window.OriginalReplay?.game?.();if(game?.options.zenlevels&&game.isPlaying())game.endNow()});
 // The Tab panel belongs only to the isolated local origin. Never install
 // this shortcut on the online TETR.IO page.
 if(location.protocol==='tetrio-local:'||window.__qpChromeOffline===true)window.addEventListener('keydown',event=>{
  if(event.key==='Tab'&&!event.repeat&&!event.ctrlKey&&!event.metaKey){event.preventDefault();event.stopImmediatePropagation();panel.hidden=!panel.hidden;if(!panel.hidden)window.LocalRenderDiagnostics?.refresh()}
 },true);
})();

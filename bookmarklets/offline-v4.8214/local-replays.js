(() => {
 function mode(game){return game.options.zenith?(game.options.zenith_expert?'zenithex':'zenith'):game.options.zenlevels?'zen':game.options.levels?'blitz':game.options.objective_type==='lines'?'40l':'custom'}
 function portable(file){
  if(!file||!file.replay)throw Error('TTRの再生データがありません。');
  const copy=structuredClone(file),multi=Array.isArray(copy.replay.rounds);
  const plays=multi?copy.replay.rounds.flatMap(round=>round.map(player=>player.replay)):[copy.replay];
  if(!plays.length||plays.some(play=>!play.options||!Array.isArray(play.events)||!Number.isFinite(play.frames)))throw Error('TTRの構造が不正です。');
  // Keep options, events and seeds intact; never relabel local rules as official.
  const result={version:1,gamemode:copy.gamemode,ts:copy.ts||new Date().toISOString(),users:(copy.users||[]).map((user,i)=>({id:user.id||String(i).padStart(24,'0'),username:user.username||'LOCAL',avatar_revision:user.avatar_revision||0,banner_revision:user.banner_revision||0,flags:user.flags||0,country:user.country??null})),replay:copy.replay};
  if(copy.local)result.local=copy.local;
  if(!multi&&['zenith','zenithex'].includes(copy.gamemode))result.replay.options.zenith_mods??=[];
  return result;
 }
 const api=window.LocalReplayLibrary={portable,
  save(game,reason){
   const replay=game.replay.Export();if(!(replay.frames>0))return;
   const gamemode=mode(game),mods=game.options.zenith_mods||[];
   const local={testMode:game._localTestMode||'solo',duoSide:game._localReplaySide||(game.options.zenith_duo?'player':null),speedChanges:game._localSpeedChanges||[],incomingAttacks:game._localAttackConfig||null,missions:game._localMissionConfig||null,requiresPatch:mods.filter(x=>x.endsWith('_reversed')).length>1||!!game._localCustomMissionUsed};
   const file=portable({version:1,gamemode,ts:new Date().toISOString(),local,users:[{username:game.options.username||localStorage.getItem('qp-local-username')||'LOCAL'}],replay});
   QPLocalZen.record(gamemode,{...game.export(),localEndReason:reason},file);
  },
  show(host,play,filter='any'){
   host.replaceChildren();
   const actions=document.createElement('div');actions.className='scroller_block';
   const picker=document.createElement('input');picker.type='file';picker.accept='.ttr,.ttrm,.json';picker.hidden=true;
   const load=document.createElement('button');load.className='control_button';load.textContent='TTRを開く';load.onclick=()=>picker.click();
   picker.onchange=async()=>{try{const file=picker.files?.[0];if(file)await play(JSON.parse(await file.text()))}catch(error){LocalUIHealth.fail('TTR読み込み',error)}finally{picker.value=''}};
   const clearAll=document.createElement('button');clearAll.className='control_button';clearAll.textContent='🗑 TTRを一括削除';clearAll.title='この端末のローカルTTR・記録をすべて削除';clearAll.onclick=()=>{const records=QPLocalZen.records();if(!records.length)return;if(!confirm('ローカルTTR・記録を'+records.length+'件すべて削除しますか？ この操作は戻せません。'))return;for(const record of records)QPLocalZen.deleteRecord(record.id);api.show(host,play,filter)};
   const mergeLeft=document.createElement('input'),mergeRight=document.createElement('input');for(const input of [mergeLeft,mergeRight]){input.type='file';input.accept='.ttr,.json';input.hidden=true;actions.appendChild(input)}
   const merge=document.createElement('button');merge.className='control_button';merge.textContent='DUOの2TTRを合成';merge.title='同じQP DUOプレイで保存した左右の単独TTRを選択し、TTRMを書き出します';merge.onclick=async()=>{try{mergeLeft.click();const left=await new Promise(resolve=>mergeLeft.onchange=()=>resolve(mergeLeft.files?.[0]||null));if(!left)return;mergeRight.click();const right=await new Promise(resolve=>mergeRight.onchange=()=>resolve(mergeRight.files?.[0]||null));if(!right)return;const data=LocalDuoReplay.merge(JSON.parse(await left.text()),JSON.parse(await right.text()));LocalDuoReplay.download(data)}catch(error){LocalUIHealth.fail('DUO TTR合成',error)}finally{mergeLeft.value='';mergeRight.value=''}};
   actions.append(load,merge,clearAll,picker);host.appendChild(actions);
   const records=QPLocalZen.records().reverse().filter(record=>filter==='any'||record.mode===filter);
   if(!records.length){const empty=document.createElement('div');empty.className='scroller_block';empty.textContent='ローカル記録はまだありません。';host.appendChild(empty)}
   for(const record of records){
    const row=document.createElement('div');row.className='scroller_block';row.dataset.recordId=record.id;
    const heading=document.createElement('h2');heading.textContent=record.mode.toUpperCase()+(record.replay?.local?.duoSide==='partner'?' · PARTNER':'');
    const date=document.createElement('p');date.textContent=new Date(record.date).toLocaleString();row.append(heading,date);
    if(record.replay?.local?.requiresPatch){const note=document.createElement('p');note.textContent='ローカル拡張ルール使用：完全再現には対応パッチが必要です。';row.appendChild(note)}
    const controls=document.createElement('div');controls.className='control_group flex-row';row.appendChild(controls);
    function button(text,action){const node=document.createElement('button');node.className='control_button';node.textContent=text;node.onclick=async()=>{try{await action()}catch(error){LocalUIHealth.fail('ローカル記録',error)}};controls.appendChild(node);return node}
    if(record.replay){
     button('REPLAY',()=>play(QPLocalZen.replay(record)));
     button('↓ TTR',()=>{const data=portable(QPLocalZen.replay(record)),url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=window.__qpReplayDownloadName?window.__qpReplayDownloadName(data,'ttr'):'local-'+record.mode+'-'+record.id+'.ttr';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000)});
    }
    const remove=button('🗑',()=>{if(!confirm('このローカル記録とTTRを削除しますか？'))return;QPLocalZen.deleteRecord(record.id);api.show(host,play,filter)});remove.setAttribute('aria-label','記録とTTRを削除');remove.title='記録とTTRを削除';
    host.appendChild(row);
   }
  }
 };
})();

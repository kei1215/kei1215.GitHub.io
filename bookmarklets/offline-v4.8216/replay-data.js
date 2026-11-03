(() => {
 function describe(data){
  if(!data||typeof data!=='object')throw Error('リプレイの内容が不正です。');
  if(data.version!==undefined&&data.version!==null&&![0,1].includes(data.version))throw Error('このリプレイ形式は対応外です。');
  const multi=Array.isArray(data.replay?.rounds)||data.ismulti===true;
  if(multi&&!Array.isArray(data.replay?.rounds))throw Error('この古い対戦リプレイは元クライアントの変換処理が対応していません。');
  const options=multi?data.replay.rounds.flatMap(round=>round.map(player=>player.replay?.options).filter(Boolean)):[data.replay?.options];
  if(options.some(option=>option?.version>19))throw Error('このパッチより新しいゲーム版のリプレイです。');
  return {profile:multi?'versus':options.some(option=>option?.zenith)||['zenith','zenithex'].includes(data.gamemode)?'qp':'solo',multi};
 }
 window.LocalReplayData={describe,async check(profile){
  if(window.IPC){
   const result=window.IPC.sendSync('qp-local-data-check',profile);
   if(!result?.ok)throw Error(result?.error||'オフラインデータを確認できません。');
   if(result.missing.length)throw Error(profile+' の再生データが不足しています。データ一式を入れ直してください：'+result.missing.slice(0,4).join(', '));
  }
 }};
})();

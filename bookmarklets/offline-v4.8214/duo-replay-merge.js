/* Build a portable two-player TTRM from the two local sides of a QP DUO run.
   No events are rewritten: frame numbers, seeds and player options remain
   exactly as each source TTR recorded them. */
(() => {
 const replayOf=data=>{
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error('TTRの内容が不正です');
  if(Array.isArray(data.replay?.rounds))throw Error('すでに複数人のTTRMは合成できません');
  const replay=data.replay;
  if(!replay?.options||!Array.isArray(replay.events)||!Number.isFinite(replay.frames))throw Error('単独プレーヤーのTTRを2本選んでください');
  return replay;
 };
 const userOf=(data,replay,fallback)=>{
  const user=data.users?.[0]||{};
  return {id:String(user.id||crypto.randomUUID().replaceAll('-','').slice(0,24)),username:String(user.username||replay.options.username||fallback).slice(0,32),avatar_revision:user.avatar_revision||0,banner_revision:user.banner_revision||0,flags:user.flags||0,country:user.country??null};
 };
 const merge=(left,right)=>{
  const a=replayOf(left),b=replayOf(right);
  const duo=[a.options.zenith_duo,b.options.zenith_duo].every(Boolean);
  if(!duo)throw Error('QP DUOで保存した左右2本のTTRを選んでください');
  const modsA=(a.options.zenith_mods||[]).slice().sort().join(','),modsB=(b.options.zenith_mods||[]).slice().sort().join(',');
  if(modsA!==modsB)throw Error('左右のMOD構成が一致しません。同じDUOプレイから保存したTTRを選んでください');
  const max=Math.max(a.frames,b.frames);
  const result={
   version:1,gamemode:'zenith',ts:left.ts||right.ts||new Date().toISOString(),
   users:[userOf(left,a,'PLAYER 1'),userOf(right,b,'PLAYER 2')],
   replay:{rounds:[[{replay:structuredClone(a)},{replay:structuredClone(b)}]]},
   local:{duoMerged:true,source:'two-local-ttr',frames:max,testMode:'duo',requiresPatch:true}
  };
  return result;
 };
 const download=data=>{const url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=window.__qpReplayDownloadName?window.__qpReplayDownloadName(data,'ttrm'):'local-qp-duo-'+String(data.ts||'undated').replace(/[^0-9A-Za-z]/g,'').slice(0,20)+'-'+String(data.replay?.rounds?.[0]?.[0]?.replay?.frames||0)+'-'+String(data.replay?.rounds?.[0]?.[1]?.replay?.frames||0)+'.ttrm';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000)};
 window.LocalDuoReplay={merge,download};
})();

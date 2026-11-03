// Selection policy only. Game events and temporary MOD effects attach separately.
(function(root){
 'use strict';
 const SOURCES=['standard','custom','both'];
 function rank(task){
  const count=Number(task.count)||1,seconds=Number(task.seconds)||0;
  const score=(task.spin?2:0)+(task.mod?2:0)+(task.requiresAttack?1:0)+Math.min(3,Math.floor(count/3))+Math.min(3,Math.floor(seconds/15));
  return ['D','C','B','A','S'][Math.min(4,Math.floor(score/2))];
 }
 function eligible(task,options={}){
  const source=options.source||'standard';
  if(!SOURCES.includes(source))throw Error('Invalid mission source');
  if(!task||!['standard','custom'].includes(task.source)||typeof task.requiresAttack!=='boolean')return false;
  if(source!=='both'&&task.source!==source)return false;
  if(task.source==='custom'&&task.mod==='volatile_reversed')return false;
  // Explicit override allows deliberately impossible practice selections.
  if(!options.attackEnabled&&task.requiresAttack&&options.includeAttackRequired!==true)return false;
  return true;
 }
 function select(tasks,options={}){return tasks.filter(task=>eligible(task,options)).map(task=>({...task,rank:rank(task),unachievableWithoutAttack:task.requiresAttack&&!options.attackEnabled}));}
 const api={eligible,select,rank};
 if(typeof module!=='undefined')module.exports=api;else root.LocalRevivePolicy=api;
})(typeof window==='undefined'?globalThis:window);

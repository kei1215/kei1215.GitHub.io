(function(root){
 const labels=[
  ['#game_custom h1','CUSTOM'],
  ['#game_custom p','play, train and experiment by your rules'],
  ['#multi_createroom h1','CUSTOM GAME'],
  ['#multi_createroom p','create public and private rooms to play by your rules'],
  ['[data-menuview="custom"] .scroller_block:first-child h1','CUSTOM'],
  ['[data-menuview="custom"] .scroller_block:first-child p','play as you wish! replays are not submitted.'],
  ['#start_custom','START'],
 ];
 function repair(document=root.document){
  let restored=0;
  if(!document?.querySelector)return restored;
  for(const [selector,text] of labels){
   const node=document.querySelector(selector);
   // Preserve translations or any intentional non-empty label. This guard
   // only repairs the missing-text failure seen after native menu updates.
   if(node&&!String(node.textContent||'').trim()){node.textContent=text;restored++}
  }
  return restored;
 }
 function install(document=root.document,Observer=root.MutationObserver){
  repair(document);
  if(!document?.documentElement||typeof Observer!=='function')return null;
  const observer=new Observer(()=>repair(document));
  observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  return observer;
 }
 const api={labels,repair,install};
 if(typeof module!=='undefined')module.exports=api;
 else {root.LocalCustomLabels=api;install()}
})(typeof window==='undefined'?globalThis:window);

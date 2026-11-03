(function(root){
 const names=['invisible','messy','volatile','nohold','doublehole','allspin','gravity','expert'];
 function build(selection={},allowModHyper=false){
  const mods=[];
  for(const name of names){const value=selection[name]||'off';if(!['off','normal','reverse'].includes(value))throw Error('Invalid MOD selection');if(value!=='off')mods.push(name+(value==='reverse'?'_reversed':''))}
  const options={zenith_mods:mods};
  if(mods.includes('messy_reversed'))options.lineclear_are=69; // native line-clear ARE = 1.15s at 60fps
  for(const name of ['messy','volatile','doublehole','allspin','gravity','expert'])options['zenith_'+name]=mods.includes(name);
  // Reverse variants still enter the native base-MOD rule handlers. Without
  // these flags, e.g. the Warlock's forbidden-clear penalty is never evaluated.
  for(const name of ['messy','volatile','allspin'])options['zenith_'+name]=mods.includes(name)||mods.includes(name+'_reversed');
  options.zenith_expert=mods.includes('expert')||mods.includes('expert_reversed');
  // Expert and The Tyrant use the native Expert garbage arrival rule.
  if(options.zenith_expert)options.garbageentry='instant';
  // Last Stand changes the engine's visible board, not just its skin or crop.
  // Apply after collecting all MODs so another selection cannot reset it.
  options.boardheight=mods.includes('volatile_reversed')?14:20;
  if(mods.includes('doublehole_reversed')){
   options.garbagecap=2;
   options.garbagecapmax=2;
  }
  options.invisible=mods.includes('invisible');options.master_invisible=mods.includes('invisible_reversed');
  // Keep the official QUICK PLAY spin detector.  The native all-spin and
  // Warlock branches are selected by zenith_allspin/zenith_mods; replacing
  // spinbonuses with generic "all" or "all+" changes mini and kick rules.
  if(mods.includes('allspin')||mods.includes('allspin_reversed'))options.spinbonuses='all-mini+';
  if(mods.includes('allspin_reversed')){options.b2bcharge_base=4;options.gincrease=0;}
  options.display_hold=!mods.includes('nohold')&&!mods.includes('nohold_reversed');
  if(mods.includes('nohold_reversed')){
   options.nextcount=1;
   options.display_shadow=false;
   options.bagtype='total mayhem';
   options.spinbonuses='mini-only';
  }
  return {options,allowModHyper:!!allowModHyper};
 }
 const api={names,build};if(typeof module!=='undefined')module.exports=api;else root.LocalQPOptions=api;
})(typeof window==='undefined'?globalThis:window);

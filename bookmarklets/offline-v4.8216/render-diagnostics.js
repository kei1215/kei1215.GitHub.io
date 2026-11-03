(() => {
 let app=null, renders=0, lastRender=0, previousRenders=0, previousTime=performance.now(),noRender=false,originalRender=null,cover=null;
 let renderCost=0,renderCostMax=0,renderSamples=0;
 const errors=[];
 function record(error){errors.push(new Date().toLocaleTimeString()+' '+String(error?.stack||error?.message||error));if(errors.length>12)errors.shift()}
 window.addEventListener('error',e=>record(e.error||e.message));
 window.addEventListener('unhandledrejection',e=>record(e.reason));
 function elementState(element){
  const r=element.getBoundingClientRect(),s=getComputedStyle(element);
  const hidden=[];for(let p=element;p;p=p.parentElement){const c=getComputedStyle(p);if(c.display==='none'||c.visibility==='hidden'||Number(c.opacity)===0||p.hidden)hidden.push(p.id||p.tagName)}
  return `${element.tagName}#${element.id||'-'} ${element.width||0}×${element.height||0} 表示領域=${Math.round(r.width)}×${Math.round(r.height)} display=${s.display} visibility=${s.visibility} opacity=${s.opacity} z=${s.zIndex} 非表示の祖先=${hidden.join(',')||'なし'}`;
 }
 const diagnostics=window.LocalRenderDiagnostics={
  attach(value){
   if(app===value)return;app=value;
   const renderer=app?.renderer;if(!renderer?.render)return;
   originalRender=renderer.render;
   renderer.render=function(...args){try{if(noRender)return;const begin=performance.now(),result=originalRender.apply(this,args),end=performance.now();renders++;lastRender=end;renderCost+=end-begin;renderCostMax=Math.max(renderCostMax,end-begin);renderSamples++;return result}catch(error){record(error);throw error}};
   const canvas=renderer.view||app.view;
   canvas?.addEventListener('webglcontextlost',()=>record('WebGL context lost（描画コンテキスト消失）'));
   canvas?.addEventListener('webglcontextrestored',()=>record('WebGL context restored'));
  },
  noRender(value){
   noRender=!!value;
   if(!cover){cover=document.createElement('div');cover.id='local-no-render-cover';cover.style.cssText='display:none;position:fixed;inset:0;background:#000;z-index:2147483646;pointer-events:none';document.body.appendChild(cover)}
   cover.style.display=noRender?'block':'none';
   document.body.classList.toggle('qp-local-no-render',noRender);
   return noRender;
  },
  isNoRender:()=>noRender,
  refresh(){
   try{
    const panel=document.getElementById('local-panel');if(!panel||panel.hidden)return;
    let out=document.getElementById('render-diagnostics');
    if(!out){out=document.createElement('pre');out.id='render-diagnostics';out.style.cssText='max-height:42vh;overflow:auto;white-space:pre-wrap;word-break:break-word;font:12px/1.4 monospace;user-select:text';(document.getElementById('local-diagnostics-section')||panel).appendChild(out)}
    const now=performance.now(),fps=(renders-previousRenders)*1000/Math.max(1,now-previousTime);previousRenders=renders;previousTime=now;
    const meanCost=renderSamples?renderCost/renderSamples:0;
    const lines=['描画診断 v4.80 '+new Date().toLocaleTimeString(),`画面=${innerWidth}×${innerHeight} DPR=${devicePixelRatio} document=${document.visibilityState}`,`body=${document.body.className}`,`Renderer=${app?.renderer?.constructor?.name||'未接続'} screen=${app?.screen?.width||0}×${app?.screen?.height||0}`,`描画=${noRender?'停止（黒画面・ゲーム処理は継続）':'有効'} 成功=${renders} 更新=${fps.toFixed(1)}/秒 最終描画=${lastRender?((now-lastRender)/1000).toFixed(1)+'秒前':'なし'} ticker=${app?.ticker?.started} FPS上限=${app?.ticker?.maxFPS} stage visible=${app?.stage?.visible} renderable=${app?.stage?.renderable} alpha=${app?.stage?.alpha} 子要素=${app?.stage?.children?.length}`,`描画1回の処理時間=平均${meanCost.toFixed(2)}ms 最大${renderCostMax.toFixed(2)}ms（直近${renderSamples}回）`];
    renderCost=0;renderCostMax=0;renderSamples=0;
    for(const canvas of document.querySelectorAll('canvas'))lines.push(elementState(canvas));
    for(const id of ['kuro','menus','preload','desktop_transition','pixi','pixi-fg']){const e=document.getElementById(id);if(e&&e.tagName!=='CANVAS')lines.push(elementState(e))}
    const stage=app?.stage;for(const child of (stage?.children||[]).slice(0,12))lines.push(`stage子 ${child.name||child.constructor?.name}: visible=${child.visible} renderable=${child.renderable} alpha=${child.alpha} pos=${child.x},${child.y} scale=${child.scale?.x},${child.scale?.y} 子=${child.children?.length||0}`);
    const resourceErrors=window.LocalUIHealth?.errors?.()||[];
    lines.push('最近の描画エラー:',...errors.length?errors:['なし']);
    lines.push('素材・UIの読み込みエラー:',...resourceErrors.length?resourceErrors:['なし']);out.textContent=lines.join('\n');
   }catch(error){record(error)}
  }
 };
 setInterval(()=>diagnostics.refresh(),1000);
})();

(() => {
 let current='UI読み込み';
 const errors=[];
 const binaryURLs=new WeakMap();
 function describe(error){return error?.stack||error?.message||String(error)}
 const health=window.LocalUIHealth={
  revision:'vO-3.5',
  stage(value){current=value},
  fail(stage,error){
   const message='['+(stage||current)+']\n'+describe(error);errors.push(message);
   const tab=document.getElementById('local-panel');
   if(tab){
    let details=document.getElementById('local-ui-error-tab');
    if(!details){details=document.createElement('details');details.id='local-ui-error-tab';details.className='local-tab-error';const summary=document.createElement('summary');summary.textContent='素材・UIの読み込みエラー';const pre=document.createElement('pre');pre.style.cssText='white-space:pre-wrap;word-break:break-word;margin:.5em 0';details.append(summary,pre);tab.appendChild(details)}
    details.open=true;details.querySelector('pre').textContent=errors.join('\n\n');
   }
   console.error('[Local vO-3.5]',stage||current,error);
  },
  errors:()=>errors.slice(),
  async check(){
   const link=document.querySelector('link[rel="stylesheet"]');
   if(!link?.sheet){const error=Error('UIのCSSを読み込めません：/css/tetrio.css');health.fail('CSS',error);throw error}
   for(const id of ['menus','solo_menu','start_40l','start_blitz','start_zen','start_custom']){
    if(!document.getElementById(id)){const error=Error('UI要素がありません：'+id);health.fail('HTML',error);throw error}
   }
  },
  checkRenderer(app){
   window.LocalRenderDiagnostics?.attach(app);
   const width=app?.screen?.width,height=app?.screen?.height;
   if(!(width>0&&height>0)||Math.abs(width-window.innerWidth)>2||Math.abs(height-window.innerHeight)>2){
    const error=Error('描画領域が画面サイズと一致しません：canvas '+width+'×'+height+' / window '+window.innerWidth+'×'+window.innerHeight);
    health.fail('画面サイズ初期化',error);throw error;
   }
  },
  complete(){current='プレイ準備完了'}
 };
 const nativeFetch=window.fetch.bind(window);
 window.fetch=async(input,...args)=>{
  let path='URL不明';try{path=new URL(input?.url||String(input),location.href).pathname||'/'}catch{}
  try{
   const response=await nativeFetch(input,...args);
   if(!response.ok&&/^\/(res|sfx|css)\//.test(path)){
    const error=Error(path+' HTTP '+response.status);error.localUIReported=true;
    health.fail('素材',error);throw error;
   }
   const arrayBuffer=response.arrayBuffer.bind(response);
   response.arrayBuffer=async()=>{const data=await arrayBuffer();binaryURLs.set(data,path);return data};return response;
  }catch(error){if(!error.localUIReported&&/^\/(res|sfx|css)\//.test(path))health.fail('素材取得 '+path,error);throw error}
 };
 if(window.AudioContext){
  const nativeDecode=AudioContext.prototype.decodeAudioData;
  AudioContext.prototype.decodeAudioData=function(buffer,...args){
   const path=binaryURLs.get(buffer)||'音声ファイル（展開後のデータ）';
   try{const result=nativeDecode.call(this,buffer,...args);return result?.catch?result.catch(error=>{health.fail('音声デコード '+path,error);throw error}):result}
   catch(error){health.fail('音声デコード '+path,error);throw error}
  };
 }
 window.addEventListener('error',event=>{
  const target=event.target;
  if(target?.tagName==='SCRIPT'||target?.tagName==='LINK')health.fail('UIファイル',Error(target.src||target.href));
  else if(event.error)health.fail(current,event.error);
 },true);
})();

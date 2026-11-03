/* Local room-setting library shared by the official and offline desktop pages.
   It only stores JSON in this device's app-data folder: it never creates or
   updates an online TETR.IO room. */
(() => {
 const fallbackKey='qp-local-room-presets-fallback-v1';
 const valid=value=>value&&value.schema===1&&Array.isArray(value.presets)&&value.presets.length<=64;
 const read=()=>{try{const value=window.QPLocalStorage?.readRoomPresets?.();if(valid(value))return value}catch(error){console.warn('room preset read',error)}try{const value=JSON.parse(localStorage.getItem(fallbackKey)||'{"schema":1,"presets":[]}');return valid(value)?value:{schema:1,presets:[]}}catch{return {schema:1,presets:[]}}};
 const write=value=>{if(!valid(value))throw Error('ルーム設定の保存形式が不正です');if(window.QPLocalStorage?.writeRoomPresets){window.QPLocalStorage.writeRoomPresets(value);return}localStorage.setItem(fallbackKey,JSON.stringify(value))};
 const save=(name,settings)=>{const value=read();value.presets.push({id:crypto.randomUUID(),name:String(name||'ルーム設定').trim().slice(0,64)||'ルーム設定',settings:structuredClone(settings)});write(value)};
 const attach=()=>{
  const panel=document.getElementById('local-panel');if(!panel||document.getElementById('local-room-presets'))return;
  const section=document.createElement('details');section.id='local-room-presets';const summary=document.createElement('summary');summary.textContent='ルーム設定の保存（端末内・オンライン/オフライン共通）';section.appendChild(summary);
  const note=document.createElement('p');note.textContent='貼り付けた room / match.* / options.* のJSONを保存できます。ここから公式ルームへ送信・作成はしません。';section.appendChild(note);
  const name=document.createElement('input');name.placeholder='設定名';name.maxLength=64;section.appendChild(name);
  const json=document.createElement('textarea');json.rows=8;json.style.width='100%';json.value=JSON.stringify({name:'TETRA LEAGUE',match:{gamemode:'versus',ft:5,wb:1,gp:0},options:{stock:0,bagtype:'7-bag',spinbonuses:'all-mini+',combotable:'multiplier',allow180:1,kickset:'SRS+',allow_harddrop:1,display_next:1,display_hold:1,nextcount:5,boardwidth:10,boardheight:20}},null,2);section.appendChild(json);
  const saved=document.createElement('select');section.appendChild(saved);const status=document.createElement('p');section.appendChild(status);
  const refresh=()=>{const previous=saved.value;saved.replaceChildren();for(const item of read().presets){const option=document.createElement('option');option.value=item.id;option.textContent=item.name;saved.appendChild(option)}if([...saved.options].some(option=>option.value===previous))saved.value=previous;status.textContent='保存済み '+saved.options.length+'件'};
  const button=(label,fn)=>{const value=document.createElement('button');value.textContent=label;value.onclick=()=>{try{fn();refresh()}catch(error){status.textContent=error.message}};section.appendChild(value)};
  button('現在のJSONを保存',()=>save(name.value,JSON.parse(json.value)));
  button('選択を読み込む',()=>{const item=read().presets.find(item=>item.id===saved.value);if(!item)throw Error('設定を選択してください');name.value=item.name;json.value=JSON.stringify(item.settings,null,2)});
  button('選択を削除',()=>{const value=read();const before=value.presets.length;value.presets=value.presets.filter(item=>item.id!==saved.value);if(before===value.presets.length)throw Error('設定を選択してください');write(value)});
  panel.appendChild(section);refresh();
 };
 window.LocalRoomPresets={read,write,save};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
})();

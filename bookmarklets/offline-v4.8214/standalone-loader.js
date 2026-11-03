/* tetrio-patch 4.8214 standalone Blob OFFLINE loader. */
(() => {
  'use strict';
  const VERSION = '4.8214';
  const BASE = `https://kei1215.github.io/bookmarklets/offline-v${VERSION}/`;
  const stateKey = '__tetrioStandaloneOfflineLoading';
  if (window[stateKey]) return;
  window[stateKey] = true;

  const popup = window.__tetrioStandaloneOfflineTarget || window.open('', '_blank');
  delete window.__tetrioStandaloneOfflineTarget;
  const target = popup || window;
  const show = message => {
    try {
      target.document.open();
      target.document.write(`<!doctype html><meta charset="utf-8"><title>OFFLINE v${VERSION}</title><style>body{margin:0;display:grid;min-height:100vh;place-items:center;background:#0d1018;color:#eaf2ff;font:16px/1.6 system-ui}.box{max-width:720px;padding:28px;border:1px solid #50739a;border-radius:12px;background:#151b27;white-space:pre-wrap}</style><div class="box">${String(message).replace(/[&<>]/g, value => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[value]))}</div>`);
      target.document.close();
    } catch {}
  };
  const digest = async bytes => {
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(hash)].map(value => value.toString(16).padStart(2, '0')).join('');
  };
  const request = async (url, type) => {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw Error(`${response.status} ${url}`);
    return type === 'buffer' ? response.arrayBuffer() : type === 'json' ? response.json() : response.text();
  };

  (async () => {
    if (location.hostname !== 'tetr.io') throw Error('このブックマークは https://tetr.io/ で実行してください。');
    show(`TETR.IO OFFLINE v${VERSION}\n公式データとOFFLINE差分を準備しています…`);
    const [sourceBuffer, metadata, patchBuffer, template] = await Promise.all([
      request('https://tetr.io/js/tetrio.js', 'buffer'),
      request(BASE + 'client.patch.json', 'json'),
      request(BASE + 'client.patch.bin', 'buffer'),
      request(BASE + 'offline-template.html', 'text'),
    ]);
    const source = new Uint8Array(sourceBuffer);
    const additions = new Uint8Array(patchBuffer);
    if (source.length !== metadata.sourceLength || await digest(sourceBuffer) !== metadata.sourceSha256) {
      throw Error('TETR.IO本体が更新されています。対応版のブックマークレットへ更新してください。');
    }
    const targetBytes = new Uint8Array(metadata.targetLength);
    let cursor = 0;
    for (const [kind, offset, length] of metadata.ops) {
      targetBytes.set((kind === 0 ? source : additions).subarray(offset, offset + length), cursor);
      cursor += length;
    }
    if (cursor !== targetBytes.length || await digest(targetBytes.buffer) !== metadata.targetSha256) {
      throw Error('OFFLINE差分の検証に失敗しました。ページを再読み込みしてやり直してください。');
    }
    const clientUrl = URL.createObjectURL(new Blob([targetBytes], { type: 'text/javascript' }));
    const page = template.replace('__CLIENT_BLOB_URL__', clientUrl);
    const pageUrl = URL.createObjectURL(new Blob([page], { type: 'text/html' }));
    target.location.replace(pageUrl);
    setTimeout(() => { window[stateKey] = false; }, 1500);
  })().catch(error => {
    window[stateKey] = false;
    show(`OFFLINEを起動できませんでした。\n${error.message}`);
    console.error('[tetrio-patch standalone offline]', error);
  });
})();

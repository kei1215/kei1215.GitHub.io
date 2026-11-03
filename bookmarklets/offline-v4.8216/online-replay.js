/* Load authenticated TETR.IO replay records inside the isolated Blob client.
 * This module never starts rooms, matchmaking, spectating, or online play.
 */
(() => {
  'use strict';
  const parseId = value => {
    const input = String(value || '').trim();
    const hash = input.match(/(?:^|[#/])R:([A-Za-z0-9_-]{6,64})(?:$|[?&#/])/i);
    const plain = input.match(/^(?:R:)?([A-Za-z0-9_-]{6,64})$/i);
    return (hash?.[1] || plain?.[1] || '').trim();
  };
  const install = () => {
    const panel = document.getElementById('local-panel');
    if (!panel || document.getElementById('local-online-replay')) return false;
    const section = document.createElement('details');
    section.id = 'local-online-replay';
    const title = document.createElement('summary');
    title.textContent = 'オンラインリプレイを読み込む';
    const note = document.createElement('p');
    note.textContent = 'リプレイID、R:ID、またはTETR.IOのリプレイURLを入力します。オンライン対戦や観戦は開始しません。';
    const row = document.createElement('form');
    row.style.cssText = 'display:flex;gap:.45em;flex-wrap:wrap';
    const input = document.createElement('input');
    input.placeholder = 'R:xxxxxxxxxxxx';
    input.autocomplete = 'off';
    input.style.flex = '1 1 16em';
    const button = document.createElement('button');
    button.type = 'submit';
    button.textContent = '読み込む';
    const status = document.createElement('p');
    row.append(input, button);
    section.append(title, note, row, status);
    panel.appendChild(section);
    row.addEventListener('submit', async event => {
      event.preventDefault();
      if (button.disabled) return;
      try {
        const id = parseId(input.value);
        if (!id) throw Error('リプレイIDまたはURLを確認してください');
        if (window.OriginalReplay?.game?.()?.isPlaying()) throw Error('現在のプレイを終了してから読み込んでください');
        button.disabled = true;
        status.textContent = 'TETR.IOからリプレイを取得しています…';
        await window.LocalReplayData?.check?.('versus');
        await window.OriginalReplay?.init?.();
        window.LocalNative?.stop?.();
        window.OriginalReplay?.stop?.();
        const result = await window.LocalNative.onlineReplay(id);
        panel.hidden = true;
        status.textContent = `${result.multi ? '対戦' : '1人用'}リプレイを読み込みました。記録画面から再生するラウンドを選んでください。`;
      } catch (error) {
        status.textContent = `読み込み失敗: ${error.message}`;
        window.LocalUIHealth?.fail?.('オンラインリプレイ', error);
      } finally {
        button.disabled = false;
      }
    });
    return true;
  };
  if (!install()) {
    const observer = new MutationObserver(() => { if (install()) observer.disconnect(); });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();

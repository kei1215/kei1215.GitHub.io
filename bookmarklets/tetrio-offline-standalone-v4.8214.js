/* tetrio-patch v4.8214 standalone Blob OFFLINE bookmarklet source. */
(() => {
  if (location.hostname !== 'tetr.io') {
    alert('このブックマークは https://tetr.io/ で実行してください。');
    return;
  }
  window.__tetrioStandaloneOfflineTarget = window.open('', '_blank');
  const script = document.createElement('script');
  script.src = 'https://kei1215.github.io/bookmarklets/offline-v4.8214/standalone-loader.js?t=' + Date.now();
  script.onerror = () => {
    window.__tetrioStandaloneOfflineTarget?.close();
    delete window.__tetrioStandaloneOfflineTarget;
    alert('OFFLINE起動プログラムを読み込めませんでした。');
  };
  document.documentElement.appendChild(script);
})();

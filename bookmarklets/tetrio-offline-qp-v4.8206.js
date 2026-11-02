/* tetrio-patch v4.8206 OFFLINE QP rotation bookmarklet source.
 * This script intentionally refuses every online page and every non-QP board.
 */
(() => {
  const show = message => {
    let node = document.getElementById('tetrio-patch-bookmarklet-status');
    if (!node) {
      node = document.createElement('div');
      node.id = 'tetrio-patch-bookmarklet-status';
      node.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647;max-width:420px;padding:12px 16px;border:1px solid #8fb8df;border-radius:8px;background:#111a26ee;color:#fff;font:14px system-ui;white-space:pre-wrap';
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.hidden = false;
    clearTimeout(node._hideTimer);
    node._hideTimer = setTimeout(() => { node.hidden = true; }, 5000);
  };

  const offline = location.protocol === 'tetrio-local:' || window.__qpLocalOffline === true || document.body?.classList.contains('socket_offline');
  const games = (() => {
    try {
      const local = window.LocalAIRoom?.getGames?.();
      if (Array.isArray(local) && local.length) return local;
      return [...(window.__qpGameRegistry || [])];
    } catch {
      return [];
    }
  })();
  const qpActive = games.some(game => game?.isPlaying?.() !== false && (game?.options?.zenith || game?.state?.setoptions?.zenith));

  if (!offline) {
    show('Blocked: this bookmarklet works only in OFFLINE QP.');
    return;
  }
  if (!qpActive) {
    show('Start an OFFLINE QP game first, then run the bookmarklet again.');
    return;
  }
  if (!window.LocalRotateCommand?.command) {
    show('The v4.8206 OFFLINE QP runtime was not found. Install tetrio-patch vO4.8206 or vA4.8206 first.');
    return;
  }
  window.LocalRotateCommand.command('/rotate');
})();


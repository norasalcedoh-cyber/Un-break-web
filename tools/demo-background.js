// Session-only state, keyed by the sender tab. No browsing content is stored.
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id || !sender.tab || sender.frameId !== 0) return;
  let url;
  try { url = new URL(sender.url); } catch { return; }
  if (url.origin !== 'https://www.instagram.com') return;
  if (!message || !['demo:get', 'demo:set'].includes(message.type)) return;
  if (message.type === 'demo:set' && typeof message.enabled !== 'boolean') return;
  const key = `demo-tab-${sender.tab.id}`;
  (async () => {
    if (message.type === 'demo:set') {
      if (message.enabled) await chrome.storage.session.set({ [key]: true });
      else await chrome.storage.session.remove(key);
    }
    const state = await chrome.storage.session.get(key);
    respond({ ok: true, enabled: state[key] === true });
  })().catch(() => respond({ ok: false }));
  return true;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.session.remove(`demo-tab-${tabId}`).catch(() => {});
});

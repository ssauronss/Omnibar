const browser = globalThis.browser ?? globalThis.chrome;

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      let res;
      switch (msg.type) {
        case 'GET_DATA': {
          const [tabs, history] = await Promise.all([
            browser.tabs.query({}),
            browser.history.search({ text: '', maxResults: 500, startTime: 0 })
          ]);
          res = {
            tabs: tabs.map(t => ({
              id: t.id, windowId: t.windowId, url: t.url || '', title: t.title || 'Untitled',
              favicon: t.favIconUrl, time: Date.now(), type: 'tab', active: t.active
            })),
            history: history.map(h => ({
              url: h.url, title: h.title || h.url, time: h.lastVisitTime, type: 'history'
            }))
          };
          break;
        }
        case 'SWITCH_TAB':
          await browser.windows.update(msg.windowId, { focused: true });
          await browser.tabs.update(msg.tabId, { active: true });
          res = { ok: true };
          break;
        case 'NAVIGATE': {
          const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
          if (tab) await browser.tabs.update(tab.id, { url: msg.url });
          res = { ok: true };
          break;
        }
        default:
          res = { error: 'Unknown' };
      }
      sendResponse(res);
    } catch (e) {
      sendResponse({ error: e?.message || String(e) });
    }
  })();
  return true;
});

browser.commands.onCommand.addListener(async cmd => {
  if (cmd !== 'open-omnibar') return;
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) await browser.tabs.sendMessage(tab.id, { type: 'TOGGLE_OMNIBAR' });
  } catch {}
});

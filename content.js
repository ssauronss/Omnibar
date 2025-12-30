(function() {
  'use strict';
  
  const B = globalThis.browser || globalThis.chrome;
  if (window.__omnibar) return;
  window.__omnibar = true;

  let open = false, root = null, idx = 0, results = [], data = { tabs: [], history: [] };
  let uf = null, cache = [], scope = 'tabs', debounceId = null;

  const SCOPES = ['tabs', 'history', 'web'];
  const PLACEHOLDERS = { tabs: 'Search open tabs...', history: 'Search history...', web: 'Enter URL or search...' };
  const ICONS = {
    globe: `<svg width="20" height="20" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="9" stroke="currentColor" stroke-width="1.4"/><ellipse cx="11" cy="11" rx="4" ry="9" stroke="currentColor" stroke-width="1.4"/><path d="M2 11h18M3.5 6h15M3.5 16h15" stroke="currentColor" stroke-width="1.2"/></svg>`,
    tabs: `<svg width="20" height="20" viewBox="0 0 22 22" fill="none"><rect x="2" y="7" width="14" height="11" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M5 7V5.5A2.5 2.5 0 017.5 3h10A2.5 2.5 0 0120 5.5v8a2.5 2.5 0 01-2.5 2.5H16" stroke="currentColor" stroke-width="1.4"/></svg>`,
    history: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4.5 4.5C6 3 8 2 10.5 2C15 2 18 5.5 18 10C18 14.5 14.5 18 10 18C5.5 18 2 14.5 2 10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M4.5 1.5V5H8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 6V10.5L13 12.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    search: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" stroke-width="1.2"/><path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
    windowStack: `<svg width="20" height="20" viewBox="0 0 22 22" fill="none"><rect x="1" y="8" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.3"/><path d="M4 8V6a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-1" stroke="currentColor" stroke-width="1.3"/><path d="M7 4V3a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-1" stroke="currentColor" stroke-width="1.3"/><line x1="1" y1="11" x2="15" y2="11" stroke="currentColor" stroke-width="1.3"/></svg>`,
    clockRotate: `<svg width="20" height="20" viewBox="0 0 22 22" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.3"/><path d="M12 7v5.5l3.5 2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M4 4v4h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  };

  const esc = s => s?.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]) || '';
  const isUrl = s => { try { return !s.includes(' ') && (new URL(s), true); } catch { return /^[\w-]+\.[\w.-]+/.test(s); } };
  const toUrl = s => s.startsWith('http') ? s : `https://${s}`;
  const searchUrl = q => `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  const fmtUrl = u => { try { const x = new URL(u); return x.hostname.replace(/^www\./, '') + (x.pathname.length > 30 ? x.pathname.slice(0, 27) + '...' : x.pathname); } catch { return u; } };

  const filter = (hay, needle) => {
    if (!uf) return [];
    let best = null;
    for (const c of cache) if (needle.startsWith(c.n) && (!best || c.n.length > best.n.length)) best = c;
    if (cache.length && !best) cache.length = 0;
    const idxs = !best ? uf.filter(hay, needle) : best.n === needle ? best.i : uf.filter(hay, needle, best.i);
    if (idxs?.length <= 1e4 && (!best || needle !== best.n)) {
      cache.push({ n: needle, i: idxs });
      if (cache.length > 10) cache.shift();
    }
    return idxs || [];
  };

  const search = q => {
    if (scope === 'web') return q.trim() ? [{ type: 'action', title: isUrl(q) ? `Go to ${q}` : `Search "${q}"`, query: q, icon: isUrl(q) ? 'globe' : 'search' }] : [];
    const src = scope === 'history' ? data.history : data.tabs.filter(t => !t.active);
    if (!q.trim()) return src.slice(0, 5);
    const hay = src.map(x => `${x.title} ${x.url}`);
    const idxs = filter(hay, q);
    if (!uf || !idxs.length) return src.filter(x => `${x.title} ${x.url}`.toLowerCase().includes(q.toLowerCase())).slice(0, 10);
    const [, info, order] = uf.search(hay, q, 0, 1e3, idxs);
    return order ? order.map(i => src[info.idx[i]]).slice(0, 10) : idxs.slice(0, 10).map(i => src[i]);
  };

  const render = items => {
    const box = root.querySelector('.omnibar-results');
    results = items;
    idx = Math.min(idx, Math.max(0, items.length - 1));
    if (!items.length) { box.innerHTML = ''; box.classList.remove('visible'); return; }
    const frag = document.createDocumentFragment();
    items.forEach((it, i) => {
      const div = document.createElement('div');
      div.className = 'omnibar-item' + (i === idx ? ' selected' : '');
      div.dataset.index = i;
      const icon = it.icon ? ICONS[it.icon] : it.type === 'tab' ? ICONS.windowStack : ICONS.clockRotate;
      div.innerHTML = `<span class="omnibar-item-icon">${icon}</span><span class="omnibar-item-text">${esc(it.title)}</span>${it.url ? `<span class="omnibar-item-meta">${esc(fmtUrl(it.url))}</span>` : ''}`;
      frag.appendChild(div);
    });
    box.innerHTML = '';
    box.appendChild(frag);
    box.classList.add('visible');
  };

  const setScope = s => {
    scope = s;
    idx = 0;
    cache.length = 0;
    const input = root.querySelector('.omnibar-input');
    input.value = '';
    input.placeholder = PLACEHOLDERS[s];
    root.querySelectorAll('.omnibar-scope-button').forEach(b => b.classList.toggle('active', b.dataset.scope === s));
    render(search(''));
  };

  const updateSel = () => {
    root.querySelectorAll('.omnibar-item').forEach((el, i) => el.classList.toggle('selected', i === idx));
    root.querySelector('.omnibar-item.selected')?.scrollIntoView({ block: 'nearest' });
  };

  const select = async () => {
    if (!results.length) return;
    const it = results[idx];
    try {
      if (it.type === 'action') await B.runtime.sendMessage({ type: 'NAVIGATE', url: isUrl(it.query) ? toUrl(it.query) : searchUrl(it.query) });
      else if (it.type === 'tab') await B.runtime.sendMessage({ type: 'SWITCH_TAB', tabId: it.id, windowId: it.windowId });
      else await B.runtime.sendMessage({ type: 'NAVIGATE', url: it.url });
    } catch {}
    close();
  };

  const openOmni = async () => {
    if (open) return;
    open = true;
    try {
      data = await B.runtime.sendMessage({ type: 'GET_DATA' });
      if (!data || data.error) { console.error('Omnibar GET_DATA failed:', data); data = { tabs: [], history: [] }; }
    } catch (e) { console.error('Omnibar GET_DATA threw:', e); data = { tabs: [], history: [] }; }
    if (!uf) {
      try {
        const { default: UF } = await import(B.runtime.getURL('vendor/ufuzzy.min.js'));
        uf = new UF({ intraMode: 0, intraIns: 1 });
      } catch {}
    }
    if (!root) {
      root = document.createElement('div');
      root.id = 'omnibar-root';
      root.innerHTML = `<div class="omnibar-backdrop"></div><div class="omnibar"><div class="omnibar-scope-selector">${SCOPES.map(s => `<button class="omnibar-scope-button${s === 'tabs' ? ' active' : ''}" data-scope="${s}" title="${s}">${ICONS[s === 'web' ? 'globe' : s]}</button>`).join('')}</div><div class="omnibar-main"><div class="omnibar-input-wrapper"><input type="text" class="omnibar-input" placeholder="${PLACEHOLDERS.tabs}" autocomplete="off" spellcheck="false"></div><div class="omnibar-results"></div></div></div>`;
      document.body.appendChild(root);
      const input = root.querySelector('.omnibar-input');
      input.addEventListener('input', e => {
        clearTimeout(debounceId);
        debounceId = setTimeout(() => { idx = 0; render(search(e.target.value)); }, 50);
      });
      input.addEventListener('keydown', e => {
        const handlers = {
          Tab: () => setScope(SCOPES[(SCOPES.indexOf(scope) + (e.shiftKey ? 2 : 1)) % 3]),
          ArrowDown: () => results.length && (idx = (idx + 1) % results.length, updateSel()),
          ArrowUp: () => results.length && (idx = (idx - 1 + results.length) % results.length, updateSel()),
          Enter: select,
          Escape: close
        };
        if (handlers[e.key]) { e.preventDefault(); handlers[e.key](); }
      });
      root.querySelector('.omnibar-backdrop').addEventListener('click', close);
      root.querySelector('.omnibar-results').addEventListener('click', e => {
        const el = e.target.closest('.omnibar-item');
        if (el) { idx = +el.dataset.index; select(); }
      });
      root.querySelectorAll('.omnibar-scope-button').forEach(b => b.addEventListener('click', () => setScope(b.dataset.scope)));
    }
    root.classList.add('open');
    setScope('tabs');
    requestAnimationFrame(() => root.querySelector('.omnibar-input').focus());
  };

  const close = () => { if (open) { open = false; root?.classList.remove('open'); } };

  B.runtime.onMessage.addListener(msg => msg.type === 'TOGGLE_OMNIBAR' && (open ? close() : openOmni()));
  document.addEventListener('keydown', e => { if (e.metaKey && e.key === 'k' && !e.shiftKey && !e.altKey && !e.ctrlKey) { e.preventDefault(); e.stopPropagation(); open ? close() : openOmni(); } }, true);
})();

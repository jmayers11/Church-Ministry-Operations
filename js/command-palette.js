/* =============================================================
   command-palette.js  —  ⌘K / Ctrl+K global search
   Searches: pages, members, events, prayer requests
   ============================================================= */

const CommandPalette = (() => {
  'use strict';

  const overlay = document.getElementById('cmd-overlay');
  const input   = document.getElementById('cmd-input');
  const results = document.getElementById('cmd-results');

  let _items     = [];   // flat ordered list for keyboard nav
  let _activeIdx = -1;

  // ── Static page index ─────────────────────────────────────────
  const PAGES = [
    { id:'dashboard',         label:'Dashboard',           icon:'layout-dashboard' },
    { id:'request-inbox',     label:'Request Inbox',       icon:'inbox' },
    { id:'members',           label:'Members',             icon:'users' },
    { id:'visitors',          label:'Visitors',            icon:'user-plus' },
    { id:'prayer',            label:'Prayer Requests',     icon:'hand-heart' },
    { id:'events',            label:'Events',              icon:'calendar-days' },
    { id:'impact',            label:'Impact Dashboard',    icon:'sparkles' },
    { id:'foodpantry',        label:'Food Pantry',         icon:'shopping-basket' },
    { id:'family-assistance', label:'Family Assistance',   icon:'home' },
    { id:'care',              label:'Care Ministry',       icon:'heart-handshake' },
    { id:'community-events',  label:'Community Events',    icon:'globe' },
    { id:'volunteer-center',  label:'Volunteer Center',    icon:'helping-hand' },
    { id:'volunteers',        label:'Volunteer Roster',    icon:'clipboard-list' },
    { id:'resources',         label:'Resources',           icon:'package' },
    { id:'scorecard',         label:'Health Scorecard',    icon:'activity' },
    { id:'giving',            label:'Giving',              icon:'hand-coins' },
    { id:'communications',    label:'Communications',      icon:'megaphone' },
    { id:'facilities',        label:'Facilities',          icon:'building-2' },
    { id:'tasks',             label:'Task Manager',        icon:'check-square' },
    { id:'sermons',           label:'Sermon Library',      icon:'book-open' },
    { id:'ministries',        label:'Ministries',          icon:'church' },
    { id:'settings',          label:'Settings',            icon:'settings' },
  ];

  // ── Fuzzy match: substring with position score ────────────────
  function match(query, text) {
    if (!text) return null;
    if (!query) return { score: 50, hl: esc(text) };
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    const i = t.indexOf(q);
    if (i === -1) return null;
    const score = i === 0 ? 100 : i < 4 ? 80 : 60;
    const hl = esc(text.slice(0, i))
             + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>'
             + esc(text.slice(i + q.length));
    return { score, hl };
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  // ── Build groups ─────────────────────────────────────────────
  function buildGroups(query) {
    const q = (query || '').trim();
    const groups = [];

    // Pages
    const pageItems = [];
    for (const p of PAGES) {
      const m = match(q, p.label);
      if (m) pageItems.push({ label: p.label, hl: m.hl, score: m.score,
        icon: p.icon, sub: null,
        action() { Navigation.navigate(p.id); } });
    }
    pageItems.sort((a, b) => b.score - a.score).splice(q ? 5 : 8);
    if (pageItems.length) groups.push({ label: 'Pages', items: pageItems });

    if (q.length >= 2) {
      // Members
      const memberItems = [];
      for (const m of (Storage.getAll('members') || [])) {
        const name = ((m.firstName || '') + ' ' + (m.lastName || '')).trim();
        const r = match(q, name);
        if (r) memberItems.push({ label: name, hl: r.hl, score: r.score,
          icon: 'user',
          sub: [m.status, m.cellPhone].filter(Boolean).join(' · '),
          action() { Navigation.navigate('members'); } });
      }
      memberItems.sort((a, b) => b.score - a.score).splice(4);
      if (memberItems.length) groups.push({ label: 'Members', items: memberItems });

      // Events
      const eventItems = [];
      for (const e of (Storage.getAll('events') || [])) {
        const r = match(q, e.name || '');
        if (r) eventItems.push({ label: e.name, hl: r.hl, score: r.score,
          icon: 'calendar',
          sub: [UI.fmtDate(e.date), e.location].filter(Boolean).join(' · '),
          action() { Navigation.navigate('events'); } });
      }
      eventItems.sort((a, b) => b.score - a.score).splice(3);
      if (eventItems.length) groups.push({ label: 'Events', items: eventItems });

      // Prayer requests
      const prayerItems = [];
      for (const p of (Storage.getAll('prayer') || [])) {
        const name = p.submittedBy || '';
        const r = match(q, name);
        if (r) prayerItems.push({ label: name, hl: r.hl, score: r.score,
          icon: 'hand-heart',
          sub: p.request ? p.request.slice(0, 60) + (p.request.length > 60 ? '…' : '') : '',
          action() { Navigation.navigate('prayer'); } });
      }
      prayerItems.sort((a, b) => b.score - a.score).splice(3);
      if (prayerItems.length) groups.push({ label: 'Prayer', items: prayerItems });
    }

    return groups;
  }

  // ── Render ───────────────────────────────────────────────────
  function render(groups) {
    _items = [];
    if (!groups.length) {
      results.innerHTML = '<div class="cmd-results-empty">No results</div>';
      return;
    }
    let html = '';
    for (const g of groups) {
      html += `<div class="cmd-group-label">${esc(g.label)}</div>`;
      for (const item of g.items) {
        const idx = _items.length;
        _items.push(item);
        html += `<div class="cmd-item" data-idx="${idx}" role="option">
          <div class="cmd-item-icon"><i data-lucide="${item.icon}" aria-hidden="true"></i></div>
          <div class="cmd-item-body">
            <div class="cmd-item-title">${item.hl}</div>
            ${item.sub ? `<div class="cmd-item-sub">${esc(item.sub)}</div>` : ''}
          </div>
        </div>`;
      }
    }
    results.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // ── Keyboard active state ─────────────────────────────────────
  function setActive(idx) {
    results.querySelectorAll('.cmd-item').forEach(el => el.classList.remove('cmd-active'));
    _activeIdx = Math.max(0, Math.min(idx, _items.length - 1));
    const el = results.querySelector(`.cmd-item[data-idx="${_activeIdx}"]`);
    if (el) { el.classList.add('cmd-active'); el.scrollIntoView({ block: 'nearest' }); }
  }

  function activate(idx) {
    const item = _items[idx];
    if (!item) return;
    close();
    item.action();
  }

  // ── Open / close ─────────────────────────────────────────────
  function open() {
    if (!document.body.classList.contains('app-unlocked')) return;
    overlay.classList.remove('hidden');
    input.value = '';
    _activeIdx = -1;
    render(buildGroups(''));
    requestAnimationFrame(() => input.focus());
  }

  function close() {
    overlay.classList.add('hidden');
    _activeIdx = -1;
    _items = [];
    results.innerHTML = '';
  }

  // ── Event listeners ──────────────────────────────────────────
  input.addEventListener('input', () => {
    _activeIdx = -1;
    render(buildGroups(input.value));
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown')  { e.preventDefault(); setActive(_activeIdx + 1); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(_activeIdx - 1); }
    else if (e.key === 'Enter')     { if (_activeIdx >= 0) activate(_activeIdx); else if (_items.length === 1) activate(0); }
    else if (e.key === 'Escape')    { close(); }
  });

  // Click on result item (event delegation)
  results.addEventListener('click', e => {
    const item = e.target.closest('.cmd-item');
    if (item) activate(parseInt(item.dataset.idx, 10));
  });

  // Hover highlights active item
  results.addEventListener('mousemove', e => {
    const item = e.target.closest('.cmd-item');
    if (item) setActive(parseInt(item.dataset.idx, 10));
  });

  // Click outside closes
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  // Global shortcut: ⌘K / Ctrl+K
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      overlay.classList.contains('hidden') ? open() : close();
    }
  });

  // Topbar trigger button
  document.getElementById('cmd-trigger-btn')?.addEventListener('click', open);

  return { open, close };
})();

window.CommandPalette = CommandPalette;

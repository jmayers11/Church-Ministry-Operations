/* =============================================================
   ui-components.js  —  Higher-level render helpers (Phase 2)
   Extends the global UI object defined in app.js.
   Must load AFTER app.js.
   ============================================================= */

// ── UI.kpi ──────────────────────────────────────────────────
// Renders a KPI widget card as an HTML string.
//
// Options:
//   icon        — Lucide icon name (e.g. 'users')
//   value       — numeric value (number or string)
//   label       — display label (e.g. 'Active Members')
//   meta        — small subtitle text below label (optional)
//   delta       — delta label text (optional, e.g. '+12%')
//   deltaDir    — 'up' | 'down' | 'flat'  (default: 'flat')
//   onClickPage — Navigation page id; makes card a link
//   accent      — 'brand' | 'success' | 'warning' | 'danger' | 'gold' | 'info'
UI.kpi = function({ icon, value, label, meta, delta, deltaDir, onClickPage, accent = 'brand' }) {
  const ACCENTS = {
    brand:   { bg: 'var(--accent-subtle)',    fg: 'var(--accent)' },
    success: { bg: 'var(--success-bg)',       fg: 'var(--success-text)' },
    warning: { bg: 'var(--warning-bg)',       fg: 'var(--warning-text)' },
    danger:  { bg: 'var(--danger-bg)',        fg: 'var(--danger-text)' },
    gold:    { bg: 'var(--gold-100)',         fg: 'var(--gold-600)' },
    info:    { bg: 'var(--info-bg)',          fg: 'var(--info-text)' },
  };
  const { bg, fg } = ACCENTS[accent] || ACCENTS.brand;

  // Delta chip
  let deltaHtml = '';
  if (delta) {
    const dir = deltaDir || 'flat';
    const arrow = dir === 'up' ? '▲ ' : dir === 'down' ? '▼ ' : '';
    deltaHtml = `<span class="kpi__delta kpi__delta--${dir}">${arrow}${UI.esc(String(delta))}</span>`;
  }

  // Clickable attrs for keyboard + mouse navigation
  const clickAttrs = onClickPage ? [
    `role="link"`,
    `tabindex="0"`,
    `onclick="Navigation.navigate('${onClickPage}')"`,
    `onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();Navigation.navigate('${onClickPage}')}"`,
    `aria-label="${UI.esc(label)}: ${value}. Activate to view details."`,
  ].join(' ') : '';

  const numVal = typeof value === 'number' ? value
    : parseInt(String(value).replace(/[^0-9]/g, ''), 10) || 0;

  return `
    <div class="kpi${onClickPage ? ' kpi--clickable' : ''}" ${clickAttrs}>
      <div class="kpi__top">
        <div class="kpi__icon" style="background:${bg};color:${fg}">
          <i data-lucide="${icon}" aria-hidden="true"></i>
        </div>
        ${deltaHtml}
      </div>
      <div class="kpi__value" data-count-target="${numVal}">${numVal.toLocaleString()}</div>
      <div class="kpi__label">${UI.esc(label)}</div>
      ${meta ? `<div class="kpi__meta">${UI.esc(String(meta))}</div>` : ''}
    </div>`;
};

// ── UI.card ──────────────────────────────────────────────────
// Renders a card as an HTML string.
//
// Options:
//   title    — card title text
//   subtitle — card subtitle text (optional)
//   action   — raw HTML for header action (e.g. a button)
//   body     — raw HTML for card body
//   variant  — space-separated card modifier(s): 'interactive' | 'accent' | 'flush'
UI.card = function({ title, subtitle, action, body = '', variant = '' } = {}) {
  const mods = variant ? variant.split(' ').filter(Boolean).map(v => `card--${v}`).join(' ') : '';
  const header = (title || action) ? `
    <div class="card__header">
      <div>
        ${title ? `<div class="card__title">${UI.esc(title)}</div>` : ''}
        ${subtitle ? `<div class="card__subtitle">${UI.esc(subtitle)}</div>` : ''}
      </div>
      ${action ? `<div>${action}</div>` : ''}
    </div>` : '';
  return `<div class="card${mods ? ' ' + mods : ''}">${header}${body}</div>`;
};

// ── UI.avatar ────────────────────────────────────────────────
// Renders an avatar circle with deterministic pastel background.
//
// name  — person's full name (used for initials + color hash)
// size  — px size (default: 36)
UI.avatar = function(name, size = 36) {
  const PALETTES = [
    ['#dbeafe', '#1d4ed8'], // blue
    ['#dcfce7', '#15803d'], // green
    ['#fce7f3', '#9d174d'], // pink
    ['#fef3c7', '#92400e'], // amber
    ['#ede9fe', '#5b21b6'], // violet
    ['#fee2e2', '#b91c1c'], // red
    ['#d1fae5', '#065f46'], // teal
    ['#ffedd5', '#c2410c'], // orange
  ];
  let hash = 0;
  const s = String(name || '?');
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) | 0;
  const [bg, color] = PALETTES[Math.abs(hash) % PALETTES.length];
  const initials = s.trim().split(/\s+/).slice(0, 2).map(w => (w[0] || '')).join('').toUpperCase() || '?';
  const fs = Math.round(size * 0.38);
  return `<div class="avatar" style="width:${size}px;height:${size}px;min-width:${size}px;background:${bg};color:${color};font-size:${fs}px" aria-hidden="true">${UI.esc(initials)}</div>`;
};

// ── UI.skeleton ──────────────────────────────────────────────
// Returns skeleton shimmer rows as an HTML string.
//
// rows   — number of skeleton bars (default: 3)
// height — height of each bar in px (default: 20)
UI.skeleton = function(rows = 3, height = 20) {
  return `<div class="skeleton-wrap" style="padding:4px 0">` +
    Array.from({ length: rows }, (_, i) =>
      `<div class="skeleton" style="height:${height}px;width:${i % 3 === 2 ? '65%' : '100%'};margin-bottom:12px"></div>`
    ).join('') +
    `</div>`;
};

// ── UI.countUp ───────────────────────────────────────────────
// Animates all [data-count-target] elements from 0 → value over `ms`ms.
// No-ops silently under prefers-reduced-motion.
//
// container — DOM element to search within (default: document)
// ms        — animation duration in milliseconds (default: 600)
UI.countUp = function(container, ms) {
  container = container || document;
  ms = ms || 600;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  container.querySelectorAll('[data-count-target]').forEach(function(el) {
    const target = parseInt(el.dataset.countTarget, 10);
    if (isNaN(target) || target === 0) return;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      el.textContent = Math.round(eased * target).toLocaleString();
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
};

// ── UI.emptyState ────────────────────────────────────────────
// Renders an empty-state block as an HTML string.
//
// Options:
//   icon    — Lucide icon name
//   title   — heading text
//   body    — paragraph text (optional)
//   action  — raw HTML for a primary action button (optional)
UI.emptyState = function({ icon, title, body, action } = {}) {
  return `
    <div class="empty-state">
      ${icon ? `<div class="empty-state__icon"><i data-lucide="${icon}" aria-hidden="true"></i></div>` : ''}
      ${title ? `<div class="empty-state__title">${UI.esc(title)}</div>` : ''}
      ${body  ? `<div class="empty-state__body">${UI.esc(body)}</div>` : ''}
      ${action || ''}
    </div>`;
};

// ── UI.table ──────────────────────────────────────────────────
// Renders a responsive data table into a container element.
// At ≤640px the table transforms into a stacked card list (CSS-driven,
// no JS resize logic). Column labels appear as `::before` prefixes via
// the `data-label` attribute on each <td>.
//
// Options:
//   wrap       — string ID or Element — the .table-wrap container to populate
//   cols       — array of column definitions:
//                  { key, label, fmt, sortable, tdClass, hideOnMobile, mobileLabel }
//                fmt(value, row) → HTML string; caller must escape user content.
//                hideOnMobile:true adds class "mobile-hide" (hidden at ≤640px).
//                sortable defaults to true when sortFn is provided.
//   rows       — array of plain data objects
//   empty      — { icon, title, text } — empty-state when rows is [] or null
//   actions    — fn(row) → HTML string — right-pinned actions column (optional)
//   sort       — { col, dir } — current sort key + direction for header arrows
//   sortFn     — string — global function reference, e.g. 'Visitors.sortBy'
//                Written directly into onclick: `${sortFn}('${col.key}')`
//   selectable — string namespace (e.g. 'visitors'). Prepends a checkbox column.
//                Pairs with UI.bulkRegister(namespace, actions[]).
//   pageSize   — number (default: all). Rows beyond this get .tr-hidden;
//                a "Load more" button row is appended.
UI.table = function({ wrap, cols, rows, empty = {}, actions, sort = {}, sortFn, selectable, pageSize } = {}) {
  const container = typeof wrap === 'string' ? document.getElementById(wrap) : wrap;
  if (!container) return;

  // ── Empty state ──────────────────────────────────────────
  if (!rows || !rows.length) {
    container.innerHTML = UI.emptyState({
      icon:  empty.icon  || 'inbox',
      title: empty.title || 'No records found',
      body:  empty.text,
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  // ── Sort-arrow helpers ────────────────────────────────────
  function sortArrow(col) {
    if (!sortFn) return '';
    if (sort.col !== col.key) return '<span class="sort-arrow" aria-hidden="true">↕</span>';
    return `<span class="sort-arrow sort-arrow--active" aria-hidden="true">${sort.dir === 'asc' ? '↑' : '↓'}</span>`;
  }
  function ariaSort(col) {
    if (!sort.col || sort.col !== col.key) return 'none';
    return sort.dir === 'asc' ? 'ascending' : 'descending';
  }

  const ns = selectable;

  // ── Build <thead> ─────────────────────────────────────────
  let thead = '<thead><tr>';
  if (ns) {
    thead += `<th class="td-checkbox" style="width:36px"><input type="checkbox" class="row-checkbox" id="chk-all-${ns}" aria-label="Select all" data-ns="${ns}" onchange="UI._checkAll('${ns}',this.checked)"></th>`;
  }
  for (const col of cols) {
    const cls    = [col.tdClass || '', col.hideOnMobile ? 'mobile-hide' : ''].filter(Boolean).join(' ');
    const attrs  = cls ? ` class="${cls}"` : '';
    const active = sort.col === col.key;
    const inlineStyle = `white-space:nowrap;${active ? 'color:var(--accent);' : ''}`;
    if (sortFn && col.sortable !== false) {
      thead += `<th${attrs} aria-sort="${ariaSort(col)}" style="${inlineStyle}"><button type="button" class="sort-btn" onclick="${sortFn}('${col.key}')">${UI.esc(col.label)}${sortArrow(col)}</button></th>`;
    } else {
      thead += `<th${attrs}>${UI.esc(col.label)}</th>`;
    }
  }
  if (actions) thead += '<th class="td-actions"></th>';
  thead += '</tr></thead>';

  // ── Build <tbody> ─────────────────────────────────────────
  const limit = (pageSize && pageSize > 0) ? pageSize : rows.length;
  let tbody = '<tbody>';
  for (let i = 0; i < rows.length; i++) {
    const row    = rows[i];
    const hidden = i >= limit ? ' class="tr-hidden"' : '';
    tbody += `<tr${hidden}>`;
    if (ns) {
      const rowId  = row.id || String(i);
      const chked  = (UI._sel[ns] && UI._sel[ns].has(String(rowId))) ? ' checked' : '';
      tbody += `<td class="td-checkbox" data-label=""><input type="checkbox" class="row-checkbox"${chked} data-id="${rowId}" aria-label="Select row" onchange="UI._checkRow('${ns}','${rowId}',this.checked)"></td>`;
    }
    for (const col of cols) {
      const cls     = [col.tdClass || '', col.hideOnMobile ? 'mobile-hide' : ''].filter(Boolean).join(' ');
      const label   = UI.esc(col.mobileLabel || col.label);
      const tdAttrs = `data-label="${label}"${cls ? ` class="${cls}"` : ''}`;
      const raw     = row[col.key];
      const val     = col.fmt ? col.fmt(raw, row) : UI.esc(String(raw ?? ''));
      tbody += `<td ${tdAttrs}>${val}</td>`;
    }
    if (actions) tbody += `<td class="td-actions" data-label="">${actions(row)}</td>`;
    tbody += '</tr>';
  }

  // ── Load-more row ─────────────────────────────────────────
  if (pageSize && rows.length > pageSize) {
    const remaining = rows.length - pageSize;
    const colCount  = cols.length + (actions ? 1 : 0) + (ns ? 1 : 0);
    tbody += `<tr class="tr-load-more"><td colspan="${colCount}" style="text-align:center;padding:var(--space-3) 0">
      <button class="btn btn-outline btn-sm" onclick="UI._loadMore(this,${pageSize})">
        <i data-lucide="chevrons-down" class="icon-inline" aria-hidden="true"></i>
        Load more <span class="tr-load-more-count">(${remaining} remaining)</span>
      </button></td></tr>`;
  }
  tbody += '</tbody>';

  container.innerHTML = `<table class="data-table resp-table">${thead}${tbody}</table>`;
  if (typeof lucide !== 'undefined') lucide.createIcons();
};

// ── Bulk-selection state ──────────────────────────────────────
// UI._sel[ns]        → Set of selected row IDs (string)
// UI._bulkActions[ns] → [{label, variant, fn(ids)}]
UI._sel         = {};
UI._bulkActions = {};

// Register bulk actions for a namespace.
// actions: [{ label:'Delete', variant:'btn-ghost text-danger', fn(ids){} }, ...]
UI.bulkRegister = function(ns, actions) {
  UI._bulkActions[ns] = actions;
};

// Toggle one row.
UI._checkRow = function(ns, id, checked) {
  if (!UI._sel[ns]) UI._sel[ns] = new Set();
  if (checked) UI._sel[ns].add(String(id));
  else         UI._sel[ns].delete(String(id));
  UI._syncCheckAll(ns);
  UI._updateBulkBar(ns);
};

// Header checkbox: select/deselect all visible rows.
UI._checkAll = function(ns, checked) {
  if (!UI._sel[ns]) UI._sel[ns] = new Set();
  document.querySelectorAll('tr:not(.tr-hidden) input.row-checkbox[data-id]').forEach(cb => {
    cb.checked = checked;
    if (checked) UI._sel[ns].add(cb.dataset.id);
    else         UI._sel[ns].delete(cb.dataset.id);
  });
  UI._updateBulkBar(ns);
};

// Keep "select all" checkbox tri-state in sync.
UI._syncCheckAll = function(ns) {
  const allChk = document.getElementById(`chk-all-${ns}`);
  if (!allChk) return;
  const all = Array.from(document.querySelectorAll('tr:not(.tr-hidden) input.row-checkbox[data-id]'));
  const sel = all.filter(cb => cb.checked).length;
  allChk.checked       = sel > 0 && sel === all.length;
  allChk.indeterminate = sel > 0 && sel < all.length;
};

// Clear selection for a namespace (or all if ns is omitted).
UI._clearSel = function(ns) {
  if (ns) {
    UI._sel[ns] = new Set();
    document.querySelectorAll('input.row-checkbox').forEach(cb => { cb.checked = false; cb.indeterminate = false; });
  } else {
    Object.keys(UI._sel).forEach(k => { UI._sel[k] = new Set(); });
    document.querySelectorAll('input.row-checkbox').forEach(cb => { cb.checked = false; cb.indeterminate = false; });
  }
  UI._hideBulkBar();
};

// Show / refresh the floating bulk bar.
UI._updateBulkBar = function(ns) {
  const bar = document.getElementById('bulk-bar');
  if (!bar) return;
  const count = UI._sel[ns] ? UI._sel[ns].size : 0;
  if (count === 0) { UI._hideBulkBar(); return; }
  bar.dataset.ns = ns;
  bar.removeAttribute('hidden');
  document.getElementById('bulk-bar-count').textContent = `${count} selected`;
  const actEl  = document.getElementById('bulk-bar-actions');
  const acts   = UI._bulkActions[ns] || [];
  actEl.innerHTML = acts.map((a, i) =>
    `<button class="btn btn-sm ${a.variant || 'btn-outline'}" onclick="UI._runBulkAction('${ns}',${i})">${UI.esc(a.label)}</button>`
  ).join('');
  if (typeof lucide !== 'undefined') lucide.createIcons();
};

UI._hideBulkBar = function() {
  const bar = document.getElementById('bulk-bar');
  if (bar) bar.setAttribute('hidden', '');
};

// Run a registered action with current selection.
UI._runBulkAction = function(ns, index) {
  const sel    = UI._sel[ns];
  if (!sel || sel.size === 0) return;
  const action = (UI._bulkActions[ns] || [])[index];
  if (action) action.fn(Array.from(sel));
};

// Reveal next `step` hidden rows; remove load-more button when exhausted.
UI._loadMore = function(btn, step) {
  const tbody = btn.closest('table')?.querySelector('tbody');
  if (!tbody) return;
  const hidden  = [...tbody.querySelectorAll('tr.tr-hidden')];
  hidden.slice(0, step).forEach(tr => tr.classList.remove('tr-hidden'));
  const left = tbody.querySelectorAll('tr.tr-hidden').length;
  if (left === 0) {
    btn.closest('tr.tr-load-more')?.remove();
  } else {
    const countEl = btn.querySelector('.tr-load-more-count');
    if (countEl) countEl.textContent = `(${left} remaining)`;
  }
};

// ── UI.tabs ──────────────────────────────────────────────────────
// Renders an accessible tablist as HTML string.
//   tabs:    [{id, label, icon?}]
//   active:  active tab id
//   handler: string onclick handler name e.g. 'MyModule._setTab'
UI.tabs = function(tabs, active, handler) {
  return `<div role="tablist" class="tabs-bar" style="display:flex;gap:4px;border-bottom:2px solid var(--border);margin-bottom:20px;flex-wrap:wrap;">
    ${tabs.map(t => `
      <button role="tab"
              class="tab-btn${active === t.id ? ' active' : ''}"
              id="tab-${t.id}"
              aria-selected="${active === t.id}"
              aria-controls="tabpanel-${t.id}"
              onclick="${handler}('${t.id}')">
        ${t.icon ? `<i data-lucide="${t.icon}" style="width:14px;height:14px;vertical-align:-2px" aria-hidden="true"></i> ` : ''}${t.label}
      </button>`).join('')}
  </div>`;
};

// ── UI.a11yEnhance ───────────────────────────────────────────────
// Post-render accessibility enhancement pass.
// Call after setting innerHTML to fix up dynamically rendered content.
UI.a11yEnhance = function(container) {
  container = container || document;
  // 1. Wire label[for] association where label directly precedes an unlabelled input
  container.querySelectorAll('.form-group').forEach((group, i) => {
    const label = group.querySelector('label.form-label');
    const input = group.querySelector('input:not([id]), select:not([id]), textarea:not([id])');
    if (label && input && !label.getAttribute('for')) {
      const id = `_auto_field_${i}_${Date.now()}`;
      input.id = id;
      label.setAttribute('for', id);
    }
  });
  // 2. Add role="img" + aria-label to canvas elements missing it
  container.querySelectorAll('canvas:not([role])').forEach(canvas => {
    canvas.setAttribute('role', 'img');
    if (!canvas.getAttribute('aria-label')) {
      canvas.setAttribute('aria-label', 'Chart');
    }
  });
  // 3. Ensure all buttons with only icon children have aria-label
  container.querySelectorAll('button:not([aria-label])').forEach(btn => {
    if (btn.textContent.trim() === '' && btn.querySelector('[data-lucide]')) {
      const iconName = btn.querySelector('[data-lucide]').getAttribute('data-lucide') || 'button';
      btn.setAttribute('aria-label', iconName.replace(/-/g, ' '));
    }
  });
};

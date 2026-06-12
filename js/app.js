/* =============================================================
   app.js  —  Bootstrap, globals, shared utilities
   Runs after storage.js, before all other modules.
   ============================================================= */

// ── 1. Seed demo data on first run ──────────────────────────
Storage.seedIfEmpty();

// ── 2. Apply saved theme & accent colour ────────────────────
(function applyTheme() {
  const s = Storage.getSettings();
  document.documentElement.setAttribute('data-theme', s.theme || 'light');
  if (s.accentColor) {
    document.documentElement.style.setProperty('--accent', s.accentColor);
  }
})();

// ── 3. Global Modal helper ───────────────────────────────────
var Modal = (() => {
  const overlay  = document.getElementById('modal-overlay');
  const titleEl  = document.getElementById('modal-title');
  const bodyEl   = document.getElementById('modal-body');
  const footerEl = document.getElementById('modal-footer');
  const closeBtn = document.getElementById('modal-close');

  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  let _trapHandler = null;
  let _openerEl    = null;   // element that had focus before modal opened

  function _trap(e) {
    if (e.key !== 'Tab') return;
    const modal = overlay.querySelector('.modal');
    const nodes = Array.from(modal.querySelectorAll(FOCUSABLE)).filter(el => !el.closest('.hidden'));
    if (!nodes.length) return;
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  function open({ title = '', body = '', footer = '', width = '' }) {
    _openerEl = document.activeElement; // save opener for focus restoration
    titleEl.textContent = title;
    bodyEl.innerHTML    = body;
    footerEl.innerHTML  = footer;
    if (width) overlay.querySelector('.modal').style.maxWidth = width;
    overlay.classList.remove('hidden');
    if (_trapHandler) document.removeEventListener('keydown', _trapHandler);
    _trapHandler = _trap;
    document.addEventListener('keydown', _trapHandler);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    setTimeout(() => {
      const first = bodyEl.querySelector('input, select, textarea, button');
      if (first) first.focus();
    }, 50);
  }

  function close() {
    overlay.classList.add('hidden');
    bodyEl.innerHTML = '';
    footerEl.innerHTML = '';
    overlay.querySelector('.modal').style.maxWidth = '';
    if (_trapHandler) { document.removeEventListener('keydown', _trapHandler); _trapHandler = null; }
    // Return focus to the element that triggered the modal
    if (_openerEl && typeof _openerEl.focus === 'function') {
      requestAnimationFrame(() => _openerEl.focus());
    }
    _openerEl = null;
  }

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  return { open, close };
})();
window.Modal = Modal;

// ── 4. Toast notifications ───────────────────────────────────
var Toast = (() => {
  const container = document.getElementById('toast-container');

  function show(message, type = 'info', duration = 3200) {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    el.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    container.appendChild(el);

    let timer;
    function startDismiss() {
      timer = setTimeout(() => {
        el.style.opacity = '0';
        el.style.transition = 'opacity .3s';
        setTimeout(() => el.remove(), 300);
      }, duration);
    }
    startDismiss();
    el.addEventListener('mouseenter', () => clearTimeout(timer));
    el.addEventListener('mouseleave', startDismiss);
  }

  return { show, success: m => show(m,'success'), error: m => show(m,'error'), info: m => show(m,'info') };
})();
window.Toast = Toast;

// ── 5. Export / Import handlers ─────────────────────────────
document.getElementById('export-btn').addEventListener('click', () => {
  const data = Storage.exportAll();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const name = Storage.getSettings().churchName.replace(/\s+/g, '-').toLowerCase();
  a.href = url;
  a.download = `${name}-backup-${Storage.today()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  Toast.success('Backup exported successfully');
});

document.getElementById('import-file').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      UI.confirm('Import will replace all current data. Continue?', () => {
        Storage.importAll(data);
        Toast.success('Data imported. Reloading…');
        setTimeout(() => location.reload(), 1200);
      });
    } catch {
      Toast.error('Invalid backup file');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

// ── 6. Topbar date ───────────────────────────────────────────
(function setDate() {
  const el = document.getElementById('topbar-date');
  if (el) {
    el.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  }
})();

// ── 7. Shared rendering utilities ───────────────────────────
var UI = {

  drawBarChart(canvasId, labels, values, color) {
    // Resolve CSS var() tokens to actual color values
    function resolveColor(c) {
      if (!c) c = 'var(--accent)';
      if (c.startsWith('var(')) {
        const prop = c.slice(4, -1).trim();
        return getComputedStyle(document.documentElement).getPropertyValue(prop).trim() || '#4f46e5';
      }
      return c;
    }

    // Store invocation so theme toggle can redraw
    UI._charts = UI._charts || {};
    const prev = UI._charts[canvasId];
    if (prev && prev._inst) { try { prev._inst.destroy(); } catch(e) {} }
    UI._charts[canvasId] = { labels, values, color };

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const resolvedColor = resolveColor(color);
    const isDark        = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor     = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)';
    const tickColor     = isDark ? '#8b90b8' : '#9ca3af';
    const labelColor    = isDark ? '#e8eaf6' : '#374151';

    // Inline plugins: gradient fill + value labels above bars
    const vizPlugin = {
      id: '_cg_' + canvasId,
      beforeDraw(chart) {
        const { ctx, chartArea } = chart;
        if (!chartArea) return;
        const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        g.addColorStop(0, resolvedColor);
        g.addColorStop(1, resolvedColor + '44');
        chart.data.datasets[0].backgroundColor = g;
      },
      afterDatasetsDraw(chart) {
        const { ctx, data } = chart;
        ctx.save();
        ctx.font      = 'bold 11px Inter, system-ui';
        ctx.textAlign = 'center';
        ctx.fillStyle = labelColor;
        chart.getDatasetMeta(0).data.forEach((bar, i) => {
          const v = data.datasets[0].data[i];
          if (v > 0) ctx.fillText(v, bar.x, bar.y - 5);
        });
        ctx.restore();
      },
    };

    const inst = new Chart(canvas.getContext('2d'), {  // eslint-disable-line no-undef
      type: 'bar',
      data: {
        labels,
        datasets: [{ data: values, borderRadius: 4, borderSkipped: false }],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        animation:           { duration: 300 },
        plugins: {
          legend:  { display: false },
          tooltip: { callbacks: { label: c => ' ' + c.parsed.y } },
        },
        scales: {
          x: {
            grid:   { display: false },
            border: { display: false },
            ticks:  { color: tickColor, font: { size: 11, family: 'Inter, system-ui' } },
          },
          y: {
            grid:   { color: gridColor, lineWidth: 1 },
            border: { display: false },
            ticks:  {
              color: tickColor,
              font:  { size: 11, family: 'Inter, system-ui' },
              maxTicksLimit: 5,
              callback: v => Number.isInteger(v) ? v : '',
            },
            beginAtZero: true,
          },
        },
      },
      plugins: [vizPlugin],
    });

    UI._charts[canvasId]._inst = inst;
  },

  esc(str) {
    return String(str || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  },

  fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  relDate(iso) {
    if (!iso) return '—';
    const diff = Math.round((new Date() - new Date(iso + 'T00:00:00')) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff === -1) return 'Tomorrow';
    if (diff < 0) return `In ${-diff} days`;
    return `${diff} days ago`;
  },

  badge(text, color) {
    return `<span class="badge badge-${color}">${UI.esc(text)}</span>`;
  },

  confirm(msg, onYes) {
    Modal.open({
      title: 'Confirm',
      body: `<p>${UI.esc(msg)}</p>`,
      footer: `
        <button class="btn btn-outline" id="conf-cancel">Cancel</button>
        <button class="btn btn-danger"  id="conf-ok">Confirm</button>
      `,
    });
    document.getElementById('conf-cancel').onclick = Modal.close;
    document.getElementById('conf-ok').onclick = () => { Modal.close(); onYes(); };
  },

  // ── Skeleton helpers ─────────────────────────────────────────
  skeletonStatGrid(n) {
    n = n || 4;
    const card = `<div class="stat-card" style="pointer-events:none">
      <div class="skeleton" style="width:28px;height:28px;border-radius:var(--radius-sm);margin-bottom:12px;"></div>
      <div class="skeleton" style="width:55%;height:26px;margin-bottom:8px;"></div>
      <div class="skeleton" style="width:75%;height:11px;"></div>
    </div>`;
    return `<div class="stat-grid">${Array(n).fill(card).join('')}</div>`;
  },

  skeletonCard(lines, titleW) {
    lines = lines || 3; titleW = titleW || '50%';
    let inner = `<div class="skeleton" style="width:${titleW};height:16px;margin-bottom:16px;"></div>`;
    for (let i = 0; i < lines; i++) {
      const w = ['100%', '80%', '60%'][i % 3];
      inner += `<div class="skeleton" style="width:${w};height:13px;margin-bottom:8px;"></div>`;
    }
    return `<div class="card" style="pointer-events:none">${inner}</div>`;
  },

  skeletonChartWrap(h) {
    h = h || '160px';
    return `<div class="chart-canvas-wrap" style="height:${h}"><div class="skeleton" style="width:100%;height:100%;border-radius:var(--radius-sm);"></div></div>`;
  },

  skeletonTable(rows, cols) {
    rows = rows || 5; cols = cols || 4;
    const ths = Array(cols).fill(`<th><div class="skeleton" style="width:65%;height:11px;display:inline-block;"></div></th>`).join('');
    const tds = Array(cols).fill(`<td><div class="skeleton" style="width:72%;height:13px;display:inline-block;"></div></td>`).join('');
    const trs = Array(rows).fill(`<tr>${tds}</tr>`).join('');
    return `<div class="table-wrap" style="pointer-events:none"><table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
  },

  skeletonPage() {
    return `<div class="section-header">
      <div>
        <div class="skeleton" style="width:220px;height:20px;margin-bottom:8px;"></div>
        <div class="skeleton" style="width:150px;height:12px;"></div>
      </div>
    </div>
    ${UI.skeletonStatGrid(4)}
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-top:24px;">
      ${UI.skeletonCard(4)}${UI.skeletonCard(3)}
    </div>`;
  },
};

window.UI = UI;

// Redraw any tracked charts when theme changes
window.addEventListener('themechange', () => {
  if (!UI._charts) return;
  Object.entries(UI._charts).forEach(([id, { labels, values, color }]) => {
    if (document.getElementById(id)) UI.drawBarChart(id, labels, values, color);
  });
});

// ── 9. Form Validation helper ────────────────────────────────
var Validate = {

  // Returns null if valid, error string if invalid.
  // All checks treat empty/missing as "skip" unless you use required().
  email(v) {
    if (!v || !v.trim()) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : 'Enter a valid email address';
  },

  phone(v) {
    if (!v || !v.trim()) return null;
    const digits = v.replace(/\D/g, '');
    return digits.length >= 7 ? null : 'Phone must have at least 7 digits';
  },

  required(v, label) {
    const s = (v !== null && v !== undefined) ? String(v).trim() : '';
    return s !== '' ? null : (label || 'This field') + ' is required';
  },

  positiveNumber(v, label) {
    if (v === '' || v === null || v === undefined) return (label || 'Amount') + ' is required';
    const n = parseFloat(v);
    if (isNaN(n) || n < 0) return (label || 'Amount') + ' must be a valid number (0 or more)';
    return null;
  },

  // checks: [[fieldId, errorStringOrNull], ...]
  // Clears previous errors, shows new ones inline, returns true if all pass.
  check(checks) {
    document.querySelectorAll('.v-err').forEach(el => el.remove());
    document.querySelectorAll('.v-invalid').forEach(el => {
      el.classList.remove('v-invalid');
      el.removeAttribute('aria-invalid');
      el.removeAttribute('aria-describedby');
    });

    const errors = checks.filter(([, err]) => err != null);
    if (!errors.length) return true;

    errors.forEach(([fieldId, message]) => {
      const el = document.getElementById(fieldId);
      if (!el) return;
      el.classList.add('v-invalid');
      el.setAttribute('aria-invalid', 'true');
      const errId = `v-err-${fieldId}`;
      el.setAttribute('aria-describedby', errId);
      const msg = document.createElement('div');
      msg.className = 'v-err';
      msg.id = errId;
      msg.setAttribute('role', 'alert');
      msg.textContent = '\u26a0 ' + message;
      el.parentNode.insertBefore(msg, el.nextSibling);
    });

    const first = document.querySelector('.v-invalid');
    if (first) first.focus();
    return false;
  },

  // Attach on-blur validation to all named controls in a container.
  // Rules: { 'field-id': fn(value) \u2192 errString|null, ... }
  // Example: Validate.blurSetup(modalBodyEl, { 'email-input': Validate.email })
  blurSetup(container, rules) {
    if (!container || !rules) return;
    Object.entries(rules).forEach(([fieldId, ruleFn]) => {
      const el = container.getElementById ? container.getElementById(fieldId)
               : container.querySelector(`#${fieldId}`);
      if (!el) return;
      el.addEventListener('blur', () => {
        // Clear old error for this field
        const oldErr = document.getElementById(`v-err-${fieldId}`);
        if (oldErr) oldErr.remove();
        el.classList.remove('v-invalid');
        el.removeAttribute('aria-invalid');
        el.removeAttribute('aria-describedby');
        // Run validation
        const error = ruleFn(el.value);
        if (error) {
          el.classList.add('v-invalid');
          el.setAttribute('aria-invalid', 'true');
          el.setAttribute('aria-describedby', `v-err-${fieldId}`);
          const msg = document.createElement('div');
          msg.className = 'v-err';
          msg.id = `v-err-${fieldId}`;
          msg.setAttribute('role', 'alert');
          msg.textContent = '\u26a0 ' + error;
          el.parentNode.insertBefore(msg, el.nextSibling);
        }
      }, { once: false });
    });
  },
};
window.Validate = Validate;


// ── 8. Settings page ────────────────────────────────────────
// Wrapped in DOMContentLoaded so Navigation is defined before register runs
// (navigation.js loads after app.js, so we can't call Navigation.register synchronously)
document.addEventListener('DOMContentLoaded', function() {
// ── Settings helpers ─────────────────────────────────────────────
const Settings = {
  _liveAccent(color) {
    document.documentElement.style.setProperty('--accent', color);
    const swatch = document.getElementById('accent-preview-swatch');
    if (swatch) swatch.style.background = color;
  },
  _liveSidebar(color) {
    document.documentElement.style.setProperty('--sidebar-bg', color);
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.style.background = color;
  },
  _applyCustomCss(css) {
    let el = document.getElementById('_custom-css-tag');
    if (!el) {
      el = document.createElement('style');
      el.id = '_custom-css-tag';
      document.head.appendChild(el);
    }
    el.textContent = css || '';
  },
};
window.Settings = Settings;

// On boot: apply saved brand settings
(function _applyBrandOnBoot() {
  const s = Storage.getSettings();
  if (s.accentColor)   document.documentElement.style.setProperty('--accent', s.accentColor);
  if (s.sidebarColor)  { document.documentElement.style.setProperty('--sidebar-bg', s.sidebarColor); }
  if (s.customCss)     Settings._applyCustomCss(s.customCss);
})();

// ── Onboarding first-run checklist (4.7) ────────────────────────
const Onboarding = (() => {
  const STEPS = [
    {
      key: 'church_name',
      label: 'Set your church name',
      sub:   'Settings → Church Information',
      done:  () => (Storage.getSettings().churchName || '').length > 3,
      action: () => Navigation.navigate('settings'),
    },
    {
      key: 'first_member',
      label: 'Add your first member',
      sub:   'Members → Add Member',
      done:  () => Storage.getAll('members').length > 0,
      action: () => Navigation.navigate('members'),
    },
    {
      key: 'logo',
      label: 'Upload a church logo (optional)',
      sub:   'Settings → Brand & Appearance',
      done:  () => !!Storage.getSettings().logoDataUrl,
      action: () => Navigation.navigate('settings'),
    },
    {
      key: 'first_event',
      label: 'Create your first event',
      sub:   'Events → Add Event',
      done:  () => Storage.getAll('events').length > 0,
      action: () => Navigation.navigate('events'),
    },
  ];

  function _render() {
    const overlay = document.getElementById('onboarding-overlay');
    const stepsEl = document.getElementById('onboarding-steps');
    const footer  = document.getElementById('onboarding-footer');
    if (!overlay || !stepsEl) return;

    const doneAll = STEPS.every(s => s.done());
    stepsEl.innerHTML = STEPS.map((s, i) => {
      const isDone = s.done();
      return `<div class="onboarding-step${isDone ? ' onboarding-step--done' : ''}">
        <div class="onboarding-step__num">${isDone ? '✓' : (i + 1)}</div>
        <div>
          <div class="onboarding-step__label">${s.label}</div>
          <div class="onboarding-step__sub">${s.sub}</div>
        </div>
        ${!isDone ? `<button class="btn btn-primary btn-sm" style="margin-left:auto;flex-shrink:0"
            onclick="Onboarding._go(${i})">Go</button>` : ''}
      </div>`;
    }).join('');

    footer.innerHTML = doneAll
      ? `<button class="btn btn-primary" onclick="Onboarding.dismiss()">
           <i data-lucide="check-circle" style="width:16px;height:16px" aria-hidden="true"></i> All done — Let's go!
         </button>`
      : `<button class="btn btn-ghost btn-sm" onclick="Onboarding.dismiss()">Skip for now</button>`;

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function show() {
    const overlay = document.getElementById('onboarding-overlay');
    if (!overlay) return;
    overlay.removeAttribute('hidden');
    _render();
  }

  function dismiss() {
    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) overlay.setAttribute('hidden', '');
    Storage.set('_onboarding_dismissed', true);
  }

  function _go(stepIndex) {
    dismiss();
    STEPS[stepIndex]?.action?.();
  }

  function maybeShow() {
    if (Storage.get('_onboarding_dismissed')) return;
    // Only show if church name hasn't been set
    const settings = Storage.getSettings();
    if (!settings.churchName || settings.churchName === 'Grace Community Church') {
      // First real run — show after a short delay so the page renders first
      setTimeout(show, 800);
    }
  }

  return { show, dismiss, maybeShow, _go, _render };
})();
window.Onboarding = Onboarding;

Navigation.register('settings', function render(page) {
  const s = Storage.getSettings();
  page.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">Settings</h2>
        <div class="section-subtitle">Customise your church dashboard</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:20px;">

      <!-- Church Info -->
      <div class="card">
        <div class="card-header"><span class="card-title">⛪ Church Information</span></div>
        <div class="form-group"><label class="form-label">Church Name</label>
          <input class="form-control" id="set-name" value="${UI.esc(s.churchName)}">
        </div>
        <div class="form-group"><label class="form-label">Pastor Name</label>
          <input class="form-control" id="set-pastor" value="${UI.esc(s.pastorName)}">
        </div>
        <div class="form-group"><label class="form-label">Address</label>
          <input class="form-control" id="set-addr" value="${UI.esc(s.address)}">
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Phone</label>
            <input class="form-control" id="set-phone" value="${UI.esc(s.phone)}">
          </div>
          <div class="form-group"><label class="form-label">Email</label>
            <input class="form-control" id="set-email" type="email" value="${UI.esc(s.email)}">
          </div>
        </div>
        <div class="form-group"><label class="form-label">Website</label>
          <input class="form-control" id="set-web" value="${UI.esc(s.website)}">
        </div>
        <button class="btn btn-primary" id="save-church-btn">Save Church Info</button>
      </div>

      <!-- Appearance / White-label -->
      <div class="card">
        <div class="card-header"><span class="card-title"><i data-lucide="palette" class="icon-inline" aria-hidden="true"></i> Brand &amp; Appearance</span></div>
        <div class="form-group">
          <label class="form-label">Theme</label>
          <div style="display:flex;gap:12px;margin-top:6px;">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
              <input type="radio" name="theme-pick" value="light" ${s.theme!=='dark'?'checked':''}> Light
            </label>
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
              <input type="radio" name="theme-pick" value="dark"  ${s.theme==='dark'?'checked':''}> Dark
            </label>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Accent / Brand Color</label>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:6px;">
            ${['#4f6ef7','#7c3aed','#059669','#dc2626','#d97706','#0ea5e9','#ec4899','#0f172a'].map(c =>
              `<button onclick="document.getElementById('set-accent').value='${c}';Settings._liveAccent('${c}')"
                style="width:28px;height:28px;border-radius:50%;background:${c};border:2px solid transparent;cursor:pointer;${(s.accentColor||'#4f6ef7')===c?'outline:3px solid var(--text)':''}" title="${c}"></button>`
            ).join('')}
            <input type="color" id="set-accent" value="${s.accentColor||'#4f6ef7'}"
                   oninput="Settings._liveAccent(this.value)"
                   style="width:36px;height:36px;border:none;border-radius:4px;cursor:pointer;background:transparent"
                   aria-label="Custom accent color">
          </div>
          <div style="margin-top:8px;display:flex;align-items:center;gap:10px;font-size:.82rem;color:var(--text-muted)">
            <span>Preview:</span>
            <button id="accent-preview-btn" class="btn btn-primary btn-sm" style="pointer-events:none">Accent Button</button>
            <span id="accent-preview-swatch" style="display:inline-block;width:20px;height:20px;border-radius:4px;background:var(--accent);border:1px solid var(--border)"></span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Sidebar Color (hex)</label>
          <div style="display:flex;gap:10px;align-items:center;margin-top:6px;">
            ${['#1e1b4b','#0f172a','#14532d','#1e3a5f','#3b1a1a','#312e81'].map(c =>
              `<button onclick="document.getElementById('set-sidebar-color').value='${c}';Settings._liveSidebar('${c}')"
                style="width:28px;height:28px;border-radius:50%;background:${c};border:2px solid transparent;cursor:pointer;${(s.sidebarColor||'#1e1b4b')===c?'outline:3px solid var(--text)':''}" title="${c}"></button>`
            ).join('')}
            <input type="color" id="set-sidebar-color" value="${s.sidebarColor||'#1e1b4b'}"
                   oninput="Settings._liveSidebar(this.value)"
                   aria-label="Custom sidebar color"
                   style="width:36px;height:36px;border:none;border-radius:4px;cursor:pointer;background:transparent">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Church Logo</label>
          <input type="file" id="set-logo" accept="image/*" class="form-control" aria-label="Upload church logo">
          ${s.logoDataUrl ? `<img src="${s.logoDataUrl}" alt="Current logo" style="margin-top:8px;height:60px;border-radius:8px;object-fit:contain;">` : ''}
        </div>
        <div class="form-group">
          <label class="form-label">Custom CSS <span style="font-size:.74rem;font-weight:400;color:var(--text-muted)">(advanced — injected into &lt;head&gt;)</span></label>
          <textarea class="form-control" id="set-custom-css" rows="4" placeholder="/* e.g. :root { --radius: 0; } */"
                    style="font-family:monospace;font-size:.82rem">${UI.esc(s.customCss||'')}</textarea>
        </div>
        <button class="btn btn-primary" id="save-appearance-btn">
          <i data-lucide="save" style="width:14px;height:14px" aria-hidden="true"></i> Save Appearance
        </button>
      </div>

      <!-- Data Management -->
      <div class="card">
        <div class="card-header"><span class="card-title">💾 Data Management</span></div>
        <p style="font-size:.86rem;color:var(--text-muted);margin-bottom:16px;">
          All data is stored locally in your browser. Export regularly for backup.
        </p>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <button class="btn btn-outline" id="set-export-btn">⬇ Export Full Backup (JSON)</button>
          <label class="btn btn-outline" style="justify-content:flex-start;">
            ⬆ Import Backup (JSON)
            <input type="file" id="set-import" accept=".json" style="display:none">
          </label>
          <button class="btn btn-danger" id="set-reset-btn">🗑 Reset All Data</button>
        </div>
        <div style="margin-top:16px;padding:12px;background:var(--surface-2);border-radius:var(--radius);font-size:.8rem;color:var(--text-muted);">
          <strong>Records:</strong>
          Members: ${Storage.getAll('members').length} ·
          Visitors: ${Storage.getAll('visitors').length} ·
          Volunteers: ${Storage.getAll('volunteers').length} ·
          Events: ${Storage.getAll('events').length}
        </div>
      </div>

    </div>
  `;

  document.getElementById('save-church-btn').onclick = () => {
    Storage.saveSettings({
      churchName: document.getElementById('set-name').value.trim(),
      pastorName: document.getElementById('set-pastor').value.trim(),
      address:    document.getElementById('set-addr').value.trim(),
      phone:      document.getElementById('set-phone').value.trim(),
      email:      document.getElementById('set-email').value.trim(),
      website:    document.getElementById('set-web').value.trim(),
    });
    document.getElementById('sidebar-church-name').textContent = document.getElementById('set-name').value.trim();
    Toast.success('Church info saved');
  };

  document.getElementById('save-appearance-btn').onclick = () => {
    const theme       = document.querySelector('input[name="theme-pick"]:checked')?.value || 'light';
    const accent      = document.getElementById('set-accent')?.value || '#4f6ef7';
    const sidebarColor = document.getElementById('set-sidebar-color')?.value || '#1e1b4b';
    const customCss   = document.getElementById('set-custom-css')?.value?.trim() || '';

    Storage.saveSettings({ theme, accentColor: accent, sidebarColor, customCss });
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--accent', accent);
    document.getElementById('theme-toggle').textContent = theme === 'dark' ? '☀️' : '🌙';
    Settings._liveSidebar(sidebarColor);
    Settings._applyCustomCss(customCss);

    const logoFile = document.getElementById('set-logo')?.files[0];
    if (logoFile) {
      const reader = new FileReader();
      reader.onload = ev => {
        Storage.saveSettings({ logoDataUrl: ev.target.result });
        const logoEl = document.getElementById('church-logo');
        if (logoEl) logoEl.innerHTML = `<img src="${ev.target.result}" alt="logo" style="width:100%;height:100%;border-radius:8px;object-fit:cover;">`;
        Toast.success('Appearance saved');
        Navigation.navigate('settings');
      };
      reader.readAsDataURL(logoFile);
    } else {
      Toast.success('Appearance saved');
    }
  };

  // Apply saved sidebar color on load
  if (s.sidebarColor) Settings._liveSidebar(s.sidebarColor);
  if (s.customCss)    Settings._applyCustomCss(s.customCss);
  lucide.createIcons();

});
});

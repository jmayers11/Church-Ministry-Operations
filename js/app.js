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
    titleEl.textContent = title;
    bodyEl.innerHTML    = body;
    footerEl.innerHTML  = footer;
    if (width) overlay.querySelector('.modal').style.maxWidth = width;
    overlay.classList.remove('hidden');
    if (_trapHandler) document.removeEventListener('keydown', _trapHandler);
    _trapHandler = _trap;
    document.addEventListener('keydown', _trapHandler);
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
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity .3s';
      setTimeout(() => el.remove(), 300);
    }, duration);
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
      if (confirm('Import will replace all current data. Continue?')) {
        Storage.importAll(data);
        Toast.success('Data imported. Reloading…');
        setTimeout(() => location.reload(), 1200);
      }
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

  drawBarChart(canvasId, labels, values, color = '#4f6ef7') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 400;
    const H = canvas.offsetHeight || 200;
    canvas.width  = W * devicePixelRatio;
    canvas.height = H * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const pad = { top: 16, right: 10, bottom: 36, left: 36 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const max = Math.max(...values, 1);
    const barW = chartW / labels.length * 0.6;
    const gap  = chartW / labels.length;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)';
    ctx.lineWidth = 1;
    [0, .25, .5, .75, 1].forEach(t => {
      const y = pad.top + chartH * (1 - t);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y); ctx.stroke();
    });

    values.forEach((v, i) => {
      const bH = (v / max) * chartH;
      const x  = pad.left + gap * i + (gap - barW) / 2;
      const y  = pad.top + chartH - bH;
      const grad = ctx.createLinearGradient(0, y, 0, y + bH);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + '88');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, bH, 4);
      ctx.fill();
      ctx.fillStyle = isDark ? '#8b90b8' : '#9ca3af';
      ctx.font = '11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], x + barW / 2, H - pad.bottom + 16);
      if (v > 0) {
        ctx.fillStyle = isDark ? '#e8eaf6' : '#374151';
        ctx.font = 'bold 11px system-ui';
        ctx.fillText(v, x + barW / 2, y - 4);
      }
    });

    ctx.fillStyle = isDark ? '#8b90b8' : '#9ca3af';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'right';
    [0, Math.round(max * .5), max].forEach(v => {
      const y = pad.top + chartH * (1 - v / max);
      ctx.fillText(v, pad.left - 6, y + 4);
    });
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
};

window.UI = UI;

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
    document.querySelectorAll('.v-invalid').forEach(el => el.classList.remove('v-invalid'));

    const errors = checks.filter(([, err]) => err != null);
    if (!errors.length) return true;

    errors.forEach(([fieldId, message]) => {
      const el = document.getElementById(fieldId);
      if (!el) return;
      el.classList.add('v-invalid');
      const msg = document.createElement('div');
      msg.className = 'v-err';
      msg.textContent = '\u26a0 ' + message;
      el.parentNode.insertBefore(msg, el.nextSibling);
    });

    const first = document.querySelector('.v-invalid');
    if (first) first.focus();
    return false;
  },
};
window.Validate = Validate;


// ── 8. Settings page ────────────────────────────────────────
// Wrapped in DOMContentLoaded so Navigation is defined before register runs
// (navigation.js loads after app.js, so we can't call Navigation.register synchronously)
document.addEventListener('DOMContentLoaded', function() {
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

      <!-- Appearance -->
      <div class="card">
        <div class="card-header"><span class="card-title">🎨 Appearance</span></div>
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
          <label class="form-label">Accent Color</label>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:6px;">
            ${['#4f6ef7','#7c3aed','#059669','#dc2626','#d97706','#0ea5e9','#ec4899'].map(c =>
              `<button onclick="document.getElementById('set-accent').value='${c}';this.style.outline='3px solid #000'"
                style="width:28px;height:28px;border-radius:50%;background:${c};border:2px solid transparent;cursor:pointer;${s.accentColor===c?'outline:3px solid #000':''}" title="${c}"></button>`
            ).join('')}
            <input type="color" id="set-accent" value="${s.accentColor||'#4f6ef7'}" style="width:36px;height:36px;border:none;border-radius:4px;cursor:pointer;background:transparent">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Church Logo</label>
          <input type="file" id="set-logo" accept="image/*" class="form-control">
          ${s.logoDataUrl ? `<img src="${s.logoDataUrl}" alt="logo" style="margin-top:8px;height:60px;border-radius:8px;">` : ''}
        </div>
        <button class="btn btn-primary" id="save-appearance-btn">Apply Appearance</button>
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
    const theme  = document.querySelector('input[name="theme-pick"]:checked')?.value || 'light';
    const accent = document.getElementById('set-accent').value;
    Storage.saveSettings({ theme, accentColor: accent });
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--accent', accent);
    document.getElementById('theme-toggle').textContent = theme === 'dark' ? '☀️' : '🌙';

    const logoFile = document.getElementById('set-logo').files[0];
    if (logoFile) {
      const reader = new FileReader();
      reader.onload = ev => {
        Storage.saveSettings({ logoDataUrl: ev.target.result });
        const imgEl = document.getElementById('sidebar-logo');
        if (imgEl) imgEl.src = ev.target.result;
        Toast.success('Appearance saved');
      };
      reader.readAsDataURL(logoFile);
    } else {
      Toast.success('Appearance saved');
    }
  };

});
});

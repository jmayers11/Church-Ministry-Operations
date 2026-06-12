/* =============================================================
   prayer.js  —  Prayer Request Center
   Tabs: Active Requests | Answered Prayers | Praise Reports | Print List
   ============================================================= */

Navigation.register('prayer', function render(page) {
  const requests = Storage.getAll('prayer');
  const statusColors = { New:'orange', Ongoing:'blue', Answered:'green', Private:'purple' };
  const categories = ['Health','Family','Ministry','Church','Praise','Evangelism','Financial','Grief','Other'];
  let activeTab = Storage.get('_prayer_tab') || 'active';

  /* ── seed praise reports if empty ─────────────────────── */
  if (!Storage.get('_praise_seeded')) {
    const praiseReports = [
      { title:'Healing Miracle', text:'After months of prayer, Sister Martha received a clear bill of health. God is faithful!', submittedBy:'Martha Johnson', date: Storage.today().slice(0,7)+'-03', category:'Health' },
      { title:'Job Restored', text:'Brother David landed a new job after 6 months of unemployment. The congregation rejoiced!', submittedBy:'David Williams', date: Storage.today().slice(0,7)+'-08', category:'Financial' },
      { title:'Family Reunited', text:'After years of estrangement, the Thompson family reconciled at our Christmas service.', submittedBy:'Pastor', date: Storage.today().slice(0,7)+'-15', category:'Family' },
    ];
    praiseReports.forEach(r => Storage.insert('praise_reports', r));
    Storage.set('_praise_seeded', true);
  }

  function setTab(t) { Storage.set('_prayer_tab', t); activeTab = t; renderContent(); }

  function renderCards(data, container) {
    const el = document.getElementById(container);
    if (!el) return;
    if (!data.length) {
      el.innerHTML = UI.emptyState({ icon: 'hand-heart', title: 'No requests found' });
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }
    el.innerHTML = data.map(r => {
      const prayCount = Number(r.prayingCount || 0);
      const isPrivate = !!r.private;
      return `
      <div class="card prayer-card${isPrivate ? ' prayer-card--private' : ''}" style="position:relative;">
        <!-- badges + actions -->
        <div class="flex-between" style="align-items:flex-start;margin-bottom:var(--space-3)">
          <div class="chip-row" style="margin-bottom:0">
            ${UI.badge(r.status, statusColors[r.status] || 'gray')}
            <span class="badge badge-gray">${UI.esc(r.category)}</span>
            ${isPrivate ? `<span class="badge badge-purple" style="display:inline-flex;align-items:center;gap:3px"><i data-lucide="lock" style="width:10px;height:10px" aria-hidden="true"></i>Private</span>` : ''}
          </div>
          <div class="flex-row" style="gap:2px">
            ${r.status !== 'Answered' ? `<button class="btn btn-ghost btn-sm" style="font-size:.72rem" aria-label="Mark as answered" onclick="Prayer._markAnswered('${r.id}')"><i data-lucide="check-circle" class="icon-inline" aria-hidden="true"></i>Answered</button>` : ''}
            <button class="btn btn-ghost btn-sm" aria-label="Edit prayer request" onclick="Prayer.edit('${r.id}')"><i data-lucide="pencil" style="width:13px;height:13px" aria-hidden="true"></i></button>
            <button class="btn btn-ghost btn-sm text-danger" aria-label="Remove prayer request" onclick="Prayer.remove('${r.id}')"><i data-lucide="x" style="width:13px;height:13px" aria-hidden="true"></i></button>
          </div>
        </div>

        <!-- request text -->
        <p style="font-size:.9rem;line-height:1.6;margin-bottom:var(--space-3)">
          ${isPrivate
            ? `<span class="prayer-private-hint"><i data-lucide="eye-off" class="icon-xs" aria-hidden="true"></i>Private request — visible to prayer team only</span>`
            : UI.esc(r.request)}
        </p>

        <!-- footer: meta + I'm Praying -->
        <div class="flex-between" style="align-items:center;flex-wrap:wrap;gap:var(--space-2)">
          <div class="text-meta flex-row flex-wrap" style="gap:var(--space-3)">
            <span style="display:inline-flex;align-items:center;gap:4px">
              <i data-lucide="calendar" style="width:12px;height:12px" aria-hidden="true"></i>${UI.fmtDate(r.date)}
            </span>
            ${r.submittedBy ? `<span style="display:inline-flex;align-items:center;gap:4px"><i data-lucide="user" style="width:12px;height:12px" aria-hidden="true"></i>${UI.esc(r.submittedBy)}</span>` : ''}
            ${r.assignedTeam ? `<span style="display:inline-flex;align-items:center;gap:4px"><i data-lucide="users" style="width:12px;height:12px" aria-hidden="true"></i>${UI.esc(r.assignedTeam)}</span>` : ''}
          </div>
          <button class="btn btn-sm prayer-praying-btn" onclick="Prayer._togglePraying('${r.id}',this)"
                  aria-label="I am praying for this request" aria-pressed="${prayCount > 0 ? 'true' : 'false'}">
            <i data-lucide="hand-heart" style="width:14px;height:14px" aria-hidden="true"></i>
            Praying${prayCount > 0 ? ` <span class="prayer-praying-count">${prayCount}</span>` : ''}
          </button>
        </div>
      </div>`;
    }).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function renderContent() {
    document.querySelectorAll('#prayer-tabs .tab-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === activeTab));
    const body = document.getElementById('prayer-body');
    if (!body) return;

    /* ══════════════════════════════
       TAB 1 — ACTIVE REQUESTS
    ══════════════════════════════ */
    if (activeTab === 'active') {
      const active = requests.filter(r => r.status !== 'Answered');

      function filtered() {
        const q  = document.getElementById('prayer-search')?.value.toLowerCase() || '';
        const st = document.getElementById('prayer-status-filter')?.value || '';
        const ct = document.getElementById('prayer-cat-filter')?.value || '';
        return Storage.getAll('prayer').filter(r => r.status !== 'Answered').filter(r => {
          const txt = `${r.request} ${r.submittedBy||''} ${r.category}`.toLowerCase();
          return (!q || txt.includes(q)) && (!st || r.status === st) && (!ct || r.category === ct);
        });
      }

      body.innerHTML = `
        <div class="toolbar">
          <div class="search-input-wrap">
            <i data-lucide="search" class="search-icon" aria-hidden="true"></i>
            <input type="text" class="search-input" id="prayer-search" placeholder="Search requests…">
          </div>
          <select class="filter-select" id="prayer-status-filter">
            <option value="">All Statuses</option>
            <option>New</option><option>Ongoing</option><option>Private</option>
          </select>
          <select class="filter-select" id="prayer-cat-filter">
            <option value="">All Categories</option>
            ${categories.map(c => `<option>${c}</option>`).join('')}
          </select>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;" id="prayer-cards"></div>`;

      renderCards(active, 'prayer-cards');
      document.getElementById('prayer-search')?.addEventListener('input', () => renderCards(filtered(), 'prayer-cards'));
      document.getElementById('prayer-status-filter')?.addEventListener('change', () => renderCards(filtered(), 'prayer-cards'));
      document.getElementById('prayer-cat-filter')?.addEventListener('change', () => renderCards(filtered(), 'prayer-cards'));

    /* ══════════════════════════════
       TAB 2 — ANSWERED PRAYERS
    ══════════════════════════════ */
    } else if (activeTab === 'answered') {
      const answered = requests.filter(r => r.status === 'Answered')
        .sort((a,b) => b.date.localeCompare(a.date));

      body.innerHTML = `
        <div class="success-banner" style="margin-bottom:var(--space-5)">
          <div class="success-banner__title" style="display:flex;align-items:center;gap:8px">
            <i data-lucide="check-circle" style="width:18px;height:18px" aria-hidden="true"></i>
            Answered Prayer Wall
          </div>
          <div class="success-banner__body">"Whatever you ask in prayer, believe that you have received it, and it will be yours." — Mark 11:24</div>
        </div>
        ${answered.length === 0
          ? UI.emptyState({ icon:'sparkles', title:'No answered prayers yet', body:'Mark requests as Answered to celebrate God\'s faithfulness' })
          : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">
          ${answered.map(r => `
            <div class="card prayer-card prayer-card--answered">
              <div class="flex-between" style="align-items:flex-start;margin-bottom:var(--space-3)">
                <div style="display:flex;align-items:center;gap:8px">
                  <div style="width:30px;height:30px;border-radius:50%;background:var(--success-bg);color:var(--success-text);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <i data-lucide="check-circle" style="width:16px;height:16px" aria-hidden="true"></i>
                  </div>
                  <div>
                    <div style="font-size:var(--text-xs);font-weight:800;color:var(--success-text);text-transform:uppercase;letter-spacing:.05em">Prayer Answered</div>
                    <div class="text-meta">${UI.fmtDate(r.date)}</div>
                  </div>
                </div>
                <div class="flex-row" style="gap:2px">
                  <button class="btn btn-ghost btn-sm" aria-label="Edit" onclick="Prayer.edit('${r.id}')"><i data-lucide="pencil" style="width:13px;height:13px" aria-hidden="true"></i></button>
                  <button class="btn btn-ghost btn-sm text-danger" aria-label="Remove" onclick="Prayer.remove('${r.id}')"><i data-lucide="x" style="width:13px;height:13px" aria-hidden="true"></i></button>
                </div>
              </div>
              <p style="font-size:.9rem;line-height:1.6;margin-bottom:var(--space-2)">
                ${r.private ? `<span class="prayer-private-hint"><i data-lucide="eye-off" class="icon-xs" aria-hidden="true"></i>Private request — answered by God's grace</span>` : UI.esc(r.request)}
              </p>
              <div class="text-meta flex-row flex-wrap" style="gap:var(--space-3)">
                <span class="badge badge-gray">${UI.esc(r.category)}</span>
                ${r.submittedBy ? `<span style="display:inline-flex;align-items:center;gap:4px"><i data-lucide="user" style="width:11px;height:11px" aria-hidden="true"></i>${UI.esc(r.submittedBy)}</span>` : ''}
              </div>
            </div>`).join('')}
        </div>`}
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();

    /* ══════════════════════════════
       TAB 3 — PRAISE REPORTS
    ══════════════════════════════ */
    } else if (activeTab === 'praise') {
      const reports = (Storage.getAll('praise_reports') || []).sort((a,b)=>b.date.localeCompare(a.date));
      body.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:14px;">
          <button class="btn btn-primary" onclick="Prayer.addPraise()">+ Add Praise Report</button>
        </div>
        ${!reports.length
          ? UI.emptyState({ icon:'star', title:'No praise reports yet' })
          : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">
          ${reports.map(r=>`
            <div class="card" style="border-left:4px solid var(--warning)">
              <div class="flex-between" style="align-items:flex-start;margin-bottom:var(--space-2)">
                <div class="cell-primary" style="display:flex;align-items:center;gap:6px">
                  <i data-lucide="star" style="width:14px;height:14px;color:var(--warning)" aria-hidden="true"></i>
                  ${UI.esc(r.title)}
                </div>
                <button class="btn btn-ghost btn-sm text-danger" style="flex-shrink:0" aria-label="Remove praise report" onclick="Prayer.removePraise('${r.id}')">
                  <i data-lucide="x" style="width:13px;height:13px" aria-hidden="true"></i>
                </button>
              </div>
              <p class="text-meta" style="line-height:1.6;margin-bottom:var(--space-2)">${UI.esc(r.text)}</p>
              <div class="text-meta flex-row flex-wrap" style="gap:var(--space-3)">
                ${r.submittedBy?`<span style="display:inline-flex;align-items:center;gap:4px"><i data-lucide="user" style="width:11px;height:11px" aria-hidden="true"></i>${UI.esc(r.submittedBy)}</span>`:''}
                <span style="display:inline-flex;align-items:center;gap:4px"><i data-lucide="calendar" style="width:11px;height:11px" aria-hidden="true"></i>${UI.fmtDate(r.date)}</span>
                <span class="badge badge-gray">${UI.esc(r.category)}</span>
              </div>
            </div>`).join('')}
        </div>`}
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();

    /* ══════════════════════════════
       TAB 4 — PRINT LIST
    ══════════════════════════════ */
    } else if (activeTab === 'print') {
      const active = requests.filter(r => r.status !== 'Answered' && !r.private);
      body.innerHTML = `
        <div class="flex-between" style="margin-bottom:var(--space-4)">
          <div class="text-meta">${active.length} non-private active requests</div>
          <button class="btn btn-primary" onclick="window.print()">🖨 Print</button>
        </div>
        <div style="font-family:serif;line-height:2;font-size:.95rem;">
          ${active.map((r,i)=>`<div class="detail-row" style="display:block">
            <strong>${i+1}. ${r.submittedBy||'Anonymous'}</strong> — ${r.category}
            <div class="text-meta" style="margin-left:18px">${UI.esc(r.request||'').slice(0,120)}${(r.request||'').length>120?'…':''}</div>
          </div>`).join('')}
        </div>`;
    }
  }

  /* ── Page shell ──────────────────────────────────────── */
  const active   = requests.filter(r => r.status !== 'Answered');
  const answered = requests.filter(r => r.status === 'Answered');
  const praiseCount = (Storage.getAll('praise_reports')||[]).length;

  page.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title"><i data-lucide="heart" class="icon-inline" aria-hidden="true"></i>Prayer Request Center</h2>
        <div class="section-subtitle">${active.length} active · ${answered.length} answered</div>
      </div>
      <button class="btn btn-primary" onclick="Prayer.add()">+ Add Request</button>
    </div>

    <div class="stat-grid" style="margin-bottom:20px;">
      <div class="stat-card" data-accent="orange"><div class="stat-icon"><i data-lucide="heart" aria-hidden="true"></i></div><div class="stat-value">${active.length}</div><div class="stat-label">Active Requests</div></div>
      <div class="stat-card" data-accent="green"><div class="stat-icon"><i data-lucide="check-circle" aria-hidden="true"></i></div><div class="stat-value">${answered.length}</div><div class="stat-label">Answered Prayers</div></div>
      <div class="stat-card" data-accent="yellow"><div class="stat-icon"><i data-lucide="star" aria-hidden="true"></i></div><div class="stat-value">${praiseCount}</div><div class="stat-label">Praise Reports</div></div>
      <div class="stat-card" data-accent="purple"><div class="stat-icon"><i data-lucide="lock" aria-hidden="true"></i></div><div class="stat-value">${requests.filter(r=>r.private).length}</div><div class="stat-label">Private Requests</div></div>
    </div>

    <div id="prayer-tabs" style="display:flex;gap:4px;border-bottom:2px solid var(--border);margin-bottom:20px;flex-wrap:wrap;">
      ${[['active','<i data-lucide="heart" class="icon-inline" aria-hidden="true"></i>Active'],['answered','<i data-lucide="check-circle" class="icon-inline" aria-hidden="true"></i>Answered'],['praise','<i data-lucide="star" class="icon-inline" aria-hidden="true"></i>Praise'],['print','<i data-lucide="printer" class="icon-inline" aria-hidden="true"></i>Print List']].map(([t,l])=>`
        <button class="tab-btn${activeTab===t?' active':''}" data-tab="${t}" onclick="Prayer._tab('${t}')">${l}</button>`).join('')}
    </div>
    <div id="prayer-body"></div>
  `;

  renderContent();
});

/* ── Prayer global object ────────────────────────────── */
const Prayer = {
  _state: { search: '' },
  _rerender() {
    Navigation.navigate('prayer');
  },
  _tab(t) { Storage.set('_prayer_tab', t); Prayer._state.search = ''; Navigation.navigate('prayer'); },

  _form(r) {
    r = r || {};
    const cats = ['Health','Family','Ministry','Church','Praise','Evangelism','Financial','Grief','Other'];
    return `
      <div class="form-group"><label class="form-label">Prayer Request *</label>
        <textarea class="form-control" id="pr-req" rows="4">${UI.esc(r.request||'')}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Category</label>
          <select class="form-control" id="pr-cat">${cats.map(c=>`<option ${r.category===c?'selected':''}>${c}</option>`).join('')}</select>
        </div>
        <div class="form-group"><label class="form-label">Status</label>
          <select class="form-control" id="pr-status">${['New','Ongoing','Answered','Private'].map(s=>`<option ${(r.status||'New')===s?'selected':''}>${s}</option>`).join('')}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Submitted By</label><input class="form-control" id="pr-by" value="${UI.esc(r.submittedBy||'')}"></div>
        <div class="form-group"><label class="form-label">Date</label><input class="form-control" id="pr-date" type="date" value="${r.date||Storage.today()}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Prayer Team</label><input class="form-control" id="pr-team" value="${UI.esc(r.assignedTeam||'')}"></div>
        <div class="form-group" style="display:flex;align-items:center;gap:8px;padding-top:24px;">
          <input type="checkbox" id="pr-private" ${r.private?'checked':''}>
          <label for="pr-private" style="font-size:.88rem;">Private (team only)</label>
        </div>
      </div>`;
  },

  _collect() {
    return {
      request:     document.getElementById('pr-req')?.value.trim(),
      category:    document.getElementById('pr-cat')?.value,
      status:      document.getElementById('pr-status')?.value,
      submittedBy: document.getElementById('pr-by')?.value.trim(),
      date:        document.getElementById('pr-date')?.value,
      assignedTeam:document.getElementById('pr-team')?.value.trim(),
      private:     document.getElementById('pr-private')?.checked||false,
    };
  },

  add() {
    Modal.open({ title:'🙏 Add Prayer Request', body:this._form(), width:'520px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-pr-btn">Submit Request</button>` });
    document.getElementById('save-pr-btn').onclick = () => {
      const d=this._collect();
      if(!Validate.check([
        ['pr-req', Validate.required(d.request,'Prayer request text')],
      ])) return;
      var _saved = Storage.insert('prayer',d);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) SupabaseDB.tableUpsert('prayer', _saved).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
      Modal.close(); Toast.success('Prayer request added'); Prayer._rerender();
    };
  },

  edit(id) {
    const r=Storage.findById('prayer',id); if(!r) return;
    Modal.open({ title:'Edit Prayer Request', body:this._form(r), width:'520px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-pr-btn">Save</button>` });
    document.getElementById('save-pr-btn').onclick = () => {
      var _updated = Storage.update('prayer',id,this._collect());
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated() && _updated) SupabaseDB.tableUpsert('prayer', _updated).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
      Modal.close(); Toast.success('Updated'); Prayer._rerender();
    };
  },

  remove(id) {
    UI.confirm('Remove this prayer request?', () => {
      Storage.removeItem('prayer',id);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) SupabaseDB.tableDelete('prayer', id).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
      Toast.success('Removed'); Prayer._rerender();
    });
  },

  // Toggle "I'm Praying" — increments or decrements prayingCount in storage.
  // Uses sessionStorage so each staff user can un-toggle within a session.
  _togglePraying(id, btn) {
    const KEY = `_prayed_${id}`;
    const r   = Storage.findById('prayer', id);
    if (!r) return;
    const alreadyPrayed = sessionStorage.getItem(KEY);
    const current = Number(r.prayingCount || 0);
    const next    = alreadyPrayed ? Math.max(0, current - 1) : current + 1;
    Storage.update('prayer', id, { prayingCount: next });
    if (alreadyPrayed) sessionStorage.removeItem(KEY);
    else               sessionStorage.setItem(KEY, '1');
    // Update button UI without full re-render
    btn.setAttribute('aria-pressed', String(!alreadyPrayed));
    const countSpan = btn.querySelector('.prayer-praying-count');
    if (next > 0) {
      if (countSpan) countSpan.textContent = next;
      else btn.innerHTML = btn.innerHTML + ` <span class="prayer-praying-count">${next}</span>`;
    } else if (countSpan) {
      countSpan.remove();
    }
    btn.classList.toggle('prayer-praying-btn--active', !alreadyPrayed);
  },

  _markAnswered(id) {
    var _answered = Storage.update('prayer',id,{status:'Answered'});
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated() && _answered) SupabaseDB.tableUpsert('prayer', _answered).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
    Toast.success('Marked as answered — praise God!');
    Prayer._rerender();
  },

  addPraise() {
    const cats=['Health','Family','Ministry','Church','Financial','Other'];
    Modal.open({ title:'⭐ Add Praise Report', width:'480px', body:`
      <div class="form-group"><label class="form-label">Title *</label><input class="form-control" id="ps-title"></div>
      <div class="form-group"><label class="form-label">Praise Report *</label><textarea class="form-control" id="ps-text" rows="4"></textarea></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Submitted By</label><input class="form-control" id="ps-by"></div>
        <div class="form-group"><label class="form-label">Category</label>
          <select class="form-control" id="ps-cat">${cats.map(c=>`<option>${c}</option>`).join('')}</select>
        </div>
      </div>`,
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-ps-btn">Add Report</button>` });
    document.getElementById('save-ps-btn').onclick=()=>{
      const title=document.getElementById('ps-title')?.value.trim();
      const text=document.getElementById('ps-text')?.value.trim();
      if(!Validate.check([
        ['ps-title', Validate.required(title,'Title')],
        ['ps-text',  Validate.required(text,'Report text')],
      ])) return;
      var _savedPraise = Storage.insert('praise_reports',{title,text,submittedBy:document.getElementById('ps-by')?.value.trim()||'',category:document.getElementById('ps-cat')?.value,date:Storage.today()});
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) SupabaseDB.tableUpsert('praise_reports', _savedPraise).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
      Modal.close(); Toast.success('Praise report added'); Prayer._rerender();
    };
  },

  removePraise(id) {
    UI.confirm('Remove this praise report?', () => {
      Storage.removeItem('praise_reports', id);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) SupabaseDB.tableDelete('praise_reports', id).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
      Toast.success('Removed'); Prayer._rerender();
    });
  },
};
window.Prayer = Prayer;

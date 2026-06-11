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
      el.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">🙏</div><div class="empty-state-title">No requests found</div></div>`;
      return;
    }
    el.innerHTML = data.map(r => `
      <div class="card" style="position:relative;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px;">
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${UI.badge(r.status, statusColors[r.status]||'gray')}
            <span class="badge badge-gray">${UI.esc(r.category)}</span>
            ${r.private ? '<span class="badge badge-purple">🔒 Private</span>' : ''}
          </div>
          <div style="display:flex;gap:4px;">
            ${r.status !== 'Answered' ? `<button class="btn btn-ghost btn-sm" style="font-size:.72rem" onclick="Prayer._markAnswered('${r.id}')">✅ Answered</button>` : ''}
            <button class="btn btn-ghost btn-sm" onclick="Prayer.edit('${r.id}')">Edit</button>
            <button class="btn btn-ghost btn-sm" style="color:var(--red)" aria-label="Remove prayer request" onclick="Prayer.remove('${r.id}')">✕</button>
          </div>
        </div>
        <p style="font-size:.9rem;line-height:1.6;margin-bottom:10px;">
          ${r.private ? '<em style="color:var(--text-muted)">Private — visible to prayer team only</em>' : UI.esc(r.request)}
        </p>
        <div style="font-size:.76rem;color:var(--text-muted);display:flex;gap:12px;flex-wrap:wrap;">
          <span>📅 ${UI.fmtDate(r.date)}</span>
          ${r.submittedBy ? `<span>👤 ${UI.esc(r.submittedBy)}</span>` : ''}
          ${r.assignedTeam ? `<span>🙏 ${UI.esc(r.assignedTeam)}</span>` : ''}
        </div>
      </div>`).join('');
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
            <span class="search-icon">🔍</span>
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
        <div style="background:linear-gradient(135deg,#dcfce7 0%,#f0fdf4 100%);border-radius:var(--radius);padding:18px;margin-bottom:20px;border:1px solid #86efac;">
          <div style="font-size:1.1rem;font-weight:900;color:#15803d;margin-bottom:4px;">🙏 Answered Prayer Wall</div>
          <div style="font-size:.86rem;color:#166534;">"Therefore I tell you, whatever you ask in prayer, believe that you have received it, and it will be yours." — Mark 11:24</div>
        </div>
        ${answered.length === 0 ? `<div class="empty-state"><div class="empty-state-icon">🌟</div><div class="empty-state-title">No answered prayers yet</div><div style="color:var(--text-muted);font-size:.86rem;">Mark requests as "Answered" to celebrate God's faithfulness</div></div>` :
        `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">
          ${answered.map(r => `
            <div class="card" style="border-left:4px solid var(--green);background:linear-gradient(to right,#f0fdf4,var(--surface));">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                <span style="font-size:1.4rem;">✅</span>
                <div>
                  <div style="font-size:.72rem;font-weight:800;color:var(--green);text-transform:uppercase;">Prayer Answered</div>
                  <div style="font-size:.76rem;color:var(--text-muted)">${UI.fmtDate(r.date)}</div>
                </div>
                <div style="margin-left:auto;display:flex;gap:4px;">
                  <button class="btn btn-ghost btn-sm" onclick="Prayer.edit('${r.id}')">Edit</button>
                  <button class="btn btn-ghost btn-sm" style="color:var(--red)" aria-label="Remove prayer request" onclick="Prayer.remove('${r.id}')">✕</button>
                </div>
              </div>
              <p style="font-size:.9rem;line-height:1.6;margin-bottom:8px;">
                ${r.private ? '<em style="color:var(--text-muted)">Private request — answered by God\'s grace</em>' : UI.esc(r.request)}
              </p>
              <div style="font-size:.76rem;color:var(--text-muted);display:flex;gap:10px;flex-wrap:wrap;">
                <span class="badge badge-gray">${UI.esc(r.category)}</span>
                ${r.submittedBy ? `<span>👤 ${UI.esc(r.submittedBy)}</span>` : ''}
                    </div>
            </div>`).join('')}
        </div>`}
  `;

    /* ══════════════════════════════
       TAB 3 — PRAISE REPORTS
    ══════════════════════════════ */
    } else if (activeTab === 'praise') {
      const reports = (Storage.getAll('praise_reports') || []).sort((a,b)=>b.date.localeCompare(a.date));
      body.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:14px;">
          <button class="btn btn-primary" onclick="Prayer.addPraise()">+ Add Praise Report</button>
        </div>
        ${!reports.length ? `<div class="empty-state"><div class="empty-state-icon">🌟</div><div class="empty-state-title">No praise reports yet</div></div>` :
        `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">
          ${reports.map(r=>`
            <div class="card" style="border-left:4px solid var(--yellow);">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                <div style="font-weight:800;font-size:.95rem;">${UI.esc(r.title)}</div>
                <button class="btn btn-ghost btn-sm" style="color:var(--red);flex-shrink:0;" aria-label="Remove praise report" onclick="Prayer.removePraise('${r.id}')">✕</button>
              </div>
              <p style="font-size:.88rem;line-height:1.6;color:var(--text-muted);margin-bottom:8px;">${UI.esc(r.text)}</p>
              <div style="font-size:.76rem;color:var(--text-muted);display:flex;gap:10px;">
                ${r.submittedBy?`<span>👤 ${UI.esc(r.submittedBy)}</span>`:''}
                <span>📅 ${UI.fmtDate(r.date)}</span>
                <span class="badge badge-gray">${UI.esc(r.category)}</span>
              </div>
            </div>`).join('')}
        </div>`}`;

    /* ══════════════════════════════
       TAB 4 — PRINT LIST
    ══════════════════════════════ */
    } else if (activeTab === 'print') {
      const active = requests.filter(r => r.status !== 'Answered' && !r.private);
      body.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div style="font-size:.9rem;color:var(--text-muted)">${active.length} non-private active requests</div>
          <button class="btn btn-primary" onclick="window.print()">🖨 Print</button>
        </div>
        <div style="font-family:serif;line-height:2;font-size:.95rem;">
          ${active.map((r,i)=>`<div style="padding:6px 0;border-bottom:1px solid var(--border);">
            <strong>${i+1}. ${r.submittedBy||'Anonymous'}</strong> — ${r.category}
            <div style="color:var(--text-muted);font-size:.88rem;margin-left:18px;">${UI.esc(r.request||'').slice(0,120)}${(r.request||'').length>120?'…':''}</div>
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
        <h2 class="section-title">🙏 Prayer Request Center</h2>
        <div class="section-subtitle">${active.length} active · ${answered.length} answered</div>
      </div>
      <button class="btn btn-primary" onclick="Prayer.add()">+ Add Request</button>
    </div>

    <div class="stat-grid" style="margin-bottom:20px;">
      <div class="stat-card" data-accent="orange"><div class="stat-icon">🙏</div><div class="stat-value">${active.length}</div><div class="stat-label">Active Requests</div></div>
      <div class="stat-card" data-accent="green"><div class="stat-icon">✅</div><div class="stat-value">${answered.length}</div><div class="stat-label">Answered Prayers</div></div>
      <div class="stat-card" data-accent="yellow"><div class="stat-icon">⭐</div><div class="stat-value">${praiseCount}</div><div class="stat-label">Praise Reports</div></div>
      <div class="stat-card" data-accent="purple"><div class="stat-icon">🔒</div><div class="stat-value">${requests.filter(r=>r.private).length}</div><div class="stat-label">Private Requests</div></div>
    </div>

    <div id="prayer-tabs" style="display:flex;gap:4px;border-bottom:2px solid var(--border);margin-bottom:20px;flex-wrap:wrap;">
      ${[['active','🙏 Active'],['answered','✅ Answered'],['praise','⭐ Praise'],['print','🖨 Print List']].map(([t,l])=>`
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
    const _s = document.getElementById('prayer-search');
    if (_s) Prayer._state.search = _s.value;
    Prayer._rerender();
    const _ns = document.getElementById('prayer-search');
    if (_ns && Prayer._state.search) { _ns.value = Prayer._state.search; _ns.dispatchEvent(new Event('input')); }
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

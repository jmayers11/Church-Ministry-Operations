/* =============================================================
   members.js  —  Member Directory
   Tabs: Directory | Birthdays & Anniversaries | Ministry Groups
   Profile modal: cross-module giving, prayer, care, volunteer data
   ============================================================= */

Navigation.register('members', function render(page) {
  const members = Storage.getAll('members');
  const today   = Storage.today();
  const statusColors = { Active:'green', Inactive:'gray', Transferred:'yellow', Deceased:'red' };
  let activeTab = Storage.get('_members_tab') || 'directory';

  /* ── helpers ─────────────────────────────────────────── */
  function upcomingBirthdays(within) {
    const now = new Date(today);
    return members
      .filter(m => m.birthday)
      .map(m => {
        const bd = new Date(m.birthday);
        let next = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
        if (next < now) next.setFullYear(now.getFullYear() + 1);
        const days = Math.round((next - now) / 86400000);
        return { ...m, _nextBd: next, _daysUntil: days, _age: next.getFullYear() - bd.getFullYear() };
      })
      .filter(m => m._daysUntil <= within)
      .sort((a, b) => a._daysUntil - b._daysUntil);
  }

  function upcomingAnniversaries(within) {
    const now = new Date(today);
    return members
      .filter(m => m.anniversary)
      .map(m => {
        const an = new Date(m.anniversary);
        let next = new Date(now.getFullYear(), an.getMonth(), an.getDate());
        if (next < now) next.setFullYear(now.getFullYear() + 1);
        const days = Math.round((next - now) / 86400000);
        return { ...m, _nextAn: next, _daysUntilAn: days, _years: next.getFullYear() - an.getFullYear() };
      })
      .filter(m => m._daysUntilAn <= within)
      .sort((a, b) => a._daysUntilAn - b._daysUntilAn);
  }

  function setTab(t) { Storage.set('_members_tab', t); activeTab = t; renderContent(); }

  function renderContent() {
    document.querySelectorAll('#members-tabs .tab-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === activeTab));
    const body = document.getElementById('members-body');
    if (!body) return;

    /* ══════════════════════════════
       TAB 1 — DIRECTORY
    ══════════════════════════════ */
    if (activeTab === 'directory') {
      const ministries = [...new Set(members.flatMap(m => m.ministries || []))].sort();

      body.innerHTML = `
        <div class="toolbar">
          <div class="search-input-wrap">
            <i data-lucide="search" class="search-icon" aria-hidden="true"></i>
            <input type="text" class="search-input" id="member-search" placeholder="Search name, email, ministry…">
          </div>
          <select class="filter-select" id="member-status-filter">
            <option value="">All Statuses</option>
            <option>Active</option><option>Inactive</option><option>Transferred</option><option>Deceased</option>
          </select>
          <select class="filter-select" id="member-ministry-filter">
            <option value="">All Ministries</option>
            ${ministries.map(m => `<option>${UI.esc(m)}</option>`).join('')}
          </select>
        </div>
        <div class="table-wrap" id="members-table-wrap"></div>`;

      function renderTable(data) {
        // Pre-sort (UI.table passes rows as-is, sort state drives header arrows)
        const {col, dir} = Members._sort;
        if (col) {
          data = [...data].sort((a, b) => {
            let av, bv;
            if (col === 'name') { av = `${a.firstName} ${a.lastName}`; bv = `${b.firstName} ${b.lastName}`; }
            else { av = a[col] || ''; bv = b[col] || ''; }
            if (!av) return 1; if (!bv) return -1;
            return (dir === 'asc' ? 1 : -1) * String(av).localeCompare(String(bv));
          });
        }
        UI.table({
          wrap: 'members-table-wrap',
          sort: Members._sort,
          sortFn: 'Members.sortBy',
          selectable: 'members',
          pageSize: 50,
          cols: [
            { key: 'name', label: 'Name',
              fmt: (_, r) => `<strong>${UI.esc(r.firstName)} ${UI.esc(r.lastName)}</strong>` },
            { key: 'family', label: 'Family', hideOnMobile: true,
              fmt: v => UI.esc(v || '—') },
            { key: 'phone', label: 'Phone',
              fmt: v => UI.esc(v || '—') },
            { key: 'email', label: 'Email', hideOnMobile: true,
              fmt: v => v ? `<a href="mailto:${UI.esc(v)}" class="link-accent">${UI.esc(v)}</a>` : '—' },
            { key: 'birthday', label: 'Birthday', hideOnMobile: true,
              fmt: v => v ? UI.fmtDate(v) : '—' },
            { key: 'ministries', label: 'Ministries',
              fmt: v => (v || []).map(min => `<span class="badge badge-blue">${UI.esc(min)}</span>`).join('') || '—' },
            { key: 'status', label: 'Status',
              fmt: v => UI.badge(v, statusColors[v] || 'gray') },
          ],
          rows: data,
          empty: { icon: 'users', title: 'No members found' },
          actions: m => `
            <button class="btn btn-primary btn-sm" onclick="Members.profile('${m.id}')">Profile</button>
            <button class="btn btn-ghost btn-sm" onclick="Members.edit('${m.id}')">Edit</button>
            <button class="btn btn-ghost btn-sm text-danger" aria-label="Remove member" onclick="Members.remove('${m.id}')">×</button>`,
        });
      }

      function filtered() {
        const all = Storage.getAll('members');   // read fresh on every filter/re-render
        const q   = document.getElementById('member-search')?.value.toLowerCase() || '';
        const st  = document.getElementById('member-status-filter')?.value || '';
        const min = document.getElementById('member-ministry-filter')?.value || '';
        return all.filter(m => {
          const full = `${m.firstName} ${m.lastName} ${m.email} ${m.family} ${(m.ministries||[]).join(' ')}`.toLowerCase();
          return (!q || full.includes(q)) && (!st || m.status === st) && (!min || (m.ministries||[]).includes(min));
        });
      }
      renderTable(filtered());
      document.getElementById('member-search')?.addEventListener('input', () => renderTable(filtered()));
      document.getElementById('member-status-filter')?.addEventListener('change', () => renderTable(filtered()));
      document.getElementById('member-ministry-filter')?.addEventListener('change', () => renderTable(filtered()));
      Members._rerender = () => renderTable(filtered());

    /* ══════════════════════════════
       TAB 2 — BIRTHDAYS & ANNIVERSARIES
    ══════════════════════════════ */
    } else if (activeTab === 'birthdays') {
      const bds = upcomingBirthdays(60);
      const ans = upcomingAnniversaries(60);
      const todayBds = bds.filter(m => m._daysUntil === 0);
      const todayAns = ans.filter(m => m._daysUntilAn === 0);

      function bdRow(m) {
        const label = m._daysUntil === 0 ? '🎉 Today!' : `in ${m._daysUntil} day${m._daysUntil===1?'':'s'}`;
        const color = m._daysUntil === 0 ? 'var(--success)' : m._daysUntil <= 7 ? 'var(--warning)' : 'var(--text-muted)';
        return `<tr>
          <td><span class="link-accent" onclick="Members.profile('${m.id}')">${UI.esc(m.firstName)} ${UI.esc(m.lastName)}</span></td>
          <td>${UI.fmtDate(m.birthday)}</td>
          <td style="font-weight:700;color:var(--purple)">Turning ${m._age}</td>
          <td style="font-weight:700;color:${color}">${label}</td>
          <td>${UI.esc(m.phone || '—')}</td>
          <td><a href="mailto:${UI.esc(m.email)}" class="link-accent">${UI.esc(m.email || '—')}</a></td>
        </tr>`;
      }
      function anRow(m) {
        const label = m._daysUntilAn === 0 ? '🎉 Today!' : `in ${m._daysUntilAn} day${m._daysUntilAn===1?'':'s'}`;
        const color = m._daysUntilAn === 0 ? 'var(--success)' : m._daysUntilAn <= 7 ? 'var(--warning)' : 'var(--text-muted)';
        return `<tr>
          <td><span class="link-accent" onclick="Members.profile('${m.id}')">${UI.esc(m.firstName)} ${UI.esc(m.lastName)}</span></td>
          <td>${UI.fmtDate(m.anniversary)}</td>
          <td style="font-weight:700;color:var(--pink,#ec4899)">${m._years} year${m._years===1?'':'s'}</td>
          <td style="font-weight:700;color:${color}">${label}</td>
          <td>${UI.esc(m.phone || '—')}</td>
          <td><a href="mailto:${UI.esc(m.email)}" class="link-accent">${UI.esc(m.email || '—')}</a></td>
        </tr>`;
      }

      body.innerHTML = `
        ${(todayBds.length || todayAns.length) ? `
        <div class="accent-banner">
          <div class="accent-banner__title">🎉 Celebrating Today!</div>
          <div class="accent-banner__body">
            ${todayBds.map(m=>`<div>🎂 <strong>${m.firstName} ${m.lastName}</strong> — Birthday (Turning ${m._age})</div>`).join('')}
            ${todayAns.map(m=>`<div>💍 <strong>${m.firstName} ${m.lastName}</strong> — Anniversary (${m._years} yrs)</div>`).join('')}
          </div>
        </div>` : ''}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <div>
            <h3 style="font-size:.9rem;font-weight:800;margin-bottom:12px;"><i data-lucide="cake" class="icon-inline" aria-hidden="true"></i>Upcoming Birthdays <span class="text-meta" style="font-weight:400">(next 60 days)</span></h3>
            ${bds.length ? `<div class="table-wrap"><table class="data-table">
              <thead><tr><th>Name</th><th>Date</th><th>Age</th><th>In</th><th>Phone</th><th>Email</th></tr></thead>
              <tbody>${bds.map(bdRow).join('')}</tbody>
            </table></div>` : '<div class="text-placeholder" style="padding:20px 0">No upcoming birthdays in the next 60 days.</div>'}
          </div>
          <div>
            <h3 style="font-size:.9rem;font-weight:800;margin-bottom:12px;"><i data-lucide="gem" class="icon-inline" aria-hidden="true"></i>Upcoming Anniversaries <span class="text-meta" style="font-weight:400">(next 60 days)</span></h3>
            ${ans.length ? `<div class="table-wrap"><table class="data-table">
              <thead><tr><th>Name</th><th>Date</th><th>Years</th><th>In</th><th>Phone</th><th>Email</th></tr></thead>
              <tbody>${ans.map(anRow).join('')}</tbody>
            </table></div>` : '<div class="text-placeholder" style="padding:20px 0">No upcoming anniversaries in the next 60 days.</div>'}
          </div>
        </div>`;

    /* ══════════════════════════════
       TAB 3 — MINISTRY GROUPS
    ══════════════════════════════ */
    } else if (activeTab === 'groups') {
      const ministries = [...new Set(members.flatMap(m => m.ministries || []))].sort();
      const groups = ministries.map(min => ({
        name: min,
        members: members.filter(m => (m.ministries || []).includes(min) && m.status === 'Active'),
      })).filter(g => g.members.length > 0);

      body.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">
          ${groups.map(g => `
            <div class="card">
              <div class="flex-between" style="margin-bottom:var(--space-3)">
                <div class="cell-primary">${UI.esc(g.name)}</div>
                ${UI.badge(String(g.members.length), 'brand')}
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                ${g.members.slice(0, 8).map(m => `
                  <div class="flex-between text-meta">
                    <span class="link-accent" onclick="Members.profile('${m.id}')">${UI.esc(m.firstName)} ${UI.esc(m.lastName)}</span>
                    <span class="text-meta">${UI.esc(m.phone || '')}</span>
                  </div>`).join('')}
                ${g.members.length > 8 ? `<div class="text-meta" style="margin-top:2px">+${g.members.length - 8} more…</div>` : ''}
              </div>
            </div>`).join('')}
        </div>`;
    }
  }

  /* ── Page shell ─────────────────────────────────────── */
  const bds30 = upcomingBirthdays(30);
  const active = members.filter(m => m.status === 'Active').length;
  const ministryCount = new Set(members.flatMap(m => m.ministries || [])).size;

  page.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title"><i data-lucide="users" class="icon-inline" aria-hidden="true"></i>Member Directory</h2>
        <div class="section-subtitle">${active} active · ${members.length} total members</div>
      </div>
      <div class="flex-row flex-wrap">
        <button class="btn btn-primary" onclick="Members.add()">+ Add Member</button>
        <button class="btn btn-outline" onclick="Members.exportCSV()">⬇ CSV</button>
      </div>
    </div>

    <div class="stat-grid" style="margin-bottom:20px;">
      <div class="stat-card" data-accent="green"><div class="stat-icon"><i data-lucide="check-circle" aria-hidden="true"></i></div><div class="stat-value">${active}</div><div class="stat-label">Active Members</div></div>
      <div class="stat-card" data-accent="blue"><div class="stat-icon"><i data-lucide="home" aria-hidden="true"></i></div><div class="stat-value">${new Set(members.map(m=>m.family).filter(Boolean)).size}</div><div class="stat-label">Families</div></div>
      <div class="stat-card" data-accent="purple"><div class="stat-icon"><i data-lucide="landmark" aria-hidden="true"></i></div><div class="stat-value">${ministryCount}</div><div class="stat-label">Ministry Teams</div></div>
      <div class="stat-card" data-accent="orange" style="cursor:pointer" onclick="Members._tab('birthdays')">
        <div class="stat-icon"><i data-lucide="cake" aria-hidden="true"></i></div><div class="stat-value">${bds30.length}</div>
        <div class="stat-label">Birthdays This Month</div>
      </div>
    </div>

    <div id="members-tabs" style="display:flex;gap:4px;border-bottom:2px solid var(--border);margin-bottom:20px;flex-wrap:wrap;">
      ${[['directory','<i data-lucide="users" class="icon-inline" aria-hidden="true"></i>Directory'],['birthdays','<i data-lucide="cake" class="icon-inline" aria-hidden="true"></i>Birthdays &amp; Anniversaries'],['groups','<i data-lucide="landmark" class="icon-inline" aria-hidden="true"></i>Ministry Groups']].map(([t,l])=>`
        <button class="tab-btn${activeTab===t?' active':''}" data-tab="${t}" onclick="Members._tab('${t}')">${l}</button>`).join('')}
    </div>
    <div id="members-body"></div>
  `;

  renderContent();
});

/* ── Members global object ──────────────────────────── */
const Members = {
  _state: { search: '' },
  _sort: { col: null, dir: 'asc' },
  _rerender: null,
  sortBy(col) {
    if(this._sort.col===col) this._sort.dir=this._sort.dir==='asc'?'desc':'asc';
    else { this._sort.col=col; this._sort.dir='asc'; }
    this._rerender?.();
  },

  _tab(t) { Storage.set('_members_tab', t); Members._state.search = ''; Navigation.navigate('members'); },

  _statusColors: { Active:'green', Inactive:'gray', Transferred:'blue', Deceased:'gray' },

  _form(m) {
    m = m || {};
    const allMinistries = ["Worship Team","Children's Ministry","Youth Ministry","Outreach","Hospitality","Food Pantry","Prayer Team","Small Groups","Care Ministry","Audio/Visual","Finance Committee","Women's Ministry","Men's Ministry","Choir","Ushers","Greeter"];
    return `
      <div class="form-row">
        <div class="form-group"><label class="form-label">First Name *</label><input class="form-control" id="mb-first" value="${UI.esc(m.firstName||'')}"></div>
        <div class="form-group"><label class="form-label">Last Name *</label><input class="form-control" id="mb-last" value="${UI.esc(m.lastName||'')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Family Name</label><input class="form-control" id="mb-family" value="${UI.esc(m.family||'')}"></div>
        <div class="form-group"><label class="form-label">Status</label>
          <select class="form-control" id="mb-status">
            ${['Active','Inactive','Transferred','Deceased'].map(s=>`<option ${(m.status||'Active')===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Phone</label><input class="form-control" id="mb-phone" value="${UI.esc(m.phone||'')}"></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-control" id="mb-email" type="email" value="${UI.esc(m.email||'')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Birthday</label><input class="form-control" id="mb-birthday" type="date" value="${m.birthday||''}"></div>
        <div class="form-group"><label class="form-label">Anniversary</label><input class="form-control" id="mb-anniversary" type="date" value="${m.anniversary||''}"></div>
      </div>
      <div class="form-group"><label class="form-label">Address</label><input class="form-control" id="mb-address" value="${UI.esc(m.address||'')}"></div>
      <div class="form-group"><label class="form-label">Ministry Involvement</label>
        <div class="chip-row" style="margin-top:var(--space-2);margin-bottom:0">
          ${allMinistries.map(min=>`
            <label class="checkbox-chip">
              <input type="checkbox" value="${UI.esc(min)}" ${(m.ministries||[]).includes(min)?'checked':''}> ${UI.esc(min)}
            </label>`).join('')}
        </div>
      </div>
      <div class="form-group"><label class="form-label">Join Date</label><input class="form-control" id="mb-joined" type="date" value="${m.joinDate||''}"></div>
      <div class="form-group"><label class="form-label">Notes</label><textarea class="form-control" id="mb-notes">${UI.esc(m.notes||'')}</textarea></div>`;
  },

  _collect() {
    const ministries = [...document.querySelectorAll('#modal-body input[type=checkbox]:checked')].map(cb => cb.value);
    return {
      firstName:   document.getElementById('mb-first')?.value.trim(),
      lastName:    document.getElementById('mb-last')?.value.trim(),
      family:      document.getElementById('mb-family')?.value.trim(),
      status:      document.getElementById('mb-status')?.value,
      phone:       document.getElementById('mb-phone')?.value.trim(),
      email:       document.getElementById('mb-email')?.value.trim(),
      birthday:    document.getElementById('mb-birthday')?.value,
      anniversary: document.getElementById('mb-anniversary')?.value,
      address:     document.getElementById('mb-address')?.value.trim(),
      joinDate:    document.getElementById('mb-joined')?.value,
      notes:       document.getElementById('mb-notes')?.value.trim(),
      ministries,
    };
  },

  add() {
    Modal.open({ title:'Add Member', body:this._form(), width:'560px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-mb-btn">Add Member</button>` });
    document.getElementById('save-mb-btn').onclick = () => {
      const d = this._collect();
      if (!Validate.check([
        ['mb-first', Validate.required(d.firstName, 'First name')],
        ['mb-last',  Validate.required(d.lastName,  'Last name')],
        ['mb-email', Validate.email(d.email)],
      ])) return;
      var _saved = Storage.insert('members', d);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) SupabaseDB.tableUpsert('members', _saved).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
      Modal.close(); Toast.success('Member added'); Members._rerender();
    };
  },

  edit(id) {
    const m = Storage.findById('members', id); if (!m) return;
    Modal.open({ title:'Edit Member', body:this._form(m), width:'560px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-mb-btn">Save Changes</button>` });
    document.getElementById('save-mb-btn').onclick = () => {
      var _updated = Storage.update('members', id, this._collect());
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated() && _updated) SupabaseDB.tableUpsert('members', _updated).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
      Modal.close(); Toast.success('Member updated'); Members._rerender();
    };
  },

  remove(id) {
    UI.confirm('Remove this member from the directory?', () => {
      Storage.removeItem('members', id);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) SupabaseDB.tableDelete('members', id).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
      Toast.success('Member removed'); Members._rerender();
    });
  },

  profile(id) {
    ProfileDrawer.open(id);
  },

  exportCSV() {
    const members = Storage.getAll('members');
    const rows = [['First Name','Last Name','Family','Status','Phone','Email','Birthday','Anniversary','Ministries','Join Date','Notes']];
    members.forEach(m => rows.push([
      m.firstName, m.lastName, m.family||'', m.status||'',
      m.phone||'', m.email||'', m.birthday||'', m.anniversary||'',
      (m.ministries||[]).join('; '), m.joinDate||'', m.notes||'',
    ]));
    const csv = rows.map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href=url; a.download='members.csv'; a.click();
    URL.revokeObjectURL(url);
    Toast.success('CSV exported');
  },
};
window.Members = Members;

// ── Bulk actions for the members table ───────────────────────
UI.bulkRegister('members', [
  {
    label: 'Set Inactive',
    variant: 'btn-outline',
    fn(ids) {
      ids.forEach(id => {
        const updated = Storage.update('members', id, { status: 'Inactive' });
        if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated() && updated)
          SupabaseDB.tableUpsert('members', updated).catch(() => {});
      });
      UI._clearSel('members');
      Toast.success(`${ids.length} member${ids.length > 1 ? 's' : ''} set to Inactive`);
      Members._rerender?.();
    },
  },
  {
    label: 'Delete Selected',
    variant: 'btn-ghost text-danger',
    fn(ids) {
      UI.confirm(`Delete ${ids.length} member${ids.length > 1 ? 's' : ''}? This cannot be undone.`, () => {
        ids.forEach(id => {
          Storage.removeItem('members', id);
          if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated())
            SupabaseDB.tableDelete('members', id).catch(() => {});
        });
        UI._clearSel('members');
        Toast.success(`${ids.length} member${ids.length > 1 ? 's' : ''} deleted`);
        Members._rerender?.();
      });
    },
  },
]);

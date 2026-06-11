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
            <span class="search-icon">🔍</span>
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

      function thIcon(key){const {col,dir}=Members._sort;if(col!==key)return`<span style="opacity:.25;font-size:.7rem;margin-left:3px">↕</span>`;return`<span style="font-size:.75rem;margin-left:3px;color:var(--accent)">${dir==='asc'?'↑':'↓'}</span>`;}
      function th(label,key){const active=Members._sort.col===key;return`<th style="cursor:pointer;user-select:none;white-space:nowrap;${active?'color:var(--accent);':''}" onclick="Members.sortBy('${key}')">${label}${thIcon(key)}</th>`;}
      function renderTable(data) {
        const wrap = document.getElementById('members-table-wrap');
        if (!wrap) return;
        const {col,dir}=Members._sort;
        if(col){
          data=[...data];
          data.sort((a,b)=>{
            let av,bv;
            if(col==='name'){av=`${a.firstName} ${a.lastName}`;bv=`${b.firstName} ${b.lastName}`;}
            else{av=a[col]||'';bv=b[col]||'';}
            if(av==null||av==='')return 1;if(bv==null||bv==='')return -1;
            const cmp=String(av).localeCompare(String(bv));return dir==='asc'?cmp:-cmp;
          });
        }
        if (!data.length) {
          wrap.innerHTML = `<table><tbody><tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-title">No members found</div></div></td></tr></tbody></table>`;
          return;
        }
        wrap.innerHTML = `<table class="data-table"><thead><tr>
          ${th('Name','name')}${th('Family','family')}${th('Phone','phone')}${th('Email','email')}
          ${th('Birthday','birthday')}${th('Ministries','ministries')}${th('Status','status')}<th>Actions</th>
        </tr></thead><tbody>${data.map(m => `
          <tr>
            <td><strong>${UI.esc(m.firstName)} ${UI.esc(m.lastName)}</strong></td>
            <td>${UI.esc(m.family || '—')}</td>
            <td>${UI.esc(m.phone || '—')}</td>
            <td><a href="mailto:${UI.esc(m.email)}" style="color:var(--accent)">${UI.esc(m.email || '—')}</a></td>
            <td>${m.birthday ? UI.fmtDate(m.birthday) : '—'}</td>
            <td>${(m.ministries || []).map(min => `<span class="badge badge-blue" style="margin:1px 2px;">${UI.esc(min)}</span>`).join('') || '—'}</td>
            <td>${UI.badge(m.status, statusColors[m.status] || 'gray')}</td>
            <td>
              <button class="btn btn-primary btn-sm" onclick="Members.profile('${m.id}')">Profile</button>
              <button class="btn btn-ghost btn-sm" onclick="Members.edit('${m.id}')">Edit</button>
              <button class="btn btn-ghost btn-sm" style="color:var(--red)" aria-label="Remove member" onclick="Members.remove('${m.id}')">×</button>
            </td>
          </tr>`).join('')}</tbody></table>`;
      }

      function filtered() {
        const q   = document.getElementById('member-search')?.value.toLowerCase() || '';
        const st  = document.getElementById('member-status-filter')?.value || '';
        const min = document.getElementById('member-ministry-filter')?.value || '';
        return members.filter(m => {
          const full = `${m.firstName} ${m.lastName} ${m.email} ${m.family} ${(m.ministries||[]).join(' ')}`.toLowerCase();
          return (!q || full.includes(q)) && (!st || m.status === st) && (!min || (m.ministries||[]).includes(min));
        });
      }
      renderTable(members);
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
        const color = m._daysUntil === 0 ? 'var(--green)' : m._daysUntil <= 7 ? 'var(--orange)' : 'var(--text-muted)';
        return `<tr>
          <td><span style="cursor:pointer;color:var(--accent);font-weight:700" onclick="Members.profile('${m.id}')">${UI.esc(m.firstName)} ${UI.esc(m.lastName)}</span></td>
          <td>${UI.fmtDate(m.birthday)}</td>
          <td style="font-weight:700;color:var(--purple)">Turning ${m._age}</td>
          <td style="font-weight:700;color:${color}">${label}</td>
          <td>${UI.esc(m.phone || '—')}</td>
          <td><a href="mailto:${UI.esc(m.email)}" style="color:var(--accent)">${UI.esc(m.email || '—')}</a></td>
        </tr>`;
      }
      function anRow(m) {
        const label = m._daysUntilAn === 0 ? '🎉 Today!' : `in ${m._daysUntilAn} day${m._daysUntilAn===1?'':'s'}`;
        const color = m._daysUntilAn === 0 ? 'var(--green)' : m._daysUntilAn <= 7 ? 'var(--orange)' : 'var(--text-muted)';
        return `<tr>
          <td><span style="cursor:pointer;color:var(--accent);font-weight:700" onclick="Members.profile('${m.id}')">${UI.esc(m.firstName)} ${UI.esc(m.lastName)}</span></td>
          <td>${UI.fmtDate(m.anniversary)}</td>
          <td style="font-weight:700;color:#ec4899">${m._years} year${m._years===1?'':'s'}</td>
          <td style="font-weight:700;color:${color}">${label}</td>
          <td>${UI.esc(m.phone || '—')}</td>
          <td><a href="mailto:${UI.esc(m.email)}" style="color:var(--accent)">${UI.esc(m.email || '—')}</a></td>
        </tr>`;
      }

      body.innerHTML = `
        ${(todayBds.length || todayAns.length) ? `
        <div style="background:var(--accent-light);border:1px solid var(--accent);border-radius:var(--radius);padding:14px 18px;margin-bottom:20px;">
          <div style="font-weight:800;color:var(--accent);margin-bottom:8px;">🎉 Celebrating Today!</div>
          <div style="font-size:.88rem;display:flex;flex-wrap:wrap;gap:12px;">
            ${todayBds.map(m=>`<div>🎂 <strong>${m.firstName} ${m.lastName}</strong> — Birthday (Turning ${m._age})</div>`).join('')}
            ${todayAns.map(m=>`<div>💍 <strong>${m.firstName} ${m.lastName}</strong> — Anniversary (${m._years} yrs)</div>`).join('')}
          </div>
        </div>` : ''}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <div>
            <h3 style="font-size:.9rem;font-weight:800;margin-bottom:12px;">🎂 Upcoming Birthdays <span style="color:var(--text-muted);font-weight:400">(next 60 days)</span></h3>
            ${bds.length ? `<div class="table-wrap"><table class="data-table">
              <thead><tr><th>Name</th><th>Date</th><th>Age</th><th>In</th><th>Phone</th><th>Email</th></tr></thead>
              <tbody>${bds.map(bdRow).join('')}</tbody>
            </table></div>` : '<div style="color:var(--text-muted);font-size:.86rem;padding:20px 0">No upcoming birthdays in the next 60 days.</div>'}
          </div>
          <div>
            <h3 style="font-size:.9rem;font-weight:800;margin-bottom:12px;">💍 Upcoming Anniversaries <span style="color:var(--text-muted);font-weight:400">(next 60 days)</span></h3>
            ${ans.length ? `<div class="table-wrap"><table class="data-table">
              <thead><tr><th>Name</th><th>Date</th><th>Years</th><th>In</th><th>Phone</th><th>Email</th></tr></thead>
              <tbody>${ans.map(anRow).join('')}</tbody>
            </table></div>` : '<div style="color:var(--text-muted);font-size:.86rem;padding:20px 0">No upcoming anniversaries in the next 60 days.</div>'}
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
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                           <div style="font-weight:800;font-size:.96rem;">${UI.esc(g.name)}</div>
                <div style="background:var(--accent-light);color:var(--accent);border-radius:20px;padding:3px 10px;font-size:.78rem;font-weight:800;">${g.members.length}</div>
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                ${g.members.slice(0, 8).map(m => `
                  <div style="display:flex;align-items:center;justify-content:space-between;font-size:.83rem;">
                    <span style="cursor:pointer;color:var(--accent)" onclick="Members.profile('${m.id}')">${UI.esc(m.firstName)} ${UI.esc(m.lastName)}</span>
                    <span style="color:var(--text-muted);font-size:.74rem">${UI.esc(m.phone || '')}</span>
                  </div>`).join('')}
                ${g.members.length > 8 ? `<div style="font-size:.76rem;color:var(--text-muted);margin-top:2px;">+${g.members.length - 8} more…</div>` : ''}
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
        <h2 class="section-title">👥 Member Directory</h2>
        <div class="section-subtitle">${active} active · ${members.length} total members</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="Members.add()">+ Add Member</button>
        <button class="btn btn-outline" onclick="Members.exportCSV()">⬇ CSV</button>
      </div>
    </div>

    <div class="stat-grid" style="margin-bottom:20px;">
      <div class="stat-card" data-accent="green"><div class="stat-icon">✅</div><div class="stat-value">${active}</div><div class="stat-label">Active Members</div></div>
      <div class="stat-card" data-accent="blue"><div class="stat-icon">👨‍👩‍👧</div><div class="stat-value">${new Set(members.map(m=>m.family).filter(Boolean)).size}</div><div class="stat-label">Families</div></div>
      <div class="stat-card" data-accent="purple"><div class="stat-icon">⛪</div><div class="stat-value">${ministryCount}</div><div class="stat-label">Ministry Teams</div></div>
      <div class="stat-card" data-accent="orange" style="cursor:pointer" onclick="Members._tab('birthdays')">
        <div class="stat-icon">🎂</div><div class="stat-value">${bds30.length}</div>
        <div class="stat-label">Birthdays This Month</div>
      </div>
    </div>

    <div id="members-tabs" style="display:flex;gap:4px;border-bottom:2px solid var(--border);margin-bottom:20px;flex-wrap:wrap;">
      ${[['directory','👥 Directory'],['birthdays','🎂 Birthdays & Anniversaries'],['groups','⛪ Ministry Groups']].map(([t,l])=>`
        <button class="tab-btn${activeTab===t?' active':''}" data-tab="${t}" onclick="Members._tab('${t}')">${l}</button>`).join('')}
    </div>
    <div id="members-body"></div>
  `;

  renderContent();
});

/* ── Members global object ──────────────────────────── */
const Members = {
  _state: { search: '' },
  _rerender() {
    const _s = document.getElementById('member-search');
    if (_s) Members._state.search = _s.value;
    Members._rerender();
    const _ns = document.getElementById('member-search');
    if (_ns && Members._state.search) { _ns.value = Members._state.search; _ns.dispatchEvent(new Event('input')); }
  },
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
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">
          ${allMinistries.map(min=>`
            <label style="display:flex;align-items:center;gap:4px;font-size:.82rem;cursor:pointer;background:var(--surface-2);padding:4px 8px;border-radius:6px;">
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
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) SupabaseDB.tableUpsert('members', _saved).catch(function(e){console.warn('[Sync]',e);});
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
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated() && _updated) SupabaseDB.tableUpsert('members', _updated).catch(function(e){console.warn('[Sync]',e);});
      Modal.close(); Toast.success('Member updated'); Members._rerender();
    };
  },

  remove(id) {
    UI.confirm('Remove this member from the directory?', () => {
      Storage.removeItem('members', id);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) SupabaseDB.tableDelete('members', id).catch(function(e){console.warn('[Sync]',e);});
      Toast.success('Member removed'); Members._rerender();
    });
  },

  profile(id) {
    const m = Storage.findById('members', id); if (!m) return;
    const fullName = `${m.firstName} ${m.lastName}`;
    const year = new Date().getFullYear().toString();
    const donations = (Storage.getAll('giving_donations') || []).filter(d => d.memberName === fullName);
    const ytdGiving = donations.filter(d => d.date?.startsWith(year)).reduce((s,d) => s + (Number(d.amount)||0), 0);
    const lifetimeGiving = donations.reduce((s,d) => s + (Number(d.amount)||0), 0);
    const prayerReqs = (Storage.getAll('prayer') || []).filter(p => p.submittedBy === fullName);
    const careRecs   = (Storage.getAll('care') || []).filter(c => c.name === fullName || c.assignedTo === fullName);
    const volRecord  = (Storage.getAll('volunteers') || []).find(v => v.name === fullName);
    const fmt = n => `$${Number(n).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}`;
    const bgColors = { Active:'green', Inactive:'gray', Transferred:'blue', Deceased:'gray' };

    Modal.open({ title:`Profile: ${UI.esc(fullName)}`, width:'580px', body:`
      <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;">
        <div style="width:54px;height:54px;border-radius:50%;background:var(--accent-light);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:900;flex-shrink:0;">
          ${(m.firstName||'?')[0]}
        </div>
        <div style="flex:1;min-width:200px;">
          <div style="font-size:1.1rem;font-weight:900;">${UI.esc(fullName)}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin:5px 0;">
            ${UI.badge(m.status||'Active', bgColors[m.status]||'gray')}
            ${m.family ? `<span style="font-size:.8rem;color:var(--text-muted)">👨‍👩‍👧 ${UI.esc(m.family)}</span>` : ''}
          </div>
          <div style="font-size:.82rem;color:var(--text-muted);line-height:1.6;">
            ${m.phone ? `📞 ${UI.esc(m.phone)}<br>` : ''}
            ${m.email ? `✉️ ${UI.esc(m.email)}<br>` : ''}
            ${m.joinDate ? `📅 Joined ${UI.fmtDate(m.joinDate)}` : ''}
          </div>
        </div>
      </div>
      ${(m.ministries||[]).length ? `
      <div style="margin-bottom:16px;">
        <div style="font-size:.72rem;font-weight:800;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;">Ministry Involvement</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">
          ${(m.ministries||[]).map(min=>`<span class="badge badge-blue">${UI.esc(min)}</span>`).join('')}
        </div>
      </div>` : ''}
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;">
        <div style="background:var(--surface-2);border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:1.1rem;font-weight:900;color:var(--green)">${fmt(ytdGiving)}</div>
          <div style="font-size:.7rem;color:var(--text-muted)">YTD Giving</div>
        </div>
        <div style="background:var(--surface-2);border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:1.1rem;font-weight:900;color:var(--green)">${fmt(lifetimeGiving)}</div>
          <div style="font-size:.7rem;color:var(--text-muted)">Lifetime Giving</div>
        </div>
        <div style="background:var(--surface-2);border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:1.1rem;font-weight:900;">${donations.length}</div>
          <div style="font-size:.7rem;color:var(--text-muted)">Gifts on Record</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
        <div style="background:var(--surface-2);border-radius:8px;padding:12px;">
          <div style="font-size:.72rem;font-weight:800;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;">Volunteer</div>
          ${volRecord ? `<div style="font-size:.85rem;font-weight:700;">${UI.esc(volRecord.team)}</div>
            <div style="font-size:.78rem;color:var(--text-muted)">${UI.esc(volRecord.role||'')}</div>`
          : '<div style="color:var(--text-muted);font-size:.82rem;">Not on roster</div>'}
        </div>
        <div style="background:var(--surface-2);border-radius:8px;padding:12px;">
          <div style="font-size:.72rem;font-weight:800;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;">Care Ministry</div>
          ${careRecs.length ? `<div style="font-size:.82rem;">${careRecs.length} care record${careRecs.length>1?'s':''}</div>`
          : '<div style="color:var(--text-muted);font-size:.82rem;">No care records</div>'}
        </div>
      </div>
      ${prayerReqs.length ? `
      <div style="margin-bottom:8px;">
        <div style="font-size:.72rem;font-weight:800;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;">Prayer Requests (${prayerReqs.length})</div>
        ${prayerReqs.slice(0,3).map(p=>`<div style="font-size:.82rem;padding:5px 0;border-bottom:1px solid var(--border);">${UI.esc((p.request||'').slice(0,80))}${(p.request||'').length>80?'…':''}</div>`).join('')}
      </div>` : ''}
      ${m.notes ? `<div style="font-size:.82rem;color:var(--text-muted);border-top:1px solid var(--border);padding-top:10px;">📝 ${UI.esc(m.notes)}</div>` : ''}
    `,
    footer:`<button class="btn btn-outline" onclick="Modal.close()">Close</button>
            <button class="btn btn-primary" onclick="Modal.close();Members.edit('${id}')">Edit Profile</button>`});
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

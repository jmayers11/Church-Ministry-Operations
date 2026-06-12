/* =============================================================
   volunteers.js  —  Volunteer Management
   Tabs: Roster | Background Checks | Hours Log
   ============================================================= */

Navigation.register('volunteers', function render(page) {
  const volunteers = Storage.getAll('volunteers');
  const teams = ['Worship Team', "Children's Ministry", 'Youth Ministry', 'Outreach', 'Hospitality', 'Security', 'Small Groups', 'Audio/Visual', 'Food Pantry', 'Care'];
  const bgColors = { Approved:'green', Pending:'yellow', Expired:'red', 'Not Required':'gray' };
  let activeTab = Storage.get('_vols_tab') || 'roster';

  /* ── seed hours log if empty ─────────────────────────── */
  if (!Storage.get('_vol_hours_seeded') && volunteers.length) {
    const today = new Date(Storage.today());
    volunteers.slice(0, 12).forEach(v => {
      for (let i = 0; i < 3; i++) {
        const d = new Date(today); d.setDate(d.getDate() - Math.floor(Math.random()*90));
        Storage.insert('vol_hours', {
          volunteerId: v.id, volunteerName: v.name, team: v.team,
          date: d.toISOString().slice(0,10),
          hours: [1,1.5,2,2.5,3,4][Math.floor(Math.random()*6)],
          activity: (['Sunday service setup','Community outreach','Food pantry shift','Youth event','Hospitality greeting','AV support','Small group facilitation','Cleaning/maintenance'])[Math.floor(Math.random()*8)],
        });
      }
    });
    Storage.set('_vol_hours_seeded', true);
  }

  function setTab(t) { Storage.set('_vols_tab', t); activeTab = t; renderContent(); }

  function renderContent() {
    document.querySelectorAll('#vols-tabs .tab-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === activeTab));
    const body = document.getElementById('vols-body');
    if (!body) return;

    /* ══════════════════════════════
       TAB 1 — ROSTER
    ══════════════════════════════ */
    if (activeTab === 'roster') {
      function thIconV(key) {
        const {col,dir}=Vols._sort;
        if(col!==key) return `<span style="opacity:.25;font-size:.7rem;margin-left:3px">&#x21D5;</span>`;
        return `<span style="font-size:.75rem;margin-left:3px;color:var(--accent)">${dir==='asc'?'&#x2191;':'&#x2193;'}</span>`;
      }
      function thV(label,key) {
        const {col,dir}=Vols._sort;const active=col===key;const aSort=active?(dir==='asc'?'ascending':'descending'):'none';
        return `<th aria-sort="${aSort}" style="white-space:nowrap;${active?'color:var(--accent);':''}"><button type="button" class="sort-btn" onclick="Vols.sortBy('${key}')">${label}${thIconV(key)}</button></th>`;
      }
      function renderTable(data) {
        const wrap = document.getElementById('vol-roster-wrap');
        if (!wrap) return;
        if (!data.length) {
          wrap.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i data-lucide="users" aria-hidden="true"></i></div><div class="empty-state-title">No volunteers found</div></div>`;
          return;
        }
        const {col,dir} = Vols._sort;
        const sorted = col ? [...data].sort((a,b) => {
          const av=a[col]??'', bv=b[col]??'';
          const r = String(av).localeCompare(String(bv));
          return dir==='asc'?r:-r;
        }) : data;
        wrap.innerHTML = `<table class="data-table"><thead><tr>
          ${thV('Name','name')}${thV('Role','role')}${thV('Team','team')}${thV('Availability','availability')}${thV('BG Check','bgCheck')}<th>Notes</th><th>Actions</th>
        </tr></thead><tbody>${sorted.map(v => `
          <tr>
            <td><strong>${UI.esc(v.name)}</strong></td>
            <td>${UI.esc(v.role || '&#x2014;')}</td>
            <td><span class="badge badge-blue">${UI.esc(v.team)}</span></td>
            <td>${UI.esc(v.availability || '&#x2014;')}</td>
            <td>${UI.badge(v.bgCheck, bgColors[v.bgCheck] || 'gray')}</td>
            <td class="text-meta">${UI.esc(v.schedulingNotes||'')}</td>
            <td>
              <button class="btn btn-primary btn-sm" onclick="Vols.profile('${v.id}')">Profile</button>
              <button class="btn btn-ghost btn-sm" onclick="Vols.edit('${v.id}')">Edit</button>
              <button class="btn btn-ghost btn-sm text-danger" aria-label="Remove volunteer" onclick="Vols.remove('${v.id}')">&times;</button>
            </td>
          </tr>`).join('')}</tbody></table>`;
      }

      function filtered() {
        const q  = document.getElementById('vol-search')?.value.toLowerCase() || '';
        const t  = document.getElementById('vol-team-filter')?.value || '';
        const bg = document.getElementById('vol-bg-filter')?.value || '';
        return Storage.getAll('volunteers').filter(v => {
          const txt = `${v.name} ${v.role} ${v.team} ${v.schedulingNotes||''}`.toLowerCase();
          return (!q || txt.includes(q)) && (!t || v.team === t) && (!bg || v.bgCheck === bg);
        });
      }

      body.innerHTML = `
        <div class="toolbar">
          <div class="search-input-wrap">
            <i data-lucide="search" class="search-icon" aria-hidden="true"></i>
            <input type="text" class="search-input" id="vol-search" placeholder="Search volunteers&hellip;">
          </div>
          <select class="filter-select" id="vol-team-filter">
            <option value="">All Teams</option>
            ${teams.map(t => `<option>${t}</option>`).join('')}
          </select>
          <select class="filter-select" id="vol-bg-filter">
            <option value="">All BG Statuses</option>
            <option>Approved</option><option>Pending</option><option>Expired</option>
          </select>
        </div>
        <div class="table-wrap" id="vol-roster-wrap"></div>`;

      renderTable(filtered());
      document.getElementById('vol-search')?.addEventListener('input', () => renderTable(filtered()));
      document.getElementById('vol-team-filter')?.addEventListener('change', () => renderTable(filtered()));
      document.getElementById('vol-bg-filter')?.addEventListener('change', () => renderTable(filtered()));
      Vols._rerender = () => renderTable(filtered());

    /* ══════════════════════════════
       TAB 2 — BACKGROUND CHECKS
    ══════════════════════════════ */
    } else if (activeTab === 'bgchecks') {
      const expired  = volunteers.filter(v => v.bgCheck === 'Expired');
      const pending  = volunteers.filter(v => v.bgCheck === 'Pending');
      const approved = volunteers.filter(v => v.bgCheck === 'Approved');
      const notReq   = volunteers.filter(v => v.bgCheck === 'Not Required');

      function bgTable(list) {
        if (!list.length) return '<div class="text-meta" style="padding:10px 0">None</div>';
        return `<div class="table-wrap"><table class="data-table">
          <thead><tr><th>Name</th><th>Team</th><th>Role</th><th>Availability</th><th>Actions</th></tr></thead>
          <tbody>${list.map(v=>`<tr>
            <td><strong>${UI.esc(v.name)}</strong></td>
            <td><span class="badge badge-blue">${UI.esc(v.team)}</span></td>
            <td>${UI.esc(v.role||'&#x2014;')}</td>
            <td>${UI.esc(v.availability||'&#x2014;')}</td>
            <td>
              <button class="btn btn-ghost btn-sm" onclick="Vols._updateBG('${v.id}','Approved')">&#x2705; Approve</button>
              <button class="btn btn-ghost btn-sm" onclick="Vols._updateBG('${v.id}','Pending')">&#x1F550; Pending</button>
            </td>
          </tr>`).join('')}</tbody>
        </table></div>`;
      }

      body.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:20px;">
          <div class="stat-box" style="border:1px solid var(--danger)">
            <div class="stat-box__value text-danger">${expired.length}</div>
            <div class="stat-box__label">Expired</div>
          </div>
          <div class="stat-box" style="border:1px solid var(--warning)">
            <div class="stat-box__value" style="color:var(--warning)">${pending.length}</div>
            <div class="stat-box__label">Pending</div>
          </div>
          <div class="stat-box" style="border:1px solid var(--success)">
            <div class="stat-box__value text-success">${approved.length}</div>
            <div class="stat-box__label">Approved</div>
          </div>
          <div class="stat-box">
            <div class="stat-box__value">${notReq.length}</div>
            <div class="stat-box__label">Not Required</div>
          </div>
        </div>

        ${expired.length ? `<div style="margin-bottom:20px;">
          <h3 style="font-size:var(--text-sm);font-weight:800;color:var(--danger);margin-bottom:var(--space-2)"><i data-lucide="alert-circle" class="icon-inline" aria-hidden="true"></i>Expired &mdash; Action Required</h3>
          ${bgTable(expired)}
        </div>` : ''}

        ${pending.length ? `<div style="margin-bottom:20px;">
          <h3 style="font-size:var(--text-sm);font-weight:800;color:var(--warning);margin-bottom:var(--space-2)"><i data-lucide="alert-triangle" class="icon-inline" aria-hidden="true"></i>Pending Background Checks</h3>
          ${bgTable(pending)}
        </div>` : ''}

        <div style="margin-bottom:20px;">
          <h3 style="font-size:var(--text-sm);font-weight:800;color:var(--success-text);margin-bottom:var(--space-2)"><i data-lucide="check-circle" class="icon-inline" aria-hidden="true"></i>Approved</h3>
          ${bgTable(approved)}
        </div>`;

    /* ══════════════════════════════
       TAB 3 — HOURS LOG
    ══════════════════════════════ */
    } else if (activeTab === 'hours') {
      const hours = Storage.getAll('vol_hours') || [];
      const totalHrs = hours.reduce((s,h) => s + (Number(h.hours)||0), 0);
      const thisMonth = Storage.today().slice(0,7);
      const monthHrs  = hours.filter(h => h.date?.startsWith(thisMonth)).reduce((s,h) => s + (Number(h.hours)||0), 0);

      const byVol = {};
      hours.forEach(h => {
        if (!byVol[h.volunteerName]) byVol[h.volunteerName] = { name: h.volunteerName, team: h.team, hours: 0 };
        byVol[h.volunteerName].hours += Number(h.hours)||0;
      });
      const topVols = Object.values(byVol).sort((a,b) => b.hours - a.hours);

      function hoursFiltered() {
        const q = document.getElementById('hours-search')?.value.toLowerCase() || '';
        const t = document.getElementById('hours-team-filter')?.value || '';
        return Storage.getAll('vol_hours').filter(h => {
          const txt = `${h.volunteerName} ${h.team} ${h.activity}`.toLowerCase();
          return (!q || txt.includes(q)) && (!t || h.team === t);
        }).sort((a,b) => b.date.localeCompare(a.date));
      }

      function thIconH(key) {
        const {col,dir}=Vols._sort;
        if(col!==key) return `<span style="opacity:.25;font-size:.7rem;margin-left:3px">&#x21D5;</span>`;
        return `<span style="font-size:.75rem;margin-left:3px;color:var(--accent)">${dir==='asc'?'&#x2191;':'&#x2193;'}</span>`;
      }
      function thH(label,key) {
        const {col,dir}=Vols._sort;const active=col===key;const aSort=active?(dir==='asc'?'ascending':'descending'):'none';
        return `<th aria-sort="${aSort}" style="white-space:nowrap;${active?'color:var(--accent);':''}"><button type="button" class="sort-btn" onclick="Vols.sortBy('${key}')">${label}${thIconH(key)}</button></th>`;
      }
      function renderHoursTable(data) {
        const wrap = document.getElementById('hours-table-wrap');
        if (!wrap) return;
        if (!data.length) { wrap.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:20px;">No hours logged</div>`; return; }
        const {col,dir} = Vols._sort;
        const sorted = col ? [...data].sort((a,b) => {
          const av=a[col]??'', bv=b[col]??'';
          const r = col==='hours' ? Number(av)-Number(bv) : String(av).localeCompare(String(bv));
          return dir==='asc'?r:-r;
        }) : data;
        wrap.innerHTML = `<table class="data-table"><thead><tr>
          ${thH('Date','date')}${thH('Volunteer','volunteerName')}${thH('Team','team')}${thH('Activity','activity')}${thH('Hours','hours')}<th></th>
        </tr></thead><tbody>${sorted.map(h => `<tr>
          <td>${UI.fmtDate(h.date)}</td>
          <td><strong>${UI.esc(h.volunteerName)}</strong></td>
          <td><span class="badge badge-blue">${UI.esc(h.team)}</span></td>
          <td>${UI.esc(h.activity||'')}</td>
          <td style="font-weight:700;color:var(--accent)">${h.hours}h</td>
          <td><button class="btn btn-ghost btn-sm text-danger" aria-label="Remove hours log" onclick="Vols._removeHours('${h.id}')">&times;</button></td>
        </tr>`).join('')}</tbody></table>`;
      }

      body.innerHTML = `
        <div class="flex-row flex-wrap" style="margin-bottom:var(--space-5)">
          <div class="stat-box">
            <div class="stat-box__value" style="color:var(--accent)">${totalHrs.toFixed(1)}h</div>
            <div class="stat-box__label">All-Time Hours</div>
          </div>
          <div class="stat-box">
            <div class="stat-box__value text-success">${monthHrs.toFixed(1)}h</div>
            <div class="stat-box__label">This Month</div>
          </div>
          <button class="btn btn-primary" style="margin-left:auto" onclick="Vols.logHours()">+ Log Hours</button>
        </div>

        ${topVols.length ? `<div style="margin-bottom:var(--space-5)">
          <div class="section-label-sm">Top Volunteers</div>
          <div class="chip-row" style="margin-bottom:0">
            ${topVols.slice(0,6).map((v,i)=>`
              <div class="flex-row info-box" style="padding:var(--space-2) var(--space-3)">
                <span class="text-meta" style="font-weight:800;min-width:18px">${i+1}.</span>
                <span>${UI.esc(v.name)}</span>
                <span class="badge badge-blue">${UI.esc(v.team)}</span>
                <strong style="color:var(--accent)">${v.hours.toFixed(1)}h</strong>
              </div>`).join('')}
          </div>
        </div>` : ''}

        <div class="toolbar" style="margin-bottom:12px;">
          <div class="search-input-wrap">
            <i data-lucide="search" class="search-icon" aria-hidden="true"></i>
            <input type="text" class="search-input" id="hours-search" placeholder="Search name or activity&hellip;">
          </div>
          <select class="filter-select" id="hours-team-filter">
            <option value="">All Teams</option>
            ${teams.map(t => `<option>${t}</option>`).join('')}
          </select>
        </div>
        <div class="table-wrap" id="hours-table-wrap"></div>`;

      renderHoursTable(hoursFiltered());
      document.getElementById('hours-search')?.addEventListener('input', () => renderHoursTable(hoursFiltered()));
      document.getElementById('hours-team-filter')?.addEventListener('change', () => renderHoursTable(hoursFiltered()));
      Vols._rerender = () => renderHoursTable(hoursFiltered());

    /* ══════════════════════════════
       TAB 4 — WEEK SCHEDULE GRID
    ══════════════════════════════ */
    } else if (activeTab === 'schedule') {
      const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const AVAIL_MAP = {
        'Weekends':    [0, 6],
        'Sundays':     [0],
        'Saturdays':   [6],
        'Weekdays':    [1, 2, 3, 4, 5],
        'Monday':      [1], 'Tuesday': [2], 'Wednesday': [3],
        'Thursday':    [4], 'Friday':  [5],
        'Any':         [0, 1, 2, 3, 4, 5, 6],
      };

      function availDays(avail) {
        if (!avail) return [];
        const lower = avail.toLowerCase();
        for (const [key, days] of Object.entries(AVAIL_MAP)) {
          if (lower.includes(key.toLowerCase())) return days;
        }
        return [];
      }

      // Build team → day → [volunteers] mapping
      const schedMap = {};
      teams.forEach(t => {
        schedMap[t] = { 0:[], 1:[], 2:[], 3:[], 4:[], 5:[], 6:[] };
      });
      volunteers.forEach(v => {
        const days = availDays(v.availability);
        if (days.length && schedMap[v.team]) {
          days.forEach(d => schedMap[v.team][d].push(v));
        }
      });

      // Filter to teams with at least one assignment
      const activeSched = Object.entries(schedMap).filter(([t, days]) =>
        Object.values(days).some(arr => arr.length > 0)
      );

      body.innerHTML = `
        <div class="section-label-sm" style="margin-bottom:var(--space-3)">
          Team assignments based on volunteers' availability preferences.
          ${volunteers.filter(v => !v.availability).length > 0
            ? `<span class="text-meta"> · ${volunteers.filter(v=>!v.availability).length} volunteers have no availability set.</span>`
            : ''}
        </div>
        ${activeSched.length === 0
          ? UI.emptyState({ icon:'calendar-days', title:'No schedule data', body:'Set availability on volunteer profiles to populate the week grid.' })
          : `<div class="vol-week-grid-wrap">
          <table class="vol-week-grid data-table">
            <thead>
              <tr>
                <th class="vol-week-team-col">Team</th>
                ${DAY_NAMES.map(d => `<th class="vol-week-day-col">${d.slice(0,3)}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${activeSched.map(([team, days]) => `
                <tr>
                  <td class="vol-week-team-cell">
                    <span class="badge badge-blue" style="white-space:nowrap">${UI.esc(team)}</span>
                  </td>
                  ${DAY_NAMES.map((_, di) => {
                    const vols = days[di];
                    if (!vols.length) return `<td class="vol-week-empty-cell">—</td>`;
                    const hasExpired = vols.some(v => v.bgCheck === 'Expired');
                    return `<td class="vol-week-cell${hasExpired ? ' vol-week-cell--warn' : ''}">
                      ${vols.map(v =>
                        `<button class="vol-week-chip" onclick="Vols.profile('${v.id}')" title="View ${UI.esc(v.name)}"${v.bgCheck==='Expired'?' style="border-color:var(--danger)"':''}>${UI.esc(v.name.split(' ')[0])}${v.bgCheck==='Expired'?'<i data-lucide="alert-circle" style="width:10px;height:10px;margin-left:2px;color:var(--danger)" aria-hidden="true"></i>':''}</button>`
                      ).join('')}
                    </td>`;
                  }).join('')}
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`}
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      Vols._rerender = () => Vols._tab('schedule');
    }
  }

  /* ── Page shell ──────────────────────────────────────── */
  const teamStats = teams.map(t => ({
    team: t,
    count: volunteers.filter(v => v.team === t).length,
    pending: volunteers.filter(v => v.team === t && v.bgCheck === 'Pending').length,
  })).filter(t => t.count > 0);

  const expired = volunteers.filter(v => v.bgCheck === 'Expired').length;
  const pending = volunteers.filter(v => v.bgCheck === 'Pending').length;

  page.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title"><i data-lucide="users" class="icon-inline" aria-hidden="true"></i>Volunteer Management</h2>
        <div class="section-subtitle">${volunteers.length} volunteers across ${new Set(volunteers.map(v=>v.team)).size} teams</div>
      </div>
      <div class="flex-row flex-wrap">
        <button class="btn btn-primary" onclick="Vols.add()">+ Add Volunteer</button>
        <button class="btn btn-outline" onclick="Vols.logHours()"><i data-lucide="clock" class="icon-inline" aria-hidden="true"></i>Log Hours</button>
      </div>
    </div>

    ${expired ? `<div class="alert-banner alert-banner-red" onclick="Vols._tab('bgchecks')" style="cursor:pointer;">
      <i data-lucide="alert-circle" class="icon-inline" aria-hidden="true"></i><strong>${expired} expired background check${expired>1?'s':''}</strong> require attention &mdash; <span style="text-decoration:underline;">review now &rarr;</span>
    </div>` : ''}
    ${!expired && pending ? `<div class="alert-banner alert-banner-yellow" onclick="Vols._tab('bgchecks')" style="cursor:pointer;">
      <i data-lucide="alert-triangle" class="icon-inline" aria-hidden="true"></i><strong>${pending} background check${pending>1?'s':''} pending</strong> &mdash; <span style="text-decoration:underline;">review &rarr;</span>
    </div>` : ''}

    <div class="chip-row" style="margin-bottom:var(--space-5)">
      ${teamStats.map(t => `
        <div class="flex-row card" style="padding:var(--space-2) var(--space-4)">
          <span style="font-weight:700;font-size:var(--text-xl);color:var(--accent)">${t.count}</span>
          <span style="font-size:var(--text-sm);font-weight:700">${UI.esc(t.team)}</span>
          ${t.pending ? `<span class="text-meta" style="color:var(--warning)"><i data-lucide="alert-triangle" class="icon-xs" aria-hidden="true"></i>${t.pending}</span>` : ''}
        </div>`).join('')}
    </div>

    <div id="vols-tabs" style="display:flex;gap:4px;border-bottom:2px solid var(--border);margin-bottom:20px;flex-wrap:wrap;">
      ${[['roster','<i data-lucide="clipboard-list" class="icon-inline" aria-hidden="true"></i>Roster'],['bgchecks','<i data-lucide="shield-check" class="icon-inline" aria-hidden="true"></i>Background Checks'],['hours','<i data-lucide="clock" class="icon-inline" aria-hidden="true"></i>Hours Log'],['schedule','<i data-lucide="calendar-days" class="icon-inline" aria-hidden="true"></i>Week Schedule']].map(([t,l])=>`
        <button class="tab-btn${activeTab===t?' active':''}" data-tab="${t}" onclick="Vols._tab('${t}')">${l}</button>`).join('')}
    </div>
    <div id="vols-body"></div>
  `;

  renderContent();
});

/* ── Vols global object ──────────────────────────────── */
const Vols = {
  _state: { search: '' },
  _rerender() {
    const _s = document.getElementById('vol-search');
    if (_s) Vols._state.search = _s.value;
    Vols._rerender();
    const _ns = document.getElementById('vol-search');
    if (_ns && Vols._state.search) { _ns.value = Vols._state.search; _ns.dispatchEvent(new Event('input')); }
  },
  _sort: { col: null, dir: 'asc' },
  _rerender: null,
  sortBy(col) {
    if(this._sort.col===col) this._sort.dir=this._sort.dir==='asc'?'desc':'asc';
    else { this._sort.col=col; this._sort.dir='asc'; }
    this._rerender?.();
  },
  _teams: ['Worship Team', "Children's Ministry", 'Youth Ministry', 'Outreach', 'Hospitality', 'Security', 'Small Groups', 'Audio/Visual', 'Food Pantry', 'Care'],

  _tab(t) { Storage.set('_vols_tab', t); Vols._state.search = ''; Navigation.navigate('volunteers'); },

  _updateBG(id, status) {
    var _bgUpdated = Storage.update('volunteers', id, { bgCheck: status });
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated() && _bgUpdated) SupabaseDB.tableUpsert('volunteers', _bgUpdated).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
    Toast.success(`Background check marked ${status}`);
    Vols._rerender();
  },

  _removeHours(id) {
    UI.confirm('Remove this hours entry?', () => {
      Storage.removeItem('vol_hours', id);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) SupabaseDB.tableDelete('vol_hours', id).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
      Toast.success('Entry removed');
      Vols._rerender();
    });
  },

  profile(id) {
    const v = Storage.findById('volunteers', id); if (!v) return;
    const hours = (Storage.getAll('vol_hours') || []).filter(h => h.volunteerId === id);
    const totalHrs = hours.reduce((s,h) => s + (Number(h.hours)||0), 0);
    const bgColors = { Approved:'green', Pending:'yellow', Expired:'red', 'Not Required':'gray' };

    Modal.open({ title: `&#x1F64C; ${UI.esc(v.name)}`, width: '560px', body: `
      <div class="flex-row flex-wrap" style="margin-bottom:var(--space-5)">
        ${UI.avatar(v.name, 52)}
        <div style="flex:1">
          <div style="font-size:var(--text-xl);font-weight:900">${UI.esc(v.name)}</div>
          <div class="chip-row" style="margin:var(--space-2) 0 var(--space-1)">
            <span class="badge badge-blue">${UI.esc(v.team)}</span>
            ${v.role ? `<span class="text-meta">${UI.esc(v.role)}</span>` : ''}
            ${UI.badge(v.bgCheck, bgColors[v.bgCheck]||'gray')}
          </div>
          <div class="text-meta">
            ${v.availability ? `<div><i data-lucide="calendar" class="icon-xs" aria-hidden="true"></i>${UI.esc(v.availability)}</div>` : ''}
            ${v.schedulingNotes ? `<div><i data-lucide="file-text" class="icon-xs" aria-hidden="true"></i>${UI.esc(v.schedulingNotes)}</div>` : ''}
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-3);margin-bottom:var(--space-4)">
        <div class="stat-box">
          <div class="stat-box__value" style="color:var(--accent)">${totalHrs.toFixed(1)}h</div>
          <div class="stat-box__label">Total Hours</div>
        </div>
        <div class="stat-box">
          <div class="stat-box__value">${hours.length}</div>
          <div class="stat-box__label">Sessions</div>
        </div>
        <div class="stat-box">
          <div class="stat-box__value">${hours.length ? (totalHrs/hours.length).toFixed(1) : '0'}h</div>
          <div class="stat-box__label">Avg / Session</div>
        </div>
      </div>

      ${hours.length ? `
      <div class="section-label-sm">Recent Hours</div>
      ${hours.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(h=>`
        <div class="flex-between detail-row">
          <span class="text-meta">${UI.fmtDate(h.date)}</span>
          <span style="flex:1;margin:0 var(--space-3)">${UI.esc(h.activity||'')}</span>
          <strong style="color:var(--accent)">${h.hours}h</strong>
        </div>`).join('')}` : '<div class="text-meta">No hours logged yet.</div>'}
    `,
    footer: `<button class="btn btn-outline" onclick="Modal.close()">Close</button>
             <button class="btn btn-primary" onclick="Modal.close();Vols.edit('${id}')">Edit</button>` });
  },

  _form(v) {
    v = v || {};
    return `
      <div class="form-group"><label class="form-label">Volunteer Name *</label><input class="form-control" id="vl-name" value="${UI.esc(v.name||'')}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Role</label><input class="form-control" id="vl-role" value="${UI.esc(v.role||'')}"></div>
        <div class="form-group"><label class="form-label">Ministry Team</label>
          <select class="form-control" id="vl-team">${this._teams.map(t=>`<option ${v.team===t?'selected':''}>${t}</option>`).join('')}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Availability</label><input class="form-control" id="vl-avail" value="${UI.esc(v.availability||'')}"></div>
        <div class="form-group"><label class="form-label">Background Check</label>
          <select class="form-control" id="vl-bg">
            ${['Approved','Pending','Expired','Not Required'].map(s=>`<option ${(v.bgCheck||'Pending')===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">Scheduling Notes</label><textarea class="form-control" id="vl-notes">${UI.esc(v.schedulingNotes||'')}</textarea></div>`;
  },

  _collect() {
    return {
      name:            document.getElementById('vl-name')?.value.trim(),
      role:            document.getElementById('vl-role')?.value.trim(),
      team:            document.getElementById('vl-team')?.value,
      availability:    document.getElementById('vl-avail')?.value.trim(),
      bgCheck:         document.getElementById('vl-bg')?.value,
      schedulingNotes: document.getElementById('vl-notes')?.value.trim(),
    };
  },

  add() {
    Modal.open({ title:'Add Volunteer', body:this._form(), width:'520px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-vol-btn">Save Volunteer</button>` });
    document.getElementById('save-vol-btn').onclick = () => {
      const d = this._collect();
      if (!Validate.check([
        ['vl-name', Validate.required(d.name, 'Volunteer name')],
      ])) return;
      var _saved = Storage.insert('volunteers', d);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) SupabaseDB.tableUpsert('volunteers', _saved).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
      Modal.close(); Toast.success('Volunteer added'); Vols._rerender();
    };
  },

  edit(id) {
    const v = Storage.findById('volunteers', id); if (!v) return;
    Modal.open({ title:'Edit Volunteer', body:this._form(v), width:'520px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-vol-btn">Save Changes</button>` });
    document.getElementById('save-vol-btn').onclick = () => {
      var _updated = Storage.update('volunteers', id, this._collect());
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated() && _updated) SupabaseDB.tableUpsert('volunteers', _updated).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
      Modal.close(); Toast.success('Updated'); Vols._rerender();
    };
  },

  remove(id) {
    UI.confirm('Remove this volunteer from the roster?', () => {
      Storage.removeItem('volunteers', id);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) SupabaseDB.tableDelete('volunteers', id).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
      Toast.success('Removed');
      Vols._rerender();
    });
  },

  logHours() {
    const volunteers = Storage.getAll('volunteers');
    Modal.open({ title:'Log Volunteer Hours', width:'480px', body:`
      <div class="form-group"><label class="form-label">Volunteer *</label>
        <select class="form-control" id="lh-vol">
          <option value="">&#x2014; Select volunteer &#x2014;</option>
          ${volunteers.map(v=>`<option value="${v.id}" data-team="${UI.esc(v.team)}">${UI.esc(v.name)} (${UI.esc(v.team)})</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Date *</label><input class="form-control" id="lh-date" type="date" value="${Storage.today()}"></div>
        <div class="form-group"><label class="form-label">Hours *</label><input class="form-control" id="lh-hours" type="number" min="0.5" max="24" step="0.5" value="2"></div>
      </div>
      <div class="form-group"><label class="form-label">Activity Description</label>
        <input class="form-control" id="lh-activity" placeholder="e.g. Sunday service setup, Food pantry shift&hellip;">
      </div>`,
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-hours-btn">Log Hours</button>` });
    document.getElementById('save-hours-btn').onclick = () => {
      const volId = document.getElementById('lh-vol')?.value;
      const hours = parseFloat(document.getElementById('lh-hours')?.value);
      const date  = document.getElementById('lh-date')?.value;
      if (!Validate.check([
        ['log-vol',  Validate.required(volId,  'Volunteer')],
        ['log-hrs',  hours <= 0 ? 'Hours must be greater than 0' : null],
      ])) return;
      const v = Storage.findById('volunteers', volId);
      var _savedHours = Storage.insert('vol_hours', {
        volunteerId: volId, volunteerName: v?.name || '', team: v?.team || '',
        date, hours, activity: document.getElementById('lh-activity')?.value.trim(),
      });
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) SupabaseDB.tableUpsert('vol_hours', _savedHours).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
      Modal.close(); Toast.success('Hours logged'); Vols._rerender();
    };
  },
};
window.Vols = Vols;

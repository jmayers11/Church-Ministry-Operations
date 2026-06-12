/* =============================================================
   checkin.js  —  Check-In & Attendance
   Headcount quick-entry, per-member check-in, 13-week trend
   ============================================================= */

const CheckIn = {};
window.CheckIn = CheckIn;

Navigation.register('checkin', function render(page) {
  const today    = Storage.today();
  const allMembers  = Storage.getAll('members') || [];
  const allVisitors = Storage.getAll('visitors') || [];
  const allCheckins = Storage.getAll('checkins') || [];

  // ── Active tab state ─────────────────────────────────────────
  const _tab = Storage.get('_checkin_tab') || 'today';

  // ── Helpers ──────────────────────────────────────────────────
  function todayCheckins() {
    return allCheckins.filter(c => c.date === today);
  }
  function isCheckedIn(memberId) {
    return todayCheckins().some(c => c.memberId === memberId && c.date === today);
  }
  function memberName(m) { return `${m.firstName || ''} ${m.lastName || ''}`.trim(); }

  // Quick-entry headcount for today
  const todayHC = allCheckins.find(c => c.date === today && c.type === 'headcount');
  const todayHCValue = todayHC ? (todayHC.count || 0) : '';

  // Per-member count today
  const memberCount = todayCheckins().filter(c => c.type === 'member').length;

  // ── 13-week trend ────────────────────────────────────────────
  function buildTrend13() {
    const rows = [];
    for (let i = 12; i >= 0; i--) {
      const d = new Date(today);
      // Step back by Sunday-aligned weeks
      d.setDate(d.getDate() - i * 7);
      const ym = d.toISOString().slice(0, 10);
      const week = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      // Headcount takes priority; fallback to member check-in count
      const hc = allCheckins.find(c => c.date === ym && c.type === 'headcount');
      const mc = allCheckins.filter(c => c.date === ym && c.type === 'member').length;
      rows.push({ date: ym, week, count: hc ? Number(hc.count || 0) : mc });
    }
    return rows;
  }
  const trend = buildTrend13();
  const trendMax = Math.max(...trend.map(r => r.count), 1);

  // ── Attendance trend for chart ────────────────────────────────
  const trendLabels = trend.map(r => r.week);
  const trendVals   = trend.map(r => r.count);

  // ── Member search state ───────────────────────────────────────
  const _search = Storage.get('_checkin_search') || '';

  // All attendees (members + active visitors who are "regular")
  const attendees = [
    ...allMembers.filter(m => m.status === 'Active').map(m => ({ ...m, _type: 'member' })),
    ...allVisitors.filter(v => v.status === 'Regular').map(v => ({
      id: v.id,
      firstName: v.firstName || v.name?.split(' ')[0] || '',
      lastName: v.lastName || v.name?.split(' ').slice(1).join(' ') || '',
      _type: 'visitor',
      family: v.family || '',
    })),
  ].sort((a, b) => memberName(a).localeCompare(memberName(b)));

  const filtered = _search
    ? attendees.filter(m => memberName(m).toLowerCase().includes(_search.toLowerCase()) ||
        (m.family || '').toLowerCase().includes(_search.toLowerCase()))
    : attendees;

  // Tab HTML builders
  function tabToday() {
    const tciRows = todayCheckins().filter(c => c.type === 'member');
    const checkedIds = new Set(tciRows.map(c => c.memberId));

    return `
      <!-- Quick headcount -->
      <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <h3 class="card-title"><i data-lucide="users" class="icon-inline" aria-hidden="true"></i>Headcount — ${new Date(today + 'T00:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</h3>
        </div>
        <div style="display:flex;align-items:center;gap:16px;padding:8px 0 4px;">
          <div>
            <label class="form-label" for="ci-headcount">Total Attendance</label>
            <div style="display:flex;gap:8px;align-items:center">
              <input type="number" id="ci-headcount" class="form-input" style="width:120px"
                     min="0" value="${UI.esc(String(todayHCValue))}" placeholder="0"
                     aria-label="Total headcount">
              <button class="btn btn-primary" onclick="CheckIn._saveHeadcount()">
                <i data-lucide="save" style="width:14px;height:14px" aria-hidden="true"></i> Save
              </button>
            </div>
          </div>
          <div class="stat-box" style="min-width:120px">
            <div style="font-size:1.6rem;font-weight:900;color:var(--accent)">${memberCount}</div>
            <div style="font-size:.74rem;color:var(--text-muted)">Checked In</div>
          </div>
          <div class="stat-box" style="min-width:120px">
            <div style="font-size:1.6rem;font-weight:900;color:var(--green)">${attendees.length}</div>
            <div style="font-size:.74rem;color:var(--text-muted)">Active Members &amp; Regulars</div>
          </div>
        </div>
      </div>

      <!-- Per-member check-in -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i data-lucide="scan-line" class="icon-inline" aria-hidden="true"></i>Member Check-In</h3>
          <div class="search-bar" style="min-width:220px">
            <i data-lucide="search" class="search-icon" aria-hidden="true"></i>
            <input type="search" class="search-input" id="ci-search" placeholder="Search by name…"
                   value="${UI.esc(_search)}" oninput="CheckIn._onSearch(this.value)"
                   aria-label="Search members">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;padding-top:4px;" id="ci-grid">
          ${filtered.length === 0
            ? `<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--text-muted)">No members match "${UI.esc(_search)}"</div>`
            : filtered.map(m => {
                const checked = checkedIds.has(m.id);
                return `<button class="ci-member-card${checked ? ' ci-member-card--checked' : ''}"
                          onclick="CheckIn._toggle('${m.id}','${m._type}',this)"
                          aria-pressed="${checked}"
                          aria-label="${checked ? 'Check out' : 'Check in'} ${UI.esc(memberName(m))}">
                  <span class="ci-check-icon"><i data-lucide="${checked ? 'check-circle-2' : 'circle'}" aria-hidden="true"></i></span>
                  <span class="ci-name">${UI.esc(memberName(m))}</span>
                  ${m.family ? `<span class="ci-family">${UI.esc(m.family)}</span>` : ''}
                  ${m._type === 'visitor' ? `<span class="badge badge-orange" style="font-size:.65rem;margin-top:2px">Visitor</span>` : ''}
                </button>`;
              }).join('')}
        </div>
      </div>`;
  }

  function tabHistory() {
    // Group by date, show last 20 dates
    const byDate = {};
    allCheckins.forEach(c => {
      if (!byDate[c.date]) byDate[c.date] = { headcount: null, members: [] };
      if (c.type === 'headcount') byDate[c.date].headcount = c;
      else byDate[c.date].members.push(c);
    });
    const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a)).slice(0, 20);

    if (!dates.length) return UI.emptyState({ icon: 'calendar-x', title: 'No attendance history yet', sub: 'Check in members on the Today tab to start tracking.' });

    return `<div class="table-wrap"><table class="data-table">
      <thead><tr><th>Date</th><th>Headcount</th><th>Members Checked In</th></tr></thead>
      <tbody>${dates.map(dt => {
        const d = byDate[dt];
        const hc = d.headcount ? d.headcount.count : (d.members.length || '—');
        return `<tr>
          <td>${UI.fmtDate(dt)}</td>
          <td>${hc}</td>
          <td>${d.members.length}</td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>`;
  }

  function tabTrend() {
    return `
      <div class="card" style="margin-bottom:16px">
        <div class="card-header"><h3 class="card-title"><i data-lucide="trending-up" class="icon-inline" aria-hidden="true"></i>13-Week Attendance Trend</h3></div>
        <div class="chart-canvas-wrap" style="height:220px"><canvas id="ci-trend-chart"></canvas></div>
      </div>
      <div class="table-wrap"><table class="data-table">
        <thead><tr><th>Week of</th><th class="text-right">Attendance</th><th>vs Prior Week</th></tr></thead>
        <tbody>${trend.map((r, i) => {
          const prev = i > 0 ? trend[i - 1].count : null;
          const diff = prev !== null ? r.count - prev : null;
          const cls = diff === null ? '' : diff > 0 ? 'color:var(--green)' : diff < 0 ? 'color:var(--red)' : '';
          const sign = diff > 0 ? '+' : '';
          return `<tr${r.date === today ? ' style="font-weight:700"' : ''}>
            <td>${r.week}${r.date === today ? ' <span class="badge badge-blue" style="font-size:.65rem">Today</span>' : ''}</td>
            <td class="text-right">${r.count || '—'}</td>
            <td style="${cls}">${diff !== null && r.count > 0 ? `${sign}${diff}` : '—'}</td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>`;
  }

  const tabs = [
    { id: 'today',   label: 'Today',   icon: 'scan-line' },
    { id: 'trend',   label: '13-Week Trend', icon: 'trending-up' },
    { id: 'history', label: 'History', icon: 'history' },
  ];

  page.innerHTML = `
    <div class="section-header">
      <h2 class="section-title"><i data-lucide="scan-line" class="icon-inline" aria-hidden="true"></i>Check-In &amp; Attendance</h2>
    </div>
    ${UI.tabs(tabs, _tab, 'CheckIn._setTab')}
    <div id="ci-content"></div>
  `;

  function renderContent() {
    const content = document.getElementById('ci-content');
    if (!content) return;
    if (_tab === 'today')   content.innerHTML = tabToday();
    else if (_tab === 'trend')   content.innerHTML = tabTrend();
    else if (_tab === 'history') content.innerHTML = tabHistory();
    lucide.createIcons();
    if (_tab === 'trend') {
      setTimeout(() => {
        UI.drawBarChart('ci-trend-chart', trendLabels, trendVals, 'var(--accent)');
      }, 50);
    }
  }

  renderContent();
  lucide.createIcons();

  // ── Actions ──────────────────────────────────────────────────
  CheckIn._saveHeadcount = function() {
    const val = Number(document.getElementById('ci-headcount')?.value || 0);
    if (isNaN(val) || val < 0) { Toast.error('Enter a valid headcount'); return; }
    const existing = allCheckins.find(c => c.date === today && c.type === 'headcount');
    if (existing) {
      Storage.update('checkins', existing.id, { count: val });
    } else {
      Storage.insert('checkins', { date: today, type: 'headcount', count: val });
    }
    Toast.success('Headcount saved');
  };

  CheckIn._toggle = function(memberId, memberType, btn) {
    // Always read fresh from storage — the closure snapshot is stale after mutations
    const freshCheckins = Storage.getAll('checkins') || [];
    const rec = freshCheckins.find(c => c.memberId === memberId && c.date === today && c.type === 'member');
    const alreadyIn = !!rec;

    // Counter badge (first .stat-box = "Checked In" box)
    const statBox = document.querySelector('.stat-box');
    const statVal = statBox ? statBox.querySelector('div') : null;

    if (alreadyIn) {
      Storage.removeItem('checkins', rec.id);
      btn.classList.remove('ci-member-card--checked');
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', 'Check in ' + btn.getAttribute('aria-label').replace(/^Check (in|out) /, ''));
      const icon = btn.querySelector('[data-lucide]');
      if (icon) { icon.setAttribute('data-lucide', 'circle'); lucide.createIcons(); }
      // Decrement counter
      if (statVal) statVal.textContent = String(Math.max(0, Number(statVal.textContent) - 1));
    } else {
      Storage.insert('checkins', { date: today, type: 'member', memberId, memberType });
      btn.classList.add('ci-member-card--checked');
      btn.setAttribute('aria-pressed', 'true');
      btn.setAttribute('aria-label', 'Check out ' + btn.getAttribute('aria-label').replace(/^Check (in|out) /, ''));
      const icon = btn.querySelector('[data-lucide]');
      if (icon) { icon.setAttribute('data-lucide', 'check-circle-2'); lucide.createIcons(); }
      // Increment counter
      if (statVal) statVal.textContent = String(Number(statVal.textContent) + 1);
    }
  };

  CheckIn._setTab = function(tab) {
    Storage.set('_checkin_tab', tab);
    Navigation.navigate('checkin');
  };

  CheckIn._onSearch = function(val) {
    Storage.set('_checkin_search', val);
    // Debounce re-render
    clearTimeout(CheckIn._searchTimer);
    CheckIn._searchTimer = setTimeout(() => Navigation.navigate('checkin'), 200);
  };
});

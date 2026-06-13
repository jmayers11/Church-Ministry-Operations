/* =============================================================
   dashboard.js  —  Overview dashboard module
   ============================================================= */

Navigation.register('dashboard', function render(page) {

  const members    = Storage.getAll('members');
  const visitors   = Storage.getAll('visitors');
  const volunteers = Storage.getAll('volunteers');
  const prayer     = Storage.getAll('prayer');
  const events     = Storage.getAll('events');
  const tasks      = Storage.getAll('tasks');
  const s          = Storage.getSettings();
  const today      = Storage.today();

  const requests        = Storage.getAll('ministry_requests') || [];
  const activeMembers   = members.filter(m => m.status === 'Active').length;
  const approvedVols    = volunteers.filter(v => v.bgCheck === 'Approved').length;
  const newVisitors     = visitors.filter(v => v.followUpStatus === 'New').length;
  const upcomingEvents  = events.filter(e => e.date >= today).length;
  const openPrayer      = prayer.filter(p => p.status === 'New' || p.status === 'Ongoing').length;
  const answeredPrayer  = prayer.filter(p => p.status === 'Answered').length;
  const openTasks       = tasks.filter(t => t.status !== 'Done').length;
  const doneTasks       = tasks.filter(t => t.status === 'Done').length;

  // Alert strip data
  const urgentUnassigned = requests.filter(r => r.urgency === 'Urgent' && !r.assignedTo && r.status !== 'Completed').length;
  const pantryRedZone    = (() => { try { const inv = Storage.getAll('pantry_inventory'); return inv.filter(i => i.qty <= i.minStock).length; } catch(e) { return 0; } })();
  const bgExpiring       = volunteers.filter(v => v.bgCheckExpiry && v.bgCheckExpiry <= Storage.today(30) && v.bgCheckExpiry >= today).length;

  // Today panel data
  const todayEvents   = events.filter(e => e.date === today).sort((a,b) => (a.time||'').localeCompare(b.time||''));
  const newOvernight  = requests.filter(r => r.submittedAt?.slice(0,10) === today);
  const visitsPending = requests.filter(r => r.type === 'pastoral' && r.status !== 'Completed').slice(0,5);
  const bdays = members.filter(m => {
    if (!m.birthday) return false;
    const soon = Storage.today(7);
    const bd = m.birthday.slice(5); // MM-DD
    return bd >= today.slice(5) && bd <= soon.slice(5);
  }).slice(0,4);

  // 13-week attendance series from check-in records (reuses checkin.js logic)
  const allCheckins = Storage.getAll('checkins') || [];
  function _buildAttTrend(count, offset) {
    const rows = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(today + 'T00:00:00');
      d.setDate(d.getDate() - (i + offset) * 7);
      const ym   = d.toISOString().slice(0, 10);
      const week = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const hc   = allCheckins.find(c => c.date === ym && c.type === 'headcount');
      const mc   = allCheckins.filter(c => c.date === ym && c.type === 'member').length;
      rows.push({ date: ym, week, count: hc ? Number(hc.count || 0) : mc });
    }
    return rows;
  }
  const trend13      = _buildAttTrend(13, 0);   // weeks 12→0 ago
  const prior13      = _buildAttTrend(13, 13);  // weeks 25→13 ago
  const nonZero13    = trend13.filter(r => r.count > 0);
  const nonZeroPrior = prior13.filter(r => r.count > 0);
  const avg13        = nonZero13.length    ? Math.round(nonZero13.reduce((a, b) => a + b.count, 0) / nonZero13.length)    : 0;
  const avgPrior13   = nonZeroPrior.length ? Math.round(nonZeroPrior.reduce((a, b) => a + b.count, 0) / nonZeroPrior.length) : 0;
  const attHasData   = nonZero13.length > 0;
  const attLabels    = trend13.map(r => r.week);
  const attValues    = trend13.map(r => r.count);
  const priorValues  = prior13.map(r => r.count);

  // Ministry health (volunteer fill %)
  const teams = ['Worship Team', "Children's Ministry", 'Youth Ministry', 'Outreach', 'Hospitality', 'Security'];
  const teamNeeded = { 'Worship Team': 6, "Children's Ministry": 5, 'Youth Ministry': 4, 'Outreach': 4, 'Hospitality': 3, 'Security': 2 };
  const teamHealth = teams.map(team => {
    const count = volunteers.filter(v => v.team === team && v.bgCheck === 'Approved').length;
    const pct   = Math.min(100, Math.round((count / (teamNeeded[team] || 4)) * 100));
    const color = pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';
    const textColor = pct >= 80 ? 'var(--success-text)' : pct >= 50 ? 'var(--warning-text)' : 'var(--danger-text)';
    return { team, pct, color, textColor };
  });

  // Upcoming events list rows
  const upcomingList = events
    .filter(e => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  // Visitor follow-up rows
  const followUpList = visitors
    .filter(v => v.followUpStatus === 'New' || v.followUpStatus === 'Contacted')
    .slice(0, 5);
  const visitorBadgeMap = { New: 'warning', Contacted: 'info', 'Invited Back': 'brand', Connected: 'success' };

  // Pantry Health tile (only when FPRP + pantry data exist)
  let pantryKpi = '';
  const pantrySnap = (typeof FPRP !== 'undefined') ? FPRP.pantrySnapshot() : null;
  if (pantrySnap && pantrySnap.hasData) {
    const phStatus = pantrySnap.score >= 85 ? 'Healthy' : pantrySnap.score >= 70 ? 'Stable' : 'At risk';
    pantryKpi = UI.kpi({
      icon: 'shopping-basket',
      value: pantrySnap.score,
      label: 'Pantry Health',
      meta: `${pantrySnap.topBox.maxBuild} ${pantrySnap.topBox.name} ready · serves ~${pantrySnap.projFamilies} families`,
      delta: phStatus,
      deltaDir: pantrySnap.score >= 85 ? 'up' : pantrySnap.score >= 70 ? 'flat' : 'down',
      onClickPage: 'foodpantry',
      accent: pantrySnap.score >= 85 ? 'success' : pantrySnap.score >= 70 ? 'warning' : 'danger',
    });
  }

  // Volunteer coverage %
  const volCovPct = (() => {
    const teams2 = ['Worship Team',"Children's Ministry",'Youth Ministry','Outreach','Hospitality','Security'];
    const needed = {'Worship Team':6,"Children's Ministry":5,'Youth Ministry':4,'Outreach':4,'Hospitality':3,'Security':2};
    const scores = teams2.map(t => Math.min(100, Math.round((volunteers.filter(v=>v.team===t&&v.bgCheck==='Approved').length / (needed[t]||4))*100)));
    return Math.round(scores.reduce((a,b)=>a+b,0) / scores.length);
  })();

  // Giving MTD
  const givingMTD = (() => {
    const giving = Storage.getAll('giving_donations') || [];
    const mo = today.slice(0,7);
    return giving.filter(g=>g.date?.startsWith(mo)).reduce((s,g)=>s+(parseFloat(g.amount)||0),0);
  })();
  const givingLastMTD = (() => {
    const giving = Storage.getAll('giving_donations') || [];
    const d = new Date(today); d.setMonth(d.getMonth()-1);
    const mo = d.toISOString().slice(0,7);
    return giving.filter(g=>g.date?.startsWith(mo)).reduce((s,g)=>s+(parseFloat(g.amount)||0),0);
  })();

  // Open care items (inbox + prayer combined)
  const openCare = requests.filter(r=>r.status!=='Completed').length + openPrayer;

  page.innerHTML = `
    <!-- Alert strip (only shown when nonzero) -->
    ${(urgentUnassigned + pantryRedZone + bgExpiring) > 0 ? `
    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:var(--space-4);">
      ${urgentUnassigned > 0 ? `<div class="alert-banner alert-banner-red"><i data-lucide="alert-circle" class="icon-sm" aria-hidden="true"></i><span><strong>${urgentUnassigned} urgent request${urgentUnassigned>1?'s':''}</strong> unassigned</span><button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="Navigation.navigate('requestinbox')">Review →</button></div>` : ''}
      ${pantryRedZone > 0 ? `<div class="alert-banner alert-banner-yellow"><i data-lucide="package-open" class="icon-sm" aria-hidden="true"></i><span><strong>${pantryRedZone} pantry item${pantryRedZone>1?'s':''}</strong> at or below minimum stock</span><button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="Navigation.navigate('foodpantry')">Review →</button></div>` : ''}
      ${bgExpiring > 0 ? `<div class="alert-banner alert-banner-yellow"><i data-lucide="shield-alert" class="icon-sm" aria-hidden="true"></i><span><strong>${bgExpiring} background check${bgExpiring>1?'s':''}</strong> expiring within 30 days</span><button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="Navigation.navigate('volunteers')">Review →</button></div>` : ''}
    </div>` : ''}

    <!-- Header: subtitle only (topbar owns the H1) -->
    <div class="section-header" style="margin-bottom:var(--space-4);">
      <div class="section-subtitle">Welcome back — here's what's happening today.</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm" onclick="Members.add?.()">
          <i data-lucide="user-plus" aria-hidden="true"></i> Add Member
        </button>
        <button class="btn btn-outline btn-sm" onclick="Navigation.navigate('boardreport')">
          <i data-lucide="file-bar-chart" aria-hidden="true"></i> Board Report
        </button>
      </div>
    </div>

    <!-- KPI Grid — 4 action-oriented metrics -->
    <div class="kpi-grid">
      ${UI.kpi({
        icon: 'trending-up',
        value: avg13,
        label: 'Avg Attendance',
        meta: `13-wk avg · ${nonZero13.length} wk${nonZero13.length !== 1 ? 's' : ''} of data`,
        delta: avgPrior13 > 0 ? Math.abs(avg13 - avgPrior13) + ' vs prior 13 wks' : null,
        deltaDir: avg13 >= avgPrior13 ? 'up' : 'down',
        onClickPage: 'checkin', accent: 'brand',
      })}
      ${UI.kpi({
        icon: 'dollar-sign',
        value: '$' + (givingMTD >= 1000 ? (givingMTD/1000).toFixed(1)+'k' : givingMTD.toFixed(0)),
        label: 'Giving MTD',
        meta: 'This month to date',
        delta: givingLastMTD > 0 ? '$' + Math.abs(Math.round(givingMTD-givingLastMTD)) + ' vs last mo' : null,
        deltaDir: givingMTD >= givingLastMTD ? 'up' : 'down',
        onClickPage: 'giving', accent: 'success',
      })}
      ${UI.kpi({
        icon: 'heart-handshake',
        value: openCare,
        label: 'Open Care Items',
        meta: `${openPrayer} prayer · ${requests.filter(r=>r.status!=='Completed').length} inbox`,
        delta: urgentUnassigned > 0 ? urgentUnassigned + ' urgent' : 'All reviewed',
        deltaDir: urgentUnassigned > 0 ? 'down' : 'up',
        onClickPage: 'requestinbox', accent: urgentUnassigned > 0 ? 'danger' : 'brand',
      })}
      ${UI.kpi({
        icon: 'users-round',
        value: volCovPct + '%',
        label: 'Volunteer Coverage',
        meta: `${approvedVols} of ${volunteers.length} cleared`,
        delta: volCovPct >= 80 ? 'Healthy' : volCovPct >= 50 ? 'Needs attention' : 'Short-staffed',
        deltaDir: volCovPct >= 80 ? 'up' : volCovPct >= 50 ? 'flat' : 'down',
        onClickPage: 'volunteers', accent: volCovPct >= 80 ? 'success' : volCovPct >= 50 ? 'warning' : 'danger',
      })}
    </div>

    <!-- Charts row -->
    <div class="dash-grid">

      <!-- Attendance trend (full width) -->
      <div class="card" style="grid-column:1/-1">
        <div class="card__header">
          <div>
            <div class="card__title">
              <i data-lucide="bar-chart-2" aria-hidden="true" style="display:inline-block;vertical-align:middle;margin-right:6px;"></i>Attendance Trend
            </div>
            <div class="card__subtitle">13-week rolling avg${nonZero13.length > 0 ? ` · ${nonZero13.length} wks of data` : ''}</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="Navigation.navigate('checkin')">Check-in →</button>
        </div>
        <div class="chart-canvas-wrap">
          <canvas id="chart-attendance" class="bar-chart"></canvas>
        </div>
      </div>
    </div>

    <!-- Upcoming Events + Visitor Follow-up row -->
    <div class="dash-grid" style="margin-top:var(--space-5)">

      <!-- Upcoming Events -->
      <div class="card">
        <div class="card__header">
          <div>
            <div class="card__title">
              <i data-lucide="calendar-days" aria-hidden="true" style="display:inline-block;vertical-align:middle;margin-right:6px;"></i>Upcoming Events
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="Navigation.navigate('events')">View all →</button>
        </div>
        <div>
          ${upcomingList.length ? upcomingList.map(e => {
            const d = new Date(e.date + 'T00:00:00');
            const mon = d.toLocaleDateString('en-US', { month: 'short' });
            const day = d.getDate();
            return `
              <div class="dash-event-row">
                <div class="dash-event-date">
                  <div class="dash-event-mon">${mon}</div>
                  <div class="dash-event-day">${day}</div>
                </div>
                <div class="dash-event-info">
                  <div class="dash-event-name">${UI.esc(e.name)}</div>
                  <div class="dash-event-meta">${UI.esc(e.time || '')}${e.time && e.location ? ' · ' : ''}${UI.esc(e.location || '')}</div>
                </div>
              </div>`;
          }).join('') : UI.emptyState({ icon: 'calendar-x', title: 'No upcoming events', body: 'Add an event to see it here.' })}
        </div>
      </div>

      <!-- Visitor Follow-up -->
      <div class="card">
        <div class="card__header">
          <div>
            <div class="card__title">
              <i data-lucide="user-plus" aria-hidden="true" style="display:inline-block;vertical-align:middle;margin-right:6px;"></i>Visitor Follow-Up
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="Navigation.navigate('visitors')">View all →</button>
        </div>
        <div>
          ${followUpList.length ? followUpList.map(v => `
            <div class="dash-visitor-row">
              <div class="dash-visitor-info">
                <div class="dash-visitor-name">${UI.esc(v.name)}</div>
                <div class="dash-visitor-meta">Visited ${UI.relDate(v.visitDate)}</div>
              </div>
              ${UI.badge(v.followUpStatus, visitorBadgeMap[v.followUpStatus] || 'neutral')}
            </div>
          `).join('') : `<div class="dash-all-clear"><i data-lucide="check-circle" aria-hidden="true"></i> All visitors followed up</div>`}
        </div>
      </div>
    </div>
  `;

  // Draw chart + run count-up after DOM settles
  requestAnimationFrame(() => {
    if (attHasData) {
      UI._charts = UI._charts || {};
      const prev = UI._charts['chart-attendance'];
      if (prev && prev._inst) { try { prev._inst.destroy(); } catch(e) {} }
      const canvas = document.getElementById('chart-attendance');
      if (canvas) {
        const isDark   = document.documentElement.getAttribute('data-theme') === 'dark';
        const accent   = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#4f46e5';
        const gridCol  = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)';
        const tickCol  = isDark ? '#8b90b8' : '#9ca3af';
        const ghostCol = isDark ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.15)';
        const datasets = [
          {
            label: 'This 13 wks',
            data: attValues,
            borderColor: accent,
            backgroundColor: accent + '22',
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            tension: 0.35,
            fill: true,
          },
        ];
        if (nonZeroPrior.length > 0) {
          datasets.push({
            label: 'Prior 13 wks',
            data: priorValues,
            borderColor: ghostCol,
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderDash: [4, 4],
            pointRadius: 0,
            tension: 0.35,
            fill: false,
          });
        }
        const inst = new Chart(canvas.getContext('2d'), {  // eslint-disable-line no-undef
          type: 'line',
          data: { labels: attLabels, datasets },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 300 },
            plugins: {
              legend: {
                display: nonZeroPrior.length > 0,
                labels: { color: tickCol, boxWidth: 12, font: { size: 11 } },
              },
              tooltip: { mode: 'index', intersect: false },
            },
            scales: {
              x: { grid: { color: gridCol }, ticks: { color: tickCol, font: { size: 11 } } },
              y: { grid: { color: gridCol }, ticks: { color: tickCol, font: { size: 11 } }, beginAtZero: true },
            },
          },
        });
        UI._charts['chart-attendance'] = { labels: attLabels, values: attValues, color: accent, _inst: inst };
      }
    } else {
      const wrap = document.querySelector('.chart-canvas-wrap');
      if (wrap) wrap.innerHTML = UI.emptyState({
        icon: 'bar-chart-2',
        title: 'No attendance data yet',
        body: 'Use the Check-in tab to record weekly headcounts.',
      });
    }
    UI.countUp(page);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });
});

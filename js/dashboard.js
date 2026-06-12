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

  const activeMembers   = members.filter(m => m.status === 'Active').length;
  const approvedVols    = volunteers.filter(v => v.bgCheck === 'Approved').length;
  const newVisitors     = visitors.filter(v => v.followUpStatus === 'New').length;
  const upcomingEvents  = events.filter(e => e.date >= today).length;
  const openPrayer      = prayer.filter(p => p.status === 'New' || p.status === 'Ongoing').length;
  const answeredPrayer  = prayer.filter(p => p.status === 'Answered').length;
  const openTasks       = tasks.filter(t => t.status !== 'Done').length;
  const doneTasks       = tasks.filter(t => t.status === 'Done').length;

  // Attendance trend — up to 6 past services with recorded attendance
  const pastServices = events
    .filter(e => e.attendance > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-6);
  const attLabels = pastServices.map(e => {
    const d = new Date(e.date + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  const attValues = pastServices.map(e => e.attendance);

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

  page.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">${UI.esc(s.churchName)}</h2>
        <div class="section-subtitle">Welcome back — here's what's happening today.</div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm" onclick="Members.add?.()">
          <i data-lucide="user-plus" aria-hidden="true"></i> Add Member
        </button>
        <button class="btn btn-outline btn-sm" onclick="window.print()">
          <i data-lucide="printer" aria-hidden="true"></i> Print Report
        </button>
      </div>
    </div>

    <!-- KPI Grid -->
    <div class="kpi-grid">
      ${UI.kpi({
        icon: 'users',
        value: activeMembers,
        label: 'Active Members',
        meta: `${members.length} total on record`,
        onClickPage: 'members',
        accent: 'brand',
      })}
      ${UI.kpi({
        icon: 'helping-hand',
        value: volunteers.length,
        label: 'Volunteers',
        meta: `${approvedVols} background-checked`,
        delta: approvedVols === volunteers.length ? 'All cleared' : `${volunteers.length - approvedVols} pending`,
        deltaDir: approvedVols === volunteers.length ? 'up' : 'flat',
        onClickPage: 'volunteers',
        accent: 'success',
      })}
      ${UI.kpi({
        icon: 'calendar-days',
        value: upcomingEvents,
        label: 'Upcoming Events',
        meta: 'Next 60 days',
        onClickPage: 'events',
        accent: 'brand',
      })}
      ${UI.kpi({
        icon: 'hand-heart',
        value: openPrayer,
        label: 'Prayer Requests',
        meta: `${answeredPrayer} answered`,
        delta: answeredPrayer > 0 ? `${answeredPrayer} answered` : null,
        deltaDir: 'up',
        onClickPage: 'prayer',
        accent: 'gold',
      })}
      ${UI.kpi({
        icon: 'user-plus',
        value: newVisitors,
        label: 'New Visitors',
        meta: 'Need follow-up',
        delta: newVisitors > 0 ? 'Follow up' : 'All caught up',
        deltaDir: newVisitors > 0 ? 'up' : 'flat',
        onClickPage: 'visitors',
        accent: newVisitors > 0 ? 'warning' : 'brand',
      })}
      ${UI.kpi({
        icon: 'check-square',
        value: openTasks,
        label: 'Open Tasks',
        meta: `${doneTasks} completed`,
        delta: openTasks > 5 ? `${openTasks} open` : null,
        deltaDir: 'down',
        onClickPage: 'tasks',
        accent: openTasks > 5 ? 'danger' : 'brand',
      })}
      ${pantryKpi}
    </div>

    <!-- Charts row -->
    <div class="dash-grid">

      <!-- Attendance trend -->
      <div class="card">
        <div class="card__header">
          <div>
            <div class="card__title">
              <i data-lucide="bar-chart-2" aria-hidden="true" style="display:inline-block;vertical-align:middle;margin-right:6px;"></i>Attendance Trend
            </div>
            <div class="card__subtitle">Recent services</div>
          </div>
        </div>
        <div class="chart-canvas-wrap">
          <canvas id="chart-attendance" class="bar-chart"></canvas>
        </div>
      </div>

      <!-- Ministry Health -->
      <div class="card">
        <div class="card__header">
          <div>
            <div class="card__title">
              <i data-lucide="activity" aria-hidden="true" style="display:inline-block;vertical-align:middle;margin-right:6px;"></i>Ministry Health
            </div>
            <div class="card__subtitle">Volunteer coverage by team</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="Navigation.navigate('volunteers')">View →</button>
        </div>
        <div class="ministry-health-list">
          ${teamHealth.map(({ team, pct, color, textColor }) => `
            <div class="ministry-health-item">
              <div class="ministry-health-label">
                <span>${UI.esc(team)}</span>
                <span style="color:${textColor};font-weight:600">${pct}%</span>
              </div>
              <div class="progress-bar-track">
                <div class="progress-bar-fill" style="width:${pct}%;background:${color}"></div>
              </div>
            </div>
          `).join('')}
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
    if (attValues.length) {
      UI.drawBarChart('chart-attendance', attLabels, attValues);
    } else {
      const wrap = document.querySelector('.chart-canvas-wrap');
      if (wrap) wrap.innerHTML = UI.emptyState({
        icon: 'bar-chart-2',
        title: 'No attendance data yet',
        body: 'Add past events with attendance numbers to see trends.',
      });
    }
    UI.countUp(page);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });
});

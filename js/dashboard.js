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
  const newVisitors     = visitors.filter(v => v.followUpStatus === 'New').length;
  const upcomingEvents  = events.filter(e => e.date >= today).length;
  const openPrayer      = prayer.filter(p => p.status === 'New' || p.status === 'Ongoing').length;
  const openTasks       = tasks.filter(t => t.status !== 'Done').length;

  // Attendance trend — last 5 Sunday services with recorded attendance
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
  const teamHealth = teams.map(team => {
    const vols = volunteers.filter(v => v.team === team && v.bgCheck === 'Approved');
    const needed = { 'Worship Team': 6, "Children's Ministry": 5, 'Youth Ministry': 4, 'Outreach': 4, 'Hospitality': 3, 'Security': 2 };
    const pct = Math.min(100, Math.round((vols.length / (needed[team] || 4)) * 100));
    return { team, pct };
  });

  page.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">${UI.esc(s.churchName)}</h2>
        <div class="section-subtitle">Welcome back — here's what's happening today.</div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm" onclick="Members.add?.()">+ Add Member</button>
        <button class="btn btn-outline btn-sm" onclick="window.print()">🖨 Print Report</button>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="stat-grid">
      <div class="stat-card" data-accent="blue">
        <div class="stat-icon">👥</div>
        <div class="stat-value">${activeMembers}</div>
        <div class="stat-label">Active Members</div>
        <div class="stat-delta flat">${members.length} total on record</div>
      </div>
      <div class="stat-card" data-accent="green">
        <div class="stat-icon">🙌</div>
        <div class="stat-value">${volunteers.length}</div>
        <div class="stat-label">Volunteers</div>
        <div class="stat-delta ${volunteers.filter(v=>v.bgCheck==='Approved').length === volunteers.length ? 'up' : 'yellow'}">
          ${volunteers.filter(v=>v.bgCheck==='Approved').length} background-checked
        </div>
      </div>
      <div class="stat-card" data-accent="purple">
        <div class="stat-icon">📅</div>
        <div class="stat-value">${upcomingEvents}</div>
        <div class="stat-label">Upcoming Events</div>
        <div class="stat-delta flat">Next 60 days</div>
      </div>
      <div class="stat-card" data-accent="orange">
        <div class="stat-icon">🙏</div>
        <div class="stat-value">${openPrayer}</div>
        <div class="stat-label">Prayer Requests</div>
        <div class="stat-delta flat">${prayer.filter(p=>p.status==='Answered').length} answered</div>
      </div>
      <div class="stat-card" data-accent="yellow">
        <div class="stat-icon">👋</div>
        <div class="stat-value">${newVisitors}</div>
        <div class="stat-label">New Visitors</div>
        <div class="stat-delta ${newVisitors > 0 ? 'up' : 'flat'}">Need follow-up</div>
      </div>
      <div class="stat-card" data-accent="red">
        <div class="stat-icon">✅</div>
        <div class="stat-value">${openTasks}</div>
        <div class="stat-label">Open Tasks</div>
        <div class="stat-delta flat">${tasks.filter(t=>t.status==='Done').length} completed</div>
      </div>
    </div>

    <!-- Charts row -->
    <div class="dash-grid">
      <!-- Attendance trend -->
      <div class="chart-card">
        <div class="chart-card-header">
          <span class="chart-card-title">📊 Attendance Trend</span>
          <span style="font-size:.78rem;color:var(--text-muted)">Recent services</span>
        </div>
        <div class="chart-canvas-wrap">
          <canvas id="chart-attendance" class="bar-chart"></canvas>
        </div>
      </div>

      <!-- Ministry Health -->
      <div class="chart-card">
        <div class="chart-card-header">
          <span class="chart-card-title">🏥 Ministry Health</span>
          <span style="font-size:.78rem;color:var(--text-muted)">Volunteer coverage</span>
        </div>
        <div class="ministry-health-list">
          ${teamHealth.map(({ team, pct }) => `
            <div class="ministry-health-item">
              <div class="ministry-health-label">
                <span>${UI.esc(team)}</span>
                <span style="color:${pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)'}">${pct}%</span>
              </div>
              <div class="progress-bar-track">
                <div class="progress-bar-fill" style="width:${pct}%;background:${pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)'}"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Upcoming Events & Open Tasks row -->
    <div class="dash-grid" style="margin-top:20px;">
      <!-- Upcoming Events -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">📅 Upcoming Events</span>
          <button class="btn btn-ghost btn-sm" onclick="Navigation.navigate('events')">View all →</button>
        </div>
        <div>
          ${events
            .filter(e => e.date >= today)
            .sort((a,b) => a.date.localeCompare(b.date))
            .slice(0, 5)
            .map(e => `
              <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);">
                <div style="background:var(--accent-light);color:var(--accent);border-radius:8px;padding:8px 10px;text-align:center;min-width:48px;">
                  <div style="font-size:.7rem;font-weight:700;text-transform:uppercase;">${new Date(e.date+'T00:00:00').toLocaleDateString('en-US',{month:'short'})}</div>
                  <div style="font-size:1.2rem;font-weight:800;line-height:1;">${new Date(e.date+'T00:00:00').getDate()}</div>
                </div>
                <div>
                  <div style="font-weight:600;font-size:.88rem;">${UI.esc(e.name)}</div>
                  <div style="font-size:.78rem;color:var(--text-muted);">${UI.esc(e.time)} · ${UI.esc(e.location)}</div>
                </div>
              </div>
            `).join('') || '<div class="empty-state"><p>No upcoming events</p></div>'}
        </div>
      </div>

      <!-- Visitor Follow-up -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">👋 Visitor Follow-Up</span>
          <button class="btn btn-ghost btn-sm" onclick="Navigation.navigate('visitors')">View all →</button>
        </div>
        <div>
          ${visitors
            .filter(v => v.followUpStatus === 'New' || v.followUpStatus === 'Contacted')
            .slice(0, 5)
            .map(v => {
              const colors = { New: 'orange', Contacted: 'blue', 'Invited Back': 'purple', Connected: 'green' };
              return `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">
                  <div>
                    <div style="font-weight:600;font-size:.88rem;">${UI.esc(v.name)}</div>
                    <div style="font-size:.78rem;color:var(--text-muted);">Visited ${UI.relDate(v.visitDate)}</div>
                  </div>
                  ${UI.badge(v.followUpStatus, colors[v.followUpStatus] || 'gray')}
                </div>`;
            }).join('') || '<div style="padding:20px;text-align:center;color:var(--text-muted);">All visitors followed up ✅</div>'}
        </div>
      </div>
    </div>
  `;

  // Draw chart after DOM settles
  requestAnimationFrame(() => {
    if (attValues.length) {
      UI.drawBarChart('chart-attendance', attLabels, attValues, '#4f6ef7');
    } else {
      const wrap = document.querySelector('.chart-canvas-wrap');
      if (wrap) wrap.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);">No attendance data yet — add past events with attendance numbers.</div>';
    }
  });
});

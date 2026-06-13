/* =============================================================
   ministries.js  —  Ministry Dashboards module
   Tabs: Children · Youth · Small Groups · Worship · Outreach
   ============================================================= */

Navigation.register('ministries', function render(page) {
  const ministryDefs = [
    { id: 'children',    label: "Children's",  icon: 'baby', color: '#f97316', teamName: "Children's Ministry" },
    { id: 'youth',       label: 'Youth',        icon: 'backpack', color: '#8b5cf6', teamName: 'Youth Ministry'       },
    { id: 'smallgroups', label: 'Small Groups', icon: 'handshake', color: '#3b82f6', teamName: 'Small Groups'         },
    { id: 'worship',     label: 'Worship',      icon: 'music', color: '#22c55e', teamName: 'Worship Team'         },
    { id: 'outreach',    label: 'Outreach',     icon: '<i data-lucide="globe" class="icon-inline" aria-hidden="true"></i>', color: '#ef4444', teamName: 'Outreach'             },
  ];

  const activeTab = Storage.get('_ministryTab') || 'children';

  page.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">Ministry Dashboards</h2>
        <div class="section-subtitle">Health snapshot for each ministry team</div>
      </div>
    </div>

    <!-- Tab Bar -->
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:24px;border-bottom:2px solid var(--border);padding-bottom:0;">
      ${ministryDefs.map(m => `
        <button class="ministry-tab ${activeTab === m.id ? 'active' : ''}"
          data-tab="${m.id}" style="--tab-color:${m.color}">
          <span>${m.icon}</span> ${m.label}
        </button>
      `).join('')}
    </div>

    <div id="ministry-panel"></div>
  `;

  // Tab styles injected once
  if (!document.getElementById('ministry-tab-style')) {
    const style = document.createElement('style');
    style.id = 'ministry-tab-style';
    style.textContent = `
      .ministry-tab {
        background: none; border: none; padding: 10px 18px;
        font-size: .88rem; font-weight: 600; color: var(--text-muted);
        cursor: pointer; border-bottom: 3px solid transparent;
        margin-bottom: -2px; transition: all .15s; display:flex; gap:6px; align-items:center;
      }
      .ministry-tab:hover { color: var(--text); }
      .ministry-tab.active { color: var(--tab-color, var(--accent)); border-bottom-color: var(--tab-color, var(--accent)); }
    `;
    document.head.appendChild(style);
  }

  function showTab(id) {
    Storage.set('_ministryTab', id);
    document.querySelectorAll('.ministry-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === id));
    const def = ministryDefs.find(m => m.id === id);
    renderMinistry(def);
  }

  document.querySelectorAll('.ministry-tab').forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.dataset.tab));
  });

  showTab(activeTab);

  function renderMinistry(def) {
    const panel = document.getElementById('ministry-panel');
    if (!panel) return;

    const volunteers = Storage.getAll('volunteers').filter(v => v.team === def.teamName);
    const members    = Storage.getAll('members').filter(m => (m.ministries||[]).includes(def.label) || (m.ministries||[]).some(min => min.toLowerCase().includes(def.id)));
    const events     = Storage.getAll('events').filter(e => e.name.toLowerCase().includes(def.label.toLowerCase()) || (e.description||'').toLowerCase().includes(def.id));
    const upcomingEv = events.filter(e => e.date >= Storage.today()).sort((a,b) => a.date.localeCompare(b.date)).slice(0,3);
    const tasks      = Storage.getAll('tasks').filter(t =>
      (t.title+t.description+t.owner).toLowerCase().includes(def.label.toLowerCase()) ||
      volunteers.some(v => v.name === t.owner)
    );
    const openTasks  = tasks.filter(t => t.status !== 'Done');

    // Ministry-specific stats
    const statsMap = {
      children:    { label1: 'Kids Enrolled',      val1: 42,  label2: 'Avg Weekly Attendance', val2: 31  },
      youth:       { label1: 'Youth Members',      val1: 24,  label2: 'Avg Weekly Attendance', val2: 18  },
      smallgroups: { label1: 'Active Groups',      val1: 6,   label2: 'Total Participants',    val2: 48  },
      worship:     { label1: 'Team Members',       val1: volunteers.length, label2: 'Rehearsals/Month',  val2: 8   },
      outreach:    { label1: 'Volunteer Hours YTD',val1: 312, label2: 'Families Impacted',     val2: Storage.getAll('foodpantry').reduce((s,r)=>s+r.familiesServed,0) },
    };
    const stats = statsMap[def.id] || { label1: 'Members', val1: members.length, label2: 'Volunteers', val2: volunteers.length };

    // Growth trend bars (mock last 6 months)
    const growthData = {
      children:    [28, 30, 29, 34, 31, 31],
      youth:       [14, 16, 15, 19, 18, 18],
      smallgroups: [36, 38, 40, 44, 46, 48],
      worship:     [8, 9, 9, 10, 10, volunteers.length],
      outreach:    [38, 42, 45, 50, 47, 52],
    };
    const growthLabels = ['Jan','Feb','Mar','Apr','May','Jun'];
    const growth = growthData[def.id] || [0,0,0,0,0,0];

    panel.innerHTML = `
      <!-- Header -->
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;">
        <div style="width:56px;height:56px;border-radius:14px;background:${def.color}22;display:flex;align-items:center;justify-content:center;font-size:1.8rem;">${def.icon}</div>
        <div>
          <h3 style="font-size:1.2rem;font-weight:800;">${def.label} Ministry</h3>
          <div style="font-size:.84rem;color:var(--text-muted);">${volunteers.length} volunteer${volunteers.length!==1?'s':''} · ${openTasks.length} open task${openTasks.length!==1?'s':''}</div>
        </div>
      </div>

      <!-- Stat Cards -->
      <div class="stat-grid" style="margin-bottom:24px;">
        <div class="stat-card" style="border-left:3px solid ${def.color}">
          <div class="stat-value">${stats.val1}</div>
          <div class="stat-label">${stats.label1}</div>
        </div>
        <div class="stat-card" style="border-left:3px solid ${def.color}">
          <div class="stat-value">${stats.val2}</div>
          <div class="stat-label">${stats.label2}</div>
        </div>
        <div class="stat-card" style="border-left:3px solid ${def.color}">
          <div class="stat-value">${volunteers.length}</div>
          <div class="stat-label">Volunteers</div>
          <div class="stat-delta ${volunteers.filter(v=>v.bgCheck!=='Approved').length ? 'down' : 'up'}">
            ${volunteers.filter(v=>v.bgCheck==='Approved').length} BG approved
          </div>
        </div>
        <div class="stat-card" style="border-left:3px solid ${def.color}">
          <div class="stat-value">${upcomingEv.length}</div>
          <div class="stat-label">Upcoming Events</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;" class="ministry-two-col">

        <!-- Growth Trend -->
        <div class="chart-card">
          <div class="chart-card-header">
            <span class="chart-card-title"><i data-lucide="trending-up" class="icon-inline" aria-hidden="true"></i> Participation Trend</span>
            <span style="font-size:.75rem;color:var(--text-muted)">Last 6 months</span>
          </div>
          <div class="chart-canvas-wrap">
            <canvas id="ministry-chart-${def.id}" class="bar-chart"></canvas>
          </div>
        </div>

        <!-- Volunteers -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Volunteer Roster</span>
            <button class="btn btn-ghost btn-sm" onclick="Navigation.navigate('volunteers')">Manage →</button>
          </div>
          ${volunteers.length ? volunteers.map(v => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:.84rem;">
              <div>
                <div style="font-weight:600;">${UI.esc(v.name)}</div>
                <div style="color:var(--text-muted);font-size:.76rem;">${UI.esc(v.role)} · ${UI.esc(v.availability)}</div>
              </div>
              ${UI.badge(v.bgCheck, v.bgCheck==='Approved'?'green':v.bgCheck==='Pending'?'yellow':'red')}
            </div>
          `).join('') : '<div style="padding:20px;text-align:center;color:var(--text-muted)">No volunteers assigned yet</div>'}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;" class="ministry-two-col">

        <!-- Upcoming Activities -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Upcoming Activities</span>
            <button class="btn btn-ghost btn-sm" onclick="Navigation.navigate('events')">All Events →</button>
          </div>
          ${upcomingEv.length ? upcomingEv.map(e => `
            <div style="padding:10px 0;border-bottom:1px solid var(--border);">
              <div style="font-weight:600;font-size:.88rem;">${UI.esc(e.name)}</div>
              <div style="font-size:.78rem;color:var(--text-muted);">${UI.fmtDate(e.date)} · ${UI.esc(e.time)} · ${UI.esc(e.location)}</div>
              ${e.volunteersNeeded ? `<div style="font-size:.75rem;color:var(--orange);"><i data-lucide="user-plus" class="icon-inline" aria-hidden="true"></i> ${e.volunteersNeeded} volunteers needed</div>` : ''}
            </div>
          `).join('') : `<div style="padding:20px;text-align:center;color:var(--text-muted)">No upcoming activities — <a href="#" onclick="Navigation.navigate('events')" style="color:var(--accent)">Add one</a></div>`}
        </div>

        <!-- Open Tasks -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Open Tasks</span>
            <button class="btn btn-ghost btn-sm" onclick="Navigation.navigate('tasks')">Kanban Board →</button>
          </div>
          ${openTasks.length ? openTasks.slice(0,5).map(t => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:.84rem;">
              <div>
                <div style="font-weight:600;">${UI.esc(t.title)}</div>
                <div style="font-size:.76rem;color:var(--text-muted);">${t.owner ? `<i data-lucide="user" class="icon-inline" aria-hidden="true"></i> ${UI.esc(t.owner)}` : ''} ${t.dueDate ? `· Due ${UI.fmtDate(t.dueDate)}` : ''}</div>
              </div>
              ${UI.badge(t.priority, {High:'red',Medium:'yellow',Low:'blue'}[t.priority]||'gray')}
            </div>
          `).join('') : '<div style="padding:20px;text-align:center;color:var(--text-muted)">All caught up ✅</div>'}
        </div>
      </div>
    `;

    // Two-column responsive fix
    const twoColStyle = document.getElementById('ministry-2col-style');
    if (!twoColStyle) {
      const s = document.createElement('style');
      s.id = 'ministry-2col-style';
      s.textContent = `@media (max-width:720px) { .ministry-two-col { grid-template-columns: 1fr !important; } }`;
      document.head.appendChild(s);
    }

    // Draw chart
    requestAnimationFrame(() => {
      UI.drawBarChart(`ministry-chart-${def.id}`, growthLabels, growth, def.color);
    });
  }
});

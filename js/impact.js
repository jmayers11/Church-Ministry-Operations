/* =============================================================
   impact.js  —  Community Impact Dashboard
   Aggregated metrics from all Community Care modules
   ============================================================= */

Navigation.register('impact', function render(page) {
  const today     = Storage.today();
  const _period   = Storage.get('_impact_period') || '1m';

  // Date range for the selected period
  function periodRange(p) {
    const now = new Date(today);
    const start = new Date(today);
    if (p === '1m')  start.setMonth(now.getMonth() - 1);
    else if (p === '3m')  start.setMonth(now.getMonth() - 3);
    else if (p === '6m')  start.setMonth(now.getMonth() - 6);
    else if (p === 'ytd') start.setMonth(0, 1); // Jan 1
    return { start: start.toISOString().slice(0,10), end: today };
  }
  function prevPeriodRange(p) {
    const now   = new Date(today);
    const range = periodRange(p);
    const span  = new Date(today) - new Date(range.start);
    const end   = new Date(range.start); end.setDate(end.getDate() - 1);
    const start = new Date(end - span);
    return { start: start.toISOString().slice(0,10), end: end.toISOString().slice(0,10) };
  }
  const range   = periodRange(_period);
  const prevR   = prevPeriodRange(_period);

  const inRange = (dateStr, r) => dateStr && dateStr >= r.start && dateStr <= r.end;
  const thisMonth = today.slice(0,7); // YYYY-MM
  const lastMonth  = (() => { const d=new Date(today); d.setMonth(d.getMonth()-1); return d.toISOString().slice(0,7); })();

  // Helpers
  const inMonth = (dateStr, ym) => dateStr && dateStr.startsWith(ym);
  const count = (arr, filterFn) => arr.filter(filterFn).length;

  // --- Aggregate data ---
  const allPantry  = Storage.getAll('pantry_inventory') || [];
  const allDists   = Storage.getAll('foodpantry') || [];      // distributions
  const allFamAid  = Storage.getAll('family_assistance') || [];
  const allCare    = Storage.getAll('care') || [];
  const allVolCtr  = Storage.getAll('volunteer_profiles') || [];
  const allVols    = Storage.getAll('volunteers') || [];
  const allPrayer  = Storage.getAll('prayer') || [];
  const allVisit   = Storage.getAll('visitors') || [];
  const allMembers = Storage.getAll('members') || [];
  const allCommEv  = Storage.getAll('community_events') || [];

  // Metrics for selected period vs prior period
  const m = {
    familiesServed:    count(allFamAid, r => inRange(r.dateAssisted || r.dateRequested, range)),
    foodDistributions: count(allDists,  r => inRange(r.date, range)),
    prayerRequests:    count(allPrayer, r => inRange(r.createdAt || r.date, range)),
    careVisits:        count(allCare,   r => inRange(r.lastContact || r.date, range)),
    newVisitors:       count(allVisit,  r => inRange(r.visitDate || r.createdAt, range)),
    outreachEvents:    count(allCommEv, r => inRange(r.date, range)),
    activeVolunteers:  allVols.length,
    totalMembers:      allMembers.filter(m=>m.status==='Active').length,
  };
  const lm = {
    familiesServed:    count(allFamAid, r => inRange(r.dateAssisted || r.dateRequested, prevR)),
    foodDistributions: count(allDists,  r => inRange(r.date, prevR)),
    prayerRequests:    count(allPrayer, r => inRange(r.createdAt || r.date, prevR)),
    careVisits:        count(allCare,   r => inRange(r.lastContact || r.date, prevR)),
    newVisitors:       count(allVisit,  r => inRange(r.visitDate || r.createdAt, prevR)),
    outreachEvents:    count(allCommEv, r => inRange(r.date, prevR)),
  };

  const PERIOD_LABELS = { '1m':'Last Month', '3m':'Last 3 Months', '6m':'Last 6 Months', 'ytd':'Year to Date' };

  function delta(curr, prev) {
    if (!prev) return curr > 0 ? `<span class="stat-delta up">+${curr} vs prior period</span>` : '';
    const d = curr - prev;
    const pct = Math.round((d/prev)*100);
    const cls = d > 0 ? 'up' : d < 0 ? 'down' : 'flat';
    const sign = d > 0 ? '+' : '';
    return `<span class="stat-delta ${cls}">${sign}${d} (${sign}${pct}%) vs prior period</span>`;
  }

  // Pantry totals
  const totalItems = allPantry.reduce((s,i) => s + (Number(i.qty)||0), 0);
  const lowStockCount = allPantry.filter(i => (Number(i.qty)||0) <= (Number(i.minStock)||0)).length;

  // Active care
  const activeCare = allCare.filter(c => c.status !== 'Completed' && c.status !== 'Closed').length;
  const overdueFollowUp = allFamAid.filter(r => r.followUpNeeded && r.followUpDate && r.followUpDate < today && r.status !== 'Completed').length;

  // Recent outreach events (completed in past 90 days)
  const past90 = new Date(); past90.setDate(past90.getDate() - 90);
  const recentEvents = allCommEv
    .filter(e => e.status === 'Completed')
    .sort((a,b) => b.date.localeCompare(a.date))
    .slice(0,5);

  const totalFamiliesEver = allCommEv.reduce((s,e)=>s+(Number(e.familiesImpacted)||0),0)
    + allFamAid.filter(r=>r.status==='Completed').length;

  // --- Build 6-month trend data ---
  function buildTrend(arr, dateFn, months=6) {
    const labels=[], vals=[];
    for (let i=months-1;i>=0;i--) {
      const d=new Date(today); d.setMonth(d.getMonth()-i);
      const ym=d.toISOString().slice(0,7);
      const mon=d.toLocaleDateString('en-US',{month:'short'});
      labels.push(mon);
      vals.push(arr.filter(r=>{ const dt=dateFn(r); return dt && dt.startsWith(ym); }).length);
    }
    return {labels,vals};
  }

  const famTrend = buildTrend(allFamAid, r=>r.dateAssisted||r.dateRequested);
  const visitorTrend = buildTrend(allVisit, r=>r.createdAt);
  const careTrend = buildTrend(allCare, r=>r.lastContact||r.date);

  const expiredBG = allVols.filter(v => v.bgCheck === 'Expired').length;

  page.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title"><i data-lucide="bar-chart-2" class="icon-inline" aria-hidden="true"></i>Community Impact Dashboard</h2>
        <div class="section-subtitle">Aggregated metrics across all care &amp; outreach ministries</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <select class="filter-select" id="impact-period-sel" aria-label="Select time period" style="min-width:150px">
          ${Object.entries(PERIOD_LABELS).map(([k,v])=>
            `<option value="${k}"${_period===k?' selected':''}>${v}</option>`
          ).join('')}
        </select>
        <button class="btn btn-outline btn-sm" onclick="BoardReport.generate(-1)" aria-label="Generate board report for last month">
          <i data-lucide="file-text" class="icon-sm" aria-hidden="true"></i> Board Report
        </button>
      </div>
    </div>

    <!-- This Month Metrics -->
    <div class="stat-grid" style="margin-bottom:24px;">
      <div class="stat-card" data-accent="green">
        <div class="stat-icon"><i data-lucide="home" aria-hidden="true"></i></div>
        <div class="stat-value">${m.familiesServed}</div>
        <div class="stat-label">Families Assisted</div>
        ${delta(m.familiesServed, lm.familiesServed)}
      </div>
      <div class="stat-card" data-accent="orange">
        <div class="stat-icon"><i data-lucide="shopping-bag" aria-hidden="true"></i></div>
        <div class="stat-value">${m.foodDistributions}</div>
        <div class="stat-label">Food Distributions</div>
        ${delta(m.foodDistributions, lm.foodDistributions)}
      </div>
      <div class="stat-card" data-accent="blue">
        <div class="stat-icon"><i data-lucide="heart" aria-hidden="true"></i></div>
        <div class="stat-value">${m.prayerRequests}</div>
        <div class="stat-label">Prayer Requests</div>
        ${delta(m.prayerRequests, lm.prayerRequests)}
      </div>
      <div class="stat-card" data-accent="purple">
        <div class="stat-icon"><i data-lucide="hand-heart" aria-hidden="true"></i></div>
        <div class="stat-value">${m.careVisits}</div>
        <div class="stat-label">Care Contacts</div>
        ${delta(m.careVisits, lm.careVisits)}
      </div>
      <div class="stat-card" data-accent="teal">
        <div class="stat-icon"><i data-lucide="user-plus" aria-hidden="true"></i></div>
        <div class="stat-value">${m.newVisitors}</div>
        <div class="stat-label">New Visitors</div>
        ${delta(m.newVisitors, lm.newVisitors)}
      </div>
      <div class="stat-card" data-accent="pink">
        <div class="stat-icon"><i data-lucide="globe" aria-hidden="true"></i></div>
        <div class="stat-value">${m.outreachEvents}</div>
        <div class="stat-label">Outreach Events</div>
        ${delta(m.outreachEvents, lm.outreachEvents)}
      </div>
    </div>

    <!-- Charts row -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin-bottom:24px;">
      <div class="card">
        <div class="card-header"><h3 class="card-title"><i data-lucide="home" class="icon-inline" aria-hidden="true"></i>Family Assistance Trend</h3><span style="font-size:.76rem;color:var(--text-muted)">6 months</span></div>
        <div class="chart-canvas-wrap" style="height:160px"><canvas id="impact-fam-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><h3 class="card-title"><i data-lucide="user-plus" class="icon-inline" aria-hidden="true"></i>New Visitor Trend</h3><span style="font-size:.76rem;color:var(--text-muted)">6 months</span></div>
        <div class="chart-canvas-wrap" style="height:160px"><canvas id="impact-vis-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><h3 class="card-title"><i data-lucide="hand-heart" class="icon-inline" aria-hidden="true"></i>Care Ministry Trend</h3><span style="font-size:.76rem;color:var(--text-muted)">6 months</span></div>
        <div class="chart-canvas-wrap" style="height:160px"><canvas id="impact-care-chart"></canvas></div>
      </div>
    </div>

    <!-- Bottom row: Pantry snapshot + Care alerts + Recent events -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">

      <div class="card">
        <div class="card-header"><h3 class="card-title"><i data-lucide="shopping-bag" class="icon-inline" aria-hidden="true"></i>Food Pantry Snapshot</h3></div>
        <div style="display:flex;gap:20px;justify-content:space-around;padding:12px 0;text-align:center;">
          <div><div style="font-size:2rem;font-weight:900;color:var(--text)">${totalItems}</div><div style="font-size:.76rem;color:var(--text-muted)">Total Items in Stock</div></div>
          <div><div style="font-size:2rem;font-weight:900;color:${lowStockCount>0?'var(--red)':'var(--green)'}">${lowStockCount}</div><div style="font-size:.76rem;color:var(--text-muted)">Low/Out of Stock</div></div>
          <div><div style="font-size:2rem;font-weight:900;color:var(--text)">${allDists.length}</div><div style="font-size:.76rem;color:var(--text-muted)">Total Distributions</div></div>
        </div>
        ${lowStockCount > 0 ? `<div style="font-size:.82rem;color:var(--red);text-align:center;padding-bottom:8px;"><i data-lucide="alert-triangle" class="icon-inline" aria-hidden="true"></i> ${lowStockCount} item${lowStockCount>1?'s':''} need restocking</div>` : ''}
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title"><i data-lucide="alert-triangle" class="icon-inline" aria-hidden="true"></i>Action Items</h3></div>
        <div style="font-size:.86rem;display:flex;flex-direction:column;gap:8px;padding-top:4px;">
          ${overdueFollowUp > 0
            ? `<div style="padding:8px;background:rgba(239,68,68,.07);border-radius:6px;border-left:3px solid var(--red)">
                <strong style="color:var(--red)">${overdueFollowUp} overdue family follow-up${overdueFollowUp>1?'s':''}</strong>
                <div style="color:var(--text-muted);font-size:.76rem">Check Family Assistance tab</div>
              </div>` : ''}
          ${activeCare > 0
            ? `<div style="padding:8px;background:rgba(234,179,8,.07);border-radius:6px;border-left:3px solid var(--yellow)">
                <strong>${activeCare} open care case${activeCare>1?'s':''}</strong>
                <div style="color:var(--text-muted);font-size:.76rem">Active care ministry records</div>
              </div>` : ''}
          ${lowStockCount > 0
            ? `<div style="padding:8px;background:rgba(239,68,68,.07);border-radius:6px;border-left:3px solid var(--orange)">
                <strong style="color:var(--orange)">${lowStockCount} low-stock pantry item${lowStockCount>1?'s':''}</strong>
                <div style="color:var(--text-muted);font-size:.76rem">Check Food Pantry inventory</div>
              </div>` : ''}
          ${expiredBG > 0
            ? `<div style="padding:8px;background:rgba(239,68,68,.07);border-radius:6px;border-left:3px solid var(--danger)">
                <strong style="color:var(--danger)"><i data-lucide="shield-alert" class="icon-inline" aria-hidden="true"></i>${expiredBG} expired volunteer background check${expiredBG>1?'s':''}</strong>
                <div style="color:var(--text-muted);font-size:.76rem">Review in Volunteer Roster → Background Checks tab</div>
              </div>` : ''}
          ${overdueFollowUp===0 && activeCare===0 && lowStockCount===0 && expiredBG===0
            ? `<div style="text-align:center;padding:20px;color:var(--text-muted)">
                <i data-lucide="check-circle" class="icon-inline" aria-hidden="true"></i> No urgent action items
              </div>` : ''}
        </div>
      </div>
    </div>

    <!-- Recent Outreach Events -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title"><i data-lucide="globe" class="icon-inline" aria-hidden="true"></i>Recent Outreach Events</h3>
        <span style="font-size:.76rem;color:var(--text-muted)">Cumulative impact: ${totalFamiliesEver.toLocaleString()} families served</span>
      </div>
      ${recentEvents.length ? `
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Event</th><th>Date</th><th>Attendance</th><th>Families</th><th>Items</th></tr></thead>
            <tbody>
              ${recentEvents.map(e=>`
                <tr>
                  <td><strong>${UI.esc(e.name)}</strong><div style="font-size:.74rem;color:var(--text-muted)">${UI.esc(e.type)}</div></td>
                  <td>${UI.fmtDate(e.date)}</td>
                  <td>${e.actualAttendance||'—'}</td>
                  <td>${e.familiesImpacted||'—'}</td>
                  <td>${e.itemsCollected||'—'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>` :
        `<div class="empty-state"><div class="empty-state-icon"><i data-lucide="globe" class="icon-inline" aria-hidden="true"></i></div><div class="empty-state-title">No completed outreach events yet</div></div>`
      }
    </div>
  `;

  // Draw charts
  setTimeout(() => {
    UI.drawBarChart('impact-fam-chart',  famTrend.labels,    famTrend.vals,   'var(--green)');
    UI.drawBarChart('impact-vis-chart',  visitorTrend.labels, visitorTrend.vals, 'var(--blue)');
    UI.drawBarChart('impact-care-chart', careTrend.labels,   careTrend.vals,  'var(--purple)');
  }, 50);

  // Wire period selector
  const periodSel = document.getElementById('impact-period-sel');
  if (periodSel) {
    periodSel.addEventListener('change', () => {
      Storage.set('_impact_period', periodSel.value);
      Navigation.navigate('impact');
    });
  }

  lucide.createIcons();
});

/* =============================================================
   board-report.js  —  One-click monthly board report PDF
   Generates a print-ready HTML window with key ministry metrics
   ============================================================= */

const BoardReport = (() => {

  function _esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function _fmtDate(str) {
    if (!str) return '—';
    try { return new Date(str + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return str; }
  }

  function _currency(n) {
    return '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Return month range for a given offset (0 = current month, -1 = last month, etc.)
  function _monthRange(offset) {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const start = d.toISOString().slice(0, 7); // YYYY-MM
    return start;
  }

  function generate(monthOffset) {
    const today = new Date().toISOString().slice(0, 10);
    const ym = _monthRange(monthOffset || -1);  // default: last month
    const [year, mon] = ym.split('-');
    const monthLabel = new Date(Number(year), Number(mon) - 1, 1)
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const inMonth = (str) => str && str.startsWith(ym);

    // Pull all data
    const settings       = Storage.getSettings() || {};
    const churchName     = settings.churchName || 'Our Church';
    const allMembers     = Storage.getAll('members') || [];
    const allVisitors    = Storage.getAll('visitors') || [];
    const allGiving      = Storage.getAll('giving_donations') || [];
    const allCare        = Storage.getAll('care') || [];
    const allVols        = Storage.getAll('volunteers') || [];
    const allPrayer      = Storage.getAll('prayer') || [];
    const allFamAid      = Storage.getAll('family_assistance') || [];
    const allDists       = Storage.getAll('foodpantry') || [];
    const allEvents      = Storage.getAll('events') || [];
    const allTasks       = Storage.getAll('tasks') || [];
    const allPantry      = Storage.getAll('pantry_inventory') || [];

    // Attendance & membership
    const activeMembers  = allMembers.filter(m => m.status === 'Active').length;
    const newMembersMonth = allMembers.filter(m => inMonth(m.joinDate || m.createdAt)).length;
    const visitorsMonth  = allVisitors.filter(v => inMonth(v.visitDate || v.createdAt)).length;
    const retainedVisitors = allVisitors.filter(v => inMonth(v.visitDate || v.createdAt) && v.status === 'Regular').length;

    // Giving
    const givingMonth    = allGiving.filter(g => inMonth(g.date));
    const totalGiving    = givingMonth.reduce((s, g) => s + (Number(g.amount) || 0), 0);
    const giverCount     = new Set(givingMonth.map(g => g.memberId).filter(Boolean)).size;
    const givingByFund   = {};
    givingMonth.forEach(g => {
      const fund = g.fund || 'General';
      givingByFund[fund] = (givingByFund[fund] || 0) + (Number(g.amount) || 0);
    });

    // Care
    const careMonth      = allCare.filter(c => inMonth(c.lastContact || c.date)).length;
    const activeCareOpen = allCare.filter(c => c.status !== 'Completed' && c.status !== 'Closed').length;
    const prayerMonth    = allPrayer.filter(p => inMonth(p.createdAt || p.date)).length;
    const answeredMonth  = allPrayer.filter(p => inMonth(p.answeredDate) && p.status === 'Answered').length;

    // Outreach
    const famAidMonth    = allFamAid.filter(r => inMonth(r.dateAssisted || r.dateRequested)).length;
    const distsMonth     = allDists.filter(d => inMonth(d.date)).length;
    const totalPantry    = allPantry.reduce((s, i) => s + (Number(i.qty) || 0), 0);
    const lowStock       = allPantry.filter(i => (Number(i.qty) || 0) <= (Number(i.minStock) || 0)).length;

    // Volunteers
    const activeVols     = allVols.filter(v => v.status === 'Active').length;
    const expiredBG      = allVols.filter(v => v.bgCheck === 'Expired').length;

    // Events this month
    const eventsMonth    = allEvents.filter(e => inMonth(e.date)).sort((a, b) => a.date.localeCompare(b.date));

    // Tasks
    const openTasks      = allTasks.filter(t => t.status !== 'Done' && t.status !== 'Completed').length;
    const doneMonth      = allTasks.filter(t => inMonth(t.completedAt || t.dueDate) && (t.status === 'Done' || t.status === 'Completed')).length;

    // Fund rows HTML
    const fundRows = Object.entries(givingByFund)
      .sort((a, b) => b[1] - a[1])
      .map(([fund, amt]) => `<tr><td>${_esc(fund)}</td><td class="num">${_currency(amt)}</td></tr>`)
      .join('') || '<tr><td colspan="2" style="color:#888;text-align:center">No giving recorded</td></tr>';

    // Event rows HTML
    const eventRows = eventsMonth.length
      ? eventsMonth.map(e => `<tr>
          <td>${_fmtDate(e.date)}</td>
          <td>${_esc(e.title || e.name)}</td>
          <td>${_esc(e.type || '—')}</td>
          <td class="num">${e.expectedAttendance || '—'}</td>
        </tr>`).join('')
      : '<tr><td colspan="4" style="color:#888;text-align:center">No events this month</td></tr>';

    // Attendance trend (13 weeks)
    const allCheckins = Storage.getAll('checkins') || [];
    const trendRows = [];
    for (let i = 12; i >= 0; i--) {
      const d2 = new Date(); d2.setDate(d2.getDate() - i * 7);
      const ym2 = d2.toISOString().slice(0, 10);
      const week2 = d2.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const hc2 = allCheckins.find(function(c){ return c.date === ym2 && c.type === 'headcount'; });
      const mc2 = allCheckins.filter(function(c){ return c.date === ym2 && c.type === 'member'; }).length;
      trendRows.push({ date: ym2, week: week2, count: hc2 ? Number(hc2.count || 0) : mc2 });
    }
    const nonZero = trendRows.filter(function(r){ return r.count > 0; });
    const avgAttendance = nonZero.length ? Math.round(nonZero.reduce(function(s,r){ return s+r.count; },0) / nonZero.length) : 0;
    const attendanceTrendRows = trendRows.map(function(r) {
      const diff = r.count > 0 ? r.count - avgAttendance : null;
      const cls  = diff === null ? '' : diff > 0 ? 'style="color:#059669"' : diff < 0 ? 'style="color:#dc2626"' : '';
      return '<tr><td>' + _esc(r.week) + (r.date === today ? ' <strong>(This Week)</strong>' : '') + '</td>'
           + '<td class="num">' + (r.count || '—') + '</td>'
           + '<td class="num" ' + cls + '>' + (diff !== null && r.count > 0 ? (diff > 0 ? '+' : '') + diff : '—') + '</td></tr>';
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${_esc(churchName)} — Board Report ${_esc(monthLabel)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', Arial, sans-serif; font-size: 11pt; color: #1a1a2e; background: #fff; }
  @media screen { body { max-width: 900px; margin: 0 auto; padding: 24px; } }
  @media print {
    body { font-size: 10pt; }
    .no-print { display: none !important; }
    .section { page-break-inside: avoid; }
  }

  /* Cover */
  .cover { text-align: center; padding: 32px 0 24px; border-bottom: 3px solid #4f46e5; margin-bottom: 24px; }
  .cover h1 { font-size: 22pt; font-weight: 900; color: #4f46e5; }
  .cover h2 { font-size: 14pt; font-weight: 600; color: #374151; margin-top: 4px; }
  .cover .meta { font-size: 9pt; color: #6b7280; margin-top: 8px; }
  .print-btn { margin-top: 16px; background: #4f46e5; color: #fff; border: none; padding: 10px 28px;
               border-radius: 6px; font-size: 11pt; font-weight: 600; cursor: pointer; }
  .print-btn:hover { background: #3730a3; }

  /* Sections */
  .section { margin-bottom: 24px; }
  .section-title { font-size: 12pt; font-weight: 700; color: #4f46e5; border-bottom: 1.5px solid #e5e7eb;
                   padding-bottom: 4px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: .04em; }

  /* KPI grid */
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px; }
  @media (max-width: 640px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
  .kpi { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center; }
  .kpi-value { font-size: 20pt; font-weight: 900; color: #111827; }
  .kpi-label { font-size: 8.5pt; color: #6b7280; margin-top: 2px; }
  .kpi.accent { border-color: #4f46e5; }
  .kpi.accent .kpi-value { color: #4f46e5; }
  .kpi.green .kpi-value { color: #059669; }
  .kpi.red .kpi-value { color: #dc2626; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; font-size: 10pt; }
  th { background: #f3f4f6; font-weight: 700; text-align: left; padding: 7px 10px;
       border-bottom: 2px solid #e5e7eb; }
  td { padding: 6px 10px; border-bottom: 1px solid #f0f0f0; }
  tr:last-child td { border-bottom: none; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .total-row td { font-weight: 700; border-top: 2px solid #e5e7eb; }

  /* Alerts */
  .alert { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px;
           border-radius: 6px; margin-bottom: 8px; font-size: 10pt; }
  .alert-warn  { background: #fef3c7; border-left: 4px solid #f59e0b; }
  .alert-danger { background: #fee2e2; border-left: 4px solid #ef4444; }
  .alert-ok    { background: #d1fae5; border-left: 4px solid #10b981; color: #065f46; }

  /* Footer */
  .footer { text-align: center; font-size: 8.5pt; color: #9ca3af; border-top: 1px solid #e5e7eb;
            padding-top: 16px; margin-top: 32px; }
</style>
</head>
<body>

<div class="cover">
  <h1>${_esc(churchName)}</h1>
  <h2>Monthly Board Report — ${_esc(monthLabel)}</h2>
  <div class="meta">Generated ${_fmtDate(today)} &nbsp;|&nbsp; Confidential</div>
  <button class="print-btn no-print" onclick="window.print()"><i data-lucide="printer" class="icon-inline" aria-hidden="true"></i> Print / Save as PDF</button>
</div>

<!-- Membership & Attendance -->
<div class="section">
  <div class="section-title">Membership &amp; Attendance</div>
  <div class="kpi-grid">
    <div class="kpi accent"><div class="kpi-value">${activeMembers}</div><div class="kpi-label">Active Members</div></div>
    <div class="kpi green"><div class="kpi-value">${newMembersMonth}</div><div class="kpi-label">New Members This Month</div></div>
    <div class="kpi"><div class="kpi-value">${visitorsMonth}</div><div class="kpi-label">Visitors This Month</div></div>
    <div class="kpi"><div class="kpi-value">${retainedVisitors}</div><div class="kpi-label">Returning Visitors</div></div>
  </div>
</div>

<!-- Stewardship -->
<div class="section">
  <div class="section-title">Stewardship &amp; Giving</div>
  <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
    <div class="kpi accent"><div class="kpi-value">${_currency(totalGiving)}</div><div class="kpi-label">Total Giving This Month</div></div>
    <div class="kpi"><div class="kpi-value">${giverCount}</div><div class="kpi-label">Unique Givers</div></div>
    <div class="kpi"><div class="kpi-value">${giverCount > 0 ? _currency(totalGiving / giverCount) : '$0.00'}</div><div class="kpi-label">Average Gift</div></div>
  </div>
  <table>
    <thead><tr><th>Fund</th><th class="num">Amount</th></tr></thead>
    <tbody>${fundRows}</tbody>
    <tfoot><tr class="total-row"><td>Total</td><td class="num">${_currency(totalGiving)}</td></tr></tfoot>
  </table>
</div>

<!-- Volunteers -->
<div class="section">
  <div class="section-title">Volunteers</div>
  <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
    <div class="kpi accent"><div class="kpi-value">${activeVols}</div><div class="kpi-label">Active Volunteers</div></div>
    <div class="kpi${expiredBG > 0 ? ' red' : ' green'}"><div class="kpi-value">${expiredBG}</div><div class="kpi-label">Expired Background Checks</div></div>
    <div class="kpi"><div class="kpi-value">${allVols.length}</div><div class="kpi-label">Total on Roster</div></div>
  </div>
  ${expiredBG > 0 ? `<div class="alert alert-danger"><i data-lucide="alert-triangle" class="icon-inline" aria-hidden="true"></i> ${expiredBG} volunteer${expiredBG > 1 ? 's have' : ' has'} an expired background check. Action required before next service.</div>` : `<div class="alert alert-ok">✓ All volunteer background checks current.</div>`}
</div>

<!-- Community Care -->
<div class="section">
  <div class="section-title">Community Care &amp; Outreach</div>
  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-value">${famAidMonth}</div><div class="kpi-label">Families Assisted</div></div>
    <div class="kpi"><div class="kpi-value">${distsMonth}</div><div class="kpi-label">Food Distributions</div></div>
    <div class="kpi"><div class="kpi-value">${careMonth}</div><div class="kpi-label">Care Contacts</div></div>
    <div class="kpi ${activeCareOpen > 0 ? '' : 'green'}"><div class="kpi-value">${activeCareOpen}</div><div class="kpi-label">Open Care Cases</div></div>
  </div>
  <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr);margin-top:8px;">
    <div class="kpi"><div class="kpi-value">${prayerMonth}</div><div class="kpi-label">Prayer Requests</div></div>
    <div class="kpi green"><div class="kpi-value">${answeredMonth}</div><div class="kpi-label">Answered Prayers</div></div>
    <div class="kpi${lowStock > 0 ? ' red' : ' green'}"><div class="kpi-value">${totalPantry}</div><div class="kpi-label">Pantry Items in Stock</div></div>
  </div>
  ${lowStock > 0 ? `<div class="alert alert-warn"><i data-lucide="alert-triangle" class="icon-inline" aria-hidden="true"></i> ${lowStock} pantry item${lowStock > 1 ? 's are' : ' is'} at or below minimum stock level.</div>` : ''}
</div>

<!-- Attendance Trend -->
<div class="section">
  <div class="section-title">Attendance Trend (13 Weeks)</div>
  <table>
    <thead><tr><th>Week</th><th class="num">Attendance</th><th class="num">vs Avg</th></tr></thead>
    <tbody>${attendanceTrendRows}</tbody>
    <tfoot><tr class="total-row"><td>Average</td><td class="num">${avgAttendance}</td><td class="num">—</td></tr></tfoot>
  </table>
</div>

<!-- Events -->
<div class="section">
  <div class="section-title">Events This Month</div>
  <table>
    <thead><tr><th>Date</th><th>Event</th><th>Type</th><th class="num">Expected</th></tr></thead>
    <tbody>${eventRows}</tbody>
  </table>
</div>

<!-- Tasks -->
<div class="section">
  <div class="section-title">Task Summary</div>
  <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
    <div class="kpi green"><div class="kpi-value">${doneMonth}</div><div class="kpi-label">Tasks Completed This Month</div></div>
    <div class="kpi${openTasks > 10 ? ' red' : ''}"><div class="kpi-value">${openTasks}</div><div class="kpi-label">Open Tasks</div></div>
    <div class="kpi"><div class="kpi-value">${allTasks.length}</div><div class="kpi-label">Total Tasks</div></div>
  </div>
</div>

<div class="footer">
  ${_esc(churchName)} &nbsp;|&nbsp; Monthly Board Report &nbsp;|&nbsp; ${_esc(monthLabel)} &nbsp;|&nbsp; Confidential — For Board Use Only
</div>

</body>
</html>`;

    const win = window.open('', '_blank', 'width=960,height=800,scrollbars=yes');
    if (!win) {
      Toast.error('Popup blocked. Please allow popups for this site.');
      return;
    }
    win.document.write(html);
    win.document.close();
  }

  return { generate };

})();

window.BoardReport = BoardReport;

/* ── Board Report navigation page ───────────────────────── */
Navigation.register('board-report', function render(page) {
  const today   = Storage.today();
  const ym      = today.slice(0, 7);
  const selMonth = Storage.get('_br_month') || today.slice(0, 7);

  // Generate month options (current + 11 prior)
  const monthOptions = [];
  for (let i = 0; i <= 11; i++) {
    const d  = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const val   = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    monthOptions.push({ val, label });
  }

  // Quick metrics for the selected month
  const inM = function(str){ return str && str.startsWith(selMonth); };
  const allMembers  = Storage.getAll('members') || [];
  const allGiving   = Storage.getAll('giving_donations') || [];
  const allVols     = Storage.getAll('volunteers') || [];
  const allCare     = Storage.getAll('care') || [];
  const allCheckins = Storage.getAll('checkins') || [];

  const activeMembers = allMembers.filter(function(m){ return m.status==='Active'; }).length;
  const newMembersM   = allMembers.filter(function(m){ return inM(m.joinDate||m.createdAt); }).length;
  const totalGivingM  = allGiving.filter(function(g){ return inM(g.date); }).reduce(function(s,g){ return s+(Number(g.amount)||0); },0);
  const activeVols    = allVols.filter(function(v){ return v.status==='Active'; }).length;
  const expiredBG     = allVols.filter(function(v){ return v.bgCheck==='Expired'; }).length;
  const careOpen      = allCare.filter(function(c){ return c.status!=='Completed'&&c.status!=='Closed'; }).length;

  // This month's check-in avg
  const monthCheckins = allCheckins.filter(function(c){ return inM(c.date) && c.type==='headcount'; });
  const avgAtt = monthCheckins.length ? Math.round(monthCheckins.reduce(function(s,c){ return s+(Number(c.count)||0); },0)/monthCheckins.length) : 0;

  const monthLabel = new Date(selMonth + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const offset     = monthOptions.findIndex(function(m){ return m.val === selMonth; });

  page.innerHTML =
    '<div class="section-header"><div>'
    +'<h2 class="section-title"><i data-lucide="file-text" class="icon-inline" aria-hidden="true"></i>Board Report Generator</h2>'
    +'<div class="section-subtitle">Generate a print-ready monthly ministry report</div>'
    +'</div></div>'
    +'<div class="card" style="margin-bottom:20px">'
    +'<div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">'
    +'<div class="form-group" style="margin:0;flex:1;min-width:200px">'
    +'<label class="form-label">Report Month</label>'
    +'<select class="form-control" id="br-month-sel">'
    +monthOptions.map(function(m){ return '<option value="'+m.val+'"'+(m.val===selMonth?' selected':'')+'>'+m.label+'</option>'; }).join('')
    +'</select></div>'
    +'<button class="btn btn-primary" onclick="BoardReport.generate('+(offset===0?0:'-'+offset)+')">'
    +'<i data-lucide="file-text" class="icon-xs" aria-hidden="true"></i> Generate PDF Report</button>'
    +'</div></div>'
    // Preview KPIs
    +'<h3 style="font-size:var(--text-sm);font-weight:800;margin-bottom:12px">'+monthLabel+' Snapshot</h3>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:20px;">'
    +UI.kpi({ icon:'users', value:activeMembers, label:'Active Members', accent:'brand' })
    +UI.kpi({ icon:'user-plus', value:newMembersM, label:'New Members', accent:'success' })
    +UI.kpi({ icon:'dollar-sign', value: totalGivingM >= 1000 ? '$'+(totalGivingM/1000).toFixed(1)+'k' : '$'+totalGivingM.toFixed(0), label:'Giving This Month', accent:'info' })
    +UI.kpi({ icon:'scan-line', value:avgAtt||'—', label:'Avg Weekly Attendance', accent:'warning' })
    +UI.kpi({ icon:'heart-handshake', value:activeVols, label:'Active Volunteers', accent:'brand' })
    +UI.kpi({ icon:'shield-alert', value:expiredBG, label:'Expired BG Checks', accent:expiredBG>0?'danger':'success' })
    +UI.kpi({ icon:'heart', value:careOpen, label:'Open Care Cases', accent:careOpen>5?'warning':'brand' })
    +'</div>'
    +'<div class="alert-banner alert-banner-blue" style="cursor:default">'
    +'<i data-lucide="info" class="icon-inline" aria-hidden="true"></i>'
    +'Click <strong>Generate PDF Report</strong> to open the full report in a new window. Use your browser&#39;s <strong>Print &#x2192; Save as PDF</strong> to download.'
    +'</div>';
  if (typeof lucide !== 'undefined') lucide.createIcons();
  document.getElementById('br-month-sel')?.addEventListener('change', function(){ Storage.set('_br_month', this.value); Navigation.navigate('board-report'); });
});

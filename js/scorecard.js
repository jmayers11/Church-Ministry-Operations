/* =============================================================
   scorecard.js  —  Ministry Health Scorecard
   Visual scorecards across 5 ministry dimensions
   ============================================================= */

Navigation.register('scorecard', function render(page) {
  const today = Storage.today();
  const thisMonth = today.slice(0, 7);

  // Fetch all data needed
  const members     = Storage.getAll('members');
  const visitors    = Storage.getAll('visitors');
  const vols        = Storage.getAll('volunteers');
  const volProfiles = Storage.getAll('volunteer_profiles');
  const care        = Storage.getAll('care');
  const prayer      = Storage.getAll('prayer');
  const events      = Storage.getAll('events');
  const commEvents  = Storage.getAll('community_events');
  const famAid      = Storage.getAll('family_assistance');
  const tasks       = Storage.getAll('tasks');

  const activeMembers = members.filter(m => m.status === 'Active').length || 1; // avoid /0

  // ── 1. Volunteer Engagement ────────────────────────────────
  const activeVols = vols.length; // volunteers have no status field; all roster entries are active
  const volPct = Math.min(100, Math.round((activeVols / activeMembers) * 100 * 3)); // ~33% engagement is full
  const bgChecked = vols.filter(v => v.bgCheck === 'Approved').length;
  const volScore = Math.min(100, Math.round(
    (activeVols / Math.max(1, activeMembers) * 200) +
    (bgChecked / Math.max(1, activeVols) * 30)
  ));

  // ── 2. Care Ministry Activity ─────────────────────────────
  const openCare = care.filter(c => c.status !== 'Completed' && c.status !== 'Closed').length;
  const contactedRecently = care.filter(c => {
    if (!c.date) return false;
    const d = new Date(c.date), t = new Date(today);
    return Math.abs((t - d) / 86400000) <= 14; // within 14 days of visit date
  }).length;
  const careScore = Math.min(100, openCare === 0 ? 50 :
    Math.round((contactedRecently / openCare) * 100));

  const overdueCarePct = openCare > 0
    ? Math.round(care.filter(c => c.status === 'Scheduled' && c.date && c.date < today).length / openCare * 100)
    : 0;

  // ── 3. Community Outreach ─────────────────────────────────
  const completedOutreach = commEvents.filter(c => c.status === 'Completed');
  const upcomingOutreach  = commEvents.filter(c => c.status !== 'Completed' && c.status !== 'Cancelled' && c.date >= today);
  const totalFamilies = completedOutreach.reduce((s,e)=>s+(Number(e.familiesImpacted)||0),0)
    + famAid.filter(r=>r.status==='Completed').length;
  const outreachScore = Math.min(100,
    (completedOutreach.length * 15) + (upcomingOutreach.length * 10) + Math.min(30, totalFamilies));

  // ── 4. Visitor Follow-Up ──────────────────────────────────
  const totalVisitors = visitors.length;
  const connected = visitors.filter(v => v.followUpStatus === 'Connected').length;
  const contacted = visitors.filter(v => ['Contacted','Invited Back','Connected'].includes(v.followUpStatus)).length;
  const followUpRate = totalVisitors > 0 ? Math.round((contacted / totalVisitors) * 100) : 0;
  const conversionRate = totalVisitors > 0 ? Math.round((connected / totalVisitors) * 100) : 0;
  const visitorScore = Math.min(100, followUpRate * 0.6 + conversionRate * 0.4);

  // ── 5. Event Participation ────────────────────────────────
  const recentEvents = events.filter(e => e.date <= today).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  const avgAttendance = recentEvents.length
    ? Math.round(recentEvents.reduce((s,e)=>s+(Number(e.attendance)||0),0) / recentEvents.length)
    : 0;
  const participationRate = activeMembers > 0 ? Math.round((avgAttendance / activeMembers) * 100) : 0;
  const eventScore = Math.min(100, participationRate * 1.2 + (recentEvents.length > 0 ? 20 : 0));

  function scoreColor(s) {
    if (s >= 80) return 'var(--green)';
    if (s >= 55) return 'var(--yellow)';
    if (s >= 30) return 'var(--orange)';
    return 'var(--red)';
  }
  function scoreGrade(s) {
    if (s >= 90) return { grade:'A+', label:'Excellent' };
    if (s >= 80) return { grade:'A',  label:'Strong' };
    if (s >= 70) return { grade:'B+', label:'Good' };
    if (s >= 55) return { grade:'B',  label:'Developing' };
    if (s >= 40) return { grade:'C',  label:'Needs Attention' };
    return { grade:'D', label:'Critical' };
  }

  function scoreCard(icon, title, score, bullets, suggestions) {
    const g = scoreGrade(score);
    const color = scoreColor(score);
    return `
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:1.4rem">${icon}</span>
            <div>
              <div style="font-weight:800;font-size:.95rem">${title}</div>
              <div style="font-size:.74rem;color:var(--text-muted)">${g.label}</div>
            </div>
          </div>
          <div style="text-align:center;background:${color};color:#fff;border-radius:10px;padding:6px 14px;">
            <div style="font-size:1.4rem;font-weight:900;line-height:1">${g.grade}</div>
            <div style="font-size:.6rem;font-weight:700;text-transform:uppercase;">${score}/100</div>
          </div>
        </div>
        <div class="progress-bar-track" style="margin-bottom:14px;">
          <div class="progress-bar-fill" style="width:${score}%;background:${color};transition:width .6s ease;"></div>
        </div>
        <div style="font-size:.82rem;display:flex;flex-direction:column;gap:5px;margin-bottom:12px;">
          ${bullets.map(b=>`<div style="display:flex;align-items:center;gap:6px;"><span style="color:var(--text-muted)">•</span>${b}</div>`).join('')}
        </div>
        ${suggestions.length ? `
          <div style="border-top:1px solid var(--border);padding-top:10px;">
            <div style="font-size:.72rem;font-weight:800;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;">💡 Suggestions</div>
            ${suggestions.map(s=>`<div style="font-size:.78rem;color:var(--text-muted);padding:3px 0;">→ ${s}</div>`).join('')}
          </div>` : ''}
      </div>`;
  }

  const overallScore = Math.round((volScore + careScore + outreachScore + visitorScore + eventScore) / 5);
  const overallGrade = scoreGrade(overallScore);

  page.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">🏆 Ministry Health Scorecard</h2>
        <div class="section-subtitle">Visual health indicators across all ministry areas</div>
      </div>
    </div>

    <!-- Overall Score -->
    <div class="card" style="margin-bottom:24px;background:linear-gradient(135deg,var(--accent) 0%,var(--accent-dark,var(--accent)) 100%);color:#fff;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
        <div>
          <div style="font-size:.76rem;font-weight:800;text-transform:uppercase;opacity:.8;margin-bottom:4px;">Overall Ministry Health</div>
          <div style="font-size:3rem;font-weight:900;line-height:1;">${overallGrade.grade}</div>
          <div style="font-size:.9rem;opacity:.9;">${overallGrade.label} · ${overallScore}/100</div>
        </div>
        <div style="display:flex;gap:20px;flex-wrap:wrap;font-size:.82rem;opacity:.9;">
          <div style="text-align:center"><div style="font-size:1.4rem;font-weight:900">${activeMembers}</div><div>Active Members</div></div>
          <div style="text-align:center"><div style="font-size:1.4rem;font-weight:900">${activeVols}</div><div>Volunteers</div></div>
          <div style="text-align:center"><div style="font-size:1.4rem;font-weight:900">${completedOutreach.length}</div><div>Events Done</div></div>
          <div style="text-align:center"><div style="font-size:1.4rem;font-weight:900">${totalFamilies}</div><div>Families Helped</div></div>
        </div>
      </div>
      <div class="progress-bar-track" style="margin-top:16px;background:rgba(255,255,255,.25);">
        <div class="progress-bar-fill" style="width:${overallScore}%;background:#fff;opacity:.9;"></div>
      </div>
    </div>

    <!-- Score cards grid -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;">

      ${scoreCard('🙌','Volunteer Engagement', Math.min(100,volScore),
        [
          `<strong>${activeVols}</strong> active volunteers out of <strong>${activeMembers}</strong> members`,
          `<strong>${bgChecked}</strong> volunteers with cleared background checks`,
          `<strong>${Math.round(activeVols/Math.max(1,activeMembers)*100)}%</strong> of congregation serving`,
        ],
        volScore < 70 ? [
          'Set a volunteer recruitment goal for the next quarter.',
          'Highlight volunteer opportunities in weekly announcements.',
          'Ask existing volunteers to invite one new person.',
        ] : ['Great volunteer engagement — keep recognizing your team!']
      )}

      ${scoreCard('❤️','Care Ministry Activity', Math.min(100,careScore),
        [
          `<strong>${openCare}</strong> active care cases open`,
          `<strong>${contactedRecently}</strong> contacts made in the last 14 days`,
          `<strong>${overdueCarePct}%</strong> of cases are past their follow-up date`,
        ],
        careScore < 70 ? [
          'Review overdue follow-up dates in the Care Ministry module.',
          'Assign open cases that currently have no caregiver.',
          'Schedule a care team check-in meeting.',
        ] : ['Care team is staying on top of follow-ups — well done!']
      )}

      ${scoreCard('🌍','Community Outreach', Math.min(100,outreachScore),
        [
          `<strong>${completedOutreach.length}</strong> outreach events completed`,
          `<strong>${upcomingOutreach.length}</strong> events planned or upcoming`,
          `<strong>${totalFamilies}</strong> total families impacted`,
        ],
        outreachScore < 70 ? [
          'Plan at least one community event per month.',
          'Partner with local organizations to expand reach.',
          'Track impact metrics (families, items) to tell your story.',
        ] : ['Strong outreach presence in the community!']
      )}

      ${scoreCard('👋','Visitor Follow-Up', Math.min(100,visitorScore),
        [
          `<strong>${totalVisitors}</strong> total visitors recorded`,
          `<strong>${followUpRate}%</strong> followed up (contacted or invited back)`,
          `<strong>${conversionRate}%</strong> became connected members`,
        ],
        visitorScore < 70 ? [
          'Contact new visitors within 48 hours of first visit.',
          'Create a personal follow-up process for each visitor.',
          'Track the "Invited Back" status to close the loop.',
        ] : ['Excellent follow-up culture — visitors feel welcomed!']
      )}

      ${scoreCard('📅','Event Participation', Math.min(100,eventScore),
        [
          `<strong>${recentEvents.length}</strong> recent events tracked`,
          `Average attendance: <strong>${avgAttendance}</strong> people`,
          `<strong>${participationRate}%</strong> participation rate (vs. active members)`,
        ],
        eventScore < 70 ? [
          'Promote events 2–3 weeks in advance via multiple channels.',
          'Offer childcare at major events to boost family attendance.',
          'Survey attendees to improve future event quality.',
        ] : ['Members are showing up — great community energy!']
      )}

    </div>

    <!-- Score Legend -->
    <div class="card" style="margin-top:20px;">
      <div class="card-header"><h3 class="card-title">📋 Score Legend</h3></div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:.8rem;">
        ${[['A+/A','90–100','Excellent'],['B+','70–89','Good'],['B','55–69','Developing'],['C','40–54','Needs Attention'],['D','<40','Critical']].map(([g,r,l])=>
          `<div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:var(--surface-2);border-radius:6px;">
            <strong>${g}</strong> <span style="color:var(--text-muted)">${r} — ${l}</span>
           </div>`
        ).join('')}
      </div>
      <div style="margin-top:12px;font-size:.78rem;color:var(--text-muted);line-height:1.7;">
        Scores are calculated from live data in your dashboard. They update automatically as you enter records.<br>
        Focus on areas graded C or D first — small, consistent improvements compound over time.
      </div>
    </div>
  `;
});

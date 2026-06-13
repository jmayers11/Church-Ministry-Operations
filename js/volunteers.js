/* =============================================================
   volunteers.js  —  Volunteer Center
   Tabs: People | Schedule | Background Checks
   ============================================================= */

/* ── Seed volunteer hours ─────────────────────────────── */
(function seedVolHours() {
  if (Storage.get('_vol_hours_seeded')) return;
  if (!window.DEMO_MODE) { Storage.set('_vol_hours_seeded', true); return; }
  const volunteers = Storage.getAll('volunteers');
  if (!volunteers.length) return;
  const today = new Date(Storage.today());
  volunteers.slice(0, 12).forEach(function(v) {
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
}());

/* ── Seed volunteer skill profiles ────────────────────── */
(function seedVolunteerCenter() {
  if (Storage.get('_volcenter_seeded')) return;
  if (!window.DEMO_MODE) { Storage.set('_volcenter_seeded', true); return; }
  const uid = Storage.uid;
  const profiles = [
    { id: uid(), name: 'Kevin Brown',    skills: ['Audio Engineering','Sound Mixing','Video Production'], interests: ['Worship Team','Youth','Media'],            certifications: ['CPR'],           bgCheck: 'Approved', availability: ['Sunday','Wednesday'], hoursPerMonth: 8  },
    { id: uid(), name: 'Angela Lee',     skills: ['Early Childhood Education','First Aid','CPR'],         interests: ["Children's Ministry",'Nursery'],           certifications: ['CPR','First Aid'],bgCheck: 'Approved', availability: ['Sunday'],             hoursPerMonth: 6  },
    { id: uid(), name: 'Maria Martinez', skills: ['Vocal Performance','Piano','Music Theory'],            interests: ['Worship Team','Music Ministry'],           certifications: [],                bgCheck: 'Approved', availability: ['Sunday','Rehearsals'], hoursPerMonth: 10 },
    { id: uid(), name: 'Nancy Garcia',   skills: ['Food Service','Inventory Management','Logistics'],     interests: ['Food Pantry','Outreach','Community'],      certifications: ['Food Handler'],   bgCheck: 'Approved', availability: ['Tue','Thu','Sat'],    hoursPerMonth: 20 },
    { id: uid(), name: 'David Martinez', skills: ['Youth Ministry','Mentoring','Teaching','Bilingual'],   interests: ['Youth','Outreach','Mentoring'],            certifications: ['CPR'],           bgCheck: 'Approved', availability: ['Sunday','Friday'],    hoursPerMonth: 16 },
    { id: uid(), name: 'Gloria Cooper',  skills: ['Case Management','Social Work','Benevolence'],         interests: ['Care Ministry','Family Assistance'],       certifications: ['Social Work'],   bgCheck: 'Approved', availability: ['Flexible'],           hoursPerMonth: 10 },
  ];
  Storage.saveAll('volunteer_profiles', profiles);
  Storage.set('_volcenter_seeded', true);
}());

/* ═══════════════════════════════════════════════════════════ */
Navigation.register('volunteers', function render(page) {
  const volunteers = Storage.getAll('volunteers');
  const profiles   = Storage.getAll('volunteer_profiles') || [];
  const teams      = ['Worship Team', "Children's Ministry", 'Youth Ministry', 'Outreach', 'Hospitality', 'Security', 'Small Groups', 'Audio/Visual', 'Food Pantry', 'Care'];
  const bgColors   = { Approved:'green', Pending:'yellow', Expired:'red', 'Not Required':'gray' };
  let activeTab    = Storage.get('_vols_tab') || 'people';

  /* ── Volunteer matching engine (People tab) ───────────── */
  function renderMatchResults(results, need) {
    if (!results.length) return '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="search" class="icon-inline" aria-hidden="true"></i></div><div class="empty-state-title">No matches found</div><div class="empty-state-body">Try different keywords.</div></div>';
    return '<div class="text-meta" style="margin-bottom:10px;">Found <strong>' + results.length + '</strong> volunteer' + (results.length>1?'s':'') + ' matching &ldquo;' + UI.esc(need) + '&rdquo;</div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;">'
      + results.map(function(r) {
          return '<div class="card" style="border-left:3px solid var(--accent)">'
            + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">'
            + '<div style="font-weight:700">' + UI.esc(r.profile.name) + '</div>'
            + '<div style="font-size:1.1rem;font-weight:800;color:var(--accent)">' + r.score + '%</div></div>'
            + '<div style="font-size:.8rem;margin-bottom:6px;">'
            + (r.profile.availability ? '<i data-lucide="clock" class="icon-xs" aria-hidden="true"></i> ' + (Array.isArray(r.profile.availability) ? r.profile.availability.join(', ') : r.profile.availability) + ' &nbsp;&middot;&nbsp;' : '')
            + ' ~' + (r.profile.hoursPerMonth||0) + 'h/mo &nbsp;'
            + UI.badge(r.profile.bgCheck, r.profile.bgCheck==='Approved'?'green':r.profile.bgCheck==='Pending'?'yellow':'red') + '</div>'
            + (r.matchedSkills.length ? '<div style="margin-bottom:4px">' + r.matchedSkills.map(function(s){return '<span class="badge badge-success" style="margin:2px;font-size:.68rem">'+UI.esc(s)+'</span>';}).join('') + '</div>' : '')
            + (r.matchedInterests.length ? '<div>' + r.matchedInterests.map(function(i){return '<span class="badge badge-blue" style="margin:2px;font-size:.68rem">'+UI.esc(i)+'</span>';}).join('') + '</div>' : '')
            + '</div>';
        }).join('')
      + '</div>';
  }

  function runMatch(need) {
    if (!need.trim()) return '';
    const words = need.toLowerCase().split(/\s+/);
    // Match against both volunteers (roster) and volunteer_profiles
    const allProfs = profiles.length ? profiles : volunteers.map(function(v) {
      return { name: v.name, skills: [], interests: [], bgCheck: v.bgCheck, availability: v.availability, hoursPerMonth: 0 };
    });
    const scored = allProfs.map(function(p) {
      const matchedSkills    = (p.skills||[]).filter(function(s){ return words.some(function(w){return s.toLowerCase().includes(w);}); });
      const matchedInterests = (p.interests||[]).filter(function(i){ return words.some(function(w){return i.toLowerCase().includes(w);}); });
      const nameMatch        = words.some(function(w){ return p.name.toLowerCase().includes(w); });
      const totalPossible    = (p.skills||[]).length + (p.interests||[]).length || 1;
      const rawScore         = matchedSkills.length * 2 + matchedInterests.length + (nameMatch ? 1 : 0);
      const score            = Math.min(100, Math.round((rawScore / Math.max(1, totalPossible * 0.8)) * 100));
      return { profile:p, score:score, matchedSkills:matchedSkills, matchedInterests:matchedInterests };
    }).filter(function(r){ return r.score > 0 || r.matchedSkills.length || r.matchedInterests.length; });
    scored.sort(function(a,b){ return b.score - a.score; });
    return renderMatchResults(scored, need);
  }

  function renderContent() {
    document.querySelectorAll('#vols-tabs .tab-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.tab === activeTab);
    });
    const body = document.getElementById('vols-body');
    if (!body) return;

    /* ════════════════════════════════
       TAB 1 — PEOPLE
    ════════════════════════════════ */
    if (activeTab === 'people') {
      const hours = Storage.getAll('vol_hours') || [];
      const thisMonth = Storage.today().slice(0,7);
      const monthHrs  = hours.filter(function(h){ return (h.date||'').startsWith(thisMonth); }).reduce(function(s,h){ return s + (Number(h.hours)||0); }, 0);
      const totalHrs  = hours.reduce(function(s,h){ return s + (Number(h.hours)||0); }, 0);

      function thIconV(key) {
        const c=Vols._sort.col, d=Vols._sort.dir;
        if(c!==key) return '<span style="opacity:.25;font-size:.7rem;margin-left:3px">&#x21D5;</span>';
        return '<span style="font-size:.75rem;margin-left:3px;color:var(--accent)">'+(d==='asc'?'&#x2191;':'&#x2193;')+'</span>';
      }
      function thV(label,key) {
        const c=Vols._sort.col, d=Vols._sort.dir, active=c===key;
        return '<th aria-sort="'+(active?(d==='asc'?'ascending':'descending'):'none')+'" style="white-space:nowrap;'+(active?'color:var(--accent);':'')+'"><button type="button" class="sort-btn" onclick="Vols.sortBy(\''+key+'\')">'+label+thIconV(key)+'</button></th>';
      }
      function renderTable(data) {
        const wrap = document.getElementById('vol-roster-wrap');
        if (!wrap) return;
        if (!data.length) {
          wrap.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="users" aria-hidden="true"></i></div><div class="empty-state-title">No volunteers found</div></div>';
          return;
        }
        const sorted = Vols._sort.col ? [...data].sort(function(a,b){
          const av=a[Vols._sort.col]??'', bv=b[Vols._sort.col]??'';
          const r=String(av).localeCompare(String(bv));
          return Vols._sort.dir==='asc'?r:-r;
        }) : data;
        wrap.innerHTML = '<table class="data-table"><thead><tr>'
          +thV('Name','name')+thV('Role','role')+thV('Team','team')+thV('Availability','availability')+thV('BG Check','bgCheck')+'<th>Notes</th><th>Actions</th>'
          +'</tr></thead><tbody>'
          +sorted.map(function(v){ return '<tr>'
            +'<td><strong>'+UI.esc(v.name)+'</strong></td>'
            +'<td>'+UI.esc(v.role||'—')+'</td>'
            +'<td><span class="badge badge-blue">'+UI.esc(v.team)+'</span></td>'
            +'<td>'+UI.esc(v.availability||'—')+'</td>'
            +'<td>'+UI.badge(v.bgCheck, bgColors[v.bgCheck]||'gray')+'</td>'
            +'<td class="text-meta">'+UI.esc(v.schedulingNotes||'')+'</td>'
            +'<td>'
            +'<button class="btn btn-primary btn-sm" onclick="Vols.profile(\''+v.id+'\')">Profile</button> '
            +'<button class="btn btn-ghost btn-sm" onclick="Vols.edit(\''+v.id+'\')">Edit</button> '
            +'<button class="btn btn-ghost btn-sm text-danger" aria-label="Remove volunteer" onclick="Vols.remove(\''+v.id+'\')">\xD7</button>'
            +'</td></tr>'; }).join('')
          +'</tbody></table>';
      }

      function filtered() {
        const q  = document.getElementById('vol-search')?.value.toLowerCase() || '';
        const t  = document.getElementById('vol-team-filter')?.value || '';
        const bg = document.getElementById('vol-bg-filter')?.value || '';
        return Storage.getAll('volunteers').filter(function(v){
          const txt = (v.name+' '+v.role+' '+v.team+' '+(v.schedulingNotes||'')).toLowerCase();
          return (!q||txt.includes(q)) && (!t||v.team===t) && (!bg||v.bgCheck===bg);
        });
      }

      body.innerHTML =
        // Matching engine
        '<div class="card" style="margin-bottom:20px;border:2px solid var(--accent);">'
        +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">'
        +'<i data-lucide="search" class="icon-inline" style="color:var(--accent)" aria-hidden="true"></i>'
        +'<div><div style="font-weight:800;font-size:1rem;">Volunteer Matching Engine</div>'
        +'<div class="text-meta">Describe a ministry need — find the best-fit volunteers by skill &amp; interest</div></div></div>'
        +'<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px;">'
        +'<input type="text" class="form-control" id="match-input" placeholder="e.g. Food Pantry, Children\'s Ministry Teacher, Sound Tech…" style="flex:1;min-width:200px">'
        +'<button class="btn btn-primary" id="match-btn"><i data-lucide="search" class="icon-xs" aria-hidden="true"></i> Find</button></div>'
        +'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">'
        +['Food Pantry','Youth Leader',"Children's Ministry",'Sound Tech','Security','Hospital Visits'].map(function(q){
          return '<button class="btn btn-outline btn-sm" onclick="document.getElementById(\'match-input\').value=\''+q+'\';document.getElementById(\'match-btn\').click()">'+q+'</button>';
        }).join('')
        +'</div><div id="match-results"></div></div>'
        // Hours stats + Log Hours
        +'<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:16px;">'
        +'<div class="stat-box"><div class="stat-box__value" style="color:var(--accent)">'+monthHrs.toFixed(1)+'h</div><div class="stat-box__label">This Month</div></div>'
        +'<div class="stat-box"><div class="stat-box__value">'+totalHrs.toFixed(1)+'h</div><div class="stat-box__label">All-Time Hours</div></div>'
        +'<button class="btn btn-outline btn-sm" style="margin-left:auto" onclick="Vols.logHours()"><i data-lucide="clock" class="icon-xs" aria-hidden="true"></i> Log Hours</button>'
        +'</div>'
        // Roster toolbar + table
        +'<div class="toolbar">'
        +'<div class="search-input-wrap"><i data-lucide="search" class="search-icon" aria-hidden="true"></i>'
        +'<input type="text" class="search-input" id="vol-search" placeholder="Search volunteers…"></div>'
        +'<select class="filter-select" id="vol-team-filter"><option value="">All Teams</option>'
        +teams.map(function(t){return '<option>'+t+'</option>';}).join('')+'</select>'
        +'<select class="filter-select" id="vol-bg-filter"><option value="">All BG Statuses</option>'
        +'<option>Approved</option><option>Pending</option><option>Expired</option></select>'
        +'</div>'
        +'<div class="table-wrap" id="vol-roster-wrap"></div>';

      renderTable(filtered());
      Vols._rerender = function(){ renderTable(filtered()); };
      document.getElementById('vol-search')?.addEventListener('input', function(){ renderTable(filtered()); });
      document.getElementById('vol-team-filter')?.addEventListener('change', function(){ renderTable(filtered()); });
      document.getElementById('vol-bg-filter')?.addEventListener('change', function(){ renderTable(filtered()); });
      document.getElementById('match-btn').addEventListener('click', function(){
        const need = document.getElementById('match-input').value;
        document.getElementById('match-results').innerHTML = runMatch(need);
        if (typeof lucide !== 'undefined') lucide.createIcons();
      });
      document.getElementById('match-input').addEventListener('keydown', function(e){
        if (e.key==='Enter') document.getElementById('match-btn').click();
      });

    /* ════════════════════════════════
       TAB 2 — SCHEDULE
    ════════════════════════════════ */
    } else if (activeTab === 'schedule') {
      const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const AVAIL_MAP = {
        'Weekends':[0,6], 'Sundays':[0], 'Saturdays':[6], 'Weekdays':[1,2,3,4,5],
        'Monday':[1],'Tuesday':[2],'Wednesday':[3],'Thursday':[4],'Friday':[5],'Any':[0,1,2,3,4,5,6],
      };
      function availDays(avail) {
        if (!avail) return [];
        const lower = avail.toLowerCase();
        for (const [key, days] of Object.entries(AVAIL_MAP)) {
          if (lower.includes(key.toLowerCase())) return days;
        }
        return [];
      }
      const schedMap = {};
      teams.forEach(function(t){ schedMap[t]={0:[],1:[],2:[],3:[],4:[],5:[],6:[]}; });
      volunteers.forEach(function(v){
        const days = availDays(v.availability);
        if (days.length && schedMap[v.team]) days.forEach(function(d){ schedMap[v.team][d].push(v); });
      });
      const activeSched = Object.entries(schedMap).filter(function([t,days]){
        return Object.values(days).some(function(arr){ return arr.length>0; });
      });
      body.innerHTML =
        '<div class="section-label-sm" style="margin-bottom:var(--space-3)">Team assignments based on volunteers’ availability preferences.'
        +(volunteers.filter(function(v){return !v.availability;}).length>0
          ? ' <span class="text-meta">&middot; '+volunteers.filter(function(v){return !v.availability;}).length+' volunteers have no availability set.</span>' : '')
        +'</div>'
        +(activeSched.length===0
          ? UI.emptyState({ icon:'calendar-days', title:'No schedule data', body:'Set availability on volunteer profiles to populate the week grid.' })
          : '<div class="vol-week-grid-wrap"><table class="vol-week-grid data-table"><thead><tr>'
            +'<th class="vol-week-team-col">Team</th>'
            +DAY_NAMES.map(function(d){ return '<th class="vol-week-day-col">'+d.slice(0,3)+'</th>'; }).join('')
            +'</tr></thead><tbody>'
            +activeSched.map(function(entry){
              const team=entry[0], days=entry[1];
              return '<tr><td class="vol-week-team-cell"><span class="badge badge-blue" style="white-space:nowrap">'+UI.esc(team)+'</span></td>'
                +DAY_NAMES.map(function(_,di){
                  const vols=days[di];
                  if(!vols.length) return '<td class="vol-week-empty-cell">—</td>';
                  const hasExpired=vols.some(function(v){return v.bgCheck==='Expired';});
                  return '<td class="vol-week-cell'+(hasExpired?' vol-week-cell--warn':'')+'">'+vols.map(function(v){
                    return '<button class="vol-week-chip" onclick="Vols.profile(\''+v.id+'\')" title="View '+UI.esc(v.name)+'"'+(v.bgCheck==='Expired'?' style="border-color:var(--danger)"':'')+'>'
                      +UI.esc(v.name.split(' ')[0])+(v.bgCheck==='Expired'?'<i data-lucide="alert-circle" class="icon-xs" style="margin-left:2px;color:var(--danger)" aria-hidden="true"></i>':'')+'</button>';
                  }).join('')+'</td>';
                }).join('')+'</tr>';
            }).join('')
            +'</tbody></table></div>');
      if (typeof lucide !== 'undefined') lucide.createIcons();
      Vols._rerender = function(){ Vols._tab('schedule'); };

    /* ════════════════════════════════
       TAB 3 — BACKGROUND CHECKS
    ════════════════════════════════ */
    } else if (activeTab === 'bgchecks') {
      const expired  = volunteers.filter(function(v){return v.bgCheck==='Expired';});
      const pending  = volunteers.filter(function(v){return v.bgCheck==='Pending';});
      const approved = volunteers.filter(function(v){return v.bgCheck==='Approved';});
      const notReq   = volunteers.filter(function(v){return v.bgCheck==='Not Required';});

      function bgTable(list) {
        if (!list.length) return '<div class="text-meta" style="padding:10px 0">None</div>';
        return '<div class="table-wrap"><table class="data-table"><thead><tr>'
          +'<th>Name</th><th>Team</th><th>Role</th><th>Availability</th><th>Actions</th>'
          +'</tr></thead><tbody>'
          +list.map(function(v){
            return '<tr><td><strong>'+UI.esc(v.name)+'</strong></td>'
              +'<td><span class="badge badge-blue">'+UI.esc(v.team)+'</span></td>'
              +'<td>'+UI.esc(v.role||'—')+'</td>'
              +'<td>'+UI.esc(v.availability||'—')+'</td>'
              +'<td>'
              +'<button class="btn btn-ghost btn-sm" onclick="Vols._updateBG(\''+v.id+'\',\'Approved\')">✅ Approve</button> '
              +'<button class="btn btn-ghost btn-sm" onclick="Vols._updateBG(\''+v.id+'\',\'Pending\')">\u{1F550} Pending</button>'
              +'</td></tr>';
          }).join('')+'</tbody></table></div>';
      }

      body.innerHTML =
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:20px;">'
        +'<div class="stat-box" style="border:1px solid var(--danger)"><div class="stat-box__value text-danger">'+expired.length+'</div><div class="stat-box__label">Expired</div></div>'
        +'<div class="stat-box" style="border:1px solid var(--warning)"><div class="stat-box__value" style="color:var(--warning)">'+pending.length+'</div><div class="stat-box__label">Pending</div></div>'
        +'<div class="stat-box" style="border:1px solid var(--success)"><div class="stat-box__value text-success">'+approved.length+'</div><div class="stat-box__label">Approved</div></div>'
        +'<div class="stat-box"><div class="stat-box__value">'+notReq.length+'</div><div class="stat-box__label">Not Required</div></div>'
        +'</div>'
        +(expired.length ? '<div style="margin-bottom:20px;"><h3 style="font-size:var(--text-sm);font-weight:800;color:var(--danger);margin-bottom:var(--space-2)"><i data-lucide="alert-circle" class="icon-inline" aria-hidden="true"></i>Expired — Action Required</h3>'+bgTable(expired)+'</div>' : '')
        +(pending.length ? '<div style="margin-bottom:20px;"><h3 style="font-size:var(--text-sm);font-weight:800;color:var(--warning);margin-bottom:var(--space-2)"><i data-lucide="alert-triangle" class="icon-inline" aria-hidden="true"></i>Pending Background Checks</h3>'+bgTable(pending)+'</div>' : '')
        +'<div style="margin-bottom:20px;"><h3 style="font-size:var(--text-sm);font-weight:800;color:var(--success-text);margin-bottom:var(--space-2)"><i data-lucide="check-circle" class="icon-inline" aria-hidden="true"></i>Approved</h3>'+bgTable(approved)+'</div>';
    }
  }

  /* ── Page shell ─────────────────────────────────────── */
  const expired = volunteers.filter(function(v){return v.bgCheck==='Expired';}).length;
  const pending = volunteers.filter(function(v){return v.bgCheck==='Pending';}).length;

  page.innerHTML =
    '<div class="section-header"><div>'
    +'<h2 class="section-title"><i data-lucide="users" class="icon-inline" aria-hidden="true"></i>Volunteer Center</h2>'
    +'<div class="section-subtitle">'+volunteers.length+' volunteers across '+new Set(volunteers.map(function(v){return v.team;})).size+' teams</div>'
    +'</div>'
    +'<button class="btn btn-primary" onclick="Vols.add()">+ Add Volunteer</button>'
    +'</div>'
    +(expired ? '<div class="alert-banner alert-banner-red" onclick="Vols._tab(\'bgchecks\')" style="cursor:pointer;"><i data-lucide="alert-circle" class="icon-inline" aria-hidden="true"></i><strong>'+expired+' expired background check'+(expired>1?'s':'')+' require attention</strong> — <span style="text-decoration:underline">review now →</span></div>' : '')
    +(!expired && pending ? '<div class="alert-banner alert-banner-yellow" onclick="Vols._tab(\'bgchecks\')" style="cursor:pointer;"><i data-lucide="alert-triangle" class="icon-inline" aria-hidden="true"></i><strong>'+pending+' background check'+(pending>1?'s':'')+' pending</strong> — <span style="text-decoration:underline">review →</span></div>' : '')
    +'<div id="vols-tabs" style="display:flex;gap:4px;border-bottom:2px solid var(--border);margin-bottom:20px;flex-wrap:wrap;">'
    +[['people','<i data-lucide="users" class="icon-inline" aria-hidden="true"></i>People'],
      ['schedule','<i data-lucide="calendar-days" class="icon-inline" aria-hidden="true"></i>Schedule'],
      ['bgchecks','<i data-lucide="shield-check" class="icon-inline" aria-hidden="true"></i>Background Checks']
    ].map(function(item){
      const t=item[0], l=item[1];
      return '<button class="tab-btn'+(activeTab===t?' active':'')+'" data-tab="'+t+'" onclick="Vols._tab(\''+t+'\')">'+l+'</button>';
    }).join('')
    +'</div>'
    +'<div id="vols-body"></div>';

  renderContent();
});

/* ═══════════════════════════════════════════════════════════ */
const Vols = {
  _sort: { col: null, dir: 'asc' },
  _rerender: null,

  sortBy(col) {
    if (this._sort.col===col) this._sort.dir = this._sort.dir==='asc'?'desc':'asc';
    else { this._sort.col=col; this._sort.dir='asc'; }
    this._rerender?.();
  },

  _teams: ['Worship Team', "Children's Ministry", 'Youth Ministry', 'Outreach', 'Hospitality', 'Security', 'Small Groups', 'Audio/Visual', 'Food Pantry', 'Care'],

  _tab(t) { Storage.set('_vols_tab', t); Navigation.navigate('volunteers'); },

  _updateBG(id, status) {
    var upd = Storage.update('volunteers', id, { bgCheck: status });
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated() && upd) {
      SupabaseDB.tableUpsert('volunteers', upd).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
    }
    Toast.success('Background check marked ' + status);
    this._rerender?.();
  },

  profile(id) {
    const v = Storage.findById('volunteers', id); if (!v) return;
    const hours = (Storage.getAll('vol_hours') || []).filter(function(h){ return h.volunteerId===id; });
    const totalHrs = hours.reduce(function(s,h){ return s + (Number(h.hours)||0); }, 0);
    const bgColors = { Approved:'green', Pending:'yellow', Expired:'red', 'Not Required':'gray' };
    // Look up skill profile
    const sp = (Storage.getAll('volunteer_profiles') || []).find(function(p){ return p.name===v.name; });
    Modal.open({ title: UI.esc(v.name), width: '560px', body:
      '<div class="flex-row flex-wrap" style="margin-bottom:var(--space-5)">'
      +UI.avatar(v.name, 52)
      +'<div style="flex:1"><div style="font-size:var(--text-xl);font-weight:900">'+UI.esc(v.name)+'</div>'
      +'<div class="chip-row" style="margin:var(--space-2) 0 var(--space-1)">'
      +'<span class="badge badge-blue">'+UI.esc(v.team)+'</span>'
      +(v.role ? '<span class="text-meta">'+UI.esc(v.role)+'</span>' : '')
      +UI.badge(v.bgCheck, bgColors[v.bgCheck]||'gray')
      +'</div>'
      +'<div class="text-meta">'
      +(v.availability ? '<div><i data-lucide="calendar" class="icon-xs" aria-hidden="true"></i>'+UI.esc(v.availability)+'</div>' : '')
      +(v.schedulingNotes ? '<div><i data-lucide="file-text" class="icon-xs" aria-hidden="true"></i>'+UI.esc(v.schedulingNotes)+'</div>' : '')
      +'</div></div></div>'
      +(sp ? '<div style="margin-bottom:var(--space-4)">'
        +(sp.skills?.length ? '<div style="margin-bottom:6px"><span class="text-meta" style="font-size:.72rem;text-transform:uppercase;font-weight:700">Skills</span><br>'+(sp.skills||[]).map(function(s){return '<span class="badge badge-gray" style="margin:2px;font-size:.68rem">'+UI.esc(s)+'</span>';}).join('')+'</div>' : '')
        +(sp.interests?.length ? '<div><span class="text-meta" style="font-size:.72rem;text-transform:uppercase;font-weight:700">Interests</span><br>'+(sp.interests||[]).map(function(i){return '<span class="badge badge-blue" style="margin:2px;font-size:.68rem">'+UI.esc(i)+'</span>';}).join('')+'</div>' : '')
        +'</div>' : '')
      +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-3);margin-bottom:var(--space-4)">'
      +'<div class="stat-box"><div class="stat-box__value" style="color:var(--accent)">'+totalHrs.toFixed(1)+'h</div><div class="stat-box__label">Total Hours</div></div>'
      +'<div class="stat-box"><div class="stat-box__value">'+hours.length+'</div><div class="stat-box__label">Sessions</div></div>'
      +'<div class="stat-box"><div class="stat-box__value">'+(hours.length?(totalHrs/hours.length).toFixed(1):0)+'h</div><div class="stat-box__label">Avg/Session</div></div>'
      +'</div>'
      +(hours.length ? '<div class="section-label-sm">Recent Hours</div>'
        +hours.sort(function(a,b){return b.date.localeCompare(a.date);}).slice(0,5).map(function(h){
          return '<div class="flex-between detail-row"><span class="text-meta">'+UI.fmtDate(h.date)+'</span>'
            +'<span style="flex:1;margin:0 var(--space-3)">'+UI.esc(h.activity||'')+'</span>'
            +'<strong style="color:var(--accent)">'+h.hours+'h</strong></div>';
        }).join('') : '<div class="text-meta">No hours logged yet.</div>'),
      footer: '<button class="btn btn-outline" onclick="Modal.close()">Close</button>'
             +'<button class="btn btn-primary" onclick="Modal.close();Vols.edit(\''+id+'\')">Edit</button>',
    });
  },

  _form(v) {
    v = v || {};
    return '<div class="form-group"><label class="form-label">Volunteer Name *</label><input class="form-control" id="vl-name" value="'+UI.esc(v.name||'')+'"></div>'
      +'<div class="form-row">'
      +'<div class="form-group"><label class="form-label">Role</label><input class="form-control" id="vl-role" value="'+UI.esc(v.role||'')+'"></div>'
      +'<div class="form-group"><label class="form-label">Ministry Team</label>'
      +'<select class="form-control" id="vl-team">'+this._teams.map(function(t){return '<option '+(v.team===t?'selected':'')+'>'+t+'</option>';}).join('')+'</select></div></div>'
      +'<div class="form-row">'
      +'<div class="form-group"><label class="form-label">Availability</label><input class="form-control" id="vl-avail" value="'+UI.esc(v.availability||'')+'"></div>'
      +'<div class="form-group"><label class="form-label">Background Check</label>'
      +'<select class="form-control" id="vl-bg">'+['Approved','Pending','Expired','Not Required'].map(function(s){return '<option '+((v.bgCheck||'Pending')===s?'selected':'')+'>'+s+'</option>';}).join('')+'</select></div></div>'
      +'<div class="form-group"><label class="form-label">Scheduling Notes</label><textarea class="form-control" id="vl-notes">'+UI.esc(v.schedulingNotes||'')+'</textarea></div>';
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
      footer:'<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>'
            +'<button class="btn btn-primary" id="save-vol-btn">Save Volunteer</button>' });
    document.getElementById('save-vol-btn').onclick = () => {
      const d = this._collect();
      if (!Validate.check([['vl-name', Validate.required(d.name,'Volunteer name')]])) return;
      var saved = Storage.insert('volunteers', d);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) {
        SupabaseDB.tableUpsert('volunteers', saved).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed.'); });
      }
      Modal.close(); Toast.success('Volunteer added'); Vols._rerender?.();
    };
  },

  edit(id) {
    const v = Storage.findById('volunteers', id); if (!v) return;
    Modal.open({ title:'Edit Volunteer', body:this._form(v), width:'520px',
      footer:'<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>'
            +'<button class="btn btn-primary" id="save-vol-btn">Save Changes</button>' });
    document.getElementById('save-vol-btn').onclick = () => {
      var upd = Storage.update('volunteers', id, this._collect());
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated() && upd) {
        SupabaseDB.tableUpsert('volunteers', upd).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed.'); });
      }
      Modal.close(); Toast.success('Updated'); Vols._rerender?.();
    };
  },

  remove(id) {
    UI.confirm('Remove this volunteer from the roster?', () => {
      Storage.removeItem('volunteers', id);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) {
        SupabaseDB.tableDelete('volunteers', id).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed.'); });
      }
      Toast.success('Removed'); Vols._rerender?.();
    });
  },

  logHours() {
    const vols = Storage.getAll('volunteers');
    Modal.open({ title:'Log Volunteer Hours', width:'480px', body:
      '<div class="form-group"><label class="form-label">Volunteer *</label>'
      +'<select class="form-control" id="lh-vol"><option value="">— Select volunteer —</option>'
      +vols.map(function(v){ return '<option value="'+v.id+'" data-team="'+UI.esc(v.team)+'">'+UI.esc(v.name)+' ('+UI.esc(v.team)+')</option>'; }).join('')
      +'</select></div>'
      +'<div class="form-row">'
      +'<div class="form-group"><label class="form-label">Date *</label><input class="form-control" id="lh-date" type="date" value="'+Storage.today()+'"></div>'
      +'<div class="form-group"><label class="form-label">Hours *</label><input class="form-control" id="lh-hours" type="number" min="0.5" max="24" step="0.5" value="2"></div>'
      +'</div>'
      +'<div class="form-group"><label class="form-label">Activity Description</label>'
      +'<input class="form-control" id="lh-activity" placeholder="e.g. Sunday service setup, Food pantry shift…"></div>',
      footer:'<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>'
            +'<button class="btn btn-primary" id="save-hours-btn">Log Hours</button>' });
    document.getElementById('save-hours-btn').onclick = () => {
      const volId = document.getElementById('lh-vol')?.value;
      const hrs   = parseFloat(document.getElementById('lh-hours')?.value);
      const date  = document.getElementById('lh-date')?.value;
      if (!Validate.check([
        ['lh-vol',   Validate.required(volId,'Volunteer')],
        ['lh-hours', hrs <= 0 ? 'Hours must be greater than 0' : null],
      ])) return;
      const v = Storage.findById('volunteers', volId);
      var saved = Storage.insert('vol_hours', {
        volunteerId:v.id, volunteerName:v?.name||'', team:v?.team||'',
        date:date, hours:hrs, activity:document.getElementById('lh-activity')?.value.trim(),
      });
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) {
        SupabaseDB.tableUpsert('vol_hours', saved).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed.'); });
      }
      Modal.close(); Toast.success('Hours logged'); Vols._rerender?.();
    };
  },
};

/* ── VolCenter: skill profile CRUD ──────────────────── */
const VolCenter = {
  _form(p) {
    p = p || {};
    const csv = function(arr){ return (arr||[]).join(', '); };
    return '<div class="form-group"><label class="form-label">Volunteer Name *</label>'
      +'<input class="form-control" id="vc-name" value="'+UI.esc(p.name||'')+'"></div>'
      +'<div class="form-row">'
      +'<div class="form-group"><label class="form-label">Background Check</label>'
      +'<select class="form-control" id="vc-bg">'
      +['Approved','Pending','Expired','Not Required'].map(function(s){ return '<option '+(p.bgCheck===s?'selected':'')+'>'+s+'</option>'; }).join('')
      +'</select></div>'
      +'<div class="form-group"><label class="form-label">Hours Per Month</label>'
      +'<input class="form-control" id="vc-hrs" type="number" min="0" value="'+(p.hoursPerMonth||0)+'"></div></div>'
      +'<div class="form-group"><label class="form-label">Availability (comma-separated)</label>'
      +'<input class="form-control" id="vc-avail" value="'+UI.esc(csv(p.availability))+'"></div>'
      +'<div class="form-group"><label class="form-label">Skills (comma-separated)</label>'
      +'<input class="form-control" id="vc-skills" value="'+UI.esc(csv(p.skills))+'"></div>'
      +'<div class="form-group"><label class="form-label">Ministry Interests (comma-separated)</label>'
      +'<input class="form-control" id="vc-interests" value="'+UI.esc(csv(p.interests))+'"></div>'
      +'<div class="form-group"><label class="form-label">Certifications (comma-separated)</label>'
      +'<input class="form-control" id="vc-certs" value="'+UI.esc(csv(p.certifications))+'"></div>';
  },
  _collect() {
    const csv = function(id){ return (document.getElementById(id)?.value||'').split(',').map(function(s){return s.trim();}).filter(Boolean); };
    return {
      name:           document.getElementById('vc-name')?.value.trim(),
      bgCheck:        document.getElementById('vc-bg')?.value,
      hoursPerMonth:  parseInt(document.getElementById('vc-hrs')?.value)||0,
      availability:   csv('vc-avail'),
      skills:         csv('vc-skills'),
      interests:      csv('vc-interests'),
      certifications: csv('vc-certs'),
    };
  },
  add() {
    Modal.open({ title:'Add Skill Profile', body:this._form(), width:'500px',
      footer:'<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>'
            +'<button class="btn btn-primary" id="save-vc-btn">Save</button>' });
    document.getElementById('save-vc-btn').onclick = () => {
      const d = this._collect();
      if (!Validate.check([['vc-name', Validate.required(d.name,'Name')]])) return;
      Storage.insert('volunteer_profiles', d);
      Modal.close(); Toast.success('Profile added'); Navigation.navigate('volunteers');
    };
  },
  edit(id) {
    const p = Storage.findById('volunteer_profiles', id); if (!p) return;
    Modal.open({ title:'Edit Skill Profile', body:this._form(p), width:'500px',
      footer:'<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>'
            +'<button class="btn btn-primary" id="save-vc-btn">Save</button>' });
    document.getElementById('save-vc-btn').onclick = () => {
      Storage.update('volunteer_profiles', id, this._collect());
      Modal.close(); Toast.success('Updated'); Navigation.navigate('volunteers');
    };
  },
  remove(id) {
    UI.confirm('Remove this skill profile?', function(){
      Storage.removeItem('volunteer_profiles', id);
      Toast.success('Removed'); Navigation.navigate('volunteers');
    });
  },
};

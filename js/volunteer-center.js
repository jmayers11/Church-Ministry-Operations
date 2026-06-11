/* =============================================================
   volunteer-center.js  —  Volunteer Service Center + Matching
   ============================================================= */

(function seedVolunteerCenter() {
  if (Storage.get('_volcenter_seeded')) return;
  const uid = Storage.uid;
  // Enrich existing volunteers with skills/interests — stored separately
  const profiles = [
    { id: uid(), name: 'Kevin Brown',     skills: ['Audio Engineering','Sound Mixing','Video Production'], interests: ['Worship Team','Youth','Media'],       certifications: ['CPR'],             bgCheck: 'Approved', availability: ['Sunday','Wednesday'], hoursPerMonth: 8  },
    { id: uid(), name: 'Angela Lee',      skills: ['Early Childhood Education','First Aid','CPR'],         interests: ["Children's Ministry",'Nursery'],       certifications: ['CPR','First Aid'],   bgCheck: 'Approved', availability: ['Sunday'],             hoursPerMonth: 6  },
    { id: uid(), name: 'Maria Martinez',  skills: ['Vocal Performance','Piano','Music Theory'],            interests: ['Worship Team','Music Ministry'],       certifications: [],                   bgCheck: 'Approved', availability: ['Sunday','Rehearsals'], hoursPerMonth: 10 },
    { id: uid(), name: 'Susan Anderson',  skills: ['Choral Direction','Music Education','Piano'],          interests: ['Worship Team','Music Ministry'],       certifications: [],                   bgCheck: 'Approved', availability: ['Sunday','Wednesday'],  hoursPerMonth: 12 },
    { id: uid(), name: 'Carol Clark',     skills: ['Elementary Education','Curriculum Development'],       interests: ["Children's Ministry",'VBS'],           certifications: ['CPR','Background'],  bgCheck: 'Approved', availability: ['Sunday'],             hoursPerMonth: 6  },
    { id: uid(), name: 'Nancy Garcia',    skills: ['Food Service','Inventory Management','Logistics'],     interests: ['Food Pantry','Outreach','Community'],  certifications: ['Food Handler'],     bgCheck: 'Approved', availability: ['Tue','Thu','Sat'],    hoursPerMonth: 20 },
    { id: uid(), name: 'Carlos Garcia',   skills: ['Bilingual (Spanish)','Physical Labor','Driving'],      interests: ['Outreach','Food Pantry','Community'],  certifications: [],                   bgCheck: 'Pending',  availability: ['Saturday'],           hoursPerMonth: 8  },
    { id: uid(), name: 'Frank Rivera',    skills: ['Security','Firearms Certified','CPR','First Aid'],     interests: ['Security','Safety'],                   certifications: ['CPR','Security'],   bgCheck: 'Approved', availability: ['Sunday'],             hoursPerMonth: 4  },
    { id: uid(), name: 'Dorothy White',   skills: ['Hospitality','Cooking','Visitation'],                  interests: ['Hospitality','Care Ministry','Widow Care'], certifications: ['CPR'],          bgCheck: 'Approved', availability: ['Sunday','Flexible'],  hoursPerMonth: 10 },
    { id: uid(), name: 'Helen Robinson',  skills: ['Greeting','Hospitality','Visitor Welcome'],            interests: ['Hospitality','Visitor Follow-Up'],     certifications: [],                   bgCheck: 'Approved', availability: ['Sunday'],             hoursPerMonth: 4  },
    { id: uid(), name: 'David Martinez',  skills: ['Youth Ministry','Mentoring','Teaching','Bilingual'],   interests: ['Youth','Outreach','Mentoring'],         certifications: ['CPR'],              bgCheck: 'Approved', availability: ['Sunday','Friday'],    hoursPerMonth: 16 },
    { id: uid(), name: 'Brian Taylor',    skills: ['Small Group Facilitation','Teaching','Counseling'],    interests: ['Small Groups','Mentoring'],             certifications: [],                   bgCheck: 'Approved', availability: ['Wednesday'],          hoursPerMonth: 8  },
    { id: uid(), name: 'Eric Harris',     skills: ['Video Editing','Graphic Design','Social Media'],       interests: ['Media','Youth','Audio/Visual'],         certifications: [],                   bgCheck: 'Approved', availability: ['Sunday','Flexible'],  hoursPerMonth: 6  },
    { id: uid(), name: 'Gloria Cooper',   skills: ['Case Management','Social Work','Benevolence'],         interests: ['Care Ministry','Family Assistance'],    certifications: ['Social Work'],      bgCheck: 'Approved', availability: ['Flexible'],           hoursPerMonth: 10 },
    { id: uid(), name: 'Linda Thompson',  skills: ['Check-In Systems','Administration','Children'],        interests: ["Children's Ministry",'Administration'],certifications: ['CPR'],              bgCheck: 'Approved', availability: ['Sunday'],             hoursPerMonth: 4  },
  ];
  Storage.saveAll('volunteer_profiles', profiles);
  Storage.set('_volcenter_seeded', true);
})();

Navigation.register('volunteer-center', function render(page) {
  const profiles = Storage.getAll('volunteer_profiles');

  // All unique skills, interests, availability slots
  const allSkills = [...new Set(profiles.flatMap(p=>p.skills||[]))].sort();
  const allInterests = [...new Set(profiles.flatMap(p=>p.interests||[]))].sort();

  function renderMatchResults(results, need) {
    if (!results.length) return `<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">No matches found</div><div class="empty-state-text">Try broadening the search criteria.</div></div>`;
    return `
      <div style="margin-bottom:12px;font-size:.86rem;color:var(--text-muted);">
        Found <strong>${results.length}</strong> volunteer${results.length>1?'s':''} matching "${UI.esc(need)}"
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;">
        ${results.map(r => `
          <div class="card" style="border-left:3px solid var(--accent)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <div style="font-weight:700;">${UI.esc(r.profile.name)}</div>
              <div style="font-size:1.2rem;font-weight:800;color:var(--accent)">${r.score}%</div>
            </div>
            <div style="font-size:.8rem;margin-bottom:8px;">
              <div style="margin-bottom:4px;color:var(--text-muted);">
                🕐 ${(r.profile.availability||[]).join(', ')} · ~${r.profile.hoursPerMonth}h/mo
              </div>
              ${UI.badge(r.profile.bgCheck, r.profile.bgCheck==='Approved'?'green':r.profile.bgCheck==='Pending'?'yellow':'red')}
            </div>
            ${r.matchedSkills.length ? `<div style="margin-bottom:6px;"><span style="font-size:.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Matching Skills</span><br>
              ${r.matchedSkills.map(s=>`<span class="badge badge-green" style="margin:2px">${UI.esc(s)}</span>`).join('')}</div>` : ''}
            ${r.matchedInterests.length ? `<div><span style="font-size:.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Matching Interests</span><br>
              ${r.matchedInterests.map(i=>`<span class="badge badge-blue" style="margin:2px">${UI.esc(i)}</span>`).join('')}</div>` : ''}
          </div>`).join('')}
      </div>`;
  }

  function runMatch(need) {
    if (!need.trim()) return '';
    const words = need.toLowerCase().split(/\s+/);
    const scored = profiles.map(p => {
      const matchedSkills    = (p.skills||[]).filter(s => words.some(w => s.toLowerCase().includes(w)));
      const matchedInterests = (p.interests||[]).filter(i => words.some(w => i.toLowerCase().includes(w)));
      const nameMatch        = words.some(w => p.name.toLowerCase().includes(w));
      const totalPossible    = (p.skills||[]).length + (p.interests||[]).length || 1;
      const rawScore         = matchedSkills.length * 2 + matchedInterests.length + (nameMatch ? 1 : 0);
      const score            = Math.min(100, Math.round((rawScore / Math.max(1, totalPossible * 0.8)) * 100));
      return { profile:p, score, matchedSkills, matchedInterests };
    }).filter(r => r.score > 0 || r.matchedSkills.length || r.matchedInterests.length);
    scored.sort((a,b) => b.score - a.score);
    return renderMatchResults(scored, need);
  }

  page.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">🙌 Volunteer Service Center</h2>
        <div class="section-subtitle">${profiles.length} skill profiles · Smart matching system · See Volunteer Roster for headcount</div>
      </div>
      <button class="btn btn-primary" onclick="VolCenter.add()">+ Add Profile</button>
    </div>

    <!-- Stat Cards -->
    <div class="stat-grid" style="margin-bottom:24px;">
      <div class="stat-card" data-accent="blue">
        <div class="stat-icon">🙌</div><div class="stat-value">${profiles.length}</div>
        <div class="stat-label">Skill Profiles</div>
      </div>
      <div class="stat-card" data-accent="green">
        <div class="stat-icon">✅</div><div class="stat-value">${profiles.filter(p=>p.bgCheck==='Approved').length}</div>
        <div class="stat-label">Background Checked</div>
      </div>
      <div class="stat-card" data-accent="yellow">
        <div class="stat-icon">⏳</div><div class="stat-value">${profiles.filter(p=>p.bgCheck==='Pending').length}</div>
        <div class="stat-label">BG Check Pending</div>
      </div>
      <div class="stat-card" data-accent="purple">
        <div class="stat-icon">⏱</div><div class="stat-value">${profiles.reduce((s,p)=>s+(p.hoursPerMonth||0),0)}</div>
        <div class="stat-label">Monthly Volunteer Hours</div>
      </div>
    </div>

    <!-- Volunteer Matching Engine -->
    <div class="card" style="margin-bottom:28px;border:2px solid var(--accent);">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <span style="font-size:1.5rem;">🔍</span>
        <div>
          <div style="font-weight:800;font-size:1rem;">Volunteer Matching Engine</div>
          <div style="font-size:.82rem;color:var(--text-muted)">Describe a need — we'll find the best-fit volunteers</div>
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px;">
        <input type="text" class="form-control" id="match-input" placeholder='e.g. "Food Pantry Volunteer" or "Children\'s Ministry Teacher"' style="flex:1;min-width:200px">
        <button class="btn btn-primary" id="match-btn">Find Volunteers</button>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
        ${['Food Pantry','Youth Leader','Children\'s Ministry','Sound Tech','Hospital Visits','Security','Small Group Leader','Meal Train'].map(q=>
          `<button class="btn btn-outline btn-sm" onclick="document.getElementById('match-input').value='${q}';document.getElementById('match-btn').click()">${q}</button>`
        ).join('')}
      </div>
      <div id="match-results"></div>
    </div>

    <!-- Volunteer Profiles Grid -->
    <h3 style="font-size:.95rem;font-weight:700;margin-bottom:14px;">All Volunteer Profiles</h3>
    <div class="toolbar">
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" class="search-input" id="vc-search" placeholder="Search volunteers, skills, interests…">
      </div>
      <select class="filter-select" id="vc-bg-filter">
        <option value="">All BG Statuses</option>
        <option>Approved</option><option>Pending</option><option>Expired</option>
      </select>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;" id="vc-grid"></div>
  `;

  function renderGrid(data) {
    const grid = document.getElementById('vc-grid');
    if (!grid) return;
    if (!data.length) { grid.innerHTML = `<div style="grid-column:1/-1"><div class="empty-state"><div class="empty-state-icon">🙌</div><div class="empty-state-title">No profiles found</div></div></div>`; return; }
    grid.innerHTML = data.map(p => `
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div style="font-weight:700">${UI.esc(p.name)}</div>
          ${UI.badge(p.bgCheck, p.bgCheck==='Approved'?'green':p.bgCheck==='Pending'?'yellow':'red')}
        </div>
        <div style="font-size:.78rem;color:var(--text-muted);margin-bottom:8px;">
          🕐 ${(p.availability||[]).join(', ')} · ~${p.hoursPerMonth||0}h/mo
        </div>
        <div style="margin-bottom:8px;">
          <div style="font-size:.7rem;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px">Skills</div>
          <div>${(p.skills||[]).map(s=>`<span class="badge badge-gray" style="margin:2px;font-size:.68rem">${UI.esc(s)}</span>`).join('')||'—'}</div>
        </div>
        <div style="margin-bottom:10px;">
          <div style="font-size:.7rem;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px">Interests</div>
          <div>${(p.interests||[]).map(i=>`<span class="badge badge-blue" style="margin:2px;font-size:.68rem">${UI.esc(i)}</span>`).join('')||'—'}</div>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-ghost btn-sm" onclick="VolCenter.edit('${p.id}')">Edit</button>
          <button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="VolCenter.remove('${p.id}')">Remove</button>
        </div>
      </div>`).join('');
  }

  renderGrid(profiles);

  document.getElementById('match-btn').addEventListener('click', () => {
    const need = document.getElementById('match-input').value;
    document.getElementById('match-results').innerHTML = runMatch(need);
  });
  document.getElementById('match-input').addEventListener('keydown', e => {
    if (e.key==='Enter') document.getElementById('match-btn').click();
  });

  function filteredProfiles() {
    const q  = document.getElementById('vc-search')?.value.toLowerCase()||'';
    const bg = document.getElementById('vc-bg-filter')?.value||'';
    return profiles.filter(p => {
      const txt = `${p.name} ${(p.skills||[]).join(' ')} ${(p.interests||[]).join(' ')} ${(p.certifications||[]).join(' ')}`.toLowerCase();
      return (!q||txt.includes(q)) && (!bg||p.bgCheck===bg);
    });
  }
  document.getElementById('vc-search')?.addEventListener('input', ()=>renderGrid(filteredProfiles()));
  document.getElementById('vc-bg-filter')?.addEventListener('change', ()=>renderGrid(filteredProfiles()));
});

const VolCenter = {
  _state: { search: '' },
  _rerender() {
    const _s = document.getElementById('vc-search');
    if (_s) VolCenter._state.search = _s.value;
    VolCenter._rerender();
    const _ns = document.getElementById('vc-search');
    if (_ns && VolCenter._state.search) { _ns.value = VolCenter._state.search; _ns.dispatchEvent(new Event('input')); }
  },
  _form(p={}) {
    return `
      <div class="form-group"><label class="form-label">Volunteer Name *</label>
        <input class="form-control" id="vc-name" value="${UI.esc(p.name||'')}">
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Background Check</label>
          <select class="form-control" id="vc-bg">
            ${['Approved','Pending','Expired','Not Required'].map(s=>`<option ${p.bgCheck===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Hours Per Month</label>
          <input class="form-control" id="vc-hrs" type="number" min="0" value="${p.hoursPerMonth||0}">
        </div>
      </div>
      <div class="form-group"><label class="form-label">Availability (comma-separated)</label>
        <input class="form-control" id="vc-avail" value="${UI.esc((p.availability||[]).join(', '))}">
      </div>
      <div class="form-group"><label class="form-label">Skills (comma-separated)</label>
        <input class="form-control" id="vc-skills" value="${UI.esc((p.skills||[]).join(', '))}">
      </div>
      <div class="form-group"><label class="form-label">Ministry Interests (comma-separated)</label>
        <input class="form-control" id="vc-interests" value="${UI.esc((p.interests||[]).join(', '))}">
      </div>
      <div class="form-group"><label class="form-label">Certifications (comma-separated)</label>
        <input class="form-control" id="vc-certs" value="${UI.esc((p.certifications||[]).join(', '))}">
      </div>`;
  },
  _collect() {
    const csv = id => document.getElementById(id)?.value.split(',').map(s=>s.trim()).filter(Boolean);
    return {
      name:          document.getElementById('vc-name')?.value.trim(),
      bgCheck:       document.getElementById('vc-bg')?.value,
      hoursPerMonth: parseInt(document.getElementById('vc-hrs')?.value)||0,
      availability:  csv('vc-avail'),
      skills:        csv('vc-skills'),
      interests:     csv('vc-interests'),
      certifications:csv('vc-certs'),
    };
  },
  add() {
    Modal.open({ title:'+ Volunteer Profile', body:this._form(), width:'500px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-vc-btn">Save</button>` });
    document.getElementById('save-vc-btn').onclick = () => {
      const d=this._collect();
      if(!Validate.check([
        ['vc-name', Validate.required(d.name,'Volunteer name')],
      ])) return;
      Storage.insert('volunteer_profiles',d); Modal.close(); Toast.success('Profile added'); VolCenter._rerender();
    };
  },
  edit(id) {
    const p=Storage.findById('volunteer_profiles',id); if(!p) return;
    Modal.open({ title:'Edit Profile', body:this._form(p), width:'500px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-vc-btn">Save</button>` });
    document.getElementById('save-vc-btn').onclick = () => {
      Storage.update('volunteer_profiles',id,this._collect()); Modal.close(); Toast.success('Updated'); VolCenter._rerender();
    };
  },
  remove(id) {
    UI.confirm('Remove this volunteer profile?',()=>{ Storage.removeItem('volunteer_profiles',id); Toast.success('Removed'); VolCenter._rerender(); });
  },
};
window.VolCenter = VolCenter;

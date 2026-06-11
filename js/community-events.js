/* =============================================================
   community-events.js  —  Community Events Hub
   Outreach events, food drives, VBS, disaster relief, community meals
   ============================================================= */

(function seedCommunityEvents() {
  if (Storage.get('_comm_events_seeded')) return;
  const uid = Storage.uid, today = Storage.today;
  const events = [
    {
      id: uid(), name: 'Community Food Drive', type: 'Food Drive',
      date: today(10), endDate: today(10), time: '9:00 AM – 1:00 PM',
      location: 'Church Parking Lot', description: 'Quarterly food drive collecting non-perishable items for the food pantry. Goal: 1,000 items.',
      volunteersNeeded: 20, volunteersSignedUp: 12, suppliesNeeded: 'Collection bins, tables, signage, volunteer vests',
      estimatedAttendance: 200, actualAttendance: 0, familiesImpacted: 0, itemsCollected: 0,
      status: 'Upcoming', coordinator: 'Nancy Garcia', notes: 'Partner with 3 local businesses for drop-off locations.', createdAt: today(-5)
    },
    {
      id: uid(), name: 'Free Community Meal', type: 'Community Meal',
      date: today(17), endDate: today(17), time: '5:00 PM – 7:00 PM',
      location: 'Fellowship Hall', description: 'Monthly free dinner open to the entire community. No strings attached — just good food and fellowship.',
      volunteersNeeded: 15, volunteersSignedUp: 10, suppliesNeeded: 'Disposable plates, napkins, serving utensils, tables',
      estimatedAttendance: 80, actualAttendance: 0, familiesImpacted: 0, itemsCollected: 0,
      status: 'Upcoming', coordinator: 'Dorothy White', notes: 'Menu: spaghetti, salad, garlic bread, dessert.', createdAt: today(-10)
    },
    {
      id: uid(), name: 'Vacation Bible School', type: 'VBS',
      date: today(60), endDate: today(64), time: '9:00 AM – Noon',
      location: 'Full Church Campus', description: 'Annual 5-day VBS for children ages 4-12. Theme: "Wilderness Escape." Expecting 60-80 kids.',
      volunteersNeeded: 30, volunteersSignedUp: 18, suppliesNeeded: 'Craft supplies, snacks, decorations, T-shirts, curriculum kits',
      estimatedAttendance: 70, actualAttendance: 0, familiesImpacted: 0, itemsCollected: 0,
      status: 'Planning', coordinator: 'Angela Lee', notes: 'Registration opens in 3 weeks. Volunteers need background checks.', createdAt: today(-20)
    },
    {
      id: uid(), name: 'Back-to-School Backpack Giveaway', type: 'Outreach Event',
      date: today(35), endDate: today(35), time: '10:00 AM – 2:00 PM',
      location: 'Church Parking Lot', description: 'Give away 100 backpacks filled with school supplies to children in need in our community.',
      volunteersNeeded: 18, volunteersSignedUp: 14, suppliesNeeded: '100 backpacks, school supplies, flyers, tables, pop-up tents',
      estimatedAttendance: 150, actualAttendance: 0, familiesImpacted: 0, itemsCollected: 100,
      status: 'Upcoming', coordinator: 'Gloria Cooper', notes: 'Partner with 2 local schools for referrals.', createdAt: today(-15)
    },
    {
      id: uid(), name: 'Neighborhood Block Party', type: 'Outreach Event',
      date: today(25), endDate: today(25), time: '3:00 PM – 7:00 PM',
      location: 'Church Parking Lot & Lawn', description: 'Annual community block party with food, games, bounce houses, and live music. A celebration of community.',
      volunteersNeeded: 25, volunteersSignedUp: 22, suppliesNeeded: 'Grills, food, bounce house rental, tables, chairs, sound system',
      estimatedAttendance: 300, actualAttendance: 0, familiesImpacted: 0, itemsCollected: 0,
      status: 'Upcoming', coordinator: 'David Martinez', notes: 'Bounce house rented. Need 5 more grillers.', createdAt: today(-30)
    },
    {
      id: uid(), name: 'Winter Coat Giveaway', type: 'Outreach Event',
      date: today(-45), endDate: today(-45), time: '10:00 AM – 1:00 PM',
      location: 'Fellowship Hall', description: 'Gave away 87 winter coats, hats, and gloves to community members in need.',
      volunteersNeeded: 12, volunteersSignedUp: 14, suppliesNeeded: '',
      estimatedAttendance: 100, actualAttendance: 113, familiesImpacted: 42, itemsCollected: 87,
      status: 'Completed', coordinator: 'Gloria Cooper', notes: 'Great response! Collected coats from 5 local businesses.', createdAt: today(-80)
    },
    {
      id: uid(), name: 'Thanksgiving Community Dinner', type: 'Community Meal',
      date: today(-120), endDate: today(-120), time: '12:00 PM – 4:00 PM',
      location: 'Fellowship Hall & Gym', description: 'Full Thanksgiving dinner for anyone without a place to go. Served 194 people.',
      volunteersNeeded: 30, volunteersSignedUp: 36, suppliesNeeded: '',
      estimatedAttendance: 150, actualAttendance: 194, familiesImpacted: 67, itemsCollected: 0,
      status: 'Completed', coordinator: 'Dorothy White', notes: 'Record turnout. Need larger venue next year or overflow plan.', createdAt: today(-160)
    },
  ];
  Storage.saveAll('community_events', events);
  Storage.set('_comm_events_seeded', true);
})();

Navigation.register('community-events', function render(page) {
  const events = Storage.getAll('community_events').sort((a,b)=>a.date.localeCompare(b.date));
  const today  = Storage.today();
  const upcoming  = events.filter(e=>e.date>=today);
  const completed = events.filter(e=>e.status==='Completed');
  const typeColors = { 'Food Drive':'orange','Community Meal':'green','VBS':'purple','Outreach Event':'blue','Disaster Relief':'red','Other':'gray' };
  const statusColors = { Upcoming:'blue', Planning:'yellow', 'In Progress':'orange', Completed:'green', Cancelled:'gray' };

  const totalFamilies = completed.reduce((s,e)=>s+(e.familiesImpacted||0),0);
  const totalVols     = upcoming.reduce((s,e)=>s+(e.volunteersSignedUp||0),0);
  const volsNeeded    = upcoming.reduce((s,e)=>s+(e.volunteersNeeded||0),0);

  function renderCards(data) {
    const container = document.getElementById('ce-container');
    if (!container) return;
    if (!data.length) { container.innerHTML=`<div class="empty-state"><div class="empty-state-icon">🌍</div><div class="empty-state-title">No events found</div></div>`; return; }
    container.innerHTML = data.map(e => {
      const volPct = e.volunteersNeeded ? Math.min(100,Math.round((e.volunteersSignedUp/e.volunteersNeeded)*100)) : 100;
      const volShort = e.volunteersNeeded - e.volunteersSignedUp;
      return `
        <div class="card">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px;">
            <div>
              <div style="font-size:.7rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:3px;">${e.type}</div>
              <div style="font-weight:800;font-size:1rem;line-height:1.3;">${UI.esc(e.name)}</div>
            </div>
            <div style="background:var(--accent-light);color:var(--accent);border-radius:8px;padding:6px 10px;text-align:center;min-width:46px;flex-shrink:0;">
              <div style="font-size:.62rem;font-weight:700;text-transform:uppercase;">${new Date(e.date+'T00:00:00').toLocaleDateString('en-US',{month:'short'})}</div>
              <div style="font-size:1.2rem;font-weight:900;line-height:1.1;">${new Date(e.date+'T00:00:00').getDate()}</div>
            </div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
            ${UI.badge(e.status, statusColors[e.status]||'gray')}
            ${UI.badge(e.type, typeColors[e.type]||'gray')}
          </div>
          <div style="font-size:.82rem;color:var(--text-muted);margin-bottom:10px;line-height:1.5;">
            🕐 ${UI.esc(e.time)} &nbsp;·&nbsp; 📍 ${UI.esc(e.location)}
            ${e.coordinator?`<br>👤 Coordinator: ${UI.esc(e.coordinator)}`:''}
          </div>
          ${e.status !== 'Completed' ? `
            <div style="margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;font-size:.76rem;font-weight:700;margin-bottom:4px;">
                <span>Volunteers</span>
                <span style="color:${volShort>0?'var(--orange)':'var(--green)'}">
                  ${e.volunteersSignedUp}/${e.volunteersNeeded} ${volShort>0?`(${volShort} needed)`:'✓'}
                </span>
              </div>
              <div class="progress-bar-track">
                <div class="progress-bar-fill" style="width:${volPct}%;background:${volPct<50?'var(--red)':volPct<80?'var(--yellow)':'var(--green)'}"></div>
              </div>
            </div>` : `
            <div style="display:flex;gap:16px;font-size:.82rem;margin-bottom:10px;">
              ${e.actualAttendance?`<span>👥 ${e.actualAttendance} attended</span>`:''}
              ${e.familiesImpacted?`<span>🏠 ${e.familiesImpacted} families</span>`:''}
              ${e.itemsCollected?`<span>📦 ${e.itemsCollected} items</span>`:''}
            </div>`}
          ${e.suppliesNeeded && e.status!=='Completed' ? `<div style="font-size:.76rem;background:var(--surface-2);border-radius:var(--radius);padding:6px 10px;margin-bottom:10px;"><strong>Supplies needed:</strong> ${UI.esc(e.suppliesNeeded)}</div>` : ''}
          <div style="display:flex;gap:6px;padding-top:10px;border-top:1px solid var(--border);">
            <button class="btn btn-ghost btn-sm" onclick="CommEvents.view('${e.id}')">Details</button>
            <button class="btn btn-ghost btn-sm" onclick="CommEvents.edit('${e.id}')">Edit</button>
            <button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="CommEvents.remove('${e.id}')">Delete</button>
          </div>
        </div>`;
    }).join('');
  }

  page.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">🌍 Community Events Hub</h2>
        <div class="section-subtitle">Outreach events · Community meals · Service projects</div>
      </div>
      <button class="btn btn-primary" onclick="CommEvents.add()">+ New Event</button>
    </div>

    <div class="stat-grid" style="margin-bottom:24px;">
      <div class="stat-card" data-accent="blue"><div class="stat-icon">📅</div><div class="stat-value">${upcoming.length}</div><div class="stat-label">Upcoming Events</div></div>
      <div class="stat-card" data-accent="green"><div class="stat-icon">🙌</div><div class="stat-value">${totalVols}</div><div class="stat-label">Volunteers Signed Up</div><div class="stat-delta flat">${volsNeeded-totalVols > 0 ? `${volsNeeded-totalVols} still needed` : 'All filled ✓'}</div></div>
      <div class="stat-card" data-accent="orange"><div class="stat-icon">🏠</div><div class="stat-value">${totalFamilies}</div><div class="stat-label">Families Impacted</div></div>
      <div class="stat-card" data-accent="purple"><div class="stat-icon">✅</div><div class="stat-value">${completed.length}</div><div class="stat-label">Events Completed</div></div>
    </div>

    <div class="toolbar">
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" class="search-input" id="ce-search" placeholder="Search events…">
      </div>
      <select class="filter-select" id="ce-type-filter">
        <option value="">All Types</option>
        ${['Food Drive','Community Meal','VBS','Outreach Event','Disaster Relief','Other'].map(t=>`<option>${t}</option>`).join('')}
      </select>
      <select class="filter-select" id="ce-status-filter">
        <option value="">All Statuses</option>
        ${['Upcoming','Planning','In Progress','Completed','Cancelled'].map(s=>`<option>${s}</option>`).join('')}
      </select>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;" id="ce-container"></div>
  `;

  renderCards(events);

  function filtered() {
    const q  = document.getElementById('ce-search')?.value.toLowerCase()||'';
    const tp = document.getElementById('ce-type-filter')?.value||'';
    const st = document.getElementById('ce-status-filter')?.value||'';
    return events.filter(e => {
      const txt = `${e.name} ${e.type} ${e.coordinator} ${e.description}`.toLowerCase();
      return (!q||txt.includes(q)) && (!tp||e.type===tp) && (!st||e.status===st);
    });
  }
  document.getElementById('ce-search')?.addEventListener('input',()=>renderCards(filtered()));
  document.getElementById('ce-type-filter')?.addEventListener('change',()=>renderCards(filtered()));
  document.getElementById('ce-status-filter')?.addEventListener('change',()=>renderCards(filtered()));
});

const CommEvents = {
  _state: { search: '' },
  _rerender() {
    const _s = document.getElementById('ce-search');
    if (_s) CommEvents._state.search = _s.value;
    CommEvents._rerender();
    const _ns = document.getElementById('ce-search');
    if (_ns && CommEvents._state.search) { _ns.value = CommEvents._state.search; _ns.dispatchEvent(new Event('input')); }
  },
  _types: ['Food Drive','Community Meal','VBS','Outreach Event','Disaster Relief','Other'],
  _statuses: ['Planning','Upcoming','In Progress','Completed','Cancelled'],
  _form(e={}) {
    return `
      <div class="form-group"><label class="form-label">Event Name *</label><input class="form-control" id="ce-name" value="${UI.esc(e.name||'')}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Type</label>
          <select class="form-control" id="ce-type">${this._types.map(t=>`<option ${e.type===t?'selected':''}>${t}</option>`).join('')}</select>
        </div>
        <div class="form-group"><label class="form-label">Status</label>
          <select class="form-control" id="ce-status">${this._statuses.map(s=>`<option ${(e.status||'Planning')===s?'selected':''}>${s}</option>`).join('')}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Date</label><input class="form-control" id="ce-date" type="date" value="${e.date||Storage.today()}"></div>
        <div class="form-group"><label class="form-label">Time</label><input class="form-control" id="ce-time" value="${UI.esc(e.time||'')}"></div>
      </div>
      <div class="form-group"><label class="form-label">Location</label><input class="form-control" id="ce-loc" value="${UI.esc(e.location||'')}"></div>
      <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="ce-desc">${UI.esc(e.description||'')}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Volunteers Needed</label><input class="form-control" id="ce-vneed" type="number" min="0" value="${e.volunteersNeeded||0}"></div>
        <div class="form-group"><label class="form-label">Volunteers Signed Up</label><input class="form-control" id="ce-vsign" type="number" min="0" value="${e.volunteersSignedUp||0}"></div>
      </div>
      <div class="form-group"><label class="form-label">Supplies Needed</label><input class="form-control" id="ce-supplies" value="${UI.esc(e.suppliesNeeded||'')}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Est. Attendance</label><input class="form-control" id="ce-estatt" type="number" min="0" value="${e.estimatedAttendance||0}"></div>
        <div class="form-group"><label class="form-label">Actual Attendance</label><input class="form-control" id="ce-actatt" type="number" min="0" value="${e.actualAttendance||0}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Families Impacted</label><input class="form-control" id="ce-fam" type="number" min="0" value="${e.familiesImpacted||0}"></div>
        <div class="form-group"><label class="form-label">Items Collected/Given</label><input class="form-control" id="ce-items" type="number" min="0" value="${e.itemsCollected||0}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Coordinator</label><input class="form-control" id="ce-coord" value="${UI.esc(e.coordinator||'')}"></div>
      </div>
      <div class="form-group"><label class="form-label">Notes</label><textarea class="form-control" id="ce-notes">${UI.esc(e.notes||'')}</textarea></div>`;
  },
  _collect() {
    const n = id => parseInt(document.getElementById(id)?.value)||0;
    const v = id => document.getElementById(id)?.value?.trim()||'';
    return {
      name:v('ce-name'), type:v('ce-type'), status:v('ce-status'), date:v('ce-date'), time:v('ce-time'),
      location:v('ce-loc'), description:v('ce-desc'), suppliesNeeded:v('ce-supplies'),
      volunteersNeeded:n('ce-vneed'), volunteersSignedUp:n('ce-vsign'),
      estimatedAttendance:n('ce-estatt'), actualAttendance:n('ce-actatt'),
      familiesImpacted:n('ce-fam'), itemsCollected:n('ce-items'),
      coordinator:v('ce-coord'), notes:v('ce-notes'),
    };
  },
  add() {
    Modal.open({ title:'🌍 New Community Event', body:this._form(), width:'580px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-ce-btn">Save Event</button>` });
    document.getElementById('save-ce-btn').onclick = () => {
      const d=this._collect();
      if(!Validate.check([
        ['ce-name', Validate.required(d.name,'Event name')],
        ['ce-date', Validate.required(d.date,'Event date')],
      ])) return;
      Storage.insert('community_events',d); Modal.close(); Toast.success('Event added'); CommEvents._rerender();
    };
  },
  edit(id) {
    const e=Storage.findById('community_events',id); if(!e) return;
    Modal.open({ title:'Edit Event', body:this._form(e), width:'580px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-ce-btn">Save</button>` });
    document.getElementById('save-ce-btn').onclick = () => {
      Storage.update('community_events',id,this._collect()); Modal.close(); Toast.success('Updated'); CommEvents._rerender();
    };
  },
  view(id) {
    const e=Storage.findById('community_events',id); if(!e) return;
    Modal.open({ title:e.name, width:'520px', body:`
      <div style="font-size:.88rem;display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;gap:8px;flex-wrap:wrap;">${UI.badge(e.status,'blue')} ${UI.badge(e.type,'purple')}</div>
        <div>📅 <strong>${UI.fmtDate(e.date)}</strong> &nbsp;·&nbsp; 🕐 ${UI.esc(e.time)}</div>
        <div>📍 ${UI.esc(e.location)}</div>
        ${e.coordinator?`<div>👤 Coordinator: ${UI.esc(e.coordinator)}</div>`:''}
        <div style="background:var(--surface-2);border-radius:var(--radius);padding:10px;line-height:1.6;">${UI.esc(e.description||'')}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div>🙌 Volunteers: ${e.volunteersSignedUp}/${e.volunteersNeeded}</div>
          <div>👥 Attendance: ${e.actualAttendance||e.estimatedAttendance||'—'}</div>
          <div>🏠 Families: ${e.familiesImpacted||'—'}</div>
          <div>📦 Items: ${e.itemsCollected||'—'}</div>
        </div>
        ${e.suppliesNeeded?`<div><strong>Supplies:</strong> ${UI.esc(e.suppliesNeeded)}</div>`:''}
        ${e.notes?`<div><strong>Notes:</strong> ${UI.esc(e.notes)}</div>`:''}
      </div>`,
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Close</button>
              <button class="btn btn-primary" onclick="Modal.close();CommEvents.edit('${id}')">Edit</button>` });
  },
  remove(id) {
    UI.confirm('Delete this event?',()=>{ Storage.removeItem('community_events',id); Toast.success('Deleted'); CommEvents._rerender(); });
  },
};
window.CommEvents = CommEvents;

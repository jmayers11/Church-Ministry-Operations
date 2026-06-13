/* =============================================================
   events.js  —  Event Management module
   ============================================================= */

Navigation.register('events', function render(page) {
  const events  = Storage.getAll('events');
  const rsvps   = Storage.getAll('event_rsvps') || [];
  const today   = Storage.today();
  const upcoming = events.filter(e => e.date >= today).sort((a,b) => a.date.localeCompare(b.date));
  const past     = events.filter(e => e.date < today).sort((a,b) => b.date.localeCompare(a.date));

  function rsvpCount(eventId) { return rsvps.filter(r => r.eventId === eventId).length; }
  function rsvpBar(eventId, capacity) {
    if (!capacity) return '';
    const count = rsvpCount(eventId);
    const pct   = Math.min(100, Math.round((count / capacity) * 100));
    const color = pct >= 100 ? 'var(--red)' : pct >= 75 ? 'var(--orange)' : 'var(--green)';
    return `<div style="margin-top:3px;font-size:.7rem;color:var(--text-muted)">RSVP: ${count}/${capacity}
      <div style="height:4px;background:var(--border);border-radius:2px;margin-top:2px">
        <div style="height:4px;width:${pct}%;background:${color};border-radius:2px;transition:width .3s"></div>
      </div>
    </div>`;
  }

  function thIcon(key) {
    const {col,dir}=Events._sort;
    if(col!==key) return `<span style="opacity:.25;font-size:.7rem;margin-left:3px">↕</span>`;
    return `<span style="font-size:.75rem;margin-left:3px;color:var(--accent)">${dir==='asc'?'↑':'↓'}</span>`;
  }
  function th(label,key) {
    const {col,dir}=Events._sort;const active=col===key;const aSort=active?(dir==='asc'?'ascending':'descending'):'none';
    return `<th aria-sort="${aSort}" style="white-space:nowrap;${active?'color:var(--accent);':''}"><button type="button" class="sort-btn" onclick="Events.sortBy('${key}')">${label}${thIcon(key)}</button></th>`;
  }
  function renderTable(data, wrapId) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    const {col,dir}=Events._sort;
    if(col){
      data=[...data];
      const numCols=new Set(['volunteersNeeded','budget','attendance']);
      data.sort((a,b)=>{
        let av=a[col],bv=b[col];
        if(av==null||av==='') return 1; if(bv==null||bv==='') return -1;
        const cmp=numCols.has(col)?Number(av)-Number(bv):String(av).localeCompare(String(bv));
        return dir==='asc'?cmp:-cmp;
      });
    }
    if (!data.length) {
      wrap.innerHTML = `<table><tbody><tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted)">None</td></tr></tbody></table>`;
      return;
    }
    wrap.innerHTML = `<table><thead><tr>
      ${th('Event','name')}${th('Date','date')}${th('Time','time')}${th('Location','location')}
      ${th('Volunteers','volunteersNeeded')}${th('Budget','budget')}${th('Attendance','attendance')}<th>RSVP</th><th>Actions</th>
    </tr></thead><tbody>${data.map(e => `
      <tr>
        <td>
          <strong>${UI.esc(e.name)}</strong>
          ${e.recurring && e.recurring !== 'None' ? `<span class="badge badge-blue" style="margin-left:4px">${UI.esc(e.recurring)}</span>` : ''}
        </td>
        <td>${UI.fmtDate(e.date)}</td>
        <td>${UI.esc(e.time)}</td>
        <td>${UI.esc(e.location)}</td>
        <td style="text-align:center">${e.volunteersNeeded}</td>
        <td>${e.budget > 0 ? '$' + e.budget.toLocaleString() : '—'}</td>
        <td>${e.attendance > 0 ? e.attendance : '—'}</td>
        <td style="min-width:110px">
          ${e.capacity > 0
            ? rsvpBar(e.id, e.capacity)
            : `<span style="font-size:.74rem;color:var(--text-muted)">${rsvpCount(e.id)} RSVPs</span>`}
        </td>
        <td style="white-space:nowrap">
          <button class="btn btn-ghost btn-sm" onclick="Events.rsvpModal('${e.id}')">RSVPs</button>
          <button class="btn btn-ghost btn-sm" onclick="Events.edit('${e.id}')">Edit</button>
          <button class="btn btn-ghost btn-sm text-danger" onclick="Events.remove('${e.id}')">Delete</button>
        </td>
      </tr>`).join('')}</tbody></table>`;
  }

  // ── Calendar view helpers ──────────────────────────────────
  function renderCalendar() {
    const calYear  = Number(Storage.get('_ev_cal_year')  || new Date().getFullYear());
    const calMonth = Number(Storage.get('_ev_cal_month') || new Date().getMonth());
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const monthName = new Date(calYear, calMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const byDate = {};
    events.forEach(function(e){ if (!byDate[e.date]) byDate[e.date] = []; byDate[e.date].push(e); });
    const pad = function(n){ return String(n).padStart(2,'0'); };
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    let cells = '';
    // Blank cells before first day
    for (let i = 0; i < firstDay; i++) cells += '<div class="ev-cal-cell ev-cal-cell--empty"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = calYear+'-'+pad(calMonth+1)+'-'+pad(d);
      const evs = byDate[dt] || [];
      const isToday = dt === today;
      cells += '<div class="ev-cal-cell'+(isToday?' ev-cal-cell--today':'')+(evs.length?' ev-cal-cell--has-events':'')+'>'
        +'<div class="ev-cal-day">'+(isToday?'<strong>':'')+d+(isToday?'</strong>':'')+'</div>'
        +evs.slice(0,3).map(function(e){
          var evId = e.id; return '<div class="ev-cal-event" onclick="Events.edit(\'' + evId + '\')" title="' + UI.esc(e.name) + '">' + UI.esc(e.name.length > 18 ? e.name.slice(0, 16) + '…' : e.name) + '</div>';
        }).join('')
        +(evs.length>3 ? '<div class="ev-cal-more">+' + (evs.length-3) + ' more</div>' : '')
        +'</div>';
    }
    return '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">'
      +'<button class="btn btn-ghost btn-sm" aria-label="Previous month" onclick="Events._calNav(-1)"><i data-lucide="chevron-left" class="icon-xs" aria-hidden="true"></i></button>'
      +'<h3 style="font-size:var(--text-base);font-weight:800;flex:1;text-align:center;margin:0">'+monthName+'</h3>'
      +'<button class="btn btn-ghost btn-sm" aria-label="Next month" onclick="Events._calNav(1)"><i data-lucide="chevron-right" class="icon-xs" aria-hidden="true"></i></button>'
      +'<button class="btn btn-outline btn-sm" onclick="Events._calToday()">Today</button>'
      +'</div>'
      +'<div class="ev-cal-grid"><div class="ev-cal-header">'
      +dayNames.map(function(d){ return '<div class="ev-cal-dayname">'+d+'</div>'; }).join('')
      +'</div><div class="ev-cal-body">'+cells+'</div></div>';
  }

  const _evTab = Storage.get('_ev_tab') || 'upcoming';

  page.innerHTML =
    '<div class="section-header"><div>'
    +'<h2 class="section-title"><i data-lucide="calendar" class="icon-inline" aria-hidden="true"></i>Event Management</h2>'
    +'<div class="section-subtitle">'+upcoming.length+' upcoming &nbsp;&middot;&nbsp; '+past.length+' past</div>'
    +'</div>'
    +'<button class="btn btn-primary" id="add-event-btn">+ Add Event</button></div>'
    +UI.tabs([
      { id:'upcoming', label:'<i data-lucide="calendar" class="icon-inline" aria-hidden="true"></i>Upcoming', icon:'' },
      { id:'calendar', label:'<i data-lucide="grid" class="icon-inline" aria-hidden="true"></i>Calendar', icon:'' },
      { id:'past',     label:'<i data-lucide="folder" class="icon-inline" aria-hidden="true"></i>Past', icon:'' },
    ], _evTab, 'Events._setTab')
    +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:20px;">'
    +UI.kpi({ icon:'calendar', value:upcoming.length, label:'Upcoming', accent:'brand' })
    +UI.kpi({ icon:'heart-handshake', value:upcoming.reduce(function(s,e){ return s+(e.volunteersNeeded||0); },0), label:'Volunteers Needed', accent:'success' })
    +UI.kpi({ icon:'dollar-sign', value:'$'+upcoming.reduce(function(s,e){ return s+(e.budget||0); },0).toLocaleString(), label:'Total Budget', accent:'info' })
    +UI.kpi({ icon:'users', value:past.reduce(function(s,e){ return s+(e.attendance||0); },0).toLocaleString(), label:'Past Attendance', accent:'warning' })
    +'</div>'
    +'<div id="ev-content"></div>';

  function renderTabContent() {
    const el = document.getElementById('ev-content');
    if (!el) return;
    if (_evTab === 'upcoming') {
      el.innerHTML = '<div class="table-wrap" id="upcoming-table-wrap"></div>';
      renderTable(upcoming, 'upcoming-table-wrap');
    } else if (_evTab === 'calendar') {
      el.innerHTML = renderCalendar();
    } else if (_evTab === 'past') {
      el.innerHTML = '<div class="table-wrap" id="past-table-wrap"></div>';
      renderTable(past.slice(0,20), 'past-table-wrap');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  renderTabContent();

  Events._rerender = function() {
    const _today = Storage.today();
    const _all = Storage.getAll('events');
    const _tab = Storage.get('_ev_tab') || 'upcoming';
    if (_tab === 'upcoming') renderTable(_all.filter(function(e){ return e.date>=_today; }).sort(function(a,b){ return a.date.localeCompare(b.date); }), 'upcoming-table-wrap');
    else if (_tab === 'past') renderTable(_all.filter(function(e){ return e.date<_today; }).sort(function(a,b){ return b.date.localeCompare(a.date); }).slice(0,20), 'past-table-wrap');
    else renderTabContent();
  };
  Events._setTab = function(t){ Storage.set('_ev_tab',t); Navigation.navigate('events'); };
  Events._calNav = function(dir) {
    let y = Number(Storage.get('_ev_cal_year')  || new Date().getFullYear());
    let m = Number(Storage.get('_ev_cal_month') || new Date().getMonth());
    m += dir;
    if (m < 0)  { m = 11; y--; }
    if (m > 11) { m = 0;  y++; }
    Storage.set('_ev_cal_year',  y);
    Storage.set('_ev_cal_month', m);
    Navigation.navigate('events');
  };
  Events._calToday = function() {
    Storage.set('_ev_cal_year',  new Date().getFullYear());
    Storage.set('_ev_cal_month', new Date().getMonth());
    Navigation.navigate('events');
  };

  document.getElementById('add-event-btn')?.addEventListener('click', function(){ Events.add(); });
});

const Events = {
  _state: { search: '' },
  _rerender() { Events._rerender(); },
  _sort: { col: null, dir: 'asc' },
  _rerender: null,
  sortBy(col) {
    if(this._sort.col===col) this._sort.dir=this._sort.dir==='asc'?'desc':'asc';
    else { this._sort.col=col; this._sort.dir='asc'; }
    this._rerender?.();
  },
  _form(e = {}) {
    return `
      <div class="form-group"><label class="form-label">Event Name *</label><input class="form-control" id="ev-name" value="${UI.esc(e.name||'')}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Date</label><input class="form-control" id="ev-date" type="date" value="${e.date||Storage.today()}"></div>
        <div class="form-group"><label class="form-label">Time</label><input class="form-control" id="ev-time" value="${UI.esc(e.time||'')}"></div>
      </div>
      <div class="form-group"><label class="form-label">Location</label><input class="form-control" id="ev-loc" value="${UI.esc(e.location||'')}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Volunteers Needed</label><input class="form-control" id="ev-vols" type="number" min="0" value="${e.volunteersNeeded||0}"></div>
        <div class="form-group"><label class="form-label">Budget ($)</label><input class="form-control" id="ev-budget" type="number" min="0" value="${e.budget||0}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Actual Attendance</label><input class="form-control" id="ev-att" type="number" min="0" value="${e.attendance||0}"></div>
        <div class="form-group"><label class="form-label">Capacity (RSVP limit)</label><input class="form-control" id="ev-cap" type="number" min="0" placeholder="0 = unlimited" value="${e.capacity||0}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Recurring</label>
          <select class="form-control" id="ev-rec">
            ${['None','Weekly','Bi-weekly','Monthly','Annual'].map(r=>`<option ${e.recurring===r?'selected':''}>${r}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">End Date (series)</label>
          <input class="form-control" id="ev-end" type="date" value="${e.endDate||''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Reminder</label>
          <select class="form-control" id="ev-reminder">
            ${['None','Same day','1 day before','2 days before','1 week before'].map(r=>`<option ${e.reminder===r?'selected':''}>${r}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="ev-desc">${UI.esc(e.description||'')}</textarea></div>
    `;
  },
  _collect() {
    return {
      name:             document.getElementById('ev-name')?.value.trim(),
      date:             document.getElementById('ev-date')?.value,
      time:             document.getElementById('ev-time')?.value.trim(),
      location:         document.getElementById('ev-loc')?.value.trim(),
      volunteersNeeded: parseInt(document.getElementById('ev-vols')?.value) || 0,
      budget:           parseInt(document.getElementById('ev-budget')?.value) || 0,
      attendance:       parseInt(document.getElementById('ev-att')?.value) || 0,
      recurring:        document.getElementById('ev-rec')?.value,
      endDate:          document.getElementById('ev-end')?.value || '',
      reminder:         document.getElementById('ev-reminder')?.value || 'None',
      capacity:         parseInt(document.getElementById('ev-cap')?.value) || 0,
      description:      document.getElementById('ev-desc')?.value.trim(),
    };
  },
  add() {
    Modal.open({ title: 'Add Event', body: this._form(), width: '520px',
      footer: `<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
               <button class="btn btn-primary" id="save-event-btn">Add Event</button>` });
    document.getElementById('save-event-btn').onclick = () => {
      const d = this._collect();
      if (!Validate.check([
        ['ev-name', Validate.required(d.name, 'Event name')],
        ['ev-date', Validate.required(d.date, 'Event date')],
      ])) return;
      var _saved = Storage.insert('events', d);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) SupabaseDB.tableUpsert('events', _saved).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
      Modal.close(); Toast.success('Event added'); Events._rerender();
    };
  },
  edit(id) {
    const e = Storage.findById('events', id); if (!e) return;
    Modal.open({ title: 'Edit Event', body: this._form(e), width: '520px',
      footer: `<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
               ${e.recurring && e.recurring !== 'None' ? `<button class="btn btn-outline" onclick="Modal.close();Events.generateSeries('${id}')"><i data-lucide="copy-plus" class="icon-xs" aria-hidden="true"></i> Generate Series</button>` : ''}
               <button class="btn btn-primary" id="save-event-btn">Save Changes</button>` });
    document.getElementById('save-event-btn').onclick = () => {
      var _updated = Storage.update('events', id, this._collect());
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated() && _updated) SupabaseDB.tableUpsert('events', _updated).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
      Modal.close(); Toast.success('Updated'); Events._rerender();
    };
  },
  remove(id) {
    UI.confirm('Remove this event?', () => {
      Storage.removeItem('events', id);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) SupabaseDB.tableDelete('events', id).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
      Toast.success('Removed'); Events._rerender();
    });
  },
  rsvpModal(eventId) {
    const ev      = Storage.findById('events', eventId);
    if (!ev) return;
    const rsvps   = Storage.getAll('event_rsvps') || [];
    const mine    = rsvps.filter(r => r.eventId === eventId);
    const cap     = ev.capacity || 0;
    const full    = cap > 0 && mine.length >= cap;

    function listHtml() {
      if (!mine.length) return `<p style="color:var(--text-muted);text-align:center;padding:16px 0">No RSVPs yet.</p>`;
      return `<table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Status</th><th>When</th><th></th></tr></thead><tbody>
        ${mine.map(r => `<tr>
          <td>${UI.esc(r.name)}</td>
          <td>${r.email ? `<a href="mailto:${UI.esc(r.email)}" class="link-accent">${UI.esc(r.email)}</a>` : '—'}</td>
          <td>${UI.badge(r.status || 'Going', r.status === 'Going' ? 'green' : r.status === 'Maybe' ? 'yellow' : 'gray')}</td>
          <td style="font-size:.74rem;color:var(--text-muted)">${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
          <td><button class="btn btn-ghost btn-sm text-danger" onclick="Events._removeRsvp('${r.id}','${eventId}')">Remove</button></td>
        </tr>`).join('')}
      </tbody></table>`;
    }

    const body = `
      <div style="margin-bottom:8px">
        <strong>${UI.esc(ev.name)}</strong> — ${UI.fmtDate(ev.date)}
        ${cap > 0 ? `<span class="badge badge-${full ? 'danger' : 'blue'}" style="margin-left:8px">${mine.length}/${cap} RSVPs${full ? ' · FULL' : ''}</span>` : `<span class="badge badge-gray" style="margin-left:8px">${mine.length} RSVPs</span>`}
      </div>
      ${cap > 0 ? `<div style="height:6px;background:var(--border);border-radius:3px;margin-bottom:12px">
        <div style="height:6px;width:${Math.min(100,Math.round(mine.length/cap*100))}%;background:${full?'var(--red)':'var(--accent)'};border-radius:3px;transition:width .3s"></div>
      </div>` : ''}
      <div id="rsvp-list">${listHtml()}</div>
      <hr style="margin:16px 0">
      <h4 style="font-size:var(--text-sm);font-weight:700;margin-bottom:10px">Add RSVP</h4>
      ${full ? `<div class="info-box">This event is at capacity. Remove an existing RSVP to add more.</div>` : `
      <div class="form-row">
        <div class="form-group"><label class="form-label">Name *</label><input class="form-control" id="rsvp-name" placeholder="Full name"></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-control" id="rsvp-email" type="email" placeholder="optional"></div>
      </div>
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-control" id="rsvp-status">
          <option>Going</option><option>Maybe</option><option>Can't Attend</option>
        </select>
      </div>
      <button class="btn btn-primary" onclick="Events._addRsvp('${eventId}')">
        <i data-lucide="plus" class="icon-sm" aria-hidden="true"></i> Add RSVP
      </button>`}
    `;

    Modal.open({ title: `RSVPs — ${UI.esc(ev.name)}`, body, width: '600px',
      footer: `<button class="btn btn-outline" onclick="Modal.close()">Close</button>` });
    lucide.createIcons();
  },
  _addRsvp(eventId) {
    const name = document.getElementById('rsvp-name')?.value.trim();
    if (!name) { Toast.error('Name is required'); return; }
    const email  = document.getElementById('rsvp-email')?.value.trim();
    const status = document.getElementById('rsvp-status')?.value || 'Going';
    Storage.insert('event_rsvps', { eventId, name, email, status });
    Toast.success('RSVP added');
    Events._rerender();
    // Refresh the modal body
    Events.rsvpModal(eventId);
  },
  _removeRsvp(rsvpId, eventId) {
    Storage.removeItem('event_rsvps', rsvpId);
    Toast.success('RSVP removed');
    Events._rerender?.();
    Events.rsvpModal(eventId);
  },
  generateSeries(id) {
    const e = Storage.findById('events', id); if (!e || !e.recurring || e.recurring === 'None') return;
    const STEP = { 'Weekly':7, 'Bi-weekly':14, 'Monthly':null, 'Annual':null };
    const step = STEP[e.recurring];
    const endDate = e.endDate || '';
    let count = 0;
    let cur = new Date(e.date + 'T00:00:00');
    const limit = endDate ? new Date(endDate + 'T00:00:00') : new Date(cur.getTime() + 365*24*3600*1000);
    const existing = new Set(Storage.getAll('events').filter(function(x){ return x.seriesId === id; }).map(function(x){ return x.date; }));
    while (count < 52) {
      if (step) { cur.setDate(cur.getDate() + step); }
      else if (e.recurring === 'Monthly') { cur.setMonth(cur.getMonth() + 1); }
      else if (e.recurring === 'Annual') { cur.setFullYear(cur.getFullYear() + 1); }
      if (cur > limit) break;
      const dt = cur.toISOString().slice(0,10);
      if (!existing.has(dt)) {
        Storage.insert('events', Object.assign({}, e, { id: Storage.uid(), date: dt, seriesId: id, attendance: 0 }));
        count++;
      }
      if (e.recurring === 'Annual' && count >= 3) break;
    }
    Toast.success('Generated ' + count + ' future occurrence' + (count !== 1 ? 's' : ''));
    Events._rerender?.();
  },
  _setTab: null,
  _calNav: null,
  _calToday: null,
};
window.Events = Events;

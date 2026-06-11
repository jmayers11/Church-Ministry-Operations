/* =============================================================
   events.js  —  Event Management module
   ============================================================= */

Navigation.register('events', function render(page) {
  const events  = Storage.getAll('events');
  const today   = Storage.today();
  const upcoming = events.filter(e => e.date >= today).sort((a,b) => a.date.localeCompare(b.date));
  const past     = events.filter(e => e.date < today).sort((a,b) => b.date.localeCompare(a.date));

  function thIcon(key) {
    const {col,dir}=Events._sort;
    if(col!==key) return `<span style="opacity:.25;font-size:.7rem;margin-left:3px">↕</span>`;
    return `<span style="font-size:.75rem;margin-left:3px;color:var(--accent)">${dir==='asc'?'↑':'↓'}</span>`;
  }
  function th(label,key) {
    const active=Events._sort.col===key;
    return `<th style="cursor:pointer;user-select:none;white-space:nowrap;${active?'color:var(--accent);':''}" onclick="Events.sortBy('${key}')">${label}${thIcon(key)}</th>`;
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
      ${th('Volunteers','volunteersNeeded')}${th('Budget','budget')}${th('Attendance','attendance')}<th>Actions</th>
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
        <td>
          <button class="btn btn-ghost btn-sm" onclick="Events.edit('${e.id}')">Edit</button>
          <button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="Events.remove('${e.id}')">Delete</button>
        </td>
      </tr>`).join('')}</tbody></table>`;
  }

  page.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">Event Management</h2>
        <div class="section-subtitle">${upcoming.length} upcoming · ${past.length} past</div>
      </div>
      <button class="btn btn-primary" id="add-event-btn">+ Add Event</button>
    </div>

    <div class="stat-grid" style="margin-bottom:24px;">
      <div class="stat-card" data-accent="blue">
        <div class="stat-icon">📅</div>
        <div class="stat-value">${upcoming.length}</div>
        <div class="stat-label">Upcoming Events</div>
      </div>
      <div class="stat-card" data-accent="green">
        <div class="stat-icon">🙌</div>
        <div class="stat-value">${upcoming.reduce((s,e) => s + (e.volunteersNeeded||0), 0)}</div>
        <div class="stat-label">Volunteers Needed</div>
      </div>
      <div class="stat-card" data-accent="purple">
        <div class="stat-icon">💰</div>
        <div class="stat-value">$${upcoming.reduce((s,e) => s + (e.budget||0), 0).toLocaleString()}</div>
        <div class="stat-label">Total Budget</div>
      </div>
      <div class="stat-card" data-accent="orange">
        <div class="stat-icon">👥</div>
        <div class="stat-value">${past.reduce((s,e) => s + (e.attendance||0), 0).toLocaleString()}</div>
        <div class="stat-label">Total Attendance (past)</div>
      </div>
    </div>

    <!-- Upcoming Events -->
    <div style="margin-bottom:28px;">
      <h3 style="font-size:.95rem;font-weight:700;margin-bottom:12px;">📅 Upcoming Events</h3>
      <div class="table-wrap" id="upcoming-table-wrap"></div>
    </div>

    <!-- Past Events -->
    <div>
      <h3 style="font-size:.95rem;font-weight:700;margin-bottom:12px;">📁 Past Events</h3>
      <div class="table-wrap" id="past-table-wrap"></div>
    </div>
  `;

  renderTable(upcoming, 'upcoming-table-wrap');
  renderTable(past.slice(0, 10), 'past-table-wrap');
  Events._rerender = () => { renderTable(upcoming, 'upcoming-table-wrap'); renderTable(past.slice(0,10), 'past-table-wrap'); };

  document.getElementById('add-event-btn')?.addEventListener('click', () => Events.add());
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
        <div class="form-group"><label class="form-label">Recurring</label>
          <select class="form-control" id="ev-rec">
            ${['None','Weekly','Bi-weekly','Monthly','Annual'].map(r=>`<option ${e.recurring===r?'selected':''}>${r}</option>`).join('')}
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
      Storage.insert('events', d);
      Modal.close(); Toast.success('Event added'); Events._rerender();
    };
  },
  edit(id) {
    const e = Storage.findById('events', id); if (!e) return;
    Modal.open({ title: 'Edit Event', body: this._form(e), width: '520px',
      footer: `<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
               <button class="btn btn-primary" id="save-event-btn">Save Changes</button>` });
    document.getElementById('save-event-btn').onclick = () => {
      Storage.update('events', id, this._collect());
      Modal.close(); Toast.success('Updated'); Events._rerender();
    };
  },
  remove(id) {
    UI.confirm('Remove this event?', () => {
      Storage.removeItem('events', id);
      Toast.success('Removed'); Events._rerender();
    });
  },
};
window.Events = Events;

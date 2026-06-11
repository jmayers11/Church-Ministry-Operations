/* =============================================================
   visitors.js  —  Visitor Follow-Up module
   ============================================================= */

Navigation.register('visitors', function render(page) {
  const visitors = Storage.getAll('visitors');
  const statusColors = { New: 'orange', Contacted: 'blue', 'Invited Back': 'purple', Connected: 'green' };
  const statusOrder  = ['New', 'Contacted', 'Invited Back', 'Connected'];

  function thIcon(key) {
    const {col,dir}=Visitors._sort;
    if(col!==key) return `<span style="opacity:.25;font-size:.7rem;margin-left:3px">↕</span>`;
    return `<span style="font-size:.75rem;margin-left:3px;color:var(--accent)">${dir==='asc'?'↑':'↓'}</span>`;
  }
  function th(label,key) {
    const active=Visitors._sort.col===key;
    return `<th style="cursor:pointer;user-select:none;white-space:nowrap;${active?'color:var(--accent);':''}" onclick="Visitors.sortBy('${key}')">${label}${thIcon(key)}</th>`;
  }
  function renderList(data) {
    const wrap = document.getElementById('visitors-table-wrap');
    if (!wrap) return;
    const {col,dir}=Visitors._sort;
    if(col){
      data=[...data];
      data.sort((a,b)=>{
        let av=a[col],bv=b[col];
        if(av==null||av==='') return 1; if(bv==null||bv==='') return -1;
        const cmp=String(av).localeCompare(String(bv));
        return dir==='asc'?cmp:-cmp;
      });
    }
    if (!data.length) {
      wrap.innerHTML = `<table><tbody><tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">👋</div><div class="empty-state-title">No visitors recorded</div><div class="empty-state-text">Add your first visitor to start tracking follow-ups.</div></div></td></tr></tbody></table>`;
      return;
    }
    wrap.innerHTML = `<table><thead><tr>
      ${th('Name','name')}${th('Visit Date','visitDate')}${th('Contact','phone')}
      ${th('Status','followUpStatus')}${th('Assigned To','assignedTo')}${th('Notes','notes')}<th>Actions</th>
    </tr></thead><tbody>${data.map(v => `
      <tr>
        <td><strong>${UI.esc(v.name)}</strong></td>
        <td>${UI.fmtDate(v.visitDate)}<br><small style="color:var(--text-muted)">${UI.relDate(v.visitDate)}</small></td>
        <td>${UI.esc(v.phone)}<br><small style="color:var(--text-muted)">${UI.esc(v.email)}</small></td>
        <td>${UI.badge(v.followUpStatus, statusColors[v.followUpStatus] || 'gray')}</td>
        <td>${UI.esc(v.assignedTo || '—')}</td>
        <td style="max-width:180px;font-size:.8rem;color:var(--text-muted)">${UI.esc(v.notes || '')}</td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="Visitors.edit('${v.id}')">Edit</button>
          <button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="Visitors.remove('${v.id}')">Delete</button>
        </td>
      </tr>`).join('')}</tbody></table>`;
  }

  // Summary cards
  const counts = {};
  statusOrder.forEach(s => counts[s] = visitors.filter(v => v.followUpStatus === s).length);

  page.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">Visitor Follow-Up</h2>
        <div class="section-subtitle">${visitors.length} visitors on record</div>
      </div>
      <button class="btn btn-primary" id="add-visitor-btn">+ Add Visitor</button>
    </div>

    <!-- Status summary -->
    <div class="stat-grid" style="margin-bottom:20px;">
      ${statusOrder.map(s => `
        <div class="stat-card" data-accent="${s === 'New' ? 'orange' : s === 'Contacted' ? 'blue' : s === 'Invited Back' ? 'purple' : 'green'}">
          <div class="stat-value">${counts[s]}</div>
          <div class="stat-label">${s}</div>
        </div>
      `).join('')}
    </div>

    <div class="toolbar">
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" class="search-input" id="visitor-search" placeholder="Search visitors…">
      </div>
      <select class="filter-select" id="visitor-status-filter">
        <option value="">All Statuses</option>
        ${statusOrder.map(s => `<option>${s}</option>`).join('')}
      </select>
    </div>

    <div class="table-wrap" id="visitors-table-wrap"></div>
  `;

  renderList(visitors);

  function filtered() {
    const q  = document.getElementById('visitor-search')?.value.toLowerCase() || '';
    const st = document.getElementById('visitor-status-filter')?.value || '';
    return visitors.filter(v => {
      const txt = `${v.name} ${v.phone} ${v.email} ${v.assignedTo} ${v.notes}`.toLowerCase();
      return (!q || txt.includes(q)) && (!st || v.followUpStatus === st);
    });
  }

  document.getElementById('visitor-search')?.addEventListener('input', () => renderList(filtered()));
  document.getElementById('visitor-status-filter')?.addEventListener('change', () => renderList(filtered()));
  document.getElementById('add-visitor-btn')?.addEventListener('click', () => Visitors.add());
  Visitors._rerender = () => renderList(filtered());
});

const Visitors = {
  _state: { search: '' },
  _rerender() {
    const _s = document.getElementById('visitor-search');
    if (_s) Visitors._state.search = _s.value;
    Visitors._rerender();
    const _ns = document.getElementById('visitor-search');
    if (_ns && Visitors._state.search) { _ns.value = Visitors._state.search; _ns.dispatchEvent(new Event('input')); }
  },
  _sort: { col: null, dir: 'asc' },
  _rerender: null,
  sortBy(col) {
    if (this._sort.col===col) this._sort.dir=this._sort.dir==='asc'?'desc':'asc';
    else { this._sort.col=col; this._sort.dir='asc'; }
    this._rerender?.();
  },
  _form(v = {}) {
    const statuses = ['New', 'Contacted', 'Invited Back', 'Connected'];
    const vols = Storage.getAll('volunteers').map(v => v.name);
    return `
      <div class="form-group"><label class="form-label">Visitor Name *</label><input class="form-control" id="v-name" value="${UI.esc(v.name||'')}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Visit Date</label><input class="form-control" id="v-date" type="date" value="${v.visitDate||Storage.today()}"></div>
        <div class="form-group"><label class="form-label">Follow-Up Status</label>
          <select class="form-control" id="v-status">${statuses.map(s=>`<option ${v.followUpStatus===s?'selected':''}>${s}</option>`).join('')}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Phone</label><input class="form-control" id="v-phone" value="${UI.esc(v.phone||'')}"></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-control" id="v-email" type="email" value="${UI.esc(v.email||'')}"></div>
      </div>
      <div class="form-group"><label class="form-label">Assigned Volunteer</label>
        <select class="form-control" id="v-assigned">
          <option value="">— Unassigned —</option>
          ${vols.map(n=>`<option ${v.assignedTo===n?'selected':''}>${UI.esc(n)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Notes</label><textarea class="form-control" id="v-notes">${UI.esc(v.notes||'')}</textarea></div>
    `;
  },
  _collect() {
    return {
      name:            document.getElementById('v-name')?.value.trim(),
      visitDate:       document.getElementById('v-date')?.value,
      followUpStatus:  document.getElementById('v-status')?.value,
      phone:           document.getElementById('v-phone')?.value.trim(),
      email:           document.getElementById('v-email')?.value.trim(),
      assignedTo:      document.getElementById('v-assigned')?.value,
      notes:           document.getElementById('v-notes')?.value.trim(),
    };
  },
  add() {
    Modal.open({ title: 'Add Visitor', body: this._form(), width: '520px',
      footer: `<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-visitor-btn">Add Visitor</button>` });
    document.getElementById('save-visitor-btn').onclick = () => {
      const d = this._collect();
      if (!Validate.check([
        ['v-name',  Validate.required(d.name, 'Visitor name')],
        ['v-email', Validate.email(d.email)],
      ])) return;
      Storage.insert('visitors', d);
      Modal.close(); Toast.success('Visitor added'); Visitors._rerender();
    };
  },
  edit(id) {
    const v = Storage.findById('visitors', id); if (!v) return;
    Modal.open({ title: 'Edit Visitor', body: this._form(v), width: '520px',
      footer: `<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
               <button class="btn btn-primary" id="save-visitor-btn">Save Changes</button>` });
    document.getElementById('save-visitor-btn').onclick = () => {
      Storage.update('visitors', id, this._collect());
      Modal.close(); Toast.success('Updated'); Visitors._rerender();
    };
  },
  remove(id) {
    UI.confirm('Remove this visitor record?', () => {
      Storage.removeItem('visitors', id);
      Toast.success('Removed'); Visitors._rerender();
    });
  },
};
window.Visitors = Visitors;

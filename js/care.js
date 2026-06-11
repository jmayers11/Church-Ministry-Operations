/* =============================================================
   care.js  —  Enhanced Care Ministry Module
   Hospital · Shut-Ins · Widow Care · Counseling · Meal Trains · Home Visits
   ============================================================= */

(function seedCareEnhanced() {
  if (Storage.get('_care_v2_seeded')) return;
  const uid = Storage.uid, today = Storage.today;
  const records = [
    { id: uid(), name: 'John & Mary Harris',    type: 'Hospital Visit',     date: today(-3),  nextDate: today(4),  status: 'Active',    assignedTo: 'Pastor Wilson',   lastContact: today(-3),  notes: 'John recovering from hip surgery. Room 214, St. Francis Hospital. Prayed together. Mary needs support too — connecting her with women\'s group.',    priority: 'High',   createdAt: today(-3) },
    { id: uid(), name: 'Patricia Davis',         type: 'Shut-In Member',     date: today(-10), nextDate: today(5),  status: 'Active',    assignedTo: 'Dorothy White',   lastContact: today(-10), notes: 'Monthly home visit. Brought communion. Patricia has difficulty walking now. Discussed Meals on Wheels program.',                              priority: 'Medium', createdAt: today(-10) },
    { id: uid(), name: 'Dorothy White',          type: 'Widow Care',         date: today(-5),  nextDate: today(25), status: 'Active',    assignedTo: 'Helen Robinson',  lastContact: today(-5),  notes: 'Widow of 3 years. Very involved in church but has hard evenings. Weekly phone call arranged. Doing well overall.',                              priority: 'Medium', createdAt: today(-30) },
    { id: uid(), name: 'The Murphy Family',      type: 'Counseling',         date: today(2),   nextDate: today(16), status: 'Scheduled', assignedTo: 'Pastor Wilson',   lastContact: today(-12), notes: 'Marriage counseling session #4. Progress is encouraging. Homework: communication exercises from session 3.',                                    priority: 'High',   createdAt: today(-40) },
    { id: uid(), name: 'Greg Foster',            type: 'Mentoring',          date: today(5),   nextDate: today(19), status: 'Scheduled', assignedTo: 'David Martinez',  lastContact: today(-9),  notes: 'Monthly discipleship meetup. Greg exploring faith questions. Recommended "Mere Christianity."',                                                 priority: 'Medium', createdAt: today(-30) },
    { id: uid(), name: 'Robert & June Hall',     type: 'Welcome Visit',      date: today(1),   nextDate: null,      status: 'Scheduled', assignedTo: 'Helen Robinson',  lastContact: null,       notes: 'New visitors — welcome basket delivery. First home visit.',                                                                                      priority: 'Medium', createdAt: today(-1) },
    { id: uid(), name: 'Megan Murphy',           type: 'Meal Train',         date: today(-2),  nextDate: today(5),  status: 'Active',    assignedTo: 'Carol Clark',     lastContact: today(-2),  notes: 'Megan recovering from surgery. Meal train organized — 8 families signed up for 2 weeks of dinners. Coordinator: Carol Clark.',                  priority: 'Medium', createdAt: today(-5) },
    { id: uid(), name: 'Raymond Torres',         type: 'Hospital Visit',     date: today(-15), nextDate: null,      status: 'Completed', assignedTo: 'Pastor Wilson',   lastContact: today(-15), notes: 'Visited pre-surgery. Prayed and offered communion. Family grateful. Sent follow-up card.',                                                      priority: 'High',   createdAt: today(-15) },
    { id: uid(), name: 'Frank & Maria Rivera',   type: 'Home Visit',         date: today(-8),  nextDate: today(22), status: 'Active',    assignedTo: 'Michael Thompson',lastContact: today(-8),  notes: 'Frank dealing with job loss. Maria struggling with anxiety. Provided benevolence referral and connected with small group.',                     priority: 'High',   createdAt: today(-8) },
    { id: uid(), name: 'Linda & Bill Monroe',    type: 'Shut-In Member',     date: today(-25), nextDate: today(-4), status: 'Overdue',   assignedTo: 'Dorothy White',   lastContact: today(-25), notes: 'Bill has dementia. Linda is his full-time caregiver. Quarterly visit — overdue. Need to reschedule.',                                          priority: 'High',   createdAt: today(-60) },
    { id: uid(), name: 'Sarah Chen',             type: 'Grief Support',      date: today(-1),  nextDate: today(13), status: 'Active',    assignedTo: 'Pastor Wilson',   lastContact: today(-1),  notes: 'Lost her mother 3 weeks ago. Grief support sessions started. Connected with grief share group starting next month.',                           priority: 'High',   createdAt: today(-5) },
    { id: uid(), name: 'Marcus Lee',             type: 'Counseling',         date: today(7),   nextDate: null,      status: 'Scheduled', assignedTo: 'Pastor Wilson',   lastContact: today(-5),  notes: 'First counseling session. Personal/spiritual struggles. Referred by small group leader.',                                                       priority: 'Medium', createdAt: today(-3) },
  ];
  Storage.saveAll('care', records);
  Storage.set('_care_v2_seeded', true);
})();

Navigation.register('care', function render(page) {
  const records = Storage.getAll('care').sort((a,b) => {
    const order = {Overdue:0,Active:1,Scheduled:2,Completed:3};
    return (order[a.status]??4)-(order[b.status]??4) || a.date.localeCompare(b.date);
  });
  const today = Storage.today();
  const types = ['Hospital Visit','Shut-In Member','Widow Care','Counseling','Mentoring','Welcome Visit','Meal Train','Home Visit','Grief Support','Benevolence','Other'];
  const statusColors = { Active:'blue', Scheduled:'purple', Completed:'green', Overdue:'red', Cancelled:'gray' };
  const priorityColors = { High:'red', Medium:'yellow', Low:'blue' };

  const overdue = records.filter(r => r.status === 'Overdue' || (r.nextDate && r.nextDate < today && r.status === 'Active'));
  const upcoming7 = records.filter(r => r.nextDate && r.nextDate >= today && r.nextDate <= Storage.today(7));
  const active = records.filter(r => r.status === 'Active' || r.status === 'Scheduled');

  function thIcon(key) {
    const {col,dir}=CareMin._sort;
    if(col!==key) return `<span style="opacity:.25;font-size:.7rem;margin-left:3px">↕</span>`;
    return `<span style="font-size:.75rem;margin-left:3px;color:var(--accent)">${dir==='asc'?'↑':'↓'}</span>`;
  }
  function th(label,key) {
    const active=CareMin._sort.col===key;
    return `<th style="cursor:pointer;user-select:none;white-space:nowrap;${active?'color:var(--accent);':''}" onclick="CareMin.sortBy('${key}')">${label}${thIcon(key)}</th>`;
  }
  function renderTable(data) {
    const wrap = document.getElementById('care-table-wrap');
    if (!wrap) return;
    const {col,dir}=CareMin._sort;
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
      wrap.innerHTML = `<table><tbody><tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">❤️</div><div class="empty-state-title">No care records found</div></div></td></tr></tbody></table>`;
      return;
    }
    wrap.innerHTML = `<table><thead><tr>
      ${th('Person','name')}${th('Type','type')}${th('Last Contact','lastContact')}
      ${th('Next Follow-Up','nextDate')}${th('Status','status')}${th('Assigned To','assignedTo')}<th>Actions</th>
    </tr></thead><tbody>${data.map(r => {
      const isOverdue = r.status === 'Overdue' || (r.nextDate && r.nextDate < today && r.status === 'Active');
      return `
        <tr style="${isOverdue?'background:rgba(239,68,68,.06)':''}">
          <td>
            <strong>${UI.esc(r.name)}</strong>
            ${isOverdue && r.status!=='Overdue'?'<span class="badge badge-red" style="margin-left:6px">Follow-Up Overdue</span>':''}
            <br><span class="badge badge-${priorityColors[r.priority]||'gray'}" style="margin-top:3px">${r.priority||'Medium'}</span>
          </td>
          <td><span class="badge badge-gray">${UI.esc(r.type)}</span></td>
          <td>${r.lastContact ? UI.fmtDate(r.lastContact) : '<span style="color:var(--text-muted)">—</span>'}</td>
          <td style="color:${r.nextDate&&r.nextDate<today?'var(--red)':'var(--text-muted)'}">
            ${r.nextDate ? UI.fmtDate(r.nextDate) + '<br><small>' + UI.relDate(r.nextDate) + '</small>' : '—'}
          </td>
          <td>${UI.badge(r.status, statusColors[r.status]||'gray')}</td>
          <td style="font-size:.8rem;color:var(--text-muted)">${UI.esc(r.assignedTo||'—')}</td>
          <td>
            <button class="btn btn-ghost btn-sm" onclick="CareMin.view('${r.id}')">View</button>
            <button class="btn btn-ghost btn-sm" onclick="CareMin.edit('${r.id}')">Edit</button>
            <button class="btn btn-ghost btn-sm" style="color:var(--red)" aria-label="Remove care record" onclick="CareMin.remove('${r.id}')">✕</button>
          </td>
        </tr>`;
    }).join('')}</tbody></table>`;
  }

  page.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">❤️ Care Ministry</h2>
        <div class="section-subtitle">Pastoral care · Visits · Counseling · Meal trains</div>
      </div>
      <button class="btn btn-primary" onclick="CareMin.add()">+ Add Care Record</button>
    </div>

    <!-- Overdue Alert -->
    ${overdue.length ? `
      <div class="alert-banner alert-banner-red">
        🚨 <strong>${overdue.length} overdue follow-up${overdue.length>1?'s':''}:</strong>
        ${overdue.map(r=>`<a href="#" onclick="CareMin.edit('${r.id}')" style="color:var(--red);font-weight:700">${UI.esc(r.name)}</a>`).join(', ')}
      </div>` : ''}

    <!-- Stat Cards -->
    <div class="stat-grid" style="margin-bottom:24px;">
      <div class="stat-card" data-accent="blue"><div class="stat-icon">❤️</div><div class="stat-value">${active.length}</div><div class="stat-label">Active Care Cases</div></div>
      <div class="stat-card" data-accent="red"><div class="stat-icon">🚨</div><div class="stat-value">${overdue.length}</div><div class="stat-label">Overdue Follow-Ups</div><div class="stat-delta ${overdue.length?'down':'up'}">${overdue.length?'Needs attention':'All current ✓'}</div></div>
      <div class="stat-card" data-accent="purple"><div class="stat-icon">📅</div><div class="stat-value">${upcoming7.length}</div><div class="stat-label">Due This Week</div></div>
      <div class="stat-card" data-accent="orange"><div class="stat-icon">🏥</div><div class="stat-value">${records.filter(r=>r.type==='Hospital Visit').length}</div><div class="stat-label">Hospital Visits</div></div>
      <div class="stat-card" data-accent="green"><div class="stat-icon">✅</div><div class="stat-value">${records.filter(r=>r.status==='Completed').length}</div><div class="stat-label">Completed</div></div>
      <div class="stat-card" data-accent="yellow"><div class="stat-icon">🍲</div><div class="stat-value">${records.filter(r=>r.type==='Meal Train').length}</div><div class="stat-label">Meal Trains</div></div>
    </div>

    <!-- Due This Week Quick Panel -->
    ${upcoming7.length ? `
      <div class="card" style="margin-bottom:24px;border-left:3px solid var(--accent)">
        <div class="card-header"><span class="card-title">📅 Due This Week</span></div>
        <div>
          ${upcoming7.map(r=>`
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);">
              <div>
                <strong style="font-size:.88rem">${UI.esc(r.name)}</strong> — <span class="badge badge-gray">${UI.esc(r.type)}</span>
                <div style="font-size:.76rem;color:var(--text-muted)">👤 ${UI.esc(r.assignedTo||'Unassigned')} · ${UI.fmtDate(r.nextDate)}</div>
              </div>
              <button class="btn btn-ghost btn-sm" onclick="CareMin.edit('${r.id}')">Update</button>
            </div>`).join('')}
        </div>
      </div>` : ''}

    <!-- Full Table -->
    <div class="toolbar">
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" class="search-input" id="care-search" placeholder="Search by name, type, volunteer…">
      </div>
      <select class="filter-select" id="care-type-filter">
        <option value="">All Types</option>
        ${types.map(t=>`<option>${t}</option>`).join('')}
      </select>
      <select class="filter-select" id="care-status-filter">
        <option value="">All Statuses</option>
        ${['Active','Scheduled','Completed','Overdue','Cancelled'].map(s=>`<option>${s}</option>`).join('')}
      </select>
    </div>

    <div class="table-wrap" id="care-table-wrap"></div>
  `;

  function filtered() {
    const q  = document.getElementById('care-search')?.value.toLowerCase()||'';
    const tp = document.getElementById('care-type-filter')?.value||'';
    const st = document.getElementById('care-status-filter')?.value||'';
    return records.filter(r => {
      const txt = `${r.name} ${r.type} ${r.assignedTo} ${r.notes}`.toLowerCase();
      return (!q||txt.includes(q)) && (!tp||r.type===tp) && (!st||r.status===st);
    });
  }
  renderTable(records);
  document.getElementById('care-search')?.addEventListener('input', ()=>renderTable(filtered()));
  document.getElementById('care-type-filter')?.addEventListener('change', ()=>renderTable(filtered()));
  document.getElementById('care-status-filter')?.addEventListener('change', ()=>renderTable(filtered()));
  CareMin._rerender = () => renderTable(filtered());
});

const CareMin = {
  _sort: { col: null, dir: 'asc' },
  _rerender: null,
  sortBy(col) {
    if(this._sort.col===col) this._sort.dir=this._sort.dir==='asc'?'desc':'asc';
    else { this._sort.col=col; this._sort.dir='asc'; }
    this._rerender?.();
  },
  _types: ['Hospital Visit','Shut-In Member','Widow Care','Counseling','Mentoring','Welcome Visit','Meal Train','Home Visit','Grief Support','Benevolence','Other'],
  _form(r={}) {
    const vols = [...new Set([...Storage.getAll('volunteers').map(v=>v.name), 'Pastor Wilson'])];
    return `
      <div class="form-group"><label class="form-label">Person / Family Name *</label>
        <input class="form-control" id="cr-name" value="${UI.esc(r.name||'')}">
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Care Type</label>
          <select class="form-control" id="cr-type">${this._types.map(t=>`<option ${r.type===t?'selected':''}>${t}</option>`).join('')}</select>
        </div>
        <div class="form-group"><label class="form-label">Priority</label>
          <select class="form-control" id="cr-priority">
            ${['High','Medium','Low'].map(p=>`<option ${(r.priority||'Medium')===p?'selected':''}>${p}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Status</label>
          <select class="form-control" id="cr-status">
            ${['Active','Scheduled','Completed','Overdue','Cancelled'].map(s=>`<option ${(r.status||'Active')===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Assigned To</label>
          <select class="form-control" id="cr-assigned">
            <option value="">— Unassigned —</option>
            ${vols.map(v=>`<option ${r.assignedTo===v?'selected':''}>${UI.esc(v)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Last Contact Date</label>
          <input class="form-control" id="cr-last" type="date" value="${r.lastContact||r.date||Storage.today()}">
        </div>
        <div class="form-group"><label class="form-label">Next Follow-Up Date</label>
          <input class="form-control" id="cr-next" type="date" value="${r.nextDate||''}">
        </div>
      </div>
      <div class="form-group"><label class="form-label">Notes / Observations</label>
        <textarea class="form-control" id="cr-notes" style="min-height:100px">${UI.esc(r.notes||'')}</textarea>
      </div>`;
  },
  _collect() {
    return {
      name:        document.getElementById('cr-name')?.value.trim(),
      type:        document.getElementById('cr-type')?.value,
      priority:    document.getElementById('cr-priority')?.value,
      status:      document.getElementById('cr-status')?.value,
      assignedTo:  document.getElementById('cr-assigned')?.value,
      lastContact: document.getElementById('cr-last')?.value,
      date:        document.getElementById('cr-last')?.value,
      nextDate:    document.getElementById('cr-next')?.value||null,
      notes:       document.getElementById('cr-notes')?.value.trim(),
    };
  },
  add() {
    Modal.open({ title:'❤️ Add Care Record', body:this._form(), width:'540px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-care-btn">Save</button>` });
    document.getElementById('save-care-btn').onclick = () => {
      const d=this._collect();
      if(!Validate.check([
        ['cr-name', Validate.required(d.name,'Person/family name')],
      ])) return;
      Storage.insert('care',d); Modal.close(); Toast.success('Care record added'); CareMin._rerender();
    };
  },
  edit(id) {
    const r=Storage.findById('care',id); if(!r) return;
    Modal.open({ title:'Edit Care Record', body:this._form(r), width:'540px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-care-btn">Save Changes</button>` });
    document.getElementById('save-care-btn').onclick = () => {
      Storage.update('care',id,this._collect()); Modal.close(); Toast.success('Updated'); CareMin._rerender();
    };
  },
  view(id) {
    const r=Storage.findById('care',id); if(!r) return;
    Modal.open({ title:r.name, width:'500px', body:`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:.88rem;margin-bottom:14px;">
        <div><div style="color:var(--text-muted);font-size:.72rem;font-weight:700;text-transform:uppercase">Type</div><div>${r.type}</div></div>
        <div><div style="color:var(--text-muted);font-size:.72rem;font-weight:700;text-transform:uppercase">Status</div><div>${r.status}</div></div>
        <div><div style="color:var(--text-muted);font-size:.72rem;font-weight:700;text-transform:uppercase">Priority</div><div>${r.priority}</div></div>
        <div><div style="color:var(--text-muted);font-size:.72rem;font-weight:700;text-transform:uppercase">Priority</div><div>${r.priority||'—'}</div></div>
        <div><div style="color:var(--text-muted);font-size:.72rem;font-weight:700;text-transform:uppercase">Assigned To</div><div>${r.assignedTo||'—'}</div></div>
        <div><div style="color:var(--text-muted);font-size:.72rem;font-weight:700;text-transform:uppercase">Last Contact</div><div>${r.lastContact?UI.fmtDate(r.lastContact):'—'}</div></div>
        <div><div style="color:var(--text-muted);font-size:.72rem;font-weight:700;text-transform:uppercase">Next Date</div><div>${r.nextDate?UI.fmtDate(r.nextDate):'—'}</div></div>
      </div>
      ${r.notes ? `<div style="border-top:1px solid var(--border);padding-top:12px;font-size:.87rem;">${UI.esc(r.notes)}</div>` : ''}
    `,
    footer:`<button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="Modal.close();CareMin.remove('${id}')">Delete</button>
            <button class="btn btn-outline" onclick="Modal.close()">Close</button>
            <button class="btn btn-primary" onclick="Modal.close();CareMin.edit('${id}')">Edit</button>`});
  },
  remove(id) {
    UI.confirm('Remove this care record?', () => {
      Storage.removeItem('care', id); Toast.success('Removed'); CareMin._rerender();
    });
  },
  exportCSV() {
    const rows = [['Name','Type','Priority','Status','Assigned To','Last Contact','Next Date','Notes']];
    Storage.getAll('care').forEach(r => rows.push([r.name,r.type,r.priority,r.status,r.assignedTo||'',r.lastContact||'',r.nextDate||'',r.notes||'']));
    const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='care-records.csv'; a.click();
    Toast.success('Exported');
  
  },
};
window.CareMin = CareMin;

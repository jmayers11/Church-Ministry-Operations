/* =============================================================
   family-assistance.js  —  Family Assistance Tracker
   ============================================================= */

(function seedFamilyAssistance() {
  if (Storage.get('_fam_assist_seeded')) return;
  const uid = Storage.uid, today = Storage.today;
  const families = [
    { id: uid(), name: 'Rodriguez Family',    phone: '(217) 555-0301', email: 'rodriguez@email.com', address: '44 Birch St',     householdSize: 5, assistanceType: 'Food',              dateRequested: today(-3),  dateAssisted: today(-2),  status: 'Completed',      followUpNeeded: true,  followUpDate: today(5),  assignedTo: 'Nancy Garcia',    notes: 'Family of 5. Dad recently laid off. Provided 2-week food supply and connected with employment resources.', createdAt: today(-3) },
    { id: uid(), name: 'Williams, Janet',      phone: '(217) 555-0302', email: 'jwilliams@email.com', address: '129 Oak Ave',    householdSize: 1, assistanceType: 'Utility Bills',     dateRequested: today(-7),  dateAssisted: today(-5),  status: 'Completed',      followUpNeeded: true,  followUpDate: today(21), assignedTo: 'Gloria Cooper',  notes: 'Elderly widow on fixed income. Paid electric bill of $187. Will check in monthly.', createdAt: today(-7) },
    { id: uid(), name: 'Patel Family',         phone: '(217) 555-0303', email: 'patel.fam@email.com', address: '220 Cedar Rd',  householdSize: 4, assistanceType: 'Food',              dateRequested: today(-1),  dateAssisted: null,        status: 'In Progress',    followUpNeeded: false, followUpDate: '',        assignedTo: 'Nancy Garcia',    notes: 'Recently lost home to fire. Connecting with Red Cross. Food pantry bag delivered today.', createdAt: today(-1) },
    { id: uid(), name: 'Thompson, Marcus',     phone: '(217) 555-0304', email: '',                    address: '67 Spruce Ln',  householdSize: 2, assistanceType: 'Rent Assistance',   dateRequested: today(-14), dateAssisted: today(-12), status: 'Completed',      followUpNeeded: true,  followUpDate: today(16), assignedTo: 'Michael Thompson',notes: 'One month rent covered through benevolence fund. Working with Deacon Board for ongoing support plan.', createdAt: today(-14) },
    { id: uid(), name: 'Chen, Li & Family',    phone: '(217) 555-0305', email: 'lichen@email.com',    address: '85 Maple Ct',   householdSize: 6, assistanceType: 'Food',              dateRequested: today(-5),  dateAssisted: today(-4),  status: 'Completed',      followUpNeeded: false, followUpDate: '',        assignedTo: 'Nancy Garcia',    notes: 'Large family. Received full pantry bag. Mother speaks limited English — Carlos Garcia assisted.', createdAt: today(-5) },
    { id: uid(), name: 'Brooks, Tina',         phone: '(217) 555-0306', email: 'tbrooks@email.com',   address: '31 Aspen Dr',   householdSize: 3, assistanceType: 'Clothing',          dateRequested: today(-2),  dateAssisted: null,        status: 'New',            followUpNeeded: false, followUpDate: '',        assignedTo: '',               notes: 'Single mom, 2 kids ages 4 and 7. Needs winter clothing. Church clothing closet can help.', createdAt: today(-2) },
    { id: uid(), name: 'Davis, Robert',        phone: '(217) 555-0307', email: 'rdavis@email.com',    address: '102 Elm St',    householdSize: 1, assistanceType: 'Transportation',    dateRequested: today(-10), dateAssisted: today(-8),  status: 'Completed',      followUpNeeded: false, followUpDate: '',        assignedTo: 'Brian Taylor',   notes: 'Needed rides to medical appointments for 2 weeks post-surgery. Volunteer driver arranged.', createdAt: today(-10) },
    { id: uid(), name: 'Reyes Family',         phone: '(217) 555-0308', email: 'reyes.fam@email.com', address: '55 Walnut Blvd',householdSize: 7, assistanceType: 'Emergency Aid',     dateRequested: today(-1),  dateAssisted: null,        status: 'New',            followUpNeeded: false, followUpDate: '',        assignedTo: '',               notes: 'House fire last night. Family displaced. Need immediate emergency assistance — coordinating with Red Cross.', createdAt: today(-1) },
    { id: uid(), name: 'Montgomery, Gloria',   phone: '(217) 555-0309', email: '',                    address: '77 Pine St',    householdSize: 2, assistanceType: 'Food',              dateRequested: today(-20), dateAssisted: today(-19), status: 'Completed',      followUpNeeded: true,  followUpDate: today(-5), assignedTo: 'Nancy Garcia',   notes: 'Recurring need. Visits pantry monthly. Grandmother caring for grandchild.', createdAt: today(-20) },
    { id: uid(), name: 'Harper Family',        phone: '(217) 555-0310', email: 'harpers@email.com',   address: '210 Hickory Rd',householdSize: 4, assistanceType: 'Utility Bills',     dateRequested: today(-4),  dateAssisted: today(-3),  status: 'Follow-Up',      followUpNeeded: true,  followUpDate: today(10), assignedTo: 'Gloria Cooper',  notes: 'Gas shutoff notice. Paid $215 to utility company. Family in financial counseling through church.', createdAt: today(-4) },
  ];
  Storage.saveAll('family_assistance', families);
  Storage.set('_fam_assist_seeded', true);
})();

Navigation.register('family-assistance', function render(page) {
  const families = Storage.getAll('family_assistance').sort((a,b) => b.dateRequested.localeCompare(a.dateRequested));
  const today = Storage.today();

  const statusColors = { New:'orange', 'In Progress':'blue', Completed:'green', 'Follow-Up':'purple', Cancelled:'gray' };
  const typeColors   = { Food:'green', 'Utility Bills':'blue', 'Rent Assistance':'purple', Transportation:'orange', 'Emergency Aid':'red', Clothing:'yellow', Other:'gray' };
  const assistTypes  = ['Food','Utility Bills','Rent Assistance','Transportation','Emergency Aid','Clothing','Other'];

  const byStatus = status => families.filter(f => f.status === status);
  const overdueFollowup = families.filter(f => f.followUpNeeded && f.followUpDate && f.followUpDate < today && f.status !== 'Completed');

  function thIcon(key){const {col,dir}=FamilyAid._sort;if(col!==key)return`<span style="opacity:.25;font-size:.7rem;margin-left:3px">↕</span>`;return`<span style="font-size:.75rem;margin-left:3px;color:var(--accent)">${dir==='asc'?'↑':'↓'}</span>`;}
  function th(label,key){const active=FamilyAid._sort.col===key;return`<th style="cursor:pointer;user-select:none;white-space:nowrap;${active?'color:var(--accent);':''}" onclick="FamilyAid.sortBy('${key}')">${label}${thIcon(key)}</th>`;}
  function renderTable(data) {
    const wrap = document.getElementById('fa-table-wrap');
    if (!wrap) return;
    const {col,dir}=FamilyAid._sort;
    if(col){
      data=[...data];
      data.sort((a,b)=>{
        let av=a[col],bv=b[col];
        if(av==null||av==='')return 1;if(bv==null||bv==='')return -1;
        const cmp=String(av).localeCompare(String(bv));return dir==='asc'?cmp:-cmp;
      });
    }
    if (!data.length) {
      wrap.innerHTML = `<table><tbody><tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">🏠</div><div class="empty-state-title">No records found</div></div></td></tr></tbody></table>`;
      return;
    }
    wrap.innerHTML = `<table><thead><tr>
      ${th('Family / Person','name')}${th('Type','assistanceType')}${th('Requested','dateRequested')}${th('Assisted','dateAssisted')}
      ${th('Status','status')}${th('Follow-Up','followUpDate')}${th('Assigned To','assignedTo')}<th>Actions</th>
    </tr></thead><tbody>${data.map(f => `
      <tr>
        <td>
          <strong>${UI.esc(f.name)}</strong>
          ${overdueFollowup.find(x=>x.id===f.id) ? '<span class="badge badge-red" style="margin-left:6px">Overdue</span>' : ''}
          <br><small style="color:var(--text-muted)">👥 ${f.householdSize} · ${UI.esc(f.phone||'—')}</small>
        </td>
        <td>${UI.badge(f.assistanceType, typeColors[f.assistanceType]||'gray')}</td>
        <td>${UI.fmtDate(f.dateRequested)}</td>
        <td>${f.dateAssisted ? UI.fmtDate(f.dateAssisted) : '<span style="color:var(--text-muted)">—</span>'}</td>
        <td>${UI.badge(f.status, statusColors[f.status]||'gray')}</td>
        <td>
          ${f.followUpNeeded
            ? `<span style="color:${f.followUpDate && f.followUpDate < today ? 'var(--red)' : 'var(--text-muted)'}">
                ${f.followUpDate ? UI.fmtDate(f.followUpDate) : 'Needed'}</span>`
            : '<span style="color:var(--text-muted)">—</span>'}
        </td>
        <td style="font-size:.8rem;color:var(--text-muted);max-width:180px">${UI.esc(f.assignedTo||'—')}</td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="FamilyAid.view('${f.id}')">View</button>
          <button class="btn btn-ghost btn-sm" onclick="FamilyAid.edit('${f.id}')">Edit</button>
          <button class="btn btn-ghost btn-sm" style="color:var(--red)" aria-label="Remove record" onclick="FamilyAid.remove('${f.id}')">✕</button>
        </td>
      </tr>`).join('')}</tbody></table>`;
  }

  page.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">🏠 Family Assistance Tracker</h2>
        <div class="section-subtitle">Track families served and follow-up needs</div>
      </div>
      <button class="btn btn-primary" onclick="FamilyAid.add()">+ New Request</button>
    </div>

    <!-- Overdue alert -->
    ${overdueFollowup.length ? `
      <div class="alert-banner alert-banner-yellow">
        ⚠️ <strong>${overdueFollowup.length} overdue follow-up${overdueFollowup.length>1?'s':''}:</strong>
        ${overdueFollowup.map(f=>`<a href="#" onclick="FamilyAid.edit('${f.id}')" style="color:var(--accent)">${UI.esc(f.name)}</a>`).join(', ')}
      </div>` : ''}

    <!-- Stat Cards -->
    <div class="stat-grid" style="margin-bottom:24px;">
      <div class="stat-card" data-accent="blue"><div class="stat-icon">🏠</div><div class="stat-value">${families.length}</div><div class="stat-label">Total Families</div></div>
      <div class="stat-card" data-accent="orange"><div class="stat-icon">🆕</div><div class="stat-value">${byStatus('New').length}</div><div class="stat-label">New Requests</div></div>
      <div class="stat-card" data-accent="blue"><div class="stat-icon">⏳</div><div class="stat-value">${byStatus('In Progress').length}</div><div class="stat-label">In Progress</div></div>
      <div class="stat-card" data-accent="green"><div class="stat-icon">✅</div><div class="stat-value">${byStatus('Completed').length}</div><div class="stat-label">Completed</div></div>
      <div class="stat-card" data-accent="purple"><div class="stat-icon">🔔</div><div class="stat-value">${families.filter(f=>f.followUpNeeded).length}</div><div class="stat-label">Follow-Ups Needed</div></div>
      <div class="stat-card" data-accent="red"><div class="stat-icon">⚠️</div><div class="stat-value">${overdueFollowup.length}</div><div class="stat-label">Overdue Follow-Ups</div></div>
    </div>

    <!-- Assistance Type Breakdown -->
    <div class="card" style="margin-bottom:24px;">
      <div class="card-header"><span class="card-title">Assistance by Type</span></div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;">
        ${assistTypes.map(type => {
          const count = families.filter(f=>f.assistanceType===type).length;
          if (!count) return '';
          return `<div style="background:var(--surface-2);border-radius:var(--radius);padding:10px 16px;text-align:center;min-width:90px;">
            <div style="font-size:1.4rem;font-weight:800;color:var(--accent)">${count}</div>
            <div style="font-size:.76rem;font-weight:700;color:var(--text-muted)">${type}</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- Table -->
    <div class="toolbar">
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" class="search-input" id="fa-search" placeholder="Search families…">
      </div>
      <select class="filter-select" id="fa-status-filter">
        <option value="">All Statuses</option>
        ${['New','In Progress','Completed','Follow-Up','Cancelled'].map(s=>`<option>${s}</option>`).join('')}
      </select>
      <select class="filter-select" id="fa-type-filter">
        <option value="">All Types</option>
        ${assistTypes.map(t=>`<option>${t}</option>`).join('')}
      </select>
      <label style="display:flex;align-items:center;gap:6px;font-size:.84rem;cursor:pointer;">
        <input type="checkbox" id="fa-overdue-only"> Overdue only
      </label>
    </div>

    <div class="table-wrap" id="fa-table-wrap"></div>
  `;

  function filtered() {
    const q  = document.getElementById('fa-search')?.value.toLowerCase()||'';
    const st = document.getElementById('fa-status-filter')?.value||'';
    const tp = document.getElementById('fa-type-filter')?.value||'';
    const ov = document.getElementById('fa-overdue-only')?.checked||false;
    return Storage.getAll('family_assistance').filter(f => {
      const txt = `${f.name} ${f.phone} ${f.email} ${f.assignedTo} ${f.notes}`.toLowerCase();
      return (!q||txt.includes(q)) && (!st||f.status===st) && (!tp||f.assistanceType===tp)
          && (!ov||overdueFollowup.find(x=>x.id===f.id));
    });
  }
  renderTable(families);
  ['fa-search','fa-status-filter','fa-type-filter','fa-overdue-only'].forEach(id =>
    document.getElementById(id)?.addEventListener('input', ()=>renderTable(filtered()))
  );
  document.getElementById('fa-status-filter')?.addEventListener('change', ()=>renderTable(filtered()));
  document.getElementById('fa-type-filter')?.addEventListener('change', ()=>renderTable(filtered()));
  FamilyAid._rerender = ()=>renderTable(filtered());
});

const FamilyAid = {
  _sort: { col: null, dir: 'asc' },
  _rerender: null,
  sortBy(col) {
    if(this._sort.col===col) this._sort.dir=this._sort.dir==='asc'?'desc':'asc';
    else { this._sort.col=col; this._sort.dir='asc'; }
    this._rerender?.();
  },
  _volunteers() { return Storage.getAll('volunteers').map(v=>v.name); },
  _form(f={}) {
    const vols = this._volunteers();
    const types = ['Food','Utility Bills','Rent Assistance','Transportation','Emergency Aid','Clothing','Other'];
    const statuses = ['New','In Progress','Completed','Follow-Up','Cancelled'];
    return `
      <div class="form-group"><label class="form-label">Family / Person Name *</label>
        <input class="form-control" id="fa-name" value="${UI.esc(f.name||'')}">
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Phone</label><input class="form-control" id="fa-phone" value="${UI.esc(f.phone||'')}"></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-control" id="fa-email" type="email" value="${UI.esc(f.email||'')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Address</label><input class="form-control" id="fa-addr" value="${UI.esc(f.address||'')}"></div>
        <div class="form-group"><label class="form-label">Household Size</label><input class="form-control" id="fa-hh" type="number" min="1" value="${f.householdSize||1}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Assistance Type</label>
          <select class="form-control" id="fa-type">${types.map(t=>`<option ${f.assistanceType===t?'selected':''}>${t}</option>`).join('')}</select>
        </div>
        <div class="form-group"><label class="form-label">Status</label>
          <select class="form-control" id="fa-status">${statuses.map(s=>`<option ${(f.status||'New')===s?'selected':''}>${s}</option>`).join('')}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Date Requested</label><input class="form-control" id="fa-req" type="date" value="${f.dateRequested||Storage.today()}"></div>
        <div class="form-group"><label class="form-label">Date Assisted</label><input class="form-control" id="fa-ast" type="date" value="${f.dateAssisted||''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Assigned To</label>
          <select class="form-control" id="fa-assigned">
            <option value="">— Unassigned —</option>
            ${vols.map(v=>`<option ${f.assignedTo===v?'selected':''}>${UI.esc(v)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Follow-Up Date</label><input class="form-control" id="fa-fup" type="date" value="${f.followUpDate||''}"></div>
      </div>
      <div class="form-group">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
          <input type="checkbox" id="fa-fupneeded" ${f.followUpNeeded?'checked':''}>
          <span class="form-label" style="margin:0">Follow-up needed</span>
        </label>
      </div>
      <div class="form-group"><label class="form-label">Notes</label>
        <textarea class="form-control" id="fa-notes" style="min-height:80px">${UI.esc(f.notes||'')}</textarea>
      </div>`;
  },
  _collect() {
    return {
      name:f('fa-name'), phone:f('fa-phone'), email:f('fa-email'), address:f('fa-addr'),
      householdSize:parseInt(document.getElementById('fa-hh')?.value)||1,
      assistanceType:f('fa-type'), status:f('fa-status'),
      dateRequested:f('fa-req'), dateAssisted:f('fa-ast')||null,
      assignedTo:f('fa-assigned'), followUpDate:f('fa-fup'),
      followUpNeeded:document.getElementById('fa-fupneeded')?.checked||false,
      notes:f('fa-notes'),
    };
    function f(id){ return document.getElementById(id)?.value?.trim()||''; }
  },
  add() {
    Modal.open({ title:'🏠 New Assistance Request', body:this._form(), width:'580px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-fa-btn">Save</button>` });
    document.getElementById('save-fa-btn').onclick = () => {
      const d=this._collect();
      if(!Validate.check([
        ['fa-name',  Validate.required(d.name,'Family name')],
        ['fa-email', Validate.email(document.getElementById('fa-email')?.value)],
      ])) return;
      var _saved = Storage.insert('family_assistance',d);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) SupabaseDB.tableUpsert('family_assistance', _saved).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
      Modal.close(); Toast.success('Request saved'); FamilyAid._rerender();
    };
  },
  edit(id) {
    const f=Storage.findById('family_assistance',id); if(!f) return;
    Modal.open({ title:'Edit Request', body:this._form(f), width:'580px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-fa-btn">Save</button>` });
    document.getElementById('save-fa-btn').onclick = () => {
      var _updated = Storage.update('family_assistance',id,this._collect());
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated() && _updated) SupabaseDB.tableUpsert('family_assistance', _updated).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
      Modal.close(); Toast.success('Updated'); FamilyAid._rerender();
    };
  },
  view(id) {
    const f=Storage.findById('family_assistance',id); if(!f) return;
    Modal.open({ title:f.name, width:'500px', body:`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:.88rem;margin-bottom:14px;">
        <div><div style="color:var(--text-muted);font-size:.72rem;font-weight:700;text-transform:uppercase">Household Size</div><div>${f.householdSize} people</div></div>
        <div><div style="color:var(--text-muted);font-size:.72rem;font-weight:700;text-transform:uppercase">Type</div><div>${f.assistanceType}</div></div>
        <div><div style="color:var(--text-muted);font-size:.72rem;font-weight:700;text-transform:uppercase">Status</div><div>${f.status}</div></div>
        <div><div style="color:var(--text-muted);font-size:.72rem;font-weight:700;text-transform:uppercase">        <div style="color:var(--text-muted);font-size:.72rem;font-weight:700;text-transform:uppercase">Date Requested</div><div>${f.dateRequested?UI.fmtDate(f.dateRequested):'—'}</div></div>
        <div><div style="color:var(--text-muted);font-size:.72rem;font-weight:700;text-transform:uppercase">Date Assisted</div><div>${f.dateAssisted?UI.fmtDate(f.dateAssisted):'—'}</div></div>
        <div><div style="color:var(--text-muted);font-size:.72rem;font-weight:700;text-transform:uppercase">Assigned To</div><div>${f.assignedTo||'—'}</div></div>
        <div><div style="color:var(--text-muted);font-size:.72rem;font-weight:700;text-transform:uppercase">Follow-Up</div><div>${f.followUpDate?UI.fmtDate(f.followUpDate):'—'}</div></div>
      </div>
      ${f.notes ? `<div style="border-top:1px solid var(--border);padding-top:12px;font-size:.87rem;">${UI.esc(f.notes)}</div>` : ''}
    `,
    footer:`<button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="Modal.close();FamilyAid.remove('${id}')">Delete</button>
            <button class="btn btn-outline" onclick="Modal.close()">Close</button>
            <button class="btn btn-primary" onclick="Modal.close();FamilyAid.edit('${id}')">Edit</button>`});
  },
  remove(id) {
    UI.confirm('Remove this assistance record?', () => {
      Storage.removeItem('family_assistance', id);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) SupabaseDB.tableDelete('family_assistance', id).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
      Toast.success('Removed'); FamilyAid._rerender();
    });
  },
  exportCSV() {
    const rows=[['Name','Phone','Type','Status','Date Requested','Date Assisted','Assigned To','Follow-Up Date','Notes']];
    Storage.getAll('family_assistance').forEach(f=>rows.push([f.name,f.phone||'',f.assistanceType,f.status,f.dateRequested||'',f.dateAssisted||'',f.assignedTo||'',f.followUpDate||'',f.notes||'']));
    const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='family-assistance.csv'; a.click();
    Toast.success('Exported');
  },
};
window.FamilyAid = FamilyAid;

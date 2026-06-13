/* =============================================================
   resources.js  —  Resource Sharing / Checkout System
   Equipment, vehicles, supplies — borrow & return tracking
   ============================================================= */

(function seedResources() {
  if (Storage.get('_resources_seeded')) return;
  const uid = Storage.uid, today = Storage.today;
  const resources = [
    { id:uid(), name:'15-Passenger Church Van', category:'Vehicle', location:'Church Garage', condition:'Good', available:true, checkedOutTo:'', dueDate:'', notes:'Requires approved driver on file.', lastServiced:today(-30), createdAt:today(-200) },
    { id:uid(), name:'12-Passenger Minibus', category:'Vehicle', location:'Church Garage', condition:'Good', available:false, checkedOutTo:'Youth Department', dueDate:today(2), notes:'Used for youth retreat.', lastServiced:today(-60), createdAt:today(-180) },
    { id:uid(), name:'Portable PA System (Large)', category:'Audio/Visual', location:'Storage Room B', condition:'Excellent', available:true, checkedOutTo:'', dueDate:'', notes:'Includes 2 wireless mics, mixer, 2 speakers, stands.', lastServiced:'', createdAt:today(-300) },
    { id:uid(), name:'Portable PA System (Small)', category:'Audio/Visual', location:'Storage Room B', condition:'Good', available:false, checkedOutTo:'David Martinez', dueDate:today(-1), notes:'Overdue — contact borrower.', lastServiced:'', createdAt:today(-250) },
    { id:uid(), name:'Folding Tables (8-foot) — Set of 10', category:'Furniture', location:'Storage Room A', condition:'Good', available:true, checkedOutTo:'', dueDate:'', notes:'Stored flat in the north stack.', lastServiced:'', createdAt:today(-400) },
    { id:uid(), name:'Folding Chairs — Set of 50', category:'Furniture', location:'Storage Room A', condition:'Fair', available:true, checkedOutTo:'', dueDate:'', notes:'6 chairs have minor damage.', lastServiced:'', createdAt:today(-400) },
    { id:uid(), name:'Pop-Up Canopy Tents (10x10) — Set of 4', category:'Outdoor', location:'Storage Room A', condition:'Good', available:false, checkedOutTo:'Events Committee', dueDate:today(1), notes:'Out for block party prep.', lastServiced:'', createdAt:today(-200) },
    { id:uid(), name:'Projector (Epson 3000 Lumens)', category:'Audio/Visual', location:'Tech Closet', condition:'Excellent', available:true, checkedOutTo:'', dueDate:'', notes:'Includes HDMI cable, remote, carrying case.', lastServiced:'', createdAt:today(-150) },
    { id:uid(), name:'Projector Screen (6ft)', category:'Audio/Visual', location:'Tech Closet', condition:'Good', available:true, checkedOutTo:'', dueDate:'', notes:'Tripod-style screen.', lastServiced:'', createdAt:today(-150) },
    { id:uid(), name:'Commercial Coffee Urns (5-gallon) x2', category:'Kitchen', location:'Kitchen Storage', condition:'Good', available:true, checkedOutTo:'', dueDate:'', notes:'Capacity: 60 cups each.', lastServiced:'', createdAt:today(-365) },
    { id:uid(), name:'Chafing Dishes / Warming Trays — Set of 6', category:'Kitchen', location:'Kitchen Storage', condition:'Good', available:false, checkedOutTo:'Dorothy White', dueDate:today(3), notes:'Out for community meal prep.', lastServiced:'', createdAt:today(-300) },
    { id:uid(), name:'Electric Griddle (Commercial)', category:'Kitchen', location:'Kitchen Storage', condition:'Good', available:true, checkedOutTo:'', dueDate:'', notes:'Feeds ~100 people breakfast per hour.', lastServiced:'', createdAt:today(-200) },
    { id:uid(), name:'Bounce House (15x15)', category:'Outdoor', location:'Storage Room C', condition:'Good', available:true, checkedOutTo:'', dueDate:'', notes:'Includes blower. Requires adult supervision.', lastServiced:'', createdAt:today(-100) },
    { id:uid(), name:'Portable Generator (6500W)', category:'Equipment', location:'Garage', condition:'Good', available:true, checkedOutTo:'', dueDate:'', notes:'Runs 8 hours on full tank. Requires outdoor use only.', lastServiced:today(-45), createdAt:today(-250) },
    { id:uid(), name:'First Aid / Disaster Relief Supply Kit', category:'Safety', location:'Office Storage', condition:'Good', available:true, checkedOutTo:'', dueDate:'', notes:'Check expiration dates before use. Restock after each use.', lastServiced:'', createdAt:today(-180) },
  ];
  Storage.saveAll('resources', resources);
  Storage.set('_resources_seeded', true);
})();

Navigation.register('resources', function render(page) {
  const resources = Storage.getAll('resources').sort((a,b)=>a.name.localeCompare(b.name));
  const today = Storage.today();
  const available   = resources.filter(r=>r.available).length;
  const checkedOut  = resources.filter(r=>!r.available).length;
  const overdue     = resources.filter(r=>!r.available && r.dueDate && r.dueDate < today).length;
  const categories  = [...new Set(resources.map(r=>r.category))].sort();

  const conditionColor = { Excellent:'green', Good:'blue', Fair:'yellow', Poor:'red' };

  function renderTable(data) {
    const tbody = document.getElementById('res-tbody');
    if (!tbody) return;
    if (!data.length) {
      tbody.innerHTML=`<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted)">No resources found</td></tr>`;
      return;
    }
    tbody.innerHTML = data.map(r => {
      const isOverdue = !r.available && r.dueDate && r.dueDate < today;
      return `
        <tr ${isOverdue?'style="background:rgba(239,68,68,.05)"':''}>
          <td>
            <div style="font-weight:700">${UI.esc(r.name)}</div>
            <div style="font-size:.74rem;color:var(--text-muted)">${UI.esc(r.category)} · <i data-lucide="map-pin" class="icon-inline" aria-hidden="true"></i> ${UI.esc(r.location)}</div>
          </td>
          <td>${UI.badge(r.condition, conditionColor[r.condition]||'gray')}</td>
          <td>${r.available
            ? `<span style="color:var(--green);font-weight:700">✓ Available</span>`
            : `<div><span style="color:${isOverdue?'var(--red)':'var(--orange)'};font-weight:700">
                ${isOverdue?'<i data-lucide="alert-triangle" class="icon-inline" aria-hidden="true"></i> Overdue':'● Out'}
               </span><div style="font-size:.74rem;color:var(--text-muted)">→ ${UI.esc(r.checkedOutTo)}</div>
               <div style="font-size:.74rem;color:${isOverdue?'var(--red)':'var(--text-muted)'}">Due: ${UI.fmtDate(r.dueDate)}</div></div>`
          }</td>
          <td style="font-size:.8rem;color:var(--text-muted);max-width:180px;">${UI.esc(r.notes||'')}</td>
          <td>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              ${r.available
                ? `<button class="btn btn-sm btn-primary" onclick="Resources.checkout('${r.id}')">Check Out</button>`
                : `<button class="btn btn-sm btn-success" onclick="Resources.checkin('${r.id}')">Return</button>`
              }
              <button class="btn btn-sm btn-ghost" onclick="Resources.edit('${r.id}')">Edit</button>
              <button class="btn btn-sm btn-ghost" style="color:var(--red)" aria-label="Remove resource" onclick="Resources.remove('${r.id}')">×</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  page.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">Resource Sharing</h2>
        <div class="section-subtitle">Equipment, vehicles & supplies checkout system</div>
      </div>
      <button class="btn btn-primary" onclick="Resources.add()">+ Add Resource</button>
    </div>

    <div class="stat-grid" style="margin-bottom:24px;">
      <div class="stat-card" data-accent="blue"><div class="stat-icon"><i data-lucide="package" style="opacity:.7" aria-hidden="true"></i></div><div class="stat-value">${resources.length}</div><div class="stat-label">Total Resources</div></div>
      <div class="stat-card" data-accent="green"><div class="stat-icon"><i data-lucide="circle" style="opacity:.7" aria-hidden="true"></i></div><div class="stat-value">${available}</div><div class="stat-label">Available Now</div></div>
      <div class="stat-card" data-accent="orange"><div class="stat-icon"><i data-lucide="circle" style="opacity:.7" aria-hidden="true"></i></div><div class="stat-value">${checkedOut}</div><div class="stat-label">Checked Out</div></div>
      <div class="stat-card" data-accent="red"><div class="stat-icon"><i data-lucide="circle" style="opacity:.7" aria-hidden="true"></i></div><div class="stat-value">${overdue}</div><div class="stat-label">Overdue Returns</div></div>
    </div>

    ${overdue ? `<div style="background:rgba(239,68,68,.08);border:1px solid var(--red);border-radius:var(--radius);padding:12px 16px;margin-bottom:20px;font-size:.86rem;">
      <strong style="color:var(--red)"><i data-lucide="alert-triangle" class="icon-inline" aria-hidden="true"></i> ${overdue} overdue return${overdue>1?'s':''}</strong> — please follow up with borrowers.
    </div>` : ''}

    <div class="toolbar">
      <div class="search-input-wrap">
        <i data-lucide="search" class="icon-inline search-icon-lucide" aria-hidden="true"></i>
        <input type="text" class="search-input" id="res-search" placeholder="Search resources…">
      </div>
      <select class="filter-select" id="res-cat-filter">
        <option value="">All Categories</option>
        ${categories.map(c=>`<option>${c}</option>`).join('')}
      </select>
      <select class="filter-select" id="res-avail-filter">
        <option value="">All</option>
        <option value="available">Available</option>
        <option value="out">Checked Out</option>
        <option value="overdue">Overdue</option>
      </select>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Resource</th><th>Condition</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead>
        <tbody id="res-tbody"></tbody>
      </table>
    </div>
  `;

  renderTable(resources);

  function filtered() {
    const q  = document.getElementById('res-search')?.value.toLowerCase()||'';
    const cat= document.getElementById('res-cat-filter')?.value||'';
    const av = document.getElementById('res-avail-filter')?.value||'';
    return resources.filter(r=>{
      const txt=`${r.name} ${r.category} ${r.checkedOutTo} ${r.location}`.toLowerCase();
      const avMatch = !av || (av==='available'&&r.available) || (av==='out'&&!r.available) || (av==='overdue'&&!r.available&&r.dueDate&&r.dueDate<today);
      return (!q||txt.includes(q)) && (!cat||r.category===cat) && avMatch;
    });
  }
  document.getElementById('res-search')?.addEventListener('input',()=>renderTable(filtered()));
  document.getElementById('res-cat-filter')?.addEventListener('change',()=>renderTable(filtered()));
  document.getElementById('res-avail-filter')?.addEventListener('change',()=>renderTable(filtered()));
});

const Resources = {
  _state: { search: '' },
  _rerender() {
    const _s = document.getElementById('res-search');
    if (_s) Resources._state.search = _s.value;
    Resources._rerender();
    const _ns = document.getElementById('res-search');
    if (_ns && Resources._state.search) { _ns.value = Resources._state.search; _ns.dispatchEvent(new Event('input')); }
  },
  _cats: ['Vehicle','Audio/Visual','Furniture','Outdoor','Kitchen','Equipment','Safety','Other'],
  _conds: ['Excellent','Good','Fair','Poor'],
  _form(r={}) {
    return `
      <div class="form-group"><label class="form-label">Resource Name *</label><input class="form-control" id="r-name" value="${UI.esc(r.name||'')}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Category</label>
          <select class="form-control" id="r-cat">${this._cats.map(c=>`<option ${(r.category||'Equipment')===c?'selected':''}>${c}</option>`).join('')}</select>
        </div>
        <div class="form-group"><label class="form-label">Condition</label>
          <select class="form-control" id="r-cond">${this._conds.map(c=>`<option ${(r.condition||'Good')===c?'selected':''}>${c}</option>`).join('')}</select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">Location / Storage</label><input class="form-control" id="r-loc" value="${UI.esc(r.location||'')}"></div>
      <div class="form-group"><label class="form-label">Notes</label><textarea class="form-control" id="r-notes">${UI.esc(r.notes||'')}</textarea></div>`;
  },
  _collect() {
    const v=id=>document.getElementById(id)?.value?.trim()||'';
    return { name:v('r-name'), category:v('r-cat'), condition:v('r-cond'), location:v('r-loc'), notes:v('r-notes') };
  },
  add() {
    Modal.open({ title:'Add Resource', body:this._form(), width:'500px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-r-btn">Add Resource</button>` });
    document.getElementById('save-r-btn').onclick = () => {
      const d=this._collect();
      if(!Validate.check([
        ['r-name', Validate.required(d.name,'Resource name')],
      ])) return;
      Storage.insert('resources',{...d, available:true, checkedOutTo:'', dueDate:'', lastServiced:''});
      Modal.close(); Toast.success('Resource added'); Resources._rerender();
    };
  },
  edit(id) {
    const r=Storage.findById('resources',id); if(!r) return;
    Modal.open({ title:'Edit Resource', body:this._form(r), width:'500px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-r-btn">Save</button>` });
    document.getElementById('save-r-btn').onclick = () => {
      Storage.update('resources',id,this._collect()); Modal.close(); Toast.success('Updated'); Resources._rerender();
    };
  },
  checkout(id) {
    const r=Storage.findById('resources',id); if(!r) return;
    Modal.open({ title:`Check Out: ${r.name}`, width:'420px',
      body:`
        <div class="form-group"><label class="form-label">Checked Out To *</label><input class="form-control" id="co-name" placeholder="Name or department"></div>
        <div class="form-group"><label class="form-label">Return By *</label><input class="form-control" id="co-due" type="date" value="${Storage.today(7)}"></div>
        <div class="form-group"><label class="form-label">Notes</label><input class="form-control" id="co-notes" placeholder="Purpose, special instructions…"></div>`,
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="co-btn">Confirm Checkout</button>` });
    document.getElementById('co-btn').onclick = () => {
      const who=document.getElementById('co-name')?.value?.trim();
      const due=document.getElementById('co-due')?.value?.trim();
      if(!Validate.check([
        ['co-name', Validate.required(who,'Borrower name')],
        ['co-due',  Validate.required(due,'Return date')],
      ])) return;
      const note=document.getElementById('co-notes')?.value?.trim()||'';
      Storage.update('resources',id,{ available:false, checkedOutTo:who, dueDate:due, notes:(r.notes?(r.notes+' | '):'')+`Checked out to ${who}${note?' — '+note:''}` });
      Modal.close(); Toast.success(`${r.name} checked out to ${who}`); Resources._rerender();
    };
  },
  checkin(id) {
    const r=Storage.findById('resources',id); if(!r) return;
    Modal.open({ title:`Return: ${r.name}`, width:'420px',
      body:`
        <p style="margin-bottom:16px;font-size:.88rem;">Confirming return from <strong>${UI.esc(r.checkedOutTo)}</strong>.</p>
        <div class="form-group"><label class="form-label">Condition on Return</label>
          <select class="form-control" id="ci-cond">
            ${['Excellent','Good','Fair','Poor'].map(c=>`<option ${r.condition===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Notes</label><input class="form-control" id="ci-notes" placeholder="Any damage, issues, etc."></div>`,
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-success" id="ci-btn">Mark Returned</button>` });
    document.getElementById('ci-btn').onclick = () => {
      const cond=document.getElementById('ci-cond')?.value||r.condition;
      const note=document.getElementById('ci-notes')?.value?.trim()||'';
      Storage.update('resources',id,{ available:true, checkedOutTo:'', dueDate:'', condition:cond, notes:note||r.notes });
      Modal.close(); Toast.success(`${r.name} returned`); Resources._rerender();
    };
  },
  remove(id) {
    UI.confirm('Remove this resource?',()=>{ Storage.removeItem('resources',id); Toast.success('Removed'); Resources._rerender(); });
  },
};
window.Resources = Resources;

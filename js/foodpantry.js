/* =============================================================
   foodpantry.js  —  Full Food Pantry Inventory Management
   ============================================================= */

(function seedPantryInventory() {
  if (Storage.get('_pantry_inv_seeded')) return;
  const uid = Storage.uid, today = Storage.today;
  const items = [
    { id: uid(), name: 'Canned Green Beans',    category: 'Canned Vegetables', qty: 84,  unit: 'cans',   minStock: 24, expDate: today(210), location: 'Shelf A1', donor: 'Community Food Drive', dateReceived: today(-14) },
    { id: uid(), name: 'Canned Corn',            category: 'Canned Vegetables', qty: 62,  unit: 'cans',   minStock: 24, expDate: today(240), location: 'Shelf A1', donor: 'Kroger Donation',       dateReceived: today(-7)  },
    { id: uid(), name: 'Canned Tomatoes',        category: 'Canned Vegetables', qty: 18,  unit: 'cans',   minStock: 24, expDate: today(180), location: 'Shelf A2', donor: 'Anonymous',              dateReceived: today(-21) },
    { id: uid(), name: 'Canned Tuna',            category: 'Canned Protein',    qty: 45,  unit: 'cans',   minStock: 20, expDate: today(300), location: 'Shelf B1', donor: 'Community Food Drive',   dateReceived: today(-14) },
    { id: uid(), name: 'Peanut Butter',          category: 'Canned Protein',    qty: 12,  unit: 'jars',   minStock: 15, expDate: today(120), location: 'Shelf B2', donor: 'Wilson Family',          dateReceived: today(-5)  },
    { id: uid(), name: 'Canned Chicken',         category: 'Canned Protein',    qty: 30,  unit: 'cans',   minStock: 20, expDate: today(270), location: 'Shelf B1', donor: 'Food Bank Transfer',     dateReceived: today(-10) },
    { id: uid(), name: 'Pasta (Spaghetti)',       category: 'Dry Goods',         qty: 55,  unit: 'lbs',    minStock: 20, expDate: today(365), location: 'Shelf C1', donor: 'Community Food Drive',   dateReceived: today(-14) },
    { id: uid(), name: 'Rice (Long Grain)',       category: 'Dry Goods',         qty: 40,  unit: 'lbs',    minStock: 25, expDate: today(730), location: 'Shelf C1', donor: 'Multiple',               dateReceived: today(-7)  },
    { id: uid(), name: 'Instant Oatmeal',        category: 'Dry Goods',         qty: 28,  unit: 'boxes',  minStock: 15, expDate: today(200), location: 'Shelf C2', donor: 'Walmart Donation',       dateReceived: today(-3)  },
    { id: uid(), name: 'Whole Wheat Bread',      category: 'Bread & Bakery',    qty: 8,   unit: 'loaves', minStock: 10, expDate: today(5),   location: 'Fridge 1', donor: 'Panera Bread',           dateReceived: today(-1)  },
    { id: uid(), name: 'Sandwich Bread',         category: 'Bread & Bakery',    qty: 6,   unit: 'loaves', minStock: 10, expDate: today(4),   location: 'Fridge 1', donor: 'Panera Bread',           dateReceived: today(-1)  },
    { id: uid(), name: '2% Milk',                category: 'Dairy',             qty: 10,  unit: 'gallons',minStock: 8,  expDate: today(6),   location: 'Fridge 2', donor: 'Garcia Family',          dateReceived: today(-1)  },
    { id: uid(), name: 'Cheddar Cheese',         category: 'Dairy',             qty: 5,   unit: 'lbs',    minStock: 5,  expDate: today(18),  location: 'Fridge 2', donor: 'Local Dairy',            dateReceived: today(-3)  },
    { id: uid(), name: 'Baby Formula',           category: 'Baby & Infant',     qty: 6,   unit: 'cans',   minStock: 8,  expDate: today(90),  location: 'Shelf D1', donor: 'Anonymous',              dateReceived: today(-10) },
    { id: uid(), name: 'Diapers (Size 2)',       category: 'Baby & Infant',     qty: 4,   unit: 'packs',  minStock: 6,  expDate: today(999), location: 'Shelf D1', donor: 'Anonymous',              dateReceived: today(-7)  },
    { id: uid(), name: 'Cooking Oil',            category: 'Pantry Staples',    qty: 14,  unit: 'bottles',minStock: 10, expDate: today(300), location: 'Shelf E1', donor: 'Community Food Drive',   dateReceived: today(-14) },
    { id: uid(), name: 'Canned Soup (Chicken)',  category: 'Canned Soups',      qty: 72,  unit: 'cans',   minStock: 30, expDate: today(365), location: 'Shelf A3', donor: 'Multiple',               dateReceived: today(-7)  },
    { id: uid(), name: 'Canned Soup (Tomato)',   category: 'Canned Soups',      qty: 48,  unit: 'cans',   minStock: 30, expDate: today(365), location: 'Shelf A3', donor: 'Multiple',               dateReceived: today(-7)  },
    { id: uid(), name: 'Cereal (Cheerios)',      category: 'Dry Goods',         qty: 22,  unit: 'boxes',  minStock: 12, expDate: today(150), location: 'Shelf C3', donor: 'Walmart Donation',       dateReceived: today(-5)  },
    { id: uid(), name: 'Applesauce Cups',        category: 'Snacks',            qty: 36,  unit: 'packs',  minStock: 20, expDate: today(180), location: 'Shelf E2', donor: 'Thompson Family',        dateReceived: today(-4)  },
    { id: uid(), name: 'Ramen Noodles',          category: 'Dry Goods',         qty: 96,  unit: 'packs',  minStock: 40, expDate: today(400), location: 'Shelf C2', donor: 'Community Food Drive',   dateReceived: today(-14) },
    { id: uid(), name: 'Mac & Cheese (Box)',     category: 'Dry Goods',         qty: 44,  unit: 'boxes',  minStock: 20, expDate: today(300), location: 'Shelf C3', donor: 'Multiple',               dateReceived: today(-7)  },
    { id: uid(), name: 'Canned Beans (Black)',   category: 'Canned Vegetables', qty: 50,  unit: 'cans',   minStock: 24, expDate: today(400), location: 'Shelf A2', donor: 'Community Food Drive',   dateReceived: today(-14) },
    { id: uid(), name: 'Canned Beans (Kidney)',  category: 'Canned Vegetables', qty: 38,  unit: 'cans',   minStock: 24, expDate: today(400), location: 'Shelf A2', donor: 'Multiple',               dateReceived: today(-10) },
  ];
  Storage.saveAll('pantry_inventory', items);

  const distributions = [
    { id: uid(), date: today(-2),  familiesServed: 34, individualServed: 89, volunteerHours: 18, items: ['Canned goods','Bread','Produce','Dairy'], notes: 'Record turnout this week', createdAt: today(-2) },
    { id: uid(), date: today(-9),  familiesServed: 28, individualServed: 74, volunteerHours: 14, items: ['Canned goods','Pasta','Cereal'], notes: '', createdAt: today(-9) },
    { id: uid(), date: today(-16), familiesServed: 31, individualServed: 82, volunteerHours: 15, items: ['Canned goods','Bread','Protein'], notes: '', createdAt: today(-16) },
    { id: uid(), date: today(-23), familiesServed: 25, individualServed: 68, volunteerHours: 12, items: ['Canned goods','Produce'], notes: 'Low on protein items', createdAt: today(-23) },
    { id: uid(), date: today(-30), familiesServed: 29, individualServed: 77, volunteerHours: 16, items: ['Canned goods','Bread','Dairy'], notes: '', createdAt: today(-30) },
  ];
  if (!Storage.get('_seeded')) Storage.saveAll('foodpantry', distributions);
  Storage.set('_pantry_inv_seeded', true);
})();

Navigation.register('foodpantry', function render(page) {
  const inventory = Storage.getAll('pantry_inventory');
  const distributions = Storage.getAll('foodpantry').sort((a,b) => b.date.localeCompare(a.date));
  const today = Storage.today();

  const lowStock   = inventory.filter(i => i.qty <= i.minStock);
  const expiringSoon = inventory.filter(i => i.expDate && i.expDate <= Storage.today(14) && i.qty > 0);
  const totalItems = inventory.reduce((s,i) => s+i.qty, 0);
  const cats = [...new Set(inventory.map(i=>i.category))].sort();

  let activeTab = Storage.get('_pantryTab') || 'inventory';

  function renderInventoryTable(data) {
    if (!data.length) return `<div class="empty-state"><div class="empty-state-icon">📦</div><div class="empty-state-title">No items found</div></div>`;

    const { col: sortCol, dir: sortDir } = PantryMgr._sort;
    function thIcon(key) {
      if (sortCol !== key) return `<span style="opacity:.25;font-size:.7rem;margin-left:3px;">↕</span>`;
      return `<span style="font-size:.75rem;margin-left:3px;color:var(--accent)">${sortDir === 'asc' ? '↑' : '↓'}</span>`;
    }
    const thStyle = `cursor:pointer;user-select:none;white-space:nowrap;`;
    function th(label, key) {
      const active = sortCol === key;
      return `<th style="${thStyle}${active?'color:var(--accent);':''}" onclick="PantryMgr.sortBy('${key}')">${label}${thIcon(key)}</th>`;
    }

    return `
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            ${th('Item','name')}
            ${th('Category','category')}
            ${th('Qty','qty')}
            ${th('Unit','unit')}
            ${th('Min Stock','minStock')}
            ${th('Expires','expDate')}
            ${th('Location','location')}
            ${th('Donor','donor')}
            <th>Actions</th>
          </tr></thead>
          <tbody>
            ${data.map(item => {
              const isLow = item.qty <= item.minStock;
              const isExpiring = item.expDate && item.expDate <= Storage.today(14);
              const isExpired  = item.expDate && item.expDate < today;
              return `
                <tr style="${isLow||isExpiring||isExpired ? 'background:var(--accent-light)' : ''}">
                  <td>
                    <strong>${UI.esc(item.name)}</strong>
                    ${isLow ? '<span class="badge badge-red" style="margin-left:6px">Low</span>' : ''}
                    ${isExpired ? '<span class="badge badge-red" style="margin-left:4px">Expired</span>' : isExpiring ? '<span class="badge badge-yellow" style="margin-left:4px">Expiring</span>' : ''}
                  </td>
                  <td><span class="badge badge-gray">${UI.esc(item.category)}</span></td>
                  <td><strong style="color:${isLow?'var(--red)':'var(--text)'}">${item.qty}</strong></td>
                  <td>${UI.esc(item.unit)}</td>
                  <td style="color:var(--text-muted)">${item.minStock}</td>
                  <td style="color:${isExpired?'var(--red)':isExpiring?'var(--yellow)':'var(--text-muted)'}">${item.expDate ? UI.fmtDate(item.expDate) : '—'}</td>
                  <td style="font-size:.8rem">${UI.esc(item.location||'—')}</td>
                  <td style="font-size:.8rem;color:var(--text-muted)">${UI.esc(item.donor||'—')}</td>
                  <td>
                    <button class="btn btn-ghost btn-sm" onclick="PantryMgr.adjustQty('${item.id}')">± Adjust</button>
                    <button class="btn btn-ghost btn-sm" onclick="PantryMgr.edit('${item.id}')">Edit</button>
                    <button class="btn btn-ghost btn-sm" style="color:var(--red)" aria-label="Remove inventory item" onclick="PantryMgr.remove('${item.id}')">✕</button>
                  </td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function renderDistributions() {
    if (!distributions.length) return `<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-title">No distributions recorded</div></div>`;
    return `
      <div style="margin-bottom:12px;display:flex;justify-content:flex-end;">
        <button class="btn btn-primary" onclick="PantryMgr.addDistribution()">+ Log Distribution</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Families</th><th>Individuals</th><th>Vol. Hours</th><th>Items Given</th><th>Notes</th><th>Actions</th></tr></thead>
          <tbody>
            ${distributions.slice(0,20).map(r => `
              <tr>
                <td>${UI.fmtDate(r.date)}<br><small style="color:var(--text-muted)">${UI.relDate(r.date)}</small></td>
                <td style="text-align:center;font-weight:700;color:var(--accent)">${r.familiesServed}</td>
                <td style="text-align:center">${r.individualServed}</td>
                <td style="text-align:center">${r.volunteerHours}</td>
                <td style="font-size:.8rem">${(r.items||[]).join(', ')}</td>
                <td style="font-size:.8rem;color:var(--text-muted)">${UI.esc(r.notes||'')}</td>
                <td>
                  <button class="btn btn-ghost btn-sm" onclick="PantryMgr.editDist('${r.id}')">Edit</button>
                  <button class="btn btn-ghost btn-sm" style="color:var(--red)" aria-label="Remove distribution record" onclick="PantryMgr.removeDist('${r.id}')">✕</button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  page.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">🥫 Food Pantry Management</h2>
        <div class="section-subtitle">Inventory · Donations · Distribution tracking</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="PantryMgr.addItem()">+ Add Item</button>
        <button class="btn btn-outline" onclick="PantryMgr.addDistribution()">📋 Log Distribution</button>
      </div>
    </div>

    <!-- Alert Banner -->
    ${(lowStock.length || expiringSoon.length) ? `
      <div style="background:var(--surface);border:1px solid var(--yellow);border-left:4px solid var(--yellow);border-radius:var(--radius);padding:12px 16px;margin-bottom:20px;display:flex;gap:16px;flex-wrap:wrap;align-items:center;">
        <span style="font-size:1.2rem;">⚠️</span>
        <div style="flex:1;font-size:.86rem;">
          ${lowStock.length ? `<strong>${lowStock.length} item${lowStock.length>1?'s':''} below minimum stock:</strong> ${lowStock.map(i=>i.name).join(', ')}. ` : ''}
          ${expiringSoon.length ? `<strong>${expiringSoon.length} item${expiringSoon.length>1?'s':''} expiring within 14 days:</strong> ${expiringSoon.map(i=>i.name).join(', ')}.` : ''}
        </div>
      </div>
    ` : ''}

    <!-- Stat Cards -->
    <div class="stat-grid" style="margin-bottom:24px;">
      <div class="stat-card" data-accent="blue">
        <div class="stat-icon">📦</div>
        <div class="stat-value">${totalItems.toLocaleString()}</div>
        <div class="stat-label">Total Items in Stock</div>
        <div class="stat-delta flat">${inventory.length} unique items</div>
      </div>
      <div class="stat-card" data-accent="red">
        <div class="stat-icon">⚠️</div>
        <div class="stat-value">${lowStock.length}</div>
        <div class="stat-label">Low Stock Items</div>
        <div class="stat-delta ${lowStock.length>0?'down':'up'}">${lowStock.length>0?'Needs restocking':'All stocked ✓'}</div>
      </div>
      <div class="stat-card" data-accent="yellow">
        <div class="stat-icon">⏰</div>
        <div class="stat-value">${expiringSoon.length}</div>
        <div class="stat-label">Expiring Soon</div>
        <div class="stat-delta flat">Within 14 days</div>
      </div>
      <div class="stat-card" data-accent="green">
        <div class="stat-icon">👨‍👩‍👧</div>
        <div class="stat-value">${distributions.reduce((s,r)=>s+(r.familiesServed||0),0)}</div>
        <div class="stat-label">Families Served Total</div>
        <div class="stat-delta flat">${distributions.length} distributions</div>
      </div>
      <div class="stat-card" data-accent="orange">
        <div class="stat-icon">⏱</div>
        <div class="stat-value">${distributions.reduce((s,r)=>s+(r.volunteerHours||0),0)}</div>
        <div class="stat-label">Volunteer Hours</div>
      </div>
    </div>

    <!-- Tabs -->
    <div style="display:flex;gap:0;border-bottom:2px solid var(--border);margin-bottom:20px;">
      ${[['inventory','📦 Inventory'],['distributions','📋 Distributions'],['lowstock','⚠️ Alerts']].map(([id,lbl])=>`
        <button class="pantry-tab ${activeTab===id?'active':''}" data-ptab="${id}"
          style="padding:10px 18px;border:none;background:none;font-size:.88rem;font-weight:600;
          color:${activeTab===id?'var(--accent)':'var(--text-muted)'};
          border-bottom:${activeTab===id?'2px solid var(--accent)':'2px solid transparent'};
          margin-bottom:-2px;cursor:pointer;transition:all .15s;">${lbl}</button>
      `).join('')}
    </div>

    <!-- Tab Search -->
    <div class="toolbar" id="pantry-toolbar" style="${activeTab!=='inventory'?'display:none':''}">
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" class="search-input" id="pantry-search" placeholder="Search items…">
      </div>
      <select class="filter-select" id="pantry-cat-filter">
        <option value="">All Categories</option>
        ${cats.map(c=>`<option>${UI.esc(c)}</option>`).join('')}
      </select>
      <select class="filter-select" id="pantry-stock-filter">
        <option value="">All Stock Levels</option>
        <option value="low">Low Stock Only</option>
        <option value="expiring">Expiring Soon</option>
        <option value="ok">Adequately Stocked</option>
      </select>
    </div>

    <!-- Tab Content -->
    <div id="pantry-tab-content">
      ${renderTabContent()}
    </div>
  `;

  function renderTabContent() {
    if (activeTab === 'inventory') {
      const q  = '';
      const filtered = inventory;
      return renderInventoryTable(filtered);
    }
    if (activeTab === 'distributions') return renderDistributions();
    if (activeTab === 'lowstock') {
      const alerts = [...lowStock.map(i=>({...i,alertType:'low'})), ...expiringSoon.filter(i=>!lowStock.find(l=>l.id===i.id)).map(i=>({...i,alertType:'expiring'}))];
      if (!alerts.length) return `<div class="empty-state"><div class="empty-state-icon">✅</div><div class="empty-state-title">No alerts — pantry is well stocked!</div></div>`;
      return `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;">
          ${alerts.map(i=>`
            <div class="card" style="border-left:3px solid ${i.alertType==='low'?'var(--red)':'var(--yellow)'}">
              <div style="font-weight:700;margin-bottom:6px;">${UI.esc(i.name)}</div>
              <div style="font-size:.82rem;color:var(--text-muted);margin-bottom:8px;">${UI.esc(i.category)} · ${UI.esc(i.location)}</div>
              ${i.alertType==='low' ? `<div style="color:var(--red);font-size:.84rem;">⚠ Only <strong>${i.qty} ${i.unit}</strong> remaining (min: ${i.minStock})</div>` : ''}
              ${i.alertType==='expiring' ? `<div style="color:var(--yellow);font-size:.84rem;">⏰ Expires <strong>${UI.fmtDate(i.expDate)}</strong> (${UI.relDate(i.expDate)})</div>` : ''}
              <div style="margin-top:10px;display:flex;gap:6px;">
                <button class="btn btn-primary btn-sm" onclick="PantryMgr.adjustQty('${i.id}')">+ Restock</button>
                <button class="btn btn-ghost btn-sm" onclick="PantryMgr.edit('${i.id}')">Edit</button>
              </div>
            </div>`).join('')}
        </div>`;
    }
    return '';
  }

  // Tab switching
  page.querySelectorAll('.pantry-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.ptab;
      Storage.set('_pantryTab', activeTab);
      page.querySelectorAll('.pantry-tab').forEach(b => {
        b.style.color = b.dataset.ptab===activeTab ? 'var(--accent)' : 'var(--text-muted)';
        b.style.borderBottom = b.dataset.ptab===activeTab ? '2px solid var(--accent)' : '2px solid transparent';
      });
      document.getElementById('pantry-tab-content').innerHTML = renderTabContent();
      const toolbar = document.getElementById('pantry-toolbar');
      if (toolbar) toolbar.style.display = activeTab==='inventory' ? '' : 'none';
      wireInventorySearch();
    });
  });

  function wireInventorySearch() {
    document.getElementById('pantry-search')?.addEventListener('input', filterAndRender);
    document.getElementById('pantry-cat-filter')?.addEventListener('change', filterAndRender);
    document.getElementById('pantry-stock-filter')?.addEventListener('change', filterAndRender);
  }

  function filterAndRender() {
    const q  = document.getElementById('pantry-search')?.value.toLowerCase() || '';
    const cat= document.getElementById('pantry-cat-filter')?.value || '';
    const st = document.getElementById('pantry-stock-filter')?.value || '';
    let data = [...inventory];
    if (q) data = data.filter(i => `${i.name} ${i.category} ${i.donor} ${i.location}`.toLowerCase().includes(q));
    if (cat) data = data.filter(i => i.category === cat);
    if (st === 'low') data = data.filter(i => i.qty <= i.minStock);
    if (st === 'expiring') data = data.filter(i => i.expDate && i.expDate <= Storage.today(14));
    if (st === 'ok') data = data.filter(i => i.qty > i.minStock);

    // Apply sort
    const { col, dir } = PantryMgr._sort;
    if (col) {
      const numCols = new Set(['qty','minStock']);
      data.sort((a, b) => {
        let av = a[col], bv = b[col];
        if (av == null || av === '') return 1;
        if (bv == null || bv === '') return -1;
        const cmp = numCols.has(col) ? av - bv : String(av).localeCompare(String(bv));
        return dir === 'asc' ? cmp : -cmp;
      });
    }

    document.getElementById('pantry-tab-content').innerHTML = renderInventoryTable(data);
  }
  // Expose rerender to PantryMgr so sortBy can trigger it
  PantryMgr._rerender = filterAndRender;
  wireInventorySearch();
});

const PantryMgr = {
  _state: { search: '' },
  _rerender() {
    const _s = document.getElementById('pantry-search');
    if (_s) PantryMgr._state.search = _s.value;
    PantryMgr._rerender();
    const _ns = document.getElementById('pantry-search');
    if (_ns && PantryMgr._state.search) { _ns.value = PantryMgr._state.search; _ns.dispatchEvent(new Event('input')); }
  },
  _cats: ['Canned Vegetables','Canned Protein','Canned Soups','Dry Goods','Bread & Bakery','Dairy','Baby & Infant','Pantry Staples','Snacks','Hygiene','Cleaning Supplies','Other'],
  _units: ['cans','lbs','boxes','bags','bottles','jars','loaves','gallons','packs','pieces','pallets'],

  // Sort state — persists across filter changes within the same page visit
  _sort: { col: null, dir: 'asc' },
  _rerender: null,

  sortBy(col) {
    if (this._sort.col === col) {
      this._sort.dir = this._sort.dir === 'asc' ? 'desc' : 'asc';
    } else {
      this._sort.col = col;
      this._sort.dir = 'asc';
    }
    this._rerender?.();
  },

  _itemForm(i={}) {
    return `
      <div class="form-group"><label class="form-label">Item Name *</label><input class="form-control" id="pi-name" value="${UI.esc(i.name||'')}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Category</label>
          <select class="form-control" id="pi-cat">${this._cats.map(c=>`<option ${i.category===c?'selected':''}>${c}</option>`).join('')}</select>
        </div>
        <div class="form-group"><label class="form-label">Storage Location</label>
          <input class="form-control" id="pi-loc" value="${UI.esc(i.location||'')}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Quantity On Hand</label>
          <input class="form-control" id="pi-qty" type="number" min="0" value="${i.qty||0}">
        </div>
        <div class="form-group"><label class="form-label">Unit</label>
          <select class="form-control" id="pi-unit">${this._units.map(u=>`<option ${i.unit===u?'selected':''}>${u}</option>`).join('')}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Min Stock Level</label>
          <input class="form-control" id="pi-min" type="number" min="0" value="${i.minStock||0}">
        </div>
        <div class="form-group"><label class="form-label">Expiration Date</label>
          <input class="form-control" id="pi-exp" type="date" value="${i.expDate||''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Donor / Source</label>
          <input class="form-control" id="pi-donor" value="${UI.esc(i.donor||'')}">
        </div>
        <div class="form-group"><label class="form-label">Date Received</label>
          <input class="form-control" id="pi-rcv" type="date" value="${i.dateReceived||Storage.today()}">
        </div>
      </div>`;
  },
  _itemCollect() {
    return {
      name:         document.getElementById('pi-name')?.value.trim(),
      category:     document.getElementById('pi-cat')?.value,
      location:     document.getElementById('pi-loc')?.value.trim(),
      qty:          parseInt(document.getElementById('pi-qty')?.value)||0,
      unit:         document.getElementById('pi-unit')?.value,
      minStock:     parseInt(document.getElementById('pi-min')?.value)||0,
      expDate:      document.getElementById('pi-exp')?.value,
      donor:        document.getElementById('pi-donor')?.value.trim(),
      dateReceived: document.getElementById('pi-rcv')?.value,
    };
  },
  addItem() {
    Modal.open({ title:'+ Add Pantry Item', body:this._itemForm(), width:'540px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-pi-btn">Add Item</button>` });
    document.getElementById('save-pi-btn').onclick = () => {
      const d=this._itemCollect();
      if(!Validate.check([
        ['pi-name', Validate.required(d.name,'Item name')],
      ])) return;
      var _saved = Storage.insert('pantry_inventory',d);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) SupabaseDB.tableUpsert('pantry_inventory', _saved).catch(function(e){console.warn('[Sync]',e);});
      Modal.close(); Toast.success('Item added'); PantryMgr._rerender();
    };
  },
  edit(id) {
    const i=Storage.findById('pantry_inventory',id); if(!i) return;
    Modal.open({ title:'Edit Pantry Item', body:this._itemForm(i), width:'540px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-pi-btn">Save</button>` });
    document.getElementById('save-pi-btn').onclick = () => {
      var _updated = Storage.update('pantry_inventory',id,this._itemCollect());
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated() && _updated) SupabaseDB.tableUpsert('pantry_inventory', _updated).catch(function(e){console.warn('[Sync]',e);});
      Modal.close(); Toast.success('Updated'); PantryMgr._rerender();
    };
  },
  adjustQty(id) {
    const i=Storage.findById('pantry_inventory',id); if(!i) return;
    Modal.open({ title:`Adjust: ${i.name}`, width:'380px',
      body:`
        <div style="text-align:center;margin-bottom:16px;">
          <div style="font-size:2rem;font-weight:800;color:var(--accent)">${i.qty}</div>
          <div style="color:var(--text-muted);font-size:.84rem;">${i.unit} currently in stock</div>
        </div>
        <div class="form-group"><label class="form-label">Adjustment Amount (positive = add, negative = remove)</label>
          <input class="form-control" id="adj-qty" type="number" value="0">
        </div>
        <div class="form-group"><label class="form-label">Reason</label>
          <select class="form-control" id="adj-reason">
            <option>Received donation</option><option>Distribution to families</option>
            <option>Expired / discarded</option><option>Inventory correction</option><option>Transfer out</option>
          </select>
        </div>`,
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="adj-btn">Apply</button>` });
    document.getElementById('adj-btn').onclick = () => {
      const delta=parseInt(document.getElementById('adj-qty')?.value)||0;
      const newQty=Math.max(0,i.qty+delta);
      var _adjUpdated = Storage.update('pantry_inventory',id,{qty:newQty});
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated() && _adjUpdated) SupabaseDB.tableUpsert('pantry_inventory', _adjUpdated).catch(function(e){console.warn('[Sync]',e);});
      Modal.close(); Toast.success(`Quantity updated to ${newQty} ${i.unit}`); PantryMgr._rerender();
    };
  },
  remove(id) {
    UI.confirm('Remove this item from inventory?',()=>{
      Storage.removeItem('pantry_inventory',id);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) SupabaseDB.tableDelete('pantry_inventory', id).catch(function(e){console.warn('[Sync]',e);});
      Toast.success('Removed'); PantryMgr._rerender();
    });
  },
  addDistribution() {
    const body=`
      <div class="form-row">
        <div class="form-group"><label class="form-label">Date *</label><input class="form-control" id="pt-date" type="date" value="${Storage.today()}"></div>
        <div class="form-group"><label class="form-label">Families Served</label><input class="form-control" id="pt-fam" type="number" min="0" value="0"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Individuals Served</label><input class="form-control" id="pt-ind" type="number" min="0" value="0"></div>
        <div class="form-group"><label class="form-label">Volunteer Hours</label><input class="form-control" id="pt-hrs" type="number" min="0" value="0"></div>
      </div>
      <div class="form-group"><label class="form-label">Items Distributed (comma-separated)</label>
        <input class="form-control" id="pt-items">
      </div>
      <div class="form-group"><label class="form-label">Notes</label><textarea class="form-control" id="pt-notes"></textarea></div>`;
    Modal.open({ title:'📋 Log Distribution', body, width:'480px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-dist-btn">Save</button>` });
    document.getElementById('save-dist-btn').onclick = () => {
      const d={
        date:document.getElementById('pt-date').value,
        familiesServed:parseInt(document.getElementById('pt-fam').value)||0,
        individualServed:parseInt(document.getElementById('pt-ind').value)||0,
        volunteerHours:parseInt(document.getElementById('pt-hrs').value)||0,
        items:document.getElementById('pt-items').value.split(',').map(s=>s.trim()).filter(Boolean),
        notes:document.getElementById('pt-notes').value.trim(),
      };
      if(!Validate.check([
        ['pt-date', Validate.required(d.date,'Date')],
      ])) return;
      var _savedDist = Storage.insert('foodpantry',d);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) SupabaseDB.tableUpsert('foodpantry', _savedDist).catch(function(e){console.warn('[Sync]',e);});
      Modal.close(); Toast.success('Distribution logged'); PantryMgr._rerender();
    };
  },
  editDist(id) {
    const r=Storage.findById('foodpantry',id); if(!r) return;
    const body=`
      <div class="form-row">
        <div class="form-group"><label class="form-label">Date</label><input class="form-control" id="pt-date" type="date" value="${r.date}"></div>
        <div class="form-group"><label class="form-label">Families Served</label><input class="form-control" id="pt-fam" type="number" value="${r.familiesServed}"></div>
      </div>
      <div class="form-row">
        <div class="form-group">
        <div class="form-group"><label class="form-label">Individuals Served</label><input class="form-control" id="pt-ind" type="number" value="${r.individualServed||0}"></div>
        <div class="form-group"><label class="form-label">Volunteer Hours</label><input class="form-control" id="pt-hrs" type="number" value="${r.volunteerHours||0}"></div>
      </div>
      <div class="form-group"><label class="form-label">Items Distributed</label>
        <input class="form-control" id="pt-items" value="${(r.items||[]).join(', ')}">
      </div>
      <div class="form-group"><label class="form-label">Notes</label><textarea class="form-control" id="pt-notes">${UI.esc(r.notes||'')}</textarea></div>`;
    Modal.open({ title:'Edit Distribution', body, width:'480px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-dist-btn">Save</button>` });
    document.getElementById('save-dist-btn').onclick = () => {
      var _updatedDist = Storage.update('foodpantry', id, {
        date: document.getElementById('pt-date').value,
        familiesServed: parseInt(document.getElementById('pt-fam').value)||0,
        individualServed: parseInt(document.getElementById('pt-ind').value)||0,
        volunteerHours: parseInt(document.getElementById('pt-hrs').value)||0,
        items: document.getElementById('pt-items').value.split(',').map(s=>s.trim()).filter(Boolean),
        notes: document.getElementById('pt-notes').value.trim(),
      });
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated() && _updatedDist) SupabaseDB.tableUpsert('foodpantry', _updatedDist).catch(function(e){console.warn('[Sync]',e);});
      Modal.close(); Toast.success('Updated'); PantryMgr._rerender();
    };
  },
  removeDist(id) {
    UI.confirm('Remove this distribution record?', () => {
      Storage.removeItem('foodpantry', id);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) SupabaseDB.tableDelete('foodpantry', id).catch(function(e){console.warn('[Sync]',e);});
      Toast.success('Removed'); PantryMgr._rerender();
    });
  },
};
window.PantryMgr = PantryMgr;

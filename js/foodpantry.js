/* =============================================================
   foodpantry.js  -- Food Pantry Inventory + Box Builder (MRP)
   ============================================================= */

(function seedPantryInventory() {
  if (Storage.get('_pantry_inv_seeded')) return;
  const uid = Storage.uid, today = Storage.today;
  const items = [
    { id: uid(), name: 'Canned Green Beans',   category: 'Canned Vegetables', qty: 84, unit: 'cans',    minStock: 24, expDate: today(210), location: 'Shelf A1', donor: 'Community Food Drive', dateReceived: today(-14) },
    { id: uid(), name: 'Canned Corn',           category: 'Canned Vegetables', qty: 62, unit: 'cans',    minStock: 24, expDate: today(240), location: 'Shelf A1', donor: 'Kroger Donation',      dateReceived: today(-7)  },
    { id: uid(), name: 'Canned Tomatoes',       category: 'Canned Vegetables', qty: 18, unit: 'cans',    minStock: 24, expDate: today(180), location: 'Shelf A2', donor: 'Anonymous',             dateReceived: today(-21) },
    { id: uid(), name: 'Canned Tuna',           category: 'Canned Protein',    qty: 45, unit: 'cans',    minStock: 20, expDate: today(300), location: 'Shelf B1', donor: 'Community Food Drive',  dateReceived: today(-14) },
    { id: uid(), name: 'Peanut Butter',         category: 'Canned Protein',    qty: 12, unit: 'jars',    minStock: 15, expDate: today(120), location: 'Shelf B2', donor: 'Wilson Family',         dateReceived: today(-5)  },
    { id: uid(), name: 'Canned Chicken',        category: 'Canned Protein',    qty: 30, unit: 'cans',    minStock: 20, expDate: today(270), location: 'Shelf B1', donor: 'Food Bank Transfer',    dateReceived: today(-10) },
    { id: uid(), name: 'Pasta (Spaghetti)',      category: 'Dry Goods',         qty: 55, unit: 'lbs',     minStock: 20, expDate: today(365), location: 'Shelf C1', donor: 'Community Food Drive',  dateReceived: today(-14) },
    { id: uid(), name: 'Rice (Long Grain)',      category: 'Dry Goods',         qty: 40, unit: 'lbs',     minStock: 25, expDate: today(730), location: 'Shelf C1', donor: 'Multiple',              dateReceived: today(-7)  },
    { id: uid(), name: 'Instant Oatmeal',       category: 'Dry Goods',         qty: 28, unit: 'boxes',   minStock: 15, expDate: today(200), location: 'Shelf C2', donor: 'Walmart Donation',      dateReceived: today(-3)  },
    { id: uid(), name: 'Whole Wheat Bread',     category: 'Bread & Bakery',    qty: 8,  unit: 'loaves',  minStock: 10, expDate: today(5),   location: 'Fridge 1', donor: 'Panera Bread',          dateReceived: today(-1)  },
    { id: uid(), name: 'Sandwich Bread',        category: 'Bread & Bakery',    qty: 6,  unit: 'loaves',  minStock: 10, expDate: today(4),   location: 'Fridge 1', donor: 'Panera Bread',          dateReceived: today(-1)  },
    { id: uid(), name: '2% Milk',               category: 'Dairy',             qty: 10, unit: 'gallons', minStock: 8,  expDate: today(6),   location: 'Fridge 2', donor: 'Garcia Family',         dateReceived: today(-1)  },
    { id: uid(), name: 'Cheddar Cheese',        category: 'Dairy',             qty: 5,  unit: 'lbs',     minStock: 5,  expDate: today(18),  location: 'Fridge 2', donor: 'Local Dairy',           dateReceived: today(-3)  },
    { id: uid(), name: 'Baby Formula',          category: 'Baby & Infant',     qty: 6,  unit: 'cans',    minStock: 8,  expDate: today(90),  location: 'Shelf D1', donor: 'Anonymous',             dateReceived: today(-10) },
    { id: uid(), name: 'Diapers (Size 2)',      category: 'Baby & Infant',     qty: 4,  unit: 'packs',   minStock: 6,  expDate: today(999), location: 'Shelf D1', donor: 'Anonymous',             dateReceived: today(-7)  },
    { id: uid(), name: 'Cooking Oil',           category: 'Pantry Staples',    qty: 14, unit: 'bottles', minStock: 10, expDate: today(300), location: 'Shelf E1', donor: 'Community Food Drive',  dateReceived: today(-14) },
    { id: uid(), name: 'Canned Soup (Chicken)', category: 'Canned Soups',      qty: 72, unit: 'cans',    minStock: 30, expDate: today(365), location: 'Shelf A3', donor: 'Multiple',              dateReceived: today(-7)  },
    { id: uid(), name: 'Canned Soup (Tomato)',  category: 'Canned Soups',      qty: 48, unit: 'cans',    minStock: 30, expDate: today(365), location: 'Shelf A3', donor: 'Multiple',              dateReceived: today(-7)  },
    { id: uid(), name: 'Cereal (Cheerios)',     category: 'Dry Goods',         qty: 22, unit: 'boxes',   minStock: 12, expDate: today(150), location: 'Shelf C3', donor: 'Walmart Donation',      dateReceived: today(-5)  },
    { id: uid(), name: 'Applesauce Cups',       category: 'Snacks',            qty: 36, unit: 'packs',   minStock: 20, expDate: today(180), location: 'Shelf E2', donor: 'Thompson Family',       dateReceived: today(-4)  },
    { id: uid(), name: 'Ramen Noodles',         category: 'Dry Goods',         qty: 96, unit: 'packs',   minStock: 40, expDate: today(400), location: 'Shelf C2', donor: 'Community Food Drive',  dateReceived: today(-14) },
    { id: uid(), name: 'Mac & Cheese (Box)',    category: 'Dry Goods',         qty: 44, unit: 'boxes',   minStock: 20, expDate: today(300), location: 'Shelf C3', donor: 'Multiple',              dateReceived: today(-7)  },
    { id: uid(), name: 'Canned Beans (Black)',  category: 'Canned Vegetables', qty: 50, unit: 'cans',    minStock: 24, expDate: today(400), location: 'Shelf A2', donor: 'Community Food Drive',  dateReceived: today(-14) },
    { id: uid(), name: 'Canned Beans (Kidney)', category: 'Canned Vegetables', qty: 38, unit: 'cans',    minStock: 24, expDate: today(400), location: 'Shelf A2', donor: 'Multiple',              dateReceived: today(-10) },
  ];
  Storage.saveAll('pantry_inventory', items);

  const distributions = [
    { id: uid(), date: today(-2),  familiesServed: 34, individualServed: 89, volunteerHours: 18, items: ['Canned goods','Bread','Produce','Dairy'], notes: 'Record turnout this week', createdAt: today(-2) },
    { id: uid(), date: today(-9),  familiesServed: 28, individualServed: 74, volunteerHours: 14, items: ['Canned goods','Pasta','Cereal'],           notes: '', createdAt: today(-9) },
    { id: uid(), date: today(-16), familiesServed: 31, individualServed: 82, volunteerHours: 15, items: ['Canned goods','Bread','Protein'],          notes: '', createdAt: today(-16) },
    { id: uid(), date: today(-23), familiesServed: 25, individualServed: 68, volunteerHours: 12, items: ['Canned goods','Produce'],                  notes: 'Low on protein items', createdAt: today(-23) },
    { id: uid(), date: today(-30), familiesServed: 29, individualServed: 77, volunteerHours: 16, items: ['Canned goods','Bread','Dairy'],            notes: '', createdAt: today(-30) },
  ];
  if (!Storage.get('_seeded')) Storage.saveAll('foodpantry', distributions);

  if (!Storage.get('_pantry_templates_seeded')) {
    const templates = [
      { id: uid(), name: 'Standard Distribution Box', description: 'Full monthly box for a family of 4', color: 'blue',
        items: [
          { itemName: 'Canned Tuna',          qty: 2, unit: 'cans' },
          { itemName: 'Canned Green Beans',    qty: 2, unit: 'cans' },
          { itemName: 'Canned Soup (Chicken)', qty: 1, unit: 'can'  },
          { itemName: 'Pasta (Spaghetti)',     qty: 1, unit: 'lb'   },
          { itemName: 'Rice (Long Grain)',     qty: 1, unit: 'lb'   },
          { itemName: 'Cereal (Cheerios)',     qty: 1, unit: 'box'  },
          { itemName: 'Mac & Cheese (Box)',    qty: 1, unit: 'box'  },
          { itemName: 'Canned Beans (Black)',  qty: 1, unit: 'can'  },
        ],
      },
      { id: uid(), name: 'Senior Box', description: 'Lighter portions for senior clients', color: 'green',
        items: [
          { itemName: 'Canned Chicken',       qty: 1, unit: 'can'  },
          { itemName: 'Canned Green Beans',   qty: 1, unit: 'can'  },
          { itemName: 'Canned Soup (Tomato)', qty: 1, unit: 'can'  },
          { itemName: 'Instant Oatmeal',      qty: 1, unit: 'box'  },
          { itemName: 'Applesauce Cups',      qty: 1, unit: 'pack' },
          { itemName: 'Rice (Long Grain)',    qty: 1, unit: 'lb'   },
        ],
      },
      { id: uid(), name: 'Drop-In Box', description: 'Quick walk-in assistance for immediate needs', color: 'orange',
        items: [
          { itemName: 'Canned Soup (Chicken)', qty: 1, unit: 'can'   },
          { itemName: 'Peanut Butter',         qty: 1, unit: 'jar'   },
          { itemName: 'Ramen Noodles',         qty: 3, unit: 'packs' },
          { itemName: 'Mac & Cheese (Box)',    qty: 1, unit: 'box'   },
        ],
      },
      { id: uid(), name: 'Holiday Box', description: 'Special seasonal distribution', color: 'purple',
        items: [
          { itemName: 'Canned Chicken',       qty: 2, unit: 'cans'   },
          { itemName: 'Canned Green Beans',   qty: 2, unit: 'cans'   },
          { itemName: 'Canned Corn',          qty: 2, unit: 'cans'   },
          { itemName: 'Rice (Long Grain)',    qty: 2, unit: 'lbs'    },
          { itemName: 'Mac & Cheese (Box)',   qty: 1, unit: 'box'    },
          { itemName: 'Applesauce Cups',      qty: 1, unit: 'pack'   },
          { itemName: 'Cooking Oil',          qty: 1, unit: 'bottle' },
        ],
      },
    ];
    Storage.saveAll('pantry_box_templates', templates);
    Storage.set('_pantry_templates_seeded', true);
  }
  Storage.set('_pantry_inv_seeded', true);
})();

// Seed templates for users whose inventory was already seeded before templates existed
(function seedTemplatesStandalone() {
  if (Storage.get('_pantry_templates_seeded')) return;
  const uid = Storage.uid;
  const templates = [
    { id: uid(), name: 'Standard Distribution Box', description: 'Full monthly box for a family of 4', color: 'blue',
      items: [
        { itemName: 'Canned Tuna',          qty: 2, unit: 'cans' },
        { itemName: 'Canned Green Beans',   qty: 2, unit: 'cans' },
        { itemName: 'Canned Soup (Chicken)', qty: 1, unit: 'can'  },
        { itemName: 'Pasta (Spaghetti)',    qty: 1, unit: 'lb'   },
        { itemName: 'Rice (Long Grain)',    qty: 1, unit: 'lb'   },
        { itemName: 'Cereal (Cheerios)',    qty: 1, unit: 'box'  },
        { itemName: 'Mac & Cheese (Box)',   qty: 1, unit: 'box'  },
        { itemName: 'Canned Beans (Black)', qty: 1, unit: 'can'  },
      ],
    },
    { id: uid(), name: 'Senior Box', description: 'Lighter portions for senior clients', color: 'green',
      items: [
        { itemName: 'Canned Chicken',       qty: 1, unit: 'can'  },
        { itemName: 'Canned Green Beans',   qty: 1, unit: 'can'  },
        { itemName: 'Canned Soup (Tomato)', qty: 1, unit: 'can'  },
        { itemName: 'Instant Oatmeal',      qty: 1, unit: 'box'  },
        { itemName: 'Applesauce Cups',      qty: 1, unit: 'pack' },
        { itemName: 'Rice (Long Grain)',    qty: 1, unit: 'lb'   },
      ],
    },
    { id: uid(), name: 'Drop-In Box', description: 'Quick walk-in assistance for immediate needs', color: 'orange',
      items: [
        { itemName: 'Canned Soup (Chicken)', qty: 1, unit: 'can'   },
        { itemName: 'Peanut Butter',         qty: 1, unit: 'jar'   },
        { itemName: 'Ramen Noodles',         qty: 3, unit: 'packs' },
        { itemName: 'Mac & Cheese (Box)',    qty: 1, unit: 'box'   },
      ],
    },
    { id: uid(), name: 'Holiday Box', description: 'Special seasonal distribution', color: 'purple',
      items: [
        { itemName: 'Canned Chicken',      qty: 2, unit: 'cans'   },
        { itemName: 'Canned Green Beans',  qty: 2, unit: 'cans'   },
        { itemName: 'Canned Corn',         qty: 2, unit: 'cans'   },
        { itemName: 'Rice (Long Grain)',   qty: 2, unit: 'lbs'    },
        { itemName: 'Mac & Cheese (Box)',  qty: 1, unit: 'box'    },
        { itemName: 'Applesauce Cups',     qty: 1, unit: 'pack'   },
        { itemName: 'Cooking Oil',         qty: 1, unit: 'bottle' },
      ],
    },
    { id: uid(), name: "Children's Box", description: 'Kid-friendly items for families with young children', color: 'red',
      items: [
        { itemName: 'Mac & Cheese (Box)',   qty: 2, unit: 'boxes'  },
        { itemName: 'Applesauce Cups',      qty: 1, unit: 'pack'   },
        { itemName: 'Cereal (Cheerios)',    qty: 1, unit: 'box'    },
        { itemName: 'Peanut Butter',        qty: 1, unit: 'jar'    },
        { itemName: 'Ramen Noodles',        qty: 2, unit: 'packs'  },
        { itemName: 'Canned Soup (Chicken)', qty: 1, unit: 'can'   },
      ],
    },
  ];
  const existing = Storage.getAll('pantry_box_templates') || [];
  if (!existing.length) Storage.saveAll('pantry_box_templates', templates);
  Storage.set('_pantry_templates_seeded', true);
})();

Navigation.register('foodpantry', function render(page) {
  const inventory = Storage.getAll('pantry_inventory');
  const distributions = Storage.getAll('foodpantry').sort((a,b) => b.date.localeCompare(a.date));
  const today = Storage.today();

  const lowStock     = inventory.filter(i => i.qty <= i.minStock);
  const expiringSoon = inventory.filter(i => i.expDate && i.expDate <= Storage.today(14) && i.qty > 0);
  const totalItems   = inventory.reduce((s,i) => s+i.qty, 0);
  const cats         = [...new Set(inventory.map(i=>i.category))].sort();

  let activeTab = Storage.get('_pantryTab') || 'inventory';

  // ---- renderInventoryTable ------------------------------------------
  function renderInventoryTable(data) {
    if (!data.length) return '<div class="empty-state"><div class="empty-state-icon">📦</div><div class="empty-state-title">No items found</div></div>';
    const { col: sortCol, dir: sortDir } = PantryMgr._sort;
    function thIcon(key) {
      if (sortCol !== key) return '<span style="opacity:.25;font-size:.7rem;margin-left:3px;">&#8597;</span>';
      return '<span style="font-size:.75rem;margin-left:3px;color:var(--accent)">' + (sortDir==='asc'?'&#8593;':'&#8595;') + '</span>';
    }
    function th(label, key) {
      const active = sortCol===key;
      return '<th aria-sort="' + (active?(sortDir==='asc'?'ascending':'descending'):'none') + '" style="white-space:nowrap;' + (active?'color:var(--accent);':'') + '">'
        + '<button type="button" class="sort-btn" onclick="PantryMgr.sortBy(\'' + key + '\')">' + label + thIcon(key) + '</button></th>';
    }
    let rows = '';
    data.forEach(function(item) {
      const isLow      = item.qty <= item.minStock;
      const isExpiring = item.expDate && item.expDate <= Storage.today(14);
      const isExpired  = item.expDate && item.expDate < today;
      rows += '<tr style="' + (isLow||isExpiring||isExpired ? 'background:var(--accent-light)' : '') + '">'
        + '<td><strong>' + UI.esc(item.name) + '</strong>'
        + (isLow     ? ' <span class="badge badge-red">Low</span>'      : '')
        + (isExpired ? ' <span class="badge badge-red">Expired</span>'  : isExpiring ? ' <span class="badge badge-yellow">Expiring</span>' : '')
        + '</td>'
        + '<td><span class="badge badge-gray">' + UI.esc(item.category) + '</span></td>'
        + '<td><strong style="color:' + (isLow?'var(--red)':'var(--text)') + '">' + item.qty + '</strong></td>'
        + '<td>' + UI.esc(item.unit) + '</td>'
        + '<td style="color:var(--text-muted)">' + item.minStock + '</td>'
        + '<td style="color:' + (isExpired?'var(--red)':isExpiring?'var(--yellow)':'var(--text-muted)') + '">' + (item.expDate ? UI.fmtDate(item.expDate) : '&#8212;') + '</td>'
        + '<td style="font-size:.8rem">' + UI.esc(item.location||'&#8212;') + '</td>'
        + '<td style="font-size:.8rem;color:var(--text-muted)">' + UI.esc(item.donor||'&#8212;') + '</td>'
        + '<td>'
        + '<button class="btn btn-ghost btn-sm" onclick="PantryMgr.adjustQty(\'' + item.id + '\')">± Adjust</button> '
        + '<button class="btn btn-ghost btn-sm" onclick="PantryMgr.edit(\'' + item.id + '\')">Edit</button> '
        + '<button class="btn btn-ghost btn-sm" style="color:var(--red)" aria-label="Remove item" onclick="PantryMgr.remove(\'' + item.id + '\')">✕</button>'
        + '</td></tr>';
    });
    return '<div class="table-wrap"><table class="data-table"><thead><tr>'
      + th('Item','name') + th('Category','category') + th('Qty','qty') + th('Unit','unit')
      + th('Min Stock','minStock') + th('Expires','expDate') + th('Location','location') + th('Donor','donor')
      + '<th>Actions</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  // ---- renderDistributions -------------------------------------------
  function renderDistributions() {
    if (!distributions.length) return '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-title">No distributions recorded</div></div>';
    let rows = '';
    distributions.slice(0,20).forEach(function(r) {
      rows += '<tr>'
        + '<td>' + UI.fmtDate(r.date) + '<br><small style="color:var(--text-muted)">' + UI.relDate(r.date) + '</small></td>'
        + '<td style="text-align:center;font-weight:700;color:var(--accent)">' + r.familiesServed + '</td>'
        + '<td style="text-align:center">' + r.individualServed + '</td>'
        + '<td style="text-align:center">' + r.volunteerHours + '</td>'
        + '<td style="font-size:.8rem">' + (r.items||[]).join(', ') + '</td>'
        + '<td style="font-size:.8rem;color:var(--text-muted)">' + UI.esc(r.notes||'') + '</td>'
        + '<td>'
        + '<button class="btn btn-ghost btn-sm" onclick="PantryMgr.editDist(\'' + r.id + '\')">Edit</button> '
        + '<button class="btn btn-ghost btn-sm" style="color:var(--red)" aria-label="Remove distribution" onclick="PantryMgr.removeDist(\'' + r.id + '\')">✕</button>'
        + '</td></tr>';
    });
    return '<div style="margin-bottom:12px;display:flex;justify-content:flex-end;">'
      + '<button class="btn btn-primary" onclick="PantryMgr.addDistribution()">+ Log Distribution</button></div>'
      + '<div class="table-wrap"><table><thead><tr>'
      + '<th>Date</th><th>Families</th><th>Individuals</th><th>Vol. Hours</th><th>Items Given</th><th>Notes</th><th>Actions</th>'
      + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  // ---- renderBoxBuilder ----------------------------------------------
  function renderBoxBuilder() {
    const templates = Storage.getAll('pantry_box_templates') || [];
    const builds    = (Storage.getAll('pantry_build_orders') || []).sort((a,b)=>b.date.localeCompare(a.date));
    const colorMap  = { blue:'var(--accent)', green:'var(--green)', orange:'var(--orange)', purple:'#8b5cf6', red:'var(--red)' };

    // Template cards
    let tmplHTML = '';
    if (!templates.length) {
      tmplHTML = '<div class="empty-state"><div class="empty-state-icon">📦</div>'
        + '<div class="empty-state-title">No box templates yet</div>'
        + '<div class="empty-state-sub">Click &ldquo;+ New Template&rdquo; to define your first box type.</div></div>';
    } else {
      let cards = '';
      templates.forEach(function(t) {
        const accent = colorMap[t.color] || 'var(--accent)';
        let bom = '';
        (t.items||[]).forEach(function(it) {
          bom += '<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:.82rem;border-bottom:1px solid var(--border);">'
            + '<span>' + UI.esc(it.itemName) + '</span>'
            + '<strong style="color:var(--accent)">' + it.qty + ' ' + UI.esc(it.unit) + '</strong></div>';
        });
        cards += '<div class="card" style="border-top:3px solid ' + accent + ';">'
          + '<div class="flex-between" style="align-items:flex-start;margin-bottom:10px;">'
          + '<div><div style="font-weight:700;font-size:.96rem;margin-bottom:2px;">' + UI.esc(t.name) + '</div>'
          + '<div class="text-meta">' + UI.esc(t.description||'') + '</div></div>'
          + '<div style="display:flex;gap:4px;">'
          + '<button class="btn btn-ghost btn-sm" aria-label="Edit template" onclick="PantryMgr.editTemplate(\'' + t.id + '\')">'
          + '<i data-lucide="pencil" style="width:13px;height:13px" aria-hidden="true"></i></button>'
          + '<button class="btn btn-ghost btn-sm text-danger" aria-label="Delete template" onclick="PantryMgr.removeTemplate(\'' + t.id + '\')">'
          + '<i data-lucide="trash-2" style="width:13px;height:13px" aria-hidden="true"></i></button>'
          + '</div></div>'
          + '<div style="min-height:48px;margin-bottom:12px;">' + bom + '</div>'
          + '<div style="display:grid;grid-template-columns:1fr auto;gap:6px;margin-top:auto;">'
          + '<button class="btn btn-primary btn-sm" onclick="PantryMgr.buildBoxes(\'' + t.id + '\')">'
          + '<i data-lucide="package-plus" style="width:13px;height:13px" aria-hidden="true"></i> Build Order</button>'
          + '<button class="btn btn-outline btn-sm" title="Auto-Issue 1 box immediately" onclick="PantryMgr.quickIssue(\'' + t.id + '\')">'
          + '<i data-lucide="zap" style="width:13px;height:13px" aria-hidden="true"></i> Quick Issue</button>'
          + '</div>'
          + '</div>';
      });
      tmplHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">' + cards + '</div>';
    }

    // Planner
    let plannerHTML = '';
    if (templates.length) {
      let opts = '';
      templates.forEach(function(t) { opts += '<option value="' + t.id + '">' + UI.esc(t.name) + '</option>'; });
      plannerHTML = '<div class="card" style="margin-top:24px;">'
        + '<div class="card-header"><h3 class="card-title">'
        + '<i data-lucide="calculator" class="icon-inline" aria-hidden="true"></i>Monthly Distribution Planner</h3>'
        + '<span class="text-meta">Project items needed vs. current stock for a full run</span></div>'
        + '<div class="form-row" style="max-width:580px;align-items:flex-end;">'
        + '<div class="form-group"><label class="form-label">Box Template</label>'
        + '<select class="form-control" id="planner-tmpl" onchange="PantryMgr._runPlanner()">' + opts + '</select></div>'
        + '<div class="form-group"><label class="form-label">Target # of Boxes</label>'
        + '<input class="form-control" id="planner-qty" type="number" min="1" value="40" oninput="PantryMgr._runPlanner()"></div>'
        + '<div class="form-group"><button class="btn btn-outline" style="margin-top:22px;" onclick="PantryMgr._runPlanner()">'
        + '<i data-lucide="calculator" style="width:14px;height:14px" aria-hidden="true"></i> Calculate</button></div>'
        + '</div><div id="planner-output"></div></div>';
    }

    // History
    let histHTML = '';
    if (builds.length) {
      let rows = '';
      builds.slice(0,25).forEach(function(b) {
        const consumed = (b.itemsConsumed||[]).map(function(c){ return c.qty+' '+c.unit+' '+c.itemName; }).join(', ');
        rows += '<tr>'
          + '<td>' + UI.fmtDate(b.date) + '</td>'
          + '<td><strong>' + UI.esc(b.templateName) + '</strong></td>'
          + '<td style="text-align:center;font-weight:700;color:var(--accent)">' + b.quantity + '</td>'
          + '<td>' + UI.esc(b.builtBy||'&#8212;') + '</td>'
          + '<td style="font-size:.78rem;color:var(--text-muted)">' + UI.esc(consumed) + '</td>'
          + '<td style="font-size:.78rem">' + UI.esc(b.notes||'') + '</td>'
          + '</tr>';
      });
      histHTML = '<div class="card" style="margin-top:24px;">'
        + '<div class="card-header"><h3 class="card-title">'
        + '<i data-lucide="history" class="icon-inline" aria-hidden="true"></i>Build History</h3></div>'
        + '<div class="table-wrap"><table class="data-table" style="font-size:.83rem;">'
        + '<thead><tr><th>Date</th><th>Box Type</th><th>Qty Built</th><th>Built By</th><th>Items Consumed</th><th>Notes</th></tr></thead>'
        + '<tbody>' + rows + '</tbody></table></div></div>';
    }

    return '<div class="flex-between" style="margin-bottom:16px;">'
      + '<div><div style="font-weight:700;font-size:.95rem;">Box Templates &#8212; Bill of Materials</div>'
      + '<div class="text-meta">Build orders immediately deduct from pantry inventory on confirm</div></div>'
      + '<button class="btn btn-primary" onclick="PantryMgr.addTemplate()">+ New Template</button></div>'
      + tmplHTML + plannerHTML + histHTML;
  }

  // ---- renderTabContent ----------------------------------------------
  function renderTabContent() {
    if (activeTab === 'inventory')    return renderInventoryTable(inventory);
    if (activeTab === 'distributions') return renderDistributions();
    if (activeTab === 'lowstock') {
      const alerts = [
        ...lowStock.map(i=>({...i,alertType:'low'})),
        ...expiringSoon.filter(i=>!lowStock.find(l=>l.id===i.id)).map(i=>({...i,alertType:'expiring'})),
      ];
      if (!alerts.length) return '<div class="empty-state"><div class="empty-state-icon">&#9989;</div><div class="empty-state-title">No alerts &#8212; pantry is well stocked!</div></div>';
      let cards = '';
      alerts.forEach(function(i) {
        cards += '<div class="card" style="border-left:3px solid ' + (i.alertType==='low'?'var(--red)':'var(--yellow)') + '">'
          + '<div style="font-weight:700;margin-bottom:6px;">' + UI.esc(i.name) + '</div>'
          + '<div style="font-size:.82rem;color:var(--text-muted);margin-bottom:8px;">' + UI.esc(i.category) + ' &middot; ' + UI.esc(i.location) + '</div>'
          + (i.alertType==='low' ? '<div style="color:var(--red);font-size:.84rem;">&#9888; Only <strong>' + i.qty + ' ' + i.unit + '</strong> remaining (min: ' + i.minStock + ')</div>' : '')
          + (i.alertType==='expiring' ? '<div style="color:var(--yellow);font-size:.84rem;">&#9200; Expires <strong>' + UI.fmtDate(i.expDate) + '</strong> (' + UI.relDate(i.expDate) + ')</div>' : '')
          + '<div style="margin-top:10px;display:flex;gap:6px;">'
          + '<button class="btn btn-primary btn-sm" onclick="PantryMgr.adjustQty(\'' + i.id + '\')">+ Restock</button> '
          + '<button class="btn btn-ghost btn-sm" onclick="PantryMgr.edit(\'' + i.id + '\')">Edit</button>'
          + '</div></div>';
      });
      return '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;">' + cards + '</div>';
    }
    if (activeTab === 'boxbuilder') return renderBoxBuilder();
    return '';
  }

  const tabList = [
    ['inventory','📦 Inventory'],['distributions','📋 Distributions'],
    ['lowstock','⚠️ Alerts'],['boxbuilder','🔨 Box Builder'],
  ];

  page.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">🫙 Food Pantry Management</h2>
        <div class="section-subtitle">Inventory · Donations · Distribution tracking</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="PantryMgr.addItem()">+ Add Item</button>
        <button class="btn btn-outline" onclick="PantryMgr.addDistribution()">📋 Log Distribution</button>
      </div>
    </div>

    ${(lowStock.length||expiringSoon.length) ? `
      <div style="background:var(--surface);border:1px solid var(--yellow);border-left:4px solid var(--yellow);border-radius:var(--radius);padding:12px 16px;margin-bottom:20px;display:flex;gap:16px;flex-wrap:wrap;align-items:center;">
        <span style="font-size:1.2rem;">⚠️</span>
        <div style="flex:1;font-size:.86rem;">
          ${lowStock.length ? `<strong>${lowStock.length} item${lowStock.length>1?'s':''} below minimum stock:</strong> ${lowStock.map(i=>i.name).join(', ')}. ` : ''}
          ${expiringSoon.length ? `<strong>${expiringSoon.length} item${expiringSoon.length>1?'s':''} expiring within 14 days:</strong> ${expiringSoon.map(i=>i.name).join(', ')}.` : ''}
        </div>
      </div>` : ''}

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

    <div style="display:flex;gap:0;border-bottom:2px solid var(--border);margin-bottom:20px;">
      ${tabList.map(([id,lbl])=>`
        <button class="pantry-tab ${activeTab===id?'active':''}" data-ptab="${id}"
          style="padding:10px 18px;border:none;background:none;font-size:.88rem;font-weight:600;
          color:${activeTab===id?'var(--accent)':'var(--text-muted)'};
          border-bottom:${activeTab===id?'2px solid var(--accent)':'2px solid transparent'};
          margin-bottom:-2px;cursor:pointer;transition:all .15s;">${lbl}</button>
      `).join('')}
    </div>

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

    <div id="pantry-tab-content">${renderTabContent()}</div>
  `;

  page.querySelectorAll('.pantry-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.ptab;
      Storage.set('_pantryTab', activeTab);
      page.querySelectorAll('.pantry-tab').forEach(b => {
        b.style.color       = b.dataset.ptab===activeTab ? 'var(--accent)' : 'var(--text-muted)';
        b.style.borderBottom= b.dataset.ptab===activeTab ? '2px solid var(--accent)' : '2px solid transparent';
      });
      document.getElementById('pantry-tab-content').innerHTML = renderTabContent();
      const toolbar = document.getElementById('pantry-toolbar');
      if (toolbar) toolbar.style.display = activeTab==='inventory' ? '' : 'none';
      wireInventorySearch();
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  });

  function wireInventorySearch() {
    document.getElementById('pantry-search')?.addEventListener('input', filterAndRender);
    document.getElementById('pantry-cat-filter')?.addEventListener('change', filterAndRender);
    document.getElementById('pantry-stock-filter')?.addEventListener('change', filterAndRender);
  }

  function filterAndRender() {
    const q   = document.getElementById('pantry-search')?.value.toLowerCase() || '';
    const cat = document.getElementById('pantry-cat-filter')?.value || '';
    const st  = document.getElementById('pantry-stock-filter')?.value || '';
    let data  = [...inventory];
    if (q)   data = data.filter(i => (i.name+' '+i.category+' '+(i.donor||'')+' '+(i.location||'')).toLowerCase().includes(q));
    if (cat) data = data.filter(i => i.category === cat);
    if (st==='low')      data = data.filter(i => i.qty <= i.minStock);
    if (st==='expiring') data = data.filter(i => i.expDate && i.expDate <= Storage.today(14));
    if (st==='ok')       data = data.filter(i => i.qty > i.minStock);
    const { col, dir } = PantryMgr._sort;
    if (col) {
      const numCols = new Set(['qty','minStock']);
      data.sort((a, b) => {
        let av = a[col], bv = b[col];
        if (av==null||av==='') return 1;
        if (bv==null||bv==='') return -1;
        const cmp = numCols.has(col) ? av-bv : String(av).localeCompare(String(bv));
        return dir==='asc' ? cmp : -cmp;
      });
    }
    document.getElementById('pantry-tab-content').innerHTML = renderInventoryTable(data);
  }

  PantryMgr._rerender = () => Navigation.navigate('foodpantry');
  wireInventorySearch();
  if (typeof lucide !== 'undefined') lucide.createIcons();
});

// ================================================================
//  PantryMgr  — global CRUD + Box Builder methods
// ================================================================
const PantryMgr = {
  _sort:  { col: null, dir: 'asc' },
  _rerender: null,
  _cats:  ['Canned Vegetables','Canned Protein','Canned Soups','Dry Goods','Bread & Bakery','Dairy','Baby & Infant','Pantry Staples','Snacks','Hygiene','Cleaning Supplies','Other'],
  _units: ['cans','lbs','boxes','bags','bottles','jars','loaves','gallons','packs','pieces','pallets'],

  sortBy(col) {
    if (this._sort.col===col) { this._sort.dir = this._sort.dir==='asc'?'desc':'asc'; }
    else { this._sort.col=col; this._sort.dir='asc'; }
    this._rerender?.();
  },

  _itemForm(i={}) {
    return '<div class="form-group"><label class="form-label">Item Name *</label>'
      + '<input class="form-control" id="pi-name" value="' + UI.esc(i.name||'') + '"></div>'
      + '<div class="form-row">'
      + '<div class="form-group"><label class="form-label">Category</label>'
      + '<select class="form-control" id="pi-cat">' + this._cats.map(c=>'<option '+(i.category===c?'selected':'')+'>'+c+'</option>').join('') + '</select></div>'
      + '<div class="form-group"><label class="form-label">Storage Location</label>'
      + '<input class="form-control" id="pi-loc" value="' + UI.esc(i.location||'') + '"></div></div>'
      + '<div class="form-row">'
      + '<div class="form-group"><label class="form-label">Quantity On Hand</label>'
      + '<input class="form-control" id="pi-qty" type="number" min="0" value="' + (i.qty||0) + '"></div>'
      + '<div class="form-group"><label class="form-label">Unit</label>'
      + '<select class="form-control" id="pi-unit">' + this._units.map(u=>'<option '+(i.unit===u?'selected':'')+'>'+u+'</option>').join('') + '</select></div></div>'
      + '<div class="form-row">'
      + '<div class="form-group"><label class="form-label">Min Stock Level</label>'
      + '<input class="form-control" id="pi-min" type="number" min="0" value="' + (i.minStock||0) + '"></div>'
      + '<div class="form-group"><label class="form-label">Expiration Date</label>'
      + '<input class="form-control" id="pi-exp" type="date" value="' + (i.expDate||'') + '"></div></div>'
      + '<div class="form-row">'
      + '<div class="form-group"><label class="form-label">Donor / Source</label>'
      + '<input class="form-control" id="pi-donor" value="' + UI.esc(i.donor||'') + '"></div>'
      + '<div class="form-group"><label class="form-label">Date Received</label>'
      + '<input class="form-control" id="pi-rcv" type="date" value="' + (i.dateReceived||Storage.today()) + '"></div></div>';
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
      footer:'<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>'
            +'<button class="btn btn-primary" id="save-pi-btn">Add Item</button>' });
    document.getElementById('save-pi-btn').onclick = () => {
      const d = this._itemCollect();
      if (!Validate.check([['pi-name', Validate.required(d.name,'Item name')]])) return;
      const _saved = Storage.insert('pantry_inventory', d);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) {
        SupabaseDB.tableUpsert('pantry_inventory', _saved)
          .then(r => { if (r && !r.ok) Toast.error('Saved locally — cloud sync failed.'); })
          .catch(() => Toast.error('Saved locally — cloud sync failed.'));
      }
      Modal.close(); Toast.success('Item added'); PantryMgr._rerender();
    };
  },

  edit(id) {
    const i = Storage.findById('pantry_inventory', id); if (!i) return;
    Modal.open({ title:'Edit Pantry Item', body:this._itemForm(i), width:'540px',
      footer:'<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>'
            +'<button class="btn btn-primary" id="save-pi-btn">Save</button>' });
    document.getElementById('save-pi-btn').onclick = () => {
      const _upd = Storage.update('pantry_inventory', id, this._itemCollect());
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated() && _upd) {
        SupabaseDB.tableUpsert('pantry_inventory', _upd)
          .then(r => { if (r && !r.ok) Toast.error('Saved locally — cloud sync failed.'); })
          .catch(() => Toast.error('Saved locally — cloud sync failed.'));
      }
      Modal.close(); Toast.success('Updated'); PantryMgr._rerender();
    };
  },

  adjustQty(id) {
    const i = Storage.findById('pantry_inventory', id); if (!i) return;
    Modal.open({ title:'Adjust: '+UI.esc(i.name), width:'380px',
      body: '<div style="text-align:center;margin-bottom:16px;">'
          + '<div style="font-size:2rem;font-weight:800;color:var(--accent)">'+i.qty+'</div>'
          + '<div style="color:var(--text-muted);font-size:.84rem;">'+i.unit+' currently in stock</div></div>'
          + '<div class="form-group"><label class="form-label">Adjustment (positive = add, negative = remove)</label>'
          + '<input class="form-control" id="adj-qty" type="number" value="0"></div>'
          + '<div class="form-group"><label class="form-label">Reason</label>'
          + '<select class="form-control" id="adj-reason">'
          + '<option>Received donation</option><option>Distribution to families</option>'
          + '<option>Expired / discarded</option><option>Inventory correction</option><option>Transfer out</option>'
          + '</select></div>',
      footer:'<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>'
            +'<button class="btn btn-primary" id="adj-btn">Apply</button>' });
    document.getElementById('adj-btn').onclick = () => {
      const delta  = parseInt(document.getElementById('adj-qty')?.value)||0;
      const newQty = Math.max(0, i.qty+delta);
      const _adj   = Storage.update('pantry_inventory', id, { qty: newQty });
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated() && _adj) {
        SupabaseDB.tableUpsert('pantry_inventory', _adj)
          .then(r => { if (r && !r.ok) Toast.error('Saved locally — cloud sync failed.'); })
          .catch(() => Toast.error('Saved locally — cloud sync failed.'));
      }
      Modal.close(); Toast.success('Quantity updated to '+newQty+' '+i.unit); PantryMgr._rerender();
    };
  },

  remove(id) {
    UI.confirm('Remove this item from inventory?', () => {
      Storage.removeItem('pantry_inventory', id);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) {
        SupabaseDB.tableDelete('pantry_inventory', id)
          .then(r => { if (r && !r.ok) Toast.error('Saved locally — cloud sync failed.'); })
          .catch(() => Toast.error('Saved locally — cloud sync failed.'));
      }
      Toast.success('Removed'); PantryMgr._rerender();
    });
  },

  addDistribution() {
    const body = '<div class="form-row">'
      + '<div class="form-group"><label class="form-label">Date *</label><input class="form-control" id="pt-date" type="date" value="'+Storage.today()+'"></div>'
      + '<div class="form-group"><label class="form-label">Families Served</label><input class="form-control" id="pt-fam" type="number" min="0" value="0"></div></div>'
      + '<div class="form-row">'
      + '<div class="form-group"><label class="form-label">Individuals Served</label><input class="form-control" id="pt-ind" type="number" min="0" value="0"></div>'
      + '<div class="form-group"><label class="form-label">Volunteer Hours</label><input class="form-control" id="pt-hrs" type="number" min="0" value="0"></div></div>'
      + '<div class="form-group"><label class="form-label">Items Distributed (comma-separated)</label><input class="form-control" id="pt-items"></div>'
      + '<div class="form-group"><label class="form-label">Notes</label><textarea class="form-control" id="pt-notes"></textarea></div>';
    Modal.open({ title:'📋 Log Distribution', body, width:'480px',
      footer:'<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>'
            +'<button class="btn btn-primary" id="save-dist-btn">Save</button>' });
    document.getElementById('save-dist-btn').onclick = () => {
      const d = {
        date:             document.getElementById('pt-date').value,
        familiesServed:   parseInt(document.getElementById('pt-fam').value)||0,
        individualServed: parseInt(document.getElementById('pt-ind').value)||0,
        volunteerHours:   parseInt(document.getElementById('pt-hrs').value)||0,
        items: document.getElementById('pt-items').value.split(',').map(s=>s.trim()).filter(Boolean),
        notes: document.getElementById('pt-notes').value.trim(),
      };
      if (!Validate.check([['pt-date', Validate.required(d.date,'Date')]])) return;
      const _sd = Storage.insert('foodpantry', d);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) {
        SupabaseDB.tableUpsert('foodpantry', _sd)
          .then(r => { if (r && !r.ok) Toast.error('Saved locally — cloud sync failed.'); })
          .catch(() => Toast.error('Saved locally — cloud sync failed.'));
      }
      Modal.close(); Toast.success('Distribution logged'); PantryMgr._rerender();
    };
  },

  editDist(id) {
    const r = Storage.findById('foodpantry', id); if (!r) return;
    const body = '<div class="form-row">'
      + '<div class="form-group"><label class="form-label">Date</label><input class="form-control" id="pt-date" type="date" value="'+r.date+'"></div>'
      + '<div class="form-group"><label class="form-label">Families Served</label><input class="form-control" id="pt-fam" type="number" value="'+r.familiesServed+'"></div></div>'
      + '<div class="form-row">'
      + '<div class="form-group"><label class="form-label">Individuals Served</label><input class="form-control" id="pt-ind" type="number" value="'+(r.individualServed||0)+'"></div>'
      + '<div class="form-group"><label class="form-label">Volunteer Hours</label><input class="form-control" id="pt-hrs" type="number" value="'+(r.volunteerHours||0)+'"></div></div>'
      + '<div class="form-group"><label class="form-label">Items Distributed</label><input class="form-control" id="pt-items" value="'+(r.items||[]).join(', ')+'"></div>'
      + '<div class="form-group"><label class="form-label">Notes</label><textarea class="form-control" id="pt-notes">'+UI.esc(r.notes||'')+'</textarea></div>';
    Modal.open({ title:'Edit Distribution', body, width:'480px',
      footer:'<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>'
            +'<button class="btn btn-primary" id="save-dist-btn">Save</button>' });
    document.getElementById('save-dist-btn').onclick = () => {
      const _upd = Storage.update('foodpantry', id, {
        date:             document.getElementById('pt-date').value,
        familiesServed:   parseInt(document.getElementById('pt-fam').value)||0,
        individualServed: parseInt(document.getElementById('pt-ind').value)||0,
        volunteerHours:   parseInt(document.getElementById('pt-hrs').value)||0,
        items: document.getElementById('pt-items').value.split(',').map(s=>s.trim()).filter(Boolean),
        notes: document.getElementById('pt-notes').value.trim(),
      });
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated() && _upd) {
        SupabaseDB.tableUpsert('foodpantry', _upd)
          .then(r => { if (r && !r.ok) Toast.error('Saved locally — cloud sync failed.'); })
          .catch(() => Toast.error('Saved locally — cloud sync failed.'));
      }
      Modal.close(); Toast.success('Updated'); PantryMgr._rerender();
    };
  },

  removeDist(id) {
    UI.confirm('Remove this distribution record?', () => {
      Storage.removeItem('foodpantry', id);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) {
        SupabaseDB.tableDelete('foodpantry', id)
          .then(r => { if (r && !r.ok) Toast.error('Saved locally — cloud sync failed.'); })
          .catch(() => Toast.error('Saved locally — cloud sync failed.'));
      }
      Toast.success('Removed'); PantryMgr._rerender();
    });
  },

  // ----------------------------------------------------------------
  //  Box Builder methods
  // ----------------------------------------------------------------

  // Match inventory item by name (case-insensitive, includes both ways)
  _matchInv(inventory, bomName) {
    const lc = bomName.toLowerCase();
    return (inventory||[])
      .filter(inv => {
        const n = inv.name.toLowerCase();
        return n===lc || n.includes(lc) || lc.includes(n);
      })
      .sort((a,b) => b.qty-a.qty)[0] || null;
  },

  addTemplate() {
    Modal.open({ title:'+ New Box Template', body:PantryMgr._templateForm(), width:'560px',
      footer:'<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>'
            +'<button class="btn btn-primary" id="save-btmpl-btn">Create Template</button>' });
    document.getElementById('save-btmpl-btn').onclick = () => {
      const d = PantryMgr._collectTemplate();
      if (!d.name)         { Toast.error('Template name is required'); return; }
      if (!d.items.length) { Toast.error('Add at least one item to the BOM'); return; }
      Storage.insert('pantry_box_templates', d);
      Modal.close(); Toast.success('Template created');
      Storage.set('_pantryTab','boxbuilder'); Navigation.navigate('foodpantry');
    };
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  editTemplate(id) {
    const t = Storage.findById('pantry_box_templates', id); if (!t) return;
    Modal.open({ title:'Edit Box Template', body:PantryMgr._templateForm(t), width:'560px',
      footer:'<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>'
            +'<button class="btn btn-primary" id="save-btmpl-btn">Save Changes</button>' });
    document.getElementById('save-btmpl-btn').onclick = () => {
      const d = PantryMgr._collectTemplate();
      if (!d.name) { Toast.error('Template name is required'); return; }
      Storage.update('pantry_box_templates', id, d);
      Modal.close(); Toast.success('Template updated');
      Storage.set('_pantryTab','boxbuilder'); Navigation.navigate('foodpantry');
    };
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  removeTemplate(id) {
    UI.confirm('Remove this box template?', () => {
      Storage.removeItem('pantry_box_templates', id);
      Toast.success('Template removed');
      Storage.set('_pantryTab','boxbuilder'); Navigation.navigate('foodpantry');
    });
  },

  _templateForm(t={}) {
    const inventory = Storage.getAll('pantry_inventory') || [];
    const names = Array.from(new Set(inventory.map(i=>i.name))).sort();
    const datalist = '<datalist id="bb-items-list">'
      + names.map(n=>'<option value="'+UI.esc(n)+'">').join('') + '</datalist>';
    const colorOpts = ['blue','green','orange','purple','red'].map(c => {
      const label = c.charAt(0).toUpperCase()+c.slice(1);
      return '<option value="'+c+'"'+((t.color||'blue')===c?' selected':'')+'>'+label+'</option>';
    }).join('');
    let itemRows = '';
    (t.items||[]).forEach(it => {
      itemRows += '<div class="bb-item-row" style="display:grid;grid-template-columns:1fr 70px 80px 32px;gap:6px;margin-bottom:6px;">'
        + '<input class="form-control bb-item-name" list="bb-items-list" placeholder="Item name..." value="'+UI.esc(it.itemName||'')+'">'
        + '<input class="form-control bb-item-qty" type="number" min="0.5" step="0.5" placeholder="Qty" value="'+(it.qty||1)+'">'
        + '<input class="form-control bb-item-unit" placeholder="unit" value="'+UI.esc(it.unit||'')+'">'
        + '<button type="button" class="btn btn-ghost btn-sm text-danger" title="Remove row" onclick="this.closest(\'.bb-item-row\').remove()">'
        + '<i data-lucide="x" style="width:13px;height:13px" aria-hidden="true"></i></button></div>';
    });
    return datalist
      + '<div class="form-row">'
      + '<div class="form-group"><label class="form-label">Template Name *</label>'
      + '<input class="form-control" id="btmpl-name" value="'+UI.esc(t.name||'')+'"></div>'
      + '<div class="form-group"><label class="form-label">Color Tag</label>'
      + '<select class="form-control" id="btmpl-color">'+colorOpts+'</select></div></div>'
      + '<div class="form-group"><label class="form-label">Description</label>'
      + '<input class="form-control" id="btmpl-desc" value="'+UI.esc(t.description||'')+'"></div>'
      + '<div style="margin-top:16px;">'
      + '<div class="flex-between" style="margin-bottom:8px;">'
      + '<label class="form-label" style="margin:0;font-weight:700;">Bill of Materials (items per box)</label>'
      + '<button type="button" class="btn btn-outline btn-sm" onclick="PantryMgr._addBomRow()">+ Add Item</button></div>'
      + '<div style="display:grid;grid-template-columns:1fr 70px 80px 32px;gap:6px;margin-bottom:4px;font-size:.76rem;color:var(--text-muted);">'
      + '<span>Item Name</span><span>Qty/Box</span><span>Unit</span><span></span></div>'
      + '<div id="bom-rows">'+itemRows+'</div></div>';
  },

  _addBomRow() {
    const row = document.createElement('div');
    row.className = 'bb-item-row';
    row.style.cssText = 'display:grid;grid-template-columns:1fr 70px 80px 32px;gap:6px;margin-bottom:6px;';
    row.innerHTML = '<input class="form-control bb-item-name" list="bb-items-list" placeholder="Item name...">'
      + '<input class="form-control bb-item-qty" type="number" min="0.5" step="0.5" value="1">'
      + '<input class="form-control bb-item-unit" placeholder="unit">'
      + '<button type="button" class="btn btn-ghost btn-sm text-danger" onclick="this.closest(\'.bb-item-row\').remove()">'
      + '<i data-lucide="x" style="width:13px;height:13px" aria-hidden="true"></i></button>';
    const c = document.getElementById('bom-rows');
    if (c) { c.appendChild(row); if (typeof lucide !== 'undefined') lucide.createIcons(); }
  },

  _collectTemplate() {
    const rows = document.querySelectorAll('#bom-rows .bb-item-row');
    const items = [];
    rows.forEach(row => {
      const name = (row.querySelector('.bb-item-name')?.value||'').trim();
      const qty  = parseFloat(row.querySelector('.bb-item-qty')?.value)||1;
      const unit = (row.querySelector('.bb-item-unit')?.value||'').trim()||'pcs';
      if (name) items.push({ itemName:name, qty, unit });
    });
    return {
      name:        (document.getElementById('btmpl-name')?.value||'').trim(),
      description: (document.getElementById('btmpl-desc')?.value||'').trim(),
      color:       document.getElementById('btmpl-color')?.value||'blue',
      items,
    };
  },

  buildBoxes(templateId) {
    const template = Storage.findById('pantry_box_templates', templateId); if (!template) return;
    const inventory = Storage.getAll('pantry_inventory') || [];
    const lines = (template.items||[]).map(bomLine => {
      const best = PantryMgr._matchInv(inventory, bomLine.itemName);
      const inStock  = best ? best.qty : 0;
      const maxBuild = best ? Math.floor(inStock/bomLine.qty) : 0;
      return { bomLine, best, inStock, maxBuild };
    });
    const overallMax = lines.length ? Math.min(...lines.map(l=>l.maxBuild)) : 0;
    let tableRows = '';
    lines.forEach(l => {
      const ok = l.maxBuild > 0;
      tableRows += '<tr style="'+(ok?'':'background:var(--accent-light)')+'">'
        + '<td>'+UI.esc(l.bomLine.itemName)+'</td>'
        + '<td style="text-align:center">'+l.bomLine.qty+' '+UI.esc(l.bomLine.unit)+'</td>'
        + '<td style="text-align:center;font-weight:700;color:'+(l.inStock>0?'var(--text)':'var(--red)')+'">'+l.inStock+'</td>'
        + '<td style="font-size:.8rem">'+(l.best?UI.esc(l.best.name):'<span style="color:var(--red)">&#9888; Not in inventory</span>')+'</td>'
        + '<td style="text-align:center;font-weight:700;color:'+(ok?'#15803d':'var(--red)')+'">'+
          (l.best?(ok?'&#10003; up to '+l.maxBuild:'&#10007; Short'):'&#8212;')+'</td></tr>';
    });
    const defaultQty = Math.min(10, Math.max(1, overallMax||1));
    const banner = overallMax > 0
      ? '<div style="background:#22c55e22;border:1px solid #16a34a;border-radius:6px;padding:10px 14px;margin-bottom:14px;font-size:.84rem;color:#15803d">&#10003; Stock sufficient for up to <strong>'+overallMax+' box'+(overallMax!==1?'es':'')+'</strong>.</div>'
      : '<div style="background:var(--accent-light);border:1px solid var(--orange);border-radius:6px;padding:10px 14px;margin-bottom:14px;font-size:.84rem;color:var(--orange)">&#9888; One or more items are short. Review before building.</div>';
    const body = '<div class="form-row" style="margin-bottom:12px;">'
      + '<div class="form-group"><label class="form-label">Qty to Build</label>'
      + '<input class="form-control" id="build-qty" type="number" min="1" value="'+defaultQty+'"></div>'
      + '<div class="form-group"><label class="form-label">Date</label>'
      + '<input class="form-control" id="build-date" type="date" value="'+Storage.today()+'"></div>'
      + '<div class="form-group"><label class="form-label">Built By</label>'
      + '<input class="form-control" id="build-by" placeholder="Staff name..."></div></div>'
      + banner
      + '<div class="table-wrap" style="max-height:260px;overflow-y:auto;">'
      + '<table class="data-table" style="font-size:.82rem;">'
      + '<thead><tr><th>BOM Item</th><th>Per Box</th><th>In Stock</th><th>Matched Item</th><th>Max Buildable</th></tr></thead>'
      + '<tbody>'+tableRows+'</tbody></table></div>'
      + '<div class="form-group" style="margin-top:14px;"><label class="form-label">Notes (optional)</label>'
      + '<input class="form-control" id="build-notes" placeholder="Any notes..."></div>';
    Modal.open({ title:'&#128296; Build: '+UI.esc(template.name), body, width:'640px',
      footer:'<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>'
            +'<button class="btn btn-primary" onclick="PantryMgr._executeBuild(\''+templateId+'\')">'
            +'<i data-lucide="check-circle" style="width:14px;height:14px" aria-hidden="true"></i> Confirm &amp; Deduct Inventory</button>' });
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },


  _executeBuild(templateId) {
    const template = Storage.findById('pantry_box_templates', templateId); if (!template) return;
    const qty     = parseInt(document.getElementById('build-qty')?.value)||1;
    const date    = document.getElementById('build-date')?.value || Storage.today();
    const builtBy = (document.getElementById('build-by')?.value||'').trim();
    const notes   = (document.getElementById('build-notes')?.value||'').trim();
    const inventory = Storage.getAll('pantry_inventory') || [];
    const consumed  = [];
    (template.items||[]).forEach(function(bomLine) {
      const toConsume = bomLine.qty * qty;
      const best = PantryMgr._matchInv(inventory, bomLine.itemName);
      if (best) {
        Storage.update('pantry_inventory', best.id, { qty: Math.max(0, best.qty-toConsume) });
        consumed.push({ itemName:best.name, qty:toConsume, unit:bomLine.unit });
      }
    });
    Storage.insert('pantry_build_orders', {
      templateId, templateName:template.name, quantity:qty, date, builtBy, notes, itemsConsumed:consumed,
    });
    Modal.close();
    Toast.success('Built '+qty+' \xd7 '+template.name+' — inventory updated');
    Storage.set('_pantryTab','boxbuilder'); Navigation.navigate('foodpantry');
  },

  // ----------------------------------------------------------------
  //  Quick Issue — auto-pick items from inventory, issue immediately
  // ----------------------------------------------------------------
  quickIssue(templateId) {
    const template = Storage.findById('pantry_box_templates', templateId); if (!template) return;
    const inventory = Storage.getAll('pantry_inventory') || [];
    const picks = (template.items || []).map(function(bomLine) {
      const best = PantryMgr._matchInv(inventory, bomLine.itemName);
      return { bomLine: bomLine, best: best };
    });
    const missing = picks.filter(function(p) { return !p.best; });
    let pickList = '<div style="margin:10px 0 14px;border:1px solid var(--border);border-radius:6px;overflow:hidden;">';
    picks.forEach(function(p) {
      const found = !!p.best;
      pickList += '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 12px;'
        + 'border-bottom:1px solid var(--border);background:' + (found ? 'transparent' : 'var(--accent-light)') + '">'
        + '<span style="font-size:.83rem;">' + UI.esc(p.bomLine.itemName)
        + (found ? '' : ' <span style="color:var(--red);font-size:.75rem;">⚠ not found</span>') + '</span>'
        + '<span style="font-size:.83rem;font-weight:700;color:var(--accent)">'
        + p.bomLine.qty + ' ' + UI.esc(p.bomLine.unit) + '</span></div>';
    });
    pickList += '</div>';
    const banner = missing.length
      ? '<div style="background:var(--accent-light);border:1px solid var(--orange);border-radius:6px;padding:8px 12px;margin-bottom:10px;font-size:.82rem;color:var(--orange)">'
        + '⚠ ' + missing.length + ' item(s) not in inventory — they will be skipped.</div>'
      : '<div style="background:#22c55e22;border:1px solid #16a34a;border-radius:6px;padding:8px 12px;margin-bottom:10px;font-size:.82rem;color:#15803d">'
        + '✓ All items found — ready to issue.</div>';
    const body = '<div style="font-size:.88rem;color:var(--text-muted);margin-bottom:4px;">Items pulled per box:</div>'
      + pickList + banner
      + '<div class="form-row">'
      + '<div class="form-group"><label class="form-label">Qty to Issue</label>'
      + '<input class="form-control" id="qi-qty" type="number" min="1" value="1"></div>'
      + '<div class="form-group"><label class="form-label">Issued By</label>'
      + '<input class="form-control" id="qi-by" placeholder="Staff name..."></div></div>'
      + '<div class="form-group"><label class="form-label">Date</label>'
      + '<input class="form-control" id="qi-date" type="date" value="' + Storage.today() + '"></div>';
    Modal.open({ title: '⚡ Quick Issue: ' + UI.esc(template.name), body: body, width: '420px',
      footer: '<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>'
            + '<button class="btn btn-primary" onclick="PantryMgr._executeQuickIssue(\'' + templateId + '\')">'
            + '<i data-lucide="zap" style="width:13px;height:13px" aria-hidden="true"></i> Issue &amp; Deduct</button>' });
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  _executeQuickIssue(templateId) {
    const template = Storage.findById('pantry_box_templates', templateId); if (!template) return;
    const qty     = parseInt(document.getElementById('qi-qty')?.value) || 1;
    const builtBy = (document.getElementById('qi-by')?.value || '').trim();
    const date    = document.getElementById('qi-date')?.value || Storage.today();
    const inventory = Storage.getAll('pantry_inventory') || [];
    const consumed  = [];
    (template.items || []).forEach(function(bomLine) {
      const toConsume = bomLine.qty * qty;
      const best = PantryMgr._matchInv(inventory, bomLine.itemName);
      if (best) {
        Storage.update('pantry_inventory', best.id, { qty: Math.max(0, best.qty - toConsume) });
        consumed.push({ itemName: best.name, qty: toConsume, unit: bomLine.unit });
      }
    });
    Storage.insert('pantry_build_orders', {
      templateId: templateId, templateName: template.name,
      quantity: qty, date: date, builtBy: builtBy,
      notes: 'Quick Issue', itemsConsumed: consumed,
    });
    Modal.close();
    Toast.success('Issued ' + qty + ' \xd7 ' + template.name + ' — inventory updated');
    Storage.set('_pantryTab', 'boxbuilder'); Navigation.navigate('foodpantry');
  },

  // ----------------------------------------------------------------
  //  Monthly planner — gap analysis, in-place DOM update
  // ----------------------------------------------------------------
  _runPlanner() {
    const tmplEl = document.getElementById('planner-tmpl');
    const qtyEl  = document.getElementById('planner-qty');
    const output = document.getElementById('planner-output');
    if (!tmplEl || !qtyEl || !output) return;
    const templateId = tmplEl.value;
    const targetQty  = parseInt(qtyEl.value) || 0;
    if (!templateId || targetQty <= 0) { output.innerHTML = ''; return; }
    const template  = Storage.findById('pantry_box_templates', templateId); if (!template) return;
    const inventory = Storage.getAll('pantry_inventory') || [];
    const rows = (template.items || []).map(function(bomLine) {
      const needed = bomLine.qty * targetQty;
      const best   = PantryMgr._matchInv(inventory, bomLine.itemName);
      const onHand = best ? best.qty : 0;
      const gap    = needed - onHand;
      return { bomLine: bomLine, needed: needed, onHand: onHand, gap: gap };
    });
    const allOk = rows.every(function(r) { return r.gap <= 0; });
    const gaps  = rows.filter(function(r) { return r.gap > 0; });
    let tableRows = '';
    rows.forEach(function(r) {
      const ok = r.gap <= 0;
      tableRows += '<tr>'
        + '<td>' + UI.esc(r.bomLine.itemName) + '</td>'
        + '<td style="text-align:center">' + r.bomLine.qty + ' ' + UI.esc(r.bomLine.unit) + '/box</td>'
        + '<td style="text-align:center;font-weight:700">' + r.needed + '</td>'
        + '<td style="text-align:center">' + r.onHand + '</td>'
        + '<td style="text-align:center;font-weight:700;color:' + (ok ? '#15803d' : 'var(--red)') + '">'
        + (ok ? '✓ OK' : ('−' + r.gap + ' needed')) + '</td></tr>';
    });
    const banner = allOk
      ? '<div style="background:#22c55e22;border:1px solid #16a34a;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:.84rem;color:#15803d">'
        + '✓ You have enough stock to build all <strong>' + targetQty + '</strong> boxes!</div>'
      : '<div style="background:var(--accent-light);border:1px solid var(--orange);border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:.84rem;">'
        + '<strong>Donation Gap:</strong> '
        + gaps.map(function(r) { return '<strong>' + r.gap + ' ' + r.bomLine.unit + '</strong> of ' + UI.esc(r.bomLine.itemName); }).join(', ')
        + '</div>';
    output.innerHTML = banner
      + '<div class="table-wrap"><table class="data-table" style="font-size:.83rem;">'
      + '<thead><tr><th>Item</th><th>Per Box</th><th>Total Needed (' + targetQty + ' boxes)</th><th>On Hand</th><th>Status</th></tr></thead>'
      + '<tbody>' + tableRows + '</tbody></table></div>';
  },
};
window.PantryMgr = PantryMgr;

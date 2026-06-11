/* =============================================================
   request-inbox.js  —  Ministry Request Inbox (Private)
   Receives submissions from the public portal.
   Supports Supabase (authenticated staff) + localStorage fallback.
   ============================================================= */

(function seedRequestInbox() {
  if (Storage.get('_inbox_seeded')) return;
  const uid = Storage.uid, today = Storage.today;

  const demo = [
    {
      id: uid(), requestId: 'REQ-2841-KT',
      type: 'prayer', typeName: 'Prayer Request',
      status: 'Received', urgency: 'High',
      submittedAt: today(-1) + 'T09:14:00.000Z',
      lastUpdated: today(-1) + 'T09:14:00.000Z',
      assignedTo: '', internalNotes: '', followUpDate: '',
      data: { name:'Margaret Thompson', phone:'(555) 301-2244', email:'mthompson@email.com', request:'My husband was just diagnosed with stage 3 cancer. Please pray for healing and strength for our family during this time. Our children are scared.', isPrivate:false, shareTeam:true, urgency:'High', contactMethod:'Phone' }
    },
    {
      id: uid(), requestId: 'REQ-5572-DW',
      type: 'help', typeName: 'Request Help',
      status: 'Assigned', urgency: 'High',
      submittedAt: today(-2) + 'T14:30:00.000Z',
      lastUpdated: today(-1) + 'T10:00:00.000Z',
      assignedTo: 'Gloria Cooper', internalNotes: 'Called Gloria - she will reach out today. Family has 2 kids under 5.', followUpDate: today(2),
      data: { name:'Sandra Williams', phone:'(555) 482-9910', email:'', helpType:'Utilities', description:'Electricity was shut off yesterday. I have two small children at home. I lost my job last month and am behind on bills.', householdSize:'3', urgency:'High', contactMethod:'Phone' }
    },
    {
      id: uid(), requestId: 'REQ-7190-QR',
      type: 'pantry', typeName: 'Food Pantry',
      status: 'In Progress', urgency: 'Medium',
      submittedAt: today(-3) + 'T11:00:00.000Z',
      lastUpdated: today(-2) + 'T09:00:00.000Z',
      assignedTo: 'Nancy Garcia', internalNotes: 'Scheduled for Thursday pickup. Prepped bag with gluten-free items.', followUpDate: today(1),
      data: { name:'Robert Chen', phone:'(555) 677-4400', email:'rchen@email.com', householdSize:'4', dietaryRestrictions:'Gluten-free, one child has nut allergy', pickupDay:'Thursday', notes:'' }
    },
    {
      id: uid(), requestId: 'REQ-3315-BM',
      type: 'pastoral', typeName: 'Pastoral Care',
      status: 'Received', urgency: 'High',
      submittedAt: today(0) + 'T08:22:00.000Z',
      lastUpdated: today(0) + 'T08:22:00.000Z',
      assignedTo: '', internalNotes: '', followUpDate: '',
      data: { name:'Patricia Davis', phone:'(555) 290-1133', email:'pdavis@email.com', personName:'James Davis (husband)', location:'Mercy General Hospital, Room 412', visitType:'Hospital', urgency:'High', notes:'He had emergency surgery this morning. Family is asking for prayer and a pastoral visit as soon as possible.' }
    },
    {
      id: uid(), requestId: 'REQ-9904-SL',
      type: 'volunteer', typeName: 'Volunteer Interest',
      status: 'Followed Up', urgency: 'Low',
      submittedAt: today(-7) + 'T16:45:00.000Z',
      lastUpdated: today(-3) + 'T14:00:00.000Z',
      assignedTo: 'David Martinez', internalNotes: 'Reached out by email. Invited to Sunday orientation. Great fit for youth ministry.', followUpDate: today(7),
      data: { name:'Tyler Brooks', phone:'(555) 513-7722', email:'tyler.brooks@email.com', interests:['Youth Ministry','Outreach'], availability:'Weekday evenings', skills:'Former camp counselor, 3 years youth group experience', notes:'' }
    },
    {
      id: uid(), requestId: 'REQ-6601-FX',
      type: 'prayer', typeName: 'Prayer Request',
      status: 'Completed', urgency: 'Low',
      submittedAt: today(-10) + 'T10:00:00.000Z',
      lastUpdated: today(-5) + 'T09:00:00.000Z',
      assignedTo: 'Prayer Team', internalNotes: 'Added to Sunday prayer list for 2 weeks. Followed up by email.', followUpDate: '',
      data: { name:'Dorothy Harris', phone:'', email:'dharris@email.com', request:'Praying for my son to find a job. He has been struggling for months. Thank you.', isPrivate:false, shareTeam:true, urgency:'Low', contactMethod:'Email' }
    },
    {
      id: uid(), requestId: 'REQ-8823-NV',
      type: 'help', typeName: 'Request Help',
      status: 'Received', urgency: 'Medium',
      submittedAt: today(0) + 'T11:55:00.000Z',
      lastUpdated: today(0) + 'T11:55:00.000Z',
      assignedTo: '', internalNotes: '', followUpDate: '',
      data: { name:'Carlos Mendez', phone:'(555) 774-9988', email:'cmendez@email.com', helpType:'Transportation', description:"I need help getting to my dialysis appointments 3 times a week. I don't have a car and the bus doesn't run that early.", householdSize:'1', urgency:'Medium', contactMethod:'Phone' }
    },
  ];

  // Merge with any existing real submissions
  const existing = Storage.getAll('ministry_requests');
  const allIds = existing.map(r=>r.requestId);
  const toAdd = demo.filter(d=>!allIds.includes(d.requestId));
  const merged = [...existing, ...toAdd];
  Storage.saveAll('ministry_requests', merged);
  Storage.set('_inbox_seeded', true);
})();

Navigation.register('request-inbox', function render(page) {
  const today = Storage.today();

  // ── Use Supabase cache if authenticated; otherwise fall back to localStorage ──
  const sbEnabled = typeof SupabaseDB !== 'undefined' && SupabaseDB.isEnabled();
  const sbAuthed  = sbEnabled && SupabaseDB.isAuthenticated();
  const requests  = (sbAuthed && RequestInbox._sbCache !== null)
                    ? RequestInbox._sbCache
                    : Storage.getAll('ministry_requests');
  requests.sort((a,b) => (b.submittedAt||'').localeCompare(a.submittedAt||''));

  const newReqs         = requests.filter(r=>r.status==='Received').length;
  const urgent          = requests.filter(r=>r.urgency==='High' && r.status!=='Completed' && r.status!=='Closed').length;
  const unassigned      = requests.filter(r=>!r.assignedTo && r.status!=='Completed' && r.status!=='Closed').length;
  const overdueFollowUp = requests.filter(r=>r.followUpDate && r.followUpDate < today && r.status!=='Completed' && r.status!=='Closed').length;

  const typeIcons    = { prayer:'🙏', help:'🤝', pantry:'🥫', pastoral:'❤️', volunteer:'🙌' };
  const statusColors = { Received:'blue', Assigned:'purple', 'In Progress':'orange', 'Followed Up':'teal', Completed:'green', Closed:'gray' };
  const urgencyColors= { High:'red', Medium:'yellow', Low:'gray', Emergency:'red' };

  let activeFilter = Storage.get('_inbox_filter') || 'all';
  let activeSearch = '';

  function applyFilters() {
    return requests.filter(r => {
      const matchFilter =
        activeFilter === 'all'        ? true :
        activeFilter === 'new'        ? r.status === 'Received' :
        activeFilter === 'urgent'     ? (r.urgency === 'High' && r.status !== 'Completed' && r.status !== 'Closed') :
        activeFilter === 'unassigned' ? (!r.assignedTo && r.status !== 'Completed' && r.status !== 'Closed') :
        activeFilter === 'overdue'    ? (r.followUpDate && r.followUpDate < today && r.status !== 'Completed' && r.status !== 'Closed') :
        activeFilter === 'open'       ? (r.status !== 'Completed' && r.status !== 'Closed') :
        r.type === activeFilter;
      if (!matchFilter) return false;
      if (!activeSearch) return true;
      const q = activeSearch.toLowerCase();
      const d = r.data || {};
      return `${r.requestId} ${d.name} ${r.typeName} ${r.assignedTo} ${r.status}`.toLowerCase().includes(q);
    });
  }

  function thIcon(key){const {col,dir}=RequestInbox._sort;if(col!==key)return`<span style="opacity:.25;font-size:.7rem;margin-left:3px">↕</span>`;return`<span style="font-size:.75rem;margin-left:3px;color:var(--accent)">${dir==='asc'?'↑':'↓'}</span>`;}
  function th(label,key){const active=RequestInbox._sort.col===key;return`<th style="cursor:pointer;user-select:none;white-space:nowrap;${active?'color:var(--accent);':''}" onclick="RequestInbox.sortBy('${key}')">${label}${thIcon(key)}</th>`;}

  function renderTable(data) {
    const wrap = document.getElementById('inbox-table-wrap');
    if (!wrap) return;
    const {col,dir}=RequestInbox._sort;
    if(col){
      data=[...data];
      data.sort((a,b)=>{
        let av,bv;
        if(col==='name'){av=(a.data?.name||'');bv=(b.data?.name||'');}
        else if(col==='submitted'){av=a.submittedAt||'';bv=b.submittedAt||'';}
        else{av=a[col]||'';bv=b[col]||'';}
        if(av==null||av==='')return 1;if(bv==null||bv==='')return -1;
        const cmp=String(av).localeCompare(String(bv));return dir==='asc'?cmp:-cmp;
      });
    }
    if (!data.length) {
      wrap.innerHTML = `<table><tbody><tr><td colspan="8" style="text-align:center;padding:36px;color:var(--text-muted)">No requests found</td></tr></tbody></table>`;
      return;
    }
    wrap.innerHTML = `<table class="data-table"><thead><tr>
      ${th('Request ID','requestId')}${th('Type','typeName')}${th('Name / Contact','name')}
      ${th('Submitted','submitted')}${th('Urgency','urgency')}${th('Status','status')}${th('Assigned To','assignedTo')}<th></th>
    </tr></thead><tbody>${data.map(r => {
      const d = r.data || {};
      const isOverdue = r.followUpDate && r.followUpDate < today && r.status !== 'Completed' && r.status !== 'Closed';
      const isNew = r.status === 'Received';
      return `<tr style="${isNew?'background:rgba(79,70,229,.04)':''}${isOverdue?';border-left:3px solid var(--red)':''}">
        <td style="font-family:monospace;font-size:.78rem;font-weight:700;color:var(--accent)">${r.requestId}</td>
        <td>${typeIcons[r.type]||'📋'} <span style="font-size:.82rem">${r.typeName}</span></td>
        <td><div style="font-weight:700;font-size:.86rem">${UI.esc(d.name||'—')}</div><div style="font-size:.72rem;color:var(--text-muted)">${UI.esc(d.phone||d.email||'')}</div></td>
        <td style="font-size:.78rem;color:var(--text-muted)">${UI.relDate(r.submittedAt?.slice(0,10)||'')}</td>
        <td>${UI.badge(r.urgency||'—', urgencyColors[r.urgency]||'gray')}</td>
        <td>${UI.badge(r.status, statusColors[r.status]||'gray')}${isOverdue?'<br><span style="font-size:.68rem;color:var(--red)">⚠ Overdue</span>':''}</td>
        <td style="font-size:.8rem">${r.assignedTo?UI.esc(r.assignedTo):`<span style="color:var(--text-muted);font-style:italic">Unassigned</span>`}</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="RequestInbox.view('${r.requestId}')">Review</button>
        </td>
      </tr>`;
    }).join('')}</tbody></table>`;
  }

  // ── Build auth banner HTML ──────────────────────────────────────
  let authBanner = '';
  if (sbEnabled) {
    if (sbAuthed) {
      const session = SupabaseDB.getSession();
      const userEmail = session?.user?.email || 'Staff';
      authBanner = `
        <div id="sb-auth-banner" style="display:flex;align-items:center;gap:10px;padding:10px 16px;background:#dcfce7;border:1px solid #86efac;border-radius:8px;margin-bottom:16px;font-size:.82rem;">
          <span style="color:#166534;font-weight:700;">🔒 Supabase Connected</span>
          <span style="color:#166534;">Signed in as ${UI.esc(userEmail)}</span>
          <span style="flex:1"></span>
          ${RequestInbox._sbCache === null ? `<span style="color:#166534;font-style:italic">Loading…</span>` : `<span style="color:#166534;">${requests.length} requests loaded</span>`}
          <button class="btn btn-outline btn-sm" onclick="RequestInbox._signOut()" style="font-size:.78rem;padding:4px 10px;">Sign Out</button>
        </div>`;
    } else {
      authBanner = `
        <div id="sb-auth-banner" style="display:flex;align-items:center;gap:10px;padding:10px 16px;background:#fef9c3;border:1px solid #fde047;border-radius:8px;margin-bottom:16px;font-size:.82rem;">
          <span style="color:#713f12;font-weight:700;">⚠ Supabase not connected</span>
          <span style="color:#713f12;">Sign in to sync live requests from Supabase. Showing local data only.</span>
          <span style="flex:1"></span>
          <button class="btn btn-primary btn-sm" onclick="RequestInbox._signIn()" style="font-size:.78rem;padding:4px 12px;">Staff Sign In</button>
        </div>`;
    }
  }

  page.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">📬 Ministry Request Inbox</h2>
        <div class="section-subtitle">Public portal submissions — review, assign, and follow up</div>
      </div>
      <button class="btn btn-outline" onclick="window.open('portal.html','_blank')">🌐 Open Public Portal</button>
    </div>

    ${authBanner}

    <!-- Alert cards -->
    <div class="stat-grid" style="margin-bottom:20px;">
      <div class="stat-card${newReqs>0?' pulse':''}" data-accent="blue" style="cursor:pointer" onclick="RequestInbox._filter('new')">
        <div class="stat-icon">🆕</div>
        <div class="stat-value">${newReqs}</div>
        <div class="stat-label">New Requests</div>
      </div>
      <div class="stat-card" data-accent="red" style="cursor:pointer" onclick="RequestInbox._filter('urgent')">
        <div class="stat-icon">🚨</div>
        <div class="stat-value">${urgent}</div>
        <div class="stat-label">Urgent / High Priority</div>
      </div>
      <div class="stat-card" data-accent="orange" style="cursor:pointer" onclick="RequestInbox._filter('unassigned')">
        <div class="stat-icon">👤</div>
        <div class="stat-value">${unassigned}</div>
        <div class="stat-label">Awaiting Assignment</div>
      </div>
      <div class="stat-card" data-accent="yellow" style="cursor:pointer" onclick="RequestInbox._filter('overdue')">
        <div class="stat-icon">⏰</div>
        <div class="stat-value">${overdueFollowUp}</div>
        <div class="stat-label">Overdue Follow-Ups</div>
      </div>
    </div>

    <!-- Filter chips -->
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;" id="inbox-chips">
      ${[['all','All'],['new','New'],['open','Open'],['urgent','Urgent'],['unassigned','Unassigned'],['prayer','Prayer'],['help','Help'],['pantry','Pantry'],['pastoral','Pastoral'],['volunteer','Volunteer']].map(([f,l])=>`
        <button class="chip${activeFilter===f?' chip-active':''}" data-filter="${f}" onclick="RequestInbox._filter('${f}')">${l}</button>`).join('')}
    </div>

    <div class="toolbar" style="margin-bottom:16px;">
      <div class="search-input-wrap" style="flex:1">
        <span class="search-icon">🔍</span>
        <input class="search-input" id="inbox-search" placeholder="Search by name, ID, type…">
      </div>
      <button class="btn btn-outline btn-sm" id="inbox-refresh-btn" aria-label="Refresh requests" onclick="RequestInbox._refresh(this)" style="white-space:nowrap">↻ Refresh</button>
    </div>

    <div class="table-wrap" id="inbox-table-wrap"></div>
  `;

  // Inject chip CSS if not yet present
  if (!document.getElementById('inbox-chip-style')) {
    const s = document.createElement('style');
    s.id = 'inbox-chip-style';
    s.textContent = `.chip{padding:5px 12px;border-radius:20px;font-size:.78rem;font-weight:700;border:1.5px solid var(--border);background:var(--surface);color:var(--text-muted);cursor:pointer;transition:all .15s}.chip:hover{border-color:var(--accent);color:var(--accent)}.chip-active{background:var(--accent);color:#fff;border-color:var(--accent)}`;
    document.head.appendChild(s);
  }

  renderTable(applyFilters());

  document.getElementById('inbox-search')?.addEventListener('input', function() {
    activeSearch = this.value;
    renderTable(applyFilters());
  });

  // Store render fn for filter updates
  window._inboxRender = () => renderTable(applyFilters());
  window._inboxFilter = (f) => { activeFilter = f; renderTable(applyFilters()); };
  RequestInbox._rerender = () => renderTable(applyFilters());

  // Kick off async Supabase refresh if authenticated and cache is stale
  if (sbAuthed && RequestInbox._sbCache === null) {
    RequestInbox._refreshFromSupabase();
  }
});

const RequestInbox = {
  _state: { search: '' },
  _sort: { col: null, dir: 'asc' },
  _rerender: null,

  // Supabase request cache — null = not yet loaded, array = loaded
  _sbCache: null,

  // ── Supabase: fetch all requests and refresh the table ──────────
  async _refreshFromSupabase() {
    if (typeof SupabaseDB === 'undefined' || !SupabaseDB.isEnabled() || !SupabaseDB.isAuthenticated()) return;
    const result = await SupabaseDB.getRequests();
    if (result.ok) {
      RequestInbox._sbCache = result.data;
      RequestInbox._rerender?.();
    } else {
      console.warn('[RequestInbox] Supabase fetch failed:', result.error);
    }
  },

  // ── Staff sign-in modal ─────────────────────────────────────────
  _signIn() {
    if (typeof SupabaseDB === 'undefined' || !SupabaseDB.isEnabled()) {
      Toast.error('Supabase is not configured.'); return;
    }
    Modal.open({
      title: '🔒 Staff Sign In',
      width: '400px',
      body: `
        <p style="font-size:.86rem;color:var(--text-muted);margin-bottom:18px;">
          Sign in with your staff account to access live Supabase data, including all requests and internal notes.
        </p>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-control" id="sb-email" type="email" placeholder="staff@church.org" autocomplete="email">
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input class="form-control" id="sb-password" type="password" placeholder="••••••••" autocomplete="current-password">
        </div>
        <div id="sb-signin-error" style="color:var(--red);font-size:.82rem;margin-top:6px;min-height:18px;"></div>
      `,
      footer: `
        <button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary" id="sb-signin-btn">Sign In</button>
      `
    });

    // Focus email field
    setTimeout(() => document.getElementById('sb-email')?.focus(), 80);

    // Allow Enter key to submit
    document.getElementById('sb-password')?.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') document.getElementById('sb-signin-btn')?.click();
    });

    document.getElementById('sb-signin-btn').onclick = async () => {
      const email    = document.getElementById('sb-email')?.value?.trim() || '';
      const password = document.getElementById('sb-password')?.value || '';
      const errEl    = document.getElementById('sb-signin-error');
      const btn      = document.getElementById('sb-signin-btn');

      if (!email || !password) {
        errEl.textContent = 'Please enter your email and password.'; return;
      }

      btn.disabled = true; btn.textContent = 'Signing in…';
      const result = await SupabaseDB.signIn(email, password);
      if (result.ok) {
        Modal.close();
        Toast.success('Signed in successfully');
        // onAuthChange listener will handle cache clear + re-render
      } else {
        errEl.textContent = result.error || 'Sign-in failed. Check your credentials.';
        btn.disabled = false; btn.textContent = 'Sign In';
      }
    };
  },

  // ── Staff sign out ──────────────────────────────────────────────
  async _signOut() {
    await SupabaseDB.signOut();
    RequestInbox._sbCache = null;
    Toast.success('Signed out');
    // onAuthChange listener handles re-render
  },

  sortBy(col) {
    if(this._sort.col===col) this._sort.dir=this._sort.dir==='asc'?'desc':'asc';
    else { this._sort.col=col; this._sort.dir='asc'; }
    this._rerender?.();
  },

  _filter(f) {
    Storage.set('_inbox_filter', f);
    RequestInbox._rerender?.();
  },

  async _refresh(btn) {
    if (btn) { btn.disabled = true; btn.textContent = '↻ Refreshing…'; }
    RequestInbox._sbCache = null;
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isEnabled() && SupabaseDB.isAuthenticated()) {
      await RequestInbox._refreshFromSupabase();
    } else {
      RequestInbox._rerender?.();
    }
    if (btn) { btn.disabled = false; btn.textContent = '↻ Refresh'; }
  },

  view(requestId) {
    // Read from Supabase cache if available, else localStorage
    const source   = (RequestInbox._sbCache !== null) ? RequestInbox._sbCache : Storage.getAll('ministry_requests');
    const r        = source.find(x => x.requestId === requestId);
    if (!r) { Toast.error('Request not found'); return; }

    const d = r.data || {};
    const typeIcons    = { prayer:'🙏', help:'🤝', pantry:'🥫', pastoral:'❤️', volunteer:'🙌' };
    const statusColors = { Received:'blue', Assigned:'purple', 'In Progress':'orange', 'Followed Up':'teal', Completed:'green', Closed:'gray' };
    const statuses     = ['Received','Assigned','In Progress','Followed Up','Completed','Closed'];
    const volunteers   = Storage.getAll('volunteers');
    const members      = Storage.getAll('members');
    const assignOptions= [...new Set([...volunteers.map(v=>v.name), ...members.filter(m=>m.ministry).map(m=>m.name)])].sort();

    function fieldRows() {
      const rows = [];
      const add = (label, val) => val ? rows.push(`<div style="padding:8px 0;border-bottom:1px solid var(--border);display:flex;gap:12px;font-size:.85rem;"><span style="min-width:130px;color:var(--text-muted);font-weight:600">${label}</span><span>${UI.esc(String(val))}</span></div>`) : null;

      add('Name', d.name);
      add('Phone', d.phone);
      add('Email', d.email);

      if (r.type === 'prayer') {
        add('Prayer Request', d.request);
        add('Private', d.isPrivate ? 'Yes — staff only' : 'No');
        add('Share with Team', d.shareTeam ? 'Yes' : 'No');
        add('Contact Method', d.contactMethod);
      } else if (r.type === 'help') {
        add('Type of Help', d.helpType);
        add('Description', d.description);
        add('Household Size', d.householdSize);
        add('Contact Method', d.contactMethod);
      } else if (r.type === 'pantry') {
        add('Household Size', d.householdSize);
        add('Dietary Restrictions', d.dietaryRestrictions);
        add('Preferred Pickup', d.pickupDay);
        add('Notes', d.notes);
      } else if (r.type === 'pastoral') {
        add('Person Needing Care', d.personName);
        add('Location', d.location);
        add('Visit Type', d.visitType);
        add('Notes', d.notes);
      } else if (r.type === 'volunteer') {
        add('Areas of Interest', Array.isArray(d.interests) ? d.interests.join(', ') : d.interests);
        add('Availability', d.availability);
        add('Skills / Experience', d.skills);
        add('Notes', d.notes);
      }

      return rows.join('');
    }

    Modal.open({ title:`${typeIcons[r.type]||'📋'} ${r.typeName} — ${r.requestId}`, width:'600px',
      body:`
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
          ${UI.badge(r.status, statusColors[r.status]||'gray')}
          ${UI.badge(r.urgency+' Priority', r.urgency==='High'?'red':r.urgency==='Medium'?'yellow':'gray')}
          <span style="font-size:.76rem;color:var(--text-muted);align-self:center">Submitted ${UI.relDate(r.submittedAt?.slice(0,10)||'')}</span>
        </div>

        <!-- Submission details -->
        <div style="background:var(--surface-2);border-radius:var(--radius);padding:14px;margin-bottom:16px;">
          <div style="font-size:.72rem;font-weight:800;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px;">Submission Details</div>
          ${fieldRows()}
        </div>

        <!-- Internal Management -->
        <div style="font-size:.72rem;font-weight:800;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;">Internal Management</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" id="req-status">
              ${statuses.map(s=>`<option ${r.status===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Urgency</label>
            <select class="form-control" id="req-urgency">
              ${['High','Medium','Low','Emergency'].map(u=>`<option ${(r.urgency||'Medium')===u?'selected':''}>${u}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Assign To</label>
          <input class="form-control" id="req-assign" list="req-assign-list" value="${UI.esc(r.assignedTo||'')}" placeholder="Type or select team member…">
          <datalist id="req-assign-list">${assignOptions.map(n=>`<option value="${UI.esc(n)}">`).join('')}</datalist>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Follow-Up Date</label>
            <input class="form-control" id="req-followup" type="date" value="${r.followUpDate||''}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Internal Notes <span style="font-size:.72rem;color:var(--text-muted)">(not visible to requester)</span></label>
          <textarea class="form-control" id="req-notes" rows="3">${UI.esc(r.internalNotes||'')}</textarea>
        </div>

        <div class="alert-banner alert-banner-yellow" style="margin-top:4px;font-size:.78rem;">
          🔒 Internal notes are never shown to the person who submitted this request.
        </div>
      `,
      footer:`
        <button class="btn btn-ghost btn-sm" style="color:var(--red)" aria-label="Delete request" onclick="RequestInbox._delete('${r.requestId}')">Delete</button>
        <button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary" id="save-req-btn">Save Changes</button>
      `
    });

    document.getElementById('save-req-btn').onclick = async () => {
      const status        = document.getElementById('req-status')?.value    || r.status;
      const urgency       = document.getElementById('req-urgency')?.value   || r.urgency;
      const assignedTo    = document.getElementById('req-assign')?.value?.trim() || r.assignedTo;
      const followUpDate  = document.getElementById('req-followup')?.value  || '';
      const internalNotes = document.getElementById('req-notes')?.value?.trim() || '';

      const fields = { status, urgency, assignedTo, followUpDate, internalNotes };

      // Try Supabase update first
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) {
        const result = await SupabaseDB.updateRequest(r.requestId, fields);
        if (result.ok) {
          RequestInbox._sbCache = null;
        } else {
          console.warn('[RequestInbox] Supabase update failed:', result.error);
          Toast.error('Supabase sync failed — saved locally only.');
        }
      }

      // Always update localStorage
      Storage.update('ministry_requests', r.id, { ...fields, lastUpdated: new Date().toISOString() });
      Modal.close();
      Toast.success('Request updated');
      RequestInbox._rerender?.();
    };
  },

  _delete(requestId) {
    UI.confirm('Permanently delete this request?', async () => {
      // Try Supabase delete first
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) {
        const result = await SupabaseDB.deleteRequest(requestId);
        if (result.ok) {
          RequestInbox._sbCache = null;
        } else {
          console.warn('[RequestInbox] Supabase delete failed:', result.error);
        }
      }

      // Always remove from localStorage
      const all = Storage.getAll('ministry_requests');
      const rec = all.find(r => r.requestId === requestId);
      if (rec) Storage.removeItem('ministry_requests', rec.id);
      Modal.close();
      Toast.success('Deleted');
      RequestInbox._rerender?.();
    });
  },
};
window.RequestInbox = RequestInbox;

// Auth state listener — re-renders inbox when staff sign-in state changes
(function() {
  if (typeof SupabaseDB === 'undefined' || !SupabaseDB.isEnabled()) return;
  SupabaseDB.onAuthChange(function(session) {
    if (!session) RequestInbox._sbCache = null;
    if (document.getElementById('sb-auth-banner')) {
      Navigation.navigate('request-inbox');
    }
  });
})();

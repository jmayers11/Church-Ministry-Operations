/* =============================================================
   facilities.js  —  Facilities & Room Booking
   Room scheduling, setup requirements, maintenance log
   ============================================================= */

(function seedFacilities() {
  if (Storage.get('_facilities_seeded')) return;
  const uid = Storage.uid, today = Storage.today;

  const rooms = [
    { id:uid(), name:'Main Sanctuary', capacity:350, location:'Main Building', features:['Sound System','Projector','Stage','Piano','Organ'], available:true, notes:'Setup required 30 min before events.', createdAt:today(-500) },
    { id:uid(), name:'Fellowship Hall', capacity:120, location:'Main Building', features:['Kitchen Access','Tables & Chairs','Sound System'], available:true, notes:'Kitchen must be cleaned after each use.', createdAt:today(-500) },
    { id:uid(), name:'Gym / Multi-Purpose Room', capacity:200, location:'Annex Building', features:['Basketball Hoop','Sound System','Tables & Chairs','Stage Area'], available:true, notes:'Remove basketball hoop covers before sporting events.', createdAt:today(-400) },
    { id:uid(), name:'Chapel', capacity:60, location:'Main Building', features:['Piano','Intimate Seating','Sound System'], available:true, notes:'Available for weddings, funerals, and small prayer services.', createdAt:today(-400) },
    { id:uid(), name:'Youth Room', capacity:40, location:'Annex Building', features:['TV','Game Consoles','Lounge Seating','Whiteboard'], available:true, notes:'Youth ministry priority on weeknights.', createdAt:today(-300) },
    { id:uid(), name:"Children's Wing (Rooms 101–106)", capacity:80, location:'Main Building', features:['Age-Appropriate Furniture','Restrooms Nearby','Secure Entry'], available:true, notes:'6 classrooms. Background checks required for all leaders.', createdAt:today(-400) },
    { id:uid(), name:'Conference Room A', capacity:20, location:'Office Wing', features:['Projector','Whiteboard','Phone','Coffee Maker'], available:true, notes:'Staff meetings and small group use.', createdAt:today(-200) },
    { id:uid(), name:'Conference Room B', capacity:10, location:'Office Wing', features:['TV','Whiteboard'], available:true, notes:'Counseling and small committee use.', createdAt:today(-200) },
    { id:uid(), name:'Church Kitchen', capacity:0, location:'Main Building', features:['Commercial Stove','Refrigerators','Dishwasher','Prep Tables'], available:true, notes:'Food handler certification required. Health code compliance posted on wall.', createdAt:today(-500) },
  ];
  Storage.saveAll('rooms', rooms);

  const bookings = [
    { id:uid(), roomId:rooms[0].id, roomName:'Main Sanctuary', title:'Sunday Morning Worship', type:'Regular Service', requestedBy:'Pastoral Staff', date:today(0), startTime:'9:30 AM', endTime:'12:00 PM', setupNeeded:'Standard worship setup', attendees:200, status:'Confirmed', recurring:true, recurrence:'Weekly (Sunday)', notes:'', createdAt:today(-30) },
    { id:uid(), roomId:rooms[1].id, roomName:'Fellowship Hall', title:'Community Free Dinner', type:'Outreach Event', requestedBy:'Dorothy White', date:today(17), startTime:'3:00 PM', endTime:'8:00 PM', setupNeeded:'Round tables for 80, buffet table setup', attendees:80, status:'Confirmed', recurring:false, recurrence:'', notes:'Kitchen access from 3 PM', createdAt:today(-5) },
    { id:uid(), roomId:rooms[2].id, roomName:'Gym / Multi-Purpose Room', title:'Youth Lock-In', type:'Youth Event', requestedBy:'David Martinez', date:today(11), startTime:'8:00 PM', endTime:'7:00 AM', setupNeeded:'Remove chairs, set up game stations', attendees:35, status:'Confirmed', recurring:false, recurrence:'', notes:'Overnight event — need adult chaperones list.', createdAt:today(-3) },
    { id:uid(), roomId:rooms[0].id, roomName:'Main Sanctuary', title:'Wedding Rehearsal — Johnson/Smith', type:'Wedding', requestedBy:'Maria Johnson', date:today(45), startTime:'6:00 PM', endTime:'8:00 PM', setupNeeded:'Floral setup by wedding party', attendees:30, status:'Tentative', recurring:false, recurrence:'', notes:'Coordinate with sound team.', createdAt:today(-10) },
    { id:uid(), roomId:rooms[3].id, roomName:'Chapel', title:'Grief Support Group', type:'Ministry', requestedBy:'Care Ministry', date:today(3), startTime:'6:30 PM', endTime:'8:00 PM', setupNeeded:'Circle of chairs, tissues, quiet atmosphere', attendees:12, status:'Confirmed', recurring:true, recurrence:'Bi-weekly (Thursday)', notes:'', createdAt:today(-20) },
    { id:uid(), roomId:rooms[6].id, roomName:'Conference Room A', title:'Elder Board Meeting', type:'Leadership', requestedBy:'Church Office', date:today(7), startTime:'7:00 PM', endTime:'9:00 PM', setupNeeded:'Standard conference setup', attendees:8, status:'Confirmed', recurring:true, recurrence:'Monthly', notes:'', createdAt:today(-14) },
    { id:uid(), roomId:rooms[4].id, roomName:'Youth Room', title:'Wednesday Youth Night', type:'Regular Service', requestedBy:'David Martinez', date:today(1), startTime:'6:30 PM', endTime:'9:00 PM', setupNeeded:'Game setup + chairs in circle', attendees:25, status:'Confirmed', recurring:true, recurrence:'Weekly (Wednesday)', notes:'', createdAt:today(-60) },
  ];
  Storage.saveAll('room_bookings', bookings);

  const maintenance = [
    { id:uid(), room:'Main Sanctuary', issue:'HVAC filter replacement', priority:'Medium', status:'Open', reportedBy:'Facilities Team', reportedDate:today(-5), scheduledDate:today(10), completedDate:'', notes:'Quarterly maintenance due.', cost:0, vendor:'' },
    { id:uid(), room:'Fellowship Hall', issue:'Broken folding table leg (Table #7)', priority:'Low', status:'Open', reportedBy:'Dorothy White', reportedDate:today(-3), scheduledDate:'', completedDate:'', notes:'Table tagged and set aside.', cost:0, vendor:'' },
    { id:uid(), room:'Gym / Multi-Purpose Room', issue:'Gym lights — 3 bulbs out in NE corner', priority:'High', status:'In Progress', reportedBy:'David Martinez', reportedDate:today(-8), scheduledDate:today(2), completedDate:'', notes:'Electrician scheduled.', cost:150, vendor:'ABC Electric' },
    { id:uid(), room:'Church Kitchen', issue:'Dishwasher door seal leaking', priority:'High', status:'Completed', reportedBy:'Kitchen Team', reportedDate:today(-20), scheduledDate:today(-15), completedDate:today(-14), notes:'Seal replaced. Working properly.', cost:220, vendor:'Appliance Pro' },
    { id:uid(), room:'Parking Lot', issue:'Pothole near main entrance', priority:'Medium', status:'Open', reportedBy:'Church Office', reportedDate:today(-12), scheduledDate:today(20), completedDate:'', notes:'3 quotes requested. Awaiting approval.', cost:0, vendor:'' },
  ];
  Storage.saveAll('maintenance', maintenance);
  Storage.set('_facilities_seeded', true);
})();

Navigation.register('facilities', function render(page) {
  const today = Storage.today();
  const rooms    = Storage.getAll('rooms');
  const bookings = Storage.getAll('room_bookings').sort((a,b)=>a.date.localeCompare(b.date));
  const maint    = Storage.getAll('maintenance');

  const upcoming  = bookings.filter(b=>b.date >= today);
  const openMaint = maint.filter(m=>m.status!=='Completed').length;
  const highPri   = maint.filter(m=>m.status!=='Completed'&&m.priority==='High').length;
  const todaysBookings = bookings.filter(b=>b.date===today);

  const statusColors = { Confirmed:'green', Tentative:'yellow', Cancelled:'red', Pending:'blue' };
  const maintColors  = { Open:'orange', 'In Progress':'blue', Completed:'green' };
  const priColors    = { High:'red', Medium:'yellow', Low:'gray' };

  let activeTab = Storage.get('_fac_tab')||'schedule';

  function renderContent() {
    document.querySelectorAll('#fac-tabs .tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===activeTab));
    const body=document.getElementById('fac-body'); if(!body) return;

    if(activeTab==='schedule') {
      body.innerHTML = `
        <div class="toolbar" style="margin-bottom:16px;">
          <div class="search-input-wrap"><i data-lucide="search" class="icon-inline search-icon-lucide" aria-hidden="true"></i><input class="search-input" id="bk-search" placeholder="Search bookings…"></div>
          <select class="filter-select" id="bk-room">
            <option value="">All Rooms</option>
            ${rooms.map(r=>`<option value="${r.id}">${r.name}</option>`).join('')}
          </select>
          <select class="filter-select" id="bk-status">
            <option value="">All Statuses</option>
            <option>Confirmed</option><option>Tentative</option><option>Pending</option><option>Cancelled</option>
          </select>
          <button class="btn btn-primary" onclick="Fac.addBooking()">+ Book Room</button>
        </div>
        <div id="bk-cards" style="display:flex;flex-direction:column;gap:10px;"></div>`;

      function renderBookings(data) {
        const el=document.getElementById('bk-cards'); if(!el) return;
        if(!data.length){el.innerHTML=`<div class="empty-state"><div class="empty-state-icon"><i data-lucide="landmark" class="icon-inline" aria-hidden="true"></i></div><div class="empty-state-title">No bookings found</div></div>`;return;}
        const now=Storage.today();
        el.innerHTML=data.map(b=>{
          const isPast=b.date<now;
          return `<div class="card" style="${isPast?'opacity:.7':''}">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
              <div style="flex:1">
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:5px;">
                  ${UI.badge(b.status, statusColors[b.status]||'gray')}
                  ${UI.badge(b.type,'blue')}
                  ${b.recurring?UI.badge('Recurring','purple'):''}
                </div>
                <div style="font-weight:800;margin-bottom:3px;">${UI.esc(b.title)}</div>
                <div style="font-size:.8rem;color:var(--text-muted);">
                  <i data-lucide="landmark" class="icon-inline" aria-hidden="true"></i> ${UI.esc(b.roomName)} &nbsp;·&nbsp; <i data-lucide="calendar" class="icon-inline" aria-hidden="true"></i> ${UI.fmtDate(b.date)} &nbsp;·&nbsp; <i data-lucide="clock" class="icon-inline" aria-hidden="true"></i> ${UI.esc(b.startTime)} – ${UI.esc(b.endTime)}
                  <br><i data-lucide="users" class="icon-inline" aria-hidden="true"></i> ${b.attendees||0} expected &nbsp;·&nbsp; <i data-lucide="user" class="icon-inline" aria-hidden="true"></i> ${UI.esc(b.requestedBy)}
                  ${b.recurrence?`<br><i data-lucide="repeat" class="icon-inline" aria-hidden="true"></i> ${UI.esc(b.recurrence)}`:''}
                </div>
                ${b.setupNeeded?`<div style="font-size:.76rem;background:var(--surface-2);border-radius:var(--radius);padding:5px 10px;margin-top:6px;">Setup: ${UI.esc(b.setupNeeded)}</div>`:''}
              </div>
              <div style="display:flex;gap:6px;flex-shrink:0;">
                <button class="btn btn-ghost btn-sm" onclick="Fac.editBooking('${b.id}')">Edit</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--red)" aria-label="Remove booking" onclick="Fac.removeBooking('${b.id}')">×</button>
              </div>
            </div>
          </div>`;
        }).join('');
      }
      renderBookings(upcoming);
      document.getElementById('bk-search')?.addEventListener('input',function(){
        const q=this.value.toLowerCase();
        const rid=document.getElementById('bk-room')?.value||'';
        const st=document.getElementById('bk-status')?.value||'';
        renderBookings(bookings.filter(b=>{
          const txt=`${b.title} ${b.roomName} ${b.requestedBy} ${b.type}`.toLowerCase();
          return txt.includes(q)&&(!rid||b.roomId===rid)&&(!st||b.status===st);
        }));
      });
      ['bk-room','bk-status'].forEach(id=>{
        document.getElementById(id)?.addEventListener('change',()=>{
          const q=document.getElementById('bk-search')?.value.toLowerCase()||'';
          const rid=document.getElementById('bk-room')?.value||'';
          const st=document.getElementById('bk-status')?.value||'';
          renderBookings(bookings.filter(b=>{
            const txt=`${b.title} ${b.roomName} ${b.requestedBy} ${b.type}`.toLowerCase();
            return txt.includes(q)&&(!rid||b.roomId===rid)&&(!st||b.status===st);
          }));
        });
      });

    } else if(activeTab==='rooms') {
      body.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:16px;">
          <button class="btn btn-primary" onclick="Fac.addRoom()">+ Add Room</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">
          ${rooms.map(r=>`
            <div class="card">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                <div style="font-weight:800;font-size:.96rem;">${UI.esc(r.name)}</div>
                ${UI.badge(r.available?'Available':'Unavailable', r.available?'green':'red')}
              </div>
              <div style="font-size:.78rem;color:var(--text-muted);margin-bottom:8px;"><i data-lucide="map-pin" class="icon-inline" aria-hidden="true"></i> ${UI.esc(r.location)} &nbsp;·&nbsp; <i data-lucide="users" class="icon-inline" aria-hidden="true"></i> Capacity: ${r.capacity}</div>
              ${r.features?.length?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;">${r.features.map(f=>`<span style="background:var(--surface-2);border-radius:4px;padding:2px 7px;font-size:.71rem;">${f}</span>`).join('')}</div>`:''}
              ${r.notes?`<div style="font-size:.76rem;color:var(--text-muted);margin-bottom:10px;">${UI.esc(r.notes)}</div>`:''}
              <div style="display:flex;gap:6px;">
                <button class="btn btn-ghost btn-sm" onclick="Fac.editRoom('${r.id}')">Edit</button>
                <button class="btn btn-primary btn-sm" onclick="Fac.addBooking('${r.id}')">Book</button>
              </div>
            </div>`).join('')}
        </div>`;

    } else if(activeTab==='maintenance') {
      let allMaint=Storage.getAll('maintenance');
      function thIcon(key){const {col,dir}=Fac._sort;if(col!==key)return`<span style="opacity:.25;font-size:.7rem;margin-left:3px">↕</span>`;return`<span style="font-size:.75rem;margin-left:3px;color:var(--accent)">${dir==='asc'?'↑':'↓'}</span>`;}
      function thM(label,key){const {col,dir}=Fac._sort;const active=col===key;const aSort=active?(dir==='asc'?'ascending':'descending'):'none';return`<th aria-sort="${aSort}" style="white-space:nowrap;${active?'color:var(--accent);':''}"><button type="button" class="sort-btn" onclick="Fac.sortBy('${key}')">${label}${thIcon(key)}</button></th>`;}
      function renderMaint(data){
        const wrap=document.getElementById('maint-table-wrap');if(!wrap)return;
        const {col,dir}=Fac._sort;
        if(col){
          data=[...data];
          const po={High:0,Medium:1,Low:2};
          data.sort((a,b)=>{
            let av=a[col],bv=b[col];
            if(col==='priority'){return dir==='asc'?(po[av]??1)-(po[bv]??1):(po[bv]??1)-(po[av]??1);}
            if(col==='cost'){av=Number(av)||0;bv=Number(bv)||0;return dir==='asc'?av-bv:bv-av;}
            if(av==null||av==='')return 1;if(bv==null||bv==='')return -1;
            const cmp=String(av).localeCompare(String(bv));return dir==='asc'?cmp:-cmp;
          });
        }
        wrap.innerHTML=`<table class="data-table"><thead><tr>
          ${thM('Issue','issue')}${thM('Room/Area','room')}${thM('Priority','priority')}${thM('Status','status')}${thM('Reported','reportedDate')}${thM('Vendor/Cost','cost')}<th></th>
        </tr></thead><tbody>${data.map(m=>`<tr>
                <td style="font-weight:700">${UI.esc(m.issue)}</td>
                <td style="font-size:.8rem">${UI.esc(m.room)}</td>
                <td>${UI.badge(m.priority, priColors[m.priority]||'gray')}</td>
                <td>${UI.badge(m.status, maintColors[m.status]||'gray')}</td>
                <td style="font-size:.78rem">${UI.fmtDate(m.reportedDate)}</td>
                <td style="font-size:.78rem">${m.vendor?`${UI.esc(m.vendor)}<br>`:''} ${m.cost?`$${m.cost}`:''}</td>
                <td>
                  <button class="btn btn-ghost btn-sm" onclick="Fac.editMaint('${m.id}')">Edit</button>
                  ${m.status!=='Completed'?`<button class="btn btn-success btn-sm" aria-label="Mark maintenance complete" onclick="Fac.closeMaint('${m.id}')">✓</button>`:''}
                </td>
              </tr>`).join('')}</tbody></table>`;
      }
      body.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:16px;">
          <button class="btn btn-primary" onclick="Fac.addMaint()">+ Report Issue</button>
        </div>
        <div class="table-wrap" id="maint-table-wrap"></div>`;
      renderMaint(allMaint);
      Fac._rerender = ()=>renderMaint(allMaint);
    }
  }

  page.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">Facilities & Room Booking</h2>
        <div class="section-subtitle">Room scheduling · Setup tracking · Maintenance log</div>
      </div>
      <button class="btn btn-primary" onclick="Fac.addBooking()">+ Book Room</button>
    </div>

    <div class="stat-grid" style="margin-bottom:20px;">
      <div class="stat-card" data-accent="blue"><div class="stat-icon"><i data-lucide="landmark" style="opacity:.7" aria-hidden="true"></i></div><div class="stat-value">${rooms.length}</div><div class="stat-label">Rooms on File</div></div>
      <div class="stat-card" data-accent="green"><div class="stat-icon"><i data-lucide="calendar" style="opacity:.7" aria-hidden="true"></i></div><div class="stat-value">${upcoming.length}</div><div class="stat-label">Upcoming Bookings</div></div>
      <div class="stat-card" data-accent="purple"><div class="stat-icon"><i data-lucide="circle" style="opacity:.7" aria-hidden="true"></i></div><div class="stat-value">${todaysBookings.length}</div><div class="stat-label">Bookings Today</div></div>
      <div class="stat-card" data-accent="${highPri>0?'red':'orange'}"><div class="stat-icon"><i data-lucide="wrench" style="opacity:.7" aria-hidden="true"></i></div><div class="stat-value">${openMaint}</div><div class="stat-label">Open Maintenance</div><div class="stat-delta ${highPri>0?'down':'flat'}">${highPri>0?`${highPri} high priority`:'All low priority'}</div></div>
    </div>

    ${todaysBookings.length ? `
    <div style="background:var(--accent-light);border:1px solid var(--accent);border-radius:var(--radius);padding:14px 16px;margin-bottom:20px;">
      <div style="font-weight:800;font-size:.88rem;color:var(--accent);margin-bottom:8px;"><i data-lucide="calendar" class="icon-inline" aria-hidden="true"></i> Today's Schedule</div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;">
        ${todaysBookings.map(b=>`
          <div style="background:var(--surface);border-radius:6px;padding:8px 12px;font-size:.82rem;">
            <div style="font-weight:700">${UI.esc(b.title)}</div>
            <div style="color:var(--text-muted)">${UI.esc(b.roomName)} · ${UI.esc(b.startTime)}–${UI.esc(b.endTime)}</div>
          </div>`).join('')}
      </div>
    </div>` : ''}

    <div id="fac-tabs" style="display:flex;gap:4px;border-bottom:2px solid var(--border);margin-bottom:20px;flex-wrap:wrap;">
      ${[['schedule','<i data-lucide="calendar" class="icon-inline" aria-hidden="true"></i> Room Schedule'],['rooms','<i data-lucide="landmark" class="icon-inline" aria-hidden="true"></i> Rooms'],['maintenance','<i data-lucide="wrench" class="icon-inline" aria-hidden="true"></i> Maintenance']].map(([t,l])=>`
        <button class="tab-btn${activeTab===t?' active':''}" data-tab="${t}" onclick="Fac._setTab('${t}')">${l}</button>`).join('')}
    </div>
    <div id="fac-body"></div>
  `;
  renderContent();
});

const Fac = {
  _state: { search: '' },
  _rerender() {
    const _s = document.getElementById('bk-search');
    if (_s) Fac._state.search = _s.value;
    Fac._rerender();
    const _ns = document.getElementById('bk-search');
    if (_ns && Fac._state.search) { _ns.value = Fac._state.search; _ns.dispatchEvent(new Event('input')); }
  },
  _sort: { col: null, dir: 'asc' },
  _rerender: null,
  sortBy(col) {
    if(this._sort.col===col) this._sort.dir=this._sort.dir==='asc'?'desc':'asc';
    else { this._sort.col=col; this._sort.dir='asc'; }
    this._rerender?.();
  },
  _setTab(t) { Storage.set('_fac_tab',t); Fac._state.search = ''; Navigation.navigate('facilities'); },
  _bookingForm(b={}, preRoomId='') {
    const rooms=Storage.getAll('rooms');
    const types=['Regular Service','Ministry','Outreach Event','Wedding','Funeral','Youth Event','Community Event','Leadership','Rental','Other'];
    return `
      <div class="form-group"><label class="form-label">Event / Booking Title *</label><input class="form-control" id="bk-title" value="${UI.esc(b.title||'')}"></div>
      <div class="form-row">
        <div class="form-group" style="flex:2"><label class="form-label">Room *</label>
          <select class="form-control" id="bk-room-sel">
            ${rooms.map(r=>`<option value="${r.id}" ${(b.roomId||preRoomId)===r.id?'selected':''}>${r.name} (cap. ${r.capacity})</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Type</label>
          <select class="form-control" id="bk-type">${types.map(t=>`<option ${(b.type||'Ministry')===t?'selected':''}>${t}</option>`).join('')}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Date *</label><input class="form-control" id="bk-date" type="date" value="${b.date||Storage.today()}"></div>
        <div class="form-group"><label class="form-label">Start Time</label><input class="form-control" id="bk-start" value="${b.startTime||'9:00 AM'}"></div>
        <div class="form-group"><label class="form-label">End Time</label><input class="form-control" id="bk-end" value="${b.endTime||'11:00 AM'}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Requested By</label><input class="form-control" id="bk-reqby" value="${UI.esc(b.requestedBy||'')}"></div>
        <div class="form-group"><label class="form-label">Expected Attendees</label><input class="form-control" id="bk-att" type="number" min="0" value="${b.attendees||0}"></div>
      </div>
      <div class="form-group"><label class="form-label">Setup Needed</label><input class="form-control" id="bk-setup" value="${UI.esc(b.setupNeeded||'')}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Status</label>
          <select class="form-control" id="bk-status">${['Confirmed','Tentative','Pending','Cancelled'].map(s=>`<option ${(b.status||'Confirmed')===s?'selected':''}>${s}</option>`).join('')}</select>
        </div>
        <div class="form-group"><label class="form-label">Recurring?</label>
          <select class="form-control" id="bk-rec"><option value="">One-Time</option><option value="Weekly (Sunday)">Weekly (Sunday)</option><option value="Weekly (Wednesday)">Weekly (Wednesday)</option><option value="Bi-weekly">Bi-weekly</option><option value="Monthly">Monthly</option></select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">Notes</label><textarea class="form-control" id="bk-notes">${UI.esc(b.notes||'')}</textarea></div>`;
  },
  _collectBooking() {
    const v=id=>document.getElementById(id)?.value?.trim()||'';
    const roomId=v('bk-room-sel');
    const room=Storage.findById('rooms',roomId);
    const rec=v('bk-rec');
    return { title:v('bk-title'), roomId, roomName:room?.name||'', type:v('bk-type'),
      date:v('bk-date'), startTime:v('bk-start'), endTime:v('bk-end'),
      requestedBy:v('bk-reqby'), attendees:parseInt(document.getElementById('bk-att')?.value)||0,
      setupNeeded:v('bk-setup'), status:v('bk-status'),
      recurring:!!rec, recurrence:rec, notes:v('bk-notes') };
  },
  addBooking(preRoomId='') {
    Modal.open({ title:'Book a Room', body:this._bookingForm({},preRoomId), width:'560px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-bk-btn">Confirm Booking</button>` });
    document.getElementById('save-bk-btn').onclick=()=>{
      const d=this._collectBooking();
      if(!Validate.check([
        ['bk-title', Validate.required(d.title,'Booking title')],
        ['bk-date',  Validate.required(d.date,'Date')],
      ])) return;
      Storage.insert('room_bookings',d); Modal.close(); Toast.success('Room booked'); Fac._rerender();
    };
  },
  editBooking(id) {
    const b=Storage.findById('room_bookings',id); if(!b) return;
    Modal.open({ title:'Edit Booking', body:this._bookingForm(b), width:'560px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-bk-btn">Save</button>` });
    document.getElementById('save-bk-btn').onclick=()=>{
      Storage.update('room_bookings',id,this._collectBooking()); Modal.close(); Toast.success('Updated'); Fac._rerender();
    };
  },
  removeBooking(id) {
    UI.confirm('Cancel this booking?',()=>{ Storage.removeItem('room_bookings',id); Toast.success('Booking removed'); Fac._rerender(); });
  },
  addRoom() {
    const features=['Sound System','Projector','Piano','Kitchen Access','Tables & Chairs','Whiteboard','TV','Restrooms Nearby'];
    Modal.open({ title:'Add Room', width:'500px', body:`
      <div class="form-group"><label class="form-label">Room Name *</label><input class="form-control" id="rm-name"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Location / Building</label><input class="form-control" id="rm-loc"></div>
        <div class="form-group"><label class="form-label">Capacity</label><input class="form-control" id="rm-cap" type="number" min="0" value="0"></div>
      </div>
      <div class="form-group"><label class="form-label">Features</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;">
          ${features.map(f=>`<label style="display:flex;align-items:center;gap:5px;font-size:.84rem;cursor:pointer;"><input type="checkbox" class="rm-feat" value="${f}"> ${f}</label>`).join('')}
        </div>
      </div>
      <div class="form-group"><label class="form-label">Notes</label><textarea class="form-control" id="rm-notes"></textarea></div>`,
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-rm-btn">Add Room</button>` });
    document.getElementById('save-rm-btn').onclick=()=>{
      const n=document.getElementById('rm-name')?.value?.trim();
      if(!Validate.check([['rm-name', Validate.required(n,'Room name')]])) return;
      const feats=[...document.querySelectorAll('.rm-feat:checked')].map(c=>c.value);
      Storage.insert('rooms',{ name:n, location:document.getElementById('rm-loc')?.value?.trim()||'', capacity:parseInt(document.getElementById('rm-cap')?.value)||0, features:feats, available:true, notes:document.getElementById('rm-notes')?.value?.trim()||'' });
      Modal.close(); Toast.success('Room added'); Fac._rerender();
    };
  },
  editRoom(id) {
    const r=Storage.findById('rooms',id); if(!r) return;
    const features=['Sound System','Projector','Piano','Kitchen Access','Tables & Chairs','Whiteboard','TV','Restrooms Nearby'];
    Modal.open({ title:'Edit Room', width:'500px', body:`
      <div class="form-group"><label class="form-label">Room Name *</label><input class="form-control" id="rm-name" value="${UI.esc(r.name)}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Location</label><input class="form-control" id="rm-loc" value="${UI.esc(r.location||'')}"></div>
        <div class="form-group"><label class="form-label">Capacity</label><input class="form-control" id="rm-cap" type="number" min="0" value="${r.capacity||0}"></div>
      </div>
      <div class="form-group"><label class="form-label">Features</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;">
          ${features.map(f=>`<label style="display:flex;align-items:center;gap:5px;font-size:.84rem;cursor:pointer;"><input type="checkbox" class="rm-feat" value="${f}" ${(r.features||[]).includes(f)?'checked':''}> ${f}</label>`).join('')}
        </div>
      </div>
      <div class="form-group"><label class="form-label">Available</label>
        <select class="form-control" id="rm-avail"><option value="true" ${r.available?'selected':''}>Available</option><option value="false" ${!r.available?'selected':''}>Not Available</option></select>
      </div>
      <div class="form-group"><label class="form-label">Notes</label><textarea class="form-control" id="rm-notes">${UI.esc(r.notes||'')}</textarea></div>`,
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-rm-btn">Save</button>` });
    document.getElementById('save-rm-btn').onclick=()=>{
      const n=document.getElementById('rm-name')?.value?.trim();
      if(!Validate.check([['rm-name', Validate.required(n,'Room name')]])) return;
      const feats=[...document.querySelectorAll('.rm-feat:checked')].map(c=>c.value);
      Storage.update('rooms',id,{ name:n, location:document.getElementById('rm-loc')?.value?.trim()||'', capacity:parseInt(document.getElementById('rm-cap')?.value)||0, features:feats, available:document.getElementById('rm-avail')?.value==='true', notes:document.getElementById('rm-notes')?.value?.trim()||'' });
      Modal.close(); Toast.success('Updated'); Fac._rerender();
    };
  },
  addMaint() {
    const rooms=Storage.getAll('rooms');
    Modal.open({ title:'Report Maintenance Issue', width:'480px', body:`
      <div class="form-group"><label class="form-label">Issue / Description *</label><input class="form-control" id="mt-issue"></div>
      <div class="form-row">
        <div class="form-group" style="flex:2"><label class="form-label">Room / Area</label>
          <input class="form-control" id="mt-room" list="mt-room-list" placeholder="Select or type…">
          <datalist id="mt-room-list">${rooms.map(r=>`<option value="${UI.esc(r.name)}">`).join('')}<option value="Parking Lot"><option value="Exterior"><option value="Office Wing"></datalist>
        </div>
        <div class="form-group"><label class="form-label">Priority</label>
          <select class="form-control" id="mt-pri"><option>High</option><option selected>Medium</option><option>Low</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Reported By</label><input class="form-control" id="mt-by"></div>
        <div class="form-group"><label class="form-label">Scheduled Date</label><input class="form-control" id="mt-sched" type="date"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Vendor</label><input class="form-control" id="mt-vendor"></div>
        <div class="form-group"><label class="form-label">Est. Cost ($)</label><input class="form-control" id="mt-cost" type="number" min="0" value="0"></div>
      </div>
      <div class="form-group"><label class="form-label">Notes</label><textarea class="form-control" id="mt-notes"></textarea></div>`,
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-mt-btn">Submit</button>` });
    document.getElementById('save-mt-btn').onclick=()=>{
      const v=id=>document.getElementById(id)?.value?.trim()||'';
      if(!Validate.check([['mt-issue', Validate.required(v('mt-issue'),'Issue description')]])) return;
      Storage.insert('maintenance',{ issue:v('mt-issue'), room:v('mt-room'), priority:v('mt-pri'), status:'Open', reportedBy:v('mt-by'), reportedDate:Storage.today(), scheduledDate:v('mt-sched'), completedDate:'', vendor:v('mt-vendor'), cost:parseFloat(v('mt-cost'))||0, notes:v('mt-notes') });
      Modal.close(); Toast.success('Issue reported'); Fac._rerender();
    };
  },
  editMaint(id) {
    const m=Storage.findById('maintenance',id); if(!m) return;
    Modal.open({ title:'Edit Maintenance Issue', width:'480px', body:`
      <div class="form-group"><label class="form-label">Issue *</label><input class="form-control" id="mt-issue" value="${UI.esc(m.issue)}"></div>
      <div class="form-row">
        <div class="form-group" style="flex:2"><label class="form-label">Room / Area</label><input class="form-control" id="mt-room" value="${UI.esc(m.room||'')}"></div>
        <div class="form-group"><label class="form-label">Priority</label>
          <select class="form-control" id="mt-pri">${['High','Medium','Low'].map(p=>`<option ${m.priority===p?'selected':''}>${p}</option>`).join('')}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Status</label>
          <select class="form-control" id="mt-status">${['Open','In Progress','Completed'].map(s=>`<option ${m.status===s?'selected':''}>${s}</option>`).join('')}</select>
        </div>
        <div class="form-group"><label class="form-label">Scheduled Date</label><input class="form-control" id="mt-sched" type="date" value="${m.scheduledDate||''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Vendor</label><input class="form-control" id="mt-vendor" value="${UI.esc(m.vendor||'')}"></div>
        <div class="form-group"><label class="form-label">Est. Cost ($)</label><input class="form-control" id="mt-cost" type="number" min="0" value="${m.cost||0}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Completed Date</label><input class="form-control" id="mt-done" type="date" value="${m.completedDate||''}"></div>
      </div>
      <div class="form-group"><label class="form-label">Notes</label><textarea class="form-control" id="mt-notes">${UI.esc(m.notes||'')}</textarea></div>`,
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-mt-btn">Save</button>` });
    document.getElementById('save-mt-btn').onclick=()=>{
      const v=id=>document.getElementById(id)?.value?.trim()||'';
      Storage.update('maintenance',id,{ issue:v('mt-issue'), room:v('mt-room'), priority:v('mt-pri'), status:v('mt-status'), scheduledDate:v('mt-sched'), completedDate:v('mt-done'), vendor:v('mt-vendor'), cost:parseFloat(v('mt-cost'))||0, notes:v('mt-notes') });
      Modal.close(); Toast.success('Updated'); Fac._rerender();
    };
  },
  closeMaint(id) {
    Storage.update('maintenance', id, { status: 'Completed', completedDate: Storage.today() });
    Toast.success('Issue marked as completed');
    Fac._rerender();
  },
  removeMaint(id) {
    UI.confirm('Remove this maintenance issue?', () => {
      Storage.removeItem('maintenance',id); Toast.success('Removed'); Fac._rerender();
    });
  },
  exportMaint() {
    const rows=[['Issue','Room','Priority','Status','Reported By','Reported Date','Scheduled','Completed','Vendor','Cost','Notes']];
    Storage.getAll('maintenance').forEach(m=>rows.push([m.issue,m.room||'',m.priority,m.status,m.reportedBy||'',m.reportedDate||'',m.scheduledDate||'',m.completedDate||'',m.vendor||'',m.cost||0,m.notes||'']));
    const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='maintenance.csv'; a.click();
    Toast.success('Exported');
  },
};
window.Fac = Fac;

/* =============================================================
   communications.js  —  Communications Hub
   Announcements, bulletin builder, message templates
   ============================================================= */

(function seedCommunications() {
  if (Storage.get('_comms_seeded')) return;
  const uid = Storage.uid, today = Storage.today;

  const announcements = [
    { id:uid(), title:'Sunday Service — 10:00 AM', body:'Join us this Sunday for worship, prayer, and the Word. Children\'s ministry and nursery available.', category:'Service', audience:'All', priority:'High', startDate:today(-1), endDate:today(6), status:'Active', channels:['Bulletin','Screen','Website'], createdAt:today(-2) },
    { id:uid(), title:'Community Food Drive — This Saturday', body:'Bring non-perishable food items to the church parking lot, 9 AM–1 PM. Help us reach our goal of 1,000 items!', category:'Outreach', audience:'All', priority:'High', startDate:today(), endDate:today(9), status:'Active', channels:['Bulletin','Email','Text','Screen'], createdAt:today(-3) },
    { id:uid(), title:'VBS Registration Now Open!', body:'Vacation Bible School is coming! Register your children ages 4–12 online or at the welcome desk.', category:'Children', audience:'Families', priority:'Medium', startDate:today(), endDate:today(30), status:'Active', channels:['Bulletin','Email','Website'], createdAt:today(-5) },
    { id:uid(), title:'New Member Class — Starting Next Month', body:'Interested in becoming a member? Join our 4-week New Member Class. Sign up at the info table.', category:'Membership', audience:'Visitors', priority:'Medium', startDate:today(5), endDate:today(35), status:'Scheduled', channels:['Bulletin','Email'], createdAt:today(-1) },
    { id:uid(), title:'Prayer Meeting — Wednesday 7 PM', body:'Our mid-week prayer gathering. All are welcome. No preparation needed — just come as you are.', category:'Service', audience:'All', priority:'Low', startDate:today(-6), endDate:today(14), status:'Active', channels:['Bulletin','Screen'], createdAt:today(-7) },
    { id:uid(), title:'Youth Lock-In — June 21', body:'Youth Group students in grades 6–12 are invited! Permission forms required. See Pastor David.', category:'Youth', audience:'Youth', priority:'Medium', startDate:today(8), endDate:today(18), status:'Scheduled', channels:['Bulletin','Text'], createdAt:today(-1) },
    { id:uid(), title:'Missions Giving Sunday', body:'This month we are highlighting our partnership with Hope International. Special envelope in your bulletin.', category:'Missions', audience:'All', priority:'High', startDate:today(-14), endDate:today(-7), status:'Archived', channels:['Bulletin','Email','Screen'], createdAt:today(-20) },
  ];
  Storage.saveAll('announcements', announcements);

  const bulletins = [
    {
      id:uid(), title:`Sunday Bulletin — ${today()}`,
      date: today(),
      welcome:'Welcome to our church family! We are so glad you are here today. If you are visiting, please stop by the welcome desk.',
      scripture:'"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." — John 3:16',
      sermonTitle:'Walking in Faith',
      sermonSeries:'The Life of Abraham',
      speaker:'Pastor James Wilson',
      announcements: announcements.filter(a=>a.status==='Active').slice(0,4).map(a=>a.id),
      offeringNote:'Your generosity makes this ministry possible. Give online at church.example.com/give.',
      closingNote:'Join us for coffee and fellowship in the foyer after service.',
      createdAt: today(),
    }
  ];
  Storage.saveAll('bulletins', bulletins);
  Storage.set('_comms_seeded', true);
})();

Navigation.register('communications', function render(page) {
  const today = Storage.today();
  const announcements = Storage.getAll('announcements').sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const bulletins = Storage.getAll('bulletins').sort((a,b)=>b.date.localeCompare(a.date));

  const active = announcements.filter(a=>a.status==='Active').length;
  const scheduled = announcements.filter(a=>a.status==='Scheduled').length;
  const expiring = announcements.filter(a=>a.status==='Active' && a.endDate && a.endDate <= Storage.today(3)).length;

  const categoryColors = { Service:'blue', Outreach:'green', Children:'pink', Youth:'purple', Membership:'orange', Missions:'teal', General:'gray' };

  let activeTab = Storage.get('_comms_tab')||'announcements';

  function renderContent() {
    document.querySelectorAll('#comms-tabs .tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===activeTab));
    const body=document.getElementById('comms-body'); if(!body) return;

    if(activeTab==='announcements') {
      body.innerHTML = `
        <div class="toolbar" style="margin-bottom:16px;">
          <div class="search-input-wrap"><span class="search-icon">🔍</span><input class="search-input" id="ann-search" placeholder="Search announcements…"></div>
          <select class="filter-select" id="ann-status">
            <option value="">All Statuses</option>
            <option>Active</option><option>Scheduled</option><option>Archived</option>
          </select>
          <button class="btn btn-primary" onclick="Comms.addAnnouncement()">+ New Announcement</button>
        </div>
        <div id="ann-cards" style="display:flex;flex-direction:column;gap:12px;"></div>`;

      function renderAnns(data) {
        const el=document.getElementById('ann-cards'); if(!el) return;
        if(!data.length){el.innerHTML=`<div class="empty-state"><div class="empty-state-icon">📢</div><div class="empty-state-title">No announcements</div></div>`;return;}
        el.innerHTML=data.map(a=>{
          const isExpiring = a.status==='Active' && a.endDate && a.endDate<=Storage.today(3);
          return `
            <div class="card" style="${isExpiring?'border-left:3px solid var(--yellow)':''}">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
                <div style="flex:1;">
                  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
                    ${UI.badge(a.status, a.status==='Active'?'green':a.status==='Scheduled'?'blue':'gray')}
                    ${UI.badge(a.category, categoryColors[a.category]||'gray')}
                    ${UI.badge(a.priority+' Priority', a.priority==='High'?'red':a.priority==='Medium'?'yellow':'gray')}
                    ${isExpiring?UI.badge('Expiring Soon','yellow'):''}
                  </div>
                  <div style="font-weight:800;font-size:.96rem;margin-bottom:4px;">${UI.esc(a.title)}</div>
                  <div style="font-size:.83rem;color:var(--text-muted);line-height:1.5;margin-bottom:8px;">${UI.esc(a.body)}</div>
                  <div style="font-size:.74rem;color:var(--text-muted);">
                    📅 ${UI.fmtDate(a.startDate)} – ${UI.fmtDate(a.endDate)}
                    &nbsp;·&nbsp; 👥 ${a.audience}
                    &nbsp;·&nbsp; 📡 ${(a.channels||[]).join(', ')}
                  </div>
                </div>
                <div style="display:flex;gap:6px;flex-shrink:0;">
                  <button class="btn btn-ghost btn-sm" onclick="Comms.editAnnouncement('${a.id}')">Edit</button>
                  <button class="btn btn-ghost btn-sm" style="color:var(--red)" aria-label="Remove announcement" onclick="Comms.removeAnnouncement('${a.id}')">×</button>
                </div>
              </div>
            </div>`;
        }).join('');
      }
      renderAnns(announcements);
      document.getElementById('ann-search')?.addEventListener('input',function(){
        const q=this.value.toLowerCase();
        const st=document.getElementById('ann-status')?.value||'';
        renderAnns(announcements.filter(a=>{
          const txt=`${a.title} ${a.body} ${a.category}`.toLowerCase();
          return txt.includes(q)&&(!st||a.status===st);
        }));
      });
      document.getElementById('ann-status')?.addEventListener('change',function(){
        const q=document.getElementById('ann-search')?.value.toLowerCase()||'';
        renderAnns(announcements.filter(a=>{
          const txt=`${a.title} ${a.body} ${a.category}`.toLowerCase();
          return txt.includes(q)&&(!this.value||a.status===this.value);
        }));
      });

    } else if(activeTab==='bulletin') {
      body.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
          <div style="font-size:.88rem;color:var(--text-muted)">Create and manage weekly bulletins</div>
          <button class="btn btn-primary" onclick="Comms.newBulletin()">+ New Bulletin</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">
          ${bulletins.map(b=>`
            <div class="card">
              <div style="font-weight:800;margin-bottom:6px;">${UI.esc(b.title)}</div>
              <div style="font-size:.8rem;color:var(--text-muted);margin-bottom:10px;">📅 ${UI.fmtDate(b.date)}</div>
              <div style="font-size:.82rem;margin-bottom:10px;line-height:1.5;">
                ${b.sermonTitle?`<div>📖 <strong>${UI.esc(b.sermonTitle)}</strong></div>`:''}
                ${b.speaker?`<div>🎤 ${UI.esc(b.speaker)}</div>`:''}
                ${b.sermonSeries?`<div style="color:var(--text-muted)">Series: ${UI.esc(b.sermonSeries)}</div>`:''}
              </div>
              <div style="display:flex;gap:6px;">
                <button class="btn btn-primary btn-sm" onclick="Comms.previewBulletin('${b.id}')">Preview</button>
                <button class="btn btn-ghost btn-sm" onclick="Comms.editBulletin('${b.id}')">Edit</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--red)" aria-label="Remove bulletin" onclick="Comms.removeBulletin('${b.id}')">×</button>
              </div>
            </div>`).join('') || '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-title">No bulletins yet</div></div>'}
        </div>`;

    } else if(activeTab==='templates') {
      const templates = [
        { icon:'👋', name:'Welcome New Visitor', desc:'Warm follow-up message for first-time visitors', category:'Pastoral' },
        { icon:'🎂', name:'Birthday Greeting', desc:'Personal birthday message for members', category:'Pastoral' },
        { icon:'🏥', name:'Hospital Visit Notice', desc:'Notify care team of a member hospitalization', category:'Care' },
        { icon:'💒', name:'Membership Congratulations', desc:'Welcome message for new members', category:'Membership' },
        { icon:'🙏', name:'Prayer Request Acknowledgment', desc:'Confirm receipt of a prayer request', category:'Prayer' },
        { icon:'💰', name:'Pledge Reminder', desc:'Gentle giving/pledge reminder message', category:'Giving' },
        { icon:'📣', name:'Event Reminder', desc:'Upcoming event reminder with details', category:'Events' },
        { icon:'❤️', name:'Bereavement Note', desc:'Compassionate message for grieving families', category:'Care' },
        { icon:'🌍', name:'Volunteer Thank You', desc:'Appreciation message for volunteers', category:'Outreach' },
        { icon:'📱', name:'Absentee Follow-Up', desc:'Check in with members who haven\'t attended recently', category:'Pastoral' },
      ];
      body.innerHTML = `
        <div style="font-size:.84rem;color:var(--text-muted);margin-bottom:16px;">Click any template to open it pre-filled with your church's data.</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;">
          ${templates.map(t=>`
            <div class="card" style="cursor:pointer" onclick="Comms.openTemplate('${encodeURIComponent(t.name)}')">
              <div style="font-size:1.5rem;margin-bottom:8px;">${t.icon}</div>
              <div style="font-weight:800;margin-bottom:4px;">${t.name}</div>
              <div style="font-size:.78rem;color:var(--text-muted);margin-bottom:10px;">${t.desc}</div>
              ${UI.badge(t.category,'blue')}
            </div>`).join('')}
        </div>`;
    }
  }

  page.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">📢 Communications Hub</h2>
        <div class="section-subtitle">Announcements · Weekly bulletin · Message templates</div>
      </div>
    </div>

    <div class="stat-grid" style="margin-bottom:20px;">
      <div class="stat-card" data-accent="green"><div class="stat-icon">📣</div><div class="stat-value">${active}</div><div class="stat-label">Active Announcements</div></div>
      <div class="stat-card" data-accent="blue"><div class="stat-icon">📅</div><div class="stat-value">${scheduled}</div><div class="stat-label">Scheduled</div></div>
      <div class="stat-card" data-accent="yellow"><div class="stat-icon">⏰</div><div class="stat-value">${expiring}</div><div class="stat-label">Expiring in 3 Days</div></div>
      <div class="stat-card" data-accent="purple"><div class="stat-icon">📋</div><div class="stat-value">${bulletins.length}</div><div class="stat-label">Bulletins on File</div></div>
    </div>

    <div id="comms-tabs" style="display:flex;gap:4px;border-bottom:2px solid var(--border);margin-bottom:20px;flex-wrap:wrap;">
      ${[['announcements','📣 Announcements'],['bulletin','📋 Bulletin Builder'],['templates','✉️ Message Templates']].map(([t,l])=>`
        <button class="tab-btn${activeTab===t?' active':''}" data-tab="${t}" onclick="Comms._setTab('${t}')">${l}</button>`).join('')}
    </div>
    <div id="comms-body"></div>
  `;
  renderContent();
});

const Comms = {
  _state: { search: '' },
  _rerender() {
    const _s = document.getElementById('ann-search');
    if (_s) Comms._state.search = _s.value;
    Comms._rerender();
    const _ns = document.getElementById('ann-search');
    if (_ns && Comms._state.search) { _ns.value = Comms._state.search; _ns.dispatchEvent(new Event('input')); }
  },
  _setTab(t) { Storage.set('_comms_tab',t); Comms._state.search = ''; Navigation.navigate('communications'); },
  _annForm(a={}) {
    const cats=['Service','Outreach','Children','Youth','Membership','Missions','General'];
    const auds=['All','Members','Visitors','Families','Youth','Leadership'];
    const chs=['Bulletin','Email','Text','Screen','Website','Social Media'];
    return `
      <div class="form-group"><label class="form-label">Title *</label><input class="form-control" id="an-title" value="${UI.esc(a.title||'')}"></div>
      <div class="form-group"><label class="form-label">Body *</label><textarea class="form-control" id="an-body" rows="3">${UI.esc(a.body||'')}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Category</label>
          <select class="form-control" id="an-cat">${cats.map(c=>`<option ${(a.category||'General')===c?'selected':''}>${c}</option>`).join('')}</select>
        </div>
        <div class="form-group"><label class="form-label">Audience</label>
          <select class="form-control" id="an-aud">${auds.map(c=>`<option ${(a.audience||'All')===c?'selected':''}>${c}</option>`).join('')}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Priority</label>
          <select class="form-control" id="an-pri">
            ${['High','Medium','Low'].map(p=>`<option ${(a.priority||'Medium')===p?'selected':''}>${p}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Status</label>
          <select class="form-control" id="an-status">
            ${['Active','Scheduled','Archived'].map(s=>`<option ${(a.status||'Active')===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Start Date</label><input class="form-control" id="an-start" type="date" value="${a.startDate||Storage.today()}"></div>
        <div class="form-group"><label class="form-label">End Date</label><input class="form-control" id="an-end" type="date" value="${a.endDate||Storage.today(7)}"></div>
      </div>
      <div class="form-group"><label class="form-label">Channels</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;">
          ${chs.map(ch=>`<label style="display:flex;align-items:center;gap:5px;font-size:.84rem;cursor:pointer;">
            <input type="checkbox" value="${ch}" ${(a.channels||['Bulletin']).includes(ch)?'checked':''}> ${ch}
          </label>`).join('')}
        </div>
      </div>`;
  },
  _collectAnn() {
    const v=id=>document.getElementById(id)?.value?.trim()||'';
    const channels=[...document.querySelectorAll('input[type=checkbox]:checked')].map(c=>c.value);
    return { title:v('an-title'),body:v('an-body'),category:v('an-cat'),audience:v('an-aud'),priority:v('an-pri'),status:v('an-status'),startDate:v('an-start'),endDate:v('an-end'),channels };
  },
  addAnnouncement() {
    Modal.open({ title:'📣 New Announcement', body:this._annForm(), width:'540px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-an-btn">Save</button>` });
    document.getElementById('save-an-btn').onclick=()=>{
      const d=this._collectAnn();
      if(!Validate.check([
        ['an-title', Validate.required(d.title,'Title')],
        ['an-body',  Validate.required(d.body,'Message body')],
      ])) return;
      Storage.insert('announcements',d); Modal.close(); Toast.success('Announcement saved'); Comms._rerender();
    };
  },
  editAnnouncement(id) {
    const a=Storage.findById('announcements',id); if(!a) return;
    Modal.open({ title:'Edit Announcement', body:this._annForm(a), width:'540px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-an-btn">Save</button>` });
    document.getElementById('save-an-btn').onclick=()=>{
      Storage.update('announcements',id,this._collectAnn()); Modal.close(); Toast.success('Updated'); Comms._rerender();
    };
  },
  removeAnnouncement(id) {
    UI.confirm('Delete this announcement?',()=>{ Storage.removeItem('announcements',id); Toast.success('Deleted'); Comms._rerender(); });
  },
  newBulletin() {
    const settings = Storage.getSettings();
    Modal.open({ title:'📋 New Bulletin', width:'560px', body:`
      <div class="form-group"><label class="form-label">Bulletin Title *</label><input class="form-control" id="bl-title" value="Sunday Bulletin — ${Storage.today()}"></div>
      <div class="form-group"><label class="form-label">Date</label><input class="form-control" id="bl-date" type="date" value="${Storage.today()}"></div>
      <div class="form-group"><label class="form-label">Welcome Message</label><textarea class="form-control" id="bl-welcome" rows="2">${UI.esc(settings.welcomeMessage||'Welcome! We are so glad you are here.')}</textarea></div>
      <div class="form-group"><label class="form-label">Scripture / Theme Verse</label><input class="form-control" id="bl-scripture"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Sermon Title</label><input class="form-control" id="bl-sermon"></div>
        <div class="form-group"><label class="form-label">Speaker</label><input class="form-control" id="bl-speaker" value="${UI.esc(settings.pastorName||'')}"></div>
      </div>
      <div class="form-group"><label class="form-label">Series Name</label><input class="form-control" id="bl-series"></div>
      <div class="form-group"><label class="form-label">Offering Note</label><input class="form-control" id="bl-offering" value="Your generosity makes ministry possible. Thank you."></div>`,
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-bl-btn">Create Bulletin</button>` });
    document.getElementById('save-bl-btn').onclick=()=>{
      const v=id=>document.getElementById(id)?.value?.trim()||'';
      if(!Validate.check([['bl-title', Validate.required(v('bl-title'),'Bulletin title')]])) return;
      const activeAnns=Storage.getAll('announcements').filter(a=>a.status==='Active').slice(0,4).map(a=>a.id);
      Storage.insert('bulletins',{ title:v('bl-title'), date:v('bl-date'), welcome:v('bl-welcome'), scripture:v('bl-scripture'), sermonTitle:v('bl-sermon'), speaker:v('bl-speaker'), sermonSeries:v('bl-series'), offeringNote:v('bl-offering'), announcements:activeAnns, closingNote:'Join us for coffee and fellowship after service.' });
      Modal.close(); Toast.success('Bulletin created'); Comms._rerender();
    };
  },
  editBulletin(id) {
    const b=Storage.findById('bulletins',id); if(!b) return;
    Modal.open({ title:'Edit Bulletin', width:'560px', body:`
      <div class="form-group"><label class="form-label">Title</label><input class="form-control" id="bl-title" value="${UI.esc(b.title)}"></div>
      <div class="form-group"><label class="form-label">Date</label><input class="form-control" id="bl-date" type="date" value="${b.date}"></div>
      <div class="form-group"><label class="form-label">Welcome Message</label><textarea class="form-control" id="bl-welcome" rows="2">${UI.esc(b.welcome||'')}</textarea></div>
      <div class="form-group"><label class="form-label">Scripture</label><input class="form-control" id="bl-scripture" value="${UI.esc(b.scripture||'')}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Sermon Title</label><input class="form-control" id="bl-sermon" value="${UI.esc(b.sermonTitle||'')}"></div>
        <div class="form-group"><label class="form-label">Speaker</label><input class="form-control" id="bl-speaker" value="${UI.esc(b.speaker||'')}"></div>
      </div>
      <div class="form-group"><label class="form-label">Series</label><input class="form-control" id="bl-series" value="${UI.esc(b.sermonSeries||'')}"></div>
      <div class="form-group"><label class="form-label">Offering Note</label><input class="form-control" id="bl-offering" value="${UI.esc(b.offeringNote||'')}"></div>`,
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-bl-btn">Save</button>` });
    document.getElementById('save-bl-btn').onclick=()=>{
      const v=id=>document.getElementById(id)?.value?.trim()||'';
      Storage.update('bulletins',id,{ title:v('bl-title'),date:v('bl-date'),welcome:v('bl-welcome'),scripture:v('bl-scripture'),sermonTitle:v('bl-sermon'),speaker:v('bl-speaker'),sermonSeries:v('bl-series'),offeringNote:v('bl-offering') });
      Modal.close(); Toast.success('Updated'); Comms._rerender();
    };
  },
  previewBulletin(id) {
    const b=Storage.findById('bulletins',id); if(!b) return;
    const settings=Storage.getSettings();
    const churchName=settings.churchName||'Our Church';
    const anns=Storage.getAll('announcements').filter(a=>(b.announcements||[]).includes(a.id));
    Modal.open({ title:'Bulletin Preview', width:'600px', body:`
      <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;font-size:.86rem;line-height:1.7;color:#222;">
        <div style="text-align:center;border-bottom:3px double #333;padding-bottom:16px;margin-bottom:16px;">
          <div style="font-size:1.4rem;font-weight:900;letter-spacing:.05em;text-transform:uppercase;">${UI.esc(churchName)}</div>
          <div style="font-size:.9rem;color:#666;">${UI.fmtDate(b.date)}</div>
        </div>
        ${b.welcome?`<p style="font-style:italic;color:#555;border-left:3px solid #ddd;padding-left:12px;">${UI.esc(b.welcome)}</p>`:''}
        ${b.scripture?`<div style="background:#f9f5ef;border-radius:4px;padding:12px;margin:12px 0;font-style:italic;text-align:center;">${UI.esc(b.scripture)}</div>`:''}
        ${b.sermonTitle?`<div style="margin:16px 0;">
          <div style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#888;">Today's Message</div>
          <div style="font-size:1.1rem;font-weight:800;">${UI.esc(b.sermonTitle)}</div>
          ${b.sermonSeries?`<div style="font-size:.8rem;color:#666;">Series: ${UI.esc(b.sermonSeries)}</div>`:''}
          ${b.speaker?`<div style="font-size:.82rem;color:#555;">Speaker: ${UI.esc(b.speaker)}</div>`:''}
        </div>`:''}
        ${anns.length?`<div style="margin:16px 0;">
          <div style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#888;margin-bottom:8px;">Announcements</div>
          ${anns.map(a=>`<div style="margin-bottom:10px;"><strong>${UI.esc(a.title)}</strong><br>${UI.esc(a.body)}</div>`).join('')}
        </div>`:''}
        ${b.offeringNote?`<div style="margin:16px 0;padding:10px;background:#f5f5f5;border-radius:4px;font-size:.8rem;color:#555;">${UI.esc(b.offeringNote)}</div>`:''}
        ${b.closingNote?`<div style="text-align:center;font-style:italic;color:#777;border-top:1px solid #ddd;padding-top:12px;">${UI.esc(b.closingNote)}</div>`:''}
      </div>`,
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Close</button>` });
  },
  removeBulletin(id) {
    UI.confirm('Delete this bulletin?',()=>{ Storage.removeItem('bulletins',id); Toast.success('Deleted'); Comms._rerender(); });
  },
  openTemplate(encodedName) {
    const name=decodeURIComponent(encodedName);
    const settings=Storage.getSettings();
    const church=settings.churchName||'Our Church';
    const pastor=settings.pastorName||'Pastor';
    const templates = {
      'Welcome New Visitor': { subject:`Thank You for Visiting ${church}!`, body:`Dear [Name],\n\nThank you so much for joining us this past Sunday! We are thrilled you chose to worship with us and hope you felt welcomed.\n\nWe'd love to get to know you better. If you have any questions about our church family, please feel free to reach out.\n\nWe hope to see you again soon!\n\nWarmly,\n${pastor}\n${church}` },
      'Birthday Greeting':   { subject:`Happy Birthday from ${church}!`, body:`Dear [Name],\n\nWishing you a wonderful birthday filled with joy, laughter, and God's blessings!\n\nYou are a valued member of our church family and we thank God for you.\n\nHappy Birthday!\n\nWith love,\nThe ${church} Family` },
      'Hospital Visit Notice':{ subject:`Pastoral Care — Hospital Visit`, body:`Dear Care Team,\n\n[Name] has been admitted to [Hospital]. Please add them to your prayer list and reach out as you are able.\n\nContact: [Phone]\nRoom: [Room #]\nBest visiting hours: [Hours]\n\nThank you for your faithful ministry.\n\n${pastor}` },
      'Membership Congratulations': { subject:`Welcome to the ${church} Family!`, body:`Dear [Name],\n\nCongratulations on becoming an official member of ${church}! We are so excited to have you as part of our family.\n\nYour membership means you are committed to growing together in faith, serving the community, and glorifying God alongside us.\n\nWelcome home!\n\nIn Christ,\n${pastor} and the Leadership Team` },
      'Prayer Request Acknowledgment': { subject:`Your Prayer Request — ${church}`, body:`Dear [Name],\n\nThank you for trusting us with your prayer request. Our prayer team has received it and will be lifting you up before the Lord.\n\n"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God." — Philippians 4:6\n\nWe are standing with you.\n\n${pastor}` },
      'Pledge Reminder': { subject:`Stewardship Reminder — ${church}`, body:`Dear [Name],\n\nThank you for your faithful generosity to ${church}. This is a gentle reminder about your giving pledge for this year.\n\nYour contributions make a real difference in the lives of people in our congregation and community.\n\nYou can give online, by check, or in the offering. Thank you for your partnership in this ministry.\n\nBlessings,\n${pastor}` },
      'Event Reminder': { subject:`Reminder: [Event Name] at ${church}`, body:`Dear [Name],\n\nJust a friendly reminder that [Event Name] is coming up on [Date] at [Time].\n\n📍 Location: [Location]\n\n[Brief description of the event and what to expect]\n\nWe hope to see you there! Please contact us at [Contact] with any questions.\n\nBlessings,\n${church}` },
      'Bereavement Note': { subject:`Our Deepest Condolences`, body:`Dear [Name] and Family,\n\nOn behalf of ${church}, we want to express our deepest condolences on the loss of [Loved One's Name]. We are so sorry for your pain.\n\n"Blessed are those who mourn, for they will be comforted." — Matthew 5:4\n\nOur congregation is praying for you and is here to support you in any way you need. Please do not hesitate to reach out.\n\nWith love and prayers,\n${pastor} and the ${church} Family` },
      'Volunteer Thank You': { subject:`Thank You for Your Service!`, body:`Dear [Name],\n\nWe want to take a moment to sincerely thank you for your dedication and service to ${church}.\n\nYour willingness to give your time and talents makes a lasting impact — more than you may ever know. You are truly a blessing to this ministry and to everyone you serve.\n\nThank you for being the hands and feet of Christ.\n\nWith deep appreciation,\n${pastor}` },
      'Absentee Follow-Up': { subject:`We Miss You at ${church}!`, body:`Dear [Name],\n\nWe've noticed we haven't seen you lately and just wanted to reach out to let you know you've been on our hearts.\n\nWe hope everything is well. If there is anything you need — whether prayer, a visit, or just someone to talk to — please know that we are here for you.\n\nWe'd love to see you soon!\n\nWith care,\n${pastor}\n${church}` },
    };
    const tmpl=templates[name]; if(!tmpl) return;
    Modal.open({ title:`✉️ ${name}`, width:'560px', body:`
      <div class="form-group"><label class="form-label">Subject</label><input class="form-control" id="tmpl-subject" value="${UI.esc(tmpl.subject)}"></div>
      <div class="form-group"><label class="form-label">Message</label><textarea class="form-control" id="tmpl-body" rows="12" style="font-family:inherit;">${UI.esc(tmpl.body)}</textarea></div>
      <div style="font-size:.76rem;color:var(--text-muted);margin-top:6px;">Replace [bracketed] placeholders with specific details before sending.</div>`,
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Close</button>
              <button class="btn btn-primary" onclick="Comms._copyTemplate()">Copy to Clipboard</button>` });
  },
  _copyTemplate() {
    const subj=document.getElementById('tmpl-subject')?.value||'';
    const body=document.getElementById('tmpl-body')?.value||'';
    const text=`Subject: ${subj}\n\n${body}`;
    if(navigator.clipboard) navigator.clipboard.writeText(text).then(()=>Toast.success('Copied to clipboard'));
    else { const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); Toast.success('Copied to clipboard'); }
  },
};
window.Comms = Comms;

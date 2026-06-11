/* =============================================================
   sermons.js  —  Sermon Library module
   ============================================================= */

// ── Seed sermon data (added to storage.js seedIfEmpty flow here) ──
(function seedSermons() {
  if (Storage.get('_sermons_seeded')) return;
  const sermons = [
    {
      id: Storage.uid(), series: 'Walking by Faith', title: 'Faith That Moves Mountains',
      speaker: 'Pastor James Wilson', date: Storage.today(-7),
      scripture: 'Matthew 17:20; Hebrews 11:1', topic: 'Faith',
      notes: 'Key points: (1) Faith is not the absence of doubt. (2) Small faith + big God = supernatural results. (3) Community faith vs. individual faith.',
      resources: 'Sermon notes PDF, worship setlist', audioUrl: '', videoUrl: '',
      tags: ['Faith', 'Prayer', 'Trust'], createdAt: Storage.today(-7),
    },
    {
      id: Storage.uid(), series: 'Walking by Faith', title: 'Trusting When You Cannot See',
      speaker: 'Pastor James Wilson', date: Storage.today(-14),
      scripture: '2 Corinthians 5:7; Proverbs 3:5-6', topic: 'Faith',
      notes: 'Explored Abraham\'s journey. Three kinds of trust: intellectual, emotional, volitional. Challenge: identify one area to surrender to God this week.',
      resources: 'Discussion guide available', audioUrl: '', videoUrl: '',
      tags: ['Faith', 'Trust', 'Abraham'], createdAt: Storage.today(-14),
    },
    {
      id: Storage.uid(), series: 'Walking by Faith', title: 'The Hall of Faith',
      speaker: 'David Martinez', date: Storage.today(-21),
      scripture: 'Hebrews 11:1-40', topic: 'Faith',
      notes: 'Guest speaker David Martinez led us through Hebrews 11 — the great cloud of witnesses. Emphasis on perseverance and the long arc of faith.',
      resources: '', audioUrl: '', videoUrl: '',
      tags: ['Faith', 'Hebrews', 'Heroes'], createdAt: Storage.today(-21),
    },
    {
      id: Storage.uid(), series: 'The Sermon on the Mount', title: 'Blessed Are the Meek',
      speaker: 'Pastor James Wilson', date: Storage.today(-35),
      scripture: 'Matthew 5:1-12', topic: 'Beatitudes',
      notes: 'Series intro + Beatitudes overview. Meekness is not weakness — it is power under control. Jesus as the ultimate example of meekness.',
      resources: 'Sermon on the Mount study guide (8 weeks)', audioUrl: '', videoUrl: '',
      tags: ['Beatitudes', 'Sermon on the Mount', 'Character'], createdAt: Storage.today(-35),
    },
    {
      id: Storage.uid(), series: 'The Sermon on the Mount', title: 'Salt and Light',
      speaker: 'Pastor James Wilson', date: Storage.today(-42),
      scripture: 'Matthew 5:13-16', topic: 'Witness',
      notes: 'We are called to be salt (preserving, flavoring) and light (revealing, guiding). Practical applications for daily witness in workplace and family.',
      resources: '', audioUrl: '', videoUrl: '',
      tags: ['Witness', 'Mission', 'Salt and Light'], createdAt: Storage.today(-42),
    },
    {
      id: Storage.uid(), series: 'Easter 2025', title: 'He Is Risen — Now What?',
      speaker: 'Pastor James Wilson', date: Storage.today(-56),
      scripture: 'Luke 24:1-12; 1 Corinthians 15:14-17', topic: 'Resurrection',
      notes: 'Easter Sunday message. The resurrection is not just past history — it is our present power and future hope. Record attendance: 218.',
      resources: 'Easter bulletin, visitor welcome packet', audioUrl: '', videoUrl: '',
      tags: ['Easter', 'Resurrection', 'Hope'], createdAt: Storage.today(-56),
    },
    {
      id: Storage.uid(), series: 'Community', title: 'Better Together',
      speaker: 'Michael Thompson', date: Storage.today(-63),
      scripture: 'Ecclesiastes 4:9-12; Acts 2:42-47', topic: 'Community',
      notes: 'Deacon Michael Thompson shared on the power of biblical community. Small groups highlighted as the backbone of church life.',
      resources: 'Small group sign-up sheets distributed', audioUrl: '', videoUrl: '',
      tags: ['Community', 'Small Groups', 'Fellowship'], createdAt: Storage.today(-63),
    },
    {
      id: Storage.uid(), series: 'Community', title: 'Bearing One Another\'s Burdens',
      speaker: 'Pastor James Wilson', date: Storage.today(-70),
      scripture: 'Galatians 6:1-10; Romans 15:1-7', topic: 'Community',
      notes: 'Practical message on how to walk with someone through hardship. Introduced the care ministry expansion.',
      resources: 'Care ministry brochure', audioUrl: '', videoUrl: '',
      tags: ['Care', 'Community', 'Compassion'], createdAt: Storage.today(-70),
    },
  ];
  Storage.saveAll('sermons', sermons);
  Storage.set('_sermons_seeded', true);
})();

Navigation.register('sermons', function render(page) {
  const sermons = Storage.getAll('sermons').sort((a, b) => b.date.localeCompare(a.date));
  const series  = [...new Set(sermons.map(s => s.series).filter(Boolean))];
  const topics  = [...new Set(sermons.map(s => s.topic).filter(Boolean))];
  const speakers = [...new Set(sermons.map(s => s.speaker).filter(Boolean))];

  function renderGrid(data) {
    const grid = document.getElementById('sermon-grid');
    if (!grid) return;
    if (!data.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📖</div><div class="empty-state-title">No sermons found</div></div>`;
      return;
    }
    grid.innerHTML = data.map(s => `
      <div class="card" style="display:flex;flex-direction:column;gap:10px;cursor:pointer;" onclick="Sermons.view('${s.id}')">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
          <div>
            <div style="font-size:.72rem;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">${UI.esc(s.series||'Standalone')}</div>
            <div style="font-weight:700;font-size:.95rem;line-height:1.3;">${UI.esc(s.title)}</div>
          </div>
          <div style="background:var(--accent-light);color:var(--accent);border-radius:8px;padding:6px 10px;text-align:center;min-width:44px;flex-shrink:0;">
            <div style="font-size:.65rem;font-weight:700;text-transform:uppercase;">${new Date(s.date+'T00:00:00').toLocaleDateString('en-US',{month:'short'})}</div>
            <div style="font-size:1.1rem;font-weight:800;line-height:1;">${new Date(s.date+'T00:00:00').getDate()}</div>
          </div>
        </div>
        <div style="font-size:.82rem;color:var(--text-muted);">📖 ${UI.esc(s.scripture)}</div>
        <div style="font-size:.82rem;color:var(--text-muted);">👤 ${UI.esc(s.speaker)}</div>
        ${s.notes ? `<div style="font-size:.8rem;color:var(--text-muted);line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${UI.esc(s.notes)}</div>` : ''}
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">
          ${(s.tags||[]).map(tag=>`<span class="badge badge-blue">${UI.esc(tag)}</span>`).join('')}
        </div>
        <div style="display:flex;gap:6px;margin-top:auto;padding-top:8px;border-top:1px solid var(--border);">
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();Sermons.edit('${s.id}')">Edit</button>
          <button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="event.stopPropagation();Sermons.remove('${s.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  }

  page.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">Sermon Library</h2>
        <div class="section-subtitle">${sermons.length} sermons across ${series.length} series</div>
      </div>
      <button class="btn btn-primary" onclick="Sermons.add()">+ Add Sermon</button>
    </div>

    <!-- Series summary -->
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:24px;">
      ${series.map(ser => {
        const count = sermons.filter(s => s.series === ser).length;
        const latest = sermons.find(s => s.series === ser);
        return `
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:10px 14px;box-shadow:var(--shadow);min-width:160px;">
            <div style="font-size:.78rem;font-weight:700;color:var(--accent);">📚 ${UI.esc(ser)}</div>
            <div style="font-size:.82rem;color:var(--text-muted);margin-top:2px;">${count} message${count!==1?'s':''}</div>
          </div>`;
      }).join('')}
    </div>

    <div class="toolbar">
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" class="search-input" id="sermon-search" placeholder="Search by title, scripture, speaker, tag…">
      </div>
      <select class="filter-select" id="sermon-series-filter">
        <option value="">All Series</option>
        ${series.map(s=>`<option>${UI.esc(s)}</option>`).join('')}
      </select>
      <select class="filter-select" id="sermon-speaker-filter">
        <option value="">All Speakers</option>
        ${speakers.map(s=>`<option>${UI.esc(s)}</option>`).join('')}
      </select>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;" id="sermon-grid"></div>
  `;

  renderGrid(sermons);

  function filtered() {
    const q  = document.getElementById('sermon-search')?.value.toLowerCase() || '';
    const sr = document.getElementById('sermon-series-filter')?.value || '';
    const sp = document.getElementById('sermon-speaker-filter')?.value || '';
    return sermons.filter(s => {
      const txt = `${s.title} ${s.series} ${s.speaker} ${s.scripture} ${s.notes} ${(s.tags||[]).join(' ')}`.toLowerCase();
      return (!q || txt.includes(q)) && (!sr || s.series === sr) && (!sp || s.speaker === sp);
    });
  }

  document.getElementById('sermon-search')?.addEventListener('input', () => renderGrid(filtered()));
  document.getElementById('sermon-series-filter')?.addEventListener('change', () => renderGrid(filtered()));
  document.getElementById('sermon-speaker-filter')?.addEventListener('change', () => renderGrid(filtered()));
});

const Sermons = {
  _state: { search: '' },
  _rerender() {
    const _s = document.getElementById('sermon-search');
    if (_s) Sermons._state.search = _s.value;
    Sermons._rerender();
    const _ns = document.getElementById('sermon-search');
    if (_ns && Sermons._state.search) { _ns.value = Sermons._state.search; _ns.dispatchEvent(new Event('input')); }
  },
  _form(s = {}) {
    const members = Storage.getAll('members').filter(m => m.status === 'Active').map(m => `${m.firstName} ${m.lastName}`);
    const settings = Storage.getSettings();
    const allSeries = [...new Set(Storage.getAll('sermons').map(s => s.series).filter(Boolean))];
    return `
      <div class="form-group"><label class="form-label">Sermon Title *</label>
        <input class="form-control" id="sm-title" value="${UI.esc(s.title||'')}">
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Series</label>
          <input class="form-control" id="sm-series" list="series-list" value="${UI.esc(s.series||'')}">
          <datalist id="series-list">${allSeries.map(sr=>`<option value="${UI.esc(sr)}">`).join('')}</datalist>
        </div>
        <div class="form-group"><label class="form-label">Date</label>
          <input class="form-control" id="sm-date" type="date" value="${s.date||Storage.today()}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Speaker</label>
          <input class="form-control" id="sm-speaker" list="speaker-list" value="${UI.esc(s.speaker||settings.pastorName||'')}">
          <datalist id="speaker-list">${members.map(m=>`<option value="${UI.esc(m)}">`).join('')}</datalist>
        </div>
        <div class="form-group"><label class="form-label">Topic</label>
          <input class="form-control" id="sm-topic" value="${UI.esc(s.topic||'')}">
        </div>
      </div>
      <div class="form-group"><label class="form-label">Scripture Reference</label>
        <input class="form-control" id="sm-scripture" placeholder="e.g. John 3:16; Romans 8:28" value="${UI.esc(s.scripture||'')}">
      </div>
      <div class="form-group"><label class="form-label">Sermon Notes / Outline</label>
        <textarea class="form-control" id="sm-notes" style="min-height:110px">${UI.esc(s.notes||'')}</textarea>
      </div>
      <div class="form-group"><label class="form-label">Resources / Links</label>
        <input class="form-control" id="sm-resources" placeholder="PDF links, slide links, etc." value="${UI.esc(s.resources||'')}">
      </div>
      <div class="form-group"><label class="form-label">Tags (comma-separated)</label>
        <input class="form-control" id="sm-tags" value="${UI.esc((s.tags||[]).join(', '))}">
      </div>
    `;
  },
  _collect() {
    return {
      title:     document.getElementById('sm-title')?.value.trim(),
      series:    document.getElementById('sm-series')?.value.trim(),
      date:      document.getElementById('sm-date')?.value,
      speaker:   document.getElementById('sm-speaker')?.value.trim(),
      topic:     document.getElementById('sm-topic')?.value.trim(),
      scripture: document.getElementById('sm-scripture')?.value.trim(),
      notes:     document.getElementById('sm-notes')?.value.trim(),
      resources: document.getElementById('sm-resources')?.value.trim(),
      tags:      document.getElementById('sm-tags')?.value.split(',').map(t=>t.trim()).filter(Boolean),
    };
  },
  add() {
    Modal.open({ title: '📖 Add Sermon', body: this._form(), width: '580px',
      footer: `<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
               <button class="btn btn-primary" id="save-sermon-btn">Save Sermon</button>` });
    document.getElementById('save-sermon-btn').onclick = () => {
      const d = this._collect();
      if (!Validate.check([
        ['sm-title', Validate.required(d.title,'Sermon title')],
        ['sm-date',  Validate.required(d.date,'Date')],
      ])) return;
      Storage.insert('sermons', d);
      Modal.close(); Toast.success('Sermon added'); Sermons._rerender();
    };
  },
  edit(id) {
    const s = Storage.findById('sermons', id); if (!s) return;
    Modal.open({ title: 'Edit Sermon', body: this._form(s), width: '580px',
      footer: `<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
               <button class="btn btn-primary" id="save-sermon-btn">Save Changes</button>` });
    document.getElementById('save-sermon-btn').onclick = () => {
      const d = this._collect();
      if (!Validate.check([
        ['sm-title', Validate.required(d.title,'Sermon title')],
        ['sm-date',  Validate.required(d.date,'Date')],
      ])) return;
      Storage.update('sermons', id, d);
      Modal.close(); Toast.success('Sermon updated'); Sermons._rerender();
    };
  },
  view(id) {
    const s = Storage.findById('sermons', id); if (!s) return;
    Modal.open({ title: s.title, width: '560px',
      body: `
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:.88rem;">
            <div><div style="color:var(--text-muted);font-size:.72rem;font-weight:700;text-transform:uppercase;">Series</div><div>${UI.esc(s.series||'—')}</div></div>
            <div><div style="color:var(--text-muted);font-size:.72rem;font-weight:700;text-transform:uppercase;">Date</div><div>${UI.fmtDate(s.date)}</div></div>
            <div><div style="color:var(--text-muted);font-size:.72rem;font-weight:700;text-transform:uppercase;">Speaker</div><div>${UI.esc(s.speaker)}</div></div>
            <div><div style="color:var(--text-muted);font-size:.72rem;font-weight:700;text-transform:uppercase;">Topic</div><div>${UI.esc(s.topic||'—')}</div></div>
            <div style="grid-column:span 2"><div style="color:var(--text-muted);font-size:.72rem;font-weight:700;text-transform:uppercase;">Scripture</div><div style="font-style:italic">${UI.esc(s.scripture||'—')}</div></div>
          </div>
          ${s.notes ? `<div><div style="color:var(--text-muted);font-size:.72rem;font-weight:700;text-transform:uppercase;margin-bottom:6px;">Notes / Outline</div>
            <div style="white-space:pre-wrap;font-size:.88rem;line-height:1.7;background:var(--surface-2);border-radius:var(--radius);padding:12px;">${UI.esc(s.notes)}</div></div>` : ''}
          ${s.resources ? `<div><div style="color:var(--text-muted);font-size:.72rem;font-weight:700;text-transform:uppercase;">Resources</div><div style="font-size:.86rem">${UI.esc(s.resources)}</div></div>` : ''}
          ${s.tags?.length ? `<div style="display:flex;gap:4px;flex-wrap:wrap;">${s.tags.map(t=>`<span class="badge badge-blue">${UI.esc(t)}</span>`).join('')}</div>` : ''}
        </div>`,
      footer: `<button class="btn btn-outline" onclick="Modal.close()">Close</button>
               <button class="btn btn-primary" onclick="Modal.close();Sermons.edit('${id}')">Edit</button>` });
  },
  remove(id) {
    UI.confirm('Delete this sermon record?', () => {
      Storage.removeItem('sermons', id); Toast.success('Deleted'); Sermons._rerender();
    });
  },
};
window.Sermons = Sermons;

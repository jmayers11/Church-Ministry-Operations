/* =============================================================
   tasks.js  —  Church Task Manager
   Tabs: Kanban Board | List View | By Owner
   ============================================================= */

// Overdue card style (injected once)
{
  const s = document.createElement('style');
  s.textContent = `.kanban-card-overdue { border-left: 3px solid var(--red) !important; }`;
  document.head.appendChild(s);
}

Navigation.register('tasks', function render(page) {
  const allTasks = Storage.getAll('tasks');
  const cols = [
    { id:'Todo',        label:'To Do',       dot:'#94a3b8' },
    { id:'In Progress', label:'In Progress',  dot:'#3b82f6' },
    { id:'Done',        label:'Done',         dot:'#22c55e' },
  ];
  const priorityColors = { High:'red', Medium:'yellow', Low:'blue' };
  const isOverdue = t => t.status !== 'Done' && t.dueDate && t.dueDate < Storage.today();
  const overdueCount = allTasks.filter(isOverdue).length;
  const doneCount    = allTasks.filter(t => t.status === 'Done').length;
  const categories   = [...new Set(allTasks.map(t => t.category).filter(Boolean))].sort();

  let activeTab = Storage.get('_tasks_tab') || 'kanban';

  function setTab(t) { Storage.set('_tasks_tab', t); activeTab = t; renderContent(); }

  function renderContent() {
    document.querySelectorAll('#tasks-tabs .tab-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === activeTab));
    const body = document.getElementById('tasks-body');
    if (!body) return;

    /* ══════════════════════════════
       TAB 1 — KANBAN
    ══════════════════════════════ */
    if (activeTab === 'kanban') {
      function filtered() {
        const owner = document.getElementById('tk-owner-filter')?.value || '';
        const prio  = document.getElementById('tk-prio-filter')?.value  || '';
        const cat   = document.getElementById('tk-cat-filter')?.value   || '';
        return Storage.getAll('tasks').filter(t =>
          (!owner || t.owner === owner) &&
          (!prio  || t.priority === prio) &&
          (!cat   || t.category === cat)
        );
      }

      function buildBoard(tasks) {
        const pOrder = { High:0, Medium:1, Low:2 };
        return cols.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id)
            .sort((a,b) => (pOrder[a.priority]??1) - (pOrder[b.priority]??1));
          return `
            <div class="kanban-col" data-col="${col.id}">
              <div class="kanban-col-header">
                <span style="display:flex;align-items:center;gap:6px;">
                  <span style="width:8px;height:8px;border-radius:50%;background:${col.dot};display:inline-block;"></span>
                  ${col.label}
                </span>
                <span style="background:var(--surface);border-radius:99px;padding:1px 8px;font-size:.78rem;">${colTasks.length}</span>
              </div>
              ${colTasks.map(t => `
                <div class="kanban-card ${isOverdue(t) ? 'kanban-card-overdue' : ''}" data-id="${t.id}">
                  <div class="kanban-card-title">${UI.esc(t.title)}</div>
                  ${t.category ? `<span style="font-size:.7rem;color:var(--accent);font-weight:700;"><i data-lucide="folder" class="icon-inline" aria-hidden="true"></i> ${UI.esc(t.category)}</span>` : ''}
                  ${t.description ? `<div style="font-size:.78rem;color:var(--text-muted);margin:4px 0;line-height:1.4;">${UI.esc(t.description)}</div>` : ''}
                  <div class="kanban-card-meta">
                    ${UI.badge(t.priority, priorityColors[t.priority] || 'gray')}
                    ${t.dueDate ? `<span style="color:${isOverdue(t)?'var(--red)':'var(--text-muted)'};">${isOverdue(t)?'<i data-lucide="alert-triangle" class="icon-inline" aria-hidden="true"></i> ':'<i data-lucide="calendar" class="icon-inline" aria-hidden="true"></i> '}${UI.fmtDate(t.dueDate)}</span>` : ''}
                    ${t.owner ? `<span><i data-lucide="user" class="icon-inline" aria-hidden="true"></i> ${UI.esc(t.owner)}</span>` : ''}
                  </div>
                  <div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap;">
                    ${cols.filter(c => c.id !== col.id).map(c =>
                      `<button class="btn btn-ghost btn-sm" style="font-size:.72rem;padding:3px 8px;" onclick="Tasks.move('${t.id}','${c.id}')">→ ${c.label}</button>`
                    ).join('')}
                    <button class="btn btn-ghost btn-sm" style="font-size:.72rem;padding:3px 8px;" onclick="Tasks.edit('${t.id}')">Edit</button>
                    <button class="btn btn-ghost btn-sm" style="font-size:.72rem;padding:3px 8px;color:var(--red);" aria-label="Remove task" onclick="Tasks.remove('${t.id}')">✕</button>
                  </div>
                </div>`).join('')}
              <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:8px;border:1px dashed var(--border);"
                onclick="Tasks.add('${col.id}')">+ Add task</button>
            </div>`;
        }).join('');
      }

      body.innerHTML = `
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
          <select class="filter-select" id="tk-owner-filter">
            <option value="">All Owners</option>
            ${[...new Set(allTasks.map(t=>t.owner).filter(Boolean))].map(o=>`<option>${UI.esc(o)}</option>`).join('')}
          </select>
          <select class="filter-select" id="tk-prio-filter">
            <option value="">All Priorities</option>
            <option>High</option><option>Medium</option><option>Low</option>
          </select>
          <select class="filter-select" id="tk-cat-filter">
            <option value="">All Categories</option>
            ${categories.map(c=>`<option>${UI.esc(c)}</option>`).join('')}
          </select>
        </div>
        <div class="kanban-board" id="kanban-board">${buildBoard(allTasks)}</div>`;

      function applyFilters() {
        const board = document.getElementById('kanban-board');
        if (board) board.innerHTML = buildBoard(filtered());
      }
      document.getElementById('tk-owner-filter')?.addEventListener('change', applyFilters);
      document.getElementById('tk-prio-filter')?.addEventListener('change', applyFilters);
      document.getElementById('tk-cat-filter')?.addEventListener('change', applyFilters);

    /* ══════════════════════════════
       TAB 2 — LIST VIEW
    ══════════════════════════════ */
    } else if (activeTab === 'list') {
      function listFiltered() {
        const q     = document.getElementById('tl-search')?.value.toLowerCase() || '';
        const owner = document.getElementById('tl-owner-filter')?.value || '';
        const prio  = document.getElementById('tl-prio-filter')?.value  || '';
        const stat  = document.getElementById('tl-stat-filter')?.value  || '';
        const cat   = document.getElementById('tl-cat-filter')?.value   || '';
        return Storage.getAll('tasks').filter(t => {
          const txt = `${t.title} ${t.description} ${t.owner} ${t.category}`.toLowerCase();
          return (!q || txt.includes(q)) && (!owner || t.owner === owner) &&
                 (!prio || t.priority === prio) && (!stat || t.status === stat) && (!cat || t.category === cat);
        }).sort((a,b) => {
          if (isOverdue(a) && !isOverdue(b)) return -1;
          if (!isOverdue(a) && isOverdue(b)) return 1;
          const p = { High:0, Medium:1, Low:2 };
          return (p[a.priority]??1) - (p[b.priority]??1);
        });
      }

      function thIcon(key){const {col,dir}=Tasks._sort;if(col!==key)return`<span style="opacity:.25;font-size:.7rem;margin-left:3px">↕</span>`;return`<span style="font-size:.75rem;margin-left:3px;color:var(--accent)">${dir==='asc'?'↑':'↓'}</span>`;}
      function thL(label,key){const {col,dir}=Tasks._sort;const active=col===key;const aSort=active?(dir==='asc'?'ascending':'descending'):'none';return`<th aria-sort="${aSort}" style="white-space:nowrap;${active?'color:var(--accent);':''}"><button type="button" class="sort-btn" onclick="Tasks.sortBy('${key}')">${label}${thIcon(key)}</button></th>`;}

      function renderListTable(data) {
        const wrap = document.getElementById('task-list-wrap');
        if (!wrap) return;
        const {col,dir}=Tasks._sort;
        if(col){
          data=[...data];
          const po={High:0,Medium:1,Low:2};
          data.sort((a,b)=>{
            if(col==='priority'){return dir==='asc'?(po[a.priority]??1)-(po[b.priority]??1):(po[b.priority]??1)-(po[a.priority]??1);}
            let av=a[col]||'',bv=b[col]||'';
            if(av==null||av==='')return 1;if(bv==null||bv==='')return -1;
            const cmp=String(av).localeCompare(String(bv));return dir==='asc'?cmp:-cmp;
          });
        }
        if (!data.length) { wrap.innerHTML=`<table><tbody><tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon"><i data-lucide="check-circle" class="icon-inline" aria-hidden="true"></i></div><div class="empty-state-title">No tasks match filters</div></div></td></tr></tbody></table>`; return; }
        wrap.innerHTML=`<table class="data-table"><thead><tr>${thL('Task','title')}${thL('Category','category')}${thL('Priority','priority')}${thL('Status','status')}${thL('Due Date','dueDate')}${thL('Owner','owner')}<th>Actions</th></tr></thead><tbody>${data.map(t => `<tr style="${isOverdue(t)?'border-left:3px solid var(--red);':''}">${
          `<td><strong>${UI.esc(t.title)}</strong>${t.description?`<br><small style="color:var(--text-muted)">${UI.esc(t.description.slice(0,60))}</small>`:''}</td>
          <td>${UI.esc(t.category||'')}</td>
          <td>${UI.badge(t.priority, priorityColors[t.priority]||'gray')}</td>
          <td><span class="badge ${t.status==='Done'?'badge-green':t.status==='In Progress'?'badge-blue':'badge-gray'}">${t.status}</span></td>
          <td style="color:${isOverdue(t)?'var(--red)':'inherit'}">${t.dueDate?UI.fmtDate(t.dueDate):'—'}</td>
          <td>${UI.esc(t.owner||'—')}</td>
          <td>
            ${cols.filter(c=>c.id!==t.status).map(c=>`<button class="btn btn-ghost btn-sm" style="font-size:.72rem" onclick="Tasks.move('${t.id}','${c.id}')">→ ${c.label}</button>`).join('')}
            <button class="btn btn-ghost btn-sm" onclick="Tasks.edit('${t.id}')">Edit</button>
            <button class="btn btn-ghost btn-sm" style="color:var(--red)" aria-label="Remove task" onclick="Tasks.remove('${t.id}')">✕</button>
          </td>`
        }</tr>`).join('')}</tbody></table>`;
      }

      body.innerHTML = `
        <div class="toolbar" style="margin-bottom:12px;">
          <div class="search-input-wrap">
            <i data-lucide="search" class="icon-inline search-icon-lucide" aria-hidden="true"></i>
            <input type="text" class="search-input" id="tl-search" placeholder="Search tasks…">
          </div>
          <select class="filter-select" id="tl-owner-filter">
            <option value="">All Owners</option>
            ${[...new Set(allTasks.map(t=>t.owner).filter(Boolean))].map(o=>`<option>${UI.esc(o)}</option>`).join('')}
          </select>
          <select class="filter-select" id="tl-prio-filter">
            <option value="">All Priorities</option>
            <option>High</option><option>Medium</option><option>Low</option>
          </select>
          <select class="filter-select" id="tl-stat-filter">
            <option value="">All Statuses</option>
            <option>Todo</option><option>In Progress</option><option>Done</option>
          </select>
          <select class="filter-select" id="tl-cat-filter">
            <option value="">All Categories</option>
            ${categories.map(c=>`<option>${UI.esc(c)}</option>`).join('')}
          </select>
        </div>
        <div class="table-wrap" id="task-list-wrap"></div>`;

      renderListTable(listFiltered());
      ['tl-search','tl-owner-filter','tl-prio-filter','tl-stat-filter','tl-cat-filter'].forEach(id => {
        document.getElementById(id)?.addEventListener(id==='tl-search'?'input':'change', () => renderListTable(listFiltered()));
      });
      Tasks._rerender = () => renderListTable(listFiltered());

    /* ══════════════════════════════
       TAB 3 — BY OWNER
    ══════════════════════════════ */
    } else if (activeTab === 'owner') {
      const owners = [...new Set(allTasks.map(t => t.owner).filter(Boolean))].sort();
      body.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">
          ${owners.map(owner => {
            const ownerTasks = allTasks.filter(t => t.owner === owner);
            const done = ownerTasks.filter(t => t.status === 'Done').length;
            const overdue = ownerTasks.filter(t => isOverdue(t)).length;
            return `<div class="card">
              <div style="font-weight:800;font-size:.96rem;margin-bottom:10px;"><i data-lucide="user" class="icon-inline" aria-hidden="true"></i> ${UI.esc(owner)}</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
                <span class="badge badge-blue">${ownerTasks.length} total</span>
                <span class="badge badge-green">${done} done</span>
                ${overdue ? `<span class="badge badge-red">${overdue} overdue</span>` : ''}
              </div>
              ${ownerTasks.filter(t=>t.status!=='Done').slice(0,5).map(t=>`
                <div style="padding:5px 0;border-bottom:1px solid var(--border);font-size:.83rem;display:flex;align-items:center;gap:6px;">
                  ${isOverdue(t)?'<i data-lucide="alert-triangle" class="icon-inline" aria-hidden="true"></i> ':''}
                  <span style="${isOverdue(t)?'color:var(--red)':''}">${UI.esc(t.title)}</span>
                  ${UI.badge(t.priority, priorityColors[t.priority]||'gray')}
                </div>`).join('')}
            </div>`;
          }).join('')}
          ${!owners.length ? `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon"><i data-lucide="check-circle" class="icon-inline" aria-hidden="true"></i></div><div class="empty-state-title">No tasks with owners assigned</div></div>` : ''}
        </div>`;
    }
  }

  /* ── Page shell ──────────────────────────────────────── */
  page.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">Task Manager</h2>
        <div class="section-subtitle">${allTasks.length} tasks · ${doneCount} done${overdueCount ? ` · <span style="color:var(--red)">${overdueCount} overdue</span>` : ''}</div>
      </div>
      <button class="btn btn-primary" onclick="Tasks.add()">+ Add Task</button>
    </div>

    ${overdueCount ? `<div class="alert-banner alert-banner-red"><i data-lucide="alert-triangle" class="icon-inline" aria-hidden="true"></i> <strong>${overdueCount} overdue task${overdueCount>1?'s':''}</strong> need attention.</div>` : ''}

    <div id="tasks-tabs" style="display:flex;gap:4px;border-bottom:2px solid var(--border);margin-bottom:20px;flex-wrap:wrap;">
      ${[['kanban','<i data-lucide="clipboard-list" class="icon-inline" aria-hidden="true"></i> Kanban'],['list','<i data-lucide="list" class="icon-inline" aria-hidden="true"></i> List View'],['owner','<i data-lucide="user" class="icon-inline" aria-hidden="true"></i> By Owner']].map(([t,l])=>`
        <button class="tab-btn${activeTab===t?' active':''}" data-tab="${t}" onclick="Tasks._tab('${t}')">${l}</button>`).join('')}
    </div>
    <div id="tasks-body"></div>
  `;

  renderContent();
});

/* ── Tasks global object ─────────────────────────────── */
const Tasks = {
  _state: { search: '' },
  _rerender() {
    const _s = document.getElementById('tl-search');
    if (_s) Tasks._state.search = _s.value;
    Tasks._rerender();
    const _ns = document.getElementById('tl-search');
    if (_ns && Tasks._state.search) { _ns.value = Tasks._state.search; _ns.dispatchEvent(new Event('input')); }
  },
  _sort: { col: null, dir: 'asc' },
  _rerender: null,
  sortBy(col) {
    if(this._sort.col===col) this._sort.dir=this._sort.dir==='asc'?'desc':'asc';
    else { this._sort.col=col; this._sort.dir='asc'; }
    this._rerender?.();
  },
  _tab(t) { Storage.set('_tasks_tab', t); Tasks._state.search = ''; Navigation.navigate('tasks'); },

  _form(t) {
    t = t || {};
    const owners = [...new Set(Storage.getAll('tasks').map(x=>x.owner).filter(Boolean))];
    const cats   = [...new Set(Storage.getAll('tasks').map(x=>x.category).filter(Boolean))];
    return `
      <div class="form-group"><label class="form-label">Task Title *</label><input class="form-control" id="tk-title" value="${UI.esc(t.title||'')}"></div>
      <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="tk-desc">${UI.esc(t.description||'')}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Status</label>
          <select class="form-control" id="tk-status">${['Todo','In Progress','Done'].map(s=>`<option ${(t.status||'Todo')===s?'selected':''}>${s}</option>`).join('')}</select>
        </div>
        <div class="form-group"><label class="form-label">Priority</label>
          <select class="form-control" id="tk-priority">${['High','Medium','Low'].map(p=>`<option ${(t.priority||'Medium')===p?'selected':''}>${p}</option>`).join('')}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Due Date</label><input class="form-control" id="tk-due" type="date" value="${t.dueDate||''}"></div>
        <div class="form-group"><label class="form-label">Owner</label>
          <input class="form-control" id="tk-owner" list="tk-owner-list" value="${UI.esc(t.owner||'')}">
          <datalist id="tk-owner-list">${owners.map(o=>`<option value="${UI.esc(o)}">`).join('')}</datalist>
        </div>
      </div>
      <div class="form-group"><label class="form-label">Category</label>
        <input class="form-control" id="tk-cat" list="tk-cat-list" value="${UI.esc(t.category||'')}">
        <datalist id="tk-cat-list">${cats.map(c=>`<option value="${UI.esc(c)}">`).join('')}</datalist>
      </div>`;
  },

  _collect() {
    return {
      title:       document.getElementById('tk-title')?.value.trim(),
      description: document.getElementById('tk-desc')?.value.trim(),
      status:      document.getElementById('tk-status')?.value,
      priority:    document.getElementById('tk-priority')?.value,
      dueDate:     document.getElementById('tk-due')?.value,
      owner:       document.getElementById('tk-owner')?.value.trim(),
      category:    document.getElementById('tk-cat')?.value.trim(),
    };
  },

  add(defaultStatus) {
    Modal.open({ title:'Add Task', body:this._form({status:defaultStatus||'Todo',priority:'Medium'}), width:'520px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-task-btn">Add Task</button>` });
    document.getElementById('save-task-btn').onclick = () => {
      const d=this._collect();
      if(!Validate.check([
        ['tk-title', Validate.required(d.title,'Task title')],
      ])) return;
      var _saved = Storage.insert('tasks',d);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) SupabaseDB.tableUpsert('tasks', _saved).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
      Modal.close(); Toast.success('Task added'); Tasks._rerender();
    };
  },

  edit(id) {
    const t=Storage.findById('tasks',id); if(!t) return;
    Modal.open({ title:'Edit Task', body:this._form(t), width:'520px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-task-btn">Save</button>` });
    document.getElementById('save-task-btn').onclick = () => {
      var _updated = Storage.update('tasks',id,this._collect());
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated() && _updated) SupabaseDB.tableUpsert('tasks', _updated).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
      Modal.close(); Toast.success('Updated'); Tasks._rerender();
    };
  },

  move(id, status) {
    var _moved = Storage.update('tasks', id, { status });
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated() && _moved) SupabaseDB.tableUpsert('tasks', _moved).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
    Tasks._rerender();
  },

  remove(id) {
    UI.confirm('Remove this task?', () => {
      Storage.removeItem('tasks', id);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) SupabaseDB.tableDelete('tasks', id).then(function(r){ if (r && !r.ok) Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); }).catch(function(){ Toast.error('Saved locally — cloud sync failed. Hit ⟳ Sync.'); });
      Toast.success('Removed'); Tasks._rerender();
    });
  },
};
window.Tasks = Tasks;

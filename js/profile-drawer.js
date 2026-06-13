/* =============================================================
   profile-drawer.js  —  Sliding member profile panel (3.4)
   Slides in from the right; modal (z-index 500) stacks on top
   so "Edit" opens the edit form without losing the profile view.

   API:
     ProfileDrawer.open(memberId)  — render + slide in
     ProfileDrawer.close()         — slide out
   ============================================================= */

const ProfileDrawer = (() => {
  'use strict';

  const drawer = document.getElementById('profile-drawer');
  const scrim  = document.getElementById('profile-drawer-scrim');

  const STATUS_COLORS = { Active:'green', Inactive:'gray', Transferred:'yellow', Deceased:'red' };
  const TIMELINE_ICONS = {
    prayer: 'hand-heart',
    care:   'heart-handshake',
    giving: 'hand-coins',
    join:   'calendar-check',
    note:   'file-text',
  };

  // ── Timeline assembly ──────────────────────────────────────
  function buildTimeline(m, fullName) {
    const events = [];

    if (m.joinDate) {
      events.push({ date: m.joinDate, type: 'join', label: 'Joined the church', body: null });
    }

    (Storage.getAll('prayer') || [])
      .filter(p => p.submittedBy === fullName)
      .forEach(p => events.push({
        date:  p.dateSubmitted || p.date || '',
        type:  'prayer',
        label: 'Prayer request',
        body:  p.request ? (p.request.slice(0, 90) + (p.request.length > 90 ? '…' : '')) : null,
      }));

    (Storage.getAll('care') || [])
      .filter(c => c.name === fullName || c.assignedTo === fullName)
      .forEach(c => events.push({
        date:  c.date || '',
        type:  'care',
        label: c.type || 'Care record',
        body:  c.notes ? (c.notes.slice(0, 90) + (c.notes.length > 90 ? '…' : '')) : null,
      }));

    (Storage.getAll('giving_donations') || [])
      .filter(d => d.memberName === fullName)
      .sort((a, b) => ((b.date || '') > (a.date || '') ? 1 : -1))
      .slice(0, 5)
      .forEach(d => events.push({
        date:  d.date || '',
        type:  'giving',
        label: `Gift — $${Number(d.amount || 0).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })}`,
        body:  d.fundName || d.note || null,
      }));

    return events
      .filter(e => e.date)
      .sort((a, b) => (b.date > a.date ? 1 : -1))
      .slice(0, 14);
  }

  // ── HTML builder ───────────────────────────────────────────
  function buildHTML(m) {
    const fullName = `${m.firstName} ${m.lastName}`;
    const year     = new Date().getFullYear().toString();
    const donations = (Storage.getAll('giving_donations') || []).filter(d => d.memberName === fullName);
    const ytd       = donations.filter(d => d.date?.startsWith(year)).reduce((s,d) => s + (Number(d.amount)||0), 0);
    const lifetime  = donations.reduce((s,d) => s + (Number(d.amount)||0), 0);
    const prayerCnt = (Storage.getAll('prayer') || []).filter(p => p.submittedBy === fullName).length;
    const fmt = n => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })}`;
    const timeline  = buildTimeline(m, fullName);

    // ── Contact rows ──
    const contactRows = [
      m.phone   && `<div class="detail-row"><span class="detail-label"><i data-lucide="phone"    class="icon-xs" aria-hidden="true"></i></span><span>${UI.esc(m.phone)}</span></div>`,
      m.email   && `<div class="detail-row"><span class="detail-label"><i data-lucide="mail"     class="icon-xs" aria-hidden="true"></i></span><a href="mailto:${UI.esc(m.email)}" class="link-accent">${UI.esc(m.email)}</a></div>`,
      m.address && `<div class="detail-row"><span class="detail-label"><i data-lucide="map-pin"  class="icon-xs" aria-hidden="true"></i></span><span>${UI.esc(m.address)}</span></div>`,
      m.birthday && `<div class="detail-row"><span class="detail-label"><i data-lucide="cake"    class="icon-xs" aria-hidden="true"></i></span><span>${UI.fmtDate(m.birthday)}</span></div>`,
      m.joinDate && `<div class="detail-row"><span class="detail-label"><i data-lucide="calendar" class="icon-xs" aria-hidden="true"></i></span><span>Joined ${UI.fmtDate(m.joinDate)}</span></div>`,
    ].filter(Boolean).join('');

    // ── Timeline HTML ──
    const timelineHtml = timeline.length ? `
      <div class="profile-drawer__section">
        <div class="profile-drawer__section-title">Activity</div>
        <ol class="timeline" aria-label="Member activity timeline">
          ${timeline.map((e, i) => `
            <li class="timeline-item${i === timeline.length - 1 ? ' timeline-item--last' : ''}">
              <div class="timeline-dot timeline-dot--${e.type}" aria-hidden="true">
                <i data-lucide="${TIMELINE_ICONS[e.type] || 'circle'}" aria-hidden="true"></i>
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-label">${UI.esc(e.label)}</span>
                  ${e.date ? `<span class="timeline-date">${UI.fmtDate(e.date)}</span>` : ''}
                </div>
                ${e.body ? `<div class="timeline-body">${UI.esc(e.body)}</div>` : ''}
              </div>
            </li>`).join('')}
        </ol>
      </div>` : '';

    return `
      <!-- Sticky top bar -->
      <div class="profile-drawer__bar">
        <span class="section-label-sm" style="line-height:1">Member Profile</span>
        <button class="btn btn-ghost btn-sm profile-drawer__close"
                onclick="ProfileDrawer.close()"
                aria-label="Close member profile">
          <i data-lucide="x" aria-hidden="true"></i>
        </button>
      </div>

      <!-- Hero: avatar + name + edit -->
      <div class="profile-drawer__hero">
        ${UI.avatar(fullName, 60)}
        <div class="profile-drawer__hero-info">
          <div class="profile-drawer__name">${UI.esc(fullName)}</div>
          <div class="chip-row" style="margin:4px 0 0;flex-wrap:wrap;gap:6px">
            ${UI.badge(m.status || 'Active', STATUS_COLORS[m.status] || 'gray')}
            ${m.family ? `<span class="text-meta" style="display:inline-flex;align-items:center;gap:3px"><i data-lucide="home" class="icon-xs" aria-hidden="true"></i>${UI.esc(m.family)}</span>` : ''}
          </div>
        </div>
        <button class="btn btn-outline btn-sm flex-shrink-0"
                onclick="Members.edit('${m.id}')"
                aria-label="Edit ${UI.esc(fullName)}">
          <i data-lucide="pencil" class="icon-inline" aria-hidden="true"></i> Edit
        </button>
      </div>

      <!-- Contact -->
      ${contactRows ? `<div class="profile-drawer__section">${contactRows}</div>` : ''}

      <!-- Ministries -->
      ${(m.ministries||[]).length ? `
      <div class="profile-drawer__section">
        <div class="profile-drawer__section-title">Ministries</div>
        <div class="chip-row" style="margin:0;flex-wrap:wrap">
          ${(m.ministries||[]).map(min => `<span class="badge badge-blue">${UI.esc(min)}</span>`).join('')}
        </div>
      </div>` : ''}

      <!-- Stats row -->
      <div class="profile-drawer__section">
        <div class="profile-drawer__section-title">Giving &amp; Engagement</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          <div class="stat-box">
            <div class="stat-box__value text-success">${fmt(ytd)}</div>
            <div class="stat-box__label">YTD Giving</div>
          </div>
          <div class="stat-box">
            <div class="stat-box__value text-success">${fmt(lifetime)}</div>
            <div class="stat-box__label">Lifetime</div>
          </div>
          <div class="stat-box">
            <div class="stat-box__value">${prayerCnt}</div>
            <div class="stat-box__label">Prayers</div>
          </div>
        </div>
      </div>

      <!-- Timeline -->
      ${timelineHtml}

      <!-- Notes -->
      ${m.notes ? `
      <div class="profile-drawer__section">
        <div class="profile-drawer__section-title">Notes</div>
        <div class="text-meta" style="white-space:pre-wrap">${UI.esc(m.notes)}</div>
      </div>` : ''}

      <!-- Bottom spacer so last section clears the fixed bar -->
      <div style="height:24px"></div>
    `;
  }

  // ── Open / Close ──────────────────────────────────────────
  let _openerEl = null;

  function open(memberId) {
    const m = Storage.findById('members', memberId);
    if (!m) { if (typeof Toast !== 'undefined') Toast.error('Member not found'); return; }

    _openerEl = document.activeElement;
    drawer.innerHTML = buildHTML(m);
    drawer.setAttribute('aria-hidden', 'false');
    drawer.classList.add('open');
    scrim.classList.add('open');
    document.body.classList.add('drawer-open');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    // Focus close button for keyboard users
    requestAnimationFrame(() => drawer.querySelector('.profile-drawer__close')?.focus());
  }

  function close() {
    drawer.classList.remove('open');
    scrim.classList.remove('open');
    document.body.classList.remove('drawer-open');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML = '';  // free memory
    if (_openerEl && typeof _openerEl.focus === 'function') {
      requestAnimationFrame(() => _openerEl.focus());
    }
    _openerEl = null;
  }

  // ── Event wiring ─────────────────────────────────────────
  scrim?.addEventListener('click', close);

  // Escape closes drawer (only when no modal is open)
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!drawer.classList.contains('open')) return;
    const modal = document.getElementById('modal-overlay');
    if (modal && !modal.classList.contains('hidden')) return; // modal has priority
    close();
  });

  // Swipe right on the drawer closes it (touch)
  let _swipeStartX = 0;
  drawer?.addEventListener('touchstart', e => {
    _swipeStartX = e.touches[0].clientX;
  }, { passive: true });
  drawer?.addEventListener('touchend', e => {
    if (e.changedTouches[0].clientX - _swipeStartX > 56) close();
  }, { passive: true });

  return { open, close };
})();

window.ProfileDrawer = ProfileDrawer;

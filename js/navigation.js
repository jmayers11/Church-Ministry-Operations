/* =============================================================
   navigation.js  —  Sidebar routing & theme toggle
   ============================================================= */

const Navigation = (() => {

  // Module registry: modules call Navigation.register(id, renderFn)
  const _modules = {};

  // ── Register a module render function ──────────────────────
  function register(pageId, renderFn) {
    _modules[pageId] = renderFn;
  }

  // ── Navigate to a page ──────────────────────────────────────
  function navigate(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    // Update nav links + bottom tab bar
    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.toggle('active', l.dataset.page === pageId);
    });
    document.querySelectorAll('.bottom-tab[data-page]').forEach(t => {
      t.classList.toggle('active', t.dataset.page === pageId);
    });

    const page = document.getElementById(`page-${pageId}`);
    if (!page) return;
    page.classList.add('active');

    // Update topbar title
    const link = document.querySelector(`.nav-link[data-page="${pageId}"]`);
    const label = link ? link.querySelector('.nav-label')?.textContent : pageId;
    document.getElementById('page-title').textContent = label || pageId;

    // Render module if registered
    if (_modules[pageId]) {
      // Show skeleton for one paint frame — visible on slower hardware, imperceptible on fast
      if (typeof UI !== 'undefined' && UI.skeletonPage) page.innerHTML = UI.skeletonPage();
      requestAnimationFrame(function() {
        try {
          _modules[pageId](page);
          if (typeof lucide !== 'undefined') lucide.createIcons();
          if (typeof UI !== 'undefined' && UI.a11yEnhance) UI.a11yEnhance(page);
        } catch(e) {
          console.error('Render error on ' + pageId + ':', e);
          page.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)"><p>Error loading ' + pageId + '. Check console.</p></div>';
        }
      });
    } else {
      page.innerHTML = `
        <div class="coming-soon">
          <div class="coming-soon-icon">🔧</div>
          <h2>${label || pageId}</h2>
          <p>This module is coming soon. Build it by adding logic to <code>js/${pageId}.js</code>.</p>
        </div>`;
    }

    // Save current page
    Storage.set('_lastPage', pageId);

    // Close mobile nav
    document.body.classList.remove('nav-open');
  }

  // ── Wire up nav links ────────────────────────────────────────
  function init() {
    // Sidebar nav links + bottom tab links share the same click handler
    document.querySelectorAll('.nav-link[data-page], .bottom-tab[data-page]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        navigate(link.dataset.page);
      });
    });

    // Sidebar collapse toggle (desktop)
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-collapsed');
        Storage.set('_sidebarCollapsed', document.body.classList.contains('sidebar-collapsed'));
      });
      if (Storage.get('_sidebarCollapsed')) {
        document.body.classList.add('sidebar-collapsed');
      }
    }

    // Mobile menu button
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        document.body.classList.toggle('nav-open');
      });
    }

    // Close mobile nav on outside click
    document.addEventListener('click', e => {
      if (document.body.classList.contains('nav-open')) {
        if (!e.target.closest('#sidebar') && !e.target.closest('#menu-btn') && !e.target.closest('#bottom-tab-more')) {
          document.body.classList.remove('nav-open');
        }
      }
    });

    // Nav scrim click closes the drawer
    document.getElementById('nav-scrim')?.addEventListener('click', () => {
      document.body.classList.remove('nav-open');
    });

    // Bottom "More" tab toggles the sidebar drawer
    const moreBtn = document.getElementById('bottom-tab-more');
    if (moreBtn) {
      moreBtn.addEventListener('click', () => {
        const isOpen = document.body.classList.toggle('nav-open');
        moreBtn.setAttribute('aria-expanded', String(isOpen));
      });
    }

    // Swipe left anywhere to close the sidebar drawer (touch devices)
    let _swipeStartX = 0;
    document.addEventListener('touchstart', e => {
      _swipeStartX = e.touches[0].clientX;
    }, { passive: true });
    document.addEventListener('touchend', e => {
      if (!document.body.classList.contains('nav-open')) return;
      const dx = e.changedTouches[0].clientX - _swipeStartX;
      if (dx < -48) {
        document.body.classList.remove('nav-open');
        if (moreBtn) moreBtn.setAttribute('aria-expanded', 'false');
      }
    }, { passive: true });

    // Theme toggle
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        themeBtn.textContent = next === 'dark' ? '☀️' : '🌙';
        Storage.saveSettings({ theme: next });
        window.dispatchEvent(new CustomEvent('themechange'));
      });
      // Set correct icon on load
      const theme = Storage.getSettings().theme;
      themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    // Apply saved church name to sidebar
    const settings = Storage.getSettings();
    const nameEl = document.getElementById('sidebar-church-name');
    if (nameEl) nameEl.textContent = settings.churchName;
    if (settings.logoDataUrl) {
      const logoEl = document.getElementById('church-logo');
      if (logoEl) logoEl.innerHTML = `<img src="${settings.logoDataUrl}" alt="logo" style="width:100%;height:100%;border-radius:8px;object-fit:cover;">`;
    }

    // ── Collapsible sidebar sections ──────────────────────────
    document.querySelectorAll('.nav-section-toggle').forEach(btn => {
      const sectionId = btn.getAttribute('aria-controls');
      const section   = document.getElementById(sectionId);
      if (!section) return;
      // Restore collapse state
      const savedKey = `_navSection_${btn.dataset.section}`;
      if (Storage.get(savedKey) === false) {
        btn.setAttribute('aria-expanded', 'false');
        section.classList.add('collapsed');
      }
      btn.addEventListener('click', () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!isOpen));
        section.classList.toggle('collapsed', isOpen);
        Storage.set(savedKey, !isOpen);
      });
    });

    // Render Lucide icons in sidebar chrome
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Navigate to last visited page or dashboard
    const lastPage = Storage.get('_lastPage') || 'dashboard';
    navigate(lastPage);
  }

  return { init, navigate, register };

})();

// Boot navigation after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  Navigation.init();
  if (typeof Onboarding !== 'undefined') Onboarding.maybeShow();
});
window.Navigation = Navigation;

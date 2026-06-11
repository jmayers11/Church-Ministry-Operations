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
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.toggle('active', l.dataset.page === pageId);
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
      try {
        _modules[pageId](page);
      } catch(e) {
        console.error('Render error on ' + pageId + ':', e);
        page.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)"><p>Error loading ' + pageId + '. Check console.</p></div>';
      }
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
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
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
        if (!e.target.closest('#sidebar') && !e.target.closest('#menu-btn')) {
          document.body.classList.remove('nav-open');
        }
      }
    });

    // Theme toggle
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        themeBtn.textContent = next === 'dark' ? '☀️' : '🌙';
        Storage.saveSettings({ theme: next });
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

    // Navigate to last visited page or dashboard
    const lastPage = Storage.get('_lastPage') || 'dashboard';
    navigate(lastPage);
  }

  return { init, navigate, register };

})();

// Boot navigation after DOM is ready
document.addEventListener('DOMContentLoaded', () => Navigation.init());
window.Navigation = Navigation;

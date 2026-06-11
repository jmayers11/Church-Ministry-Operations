/* =============================================================
   auth-gate.js — App-wide sign-in gate backed by Supabase Auth.
   MUST load AFTER supabase-config.js and BEFORE storage.js.

   SECURITY NOTE: This is a CLIENT-SIDE gate. It hides the UI until
   a staff member signs in via Supabase Auth, but it does NOT protect
   data stored in localStorage — a technical user can still read it
   via browser dev tools. True data protection comes from moving
   tables to Supabase with RLS, as already done for ministry_requests.
   This gate controls ACCESS TO THE INTERFACE, not the underlying data.
   ============================================================= */
(function () {
  'use strict';

  var ALLOW_DEMO_BYPASS  = false;
  var TURNSTILE_SITE_KEY = '0x4AAAAAADi6xQIiid0UM3O5';

  var form     = document.getElementById('auth-gate-form');
  var emailEl  = document.getElementById('auth-gate-email');
  var passEl   = document.getElementById('auth-gate-password');
  var errEl    = document.getElementById('auth-gate-error');
  var btn      = document.getElementById('auth-gate-btn');
  var statusEl = document.getElementById('auth-gate-status');

  var _tsWidgetId = null;

  // ── Turnstile helpers ──────────────────────────────────────────

  function renderTurnstile() {
    if (typeof turnstile === 'undefined') {
      setTimeout(renderTurnstile, 150);
      return;
    }
    var container = document.getElementById('cf-turnstile');
    if (!container || _tsWidgetId !== null) return;
    _tsWidgetId = turnstile.render(container, {
      sitekey: TURNSTILE_SITE_KEY
      // No callback needed — we call getResponse() at submit time
    });
  }

  function removeTurnstile() {
    if (typeof turnstile !== 'undefined' && _tsWidgetId !== null) {
      var container = document.getElementById('cf-turnstile');
      if (container) turnstile.remove(container);
    }
    _tsWidgetId = null;
  }

  function resetTurnstile() {
    if (typeof turnstile !== 'undefined' && _tsWidgetId !== null) {
      var container = document.getElementById('cf-turnstile');
      if (container) turnstile.reset(container);
    }
  }

  // Read the token directly from the widget at submit time (most reliable)
  function getTurnstileToken() {
    if (typeof turnstile !== 'undefined' && _tsWidgetId !== null) {
      return turnstile.getResponse(_tsWidgetId) || null;
    }
    return null;
  }

  // ── Lock / Unlock ──────────────────────────────────────────────

  function lock() {
    document.body.classList.remove('app-unlocked');
    renderTurnstile();
  }

  function unlock() {
    removeTurnstile();
    document.body.classList.add('app-unlocked');
  }

  // ── Supabase not configured ────────────────────────────────────
  if (typeof SupabaseDB === 'undefined' || !SupabaseDB.isEnabled()) {
    if (ALLOW_DEMO_BYPASS) { document.body.classList.add('app-unlocked'); return; }
    lock();
    if (statusEl) statusEl.textContent =
      'Supabase is not configured. Set SUPABASE_URL and the anon key in js/supabase-config.js.';
    if (btn) btn.disabled = true;
    return;
  }

  // ── Fail closed ────────────────────────────────────────────────
  lock();
  if (statusEl) statusEl.textContent = 'Checking session…';

  // ── Auth state listener ────────────────────────────────────────
  SupabaseDB.onAuthChange(function (session) {
    if (session) {
      unlock();
      if (statusEl) statusEl.textContent = '';
      if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; }

      var emailLabel = document.getElementById('global-signout-email');
      if (emailLabel && session.user) {
        emailLabel.textContent = session.user.email || '';
      }

      if (form) form.reset();
      if (errEl) errEl.textContent = '';
    } else {
      lock();
      if (statusEl) statusEl.textContent = '';
    }
  });

  // ── Sign-in form submit ────────────────────────────────────────
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var email    = (emailEl ? emailEl.value || '' : '').trim();
      var password = passEl ? passEl.value || '' : '';
      var token    = getTurnstileToken();

      if (errEl) errEl.textContent = '';
      if (!email || !password) {
        if (errEl) errEl.textContent = 'Enter your email and password.';
        return;
      }
      if (!token) {
        if (errEl) errEl.textContent = 'Please complete the CAPTCHA.';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Signing in…';

      var result = await SupabaseDB.signIn(email, password, token);
      if (!result.ok) {
        if (errEl) errEl.textContent = result.error || 'Sign-in failed. Check your credentials.';
        btn.disabled = false;
        btn.textContent = 'Sign In';
        resetTurnstile();
      }
    });
  }

  // ── Global sign-out ────────────────────────────────────────────
  var signoutBtn = document.getElementById('global-signout');
  if (signoutBtn) {
    signoutBtn.addEventListener('click', async function () {
      await SupabaseDB.signOut();
    });
  }

}());

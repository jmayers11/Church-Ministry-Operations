/**
 * supabase-config.js
 * ------------------
 * Supabase integration for Church Operations Dashboard.
 * Exposes a single global: window.SupabaseDB
 *
 * HOW TO CONFIGURE:
 *   Set SUPABASE_URL and SUPABASE_ANON_KEY below to your project values.
 *   Leave them as empty strings to run in localStorage-only demo mode.
 *
 * SECURITY NOTES:
 *   • Only the publishable/anon key goes here — never the service_role key.
 *   • Staff authentication uses Supabase Auth (email + password).
 *   • Internal notes and PII are never returned to the public portal.
 */

// ── Configuration ────────────────────────────────────────────────
const SUPABASE_URL      = 'https://tlomcujkfhgmnaiicyjj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZTJgdbWn_w83KSEMTY86hw_L8y3P-pX';
// ─────────────────────────────────────────────────────────────────

var SupabaseDB = (function () {

  // Internal Supabase client (null when not configured)
  var _client = null;

  // Current auth session (null = not signed in)
  var _session = null;

  // Auth change listeners registered by other modules
  var _authListeners = [];

  // ── Initialization ─────────────────────────────────────────────

  function _init() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.info('[SupabaseDB] Not configured — running in localStorage demo mode.');
      return;
    }

    if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
      console.warn('[SupabaseDB] Supabase JS library not loaded. Check the <script> tag in index.html.');
      return;
    }

    try {
      _client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      // Restore existing session if the user was previously signed in
      _client.auth.getSession().then(function (result) {
        _session = (result.data && result.data.session) ? result.data.session : null;
        _notifyAuthListeners();
      });

      // Keep _session in sync with Supabase auth state changes
      _client.auth.onAuthStateChange(function (event, session) {
        _session = session;
        _notifyAuthListeners();
        // On sign-in, sync all module tables so data is current on every device
        if (event === 'SIGNED_IN' && session) {
          setTimeout(function () { syncAllTables(); }, 300);
        }
      });

      console.info('[SupabaseDB] Initialized. URL:', SUPABASE_URL);
    } catch (err) {
      console.error('[SupabaseDB] Initialization failed:', err);
      _client = null;
    }
  }

  function _notifyAuthListeners() {
    _authListeners.forEach(function (fn) {
      try { fn(_session); } catch (e) { /* ignore */ }
    });
  }

  // ── Column mapping ─────────────────────────────────────────────
  // Converts a Supabase row (snake_case) → JS object (camelCase)
  // matching the shape used throughout the dashboard.

  function _fromRow(row) {
    if (!row) return null;
    return {
      id:            row.id,
      requestId:     row.request_id,
      type:          row.type,
      typeName:      row.type_name,
      status:        row.status,
      urgency:       row.urgency,
      submittedAt:   row.submitted_at,
      lastUpdated:   row.last_updated,
      assignedTo:    row.assigned_to   || '',
      followUpDate:  row.follow_up_date || '',
      internalNotes: row.internal_notes || '',
      data: Object.assign(
        { name: row.name || '', email: row.email || '', phone: row.phone || '' },
        (row.form_data && typeof row.form_data === 'object') ? row.form_data : {}
      )
    };
  }

  // Converts a JS request object → Supabase insert row (snake_case)
  function _toInsertRow(req) {
    var d = req.data || {};
    return {
      request_id:     req.requestId,
      type:           req.type,
      type_name:      req.typeName,
      status:         req.status        || 'Received',
      urgency:        req.urgency       || 'Medium',
      submitted_at:   req.submittedAt   || new Date().toISOString(),
      assigned_to:    '',               // enforced by RLS WITH CHECK
      internal_notes: '',               // enforced by RLS WITH CHECK
      follow_up_date: req.followUpDate  || null,
      name:           d.name            || '',
      email:          d.email           || '',
      phone:          d.phone           || '',
      form_data:      d
    };
  }

  // ── Public API ─────────────────────────────────────────────────

  /**
   * Returns true when Supabase is configured and the JS client loaded.
   * When false, callers should fall back to localStorage.
   */
  function isEnabled() {
    return _client !== null;
  }

  /**
   * Returns true when a staff member is currently signed in.
   */
  function isAuthenticated() {
    return _session !== null;
  }

  /**
   * Returns the current Supabase session object (or null).
   */
  function getSession() {
    return _session;
  }

  /**
   * Register a callback invoked whenever auth state changes.
   * callback(session) — session is null when signed out.
   */
  function onAuthChange(callback) {
    _authListeners.push(callback);
    // Fire immediately with current state
    try { callback(_session); } catch (e) { /* ignore */ }
  }

  /**
   * Sign in a staff member with email + password.
   * Returns { ok: true } or { ok: false, error: '...' }
   */
  async function signIn(email, password, captchaToken) {
    if (!_client) return { ok: false, error: 'Supabase not configured.' };
    try {
      var opts = { email: email, password: password };
      if (captchaToken) opts.options = { captchaToken: captchaToken };
      var result = await _client.auth.signInWithPassword(opts);
      if (result.error) return { ok: false, error: result.error.message };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || 'Sign-in failed.' };
    }
  }

  /**
   * Sign out the current staff session.
   */
  async function signOut() {
    if (!_client) return;
    await _client.auth.signOut();
  }

  /**
   * Send a password-reset email via Supabase Auth.
   * Returns { ok: true } or { ok: false, error: '...' }
   */
  async function resetPasswordForEmail(email) {
    if (!_client) return { ok: false, error: 'Supabase not configured.' };
    try {
      var { error } = await _client.auth.resetPasswordForEmail(email);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || 'Unknown error' };
    }
  }

  /**
   * Insert a new ministry request (called from portal.html).
   * Returns { ok: true, data: row } or { ok: false, error: '...' }
   */
  async function insertRequest(req) {
    if (!_client) return { ok: false, error: 'Supabase not configured.' };
    try {
      var row = _toInsertRow(req);
      var result = await _client.from('ministry_requests').insert(row).select().single();
      if (result.error) return { ok: false, error: result.error.message };
      return { ok: true, data: _fromRow(result.data) };
    } catch (err) {
      return { ok: false, error: err.message || 'Insert failed.' };
    }
  }

  /**
   * Public status lookup — calls the SECURITY DEFINER RPC.
   * Verifies contact server-side; never returns PII or internal notes.
   * Returns { ok: true, data: {...} } or { ok: false, error: '...' }
   */
  async function lookupRequest(requestId, contact) {
    if (!_client) return { ok: false, error: 'Supabase not configured.' };
    try {
      var result = await _client.rpc('lookup_request_status', {
        p_request_id: requestId,
        p_contact:    contact || ''
      });
      if (result.error) return { ok: false, error: result.error.message };
      return { ok: true, data: result.data };
    } catch (err) {
      return { ok: false, error: err.message || 'Lookup failed.' };
    }
  }

  /**
   * Fetch all ministry requests — staff only (requires authentication).
   * Returns { ok: true, data: [...] } or { ok: false, error: '...' }
   */
  async function getRequests() {
    if (!_client)         return { ok: false, error: 'Supabase not configured.' };
    if (!isAuthenticated()) return { ok: false, error: 'Not authenticated.' };
    try {
      var result = await _client
        .from('ministry_requests')
        .select('*')
        .order('submitted_at', { ascending: false });
      if (result.error) return { ok: false, error: result.error.message };
      return { ok: true, data: (result.data || []).map(_fromRow) };
    } catch (err) {
      return { ok: false, error: err.message || 'Fetch failed.' };
    }
  }

  /**
   * Update a ministry request — staff only.
   * fields: { status, urgency, assignedTo, followUpDate, internalNotes }
   * Returns { ok: true } or { ok: false, error: '...' }
   */
  async function updateRequest(requestId, fields) {
    if (!_client)         return { ok: false, error: 'Supabase not configured.' };
    if (!isAuthenticated()) return { ok: false, error: 'Not authenticated.' };
    try {
      var updates = {};
      if (fields.status        !== undefined) updates.status         = fields.status;
      if (fields.urgency       !== undefined) updates.urgency        = fields.urgency;
      if (fields.assignedTo    !== undefined) updates.assigned_to    = fields.assignedTo;
      if (fields.followUpDate  !== undefined) updates.follow_up_date = fields.followUpDate || null;
      if (fields.internalNotes !== undefined) updates.internal_notes = fields.internalNotes;
      // last_updated is handled by the database trigger

      var result = await _client
        .from('ministry_requests')
        .update(updates)
        .eq('request_id', requestId);
      if (result.error) return { ok: false, error: result.error.message };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || 'Update failed.' };
    }
  }

  /**
   * Notify staff of a new ministry request via the Edge Function.
   * Called after a successful insertRequest() from the portal.
   * Fire-and-forget safe — returns {ok, error} but never throws.
   *
   * Passes only the data the portal already holds (no PII leak).
   * Private prayer requests: isPrivate flag triggers redaction in the function.
   */
  async function notifyNewRequest(req) {
    if (!_client) return { ok: false, error: 'Supabase not configured.' };
    var d = req.data || {};
    var payload = {
      requestId:   req.requestId,
      type:        req.type,
      typeName:    req.typeName,
      urgency:     req.urgency    || 'Medium',
      submittedAt: req.submittedAt || new Date().toISOString(),
      isPrivate:   d.isPrivate === true,
      data: {
        name:              d.name            || '',
        phone:             d.phone           || '',
        email:             d.email           || '',
        // Type-specific summary fields (no internal notes — they never reach the portal)
        request:           d.request         || '',   // prayer
        contactMethod:     d.contactMethod   || '',   // prayer / help
        helpType:          d.helpType        || '',   // help
        description:       d.description     || '',   // help
        householdSize:     d.householdSize   || '',   // help / pantry
        dietaryRestrictions: d.dietaryRestrictions || '', // pantry
        pickupDay:         d.pickupDay       || '',   // pantry
        personName:        d.personName      || '',   // pastoral
        location:          d.location        || '',   // pastoral
        visitType:         d.visitType       || '',   // pastoral
        notes:             d.notes           || '',   // pastoral / volunteer
        interests:         d.interests       || [],   // volunteer
        availability:      d.availability    || '',   // volunteer
        skills:            d.skills          || '',   // volunteer
      },
    };

    try {
      var res = await fetch(
        SUPABASE_URL + '/functions/v1/send-request-notification',
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
            'apikey':        SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        var errText = await res.text();
        console.warn('[SupabaseDB] notifyNewRequest: edge function returned', res.status, errText);
        return { ok: false, error: 'Edge function returned ' + res.status };
      }
      var data = await res.json();
      return { ok: true, emailId: data.emailId };
    } catch (err) {
      console.warn('[SupabaseDB] notifyNewRequest: fetch error:', err.message);
      return { ok: false, error: err.message || 'Notification fetch failed.' };
    }
  }

  /**
   * Delete a ministry request — staff only.
   * Returns { ok: true } or { ok: false, error: '...' }
   */
  async function deleteRequest(requestId) {
    if (!_client)         return { ok: false, error: 'Supabase not configured.' };
    if (!isAuthenticated()) return { ok: false, error: 'Not authenticated.' };
    try {
      var result = await _client
        .from('ministry_requests')
        .delete()
        .eq('request_id', requestId);
      if (result.error) return { ok: false, error: result.error.message };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || 'Delete failed.' };
    }
  }

  // ── Generic module table CRUD ──────────────────────────────────
  // Maps localStorage collection names → Supabase table names.
  // All tables use: id TEXT PK, data JSONB, updated_at TIMESTAMPTZ

  var _TABLE_MAP = {
    'members':           'members',
    'care':              'care_records',
    'giving_donations':  'giving_donations',
    'giving_funds':      'giving_funds',
    'visitors':          'visitors',
    'prayer':            'prayer_requests',
    'praise_reports':    'praise_reports',
    'volunteers':        'volunteers',
    'vol_hours':         'volunteer_hours',
    'pantry_inventory':  'pantry_inventory',
    'pantry_box_templates': 'pantry_box_templates',
    'pantry_box_orders':    'pantry_box_orders',
    'pantry_substitutions': 'pantry_substitutions',
    'foodpantry':        'pantry_distributions',
    'family_assistance': 'family_assistance',
    'events':            'events',
    'tasks':             'tasks',
  };

  /**
   * Fetch all records for a module table.
   * Returns { ok: true, data: [...] } or { ok: false, error }
   */
  async function tableGet(localKey) {
    if (!_client || !isAuthenticated()) return { ok: false, error: 'Not authenticated.' };
    var sbTable = _TABLE_MAP[localKey];
    if (!sbTable) return { ok: false, error: 'Unknown table: ' + localKey };
    try {
      var result = await _client.from(sbTable).select('id, data');
      if (result.error) return { ok: false, error: result.error.message };
      return { ok: true, data: (result.data || []).map(function(r) { return Object.assign({}, r.data, { id: r.id }); }) };
    } catch (err) {
      return { ok: false, error: err.message || 'Fetch failed.' };
    }
  }

  /**
   * Upsert (insert or update) a single record in a module table.
   * record must have an `id` field.
   */
  async function tableUpsert(localKey, record) {
    if (!_client || !isAuthenticated()) return { ok: false, error: 'Not authenticated.' };
    var sbTable = _TABLE_MAP[localKey];
    if (!sbTable) return { ok: false, error: 'Unknown table: ' + localKey };
    try {
      var row = { id: record.id, data: record, updated_at: new Date().toISOString() };
      var result = await _client.from(sbTable).upsert(row, { onConflict: 'id' });
      if (result.error) return { ok: false, error: result.error.message };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || 'Upsert failed.' };
    }
  }

  /**
   * Delete a single record by id from a module table.
   */
  async function tableDelete(localKey, id) {
    if (!_client || !isAuthenticated()) return { ok: false, error: 'Not authenticated.' };
    var sbTable = _TABLE_MAP[localKey];
    if (!sbTable) return { ok: false, error: 'Unknown table: ' + localKey };
    try {
      var result = await _client.from(sbTable).delete().eq('id', id);
      if (result.error) return { ok: false, error: result.error.message };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || 'Delete failed.' };
    }
  }

  /**
   * Sync all module tables between Supabase and localStorage.
   * - If Supabase table is empty: pushes localStorage data up.
   * - If Supabase table has data: pulls it down into localStorage.
   * Called automatically on sign-in so all devices stay in sync.
   */
  async function syncAllTables() {
    if (!_client || !isAuthenticated()) return;
    var localKeys = Object.keys(_TABLE_MAP);
    for (var i = 0; i < localKeys.length; i++) {
      var localKey = localKeys[i];
      var sbTable  = _TABLE_MAP[localKey];
      try {
        var result = await _client.from(sbTable).select('id, data');
        if (result.error) {
          console.warn('[SupabaseDB] syncAllTables error on', sbTable, ':', result.error.message);
          continue;
        }
        if (result.data && result.data.length > 0) {
          // Supabase has data — pull down to localStorage
          var records = result.data.map(function(r) { return Object.assign({}, r.data, { id: r.id }); });
          if (typeof Storage !== 'undefined') Storage.saveAll(localKey, records);
          console.info('[SupabaseDB] Pulled', records.length, 'records →', localKey);
        } else {
          // Supabase empty — push up localStorage data
          if (typeof Storage === 'undefined') continue;
          var localData = Storage.getAll(localKey);
          if (localData.length > 0) {
            var rows = localData.map(function(r) {
              return { id: r.id, data: r, updated_at: new Date().toISOString() };
            });
            var uploadResult = await _client.from(sbTable).insert(rows);
            if (uploadResult.error) {
              console.warn('[SupabaseDB] syncAllTables upload error on', sbTable, ':', uploadResult.error.message);
            } else {
              console.info('[SupabaseDB] Pushed', rows.length, 'records →', sbTable);
            }
          }
        }
      } catch (err) {
        console.warn('[SupabaseDB] syncAllTables exception on', sbTable, ':', err.message);
      }
    }
    console.info('[SupabaseDB] syncAllTables complete.');
  }

  /**
   * Send a freeform prompt to the Edge Function and return generated content.
   * Returns { ok: true, draft } or { ok: false, error }.
   */
  async function generateContent(prompt) {
    if (!_client) return { ok: false, error: 'Supabase not configured.' };
    try {
      var res = await fetch(SUPABASE_URL + '/functions/v1/draft-response', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
          'apikey':        SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ type: 'content_generation', prompt: prompt }),
      });
      var data = await res.json();
      if (!res.ok || !data.ok) return { ok: false, error: data.error || ('HTTP ' + res.status) };
      return { ok: true, draft: data.draft };
    } catch (err) {
      return { ok: false, error: err.message || 'Generation failed.' };
    }
  }

  /**
   * Ask the draft-response Edge Function for a reply template.
   * Sends ONLY non-identifying categorical fields — never PII.
   * Returns { ok: true, draft } or { ok: false, error }.
   */
  async function draftResponse(payload) {
    if (!_client) return { ok: false, error: 'Supabase not configured.' };
    try {
      var res = await fetch(SUPABASE_URL + '/functions/v1/draft-response', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
          'apikey':        SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(payload),
      });
      var data = await res.json();
      if (!res.ok || !data.ok) return { ok: false, error: data.error || ('HTTP ' + res.status) };
      return { ok: true, draft: data.draft };
    } catch (err) {
      return { ok: false, error: err.message || 'Draft request failed.' };
    }
  }

  // ── Boot ───────────────────────────────────────────────────────
  _init();

  // ── Exports ────────────────────────────────────────────────────
  return {
    isEnabled:        isEnabled,
    isAuthenticated:  isAuthenticated,
    getSession:       getSession,
    onAuthChange:          onAuthChange,
    signIn:                signIn,
    signOut:               signOut,
    resetPasswordForEmail: resetPasswordForEmail,
    insertRequest:         insertRequest,
    lookupRequest:         lookupRequest,
    getRequests:           getRequests,
    updateRequest:         updateRequest,
    deleteRequest:         deleteRequest,
    notifyNewRequest:      notifyNewRequest,
    tableGet:              tableGet,
    tableUpsert:           tableUpsert,
    tableDelete:           tableDelete,
    syncAllTables:         syncAllTables,
    draftResponse:         draftResponse,
    generateContent:       generateContent,
  };
})();

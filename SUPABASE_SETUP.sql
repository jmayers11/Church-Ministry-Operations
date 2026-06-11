-- ================================================================
-- Church Operations Dashboard — Supabase Setup Script
-- ----------------------------------------------------------------
-- HOW TO USE:
--   1. Open your Supabase project → SQL Editor → New Query
--   2. Paste this entire file and click "Run"
--   3. All tables, RLS policies, and functions will be created.
--
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE.
-- ================================================================


-- ── 1. TABLES ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ministry_requests (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      TEXT        NOT NULL UNIQUE,        -- e.g. REQ-4821-KT
  type            TEXT        NOT NULL,               -- prayer|help|pantry|pastoral|volunteer
  type_name       TEXT        NOT NULL,               -- human-readable label
  status          TEXT        NOT NULL DEFAULT 'Received',
  urgency         TEXT        NOT NULL DEFAULT 'Medium',
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_to     TEXT        NOT NULL DEFAULT '',
  follow_up_date  DATE,
  internal_notes  TEXT        NOT NULL DEFAULT '',    -- STAFF ONLY — never exposed publicly
  -- Flattened contact fields (for staff search / server-side contact verification)
  name            TEXT        NOT NULL DEFAULT '',
  email           TEXT        NOT NULL DEFAULT '',
  phone           TEXT        NOT NULL DEFAULT '',
  -- Full type-specific form payload
  form_data       JSONB       NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS request_updates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  TEXT        NOT NULL REFERENCES ministry_requests(request_id) ON DELETE CASCADE,
  updated_by  TEXT,
  old_status  TEXT,
  new_status  TEXT,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── 2. INDEXES ───────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ministry_requests_submitted_at
  ON ministry_requests (submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_ministry_requests_status
  ON ministry_requests (status);

CREATE INDEX IF NOT EXISTS idx_request_updates_request_id
  ON request_updates (request_id);


-- ── 3. ROW LEVEL SECURITY ────────────────────────────────────────

ALTER TABLE ministry_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_updates   ENABLE ROW LEVEL SECURITY;

-- Drop existing policies so this script is idempotent
DROP POLICY IF EXISTS "anon_insert_requests"   ON ministry_requests;
DROP POLICY IF EXISTS "staff_all_requests"     ON ministry_requests;
DROP POLICY IF EXISTS "staff_all_updates"      ON request_updates;

-- ── Policy 1: Public portal can INSERT new requests ──────────────
-- Conditions:
--   • internal_notes must be empty  (portal must never pre-fill staff notes)
--   • assigned_to must be empty     (portal must never pre-assign)
CREATE POLICY "anon_insert_requests"
  ON ministry_requests
  FOR INSERT
  TO anon
  WITH CHECK (
    internal_notes = ''
    AND assigned_to = ''
  );

-- ── Policy 2: Authenticated staff have full access ───────────────
-- Staff sign in via Supabase Auth (email/password).
-- Once authenticated they can SELECT (including internal_notes),
-- UPDATE, and DELETE any request.
CREATE POLICY "staff_all_requests"
  ON ministry_requests
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── Policy 3: Staff can manage the updates audit log ─────────────
CREATE POLICY "staff_all_updates"
  ON request_updates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- NOTE: There is intentionally NO SELECT policy for the anon role on
-- ministry_requests. Public status lookup is handled exclusively by
-- the security-definer function below, which verifies the requester's
-- contact info server-side and returns only safe fields.


-- ── 4. PUBLIC STATUS LOOKUP — SECURITY DEFINER RPC ───────────────
--
-- Called by portal.html as: supabase.rpc('lookup_request_status', {...})
-- Runs with the OWNER's privileges (bypasses RLS) so it can read
-- email/phone for contact verification without exposing those fields
-- to the caller. Only a safe subset of columns is returned.
--
-- Parameters:
--   p_request_id  TEXT  — the REQ-XXXX-YY id the requester provides
--   p_contact     TEXT  — email or phone the requester provides (optional)
--
-- Returns JSON:
--   { found: false }
--   { found: true, verified: false }           — contact didn't match
--   { found: true, verified: true, ...fields } — safe public fields

CREATE OR REPLACE FUNCTION lookup_request_status(
  p_request_id  TEXT,
  p_contact     TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec           ministry_requests%ROWTYPE;
  v_contact_ok    BOOLEAN := true;
  v_phone_digits  TEXT;
  v_input_digits  TEXT;
BEGIN
  -- Find the request (case-insensitive, trimmed)
  SELECT * INTO v_rec
  FROM ministry_requests
  WHERE request_id = upper(trim(p_request_id));

  IF NOT FOUND THEN
    RETURN json_build_object('found', false);
  END IF;

  -- Verify contact if the caller provided one
  IF p_contact IS NOT NULL AND trim(p_contact) <> '' THEN
    v_phone_digits := regexp_replace(v_rec.phone,   '[^0-9]', '', 'g');
    v_input_digits := regexp_replace(p_contact, '[^0-9]', '', 'g');

    v_contact_ok := (
      lower(v_rec.email) = lower(trim(p_contact))
      OR (length(v_phone_digits) >= 7 AND v_phone_digits = v_input_digits)
    );
  END IF;

  IF NOT v_contact_ok THEN
    RETURN json_build_object('found', true, 'verified', false);
  END IF;

  -- Return ONLY safe public fields.
  -- internal_notes, form_data, email, phone, name are intentionally excluded.
  RETURN json_build_object(
    'found',       true,
    'verified',    true,
    'requestId',   v_rec.request_id,
    'status',      v_rec.status,
    'typeName',    v_rec.type_name,
    'submittedAt', v_rec.submitted_at,
    'urgency',     v_rec.urgency
  );
END;
$$;

-- Grant execute to both anon (portal) and authenticated (staff testing)
GRANT EXECUTE ON FUNCTION lookup_request_status TO anon;
GRANT EXECUTE ON FUNCTION lookup_request_status TO authenticated;


-- ── 5. AUTO-UPDATE last_updated TRIGGER ─────────────────────────

CREATE OR REPLACE FUNCTION set_last_updated()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ministry_requests_updated ON ministry_requests;
CREATE TRIGGER trg_ministry_requests_updated
  BEFORE UPDATE ON ministry_requests
  FOR EACH ROW EXECUTE FUNCTION set_last_updated();


-- ── 6. STAFF USER NOTE ───────────────────────────────────────────
-- Staff accounts are managed through Supabase Auth (Authentication tab).
-- To create a staff account:
--   Supabase Dashboard → Authentication → Users → Invite user
-- Staff sign in through the Request Inbox using their email + password.
-- No additional staff_users table is needed; Supabase Auth handles it.


-- ── DONE ─────────────────────────────────────────────────────────
-- Tables:    ministry_requests, request_updates
-- Policies:  anon INSERT (portal) · authenticated ALL (staff)
-- Function:  lookup_request_status (public, security definer)
-- Trigger:   auto-updates last_updated on row changes
-- ================================================================

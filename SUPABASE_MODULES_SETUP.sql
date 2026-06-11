-- =============================================================
-- SUPABASE_MODULES_SETUP.sql
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query)
-- after running SUPABASE_SETUP.sql.
--
-- Creates 14 tables for all dashboard modules.
-- Pattern: each table stores the full JS object as JSONB so no
-- column mapping is needed.  All tables require authentication.
-- =============================================================

-- ── Members ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_all" ON members;
CREATE POLICY "staff_all" ON members FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Care Records ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS care_records (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE care_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_all" ON care_records;
CREATE POLICY "staff_all" ON care_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Giving: Donations ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS giving_donations (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE giving_donations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_all" ON giving_donations;
CREATE POLICY "staff_all" ON giving_donations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Giving: Funds ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS giving_funds (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE giving_funds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_all" ON giving_funds;
CREATE POLICY "staff_all" ON giving_funds FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Visitors ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visitors (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_all" ON visitors;
CREATE POLICY "staff_all" ON visitors FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Prayer Requests ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prayer_requests (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_all" ON prayer_requests;
CREATE POLICY "staff_all" ON prayer_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Praise Reports ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS praise_reports (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE praise_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_all" ON praise_reports;
CREATE POLICY "staff_all" ON praise_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Volunteers ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS volunteers (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_all" ON volunteers;
CREATE POLICY "staff_all" ON volunteers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Volunteer Hours ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS volunteer_hours (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE volunteer_hours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_all" ON volunteer_hours;
CREATE POLICY "staff_all" ON volunteer_hours FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Pantry: Inventory ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pantry_inventory (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pantry_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_all" ON pantry_inventory;
CREATE POLICY "staff_all" ON pantry_inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Pantry: Distributions (foodpantry) ─────────────────────────
CREATE TABLE IF NOT EXISTS pantry_distributions (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pantry_distributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_all" ON pantry_distributions;
CREATE POLICY "staff_all" ON pantry_distributions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Family Assistance ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS family_assistance (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE family_assistance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_all" ON family_assistance;
CREATE POLICY "staff_all" ON family_assistance FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Events ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_all" ON events;
CREATE POLICY "staff_all" ON events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Tasks ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_all" ON tasks;
CREATE POLICY "staff_all" ON tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

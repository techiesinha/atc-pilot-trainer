-- =============================================================================
-- ATC Pilot Trainer — Database Schema v2
-- =============================================================================
-- Architecture: three-table design separating identity from profile from events
--
-- Tables:
--   identities   — authentication layer (email, OAuth). Email lives here only.
--   users        — pilot profile (name, country, level, sessions)
--   events       — behavioural log (scenario attempts, activity)
--
-- Dev mirrors:
--   identities_dev, users_dev, events_dev — isolated from production data
--
-- FIXES applied:
--   1. All INSERT statements explicitly pass UUID via gen_random_uuid()
--      instead of relying on column defaults (stripped by EXCLUDING CONSTRAINTS)
--   2. All WHERE clauses qualify columns with table name to avoid ambiguity
--      with PL/pgSQL RETURNS TABLE output variables (identity_id clash)
--
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================


-- =============================================================================
-- DROP EXISTING — safe to re-run. Comment out if you have real production data.
-- =============================================================================
DROP FUNCTION IF EXISTS get_or_create_user_dev CASCADE;
DROP FUNCTION IF EXISTS get_or_create_user     CASCADE;
DROP FUNCTION IF EXISTS increment_sessions_dev CASCADE;
DROP FUNCTION IF EXISTS increment_sessions     CASCADE;
DROP TABLE IF EXISTS events_dev     CASCADE;
DROP TABLE IF EXISTS users_dev      CASCADE;
DROP TABLE IF EXISTS identities_dev CASCADE;
DROP TABLE IF EXISTS events         CASCADE;
DROP TABLE IF EXISTS users          CASCADE;
DROP TABLE IF EXISTS identities     CASCADE;


-- =============================================================================
-- TABLE: identities
-- =============================================================================
CREATE TABLE identities (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT        UNIQUE NOT NULL,
  email_verified  BOOLEAN     NOT NULL DEFAULT false,
  provider        TEXT        NOT NULL DEFAULT 'email'
                              CHECK (provider IN ('email', 'google', 'github', 'apple')),
  provider_id     TEXT        NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_id)
);

COMMENT ON TABLE  identities                IS 'Authentication identities. Email lives here only.';
COMMENT ON COLUMN identities.id             IS 'Primary key. Safe to share — contains no PII.';
COMMENT ON COLUMN identities.email          IS 'Unique email. Never exposed in API responses or JSON.';
COMMENT ON COLUMN identities.email_verified IS 'True once verified via OAuth or email confirmation.';
COMMENT ON COLUMN identities.provider       IS 'Login method: email | google | github | apple';
COMMENT ON COLUMN identities.provider_id    IS 'OAuth subject ID. Null for direct email signups.';


-- =============================================================================
-- TABLE: users
-- =============================================================================
CREATE TABLE users (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id     UUID        NOT NULL UNIQUE REFERENCES identities(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  country         TEXT        NOT NULL DEFAULT 'India',
  pilot_level     TEXT        NOT NULL DEFAULT 'Student pilot',
  registered_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen       TIMESTAMPTZ NOT NULL DEFAULT now(),
  sessions        INTEGER     NOT NULL DEFAULT 1 CHECK (sessions >= 1)
);

COMMENT ON TABLE  users               IS 'Pilot profiles. No PII — safe for API responses.';
COMMENT ON COLUMN users.id            IS 'Profile primary key. Used in events and localStorage.';
COMMENT ON COLUMN users.identity_id   IS 'FK to identities. One profile per identity enforced by UNIQUE.';
COMMENT ON COLUMN users.country       IS 'Country name in plain text e.g. India, United Kingdom.';
COMMENT ON COLUMN users.pilot_level   IS 'Self-reported training level selected at registration.';
COMMENT ON COLUMN users.sessions      IS 'Incremented on every app open. Minimum 1.';


-- =============================================================================
-- TABLE: events
-- =============================================================================
CREATE TABLE events (
  id          BIGSERIAL   PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event       TEXT        NOT NULL,
  data        JSONB       NULL,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idxEventsUserId    ON events (user_id);
CREATE INDEX idxEventsEvent     ON events (event);
CREATE INDEX idxEventsTimestamp ON events (timestamp DESC);

COMMENT ON TABLE  events          IS 'Behavioural event log. No PII. References users.id only.';
COMMENT ON COLUMN events.user_id  IS 'FK to users.id. Deleted if the user resets their profile.';
COMMENT ON COLUMN events.event    IS 'Event name: scenario_attempted | metar_fetched | phonetic_drill';
COMMENT ON COLUMN events.data     IS 'Flexible JSONB payload. Schema varies by event name.';


-- =============================================================================
-- FUNCTION: increment_sessions
-- =============================================================================
CREATE OR REPLACE FUNCTION increment_sessions(p_user_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE users
  SET sessions  = sessions + 1,
      last_seen = now()
  WHERE users.id = p_user_id;
$$;

COMMENT ON FUNCTION increment_sessions IS
  'Atomically increments sessions and updates last_seen. Call on every app open.';


-- =============================================================================
-- FUNCTION: get_or_create_user (production)
-- =============================================================================
CREATE OR REPLACE FUNCTION get_or_create_user(
  p_email       TEXT,
  p_name        TEXT,
  p_country     TEXT,
  p_pilot_level TEXT,
  p_provider    TEXT DEFAULT 'email',
  p_provider_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  user_id     UUID,
  identity_id UUID,
  is_new_user BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_identity_id UUID;
  v_user_id     UUID;
  v_is_new      BOOLEAN := false;
BEGIN
  SELECT identities.id INTO v_identity_id
  FROM identities
  WHERE identities.email = lower(trim(p_email));

  IF v_identity_id IS NULL THEN
    v_identity_id := gen_random_uuid();

    INSERT INTO identities (id, email, provider, provider_id, email_verified)
    VALUES (
      v_identity_id,
      lower(trim(p_email)),
      p_provider,
      p_provider_id,
      CASE WHEN p_provider != 'email' THEN true ELSE false END
    );

    v_user_id := gen_random_uuid();

    INSERT INTO users (id, identity_id, name, country, pilot_level)
    VALUES (v_user_id, v_identity_id, p_name, p_country, p_pilot_level);

    v_is_new := true;

  ELSE
    SELECT users.id INTO v_user_id
    FROM users
    WHERE users.identity_id = v_identity_id;

    PERFORM increment_sessions(v_user_id);

    IF p_provider != 'email' THEN
      UPDATE identities
      SET provider    = p_provider,
          provider_id = COALESCE(p_provider_id, provider_id),
          updated_at  = now()
      WHERE identities.id = v_identity_id;
    END IF;
  END IF;

  RETURN QUERY SELECT v_user_id, v_identity_id, v_is_new;
END;
$$;

COMMENT ON FUNCTION get_or_create_user IS
  'Idempotent registration and login. Returns user_id and whether this is a new signup.';


-- =============================================================================
-- ROW LEVEL SECURITY — production tables
-- =============================================================================
ALTER TABLE identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE events     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_identity"
  ON identities FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_insert_user"
  ON users FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_user"
  ON users FOR UPDATE TO anon USING (true);

CREATE POLICY "anon_insert_event"
  ON events FOR INSERT TO anon WITH CHECK (true);


-- =============================================================================
-- DEV MIRROR TABLES
-- =============================================================================
CREATE TABLE identities_dev (LIKE identities EXCLUDING CONSTRAINTS);
CREATE TABLE users_dev      (LIKE users      EXCLUDING CONSTRAINTS);
CREATE TABLE events_dev     (LIKE events     EXCLUDING CONSTRAINTS);

-- Restore primary keys
ALTER TABLE identities_dev ADD PRIMARY KEY (id);
ALTER TABLE users_dev      ADD PRIMARY KEY (id);

-- Restore UUID defaults
ALTER TABLE identities_dev ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE users_dev      ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Restore UNIQUE constraint on email
ALTER TABLE identities_dev
  ADD CONSTRAINT identities_dev_email_unique UNIQUE (email);

-- Restore provider CHECK constraint
ALTER TABLE identities_dev
  ADD CONSTRAINT identities_dev_provider_check
  CHECK (provider IN ('email', 'google', 'github', 'apple'));

-- Restore column defaults on identities_dev
ALTER TABLE identities_dev ALTER COLUMN email_verified SET DEFAULT false;
ALTER TABLE identities_dev ALTER COLUMN provider       SET DEFAULT 'email';
ALTER TABLE identities_dev ALTER COLUMN created_at     SET DEFAULT now();
ALTER TABLE identities_dev ALTER COLUMN updated_at     SET DEFAULT now();

-- Restore column defaults on users_dev
ALTER TABLE users_dev ALTER COLUMN country       SET DEFAULT 'India';
ALTER TABLE users_dev ALTER COLUMN pilot_level   SET DEFAULT 'Student pilot';
ALTER TABLE users_dev ALTER COLUMN registered_at SET DEFAULT now();
ALTER TABLE users_dev ALTER COLUMN last_seen     SET DEFAULT now();
ALTER TABLE users_dev ALTER COLUMN sessions      SET DEFAULT 1;

-- Restore FK: users_dev.identity_id → identities_dev.id
ALTER TABLE users_dev
  ADD CONSTRAINT users_dev_identity_id_fkey
  FOREIGN KEY (identity_id) REFERENCES identities_dev(id) ON DELETE CASCADE;

ALTER TABLE users_dev
  ADD CONSTRAINT users_dev_identity_id_unique UNIQUE (identity_id);

-- Restore FK: events_dev.user_id → users_dev.id
ALTER TABLE events_dev
  ADD CONSTRAINT events_dev_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users_dev(id) ON DELETE CASCADE;

-- Indexes on dev tables
CREATE INDEX idxEventsDevUserId    ON events_dev (user_id);
CREATE INDEX idxEventsDevEvent     ON events_dev (event);
CREATE INDEX idxEventsDevTimestamp ON events_dev (timestamp DESC);

-- RLS on dev tables
ALTER TABLE identities_dev ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_dev      ENABLE ROW LEVEL SECURITY;
ALTER TABLE events_dev     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_identity_dev"
  ON identities_dev FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_insert_user_dev"
  ON users_dev FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_user_dev"
  ON users_dev FOR UPDATE TO anon USING (true);

CREATE POLICY "anon_insert_event_dev"
  ON events_dev FOR INSERT TO anon WITH CHECK (true);


-- =============================================================================
-- FUNCTION: increment_sessions_dev
-- =============================================================================
CREATE OR REPLACE FUNCTION increment_sessions_dev(p_user_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE users_dev
  SET sessions  = sessions + 1,
      last_seen = now()
  WHERE users_dev.id = p_user_id;
$$;


-- =============================================================================
-- FUNCTION: get_or_create_user_dev
-- =============================================================================
CREATE OR REPLACE FUNCTION get_or_create_user_dev(
  p_email       TEXT,
  p_name        TEXT,
  p_country     TEXT,
  p_pilot_level TEXT,
  p_provider    TEXT DEFAULT 'email',
  p_provider_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  user_id     UUID,
  identity_id UUID,
  is_new_user BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_identity_id UUID;
  v_user_id     UUID;
  v_is_new      BOOLEAN := false;
BEGIN
  SELECT identities_dev.id INTO v_identity_id
  FROM identities_dev
  WHERE identities_dev.email = lower(trim(p_email));

  IF v_identity_id IS NULL THEN
    v_identity_id := gen_random_uuid();

    INSERT INTO identities_dev (id, email, provider, provider_id, email_verified)
    VALUES (
      v_identity_id,
      lower(trim(p_email)),
      p_provider,
      p_provider_id,
      CASE WHEN p_provider != 'email' THEN true ELSE false END
    );

    v_user_id := gen_random_uuid();

    INSERT INTO users_dev (id, identity_id, name, country, pilot_level)
    VALUES (v_user_id, v_identity_id, p_name, p_country, p_pilot_level);

    v_is_new := true;

  ELSE
    SELECT users_dev.id INTO v_user_id
    FROM users_dev
    WHERE users_dev.identity_id = v_identity_id;

    PERFORM increment_sessions_dev(v_user_id);

    IF p_provider != 'email' THEN
      UPDATE identities_dev
      SET provider    = p_provider,
          provider_id = COALESCE(p_provider_id, provider_id),
          updated_at  = now()
      WHERE identities_dev.id = v_identity_id;
    END IF;
  END IF;

  RETURN QUERY SELECT v_user_id, v_identity_id, v_is_new;
END;
$$;

COMMENT ON FUNCTION get_or_create_user_dev IS
  'Dev mirror of get_or_create_user. Writes to identities_dev and users_dev.';


-- =============================================================================
-- VERIFY — uncomment and run this after schema to confirm function works
-- =============================================================================
-- SELECT * FROM get_or_create_user_dev(
--   'test@example.com',
--   'Test User',
--   'India',
--   'Student pilot (PPL training)',
--   'google',
--   'test-verify-001'
-- );
-- Expected: one row — user_id UUID, identity_id UUID, is_new_user = true


-- =============================================================================
-- DEVELOPER QUERIES — paste into SQL Editor whenever needed
-- =============================================================================

-- Total users
-- SELECT COUNT(*) FROM users;

-- Users by country
-- SELECT country, COUNT(*) FROM users GROUP BY country ORDER BY count DESC;

-- Users by pilot level
-- SELECT pilot_level, COUNT(*) FROM users GROUP BY pilot_level ORDER BY count DESC;

-- New registrations this week
-- SELECT u.name, u.country, u.pilot_level, u.registered_at
-- FROM users u
-- WHERE u.registered_at > now() - interval '7 days'
-- ORDER BY u.registered_at DESC;

-- Active users (seen in last 7 days)
-- SELECT COUNT(*) FROM users WHERE last_seen > now() - interval '7 days';

-- Most practised scenarios
-- SELECT data->>'scenario_id'                                AS scenario,
--        COUNT(*)                                            AS attempts,
--        COUNT(*) FILTER (WHERE (data->>'passed')::boolean) AS passed,
--        ROUND(AVG((data->>'score')::numeric), 1)           AS avg_score
-- FROM events
-- WHERE event = 'scenario_attempted'
-- GROUP BY scenario
-- ORDER BY attempts DESC;

-- All events for one user (replace the UUID)
-- SELECT event, data, timestamp
-- FROM events
-- WHERE user_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
-- ORDER BY timestamp DESC;

-- Login method breakdown
-- SELECT provider, COUNT(*) FROM identities GROUP BY provider;
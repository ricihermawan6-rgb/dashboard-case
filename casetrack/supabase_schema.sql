-- ============================================================
-- CASETRACK SUPABASE SCHEMA
-- Jalankan ini di Supabase → SQL Editor → Run
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: profiles (user data, linked to auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  username    TEXT UNIQUE NOT NULL,
  role        TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('superadmin','admin','viewer')),
  dept        TEXT,
  email       TEXT,
  active      BOOLEAN DEFAULT true,
  photo_url   TEXT,
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: cases
-- ============================================================
CREATE TABLE IF NOT EXISTS cases (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  emp_id      TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'Karyawan',
  dept        TEXT,
  casetype    TEXT,
  severity    TEXT DEFAULT 'Sedang',
  status      TEXT DEFAULT 'Aktif',
  sp          TEXT,
  date        TEXT,
  last_update TEXT,
  pic         TEXT,
  description TEXT,
  updates     JSONB DEFAULT '[]',
  docs        JSONB DEFAULT '[]',
  photos      JSONB DEFAULT '[]',
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: sp_list (Surat Peringatan)
-- ============================================================
CREATE TABLE IF NOT EXISTS sp_list (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  emp_id      TEXT NOT NULL,
  dept        TEXT,
  level       TEXT NOT NULL CHECK (level IN ('SP-1','SP-2','SP-3')),
  reason      TEXT,
  issued      TEXT,
  valid_until TEXT,
  status      TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif','Selesai','Dibatalkan')),
  case_id     TEXT REFERENCES cases(id) ON DELETE SET NULL,
  notes       TEXT,
  docs        JSONB DEFAULT '[]',
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: bak_list (Berita Acara Klarifikasi)
-- ============================================================
CREATE TABLE IF NOT EXISTS bak_list (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  emp_id          TEXT NOT NULL,
  dept            TEXT,
  case_id         TEXT,
  date            TEXT,
  perihal         TEXT,
  content         TEXT,
  assoc_name      TEXT,
  assoc_date      TEXT,
  assoc_notes     TEXT,
  assoc_status    TEXT DEFAULT 'Belum Review',
  head_name       TEXT,
  head_date       TEXT,
  head_notes      TEXT,
  head_status     TEXT DEFAULT 'Belum Review',
  overall_status  TEXT DEFAULT 'Menunggu IR Associate',
  docs            JSONB DEFAULT '[]',
  assoc_docs      JSONB DEFAULT '[]',
  head_docs       JSONB DEFAULT '[]',
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: phk_list (Laporan PHK Disnaker)
-- ============================================================
CREATE TABLE IF NOT EXISTS phk_list (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  emp_id        TEXT NOT NULL,
  dept          TEXT,
  jabatan       TEXT,
  alasan        TEXT,
  case_id       TEXT,
  tgl           TEXT,
  tgl_lapor     TEXT,
  no_disnaker   TEXT,
  status        TEXT DEFAULT 'Dalam Proses',
  notes         TEXT,
  docs          JSONB DEFAULT '[]',
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: activity_log
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id),
  user_name   TEXT,
  action_type TEXT,
  detail      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: custom_doc_types
-- ============================================================
CREATE TABLE IF NOT EXISTS custom_doc_types (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  icon        TEXT DEFAULT '📄',
  description TEXT,
  fields      JSONB DEFAULT '[]',
  color       TEXT DEFAULT 'badge-blue',
  active      BOOLEAN DEFAULT true,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: custom_entries
-- ============================================================
CREATE TABLE IF NOT EXISTS custom_entries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_type_id UUID REFERENCES custom_doc_types(id) ON DELETE CASCADE,
  data        JSONB DEFAULT '{}',
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_list         ENABLE ROW LEVEL SECURITY;
ALTER TABLE bak_list        ENABLE ROW LEVEL SECURITY;
ALTER TABLE phk_list        ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_doc_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_entries  ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all data
CREATE POLICY "auth_read_profiles"     ON profiles        FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_read_cases"        ON cases           FOR ALL    USING (auth.role() = 'authenticated');
CREATE POLICY "auth_read_sp"           ON sp_list         FOR ALL    USING (auth.role() = 'authenticated');
CREATE POLICY "auth_read_bak"          ON bak_list        FOR ALL    USING (auth.role() = 'authenticated');
CREATE POLICY "auth_read_phk"          ON phk_list        FOR ALL    USING (auth.role() = 'authenticated');
CREATE POLICY "auth_read_log"          ON activity_log    FOR ALL    USING (auth.role() = 'authenticated');
CREATE POLICY "auth_read_doctypes"     ON custom_doc_types FOR ALL   USING (auth.role() = 'authenticated');
CREATE POLICY "auth_read_entries"      ON custom_entries  FOR ALL    USING (auth.role() = 'authenticated');

-- Profile update own
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- FUNCTION: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cases_updated     BEFORE UPDATE ON cases           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sp_updated        BEFORE UPDATE ON sp_list         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bak_updated       BEFORE UPDATE ON bak_list        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_phk_updated       BEFORE UPDATE ON phk_list        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_entries_updated   BEFORE UPDATE ON custom_entries  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED: Default admin user profile
-- NOTE: First create user via Supabase Auth → Users → Add User
-- then run INSERT below with the user's UUID
-- ============================================================
-- INSERT INTO profiles (id, name, username, role, dept, email)
-- VALUES ('YOUR-USER-UUID-HERE', 'Admin Utama', 'admin', 'superadmin', 'Manajemen', 'admin@casetrack.id');

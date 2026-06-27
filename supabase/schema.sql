-- ================================================
-- Healix Campus Insights Platform (HCIP)
-- PostgreSQL Schema for Supabase
-- Run this in your Supabase SQL Editor
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- TABLE: colleges
-- ================================================
CREATE TABLE IF NOT EXISTS colleges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  city TEXT,
  type TEXT, -- Engineering, Medical, Arts, etc.
  established_year INTEGER,
  total_students INTEGER,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- TABLE: users (extends Supabase auth.users)
-- ================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'campus_ambassador' CHECK (role IN ('super_admin', 'campus_ambassador')),
  college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
  state TEXT,
  country TEXT DEFAULT 'India',
  department TEXT,
  phone TEXT,
  profile_image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- TABLE: survey_responses
-- ================================================
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  college_id UUID REFERENCES colleges(id) ON DELETE CASCADE NOT NULL,
  ambassador_id UUID REFERENCES users(id) ON DELETE SET NULL,
  -- Section 1: Student Details
  student_department TEXT NOT NULL,
  student_year TEXT NOT NULL,
  student_gender TEXT NOT NULL,
  student_age INTEGER,
  student_email TEXT,
  -- Section 2: Research Awareness
  has_done_research BOOLEAN NOT NULL DEFAULT FALSE,
  knows_publication BOOLEAN NOT NULL DEFAULT FALSE,
  awareness_rating INTEGER NOT NULL CHECK (awareness_rating BETWEEN 1 AND 5),
  -- Section 5: Career Goal (single)
  career_goal TEXT,
  -- Section 7: Recommendation
  recommendation_text TEXT,
  -- Calculated
  research_readiness_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- TABLE: research_interests (Section 3)
-- ================================================
CREATE TABLE IF NOT EXISTS research_interests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  response_id UUID REFERENCES survey_responses(id) ON DELETE CASCADE NOT NULL,
  interest TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- TABLE: challenges (Section 4)
-- ================================================
CREATE TABLE IF NOT EXISTS challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  response_id UUID REFERENCES survey_responses(id) ON DELETE CASCADE NOT NULL,
  challenge TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- TABLE: workshop_requests (Section 6)
-- ================================================
CREATE TABLE IF NOT EXISTS workshop_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  response_id UUID REFERENCES survey_responses(id) ON DELETE CASCADE NOT NULL,
  program TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- TABLE: reports
-- ================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  ambassador_id UUID REFERENCES users(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL DEFAULT 'college' CHECK (report_type IN ('college', 'state', 'national')),
  title TEXT NOT NULL,
  total_responses INTEGER DEFAULT 0,
  readiness_score INTEGER DEFAULT 0,
  file_url TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- TABLE: notifications
-- ================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'general' CHECK (type IN ('survey', 'workshop', 'report', 'deadline', 'general')),
  target_role TEXT DEFAULT 'campus_ambassador',
  target_college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- TABLE: activity_logs
-- ================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- TABLE: admin_logs
-- ================================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- TABLE: partnership_orgs
-- ================================================
CREATE TABLE IF NOT EXISTS partnership_orgs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('University', 'Hospital', 'NGO', 'Company', 'Research Institute')),
  state TEXT,
  country TEXT DEFAULT 'India',
  contact_name TEXT,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'Meeting' CHECK (status IN ('Meeting', 'Proposal', 'MoU', 'Partnership', 'Completed')),
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE partnership_orgs ENABLE ROW LEVEL SECURITY;

-- Colleges: Everyone can read, only admins can write
CREATE POLICY "colleges_read_all" ON colleges FOR SELECT USING (TRUE);
CREATE POLICY "colleges_admin_write" ON colleges FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

-- Users: Can read own profile; admins read all
CREATE POLICY "users_read_own" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_admin_read_all" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "users_admin_write" ON users FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

-- Survey responses: Ambassador sees only their college
CREATE POLICY "responses_ambassador_own_college" ON survey_responses FOR SELECT USING (
  college_id = (SELECT college_id FROM users WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "responses_ambassador_insert" ON survey_responses FOR INSERT WITH CHECK (
  ambassador_id = auth.uid()
);
CREATE POLICY "responses_ambassador_update_own" ON survey_responses FOR UPDATE USING (
  ambassador_id = auth.uid()
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

-- Notifications: User sees their own + role-level
CREATE POLICY "notifications_read" ON notifications FOR SELECT USING (
  target_college_id = (SELECT college_id FROM users WHERE id = auth.uid())
  OR target_role = (SELECT role FROM users WHERE id = auth.uid())
  OR target_college_id IS NULL
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

-- ================================================
-- INDEXES for performance
-- ================================================
CREATE INDEX IF NOT EXISTS idx_survey_responses_college ON survey_responses(college_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_ambassador ON survey_responses(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_created ON survey_responses(created_at);
CREATE INDEX IF NOT EXISTS idx_research_interests_response ON research_interests(response_id);
CREATE INDEX IF NOT EXISTS idx_challenges_response ON challenges(response_id);
CREATE INDEX IF NOT EXISTS idx_workshop_requests_response ON workshop_requests(response_id);
CREATE INDEX IF NOT EXISTS idx_notifications_college ON notifications(target_college_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);

-- ================================================
-- TRIGGERS: Auto-update updated_at
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_colleges_updated_at BEFORE UPDATE ON colleges FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_responses_updated_at BEFORE UPDATE ON survey_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_partnerships_updated_at BEFORE UPDATE ON partnership_orgs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

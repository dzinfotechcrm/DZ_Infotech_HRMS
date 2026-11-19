-- =======================================================
-- DZ Infotech HRMS: Internship Program Module
-- Table: internship_program
-- Run this script in your Supabase SQL Editor
-- =======================================================

CREATE TABLE IF NOT EXISTS internship_program (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  full_name TEXT NOT NULL,
  guardian_name TEXT,                  -- Son / Daughter of (Parent/Guardian)
  college_name TEXT,                   -- College / University
  degree_branch TEXT,                  -- Degree / Branch & Year
  permanent_address TEXT,              -- Permanent Residential Address
  email TEXT NOT NULL,
  phone TEXT,                          -- Phone / WhatsApp
  position_domain TEXT NOT NULL,       -- Internship Position / Domain
  department TEXT DEFAULT 'Software Engineering',
  duration TEXT DEFAULT '3 Months',    -- e.g., '3 Months', '6 Months'
  start_date DATE,
  end_date DATE,
  work_mode TEXT DEFAULT 'Remote / Work From Home',
  mentor_name TEXT,                    -- Reporting Mentor / Supervisor
  working_days_hours TEXT DEFAULT 'Monday to Friday, 10:00 AM - 6:00 PM',
  stipend TEXT DEFAULT 'Performance-based / Unpaid Industrial Internship',
  offer_date DATE DEFAULT CURRENT_DATE,
  acceptance_deadline DATE,
  nda_effective_date DATE DEFAULT CURRENT_DATE,
  signatory_name TEXT DEFAULT 'Authorized Signatory',
  signatory_designation TEXT DEFAULT 'Founder & Director',
  signatory_place TEXT DEFAULT 'Bhavnagar, Gujarat, India',
  status TEXT DEFAULT 'Offer Issued',  -- 'Offer Issued', 'NDA Signed', 'Active', 'Completed', 'Terminated'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB
);

-- Enable Row Level Security
ALTER TABLE internship_program ENABLE ROW LEVEL SECURITY;

-- Add policy cleanly without DROP keyword
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'internship_program' 
    AND policyname = 'Allow all on internship_program'
  ) THEN
    CREATE POLICY "Allow all on internship_program" ON internship_program FOR ALL USING (true);
  END IF;
END $$;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_internship_program_name ON internship_program(full_name);
CREATE INDEX IF NOT EXISTS idx_internship_program_email ON internship_program(email);
CREATE INDEX IF NOT EXISTS idx_internship_program_status ON internship_program(status);
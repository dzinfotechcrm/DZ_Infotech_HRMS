-- Migration Script for Intern Module
-- Adds `interns` table and `intern_documents` bucket with RLS policies.

CREATE TABLE interns (
  id TEXT PRIMARY KEY,
  uid UUID REFERENCES auth.users(id), -- If they log in
  full_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address JSONB, -- { line1, city, state, pincode }
  photo_url TEXT,
  department_id TEXT REFERENCES departments(id),
  position TEXT NOT NULL,
  reporting_manager_id TEXT REFERENCES employees(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_text TEXT,
  is_paid BOOLEAN DEFAULT false,
  stipend_amount NUMERIC,
  work_mode TEXT DEFAULT 'Remote',
  working_days TEXT DEFAULT 'Monday to Friday',
  working_hours TEXT,
  max_leave_per_month NUMERIC DEFAULT 5,
  offer_date DATE,
  acceptance_deadline DATE,
  nda_date DATE,
  certificate_eligible BOOLEAN DEFAULT false,
  skills_technologies TEXT, -- or an array of text
  status TEXT DEFAULT 'Active', -- 'Active', 'Completed', 'Terminated'
  login_email TEXT,
  
  -- Document URLs and Status
  offer_letter_pdf_url TEXT,
  nda_pdf_url TEXT,
  signed_offer_letter_url TEXT,
  signed_nda_url TEXT,
  document_status TEXT DEFAULT 'pending_generation', -- 'pending_generation', 'pending_signature', 'signed'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB
);

-- Enable RLS on interns
ALTER TABLE interns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interns table
DROP POLICY IF EXISTS "Admins and HR have full access to interns" ON interns;
CREATE POLICY "Admins and HR have full access to interns"
ON interns FOR ALL
USING (
  auth.uid()::text IN (
    SELECT id::text FROM users WHERE role = 'admin' OR role = 'hr'
  )
);

DROP POLICY IF EXISTS "Interns can read own row" ON interns;
CREATE POLICY "Interns can read own row"
ON interns FOR SELECT
USING (
  uid::text = auth.uid()::text 
  OR email = (auth.jwt() ->> 'email')
  OR login_email = (auth.jwt() ->> 'email')
);

DROP POLICY IF EXISTS "Interns can update own row" ON interns;
CREATE POLICY "Interns can update own row"
ON interns FOR UPDATE
USING (
  uid::text = auth.uid()::text 
  OR email = (auth.jwt() ->> 'email')
  OR login_email = (auth.jwt() ->> 'email')
);

-- Storage Setup
-- Assuming supabase storage extension is available.
-- Create the bucket for intern documents
INSERT INTO storage.buckets (id, name, public) VALUES ('intern_documents', 'intern_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for intern_documents
-- Admin has full access
DROP POLICY IF EXISTS "Admin full access to intern_documents" ON storage.objects;
CREATE POLICY "Admin full access to intern_documents" 
ON storage.objects FOR ALL 
USING (
  bucket_id = 'intern_documents' 
  AND auth.uid()::text IN (
    SELECT id::text FROM users WHERE role = 'admin' OR role = 'hr'
  )
);

-- Interns can read/write their own folder
DROP POLICY IF EXISTS "Interns can manage own documents" ON storage.objects;
CREATE POLICY "Interns can manage own documents"
ON storage.objects FOR ALL
USING (
  bucket_id = 'intern_documents'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM interns 
    WHERE uid::text = auth.uid()::text 
       OR email = (auth.jwt() ->> 'email')
       OR login_email = (auth.jwt() ->> 'email')
  )
);
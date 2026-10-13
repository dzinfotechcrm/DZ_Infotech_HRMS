-- =======================================================
-- DZ Infotech HRMS: Intern Projects Tracking Module
-- Table: intern_projects
-- Run this script in your Supabase SQL Editor
-- =======================================================

CREATE TABLE IF NOT EXISTS intern_projects (
  id TEXT PRIMARY KEY,
  intern_id TEXT,                    -- Reference to interns(id) or employees(id) (optional)
  intern_name TEXT NOT NULL,          -- Intern's full name
  intern_role TEXT NOT NULL,          -- Intern's role (e.g., Frontend Developer, Full Stack Intern)
  project_id TEXT,                    -- Reference to projects(id) (optional)
  project_name TEXT NOT NULL,         -- Project name
  mentor_id TEXT,                     -- Reference to employees(id) (optional)
  mentor_name TEXT,                   -- Mentor's name
  mentor_ids TEXT[],                  -- Array of mentor IDs (optional)
  start_date DATE NOT NULL,           -- Assignment start date
  end_date DATE,                      -- Target or completion date
  status TEXT DEFAULT 'In Progress',  -- 'Assigned', 'In Progress', 'Completed', 'On Hold'
  whatsapp_number TEXT,               -- Intern's WhatsApp phone number
  description TEXT,                   -- Project tasks, repos, or scope
  whatsapp_notes TEXT,                -- Notes shared via WhatsApp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB                          -- Extra metadata
);

-- Enable Row Level Security
ALTER TABLE intern_projects ENABLE ROW LEVEL SECURITY;

-- Development / Standard policy: allow full access for all operations
DROP POLICY IF EXISTS "Allow all on intern_projects" ON intern_projects;
CREATE POLICY "Allow all on intern_projects" ON intern_projects FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_intern_projects_intern_name ON intern_projects(intern_name);
CREATE INDEX IF NOT EXISTS idx_intern_projects_project_name ON intern_projects(project_name);
CREATE INDEX IF NOT EXISTS idx_intern_projects_status ON intern_projects(status);
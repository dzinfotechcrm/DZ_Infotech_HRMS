-- Run this script in the Supabase SQL Editor to set up the Field Sales Management System (SFMS) tables

-- 1. Teams
CREATE TABLE sfms_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  leader_id UUID, -- Will be a foreign key to sfms_agents, added later to avoid circular dependency initially
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Agents
CREATE TABLE sfms_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  city TEXT,
  joining_date DATE,
  team_id UUID REFERENCES sfms_teams(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint for team leader now that agents table exists
ALTER TABLE sfms_teams ADD CONSTRAINT fk_leader FOREIGN KEY (leader_id) REFERENCES sfms_agents(id);

-- 3. Leads
CREATE TABLE sfms_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  industry TEXT,
  lead_source TEXT,
  expected_revenue NUMERIC DEFAULT 0,
  notes TEXT,
  team_id UUID REFERENCES sfms_teams(id),
  stage TEXT DEFAULT 'Assigned' CHECK (stage IN ('Assigned', 'Contacted', 'Meeting Scheduled', 'Meeting Completed', 'Proposal Sent', 'Negotiation', 'Won', 'Lost')),
  interest_level TEXT DEFAULT 'Interested' CHECK (interest_level IN ('Very Interested', 'Interested', 'Not Interested')),
  services_interested TEXT[],
  lost_reason TEXT,
  closed_by TEXT CHECK (closed_by IN ('Team', 'Founder')),
  advance_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Meetings
CREATE TABLE sfms_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES sfms_leads(id),
  team_id UUID REFERENCES sfms_teams(id),
  meeting_date DATE,
  meeting_time TIME,
  person_met TEXT,
  designation TEXT,
  phone TEXT,
  email TEXT,
  discussion_summary TEXT,
  services_discussed TEXT[],
  quotation_amount NUMERIC DEFAULT 0,
  negotiated_amount NUMERIC DEFAULT 0,
  follow_up_date DATE,
  outcome TEXT CHECK (outcome IN ('Very Interested', 'Interested', 'Not Interested')),
  selfie_url TEXT,
  photos TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Targets
CREATE TABLE sfms_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES sfms_teams(id),
  type TEXT CHECK (type IN ('Revenue', 'Client', 'Meeting')),
  target_value NUMERIC NOT NULL,
  duration_days INTEGER NOT NULL,
  start_date DATE DEFAULT CURRENT_DATE,
  deadline DATE,
  bonus_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Commissions
CREATE TABLE sfms_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES sfms_leads(id),
  agent_id UUID REFERENCES sfms_agents(id),
  type TEXT CHECK (type IN ('Advance', 'Final')),
  amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Generated' CHECK (status IN ('Generated', 'Pending Approval', 'Approved', 'Payable', 'Paid')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Finance
CREATE TABLE sfms_finance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES sfms_leads(id),
  project_value NUMERIC DEFAULT 0,
  advance_received NUMERIC DEFAULT 0,
  remaining_amount NUMERIC DEFAULT 0,
  collected_amount NUMERIC DEFAULT 0,
  commission_liability NUMERIC DEFAULT 0,
  commission_paid NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Daily Reports
CREATE TABLE sfms_daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES sfms_teams(id),
  report_date DATE DEFAULT CURRENT_DATE,
  meetings_completed INTEGER DEFAULT 0,
  interested_leads INTEGER DEFAULT 0,
  very_interested_leads INTEGER DEFAULT 0,
  follow_ups_scheduled INTEGER DEFAULT 0,
  expected_revenue NUMERIC DEFAULT 0,
  challenges_faced TEXT,
  tomorrows_plan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Lead Timeline
CREATE TABLE sfms_lead_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES sfms_leads(id),
  stage TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by TEXT
);

-- Enable RLS
ALTER TABLE sfms_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE sfms_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sfms_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sfms_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sfms_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sfms_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sfms_finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE sfms_daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sfms_lead_timeline ENABLE ROW LEVEL SECURITY;

-- Add basic "Allow all" policies for immediate development compatibility with existing app setup
CREATE POLICY "Allow all on sfms_teams" ON sfms_teams FOR ALL USING (true);
CREATE POLICY "Allow all on sfms_agents" ON sfms_agents FOR ALL USING (true);
CREATE POLICY "Allow all on sfms_leads" ON sfms_leads FOR ALL USING (true);
CREATE POLICY "Allow all on sfms_meetings" ON sfms_meetings FOR ALL USING (true);
CREATE POLICY "Allow all on sfms_targets" ON sfms_targets FOR ALL USING (true);
CREATE POLICY "Allow all on sfms_commissions" ON sfms_commissions FOR ALL USING (true);
CREATE POLICY "Allow all on sfms_finance" ON sfms_finance FOR ALL USING (true);
CREATE POLICY "Allow all on sfms_daily_reports" ON sfms_daily_reports FOR ALL USING (true);
CREATE POLICY "Allow all on sfms_lead_timeline" ON sfms_lead_timeline FOR ALL USING (true);

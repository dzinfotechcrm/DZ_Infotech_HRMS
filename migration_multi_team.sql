-- Run this script in the Supabase SQL Editor to migrate to a many-to-many agent/team relationship

-- 1. Create the junction table
CREATE TABLE IF NOT EXISTS sfms_team_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES sfms_teams(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES sfms_agents(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, agent_id)
);

-- 2. Enable RLS
ALTER TABLE sfms_team_agents ENABLE ROW LEVEL SECURITY;

-- 3. Add policy
CREATE POLICY "Allow all on sfms_team_agents" ON sfms_team_agents FOR ALL USING (true);

-- 4. Migrate existing data from sfms_agents
INSERT INTO sfms_team_agents (team_id, agent_id)
SELECT team_id, id 
FROM sfms_agents 
WHERE team_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Note: We are keeping the team_id column in sfms_agents for backward compatibility for now.

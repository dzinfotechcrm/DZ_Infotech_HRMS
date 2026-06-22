-- Migration to add agent_id to sfms_leads
ALTER TABLE sfms_leads ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES sfms_agents(id);

-- Also allow sfms_meetings to be associated with an agent directly (if needed, but currently Meetings only has team_id).
-- Let's just do sfms_leads for now as requested.

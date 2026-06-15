-- Run this script in your Supabase SQL Editor to create the leads and clients tables

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "leadId" TEXT,
  "companyName" TEXT,
  "contactPerson" TEXT,
  "phone" TEXT,
  "whatsapp" TEXT,
  "email" TEXT,
  "address" TEXT,
  "industry" TEXT,
  "serviceInterested" TEXT,
  "expectedValue" NUMERIC,
  "leadSource" TEXT,
  "assignedTo" TEXT,
  "stage" TEXT,
  "nextFollowUp" TEXT,
  "probability" NUMERIC,
  "notes" TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "clientId" TEXT,
  "companyName" TEXT,
  "ownerId" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "gstNumber" TEXT,
  "address" TEXT,
  "industry" TEXT,
  "status" TEXT,
  "projectsCount" INT,
  "lifetimeValue" NUMERIC,
  "since" TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and grant full access (you can tighten these policies later)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on leads" ON leads FOR ALL USING (true);
CREATE POLICY "Allow all on clients" ON clients FOR ALL USING (true);

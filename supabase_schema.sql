-- Run this script in the Supabase SQL Editor

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  role TEXT DEFAULT 'employee',
  employee_id TEXT,
  employee_linked BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Employees table
CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  uid UUID REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'employee',
  department_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB
);

-- Departments table
CREATE TABLE departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB
);

-- Leave Types table
CREATE TABLE leave_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  days INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB
);

-- Holidays table
CREATE TABLE holidays (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB
);

-- Leave Requests table
CREATE TABLE leave_requests (
  id TEXT PRIMARY KEY,
  employee_id TEXT REFERENCES employees(id),
  type_id TEXT REFERENCES leave_types(id),
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending',
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB
);

-- Leave Balance table
CREATE TABLE leave_balance (
  id TEXT PRIMARY KEY,
  employee_id TEXT REFERENCES employees(id),
  balances JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance table
CREATE TABLE attendance (
  id TEXT PRIMARY KEY,
  employee_id TEXT REFERENCES employees(id),
  date DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB
);

-- Payroll table
CREATE TABLE payroll (
  id TEXT PRIMARY KEY,
  employee_id TEXT REFERENCES employees(id),
  month TEXT,
  year INT,
  basic_salary NUMERIC,
  net_salary NUMERIC,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB
);

-- Documents table
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  employee_id TEXT REFERENCES employees(id),
  title TEXT,
  file_url TEXT,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB
);

-- Activities table
CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  employee_id TEXT REFERENCES employees(id),
  type TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB
);

-- Settings table
CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security) - optional but recommended
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Note: You should add policies to allow read/write access. For a quick migration, you can bypass RLS by disabling it or writing a wide-open policy temporarily:
-- CREATE POLICY "Allow all" ON users FOR ALL USING (true);

-- Notifications table
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  type TEXT,
  title TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

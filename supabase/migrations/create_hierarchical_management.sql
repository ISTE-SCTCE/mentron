-- Migration: Hierarchical Student Management System
-- Creates proper Year → Department → Group structure with audit logging

-- =============================================================================
-- ACADEMIC YEARS TABLE (Top-level entity)
-- =============================================================================
CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,              -- 'First Year', 'Second Year', etc.
    year_number INTEGER NOT NULL UNIQUE,    -- 1, 2, 3, 4
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_academic_years_number ON academic_years(year_number);
CREATE INDEX IF NOT EXISTS idx_academic_years_active ON academic_years(is_active);

-- =============================================================================
-- DEPARTMENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,              -- 'CS', 'AC', 'CS-AAML', 'EC', etc.
    name TEXT NOT NULL,                     -- 'Computer Science', 'Applied Chemistry', etc.
    description TEXT,
    color TEXT DEFAULT '#06b6d4',
    icon TEXT DEFAULT 'folder',             -- Icon identifier for UI
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active);

-- =============================================================================
-- YEAR-DEPARTMENT MAPPING (which departments are in which years)
-- =============================================================================
CREATE TABLE IF NOT EXISTS year_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(year_id, department_id)
);

-- Indexes for faster joins
CREATE INDEX IF NOT EXISTS idx_year_departments_year ON year_departments(year_id);
CREATE INDEX IF NOT EXISTS idx_year_departments_dept ON year_departments(department_id);

-- =============================================================================
-- GROUP TRANSFERS AUDIT LOG
-- =============================================================================
CREATE TABLE IF NOT EXISTS group_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    group_name TEXT NOT NULL,
    from_year INTEGER,
    to_year INTEGER,
    from_department TEXT,
    to_department TEXT,
    student_count INTEGER DEFAULT 0,
    transferred_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    reason TEXT,
    details JSONB DEFAULT '{}',
    transferred_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_group_transfers_group ON group_transfers(group_id);
CREATE INDEX IF NOT EXISTS idx_group_transfers_date ON group_transfers(transferred_at);
CREATE INDEX IF NOT EXISTS idx_group_transfers_by ON group_transfers(transferred_by);

-- =============================================================================
-- ADD FOREIGN KEYS TO EXISTING GROUPS TABLE
-- =============================================================================
-- Add year_id and department_id columns while keeping backward compatibility
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

-- Indexes for the new foreign keys
CREATE INDEX IF NOT EXISTS idx_groups_year_id ON groups(year_id);
CREATE INDEX IF NOT EXISTS idx_groups_department_id ON groups(department_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE year_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_transfers ENABLE ROW LEVEL SECURITY;

-- Academic Years Policies
CREATE POLICY "Anyone authenticated can view years" ON academic_years
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Chairman can manage years" ON academic_years
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM admins WHERE role = 'chairman')
    );

-- Departments Policies
CREATE POLICY "Anyone authenticated can view departments" ON departments
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Chairman can manage departments" ON departments
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM admins WHERE role = 'chairman')
    );

-- Year-Departments Policies
CREATE POLICY "Anyone authenticated can view year-department mappings" ON year_departments
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Chairman can manage year-department mappings" ON year_departments
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM admins WHERE role = 'chairman')
    );

-- Group Transfers Policies (Audit log - read for admins, write for all admins)
CREATE POLICY "Admins can view transfer logs" ON group_transfers
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM admins)
    );

CREATE POLICY "Admins can create transfer logs" ON group_transfers
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM admins)
    );

-- =============================================================================
-- SEED DATA: Initial Academic Years
-- =============================================================================
INSERT INTO academic_years (name, year_number) VALUES
    ('First Year', 1),
    ('Second Year', 2),
    ('Third Year', 3),
    ('Fourth Year', 4)
ON CONFLICT (year_number) DO NOTHING;

-- =============================================================================
-- SEED DATA: Initial Departments
-- =============================================================================
INSERT INTO departments (code, name, description, color) VALUES
    ('CS', 'Computer Science', 'Department of Computer Science', '#3b82f6'),
    ('AC', 'Applied Chemistry', 'Department of Applied Chemistry', '#10b981'),
    ('CS-AAML', 'CS with AI/ML', 'Computer Science with AI and Machine Learning', '#8b5cf6'),
    ('EC', 'Electronics & Communication', 'Department of Electronics and Communication', '#f59e0b'),
    ('ME', 'Mechanical Engineering', 'Department of Mechanical Engineering', '#ef4444'),
    ('CE', 'Civil Engineering', 'Department of Civil Engineering', '#6366f1'),
    ('EE', 'Electrical Engineering', 'Department of Electrical Engineering', '#ec4899')
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- SEED DATA: Map all departments to all years by default
-- =============================================================================
INSERT INTO year_departments (year_id, department_id)
SELECT y.id, d.id 
FROM academic_years y 
CROSS JOIN departments d
ON CONFLICT (year_id, department_id) DO NOTHING;

-- =============================================================================
-- MIGRATION: Link existing groups to new hierarchy
-- =============================================================================
-- Update groups with matching year_id based on existing year column
UPDATE groups g
SET year_id = ay.id
FROM academic_years ay
WHERE g.year = ay.year_number AND g.year_id IS NULL;

-- Update groups with matching department_id based on existing department column
UPDATE groups g
SET department_id = d.id
FROM departments d
WHERE g.department = d.code AND g.department_id IS NULL;

-- For departments that don't match exactly, try matching by name
UPDATE groups g
SET department_id = d.id
FROM departments d
WHERE LOWER(g.department) LIKE LOWER('%' || d.code || '%') 
  AND g.department_id IS NULL;

-- =============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to academic_years
DROP TRIGGER IF EXISTS update_academic_years_updated_at ON academic_years;
CREATE TRIGGER update_academic_years_updated_at
    BEFORE UPDATE ON academic_years
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to departments
DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Migration: Official Department Structure
-- Creates and populates the departments table with the official college structure
-- This is a standalone migration that creates tables if they don't exist

-- =============================================================================
-- ACADEMIC YEARS TABLE (if not exists)
-- =============================================================================
CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    year_number INTEGER NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed academic years
INSERT INTO academic_years (name, year_number) VALUES
    ('First Year', 1),
    ('Second Year', 2),
    ('Third Year', 3),
    ('Fourth Year', 4)
ON CONFLICT (year_number) DO NOTHING;

-- =============================================================================
-- DEPARTMENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#06b6d4',
    icon TEXT DEFAULT 'folder',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- OFFICIAL DEPARTMENTS (6 departments as per college standards)
-- =============================================================================
-- 1. Computer Science (CS)
-- 2. Computer Science (AI & ML) (CS-AIML)
-- 3. Electronics and Communication (ECE)
-- 4. Mechanical Engineering (ME)
-- 5. Automobile Engineering (AE)
-- 6. Biotechnology (BT)

INSERT INTO departments (code, name, description, color) VALUES
    ('CS', 'Computer Science', 'Department of Computer Science', '#3b82f6'),
    ('CS-AIML', 'Computer Science (AI & ML)', 'Department of Computer Science specializing in Artificial Intelligence and Machine Learning', '#8b5cf6'),
    ('ECE', 'Electronics and Communication', 'Department of Electronics and Communication', '#f59e0b'),
    ('ME', 'Mechanical Engineering', 'Department of Mechanical Engineering', '#ef4444'),
    ('AE', 'Automobile Engineering', 'Department of Automobile Engineering', '#10b981'),
    ('BT', 'Biotechnology', 'Department of Biotechnology', '#ec4899')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    color = EXCLUDED.color;

-- =============================================================================
-- YEAR-DEPARTMENT MAPPING TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS year_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(year_id, department_id)
);

-- Map all departments to all years
INSERT INTO year_departments (year_id, department_id)
SELECT y.id, d.id 
FROM academic_years y 
CROSS JOIN departments d
ON CONFLICT (year_id, department_id) DO NOTHING;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE year_departments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone authenticated can view years" ON academic_years;
DROP POLICY IF EXISTS "Chairman can manage years" ON academic_years;
DROP POLICY IF EXISTS "Anyone authenticated can view departments" ON departments;
DROP POLICY IF EXISTS "Chairman can manage departments" ON departments;
DROP POLICY IF EXISTS "Anyone authenticated can view year-department mappings" ON year_departments;
DROP POLICY IF EXISTS "Chairman can manage year-department mappings" ON year_departments;

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

-- =============================================================================
-- ADD HIERARCHY COLUMNS TO GROUPS (if not exists)
-- =============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'year_id') THEN
        ALTER TABLE groups ADD COLUMN year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'department_id') THEN
        ALTER TABLE groups ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_groups_year_id ON groups(year_id);
CREATE INDEX IF NOT EXISTS idx_groups_department_id ON groups(department_id);
CREATE INDEX IF NOT EXISTS idx_academic_years_number ON academic_years(year_number);
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
CREATE INDEX IF NOT EXISTS idx_year_departments_year ON year_departments(year_id);
CREATE INDEX IF NOT EXISTS idx_year_departments_dept ON year_departments(department_id);

-- Migration: Fix Student Assignment History (Create Table + RLS)
-- This migration ensures the table exists AND has the correct permissions.

-- 1. Create the table if it doesn't exist (Missing in your DB)
CREATE TABLE IF NOT EXISTS student_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
    student_email TEXT NOT NULL,
    from_group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    from_group_name TEXT,
    to_group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    to_group_name TEXT,
    from_year INTEGER,
    to_year INTEGER,
    from_department TEXT,
    to_department TEXT,
    assigned_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    assigned_by_email TEXT,
    reason TEXT,
    assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_assignments_student ON student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_date ON student_assignments(assigned_at);
CREATE INDEX IF NOT EXISTS idx_student_assignments_by ON student_assignments(assigned_by);

-- 3. Enable RLS (Row Level Security)
ALTER TABLE student_assignments ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to prevent conflicts (clean slate)
DROP POLICY IF EXISTS "Admins can view assignment logs" ON student_assignments;
DROP POLICY IF EXISTS "Admins can create assignment logs" ON student_assignments;
DROP POLICY IF EXISTS "Students can view own assignments" ON student_assignments;
DROP POLICY IF EXISTS "Admins can insert assignments" ON student_assignments;
DROP POLICY IF EXISTS "Admins can view assignments" ON student_assignments;

-- 5. Re-create Policies

-- Policy: Admins can view all assignment history
CREATE POLICY "Admins can view assignment logs" ON student_assignments
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM admins)
    );

-- Policy: Admins can create (insert) assignment history logs
CREATE POLICY "Admins can create assignment logs" ON student_assignments
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM admins)
    );

-- Policy: Students can view their own assignment history
CREATE POLICY "Students can view own assignments" ON student_assignments
    FOR SELECT USING (
        auth.uid() = student_id
    );

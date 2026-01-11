-- Migration: Student Assignment Audit System
-- Tracks all student group assignments for audit purposes

-- =============================================================================
-- STUDENT ASSIGNMENTS AUDIT TABLE
-- =============================================================================
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

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_student_assignments_student ON student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_date ON student_assignments(assigned_at);
CREATE INDEX IF NOT EXISTS idx_student_assignments_by ON student_assignments(assigned_by);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE student_assignments ENABLE ROW LEVEL SECURITY;

-- Admins can view all assignment logs
CREATE POLICY "Admins can view assignment logs" ON student_assignments
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM admins)
    );

-- Admins can create assignment logs
CREATE POLICY "Admins can create assignment logs" ON student_assignments
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM admins)
    );

-- Students can view their own assignment history
CREATE POLICY "Students can view own assignments" ON student_assignments
    FOR SELECT USING (
        auth.uid() = student_id
    );

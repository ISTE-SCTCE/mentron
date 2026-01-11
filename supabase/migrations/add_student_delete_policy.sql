-- Add DELETE policy for group_members table
-- Only Chairman and Vice Chair can delete students

-- Drop existing delete policies if they exist
DROP POLICY IF EXISTS "Chairman can delete students" ON group_members;
DROP POLICY IF EXISTS "Admins can delete students from their department" ON group_members;
DROP POLICY IF EXISTS "Admins can delete students" ON group_members;

-- Create policy allowing only Chairman and Vice Chair to delete students
CREATE POLICY "Admins can delete students" ON group_members
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE admins.id = auth.uid()
            AND admins.is_active = true
            AND (
                admins.role = 'chairman' 
                OR admins.position = 'Vice Chair'
            )
        )
    );

-- Note: This migration needs to be run in Supabase SQL Editor or via CLI
-- The policy allows:
-- 1. Chairman can delete ANY student
-- 2. Vice Chair can delete ANY student
-- 3. Other execom members CANNOT delete students

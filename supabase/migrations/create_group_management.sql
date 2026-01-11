-- Migration: Enhance groups table for custom group management
-- This migration adds support for custom groups beyond department+year combinations

-- Add new columns to groups table
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#06b6d4';

-- Drop the existing unique constraint on (department, year)
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_department_year_key;

-- Create a partial unique index for default groups only
-- This ensures only one default group per department+year, but allows multiple custom groups
CREATE UNIQUE INDEX IF NOT EXISTS groups_default_dept_year_unique 
ON groups(department, year) 
WHERE is_default = TRUE;

-- Add index for created_by for faster lookups
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can update group assignments" ON group_members;
DROP POLICY IF EXISTS "Admins can delete their own groups" ON groups;
DROP POLICY IF EXISTS "Admins can update their own groups" ON groups;

-- Add RLS policy for admins to update group assignments
CREATE POLICY "Admins can update group assignments" ON group_members
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM admins)
  );

-- Add RLS policy for admins to delete groups they created
CREATE POLICY "Admins can delete their own groups" ON groups
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM admins 
      WHERE id = groups.created_by OR role = 'chairman'
    )
  );

-- Add RLS policy for admins to update groups they created
CREATE POLICY "Admins can update their own groups" ON groups
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM admins 
      WHERE id = groups.created_by OR role = 'chairman'
    )
  );

-- Update existing groups to be marked as default
UPDATE groups SET is_default = TRUE WHERE is_default IS NULL OR is_default = FALSE;

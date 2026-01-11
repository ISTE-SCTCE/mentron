-- Migration: Fix RLS policies for groups table
-- The existing policies have conflicts - "Admins can update their own groups" restricts updates to creators only
-- This migration fixes the policies to allow all admins to manage groups

-- Drop the restrictive update policies that conflict with the general admin policy
DROP POLICY IF EXISTS "Admins can update their own groups" ON groups;
DROP POLICY IF EXISTS "Admins can delete their own groups" ON groups;

-- The "Admins can manage groups" policy (FOR ALL) already exists in schema.sql
-- But let's ensure it's there and working properly
DROP POLICY IF EXISTS "Admins can manage groups" ON groups;

-- Recreate a comprehensive admin policy for groups
CREATE POLICY "Admins can manage all groups" ON groups
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM admins)
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM admins)
  );

-- Ensure the select policy exists for all authenticated users
DROP POLICY IF EXISTS "Anyone authenticated can view groups" ON groups;
CREATE POLICY "Anyone authenticated can view groups" ON groups
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Also ensure group_members policies are correct for transfers
DROP POLICY IF EXISTS "Admins can manage group members" ON group_members;
CREATE POLICY "Admins can manage group members" ON group_members
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM admins)
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM admins)
  );

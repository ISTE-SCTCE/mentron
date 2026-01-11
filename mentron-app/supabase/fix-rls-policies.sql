-- IMPORTANT: Run this in Supabase SQL Editor to fix the infinite recursion error
-- This script drops the problematic RLS policies and creates new ones that don't self-reference

-- Drop all existing policies on admins table
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Chairman can manage admins" ON admins;
DROP POLICY IF EXISTS "Admins can manage groups" ON groups;
DROP POLICY IF EXISTS "Admins can view group members" ON group_members;
DROP POLICY IF EXISTS "Admins can manage materials in their department" ON materials;
DROP POLICY IF EXISTS "Admins with analytics can view all views" ON material_views;

-- Create new, non-recursive policies for admins table
-- Allow all authenticated users to read their own admin record
CREATE POLICY "Users can view their own admin profile" ON admins
  FOR SELECT USING (auth.uid() = id);

-- Allow all authenticated users to read all admin records (needed for role checking)
CREATE POLICY "Authenticated users can view all admins" ON admins
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only allow inserts/updates/deletes via service role (done through scripts)
-- No INSERT/UPDATE/DELETE policies for regular users

-- Recreate groups policies without admin table reference
CREATE POLICY "Authenticated users can view groups" ON groups
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Recreate group_members policies
CREATE POLICY "Admins can view all group members" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

-- Recreate materials policies
CREATE POLICY "Admins can manage all materials" ON materials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

-- Recreate material_views policies
CREATE POLICY "Admins can view all material views" ON material_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

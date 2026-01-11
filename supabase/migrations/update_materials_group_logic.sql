-- Migration: Add group support to materials and restrict access
-- 1. Add group_id to materials table
ALTER TABLE materials 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

-- 2. Make department and file_type nullable
ALTER TABLE materials ALTER COLUMN department DROP NOT NULL;
ALTER TABLE materials ALTER COLUMN file_type DROP NOT NULL;

-- 3. Update Material Policies

-- Drop existing broad read policy
DROP POLICY IF EXISTS "View Materials" ON materials;

-- Create new restrictive read policy
CREATE POLICY "View Group Materials" ON materials
    FOR SELECT
    USING (
        -- Admins can see all materials
        (auth.uid() IN (SELECT id FROM admins)) OR
        -- Users can see materials if they belong to the group
        (EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = materials.group_id 
            AND group_members.id = auth.uid()
        ))
    );

-- Ensure admins can still manage materials (existing policy might need check)
-- "Admin Manage Materials" used `admins` table check. That should still hold.

-- 4. Storage Policies
-- We are keeping the bucket public for now to avoid breaking existing links, 
-- but we rely on the materials table RLS to hide the links from unauthorized users.
-- If strict storage security is needed, we would disable public bucket and use signed URLs.

-- Add name and roll_number columns to group_members table
ALTER TABLE group_members 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS roll_number TEXT;

-- Create an index for roll_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_group_members_roll_number ON group_members(roll_number);

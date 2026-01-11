-- Add notification preference columns to admins table
-- Run this migration to enable notification preferences in settings

ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS desktop_notifications BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN admins.email_notifications IS 'Whether user wants to receive email notifications for announcements';
COMMENT ON COLUMN admins.desktop_notifications IS 'Whether user wants browser push notifications';

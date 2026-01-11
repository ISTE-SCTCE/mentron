-- IMPORTANT: This script creates admin users with TEMPORARY passwords
-- Admins should change their passwords on first login

-- First, we need to create auth users using Supabase's auth.users table
-- Then link them to the admins table

-- NOTE: In production, you should use Supabase Dashboard to create users
-- This is a development/testing script only

-- For now, we'll just create the admin profiles
-- You'll need to create the auth users manually in Supabase Dashboard first

-- Insert Chairman
INSERT INTO admins (id, email, role, department, position, can_view_analytics, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'aadithyanrs9e@gmail.com'),
  'aadithyanrs9e@gmail.com',
  'chairman',
  'ECE',
  'Chairman',
  TRUE,
  TRUE
) ON CONFLICT (email) DO UPDATE
SET role = 'chairman', can_view_analytics = TRUE, is_active = TRUE;

-- Insert Execom Members
INSERT INTO admins (id, email, role, department, position, can_view_analytics, is_active)
VALUES
  -- Vice Chair
  (
    (SELECT id FROM auth.users WHERE email = 'archasunil777@gmail.com'),
    'archasunil777@gmail.com',
    'execom',
    'ECE',
    'Vice Chair',
    FALSE,
    TRUE
  ),
  -- Secretary
  (
    (SELECT id FROM auth.users WHERE email = 'amantejas05@gmail.com'),
    'amantejas05@gmail.com',
    'execom',
    'ECE',
    'Secretary',
    FALSE,
    TRUE
  ),
  -- Joint Secretary
  (
    (SELECT id FROM auth.users WHERE email = 'nehasanjeevkrishna@gmail.com'),
    'nehasanjeevkrishna@gmail.com',
    'execom',
    'ECE',
    'Joint Secretary',
    FALSE,
    TRUE
  ),
  -- Treasurer
  (
    (SELECT id FROM auth.users WHERE email = 'abhirammanoj13@gmail.com'),
    'abhirammanoj13@gmail.com',
    'execom',
    'ECE',
    'Treasurer',
    FALSE,
    TRUE
  ),
  -- Sub-Treasurer
  (
    (SELECT id FROM auth.users WHERE email = 'aryashibu73@gmail.com'),
    'aryashibu73@gmail.com',
    'execom',
    'ECE',
    'Sub-Treasurer',
    FALSE,
    TRUE
  ),
  -- Technical Head
  (
    (SELECT id FROM auth.users WHERE email = 'anjanapradeep512@gmail.com'),
    'anjanapradeep512@gmail.com',
    'execom',
    'CSE',
    'Technical Head',
    FALSE,
    TRUE
  ),
  -- Media Head
  (
    (SELECT id FROM auth.users WHERE email = 'aabhinavbr@gmail.com'),
    'aabhinavbr@gmail.com',
    'execom',
    'ECE',
    'Media Head',
    FALSE,
    TRUE
  ),
  -- Marketing Head
  (
    (SELECT id FROM auth.users WHERE email = 'hareeshms6665@gmail.com'),
    'hareeshms6665@gmail.com',
    'execom',
    'ECE',
    'Marketing Head',
    FALSE,
    TRUE
  ),
  -- Chairman SWAS
  (
    (SELECT id FROM auth.users WHERE email = 'unnikrishnan44013au@gmail.com'),
    'unnikrishnan44013au@gmail.com',
    'execom',
    'ECE',
    'Chairman SWAS',
    FALSE,
    TRUE
  ),
  -- Secretary SWAS
  (
    (SELECT id FROM auth.users WHERE email = 'abhiraminair0406@gmail.com'),
    'abhiraminair0406@gmail.com',
    'execom',
    'ECE',
    'Secretary SWAS',
    FALSE,
    TRUE
  )
ON CONFLICT (email) DO UPDATE
SET is_active = TRUE;

-- Note: Design Head, Activity Coordinator, and Membership Drive Head
-- are excluded because they don't have email addresses yet

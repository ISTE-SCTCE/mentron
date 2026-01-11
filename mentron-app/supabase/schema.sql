-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admins table (Chairman + Execom)
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('chairman', 'execom')),
  department TEXT NOT NULL,
  position TEXT,
  can_view_analytics BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups table (Year + Department combinations)
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1 AND year <= 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(department, year)
);

-- Group Members table (Students)
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1 AND year <= 4),
  group_id UUID REFERENCES groups(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Materials table
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  department TEXT NOT NULL,
  year INTEGER CHECK (year >= 1 AND year <= 4),
  uploaded_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Material Views table (Analytics)
CREATE TABLE IF NOT EXISTS material_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_department ON admins(department);
CREATE INDEX IF NOT EXISTS idx_group_members_email ON group_members(email);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_materials_department ON materials(department);
CREATE INDEX IF NOT EXISTS idx_materials_year ON materials(year);
CREATE INDEX IF NOT EXISTS idx_material_views_material ON material_views(material_id);
CREATE INDEX IF NOT EXISTS idx_material_views_user ON material_views(user_id);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_views ENABLE ROW LEVEL SECURITY;

-- Admins policies
CREATE POLICY "Admins can view all admins" ON admins
  FOR SELECT USING (auth.uid() IN (SELECT id FROM admins));

CREATE POLICY "Chairman can manage admins" ON admins
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM admins WHERE role = 'chairman')
  );

-- Groups policies
CREATE POLICY "Anyone authenticated can view groups" ON groups
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage groups" ON groups
  FOR ALL USING (auth.uid() IN (SELECT id FROM admins));

-- Group members policies
CREATE POLICY "Students can view their own profile" ON group_members
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view group members" ON group_members
  FOR SELECT USING (auth.uid() IN (SELECT id FROM admins));

CREATE POLICY "Students can insert their own profile" ON group_members
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Students can update their own profile" ON group_members
  FOR UPDATE USING (auth.uid() = id);

-- Materials policies
CREATE POLICY "Anyone authenticated can view materials" ON materials
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage materials in their department" ON materials
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM admins 
      WHERE department = materials.department OR role = 'chairman'
    )
  );

-- Material views policies
CREATE POLICY "Users can view their own views" ON material_views
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own views" ON material_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins with analytics can view all views" ON material_views
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM admins WHERE can_view_analytics = TRUE OR role = 'chairman'
    )
  );

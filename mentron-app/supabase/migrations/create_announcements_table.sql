-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
    created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    target_department TEXT,
    target_year INTEGER CHECK (target_year >= 1 AND target_year <= 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email_sent BOOLEAN DEFAULT FALSE,
    recipients_count INTEGER DEFAULT 0
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON announcements(created_by);
CREATE INDEX IF NOT EXISTS idx_announcements_target ON announcements(target_department, target_year);

-- Enable Row Level Security
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read announcements
CREATE POLICY "Anyone can read announcements"
    ON announcements
    FOR SELECT
    USING (true);

-- Policy: Only admins can create announcements
CREATE POLICY "Only admins can create announcements"
    ON announcements
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins
            WHERE admins.id = auth.uid()
        )
    );

-- Policy: Only creators can update their announcements
CREATE POLICY "Only creators can update their announcements"
    ON announcements
    FOR UPDATE
    USING (created_by = auth.uid());

-- Policy: Only creators or chairman can delete announcements
CREATE POLICY "Only creators or chairman can delete announcements"
    ON announcements
    FOR DELETE
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM admins
            WHERE admins.id = auth.uid()
            AND admins.role = 'chairman'
        )
    );

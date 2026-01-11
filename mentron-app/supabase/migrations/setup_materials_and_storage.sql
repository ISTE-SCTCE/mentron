    -- Create Materials Table
    CREATE TABLE IF NOT EXISTS public.materials (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        file_url TEXT NOT NULL,
        file_path TEXT NOT NULL, -- Storage path for deletion
        file_type TEXT NOT NULL, -- PDF, DOC, VIDEO, etc.
        department TEXT NOT NULL,
        year TEXT, -- '1', '2', '3', '4'
        uploaded_by UUID REFERENCES auth.users(id),
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- RLS for Materials Table
    ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

    -- Everyone can view materials (students + admins)
    CREATE POLICY "View Materials" ON public.materials
        FOR SELECT
        USING (true);

    -- Only Admins (Execom/Chairman) can insert/update/delete
    -- Note: Assuming 'admins' table check or role check. 
    -- For simplicity, allowing any authenticated user who is an admin.
    CREATE POLICY "Admin Manage Materials" ON public.materials
        FOR ALL
        USING (
            exists (
                select 1 from public.admins 
                where admins.id = auth.uid() 
                and admins.is_active = true
            )
        );

    -- Create Storage Bucket 'materials'
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('materials', 'materials', true)
    ON CONFLICT (id) DO NOTHING;

    -- Storage Policies
    -- Public Read
    CREATE POLICY "Public Read Materials" ON storage.objects
        FOR SELECT
        USING ( bucket_id = 'materials' );

    -- Admin Upload
    CREATE POLICY "Admin Upload Materials" ON storage.objects
        FOR INSERT
        WITH CHECK (
            bucket_id = 'materials' 
            AND auth.role() = 'authenticated'
            AND exists (
                select 1 from public.admins 
                where admins.id = auth.uid()
            )
        );

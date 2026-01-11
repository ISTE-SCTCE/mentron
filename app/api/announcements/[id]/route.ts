import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // Verify authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is execom or chairman
        const { data: admin } = await supabase
            .from('admins')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get announcement details before deleting (for audit log)
        const { data: announcement, error: fetchError } = await supabase
            .from('announcements')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !announcement) {
            return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
        }

        // Perform delete
        // RLS policy "Only creators or chairman can delete announcements" will handle permission checks at the row level
        const { error: deleteError } = await supabase
            .from('announcements')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Delete announcement error:', deleteError);
            return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
        }

        // Log the action
        await supabase.from('audit_logs').insert({
            action: 'DELETE_ANNOUNCEMENT',
            actor_id: user.id,
            actor_email: user.email,
            target_id: id,
            details: {
                title: announcement.title,
                message: announcement.message,
                deleted_at: new Date().toISOString()
            },
            ip_address: '0.0.0.0' // Placeholder as we can't easily get IP in this context without headers
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Announcement DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

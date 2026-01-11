import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/notifications
export async function GET() {
    const supabase = await createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('read', { ascending: true })
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        const { count: unreadCount, error: countError } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('read', false);

        if (countError) console.error('Error fetching unread count:', countError);

        return NextResponse.json({ notifications, unreadCount });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

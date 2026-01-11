import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/notifications/announce
export async function POST(request: Request) {
    const supabase = await createClient();

    try {
        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: admin } = await supabase
            .from('admins')
            .select('id, role, position')
            .eq('id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Only admins can create announcements' }, { status: 403 });
        }

        const body = await request.json();
        const { title, message, target_audience } = body;

        // Get all users to notify based on target audience
        let targetUsers: string[] = [];

        if (target_audience === 'all') {
            // Get all students
            const { data: students } = await supabase
                .from('group_members')
                .select('id');

            // Get all admins
            const { data: admins } = await supabase
                .from('admins')
                .select('id');

            targetUsers = [
                ...(students?.map(s => s.id) || []),
                ...(admins?.map(a => a.id) || [])
            ];
        } else if (target_audience === 'students') {
            const { data: students } = await supabase
                .from('group_members')
                .select('id');
            targetUsers = students?.map(s => s.id) || [];
        } else if (target_audience === 'admins') {
            const { data: admins } = await supabase
                .from('admins')
                .select('id');
            targetUsers = admins?.map(a => a.id) || [];
        }

        // Create notifications for all target users
        const notifications = targetUsers.map(userId => ({
            user_id: userId,
            type: 'admin',
            title: `📢 ${title}`,
            message: `${message}\n\n— ${admin.position || 'Admin'}`,
            read: false,
        }));

        const { error } = await supabase
            .from('notifications')
            .insert(notifications);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            notified: targetUsers.length
        }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

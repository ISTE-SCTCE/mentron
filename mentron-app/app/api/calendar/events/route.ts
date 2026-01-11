import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/calendar/events?month=2025-01
export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // Format: YYYY-MM

    try {
        let query = supabase
            .from('calendar_events')
            .select('*')
            .order('event_date', { ascending: true });

        // Filter by month if provided
        if (month) {
            const startDate = `${month}-01`;
            const endDate = new Date(month + '-01');
            endDate.setMonth(endDate.getMonth() + 1);
            const endDateStr = endDate.toISOString().split('T')[0];

            query = query
                .gte('event_date', startDate)
                .lt('event_date', endDateStr);
        }

        const { data: events, error } = await query;

        if (error) throw error;

        return NextResponse.json({ events });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// POST /api/calendar/events
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
            .select('id, role')
            .eq('id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Only admins can create events' }, { status: 403 });
        }

        const body = await request.json();
        const { title, description, event_date, event_time, event_type, department, year } = body;

        const { data: event, error } = await supabase
            .from('calendar_events')
            .insert({
                title,
                description,
                event_date,
                event_time,
                event_type,
                department,
                year,
                created_by: user.id,
            })
            .select()
            .single();

        if (error) throw error;

        // Create notifications for relevant users
        // Query students based on department and year
        let studentQuery = supabase
            .from('group_members')
            .select('id');

        if (department) {
            studentQuery = studentQuery.eq('department', department);
        }
        if (year) {
            studentQuery = studentQuery.eq('year', year);
        }

        const { data: targetStudents } = await studentQuery;

        if (targetStudents && targetStudents.length > 0) {
            const notifications = targetStudents.map(student => ({
                user_id: student.id,
                type: 'event',
                title: 'New Event Scheduled',
                message: `Event Scheduled: ${title} on ${event_date}`,
                read: false,
                created_at: new Date().toISOString(),
                // Optional: valid link to calendar? action_url: '/calendar'
            }));

            const { error: notifyError } = await supabase
                .from('notifications')
                .insert(notifications);

            if (notifyError) {
                console.error('Failed to create notifications:', notifyError);
            }
        }

        return NextResponse.json({ event }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

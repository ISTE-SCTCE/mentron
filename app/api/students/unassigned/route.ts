import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Fetch unassigned students (group_id IS NULL)
export async function GET(request: Request) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: admin } = await supabase
            .from('admins')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Parse query params
        const { searchParams } = new URL(request.url);
        const department = searchParams.get('department');
        const year = searchParams.get('year');

        // Fetch unassigned students
        let query = supabase
            .from('group_members')
            .select('*')
            .is('group_id', null)
            .order('created_at', { ascending: false });

        // Apply filters
        if (department) {
            query = query.eq('department', department);
        }
        if (year) {
            query = query.eq('year', parseInt(year));
        }

        // Execom can only see students in their department
        if (admin.role === 'execom') {
            query = query.eq('department', admin.department);
        }

        const { data: students, error } = await query;

        if (error) throw error;

        // Get count of total unassigned
        const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .is('group_id', null);

        return NextResponse.json({
            students,
            count: students?.length || 0,
            totalUnassigned: count || 0
        });
    } catch (error: unknown) {
        console.error('Error fetching unassigned students:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

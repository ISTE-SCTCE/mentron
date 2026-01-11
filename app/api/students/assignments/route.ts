import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Fetch assignment history/audit logs
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
        const studentId = searchParams.get('studentId');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = supabase
            .from('student_assignments')
            .select('*')
            .order('assigned_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Filter by student if specified
        if (studentId) {
            query = query.eq('student_id', studentId);
        }

        // Execom can only see assignments in their department
        if (admin.role === 'execom') {
            query = query.or(`from_department.eq.${admin.department},to_department.eq.${admin.department}`);
        }

        const { data: assignments, error } = await query;

        if (error) throw error;

        return NextResponse.json({ assignments });
    } catch (error: unknown) {
        console.error('Error fetching assignment history:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

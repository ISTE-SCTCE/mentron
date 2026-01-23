import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Fetch all students with group information
export async function GET() {
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

        // Fetch students with group information
        const query = supabase
            .from('group_members')
            .select(`
                *,
                group:groups(*)
            `)
            .order('created_at', { ascending: false });

        // Execom can now see all students (previously filtered by department)
        // if (admin.role === 'execom') {
        //     query = query.eq('department', admin.department);
        // }

        const { data: students, error } = await query;

        if (error) throw error;

        return NextResponse.json({ students });
    } catch (error: any) {
        console.error('Error fetching students:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

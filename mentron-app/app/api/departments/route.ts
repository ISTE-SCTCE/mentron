import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Fetch all departments
export async function GET(request: Request) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check for optional year filter
        const { searchParams } = new URL(request.url);
        const yearId = searchParams.get('yearId');

        let query = supabase
            .from('departments')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true });

        // If yearId is provided, filter to departments in that year
        if (yearId) {
            const { data: yearDepts } = await supabase
                .from('year_departments')
                .select('department_id')
                .eq('year_id', yearId);

            if (yearDepts && yearDepts.length > 0) {
                const deptIds = yearDepts.map(yd => yd.department_id);
                query = query.in('id', deptIds);
            }
        }

        const { data: departments, error } = await query;

        if (error) throw error;

        return NextResponse.json({ departments });
    } catch (error: unknown) {
        console.error('Error fetching departments:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// POST - Create new department (Chairman only)
export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is chairman
        const { data: admin } = await supabase
            .from('admins')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!admin || admin.role !== 'chairman') {
            return NextResponse.json({ error: 'Only Chairman can create departments' }, { status: 403 });
        }

        const body = await request.json();
        const { code, name, description, color, icon, is_active = true, year_ids = [] } = body;

        if (!code || !name) {
            return NextResponse.json(
                { error: 'Code and name are required' },
                { status: 400 }
            );
        }

        // Create the department
        const { data: newDept, error: deptError } = await supabase
            .from('departments')
            .insert({
                code: code.toUpperCase(),
                name,
                description,
                color: color || '#06b6d4',
                icon: icon || 'folder',
                is_active
            })
            .select()
            .single();

        if (deptError) {
            if (deptError.code === '23505') { // Unique violation
                return NextResponse.json(
                    { error: 'A department with this code already exists' },
                    { status: 409 }
                );
            }
            throw deptError;
        }

        // If year_ids provided, create mappings
        if (year_ids.length > 0) {
            const yearDeptMappings = year_ids.map((yearId: string) => ({
                year_id: yearId,
                department_id: newDept.id
            }));

            await supabase
                .from('year_departments')
                .insert(yearDeptMappings);
        }

        return NextResponse.json({ department: newDept }, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating department:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

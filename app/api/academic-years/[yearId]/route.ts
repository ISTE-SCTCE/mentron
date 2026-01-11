import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{ yearId: string }>;
}

// GET - Get academic year with its departments
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { yearId } = await params;
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch the academic year with its departments
        const { data: year, error: yearError } = await supabase
            .from('academic_years')
            .select('*')
            .eq('id', yearId)
            .single();

        if (yearError || !year) {
            return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });
        }

        // Fetch departments for this year
        const { data: yearDepartments, error: deptError } = await supabase
            .from('year_departments')
            .select(`
                id,
                department:departments(*)
            `)
            .eq('year_id', yearId);

        if (deptError) throw deptError;

        // Fetch groups for this year
        const { data: groups, error: groupError } = await supabase
            .from('groups')
            .select(`
                *,
                member_count:group_members(count)
            `)
            .eq('year', year.year_number);

        if (groupError) throw groupError;

        const groupsWithCounts = groups?.map(g => ({
            ...g,
            member_count: g.member_count?.[0]?.count || 0
        }));

        return NextResponse.json({
            year,
            departments: yearDepartments?.map(yd => yd.department) || [],
            groups: groupsWithCounts || []
        });
    } catch (error: unknown) {
        console.error('Error fetching academic year:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// PATCH - Update academic year (Chairman only)
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { yearId } = await params;
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
            return NextResponse.json({ error: 'Only Chairman can update academic years' }, { status: 403 });
        }

        const body = await request.json();
        const { name, is_active } = body;

        const updateData: Record<string, unknown> = {};
        if (name !== undefined) updateData.name = name;
        if (is_active !== undefined) updateData.is_active = is_active;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
        }

        const { data: updatedYear, error } = await supabase
            .from('academic_years')
            .update(updateData)
            .eq('id', yearId)
            .select()
            .single();

        if (error) throw error;

        if (!updatedYear) {
            return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });
        }

        return NextResponse.json({ year: updatedYear });
    } catch (error: unknown) {
        console.error('Error updating academic year:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// DELETE - Delete academic year (Chairman only)
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { yearId } = await params;
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
            return NextResponse.json({ error: 'Only Chairman can delete academic years' }, { status: 403 });
        }

        // Check if there are any groups in this year
        const { data: year } = await supabase
            .from('academic_years')
            .select('year_number')
            .eq('id', yearId)
            .single();

        if (year) {
            const { count } = await supabase
                .from('groups')
                .select('*', { count: 'exact', head: true })
                .eq('year', year.year_number);

            if (count && count > 0) {
                return NextResponse.json(
                    { error: `Cannot delete year with ${count} active groups. Move or delete groups first.` },
                    { status: 400 }
                );
            }
        }

        const { error } = await supabase
            .from('academic_years')
            .delete()
            .eq('id', yearId);

        if (error) throw error;

        return NextResponse.json({ message: 'Academic year deleted successfully' });
    } catch (error: unknown) {
        console.error('Error deleting academic year:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{ deptId: string }>;
}

// GET - Get department with its groups
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { deptId } = await params;
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch the department
        const { data: department, error: deptError } = await supabase
            .from('departments')
            .select('*')
            .eq('id', deptId)
            .single();

        if (deptError || !department) {
            return NextResponse.json({ error: 'Department not found' }, { status: 404 });
        }

        // Fetch years this department is in
        const { data: yearMappings } = await supabase
            .from('year_departments')
            .select(`
                id,
                year:academic_years(*)
            `)
            .eq('department_id', deptId);

        // Fetch groups in this department
        const { data: groups, error: groupError } = await supabase
            .from('groups')
            .select(`
                *,
                member_count:group_members(count)
            `)
            .eq('department', department.code);

        if (groupError) throw groupError;

        const groupsWithCounts = groups?.map(g => ({
            ...g,
            member_count: g.member_count?.[0]?.count || 0
        }));

        return NextResponse.json({
            department,
            years: yearMappings?.map(ym => ym.year) || [],
            groups: groupsWithCounts || []
        });
    } catch (error: unknown) {
        console.error('Error fetching department:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// PATCH - Update department (Chairman only)
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { deptId } = await params;
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
            return NextResponse.json({ error: 'Only Chairman can update departments' }, { status: 403 });
        }

        const body = await request.json();
        const { name, description, color, icon, is_active, year_ids } = body;

        const updateData: Record<string, unknown> = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (color !== undefined) updateData.color = color;
        if (icon !== undefined) updateData.icon = icon;
        if (is_active !== undefined) updateData.is_active = is_active;

        // Update department if there's data to update
        if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
                .from('departments')
                .update(updateData)
                .eq('id', deptId);

            if (updateError) throw updateError;
        }

        // Update year mappings if provided
        if (year_ids !== undefined) {
            // Delete existing mappings
            await supabase
                .from('year_departments')
                .delete()
                .eq('department_id', deptId);

            // Insert new mappings
            if (year_ids.length > 0) {
                const yearDeptMappings = year_ids.map((yearId: string) => ({
                    year_id: yearId,
                    department_id: deptId
                }));

                await supabase
                    .from('year_departments')
                    .insert(yearDeptMappings);
            }
        }

        // Fetch updated department
        const { data: updatedDept } = await supabase
            .from('departments')
            .select('*')
            .eq('id', deptId)
            .single();

        return NextResponse.json({ department: updatedDept });
    } catch (error: unknown) {
        console.error('Error updating department:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// DELETE - Delete department (Chairman only)
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { deptId } = await params;
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
            return NextResponse.json({ error: 'Only Chairman can delete departments' }, { status: 403 });
        }

        // Check if there are any groups in this department
        const { data: department } = await supabase
            .from('departments')
            .select('code')
            .eq('id', deptId)
            .single();

        if (department) {
            const { count } = await supabase
                .from('groups')
                .select('*', { count: 'exact', head: true })
                .eq('department', department.code);

            if (count && count > 0) {
                return NextResponse.json(
                    { error: `Cannot delete department with ${count} active groups. Move or delete groups first.` },
                    { status: 400 }
                );
            }
        }

        // Delete year mappings first
        await supabase
            .from('year_departments')
            .delete()
            .eq('department_id', deptId);

        // Delete the department
        const { error } = await supabase
            .from('departments')
            .delete()
            .eq('id', deptId);

        if (error) throw error;

        return NextResponse.json({ message: 'Department deleted successfully' });
    } catch (error: unknown) {
        console.error('Error deleting department:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
